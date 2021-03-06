import React, { Component, PropTypes } from 'react';
import './report.scss';
import { connect } from 'react-redux';
import Collapse from 'react-collapse';
import iconChevron from '../../../../../../svg/chevron-left.svg';
import Icon from '../../../../icon/icon.jsx';
import classNames from 'classnames';
import { formatDate, filterObservationsInRange, filterQuestionnaireResponses }
  from '../../../../../helpers/date-helpers.js';
import { getMeasurementName } from '../../../../../helpers/observation-helpers';
import ObservationCodes from '../../../../../constants/observation-codes';
import QuestionnaireResponseCodes from '../../../../../constants/questionnaire-response-codes';
import Button from '../../../../button/button.jsx';
import Clipboard from 'clipboard';

class Report extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.handleClick = this.handleClick.bind(this);

    const clipboard = new Clipboard('.report__copybutton', { // eslint-disable-line
      text: () => {
        this.refs.copy.classList.remove('report__copybutton-text--visible');
        this.refs.copied.classList.add('report__copybutton-text--visible');
        setTimeout(() => {
          this.refs.copy.classList.add('report__copybutton-text--visible');
          this.refs.copied.classList.remove('report__copybutton-text--visible');
        }, 1500);
        return document.getElementById('copy-target').innerText;
      },
    });
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
        <Collapse isOpened={this.state.expanded} className="report__expanderwrapper">
          <div className="report__expander">
            <div id="copy-target">
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
            </div>
            <Button className="report__copybutton">
              <span
                className="report__copybutton-text report__copybutton-text--visible"
                ref="copy"
              >
                Kopier tekst
              </span>
              <span
                className="report__copybutton-text"
                ref="copied"
              >
                Tekst kopiert!
              </span>
            </Button>
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
        if (component.valueQuantity) {
          values[code].push(component.valueQuantity.value);
        }
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
  const count = {};
  count[QuestionnaireResponseCodes.green] = 0;
  count[QuestionnaireResponseCodes.yellow] = 0;
  count[QuestionnaireResponseCodes.red] = 0;

  entries.forEach((entry) => {
    const resource = entry.resource;
    if (resource.group.question) {
      resource.group.question.forEach((question) => {
        const value = question.answer[0].valueCoding.code;
        count[value] ++;
      });
    }
  });

  const total = count[QuestionnaireResponseCodes.green] +
    count[QuestionnaireResponseCodes.yellow] + count[QuestionnaireResponseCodes.red];

  return {
    greenPercent: total > 0 ?
     Math.round((count[QuestionnaireResponseCodes.green] * 100) / total) : 0,
    yellowPercent: total > 0 ?
     Math.round((count[QuestionnaireResponseCodes.yellow] * 100) / total) : 0,
    redPercent: total > 0 ?
     Math.round((count[QuestionnaireResponseCodes.red] * 100) / total) : 0,
  };
}

function getMeasurementReports(observationsByCode, fromDate, toDate) {
  const measurementReports = [];
  Object.keys(observationsByCode).forEach((key) => {
    if (observationsByCode.hasOwnProperty(key)) {
      const observations = observationsByCode[key];

      if (observations.data && observations.data.length > 0) {
        const entries = filterObservationsInRange(observations.data, fromDate, toDate);

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
  return measurementReports;
}

function getQuestionnaireReport(questionnaireResponses, fromDate, toDate) {
  let questionnaireReport;
  if (questionnaireResponses.data) {
    const entries = filterQuestionnaireResponses(questionnaireResponses.data, fromDate, toDate);
    questionnaireReport = calculateQuestionnaireValues(entries);
  }
  return questionnaireReport;
}

function mapStateToProps(state, ownProps) {
  const { fromDate, toDate } = ownProps;

  return {
    measurementReports: getMeasurementReports(state.observationsByCode, ownProps.fromDate, toDate),
    questionnaireReport: getQuestionnaireReport(state.questionnaireResponses, fromDate, toDate),
  };
}

export default connect(mapStateToProps)(Report);
