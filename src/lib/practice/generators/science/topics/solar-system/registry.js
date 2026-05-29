import { generateSolarSystemQuestion } from './engine.js';

export const solarSystemSkills = {
  'science-g3-solar-system-planets-hotspot': {
    id: 'science-g3-solar-system-planets-hotspot',
    code: 'SS.1',
    title: 'Identify planets in the solar system',
    grade: '3',
    templateId: 'solar.system.planets',
    params: { subType: 'planets_hotspot' }
  },
  'science-g3-solar-system-height-measure': {
    id: 'science-g3-solar-system-height-measure',
    code: 'SS.2',
    title: 'Measure and compare heights',
    grade: '3',
    templateId: 'solar.system.height.measure',
    params: { subType: 'height_measure' }
  }
};

export function resolveSolarSystemGenerator(skillId, overrides = {}) {
  const skill = solarSystemSkills[skillId];
  if (!skill) {
    return null;
  }

  const generate = (config) => {
    const question = generateSolarSystemQuestion(config, skill.params);
    return {
      ...question,
      metadata: {
        ...(question.metadata || {}),
        subject: 'science',
        topic: 'solar-system',
        skillId,
        templateId: skill.templateId,
        engine: 'solar-system'
      }
    };
  };

  return {
    generate,
    template: {
      id: skill.id,
      family: 'science',
      engine: 'solar-system',
      questionType: 'mcq',
      title: skill.title,
      description: 'Identify planets in the solar system based on their orbits and visual appearance.'
    }
  };
}
