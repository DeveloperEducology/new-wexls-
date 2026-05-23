/**
 * Shared Measurement Conversions & Formulas
 */

import { UNITS } from './unitSystems.js';

// Customary Conversion Factors (relative to the base unit of the attribute)
// Length Base: inch
export const CUSTOMARY_LENGTH_CONVERSIONS = {
  in: 1,
  ft: 12,
  yd: 36,
  mi: 63360,
};

// Weight Base: ounce
export const CUSTOMARY_WEIGHT_CONVERSIONS = {
  oz: 1,
  lb: 16,
  tn: 32000,
};

// Capacity Base: fluid ounce (fl_oz)
export const CUSTOMARY_CAPACITY_CONVERSIONS = {
  fl_oz: 1,
  c: 8,
  pt: 16,
  qt: 32,
  gal: 128,
};

// Metric Conversion Factors (relative to base unit: meters, grams, liters)
export const METRIC_PREFIXES = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  mg: 0.001,
  g: 1,
  kg: 1000,
  ml: 0.001,
  l: 1,
};

/**
 * Temperature Conversions
 */
export function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f) {
  return ((f - 32) * 5) / 9;
}

/**
 * Customary Linear Conversion
 */
export function convertCustomary(value, fromUnitId, toUnitId) {
  const fromUnit = UNITS[fromUnitId];
  const toUnit = UNITS[toUnitId];
  if (!fromUnit || !toUnit || fromUnit.attribute !== toUnit.attribute) {
    throw new Error(`Incompatible units for customary conversion: ${fromUnitId} to ${toUnitId}`);
  }

  let baseVal;
  if (fromUnit.attribute === 'length') {
    baseVal = value * CUSTOMARY_LENGTH_CONVERSIONS[fromUnitId];
    return baseVal / CUSTOMARY_LENGTH_CONVERSIONS[toUnitId];
  } else if (fromUnit.attribute === 'weight') {
    baseVal = value * CUSTOMARY_WEIGHT_CONVERSIONS[fromUnitId];
    return baseVal / CUSTOMARY_WEIGHT_CONVERSIONS[toUnitId];
  } else if (fromUnit.attribute === 'capacity') {
    baseVal = value * CUSTOMARY_CAPACITY_CONVERSIONS[fromUnitId];
    return baseVal / CUSTOMARY_CAPACITY_CONVERSIONS[toUnitId];
  }
  return value;
}

/**
 * Metric Linear Conversion
 */
export function convertMetric(value, fromUnitId, toUnitId) {
  const fromUnit = UNITS[fromUnitId];
  const toUnit = UNITS[toUnitId];
  if (!fromUnit || !toUnit || fromUnit.attribute !== toUnit.attribute) {
    throw new Error(`Incompatible units for metric conversion: ${fromUnitId} to ${toUnitId}`);
  }

  const fromFactor = METRIC_PREFIXES[fromUnitId];
  const toFactor = METRIC_PREFIXES[toUnitId];
  return (value * fromFactor) / toFactor;
}

/**
 * Convert Customary and Metric systems
 * Approximate conversion ratios
 */
export const SYSTEM_CONVERSION_FACTORS = {
  // customary to metric
  'in_to_cm': 2.54,
  'cm_to_in': 1 / 2.54,
  'ft_to_m': 0.3048,
  'm_to_ft': 1 / 0.3048,
  'yd_to_m': 0.9144,
  'm_to_yd': 1 / 0.9144,
  'mi_to_km': 1.60934,
  'km_to_mi': 1 / 1.60934,
  'oz_to_g': 28.3495,
  'g_to_oz': 1 / 28.3495,
  'lb_to_kg': 0.453592,
  'kg_to_lb': 1 / 0.453592,
  'gal_to_l': 3.78541,
  'l_to_gal': 1 / 3.78541,
  'qt_to_l': 0.946353,
  'l_to_qt': 1 / 0.946353,
  'c_to_ml': 240,
  'ml_to_c': 1 / 240,
};

export function convertBetweenSystems(value, fromUnitId, toUnitId) {
  const key = `${fromUnitId}_to_${toUnitId}`;
  if (SYSTEM_CONVERSION_FACTORS[key]) {
    return value * SYSTEM_CONVERSION_FACTORS[key];
  }
  
  // Fallback: convert to base units first, then approximate, then convert to target
  // (Usually we use direct mappings, so this handles common textbook cases)
  throw new Error(`Conversion not directly supported: ${fromUnitId} to ${toUnitId}`);
}

/**
 * Mixed Customary Units Helpers (e.g. Feet and Inches)
 */
export function simplifyMixedCustomary(totalValue, baseUnitId, parentUnitId) {
  const baseInParent = convertCustomary(1, parentUnitId, baseUnitId);
  const parentVal = Math.floor(totalValue / baseInParent);
  const baseVal = totalValue % baseInParent;
  return { parentVal, baseVal };
}

export function toTotalBaseCustomary(parentValue, baseValue, baseUnitId, parentUnitId) {
  const parentInBase = convertCustomary(parentValue, parentUnitId, baseUnitId);
  return parentInBase + baseValue;
}
