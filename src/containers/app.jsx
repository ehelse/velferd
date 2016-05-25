import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { fetchPatient } from '../actions/patient';
import MeasurementsContainer from '../containers/measurements-container';
import ObservationCodes from '../constants/observation-codes';
import Header from '../components/header.jsx';

class App extends Component {

  componentDidMount() {
    const { dispatch, fhirUrl, patientId } = this.props;
    dispatch(fetchPatient(fhirUrl, patientId));
  }

  render() {
    const { data } = this.props;
    return (
      <div>
        <Header patient={data} fhirUrl={this.props.fhirUrl} />
        <MeasurementsContainer code={ObservationCodes.weight} />
        <MeasurementsContainer code={ObservationCodes.pulse} />
        <MeasurementsContainer code={ObservationCodes.pulseOximeter} />
      </div>
    );
  }
}

App.propTypes = {
  fhirUrl: PropTypes.string.isRequired,
  patientId: PropTypes.string.isRequired,
  data: PropTypes.object,
  isFetching: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { patient, settings } = state;
  const {
    isFetching,
    data,
  } = patient || {
    isFetching: true,
    data: null,
  };

  const { fhirUrl, patientId } = settings;

  return {
    fhirUrl,
    patientId,
    data,
    isFetching,
  };
}

export default connect(
  mapStateToProps,
)(App);
