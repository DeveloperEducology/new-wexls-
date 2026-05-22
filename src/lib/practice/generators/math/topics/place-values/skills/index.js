import { grade1PlaceValueSkills } from './grade1.js';
import { grade2PlaceValueSkills } from './grade2.js';
import { grade3PlaceValueSkills } from './grade3.js';
import { grade4PlaceValueSkills } from './grade4.js';
import { grade5PlaceValueSkills } from './grade5.js';
import { grade6PlaceValueSkills } from './grade6.js';

export const placeValueSkillsByGrade = {
  1: grade1PlaceValueSkills,
  2: grade2PlaceValueSkills,
  3: grade3PlaceValueSkills,
  4: grade4PlaceValueSkills,
  5: grade5PlaceValueSkills,
  6: grade6PlaceValueSkills,
};

export const placeValueMicroSkills = [
  ...grade1PlaceValueSkills,
  ...grade2PlaceValueSkills,
  ...grade3PlaceValueSkills,
  ...grade4PlaceValueSkills,
  ...grade5PlaceValueSkills,
  ...grade6PlaceValueSkills,
];

export function getPlaceValueSkill(skillId) {
  return placeValueMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
