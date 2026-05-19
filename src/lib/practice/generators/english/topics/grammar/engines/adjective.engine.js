import { createSeededRandom, pick, shuffle, resolveDifficulty } from '../shared.js';
import { ADJECTIVES, ADJECTIVE_SENTENCES } from '../content.js';

let uidCounter = 0;

export function generateAdjectiveQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const difficulty = resolveDifficulty(variables);
  const templateId = template.id || 'grammar.adjective.identify';
  
  if (difficulty !== 'easy' && random() > 0.5) {
    // Identify adjective in a sentence
    const selectedSentence = pick(ADJECTIVE_SENTENCES, random);
    const options = shuffle([selectedSentence.adjective, ...selectedSentence.distractors], random);
    const correctAnswerIndex = options.indexOf(selectedSentence.adjective);
    
    return {
      id: `adjective_find_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: 'Which word in the sentence is an adjective (describing word)?',
      parts: [
        { type: 'text', content: 'Which word in this sentence is an adjective (describing word)?' },
        { type: 'text', content: `*"${selectedSentence.text}"*`, style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: selectedSentence.adjective,
      solution: {
        sections: [
          { type: 'text', content: `The word **${selectedSentence.adjective}** is an adjective because it describes a noun.` },
          { type: 'text', content: `Adjectives give us details about a noun, like its size, color, or feeling.` }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'adjective',
        difficulty,
        sentence: selectedSentence.text
      }
    };
  }
  
  // Identify describing word from a list of words
  const categories = ['colors', 'sizes', 'feelings'];
  const selectedCategory = pick(categories, random);
  const targetAdjective = pick(ADJECTIVES[selectedCategory], random);
  
  const distractors = ['run', 'teacher', 'pencil', 'jump', 'hospital', 'eat', 'softly', 'he'];
  const selectedDistractors = shuffle(distractors, random).slice(0, 3);
  
  const options = shuffle([targetAdjective, ...selectedDistractors], random);
  const correctAnswerIndex = options.indexOf(targetAdjective);
  
  return {
    id: `adjective_identify_${Date.now()}_${++uidCounter}`,
    type: 'mcq',
    questionText: 'Which word is a describing word (adjective)?',
    parts: [
      { type: 'text', content: `Which word is a describing word (adjective) for **${selectedCategory}**?` }
    ],
    options,
    correctAnswerIndex,
    correctAnswerText: targetAdjective,
    solution: {
      sections: [
        { type: 'text', content: `The word **${targetAdjective}** is an adjective that describes **${selectedCategory.slice(0, -1)}**.` },
        { type: 'text', content: `An adjective is a describing word that gives more information about a noun.` }
      ]
    },
    metadata: {
      subject: 'english',
      topic: 'grammar',
      templateId,
      engine: 'adjective',
      difficulty,
      adjective: targetAdjective,
      category: selectedCategory
    }
  };
}
