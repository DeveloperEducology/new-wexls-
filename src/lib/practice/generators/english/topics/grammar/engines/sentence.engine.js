import { createSeededRandom, pick, shuffle, resolveDifficulty } from '../shared.js';
import { PUNCTUATION_CASES, CAPITALIZATION_CASES, SENTENCE_TYPE_CASES } from '../content.js';

let uidCounter = 0;

export function generateSentenceQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const difficulty = resolveDifficulty(variables);
  const templateId = template.id || 'grammar.sentence.type';
  
  if (templateId.includes('punctuation') || (difficulty === 'medium' && random() > 0.5)) {
    // Choose correct end punctuation
    const selectedCase = pick(PUNCTUATION_CASES, random);
    const options = shuffle(selectedCase.options, random);
    const correctAnswerIndex = options.indexOf(selectedCase.answer);
    
    return {
      id: `sentence_punctuation_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: `Which punctuation mark is missing at the end of the sentence?`,
      parts: [
        { type: 'text', content: 'Which punctuation mark is missing at the end of this sentence?' },
        { type: 'text', content: `*"${selectedCase.text} ___"*`, style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: selectedCase.answer,
      solution: {
        sections: [
          { type: 'text', content: `The missing punctuation mark is a **${selectedCase.name} (${selectedCase.answer})**.` },
          { type: 'text', content: selectedCase.hint }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'sentence',
        difficulty,
        sentence: selectedCase.text,
        punctuationType: selectedCase.type
      }
    };
  }
  
  if (templateId.includes('capitalization') || (difficulty === 'hard' && random() > 0.5)) {
    // Choose the correctly capitalized sentence
    const selectedCase = pick(CAPITALIZATION_CASES, random);
    const options = shuffle(selectedCase.options, random);
    const correctAnswerIndex = options.indexOf(selectedCase.correct);
    
    return {
      id: `sentence_capitalization_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: `Which sentence is written with correct capitalization?`,
      parts: [
        { type: 'text', content: 'Which sentence is written with correct capitalization?' }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: selectedCase.correct,
      solution: {
        sections: [
          { type: 'text', content: `The correctly capitalized sentence is:` },
          { type: 'text', content: `*"${selectedCase.correct}"*`, style: { fontStyle: 'italic', fontWeight: 'bold', color: '#16a34a' } },
          { type: 'text', content: selectedCase.hint }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'sentence',
        difficulty
      }
    };
  }
  
  // Identify sentence type: statement, question, or exclamation
  const selectedCase = pick(SENTENCE_TYPE_CASES, random);
  const options = ['statement', 'question', 'exclamation'];
  const correctAnswerIndex = options.indexOf(selectedCase.answer);
  
  return {
    id: `sentence_type_${Date.now()}_${++uidCounter}`,
    type: 'mcq',
    questionText: `Is this sentence a statement, a question, or an exclamation?`,
    parts: [
      { type: 'text', content: 'Is this sentence a statement, a question, or an exclamation?' },
      { type: 'text', content: `*"${selectedCase.text}"*`, style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
    ],
    options,
    correctAnswerIndex,
    correctAnswerText: selectedCase.answer,
    solution: {
      sections: [
        { type: 'text', content: `The sentence is a **${selectedCase.answer}**.` },
        { type: 'text', content: selectedCase.hint }
      ]
    },
    metadata: {
      subject: 'english',
      topic: 'grammar',
      templateId,
      engine: 'sentence',
      difficulty,
      sentence: selectedCase.text
    }
  };
}
