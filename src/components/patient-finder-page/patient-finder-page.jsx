import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { changePatient,
  changePatientWithId,
  fetchPatients,
  fetchPatientByIdentifier } from '../../actions/patient';
import { getBirthNumber, getName } from '../../helpers/patient-helpers.js';
import TextInput from '../text-input/text-input.jsx';
import Spinner from '../spinner/spinner.jsx';
import './patient-finder-page.scss';
import Icon from '../icon/icon.jsx';
import mfglass from '../../../svg/magnifying_glass.svg';
import { hashHistory } from 'react-router';

class PatientsFinder extends Component {

  constructor(props) {
    super(props);
    this.search = this.search.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.updateSearchString = this.updateSearchString.bind(this);
    this.state = { searchString: '', lastViewed: this.loadLastViewed(props.fhirUrl) };
  }

  loadLastViewed(fhirUrl) {
    try {
      const key = `${fhirUrl}-lastViewed`;
      const serializedPatients = localStorage.getItem(key);
      if (serializedPatients === null) {
        return {};
      }
      return JSON.parse(serializedPatients);
    }
    catch (e) {
      return {};
    }
  }

  saveLastViewed(fhirUrl, lastViewed) {
    try {
      const serializedPatients = JSON.stringify(lastViewed);
      const key = `${fhirUrl}-lastViewed`;
      localStorage.setItem(key, serializedPatients);
    }
    catch (e) {
      // Ignore write errors.
    }
  }

  updateSearchString(event) {
    return this.setState({ searchString: event.target.value });
  }

  search() {
    const { dispatch } = this.props;
    const { searchString } = this.state;
    const isPersonNumber = /^([0-9]){11}$/.test(searchString);

    if (isPersonNumber) {
      dispatch(fetchPatientByIdentifier(this.state.searchString));
    }
    else {
      dispatch(fetchPatients(this.state.searchString));
    }
  }

  handleKeyPress(event) {
    event.preventDefault();
    this.search();
  }

  handlePatientClick(patient, patientName) {
    const { dispatch, fhirUrl } = this.props;
    const { lastViewed } = this.state;
    lastViewed[patient.id] = patientName;

    this.saveLastViewed(fhirUrl, lastViewed);
    this.setState({ lastViewed });

    dispatch(changePatient(patient))
      .then(() => hashHistory.push('patient'));
  }

  handleLastViewedPatientClick(patientId) {
    const { dispatch } = this.props;
    dispatch(changePatientWithId(patientId))
      .then(() => hashHistory.push('patient'));
  }

  groupPatientsByInitial(data) {
    if (!data || !data.entry) {
      return {};
    }

    const patientsByInitial = {};

    data.entry.forEach(entry => {
      const patient = entry.resource;
      const patientName = getName(patient);
      const initial = patientName ? patientName.substring(0, 1) : ' ';
      const birthNumber = getBirthNumber(patient);

      if (!patientsByInitial[initial]) {
        patientsByInitial[initial] = [];
      }

      patientsByInitial[initial].push(
        <li key={patient.id} className="patient-finder__letter-list-item">
          <button
            onClick={() => this.handlePatientClick(patient, patientName)}
            className="patient-finder__person"
          >
            {patientName} - {birthNumber}
          </button>
        </li>
        );
    });

    return patientsByInitial;
  }

  render() {
    const { data } = this.props;
    const { lastViewed } = this.state;
    const patientsByInitial = this.groupPatientsByInitial(data);
    const groups = [];
    Object.keys(patientsByInitial).sort().forEach((key) => {
      if (patientsByInitial.hasOwnProperty(key)) {
        groups.push(
          <ul key={key} className="patient-finder__letters-list">
            <div className="patient-finder__letter">{key}</div>
            {patientsByInitial[key]}
          </ul>
          );
      }
    });
    const lettersClasses = classNames('patient-finder__letters', {
      'patient-finder__letters--columns': data !== null && data.entry && data.entry.length > 12,
    });

    const recentlyViewed = [];

    Object.keys(lastViewed).sort().forEach((key) => {
      if (lastViewed.hasOwnProperty(key)) {
        recentlyViewed.push(
          <li key={key}>
            <button
              onClick={() => this.handleLastViewedPatientClick(key)}
              className="patient-finder__person"
            >
              {lastViewed[key]}
            </button>
          </li>
        );
      }
    });

    return (
      <div className="patient-finder">
        <h2 className="patient-finder__heading">Velg pasient</h2>
        {
          recentlyViewed.length > 0 ?
          (<section>
            <h3 className="patient-finder__recent-heading">Nylig sett på</h3>
            <ul className="patient-finder__list">{recentlyViewed}</ul>
          </section>) : null
        }

        <section>
          <form onSubmit={this.handleKeyPress} className="patient-finder__search">
            <TextInput
              className="patient-finder__search-input"
              name="searchInput"
              placeholder="Søk på navn eller fødselsnummer"
              onChange={this.updateSearchString}
              value={this.state.searchString}
            />
            <button type="submit" className="patient-finder__submit">
              {this.props.isFetching ?
                <Spinner className="small white" /> :
                <Icon glyph={mfglass} className="patient-finder__icon" />}
            </button>
          </form>
          <div>
            <div className={lettersClasses}>{groups}</div>
          </div>
        </section>
      </div>
    );
  }
}

PatientsFinder.propTypes = {
  dispatch: PropTypes.func.isRequired,
  data: PropTypes.object,
  isFetching: PropTypes.bool,
  fhirUrl: PropTypes.string,
};

function mapStateToProps(state) {
  const { patient, settings } = state;
  const { data, isFetching } = patient;
  const { fhirUrl } = settings;

  return {
    data,
    isFetching,
    fhirUrl,
  };
}

export default connect(mapStateToProps)(PatientsFinder);
