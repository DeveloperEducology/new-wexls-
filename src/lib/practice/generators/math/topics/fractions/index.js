import { fractionsV2Registry } from './registry.js';

// Helper to get the base template configuration from registry
export function getFractionsV2TemplateConfig(logicType) {
  const engineConfig = fractionsV2Registry[logicType];
  if (!engineConfig) return null;
  
  return {
    logic_type: logicType,
    type: (logicType.includes('identify') || logicType.includes('visual_compare') || logicType.includes('properties') || logicType.includes('equivalence_number_line') || logicType.includes('decompose') || logicType.includes('build_from_words') || logicType.includes('count_unit_fraction')) ? 'mcq' : 
          logicType.includes('sorting') ? 'sorting' : 'fillInTheBlank', // Default mapping
    engineParams: engineConfig.params,
    adaptiveConfig: {
      logic_type: logicType
    }
  };
}

// Main entry point for any fractions v2 skill
export function generateFractionsV2Question(templateConfig) {
  const logicType = templateConfig.logic_type 
    || templateConfig.adaptiveConfig?.logic_type
    || templateConfig.template_id; // fallback

  const engineConfig = fractionsV2Registry[logicType];

  if (!engineConfig) {
    throw new Error(`[FractionsV2] No engine registered for logicType: ${logicType}`);
  }

  // Merge parameters: Registry defaults < Template overrides
  const mergedParams = {
    ...(engineConfig.params || {}),
    ...(templateConfig.engineParams || {}),
    ...(templateConfig.engine_params || {})
  };

  // Call the specific engine family with the merged parameters
  return engineConfig.engine({
    ...templateConfig,
    engineParams: mergedParams
  });
}

