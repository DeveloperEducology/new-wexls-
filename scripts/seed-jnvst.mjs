import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        }
        if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
  }
} catch (e) {
  console.error("Could not load .env.local:", e.message);
}

const JNVST_EXAM = {
  _id: 'jnvst',
  name: 'JNVST',
  fullName: 'Jawahar Navodaya Vidyalaya Selection Test',
  targetClass: 6,
  sections: [
    {
      id: 'mat',
      name: 'Mental Ability Test',
      shortName: 'MAT',
      questionCount: 50,
      maxMarks: 60,
      timeLimitMinutes: 60,
      negativeMarking: 0,
      icon: '🧠',
      description: 'Tests spatial, logical and pattern recognition skills',
      topics: ['analogy', 'series', 'coding-decoding', 'odd-one-out', 'figure-completion', 'mirror-image', 'embedded-figures'],
    },
    {
      id: 'arithmetic',
      name: 'Arithmetic Test',
      shortName: 'Arithmetic',
      questionCount: 25,
      maxMarks: 25,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🔢',
      description: 'Tests basic mathematical concepts',
      topics: ['fractions', 'percentages', 'ratios', 'time-distance', 'simple-interest', 'lcm-hcf', 'profit-loss', 'mensuration'],
    },
    {
      id: 'language',
      name: 'Language Test',
      shortName: 'Language',
      questionCount: 25,
      maxMarks: 15,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '📝',
      description: 'Tests reading comprehension and grammar',
      topics: ['comprehension', 'grammar', 'vocabulary', 'fill-in-the-blanks', 'sentence-correction'],
    },
  ],
  totalDuration: 120,
  totalMarks: 100,
  examFrequency: 'annual',
  passingCriteria: { general: 65, obc: 60, sc: 55, st: 50 },
  availableLanguages: ['english', 'hindi'],
};

// Generate 45 starter questions
const questions = [];

