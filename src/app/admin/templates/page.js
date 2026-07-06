'use client';

import { useState, useEffect, useMemo } from 'react';
import { evaluateTemplate } from '@/lib/practice/generators/universalEvaluator';
import { generateFromDynamicPool } from '@/lib/practice/engine/DynamicPoolGenerator';
import styles from './templates.module.css';

const DEFAULT_TEMPLATE = {
  id: 'math-subtraction-ten-frame-auto',
  title: 'Subtract with Ten Frame',
  subject: 'math',
  topic: 'ukg-numbers-counting',
  layout: 'prompt_top_visual_center_options_bottom',
  variables: [
    { name: 'A', type: 'integer', min: '5', max: '10' },
    { name: 'B', type: 'integer', min: '1', max: 'A - 1' },
    { name: 'Result', type: 'expression', formula: 'A - B' }
  ],
  visuals: [
    {
      component: 'TenFrame',
      props: {
        filledCount: 'A',
        crossedOutCount: 'B',
        color: 'red'
      }
    }
  ],
  questionText: 'What is [A] minus [B]?',
  optionsType: 'mcq',
  options: [
    { label: '[Result]', isCorrect: true },
    { label: '[Result] + 1', isCorrect: false },
    { label: '[Result] - 1', isCorrect: false },
    { label: '[A]', isCorrect: false }
  ],
  explanation: {
    sections: [
      {
        type: 'text',
        content: 'Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result].'
      }
    ]
  }
};

const VISUAL_COMPONENTS = [
  {
    name: 'None',
    value: '',
    props: {}
  },
  {
    name: 'Ten Frame',
    value: 'TenFrame',
    mathOnly: true,
    props: {
      filledCount: 'A',
      crossedOutCount: 'B',
      color: 'red'
    }
  },
  {
    name: 'Jar of Marbles',
    value: 'JarOfMarbles',
    mathOnly: true,
    props: {
      colorA: 'blue',
      countA: 'A',
      colorB: 'red',
      countB: 'B'
    }
  },
  {
    name: 'Spinner',
    value: 'Spinner',
    mathOnly: true,
    props: {
      colorA: 'blue',
      sectorsA: 'A',
      colorB: 'green',
      sectorsB: 'B'
    }
  },
  {
    name: 'Item Counter Grid',
    value: 'ItemCounter',
    props: {
      count: 'A',
      itemType: 'cupcake'
    }
  },
  {
    name: 'Custom Image',
    value: 'Image',
    props: {
      imageUrl: '',
      width: '200'
    }
  },
  {
    name: 'Visual Choice (Which shows N?)',
    value: 'VisualChoice',
    props: {
      correctCount: 'A',
      itemType: 'cupcake',
      distractorMode: 'auto'
    }
  },
  {
    name: 'Place Value Chart',
    value: 'PlaceValue',
    mathOnly: true,
    props: {
      thousands: '1',
      hundreds: '1',
      tens: '2',
      ones: '3',
      showChart: 'true'
    }
  },
  {
    name: 'Base Ten Blocks',
    value: 'BaseTenBlocks',
    mathOnly: true,
    props: {
      thousands: '1',
      hundreds: '1',
      tens: '2',
      ones: '3',
      showChart: 'false',
      color: 'blue'
    }
  },
  {
    name: 'Number Line',
    value: 'NumberLine',
    mathOnly: true,
    props: {
      min: '0',
      max: '20',
      step: '1',
      pointValue: 'A',
      pointLabel: '',
      color: 'blue'
    }
  },
  {
    name: 'Hundred Chart',
    value: 'HundredChart',
    mathOnly: true,
    props: {
      highlighted: 'A',
      missing: '',
      color: 'blue'
    }
  },
  {
    name: 'Rekenrek',
    value: 'Rekenrek',
    mathOnly: true,
    props: {
      rows: '2',
      values: 'A,B'
    }
  },
  {
    name: 'Number Bond',
    value: 'NumberBond',
    mathOnly: true,
    props: {
      whole: 'A',
      left: 'B',
      right: 'Result',
      missing: 'right'
    }
  },
  {
    name: 'Tally Chart',
    value: 'TallyChart',
    mathOnly: true,
    props: {
      categories: 'A,B,C',
      counts: '3,4,5',
      showFrequency: 'true'
    }
  },
  {
    name: 'Fraction Bar',
    value: 'FractionBar',
    mathOnly: true,
    props: {
      denominator: '4',
      numerator: '1',
      color: 'blue',
      interactive: 'false'
    }
  },
  {
    name: 'Fraction Circle',
    value: 'FractionCircle',
    mathOnly: true,
    props: {
      denominator: '4',
      numerator: '1',
      color: 'red',
      interactive: 'false'
    }
  },
  {
    name: 'Fraction Grid',
    value: 'FractionGrid',
    mathOnly: true,
    props: {
      rows: '2',
      cols: '4',
      shaded: '3',
      color: 'green',
      interactive: 'false'
    }
  },
  {
    name: 'Decimal Grid',
    value: 'DecimalGrid',
    mathOnly: true,
    props: {
      value: '0.35',
      color: 'orange'
    }
  },
  {
    name: 'Decimal Line',
    value: 'DecimalLine',
    mathOnly: true,
    props: {
      min: '0',
      max: '1',
      step: '0.1',
      markedPoint: '0.4',
      pointLabel: '',
      color: 'blue'
    }
  },
  {
    name: 'Shape Canvas',
    value: 'ShapeCanvas',
    mathOnly: true,
    props: {
      shape: 'triangle',
      label: '',
      color: 'purple'
    }
  },
  {
    name: 'Coordinate Plane',
    value: 'CoordinatePlane',
    mathOnly: true,
    props: {
      xMin: '-5',
      xMax: '5',
      yMin: '-5',
      yMax: '5',
      points: '3,2',
      polygon: ''
    }
  },
  {
    name: 'Protractor',
    value: 'Protractor',
    mathOnly: true,
    props: {
      angle: '45'
    }
  },
  {
    name: 'Ruler',
    value: 'Ruler',
    mathOnly: true,
    props: {
      length: '10',
      objectLength: '4',
      objectType: 'pencil'
    }
  },
  {
    name: 'Geoboard',
    value: 'Geoboard',
    mathOnly: true,
    props: {
      gridSize: '5',
      polygon: '1,1;4,1;4,4;1,4',
      color: 'red'
    }
  },
  {
    name: 'Bar Graph',
    value: 'BarGraph',
    mathOnly: true,
    props: {
      title: 'Favorite fruits',
      categories: 'Apples,Bananas,Grapes',
      values: '4,6,3',
      color: 'blue'
    }
  },
  {
    name: 'Pictograph',
    value: 'Pictograph',
    mathOnly: true,
    props: {
      categories: 'Cats,Dogs,Birds',
      values: '3,5,2',
      emoji: 'star',
      key: '1',
      showCount: 'true'
    }
  },
  {
    name: 'Frequency Table',
    value: 'FrequencyTable',
    mathOnly: true,
    props: {
      title: 'Class votes',
      categories: 'Red,Blue,Green',
      values: '5,7,4',
      headers: 'Category,Frequency'
    }
  },
  {
    name: 'Analog Clock',
    value: 'AnalogClock',
    mathOnly: true,
    props: {
      hour: '3',
      minute: '30',
      interactive: 'false'
    }
  },
  {
    name: 'Calendar',
    value: 'Calendar',
    mathOnly: true,
    props: {
      month: 'June',
      daysInMonth: '30',
      startDay: '1',
      highlightDays: '11'
    }
  },
  {
    name: 'Thermometer',
    value: 'Thermometer',
    mathOnly: true,
    props: {
      min: '0',
      max: '100',
      value: '37',
      unit: 'C'
    }
  },
  {
    name: 'Balance Scale',
    value: 'BalanceScale',
    mathOnly: true,
    props: {
      leftWeight: 'A',
      rightWeight: 'B',
      leftLabel: 'Left',
      rightLabel: 'Right',
      showStacked: 'false'
    }
  },
  {
    name: 'Measuring Jug',
    value: 'MeasuringJug',
    mathOnly: true,
    props: {
      capacity: '1000',
      step: '100',
      value: '500'
    }
  },
  {
    name: 'Money Display',
    value: 'MoneyDisplay',
    mathOnly: true,
    props: {
      amount: '25'
    }
  },
  {
    name: 'Price Tag Compare',
    value: 'PriceTagCompare',
    mathOnly: true,
    props: {
      itemA: 'Apple',
      priceA: '10',
      itemB: 'Mango',
      priceB: '15'
    }
  },
  {
    name: 'Scene Composer',
    value: 'SceneComposer',
    props: {
      containerType: 'box',
      targetClipart: '',
      placements: 'center'
    }
  }
];

const COLORS_LIST = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange'];

const MISCONCEPTION_PRESETS = [
  { value: '', label: 'Select misconception' },
  { value: 'off_by_one', label: 'Off by one' },
  { value: 'operation_confusion', label: 'Operation confusion' },
  { value: 'place_value_error', label: 'Place value error' },
  { value: 'counting_all', label: 'Counting all instead of strategy' },
  { value: 'reversal', label: 'Reversal / order mix-up' },
  { value: 'visual_misread', label: 'Visual model misread' },
  { value: 'vocabulary_confusion', label: 'Vocabulary confusion' },
  { value: 'near_miss', label: 'Near miss distractor' }
];

const SUBJECT_MODES = {
  english: {
    label: 'English',
    strands: ['vocabulary', 'phonics', 'grammar', 'reading'],
    visuals: ['Text', 'Image', 'Audio', 'ReadingPassage'],
    interactions: ['mcq', 'picture_mcq', 'audio_mcq', 'multi_select', 'matching', 'fill_blank', 'text_input', 'sequence']
  },
  math: {
    label: 'Math',
    strands: ['arithmetic', 'fractions', 'geometry', 'measurement'],
    visuals: ['Text', 'NumberLine', 'FractionBar', 'Clock', 'BaseTenBlocks', 'MeasuringCup', 'GeometryCanvas', 'DragCanvas'],
    interactions: ['mcq', 'multi_select', 'drag_drop', 'sorting', 'fill_blank', 'number_input', 'sequence', 'interactive_tool']
  },
  science: {
    label: 'Science',
    strands: ['diagrams', 'labeling', 'experiments'],
    visuals: ['Text', 'Image', 'Audio', 'SVG', 'Video', 'GeometryCanvas', 'DragCanvas'],
    interactions: ['mcq', 'picture_mcq', 'multi_select', 'drag_drop', 'sorting', 'matching', 'hotspot', 'label_diagram']
  },
  gk: {
    label: 'General Knowledge',
    strands: ['facts', 'image matching', 'associations'],
    visuals: ['Text', 'Image', 'Audio', 'Video'],
    interactions: ['mcq', 'picture_mcq', 'audio_mcq', 'matching', 'sorting', 'hotspot']
  },
  social_studies: {
    label: 'Social Studies',
    strands: ['places', 'people', 'history', 'civics', 'maps'],
    visuals: ['Text', 'Image', 'Audio', 'SVG', 'Video', 'ReadingPassage'],
    interactions: ['mcq', 'picture_mcq', 'multi_select', 'matching', 'hotspot', 'label_diagram', 'sequence']
  },
  coding: {
    label: 'Coding',
    strands: ['sequencing', 'logic', 'debugging', 'patterns'],
    visuals: ['Text', 'SVG', 'DragCanvas'],
    interactions: ['mcq', 'multi_select', 'drag_drop', 'sorting', 'sequence', 'text_input', 'interactive_tool']
  },
  logical_reasoning: {
    label: 'Logical Reasoning',
    strands: ['patterns', 'classification', 'analogies', 'deduction'],
    visuals: ['Text', 'Image', 'SVG', 'DragCanvas'],
    interactions: ['mcq', 'multi_select', 'sorting', 'matching', 'sequence', 'fill_blank']
  },
  mat: {
    label: 'Mental Ability (MAT)',
    strands: ['patterns', 'classification', 'analogies', 'figure-completion', 'mirror-image', 'embedded-figures'],
    visuals: ['Text', 'Image', 'SVG', 'DragCanvas'],
    interactions: ['mcq', 'picture_mcq', 'multi_select', 'sorting', 'matching', 'hotspot']
  },
  arithmetic: {
    label: 'Arithmetic',
    strands: ['numbers', 'fractions', 'percentages', 'ratios', 'profit-loss', 'mensuration'],
    visuals: ['Text', 'NumberLine', 'FractionBar', 'BaseTenBlocks', 'Clock', 'GeometryCanvas', 'DragCanvas'],
    interactions: ['mcq', 'multi_select', 'drag_drop', 'sorting', 'fill_blank', 'number_input', 'sequence', 'interactive_tool']
  },
  language: {
    label: 'Language',
    strands: ['comprehension', 'grammar', 'vocabulary'],
    visuals: ['Text', 'Image', 'Audio', 'ReadingPassage'],
    interactions: ['mcq', 'picture_mcq', 'audio_mcq', 'multi_select', 'matching', 'fill_blank', 'text_input', 'sequence']
  }
};

const DATA_SOURCE_TYPES = [
  'pool_selection',
  'random_number',
  'random_item',
  'static_data',
  'curriculum_dataset',
  'image_library',
  'audio_library',
  'svg_library',
  'facts_database'
];

const VARIABLE_TYPES = [
  'integer',
  'pool_selection',
  'expression',
  'list',
  'string_template',
  'array_transform',
  'conditional',
  'computed'
];

const LAYOUT_MODES = [
  'prompt_top',
  'prompt_left',
  'visual_center',
  'split_screen',
  'reading_passage',
  'worksheet',
  'mobile_first',
  'tablet_first',
  'desktop_first'
];

const INTERACTION_ENGINES = [
  'mcq',
  'picture_mcq',
  'audio_mcq',
  'multi_select',
  'drag_drop',
  'sorting',
  'matching',
  'fill_blank',
  'number_input',
  'text_input',
  'sequence',
  'hotspot',
  'draw_line',
  'label_diagram',
  'interactive_tool'
];

const VALIDATION_RULE_TYPES = [
  'exact_match',
  'case_insensitive',
  'numeric_tolerance',
  'multi_answer',
  'regex_validation',
  'custom_formula'
];

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

const ANALYTICS_FIELDS = [
  'attempts',
  'time_spent',
  'hints_used',
  'first_try_correct',
  'mastery_score',
  'smart_score',
  'confidence_score'
];

const createUniversalSchemaDefaults = () => ({
  description: '',
  grade: '',
  skillId: '',
  competencyId: '',
  difficultyLevel: 'easy',
  tags: [],
  dataSources: [],
  constraints: {
    uniqueOptions: true,
    preventDuplicateWords: true,
    minOptionCount: 3,
    maxOptionCount: 6,
    distractorSimilarity: 'medium'
  },
  layoutConfig: {
    mode: 'prompt_top',
    responsiveTarget: 'desktop_first',
    clickToSubmit: false,
    audio: false
  },
  interaction: {
    engine: 'mcq',
    inputMode: 'choice'
  },
  validationRules: [
    { type: 'exact_match', target: 'answer', value: '[Result]' }
  ],
  feedbackRules: {
    correct_message: 'Correct!',
    incorrect_message: 'Try again.',
    hints: [],
    step_by_step_explanation: '',
    misconception_feedback: {}
  },
  difficultyRules: {
    easy: { optionCount: 3, distractorSimilarity: 'low', hintVisibility: 'high', visualSupport: 'high', answerComplexity: 'low' },
    medium: { optionCount: 4, distractorSimilarity: 'medium', hintVisibility: 'medium', visualSupport: 'medium', answerComplexity: 'medium' },
    hard: { optionCount: 5, distractorSimilarity: 'high', hintVisibility: 'low', visualSupport: 'low', answerComplexity: 'high' }
  },
  analyticsConfig: ANALYTICS_FIELDS.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
  adaptiveRules: {
    correct: { route: 'next_skill', targetSkillId: '' },
    incorrect: { route: 'remediation_skill', targetSkillId: '' },
    masteryAchieved: { route: 'harder_template', targetTemplateId: '' }
  }
});

const getInteractionString = (interaction) => {
  if (!interaction) return 'choice';
  if (typeof interaction === 'string') return interaction;
  if (interaction["0"] !== undefined) {
    let str = '';
    let i = 0;
    while (interaction[String(i)] !== undefined) {
      str += interaction[String(i)];
      i++;
    }
    return str;
  }
  return interaction.inputMode || interaction.engine || 'choice';
};

const withUniversalDefaults = (template) => {
  const defaults = createUniversalSchemaDefaults();
  return {
    ...defaults,
    ...template,
    dataSources: template.dataSources || defaults.dataSources,
    constraints: { ...defaults.constraints, ...(template.constraints || {}) },
    layoutConfig: { ...defaults.layoutConfig, ...(template.layoutConfig || {}) },
    interaction: typeof template.interaction === 'string'
      ? template.interaction
      : (template.interaction && template.interaction["0"] !== undefined
         ? getInteractionString(template.interaction)
         : { ...defaults.interaction, ...(template.interaction || {}) }),
    validationRules: template.validationRules || defaults.validationRules,
    feedbackRules: { ...defaults.feedbackRules, ...(template.feedbackRules || {}) },
    difficultyRules: { ...defaults.difficultyRules, ...(template.difficultyRules || {}) },
    analyticsConfig: { ...defaults.analyticsConfig, ...(template.analyticsConfig || {}) },
    adaptiveRules: { ...defaults.adaptiveRules, ...(template.adaptiveRules || {}) },
    tags: Array.isArray(template.tags) ? template.tags : String(template.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  };
};

const normalizeTemplateForBuilder = (template) => {
  const normalized = withUniversalDefaults(template || {});
  
  // Convert variables object to array if needed
  let variables = normalized.variables;
  if (variables && !Array.isArray(variables) && typeof variables === 'object') {
    variables = Object.entries(variables).map(([name, val]) => {
      if (Array.isArray(val)) {
        return {
          name,
          type: 'list',
          items: val
        };
      }
      return {
        name,
        ...val
      };
    });
  } else {
    variables = variables || [];
  }

  return {
    ...normalized,
    variables,
    visuals: normalized.visuals || [],
    options: normalized.options || [],
    explanation: normalized.explanation || { sections: [{ type: 'text', content: '' }] }
  };
};

const REFERENCE_EXAMPLES = [
  {
    id: "example-mcq",
    title: "Example: Multiple Choice (MCQ)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "5", max: "10" },
      { name: "B", type: "integer", min: "1", max: "A - 1" },
      { name: "Result", type: "expression", formula: "A - B" }
    ],
    visuals: [
      {
        component: "TenFrame",
        props: {
          filledCount: "A",
          crossedOutCount: "B",
          color: "red"
        }
      }
    ],
    questionText: "What is [A] minus [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]", isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]", isCorrect: false }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result]."
        }
      ]
    }
  },
  {
    id: "example-fill-in-the-blank",
    title: "Example: Fill In The Blank (FIB)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "9" },
      { name: "B", type: "integer", min: "2", max: "9" },
      { name: "Result", type: "expression", formula: "A + B" }
    ],
    visuals: [],
    questionText: "Fill in the correct value to complete the addition sentence.",
    optionsType: "fillInTheBlank",
    parts: [
      {
        type: "text",
        content: "[A] + [B] = [[ans]]"
      }
    ],
    answer: {
      ans: "[Result]"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "Adding [A] and [B] gives [Result]. So [A] + [B] = [Result]."
        }
      ]
    }
  },
  {
    id: "example-categorization",
    title: "Example: Categorization (Drag & Drop)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "10" }
    ],
    visuals: [],
    questionText: "Sort the numbers into Even and Odd columns.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        categories: [
          { id: "even", label: "Even Numbers" },
          { id: "odd", label: "Odd Numbers" }
        ],
        items: [
          { id: "item1", content: "2" },
          { id: "item2", content: "3" },
          { id: "item3", content: "4" },
          { id: "item4", content: "5" }
        ],
        answerKey: {
          item1: "even",
          item2: "odd",
          item3: "even",
          item4: "odd"
        }
      }
    ],
    answer: {
      item1: "even",
      item2: "odd",
      item3: "even",
      item4: "odd"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "Even numbers can be divided by 2 without a remainder (e.g. 2, 4), while odd numbers leave a remainder of 1 (e.g. 3, 5)."
        }
      ]
    }
  },
  {
    id: "example-word-completion",
    title: "Example: Word Completion (CatV2)",
    subject: "english",
    topic: "phonics",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [],
    visuals: [],
    questionText: "Complete the words.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        renderer: "html",
        layoutMode: "word_completion",
        items: [
          { id: "letter_f", content: "f" },
          { id: "letter_p", content: "p" }
        ],
        wordCards: [
          {
            id: "fin_card",
            slotId: "slot_fin_initial",
            ending: "in",
            answer: "fin",
            imageUrl: "/images/phonics/fin.svg"
          },
          {
            id: "pin_card",
            slotId: "slot_pin_initial",
            ending: "in",
            answer: "pin",
            imageUrl: "/images/phonics/pin.svg"
          }
        ]
      }
    ],
    answer: {
      slot_fin_initial: "letter_f",
      slot_pin_initial: "letter_p"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "F plus in makes fin. P plus in makes pin."
        }
      ]
    }
  },
  {
    id: "example-visual-choice",
    title: "Example: Visual Choice",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "5" }
    ],
    visuals: [
      {
        component: "VisualChoice",
        props: {
          correctCount: "A",
          itemType: "cupcake",
          distractorMode: "auto"
        }
      }
    ],
    questionText: "Which plate shows [A] cupcakes?",
    optionsType: "visual_choice",
    explanation: {
      sections: [
        {
          type: "text",
          content: "Count the cupcakes on each plate. The plate with exactly [A] cupcakes is the correct answer."
        }
      ]
    }
  },
  {
    id: "example-hotspot-inside-outside",
    title: "Example: Hotspot (Inside/Outside)",
    subject: "math",
    topic: "ukg-positions-inside-outside",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "animal_label", type: "list", items: ["rabbit", "penguin"] },
      {
        name: "animal_img",
        type: "expression",
        formula: "animal_label == 'rabbit' ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655512965-penguin.png'"
      },
      { name: "target_val", type: "list", items: [0, 1] },
      {
        name: "target_pos",
        type: "expression",
        formula: "target_val == 0 ? 'inside' : 'outside'"
      },
      {
        name: "resolved_image",
        type: "expression",
        formula: "animal_label == 'rabbit' ? (target_val == 0 ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762227249-rabbit-inside-gif.webp' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762118296-rabbit-outside-gif.webp') : (target_val == 0 ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762183192-penguin-inside-gif.webp' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762080125-penguin-outside-gif.webp')"
      }
    ],
    visuals: [],
    questionText: "Click the box where the [animal_label] is **[target_pos]**.",
    optionsType: "hotspot_select",
    parts: [
      {
        type: "hotspot_canvas",
        backgroundUrl: "[resolved_image]",
        canvasWidth: 500,
        canvasHeight: 320,
        transparent: true,
        hotspots: [
          { id: "box_a", label: "Box A", x: 20, y: 150, width: 220, height: 150, optionIndex: 0 },
          { id: "box_b", label: "Box B", x: 260, y: 150, width: 220, height: 150, optionIndex: 1 }
        ]
      }
    ],
    options: [
      { label: "Box A", isCorrect: "target_val == 0" },
      { label: "Box B", isCorrect: "target_val == 1" }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Look at the picture. The [animal_label] is [target_pos] the box, which is [Result]."
        }
      ]
    }
  },
  {
    id: "example-hotspot-dynamic-composition",
    title: "Example: Hotspot (Dynamic Scene Composition)",
    subject: "math",
    topic: "ukg-positions-inside-outside",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "animal_label", type: "list", items: ["rabbit", "penguin"] },
      {
        name: "animal_img",
        type: "expression",
        formula: "animal_label == 'rabbit' ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655512965-penguin.png'"
      },
      { name: "container_type", type: "list", items: ["box", "bowl", "basket", "circle", "house"] },
      { name: "target_val", type: "list", items: [0, 1] },
      { name: "target_pos", type: "list", items: ["inside", "outside"] },
      {
        name: "placement_0",
        type: "expression",
        formula: "target_val == 0 ? target_pos : (target_pos == 'inside' ? 'outside' : 'inside')"
      },
      {
        name: "placement_1",
        type: "expression",
        formula: "target_val == 1 ? target_pos : (target_pos == 'inside' ? 'outside' : 'inside')"
      }
    ],
    visuals: [],
    questionText: "Click the **[container_type]** where the [animal_label] is **[target_pos]**.",
    optionsType: "hotspot_select",
    parts: [
      {
        type: "hotspot_canvas",
        canvasWidth: 500,
        canvasHeight: 320,
        transparent: true,
        composeScene: {
          containerType: "[container_type]",
          targetClipart: "[animal_img]",
          placements: [
            "[placement_0]",
            "[placement_1]"
          ]
        },
        hotspots: [
          { id: "box_a", label: "Box A", x: 40, y: 120, width: 180, height: 160, optionIndex: 0 },
          { id: "box_b", label: "Box B", x: 280, y: 120, width: 180, height: 160, optionIndex: 1 }
        ]
      }
    ],
    options: [
      { label: "Box A", isCorrect: "target_val == 0" },
      { label: "Box B", isCorrect: "target_val == 1" }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Looking at the picture, the [animal_label] is [target_pos] the [container_type] on the [target_val == 0 ? 'left (Box A)' : 'right (Box B)']."
        }
      ]
    }
  }
];

// ─── Math Starter Templates ───────────────────────────────────────────────────
// Ready-made configs for common math concepts. Load any in one click, then
// customise the variables, visual, and options as needed.
const MATH_STARTERS = [
  // ── Odd / Even ──────────────────────────────────────────────────────────────
  {
    id: "starter-odd-even-mcq",
    title: "Odd / Even — MCQ",
    emoji: "🔢",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "N", type: "integer", min: "1", max: "20" },
      { name: "IsEven", type: "expression", formula: "N % 2 === 0 ? 1 : 0" }
    ],
    visuals: [],
    questionText: "Is [N] odd or even?",
    optionsType: "mcq",
    shuffleOptions: false,
    options: [
      { label: "Even", isCorrect: "N % 2 === 0" },
      { label: "Odd",  isCorrect: "N % 2 !== 0" }
    ],
    explanation: {
      sections: [{
        type: "text",
        content: "[N] divided by 2 leaves a remainder of [N % 2]. So [N] is [N % 2 === 0 ? 'even' : 'odd']."
      }]
    }
  },
  {
    id: "starter-odd-even-sort",
    title: "Odd / Even — Sort (Drag & Drop)",
    emoji: "🔢",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "N", type: "integer", min: "1", max: "20" }
    ],
    visuals: [],
    questionText: "Sort these numbers into Even and Odd.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        categories: [
          { id: "even", label: "Even" },
          { id: "odd",  label: "Odd" }
        ],
        items: [
          { id: "n2", content: "2" },
          { id: "n3", content: "3" },
          { id: "n6", content: "6" },
          { id: "n7", content: "7" },
          { id: "n10", content: "10" },
          { id: "n11", content: "11" }
        ],
        answerKey: {
          n2: "even", n3: "odd", n6: "even",
          n7: "odd", n10: "even", n11: "odd"
        }
      }
    ],
    answer: { n2: "even", n3: "odd", n6: "even", n7: "odd", n10: "even", n11: "odd" },
    explanation: {
      sections: [{ type: "text", content: "Even numbers end in 0, 2, 4, 6, 8. Odd numbers end in 1, 3, 5, 7, 9." }]
    }
  },
  {
    id: "starter-shape-sorting-clipart",
    title: "Shape Sorting — SVG Drag & Drop",
    emoji: "📐",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [],
    visuals: [],
    questionText: "Sort the shapes into the correct columns.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        layoutMode: "category_sort",
        htmlLayout: "category_sort",
        cardStyle: "transparent",
        categories: [
          { id: "circles", label: "Circles" },
          { id: "triangles", label: "Triangles" }
        ],
        items: [
          { id: "c1", content: "Circle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"#fbbf24\" stroke=\"#d97706\" stroke-width=\"4\"/></svg>", imageWidth: "80" },
          { id: "c2", content: "Circle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"#ef4444\" stroke=\"#b91c1c\" stroke-width=\"4\"/></svg>", imageWidth: "80" },
          { id: "t1", content: "Triangle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><polygon points=\"50,15 85,85 15,85\" fill=\"#3b82f6\" stroke=\"#1d4ed8\" stroke-width=\"4\"/></svg>", imageWidth: "80" },
          { id: "t2", content: "Triangle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><polygon points=\"50,15 85,85 15,85\" fill=\"#10b981\" stroke=\"#047857\" stroke-width=\"4\"/></svg>", imageWidth: "80" }
        ],
        answerKey: {
          c1: "circles", c2: "circles", t1: "triangles", t2: "triangles"
        }
      }
    ],
    answer: { c1: "circles", c2: "circles", t1: "triangles", t2: "triangles" },
    explanation: {
      sections: [{ type: "text", content: "Circles go under 'Circles' and triangles go under 'Triangles'!" }]
    }
  },
  // ── Addition ─────────────────────────────────────────────────────────────────
  {
    id: "starter-addition-basic",
    title: "Addition — Basic MCQ",
    emoji: "➕",
    subject: "math",
    topic: "grade1-addition-basics",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "20" },
      { name: "B", type: "integer", min: "1", max: "20" },
      { name: "Result", type: "expression", formula: "A + B" }
    ],
    visuals: [],
    questionText: "What is [A] + [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",     isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]",          isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[A] + [B] = [Result]." }]
    }
  },
  {
    id: "starter-addition-carry",
    title: "Addition — With Carry (2-digit)",
    emoji: "➕",
    subject: "math",
    topic: "grade2-addition-carry",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "15", max: "99" },
      { name: "B", type: "integer", min: "15", max: "99" },
      { name: "Result",   type: "expression", formula: "A + B" },
      { name: "HasCarry", type: "expression", formula: "(A % 10 + B % 10) >= 10 ? 1 : 0" },
      { name: "CarryOut", type: "expression", formula: "Math.floor((A % 10 + B % 10) / 10)" }
    ],
    visuals: [],
    questionText: "What is [A] + [B]?",
    optionsType: "fillInTheBlank",
    metaConfig: { hasCarry: true },
    parts: [
      { type: "text", content: "  [A]\n+ [B]\n——\n[[ans]]" }
    ],
    answer: { ans: "[Result]" },
    explanation: {
      sections: [{ type: "text", content: "Add the ones: [A % 10] + [B % 10] = [A % 10 + B % 10]. [HasCarry === 1 ? 'Carry the 1 to tens.' : 'No carry needed.'] Add the tens: [Math.floor(A/10)] + [Math.floor(B/10)] + [CarryOut] = [Math.floor(A/10) + Math.floor(B/10) + CarryOut]. Answer: [Result]." }]
    }
  },
  // ── Subtraction ──────────────────────────────────────────────────────────────
  {
    id: "starter-subtraction-basic",
    title: "Subtraction — Basic MCQ",
    emoji: "➖",
    subject: "math",
    topic: "grade1-subtraction-basics",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "5", max: "20" },
      { name: "B", type: "integer", min: "1", max: "A - 1" },
      { name: "Result", type: "expression", formula: "A - B" }
    ],
    visuals: [
      { component: "TenFrame", props: { filledCount: "A", crossedOutCount: "B", color: "red" } }
    ],
    questionText: "What is [A] - [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",     isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]",          isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "Start with [A], take away [B]. [A] - [B] = [Result]." }]
    }
  },
  {
    id: "starter-subtraction-borrow",
    title: "Subtraction — With Borrowing (2-digit)",
    emoji: "➖",
    subject: "math",
    topic: "grade2-subtraction-borrow",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "20", max: "99" },
      { name: "B", type: "integer", min: "10", max: "A - 1" },
      { name: "Result",    type: "expression", formula: "A - B" },
      { name: "NeedsBorrow", type: "expression", formula: "A % 10 < B % 10 ? 1 : 0" }
    ],
    visuals: [],
    questionText: "What is [A] - [B]?",
    optionsType: "fillInTheBlank",
    metaConfig: { hasBorrow: true },
    parts: [
      { type: "text", content: "  [A]\n- [B]\n——\n[[ans]]" }
    ],
    answer: { ans: "[Result]" },
    explanation: {
      sections: [{ type: "text", content: "[NeedsBorrow === 1 ? 'Borrow 10 from the tens place. ' : '']Subtract ones: [A % 10 < B % 10 ? A % 10 + 10 : A % 10] - [B % 10] = [A % 10 < B % 10 ? A % 10 + 10 - B % 10 : A % 10 - B % 10]. Subtract tens: [Math.floor(A/10) - (A % 10 < B % 10 ? 1 : 0)] - [Math.floor(B/10)] = [Math.floor(A/10) - (A % 10 < B % 10 ? 1 : 0) - Math.floor(B/10)]. Answer: [Result]." }]
    }
  },
  // ── Multiplication ───────────────────────────────────────────────────────────
  {
    id: "starter-multiplication-basic",
    title: "Multiplication — Basic MCQ",
    emoji: "✖️",
    subject: "math",
    topic: "grade2-multiplication",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "12" },
      { name: "B", type: "integer", min: "2", max: "12" },
      { name: "Result", type: "expression", formula: "A * B" }
    ],
    visuals: [],
    questionText: "What is [A] × [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",         isCorrect: true },
      { label: "[Result] + [B]",   isCorrect: false },
      { label: "[Result] - [B]",   isCorrect: false },
      { label: "[A] + [B]",        isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[A] groups of [B] = [A] × [B] = [Result]." }]
    }
  },
  {
    id: "starter-multiplication-fib",
    title: "Multiplication — Fill In The Blank",
    emoji: "✖️",
    subject: "math",
    topic: "grade2-multiplication",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "12" },
      { name: "B", type: "integer", min: "2", max: "12" },
      { name: "Result", type: "expression", formula: "A * B" }
    ],
    visuals: [],
    questionText: "Complete the multiplication sentence.",
    optionsType: "fillInTheBlank",
    parts: [
      { type: "text", content: "[A] × [B] = [[ans]]" }
    ],
    answer: { ans: "[Result]" },
    explanation: {
      sections: [{ type: "text", content: "[A] × [B] = [Result]. Think of it as [A] groups of [B]." }]
    }
  },
  {
    id: "starter-times-table",
    title: "Times Table Quiz — MCQ",
    emoji: "✖️",
    subject: "math",
    topic: "grade3-times-tables",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Table", type: "integer", min: "2", max: "12" },
      { name: "N",     type: "integer", min: "1", max: "12" },
      { name: "Result", type: "expression", formula: "Table * N" }
    ],
    visuals: [],
    questionText: "[Table] × [N] = ?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",         isCorrect: true },
      { label: "[Result] + [Table]",isCorrect: false },
      { label: "[Result] - [Table]",isCorrect: false },
      { label: "[Table] + [N]",     isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[Table] × [N] = [Result]. (Table of [Table]: [Table]×[N] = [Result])" }]
    }
  },
  // ── Division ─────────────────────────────────────────────────────────────────
  {
    id: "starter-division-exact",
    title: "Division — Exact (No Remainder)",
    emoji: "➗",
    subject: "math",
    topic: "grade3-division",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Divisor",  type: "integer", min: "2", max: "10" },
      { name: "Quotient", type: "integer", min: "2", max: "12" },
      { name: "Dividend", type: "expression", formula: "Divisor * Quotient" }
    ],
    visuals: [],
    questionText: "What is [Dividend] ÷ [Divisor]?",
    optionsType: "mcq",
    options: [
      { label: "[Quotient]",       isCorrect: true },
      { label: "[Quotient] + 1",   isCorrect: false },
      { label: "[Quotient] - 1",   isCorrect: false },
      { label: "[Divisor]",        isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[Dividend] ÷ [Divisor] = [Quotient] because [Divisor] × [Quotient] = [Dividend]." }]
    }
  },
  {
    id: "starter-division-remainder",
    title: "Division — With Remainder",
    emoji: "➗",
    subject: "math",
    topic: "grade3-division",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Dividend", type: "integer", min: "10", max: "99" },
      { name: "Divisor",  type: "integer", min: "2",  max: "9" },
      { name: "Quotient",   type: "expression", formula: "Math.floor(Dividend / Divisor)" },
      { name: "Remainder",  type: "expression", formula: "Dividend % Divisor" },
      { name: "HasRemainder", type: "expression", formula: "Dividend % Divisor !== 0 ? 1 : 0" }
    ],
    visuals: [],
    questionText: "What is [Dividend] ÷ [Divisor]?",
    optionsType: "fillInTheBlank",
    metaConfig: { hasRemainder: true },
    parts: [
      { type: "text", content: "[Dividend] ÷ [Divisor] = [[q]] remainder [[r]]" }
    ],
    answer: { q: "[Quotient]", r: "[Remainder]" },
    explanation: {
      sections: [{ type: "text", content: "[Divisor] × [Quotient] = [Divisor * Quotient]. [Dividend] − [Divisor * Quotient] = [Remainder]. So [Dividend] ÷ [Divisor] = [Quotient] remainder [Remainder]." }]
    }
  },
  // ── Numbers & Comparison ───────────────────────────────────────────────────
  {
    id: "starter-number-comparison",
    title: "Number Comparison — MCQ",
    emoji: "🔢",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "50" },
      { name: "B", type: "integer", min: "1", max: "50" },
      { name: "Rel", type: "expression", formula: "A > B ? '>' : (A < B ? '<' : '=')" }
    ],
    visuals: [],
    questionText: "Compare [A] and [B]. Which sign makes the statement true? \n [A] ___ [B]",
    optionsType: "mcq",
    options: [
      { label: "[A] > [B]", isCorrect: "A > B" },
      { label: "[A] < [B]", isCorrect: "A < B" },
      { label: "[A] = [B]", isCorrect: "A === B" }
    ],
    explanation: {
      sections: [{ type: "text", content: "[A] is [A > B ? 'greater than' : (A < B ? 'less than' : 'equal to')] [B]. So, the correct symbol is [Rel]." }]
    }
  },
  // ── Multiplication Array Model ──────────────────────────────────────────────
  {
    id: "starter-multiplication-array",
    title: "Multiplication — Array Model MCQ",
    emoji: "✖️",
    subject: "math",
    topic: "grade2-multiplication",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Rows", type: "integer", min: "2", max: "5" },
      { name: "Cols", type: "integer", min: "2", max: "6" },
      { name: "Total", type: "expression", formula: "Rows * Cols" }
    ],
    visuals: [
      {
        component: "ItemCounter",
        props: {
          count: "Total",
          itemType: "apple",
          width: "90"
        }
      }
    ],
    questionText: "Look at the array of apples. It has [Rows] rows and [Cols] columns. Which multiplication sentence shows the total number of apples?",
    optionsType: "mcq",
    options: [
      { label: "[Rows] × [Cols] = [Total]", isCorrect: true },
      { label: "[Rows] + [Cols] = [Rows + Cols]", isCorrect: false },
      { label: "[Rows] × [Rows] = [Rows * Rows]", isCorrect: false },
      { label: "[Cols] × [Cols] = [Cols * Cols]", isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "There are [Rows] rows of apples, with [Cols] apples in each row. [Rows] groups of [Cols] is written as [Rows] × [Cols] = [Total]." }]
    }
  },
  // ── Place Value Blocks ──────────────────────────────────────────────────────
  {
    id: "starter-place-value-blocks",
    title: "Place Value — Tens & Ones Blocks MCQ",
    emoji: "🧱",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "T", type: "integer", min: "1", max: "9" },
      { name: "O", type: "integer", min: "1", max: "9" },
      { name: "Value", type: "expression", formula: "T * 10 + O" }
    ],
    visuals: [
      {
        component: "PlaceValue",
        props: {
          thousands: "0",
          hundreds: "0",
          tens: "T",
          ones: "O",
          showChart: "true"
        }
      }
    ],
    questionText: "What number do these blocks show? There are [T] tens and [O] ones.",
    optionsType: "mcq",
    options: [
      { label: "[Value]", isCorrect: true },
      { label: "[O] * 10 + [T]", isCorrect: false },
      { label: "[Value] + 10", isCorrect: false },
      { label: "[Value] - 1", isCorrect: false }
    ],
    explanation: {
      sections: [
        { type: "text", content: "[T] tens is equal to [T * 10], and [O] ones is equal to [O]. When we put them together, [T * 10] + [O] makes [Value]." }
      ]
    }
  }
];

