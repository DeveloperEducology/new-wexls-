import { grade1AdditionSkills } from './grade1.js';
import { grade2AdditionSkills } from './grade2.js';

export const additionSkillsByGrade = {
  1: grade1AdditionSkills,
  2: grade2AdditionSkills
};

export const additionMicroSkills = [
  ...grade1AdditionSkills,
  ...grade2AdditionSkills
];

export function getAdditionSkill(skillId) {
  return additionMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
