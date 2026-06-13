import { createSeededRandom, pick, shuffle, resolveDifficulty } from '../shared.js';
import { NOUNS, NOT_NOUNS, NOUN_SENTENCES } from '../content.js';

let uidCounter = 0;

function normalizeWord(value) {
  return String(value || '').toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
}

function createSentenceTokens(sentence, targetWords) {
  const targetSet = new Set(targetWords.map(normalizeWord));

  return sentence.split(/\s+/).map((rawWord, index) => {
    const leading = rawWord.match(/^[^A-Za-z0-9]*/)?.[0] || '';
    const trailing = rawWord.match(/[^A-Za-z0-9]*$/)?.[0] || '';
    const text = rawWord.slice(leading.length, rawWord.length - trailing.length);
    const normalized = normalizeWord(text);

    return {
      id: `word_${index}_${normalized || 'token'}`,
      text,
      display: text,
      leading,
      trailing,
      selectable: true,
      isTarget: targetSet.has(normalized)
    };
  });
}

export function generateNounQuestion(template = {}, variables = {}, dbPool = null) {
  const random = createSeededRandom(variables.seed || Date.now());
  const difficulty = resolveDifficulty(variables);
  
  let sentences = NOUN_SENTENCES;
  if (dbPool && dbPool.pools?.noun_sentences) {
    sentences = dbPool.pools.noun_sentences;
  }
  
  // Decide question sub-type based on templateId
  const templateId = template.id || 'grammar.noun.identify';
  
  if (templateId.includes('classify')) {
    // Is it a person, place, animal, or thing?
    const categories = ['people', 'places', 'animals', 'things'];
    const selectedCategory = pick(categories, random);
    const word = pick(NOUNS[selectedCategory], random);
    
    const categoryLabels = {
      people: 'person',
      places: 'place',
      animals: 'animal',
      things: 'thing'
    };
    
    const correctAnswer = categoryLabels[selectedCategory];
    const options = ['person', 'place', 'animal', 'thing'];
    const correctAnswerIndex = options.indexOf(correctAnswer);
    
    return {
      id: `noun_classify_${Date.now()}_${++uidCounter}`,
      type: 'mcq',
      questionText: `Is the word **${word}** a person, place, animal, or thing?`,
      parts: [
        { type: 'text', content: `Is the word **${word}** a person, place, animal, or thing?` }
      ],
      options,
      correctAnswerIndex,
      correctAnswerText: correctAnswer,
      solution: {
        sections: [
          { type: 'text', content: `The word **${word}** refers to a **${correctAnswer}**.` },
          { type: 'text', content: `A noun is a word that names a person, place, animal, or thing.` }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'noun',
        difficulty,
        word,
        category: selectedCategory
      }
    };
  }
  
  if (templateId.includes('sort') || (difficulty === 'hard' && random() > 0.6)) {
    // Sort words into Nouns vs Not Nouns
    const nounsList = shuffle(Object.values(NOUNS).flat(), random).slice(0, 2);
    const notNounsList = shuffle(NOT_NOUNS, random).slice(0, 2);
    
    const items = [
      { id: 'n1', content: nounsList[0] },
      { id: 'n2', content: nounsList[1] },
      { id: 'nn1', content: notNounsList[0] },
      { id: 'nn2', content: notNounsList[1] }
    ];
    
    const shuffledItems = shuffle(items, random);
    
    const categories = [
      { id: 'noun', label: 'Nouns' },
      { id: 'not_noun', label: 'Not Nouns' }
    ];
    
    const answer = {
      n1: 'noun',
      n2: 'noun',
      nn1: 'not_noun',
      nn2: 'not_noun'
    };
    
    return {
      id: `noun_sort_${Date.now()}_${++uidCounter}`,
      type: 'categorization',
      questionText: 'Sort these words into Nouns and Not Nouns.',
      parts: [
        { type: 'text', content: 'Drag each word into the correct category zone.' }
      ],
      categories,
      items: shuffledItems,
      answer,
      solution: {
        sections: [
          { type: 'text', content: `**Nouns** name a person, place, animal, or thing: **${nounsList.join(', ')}**.` },
          { type: 'text', content: `**Not Nouns** are action words or describing words: **${notNounsList.join(', ')}**.` }
        ]
      },
      metadata: {
        subject: 'english',
        topic: 'grammar',
        templateId,
        engine: 'noun',
        difficulty
      }
    };
  }
  
  // Pick noun words directly from a sentence.
  const selectedSentence = pick(sentences, random);
  const tokens = createSentenceTokens(selectedSentence.text, selectedSentence.nouns);
  const targetTokenIds = tokens.filter((token) => token.isTarget).map((token) => token.id).join('|');
  const nounList = selectedSentence.nouns.join(' and ');
  
  return {
    id: `noun_identify_${Date.now()}_${++uidCounter}`,
    type: 'fillInTheBlank',
    // questionText: selectedSentence.nouns.length > 1
    //   ? 'Select the nouns in the sentence.'
    //   : 'Select the noun in the sentence.',
    parts: [
      {
        type: 'text',
        content: selectedSentence.nouns.length > 1
          ? 'Select the nouns in the sentence.'
          : 'Select the noun in the sentence.',
        isVertical: true,
        style: {
          fontSize: '28px',
          fontWeight: 400,
          color: '#000',
          textAlign: 'left'
        }
      },
      {
        type: 'pick_from_sentence',
        answerKey: 'selectedTokens',
        sentence: selectedSentence.text,
        tokens,
        multiSelect: selectedSentence.nouns.length > 1,
        fontSize: 42,
        isVertical: true,
        style: {
          marginTop: 18,
          marginBottom: 8
        }
      }
    ],
    options: [],
    answer: {
      selectedTokens: targetTokenIds
    },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ selectedTokens: targetTokenIds }),
    solution: {
      sections: [
        { type: 'text', content: `The word${selectedSentence.nouns.length > 1 ? 's' : ''} **${nounList}** ${selectedSentence.nouns.length > 1 ? 'are nouns' : 'is a noun'} because ${selectedSentence.nouns.length > 1 ? 'they name' : 'it names'} a person, place, animal, or thing.` },
        { type: 'text', content: `A noun names a person, place, animal, or thing.` }
      ]
    },
    metadata: {
      subject: 'english',
      topic: 'grammar',
      templateId,
      engine: 'noun',
      difficulty,
      sentence: selectedSentence.text,
      nouns: selectedSentence.nouns,
      interaction: 'pick_from_sentence'
    }
  };
}
