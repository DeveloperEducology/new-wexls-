import { storyMathCatalog } from '../generators/math/topics/story-math/catalog.js';

export const storyMathCatalogOptions = storyMathCatalog.map((skill) => ({
  group: skill.group,
  label: `${skill.code} ${skill.title}`,
  value: skill.skillId,
}));

export const storyMathHomeGroups = Object.entries(
  storyMathCatalog.reduce((groups, skill) => {
    const key = skill.group || 'Story applets';
    groups[key] ||= [];
    groups[key].push(skill);
    return groups;
  }, {})
).map(([group, skills]) => ({
  title: group,
  skills: skills.map((skill) => [skill.code, skill.title, skill.skillId]),
}));
