import { dataGraphsRemediationSkills } from './remediation.js';
import { dataGraphsGrade2Skills } from './grade2.js';
import { dataGraphsGrade3Skills } from './grade3.js';

export const dataGraphsSkills = [
  {
    skillId: 'data-graphs-g1-read-picture-graph',
    code: 'DG.1',
    grade: '1',
    topic: 'data-graphs',
    competencyId: 'data_graphs_read_pictograph',
    title: 'Read picture graphs',
    description: 'Answer questions using a simple picture graph.'
  },
  {
    skillId: 'data-graphs-g1-compare-bar-graph',
    code: 'DG.2',
    grade: '1',
    topic: 'data-graphs',
    competencyId: 'data_graphs_scaled_bar',
    title: 'Compare bar graphs',
    description: 'Compare values shown in a bar graph.'
  },
  {
    skillId: 'data-graphs-g1-count-bar-graph',
    code: 'DG.3',
    grade: '1',
    topic: 'data-graphs',
    competencyId: 'data_graphs_scaled_bar',
    title: 'Count from bar graphs',
    description: 'Read a bar graph and count how many objects are shown.'
  },
  {
    skillId: 'data-graphs-g1-read-pictograph',
    code: 'DG.4',
    grade: '1',
    topic: 'data-graphs',
    competencyId: 'data_graphs_read_pictograph',
    title: 'Read pictographs',
    description: 'Answer questions from a pictograph.',
    templateId: 'data_graphs.pictograph.read'
  },
  {
    skillId: 'data-graphs-g1-find-least-bar-graph',
    code: 'DG.5',
    grade: '1',
    topic: 'data-graphs',
    competencyId: 'data_graphs_scaled_bar',
    title: 'Find the least from bar graphs',
    description: 'Use a bar graph to identify the category with the fewest votes.',
    templateId: 'data_graphs.bar.least'
  },
  ...dataGraphsRemediationSkills,
  ...dataGraphsGrade2Skills,
  ...dataGraphsGrade3Skills
];

export const dataGraphsSkillsByGrade = {
  remediation: dataGraphsRemediationSkills,
  1: dataGraphsSkills.filter(s => s.grade === '1'),
  2: dataGraphsGrade2Skills,
  3: dataGraphsGrade3Skills
};

export function getDataGraphsSkill(skillId) {
  return dataGraphsSkills.find((skill) => skill.skillId === skillId || skill.code === skillId) || null;
}
