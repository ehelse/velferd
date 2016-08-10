import React, { Component, PropTypes } from 'react';
import Chart from '../chart/chart.jsx';
import './measurement.scss';
import ObservationCodes from '../../constants/observation-codes';
import { filterPoints } from '../../helpers/date-helpers.js';

class Measurements extends Component {

  getMeasurementName(code) {
    switch (code) {
    case ObservationCodes.weight:
      return 'Weight';
    case ObservationCodes.pulse:
      return 'Pulse';
    case ObservationCodes.pulseOximeter:
      return 'Pulse Oximeter';
    case ObservationCodes.bloodPressure:
      return 'Blood Pressure';
    default:
      return '';
    }
  }

  getMeasurementHigh(code) {
    switch (code) {
    case ObservationCodes.weight:
      return 120;
    case ObservationCodes.pulse:
      return 150;
    case ObservationCodes.pulseOximeter:
      return 100;
    case ObservationCodes.bloodPressure:
      return 150;
    default:
      return null;
    }
  }

  getMeasurementLow(code) {
    switch (code) {
    case ObservationCodes.weight:
      return 40;
    case ObservationCodes.pulse:
      return 50;
    case ObservationCodes.pulseOximeter:
      return 80;
    case ObservationCodes.bloodPressure:
      return 50;
    default:
      return null;
    }
  }

  getMeasurementHighReference(code) {
    switch (code) {
    case ObservationCodes.weight:
      return 90;
    case ObservationCodes.pulse:
      return 70;
    case ObservationCodes.pulseOximeter:
      return 100;
    case ObservationCodes.bloodPressure:
      return 110;
    default:
      return null;
    }
  }

  getMeasurementLowReference(code) {
    switch (code) {
    case ObservationCodes.weight:
      return 80;
    case ObservationCodes.pulse:
      return 60;
    case ObservationCodes.pulseOximeter:
      return 90;
    case ObservationCodes.bloodPressure:
      return 70;
    default:
      return null;
    }
  }

  getUnit(code) {
    switch (code) {
    case ObservationCodes.weight:
      return 'kg';
    case ObservationCodes.pulse:
      return 'bpm';
    case ObservationCodes.pulseOximeter:
      return '%';
    case ObservationCodes.bloodPressure:
      return 'mm Hg';
    default:
      return null;
    }
  }

  getDataPoint(item) {
    const point = {
      date: item.resource.effectiveDateTime,
      value: [],
    };

    if (item.resource.valueQuantity) {
      point.value.push(item.resource.valueQuantity.value);
      point.unit = item.resource.valueQuantity.unit;
    }
    else {
      item.resource.component.forEach((component) => {
        if (component.valueQuantity
          && component.code.coding[0].code !== ObservationCodes.bloodPressureMean) {
          point.value.push(component.valueQuantity.value);
          point.unit = component.valueQuantity.unit;
        }
      }, this);
    }
    return point;
  }

  render() {
    let points = this.props.data.entry.map(this.getDataPoint);
    points = filterPoints(points, this.props.fromDate, this.props.toDate);
    const name = this.getMeasurementName(this.props.code);
    const highReference = this.getMeasurementHighReference(this.props.code);
    const lowReference = this.getMeasurementLowReference(this.props.code);

    let chart;

    if (points.length > 0) {
      chart = (
        <Chart
          dataPoints={points}
          high={this.getMeasurementHigh(this.props.code)}
          low={this.getMeasurementLow(this.props.code)}
          highReference={highReference}
          lowReference={lowReference}
          fromDate={this.props.fromDate}
          toDate={this.props.toDate}
        />);
    }

    const unit = this.getUnit(this.props.code);
    const referenceValue = `${lowReference} - ${highReference} ${unit}`;

    const description = (
      <div className="measurement__description">
        <div className="measurement__description__heading">{name}</div>
        <div className="measurement__description__heading">{unit}</div>
        <br />
        <div>Pasientens idealnivå:</div>
        <div className="measurement__description__referenceValue">{referenceValue}</div>
      </div>
    );

    return (
      <div className="measurement" >
        {description}
        <span className="measurement__chart">
          {chart}
        </span>
      </div>
    );
  }
}

Measurements.propTypes = {
  data: PropTypes.object.isRequired,
  code: PropTypes.string.isRequired,
  fromDate: React.PropTypes.instanceOf(Date).isRequired,
  toDate: React.PropTypes.instanceOf(Date).isRequired,
};

export default Measurements;
