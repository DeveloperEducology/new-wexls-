export const grade2SubtractionSkills = [
  {
    id: 'subtraction-g2-b1-vertical-10-99',
    code: 'B.1',
    grade: 2,
    topic: 'subtraction',
    competencyId: 'two_digit_subtraction_no_regrouping',
    title: 'Subtract two-digit numbers vertically',
    templateId: 'subtraction.numbers.vertical',
    config: {
      range: [10, 99],
      layout: 'vertical',
      regrouping: false
    }
  },
  {
    id: 'subtraction-g2-b2-vertical-regrouping',
    code: 'B.2',
    grade: 2,
    topic: 'subtraction',
    competencyId: 'two_digit_subtraction_with_regrouping',
    title: 'Subtract two-digit numbers with regrouping',
    templateId: 'subtraction.numbers.vertical',
    config: {
      range: [10, 99],
      layout: 'vertical',
      regrouping: true
    }
  },
  {
    id: 'subtraction-g2-mental-to-100',
    code: 'M.1',
    grade: 2,
    topic: 'subtraction',
    competencyId: 'mental_subtraction_strategies',
    title: 'Mental subtraction strategies - up to 100',
    templateId: 'subtraction.numbers.horizontal',
    config: {
      range: [10, 100],
      layout: 'horizontal'
    }
  },
  {
    id: 'subtraction-g2-missing-number-to-20',
    code: 'G.1',
    grade: 2,
    topic: 'subtraction',
    competencyId: 'unknown_minuend_to_20',
    title: 'Find the missing number in subtraction equations up to 20',
    templateId: 'subtraction.numbers.horizontal',
    config: {
      range: [1, 20],
      layout: 'horizontal',
      unknownPosition: 'minuend'
    }
  },
  {
    id: 'subtraction-g2-word-problems-to-100',
    code: 'W.1',
    grade: 2,
    topic: 'subtraction',
    competencyId: 'subtraction_word_problems',
    title: 'Subtraction word problems up to 100',
    templateId: 'subtraction.word.sentence',
    config: {
      range: [10, 100]
    }
  }
];
