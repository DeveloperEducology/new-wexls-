const manipulativeSkills = [
  ['story-math-fraction-bar', 'SM.8', 'Manipulative: fraction bar', 'fraction_bar'],
  ['story-math-number-line', 'SM.9', 'Manipulative: number line', 'number_line'],
  ['story-math-clock', 'SM.10', 'Manipulative: clock', 'clock'],
  ['story-math-balance-scale', 'SM.11', 'Manipulative: balance scale', 'balance_scale'],
  ['story-math-measuring-cup', 'SM.12', 'Manipulative: measuring cup', 'measuring_cup'],
  ['story-math-thermometer', 'SM.13', 'Manipulative: thermometer', 'thermometer'],
  ['story-math-base-ten-blocks', 'SM.14', 'Manipulative: base-ten blocks', 'base_ten_blocks'],
  ['story-math-place-value-chart', 'SM.15', 'Manipulative: place value chart', 'place_value_chart'],
  ['story-math-diagram-labeling', 'SM.16', 'Manipulative: diagram labeling', 'diagram_labeling'],
].map(([skillId, code, title, manipulativeType]) => ({
  skillId,
  code,
  title,
  group: 'Manipulative types',
  appletType: 'manipulative_lab',
  manipulativeType,
}));

export const storyMathCatalog = [
  {
    skillId: 'story-math-lesson',
    code: 'SM.1',
    title: 'Story lesson: Magical Sharing Pizza',
    group: 'Story lesson',
    mode: 'lesson',
    modes: ['lesson'],
  },
  {
    skillId: 'story-math-sandbox',
    code: 'SM.2',
    title: 'Sandbox: Pizza Kitchen',
    group: 'Free play',
    mode: 'sandbox',
    modes: ['sandbox'],
  },
  {
    skillId: 'story-math-quiz',
    code: 'SM.3',
    title: 'Quiz game: Fractions Superhero',
    group: 'Quiz game',
    mode: 'quiz',
    modes: ['quiz'],
  },
  {
    skillId: 'story-math-practice',
    code: 'SM.4',
    title: 'Interactive practice: Choose and share',
    group: 'Practice',
    mode: 'sandbox',
    modes: ['sandbox', 'quiz'],
  },
  {
    skillId: 'story-math-demo-board',
    code: 'SM.5',
    title: 'Teaching board: Whole, halves, quarters',
    group: 'Teacher demo',
    mode: 'lesson',
    modes: ['lesson', 'sandbox'],
  },
  {
    skillId: 'story-math-remediation',
    code: 'SM.6',
    title: 'Remediation: Fair shares scaffold',
    group: 'Remediation',
    mode: 'lesson',
    modes: ['lesson'],
  },
  {
    skillId: 'story-math-manipulative-lab',
    code: 'SM.7',
    title: 'Universal manipulative lab',
    group: 'Manipulatives',
    mode: 'sandbox',
    modes: ['sandbox', 'lesson', 'quiz'],
  },
  ...manipulativeSkills,
];

export const storyMathSkillsByGrade = {
  demo: storyMathCatalog.map((skill) => ({
    id: skill.skillId,
    code: skill.code,
    title: skill.title,
  })),
};

export function getStoryMathSkill(skillId) {
  return storyMathCatalog.find((skill) => skill.skillId === skillId || skill.code === skillId) || storyMathCatalog[0];
}
