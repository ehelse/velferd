import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { fetchCarePlan, saveCarePlan } from '../../actions/care-plan';
import CarePlan from './care-plan/care-plan.jsx';
import Controls from './controls/controls.jsx';
import ReasonCodes from '../../constants/reason-codes';
import { getPhase, getPatientGoal } from './care-plan-page.js';
import './care-plan-page.scss';

class CarePlanPage extends Component {

  constructor(props) {
    super(props);

    this.updateCarePlanState = this.updateCarePlanState.bind(this);
    this.saveCarePlan = this.saveCarePlan.bind(this);
    this.editCarePlan = this.editCarePlan.bind(this);
    this.deleteCarePlanItem = this.deleteCarePlanItem.bind(this);
    this.addCarePlanItem = this.addCarePlanItem.bind(this);
    this.cancel = this.cancel.bind(this);

    this.state = {
      carePlan: undefined,
      edit: false,
      saving: false,
    };
  }

  componentDidMount() {
    const { dispatch, fhirUrl, patientId } = this.props;
    dispatch(fetchCarePlan(fhirUrl, patientId));
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.saveCompleted) {
      this.setState({ carePlan: Object.assign({}, nextProps.carePlan) });
    }

    if (nextProps.saveCompleted) {
      this.setState({ saving: false, edit: false });
    }
  }

  getPhaseIndex(reasonCode) {
    switch (reasonCode) {
    case ReasonCodes.green:
      return 0;
    case ReasonCodes.yellow:
      return 1;
    case ReasonCodes.red:
      return 2;
    default:
      return null;
    }
  }

  updateCarePlanState(event) {
    const carePlan = this.state.carePlan;

    if (event.target.name === 'patient-goal') {
      carePlan.patientGoal = event.target.value;
    }
    else {
      const ids = event.target.name.split('-');
      const index = this.getPhaseIndex(ids[0]);

      if (ids[1] === 'measurements') {
        const measurement = carePlan.phases[index][ids[1]][ids[2]];
        const goal = measurement.goal[[ids[3]]];
        const item = goal[ids[4]];
        item.value = event.target.value;
      }
      else {
        carePlan.phases[index][ids[1]][ids[2]] = event.target.value;
      }
    }

    return this.setState({ carePlan });
  }

  deleteCarePlanItem(name) {
    const ids = name.split('-');
    const carePlan = this.state.carePlan;
    const index = this.getPhaseIndex(ids[0]);

    carePlan.phases[index][ids[1]].splice(ids[2], 1);
    return this.setState({ carePlan });
  }

  addCarePlanItem(reasonCode, type) {
    const carePlan = this.state.carePlan;
    const index = this.getPhaseIndex(reasonCode);

    carePlan.phases[index][type].push('');
    return this.setState({ carePlan });
  }

  editCarePlan(event) {
    event.preventDefault();
    this.setState({ edit: true });
  }

  cancel() {
    this.setState({ edit: false });
  }

  saveCarePlan(event) {
    const { dispatch, fhirUrl, patientId } = this.props;
    event.preventDefault();
    this.setState({ saving: true });
    dispatch(saveCarePlan(fhirUrl, patientId, this.state.carePlan));
  }

  render() {
    const { isFetching, error } = this.props;
    const { carePlan, edit, saving } = this.state;
    const isEmpty = carePlan === undefined;

    return (
      <div className="care-plan-page">
        <h2 className="care-plan-page__heading">Egenbehandlingsplan</h2>
        {error && <p>{error}</p>}
        <Controls
          saving={saving}
          edit={edit}
          editCarePlan={this.editCarePlan}
          saveCarePlan={this.saveCarePlan}
          cancel={this.cancel}
        />
        {isEmpty
          ? (isFetching ? <h2>Loading...</h2> : null)
          : <CarePlan
            phases={carePlan.phases}
            patientGoal={carePlan.patientGoal}
            edit={edit}
            saving={saving}
            onChange={this.updateCarePlanState}
            deleteCarePlanItem={this.deleteCarePlanItem}
            addCarePlanItem={this.addCarePlanItem}
          />
        }
        <div className="care-plan-page__lastupdated">
          Sist oppdatert: 30.02.2016 kl. 11.34 av Anna For Eieb (lege)
        </div>
      </div>
    );
  }
}

CarePlanPage.propTypes = {
  fhirUrl: PropTypes.string.isRequired,
  patientId: PropTypes.string.isRequired,
  isFetching: PropTypes.bool.isRequired,
  saveCompleted: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
  carePlan: PropTypes.object,
  error: PropTypes.string,
};

function mapStateToProps(state) {
  const { carePlan, settings } = state;
  const { fhirUrl, patientId } = settings;
  const { isFetching, data, saveCompleted, error } = carePlan
    || { isFetching: true, data: null, saveCompleted: null };

  let plan;
  const isEmpty = data === null || data.resourceType !== 'Bundle' || data.total === 0;

  if (!saveCompleted && !isEmpty) {
    plan = { phases: [] };
    const greenPhase = getPhase(data.entry[0].resource, ReasonCodes.green);
    plan.phases.push(greenPhase);
    const yellowPhase = getPhase(data.entry[0].resource, ReasonCodes.yellow);
    plan.phases.push(yellowPhase);
    const redPhase = getPhase(data.entry[0].resource, ReasonCodes.red);
    plan.phases.push(redPhase);
    plan.patientGoal = getPatientGoal(data.entry[0].resource);
  }

  return {
    fhirUrl,
    patientId,
    carePlan: plan,
    isFetching,
    saveCompleted,
    error,
  };
}

export default connect(mapStateToProps)(CarePlanPage);
