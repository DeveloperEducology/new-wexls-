import { createSeededRandom, pick, shuffle, resolveDifficulty } from '../shared.js';
import { PRONOUNS, PRONOUN_FILL_CASES } from '../content.js';

let uidCounter = 0;

export function generatePronounQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const difficulty = resolveDifficulty(variables);
  const templateId = template.id || 'grammar.pronoun.choose';
  
  if (templateId.includes('replace') || (difficulty !== 'easy' && random() > 0.5)) {
    // Replace noun with pronoun
    const keys = ['he', 'she', 'they', 'it'];
    const targetKey = pick(keys, random);
    const targetGroup = PRONOUNS[targetKey];
    const nounPhrase = pick(targetGroup.replaceables, random);
    
    // Distractors are other pronouns
    const distractors = keys.filter(k => k !== targetKey);
    const options = shuffle([targetKey, ...distractors], random);
    const correctAnswerIndex = options.indexOf(targetKey);
    
    const sentence = `${nounPhrase} went to the park.`;
    
    return {
      id: `pronoun_replace_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: `Which pronoun can replace the bold noun phrase?`,
      parts: [
        { type: 'text', content: 'Which pronoun can replace the bold noun phrase?' },
        { type: 'text', content: `**${nounPhrase}** went to the park.`, style: { margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: targetKey,
      solution: {
        sections: [
          { type: 'text', content: `**${targetGroup.label}** is the correct pronoun to replace **${nounPhrase}**.` },
          { type: 'text', content: `We use **${targetGroup.label}** because **${nounPhrase}** refers to a **${targetGroup.refersTo.replaceAll('-', ' ')}**.` }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'pronoun',
        difficulty,
        nounPhrase,
        pronoun: targetKey
      }
    };
  }
  
  // Choose correct pronoun to complete a sentence
  const selectedCase = pick(PRONOUN_FILL_CASES, random);
  const options = shuffle(selectedCase.options, random);
  const correctAnswerIndex = options.indexOf(selectedCase.correct);
  
  return {
    id: `pronoun_choose_${Date.now()}_${++uidCounter}`,
    type: 'mcq',
    questionText: `Choose the correct pronoun to complete the sentence:`,
    parts: [
      { type: 'text', content: `Choose the correct pronoun to describe **${selectedCase.noun}**:` },
      { type: 'text', content: `*"${selectedCase.text}"*`, style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
    ],
    options,
    correctAnswerIndex,
    correctAnswerText: selectedCase.correct,
    solution: {
      sections: [
        { type: 'text', content: `We use **${selectedCase.correct}** to complete the sentence.` },
        { type: 'text', content: `**${selectedCase.correct}** matches **${selectedCase.noun}** correctly.` }
      ]
    },
    metadata: {
      subject: 'english',
      topic: 'grammar',
      templateId,
      engine: 'pronoun',
      difficulty,
      noun: selectedCase.noun,
      pronoun: selectedCase.correct
    }
  };
}
