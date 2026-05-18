import { createSeededRandom, randInt, uid } from './shared.js';

const METRIC_DISTANCE_DATA = {
  millimeters: [
    { object: "a grain of rice", estimate: "7 millimeters" },
    { object: "a coin thickness", estimate: "2 millimeters" },
    { object: "a pencil tip", estimate: "1 millimeter" },
    { object: "a button", estimate: "10 millimeters" },
    { object: "a ladybug", estimate: "6 millimeters" },
    { object: "an ant", estimate: "4 millimeters" },
    { object: "a fly", estimate: "8 millimeters" },
    { object: "a key thickness", estimate: "2 millimeters" },
    { object: "a smartphone thickness", estimate: "8 millimeters" },
    { object: "a staple", estimate: "5 millimeters" },
    { object: "a matchstick thickness", estimate: "2 millimeters" }
  ],

  centimeters: [
    { object: "a drinking straw", estimate: "25 centimeters" },
    { object: "a pencil", estimate: "18 centimeters" },
    { object: "a spoon", estimate: "15 centimeters" },
    { object: "a notebook", estimate: "30 centimeters" },
    { object: "a toothbrush", estimate: "20 centimeters" },
    { object: "a smartphone", estimate: "16 centimeters" },
    { object: "a book length", estimate: "22 centimeters" },
    { object: "a hand span", estimate: "18 centimeters" },
    { object: "a key", estimate: "6 centimeters" },
    { object: "a coffee mug height", estimate: "10 centimeters" },
    { object: "a marker", estimate: "14 centimeters" },
    { object: "a computer keyboard length", estimate: "44 centimeters" }
  ],

  meters: [
    { object: "a car", estimate: "4 meters" },
    { object: "a classroom door", estimate: "2 meters" },
    { object: "a bed", estimate: "2 meters" },
    { object: "a small tree", estimate: "5 meters" },
    { object: "a school bus", estimate: "10 meters" },
    { object: "a basketball hoop", estimate: "3 meters" },
    { object: "a guitar", estimate: "1 meter" },
    { object: "a dining table", estimate: "2 meters" },
    { object: "a swimming pool length", estimate: "25 meters" },
    { object: "a kayak", estimate: "4 meters" },
    { object: "a refrigerator height", estimate: "2 meters" },
    { object: "a chalkboard width", estimate: "3 meters" }
  ],

  kilometers: [
    { object: "the distance between two towns", estimate: "20 kilometers" },
    { object: "a road trip", estimate: "100 kilometers" },
    { object: "the distance to an airport", estimate: "15 kilometers" },
    { object: "the distance across a city", estimate: "30 kilometers" },
    { object: "a marathon route", estimate: "42 kilometers" },
    { object: "a hiking trail length", estimate: "8 kilometers" },
    { object: "the distance to another country's border", estimate: "200 kilometers" },
    { object: "a train journey between cities", estimate: "150 kilometers" },
    { object: "the runway of a large airport", estimate: "3 kilometers" },
    { object: "a river length", estimate: "50 kilometers" }
  ]
};

const UNIT_ORDER = [
  "millimeters",
  "centimeters",
  "meters",
  "kilometers"
];

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

export function generateMetricDistanceQuestion(template = {}, variables = {}) {
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

  // 2. Select a correct unit and a pre-configured metric distance object
  const correctUnit = UNIT_ORDER[randInt(0, UNIT_ORDER.length - 1, random)];
  const pool = METRIC_DISTANCE_DATA[correctUnit];
  const correctData = pool[randInt(0, pool.length - 1, random)];

  const correctAnswer = correctData.estimate;

  // 3. Pick wrong units and options
  const wrongUnits = getWrongUnits(correctUnit, optionCount - 1, random);
  const wrongOptions = wrongUnits.map(unit => {
    const unitPool = METRIC_DISTANCE_DATA[unit];
    const item = unitPool[randInt(0, unitPool.length - 1, random)];
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
      engine: "metricDistanceEstimate",
      templateId: template.id,
      object: correctData.object,
      correctUnit,
      difficulty
    }
  };
}