const cleanSvgContent = (svgStr) => {
  if (!svgStr) return '';
  let cleaned = svgStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
  cleaned = cleaned.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
};

const isInlineSvg = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg');
};

const getImageUrlPreview = (value) => {
  if (!value || typeof value !== 'string') return null;
  let cleanValue = value.trim();
  
  // Handle prefix like button::https://...
  if (cleanValue.includes('::')) {
    const parts = cleanValue.split('::');
    const urlPart = parts.find(p => p.trim().startsWith('http'));
    if (urlPart) {
      cleanValue = urlPart.trim();
    } else {
      cleanValue = parts[parts.length - 1].trim();
    }
  }
  
  // Handle comma-separated list of URLs
  if (cleanValue.includes(',')) {
    const urls = cleanValue.split(',');
    const firstUrl = urls.find(u => u.trim().startsWith('http'));
    if (firstUrl) {
      cleanValue = firstUrl.trim();
    } else {
      cleanValue = urls[0].trim();
    }
  }

  // Only return if it starts with http, / (relative path), or data: (data URI)
  if (cleanValue.startsWith('http') || cleanValue.startsWith('/') || cleanValue.startsWith('data:')) {
    return cleanValue;
  }
  
  return null;
};

const getOptionMediaContent = (opt) => {
  if (!opt) return null;
  if (typeof opt === 'string') {
    if (isInlineSvg(opt)) return { type: 'svg', content: opt };
    const url = getImageUrlPreview(opt);
    if (url) return { type: 'image', content: url };
    return null;
  }
  if (typeof opt === 'object') {
    if (opt.emoji) return { type: 'emoji', content: opt.emoji };
    if (opt.svg && typeof opt.svg === 'string') return { type: 'svg', content: opt.svg };
    if (opt.imageUrl && typeof opt.imageUrl === 'string') {
      if (isInlineSvg(opt.imageUrl)) return { type: 'svg', content: opt.imageUrl };
      const url = getImageUrlPreview(opt.imageUrl);
      if (url) return { type: 'image', content: url };
    }
    if (opt.image && typeof opt.image === 'string') {
      const url = getImageUrlPreview(opt.image);
      if (url) return { type: 'image', content: url };
    }
    const labelVal = opt.label ?? opt.value ?? opt.content ?? opt.text ?? '';
    if (typeof labelVal === 'string') {
      if (isInlineSvg(labelVal)) return { type: 'svg', content: labelVal };
      const url = getImageUrlPreview(labelVal);
      if (url) return { type: 'image', content: url };
    }
  }
  return null;
};


const normalizeOptionLabel = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

const hasBlankToken = (value) => /\[\[[^\]]+\]\]|\[blank(?::[^\]]+)?\]/.test(String(value ?? ''));

const hasUnresolvedPlaceholder = (value) => {
  const valueWithoutInlineBlanks = String(value ?? '').replace(/\[\[[^\]]+\]\]|\[blank(?::[^\]]+)?\]/g, '');
  return /\[[A-Za-z_][A-Za-z0-9_]*\]/.test(valueWithoutInlineBlanks);
};

const getPreviewBlankValue = (question, rawKey) => {
  const key = String(rawKey || '').trim().toLowerCase() === 'blank' ? 'ans' : String(rawKey || '').trim();
  const answerMap = question?.answer && typeof question.answer === 'object' ? question.answer : null;
  const correctAnswerMap = question?.correctAnswer && typeof question.correctAnswer === 'object' ? question.correctAnswer : null;
  const scalarAnswer = question?.answer && typeof question.answer !== 'object'
    ? question.answer
    : (question?.correctAnswer && typeof question.correctAnswer !== 'object' ? question.correctAnswer : '');

  return answerMap?.[key] ?? correctAnswerMap?.[key] ?? (key === 'ans' ? scalarAnswer : '');
};

const renderPreviewTextWithBlanks = (text, question) => {
  const value = String(text ?? '');
  const renderPreviewPlainText = (chunk, keyPrefix) => (
    String(chunk).split('\n').map((line, lineIndex, lines) => (
      <span key={`${keyPrefix}-${lineIndex}`}>
        {line}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </span>
    ))
  );

  if (!value.includes('[[')) return renderPreviewPlainText(value, 'preview-text');

  return (
    <span>
      {value.split(/(\[\[[^\]]+\]\])/g).map((chunk, index) => {
        if (!chunk.startsWith('[[') || !chunk.endsWith(']]')) return renderPreviewPlainText(chunk, `preview-chunk-${index}`);
        const correctVal = getPreviewBlankValue(question, chunk.slice(2, -2));
        return (
          <input
            key={`preview-blank-${index}`}
            type="text"
            value={correctVal}
            disabled
            style={{
              width: `${Math.max(String(correctVal ?? '').length * 10 + 20, 60)}px`,
              padding: '4px 8px',
              margin: '0 4px',
              border: '2px solid #22c55e',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#15803d',
              background: '#f0fdf4'
            }}
          />
        );
      })}
    </span>
  );
};

const getTemplateMode = (template) => {
  const partType = template.parts?.[0]?.type || '';
  const optionType = template.optionsType || template.type || '';
  if (partType === 'categorizationv2' || partType === 'categorization' || optionType.includes('categorization')) return 'categorization';
  if (optionType === 'fillInTheBlank' || optionType === 'fib') return 'fillInTheBlank';
  if (partType === 'hotspot_canvas' || optionType.includes('hotspot')) return 'hotspot';
  if (optionType === 'visual_choice') return 'visualChoice';
  return 'mcq';
};

const getStepLabel = (stepId, template) => {
  if (stepId !== 4) return {
    1: 'Template Info',
    2: 'Question Setup',
    3: 'Visuals & Prompt',
    5: 'Feedback & Routing',
    6: 'Preview & Publish'
  }[stepId];

  const mode = getTemplateMode(template);
  if (mode === 'categorization') return 'Drag Items';
  if (mode === 'fillInTheBlank') return 'Blank Answers';
  if (mode === 'hotspot') return 'Hotspot Targets';
  if (mode === 'visualChoice') return 'Visual Choices';
  return 'Answer Choices';
};

const makeVariantSeed = (baseSeed, index) => `${baseSeed || 'qa'}-${index + 1}`;

const analyzeVariantQuestion = (template, question, seed) => {
  const issues = [];
  const warnings = [];
  const mode = getTemplateMode(template);

  if (!question || typeof question !== 'object') {
    issues.push('Evaluator returned no question object.');
    return { seed, issues, warnings };
  }

  if (!question.questionText || !String(question.questionText).trim()) {
    issues.push('Question text is empty.');
  } else if (hasUnresolvedPlaceholder(question.questionText)) {
    issues.push(`Question text has unresolved placeholder: "${question.questionText}"`);
  }

  const visualParts = Array.isArray(question.parts)
    ? question.parts.filter(part => ['svg', 'image', 'visual', 'component', 'interactive'].includes(part.type) || part.imageUrl || part.content?.includes?.('<svg'))
    : [];
  if ((template.visuals?.length || 0) > 0 && visualParts.length === 0) {
    warnings.push('Template defines visuals, but this variant produced no visual part.');
  }

  if (mode === 'mcq' || mode === 'visualChoice') {
    const options = Array.isArray(question.options) ? question.options : [];
    if (options.length < 2) issues.push('MCQ/visual choice variant has fewer than 2 options.');

    const labels = options.map(opt => normalizeOptionLabel(opt?.label ?? opt?.text ?? opt?.value ?? opt));
    const nonEmptyLabels = labels.filter(Boolean);
    if (nonEmptyLabels.length !== labels.length) issues.push('One or more answer choices are empty.');

    const duplicates = nonEmptyLabels.filter((label, idx) => nonEmptyLabels.indexOf(label) !== idx);
    if (duplicates.length > 0) issues.push(`Duplicate answer choices: ${[...new Set(duplicates)].join(', ')}`);

    const unresolved = labels.filter(hasUnresolvedPlaceholder);
    if (unresolved.length > 0) issues.push(`Answer choices have unresolved placeholders: ${unresolved.join(', ')}`);

    const correctIndex = Number(question.correctAnswerIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      issues.push('Correct answer index is missing or out of range.');
    }

    const declaredCorrect = options.filter(opt => opt?.isCorrect === true).length;
    if (declaredCorrect > 1) issues.push('More than one answer choice is marked correct.');
    if (options.length === 4 && new Set(nonEmptyLabels).size < 4) warnings.push('Four-choice MCQ collapsed to fewer than 4 unique labels.');

  }

  if (mode === 'fillInTheBlank') {
    const hasBlank = hasBlankToken(question.questionText)
      || (Array.isArray(question.parts) && question.parts.some(part => hasBlankToken(part.content || part.text)));
    if (!question.answer && !question.correctAnswer && !hasBlank) {
      issues.push('Fill-in-the-blank variant is missing an answer mapping or blank content.');
    }
  }

  if (mode === 'categorization') {
    const catPart = question.parts?.find(part => part.type === 'categorizationv2' || part.type === 'categorization') || template.parts?.[0];
    const categories = catPart?.categories || [];
    const items = catPart?.items || [];
    const answer = catPart?.answer || catPart?.answerKey || question.answer || {};
    if (categories.length < 2) issues.push('Categorization needs at least 2 categories.');
    if (items.length < 2) issues.push('Categorization needs at least 2 draggable items.');
    const missingAssignments = items.filter(item => !answer?.[item.id]);
    if (missingAssignments.length > 0) issues.push(`Items missing category assignment: ${missingAssignments.map(item => item.id).join(', ')}`);
  }

  const explanationText = question.explanation?.sections?.map(section => section.content || '').join(' ') || '';
  if (explanationText && hasUnresolvedPlaceholder(explanationText)) warnings.push('Explanation has unresolved placeholders.');
  if (!explanationText && template.explanation) warnings.push('Template has an explanation definition, but this variant produced no explanation text.');

  return { seed, issues, warnings };
};

const runTemplateVariantQA = (template, count, baseSeed) => {
  const total = Math.max(1, Math.min(Number(count) || 25, 100));
  const failures = [];
  const warningItems = [];
  let passed = 0;

  const templateDistractors = Array.isArray(template.options)
    ? template.options.filter(opt => opt && opt.isCorrect !== true)
    : [];
  const distractorsWithoutPedagogy = templateDistractors.filter(opt => (
    !String(opt.misconception || '').trim() &&
    !String(opt.feedback || '').trim() &&
    !String(opt.remediationHint || '').trim()
  ));
  if (templateDistractors.length > 0 && distractorsWithoutPedagogy.length > 0) {
    warningItems.push({
      seed: 'template',
      issues: [],
      warnings: [`${distractorsWithoutPedagogy.length} distractor(s) have no misconception, feedback, or remediation hint.`]
    });
  }

  for (let i = 0; i < total; i += 1) {
    const seed = makeVariantSeed(baseSeed, i);
    try {
      const question = evaluateTemplate(template, seed);
      const result = analyzeVariantQuestion(template, question, seed);
      if (result.issues.length > 0) failures.push(result);
      else passed += 1;
      if (result.warnings.length > 0) warningItems.push(result);
    } catch (error) {
      failures.push({ seed, issues: [error.message || 'Evaluation failed.'], warnings: [] });
    }
  }

  const failCount = failures.length;
  const warningCount = warningItems.reduce((sum, item) => sum + item.warnings.length, 0);
  const passRate = Math.round(((total - failCount) / total) * 100);
  const score = Math.max(0, passRate - Math.min(20, warningCount * 2));

  return {
    total,
    passed,
    failCount,
    warningCount,
    score,
    failures: failures.slice(0, 12),
    warnings: warningItems.slice(0, 12),
    generatedAt: new Date().toISOString()
  };
};

