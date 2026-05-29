import { multiplicationSkillsByGrade } from '../generators/math/topics/multiplication/skills/index.js';

const gradeLabel = (grade) => {
  if (grade === 'remediation') return 'Remediation';
  if (grade === 'prek') return 'Pre-K';
  return `Grade ${grade}`;
};

const gradeOrdinal = (grade) => {
  if (grade === 'remediation') return 'Remediation skills';
  if (grade === 'prek') return 'Pre-K skills';
  return `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`;
};

export const multiplicationCatalogOptions = Object.entries(multiplicationSkillsByGrade).flatMap(([grade, skills]) => (
  skills.map((skill) => ({
    group: gradeLabel(grade),
    label: `${skill.code} ${skill.title}`,
    value: skill.id,
  }))
));

export const multiplicationHomeGroups = Object.entries(multiplicationSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));
