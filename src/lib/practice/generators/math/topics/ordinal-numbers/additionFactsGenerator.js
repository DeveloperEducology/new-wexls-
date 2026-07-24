// Seeded random number generator helper
function seededRandom(seed) {
  let h = 5381;
  const s = String(seed || Date.now());
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
  }
  let currentSeed = Math.abs(h);
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

function shuffleArray(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper: Generate number line SVG
function generateNumberLineSVG(start, jumps, endVal) {
  // width of line = 540
  // starts at 30, ends at 570
  const ticksCount = 20; // tick marks up to 20
  const tickSpacing = 540 / ticksCount;
  
  let ticks = '';
  for (let i = 0; i <= ticksCount; i++) {
    const x = 30 + i * tickSpacing;
    ticks += `
      <line x1="${x}" y1="50" x2="${x}" y2="60" stroke="#64748b" stroke-width="2"/>
      <text x="${x}" y="78" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569" text-anchor="middle">${i}</text>
    `;
  }

  // Draw jump arcs
  let arcs = '';
  const xStart = 30 + start * tickSpacing;
  const xMid = 30 + (start + jumps) * tickSpacing;

  // Arc 1: Start to first addend
  if (start > 0) {
    const cpX = 30 + (start / 2) * tickSpacing;
    arcs += `
      <path d="M 30 50 Q ${cpX} 15 ${xStart} 50" fill="none" stroke="#6366f1" stroke-width="3" stroke-dasharray="4 2"/>
      <polygon points="${xStart},50 ${xStart-6},44 ${xStart-2},48" fill="#6366f1"/>
    `;
  }

  // Arc 2: Jumps
  const cpX2 = xStart + (jumps * tickSpacing) / 2;
  arcs += `
    <path d="M ${xStart} 50 Q ${cpX2} 10 ${xMid} 50" fill="none" stroke="#f43f5e" stroke-width="4"/>
    <polygon points="${xMid},50 ${xMid-8},42 ${xMid-2},48" fill="#f43f5e"/>
  `;

  return `
    <svg viewBox="0 0 600 100" width="100%" height="100" style="background:#ffffff; border-radius:12px; margin: 12px 0;">
      <!-- Main Line -->
      <line x1="20" y1="55" x2="580" y2="55" stroke="#475569" stroke-width="3"/>
      <!-- Arrows at ends -->
      <polygon points="20,55 28,50 28,60" fill="#475569"/>
      <polygon points="580,55 572,50 572,60" fill="#475569"/>
      ${ticks}
      ${arcs}
    </svg>
  `;
}

// List of word problem templates
const wordProblems = [
  {
    text: "Levi had to do the dishes after work. He washed {a} small plates and {b} large plate{s}. How many plates did he wash in total?",
    unit: "plates"
  },
  {
    text: "Gabby had a birthday party. {a} girl{s} and {b} boy{s} from her class came. How many of Gabby's classmates were at the party?",
    unit: "classmates"
  },
  {
    text: "There are {a} red apple{s} and {b} green apple{s} in the basket. How many apples are there in total?",
    unit: "apples"
  },
  {
    text: "A farmer has {a} white sheep and {b} brown sheep. How many sheep does he have in total?",
    unit: "sheep"
  },
  {
    text: "Tina has {a} blue balloon{s} and {b} yellow balloon{s}. How many balloons does she have in total?",
    unit: "balloons"
  }
];

export function generateAdditionFactQuestion(templateDoc, seed) {
  const rng = seededRandom(seed);
  const templateId = templateDoc.id || '';

  // E.1, E.7, E.11: Addition facts (sums up to 10, 18, 20)
  if (templateId === 'addition-facts-10' || templateId === 'addition-facts-18' || templateId === 'addition-facts-20') {
    const maxSum = templateId === 'addition-facts-10' ? 10 : (templateId === 'addition-facts-18' ? 18 : 20);
    const sumVal = Math.floor(rng() * (maxSum - 1)) + 2; // Sum between 2 and maxSum
    const a = Math.floor(rng() * (sumVal + 1));
    const b = sumVal - a;
    const correctAnswerValue = String(sumVal);

    return {
      type: 'fill_blank',
      interaction: 'fill_blank',
      optionsType: 'fillInTheBlank',
      questionText: 'Add.',
      parts: [
        {
          type: 'text',
          content: 'Add.',
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }
        },
        {
          type: 'group',
          direction: 'column',
          style: { width: '100%', alignItems: 'center' },
          parts: [
            {
              type: 'text',
              content: `${a}  +  ${b}  =  [[blank1]]`,
              style: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '24px',
                fontFamily: 'monospace'
              }
            }
          ]
        }
      ],
      answer: { blank1: correctAnswerValue },
      correctAnswer: { blank1: correctAnswerValue },
      correctAnswerText: correctAnswerValue,
      validationRules: [
        { type: 'exact_match', target: 'blank1', value: correctAnswerValue }
      ],
      explanation: {
        sections: [{ type: 'text', content: `Adding the two numbers together: ${a} + ${b} = ${correctAnswerValue}.` }]
      }
    };
  }

  // E.2: Ways to make a number
  if (templateId === 'ways-make-number-addition') {
    const targetSum = Math.floor(rng() * 6) + 4; // Target sum between 4 and 9
    const missingIndex = Math.floor(rng() * (targetSum + 1)); // Missing equation index

    const equations = [];
    for (let i = 0; i <= targetSum; i++) {
      if (i === missingIndex) {
        equations.push('[[blank1]]');
      } else {
        equations.push(`${i} + ${targetSum - i} = ${targetSum}`);
      }
    }

    const correctAnswerValue = `${missingIndex} + ${targetSum - missingIndex} = ${targetSum}`;
    const cleanedCorrectAnswer = correctAnswerValue.replace(/\s+/g, '');
    const headerPrompt = `Here are the ways to make ${targetSum}. Find the pattern and type the missing addition number sentence.`;

    return {
      type: 'fill_blank',
      interaction: 'fill_blank',
      optionsType: 'fillInTheBlank',
      questionText: headerPrompt,
      parts: [
        {
          type: 'text',
          content: headerPrompt,
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }
        },
        {
          type: 'group',
          direction: 'column',
          style: {
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            marginBottom: '24px',
            width: 'fit-content',
            margin: '0 auto',
            fontFamily: 'monospace',
            fontSize: '24px',
            lineHeight: '2',
            alignItems: 'center'
          },
          parts: equations.map((eq, idx) => {
            if (idx === missingIndex) {
              return { type: 'text', content: '[[blank1]]' };
            }
            return { type: 'text', content: eq };
          })
        }
      ],
      answer: { blank1: correctAnswerValue },
      correctAnswer: { blank1: correctAnswerValue },
      correctAnswerText: correctAnswerValue,
      validationRules: [
        {
          type: 'custom',
          validator: `
            const val = String(userAnswer.blank1 || '').replace(/\\s+/g, '');
            return val === "${cleanedCorrectAnswer}";
          `
        }
      ],
      explanation: {
        sections: [{ type: 'text', content: `Following the pattern, the missing equation is: ${correctAnswerValue}.` }]
      }
    };
  }

  // E.3, E.12: Make a number using addition (sums up to 10, 20)
  if (templateId === 'make-number-addition-10' || templateId === 'make-number-addition-20') {
    const maxSum = templateId === 'make-number-addition-10' ? 10 : 20;
    const targetSum = Math.floor(rng() * (maxSum - 3)) + 4; // Target sum between 4 and maxSum
    
    // Correct pair
    const a = Math.floor(rng() * (targetSum - 1)) + 1;
    const b = targetSum - a;
    const correctExpr = `${a} + ${b}`;

    // Create 3 distractor expressions
    const distractors = new Set();
    while (distractors.size < 3) {
      const offset = (Math.floor(rng() * 5) - 2) || 1; // offset between -2 and +2 (not 0)
      const dSum = targetSum + offset;
      if (dSum > 0 && dSum <= maxSum && dSum !== targetSum) {
        const da = Math.floor(rng() * (dSum - 1)) + 1;
        const db = dSum - da;
        distractors.add(`${da} + ${db}`);
      }
    }

    const optionsList = shuffleArray([
      { label: correctExpr, isCorrect: true },
      ...Array.from(distractors).map(d => ({ label: d, isCorrect: false }))
    ], rng);

    return {
      type: 'mcq',
      interaction: 'mcq',
      questionText: `How do you make ${targetSum}?`,
      parts: [
        {
          type: 'text',
          content: `How do you make ${targetSum}?`,
          style: { fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }
        }
      ],
      options: optionsList.map(o => ({
        id: o.label,
        label: o.label,
        isCorrect: o.isCorrect
      })),
      correctAnswerIndex: optionsList.findIndex(o => o.isCorrect),
      answer: correctExpr,
      correctAnswer: correctExpr,
      correctAnswerText: correctExpr,
      explanation: {
        sections: [{ type: 'text', content: `${a} + ${b} equals ${targetSum}.` }]
      }
    };
  }

  // E.4: Complete the addition sentence
  if (templateId === 'complete-addition-sentence-10') {
    const targetSum = Math.floor(rng() * 8) + 3; // sum between 3 and 10
    const a = Math.floor(rng() * (targetSum - 1)) + 1;
    const b = targetSum - a;
    
    // Randomly choose which addend is missing (first or second)
    const isFirstMissing = rng() > 0.5;
    const equationText = isFirstMissing ? `[[blank1]]  +  ${b}  =  ${targetSum}` : `${a}  +  [[blank1]]  =  ${targetSum}`;
    const correctAnswerValue = String(isFirstMissing ? a : b);

    return {
      type: 'fill_blank',
      interaction: 'fill_blank',
      optionsType: 'fillInTheBlank',
      questionText: 'Complete the addition sentence.',
      parts: [
        {
          type: 'text',
          content: 'Complete the addition sentence.',
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }
        },
        {
          type: 'group',
          direction: 'column',
          style: { width: '100%', alignItems: 'center' },
          parts: [
            {
              type: 'text',
              content: equationText,
              style: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '24px',
                fontFamily: 'monospace'
              }
            }
          ]
        }
      ],
      answer: { blank1: correctAnswerValue },
      correctAnswer: { blank1: correctAnswerValue },
      correctAnswerText: correctAnswerValue,
      validationRules: [
        { type: 'exact_match', target: 'blank1', value: correctAnswerValue }
      ],
      explanation: {
        sections: [{ type: 'text', content: `Adding the numbers: ${a} + ${b} = ${targetSum}.` }]
      }
    };
  }

  // E.5, E.9: Addition word problems (sums up to 10, 18)
  if (templateId === 'addition-word-problems-10' || templateId === 'addition-word-problems-18') {
    const maxSum = templateId === 'addition-word-problems-10' ? 10 : 18;
    const sumVal = Math.floor(rng() * (maxSum - 2)) + 3; // sum between 3 and maxSum
    const a = Math.floor(rng() * (sumVal - 1)) + 1;
    const b = sumVal - a;

    // Pick random problem template
    const problem = wordProblems[Math.floor(rng() * wordProblems.length)];
    const questionText = problem.text
      .replace('{a}', String(a))
      .replace('{b}', String(b))
      .replace('{s}', b > 1 ? 's' : '')
      .replace('{s}', a > 1 ? 's' : ''); // handles plural double occurrences if any

    const correctAns = String(sumVal);

    // Distractors
    const distractors = new Set();
    while (distractors.size < 3) {
      const dist = sumVal + (Math.floor(rng() * 5) - 2);
      if (dist > 0 && dist !== sumVal) {
        distractors.add(String(dist));
      }
    }

    const optionsList = shuffleArray([
      { label: correctAns, isCorrect: true },
      ...Array.from(distractors).map(d => ({ label: d, isCorrect: false }))
    ], rng);

    return {
      type: 'mcq',
      interaction: 'mcq',
      questionText,
      parts: [
        {
          type: 'text',
          content: questionText,
          style: { fontSize: '18px', fontWeight: '500', color: '#1e293b', lineHeight: '1.6', marginBottom: '24px' }
        }
      ],
      options: optionsList.map(o => ({
        id: o.label,
        label: o.label,
        isCorrect: o.isCorrect
      })),
      correctAnswerIndex: optionsList.findIndex(o => o.isCorrect),
      answer: correctAns,
      correctAnswer: correctAns,
      correctAnswerText: correctAns,
      explanation: {
        sections: [{ type: 'text', content: `To find the total, add ${a} and ${b}: ${a} + ${b} = ${correctAns}.` }]
      }
    };
  }

  // E.6, E.10, E.13: Addition sentences for word problems (sums up to 10, 18, 20)
  if (templateId === 'addition-sentences-word-problems-10' || templateId === 'addition-sentences-word-problems-18' || templateId === 'addition-sentences-word-problems-20') {
    const maxSum = templateId === 'addition-sentences-word-problems-10' ? 10 : (templateId === 'addition-sentences-word-problems-18' ? 18 : 20);
    const sumVal = Math.floor(rng() * (maxSum - 2)) + 3;
    const a = Math.floor(rng() * (sumVal - 1)) + 1;
    const b = sumVal - a;

    const problem = wordProblems[Math.floor(rng() * wordProblems.length)];
    const questionText = problem.text
      .replace('{a}', String(a))
      .replace('{b}', String(b))
      .replace('{s}', b > 1 ? 's' : '')
      .replace('{s}', a > 1 ? 's' : '');

    const correctSentence = `${a} + ${b} = ${sumVal}`;
    const optionsList = shuffleArray([
      { label: String(a) },
      { label: String(b) },
      { label: String(sumVal) },
      { label: '+' },
      { label: '-' },
      { label: '=' }
    ], rng);

    return {
      type: 'sentence_ordering',
      interaction: 'sentence_ordering',
      copyMode: true,
      questionText: 'Put the numbers and symbols in order to match the word problem.',
      parts: [
        {
          type: 'text',
          content: questionText,
          style: { fontSize: '18px', fontWeight: '500', color: '#1e293b', lineHeight: '1.6', marginBottom: '16px' }
        }
      ],
      options: optionsList.map((o, idx) => ({
        id: `opt_${idx}`,
        label: o.label
      })),
      answer: correctSentence,
      correctAnswer: correctSentence,
      correctAnswerText: correctSentence,
      explanation: {
        sections: [{ type: 'text', content: `The word problem shows ${a} objects and ${b} objects are combined to make ${sumVal} in total, which is written as: ${correctSentence}.` }]
      }
    };
  }

  // E.8: Addition sentences using number lines - sums up to 18
  if (templateId === 'addition-sentences-numlines-18') {
    const sumVal = Math.floor(rng() * 12) + 6; // sum between 6 and 18
    const a = Math.floor(rng() * (sumVal - 3)) + 2; // first start val
    const b = sumVal - a; // jumps

    const correctSentence = `${a} + ${b} = ${sumVal}`;
    const numberLineSvg = generateNumberLineSVG(a, b, sumVal);

    return {
      type: 'fill_blank',
      interaction: 'fill_blank',
      optionsType: 'fillInTheBlank',
      questionText: 'Complete the addition sentence that matches the number line.',
      parts: [
        {
          type: 'text',
          content: 'Complete the addition sentence that matches the number line.',
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }
        },
        {
          type: 'svg',
          content: numberLineSvg,
          style: { marginBottom: '24px', width: '100%' }
        },
        {
          type: 'group',
          direction: 'column',
          style: { width: '100%', alignItems: 'center' },
          parts: [
            {
              type: 'text',
              content: `${a}  +  [[blank1]]  =  ${sumVal}`,
              style: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '24px',
                fontFamily: 'monospace'
              }
            }
          ]
        }
      ],
      answer: { blank1: String(b) },
      correctAnswer: { blank1: String(b) },
      correctAnswerText: String(b),
      validationRules: [
        { type: 'exact_match', target: 'blank1', value: String(b) }
      ],
      explanation: {
        sections: [{ type: 'text', content: `The number line starts with a jump to ${a}, then takes ${b} steps forward to land on ${sumVal}. So the sentence is: ${correctSentence}.` }]
      }
    };
  }

  // E.14: Related addition facts
  if (templateId === 'related-addition-facts') {
    const a = Math.floor(rng() * 8) + 2;
    const b = Math.floor(rng() * 8) + 2;
    const sumVal = a + b;

    return {
      type: 'fill_blank',
      interaction: 'fill_blank',
      optionsType: 'fillInTheBlank',
      questionText: `If ${a} + ${b} = ${sumVal}, then what is ${b} + ${a}?`,
      parts: [
        {
          type: 'text',
          content: `If ${a} + ${b} = ${sumVal}, then what is ${b} + ${a}?`,
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }
        },
        {
          type: 'group',
          direction: 'column',
          style: { width: '100%', alignItems: 'center' },
          parts: [
            {
              type: 'text',
              content: `${b}  +  ${a}  =  [[blank1]]`,
              style: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '24px',
                fontFamily: 'monospace'
              }
            }
          ]
        }
      ],
      answer: { blank1: String(sumVal) },
      correctAnswer: { blank1: String(sumVal) },
      correctAnswerText: String(sumVal),
      validationRules: [
        { type: 'exact_match', target: 'blank1', value: String(sumVal) }
      ],
      explanation: {
        sections: [{ type: 'text', content: `Adding numbers in any order gives the same result (commutativity): ${b} + ${a} = ${sumVal}.` }]
      }
    };
  }

  // E.15: Addition sentences: true or false?
  if (templateId === 'addition-sentences-true-false') {
    const a = Math.floor(rng() * 9) + 2;
    const b = Math.floor(rng() * 9) + 2;
    const actualSum = a + b;
    
    const isTrue = rng() > 0.5;
    const displaySum = isTrue ? actualSum : actualSum + (rng() > 0.5 ? 1 : -1);

    const questionText = 'Is this addition sentence true or false?';

    const optionsList = [
      { label: 'true', isCorrect: isTrue },
      { label: 'false', isCorrect: !isTrue }
    ];

    return {
      type: 'mcq',
      interaction: 'mcq',
      questionText,
      parts: [
        {
          type: 'text',
          content: 'Is this addition sentence true or false?',
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }
        },
        {
          type: 'text',
          content: `${a}  +  ${b}  =  ${displaySum}`,
          style: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#0f172a',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'center',
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            marginBottom: '24px',
            fontFamily: 'monospace'
          }
        }
      ],
      options: optionsList.map(o => ({
        id: o.label,
        label: o.label,
        isCorrect: o.isCorrect
      })),
      correctAnswerIndex: optionsList.findIndex(o => o.isCorrect),
      answer: isTrue ? 'true' : 'false',
      correctAnswer: isTrue ? 'true' : 'false',
      correctAnswerText: isTrue ? 'true' : 'false',
      explanation: {
        sections: [{ type: 'text', content: `${a} + ${b} equals ${actualSum}. So the statement is ${isTrue ? 'true' : 'false'}.` }]
      }
    };
  }

  // E.16, E.17: Add a 1-digit number to a 2-digit number (without/with regrouping)
  if (templateId === 'add-1digit-2digit-noregroup' || templateId === 'add-1digit-2digit-regroup') {
    const isRegroup = templateId === 'add-1digit-2digit-regroup';
    
    let a, b;
    if (isRegroup) {
      // Regrouping: ones digit sum >= 10
      const tens = Math.floor(rng() * 8) + 1; // 1 to 8
      const onesA = Math.floor(rng() * 6) + 4; // 4 to 9
      const onesB = Math.floor(rng() * (10 - (10 - onesA))) + (10 - onesA); // chosen so onesA + onesB >= 10
      a = tens * 10 + onesA;
      b = onesB;
    } else {
      // Without regrouping: ones digit sum < 10
      const tens = Math.floor(rng() * 8) + 1; // 1 to 8
      const onesA = Math.floor(rng() * 7); // 0 to 6
      const onesB = Math.floor(rng() * (9 - onesA)) + 1; // chosen so onesA + onesB < 10
      a = tens * 10 + onesA;
      b = onesB;
    }

    const correctAnswerValue = String(a + b);

    return {
      type: 'fill_blank',
      interaction: 'fill_blank',
      optionsType: 'fillInTheBlank',
      questionText: 'Add.',
      parts: [
        {
          type: 'text',
          content: 'Add.',
          style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '20px' }
        },
        {
          type: 'group',
          direction: 'column',
          style: { width: '100%', alignItems: 'center' },
          parts: [
            {
              type: 'text',
              content: `${a}  +  ${b}  =  [[blank1]]`,
              style: {
                fontSize: '32px',
                fontWeight: '700',
                color: '#0f172a',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '24px',
                fontFamily: 'monospace'
              }
            }
          ]
        }
      ],
      answer: { blank1: correctAnswerValue },
      correctAnswer: { blank1: correctAnswerValue },
      correctAnswerText: correctAnswerValue,
      validationRules: [
        { type: 'exact_match', target: 'blank1', value: correctAnswerValue }
      ],
      explanation: {
        sections: [{ type: 'text', content: `Adding the numbers: ${a} + ${b} = ${correctAnswerValue}.` }]
      }
    };
  }

  // Fallback
  return {
    type: 'fill_blank',
    interaction: 'fill_blank',
    optionsType: 'fillInTheBlank',
    questionText: `1 + 1 = [[blank1]]`,
    parts: [{ type: 'text', content: '1 + 1 = [[blank1]]' }],
    answer: { blank1: '2' },
    correctAnswer: { blank1: '2' },
    correctAnswerText: '2',
    validationRules: [{ type: 'exact_match', target: 'blank1', value: '2' }]
  };
}
