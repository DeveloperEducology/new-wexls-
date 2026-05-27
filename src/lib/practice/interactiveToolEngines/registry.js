import { cubeCounterEngine } from './engines/cubeCounter.engine.js';

export const interactiveToolEngines = {
  cube_counter: cubeCounterEngine,
};

export function getInteractiveToolEngine(toolId) {
  return interactiveToolEngines[toolId] || null;
}
