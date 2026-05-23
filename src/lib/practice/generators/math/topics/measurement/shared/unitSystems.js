/**
 * Shared Unit Systems and Configurations
 */

export const MEASUREMENT_SYSTEMS = {
  CUSTOMARY: 'customary',
  METRIC: 'metric',
  TEMPERATURE: 'temperature',
  ADVANCED: 'advanced',
};

export const MEASUREMENT_ATTRIBUTES = {
  LENGTH: 'length',
  WEIGHT: 'weight', // used interchangeably with Mass in school curriculum
  MASS: 'mass',
  CAPACITY: 'capacity', // used interchangeably with Volume
  VOLUME: 'volume',
  TEMPERATURE: 'temperature',
  AREA: 'area',
  DENSITY: 'density',
};

export const UNITS = {
  // Customary Length
  in: { id: 'in', symbol: 'in', name: 'inch', plural: 'inches', system: 'customary', attribute: 'length', baseValueInInches: 1 },
  ft: { id: 'ft', symbol: 'ft', name: 'foot', plural: 'feet', system: 'customary', attribute: 'length', baseValueInInches: 12 },
  yd: { id: 'yd', symbol: 'yd', name: 'yard', plural: 'yards', system: 'customary', attribute: 'length', baseValueInInches: 36 },
  mi: { id: 'mi', symbol: 'mi', name: 'mile', plural: 'miles', system: 'customary', attribute: 'length', baseValueInInches: 63360 },

  // Customary Weight
  oz: { id: 'oz', symbol: 'oz', name: 'ounce', plural: 'ounces', system: 'customary', attribute: 'weight', baseValueInOunces: 1 },
  lb: { id: 'lb', symbol: 'lb', name: 'pound', plural: 'pounds', system: 'customary', attribute: 'weight', baseValueInOunces: 16 },
  tn: { id: 'tn', symbol: 'T', name: 'ton', plural: 'tons', system: 'customary', attribute: 'weight', baseValueInOunces: 32000 },

  // Customary Capacity
  fl_oz: { id: 'fl_oz', symbol: 'fl oz', name: 'fluid ounce', plural: 'fluid ounces', system: 'customary', attribute: 'capacity', baseValueInFlOz: 1 },
  c: { id: 'c', symbol: 'c', name: 'cup', plural: 'cups', system: 'customary', attribute: 'capacity', baseValueInFlOz: 8 },
  pt: { id: 'pt', symbol: 'pt', name: 'pint', plural: 'pints', system: 'customary', attribute: 'capacity', baseValueInFlOz: 16 },
  qt: { id: 'qt', symbol: 'qt', name: 'quart', plural: 'quarts', system: 'customary', attribute: 'capacity', baseValueInFlOz: 32 },
  gal: { id: 'gal', symbol: 'gal', name: 'gallon', plural: 'gallons', system: 'customary', attribute: 'capacity', baseValueInFlOz: 128 },

  // Metric Length
  mm: { id: 'mm', symbol: 'mm', name: 'millimeter', plural: 'millimeters', system: 'metric', attribute: 'length', baseValueInMeters: 0.001 },
  cm: { id: 'cm', symbol: 'cm', name: 'centimeter', plural: 'centimeters', system: 'metric', attribute: 'length', baseValueInMeters: 0.01 },
  m: { id: 'm', symbol: 'm', name: 'meter', plural: 'meters', system: 'metric', attribute: 'length', baseValueInMeters: 1 },
  km: { id: 'km', symbol: 'km', name: 'kilometer', plural: 'kilometers', system: 'metric', attribute: 'length', baseValueInMeters: 1000 },

  // Metric Mass
  mg: { id: 'mg', symbol: 'mg', name: 'milligram', plural: 'milligrams', system: 'metric', attribute: 'mass', baseValueInGrams: 0.001 },
  g: { id: 'g', symbol: 'g', name: 'gram', plural: 'grams', system: 'metric', attribute: 'mass', baseValueInGrams: 1 },
  kg: { id: 'kg', symbol: 'kg', name: 'kilogram', plural: 'kilograms', system: 'metric', attribute: 'mass', baseValueInGrams: 1000 },

  // Metric Capacity
  ml: { id: 'ml', symbol: 'ml', name: 'milliliter', plural: 'milliliters', system: 'metric', attribute: 'capacity', baseValueInLiters: 0.001 },
  l: { id: 'l', symbol: 'l', name: 'liter', plural: 'liters', system: 'metric', attribute: 'capacity', baseValueInLiters: 1 },

  // Temperature
  F: { id: 'F', symbol: '°F', name: 'Fahrenheit', plural: 'degrees Fahrenheit', system: 'temperature', attribute: 'temperature' },
  C: { id: 'C', symbol: '°C', name: 'Celsius', plural: 'degrees Celsius', system: 'temperature', attribute: 'temperature' },
};

