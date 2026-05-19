/**
 * =========================================================================
 * ENGLISH GRAMMAR PRACTICE CONTENT DATABASE
 * =========================================================================
 * You can add, edit, or remove words, sentences, and options here without
 * touching any of the functional code. Keep standard formats intact.
 */

// 1. Noun Categories (used for classification and identifying nouns)
export const NOUNS = {
  people: ['teacher', 'doctor', 'boy', 'girl', 'nurse', 'firefighter', 'farmer', 'baby', 'chef', 'artist'],
  places: ['park', 'school', 'hospital', 'store', 'beach', 'zoo', 'library', 'garden', 'kitchen', 'playground'],
  animals: ['dog', 'cat', 'lion', 'bird', 'rabbit', 'monkey', 'elephant', 'bear', 'frog', 'penguin'],
  things: ['apple', 'book', 'chair', 'pencil', 'car', 'ball', 'desk', 'shoe', 'clock', 'balloon']
};

// Distractor words that are definitely NOT nouns (verbs, adjectives, adverbs)
export const NOT_NOUNS = [
  'run', 'jump', 'happy', 'sad', 'quickly', 'yellow', 'sleep', 'under', 'beautiful',
  'swim', 'eat', 'softly', 'he', 'they', 'sweet', 'climb'
];

