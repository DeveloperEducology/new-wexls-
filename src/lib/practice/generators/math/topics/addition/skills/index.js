import { remediationAdditionSkills } from './remediation.js';
import { grade1AdditionSkills } from './grade1.js';
import { grade2AdditionSkills } from './grade2.js';
import { grade3AdditionSkills } from './grade3.js';
import { grade4AdditionSkills } from './grade4.js';

export const additionSkillsByGrade = {
  remediation: remediationAdditionSkills,
  1: grade1AdditionSkills,
  2: grade2AdditionSkills,
  3: grade3AdditionSkills,
  4: grade4AdditionSkills
};

export const additionMicroSkills = [
  ...remediationAdditionSkills,
  ...grade1AdditionSkills,
  ...grade2AdditionSkills,
  ...grade3AdditionSkills,
  ...grade4AdditionSkills
];

export function getAdditionSkill(skillId) {
  return additionMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
