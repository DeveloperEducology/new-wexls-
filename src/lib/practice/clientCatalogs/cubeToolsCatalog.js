import { cubeToolsCatalog } from '../generators/math/topics/cube-tools/catalog.js';

export { cubeToolsCatalog };

export const cubeToolsCatalogOptions = cubeToolsCatalog.map((skill) => ({
  group: skill.group,
  label: `${skill.code} ${skill.title}`,
  value: skill.skillId,
}));

export const cubeToolsHomeGroups = Object.entries(
  cubeToolsCatalog.reduce((groups, skill) => {
    const key = skill.group || 'Cube tools';
    groups[key] ||= [];
    groups[key].push(skill);
    return groups;
  }, {})
).map(([group, skills]) => ({
  title: group,
  skills: skills.map((skill) => [skill.code, skill.title, skill.skillId]),
}));