// Sentences used to identify nouns in noun.engine.js
export const NOUN_SENTENCES = [
  { text: 'The pilot flew the airplane through the clouds.', nouns: ['pilot', 'airplane', 'clouds'], distractors: ['flew', 'through', 'the'] },
  { text: 'A tiny mouse nibbled the cheese quietly.', nouns: ['mouse', 'cheese'], distractors: ['tiny', 'nibbled', 'quietly'] },
  { text: 'The police officer directed traffic at the crossing.', nouns: ['officer', 'traffic', 'crossing'], distractors: ['directed', 'at', 'the'] },
  { text: 'My sister packed her lunch in the basket.', nouns: ['sister', 'lunch', 'basket'], distractors: ['packed', 'her', 'in'] },
  { text: 'The dolphin jumped above the waves.', nouns: ['dolphin', 'waves'], distractors: ['jumped', 'above', 'the'] },
  { text: 'A clever student solved the puzzle quickly.', nouns: ['student', 'puzzle'], distractors: ['clever', 'solved', 'quickly'] },
  { text: 'The mechanic repaired the noisy engine.', nouns: ['mechanic', 'engine'], distractors: ['repaired', 'noisy', 'the'] },
  { text: 'The baby dropped the spoon on the floor.', nouns: ['baby', 'spoon', 'floor'], distractors: ['dropped', 'on', 'the'] },
  { text: 'A brown horse ran across the field.', nouns: ['horse', 'field'], distractors: ['brown', 'ran', 'across'] },
  { text: 'The captain steered the ship carefully.', nouns: ['captain', 'ship'], distractors: ['steered', 'carefully', 'the'] },

  { text: 'The rabbit munched fresh carrots in the garden.', nouns: ['rabbit', 'carrots', 'garden'], distractors: ['munched', 'fresh', 'in'] },
  { text: 'A noisy train passed the station at noon.', nouns: ['train', 'station', 'noon'], distractors: ['noisy', 'passed', 'at'] },
  { text: 'The artist painted a picture of the mountain.', nouns: ['artist', 'picture', 'mountain'], distractors: ['painted', 'of', 'the'] },
  { text: 'The waiter served soup to the guests.', nouns: ['waiter', 'soup', 'guests'], distractors: ['served', 'to', 'the'] },
  { text: 'A happy child opened the birthday gift.', nouns: ['child', 'gift'], distractors: ['happy', 'opened', 'birthday'] },
  { text: 'The owl watched the forest silently.', nouns: ['owl', 'forest'], distractors: ['watched', 'silently', 'the'] },
  { text: 'My grandfather reads the newspaper every morning.', nouns: ['grandfather', 'newspaper', 'morning'], distractors: ['reads', 'every', 'the'] },
  { text: 'The scientist mixed chemicals in the lab.', nouns: ['scientist', 'chemicals', 'lab'], distractors: ['mixed', 'in', 'the'] },
  { text: 'A red truck carried boxes to the store.', nouns: ['truck', 'boxes', 'store'], distractors: ['red', 'carried', 'to'] },
  { text: 'The nurse checked the medicine cabinet.', nouns: ['nurse', 'cabinet'], distractors: ['checked', 'medicine', 'the'] },

  { text: 'The pirate searched for treasure on the island.', nouns: ['pirate', 'treasure', 'island'], distractors: ['searched', 'for', 'on'] },
  { text: 'A fluffy kitten chased the butterfly.', nouns: ['kitten', 'butterfly'], distractors: ['fluffy', 'chased', 'the'] },
  { text: 'The referee blew the whistle loudly.', nouns: ['referee', 'whistle'], distractors: ['blew', 'loudly', 'the'] },
  { text: 'The boy carried books in his backpack.', nouns: ['boy', 'books', 'backpack'], distractors: ['carried', 'his', 'in'] },
  { text: 'A shiny coin rolled under the table.', nouns: ['coin', 'table'], distractors: ['shiny', 'rolled', 'under'] },
  { text: 'The fisherman caught a large fish.', nouns: ['fisherman', 'fish'], distractors: ['caught', 'large', 'a'] },
  { text: 'The zebra drank water near the river.', nouns: ['zebra', 'water', 'river'], distractors: ['drank', 'near', 'the'] },
  { text: 'The actor memorized the script for the play.', nouns: ['actor', 'script', 'play'], distractors: ['memorized', 'for', 'the'] },
  { text: 'A giant pumpkin sat beside the fence.', nouns: ['pumpkin', 'fence'], distractors: ['giant', 'sat', 'beside'] },
  { text: 'The monkey peeled a banana in the zoo.', nouns: ['monkey', 'banana', 'zoo'], distractors: ['peeled', 'in', 'the'] },

  { text: 'The queen waved to the crowd from the carriage.', nouns: ['queen', 'crowd', 'carriage'], distractors: ['waved', 'to', 'from'] },
  { text: 'A busy bee landed on the flower.', nouns: ['bee', 'flower'], distractors: ['busy', 'landed', 'on'] },
  { text: 'The coach praised the team after the game.', nouns: ['coach', 'team', 'game'], distractors: ['praised', 'after', 'the'] },
  { text: 'The eagle spread its wings above the canyon.', nouns: ['eagle', 'wings', 'canyon'], distractors: ['spread', 'above', 'its'] },
  { text: 'A young boy flew a kite at the beach.', nouns: ['boy', 'kite', 'beach'], distractors: ['young', 'flew', 'at'] },
  { text: 'The barber cut the customer’s hair neatly.', nouns: ['barber', 'customer', 'hair'], distractors: ['cut', 'neatly', 'the'] },
  { text: 'The deer wandered through the forest trail.', nouns: ['deer', 'forest', 'trail'], distractors: ['wandered', 'through', 'the'] },
  { text: 'The chef placed vegetables into the soup.', nouns: ['chef', 'vegetables', 'soup'], distractors: ['placed', 'into', 'the'] },
  { text: 'A friendly dog guarded the farmhouse.', nouns: ['dog', 'farmhouse'], distractors: ['friendly', 'guarded', 'the'] },
  { text: 'The magician pulled a rabbit from the hat.', nouns: ['magician', 'rabbit', 'hat'], distractors: ['pulled', 'from', 'the'] }
];

// 2. Pronoun Categories & Unambiguous Replaceables (refer to he/she/they/it)
export const PRONOUNS = {
  he: {
    label: 'he',
    refersTo: 'people-male',
    replaceables: ['The boy', 'My father', 'Mr. Smith', 'The king', 'The prince', 'The gentleman']
  },
  she: {
    label: 'she',
    refersTo: 'people-female',
    replaceables: ['The girl', 'My mother', 'Mrs. Davis', 'The queen', 'The princess', 'The lady']
  },
  they: {
    label: 'they',
    refersTo: 'plural',
    replaceables: ['The dogs', 'My friends', 'The players', 'The children', 'The books', 'My parents']
  },
  it: {
    label: 'it',
    refersTo: 'singular-nonhuman',
    replaceables: ['The ball', 'The apple', 'The park', 'The pencil', 'A car', 'The clock']
  }
};

