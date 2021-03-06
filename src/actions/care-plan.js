import { get, put, post } from '../helpers/api';
import { discardAuthToken } from '../actions/auth';
import { getObservationCodingDisplay } from '../helpers/observation-helpers';
import { buildCarePlan } from '../helpers/care-plan-builder';
import CarePlanCategories from '../constants/care-plan-categories';

export const INVALIDATE_CAREPLAN = 'INVALIDATE_CAREPLAN';
export const REQUEST_CAREPLAN = 'REQUEST_CAREPLAN';
export const RECEIVE_CAREPLAN = 'RECEIVE_CAREPLAN';
export const COMPLETE_SAVE_CAREPLAN = 'COMPLETE_SAVE_CAREPLAN';
export const REQUEST_CAREPLAN_HISTORY = 'REQUEST_CAREPLAN_HISTORY';
export const RECEIVE_CAREPLAN_HISTORY = 'RECEIVE_CAREPLAN_HISTORY';

export function invalidateCarePlan(patientId) {
  return {
    type: INVALIDATE_CAREPLAN,
    patientId,
  };
}

function requestCarePlan(patientId) {
  return {
    type: REQUEST_CAREPLAN,
    patientId,
  };
}

function receiveCarePlan(patientId, json) {
  return {
    type: RECEIVE_CAREPLAN,
    patientId,
    data: json,
    receivedAt: Date.now(),
  };
}

function requestCarePlanHistory(carePlanId) {
  return {
    type: REQUEST_CAREPLAN_HISTORY,
    carePlanId,
  };
}

function receiveCarePlanHistory(carePlanId, json) {
  return {
    type: RECEIVE_CAREPLAN_HISTORY,
    carePlanId,
    data: json,
    receivedAt: Date.now(),
  };
}

function completeSaveCarePlan(saveCompleted, error) {
  return {
    type: COMPLETE_SAVE_CAREPLAN,
    saveCompleted,
    error,
  };
}

export function fetchCarePlanHistory(carePlanId) {
  return (dispatch, getState) => {
    const { token, expiration, useXAuthTokenHeader } = getState().auth;
    const { authenticate, fhirUrl } = getState().settings;

    if (authenticate && (!token || (expiration && new Date().valueOf() > expiration.valueOf()))) {
      return dispatch(discardAuthToken());
    }

    dispatch(requestCarePlanHistory(carePlanId));
    const url = `${fhirUrl}/CarePlan/${carePlanId}/_history`;
    return get(url, token, useXAuthTokenHeader)
      .then(response => response.json())
      .then(json => dispatch(receiveCarePlanHistory(carePlanId, json)));
  };
}

function shouldFetchCarePlan(state) {
  const carePlan = state.carePlan;

  if (!carePlan.data) {
    return true;
  }
  else if (carePlan.isFetching) {
    return false;
  }
  return carePlan.didInvalidate;
}

export function fetchCarePlan(patientId) {
  return (dispatch, getState) => {
    const { token, expiration, useXAuthTokenHeader } = getState().auth;
    const { authenticate, fhirUrl } = getState().settings;

    if (authenticate && (!token || (expiration && new Date().valueOf() > expiration.valueOf()))) {
      return dispatch(discardAuthToken());
    }

    dispatch(requestCarePlan(patientId));
    const url = `${fhirUrl}/CarePlan?subject=${patientId}`;
    return get(url, token, useXAuthTokenHeader)
      .then(response => response.json())
      .then(json => dispatch(receiveCarePlan(patientId, json)));
  };
}

export function fetchCarePlanIfNeeded(patientId) {
  return (dispatch, getState) => {
    if (shouldFetchCarePlan(getState())) {
      return dispatch(fetchCarePlan(patientId));
    }
    return Promise.resolve();
  };
}

function buildCoding(system, code, display) {
  return { system, code, display };
}

function buildActivity(description, reasonCode, category) {
  return {
    detail: {
      category: {
        coding: [buildCoding('http://hl7.org/fhir/care-plan-activity-category', category, '')],
      },
      description: description.text,
      reasonCode: [{
        coding: [buildCoding('http://ehelse.no/fhir/vft', reasonCode, '')],
      }],
    },
  };
}

function buildTarget(goal) {
  const low = { code: goal.low.code, system: goal.low.system, unit: goal.low.unit };
  const high = { code: goal.high.code, system: goal.high.system, unit: goal.high.unit };
  if (goal.low.value && goal.low.value.toString().trim() !== '') {
    low.value = goal.low.value;
  }
  if (goal.high.value && goal.high.value.toString().trim() !== '') {
    high.value = goal.high.value;
  }

  return {
    extension: [
      {
        url: 'goal-target.measure',
        valueCodeableConcept: {
          coding: [buildCoding(
            'urn:std:iso:11073:10101', goal.code, getObservationCodingDisplay(goal.code))],
        },
      },
      {
        url: 'goal-target.detail',
        valueRange: { low, high },
      },
    ],
    url: 'http://hl7.org/fhir/StructureDefinition/goal-target',
  };
}

function buildObservationGoal(reasonCode, measurement) {
  const extension = [];

  measurement.goal.forEach(goal => {
    const target = buildTarget(goal);
    extension.push(target);
  });

  return {
    resourceType: 'Goal',
    id: `${reasonCode}-goal-${measurement.code}`,
    extension,
  };
}

