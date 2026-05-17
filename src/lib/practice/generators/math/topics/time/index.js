
import { generateTimeQuestion } from './engine.js';

/**
 * Time Orchestrator
 */
export function generateSmartTimeQuestion(config = {}) {
    const forcedTask = config.forcedTask || config.engineParams?.forcedTask || null;
    const history = config.history || { correctStreak: 0, lastResult: 'none' };
    const difficulty = config.difficulty || 'adaptive';
    const seed = config.variables?.seed || Date.now().toString();

    // Check for active remediation loop (placeholder for now)
    if (history.lastResult === 'incorrect' || (history.remediationActive && history.remediationStep)) {
        // In the future, we can add generateTimeRemedialQuestion here
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

    const question = generateTimeQuestion({
        ...config,
        difficulty: currentLevel,
        engineParams: {
            ...config.engineParams,
            forcedTask: forcedTask
        },
        variables: { seed }
    });

    return {
        ...question,
        id: `time_${seed}`,
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
export function getTimeTemplateConfig(forcedTask, question) {
    return {
        logic_type: forcedTask || 'adaptive',
        engine_id: 'math-time',
        task: question?.metadata?.task || forcedTask,
        difficulty: question?.metadata?.adaptive_level || question?.level,
        metadata: question?.metadata || {}
    };
}

export * from './engine.js';
export * from './registry.js';
export * from './theory.js';
export default generateSmartTimeQuestion;
