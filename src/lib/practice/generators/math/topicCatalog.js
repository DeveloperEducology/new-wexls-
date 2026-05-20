const ADDITION_TOPICS = [
  {
    code: 'A.1',
    name: 'Addition facts up to 9',
    href: '/practice?source=addition-topic&forcedTask=addition-g1-a1-horizontal-to-9',
  },
  {
    code: 'C.1',
    name: 'Add with cubes up to 10',
    href: '/practice?source=addition-topic&forcedTask=addition-g1-c1-visual-counting-to-10',
  },
  {
    code: 'E.3',
    name: 'Addition sentences up to 10: which model matches?',
    href: '/practice?source=addition-topic&forcedTask=addition-g1-e3-model-match-to-10',
  },
  {
    code: 'Q.5',
    name: 'Model and write addition sentences for word problems',
    href: '/practice?source=addition-topic&forcedTask=addition-g1-q5-word-sentence-to-10',
  },
  {
    code: 'B.1',
    name: 'Vertical addition 10-99',
    href: '/practice?subject=math&topic=addition&skill=addition-g2-b1-vertical-10-99',
  },
  {
    code: 'B.2',
    name: 'Vertical addition 10-99 with regrouping',
    href: '/practice?subject=math&topic=addition&skill=addition-g2-b2-vertical-10-99-regrouping',
  },
  {
    code: 'G.3',
    name: 'Add three numbers: make 10',
    href: '/practice?subject=math&topic=addition&skill=addition-g2-g3-three-addends-make-10',
  },
  {
    code: 'G.4',
    name: 'Add three numbers: make 10 vertical',
    href: '/practice?subject=math&topic=addition&skill=addition-g2-b2-vertical-10-99-regrouping',
  },  
];

