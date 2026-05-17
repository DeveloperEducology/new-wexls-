
import { buildPlaceValueSvg } from './shared/svgBlocks.js';
import { getPlaceValueTheory } from './shared/theory.js';

/**
 * Seeded Random Utility
 */
class SeededRandom {
    constructor(seed) {
        this.seed = typeof seed === 'number' ? seed : parseInt(seed) || Date.now();
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    pick(arr) {
        return arr[this.int(0, arr.length - 1)];
    }
}

/**
 * Place Values Engine
 */
export const generatePlaceValueQuestion = (config = {}) => {
    const seed = config.variables?.seed || Date.now().toString();
    const rng = new SeededRandom(seed);
    const difficulty = config.difficulty || 'easy';
    const engineParams = config.engineParams || {};
    const forcedTask = engineParams.forcedTask || null;

    const allTasks = {
        'identify_from_blocks': generateEasyQuestion,
        'build_number': generateEasyQuestion,
        'place_name': generateEasyQuestion,
        'place_value_scaffold': generateEasyQuestion,
        'breakdown_table': (rng) => {
            if (difficulty === 'hard') return generateBreakdownTableQuestion(rng, 'hard');
            if (difficulty === 'medium') return generateBreakdownTableQuestion(rng, 'medium');
            return generateBreakdownTableQuestion(rng, 'easy');
        },
        'identify_from_blocks_3d': generateMediumQuestion,
        'expanded_form': generateMediumQuestion,
        'value_of_digit': generateMediumQuestion,
        'digit_word_combination': generateMediumQuestion,
        'underlined_digit': generateMediumQuestion,
        'missing_number': (rng) => {
            if (difficulty === 'hard') return generateMissingNumberQuestion(rng, 'hard');
            return generateMissingNumberQuestion(rng, 'medium');
        },
        'thousands_blocks': generateHardQuestion,
        'word_to_number': generateHardQuestion,
        'digit_relationship': generateHardQuestion,
        'digit_word_combination_hard': generateHardQuestion
    };

    if (forcedTask && allTasks[forcedTask]) {
        return allTasks[forcedTask](rng, forcedTask);
    }

    if (difficulty === 'easy') return generateEasyQuestion(rng, forcedTask);
    if (difficulty === 'medium') return generateMediumQuestion(rng, forcedTask);
    if (difficulty === 'hard') return generateHardQuestion(rng, forcedTask);

    return generateEasyQuestion(rng, forcedTask);
};

const generateEasyQuestion = (rng, forcedTask) => {
    const tasks = ['identify_from_blocks', 'build_number', 'place_name', 'place_value_scaffold', 'breakdown_table'];
    const task = forcedTask || rng.pick(tasks);

    if (task === 'identify_from_blocks') {
        const tens = rng.int(1, 9);
        const ones = rng.int(1, 9);
        const number = tens * 10 + ones;
        const svg = buildPlaceValueSvg({ tens, ones });

        return {
            type: 'fillInTheBlank',
            level: 'easy',
            questionText: `What number is shown by these base-ten blocks? [blank:ans]`,
            parts: [{ type: 'svg', content: svg }],
            correctAnswer: number.toString(),
            explanation: {
                sections: [
                    { content: `**Step 1: Count the rods (tens).** There are **${tens}** rods. Each rod is 10, so ${tens} × 10 = **${tens * 10}**.` },
                    { content: `**Step 2: Count the units (ones).** There are **${ones}** small cubes.` },
                    { content: `**Step 3: Add them together.** ${tens * 10} + ${ones} = **${number}**.` }
                ]
            },
            remediation: `Remember: A long rod represents **10** and a small cube represents **1**.`,
            metadata: { tens, ones, number, task }
        };
    }

    if (task === 'build_number') {
        const tens = rng.int(1, 9);
        const ones = rng.int(1, 9);
        const number = tens * 10 + ones;

        return {
            type: 'mcq',
            level: 'easy',
            questionText: `Which number has **${tens} tens** and **${ones} ones**?`,
            options: shuffle([number.toString(), (ones * 10 + tens).toString(), (tens + ones).toString(), (number + 10).toString()], rng),
            correctAnswerIndex: -1, // Will be set below
            get correctAnswerIndex() { return this.options.indexOf(number.toString()) },
            explanation: {
                sections: [
                    { content: `**${tens} tens** is the same as **${tens * 10}**.` },
                    { content: `**${ones} ones** is simply **${ones}**.` },
                    { content: `Adding them gives: **${tens * 10} + ${ones} = ${number}**.` }
                ]
            },
            metadata: { tens, ones, number, task }
        };
    }

    if (task === 'place_value_scaffold') {
        return generateScaffoldQuestion(rng);
    }

    if (task === 'breakdown_table') {
        return generateBreakdownTableQuestion(rng, 'easy');
    }

    // Default: place_name
    const number = rng.int(10, 99);
    const theory = getPlaceValueTheory(number);
    const digitToAsk = rng.pick(theory.breakdown);

    return {
        type: 'mcq',
        level: 'easy',
        questionText: `In the number **${number}**, what is the place value of the digit **${digitToAsk.digit}**?`,
        options: ['ones', 'tens', 'hundreds'],
        correctAnswerIndex: ['ones', 'tens', 'hundreds'].indexOf(digitToAsk.place),
        explanation: {
            sections: [
                { content: `The digit **${digitToAsk.digit}** is in the **${digitToAsk.place}** position.` },
                { content: `In a 2-digit number, the first digit is tens and the second is ones.` }
            ]
        },
        metadata: { number, digitToAsk, task }
    };
};

const generateMediumQuestion = (rng, forcedTask) => {
    const tasks = ['identify_from_blocks_3d', 'expanded_form', 'value_of_digit', 'digit_word_combination', 'underlined_digit', 'missing_number', 'breakdown_table'];
    const task = forcedTask || rng.pick(tasks);

    if (task === 'identify_from_blocks_3d') {
        const hundreds = rng.int(1, 5);
        const tens = rng.int(0, 9);
        const ones = rng.int(0, 9);
        const number = hundreds * 100 + tens * 10 + ones;
        const svg = buildPlaceValueSvg({ hundreds, tens, ones });

        return {
            type: 'fillInTheBlank',
            level: 'medium',
            questionText: `Write the number shown by these blocks: [blank:ans]`,
            parts: [{ type: 'svg', content: svg }],
            correctAnswer: number.toString(),
            explanation: {
                sections: [
                    { content: `**Count the flats (100s):** ${hundreds} flats = **${hundreds * 100}**.` },
                    { content: `**Count the rods (10s):** ${tens} rods = **${tens * 10}**.` },
                    { content: `**Count the units (1s):** ${ones} units = **${ones}**.` },
                    { content: `**Total:** ${hundreds * 100} + ${tens * 10} + ${ones} = **${number}**.` }
                ]
            },
            metadata: { hundreds, tens, ones, number, task }
        };
    }

    if (task === 'expanded_form') {
        const number = rng.int(100, 999);
        const theory = getPlaceValueTheory(number);
        
        return {
            type: 'fillInTheBlank',
            level: 'medium',
            questionText: `Write **${number}** in expanded form: [blank:ans]`,
            correctAnswer: theory.expandedForm,
            placeholder: "e.g., 300 + 40 + 2",
            explanation: {
                sections: [
                    { content: `Expanded form shows the **value** of each digit added together.` },
                    { content: `${theory.breakdown.map(b => `${b.digit} in the ${b.place} place is **${b.value}**`).join('\n')}` },
                    { content: `Combining them: **${theory.expandedForm}**.` }
                ]
            },
            metadata: { number, expandedForm: theory.expandedForm, task }
        };
    }

    if (task === 'digit_word_combination') {
        return generateDigitWordCombinationQuestion(rng, 'medium');
    }

    if (task === 'underlined_digit') {
        return generateUnderlinedDigitQuestion(rng);
    }

    if (task === 'missing_number') {
        return generateMissingNumberQuestion(rng, 'medium');
    }

    if (task === 'breakdown_table') {
        return generateBreakdownTableQuestion(rng, 'medium');
    }

    // Default: value_of_digit
    const number = rng.int(100, 999);
    const theory = getPlaceValueTheory(number);
    const digitToAsk = rng.pick(theory.breakdown);

    return {
        type: 'mcq',
        level: 'medium',
        questionText: `What is the **value** of the digit **${digitToAsk.digit}** in the number **${number}**?`,
        options: shuffle([digitToAsk.value.toString(), digitToAsk.digit.toString(), (digitToAsk.digit * 10).toString(), (digitToAsk.digit * 100).toString()], rng).filter((v, i, a) => a.indexOf(v) === i),
        correctAnswerIndex: -1, // Set below
        get correctAnswerIndex() { return this.options.indexOf(digitToAsk.value.toString()) },
        explanation: {
            sections: [
                { content: `The digit **${digitToAsk.digit}** is in the **${digitToAsk.place}** place.` },
                { content: `Its value is **${digitToAsk.digit} × ${digitToAsk.value / digitToAsk.digit} = ${digitToAsk.value}**.` }
            ]
        },
        metadata: { number, digitToAsk, task }
    };
};

const generateHardQuestion = (rng, forcedTask) => {
    const tasks = ['thousands_blocks', 'word_to_number', 'digit_relationship', 'digit_word_combination_hard', 'missing_number', 'breakdown_table'];
    const task = forcedTask || rng.pick(tasks);

    if (task === 'thousands_blocks') {
        const thousands = rng.int(1, 3);
        const hundreds = rng.int(0, 5);
        const tens = rng.int(0, 9);
        const ones = rng.int(0, 9);
        const number = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
        const svg = buildPlaceValueSvg({ thousands, hundreds, tens, ones });

        return {
            type: 'fillInTheBlank',
            level: 'hard',
            questionText: `What number do these blocks represent? [blank:ans]`,
            parts: [{ type: 'svg', content: svg }],
            correctAnswer: number.toString(),
            explanation: {
                sections: [
                    { content: `The large 3D cubes represent **thousands**.` },
                    { content: `${thousands} thousands + ${hundreds} hundreds + ${tens} tens + ${ones} ones = **${number}**.` }
                ]
            },
            metadata: { thousands, hundreds, tens, ones, number, task }
        };
    }

    if (task === 'word_to_number') {
        const number = rng.int(1000, 9999);
        const theory = getPlaceValueTheory(number);

        return {
            type: 'fillInTheBlank',
            level: 'hard',
            questionText: `Write the number for: **${theory.wordForm}** [blank:ans]`,
            correctAnswer: number.toString(),
            explanation: {
                sections: [
                    { content: `Break it down: **${theory.wordForm}**` },
                    { content: `Combine the values into standard form: **${number}**.` }
                ]
            },
            metadata: { number, wordForm: theory.wordForm, task }
        };
    }

    if (task === 'digit_word_combination_hard') {
        return generateDigitWordCombinationQuestion(rng, 'hard');
    }

    if (task === 'missing_number') {
        return generateMissingNumberQuestion(rng, 'hard');
    }

    if (task === 'breakdown_table') {
        return generateBreakdownTableQuestion(rng, 'hard');
    }

    // Default: digit_relationship (Advanced: 10x relationship)
    const digit = rng.int(1, 9);
    const pos1 = rng.int(0, 2); // 0=ones, 1=tens, 2=hundreds
    const pos2 = pos1 + 1;
    const places = ['ones', 'tens', 'hundreds', 'thousands'];
    
    return {
        type: 'mcq',
        level: 'hard',
        questionText: `The value of **${digit}** in the **${places[pos2]}** place is how many times the value of **${digit}** in the **${places[pos1]}** place?`,
        options: ['10', '100', '1/10', '1'],
        correctAnswerIndex: 0,
        explanation: {
            sections: [
                { content: `In our base-ten system, each place value is exactly **10 times** larger than the place to its right.` },
                { content: `Since **${places[pos2]}** is one step to the left of **${places[pos1]}**, its value is **10 times** greater.` }
            ]
        },
        metadata: { digit, pos1, pos2, task }
    };
};

export const generateScaffoldQuestion = (rng, forcedNumber = null) => {
    let number = forcedNumber;
    
    if (!number) {
        // Generate a 4-digit number with unique digits
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle and take first 4
        for (let i = digits.length - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [digits[i], digits[j]] = [digits[j], digits[i]];
        }
        number = digits[0] * 1000 + digits[1] * 100 + digits[2] * 10 + digits[3];
    }

    const theory = getPlaceValueTheory(number);
    const breakdown = theory.breakdown; 
    
    // Pick a target digit (prefer non-duplicate digits for clarity if possible)
    const uniqueDigits = breakdown.filter((b, i, a) => a.findIndex(t => t.digit === b.digit) === i);
    const targetDigitObj = rng.pick(uniqueDigits.length > 0 ? uniqueDigits : breakdown);
    const targetDigit = targetDigitObj.digit;
    const targetPlace = targetDigitObj.place;
    
    const numberFormatted = number.toLocaleString();
    
    const d1 = Math.floor(number % 10);
    const d2 = Math.floor((number / 10) % 10);
    const d3 = Math.floor((number / 100) % 10);
    const d4 = Math.floor((number / 1000) % 10);
    
    const tableHeader = "| Thousands (Th) | Hundreds (H) | Tens (T) | Ones (O) |";
    const tableDivider = "| :---: | :---: | :---: | :---: |";
    const tableRow = `| ${d4} | ${d3} | ${d2} | ${d1} |`;
    const markdownTable = `${tableHeader}\n${tableDivider}\n${tableRow}`;

    const places = ['thousands', 'hundreds', 'tens', 'ones'];
    const options = ['Thousands', 'Hundreds', 'Tens', 'Ones'];

    return {
        type: 'mcq',
        level: 'easy',
        questionText: `Let's review the number **${numberFormatted}** place-by-place.`,
        parts: [
            { type: 'text', content: markdownTable },
            { type: 'text', content: `Looking at the chart above, what is the **place value name** for the digit **${targetDigit}**?` }
        ],
        options: options,
        correctAnswerIndex: places.indexOf(targetPlace.toLowerCase()),
        explanation: {
            sections: [
                { content: `Look at the column where the digit **${targetDigit}** is located.` },
                { content: `It is in the **${targetPlace}** column.` }
            ]
        },
        metadata: { number, targetDigit, targetPlace, task: 'place_value_scaffold' }
    };
};

const generateDigitWordCombinationQuestion = (rng, level = 'medium') => {
    let thousands = 0, hundreds = 0, tens = 0, ones = 0;
    
    if (level === 'hard') {
        // Hard version: often has zeros/missing places
        thousands = rng.int(1, 9);
        const missingPlace = rng.pick(['hundreds', 'tens', 'ones']);
        hundreds = missingPlace === 'hundreds' ? 0 : rng.int(1, 9);
        tens = missingPlace === 'tens' ? 0 : rng.int(1, 9);
        ones = missingPlace === 'ones' ? 0 : rng.int(1, 9);
    } else {
        // Medium version: usually thousands and hundreds or tens
        thousands = rng.int(1, 9);
        hundreds = rng.int(1, 9);
        tens = rng.pick([0, rng.int(1, 9)]);
        ones = 0;
    }

    const number = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
    
    // Build the "You hear" string
    let parts = [];
    if (thousands > 0) parts.push(`**${thousands} thousand**`);
    if (hundreds > 0) parts.push(`**${hundreds} hundred**`);
    if (tens > 0) parts.push(`**${tens} tens**`);
    if (ones > 0) parts.push(`**${ones} ones**`);
    
    const combinedString = parts.join(', ');

    return {
        type: 'fillInTheBlank',
        level: level,
        questionText: `How do you write the number using digits?`,
        parts: [
            { type: 'text', content: `Read the following number:` },
            { type: 'text', content: `### ${combinedString}` },
            { type: 'text', content: `How do you write it using digits? [blank:ans]` }
        ],
        correctAnswer: number.toString(),
        explanation: {
            sections: [
                { content: `Break down the spoken parts:` },
                ...parts.map(p => ({ content: `• ${p}` })),
                { content: `Combine them into one number: **${thousands}**,**${hundreds}**${tens}${ones} → **${number}**.` }
            ]
        },
        metadata: { number, thousands, hundreds, tens, ones, task: 'digit_word_combination' }
    };
};

const generateUnderlinedDigitQuestion = (rng) => {
    const number = rng.int(100, 999);
    const theory = getPlaceValueTheory(number);
    const digitToUnderline = rng.pick(theory.breakdown);
    
    const numStr = number.toString();
    const placeIndexFromRight = ['ones', 'tens', 'hundreds', 'thousands'].indexOf(digitToUnderline.place.toLowerCase());
    const indexFromLeft = numStr.length - 1 - placeIndexFromRight;
    
    const underlinedNumber = numStr.split('').map((d, i) => i === indexFromLeft ? `\\underline{${d}}` : d).join('');

    return {
        type: 'fillInTheBlank',
        level: 'medium',
        questionText: `What is the **value** of the underlined digit?`,
        parts: [
            { type: 'text', content: `## $${underlinedNumber}$` },
            { type: 'text', content: `[blank:ans]` }
        ],
        correctAnswer: digitToUnderline.value.toString(),
        explanation: {
            sections: [
                { content: `The underlined digit is **${digitToUnderline.digit}**.` },
                { content: `It is in the **${digitToUnderline.place}** place.` },
                { content: `The value of **${digitToUnderline.digit}** in the ${digitToUnderline.place} place is **${digitToUnderline.value}**.` }
            ]
        },
        metadata: { number, digitToUnderline, task: 'underlined_digit' }
    };
};

const shuffle = (array, rng) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const generateMissingNumberQuestion = (rng, level = 'medium') => {
    const isHard = level === 'hard';
    const d4 = isHard ? rng.int(1, 9) : 0;
    const d3 = rng.int(1, 9);
    const d2 = rng.int(1, 9);
    const d1 = rng.int(1, 9);
    
    const number = d4 * 1000 + d3 * 100 + d2 * 10 + d1;
    const numberFormatted = number.toLocaleString();

    const components = [];
    if (d4 > 0) components.push({ label: 'thousands', value: d4 * 1000, display: (d4 * 1000).toLocaleString() });
    if (d3 > 0) components.push({ label: 'hundreds', value: d3 * 100, display: (d3 * 100).toLocaleString() });
    if (d2 > 0) components.push({ label: 'tens', value: d2 * 10, display: (d2 * 10).toLocaleString() });
    if (d1 > 0) components.push({ label: 'ones', value: d1, display: d1.toString() });

    const targetIdx = rng.int(0, components.length - 1);
    const target = components[targetIdx];

    const beforeParts = components.slice(0, targetIdx).map(c => c.display);
    const afterParts = components.slice(targetIdx + 1).map(c => c.display);

    const expandedBefore = beforeParts.length > 0 ? beforeParts.join(' + ') + ' + ' : '';
    const expandedAfter = afterParts.length > 0 ? ' + ' + afterParts.join(' + ') : '';

    return {
        type: 'fillInTheBlank',
        level: level,
        questionText: "What is the missing number?",
        parts: [
            { type: 'text', content: `## ${expandedBefore}[blank:ans]${expandedAfter} = ${numberFormatted}` }
        ],
        correctAnswer: target.value.toString(),
        explanation: {
            sections: [
                { content: `Write **${numberFormatted}** in expanded form:` },
                { content: `**${components.map(c => c.display).join(' + ')} = ${numberFormatted}**` },
                { content: `Look for which number is missing. **${target.display}** must go in the blank space.` }
            ]
        },
        metadata: { number, targetValue: target.value, task: 'missing_number' }
    };
};

const generateBreakdownTableQuestion = (rng, level = 'easy') => {
    let number = rng.int(1, 9);
    let columns = ['Number', 'Tens', 'Ones'];
    
    if (level === 'medium') {
        number = rng.int(10, 99);
    } else if (level === 'hard') {
        number = rng.int(100, 999);
        columns = ['Number', 'Hundreds', 'Tens', 'Ones'];
    }

    const theory = getPlaceValueTheory(number);
    const breakdown = theory.breakdown; // Array of { digit, place, value }

    // Map places to digits
    const placeMap = {};
    breakdown.forEach(b => {
        placeMap[b.place.toLowerCase()] = b.digit;
    });

    const headerRow = `| ${columns.join(' | ')} |`;
    const dividerRow = `| ${columns.map(() => ':---:').join(' | ')} |`;
    
    const rowValues = columns.map(col => {
        if (col === 'Number') return `**${number}**`;
        const key = col.toLowerCase();
        return `[blank:${key}]`;
    });
    const dataRow = `| ${rowValues.join(' | ')} |`;
    
    const markdownTable = `${headerRow}\n${dividerRow}\n${dataRow}`;

    const correctAnswer = {};
    columns.forEach(col => {
        if (col === 'Number') return;
        const key = col.toLowerCase();
        correctAnswer[key] = (placeMap[key] || 0).toString();
    });

    return {
        type: 'fillInTheBlank',
        level: level,
        questionText: `Break down the number into place values.`,
        parts: [
            { type: 'text', content: markdownTable }
        ],
        correctAnswer,
        explanation: {
            sections: [
                { content: `The number **${number}** breakdown:` },
                ...columns.filter(c => c !== 'Number').map(col => {
                    const key = col.toLowerCase();
                    const val = placeMap[key] || 0;
                    return { content: `• **${col}**: ${val}` };
                })
            ]
        },
        metadata: { number, task: 'breakdown_table' }
    };
};