// ── MAT Questions (15) ──────────────────────────────────────────────────
const matTopics = ['odd-one-out', 'series', 'analogy', 'figure-completion', 'mirror-image'];
for (let i = 1; i <= 15; i++) {
  const topic = matTopics[(i - 1) % matTopics.length];
  const difficulty = 0.15 + (i - 1) * 0.05; // 0.15 to 0.85
  
  let questionText = '';
  let options = {};
  let correctOption = '';
  let explanationText = '';
  
  if (topic === 'odd-one-out') {
    questionText = `In the following question, four figures A, B, C, and D are given. Three of the figures are similar in some way and one is different. Find the figure which is different.
- Figure A: A triangle with 3 internal dots.
- Figure B: A square with 4 internal dots.
- Figure C: A pentagon with 5 internal dots.
- Figure D: A hexagon with 5 internal dots.`;
    options = {
      A: 'Figure A',
      B: 'Figure B',
      C: 'Figure C',
      D: 'Figure D'
    };
    correctOption = 'D';
    explanationText = 'In figures A, B, and C, the number of internal dots matches the number of sides of the polygon (Triangle = 3, Square = 4, Pentagon = 5). In Figure D, the hexagon has 6 sides but only 5 dots, making it the odd one out.';
  } else if (topic === 'series') {
    questionText = `Observe the series of patterns and determine the next figure:
1st Figure: A circle with a single vertical line.
2nd Figure: A circle with a vertical line and a horizontal line crossing it (+).
3rd Figure: A circle with a cross (+) and one diagonal line.
What is the 4th Figure?`;
    options = {
      A: 'A circle with a cross (+) and two diagonal lines crossing it.',
      B: 'A square with no lines.',
      C: 'A circle with only horizontal lines.',
      D: 'A circle with a cross (+) but no diagonals.'
    };
    correctOption = 'A';
    explanationText = 'The series adds one line segment in each step. The vertical line, then horizontal (+), then one diagonal. The next step adds the second diagonal to complete the symmetric pattern.';
  } else if (topic === 'analogy') {
    if (i === 8) {
      questionText = `Identify the relationship between the first pair of figures and find the matching figure for the second pair.

First Pair:
- Figure 1: Circle containing a Triangle
- Figure 2: Triangle containing a Circle

Second Pair:
- Figure 3: Circle containing a Square
- Figure 4: ?`;
      options = {
        A: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><rect x="15" y="15" width="70" height="70" /><circle cx="50" cy="50" r="25" /></svg>`,
        B: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><rect x="15" y="15" width="70" height="70" /><line x1="15" y1="15" x2="85" y2="85" /><line x1="85" y1="15" x2="15" y2="85" /></svg>`,
        C: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><polygon points="50,15 85,75 15,75" /><rect x="35" y="40" width="30" height="30" /></svg>`,
        D: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><circle cx="50" cy="50" r="40" /><polygon points="50,20 78,70 22,70" /></svg>`
      };
      correctOption = 'A';
      explanationText = 'In the first pair, the shapes swap places: the outer circle becomes inner, and the inner triangle becomes outer. For the second pair, the outer circle containing a square must swap to an outer square containing a circle (Option A).';
    } else if (i === 13) {
      questionText = `Identify the relationship between the first pair of figures and find the matching figure for the second pair.

First Pair:
- Figure 1: Triangle pointed Upwards
- Figure 2: Triangle pointed Downwards

Second Pair:
- Figure 3: Arrow pointed Right
- Figure 4: ?`;
      options = {
        A: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><line x1="15" y1="50" x2="85" y2="50" /><polygon points="35,30 15,50 35,70" /></svg>`, // Left arrow (correct)
        B: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><line x1="15" y1="50" x2="85" y2="50" /><polygon points="65,30 85,50 65,70" /></svg>`, // Right arrow
        C: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><line x1="50" y1="15" x2="50" y2="85" /><polygon points="30,35 50,15 70,35" /></svg>`, // Up arrow
        D: `<svg viewBox="0 0 100 100" width="80" height="80" style="stroke: currentColor; fill: none; stroke-width: 3;"><line x1="50" y1="15" x2="50" y2="85" /><polygon points="30,65 50,85 70,65" /></svg>`  // Down arrow
      };
      correctOption = 'A';
      explanationText = 'In the first pair, the shape flips 180 degrees (vertically inverted). Similarly, the arrow pointed right flips 180 degrees to point left (Option A).';
    } else {
      questionText = `Identify the relationship between the first pair of figures and find the matching figure for the second pair.
[Circle : Cylinder] :: [Square : ?]`;
      options = {
        A: 'Sphere',
        B: 'Cube',
        C: 'Cone',
        D: 'Rectangle'
      };
      correctOption = 'B';
      explanationText = 'A cylinder is a 3D extension of a circle (cross-section). Similarly, a cube is the 3D extension of a square.';
    }
  } else if (topic === 'figure-completion') {
    questionText = `A square grid has 3 parts filled and the bottom-right corner is empty.
Top-left: 1 dot
Top-right: 2 dots
Bottom-left: 3 dots
Which figure should complete the bottom-right quadrant to maintain the pattern?`;
    options = {
      A: 'A quadrant with 2 dots',
      B: 'A quadrant with 3 dots',
      C: 'A quadrant with 4 dots',
      D: 'A quadrant with 5 dots'
    };
    correctOption = 'C';
    explanationText = 'The pattern increases the number of dots in a clockwise direction starting from Top-left: 1 -> 2 -> 3 -> 4. So the empty quadrant must contain 4 dots.';
  } else {
    // mirror-image
    questionText = `Find the correct mirror image of the word "JNVST" when the mirror is placed to its right (vertical mirror).`;
    options = {
      A: 'TSVNJ (with letters horizontally reversed)',
      B: 'JNVST (same)',
      C: 'TSVNJ (inverted vertically)',
      D: 'VTNSJ'
    };
    correctOption = 'A';
    explanationText = 'When a vertical mirror is placed to the right, the order of the letters reverses from left to right (JNVST becomes TSVNJ), and each letter is also flipped horizontally.';
  }
  
  questions.push({
    examId: 'jnvst',
    section: 'mat',
    topic,
    difficulty: Math.round(difficulty * 100) / 100,
    questionText,
    options,
    correctOption,
    explanationText,
    isPYQ: Math.random() > 0.6,
    pyqYear: Math.random() > 0.6 ? 2023 : 2024,
    tags: [topic, 'mental-ability'],
    status: 'active'
  });
}

// ── Arithmetic Questions (15) ──────────────────────────────────────────
const arithmeticTopics = ['fractions', 'percentages', 'ratios', 'profit-loss', 'lcm-hcf'];
const arithmeticQuestionsData = [
  {
    topic: 'fractions',
    difficulty: 0.2,
    questionText: 'What is the sum of \\(\\frac{3}{8}\\) and \\(\\frac{1}{8}\\)?',
    options: { A: '\\(\\frac{4}{16}\\)', B: '\\(\\frac{1}{2}\\)', C: '\\(\\frac{1}{4}\\)', D: '\\(\\frac{3}{8}\\)' },
    correctOption: 'B',
    explanationText: 'To add fractions with the same denominator, add their numerators: \\(\\frac{3}{8} + \\frac{1}{8} = \\frac{4}{8}\\). Simplify \\(\\frac{4}{8}\\) by dividing the numerator and denominator by 4, which gives \\(\\frac{1}{2}\\).'
  },
  {
    topic: 'percentages',
    difficulty: 0.3,
    questionText: 'Convert \\(0.075\\) into a percentage.',
    options: { A: '7.5%', B: '75%', C: '0.75%', D: '0.075%' },
    correctOption: 'A',
    explanationText: 'To convert a decimal to a percentage, multiply by 100 and add the % symbol: \\(0.075 \\times 100 = 7.5\\)%.'
  },
  {
    topic: 'ratios',
    difficulty: 0.35,
    questionText: 'If the ratio of boys to girls in a school is 5:3 and there are 120 girls, what is the number of boys?',
    options: { A: '150', B: '200', C: '72', D: '240' },
    correctOption: 'B',
    explanationText: 'Let the number of boys be \\(5x\\) and girls be \\(3x\\). Given girls \\(3x = 120\\), so \\(x = 40\\). The number of boys is \\(5x = 5 \\times 40 = 200\\).'
  },
  {
    topic: 'profit-loss',
    difficulty: 0.45,
    questionText: 'A shopkeeper buys a toy for Rs. 150 and sells it for Rs. 180. Find his profit percentage.',
    options: { A: '15%', B: '20%', C: '25%', D: '30%' },
    correctOption: 'B',
    explanationText: 'Profit = Selling Price - Cost Price = 180 - 150 = Rs. 30. Profit Percentage = \\(\\frac{\\text{Profit}}{\\text{Cost Price}} \\times 100 = \\frac{30}{150} \\times 100 = 20\\)%.'
  },
  {
    topic: 'lcm-hcf',
    difficulty: 0.4,
    questionText: 'Find the HCF of 24 and 36.',
    options: { A: '6', B: '12', C: '24', D: '72' },
    correctOption: 'B',
    explanationText: 'Factors of 24 are 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36 are 1, 2, 3, 4, 6, 9, 12, 18, 36. The highest common factor is 12.'
  },
  {
    topic: 'fractions',
    difficulty: 0.5,
    questionText: 'Simplify the expression: \\(\\frac{2}{3} \\times \\frac{9}{10} \\div \\frac{3}{5}\\).',
    options: { A: '1', B: '\\(\\frac{3}{5}\\)', C: '\\(\\frac{4}{5}\\)', D: '2' },
    correctOption: 'A',
    explanationText: 'First, solve the multiplication: \\(\\frac{2}{3} \\times \\frac{9}{10} = \\frac{18}{30} = \\frac{3}{5}\\). Now divide by \\(\\frac{3}{5}\\): \\(\\frac{3}{5} \\div \\frac{3}{5} = \\frac{3}{5} \\times \\frac{5}{3} = 1\\).'
  },
  {
    topic: 'percentages',
    difficulty: 0.55,
    questionText: 'An exam candidate scored 450 out of 600 marks. What percentage of marks did they score?',
    options: { A: '70%', B: '75%', C: '80%', D: '85%' },
    correctOption: 'B',
    explanationText: 'Percentage = \\(\\frac{\\text{Obtained Marks}}{\\text{Total Marks}} \\times 100 = \\frac{450}{600} \\times 100 = 75\\)%.'
  },
  {
    topic: 'ratios',
    difficulty: 0.6,
    questionText: 'Divide Rs. 350 between A and B in the ratio 4:3. Find A\'s share.',
    options: { A: 'Rs. 200', B: 'Rs. 150', C: 'Rs. 175', D: 'Rs. 225' },
    correctOption: 'A',
    explanationText: 'Total parts = 4 + 3 = 7. Share of A = \\(\\frac{4}{7} \\times 350 = Rs. 200\\).'
  },
  {
    topic: 'profit-loss',
    difficulty: 0.65,
    questionText: 'By selling a pen for Rs. 54, a shopkeeper loses 10%. Find the cost price of the pen.',
    options: { A: 'Rs. 60', B: 'Rs. 58', C: 'Rs. 62', D: 'Rs. 65' },
    correctOption: 'A',
    explanationText: 'Selling Price = Rs. 54, Loss = 10%. Since Selling Price = CP - Loss, \\(54 = \\text{CP} \\times 0.9\\). CP = \\(\\frac{54}{0.9} = Rs. 60\\).'
  },
  {
    topic: 'lcm-hcf',
    difficulty: 0.7,
    questionText: 'Three bells toll at intervals of 9, 12, and 15 minutes respectively. If they toll together now, after how many hours will they next toll together?',
    options: { A: '3 hours', B: '4 hours', C: '5 hours', D: '6 hours' },
    correctOption: 'A',
    explanationText: 'The next time they toll together is the LCM of 9, 12, and 15 minutes. Prime factorization: \\(9 = 3^2\\), \\(12 = 2^2 \\times 3\\), \\(15 = 3 \\times 5\\). LCM = \\(2^2 \\times 3^2 \\times 5 = 4 \\times 9 \\times 5 = 180\\) minutes. Convert to hours: \\(180 / 60 = 3\\) hours.'
  },
  {
    topic: 'fractions',
    difficulty: 0.75,
    questionText: 'Find the value of \\(\\left(1 - \\frac{1}{2}\\right) \\left(1 - \\frac{1}{3}\\right) \\left(1 - \\frac{1}{4}\\right) \\dots \\left(1 - \\frac{1}{10}\\right)\\).',
    options: { A: '\\(\\frac{1}{10}\\)', B: '\\(\\frac{1}{2}\\)', C: '\\(\\frac{9}{10}\\)', D: '\\(\\frac{1}{5}\\)' },
    correctOption: 'A',
    explanationText: 'Rewrite the terms: \\(\\frac{1}{2} \\times \\frac{2}{3} \\times \\frac{3}{4} \\times \\dots \\times \\frac{9}{10}\\). All intermediate numerators and denominators cancel out, leaving only the first numerator (1) and the last denominator (10). Thus the product is \\(\\frac{1}{10}\\).'
  },
  {
    topic: 'percentages',
    difficulty: 0.8,
    questionText: 'If 20% of a number is 80, what is 35% of that number?',
    options: { A: '120', B: '140', C: '160', D: '180' },
    correctOption: 'B',
    explanationText: 'Let the number be \\(x\\). Given \\(0.2x = 80 \\implies x = 400\\). Now, 35% of 400 = \\(0.35 \\times 400 = 140\\).'
  },
  {
    topic: 'ratios',
    difficulty: 0.85,
    questionText: 'A mixture of 60 liters contains milk and water in the ratio 2:1. How many liters of water must be added so that the ratio becomes 1:2?',
    options: { A: '30 liters', B: '40 liters', C: '60 liters', D: '80 liters' },
    correctOption: 'C',
    explanationText: 'Initially: milk = \\(\\frac{2}{3} \\times 60 = 40\\) liters, water = 20 liters. Let \\(w\\) liters of water be added. The new milk to water ratio is \\(\\frac{40}{20 + w} = \\frac{1}{2}\\). Solving gives \\(80 = 20 + w \\implies w = 60\\) liters.'
  },
  {
    topic: 'profit-loss',
    difficulty: 0.72,
    questionText: 'An item is sold for Rs. 96 at a profit of 20%. What would be the profit or loss percent if it was sold for Rs. 72?',
    options: { A: '10% loss', B: '10% profit', C: '8% loss', D: '12% profit' },
    correctOption: 'A',
    explanationText: 'SP = Rs. 96, profit = 20%. So CP = \\(96 / 1.2 = Rs. 80\\). If new SP = Rs. 72, Loss = CP - SP = 80 - 72 = Rs. 8. Loss Percentage = \\((8 / 80) \\times 100 = 10\\)% loss.'
  },
  {
    topic: 'lcm-hcf',
    difficulty: 0.68,
    questionText: 'The product of two numbers is 2028 and their HCF is 13. Find their LCM.',
    options: { A: '156', B: '144', C: '26', D: '78' },
    correctOption: 'A',
    explanationText: 'We know that: \\(\\text{HCF} \\times \\text{LCM} = \\text{Product of two numbers}\\). Therefore, \\(13 \\times \\text{LCM} = 2028 \\implies \\text{LCM} = 2028 / 13 = 156\\).'
  }
];

questions.push(...arithmeticQuestionsData.map(q => ({
  ...q,
  examId: 'jnvst',
  section: 'arithmetic',
  tags: [q.topic, 'arithmetic'],
  isPYQ: Math.random() > 0.5,
  pyqYear: 2023,
  status: 'active'
})));

// ── Language Questions (15) ───────────────────────────────────────────
const languagePassages = [
  {
    passage: `Comprehension Passage 1:
Ants are tiny insects, but they are very strong. They live in large groups called colonies. In a colony, there are different types of ants. The queen ant lays eggs. The worker ants build nests, search for food, and protect the colony. Ants communicate with each other using chemicals called pheromones. They leave a chemical trail for other ants to follow when they find food.`,
    questions: [
      {
        topic: 'comprehension',
        difficulty: 0.25,
        questionText: 'According to the passage, what is a group of ants called?',
        options: { A: 'Colony', B: 'Flock', C: 'Herd', D: 'Pack' },
        correctOption: 'A',
        explanationText: 'The passage states: "They live in large groups called colonies."'
      },
      {
        topic: 'comprehension',
        difficulty: 0.4,
        questionText: 'What is the main job of the queen ant?',
        options: { A: 'Build nests', B: 'Search for food', C: 'Lay eggs', D: 'Protect the colony' },
        correctOption: 'C',
        explanationText: 'The passage states: "The queen ant lays eggs."'
      },
      {
        topic: 'comprehension',
        difficulty: 0.55,
        questionText: 'How do ants communicate with each other?',
        options: { A: 'By making sounds', B: 'By using chemical trails (pheromones)', C: 'By touching antennae', D: 'They do not communicate' },
        correctOption: 'B',
        explanationText: 'The passage states: "Ants communicate with each other using chemicals called pheromones."'
      }
    ]
  },
  {
    passage: `Comprehension Passage 2:
Yoga is an ancient practice that originated in India. It combines physical postures, breathing exercises, and meditation. Regular practice of yoga improves flexibility, strength, and balance. It also helps to reduce stress and improve mental focus. People of all ages can practice yoga to keep their mind and body healthy.`,
    questions: [
      {
        topic: 'comprehension',
        difficulty: 0.3,
        questionText: 'Where did yoga originate?',
        options: { A: 'China', B: 'India', C: 'Greece', D: 'Egypt' },
        correctOption: 'B',
        explanationText: 'The passage states: "Yoga is an ancient practice that originated in India."'
      },
      {
        topic: 'comprehension',
        difficulty: 0.5,
        questionText: 'Which of the following is NOT mentioned as a benefit of yoga?',
        options: { A: 'Improved flexibility', B: 'Reduced stress', C: 'Increased running speed', D: 'Improved mental focus' },
        correctOption: 'C',
        explanationText: 'The passage mentions flexibility, strength, balance, stress reduction, and mental focus, but does not mention running speed.'
      }
    ]
  }
];

// Add passage comprehension questions
languagePassages.forEach(p => {
  p.questions.forEach(q => {
    questions.push({
      examId: 'jnvst',
      section: 'language',
      topic: q.topic,
      difficulty: q.difficulty,
      questionText: `${p.passage}\n\nQuestion: ${q.questionText}`,
      options: q.options,
      correctOption: q.correctOption,
      explanationText: q.explanationText,
      tags: ['comprehension', 'language'],
      isPYQ: false,
      status: 'active'
    });
  });
});

// Add individual grammar/vocabulary questions to make it 15 questions
const grammarQuestions = [
  {
    topic: 'grammar',
    difficulty: 0.2,
    questionText: 'Choose the correct form of the verb to complete the sentence:\n"The children _______ playing in the park yesterday afternoon."',
    options: { A: 'is', B: 'are', C: 'was', D: 'were' },
    correctOption: 'D',
    explanationText: 'The subject "The children" is plural, and the sentence refers to a past time ("yesterday afternoon"), so the past plural verb "were" is correct.'
  },
  {
    topic: 'vocabulary',
    difficulty: 0.35,
    questionText: 'Choose the synonym of the word "PREVENT".',
    options: { A: 'Allow', B: 'Stop', C: 'Encourage', D: 'Start' },
    correctOption: 'B',
    explanationText: 'To prevent something means to stop it from happening. So "Stop" is the closest synonym.'
  },
  {
    topic: 'grammar',
    difficulty: 0.45,
    questionText: 'Fill in the blank with the correct preposition:\n"She is fond _______ reading adventure stories."',
    options: { A: 'of', B: 'off', C: 'with', D: 'at' },
    correctOption: 'A',
    explanationText: 'The adjective phrase "fond of" is idiomatic and means having a liking for something.'
  },
  {
    topic: 'vocabulary',
    difficulty: 0.5,
    questionText: 'Choose the antonym of the word "ANCIENT".',
    options: { A: 'Old', B: 'Modern', C: 'Historic', D: 'Traditional' },
    correctOption: 'B',
    explanationText: 'Ancient means very old, belonging to the distant past. Its opposite (antonym) is "Modern".'
  },
  {
    topic: 'fill-in-the-blanks',
    difficulty: 0.42,
    questionText: 'Fill in the blank with the most appropriate article:\n"He is _______ honorable member of the committee."',
    options: { A: 'a', B: 'an', C: 'the', D: 'no article' },
    correctOption: 'B',
    explanationText: 'The word "honorable" starts with a silent "h", so it begins with a vowel sound (/ɒ/). Therefore, we use the article "an".'
  },
  {
    topic: 'sentence-correction',
    difficulty: 0.6,
    questionText: 'Identify the grammatically correct sentence from the options below.',
    options: {
      A: 'Each of the students have done their homework.',
      B: 'Each of the students has done his homework.',
      C: 'Each of the students done their homework.',
      D: 'Each of the students have did their homework.'
    },
    correctOption: 'B',
    explanationText: '"Each" is a singular pronoun and requires a singular verb ("has") and singular pronoun ("his" or "her"). Option B is grammatically correct.'
  },
  {
    topic: 'vocabulary',
    difficulty: 0.65,
    questionText: 'What is the meaning of the idiom "A piece of cake"?',
    options: { A: 'A very easy task', B: 'A portion of food', C: 'A difficult challenge', D: 'A celebration' },
    correctOption: 'A',
    explanationText: 'The idiom "a piece of cake" refers to something that is very easy to do.'
  },
  {
    topic: 'grammar',
    difficulty: 0.7,
    questionText: 'Identify the type of noun underlined in the sentence:\n"The **wisdom** of the old man saved the village."',
    options: { A: 'Proper Noun', B: 'Common Noun', C: 'Collective Noun', D: 'Abstract Noun' },
    correctOption: 'D',
    explanationText: '"Wisdom" is an abstract noun because it refers to a quality, state, or concept that cannot be touched or seen physically.'
  },
  {
    topic: 'sentence-correction',
    difficulty: 0.75,
    questionText: 'Select the sentence that has correct punctuation.',
    options: {
      A: '"Where are you going?" asked mother.',
      B: 'Where are you going, asked mother?',
      C: '"Where are you going"? asked mother.',
      D: 'Where are you going asked mother.'
    },
    correctOption: 'A',
    explanationText: 'In direct speech, punctuation marks like question marks must go inside the double quotation marks, and a comma or period follows the speech tag. Option A is correctly punctuated.'
  },
  {
    topic: 'vocabulary',
    difficulty: 0.8,
    questionText: 'Choose the correct spelled word.',
    options: { A: 'Receive', B: 'Recieve', C: 'Receve', D: 'Recive' },
    correctOption: 'A',
    explanationText: 'The spelling rule is "i before e except after c". Therefore, "Receive" is spelling-correct.'
  }
];

grammarQuestions.forEach(q => {
  questions.push({
    ...q,
    examId: 'jnvst',
    section: 'language',
    tags: [q.topic, 'grammar', 'language'],
    isPYQ: false,
    status: 'active'
  });
});

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding JNVST to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Create indexes
    await db.collection('questions').createIndex({ examId: 1, section: 1, status: 1, difficulty: 1 });

    // 2. Upsert Exam
    await db.collection('exams').updateOne(
      { _id: JNVST_EXAM._id },
      { $set: JNVST_EXAM },
      { upsert: true }
    );
    console.log("✅ JNVST Exam Definition Upserted.");

    // 3. Clear Old JNVST Questions
    const deleteResult = await db.collection('questions').deleteMany({ examId: 'jnvst' });
    console.log(`🧹 Deleted ${deleteResult.deletedCount} old JNVST questions.`);

    // 4. Bulk Insert Questions
    const insertResult = await db.collection('questions').insertMany(
      questions.map(q => ({
        ...q,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    console.log(`🎉 Seeded ${insertResult.insertedCount} JNVST questions successfully!`);

  } catch (error) {
    console.error("❌ Error seeding JNVST:", error);
  } finally {
    await client.close();
  }
}

runSeed();
