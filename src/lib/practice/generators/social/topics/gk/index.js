import { generateGKQuestion } from './engine.js';
import { gkGenerators } from './registry.js';
import { gkTheory } from './theory.js';

export { gkTheory };

export function generateSmartGKQuestion(config = {}) {
    const seed = config.variables?.seed || Date.now().toString();
    const forcedTask = config.forcedTask || 'gk_identify_person_v1';

    const question = generateGKQuestion({
        ...config,
        forcedTask,
        variables: { seed }
    });

    return {
        ...question,
        id: `gk_${seed}`,
        metadata: {
            ...question.metadata,
            task: forcedTask,
            module: 'gk'
        }
    };
}
