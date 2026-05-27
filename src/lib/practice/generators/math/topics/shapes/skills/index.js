import { shapesRemediationSkills } from './remediation.js';
import { shapesGrade2Skills } from './grade2.js';
import { shapesGrade3Skills } from './grade3.js';

export const shapesMicroSkills = [
  {
    id: 'shapes-g1-identify-visual-text-opts',
    code: 'SH.1',
    grade: '1',
    topic: 'shapes',
    competencyId: 'identify_shapes_visual',
    title: 'Identify shapes by their visual appearance',
    templateId: 'shapes.identify.visual-to-text',
    config: { forcedTask: 'visual_to_text', difficulty: 'easy' },
  },
  {
    id: 'shapes-g1-identify-name-visual-opts',
    code: 'SH.2',
    grade: '1',
    topic: 'shapes',
    competencyId: 'identify_shapes_visual',
    title: 'Identify shapes by their name using visual choices',
    templateId: 'shapes.identify.text-to-visual',
    config: { forcedTask: 'text_to_visual', difficulty: 'easy' },
  },
  ...shapesRemediationSkills,
  ...shapesGrade2Skills,
  ...shapesGrade3Skills
];

export const shapesSkillsByGrade = {
  remediation: shapesRemediationSkills,
  1: shapesMicroSkills.filter(s => s.grade === '1'),
  2: shapesGrade2Skills,
  3: shapesGrade3Skills
};

export function getShapesSkill(skillId) {
  return shapesMicroSkills.find((skill) => skill.id === skillId || skill.code === skillId) || null;
}
