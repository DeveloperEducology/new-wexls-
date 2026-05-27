import { getInteractiveToolEngine } from './registry.js';

export function normalizeInteractiveToolQuestion(question = {}) {
  const toolId = question.toolId || question.toolConfig?.toolId || 'cube_counter';
  const engine = getInteractiveToolEngine(toolId);
  const baseConfig = {
    ...(question.toolConfig || {}),
    toolId,
  };

  return {
    ...question,
    type: 'interactiveTool',
    toolId,
    toolVersion: question.toolVersion || '1.0.0',
    toolConfig: engine?.normalizeConfig ? engine.normalizeConfig(baseConfig) : baseConfig,
    validation: question.validation || { strategy: 'exact_value' },
  };
}
