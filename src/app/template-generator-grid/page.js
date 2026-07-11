'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const DEFAULT_COLUMNS = ['number_to_factor', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'];

const DEFAULT_ROWS = [
  {
    number_to_factor: '640',
    Result: '2 x 2 x 2 x 2 x 2 x 2 x 2 x 5',
    Distractor1: '2 x 2 x 2 x 2 x 2 x 5',
    Distractor2: '2 x 2 x 2 x 2 x 2 x 2 x 5',
    Distractor3: '2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 x 5'
  },
  {
    number_to_factor: '450',
    Result: '2 x 3 x 3 x 5 x 5',
    Distractor1: '2 x 3 x 3 x 5',
    Distractor2: '2 x 3 x 5 x 5',
    Distractor3: '2 x 2 x 3 x 3 x 5 x 5'
  },
  {
    number_to_factor: '360',
    Result: '2 x 2 x 2 x 3 x 3 x 5',
    Distractor1: '2 x 2 x 3 x 3 x 5',
    Distractor2: '2 x 2 x 2 x 3 x 5',
    Distractor3: '2 x 2 x 2 x 2 x 3 x 3 x 5'
  }
];

const GRID_PRESETS = [
  {
    id: 'prime-factorisation',
    name: '🔢 Prime Factorization (Curriculum Default)',
    title: 'Prime Factorization Grid Template',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'factorization',
    grade: '5',
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    blueprint: 'Find the prime factorization of {{number_to_factor}}.',
    solution: 'To find the prime factorization of {{number_to_factor}},\nwe divide it by prime numbers starting from the smallest prime (2) until we get 1.\n\nThe prime factorization is: {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'travel-duration',
    name: '📅 JNVST: Travel Duration Calculation',
    title: 'Travel Duration calculation',
    targetCollection: 'templates',
    selectedExamId: 'jnvst',
    jnvstSection: 'arithmetic',
    jnvstTopic: 'time-distance',
    jnvstDifficulty: 0.5,
    columns: ['start_time', 'end_time', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { start_time: '8:15 AM', end_time: '11:45 AM', Result: '3 hours 30 minutes', Distractor1: '3 hours', Distractor2: '2 hours 45 minutes', Distractor3: '4 hours' },
      { start_time: '9:30 AM', end_time: '1:15 PM', Result: '3 hours 45 minutes', Distractor1: '3 hours 15 minutes', Distractor2: '4 hours', Distractor3: '3 hours 30 minutes' },
      { start_time: '10:15 AM', end_time: '2:45 PM', Result: '4 hours 30 minutes', Distractor1: '4 hours', Distractor2: '3 hours 45 minutes', Distractor3: '5 hours' }
    ],
    blueprint: 'A train starts from Delhi at **{{start_time}}** and reaches Agra at **{{end_time}}**. Find the total time taken by the train.',
    solution: '💡 Let\'s calculate the duration:\n\n* From {{start_time}} to {{end_time}} is exactly **{{Result}}**.\n\nAdding them together gives **{{Result}}**.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'bodmas-simple',
    name: '🧮 JNVST: BODMAS Simplification Expression',
    title: 'Simple BODMAS Expression',
    targetCollection: 'templates',
    selectedExamId: 'jnvst',
    jnvstSection: 'arithmetic',
    jnvstTopic: 'simplification',
    jnvstDifficulty: 0.5,
    columns: ['expression', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { expression: '15 - (6 \\times 2) + 5', Result: '8', Distractor1: '23', Distractor2: '12', Distractor3: '6' },
      { expression: '24 - (4 \\times 3) + 8', Result: '20', Distractor1: '32', Distractor2: '16', Distractor3: '12' },
      { expression: '10 - (2 \\times 3) + 4', Result: '8', Distractor1: '12', Distractor2: '6', Distractor3: '4' }
    ],
    blueprint: 'Simplify the expression using the order of operations:\n\n$${{expression}}$$',
    solution: '💡 Using BODMAS rule:\n\n1. Solve inside parentheses first: multiplication.\n2. Add and subtract from left to right.\n\nThe final value is **{{Result}}**.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'rectangle-perimeter',
    name: '📏 JNVST: Rectangular Park Perimeter',
    title: 'Rectangular Park Perimeter',
    targetCollection: 'templates',
    selectedExamId: 'jnvst',
    jnvstSection: 'arithmetic',
    jnvstTopic: 'mensuration',
    jnvstDifficulty: 0.5,
    columns: ['length', 'width', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { length: '20', width: '15', Result: '70 meters', Distractor1: '35 meters', Distractor2: '300 meters', Distractor3: '140 meters' },
      { length: '30', width: '20', Result: '100 meters', Distractor1: '50 meters', Distractor2: '600 meters', Distractor3: '200 meters' },
      { length: '15', width: '10', Result: '50 meters', Distractor1: '25 meters', Distractor2: '150 meters', Distractor3: '100 meters' }
    ],
    blueprint: 'The length of a rectangular playground is **{{length}} meters** and its width is **{{width}} meters**. What is the perimeter of the playground?',
    solution: '💡 The formula for the perimeter of a rectangle is:\n$$\\text{Perimeter} = 2 \\times (\\text{Length} + \\text{Width})$$\n\nSubstituting the values:\n$$\\text{Perimeter} = 2 \\times ({{length}} + {{width}}) = {{Result}}.$$',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'simple-interest-calc',
    name: '💰 JNVST: Simple Interest Calculation',
    title: 'Simple Interest Basic Calculation',
    targetCollection: 'templates',
    selectedExamId: 'jnvst',
    jnvstSection: 'arithmetic',
    jnvstTopic: 'simple-interest',
    jnvstDifficulty: 0.5,
    columns: ['principal', 'rate', 'time', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { principal: '$2000', rate: '5%', time: '3', Result: '$300', Distractor1: '$100', Distractor2: '$150', Distractor3: '$200' },
      { principal: '$1000', rate: '6%', time: '2', Result: '$120', Distractor1: '$60', Distractor2: '$100', Distractor3: '$180' },
      { principal: '$5000', rate: '4%', time: '5', Result: '$1000', Distractor1: '$800', Distractor2: '$500', Distractor3: '$1200' }
    ],
    blueprint: 'Find the simple interest on a principal amount of **{{principal}}** at a rate of **{{rate}} per annum** for a time period of **{{time}} years**.',
    solution: '💡 The simple interest formula is:\n$$\\text{SI} = \\frac{P \\times R \\times T}{100}$$\n\nSubstituting the values gives the interest amount: **{{Result}}**.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'science-planets-order',
    name: '🪐 Science: Planet Order from Sun',
    title: 'Planetary Distance Order',
    targetCollection: 'dynamic_templates',
    subject: 'science',
    topic: 'planets',
    grade: '5',
    columns: ['planet', 'position', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { planet: 'Mercury', position: 'first', Result: 'first', Distractor1: 'second', Distractor2: 'third', Distractor3: 'fourth' },
      { planet: 'Venus', position: 'second', Result: 'second', Distractor1: 'first', Distractor2: 'third', Distractor3: 'fifth' },
      { planet: 'Earth', position: 'third', Result: 'third', Distractor1: 'second', Distractor2: 'fourth', Distractor3: 'first' },
      { planet: 'Mars', position: 'fourth', Result: 'fourth', Distractor1: 'third', Distractor2: 'fifth', Distractor3: 'second' }
    ],
    blueprint: 'What is the position of the planet **{{planet}}** in terms of its distance from the Sun?',
    solution: '💡 The order of planets starting from the Sun is:\n\n1. Mercury\n2. Venus\n3. Earth\n4. Mars\n\nTherefore, {{planet}} is the **{{Result}}** planet from the Sun.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'science-states-of-matter',
    name: '🌡️ Science: States of Matter (Thermometer)',
    title: 'States of Matter Temperature Test',
    targetCollection: 'dynamic_templates',
    subject: 'science',
    topic: 'states-of-matter',
    grade: '5',
    columns: ['substance', 'temp', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { substance: 'Water', temp: '-10', Result: 'solid', Distractor1: 'liquid', Distractor2: 'gas', Distractor3: 'plasma' },
      { substance: 'Water', temp: '45', Result: 'liquid', Distractor1: 'solid', Distractor2: 'gas', Distractor3: 'plasma' },
      { substance: 'Water', temp: '105', Result: 'gas', Distractor1: 'liquid', Distractor2: 'solid', Distractor3: 'plasma' }
    ],
    blueprint: 'What state of matter is the **{{substance}}** in at this temperature?\n\n{= drawThermometer(-20, 120, temp, "C") =}',
    solution: '💡 Let\'s evaluate the temperature:\n\n* At **{{temp}}°C**, water exists as a **{{Result}}** because:\n  * Below 0°C is solid (ice).\n  * Between 0°C and 100°C is liquid.\n  * Above 100°C is gas (steam).',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-place-face-value',
    name: '🏆 IMO G3: Place Value vs. Face Value',
    title: 'Place Value vs. Face Value (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['number', 'digit1', 'digit2', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { number: '8754', digit1: '7', digit2: '4', Result: '696', Distractor1: '704', Distractor2: '600', Distractor3: '740' },
      { number: '6982', digit1: '9', digit2: '2', Result: '898', Distractor1: '902', Distractor2: '800', Distractor3: '920' },
      { number: '7523', digit1: '5', digit2: '3', Result: '497', Distractor1: '503', Distractor2: '400', Distractor3: '530' }
    ],
    blueprint: 'Find the difference between the place value of {{digit1}} and the face value of {{digit2}} in the number **{{number}}**.',
    solution: 'Step 1: The place value of {{digit1}} is {{digit1}}00.\nStep 2: The face value of {{digit2}} is {{digit2}}.\nStep 3: Subtract: {{digit1}}00 - {{digit2}} = {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-write-read-numbers',
    name: '🏆 IMO G3: Read and Write 4-Digit Numbers',
    title: 'Read and Write 4-Digit Numbers (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['words', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { words: 'Seven thousand two hundred five', Result: '7205', Distractor1: '7250', Distractor2: '7025', Distractor3: '7200' },
      { words: 'Six thousand fifty-two', Result: '6052', Distractor1: '6520', Distractor2: '6025', Distractor3: '6502' },
      { words: 'Eight thousand nine hundred one', Result: '8901', Distractor1: '8910', Distractor2: '8091', Distractor3: '8900' }
    ],
    blueprint: 'Choose the numeric representation of the number: **"{{words}}"**.',
    solution: 'Step 1: Break down the word name:\n- "{{words}}" corresponds to {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-expanded-standard',
    name: '🏆 IMO G3: Expanded and Standard Form',
    title: 'Expanded and Standard Form (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['expanded', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { expanded: '5000 + 40 + 8', Result: '5048', Distractor1: '5408', Distractor2: '5480', Distractor3: '5084' },
      { expanded: '7000 + 300 + 2', Result: '7302', Distractor1: '7032', Distractor2: '7320', Distractor3: '7203' },
      { expanded: '9000 + 80', Result: '9080', Distractor1: '9800', Distractor2: '9008', Distractor3: '9808' }
    ],
    blueprint: 'Which number is represented by the expanded form: **{{expanded}}**?',
    solution: 'Step 1: Sum each place value: {{expanded}} = {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-successor-predecessor',
    name: '🏆 IMO G3: Successor, Predecessor & Comparing',
    title: 'Successor, Predecessor & Comparing (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['number', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { number: '1000', Result: '1000', Distractor1: '999', Distractor2: '1001', Distractor3: '1002' },
      { number: '4500', Result: '4500', Distractor1: '4499', Distractor2: '4501', Distractor3: '4502' }
    ],
    blueprint: 'Find the predecessor of the successor of **{{number}}**.',
    solution: 'Step 1: The successor of {{number}} is {{number}} + 1.\nStep 2: The predecessor of that is {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-building-numbers',
    name: '🏆 IMO G3: Building Greatest & Smallest Numbers',
    title: 'Building Greatest & Smallest Numbers (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['d1', 'd2', 'd3', 'd4', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { d1: '4', d2: '0', d3: '8', d4: '3', Result: '3048', Distractor1: '0348', Distractor2: '3480', Distractor3: '3840' },
      { d1: '6', d2: '1', d3: '0', d4: '9', Result: '1069', Distractor1: '0169', Distractor2: '1690', Distractor3: '1960' }
    ],
    blueprint: 'Form the smallest 4-digit number using the digits **{{d1}}, {{d2}}, {{d3}}, {{d4}}** without repetition (remember a 4-digit number cannot start with 0).',
    solution: 'Step 1: Sort digits in ascending order.\nStep 2: If 0 is present, place the next smallest digit first, then 0.\nStep 3: Smallest number is {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-rounding-off',
    name: '🏆 IMO G3: Rounding Off to Tens & Hundreds',
    title: 'Rounding Off to Tens & Hundreds (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['num1', 'num2', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { num1: '342', num2: '567', Result: '940', Distractor1: '900', Distractor2: '910', Distractor3: '950' },
      { num1: '581', num2: '234', Result: '780', Distractor1: '810', Distractor2: '700', Distractor3: '800' }
    ],
    blueprint: 'What is the sum of **{{num1}}** rounded to the nearest ten and **{{num2}}** rounded to the nearest hundred?',
    solution: 'Step 1: Round {{num1}} to the nearest ten.\nStep 2: Round {{num2}} to the nearest hundred.\nStep 3: Add them together to get {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-roman-numerals',
    name: '🏆 IMO G3: Roman Numerals up to 100',
    title: 'Roman Numerals up to 100 (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['expr', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { expr: 'XLIV + XXVI', Result: 'LXX', Distractor1: 'LXVI', Distractor2: 'LXXVI', Distractor3: 'LX' },
      { expr: 'LXII - XIV', Result: 'XLVIII', Distractor1: 'XLVII', Distractor2: 'LIII', Distractor3: 'LIV' }
    ],
    blueprint: 'Solve the expression and choose the correct Roman Numeral: **{{expr}}**',
    solution: 'Step 1: Convert to digits: XLIV + XXVI = 44 + 26 = 70.\nStep 2: Convert 70 back to Roman: {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-even-odd',
    name: '🏆 IMO G3: Even and Odd Number Rules',
    title: 'Even and Odd Number Rules (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { Result: 'Always Odd', Distractor1: 'Always Even', Distractor2: 'Can be either', Distractor3: 'Always Zero' }
    ],
    blueprint: 'If **A** is an odd number and **B** is an even number, what type of number is **(A * B) + A**?',
    solution: 'Step 1: Odd (A) * Even (B) = Even.\nStep 2: Even (A*B) + Odd (A) = Odd.\nStep 3: Result is {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  },
  {
    id: 'imo-g3-patterns-skip',
    name: '🏆 IMO G3: Number Patterns & Skip Counting',
    title: 'Number Patterns & Skip Counting (IMO G3)',
    targetCollection: 'dynamic_templates',
    subject: 'math',
    topic: 'number-sense',
    grade: '3',
    columns: ['seq1', 'seq2', 'seq3', 'seq5', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'],
    rows: [
      { seq1: '1245', seq2: '1270', seq3: '1295', seq5: '1345', Result: '1320', Distractor1: '1310', Distractor2: '1300', Distractor3: '1330' },
      { seq1: '500', seq2: '525', seq3: '550', seq5: '600', Result: '575', Distractor1: '560', Distractor2: '565', Distractor3: '580' }
    ],
    blueprint: 'Find the missing number in the sequence: **{{seq1}}, {{seq2}}, {{seq3}}, ____, {{seq5}}**.',
    solution: 'Step 1: Find difference: {{seq2}} - {{seq1}} = {{Result}}.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'Distractor1', isCorrect: false },
      { column: 'Distractor2', isCorrect: false },
      { column: 'Distractor3', isCorrect: false }
    ]
  }
];

