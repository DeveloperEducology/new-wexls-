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
    [a[j], a[i]] = [a[i], a[j]];
  }
  return a;
}

export function generateSequencesQuestion(templateDoc, seed) {
  const rng = seededRandom(seed);

  // 1. Determine direction (up or down)
  const isUp = rng() > 0.5;
  const step = isUp ? 100 : -100;

  // 2. Select start value
  let startValue;
  if (isUp) {
    // Range 100 to 500
    startValue = (Math.floor(rng() * 5) + 1) * 100;
  } else {
    // Range 500 to 900
    startValue = (Math.floor(rng() * 5) + 5) * 100;
  }

  // 3. Build sequence of 5 elements
  const sequence = [];
  for (let i = 0; i < 5; i++) {
    sequence.push(startValue + i * step);
  }

  // 4. Select a random index for the blank (index 1, 2, or 3 are best for inline sequence questions)
  const blankIdx = Math.floor(rng() * 3) + 1; // 1, 2, or 3
  const correctAnswerValue = String(sequence[blankIdx]);

  // 5. Construct display sequence string
  const displayItems = sequence.map((val, idx) => {
    if (idx === blankIdx) return '[[blank1]]';
    return String(val);
  });
  
  const displaySequenceString = displayItems.join(',  ');

  // 6. Build explanation text
  const stepText = isUp ? 'counts up' : 'counts down';
  const opText = isUp ? '+' : '-';
  const prevVal = sequence[blankIdx - 1];
  const explanationText = `This sequence ${stepText} by 100. ${prevVal} ${opText} 100 = ${correctAnswerValue}.`;

  // 7. The key: questionText uses \n\n to split prompt from sequence row.
  //    FillInTheBlankRenderer splits on \n\n and passes paragraph[1] through
  //    InlineTextWithBlanks — which converts [] → [[blank1]] → inline <input>.
  const questionText = `Type the missing number in this sequence:\n\n${displaySequenceString}`;

  // 8. Return payload matching universal fill_blank schema
  return {
    type: 'fill_blank',
    interaction: 'fill_blank',
    optionsType: 'fillInTheBlank',
    questionText,
    parts: [],
    answer: {
      blank1: correctAnswerValue
    },
    correctAnswer: {
      blank1: correctAnswerValue
    },
    correctAnswerText: correctAnswerValue,
    validationRules: [
      {
        type: 'exact_match',
        target: 'blank1',
        value: correctAnswerValue
      }
    ],
    explanation: {
      sections: [
        {
          type: 'text',
          content: explanationText
        }
      ]
    },
    schema: {
      templateId: templateDoc.id,
      subject: templateDoc.subject || 'math',
      topic: templateDoc.topic || 'counting',
      grade: templateDoc.grade || 'grade-1',
      skillId: templateDoc.skillId || 'g1-a-19',
      variables: {
        correctAnswer: correctAnswerValue,
        sequence: sequence.join(',')
      }
    }
  };
}
