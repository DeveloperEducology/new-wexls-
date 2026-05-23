'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestionRenderer from '../../components/practice/QuestionRenderer';
import LabLayout from '../../components/practice/LabLayout';
import PracticeFeedback from '../../components/practice/PracticeFeedback';
import styles from '../../components/practice/FactoryLayout.module.css';
import { isAnswerCorrect } from '../../lib/practice/answerValidation';
import { resolveCompetency } from '../../lib/competency';
import { 
  isClientTtsSupported, 
  getStoredVoiceModels, 
  preloadVoiceModel, 
  removeVoiceModel, 
  normalizeVoiceId 
} from '../../lib/ttsBrowserEngine';
import { speakText } from '../../lib/ttsClient';
import {
  appendAttempt,
  calculateSmartScore,
  createAttempt,
  loadMasteryState,
  saveMasteryState,
  updateMasteryState,
} from '../../lib/mastery';
import { additionSkillsByGrade } from '../../lib/practice/generators/math/topics/addition/skills/index.js';
import { multiplicationSkillsByGrade } from '../../lib/practice/generators/math/topics/multiplication/skills/index.js';

import { subtractionSkillsByGrade } from '../../lib/practice/generators/math/topics/subtraction/skills/index.js';
import { placeValueSkillsByGrade } from '../../lib/practice/generators/math/topics/place-values/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../../lib/practice/generators/science/topics/units-measurement/skills/index.js';
import { grammarSkillsByGrade } from '../../lib/practice/generators/english/topics/grammar/skills/index.js';
import { shapesSkillsByGrade } from '../../lib/practice/generators/math/topics/shapes/skills/index.js';

