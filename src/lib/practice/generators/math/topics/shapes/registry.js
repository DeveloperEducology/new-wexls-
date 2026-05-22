import { generateShapesQuestion } from './engine.js';
import { getShapesSkill, shapesMicroSkills } from './skills/index.js';
import { getShapesTemplate } from './templates/index.js';

const skillRegistry = Object.fromEntries(
  shapesMicroSkills.map((skill) => {
    const template = getShapesTemplate(skill.templateId);
    return [
      skill.id,
      {
        params: {
          ...(template?.defaultConfig || {}),
          ...(skill.config || {}),
        },
        skill,
        template,
      },
    ];
  }),
);

export const shapesRawRegistry = {
  ...skillRegistry,
};

export const shapesGenerator = (config) => {
  const logicType = config.logic_type || 'shapes-g1-identify-visual-text-opts';
  const skill = getShapesSkill(logicType);
  const entry = shapesRawRegistry[logicType] || shapesRawRegistry['shapes-g1-identify-visual-text-opts'];

  return generateShapesQuestion({
    ...config,
    difficulty: entry?.params?.difficulty || config.difficulty,
    forcedTask: entry?.params?.forcedTask || config.forcedTask,
    engineParams: {
      ...entry?.params,
      ...(config.engineParams || {})
    },
    metadata: {
      ...(config.metadata || {}),
      skill,
      template: entry?.template
    },
  });
};

export const shapesRegistry = Object.fromEntries(
  Object.keys(shapesRawRegistry).map((key) => [key, shapesGenerator])
);