// Fill cases used to choose correct pronoun in pronoun.engine.js
export const PRONOUN_FILL_CASES = [
  { text: '___ is reading a book.', correct: 'she', noun: 'The girl', options: ['she', 'they', 'it', 'we'] },
  { text: '___ is playing with a ball.', correct: 'it', noun: 'The puppy', options: ['it', 'he', 'they', 'we'] },
  { text: '___ are laughing at the joke.', correct: 'they', noun: 'The boys', options: ['they', 'he', 'she', 'it'] },
  { text: '___ is cooking dinner.', correct: 'he', noun: 'My father', options: ['he', 'she', 'it', 'they'] }
];

// 3. Verb Lists categorized by difficulty level (base, past-tense, and participle/gerund)
export const VERBS = {
  easy: [
    { base: 'run', past: 'ran', action: 'running' },
    { base: 'jump', past: 'jumped', action: 'jumping' },
    { base: 'play', past: 'played', action: 'playing' },
    { base: 'swim', past: 'swam', action: 'swimming' },
    { base: 'read', past: 'read', action: 'reading' },
    { base: 'write', past: 'wrote', action: 'writing' }
  ],
  medium: [
    { base: 'climb', past: 'climbed', action: 'climbing' },
    { base: 'paint', past: 'painted', action: 'painting' },
    { base: 'laugh', past: 'laughed', action: 'laughing' },
    { base: 'shout', past: 'shouted', action: 'shouting' },
    { base: 'dance', past: 'danced', action: 'dancing' },
    { base: 'sing', past: 'sang', action: 'singing' }
  ],
  hard: [
    { base: 'examine', past: 'examined', action: 'examining' },
    { base: 'construct', past: 'constructed', action: 'constructing' },
    { base: 'discover', past: 'discovered', action: 'discovering' },
    { base: 'investigate', past: 'investigated', action: 'investigating' },
    { base: 'organize', past: 'organized', action: 'organizing' },
    { base: 'calculate', past: 'calculated', action: 'calculating' }
  ]
};

// Sentences used to find the verb in verb.engine.js
export const VERB_SENTENCES = [
  { text: 'The young athlete swam across the cold lake.', verb: 'swam', distractors: ['young', 'athlete', 'cold', 'lake'] },
  { text: 'My happy sister laughed at the comedy show.', verb: 'laughed', distractors: ['happy', 'sister', 'comedy', 'show'] },
  { text: 'The brave firefighter climbed the tall ladder.', verb: 'climbed', distractors: ['brave', 'firefighter', 'tall', 'ladder'] },
  { text: 'A small squirrel climbed up the old oak tree.', verb: 'climbed', distractors: ['small', 'squirrel', 'old', 'tree'] }
];

// Tense helper cases for verb.engine.js present/past options
export function getVerbTenseCases(selectedVerb) {
  return [
    {
      prefix: 'Yesterday, the children ___ ',
      suffix: ' in the garden.',
      answer: selectedVerb.past,
      options: [selectedVerb.past, selectedVerb.base, selectedVerb.action],
      hint: 'Yesterday tells us the action happened in the past.'
    },
    {
      prefix: 'Right now, they like to ___ ',
      suffix: ' outside.',
      answer: selectedVerb.base,
      options: [selectedVerb.base, selectedVerb.past, selectedVerb.action],
      hint: 'Like to is followed by the base form of the verb.'
    }
  ];
}

// 4. Adjectives Categorized by Description Type
export const ADJECTIVES = {
  colors: ['red', 'blue', 'green', 'yellow', 'pink', 'orange', 'purple'],
  sizes: ['big', 'small', 'large', 'tiny', 'huge', 'short', 'tall'],
  feelings: ['happy', 'sad', 'excited', 'tired', 'scared', 'angry', 'proud']
};

// Sentences used to identify adjectives in adjective.engine.js
export const ADJECTIVE_SENTENCES = [
  { text: 'The little puppy barked happily.', adjective: 'little', distractors: ['puppy', 'barked', 'happily'] },
  { text: 'The tall man entered the library.', adjective: 'tall', distractors: ['man', 'entered', 'library'] },
  { text: 'My proud mother smiled at me.', adjective: 'proud', distractors: ['mother', 'smiled', 'me'] },
  { text: 'The blue balloon floated away.', adjective: 'blue', distractors: ['balloon', 'floated', 'away'] }
];