const UNITS_MEASUREMENT_OPTIONS = Object.entries(unitsMeasurementSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const ENGLISH_GRAMMAR_OPTIONS = Object.entries(grammarSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const MULTIPLICATION_OPTIONS = Object.entries(multiplicationSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const SHAPES_OPTIONS = Object.entries(shapesSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const gradeLabel = (grade) => {
  if (grade === 'remediation') return 'Remediation';
  if (grade === 'prek') return 'Pre-K';
  return `Grade ${grade}`;
};

const ADDITION_TOPIC_OPTIONS = Object.entries(additionSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
));

const SUBTRACTION_TOPIC_OPTIONS = Object.entries(subtractionSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
));

const TIME_OPTIONS = [
  { group: 'Calendar', label: 'Days of the week', value: 'v1_days_of_week' },
  { group: 'Calendar', label: 'Order days of the week', value: 'order_days' },
  { group: 'Calendar', label: 'Seasons of the year', value: 'v2_seasons' },
  { group: 'Calendar', label: 'Order seasons', value: 'order_seasons' },
  { group: 'Calendar', label: 'Read a calendar', value: 'v3_calendar' },
  { group: 'Calendar', label: 'Months of the year', value: 'v4_months' },
  { group: 'Calendar', label: 'Days in each month', value: 'm5_days_in_month' },
  { group: 'Units', label: 'Relate time units', value: 'm6_relate_time_units' },
  { group: 'Clocks', label: 'A.M. or P.M.', value: 'v5_am_pm' },
  { group: 'Clocks', label: 'Match analogue clocks and times', value: 'match_analog_clock_words' },
  { group: 'Clocks', label: 'Match digital clocks and times', value: 'match_digital_clock' },
  { group: 'Clocks', label: 'Read clocks and write times', value: 'o3_read_clock' },
  { group: 'Clocks', label: 'Elapsed time', value: 'o5_elapsed_time' },
  { group: 'Clocks', label: 'Time patterns', value: 'o7_time_patterns' },
];

const FRACTIONS_OPTIONS = [
  { group: 'Visual Models', label: 'Identify fractions from models', value: 'fractions-g2-identify-visual' },
  { group: 'Visual Models', label: 'Identify like and unlike fractions', value: 'fractions-g3-like-unlike' },
  { group: 'Visual Models', label: 'Identify proper, improper, and mixed fractions', value: 'fractions-g3-types' },
  { group: 'Visual Models', label: 'Identify fractions from shapes', value: 'visual_models_identify' },
  { group: 'Visual Models', label: 'Write fractions from shapes', value: 'visual_models_write_fraction' },
  { group: 'Visual Models', label: 'Equal parts', value: 'visual_models_equal_parts' },
  { group: 'Visual Models', label: 'Fraction of a set', value: 'visual_models_fraction_of_set' },
  { group: 'Visual Models', label: 'Mixed numbers from models', value: 'visual_models_mixed_numbers' },
  { group: 'Interactive Models', label: 'Remove parts from a circle', value: 'visual_models_remove_fraction_pie' },
  { group: 'Interactive Models', label: 'Remove parts from a square', value: 'visual_models_remove_fraction_square' },
  { group: 'Interactive Models', label: 'Remove parts from a rectangle', value: 'visual_models_remove_fraction_rectangle' },
  { group: 'Interactive Models', label: 'Remove parts from a fraction bar', value: 'visual_models_remove_fraction_bar' },
  { group: 'Interactive Models', label: 'Fill parts of a circle', value: 'visual_models_fill_fraction_pie' },
  { group: 'Interactive Models', label: 'Fill parts of a square', value: 'visual_models_fill_fraction_square' },
  { group: 'Interactive Models', label: 'Fill parts of a rectangle', value: 'visual_models_fill_fraction_rectangle' },
  { group: 'Conversions', label: 'Convert improper fractions to mixed numbers', value: 'fractions-g5-convert-improper-to-mixed' },
  { group: 'Conversions', label: 'Convert mixed numbers to improper fractions', value: 'fractions-g5-convert-mixed-to-improper' },
  { group: 'Comparisons', label: 'Compare like fractions', value: 'fractions-g5-compare-like-fractions' },
  { group: 'Comparisons', label: 'Compare unlike fractions', value: 'fractions-g5-compare-unlike-fractions' },
  { group: 'Comparisons', label: 'Compare proper fractions', value: 'fractions-g5-compare-proper-fractions' },
  { group: 'Operations', label: 'Add like fractions', value: 'fractions-g5-add-like-fractions' },
  { group: 'Operations', label: 'Add improper fractions', value: 'fractions-g5-add-improper-fractions' },
  { group: 'Operations', label: 'Add a fraction and an integer', value: 'fractions-g5-add-fraction-and-integer' },
  { group: 'Operations', label: 'Find the missing fraction addend', value: 'fractions-g5-missing-fraction-addend' },
  { group: 'Operations', label: 'Find the missing integer addend', value: 'fractions-g5-missing-integer-addend' },
  { group: 'Operations', label: 'Add three or more fractions', value: 'fractions-g5-add-multiple-fractions' },
  { group: 'Operations', label: 'Add and subtract fractions with unlike denominators', value: 'fractions-g5-add-subtract-unlike-denominators' },
];

const PLACE_VALUE_OPTIONS = Object.entries(placeValueSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
));

const SOCIAL_GK_OPTIONS = [
  { group: 'People', label: 'Identify famous persons', value: 'gk_identify_person_v1' },
  { group: 'People', label: 'Identify from images', value: 'gk_identify_image_v1' },
  { group: 'Facts', label: 'Personality trivia', value: 'gk_trivia_v1' },
  { group: 'Facts', label: 'Fill in the blanks', value: 'gk_fill_blanks_v1' },
  { group: 'Sorting', label: 'Political vs sports', value: 'gk_sort_people_v1' },
  { group: 'Reasoning', label: 'True or false', value: 'gk_true_false_v1' },
  { group: 'Reasoning', label: 'Spot the truth', value: 'gk_misconception_v1' },
  { group: 'Reasoning', label: 'Inference questions', value: 'gk_inference_v1' },
];

const TESTING_OPTIONS = [
  { group: 'Interactive', label: 'Interactive protractor', value: 'testing-protractor' },
  { group: 'Interactive', label: 'Copy drag/drop', value: 'testing-copy-drag-drop' },
  { group: 'Interactive', label: 'Categorization', value: 'testing-categorization' },
  { group: 'Visual Parts', label: 'Number line', value: 'testing-number-line' },
  { group: 'Visual Parts', label: 'Base-ten blocks', value: 'testing-base-ten-blocks' },
  { group: 'Visual Parts', label: 'Clock', value: 'testing-clock' },
  { group: 'Visual Parts', label: 'Missing time pattern', value: 'testing-clock-pattern' },
  { group: 'Visual Parts', label: 'Fraction model', value: 'testing-fraction-model' },
  { group: 'Composition', label: 'Mixed text/SVG/blank', value: 'testing-mixed-parts' },
  { group: 'Composition', label: 'Inputs + options', value: 'testing-doubles-plus-one-mixed' },
];

const LKG_OPTIONS = [
  // Shapes
  { group: 'Shapes', label: 'Name the shape', value: 'lkg-shapes-name-shape' },
  { group: 'Shapes', label: 'Circles', value: 'lkg-shapes-circles' },
  { group: 'Shapes', label: 'Squares', value: 'lkg-shapes-squares' },
  { group: 'Shapes', label: 'Triangles', value: 'lkg-shapes-triangles' },
  { group: 'Shapes', label: 'Rectangles', value: 'lkg-shapes-rectangles' },
  { group: 'Shapes', label: 'Circles, squares and triangles', value: 'lkg-shapes-mixed' },

  // Count to 3
  { group: 'Count to 3', label: 'Learn to count - up to 3', value: 'lkg-count3-learn' },
  { group: 'Count to 3', label: 'Count objects - up to 3', value: 'lkg-count3-objects' },
  { group: 'Count to 3', label: 'Count dots - up to 3', value: 'lkg-count3-dots' },
  { group: 'Count to 3', label: 'Count shapes - up to 3', value: 'lkg-count3-shapes' },
  { group: 'Count to 3', label: 'Count on ten frames - up to 3', value: 'lkg-count3-ten-frames' },
  { group: 'Count to 3', label: 'Show numbers on ten frames - up to 3', value: 'lkg-count3-show-ten-frames' },
  { group: 'Count to 3', label: 'Represent numbers - up to 3', value: 'lkg-count3-represent' },

  // Count to 5
  { group: 'Count to 5', label: 'Learn to count - up to 5', value: 'lkg-count5-learn' },
  { group: 'Count to 5', label: 'Count objects - up to 5', value: 'lkg-count5-objects' },
  { group: 'Count to 5', label: 'Count dots - up to 5', value: 'lkg-count5-dots' },
  { group: 'Count to 5', label: 'Count shapes - up to 5', value: 'lkg-count5-shapes' },
  { group: 'Count to 5', label: 'Count on ten frames - up to 5', value: 'lkg-count5-ten-frames' },
  { group: 'Count to 5', label: 'Show numbers on ten frames - up to 5', value: 'lkg-count5-show-ten-frames' },
  { group: 'Count to 5', label: 'Represent numbers - up to 5', value: 'lkg-count5-represent' },

  // Count to 10
  { group: 'Count to 10', label: 'Learn to count - up to 10', value: 'lkg-count10-learn' },
  { group: 'Count to 10', label: 'Count objects - up to 10', value: 'lkg-count10-objects' },
  { group: 'Count to 10', label: 'Count dots - up to 10', value: 'lkg-count10-dots' },
  { group: 'Count to 10', label: 'Count shapes - up to 10', value: 'lkg-count10-shapes' },
  { group: 'Count to 10', label: 'Count on ten frames - up to 10', value: 'lkg-count10-ten-frames' },
  { group: 'Count to 10', label: 'Show numbers on ten frames - up to 10', value: 'lkg-count10-show-ten-frames' },
  { group: 'Count to 10', label: 'Represent numbers - up to 10', value: 'lkg-count10-represent' },

  // Comparing
  { group: 'Comparing', label: 'Are there enough?', value: 'lkg-compare-enough' },
  { group: 'Comparing', label: 'More', value: 'lkg-compare-more' },
  { group: 'Comparing', label: 'Fewer', value: 'lkg-compare-fewer' },
  { group: 'Comparing', label: 'Fewer and more - compare by counting', value: 'lkg-compare-counting' },
  { group: 'Comparing', label: 'Compare in a mixed group', value: 'lkg-compare-mixed' },

  // Positions
  { group: 'Positions', label: 'Inside and outside', value: 'lkg-position-inside-outside' },
  { group: 'Positions', label: 'Above and below', value: 'lkg-position-above-below' },
  { group: 'Positions', label: 'Beside and next to', value: 'lkg-position-beside-next' },
  { group: 'Positions', label: 'Left and right', value: 'lkg-position-left-right' },
  { group: 'Positions', label: 'Left, middle and right', value: 'lkg-position-left-middle-right' },
  { group: 'Positions', label: 'Top and bottom', value: 'lkg-position-top-bottom' },
  { group: 'Positions', label: 'Top, middle and bottom', value: 'lkg-position-top-middle-bottom' },

  // Classify
  { group: 'Classify', label: 'Same', value: 'lkg-classify-same' },
  { group: 'Classify', label: 'Different', value: 'lkg-classify-different' },
  { group: 'Classify', label: 'Same and different', value: 'lkg-classify-same-different' },
  { group: 'Classify', label: 'Classify shapes by colour', value: 'lkg-classify-shapes-color' },
  { group: 'Classify', label: 'Classify and sort by colour', value: 'lkg-classify-sort-color' },
  { group: 'Classify', label: 'Classify and sort by shape', value: 'lkg-classify-sort-shape' },

  // Patterns
  { group: 'Patterns', label: 'Colour patterns', value: 'lkg-patterns-color' },
  { group: 'Patterns', label: 'Size patterns', value: 'lkg-patterns-size' },
  { group: 'Patterns', label: 'Shape patterns', value: 'lkg-patterns-shape' },
  { group: 'Patterns', label: 'What comes next?', value: 'lkg-patterns-next' },

  // Size
  { group: 'Size', label: 'Long and short', value: 'lkg-size-long-short' },
  { group: 'Size', label: 'Tall and short', value: 'lkg-size-tall-short' },
  { group: 'Size', label: 'Wide and narrow', value: 'lkg-size-wide-narrow' },
  { group: 'Size', label: 'Light and heavy', value: 'lkg-size-light-heavy' },

  // Money
  { group: 'Money', label: 'Coin values', value: 'lkg-money-coin-values' },
  { group: 'Money', label: 'Count 1-rupee coins', value: 'lkg-money-count-coins' },

  // Legacy fallback options
  { group: 'Counting (Legacy)', label: 'Learn to count - up to 5', value: 'lkg_counting_5' },
  { group: 'Counting (Legacy)', label: 'Learn to count - up to 10', value: 'lkg_comparison_5' }
];

const SOURCE_CONFIGS = {
  lkg: {
    label: 'LKG Practice',
    api: '/api/practice',
    badge: 'LKG',
    description: 'LKG mathematics interactive skill practice catalog.',
    defaultLogicType: 'lkg-count5-learn',
    subject: 'math',
    topic: 'lkg',
    options: LKG_OPTIONS,
    tips: [
      { label: 'Interactive badging', text: 'Click each object to badge it with its count sequence.' },
      { label: 'Web speech read-aloud', text: 'Click the speaker buttons to read instructions out loud.' },
    ],
  },
  'addition-topic': {
    label: 'Addition Practice',
    api: '/api/practice',
    badge: 'TOPIC',
    description: 'Topic-wise Addition engines, templates, and grade micro-skills.',
    defaultLogicType: 'addition-g1-e3-model-match-to-10',
    subject: 'math',
    topic: 'addition',
    options: ADDITION_TOPIC_OPTIONS,
    tips: [
      { label: 'Generator boundary', text: 'Engines create question JSON only.' },
      { label: 'Reusable skills', text: 'Grade skills pass config into shared template families.' },
    ],
  },
  subtraction: {
    label: 'Subtraction Practice',
    api: '/api/practice',
    badge: 'TOPIC',
    description: 'Topic-wise Subtraction engines, templates, and grade micro-skills.',
    defaultLogicType: 'subtraction-g1-c1-remove-cubes-to-10',
    subject: 'math',
    topic: 'subtraction',
    options: SUBTRACTION_TOPIC_OPTIONS,
    tips: [
      { label: 'Inverse model', text: 'Subtraction reuses the shared tool pattern, but students remove cubes from a row.' },
      { label: 'Generator boundary', text: 'Subtraction engines create question JSON only.' },
    ],
  },
  multiplication: {
  label: 'Multiplication Practice',
  api: '/api/practice',
  badge: 'TOPIC',
  description: 'Multiplication engines, templates, and grade micro-skills.',
  defaultLogicType: 'multiplication-g2-a1-facts-to-5',
  subject: 'math',
  topic: 'multiplication',
  options: MULTIPLICATION_OPTIONS,
  tips: [
    { label: 'Template families', text: 'Skills reuse multiplication templates.' },
    { label: 'Generator boundary', text: 'Engines create question JSON only.' },
  ],
},
  time: {
    label: 'Time Practice',
    api: '/api/practice',
    badge: 'TIME',
    description: 'Calendar, seasons, time units, clock reading, elapsed time, and time patterns.',
    defaultLogicType: 'v1_days_of_week',
    subject: 'math',
    topic: 'time',
    options: TIME_OPTIONS,
    tips: [
      { label: 'Shared shell', text: 'Time questions reuse the same renderers and feedback component.' },
      { label: 'Generator boundary', text: 'The time engine is normalized at the API boundary.' },
    ],
  },
  fractions: {
    label: 'Fractions Practice',
    api: '/api/practice',
    badge: 'FRAC',
    description: 'Fraction visual models integrated into the shared practice shell.',
    defaultLogicType: 'visual_models_identify',
    subject: 'math',
    topic: 'fractions',
    options: FRACTIONS_OPTIONS,
    tips: [
      { label: 'Starter-safe', text: 'Only stable fraction visual model skills are shown first.' },
      { label: 'Shared renderer', text: 'SVG models, MCQ choices, and blanks use the same practice shell.' },
    ],
  },
  'place-values': {
    label: 'Place Value Practice',
    api: '/api/practice',
    badge: 'PV',
    description: 'Base-ten blocks, place names, expanded form, word form, Indian/international systems, rounding, magnitude, and decomposition.',
    defaultLogicType: 'pv-g1-blocks-units',
    subject: 'math',
    topic: 'place-values',
    options: PLACE_VALUE_OPTIONS,
    tips: [
      { label: 'Visual-first', text: 'Charts, grouping visuals, number lines, and magnitude bars come from generator JSON.' },
      { label: 'Remediation-ready', text: 'Skills carry prerequisites, misconceptions, and scaffold metadata.' },
    ],
  },
  shapes: {
    label: 'Shapes Practice',
    api: '/api/practice',
    badge: 'SHAPES',
    description: 'Identify shapes by visual representation or name, with multi-step graphical explanation support.',
    defaultLogicType: 'shapes-g1-identify-visual-text-opts',
    subject: 'math',
    topic: 'shapes',
    options: SHAPES_OPTIONS,
    tips: [
      { label: 'Interactive SVGs', text: 'Questions feature interactive visual SVG representation.' },
      { label: 'Multi-step Solution', text: 'Solutions feature step-by-step visual corner and side explanations.' },
    ],
  },
  'social-gk': {
    label: 'GK Practice',
    api: '/api/practice',
    badge: 'GK',
    description: 'General knowledge questions for people, facts, images, and reasoning prompts.',
    defaultLogicType: 'gk_identify_person_v1',
    subject: 'social',
    topic: 'gk',
    options: SOCIAL_GK_OPTIONS,
    tips: [
      { label: 'Subject-ready', text: 'Social topics use the same API and practice shell as math topics.' },
      { label: 'Interaction-ready', text: 'Sorting tasks are JSON-driven categorization questions.' },
      { label: 'Content governance', text: 'GK facts should stay versioned with source, locale, and review metadata.' },
    ],
  },
  'units-measurement': {
    label: 'Units & Measurement Practice',
    api: '/api/practice',
    badge: 'SCI',
    description: 'Units, temperature, measuring tools, metric/customary units, and conversions.',
    defaultLogicType: 'science-g2-p6-read-thermometer-celsius',
    subject: 'science',
    topic: 'units-measurement',
    options: UNITS_MEASUREMENT_OPTIONS,
    tips: [
      { label: 'IXL Quality', text: 'SVG thermometers scale responsively across all screens.' },
      { label: 'Interactive MCQ', text: 'Compare temperatures using multiple SVGs side by side.' },
    ],
  },
  'english-grammar': {
    label: 'Grammar Practice',
    api: '/api/practice',
    badge: 'ENG',
    description: 'Topic-wise Grammar engines, templates, and grade micro-skills.',
    defaultLogicType: 'english-g1-n1-identify-nouns',
    subject: 'english',
    topic: 'grammar',
    options: ENGLISH_GRAMMAR_OPTIONS,
    tips: [
      { label: 'Clean Generator', text: 'Engines create clean question JSON.' },
      { label: 'Responsive Layouts', text: 'Sentence, pronoun, and noun options adapt.' },
    ],
  },
  testing: {
    label: 'Testing Practice',
    api: '/api/practice',
    badge: 'TEST',
    description: 'Static JSON examples for testing reusable parts and interactive tools.',
    defaultLogicType: 'testing-copy-drag-drop',
    subject: 'math',
    topic: 'testing',
    options: TESTING_OPTIONS,
    tips: [
      { label: 'Part registry', text: 'Tools are called by name inside question parts.' },
      { label: 'Reusable JSON', text: 'Examples use the same practice API and shared shell.' },
    ],
  },
};

function resolveSearchValue(searchParams, key, fallback = null) {
  const raw = searchParams?.get(key);
  return raw && String(raw).trim() ? String(raw).trim() : fallback;
}

function buildPracticeOptionsFromDbTopic(topicNode) {
  const options = [];
  
  const processNode = (node, currentGroup) => {
    if (node.type === 'skill') {
      const code = node.code || node.metadata?.code || '';
      const title = node.title || node.name || node.skillId || node.id;
      const label = code ? `${code} ${title}` : title;
      options.push({
        group: currentGroup || 'Skills',
        label,
        value: node.skillId || node.id
      });
    } else if (node.type === 'chapter') {
      const chapterTitle = node.title || node.name || 'Chapter';
      if (Array.isArray(node.children)) {
        node.children.forEach(child => processNode(child, chapterTitle));
      }
    } else {
      if (Array.isArray(node.children)) {
        node.children.forEach(child => processNode(child, currentGroup));
      }
    }
  };

  if (Array.isArray(topicNode.children)) {
    topicNode.children.forEach(child => {
      if (child.type === 'chapter') {
        const chapterTitle = child.title || child.name || 'Chapter';
        if (Array.isArray(child.children)) {
          child.children.forEach(subChild => processNode(subChild, chapterTitle));
        }
      } else {
        const gradeVal = child.grade || child.metadata?.grade;
        const groupName = gradeVal ? (gradeVal === 'remediation' ? 'Remediation' : `Grade ${gradeVal}`) : 'Skills';
        processNode(child, groupName);
      }
    });
  }

  const defaultLogicType = options[0]?.value || '';

  return {
    label: `${topicNode.title || topicNode.name || topicNode.topicId || 'Custom'} Practice`,
    api: '/api/practice',
    badge: topicNode.metadata?.badge || topicNode.subjectId?.substring(0, 4).toUpperCase() || 'DB',
    description: topicNode.description || topicNode.metadata?.description || 'Curriculum topic from database.',
    defaultLogicType,
    subject: topicNode.subjectId || 'math',
    topic: topicNode.topicId || topicNode.id,
    options,
    tips: topicNode.metadata?.tips || [
      { label: 'Database Stored', text: 'This topic was loaded dynamically from the curriculum database.' }
    ],
  };
}

function sourceFromSubjectTopic(subject, topic, fallback) {
  if (!topic) return fallback;
  const normTopic = String(topic).toLowerCase().trim();
  if (subject === 'math' && normTopic === 'lkg') return 'lkg';
  if (subject === 'math' && normTopic === 'time') return 'time';
  if (subject === 'math' && normTopic === 'fractions') return 'fractions';
  if (subject === 'math' && normTopic === 'place-values') return 'place-values';
  if (subject === 'math' && normTopic === 'shapes') return 'shapes';
  if (subject === 'math' && normTopic === 'addition') return 'addition-topic';
  if (subject === 'math' && normTopic === 'subtraction') return 'subtraction';
  if (subject === 'math' && normTopic === 'testing') return 'testing';
  if (subject === 'social' && normTopic === 'gk') return 'social-gk';
  if (subject === 'science' && normTopic === 'units-measurement') return 'units-measurement';
  if (subject === 'english' && normTopic === 'grammar') return 'english-grammar';
  return topic; // return the topic ID for db fetched topics
}

function CorrectPraiseCard({ praiseMessage }) {
  return (
    <div className={styles.correctPraiseCard}>
      <div className={styles.correctPraiseBadge}>✓</div>
      <h2>{praiseMessage?.title || 'Well done!'}</h2>
      <p>{praiseMessage?.subtitle || 'Getting the next question ready.'}</p>
    </div>
  );
}

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);
  const loadingRef = useRef(false);
  const urlSubject = resolveSearchValue(searchParams, 'subject');
  const urlTopic = resolveSearchValue(searchParams, 'topic');
  const urlSkill = resolveSearchValue(searchParams, 'skill');
  const initialSource = resolveSearchValue(searchParams, 'source', 'addition-topic');
  const resolvedInitialSource = sourceFromSubjectTopic(urlSubject, urlTopic, initialSource);
  const initialLogicType = urlSkill
    || resolveSearchValue(searchParams, 'forcedTask')
    || resolveSearchValue(searchParams, 'logic_type');

  const [dbConfigs, setDbConfigs] = useState({});
  const [curriculumLoading, setCurriculumLoading] = useState(true);

  const mergedConfigs = useMemo(() => {
    const result = { ...SOURCE_CONFIGS };
    
    Object.entries(dbConfigs).forEach(([dbKey, dbConfig]) => {
      const matchingKey = Object.keys(result).find(
        (key) => result[key].subject === dbConfig.subject && result[key].topic === dbConfig.topic
      );
      
      if (matchingKey) {
        result[matchingKey] = {
          ...result[matchingKey],
          ...dbConfig,
          label: dbConfig.label || result[matchingKey].label,
          description: dbConfig.description || result[matchingKey].description,
          options: dbConfig.options?.length ? dbConfig.options : result[matchingKey].options || [],
        };
      } else {
        result[dbKey] = dbConfig;
      }
    });
    
    return result;
  }, [dbConfigs]);

  const [sourceKey, setSourceKey] = useState(resolvedInitialSource);
  const [logicType, setLogicType] = useState(initialLogicType || 'addition-g1-e3-model-match-to-10');
  const [question, setQuestion] = useState(null);
  const [templateJson, setTemplateJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartScore, setSmartScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [practiceLevel, setPracticeLevel] = useState(1);
  const [levelStreak, setLevelStreak] = useState(0);
  const [levelModal, setLevelModal] = useState(null);
  const [lastResult, setLastResult] = useState('none');
  const [difficulty, setDifficulty] = useState('adaptive');
  const [history, setHistory] = useState([]);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [jsonCopyStatus, setJsonCopyStatus] = useState('Copy');
  const [transitionState, setTransitionState] = useState('idle');
  const [praiseMessage, setPraiseMessage] = useState(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  // Client-Side TTS States
  const [clientTtsSupported, setClientTtsSupported] = useState(false);
  const [useClientTts, setUseClientTts] = useState(false);
  const [localVoiceOverride, setLocalVoiceOverride] = useState('none');
  const [storedModels, setStoredModels] = useState([]);
  const [downloadingVoice, setDownloadingVoice] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = isClientTtsSupported();
      setClientTtsSupported(supported);
      
      const storedVal = window.localStorage.getItem('useClientTts');
      let isEnabled = false;
      if (storedVal !== null) {
        isEnabled = storedVal === 'true';
      } else {
        isEnabled = supported;
        window.localStorage.setItem('useClientTts', isEnabled ? 'true' : 'false');
      }
      setUseClientTts(isEnabled);
      
      const savedOverride = window.localStorage.getItem('localVoiceOverride') || 'none';
      setLocalVoiceOverride(savedOverride);
      
      if (supported) {
        getStoredVoiceModels().then((models) => {
          setStoredModels(models || []);
        }).catch((err) => {
          console.error('Error loading stored models:', err);
        });
      }
    }
  }, []);

  const handleToggleClientTts = (val) => {
    setUseClientTts(val);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('useClientTts', val ? 'true' : 'false');
    }
  };

  const handleVoiceOverrideChange = (val) => {
    setLocalVoiceOverride(val);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('localVoiceOverride', val);
    }
  };

  const handleDownloadModel = async (voiceId) => {
    try {
      setDownloadingVoice(voiceId);
      setDownloadProgress(0);
      
      await preloadVoiceModel(voiceId, (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          setDownloadProgress(pct);
        }
      });
      
      const models = await getStoredVoiceModels();
      setStoredModels(models || []);
    } catch (err) {
      console.error('Download model failed:', err);
      alert(`Model download failed: ${err.message}`);
    } finally {
      setDownloadingVoice(null);
      setDownloadProgress(0);
    }
  };

  const handleDeleteModel = async (voiceId) => {
    if (confirm(`Are you sure you want to delete the offline model for ${voiceId}?`)) {
      try {
        await removeVoiceModel(voiceId);
        const models = await getStoredVoiceModels();
        setStoredModels(models || []);
      } catch (err) {
        console.error('Delete model failed:', err);
      }
    }
  };

  const currentVoiceId = useMemo(() => {
    return normalizeVoiceId(question?.voice || 'Puck');
  }, [question?.voice]);

  const activeLocalVoice = useMemo(() => {
    return localVoiceOverride !== 'none' ? localVoiceOverride : currentVoiceId;
  }, [localVoiceOverride, currentVoiceId]);

  const isModelCached = useMemo(() => {
    return storedModels.includes(activeLocalVoice);
  }, [storedModels, activeLocalVoice]);

  const sourceConfig = useMemo(() => {
    return mergedConfigs[sourceKey] || mergedConfigs['addition-topic'];
  }, [mergedConfigs, sourceKey]);

  const questionJson = useMemo(() => (
    JSON.stringify({ question, template: templateJson }, null, 2)
  ), [question, templateJson]);
  const currentCompetency = useMemo(() => (
    resolveCompetency({
      subject: urlSubject || sourceConfig.subject,
      topic: urlTopic || sourceConfig.topic,
      skillId: logicType,
      templateId: question?.metadata?.templateId,
    })
  ), [logicType, question?.metadata?.templateId, sourceConfig.subject, sourceConfig.topic, urlSubject, urlTopic]);
  const prerequisiteLinks = useMemo(() => {
    const prerequisites = currentCompetency?.prerequisites || [];
    if (!prerequisites.length) return [];

    return prerequisites.map((competencyId) => {
      const matchingOption = sourceConfig.options.find((option) => {
        const optionCompetency = resolveCompetency({
          subject: urlSubject || sourceConfig.subject,
          topic: urlTopic || sourceConfig.topic,
          skillId: option.value,
        });
        return optionCompetency?.id === competencyId;
      });

      return {
        competencyId,
        label: matchingOption?.label || competencyId.replaceAll('_', ' '),
        skillId: matchingOption?.value || null,
      };
    });
  }, [currentCompetency?.prerequisites, sourceConfig.options, sourceConfig.subject, sourceConfig.topic, urlSubject, urlTopic]);

  const syncRoute = useCallback((nextSource, nextLogicType) => {
    const params = new URLSearchParams();
    const nextConfig = mergedConfigs[nextSource] || mergedConfigs['addition-topic'];

    if (urlSubject || urlTopic || urlSkill) {
      params.set('subject', nextConfig.subject);
      params.set('topic', nextConfig.topic);
      params.set('skill', nextLogicType);
    } else {
      params.set('source', nextSource);
      params.set('forcedTask', nextLogicType);
    }

    router.replace(`/practice?${params.toString()}`, { scroll: false });
  }, [router, urlSkill, urlSubject, urlTopic, mergedConfigs]);

  const fetchQuestion = useCallback(async (resetSession = false, sessionOverride = {}) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(!sessionOverride.keepTransition);
    setLastResult('none');
    setUserAnswer(null);
    setIsAnswered(false);
    submittingRef.current = false;
    setIsSubmitting(false);
    setIsCorrect(false);
    if (!sessionOverride.keepTransition) {
      setTransitionState('idle');
      setPraiseMessage(null);
    }

    if (resetSession) {
      setSmartScore(0);
      setCorrectStreak(0);
      setPracticeLevel(1);
      setLevelStreak(0);
      setLevelModal(null);
      setHistory([]);
    }

    try {
      const url = new URL(sourceConfig.api, window.location.origin);
      url.searchParams.set('subject', urlSubject || sourceConfig.subject);
      url.searchParams.set('topic', urlTopic || sourceConfig.topic);
      url.searchParams.set('skill', logicType);
      url.searchParams.set('forcedTask', logicType);
      url.searchParams.set('difficulty', difficulty);
      url.searchParams.set('correctStreak', String(sessionOverride.correctStreak ?? correctStreak));
      url.searchParams.set('practiceLevel', String(sessionOverride.practiceLevel ?? practiceLevel));
      url.searchParams.set('levelStreak', String(sessionOverride.levelStreak ?? levelStreak));
      url.searchParams.set('lastResult', sessionOverride.lastResult ?? lastResult);
      const competency = resolveCompetency({
        subject: urlSubject || sourceConfig.subject,
        topic: urlTopic || sourceConfig.topic,
        skillId: logicType,
      });
      const storedMastery = loadMasteryState({
        subject: urlSubject || sourceConfig.subject,
        topic: urlTopic || sourceConfig.topic,
        skillId: logicType,
        competencyId: competency?.id,
      });
      const remediationNeeded = sessionOverride.remediationNeeded ?? storedMastery?.remediationNeeded ?? false;
      url.searchParams.set('remediationActive', remediationNeeded ? 'true' : 'false');
      url.searchParams.set('remediationStep', remediationNeeded ? '1' : '0');
      url.searchParams.set('seed', String(Date.now()));

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data?.success && data?.question) {
        setQuestion(data.question);
        setTemplateJson(data.template || null);
        setQuestionStartedAt(Date.now());
        if (sessionOverride.slideIn) {
          setTransitionState('slideIn');
          window.setTimeout(() => setTransitionState('idle'), 520);
        }
      } else {
        setQuestion(null);
        setTemplateJson(data?.error || null);
      }
    } catch (error) {
      console.error('Practice fetch error:', error);
      setQuestion(null);
      setTemplateJson(error.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [correctStreak, difficulty, lastResult, levelStreak, logicType, practiceLevel, sourceConfig, urlSubject, urlTopic]);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const res = await fetch('/api/curriculum?tree=true');
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tree)) {
          const loadedConfigs = {};
          
          const traverse = (nodes) => {
            nodes.forEach(node => {
              if (node.type === 'topic') {
                const config = buildPracticeOptionsFromDbTopic(node);
                if (config && config.topic) {
                  loadedConfigs[config.topic] = config;
                }
              }
              if (Array.isArray(node.children)) {
                traverse(node.children);
              }
            });
          };
          
          traverse(data.tree);
          setDbConfigs(loadedConfigs);
        }
      } catch (err) {
        console.error('Failed to load curriculum tree:', err);
      } finally {
        setCurriculumLoading(false);
      }
    }
    loadCurriculum();
  }, []);

  useEffect(() => {
    if (curriculumLoading) return;
    const nextSource = sourceFromSubjectTopic(urlSubject, urlTopic, initialSource);
    const nextConfig = mergedConfigs[nextSource] || mergedConfigs['addition-topic'];
    const nextLogicType = urlSkill
      || resolveSearchValue(searchParams, 'forcedTask')
      || resolveSearchValue(searchParams, 'logic_type')
      || nextConfig.defaultLogicType;
    setSourceKey(nextSource);
    setLogicType(nextLogicType);
  }, [urlSubject, urlTopic, urlSkill, searchParams, initialSource, curriculumLoading, mergedConfigs]);

  useEffect(() => {
    if (curriculumLoading) return;
    const competency = resolveCompetency({
      subject: urlSubject || sourceConfig.subject,
      topic: urlTopic || sourceConfig.topic,
      skillId: logicType,
    });
    const storedMastery = loadMasteryState({
      subject: urlSubject || sourceConfig.subject,
      topic: urlTopic || sourceConfig.topic,
      skillId: logicType,
      competencyId: competency?.id,
    });

    if (storedMastery) {
      setSmartScore(Number(storedMastery.smartScore || 0));
      setCorrectStreak(Number(storedMastery.correctStreak || 0));
      setPracticeLevel(Number(storedMastery.practiceLevel || 1));
      setLevelStreak(Number(storedMastery.levelStreak || 0));
      setLastResult(storedMastery.lastResult || 'none');
      fetchQuestion(false, {
        correctStreak: Number(storedMastery.correctStreak || 0),
        practiceLevel: Number(storedMastery.practiceLevel || 1),
        levelStreak: Number(storedMastery.levelStreak || 0),
        lastResult: storedMastery.lastResult || 'none',
      });
      return;
    }

    setSmartScore(0);
    setCorrectStreak(0);
    setPracticeLevel(1);
    setLevelStreak(0);
    setLastResult('none');
    fetchQuestion(false, {
      correctStreak: 0,
      practiceLevel: 1,
      levelStreak: 0,
      lastResult: 'none',
    });
  }, [sourceKey, logicType, difficulty, urlSubject, urlTopic, curriculumLoading]);

  const handleSubmit = (answerOverride = undefined) => {
    const answerToCheck = answerOverride === undefined ? userAnswer : answerOverride;
    if (!question || answerToCheck === null || answerToCheck === undefined || isAnswered || submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    const correct = isAnswerCorrect(question, answerToCheck);
    const newSmartScore = calculateSmartScore(smartScore, correct);
    const competency = question.metadata?.competency || currentCompetency;
    const attempt = createAttempt({
      question: {
        ...question,
        metadata: {
          ...(question.metadata || {}),
          competencyId: competency?.id || question.metadata?.competencyId || null,
          competency: competency || question.metadata?.competency || null,
        },
      },
      userAnswer: answerToCheck,
      isCorrect: correct,
      difficulty,
      practiceLevel,
      smartScoreBefore: smartScore,
      smartScoreAfter: newSmartScore,
      startedAt: questionStartedAt,
    });
    const previousMastery = loadMasteryState(attempt);
    const nextMastery = updateMasteryState(previousMastery, attempt);
    saveMasteryState(attempt, nextMastery);
    appendAttempt(attempt);

    const nextCorrectStreak = nextMastery.correctStreak;
    const nextLevelStreak = correct ? levelStreak + 1 : 0;
    const nextPracticeLevel = nextMastery.practiceLevel;
    const finalLevelStreak = nextMastery.levelStreak;
    const didLevelUp = correct && nextLevelStreak >= 5;

    setSmartScore(nextMastery.smartScore);
    setCorrectStreak(nextCorrectStreak);
    if (didLevelUp) {
      setPracticeLevel(nextPracticeLevel);
      setLevelStreak(finalLevelStreak);
      setLevelModal({
        level: nextPracticeLevel,
        isMaxLevel: nextPracticeLevel === 5,
      });
    } else {
      setPracticeLevel(nextPracticeLevel);
      setLevelStreak(finalLevelStreak);
    }
    setLastResult(correct ? 'correct' : 'incorrect');
    setIsCorrect(correct);
    setIsAnswered(true);
    setHistory((prev) => [{
      type: question.metadata?.skillId || logicType,
      isCorrect: correct,
      scoreChange: nextMastery.smartScore - smartScore,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 5));

    if (correct) {
      const praisePool = didLevelUp
        ? ['Level up!', 'Brilliant streak!', 'You are moving up!']
        : nextCorrectStreak >= 4
          ? ['Fantastic!', 'Sharp work!', 'Great streak!']
          : ['Well done!', 'Nice work!', 'Correct!'];

      setPraiseMessage({
        title: praisePool[nextCorrectStreak % praisePool.length],
        subtitle: didLevelUp
          ? `Five in a row. Now Level ${nextPracticeLevel}.`
          : `${finalLevelStreak}/5 correct toward Level ${nextPracticeLevel < 5 ? nextPracticeLevel + 1 : 5}.`,
      });
      setTransitionState('praise');

      window.setTimeout(() => {
        fetchQuestion(false, {
          correctStreak: nextCorrectStreak,
          practiceLevel: nextPracticeLevel,
          levelStreak: finalLevelStreak,
          lastResult: 'correct',
          remediationNeeded: false,
          keepTransition: true,
          slideIn: true,
        });
      }, 950);
    } else {
      setIsSubmitting(false);
    }
  };

  const copyQuestionJson = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(questionJson);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = questionJson;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setJsonCopyStatus('Copied');
      window.setTimeout(() => setJsonCopyStatus('Copy'), 1400);
    } catch (error) {
      console.error('Question JSON copy failed:', error);
      setJsonCopyStatus('Failed');
      window.setTimeout(() => setJsonCopyStatus('Copy'), 1400);
    }
  }, [questionJson]);

  const inlineFeedback = isAnswered && !isCorrect ? (
    <PracticeFeedback
      question={question}
      isCorrect={isCorrect}
      onNext={() => fetchQuestion()}
      loading={loading}
    />
  ) : null;

  if (curriculumLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #dbeafe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
        <div style={{ fontSize: 14, fontWeight: 800, color: '#64748b' }}>Loading practice environment...</div>
      </div>
    );
  }

  const leftPanel = (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 className={styles.panelTitle} style={{ margin: 0 }}>{sourceConfig.label}</h4>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#0f766e', background: '#ccfbf1', borderRadius: 999, padding: '4px 8px' }}>
          {sourceConfig.badge}
        </div>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
        {sourceConfig.description}
      </p>
      <select
        value={sourceKey}
        onChange={(event) => {
          const nextSource = event.target.value;
          const nextConfig = mergedConfigs[nextSource] || mergedConfigs['addition-topic'];
          const nextLogicType = nextConfig.defaultLogicType;
          setSourceKey(nextSource);
          setLogicType(nextLogicType);
          syncRoute(nextSource, nextLogicType);
        }}
        style={{
          width: '100%',
          marginBottom: 18,
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid #dbeafe',
          background: '#ffffff',
          color: '#0f172a',
          fontWeight: 800,
        }}
      >
        {Object.entries(mergedConfigs).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.from(new Set(sourceConfig.options.map((opt) => opt.group))).map((group) => (
          <div key={group}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sourceConfig.options.filter((opt) => opt.group === group).map((opt) => {
                const isActive = logicType === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setLogicType(opt.value);
                      syncRoute(sourceKey, opt.value);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: isActive ? '#0f172a' : '#ffffff',
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: isActive ? '#0f172a' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#1e293b',
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 650,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const rightPanel = (
    <>
      <div style={{ background: '#ffffff', padding: 18, borderRadius: 20, border: '1px solid #dbeafe', marginBottom: 20, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Level
            </div>
            <div style={{ fontSize: 28, fontWeight: 950, color: '#0f172a', lineHeight: 1 }}>
              {practiceLevel}
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 4 }}>/5</span>
            </div>
          </div>
          <div style={{ minWidth: 72, textAlign: 'right', color: '#16a34a', fontSize: 12, fontWeight: 900 }}>
            {levelStreak}/5 correct
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: '#eef2ff', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, (levelStreak / 5) * 100)}%`,
              height: '100%',
              borderRadius: 999,
              background: '#4ade80',
              transition: 'width 220ms ease',
            }}
          />
        </div>
      </div>

      {prerequisiteLinks.length ? (
        <div style={{ background: '#f8fafc', padding: 18, borderRadius: 20, border: '1px solid #dbeafe', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Prerequisites
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prerequisiteLinks.map((item) => (
              item.skillId ? (
                <button
                  key={item.competencyId}
                  type="button"
                  onClick={() => {
                    setLogicType(item.skillId);
                    syncRoute(sourceKey, item.skillId);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: '1px solid #dbeafe',
                    background: '#ffffff',
                    color: '#2563eb',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 850,
                    lineHeight: 1.25,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ) : (
                <div
                  key={item.competencyId}
                  style={{
                    border: '1px dashed #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.25,
                    textTransform: 'capitalize',
                  }}
                >
                  {item.label}
                </div>
              )
            ))}
          </div>
        </div>
      ) : null}

      {/* On-Device Neural TTS Settings */}
      <div style={{ background: '#ffffff', padding: 18, borderRadius: 20, border: '1px solid #dbeafe', marginBottom: 20, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Local Neural TTS
          </h3>
          <span style={{ 
            fontSize: '9px', 
            fontWeight: '900', 
            padding: '4px 8px', 
            borderRadius: '999px',
            background: clientTtsSupported ? '#ecfdf5' : '#fef2f2',
            color: clientTtsSupported ? '#059669' : '#dc2626'
          }}>
            {clientTtsSupported ? 'Supported' : 'Unsupported'}
          </span>
        </div>
        
        {clientTtsSupported ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', fontWeight: '800', color: '#1e293b', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={useClientTts}
                onChange={(e) => handleToggleClientTts(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              Synthesize On-Device
            </label>

            {useClientTts && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                    Local Voice Override
                  </span>
                  <select
                    value={localVoiceOverride}
                    onChange={(e) => handleVoiceOverrideChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #dbeafe',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: '800',
                      outline: 'none'
                    }}
                  >
                    <option value="none">No override (Question voice)</option>
                    <option value="en_US-ryan-medium">Ryan Medium (Male)</option>
                    <option value="en_US-amy-medium">Amy Medium (Female)</option>
                    <option value="en_US-joe-medium">Joe Medium (Male)</option>
                    <option value="en_US-lessac-medium">Lessac Medium (Female)</option>
                    <option value="en_US-ryan-high">Ryan High (HQ Male)</option>
                  </select>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '750', color: '#475569' }}>
                      Voice: <code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace' }}>{activeLocalVoice}</code>
                    </span>
                    {isModelCached ? (
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#16a34a' }}>✓ Cached</span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#d97706' }}>Server Run</span>
                    )}
                  </div>

                  {downloadingVoice === activeLocalVoice ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', color: '#64748b' }}>
                        <span>Downloading Model...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: '#cbd5e1', overflow: 'hidden' }}>
                        <div style={{ width: `${downloadProgress}%`, height: '100%', background: '#3b82f6', borderRadius: 999 }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      {!isModelCached ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadModel(activeLocalVoice)}
                          style={{
                            flex: 1,
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 0,
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Download Voice (~15MB)
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => speakText("Local speech synthesis test is active and running entirely on your browser.", activeLocalVoice)}
                            style={{
                              flex: 2,
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            🔊 Test Speech
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteModel(activeLocalVoice)}
                            title="Delete cached model"
                            style={{
                              flex: 1,
                              background: '#fff1f2',
                              color: '#e11d48',
                              border: '1px solid #fecdd3',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600', lineHeight: 1.45 }}>
            Your browser does not support on-device neural speech synthesis. Speech will run via the Gemini Cloud API.
          </p>
        )}
      </div>

      <div style={{ background: '#ecfeff', padding: 20, borderRadius: 20, border: '1px solid #cffafe', marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 900, color: '#155e75', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Architecture
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sourceConfig.tips.map((item) => (
            <div key={item.label} style={{ background: '#ffffff', padding: 12, borderRadius: 12, color: '#155e75' }}>
              <div style={{ fontSize: 12, fontWeight: 900 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 650, lineHeight: 1.45 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.darkPanel}>
        <h3 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Session History
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h) => (
            <div key={`${h.timestamp}-${h.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '12px 14px', borderRadius: 12, border: '1px solid #334155' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{h.type}</span>
              <span style={{ fontWeight: 900, color: h.isCorrect ? '#4ade80' : '#f87171', fontSize: 14 }}>
                {h.isCorrect ? `+${h.scoreChange}` : h.scoreChange}
              </span>
            </div>
          ))}
          {history.length === 0 ? (
            <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No answers yet.</p>
          ) : null}
        </div>
      </div>

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#334155' }}>
          <span>Question JSON</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              copyQuestionJson();
            }}
            style={{
              float: 'right',
              marginTop: -3,
              border: '1px solid rgba(15, 23, 42, 0.12)',
              background: jsonCopyStatus === 'Copied' ? '#dcfce7' : '#ffffff',
              color: jsonCopyStatus === 'Copied' ? '#166534' : '#0f172a',
              borderRadius: 999,
              padding: '5px 10px',
              fontSize: 10,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
            }}
          >
            {jsonCopyStatus}
          </button>
        </summary>
        <pre style={{ marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.5, background: '#0f172a', color: '#cbd5e1', padding: 12, borderRadius: 12, maxHeight: 360, overflow: 'auto' }}>
          {questionJson}
        </pre>
      </details>
    </>
  );

  return (
    <>
      <LabLayout
        title={sourceConfig.label}
        grade="Shared Practice Shell"
        smartScore={smartScore}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onReset={() => fetchQuestion(true)}
        loading={loading}
        question={question}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        feedback={inlineFeedback}
        isAnswered={isAnswered}
        handleSubmit={handleSubmit}
        userAnswer={userAnswer}
        autoSubmit={autoSubmit}
        setAutoSubmit={setAutoSubmit}
        practiceLevel={practiceLevel}
        levelStreak={levelStreak}
        isSubmitting={isSubmitting}
      >
        {question ? (
          <div className={transitionState === 'slideIn' ? styles.questionSlideIn : undefined} style={{ width: '100%' }}>
            {transitionState === 'praise' ? (
              <CorrectPraiseCard praiseMessage={praiseMessage} />
            ) : (
              <QuestionRenderer
                key={`${sourceKey}:${logicType}:${question.id}`}
                question={question}
                userAnswer={userAnswer}
                isAnswered={isAnswered}
                isCorrect={isCorrect}
                onAnswer={(answer) => {
                  if (isSubmitting || submittingRef.current || isAnswered) return;
                  setUserAnswer(answer);
                  if (
                    autoSubmit
                    && !isAnswered
                    && (question.type === 'mcq' || question.type === 'multipleChoice' || question.type === 'multiplechoice')
                  ) {
                    window.setTimeout(() => handleSubmit(answer), 0);
                  }
                }}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        ) : (
          <div style={{ color: '#991b1b', fontWeight: 800 }}>
            No question could be loaded.
          </div>
        )}
      </LabLayout>

      {levelModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Level streak"
          onClick={() => setLevelModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(15, 23, 42, 0.22)',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(340px, 100%)',
              borderRadius: 22,
              background: '#ffffff',
              border: '1px solid #dcfce7',
              boxShadow: '0 26px 70px rgba(15, 23, 42, 0.22)',
              padding: 22,
              textAlign: 'center',
            }}
          >
            <div style={{ width: 54, height: 54, margin: '0 auto 12px', borderRadius: 999, background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 950 }}>
              {levelModal.level}
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 22, lineHeight: 1.15 }}>
              {levelModal.isMaxLevel ? 'Level 5 reached' : `Level ${levelModal.level} unlocked`}
            </h3>
            <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }}>
              Five correct answers in a row. The next set can step up in challenge.
            </p>
            <button
              type="button"
              onClick={() => setLevelModal(null)}
              style={{
                border: 0,
                borderRadius: 999,
                background: '#4fb77a',
                color: '#ffffff',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(34, 197, 94, 0.22)',
              }}
            >
              Keep practicing
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontWeight: 800 }}>Loading practice...</div>}>
      <PracticePageContent />
    </Suspense>
  );
}
