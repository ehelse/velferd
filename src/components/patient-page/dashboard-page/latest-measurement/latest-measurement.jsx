import React, { PropTypes } from 'react';
import './latest-measurement.scss';
import { formatDate, getTime } from '../../../../helpers/date-helpers';
import Icon from '../../../icon/icon.jsx';
import iconCalendar from '../../../../../svg/calendar.svg';
import iconClock from '../../../../../svg/clock.svg';
import { getTransparentIcon } from '../../../../helpers/questionnaire-response-helpers.js';

const LatestMeasurement = ({ date, measurement, unit, questionnaireResponses, empty }) => {
  let value;

  if (empty) {
    return (
      <div className="latest-measurement">
      </div>
      );
  }

  if (measurement) {
    let formattedValue;

    if (measurement.length > 1) {
      formattedValue = (
        <span>{Math.round(measurement[0])}/<br />{Math.round(measurement[1])}</span>
      );
    }
    else if (measurement[0]) {
      formattedValue = Math.round(measurement[0]);
    }
    value = (
      <div className="latest-measurement__valuewrapper">
        <span className="latest-measurement__value">{formattedValue}</span>
        <span className="latest-measurement__unit">{unit}</span>
      </div>
    );
  }

  let values = [];

  if (questionnaireResponses) {
    Object.keys(questionnaireResponses).forEach((key) => {
      if (questionnaireResponses.hasOwnProperty(key)) {
        values.push(
          <div key={key}>
            <Icon
              className="latest-measurement__smileyface"
              glyph={getTransparentIcon(questionnaireResponses[key])}
              width={20}
              height={20}
            />
          </div>
        );
      }
    });

    value = (
      <div className="latest-measurement__valuewrapper latest-measurement__valuewrapper--smileys">
        {values}
      </div>
    );
  }

  return (
    <div className="latest-measurement">
      <div className="latest-measurement__headingwrapper">
        <h3 className="latest-measurement__heading">Siste måling</h3>
        <div className="latest-measurement__datetime">
          <Icon glyph={iconCalendar} className="latest-measurement__icon" />
          <span>{formatDate(date)}</span>
        </div>
        <div className="latest-measurement__datetime">
          <Icon glyph={iconClock} className="latest-measurement__icon" />
          <span>{getTime(date)}</span>
        </div>
      </div>
      {value}
    </div>
    );
};

LatestMeasurement.propTypes = {
  date: PropTypes.string,
  measurement: PropTypes.array,
  questionnaireResponses: PropTypes.object,
  unit: PropTypes.string,
  empty: PropTypes.bool,
};

export default LatestMeasurement;
