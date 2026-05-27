import { prekSubtractionSkills } from './prek.js';
import { grade1SubtractionSkills } from './grade1.js';
import { grade2SubtractionSkills } from './grade2.js';
import { grade3SubtractionSkills } from './grade3.js';
import { grade4SubtractionSkills } from './grade4.js';
import { remediationSubtractionSkills } from './remediation.js';

export const subtractionSkillsByGrade = {
  'prek': prekSubtractionSkills,
  remediation: remediationSubtractionSkills,
  1: grade1SubtractionSkills,
  2: grade2SubtractionSkills,
  3: grade3SubtractionSkills,
  4: grade4SubtractionSkills
};

export const subtractionMicroSkills = [
  ...prekSubtractionSkills,
  ...remediationSubtractionSkills,
  ...grade1SubtractionSkills,
  ...grade2SubtractionSkills,
  ...grade3SubtractionSkills,
  ...grade4SubtractionSkills
];

export function getSubtractionSkill(skillId) {
  return subtractionMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
