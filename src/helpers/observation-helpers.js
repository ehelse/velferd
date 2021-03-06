import ObservationCodes from '../constants/observation-codes';

export function getMeasurementName(code) {
  switch (code) {
  case ObservationCodes.weight:
    return 'Vekt';
  case ObservationCodes.pulse:
    return 'Puls';
  case ObservationCodes.pulseOximeter:
    return 'Oksygenmetning';
  case ObservationCodes.bloodPressure:
    return 'Blodtrykk';
  case ObservationCodes.bloodPressureSystolic:
    return 'Overtrykk';
  case ObservationCodes.bloodPressureDiastolic:
    return 'Undertrykk';
  default:
    return '';
  }
}

export function getUnit(code) {
  switch (code) {
  case ObservationCodes.weight:
    return 'kg';
  case ObservationCodes.pulse:
    return 'slag/min';
  case ObservationCodes.pulseOximeter:
    return '%';
  case ObservationCodes.bloodPressure:
    return 'mm Hg';
  default:
    return null;
  }
}

export function getObservationCodingDisplay(code) {
  switch (code) {
  case ObservationCodes.weight:
    return 'MDC_MASS_BODY_ACTUAL';
  case ObservationCodes.pulse:
    return 'MDC_PULS_OXIM_PULS_RATE';
  case ObservationCodes.pulseOximeter:
    return 'MDC_PULS_OXIM_SAT_O2';
  case ObservationCodes.bloodPressure:
    return 'MDC_PRESS_BLD_NONINV';
  case ObservationCodes.bloodPressureSystolic:
    return 'MDC_PRESS_BLD_NONINV_SYS';
  case ObservationCodes.bloodPressureDiastolic:
    return 'MDC_PRESS_BLD_NONINV_DIA';
  default:
    return null;
  }
}
