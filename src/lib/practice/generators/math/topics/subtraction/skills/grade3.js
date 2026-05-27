export const grade3SubtractionSkills = [
  {
    id: 'subtraction-g3-b1-vertical-100-999',
    code: 'B.1',
    grade: 3,
    topic: 'subtraction',
    competencyId: 'three_digit_subtraction_no_regrouping',
    title: 'Subtract three-digit numbers vertically',
    templateId: 'subtraction.numbers.vertical',
    config: {
      range: [100, 999],
      layout: 'vertical',
      regrouping: false
    }
  },
  {
    id: 'subtraction-g3-b2-vertical-regrouping',
    code: 'B.2',
    grade: 3,
    topic: 'subtraction',
    competencyId: 'three_digit_subtraction_with_regrouping',
    title: 'Subtract three-digit numbers with regrouping',
    templateId: 'subtraction.numbers.vertical',
    config: {
      range: [100, 999],
      layout: 'vertical',
      regrouping: true
    }
  },
  {
    id: 'subtraction-g3-mental-to-1000',
    code: 'M.1',
    grade: 3,
    topic: 'subtraction',
    competencyId: 'three_digit_mental_subtraction',
    title: 'Mental subtraction strategies - up to 1000',
    templateId: 'subtraction.numbers.horizontal',
    config: {
      range: [100, 1000],
      layout: 'horizontal'
    }
  },
  {
    id: 'subtraction-g3-word-problems-to-1000',
    code: 'W.1',
    grade: 3,
    topic: 'subtraction',
    competencyId: 'three_digit_subtraction_word_problems',
    title: 'Subtraction word problems up to 1000',
    templateId: 'subtraction.word.sentence',
    config: {
      range: [100, 1000]
    }
  }
];
