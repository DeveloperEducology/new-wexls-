import { testingGenerator } from './registry.js';

const cubePalette = {
  given: { color: '#60a5fa', stroke: '#2563eb' },
  copy: { color: '#c45add', stroke: '#a83ac4' },
};

function buildCopyDragQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Copy cubes into the boxes.',
    parts: [
      {
        type: 'text',
        content: 'Here is 1 cube. Add 3 more cubes.',
        isVertical: true,
      },
      {
        type: 'copy_drag_drop',
        isCopiable: true,
        categories: [
          {
            id: 'cube_train',
            label: 'Copy 3 cubes into the boxes',
            requiredCount: 3,
            prefilledCount: 1,
            prefillColor: cubePalette.given.color,
            prefillStroke: cubePalette.given.stroke,
          },
        ],
        items: [
          {
            id: 'purple_cube',
            content: 'Cube',
            visual: 'cube',
            color: cubePalette.copy.color,
            stroke: cubePalette.copy.stroke,
          },
        ],
        answerKey: { cube_train: 3 },
        isVertical: true,
      },
      {
        type: 'text',
        content: '1 and 3 is [[total]].',
        isVertical: true,
        style: { fontSize: 24 },
      },
    ],
    answer: { cube_train: 3, total: '4' },
    correctAnswerText: JSON.stringify({ cube_train: 3, total: '4' }),
    solution: {
      sections: [
        { type: 'text', content: 'Copy 3 cubes into the row. Then count 1 + 3 = 4.' },
      ],
    },
  };
}

function buildCategorizationQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Sort each item into the correct group.',
    parts: [
      {
        type: 'text',
        content: 'Sort the words into animals and places.',
        isVertical: true,
      },
      {
        type: 'categorization',
        categories: [
          { id: 'animals', label: 'Animals' },
          { id: 'places', label: 'Places' },
        ],
        items: [
          { id: 'cat', content: 'Cat', target: 'animals' },
          { id: 'school', content: 'School', target: 'places' },
          { id: 'dog', content: 'Dog', target: 'animals' },
          { id: 'park', content: 'Park', target: 'places' },
        ],
        answerKey: {
          cat: 'animals',
          school: 'places',
          dog: 'animals',
          park: 'places',
        },
        isVertical: true,
      },
    ],
    answer: {
      cat: 'animals',
      school: 'places',
      dog: 'animals',
      park: 'places',
    },
    solution: {
      sections: [
        { type: 'text', content: 'Cat and dog are animals. School and park are places.' },
      ],
    },
  };
}

function buildProtractorQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    difficulty: 'medium',
    parts: [
      {
        type: 'text',
        content: 'Measure the angle using the protractor below.',
        isVertical: true,
      },
      {
        type: 'interactive_protractor',
        target: {
          angle: 45,
          vertex: { x: 350, y: 240 },
          baseLength: 145,
          armLength: 128,
        },
        initialPosition: { x: 140, y: 35 },
        initialRotation: 0,
        rotationMin: -180,
        rotationMax: 180,
        step: 1,
        isVertical: false,
      },
      {
        type: 'text',
        content: 'The angle is [[ans]] degrees.',
        isVertical: true,
      },
    ],
    answer: { ans: '45' },
    correctAnswerText: JSON.stringify({ ans: '45' }),
    solution: {
      sections: [
        { type: 'text', content: 'The red ray is set to 45 degrees.' },
      ],
    },
  };
}

function buildMixedPartsQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Mixed part renderer test.',
    parts: [
      { type: 'text', content: 'Count the two groups.' },
      {
        type: 'row',
        parts: [
          { type: 'text', content: '**2** stars' },
          {
            type: 'svg',
            content: "<svg width='120' height='50' viewBox='0 0 120 50'><text x='10' y='34' font-size='28'>★ ★</text></svg>",
            style: { maxWidth: 120 },
          },
          { type: 'text', content: '**3** circles' },
          {
            type: 'svg',
            content: "<svg width='150' height='50' viewBox='0 0 150 50'><circle cx='25' cy='25' r='14' fill='#60a5fa'/><circle cx='70' cy='25' r='14' fill='#60a5fa'/><circle cx='115' cy='25' r='14' fill='#60a5fa'/></svg>",
            style: { maxWidth: 150 },
          },
        ],
      },
      { type: 'text', content: '2 + 3 = [[ans]]' },
    ],
    answer: { ans: '5' },
    correctAnswerText: JSON.stringify({ ans: '5' }),
    solution: {
      sections: [
        { type: 'text', content: '2 and 3 make 5.' },
      ],
    },
  };
}

function buildDoublesPlusOneMixedQuestion(skill) {
  const target = 7;
  const half = Math.floor(target / 2);
  const parity = target % 2 === 0 ? 'even' : 'odd';

  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: `Complete the doubles-plus-one fact for ${target}.`,
    parts: [
      {
        type: 'text',
        content: `Complete the doubles-plus-one fact for ${target}.`,
        isVertical: true,
        style: {
          textAlign: 'left',
          fontSize: 28,
          fontWeight: 400,
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      },
      {
        type: 'text',
        content: `${target} = [[left]] + [[right]] + 1`,
        isVertical: true,
        style: {
          textAlign: 'left',
          fontSize: 26,
          fontWeight: 400,
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
          marginLeft: 44,
        },
      },
      {
        type: 'text',
        content: `Is ${target} even or odd?`,
        isVertical: true,
        style: {
          textAlign: 'left',
          fontSize: 28,
          fontWeight: 400,
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      },
      {
        type: 'option_select',
        id: 'parity',
        options: [
          { label: 'even', value: 'even' },
          { label: 'odd', value: 'odd' },
        ],
        isVertical: true,
        style: {
          marginLeft: 44,
        },
      },
    ],
    answer: { left: String(half), right: String(half), parity },
    correctAnswerText: JSON.stringify({ left: String(half), right: String(half), parity }),
    solution: {
      sections: [
        { type: 'text', content: 'An even number can be split into two equal groups.' },
        { type: 'text', content: 'An odd number cannot be split into two equal groups. There is always one left over.' },
        { type: 'text', content: `${target} has two equal groups of ${half} with 1 left over.` },
        { type: 'text', content: `So, ${target} = ${half} + ${half} + 1, and ${target} is ${parity}.` },
      ],
    },
  };
}

function buildNumberLineQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Number line part test.',
    parts: [
      { type: 'text', content: 'Look at the green point on the number line.', isVertical: true },
      {
        type: 'number_line',
        min: 0,
        max: 10,
        marker: 6,
        label: 'point',
        isVertical: true,
      },
      { type: 'text', content: 'The point is on [[ans]].', isVertical: true },
    ],
    answer: { ans: '6' },
    correctAnswerText: JSON.stringify({ ans: '6' }),
    solution: {
      sections: [
        { type: 'text', content: 'The green point is above the tick labelled 6.' },
      ],
    },
  };
}

function buildBaseTenBlocksQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Base-ten blocks part test.',
    parts: [
      { type: 'text', content: 'Count the tens and ones blocks.', isVertical: true },
      {
        type: 'base_ten_blocks',
        number: 34,
        isVertical: true,
      },
      { type: 'text', content: 'The blocks show [[ans]].', isVertical: true },
    ],
    answer: { ans: '34' },
    correctAnswerText: JSON.stringify({ ans: '34' }),
    solution: {
      sections: [
        { type: 'text', content: 'There are 3 tens and 4 ones, so the number is 34.' },
      ],
    },
  };
}

function buildClockQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Clock part test.',
    parts: [
      { type: 'text', content: 'Read the analogue clock.', isVertical: true },
      {
        type: 'clock',
        hour: 3,
        minute: 30,
        isVertical: false,
      },
      { type: 'text', content: 'The time is [[ans]].', isVertical: true },
    ],
    answer: { ans: '3:30' },
    correctAnswerText: JSON.stringify({ ans: '3:30' }),
    solution: {
      sections: [
        { type: 'text', content: 'The minute hand points to 6 and the hour hand is between 3 and 4, so the time is 3:30.' },
      ],
    },
  };
}

function buildClockPatternQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Missing time pattern.',
    parts: [
      { type: 'text', content: 'The clocks follow a pattern. What time is missing?', isVertical: true },
      {
        type: 'categorization',
        variant: 'clock_pattern_slot',
        categories: [
          { id: 'missing_clock', label: 'Missing clock' },
        ],
        answerKey: {
          missing_clock: 'clock_4_00',
        },
        style: {
          padding: '14px 8px',
        },
        pattern: [
          { type: 'clock', hour: 3, minute: 0, size: 146, label: '3:00' },
          { type: 'clock', hour: 3, minute: 30, size: 146, label: '3:30' },
          { type: 'slot', categoryId: 'missing_clock' },
          { type: 'clock', hour: 4, minute: 30, size: 146, label: '4:30' },
        ],
        items: [
          { id: 'clock_2_30', content: '2:30', label: '2:30', hour: 2, minute: 30, target: 'missing_clock' },
          { id: 'clock_4_00', content: '4:00', label: '4:00', hour: 4, minute: 0, target: 'missing_clock' },
          { id: 'clock_5_00', content: '5:00', label: '5:00', hour: 5, minute: 0, target: 'missing_clock' },
        ],
      },
    ],
    answer: { missing_clock: 'clock_4_00' },
    correctAnswerText: JSON.stringify({ missing_clock: 'clock_4_00' }),
    solution: {
      sections: [
        { type: 'text', content: 'The pattern increases by 30 minutes: 3:00, 3:30, 4:00, 4:30.' },
      ],
    },
  };
}

function buildFractionModelQuestion(skill) {
  return {
    id: `testing-${skill}`,
    type: 'fillInTheBlank',
    questionText: 'Fraction model part test.',
    parts: [
      { type: 'text', content: 'Write the fraction shown by the shaded parts.', isVertical: true },
      {
        type: 'fraction_model',
        numerator: 3,
        denominator: 4,
        shape: 'circle',
        isVertical: true,
      },
      { type: 'text', content: 'The shaded fraction is [[ans]].', isVertical: true },
    ],
    answer: { ans: '3/4' },
    correctAnswerText: JSON.stringify({ ans: '3/4' }),
    solution: {
      sections: [
        { type: 'text', content: '3 out of 4 equal parts are shaded, so the fraction is 3/4.' },
      ],
    },
  };
}

const BUILDERS = {
  'testing-copy-drag-drop': buildCopyDragQuestion,
  'testing-categorization': buildCategorizationQuestion,
  'testing-protractor': buildProtractorQuestion,
  'testing-number-line': buildNumberLineQuestion,
  'testing-base-ten-blocks': buildBaseTenBlocksQuestion,
  'testing-clock': buildClockQuestion,
  'testing-clock-pattern': buildClockPatternQuestion,
  'testing-fraction-model': buildFractionModelQuestion,
  'testing-mixed-parts': buildMixedPartsQuestion,
  'testing-doubles-plus-one-mixed': buildDoublesPlusOneMixedQuestion,
};

export function generateTestingQuestion(config = {}) {
  const skill = config.logic_type || config.forcedTask || 'testing-copy-drag-drop';
  const builder = BUILDERS[skill] || buildCopyDragQuestion;
  const question = builder(skill);

  return {
    ...question,
    metadata: {
      ...(question.metadata || {}),
      subject: 'math',
      topic: 'testing',
      task: skill,
      engine: 'testing',
    },
  };
}

export function getTestingTemplateConfig(skill) {
  return {
    logic_type: skill,
    ...(testingGenerator[skill] || testingGenerator['testing-copy-drag-drop']),
  };
}

export { testingGenerator };
