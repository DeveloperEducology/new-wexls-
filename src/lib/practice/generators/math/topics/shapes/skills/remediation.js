export const shapesRemediationSkills = [
  {
    id: 'shapes-remedial-match-basic',
    code: 'R.1',
    grade: 'remediation',
    topic: 'shapes',
    competencyId: 'shapes_remedial_match',
    title: 'Match basic shapes (circle, triangle, square)',
    description: 'Identify the simplest geometric shapes.',
    templateId: 'shapes.remedial.match',
    config: { forcedTask: 'remedial_match_basic' }
  },
  {
    id: 'shapes-remedial-count-sides',
    code: 'R.2',
    grade: 'remediation',
    topic: 'shapes',
    competencyId: 'shapes_remedial_sides',
    title: 'Count sides of simple shapes',
    description: 'Count the straight sides of basic 2D shapes.',
    templateId: 'shapes.remedial.sides',
    config: { forcedTask: 'remedial_count_sides' }
  }
];
