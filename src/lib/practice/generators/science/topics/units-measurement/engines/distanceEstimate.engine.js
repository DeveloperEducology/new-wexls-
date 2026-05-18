import { createSeededRandom, randInt, uid } from './shared.js';

const DISTANCE_DATA = {
  inches: [
    { object: "a pencil", estimate: "7 inches" },
    { object: "a crayon", estimate: "4 inches" },
    { object: "a toothbrush", estimate: "8 inches" },
    { object: "a spoon", estimate: "6 inches" },
    { object: "a smartphone", estimate: "6 inches" },
    { object: "a key", estimate: "2 inches" },
    { object: "a coin", estimate: "1 inch" },
    { object: "a marker", estimate: "5 inches" }
  ],

  feet: [
    { object: "a car", estimate: "12 feet" },
    { object: "a bed", estimate: "6 feet" },
    { object: "a door", estimate: "7 feet" },
    { object: "a bicycle", estimate: "5 feet" },
    { object: "a refrigerator", estimate: "6 feet" },
    { object: "a couch", estimate: "7 feet" },
    { object: "a dining table", estimate: "5 feet" },
    { object: "a ladder", estimate: "8 feet" }
  ],

  yards: [
    { object: "a school bus", estimate: "12 yards" },
    { object: "a basketball court", estimate: "30 yards" },
    { object: "a classroom", estimate: "10 yards" },
    { object: "a large tree", estimate: "15 yards" },
    { object: "a swimming pool", estimate: "25 yards" },
    { object: "a playground", estimate: "20 yards" }
  ],

  miles: [
    { object: "the distance between two cities", estimate: "50 miles" },
    { object: "a road trip", estimate: "100 miles" },
    { object: "the distance to another town", estimate: "20 miles" },
    { object: "a marathon route", estimate: "26 miles" },
    { object: "the distance across a state", estimate: "300 miles" },
    { object: "the distance to the airport", estimate: "15 miles" }
  ]
};

const UNIT_ORDER = ["inches", "feet", "yards", "miles"];

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

function makeQuestionText(object) {
  return `How long is ${object}? Select the better estimate.`;
}

export function generateDistanceEstimateQuestion(template = {}, variables = {}) {
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

  // 2. Select a correct unit and a pre-configured distance object
  const correctUnit = UNIT_ORDER[randInt(0, UNIT_ORDER.length - 1, random)];
  const objectPool = DISTANCE_DATA[correctUnit];
  const correctData = objectPool[randInt(0, objectPool.length - 1, random)];

  const correctAnswer = correctData.estimate;

  // 3. Pick wrong units and options
  const wrongUnits = getWrongUnits(correctUnit, optionCount - 1, random);
  const wrongOptions = wrongUnits.map(unit => {
    const pool = DISTANCE_DATA[unit];
    const item = pool[randInt(0, pool.length - 1, random)];
    return item.estimate;
  });

  const rawOptions = [correctAnswer, ...wrongOptions];
  const optionsList = shuffle(rawOptions, random);

  // 4. Generate guaranteed unique option IDs
  const options = optionsList.map((val, index) => ({
    id: `opt_${index}_${val.replace(/\s+/g, '_').toLowerCase()}`,
    label: val,
    value: val,
    isCorrect: val === correctAnswer
  }));

  const answerIndex = options.findIndex(o => o.isCorrect);

  return {
    id: uid(),
    type: "mcq",
    questionText: makeQuestionText(correctData.object),
    parts: [],
    options,
    answer: answerIndex,
    correctAnswerIndex: answerIndex,
    solution: {
      sections: [
        {
          type: "text",
          content: `${correctData.object.charAt(0).toUpperCase() + correctData.object.slice(1)} is usually about ${correctAnswer} long.`
        }
      ]
    },
    metadata: {
      subject: "science",
      topic: "units-measurement",
      engine: "distanceEstimate",
      templateId: template.id,
      object: correctData.object,
      correctUnit,
      difficulty
    }
  };
}
