import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { additionHomeGroups } from '../lib/practice/clientCatalogs/additionCatalog.js';
import { subtractionSkillsByGrade } from '../lib/practice/generators/math/topics/subtraction/skills/index.js';
import { multiplicationHomeGroups } from '../lib/practice/clientCatalogs/multiplicationCatalog.js';
import { divisionSkillsByGrade } from '../lib/practice/generators/math/topics/division/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../lib/practice/generators/science/topics/units-measurement/skills/index.js';
import { grammarSkillsByGrade } from '../lib/practice/generators/english/topics/grammar/skills/index.js';
import { shapesSkillsByGrade } from '../lib/practice/generators/math/topics/shapes/skills/index.js';
import { measurementHomeGroups } from '../lib/practice/clientCatalogs/measurementCatalog.js';
import { getCurriculumTree } from '../lib/curriculum/index.js';
import { dataGraphsHomeGroups } from '../lib/practice/clientCatalogs/dataGraphsCatalog.js';
import { storyMathHomeGroups } from '../lib/practice/clientCatalogs/storyMathCatalog.js';
import { interactiveToolsHomeGroups } from '../lib/practice/clientCatalogs/interactiveToolsCatalog.js';
import { cubeToolsHomeGroups } from '../lib/practice/clientCatalogs/cubeToolsCatalog.js';

export const dynamic = 'force-dynamic';

const gradeOrdinal = (grade) => {
  if (grade === 'remediation') return 'Remediation skills';
  if (grade === 'prek') return 'Pre-K skills';
  return `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`;
};

