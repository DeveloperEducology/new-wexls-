import { generateSolarSystemQuestion } from './engine.js';

export const solarSystemSkills = {
  'science-g3-solar-system-planets-hotspot': {
    id: 'science-g3-solar-system-planets-hotspot',
    code: 'SS.1',
    title: 'Identify planets in the solar system',
    grade: '3',
    templateId: 'solar.system.planets',
    params: { subType: 'planets_hotspot' }
  }
};

export function resolveSolarSystemGenerator(skillId, overrides = {}) {
  const skill = solarSystemSkills[skillId];
  if (!skill) {
    return null;
  }

  const generate = (config) => {
    return generateSolarSystemQuestion(config, skill.params);
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
