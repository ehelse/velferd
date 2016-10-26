import React, { Component, PropTypes } from 'react';
import './report.scss';
import { connect } from 'react-redux';
import Collapse from 'react-collapse';
import iconChevron from '../../../../../svg/chevron-left.svg';
import Icon from '../../../icon/icon.jsx';
import classNames from 'classnames';
import { formatDate, filterObservationsInRange, filterQuestionnaireResponses }
  from '../../../../helpers/date-helpers.js';
import { getMeasurementName } from '../../../../helpers/observation-helpers';
import ObservationCodes from '../../../../constants/observation-codes';

class Report extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({ expanded: !this.state.expanded });
  }

  render() {
    const { questionnaireReport, measurementReports, fromDate, toDate } = this.props;
    const iconClass = classNames({
      report__chevron: true,
      'report__chevron--open': this.state.expanded,
    });
    let questionnaireReportMarkup;
    if (questionnaireReport) {
      questionnaireReportMarkup = (
        <p className="report__paragraph">
              Andel grønne smilefjes: {questionnaireReport.greenPercent}%
              , oransje: {questionnaireReport.yellowPercent}% og røde
              : {questionnaireReport.redPercent}%.
        </p>);
    }
    return (
      <div className="report">
        <button
          onClick={this.handleClick}
          className="report__expanderbutton"
        >
          Rapport denne perioden
          <Icon glyph={iconChevron} className={iconClass} />
        </button>
        <Collapse isOpened={this.state.expanded}>
          <div className="report__expander">
            <h3 className="report__header">
               {formatDate(fromDate)} - {formatDate(toDate)} 2016
            </h3>
            {measurementReports.map((measurement, i) =>
              <p className="report__paragraph" key={i}>
                <b>{measurement.name}</b> har variert mellom {measurement.min}&nbsp;
                og {measurement.max} og har et gjennomsnitt på {measurement.average}.
              </p>
            )}
            {questionnaireReportMarkup}
            <button className="report__copybutton">Kopier tekst</button>
          </div>
        </Collapse>
      </div>
      );
  }
}

Report.propTypes = {
  fromDate: PropTypes.instanceOf(Date).isRequired,
  toDate: PropTypes.instanceOf(Date).isRequired,
  measurementReports: PropTypes.array.isRequired,
  questionnaireReport: PropTypes.object,
};

function calculateValues(values, code) {
  const average = Math.round(values.reduce((a, b) => a + b) / values.length);
  return {
    name: getMeasurementName(code),
    min: Math.min(...values),
    max: Math.max(...values),
    average,
  };
}

function calculateForCompoundMeasurement(entries) {
  const values = {};

  entries.forEach(entry => {
    entry.resource.component.forEach(component => {
      const code = component.code.coding[0].code;
      if (code !== ObservationCodes.bloodPressureMean) {
        if (!values[code]) {
          values[code] = [];
        }
        values[code].push(component.valueQuantity.value);
      }
    });
  });

  const data = [];

  Object.keys(values).forEach((key) => {
    if (values.hasOwnProperty(key)) {
      data.push(calculateValues(values[key], key));
    }
  });

  return data;
}

function calculateQuestionnaireValues(entries) {
  const count = { 1: 0, 2: 0, 3: 0 };

  for (let i = 0; i < entries.length; i++) {
    const resource = entries[i].resource;
    for (let ii = 0; ii < resource.group.group[0].question.length; ii++) {
      const question = resource.group.group[0].question[ii];
      const value = question.answer[0].valueCoding.code;
      count[value] ++;
    }
  }

  const total = count[1] + count[2] + count[3];

  return {
    greenPercent: total > 0 ? Math.round((count[1] * 100) / total) : 0,
    yellowPercent: total > 0 ? Math.round((count[2] * 100) / total) : 0,
    redPercent: total > 0 ? Math.round((count[3] * 100) / total) : 0,
  };
}

function mapStateToProps(state, ownProps) {
  const { observationsByCode, questionnaireResponses } = state;
  const { fromDate, toDate } = ownProps;

  let questionnaireReport;
  if (questionnaireResponses.data) {
    const entries = filterQuestionnaireResponses(
      questionnaireResponses.data.entry, fromDate, toDate);
    questionnaireReport = calculateQuestionnaireValues(entries);
  }

  const measurementReports = [];
  Object.keys(observationsByCode).forEach((key) => {
    if (observationsByCode.hasOwnProperty(key)) {
      const observations = observationsByCode[key];

      if (observations.data) {
        const entries = filterObservationsInRange(observations.data.entry, fromDate, toDate);

        if (entries.length > 0 && entries[0].resource.valueQuantity) {
          const values = entries.map(entry => parseInt(entry.resource.valueQuantity.value, 10));
          measurementReports.push(calculateValues(values, key));
        }
        else {
          measurementReports.push(...calculateForCompoundMeasurement(entries));
        }
      }
    }
  });

  return { measurementReports, questionnaireReport };
}

export default connect(mapStateToProps)(Report);