export default function SpreadsheetTemplateCreator() {
  const blueprintRef = useRef(null);
  const solutionRef = useRef(null);

  const [activeField, setActiveField] = useState(null);

  // Grid Configuration States
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [newColumnName, setNewColumnName] = useState('');
  const [rows, setRows] = useState(DEFAULT_ROWS);

  // Template blueprints
  const [blueprint, setBlueprint] = useState('Find the prime factorization of {{number_to_factor}}.');
  const [solution, setSolution] = useState(
    'To find the prime factorization of {{number_to_factor}},\nwe divide it by prime numbers starting from the smallest prime (2) until we get 1.\n\nThe prime factorization is: {{Result}}.'
  );
  
  // MCQ Options binding maps
  const [optionsBinding, setOptionsBinding] = useState([
    { column: 'Result', isCorrect: true },
    { column: 'Distractor1', isCorrect: false },
    { column: 'Distractor2', isCorrect: false },
    { column: 'Distractor3', isCorrect: false }
  ]);

  // Target collection & Cataloging metadata
  const [title, setTitle] = useState('Prime Factorization Grid Template');
  const [subject, setSubject] = useState('math');
  const [topic, setTopic] = useState('factorization');
  const [grade, setGrade] = useState('5');
  const [targetCollection, setTargetCollection] = useState('dynamic_templates');
  const [selectedExamId, setSelectedExamId] = useState('jnvst');
  const [jnvstSection, setJnvstSection] = useState('arithmetic');
  const [jnvstTopic, setJnvstTopic] = useState('simplification');
  const [jnvstDifficulty, setJnvstDifficulty] = useState(0.5);

  // Simulator Shuffle state
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [shuffleClass, setShuffleClass] = useState('');

  // Compiler output state
  const [jsonText, setJsonText] = useState('');
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);

  // Save/Publish status states
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [linkToQuestionId, setLinkToQuestionId] = useState(null);

  // Handle cell edit changes
  const handleCellChange = (rowIndex, colName, value) => {
    setRows(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        return { ...row, [colName]: value };
      }
      return row;
    }));
  };

  // Add column
  const handleAddColumn = () => {
    const clean = newColumnName.trim().replace(/[^a-zA-Z0-9_]+/g, '');
    if (!clean) return;
    if (columns.includes(clean)) {
      alert('Column name already exists!');
      return;
    }
    setColumns([...columns, clean]);
    setNewColumnName('');
    setRows(prev => prev.map(row => ({ ...row, [clean]: '' })));
  };

  // Delete column
  const handleDeleteColumn = (colName) => {
    if (columns.length <= 1) {
      alert('You must have at least one column!');
      return;
    }
    if (confirm(`Are you sure you want to delete column "${colName}"?`)) {
      setColumns(prev => prev.filter(c => c !== colName));
      setRows(prev => prev.map(row => {
        const copy = { ...row };
        delete copy[colName];
        return copy;
      }));
      // Remove options bindings pointing to this column
      setOptionsBinding(prev => prev.map(opt => {
        if (opt.column === colName) {
          return { ...opt, column: '' };
        }
        return opt;
      }));
    }
  };

  // Add Row
  const handleAddRow = () => {
    const newRow = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setRows([...rows, newRow]);
  };

  // Delete Row
  const handleDeleteRow = (idx) => {
    if (rows.length <= 1) {
      alert('You must have at least one row!');
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== idx));
    if (activeRowIndex >= rows.length - 1) {
      setActiveRowIndex(0);
    }
  };

  // Shuffle Simulator
  const handleShuffle = () => {
    setShuffleClass('shuffling');
    setTimeout(() => setShuffleClass(''), 450);
    
    if (rows.length > 0) {
      const idx = Math.floor(Math.random() * rows.length);
      setActiveRowIndex(idx);
    }
  };

  // Substitute variables for simulation preview
  const getEvaluatedText = (templateText) => {
    if (!templateText) return '';
    const currentRow = rows[activeRowIndex] || {};
    let result = templateText;

    columns.forEach(col => {
      const val = currentRow[col] !== undefined ? String(currentRow[col]) : '';
      const regex = new RegExp(`\\{\\{\\s*${col}\\s*\\}\\}`, 'g');
      result = result.replace(regex, val);
    });

    return result;
  };

  const renderEvaluatedText = (templateText) => {
    return renderMathText(getEvaluatedText(templateText));
  };

  const renderMathText = (text) => {
    if (!text) return '';
    const regex = /(\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\\\$[^$]*?\\\$|\$[^\$]+\$)/g;
    const parts = String(text).split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <div key={index} style={{ color: '#dc2626' }}>{part}</div>;
        }
      }
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={index} style={{ color: '#dc2626' }}>{part}</span>;
        }
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={index} style={{ color: '#dc2626' }}>{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Load AI template from localStorage on mount if it exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loader = localStorage.getItem('klasschamp_grid_loader');
      if (loader) {
        try {
          const preset = JSON.parse(loader);
          if (preset) {
            setTitle(preset.title || 'AI Generated Grid Template');
            setTargetCollection(preset.targetCollection || 'templates');
            if (preset.targetCollection === 'templates') {
              setSelectedExamId(preset.selectedExamId || 'jnvst');
              setJnvstSection(preset.jnvstSection || 'arithmetic');
              setJnvstTopic(preset.topic || preset.jnvstTopic || 'general');
              if (preset.jnvstDifficulty !== undefined) setJnvstDifficulty(preset.jnvstDifficulty);
            } else {
              setSubject(preset.subject || 'math');
              setTopic(preset.topic || 'general');
              setGrade(preset.grade || '5');
            }
            setColumns(preset.columns || DEFAULT_COLUMNS);
            setRows(preset.rows || DEFAULT_ROWS);
            setBlueprint(preset.blueprint || '');
            setSolution(preset.solution || '');
            setOptionsBinding(preset.optionsBinding || []);
            setActiveRowIndex(0);
            if (preset.linkToQuestionId) {
              setLinkToQuestionId(preset.linkToQuestionId);
            }
            localStorage.removeItem('klasschamp_grid_loader');
          }
        } catch (e) {
          console.error('Failed to parse grid loader template:', e);
        }
      }
    }
  }, []);

  // Compile to JSON
  useEffect(() => {
    const templateId = 'template-' + String(title || 'custom').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const cleanBlueprint = blueprint.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
    const cleanSolution = solution.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');

    // Create parallel array values
    const parallelVariables = {};
    columns.forEach(col => {
      parallelVariables[col] = rows.map(r => {
        const cell = String(r[col] || '').trim();
        return Number.isFinite(Number(cell)) && cell !== '' ? Number(cell) : cell;
      });
    });

    // Create the index range array
    const indicesPool = Array.from({ length: rows.length }, (_, i) => i);

    if (targetCollection === 'templates') {
      // JNVST JSON format mapping
      const compiledVariables = {
        index: indicesPool
      };

      const compiledDerivations = {};
      columns.forEach(col => {
        const listStr = JSON.stringify(parallelVariables[col]);
        compiledDerivations[col] = `${listStr}[index]`;
      });

      const optionsList = optionsBinding.map(opt => ({
        label: `[${opt.column}]`,
        isCorrect: opt.isCorrect
      }));

      const difficultyLevel = jnvstDifficulty < 0.4 ? 'easy' : (jnvstDifficulty >= 0.7 ? 'hard' : 'medium');

      const compiledJson = {
        id: templateId,
        _id: templateId,
        name: title || 'Custom Grid JNVST Template',
        type: 'parameterized',
        examId: selectedExamId,
        section: jnvstSection,
        topic: jnvstTopic,
        difficulty: Number(jnvstDifficulty),
        status: 'active',
        config: {
          name: title || 'Custom Grid JNVST Template',
          title: title || 'Custom Grid JNVST Template',
          description: 'Generated via Grid Authoring Mode',
          grade: '',
          skillId: '',
          competencyId: '',
          difficultyLevel: difficultyLevel,
          tags: [jnvstTopic],
          constraints: {
            uniqueOptions: true,
            preventDuplicateWords: true,
            minOptionCount: 4,
            maxOptionCount: 4
          },
          layoutConfig: {
            mode: 'prompt_top',
            responsiveTarget: 'desktop_first',
            clickToSubmit: false
          },
          interaction: {
            engine: 'mcq',
            inputMode: 'choice'
          },
          variables: compiledVariables,
          derivations: compiledDerivations,
          options: optionsList,
          questionTemplate: cleanBlueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]').replace(/______/g, '[]'),
          explanationTemplate: cleanSolution.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
        }
      };

      setJsonText(JSON.stringify(compiledJson, null, 2));
    } else {
      // Universal/Curriculum JSON format mapping
      const compiledVariables = [
        {
          name: 'index',
          type: 'array',
          values: indicesPool
        }
      ];

      columns.forEach(col => {
        compiledVariables.push({
          name: col,
          type: 'expression',
          formula: `${JSON.stringify(parallelVariables[col])}[index]`
        });
      });

      const optionsList = optionsBinding.map(opt => ({
        label: `[${opt.column}]`,
        isCorrect: opt.isCorrect
      }));

      const correctOpt = optionsBinding.find(o => o.isCorrect);

      const compiledJson = {
        id: templateId,
        title: title || 'Custom Grid Template',
        subject: subject,
        topic: topic,
        grade: grade,
        optionsType: 'mcq',
        interaction: { engine: 'mcq', inputMode: 'choice' },
        questionText: cleanBlueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]'),
        explanation: {
          sections: [{
            type: 'text',
            content: cleanSolution.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
          }]
        },
        options: optionsList,
        validationRules: [{
          type: 'exact_match',
          target: 'answer',
          value: correctOpt ? `[${correctOpt.column}]` : ''
        }],
        variables: compiledVariables
      };

      setJsonText(JSON.stringify(compiledJson, null, 2));
    }
  }, [columns, rows, blueprint, solution, optionsBinding, title, subject, topic, grade, targetCollection, selectedExamId, jnvstSection, jnvstTopic, jnvstDifficulty]);

  // Load JSON
  const handleLoadJson = () => {
    setPublishError(null);
    setPublishStatus(null);
    try {
      const parsed = JSON.parse(jsonText);
      const config = parsed.config || parsed;
      if (config.title) setTitle(config.title);
      if (config.subject) setSubject(config.subject);
      if (config.topic) setTopic(config.topic);
      if (config.grade) setGrade(config.grade);

      const vars = config.variables || {};
      let size = 1;
      let colData = {};

      if (Array.isArray(vars)) {
        // Curriculum Mode JSON load
        const idxVar = vars.find(v => v.name === 'index');
        if (idxVar && Array.isArray(idxVar.values)) {
          size = idxVar.values.length;
        }
        vars.forEach(v => {
          if (v.name !== 'index' && v.formula) {
            const arrMatch = v.formula.match(/^(\[.*?\])\[index\]$/);
            if (arrMatch) {
              try {
                colData[v.name] = JSON.parse(arrMatch[1]);
              } catch {}
            }
          }
        });
      } else {
        // JNVST Mode JSON load
        if (Array.isArray(vars.index)) {
          size = vars.index.length;
        }
        const derivations = config.derivations || {};
        Object.keys(derivations).forEach(k => {
          const arrMatch = derivations[k].match(/^(\[.*?\])\[index\]$/);
          if (arrMatch) {
            try {
              colData[k] = JSON.parse(arrMatch[1]);
            } catch {}
          }
        });
      }

      const activeCols = Object.keys(colData);
      if (activeCols.length > 0) {
        setColumns(activeCols);
        const compiledRows = [];
        for (let r = 0; r < size; r++) {
          const rowObj = {};
          activeCols.forEach(col => {
            rowObj[col] = colData[col][r] !== undefined ? String(colData[col][r]) : '';
          });
          compiledRows.push(rowObj);
        }
        setRows(compiledRows);
      }

      let qTemplate = config.questionTemplate || parsed.questionText || '';
      let sTemplate = config.explanationTemplate || config.explanation?.sections?.[0]?.content || '';
      qTemplate = qTemplate.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');
      sTemplate = sTemplate.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');
      setBlueprint(qTemplate);
      setSolution(sTemplate);

      const rawOpts = config.options || parsed.options;
      if (Array.isArray(rawOpts)) {
        const mapped = rawOpts.map(opt => {
          const colName = String(opt.label || '').replace(/[\[\]]/g, '');
          return {
            column: colName,
            isCorrect: opt.isCorrect
          };
        });
        setOptionsBinding(mapped);
      }

      setPublishStatus({ id: parsed.id || 'loaded', mode: 'loaded' });
    } catch (err) {
      setPublishError('Load failed: ' + err.message);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishStatus(null);
    try {
      const parsed = JSON.parse(jsonText);
      const payload = {
        template: parsed,
        linkToQuestionId: linkToQuestionId
      };
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus({ id: parsed.id || data.id, mode: 'saved' });
      } else {
        setPublishError(data.error || 'Failed to save template to database.');
      }
    } catch (err) {
      setPublishError(err.message || 'API call failed.');
    } finally {
      setPublishing(false);
    }
  };

  const LatexToolbar = ({ activeField }) => {
    const insertLatex = (type) => {
      if (!activeField || !activeField.element) return;
      const textarea = activeField.element;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value || '';
      const selectedText = value.substring(start, end);

      let textToInsert = '';
      switch (type) {
        case 'inline': textToInsert = `\\(${selectedText || 'math'}\\)`; break;
        case 'block': textToInsert = `\\[\n${selectedText || 'math'}\n\\]`; break;
        case 'frac': textToInsert = `\\frac{ ${selectedText || 'a'} }{ b }`; break;
        case 'mixfrac': textToInsert = `a\\frac{ b }{ c }`; break;
        case 'paren': textToInsert = `\\left( ${selectedText || 'x'} \\right)`; break;
        case 'sqrt': textToInsert = `\\sqrt{ ${selectedText || 'x'} }`; break;
        case 'mult': textToInsert = `\\times`; break;
        case 'div': textToInsert = `\\div`; break;
        case 'degree': textToInsert = `^{\\circ}`; break;
        case 'pi': textToInsert = `\\pi`; break;
        default: textToInsert = type;
      }

      const newValue = value.substring(0, start) + textToInsert + value.substring(end);
      textarea.value = newValue;
      activeField.onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    };

    const isEnabled = activeField !== null;
    const colors = isEnabled 
      ? { bg: '#1e1b4b', border: '#3730a3', btnBg: '#6366f1', btnText: '#fff' }
      : { bg: '#111827', border: '#1f2937', btnBg: '#374151', btnText: '#64748b' };

    const buttons = [
      { label: 'Inline \\(...\\)', type: 'inline' },
      { label: 'Block \\[...\\]', type: 'block' },
      { label: 'Fraction \\frac{a}{b}', type: 'frac' },
      { label: 'Mixed Fraction', type: 'mixfrac' },
      { label: '(...) Parentheses', type: 'paren' },
      { label: 'Square Root \\sqrt{x}', type: 'sqrt' },
      { label: '× (Multiply)', type: 'mult' },
      { label: '÷ (Divide)', type: 'div' },
      { label: 'π (Pi)', type: 'pi' },
      { label: '° (Degree)', type: 'degree' }
    ];

    return (
      <div style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isEnabled ? '#a5b4fc' : '#64748b', textTransform: 'uppercase', marginRight: '6px' }}>
          ∑ LaTeX Insert {isEnabled ? `(Editing: ${activeField.label || 'Active Field'})` : '(Click a text field to activate)'}:
        </span>
        {buttons.map((btn, i) => (
          <button
            key={i}
            disabled={!isEnabled}
            onClick={() => insertLatex(btn.type)}
            style={{
              background: colors.btnBg,
              color: colors.btnText,
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: isEnabled ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
              outline: 'none',
              opacity: isEnabled ? 1 : 0.6
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="grid-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        .grid-page {
          min-height: 100vh;
          background: #0b0f19;
          font-family: 'Outfit', sans-serif;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
        }

        .grid-top-bar {
          background: #111827;
          border-bottom: 1.5px solid #1f2937;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .grid-top-brand {
          font-size: 1.2rem;
          font-weight: 800;
          color: #10b981;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .grid-top-brand span {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .grid-workspace {
          display: grid;
          grid-template-columns: 1fr 400px;
          min-height: calc(100vh - 64px);
        }
        @media (max-width: 1024px) {
          .grid-workspace {
            grid-template-columns: 1fr;
          }
        }

        .grid-editor-panel {
          padding: 32px 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .grid-preview-panel {
          background: #0f172a;
          border-left: 1.5px solid #1e293b;
          padding: 32px 24px;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .grid-card {
          background: #111827;
          border: 1.5px solid #1f2937;
          border-radius: 20px;
          padding: 24px;
        }
        .grid-card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .grid-card-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        /* Interactive Spreadsheet CSS */
        .spreadsheet-container {
          overflow-x: auto;
          border: 1.5px solid #1f2937;
          border-radius: 12px;
          background: #0b0f19;
          margin-bottom: 16px;
        }
        .spreadsheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .spreadsheet-th {
          background: #111827;
          border-bottom: 2px solid #1f2937;
          border-right: 1px solid #1f2937;
          padding: 10px 14px;
          color: #94a3b8;
          font-weight: 800;
          text-align: left;
          position: relative;
        }
        .spreadsheet-th-delete {
          position: absolute;
          right: 6px;
          top: 8px;
          color: #ef4444;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.78rem;
          opacity: 0.6;
        }
        .spreadsheet-th-delete:hover {
          opacity: 1;
        }
        .spreadsheet-td {
          border-bottom: 1px solid #1f2937;
          border-right: 1px solid #1f2937;
          padding: 0;
          background: transparent;
        }
        .spreadsheet-row:nth-child(even) .spreadsheet-td {
          background: #0f172a;
        }
        .spreadsheet-input {
          width: 100%;
          border: none;
          background: transparent;
          color: #f1f5f9;
          padding: 10px 14px;
          font-family: inherit;
          font-size: 0.88rem;
          outline: none;
          box-sizing: border-box;
        }
        .spreadsheet-input:focus {
          background: rgba(16, 185, 129, 0.08);
          box-shadow: inset 0 0 0 1px #10b981;
        }
        .spreadsheet-btn-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .grid-textarea {
          width: 100%;
          min-height: 100px;
          background: #0b0f19;
          border: 1.5px solid #1f2937;
          border-radius: 12px;
          color: #f1f5f9;
          padding: 14px;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
          line-height: 1.5;
          transition: border-color 0.15s;
        }
        .grid-textarea:focus {
          border-color: #10b981;
        }
        .grid-input {
          background: #0b0f19;
          border: 1.5px solid #1f2937;
          border-radius: 8px;
          color: #f1f5f9;
          padding: 10px 14px;
          outline: none;
          font-family: inherit;
          font-size: 0.92rem;
          width: 100%;
          box-sizing: border-box;
        }
        .grid-input:focus {
          border-color: #10b981;
        }
        .grid-select {
          background: #0b0f19;
          border: 1.5px solid #1f2937;
          border-radius: 8px;
          color: #f1f5f9;
          padding: 10px 14px;
          outline: none;
          font-family: inherit;
          font-size: 0.92rem;
          width: 100%;
          cursor: pointer;
        }

        .grid-btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .grid-btn-primary:hover {
          opacity: 0.95;
        }
        .grid-btn-secondary {
          background: #1f2937;
          color: #d1d5db;
          border: 1.5px solid #374151;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .grid-preview-box {
          background: #111827;
          border: 1.5px solid #1f2937;
          border-radius: 18px;
          padding: 20px;
          min-height: 180px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .grid-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .grid-preview-header-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .grid-shuffle-btn {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1.5px solid rgba(16, 185, 129, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .grid-shuffle-btn:hover {
          background: rgba(16, 185, 129, 0.2);
        }
      ` }} />

      {/* Header bar */}
      <div className="grid-top-bar">
        <Link href="/admin-v2" className="grid-top-brand">
          🟢 KlassChamp Spreadsheet Editor
          <span>Grid Mode v1.0</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/template-generator-v2" className="grid-shuffle-btn" style={{ textDecoration: 'none' }}>
            🔙 Back to IDE
          </Link>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid-workspace">
        
        {/* Left Side: Column Editor Workspace */}
        <div className="grid-editor-panel">
          
          <LatexToolbar activeField={activeField} />

          {/* Load Preset Selector Card */}
          <div className="grid-card" style={{ marginBottom: '20px', border: '1.5px solid #4f46e5', background: 'linear-gradient(135deg, #1e1b4b 0%, #111827 100%)' }}>
            <h3 className="grid-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Load Preset Blueprint
            </h3>
            <p className="grid-card-desc">Quickly populate the grid spreadsheet with preconfigured examples for competitive exams or curriculum practice.</p>
            <select
              className="grid-select"
              style={{ width: '100%', padding: '10px', fontSize: '14px', background: '#0f172a', borderColor: '#4f46e5' }}
              onChange={(e) => {
                const presetId = e.target.value;
                const preset = GRID_PRESETS.find(p => p.id === presetId);
                if (preset) {
                  setTitle(preset.title);
                  setTargetCollection(preset.targetCollection);
                  if (preset.targetCollection === 'templates') {
                    setSelectedExamId(preset.selectedExamId || 'jnvst');
                    setJnvstSection(preset.jnvstSection || 'arithmetic');
                    setJnvstTopic(preset.jnvstTopic || 'simplification');
                    if (preset.jnvstDifficulty !== undefined) setJnvstDifficulty(preset.jnvstDifficulty);
                  } else {
                    setSubject(preset.subject || 'math');
                    setTopic(preset.topic || 'general');
                    setGrade(preset.grade || '5');
                  }
                  setColumns(preset.columns);
                  setRows(preset.rows);
                  setBlueprint(preset.blueprint);
                  setSolution(preset.solution);
                  setOptionsBinding(preset.optionsBinding);
                  setActiveRowIndex(0);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>✨ Select a preset to load...</option>
              {GRID_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
          </div>

          {/* Setup Metadata Card */}
          <div className="grid-card">
            <h3 className="grid-card-title">📖 Template Metadata</h3>
            <p className="grid-card-desc">Provide general metadata to catalog this dynamic template correctly in the curriculum system.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="mc-dev-label">Template Title</label>
                <input className="grid-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="mc-dev-label">Target Database Mode</label>
                <select className="grid-select" value={targetCollection} onChange={(e) => setTargetCollection(e.target.value)}>
                  <option value="dynamic_templates">Curriculum Dynamic Templates</option>
                  <option value="templates">Competitive Exams Templates (JNVST/SSC)</option>
                </select>
              </div>
            </div>

            {targetCollection === 'templates' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="mc-dev-label">Exam Catalog</label>
                  <select className="grid-select" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
                    <option value="jnvst">Jawahar Navodaya (JNVST)</option>
                    <option value="ssc">Staff Selection (SSC)</option>
                  </select>
                </div>
                <div>
                  <label className="mc-dev-label">Section</label>
                  <select className="grid-select" value={jnvstSection} onChange={(e) => setJnvstSection(e.target.value)}>
                    <option value="arithmetic">Arithmetic</option>
                    <option value="mat">Mental Ability (MAT)</option>
                  </select>
                </div>
                <div>
                  <label className="mc-dev-label">Topic</label>
                  <input className="grid-input" value={jnvstTopic} onChange={(e) => setJnvstTopic(e.target.value)} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="mc-dev-label">Subject</label>
                  <input className="grid-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="mc-dev-label">Topic</label>
                  <input className="grid-input" value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>
                <div>
                  <label className="mc-dev-label">Target Grade</label>
                  <input className="grid-input" value={grade} onChange={(e) => setGrade(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Spreadsheet Grid Card */}
          <div className="grid-card">
            <h3 className="grid-card-title">📊 Dynamic Parameter Spreadsheet</h3>
            <p className="grid-card-desc">Define columns as placeholder variables, and fill out rows with parallel values. commas in cells are supported as plain text.</p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
              <input
                className="grid-input"
                style={{ maxWidth: '240px' }}
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="e.g. synonym or fruit_count"
              />
              <button className="grid-btn-secondary" onClick={handleAddColumn}>➕ Add Column</button>
            </div>

            <div className="spreadsheet-container">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th className="spreadsheet-th" style={{ width: '60px' }}>Row</th>
                    {columns.map(col => (
                      <th key={col} className="spreadsheet-th">
                        {col}
                        <button className="spreadsheet-th-delete" onClick={() => handleDeleteColumn(col)}>×</button>
                      </th>
                    ))}
                    <th className="spreadsheet-th" style={{ width: '60px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="spreadsheet-row" style={rIdx === activeRowIndex ? { background: 'rgba(16, 185, 129, 0.08)' } : {}}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 'bold', borderRight: '1px solid #1f2937', borderBottom: '1px solid #1f2937' }}>
                        {rIdx + 1}
                      </td>
                      {columns.map(col => (
                        <td key={col} className="spreadsheet-td">
                          <input
                            className="spreadsheet-input"
                            value={row[col] || ''}
                            onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', borderBottom: '1px solid #1f2937' }}>
                        <button style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleDeleteRow(rIdx)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="spreadsheet-btn-row">
              <button className="grid-btn-primary" onClick={handleAddRow}>➕ Add Row Variant</button>
              <button className="grid-btn-secondary" onClick={() => setRows([rows[0]])}>🧹 Clear rows</button>
            </div>
          </div>

          {/* Question & Solution Blueprints Card */}
          <div className="grid-card">
            <h3 className="grid-card-title">✏️ Step 2: Write Question & Solution Template</h3>
            <p className="grid-card-desc">Reference your spreadsheet headers as placeholders using <code>{"{{column_name}}"}</code>.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="mc-dev-label">Question Template</label>
                <textarea
                  ref={blueprintRef}
                  className="grid-textarea"
                  value={blueprint}
                  onChange={(e) => setBlueprint(e.target.value)}
                  onFocus={(e) => setActiveField({ label: 'Question Template', element: e.target, onChange: setBlueprint })}
                  placeholder="e.g. Find the prime factorization of {{number_to_factor}}."
                />
              </div>

              <div>
                <label className="mc-dev-label">Step-by-Step Solution Template</label>
                <textarea
                  ref={solutionRef}
                  className="grid-textarea"
                  style={{ minHeight: '140px' }}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  onFocus={(e) => setActiveField({ label: 'Solution Steps', element: e.target, onChange: setSolution })}
                  placeholder="Step 1: Divide by 2..."
                />
              </div>
            </div>
          </div>

          {/* Option Choices Bindings Card */}
          <div className="grid-card">
            <h3 className="grid-card-title">📝 Step 3: Map Answer Choices to Columns</h3>
            <p className="grid-card-desc">Assign correct answers and distractor options directly to columns in your spreadsheet.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {optionsBinding.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', width: '120px', fontWeight: 'bold', color: opt.isCorrect ? '#10b981' : '#94a3b8' }}>
                    {opt.isCorrect ? '✅ Correct Choice' : `❌ Distractor ${idx}`}
                  </span>
                  <select
                    className="grid-select"
                    style={{ maxWidth: '280px' }}
                    value={opt.column}
                    onChange={(e) => {
                      const copy = [...optionsBinding];
                      copy[idx].column = e.target.value;
                      setOptionsBinding(copy);
                    }}
                  >
                    <option value="" disabled>-- Select Column --</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Publish checklist card */}
          <div className="grid-card">
            <h3 className="grid-card-title">🚀 Step 4: Publish Template Live</h3>
            <p className="grid-card-desc">Review database mappings and target sections before publishing the template live.</p>

            {linkToQuestionId && (
              <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '6px', fontSize: '0.85rem', color: '#a5b4fc', display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                <span>🔗</span> <strong>Linked to original question:</strong> <code style={{ color: '#ffffff', background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px' }}>{linkToQuestionId}</code> (This template will automatically bind as its dynamic drill)
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className="grid-btn-primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? 'Publishing live...' : '🚀 Publish Template Live'}
              </button>
              {publishStatus && (
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.88rem' }}>
                  ✅ Published Successfully! ID: {publishStatus.id}
                </span>
              )}
            </div>
            {publishError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '12px' }}>
                ⚠️ Error: {publishError}
              </div>
            )}
          </div>

          {/* Developer JSON drawer */}
          <div style={{ marginTop: '24px', borderTop: '1.5px solid #1f2937', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#94a3b8' }}>🔧 Developer JSON Mode</span>
              <input
                type="checkbox"
                checked={isDevModeOpen}
                onChange={(e) => setIsDevModeOpen(e.target.checked)}
              />
            </div>
            
            {isDevModeOpen && (
              <div style={{ background: '#111827', padding: '16px', borderRadius: '12px', border: '1.5px solid #1f2937' }}>
                <textarea
                  className="grid-textarea"
                  style={{ fontFamily: 'Courier, monospace', fontSize: '0.82rem', minHeight: '260px' }}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button className="grid-btn-secondary" onClick={handleLoadJson}>📥 Parse & Load JSON</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Sticky Simulator Preview panel */}
        <div className="grid-preview-panel">
          <div className="grid-preview-box">
            <div className="grid-preview-header">
              <span className="grid-preview-header-title">Live Row Simulator (Active: Row {activeRowIndex + 1})</span>
              <button className={`grid-shuffle-btn ${shuffleClass}`} onClick={handleShuffle}>
                🎲 Shuffle Row
              </button>
            </div>

            {/* Render Blueprint text */}
            <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#f1f5f9', whiteSpace: 'pre-line' }}>
              {renderEvaluatedText(blueprint)}
            </div>

            {/* Render MCQ Option choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              {optionsBinding.map((opt, idx) => {
                const row = rows[activeRowIndex] || {};
                const cellVal = row[opt.column] || `{{${opt.column || 'Select Column'}}}`;
                return (
                  <div key={idx} style={{
                    background: '#1e293b',
                    border: opt.isCorrect ? '2px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #334155',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    color: '#e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{renderMathText(cellVal)}</span>
                    {opt.isCorrect && <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.78rem' }}>CORRECT ANSWER</span>}
                  </div>
                );
              })}
            </div>

            {/* Render Explanation Solution */}
            {solution.trim() && (
              <div style={{ marginTop: '28px', background: 'rgba(16, 185, 129, 0.05)', border: '1.5px dashed rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>🎒 Step-by-step Solution</div>
                <div style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {renderEvaluatedText(solution)}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ background: '#111827', border: '1.5px solid #1f2937', padding: '16px', borderRadius: '16px', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>ℹ️ Parallel Array Compilation</div>
            <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>
              This editor automatically compiles your rows into parallel list arrays (<code>[val1, val2, ...][index]</code>) mapped to a single synchronized <code>index</code> variable.
            </p>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', lineHeight: 1.5 }}>
              This guarantees that the platform's execution engine shuffles cell values synchronously, with <strong>zero dynamic formula errors</strong>!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
