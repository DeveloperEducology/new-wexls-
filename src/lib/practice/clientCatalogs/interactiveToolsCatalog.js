import { interactiveToolsCatalog } from '../generators/math/topics/interactive-tools/catalog.js';

export const interactiveToolsCatalogOptions = interactiveToolsCatalog.map((skill) => ({
  group: skill.group,
  label: `${skill.code} ${skill.title}`,
  value: skill.skillId,
}));

export const interactiveToolsHomeGroups = Object.entries(
  interactiveToolsCatalog.reduce((groups, skill) => {
    const key = skill.group || 'Interactive tools';
    groups[key] ||= [];
    groups[key].push(skill);
    return groups;
  }, {})
).map(([group, skills]) => ({
  title: group,
  skills: skills.map((skill) => [skill.code, skill.title, skill.skillId]),
}));
