export const UNITS_MEASUREMENT_TEMPLATES = {
  'science.thermometer.readCelsius': {
    id: 'science.thermometer.readCelsius',
    type: 'mcq',
    engine: 'thermometer',
    config: {
      mode: 'read',
      unit: 'C',
      min: 0,
      max: 60,
      majorStep: 5,
      minorStep: 1,
    }
  },
  'science.thermometer.readFahrenheit': {
    id: 'science.thermometer.readFahrenheit',
    type: 'mcq',
    engine: 'thermometer',
    config: {
      mode: 'read',
      unit: 'F',
      min: 30,
      max: 130,
      majorStep: 10,
      minorStep: 5,
    }
  },
  'science.thermometer.compare': {
    id: 'science.thermometer.compare',
    type: 'mcq',
    engine: 'thermometer',
    config: {
      mode: 'compare',
      unit: 'C',
      min: 0,
      max: 60,
      majorStep: 10,
      minorStep: 2,
    }
  },
  'science.thermometer.estimate': {
    id: 'science.thermometer.estimate',
    type: 'mcq',
    engine: 'thermometer',
    config: {
      mode: 'estimate',
      unit: 'F',
      min: 30,
      max: 130,
      majorStep: 20,
      minorStep: 10,
    }
  },
  'science.time.chooseUnitsOfTime': {
    id: 'science.time.chooseUnitsOfTime',
    type: 'mcq',
    engine: 'unitChoice',
    config: {}
  },
  'science.distance.customaryUnitsDistance': {
    id: 'science.distance.customaryUnitsDistance',
    type: 'mcq',
    engine: 'distanceEstimate',
    config: {}
  },
  'science.distance.metricUnitsDistance': {
    id: 'science.distance.metricUnitsDistance',
    type: 'mcq',
    engine: 'metricDistanceEstimate',
    config: {}
  },
  'science.measurement.chooseMeasuringToolLength': {
    id: 'science.measurement.chooseMeasuringToolLength',
    type: 'mcq',
    engine: 'measurementToolChoice',
    config: {}
  }
};

export function getUnitsMeasurementTemplate(templateId) {
  return UNITS_MEASUREMENT_TEMPLATES[templateId] || null;
}
