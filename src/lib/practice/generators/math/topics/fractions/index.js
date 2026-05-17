import { fractionsV2Registry } from './registry.js';

// Helper to get the base template configuration from registry
export function getFractionsV2TemplateConfig(logicType) {
  const engineConfig = fractionsV2Registry[logicType];
  if (!engineConfig) return null;
  
  return {
    logic_type: logicType,
    type: (logicType.includes('identify') || logicType.includes('visual_compare') || logicType.includes('properties')) ? 'mcq' : 
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
  'visual_models_identify': generateFractionsV2Question,
  'visual_models_equal_parts': generateFractionsV2Question,
  'visual_models_fraction_of_set': generateFractionsV2Question,
  'visual_models_mixed_numbers': generateFractionsV2Question,
  'number_lines_identify': generateFractionsV2Question,
  'number_lines_graph': generateFractionsV2Question,
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

  // Geometry
};

// We will also export specific template IDs here as we build them
