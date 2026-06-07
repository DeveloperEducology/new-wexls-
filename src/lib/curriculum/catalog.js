import { additionSkillsByGrade } from '../practice/generators/math/topics/addition/skills/index.js';
import { multiplicationSkillsByGrade } from '../practice/generators/math/topics/multiplication/skills/index.js';
import { subtractionSkillsByGrade } from '../practice/generators/math/topics/subtraction/skills/index.js';
import { placeValueSkillsByGrade } from '../practice/generators/math/topics/place-values/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../practice/generators/science/topics/units-measurement/skills/index.js';
import { shapesSkillsByGrade } from '../practice/generators/math/topics/shapes/skills/index.js';
import { moneySkillsByGrade } from '../practice/generators/math/topics/money/skills/index.js';

const unitsMeasurementGrades = Object.entries(unitsMeasurementSkillsByGrade).map(([grade, skills]) => ({
  id: isNaN(Number(grade)) ? grade : Number(grade),
  title: `Grade ${grade}`,
  skills: skills.map((skill) => skill.id),
}));

const additionGrades = Object.entries(additionSkillsByGrade).map(([grade, skills]) => ({
  id: grade,
  title: grade === 'remediation' ? 'Remediation' : `Grade ${grade}`,
  skills: skills.map((skill) => skill.id),
}));

const multiplicationGrades = Object.entries(multiplicationSkillsByGrade).map(([grade, skills]) => ({
  id: isNaN(Number(grade)) ? grade : Number(grade),
  title: `Grade ${grade}`,
  skills: skills.map((skill) => skill.id),
}));

const subtractionGrades = Object.entries(subtractionSkillsByGrade).map(([grade, skills]) => ({
  id: isNaN(Number(grade)) ? grade : Number(grade),
  title: grade === 'prek' ? 'Pre-K' : `Grade ${grade}`,
  skills: skills.map((skill) => skill.id),
}));

const placeValueGrades = Object.entries(placeValueSkillsByGrade).map(([grade, skills]) => ({
  id: isNaN(Number(grade)) ? grade : Number(grade),
  title: `Grade ${grade}`,
  skills: skills.map((skill) => skill.id),
}));

const shapesGrades = Object.entries(shapesSkillsByGrade).map(([grade, skills]) => ({
  id: isNaN(Number(grade)) ? grade : Number(grade),
  title: grade === 'remediation' ? 'Remediation' : (grade === 'LKG' || grade === 'UKG' ? grade : `Grade ${grade}`),
  skills: skills.map((skill) => skill.id),
}));

const moneyGrades = Object.entries(moneySkillsByGrade).map(([grade, skills]) => ({
  id: isNaN(Number(grade)) ? grade : Number(grade),
  title: grade === 'LKG' || grade === 'UKG' ? grade : `Grade ${grade}`,
  skills: skills.map((skill) => skill.id),
}));

export const curriculumCatalog = {
  subjects: [
    {
      id: 'math',
      title: 'Math',
      topics: [
        {
          id: 'addition',
          title: 'Addition',
          grades: additionGrades,
        },
        {
          id: 'subtraction',
          title: 'Subtraction',
          grades: subtractionGrades,
        },
        {
          id: 'fractions',
          title: 'Fractions',
          grades: [
            {
              id: 'visual-models',
              title: 'Visual Models',
              skills: [
                'fractions-g2-identify-visual',
                'fractions-g3-types',
                'visual_models_identify',
                'visual_models_write_fraction',
                'visual_models_equal_parts',
                'visual_models_fraction_of_set',
                'visual_models_mixed_numbers',
                'visual_models_cut_rectangle_fourths',
                'visual_models_cut_circle_fourths',
                'visual_models_cut_rectangle_halves_different',
                'visual_models_cut_rectangle_thirds',
                'visual_models_cut_circle_thirds',
                'visual_models_cut_circle_sixths',
              ],
            },
            {
              id: 'equivalence',
              title: 'Equivalence',
              skills: [
                'fractions-g3-like-unlike',
                'equivalence_number_line',
                'fractions-g5-convert-improper-to-mixed',
                'fractions-g5-convert-mixed-to-improper',
                'fractions-g5-compare-like-fractions',
                'fractions-g5-compare-unlike-fractions',
                'fractions-g5-compare-proper-fractions',
              ],
            },
            {
              id: 'decomposing-fractions',
              title: 'Decomposing & Unit Fractions',
              skills: [
                'fractions_decompose_into_unit_fractions',
                'fractions_decompose_missing_unit_fraction',
                'fractions_decompose_select_all_sums',
                'fractions_build_from_words',
                'fractions_decompose_error_analysis',
                'fractions_count_unit_fraction_pieces',
                'fractions_decompose_puzzle_style',
              ],
            },
            {
              id: 'operations',
              title: 'Fraction Operations',
              skills: [
                'fractions-g5-add-like-fractions',
                'fractions-g5-add-improper-fractions',
                'fractions-g5-add-fraction-and-integer',
                'fractions-g5-missing-fraction-addend',
                'fractions-g5-missing-integer-addend',
                'fractions-g5-add-multiple-fractions',
                'fractions-g5-add-subtract-unlike-denominators',
              ],
            }
          ],
        },
        {
          id: 'time',
          title: 'Time',
          grades: [{
            id: 'calendar-clocks',
            title: 'Calendar and Clocks',
            skills: [
              'v1_days_of_week',
              'order_days',
              'v2_seasons',
              'order_seasons',
              'v3_calendar',
              'v4_months',
              'm5_days_in_month',
              'm6_relate_time_units',
              'v5_am_pm',
              'match_analog_clock_words',
              'match_digital_clock',
              'o3_read_clock',
              'o5_elapsed_time',
              'o7_time_patterns',
            ],
          }],
        },
        {
          id: 'place-values',
          title: 'Place Values',
          grades: placeValueGrades,
        },
        {
          id: 'testing',
          title: 'Testing Tools',
          grades: [{ id: 'tools', title: 'Reusable Tools', skills: [] }],
        },
        {
          id: 'multiplication',
          title: 'Multiplication',
          grades: multiplicationGrades,
        },
        {
          id: 'shapes',
          title: 'Shapes',
          grades: shapesGrades,
        },
        {
          id: 'money',
          title: 'Money',
          grades: moneyGrades,
        }
      ],
    },
    {
      id: 'social',
      title: 'Social',
      topics: [
        {
          id: 'gk',
          title: 'General Knowledge',
          grades: [
            {
              id: 'gk',
              title: 'GK',
              skills: [
                'gk_identify_person_v1',
                'gk_identify_image_v1',
                'gk_trivia_v1',
                'gk_fill_blanks_v1',
                'gk_sort_people_v1',
                'gk_true_false_v1',
                'gk_misconception_v1',
                'gk_inference_v1',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'science',
      title: 'Science',
      topics: [
        {
          id: 'units-measurement',
          title: 'Units and measurement',
          grades: unitsMeasurementGrades,
        },
      ],
    },
  ],
};

export function getCurriculumTopic(subject, topic) {
  const subjectEntry = curriculumCatalog.subjects.find((entry) => entry.id === subject);
  return subjectEntry?.topics.find((entry) => entry.id === topic) || null;
}
