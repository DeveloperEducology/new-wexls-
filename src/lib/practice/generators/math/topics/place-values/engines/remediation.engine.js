
import { getPlaceValueTheory } from '../shared/theory.js';
import { buildPlaceValueSvg } from '../shared/svgBlocks.js';
import { generateScaffoldQuestion } from '../engine.js';

/**
 * Place Values Remediation Logic
 */

export const generatePlaceValueRemedialQuestion = (failedMetadata, step = 1) => {
    const { number, task } = failedMetadata;
    const theory = getPlaceValueTheory(number || 123);
    
    if (step === 1) {
        // Step 1: Visual connection
        const breakdown = theory.breakdown;
        const mainPart = breakdown[0]; // Usually the highest place
        const svg = buildPlaceValueSvg({ [mainPart.place]: mainPart.digit });

        return {
            type: 'mcq',
            isRemedial: true,
            remedialStep: 1,
            questionText: `**Step 1: Visual Recognition** \nEach block has a specific value. Look at these blocks. They represent the **${mainPart.place}** place. \nHow many **${mainPart.place}** are shown?`,
            parts: [{ type: 'svg', content: svg }],
            options: shuffle([mainPart.digit.toString(), (mainPart.digit + 1).toString(), '1', '10'], new SeededRandom(Date.now())),
            correctAnswerIndex: -1, // set below
            get correctAnswerIndex() { return this.options.indexOf(mainPart.digit.toString()) },
            explanation: `There are **${mainPart.digit}** blocks in the **${mainPart.place}** position.`,
            metadata: { ...failedMetadata, nextStep: 2 }
        };
    }

    if (step === 2) {
        // Step 2: Place Name Scaffold (Table)
        const scaffold = generateScaffoldQuestion(new SeededRandom(Date.now()), number);
        
        return {
            ...scaffold,
            isRemedial: true,
            remedialStep: 2,
            questionText: `**Step 2: Place Value Chart** \nLet's organize the digits into a chart to see their places clearly. \n\n${scaffold.questionText.split('place-by-place.')[1] || ''}`,
            metadata: { ...failedMetadata, nextStep: 3 }
        };
    }

    if (step === 3) {
        // Step 3: Expanded form bridge
        return {
            type: 'fillInTheBlank',
            isRemedial: true,
            remedialStep: 3,
            questionText: `**Step 3: Putting it Together** \nCombine the values of all places to write the number **${number}** in expanded form. \n[blank:ans]`,
            correctAnswer: theory.expandedForm,
            explanation: `The expanded form of **${number}** is **${theory.expandedForm}**.`,
            metadata: { ...failedMetadata, nextStep: null }
        };
    }

    return null;
};

// Simple shuffle for remediation
function shuffle(array, rng) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

class SeededRandom {
    constructor(seed) { this.seed = seed; }
    next() { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
}
