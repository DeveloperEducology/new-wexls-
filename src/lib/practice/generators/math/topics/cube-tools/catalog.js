export const cubeToolsCatalog = [
  {
    skillId: 'cube-tools-build',
    code: 'CT.1',
    title: 'Build a number with cubes',
    group: 'Build',
    templateId: 'cube_tools.build',
    mode: 'build',
  },
  {
    skillId: 'cube-tools-add',
    code: 'CT.2',
    title: 'Add with two cube groups',
    group: 'Addition',
    templateId: 'cube_tools.add',
    mode: 'add',
  },
  {
    skillId: 'cube-tools-subtract',
    code: 'CT.3',
    title: 'Take away cubes',
    group: 'Subtraction',
    templateId: 'cube_tools.subtract',
    mode: 'subtract',
  },
  {
    skillId: 'cube-tools-missing-addend',
    code: 'CT.4',
    title: 'Build the missing addend',
    group: 'Missing numbers',
    templateId: 'cube_tools.missing_addend',
    mode: 'missing_addend',
  },
];

export function getCubeToolsSkill(skillId = 'cube-tools-build') {
  return cubeToolsCatalog.find((skill) => skill.skillId === skillId || skill.templateId === skillId) || cubeToolsCatalog[0];
}
