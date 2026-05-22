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
  }
};

export function getShapesTemplate(templateId) {
  return shapesTemplates[templateId] || null;
}