export default function VisualTemplateBuilderPage() {
  // Database templates state
  const [dynamicTemplates, setDynamicTemplates] = useState([]);
  const [staticTemplates, setStaticTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [loadedPools, setLoadedPools] = useState({});
  const [availablePools, setAvailablePools] = useState([]);

  const groupedPools = useMemo(() => {
    const groups = {
      math: [],
      english: [],
      science: [],
      social_studies: [],
      other: []
    };

    availablePools.forEach(p => {
      const pid = String(p.poolId || '').toLowerCase();
      if (pid.startsWith('math-') || pid.includes('-math-') || pid.includes('maths')) {
        groups.math.push(p);
      } else if (pid.startsWith('english-') || pid.startsWith('ela-') || pid.includes('-english-') || pid.includes('-ela-') || pid.includes('vocab')) {
        groups.english.push(p);
      } else if (pid.startsWith('science-') || pid.includes('-science-')) {
        groups.science.push(p);
      } else if (pid.startsWith('social-') || pid.includes('-social-') || pid.startsWith('history-') || pid.includes('-history-') || pid.startsWith('geography-')) {
        groups.social_studies.push(p);
      } else {
        groups.other.push(p);
      }
    });

    return groups;
  }, [availablePools]);

  // Sidebar search & collapsible category state
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    customDb: true,
    referenceExamples: false,
    mathStarters: false,
    staticCatalog: false,
    // Custom MongoDB sub-subjects
    'custom-math': true,
    'custom-english': true,
    'custom-science': true,
    'custom-mat': true,
    'custom-arithmetic': true,
    'custom-language': true,
    'custom-other': true,
    // Static Catalog sub-subjects
    'static-math': false,
    'static-english': false,
    'static-science': false,
    'static-other': false,
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const matchesSearch = (tpl) => {
    if (!sidebarSearch.trim()) return true;
    const term = sidebarSearch.toLowerCase();
    const title = (tpl.title || "").toLowerCase();
    const id = (tpl.id || "").toLowerCase();
    const topic = (tpl.topic || "").toLowerCase();
    const subject = (tpl.subject || tpl.templateInfo?.subject || "").toLowerCase();
    return title.includes(term) || id.includes(term) || topic.includes(term) || subject.includes(term);
  };

  const isSectionExpanded = (key) => {
    if (sidebarSearch.trim()) return true;
    return !!expandedSections[key];
  };

  // Group dynamic templates categorically by grade and subject
  const groupedDynamicTemplates = useMemo(() => {
    const groups = {};
    const filtered = dynamicTemplates.filter(matchesSearch);
    filtered.forEach(tpl => {
      let grade = tpl.grade || tpl.templateInfo?.grade || tpl.metadata?.grade || '';
      grade = grade.toString().trim();
      let gradeKey = 'Other Grades';
      if (grade === '1' || grade === 'grade-1') gradeKey = 'Grade 1';
      else if (grade.toLowerCase() === 'lkg') gradeKey = 'LKG';
      else if (grade.toLowerCase() === 'ukg') gradeKey = 'UKG';
      else if (grade === '2' || grade === 'grade-2') gradeKey = 'Grade 2';
      else if (grade === '3' || grade === 'grade-3') gradeKey = 'Grade 3';
      else if (grade === '4' || grade === 'grade-4') gradeKey = 'Grade 4';
      else if (grade === '5' || grade === 'grade-5') gradeKey = 'Grade 5';
      else if (grade === '6' || grade === 'grade-6') gradeKey = 'Grade 6';
      
      let subject = tpl.subject || tpl.templateInfo?.subject || tpl.metadata?.subject || 'other';
      subject = subject.toLowerCase().trim();
      const subjectKey = (subject === 'math' || subject === 'english' || subject === 'science' || subject === 'gk' || subject === 'social_studies' || subject === 'mat' || subject === 'arithmetic' || subject === 'language') ? subject : 'other';

      if (!groups[gradeKey]) {
        groups[gradeKey] = {};
      }
      if (!groups[gradeKey][subjectKey]) {
        groups[gradeKey][subjectKey] = [];
      }
      groups[gradeKey][subjectKey].push(tpl);
    });
    return groups;
  }, [dynamicTemplates, sidebarSearch]);

  // Guide modal states
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('overview');

  // Editor State
  const [template, setTemplate] = useState(normalizeTemplateForBuilder(DEFAULT_TEMPLATE));
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Simulator State
  const [currentStep, setCurrentStep] = useState(1);
  const [seed, setSeed] = useState('12345');
  const [showJson, setShowJson] = useState(false);
  
  // Advanced Live Preview State
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewControls, setPreviewControls] = useState({
    randomizeItems: false,
    randomizeOrder: false,
    showCorrectAnswer: false,
    previewAsStudent: true
  });
  const [sampleSet, setSampleSet] = useState('Sample Set 1');
  const [qaSampleCount, setQaSampleCount] = useState(20);
  const [variantQaReport, setVariantQaReport] = useState(null);
  const [variantQaRunning, setVariantQaRunning] = useState(false);
  const [aiAssistantExpanded, setAiAssistantExpanded] = useState(false);

  // Code editor state
  const [editorMode, setEditorMode] = useState('form'); // 'form' or 'json'
  const [jsonText, setJsonText] = useState(JSON.stringify(normalizeTemplateForBuilder(DEFAULT_TEMPLATE), null, 2));
  const [jsonError, setJsonError] = useState(null);

  // Gallery and Custom Selector States
  const [useCustomItemType, setUseCustomItemType] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState([]);
  const [galleryImageLabels, setGalleryImageLabels] = useState({}); // { [url]: customLabel }
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryTargetProp, setGalleryTargetProp] = useState(''); // 'itemType' or 'imageUrl'

  // Modal search and web import states
  const [gallerySearch, setGallerySearch] = useState('');
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchType, setWebSearchType] = useState('clipart');
  const [webResults, setWebResults] = useState([]);
  const [webSearching, setWebSearching] = useState(false);
  const [importingUrl, setImportingUrl] = useState(null);
  const [importedWebUrls, setImportedWebUrls] = useState({}); // { [remoteUrl]: localR2Url }

  // AI Template Builder states
  const [aiTemplatePrompt, setAiTemplatePrompt] = useState('');
  const [aiTemplateGenerating, setAiTemplateGenerating] = useState(false);
  const [aiTemplateSuccessMsg, setAiTemplateSuccessMsg] = useState('');

  // Upgraded Gallery states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Metadata Editor states
  const [editingMetaItem, setEditingMetaItem] = useState(null); // img object
  const [metaEditSingular, setMetaEditSingular] = useState('');
  const [metaEditPlural, setMetaEditPlural] = useState('');
  const [metaEditArticle, setMetaEditArticle] = useState('a');
  const [metaEditCategory, setMetaEditCategory] = useState('general');
  const [metaEditTags, setMetaEditTags] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  // Gallery Direct Upload states
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDragOver, setGalleryDragOver] = useState(false);
  
  // Gallery zoom lightbox
  const [galleryZoomImg, setGalleryZoomImg] = useState(null);
  const [activeHsIdx, setActiveHsIdx] = useState(0);

  // Curriculum skill linking states
  const [linkToSkill, setLinkToSkill] = useState(false);
  const [curriculumNodes, setCurriculumNodes] = useState([]);
  const [skillSubject, setSkillSubject] = useState('math');
  const [skillSubjectCustomId, setSkillSubjectCustomId] = useState('');
  const [skillSubjectCustomTitle, setSkillSubjectCustomTitle] = useState('');
  const [skillTopic, setSkillTopic] = useState('');
  const [skillTopicCustomId, setSkillTopicCustomId] = useState('');
  const [skillTopicCustomTitle, setSkillTopicCustomTitle] = useState('');
  const [skillChapter, setSkillChapter] = useState('');
  const [skillChapterCustomId, setSkillChapterCustomId] = useState('');
  const [skillChapterCustomTitle, setSkillChapterCustomTitle] = useState('');
  const [skillGrade, setSkillGrade] = useState('');
  const [skillTitle, setSkillTitle] = useState('');
  const [skillIdInput, setSkillIdInput] = useState('');
  const [skillCode, setSkillCode] = useState('');
  const [skillOrder, setSkillOrder] = useState('0');
  // Difficulty scaling state
  const [skillDifficultyScaling, setSkillDifficultyScaling] = useState(false);
  const [skillTemplateLevels, setSkillTemplateLevels] = useState([
    { level: 1, templateIds: [] },
    { level: 2, templateIds: [] },
    { level: 3, templateIds: [] },
  ]);
  const [levelAddInputs, setLevelAddInputs] = useState({ 1: '', 2: '', 3: '' });
  const [expandedLevel, setExpandedLevel] = useState(1);

  // Create Vocabulary Pool states
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [newPoolTab, setNewPoolTab] = useState('quick'); // 'quick' or 'json'
  const [newPoolId, setNewPoolId] = useState('');
  const [newPoolSubject, setNewPoolSubject] = useState('science');
  const [newPoolTopic, setNewPoolTopic] = useState('general');
  const [newPoolCategories, setNewPoolCategories] = useState('light, heavy');
  const [newPoolJson, setNewPoolJson] = useState('');
  const [createPoolStatus, setCreatePoolStatus] = useState('');
  const [createPoolSaving, setCreatePoolSaving] = useState(false);

  // Option Pool Library Modal states
  const [showPoolLibraryModal, setShowPoolLibraryModal] = useState(false);
  const [activeLibraryPool, setActiveLibraryPool] = useState(null); // The full pool object from DB
  const [activeLibraryCategory, setActiveLibraryCategory] = useState('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryStatus, setLibraryStatus] = useState('');
  const [librarySaving, setLibrarySaving] = useState(false);
  const [libraryNewCategory, setLibraryNewCategory] = useState('');
  const [libraryNewWords, setLibraryNewWords] = useState('');
  const [libraryImageSearchQuery, setLibraryImageSearchQuery] = useState('');
  const [libraryImageSearchResults, setLibraryImageSearchResults] = useState([]);
  const [libraryImageSearchIndex, setLibraryImageSearchIndex] = useState(null); // { cat, idx }
  const [libraryImageSearching, setLibraryImageSearching] = useState(false);

  const handleAiTemplateGenerate = async () => {
    if (!aiTemplatePrompt.trim()) return;
    setAiTemplateGenerating(true);
    setAiTemplateSuccessMsg('');
    try {
      const res = await fetch('/api/admin/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiTemplatePrompt,
          subject: template.subject || 'math',
          topic: template.topic || 'general'
        })
      });
      const data = await res.json();
      if (data.success && data.template) {
        const generated = data.template;
        const normalized = normalizeTemplateForBuilder(generated);
        setTemplate(normalized);
        setJsonText(JSON.stringify(normalized, null, 2));
        setAiTemplateSuccessMsg('✨ AI successfully generated the template! Check it out below.');
        setTimeout(() => setAiTemplateSuccessMsg(''), 5000);
      } else {
        alert(`Failed to generate template: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('AI template generation failed:', err);
      alert(`AI template generation failed: ${err.message}`);
    } finally {
      setAiTemplateGenerating(false);
    }
  };

  const handleCreateVocabularyPool = async () => {
    setCreatePoolStatus('');
    setCreatePoolSaving(true);
    try {
      let payload;
      if (newPoolTab === 'quick') {
        const poolId = newPoolId.trim();
        if (!poolId) {
          throw new Error('Please enter a Pool ID.');
        }
        const categoriesList = newPoolCategories
          .split(',')
          .map(c => c.trim())
          .filter(Boolean)
          .map(c => c.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/(^_+|_+$)/g, ''));
        
        if (categoriesList.length === 0) {
          throw new Error('Please enter at least one category.');
        }
        
        payload = {
          poolId,
          subject: newPoolSubject,
          topic: newPoolTopic,
          status: 'draft',
          version: 1,
          pools: Object.fromEntries(categoriesList.map(c => [c, []]))
        };
      } else {
        if (!newPoolJson.trim()) {
          throw new Error('Please paste a JSON pool structure.');
        }
        try {
          payload = JSON.parse(newPoolJson);
        } catch (e) {
          throw new Error('Invalid JSON format. Check brackets and quotes.');
        }
        if (!payload.poolId) {
          throw new Error('JSON is missing a "poolId" property.');
        }
        if (!payload.pools && !payload.categories) {
          throw new Error('JSON must contain a "pools" or "categories" object.');
        }
      }

      const res = await fetch('/api/admin/vocabulary-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save vocabulary pool.');
      }

      await fetchVocabularyPools();
      
      setLoadedPools(prev => ({
        ...prev,
        [payload.poolId]: {
          ...payload,
          pools: payload.pools || payload.categories
        }
      }));

      setCreatePoolStatus(`✅ Success! Pool "${payload.poolId}" created.`);
      setNewPoolId('');
      setNewPoolJson('');
      
      setTimeout(() => {
        setShowCreatePoolModal(false);
        setCreatePoolStatus('');
      }, 1500);
    } catch (err) {
      setCreatePoolStatus(`❌ Error: ${err.message}`);
    } finally {
      setCreatePoolSaving(false);
    }
  };

  const openPoolLibrary = async (poolId) => {
    if (!poolId) return;
    setLibraryStatus('Loading pool details...');
    setShowPoolLibraryModal(true);
    try {
      const res = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId)}`);
      const data = await res.json();
      if (data.success && data.pool) {
        setActiveLibraryPool(data.pool);
        const categories = Object.keys(data.pool.pools || {});
        setActiveLibraryCategory(categories[0] || '');
        setLibraryStatus('');
      } else {
        throw new Error(data.error || 'Failed to fetch pool details.');
      }
    } catch (err) {
      setLibraryStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleLibraryAddWords = () => {
    if (!libraryNewWords.trim() || !activeLibraryCategory) return;
    const newWordsList = libraryNewWords
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(Boolean);
    
    if (newWordsList.length === 0) return;

    setActiveLibraryPool(prev => {
      if (!prev) return prev;
      const updatedPools = { ...prev.pools };
      const currentList = updatedPools[activeLibraryCategory] || [];
      const usedIds = new Set(currentList.map(item => item.id || item.label));
      
      const newItems = newWordsList.map(w => {
        let cleanId = w.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
        if (usedIds.has(cleanId)) {
          cleanId = `${cleanId}_${Math.floor(Math.random() * 1000)}`;
        }
        return {
          id: cleanId,
          label: w,
          active: true
        };
      });

      updatedPools[activeLibraryCategory] = [...currentList, ...newItems];
      return { ...prev, pools: updatedPools };
    });

    setLibraryNewWords('');
    setLibraryStatus('Words added. Don\'t forget to click Save Pool Changes.');
  };

  const handleLibraryAddCategory = () => {
    const cat = libraryNewCategory.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if (!cat) return;
    if (activeLibraryPool?.pools?.[cat]) {
      alert('Category already exists!');
      return;
    }
    setActiveLibraryPool(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pools: {
          ...prev.pools,
          [cat]: []
        }
      };
    });
    setActiveLibraryCategory(cat);
    setLibraryNewCategory('');
    setLibraryStatus(`Category "${cat}" added.`);
  };

  const handleLibraryRemoveItem = (cat, idx) => {
    setActiveLibraryPool(prev => {
      if (!prev) return prev;
      const updatedPools = { ...prev.pools };
      updatedPools[cat] = (updatedPools[cat] || []).filter((_, i) => i !== idx);
      return { ...prev, pools: updatedPools };
    });
    setLibraryStatus('Item removed.');
  };

  const handleLibraryUpdateField = (cat, idx, field, value) => {
    setActiveLibraryPool(prev => {
      if (!prev) return prev;
      const updatedPools = { ...prev.pools };
      const updatedList = [...(updatedPools[cat] || [])];
      updatedList[idx] = { ...updatedList[idx], [field]: value };
      updatedPools[cat] = updatedList;
      return { ...prev, pools: updatedPools };
    });
  };

  const handleLibraryItemMetadataChange = (cat, idx, propertyName, propertyVal) => {
    setActiveLibraryPool(prev => {
      if (!prev) return prev;
      const updatedPools = { ...prev.pools };
      const updatedList = [...(updatedPools[cat] || [])];
      
      const item = { ...updatedList[idx] };
      const cleanProp = propertyName.trim();
      
      if (propertyVal === undefined || propertyVal === null || propertyVal === '') {
        delete item[cleanProp];
      } else {
        item[cleanProp] = propertyVal;
      }
      
      updatedList[idx] = item;
      updatedPools[cat] = updatedList;
      return { ...prev, pools: updatedPools };
    });
  };

  const generateTTSForLibraryItem = async (cat, idx) => {
    const item = activeLibraryPool?.pools?.[cat]?.[idx];
    if (!item?.label) return;
    setLibraryStatus(`Generating TTS audio for "${item.label}"...`);
    try {
      const voice = activeLibraryPool.voice || 'en-US-Journey-F';
      const res = await fetch('/api/admin/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.label,
          voice: voice,
          speed: 1.0
        })
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        handleLibraryUpdateField(cat, idx, 'audioUrl', data.audioUrl);
        setLibraryStatus(`✅ TTS Audio generated for "${item.label}".`);
      } else {
        throw new Error(data.error || 'TTS generation failed.');
      }
    } catch (err) {
      setLibraryStatus(`❌ TTS Error: ${err.message}`);
    }
  };

  const searchImageForLibraryItem = async (cat, idx, label) => {
    setLibraryImageSearchIndex({ cat, idx });
    setLibraryImageSearchQuery(label);
    setLibraryImageSearching(true);
    setLibraryImageSearchResults([]);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(label)}&type=clipart`);
      const data = await res.json();
      if (data.success) {
        setLibraryImageSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('Image search failed:', err);
    } finally {
      setLibraryImageSearching(false);
    }
  };

  const selectImageForLibraryItem = async (cat, idx, remoteUrl) => {
    setLibraryStatus('Importing image to storage...');
    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl })
      });
      const data = await res.json();
      if (data.success && data.url) {
        handleLibraryUpdateField(cat, idx, 'imageUrl', data.url);
        setLibraryStatus('✅ Image linked successfully.');
        setLibraryImageSearchIndex(null);
      } else {
        throw new Error(data.error || 'Image upload failed.');
      }
    } catch (err) {
      setLibraryStatus(`❌ Image upload failed: ${err.message}`);
    }
  };

  const savePoolLibrary = async () => {
    if (!activeLibraryPool) return;
    setLibrarySaving(true);
    setLibraryStatus('Saving changes to database...');
    try {
      const res = await fetch('/api/admin/vocabulary-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeLibraryPool)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save changes.');
      }

      await fetchVocabularyPools();
      
      setLoadedPools(prev => ({
        ...prev,
        [activeLibraryPool.poolId]: activeLibraryPool
      }));

      setLibraryStatus('✅ Changes saved successfully!');
      setTimeout(() => {
        setLibraryStatus('');
      }, 2000);
    } catch (err) {
      setLibraryStatus(`❌ Error: ${err.message}`);
    } finally {
      setLibrarySaving(false);
    }
  };

  const handleRunVariantQA = () => {
    setVariantQaRunning(true);
    setTimeout(() => {
      try {
        const report = runTemplateVariantQA(resolvedTemplate, qaSampleCount, seed);
        setVariantQaReport(report);
      } catch (error) {
        setVariantQaReport({
          total: 0,
          passed: 0,
          failCount: 1,
          warningCount: 0,
          score: 0,
          failures: [{ seed, issues: [error.message || 'Variant QA failed.'], warnings: [] }],
          warnings: [],
          generatedAt: new Date().toISOString()
        });
      } finally {
        setVariantQaRunning(false);
      }
    }, 0);
  };

  const handleCopyJson = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(jsonText);
        alert('📋 JSON recipe copied to clipboard!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = jsonText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('📋 JSON recipe copied to clipboard! (fallback)');
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
      alert('Failed to copy text to clipboard.');
    }
  };

  const handlePasteJson = async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }
      
      if (!text) {
        text = prompt('Paste your template JSON recipe here:');
      }

      if (text) {
        setJsonText(text);
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object') {
            setTemplate(normalizeTemplateForBuilder(parsed));
            setJsonError(null);
            alert('✅ JSON recipe pasted and parsed successfully!');
          } else {
            setJsonError('Must be a JSON object');
            alert('⚠️ Pasted JSON is not an object.');
          }
        } catch (err) {
          setJsonError(err.message);
          alert(`⚠️ Pasted JSON has syntax error: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      const pasted = prompt('Paste your template JSON recipe here:');
      if (pasted) {
        setJsonText(pasted);
        try {
          const parsed = JSON.parse(pasted);
          if (parsed && typeof parsed === 'object') {
            setTemplate(normalizeTemplateForBuilder(parsed));
            setJsonError(null);
            alert('✅ JSON recipe pasted and parsed successfully!');
          } else {
            setJsonError('Must be a JSON object');
            alert('⚠️ Pasted JSON is not an object.');
          }
        } catch (err) {
          setJsonError(err.message);
          alert(`⚠️ Pasted JSON has syntax error: ${err.message}`);
        }
      }
    }
  };

  const handleParseToFormAndReview = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === 'object') {
        setTemplate(normalizeTemplateForBuilder(parsed));
        setJsonError(null);
        setEditorMode('form');
        setCurrentStep(6);
        alert('⚡ Parsed to form successfully! Redirecting you to "Preview & Publish" tab to review.');
      } else {
        setJsonError('Must be a JSON object');
        alert('⚠️ Parse Error: The JSON is not a valid object.');
      }
    } catch (err) {
      setJsonError(err.message);
      alert(`⚠️ Parse Error: ${err.message}`);
    }
  };

  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    try {
      const fd = new FormData();
      fd.append('folder', 'images');
      fd.append('maxWidth', '1200');
      fd.append('quality', '85');
      fd.append('format', 'image/webp');
      Array.from(files).forEach(file => {
        fd.append('files[]', file);
      });
      
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      if (data.results && data.results.length > 0) {
        const listRes = await fetch('/api/admin/list-images?prefix=images/');
        const listData = await listRes.json();
        setGalleryImages(listData.images || []);
        
        // Auto-select the first uploaded image
        const firstUploadedUrl = data.results[0].url;
        setSelectedGalleryUrls(prev => {
          if (!prev.includes(firstUploadedUrl)) {
            return [...prev, firstUploadedUrl];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Direct upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleOpenEditMetadata = (img) => {
    setEditingMetaItem(img);
    setMetaEditSingular(img.linguistics?.singular || '');
    setMetaEditPlural(img.linguistics?.plural || '');
    setMetaEditArticle(img.linguistics?.article || 'a');
    setMetaEditCategory(img.classification?.category || 'general');
    setMetaEditTags(Array.isArray(img.classification?.tags) ? img.classification.tags.join(', ') : '');
  };

  const handleSaveMetadata = async () => {
    if (!editingMetaItem) return;
    setIsSavingMeta(true);
    try {
      const tagsArray = metaEditTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/admin/update-image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingMetaItem.key,
          linguistics: {
            singular: metaEditSingular,
            plural: metaEditPlural,
            article: metaEditArticle
          },
          classification: {
            category: metaEditCategory,
            tags: tagsArray
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setGalleryImages(prev => prev.map(img => {
          if (img.key === editingMetaItem.key) {
            return {
              ...img,
              linguistics: { singular: metaEditSingular, plural: metaEditPlural, article: metaEditArticle },
              classification: { category: metaEditCategory, tags: tagsArray }
            };
          }
          return img;
        }));
        setEditingMetaItem(null);
      } else {
        alert(`Failed to save metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed saving metadata:', err);
      alert(`Failed saving metadata: ${err.message}`);
    } finally {
      setIsSavingMeta(false);
    }
  };


  const openGallery = async (targetProp, currentVal = '') => {
    setGalleryTargetProp(targetProp);
    setShowGallery(true);
    setGalleryLoading(true);
    setGallerySearch('');
    setIsWebSearch(false);
    webSearchQuery && setWebSearchQuery('');
    setWebResults([]);
    setWebSearching(false);
    setImportingUrl(null);
    
    // Parse current values — support both legacy "url, url" and new "label::url, label::url" formats
    let initialSelected = [];
    let initialLabels = {};
    const rawEntries = typeof currentVal === 'string' && currentVal.trim()
      ? currentVal.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(currentVal) ? currentVal : [];
    for (const entry of rawEntries) {
      if (entry.includes('::')) {
        const [label, url] = entry.split('::').map(s => s.trim());
        if (url) {
          initialSelected.push(url);
          if (label) initialLabels[url] = label;
        }
      } else {
        initialSelected.push(entry);
      }
    }
    setSelectedGalleryUrls(initialSelected);
    setGalleryImageLabels(initialLabels);
    
    try {
      const res = await fetch('/api/admin/list-images?prefix=images/');
      const data = await res.json();
      setGalleryImages(data.images || []);
    } catch (err) {
      console.error('Failed to load gallery images:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSelectGalleryImage = (url) => {
    setSelectedGalleryUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const applyGallerySelection = () => {
    // Encode as "label::url" when a custom label exists, otherwise just "url"
    const entries = selectedGalleryUrls.map(url => {
      const label = (galleryImageLabels[url] || '').trim();
      return label ? `${label}::${url}` : url;
    });
    const valueStr = entries.join(', ');

    if (galleryTargetProp === 'backgroundUrl') {
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'hotspot_canvas');
      if (partIdx >= 0) {
        newParts[partIdx] = { ...newParts[partIdx], backgroundUrl: valueStr };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp === 'composeScene.targetClipart') {
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'hotspot_canvas');
      if (partIdx >= 0 && newParts[partIdx].composeScene) {
        newParts[partIdx] = {
          ...newParts[partIdx],
          composeScene: {
            ...newParts[partIdx].composeScene,
            targetClipart: valueStr
          }
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('dnd_category_prefillImageUrl_')) {
      const catIdx = parseInt(galleryTargetProp.replace('dnd_category_prefillImageUrl_', ''), 10);
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
      if (partIdx >= 0 && newParts[partIdx].categories?.[catIdx]) {
        newParts[partIdx].categories[catIdx] = {
          ...newParts[partIdx].categories[catIdx],
          prefillImageUrl: valueStr
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('dnd_item_imageUrl_')) {
      const itemIdx = parseInt(galleryTargetProp.replace('dnd_item_imageUrl_', ''), 10);
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
      if (partIdx >= 0 && newParts[partIdx].items?.[itemIdx]) {
        newParts[partIdx].items[itemIdx] = {
          ...newParts[partIdx].items[itemIdx],
          imageUrl: valueStr
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('variable_items_')) {
      const varIdx = parseInt(galleryTargetProp.replace('variable_items_', ''), 10);
      updateVariable(varIdx, 'items', entries);
    } else {
      updateVisualProp(galleryTargetProp, valueStr);
    }
    
    if (galleryTargetProp === 'itemType') {
      setUseCustomItemType(true);
    }
    
    setShowGallery(false);
  };

  // Extracted list of all categories dynamically
  const availableCategories = useMemo(() => {
    const cats = new Set();
    galleryImages.forEach(img => {
      const cat = img.classification?.category || 'general';
      cats.add(cat.toLowerCase().trim());
    });
    return ['all', ...Array.from(cats)];
  }, [galleryImages]);

  // Extracted list of popular tags dynamically
  const popularTags = useMemo(() => {
    const tagsMap = {};
    galleryImages.forEach(img => {
      if (img.classification?.tags) {
        img.classification.tags.forEach(t => {
          const clean = t.toLowerCase().trim();
          if (clean && clean !== 'imported-asset') {
            tagsMap[clean] = (tagsMap[clean] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(tagsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(entry => entry[0]);
  }, [galleryImages]);

  // Local image list filter
  const filteredLocalImages = useMemo(() => {
    let list = galleryImages;
    
    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(img => (img.classification?.category || 'general').toLowerCase().trim() === selectedCategory);
    }
    
    // Tag chip filter
    if (selectedTag) {
      list = list.filter(img => img.classification?.tags?.some(t => t.toLowerCase().trim() === selectedTag));
    }
    
    // Query search filter
    if (gallerySearch.trim()) {
      const q = gallerySearch.toLowerCase();
      list = list.filter(img => {
        const nameMatch = (img.name || '').toLowerCase().includes(q);
        const keyMatch = (img.key || '').toLowerCase().includes(q);
        const tagMatch = img.classification?.tags?.some(t => t.toLowerCase().includes(q));
        const categoryMatch = (img.classification?.category || '').toLowerCase().includes(q);
        return nameMatch || keyMatch || tagMatch || categoryMatch;
      });
    }
    
    return list;
  }, [galleryImages, gallerySearch, selectedCategory, selectedTag]);

  // Handle DuckDuckGo web image search
  const handleWebSearch = async (e) => {
    if (e) e.preventDefault();
    if (!webSearchQuery.trim()) return;
    setWebSearching(true);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(webSearchQuery)}&type=${webSearchType}`);
      const data = await res.json();
      if (data.success) {
        setWebResults(data.results || []);
      } else {
        console.error('Web search error:', data.error);
      }
    } catch (err) {
      console.error('Failed web search:', err);
    } finally {
      setWebSearching(false);
    }
  };

  // Import remote image to R2 and database
  const handleImportWebImage = async (remoteUrl) => {
    // If already imported in this session, toggle selection
    if (importedWebUrls[remoteUrl]) {
      const localUrl = importedWebUrls[remoteUrl];
      setSelectedGalleryUrls(prev => {
        if (prev.includes(localUrl)) {
          return prev.filter(u => u !== localUrl);
        } else {
          return [...prev, localUrl];
        }
      });
      return;
    }

    setImportingUrl(remoteUrl);
    try {
      const res = await fetch('/api/admin/fetch-url-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: remoteUrl,
          folder: 'images',
          customName: webSearchQuery || 'imported-web'
        })
      });
      const data = await res.json();
      if (data.r2Url) {
        const newLocalUrl = data.r2Url;
        
        // Add to imported map
        setImportedWebUrls(prev => ({ ...prev, [remoteUrl]: newLocalUrl }));
        
        // Add to selection list
        setSelectedGalleryUrls(prev => [...prev, newLocalUrl]);
        
        // Add new asset to local list
        const cleanName = data.key.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ');
        const newImgObj = {
          key: data.key,
          url: newLocalUrl,
          name: cleanName,
          classification: data.classification || { tags: ['imported-asset'], category: 'imported' }
        };
        setGalleryImages(prev => [newImgObj, ...prev]);
      } else {
        alert(`Failed to import image: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImportingUrl(null);
    }
  };

  // Load templates on mount
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        setDynamicTemplates(data.dynamicTemplates || []);
        setStaticTemplates(data.groupedTemplates || {});
        
        // Auto select by query param id
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlId = params.get('id');
          const isDuplicate = params.get('duplicate') === 'true';
          if (urlId) {
            const tpl = (data.dynamicTemplates || []).find(t => t.id === urlId) ||
                        Object.values(data.templates || {}).find(t => t.id === urlId);
            if (tpl) {
              if (isDuplicate) {
                const copyTpl = {
                  ...tpl,
                  id: `${tpl.id}-copy-${Date.now()}`,
                  title: `${tpl.title || 'Untitled'} (Copy)`
                };
                handleSelectTemplate(copyTpl);
                setSelectedId(null);
              } else {
                handleSelectTemplate(tpl);
              }
            }
          } else if (params.get('examId') === 'jnvst') {
            const uniqueId = `template-jnvst-${Date.now()}`;
            const newTpl = {
              ...normalizeTemplateForBuilder(DEFAULT_TEMPLATE),
              id: uniqueId,
              examId: 'jnvst',
              subject: 'arithmetic',
              title: 'New JNVST Template'
            };
            setTemplate(newTpl);
            setJsonText(JSON.stringify(newTpl, null, 2));
            setJsonError(null);
            setSaveStatus(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumNodes = async () => {
    try {
      const res = await fetch('/api/admin/curriculum?limit=1000');
      const data = await res.json();
      if (data.success && data.nodes) {
        setCurriculumNodes(data.nodes);
      }
    } catch (err) {
      console.error('Failed to fetch curriculum nodes:', err);
    }
  };

  const fetchVocabularyPools = async () => {
    try {
      const res = await fetch('/api/admin/vocabulary-pools');
      const data = await res.json();
      if (data.success && Array.isArray(data.pools)) {
        setAvailablePools(data.pools);
      }
    } catch (err) {
      console.error('Failed to fetch vocabulary pools:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCurriculumNodes();
    fetchVocabularyPools();
  }, []);

  useEffect(() => {
    if (editorMode === 'form') {
      setJsonText(JSON.stringify(template, null, 2));
    }
  }, [template, editorMode]);

  // Auto-fill link skill fields when template changes
  useEffect(() => {
    if (template) {
      const existingNode = Array.isArray(curriculumNodes) && curriculumNodes.find(
        node => node.templateId === template.id || node.id === template.id
      );

      if (existingNode) {
        setLinkToSkill(true);
        setSkillTitle(existingNode.title || template.title || '');
        setSkillIdInput(existingNode.skillId || template.id || '');
        setSkillSubject(existingNode.subjectId || '');
        setSkillTopic(existingNode.topicId || '');
        setSkillChapter(existingNode.chapterId || '');
        setSkillGrade(existingNode.grade || '');
        setSkillCode(existingNode.code || '');
        setSkillOrder(String(existingNode.order || 0));
      } else {
        setLinkToSkill(false);
        setSkillTitle(template.title || '');
        setSkillIdInput(template.id || '');
        
        const subj = template.subject || 'math';
        setSkillSubject(subj);
        setSkillSubjectCustomId('');
        setSkillSubjectCustomTitle('');

        const topic = template.topic || '';
        setSkillTopic(topic);
        setSkillTopicCustomId('');
        setSkillTopicCustomTitle('');

        const chap = topic ? `${topic}-chapter` : '';
        setSkillChapter(chap);
        setSkillChapterCustomId('');
        setSkillChapterCustomTitle('');

        setSkillGrade('');
        setSkillCode('');
        setSkillOrder('0');
      }
    }
  }, [template.id, curriculumNodes]);

  // Auto-initialize hotspot canvas properties when changed to hotspot_select
  useEffect(() => {
    if (template.optionsType === 'hotspot_select') {
      const hasPart = Array.isArray(template.parts) && template.parts.some(p => p.type === 'hotspot_canvas');
      if (!hasPart) {
        const currentParts = Array.isArray(template.parts) ? template.parts : [];
        const newParts = [
          ...currentParts,
          {
            type: 'hotspot_canvas',
            backgroundUrl: '',
            canvasWidth: 500,
            canvasHeight: 320,
            transparent: true,
            hotspots: [
              { id: 'box_a', label: 'Box A', x: 20, y: 150, width: 220, height: 150, optionIndex: 0 },
              { id: 'box_b', label: 'Box B', x: 260, y: 150, width: 220, height: 150, optionIndex: 1 }
            ]
          }
        ];
        updateField('parts', newParts);
        setActiveHsIdx(0);
      }
    }
  }, [template.optionsType]);


  // Handle template selection from sidebar
  const handleSelectTemplate = (tpl) => {
    setSelectedId(tpl.id);
    
    // Ensure explanation structure is normalized
    const normalized = normalizeTemplateForBuilder(tpl);
    
    setTemplate(normalized);
    setJsonText(JSON.stringify(normalized, null, 2));
    setJsonError(null);
    setSaveStatus(null);

    // Auto expand parent category sections
    const isReference = REFERENCE_EXAMPLES.some(r => r.id === tpl.id);
    const isStarter = MATH_STARTERS.some(s => s.id === tpl.id);
    const isStatic = tpl.isStatic || (!isReference && !isStarter && staticList.some(s => s.id === tpl.id));
    
    const subject = tpl.subject || tpl.templateInfo?.subject || 'other';
    const subjectKey = subject.toLowerCase().trim();

    setExpandedSections(prev => {
      const next = { ...prev };
      if (isReference) {
        next.referenceExamples = true;
      } else if (isStarter) {
        next.mathStarters = true;
      } else if (isStatic) {
        next.staticCatalog = true;
        next[`static-${subjectKey}`] = true;
      } else {
        next.customDb = true;
        next[`custom-${subjectKey}`] = true;
      }
      return next;
    });
  };

  // Start a new template
  const handleNewTemplate = () => {
    setSelectedId(null);
    const uniqueId = `template-${Date.now()}`;
    const newTpl = {
      ...normalizeTemplateForBuilder(DEFAULT_TEMPLATE),
      id: uniqueId,
      title: 'New Custom Template'
    };
    setTemplate(newTpl);
    setJsonText(JSON.stringify(newTpl, null, 2));
    setJsonError(null);
    setSaveStatus(null);
  };

  // Deep update helper
  const updateField = (field, value) => {
    setTemplate(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-update ID if title changes and it's a new unsaved template
      if (field === 'title' && !selectedId) {
        const slug = value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        next.id = slug ? `template-${slug}` : `template-${Date.now()}`;
      }
      
      return next;
    });
  };

  const updateMetaConfigProp = (propName, propVal) => {
    setTemplate(prev => {
      const next = { ...prev };
      next.metaConfig = {
        ...(prev.metaConfig || {}),
        [propName]: propVal
      };
      return next;
    });
  };

  const updateNestedConfig = (section, key, value) => {
    setTemplate(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value
      }
    }));
  };

  const updateDeepConfig = (section, group, key, value) => {
    setTemplate(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [group]: {
          ...((prev[section] || {})[group] || {}),
          [key]: value
        }
      }
    }));
  };

  const addDataSource = () => {
    updateField('dataSources', [
      ...(template.dataSources || []),
      { id: `source_${(template.dataSources || []).length + 1}`, type: 'static_data', name: 'New Source', items: [] }
    ]);
  };

  const addPoolSource = () => {
    const nextNumber = (template.dataSources || []).filter(source => source.type === 'pool_selection').length + 1;
    updateField('dataSources', [
      ...(template.dataSources || []),
      {
        id: `poolSource_${nextNumber}`,
        type: 'pool_selection',
        poolId: '',
        category: '',
        count: 1,
        variableName: `PoolItems_${nextNumber}`,
        categories: []
      }
    ]);
  };

  const updateDataSource = (index, key, value) => {
    const sources = [...(template.dataSources || [])];
    const nextSource = { ...sources[index], [key]: value };
    if (key === 'category') {
      nextSource.categories = value ? [value] : [];
    }
    if (key === 'poolId' && nextSource.type === 'pool_selection') {
      nextSource.name = value;
    }
    sources[index] = nextSource;
    updateField('dataSources', sources);
  };

  const removeDataSource = (index) => {
    updateField('dataSources', (template.dataSources || []).filter((_, idx) => idx !== index));
  };

  const getPoolCategories = (poolId) => {
    if (!poolId) return [];
    const poolDoc = loadedPools[poolId];
    if (poolDoc && poolDoc !== 'loading' && poolDoc.pools) {
      return Object.keys(poolDoc.pools).sort();
    }
    const summary = availablePools.find(p => p.poolId === poolId);
    if (summary && summary.categoryCounts) {
      return Object.keys(summary.categoryCounts).sort();
    }
    return [];
  };

  const getPoolItemsForSource = (source) => {
    const poolDoc = loadedPools[source?.poolId];
    if (!source?.poolId || !poolDoc || poolDoc === 'loading') return [];
    return poolDoc.pools?.[source.category] || [];
  };

  const createPoolVariableFromSource = (source) => {
    if (!source?.poolId || !source?.category) {
      alert('Choose a pool and category before creating the variable.');
      return;
    }

    const variableName = (source.variableName || `${source.category}_items`)
      .trim()
      .replace(/[^A-Za-z0-9_]/g, '_')
      .replace(/^([0-9])/, '_$1');

    const nextVariable = {
      name: variableName || `PoolItems_${(template.variables || []).length + 1}`,
      type: 'pool_selection',
      source: source.id,
      sourceId: source.id,
      poolId: source.poolId,
      category: source.category,
      count: Number(source.count) || 1
    };

    const existingIndex = (template.variables || []).findIndex(variable => variable.name === nextVariable.name);
    if (existingIndex >= 0) {
      const variables = [...template.variables];
      variables[existingIndex] = { ...variables[existingIndex], ...nextVariable };
      updateField('variables', variables);
    } else {
      updateField('variables', [...(template.variables || []), nextVariable]);
    }
  };

  const getVariableLabelToken = (variable) => {
    if (variable?.type === 'pool_selection') return `[${variable.name}[0].label]`;
    return `[${variable?.name || 'Variable'}]`;
  };

  const getVariableAssetToken = (variable, assetKey) => {
    if (variable?.type === 'pool_selection') return `[${variable.name}[0].${assetKey}]`;
    return `[${variable?.name || 'Variable'}]`;
  };

  const appendTextToken = (field, token) => {
    updateField(field, `${template[field] || ''}${template[field] ? ' ' : ''}${token}`);
  };

  const appendExplanationToken = (token) => {
    const current = template.explanation?.sections?.[0]?.content || '';
    updateField('explanation', {
      sections: [{ type: 'text', content: `${current}${current ? ' ' : ''}${token}` }]
    });
  };

  const setVisualImageToken = (token, altToken) => {
    const visuals = [...(template.visuals || [])];
    const imageIndex = visuals.findIndex(visual => visual.component === 'Image');
    if (imageIndex >= 0) {
      visuals[imageIndex] = {
        ...visuals[imageIndex],
        props: {
          ...(visuals[imageIndex].props || {}),
          imageUrl: token,
          alt: altToken
        }
      };
      updateField('visuals', visuals);
      return;
    }

    updateField('visuals', [
      { component: 'Image', props: { imageUrl: token, alt: altToken, width: '220' } },
      ...visuals
    ]);
  };

  const addOptionFromToken = (token, isCorrect) => {
    updateField('options', [
      ...(template.options || []),
      { label: token, isCorrect }
    ]);
  };

  const setValidationToken = (token) => {
    const rules = [...(template.validationRules || [])];
    if (rules.length === 0) {
      rules.push({ type: 'exact_match', target: 'selectedOption', value: token });
    } else {
      rules[0] = { ...rules[0], type: rules[0].type || 'exact_match', target: rules[0].target || 'selectedOption', value: token };
    }
    updateField('validationRules', rules);
  };

  const addValidationRule = () => {
    updateField('validationRules', [
      ...(template.validationRules || []),
      { type: 'exact_match', target: 'answer', value: '' }
    ]);
  };

  const updateValidationRule = (index, key, value) => {
    const rules = [...(template.validationRules || [])];
    rules[index] = { ...rules[index], [key]: value };
    updateField('validationRules', rules);
  };

  const removeValidationRule = (index) => {
    updateField('validationRules', (template.validationRules || []).filter((_, idx) => idx !== index));
  };

  const updateDndPartProp = (propName, propVal) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      newParts[partIdx] = {
        ...newParts[partIdx],
        [propName]: propVal
      };
      // Keep htmlLayout in sync with layoutMode
      if (propName === 'layoutMode') {
        newParts[partIdx].htmlLayout = propVal;
      }
      updateField('parts', newParts);
    }
  };

  const initDndPart = () => {
    updateField('parts', [
      {
        type: 'categorizationv2',
        layoutMode: 'category_sort',
        htmlLayout: 'category_sort',
        cardStyle: 'standard',
        categories: [
          { id: 'cat_1', label: 'Category 1' },
          { id: 'cat_2', label: 'Category 2' }
        ],
        items: [
          { id: 'item_1', content: 'Item 1' },
          { id: 'item_2', content: 'Item 2' }
        ],
        answerKey: {
          'item_1': 'cat_1',
          'item_2': 'cat_2'
        }
      }
    ]);
  };

  const updateDndCategory = (catIdx, field, val) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const categories = [...(part.categories || [])];
      if (categories[catIdx]) {
        categories[catIdx] = {
          ...categories[catIdx],
          [field]: val
        };
        newParts[partIdx] = { ...part, categories };
        updateField('parts', newParts);
      }
    }
  };

  const addDndCategory = () => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const categories = [...(part.categories || [])];
      const newId = `cat_${categories.length + 1}`;
      categories.push({ id: newId, label: `Category ${categories.length + 1}` });
      newParts[partIdx] = { ...part, categories };
      updateField('parts', newParts);
    }
  };

  const removeDndCategory = (catIdx) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const categories = (part.categories || []).filter((_, i) => i !== catIdx);
      newParts[partIdx] = { ...part, categories };
      updateField('parts', newParts);
    }
  };

  const updateDndItem = (itemIdx, field, val) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const items = [...(part.items || [])];
      if (items[itemIdx]) {
        items[itemIdx] = {
          ...items[itemIdx],
          [field]: val
        };
        newParts[partIdx] = { ...part, items };
        updateField('parts', newParts);
      }
    }
  };

  const addDndItem = () => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const items = [...(part.items || [])];
      const newId = `item_${items.length + 1}`;
      items.push({ id: newId, content: `Item ${items.length + 1}` });
      newParts[partIdx] = { ...part, items };
      updateField('parts', newParts);
    }
  };

  const removeDndItem = (itemIdx) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const items = (part.items || []).filter((_, i) => i !== itemIdx);
      newParts[partIdx] = { ...part, items };
      updateField('parts', newParts);
    }
  };

  const updateDndAnswerKey = (itemId, categoryId) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const answerKey = { ...(part.answerKey || {}), [itemId]: categoryId };
      newParts[partIdx] = { ...part, answerKey };
      updateField('parts', newParts);
    }
  };

  // Variable Management
  const addVariable = () => {
    updateField('variables', [
      ...template.variables,
      { name: `Var_${template.variables.length + 1}`, type: 'integer', min: '1', max: '10' }
    ]);
  };

  const updateVariable = (index, key, val) => {
    const vars = [...template.variables];
    vars[index] = { ...vars[index], [key]: val };
    updateField('variables', vars);
  };

  const removeVariable = (index) => {
    const vars = template.variables.filter((_, idx) => idx !== index);
    updateField('variables', vars);
  };

  // Visual component updates
  const handleSelectVisualComponent = (compVal) => {
    const found = VISUAL_COMPONENTS.find(c => c.value === compVal);
    if (!found || !found.value) {
      updateField('visuals', []);
    } else {
      updateField('visuals', [{
        component: found.value,
        props: { ...found.props }
      }]);
    }
  };

  const updateVisualProp = (propName, propVal) => {
    if (template.visuals.length === 0) return;
    const visuals = [...template.visuals];
    visuals[0] = {
      ...visuals[0],
      props: {
        ...visuals[0].props,
        [propName]: propVal
      }
    };
    updateField('visuals', visuals);

    // Auto-set optionsType to fillInTheBlank when clickToFill is checked
    if (propName === 'clickToFill' && propVal === true) {
      updateField('optionsType', 'fillInTheBlank');
    }
  };

  // Options updates
  const updateOption = (index, field, val) => {
    const opts = [...template.options];
    opts[index] = { ...opts[index], [field]: val };
    
    // If setting to true, toggle others off
    if (field === 'isCorrect' && val === true) {
      opts.forEach((o, i) => {
        if (i !== index) o.isCorrect = false;
      });
    }
    
    updateField('options', opts);
  };

  // Save template to DB
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // Convert variables array back to object if parameterized
      const copy = JSON.parse(JSON.stringify(template));
      if (copy.examId === 'jnvst' || copy.exam === 'jnvst' || copy.type === 'parameterized') {
        if (Array.isArray(copy.variables)) {
          const varObj = {};
          copy.variables.forEach(v => {
            if (v && v.name) {
              const { name, ...rest } = v;
              if (v.type === 'list' && Array.isArray(v.items)) {
                varObj[name] = v.items;
              } else {
                varObj[name] = rest;
              }
            }
          });
          copy.variables = varObj;
        }
      }

      // 1. Save Template
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: copy })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server returned failure saving template');
      }

      // If the DB returned a MongoDB ObjectId (e.g. new JNVST template insert),
      // store it as _id only for future update detection.
      // NEVER overwrite template.id (the human-readable slug).
      const savedId = template.id || template.title || data.id;
      if (data.id && data.id !== template.id) {
        setTemplate(prev => ({
          ...prev,
          _id: data.id   // only update _id, leave id (slug) intact
        }));
      }

      // 2. Link to Curriculum Skill if checked
      if (linkToSkill) {
        // Resolve subjectId, topicId, chapterId, checking if custom is chosen
        let finalSubjectId = skillSubject;
        let finalTopicId = skillTopic;
        let finalChapterId = skillChapter;

        const slugify = (val) => {
          return String(val || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };

        // Save custom subject if needed
        if (skillSubject === '_custom_') {
          if (!skillSubjectCustomId.trim()) {
            throw new Error('Custom Subject ID is required');
          }
          finalSubjectId = slugify(skillSubjectCustomId);
          const subjectPayload = {
            type: 'subject',
            id: finalSubjectId,
            title: skillSubjectCustomTitle.trim() || skillSubjectCustomId,
          };
          const subjectRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subjectPayload)
          });
          const subjectData = await subjectRes.json();
          if (!subjectData.success) {
            throw new Error(subjectData.error || `Failed to create custom subject: ${finalSubjectId}`);
          }
        }

        // Save custom topic if needed
        if (skillTopic === '_custom_') {
          if (!skillTopicCustomId.trim()) {
            throw new Error('Custom Topic ID is required');
          }
          finalTopicId = slugify(skillTopicCustomId);
          const topicPayload = {
            type: 'topic',
            id: finalTopicId,
            title: skillTopicCustomTitle.trim() || skillTopicCustomId,
            parentId: finalSubjectId
          };
          const topicRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(topicPayload)
          });
          const topicData = await topicRes.json();
          if (!topicData.success) {
            throw new Error(topicData.error || `Failed to create custom topic: ${finalTopicId}`);
          }
        }

        // Save custom chapter if needed
        if (skillChapter === '_custom_') {
          if (!skillChapterCustomId.trim()) {
            throw new Error('Custom Chapter ID is required');
          }
          finalChapterId = slugify(skillChapterCustomId);
          const chapterPayload = {
            type: 'chapter',
            id: finalChapterId,
            title: skillChapterCustomTitle.trim() || skillChapterCustomId,
            parentId: finalTopicId
          };
          const chapterRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chapterPayload)
          });
          const chapterData = await chapterRes.json();
          if (!chapterData.success) {
            throw new Error(chapterData.error || `Failed to create custom chapter: ${finalChapterId}`);
          }
        }

        const skillPayload = {
          type: 'skill',
          id: skillIdInput,
          subjectId: finalSubjectId,
          topicId: finalTopicId,
          chapterId: finalChapterId,
          title: skillTitle,
          code: skillCode,
          grade: skillGrade,
          order: Number(skillOrder) || 0,
          templateId: template.id,
          engine: 'universal-template',
          questionType: template.optionsType || 'mcq',
          metadata: skillDifficultyScaling ? {
            difficultyScaling: true,
            templateLevels: skillTemplateLevels.map(l => ({
              level: l.level,
              templateIds: l.templateIds.filter(Boolean)
            })).filter(l => l.templateIds.length > 0)
          } : {}
        };

        const curriculumRes = await fetch('/api/admin/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skillPayload)
        });
        const curriculumData = await curriculumRes.json();
        if (!curriculumData.success) {
          throw new Error(curriculumData.error || 'Failed to link curriculum skill');
        }

        await fetchCurriculumNodes();
      }

      setSaveStatus({
        type: 'success',
        text: linkToSkill
          ? `"${template.title || template.name || savedId}" saved and linked to curriculum skill successfully!`
          : `"${template.title || template.name || savedId}" saved successfully!`
      });
      setSelectedId(savedId);
      await fetchTemplates();
    } catch (err) {
      setSaveStatus({ type: 'error', text: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Fetch required vocabulary pools for template variables or dataSources
  useEffect(() => {
    const poolsToFetch = new Set();

    // Scan root poolId
    if (template.type === 'dynamic_pool' && template.poolId) {
      poolsToFetch.add(template.poolId);
    }
    
    // Scan variables
    if (Array.isArray(template.variables)) {
      template.variables.forEach(v => {
        if (v.type === 'pool_selection' && v.poolId) {
          poolsToFetch.add(v.poolId);
        }
      });
    }
    
    // Scan dataSources
    if (Array.isArray(template.dataSources)) {
      template.dataSources.forEach(ds => {
        if (ds.type === 'pool_selection' && ds.poolId) {
          poolsToFetch.add(ds.poolId);
        }
      });
    }
    
    // Fetch each pool that isn't already loaded
    poolsToFetch.forEach(async (poolId) => {
      if (loadedPools[poolId] || poolId === 'loading') return;
      
      // Temporarily mark as loading
      setLoadedPools(prev => ({ ...prev, [poolId]: 'loading' }));
      
      try {
        const res = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId)}`);
        const data = await res.json();
        if (data.success && data.pool) {
          setLoadedPools(prev => ({ ...prev, [poolId]: data.pool }));
        } else {
          setLoadedPools(prev => ({ ...prev, [poolId]: { error: true } }));
        }
      } catch (err) {
        console.error('Failed to fetch pool:', poolId, err);
        setLoadedPools(prev => ({ ...prev, [poolId]: { error: true } }));
      }
    });
  }, [template.variables, template.dataSources, template.poolId, template.type, loadedPools]);

  // Inject variable/dataSource lists from loadedPools into template before evaluation
  const resolvedTemplate = useMemo(() => {
    const copy = JSON.parse(JSON.stringify(template));
    
    // Inject pools and voice if it is a dynamic_pool template
    if (copy.type === 'dynamic_pool' && copy.poolId) {
      const poolDoc = loadedPools[copy.poolId];
      if (poolDoc && poolDoc !== 'loading' && !poolDoc.error) {
        copy.pools = poolDoc.pools;
        copy.voice = poolDoc.voice;
      }
    }

    // Inject variables
    if (Array.isArray(copy.variables)) {
      copy.variables = copy.variables.map(v => {
        if (v.type === 'pool_selection' && v.poolId) {
          const poolDoc = loadedPools[v.poolId];
          if (poolDoc && poolDoc !== 'loading' && !poolDoc.error) {
            const targetCats = v.targetCategories?.length > 0 ? v.targetCategories 
                              : v.category ? [v.category] 
                              : ['targets'];
            let words = targetCats.flatMap(cat => poolDoc.pools?.[cat] || []);
            if (v.targetProperty && v.targetValue) {
              words = words.filter(item => matchesPropertyFilter(item, v.targetProperty, v.targetValue));
            }
            return {
              ...v,
              items: words
            };
          }
        }
        return v;
      });
    }
    
    // Inject dataSources
    if (Array.isArray(copy.dataSources)) {
      copy.dataSources = copy.dataSources.map(ds => {
        if (ds.type === 'pool_selection' && ds.poolId) {
          const poolDoc = loadedPools[ds.poolId];
          if (poolDoc && poolDoc !== 'loading' && !poolDoc.error) {
            const targetCats = ds.targetCategories?.length > 0 ? ds.targetCategories 
                              : ds.category ? [ds.category] 
                              : ['targets'];
            let correctItems = targetCats.flatMap(cat => poolDoc.pools?.[cat] || []);
            const targetSet = new Set(targetCats);
            let distractorItems = Object.entries(poolDoc.pools || {})
              .filter(([cat]) => !targetSet.has(cat) && cat !== 'correctPool' && cat !== 'distractorPool')
              .flatMap(([, items]) => items);
            const categoryLabel = poolDoc.categoryLabels?.[targetCats[0]] || targetCats[0] || '';
            
            // Apply property filters
            if (ds.targetProperty && ds.targetValue) {
              correctItems = correctItems.filter(item => matchesPropertyFilter(item, ds.targetProperty, ds.targetValue));
            }
            if (ds.distractorProperty && ds.distractorValue) {
              distractorItems = distractorItems.filter(item => matchesPropertyFilter(item, ds.distractorProperty, ds.distractorValue));
            }

            return {
              ...ds,
              items: correctItems,
              _distractorItems: distractorItems,
              _categoryLabel: categoryLabel
            };
          }
        }
        return ds;
      });
    }
    
    // Convert variables array back to object if parameterized
    if (copy.examId === 'jnvst' || copy.exam === 'jnvst' || copy.type === 'parameterized') {
      if (Array.isArray(copy.variables)) {
        const varObj = {};
        copy.variables.forEach(v => {
          if (v && v.name) {
            const { name, ...rest } = v;
            if (v.type === 'list' && Array.isArray(v.items)) {
              varObj[name] = v.items;
            } else {
              varObj[name] = rest;
            }
          }
        });
        copy.variables = varObj;
      }
    }
    
    return copy;
  }, [template, loadedPools]);

  // Live simulation evaluation
  const evaluatedQuestion = useMemo(() => {
    try {
      if (resolvedTemplate.type === 'dynamic_pool') {
        if (!resolvedTemplate.pools) {
          return { ok: false, error: 'Loading vocabulary pool...' };
        }
        const q = generateFromDynamicPool(
          resolvedTemplate,
          seed,
          resolvedTemplate.difficultyLevel || 'easy',
          {},
          resolvedTemplate.grade || 'lkg'
        );
        return { ok: true, question: q };
      }
      const q = evaluateTemplate(resolvedTemplate, seed);
      return { ok: true, question: q };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [resolvedTemplate, seed]);

  const universalPreviewPayload = useMemo(() => {
    const question = evaluatedQuestion.ok ? evaluatedQuestion.question : null;
    const correctOption = question?.options?.[question?.correctAnswerIndex];

    return {
      jsonSchema: {
        templateId: template.id,
        title: template.title,
        description: template.description || '',
        subject: template.subject,
        topic: template.topic,
        grade: template.grade,
        skillId: template.skillId,
        competencyId: template.competencyId,
        difficultyLevel: template.difficultyLevel,
        tags: template.tags || [],
        dataSources: template.dataSources || [],
        variables: template.variables || [],
        constraints: template.constraints || {},
        layout: template.layoutConfig || {},
        visualComponents: template.visuals || [],
        interaction: template.interaction || {},
        validationRules: template.validationRules || [],
        feedbackRules: template.feedbackRules || {},
        difficultyRules: template.difficultyRules || {},
        analyticsConfig: template.analyticsConfig || {},
        adaptiveRules: template.adaptiveRules || {},
      },
      reactConfiguration: {
        layoutMode: template.layoutConfig?.mode || 'prompt_top',
        visualComponents: template.visuals || [],
        interactionEngine: template.interaction?.engine || template.optionsType || 'mcq',
        responsiveTarget: template.layoutConfig?.responsiveTarget || 'mobile_first',
      },
      validationRules: template.validationRules || [],
      previewPayload: {
        sampleQuestion: question?.questionText || '',
        renderedLayout: template.layoutConfig?.mode || 'prompt_top',
        generatedVariables: (template.variables || []).map(variable => ({
          name: variable.name,
          type: variable.type,
          source: variable.source || variable.formula || variable.template || variable.items || `${variable.min || ''}-${variable.max || ''}`,
        })),
        correctAnswer: question?.correctAnswerText || question?.answer || correctOption?.label || '',
        explanation: question?.explanation?.sections?.[0]?.content || template.feedbackRules?.step_by_step_explanation || '',
        difficultyVariations: template.difficultyRules || {},
      },
    };
  }, [template, evaluatedQuestion]);

  useEffect(() => {
    setVariantQaReport(null);
  }, [resolvedTemplate]);

  // Dynamic lists from static config
  const staticList = useMemo(() => {
    const list = [...REFERENCE_EXAMPLES];
    Object.entries(staticTemplates).forEach(([subj, topics]) => {
      Object.entries(topics).forEach(([topicName, templatesArr]) => {
        templatesArr.forEach(t => {
          list.push({ ...t, subject: subj, topic: topicName, isStatic: true });
        });
      });
    });
    return list;
  }, [staticTemplates]);

  const groupedStaticTemplates = useMemo(() => {
    const groups = {};
    const filtered = staticList.filter(tpl => !REFERENCE_EXAMPLES.some(r => r.id === tpl.id)).filter(matchesSearch);
    filtered.forEach(tpl => {
      let subject = tpl.subject || tpl.templateInfo?.subject || 'other';
      subject = subject.toLowerCase().trim();
      const subjectKey = (subject === 'math' || subject === 'english' || subject === 'gk' || subject === 'social_studies') ? subject : 'other';
      if (!groups[subjectKey]) {
        groups[subjectKey] = [];
      }
      groups[subjectKey].push(tpl);
    });
    return groups;
  }, [staticList, sidebarSearch]);

  const renderCurriculumLinkerCard = () => {
    const subjects = curriculumNodes.filter(n => n.type === 'subject');
    const topics = curriculumNodes.filter(n => n.type === 'topic' && n.parentId === skillSubject);
    const chapters = curriculumNodes.filter(n => n.type === 'chapter' && n.parentId === skillTopic);

    return (
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <label className={styles.checkboxLabel} style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={linkToSkill}
            onChange={(e) => setLinkToSkill(e.target.checked)}
          />
          Create & Save Curriculum Skill Node
        </label>

        {linkToSkill && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            
            {/* Subject Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-subj">Subject</label>
              <select
                id="skill-subj"
                className={styles.select}
                value={skillSubject}
                onChange={(e) => {
                  setSkillSubject(e.target.value);
                  setSkillTopic('');
                  setSkillChapter('');
                }}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Subject...</option>
              </select>
            </div>

            {skillSubject === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-subj-custom-id">Custom Subject ID (slug)</label>
                  <input
                    id="skill-subj-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. math"
                    value={skillSubjectCustomId}
                    onChange={(e) => setSkillSubjectCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-subj-custom-title">Custom Subject Title</label>
                  <input
                    id="skill-subj-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Mathematics"
                    value={skillSubjectCustomTitle}
                    onChange={(e) => setSkillSubjectCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Topic Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-topic">Topic</label>
              <select
                id="skill-topic"
                className={styles.select}
                value={skillTopic}
                onChange={(e) => {
                  setSkillTopic(e.target.value);
                  setSkillChapter('');
                }}
                disabled={!skillSubject}
              >
                <option value="">-- Select Topic --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Topic...</option>
              </select>
            </div>

            {skillTopic === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-topic-custom-id">Custom Topic ID (slug)</label>
                  <input
                    id="skill-topic-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. addition-basics"
                    value={skillTopicCustomId}
                    onChange={(e) => setSkillTopicCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-topic-custom-title">Custom Topic Title</label>
                  <input
                    id="skill-topic-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Addition Basics"
                    value={skillTopicCustomTitle}
                    onChange={(e) => setSkillTopicCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Chapter Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-chap">Chapter</label>
              <select
                id="skill-chap"
                className={styles.select}
                value={skillChapter}
                onChange={(e) => setSkillChapter(e.target.value)}
                disabled={!skillTopic}
              >
                <option value="">-- Select Chapter --</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Chapter...</option>
              </select>
            </div>

            {skillChapter === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-chap-custom-id">Custom Chapter ID (slug)</label>
                  <input
                    id="skill-chap-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. chapter-1"
                    value={skillChapterCustomId}
                    onChange={(e) => setSkillChapterCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-chap-custom-title">Custom Chapter Title</label>
                  <input
                    id="skill-chap-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Chapter 1: Addition under 10"
                    value={skillChapterCustomTitle}
                    onChange={(e) => setSkillChapterCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-id-input">Skill Node ID (slug)</label>
                  <input
                    id="skill-id-input"
                    type="text"
                    className={styles.input}
                    value={skillIdInput}
                    onChange={(e) => setSkillIdInput(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-title-input">Skill Title</label>
                  <input
                    id="skill-title-input"
                    type="text"
                    className={styles.input}
                    value={skillTitle}
                    onChange={(e) => setSkillTitle(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-grade">Grade</label>
                  <input
                    id="skill-grade"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 1"
                    value={skillGrade}
                    onChange={(e) => setSkillGrade(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-code">Skill Code</label>
                  <input
                    id="skill-code"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. MATH.1.A"
                    value={skillCode}
                    onChange={(e) => setSkillCode(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-order">Order</label>
                  <input
                    id="skill-order"
                    type="number"
                    className={styles.input}
                    value={skillOrder}
                    onChange={(e) => setSkillOrder(e.target.value)}
                  />
                </div>
              </div>

              {/* ─── Difficulty Scaling ─── */}
              <div style={{ marginTop: '4px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={skillDifficultyScaling}
                    onChange={e => {
                      setSkillDifficultyScaling(e.target.checked);
                      if (e.target.checked) {
                        // Auto-seed Level 1 with the current template
                        setSkillTemplateLevels(prev => prev.map(l =>
                          l.level === 1 && !l.templateIds.includes(template.id)
                            ? { ...l, templateIds: [template.id, ...l.templateIds] }
                            : l
                        ));
                      }
                    }}
                  />
                  ⚡ Enable Difficulty Scaling (multiple templates per level)
                </label>

                {skillDifficultyScaling && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { level: 1, label: 'Level 1 — Easy', color: '#dcfce7', border: '#86efac', badge: '#16a34a' },
                      { level: 2, label: 'Level 2 — Medium', color: '#fef9c3', border: '#fde047', badge: '#ca8a04' },
                      { level: 3, label: 'Level 3 — Hard', color: '#fee2e2', border: '#fca5a5', badge: '#dc2626' },
                    ].map(({ level, label, color, border, badge }) => {
                      const levelData = skillTemplateLevels.find(l => l.level === level) || { level, templateIds: [] };
                      const isOpen = expandedLevel === level;
                      return (
                        <div key={level} style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Accordion header */}
                          <button
                            type="button"
                            onClick={() => setExpandedLevel(isOpen ? 0 : level)}
                            style={{
                              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 12px', background: color, border: 'none', cursor: 'pointer',
                              fontWeight: 700, fontSize: '12px', color: '#1e293b'
                            }}
                          >
                            <span>{label}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: badge, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '11px' }}>
                                {levelData.templateIds.length} template{levelData.templateIds.length !== 1 ? 's' : ''}
                              </span>
                              <span>{isOpen ? '▲' : '▼'}</span>
                            </span>
                          </button>

                          {/* Accordion body */}
                          {isOpen && (
                            <div style={{ padding: '10px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Hint */}
                              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                {level === 1 ? 'Triggered when correctStreak < 3 or difficulty=easy'
                                  : level === 2 ? 'Triggered when correctStreak 3–5 or difficulty=medium'
                                  : 'Triggered when correctStreak ≥ 6 or difficulty=hard'}
                                . Templates are picked randomly by seed.
                              </p>

                              {/* Chips */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px' }}>
                                {levelData.templateIds.length === 0 && (
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No templates — add below</span>
                                )}
                                {levelData.templateIds.map((tid, ti) => (
                                  <span key={ti} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: color, border: `1px solid ${border}`, borderRadius: '6px',
                                    padding: '2px 8px', fontSize: '11px', fontWeight: 600
                                  }}>
                                    {tid === template.id ? `★ ${tid}` : tid}
                                    <button
                                      type="button"
                                      onClick={() => setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level
                                          ? { ...l, templateIds: l.templateIds.filter((_, i) => i !== ti) }
                                          : l
                                      ))}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900, padding: '0 2px', fontSize: '13px', lineHeight: 1 }}
                                    >×</button>
                                  </span>
                                ))}
                              </div>

                              {/* Add row */}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  type="text"
                                  className={styles.input}
                                  style={{ flex: 1, fontSize: '12px', padding: '5px 8px' }}
                                  placeholder="Template ID (e.g. addition-mcq-tenframe)"
                                  value={levelAddInputs[level] || ''}
                                  onChange={e => setLevelAddInputs(prev => ({ ...prev, [level]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (levelAddInputs[level] || '').trim();
                                      if (val && !levelData.templateIds.includes(val)) {
                                        setSkillTemplateLevels(prev => prev.map(l =>
                                          l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                        ));
                                        setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className={styles.btn}
                                  style={{ fontSize: '11px', padding: '4px 10px', background: badge, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    const val = (levelAddInputs[level] || '').trim();
                                    if (val && !levelData.templateIds.includes(val)) {
                                      setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                      ));
                                      setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                    }
                                  }}
                                >+ Add</button>
                                <button
                                  type="button"
                                  className={styles.btn}
                                  style={{ fontSize: '11px', padding: '4px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    if (!levelData.templateIds.includes(template.id)) {
                                      setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level ? { ...l, templateIds: [...l.templateIds, template.id] } : l
                                      ));
                                    }
                                  }}
                                >★ Add current</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* ─── End Difficulty Scaling ─── */}

            </div>

          </div>
        )}
      </div>
    );
  };

  const renderSectionHeader = (title, count, sectionKey, icon = '') => {
    const expanded = isSectionExpanded(sectionKey);
    return (
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 4px',
          cursor: 'pointer',
          borderBottom: '1px solid #f1f5f9',
          marginTop: '12px',
          userSelect: 'none'
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{expanded ? '▼' : '▶'}</span>
          <span>{icon} {title}</span>
        </span>
        <span style={{
          fontSize: '10px',
          background: '#f1f5f9',
          color: '#64748b',
          padding: '2px 6px',
          borderRadius: '99px',
          fontWeight: '700'
        }}>
          {count}
        </span>
      </div>
    );
  };

  const renderSubjectHeader = (title, count, subjectKey) => {
    const expanded = isSectionExpanded(subjectKey);
    return (
      <div
        onClick={() => toggleSection(subjectKey)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          cursor: 'pointer',
          marginTop: '6px',
          userSelect: 'none',
          background: '#f8fafc',
          borderRadius: '4px'
        }}
      >
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderLeft: '2px solid #e2e8f0',
          paddingLeft: '6px'
        }}>
          <span>{expanded ? '▼' : '▶'}</span>
          <span>{title}</span>
        </span>
        <span style={{
          fontSize: '9px',
          color: '#94a3b8',
          fontWeight: '600'
        }}>
          ({count})
        </span>
      </div>
    );
  };

  return (
    <main className={styles.container}>
      <style dangerouslySetInnerHTML={{ __html: `
        .svg-preview-container svg {
          width: 100% !important;
          height: 100% !important;
          max-width: 18px !important;
          max-height: 18px !important;
          display: block !important;
        }
      ` }} />
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Visual Template Builder</h1>
          <p className={styles.subtitle}>Create and design dynamic mathematics questions visually</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btn + ' ' + styles.btnSecondary}
            onClick={() => setIsSidebarVisible(prev => !prev)}
          >
            {isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          <button
            type="button"
            className={styles.btn + ' ' + styles.btnSecondary}
            style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#c084fc' }}
            onClick={() => setShowGuide(true)}
          >
            📚 Question Types Guide
          </button>
          <a className={styles.btn + ' ' + styles.btnSecondary} href="/admin">
            ← Back to Admin Console
          </a>
          <button type="button" className={styles.btn + ' ' + styles.btnSecondary} onClick={handleNewTemplate}>
            + Create New Template
          </button>
        </div>
      </header>

      <div className={`${styles.workspace} ${!isSidebarVisible ? styles.workspaceSidebarHidden : ''}`}>
        {/* Left column: Sidebar list of existing templates */}
        {isSidebarVisible && (
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>
            <span>Templates Repository</span>
            <button
              type="button"
              className={styles.sidebarMiniButton}
              onClick={() => setIsSidebarVisible(false)}
            >
              Hide
            </button>
          </h3>
          
          {/* Search Box */}
          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search templates..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {loading ? (
            <p className={styles.emptyStateText}>Loading...</p>
          ) : (
            <div className={styles.templateList}>
              
              {/* 1. Custom MongoDB Section */}
              {(() => {
                const totalCount = dynamicTemplates.filter(matchesSearch).length;
                if (totalCount === 0 && sidebarSearch) return null;
                
                return (
                  <>
                    {renderSectionHeader("Custom MongoDB", totalCount, "customDb", "📁")}
                    
                    {isSectionExpanded("customDb") && (
                      <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Object.keys(groupedDynamicTemplates).sort().map(gradeKey => {
                          const subjectsObj = groupedDynamicTemplates[gradeKey];
                          const gradeTemplatesCount = Object.values(subjectsObj).reduce((acc, list) => acc + list.length, 0);
                          if (gradeTemplatesCount === 0) return null;

                          const gradeSectionKey = `custom-grade-${gradeKey}`;
                          const isGradeExpanded = isSectionExpanded(gradeSectionKey);

                          return (
                            <div key={gradeKey} style={{ marginBottom: '8px' }}>
                              {renderSubjectHeader(gradeKey, gradeTemplatesCount, gradeSectionKey)}

                              {isGradeExpanded && (
                                <div style={{ paddingLeft: '12px', borderLeft: '1px solid #e2e8f0', marginLeft: '6px', marginTop: '4px' }}>
                                  {Object.keys(subjectsObj).sort().map(subjKey => {
                                    const list = subjectsObj[subjKey];
                                    if (list.length === 0) return null;

                                    const subjectTitle = subjKey === 'gk' ? 'General Knowledge'
                                      : subjKey === 'social_studies' ? 'Social Studies'
                                      : subjKey === 'mat' ? 'Mental Ability (MAT)'
                                      : subjKey === 'arithmetic' ? 'Arithmetic'
                                      : subjKey === 'language' ? 'Language'
                                      : subjKey.charAt(0).toUpperCase() + subjKey.slice(1);

                                    const subjSectionKey = `custom-grade-${gradeKey}-subj-${subjKey}`;
                                    const isSubjExpanded = isSectionExpanded(subjSectionKey);

                                    return (
                                      <div key={subjKey} style={{ marginTop: '4px' }}>
                                        <div
                                          onClick={() => toggleSection(subjSectionKey)}
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '4px 6px',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            background: '#f1f5f9',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#475569'
                                          }}
                                        >
                                          <span>📁 {subjectTitle} ({list.length})</span>
                                          <span style={{ fontSize: '9px' }}>{isSubjExpanded ? '▼' : '▶'}</span>
                                        </div>

                                        {isSubjExpanded && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingLeft: '6px' }}>
                                            {list.map(tpl => (
                                              <div key={`dynamic-${tpl.id}`} style={{ position: 'relative' }}>
                                                <button
                                                  className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                                                  onClick={() => handleSelectTemplate(tpl)}
                                                  style={{ width: '100%', paddingRight: '45px', textAlign: 'left' }}
                                                >
                                                  <div className={styles.templateItemTitle}>{tpl.title || tpl.id}</div>
                                                  <div className={styles.templateItemMeta}>{tpl.topic} • {tpl.id}</div>
                                                </button>
                                                <a
                                                  href={`/practice?skill=${tpl.id}&subject=${tpl.subject || subjKey || 'math'}&topic=${tpl.topic || 'addition'}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title="Test template in practice page"
                                                  style={{
                                                    position: 'absolute',
                                                    right: '8px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: '#f1f5f9',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    textDecoration: 'none',
                                                    color: '#475569',
                                                    zIndex: 5
                                                  }}
                                                >
                                                  Test
                                                </a>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* 2. Reference Examples Section */}
              {(() => {
                const list = REFERENCE_EXAMPLES.filter(matchesSearch);
                if (list.length === 0) return null;
                
                return (
                  <>
                    {renderSectionHeader("Reference Examples", list.length, "referenceExamples", "💡")}
                    
                    {isSectionExpanded("referenceExamples") && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingLeft: '8px' }}>
                                    {list.map(tpl => (
                                      <div key={`ref-${tpl.id}`} style={{ position: 'relative' }}>
                                        <button
                                          className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                                          onClick={() => handleSelectTemplate(tpl)}
                                          style={{ width: '100%', paddingRight: '45px', textAlign: 'left' }}
                                        >
                                          <div className={styles.templateItemTitle}>{tpl.title}</div>
                                          <div className={styles.templateItemMeta}>{tpl.topic} • Example</div>
                                        </button>
                                        <a
                                          href={`/practice?skill=${tpl.id}&subject=${tpl.subject || 'math'}&topic=${tpl.topic || 'addition'}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Test template in practice page"
                                          style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: '#f1f5f9',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            color: '#475569',
                                            zIndex: 5
                                          }}
                                        >
                                          Test
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                    )}
                  </>
                );
              })()}

              {/* 3. Math Starters Section */}
              {(() => {
                const list = MATH_STARTERS.filter(matchesSearch);
                if (list.length === 0) return null;
                
                return (
                  <>
                    {renderSectionHeader("Math Starters", list.length, "mathStarters", "⚡")}
                    
                    {isSectionExpanded("mathStarters") && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingLeft: '8px' }}>
                                    {list.map(tpl => (
                                      <div key={`starter-${tpl.id}`} style={{ position: 'relative' }}>
                                        <button
                                          className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                                          onClick={() => handleSelectTemplate(tpl)}
                                          style={{ width: '100%', paddingRight: '45px', textAlign: 'left', borderLeft: '3px solid #f59e0b' }}
                                        >
                                          <div className={styles.templateItemTitle}>{tpl.emoji} {tpl.title}</div>
                                          <div className={styles.templateItemMeta}>{tpl.topic} • Starter</div>
                                        </button>
                                        <a
                                          href={`/practice?skill=${tpl.id}&subject=${tpl.subject || 'math'}&topic=${tpl.topic || 'addition'}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Test template in practice page"
                                          style={{
                                            position: 'absolute',
                                            right: '8px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: '#f1f5f9',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            color: '#475569',
                                            zIndex: 5
                                          }}
                                        >
                                          Test
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                    )}
                  </>
                );
              })()}

              {/* 4. Static Catalog Section */}
              {(() => {
                const totalCount = staticList.filter(tpl => !REFERENCE_EXAMPLES.some(r => r.id === tpl.id)).filter(matchesSearch).length;
                if (totalCount === 0 && sidebarSearch) return null;
                
                return (
                  <>
                    {renderSectionHeader("Static Catalog", totalCount, "staticCatalog", "📚")}
                    
                    {isSectionExpanded("staticCatalog") && (
                      <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {Object.keys(groupedStaticTemplates).sort().map(subjKey => {
                          const list = groupedStaticTemplates[subjKey];
                          if (list.length === 0) return null;
                          
                          const subjectTitle = subjKey === 'gk' ? 'General Knowledge'
                            : subjKey === 'social_studies' ? 'Social Studies'
                            : subjKey.charAt(0).toUpperCase() + subjKey.slice(1);
                            
                          const subSectionKey = `static-${subjKey}`;
                          const isExpanded = isSectionExpanded(subSectionKey);
                          
                          return (
                            <div key={subjKey}>
                              {renderSubjectHeader(subjectTitle, list.length, subSectionKey)}
                              
                              {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', paddingLeft: '8px' }}>
                                  {list.map(tpl => (
                                    <div key={`static-${tpl.subject}-${tpl.topic}-${tpl.id}`} style={{ position: 'relative' }}>
                                      <button
                                        className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                                        onClick={() => handleSelectTemplate(tpl)}
                                        style={{ width: '100%', paddingRight: '45px', textAlign: 'left' }}
                                      >
                                        <div className={styles.templateItemTitle}>{tpl.title || tpl.id}</div>
                                        <div className={styles.templateItemMeta}>{tpl.topic} • Static</div>
                                      </button>
                                      <a
                                        href={`/practice?skill=${tpl.id}&subject=${tpl.subject || subjKey || 'math'}&topic=${tpl.topic || 'addition'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Test template in practice page"
                                        style={{
                                          position: 'absolute',
                                          right: '8px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          background: '#f1f5f9',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          padding: '2px 6px',
                                          fontSize: '10px',
                                          fontWeight: 'bold',
                                          textDecoration: 'none',
                                          color: '#475569',
                                          zIndex: 5
                                        }}
                                      >
                                        Test
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Empty Search Result State */}
              {sidebarSearch &&
                dynamicTemplates.filter(matchesSearch).length === 0 &&
                REFERENCE_EXAMPLES.filter(matchesSearch).length === 0 &&
                MATH_STARTERS.filter(matchesSearch).length === 0 &&
                staticList.filter(tpl => !REFERENCE_EXAMPLES.some(r => r.id === tpl.id)).filter(matchesSearch).length === 0 && (
                  <p className={styles.emptyStateText}>No templates match "{sidebarSearch}"</p>
              )}

            </div>
          )}
        </aside>
        )}

        {/* Right columns: Editor Form & Live Simulator */}
        <div className={styles.builderAreaFull}>
          {/* Top Navigation Tabs */}
          <div className={styles.stepTabsContainer}>
            {[
              { id: 1 },
              { id: 2 },
              { id: 3 },
              { id: 4 },
              { id: 5 },
              { id: 6 }
            ].map(step => (
              <div 
                key={step.id}
                className={`${styles.stepTab} ${currentStep === step.id ? styles.stepTabActive : ''} ${currentStep > step.id ? styles.stepTabCompleted : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className={styles.stepNumber}>{currentStep > step.id ? '✓' : step.id}</div>
                <span>{getStepLabel(step.id, template)}</span>
              </div>
            ))}
          </div>

          <div className={styles.builderEditorGrid}>
            <div className={styles.builderEditorColumn}>
          {/* Builder Editor Card */}
          <section className={styles.panel} style={{ display: 'block' }}>
            <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>Template Editor</h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedId ? `Editing: ${selectedId}` : 'New Unsaved Template'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: editorMode === 'form' ? '#ffffff' : 'transparent',
                    color: editorMode === 'form' ? '#0f172a' : '#64748b',
                    boxShadow: editorMode === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditorMode('form')}
                >
                  📝 Form Builder
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: editorMode === 'json' ? '#ffffff' : 'transparent',
                    color: editorMode === 'json' ? '#0f172a' : '#64748b',
                    boxShadow: editorMode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditorMode('json')}
                >
                  💻 JSON Recipe
                </button>
              </div>
            </div>

            <div className={styles.panelBody}>
              {/* ✨ AI Template Assistant Card */}
              <div className={`${styles.aiAssistantCard} ${!aiAssistantExpanded ? styles.aiAssistantCompact : ''}`}>
                <button
                  type="button"
                  className={styles.aiAssistantHeader}
                  onClick={() => setAiAssistantExpanded(prev => !prev)}
                >
                  <span className={styles.aiTitle}>✨ AI Template Builder Assistant</span>
                  <span className={styles.aiHeaderMeta}>{aiAssistantExpanded ? 'Collapse' : 'Open assistant'}</span>
                </button>
                {aiAssistantExpanded && (
                  <>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>
                      Describe the question template you want to generate. Gemini will write the logic, variables, option choices, and visuals, then load it into both the Form and JSON editors.
                    </p>
                    <div className={styles.aiPromptArea}>
                      <textarea
                        className={styles.aiPromptTextarea}
                        placeholder="Describe your question, e.g. 'A math subtraction ten frame question where A is between 5 and 10, B is between 1 and A-1, and B counters are crossed out. Give 4 multiple choice options with the correct result.'"
                        value={aiTemplatePrompt}
                        onChange={(e) => setAiTemplatePrompt(e.target.value)}
                        disabled={aiTemplateGenerating}
                      />
                      <button
                        type="button"
                        className={styles.aiBtnGenerate}
                        onClick={handleAiTemplateGenerate}
                        disabled={aiTemplateGenerating || !aiTemplatePrompt.trim()}
                      >
                        {aiTemplateGenerating ? (
                          <>
                            <div className={styles.loadingSpinner} style={{ borderTopColor: '#ffffff' }} />
                            <span style={{ fontSize: '10px' }}>Generating...</span>
                          </>
                        ) : (
                          <>
                            <span>🪄 Build</span>
                            <span style={{ fontSize: '10px' }}>Template</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
                {aiTemplateSuccessMsg && (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                    {aiTemplateSuccessMsg}
                  </div>
                )}
              </div>

              {editorMode === 'json' ? (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                  <div className={styles.formGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <label htmlFor="json-editor" style={{ margin: 0, fontWeight: 700 }}>JSON Recipe Code Editor</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className={styles.btn + ' ' + styles.btnSecondary}
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={handleCopyJson}
                        >
                          📋 Copy JSON
                        </button>
                        <button
                          type="button"
                          className={styles.btn + ' ' + styles.btnSecondary}
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onClick={handlePasteJson}
                        >
                          📥 Paste JSON
                        </button>
                        <button
                          type="button"
                          className={styles.btn + ' ' + styles.btnPrimary}
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: '#4f46e5', color: '#ffffff', cursor: 'pointer' }}
                          onClick={handleParseToFormAndReview}
                        >
                          ⚡ Parse to Form & Review
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="json-editor"
                      className={styles.textarea}
                      style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        padding: '12px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        border: jsonError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        minHeight: '420px',
                        resize: 'vertical'
                      }}
                      value={jsonText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setJsonText(val);
                        try {
                          const parsed = JSON.parse(val);
                          if (parsed && typeof parsed === 'object') {
                            setTemplate(normalizeTemplateForBuilder(parsed));
                            setJsonError(null);
                          } else {
                            setJsonError('Must be a JSON object');
                          }
                        } catch (err) {
                          setJsonError(err.message);
                        }
                      }}
                    />
                    {jsonError && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ JSON Syntax Error: {jsonError}
                      </div>
                    )}
                  </div>
                  
                  {renderCurriculumLinkerCard()}

                  {/* Save Button for JSON mode */}
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={styles.btn + ' ' + styles.btnPrimary}
                      style={{ flex: 1, padding: '12px' }}
                      onClick={handleSave}
                      disabled={saving || !!jsonError || (!!selectedId && staticList.some(s => s.id === selectedId))}
                    >
                      {saving ? 'Saving to Database...' : 'Save Template to MongoDB'}
                    </button>
                  </div>
                  {saveStatus && (
                    <div className={`${styles.statusBar} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                      {saveStatus.text}
                    </div>
                  )}
                  {selectedId && staticList.some(s => s.id === selectedId) && (
                    <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px', textAlign: 'center' }}>
                      ⚠️ Static catalogs are read-only. Change the Template ID to save a custom copy.
                    </p>
                  )}
                </div>
              ) : (
              <>
              {currentStep === 1 && (
                <div className={styles.wizardStepContent}>
              {/* Metadata */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-id">Template ID</label>
                  <input
                    id="tpl-id"
                    type="text"
                    className={styles.input}
                    value={template.id || ''}
                    onChange={(e) => updateField('id', e.target.value)}
                    disabled={!!selectedId && staticList.some(s => s.id === selectedId)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-title">Template Title</label>
                  <input
                    id="tpl-title"
                    type="text"
                    className={styles.input}
                    value={template.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-description">Description</label>
                <textarea
                  id="tpl-description"
                  className={styles.textarea}
                  value={template.description || ''}
                  placeholder="Short internal summary of what this activity teaches."
                  onChange={(e) => updateField('description', e.target.value)}
                  style={{ minHeight: 72 }}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-exam-id">Exam Prep Mode</label>
                  <select
                    id="tpl-exam-id"
                    className={styles.select}
                    value={template.examId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField('examId', val || undefined);
                      if (val === 'jnvst') {
                        if (template.subject !== 'mat' && template.subject !== 'arithmetic' && template.subject !== 'language') {
                          updateField('subject', 'arithmetic');
                        }
                      } else {
                        if (template.subject === 'mat' || template.subject === 'arithmetic' || template.subject === 'language') {
                          updateField('subject', 'math');
                        }
                      }
                    }}
                  >
                    <option value="">None (School Curriculum)</option>
                    <option value="jnvst">JNVST (Navodaya Prep)</option>
                    <option value="aissee">AISSEE (Sainik School Prep)</option>
                    <option value="ssc">SSC CGL (Staff Selection)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-type">Template Type</label>
                  <select
                    id="tpl-type"
                    className={styles.select}
                    value={template.type || 'math'}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      updateField('type', nextType === 'math' ? undefined : nextType);
                    }}
                  >
                    <option value="math">Visual Mathematics (Static/Formula)</option>
                    <option value="dynamic_pool">Dynamic Option Pool (Vocabulary/Sorting)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-subject">
                    {template.examId === 'jnvst' ? 'Exam Section' : 'Subject'}
                  </label>
                  <select
                    id="tpl-subject"
                    className={styles.select}
                    value={template.subject || 'math'}
                    onChange={(e) => updateField('subject', e.target.value)}
                  >
                    {template.examId === 'jnvst' ? (
                      <>
                        <option value="mat">Mental Ability (MAT)</option>
                        <option value="arithmetic">Arithmetic</option>
                        <option value="language">Language</option>
                      </>
                    ) : (
                      Object.entries(SUBJECT_MODES)
                        .filter(([k]) => k !== 'mat' && k !== 'arithmetic' && k !== 'language')
                        .map(([value, config]) => (
                          <option key={value} value={value}>{config.label}</option>
                        ))
                    )}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-topic">
                    {template.examId === 'jnvst' ? 'Exam Topic Slug' : 'Topic Node Slug'}
                  </label>
                  <input
                    id="tpl-topic"
                    type="text"
                    className={styles.input}
                    value={template.topic || ''}
                    placeholder={template.examId === 'jnvst' ? "e.g. averages" : "e.g. ukg-numbers-counting"}
                    onChange={(e) => updateField('topic', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-grade">Grade</label>
                  <input
                    id="tpl-grade"
                    type="text"
                    className={styles.input}
                    value={template.grade || ''}
                    placeholder="e.g. K, 1, 5, 10"
                    onChange={(e) => updateField('grade', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-difficulty">Difficulty Level</label>
                  <select
                    id="tpl-difficulty"
                    className={styles.select}
                    value={template.difficultyLevel || 'easy'}
                    onChange={(e) => updateField('difficultyLevel', e.target.value)}
                  >
                    {DIFFICULTY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-skill">Skill ID</label>
                  <input
                    id="tpl-skill"
                    type="text"
                    className={styles.input}
                    value={template.skillId || ''}
                    placeholder="e.g. addition-g1-ten-frame"
                    onChange={(e) => updateField('skillId', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-competency">Competency ID</label>
                  <input
                    id="tpl-competency"
                    type="text"
                    className={styles.input}
                    value={template.competencyId || ''}
                    placeholder="e.g. subtraction-within-10"
                    onChange={(e) => updateField('competencyId', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-tags">Tags</label>
                <input
                  id="tpl-tags"
                  type="text"
                  className={styles.input}
                  value={(template.tags || []).join(', ')}
                  placeholder="comma separated, e.g. ten-frame, subtraction, visual"
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                />
              </div>

              <div className={styles.subjectModeCard}>
                <div className={styles.subjectModeTitle}>Subject Aware Mode: {SUBJECT_MODES[template.subject]?.label || 'Custom'}</div>
                <div className={styles.subjectModeGrid}>
                  <div>
                    <strong>Relevant strands</strong>
                    <span>{(SUBJECT_MODES[template.subject]?.strands || []).join(', ') || 'Custom strands'}</span>
                  </div>
                  <div>
                    <strong>Recommended visuals</strong>
                    <span>{(SUBJECT_MODES[template.subject]?.visuals || []).join(', ') || 'Any visual'}</span>
                  </div>
                  <div>
                    <strong>Recommended interactions</strong>
                    <span>{(SUBJECT_MODES[template.subject]?.interactions || []).join(', ') || 'Any interaction'}</span>
                  </div>
                </div>
              </div>
              </div>
              )}

              {currentStep === 2 && (
                <div className={styles.wizardStepContent}>

                  {template.type === 'dynamic_pool' && (
                    <div style={{ padding: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px', fontWeight: 800 }}>
                        🎯 Dynamic Option Pool Configuration
                      </h4>
                      <div className={styles.formGrid} style={{ gap: '16px' }}>
                        <div className={styles.formGroup}>
                          <label htmlFor="tpl-pool-select">Select Option Pool</label>
                          <select
                            id="tpl-pool-select"
                            className={styles.select}
                            value={template.poolId || ''}
                            onChange={(e) => {
                              const poolId = e.target.value;
                              updateField('poolId', poolId);
                              const categories = getPoolCategories(poolId);
                              if (categories.length > 0) {
                                if (!template.targetCategory || (template.targetCategory !== '[random]' && !categories.includes(template.targetCategory))) {
                                  updateField('targetCategory', '[random]');
                                }
                              } else {
                                updateField('targetCategory', '');
                              }
                            }}
                          >
                            <option value="">-- Choose Option Pool --</option>
                            {groupedPools.english.length > 0 && (
                              <optgroup label="📚 English / ELA">
                                {groupedPools.english.map(p => (
                                  <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                ))}
                              </optgroup>
                            )}
                            {groupedPools.math.length > 0 && (
                              <optgroup label="📐 Mathematics">
                                {groupedPools.math.map(p => (
                                  <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                ))}
                              </optgroup>
                            )}
                            {groupedPools.science.length > 0 && (
                              <optgroup label="🔬 Science">
                                {groupedPools.science.map(p => (
                                  <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                ))}
                              </optgroup>
                            )}
                            {groupedPools.social_studies.length > 0 && (
                              <optgroup label="🌍 Social Studies">
                                {groupedPools.social_studies.map(p => (
                                  <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                ))}
                              </optgroup>
                            )}
                            {groupedPools.other.length > 0 && (
                              <optgroup label="⚙️ Other / General">
                                {groupedPools.other.map(p => (
                                  <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            🎯 Target Categories
                            <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>(which pool categories are used as correct answer targets)</span>
                          </label>
                          {template.poolId && getPoolCategories(template.poolId).length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', background: '#f1f5f9', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                              {/* [random] toggle */}
                              {(() => {
                                const selectedTargets = Array.isArray(template.targetCategories) ? template.targetCategories : (template.targetCategory && template.targetCategory !== '[random]' ? [template.targetCategory] : []);
                                const isRandom = template.targetCategory === '[random]' || !template.targetCategory;
                                return (
                                  <>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', background: isRandom ? '#fef9c3' : '#fff', border: isRandom ? '1px solid #eab308' : '1px solid #cbd5e1', fontSize: '13px', fontWeight: isRandom ? 700 : 500, color: isRandom ? '#854d0e' : '#334155', transition: 'all 0.15s' }}>
                                      <input
                                        type="radio"
                                        name={`target-cat-mode-${template.id}`}
                                        checked={isRandom}
                                        style={{ accentColor: '#eab308', width: '14px', height: '14px' }}
                                        onChange={() => {
                                          updateField('targetCategory', '[random]');
                                          updateField('targetCategories', []);
                                        }}
                                      />
                                      🎲 [random]
                                    </label>
                                    {getPoolCategories(template.poolId).map(category => {
                                      const isChecked = !isRandom && selectedTargets.includes(category);
                                      return (
                                        <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', background: isChecked ? '#dbeafe' : '#fff', border: isChecked ? '1px solid #3b82f6' : '1px solid #cbd5e1', fontSize: '13px', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1d4ed8' : '#334155', transition: 'all 0.15s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            style={{ accentColor: '#3b82f6', width: '14px', height: '14px' }}
                                            onChange={(e) => {
                                              const current = Array.isArray(template.targetCategories) ? template.targetCategories : (template.targetCategory && template.targetCategory !== '[random]' ? [template.targetCategory] : []);
                                              const updated = e.target.checked
                                                ? [...current, category]
                                                : current.filter(c => c !== category);
                                              if (updated.length > 0) {
                                                updateField('targetCategory', updated[0]);
                                                updateField('targetCategories', updated);
                                              } else {
                                                updateField('targetCategory', '[random]');
                                                updateField('targetCategories', []);
                                              }
                                            }}
                                          />
                                          {category}
                                        </label>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <input
                              id="tpl-target-category"
                              type="text"
                              className={styles.input}
                              placeholder="e.g. nouns, verbs, A, B — or [random]"
                              value={template.targetCategory || ''}
                              onChange={(e) => updateField('targetCategory', e.target.value)}
                            />
                          )}
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label htmlFor="tpl-base-interaction">Base Interaction</label>
                          <select
                            id="tpl-base-interaction"
                            className={styles.select}
                            value={getInteractionString(template.interaction)}
                            onChange={(e) => updateField('interaction', e.target.value)}
                          >
                            <option value="choice">choice (Multiple Choice MCQ)</option>
                            <option value="multi_select">multi_select (Multi-Select MCQ)</option>
                            <option value="categorization">categorization (Categorization / Sorting - Konva Canvas)</option>
                            <option value="categorizationv2">categorizationv2 (Categorization / Sorting - HTML5 Drag-Drop)</option>
                            <option value="word_completion">word_completion (Word Completion / Phonics Fill)</option>
                            <option value="pick_from_sentence">pick_from_sentence (Select Word in Sentence)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

              {/* Data & Logic Board */}
              <div className={styles.sectionTitle}>
                <span>Data & Logic Board</span>
                <button type="button" className={styles.btn + ' ' + styles.btnSecondary} style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addVariable}>
                  + Add Variable
                </button>
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Data Sources</h3>
                    <p>Connect pools, random values, curriculum datasets, asset libraries, and fact databases.</p>
                  </div>
                  <div className={styles.poolSourceActions}>
                    <button type="button" className={styles.btn + ' ' + styles.btnPrimary} onClick={addPoolSource}>
                      + Add Pool Source
                    </button>
                    <button type="button" className={styles.btn + ' ' + styles.btnSecondary} onClick={addDataSource}>
                      + Add Data Source
                    </button>
                     <button
                      type="button"
                      className={styles.btn + ' ' + styles.btnSecondary}
                      onClick={() => {
                        const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
                        setNewPoolId(`${template.subject || 'science'}-${template.topic || 'general'}-options-${randomSuffix}`);
                        setNewPoolSubject(template.subject || 'science');
                        setNewPoolTopic(template.topic || 'general');
                        setShowCreatePoolModal(true);
                      }}
                    >
                      🧪 Create Pool
                    </button>
                    <a
                      href="/admin/vocabulary-pools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btn + ' ' + styles.btnSecondary}
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                      📦 Manage Pools
                    </a>
                  </div>
                </div>
                {(template.dataSources || []).length === 0 ? (
                  <div className={styles.emptyStateText}>No data sources configured. Start with "+ Add Pool Source" for vocabulary, phonics, math objects, science facts, or image/audio libraries.</div>
                ) : (
                  <div className={styles.schemaCardList}>
                    {(template.dataSources || []).map((source, idx) => (
                      <div key={idx} className={`${styles.schemaMiniCard} ${source.type === 'pool_selection' ? styles.poolSourceCard : ''}`}>
                        {source.type === 'pool_selection' ? (
                          <>
                            <div className={styles.poolBuilderGrid}>
                              <div>
                                <label htmlFor={`ds-id-${idx}`}>Source ID</label>
                                <input id={`ds-id-${idx}`} className={styles.input} value={source.id || ''} onChange={(e) => updateDataSource(idx, 'id', e.target.value)} />
                              </div>
                              <div>
                                <label htmlFor={`ds-pool-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>Pool ID</span>
                                  <a href="/admin" target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 600, textDecoration: 'underline' }}>
                                    Edit items at /admin ↗
                                  </a>
                                </label>
                                <select
                                  id={`ds-pool-${idx}`}
                                  className={styles.select}
                                  value={source.poolId || ''}
                                  onChange={(e) => {
                                    const nextPoolId = e.target.value;
                                    updateDataSource(idx, 'poolId', nextPoolId);
                                    const categories = getPoolCategories(nextPoolId);
                                    if (categories.length > 0) {
                                      if (!source.category || !categories.includes(source.category)) {
                                        updateDataSource(idx, 'category', categories[0]);
                                      }
                                    } else {
                                      updateDataSource(idx, 'category', '');
                                    }
                                  }}
                                >
                                  <option value="">-- Choose Option Pool --</option>
                                  {groupedPools.english.length > 0 && (
                                    <optgroup label="📚 English / ELA">
                                      {groupedPools.english.map(p => (
                                        <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {groupedPools.math.length > 0 && (
                                    <optgroup label="📐 Mathematics">
                                      {groupedPools.math.map(p => (
                                        <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {groupedPools.science.length > 0 && (
                                    <optgroup label="🔬 Science">
                                      {groupedPools.science.map(p => (
                                        <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {groupedPools.social_studies.length > 0 && (
                                    <optgroup label="🌍 Social Studies">
                                      {groupedPools.social_studies.map(p => (
                                        <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {groupedPools.other.length > 0 && (
                                    <optgroup label="⚙️ Other / General">
                                      {groupedPools.other.map(p => (
                                        <option key={p.poolId} value={p.poolId}>{p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`ds-category-${idx}`}>Category</label>
                                {getPoolCategories(source.poolId).length > 0 ? (
                                  <select
                                    id={`ds-category-${idx}`}
                                    className={styles.select}
                                    value={source.category || ''}
                                    onChange={(e) => updateDataSource(idx, 'category', e.target.value)}
                                  >
                                    <option value="">Select category</option>
                                    {getPoolCategories(source.poolId).map(category => (
                                      <option key={category} value={category}>{category}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    id={`ds-category-${idx}`}
                                    className={styles.input}
                                    value={source.category || ''}
                                    placeholder="nouns, verbs, short_a_words"
                                    onChange={(e) => updateDataSource(idx, 'category', e.target.value)}
                                  />
                                )}
                              </div>
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                  🎯 Target Categories
                                  <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>(items from these categories become correct answer options)</span>
                                </label>
                                {getPoolCategories(source.poolId).length > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {getPoolCategories(source.poolId).map(category => {
                                      const selectedTargets = Array.isArray(source.targetCategories) ? source.targetCategories : (source.targetCategories ? [source.targetCategories] : []);
                                      const isChecked = selectedTargets.includes(category);
                                      return (
                                        <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', background: isChecked ? '#dbeafe' : '#fff', border: isChecked ? '1px solid #3b82f6' : '1px solid #cbd5e1', fontSize: '13px', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1d4ed8' : '#334155', transition: 'all 0.15s' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            style={{ accentColor: '#3b82f6', width: '14px', height: '14px' }}
                                            onChange={(e) => {
                                              const current = Array.isArray(source.targetCategories) ? source.targetCategories : (source.targetCategories ? [source.targetCategories] : []);
                                              const updated = e.target.checked
                                                ? [...current, category]
                                                : current.filter(c => c !== category);
                                              updateDataSource(idx, 'targetCategories', updated.length > 0 ? updated : []);
                                            }}
                                          />
                                          {category}
                                        </label>
                                      );
                                    })}
                                    {(Array.isArray(source.targetCategories) ? source.targetCategories : []).length === 0 && (
                                      <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No target categories selected — all items treated equally</span>
                                    )}
                                  </div>
                                ) : (
                                  <input
                                    className={styles.input}
                                    value={Array.isArray(source.targetCategories) ? source.targetCategories.join(', ') : (source.targetCategories || '')}
                                    placeholder="e.g. targets, correct_items"
                                    onChange={(e) => updateDataSource(idx, 'targetCategories', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                  />
                                )}
                              </div>
                              <div>
                                <label htmlFor={`ds-count-${idx}`}>Count</label>
                                <input
                                  id={`ds-count-${idx}`}
                                  type="number"
                                  min="1"
                                  className={styles.input}
                                  value={source.count || 1}
                                  onChange={(e) => updateDataSource(idx, 'count', Number(e.target.value))}
                                />
                              </div>

                              {/* Property filters grid */}
                              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <div>
                                    <label htmlFor={`ds-target-prop-${idx}`} style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>🎯 Target Filter Property</label>
                                    <input
                                      id={`ds-target-prop-${idx}`}
                                      className={styles.input}
                                      value={source.targetProperty || ''}
                                      placeholder="e.g. kind"
                                      onChange={(e) => updateDataSource(idx, 'targetProperty', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`ds-target-val-${idx}`} style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>🎯 Target Filter Value</label>
                                    <input
                                      id={`ds-target-val-${idx}`}
                                      className={styles.input}
                                      value={source.targetValue || ''}
                                      placeholder="e.g. animal"
                                      onChange={(e) => updateDataSource(idx, 'targetValue', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <div>
                                    <label htmlFor={`ds-dist-prop-${idx}`} style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>👾 Distractor Filter Property</label>
                                    <input
                                      id={`ds-dist-prop-${idx}`}
                                      className={styles.input}
                                      value={source.distractorProperty || ''}
                                      placeholder="e.g. tags"
                                      onChange={(e) => updateDataSource(idx, 'distractorProperty', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`ds-dist-val-${idx}`} style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>👾 Distractor Filter Value</label>
                                    <input
                                      id={`ds-dist-val-${idx}`}
                                      className={styles.input}
                                      value={source.distractorValue || ''}
                                      placeholder="e.g. living"
                                      onChange={(e) => updateDataSource(idx, 'distractorValue', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label htmlFor={`ds-variable-${idx}`}>Save as variable</label>
                                <input
                                  id={`ds-variable-${idx}`}
                                  className={styles.input}
                                  value={source.variableName || ''}
                                  placeholder="TargetNoun"
                                  onChange={(e) => updateDataSource(idx, 'variableName', e.target.value)}
                                />
                              </div>
                              <div className={styles.poolBuilderButtons}>
                                <button type="button" className={styles.btn + ' ' + styles.btnPrimary} onClick={() => createPoolVariableFromSource(source)}>
                                  Save Variable
                                </button>
                                {source.poolId && (
                                  <button type="button" className={styles.btn + ' ' + styles.btnSecondary} style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => openPoolLibrary(source.poolId)}>
                                    🛠️ Manage Items
                                  </button>
                                )}
                                <button type="button" className={styles.btnRemoveOption} onClick={() => removeDataSource(idx)}>✕</button>
                              </div>
                            </div>
                            <div className={styles.poolPreviewStrip}>
                              {loadedPools[source.poolId] === 'loading' ? (
                                <span>Loading pool...</span>
                              ) : getPoolItemsForSource(source).length > 0 ? (
                                <>
                                  <strong>{getPoolItemsForSource(source).length} items</strong>
                                  {getPoolItemsForSource(source).slice(0, 8).map((item, itemIdx) => (
                                    <span key={`${source.id}-${itemIdx}`} className={styles.poolPreviewPill}>
                                      {typeof item === 'string' ? item : (item.label || item.id || `item ${itemIdx + 1}`)}
                                      {typeof item === 'object' && item.imageUrl ? ' · image' : ''}
                                      {typeof item === 'object' && item.audioUrl ? ' · audio' : ''}
                                    </span>
                                  ))}
                                </>
                              ) : (
                                <span>Enter a pool ID and category to preview items and validate count.</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                        <div className={styles.schemaMiniGrid}>
                          <div>
                            <label htmlFor={`ds-id-${idx}`}>ID</label>
                            <input id={`ds-id-${idx}`} className={styles.input} value={source.id || ''} onChange={(e) => updateDataSource(idx, 'id', e.target.value)} />
                          </div>
                          <div>
                            <label htmlFor={`ds-type-${idx}`}>Type</label>
                            <select id={`ds-type-${idx}`} className={styles.select} value={source.type || 'static_data'} onChange={(e) => updateDataSource(idx, 'type', e.target.value)}>
                              {DATA_SOURCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`ds-name-${idx}`}>Name / Pool / Dataset</label>
                            <input id={`ds-name-${idx}`} className={styles.input} value={source.name || source.poolId || source.datasetId || ''} onChange={(e) => updateDataSource(idx, 'name', e.target.value)} />
                          </div>
                          <button type="button" className={styles.btnRemoveOption} onClick={() => removeDataSource(idx)}>✕</button>
                        </div>
                        <label htmlFor={`ds-items-${idx}`}>Items / Query / Notes</label>
                        <input
                          id={`ds-items-${idx}`}
                          className={styles.input}
                          value={Array.isArray(source.items) ? source.items.join(', ') : (source.query || source.items || '')}
                          placeholder="comma list, query, or descriptor"
                          onChange={(e) => updateDataSource(idx, 'items', e.target.value.split(',').map(item => item.trim()).filter(Boolean))}
                        />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Use Variables</h3>
                    <p>Click tokens into prompt, visual image, options, validation answer, or feedback without hand-editing JSON.</p>
                  </div>
                </div>
                {(template.variables || []).length === 0 ? (
                  <div className={styles.emptyStateText}>Create a pool variable first, then use it across the template.</div>
                ) : (
                  <div className={styles.variableTokenGrid}>
                    {(template.variables || []).map(variable => {
                      const labelToken = getVariableLabelToken(variable);
                      const imageToken = getVariableAssetToken(variable, 'imageUrl');
                      const audioToken = getVariableAssetToken(variable, 'audioUrl');
                      return (
                        <div key={variable.name} className={styles.variableTokenCard}>
                          <div>
                            <strong>{variable.name}</strong>
                            <span>{variable.type}{variable.category ? ` · ${variable.category}` : ''}{variable.count ? ` · ${variable.count}` : ''}</span>
                          </div>
                          <code>{labelToken}</code>
                          <div className={styles.variableTokenActions}>
                            <button type="button" onClick={() => appendTextToken('questionText', labelToken)}>Prompt</button>
                            {variable.type === 'pool_selection' && (
                              <button type="button" onClick={() => setVisualImageToken(imageToken, labelToken)}>Visual</button>
                            )}
                            <button type="button" onClick={() => addOptionFromToken(labelToken, true)}>Correct option</button>
                            <button type="button" onClick={() => addOptionFromToken(labelToken, false)}>Distractor</button>
                            <button type="button" onClick={() => setValidationToken(labelToken)}>Answer</button>
                            <button type="button" onClick={() => appendExplanationToken(labelToken)}>Feedback</button>
                            {variable.type === 'pool_selection' && <button type="button" onClick={() => appendExplanationToken(audioToken)}>Audio token</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Constraints & Validation Guardrails</h3>
                    <p>Global generation rules used by QA, answer generation, and future adaptive engines.</p>
                  </div>
                </div>
                <div className={styles.schemaControlGrid}>
                  <label><input type="checkbox" checked={!!template.constraints?.uniqueOptions} onChange={(e) => updateNestedConfig('constraints', 'uniqueOptions', e.target.checked)} /> Unique options</label>
                  <label><input type="checkbox" checked={!!template.constraints?.preventDuplicateWords} onChange={(e) => updateNestedConfig('constraints', 'preventDuplicateWords', e.target.checked)} /> Prevent duplicate words</label>
                  <div>
                    <label htmlFor="constraint-min-options">Min options</label>
                    <input id="constraint-min-options" type="number" className={styles.input} value={template.constraints?.minOptionCount ?? 3} onChange={(e) => updateNestedConfig('constraints', 'minOptionCount', Number(e.target.value))} />
                  </div>
                  <div>
                    <label htmlFor="constraint-max-options">Max options</label>
                    <input id="constraint-max-options" type="number" className={styles.input} value={template.constraints?.maxOptionCount ?? 6} onChange={(e) => updateNestedConfig('constraints', 'maxOptionCount', Number(e.target.value))} />
                  </div>
                  <div>
                    <label htmlFor="constraint-similarity">Distractor similarity</label>
                    <select id="constraint-similarity" className={styles.select} value={template.constraints?.distractorSimilarity || 'medium'} onChange={(e) => updateNestedConfig('constraints', 'distractorSimilarity', e.target.value)}>
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Variables & Expressions</h3>
                    <p>Define random values, expressions, string templates, array transforms, and computed variables.</p>
                  </div>
                </div>
              <div className={styles.varList}>
                {template.variables.map((variable, idx) => (
                  <div key={idx} className={styles.varCard}>
                    <div className={styles.varCardHeader}>
                      <input
                        type="text"
                        className={styles.varNameInput}
                        value={variable.name || ''}
                        onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                        aria-label={`Variable ${idx + 1} Name`}
                      />
                      <button type="button" className={styles.varDeleteBtn} onClick={() => removeVariable(idx)} title="Delete Variable">
                        ✕
                      </button>
                    </div>

                    <div className={styles.varFields}>
                      <label htmlFor={`var-type-${idx}`}>Type</label>
                      <select
                        id={`var-type-${idx}`}
                        className={styles.select}
                        value={variable.type || 'integer'}
                        onChange={(e) => updateVariable(idx, 'type', e.target.value)}
                      >
                        {VARIABLE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      {variable.type === 'integer' && (
                        <div className={styles.varFieldsSubGrid}>
                          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                            <label htmlFor={`var-min-${idx}`} style={{ fontSize: '11px' }}>Min (Value or Exp)</label>
                            <input
                              id={`var-min-${idx}`}
                              type="text"
                              className={styles.input}
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={variable.min || ''}
                              onChange={(e) => updateVariable(idx, 'min', e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                            <label htmlFor={`var-max-${idx}`} style={{ fontSize: '11px' }}>Max (Value or Exp)</label>
                            <input
                              id={`var-max-${idx}`}
                              type="text"
                              className={styles.input}
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={variable.max || ''}
                              onChange={(e) => updateVariable(idx, 'max', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {variable.type === 'expression' && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label htmlFor={`var-formula-${idx}`} style={{ fontSize: '11px' }}>Math Formula (e.g. A + B)</label>
                          <input
                            id={`var-formula-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={variable.formula || ''}
                            onChange={(e) => updateVariable(idx, 'formula', e.target.value)}
                          />
                        </div>
                      )}

                      {variable.type === 'pool_selection' && (
                        <div className={styles.poolVariableFields}>
                          <div>
                            <label htmlFor={`var-source-${idx}`}>Source ID</label>
                            <input
                              id={`var-source-${idx}`}
                              className={styles.input}
                              value={variable.sourceId || variable.source || ''}
                              onChange={(e) => updateVariable(idx, 'source', e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor={`var-pool-${idx}`}>Pool ID</label>
                            <input
                              id={`var-pool-${idx}`}
                              className={styles.input}
                              value={variable.poolId || ''}
                              onChange={(e) => updateVariable(idx, 'poolId', e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor={`var-category-${idx}`}>Category</label>
                            <input
                              id={`var-category-${idx}`}
                              className={styles.input}
                              value={variable.category || ''}
                              onChange={(e) => updateVariable(idx, 'category', e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor={`var-count-${idx}`}>Count</label>
                            <input
                              id={`var-count-${idx}`}
                              type="number"
                              min="1"
                              className={styles.input}
                              value={variable.count || 1}
                              onChange={(e) => updateVariable(idx, 'count', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      )}

                      {['string_template', 'array_transform', 'conditional', 'computed'].includes(variable.type) && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label htmlFor={`var-logic-${idx}`} style={{ fontSize: '11px' }}>Formula / Template / Transform</label>
                          <input
                            id={`var-logic-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={variable.formula || variable.template || ''}
                            placeholder="e.g. NounsPool[0].label or Numbers[0] + Numbers[1]"
                            onChange={(e) => updateVariable(idx, variable.type === 'string_template' ? 'template' : 'formula', e.target.value)}
                          />
                        </div>
                      )}

                      {variable.type === 'list' && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label htmlFor={`var-items-${idx}`} style={{ fontSize: '11px', margin: 0 }}>Comma separated list</label>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery(`variable_items_${idx}`, Array.isArray(variable.items) ? variable.items.join(', ') : (variable.items || ''))}
                            >
                              📷 Gallery
                            </button>
                          </div>
                          <input
                            id={`var-items-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={Array.isArray(variable.items) ? variable.items.join(', ') : (variable.items || '')}
                            onChange={(e) => updateVariable(idx, 'items', e.target.value.split(',').map(s => s.trim()))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {template.variables.length === 0 && (
                  <p className={styles.emptyStateText} style={{ padding: '12px' }}>No variables declared. Constants will be evaluated.</p>
                )}
              </div>
              </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className={styles.wizardStepContent}>
              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Layout Composition</h3>
                    <p>Choose the rendering strategy used by the universal player across mobile, tablet, and desktop.</p>
                  </div>
                </div>
                <div className={styles.schemaControlGrid}>
                  <div>
                    <label htmlFor="layout-mode">Layout mode</label>
                    <select
                      id="layout-mode"
                      className={styles.select}
                      value={template.layoutConfig?.mode || 'prompt_top'}
                      onChange={(e) => updateNestedConfig('layoutConfig', 'mode', e.target.value)}
                    >
                      {LAYOUT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="layout-responsive">Responsive priority</label>
                    <select
                      id="layout-responsive"
                      className={styles.select}
                      value={template.layoutConfig?.responsiveTarget || 'mobile_first'}
                      onChange={(e) => updateNestedConfig('layoutConfig', 'responsiveTarget', e.target.value)}
                    >
                      <option value="mobile_first">mobile_first</option>
                      <option value="tablet_first">tablet_first</option>
                      <option value="desktop_first">desktop_first</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="layout-density">Content density</label>
                    <select
                      id="layout-density"
                      className={styles.select}
                      value={template.layoutConfig?.density || 'balanced'}
                      onChange={(e) => updateNestedConfig('layoutConfig', 'density', e.target.value)}
                    >
                      <option value="compact">compact</option>
                      <option value="balanced">balanced</option>
                      <option value="spacious">spacious</option>
                    </select>
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!template.layoutConfig?.showWorkArea}
                      onChange={(e) => updateNestedConfig('layoutConfig', 'showWorkArea', e.target.checked)}
                    />
                    Show student work area
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!template.layoutConfig?.clickToSubmit}
                      onChange={(e) => updateNestedConfig('layoutConfig', 'clickToSubmit', e.target.checked)}
                    />
                    Click to submit option (bypasses Check button)
                  </label>
                  {template.subject === 'english' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!template.layoutConfig?.audio}
                        onChange={(e) => updateNestedConfig('layoutConfig', 'audio', e.target.checked)}
                      />
                      Play question audio automatically
                    </label>
                  )}
                </div>
              </div>

              {/* Visual Binding */}
              <div className={styles.sectionTitle}>
                <span>Visual SVG Model Binding</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-visual-select">Select Visual Model</label>
                <select
                  id="tpl-visual-select"
                  className={styles.select}
                  value={template.visuals?.[0]?.component || ''}
                  onChange={(e) => handleSelectVisualComponent(e.target.value)}
                >
                  {VISUAL_COMPONENTS.map(c => (
                    <option key={c.value} value={c.value}>{c.name}</option>
                  ))}
                </select>
              </div>

              {(template.visuals || []).length > 0 && (
                <div className={styles.visualCard}>
                  <div className={styles.visualCardHeader}>
                    <span className={styles.visualTitle}>Configuring: {template.visuals[0].component}</span>
                  </div>
                  
                  {template.visuals[0].component === 'TenFrame' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-filled">Filled counters</label>
                        <input
                          id="ten-filled"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.filledCount || ''}
                          onChange={(e) => updateVisualProp('filledCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-crossed">Crossed out</label>
                        <input
                          id="ten-crossed"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.crossedOutCount || ''}
                          onChange={(e) => updateVisualProp('crossedOutCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-color">Counter color</label>
                        <select
                          id="ten-color"
                          className={styles.select}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.color || 'red'}
                          onChange={(e) => updateVisualProp('color', e.target.value)}
                        >
                          {COLORS_LIST.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                       <div className={styles.propRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                        <input
                          id="ten-click-to-fill"
                          type="checkbox"
                          checked={Boolean(template.visuals[0].props?.clickToFill === true || template.visuals[0].props?.clickToFill === 'true')}
                          onChange={(e) => updateVisualProp('clickToFill', e.target.checked)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <label htmlFor="ten-click-to-fill" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                          Click to Fill (Interactive)
                        </label>
                      </div>
                      {Boolean(template.visuals[0].props?.clickToFill === true || template.visuals[0].props?.clickToFill === 'true') && template.optionsType !== 'fillInTheBlank' && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                          ⚠️ Set Options Type to <strong>Fill-In-The-Blank (FIB)</strong> in Question Contents below. This hides multiple-choice options for the interactive click-to-fill mode.
                        </div>
                      )}
                    </>
                  )}

                  {template.visuals[0].component === 'JarOfMarbles' && (
                    <>
                      <div className={styles.propGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-colA" style={{ width: 'auto', marginRight: '6px' }}>Color A</label>
                            <select
                              id="jar-colA"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorA || 'blue'}
                              onChange={(e) => updateVisualProp('colorA', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-cntA" style={{ width: 'auto', marginRight: '6px' }}>Count A</label>
                            <input
                              id="jar-cntA"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.countA || ''}
                              onChange={(e) => updateVisualProp('countA', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-colB" style={{ width: 'auto', marginRight: '6px' }}>Color B</label>
                            <select
                              id="jar-colB"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorB || 'red'}
                              onChange={(e) => updateVisualProp('colorB', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-cntB" style={{ width: 'auto', marginRight: '6px' }}>Count B</label>
                            <input
                              id="jar-cntB"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.countB || ''}
                              onChange={(e) => updateVisualProp('countB', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {template.visuals[0].component === 'Spinner' && (
                    <>
                      <div className={styles.propGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-colA" style={{ width: 'auto', marginRight: '6px' }}>Color A</label>
                            <select
                              id="spin-colA"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorA || 'blue'}
                              onChange={(e) => updateVisualProp('colorA', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-secA" style={{ width: 'auto', marginRight: '6px' }}>Sectors A</label>
                            <input
                              id="spin-secA"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.sectorsA || ''}
                              onChange={(e) => updateVisualProp('sectorsA', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-colB" style={{ width: 'auto', marginRight: '6px' }}>Color B</label>
                            <select
                              id="spin-colB"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorB || 'green'}
                              onChange={(e) => updateVisualProp('colorB', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-secB" style={{ width: 'auto', marginRight: '6px' }}>Sectors B</label>
                            <input
                              id="spin-secB"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.sectorsB || ''}
                              onChange={(e) => updateVisualProp('sectorsB', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {template.visuals[0].component === 'ItemCounter' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="item-count">Item Count</label>
                        <input
                          id="item-count"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.count || ''}
                          onChange={(e) => updateVisualProp('count', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="item-width">Custom Width (px)</label>
                        <input
                          id="item-width"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.width || ''}
                          onChange={(e) => updateVisualProp('width', e.target.value)}
                          placeholder="e.g. 90"
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="item-type" style={{ margin: 0 }}>Item Type</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setUseCustomItemType(!useCustomItemType)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              {useCustomItemType ? 'Use Select' : 'Enter Custom / Gallery'}
                            </button>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery('itemType', template.visuals[0].props?.itemType)}
                            >
                              📷 Gallery
                            </button>
                          </div>
                        </div>
                        {useCustomItemType ? (
                          <LabelledListEditor
                            value={template.visuals[0].props?.itemType || ''}
                            onChange={(val) => updateVisualProp('itemType', val)}
                            placeholder="e.g. cupcake or url1, url2"
                          />
                        ) : (
                          <select
                            id="item-type"
                            className={styles.select}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.itemType || 'cupcake'}
                            onChange={(e) => updateVisualProp('itemType', e.target.value)}
                          >
                            <option value="cupcake">cupcake</option>
                            <option value="apple">apple</option>
                            <option value="star">star</option>
                            <option value="random">random (selects randomly)</option>
                            {template.variables.map(v => (
                              <option key={v.name} value={v.name}>variable: {v.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-show-numbers"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.showNumbers === true || template.visuals[0].props?.showNumbers === 'true' || template.visuals[0].props?.showNumbers === 1)}
                            onChange={(e) => updateVisualProp('showNumbers', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-show-numbers" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Show Numbers Overlay
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-hide-images"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.hideImages === true || template.visuals[0].props?.hideImages === 'true')}
                            onChange={(e) => updateVisualProp('hideImages', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-hide-images" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Hide Images (Show Numbers Only)
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-not-clickable"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.notClickable === true || template.visuals[0].props?.notClickable === 'true')}
                            onChange={(e) => updateVisualProp('notClickable', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-not-clickable" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Not Clickable (Disable Interaction)
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                  {template.visuals[0].component === 'Image' && (
                    <>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="img-url" style={{ margin: 0 }}>Image URL</label>
                          <button
                            type="button"
                            className={styles.btn + ' ' + styles.btnSecondary}
                            style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                            onClick={() => openGallery('imageUrl', template.visuals[0].props?.imageUrl)}
                          >
                            📷 Gallery
                          </button>
                        </div>
                        <LabelledListEditor
                          value={template.visuals[0].props?.imageUrl || ''}
                          onChange={(val) => updateVisualProp('imageUrl', val)}
                          placeholder="e.g. https://domain.com/img.png or url1, url2"
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="img-width">Width</label>
                        <input
                          id="img-width"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.width || '200'}
                          placeholder="e.g. 200 or 200px"
                          onChange={(e) => updateVisualProp('width', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* VisualChoice props — which shows N? */}
                  {template.visuals[0].component === 'VisualChoice' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="vc-correct-count">Correct Count (variable)</label>
                        <input
                          id="vc-correct-count"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.correctCount || 'A'}
                          placeholder="e.g. A"
                          onChange={(e) => updateVisualProp('correctCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="vc-item-type" style={{ margin: 0 }}>Item Type</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setUseCustomItemType(!useCustomItemType)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              {useCustomItemType ? 'Use Select' : 'Enter Custom / Gallery'}
                            </button>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery('itemType', template.visuals[0].props?.itemType)}
                            >
                              📷 Gallery
                            </button>
                          </div>
                        </div>
                        {useCustomItemType ? (
                          <LabelledListEditor
                            value={template.visuals[0].props?.itemType || ''}
                            onChange={(val) => updateVisualProp('itemType', val)}
                            placeholder="e.g. strawberry or label::https://url"
                          />
                        ) : (
                          <select
                            id="vc-item-type"
                            className={styles.select}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.itemType || 'cupcake'}
                            onChange={(e) => updateVisualProp('itemType', e.target.value)}
                          >
                            <option value="cupcake">cupcake</option>
                            <option value="apple">apple</option>
                            <option value="star">star</option>
                          </select>
                        )}
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="vc-distractor-mode">Distractor Mode</label>
                        <select
                          id="vc-distractor-mode"
                          className={styles.select}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.distractorMode || 'auto'}
                          onChange={(e) => updateVisualProp('distractorMode', e.target.value)}
                        >
                          <option value="auto">auto (random ±1-3)</option>
                          <option value="manual">manual (set distractorCount)</option>
                        </select>
                      </div>
                      {template.visuals[0].props?.distractorMode === 'manual' && (
                        <div className={styles.propRow}>
                          <label htmlFor="vc-distractor-count">Wrong Count</label>
                          <input
                            id="vc-distractor-count"
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.distractorCount || '1'}
                            placeholder="e.g. 1 or B"
                            onChange={(e) => updateVisualProp('distractorCount', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Auto-set optionsType when VisualChoice component is selected */}
                      {template.optionsType !== 'visual_choice' && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                          ⚠️ Set Options Type to <strong>Visual Choice</strong> in Question Contents below for this to work.
                        </div>
                      )}
                    </>
                  )}

                  {/* PlaceValue props */}
                  {(template.visuals[0].component === 'PlaceValue' || template.visuals[0].component === 'BaseTenBlocks') && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="pv-thousands">Thousands (variable or number)</label>
                        <input
                          id="pv-thousands"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.thousands || '0'}
                          onChange={(e) => updateVisualProp('thousands', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="pv-hundreds">Hundreds (variable or number)</label>
                        <input
                          id="pv-hundreds"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.hundreds || '0'}
                          onChange={(e) => updateVisualProp('hundreds', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="pv-tens">Tens (variable or number)</label>
                        <input
                          id="pv-tens"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.tens || 'T'}
                          onChange={(e) => updateVisualProp('tens', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="pv-ones">Ones (variable or number)</label>
                        <input
                          id="pv-ones"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.ones || 'O'}
                          onChange={(e) => updateVisualProp('ones', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                        <input
                          id="pv-show-chart"
                          type="checkbox"
                          checked={template.visuals[0].props?.showChart !== 'false' && template.visuals[0].props?.showChart !== false}
                          onChange={(e) => updateVisualProp('showChart', e.target.checked ? 'true' : 'false')}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <label htmlFor="pv-show-chart" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                          Show Place Value Chart Grid
                        </label>
                      </div>
                    </>
                  )}

                  {!['TenFrame', 'JarOfMarbles', 'Spinner', 'ItemCounter', 'Image', 'VisualChoice', 'PlaceValue', 'BaseTenBlocks'].includes(template.visuals[0].component) && (
                    <div className={styles.schemaSectionCard} style={{ marginTop: 12, marginBottom: 0 }}>
                      <div className={styles.schemaSectionHeader}>
                        <div>
                          <h3>Component Props</h3>
                          <p>Edit the default properties for {template.visuals[0].component}. You can use numbers, text, or variables like A, B, Result.</p>
                        </div>
                      </div>
                      <div className={styles.schemaControlGrid}>
                        {Object.entries(template.visuals[0].props || {}).map(([propName, propValue]) => (
                          <div key={propName}>
                            <label htmlFor={`generic-visual-${propName}`}>{propName}</label>
                            <input
                              id={`generic-visual-${propName}`}
                              type="text"
                              className={styles.input}
                              value={Array.isArray(propValue) ? propValue.join(', ') : String(propValue ?? '')}
                              onChange={(e) => updateVisualProp(propName, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Question Layout and Text */}
              <div className={styles.sectionTitle}>
                <span>Question Contents</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-question-text">Question Text</label>
                <input
                  id="tpl-question-text"
                  type="text"
                  className={styles.input}
                  value={template.questionText || ''}
                  placeholder="e.g. What is [A] minus [B]?"
                  onChange={(e) => updateField('questionText', e.target.value)}
                />
              </div>
              </div>
              )}

              {currentStep === 4 && (
                <div className={styles.wizardStepContent}>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Interaction Engine</h3>
                    <p>Select the student action model. Subject-aware recommendations stay visible, but all engines remain available for advanced templates.</p>
                  </div>
                </div>
                <div className={styles.schemaControlGrid}>
                  <div>
                    <label htmlFor="interaction-engine">Engine</label>
                    <select
                      id="interaction-engine"
                      className={styles.select}
                      value={template.interaction?.engine || template.optionsType || 'mcq'}
                      onChange={(e) => {
                        updateNestedConfig('interaction', 'engine', e.target.value);
                        if (['mcq', 'fill_blank', 'drag_drop', 'picture_mcq', 'audio_mcq', 'hotspot'].includes(e.target.value)) {
                          const legacyTypeMap = {
                            mcq: 'mcq',
                            picture_mcq: 'visual_choice',
                            audio_mcq: 'mcq',
                            fill_blank: 'fillInTheBlank',
                            drag_drop: 'categorizationv2',
                            hotspot: 'hotspot_select',
                          };
                          updateField('optionsType', legacyTypeMap[e.target.value] || e.target.value);
                        }
                      }}
                    >
                      {INTERACTION_ENGINES.map(engine => (
                        <option key={engine} value={engine}>
                          {engine}{SUBJECT_MODES[template.subject]?.interactions?.includes(engine) ? ' • recommended' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="interaction-input-mode">Input mode</label>
                    <select
                      id="interaction-input-mode"
                      className={styles.select}
                      value={template.interaction?.inputMode || 'single_answer'}
                      onChange={(e) => updateNestedConfig('interaction', 'inputMode', e.target.value)}
                    >
                      <option value="single_answer">single_answer</option>
                      <option value="multi_answer">multi_answer</option>
                      <option value="free_response">free_response</option>
                      <option value="manipulative">manipulative</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="interaction-attempts">Max attempts</label>
                    <input
                      id="interaction-attempts"
                      type="number"
                      min="1"
                      className={styles.input}
                      value={template.interaction?.maxAttempts ?? 2}
                      onChange={(e) => updateNestedConfig('interaction', 'maxAttempts', Number(e.target.value))}
                    />
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!template.interaction?.allowRetry}
                      onChange={(e) => updateNestedConfig('interaction', 'allowRetry', e.target.checked)}
                    />
                    Allow retry with feedback
                  </label>
                </div>
              </div>

              {/* Options Type Selector */}
              <div className={styles.formGroup}>
                <label htmlFor="options-type">Options Type</label>
                <select
                  id="options-type"
                  className={styles.select}
                  value={template.optionsType || 'mcq'}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField('optionsType', val);
                    // Auto-switch visual component when visual_choice is selected
                    if (val === 'visual_choice' && template.visuals[0]?.component !== 'VisualChoice') {
                      const vc = VISUAL_COMPONENTS.find(c => c.value === 'VisualChoice');
                      if (vc) updateField('visuals', [{ component: 'VisualChoice', props: { ...vc.props } }]);
                    }
                    if (val === 'categorizationv2') {
                      const hasDndPart = Array.isArray(template.parts) && template.parts.some(p => p.type === 'categorizationv2' || p.type === 'categorization');
                      if (!hasDndPart) {
                        updateField('parts', [
                          {
                            type: 'categorizationv2',
                            layoutMode: 'category_sort',
                            htmlLayout: 'category_sort',
                            cardStyle: 'standard',
                            categories: [
                              { id: 'cat_1', label: 'Category 1' },
                              { id: 'cat_2', label: 'Category 2' }
                            ],
                            items: [
                              { id: 'item_1', content: 'Item 1' },
                              { id: 'item_2', content: 'Item 2' }
                            ],
                            answerKey: {
                              'item_1': 'cat_1',
                              'item_2': 'cat_2'
                            }
                          }
                        ]);
                      }
                    }
                  }}
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="fillInTheBlank">Fill-In-The-Blank (FIB)</option>
                  <option value="categorizationv2">Categorization / Drag & Drop</option>
                  <option value="visual_choice">Visual Choice (Which shows N?)</option>
                  <option value="hotspot_select">Interactive Hotspot (Click Image)</option>
                </select>
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Answer Validation Rules</h3>
                    <p>Attach reusable answer rules for exact, numeric, regex, multi-answer, and custom formula validation.</p>
                  </div>
                  <button type="button" className={styles.btn + ' ' + styles.btnSecondary} onClick={addValidationRule}>
                    + Add Rule
                  </button>
                </div>
                {(template.validationRules || []).length === 0 ? (
                  <div className={styles.emptyStateText}>No explicit validation rules yet. The evaluator will use the selected interaction answer key.</div>
                ) : (
                  <div className={styles.schemaCardList}>
                    {(template.validationRules || []).map((rule, idx) => (
                      <div key={idx} className={styles.schemaMiniCard}>
                        <div className={styles.schemaMiniGrid}>
                          <div>
                            <label htmlFor={`validation-type-${idx}`}>Rule type</label>
                            <select id={`validation-type-${idx}`} className={styles.select} value={rule.type || 'exact_match'} onChange={(e) => updateValidationRule(idx, 'type', e.target.value)}>
                              {VALIDATION_RULE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`validation-target-${idx}`}>Target</label>
                            <input id={`validation-target-${idx}`} className={styles.input} value={rule.target || 'answer'} onChange={(e) => updateValidationRule(idx, 'target', e.target.value)} />
                          </div>
                          <div>
                            <label htmlFor={`validation-value-${idx}`}>Expected / Formula</label>
                            <input id={`validation-value-${idx}`} className={styles.input} value={rule.value || rule.formula || ''} onChange={(e) => updateValidationRule(idx, 'value', e.target.value)} />
                          </div>
                          <button type="button" className={styles.btnRemoveOption} onClick={() => removeValidationRule(idx)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hotspot Canvas Editor — only show for hotspot_select */}
              {template.optionsType === 'hotspot_select' && (() => {
                const partIdx = Array.isArray(template.parts) ? template.parts.findIndex(p => p.type === 'hotspot_canvas') : -1;
                const part = partIdx >= 0 ? template.parts[partIdx] : null;
                if (!part) return null;
                
                const hotspots = part.hotspots || [];
                const bgUrl = part.backgroundUrl || part.backgroundImage || '';

                const updatePartProp = (propName, propVal) => {
                  const newParts = [...template.parts];
                  newParts[partIdx] = {
                    ...newParts[partIdx],
                    [propName]: propVal
                  };
                  updateField('parts', newParts);
                };

                const updateHotspotProp = (hsIndex, propName, propVal) => {
                  const newHotspots = [...hotspots];
                  newHotspots[hsIndex] = {
                    ...newHotspots[hsIndex],
                    [propName]: propVal
                  };
                  updatePartProp('hotspots', newHotspots);
                };

                return (
                  <div className={styles.visualCard} style={{ background: '#f5f3ff', border: '1px solid #c084fc', marginBottom: '20px' }}>
                    <div className={styles.visualCardHeader} style={{ background: '#ede9fe', padding: '10px 14px', borderBottom: '1px solid #ddd6fe' }}>
                      <span className={styles.visualTitle} style={{ color: '#6d28d9', fontSize: '13px', fontWeight: 'bold' }}>🎯 Interactive Hotspot Zones Mapper</span>
                    </div>

                    <div className={styles.panelBody} style={{ padding: '14px' }}>
                      <div className={styles.formGroup} style={{ marginTop: '0px', marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4c1d95', display: 'block', marginBottom: '4px' }}>
                          Background Image URL (Map Canvas)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className={styles.input}
                            style={{ padding: '8px 10px', fontSize: '13px' }}
                            value={bgUrl}
                            placeholder="Enter image URL or placeholder like [resolved_image]..."
                            onChange={e => updatePartProp('backgroundUrl', e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.btn + ' ' + styles.btnSecondary}
                            onClick={() => openGallery('backgroundUrl', bgUrl)}
                            style={{ padding: '8px 12px' }}
                          >
                            🖼️ Gallery
                          </button>
                        </div>
                      </div>

                      {/* Dynamic SVG Scene Composition Controls */}
                      <div style={{ marginTop: '12px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="checkbox"
                            id="use-dynamic-compose"
                            checked={Boolean(part.composeScene)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updatePartProp('composeScene', {
                                  containerType: 'box',
                                  targetClipart: '',
                                  placements: ['[placement_0]', '[placement_1]']
                                });
                              } else {
                                const newParts = [...template.parts];
                                const updatedPart = { ...newParts[partIdx] };
                                delete updatedPart.composeScene;
                                newParts[partIdx] = updatedPart;
                                updateField('parts', newParts);
                              }
                            }}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <label htmlFor="use-dynamic-compose" style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>
                            ✨ Use Dynamic SVG Scene Composition (No Static Images)
                          </label>
                        </div>

                        {part.composeScene && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Container Type</label>
                                <select
                                  className={styles.select}
                                  style={{ padding: '6px 8px', fontSize: '12px', marginTop: '3px', width: '100%' }}
                                  value={part.composeScene.containerType || 'box'}
                                  onChange={(e) => {
                                    updatePartProp('composeScene', {
                                      ...part.composeScene,
                                      containerType: e.target.value
                                    });
                                  }}
                                >
                                  <option value="box">Box (Rounded Rect)</option>
                                  <option value="bowl">Bowl (Blue curved bowl)</option>
                                  <option value="basket">Basket (Woven basket with handle)</option>
                                  <option value="circle">Circle / Ring (Dashed target ellipse)</option>
                                  <option value="plate">Plate / Table (Flat grey plate)</option>
                                  <option value="house">House (Cottage shape with roof)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Clipart URL / Variable</label>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                  <input
                                    type="text"
                                    className={styles.input}
                                    style={{ padding: '6px 8px', fontSize: '12px', width: '100%' }}
                                    placeholder="e.g. [animal_img] or URL"
                                    value={part.composeScene.targetClipart || ''}
                                    onChange={(e) => {
                                      updatePartProp('composeScene', {
                                        ...part.composeScene,
                                        targetClipart: e.target.value
                                      });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => openGallery('composeScene.targetClipart', part.composeScene.targetClipart || '')}
                                  >
                                    🖼️
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                Placements (For Hotspot Zone 1 and Zone 2)
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {hotspots.map((hs, i) => {
                                  const placementsArr = Array.isArray(part.composeScene.placements) ? part.composeScene.placements : [];
                                  const currentVal = placementsArr[i] || '';
                                  return (
                                    <div key={i}>
                                      <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
                                        {hs.label || `Zone ${i+1}`} Placement:
                                      </span>
                                      <input
                                        type="text"
                                        className={styles.input}
                                        style={{ padding: '5px 8px', fontSize: '11px', marginTop: '3px', width: '100%' }}
                                        placeholder="e.g. [placement_0], inside, outside, empty"
                                        value={currentVal}
                                        onChange={(e) => {
                                          const newPlacements = [...placementsArr];
                                          while (newPlacements.length <= i) {
                                            newPlacements.push('');
                                          }
                                          newPlacements[i] = e.target.value;
                                          updatePartProp('composeScene', {
                                            ...part.composeScene,
                                            placements: newPlacements
                                          });
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        {/* Left: Graphic coordinate helper */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>Visual Zones Preview</span>
                          <div style={{
                            position: 'relative',
                            width: '200px',
                            height: '128px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f8fafc',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            {bgUrl && !bgUrl.includes('[') ? (
                              <img src={bgUrl} alt="Background map" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '9px', textAlign: 'center', padding: '8px' }}>
                                {bgUrl ? `Evaluating: ${bgUrl}` : 'No image loaded'}
                              </div>
                            )}
                            {hotspots.map((hs, i) => (
                              <div
                                key={i}
                                onClick={() => setActiveHsIdx(i)}
                                style={{
                                  position: 'absolute',
                                  left: `${(hs.x / 500) * 100}%`,
                                  top: `${(hs.y / 320) * 100}%`,
                                  width: `${(hs.width / 500) * 100}%`,
                                  height: `${(hs.height / 320) * 100}%`,
                                  border: activeHsIdx === i ? '2px solid #4f46e5' : '1px dashed #64748b',
                                  background: activeHsIdx === i ? 'rgba(79, 70, 229, 0.25)' : 'rgba(100, 116, 139, 0.1)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  color: activeHsIdx === i ? '#4f46e5' : '#64748b',
                                  fontWeight: 'bold',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {hs.label || `Z${i+1}`}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px' }}>Click zone to select it</span>
                        </div>

                        {/* Right: Coordinates Sliders for active zone */}
                        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {hotspots[activeHsIdx] ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '12px', color: '#4f46e5' }}>
                                  Edit Box: {hotspots[activeHsIdx].label || `Zone ${activeHsIdx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                                  onClick={() => {
                                    const newHs = hotspots.filter((_, i) => i !== activeHsIdx);
                                    updatePartProp('hotspots', newHs);
                                    setActiveHsIdx(Math.max(0, activeHsIdx - 1));
                                  }}
                                >
                                  Delete Zone
                                </button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div>
                                  <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>Zone Label</label>
                                  <input
                                    type="text"
                                    className={styles.input}
                                    style={{ padding: '4px 6px', fontSize: '11px' }}
                                    value={hotspots[activeHsIdx].label || ''}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'label', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>Option Index</label>
                                  <input
                                    type="number"
                                    className={styles.input}
                                    style={{ padding: '4px 6px', fontSize: '11px' }}
                                    value={hotspots[activeHsIdx].optionIndex}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'optionIndex', Number(e.target.value))}
                                  />
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600, color: '#475569' }}>
                                  <span>Horiz Position (X):</span>
                                  <span>{hotspots[activeHsIdx].x}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="500"
                                  value={hotspots[activeHsIdx].x}
                                  onChange={e => updateHotspotProp(activeHsIdx, 'x', Number(e.target.value))}
                                  style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                />
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600, color: '#475569' }}>
                                  <span>Vert Position (Y):</span>
                                  <span>{hotspots[activeHsIdx].y}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="320"
                                  value={hotspots[activeHsIdx].y}
                                  onChange={e => updateHotspotProp(activeHsIdx, 'y', Number(e.target.value))}
                                  style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                                    <span>Width:</span>
                                    <span>{hotspots[activeHsIdx].width}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={hotspots[activeHsIdx].width}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'width', Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                                    <span>Height:</span>
                                    <span>{hotspots[activeHsIdx].height}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="320"
                                    value={hotspots[activeHsIdx].height}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'height', Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                              No active zone. Click Add Zone.
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnSecondary}
                        style={{ marginTop: '12px', width: '100%', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          const newHs = [
                            ...hotspots,
                            {
                              id: `zone_${hotspots.length + 1}`,
                              label: `Zone ${hotspots.length + 1}`,
                              x: 50,
                              y: 50,
                              width: 100,
                              height: 100,
                              optionIndex: hotspots.length
                            }
                          ];
                          updatePartProp('hotspots', newHs);
                          setActiveHsIdx(newHs.length - 1);
                        }}
                      >
                        + Add Bounding Box Zone
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Options — show for MCQ and Hotspot */}
              {(template.optionsType === 'mcq' || template.optionsType === 'hotspot_select') && (
              <div className={styles.formGroup}>
                <label>Choices (Multiple Choice Options)</label>
                {(template.options || []).map((opt, idx) => (
                  <div key={idx} className={styles.optionPedagogyCard}>
                    <div className={styles.optionRow}>
                      <input
                        type="text"
                        className={styles.input + ' ' + styles.optionInput}
                        value={opt.label || opt.value || ''}
                        placeholder={`Choice ${idx + 1}`}
                        onChange={(e) => updateOption(idx, 'label', e.target.value)}
                      />
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={opt.isCorrect || false}
                          onChange={(e) => updateOption(idx, 'isCorrect', e.target.checked)}
                        />
                        Correct
                      </label>
                      {template.options.length > 2 && (
                        <button
                          type="button"
                          className={styles.btnRemoveOption}
                          onClick={() => {
                            const newOpts = template.options.filter((_, i) => i !== idx);
                            updateField('options', newOpts);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {!opt.isCorrect && (
                      <div className={styles.optionPedagogyFields}>
                        <div>
                          <label htmlFor={`option-misconception-${idx}`}>Misconception</label>
                          <select
                            id={`option-misconception-${idx}`}
                            className={styles.select}
                            value={opt.misconception || ''}
                            onChange={(e) => updateOption(idx, 'misconception', e.target.value)}
                          >
                            {MISCONCEPTION_PRESETS.map(preset => (
                              <option key={preset.value} value={preset.value}>{preset.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`option-feedback-${idx}`}>Feedback</label>
                          <input
                            id={`option-feedback-${idx}`}
                            type="text"
                            className={styles.input}
                            value={opt.feedback || ''}
                            placeholder="e.g. You counted one extra counter."
                            onChange={(e) => updateOption(idx, 'feedback', e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor={`option-remediation-${idx}`}>Remediation Hint</label>
                          <input
                            id={`option-remediation-${idx}`}
                            type="text"
                            className={styles.input}
                            value={opt.remediationHint || ''}
                            placeholder="e.g. Cross out [B], then count what is left."
                            onChange={(e) => updateOption(idx, 'remediationHint', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnSecondary}
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    updateField('options', [...template.options, { label: '', isCorrect: false }]);
                  }}
                >
                  + Add Choice
                </button>
              </div>
              )}
                </div>
              )}

              {/* Drag & Drop (Categorization) Editor */}
              {template.optionsType === 'categorizationv2' && (() => {
                const partIdx = Array.isArray(template.parts) ? template.parts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization') : -1;
                const part = partIdx >= 0 ? template.parts[partIdx] : null;

                if (!part) {
                  return (
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b' }}>
                        Drag & Drop part structure is not initialized for this template yet.
                      </p>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        onClick={initDndPart}
                      >
                        Initialize Drag & Drop Part
                      </button>
                    </div>
                  );
                }

                const categories = part.categories || [];
                const items = part.items || [];
                const answerKey = part.answerKey || {};

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {currentStep === 4 && (
                      <div className={styles.wizardStepContent}>
                    {/* Layout Configuration */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>DND Layout Mode</label>
                        <select
                          className={styles.select}
                          value={part.layoutMode || 'category_sort'}
                          onChange={e => updateDndPartProp('layoutMode', e.target.value)}
                        >
                          <option value="category_sort">Category Sort (Standard Columns)</option>
                          <option value="ordering">Ordering (Sequential sorting)</option>
                          <option value="grid_fill">Grid Fill (Column Grid)</option>
                          <option value="table_fill">Table Fill (Matrix Grid)</option>
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>Card Visual Style</label>
                        <select
                          className={styles.select}
                          value={part.cardStyle || 'standard'}
                          onChange={e => updateDndPartProp('cardStyle', e.target.value)}
                        >
                          <option value="standard">Standard Bordered Card</option>
                          <option value="transparent">Transparent Clipart Card</option>
                          <option value="compact">Compact Small Card</option>
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Counts Configuration */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>Dynamic Categories Display Count</label>
                        <input
                          type="text"
                          className={styles.input}
                          style={{ padding: '8px 12px' }}
                          value={part.categoryCount || ''}
                          placeholder="e.g. 2, or [var] (leave blank for all)"
                          onChange={e => updateDndPartProp('categoryCount', e.target.value)}
                        />
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>Dynamic Drag Items Display Count</label>
                        <input
                          type="text"
                          className={styles.input}
                          style={{ padding: '8px 12px' }}
                          value={part.itemCount || ''}
                          placeholder="e.g. 4, or [var] (leave blank for all)"
                          onChange={e => updateDndPartProp('itemCount', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Categories Management */}
                    <div style={{ padding: '16px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0d9488' }}>
                          📁 Columns / Categories ({categories.length})
                        </h4>
                        <button
                          type="button"
                          className={styles.btn}
                          style={{ padding: '4px 10px', fontSize: '11px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={addDndCategory}
                        >
                          + Add Category
                        </button>
                      </div>

                      <div className={styles.dndGrid}>
                        {categories.map((cat, catIdx) => (
                          <div key={catIdx} className={styles.dndCard}>
                            <button
                              type="button"
                              className={styles.dndDeleteBtn}
                              onClick={() => removeDndCategory(catIdx)}
                              disabled={categories.length <= 1}
                              title="Remove Category"
                            >
                              ✕
                            </button>

                            <div className={styles.dndPreviewBox}>
                              {(() => {
                                const urlStr = cat.prefillImageUrl || '';
                                const previewUrl = getImageUrlPreview(urlStr);
                                if (previewUrl) {
                                  return <img src={previewUrl} alt="Preview" className={styles.dndPreviewImage} />;
                                }
                                return <div className={styles.dndPreviewText}>{cat.label || 'Empty'}</div>;
                              })()}
                            </div>

                            <div className={styles.dndFormControls}>
                              <div>
                                <label>Category ID</label>
                                <input
                                  type="text"
                                  value={cat.id || ''}
                                  onChange={e => updateDndCategory(catIdx, 'id', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Label Text</label>
                                <input
                                  type="text"
                                  value={cat.label || ''}
                                  onChange={e => updateDndCategory(catIdx, 'label', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Prefill Image / Icon</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={cat.prefillImageUrl || ''}
                                    placeholder="URL or [var]"
                                    onChange={e => updateDndCategory(catIdx, 'prefillImageUrl', e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                    style={{ padding: '0 8px' }}
                                    onClick={() => openGallery('dnd_category_prefillImageUrl_' + catIdx, cat.prefillImageUrl || '')}
                                  >
                                    🖼️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className={styles.wizardStepContent}>
                    {/* Drag Items Management */}
                    <div style={{ padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>
                          🏷️ Drag Items ({items.length})
                        </h4>
                        <button
                          type="button"
                          className={styles.btn}
                          style={{ padding: '4px 10px', fontSize: '11px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={addDndItem}
                        >
                          + Add Drag Item
                        </button>
                      </div>

                      {(() => {
                        const groupedItems = {};
                        const unassignedItems = [];

                        categories.forEach(c => {
                          groupedItems[c.id] = { category: c, items: [] };
                        });

                        items.forEach((item, originalIndex) => {
                          const targetCat = answerKey[item.id];
                          if (targetCat && groupedItems[targetCat]) {
                            groupedItems[targetCat].items.push({ item, index: originalIndex });
                          } else {
                            unassignedItems.push({ item, index: originalIndex });
                          }
                        });

                        const renderCard = ({ item, index }) => (
                          <div key={index} className={styles.dndCard}>
                            <button
                              type="button"
                              className={styles.dndDeleteBtn}
                              onClick={() => removeDndItem(index)}
                              disabled={items.length <= 1}
                              title="Remove Item"
                            >
                              ✕
                            </button>

                            <div className={styles.dndPreviewBox}>
                              {(() => {
                                const urlStr = item.imageUrl || '';
                                if (isInlineSvg(urlStr)) {
                                  return (
                                    <span 
                                      style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                      dangerouslySetInnerHTML={{ __html: cleanSvgContent(urlStr) }} 
                                    />
                                  );
                                }
                                if (isInlineSvg(item.svg)) {
                                  return (
                                    <span 
                                      className="svg-preview-container"
                                      style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                      dangerouslySetInnerHTML={{ __html: cleanSvgContent(item.svg) }} 
                                    />
                                  );
                                }
                                const previewUrl = getImageUrlPreview(urlStr);
                                if (previewUrl) {
                                  return <img src={previewUrl} alt="Preview" className={styles.dndPreviewImage} />;
                                }
                                return <div className={styles.dndPreviewText}>{item.content || 'Empty'}</div>;
                              })()}
                            </div>

                            <div className={styles.dndFormControls}>
                              <div>
                                <label>Item ID</label>
                                <input
                                  type="text"
                                  value={item.id || ''}
                                  onChange={e => updateDndItem(index, 'id', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Card Text / Content</label>
                                <input
                                  type="text"
                                  value={item.content || ''}
                                  placeholder="Text label"
                                  onChange={e => updateDndItem(index, 'content', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Target Category</label>
                                <select
                                  value={answerKey[item.id] || ''}
                                  onChange={e => updateDndAnswerKey(item.id, e.target.value)}
                                >
                                  <option value="">-- Unassigned --</option>
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.label} ({c.id})</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ flex: 1 }}>
                                  <label>Image URL</label>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input
                                      type="text"
                                      value={item.imageUrl || ''}
                                      placeholder="URL or [var]"
                                      onChange={e => updateDndItem(index, 'imageUrl', e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      className={styles.btn + ' ' + styles.btnSecondary}
                                      style={{ padding: '0 8px' }}
                                      onClick={() => openGallery('dnd_item_imageUrl_' + index, item.imageUrl || '')}
                                    >
                                      🖼️
                                    </button>
                                  </div>
                                </div>
                                <div style={{ width: '60px' }}>
                                  <label>Width</label>
                                  <input
                                    type="text"
                                    value={item.imageWidth || ''}
                                    placeholder="e.g. 80"
                                    onChange={e => updateDndItem(index, 'imageWidth', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label>Inline SVG Markup</label>
                                <input
                                  type="text"
                                  value={item.svg || ''}
                                  placeholder="<svg>...</svg> or [var]"
                                  onChange={e => updateDndItem(index, 'svg', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );

                        return (
                          <div>
                            {unassignedItems.length > 0 && (
                              <div className={styles.dndCategoryGroup}>
                                <div className={styles.dndCategoryHeader} style={{ color: '#64748b' }}>
                                  Unassigned Items ({unassignedItems.length})
                                </div>
                                <div className={styles.dndGrid}>
                                  {unassignedItems.map(renderCard)}
                                </div>
                              </div>
                            )}

                            {Object.values(groupedItems).map(group => {
                              if (group.items.length === 0) return null;
                              return (
                                <div key={group.category.id} className={styles.dndCategoryGroup}>
                                  <div className={styles.dndCategoryHeader} style={{ color: '#1d4ed8' }}>
                                    {group.category.label} ({group.category.id}) - {group.items.length} item(s)
                                  </div>
                                  <div className={styles.dndGrid}>
                                    {group.items.map(renderCard)}
                                  </div>
                                </div>
                              );
                            })}

                            {Object.values(groupedItems).every(g => g.items.length === 0) && unassignedItems.length === 0 && (
                              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                No items added yet. Click "+ Add Drag Item" to begin.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {currentStep === 5 && (
                <div className={styles.wizardStepContent}>
              {/* Explanation */}
              <div className={styles.formGroup}>
                <label htmlFor="tpl-explanation">Step-by-step Solution Explanation</label>
                <textarea
                  id="tpl-explanation"
                  className={styles.textarea}
                  value={template.explanation?.sections?.[0]?.content || ''}
                  placeholder="Use variables like [A], [B], [Result] in explanation text."
                  onChange={(e) => {
                    updateField('explanation', {
                      sections: [{ type: 'text', content: e.target.value }]
                    });
                  }}
                />
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Feedback Rules</h3>
                    <p>Define success, misconception, hints, and explanation copy that the player can render consistently.</p>
                  </div>
                </div>
                <div className={styles.schemaControlGrid}>
                  <div>
                    <label htmlFor="feedback-correct">Correct message</label>
                    <input
                      id="feedback-correct"
                      className={styles.input}
                      value={template.feedbackRules?.correct_message || ''}
                      placeholder="Great job!"
                      onChange={(e) => updateNestedConfig('feedbackRules', 'correct_message', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="feedback-incorrect">Incorrect message</label>
                    <input
                      id="feedback-incorrect"
                      className={styles.input}
                      value={template.feedbackRules?.incorrect_message || ''}
                      placeholder="Try checking the visual again."
                      onChange={(e) => updateNestedConfig('feedbackRules', 'incorrect_message', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="feedback-hints">Hints</label>
                    <input
                      id="feedback-hints"
                      className={styles.input}
                      value={(template.feedbackRules?.hints || []).join(', ')}
                      placeholder="comma separated hints"
                      onChange={(e) => updateNestedConfig('feedbackRules', 'hints', e.target.value.split(',').map(hint => hint.trim()).filter(Boolean))}
                    />
                  </div>
                  <div>
                    <label htmlFor="feedback-misconception">Misconception feedback</label>
                    <input
                      id="feedback-misconception"
                      className={styles.input}
                      value={template.feedbackRules?.misconception_feedback || ''}
                      placeholder="What common wrong thinking should this correct?"
                      onChange={(e) => updateNestedConfig('feedbackRules', 'misconception_feedback', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.schemaSectionCard}>
                <div className={styles.schemaSectionHeader}>
                  <div>
                    <h3>Difficulty Rules</h3>
                    <p>Control how easy, medium, and hard variants change options, distractors, hints, visuals, and answer complexity.</p>
                  </div>
                </div>
                <div className={styles.difficultyGrid}>
                  {DIFFICULTY_LEVELS.map(level => (
                    <div key={level} className={styles.difficultyCard}>
                      <h4>{level}</h4>
                      <label htmlFor={`difficulty-options-${level}`}>Option count</label>
                      <input
                        id={`difficulty-options-${level}`}
                        type="number"
                        min="2"
                        className={styles.input}
                        value={template.difficultyRules?.[level]?.optionCount ?? (level === 'easy' ? 3 : level === 'medium' ? 4 : 6)}
                        onChange={(e) => updateDeepConfig('difficultyRules', level, 'optionCount', Number(e.target.value))}
                      />
                      <label htmlFor={`difficulty-similarity-${level}`}>Distractor similarity</label>
                      <select
                        id={`difficulty-similarity-${level}`}
                        className={styles.select}
                        value={template.difficultyRules?.[level]?.distractorSimilarity || (level === 'easy' ? 'low' : level === 'medium' ? 'medium' : 'high')}
                        onChange={(e) => updateDeepConfig('difficultyRules', level, 'distractorSimilarity', e.target.value)}
                      >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                      <label htmlFor={`difficulty-hints-${level}`}>Hint visibility</label>
                      <select
                        id={`difficulty-hints-${level}`}
                        className={styles.select}
                        value={template.difficultyRules?.[level]?.hintVisibility || (level === 'hard' ? 'after_error' : 'visible')}
                        onChange={(e) => updateDeepConfig('difficultyRules', level, 'hintVisibility', e.target.value)}
                      >
                        <option value="visible">visible</option>
                        <option value="after_error">after_error</option>
                        <option value="hidden">hidden</option>
                      </select>
                      <label htmlFor={`difficulty-support-${level}`}>Visual support</label>
                      <select
                        id={`difficulty-support-${level}`}
                        className={styles.select}
                        value={template.difficultyRules?.[level]?.visualSupport || (level === 'hard' ? 'minimal' : 'full')}
                        onChange={(e) => updateDeepConfig('difficultyRules', level, 'visualSupport', e.target.value)}
                      >
                        <option value="full">full</option>
                        <option value="partial">partial</option>
                        <option value="minimal">minimal</option>
                      </select>
                      <label htmlFor={`difficulty-complexity-${level}`}>Answer complexity</label>
                      <input
                        id={`difficulty-complexity-${level}`}
                        className={styles.input}
                        value={template.difficultyRules?.[level]?.answerComplexity || level}
                        onChange={(e) => updateDeepConfig('difficultyRules', level, 'answerComplexity', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Concept & Meta Configuration */}
              <div className={styles.sectionTitle}>
                <span>Concept & Meta Config Flags</span>
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Enable specialized conceptual and audio options for practice sessions.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.hasCarry)}
                      onChange={(e) => updateMetaConfigProp('hasCarry', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    ➕ Carry Over (Addition)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.hasBorrow)}
                      onChange={(e) => updateMetaConfigProp('hasBorrow', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    ➖ Borrowing (Subtraction)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.hasRemainder)}
                      onChange={(e) => updateMetaConfigProp('hasRemainder', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    ➗ Remainder (Division)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.oddEven)}
                      onChange={(e) => updateMetaConfigProp('oddEven', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🔢 Odd / Even Config
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.readable)}
                      onChange={(e) => updateMetaConfigProp('readable', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🗣️ Readable (TTS Enabled)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.readOptions)}
                      onChange={(e) => updateMetaConfigProp('readOptions', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🎙️ Read Options (TTS Choices)
                  </label>
                </div>
                  </div>
                </div>
              )}

                {currentStep === 6 && (
                  <div className={styles.wizardStepContent}>
                {renderCurriculumLinkerCard()}

                {/* Existing link info */}
                {(() => {
                  const existingNode = Array.isArray(curriculumNodes) && curriculumNodes.find(
                    node => node.templateId === template.id || node.id === template.id
                  );
                  const isAlreadySaved = Array.isArray(dynamicTemplates) && dynamicTemplates.some(t => t.id === template.id);

                  return (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {isAlreadySaved && (
                        <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✅ Saved: This template exists in MongoDB templates catalog.
                        </div>
                      )}
                      {existingNode && (
                        <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🔗 Linked: Currently linked to Curriculum Node "{existingNode.title}" (ID: {existingNode.id})
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className={styles.schemaSectionCard}>
                  <div className={styles.schemaSectionHeader}>
                    <div>
                      <h3>Analytics Configuration</h3>
                      <p>Choose which learner signals this template should emit for mastery, smart score, and confidence models.</p>
                    </div>
                  </div>
                  <div className={styles.analyticsGrid}>
                    {ANALYTICS_FIELDS.map(field => (
                      <label key={field}>
                        <input
                          type="checkbox"
                          checked={template.analyticsConfig?.[field] !== false}
                          onChange={(e) => updateNestedConfig('analyticsConfig', field, e.target.checked)}
                        />
                        {field}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.schemaSectionCard}>
                  <div className={styles.schemaSectionHeader}>
                    <div>
                      <h3>Adaptive Learning Routing</h3>
                      <p>Define where the learner goes after success, struggle, or mastery.</p>
                    </div>
                  </div>
                  <div className={styles.schemaControlGrid}>
                    <div>
                      <label htmlFor="adaptive-correct">Correct route target</label>
                      <input
                        id="adaptive-correct"
                        className={styles.input}
                        value={template.adaptiveRules?.correct?.target || ''}
                        placeholder="next skill id"
                        onChange={(e) => updateDeepConfig('adaptiveRules', 'correct', 'target', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="adaptive-incorrect">Incorrect route target</label>
                      <input
                        id="adaptive-incorrect"
                        className={styles.input}
                        value={template.adaptiveRules?.incorrect?.target || ''}
                        placeholder="remediation skill id"
                        onChange={(e) => updateDeepConfig('adaptiveRules', 'incorrect', 'target', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="adaptive-mastery">Mastery route target</label>
                      <input
                        id="adaptive-mastery"
                        className={styles.input}
                        value={template.adaptiveRules?.masteryAchieved?.target || ''}
                        placeholder="harder template id"
                        onChange={(e) => updateDeepConfig('adaptiveRules', 'masteryAchieved', 'target', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="adaptive-threshold">Mastery threshold</label>
                      <input
                        id="adaptive-threshold"
                        type="number"
                        min="0"
                        max="100"
                        className={styles.input}
                        value={template.adaptiveRules?.masteryAchieved?.threshold ?? 90}
                        onChange={(e) => updateDeepConfig('adaptiveRules', 'masteryAchieved', 'threshold', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnPrimary}
                    style={{ flex: 1, padding: '12px' }}
                    onClick={handleSave}
                    disabled={saving || (!!selectedId && staticList.some(s => s.id === selectedId))}
                  >
                    {saving ? 'Saving to Database...' : 'Save Template & Update Skill Node'}
                  </button>
                </div>

                {saveStatus && (
                  <div className={`${styles.statusBar} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                    {saveStatus.text}
                  </div>
                )}
                {selectedId && staticList.some(s => s.id === selectedId) && (
                  <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px', textAlign: 'center' }}>
                    ⚠️ Static catalogs are read-only. Click "Create New Template" or change the Template ID to save a custom copy.
                  </p>
                )}
                  </div>
                )}

              </>
            )}
            </div>
          </section>
            </div>

            <aside className={`${styles.panel} ${styles.livePreviewRail}`}>
              <div className={styles.livePreviewHeader}>
                <div>
                  <h2>Question Preview</h2>
                  <span>{template.title || template.id || 'Untitled template'}</span>
                </div>
                <div className={styles.livePreviewActions}>
                  {template && template.id && (
                    <a
                      href={`/practice?skill=${template.id}&subject=${template.subject || 'math'}&topic=${template.topic || 'addition'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sidebarMiniButton}
                      style={{
                        textDecoration: 'none',
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🔗 Test in Practice
                    </a>
                  )}
                  <button
                    type="button"
                    className={styles.sidebarMiniButton}
                    onClick={() => setSeed(Math.floor(Math.random() * 100000).toString())}
                    title={`Current Seed: ${seed}`}
                  >
                    New Seed
                  </button>
                  <button
                    type="button"
                    className={styles.sidebarMiniButton}
                    onClick={() => setCurrentStep(6)}
                  >
                    Full
                  </button>
                </div>
              </div>
              <div className={styles.livePreviewBody}>
                {evaluatedQuestion.ok ? (
                  (() => {
                    const q = evaluatedQuestion.question;
                    const visualParts = (q.parts || []).filter(part => part.type !== 'text').slice(0, 4);
                    const options = Array.isArray(q.options) ? q.options.slice(0, 6) : [];
                    const correctValue = q.correctAnswer ?? q.answer ?? q.correctAnswerText;

                    return (
                      <>
                        <div className={styles.railPrompt}>
                          {renderPreviewTextWithBlanks(q.questionText || 'Preview question text appears here.', q)}
                        </div>

                        {visualParts.length > 0 && (
                          <div className={styles.railVisualStack}>
                            {visualParts.map((part, idx) => {
                              const svg = part.svg || part.content || part.imageUrl;
                              const hasInlineSvg = typeof svg === 'string' && isInlineSvg(svg);
                              const imageUrl = part.imageUrl && !isInlineSvg(part.imageUrl) ? part.imageUrl : null;

                              if (hasInlineSvg) {
                                return (
                                  <div
                                    key={`${part.type || 'visual'}-${part.id || idx}`}
                                    className={styles.railSvg}
                                    dangerouslySetInnerHTML={{ __html: cleanSvgContent(svg) }}
                                  />
                                );
                              }

                              if (imageUrl) {
                                return (
                                  <img
                                    key={`${part.type || 'image'}-${part.id || idx}`}
                                    className={styles.railImage}
                                    src={imageUrl}
                                    alt={part.alt || part.label || 'Question visual'}
                                  />
                                );
                              }

                              if (part.type === 'categorization' || part.type === 'categorizationv2') {
                                return (
                                  <div key={`category-${idx}`} className={styles.railSummaryBox}>
                                    <strong>Sorting activity</strong>
                                    <span>{part.categories?.length || 0} groups · {part.items?.length || 0} items</span>
                                  </div>
                                );
                              }

                              return (
                                <div key={`${part.type || 'part'}-${part.id || idx}`} className={styles.railSummaryBox}>
                                  <strong>{part.type || 'Visual'}</strong>
                                  <span>{part.label || part.title || 'Dynamic visual component'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {options.length > 0 ? (
                          <div className={styles.railOptions}>
                            {options.map((opt, idx) => {
                              const label = typeof opt === 'string' ? opt : (opt.label ?? opt.value ?? `Option ${idx + 1}`);
                              const hasCorrectValue = correctValue !== undefined && correctValue !== null;
                              const isCorrect = idx === q.correctAnswerIndex
                                || Boolean(opt?.isCorrect)
                                || (hasCorrectValue && String(label) === String(correctValue))
                                || (hasCorrectValue && opt?.value !== undefined && String(opt.value) === String(correctValue));
                              const media = getOptionMediaContent(opt);
                              return (
                                <div
                                  key={`rail-option-${idx}-${String(label).slice(0, 18)}`}
                                  className={`${styles.railOption} ${isCorrect ? styles.railOptionCorrect : ''}`}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: '8px',
                                    minHeight: '52px',
                                    padding: '6px 12px'
                                  }}
                                >
                                  {media && (
                                    <div style={{
                                      flexShrink: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '40px',
                                      height: '40px',
                                      background: '#f8fafc',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      padding: '2px',
                                      overflow: 'hidden'
                                    }}>
                                      {media.type === 'image' && (
                                        <img src={media.content} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                      )}
                                      {media.type === 'svg' && (
                                        <div dangerouslySetInnerHTML={{ __html: cleanSvgContent(media.content) }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                      )}
                                      {media.type === 'emoji' && (
                                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{media.content}</span>
                                      )}
                                    </div>
                                  )}
                                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', wordBreak: 'break-word' }}>
                                      {(!media || (label && !isInlineSvg(label) && !getImageUrlPreview(label))) ? String(label) : ''}
                                    </span>
                                  </div>
                                  {isCorrect && <strong style={{ marginLeft: 'auto' }}>Correct</strong>}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={styles.railSummaryBox}>
                            <strong>Answer</strong>
                            <span>{String(correctValue ?? 'Generated by validation rules')}</span>
                          </div>
                        )}

                        <div className={styles.railMeta}>
                          <span>{q.type || template.interactionType || 'activity'}</span>
                          <span>{template.difficultyLevel || 'medium'}</span>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className={styles.railError}>
                    <strong>Preview needs attention</strong>
                    <span>{evaluatedQuestion.error}</span>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Simulator Preview Card */}
          <section className={`${styles.panel} ${styles.simulator}`} style={{ display: (currentStep === 6) ? 'block' : 'none' }}>
            <div className={styles.panelHeader} style={{ display: currentStep === 6 ? 'flex' : 'none' }}>
              <div className={styles.simulatorHeader}>
                <h2>Live Preview</h2>
                <div className={styles.deviceToggles}>
                  <button 
                    className={`${styles.deviceToggleBtn} ${previewDevice === 'desktop' ? styles.deviceToggleBtnActive : ''}`}
                    onClick={() => setPreviewDevice('desktop')}
                    title="Desktop View"
                  >
                    🖥️
                  </button>
                  <button 
                    className={`${styles.deviceToggleBtn} ${previewDevice === 'tablet' ? styles.deviceToggleBtnActive : ''}`}
                    onClick={() => setPreviewDevice('tablet')}
                    title="Tablet View"
                  >
                    📱
                  </button>
                  <button 
                    className={`${styles.deviceToggleBtn} ${previewDevice === 'mobile' ? styles.deviceToggleBtnActive : ''}`}
                    onClick={() => setPreviewDevice('mobile')}
                    title="Mobile View"
                  >
                    📱
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnSecondary}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                >
                  {isPreviewFullscreen ? '↙️ Exit Full Screen' : '↗️ Full Screen'}
                </button>
              </div>
            </div>

            <div className={styles.panelBody}>
              {currentStep === 6 && (
                <>
              {evaluatedQuestion.ok ? (
                <div className={styles.previewWrapper} style={isPreviewFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: '#f8fafc', padding: '24px', overflowY: 'auto', margin: 0 } : {}}>
                  {isPreviewFullscreen && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewFullscreen(false)}
                      style={{
                        position: 'fixed',
                        top: '16px',
                        right: '16px',
                        zIndex: 10000,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      ↙️ Exit Full Screen
                    </button>
                  )}
                  <div className={`${styles.deviceContainer} ${styles[previewDevice] || ''}`}>
                    <div className={styles.previewContainer}>
                      <div className={styles.practicePrompt}>
                    {renderPreviewTextWithBlanks(evaluatedQuestion.question.questionText, evaluatedQuestion.question)}
                  </div>

                  {/* Render Visual Parts (SVG / image / visual_panel / categorization / fill-in-the-blank) */}
                  {(() => {
                    const q = evaluatedQuestion.question;
                    const isVisualChoice = q.type === 'visual_choice';
                    const isCategorization = q.type === 'categorizationv2' || q.type === 'categorization';
                    const panels = q.parts.filter(p => p.type === 'visual_panel');

                    const renderItemVisual = (item) => {
                      const imageWidth = Number(item.imageWidth) || 60;
                      const svgContent = item.svg ? cleanSvgContent(item.svg) : (item.imageUrl && isInlineSvg(item.imageUrl) ? cleanSvgContent(item.imageUrl) : null);
                      const imageUrl = item.imageUrl;
                      const label = item.content || item.label;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' }}>
                          {svgContent ? (
                            <span
                              aria-hidden="true"
                              style={{
                                width: `${imageWidth}px`,
                                height: `${imageWidth}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                          ) : imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              style={{
                                maxWidth: `${imageWidth}px`,
                                maxHeight: `${imageWidth}px`,
                                objectFit: 'contain',
                                display: 'block'
                              }}
                            />
                          ) : null}
                          {label && (
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                              {label}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Categorization (Drag & Drop) Preview */}
                        {isCategorization && (
                          <div style={{ marginTop: '20px', width: '100%' }}>
                            {/* Categories Columns */}
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                              {(q.categories || []).map((cat, idx) => {
                                const catItems = previewControls.showCorrectAnswer
                                  ? (q.items || []).filter(item => {
                                      const ansKey = q.answer || q.answerKey || q.parts?.[0]?.answerKey || {};
                                      return ansKey[item.id] === cat.id || item.target === cat.id;
                                    })
                                  : [];

                                return (
                                  <div
                                    key={cat.id || idx}
                                    style={{
                                      flex: 1,
                                      minWidth: '180px',
                                      maxWidth: '300px',
                                      background: '#f8fafc',
                                      border: '2px dashed #cbd5e1',
                                      borderRadius: '12px',
                                      padding: '16px',
                                      textAlign: 'center',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>
                                      {cat.label}
                                    </div>
                                    {(cat.prefillImageUrl || cat.imageUrl) && (
                                      <img
                                        src={cat.prefillImageUrl || cat.imageUrl}
                                        alt=""
                                        style={{
                                          maxWidth: '80px',
                                          maxHeight: '80px',
                                          objectFit: 'contain',
                                          marginBottom: '12px',
                                          borderRadius: '8px'
                                        }}
                                      />
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minHeight: '80px', justifyContent: 'center' }}>
                                      {catItems.map((item, itemIdx) => (
                                        <div
                                          key={item.id || itemIdx}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            color: '#334155',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            fontWeight: 600,
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          {renderItemVisual(item)}
                                        </div>
                                      ))}
                                      {catItems.length === 0 && (
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Drop zone</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Items Tray */}
                            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                Drag Items (Correct assignments shown above)
                              </div>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {(q.items || []).filter(item => {
                                  if (!previewControls.showCorrectAnswer) return true;
                                  const ansKey = q.answer || q.answerKey || q.parts?.[0]?.answerKey || {};
                                  const targetCat = ansKey[item.id] || item.target;
                                  return !targetCat || !(q.categories || []).some(c => c.id === targetCat);
                                }).map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '8px 16px',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                      cursor: 'grab',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minWidth: '80px'
                                    }}
                                  >
                                    {renderItemVisual(item)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* General Parts-based rendering (FIB, etc.) */}
                        {!isVisualChoice && !isCategorization && Array.isArray(q.parts) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', margin: '12px 0' }}>
                            {q.parts.map((p, idx) => {
                              if (p.type === 'arithmeticLayout' && p.layout) {
                                const layout = p.layout;
                                const isVertical = layout.variant === 'verticalAdditionReplica' || layout.variant === 'verticalSubtractionReplica' || layout.variant === 'verticalMultiplicationReplica';
                                const answerRow = layout.rows?.find(r => r.kind === 'answer');
                                const digitCount = Math.max(
                                  2,
                                  answerRow?.cells?.length || 0,
                                  ...(layout.rows || []).map(r => String(r.text || '').replace(/[+×x−\-]/gi, '').trim().length)
                                );
                                const cellSize = isVertical ? 32 : 44;
                                const operatorWidth = isVertical ? 28 : 0;
                                const digitGridWidth = digitCount * cellSize;
                                const fullGridWidth = operatorWidth + digitGridWidth;

                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      width: '100%',
                                      margin: '18px 0'
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        gap: isVertical ? '3px' : '6px',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                        fontSize: isVertical ? '28px' : '38px',
                                        fontWeight: isVertical ? 500 : 800,
                                        color: '#0f172a',
                                      }}
                                    >
                                      {(layout.rows || []).map((row, rIdx) => {
                                        if (row.kind === 'divider') {
                                          return (
                                            <div
                                              key={rIdx}
                                              style={{
                                                width: isVertical ? `${fullGridWidth}px` : '100%',
                                                height: isVertical ? '2px' : '3px',
                                                background: '#0f172a',
                                              }}
                                            />
                                          );
                                        }
                                        if (row.kind === 'answer') {
                                          return (
                                            <div
                                              key={rIdx}
                                              style={{
                                                display: 'flex',
                                                gap: isVertical ? 0 : '6px',
                                                width: isVertical ? `${digitGridWidth}px` : 'auto',
                                                marginLeft: isVertical ? `${operatorWidth}px` : 0,
                                              }}
                                            >
                                              {(answerRow.cells || []).map((cell) => {
                                                const val = q.answer?.[cell.id] || q.correctAnswer?.[cell.id] || '';
                                                return (
                                                  <input
                                                    key={cell.id}
                                                    type="text"
                                                    value={val}
                                                    disabled
                                                    style={{
                                                      width: `${cellSize}px`,
                                                      height: isVertical ? '30px' : '54px',
                                                      border: '2px solid #22c55e',
                                                      borderLeftStyle: isVertical && cell.id !== answerRow.cells[0]?.id ? 'dashed' : 'solid',
                                                      borderLeftWidth: isVertical && cell.id !== answerRow.cells[0]?.id ? 1 : 2,
                                                      marginLeft: isVertical && cell.id !== answerRow.cells[0]?.id ? -1 : 0,
                                                      textAlign: 'center',
                                                      font: 'inherit',
                                                      fontSize: isVertical ? '22px' : 'inherit',
                                                      padding: 0,
                                                      background: '#f0fdf4',
                                                      color: '#15803d',
                                                      outline: 'none',
                                                    }}
                                                  />
                                                );
                                              })}
                                            </div>
                                          );
                                        }
                                        if (isVertical) {
                                          const rawText = String(row.text || '');
                                          const operator = rawText.trimStart().match(/^[+×x−\-]/i)?.[0] || '';
                                          const digits = rawText.replace(/^[\s+×x−\-]+/i, '').trim().padStart(digitCount, ' ').split('');

                                          return (
                                            <div
                                              key={rIdx}
                                              style={{
                                                width: `${fullGridWidth}px`,
                                                display: 'grid',
                                                gridTemplateColumns: `${operatorWidth}px repeat(${digitCount}, ${cellSize}px)`,
                                                alignItems: 'center',
                                                whiteSpace: 'pre',
                                              }}
                                            >
                                              <span style={{ textAlign: 'center' }}>{operator.toLowerCase() === 'x' ? '×' : operator}</span>
                                              {digits.map((digit, digitIdx) => (
                                                <span key={`${rIdx}-${digitIdx}`} style={{ textAlign: 'center' }}>
                                                  {digit === ' ' ? '\u00A0' : digit}
                                                </span>
                                              ))}
                                            </div>
                                          );
                                        }
                                        return <div key={rIdx}>{row.text}</div>;
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              if (p.type === 'text') {
                                return (
                                  <div key={idx} style={{ fontSize: '16px', color: '#1e293b', lineHeight: '1.6' }}>
                                    {p.content && typeof p.content === 'string' && p.content.includes('[[') ? (
                                      <span>
                                        {p.content.split(/(\[\[.*?\]\])/g).map((chunk, cIdx) => {
                                          if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
                                            const correctVal = getPreviewBlankValue(q, chunk.slice(2, -2));
                                            return (
                                              <input
                                                key={cIdx}
                                                type="text"
                                                value={correctVal}
                                                disabled
                                                style={{
                                                  width: `${Math.max(String(correctVal).length * 10 + 20, 60)}px`,
                                                  padding: '4px 8px',
                                                  margin: '0 4px',
                                                  border: '2px solid #22c55e',
                                                  borderRadius: '6px',
                                                  textAlign: 'center',
                                                  fontWeight: 'bold',
                                                  color: '#15803d',
                                                  background: '#f0fdf4'
                                                }}
                                              />
                                            );
                                          }
                                          return chunk;
                                        })}
                                      </span>
                                    ) : (
                                      p.content
                                    )}
                                  </div>
                                );
                              }
                              if (p.type === 'latex') {
                                return (
                                  <div key={idx} style={{ fontSize: '18px', fontFamily: 'math', margin: '4px 0', color: '#0f172a' }}>
                                    {p.content}
                                  </div>
                                );
                              }
                              if (p.type === 'svg') {
                                return (
                                  <div
                                    key={idx}
                                    className={styles.svgWrapper}
                                    dangerouslySetInnerHTML={{ __html: p.content }}
                                  />
                                );
                              }
                              if (p.type === 'image') {
                                const widthVal = p.commonImageWidth || p.maxWidth || '180px';
                                const resolvedWidth = typeof widthVal === 'number' ? `${widthVal}px` : widthVal;
                                return (
                                  <div
                                    key={idx}
                                    className={styles.svgWrapper}
                                    style={{ margin: '15px auto', display: 'flex', justifyContent: 'center' }}
                                  >
                                    <img
                                      src={p.imageUrl}
                                      alt="Template Visual"
                                      style={{ width: resolvedWidth, maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                  </div>
                                );
                              }
                              if (p.type === 'categorization' || p.type === 'categorizationv2' || p.type === 'drag_drop') {
                                return (
                                  <div key={idx} style={{ marginTop: '10px', width: '100%' }}>
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                                      {(p.categories || []).map((cat, catIdx) => {
                                        const catItems = previewControls.showCorrectAnswer
                                          ? (p.items || []).filter(item => {
                                              const ansKey = p.answer || p.answerKey || {};
                                              return ansKey[item.id] === cat.id || item.target === cat.id;
                                            })
                                          : [];
                                        return (
                                          <div
                                            key={cat.id || catIdx}
                                            style={{
                                              flex: 1,
                                              minWidth: '180px',
                                              maxWidth: '300px',
                                              background: '#f8fafc',
                                              border: '2px dashed #cbd5e1',
                                              borderRadius: '12px',
                                              padding: '16px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', fontSize: '14px' }}>{cat.label}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px', justifyContent: 'center' }}>
                                              {catItems.map((item, itemIdx) => (
                                                <div
                                                  key={item.id || itemIdx}
                                                  style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    color: '#334155',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    fontWeight: 600
                                                  }}
                                                >
                                                  {item.content || item.label}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {(p.items || []).filter(item => {
                                          if (!previewControls.showCorrectAnswer) return true;
                                          const ansKey = p.answer || p.answerKey || {};
                                          const targetCat = ansKey[item.id] || item.target;
                                          return !targetCat || !(p.categories || []).some(c => c.id === targetCat);
                                        }).map((item, itemIdx) => (
                                          <div
                                            key={item.id || itemIdx}
                                            style={{
                                              background: '#ffffff',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: '8px',
                                              padding: '8px 16px',
                                              fontSize: '13px',
                                              fontWeight: 600,
                                              color: '#1e293b'
                                            }}
                                          >
                                            {item.content || item.label}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              if (p.type === 'hotspot_canvas') {
                                const bgUrl = p.backgroundUrl || p.backgroundImage;
                                const w = p.canvasWidth || 500;
                                const h = p.canvasHeight || 320;
                                const hotspotsList = p.hotspots || [];
                                
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: 'relative',
                                      width: '100%',
                                      maxWidth: `${w}px`,
                                      aspectRatio: `${w} / ${h}`,
                                      margin: '20px auto',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      background: '#f8fafc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    {p.backgroundSvg ? (
                                      <div
                                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                        dangerouslySetInnerHTML={{ __html: p.backgroundSvg }}
                                      />
                                    ) : bgUrl ? (
                                      <img
                                        src={bgUrl}
                                        alt="Hotspot Background"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
                                      />
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', zIndex: 1 }}>
                                        No background image or SVG specified
                                      </span>
                                    )}
                                    {/* Overlay Hotspots */}
                                    {hotspotsList.map((hs, hsIdx) => {
                                      // Scale coordinate factors relative to nominal size (w, h)
                                      const leftPercent = (hs.x / w) * 100;
                                      const topPercent = (hs.y / h) * 100;
                                      const widthPercent = (hs.width / w) * 100;
                                      const heightPercent = (hs.height / h) * 100;
                                      
                                      return (
                                        <div
                                          key={hs.id || hsIdx}
                                          style={{
                                            position: 'absolute',
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: `${heightPercent}%`,
                                            border: '2px dashed #4f46e5',
                                            borderRadius: '6px',
                                            background: 'rgba(79, 70, 229, 0.12)',
                                            color: '#4f46e5',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.15s ease',
                                            zIndex: 2,
                                            boxSizing: 'border-box'
                                          }}
                                        >
                                          <span>{hs.label || `Zone ${hsIdx + 1}`}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}

                        {/* Visual Choice Panels */}
                        {isVisualChoice && panels.length > 0 && (
                          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
                            {panels.map((panel, idx) => {
                              const isCorrect = idx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    border: isCorrect ? '3px solid #22c55e' : '2px solid #93c5fd',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#ffffff',
                                    position: 'relative',
                                    boxShadow: isCorrect
                                      ? '0 4px 16px rgba(34, 197, 94, 0.2)'
                                      : '0 2px 8px rgba(147, 197, 253, 0.2)',
                                    cursor: 'pointer',
                                    minWidth: '140px'
                                  }}
                                >
                                  <div
                                    dangerouslySetInnerHTML={{ __html: panel.svg }}
                                    style={{ display: 'block' }}
                                  />
                                  {isCorrect && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                      background: '#22c55e',
                                      color: '#ffffff',
                                      borderRadius: '99px',
                                      padding: '2px 8px',
                                      fontSize: '10px',
                                      fontWeight: 800
                                    }}>
                                      ✓ Correct
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Render Text MCQ Options (hidden for visual_choice / categorization) */}
                  {evaluatedQuestion.question.type !== 'visual_choice' && evaluatedQuestion.question.type !== 'categorizationv2' && evaluatedQuestion.question.type !== 'categorization' && (
                  <div className={styles.optionsContainer}>
                    {evaluatedQuestion.question.options.map((opt, idx) => {
                      const isCorrect = idx === evaluatedQuestion.question.correctAnswerIndex;
                      const label = typeof opt === 'string' ? opt : (opt.label ?? opt.value ?? `Option ${idx + 1}`);
                      const media = getOptionMediaContent(opt);
                      const hasMedia = !!media;

                      return (
                        <div
                          key={opt.id || idx}
                          className={`${styles.optionBtn} ${isCorrect ? styles.optionBtnCorrect : ''}`}
                          style={hasMedia ? {
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            minHeight: '150px',
                            textAlign: 'center',
                            padding: '16px',
                            position: 'relative'
                          } : {}}
                        >
                          {hasMedia && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              maxHeight: '100px',
                              flex: '1 1 auto',
                              overflow: 'hidden',
                              padding: '4px'
                            }}>
                              {media.type === 'image' && (
                                <img
                                  src={media.content}
                                  alt=""
                                  style={{
                                    maxWidth: '120px',
                                    maxHeight: '90px',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                  }}
                                />
                              )}
                              {media.type === 'svg' && (
                                <div
                                  dangerouslySetInnerHTML={{ __html: cleanSvgContent(media.content) }}
                                  style={{
                                    width: '90px',
                                    height: '90px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                />
                              )}
                              {media.type === 'emoji' && (
                                <span style={{ fontSize: '48px', lineHeight: 1 }}>{media.content}</span>
                              )}
                            </div>
                          )}

                          {(!media || (label && !isInlineSvg(label) && !getImageUrlPreview(label))) ? (
                            <span style={hasMedia ? { fontSize: '14px', fontWeight: 600, color: '#334155', marginTop: '4px' } : {}}>
                              {String(label)}
                            </span>
                          ) : null}

                          {isCorrect && (
                            <span
                              className={styles.optionBadge}
                              style={hasMedia ? {
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                margin: 0
                              } : {}}
                            >
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}

                  {/* Render Explanation */}
                  <div className={styles.explanationBox}>
                    <div className={styles.explanationTitle}>Explanation (Step-by-Step)</div>
                    <div className={styles.explanationText} style={{ whiteSpace: 'pre-line' }}>
                      {(() => {
                        const expContent = evaluatedQuestion.question.explanation?.sections?.[0]?.content || '';
                        if (isInlineSvg(expContent) || expContent.includes('<')) {
                          return <div dangerouslySetInnerHTML={{ __html: expContent }} />;
                        }
                        return <p style={{ margin: 0 }}>{expContent}</p>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
              ) : (
                <div className={`${styles.statusBar} ${styles.statusError}`} style={{ marginTop: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Evaluation Error:</p>
                  <pre style={{ margin: '8px 0 0 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {evaluatedQuestion.error}
                  </pre>
                  <p style={{ fontSize: '11px', margin: '8px 0 0 0', color: '#991b1b' }}>
                    Make sure formulas refer to defined variables, mathematical expressions evaluate to integers, and there are no syntax loops.
                  </p>
                </div>
              )}

              {/* JSON code viewer */}
              <div className={styles.jsonToggleArea}>
                <button
                  type="button"
                  className={styles.jsonTitle}
                  style={{ background: 'none', border: 'none', width: '100%', textTransform: 'none' }}
                  onClick={() => setShowJson(!showJson)}
                >
                  <span>{showJson ? '▼ Hide Template JSON Recipe' : '▶ Show Template JSON Recipe'}</span>
                </button>
                
                {showJson && (
                  <pre className={styles.codeBlock}>
                    {JSON.stringify(template, null, 2)}
                  </pre>
                )}
              </div>
                  </>
                )}
              
              {currentStep === 6 && (
              <div className={styles.controlsPanel}>
                {/* Controls and Sample Set */}
                <div>
                  <div className={styles.controlSectionTitle}>Preview Controls</div>
                  <div className={styles.toggleRow}>
                    <label>Randomize Items</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.randomizeItems}
                      onClick={() => setPreviewControls(prev => ({ ...prev, randomizeItems: !prev.randomizeItems }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <label>Randomize Order</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.randomizeOrder}
                      onClick={() => setPreviewControls(prev => ({ ...prev, randomizeOrder: !prev.randomizeOrder }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <label>Show Correct Answer</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.showCorrectAnswer}
                      onClick={() => setPreviewControls(prev => ({ ...prev, showCorrectAnswer: !prev.showCorrectAnswer }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <label style={{ color: '#4f46e5', fontWeight: 600 }}>Preview as Student</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.previewAsStudent}
                      onClick={() => setPreviewControls(prev => ({ ...prev, previewAsStudent: !prev.previewAsStudent }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className={styles.controlSectionTitle}>Sample Set</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <select 
                      className={styles.select} 
                      value={sampleSet} 
                      onChange={(e) => setSampleSet(e.target.value)}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <option value="Sample Set 1">Sample Set 1</option>
                      <option value="Sample Set 2">Sample Set 2</option>
                    </select>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => setSeed(Math.floor(Math.random() * 100000).toString())}
                      style={{ padding: '0 12px', whiteSpace: 'nowrap' }}
                      title={`Current Seed: ${seed}`}
                    >
                      🎲 New Seed
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Items</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{template.parts?.[0]?.items?.length || 0}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Categories</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{template.parts?.[0]?.categories?.length || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {currentStep === 6 && (
                <div className={styles.schemaSectionCard}>
                  <div className={styles.schemaSectionHeader}>
                    <div>
                      <h3>Universal Builder Outputs</h3>
                      <p>Production artifacts emitted by this template: JSON schema, React configuration, validation rules, and preview payload.</p>
                    </div>
                  </div>
                  <div className={styles.outputGrid}>
                    <div>
                      <div className={styles.controlSectionTitle}>JSON Schema</div>
                      <pre className={styles.outputCodeBlock}>{JSON.stringify(universalPreviewPayload.jsonSchema, null, 2)}</pre>
                    </div>
                    <div>
                      <div className={styles.controlSectionTitle}>React Configuration</div>
                      <pre className={styles.outputCodeBlock}>{JSON.stringify(universalPreviewPayload.reactConfiguration, null, 2)}</pre>
                    </div>
                    <div>
                      <div className={styles.controlSectionTitle}>Validation Rules</div>
                      <pre className={styles.outputCodeBlock}>{JSON.stringify(universalPreviewPayload.validationRules, null, 2)}</pre>
                    </div>
                    <div>
                      <div className={styles.controlSectionTitle}>Preview Payload</div>
                      <pre className={styles.outputCodeBlock}>{JSON.stringify(universalPreviewPayload.previewPayload, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className={styles.variantQaPanel}>
                  <div className={styles.variantQaHeader}>
                    <div>
                      <div className={styles.controlSectionTitle}>Variant QA</div>
                      <p className={styles.variantQaDescription}>
                        Generate many seeded variants and catch duplicate options, broken answers, unresolved placeholders, and evaluation failures.
                      </p>
                    </div>
                    <div className={styles.variantQaActions}>
                      <label className={styles.variantQaCountLabel}>
                        Samples
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={qaSampleCount}
                          onChange={(event) => setQaSampleCount(event.target.value)}
                          className={styles.variantQaCountInput}
                        />
                      </label>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleRunVariantQA}
                        disabled={variantQaRunning}
                      >
                        {variantQaRunning ? 'Testing Seeds...' : `Test ${qaSampleCount || 20} Seeds`}
                      </button>
                    </div>
                  </div>

                  {variantQaReport ? (
                    <div className={styles.variantQaResults}>
                      <div className={styles.variantQaScoreCard}>
                        <div className={styles.variantQaScore}>{variantQaReport.score}%</div>
                        <div className={styles.variantQaScoreLabel}>Quality Score</div>
                      </div>
                      <div className={styles.variantQaMetric}>
                        <strong>{variantQaReport.passed}/{variantQaReport.total}</strong>
                        <span>variants passed</span>
                      </div>
                      <div className={styles.variantQaMetric}>
                        <strong>{variantQaReport.failCount}</strong>
                        <span>failures</span>
                      </div>
                      <div className={styles.variantQaMetric}>
                        <strong>{variantQaReport.warningCount}</strong>
                        <span>warnings</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.variantQaEmpty}>No QA run yet. Run QA before publishing student-facing templates.</div>
                  )}

                  {variantQaReport?.failures?.length > 0 && (
                    <div className={styles.variantQaIssueList}>
                      <div className={styles.variantQaIssueTitle}>Failures</div>
                      {variantQaReport.failures.map((item, idx) => (
                        <div key={`failure-${item.seed}-${idx}`} className={styles.variantQaIssue}>
                          <strong>Seed {item.seed}</strong>
                          <ul>
                            {item.issues.map((issue, issueIdx) => <li key={issueIdx}>{issue}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {variantQaReport?.warnings?.length > 0 && (
                    <div className={styles.variantQaIssueList}>
                      <div className={styles.variantQaIssueTitle}>Warnings</div>
                      {variantQaReport.warnings.map((item, idx) => (
                        <div key={`warning-${item.seed}-${idx}`} className={styles.variantQaIssue}>
                          <strong>Seed {item.seed}</strong>
                          <ul>
                            {item.warnings.map((warning, warningIdx) => <li key={warningIdx}>{warning}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep >= 5 && (
              <div className={styles.validationPanel}>
                {/* Validation and Status */}
                <div>
                  <div className={styles.controlSectionTitle}>Validation</div>
                  {(() => {
                    const isCategorization = template.parts?.some(p => p.type === 'categorization' || p.type === 'categorizationv2') || template.optionsType === 'categorization';
                    const checks = [
                      { label: 'Template information is complete', passed: !!(template.id && template.title) },
                      ...(isCategorization ? [
                        { label: 'At least 2 categories added', passed: (template.parts?.[0]?.categories?.length || 0) >= 2 },
                        { label: 'At least 2 items in total', passed: (template.parts?.[0]?.items?.length || 0) >= 2 },
                        { label: 'All items assigned to categories', passed: (template.parts?.[0]?.items || []).every(i => (template.parts[0].answer || template.parts[0].answerKey)?.[i.id]) }
                      ] : []),
                      { label: 'Preview generated successfully', passed: !!evaluatedQuestion?.ok },
                      ...(variantQaReport ? [
                        { label: `Variant QA passed ${variantQaReport.passed}/${variantQaReport.total} samples`, passed: variantQaReport.failCount === 0 }
                      ] : [])
                    ];

                    return checks.map((check, idx) => (
                      <div key={idx} className={styles.validationItem}>
                        <span className={styles.validationLabel}>{check.label}</span>
                        <div className={`${styles.statusIcon} ${check.passed ? styles.passed : styles.failed}`}>
                          {check.passed ? '✓' : '✗'}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                
                <div className={styles.overallStatusBox}>
                  <div className={styles.controlSectionTitle} style={{ marginBottom: 0 }}>Overall Status</div>
                  {(() => {
                    const isCategorization = template.parts?.some(p => p.type === 'categorization' || p.type === 'categorizationv2') || template.optionsType === 'categorization';
                    const allPassed = [
                      !!(template.id && template.title),
                      ...(isCategorization ? [
                        (template.parts?.[0]?.categories?.length || 0) >= 2,
                        (template.parts?.[0]?.items?.length || 0) >= 2,
                        (template.parts?.[0]?.items || []).every(i => (template.parts[0].answer || template.parts[0].answerKey)?.[i.id])
                      ] : []),
                      !!evaluatedQuestion?.ok,
                      variantQaReport ? variantQaReport.failCount === 0 : true
                    ].every(Boolean);

                    return allPassed ? (
                      <>
                        <div className={styles.badgeReady}>✓ Ready to Publish</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                          All good!<br/>Your template is ready<br/>to be published.
                        </div>
                        <div style={{ marginTop: 'auto', alignSelf: 'flex-end', fontSize: '32px' }}>🎉</div>
                      </>
                    ) : (
                      <>
                        <div className={styles.badgeNotReady}>⚠️ Not Ready</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                          Please resolve the missing validation checks to publish.
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              )}

            </div>
          </section>
        </div>
      </div>
      
      {/* Gallery Modal Dialog */}
      {showGallery && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  🖼️ Media Assets Manager
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Select one or more items to include in this question template.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Tab Header */}
              <div className={styles.galleryTabs} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <button
                  type="button"
                  className={`${styles.galleryTabBtn} ${!isWebSearch ? styles.galleryTabBtnActive : ''}`}
                  onClick={() => setIsWebSearch(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📁 Local Assets Gallery
                </button>
                <button
                  type="button"
                  className={`${styles.galleryTabBtn} ${isWebSearch ? styles.galleryTabBtnActive : ''}`}
                  onClick={() => setIsWebSearch(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🔍 Web Clipart (DuckDuckGo)
                </button>
              </div>

              {/* Local Assets Tab Contents */}
              {!isWebSearch && (
                <>
                  {/* Upload Dropzone */}
                  <div
                    className={`${styles.uploadZone} ${galleryDragOver ? styles.uploadZoneDrag : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setGalleryDragOver(true); }}
                    onDragLeave={() => setGalleryDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setGalleryDragOver(false);
                      handleGalleryUpload(e.dataTransfer.files);
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => handleGalleryUpload(e.target.files);
                      input.click();
                    }}
                  >
                    {galleryUploading ? (
                      <>
                        <div className={styles.loadingSpinner} style={{ marginBottom: '8px' }} />
                        <p className={styles.uploadZoneTitle}>Uploading image assets to Cloud Storage...</p>
                      </>
                    ) : (
                      <>
                        <p className={styles.uploadZoneTitle}>📤 Drag & drop images here, or click to upload</p>
                        <p className={styles.uploadZoneDesc}>WebP, PNG, JPG, or SVG. Direct upload to R2 bucket.</p>
                      </>
                    )}
                  </div>

                  {/* Search and Category/Tag Filters */}
                  <div className={styles.searchBarContainer} style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Search assets by name, category, or tags..."
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      style={{ flex: 1, minWidth: '240px' }}
                    />
                    {(gallerySearch || selectedCategory !== 'all' || selectedTag) && (
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnSecondary}
                        onClick={() => {
                          setGallerySearch('');
                          setSelectedCategory('all');
                          setSelectedTag(null);
                        }}
                        style={{ padding: '8px 16px', borderRadius: '8px' }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Dynamic Category Pill Bar */}
                  <div className={styles.categoryBar}>
                    {availableCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryPillActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === 'all' ? '🌐 All Categories' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Tag Chips */}
                  {popularTags.length > 0 && (
                    <div className={styles.tagChipsContainer}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
                        Popular Tags:
                      </span>
                      {popularTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          className={`${styles.tagChip} ${selectedTag === tag ? styles.tagChipActive : ''}`}
                          onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Local Grid View */}
                  {galleryLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontWeight: 600 }}>
                      <div className={styles.loadingSpinner} style={{ margin: '0 auto 12px auto' }} />
                      Loading gallery assets...
                    </div>
                  ) : galleryImages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                      No uploaded images found in the gallery. Use the dropzone above to upload new images.
                    </div>
                  ) : filteredLocalImages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                      No matching local assets found for active filters.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '12px'
                      }}
                    >
                      {filteredLocalImages.map((img) => {
                        const isSelected = selectedGalleryUrls.includes(img.url);
                        const selIdx = selectedGalleryUrls.indexOf(img.url);
                        
                        return (
                          <div
                            key={img.key}
                            style={{
                              border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: '#ffffff',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                              boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* Clickable Image Thumbnail Box */}
                            <div
                              onClick={() => handleSelectGalleryImage(img.url)}
                              className={styles.checkeredBg}
                              style={{
                                width: '100%',
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={img.url}
                                alt={img.key}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'all 0.2s ease' }}
                              />

                              {/* Hover Details Badges */}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  background: 'rgba(15, 23, 42, 0.75)',
                                  color: '#ffffff',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  fontSize: '8px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {img.dimensions ? `${img.dimensions.width}×${img.dimensions.height}` : '512×512'}
                              </div>
                            </div>

                            {/* Label, Metadata Edit and Zoom Controls */}
                            <div
                              style={{
                                padding: '8px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                background: isSelected ? '#f5f3ff' : '#ffffff'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {img.name || img.key.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ')}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                                  {img.classification?.category || 'general'}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleOpenEditMetadata(img); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                                    title="Edit Metadata (Linguistics / Tags)"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setGalleryZoomImg(img.url); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                                    title="View Full Size"
                                  >
                                    🔍
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Top Selected Badge Order */}
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#4f46e5',
                                  color: '#ffffff',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                {selIdx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Web Search Tab Contents */}
              {isWebSearch && (
                <>
                  <form onSubmit={handleWebSearch} className={styles.searchBarContainer} style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Search transparent clipart on the web (e.g. apple, dog, tree)..."
                      value={webSearchQuery}
                      onChange={(e) => setWebSearchQuery(e.target.value)}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                      className={styles.webSearchSelect}
                      value={webSearchType}
                      onChange={(e) => setWebSearchType(e.target.value)}
                    >
                      <option value="clipart">🎨 Clipart</option>
                      <option value="photo">📷 Photo</option>
                      <option value="any">🌐 Any</option>
                    </select>
                    <button
                      type="submit"
                      className={styles.btn + ' ' + styles.btnPrimary}
                      disabled={webSearching || !webSearchQuery.trim()}
                    >
                      {webSearching ? 'Searching...' : 'Search Web'}
                    </button>
                  </form>

                  {webSearching ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                      <div className={styles.loadingSpinner} />
                      <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Searching DuckDuckGo...</div>
                    </div>
                  ) : webResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
                      Enter a query above to search DuckDuckGo for clipart.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '12px'
                      }}
                    >
                      {webResults.map((item) => {
                        const localUrl = importedWebUrls[item.image];
                        const isImported = !!localUrl;
                        const isSelected = isImported && selectedGalleryUrls.includes(localUrl);
                        const selIdx = isSelected ? selectedGalleryUrls.indexOf(localUrl) : -1;
                        const isImporting = importingUrl === item.image;
                        
                        return (
                          <div
                            key={item.image}
                            onClick={() => !isImporting && handleImportWebImage(item.image)}
                            style={{
                              border: isSelected ? '2px solid #4f46e5' : isImported ? '2px solid #10b981' : '1px solid #e2e8f0',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: '#ffffff',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                              opacity: isImporting ? 0.6 : 1,
                              cursor: isImporting ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <div className={styles.checkeredBg} style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                              <img
                                src={item.thumbnail || item.image}
                                alt={item.title}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ padding: '8px', fontSize: '11px', fontWeight: 700, color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #f1f5f9' }}>
                              {item.title || 'Web Asset'}
                            </div>
                            
                            {isImporting && (
                              <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(255, 255, 255, 0.85)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                zIndex: 10
                              }}>
                                <div className={styles.loadingSpinner} />
                                <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 700, marginTop: '6px' }}>
                                  Importing...
                                </span>
                              </div>
                            )}

                            {isImported && !isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: '#10b981',
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                              }}>
                                Saved
                              </div>
                            )}

                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#4f46e5',
                                  color: '#ffffff',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                {selIdx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Selection Queue & Re-ordering panel */}
            {selectedGalleryUrls.length > 0 && (
              <div className={styles.selectedDrawer}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                    Selection Queue ({selectedGalleryUrls.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedGalleryUrls([]); setGalleryImageLabels({}); }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '10px', fontWeight: 700, color: '#ef4444', textAlign: 'left', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>

                <div className={styles.selectedItemsList}>
                  {selectedGalleryUrls.map((url, idx) => {
                    const labelVal = galleryImageLabels[url] || '';
                    return (
                      <div
                        key={url}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        <div className={styles.selectedItemThumb}>
                          <img src={url} alt="selected" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          <div
                            className={styles.selectedItemRemove}
                            onClick={() => {
                              setSelectedGalleryUrls(prev => prev.filter(u => u !== url));
                              setGalleryImageLabels(prev => {
                                const copy = { ...prev };
                                delete copy[url];
                                return copy;
                              });
                            }}
                          >
                            ✕
                          </div>
                          <div className={styles.selectedItemBadge}>{idx + 1}</div>
                        </div>

                        {/* Reordering Controls & Label input */}
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              setSelectedGalleryUrls(prev => {
                                const copy = [...prev];
                                const tmp = copy[idx - 1];
                                copy[idx - 1] = copy[idx];
                                copy[idx] = tmp;
                                return copy;
                              });
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '1px 4px', fontSize: '8px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                          >
                            ◀
                          </button>
                          <input
                            type="text"
                            value={labelVal}
                            placeholder="Label..."
                            onChange={(e) => {
                              const val = e.target.value;
                              setGalleryImageLabels(prev => ({ ...prev, [url]: val }));
                            }}
                            style={{
                              width: '50px',
                              fontSize: '8px',
                              padding: '2px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                          <button
                            type="button"
                            disabled={idx === selectedGalleryUrls.length - 1}
                            onClick={() => {
                              setSelectedGalleryUrls(prev => {
                                const copy = [...prev];
                                const tmp = copy[idx + 1];
                                copy[idx + 1] = copy[idx];
                                copy[idx] = tmp;
                                return copy;
                              });
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '1px 4px', fontSize: '8px', cursor: idx === selectedGalleryUrls.length - 1 ? 'not-allowed' : 'pointer' }}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnSecondary}
                    onClick={() => setShowGallery(false)}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnPrimary}
                    onClick={applyGallerySelection}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    Apply Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Overlay */}
      {galleryZoomImg && (
        <div
          className={styles.detailPanelOverlay}
          onClick={() => setGalleryZoomImg(null)}
          style={{ zIndex: 10001 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            <div className={styles.checkeredBg} style={{ padding: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={galleryZoomImg} alt="Zoom" style={{ maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              className={styles.btn + ' ' + styles.btnSecondary}
              onClick={() => setGalleryZoomImg(null)}
              style={{ marginTop: '12px', width: '100%' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Metadata Editor Popup Dialog */}
      {editingMetaItem && (
        <div className={styles.detailPanelOverlay} style={{ zIndex: 10002 }}>
          <div className={styles.detailPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                ✏️ Edit Image Asset Metadata
              </h4>
              <button
                type="button"
                onClick={() => setEditingMetaItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
              <div className={styles.checkeredBg} style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <img src={editingMetaItem.url} alt="editing" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                <strong>Key:</strong> {editingMetaItem.key}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Singular Word Form</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditSingular}
                placeholder="e.g. apple, frog, balloon"
                onChange={e => setMetaEditSingular(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Plural Word Form</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditPlural}
                placeholder="e.g. apples, frogs, balloons"
                onChange={e => setMetaEditPlural(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Grammar Article</label>
              <select
                className={styles.select}
                value={metaEditArticle}
                onChange={e => setMetaEditArticle(e.target.value)}
              >
                <option value="a">a (consonants, e.g. a frog)</option>
                <option value="an">an (vowels, e.g. an apple)</option>
                <option value="some">some (uncountable, e.g. some ice)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Classification Category</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditCategory}
                placeholder="e.g. food, animal, shapes, vehicles"
                onChange={e => setMetaEditCategory(e.target.value)}
                style={{ textTransform: 'lowercase' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Classification Tags (comma separated)</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditTags}
                placeholder="e.g. fruit, green, counter, flat"
                onChange={e => setMetaEditTags(e.target.value)}
                style={{ textTransform: 'lowercase' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setEditingMetaItem(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnPrimary}
                onClick={handleSaveMetadata}
                disabled={isSavingMeta}
                style={{ flex: 1 }}
              >
                {isSavingMeta ? 'Saving...' : 'Save Metadata'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em' }}>
                📖 Project Question Types & Schema Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  opacity: 0.8,
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '12px 24px 0 24px',
              gap: '8px',
              overflowX: 'auto',
            }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                { id: 'fillInTheBlank', label: 'Fill-In-The-Blank (FIB)' },
                { id: 'categorizationv2', label: 'Categorization' },
                { id: 'visual_choice', label: 'Visual Choice' },
                { id: 'covered', label: 'All Covered Types' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveGuideTab(t.id)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: activeGuideTab === t.id ? '#4f46e5' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeGuideTab === t.id ? '3px solid #4f46e5' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    paddingBottom: '12px',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: '#334155',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              {activeGuideTab === 'overview' && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>
                    Adaptive Question Templates Overview
                  </h4>
                  <p>
                    This project uses a <strong>dynamic variable-based template schema</strong> to automatically generate billions of unique educational math and English practice questions. Instead of hardcoding questions, templates define variables (e.g. integer ranges or formulas), visual layouts, and the interactive response mechanism.
                  </p>
                  <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0284c7', padding: '12px 16px', borderRadius: '8px', margin: '16px 0' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#0369a1' }}>💡 Dynamic Previews</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#0c4a6e' }}>
                      Click on any reference tab above to read details, view the JSON schema format, or <strong>instantly load that question type as an active template</strong> to test in the simulator.
                    </p>
                  </div>
                  <h5 style={{ margin: '16px 0 8px 0', color: '#1e293b', fontWeight: 700 }}>Project Core Formats:</h5>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>Multiple Choice (MCQ):</strong> Traditional choices generated from math/text variables.</li>
                    <li><strong>Fill-In-The-Blank (FIB):</strong> Text blocks with inline text input fields using double brackets `[[placeholder]]`.</li>
                    <li><strong>Categorization (Drag & Drop):</strong> Buckets with draggable cards correct-mapped via key-value mappings.</li>
                    <li><strong>Visual Choice:</strong> Clickable side-by-side SVG rendering panels (e.g. Which plate shows 5 apples?).</li>
                  </ul>
                </div>
              )}

              {activeGuideTab === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Multiple Choice (MCQ)</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[0]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load MCQ Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      MCQ questions display question text, an optional visual SVG (like spinners, jars, grids), and a shuffled list of choice buttons.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "mcq",
  "options": [
    { "label": "[Result]", "isCorrect": true },
    { "label": "[Result] + 1", "isCorrect": false }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'fillInTheBlank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Fill-In-The-Blank (FIB)</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[1]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load FIB Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      FIB formats render inline input boxes inside sentence parts. Use double-bracket placeholders like `[[ans]]` inside text parts and specify their targets in the `answer` object.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "fillInTheBlank",
  "parts": [
    { "type": "text", "content": "The sum of [A] and [B] is [[ans]]." }
  ],
  "answer": {
    "ans": "[Result]"
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'categorizationv2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Categorization / Drag & Drop</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[2]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load Categorization Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      Categorization formats render columns (categories) and an items tray. Users drag item cards into the correct category columns. Correct mappings are defined in the root `answer` object.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "categorizationv2",
  "parts": [
    {
      "type": "categorizationv2",
      "categories": [
        { "id": "even", "label": "Even" },
        { "id": "odd", "label": "Odd" }
      ],
      "items": [
        { "id": "item1", "content": "2" },
        { "id": "item2", "content": "3" }
      ]
    }
  ],
  "answer": {
    "item1": "even",
    "item2": "odd"
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'visual_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Visual Choice</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[3]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load Visual Choice Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      Visual Choice renders side-by-side panels containing dynamic SVGs (e.g. cupcakes or goldfish). One panel contains the correct target count and the other displays a distractor count. The user clicks on the correct panel to answer.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "visual_choice",
  "visuals": [
    {
      "component": "VisualChoice",
      "props": {
        "correctCount": "A",
        "itemType": "cupcake",
        "distractorMode": "auto"
      }
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'covered' && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>
                    All Question Types Covered in this Project
                  </h4>
                  <p>
                    The practice system supports various question layouts and styles. Here is a comprehensive list of all formats covered by the system and how they resolve internally:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Question Type / Alias</th>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Renderer Used</th>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Description & Features</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>mcq, multiplechoice, dynamic_pool</td>
                        <td style={{ padding: '10px' }}>MCQRenderer</td>
                        <td style={{ padding: '10px' }}>Shuffles option choices. Supports text choices and dynamic visual SVG panels.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>fillInTheBlank, fill_in_the_blank, gridArithmetic</td>
                        <td style={{ padding: '10px' }}>FillInTheBlankRenderer</td>
                        <td style={{ padding: '10px' }}>Renders inline input boxes inside text parts replacing double brackets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>categorization, categorizationv2, categorySort, sorting</td>
                        <td style={{ padding: '10px' }}>CategorizationRenderer</td>
                        <td style={{ padding: '10px' }}>Interactive columns with drag and drop zone blocks. Mapped via key-value targets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>visual_choice</td>
                        <td style={{ padding: '10px' }}>MCQRenderer (Custom layout)</td>
                        <td style={{ padding: '10px' }}>Side-by-side graphical counter cards where the panels act as response targets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>interactiveApplet, interactiveTool</td>
                        <td style={{ padding: '10px' }}>Applet/Tool Renderers</td>
                        <td style={{ padding: '10px' }}>Advanced applet modules (like counting sticks, interactive fraction pie, pizza sharing models).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setShowGuide(false)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Vocabulary Pool Modal */}
      {showCreatePoolModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  🧪 Create Vocabulary Pool
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Define a reusable options dataset for this and other templates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePoolModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                padding: '10px 24px 0 24px',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={() => setNewPoolTab('quick')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: newPoolTab === 'quick' ? '#4f46e5' : '#64748b',
                  background: 'none',
                  border: 'none',
                  borderBottom: newPoolTab === 'quick' ? '3px solid #4f46e5' : '3px solid transparent',
                  cursor: 'pointer',
                  paddingBottom: '10px'
                }}
              >
                ⚡ Quick Create
              </button>
              <button
                type="button"
                onClick={() => setNewPoolTab('json')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: newPoolTab === 'json' ? '#4f46e5' : '#64748b',
                  background: 'none',
                  border: 'none',
                  borderBottom: newPoolTab === 'json' ? '3px solid #4f46e5' : '3px solid transparent',
                  cursor: 'pointer',
                  paddingBottom: '10px'
                }}
              >
                📝 Import JSON Recipe
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1
              }}
            >
              {createPoolStatus && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: createPoolStatus.includes('Error') ? '#fef2f2' : '#f0fdf4',
                    border: createPoolStatus.includes('Error') ? '1px solid #fca5a5' : '1px solid #86efac',
                    color: createPoolStatus.includes('Error') ? '#991b1b' : '#166534',
                    marginBottom: '8px'
                  }}
                >
                  {createPoolStatus}
                </div>
              )}

              {newPoolTab === 'quick' ? (
                <>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Pool ID (Unique identifier)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. science-lkg-ukg-light-heavy"
                        value={newPoolId}
                        onChange={(e) => setNewPoolId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Subject
                      </label>
                      <select
                        value={newPoolSubject}
                        onChange={(e) => setNewPoolSubject(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          background: '#ffffff'
                        }}
                      >
                        <option value="science">Science</option>
                        <option value="math">Math</option>
                        <option value="english">English</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Topic
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. light-heavy or general"
                        value={newPoolTopic}
                        onChange={(e) => setNewPoolTopic(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Categories (comma-separated list)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. light, heavy"
                      value={newPoolCategories}
                      onChange={(e) => setNewPoolCategories(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Use lowercase letters and underscores. We will auto-convert spaces to underscores.
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Paste Pool JSON Recipe
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`{\n  "poolId": "science-lkg-ukg-shapes-pool",\n  "subject": "science",\n  "topic": "shapes",\n  "pools": {\n    "round": [\n      { "id": "circle_wheel", "label": "Wheel", "active": true }\n    ],\n    "pointed": []\n  }\n}`}
                    value={newPoolJson}
                    onChange={(e) => setNewPoolJson(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#f8fafc'
              }}
            >
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setShowCreatePoolModal(false)}
                disabled={createPoolSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnPrimary}
                onClick={handleCreateVocabularyPool}
                disabled={createPoolSaving}
              >
                {createPoolSaving ? 'Saving...' : '💾 Save Pool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Option Pool Library Modal */}
      {showPoolLibraryModal && activeLibraryPool && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '1100px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📖 Option Pool Library
                  <span style={{ fontSize: '12px', fontWeight: 500, padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '12px' }}>
                    {activeLibraryPool.poolId}
                  </span>
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search words..."
                  value={librarySearchQuery}
                  onChange={(e) => setLibrarySearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnPrimary}
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={savePoolLibrary}
                  disabled={librarySaving}
                >
                  {librarySaving ? 'Saving...' : '💾 Save Pool Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPoolLibraryModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '22px',
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Status Alert Bar */}
            {libraryStatus && (
              <div
                style={{
                  padding: '8px 24px',
                  fontSize: '12px',
                  fontWeight: 650,
                  backgroundColor: libraryStatus.includes('Error') || libraryStatus.includes('❌') ? '#fef2f2' : '#f0fdf4',
                  borderBottom: '1px solid #e2e8f0',
                  color: libraryStatus.includes('Error') || libraryStatus.includes('❌') ? '#991b1b' : '#166534'
                }}
              >
                {libraryStatus}
              </div>
            )}

            {/* Quick Actions Panel */}
            <div
              style={{
                padding: '12px 24px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              {/* Category selector and adder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Category:</span>
                <select
                  value={activeLibraryCategory}
                  onChange={(e) => setActiveLibraryCategory(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: 700
                  }}
                >
                  {Object.keys(activeLibraryPool.pools || {}).map(cat => (
                    <option key={cat} value={cat}>{cat} ({(activeLibraryPool.pools[cat] || []).length} items)</option>
                  ))}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }}>
                  <input
                    type="text"
                    placeholder="New category..."
                    value={libraryNewCategory}
                    onChange={(e) => setLibraryNewCategory(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      outline: 'none',
                      width: '120px'
                    }}
                  />
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnSecondary}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={handleLibraryAddCategory}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Bulk add words */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifySelf: 'flex-end', justifyContent: 'flex-end', maxWidth: '520px' }}>
                <input
                  type="text"
                  placeholder="Bulk add words (comma or newline separated)..."
                  value={libraryNewWords}
                  onChange={(e) => setLibraryNewWords(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLibraryAddWords(); }}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    outline: 'none',
                    flex: 1
                  }}
                />
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnPrimary}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleLibraryAddWords}
                >
                  Add Words
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div
              style={{
                flex: 1,
                padding: '24px',
                overflowY: 'auto',
                background: '#f1f5f9'
              }}
            >
              {(() => {
                const rawItems = activeLibraryPool.pools?.[activeLibraryCategory] || [];
                const filteredItems = rawItems.filter(item => {
                  if (!librarySearchQuery.trim()) return true;
                  const q = librarySearchQuery.toLowerCase();
                  return (item.label || '').toLowerCase().includes(q) || (item.id || '').toLowerCase().includes(q);
                });

                if (filteredItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: '28px' }}>📦</span>
                      <p style={{ margin: '8px 0 0 0', fontWeight: 600 }}>No items in category "{activeLibraryCategory}" matching filter.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Add some words using the text input above.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {filteredItems.map((item, idx) => {
                      const actualIdxInPool = rawItems.findIndex(x => x.id === item.id);
                      const isImageSearchActive = libraryImageSearchIndex?.cat === activeLibraryCategory && libraryImageSearchIndex?.idx === actualIdxInPool;
                      
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                          }}
                        >
                          {/* Image Box */}
                          <div
                            style={{
                              height: '110px',
                              borderRadius: '10px',
                              background: '#f8fafc',
                              border: '1px solid #f1f5f9',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            {item.imageUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.imageUrl} alt={item.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                <button
                                  type="button"
                                  onClick={() => handleLibraryUpdateField(activeLibraryCategory, actualIdxInPool, 'imageUrl', '')}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'rgba(239, 68, 68, 0.85)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '9px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '24px' }}>🖼️</span>
                                <button
                                  type="button"
                                  onClick={() => searchImageForLibraryItem(activeLibraryCategory, actualIdxInPool, item.label)}
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '10px',
                                    fontWeight: 650,
                                    cursor: 'pointer',
                                    color: '#475569'
                                  }}
                                >
                                  Search Clipart
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Image search results overlay inside the card */}
                          {isImageSearchActive && (
                            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>Select Image:</span>
                                <button type="button" onClick={() => setLibraryImageSearchIndex(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>✕</button>
                              </div>
                              {libraryImageSearching ? (
                                <span style={{ fontSize: '10px', color: '#64748b' }}>Searching...</span>
                              ) : libraryImageSearchResults.length === 0 ? (
                                <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>No cliparts found.</span>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                                  {libraryImageSearchResults.slice(0, 8).map((result, rIdx) => (
                                    <div
                                      key={rIdx}
                                      onClick={() => selectImageForLibraryItem(activeLibraryCategory, actualIdxInPool, result.image)}
                                      style={{
                                        aspectRatio: '1',
                                        borderRadius: '4px',
                                        background: '#ffffff',
                                        border: '1px solid #e2e8f0',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={result.thumbnail} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} alt="" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Label input */}
                          <div>
                            <input
                              type="text"
                              value={item.label || ''}
                              onChange={(e) => handleLibraryUpdateField(activeLibraryCategory, actualIdxInPool, 'label', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 700,
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '3px', paddingLeft: '2px' }}>
                              ID: {item.id}
                            </div>
                          </div>

                          {/* Audio File Controller */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '13px' }}>🗣️</span>
                            {item.audioUrl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const audio = new Audio(item.audioUrl);
                                    audio.play().catch(e => console.error(e));
                                  }}
                                  style={{
                                    border: 'none',
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    flex: 1
                                  }}
                                >
                                  Play Audio
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLibraryUpdateField(activeLibraryCategory, actualIdxInPool, 'audioUrl', '')}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                  title="Remove audio"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => generateTTSForLibraryItem(activeLibraryCategory, actualIdxInPool)}
                                style={{
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  fontWeight: 650,
                                  cursor: 'pointer',
                                  color: '#0284c7',
                                  flex: 1
                                }}
                              >
                                Generate Audio
                              </button>
                            )}
                          </div>

                          {/* Key Value Metadata Properties Editor */}
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>Custom Properties:</span>
                            
                            {/* Listed properties */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {Object.entries(item).map(([k, v]) => {
                                if (['id', 'label', 'active', 'audioUrl', 'imageUrl'].includes(k)) return null;
                                return (
                                  <div
                                    key={k}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '9px',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      background: '#f1f5f9',
                                      borderRadius: '4px',
                                      border: '1px solid #cbd5e1'
                                    }}
                                  >
                                    <span style={{ color: '#475569' }}>{k}:{String(v)}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleLibraryItemMetadataChange(activeLibraryCategory, actualIdxInPool, k, '')}
                                      style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '9px', padding: 0, cursor: 'pointer' }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Add property sub-form */}
                            <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                              <input
                                type="text"
                                placeholder="Key"
                                id={`new-prop-k-${item.id}`}
                                style={{ flex: 1, padding: '3px 6px', fontSize: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                              />
                              <input
                                type="text"
                                placeholder="Val"
                                id={`new-prop-v-${item.id}`}
                                style={{ flex: 1, padding: '3px 6px', fontSize: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const kInput = document.getElementById(`new-prop-k-${item.id}`);
                                  const vInput = document.getElementById(`new-prop-v-${item.id}`);
                                  if (kInput?.value && vInput?.value) {
                                    handleLibraryItemMetadataChange(activeLibraryCategory, actualIdxInPool, kInput.value, vInput.value);
                                    kInput.value = '';
                                    vInput.value = '';
                                  }
                                }}
                                style={{
                                  border: 'none',
                                  background: '#4f46e5',
                                  color: '#ffffff',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => handleLibraryRemoveItem(activeLibraryCategory, actualIdxInPool)}
                            style={{
                              border: 'none',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              borderRadius: '8px',
                              padding: '5px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              marginTop: 'auto',
                              textAlign: 'center'
                            }}
                          >
                            🗑️ Delete Word
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#f8fafc'
              }}
            >
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setShowPoolLibraryModal(false)}
              >
                Close / Exit
              </button>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnPrimary}
                onClick={savePoolLibrary}
                disabled={librarySaving}
              >
                {librarySaving ? 'Saving...' : '💾 Save Pool Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Matches property filters for dynamic vocabulary pool options
function matchesPropertyFilter(option, property, value) {
  const prop = String(property || '').trim();
  const expected = String(value || '').trim();
  if (!prop || !expected) return true;
  const actual = option?.[prop];
  if (Array.isArray(actual)) {
    return actual.map(entry => String(entry).toLowerCase()).includes(expected.toLowerCase());
  }
  return String(actual ?? '').toLowerCase() === expected.toLowerCase();
}

// Helper functions for parsing/serializing comma-separated labels and URLs
function parseList(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(item => {
    item = item.trim();
    const sepIdx = item.indexOf('::');
    if (sepIdx !== -1) {
      return {
        label: item.slice(0, sepIdx).trim(),
        value: item.slice(sepIdx + 2).trim()
      };
    }
    return {
      label: '',
      value: item
    };
  }).filter(x => x.value !== '');
}

function serializeList(list) {
  return list.map(item => {
    const label = (item.label || '').trim();
    const val = (item.value || '').trim();
    if (label) {
      return `${label}::${val}`;
    }
    return val;
  }).filter(Boolean).join(', ');
}

function cleanNameFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const parts = url.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt
    .replace(/^\d+[-_]/, '') // remove leading unix timestamps e.g. 1780656377875-
    .replace(/[-_]/g, ' ') // convert dashes/underscores to spaces
    .trim();
  return cleanName;
}

// Controlled component for editing a list of URLs and their labels
function LabelledListEditor({ value, onChange, placeholder }) {
  const items = parseList(value);

  const handleRowChange = (index, field, newVal) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newVal };
    onChange(serializeList(newItems));
  };

  const handleAddRow = () => {
    const newItems = [...items, { label: '', value: '' }];
    onChange(serializeList(newItems));
  };

  const handleRemoveRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(serializeList(newItems));
  };

  const handleAutoLabel = () => {
    const newItems = items.map(item => {
      if (item.label) return item; // keep existing label
      const val = item.value.trim();
      if (val.startsWith('http://') || val.startsWith('https://') || val.includes('/') || val.includes('.')) {
        return { ...item, label: cleanNameFromUrl(val) };
      }
      return item;
    });
    onChange(serializeList(newItems));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
      {/* Raw input for easy copy/paste */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Raw Value (comma-separated)</label>
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '6px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            resize: 'vertical',
            outline: 'none',
            background: '#ffffff'
          }}
        />
      </div>

      {/* Structured Rows */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Items & Labels ({items.length})</span>
            <button
              type="button"
              onClick={handleAutoLabel}
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Automatically generate labels from image URLs"
            >
              🪄 Auto-Label URLs
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
            {items.map((item, idx) => {
              const isUrl = typeof item.value === 'string' && (item.value.startsWith('http') || item.value.includes('/') || item.value.includes('.'));
              return (
                <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {isUrl ? (
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.value} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      📦
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      value={item.label}
                      placeholder="Label (e.g. Starfish)"
                      onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}
                    />
                    <input
                      type="text"
                      value={item.value}
                      placeholder="URL or standard item type"
                      onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        color: '#475569',
                        fontFamily: isUrl ? 'monospace' : 'inherit'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleAddRow}
        style={{
          background: '#4f46e5',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          alignSelf: 'flex-start'
        }}
      >
        ➕ Add URL / Item Row
      </button>
    </div>
  );
}
