const DATA_GRAPHS_TEMPLATES = {
  'data_graphs.bar.count': {
    templateId: 'data_graphs.bar.count',
    logicType: 'data_graphs.bar.count',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'fillInTheBlank',
    title: 'Count from bar graph'
  },

  'data_graphs.pictograph.read': {
    templateId: 'data_graphs.pictograph.read',
    logicType: 'data_graphs.pictograph.read',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'fillInTheBlank',
    title: 'Read pictograph'
  },

  'data_graphs.picture.count': {
    templateId: 'data_graphs.picture.count',
    logicType: 'data_graphs.picture.count',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'fillInTheBlank',
    title: 'Count picture graph items'
  },

  'data_graphs.bar.least': {
    templateId: 'data_graphs.bar.least',
    logicType: 'data_graphs.bar.least',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Find the least from a bar graph'
  },

  'data_graphs.bar.scaled': {
    templateId: 'data_graphs.bar.scaled',
    logicType: 'data_graphs.bar.scaled',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Scaled bar graph'
  },

  'data_graphs.pictograph.scaled': {
    templateId: 'data_graphs.pictograph.scaled',
    logicType: 'data_graphs.pictograph.scaled',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Scaled pictograph'
  },

  'data_graphs.tally.read': {
    templateId: 'data_graphs.tally.read',
    logicType: 'data_graphs.tally.read',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Read tally chart'
  },

  'data_graphs.line_plot.read': {
    templateId: 'data_graphs.line_plot.read',
    logicType: 'data_graphs.line_plot.read',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Read line plot'
  },

  'data_graphs.remedial.tally': {
    templateId: 'data_graphs.remedial.tally',
    logicType: 'data_graphs.remedial.tally',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Read basic tally marks'
  },

  'data_graphs.remedial.count': {
    templateId: 'data_graphs.remedial.count',
    logicType: 'data_graphs.remedial.count',
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: 'mcq',
    title: 'Count objects for data'
  }
};

export function getDataGraphsTemplate(templateIdOrSkillId) {
  return DATA_GRAPHS_TEMPLATES[templateIdOrSkillId] || {
    templateId: templateIdOrSkillId,
    logicType: templateIdOrSkillId,
    family: 'data_graphs',
    engine: 'data-graphs',
    questionType: String(templateIdOrSkillId).includes('compare') ? 'mcq' : 'fillInTheBlank',
    title: templateIdOrSkillId
  };
}
