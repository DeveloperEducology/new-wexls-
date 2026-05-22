
import { generatePlaceValueQuestion } from './engine.js';
import { generatePlaceValueRemedialQuestion } from './engines/remediation.engine.js';

/**
 * Place Values Orchestrator
 */
export function generateSmartPlaceValueQuestion(config = {}) {
    const history = config.history || { correctStreak: 0, lastResult: 'none' };
    const difficulty = config.difficulty || 'adaptive';
    const seed = config.variables?.seed || Date.now().toString();
    const forcedTask = config.forcedTask || config.engineParams?.forcedTask || null;

    // Check for active remediation loop
    if (history.lastResult === 'incorrect' || (history.remediationActive && history.remediationStep)) {
        const failedMetadata = history.failedMetadata || config.lastQuestionMetadata;
        
        if (failedMetadata) {
            const nextStep = history.remediationStep || 1;
            const remedialQ = generatePlaceValueRemedialQuestion(failedMetadata, nextStep);
            
            if (remedialQ) {
                return {
                    ...remedialQ,
                    id: `pv_rem_${seed}_${nextStep}`,
                    metadata: {
                        ...remedialQ.metadata,
                        remediationActive: true,
                        remediationStep: nextStep,
                        adaptive_level: 'remediation'
                    }
                };
            }
        }
    }

    // Normal Adaptive Flow
    let currentLevel = 'easy';
    if (difficulty === 'adaptive') {
        if (history.correctStreak >= 6) currentLevel = 'hard';
        else if (history.correctStreak >= 3) currentLevel = 'medium';
        else currentLevel = 'easy';
    } else {
        currentLevel = difficulty;
    }

    const question = generatePlaceValueQuestion({
        ...config,
        difficulty: currentLevel,
        forcedTask: forcedTask,
        variables: { seed }
    });

    return {
        ...question,
        id: `pv_${seed}`,
        metadata: {
            ...question.metadata,
            adaptive_level: currentLevel,
            remediationActive: false
        }
    };
}

/**
 * Helper for diagnostic tools to show the template configuration
 */
export function getPlaceValueTemplateConfig(forcedTask) {
    if (!forcedTask) return null;
    return {
        logic_type: forcedTask,
        engine_id: 'math-place-values',
        type: forcedTask.includes('blocks') ? 'fillInTheBlank' : 
              (forcedTask.includes('mcq') || forcedTask.includes('name')) ? 'mcq' : 'fillInTheBlank',
        engineParams: {
            forcedTask: forcedTask
        },
        metadata: {
            category: 'Place Values',
            task: forcedTask
        }
    };
}

export * from './engine.js';
export * from './registry.js';
export * from './shared/theory.js';
export * from './shared/svgBlocks.js';
export * from './shared/visualBuilders.js';
export * from './engines/system.engine.js';
export * from './templates/index.js';
export * from './skills/index.js';
export default generateSmartPlaceValueQuestion;
