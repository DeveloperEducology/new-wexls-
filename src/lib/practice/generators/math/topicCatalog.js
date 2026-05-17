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
      { code: 'F.1', name: 'Identify fractions from shapes', href: '/practice?subject=math&topic=fractions&skill=visual_models_identify' },
      { code: 'F.2', name: 'Equal parts', href: '/practice?subject=math&topic=fractions&skill=visual_models_equal_parts' },
      { code: 'F.3', name: 'Fraction of a set', href: '/practice?subject=math&topic=fractions&skill=visual_models_fraction_of_set' },
      { code: 'F.4', name: 'Mixed numbers from models', href: '/practice?subject=math&topic=fractions&skill=visual_models_mixed_numbers' },
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
