import { createSeededRandom, pick, shuffle, resolveDifficulty } from '../shared.js';
import { VERBS, VERB_SENTENCES, getVerbTenseCases } from '../content.js';

let uidCounter = 0;

export function generateVerbQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const difficulty = resolveDifficulty(variables);
  const templateId = template.id || 'grammar.verb.identify';
  
  if (templateId.includes('present-past') || (difficulty === 'hard' && random() > 0.5)) {
    // Choose present vs past tense verb based on temporal context (yesterday, tomorrow, today)
    const verbList = [...VERBS.easy, ...VERBS.medium];
    const selectedVerb = pick(verbList, random);
    
    const tenseCases = getVerbTenseCases(selectedVerb);
    const selectedCase = pick(tenseCases, random);
    const options = shuffle(selectedCase.options, random);
    const correctAnswerIndex = options.indexOf(selectedCase.answer);
    
    return {
      id: `verb_tense_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: `Complete the sentence with the correct verb:`,
      parts: [
        { type: 'text', content: 'Complete the sentence with the correct verb tense:' },
        { type: 'text', content: `${selectedCase.prefix} [blank:ans] ${selectedCase.suffix}`, style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: selectedCase.answer,
      solution: {
        sections: [
          { type: 'text', content: `The correct verb is **${selectedCase.answer}**.` },
          { type: 'text', content: selectedCase.hint }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'verb',
        difficulty,
        verb: selectedVerb.base
      }
    };
  }
  
  if (templateId.includes('sentence') || (difficulty === 'medium' && random() > 0.5)) {
    // Find the verb in a sentence
    const selectedSentence = pick(VERB_SENTENCES, random);
    const selectedDistractors = shuffle(selectedSentence.distractors, random).slice(0, 3);
    const options = shuffle([selectedSentence.verb, ...selectedDistractors], random);
    const correctAnswerIndex = options.indexOf(selectedSentence.verb);
    
    return {
      id: `verb_find_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: 'Which word in the sentence is a verb?',
      parts: [
        { type: 'text', content: 'Which word in this sentence is a verb?' },
        { type: 'text', content: `*"${selectedSentence.text}"*`, style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: selectedSentence.verb,
      solution: {
        sections: [
          { type: 'text', content: `The word **${selectedSentence.verb}** is a verb because it describes an action.` },
          { type: 'text', content: `Verbs are action words that show what the subject is doing.` }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'verb',
        difficulty,
        sentence: selectedSentence.text
      }
    };
  }
  
  // Identify action word from a list of words
  const verbPool = VERBS[difficulty] || VERBS.easy;
  const targetVerb = pick(verbPool, random).base;
  
  const distractors = ['happy', 'teacher', 'pencil', 'yellow', 'beautiful', 'store', 'book', 'quickly'];
  const selectedDistractors = shuffle(distractors, random).slice(0, 3);
  
  const options = shuffle([targetVerb, ...selectedDistractors], random);
  const correctAnswerIndex = options.indexOf(targetVerb);
  
  return {
    id: `verb_identify_${Date.now()}_${++uidCounter}`,
    type: 'mcq',
    questionText: 'Which word is an action verb?',
    parts: [
      { type: 'text', content: 'Which word is an action verb?' }
    ],
    options,
    correctAnswerIndex,
    correctAnswerText: targetVerb,
    solution: {
      sections: [
        { type: 'text', content: `The word **${targetVerb}** is an action verb.` },
        { type: 'text', content: `Action verbs show actions like movement, thinking, or doing things.` }
      ]
    },
    metadata: {
      subject: 'english',
      topic: 'grammar',
      templateId,
      engine: 'verb',
      difficulty,
      verb: targetVerb
    }
  };
}
