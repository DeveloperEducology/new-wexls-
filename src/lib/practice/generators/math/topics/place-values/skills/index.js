import { grade1PlaceValueSkills } from './grade1.js';
import { grade2PlaceValueSkills } from './grade2.js';
import { grade3PlaceValueSkills } from './grade3.js';

export const placeValueSkillsByGrade = {
  1: grade1PlaceValueSkills,
  2: grade2PlaceValueSkills,
  3: grade3PlaceValueSkills,
};

export const placeValueMicroSkills = [
  ...grade1PlaceValueSkills,
  ...grade2PlaceValueSkills,
  ...grade3PlaceValueSkills,
];

export function getPlaceValueSkill(skillId) {
  return placeValueMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
