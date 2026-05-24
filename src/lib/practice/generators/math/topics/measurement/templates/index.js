/**
 * Measurement Templates
 */

export const MEASUREMENT_TEMPLATES = {
  'meas.compare.size': {
    id: 'meas.compare.size',
    family: 'compare',
    engine: 'compareSize',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'compare_size' }
  },
  'meas.nonstandard': {
    id: 'meas.nonstandard',
    family: 'nonstandard',
    engine: 'nonStandardUnits',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'measure_with_cubes' }
  },
  'meas.ruler.reading': {
    id: 'meas.ruler.reading',
    family: 'ruler',
    engine: 'rulerReading',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'measure_ruler' }
  },
  'meas.ruler.compare': {
    id: 'meas.ruler.compare',
    family: 'ruler',
    engine: 'rulerReading',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'compare_rulers', compare: true }
  },
  'meas.choose.tool': {
    id: 'meas.choose.tool',
    family: 'choose',
    engine: 'chooseTool',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'choose_tool' }
  },
  'meas.choose.unit': {
    id: 'meas.choose.unit',
    family: 'choose',
    engine: 'chooseUnit',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'choose_unit' }
  },
  'meas.thermometer': {
    id: 'meas.thermometer',
    family: 'thermometer',
    engine: 'thermometer',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'read_thermometer' }
  },
  'meas.liquid.volume': {
    id: 'meas.liquid.volume',
    family: 'volume',
    engine: 'liquidVolume',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'read_volume' }
  },
  'meas.conversion.table': {
    id: 'meas.conversion.table',
    family: 'conversion',
    engine: 'unitConversion',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'conversion_table' }
  },
  'meas.conversion.single': {
    id: 'meas.conversion.single',
    family: 'conversion',
    engine: 'unitConversion',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'single_conversion' }
  },
  'meas.conversion.mixed': {
    id: 'meas.conversion.mixed',
    family: 'mixed',
    engine: 'mixedUnits',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'mixed_addition' }
  },
  'meas.wordproblems': {
    id: 'meas.wordproblems',
    family: 'wordproblems',
    engine: 'measurementWordProblems',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'measurement_wp' }
  },
  'meas.precision.error': {
    id: 'meas.precision.error',
    family: 'error',
    engine: 'precisionError',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'precision_error' }
  },
  'meas.density': {
    id: 'meas.density',
    family: 'density',
    engine: 'density',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'density' }
  },
  'meas.balance.compare': {
    id: 'meas.balance.compare',
    family: 'compare',
    engine: 'balanceScale',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'compare_weights' }
  },
  'meas.balance.add': {
    id: 'meas.balance.add',
    family: 'balance',
    engine: 'balanceScale',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'add_weight' }
  },
  'meas.balance.remove': {
    id: 'meas.balance.remove',
    family: 'balance',
    engine: 'balanceScale',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'remove_weight' }
  },
  'meas.balance.interactive': {
    id: 'meas.balance.interactive',
    family: 'balance',
    engine: 'balanceScale',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'interactive_balance' }
  },
  'meas.dice.interactive': {
    id: 'meas.dice.interactive',
    family: 'nonstandard',
    engine: 'diceMeasurement',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'interactive_dice_measurement' }
  },
  'meas.dice.vertical': {
    id: 'meas.dice.vertical',
    family: 'nonstandard',
    engine: 'diceMeasurement',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'interactive_dice_vertical' }
  },
  'meas.nonstandard.multi': {
    id: 'meas.nonstandard.multi',
    family: 'nonstandard',
    engine: 'nonStandardUnitMeasurement',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'non_standard_object_measurement' }
  }
};

export function getMeasurementTemplate(templateId) {
  return MEASUREMENT_TEMPLATES[templateId] || null;
}
