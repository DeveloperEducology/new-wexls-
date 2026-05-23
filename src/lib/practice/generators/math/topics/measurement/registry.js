/**
 * Registry of Measurement Chapter Skills and Engines
 */

import { SeededRandom } from './shared/utils.js';
import { MEASUREMENT_CATALOG, getMeasurementSkill } from './catalog.js';
import { getMeasurementTemplate } from './templates/index.js';

// Engine imports
import { generateCompareSizeQuestion } from './engines/compareSize.engine.js';
import { generateNonStandardUnitsQuestion } from './engines/nonStandardUnits.engine.js';
import { generateRulerReadingQuestion } from './engines/rulerReading.engine.js';
import { generateEstimateLengthQuestion } from './engines/estimateLength.engine.js';
import { generateChooseUnitQuestion } from './engines/chooseUnit.engine.js';
import { generateChooseToolQuestion } from './engines/chooseTool.engine.js';
import { generateThermometerQuestion } from './engines/thermometer.engine.js';
import { generateScaleReadingQuestion } from './engines/scaleReading.engine.js';
import { generateLiquidVolumeQuestion } from './engines/liquidVolume.engine.js';
import { generateUnitConversionQuestion } from './engines/unitConversion.engine.js';
import { generateMixedUnitsQuestion } from './engines/mixedUnits.engine.js';
import { generateMeasurementWordProblemsQuestion } from './engines/measurementWordProblems.engine.js';
import { generatePrecisionErrorQuestion } from './engines/precisionError.engine.js';
import { generateDensityQuestion } from './engines/density.engine.js';
import { generateBalanceScaleQuestion } from './engines/balanceScale.engine.js';

const ENGINES = {
  compareSize: generateCompareSizeQuestion,
  nonStandardUnits: generateNonStandardUnitsQuestion,
  rulerReading: generateRulerReadingQuestion,
  estimateLength: generateEstimateLengthQuestion,
  chooseUnit: generateChooseUnitQuestion,
  chooseTool: generateChooseToolQuestion,
  thermometer: generateThermometerQuestion,
  scaleReading: generateScaleReadingQuestion,
  liquidVolume: generateLiquidVolumeQuestion,
  unitConversion: generateUnitConversionQuestion,
  mixedUnits: generateMixedUnitsQuestion,
  measurementWordProblems: generateMeasurementWordProblemsQuestion,
  precisionError: generatePrecisionErrorQuestion,
  density: generateDensityQuestion,
  balanceScale: generateBalanceScaleQuestion
};

/**
 * Universal Measurement Generator
 */
export function generateMeasurementQuestion(config = {}) {
  const seed = config.variables?.seed || Date.now().toString();
  const rng = new SeededRandom(seed);
  
  const logicType = config.logic_type || 'meas-prek-long-short';
  const skill = getMeasurementSkill(logicType);
  
  if (!skill) {
    // Fallback if skill doesn't exist
    return generateCompareSizeQuestion(rng, { forcedTask: 'compare_size' });
  }

  const template = getMeasurementTemplate(skill.templateId || skill.templateName);
  const engine = ENGINES[skill.engineName];

  if (!engine) {
    throw new Error(`Engine not found for skill: ${skill.skillId} (engine: ${skill.engineName})`);
  }

  // Combine configurations
  const mergedConfig = {
    ...config,
    difficulty: config.difficulty || 'medium',
    forcedTask: skill.config?.forcedTask || (template?.defaultConfig?.forcedTask) || null,
    system: skill.config?.system || (template?.defaultConfig?.system) || null,
    compare: skill.config?.compare || (template?.defaultConfig?.compare) || false
  };

  const question = engine(rng, mergedConfig);

  return {
    ...question,
    id: `meas_${logicType}_${seed}`,
    metadata: {
      ...(question.metadata || {}),
      skillId: skill.skillId,
      code: skill.code,
      grade: skill.grade,
      templateId: skill.templateId || skill.templateName
    }
  };
}

// Build standard registry map
export const measurementRegistry = Object.fromEntries(
  MEASUREMENT_CATALOG.map(skill => [skill.skillId, generateMeasurementQuestion])
);
