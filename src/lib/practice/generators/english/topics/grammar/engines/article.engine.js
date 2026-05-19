import { createSeededRandom, pick, shuffle, resolveDifficulty } from '../shared.js';
import { ARTICLE_WORDS, ARTICLE_SENTENCES } from '../content.js';

let uidCounter = 0;

export function generateArticleQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const difficulty = resolveDifficulty(variables);
  const templateId = template.id || 'grammar.article.choose';
  
  // Decide question between standard a/an choice or sentence filling
  const selectedCase = pick(ARTICLE_WORDS, random);
  const options = ['a', 'an'];
  const correctAnswerIndex = options.indexOf(selectedCase.article);
  
  if (difficulty === 'hard' || templateId.includes('sentence')) {
    // Fill in a sentence
    const selectedSentence = pick(ARTICLE_SENTENCES, random);
    const options = ['a', 'an'];
    const correctAnswerIndex = options.indexOf(selectedSentence.article);
    
    return {
      id: `article_sentence_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: `Complete the sentence with the correct article (a or an):`,
      parts: [
        { type: 'text', content: 'Complete the sentence with the correct article (a or an):' },
        { type: 'text', content: selectedSentence.text.replace('___', '[blank:ans]'), style: { fontStyle: 'italic', margin: '14px 0', fontSize: '22px', color: '#0369a1' } }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: selectedSentence.article,
      solution: {
        sections: [
          { type: 'text', content: `The correct article is **${selectedSentence.article}**.` },
          { type: 'text', content: selectedSentence.hint }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'article',
        difficulty,
        word: selectedSentence.word
      }
    };
  }
  
  return {
    id: `article_choose_${Date.now()}_${++uidCounter}`,
    type: 'mcq',
    questionText: `Choose the correct article for the word:`,
    parts: [
      { type: 'text', content: 'Choose the correct article for this word:' },
      { type: 'text', content: `___ ${selectedCase.word}`, style: { margin: '14px 0', fontSize: '28px', fontWeight: 'bold', color: '#0f766e' } }
    ],
    options,
    correctAnswerIndex,
    correctAnswerText: selectedCase.article,
    solution: {
      sections: [
        { type: 'text', content: `We use **${selectedCase.article}** because **${selectedCase.word}** starts with a **${selectedCase.type}** sound.` },
        { type: 'text', content: `Use **an** before vowel sounds (a, e, i, o, u) and **a** before consonant sounds.` }
      ]
    },
    metadata: {
      subject: 'english',
      topic: 'grammar',
      templateId,
      engine: 'article',
      difficulty,
      word: selectedCase.word,
      articleType: selectedCase.type
    }
  };
}
