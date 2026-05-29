import { MEASUREMENT_CATALOG } from '../generators/math/topics/measurement/catalog.js';

export const measurementCatalogOptions = MEASUREMENT_CATALOG.map((skill) => {
  const isGradeNumber = ['1', '2', '3', '4', '5', '6', '7', '8'].includes(skill.grade);
  return {
    group: isGradeNumber ? `Grade ${skill.grade}` : skill.grade,
    label: `${skill.code} ${skill.title}`,
    value: skill.skillId,
  };
});

const gradeOrdinal = (grade) => (
  `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`
);

const groupsMap = {};
MEASUREMENT_CATALOG.forEach((skill) => {
  groupsMap[skill.grade] ||= [];
  groupsMap[skill.grade].push(skill);
});

export const measurementHomeGroups = Object.entries(groupsMap).map(([grade, skills]) => ({
  title: ['1', '2', '3', '4', '5', '6', '7', '8'].includes(grade) ? gradeOrdinal(grade) : `${grade} skills`,
  skills: skills.map((skill) => [skill.code, skill.title, skill.skillId]),
}));
