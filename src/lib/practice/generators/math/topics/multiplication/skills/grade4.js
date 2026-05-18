export const grade4MultiplicationSkills = [
  {
    id: 'multiplication-g4-d1-vertical-4digit-no-carry',
    code: 'D.1',
    grade: 4,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_4digit',
    title: 'Multiply a four-digit number by a one-digit number',
    templateId: 'multiplication.vertical.4digit.by1digit',
    config: {
      topDigits: 4,
      bottomDigits: 1,
      regrouping: false,
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g4-d2-vertical-4digit-carry',
    code: 'D.2',
    grade: 4,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_4digit_regrouping',
    title: 'Multiply a four-digit number by a one-digit number with regrouping',
    templateId: 'multiplication.vertical.4digit.by1digit',
    config: {
      topDigits: 4,
      bottomDigits: 1,
      regrouping: true,
      difficulty: 'hard'
    }
  }
];