// 5. Articles (A vs An based on consonant vs vowel sounds)
export const ARTICLE_WORDS = [
  { word: 'apple', article: 'an', type: 'vowel' },
  { word: 'orange', article: 'an', type: 'vowel' },
  { word: 'elephant', article: 'an', type: 'vowel' },
  { word: 'igloo', article: 'an', type: 'vowel' },
  { word: 'umbrella', article: 'an', type: 'vowel' },
  { word: 'banana', article: 'a', type: 'consonant' },
  { word: 'dog', article: 'a', type: 'consonant' },
  { word: 'cat', article: 'a', type: 'consonant' },
  { word: 'tree', article: 'a', type: 'consonant' },
  { word: 'car', article: 'a', type: 'consonant' }
];

// Sentence cases with blank spaces for a/an articles in article.engine.js
export const ARTICLE_SENTENCES = [
  { text: 'My friend gave me ___ apple yesterday.', article: 'an', word: 'apple', hint: 'The word *apple* starts with a vowel sound (a).' },
  { text: 'I saw ___ huge elephant at the zoo.', article: 'a', word: 'huge', hint: 'The word *huge* starts with a consonant sound (h).' },
  { text: 'She wants to buy ___ new car.', article: 'a', word: 'new', hint: 'The word *new* starts with a consonant sound (n).' },
  { text: 'He carried ___ umbrella in the rain.', article: 'an', word: 'umbrella', hint: 'The word *umbrella* starts with a vowel sound (u).' }
];

// 6. Sentence punctuation cases for sentence.engine.js
export const PUNCTUATION_CASES = [
  { text: 'Where are my blue shoes', answer: '?', name: 'question mark', options: ['.', '?', '!'], type: 'question', hint: 'The sentence is asking a question, so it needs a question mark.' },
  { text: 'The sun is shining brightly today', answer: '.', name: 'period', options: ['.', '?', '!'], type: 'statement', hint: 'The sentence is telling a statement, so it needs a period.' },
  { text: 'Wow, that is an amazing painting', answer: '!', name: 'exclamation point', options: ['.', '?', '!'], type: 'exclamation', hint: 'The sentence expresses strong feeling or excitement, so it needs an exclamation point.' },
  { text: 'Can we go to the quiet park', answer: '?', name: 'question mark', options: ['.', '?', '!'], type: 'question', hint: 'The sentence starts with *Can*, which asks a question.' }
];

// Capitalization cases for sentence.engine.js
export const CAPITALIZATION_CASES = [
  {
    correct: 'Yesterday, we walked to the beautiful library in Chicago.',
    options: [
      'Yesterday, we walked to the beautiful library in Chicago.',
      'yesterday, we walked to the beautiful library in chicago.',
      'Yesterday, we Walked to the beautiful Library in chicago.',
      'yesterday, we walked to the beautiful library in Chicago.'
    ],
    hint: 'Capitalize the first word of a sentence (Yesterday) and proper nouns/names of specific places (Chicago).'
  },
  {
    correct: 'My friend Sarah has a cute dog named Max.',
    options: [
      'My friend Sarah has a cute dog named Max.',
      'my friend sarah has a cute dog named max.',
      'My friend sarah has a cute dog named Max.',
      'My friend Sarah Has a Cute dog named max.'
    ],
    hint: 'Capitalize the first word of a sentence (My) and names of people/pets (Sarah, Max).'
  }
];

// Sentence types (Statement vs Question vs Exclamation)
export const SENTENCE_TYPE_CASES = [
  { text: 'How many books did you read?', answer: 'question', hint: 'This sentence is asking for information.' },
  { text: 'The teacher writes on the board.', answer: 'statement', hint: 'This sentence is telling a fact or idea.' },
  { text: 'What a beautiful day it is!', answer: 'exclamation', hint: 'This sentence is expressing excitement or strong emotion.' },
  { text: 'I am so excited to go to the zoo!', answer: 'exclamation', hint: 'This sentence is expressing a strong feeling with an exclamation point.' }
];
