'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuestionRenderer from '../../components/practice/QuestionRenderer';
import SticksBuilderWorkspace from '../../components/practice/SticksBuilderWorkspace';
import LabLayout from '../../components/practice/LabLayout';
import MontessoriLayout from '../../components/practice/MontessoriLayout';
import PracticeFeedback from '../../components/practice/PracticeFeedback';
import styles from '../../components/practice/FactoryLayout.module.css';
import { isAnswerCorrect } from '../../lib/practice/answerValidation';
import { resolveCompetency, getNextUnlockingSkills } from '../../lib/competency';
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
  getMasteryKey,
  loadAllMastery,
  loadMasteryState,
  saveAllMastery,
  saveMasteryState,
  updateMasteryState,
} from '../../lib/mastery';
import { additionCatalogOptions } from '../../lib/practice/clientCatalogs/additionCatalog.js';
import { multiplicationCatalogOptions } from '../../lib/practice/clientCatalogs/multiplicationCatalog.js';

import { subtractionSkillsByGrade } from '../../lib/practice/generators/math/topics/subtraction/skills/index.js';
import { placeValueSkillsByGrade } from '../../lib/practice/generators/math/topics/place-values/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../../lib/practice/generators/science/topics/units-measurement/skills/index.js';
import { grammarSkillsByGrade } from '../../lib/practice/generators/english/topics/grammar/skills/index.js';
import { shapesSkillsByGrade } from '../../lib/practice/generators/math/topics/shapes/skills/index.js';
import { measurementCatalogOptions } from '../../lib/practice/clientCatalogs/measurementCatalog.js';
import { dataGraphsCatalogOptions } from '../../lib/practice/clientCatalogs/dataGraphsCatalog.js';
import { storyMathCatalogOptions } from '../../lib/practice/clientCatalogs/storyMathCatalog.js';
import { interactiveToolsCatalogOptions } from '../../lib/practice/clientCatalogs/interactiveToolsCatalog.js';
import { cubeToolsCatalogOptions } from '../../lib/practice/clientCatalogs/cubeToolsCatalog.js';
import { ukgNumbersCountingCatalogOptions } from '../../lib/practice/clientCatalogs/ukgNumbersCountingCatalog.js';
import DraggableToolOverlay from '../../components/practice/DraggableToolOverlay';
import OverlayToolbar from '../../components/practice/OverlayToolbar';

