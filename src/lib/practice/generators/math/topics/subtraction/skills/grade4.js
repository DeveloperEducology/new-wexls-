export const grade4SubtractionSkills = [
  {
    id: 'subtraction-g4-b1-vertical-1000-9999',
    code: 'B.1',
    grade: 4,
    topic: 'subtraction',
    competencyId: 'four_digit_subtraction_no_regrouping',
    title: 'Subtract multi-digit numbers vertically',
    templateId: 'subtraction.numbers.vertical',
    config: {
      range: [1000, 9999],
      layout: 'vertical',
      regrouping: false
    }
  },
  {
    id: 'subtraction-g4-b2-vertical-regrouping',
    code: 'B.2',
    grade: 4,
    topic: 'subtraction',
    competencyId: 'four_digit_subtraction_with_regrouping',
    title: 'Subtract multi-digit numbers with regrouping',
    templateId: 'subtraction.numbers.vertical',
    config: {
      range: [1000, 9999],
      layout: 'vertical',
      regrouping: true
    }
  },
  {
    id: 'subtraction-g4-mental-to-10000',
    code: 'M.1',
    grade: 4,
    topic: 'subtraction',
    competencyId: 'four_digit_mental_subtraction',
    title: 'Mental subtraction strategies - up to 10000',
    templateId: 'subtraction.numbers.horizontal',
    config: {
      range: [1000, 10000],
      layout: 'horizontal'
    }
  }
];
