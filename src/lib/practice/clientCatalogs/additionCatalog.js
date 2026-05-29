import { additionSkillsByGrade } from '../generators/math/topics/addition/skills/index.js';

export { additionSkillsByGrade };

export const additionCatalogOptions = Object.entries(additionSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: grade === 'remediation' ? 'Remediation' : `Grade ${grade}`,
    label: `${skill.code} ${skill.title}`,
    value: skill.id,
  }))
));

export const additionHomeGroups = Object.entries(additionSkillsByGrade).map(([grade, skills]) => ({
  title: grade === 'remediation'
    ? 'Remediation skills'
    : `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`,
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));
