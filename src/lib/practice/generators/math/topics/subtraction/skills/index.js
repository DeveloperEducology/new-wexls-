import { grade1SubtractionSkills } from './grade1.js';
import { prekSubtractionSkills } from './prek.js';

export const subtractionSkillsByGrade = {
  'prek': prekSubtractionSkills,
  1: grade1SubtractionSkills,
};

export const subtractionMicroSkills = [
  ...prekSubtractionSkills,
  ...grade1SubtractionSkills,
];

export function getSubtractionSkill(skillId) {
  return subtractionMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
