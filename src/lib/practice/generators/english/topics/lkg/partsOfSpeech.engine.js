import { ukgPartsOfSpeechPool, ukgVerbScenarios } from './partsOfSpeech.pool.js';

function createRandom(seed) {
  let value = 2166136261;
  for (const character of String(seed)) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function shuffle(random, list) {
  const result = [...list];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  }
  return result;
}

function findWord(label, dbPool = null) {
  if (dbPool) {
    for (const categoryItems of Object.values(dbPool.pools || {})) {
      const found = categoryItems.find(item => item.label === label);
      if (found) return found;
    }
    if (Array.isArray(dbPool.contextOnly)) {
      const found = dbPool.contextOnly.find(item => item.label === label);
      if (found) return found;
    }
  }
  return Object.values(ukgPartsOfSpeechPool)
    .flat()
    .find((item) => item.label === label);
}

function getCategoryItems(category, activeMode, dbPool) {
  if (dbPool && dbPool.pools && dbPool.pools[category]) {
    let items = [...dbPool.pools[category]];
    const isSentenceMode = activeMode === 'sentence' || activeMode === 'complete_sentence' || activeMode === 'noun_action';
    
    if (isSentenceMode && Array.isArray(dbPool.contextOnly)) {
      const singularCat = category.replace(/s$/, ''); // e.g. 'nouns' -> 'noun'
      const contextItems = dbPool.contextOnly.filter(item => {
        if (item.active === false) return false;
        if (Array.isArray(item.partsOfSpeech)) {
          return item.partsOfSpeech.includes(singularCat);
        }
        return item.originalCategory === category;
      });
      items = [...items, ...contextItems];
    }
    
    items = items.filter(item => item.active !== false);
    
    if (!isSentenceMode) {
      items = items.filter(item => item.excludeFromIsolatedIdentification !== true);
    }
    
    const isVisual = activeMode === 'identify_visual';
    if (isVisual) {
      items = items.filter(item => item.imageUrl && item.assetStatus?.image !== 'needs_review');
    }
    
    if (items.length > 0) {
      return items;
    }
  }
  return ukgPartsOfSpeechPool[category] || [];
}

function makeOptions(random, items, visual = false) {
  return shuffle(random, items).map((item) => ({
    id: item.id,
    label: item.label,
    emoji: visual ? (item.emoji || undefined) : undefined,
    imageUrl: visual ? (item.imageUrl || undefined) : undefined,
    category: item.id.split('_')[0]
  }));
}

function makeQuestion({
  seed,
  mode,
  questionText,
  options,
  correctIds,
  explanation,
  visualPrompt,
  multiSelect = false
}) {
  const answer = correctIds
    .map((id) => options.findIndex((option) => option.id === id))
    .filter((index) => index >= 0);

  return {
    id: `english_ukg_verbs_${mode}_${seed}`,
    type: 'mcq',
    interaction: Math.random > 0.5 && multiSelect ? 'multi_select' : (multiSelect ? 'multi_select' : 'choice'),
    multiSelect,
    questionText,
    voice: 'Puck',
    generateAudio: 'all',
    options,
    answer: multiSelect ? answer : answer[0],
    correctAnswerIndex: multiSelect ? answer : answer[0],
    correctAnswerIndices: multiSelect ? answer : undefined,
    explanation,
    parts: [
      { type: 'text', content: questionText },
      ...(visualPrompt
        ? [{
            type: 'text',
            content: `<div style="font-size:clamp(64px,12vw,120px);line-height:1;text-align:center;padding:10px">${visualPrompt}</div>`
          }]
        : [])
    ],
    metaConfig: { readable: true, readOptions: true },
    metadata: {
      grade: 'UKG',
      chapterId: 'english-ukg-verbs',
      chapterTitle: 'Verbs',
      targetCategory: 'verbs',
      mode,
      misconceptionMap: {
        noun: 'verb_to_noun_confusion',
        adjective: 'verb_to_adjective_confusion'
      }
    }
  };
}

function identifyVerb(random, seed, dbPool, visual = false) {
  const activeMode = visual ? 'identify_visual' : 'identify_text';
  const correct = pick(random, getCategoryItems('verbs', activeMode, dbPool));
  const options = makeOptions(random, [
    correct,
    pick(random, getCategoryItems('nouns', activeMode, dbPool)),
    pick(random, getCategoryItems('adjectives', activeMode, dbPool))
  ], visual);
  return makeQuestion({
    seed,
    mode: activeMode,
    questionText: visual ? 'Which picture shows an action?' : 'Find the verb. A verb shows an action.',
    options,
    correctIds: [correct.id],
    explanation: `${correct.label} is a verb because it shows an action.`
  });
}

function findVerbInSentence(random, seed, dbPool) {
  const scenario = pick(random, ukgVerbScenarios);
  const correct = findWord(scenario.correct, dbPool);
  const noun = pick(random, getCategoryItems('nouns', 'sentence', dbPool));
  const adjective = pick(random, getCategoryItems('adjectives', 'sentence', dbPool));
  return makeQuestion({
    seed,
    mode: 'sentence',
    questionText: `Find the action word: "${scenario.subject} can ${correct.label}."`,
    options: makeOptions(random, [correct, noun, adjective]),
    correctIds: [correct.id],
    explanation: `${correct.label} tells what the subject can do.`
  });
}

