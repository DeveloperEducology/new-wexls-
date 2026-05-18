import { createSeededRandom, randInt, uid } from './shared.js';

const ACTIVITIES = {
  seconds: [
    { activity: "blink your eyes", estimate: "1 second" },
    { activity: "clap once", estimate: "1 second" },
    { activity: "snap your fingers", estimate: "1 second" },
    { activity: "turn on a light", estimate: "1 second" },
    { activity: "sneeze", estimate: "1 second" },
    { activity: "say hello", estimate: "2 seconds" },
    { activity: "open a door", estimate: "2 seconds" },
    { activity: "close a door", estimate: "2 seconds" },
    { activity: "press a button", estimate: "1 second" },
    { activity: "pick up a pencil", estimate: "2 seconds" },
    { activity: "drop a coin", estimate: "1 second" },
    { activity: "wave goodbye", estimate: "2 seconds" },
    { activity: "take one step", estimate: "1 second" },
    { activity: "jump once", estimate: "1 second" },
    { activity: "ring a doorbell", estimate: "2 seconds" },
    { activity: "turn a page", estimate: "1 second" },
    { activity: "write one letter", estimate: "1 second" },
    { activity: "take a sip of water", estimate: "3 seconds" },
    { activity: "kick a ball once", estimate: "1 second" },
    { activity: "tap a table", estimate: "1 second" }
  ],

  minutes: [
    { activity: "brush your teeth", estimate: "2 minutes" },
    { activity: "wash your hands", estimate: "1 minute" },
    { activity: "peel a banana", estimate: "1 minute" },
    { activity: "tie your shoes", estimate: "1 minute" },
    { activity: "comb your hair", estimate: "2 minutes" },
    { activity: "drink a glass of water", estimate: "1 minute" },
    { activity: "sharpen a pencil", estimate: "1 minute" },
    { activity: "pack your school bag", estimate: "5 minutes" },
    { activity: "eat a snack", estimate: "10 minutes" },
    { activity: "read one page of a book", estimate: "2 minutes" },
    { activity: "draw a small picture", estimate: "10 minutes" },
    { activity: "water a plant", estimate: "2 minutes" },
    { activity: "take a bath", estimate: "20 minutes" },
    { activity: "eat breakfast", estimate: "15 minutes" },
    { activity: "clean your desk", estimate: "5 minutes" },
    { activity: "make a sandwich", estimate: "5 minutes" },
    { activity: "fold a shirt", estimate: "1 minute" },
    { activity: "write a short note", estimate: "2 minutes" },
    { activity: "walk to a nearby shop", estimate: "10 minutes" },
    { activity: "solve a small puzzle", estimate: "10 minutes" }
  ],

  hours: [
    { activity: "do the laundry", estimate: "1 hour" },
    { activity: "watch a movie", estimate: "2 hours" },
    { activity: "paint the walls in a bedroom", estimate: "4 hours" },
    { activity: "sleep at night", estimate: "8 hours" },
    { activity: "attend school", estimate: "6 hours" },
    { activity: "travel to another city", estimate: "4 hours" },
    { activity: "bake a cake", estimate: "1 hour" },
    { activity: "clean a room", estimate: "2 hours" },
    { activity: "play a cricket match", estimate: "6 hours" },
    { activity: "visit a zoo", estimate: "4 hours" },
    { activity: "go shopping", estimate: "2 hours" },
    { activity: "attend a birthday party", estimate: "3 hours" },
    { activity: "take a long train ride", estimate: "8 hours" },
    { activity: "cook dinner", estimate: "1 hour" },
    { activity: "complete a small school project", estimate: "2 hours" },
    { activity: "visit a doctor", estimate: "1 hour" },
    { activity: "go to a wedding function", estimate: "4 hours" },
    { activity: "watch a sports match", estimate: "2 hours" },
    { activity: "clean the house", estimate: "4 hours" },
    { activity: "study for a test", estimate: "2 hours" }
  ],

  days: [
    { activity: "go on a short vacation", estimate: "3 days" },
    { activity: "recover from a mild cold", estimate: "5 days" },
    { activity: "finish reading a long book", estimate: "3 days" },
    { activity: "prepare for a school exam", estimate: "2 days" },
    { activity: "decorate a house for a festival", estimate: "2 days" },
    { activity: "paint an entire house", estimate: "5 days" },
    { activity: "travel across a large country", estimate: "3 days" },
    { activity: "finish a school holiday project", estimate: "2 days" },
    { activity: "learn a short dance routine", estimate: "3 days" },
    { activity: "complete a small craft model", estimate: "2 days" },
    { activity: "visit relatives in another city", estimate: "3 days" },
    { activity: "go on a school trip", estimate: "2 days" },
    { activity: "pack and move to a new house", estimate: "3 days" },
    { activity: "dry clothes during rainy weather", estimate: "2 days" },
    { activity: "finish a short storybook", estimate: "1 day" }
  ],

  weeks: [
    { activity: "grow grass in a garden", estimate: "2 weeks" },
    { activity: "grow a small plant from a seed", estimate: "1 week" },
    { activity: "train for a school race", estimate: "4 weeks" },
    { activity: "make a large science project", estimate: "2 weeks" },
    { activity: "learn to ride a bicycle well", estimate: "2 weeks" },
    { activity: "finish a big craft project", estimate: "1 week" },
    { activity: "practice for a school play", estimate: "3 weeks" },
    { activity: "learn a new song on a keyboard", estimate: "2 weeks" },
    { activity: "prepare for a dance performance", estimate: "2 weeks" },
    { activity: "complete a large puzzle", estimate: "1 week" },
    { activity: "learn basic swimming", estimate: "4 weeks" },
    { activity: "make a handmade scrapbook", estimate: "1 week" },
    { activity: "practice handwriting improvement", estimate: "2 weeks" },
    { activity: "prepare for annual day", estimate: "3 weeks" },
    { activity: "grow bean plants from seeds", estimate: "2 weeks" }
  ],

  months: [
    { activity: "grow a tomato plant", estimate: "3 months" },
    { activity: "grow a watermelon", estimate: "3 months" },
    { activity: "build a house", estimate: "6 months" },
    { activity: "learn to swim well", estimate: "3 months" },
    { activity: "finish a school term", estimate: "3 months" },
    { activity: "write a long storybook", estimate: "2 months" },
    { activity: "prepare for a big sports tournament", estimate: "2 months" },
    { activity: "grow a flower plant", estimate: "3 months" },
    { activity: "learn a musical instrument well", estimate: "6 months" },
    { activity: "complete a school year", estimate: "6 months" },
    { activity: "train for a marathon", estimate: "3 months" },
    { activity: "renovate a house", estimate: "2 months" },
    { activity: "grow rice in a field", estimate: "6 months" },
    { activity: "grow wheat in a field", estimate: "6 months" },
    { activity: "learn a new language slowly", estimate: "6 months" }
  ]
};

