export const dataGraphsGrade2Skills = [
  {
    skillId: 'data-graphs-g2-scaled-bar-graph',
    code: 'DG2.1',
    grade: '2',
    topic: 'data-graphs',
    competencyId: 'data_graphs_scaled_bar',
    title: 'Interpret scaled bar graphs',
    description: 'Answer questions using bar graphs with scale increments of 2, 5, or 10.',
    templateId: 'data_graphs.bar.scaled',
    config: { forcedTask: 'data-graphs-g2-scaled-bar-graph' }
  },
  {
    skillId: 'data-graphs-g2-scaled-pictograph',
    code: 'DG2.2',
    grade: '2',
    topic: 'data-graphs',
    competencyId: 'data_graphs_read_pictograph', // reuse key/tally mapping
    title: 'Interpret scaled pictographs',
    description: 'Read pictographs where each picture represents multiple units (key of 2 or 5).',
    templateId: 'data_graphs.pictograph.scaled',
    config: { forcedTask: 'data-graphs-g2-scaled-pictograph' }
  },
  {
    skillId: 'data-graphs-g2-read-tally-chart',
    code: 'DG2.3',
    grade: '2',
    topic: 'data-graphs',
    competencyId: 'data_graphs_tally_chart',
    title: 'Read and interpret tally charts',
    description: 'Read bundles of tally marks representing counts up to 15.',
    templateId: 'data_graphs.tally.read',
    config: { forcedTask: 'data-graphs-g2-read-tally-chart' }
  }
];
