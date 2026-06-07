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

function findWord(label) {
  return Object.values(ukgPartsOfSpeechPool)
    .flat()
    .find((item) => item.label === label);
}

function makeOptions(random, items, visual = false) {
  return shuffle(random, items).map((item) => ({
    id: item.id,
    label: item.label,
    emoji: visual ? item.emoji : undefined,
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
    interaction: multiSelect ? 'multi_select' : 'choice',
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

function identifyVerb(random, seed, visual = false) {
  const correct = pick(random, ukgPartsOfSpeechPool.verbs);
  const options = makeOptions(random, [
    correct,
    pick(random, ukgPartsOfSpeechPool.nouns),
    pick(random, ukgPartsOfSpeechPool.adjectives)
  ], visual);
  return makeQuestion({
    seed,
    mode: visual ? 'identify_visual' : 'identify_text',
    questionText: visual ? 'Which picture shows an action?' : 'Find the verb. A verb shows an action.',
    options,
    correctIds: [correct.id],
    explanation: `${correct.label} is a verb because it shows an action.`
  });
}

function findVerbInSentence(random, seed) {
  const scenario = pick(random, ukgVerbScenarios);
  const correct = findWord(scenario.correct);
  const noun = pick(random, ukgPartsOfSpeechPool.nouns);
  const adjective = pick(random, ukgPartsOfSpeechPool.adjectives);
  return makeQuestion({
    seed,
    mode: 'sentence',
    questionText: `Find the action word: "${scenario.subject} can ${correct.label}."`,
    options: makeOptions(random, [correct, noun, adjective]),
    correctIds: [correct.id],
    explanation: `${correct.label} tells what the subject can do.`
  });
}

function scenarioQuestion(random, seed, mode, questionText) {
  const scenario = pick(random, ukgVerbScenarios);
  const correct = findWord(scenario.correct);
  const options = makeOptions(random, [
    correct,
    ...scenario.distractors.slice(0, 3).map(findWord)
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

function findNotVerb(random, seed) {
  const correct = pick(random, [
    ...ukgPartsOfSpeechPool.nouns,
    ...ukgPartsOfSpeechPool.adjectives
  ]);
  const options = makeOptions(random, [
    correct,
    ...shuffle(random, ukgPartsOfSpeechPool.verbs).slice(0, 3)
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

function findTwoVerbs(random, seed) {
  const verbs = shuffle(random, ukgPartsOfSpeechPool.verbs).slice(0, 2);
  const options = makeOptions(random, [
    ...verbs,
    pick(random, ukgPartsOfSpeechPool.nouns),
    pick(random, ukgPartsOfSpeechPool.adjectives)
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

function chooseVerbOrNoun(random, seed) {
  const askForVerb = random() >= 0.5;
  const correct = pick(random, askForVerb ? ukgPartsOfSpeechPool.verbs : ukgPartsOfSpeechPool.nouns);
  const options = makeOptions(random, [
    correct,
    ...shuffle(random, askForVerb ? ukgPartsOfSpeechPool.nouns : ukgPartsOfSpeechPool.verbs).slice(0, 3)
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
  'ukg-english-find-action-verb-text': (random, seed) => identifyVerb(random, seed),
  'ukg-english-find-action-verb-images': (random, seed) => identifyVerb(random, seed, true),
  'ukg-english-find-verb-in-sentence': findVerbInSentence,
  'ukg-english-complete-sentence-action-verb': (random, seed) => scenarioQuestion(
    random,
    seed,
    'complete_sentence',
    (scenario) => `Complete the sentence: "${scenario.subject} can ___."`
  ),
  'ukg-english-match-verb-to-picture': (random, seed) => scenarioQuestion(
    random,
    seed,
    'picture_match',
    () => 'Which action word matches the picture?'
  ),
  'ukg-english-choose-verb-for-noun': (random, seed) => scenarioQuestion(
    random,
    seed,
    'noun_action',
    (scenario) => `What can ${scenario.subject.toLowerCase()} do?`
  ),
  'ukg-english-find-not-a-verb': findNotVerb,
  'ukg-english-find-two-action-verbs': findTwoVerbs,
  'ukg-english-verbs-and-nouns-review': chooseVerbOrNoun
};

export function generatePartsOfSpeechQuestion(skillId, seed) {
  const random = createRandom(seed);
  const generator = generators[skillId] || ((nextRandom, nextSeed) => {
    const reviewGenerators = [
      identifyVerb,
      findVerbInSentence,
      findNotVerb,
      findTwoVerbs,
      chooseVerbOrNoun
    ];
    return pick(nextRandom, reviewGenerators)(nextRandom, nextSeed);
  });
  return generator(random, seed);
}
