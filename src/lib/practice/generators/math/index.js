import { additionTopicGenerators } from './topics';
import { timeRegistry } from './topics/time/registry.js';
import { fractionsV2Generators } from './topics/fractions/index.js';
import { placeValueRegistry } from './topics/place-values/registry.js';

export const mathGenerators = {
  ...additionTopicGenerators,
  ...timeRegistry,
  ...fractionsV2Generators,
  ...placeValueRegistry,
};
