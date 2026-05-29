export {
  getStoryMathSkill,
  storyMathCatalog,
  storyMathSkillsByGrade,
} from './catalog.js';

import { getStoryMathSkill } from './catalog.js';

export function generateStoryMathQuestion(config = {}) {
  const skillId = config.logic_type || config.forcedTask || 'story-math-lesson';
  const skill = getStoryMathSkill(skillId);

  return {
    id: `story_math_${skill.skillId}_${config.variables?.seed || Date.now()}`,
    type: 'interactiveApplet',
    appletType: skill.appletType || 'story_math_applet',
    storyId: 'magical_sharing_pizza',
    manipulativeType: skill.manipulativeType,
    title: 'The Magical Sharing Pizza',
    eyebrow: skill.group,
    questionText: skill.title,
    modes: skill.modes || ['sandbox'],
    defaultMode: skill.mode || 'sandbox',
    metadata: {
      subject: 'math',
      topic: 'story-math',
      skillId: skill.skillId,
      templateId: 'story_math.magical_sharing_pizza',
      engine: 'story-math',
      usageMode: skill.mode,
      usageModes: skill.modes
    }
  };
}

export function getStoryMathTemplate(skillId) {
  const skill = getStoryMathSkill(skillId);
  return {
    id: 'story_math.magical_sharing_pizza',
    logicType: skill.skillId,
    title: skill.title,
    family: 'story_math',
    engine: 'story-math',
    questionType: 'interactiveApplet'
  };
}
