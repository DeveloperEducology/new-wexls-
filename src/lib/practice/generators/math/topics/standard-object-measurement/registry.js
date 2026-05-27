import { generateSOMQuestion } from './engine.js';

export const somCatalog = [
  {
    skillId: 'som-g2-custom-skill',
    code: 'SOM.38',
    grade: '2',
    title: 'Custom Skill Title',
    description: 'Learn to do something custom with standard object measurement.'
  },
  {
    skillId: 'som-g1-measure-length',
    code: 'SOM.1',
    grade: '1',
    title: 'Measure length (Interactive Cubes)',
    description: 'Use drag-and-drop cubes to measure the length of an object.'
  },
  {
    skillId: 'som-g1-measure-height',
    code: 'SOM.2',
    grade: '1',
    title: 'Measure height (Interactive Dice)',
    description: 'Use drag-and-drop dice towers next to vertical objects.'
  },
  {
    skillId: 'som-g1-compare',
    code: 'SOM.3',
    grade: '1',
    title: 'Compare measured lengths (Paperclips)',
    description: 'Compare the sizes of two objects side-by-side.'
  },
  {
    skillId: 'som-g1-error-spotting',
    code: 'SOM.4',
    grade: '1',
    title: 'Identify measurement errors (Pennies)',
    description: 'Review Penny rows and diagnose gaps, overlaps, or offsets.'
  },
  {
    skillId: 'som-g1-add-lengths',
    code: 'SOM.5',
    grade: '1',
    title: 'Combine lengths (Cubes sum)',
    description: 'Sum the length of two joined color block trains.'
  },
  {
    skillId: 'som-g1-add-heights',
    code: 'SOM.6',
    grade: '1',
    title: 'Combine heights (Dice towers sum)',
    description: 'Sum the height of two stacked vertical towers.'
  },
  {
    skillId: 'som-g1-static-length',
    code: 'SOM.7',
    grade: '1',
    title: 'Measure length (Static Paperclips)',
    description: 'Count pre-aligned paperclips to measure horizontal length.'
  },
  {
    skillId: 'som-g1-static-height',
    code: 'SOM.8',
    grade: '1',
    title: 'Measure height (Static Pennies)',
    description: 'Count stacked pennies to measure vertical height.'
  },
  {
    skillId: 'som-g1-copy-cubes-to-3',
    code: 'SOM.9',
    grade: '1',
    title: 'Copy cubes: sums up to 3',
    description: 'Model addition facts up to 3 by dragging cubes into boxes next to locked blocks.'
  },
  {
    skillId: 'som-g1-copy-cubes-to-5',
    code: 'SOM.10',
    grade: '1',
    title: 'Copy cubes: sums up to 5',
    description: 'Model addition facts up to 5 by dragging cubes into boxes next to locked blocks.'
  },
  {
    skillId: 'som-g1-copy-cubes-to-10',
    code: 'SOM.11',
    grade: '1',
    title: 'Copy cubes: sums up to 10',
    description: 'Model addition facts up to 10 by dragging cubes into boxes next to locked blocks.'
  },
  {
    skillId: 'som-g1-pattern-abab',
    code: 'SOM.12',
    grade: '1',
    title: 'Patterns: Complete ABAB sequence',
    description: 'Complete a repeating Red-Blue-Red-Blue block sequence.'
  },
  {
    skillId: 'som-g1-pattern-aabb',
    code: 'SOM.13',
    grade: '1',
    title: 'Patterns: Complete AABB sequence',
    description: 'Complete a repeating Red-Red-Blue-Blue block sequence.'
  },
  {
    skillId: 'som-g1-sub-takeaway',
    code: 'SOM.14',
    grade: '1',
    title: 'Subtraction: Take away cubes',
    description: 'Subtract numbers by physically dragging cubes off the tray boxes.'
  },
  {
    skillId: 'som-g1-sub-compare',
    code: 'SOM.15',
    grade: '1',
    title: 'Subtraction: Compare block trains',
    description: 'Find the difference between two block trains.'
  },
  {
    skillId: 'som-g1-place-value-blocks',
    code: 'SOM.16',
    grade: '1',
    title: 'Place value: Tens and ones blocks',
    description: 'Model tens and ones with visual block trains.'
  },
  {
    skillId: 'som-g1-fraction-strips',
    code: 'SOM.17',
    grade: '1',
    title: 'Fractions: Equivalent strip parts',
    description: 'Divide block trains to represent fractional parts of a whole.'
  },
  {
    skillId: 'som-g1-multiplication-array',
    code: 'SOM.18',
    grade: '1',
    title: 'Multiplication: Stacks array model',
    description: 'Represent multiplication as repeated addition with block columns.'
  },
  {
    skillId: 'som-g1-graphing-bars',
    code: 'SOM.19',
    grade: '1',
    title: 'Graphing: Built block charts',
    description: 'Read and represent data using interactive parallel block columns.'
  },
  {
    skillId: 'som-g1-place-value-50',
    code: 'SOM.20',
    grade: '1',
    title: 'Place value: Numbers up to 50',
    description: 'Model numbers up to 50 using tens and ones blocks.'
  },
  {
    skillId: 'som-g2-place-value-100',
    code: 'SOM.21',
    grade: '2',
    title: 'Place value: Numbers up to 100',
    description: 'Model numbers up to 100 using tens and ones blocks.'
  },
  {
    skillId: 'som-g2-place-value-hundreds',
    code: 'SOM.22',
    grade: '2',
    title: 'Place value: Hundreds, tens, and ones',
    description: 'Model numbers up to 1,000 using hundreds, tens, and ones blocks.'
  },
  {
    skillId: 'som-g3-place-value-thousands',
    code: 'SOM.23',
    grade: '3',
    title: 'Place value: Thousands, hundreds, tens, and ones',
    description: 'Model numbers up to 10,000 using thousands, hundreds, tens, and ones blocks.'
  },
  {
    skillId: 'som-g1-ten-frame-5',
    code: 'SOM.24',
    grade: '1',
    title: 'Ten frame: Numbers up to 5',
    description: 'Read a ten frame showing a number up to 5.'
  },
  {
    skillId: 'som-g1-ten-frame-10',
    code: 'SOM.25',
    grade: '1',
    title: 'Ten frame: Numbers up to 10',
    description: 'Read a ten frame showing a number up to 10.'
  },
  {
    skillId: 'som-g1-ten-frame-20',
    code: 'SOM.26',
    grade: '1',
    title: 'Ten frame: Numbers up to 20 (double frame)',
    description: 'Read a double ten frame showing a number up to 20.'
  },
  {
    skillId: 'som-g1-number-bonds-5',
    code: 'SOM.27',
    grade: '1',
    title: 'Number bonds: Pairs up to 5',
    description: 'Find the missing part in a number bond with whole up to 5.'
  },
  {
    skillId: 'som-g1-number-bonds-10',
    code: 'SOM.28',
    grade: '1',
    title: 'Number bonds: Pairs up to 10',
    description: 'Find the missing part in a number bond with whole up to 10.'
  },
  {
    skillId: 'som-g1-number-line-10',
    code: 'SOM.29',
    grade: '1',
    title: 'Number line: 0 to 10',
    description: 'Identify the number a marker points to on a 0–10 number line.'
  },
  {
    skillId: 'som-g1-number-line-20',
    code: 'SOM.30',
    grade: '1',
    title: 'Number line: 0 to 20',
    description: 'Identify the number a marker points to on a 0–20 number line.'
  },
  {
    skillId: 'som-g2-number-line-100',
    code: 'SOM.31',
    grade: '2',
    title: 'Number line: 0 to 100',
    description: 'Identify the number a marker points to on a 0–100 number line (skip count by 10s).'
  },
  {
    skillId: 'som-g2-area-grid-small',
    code: 'SOM.32',
    grade: '2',
    title: 'Area: Count squares (up to 4×4)',
    description: 'Count the unit squares inside a rectangle up to 4×4.'
  },
  {
    skillId: 'som-g2-area-grid-medium',
    code: 'SOM.33',
    grade: '2',
    title: 'Area: Count squares (up to 6×6)',
    description: 'Count the unit squares inside a rectangle up to 6×6.'
  },
  {
    skillId: 'som-g2-area-grid-click',
    code: 'SOM.37',
    grade: '2',
    title: 'Area: Click to fill the grid',
    description: 'Click every cell to fill a rectangle, then count and type how many squares you painted.'
  },
  {
    skillId: 'som-g2-division-sharing',
    code: 'SOM.34',
    grade: '2',
    title: 'Division: Share equally into groups',
    description: 'Share items equally into groups and find how many in each group.'
  },
  {
    skillId: 'som-g1-money-coins',
    code: 'SOM.35',
    grade: '1',
    title: 'Money: Count rupee coins',
    description: 'Count a row of ₹1, ₹2, and ₹5 coins to find the total.'
  },
  {
    skillId: 'som-g1-odd-even',
    code: 'SOM.36',
    grade: '1',
    title: 'Odd and even numbers',
    description: 'Pair up cubes and decide if the count is odd or even.'
  }
];

