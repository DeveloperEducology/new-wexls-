// skills/index.js
import { grade2MultiplicationSkills } from './grade2.js';
import { grade3MultiplicationSkills } from './grade3.js';
import { grade4MultiplicationSkills } from './grade4.js';
import { remediationMultiplicationSkills } from './remediation.js';

export const multiplicationSkillsByGrade = {
  remediation: remediationMultiplicationSkills,
  2: grade2MultiplicationSkills,
  3: grade3MultiplicationSkills,
  4: grade4MultiplicationSkills
};

export const multiplicationMicroSkills = [
  ...remediationMultiplicationSkills,
  ...grade2MultiplicationSkills,
  ...grade3MultiplicationSkills,
  ...grade4MultiplicationSkills
];

export function getMultiplicationSkill(skillId) {
  return multiplicationMicroSkills.find(
    (skill) => skill.id === skillId || skill.code === skillId
  ) || null;
}