const ESTIMATES = {
  seconds: ["1 second", "5 seconds", "10 seconds", "20 seconds", "30 seconds"],
  minutes: ["1 minute", "2 minutes", "5 minutes", "10 minutes", "20 minutes", "30 minutes", "45 minutes"],
  hours: ["1 hour", "2 hours", "4 hours", "6 hours", "8 hours"],
  days: ["1 day", "2 days", "3 days", "5 days"],
  weeks: ["1 week", "2 weeks", "3 weeks", "4 weeks"],
  months: ["1 month", "2 months", "3 months", "6 months"]
};

const UNIT_ORDER = ["seconds", "minutes", "hours", "days", "weeks", "months"];

function shuffle(arr, random) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function getWrongUnits(correctUnit, count, random) {
  const wrongUnits = UNIT_ORDER.filter(unit => unit !== correctUnit);
  return shuffle(wrongUnits, random).slice(0, count);
}

function makeQuestionText(activity) {
  return `How long does it take to ${activity}? Select the better estimate.`;
}

export function generateTimeEstimateQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  
  // 1. Explicitly validate and sanitize difficulty
  let difficulty = variables.difficulty || 'easy';
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    difficulty = 'easy';
  }

  const optionCount =
    difficulty === "easy" ? 2 :
    difficulty === "medium" ? 3 :
    4;

  // 2. Select a correct unit and a pre-configured activity object
  const correctUnit = UNIT_ORDER[randInt(0, UNIT_ORDER.length - 1, random)];
  const correctUnitActivities = ACTIVITIES[correctUnit];
  const selectedObject = correctUnitActivities[randInt(0, correctUnitActivities.length - 1, random)];
  
  const activity = selectedObject.activity;
  const correctAnswer = selectedObject.estimate;

  // 3. Pick wrong units and options
  const wrongUnits = getWrongUnits(correctUnit, optionCount - 1, random);
  const wrongOptions = wrongUnits.map(unit => {
    const unitEstimates = ESTIMATES[unit];
    return unitEstimates[randInt(0, unitEstimates.length - 1, random)];
  });

  const rawOptions = [correctAnswer, ...wrongOptions];
  const optionsList = shuffle(rawOptions, random);

  // 4. Generate guaranteed unique option IDs
  const options = optionsList.map((val, index) => ({
    id: `opt_${index}_${val.replace(/\s+/g, '_').toLowerCase()}`,
    label: val,
    value: val,
    isCorrect: val === correctAnswer,
  }));

  const answerIndex = options.findIndex(o => o.isCorrect);

  return {
    id: uid(),
    type: "mcq",
    questionText: makeQuestionText(activity),
    parts: [], // Omit redundant "Activity: ..." text since questionText is completely self-contained
    options,
    answer: answerIndex,
    correctAnswerIndex: answerIndex,
    solution: {
      sections: [
        {
          type: "text",
          content: `${activity.charAt(0).toUpperCase() + activity.slice(1)} usually takes ${correctAnswer}, not a much shorter or much longer time.`
        }
      ]
    },
    metadata: {
      subject: "science", // Keeps alignment with units-measurement topic under Science subject
      topic: "units-measurement",
      engine: "unitChoice",
      templateId: template.id,
      activity,
      correctUnit,
      difficulty
    }
  };
}
