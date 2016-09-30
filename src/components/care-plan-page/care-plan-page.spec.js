import { expect } from 'chai';
import { getPhase, getPatientGoal, getQuestionnaireId, getMeasurements } from './care-plan-page.js';
import data from '../../mock/care-plan.json';

describe('careplan phase', () => {
  it('should have a reason code', () => {
    const phase = getPhase(data, 'green');
    expect(phase.reasonCode).to.equal('green');
  });

  it('should have a list of symptoms', () => {
    const phase = getPhase(data, 'green');
    expect(phase.symptoms).to.not.equal(undefined);
    expect(phase.symptoms.length).gt(0);
  });

  it('should have a list of actions', () => {
    const phase = getPhase(data, 'green');
    expect(phase.actions).to.not.equal(undefined);
    expect(phase.actions.length).gt(0);
  });

  it('should have a list of medications', () => {
    const phase = getPhase(data, 'green');
    expect(phase.medications).to.not.equal(undefined);
    expect(phase.medications.length).gt(0);
  });
});

describe('careplan', () => {
  it('should have a goal', () => {
    const goal = getPatientGoal(data);
    expect(goal).to.not.equal(undefined);
  });

  it('should have a questionnaire', () => {
    const id = getQuestionnaireId(data);
    expect(id).to.equal('62763');
  });

  it('should have a list of measurements', () => {
    const measurements = getMeasurements(data);
    expect(measurements).to.not.equal(undefined);
    expect(measurements.length).gt(0);
  });
});
