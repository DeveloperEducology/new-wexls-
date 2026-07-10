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

export function generateAdditionBuilderQuestion(templateDoc, seed) {
  const rng = seededRandom(seed);

  // 1. Extract fixed addend from template ID (adding-X)
  const templateId = templateDoc.id || '';
  const match = templateId.match(/adding-(\d+)/);
  const fixedAddend = match ? parseInt(match[1], 10) : 1;

  // 2. Select the other addend (y) between 0 and 10
  const otherAddend = Math.floor(rng() * 11); // 0 to 10

  // 3. Decide equation order randomly
  const isFixedFirst = rng() > 0.5;
  const a = isFixedFirst ? fixedAddend : otherAddend;
  const b = isFixedFirst ? otherAddend : fixedAddend;
  const correctAnswerValue = String(a + b);

  // 4. Return payload matching universal fill_blank schema
  return {
    type: 'fill_blank',
    interaction: 'fill_blank',
    optionsType: 'fillInTheBlank',
    questionText: `Add:\n\n${a} + ${b} = [[blank1]]`,
    parts: [
      {
        type: 'text',
        content: 'Add:',
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
          content: `Add the two numbers together: ${a} + ${b} = ${correctAnswerValue}.`
        }
      ]
    },
    schema: {
      templateId: templateId,
      subject: 'math',
      topic: 'addition',
      grade: 'grade-1',
      skillId: templateDoc.skillId || `g1-d-${fixedAddend === 0 ? 10 : fixedAddend}`,
      variables: {
        a: String(a),
        b: String(b),
        correctAnswer: correctAnswerValue
      }
    }
  };
}