function scenarioQuestion(random, seed, mode, questionText, dbPool) {
  const scenario = pick(random, ukgVerbScenarios);
  const correct = findWord(scenario.correct, dbPool);
  const options = makeOptions(random, [
    correct,
    ...scenario.distractors.slice(0, 3).map(label => findWord(label, dbPool))
  ]);
  return makeQuestion({
    seed,
    mode,
    questionText: questionText(scenario),
    visualPrompt: scenario.emoji,
    options,
    correctIds: [correct.id],
    explanation: `${scenario.subject} can ${correct.label}.`
  });
}

function findNotVerb(random, seed, dbPool) {
  const correct = pick(random, [
    ...getCategoryItems('nouns', 'not_verb', dbPool),
    ...getCategoryItems('adjectives', 'not_verb', dbPool)
  ]);
  const options = makeOptions(random, [
    correct,
    ...shuffle(random, getCategoryItems('verbs', 'not_verb', dbPool)).slice(0, 3)
  ]);
  return makeQuestion({
    seed,
    mode: 'not_verb',
    questionText: 'Which word is not a verb?',
    options,
    correctIds: [correct.id],
    explanation: `${correct.label} does not name an action.`
  });
}

function findTwoVerbs(random, seed, dbPool) {
  const verbs = shuffle(random, getCategoryItems('verbs', 'two_verbs', dbPool)).slice(0, 2);
  const options = makeOptions(random, [
    ...verbs,
    pick(random, getCategoryItems('nouns', 'two_verbs', dbPool)),
    pick(random, getCategoryItems('adjectives', 'two_verbs', dbPool))
  ]);
  return makeQuestion({
    seed,
    mode: 'two_verbs',
    questionText: 'Choose the two action words.',
    options,
    correctIds: verbs.map((verb) => verb.id),
    explanation: `${verbs[0].label} and ${verbs[1].label} are action words.`,
    multiSelect: true
  });
}

function chooseVerbOrNoun(random, seed, dbPool) {
  const askForVerb = random() >= 0.5;
  const correct = pick(random, askForVerb ? getCategoryItems('verbs', 'verb_noun_review', dbPool) : getCategoryItems('nouns', 'verb_noun_review', dbPool));
  const options = makeOptions(random, [
    correct,
    ...shuffle(random, askForVerb ? getCategoryItems('nouns', 'verb_noun_review', dbPool) : getCategoryItems('verbs', 'verb_noun_review', dbPool)).slice(0, 3)
  ]);
  return makeQuestion({
    seed,
    mode: 'verb_noun_review',
    questionText: askForVerb ? 'Find the verb.' : 'Find the noun.',
    options,
    correctIds: [correct.id],
    explanation: askForVerb
      ? `${correct.label} is a verb because it shows an action.`
      : `${correct.label} is a noun because it names a person, place, animal, or thing.`
  });
}

const generators = {
  'ukg-english-find-action-verb-text': (random, seed, dbPool) => identifyVerb(random, seed, dbPool),
  'ukg-english-find-action-verb-images': (random, seed, dbPool) => identifyVerb(random, seed, dbPool, true),
  'ukg-english-find-verb-in-sentence': (random, seed, dbPool) => findVerbInSentence(random, seed, dbPool),
  'ukg-english-complete-sentence-action-verb': (random, seed, dbPool) => scenarioQuestion(
    random,
    seed,
    'complete_sentence',
    (scenario) => `Complete the sentence: "${scenario.subject} can ___."`,
    dbPool
  ),
  'ukg-english-match-verb-to-picture': (random, seed, dbPool) => scenarioQuestion(
    random,
    seed,
    'picture_match',
    () => 'Which action word matches the picture?',
    dbPool
  ),
  'ukg-english-choose-verb-for-noun': (random, seed, dbPool) => scenarioQuestion(
    random,
    seed,
    'noun_action',
    (scenario) => `What can ${scenario.subject.toLowerCase()} do?`,
    dbPool
  ),
  'ukg-english-find-not-a-verb': (random, seed, dbPool) => findNotVerb(random, seed, dbPool),
  'ukg-english-find-two-action-verbs': (random, seed, dbPool) => findTwoVerbs(random, seed, dbPool),
  'ukg-english-verbs-and-nouns-review': (random, seed, dbPool) => chooseVerbOrNoun(random, seed, dbPool)
};

export function generatePartsOfSpeechQuestion(skillId, seed, dbPool = null) {
  const random = createRandom(seed);
  const generator = generators[skillId] || ((nextRandom, nextSeed, nextDbPool) => {
    const reviewGenerators = [
      identifyVerb,
      findVerbInSentence,
      findNotVerb,
      findTwoVerbs,
      chooseVerbOrNoun
    ];
    return pick(nextRandom, reviewGenerators)(nextRandom, nextSeed, nextDbPool);
  });
  return generator(random, seed, dbPool);
}
