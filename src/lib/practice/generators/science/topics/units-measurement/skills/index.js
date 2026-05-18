import { grade2Skills } from './grade2.js';
import { grade3Skills } from './grade3.js';
import { grade4Skills } from './grade4.js';
import { grade8Skills } from './grade8.js';

export const unitsMeasurementSkillsByGrade = {
  2: grade2Skills,
  3: grade3Skills,
  4: grade4Skills,
  8: grade8Skills,
};

export const unitsMeasurementMicroSkills = {
  ...grade2Skills.reduce((acc, skill) => ({ ...acc, [skill.id]: skill }), {}),
  ...grade3Skills.reduce((acc, skill) => ({ ...acc, [skill.id]: skill }), {}),
  ...grade4Skills.reduce((acc, skill) => ({ ...acc, [skill.id]: skill }), {}),
  ...grade8Skills.reduce((acc, skill) => ({ ...acc, [skill.id]: skill }), {}),
};

export function getUnitsMeasurementSkill(skillId) {
  return unitsMeasurementMicroSkills[skillId] || null;
}
