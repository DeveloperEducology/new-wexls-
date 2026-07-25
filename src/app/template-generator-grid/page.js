'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import GridHeaderBar from '@/components/admin/grid/GridHeaderBar';
import SpreadsheetGrid from '@/components/admin/grid/SpreadsheetGrid';
import OptionBindingEditor from '@/components/admin/grid/OptionBindingEditor';
import LiveRowSimulator from '@/components/admin/grid/LiveRowSimulator';
import PartsArrayBuilder from '@/components/admin/grid/PartsArrayBuilder';
import { findAudioColumn, findImageColumn, findTextColumn, findPatternColumn, findWordColumn } from '@/lib/grid/gridColumnUtils';
import { parseCsvText } from '@/lib/grid/services/csvService';
import { useGridEditorStore } from '@/lib/grid/useGridEditorStore';

const DEFAULT_COLUMNS = ['number_to_factor', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'];

// Difficulty level config
const LEVEL_CONFIG = {
  l1: { label: 'L1', long: 'Easy',      emoji: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.25)', pill: '#064e3b' },
  l2: { label: 'L2', long: 'Medium',    emoji: '🟠', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.25)',  pill: '#78350f' },
  l3: { label: 'L3', long: 'Hard',      emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.25)',   pill: '#7f1d1d' },
  l4: { label: 'L4', long: 'Challenge', emoji: '🔥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.25)', pill: '#4c1d95' },
};
const LEVEL_CYCLE = ['l1', 'l2', 'l3', 'l4'];

const DEFAULT_ROWS = [
  {
    _level: 'l1',
    number_to_factor: '640',
    Result: '2 x 2 x 2 x 2 x 2 x 2 x 2 x 5',
    Distractor1: '2 x 2 x 2 x 2 x 2 x 5',
    Distractor2: '2 x 2 x 2 x 2 x 2 x 2 x 5',
    Distractor3: '2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 x 5'
  },
  {
    _level: 'l2',
    number_to_factor: '450',
    Result: '2 x 3 x 3 x 5 x 5',
    Distractor1: '2 x 3 x 3 x 5',
    Distractor2: '2 x 3 x 5 x 5',
    Distractor3: '2 x 2 x 3 x 3 x 5 x 5'
  },
  {
    _level: 'l3',
    number_to_factor: '360',
    Result: '2 x 2 x 2 x 3 x 3 x 5',
    Distractor1: '2 x 2 x 3 x 3 x 5',
    Distractor2: '2 x 2 x 2 x 3 x 5',
    Distractor3: '2 x 2 x 2 x 2 x 3 x 3 x 5'
  }
];

const GRID_PRESETS = [
  {
    id: 'tap-to-fill-preposition',
    name: '✏️ English: Tap-to-Fill Preposition Sentence (Location Words)',
    title: 'Choose the best location word to match the picture',
    targetCollection: 'dynamic_templates',
    subject: 'english',
    topic: 'grammar',
    grade: '5',
    questionMode: 'tap_to_fill',
    optionsType: 'tap_to_fill',
    type: 'tap_to_fill',
    columns: ['target_word', 'target_image', 'target_audio', 'Result', 'distractor_1', 'distractor_2', 'distractor_3'],
    rows: [
      {
        target_word: 'The man and woman are _ the trees.',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/1784611241481-The-man-and-woman-are-next-the-trees-.jpg',
        target_audio: 'The man and woman are next to the trees.',
        Result: 'next to',
        distractor_1: 'inside',
        distractor_2: 'under',
        distractor_3: 'above'
      },
      {
        target_word: 'The cat is _ the bed.',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/1784611445918-cat-under-bed.jpg',
        target_audio: 'The cat is under the bed.',
        Result: 'under',
        distractor_1: 'on',
        distractor_2: 'behind',
        distractor_3: 'between'
      },
      {
        target_word: 'The ball is _ the box.',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/1784611468494-ball-inside-box.jpg',
        target_audio: 'The ball is inside the box.',
        Result: 'inside',
        distractor_1: 'over',
        distractor_2: 'next to',
        distractor_3: 'behind'
      },
      {
        target_word: 'The picture is _ the wall.',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/1784611649657-picture-on-the-wall.jpg',
        target_audio: 'The picture is on the wall.',
        Result: 'on',
        distractor_1: 'under',
        distractor_2: 'in',
        distractor_3: 'behind'
      }
    ],
    blueprint: 'Complete the sentence to match the picture:\n{{target_word}}',
    solution: 'The correct preposition for this sentence is **{{Result}}**.',
    optionsBinding: [
      { column: 'Result', isCorrect: true },
      { column: 'distractor_1', isCorrect: false },
      { column: 'distractor_2', isCorrect: false },
      { column: 'distractor_3', isCorrect: false }
    ]
  },
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
  },
  {
    id: 'english-vowel-sound',
    name: '📖 English: Match Vowel Sound (CVC/Long E)',
    title: 'Match Vowel Sound',
    targetCollection: 'dynamic_templates',
    subject: 'english',
    topic: 'lkg',
    grade: 'LKG',
    columns: ['target_word', 'target_image', 'Result_word', 'Result_image', 'Result_audio', 'Distractor_word', 'Distractor_image', 'Distractor_audio'],
    rows: [
      {
        _level: 'l1',
        target_word: 'feet',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/feet.jpg',
        Result_word: 'meet',
        Result_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/meet.jpg',
        Result_audio: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Puck/cb89f8fc4d5ed15960f971e8cf3b929950c15fc324584bcb4495f1da371c5923.wav',
        Distractor_word: 'deck',
        Distractor_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/deck.jpg',
        Distractor_audio: '/api/tts?voice=Puck&text=deck'
      },
      {
        _level: 'l2',
        target_word: 'cat',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780142885298-cat.png',
        Result_word: 'bat',
        Result_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779984418831-bat.png',
        Result_audio: '/api/tts?voice=Puck&text=bat',
        Distractor_word: 'dog',
        Distractor_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781330207379-dog.png',
        Distractor_audio: '/api/tts?voice=Puck&text=dog'
      },
      {
        _level: 'l3',
        target_word: 'seed',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/seed.jpg',
        Result_word: 'jeep',
        Result_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/jeep.jpg',
        Result_audio: '/api/tts?voice=Puck&text=jeep',
        Distractor_word: 'hen',
        Distractor_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/1780406160428-hen_cartoon.webp',
        Distractor_audio: '/api/tts?voice=Puck&text=hen'
      }
    ],
    blueprint: 'Listen to the word. Think about the vowel sound.\n\n![{{target_word}}]({{target_image}})\n\nWhich word has the same vowel sound?',
    solution: 'The word **{{target_word}}** has the same vowel sound as **{{Result_word}}**.',
    optionsBinding: [
      { column: 'Result_word', imageColumn: 'Result_image', audioColumn: 'Result_audio', isCorrect: true },
      { column: 'Distractor_word', imageColumn: 'Distractor_image', audioColumn: 'Distractor_audio', isCorrect: false }
    ]
  },
  {
    id: 'english-vocab-id',
    name: '📖 English: Word to Image Identification',
    title: 'Word to Image Identification',
    targetCollection: 'dynamic_templates',
    subject: 'english',
    topic: 'lkg',
    grade: 'LKG',
    columns: ['word', 'Opt1_word', 'Opt1_image', 'Opt2_word', 'Opt2_image', 'Opt3_word', 'Opt3_image'],
    rows: [
      {
        _level: 'l1',
        word: 'apple',
        Opt1_word: 'apple',
        Opt1_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780323338637-Fruits-Playing-Football.webp',
        Opt2_word: 'dog',
        Opt2_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781330207379-dog.png',
        Opt3_word: 'cup',
        Opt3_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781329973512-cup.png'
      },
      {
        _level: 'l2',
        word: 'feet',
        Opt1_word: 'feet',
        Opt1_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/feet.jpg',
        Opt2_word: 'deck',
        Opt2_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/deck.jpg',
        Opt3_word: 'sun',
        Opt3_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781329978632-sun.png'
      }
    ],
    blueprint: 'Which picture represents the word: **"{{word}}"**?',
    solution: 'Choose the option that shows the picture of **{{word}}**.',
    optionsBinding: [
      { column: 'Opt1_word', imageColumn: 'Opt1_image', isCorrect: true },
      { column: 'Opt2_word', imageColumn: 'Opt2_image', isCorrect: false },
      { column: 'Opt3_word', imageColumn: 'Opt3_image', isCorrect: false }
    ]
  },
  {
    id: 'english-listen-and-spell',
    name: '✏️ English: Listen to Word & Spell (Tap-to-Fill)',
    title: 'Listen to the Word and Spell It',
    targetCollection: 'dynamic_templates',
    subject: 'english',
    topic: 'ukg-english-reading-foundations',
    grade: 'UKG',
    optionsType: 'tap_to_fill',
    columns: ['target_word', 'target_image', 'target_audio', 'Result', 'distractor_1', 'distractor_2', 'distractor_3'],
    rows: [
      {
        _level: 'l1',
        target_word: 'pig',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/pig.png',
        target_audio: '/api/tts?voice=Puck&text=pig',
        Result: 'pig',
        distractor_1: 'p',
        distractor_2: 'i',
        distractor_3: 'g'
      },
      {
        _level: 'l2',
        target_word: 'cat',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780142885298-cat.png',
        target_audio: '/api/tts?voice=Puck&text=cat',
        Result: 'cat',
        distractor_1: 'c',
        distractor_2: 'a',
        distractor_3: 't'
      },
      {
        _level: 'l3',
        target_word: 'pen',
        target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/pen.png',
        target_audio: '/api/tts?voice=Puck&text=pen',
        Result: 'pen',
        distractor_1: 'p',
        distractor_2: 'e',
        distractor_3: 'n'
      }
    ],
    blueprint: 'Listen to the word. Then, spell it.\n\n![{{target_word}}]({{target_image}})\n\n_ _ _',
    solution: 'Listen to the word **{{target_word}}**. Tap the letters to spell **{{target_word}}**.',
    optionsBinding: [
      { column: 'distractor_1', isCorrect: true },
      { column: 'distractor_2', isCorrect: true },
      { column: 'distractor_3', isCorrect: true }
    ]
  },
  {
    id: 'english-listen-and-spell-30',
    name: '🧩 English: Listen & Spell 30 Words (Sentence Ordering Grid)',
    title: 'Listen to the Word and Spell It (30 Words Grid)',
    targetCollection: 'dynamic_templates',
    subject: 'english',
    topic: 'ukg-english-reading-foundations',
    grade: 'UKG',
    optionsType: 'sentence_ordering',
    columns: ['target_word', 'target_image', 'target_audio', 'Result', 'distractor_1', 'distractor_2', 'distractor_3'],
    rows: [
      { _level: 'l1', target_word: 'pig', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/pig.png', target_audio: '/api/tts?voice=Puck&text=pig', Result: 'pig', distractor_1: 'p', distractor_2: 'i', distractor_3: 'g' },
      { _level: 'l1', target_word: 'cat', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780142885298-cat.png', target_audio: '/api/tts?voice=Puck&text=cat', Result: 'cat', distractor_1: 'c', distractor_2: 'a', distractor_3: 't' },
      { _level: 'l1', target_word: 'pen', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/pen.png', target_audio: '/api/tts?voice=Puck&text=pen', Result: 'pen', distractor_1: 'p', distractor_2: 'e', distractor_3: 'n' },
      { _level: 'l1', target_word: 'pop', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780138957805-balon-pop.png', target_audio: '/api/tts?voice=Puck&text=pop', Result: 'pop', distractor_1: 'p', distractor_2: 'o', distractor_3: 'p' },
      { _level: 'l1', target_word: 'sun', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/sun.png', target_audio: '/api/tts?voice=Puck&text=sun', Result: 'sun', distractor_1: 's', distractor_2: 'u', distractor_3: 'n' },
      { _level: 'l1', target_word: 'dog', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/dog.png', target_audio: '/api/tts?voice=Puck&text=dog', Result: 'dog', distractor_1: 'd', distractor_2: 'o', distractor_3: 'g' },
      { _level: 'l1', target_word: 'bus', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/bus.png', target_audio: '/api/tts?voice=Puck&text=bus', Result: 'bus', distractor_1: 'b', distractor_2: 'u', distractor_3: 's' },
      { _level: 'l1', target_word: 'cup', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/cup.png', target_audio: '/api/tts?voice=Puck&text=cup', Result: 'cup', distractor_1: 'c', distractor_2: 'u', distractor_3: 'p' },
      { _level: 'l1', target_word: 'hat', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/hat.png', target_audio: '/api/tts?voice=Puck&text=hat', Result: 'hat', distractor_1: 'h', distractor_2: 'a', distractor_3: 't' },
      { _level: 'l1', target_word: 'mat', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/mat.png', target_audio: '/api/tts?voice=Puck&text=mat', Result: 'mat', distractor_1: 'm', distractor_2: 'a', distractor_3: 't' },
      { _level: 'l2', target_word: 'bed', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/bed.png', target_audio: '/api/tts?voice=Puck&text=bed', Result: 'bed', distractor_1: 'b', distractor_2: 'e', distractor_3: 'd' },
      { _level: 'l2', target_word: 'red', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/red.png', target_audio: '/api/tts?voice=Puck&text=red', Result: 'red', distractor_1: 'r', distractor_2: 'e', distractor_3: 'd' },
      { _level: 'l2', target_word: 'net', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/net.png', target_audio: '/api/tts?voice=Puck&text=net', Result: 'net', distractor_1: 'n', distractor_2: 'e', distractor_3: 't' },
      { _level: 'l2', target_word: 'pin', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/pin.png', target_audio: '/api/tts?voice=Puck&text=pin', Result: 'pin', distractor_1: 'p', distractor_2: 'i', distractor_3: 'n' },
      { _level: 'l2', target_word: 'fin', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/fin.png', target_audio: '/api/tts?voice=Puck&text=fin', Result: 'fin', distractor_1: 'f', distractor_2: 'i', distractor_3: 'n' },
      { _level: 'l2', target_word: 'box', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/box.png', target_audio: '/api/tts?voice=Puck&text=box', Result: 'box', distractor_1: 'b', distractor_2: 'o', distractor_3: 'x' },
      { _level: 'l2', target_word: 'fox', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/fox.png', target_audio: '/api/tts?voice=Puck&text=fox', Result: 'fox', distractor_1: 'f', distractor_2: 'o', distractor_3: 'x' },
      { _level: 'l2', target_word: 'top', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/top.png', target_audio: '/api/tts?voice=Puck&text=top', Result: 'top', distractor_1: 't', distractor_2: 'o', distractor_3: 'p' },
      { _level: 'l2', target_word: 'log', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/log.png', target_audio: '/api/tts?voice=Puck&text=log', Result: 'log', distractor_1: 'l', distractor_2: 'o', distractor_3: 'g' },
      { _level: 'l2', target_word: 'bug', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/bug.png', target_audio: '/api/tts?voice=Puck&text=bug', Result: 'bug', distractor_1: 'b', distractor_2: 'u', distractor_3: 'g' },
      { _level: 'l3', target_word: 'mug', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/mug.png', target_audio: '/api/tts?voice=Puck&text=mug', Result: 'mug', distractor_1: 'm', distractor_2: 'u', distractor_3: 'g' },
      { _level: 'l3', target_word: 'tub', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/tub.png', target_audio: '/api/tts?voice=Puck&text=tub', Result: 'tub', distractor_1: 't', distractor_2: 'u', distractor_3: 'b' },
      { _level: 'l3', target_word: 'bag', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/bag.png', target_audio: '/api/tts?voice=Puck&text=bag', Result: 'bag', distractor_1: 'b', distractor_2: 'a', distractor_3: 'g' },
      { _level: 'l3', target_word: 'cap', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/cap.png', target_audio: '/api/tts?voice=Puck&text=cap', Result: 'cap', distractor_1: 'c', distractor_2: 'a', distractor_3: 'p' },
      { _level: 'l3', target_word: 'map', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/map.png', target_audio: '/api/tts?voice=Puck&text=map', Result: 'map', distractor_1: 'm', distractor_2: 'a', distractor_3: 'p' },
      { _level: 'l3', target_word: 'tap', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/tap.png', target_audio: '/api/tts?voice=Puck&text=tap', Result: 'tap', distractor_1: 't', distractor_2: 'a', distractor_3: 'p' },
      { _level: 'l3', target_word: 'jet', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/jet.png', target_audio: '/api/tts?voice=Puck&text=jet', Result: 'jet', distractor_1: 'j', distractor_2: 'e', distractor_3: 't' },
      { _level: 'l3', target_word: 'wet', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/wet.png', target_audio: '/api/tts?voice=Puck&text=wet', Result: 'wet', distractor_1: 'w', distractor_2: 'e', distractor_3: 't' },
      { _level: 'l3', target_word: 'zip', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/zip.png', target_audio: '/api/tts?voice=Puck&text=zip', Result: 'zip', distractor_1: 'z', distractor_2: 'i', distractor_3: 'p' },
      { _level: 'l3', target_word: 'mop', target_image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/mop.png', target_audio: '/api/tts?voice=Puck&text=mop', Result: 'mop', distractor_1: 'm', distractor_2: 'o', distractor_3: 'p' }
    ],
    blueprint: 'Listen to the word. Then, spell it.',
    solution: 'Listen to the word **{{target_word}}**. Arrange the letters to spell **{{target_word}}**.',
    optionsBinding: [
      { column: 'distractor_1', isCorrect: true },
      { column: 'distractor_2', isCorrect: true },
      { column: 'distractor_3', isCorrect: true }
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
  
  // Question mode: 'mcq' = single correct, 'msq' = multiple correct
  const [questionMode, setQuestionMode] = useState('mcq');

  // Options binding maps (isCorrect supports multiple true in MSQ mode)
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
  const [skillId, setSkillId] = useState('');
  const [customTemplateId, setCustomTemplateId] = useState('');
  const [targetCollection, setTargetCollection] = useState('dynamic_templates');
  const [selectedExamId, setSelectedExamId] = useState('jnvst');
  const [jnvstSection, setJnvstSection] = useState('arithmetic');
  const [jnvstTopic, setJnvstTopic] = useState('simplification');
  const [jnvstDifficulty, setJnvstDifficulty] = useState(0.5);

  const [imageHasAudio, setImageHasAudio] = useState(false);
  const [imageIsTransparent, setImageIsTransparent] = useState(false);
  const [customPartsText, setCustomPartsText] = useState('');
  const [isPartsRawJsonMode, setIsPartsRawJsonMode] = useState(false);

  // AI & Importer state
  const [showSidebar, setShowSidebar] = useState(true);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [rawCsvInputText, setRawCsvInputText] = useState('');
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [googleSheetTab, setGoogleSheetTab] = useState('read'); // 'read' | 'push'
  const [googleSheetInput, setGoogleSheetInput] = useState('');
  const [fetchingGoogleSheet, setFetchingGoogleSheet] = useState(false);
  const [googleSheetError, setGoogleSheetError] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [pushingToGoogleSheet, setPushingToGoogleSheet] = useState(false);
  const [googleSheetPushSuccess, setGoogleSheetPushSuccess] = useState(null);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [targetTextColForAudio, setTargetTextColForAudio] = useState('');
  const [selectedAudioVoice, setSelectedAudioVoice] = useState('Puck');
  const [aiMode, setAiMode] = useState('skill'); // 'skill' | 'question'
  const [aiSkillDesc, setAiSkillDesc] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiRowsPerLevel, setAiRowsPerLevel] = useState(3);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWebhook = localStorage.getItem('google_sheet_webhook_url');
      if (savedWebhook) setWebhookUrl(savedWebhook);
      const stored = localStorage.getItem('import_spreadsheet_rows');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Extract columns from keys of the first object, excluding _level and explanation
            const keys = Object.keys(parsed[0]).filter(k => k !== '_level' && k !== 'explanation');
            
            // Map rows to include _level if not present
            const loadedRows = parsed.map((row, idx) => ({
              _level: row._level || (idx % 2 === 0 ? 'l1' : 'l2'),
              ...row
            }));
            
            // Update states
            setColumns(keys);
            setRows(loadedRows);
            setTitle('Imported AI Clipart Spreadsheet');
            setSubject('english');
            setTopic('phonics');
            setBlueprint('Identify the correct clipart matching: {{target_word}}.');
            setSolution('The target word is {{target_word}}, which matches the result {{Result}}.');
            
            // Set bindings for options based on Result and distractor columns
            const newBindings = [
              { column: 'Result', isCorrect: true }
            ];
            if (keys.includes('distractor_1')) newBindings.push({ column: 'distractor_1', isCorrect: false });
            if (keys.includes('distractor_2')) newBindings.push({ column: 'distractor_2', isCorrect: false });
            if (keys.includes('distractor_3')) newBindings.push({ column: 'distractor_3', isCorrect: false });
            setOptionsBinding(newBindings);

            // Clear from localStorage so it only imports once
            localStorage.removeItem('import_spreadsheet_rows');
          }
        } catch (e) {
          console.error('Failed to import rows from localStorage:', e);
        }
      }
    }
  }, []);

  // Simulator Shuffle state
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [shuffleClass, setShuffleClass] = useState('');

  // Compiler output state
  const [jsonText, setJsonText] = useState('');
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);

  // Image Picker & Upload Modal States
  const [isImgModalOpen, setIsImgModalOpen] = useState(false);
  const [imgModalTarget, setImgModalTarget] = useState(null); // { rIdx, col }
  const [imgModalTab, setImgModalTab] = useState('gallery'); // 'gallery' | 'upload' | 'web'
  const [modalSearchText, setModalSearchText] = useState('');
  const [modalGalleryImages, setModalGalleryImages] = useState([]);
  const [modalGalleryLoading, setModalGalleryLoading] = useState(false);
  const [modalUploadFile, setModalUploadFile] = useState(null);
  const [modalUploading, setModalUploading] = useState(false);

  // Web Search States inside Modal
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchType, setWebSearchType] = useState('clipart'); // 'clipart' | 'photo' | 'any'
  const [webSearchResults, setWebSearchResults] = useState([]);
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webSearchSelectedUrl, setWebSearchSelectedUrl] = useState(''); // track downloading image URL

  const fetchModalGalleryImages = async () => {
    setModalGalleryLoading(true);
    try {
      // Load both base images and subdirectories if needed
      const res = await fetch('/api/admin/list-images?prefix=images');
      const data = await res.json();
      if (data.images) {
        setModalGalleryImages(data.images);
      }
    } catch (err) {
      console.error('Failed to load gallery images:', err);
    } finally {
      setModalGalleryLoading(false);
    }
  };

  const openImagePickerModal = (rIdx, col) => {
    setImgModalTarget({ rIdx, col });
    setIsImgModalOpen(true);
    setImgModalTab('gallery');
    setModalUploadFile(null);
    setModalSearchText('');
    
    // Autofill web search query with the target word cell value if available
    const row = rows[rIdx] || {};
    const textCol = [`${col.replace(/_image$/, '')}_word`, `${col.replace(/_image$/, '')}_label`, `${col.replace(/_image$/, '')}_option`, col.replace(/_image$/, ''), 'target_word', 'Result_word', 'word', 'label'].find(c => columns.includes(c) && row[c]);
    if (textCol && row[textCol]) {
      setWebSearchQuery(String(row[textCol]).trim());
    } else {
      setWebSearchQuery('');
    }

    setWebSearchResults([]);
    fetchModalGalleryImages();
  };

  const handleWebSearch = async (query = webSearchQuery, type = webSearchType) => {
    if (!query || !query.trim()) return;
    setWebSearchLoading(true);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(query.trim())}&type=${type}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Web search failed');
      setWebSearchResults(data.results || []);
    } catch (err) {
      alert('Search Error: ' + err.message);
    } finally {
      setWebSearchLoading(false);
    }
  };

  const handleWebSearchSelect = async (item) => {
    if (webSearchSelectedUrl) return; // prevent double clicks
    setWebSearchSelectedUrl(item.image);
    try {
      const res = await fetch('/api/admin/fetch-url-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.image,
          folder: 'images/lkg', // default folder for vocabulary clipart
          customName: webSearchQuery.trim() || 'web-search-import'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to download search image');
      
      if (imgModalTarget) {
        const { rIdx, col } = imgModalTarget;
        handleCellChange(rIdx, col, data.r2Url);
      }
      setIsImgModalOpen(false);
    } catch (err) {
      alert('Failed to save search image: ' + err.message);
    } finally {
      setWebSearchSelectedUrl('');
    }
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!modalUploadFile) return;
    setModalUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', modalUploadFile);
      formData.append('folder', 'images/lkg'); // default folder for vocabulary illustrations

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      const isSuccess = data.success || (data.results && data.results.length > 0);
      if (!res.ok || !isSuccess) {
        throw new Error(data.error || (data.errors && data.errors[0]?.error) || 'Failed to upload image');
      }

      const uploadedUrl = data.url || (data.results && data.results[0]?.url);
      if (imgModalTarget && uploadedUrl) {
        const { rIdx, col } = imgModalTarget;
        handleCellChange(rIdx, col, uploadedUrl);
      }
      setIsImgModalOpen(false);
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setModalUploading(false);
    }
  };

  // AI Generate handler
  const handleAIGenerate = async () => {
    setAiGenerating(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const payload = aiMode === 'skill'
        ? {
            skillId: skillId || aiSkillDesc.slice(0, 40),
            skillDescription: aiSkillDesc,
            subject, topic, grade,
            rowsPerLevel: aiRowsPerLevel
          }
        : {
            questionText: aiQuestion,
            subject, topic
          };

      const res = await fetch('/api/admin/templates/generate-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'AI generation failed');

      const tpl = data.template;
      if (tpl.id)      setCustomTemplateId(tpl.id);
      if (tpl.title)   setTitle(tpl.title);
      if (tpl.skillId) setSkillId(tpl.skillId);
      if (tpl.subject) setSubject(tpl.subject);
      if (tpl.topic)   setTopic(tpl.topic);
      if (tpl.grade)   setGrade(tpl.grade);
      if (tpl.targetCollection) setTargetCollection(tpl.targetCollection);
      if (tpl.columns) setColumns(tpl.columns.filter(c => c !== '_level'));
      if (tpl.rows) {
        const normalized = tpl.rows.map(r => ({ _level: 'l1', ...r }));
        setRows(normalized);
      }
      if (tpl.blueprint) setBlueprint(tpl.blueprint);
      if (tpl.solution)  setSolution(tpl.solution);
      if (tpl.optionsBinding) setOptionsBinding(tpl.optionsBinding);
      // Restore question mode from saved template
      const savedMode = tpl.optionsType || tpl.interaction?.engine || tpl.config?.interaction?.engine || 'mcq';
      setQuestionMode(savedMode === 'msq' ? 'msq' : savedMode === 'tap_to_fill' ? 'tap_to_fill' : 'mcq');
      setActiveRowIndex(0);
      setAiSuccess(`✅ AI generated ${data.template.rows?.length || 0} rows for "${tpl.title || skillId}"`);
    } catch (err) {
      setAiError('⚠️ ' + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Save/Publish status states
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [linkToQuestionId, setLinkToQuestionId] = useState(null);

  // Track loaded existing template for "Save Rows" patch flow
  const [loadedTemplateId, setLoadedTemplateId] = useState(null);
  const [savingRows, setSavingRows] = useState(false);
  const [saveRowsStatus, setSaveRowsStatus] = useState(null);
  // Preserve the exact raw JSON that was loaded (for "Publish Raw" flow)
  const [rawLoadedJson, setRawLoadedJson] = useState(null);
  const [publishingRaw, setPublishingRaw] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // Handle cell edit changes
  const [mirrorTargetToResult, setMirrorTargetToResult] = useState(true);

  const handleCellChange = (rowIndex, colName, value) => {
    setRows(prev => prev.map((row, idx) => {
      if (idx === rowIndex) {
        const updatedRow = { ...row, [colName]: value };
        
        if (mirrorTargetToResult) {
          if (colName === 'target_word' && columns.includes('Result')) {
            updatedRow['Result'] = value;
          } else if (colName === 'target_image' && columns.includes('Result_image')) {
            updatedRow['Result_image'] = value;
          } else if (colName === 'target_audio' && columns.includes('Result_audio')) {
            updatedRow['Result_audio'] = value;
          } else if (colName === 'target' && columns.includes('Result')) {
            updatedRow['Result'] = value;
          }
        }
        
        return updatedRow;
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
    const newRow = { _level: 'l1' };
    columns.forEach(col => {
      newRow[col] = '';
    });
    setRows([...rows, newRow]);
  };

  // State & Helpers for Cell Interactivity and Auto-TTS Generation
  const [warmingTts, setWarmingTts] = useState(false);
  const isAudioUrl = (val) => typeof val === 'string' && (val.startsWith('/api/tts') || val.includes('.wav') || val.includes('.mp3'));
  const isImageUrl = (val) => typeof val === 'string' && (val.startsWith('http') && (val.includes('.jpg') || val.includes('.jpeg') || val.includes('.png') || val.includes('.webp') || val.includes('.gif') || val.includes('.svg')));

  const playAudio = (url) => {
    try {
      const audio = new Audio(url);
      audio.play().catch(e => console.error('Audio play error:', e));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAudioForSpecificColumn = async (textColName, voiceName = 'Puck') => {
    if (!textColName) return;

    setWarmingTts(true);

    const prefix = textColName.toLowerCase().replace(/_*(word|item|phoneme|label|text|sound)$/i, '');
    const audioColName = `${prefix}_audio`;

    // Ensure audio column exists in columns
    let currentCols = [...columns];
    if (!currentCols.includes(audioColName)) {
      const idx = currentCols.indexOf(textColName);
      if (idx !== -1) {
        currentCols.splice(idx + 1, 0, audioColName);
      } else {
        currentCols.push(audioColName);
      }
      setColumns(currentCols);
    }

    const updatedRows = [...rows.map(r => ({ ...r }))];
    let count = 0;

    for (let r = 0; r < updatedRows.length; r++) {
      const row = updatedRows[r];
      const textVal = String(row[textColName] || '').trim();
      if (textVal && !textVal.startsWith('http') && !textVal.startsWith('![')) {
        try {
          const res = await fetch('/api/admin/resolve-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textVal, voice: voiceName, generate: true })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.audioUrl) {
              row[audioColName] = data.audioUrl;
              count++;
              continue;
            }
          }
        } catch (e) {
          console.warn('R2 resolve-audio error, fallback to TTS route:', e);
        }

        // Fallback to route URL
        const fallbackUrl = `/api/tts?voice=${voiceName}&text=${encodeURIComponent(textVal)}`;
        row[audioColName] = fallbackUrl;
        count++;
      }
    }

    setRows(updatedRows);
    setIsAudioModalOpen(false);
    setWarmingTts(false);

    alert(`🔊 Generated ${count} audio URLs (saved to Cloudflare R2 Storage!) for column "${textColName}" into "${audioColName}" using voice ${voiceName}!`);
  };

  const handleAutoGenerateTTS = async () => {
    setWarmingTts(true);
    let audioCols = columns.filter(col => col.endsWith('_audio') || col === 'audio');

    // Auto-create audio column if none exists yet
    if (audioCols.length === 0) {
      const textColCand = columns.find(c => ['target_phoneme', 'phoneme', 'target_word', 'correct_item', 'word', 'character_name', 'target_sound', 'text'].includes(c.toLowerCase())) || columns[0];
      if (textColCand) {
        const prefix = textColCand.toLowerCase().replace(/_*(word|item|phoneme|label|text|sound)$/i, '');
        const newAudioCol = `${prefix}_audio`;
        if (!columns.includes(newAudioCol)) {
          const idx = columns.indexOf(textColCand);
          const newCols = [...columns];
          if (idx !== -1) {
            newCols.splice(idx + 1, 0, newAudioCol);
          } else {
            newCols.push(newAudioCol);
          }
          setColumns(newCols);
          audioCols = [newAudioCol];
        }
      }
    }

    if (audioCols.length === 0) {
      alert("No text or audio columns found in spreadsheet.");
      setWarmingTts(false);
      return;
    }

    const updatedRows = [...rows.map(r => ({ ...r }))];
    let count = 0;

    // Collect tasks
    const tasks = [];
    updatedRows.forEach((row) => {
      audioCols.forEach(audioCol => {
        let textCol = null;
        const prefix = audioCol.toLowerCase().replace(/_audio$/, '');
        let foundCol = columns.find(c => {
          const lc = c.toLowerCase();
          return lc !== audioCol.toLowerCase() && (
            lc === prefix || lc === `${prefix}_phoneme` || lc === `${prefix}_word` ||
            lc === `${prefix}_item` || lc === `${prefix}_label` || lc === `${prefix}_text` ||
            lc === `${prefix}_sound` || lc.startsWith(prefix)
          );
        });

        if (!foundCol) {
          foundCol = columns.find(c => ['target_phoneme', 'phoneme', 'target_word', 'correct_item', 'word', 'label', 'text', 'character_name'].includes(c.toLowerCase()));
        }

        if (foundCol && row[foundCol]) {
          textCol = foundCol;
        }

        if (textCol) {
          const textValue = String(row[textCol] || '').trim();
          if (textValue && !textValue.startsWith('http') && !textValue.startsWith('![')) {
            const voice = 'Puck';
            const currentAudioCell = String(row[audioCol] || '');
            const needsR2Resolution = !currentAudioCell || currentAudioCell.startsWith('/api/tts') || !currentAudioCell.startsWith('http');
            if (needsR2Resolution) {
              tasks.push({ row, audioCol, textValue, voice });
            }
          }
        }
      });
    });

    // Execute in parallel batches of 5
    const chunkSize = 5;
    for (let i = 0; i < tasks.length; i += chunkSize) {
      const batch = tasks.slice(i, i + chunkSize);
      await Promise.all(batch.map(async (task) => {
        try {
          const res = await fetch('/api/admin/resolve-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: task.textValue, voice: task.voice, generate: true })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.audioUrl) {
              task.row[task.audioCol] = data.audioUrl;
              count++;
              return;
            }
          }
        } catch (e) {
          console.warn('R2 resolve-audio error, fallback to TTS route:', e);
        }
        task.row[task.audioCol] = `/api/tts?voice=${task.voice}&text=${encodeURIComponent(task.textValue)}`;
        count++;
      }));
    }

    setRows(updatedRows);
    
    if (count > 0) {
      alert(`🪄 Successfully generated and saved ${count} audio URLs directly into Cloudflare R2 Storage!`);
    } else {
      alert("No audio cells with matching text fields were found.");
    }
    setWarmingTts(false);
  };

  // Auto-clean grid helper: replaces '---' placeholders with real words/values and fixes option bindings
  const handleAutoCleanGrid = () => {
    let fixedCount = 0;
    const cleanWordFromUrl = (url) => {
      if (!url || typeof url !== 'string') return '';
      if (url.includes('text=')) {
        try {
          const text = new URL(url, 'http://localhost').searchParams.get('text');
          if (text) return text.trim();
        } catch (e) {}
      }
      const filename = url.split('/').pop().split('?')[0];
      const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp|svg|gif)$/i, '');
      const parts = nameWithoutExt.split('-');
      const clean = parts[parts.length - 1].replace(/[^a-zA-Z]/g, '');
      return clean.length >= 2 ? clean : nameWithoutExt;
    };

    const sampleWords = ['cat', 'pen', 'pig', 'dog', 'sun', 'bat', 'cup', 'hen', 'fan', 'pin'];
    const sampleDistractors = ['c', 'a', 't', 'p', 'e', 'n', 'i', 'g', 'b', 'o'];

    const updatedRows = rows.map((row, idx) => {
      const newRow = { ...row };
      const wordCol = columns.find(c => ['target_word', 'word', 'text'].includes(c));
      const imageCol = columns.find(c => c.toLowerCase().includes('image'));
      const audioCol = columns.find(c => c.toLowerCase().includes('audio'));
      const resultCol = columns.find(c => ['Result', 'Result_word', 'correct_letter'].includes(c));

      // 1. Clean target_word
      let wordVal = wordCol ? String(newRow[wordCol] || '').trim() : '';
      if (!wordVal || wordVal === '---' || wordVal === 'n/a') {
        const fromImg = imageCol ? cleanWordFromUrl(newRow[imageCol]) : '';
        const fromAud = audioCol ? cleanWordFromUrl(newRow[audioCol]) : '';
        wordVal = fromImg || fromAud || sampleWords[idx % sampleWords.length];
        if (wordCol) {
          newRow[wordCol] = wordVal;
          fixedCount++;
        }
      }

      // 2. Clean Result
      if (resultCol) {
        let resVal = String(newRow[resultCol] || '').trim();
        if (!resVal || resVal === '---' || resVal === 'n/a') {
          // If result should be first letter (e.g. 'c' for 'cat') or full word
          newRow[resultCol] = wordVal ? wordVal : sampleWords[idx % sampleWords.length];
          fixedCount++;
        }
      }

      // 3. Clean Distractors
      columns.filter(c => c.toLowerCase().includes('distractor')).forEach((distCol, dIdx) => {
        let dVal = String(newRow[distCol] || '').trim();
        if (!dVal || dVal === '---' || dVal === 'n/a') {
          newRow[distCol] = sampleDistractors[(idx + dIdx * 2 + 1) % sampleDistractors.length];
          fixedCount++;
        }
      });

      return newRow;
    });

    // 4. Clean Blueprint if it repeats variables erroneously (e.g. "[Result] [Result] [Result].")
    if (blueprint.includes('[Result] [Result]') || blueprint.includes('{{Result}} {{Result}}')) {
      setBlueprint('Listen to the word. Then, spell it.');
      fixedCount++;
    }

    setRows(updatedRows);
    alert(`✨ Cleaned and fixed ${fixedCount} placeholder/cell value(s)!`);
  };

  // Cycle difficulty level for a row
  const handleCycleLevel = (rowIndex) => {
    setRows(prev => prev.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const cur = row._level || 'l1';
      const next = LEVEL_CYCLE[(LEVEL_CYCLE.indexOf(cur) + 1) % LEVEL_CYCLE.length];
      return { ...row, _level: next };
    }));
  };

  // CSV Importer logic
  const parseCSVText = (text) => {
    const lines = [];
    let row = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(currentVal.trim());
        if (row.some(cell => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }

    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
    }

    return lines;
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const { columns: parsedCols, rows: parsedRows } = parseCsvText(text);
        if (!parsedCols || parsedCols.length === 0 || !parsedRows || parsedRows.length === 0) {
          alert('⚠️ CSV file must contain valid headers and at least 1 row of data.');
          return;
        }

        setColumns(parsedCols);
        setRows(parsedRows);
        setActiveRowIndex(0);

        const resCol = parsedCols.find(c => c.toLowerCase().includes('result') || c.toLowerCase().includes('correct') || c.toLowerCase().includes('answer'));
        const disCols = parsedCols.filter(c => c !== resCol && (c.toLowerCase().includes('distractor') || c.toLowerCase().includes('opt') || c.toLowerCase().includes('wrong')));

        if (resCol) {
          const newBindings = [{ column: resCol, isCorrect: true, misconception: '' }];
          disCols.forEach(c => newBindings.push({ column: c, isCorrect: false, misconception: '' }));
          setOptionsBinding(newBindings);
        }

        const cleanTitle = file.name.replace(/\.csv$/i, '').replace(/[-_]+/g, ' ');
        setTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));

        alert(`✅ Successfully imported ${parsedRows.length} rows & ${parsedCols.length} columns from "${file.name}"!`);
      } catch (err) {
        alert(`❌ CSV Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadSampleCSV = (sampleType) => {
    let content = '';
    let filename = 'sample_template.csv';

    if (sampleType === 'phonics') {
      filename = 'phonics_blend_template.csv';
      content = `target_word,target_image,target_audio,Result_word,Distractor1_word,Distractor2_word\n` +
        `drop,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/drop.jpg,/api/tts?text=drop,dr,tr,cr\n` +
        `star,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/star.jpg,/api/tts?text=star,st,sp,sk\n` +
        `frog,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/frog.jpg,/api/tts?text=frog,fr,fl,fg\n` +
        `ship,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/ship.jpg,/api/tts?text=ship,sh,ch,th`;
    } else if (sampleType === 'math') {
      filename = 'math_addition_template.csv';
      content = `num1,num2,Result,Distractor1,Distractor2,Distractor3\n` +
        `3,4,7,6,8,5\n` +
        `5,5,10,9,11,12\n` +
        `8,2,10,12,7,9\n` +
        `6,7,13,12,14,11`;
    } else {
      filename = 'vocab_image_match.csv';
      content = `word,Opt1_word,Opt1_image,Opt2_word,Opt2_image,Opt3_word,Opt3_image\n` +
        `apple,apple,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/apple.jpg,dog,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/dog.jpg,cup,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/cup.jpg\n` +
        `cat,cat,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/cat.jpg,pen,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/pen.jpg,sun,https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/sun.jpg`;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (columns.length === 0 || rows.length === 0) {
      alert('⚠️ No spreadsheet data to export.');
      return;
    }

    const escapeCell = (val) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = columns.map(escapeCell).join(',');
    const dataLines = rows.map(r => columns.map(col => escapeCell(r[col])).join(','));
    const csvContent = [headerLine, ...dataLines].join('\n');

    const cleanName = (title || customTemplateId || 'spreadsheet_template').toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    const filename = `${cleanName}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFetchGoogleSheet = async (e) => {
    if (e) e.preventDefault();
    if (!googleSheetInput.trim()) return;

    setFetchingGoogleSheet(true);
    setGoogleSheetError(null);

    try {
      const res = await fetch('/api/admin/fetch-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleSheetInput.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch Google Sheet');
      }

      const parsedLines = parseCSVText(data.csvText);
      if (parsedLines.length < 2) {
        throw new Error('Google Sheet must contain at least 1 header row and 1 data row.');
      }

      const headerRow = parsedLines[0].map(h => h.trim().replace(/[^a-zA-Z0-9_]+/g, '_'));
      const validCols = headerRow.filter(h => h.length > 0);

      if (validCols.length === 0) {
        throw new Error('No valid column headers found in Google Sheet.');
      }

      const dataRows = parsedLines.slice(1).map(line => {
        const rowObj = {};
        validCols.forEach((col, idx) => {
          rowObj[col] = line[idx] !== undefined ? line[idx] : '';
        });
        return rowObj;
      });

      setColumns(validCols);
      setRows(dataRows);
      setActiveRowIndex(0);

      const resCol = validCols.find(c => c.toLowerCase().includes('result') || c.toLowerCase().includes('correct') || c.toLowerCase().includes('opt1'));
      const disCols = validCols.filter(c => c !== resCol && (c.toLowerCase().includes('distractor') || c.toLowerCase().includes('opt')));

      if (resCol) {
        const newBindings = [{ column: resCol, isCorrect: true }];
        disCols.forEach(c => newBindings.push({ column: c, isCorrect: false }));
        setOptionsBinding(newBindings);
      }

      setIsGoogleSheetModalOpen(false);
      alert(`🎉 Successfully synced & loaded ${dataRows.length} rows & ${validCols.length} columns from Google Sheet!`);
    } catch (err) {
      setGoogleSheetError(err.message);
    } finally {
      setFetchingGoogleSheet(false);
    }
  };

  const handlePushToGoogleSheet = async (e) => {
    if (e) e.preventDefault();
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      setGoogleSheetError('Please enter your Google Apps Script Webhook URL.');
      return;
    }

    setPushingToGoogleSheet(true);
    setGoogleSheetError(null);
    setGoogleSheetPushSuccess(null);

    try {
      localStorage.setItem('google_sheet_webhook_url', cleanUrl);

      const res = await fetch('/api/admin/push-google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: cleanUrl,
          columns,
          rows
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to push updates to Google Sheet.');
      }

      setGoogleSheetPushSuccess(`✅ Live Google Sheet updated successfully! Pushed ${rows.length} rows & ${columns.length} columns with all updated image & audio URLs.`);
    } catch (err) {
      setGoogleSheetError(err.message);
    } finally {
      setPushingToGoogleSheet(false);
    }
  };

  // Bulk Auto-Fetch & Fill Images from R2 Gallery or DuckDuckGo Web Search
  const handleAutoFetchImages = async () => {
    setFetchingImages(true);
    let filledCount = 0;

    try {
      // 1. Fetch R2 gallery images list
      let galleryImages = [];
      try {
        const res = await fetch('/api/admin/list-images');
        if (res.ok) {
          const data = await res.json();
          if (data.images && Array.isArray(data.images)) {
            galleryImages = data.images;
          }
        }
      } catch (galleryErr) {
        console.warn('Gallery list-images failed, fallback to DuckDuckGo:', galleryErr);
      }

      // Build gallery map by cleaned filename/key
      const galleryMap = new Map();
      galleryImages.forEach(img => {
        const key = img.key || '';
        const filename = key.split('/').pop().split('.')[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (filename && !galleryMap.has(filename)) {
          galleryMap.set(filename, img.url);
        }
      });

      // Helper to clean word
      const cleanWordStr = (str) => {
        if (!str || typeof str !== 'string') return '';
        let clean = str.replace(/\[Image:\s*([^\]]+)\]/i, '$1').replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase().trim();
        return clean;
      };

      // Identify image columns
      const imageCols = columns.filter(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('img') || c.toLowerCase().includes('pic'));
      if (imageCols.length === 0) {
        alert('⚠️ No image columns found in spreadsheet (e.g. target_image, Result_image).');
        setFetchingImages(false);
        return;
      }

      // Clone rows
      const updatedRows = [...rows.map(r => ({ ...r }))];

      for (let rIdx = 0; rIdx < updatedRows.length; rIdx++) {
        const row = updatedRows[rIdx];

        for (const imgCol of imageCols) {
          const rawVal = String(row[imgCol] || '').trim();

          // Needs auto-fill if empty, text prompt like [Image: X], or non-URL
          const needsFetch = !rawVal || rawVal === '---' || rawVal.startsWith('[Image') || (!rawVal.startsWith('http://') && !rawVal.startsWith('https://'));

          if (needsFetch) {
            // Find target word to search
            let searchWord = '';
            if (rawVal.startsWith('[Image:')) {
              searchWord = cleanWordStr(rawVal);
            }
            if (!searchWord) {
              // 1. Try to find column with matching prefix (e.g. distractor_image -> distractor_item or distractor_word)
              const prefix = imgCol.toLowerCase().replace(/_*(image|img|pic)$/i, '');
              if (prefix) {
                const matchingCol = columns.find(c => {
                  const lc = c.toLowerCase();
                  return lc !== imgCol.toLowerCase() && (
                    lc === prefix ||
                    lc === `${prefix}_item` ||
                    lc === `${prefix}_word` ||
                    lc === `${prefix}_text` ||
                    lc.startsWith(prefix)
                  );
                });

                if (matchingCol && row[matchingCol]) {
                  searchWord = cleanWordStr(row[matchingCol]);
                }
              }

              // 2. Fallback to general word columns (correct_item, target_word, word, text, character_name)
              if (!searchWord) {
                const wordCol = columns.find(c => ['correct_item', 'target_word', 'word', 'text', 'target', 'character_name'].includes(c));
                if (wordCol && row[wordCol]) {
                  searchWord = cleanWordStr(row[wordCol]);
                }
              }
            }

            if (!searchWord) continue;

            // Step A: Check R2 Gallery first
            const cleanKey = searchWord.replace(/[^a-z0-9]+/g, '');
            if (galleryMap.has(cleanKey)) {
              row[imgCol] = galleryMap.get(cleanKey);
              filledCount++;
              continue;
            }

            // Step B: DuckDuckGo Web Search Fallback
            try {
              const ddgRes = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(searchWord)}`);
              if (ddgRes.ok) {
                const ddgData = await ddgRes.json();
                const results = ddgData.results || ddgData.images || [];

                if (results.length > 0) {
                  const bestMatch = results[0];
                  const rawWebUrl = bestMatch.image || bestMatch.thumbnail;

                  if (rawWebUrl) {
                    // Step C: Save remote web image to R2 storage for permanent reliability
                    try {
                      const saveRes = await fetch('/api/admin/fetch-url-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: rawWebUrl, folder: 'images/lkg', customName: searchWord })
                      });
                      if (saveRes.ok) {
                        const saveData = await saveRes.json();
                        if (saveData.r2Url) {
                          row[imgCol] = saveData.r2Url;
                          filledCount++;
                          continue;
                        }
                      }
                    } catch (saveErr) {
                      console.warn('Failed to save to R2, using direct web URL:', saveErr);
                    }

                    // Direct Web URL fallback
                    row[imgCol] = rawWebUrl;
                    filledCount++;
                  }
                }
              }
            } catch (ddgErr) {
              console.warn(`DuckDuckGo image search failed for "${searchWord}":`, ddgErr);
            }
          }
        }
      }

      setRows(updatedRows);

      if (filledCount > 0) {
        alert(`🖼️ Done! Auto-fetched & filled ${filledCount} image(s) from Gallery & DuckDuckGo!`);
      } else {
        alert('ℹ️ All image cells are already filled with valid URLs!');
      }
    } catch (err) {
      alert(`⚠️ Auto-Fetch Images error: ${err.message}`);
    } finally {
      setFetchingImages(false);
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
    let result = String(templateText).replace(/\\n/g, '\n').replace(/\/n/g, '\n');

    columns.forEach(col => {
      const val = currentRow[col] !== undefined ? String(currentRow[col]) : '';
      const regex = new RegExp(`\\{\\{\\s*${col}\\s*\\}\\}`, 'g');
      result = result.replace(regex, val);
    });

    return result;
  };

  const getEvaluatedParts = () => {
    const imageCol = columns.find(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('clipart'));
    const audioCol = columns.find(c => c.toLowerCase().includes('audio') || c.toLowerCase().includes('sound'));
    const patternCol = columns.find(c => c.toLowerCase().includes('pattern'));
    const wordCol = columns.find(c => c.toLowerCase() === 'word' || c.toLowerCase() === 'text');

    let partsSource = [];
    if (customPartsText && customPartsText.trim() !== '') {
      try {
        partsSource = JSON.parse(customPartsText);
        if (!Array.isArray(partsSource)) partsSource = [];
      } catch (e) {
        console.warn('Preview parts JSON parse failed:', e);
      }
    }

    if (partsSource.length === 0) {
      if (rawLoadedJson?.parts && !imageCol) {
        partsSource.push(...rawLoadedJson.parts);
      } else {
        // 1. Audio part
        if (audioCol && !imageHasAudio) {
          partsSource.push({
            type: 'audio',
            content: `[${audioCol}]`,
            label: wordCol ? `[${wordCol}]` : ''
          });
        }

        // 2. Blueprint instruction text
        if (blueprint) {
          partsSource.push({
            type: 'text',
            content: blueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
          });
        }

        // 3. Image
        if (imageCol) {
          const imgPart = {
            type: 'image',
            content: `[${imageCol}]`,
            label: wordCol ? `[${wordCol}]` : ''
          };
          if (imageIsTransparent) imgPart.transparent = true;
          if (imageHasAudio && audioCol) {
            imgPart.playLabelSound = true;
            imgPart.audioUrl = `[${audioCol}]`;
          }
          partsSource.push(imgPart);
        }

        // 4. Pattern
        if (patternCol) {
          partsSource.push({
            type: 'text',
            content: `[${patternCol}]`
          });
        }
      }
    }

    if (partsSource.length === 0) return null;

    const currentRow = rows[activeRowIndex] || {};
    return partsSource.map(part => {
      let content = part.content || '';
      let label = part.label || '';
      let audioUrl = part.audioUrl || '';
      
      // Substitute placeholders like [col] or {{col}}
      columns.forEach(col => {
        const val = currentRow[col] !== undefined ? String(currentRow[col]) : '';
        const regex1 = new RegExp(`\\[${col}\\]`, 'g');
        const regex2 = new RegExp(`\\{\\{\\s*${col}\\s*\\}\\}`, 'g');
        content = content.replace(regex1, val).replace(regex2, val);
        label = label.replace(regex1, val).replace(regex2, val);
        audioUrl = audioUrl.replace(regex1, val).replace(regex2, val);
      });
      
      return {
        ...part,
        content,
        label,
        audioUrl
      };
    });
  };

  const renderEvaluatedText = (templateText) => {
    return renderMathText(getEvaluatedText(templateText));
  };

  const renderMathText = (text) => {
    if (!text) return '';
    const cleanedText = String(text).replace(/\\n/g, '\n').replace(/\/n/g, '\n');
    const regex = /(\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\\\$[^$]*?\\\$|\$[^\$]+\$)/g;
    const parts = cleanedText.split(regex);

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
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      if (imgRegex.test(part)) {
        const subParts = part.split(/(!\[.*?\]\(.*?\))/g);
        return (
          <span key={index} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {subParts.map((sub, sIdx) => {
              const match = /!\[(.*?)\]\((.*?)\)/.exec(sub);
              if (match) {
                return (
                  <img
                    key={`${index}-${sIdx}`}
                    src={match[2] || null}
                    alt={match[1]}
                    style={{
                      maxWidth: '120px',
                      maxHeight: '100px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #475569',
                      margin: '4px 0'
                    }}
                  />
                );
              }
              return sub ? <span key={`${index}-${sIdx}`}>{sub}</span> : null;
            })}
          </span>
        );
      }
      // Audio URL detection (e.g. /api/tts?voice=Puck&text=s or .mp3/.wav)
      if (typeof part === 'string' && (part.includes('/api/tts') || part.includes('.mp3') || part.includes('.wav'))) {
        const audioUrlMatch = part.match(/(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/i);
        if (audioUrlMatch) {
          const audioUrl = audioUrlMatch[0];
          const textBeforeAfter = part.split(audioUrl);
          return (
            <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {textBeforeAfter[0] && <span>{textBeforeAfter[0]}</span>}
              <button
                type="button"
                onClick={() => playAudio(audioUrl)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  margin: '4px 0'
                }}
              >
                🔊 Listen Sound
              </button>
              {textBeforeAfter[1] && <span>{textBeforeAfter[1]}</span>}
            </span>
          );
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
    const templateId = customTemplateId.trim() || ('template-' + String(title || 'custom').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    const cleanBlueprint = blueprint.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
    const cleanSolution = solution.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');

    // Create parallel array values — exclude the meta _level column
    const parallelVariables = {};
    const dataColumns = columns.filter(c => c !== '_level');
    dataColumns.forEach(col => {
      parallelVariables[col] = rows.map(r => {
        const cell = String(r[col] || '').trim();
        return Number.isFinite(Number(cell)) && cell !== '' ? Number(cell) : cell;
      });
    });

    // Build level-separated index pools
    const indicesPool    = Array.from({ length: rows.length }, (_, i) => i);
    const indexL1 = rows.map((r, i) => (r._level || 'l1') === 'l1' ? i : null).filter(i => i !== null);
    const indexL2 = rows.map((r, i) => (r._level || 'l1') === 'l2' ? i : null).filter(i => i !== null);
    const indexL3 = rows.map((r, i) => (r._level || 'l1') === 'l3' ? i : null).filter(i => i !== null);
    const indexL4 = rows.map((r, i) => (r._level || 'l1') === 'l4' ? i : null).filter(i => i !== null);
    // questionLevel derivation: maps each row index -> 1/2/3/4
    const levelArray   = rows.map(r => ({ l1: 1, l2: 2, l3: 3, l4: 4 }[r._level || 'l1']));

    if (targetCollection === 'templates') {
      // JNVST JSON format mapping
      const compiledVariables = {
        index:    indicesPool,
        index_l1: indexL1.length > 0 ? indexL1 : indicesPool,
        index_l2: indexL2.length > 0 ? indexL2 : indicesPool,
        index_l3: indexL3.length > 0 ? indexL3 : indicesPool,
        index_l4: indexL4.length > 0 ? indexL4 : indicesPool,
      };

      const compiledDerivations = {};
      dataColumns.forEach(col => {
        const listStr = JSON.stringify(parallelVariables[col]);
        compiledDerivations[col] = `${listStr}[index]`;
      });
      compiledDerivations.questionLevel = `${JSON.stringify(levelArray)}[index]`;

      const optionsList = optionsBinding.map(opt => {
        const item = {
          label: `[${opt.column}]`,
          isCorrect: opt.isCorrect
        };
        if (opt.imageColumn) item.imageUrl = `[${opt.imageColumn}]`;
        if (opt.audioColumn) item.audioUrl = `[${opt.audioColumn}]`;
        return item;
      });
      const correctOptions = optionsBinding.filter(o => o.isCorrect);
      const isSentenceOrdering = questionMode === 'sentence_ordering';
      const isMSQ = (questionMode === 'msq' || correctOptions.length > 1) && !isSentenceOrdering;
      const isTapToFill = questionMode === 'tap_to_fill';
      const isCategorizationV2 = questionMode === 'categorizationv2' || questionMode === 'categorisationv2';

      const difficultyLevel = jnvstDifficulty < 0.4 ? 'easy' : (jnvstDifficulty >= 0.7 ? 'hard' : 'medium');

      const compiledJson = {
        id: templateId,
        _id: templateId,
        name: title || 'Custom Grid JNVST Template',
        type: 'parameterized',
        generatorType: 'spreadsheet-grid',
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
            engine: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
            inputMode: isSentenceOrdering ? 'ordering' : (isCategorizationV2 ? 'drag-drop' : (isTapToFill ? 'choice' : (isMSQ ? 'multi-choice' : 'choice')))
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
        { name: 'index',    type: 'array', values: indicesPool },
        { name: 'index_l1', type: 'array', values: indexL1.length > 0 ? indexL1 : indicesPool },
        { name: 'index_l2', type: 'array', values: indexL2.length > 0 ? indexL2 : indicesPool },
        { name: 'index_l3', type: 'array', values: indexL3.length > 0 ? indexL3 : indicesPool },
        { name: 'index_l4', type: 'array', values: indexL4.length > 0 ? indexL4 : indicesPool },
      ];

      dataColumns.forEach(col => {
        compiledVariables.push({
          name: col,
          type: 'expression',
          formula: `${JSON.stringify(parallelVariables[col])}[index]`
        });
      });
      // questionLevel: 1=easy, 2=medium, 3=hard
      compiledVariables.push({
        name: 'questionLevel',
        type: 'expression',
        formula: `${JSON.stringify(levelArray)}[index]`
      });

      const optionsList = optionsBinding.map(opt => {
        const item = {
          label: `[${opt.column}]`,
          isCorrect: opt.isCorrect
        };
        if (opt.imageColumn) item.imageUrl = `[${opt.imageColumn}]`;
        if (opt.audioColumn) item.audioUrl = `[${opt.audioColumn}]`;
        return item;
      });

      const correctOptions = optionsBinding.filter(o => o.isCorrect);
      const isSentenceOrdering = questionMode === 'sentence_ordering';
      const isMSQ = (questionMode === 'msq' || correctOptions.length > 1) && !isSentenceOrdering;
      const isTapToFill = questionMode === 'tap_to_fill';
      const isCategorizationV2 = questionMode === 'categorizationv2' || questionMode === 'categorisationv2';
      const correctOpt = correctOptions[0];

      // Auto-detect special columns
      const imageCol = columns.find(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('clipart'));
      const audioCol = columns.find(c => c.toLowerCase().includes('audio') || c.toLowerCase().includes('sound'));
      const patternCol = columns.find(c => c.toLowerCase().includes('pattern'));
      const wordCol = columns.find(c => c.toLowerCase() === 'word' || c.toLowerCase() === 'text');

      let compiledParts = [];
      if (customPartsText && customPartsText.trim() !== '') {
        try {
          compiledParts = JSON.parse(customPartsText);
          if (!Array.isArray(compiledParts)) {
            compiledParts = [];
          }
        } catch (e) {
          console.warn('Custom parts JSON parse failed:', e);
        }
      }

      if (compiledParts.length === 0 && imageCol) {
        // 1. Audio part (if not attached to image)
        if (audioCol && !imageHasAudio) {
          compiledParts.push({
            type: 'audio',
            content: `[${audioCol}]`,
            label: wordCol ? `[${wordCol}]` : ''
          });
        }

        // 2. Main Question Instruction Text
        if (cleanBlueprint) {
          compiledParts.push({
            type: 'text',
            content: cleanBlueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
          });
        }

        // 3. Image Part
        const imgPart = {
          type: 'image',
          content: `[${imageCol}]`,
          label: wordCol ? `[${wordCol}]` : ''
        };
        if (imageIsTransparent) {
          imgPart.transparent = true;
        }
        if (imageHasAudio && audioCol) {
          imgPart.playLabelSound = true;
          imgPart.audioUrl = `[${audioCol}]`;
        }
        compiledParts.push(imgPart);

        // 4. Pattern Text Part
        if (patternCol) {
          compiledParts.push({
            type: 'text',
            content: `[${patternCol}]`
          });
        }
      }

      const compiledJson = {
        id: templateId,
        title: title || 'Custom Grid Template',
        subject: subject,
        topic: topic,
        grade: grade,
        generatorType: 'spreadsheet-grid',
        optionsType: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
        type: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
        interaction: {
          engine: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
          inputMode: isSentenceOrdering ? 'ordering' : (isCategorizationV2 ? 'drag-drop' : (isTapToFill ? 'choice' : (isMSQ ? 'multi-choice' : 'choice')))
        },
        questionText: cleanBlueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]'),
        explanation: {
          sections: [{
            type: 'text',
            content: cleanSolution.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
          }]
        },
        options: optionsList,
        validationRules: isSentenceOrdering
          ? [{
              type: 'exact_match',
              target: 'answer',
              value: '[Result]'
            }]
          : (isMSQ
            ? [{
                type: 'all_correct',
                target: 'answer',
                values: correctOptions.map(o => `[${o.column}]`)
              }]
            : [{
                type: 'exact_match',
                target: 'answer',
                value: correctOpt ? `[${correctOpt.column}]` : ''
              }]),
        variables: compiledVariables
      };

      if (compiledParts.length > 0) {
        compiledJson.parts = compiledParts;
      }

      setJsonText(JSON.stringify(compiledJson, null, 2));
    }
  }, [columns, rows, blueprint, solution, optionsBinding, questionMode, title, subject, topic, grade, targetCollection, selectedExamId, jnvstSection, jnvstTopic, jnvstDifficulty, customTemplateId, imageHasAudio, imageIsTransparent, customPartsText]);

  const fetchExistingTemplates = async () => {
    setLoadingExisting(true);
    try {
      const res = await fetch('/api/admin/templates');
      if (!res.ok) {
        throw new Error(`Failed to fetch templates: HTTP status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.dynamicTemplates)) {
        // Only load templates created by the spreadsheet grid creator
        const grids = data.dynamicTemplates.filter(t => {
          return t.generatorType === 'spreadsheet-grid' ||
            (t.config && t.config.generatorType === 'spreadsheet-grid');
        });
        // Deduplicate: keep the first occurrence of each logical id
        const seenIds = new Set();
        const uniqueGrids = grids.filter(t => {
          const uid = t._id || t.id;
          if (seenIds.has(uid)) return false;
          seenIds.add(uid);
          return true;
        });
        setExistingTemplates(uniqueGrids);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.warn('Failed to fetch templates:', err);
      setPublishError(`⚠️ Existing templates refresh failed: ${err.message}`);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    fetchExistingTemplates();
  }, []);

  useEffect(() => {
    if (existingTemplates.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id') || params.get('templateId');
    if (urlId) {
      const matched = existingTemplates.find(t => t.id === urlId || String(t._id) === urlId);
      if (matched) {
        loadTemplateIntoEditor(matched);
      }
    }
  }, [existingTemplates]);

  const loadTemplateIntoEditor = (tpl) => {
    try {
      setPublishError(null);
      setPublishStatus(null);
      
      const config = tpl.config || tpl;
      if (config.title) setTitle(config.title);
      else if (tpl.name) setTitle(tpl.name);
      
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
              } catch (parseErr) {
                console.warn(`Failed to parse array formula for column ${v.name}:`, parseErr);
                setPublishError(`⚠️ Column array formula parse error for "${v.name}": ${parseErr.message}`);
              }
            }
          }
        });
      } else if (vars && typeof vars === 'object' && !config.derivations && Object.values(vars).some(v => v && v.formula)) {
        // Curriculum Mode stored as object JSON load
        const idxVar = vars.index;
        if (idxVar && Array.isArray(idxVar.values)) {
          size = idxVar.values.length;
        }
        for (const [name, v] of Object.entries(vars)) {
          if (name !== 'index' && v && v.formula) {
            const arrMatch = v.formula.match(/^(\[.*?\])\[index\]$/);
            if (arrMatch) {
              try {
                colData[name] = JSON.parse(arrMatch[1]);
              } catch (parseErr) {
                console.warn(`Failed to parse array formula for column ${name}:`, parseErr);
                setPublishError(`⚠️ Column array formula parse error for "${name}": ${parseErr.message}`);
              }
            }
          }
        }
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
            } catch (parseErr) {
              console.warn(`Failed to parse derivation formula for column ${k}:`, parseErr);
              setPublishError(`⚠️ Column array formula parse error for "${k}": ${parseErr.message}`);
            }
          }
        });
      }

      // Try to load rows directly from the template's saved rows array
      const savedRows = tpl.rows || config.rows;
      if (Array.isArray(savedRows) && savedRows.length > 0) {
        const keys = Object.keys(savedRows[0]).filter(k => k !== '_level' && k !== 'id' && k !== '_id');
        setColumns(keys);
        const cleanLevel = (lvl) => {
          if (!lvl) return 'l1';
          const clean = String(lvl).toLowerCase().trim();
          if (['l1', 'l2', 'l3', 'l4'].includes(clean)) return clean;
          const num = parseInt(clean.replace(/\D/g, ''), 10);
          if (!isNaN(num)) {
            if (num <= 1) return 'l1';
            if (num === 2) return 'l2';
            if (num === 3) return 'l3';
            return 'l4';
          }
          return 'l1';
        };
        const mappedRows = savedRows.map(row => {
          const rowObj = { _level: cleanLevel(row._level) };
          keys.forEach(col => {
            rowObj[col] = row[col] !== undefined ? String(row[col]) : '';
          });
          return rowObj;
        });
        setRows(mappedRows);
      } else {
        // Fallback: reconstruct rows from variable array formulas
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
          compiledRows.forEach(r => { if (!r._level) r._level = 'l1'; });
          setRows(compiledRows);
        }
      }

      let qTemplate = config.questionTemplate || tpl.questionText || '';
      let sTemplate = config.explanationTemplate || config.explanation?.sections?.[0]?.content || '';
      qTemplate = qTemplate.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');
      sTemplate = sTemplate.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');
      setBlueprint(qTemplate);
      setSolution(sTemplate);

      const parts = tpl.parts || config.parts;
      if (Array.isArray(parts)) {
        setCustomPartsText(JSON.stringify(parts, null, 2));
        const imgPart = parts.find(p => p.type === 'image');
        if (imgPart) {
          setImageHasAudio(!!imgPart.playLabelSound);
          setImageIsTransparent(!!imgPart.transparent);
        } else {
          setImageHasAudio(false);
          setImageIsTransparent(false);
        }
      } else {
        setCustomPartsText('');
        setImageHasAudio(false);
        setImageIsTransparent(false);
      }

      const rawOpts = config.options || tpl.options;
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

      const tplId = tpl.id || tpl._id || null;
      setLoadedTemplateId(tplId);
      setCustomTemplateId(tplId || '');
      setSaveRowsStatus(null);
      setRawLoadedJson(tpl);
      setJsonText(JSON.stringify(tpl, null, 2));
      
      alert(`🎉 Template "${tpl.title || tpl.name || tplId}" loaded into editor successfully!`);
    } catch (err) {
      alert(`Error loading template: ${err.message}`);
    }
  };

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
              } catch (parseErr) {
                console.warn(`Failed to parse array formula for column ${v.name}:`, parseErr);
                setPublishError(`⚠️ Column array formula parse error for "${v.name}": ${parseErr.message}`);
              }
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
            } catch (parseErr) {
              console.warn(`Failed to parse derivation formula for column ${k}:`, parseErr);
              setPublishError(`⚠️ Column array formula parse error for "${k}": ${parseErr.message}`);
            }
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
        // ensure every loaded row has a _level
      compiledRows.forEach(r => { if (!r._level) r._level = 'l1'; });
      setRows(compiledRows);
      }

      let qTemplate = config.questionTemplate || parsed.questionText || '';
      let sTemplate = config.explanationTemplate || config.explanation?.sections?.[0]?.content || '';
      qTemplate = qTemplate.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');
      sTemplate = sTemplate.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');
      setBlueprint(qTemplate);
      setSolution(sTemplate);

      const parts = parsed.parts || config.parts;
      if (Array.isArray(parts)) {
        setCustomPartsText(JSON.stringify(parts, null, 2));
        const imgPart = parts.find(p => p.type === 'image');
        if (imgPart) {
          setImageHasAudio(!!imgPart.playLabelSound);
          setImageIsTransparent(!!imgPart.transparent);
        } else {
          setImageHasAudio(false);
          setImageIsTransparent(false);
        }
      } else {
        setCustomPartsText('');
        setImageHasAudio(false);
        setImageIsTransparent(false);
      }

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
      // Track which template was loaded so Save Rows knows what to patch
      const tplId = parsed._id || parsed.id || null;
      setLoadedTemplateId(tplId);
      setCustomTemplateId(tplId || '');
      setSaveRowsStatus(null);
      // Preserve exact raw JSON for direct publish (bypasses grid compiler)
      setRawLoadedJson(parsed);
    } catch (err) {
      setPublishError('Load failed: ' + err.message);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishStatus(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      let parsed = null;

      // 1. Try parsing current jsonText
      if (jsonText && jsonText.trim()) {
        try {
          parsed = JSON.parse(jsonText);
        } catch (e) {
          console.warn('jsonText parse failed in handlePublish:', e);
        }
      }

      // 2. Fallback to rawLoadedJson if available
      if (!parsed && rawLoadedJson) {
        parsed = rawLoadedJson;
      }

      // 3. Fallback to building JSON directly from current state
      if (!parsed) {
        const cleanBlueprint = (blueprint || '').trim();
        const cleanSolution = (solution || '').trim();

        const correctOptions = optionsBinding.filter(o => o.isCorrect);
        const correctOpt = correctOptions[0];

        const optionsList = optionsBinding.map(opt => ({
          label: `[${opt.column}]`,
          ...(opt.imageCol ? { image: `[${opt.imageCol}]` } : {}),
          ...(opt.audioCol ? { audio: `[${opt.audioCol}]` } : {}),
          misconception: opt.misconception || ''
        }));

        const parallelVariables = {};
        columns.forEach(col => {
          parallelVariables[col] = rows.map(r => {
            const cell = String(r[col] || '').trim();
            return Number.isFinite(Number(cell)) && cell !== '' ? Number(cell) : cell;
          });
        });

        const templateId = loadedTemplateId || (customTemplateId && customTemplateId.trim() ? customTemplateId.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-') : (title ? title.toLowerCase().replace(/[^a-z0-9-_]+/g, '-') : 'custom-grid-template'));

        parsed = {
          id: templateId,
          title: title || 'Custom Grid Template',
          subject: subject,
          topic: topic,
          grade: grade,
          generatorType: 'spreadsheet-grid',
          optionsType: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
          type: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
          interaction: {
            engine: isSentenceOrdering ? 'sentence_ordering' : (isCategorizationV2 ? questionMode : (isTapToFill ? 'tap_to_fill' : (isMSQ ? 'msq' : 'mcq'))),
            inputMode: isSentenceOrdering ? 'ordering' : (isCategorizationV2 ? 'drag-drop' : (isTapToFill ? 'choice' : (isMSQ ? 'multi-choice' : 'choice')))
          },
          questionText: cleanBlueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]'),
          explanation: {
            sections: [{
              type: 'text',
              content: cleanSolution.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
            }]
          },
          options: optionsList,
          validationRules: isMSQ
            ? [{ type: 'all_correct', target: 'answer', values: correctOptions.map(o => `[${o.column}]`) }]
            : [{ type: 'exact_match', target: 'answer', value: correctOpt ? `[${correctOpt.column}]` : '' }],
          variables: Object.entries(parallelVariables).map(([name, items]) => ({
            name,
            type: 'pool_selection',
            items
          }))
        };
      }

      if (!parsed || !parsed.id) {
        throw new Error('Template ID is missing. Please set a Title or Template ID first.');
      }

      const templateId = parsed.id || parsed._id;

      // Duplicate ID validation warning (non-blocking for loaded template)
      const isDuplicate = existingTemplates.some(t => t.id === templateId || t._id === templateId);
      if (isDuplicate && templateId !== loadedTemplateId) {
        const proceed = window.confirm(`⚠️ WARNING: A template with ID "${templateId}" already exists. Overwrite?`);
        if (!proceed) {
          setPublishing(false);
          clearTimeout(timeoutId);
          return;
        }
      }

      const payload = {
        template: parsed,
        linkToQuestionId: linkToQuestionId
      };

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success) {
        setPublishStatus({ id: parsed.id || data.id, mode: 'saved' });
        fetchExistingTemplates();
        alert(`✅ Template "${parsed.id || data.id}" published live successfully!`);
      } else {
        setPublishError(data.error || 'Failed to save template to database.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setPublishError('⏳ Request timed out. Please verify database connection and retry.');
      } else {
        setPublishError(err.message || 'API call failed.');
      }
    } finally {
      setPublishing(false);
    }
  };

  // Publish the raw loaded JSON directly — bypasses the grid compiler entirely.
  const handlePublishRaw = async () => {
    if (!rawLoadedJson) return;
    setPublishingRaw(true);
    setPublishError(null);
    setPublishStatus(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const payload = { template: rawLoadedJson, linkToQuestionId };
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.success) {
        setPublishStatus({ id: rawLoadedJson.id || data.id || 'saved', mode: 'raw' });
        setSaveRowsStatus({ ok: true, msg: `✅ Raw JSON saved → "${rawLoadedJson.id || 'template'}"` });
        alert(`✅ Raw Template "${rawLoadedJson.id}" published live successfully!`);
      } else {
        setPublishError(data.error || 'Failed to save raw template.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setPublishError('⏳ Save raw template timed out. Retry.');
      } else {
        setPublishError(err.message || 'API call failed.');
      }
    } finally {
      setPublishingRaw(false);
    }
  };

  // Save ONLY the rows (variables/derivations) back to an existing loaded template
  const handleSaveRowsToExisting = async () => {
    if (!loadedTemplateId) return;
    setSavingRows(true);
    setSaveRowsStatus(null);
    setPublishError(null);
    try {
      // Build the compiled parallel arrays (same logic as the compile useEffect)
      const parallelVariables = {};
      columns.forEach(col => {
        parallelVariables[col] = rows.map(r => {
          const cell = String(r[col] || '').trim();
          return Number.isFinite(Number(cell)) && cell !== '' ? Number(cell) : cell;
        });
      });
      const indicesPool = Array.from({ length: rows.length }, (_, i) => i);

      let updates;
      if (targetCollection === 'templates') {
        // Competitive exam template: patch config.variables + config.derivations
        const compiledDerivations = {};
        columns.forEach(col => {
          compiledDerivations[col] = `${JSON.stringify(parallelVariables[col])}[index]`;
        });
        updates = {
          'config.variables': { index: indicesPool },
          'config.derivations': compiledDerivations,
        };
      } else {
        // Curriculum dynamic_template: patch variables array
        const compiledVariables = [
          { name: 'index', type: 'array', values: indicesPool }
        ];
        columns.forEach(col => {
          compiledVariables.push({
            name: col,
            type: 'expression',
            formula: `${JSON.stringify(parallelVariables[col])}[index]`
          });
        });
        updates = { variables: compiledVariables };
      }

      const isExam = targetCollection === 'templates';
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loadedTemplateId, updates, isExam })
      });
      const data = await res.json();
      if (data.success) {
        setSaveRowsStatus({ ok: true, msg: `✅ Saved ${rows.length} rows → template "${loadedTemplateId}"` });
      } else {
        setSaveRowsStatus({ ok: false, msg: '⚠️ ' + (data.error || 'Save failed') });
      }
    } catch (err) {
      setSaveRowsStatus({ ok: false, msg: '⚠️ ' + err.message });
    } finally {
      setSavingRows(false);
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
          background: #f0f7ff;
          font-family: 'Outfit', sans-serif;
          color: #1e293b;
          display: flex;
          flex-direction: column;
        }

        .grid-top-bar {
          background: #ffffff;
          border-bottom: 1.5px solid #e2e8f0;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(148, 163, 184, 0.05);
        }
        .grid-top-brand {
          font-size: 1.2rem;
          font-weight: 800;
          color: #2563eb;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .grid-top-brand span {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
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
          transition: all 0.2s ease;
        }
        .grid-workspace.has-sidebar {
          grid-template-columns: 320px 1fr 400px;
        }
        @media (max-width: 1200px) {
          .grid-workspace.has-sidebar {
            grid-template-columns: 280px 1fr 360px;
          }
        }
        @media (max-width: 1024px) {
          .grid-workspace, .grid-workspace.has-sidebar {
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
          background: #ffffff;
          border-left: 1.5px solid #cbd5e1;
          padding: 32px 24px;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: -4px 0 20px rgba(148, 163, 184, 0.05);
        }

        .grid-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 25px rgba(148, 163, 184, 0.06);
        }
        .grid-card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .grid-card-desc {
          font-size: 0.88rem;
          color: #64748b;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        /* Interactive Spreadsheet CSS */
        .spreadsheet-container {
          overflow-x: auto;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          background: #ffffff;
          margin-bottom: 16px;
          box-shadow: inset 0 2px 4px rgba(148, 163, 184, 0.03);
        }
        .spreadsheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .spreadsheet-th {
          background: #f8fafc;
          border-bottom: 2px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          padding: 10px 14px;
          color: #475569;
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
          border-bottom: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          padding: 0;
          background: transparent;
        }
        .spreadsheet-row:nth-child(even) .spreadsheet-td {
          background: #f8fafc;
        }
        .spreadsheet-input {
          width: 100%;
          border: none;
          background: transparent;
          color: #1e293b;
          padding: 10px 14px;
          font-family: inherit;
          font-size: 0.88rem;
          outline: none;
          box-sizing: border-box;
        }
        .spreadsheet-input:focus {
          background: rgba(59, 130, 246, 0.04);
          box-shadow: inset 0 0 0 1px #3b82f6;
        }
        .spreadsheet-btn-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .grid-textarea {
          width: 100%;
          min-height: 100px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          color: #1e293b;
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
          border-color: #3b82f6;
        }
        .grid-input {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          color: #1e293b;
          padding: 10px 14px;
          outline: none;
          font-family: inherit;
          font-size: 0.92rem;
          width: 100%;
          box-sizing: border-box;
        }
        .grid-input:focus {
          border-color: #3b82f6;
        }
        .grid-select {
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          color: #1e293b;
          padding: 10px 14px;
          outline: none;
          font-family: inherit;
          font-size: 0.92rem;
          width: 100%;
          cursor: pointer;
        }

        .grid-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
          background: #ffffff;
          color: #475569;
          border: 1.5px solid #cbd5e1;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .grid-btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .grid-preview-box {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          min-height: 180px;
          box-shadow: 0 10px 30px rgba(148, 163, 184, 0.1);
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
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .grid-shuffle-btn {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
          border: 1.5px solid rgba(59, 130, 246, 0.2);
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
        }
        .grid-shuffle-btn:hover {
          background: rgba(59, 130, 246, 0.2);
        }
        .cell-image-preview-wrapper {
          position: relative;
        }
        .cell-image-preview-wrapper:hover .cell-image-tooltip {
          display: block !important;
        }
      ` }} />

      {/* Header bar */}
      <div className="grid-top-bar">
        <Link href="/admin-v2" className="grid-top-brand">
          🟢 KlassChamp Spreadsheet Editor
          <span>Grid Mode v1.0</span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowSidebar(prev => !prev)}
            style={{
              background: showSidebar ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#ffffff',
              color: showSidebar ? '#ffffff' : '#2563eb',
              border: '1.5px solid #2563eb',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📂 Class & Subject Catalog ({existingTemplates.length})
          </button>
          <Link href="/template-generator-v2" className="grid-shuffle-btn" style={{ textDecoration: 'none' }}>
            🔙 Back to IDE
          </Link>
        </div>
      </div>

      {/* Main Workspace */}
      <div className={`grid-workspace ${showSidebar ? 'has-sidebar' : ''}`}>
        
        {showSidebar && (
          <TemplateSidebar
            templates={existingTemplates}
            onSelectTemplate={(tpl) => loadTemplateIntoEditor(tpl)}
            onClose={() => setShowSidebar(false)}
            activeTemplateId={customTemplateId || title}
          />
        )}
        
        {/* Left Side: Column Editor Workspace */}
        <div className="grid-editor-panel">
          
          <LatexToolbar activeField={activeField} />

          {/* Load Preset Selector Card */}
          <div className="grid-card" style={{ marginBottom: '20px', border: '1.5px solid #bfdbfe', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
            <h3 className="grid-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af' }}>
              ⚡ Load Preset Blueprint & Existing Templates
            </h3>
            <p className="grid-card-desc" style={{ color: '#1e3a8a' }}>Quickly populate the grid spreadsheet with preconfigured examples or load and edit an existing template from the database.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb', display: 'block', marginBottom: '6px' }}>
                  A. Choose from preconfigured presets
                </label>
                <select
                  className="grid-select"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
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
                      if (preset.questionMode || preset.optionsType) {
                        setQuestionMode(preset.questionMode || preset.optionsType);
                      }
                      setOptionsBinding(preset.optionsBinding);
                      setActiveRowIndex(0);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>✨ Select a preset blueprint...</option>
                  {GRID_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb', display: 'block', marginBottom: '6px' }}>
                  B. Load existing template from database to edit
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    className="grid-input"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    placeholder="🔍 Filter templates by name or topic..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                  />
                  <button
                    onClick={fetchExistingTemplates}
                    style={{ background: '#2563eb', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {loadingExisting ? '⏳' : '🔄 Refresh'}
                  </button>
                </div>
                {existingTemplates.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                    {(() => {
                      const filtered = existingTemplates.filter(t => {
                        if (!templateSearch.trim()) return true;
                        const q = templateSearch.toLowerCase();
                        return (t.title || t.name || t.id || '').toLowerCase().includes(q) ||
                          (t.topic || '').toLowerCase().includes(q) ||
                          (t.subject || '').toLowerCase().includes(q);
                      });
                      return `${filtered.length} of ${existingTemplates.length} grid templates`;
                    })()}
                  </div>
                )}
                <select
                  className="grid-select"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  onChange={(e) => {
                    const tplId = e.target.value;
                    const tpl = existingTemplates.find(t => (t.id === tplId || t._id === tplId));
                    if (tpl) {
                      loadTemplateIntoEditor(tpl);
                    }
                  }}
                  defaultValue=""
                  size={Math.min(8, existingTemplates.filter(t => {
                    if (!templateSearch.trim()) return true;
                    const q = templateSearch.toLowerCase();
                    return (t.title || t.name || t.id || '').toLowerCase().includes(q) ||
                      (t.topic || '').toLowerCase().includes(q) ||
                      (t.subject || '').toLowerCase().includes(q);
                  }).length + 1) || 3}
                >
                  <option value="" disabled>
                    {loadingExisting ? '⏳ Loading database templates...' : '📂 Click a template below to load it into editor...'}
                  </option>
                  {existingTemplates
                    .filter(t => {
                      if (!templateSearch.trim()) return true;
                      const q = templateSearch.toLowerCase();
                      return (t.title || t.name || t.id || '').toLowerCase().includes(q) ||
                        (t.topic || '').toLowerCase().includes(q) ||
                        (t.subject || '').toLowerCase().includes(q);
                    })
                    .map((tpl, idx) => (
                      <option key={(tpl._id || tpl.id || '') + '-' + idx} value={tpl.id || tpl._id}>
                        {tpl.title || tpl.name || tpl.id} · {tpl.subject || 'math'} / {tpl.topic || 'general'} · {tpl.grade ? `Grade ${tpl.grade}` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
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
                <label className="mc-dev-label">Template ID (Slug) <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(optional slug override)</span></label>
                <input
                  className="grid-input"
                  value={customTemplateId}
                  onChange={(e) => setCustomTemplateId(e.target.value)}
                  placeholder="e.g. template-imo-g3-place-face-value"
                />
              </div>
              <div>
                <label className="mc-dev-label">Skill ID <span style={{ color: '#6366f1', fontSize: '0.75rem' }}>(e.g. imo-g3-place-face)</span></label>
                <input
                  className="grid-input"
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  placeholder="e.g. imo-g3-place-face"
                />
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

          {/* ── AI Generation Card ───────────────────────────────────────── */}
          <div className="grid-card" style={{ border: '1.5px solid rgba(59,130,246,0.2)', background: 'linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(16,185,129,0.02) 100%)' }}>
            <h3 className="grid-card-title" style={{ color: '#1e40af' }}>
              ✨ AI Generate Grid Template
            </h3>
            <p className="grid-card-desc">Let Gemini AI auto-generate columns, rows (split by L1/L2/L3), blueprint, and solution from a skill name or existing question.</p>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {[['skill', '🎯 From Skill Name'], ['question', '📝 From Existing Question']].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setAiMode(m)}
                  style={{
                    background: aiMode === m ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: aiMode === m ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
                    color: aiMode === m ? '#1e3a8a' : '#475569',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    padding: '6px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {aiMode === 'skill' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="mc-dev-label">Skill ID <span style={{ color: '#64748b', fontWeight: 400 }}>(auto-filled from metadata)</span></label>
                    <input
                      className="grid-input"
                      value={skillId}
                      onChange={(e) => setSkillId(e.target.value)}
                      placeholder="e.g. imo-g3-place-face"
                    />
                  </div>
                  <div>
                    <label className="mc-dev-label">Rows per level (L1/L2/L3/L4)</label>
                    <select className="grid-select" value={aiRowsPerLevel} onChange={e => setAiRowsPerLevel(Number(e.target.value))}>
                      {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} rows each ({n*4} total)</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mc-dev-label">Skill Description <span style={{ color: '#64748b', fontWeight: 400 }}>(describe what to practice)</span></label>
                  <textarea
                    className="grid-textarea"
                    style={{ minHeight: '80px' }}
                    value={aiSkillDesc}
                    onChange={e => setAiSkillDesc(e.target.value)}
                    placeholder="e.g. Find the difference between the place value and face value of a digit in a 4-digit number. Generate easy, medium, hard rows."
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mc-dev-label">Paste an existing question &amp; choices</label>
                <textarea
                  className="grid-textarea"
                  style={{ minHeight: '100px' }}
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  placeholder="e.g. In the number 5240, find the difference between the place value of 2 and the face value of 0.\nA) 200  B) 199  C) 201  D) 20"
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={handleAIGenerate}
                disabled={aiGenerating || (aiMode === 'skill' ? !aiSkillDesc.trim() : !aiQuestion.trim())}
                style={{
                  background: aiGenerating ? '#374151' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: aiGenerating ? 'not-allowed' : 'pointer',
                  opacity: (aiMode === 'skill' ? !aiSkillDesc.trim() : !aiQuestion.trim()) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {aiGenerating ? '⏳ Generating...' : '✨ Generate with AI'}
              </button>
              {aiGenerating && <span style={{ fontSize: '0.82rem', color: '#a5b4fc' }}>Gemini is thinking... usually 5-10 seconds</span>}
              {aiSuccess && <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>{aiSuccess}</span>}
            </div>
            {aiError && <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '10px' }}>{aiError}</div>}
          </div>

          {/* Interactive Spreadsheet Grid Card */}
          <div className="grid-card">
            <h3 className="grid-card-title">📊 Dynamic Parameter Spreadsheet</h3>
            <p className="grid-card-desc">Define columns as placeholder variables, and fill out rows with parallel values. commas in cells are supported as plain text.</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="grid-input"
                  style={{ maxWidth: '220px' }}
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g. synonym or fruit_count"
                />
                <button className="grid-btn-secondary" onClick={handleAddColumn}>➕ Add Column</button>
                <label className="grid-btn-secondary" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}>
                  📥 Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleCSVUpload}
                  />
                </label>
                <button
                  type="button"
                  className="grid-btn-secondary"
                  onClick={() => setIsCsvModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#334155'
                  }}
                >
                  📄 Sample CSVs
                </button>
                <button
                  type="button"
                  className="grid-btn-secondary"
                  onClick={() => setIsGoogleSheetModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  📊 Sync Google Sheet
                </button>
                <button
                  type="button"
                  className="grid-btn-secondary"
                  onClick={handleExportCSV}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                  }}
                >
                  📤 Export CSV
                </button>
              </div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                color: '#1e3a8a',
                cursor: 'pointer',
                background: '#eff6ff',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1.5px solid #bfdbfe',
                userSelect: 'none',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
              >
                <input
                  type="checkbox"
                  checked={mirrorTargetToResult}
                  onChange={(e) => setMirrorTargetToResult(e.target.checked)}
                  style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                />
                🔗 Auto-Mirror Target ➔ Result
              </label>
            </div>

            <div className="spreadsheet-container">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th className="spreadsheet-th" style={{ width: '44px' }}>Row</th>
                    <th className="spreadsheet-th" style={{ width: '80px', textAlign: 'center' }}>Level</th>
                    {columns.filter(c => c !== '_level').map(col => (
                      <th key={col} className="spreadsheet-th">
                        {col}
                        <button className="spreadsheet-th-delete" onClick={() => handleDeleteColumn(col)}>×</button>
                      </th>
                    ))}
                    <th className="spreadsheet-th" style={{ width: '50px', textAlign: 'center' }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => {
                    const lvl = row._level || 'l1';
                    const safeLvl = ['l1', 'l2', 'l3', 'l4'].includes(lvl) ? lvl : 'l1';
                    const lc = LEVEL_CONFIG[safeLvl];
                    const isActive = rIdx === activeRowIndex;
                    return (
                      <tr
                        key={rIdx}
                        className="spreadsheet-row"
                        style={{
                          background: isActive
                            ? lc.bg
                            : `rgba(${lvl === 'l1' ? '16,185,129' : lvl === 'l2' ? '245,158,11' : '239,68,68'},0.03)`,
                          borderLeft: `3px solid ${lc.color}`,
                        }}
                      >
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 'bold', borderRight: '1px solid #1f2937', borderBottom: '1px solid #1f2937', fontSize: '0.78rem' }}>
                          {rIdx + 1}
                        </td>
                        {/* Level pill — click to cycle */}
                        <td style={{ textAlign: 'center', borderRight: '1px solid #1f2937', borderBottom: '1px solid #1f2937', padding: '4px 6px' }}>
                          <button
                            onClick={() => handleCycleLevel(rIdx)}
                            title={`Click to change: ${lc.long}`}
                            style={{
                              background: lc.bg,
                              border: `1.5px solid ${lc.border}`,
                              borderRadius: '20px',
                              color: lc.color,
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              padding: '3px 10px',
                              cursor: 'pointer',
                              letterSpacing: '0.03em',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s'
                            }}
                          >
                            {lc.emoji} {lc.label} {lc.long}
                          </button>
                        </td>
                        {columns.filter(c => c !== '_level').map(col => {
                          const hasAudioBtn = isAudioUrl(row[col]);
                          const hasImageBtn = col.endsWith('_image') || col === 'image';
                          const hasPreviewThumb = isImageUrl(row[col]);

                          let paddingRight = 4;
                          if (hasAudioBtn && hasImageBtn) {
                            paddingRight = 64;
                          } else if (hasPreviewThumb && hasImageBtn) {
                            paddingRight = 64;
                          } else if (hasAudioBtn || hasImageBtn || hasPreviewThumb) {
                            paddingRight = 36;
                          }

                          return (
                            <td key={col} className="spreadsheet-td" style={{ position: 'relative' }}>
                              <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingRight: `${paddingRight}px` }}>
                                <input
                                  className="spreadsheet-input"
                                  value={row[col] || ''}
                                  onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                                  title={row[col] || ''}
                                />
                              </div>
                              {hasAudioBtn && (
                                <button
                                  onClick={() => playAudio(row[col])}
                                  title="Play audio preview"
                                  style={{
                                    position: 'absolute',
                                    right: '6px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    fontSize: '0.72rem',
                                    transition: 'all 0.15s',
                                    zIndex: 5
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                                >
                                  🔊
                                </button>
                              )}
                              {hasImageBtn && (
                                <button
                                  onClick={() => openImagePickerModal(rIdx, col)}
                                  title="Pick from R2 Gallery or Upload"
                                  style={{
                                    position: 'absolute',
                                    right: hasPreviewThumb ? '34px' : '6px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    borderRadius: '6px',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    transition: 'all 0.15s',
                                    zIndex: 5
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e0f2fe'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                                >
                                  🖼️
                                </button>
                              )}
                              {hasPreviewThumb && (
                                <div
                                  className="cell-image-preview-wrapper"
                                  style={{
                                    position: 'absolute',
                                    right: '6px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 4
                                  }}
                                >
                                  <img
                                    src={row[col] || null}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                  <div
                                    className="cell-image-tooltip"
                                    style={{
                                      display: 'none',
                                      position: 'absolute',
                                      bottom: '30px',
                                      right: '-10px',
                                      zIndex: 1000,
                                      background: 'white',
                                      border: '2px solid #cbd5e1',
                                      borderRadius: '12px',
                                      padding: '4px',
                                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                      width: '120px',
                                      height: '120px',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <img
                                      src={row[col] || null}
                                      alt="Large Preview"
                                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>
                          <button style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleDeleteRow(rIdx)}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="spreadsheet-btn-row">
              <button className="grid-btn-primary" onClick={handleAddRow}>➕ Add Row Variant</button>
              <button
                className="grid-btn-secondary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none' }}
                onClick={handleAutoGenerateTTS}
                disabled={warmingTts}
              >
                {warmingTts ? '⏳ Generating TTS...' : '🪄 Auto-Generate & Warm TTS Audios'}
              </button>
              <button
                className="grid-btn-secondary"
                style={{ background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={() => {
                  const defaultCol = columns.find(c => ['target_phoneme', 'phoneme', 'target_word', 'correct_item', 'word', 'character_name', 'distractor_1'].includes(c.toLowerCase())) || columns[0] || '';
                  setTargetTextColForAudio(defaultCol);
                  setIsAudioModalOpen(true);
                }}
              >
                🔊 Generate Audio for Selected Column
              </button>
              <button
                className="grid-btn-secondary"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: '#fff', border: 'none', fontWeight: 800 }}
                onClick={handleAutoFetchImages}
                disabled={fetchingImages}
              >
                {fetchingImages ? '⏳ Auto-Fetching Images...' : '🖼️ Auto-Fetch Images (Gallery & DDG)'}
              </button>
              <button
                className="grid-btn-secondary"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none' }}
                onClick={handleAutoCleanGrid}
              >
                🧹 Auto-Clean & Fix "---" Cells
              </button>
              <button className="grid-btn-secondary" onClick={() => setRows([rows[0]])}>Clear rows</button>
            </div>

            {/* Level distribution stats bar */}
            {(() => {
              const counts = { l1: 0, l2: 0, l3: 0, l4: 0 };
              rows.forEach(r => { 
                const lvl = r._level || 'l1';
                const safeLvl = ['l1', 'l2', 'l3', 'l4'].includes(lvl) ? lvl : 'l1';
                counts[safeLvl]++; 
              });
              const total = rows.length;
              return (
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level Distribution:</span>
                  {LEVEL_CYCLE.map(lk => {
                    const lc = LEVEL_CONFIG[lk];
                    const pct = total > 0 ? Math.round((counts[lk] / total) * 100) : 0;
                    return (
                      <div key={lk} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '80px', height: '8px', background: '#1e293b', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: lc.color, borderRadius: '99px', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: lc.color }}>{lc.emoji} {lc.label}: {counts[lk]}</span>
                      </div>
                    );
                  })}
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>({total} total rows)</span>
                </div>
              );
            })()}
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

              {/* Image Clipart Options */}
              <div style={{ display: 'flex', gap: '24px', background: '#eff6ff', padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #bfdbfe', flexWrap: 'wrap', marginTop: '-4px', marginBottom: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#1e40af', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={imageHasAudio}
                    onChange={(e) => setImageHasAudio(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  🔊 Attach Audio Speaker to Clipart
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#1e40af', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={imageIsTransparent}
                    onChange={(e) => setImageIsTransparent(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  ✨ Transparent Clipart Background
                </label>
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

              <PartsArrayBuilder
                customPartsText={customPartsText}
                setCustomPartsText={setCustomPartsText}
                isPartsRawJsonMode={isPartsRawJsonMode}
                setIsPartsRawJsonMode={setIsPartsRawJsonMode}
                columns={columns}
              />
            </div>
          </div>

          {/* Option Choices Bindings Card */}
          <div className="grid-card">
            <h3 className="grid-card-title">📝 Step 3: Map Answer Choices to Columns</h3>
            <p className="grid-card-desc">Assign correct answers and distractor options directly to columns in your spreadsheet.</p>

            {/* MCQ / MSQ mode toggle */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Type:</span>
              <div style={{ display: 'flex', background: '#0f172a', borderRadius: '10px', border: '1.5px solid #334155', overflow: 'hidden' }}>
                {[['mcq', '🔘 MCQ', 'Single correct answer'], ['msq', '☑️ MSQ', 'Multiple correct answers'], ['tap_to_fill', '✏️ Tap-to-Fill', 'Student taps option into a blank'], ['sentence_ordering', '🧩 Sentence / Word Ordering', 'Student arranges scrambled words or letters']].map(([mode, label, hint]) => (
                  <button
                    key={mode}
                    title={hint}
                    onClick={() => {
                      setQuestionMode(mode);
                      if (mode === 'mcq') {
                        // In MCQ mode keep only the first correct, uncheck the rest
                        setOptionsBinding(prev => {
                          const firstCorrectIdx = prev.findIndex(o => o.isCorrect);
                          return prev.map((o, i) => ({ ...o, isCorrect: i === (firstCorrectIdx >= 0 ? firstCorrectIdx : 0) }));
                        });
                      }
                    }}
                    style={{
                      padding: '7px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: questionMode === mode
                        ? (mode === 'msq' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : mode === 'tap_to_fill' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : mode === 'sentence_ordering' ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#10b981,#059669)')
                        : 'transparent',
                      color: questionMode === mode ? '#fff' : '#64748b',
                      transition: 'all 0.18s ease'
                    }}
                  >{label}</button>
                ))}
              </div>
              <span style={{
                fontSize: '11px',
                color: questionMode === 'msq' ? '#a78bfa' : (questionMode === 'tap_to_fill' ? '#f59e0b' : (questionMode === 'sentence_ordering' ? '#60a5fa' : (questionMode.includes('categor') ? '#38bdf8' : '#34d399'))),
                background: questionMode === 'msq' ? 'rgba(124,58,237,0.12)' : (questionMode === 'tap_to_fill' ? 'rgba(245,158,11,0.12)' : (questionMode === 'sentence_ordering' ? 'rgba(37,99,235,0.12)' : (questionMode.includes('categor') ? 'rgba(56,189,248,0.12)' : 'rgba(16,185,129,0.12)'))),
                padding: '3px 10px',
                borderRadius: '999px',
                fontWeight: 600
              }}>
                {questionMode === 'msq' ? 'Students select all that apply' : questionMode === 'tap_to_fill' ? 'Student taps an option to fill the blank' : (questionMode === 'sentence_ordering' ? 'Students arrange scrambled words/letters' : (questionMode.includes('categor') ? 'Students drag items to category targets' : 'Students pick one answer'))}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {optionsBinding.map((opt, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: opt.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                  border: opt.isCorrect ? '1.5px solid rgba(16,185,129,0.35)' : '1px solid #1e293b',
                  transition: 'all 0.15s ease'
                }}>
                  {/* Correct toggle */}
                  <button
                    title={questionMode === 'msq' || questionMode === 'tap_to_fill' ? 'Toggle correct option' : 'Set as the single correct answer'}
                    onClick={() => {
                      if (questionMode === 'msq' || questionMode === 'tap_to_fill') {
                        // Toggle this option's correctness freely
                        const copy = optionsBinding.map((o, i) => i === idx ? { ...o, isCorrect: !o.isCorrect } : o);
                        setOptionsBinding(copy);
                      } else {
                        // MCQ: only one correct at a time
                        const copy = optionsBinding.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setOptionsBinding(copy);
                      }
                    }}
                    style={{
                      width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: opt.isCorrect
                        ? (questionMode === 'msq' || questionMode === 'tap_to_fill' ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'linear-gradient(135deg,#10b981,#059669)')
                        : '#1e293b',
                      color: opt.isCorrect ? '#fff' : '#475569',
                      fontSize: '16px', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {opt.isCorrect ? (questionMode === 'msq' || questionMode === 'tap_to_fill' ? '☑️' : '✅') : '⬜'}
                  </button>

                  {/* Label */}
                  <span style={{ fontSize: '11px', width: '100px', fontWeight: 700, color: opt.isCorrect ? (questionMode === 'msq' || questionMode === 'tap_to_fill' ? '#a78bfa' : '#10b981') : '#64748b', flexShrink: 0 }}>
                    {opt.isCorrect ? (questionMode === 'msq' || questionMode === 'tap_to_fill' ? `✓ Target ${idx + 1}` : '✅ Correct') : `○ Option ${idx + 1}`}
                  </span>

                   {/* Column picker (Label) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Label Text</span>
                    <select
                      className="grid-select"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                      value={opt.column}
                      onChange={(e) => {
                        const copy = [...optionsBinding];
                        copy[idx] = { ...copy[idx], column: e.target.value };
                        setOptionsBinding(copy);
                      }}
                    >
                      <option value="" disabled>-- Select Column --</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Column picker (Image URL) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Image Column (optional)</span>
                    <select
                      className="grid-select"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                      value={opt.imageColumn || ''}
                      onChange={(e) => {
                        const copy = [...optionsBinding];
                        copy[idx] = { ...copy[idx], imageColumn: e.target.value || undefined };
                        setOptionsBinding(copy);
                      }}
                    >
                      <option value="">-- None / No Image --</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Column picker (Audio URL) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Audio Column (optional)</span>
                    <select
                      className="grid-select"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                      value={opt.audioColumn || ''}
                      onChange={(e) => {
                        const copy = [...optionsBinding];
                        copy[idx] = { ...copy[idx], audioColumn: e.target.value || undefined };
                        setOptionsBinding(copy);
                      }}
                    >
                      <option value="">-- None / No Audio --</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Remove option row */}
                  <button
                    title="Remove this option row"
                    onClick={() => setOptionsBinding(prev => prev.filter((_, i) => i !== idx))}
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}
                  >✕</button>
                </div>
              ))}

              {/* Add option row */}
              <button
                onClick={() => setOptionsBinding(prev => [...prev, { column: columns[0] || '', isCorrect: false }])}
                style={{ marginTop: '4px', padding: '9px 18px', background: 'rgba(99,102,241,0.1)', border: '1.5px dashed #4f46e5', color: '#818cf8', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, alignSelf: 'flex-start', transition: 'all 0.15s ease' }}
              >+ Add Option Row</button>
            </div>

            {/* MSQ info badge */}
            {questionMode === 'msq' && (
              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', fontSize: '12px', color: '#c4b5fd', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px' }}>ℹ️</span>
                <span>
                  <strong>MSQ mode:</strong> {optionsBinding.filter(o => o.isCorrect).length} correct answer{optionsBinding.filter(o => o.isCorrect).length !== 1 ? 's' : ''} selected.
                  The compiled JSON will use <code style={{ background: '#1e1b4b', padding: '1px 5px', borderRadius: '4px' }}>engine: "msq"</code>, <code style={{ background: '#1e1b4b', padding: '1px 5px', borderRadius: '4px' }}>inputMode: "multi-choice"</code>, and <code style={{ background: '#1e1b4b', padding: '1px 5px', borderRadius: '4px' }}>validationRules: all_correct</code>.
                </span>
              </div>
            )}
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

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="grid-btn-primary" onClick={handlePublish} disabled={publishing}>
                {publishing ? 'Publishing live...' : '🚀 Publish Template Live'}
              </button>

              {/* Publish Raw JSON — only shown when a JSON was loaded via Parse & Load */}
              {rawLoadedJson && (
                <button
                  onClick={handlePublishRaw}
                  disabled={publishingRaw}
                  title="Save the exact loaded JSON to DB without recompiling"
                  style={{
                    background: publishingRaw ? '#374151' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: publishingRaw ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {publishingRaw ? '⏳ Saving...' : '📤 Publish Raw JSON'}
                </button>
              )}

              {/* Save Rows to Existing — only shown when a template was loaded */}
              {loadedTemplateId && (
                <button
                  onClick={handleSaveRowsToExisting}
                  disabled={savingRows}
                  style={{
                    background: savingRows ? '#374151' : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: savingRows ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {savingRows ? '⏳ Saving rows...' : '💾 Save Rows → Existing Template'}
                </button>
              )}

              {publishStatus && (
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.88rem' }}>
                  ✅ Published Successfully! ID: {publishStatus.id}
                </span>
              )}
            </div>

            {/* Loaded template badge */}
            {loadedTemplateId && (
              <div style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1.5px solid rgba(14, 165, 233, 0.25)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                color: '#7dd3fc'
              }}>
                <span>📋</span>
                <span>Loaded template:</span>
                <code style={{ background: '#0f172a', padding: '2px 8px', borderRadius: '4px', color: '#f0f9ff', fontWeight: 700 }}>
                  {loadedTemplateId}
                </code>
                <button
                  onClick={() => { setLoadedTemplateId(null); setSaveRowsStatus(null); }}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}
                  title="Clear loaded template"
                >✕</button>
              </div>
            )}

            {saveRowsStatus && (
              <div style={{
                marginTop: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: saveRowsStatus.ok ? '#10b981' : '#f87171'
              }}>
                {saveRowsStatus.msg}
              </div>
            )}
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

            {/* Render evaluated parts if present, otherwise fallback to blueprint */}
            {(() => {
              const evaluatedParts = getEvaluatedParts();
              if (evaluatedParts) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                    {evaluatedParts.map((part, pIdx) => {
                      if (part.type === 'audio') {
                        return (
                          <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => {
                                try {
                                  const audio = new Audio(part.content);
                                  audio.play();
                                } catch (e) {
                                  console.warn('Failed to play preview audio:', e);
                                }
                              }}
                              style={{ background: '#2563eb', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                            >
                              🔊
                            </button>
                            {part.label && <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#475569' }}>{part.label}</span>}
                          </div>
                        );
                      }
                      if (part.type === 'image') {
                        return (
                          <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', margin: '8px 0' }}>
                            <img
                              src={part.content || null}
                              alt={part.label || "Preview Image"}
                              style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                            {part.label && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{part.label}</span>}
                          </div>
                        );
                      }
                      return (
                        <div key={pIdx} style={{ fontSize: '1.02rem', lineHeight: '1.6', color: '#0f172a', whiteSpace: 'pre-line', fontWeight: part.type === 'text' && part.content.startsWith('_') ? 'bold' : 'normal' }}>
                          {renderMathText(part.content)}
                        </div>
                      );
                    })}
                  </div>
                );
              }
              
              return (
                <div style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#0f172a', whiteSpace: 'pre-line' }}>
                  {renderEvaluatedText(blueprint)}
                </div>
              );
            })()}

            {/* Render MCQ Option choices / Ordering Tiles */}
            {questionMode === 'sentence_ordering' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '20px', width: '100%' }}>
                {/* Empty Drop Slots */}
                <div style={{
                  display: 'flex',
                  justify: 'center',
                  gap: '12px',
                  padding: '16px',
                  width: '100%',
                  borderRadius: '16px',
                  border: '2px dashed #93c5fd',
                  background: '#eff6ff'
                }}>
                  {optionsBinding.map((_, sIdx) => (
                    <div key={`slot-${sIdx}`} style={{
                      width: '48px',
                      height: '54px',
                      borderRadius: '12px',
                      border: '2px dashed #60a5fa',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      _
                    </div>
                  ))}
                </div>

                {/* Pool Tray Tiles */}
                <div style={{
                  display: 'flex',
                  justify: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '14px',
                  width: '100%',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc'
                }}>
                  {optionsBinding.map((opt, idx) => {
                    const row = rows[activeRowIndex] || {};
                    const cellVal = row[opt.column] || `[${opt.column || '?'}]`;
                    return (
                      <div key={idx} style={{
                        width: '48px',
                        height: '54px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                        border: '2px solid #60a5fa',
                        cursor: 'pointer'
                      }}>
                        {cellVal}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                {optionsBinding.map((opt, idx) => {
                  const row = rows[activeRowIndex] || {};
                  const cellVal = row[opt.column] || `{{${opt.column || 'Select Column'}}}`;
                  const imageVal = opt.imageColumn ? row[opt.imageColumn] : null;
                  const audioVal = opt.audioColumn ? row[opt.audioColumn] : null;
                  return (
                    <div key={idx} style={{
                      background: '#f8fafc',
                      border: opt.isCorrect ? '2px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #cbd5e1',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      color: '#1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      {imageVal && (
                        <img
                          src={imageVal || null}
                          alt="Option visual"
                          style={{ maxWidth: '120px', maxHeight: '90px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cbd5e1', alignSelf: 'center', marginBottom: '4px' }}
                        />
                      )}
                      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {audioVal && (
                            <button
                              title="Play option audio sound"
                              onClick={() => {
                                try {
                                  const audio = new Audio(audioVal);
                                  audio.play();
                                } catch (e) {
                                  console.warn('Failed to play preview audio:', e);
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', color: '#2563eb', padding: 0 }}
                            >🔊</button>
                          )}
                          <span>{renderMathText(cellVal)}</span>
                        </div>
                        {opt.isCorrect && <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.78rem' }}>CORRECT ANSWER</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Render Explanation Solution */}
            {solution.trim() && (
              <div style={{ marginTop: '28px', background: 'rgba(16, 185, 129, 0.03)', border: '1.5px dashed rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>🎒 Step-by-step Solution</div>
                <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {renderEvaluatedText(solution)}
                </div>
              </div>
            )}
          </div>
          
          <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', padding: '16px', borderRadius: '16px', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>ℹ️ Parallel Array Compilation</div>
            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5 }}>
              This editor automatically compiles your rows into parallel list arrays (<code>[val1, val2, ...][index]</code>) mapped to a single synchronized <code>index</code> variable.
            </p>
            <p style={{ margin: '8px 0 0', color: '#64748b', lineHeight: 1.5 }}>
              This guarantees that the platform's execution engine shuffles cell values synchronously, with <strong>zero dynamic formula errors</strong>!
            </p>
          </div>

        </div>

      </div>

      {/* ── Image Picker Modal ── */}
      {isImgModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '680px',
            maxWidth: '95%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
            border: '1.5px solid #bfdbfe',
            overflow: 'hidden',
            fontFamily: 'inherit'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1.5px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                🖼️ Image Picker & Uploader
              </h3>
              <button
                onClick={() => setIsImgModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderBottom: '1.5px solid #cbd5e1',
              padding: '8px 20px',
              gap: '8px'
            }}>
              <button
                onClick={() => setImgModalTab('gallery')}
                style={{
                  background: imgModalTab === 'gallery' ? 'white' : 'transparent',
                  borderStyle: 'solid',
                  borderWidth: imgModalTab === 'gallery' ? '1px 1px 0 1px' : '0px',
                  borderColor: '#cbd5e1',
                  borderRadius: '6px 6px 0 0',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: imgModalTab === 'gallery' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                🖼️ Pick from Gallery
              </button>
              <button
                onClick={() => setImgModalTab('upload')}
                style={{
                  background: imgModalTab === 'upload' ? 'white' : 'transparent',
                  borderStyle: 'solid',
                  borderWidth: imgModalTab === 'upload' ? '1px 1px 0 1px' : '0px',
                  borderColor: '#cbd5e1',
                  borderRadius: '6px 6px 0 0',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: imgModalTab === 'upload' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                📁 Upload New Image
              </button>
              <button
                onClick={() => setImgModalTab('web')}
                style={{
                  background: imgModalTab === 'web' ? 'white' : 'transparent',
                  borderStyle: 'solid',
                  borderWidth: imgModalTab === 'web' ? '1px 1px 0 1px' : '0px',
                  borderColor: '#cbd5e1',
                  borderRadius: '6px 6px 0 0',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: imgModalTab === 'web' ? '#2563eb' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                🔍 Web Search
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {imgModalTab === 'gallery' && (
                <div>
                  {/* Search Bar */}
                  <input
                    type="text"
                    className="grid-input"
                    placeholder="🔍 Search gallery by filename or tags..."
                    value={modalSearchText}
                    onChange={(e) => setModalSearchText(e.target.value)}
                    style={{ marginBottom: '16px' }}
                  />

                  {modalGalleryLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                      ⏳ Loading gallery illustration assets...
                    </div>
                  ) : (
                    <div>
                      {/* Image Cards Grid */}
                      {(() => {
                        const filtered = modalGalleryImages.filter(img => {
                          if (!modalSearchText.trim()) return true;
                          const q = modalSearchText.toLowerCase();
                          return (img.key || '').toLowerCase().includes(q);
                        });

                        if (filtered.length === 0) {
                          return (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', border: '1.5px dashed #cbd5e1', borderRadius: '12px' }}>
                              No matching illustrations found in R2 database. Try uploading one!
                            </div>
                          );
                        }

                        return (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                            gap: '12px'
                          }}>
                            {filtered.map((img, idx) => {
                              const imgUrl = img.r2Url || `https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/${img.key}`;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (imgModalTarget) {
                                      const { rIdx, col } = imgModalTarget;
                                      handleCellChange(rIdx, col, imgUrl);
                                    }
                                    setIsImgModalOpen(false);
                                  }}
                                  style={{
                                    border: '1.5px solid #cbd5e1',
                                    borderRadius: '10px',
                                    padding: '6px',
                                    background: '#f8fafc',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#2563eb';
                                    e.currentTarget.style.background = '#eff6ff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.background = '#f8fafc';
                                  }}
                                >
                                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                    <img
                                      src={imgUrl || null}
                                      alt="Gallery Clipart"
                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                                    />
                                  </div>
                                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={img.key.split('/').pop()}>
                                    {img.key.split('/').pop()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {imgModalTab === 'upload' && (
                <form onSubmit={handleUploadImage} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
                  <div style={{
                    border: '2px dashed #bfdbfe',
                    borderRadius: '12px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: '#f0f9ff'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setModalUploadFile(e.target.files[0])}
                      style={{ display: 'none' }}
                      id="modal-file-upload-input"
                    />
                    <label
                      htmlFor="modal-file-upload-input"
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '2.5rem' }}>📁</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb' }}>
                        {modalUploadFile ? modalUploadFile.name : 'Select an image file to upload'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Supports JPG, PNG, WEBP, SVG up to 5MB
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="grid-btn-primary"
                    disabled={modalUploading || !modalUploadFile}
                    style={{
                      alignSelf: 'center',
                      background: modalUploading ? '#64748b' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: modalUploading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {modalUploading ? '⏳ Uploading...' : '🚀 Upload & Set Cell Value'}
                  </button>
                </form>
              )}

              {imgModalTab === 'web' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Search Bar Form */}
                  <form
                    onSubmit={e => { e.preventDefault(); handleWebSearch(); }}
                    style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                  >
                    <input
                      type="text"
                      className="grid-input"
                      placeholder="Search DuckDuckGo (e.g. chopping wood)..."
                      value={webSearchQuery}
                      onChange={e => setWebSearchQuery(e.target.value)}
                      style={{ flex: 1, minWidth: 160 }}
                    />
                    <select
                      className="grid-select"
                      value={webSearchType}
                      onChange={e => setWebSearchType(e.target.value)}
                      style={{ width: 120 }}
                    >
                      <option value="clipart">🎨 Clipart</option>
                      <option value="photo">📷 Photo</option>
                      <option value="any">🌐 Any</option>
                    </select>
                    <button
                      type="submit"
                      className="grid-btn-primary"
                      disabled={webSearchLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {webSearchLoading ? '⏳ Searching...' : '🔍 Search'}
                    </button>
                  </form>

                  {/* Search Results Grid */}
                  {(() => {
                    if (webSearchLoading) {
                      return <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Searching Web Images (via DuckDuckGo)...</div>;
                    }
                    if (webSearchResults.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌐</div>
                          <div style={{ fontSize: '0.85rem' }}>Enter a keyword and click Search to query DuckDuckGo</div>
                        </div>
                      );
                    }

                    return (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: '12px',
                        maxHeight: '45vh',
                        overflowY: 'auto',
                        padding: '4px'
                      }}>
                        {webSearchResults.map((item, idx) => {
                          const isDownloading = webSearchSelectedUrl === item.image;
                          return (
                            <div
                              key={idx}
                              title={item.title}
                              onClick={() => {
                                if (!webSearchSelectedUrl) handleWebSearchSelect(item);
                              }}
                              style={{
                                background: '#f8fafc',
                                border: isDownloading ? '2.5px solid #2563eb' : '2.5px solid #cbd5e1',
                                borderRadius: '10px',
                                padding: '6px',
                                cursor: isDownloading ? 'wait' : (webSearchSelectedUrl ? 'not-allowed' : 'pointer'),
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s',
                                minHeight: '110px',
                                position: 'relative',
                                opacity: (!!webSearchSelectedUrl && !isDownloading) ? 0.6 : 1
                              }}
                              onMouseEnter={e => {
                                if (!webSearchSelectedUrl) {
                                  e.currentTarget.style.borderColor = '#2563eb';
                                  e.currentTarget.style.transform = 'scale(1.03)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!webSearchSelectedUrl) {
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                <img
                                  src={item.thumbnail || item.image || null}
                                  alt=""
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                                  loading="lazy"
                                  onError={e => { e.target.style.opacity = '.3'; }}
                                />
                              </div>
                              <div style={{
                                fontSize: '0.62rem',
                                color: '#475569',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                textAlign: 'center'
                              }}>
                                {item.source || 'Web Image'}
                              </div>
                              {isDownloading && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0, left: 0, right: 0, bottom: 0,
                                  background: 'rgba(255, 255, 255, 0.7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#2563eb',
                                  borderRadius: '8px'
                                }}>
                                  ⏳ Saving...
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import CSV & Paste Raw Data Modal */}
      {isCsvModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1.5px solid #334155',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  📥 Import & Paste CSV Data
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                  Paste raw CSV / TSV text directly or upload a .csv file from your computer.
                </p>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Paste Raw CSV Area */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                📋 Option 1: Paste Raw CSV / TSV Text
              </label>
              <textarea
                style={{
                  width: '100%',
                  minHeight: '180px',
                  background: '#020617',
                  color: '#f8fafc',
                  border: '1.5px solid #334155',
                  borderRadius: '10px',
                  padding: '12px',
                  fontFamily: 'Courier, monospace',
                  fontSize: '0.82rem',
                  lineHeight: 1.4
                }}
                value={rawCsvInputText}
                onChange={(e) => setRawCsvInputText(e.target.value)}
                placeholder={`id,target_word,target_audio,target_image,Result,distractor_1,explanation
K1_PHON_001,"apple","audio_apple_v1","placeholder_apple_img","a","m","The word apple begins with short 'a'..."
K1_PHON_002,"bear","audio_bear_v1","placeholder_bear_img","b","s","The word bear begins with..."`}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!rawCsvInputText || !rawCsvInputText.trim()) {
                      alert('Please paste CSV text first!');
                      return;
                    }
                    const { columns: parsedCols, rows: parsedRows } = parseCsvText(rawCsvInputText);
                    if (!parsedCols || parsedCols.length === 0 || !parsedRows || parsedRows.length === 0) {
                      alert('⚠️ No valid columns or rows found in pasted CSV text.');
                      return;
                    }

                    setColumns(parsedCols);
                    setRows(parsedRows);
                    setActiveRowIndex(0);

                    const resCol = parsedCols.find(c => c.toLowerCase().includes('result') || c.toLowerCase().includes('correct') || c.toLowerCase().includes('answer'));
                    const disCols = parsedCols.filter(c => c !== resCol && (c.toLowerCase().includes('distractor') || c.toLowerCase().includes('opt') || c.toLowerCase().includes('wrong')));

                    if (resCol) {
                      const newBindings = [{ column: resCol, isCorrect: true, misconception: '' }];
                      disCols.forEach(c => newBindings.push({ column: c, isCorrect: false, misconception: '' }));
                      setOptionsBinding(newBindings);
                    }

                    setIsCsvModalOpen(false);
                    setRawCsvInputText('');
                    alert(`✅ Successfully parsed & loaded ${parsedRows.length} rows and ${parsedCols.length} columns into spreadsheet grid!`);
                  }}
                  style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ⚡ Parse & Load into Spreadsheet Grid
                </button>
              </div>
            </div>

            {/* File Upload Option */}
            <div style={{ padding: '16px', background: '#1e293b', borderRadius: '12px', border: '1px border #334155', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                📁 Option 2: Upload .CSV File from Computer
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  handleCSVUpload(e);
                  setIsCsvModalOpen(false);
                }}
                style={{ color: '#94a3b8', fontSize: '12px' }}
              />
            </div>

            {/* Blueprints Accordion */}
            <details style={{ background: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '12px', color: '#94a3b8' }}>
                📄 View Sample CSV Blueprints
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '12px', background: '#0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#38bdf8' }}>
                      🔤 Phonics & Consonant Blends
                    </span>
                    <button
                      onClick={() => downloadSampleCSV('phonics')}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      ⬇️ Download Sample
                    </button>
                  </div>
                  <pre style={{ background: '#020617', color: '#38bdf8', padding: '8px', borderRadius: '6px', fontSize: '0.72rem', overflowX: 'auto', margin: 0 }}>
{`target_word,target_image,target_audio,Result_word,Distractor1_word
drop,https://.../drop.jpg,/api/tts?text=drop,dr,tr`}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Direct Google Sheets Sync & Save Modal */}
      {isGoogleSheetModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '640px',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>📊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Google Sheets 2-Way Integration
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                    Live Import & Write-Back Sync
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setIsGoogleSheetModalOpen(false); setGoogleSheetError(null); setGoogleSheetPushSuccess(null); }}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => { setGoogleSheetTab('read'); setGoogleSheetError(null); setGoogleSheetPushSuccess(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: googleSheetTab === 'read' ? '#eff6ff' : 'transparent',
                  color: googleSheetTab === 'read' ? '#2563eb' : '#64748b'
                }}
              >
                📥 Read / Import from Google Sheet
              </button>
              <button
                type="button"
                onClick={() => { setGoogleSheetTab('push'); setGoogleSheetError(null); setGoogleSheetPushSuccess(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: googleSheetTab === 'push' ? '#ecfdf5' : 'transparent',
                  color: googleSheetTab === 'push' ? '#059669' : '#64748b'
                }}
              >
                💾 Live Save / Write-Back to Google Sheet
              </button>
            </div>

            {googleSheetTab === 'read' && (
              <div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  Paste your <strong>Google Sheet Link or Sheet ID</strong>. Make sure your Google Sheet sharing is set to <strong>"Anyone with the link can view"</strong>.
                </p>

                <form onSubmit={handleFetchGoogleSheet} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="mc-dev-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Google Sheet Link / ID
                    </label>
                    <input
                      className="grid-input"
                      placeholder="e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      value={googleSheetInput}
                      onChange={(e) => setGoogleSheetInput(e.target.value)}
                      style={{ fontSize: '0.88rem', padding: '12px' }}
                      disabled={fetchingGoogleSheet}
                    />
                  </div>

                  {googleSheetError && (
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600 }}>
                      ⚠️ {googleSheetError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsGoogleSheetModalOpen(false)}
                      className="grid-btn-secondary"
                      disabled={fetchingGoogleSheet}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="grid-btn-primary"
                      disabled={fetchingGoogleSheet || !googleSheetInput.trim()}
                      style={{ background: fetchingGoogleSheet ? '#64748b' : 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', padding: '10px 24px' }}
                    >
                      {fetchingGoogleSheet ? '⏳ Syncing Google Sheet...' : '⚡ Sync & Load Table'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {googleSheetTab === 'push' && (
              <div>
                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                  Overwrites your live Google Sheet with all updated <strong>R2 Image URLs</strong> and <strong>TTS Audio URLs</strong> using a Google Apps Script Webhook.
                </p>

                <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px', background: '#f8fafc', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1e3a8a' }}>
                      📋 Quick 10-Second Setup: Apps Script Webhook Code
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const scriptCode = `function doPost(e) {\n  try {\n    var data = JSON.parse(e.postData.contents);\n    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();\n    sheet.clear();\n    if (data.columns && data.columns.length > 0) { sheet.appendRow(data.columns); }\n    if (data.rows && data.rows.length > 0) {\n      data.rows.forEach(function(rowObj) {\n        var rowValues = data.columns.map(function(col) { return rowObj[col] !== undefined ? rowObj[col] : ''; });\n        sheet.appendRow(rowValues);\n      });\n    }\n    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);\n  } catch (err) {\n    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);\n  }\n}`;
                        navigator.clipboard.writeText(scriptCode);
                        alert('📋 Apps Script Code copied to clipboard!');
                      }}
                      style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      📋 Copy Code
                    </button>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#334155', lineHeight: 1.5 }}>
                    <li>In Google Sheets, go to <strong>Extensions ➔ Apps Script</strong>.</li>
                    <li>Paste the copied code and click <strong>Save</strong>.</li>
                    <li>Click <strong>Deploy ➔ New Deployment ➔ Select type: Web app</strong>.</li>
                    <li>Set <em>"Who has access"</em> to <strong>"Anyone"</strong> and click <strong>Deploy</strong>.</li>
                    <li>Copy the resulting Web app URL and paste it below!</li>
                  </ol>
                </div>

                <form onSubmit={handlePushToGoogleSheet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="mc-dev-label" style={{ display: 'block', marginBottom: '6px' }}>
                      Apps Script Webhook URL
                    </label>
                    <input
                      className="grid-input"
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      style={{ fontSize: '0.85rem', padding: '10px' }}
                      disabled={pushingToGoogleSheet}
                    />
                  </div>

                  {googleSheetError && (
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600 }}>
                      ⚠️ {googleSheetError}
                    </div>
                  )}

                  {googleSheetPushSuccess && (
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: '0.82rem', fontWeight: 700 }}>
                      {googleSheetPushSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsGoogleSheetModalOpen(false)}
                      className="grid-btn-secondary"
                      disabled={pushingToGoogleSheet}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="grid-btn-primary"
                      disabled={pushingToGoogleSheet || !webhookUrl.trim()}
                      style={{ background: pushingToGoogleSheet ? '#64748b' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', padding: '10px 24px' }}
                    >
                      {pushingToGoogleSheet ? '⏳ Saving Back to Google Sheet...' : '💾 Save Back to Live Google Sheet'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Column TTS Generator Modal */}
      {isAudioModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>🔊</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Generate Audio for Selected Column
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>
                    Instant TTS Audio URL Generator
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAudioModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              Select any text column (e.g. <strong>target_phoneme</strong>, <strong>character_name</strong>, <strong>distractor_1</strong>) to auto-generate TTS audio URLs for all 15+ rows!
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleGenerateAudioForSpecificColumn(targetTextColForAudio, selectedAudioVoice); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="mc-dev-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Select Text Column to Generate Audio For
                </label>
                <select
                  className="grid-select"
                  value={targetTextColForAudio}
                  onChange={(e) => setTargetTextColForAudio(e.target.value)}
                  style={{ fontSize: '0.88rem', padding: '10px' }}
                >
                  {columns.map((col, idx) => (
                    <option key={col + '-' + idx} value={col}>
                      {col} {col.endsWith('_audio') ? ' (Audio Column)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mc-dev-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Select Voice Accent / Character
                </label>
                <select
                  className="grid-select"
                  value={selectedAudioVoice}
                  onChange={(e) => setSelectedAudioVoice(e.target.value)}
                  style={{ fontSize: '0.88rem', padding: '10px' }}
                >
                  <option value="Puck">👦 Puck (Playful English Kid Voice)</option>
                  <option value="Fenrir">🧔 Fenrir (Deep Clear Expressive)</option>
                  <option value="Aoede">👩 Aoede (Warm Clear Female Teacher)</option>
                  <option value="Kore">👧 Kore (Gentle Friendly Female)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAudioModalOpen(false)}
                  className="grid-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="grid-btn-primary"
                  disabled={!targetTextColForAudio}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    padding: '10px 24px'
                  }}
                >
                  ⚡ Generate Audio for "{targetTextColForAudio}"
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function TemplateSidebar({ templates = [], onSelectTemplate, onClose, activeTemplateId }) {
  const [search, setSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [expandedGrades, setExpandedGrades] = useState({});

  const getGradeCategory = (g) => {
    const grade = String(g || '').toLowerCase().trim();
    if (grade.includes('lkg') || grade.includes('pre-k') || grade.includes('nursery')) return 'Pre-K / LKG';
    if (grade.includes('ukg')) return 'Grade UKG';
    if (grade === '1' || grade.includes('grade 1') || grade.includes('grade-1')) return 'Class 1';
    if (grade === '2' || grade.includes('grade 2') || grade.includes('grade-2')) return 'Class 2';
    if (grade === '3' || grade.includes('grade 3') || grade.includes('grade-3')) return 'Class 3';
    if (grade === '4' || grade.includes('grade 4') || grade.includes('grade-4')) return 'Class 4';
    if (grade === '5' || grade.includes('grade 5') || grade.includes('grade-5')) return 'Class 5';
    return 'General / Unassigned';
  };

  const getSubjectCategory = (s) => {
    const sub = String(s || '').toLowerCase().trim();
    if (sub.includes('eng')) return 'English';
    if (sub.includes('math')) return 'Maths';
    if (sub.includes('sci')) return 'Science';
    return 'General';
  };

  const filteredTemplates = templates.filter(t => {
    const config = t.config || t;
    const title = config.title || t.title || t.name || t.id || '';
    const topic = config.topic || t.topic || '';
    const subject = config.subject || t.subject || '';
    const skillId = config.skillId || t.skillId || '';

    const matchesSearch = !search.trim() ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      topic.toLowerCase().includes(search.toLowerCase()) ||
      subject.toLowerCase().includes(search.toLowerCase()) ||
      skillId.toLowerCase().includes(search.toLowerCase());

    const normSub = getSubjectCategory(subject);
    const matchesSubject = selectedSubjectFilter === 'All' || normSub === selectedSubjectFilter;

    return matchesSearch && matchesSubject;
  });

  const categorized = React.useMemo(() => {
    const map = {};
    const gradeOrder = ['Pre-K / LKG', 'Grade UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'General / Unassigned'];
    gradeOrder.forEach(g => { map[g] = {}; });

    filteredTemplates.forEach(t => {
      const config = t.config || t;
      const gradeCat = getGradeCategory(config.grade || t.grade);
      const subCat = getSubjectCategory(config.subject || t.subject);

      if (!map[gradeCat]) map[gradeCat] = {};
      if (!map[gradeCat][subCat]) map[gradeCat][subCat] = [];

      map[gradeCat][subCat].push(t);
    });

    return map;
  }, [filteredTemplates]);

  const toggleGrade = (g) => {
    setExpandedGrades(prev => ({ ...prev, [g]: prev[g] === undefined ? false : !prev[g] }));
  };

  useEffect(() => {
    if (search.trim()) {
      const allExpanded = {};
      Object.keys(categorized).forEach(g => { allExpanded[g] = true; });
      setExpandedGrades(allExpanded);
    }
  }, [search, categorized]);

  return (
    <aside style={{
      width: '320px',
      background: '#ffffff',
      borderRight: '1.5px solid #cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px',
      boxShadow: '4px 0 20px rgba(148, 163, 184, 0.08)',
      zIndex: 20
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1.5px solid #e2e8f0',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📚</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#1e3a8a' }}>
              Class & Subject Catalog
            </h3>
            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '700' }}>
              {filteredTemplates.length} Templates
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '800'
          }}
          title="Close Sidebar"
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <input
          type="text"
          placeholder="🔍 Search class, subject, topic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        padding: '8px 14px',
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid #f1f5f9',
        overflowX: 'auto'
      }}>
        {['All', 'English', 'Maths', 'Science'].map(sub => (
          <button
            key={sub}
            onClick={() => setSelectedSubjectFilter(sub)}
            style={{
              padding: '3px 9px',
              borderRadius: '14px',
              fontSize: '11px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: selectedSubjectFilter === sub ? '#2563eb' : '#f1f5f9',
              color: selectedSubjectFilter === sub ? '#ffffff' : '#475569'
            }}
          >
            {sub}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {Object.entries(categorized).map(([gradeName, subjectsMap]) => {
          const totalInGrade = Object.values(subjectsMap).reduce((acc, arr) => acc + arr.length, 0);
          if (totalInGrade === 0) return null;

          const isExpanded = expandedGrades[gradeName] !== false;

          return (
            <div key={gradeName} style={{ marginBottom: '10px' }}>
              <button
                onClick={() => toggleGrade(gradeName)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{isExpanded ? '📂' : '📁'} {gradeName}</span>
                <span style={{
                  background: '#e2e8f0',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  color: '#475569'
                }}>
                  {totalInGrade}
                </span>
              </button>

              {isExpanded && (
                <div style={{ paddingLeft: '6px', marginTop: '6px' }}>
                  {Object.entries(subjectsMap).map(([subName, items]) => {
                    if (items.length === 0) return null;

                    return (
                      <div key={subName} style={{ marginBottom: '8px' }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: subName === 'English' ? '#2563eb' : subName === 'Maths' ? '#059669' : '#7c3aed',
                          padding: '3px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {subName === 'English' ? '📘' : subName === 'Maths' ? '🔢' : '🔬'} {subName} ({items.length})
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                          {items.map(tpl => {
                            const config = tpl.config || tpl;
                            const tTitle = config.title || tpl.name || tpl.id || 'Untitled Template';
                            const tId = tpl.id || String(tpl._id);
                            const isSelected = activeTemplateId === tId || activeTemplateId === tTitle;

                            return (
                              <div
                                key={tId}
                                onClick={() => onSelectTemplate(tpl)}
                                style={{
                                  padding: '7px 9px',
                                  borderRadius: '8px',
                                  border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                                  background: isSelected ? '#eff6ff' : '#ffffff',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#1e293b', lineHeight: 1.35 }}>
                                  {tTitle}
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                                  <span style={{
                                    fontSize: '9px',
                                    fontWeight: '800',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    background: subName === 'English' ? '#dbeafe' : '#d1fae5',
                                    color: subName === 'English' ? '#1e40af' : '#065f46'
                                  }}>
                                    {subName}
                                  </span>

                                  {config.topic && (
                                    <span style={{ fontSize: '9px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {config.topic}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