// Export the generators object for the main math registry
export const fractionsV2Generators = {
  'fractions-g5-add-subtract-unlike-denominators': generateFractionsV2Question,
  'fractions.unlikeDenominators.addSubtract': generateFractionsV2Question,
  'visual_models_identify': generateFractionsV2Question,
  'visual_models_write_fraction': generateFractionsV2Question,
  'visual_models_equal_parts': generateFractionsV2Question,
  'visual_models_fraction_of_set': generateFractionsV2Question,
  'visual_models_mixed_numbers': generateFractionsV2Question,
  'visual_models_remove_fraction_pie': generateFractionsV2Question,
  'visual_models_remove_fraction_square': generateFractionsV2Question,
  'visual_models_remove_fraction_rectangle': generateFractionsV2Question,
  'visual_models_remove_fraction_bar': generateFractionsV2Question,
  'visual_models_fill_fraction_pie': generateFractionsV2Question,
  'visual_models_fill_fraction_square': generateFractionsV2Question,
  'visual_models_fill_fraction_rectangle': generateFractionsV2Question,
  'visual_models_cut_rectangle_fourths': generateFractionsV2Question,
  'visual_models_cut_circle_fourths': generateFractionsV2Question,
  'visual_models_cut_rectangle_halves_different': generateFractionsV2Question,
  'visual_models_cut_rectangle_thirds': generateFractionsV2Question,
  'visual_models_cut_circle_thirds': generateFractionsV2Question,
  'visual_models_cut_circle_sixths': generateFractionsV2Question,
  'fractions_decompose_into_unit_fractions': generateFractionsV2Question,
  'fractions_decompose_missing_unit_fraction': generateFractionsV2Question,
  'fractions_decompose_select_all_sums': generateFractionsV2Question,
  'fractions_build_from_words': generateFractionsV2Question,
  'fractions_decompose_error_analysis': generateFractionsV2Question,
  'fractions_count_unit_fraction_pieces': generateFractionsV2Question,
  'fractions_decompose_puzzle_style': generateFractionsV2Question,
  'number_lines_identify': generateFractionsV2Question,
  'number_lines_graph': generateFractionsV2Question,
  'equivalence_number_line': generateFractionsV2Question,
  'equivalence_simplify': generateFractionsV2Question,
  'equivalence_identify_equivalent': generateFractionsV2Question,
  'equivalence_missing_value': generateFractionsV2Question,
  'equivalence_patterns': generateFractionsV2Question,
  'conversions_fraction_to_decimal': generateFractionsV2Question,
  'conversions_decimal_to_fraction_simple': generateFractionsV2Question,
  'conversions_decimal_to_mixed_standard': generateFractionsV2Question,
  'conversions_decimal_to_mixed_large': generateFractionsV2Question,
  'conversions_decimal_to_mixed_hundredths': generateFractionsV2Question,
  'word_problems_fraction_model': generateFractionsV2Question,
  'word_problems_fraction_value': generateFractionsV2Question,
  'word_problems_fraction_of_set': generateFractionsV2Question,
  'word_problems_fraction_of_number': generateFractionsV2Question,
  'operations_add_like_denominators': generateFractionsV2Question,
  'operations_subtract_like_denominators': generateFractionsV2Question,
  'operations_fraction_of_number': generateFractionsV2Question,
  'comparison_visual_compare': generateFractionsV2Question,
  'comparison_sorting_fractions': generateFractionsV2Question,
  
  // Rational Numbers
  'rational_numbers_add_sub': generateFractionsV2Question,
  'rational_numbers_add_sub_wp': generateFractionsV2Question,
  'rational_numbers_compare': generateFractionsV2Question,
  'rational_numbers_convert_decimals_fractions': generateFractionsV2Question,
  'rational_numbers_convert_percents': generateFractionsV2Question,
  'rational_numbers_evaluate': generateFractionsV2Question,
  'rational_numbers_mul_div': generateFractionsV2Question,
  'rational_numbers_mul_div_wp': generateFractionsV2Question,
  'rational_numbers_powers': generateFractionsV2Question,
  'rational_numbers_order': generateFractionsV2Question,
  'rational_numbers_reciprocals': generateFractionsV2Question,
  'rational_numbers_round': generateFractionsV2Question,

  // Fractions Identify Visual
  'fractions.identify.visual': generateFractionsV2Question,
  'fractions-g2-identify-visual': generateFractionsV2Question,

  // Like & Unlike
  'fractions.compare.likeUnlike': generateFractionsV2Question,
  'fractions.identify.likeFractions': generateFractionsV2Question,
  'fractions.identify.unlikeFractions': generateFractionsV2Question,
  'fractions-g3-like-unlike': generateFractionsV2Question,

  // Types of Fractions
  'fractions.types.proper': generateFractionsV2Question,
  'fractions.types.improper': generateFractionsV2Question,
  'fractions.types.mixed': generateFractionsV2Question,
  'fractions.types.identify': generateFractionsV2Question,
  'fractions-g3-types': generateFractionsV2Question,

  // Grade 5 Conversions
  'fractions.conversion.improperToMixed': generateFractionsV2Question,
  'fractions-g5-convert-improper-to-mixed': generateFractionsV2Question,
  'fractions.conversion.mixedToImproper': generateFractionsV2Question,
  'fractions-g5-convert-mixed-to-improper': generateFractionsV2Question,

  // Grade 5 Comparison
  'fractions.compare.likeFractions': generateFractionsV2Question,
  'fractions-g5-compare-like-fractions': generateFractionsV2Question,
  'fractions.compare.unlikeFractions': generateFractionsV2Question,
  'fractions-g5-compare-unlike-fractions': generateFractionsV2Question,
  'fractions.compare.properFractions': generateFractionsV2Question,
  'fractions-g5-compare-proper-fractions': generateFractionsV2Question,

  // Grade 5 Operations / Addition
  'fractions.addition.likeFractions': generateFractionsV2Question,
  'fractions-g5-add-like-fractions': generateFractionsV2Question,
  'fractions.addition.improperFractions': generateFractionsV2Question,
  'fractions-g5-add-improper-fractions': generateFractionsV2Question,
  'fractions.addition.fractionAndInteger': generateFractionsV2Question,
  'fractions-g5-add-fraction-and-integer': generateFractionsV2Question,
  'fractions.addition.missingFractionAddend': generateFractionsV2Question,
  'fractions-g5-missing-fraction-addend': generateFractionsV2Question,
  'fractions.addition.missingIntegerAddend': generateFractionsV2Question,
  'fractions-g5-missing-integer-addend': generateFractionsV2Question,
  'fractions.addition.multipleFractions': generateFractionsV2Question,
  'fractions-g5-add-multiple-fractions': generateFractionsV2Question
};

// We will also export specific template IDs here as we build them