const TOPIC_GROUPS = [
  {
    id: 'addition',
    title: 'Addition',
    description: 'Clean topic-wise engines, templates, and grade micro-skills.',
    icon: '+',
    color: '#16a34a',
    bg: '#ecfdf5',
    skills: ADDITION_TOPICS,
  },
  {
    id: 'time',
    title: 'Time',
    description: 'Calendar, seasons, units, clocks, elapsed time, and time patterns.',
    icon: 'T',
    color: '#0ea5e9',
    bg: '#eff6ff',
    skills: [
      { code: 'T.1', name: 'Days of the week', href: '/practice?subject=math&topic=time&skill=v1_days_of_week' },
      { code: 'T.2', name: 'Order days of the week', href: '/practice?subject=math&topic=time&skill=order_days' },
      { code: 'T.3', name: 'Seasons', href: '/practice?subject=math&topic=time&skill=v2_seasons' },
      { code: 'T.4', name: 'Read a calendar', href: '/practice?subject=math&topic=time&skill=v3_calendar' },
      { code: 'T.5', name: 'A.M. or P.M.', href: '/practice?subject=math&topic=time&skill=v5_am_pm' },
      { code: 'T.6', name: 'Read clocks and write times', href: '/practice?subject=math&topic=time&skill=o3_read_clock' },
      { code: 'T.7', name: 'Elapsed time', href: '/practice?subject=math&topic=time&skill=o5_elapsed_time' },
      { code: 'T.8', name: 'Time patterns', href: '/practice?subject=math&topic=time&skill=o7_time_patterns' },
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    description: 'Visual fraction models wired into the shared practice shell.',
    icon: 'F',
    color: '#7c3aed',
    bg: '#f5f3ff',
    skills: [
      { code: 'F.1', name: 'Identify fractions from models', href: '/practice?subject=math&topic=fractions&skill=fractions-g2-identify-visual' },
      { code: 'F.2', name: 'Identify like and unlike fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g3-like-unlike' },
      { code: 'F.3', name: 'Identify proper, improper, and mixed fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g3-types' },
      { code: 'F.4', name: 'Identify fractions from shapes', href: '/practice?subject=math&topic=fractions&skill=visual_models_identify' },
      { code: 'F.5', name: 'Write fractions from shapes', href: '/practice?subject=math&topic=fractions&skill=visual_models_write_fraction' },
      { code: 'F.6', name: 'Equal parts', href: '/practice?subject=math&topic=fractions&skill=visual_models_equal_parts' },
      { code: 'F.7', name: 'Fraction of a set', href: '/practice?subject=math&topic=fractions&skill=visual_models_fraction_of_set' },
      { code: 'F.8', name: 'Mixed numbers from models', href: '/practice?subject=math&topic=fractions&skill=visual_models_mixed_numbers' },
      { code: 'F.9', name: 'Convert improper fractions to mixed numbers', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-convert-improper-to-mixed' },
      { code: 'F.10', name: 'Convert mixed numbers to improper fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-convert-mixed-to-improper' },
      { code: 'F.11', name: 'Compare like fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-compare-like-fractions' },
      { code: 'F.12', name: 'Compare unlike fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-compare-unlike-fractions' },
      { code: 'F.13', name: 'Compare proper fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-compare-proper-fractions' },
      { code: 'F.14', name: 'Add like fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-add-like-fractions' },
      { code: 'F.15', name: 'Add improper fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-add-improper-fractions' },
      { code: 'F.16', name: 'Add a fraction and an integer', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-add-fraction-and-integer' },
      { code: 'F.17', name: 'Find the missing fraction addend', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-missing-fraction-addend' },
      { code: 'F.18', name: 'Find the missing integer addend', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-missing-integer-addend' },
      { code: 'F.19', name: 'Add three or more fractions', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-add-multiple-fractions' },
      { code: 'F.26', name: 'Add/subtract fractions (unlike denominators)', href: '/practice?subject=math&topic=fractions&skill=fractions-g5-add-subtract-unlike-denominators' },
    ],
  },
  {
    id: 'place-values',
    title: 'Place Values',
    description: 'Base-ten blocks, place names, expanded form, word form, and tables.',
    icon: 'PV',
    color: '#0891b2',
    bg: '#ecfeff',
    skills: [
      { code: 'PV.1', name: 'Tens and ones blocks', href: '/practice?subject=math&topic=place-values&skill=pv-g1-blocks-units' },
      { code: 'PV.2', name: 'Place value name', href: '/practice?subject=math&topic=place-values&skill=pv-g1-place-name' },
      { code: 'PV.3', name: 'Which model shows the number?', href: '/practice?subject=math&topic=place-values&skill=pv-g1-match-blocks-to-number' },
      { code: 'PV.4', name: 'Hundreds blocks', href: '/practice?subject=math&topic=place-values&skill=pv-g2-blocks-hundreds' },
      { code: 'PV.5', name: 'Expanded form', href: '/practice?subject=math&topic=place-values&skill=pv-g2-expanded-form' },
      { code: 'PV.6', name: 'Place-value table', href: '/practice?subject=math&topic=place-values&skill=pv-g2-breakdown-table' },
      { code: 'PV.7', name: 'Thousands blocks', href: '/practice?subject=math&topic=place-values&skill=pv-g3-blocks-thousands' },
      { code: 'PV.8', name: 'Word form to number', href: '/practice?subject=math&topic=place-values&skill=pv-g3-word-to-number' },
    ],
  },
  {
    id: 'ratio',
    title: 'Ratios',
    description: 'Learn comparison of quantities, equivalent ratios, and word problems.',
    icon: 'R',
    color: '#ea580c',
    bg: '#fff7ed',
    skills: [
      { code: 'R.1', name: 'Compare quantities of same kind', href: '/practice?subject=math&topic=ratio&skill=ratio_identify_from_words' },
      { code: 'R.2', name: 'Compare quantities by subtraction vs division', href: '/practice?subject=math&topic=ratio&skill=ratio_subtraction_vs_division' },
      { code: 'R.3', name: 'Check if comparison is same kind', href: '/practice?subject=math&topic=ratio&skill=ratio_same_kind_check' },
      { code: 'R.4', name: 'Understand antecedent and consequent', href: '/practice?subject=math&topic=ratio&skill=ratio_terms_antecedent_consequent' },
      { code: 'R.5', name: 'Ratio has no units', href: '/practice?subject=math&topic=ratio&skill=ratio_units_concept' },
      { code: 'R.6', name: 'Simplify ratios using HCF (two terms)', href: '/practice?subject=math&topic=ratio&skill=ratio_simplify_two_terms' },
      { code: 'R.7', name: 'Simplify ratios using HCF (three terms)', href: '/practice?subject=math&topic=ratio&skill=ratio_simplify_three_terms' },
      { code: 'R.8', name: 'Check equivalent ratios', href: '/practice?subject=math&topic=ratio&skill=ratio_equivalent_check' },
      { code: 'R.9', name: 'Find equivalent ratios', href: '/practice?subject=math&topic=ratio&skill=ratio_equivalent_find' },
      { code: 'R.10', name: 'Equivalent ratios with fractions', href: '/practice?subject=math&topic=ratio&skill=ratio_fraction_to_whole' },
      { code: 'R.11', name: 'Solve missing values in ratios', href: '/practice?subject=math&topic=ratio&skill=ratio_missing_value' },
      { code: 'R.12', name: 'Complete ratio tables', href: '/practice?subject=math&topic=ratio&skill=ratio_table_completion' },
      { code: 'R.13', name: 'Pattern completion in ratios', href: '/practice?subject=math&topic=ratio&skill=ratio_pattern_completion' },
      { code: 'R.14', name: 'Greater ratio comparison', href: '/practice?subject=math&topic=ratio&skill=ratio_greater_comparison' },
      { code: 'R.15', name: 'Identify ratios from visual count', href: '/practice?subject=math&topic=ratio&skill=ratio_visual_count' },
      { code: 'R.16', name: 'Word problems on ratios', href: '/practice?subject=math&topic=ratio&skill=ratio_word_problem_basic' },
      { code: 'R.17', name: 'Error analysis of ratio mistakes', href: '/practice?subject=math&topic=ratio&skill=ratio_error_analysis' },
      { code: 'R.18', name: 'Match ratios to descriptions', href: '/practice?subject=math&topic=ratio&skill=ratio_matching' },
      { code: 'R.19', name: 'Sort ratios into categories', href: '/practice?subject=math&topic=ratio&skill=ratio_sorting' },
      { code: 'R.20', name: 'Misconception remediation', href: '/practice?subject=math&topic=ratio&skill=ratio_remediation' },
      { code: 'S.1', name: 'Write a part-to-part ratio', href: '/practice?subject=math&topic=ratio&skill=ratio_write_part_to_part_mcq' },
      { code: 'S.2', name: 'Write a ratio using a colon', href: '/practice?subject=math&topic=ratio&skill=ratio_write_colon_single_blank' },
      { code: 'S.3', name: 'Write a ratio using a fraction', href: '/practice?subject=math&topic=ratio&skill=ratio_write_fraction_single_blank' },
      { code: 'S.6', name: 'Which model represents the ratio?', href: '/practice?subject=math&topic=ratio&skill=ratio_which_model_represents_mcq' }
    ],
  },
];

export function getMathTopicGroups() {
  return TOPIC_GROUPS;
}

export function getTemplateHubGroups() {
  return TOPIC_GROUPS;
}

export function getMathTopicPageSummary() {
  return {
    title: 'Math Topics',
    description: 'Topic groups built from reusable generator-backed skills.',
  };
}
