import { grade1SubtractionSkills } from './grade1.js';

export const subtractionSkillsByGrade = {
  1: grade1SubtractionSkills,
};

export const subtractionMicroSkills = [
  ...grade1SubtractionSkills,
];

export function getSubtractionSkill(skillId) {
  return subtractionMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