const subtractionHomeGroups = Object.entries(subtractionSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const divisionHomeGroups = Object.entries(divisionSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const unitsMeasurementHomeGroups = Object.entries(unitsMeasurementSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const solarSystemHomeGroups = [
  {
    title: 'Solar system skills',
    skills: [
      ['SS.1', 'Identify planets in the solar system', 'science-g3-solar-system-planets-hotspot'],
      ['SS.2', 'Measure and compare heights', 'science-g3-solar-system-height-measure']
    ]
  }
];

const grammarHomeGroups = Object.entries(grammarSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const shapesHomeGroups = Object.entries(shapesSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const TOPICS = [
  {
    id: 'addition',
    title: 'Addition',
    color: '#ff951f',
    subject: 'math',
    topic: 'addition',
    includes: ['Counting on', 'Make ten', 'Doubles and near doubles', 'Word problem translation', 'Regrouping'],
    groups: additionHomeGroups,
  },
  {
  id: 'data-graphs',
  title: 'Data & Graphs',
  color: '#2563eb',
  subject: 'math',
  topic: 'data-graphs',
  includes: ['Picture graphs', 'Bar graphs', 'Counting data', 'Comparing data'],
  groups: dataGraphsHomeGroups,
},
  {
    id: 'subtraction',
    title: 'Subtraction',
    color: '#ef6c35',
    subject: 'math',
    topic: 'subtraction',
    includes: ['Remove cubes from a row', 'Subtraction facts', 'Mental subtraction', 'Word problems', 'Regrouping'],
    groups: subtractionHomeGroups,
  },

  {
    id: 'multiplication',
    title: 'Multiplication',
    color: '#ff951f',
    subject: 'math',
    topic: 'multiplication',
    includes: ['Facts to 10', 'Vertical multiplication', 'Regrouping', 'Indian number system'],
    groups: multiplicationHomeGroups,
  },

  {
    id: 'division',
    title: 'Division',
    color: '#7a56d6',
    subject: 'math',
    topic: 'division',
    includes: ['Equal sharing', 'Basic division facts', 'Long division', 'Division remainders', '2-digit divisors'],
    groups: divisionHomeGroups,
  },

  {
    id: 'time',
    title: 'Time',
    color: '#2fbfd0',
    subject: 'math',
    topic: 'time',
    includes: ['Days of the week', 'Seasons', 'Read clocks and write times', 'Elapsed time', 'Time patterns'],
    groups: [
      {
        title: 'Calendar skills',
        skills: [
          ['T.1', 'Days of the week', 'v1_days_of_week'],
          ['T.2', 'Order days of the week', 'order_days'],
          ['T.3', 'Seasons of the year', 'v2_seasons'],
          ['T.4', 'Read a calendar', 'v3_calendar'],
          ['T.5', 'Months of the year', 'v4_months'],
          ['T.6', 'Days in each month', 'm5_days_in_month'],
        ],
      },
      {
        title: 'Clock skills',
        skills: [
          ['C.1', 'A.M. or P.M.', 'v5_am_pm'],
          ['C.2', 'Match analogue clocks and times', 'match_analog_clock_words'],
          ['C.3', 'Match digital clocks and times', 'match_digital_clock'],
          ['C.4', 'Read clocks and write times', 'o3_read_clock'],
          ['C.5', 'Elapsed time', 'o5_elapsed_time'],
          ['C.6', 'Time patterns', 'o7_time_patterns'],
        ],
      },
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    color: '#7a56d6',
    subject: 'math',
    topic: 'fractions',
    includes: ['Identify fractions from shapes', 'Equal parts', 'Fraction of a set', 'Remove parts from models'],
    groups: [
      {
        title: 'Visual model skills',
        skills: [
          ['F.1', 'Identify fractions from models', 'fractions-g2-identify-visual'],
          ['F.2', 'Identify like and unlike fractions', 'fractions-g3-like-unlike'],
          ['F.3', 'Identify proper, improper, and mixed fractions', 'fractions-g3-types'],
          ['F.4', 'Identify fractions from shapes', 'visual_models_identify'],
          ['F.5', 'Write fractions from shapes', 'visual_models_write_fraction'],
          ['F.6', 'Equal parts', 'visual_models_equal_parts'],
          ['F.7', 'Fraction of a set', 'visual_models_fraction_of_set'],
          ['F.8', 'Mixed numbers from models', 'visual_models_mixed_numbers'],
          ['F.9', 'Remove parts from a circle', 'visual_models_remove_fraction_pie'],
          ['F.10', 'Remove parts from a square', 'visual_models_remove_fraction_square'],
          ['F.11', 'Remove parts from a rectangle', 'visual_models_remove_fraction_rectangle'],
          ['F.12', 'Remove parts from a fraction bar', 'visual_models_remove_fraction_bar'],
          ['F.13', 'Fill parts of a circle', 'visual_models_fill_fraction_pie'],
          ['F.14', 'Fill parts of a square', 'visual_models_fill_fraction_square'],
          ['F.15', 'Fill parts of a rectangle', 'visual_models_fill_fraction_rectangle'],
          ['F.16', 'Cut rectangle into fourths', 'visual_models_cut_rectangle_fourths'],
          ['F.17', 'Cut circle into fourths', 'visual_models_cut_circle_fourths'],
          ['F.18', 'Cut rectangle into halves in different ways', 'visual_models_cut_rectangle_halves_different'],
          ['F.19', 'Cut rectangle into thirds', 'visual_models_cut_rectangle_thirds'],
          ['F.20', 'Cut circle into thirds', 'visual_models_cut_circle_thirds'],
          ['F.21', 'Cut circle into sixths', 'visual_models_cut_circle_sixths'],
        ],
      },
      {
        title: 'Equivalence & Comparison skills',
        skills: [
          ['F.22', 'Equivalent fractions on number lines', 'equivalence_number_line'],
          ['F.33', 'Compare like fractions', 'fractions-g5-compare-like-fractions'],
          ['F.34', 'Compare unlike fractions', 'fractions-g5-compare-unlike-fractions'],
          ['F.35', 'Compare proper fractions', 'fractions-g5-compare-proper-fractions'],
        ],
      },
      {
        title: 'Conversion skills',
        skills: [
          ['F.31', 'Convert improper fractions to mixed numbers', 'fractions-g5-convert-improper-to-mixed'],
          ['F.32', 'Convert mixed numbers to improper fractions', 'fractions-g5-convert-mixed-to-improper'],
        ],
      },
      {
        title: 'Decomposing & Unit Fractions',
        skills: [
          ['F.23', 'Decompose fractions into unit fractions', 'fractions_decompose_into_unit_fractions'],
          ['F.24', 'Decompose fractions: missing unit fraction', 'fractions_decompose_missing_unit_fraction'],
          ['F.25', 'Decompose fractions: select all sums', 'fractions_decompose_select_all_sums'],
          ['F.26', 'Build fractions from unit fraction words', 'fractions_build_from_words'],
          ['F.27', 'Decompose fractions: error analysis', 'fractions_decompose_error_analysis'],
          ['F.28', 'Count the unit fraction pieces', 'fractions_count_unit_fraction_pieces'],
          ['F.29', 'Decompose fractions: puzzle style', 'fractions_decompose_puzzle_style'],
        ],
      },
      {
        title: 'Operations skills',
        skills: [
          ['F.36', 'Add like fractions', 'fractions-g5-add-like-fractions'],
          ['F.37', 'Add improper fractions', 'fractions-g5-add-improper-fractions'],
          ['F.38', 'Add a fraction and an integer', 'fractions-g5-add-fraction-and-integer'],
          ['F.39', 'Find the missing fraction addend', 'fractions-g5-missing-fraction-addend'],
          ['F.40', 'Find the missing integer addend', 'fractions-g5-missing-integer-addend'],
          ['F.41', 'Add three or more fractions', 'fractions-g5-add-multiple-fractions'],
          ['F.30', 'Add and subtract fractions with unlike denominators', 'fractions-g5-add-subtract-unlike-denominators'],
        ],
      },
    ],
  },
  {
    id: 'place-values',
    title: 'Place Values',
    color: '#4db46b',
    subject: 'math',
    topic: 'place-values',
    includes: ['Tens and ones blocks', 'Place value names', 'Expanded form', 'Word form', 'Place-value tables'],
    groups: [
      {
        title: 'First-grade skills',
        skills: [
          ['PV.1', 'Identify numbers from tens and ones blocks', 'pv-g1-blocks-units'],
          ['PV.2', 'Name the place value of a digit', 'pv-g1-place-name'],
          ['PV.3', 'Which model shows the number?', 'pv-g1-match-blocks-to-number'],
        ],
      },
      {
        title: 'Second-grade skills',
        skills: [
          ['PV.4', 'Identify hundreds, tens, and ones blocks', 'pv-g2-blocks-hundreds'],
          ['PV.5', 'Write numbers in expanded form', 'pv-g2-expanded-form'],
          ['PV.6', 'Break down numbers in a table', 'pv-g2-breakdown-table'],
        ],
      },
      {
        title: 'Third-grade skills',
        skills: [
          ['PV.7', 'Identify thousands blocks', 'pv-g3-blocks-thousands'],
          ['PV.8', 'Write word form as a number', 'pv-g3-word-to-number'],
        ],
      },
    ],
  },
  {
    id: 'social-gk',
    title: 'General Knowledge',
    color: '#3f8bd6',
    subject: 'social',
    topic: 'gk',
    includes: ['Identify famous persons', 'Personality trivia', 'Political vs sports sorting', 'True or false'],
    groups: [
      {
        title: 'People skills',
        skills: [
          ['GK.1', 'Identify famous persons', 'gk_identify_person_v1'],
          ['GK.2', 'Identify from images', 'gk_identify_image_v1'],
          ['GK.3', 'Political vs sports sorting', 'gk_sort_people_v1'],
        ],
      },
      {
        title: 'Reasoning skills',
        skills: [
          ['GK.4', 'Personality trivia', 'gk_trivia_v1'],
          ['GK.5', 'Fill in the blanks', 'gk_fill_blanks_v1'],
          ['GK.6', 'True or false', 'gk_true_false_v1'],
          ['GK.7', 'Spot the truth', 'gk_misconception_v1'],
          ['GK.8', 'Inference questions', 'gk_inference_v1'],
        ],
      },
    ],
  },
  {
    id: 'testing',
    title: 'Testing Tools',
    color: '#d64d3d',
    subject: 'math',
    topic: 'testing',
    includes: ['Interactive protractor', 'Copy drag/drop', 'Categorization', 'Number line', 'Inputs plus options'],
    groups: [
      {
        title: 'Interactive parts',
        skills: [
          ['TEST.1', 'Interactive protractor', 'testing-protractor'],
          ['TEST.2', 'Copy drag/drop', 'testing-copy-drag-drop'],
          ['TEST.3', 'Categorization', 'testing-categorization'],
        ],
      },
      {
        title: 'Visual parts',
        skills: [
          ['TEST.4', 'Number line', 'testing-number-line'],
          ['TEST.5', 'Base-ten blocks', 'testing-base-ten-blocks'],
          ['TEST.6', 'Clock', 'testing-clock'],
          ['TEST.7', 'Missing time pattern', 'testing-clock-pattern'],
          ['TEST.8', 'Fraction model', 'testing-fraction-model'],
          ['TEST.9', 'Mixed text/SVG/blank', 'testing-mixed-parts'],
        ],
      },
      {
        title: 'Composition',
        skills: [
          ['TEST.10', 'Inputs + options', 'testing-doubles-plus-one-mixed'],
        ],
      },
    ],
  },
  {
    id: 'english-grammar',
    title: 'English Grammar',
    color: '#a855f7',
    subject: 'english',
    topic: 'grammar',
    includes: ['Identify nouns', 'Pronouns & replacements', 'Action verbs & tenses', 'Articles a vs an', 'Capitalization & punctuation'],
    groups: grammarHomeGroups,
  },
  {
    id: 'units-measurement',
    title: 'Units and measurement',
    color: '#0ea5e9',
    subject: 'science',
    topic: 'units-measurement',
    includes: ['Units', 'temperature', 'measuring tools', 'metric/customary units', 'conversions'],
    groups: unitsMeasurementHomeGroups,
  },
  {
    id: 'solar-system',
    title: 'Solar system',
    color: '#06b6d4',
    subject: 'science',
    topic: 'solar-system',
    includes: ['Planets identification', 'Elliptical orbits', 'Sun & gas giants', 'Rings & orbital order'],
    groups: solarSystemHomeGroups,
  },
  {
    id: 'ratio',
    title: 'Ratios',
    color: '#ea580c',
    subject: 'math',
    topic: 'ratio',
    includes: ['Simplifying ratios', 'Same-kind check', 'Antecedent & consequent', 'Ratio tables', 'Equivalent ratios', 'Word problems'],
    groups: [
      {
        title: 'Ratio concepts',
        skills: [
          ['R.1', 'Compare quantities of same kind', 'ratio_identify_from_words'],
          ['R.2', 'Compare quantities by subtraction vs division', 'ratio_subtraction_vs_division'],
          ['R.3', 'Check if comparison is same kind', 'ratio_same_kind_check'],
          ['R.4', 'Understand antecedent and consequent', 'ratio_terms_antecedent_consequent'],
          ['R.5', 'Ratio has no units', 'ratio_units_concept'],
        ],
      },
      {
        title: 'Equivalence & simplification',
        skills: [
          ['R.6', 'Simplify ratios using HCF (two terms)', 'ratio_simplify_two_terms'],
          ['R.7', 'Simplify ratios using HCF (three terms)', 'ratio_simplify_three_terms'],
          ['R.8', 'Check equivalent ratios', 'ratio_equivalent_check'],
          ['R.9', 'Find equivalent ratios', 'ratio_equivalent_find'],
          ['R.10', 'Equivalent ratios with fractions', 'ratio_fraction_to_whole'],
        ],
      },
      {
        title: 'Missing values & tables',
        skills: [
          ['R.11', 'Solve missing values in ratios', 'ratio_missing_value'],
          ['R.12', 'Complete ratio tables', 'ratio_table_completion'],
          ['R.13', 'Pattern completion in ratios', 'ratio_pattern_completion'],
          ['R.14', 'Greater ratio comparison', 'ratio_greater_comparison'],
        ],
      },
      {
        title: 'Visuals & applications',
        skills: [
          ['R.15', 'Identify ratios from visual count', 'ratio_visual_count'],
          ['R.16', 'Word problems on ratios', 'ratio_word_problem_basic'],
          ['R.17', 'Error analysis of ratio mistakes', 'ratio_error_analysis'],
          ['R.18', 'Match ratios to descriptions', 'ratio_matching'],
          ['R.19', 'Sort ratios into categories', 'ratio_sorting'],
          ['R.20', 'Misconception remediation', 'ratio_remediation'],
          ['S.1', 'Write a part-to-part ratio', 'ratio_write_part_to_part_mcq'],
          ['S.2', 'Write a ratio using a colon', 'ratio_write_colon_single_blank'],
          ['S.3', 'Write a ratio using a fraction', 'ratio_write_fraction_single_blank'],
          ['S.6', 'Which model represents the ratio?', 'ratio_which_model_represents_mcq'],
        ],
      },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes',
    color: '#059669',
    subject: 'math',
    topic: 'shapes',
    includes: [
      'Identify shapes by visual',
      'Identify shapes by name',
      'Counting sides',
      'Counting corners'
    ],
    groups: shapesHomeGroups,
  },
  {
    id: 'measurement',
    title: 'Measurement',
    color: '#06b6d4',
    subject: 'math',
    topic: 'measurement',
    includes: [
      'Compare sizes',
      'Ruler measurements',
      'Unit conversions',
      'Thermometers & liquid volume',
      'Precision & GPE',
      'Density math'
    ],
    groups: measurementHomeGroups,
  },
  {
    id: 'story-math',
    title: 'Story Math Applets',
    color: '#8A9A5B',
    subject: 'math',
    topic: 'story-math',
    includes: [
      'Guided story lessons',
      'Sandbox manipulatives',
      'Quiz games',
      'Remediation flows',
      'Teacher demo boards'
    ],
    groups: storyMathHomeGroups,
  },
  {
    id: 'interactive-tools',
    title: 'Interactive Tools',
    color: '#16a34a',
    subject: 'math',
    topic: 'interactive-tools',
    includes: [
      'Fraction bar',
      'Number line',
      'Clock',
      'Base-ten blocks',
      'Measurement manipulatives'
    ],
    groups: interactiveToolsHomeGroups,
  },
  {
    id: 'cube-tools',
    title: 'Cube Tools',
    color: '#2563eb',
    subject: 'math',
    topic: 'cube-tools',
    includes: [
      'Build numbers',
      'Add cube groups',
      'Take away cubes',
      'Missing addends'
    ],
    groups: cubeToolsHomeGroups,
  },
  {
    id: 'lkg',
    title: 'Lower Kindergarten Math',
    color: '#0284c7',
    subject: 'math',
    topic: 'lkg',
    includes: [
      'Name the shape',
      'Count objects up to 10',
      'More and fewer',
      'Inside and outside',
      'Colour patterns',
      'Indian coins'
    ],
    groups: [
      {
        title: 'Shapes',
        skills: [
          ['A.1', 'Name the shape', 'lkg-shapes-name-shape'],
          ['A.2', 'Circles', 'lkg-shapes-circles'],
          ['A.3', 'Squares', 'lkg-shapes-squares'],
          ['A.4', 'Triangles', 'lkg-shapes-triangles'],
          ['A.5', 'Rectangles', 'lkg-shapes-rectangles'],
          ['A.6', 'Circles, squares and triangles', 'lkg-shapes-mixed'],
        ],
      },
      {
        title: 'Count to 3',
        skills: [
          ['B.1', 'Learn to count - up to 3', 'lkg-count3-learn'],
          ['B.2', 'Count objects - up to 3', 'lkg-count3-objects'],
          ['B.3', 'Count dots - up to 3', 'lkg-count3-dots'],
          ['B.4', 'Count shapes - up to 3', 'lkg-count3-shapes'],
          ['B.5', 'Count on ten frames - up to 3', 'lkg-count3-ten-frames'],
          ['B.6', 'Show numbers on ten frames - up to 3', 'lkg-count3-show-ten-frames'],
          ['B.7', 'Represent numbers - up to 3', 'lkg-count3-represent'],
        ],
      },
      {
        title: 'Count to 5',
        skills: [
          ['C.1', 'Learn to count - up to 5', 'lkg-count5-learn'],
          ['C.2', 'Count objects - up to 5', 'lkg-count5-objects'],
          ['C.3', 'Count dots - up to 5', 'lkg-count5-dots'],
          ['C.4', 'Count shapes - up to 5', 'lkg-count5-shapes'],
          ['C.5', 'Count on ten frames - up to 5', 'lkg-count5-ten-frames'],
          ['C.6', 'Show numbers on ten frames - up to 5', 'lkg-count5-show-ten-frames'],
          ['C.7', 'Represent numbers - up to 5', 'lkg-count5-represent'],
        ],
      },
      {
        title: 'Count to 10',
        skills: [
          ['D.1', 'Learn to count - up to 10', 'lkg-count10-learn'],
          ['D.2', 'Count objects - up to 10', 'lkg-count10-objects'],
          ['D.3', 'Count dots - up to 10', 'lkg-count10-dots'],
          ['D.4', 'Count shapes - up to 10', 'lkg-count10-shapes'],
          ['D.5', 'Count on ten frames - up to 10', 'lkg-count10-ten-frames'],
          ['D.6', 'Show numbers on ten frames - up to 10', 'lkg-count10-show-ten-frames'],
          ['D.7', 'Represent numbers - up to 10', 'lkg-count10-represent'],
        ],
      },
      {
        title: 'Comparing',
        skills: [
          ['E.1', 'Are there enough?', 'lkg-compare-enough'],
          ['E.2', 'More', 'lkg-compare-more'],
          ['E.3', 'Fewer', 'lkg-compare-fewer'],
          ['E.4', 'Fewer and more - compare by counting', 'lkg-compare-counting'],
          ['E.5', 'Compare in a mixed group', 'lkg-compare-mixed'],
        ],
      },
      {
        title: 'Positions',
        skills: [
          ['F.0', '⭐ Interactive SVG Demo', 'lkg-position-interactive-demo'],
          ['F.01', '🎯 Hotspot Canvas Demo', 'lkg-position-hotspot-demo'],
          ['F.1', 'Inside and outside', 'lkg-position-inside-outside'],
          ['F.2', 'Above and below', 'lkg-position-above-below'],
          ['F.3', 'Beside and next to', 'lkg-position-beside-next'],
          ['F.4', 'Left and right', 'lkg-position-left-right'],
          ['F.5', 'Left, middle and right', 'lkg-position-left-middle-right'],
          ['F.6', 'Top and bottom', 'lkg-position-top-bottom'],
          ['F.7', 'Top, middle and bottom', 'lkg-position-top-middle-bottom'],
        ],
      },
      {
        title: 'Classify',
        skills: [
          ['G.1', 'Same', 'lkg-classify-same'],
          ['G.2', 'Different', 'lkg-classify-different'],
          ['G.3', 'Same and different', 'lkg-classify-same-different'],
          ['G.4', 'Classify shapes by colour', 'lkg-classify-shapes-color'],
          ['G.5', 'Classify and sort by colour', 'lkg-classify-sort-color'],
          ['G.6', 'Classify and sort by shape', 'lkg-classify-sort-shape'],
        ],
      },
      {
        title: 'Patterns',
        skills: [
          ['H.1', 'Colour patterns', 'lkg-patterns-color'],
          ['H.2', 'Size patterns', 'lkg-patterns-size'],
          ['H.3', 'Shape patterns', 'lkg-patterns-shape'],
          ['H.4', 'What comes next?', 'lkg-patterns-next'],
        ],
      },
      {
        title: 'Size',
        skills: [
          ['I.1', 'Long and short', 'lkg-size-long-short'],
          ['I.2', 'Tall and short', 'lkg-size-tall-short'],
          ['I.3', 'Wide and narrow', 'lkg-size-wide-narrow'],
          ['I.4', 'Light and heavy', 'lkg-size-light-heavy'],
        ],
      },
      {
        title: 'Money',
        skills: [
          ['J.1', 'Coin values', 'lkg-money-coin-values'],
          ['J.2', 'Count 1-rupee coins', 'lkg-money-count-coins'],
        ],
      },
    ],
  },
  {
    id: 'standard-object-measurement',
    title: 'Standard Object Measurement',
    color: '#f59e0b',
    subject: 'math',
    topic: 'standard-object-measurement',
    includes: ['Cubes & Dice', 'Snapping & Stacking', 'Comparison side-by-side', 'Error diagnosing', 'Locked prefilled blocks'],
    groups: [
      {
        title: 'Measurement features',
        skills: [
          ['SOM.1', 'Measure length (Interactive Cubes)', 'som-g1-measure-length'],
          ['SOM.2', 'Measure height (Interactive Dice)', 'som-g1-measure-height'],
          ['SOM.3', 'Compare measured lengths (Paperclips)', 'som-g1-compare'],
          ['SOM.4', 'Identify measurement errors (Pennies)', 'som-g1-error-spotting'],
          ['SOM.7', 'Measure length (Static Paperclips)', 'som-g1-static-length'],
          ['SOM.8', 'Measure height (Static Pennies)', 'som-g1-static-height'],
        ],
      },
      {
        title: 'Addition & composition',
        skills: [
          ['SOM.5', 'Combine lengths (Cubes sum)', 'som-g1-add-lengths'],
          ['SOM.6', 'Combine heights (Dice towers sum)', 'som-g1-add-heights'],
          ['SOM.9', 'Copy cubes: sums up to 3', 'som-g1-copy-cubes-to-3'],
          ['SOM.10', 'Copy cubes: sums up to 5', 'som-g1-copy-cubes-to-5'],
          ['SOM.11', 'Copy cubes: sums up to 10', 'som-g1-copy-cubes-to-10'],
        ],
      },
      {
        title: 'Subtraction & patterns',
        skills: [
          ['SOM.12', 'Patterns: Complete ABAB sequence', 'som-g1-pattern-abab'],
          ['SOM.13', 'Patterns: Complete AABB sequence', 'som-g1-pattern-aabb'],
          ['SOM.14', 'Subtraction: Take away cubes', 'som-g1-sub-takeaway'],
          ['SOM.15', 'Subtraction: Compare block trains', 'som-g1-sub-compare'],
        ],
      },
      {
        title: 'Advanced block concepts',
        skills: [
          ['SOM.16', 'Place value: Tens and ones blocks', 'som-g1-place-value-blocks'],
          ['SOM.20', 'Place value: Numbers up to 50', 'som-g1-place-value-50'],
          ['SOM.21', 'Place value: Numbers up to 100', 'som-g2-place-value-100'],
          ['SOM.22', 'Place value: Hundreds, tens, and ones', 'som-g2-place-value-hundreds'],
          ['SOM.23', 'Place value: Thousands, hundreds, tens, and ones', 'som-g3-place-value-thousands'],
          ['SOM.17', 'Fractions: Equivalent strip parts', 'som-g1-fraction-strips'],
          ['SOM.18', 'Multiplication: Stacks array model', 'som-g1-multiplication-array'],
          ['SOM.19', 'Graphing: Built block charts', 'som-g1-graphing-bars'],
        ],
      },
      {
        title: 'New concepts',
        skills: [
          ['SOM.24', 'Ten frame: Numbers up to 5', 'som-g1-ten-frame-5'],
          ['SOM.25', 'Ten frame: Numbers up to 10', 'som-g1-ten-frame-10'],
          ['SOM.26', 'Ten frame: Double frame up to 20', 'som-g1-ten-frame-20'],
          ['SOM.27', 'Number bonds: Up to 5', 'som-g1-number-bonds-5'],
          ['SOM.28', 'Number bonds: Up to 10', 'som-g1-number-bonds-10'],
          ['SOM.29', 'Number line: 0 to 10', 'som-g1-number-line-10'],
          ['SOM.30', 'Number line: 0 to 20', 'som-g1-number-line-20'],
          ['SOM.31', 'Number line: 0 to 100', 'som-g2-number-line-100'],
          ['SOM.32', 'Area: Count squares (up to 4×4)', 'som-g2-area-grid-small'],
          ['SOM.33', 'Area: Count squares (up to 6×6)', 'som-g2-area-grid-medium'],
          ['SOM.37', 'Area: Click to fill the grid', 'som-g2-area-grid-click'],
          ['SOM.34', 'Division: Share equally into groups', 'som-g2-division-sharing'],
          ['SOM.35', 'Money: Count rupee coins', 'som-g1-money-coins'],
          ['SOM.36', 'Odd and even numbers', 'som-g1-odd-even'],
          // Inside TOPICS groups:
['SOM.38', 'Custom Skill Title', 'som-g2-custom-skill'],
        ],
      },
    ],
  },
];



const DB_TOPIC_COLORS = ['#ff951f', '#2fbfd0', '#7a56d6', '#4db46b', '#3f8bd6', '#d64d3d', '#9b4fe8', '#0ea5e9', '#ea580c', '#059669'];

function normalizeTopicId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flattenTree(nodes = []) {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);
}

function collectSkillNodes(node) {
  if (!node) return [];
  return [
    ...(node.type === 'skill' ? [node] : []),
    ...(node.children || []).flatMap((child) => collectSkillNodes(child)),
  ];
}

function dbSkillTuple(skill, index) {
  return [
    skill.code || skill.metadata?.code || `S.${index + 1}`,
    skill.title || skill.name || skill.skillId || skill.id,
    skill.skillId || skill.id,
  ];
}

function groupTitleForNode(node) {
  if (node.type === 'chapter') return node.title || 'Skills';

  const grade = node.grade ?? node.metadata?.grade;
  if (grade === 'remediation') return 'Remediation skills';
  if (grade) return gradeOrdinal(String(grade));

  return 'Skills';
}

function buildGroupsFromDbTopic(topicNode) {
  const children = topicNode.children || [];
  const chapterGroups = children
    .filter((child) => child.type === 'chapter')
    .map((chapter) => ({
      title: groupTitleForNode(chapter),
      skills: collectSkillNodes(chapter).map(dbSkillTuple),
    }))
    .filter((group) => group.skills.length);

  const directSkills = children.filter((child) => child.type === 'skill');
  if (directSkills.length) {
    chapterGroups.unshift({
      title: 'Skills',
      skills: directSkills.map(dbSkillTuple),
    });
  }

  if (chapterGroups.length) return chapterGroups;

  const allSkills = collectSkillNodes(topicNode);
  return allSkills.length ? [{ title: 'Skills', skills: allSkills.map(dbSkillTuple) }] : [];
}

function includesFromTopic(topicNode, groups) {
  const metadataIncludes = topicNode.metadata?.includes;
  if (Array.isArray(metadataIncludes) && metadataIncludes.length) return metadataIncludes;

  const tags = Array.isArray(topicNode.tags) ? topicNode.tags : [];
  if (tags.length) return tags.slice(0, 5);

  return groups.flatMap((group) => group.skills.map(([, name]) => name)).slice(0, 5);
}

function dbTopicFromNode(node, index) {
  const groups = buildGroupsFromDbTopic(node);
  const id = normalizeTopicId(node.id);

  return {
    id,
    title: node.title || node.name || id,
    color: node.metadata?.color || DB_TOPIC_COLORS[index % DB_TOPIC_COLORS.length],
    subject: node.subjectId || node.metadata?.subject || 'math',
    topic: node.topicId || id,
    includes: includesFromTopic(node, groups),
    groups,
    source: 'db',
  };
}

function topicsFromCurriculum(data) {
  return flattenTree(data?.tree || [])
    .filter((node) => node.type === 'topic')
    .map(dbTopicFromNode);
}

function mergeTopics(staticTopics, dbTopics) {
  if (!dbTopics.length) return staticTopics;

  const merged = new Map(staticTopics.map((topic) => [topic.id, topic]));
  dbTopics.forEach((dbTopic) => {
    const existing = merged.get(dbTopic.id);
    merged.set(dbTopic.id, {
      ...(existing || {}),
      ...dbTopic,
      color: dbTopic.color || existing?.color || '#ff951f',
      includes: dbTopic.includes?.length ? dbTopic.includes : existing?.includes || [],
      groups: dbTopic.groups?.length ? dbTopic.groups : existing?.groups || [],
    });
  });

  return Array.from(merged.values());
}

async function loadDbTopics() {
  try {
    const curriculum = await getCurriculumTree({ status: 'active', limit: 1000 });
    return topicsFromCurriculum(curriculum);
  } catch (error) {
    console.warn('Home curriculum fallback:', error?.message || error);
    return [];
  }
}

function countSkills(topic) {
  return (topic.groups || []).reduce((total, group) => total + (group.skills?.length || 0), 0);
}

function practiceHref(topic, skill) {
  return `/practice?subject=${topic.subject || 'math'}&topic=${topic.topic || topic.id}&skill=${skill}`;
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link href="/" className="site-logo">
          <Image
            src="/images/klasschamp_logo.png"
            alt="KlassChamp Logo"
            width={40}
            height={40}
            className="logo-image"
          />
          <span className="logo-text">KlassChamp</span>
        </Link>
        <div className="site-header-actions">
          <Link href="/practice" className="btn-start-practice">
            Quick Practice
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomeHero() {
  return (
    <section className="home-hero" aria-label="KlassChamp learning hero">
      <div className="home-hero-frame">
        <Image
          className="home-hero-image home-hero-image-desktop"
          src="/images/countryside_science_v2_desktop.png"
          alt="Countryside geometric science adventure hero - Desktop"
          width={1024}
          height={1024}
          priority
        />
        <Image
          className="home-hero-image home-hero-image-mobile"
          src="/images/countryside_science_v2.png"
          alt="Countryside geometric science adventure hero - Mobile"
          width={1024}
          height={1024}
          priority
        />
        <div className="home-hero-overlay">
          <div className="home-hero-overlay-content">
            <h1>Interactive & Adaptive Practice</h1>
            <p>Master Math, English, and Science with gamified worksheets and interactive visual tools built for your level.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicCatalog({ topics = TOPICS }) {
  return (
    <main className="topic-catalog-page">
      <HomeHero />
      <section className="topic-catalog-hero">
        <p>KlassChamp Practice</p>
        <h1>Choose a topic</h1>
      </section>
      <section className="topic-card-list" aria-label="Practice topics">
        {topics.map((topic) => (
          <article className="topic-row-card" key={topic.id} style={{ '--topic-color': topic.color }}>
            <div className="topic-color-bar" />
            <div className="topic-row-copy">
              <h2>{topic.title}</h2>
              <p>
                <span>Includes:</span>{' '}
                {(topic.includes || []).map((item, index) => (
                  <span key={item}>
                    {index > 0 ? <b aria-hidden="true"> | </b> : null}
                    {item}
                  </span>
                ))}
              </p>
            </div>
            <Link className="topic-row-button" href={`/?topic=${topic.id}`} style={{ background: topic.color }}>
              See all {countSkills(topic)} skills ›
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function TopicSkillsPage({ selectedTopic, topics = TOPICS }) {
  const selected = topics.find((topic) => topic.id === selectedTopic || topic.topic === selectedTopic) || topics[0];

  return (
    <main className="topic-detail-page">
      <aside className="topic-side-nav" aria-label="Topic navigation">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/?topic=${topic.id}`}
            className={`topic-side-link ${topic.id === selected.id ? 'active' : ''}`}
            style={{ '--topic-color': topic.color }}
          >
            <span />
            {topic.title}
          </Link>
        ))}
      </aside>

      <section className="topic-skill-content" style={{ '--topic-color': selected.color }}>
        <Link className="back-to-topics" href="/">‹ All topics</Link>
        <h1>{selected.title}</h1>
        <p className="topic-skill-intro">
          Here is a list of skills for {selected.title.toLowerCase()}. Skills are organized by level, and each link opens in the shared adaptive practice shell.
        </p>
        <div className="skill-columns">
          {selected.groups?.length ? (
            selected.groups.map((group) => (
              <section key={group.title} className="skill-column">
                <h2>{group.title}</h2>
                <ol>
                  {group.skills.map(([code, name, skill]) => (
                    <li key={skill}>
                      <span>{code}</span>
                      <Link href={practiceHref(selected, skill)}>{name}</Link>
                      <small aria-hidden="true"> ✎ ⊙</small>
                    </li>
                  ))}
                </ol>
              </section>
            ))
          ) : (
            <p className="topic-skill-intro">
              No skills have been added yet. Create skills in AdminV2 and refresh this page.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function SubjectTabs({ activeSubject }) {
  const subjects = [
    { id: 'math', label: '🧮 Math' },
    { id: 'english', label: '📚 English' },
    { id: 'science', label: '🔬 Science' },
    { id: 'social', label: '🌍 GK & Social' },
  ];

  return (
    <div className="subject-tabs-container">
      <div className="subject-tabs">
        {subjects.map((sub) => (
          <Link 
            key={sub.id} 
            href={`/?subject=${sub.id}`}
            className={`subject-tab ${activeSubject === sub.id ? 'active' : ''}`}
          >
            {sub.label}
          </Link>
        ))}
      </div>
      <Link href="/?view=topics" className="subject-tab view-toggle">
        📂 View by Topic
      </Link>
    </div>
  );
}

function getStandardizedGrade(title, topicId) {
  const t = title.toLowerCase();
  const id = (topicId || '').toLowerCase();
  
  if (id === 'lkg' || t.includes('lkg') || t.includes('lower kindergarten')) return 'LKG';
  if (id === 'ukg' || t.includes('ukg') || t.includes('upper kindergarten')) return 'UKG';
  
  if (t.includes('remediation')) return 'Remediation';
  if (t.includes('pre-k') || t.includes('prek') || id === 'prek') return 'Pre-K';
  if (t.includes('first') || t.includes('1st')) return 'Grade 1';
  if (t.includes('second') || t.includes('2nd')) return 'Grade 2';
  if (t.includes('third') || t.includes('3rd')) return 'Grade 3';
  if (t.includes('fourth') || t.includes('4th')) return 'Grade 4';
  if (t.includes('fifth') || t.includes('5th')) return 'Grade 5';
  if (t.includes('sixth') || t.includes('6th')) return 'Grade 6';
  if (t.includes('seventh') || t.includes('7th')) return 'Grade 7';
  if (t.includes('eighth') || t.includes('8th')) return 'Grade 8';
  return 'General Skills';
}

function buildGradeCurriculum(topics, activeSubject) {
  const subjectTopics = topics.filter(t => (t.subject || 'math') === activeSubject);
  const gradeMap = new Map();

  subjectTopics.forEach(topic => {
    (topic.groups || []).forEach(group => {
      const standardizedGrade = getStandardizedGrade(group.title, topic.id);
      
      if (!gradeMap.has(standardizedGrade)) {
        gradeMap.set(standardizedGrade, new Map()); // Use a Map to group by topic inside the grade
      }
      
      if (group.skills && group.skills.length > 0) {
        const topicsInGrade = gradeMap.get(standardizedGrade);
        
        if (!topicsInGrade.has(topic.id)) {
          topicsInGrade.set(topic.id, {
            id: topic.id,
            title: topic.title,
            color: topic.color,
            subject: topic.subject,
            topic: topic.topic,
            skills: []
          });
        }
        
        // Merge the skills into this topic block
        topicsInGrade.get(topic.id).skills.push(...group.skills);
      }
    });
  });

  // Convert the inner Maps back to Arrays
  const formattedGrades = Array.from(gradeMap.entries()).map(([grade, topicsMap]) => {
    return [grade, Array.from(topicsMap.values())];
  });

  // Sort grades logically
  const gradeOrder = ['Pre-K', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Remediation', 'General Skills'];
  
  const sortedGrades = formattedGrades.sort((a, b) => {
    const aIndex = gradeOrder.indexOf(a[0]);
    const bIndex = gradeOrder.indexOf(b[0]);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  return sortedGrades;
}

function GradeLevelCurriculumPage({ topics, activeSubject }) {
  const sortedGrades = buildGradeCurriculum(topics, activeSubject);

  return (
    <main className="ixl-landing-page">
      <HomeHero />
      <SubjectTabs activeSubject={activeSubject} />

      <div className="curriculum-container">
        <aside className="grade-sidebar">
          <h3>Grades</h3>
          {sortedGrades.map(([gradeTitle]) => (
            <a key={gradeTitle} href={`#grade-${gradeTitle.split(' ').join('-')}`} className="grade-link">
              {gradeTitle.replace(' skills', '')}
            </a>
          ))}
        </aside>

        <section className="grade-content">
          {sortedGrades.length === 0 ? (
            <p className="empty-state">No skills available for this subject yet.</p>
          ) : (
             sortedGrades.map(([gradeTitle, gradeTopics], index) => {
               const isEarlyYears = gradeTitle === 'LKG' || gradeTitle === 'UKG' || gradeTitle === 'Pre-K';
               const prevGrade = index > 0 ? sortedGrades[index - 1][0] : null;
               const prevIsEarlyYears = prevGrade === 'LKG' || prevGrade === 'UKG' || prevGrade === 'Pre-K';
               
               const showPrekHero = isEarlyYears && !prevIsEarlyYears;
               const showPrimaryHero = !isEarlyYears && (index === 0 || prevIsEarlyYears);

               return (
                 <React.Fragment key={gradeTitle}>
                   {showPrekHero && (
                     <div className="inline-hero" style={{ backgroundImage: 'url(/images/prek_landscape.png)' }}>
                       <div className="inline-hero-content">
                         <h2>Kindergarten & Pre-K</h2>
                         <p>Fun, gamified learning environments.</p>
                       </div>
                     </div>
                   )}
                   {showPrimaryHero && (
                     <div className="inline-hero" style={{ backgroundImage: 'url(/images/herog.png)' }}>
                       <div className="inline-hero-content">
                         <h2>Primary Grades</h2>
                         <p>Interactive practice for 1st grade and above.</p>
                       </div>
                     </div>
                   )}
                   <div id={`grade-${gradeTitle.split(' ').join('-')}`} className="grade-section">
                     <h2 className="grade-heading">{gradeTitle.replace(' skills', '')}</h2>
                     <div className="grade-topics-grid">
                       {gradeTopics.map(topic => (
                         <div key={topic.id} className="topic-block" style={{'--theme-color': topic.color}}>
                           <h3 className="topic-subheading">{topic.title}</h3>
                           <div className="skill-pills">
                             {topic.skills.map(([code, name, skill]) => (
                               <Link key={skill} href={practiceHref(topic, skill)} className="skill-pill">
                                 <span className="skill-code">{code}</span>
                                 <span className="skill-name">{name}</span>
                               </Link>
                             ))}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </React.Fragment>
               );
             })
          )}
        </section>
      </div>
    </main>
  );
}

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const selectedTopic = params?.topic;
  const viewMode = params?.view;
  const activeSubject = params?.subject || 'math';
  
  const dbTopics = await loadDbTopics();
  const topics = mergeTopics(TOPICS, dbTopics);

  let content;
  if (selectedTopic) {
    content = <TopicSkillsPage selectedTopic={selectedTopic} topics={topics} />;
  } else if (viewMode === 'topics') {
    content = (
       <>
         <div className="view-toggle-header">
           <Link href="/" className="back-link">‹ Back to Grade View</Link>
         </div>
         <TopicCatalog topics={topics} />
       </>
    );
  } else {
    content = <GradeLevelCurriculumPage topics={topics} activeSubject={activeSubject} />;
  }

  return (
    <>
      <SiteHeader />
      {content}
    </>
  );
}
