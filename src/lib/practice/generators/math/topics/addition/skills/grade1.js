export const grade1AdditionSkills = [
  {
    id: 'addition-g1-a1-horizontal-to-9',
    code: 'A.1',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_facts_to_10',
    title: 'Addition facts up to 9',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 9],
      layout: 'horizontal'
    }
  },
  {
    id: 'addition-g1-counting-on-to-20',
    code: 'A.2',
    grade: 1,
    topic: 'addition',
    competencyId: 'counting_on',
    title: 'Add by counting on - sums up to 20',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 10],
      layout: 'horizontal',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-g1-one-more-to-20',
    code: 'A.3',
    grade: 1,
    topic: 'addition',
    competencyId: 'one_more',
    title: 'One more - sums up to 20',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 19],
      fixedAddend: 1,
      layout: 'horizontal',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-g1-two-more-to-20',
    code: 'A.4',
    grade: 1,
    topic: 'addition',
    competencyId: 'two_more',
    title: 'Two more - sums up to 20',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 18],
      fixedAddend: 2,
      layout: 'horizontal',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-g1-c1-visual-counting-to-10',
    code: 'C.1',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_models_to_10',
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
    competencyId: 'addition_models_to_10',
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
    competencyId: 'addition_models_to_10',
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
    competencyId: 'addition_models_to_10',
    title: 'Addition sentences up to 5: what does the model show?',
    templateId: 'addition.visual.pictureSentence',
    config: {
      range: [1, 5],
      model: 'cubes'
    }
  },
  {
    id: 'addition-g1-visual-quantities-to-10',
    code: 'V.8',
    grade: 1,
    topic: 'addition',
    competencyId: 'visual_quantities',
    title: 'Add visual quantities up to 10',
    templateId: 'addition.visual.modelMatch',
    config: {
      range: [1, 10],
      model: 'cubes',
      optionCount: 2
    }
  },
  {
    id: 'addition-g1-part-part-whole-to-10',
    code: 'P.1',
    grade: 1,
    topic: 'addition',
    competencyId: 'part_part_whole',
    title: 'Part-part-whole models - sums up to 10',
    templateId: 'addition.word.model.to20',
    config: {
      range: [1, 10],
      model: 'bar',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-g1-number-bonds-to-10',
    code: 'P.2',
    grade: 1,
    topic: 'addition',
    competencyId: 'number_bonds',
    title: 'Number bonds - sums up to 10',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 10],
      optionCount: 4
    }
  },
  {
    id: 'addition-g1-q5-word-sentence-to-10',
    code: 'Q.5',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_word_problems_to_20',
    title: 'Model and write addition sentences for word problems',
    templateId: 'addition.word.sentence',
    config: {
      range: [1, 10],
      isVisualShow: true
    }
  },
  {
    id: 'addition-g1-equation-representation-to-10',
    code: 'Q.6',
    grade: 1,
    topic: 'addition',
    competencyId: 'equation_representation',
    title: 'Write addition equations from models up to 10',
    templateId: 'addition.visual.pictureSentence',
    config: {
      range: [1, 10],
      model: 'cubes',
      optionCount: 2
    }
  },
  {
    id: 'addition-g1-word-translation-to-20',
    code: 'Q.7',
    grade: 1,
    topic: 'addition',
    competencyId: 'word_problem_translation',
    title: 'Translate addition word problems - sums up to 20',
    templateId: 'addition.word.sentence',
    config: {
      range: [1, 20],
      isVisualShow: true
    }
  },
  {
    id: 'addition-g1-q13-sort-facts-sums-to-20',
    code: 'Q.13',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_facts_to_20',
    title: 'Sort addition facts - sums up to 20',
    templateId: 'addition.sort.factsTo20',
    config: {
      range: [1, 20],
    }
  },
  {
    id: 'addition-g1-q13b-sort-values-html-sums-to-20',
    code: 'Q.13b',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_facts_to_20',
    title: 'Sort addition facts - HTML drag and drop',
    templateId: 'addition.sort.valuesTo20Html',
    config: {
      range: [1, 20],
      renderer: 'html'
    }
  },
  {
    id: 'addition-g1-q14-make-number-sums-to-20',
    code: 'Q.14',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_facts_to_20',
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
    competencyId: 'addition_word_problems_to_20',
    title: 'Addition word problems with models - sums up to 20',
    templateId: 'addition.word.model.to20',
    config: {
      range: [1, 20],
      model: 'bar'
    }
  },
  {
    id: 'addition-g1-fact-fluency-to-20',
    code: 'F.1',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_fact_fluency',
    title: 'Addition fact fluency - sums up to 20',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 20],
      layout: 'horizontal'
    }
  },
  {
    id: 'addition-g1-teen-numbers-to-20',
    code: 'T.1',
    grade: 1,
    topic: 'addition',
    competencyId: 'teen_numbers',
    title: 'Add to make teen numbers',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [11, 20],
      optionCount: 4
    }
  },
  {
    id: 'addition-g1-number-line-jumps-to-20',
    code: 'N.1',
    grade: 1,
    topic: 'addition',
    competencyId: 'number_line_jumps',
    title: 'Addition jumps on a number line - sums up to 20',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 20],
      layout: 'horizontal'
    }
  },
  {
    id: 'addition-g1-add-lengths-objects',
    code: 'N.2',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_models_to_10',
    title: 'Add lengths using object models (NEW)',
    templateId: 'meas.nonstandard.multi',
    config: {
      layoutMode: 'add_lengths',
      answerMode: 'sum'
    }
  },
  {
    id: 'addition-g1-add-heights-objects',
    code: 'N.3',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_models_to_10',
    title: 'Add heights using object models (NEW)',
    templateId: 'meas.nonstandard.multi',
    config: {
      layoutMode: 'add_heights',
      answerMode: 'sum'
    }
  },
  {
    id: 'addition-g1-cube-build-to-5',
    code: 'C.3',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_models_to_5',
    title: 'Build cubes to show numbers - sums up to 5',
    templateId: 'addition.interactive.cubeBuild',
    config: {
      range: [2, 5],
      max: 5
    }
  },
  {
    id: 'addition-g1-cube-build-to-10',
    code: 'C.4',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_models_to_10',
    title: 'Build cubes to show numbers - sums up to 10',
    templateId: 'addition.interactive.cubeBuild',
    config: {
      range: [5, 10],
      max: 10
    }
  },
  {
    id: 'addition-g1-cube-build-to-20',
    code: 'C.5',
    grade: 1,
    topic: 'addition',
    competencyId: 'addition_models_to_20',
    title: 'Build cubes to show numbers - sums up to 20',
    templateId: 'addition.interactive.cubeBuild',
    config: {
      range: [10, 20],
      max: 20
    }
  }
];
