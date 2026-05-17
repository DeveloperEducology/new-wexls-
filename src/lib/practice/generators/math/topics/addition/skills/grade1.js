export const grade1AdditionSkills = [
  {
    id: 'addition-g1-a1-horizontal-to-9',
    code: 'A.1',
    grade: 1,
    topic: 'addition',
    title: 'Addition facts up to 9',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 9],
      layout: 'horizontal'
    }
  },
  {
    id: 'addition-g1-c1-visual-counting-to-10',
    code: 'C.1',
    grade: 1,
    topic: 'addition',
    title: 'Add with cubes up to 10',
    templateId: 'addition.visual.counting',
    config: {
      range: [1, 10]
    }
  },
  {
    id: 'addition-g1-copy-cubes-to-boxes',
    code: 'C.2',
    grade: 1,
    topic: 'addition',
    title: 'Copy cubes into boxes to add',
    templateId: 'addition.visual.copyDice',
    config: {
      prefilledCount: 1,
      copyCountRange: [2, 5]
    }
  },
  {
    id: 'addition-g1-e3-model-match-to-10',
    code: 'E.3',
    grade: 1,
    topic: 'addition',
    title: 'Addition sentences up to 10: which model matches?',
    templateId: 'addition.visual.modelMatch',
    config: {
      range: [1, 10],
      model: 'cubes'
    }
  },
  {
    id: 'addition-g1-v7-picture-sentence-to-5',
    code: 'V.7',
    grade: 1,
    topic: 'addition',
    title: 'Addition sentences up to 5: what does the model show?',
    templateId: 'addition.visual.pictureSentence',
    config: {
      range: [1, 5],
      model: 'cubes'
    }
  },
  {
    id: 'addition-g1-q5-word-sentence-to-10',
    code: 'Q.5',
    grade: 1,
    topic: 'addition',
    title: 'Model and write addition sentences for word problems',
    templateId: 'addition.word.sentence',
    config: {
      range: [1, 10],
      isVisualShow: true
    }
  },
  {
    id: 'addition-g1-q13-sort-facts-sums-to-20',
    code: 'Q.13',
    grade: 1,
    topic: 'addition',
    title: 'Sort addition facts - sums up to 20',
    templateId: 'addition.sort.factsTo20',
    config: {
      range: [1, 20],
      sums: [14, 15, 16]
    }
  },
  {
    id: 'addition-g1-q14-make-number-sums-to-20',
    code: 'Q.14',
    grade: 1,
    topic: 'addition',
    title: 'Make a number using addition - sums up to 20',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 20],
      optionCount: 4
    }
  },
  {
    id: 'addition-g1-r1-word-problems-models-to-20',
    code: 'R.1',
    grade: 1,
    topic: 'addition',
    title: 'Addition word problems with models - sums up to 20',
    templateId: 'addition.word.model.to20',
    config: {
      range: [1, 20],
      model: 'bar'
    }
  }
];
