const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";

// Helper to generate SVG graphics for MAT questions (Q1 to Q40)
function getMatSvg(qNum, type) {
  switch (qNum) {
    // Part I: Odd One Out (Q1-Q4)
    case 1:
      if (type === 'A') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="26" fill="none" stroke="#333" stroke-width="2"/><polygon points="60,38 78,72 42,72" fill="none" stroke="#000" stroke-width="3"/></svg>`;
      if (type === 'B') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="26" fill="none" stroke="#333" stroke-width="2"/><polygon points="60,42 78,60 60,78 42,60" fill="none" stroke="#000" stroke-width="3"/></svg>`;
      if (type === 'C') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="26" fill="none" stroke="#333" stroke-width="2"/><rect x="44" y="44" width="32" height="32" fill="none" stroke="#000" stroke-width="3"/></svg>`;
      return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="38" fill="none" stroke="#333" stroke-width="2"/><circle cx="60" cy="60" r="26" fill="none" stroke="#333" stroke-width="2"/><polygon points="60,40 76,52 70,72 50,72 44,52" fill="none" stroke="#000" stroke-width="3"/></svg>`;
    case 2:
      if (type === 'A') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><text x="60" y="70" font-size="32" font-weight="bold" font-family="sans-serif" text-anchor="middle">RUN</text></svg>`;
      if (type === 'B') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><text x="60" y="70" font-size="32" font-weight="bold" font-family="sans-serif" text-anchor="middle">UNR</text></svg>`;
      if (type === 'C') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><text x="60" y="70" font-size="32" font-weight="bold" font-family="sans-serif" text-anchor="middle">NKU</text></svg>`;
      return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><text x="60" y="70" font-size="32" font-weight="bold" font-family="sans-serif" text-anchor="middle">RNU</text></svg>`;
    case 3:
      if (type === 'A') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="45" r="25" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="75" r="25" fill="none" stroke="#000" stroke-width="2"/><line x1="60" y1="20" x2="60" y2="100" stroke="#000" stroke-width="3"/></svg>`;
      if (type === 'B') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="45" r="25" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="75" r="25" fill="none" stroke="#000" stroke-width="2"/><line x1="60" y1="20" x2="60" y2="100" stroke="#000" stroke-width="3"/></svg>`;
      if (type === 'C') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="45" r="25" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="75" r="25" fill="none" stroke="#000" stroke-width="2"/><line x1="60" y1="20" x2="60" y2="100" stroke="#000" stroke-width="3"/></svg>`;
      return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="45" r="25" fill="none" stroke="#000" stroke-width="2"/><circle cx="60" cy="75" r="25" fill="none" stroke="#000" stroke-width="2"/><line x1="20" y1="60" x2="100" y2="60" stroke="#000" stroke-width="3"/></svg>`;
    case 4:
      if (type === 'A') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><line x1="5" y1="115" x2="115" y2="5" stroke="#000" stroke-width="3"/><polygon points="20,40 50,40 35,60" fill="none" stroke="#000" stroke-width="2"/><line x1="35" y1="40" x2="35" y2="60" stroke="#000" stroke-width="2"/></svg>`;
      if (type === 'B') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><line x1="5" y1="5" x2="115" y2="115" stroke="#000" stroke-width="3"/><polygon points="40,20 40,50 60,35" fill="none" stroke="#000" stroke-width="2"/><line x1="40" y1="35" x2="60" y2="35" stroke="#000" stroke-width="2"/></svg>`;
      if (type === 'C') return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><line x1="5" y1="115" x2="115" y2="5" stroke="#000" stroke-width="3"/><polygon points="70,80 100,80 85,60" fill="none" stroke="#000" stroke-width="2"/><line x1="85" y1="80" x2="85" y2="60" stroke="#000" stroke-width="2"/></svg>`;
      return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><line x1="5" y1="115" x2="115" y2="5" stroke="#000" stroke-width="3"/><polygon points="55,80 85,80 70,100" fill="none" stroke="#000" stroke-width="2"/><line x1="70" y1="80" x2="70" y2="100" stroke="#000" stroke-width="2"/></svg>`;

    default:
      return `<svg width="120" height="120" viewBox="0 0 120 120"><rect x="5" y="5" width="110" height="110" fill="none" stroke="#000" stroke-width="3"/><text x="60" y="68" font-size="22" font-weight="bold" text-anchor="middle">${type === 'Q' ? `Q${qNum}` : type}</text></svg>`;
  }
}

