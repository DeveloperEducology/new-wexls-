import { dataGraphsSkillsByGrade } from '../generators/math/topics/data-graphs/skills/index.js';

const gradeLabel = (grade) => {
  if (grade === 'remediation') return 'Remediation';
  return `Grade ${grade}`;
};

export const dataGraphsCatalogOptions = Object.entries(dataGraphsSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.skillId,
  }))
));

export const dataGraphsHomeGroups = Object.entries(dataGraphsSkillsByGrade).map(([grade, skills]) => ({
  title: grade === 'remediation' ? 'Remediation skills' : `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`,
  skills: skills.map((skill) => [skill.code, skill.title, skill.skillId]),
}));
