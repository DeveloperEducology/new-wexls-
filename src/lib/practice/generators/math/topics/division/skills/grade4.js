export const grade4DivisionSkills = [
  {
    id: 'division-g4-b1-long-div-2digit',
    code: 'B.1',
    grade: 4,
    topic: 'division',
    competencyId: 'division_long_div_2d',
    title: 'Divide 2-digit numbers by 1-digit numbers',
    templateId: 'division.numbers.horizontal',
    config: {
      range: [10, 99],
      supportRemainder: false
    }
  },
  {
    id: 'division-g4-b2-long-div-remainder',
    code: 'B.2',
    grade: 4,
    topic: 'division',
    competencyId: 'division_remainders',
    title: 'Divide 2-digit numbers by 1-digit numbers with remainders',
    templateId: 'division.numbers.horizontal',
    config: {
      range: [10, 99],
      supportRemainder: true
    }
  },
  {
    id: 'division-g4-b3-long-div-3digit',
    code: 'B.3',
    grade: 4,
    topic: 'division',
    competencyId: 'division_long_div_3d',
    title: 'Divide 3-digit numbers by 1-digit numbers',
    templateId: 'division.numbers.horizontal',
    config: {
      range: [100, 999],
      supportRemainder: true
    }
  },
  {
    id: 'division-g4-b4-word-problems',
    code: 'B.4',
    grade: 4,
    topic: 'division',
    competencyId: 'division_word_problems_large',
    title: 'Division word problems with larger numbers',
    templateId: 'division.word.sentence',
    config: {
      range: [50, 500]
    }
  }
];
