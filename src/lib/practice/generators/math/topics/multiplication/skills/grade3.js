export const grade3MultiplicationSkills = [
  {
    id: 'multiplication-g3-n5-write-sentence-equal-groups',
    code: 'N.5',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_sentences',
    title: 'Write multiplication sentences for equal groups',
    templateId: 'multiplication.visual.equalGroups.sentence',
    config: {
      groupsRange: [2, 5],
      eachRange: [2, 6],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-n6-relate-addition-multiplication-equal-groups',
    code: 'N.6',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_repeated_addition',
    title: 'Relate addition and multiplication for equal groups',
    templateId: 'multiplication.visual.equalGroups.relateAddition',
    config: {
      groupsRange: [2, 5],
      eachRange: [2, 6],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-c1-vertical-3digit-no-carry',
    code: 'C.1',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_3digit',
    title: 'Multiply a three-digit number by a one-digit number',
    templateId: 'multiplication.vertical.3digit.by1digit',
    config: {
      topDigits: 3,
      bottomDigits: 1,
      regrouping: false,
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-c2-vertical-3digit-carry',
    code: 'C.2',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_3digit_regrouping',
    title: 'Multiply a three-digit number by a one-digit number with regrouping',
    templateId: 'multiplication.vertical.3digit.by1digit',
    config: {
      topDigits: 3,
      bottomDigits: 1,
      regrouping: true,
      difficulty: 'hard'
    }
  },
  {
    id: 'multiplication-g3-n7-rabbit-equal-groups',
    code: 'N.7',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_rabbits',
    title: 'Multiplication with equal groups of rabbits',
    templateId: 'multiplication.visual.equalGroups.rabbits',
    config: {
      groups: 4,
      eachRange: [2, 5],
      shape: 'rabbit',
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-g3-n8-penguin-equal-groups',
    code: 'N.8',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_penguins',
    title: 'Multiplication with equal groups of penguins',
    templateId: 'multiplication.visual.equalGroups.penguins',
    config: {
      groupsRange: [2, 4],
      eachRange: [2, 5],
      shape: 'penguin',
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-g3-n9-area-model-cubes',
    code: 'N.9',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_area_modeling_cubes',
    title: 'Area modeling with cubes',
    templateId: 'multiplication.cubes.areaModel',
    config: {
      rowsRange: [3, 6],
      colsRange: [4, 8],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-n10-distributive-property-cubes',
    code: 'N.10',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_distributive_property_cubes',
    title: 'Distributive property with cubes',
    templateId: 'multiplication.cubes.distributiveProperty',
    config: {
      rowsRange: [3, 5],
      colsRange: [5, 9],
      difficulty: 'hard'
    }
  },
  {
    id: 'multiplication-g3-n11-area-grid-rectangle-cubes',
    code: 'N.11',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_area_grid_rectangle_cubes',
    title: 'Count squares in a rectangle grid',
    templateId: 'multiplication.cubes.areaGridRectangle',
    config: {
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-n12-fill-grid-cubes',
    code: 'N.12',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_fill_grid_cubes',
    title: 'Fill a rectangle grid with cubes',
    templateId: 'multiplication.cubes.areaGridRectangleFill',
    config: {
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-n13-number-line-equations',
    code: 'N.13',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_number_line_equations',
    title: 'Write multiplication equations shown on number line',
    templateId: 'multiplication.numberLine.identify',
    config: {
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-n14-dot-array-modeling',
    code: 'N.14',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_dot_array_modeling',
    title: 'Multiplication dot arrays',
    templateId: 'multiplication.cubes.dotArray',
    config: {
      rowsRange: [2, 5],
      colsRange: [2, 6],
      difficulty: 'medium'
    }
  }
];
