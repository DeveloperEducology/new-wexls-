import { additionSkillsByGrade } from '../practice/generators/math/topics/addition/skills/index.js';
import { multiplicationSkillsByGrade } from '../practice/generators/math/topics/multiplication/skills/index.js';
import { subtractionSkillsByGrade } from '../practice/generators/math/topics/subtraction/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../practice/generators/science/topics/units-measurement/skills/index.js';

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
                'visual_models_identify',
                'visual_models_equal_parts',
                'visual_models_fraction_of_set',
                'visual_models_mixed_numbers',
                'visual_models_cut_rectangle_fourths',
                'visual_models_cut_circle_fourths',
                'visual_models_cut_rectangle_halves_different',
              ],
            },
            {
              id: 'equivalence',
              title: 'Equivalence',
              skills: [
                'equivalence_number_line',
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
          grades: [
            { id: 1, title: 'Grade 1', skills: ['pv-g1-blocks-units', 'pv-g1-place-name', 'pv-g1-match-blocks-to-number'] },
            { id: 2, title: 'Grade 2', skills: ['pv-g2-blocks-hundreds', 'pv-g2-expanded-form', 'pv-g2-breakdown-table'] },
            { id: 3, title: 'Grade 3', skills: ['pv-g3-blocks-thousands', 'pv-g3-word-to-number'] },
          ],
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
          grades: [{
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