export const COMMON_OBJECTS = {
  length: [
    { name: 'paperclip', averageSize: { customary: { value: 1.5, unit: 'in' }, metric: { value: 4, unit: 'cm' } } },
    { name: 'pencil', averageSize: { customary: { value: 7, unit: 'in' }, metric: { value: 18, unit: 'cm' } } },
    { name: 'crayon', averageSize: { customary: { value: 3.5, unit: 'in' }, metric: { value: 9, unit: 'cm' } } },
    { name: 'toothbrush', averageSize: { customary: { value: 7, unit: 'in' }, metric: { value: 18, unit: 'cm' } } },
    { name: 'book', averageSize: { customary: { value: 10, unit: 'in' }, metric: { value: 25, unit: 'cm' } } },
    { name: 'bicycle', averageSize: { customary: { value: 5, unit: 'ft' }, metric: { value: 1.5, unit: 'm' } } },
    { name: 'car', averageSize: { customary: { value: 15, unit: 'ft' }, metric: { value: 4.5, unit: 'm' } } },
    { name: 'tree', averageSize: { customary: { value: 30, unit: 'ft' }, metric: { value: 9, unit: 'm' } } },
    { name: 'swimming pool length', averageSize: { customary: { value: 25, unit: 'yd' }, metric: { value: 25, unit: 'm' } } },
  ],
  weight: [
    { name: 'feather', averageSize: { customary: { value: 0.008, unit: 'oz' }, metric: { value: 0.2, unit: 'g' } } },
    { name: 'penny', averageSize: { customary: { value: 0.1, unit: 'oz' }, metric: { value: 2.5, unit: 'g' } } },
    { name: 'apple', averageSize: { customary: { value: 6, unit: 'oz' }, metric: { value: 170, unit: 'g' } } },
    { name: 'book', averageSize: { customary: { value: 2, unit: 'lb' }, metric: { value: 1, unit: 'kg' } } },
    { name: 'cat', averageSize: { customary: { value: 10, unit: 'lb' }, metric: { value: 4.5, unit: 'kg' } } },
    { name: 'adult', averageSize: { customary: { value: 150, unit: 'lb' }, metric: { value: 70, unit: 'kg' } } },
    { name: 'car', averageSize: { customary: { value: 1.5, unit: 'tn' }, metric: { value: 1400, unit: 'kg' } } },
    { name: 'elephant', averageSize: { customary: { value: 6, unit: 'tn' }, metric: { value: 5400, unit: 'kg' } } },
  ],
  capacity: [
    { name: 'teaspoon', averageSize: { customary: { value: 0.16, unit: 'fl_oz' }, metric: { value: 5, unit: 'ml' } } },
    { name: 'soda can', averageSize: { customary: { value: 12, unit: 'fl_oz' }, metric: { value: 355, unit: 'ml' } } },
    { name: 'juice box', averageSize: { customary: { value: 6.7, unit: 'fl_oz' }, metric: { value: 200, unit: 'ml' } } },
    { name: 'milk carton (school)', averageSize: { customary: { value: 1, unit: 'c' }, metric: { value: 240, unit: 'ml' } } },
    { name: 'water bottle', averageSize: { customary: { value: 16.9, unit: 'fl_oz' }, metric: { value: 500, unit: 'ml' } } },
    { name: 'soup bowl', averageSize: { customary: { value: 2, unit: 'c' }, metric: { value: 470, unit: 'ml' } } },
    { name: 'milk jug', averageSize: { customary: { value: 1, unit: 'gal' }, metric: { value: 3.8, unit: 'l' } } },
    { name: 'bathtub', averageSize: { customary: { value: 40, unit: 'gal' }, metric: { value: 150, unit: 'l' } } },
  ]
};
