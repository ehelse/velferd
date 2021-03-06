import ReasonCodes from '../constants/reason-codes';
import CarePlanCategories from '../constants/care-plan-categories';
import { getMeasurementName, getUnit } from '../helpers/observation-helpers';
import shortId from 'shortid';

export function getCategoryName(category) {
  switch (category) {
  case CarePlanCategories.COPD:
    return 'KOLS';
  case CarePlanCategories.HeartFailure:
    return 'Hjertesvikt';
  default:
    return '';
  }
}

function mapGoal(goal) {
  return goal.extension.map(g => {
    const range = g.extension[1].valueRange;
    const target = {
      code: g.extension[0].valueCodeableConcept.coding[0].code,
      high: Object.assign({}, range.high),
      low: Object.assign({}, range.low),
    };
    if (!target.high.value) {
      target.high.value = '';
    }
    if (!target.low.value) {
      target.low.value = '';
    }
    return target;
  });
}

export function containedReferenceId(reference) {
  return reference.substring(reference.lastIndexOf('#') + 1);
}

export function getMeasurement(resource, code) {
  const results = resource.activity.filter(activity =>
    activity.detail.reasonCode[0].coding[0].code === 'all' &&
    activity.detail.category.coding[0].code === 'observation' &&
    activity.detail.code && activity.detail.code.coding[0].code === code)
    .map(activity => {
      const ref = containedReferenceId(activity.detail.goal[0].reference);
      const goal = resource.contained.filter(res => res.id === ref);

      return {
        code: activity.detail.code.coding[0].code,
        goal: goal ? mapGoal(goal[0]) : null,
      };
    });

  return results ? results[0] : null;
}

export function getMeasurements(resource) {
  const goals = {};
  resource.contained.filter(res => res.resourceType === 'Goal')
    .forEach(res => (goals[res.id] = res));

  return resource.activity
    .filter(activity => activity.detail.reasonCode[0].coding[0].code === 'all'
    && activity.detail.category.coding[0].code === 'observation'
    && activity.detail.code)
    .map(activity => {
      const ref = containedReferenceId(activity.detail.goal[0].reference);
      const goal = goals[ref];

      return {
        code: activity.detail.code.coding[0].code,
        goal: mapGoal(goal),
      };
    });
}

function getActions(activities) {
  return activities
    .filter(activity => activity.detail.category.coding[0].code === 'procedure')
    .map(activity => ({ id: shortId.generate(), text: activity.detail.description }));
}

function getMedications(activities) {
  return activities
    .filter(activity => activity.detail.category.coding[0].code === 'drug')
    .map(activity => ({ id: shortId.generate(), text: activity.detail.description }));
}

function getQuestionnaire(activities) {
  const observations = activities
    .filter(activity => activity.detail.category.coding[0].code === 'observation'
    && activity.detail.extension && activity.detail.extension.length === 1
    && activity.detail.extension[0].valueReference.reference.startsWith('Questionnaire')
    );

  return observations ? observations[0] : null;
}

function getCondition(activities) {
  const results = activities
    .filter(activity => activity.detail.category.coding[0].code === 'other');

  return results ? results[0] : null;
}

export function getPhase(resource, reasonCode) {
  const activities = resource.activity.filter(activity =>
      activity.detail.reasonCode[0].coding[0].code === reasonCode);

  const actions = getActions(activities);
  const medications = getMedications(activities);

  const conditionActivity = getCondition(activities);
  const conditions = {};
  resource.contained.filter(res => res.resourceType === 'Condition')
    .forEach(res => (conditions[res.id] = res.notes));

  const symptoms = !conditionActivity ? []
    : conditionActivity.detail.reasonReference.map(
    ref => ({ id: shortId.generate(), text: conditions[containedReferenceId(ref.reference)] }));

  return {
    reasonCode,
    symptoms,
    actions,
    medications };
}

export function getQuestionnaireId(resource) {
  const activities = resource.activity.filter(activity =>
      activity.detail.reasonCode[0].coding[0].code === 'all');

  const questionnaire = getQuestionnaire(activities);

  let questionnaireId;
  if (questionnaire) {
    const reference = questionnaire.detail.extension[0].valueReference.reference;
    questionnaireId = reference.substring(
      reference.indexOf('Questionnaire/') + 'Questionnaire/'.length);
  }

  return questionnaireId;
}

export function getPatientGoal(resource) {
  if (resource.goal.length > 0) {
    const ref = containedReferenceId(resource.goal[0].reference);
    const goal = resource.contained.filter(res => res.resourceType === 'Goal' && res.id === ref);

    if (goal.length > 0) {
      return goal[0].description;
    }
  }
  return '';
}

export function getCategory(resource) {
  if (resource.category.length > 0) {
    const coding = resource.category[0].coding[0];

    if (coding.code === '698361000') {
      return CarePlanCategories.HeartFailure;
    }
    if (coding.code === '412776001') {
      return CarePlanCategories.COPD;
    }
  }
  return null;
}

export function getAuthor(resource) {
  if (resource.author.length > 0) {
    const authorRef = containedReferenceId(resource.author[0].reference);
    const contained = resource.contained.filter(res => res.id === authorRef);
    return contained[0];
  }
  return null;
}

export function getLastUpdated(resource) {
  return new Date(resource.meta.lastUpdated);
}

export function getCarePlan(resource) {
  const phases = [];
  const greenPhase = getPhase(resource, ReasonCodes.green);
  phases.push(greenPhase);
  const yellowPhase = getPhase(resource, ReasonCodes.yellow);
  phases.push(yellowPhase);
  const redPhase = getPhase(resource, ReasonCodes.red);
  phases.push(redPhase);

  const patientGoal = getPatientGoal(resource);
  const id = resource.id;
  const questionnaireId = getQuestionnaireId(resource);
  const measurements = getMeasurements(resource);
  const category = getCategory(resource);
  const author = getAuthor(resource);
  const lastUpdated = getLastUpdated(resource);

  let comment = '';
  if (resource.note) {
    comment = resource.note.text;
  }

  return {
    id,
    category,
    author,
    lastUpdated,
    phases,
    patientGoal,
    comment,
    questionnaireId,
    measurements };
}

export function phaseToText(phase) {
  let text = '';
  text = phase.symptoms.reduce((result, value) => `${result}- ${value.text}\n`, text);
  text += '\n';
  text = phase.actions.reduce((result, value) => `${result}* ${value.text}\n`, text);
  text += '\n';
  text = phase.medications.reduce((result, value) => `${result}# ${value.text}\n`, text);
  text += '\n';
  return text;
}

export function measurementsToText(measurements) {
  let text = '';
  text = measurements.reduce((result, value) => {
    if (!value.goal || value.goal.length === 0) {
      return `${result}${getMeasurementName(value.code)}\n`;
    }

    const unit = getUnit(value.code);
    const measurementText = value.goal.reduce((res, range) =>
      `${res}${getMeasurementName(range.code)}: ${range.low.value}-${range.high.value} ${unit}\n`,
       '');
    return `${result}${measurementText}`;
  }, text);
  text += '\n';
  return text;
}

export function carePlanToText(carePlan) {
  let text = 'GRØNN – Stabil\n\n';
  text += phaseToText(carePlan.phases[0]);
  text += measurementsToText(carePlan.measurements);

  text += 'GUL - Moderat forverring\n\n';
  text += phaseToText(carePlan.phases[1]);

  text += 'RØD - Alvorlig forverring\n\n';
  text += phaseToText(carePlan.phases[2]);

  return text;
}
