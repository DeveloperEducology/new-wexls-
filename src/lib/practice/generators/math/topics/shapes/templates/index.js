export const shapesTemplates = {
  'shapes.identify.visual-to-text': {
    id: 'shapes.identify.visual-to-text',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'visual_to_text', difficulty: 'easy' },
  },
  'shapes.identify.text-to-visual': {
    id: 'shapes.identify.text-to-visual',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'text_to_visual', difficulty: 'easy' },
  },
  'shapes.remedial.match': {
    id: 'shapes.remedial.match',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'remedial_match_basic' },
  },
  'shapes.remedial.sides': {
    id: 'shapes.remedial.sides',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'remedial_count_sides' },
  },
  'shapes.3d.identify': {
    id: 'shapes.3d.identify',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'shapes-g2-2d-vs-3d' },
  },
  'shapes.3d.properties': {
    id: 'shapes.3d.properties',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'shapes-g2-vertices-edges-faces' },
  },
  'shapes.quadrilaterals': {
    id: 'shapes.quadrilaterals',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'shapes-g3-quadrilaterals' },
  },
  'shapes.symmetry.lines': {
    id: 'shapes.symmetry.lines',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'shapes-g3-symmetry-lines' },
  },
  'shapes.symmetry.check': {
    id: 'shapes.symmetry.check',
    family: 'shapes',
    engine: 'shapes',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'shapes-g3-symmetry-check' },
  }
};

export function getShapesTemplate(templateId) {
  return shapesTemplates[templateId] || null;
}
