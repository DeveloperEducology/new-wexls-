import { grade3DivisionSkills } from './grade3.js';
import { grade4DivisionSkills } from './grade4.js';
import { grade5DivisionSkills } from './grade5.js';
import { remediationDivisionSkills } from './remediation.js';

export const divisionSkillsByGrade = {
  remediation: remediationDivisionSkills,
  3: grade3DivisionSkills,
  4: grade4DivisionSkills,
  5: grade5DivisionSkills
};

export const divisionMicroSkills = [
  ...remediationDivisionSkills,
  ...grade3DivisionSkills,
  ...grade4DivisionSkills,
  ...grade5DivisionSkills
];

export function getDivisionSkill(skillId) {
  return divisionMicroSkills.find(
    (skill) => skill.id === skillId || skill.code === skillId
  ) || null;
}
