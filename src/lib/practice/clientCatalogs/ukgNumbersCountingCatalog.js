import { ukgNumbersCountingSkillsByChapter } from '../generators/math/topics/ukg-numbers-counting/skills.js';

export const ukgNumbersCountingCatalogOptions = Object.entries(ukgNumbersCountingSkillsByChapter).flatMap(
  ([chapter, skills]) => skills.map((skill) => ({
    group: chapter,
    label: `${skill.code} ${skill.title}`,
    value: skill.skillId
  }))
);

export const ukgNumbersCountingHomeGroups = Object.entries(ukgNumbersCountingSkillsByChapter).map(
  ([chapter, skills]) => ({
    title: chapter,
    skills: skills.map((skill) => [skill.code, skill.title, skill.skillId])
  })
);