function buildObservationActivityCondition(reasonCode, measurement) {
  const activity = buildActivity('', reasonCode, 'observation');
  activity.detail.scheduledTiming = { repeat: { frequency: 1, period: 1, periodUnits: 'wk' } };
  activity.detail.code = { coding: [buildCoding('urn:std:iso:11073:10101',
      measurement.code, getObservationCodingDisplay(measurement.code))],
  };

  const goal = buildObservationGoal(reasonCode, measurement);
  activity.detail.goal = [{ reference: `#${goal.id}` }];
  return { activity, goal };
}

function buildCondition(symptom, reasonCode, number) {
  return {
    resourceType: 'Condition',
    id: `${reasonCode}-condition-${number}`,
    notes: symptom.text,
  };
}

function buildGoal(id, description) {
  return {
    resourceType: 'Goal',
    id,
    description,
  };
}

function buildCategory(category) {
  switch (category) {
  case CarePlanCategories.HeartFailure:
    return { coding: [{ system: 'http://hl7.org/fhir/ValueSet/care-plan-category', code: '412776001' }] };
  case CarePlanCategories.COPD:
    return { coding: [{ system: 'http://hl7.org/fhir/ValueSet/care-plan-category', code: '698361000' }] };
  default:
    return null;
  }
}

function buildCarePlanResource(user, patientId, category, goal, note, activity, contained) {
  contained.push({
    resourceType: 'Practitioner',
    id: 'pr1',
    name: { family: [user.name.family], given: [user.name.given] } });

  contained.push({
    resourceType: 'Organization',
    id: 'org1',
    name: 'Response center' });

  return {
    resourceType: 'CarePlan',
    text: {
      status: 'additional',
      div: '<div>Sample care plan</div>',
    },
    subject: { reference: `Patient/${patientId}` },
    contained,
    status: 'active',
    author: [{ reference: '#pr1' }],
    participant: [
      {
        role: { text: 'Patient' },
        member: { reference: `Patient/${patientId}` },
      },
      {
        role: { text: 'GP' },
        member: { reference: '#pr1' },
      },
      {
        role: { text: 'Response Center' },
        member: { reference: '#org1' },
      },
    ],
    category,
    goal,
    note,
    activity,
  };
}

function toFhirCarePlan(patientId, carePlan, user) {
  const activities = [];
  const contained = [];

  contained.push(buildGoal('patient-goal', carePlan.patientGoal));
  const goal = [{ reference: '#patient-goal' }];
  const note = [{ text: carePlan.comment }];
  const category = [buildCategory(carePlan.category)];

  carePlan.phases.forEach(phase => {
      // Actions
    phase.actions.filter(a => a.text.trim() !== '').forEach(action => {
      const activity = buildActivity(action, phase.reasonCode, 'procedure');
      activities.push(activity);
    });
      // Drugs
    phase.medications.filter(d => d.text.trim() !== '').forEach(drug => {
      const activity = buildActivity(drug, phase.reasonCode, 'drug');
      activities.push(activity);
    });
      // Symptoms
    const activity = buildActivity('', phase.reasonCode, 'other');
    activity.detail.reasonReference = [];
      // Conditions
    phase.symptoms.filter(s => s.text.trim() !== '').forEach((symptom, index) => {
      const condition = buildCondition(symptom, phase.reasonCode, index + 1);
      contained.push(condition);
      activity.detail.reasonReference.push({ reference: `#${condition.id}` });
    });

    activities.push(activity);
  });

  // Measurements
  carePlan.measurements.forEach(measurement => {
    const data = buildObservationActivityCondition('all', measurement);
    activities.push(data.activity);
    contained.push(data.goal);
  });

  // Questionnaire
  const activity = buildActivity('', 'all', 'observation');
  activity.detail.scheduledTiming = { repeat: { frequency: 1, period: 1, periodUnits: 'wk' } };
  activity.detail.extension = [{
    url: 'http://ehelse.no/fhir/vft',
    valueReference: { reference: `Questionnaire/${carePlan.questionnaireId}` },
  }];
  activities.push(activity);

  return buildCarePlanResource(
    user,
    patientId,
    category,
    goal,
    note,
    activities,
    contained);
}

export function createCarePlan(patientId, type) {
  return (dispatch, getState) => {
    const { user, token, expiration, useXAuthTokenHeader } = getState().auth;
    const { authenticate, fhirUrl } = getState().settings;

    if (authenticate && (!token || (expiration && new Date().valueOf() > expiration.valueOf()))) {
      return dispatch(discardAuthToken());
    }

    const carePlan = buildCarePlan(type);
    const resource = toFhirCarePlan(patientId, carePlan, user);
    const url = `${fhirUrl}/CarePlan/`;

    return post(url, resource, token, useXAuthTokenHeader)
      .then(() => {
        dispatch(fetchCarePlan(patientId));
      })
      .catch(error => console.error(error));
  };
}

export function saveCarePlan(patientId, carePlan) {
  return (dispatch, getState) => {
    const { data } = getState().carePlan;
    const { user, token, expiration, useXAuthTokenHeader } = getState().auth;
    const { authenticate, fhirUrl } = getState().settings;

    if (authenticate && (!token || (expiration && new Date().valueOf() > expiration.valueOf()))) {
      return dispatch(discardAuthToken());
    }

    const resource = data.entry[0].resource;
    const url = `${fhirUrl}/CarePlan/${resource.id}`;
    const updatedResource = toFhirCarePlan(patientId, carePlan, user);
    updatedResource.id = resource.id;

    return put(url, updatedResource, token, useXAuthTokenHeader)
      .then(() => {
        dispatch(completeSaveCarePlan(true));
        dispatch(fetchCarePlan(patientId));
      })
      .catch(error => dispatch(completeSaveCarePlan(false, `Saving failed. ${error}`)));
  };
}
