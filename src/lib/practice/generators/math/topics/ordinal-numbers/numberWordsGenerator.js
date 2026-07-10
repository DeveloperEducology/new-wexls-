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

const units = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberToWords(num) {
  if (num < 10) return units[num];
  if (num >= 10 && num < 20) return teens[num - 10];
  if (num >= 20 && num < 100) {
    const unitPart = num % 10;
    return tens[Math.floor(num / 10)] + (unitPart !== 0 ? '-' + units[unitPart] : '');
  }
  if (num === 100) return 'one hundred';
  return String(num);
}

export async function generateNumberWordsQuestion(templateDoc, seed) {
  const rng = seededRandom(seed);

  // 1. Resolve limits
  const minVal = templateDoc.variables?.numberRange?.min ?? 0;
  const maxVal = templateDoc.variables?.numberRange?.max ?? 100;

  // 2. Select target correct number
  const correctNumber = Math.floor(rng() * (maxVal - minVal + 1)) + minVal;
  const numberWord = numberToWords(correctNumber);

  // 3. Generate 3 unique distractors (nearby numbers)
  const distractorSet = new Set();
  const offsets = [-1, 1, -2, 2, -10, 10, -5, 5];
  
  // Try nearby numbers first
  for (const offset of shuffleArray(offsets, rng)) {
    const val = correctNumber + offset;
    if (val >= minVal && val <= maxVal && val !== correctNumber) {
      distractorSet.add(val);
      if (distractorSet.size === 3) break;
    }
  }

  // Fill up with completely random numbers if not enough distractors found
  while (distractorSet.size < 3) {
    const randVal = Math.floor(rng() * (maxVal - minVal + 1)) + minVal;
    if (randVal !== correctNumber) {
      distractorSet.add(randVal);
    }
  }

  const distractors = Array.from(distractorSet);

  // 4. Build options list
  const optionsList = shuffleArray([
    { val: correctNumber, isCorrect: true },
    ...distractors.map(d => ({ val: d, isCorrect: false }))
  ], rng);

  // 5. Assemble final question payload matching universal schema
  return {
    type: 'mcq',
    interaction: 'mcq',
    questionText: `Write the number ${numberWord} using digits`,
    parts: [
      {
        type: 'text',
        content: 'How do you write this number using digits?',
        style: { fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }
      },
      {
        type: 'text',
        content: numberWord,
        style: {
          fontSize: '28px',
          fontWeight: '800',
          color: '#2563eb',
          background: '#eff6ff',
          padding: '12px 28px',
          borderRadius: '16px',
          border: '2px dashed #bfdbfe',
          display: 'inline-block',
          marginBottom: '24px',
          letterSpacing: '0.5px'
        }
      }
    ],
    options: optionsList.map(o => ({
      id: String(o.val),
      label: String(o.val),
      imageUrl: null,
      image: null,
      audioUrl: `/api/tts?voice=Puck&text=${o.val}`,
      isCorrect: o.isCorrect
    })),
    correctAnswerIndex: optionsList.findIndex(o => o.isCorrect),
    answer: String(correctNumber),
    correctAnswer: String(correctNumber),
    correctAnswerText: String(correctNumber),
    explanation: {
      sections: [
        {
          type: 'text',
          content: `Correct! '${numberWord}' is written as ${correctNumber}.`
        }
      ]
    },
    schema: {
      templateId: templateDoc.id,
      subject: templateDoc.subject || 'math',
      topic: templateDoc.topic || 'addition',
      grade: templateDoc.grade || 'grade-1',
      skillId: templateDoc.skillId || 'template-writing-numbers-in-words',
      variables: {
        numberWord: numberWord,
        correctNumber: String(correctNumber)
      }
    }
  };
}