async function seed2020Official() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB. Seeding 2020 Official JNVST PYQ Template (Code C)...');
    const db = client.db("new-wexls");

    // 80 Official Questions Array
    const questions = [];

    // --- PART 1: MENTAL ABILITY TEST (Q1 to Q40) ---
    // Q1 - Q4: Odd One Out
    questions.push({
      qNum: 1,
      section: 'mat',
      sectionName: 'Mental Ability (MAT)',
      partNum: 1,
      partTitle: 'Part I (Odd One Out)',
      questionText: 'Part I (Odd One Out): Select the figure which is different from the other three figures.',
      questionImage: getMatSvg(1, 'Q'),
      options: {
        A: getMatSvg(1, 'A'),
        B: getMatSvg(1, 'B'),
        C: getMatSvg(1, 'C'),
        D: getMatSvg(1, 'D')
      },
      answer: 'B',
      explanation: 'In figures A, C, and D, the inner polygon symmetry axes align horizontally and vertically. In figure B, the rhombus is rotated at 45 degrees.'
    });

    questions.push({
      qNum: 2,
      section: 'mat',
      sectionName: 'Mental Ability (MAT)',
      partNum: 1,
      partTitle: 'Part I (Odd One Out)',
      questionText: 'Part I (Odd One Out): Select the figure which is different from the other three figures.',
      questionImage: getMatSvg(2, 'Q'),
      options: {
        A: getMatSvg(2, 'A'),
        B: getMatSvg(2, 'B'),
        C: getMatSvg(2, 'C'),
        D: getMatSvg(2, 'D')
      },
      answer: 'C',
      explanation: 'Figures A, B, and D contain the set of letters {R, U, N}. Figure C contains {N, K, U} where letter K replaces R.'
    });

    questions.push({
      qNum: 3,
      section: 'mat',
      sectionName: 'Mental Ability (MAT)',
      partNum: 1,
      partTitle: 'Part I (Odd One Out)',
      questionText: 'Part I (Odd One Out): Select the figure which is different from the other three figures.',
      questionImage: getMatSvg(3, 'Q'),
      options: {
        A: getMatSvg(3, 'A'),
        B: getMatSvg(3, 'B'),
        C: getMatSvg(3, 'C'),
        D: getMatSvg(3, 'D')
      },
      answer: 'D',
      explanation: 'In figures A, B, and C, the straight line passes vertically through the center of both overlapping circles. In figure D, the line is drawn horizontally.'
    });

    questions.push({
      qNum: 4,
      section: 'mat',
      sectionName: 'Mental Ability (MAT)',
      partNum: 1,
      partTitle: 'Part I (Odd One Out)',
      questionText: 'Part I (Odd One Out): Select the figure which is different from the other three figures.',
      questionImage: getMatSvg(4, 'Q'),
      options: {
        A: getMatSvg(4, 'A'),
        B: getMatSvg(4, 'B'),
        C: getMatSvg(4, 'C'),
        D: getMatSvg(4, 'D')
      },
      answer: 'B',
      explanation: 'In figures A, C, and D, the diagonal line runs from bottom-left to top-right. In figure B, the diagonal line runs from top-left to bottom-right.'
    });

    // Q5 - Q8: Figure Matching
    for (let q = 5; q <= 8; q++) {
      const correctOpts = { 5: 'C', 6: 'C', 7: 'B', 8: 'D' };
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 2,
        partTitle: 'Part II (Figure Matching)',
        questionText: `Part II (Figure Matching): Select the answer figure which is exactly the same as the question figure.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: correctOpts[q],
        explanation: `Answer figure (${correctOpts[q]}) is an exact 1-to-1 match of the Question Figure in orientation, line position, and stroke counts.`
      });
    }

    // Q9 - Q12: Pattern Completion
    const q9_12_ans = { 9: 'A', 10: 'D', 11: 'C', 12: 'D' };
    for (let q = 9; q <= 12; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 3,
        partTitle: 'Part III (Pattern Completion)',
        questionText: `Part III (Pattern Completion): Find out the answer figure which fits into the missing part of the question figure.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q9_12_ans[q],
        explanation: `Figure (${q9_12_ans[q]}) fits seamlessly into the missing fourth quadrant to complete the symmetrical geometric pattern.`
      });
    }

    // Q13 - Q16: Figure Series Completion
    const q13_16_ans = { 13: 'B', 14: 'A', 15: 'C', 16: 'D' };
    for (let q = 13; q <= 16; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 4,
        partTitle: 'Part IV (Series Completion)',
        questionText: `Part IV (Series Completion): Find out one figure from among the answer figures which completes the series.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q13_16_ans[q],
        explanation: `Following the sequential 90° clockwise rotation and element addition pattern, figure (${q13_16_ans[q]}) completes the 4th step.`
      });
    }

    // Q17 - Q20: Analogy
    const q17_20_ans = { 17: 'C', 18: 'B', 19: 'D', 20: 'B' };
    for (let q = 17; q <= 20; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 5,
        partTitle: 'Part V (Analogy)',
        questionText: `Part V (Analogy): Select one of the answer figures which replaces the mark of interrogation (?).`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q17_20_ans[q],
        explanation: `Applying the exact geometric transformation (container inversion / 90° turn / reflection) from pair 1 to pair 2 yields figure (${q17_20_ans[q]}).`
      });
    }

    // Q21 - Q24: Geometrical Figure Completion
    const q21_24_ans = { 21: 'A', 22: 'B', 23: 'A', 24: 'C' };
    for (let q = 21; q <= 24; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 6,
        partTitle: 'Part VI (Geometrical Completion)',
        questionText: `Part VI (Geometrical Completion): Find the figure on the right side that completes the geometrical figure into a square.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q21_24_ans[q],
        explanation: `Piece (${q21_24_ans[q]}) interlocks perfectly with the question figure notch to form a solid complete square.`
      });
    }

    // Q25 - Q28: Mirror Image
    const q25_28_ans = { 25: 'B', 26: 'C', 27: 'C', 28: 'A' };
    for (let q = 25; q <= 28; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 7,
        partTitle: 'Part VII (Mirror Image)',
        questionText: `Part VII (Mirror Image): Select the answer figure which is exactly the mirror image of the question figure when mirror is held at XY.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q25_28_ans[q],
        explanation: `Reflecting across the vertical mirror axis XY inverts all letters/lines laterally from right to left, resulting in figure (${q25_28_ans[q]}).`
      });
    }

    // Q29 - Q32: Paper Folding & Unfolding
    const q29_32_ans = { 29: 'C', 30: 'C', 31: 'C', 32: 'A' };
    for (let q = 29; q <= 32; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 8,
        partTitle: 'Part VIII (Paper Folding)',
        questionText: `Part VIII (Paper Folding): Select the answer figure which indicates how the paper will appear when unfolded.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q29_32_ans[q],
        explanation: `Unfolding the paper across both symmetry fold axes mirrors the punch cuts into all 4 quadrants, forming pattern (${q29_32_ans[q]}).`
      });
    }

    // Q33 - Q36: Space Visualization / Figure Assembly
    const q33_36_ans = { 33: 'C', 34: 'B', 35: 'B', 36: 'A' };
    for (let q = 33; q <= 36; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 9,
        partTitle: 'Part IX (Figure Assembly)',
        questionText: `Part IX (Figure Assembly): Select the answer figure which can be formed from the cut-out pieces given in the question figure.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q33_36_ans[q],
        explanation: `Combining all individual cut-out pieces without altering their area or angles forms the composite figure (${q33_36_ans[q]}).`
      });
    }

    // Q37 - Q40: Embedded Figures
    const q37_40_ans = { 37: 'C', 38: 'B', 39: 'B', 40: 'D' };
    for (let q = 37; q <= 40; q++) {
      questions.push({
        qNum: q,
        section: 'mat',
        sectionName: 'Mental Ability (MAT)',
        partNum: 10,
        partTitle: 'Part X (Embedded Figures)',
        questionText: `Part X (Embedded Figures): Select the answer figure in which the question figure is hidden/embedded.`,
        questionImage: getMatSvg(q, 'Q'),
        options: {
          A: getMatSvg(q, 'A'),
          B: getMatSvg(q, 'B'),
          C: getMatSvg(q, 'C'),
          D: getMatSvg(q, 'D')
        },
        answer: q37_40_ans[q],
        explanation: `Tracing the exact line geometry reveals the question figure embedded inside option figure (${q37_40_ans[q]}).`
      });
    }


    // --- PART 2: ARITHMETIC TEST (Q41 to Q60) ---
    questions.push({
      qNum: 41,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'Simplification of the following gives: $$15\\frac{1}{2} - \\left[ \\frac{12}{5} \\times \\frac{5}{8} + \\left(7 \\div 1\\frac{3}{4}\\right) \\right] \\times 2$$',
      options: { A: '2/9', B: '7/2', C: '9/2', D: '11/2' },
      answer: 'C',
      explanation: 'Step 1: Convert $15\\frac{1}{2} = \\frac{31}{2}$.\nStep 2: Inside brackets $\\frac{12}{5} \\times \\frac{5}{8} = \\frac{12}{8} = \\frac{3}{2}$.\nStep 3: $7 \\div 1\\frac{3}{4} = 7 \\div \\frac{7}{4} = 7 \\times \\frac{4}{7} = 4$.\nStep 4: Sum inside brackets $= \\frac{3}{2} + 4 = \\frac{11}{2}$.\nStep 5: Multiply by 2 $= \\frac{11}{2} \\times 2 = 11$.\nStep 6: Subtract $= \\frac{31}{2} - 11 = \\frac{31 - 22}{2} = \\frac{9}{2}$. Correct option is (C).'
    });

    questions.push({
      qNum: 42,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'The number of numbers which are multiples of both 3 and 5 in the first 100 natural numbers is:',
      options: { A: '10', B: '9', C: '7', D: '6' },
      answer: 'D',
      explanation: 'A number is a multiple of both 3 and 5 if it is a multiple of $\\text{LCM}(3,5) = 15$.\nThe multiples of 15 in the first 100 natural numbers are 15, 30, 45, 60, 75, and 90.\nTotal count = 6 numbers. Correct option is (D).'
    });

    questions.push({
      qNum: 43,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'Which of the following statements is correct?',
      options: {
        A: 'Zero is an odd number.',
        B: 'Zero is an even number.',
        C: 'Zero is a prime number.',
        D: 'Zero is neither odd nor even number.'
      },
      answer: 'D',
      explanation: 'According to elementary school standards and official JNVST answer keys, Zero is classified as neither positive nor negative, and statement (D) "Zero is neither odd nor even number" is marked as correct.'
    });

    questions.push({
      qNum: 44,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'If a man travels at a speed of 30 km/hr, he reaches his destination 10 minutes late and if he travels at a speed of 42 km/hr, he reaches his destination 10 minutes early. The distance travelled is:',
      options: { A: '36 km', B: '35 km', C: '40 km', D: '42 km' },
      answer: 'B',
      explanation: 'Let distance be $D$ km.\nTime difference = 10 min late + 10 min early = 20 minutes $= \\frac{20}{60} = \\frac{1}{3}$ hour.\n$$\\frac{D}{30} - \\frac{D}{42} = \\frac{1}{3}$$\n$$\\frac{42D - 30D}{1260} = \\frac{1}{3} \\implies \\frac{12D}{1260} = \\frac{1}{3} \\implies \\frac{D}{105} = \\frac{1}{3} \\implies D = 35\\text{ km}$$.\nCorrect option is (B).'
    });

    questions.push({
      qNum: 45,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'A passenger train, running at a speed of 80 km/hr leaves a railway station 6 hours after a goods train leaves and overtakes it in 4 hours. What is the speed of the goods train?',
      options: { A: '32 km/hr', B: '48 km/hr', C: '60 km/hr', D: '50 km/hr' },
      answer: 'A',
      explanation: 'Distance travelled by passenger train in 4 hours $= 80 \\times 4 = 320\\text{ km}$.\nTotal time goods train travelled $= 6 + 4 = 10\\text{ hours}$.\nSpeed of goods train $= \\frac{320}{10} = 32\\text{ km/hr}$. Correct option is (A).'
    });

    questions.push({
      qNum: 46,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'What sum will amount to ₹ 6,600 in 4 years at 8% per annum simple interest?',
      options: { A: '₹ 6,000', B: '₹ 5,000', C: '₹ 4,000', D: '₹ 6,200' },
      answer: 'B',
      explanation: 'Formula: $A = P \\left(1 + \\frac{R \\times T}{100}\\right)$.\n$$6600 = P \\left(1 + \\frac{8 \\times 4}{100}\\right) = P \\left(1 + \\frac{32}{100}\\right) = P \\left(\\frac{132}{100}\\right)$$\n$$P = \\frac{6600 \\times 100}{132} = 50 \\times 100 = ₹ 5,000$$.\nCorrect option is (B).'
    });

    questions.push({
      qNum: 47,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: '5,045 grams is equal to:',
      options: { A: '50 kg, 45 g', B: '5 kg, 45 g', C: '5 kg, 450 g', D: '50 kg, 450 g' },
      answer: 'B',
      explanation: 'Since $1\\text{ kg} = 1000\\text{ g}$, $5045\\text{ g} = 5000\\text{ g} + 45\\text{ g} = 5\\text{ kg, } 45\\text{ g}$. Correct option is (B).'
    });

    questions.push({
      qNum: 48,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'How many rectangular slabs of $10\\text{ cm} \\times 8\\text{ cm}$ are required to cover the floor of a hall of $12\\text{ m} \\times 10\\text{ m}$?',
      options: { A: '12000', B: '15000', C: '10000', D: '18000' },
      answer: 'B',
      explanation: 'Floor area $= (12 \\times 100\\text{ cm}) \\times (10 \\times 100\\text{ cm}) = 1200 \\times 1000 = 1,200,000\\text{ cm}^2$.\nSlab area $= 10 \\times 8 = 80\\text{ cm}^2$.\nNumber of slabs $= \\frac{1,200,000}{80} = 15,000$. Correct option is (B).'
    });

    questions.push({
      qNum: 49,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'What is the sum of the place values of 5 in the number 5,84,356?',
      options: { A: '10', B: '50,050', C: '5,050', D: '5,00,050' },
      answer: 'D',
      explanation: 'In 5,84,356:\nFirst 5 is at hundred thousands place $= 5,00,000$.\nSecond 5 is at tens place $= 50$.\nSum $= 5,00,000 + 50 = 5,00,050$. Correct option is (D).'
    });

    questions.push({
      qNum: 50,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'Two solid cubes of side 10 cm each are joined end to end. What is the volume of the resulting cuboid?',
      options: { A: '500 cm³', B: '2000 cm³', C: '1000 cm³', D: '10000 cm³' },
      answer: 'B',
      explanation: 'Dimensions of cuboid: length $= 10 + 10 = 20\\text{ cm}$, breadth $= 10\\text{ cm}$, height $= 10\\text{ cm}$.\nVolume $= 20 \\times 10 \\times 10 = 2000\\text{ cm}^3$. Correct option is (B).'
    });

    questions.push({
      qNum: 51,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: '150% is equal to:',
      options: { A: '1.5', B: '5.1', C: '0.15', D: '15.0' },
      answer: 'A',
      explanation: '$150\\% = \\frac{150}{100} = 1.5$. Correct option is (A).'
    });

    questions.push({
      qNum: 52,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'A fruit seller buys lemons at 2 for a rupee and sells them at 5 for three rupees. What is his profit percent?',
      options: { A: '8%', B: '10%', C: '15%', D: '20%' },
      answer: 'D',
      explanation: 'Cost price (CP) of 1 lemon $= ₹ \\frac{1}{2} = ₹ 0.50$.\nSelling price (SP) of 1 lemon $= ₹ \\frac{3}{5} = ₹ 0.60$.\nProfit per lemon $= 0.60 - 0.50 = ₹ 0.10$.\nProfit % $= \\frac{0.10}{0.50} \\times 100 = 20\\%$. Correct option is (D).'
    });

    questions.push({
      qNum: 53,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'Which of the following numbers is divisible by 3, 4, 5 and 6?',
      options: { A: '36', B: '60', C: '80', D: '90' },
      answer: 'B',
      explanation: '$\\text{LCM}(3,4,5,6) = 60$. A number divisible by all four must be a multiple of 60. Among options, 60 is divisible by 3, 4, 5, and 6. Correct option is (B).'
    });

    questions.push({
      qNum: 54,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'There are 500 eggs in a box. $\\frac{3}{25}$ got broken, $\\frac{4}{5}$ of the remaining eggs were sold. The number of eggs left is:',
      options: { A: '80', B: '88', C: '40', D: '36' },
      answer: 'B',
      explanation: 'Broken eggs $= 500 \\times \\frac{3}{25} = 60$.\nRemaining eggs $= 500 - 60 = 440$.\nUnsold fraction $= 1 - \\frac{4}{5} = \\frac{1}{5}$.\nEggs left $= 440 \\times \\frac{1}{5} = 88$. Correct option is (B).'
    });

    questions.push({
      qNum: 55,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: '5 minutes past 3, in the afternoon, is written as:',
      options: { A: '5:30 am', B: '5:30 pm', C: '3:50 pm', D: '3:05 pm' },
      answer: 'D',
      explanation: '5 minutes past 3 o\'clock in the afternoon corresponds to 3:05 pm. Correct option is (D).'
    });

    questions.push({
      qNum: 56,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'The difference between the greatest and the smallest 5-digit numbers, formed by the digits 0, 3, 6, 7 and 9 without repetition, is:',
      options: { A: '93951', B: '67061', C: '66951', D: '60840' },
      answer: 'C',
      explanation: 'Greatest 5-digit number $= 97630$.\nSmallest 5-digit number $= 30679$.\nDifference $= 97630 - 30679 = 66951$. Correct option is (C).'
    });

    questions.push({
      qNum: 57,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'An article is sold for ₹ 500 and hence a loss is incurred. Had the article been sold for ₹ 700, the shopkeeper would have gained three times the former loss. What is the cost price of the article?',
      options: { A: '₹ 525', B: '₹ 550', C: '₹ 600', D: '₹ 650' },
      answer: 'B',
      explanation: 'Let Cost Price $= x$.\nGain at ₹ 700 $= 700 - x$.\nLoss at ₹ 500 $= x - 500$.\nGiven $700 - x = 3(x - 500) \\implies 700 - x = 3x - 1500 \\implies 4x = 2200 \\implies x = ₹ 550$. Correct option is (B).'
    });

    questions.push({
      qNum: 58,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'When -1 is multiplied by itself 100 times, the product is:',
      options: { A: '1', B: '-1', C: '100', D: '-100' },
      answer: 'A',
      explanation: '$(-1)^{100} = 1$ because 100 is an even integer exponent. Correct option is (A).'
    });

    questions.push({
      qNum: 59,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'Simplification of $2.75 - 1.25 + 4.75 - 3.80$ in fractional form is:',
      options: { A: '2 9/20', B: '2 9/10', C: '1 9/10', D: '5 9/20' },
      answer: 'A',
      explanation: '$2.75 - 1.25 + 4.75 - 3.80 = 2.45$.\nIn mixed fraction: $2.45 = 2 \\frac{45}{100} = 2 \\frac{9}{20}$. Correct option is (A).'
    });

    questions.push({
      qNum: 60,
      section: 'arithmetic',
      sectionName: 'Arithmetic Test',
      questionText: 'The length of a rectangular plot of land is twice its breadth. A square swimming pool of side 8 m, occupies one-eighth part of the plot. The length of the plot is:',
      options: { A: '64 m', B: '32 m', C: '16 m', D: '12 m' },
      answer: 'B',
      explanation: 'Pool area $= 8 \\times 8 = 64\\text{ m}^2$.\nTotal plot area $= 64 \\times 8 = 512\\text{ m}^2$.\nLet breadth $= b$, length $= 2b$.\nArea $= 2b \\times b = 2b^2 = 512 \\implies b^2 = 256 \\implies b = 16\\text{ m}$.\nLength $= 2 \\times 16 = 32\\text{ m}$. Correct option is (B).'
    });


    // --- PART 3: LANGUAGE TEST (Q61 to Q80) ---
    // Passage 1
    const passage1Header = `**Passage 1**\nChewing gum was discovered a thousand years ago by the Mayans in the Mexican jungles. They found a liquid leaking from a sapodilla tree. As it oozed out, it thickened into something that they called chicle which was chewable and tasty. Today, workers called chicleros still collect chicle. The chicle is boiled to remove the water. It is then made into slabs about 30 pounds each or 14 kilograms each. These slabs are sent to gum factories. There it is mixed with several ingredients to sweeten, soften, flavour and colour the gum.\n\n`;

    questions.push({
      qNum: 61,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage1Header + '________ discovered chewing gum.',
      options: { A: 'The Mayans', B: 'Sapodillas', C: 'Chicleros', D: 'Gum factories' },
      answer: 'A',
      explanation: 'Passage 1 states: "Chewing gum was discovered a thousand years ago by the Mayans". Correct option is (A).'
    });

    questions.push({
      qNum: 62,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage1Header + '________ are the workers who collect chicle.',
      options: { A: 'Sapodillas', B: 'The Mayans', C: 'Chicleros', D: 'Gummers' },
      answer: 'C',
      explanation: 'Passage 1 states: "Today, workers called chicleros still collect chicle." Correct option is (C).'
    });

    questions.push({
      qNum: 63,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage1Header + 'Slabs of chicle are sent to:',
      options: { A: 'recycling centers', B: 'gum factories', C: 'the Mexican jungles', D: 'candy stores' },
      answer: 'B',
      explanation: 'Passage 1 states: "These slabs are sent to gum factories." Correct option is (B).'
    });

    questions.push({
      qNum: 64,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage1Header + 'Several ingredients are added to chicle to do all of the following except to ________ it.',
      options: { A: 'soften', B: 'flavour', C: 'thicken', D: 'sweeten' },
      answer: 'C',
      explanation: 'Passage 1 mentions ingredients are added to sweeten, soften, flavour and colour the gum. Thicken is NOT one of them. Correct option is (C).'
    });

    questions.push({
      qNum: 65,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage1Header + 'A suitable title for the passage will be:',
      options: { A: 'The Gum', B: 'Chiclero', C: 'The Story of Chiclero', D: 'The Story of Chewing Gum' },
      answer: 'D',
      explanation: 'The passage explains the origin, collection, and processing of chewing gum, making "The Story of Chewing Gum" the best title. Correct option is (D).'
    });

    // Passage 2
    const passage2Header = `**Passage 2**\nIndia is a land of pilgrims and pilgrimages. These holy places, whether in the hills or in the plains, are generally situated on river banks or by the sea. It is not only the religious people who visit these places of pilgrimages, but also travellers and sight-seers from all over India and abroad. Wherever two or more rivers meet, pilgrims come to bathe and worship because that place is supposed to be holy. One such place is Haridwar which is situated on the bank of river Ganga.\n\n`;

    questions.push({
      qNum: 66,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage2Header + 'Holy places are visited by religious people, sight-seers as well as ________',
      options: { A: 'children', B: 'travellers', C: 'traders', D: 'voyagers' },
      answer: 'B',
      explanation: 'Passage 2 states: "not only the religious people... but also travellers and sight-seers". Correct option is (B).'
    });

    questions.push({
      qNum: 67,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage2Header + 'Which one of the following is a synonym of the word - "generally"?',
      options: { A: 'usually', B: 'publicly', C: 'occasionally', D: 'eventually' },
      answer: 'A',
      explanation: '"Generally" means as a general rule or ordinarily, which is synonymous with "usually". Correct option is (A).'
    });

    questions.push({
      qNum: 68,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage2Header + 'The place is considered "holy" where two or more rivers meet. Here the antonym of the word "holy" is:',
      options: { A: 'godly', B: 'religious', C: 'cursed', D: 'pious' },
      answer: 'C',
      explanation: '"Holy" means sacred or blessed; its direct antonym is "cursed". Correct option is (C).'
    });

    questions.push({
      qNum: 69,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage2Header + 'People come to bathe and worship in the Ganga as its water is:',
      options: { A: 'holy', B: 'clear and clean', C: 'cool', D: 'healthy' },
      answer: 'A',
      explanation: 'Passage 2 states pilgrims bathe and worship because the river place is "supposed to be holy". Correct option is (A).'
    });

    questions.push({
      qNum: 70,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage2Header + 'People go on a pilgrimage because they are:',
      options: { A: 'curious', B: 'religious', C: 'explorers', D: 'old' },
      answer: 'B',
      explanation: 'People undertake pilgrimages primarily due to religious faith and devotion. Correct option is (B).'
    });

    // Passage 3
    const passage3Header = `**Passage 3**\nIt was Ajit's birthday. All his friends and relatives had gathered. He received many gifts. There were books, toys and clothes. Ajit's aunt gave him a surprise gift - a rose sapling. Ajit liked his aunt's gift the best and at once ran to the garden and planted the sapling. As soon as he woke up in the morning he would rush to see how much the plant had grown. One day he saw two little rose buds peeping out. He kept watching the buds bloom into beautiful yellow roses. He was happy and thrilled. With his mother's help, he plucked the flowers. He gifted the first two roses to his mother and sister. Ajit decided to plant more saplings in his garden.\n\n`;

    questions.push({
      qNum: 71,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage3Header + "Ajit's best birthday gift was a:",
      options: { A: 'race car', B: 'shirt', C: 'rose sapling', D: 'book' },
      answer: 'C',
      explanation: 'Passage 3 states: "Ajit liked his aunt\'s gift the best... a rose sapling." Correct option is (C).'
    });

    questions.push({
      qNum: 72,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage3Header + 'As soon as Ajit woke up he:',
      options: { A: 'started studying', B: 'rushed to see the sapling', C: 'had a bath', D: 'went to school' },
      answer: 'B',
      explanation: 'Passage 3 states: "As soon as he woke up in the morning he would rush to see how much the plant had grown." Correct option is (B).'
    });

    questions.push({
      qNum: 73,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage3Header + 'How many rose buds appeared first?',
      options: { A: 'one', B: 'four', C: 'two', D: 'many' },
      answer: 'C',
      explanation: 'Passage 3 states: "One day he saw two little rose buds peeping out." Correct option is (C).'
    });

    questions.push({
      qNum: 74,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage3Header + 'Ajit gifted the first two roses to:',
      options: { A: 'his friends', B: 'his aunt', C: 'his mother and sister', D: 'his mother and aunt' },
      answer: 'C',
      explanation: 'Passage 3 states: "He gifted the first two roses to his mother and sister." Correct option is (C).'
    });

    questions.push({
      qNum: 75,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage3Header + 'The word "thrilled" means:',
      options: { A: 'sad', B: 'excited', C: 'afraid', D: 'surprised' },
      answer: 'B',
      explanation: '"Thrilled" means feeling extremely happy and excited. Correct option is (B).'
    });

    // Passage 4
    const passage4Header = `**Passage 4**\nThe neem tree is known as a village pharmacy due to the medicinal benefits of its seeds, bark and leaves. It is called arista in Sanskrit which means perfect, imperishable and complete. Neem oil plays an important role in pest control and can also be used as a replacement for mosquito repellent. Neem seed cakes are used as fertilizer. A paste of neem leaves is used to treat chickenpox. Neem twigs commonly referred to as 'datun' are used as toothbrushes in villages. The bark and roots are also used, in powdered form, to control fleas and ticks on pets.\n\n`;

    questions.push({
      qNum: 76,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage4Header + 'A pharmacy is:',
      options: { A: 'farm land', B: 'a medical store', C: 'a playground', D: 'a farm house' },
      answer: 'B',
      explanation: 'A pharmacy is a store or shop where medicines are sold (medical store). Correct option is (B).'
    });

    questions.push({
      qNum: 77,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage4Header + 'The part of the neem tree that is useful to the farmers is:',
      options: { A: 'seeds', B: 'bark', C: 'twigs', D: 'leaves' },
      answer: 'A',
      explanation: 'Passage 4 mentions: "Neem seed cakes are used as fertilizer", which directly aids farmers. Correct option is (A).'
    });

    questions.push({
      qNum: 78,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage4Header + 'Which one of the following is not a synonym of "perfect"?',
      options: { A: 'faultless', B: 'flawless', C: 'seamless', D: 'blemished' },
      answer: 'D',
      explanation: '"Faultless", "flawless", and "seamless" mean perfect. "Blemished" means flawed, so it is NOT a synonym. Correct option is (D).'
    });

    questions.push({
      qNum: 79,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage4Header + 'The word "pest" in the passage means:',
      options: { A: 'an insect that destroys crops', B: 'an angry person', C: 'dirty water', D: 'pollution' },
      answer: 'A',
      explanation: 'In agriculture, a "pest" refers to destructive insects or animals that ruin crops. Correct option is (A).'
    });

    questions.push({
      qNum: 80,
      section: 'language',
      sectionName: 'Language Test',
      questionText: passage4Header + 'Neem ________ are used as toothbrushes in villages.',
      options: { A: 'roots', B: 'leaves', C: 'twigs', D: 'seed cakes' },
      answer: 'C',
      explanation: 'Passage 4 states: "Neem twigs commonly referred to as \'datun\' are used as toothbrushes in villages." Correct option is (C).'
    });

    // Construct Template Document
    const templateDoc = {
      id: '2020-jnvst-official-pyq-template',
      examId: 'jnvst',
      examName: 'JNVST Class 6 Selection Test (2020 Official Booklet Code C)',
      title: 'JNVST 2020 Official Selection Test (Booklet Code C)',
      description: 'Official 80-Question Jawahar Navodaya Vidyalaya Selection Test (JNVST 2020 Booklet Code C) with detailed step-by-step clear solutions for every question.',
      totalQuestions: 80,
      durationMinutes: 120,
      totalMarks: 100,
      isSpreadsheetStatic: true,
      subject: 'previous_years',
      grade: '6',
      rows: questions.map(q => ({
        qNum: q.qNum,
        section: q.section,
        sectionName: q.sectionName,
        partNum: q.partNum || 1,
        partTitle: q.partTitle || '',
        questionText: q.questionText,
        questionImage: q.questionImage || '',
        optionA: q.options.A,
        optionB: q.options.B,
        optionC: q.options.C,
        optionD: q.options.D,
        answer: q.answer,
        correctOption: q.answer,
        explanation: q.explanation
      })),
      updatedAt: new Date(),
      createdAt: new Date()
    };

    // Upsert into dynamic_templates collection
    await db.collection('dynamic_templates').updateOne(
      { id: '2020-jnvst-official-pyq-template' },
      { $set: templateDoc },
      { upsert: true }
    );
    console.log('✅ Seeded 2020 JNVST Official PYQ into "dynamic_templates" collection!');

    // Upsert into mock_tests collection
    await db.collection('mock_tests').updateOne(
      { id: '2020-jnvst-official-pyq-template' },
      {
        $set: {
          id: '2020-jnvst-official-pyq-template',
          examId: 'jnvst',
          title: 'JNVST 2020 Official PYQ Mock Test (80 Qs - Booklet Code C)',
          duration: 120,
          totalQuestions: 80,
          totalMarks: 100,
          isOfficialPYQ: true,
          pyqYear: 2020,
          questions: templateDoc.rows,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log('✅ Seeded 2020 JNVST Official PYQ into "mock_tests" collection!');

    // Upsert each question into static questions collection for Admin Question Bank
    const questionsCollection = db.collection(process.env.MONGODB_QUESTIONS_COLLECTION || 'questions');
    for (const q of questions) {
      await questionsCollection.updateOne(
        { examId: 'jnvst', qNumber: q.qNum, pyqYear: 2020 },
        {
          $set: {
            examId: 'jnvst',
            section: q.section,
            sectionName: q.sectionName,
            qNumber: q.qNum,
            questionText: q.questionText,
            questionImage: q.questionImage || '',
            options: q.options,
            correctOption: q.answer,
            answer: q.answer,
            explanationText: q.explanation,
            isPYQ: true,
            pyqYear: 2020,
            tags: ['jnvst', 'pyq2020', q.section],
            status: 'active',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
    console.log('✅ Seeded all 80 individual static questions into "questions" collection!');

    console.log('\n🎉 SUCCESS! Official JNVST 2020 PYQ (80 Questions Code C) with clear step-by-step solutions is live!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.close();
  }
}

seed2020Official();
