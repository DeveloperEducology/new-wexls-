export const ukgPartsOfSpeechPool = {
  nouns: [
    { id: 'noun_apple', label: 'apple', emoji: '🍎', theme: 'food' },
    { id: 'noun_book', label: 'book', emoji: '📘', theme: 'school' },
    { id: 'noun_ball', label: 'ball', emoji: '⚽', theme: 'play' },
    { id: 'noun_dog', label: 'dog', emoji: '🐕', theme: 'animals' },
    { id: 'noun_bird', label: 'bird', emoji: '🐦', theme: 'animals' },
    { id: 'noun_child', label: 'child', emoji: '🧒', theme: 'people' },
    { id: 'noun_song', label: 'song', emoji: '🎵', theme: 'music' },
    { id: 'noun_water', label: 'water', emoji: '💧', theme: 'food' },
    { id: 'noun_bed', label: 'bed', emoji: '🛏️', theme: 'home' },
    { id: 'noun_pencil', label: 'pencil', emoji: '✏️', theme: 'school' }
  ],
  verbs: [
    { id: 'verb_run', label: 'run', emoji: '🏃', theme: 'play' },
    { id: 'verb_jump', label: 'jump', emoji: '🤸', theme: 'play' },
    { id: 'verb_eat', label: 'eat', emoji: '🍽️', theme: 'food' },
    { id: 'verb_read', label: 'read', emoji: '📖', theme: 'school' },
    { id: 'verb_sleep', label: 'sleep', emoji: '😴', theme: 'home' },
    { id: 'verb_swim', label: 'swim', emoji: '🏊', theme: 'play' },
    { id: 'verb_sing', label: 'sing', emoji: '🎤', theme: 'music' },
    { id: 'verb_dance', label: 'dance', emoji: '💃', theme: 'music' },
    { id: 'verb_write', label: 'write', emoji: '✍️', theme: 'school' },
    { id: 'verb_clap', label: 'clap', emoji: '👏', theme: 'play' },
    { id: 'verb_kick', label: 'kick', emoji: '🦵', theme: 'play' },
    { id: 'verb_drink', label: 'drink', emoji: '🥤', theme: 'food' },
    { id: 'verb_fly', label: 'fly', emoji: '🪽', theme: 'animals' },
    { id: 'verb_bark', label: 'bark', emoji: '🐕', theme: 'animals' }
  ],
  adjectives: [
    { id: 'adjective_happy', label: 'happy', emoji: '😊', theme: 'feelings' },
    { id: 'adjective_big', label: 'big', emoji: '🐘', theme: 'describing' },
    { id: 'adjective_red', label: 'red', emoji: '🔴', theme: 'colours' },
    { id: 'adjective_soft', label: 'soft', emoji: '🧸', theme: 'describing' },
    { id: 'adjective_sweet', label: 'sweet', emoji: '🍬', theme: 'food' },
    { id: 'adjective_tall', label: 'tall', emoji: '🦒', theme: 'describing' },
    { id: 'adjective_fast', label: 'fast', emoji: '⚡', theme: 'describing' },
    { id: 'adjective_small', label: 'small', emoji: '🐜', theme: 'describing' }
  ]
};

export const ukgVerbScenarios = [
  { subject: 'A bird', emoji: '🐦', correct: 'fly', distractors: ['read', 'write', 'bark'] },
  { subject: 'A dog', emoji: '🐕', correct: 'bark', distractors: ['read', 'write', 'fly'] },
  { subject: 'A child with a book', emoji: '🧒📘', correct: 'read', distractors: ['bark', 'fly', 'swim'] },
  { subject: 'A child with a pencil', emoji: '🧒✏️', correct: 'write', distractors: ['bark', 'fly', 'sleep'] },
  { subject: 'A child in a pool', emoji: '🏊', correct: 'swim', distractors: ['write', 'read', 'bark'] },
  { subject: 'A tired child', emoji: '😴', correct: 'sleep', distractors: ['fly', 'write', 'bark'] },
  { subject: 'A child with a ball', emoji: '🧒⚽', correct: 'kick', distractors: ['read', 'fly', 'sleep'] },
  { subject: 'A child with water', emoji: '🧒🥤', correct: 'drink', distractors: ['fly', 'write', 'bark'] },
  { subject: 'A child with food', emoji: '🧒🍎', correct: 'eat', distractors: ['fly', 'write', 'bark'] },
  { subject: 'A child with a song', emoji: '🧒🎵', correct: 'sing', distractors: ['read', 'fly', 'sleep'] }
];
