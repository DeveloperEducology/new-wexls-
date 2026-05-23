/**
 * Common Measurement Misconceptions and Remediation Guidance
 */

export const MEASUREMENT_MISCONCEPTIONS = {
  // Comparing size
  large_is_heavy: {
    id: 'large_is_heavy',
    description: 'Student believes larger objects are always heavier (e.g. comparing a large balloon to a small rock).',
    guidance: 'An object\'s weight depends on what it is made of, not just how big it is! Think about how a balloon is filled with air, but a small rock is solid stone.',
  },
  tall_is_more: {
    id: 'tall_is_more',
    description: 'Student believes a tall, skinny container always holds more than a short, wide container.',
    guidance: 'Capacity depends on the total volume inside. A short, wide container can often hold just as much, or even more, than a tall, skinny one. Look at the width as well as the height!',
  },
  
  // Non-standard measurement
  leaving_gaps: {
    id: 'leaving_gaps',
    description: 'Leaving gaps between non-standard units (paperclips, cubes) when measuring.',
    guidance: 'When measuring, make sure your units are lined up end-to-end with no gaps and no overlaps. Every space must be covered!',
  },
  overlapping_units: {
    id: 'overlapping_units',
    description: 'Overlapping unit blocks when lining them up next to an object.',
    guidance: 'Units should touch but not overlap. Overlapping them makes the measurement count higher than it really is.',
  },
  
  // Rulers
  not_aligning_zero: {
    id: 'not_aligning_zero',
    description: 'Not lining up the end of the object with the 0 mark on the ruler (starting at 1 instead, or the edge of the ruler).',
    guidance: 'Always line up the starting edge of the object with the 0 mark on the ruler, not the 1 mark or the physical edge of the ruler.',
  },
  counting_ticks_incorrectly: {
    id: 'counting_ticks_incorrectly',
    description: 'Counting ruler markings or tick lines instead of the actual units/intervals.',
    guidance: 'To find the length, count the spaces (intervals) between the numbers, not the vertical lines themselves.',
  },
  fraction_scale_confusion: {
    id: 'fraction_scale_confusion',
    description: 'Confusing 1/4, 1/2, and 3/4 inch intervals.',
    guidance: 'On an inch ruler, the longest tick in the middle of two whole inches is 1/2. The next longest ticks are 1/4 and 3/4. Count how many quarters you have from the last whole number.',
  },

  // Thermometer
  tick_scale_multiplier: {
    id: 'tick_scale_multiplier',
    description: 'Counting every thermometer tick as 1 degree when they represent 2 degrees.',
    guidance: 'Look at the numbers on the thermometer scale. If the numbers jump by 10 and there are 5 ticks between them, each tick represents 2 degrees, not 1!',
  },

  // Conversions
  base_10_bias: {
    id: 'base_10_bias',
    description: 'Adding, subtracting, or carrying over mixed customary units as if they are in base-10 (e.g., carrying over 10 inches instead of 12 inches for feet).',
    guidance: 'Remember that customary units do not use base-10! 1 foot is 12 inches, 1 pound is 16 ounces, and 1 gallon is 4 quarts. Convert or carry over using these exact ratios.',
  },
  square_cubic_linear_bias: {
    id: 'square_cubic_linear_bias',
    description: 'Converting square or cubic units by multiplying by the linear conversion factor instead of its square/cube (e.g. converting 1 sq ft to 12 sq in instead of 144 sq in).',
    guidance: 'When converting square units, you must square the conversion factor (e.g., 1 sq ft = 12 * 12 = 144 sq in). For cubic units, cube it (e.g., 1 cu ft = 12 * 12 * 12 = 1,728 cu in).',
  }
};