export function getSOMSkill(skillId) {
  return somCatalog.find(s => s.skillId === skillId) || null;
}

export function generateSOMTopicQuestion(config = {}) {
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const logicType = config.logic_type || 'som-g1-measure-length';
  
  const question = generateSOMQuestion({
    ...config,
    logic_type: logicType
  });

  return {
    ...question,
    id: `som_${logicType}_${seed}`,
    metadata: {
      ...(question.metadata || {}),
      skillId: logicType,
      subject: 'math',
      topic: 'standard-object-measurement',
      engine: 'standard-object-measurement'
    }
  };
}

export const somRegistry = {
  ...Object.fromEntries(
    somCatalog.map(skill => [skill.skillId, generateSOMTopicQuestion])
  ),
  'som-g1-copy-cubes': generateSOMTopicQuestion
};

export const somTopicContract = {
  subject: 'math',
  topic: 'standard-object-measurement',
  label: 'Standard Object Measurement',
  badge: 'MATH',
  description: 'Practice interactive non-standard unit measuring, comparison, error spotting, and addition modeling.',
  defaultSkill: 'som-g1-measure-length',
  catalog: somCatalog,
  tips: [
    { label: 'Snapping blocks', text: 'Questions feature interactive snapping cube and dice towers.' },
    { label: 'Addition modeling', text: 'Prefilled locked blocks act as the starting addend.' },
  ],

  generateQuestion(config) {
    return generateSOMTopicQuestion(config);
  },

  getTemplate(skillId) {
    return getSOMSkill(skillId);
  },

  normalizeQuestion(question, context) {
    return {
      ...question,
      id: question.id || `${context.topic}-${context.skill}-${context.seed}`,
      metadata: {
        ...(question.metadata || {}),
        subject: context.subject,
        topic: context.topic,
        skillId: context.skill,
        templateId: question.metadata?.task || context.skill,
        engine: 'standard-object-measurement',
        seed: context.seed,
      },
    };
  },
};
