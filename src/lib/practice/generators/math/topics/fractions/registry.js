import { visualModelsEngine } from './engines/visualModels.js';
import { numberLinesEngine } from './engines/numberLines.js';
import { equivalenceEngine } from './engines/equivalence.js';
import { conversionsEngine } from './engines/conversions.js';
import { wordProblemsEngine } from './engines/wordProblems.js';
import { operationsEngine } from './engines/operations.js';
import { comparisonEngine } from './engines/comparison.js';
import { rationalNumbersEngine } from './engines/rationalNumbers.js';
import { interactiveFractionModelEngine } from './engines/interactiveFractionModel.js';

/**
 * Registry mapping DB logic_types (or template_ids) to specific engines
 * and default parameters.
 */
export const fractionsV2Registry = {
  // Visual Models
  'visual_models_identify': {
    engine: visualModelsEngine,
    params: {
      subType: 'identify_fraction',
      shapeTypes: ['circle', 'rectangle', 'pentagon', 'kite'],
      denominatorPool: [2, 3, 4, 5, 6, 8]
    }
  },
  'visual_models_equal_parts': {
      engine: visualModelsEngine,
      params: {
          subType: 'equal_parts',
          shapeTypes: ['circle', 'rectangle', 'square']
      }
  },
  'visual_models_fraction_of_set': {
    engine: visualModelsEngine,
    params: {
      subType: 'fraction_of_set',
      denominatorPool: [2, 3, 4, 5, 6, 8]
    }
  },
  'visual_models_mixed_numbers': {
    engine: visualModelsEngine,
    params: {
      subType: 'mixed_numbers',
      shapeTypes: ['circle', 'rectangle', 'pentagon', 'kite']
    }
  },
  'visual_models_remove_fraction_pie': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'remove_fraction',
      model: 'pie',
      denominatorPool: [3, 4, 5, 6, 8],
    }
  },
  'visual_models_remove_fraction_square': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'remove_fraction',
      model: 'square',
      denominatorPool: [4, 6, 8, 9],
    }
  },
  'visual_models_remove_fraction_rectangle': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'remove_fraction',
      model: 'rectangle',
      denominatorPool: [2, 3, 4, 5, 6, 8],
    }
  },
  'visual_models_remove_fraction_bar': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'remove_fraction',
      model: 'bar',
      denominatorPool: [3, 4, 5, 6, 8, 10],
    }
  },
  'visual_models_fill_fraction_pie': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'fill_fraction',
      interaction: 'fill',
      model: 'pie',
      denominatorPool: [3, 4, 5, 6, 8],
    }
  },
  'visual_models_fill_fraction_square': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'fill_fraction',
      interaction: 'fill',
      model: 'square',
      denominatorPool: [4, 6, 8, 9,10,12],
    }
  },
  'visual_models_fill_fraction_rectangle': {
    engine: interactiveFractionModelEngine,
    params: {
      subType: 'fill_fraction',
      interaction: 'fill',
      model: 'rectangle',
      denominatorPool: [2, 3, 4, 5, 6, 8,10],
    }
  },
  'visual_models_cut_rectangle_fourths': {
    engine: visualModelsEngine,
    params: {
      subType: 'visual_models_cut_rectangle_fourths'
    }
  },
  'visual_models_cut_circle_fourths': {
    engine: visualModelsEngine,
    params: {
      subType: 'visual_models_cut_circle_fourths'
    }
  },
  'visual_models_cut_rectangle_halves_different': {
    engine: visualModelsEngine,
    params: {
      subType: 'visual_models_cut_rectangle_halves_different'
    }
  },

  // UUIDs can also be mapped directly to an engine + config
  '15c4dd64-7433-4af1-97ce-bd3880a847d0': {
    engine: visualModelsEngine,
    params: {
      subType: 'identify_fraction',
      // We can override defaults for specific UUIDs
      shapeTypes: ['circle', 'rectangle', 'square', 'pentagon', 'kite'] 
    }
  },

  // Number Lines
  'number_lines_identify': {
    engine: numberLinesEngine,
    params: {
      subType: 'identify_point',
      denominatorPool: [2, 3, 4, 5, 6, 8, 10],
      min: 0,
      max: 1
    }
  },
  'number_lines_graph': {
    engine: numberLinesEngine,
    params: {
      subType: 'graph_fraction_mcq',
      denominatorPool: [2, 3, 4, 5, 6, 8],
      min: 0,
      max: 1
    }
  },
  'equivalence_number_line': {
    engine: numberLinesEngine,
    params: {
      subType: 'equivalence_number_line',
      min: 0,
      max: 1
    }
  },

  // Equivalence
  'equivalence_simplify': {
    engine: equivalenceEngine,
    params: {
      subType: 'simplify',
      maxDenominator: 20
    }
  },
  'equivalence_identify_equivalent': {
    engine: equivalenceEngine,
    params: {
      subType: 'identify_equivalent'
    }
  },
  'equivalence_missing_value': {
    engine: equivalenceEngine,
    params: {
      subType: 'missing_value',
      maxMultiplier: 5,
      maxBaseDenom: 10
    }
  },
  'equivalence_patterns': {
    engine: equivalenceEngine,
    params: {
      subType: 'patterns',
      baseDenom: 9,
      baseNum: 1,
      count: 6,
      missingIdx: 1
    }
  },

  // Comparison
  'comparison_visual_compare': {
    engine: comparisonEngine,
    params: {
      subType: 'visual_compare',
      denominatorPool: [2, 3, 4, 5, 6, 8]
    }
  },
  'comparison_sorting_fractions': {
    engine: comparisonEngine,
    params: {
      subType: 'sorting',
      count: 4,
      complexity: 'unlike_denominators', // Options: like_denominators, unlike_denominators, same_numerator
      minDenominator: 2,
      maxDenominator: 12
    }
  },

  // Conversions
  'conversions_fraction_to_decimal': {
    engine: conversionsEngine,
    params: {
      subType: 'fraction_to_decimal'
    }
  },
  'conversions_decimal_to_fraction_simple': {
    engine: conversionsEngine,
    params: {
      subType: 'decimal_to_fraction',
      complexity: 'simple',
      type: 'mcq',
      minWhole: 0,
      maxWhole: 0
    }
  },
  'conversions_decimal_to_mixed_standard': {
    engine: conversionsEngine,
    params: {
      subType: 'decimal_to_mixed',
      complexity: 'medium',
      type: 'fillInTheBlank',
      minWhole: 1,
      maxWhole: 20
    }
  },
  'conversions_decimal_to_mixed_large': {
    engine: conversionsEngine,
    params: {
      subType: 'decimal_to_mixed',
      complexity: 'medium',
      type: 'mcq',
      minWhole: 100,
      maxWhole: 999
    }
  },
  'conversions_decimal_to_mixed_hundredths': {
    engine: conversionsEngine,
    params: {
      subType: 'decimal_to_mixed',
      complexity: 'hard',
      type: 'mcq',
      minWhole: 1,
      maxWhole: 50
    }
  },

  // Word Problems
  'word_problems_fraction_model': {
    engine: wordProblemsEngine,
    params: {
      subType: 'fraction_model',
      denominatorPool: [2, 3, 4, 5, 6, 8]
    }
  },
  'word_problems_fraction_value': {
    engine: wordProblemsEngine,
    params: {
      subType: 'fraction_value',
      denominatorPool: [2, 3, 4, 5, 6, 8]
    }
  },
  'word_problems_fraction_of_set': {
    engine: wordProblemsEngine,
    params: {
      subType: 'fraction_of_set',
      denominatorPool: [2, 3, 4, 5, 6]
    }
  },

  // Operations
  'operations_add_like_denominators': {
    engine: operationsEngine,
    params: {
      subType: 'add_like_denominators'
    }
  },
  'operations_subtract_like_denominators': {
    engine: operationsEngine,
    params: {
      subType: 'subtract_like_denominators'
    }
  },
  'operations_fraction_of_number': {
    engine: operationsEngine,
    params: {
      subType: 'fraction_of_number'
    }
  },
  'word_problems_fraction_of_number': {
    engine: wordProblemsEngine,
    params: {
      subType: 'fraction_of_number'
    }
  },

  // Rational Numbers (Class 8 / Pre-Algebra)
  'rational_numbers_add_sub': {
    engine: rationalNumbersEngine,
    params: { subType: 'add-and-subtract-rational-numbers' }
  },
  'rational_numbers_add_sub_wp': {
    engine: rationalNumbersEngine,
    params: { subType: 'add-and-subtract-rational-numbers-word-problems' }
  },
  'rational_numbers_compare': {
    engine: rationalNumbersEngine,
    params: { subType: 'compare-rational-numbers' }
  },
  'rational_numbers_convert_decimals_fractions': {
    engine: rationalNumbersEngine,
    params: { subType: 'convert-between-decimals-and-fractions-or-mixed-numbers' }
  },
  'rational_numbers_convert_percents': {
    engine: rationalNumbersEngine,
    params: { subType: 'convert-between-percents-fractions-and-decimals' }
  },
  'rational_numbers_evaluate': {
    engine: rationalNumbersEngine,
    params: { subType: 'evaluate-numerical-expressions-involving-rational-numbers' }
  },
  'rational_numbers_mul_div': {
    engine: rationalNumbersEngine,
    params: { subType: 'multiply-and-divide-rational-numbers' }
  },
  'rational_numbers_mul_div_wp': {
    engine: rationalNumbersEngine,
    params: { subType: 'multiply-and-divide-rational-numbers-word-problems' }
  },
  'rational_numbers_powers': {
    engine: rationalNumbersEngine,
    params: { subType: 'powers-with-decimal-and-fractional-bases' }
  },
  'rational_numbers_order': {
    engine: rationalNumbersEngine,
    params: { subType: 'put-rational-numbers-in-order' }
  },
  'rational_numbers_reciprocals': {
    engine: rationalNumbersEngine,
    params: { subType: 'reciprocals-and-multiplicative-inverses' }
  },
  'rational_numbers_round': {
    engine: rationalNumbersEngine,
    params: { subType: 'round-decimals-and-mixed-numbers' }
  }
};
