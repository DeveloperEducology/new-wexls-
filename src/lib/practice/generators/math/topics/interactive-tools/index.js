export {
  getInteractiveToolsSkill,
  interactiveToolsCatalog,
} from './catalog.js';

import { getInteractiveToolsSkill } from './catalog.js';

export function generateInteractiveToolsQuestion(config = {}) {
  const skillId = config.logic_type || config.forcedTask || 'interactive-tools-fraction-bar';
  const skill = getInteractiveToolsSkill(skillId);
  const seed = config.variables?.seed || config.seed || Date.now();

  return {
    id: `interactive_tools_${skill.skillId}_${seed}`,
    type: 'interactiveTool',
    toolId: skill.manipulativeType,
    toolVersion: '1.0.0',
    title: 'Interactive Tools',
    eyebrow: skill.group,
    questionText: skill.title,
    toolConfig: {
      mode: 'explore',
      prompt: `Explore the ${skill.title.toLowerCase()} tool.`,
    },
    answer: { value: null },
    validation: {
      strategy: 'tool_state',
    },
    metadata: {
      subject: 'math',
      topic: 'interactive-tools',
      skillId: skill.skillId,
      templateId: `interactive_tools.${skill.manipulativeType}`,
      engine: 'interactive-tools',
    },
  };
}

export function getInteractiveToolsTemplate(skillId) {
  const skill = getInteractiveToolsSkill(skillId);
  return {
    id: `interactive_tools.${skill.manipulativeType}`,
    logicType: skill.skillId,
    title: skill.title,
    family: 'interactive_tools',
    engine: 'interactive-tools',
    questionType: 'interactiveTool',
  };
}
