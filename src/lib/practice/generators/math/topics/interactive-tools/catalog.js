export const interactiveToolsCatalog = [
  ['interactive-tools-fraction-bar', 'IT.1', 'Fraction bar', 'fraction_bar'],
  ['interactive-tools-number-line', 'IT.2', 'Number line', 'number_line'],
  ['interactive-tools-clock', 'IT.3', 'Clock', 'clock'],
  ['interactive-tools-balance-scale', 'IT.4', 'Balance scale', 'balance_scale'],
  ['interactive-tools-measuring-cup', 'IT.5', 'Measuring cup', 'measuring_cup'],
  ['interactive-tools-thermometer', 'IT.6', 'Thermometer', 'thermometer'],
  ['interactive-tools-base-ten-blocks', 'IT.7', 'Base-ten blocks', 'base_ten_blocks'],
  ['interactive-tools-place-value-chart', 'IT.8', 'Place value chart', 'place_value_chart'],
  ['interactive-tools-diagram-labeling', 'IT.9', 'Diagram labeling', 'diagram_labeling'],
].map(([skillId, code, title, manipulativeType]) => ({
  skillId,
  code,
  title,
  manipulativeType,
  group: 'Interactive tools',
}));

export function getInteractiveToolsSkill(skillId = 'interactive-tools-fraction-bar') {
  return interactiveToolsCatalog.find((skill) => skill.skillId === skillId) || interactiveToolsCatalog[0];
}
