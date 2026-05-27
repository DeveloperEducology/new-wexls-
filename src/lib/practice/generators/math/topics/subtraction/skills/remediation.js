export const remediationSubtractionSkills = [
  {
    id: 'subtraction-remedial-take-away-to-5',
    code: 'R0.1',
    grade: 'remediation',
    topic: 'subtraction',
    competencyId: 'subtraction_visual_to_5',
    title: 'Subtract with cubes up to 5',
    templateId: 'subtraction.visual.removeCubes',
    config: {
      startRange: [2, 5],
      removeRange: [1, 3],
      model: 'cubes',
      difficulty: 'easy'
    }
  },
  {
    id: 'subtraction-remedial-take-away-to-10',
    code: 'R0.2',
    grade: 'remediation',
    topic: 'subtraction',
    competencyId: 'subtraction_visual_to_10',
    title: 'Subtract with cubes up to 10',
    templateId: 'subtraction.visual.removeCubes',
    config: {
      startRange: [3, 10],
      removeRange: [1, 5],
      model: 'cubes',
      difficulty: 'easy'
    }
  },
  {
    id: 'subtraction-remedial-picture-sentence-5',
    code: 'R0.3',
    grade: 'remediation',
    topic: 'subtraction',
    competencyId: 'subtraction_pictures_to_5',
    title: 'Write subtraction sentence for pictures up to 5',
    templateId: 'subtraction.mcq.pictureSentence',
    config: {
      range: [1, 5],
      difficulty: 'easy'
    }
  },
  {
    id: 'subtraction-remedial-facts-to-10',
    code: 'R0.4',
    grade: 'remediation',
    topic: 'subtraction',
    competencyId: 'subtraction_facts_to_10',
    title: 'Subtract basic facts up to 10',
    templateId: 'subtraction.numbers.horizontal',
    config: {
      range: [1, 10],
      layout: 'horizontal',
      difficulty: 'easy'
    }
  }
];