const UNITS_MEASUREMENT_OPTIONS = Object.entries(unitsMeasurementSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const SOLAR_SYSTEM_OPTIONS = [
  { group: 'Grade 3', label: 'SS.1 Identify planets in the solar system', value: 'science-g3-solar-system-planets-hotspot' },
  { group: 'Grade 3', label: 'SS.2 Measure and compare heights', value: 'science-g3-solar-system-height-measure' }
];

const UKG_SCIENCE_OPTIONS = [
  { group: 'UKG', label: 'SC.1 Classify objects by two-dimensional shape', value: 'ukg-science-classify-2d-shapes' },
  { group: 'UKG', label: 'SC.2 Sort objects by two-dimensional shape', value: 'ukg-science-sort-objects-by-two-dimensional-shape' },
  { group: 'UKG', label: 'SC.3 Identify triangles', value: 'ukg-science-identify-triangles' },
  { group: 'UKG', label: 'SC.4 Identify squares', value: 'ukg-science-identify-squares' },
  { group: 'UKG', label: 'SC.5 Identify rectangles', value: 'ukg-science-identify-rectangles' },
  { group: 'UKG', label: 'SC.6 Sort living and non-living things (Stickers)', value: 'ukg-science-living-nonliving-stickers' }
];

const ENGLISH_GRAMMAR_OPTIONS = Object.entries(grammarSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const MULTIPLICATION_OPTIONS = multiplicationCatalogOptions;

const SHAPES_OPTIONS = Object.entries(shapesSkillsByGrade).flatMap(([grade, skills]) =>
  skills.map((skill) => ({
    group: `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id
  }))
);

const MEASUREMENT_OPTIONS = measurementCatalogOptions;

const STORY_MATH_OPTIONS = storyMathCatalogOptions;

const INTERACTIVE_TOOLS_OPTIONS = interactiveToolsCatalogOptions;

const gradeLabel = (grade) => {
  if (grade === 'remediation') return 'Remediation';
  if (grade === 'prek') return 'Pre-K';
  return `Grade ${grade}`;
};

const ADDITION_TOPIC_OPTIONS = additionCatalogOptions.map((option) => ({
  ...option,
  group: option.group === 'Remediation' ? 'Remediation' : option.group,
}));

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

const SOM_OPTIONS = [
  { group: 'Measurement features', label: 'Measure length (Interactive Cubes)', value: 'som-g1-measure-length' },
  { group: 'Measurement features', label: 'Measure height (Interactive Dice)', value: 'som-g1-measure-height' },
  { group: 'Measurement features', label: 'Compare measured lengths (Paperclips)', value: 'som-g1-compare' },
  { group: 'Measurement features', label: 'Identify measurement errors (Pennies)', value: 'som-g1-error-spotting' },
  { group: 'Measurement features', label: 'Measure length (Static Paperclips)', value: 'som-g1-static-length' },
  { group: 'Measurement features', label: 'Measure height (Static Pennies)', value: 'som-g1-static-height' },
  { group: 'Addition & composition', label: 'Combine lengths (Cubes sum)', value: 'som-g1-add-lengths' },
  { group: 'Addition & composition', label: 'Combine heights (Dice towers sum)', value: 'som-g1-add-heights' },
  { group: 'Addition & composition', label: 'Copy cubes: sums up to 3', value: 'som-g1-copy-cubes-to-3' },
  { group: 'Addition & composition', label: 'Copy cubes: sums up to 5', value: 'som-g1-copy-cubes-to-5' },
  { group: 'Addition & composition', label: 'Copy cubes: sums up to 10', value: 'som-g1-copy-cubes-to-10' },
  { group: 'Subtraction & patterns', label: 'Patterns: Complete ABAB sequence', value: 'som-g1-pattern-abab' },
  { group: 'Subtraction & patterns', label: 'Patterns: Complete AABB sequence', value: 'som-g1-pattern-aabb' },
  { group: 'Subtraction & patterns', label: 'Subtraction: Take away cubes', value: 'som-g1-sub-takeaway' },
  { group: 'Subtraction & patterns', label: 'Subtraction: Compare block trains', value: 'som-g1-sub-compare' },
  { group: 'Advanced block concepts', label: 'Place value: Tens and ones blocks', value: 'som-g1-place-value-blocks' },
  { group: 'Advanced block concepts', label: 'Place value: Numbers up to 50', value: 'som-g1-place-value-50' },
  { group: 'Advanced block concepts', label: 'Place value: Numbers up to 100', value: 'som-g2-place-value-100' },
  { group: 'Advanced block concepts', label: 'Place value: Hundreds, tens, and ones', value: 'som-g2-place-value-hundreds' },
  { group: 'Advanced block concepts', label: 'Place value: Thousands, hundreds, tens, and ones', value: 'som-g3-place-value-thousands' },
  { group: 'Advanced block concepts', label: 'Fractions: Equivalent strip parts', value: 'som-g1-fraction-strips' },
  { group: 'Advanced block concepts', label: 'Multiplication: Stacks array model', value: 'som-g1-multiplication-array' },
  { group: 'Advanced block concepts', label: 'Graphing: Built block charts', value: 'som-g1-graphing-bars' },
  { group: 'New concepts', label: 'Ten frame: Numbers up to 5', value: 'som-g1-ten-frame-5' },
  { group: 'New concepts', label: 'Ten frame: Numbers up to 10', value: 'som-g1-ten-frame-10' },
  { group: 'New concepts', label: 'Ten frame: Double frame up to 20', value: 'som-g1-ten-frame-20' },
  { group: 'New concepts', label: 'Number bonds: Up to 5', value: 'som-g1-number-bonds-5' },
  { group: 'New concepts', label: 'Number bonds: Up to 10', value: 'som-g1-number-bonds-10' },
  { group: 'New concepts', label: 'Number line: 0 to 10', value: 'som-g1-number-line-10' },
  { group: 'New concepts', label: 'Number line: 0 to 20', value: 'som-g1-number-line-20' },
  { group: 'New concepts', label: 'Number line: 0 to 100', value: 'som-g2-number-line-100' },
  { group: 'New concepts', label: 'Area: Count squares (up to 4×4)', value: 'som-g2-area-grid-small' },
  { group: 'New concepts', label: 'Area: Count squares (up to 6×6)', value: 'som-g2-area-grid-medium' },
  { group: 'New concepts', label: 'Area: Click to fill the grid', value: 'som-g2-area-grid-click' },
  { group: 'New concepts', label: 'Division: Share equally into groups', value: 'som-g2-division-sharing' },
  { group: 'New concepts', label: 'Money: Count rupee coins', value: 'som-g1-money-coins' },
  { group: 'New concepts', label: 'Odd and even numbers', value: 'som-g1-odd-even' },
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
  { group: 'Positions', label: '⭐ Interactive SVG Demo (Real Animals)', value: 'lkg-position-interactive-demo' },
  { group: 'Positions', label: '🎯 Hotspot Canvas Demo', value: 'lkg-position-hotspot-demo' },
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
  'ukg-numbers-counting': {
    label: 'UKG Numbers & Counting',
    api: '/api/practice',
    badge: 'UKG',
    description: 'Interactive UKG counting, number sense, sequences, tallies, and number lines.',
    defaultLogicType: 'ukg-count3-learn',
    subject: 'math',
    topic: 'ukg-numbers-counting',
    options: ukgNumbersCountingCatalogOptions,
    tips: [
      { label: 'Interactive foundation', text: 'Counting and ten-frame skills reuse the proven LKG interaction engine.' },
      { label: 'UKG progression', text: 'More, less, sequences, tallies, and number lines extend number sense to 10.' },
    ],
  },
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
  'data-graphs': {
    label: 'Data & Graphs Practice',
    api: '/api/practice',
    badge: 'MATH',
    description: 'Picture graphs, bar graphs, scaled charts, tally charts, and line plots.',
    defaultLogicType: 'data-graphs-g1-read-picture-graph',
    subject: 'math',
    topic: 'data-graphs',
    options: dataGraphsCatalogOptions,
    tips: [
      { label: 'Graph-first', text: 'Questions render visual graph data from compact generator JSON.' },
      { label: 'Skill ladder', text: 'Data graph skills stay in a client-safe catalog for fast sidebar loading.' },
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
  measurement: {
    label: 'Measurement Practice',
    api: '/api/practice',
    badge: 'MATH',
    description: 'Customary & metric measurements, rulers, thermometers, scales, unit conversions, rate conversions, precision, greatest possible error, and density calculations.',
    defaultLogicType: 'meas-prek-long-short',
    subject: 'math',
    topic: 'measurement',
    options: MEASUREMENT_OPTIONS,
    tips: [
      { label: 'SVG Instruments', text: 'Questions feature procedural rulers, thermometers, cylinders, and spring scales.' },
      { label: 'Step-by-Step solutions', text: 'Detailed, conceptual walk-through explanations accompany each problem.' },
    ],
  },
  'story-math': {
    label: 'Story Math Applets',
    api: '/api/practice',
    badge: 'STORY',
    description: 'Reusable interactive story applets for lesson stories, sandbox play, quiz games, remediation, demos, and manipulatives.',
    defaultLogicType: 'story-math-lesson',
    subject: 'math',
    topic: 'story-math',
    options: STORY_MATH_OPTIONS,
    tips: [
      { label: 'One renderer, many uses', text: 'Each skill opens the same applet in a different mode or teaching flow.' },
      { label: 'Config-driven', text: 'Future stories can use the same interactiveApplet contract with a new storyId.' },
    ],
  },
  'interactive-tools': {
    label: 'Interactive Tools',
    api: '/api/practice',
    badge: 'TOOLS',
    description: 'Centralized interactive manipulatives for visual math practice and future mini-engine activities.',
    defaultLogicType: 'interactive-tools-fraction-bar',
    subject: 'math',
    topic: 'interactive-tools',
    options: INTERACTIVE_TOOLS_OPTIONS,
    tips: [
      { label: 'Tool-first topic', text: 'Each skill opens one reusable manipulative in the shared practice shell.' },
      { label: 'Mini-engine ready', text: 'This topic can later swap from applets to the new interactiveTool engine contract.' },
    ],
  },
  'cube-tools': {
    label: 'Cube Tools',
    api: '/api/practice',
    badge: 'CUBES',
    description: 'Reusable cube-counter mini-engine skills for building, adding, subtracting, and missing addends.',
    defaultLogicType: 'cube-tools-build',
    subject: 'math',
    topic: 'cube-tools',
    options: cubeToolsCatalogOptions,
    tips: [
      { label: 'Engine-driven', text: 'All skills reuse the same cube_counter engine with different parameters.' },
      { label: 'Template-ready', text: 'New cube skills can be added by changing config, not UI code.' },
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
  'solar-system': {
    label: 'Solar System Practice',
    api: '/api/practice',
    badge: 'SCI',
    description: 'Identify planets in the solar system, understand orbit hierarchies and visual appearances.',
    defaultLogicType: 'science-g3-solar-system-planets-hotspot',
    subject: 'science',
    topic: 'solar-system',
    options: SOLAR_SYSTEM_OPTIONS,
    tips: [
      { label: 'Interactive Orbits', text: 'Stunning space background with responsive elliptical orbits.' },
      { label: 'Hotspot Canvas', text: 'Click directly on the animated planets to answer.' },
    ],
  },
  'ukg-science': {
    label: 'UKG Science Practice',
    api: '/api/practice',
    badge: 'SCI',
    description: 'Classify shapes and identify circles, triangles, squares, and rectangles.',
    defaultLogicType: 'ukg-science-classify-2d-shapes',
    subject: 'science',
    topic: 'ukg-science',
    options: UKG_SCIENCE_OPTIONS,
    tips: [
      { label: 'Option Pooling', text: 'Questions dynamically pull objects from a single centralized shapes pool.' },
      { label: 'Visual Matching', text: 'Students match shapes based on their visual profiles.' }
    ]
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
  'standard-object-measurement': {
    label: 'Standard Object Measurement Practice',
    api: '/api/practice',
    badge: 'MATH',
    description: 'Practice interactive non-standard unit measuring, comparison, error spotting, and addition modeling.',
    defaultLogicType: 'som-g1-measure-length',
    subject: 'math',
    topic: 'standard-object-measurement',
    options: SOM_OPTIONS,
    tips: [
      { label: 'Snapping blocks', text: 'Questions feature interactive snapping cube and dice towers.' },
      { label: 'Addition modeling', text: 'Prefilled locked blocks act as the starting addend.' },
    ],
  },
  division: {
    label: 'Division Practice',
    api: '/api/practice',
    badge: 'DIV',
    description: 'Interactive sharing, equal grouping, and array modeling division templates.',
    defaultLogicType: '',
    subject: 'math',
    topic: 'division',
    options: [],
    tips: [
      { label: 'Equal Sharing', text: 'Distribute cookies or cupcakes equally into groups.' },
      { label: 'Array Sharing', text: 'Model division by grid rows and columns.' },
    ],
  },
  probability: {
    label: 'Probability Practice',
    api: '/api/practice',
    badge: 'PROB',
    description: 'Interactive spinners, marble jars, and fractional likelihood models.',
    defaultLogicType: '',
    subject: 'math',
    topic: 'probability',
    options: [],
    tips: [
      { label: 'Visual Jars', text: 'Calculate the probability of picking a specific marble.' },
      { label: 'Interactive Spinners', text: 'Find the odds of landing on a color sector.' },
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
        value: node.skillId || node.id,
        progressionConfig: node.progressionConfig || null,
        isStatic: Boolean(node.isStatic)
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
    topic: topicNode.id,
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
  if (subject === 'math' && normTopic === 'cube-tools') return 'cube-tools';
  if (subject === 'math' && normTopic === 'subtraction') return 'subtraction';
  if (subject === 'math' && normTopic === 'division') return 'division';
  if (subject === 'math' && normTopic === 'probability') return 'probability';
  if (subject === 'math' && normTopic === 'testing') return 'testing';
  if (subject === 'social' && normTopic === 'gk') return 'social-gk';
  if (subject === 'science' && normTopic === 'units-measurement') return 'units-measurement';
  if (subject === 'science' && normTopic === 'solar-system') return 'solar-system';
  if (subject === 'english' && normTopic === 'grammar') return 'english-grammar';
  if (subject === 'english' && (normTopic === 'lkg' || normTopic === 'english-lkg')) return 'english-lkg';
  return topic; // return the topic ID for db fetched topics
}

function ProgressionHeader({ easyCount, mediumCount, hardCount, easyCurrent, mediumCurrent, hardCurrent }) {
  const easyTarget = Number(easyCount || 0);
  const mediumTarget = Number(mediumCount || 0);
  const hardTarget = Number(hardCount || 0);

  const easyDone = Math.min(easyCurrent, easyTarget);
  const mediumDone = Math.min(mediumCurrent, mediumTarget);
  const hardDone = Math.min(hardCurrent, hardTarget);

  const totalTarget = easyTarget + mediumTarget + hardTarget;
  const totalCompleted = easyDone + mediumDone + hardDone;
  const percent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  const getStageStatus = (current, target, prevDone, prevTarget) => {
    if (prevTarget > 0 && prevDone < prevTarget) return 'locked';
    if (current >= target && target > 0) return 'completed';
    return 'active';
  };

  const easyStatus = getStageStatus(easyDone, easyTarget, 1, 1);
  const mediumStatus = getStageStatus(mediumDone, mediumTarget, easyDone, easyTarget);
  const hardStatus = getStageStatus(hardDone, hardTarget, mediumDone, mediumTarget);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            IIT Foundation Progression
          </span>
          <h4 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
            Questions Completed: {totalCompleted} / {totalTarget}
          </h4>
        </div>
        <div style={{
          background: '#f0fdf4',
          color: '#166534',
          padding: '4px 10px',
          borderRadius: '99px',
          fontSize: '14px',
          fontWeight: 800
        }}>
          {percent}% Complete
        </div>
      </div>

      {/* Progress Bar Container */}
      <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
        <div style={{
          background: 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)',
          height: '100%',
          width: `${percent}%`,
          borderRadius: '99px',
          transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} />
      </div>

      {/* Stage Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {/* Easy Stage */}
        {easyTarget > 0 && (
          <div style={{
            background: easyStatus === 'completed' ? '#ecfdf5' : easyStatus === 'active' ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${easyStatus === 'completed' ? '#a7f3d0' : easyStatus === 'active' ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            opacity: easyStatus === 'locked' ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: easyStatus === 'completed' ? '#047857' : '#15803d', textTransform: 'uppercase' }}>
              🟢 Stage 1: Easy
            </span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>
              {easyDone} / {easyTarget} Correct
            </span>
          </div>
        )}

        {/* Medium Stage */}
        {mediumTarget > 0 && (
          <div style={{
            background: mediumStatus === 'completed' ? '#ecfdf5' : mediumStatus === 'active' ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${mediumStatus === 'completed' ? '#a7f3d0' : mediumStatus === 'active' ? '#bfdbfe' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            opacity: mediumStatus === 'locked' ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: mediumStatus === 'completed' ? '#047857' : mediumStatus === 'active' ? '#1d4ed8' : '#64748b', textTransform: 'uppercase' }}>
              🔵 Stage 2: Medium
            </span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>
              {mediumStatus === 'locked' ? 'Locked' : `${mediumDone} / ${mediumTarget} Correct`}
            </span>
          </div>
        )}

        {/* Hard Stage */}
        {hardTarget > 0 && (
          <div style={{
            background: hardStatus === 'completed' ? '#ecfdf5' : hardStatus === 'active' ? '#fdf2f8' : '#f8fafc',
            border: `1px solid ${hardStatus === 'completed' ? '#a7f3d0' : hardStatus === 'active' ? '#fbcfe8' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            opacity: hardStatus === 'locked' ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: hardStatus === 'completed' ? '#047857' : hardStatus === 'active' ? '#be185d' : '#64748b', textTransform: 'uppercase' }}>
              🔥 Stage 3: Hard
            </span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>
              {hardStatus === 'locked' ? 'Locked' : `${hardDone} / ${hardTarget} Correct`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CorrectPraiseCard({ praiseMessage, isPreK }) {
  useEffect(() => {
    if (isPreK && praiseMessage?.title) {
      // Small delay to let speech synthesis queue cleanly
      const t = setTimeout(() => {
        speakText(praiseMessage.title, 'Puck');
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isPreK, praiseMessage]);

  if (isPreK) {
    return (
      <div className={`${styles.correctPraiseCard} ${styles.preKPraiseCard}`}>
        <div className={styles.preKCelebrationEmojis}>
          <span className={styles.floatingEmoji} style={{ '--delay': '0s', '--x': '-35px' }}>🎈</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.15s', '--x': '45px' }}>🎉</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.08s', '--x': '-10px' }}>🌟</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.22s', '--x': '25px' }}>🥳</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.3s', '--x': '-50px' }}>🌈</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.4s', '--x': '15px' }}>🍭</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.1s', '--x': '-20px' }}>⭐</span>
          <span className={styles.floatingEmoji} style={{ '--delay': '0.25s', '--x': '30px' }}>⭐</span>
        </div>
        
        {/* Animated Cheering Mascot */}
        <div style={{ fontSize: '64px', margin: '0 auto 8px', animation: 'preKMascotCheer 0.6s ease infinite alternate', display: 'inline-block' }}>
          🐻
        </div>

        <h2 style={{ fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 950, fontSize: '30px', color: '#15803d', margin: '0 0 4px' }}>
          ✨ {praiseMessage?.title || 'Great job!'} ✨
        </h2>
        <p style={{ color: '#166534', fontSize: '15px', fontWeight: 800, margin: '6px 0 0', fontFamily: 'var(--font-outfit), sans-serif' }}>
          {praiseMessage?.subtitle || 'You are doing amazing!'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.correctPraiseCard}>
      <div className={styles.correctPraiseBadge}>✓</div>
      <h2>{praiseMessage?.title || 'Well done!'}</h2>
      <p>{praiseMessage?.subtitle || 'Getting the next question ready.'}</p>
    </div>
  );
}

// ── DiagnosticSummaryCard ─────────────────────────────────────────────────────
function DiagnosticSummaryCard({ result, sourceConfig, onStartSkill, onRetry }) {
  const levelPalette = [
    { color: '#6366f1', light: '#eef2ff', label: 'Foundation',  emoji: '🌱' },
    { color: '#3b82f6', light: '#eff6ff', label: 'Beginner',    emoji: '💧' },
    { color: '#10b981', light: '#ecfdf5', label: 'Developing',  emoji: '📈' },
    { color: '#f59e0b', light: '#fffbeb', label: 'Proficient',  emoji: '⭐' },
    { color: '#f97316', light: '#fff7ed', label: 'Advanced',    emoji: '🔥' },
    { color: '#a855f7', light: '#faf5ff', label: 'Expert',      emoji: '💎' },
  ];
  const level = Math.min(5, Math.max(0, result.estimatedLevel || 0));
  const palette = levelPalette[level];
  const pct = Math.round(result.confidence * 100);
  const circumference = 2 * Math.PI * 36; // r=36
  const dash = (pct / 100) * circumference;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f8f7ff 0%, #eef2ff 40%, #f0fdf4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: `'Inter', system-ui, sans-serif`,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes popIn { from { opacity:0; transform:scale(0.94) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes strokeFill { from { stroke-dashoffset: ${circumference}; } to { stroke-dashoffset: ${circumference - dash}; } }
        .diag-card { animation: popIn 0.45s cubic-bezier(0.34,1.56,0.64,1); }
        .diag-ring circle.progress { animation: strokeFill 1s 0.3s cubic-bezier(0.4,0,0.2,1) forwards; stroke-dashoffset: ${circumference}; }
        .diag-retry-btn:hover { background: #f1f5f9 !important; }
        .diag-start-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .diag-start-btn { transition: all 180ms ease !important; }
      ` }} />

      {/* Card */}
      <div
        className="diag-card"
        style={{
          width: 'min(520px, 100%)',
          background: '#ffffff',
          borderRadius: 28,
          boxShadow: `0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(99,102,241,0.10)`,
          overflow: 'hidden',
        }}
      >
        {/* Coloured top band */}
        <div style={{
          height: 6,
          background: `linear-gradient(90deg, ${palette.color}, ${palette.color}88)`,
        }} />

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: palette.light,
              border: `1px solid ${palette.color}33`,
              borderRadius: 999,
              padding: '5px 12px',
            }}>
              <span style={{ fontSize: 14 }}>🧭</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: palette.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Placement Report</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
              {result.correctCount}/{result.totalQuestions} correct
            </span>
          </div>

          {/* Level + Ring row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            {/* SVG ring */}
            <div style={{ flexShrink: 0 }}>
              <svg className="diag-ring" width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  className="progress"
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke={palette.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  transform="rotate(-90 44 44)"
                />
                <text x="44" y="40" textAnchor="middle" fontSize="16" fontWeight="900" fill={palette.color} fontFamily="Inter, system-ui, sans-serif">{pct}%</text>
                <text x="44" y="54" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8" fontFamily="Inter, system-ui, sans-serif" textTransform="uppercase">CONFIDENCE</text>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>Estimated Level</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 36 }}>{palette.emoji}</span>
                <span style={{ fontSize: 26, fontWeight: 950, color: '#0f172a', lineHeight: 1 }}>{palette.label}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                {levelPalette.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      width: i <= level ? 20 : 8,
                      height: 6,
                      borderRadius: 999,
                      background: i <= level ? palette.color : '#e2e8f0',
                      transition: 'all 300ms ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Question Breakdown */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Question Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.steps.map((step, i) => (
                <div
                  key={step.skillId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: step.isCorrect ? '#f0fdf4' : '#fff5f5',
                    border: `1px solid ${step.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: 12,
                    padding: '9px 14px',
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: step.isCorrect ? '#dcfce7' : '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 12,
                  }}>
                    {step.isCorrect ? '✓' : '×'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 750, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Q{i + 1}: {step.label || step.skillId}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {step.timeSpentMs ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{(step.timeSpentMs / 1000).toFixed(1)}s</span>
                    ) : null}
                    <span style={{
                      fontSize: 10, fontWeight: 900,
                      padding: '3px 9px', borderRadius: 999,
                      background: step.isCorrect ? '#dcfce7' : '#fee2e2',
                      color: step.isCorrect ? '#16a34a' : '#dc2626',
                    }}>
                      {step.isCorrect ? 'Correct' : 'Missed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Skill */}
          {result.recommendedStartSkill && (
            <div
              style={{
                background: palette.light,
                border: `1px solid ${palette.color}33`,
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 22,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🎯</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: palette.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Recommended Starting Skill</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                  {sourceConfig.options.find((o) => o.value === result.recommendedStartSkill)?.label || result.recommendedStartSkill}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              id="diagnostic-retry-btn"
              className="diag-retry-btn"
              onClick={onRetry}
              style={{
                flex: 1,
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                color: '#475569',
                borderRadius: 14,
                padding: '13px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'background 160ms',
              }}
            >
              Retake Test
            </button>
            <button
              type="button"
              id="diagnostic-start-btn"
              className="diag-start-btn"
              onClick={() => onStartSkill(result.recommendedStartSkill)}
              style={{
                flex: 2,
                background: `linear-gradient(135deg, ${palette.color} 0%, ${palette.color}bb 100%)`,
                border: 0,
                color: '#ffffff',
                borderRadius: 14,
                padding: '13px 16px',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${palette.color}44`,
              }}
            >
              Start Practice →
            </button>
          </div>
        </div>
      </div>

      {/* footer note */}
      <p style={{ marginTop: 20, fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>
        Results are based on {result.totalQuestions} placement questions across the skill ladder.
      </p>
    </div>
  );
}

function PracticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);
  const loadingRef = useRef(false);
  const fetchRequestIdRef = useRef(0);
  const seedUsedRef = useRef(false);
  const urlSubject = resolveSearchValue(searchParams, 'subject');
  const urlTopic = resolveSearchValue(searchParams, 'topic');
  const urlSkill = resolveSearchValue(searchParams, 'skill');
  const urlQn = resolveSearchValue(searchParams, 'qn')
    || resolveSearchValue(searchParams, 'questionId')
    || resolveSearchValue(searchParams, 'id');
  const urlIit = resolveSearchValue(searchParams, 'iit') === 'true';
  const urlImo = resolveSearchValue(searchParams, 'imo') === 'true';
  // practiceMode lives in the URL as ?mode=adaptive|static — tied to the skill ID
  const practiceMode = resolveSearchValue(searchParams, 'mode') === 'static' ? 'static' : 'adaptive';
  const initialSource = resolveSearchValue(searchParams, 'source', 'addition-topic');
  const resolvedInitialSource = sourceFromSubjectTopic(urlSubject, urlTopic, initialSource);
  const initialLogicType = urlSkill
    || resolveSearchValue(searchParams, 'forcedTask')
    || resolveSearchValue(searchParams, 'logic_type');
  const isDeveloperUnlockEnabled = resolveSearchValue(searchParams, 'dev') === 'true';


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
          options: (() => {
            const staticOpts = result[matchingKey].options || [];
            const dbOpts = dbConfig.options || [];
            const combined = [...staticOpts];
            dbOpts.forEach(opt => {
              if (!combined.some(o => o.value === opt.value)) {
                combined.push(opt);
              }
            });
            return combined;
          })(),
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
  const isPreK = useMemo(() => {
    const skillGrade = question?.metadata?.grade || question?.grade || question?.metadata?.estimatedGrade || question?.estimatedGrade;
    const g = String(skillGrade || (searchParams ? searchParams.get('grade') : '') || '').toLowerCase().trim();
    const isElementaryOrHigher = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'grade 1', 'grade 2', 'grade 3', 'class 1', 'class 2'].includes(g);
    if (isElementaryOrHigher) return false;

    const checkPreK = (str) => {
      if (!str) return false;
      const s = String(str).toLowerCase().trim();
      return (
        s === 'lkg' || s === 'prek' || s === 'ukg' ||
        s.includes('ukg') || s.includes('lkg') || s.includes('prek') ||
        s.includes('pre-k') || s.includes('kindergarten') ||
        s.includes('letter-identification') || s.includes('letter-recognition') ||
        s.includes('rhyming') || s.includes('phonics') || s.includes('short-vowel') ||
        s.includes('cvc')
      );
    };

    const t = String(urlTopic || '').toLowerCase().trim();
    if (checkPreK(t)) return true;
    
    if (logicType && checkPreK(logicType.toLowerCase())) return true;
    
    if (checkPreK(g)) return true;

    // Check query params manually (allows explicitly forcing via URL query strings)
    const routeSearch = searchParams ? searchParams.toString().toLowerCase() : '';
    if (checkPreK(routeSearch)) return true;
    
    return false;
  }, [urlTopic, logicType, question, searchParams]);
  const [templateJson, setTemplateJson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartScore, setSmartScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [seenItemIds, setSeenItemIds] = useState([]);
  const [practiceLevel, setPracticeLevel] = useState(1);
  const [levelStreak, setLevelStreak] = useState(0);
  const [levelModal, setLevelModal] = useState(null);
  const [lastResult, setLastResult] = useState('none');
  const [difficulty, setDifficulty] = useState('adaptive');
  // ── practiceMode & staticSkillIndex are derived from URL (not React state) ─
  // practiceMode = 'adaptive' | 'static'  → read from searchParams above
  // staticSkillIndex is computed live so no useState needed
  const [history, setHistory] = useState([]);
  const [nextStaticQn, setNextStaticQn] = useState(null); // stores incorrect branch target during feedback
  const [progressionEasyCount, setProgressionEasyCount] = useState(0);
  const [progressionMediumCount, setProgressionMediumCount] = useState(0);
  const [progressionHardCount, setProgressionHardCount] = useState(0);
  const [progressionStageModal, setProgressionStageModal] = useState(null);
  const [streakThreshold, setStreakThreshold] = useState(5);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [jsonCopyStatus, setJsonCopyStatus] = useState('Copy');
  const [transitionState, setTransitionState] = useState('idle');
  const [praiseMessage, setPraiseMessage] = useState(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState([]);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [isSecondTry, setIsSecondTry] = useState(false);
  const isMontessoriMode = useMemo(() => {
    return searchParams.get('theme') === 'montessori';
  }, [searchParams]);

  const handleToggleOverlay = (toolId) => {
    setActiveOverlays((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  // Timer states and effect
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Student Profile states
  const [activeStudent, setActiveStudent] = useState('Alex');
  const [studentList, setStudentList] = useState(['Alex', 'Sam', 'Charlie', 'Taylor']);



  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedStudent = window.localStorage.getItem('wexls.activeStudent.v1');
      if (storedStudent) setActiveStudent(storedStudent);

      const storedList = window.localStorage.getItem('wexls.studentList.v1');
      if (storedList) {
        try {
          const parsed = JSON.parse(storedList);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStudentList(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse student list', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.success && data.session?.userId) {
          const uId = data.session.userId;
          setActiveStudent(uId);
          setStudentList((prev) => {
            if (prev.includes(uId)) return prev;
            return [uId, ...prev];
          });
        }
      } catch (err) {
        console.warn('Failed to load session in practice page:', err);
      }
    }
    loadSession();
  }, []);

  // ── Adaptive Engine State ─────────────────────────────────────────────────
  const [skillState, setSkillState] = useState('practicing'); // locked | practicing | mastered | remediation | prerequisite_review | bridge_back
  const [masteredOverlay, setMasteredOverlay] = useState(null); // { skillLabel, nextSkills[] }
  const [adaptiveBanner, setAdaptiveBanner] = useState(null);  // { type: 'fallback'|'bridge_back'|'remediating', message, targetSkillId? }
  const [teacherOverrideOpen, setTeacherOverrideOpen] = useState(false);

  // ── Diagnostic Placement Mode State ──────────────────────────────────────
  const isDiagnosticMode = resolveSearchValue(searchParams, 'diagnostic') === 'true';
  const DIAGNOSTIC_TOTAL = 5;
  const [diagPhase, setDiagPhase] = useState('idle'); // idle | running | done
  const [diagStep, setDiagStep] = useState(0);        // 0-4
  const [diagSkillLadder, setDiagSkillLadder] = useState([]); // array of skillId strings
  const [diagQuestion, setDiagQuestion] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagAnswer, setDiagAnswer] = useState(null);
  const [diagAnswered, setDiagAnswered] = useState(false);
  const [diagCorrect, setDiagCorrect] = useState(false);
  const [diagSteps, setDiagSteps] = useState([]); // [{skillId, label, isCorrect, timeSpentMs}]
  const [diagResult, setDiagResult] = useState(null); // final summary
  const diagStartedAtRef = useRef(Date.now());

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

  const activeSkillOption = useMemo(() => {
    if (!sourceConfig?.options) return null;
    return sourceConfig.options.find(o => o.value === logicType);
  }, [sourceConfig, logicType]);

  const progressionConfig = activeSkillOption?.progressionConfig;

  const activeProgressionDifficulty = useMemo(() => {
    if (!progressionConfig?.enabled) return null;
    const easyTarget = Number(progressionConfig.easyCount || 0);
    const mediumTarget = Number(progressionConfig.mediumCount || 0);
    const hardTarget = Number(progressionConfig.hardCount || 0);

    if (progressionEasyCount < easyTarget) return 'easy';
    if (progressionMediumCount < mediumTarget) return 'medium';
    if (progressionHardCount < hardTarget) return 'hard';
    return 'end';
  }, [progressionConfig, progressionEasyCount, progressionMediumCount, progressionHardCount]);

  const questionJson = useMemo(() => (
    JSON.stringify({ question, template: templateJson }, null, 2)
  ), [question, templateJson]);

  const buildQuestionUrl = useCallback((sessionOverride = {}, seed = String(Date.now())) => {
    const url = new URL(sourceConfig.api, window.location.origin);
    url.searchParams.set('subject', urlSubject || sourceConfig.subject);
    url.searchParams.set('topic', urlTopic || sourceConfig.topic);
    url.searchParams.set('skill', logicType);
    url.searchParams.set('forcedTask', logicType);

    const activeDifficulty = activeProgressionDifficulty && activeProgressionDifficulty !== 'end'
      ? activeProgressionDifficulty
      : difficulty;
    url.searchParams.set('difficulty', activeDifficulty);
    url.searchParams.set('correctStreak', String(sessionOverride.correctStreak ?? correctStreak));
    url.searchParams.set('practiceLevel', String(sessionOverride.practiceLevel ?? practiceLevel));
    url.searchParams.set('levelStreak', String(sessionOverride.levelStreak ?? levelStreak));
    url.searchParams.set('lastResult', sessionOverride.lastResult ?? lastResult);
    url.searchParams.set('smartScore', String(sessionOverride.smartScore ?? smartScore));

    if (urlQn && !progressionConfig?.enabled) {
      url.searchParams.set('qn', urlQn);
    }
    if (urlIit) {
      url.searchParams.set('iit', 'true');
    }
    if (urlImo) {
      url.searchParams.set('imo', 'true');
    }
    if (practiceMode === 'static') {
      url.searchParams.set('mode', 'static');
    }

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
      userId: activeStudent,
    });
    const remediationNeeded = sessionOverride.remediationNeeded ?? storedMastery?.remediationNeeded ?? false;
    url.searchParams.set('remediationActive', remediationNeeded ? 'true' : 'false');
    url.searchParams.set('remediationStep', remediationNeeded ? '1' : '0');
    url.searchParams.set('seed', seed);

    const currentSeen = sessionOverride.seenItemIds ?? seenItemIds;
    if (currentSeen && currentSeen.length > 0) {
      url.searchParams.set('seenItems', currentSeen.join(','));
    }

    return url;
  }, [
    activeStudent,
    correctStreak,
    difficulty,
    lastResult,
    levelStreak,
    logicType,
    practiceLevel,
    sourceConfig,
    urlSubject,
    urlTopic,
    urlIit,
    urlImo,
    urlQn,
    seenItemIds,
    activeProgressionDifficulty,
    progressionConfig,
    practiceMode
  ]);

  const applyQuestionPayload = useCallback((data, sessionOverride = {}) => {
    if (data?.success && data?.question) {
      setQuestion(data.question);
      setTemplateJson(data.template || null);
      setQuestionStartedAt(Date.now());
      if (data.question.metadata?.streakThreshold) {
        setStreakThreshold(Number(data.question.metadata.streakThreshold));
      } else if (data.question.streakThreshold) {
        setStreakThreshold(Number(data.question.streakThreshold));
      } else {
        setStreakThreshold(5);
      }
      if (Array.isArray(data.pickedItemIds)) {
        setSeenItemIds(prev => {
          let next = [...prev];
          if (next.length >= 20) {
            next = [];
          }
          data.pickedItemIds.forEach(id => {
            if (!next.includes(id)) next.push(id);
          });
          return next;
        });
      }
      if (sessionOverride.slideIn) {
        setTransitionState('slideIn');
        window.setTimeout(() => setTransitionState('idle'), 520);
      }
      return true;
    }

    setQuestion(null);
    setTemplateJson(data?.error || null);
    return false;
  }, []);

  const fetchQuestionPayload = useCallback(async (sessionOverride = {}) => {
    const url = buildQuestionUrl(sessionOverride, String(Date.now()));
    const res = await fetch(url.toString());
    return res.json();
  }, [buildQuestionUrl]);
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

    if (isDeveloperUnlockEnabled) {
      params.set('dev', 'true');
    }

    // Preserve the current mode param so it stays tied to skill ID in the URL
    if (practiceMode === 'static') {
      params.set('mode', 'static');
    }

    // Preserve qn and iit parameters from current URL location if they exist
    if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.has('qn')) {
        params.set('qn', currentParams.get('qn'));
      }
      if (currentParams.has('iit')) {
        params.set('iit', currentParams.get('iit'));
      }
    }

    router.replace(`/practice?${params.toString()}`, { scroll: false });
  }, [router, urlSkill, urlSubject, urlTopic, mergedConfigs, isDeveloperUnlockEnabled, practiceMode]);

  // ── setMode: update only the ?mode= param in URL without resetting skill ─
  const setMode = useCallback((mode) => {
    const params = new URLSearchParams(window.location.search);
    if (mode === 'static') {
      params.set('mode', 'static');
    } else {
      params.delete('mode');
    }
    router.replace(`/practice?${params.toString()}`, { scroll: false });
  }, [router]);

  // Force static mode if the active skill specifies isStatic: true
  useEffect(() => {
    if (question?.metadata?.isStatic && practiceMode !== 'static') {
      setMode('static');
    }
  }, [question, practiceMode, setMode]);

  const fetchQuestion = useCallback(async (resetSession = false, sessionOverride = {}) => {
    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;
    loadingRef.current = true;
    setLoading(!sessionOverride.keepTransition);
    setLastResult('none');
    setUserAnswer(null);
    setActiveOverlays([]);
    setIsAnswered(false);
    setAttemptsCount(0);
    setIsSecondTry(false);
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
      setProgressionEasyCount(0);
      setProgressionMediumCount(0);
      setProgressionHardCount(0);
      setProgressionStageModal(null);
    }

    if (activeProgressionDifficulty === 'end') {
      setMasteredOverlay({
        skillLabel: activeSkillOption?.label || logicType,
        nextSkills: [],
      });
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    if (logicType === 'meas-k-build-shapes-sticks') {
      const mockQuestion = {
        id: 'meas-k-build-shapes-sticks',
        type: 'interactive_sticks_builder',
        title: 'Build shapes with sticks',
        questionText: 'Use the sticks to build a shape.',
        showSubmitButton: false,
        metadata: {
          subject: 'math',
          topic: 'measurement',
          grade: 'Kindergarten',
          skillId: 'meas-k-build-shapes-sticks'
        }
      };
      setQuestion(mockQuestion);
      setLoading(false);
      loadingRef.current = false;
      return;
    }

    try {
      let seed = String(Date.now());
      const urlSeed = resolveSearchValue(searchParams, 'seed');
      if (urlSeed && !seedUsedRef.current) {
        seed = urlSeed;
        seedUsedRef.current = true;
        try {
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.has('seed')) {
            currentUrl.searchParams.delete('seed');
            window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
          }
        } catch (e) {
          console.warn('Failed to clean up seed from URL:', e);
        }
      }

      const url = buildQuestionUrl(sessionOverride, seed);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (fetchRequestIdRef.current !== requestId) return;

      applyQuestionPayload(data, sessionOverride);
    } catch (error) {
      if (fetchRequestIdRef.current !== requestId) return;
      console.error('Practice fetch error:', error);
      setQuestion(null);
      setTemplateJson(error.message);
    } finally {
      if (fetchRequestIdRef.current === requestId) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [applyQuestionPayload, buildQuestionUrl, searchParams, activeProgressionDifficulty, activeSkillOption, logicType]);

  // ── Static Mode: advance to the next skill in order ──────────────────────
  const advanceStaticSkill = useCallback((direction = 'next') => {
    const options = sourceConfig.options || [];
    if (options.length === 0) return;
    // Derive current index live from logicType — no separate state needed
    const currentIdx = options.findIndex(o => o.value === logicType);
    const base = currentIdx >= 0 ? currentIdx : 0;
    const next = direction === 'next'
      ? (base + 1) % options.length
      : Math.max(0, base - 1);
    const nextSkill = options[next];
    if (nextSkill) {
      setLogicType(nextSkill.value);
      syncRoute(sourceKey, nextSkill.value);
    }
  }, [sourceConfig.options, sourceKey, logicType, syncRoute]);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const [res, templatesRes] = await Promise.all([
          fetch('/api/curriculum?tree=true'),
          fetch('/api/admin/templates')
        ]);
        const data = await res.json();
        const templatesData = await templatesRes.json();

        const loadedConfigs = {};

        if (data && data.success && Array.isArray(data.tree)) {
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
        }

        if (templatesData && templatesData.success && Array.isArray(templatesData.dynamicTemplates)) {
          templatesData.dynamicTemplates.forEach(t => {
            const tTopic = String(t.topic || '').toLowerCase().trim();
            const groupName = t.grade ? (t.grade === 'remediation' ? 'Remediation' : `Grade ${t.grade}`) : 'Dynamic Templates';
            const optionObj = {
              group: groupName,
              label: t.title || t.name || t.id,
              value: t.id
            };
            
            let targetKey = null;
            if (tTopic === 'addition') targetKey = 'addition-topic';
            else if (tTopic === 'subtraction') targetKey = 'subtraction';
            else if (tTopic === 'division') targetKey = 'division';
            else if (tTopic === 'probability') targetKey = 'probability';
            
            if (targetKey) {
              if (!loadedConfigs[targetKey]) {
                loadedConfigs[targetKey] = {
                  api: '/api/practice',
                  subject: t.subject || 'math',
                  topic: tTopic,
                  options: []
                };
              }
              if (!loadedConfigs[targetKey].options) {
                loadedConfigs[targetKey].options = [];
              }
              if (!loadedConfigs[targetKey].options.some(opt => opt.value === t.id)) {
                loadedConfigs[targetKey].options.push(optionObj);
              }
              if (!loadedConfigs[targetKey].defaultLogicType) {
                loadedConfigs[targetKey].defaultLogicType = t.id;
              }
            }
          });

          const templateOptions = templatesData.dynamicTemplates.map(t => {
            const groupName = t.subject ? String(t.subject).toUpperCase() : 'OTHER';
            return {
              group: groupName,
              label: t.title || t.id,
              value: t.id
            };
          });
          if (templateOptions.length > 0) {
            loadedConfigs['dynamic-templates'] = {
              label: 'Dynamic Templates',
              api: '/api/practice',
              badge: 'DYNAMIC',
              description: 'Practice questions generated dynamically from custom templates.',
              defaultLogicType: templateOptions[0]?.value || '',
              subject: 'math',
              topic: 'dynamic-templates',
              options: templateOptions,
              tips: [
                { label: 'Live generation', text: 'Questions are generated in real-time from active masterclass templates.' }
              ]
            };
          }
        }

        setDbConfigs(loadedConfigs);
      } catch (err) {
        console.error('Failed to load curriculum tree or templates:', err);
      } finally {
        setCurriculumLoading(false);
      }
    }
    loadCurriculum();
  }, []);

  useEffect(() => {
    if (curriculumLoading) return;
    let nextSource = sourceFromSubjectTopic(urlSubject, urlTopic, initialSource);
    const nextLogicType = urlSkill
      || resolveSearchValue(searchParams, 'forcedTask')
      || resolveSearchValue(searchParams, 'logic_type')
      || (mergedConfigs[nextSource] || mergedConfigs['addition-topic']).defaultLogicType;

    if (nextLogicType && (nextLogicType.startsWith('template-') || nextLogicType.startsWith('dynamic_template') || nextLogicType.startsWith('dynamic-template'))) {
      if (mergedConfigs['dynamic-templates']) {
        nextSource = 'dynamic-templates';
      }
    }

    setSourceKey(nextSource);
    setLogicType(nextLogicType);
  }, [urlSubject, urlTopic, urlSkill, searchParams, initialSource, curriculumLoading, mergedConfigs]);

  useEffect(() => {
    seedUsedRef.current = false;
    setSeenItemIds([]);
    setProgressionEasyCount(0);
    setProgressionMediumCount(0);
    setProgressionHardCount(0);
    setProgressionStageModal(null);
  }, [logicType]);

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
      userId: activeStudent,
    });

    if (storedMastery) {
      setSmartScore(Number(storedMastery.smartScore || 0));
      setCorrectStreak(Number(storedMastery.correctStreak || 0));
      setPracticeLevel(Number(storedMastery.practiceLevel || 1));
      setLevelStreak(Number(storedMastery.levelStreak || 0));
      setLastResult(storedMastery.lastResult || 'none');
      setStreakThreshold(Number(storedMastery.streakThreshold || 5));
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
    setStreakThreshold(5);
    fetchQuestion(false, {
      correctStreak: 0,
      practiceLevel: 1,
      levelStreak: 0,
      lastResult: 'none',
    });
  }, [sourceKey, logicType, difficulty, urlSubject, urlTopic, curriculumLoading, activeStudent]);

  const handleSubmit = async (answerOverride = undefined) => {
    const answerToCheck = answerOverride === undefined ? userAnswer : answerOverride;
    if (!question || answerToCheck === null || answerToCheck === undefined || isAnswered || submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    const correct = isAnswerCorrect(question, answerToCheck);
    
    if (isMontessoriMode && !correct && attemptsCount === 0) {
      setAttemptsCount(1);
      setIsSecondTry(true);
      submittingRef.current = false;
      setIsSubmitting(false);
      const voiceName = question?.voice || 'Puck';
      speakText("Almost! Let's check it. Let's count again and choose our answer!", voiceName);
      return;
    }
    
    const newSmartScore = calculateSmartScore(smartScore, correct);
    const competency = question.metadata?.competency || currentCompetency;
    const attempt = createAttempt({
      question: {
        ...question,
        metadata: {
          ...(question.metadata || {}),
          competencyId: competency?.id || question.metadata?.competencyId || null,
          competency: competency || question.metadata?.competency || null,
          streakThreshold,
        },
      },
      userId: activeStudent,
      userAnswer: answerToCheck,
      isCorrect: correct,
      difficulty,
      practiceLevel,
      smartScoreBefore: smartScore,
      smartScoreAfter: newSmartScore,
      startedAt: questionStartedAt,
    });

    // 1. Instant local/provisional updates
    setSmartScore(newSmartScore);
    setIsCorrect(correct);
    setIsAnswered(true);
    setLastResult(correct ? 'correct' : 'incorrect');

    if (correct && progressionConfig?.enabled) {
      const qDiffVal = Number(question.difficulty ?? question.metadata?.difficulty ?? 0.2);
      const easyTarget = Number(progressionConfig.easyCount || 0);
      const mediumTarget = Number(progressionConfig.mediumCount || 0);
      const hardTarget = Number(progressionConfig.hardCount || 0);

      if (qDiffVal >= 0.7) {
        setProgressionHardCount(prev => prev + 1);
      } else if (qDiffVal >= 0.4) {
        setProgressionMediumCount(prev => {
          const nextVal = prev + 1;
          if (prev < mediumTarget && nextVal === mediumTarget && hardTarget > 0) {
            setProgressionStageModal({
              icon: '🔥',
              title: 'Stage 3: Hard Unlocked',
              subtitle: "Brilliant work! You are now in the Challenge Zone. Get ready for the Hard questions!"
            });
            try {
              speakText('Stage 3 unlocked. Prepare for the hard questions.', question?.voice || 'Puck');
            } catch (e) {}
          }
          return nextVal;
        });
      } else {
        setProgressionEasyCount(prev => {
          const nextVal = prev + 1;
          if (prev < easyTarget && nextVal === easyTarget && mediumTarget > 0) {
            setProgressionStageModal({
              icon: '🔵',
              title: 'Stage 2: Medium Unlocked',
              subtitle: "Fantastic work completing the Easy stage! Let's step up to the Medium questions."
            });
            try {
              speakText('Stage 2 unlocked. Now heading to medium questions.', question?.voice || 'Puck');
            } catch (e) {}
          }
          return nextVal;
        });
      }
    }

    let praiseMsgObj = null;
    if (correct) {
      const provisionalNextMastery = updateMasteryState(loadMasteryState(attempt), attempt);
      const nextCorrectStreak = provisionalNextMastery.correctStreak;
      const finalLevelStreak = provisionalNextMastery.levelStreak;
      const nextPracticeLevel = provisionalNextMastery.practiceLevel;
      const didLevelUp = provisionalNextMastery.didLevelUp;
      const currentThreshold = provisionalNextMastery.streakThreshold || 5;

      const praisePool = didLevelUp
        ? ['Level up!', 'Brilliant streak!', 'You are moving up!']
        : nextCorrectStreak >= 4
          ? ['Fantastic!', 'Sharp work!', 'Great streak!']
          : ['Well done!', 'Nice work!', 'Correct!'];

      praiseMsgObj = {
        title: praisePool[nextCorrectStreak % praisePool.length],
        subtitle: didLevelUp
          ? `${currentThreshold} in a row. Now Level ${nextPracticeLevel}.`
          : `${finalLevelStreak}/${currentThreshold} correct toward Level ${nextPracticeLevel < 4 ? nextPracticeLevel + 1 : 4}.`,
      };
      setPraiseMessage(praiseMsgObj);
      setTransitionState('praise');
    }

    // 2. Call the server endpoint and await results
    let serverData = null;
    try {
      const response = await fetch('/api/adaptive/submit-and-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeStudent,
          userId: activeStudent,
          questionId: question.id || question._id || question.metadata?.questionId || null,
          question,
          seed: attempt.seed,
          userAnswer: answerToCheck,
          subject: attempt.subject,
          topic: attempt.topic,
          skillId: attempt.skillId,
          competencyId: attempt.competencyId,
          difficulty,
          practiceLevel,
          smartScoreBefore: smartScore,
          startedAt: questionStartedAt,
          streakThreshold,
        }),
      });
      if (response.ok) {
        serverData = await response.json();
      }
    } catch (err) {
      console.warn('Adaptive server sync failed (using local fallback):', err.message);
    }

    // 3. Resolve canonical state
    let canonicalMastery;
    let canonicalCorrect = correct;

    if (serverData && serverData.success) {
      canonicalMastery = serverData.mastery;
      canonicalCorrect = serverData.isCorrect;
    } else {
      // Offline/error fallback logic
      const previousMastery = loadMasteryState(attempt);
      canonicalMastery = updateMasteryState(previousMastery, attempt);
      saveMasteryState(attempt, canonicalMastery);
      appendAttempt(attempt);
    }

    // 4. Update the actual states with canonical values
    const nextCorrectStreak = canonicalMastery.correctStreak;
    const nextPracticeLevel = canonicalMastery.practiceLevel;
    const finalLevelStreak = canonicalMastery.levelStreak;
    const didLevelUp = canonicalMastery.didLevelUp;
    const currentThreshold = canonicalMastery.streakThreshold || 5;
    const adaptiveAction = canonicalMastery.nextAction;

    setSkillState(canonicalMastery.state || 'practicing');
    setSmartScore(canonicalMastery.smartScore);
    setCorrectStreak(nextCorrectStreak);
    setStreakThreshold(currentThreshold);

    if (didLevelUp && !progressionConfig?.enabled) {
      setPracticeLevel(nextPracticeLevel);
      setLevelStreak(finalLevelStreak);
      setLevelModal({
        level: nextPracticeLevel,
        isMaxLevel: nextPracticeLevel === 4,
      });
      if (isPreK) {
        speakText(`Awesome! Level ${nextPracticeLevel}! Keep going!`, question?.voice || 'Kore');
      } else {
        speakText(`Level ${nextPracticeLevel} unlocked.`, question?.voice || 'Puck');
      }
    } else {
      setPracticeLevel(nextPracticeLevel);
      setLevelStreak(finalLevelStreak);
    }

    setLastResult(canonicalCorrect ? 'correct' : 'incorrect');
    setIsCorrect(canonicalCorrect);

    setHistory((prev) => [{
      type: question.metadata?.skillId || logicType,
      isCorrect: canonicalCorrect,
      scoreChange: canonicalMastery.smartScore - smartScore,
      smartScoreAfter: canonicalMastery.smartScore,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev].slice(0, 5));

    // ── Static Mode Override: skip adaptive routing, just move to next skill ──
    const isStaticSkill = question?.metadata?.isStatic === true;
    if (isStaticSkill) {
      const branching = question?.metadata?.branching;
      let nextQn = branching ? (canonicalCorrect ? branching.correct : branching.incorrect) : null;
      if (!nextQn) {
        nextQn = question?.metadata?.nextQuestionId || null;
      }

      if (canonicalCorrect) {
        if (nextQn === 'end') {
          setMasteredOverlay({
            skillLabel: sourceConfig.options.find((o) => o.value === logicType)?.label || logicType,
            nextSkills: [],
          });
          setIsSubmitting(false);
          submittingRef.current = false;
          return;
        }

        setAdaptiveBanner(null);
        window.setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          if (nextQn) {
            params.set('qn', String(nextQn));
          } else {
            // Fallback: increment sequentially
            const currentQn = parseInt(params.get('qn') || '0', 10);
            if (!isNaN(currentQn)) {
              params.set('qn', String(currentQn + 1));
            } else {
              params.set('qn', 'end');
            }
          }
          router.replace(`/practice?${params.toString()}`, { scroll: false });

          setIsSubmitting(false);
          submittingRef.current = false;
          window.setTimeout(() => fetchQuestion(false, {
            correctStreak: (correctStreak + 1),
            practiceLevel,
            levelStreak,
            lastResult: 'correct',
            slideIn: true,
          }), 400);
        }, 800);
      } else {
        // Incorrect: show explanation feedback first, save routing target in state
        setNextStaticQn(nextQn);
        setIsSubmitting(false);
        submittingRef.current = false;
      }
      return;
    }

    if (practiceMode === 'static') {
      setAdaptiveBanner(null);
      window.setTimeout(() => {
        advanceStaticSkill('next');
        setIsSubmitting(false);
        submittingRef.current = false;
        window.setTimeout(() => fetchQuestion(false, {
          correctStreak: canonicalCorrect ? (correctStreak + 1) : 0,
          practiceLevel,
          levelStreak,
          lastResult: canonicalCorrect ? 'correct' : 'incorrect',
          slideIn: true,
        }), 400);
      }, 800);
      return;
    }

    // ── Adaptive Action Routing ─────────────────────────────────────────────
    if (adaptiveAction === 'promote') {
      if (canonicalMastery.masteryRouteTarget) {
        const nextSkillId = canonicalMastery.masteryRouteTarget;
        setLogicType(nextSkillId);
        syncRoute(sourceKey, nextSkillId);
        
        // Do not return; fall through to load the preloaded next question of the new template
      } else {
        const nextSkills = getNextUnlockingSkills(
          urlSubject || sourceConfig.subject,
          urlTopic || sourceConfig.topic,
          logicType
        );
        setMasteredOverlay({
          skillLabel: sourceConfig.options.find((o) => o.value === logicType)?.label || logicType,
          nextSkills: nextSkills.slice(0, 3),
        });
        setAdaptiveBanner(null);
        setIsSubmitting(false);
        submittingRef.current = false;
        return;
      }
    }

    if (adaptiveAction === 'fallback') {
      const fallbackSkillId = canonicalMastery.fallbackSkillId;
      if (fallbackSkillId) {
        const fallbackLabel = sourceConfig.options.find((o) => o.value === fallbackSkillId)?.label || fallbackSkillId;
        setAdaptiveBanner({
          type: 'fallback',
          message: `Let's take a step back and review a simpler skill first!`,
          targetSkillId: fallbackSkillId,
          targetLabel: fallbackLabel,
        });
        window.setTimeout(() => {
          setLogicType(fallbackSkillId);
          syncRoute(sourceKey, fallbackSkillId);
        }, 1800);
      }
      setIsSubmitting(false);
      submittingRef.current = false;
      return;
    }

    if (adaptiveAction === 'bridge_back') {
      const targetSkillId = canonicalMastery.sourceSkillId || logicType;
      const targetLabel = sourceConfig.options.find((o) => o.value === targetSkillId)?.label || targetSkillId;
      setAdaptiveBanner({
        type: 'bridge_back',
        message: `Great work! You're ready to return to the original skill.`,
        targetSkillId,
        targetLabel,
      });
      window.setTimeout(() => {
        setLogicType(targetSkillId);
        syncRoute(sourceKey, targetSkillId);
        setAdaptiveBanner(null);
      }, 2000);
      setIsSubmitting(false);
      submittingRef.current = false;
      return;
    }

    if (adaptiveAction === 'remediating') {
      setAdaptiveBanner({
        type: 'remediating',
        message: `No worries — switching to guided practice mode.`,
      });
    } else {
      setAdaptiveBanner(null);
    }

    if (canonicalCorrect) {
      if (urlQn) {
        const params = new URLSearchParams(window.location.search);
        params.delete('qn');
        params.delete('questionId');
        params.delete('id');
        router.replace(`/practice?${params.toString()}`, { scroll: false });
      }

      const nextQuestionSession = {
        correctStreak: nextCorrectStreak,
        practiceLevel: nextPracticeLevel,
        levelStreak: finalLevelStreak,
        lastResult: 'correct',
        remediationNeeded: false,
        keepTransition: true,
        slideIn: true,
      };

      let nextQuestionPromise;
      if (serverData && serverData.success && serverData.nextPayload?.success) {
        nextQuestionPromise = Promise.resolve(serverData.nextPayload);
      } else {
        nextQuestionPromise = fetchQuestionPayload(nextQuestionSession).catch((error) => {
          console.warn('Next question preload skipped:', error.message);
          return null;
        });
      }

      const praisePool = didLevelUp
        ? ['Level up!', 'Brilliant streak!', 'You are moving up!']
        : nextCorrectStreak >= 4
          ? ['Fantastic!', 'Sharp work!', 'Great streak!']
          : ['Well done!', 'Nice work!', 'Correct!'];

      setPraiseMessage({
        title: praisePool[nextCorrectStreak % praisePool.length],
        subtitle: didLevelUp
          ? `${currentThreshold} in a row. Now Level ${nextPracticeLevel}.`
          : `${finalLevelStreak}/${currentThreshold} correct toward Level ${nextPracticeLevel < 4 ? nextPracticeLevel + 1 : 4}.`,
      });

      window.setTimeout(() => {
        nextQuestionPromise.then((preloadedData) => {
          if (preloadedData?.success && preloadedData?.question) {
            const requestId = fetchRequestIdRef.current + 1;
            fetchRequestIdRef.current = requestId;
            loadingRef.current = false;
            setLoading(false);
            setLastResult('none');
            setUserAnswer(null);
            setActiveOverlays([]);
            setIsAnswered(false);
            setAttemptsCount(0);
            setIsSecondTry(false);
            submittingRef.current = false;
            setIsSubmitting(false);
            setIsCorrect(false);
            setPraiseMessage(null);
            applyQuestionPayload(preloadedData, nextQuestionSession);
            return;
          }
          fetchQuestion(false, nextQuestionSession);
        });
      }, 950);
    } else {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  // ── Diagnostic Helpers ────────────────────────────────────────────────────

  // Build a 5-skill ladder from the current topic's options, evenly spread across available skills
  const buildDiagnosticLadder = useCallback(() => {
    const options = sourceConfig.options || [];
    if (options.length === 0) return [];
    const total = Math.min(DIAGNOSTIC_TOTAL, options.length);
    const step = Math.floor(options.length / total);
    const ladder = [];
    for (let i = 0; i < total; i++) {
      const idx = Math.min(i * step, options.length - 1);
      ladder.push(options[idx].value);
    }
    return ladder;
  }, [sourceConfig.options]);

  const fetchDiagnosticQuestion = useCallback(async (skillId) => {
    setDiagLoading(true);
    setDiagAnswer(null);
    setDiagAnswered(false);
    setDiagCorrect(false);
    diagStartedAtRef.current = Date.now();
    try {
      const url = new URL(sourceConfig.api, window.location.origin);
      url.searchParams.set('subject', urlSubject || sourceConfig.subject);
      url.searchParams.set('topic', urlTopic || sourceConfig.topic);
      url.searchParams.set('skill', skillId);
      url.searchParams.set('forcedTask', skillId);
      url.searchParams.set('difficulty', 'adaptive');
      url.searchParams.set('seed', String(Date.now()));
      if (urlIit) {
        url.searchParams.set('iit', 'true');
      }
      if (urlImo) {
        url.searchParams.set('imo', 'true');
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data?.success && data?.question) {
        setDiagQuestion(data.question);
      } else {
        setDiagQuestion(null);
      }
    } catch (err) {
      console.error('Diagnostic fetch error:', err);
      setDiagQuestion(null);
    } finally {
      setDiagLoading(false);
    }
  }, [sourceConfig, urlSubject, urlTopic, urlIit, urlImo]);

  // Start diagnostic session
  const startDiagnostic = useCallback(() => {
    const ladder = buildDiagnosticLadder();
    setDiagSkillLadder(ladder);
    setDiagStep(0);
    setDiagSteps([]);
    setDiagResult(null);
    setDiagPhase('running');
    if (ladder[0]) fetchDiagnosticQuestion(ladder[0]);
  }, [buildDiagnosticLadder, fetchDiagnosticQuestion]);

  // Auto-start diagnostic when curriculum is loaded
  useEffect(() => {
    if (!isDiagnosticMode || curriculumLoading) return;
    if (diagPhase === 'idle') startDiagnostic();
  }, [isDiagnosticMode, curriculumLoading, diagPhase, startDiagnostic]);

  const handleDiagnosticAnswer = useCallback((answer) => {
    if (diagAnswered || !diagQuestion) return;
    const correct = isAnswerCorrect(diagQuestion, answer);
    const timeSpentMs = Date.now() - diagStartedAtRef.current;
    const currentSkillId = diagSkillLadder[diagStep];
    const label = sourceConfig.options.find((o) => o.value === currentSkillId)?.label || currentSkillId;

    setDiagAnswer(answer);
    setDiagCorrect(correct);
    setDiagAnswered(true);

    const newStep = {
      skillId: currentSkillId,
      label,
      isCorrect: correct,
      timeSpentMs,
    };

    const updatedSteps = [...diagSteps, newStep];
    setDiagSteps(updatedSteps);

    const nextStep = diagStep + 1;
    if (nextStep >= DIAGNOSTIC_TOTAL || nextStep >= diagSkillLadder.length) {
      // Done — compute result
      const correctCount = updatedSteps.filter((s) => s.isCorrect).length;
      const totalQuestions = updatedSteps.length;
      const confidence = totalQuestions > 0 ? correctCount / totalQuestions : 0;
      // Estimated level: 0-5 range, scaled from ratio of correct answers
      // Bias toward end of ladder — later correct answers = higher level
      let weightedScore = 0;
      updatedSteps.forEach((s, i) => {
        if (s.isCorrect) weightedScore += (i + 1); // higher weight for harder questions
      });
      const maxWeight = updatedSteps.reduce((acc, _, i) => acc + (i + 1), 0);
      const estimatedLevel = Math.round((weightedScore / maxWeight) * 5);
      // recommendedStartSkill: first wrong answer's skill, or last skill if all correct
      const firstWrong = updatedSteps.find((s) => !s.isCorrect);
      const recommendedStartSkill = firstWrong ? firstWrong.skillId : updatedSteps[updatedSteps.length - 1].skillId;

      window.setTimeout(() => {
        setDiagResult({
          estimatedLevel,
          confidence,
          recommendedStartSkill,
          correctCount,
          totalQuestions,
          steps: updatedSteps,
        });
        setDiagPhase('done');
      }, 900);
    } else {
      // Next question
      window.setTimeout(() => {
        setDiagStep(nextStep);
        fetchDiagnosticQuestion(diagSkillLadder[nextStep]);
      }, 900);
    }
  }, [diagAnswered, diagQuestion, diagSkillLadder, diagStep, diagSteps, sourceConfig.options, fetchDiagnosticQuestion]);

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

  const handleNextQuestion = useCallback(() => {
    const isStaticSkill = question?.metadata?.isStatic === true;
    if (isStaticSkill) {
      if (nextStaticQn === 'end') {
        setMasteredOverlay({
          skillLabel: sourceConfig.options.find((o) => o.value === logicType)?.label || logicType,
          nextSkills: [],
        });
        setNextStaticQn(null);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      if (nextStaticQn) {
        params.set('qn', nextStaticQn);
      } else {
        // Fallback: increment sequentially
        const currentQn = parseInt(params.get('qn') || '0', 10);
        if (!isNaN(currentQn)) {
          params.set('qn', String(currentQn + 1));
        } else {
          params.set('qn', 'end');
        }
      }
      router.replace(`/practice?${params.toString()}`, { scroll: false });
      setNextStaticQn(null);

      window.setTimeout(() => {
        fetchQuestion(false, { slideIn: true });
      }, 50);
      return;
    }

    if (urlQn) {
      const params = new URLSearchParams(window.location.search);
      params.delete('qn');
      params.delete('questionId');
      params.delete('id');
      router.replace(`/practice?${params.toString()}`, { scroll: false });
    }
    fetchQuestion();
  }, [question, nextStaticQn, urlQn, fetchQuestion, router, logicType, sourceConfig.options]);

  const inlineFeedback = isAnswered && !isCorrect ? (
    <PracticeFeedback
      question={question}
      isCorrect={isCorrect}
      isPreK={isPreK}
      onNext={handleNextQuestion}
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

  // ── Diagnostic Mode Rendering ──────────────────────────────────────────────
  if (isDiagnosticMode) {
    if (diagPhase === 'done' && diagResult) {
      return (
        <DiagnosticSummaryCard
          result={diagResult}
          sourceConfig={sourceConfig}
          onStartSkill={(skillId) => {
            const params = new URLSearchParams();
            if (urlSubject || urlTopic || urlSkill) {
              params.set('subject', sourceConfig.subject);
              params.set('topic', sourceConfig.topic);
              params.set('skill', skillId || sourceConfig.defaultLogicType);
            } else {
              params.set('source', sourceKey);
              params.set('forcedTask', skillId || sourceConfig.defaultLogicType);
            }
            router.push(`/practice?${params.toString()}`);
          }}
          onRetry={() => {
            setDiagPhase('idle');
            setDiagResult(null);
            startDiagnostic();
          }}
        />
      );
    }

    // Running the diagnostic questions
    const accentColor = '#6366f1';
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #f8f7ff 0%, #eef2ff 50%, #f0fdf4 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          fontFamily: `'Inter', system-ui, sans-serif`,
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
          @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          @keyframes spinDiag { to { transform: rotate(360deg); } }
          @keyframes popQ { from { opacity:0; transform:scale(0.97) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
          .diag-submit:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35) !important; }
          .diag-submit { transition: all 180ms ease !important; }
        ` }} />

        {/* Top header strip */}
        <div style={{ width: 'min(560px, 100%)', marginBottom: 20, animation: 'fadeUp 0.3s ease' }}>
          {/* Brand row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}>
                🧭
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#1e293b' }}>Diagnostic Placement</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>{sourceConfig.label}</div>
              </div>
            </div>
            <div style={{
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 900,
              color: accentColor,
            }}>
              {diagStep + 1} <span style={{ color: '#a5b4fc' }}>/ {DIAGNOSTIC_TOTAL}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              width: `${(diagStep / DIAGNOSTIC_TOTAL) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              borderRadius: 999,
              transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 10px rgba(99,102,241,0.4)',
            }} />
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {Array.from({ length: DIAGNOSTIC_TOTAL }).map((_, i) => {
              const stepResult = diagSteps[i];
              const isCurrent = i === diagStep;
              return (
                <div
                  key={i}
                  style={{
                    height: 8,
                    width: isCurrent ? 24 : 8,
                    borderRadius: 999,
                    background: stepResult
                      ? (stepResult.isCorrect ? '#22c55e' : '#ef4444')
                      : isCurrent ? accentColor : '#e2e8f0',
                    transition: 'all 350ms cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: isCurrent ? `0 0 8px ${accentColor}66` : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <div
          key={`card-${diagStep}`}
          style={{
            width: 'min(560px, 100%)',
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(99,102,241,0.10)',
            overflow: 'hidden',
            animation: 'popQ 0.3s ease',
          }}
        >
          {/* Top accent line */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #818cf8, #a5b4fc)' }} />

          <div style={{ padding: 28 }}>
            {/* Skill label chip */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              borderRadius: 999,
              padding: '4px 12px',
              marginBottom: 18,
            }}>
              <span style={{ fontSize: 10 }}>📌</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {sourceConfig.options.find((o) => o.value === diagSkillLadder[diagStep])?.label || diagSkillLadder[diagStep]}
              </span>
            </div>

            {diagLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 0' }}>
                <div style={{
                  width: 34, height: 34,
                  border: '3px solid #e2e8f0',
                  borderTopColor: accentColor,
                  borderRadius: '50%',
                  animation: 'spinDiag 0.75s linear infinite',
                }} />
                <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: 13 }}>Loading question...</span>
              </div>
            ) : diagQuestion ? (
              <>
                <QuestionRenderer
                  key={`diag:${diagStep}:${diagQuestion.id}`}
                  question={diagQuestion}
                  userAnswer={diagAnswer}
                  isAnswered={diagAnswered}
                  isCorrect={diagCorrect}
                  onAnswer={(answer) => {
                    if (diagAnswered) return;
                    setDiagAnswer(answer);
                    if (
                      diagQuestion.type === 'mcq' ||
                      diagQuestion.type === 'multipleChoice' ||
                      diagQuestion.type === 'multiplechoice'
                    ) {
                      window.setTimeout(() => handleDiagnosticAnswer(answer), 0);
                    }
                  }}
                  onSubmit={handleDiagnosticAnswer}
                />

                {/* Submit button */}
                {!diagAnswered && (
                  <button
                    type="button"
                    id="diagnostic-submit-btn"
                    className="diag-submit"
                    onClick={() => handleDiagnosticAnswer(diagAnswer)}
                    disabled={diagAnswer === null || diagAnswer === undefined}
                    style={{
                      width: '100%',
                      marginTop: 20,
                      background: (diagAnswer === null || diagAnswer === undefined)
                        ? '#f1f5f9'
                        : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                      border: 0,
                      color: (diagAnswer === null || diagAnswer === undefined) ? '#94a3b8' : '#ffffff',
                      borderRadius: 14,
                      padding: '13px 20px',
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: (diagAnswer === null || diagAnswer === undefined) ? 'not-allowed' : 'pointer',
                      boxShadow: (diagAnswer === null || diagAnswer === undefined)
                        ? 'none'
                        : '0 4px 14px rgba(99,102,241,0.25)',
                    }}
                  >
                    Submit Answer
                  </button>
                )}

                {/* Answer feedback */}
                {diagAnswered && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: diagCorrect ? '#f0fdf4' : '#fff5f5',
                      border: `1.5px solid ${diagCorrect ? '#bbf7d0' : '#fecaca'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      animation: 'fadeUp 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{diagCorrect ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: diagCorrect ? '#16a34a' : '#dc2626' }}>
                        {diagCorrect ? 'Correct!' : 'Incorrect'}
                      </div>
                      {diagStep + 1 < DIAGNOSTIC_TOTAL && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>Next question loading…</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#ef4444', fontWeight: 700, textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
                Could not load question. Please refresh.
              </div>
            )}
          </div>
        </div>

        {/* Exit */}
        <button
          type="button"
          onClick={() => router.push(`/practice?source=${sourceKey}`)}
          style={{
            marginTop: 20,
            background: 'transparent',
            border: 0,
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Exit Diagnostic
        </button>
      </div>
    );
  }

  const leftPanel = (() => {
    const activeOpt = sourceConfig.options.find(opt => opt.value === logicType);
    const activeGroup = activeOpt ? activeOpt.group : (sourceConfig.options[0]?.group || '');
    const activeGroupOptions = sourceConfig.options.filter(opt => opt.group === activeGroup);
    
    const timelineOptions = activeGroupOptions.length > 0 ? activeGroupOptions : sourceConfig.options;
    const activeIndex = timelineOptions.findIndex(opt => opt.value === logicType);

    return (
      <div className={styles.standardLeftPanelStack}>
        <div className={`${styles.panel} ${styles.learningPathPanel}`} style={{ padding: '20px', borderRadius: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Learning Path
            {isDeveloperUnlockEnabled ? (
              <span style={{ marginLeft: 8, color: '#16a34a', fontSize: 9 }}>DEV UNLOCKED</span>
            ) : null}
          </div>

          {/* Styled Topic Select Dropdown */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            {/* Left Subject Icon */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              background: '#6366f1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '18px',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              {urlSubject === 'english' || sourceConfig.subject === 'english' ? '📖' : (urlSubject === 'science' || sourceConfig.subject === 'science' ? '🧪' : '+')}
            </div>
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
                height: '52px',
                padding: '0 36px 0 52px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                background: '#ffffff',
                color: '#1e1b4b',
                fontWeight: 900,
                fontSize: '14px',
                appearance: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              {Object.entries(mergedConfigs).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            {/* Chevron Right Indicator */}
            <span style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#94a3b8',
              fontSize: '10px',
              fontWeight: 'bold',
              zIndex: 2
            }}>▼</span>
          </div>

          {/* Timeline representation */}
          <div className={styles.wexlsTimeline}>
            {timelineOptions.map((opt, idx) => {
              const isActive = logicType === opt.value;
              const isCompleted = idx < activeIndex;
              const isLocked = !isDeveloperUnlockEnabled && idx > activeIndex;

              return (
                <div key={opt.value} className={styles.wexlsTimelineItem}>
                  {/* Timeline connector line */}
                  {idx < timelineOptions.length - 1 && (
                    <div className={`${styles.wexlsTimelineLine} ${isCompleted ? styles.wexlsTimelineLineCompleted : ''}`} />
                  )}
                  {/* Timeline bullet icon */}
                  {isCompleted ? (
                    <div className={styles.wexlsTimelineIconCompleted}>✓</div>
                  ) : isActive ? (
                    <div className={styles.wexlsTimelineIconActive}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5' }} />
                    </div>
                  ) : (
                    <div className={styles.wexlsTimelineIconLocked}>•</div>
                  )}

                  <div className={styles.wexlsTimelineContent} style={{ flex: 1 }}>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        setLogicType(opt.value);
                        syncRoute(sourceKey, opt.value);
                      }}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        textAlign: 'left',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ minWidth: 0, paddingRight: '8px' }}>
                        <span className={styles.wexlsTimelineTitle} style={{
                          color: isActive ? '#4f46e5' : (isLocked ? '#94a3b8' : '#0f172a'),
                          fontWeight: isActive ? 950 : 800,
                          fontSize: '13px'
                        }}>
                          {opt.label.split(' ').slice(0, 3).join(' ')}
                        </span>
                        <span className={styles.wexlsTimelineSubtitle} style={{ 
                          display: 'block', 
                          marginTop: '2px', 
                          color: isLocked ? '#cbd5e1' : '#64748b',
                          fontSize: '10px'
                        }}>
                          {opt.label.split(' ').slice(3).join(' ') || 'practice'}
                        </span>
                      </div>
                      {isLocked && (
                        <span style={{ fontSize: '11px', color: '#cbd5e1', flexShrink: 0 }}>🔒</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Goal Widget */}
        <div className={styles.panel} style={{ padding: '16px 20px', borderRadius: '24px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
              <span style={{ fontSize: '12px', fontWeight: '950', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>Daily Goal</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', marginTop: '1px' }}>20 / 30 min</span>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '24px' }}>🏆</span>
          </div>
          <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ width: '66.6%', height: '100%', borderRadius: '999px', background: '#22c55e' }} />
          </div>
        </div>

        {/* Student switcher (Compact) */}
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>👤 Student</span>
          <select
            value={activeStudent}
            onChange={(event) => {
              const val = event.target.value;
              if (val === '__custom__') {
                const name = prompt('Enter student name:');
                if (name && name.trim()) {
                  const cleaned = name.trim();
                  setStudentList((prev) => {
                    const next = prev.includes(cleaned) ? prev : [...prev, cleaned];
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('wexls.studentList.v1', JSON.stringify(next));
                    }
                    return next;
                  });
                  setActiveStudent(cleaned);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('wexls.activeStudent.v1', cleaned);
                  }
                }
              } else {
                setActiveStudent(val);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('wexls.activeStudent.v1', val);
                }
              }
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 800,
              fontSize: '11px',
              maxWidth: '120px',
              cursor: 'pointer'
            }}
          >
            {studentList.map((student) => (
              <option key={student} value={student}>{student}</option>
            ))}
            <option value="__custom__">+ Add Custom...</option>
          </select>
        </div>
      </div>
    );
  })();

  const rightPanel = (() => {
    const total = history.length;
    const correct = history.filter(h => h.isCorrect).length;
    const incorrect = history.filter(h => !h.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;

    const recentAttempts = history.slice(0, 6).reverse();
    let visualScore = 50;
    const attemptScores = recentAttempts.map((attempt) => {
      visualScore = Math.min(92, Math.max(8, visualScore + (attempt.isCorrect ? 14 : -14)));
      return visualScore;
    });
    const chartScores = recentAttempts.length
      ? [50, ...attemptScores]
      : [42, 48, 58, 54, 66, 74];
    const chartPoints = chartScores.map((score, idx) => ({
      x: 8 + (idx * (184 / Math.max(1, chartScores.length - 1))),
      y: 46 - (score * 0.42),
    }));
    const attemptPoints = recentAttempts.map((attempt, idx) => ({
      ...chartPoints[idx + 1],
      isCorrect: attempt.isCorrect,
    }));
    const dPath = `M ${chartPoints.map((point) => `${point.x} ${point.y}`).join(' L ')}`;
    const areaPath = `${dPath} L ${chartPoints[chartPoints.length - 1].x} 48 L ${chartPoints[0].x} 48 Z`;
    const hasSessionTrend = recentAttempts.length > 0;

    const scaledScore = smartScore * 10;
    const nextMilestone = Math.min(1000, Math.ceil((scaledScore + 1) / 100) * 100 || 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Your Progress */}
        <div className={styles.panel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>Your Progress</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '110px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="#2563eb" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (smartScore / 100) * 251.2}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.35s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: '950', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>{smartScore}%</span>
              <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b' }}>Mastery</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '750', textAlign: 'center' }}>
            Keep it up! You're doing great!
          </p>

          {/* Sparkline Chart with Gradient Fill */}
          <div style={{ height: '60px', width: '100%', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <svg width="100%" height="100%" viewBox="0 0 200 50" preserveAspectRatio="none" aria-label="Question performance trend">
              <defs>
                <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#sparklineGrad)" />
              <path
                d={dPath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={hasSessionTrend ? undefined : '5 5'}
              />
              {attemptPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="3.4"
                  fill="#ffffff"
                  stroke={point.isCorrect ? '#16a34a' : '#dc2626'}
                  strokeWidth="2.4"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Session Timer */}
        <div className={styles.panel} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={timerActive ? styles.timerActiveIcon : ''} style={{ fontSize: '18px' }}>⏱️</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>Session Timer</span>
            </div>
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className={`${styles.timerIndicator} ${timerActive ? styles.timerIndicatorRunning : styles.timerIndicatorPaused}`} />
              <span style={{ 
                fontSize: '9px', 
                fontWeight: '900', 
                color: timerActive ? '#16a34a' : '#94a3b8', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
              }}>
                {timerActive ? 'Running' : 'Paused'}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0' }}>
            <span style={{ 
              fontSize: '34px', 
              fontWeight: '950', 
              color: '#0f172a', 
              fontFamily: 'Outfit, sans-serif',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.5px' 
            }}>
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTimerActive(!timerActive)}
              className={`${styles.timerButton} ${timerActive ? styles.timerButtonSecondary : styles.timerButtonPrimary}`}
            >
              {timerActive ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            <button
              type="button"
              onClick={() => setTimerSeconds(0)}
              className={`${styles.timerButton} ${styles.timerButtonReset}`}
            >
              ↻ Reset
            </button>
          </div>
        </div>

        {/* SmartScore Milestone (Scaled 10x) */}
        <div className={styles.panel} style={{ padding: '20px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>✨</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>SmartScore</span>
            </div>
            <span style={{ fontSize: '24px', fontWeight: '950', color: '#6366f1', fontFamily: 'Outfit, sans-serif' }}>{scaledScore}</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>
            Next milestone: {nextMilestone}
          </div>
          <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${(scaledScore % 100)}%`, 
                height: '100%', 
                borderRadius: '999px', 
                background: '#6366f1' 
              }} 
            />
          </div>
        </div>

        {/* Recent Performance Cards */}
        <div className={styles.panel} style={{ padding: '20px', borderRadius: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>
            Recent Performance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '10px 14px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: '800' }}>Correct</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#16a34a' }}>{correct} ✔</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', padding: '10px 14px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
              <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: '800' }}>Incorrect</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#dc2626' }}>{incorrect} ✘</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
              <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '800' }}>Accuracy</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#2563eb' }}>{accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        {prerequisiteLinks.length ? (
          <div className={styles.panel} style={{ padding: '20px', borderRadius: '24px' }}>
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
                      border: '1px solid #cbd5e1',
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
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 20, border: '1px solid #dbeafe', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)' }}>
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

        <div style={{ background: '#ecfeff', padding: 20, borderRadius: 20, border: '1px solid #cffafe' }}>
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
      </div>
    );
  })();

  // ── Mastered Overlay Component ────────────────────────────────────────────
  const isUkgOrLkg = (logicType && (logicType.startsWith('ukg-') || logicType.startsWith('lkg-'))) || (urlTopic && (urlTopic.startsWith('ukg-') || urlTopic.startsWith('lkg-')));

  const masteredOverlayEl = masteredOverlay ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Skill mastered"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: isMontessoriMode ? 'rgba(92, 64, 51, 0.4)' : 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={isMontessoriMode ? {
          width: 'min(400px, 100%)',
          borderRadius: 28,
          background: '#fffdf9',
          border: '5.5px solid #8d6e63',
          boxShadow: '0 24px 60px rgba(92, 64, 51, 0.25)',
          padding: 32,
          textAlign: 'center',
          fontFamily: 'var(--font-outfit, sans-serif)',
          color: '#4e3629',
        } : {
          width: 'min(400px, 100%)',
          borderRadius: 28,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          border: '1px solid #38bdf8',
          boxShadow: '0 32px 80px rgba(56, 189, 248, 0.25)',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
        <h2 style={{ 
          margin: '0 0 8px', 
          color: isMontessoriMode ? '#7c2d12' : '#f8fafc', 
          fontSize: 24, 
          fontWeight: 950 
        }}>Skill Mastered!</h2>
        <p style={{ 
          margin: '0 0 6px', 
          color: isMontessoriMode ? '#8d6e63' : '#94a3b8', 
          fontSize: 13, 
          fontWeight: 700 
        }}>
          {masteredOverlay.skillLabel}
        </p>
        <p style={{ 
          margin: '0 0 24px', 
          color: isMontessoriMode ? '#d97706' : '#38bdf8', 
          fontSize: 13, 
          fontWeight: 750 
        }}>
          You have achieved a perfect SmartScore of 100. Outstanding work!
        </p>
        {masteredOverlay.nextSkills?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ 
              margin: '0 0 10px', 
              fontSize: 11, 
              fontWeight: 900, 
              color: isMontessoriMode ? '#a1887f' : '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>Unlock Next Skills</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {masteredOverlay.nextSkills.map((skillId) => {
                const label = sourceConfig.options.find((o) => o.value === skillId)?.label 
                  || skillId.replace('template-', '').replaceAll('-', ' ');
                return (
                  <button
                    key={skillId}
                    type="button"
                    onClick={() => {
                      setMasteredOverlay(null);
                      setLogicType(skillId);
                      syncRoute(sourceKey, skillId);
                    }}
                    style={isMontessoriMode ? {
                      background: '#e8f5e9',
                      border: '2.5px solid #c8e6c9',
                      color: '#2e7d32',
                      borderRadius: 16,
                      padding: '12px 16px',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: '0 4px 0 #a5d6a7',
                      transition: 'all 0.15s ease',
                      fontFamily: 'var(--font-outfit, sans-serif)',
                    } : {
                      background: '#1e3a5f',
                      border: '1px solid #38bdf8',
                      color: '#bae6fd',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 850,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    → {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {isUkgOrLkg ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMasteredOverlay(null);
                  fetchQuestion(true);
                }}
                style={isMontessoriMode ? {
                  flex: 1,
                  border: '2.5px solid #dcd1c4',
                  background: '#ffffff',
                  color: '#6d4c41',
                  borderRadius: 16,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #dcd1c4',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-outfit, sans-serif)',
                } : {
                  flex: 1,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Practice More
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/student/dashboard';
                }}
                style={isMontessoriMode ? {
                  flex: 1,
                  border: 0,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: '#ffffff',
                  borderRadius: 16,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #b45309',
                  fontFamily: 'var(--font-outfit, sans-serif)',
                } : {
                  flex: 1,
                  border: 0,
                  background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                  color: '#ffffff',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Move to Next Lesson
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMasteredOverlay(null);
                  fetchQuestion(true);
                }}
                style={isMontessoriMode ? {
                  flex: 1,
                  border: '2.5px solid #dcd1c4',
                  background: '#ffffff',
                  color: '#6d4c41',
                  borderRadius: 16,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #dcd1c4',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-outfit, sans-serif)',
                } : {
                  flex: 1,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Practice Again
              </button>
              {masteredOverlay.nextSkills?.length === 0 && (
                <button
                  type="button"
                  onClick={() => setMasteredOverlay(null)}
                  style={isMontessoriMode ? {
                    flex: 1,
                    border: 0,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    color: '#ffffff',
                    borderRadius: 16,
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #b45309',
                    fontFamily: 'var(--font-outfit, sans-serif)',
                  } : {
                    flex: 1,
                    border: 0,
                    background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                    color: '#ffffff',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  // ── Adaptive Banner Component ─────────────────────────────────────────────
  const adaptiveBannerEl = adaptiveBanner ? (() => {
    const bannerStyles = {
      fallback: { bg: '#fef9c3', border: '#fde047', color: '#854d0e', icon: '⬇️', label: 'Prerequisite Review' },
      bridge_back: { bg: '#dcfce7', border: '#4ade80', color: '#166534', icon: '🔙', label: 'Returning to Skill' },
      remediating: { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', icon: '🧩', label: 'Guided Practice' },
    };
    const style = bannerStyles[adaptiveBanner.type] || bannerStyles.remediating;
    return (
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          background: style.bg,
          border: `1.5px solid ${style.border}`,
          color: style.color,
          borderRadius: 16,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxWidth: 'min(480px, 90vw)',
          animation: 'slideDown 0.3s ease',
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: '@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }' }} />
        <span style={{ fontSize: 20 }}>{style.icon}</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>{style.label}</div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{adaptiveBanner.message}</div>
          {adaptiveBanner.targetLabel && (
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, opacity: 0.8 }}>→ {adaptiveBanner.targetLabel}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAdaptiveBanner(null)}
          style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: style.color, fontSize: 18, cursor: 'pointer', opacity: 0.6, lineHeight: 1 }}
          aria-label="Dismiss"
        >×</button>
      </div>
    );
  })() : null;

  const layoutChildren = question ? (
    <div className={transitionState === 'slideIn' ? styles.questionSlideIn : undefined} style={{ width: '100%' }}>
      {transitionState === 'praise' ? (
        <CorrectPraiseCard praiseMessage={praiseMessage} isPreK={isPreK} />
      ) : question?.type === 'interactive_sticks_builder' ? (
        <SticksBuilderWorkspace
          smartScore={smartScore}
          setSmartScore={setSmartScore}
          questionsAnswered={0}
          setQuestionsAnswered={() => {}}
          levelStreak={levelStreak}
          setLevelStreak={setLevelStreak}
          setTransitionState={setTransitionState}
          setPraiseMessage={setPraiseMessage}
          fetchQuestion={fetchQuestion}
        />
      ) : (
        <>
          {progressionConfig?.enabled && (
            <ProgressionHeader
              easyCount={progressionConfig.easyCount || 0}
              mediumCount={progressionConfig.mediumCount || 0}
              hardCount={progressionConfig.hardCount || 0}
              easyCurrent={progressionEasyCount}
              mediumCurrent={progressionMediumCount}
              hardCurrent={progressionHardCount}
            />
          )}
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
        </>
      )}
    </div>
  ) : (
    <div style={{ color: '#991b1b', fontWeight: 800 }}>
      No question could be loaded.
    </div>
  );

  const progressionStageModalEl = progressionStageModal ? (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        animation: 'zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }' }} />
        <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>{progressionStageModal.icon || '🎉'}</span>
        <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
          {progressionStageModal.title}
        </h3>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0', fontWeight: 500 }}>
          {progressionStageModal.subtitle}
        </p>
        <button
          type="button"
          onClick={() => setProgressionStageModal(null)}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 24px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            transition: 'all 0.2s ease',
            width: '100%'
          }}
        >
          Keep Going!
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {isMontessoriMode ? (
        <MontessoriLayout
          title={sourceConfig.label}
          subject={urlSubject || question?.metadata?.subject || question?.subject || ''}
          smartScore={smartScore}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          onReset={() => fetchQuestion(true)}
          loading={loading}
          question={question}
          feedback={inlineFeedback}
          isAnswered={isAnswered}
          handleSubmit={handleSubmit}
          userAnswer={userAnswer}
          practiceLevel={practiceLevel}
          levelStreak={levelStreak}
          isSubmitting={isSubmitting}
          isCorrect={isCorrect}
          onNext={handleNextQuestion}
          activeStudent={activeStudent}
          isSecondTry={isSecondTry}
          lastResult={lastResult}
        >
          {layoutChildren}
        </MontessoriLayout>
      ) : (
        <LabLayout
          title={sourceConfig.label}
          grade={isPreK ? "Pre-K Learning 🌟" : "Shared Practice Shell"}
          isPreK={isPreK}
          subject={urlSubject || question?.metadata?.subject || question?.subject || ''}
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
          onClear={() => setUserAnswer(null)}
          practiceLevel={practiceLevel}
          levelStreak={levelStreak}
          isSubmitting={isSubmitting}
          isCorrect={isCorrect}
          onNext={handleNextQuestion}
          activeStudent={activeStudent}
          timerSeconds={timerSeconds}
          timerActive={timerActive}
        >
          {layoutChildren}
        </LabLayout>
      )}


      {masteredOverlayEl}
      {adaptiveBannerEl}

      {/* ── Practice Mode Indicator Badge ── */}
      {!isMontessoriMode && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            right: 18,
            zIndex: 60,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: practiceMode === 'adaptive'
                ? 'rgba(56,189,248,0.12)'
                : 'rgba(251,146,60,0.12)',
              border: practiceMode === 'adaptive'
                ? '1px solid rgba(56,189,248,0.3)'
                : '1px solid rgba(251,146,60,0.4)',
              color: practiceMode === 'adaptive' ? '#38bdf8' : '#fb923c',
              boxShadow: practiceMode === 'adaptive'
                ? '0 2px 12px rgba(56,189,248,0.15)'
                : '0 2px 12px rgba(251,146,60,0.15)',
            }}
          >
            {question?.metadata?.isStatic ? (
              <>
                <span style={{ fontSize: 11 }}>📋</span>
                {(() => {
                  const qnVal = searchParams.get('qn') || '0';
                  const parsed = parseInt(qnVal, 10);
                  if (!isNaN(parsed) && parsed < 100) return `Static Qn ${parsed + 1}`;
                  const match = qnVal.match(/-q(\d+)/i);
                  if (match) return `Static Qn ${match[1]}`;
                  return `Static Qn ${qnVal.split('-').pop() || '1'}`;
                })()}
              </>
            ) : (
              <>
                <span style={{ fontSize: 11 }}>{practiceMode === 'adaptive' ? '⚡' : '📋'}</span>
                {practiceMode === 'adaptive' ? 'Adaptive' : 'Sequential'}
                {practiceMode === 'static' && (() => {
                  const opts = sourceConfig.options || [];
                  const idx = opts.findIndex(o => o.value === logicType);
                  return opts.length > 0 ? (
                    <span style={{ opacity: 0.7, fontWeight: 700 }}>
                      &nbsp;{(idx >= 0 ? idx : 0) + 1}/{opts.length}
                    </span>
                  ) : null;
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Teacher / Admin Override Panel ── */}
      {!isMontessoriMode && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 70,
          }}
        >
          {teacherOverrideOpen ? (
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 20,
                padding: 20,
                width: 260,
                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teacher Override</span>
                <button
                  type="button"
                  onClick={() => setTeacherOverrideOpen(false)}
                  style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                >×</button>
              </div>

              {/* ── Practice Mode Toggle ── */}
              {question?.metadata?.isStatic ? (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: '#1e293b', borderRadius: 12, border: '1px solid #854d0e' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Static Skill Practice</div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>
                    This skill uses a fixed set of static questions played sequentially.
                  </div>
                  {(() => {
                    const currentQn = parseInt(searchParams.get('qn') || '0', 10);
                    return (
                      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const prevQn = Math.max(0, currentQn - 1);
                            const params = new URLSearchParams(window.location.search);
                            params.set('qn', String(prevQn));
                            router.replace(`/practice?${params.toString()}`, { scroll: false });
                            window.setTimeout(() => fetchQuestion(false), 50);
                          }}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          ← Prev Question
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextQn = currentQn + 1;
                            const params = new URLSearchParams(window.location.search);
                            params.set('qn', String(nextQn));
                            router.replace(`/practice?${params.toString()}`, { scroll: false });
                            window.setTimeout(() => fetchQuestion(false), 50);
                          }}
                          style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Next Question →
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: '#1e293b', borderRadius: 12, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Practice Mode</div>
                  <div style={{ display: 'flex', background: '#0f172a', borderRadius: 10, padding: 3, gap: 3 }}>
                    <button
                      type="button"
                      id="mode-adaptive-btn"
                      onClick={() => {
                        setMode('adaptive');
                        setAdaptiveBanner(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        borderRadius: 8,
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 800,
                        transition: 'all 0.18s',
                        background: practiceMode === 'adaptive' ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)' : 'transparent',
                        color: practiceMode === 'adaptive' ? '#ffffff' : '#64748b',
                        boxShadow: practiceMode === 'adaptive' ? '0 2px 8px rgba(56,189,248,0.35)' : 'none',
                      }}
                    >
                      ⚡ Adaptive
                    </button>
                    <button
                      type="button"
                      id="mode-static-btn"
                      onClick={() => {
                        setMode('static');
                        setAdaptiveBanner(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        borderRadius: 8,
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 800,
                        transition: 'all 0.18s',
                        background: practiceMode === 'static' ? 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)' : 'transparent',
                        color: practiceMode === 'static' ? '#ffffff' : '#64748b',
                        boxShadow: practiceMode === 'static' ? '0 2px 8px rgba(251,146,60,0.35)' : 'none',
                      }}
                    >
                      📋 Sequential
                    </button>
                  </div>
                  {practiceMode === 'static' && (() => {
                    const opts = sourceConfig.options || [];
                    const idx = opts.findIndex(o => o.value === logicType);
                    const currentIdx = idx >= 0 ? idx : 0;
                    return (
                      <>
                        <div style={{ marginTop: 8, fontSize: 10, color: '#fb923c', fontWeight: 700 }}>
                          Skill {currentIdx + 1}/{opts.length} — following order, no adaptive routing
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => { advanceStaticSkill('prev'); fetchQuestion(false); }}
                            style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            ← Prev Skill
                          </button>
                          <button
                            type="button"
                            onClick={() => { advanceStaticSkill('next'); fetchQuestion(false); }}
                            style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            Next Skill →
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}


              {/* ── Override Level ── */}
              <div style={{ marginBottom: 14, padding: '10px 12px', background: '#1e293b', borderRadius: 12, border: '1px solid #334155' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Override Level</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {[1, 2, 3, 4].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setPracticeLevel(lvl);
                        setLevelStreak(0);
                        if (typeof window !== 'undefined') {
                          const competency = resolveCompetency({
                            subject: urlSubject || sourceConfig.subject,
                            topic: urlTopic || sourceConfig.topic,
                            skillId: logicType,
                          });
                          const key = getMasteryKey({
                            subject: urlSubject || sourceConfig.subject,
                            topic: urlTopic || sourceConfig.topic,
                            skillId: logicType,
                            competencyId: competency?.id,
                            userId: activeStudent,
                          });
                          const all = loadAllMastery();
                          const current = all[key] || {};
                          all[key] = { ...current, practiceLevel: lvl, levelStreak: 0 };
                          saveAllMastery(all);
                        }
                        window.setTimeout(() => fetchQuestion(false), 50);
                      }}
                      style={{
                        flex: '1 0 21%',
                        padding: '6px 0',
                        borderRadius: 6,
                        border: '1px solid #334155',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 900,
                        background: practiceLevel === lvl ? '#38bdf8' : '#0f172a',
                        color: practiceLevel === lvl ? '#0f172a' : '#94a3b8',
                      }}
                    >
                      L{lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSkillState('practicing');
                    setMasteredOverlay(null);
                    setAdaptiveBanner(null);
                    fetchQuestion(true);
                    setTeacherOverrideOpen(false);
                  }}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                >
                  🔄 Reset Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const competency = resolveCompetency({ subject: urlSubject || sourceConfig.subject, topic: urlTopic || sourceConfig.topic, skillId: logicType });
                      const key = getMasteryKey({ subject: urlSubject || sourceConfig.subject, topic: urlTopic || sourceConfig.topic, skillId: logicType, competencyId: competency?.id, userId: activeStudent });
                      const all = loadAllMastery();
                      delete all[key];
                      saveAllMastery(all);
                    }
                    setSmartScore(0);
                    setCorrectStreak(0);
                    setPracticeLevel(1);
                    setLevelStreak(0);
                    setSkillState('practicing');
                    setMasteredOverlay(null);
                    setAdaptiveBanner(null);
                    fetchQuestion(true);
                    setTeacherOverrideOpen(false);
                  }}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#fca5a5', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                >
                  🗑️ Clear Mastery Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMasteredOverlay({
                      skillLabel: sourceConfig.options.find((o) => o.value === logicType)?.label || logicType,
                      nextSkills: [],
                    });
                    setTeacherOverrideOpen(false);
                  }}
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#86efac', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}
                >
                  🏆 Simulate Mastered
                </button>
                {/* Debug Report button */}
                <button
                  type="button"
                  id="debug-report-btn"
                  onClick={() => {
                    try {
                      const competency = resolveCompetency({
                        subject: urlSubject || sourceConfig.subject,
                        topic: urlTopic || sourceConfig.topic,
                        skillId: logicType,
                      });
                      const masteryKey = getMasteryKey({
                        subject: urlSubject || sourceConfig.subject,
                        topic: urlTopic || sourceConfig.topic,
                        skillId: logicType,
                        competencyId: competency?.id,
                        userId: activeStudent,
                      });
                      const storedMastery = loadAllMastery()[masteryKey] || {};

                      const report = {
                        _generated: new Date().toISOString(),
                        url: typeof window !== 'undefined' ? window.location.href : '',
                        skill: {
                          id: logicType,
                          label: sourceConfig.options.find((o) => o.value === logicType)?.label || logicType,
                          subject: urlSubject || sourceConfig.subject,
                          topic: urlTopic || sourceConfig.topic,
                          competencyId: competency?.id || null,
                          competencyTitle: competency?.title || null,
                        },
                        adaptiveState: {
                          skillState,
                          smartScore,
                          correctStreak,
                          practiceLevel,
                          levelStreak,
                          streakThreshold,
                          lastResult,
                          difficulty,
                          adaptiveBanner: adaptiveBanner || null,
                          masteredOverlay: masteredOverlay ? { skillLabel: masteredOverlay.skillLabel } : null,
                        },
                        masteryEngine: {
                          masteryKey,
                          storedState: storedMastery.state || 'not_set',
                          storedSmartScore: storedMastery.smartScore || 0,
                          storedCorrectStreak: storedMastery.correctStreak || 0,
                          storedCorrectCount: storedMastery.correctCount || 0,
                          storedIncorrectCount: storedMastery.incorrectCount || 0,
                          storedAttempts: storedMastery.attempts || 0,
                          storedFallbackDepth: storedMastery.fallbackDepth || 0,
                          storedSourceSkillId: storedMastery.sourceSkillId || null,
                          storedFallbackSkillId: storedMastery.fallbackSkillId || null,
                          storedSameSkillAttempts: storedMastery.sameSkillAttempts || 0,
                        },
                        fallbackChain: {
                          currentSkill: logicType,
                          sourceSkill: storedMastery.sourceSkillId || null,
                          fallbackSkill: storedMastery.fallbackSkillId || null,
                          fallbackDepth: storedMastery.fallbackDepth || 0,
                          maxFallbackDepth: 2,
                          bridgeBackThreshold: { correctStreak: 3, smartScore: 80 },
                          fallbackThreshold: { wrongStreak: 2, fromState: 'remediation' },
                          remediationThreshold: { wrongStreak: 2, fromState: 'practicing' },
                        },
                        recentAttempts: history.slice(0, 10).map((h, i) => ({
                          index: i + 1,
                          skill: h.type,
                          isCorrect: h.isCorrect,
                          scoreChange: h.scoreChange,
                          time: h.timestamp,
                        })),
                        currentQuestion: question ? {
                          id: question.id,
                          type: question.type,
                          skillId: question.metadata?.skillId,
                          templateId: question.metadata?.templateId,
                          engine: question.metadata?.engine,
                          practiceLevel: question.metadata?.practiceLevel,
                          difficultyStage: question.metadata?.difficultyStage,
                          range: question.metadata?.range,
                          regrouping: question.metadata?.regrouping,
                          addends: question.metadata?.addends,
                          total: question.metadata?.total,
                        } : null,
                      };

                      const text = JSON.stringify(report, null, 2);
                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(text).catch(() => {});
                      } else {
                        const ta = document.createElement('textarea');
                        ta.value = text;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                      }
                      // Flash button
                      const btn = document.getElementById('debug-report-btn');
                      if (btn) {
                        const orig = btn.textContent;
                        btn.textContent = '✅ Copied!';
                        btn.style.color = '#4ade80';
                        setTimeout(() => { btn.textContent = orig; btn.style.color = '#fde68a'; }, 1600);
                      }
                    } catch (err) {
                      console.error('Debug report error:', err);
                    }
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #854d0e',
                    color: '#fde68a',
                    borderRadius: 10,
                    padding: '9px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  📋 Copy Debug Report
                </button>

                {/* Live debug snapshot */}
                <div style={{ marginTop: 2, padding: '8px 10px', background: '#020617', borderRadius: 10, border: '1px solid #1e293b', fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', lineHeight: 1.7 }}>
                  <div><span style={{ color: '#38bdf8' }}>state</span>: <span style={{ color: skillState === 'mastered' ? '#4ade80' : skillState === 'remediation' ? '#f87171' : skillState === 'prerequisite_review' ? '#fbbf24' : '#e2e8f0' }}>{skillState}</span></div>
                  <div><span style={{ color: '#38bdf8' }}>smartScore</span>: <span style={{ color: '#e2e8f0' }}>{smartScore}</span></div>
                  <div><span style={{ color: '#38bdf8' }}>correctStreak</span>: <span style={{ color: '#e2e8f0' }}>{correctStreak}</span></div>
                  <div><span style={{ color: '#38bdf8' }}>level</span>: <span style={{ color: '#e2e8f0' }}>{practiceLevel}/4</span></div>
                  <div><span style={{ color: '#38bdf8' }}>skill</span>: <span style={{ color: '#a5b4fc', wordBreak: 'break-all' }}>{logicType}</span></div>
                  <div><span style={{ color: '#38bdf8' }}>template</span>: <span style={{ color: '#f43f5e', wordBreak: 'break-all' }}>{question?.metadata?.templateId || 'default'}</span></div>
                  <div><span style={{ color: '#38bdf8' }}>banner</span>: <span style={{ color: adaptiveBanner ? '#fbbf24' : '#475569' }}>{adaptiveBanner?.type || 'none'}</span></div>
                </div>

                <div style={{ marginTop: 4, padding: '8px 10px', background: '#1e293b', borderRadius: 10, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Skill State</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: skillState === 'mastered' ? '#4ade80' : skillState === 'remediation' ? '#f87171' : skillState === 'prerequisite_review' ? '#fbbf24' : '#94a3b8' }}>
                    {skillState}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              id="teacher-override-btn"
              onClick={() => setTeacherOverrideOpen(true)}
              title="Teacher / Admin Override"
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#94a3b8',
                fontSize: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              }}
            >
              ⚙️
            </button>
          )}
        </div>
      )}

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
            background: isMontessoriMode ? 'rgba(92, 64, 51, 0.4)' : 'rgba(15, 23, 42, 0.22)',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={isMontessoriMode ? {
              width: 'min(340px, 100%)',
              borderRadius: 28,
              background: '#fffdf9',
              border: '5.5px solid #8d6e63',
              boxShadow: '0 24px 60px rgba(92, 64, 51, 0.22)',
              padding: 22,
              textAlign: 'center',
              fontFamily: 'var(--font-outfit, sans-serif)',
              color: '#4e3629',
            } : {
              width: 'min(340px, 100%)',
              borderRadius: 22,
              background: '#ffffff',
              border: isPreK ? '1px solid #fde047' : '1px solid #dcfce7',
              boxShadow: '0 26px 70px rgba(15, 23, 42, 0.22)',
              padding: 22,
              textAlign: 'center',
            }}
          >
            <div style={isMontessoriMode ? {
              width: 64, 
              height: 64, 
              margin: '0 auto 12px', 
              borderRadius: '50%', 
              background: '#fffbeb', 
              color: '#d97706', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 32, 
              fontWeight: 950,
              boxShadow: 'none'
            } : { 
              width: 64, 
              height: 64, 
              margin: '0 auto 12px', 
              borderRadius: '50%', 
              background: isPreK ? '#fef9c3' : '#dcfce7', 
              color: isPreK ? '#ca8a04' : '#166534', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: isPreK ? 32 : 26, 
              fontWeight: 950,
              boxShadow: isPreK ? '0 4px 14px rgba(234, 179, 8, 0.25)' : 'none'
            }}>
              {isPreK || isMontessoriMode ? '🌟' : levelModal.level}
            </div>
            <h3 style={{ 
              margin: '0 0 8px', 
              color: isMontessoriMode ? '#7c2d12' : '#0f172a', 
              fontSize: 22, 
              lineHeight: 1.15 
            }}>
              {isMontessoriMode
                ? (levelModal.isMaxLevel ? 'Level 5! 🎉' : `Level ${levelModal.level}! 🚀`)
                : (isPreK 
                  ? (levelModal.isMaxLevel ? 'Level 5! 🎉' : `Level ${levelModal.level}! 🚀`)
                  : (levelModal.isMaxLevel ? 'Level 5 reached' : `Level ${levelModal.level} unlocked`))}
            </h3>
            <p style={{ 
              margin: '0 0 18px', 
              color: isMontessoriMode ? '#5c4033' : '#64748b', 
              fontSize: 13, 
              fontWeight: 750, 
              lineHeight: 1.45 
            }}>
              {isMontessoriMode
                ? 'You got 5 correct answers! Keep going!'
                : (isPreK
                  ? 'You got 5 correct answers! Keep going!'
                  : 'Five correct answers in a row. The next set can step up in challenge.')}
            </p>
            <button
              type="button"
              onClick={() => setLevelModal(null)}
              style={{
                border: 0,
                borderRadius: 999,
                background: isPreK ? '#3b82f6' : '#4fb77a',
                color: '#ffffff',
                padding: isPreK ? '10px 24px' : '10px 18px',
                fontSize: isPreK ? 14 : 13,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: isPreK 
                  ? '0 12px 24px rgba(59, 130, 246, 0.35)' 
                  : '0 12px 24px rgba(34, 197, 94, 0.22)',
              }}
            >
              {isPreK ? 'Go! ▶️' : 'Keep practicing'}
            </button>
          </div>
        </div>
      ) : null}
      {activeOverlays.map((toolId) => (
        <DraggableToolOverlay
          key={toolId}
          toolId={toolId}
          onClose={() => handleToggleOverlay(toolId)}
        />
      ))}
      {progressionStageModalEl}
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
