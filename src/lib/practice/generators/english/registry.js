import { resolveGrammarGenerator } from './topics/grammar/engine.js';
import { resolveLkgGenerator } from './topics/lkg/engine.js';

export const englishTopicRegistry = {
  grammar: {
    resolveGenerator: resolveGrammarGenerator
  },
  lkg: {
    resolveGenerator: resolveLkgGenerator
  }
};
