/**
 * Theory for Measurement Chapter (Pre-K to Geometry / Science level)
 */

export const measurementTheory = {
  title: "Measurement: Understanding and Comparing Physical Attributes",
  description: "Measurement is the process of finding the size, length, height, weight, capacity, or temperature of an object. It allows us to compare objects using standard units (like inches and centimeters) or non-standard units (like paperclips and cubes).",
  key_points: [
    "Measurable attributes include length, height, width, weight, capacity, temperature, area, volume, and density.",
    "Non-standard measurement: Objects must be aligned end-to-end with no gaps and no overlaps.",
    "Ruler measurement: Always align the starting edge of the object with the 0 mark on the ruler.",
    "Customary systems are based on historic standards (inches, feet, yards, miles, pounds, gallons). They do not use base-10.",
    "Metric systems are based on powers of 10, using prefixes like milli- (1/1000), centi- (1/100), and kilo- (1000).",
    "Precision is determined by the smallest unit of measurement on a tool. The greatest possible error (GPE) is half of that unit."
  ],
  vocabulary: [
    {
      term: "Length",
      definition: "The distance from one end of an object to the other."
    },
    {
      term: "Capacity",
      definition: "The amount of liquid a container can hold (also known as liquid volume)."
    },
    {
      term: "Weight / Mass",
      definition: "A measure of how heavy an object is."
    },
    {
      term: "Standard Unit",
      definition: "An agreed-upon unit of measure, such as centimeters, meters, inches, feet, grams, or liters."
    },
    {
      term: "Non-standard Unit",
      definition: "Any object (like paperclips, crayons, or hands) used to measure length or height."
    },
    {
      term: "Precision",
      definition: "How detailed a measurement is, determined by the smallest division on the measuring tool."
    },
    {
      term: "Greatest Possible Error (GPE)",
      definition: "Half of the smallest unit of measurement on the scale."
    }
  ],
  examples: [
    {
      question: "Line A is measured using paperclips. There are 4 paperclips lined up end-to-end with no gaps. How long is Line A?",
      solution: "Each paperclip represents 1 unit. Since there are 4 paperclips lined up without gaps, the length of Line A is 4 paperclips."
    },
    {
      question: "A pencil is lined up with an inch ruler. One end is at the 0 mark and the other end reaches the mark halfway between 4 and 5. What is the length of the pencil?",
      solution: "1. Locate the whole numbers 4 and 5 on the ruler.\n2. The point halfway between 4 and 5 represents 1/2.\n3. Therefore, the pencil is 4 1/2 inches long."
    },
    {
      question: "Convert 5 yards into feet.",
      solution: "1. We know that 1 yard = 3 feet.\n2. Since yards are larger than feet, we multiply the number of yards by 3.\n3. 5 yards * 3 feet/yard = 15 feet."
    },
    {
      question: "A thermometer scale has major labels every 10 degrees (70, 80, 90). Between 70 and 80, there are 5 subdivisions. The liquid level is 3 subdivisions above 70. What temperature does it show?",
      solution: "1. Find the value of each subdivision: (80 - 70) / 5 subdivisions = 2 degrees per mark.\n2. Count up from 70 by twos: 70 + (3 subdivisions * 2 degrees) = 76 degrees."
    },
    {
      question: "An object is measured to be 6.4 centimeters long. What is the greatest possible error of this measurement?",
      solution: "1. The measurement is given to the nearest tenth of a centimeter (0.1 cm).\n2. The greatest possible error (GPE) is half of the precision increment.\n3. GPE = 0.5 * 0.1 cm = 0.05 cm."
    }
  ],
  misconceptions: [
    {
      code: "not_aligning_zero",
      title: "Ruler Alignment Mistake",
      description: "Lining up the start of the object with the 1 mark or the physical edge of the ruler instead of the 0 mark."
    },
    {
      code: "base_10_bias",
      title: "Base-10 Arithmetic Bias in Mixed Units",
      description: "Adding or subtracting mixed customary units (like feet and inches) as if they carry over at 10 instead of 12."
    },
    {
      code: "square_cubic_linear_bias",
      title: "Linear Factor Bias in Square/Cubic Conversions",
      description: "Multiplying square or cubic units by the linear factor (e.g. converting square yards to square feet by multiplying by 3 instead of 9)."
    }
  ],
  learning_path: [
    "Direct comparative measurement of attributes (Pre-K to Kindergarten)",
    "Non-standard measurement with cubes and items (Grade 1 to 2)",
    "Ruler reading to the nearest whole, half, and quarter unit (Grade 2 to 3)",
    "Reading scales, thermometers, and volume cups (Grade 3)",
    "Customary and metric unit conversions using tables (Grade 4)",
    "Fractional and mixed unit arithmetic (Grade 5 to 6)",
    "Double conversions and rate conversions (Grade 7 to 8)",
    "Precision, error bounds, and percent error (Algebra 1)",
    "Square/cubic dimensional analysis and density (Geometry & Advanced)"
  ]
};
