import { cubeToolsCatalog, getCubeToolsSkill } from './catalog.js';

export { cubeToolsCatalog, getCubeToolsSkill };

function seededRandom(seedInput = Date.now()) {
  const text = String(seedInput);
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) >>> 0;
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function randInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function makeBuildQuestion({ skill, seed, random }) {
  const target = randInt(random, 3, 10);
  return {
    questionText: `Build ${target} cubes.`,
    toolConfig: {
      mode: 'build',
      target,
      min: 0,
      max: 20,
      groupLabel: 'Build here',
      cubeColor: 'blue',
    },
    answer: { value: target },
    feedback: {
      correct: `Great! You built ${target} cubes.`,
      incorrect: `Count again and build exactly ${target}.`,
    },
  };
}

function makeAddQuestion({ random }) {
  const first = randInt(random, 2, 6);
  const second = randInt(random, 2, 6);
  const target = first + second;
  return {
    questionText: `Show ${first} + ${second} with cubes.`,
    toolConfig: {
      mode: 'add',
      target,
      min: 0,
      max: 20,
      editableGroupId: 'second',
      startGroups: [
        { id: 'first', label: `${first}`, count: first, color: 'blue', editable: false },
        { id: 'second', label: `${second}`, count: 0, color: 'green', editable: true },
      ],
    },
    answer: { value: target },
    feedback: {
      correct: `Nice. ${first} and ${second} make ${target}.`,
      incorrect: `Build the second group so the total is ${target}.`,
    },
  };
}

function makeSubtractQuestion({ random }) {
  const start = randInt(random, 7, 12);
  const takeAway = randInt(random, 2, Math.min(6, start - 1));
  const target = start - takeAway;
  return {
    questionText: `Start with ${start}. Take away ${takeAway}.`,
    toolConfig: {
      mode: 'subtract',
      target,
      min: 0,
      max: 20,
      initialCount: start,
      groupLabel: 'Remaining cubes',
      cubeColor: 'coral',
    },
    answer: { value: target },
    feedback: {
      correct: `Yes. ${start} take away ${takeAway} leaves ${target}.`,
      incorrect: `Remove cubes until ${target} are left.`,
    },
  };
}

function makeMissingAddendQuestion({ random }) {
  const first = randInt(random, 2, 6);
  const target = randInt(random, first + 2, first + 7);
  const missing = target - first;
  return {
    questionText: `${first} + ? = ${target}. Build the missing cubes.`,
    toolConfig: {
      mode: 'missing_addend',
      target,
      min: 0,
      max: 20,
      editableGroupId: 'missing',
      startGroups: [
        { id: 'known', label: `${first}`, count: first, color: 'blue', editable: false },
        { id: 'missing', label: '?', count: 0, color: 'amber', editable: true },
      ],
    },
    answer: { value: target },
    feedback: {
      correct: `Correct. The missing addend is ${missing}.`,
      incorrect: `Keep building until the total is ${target}.`,
    },
  };
}

const QUESTION_FACTORIES = {
  build: makeBuildQuestion,
  add: makeAddQuestion,
  subtract: makeSubtractQuestion,
  missing_addend: makeMissingAddendQuestion,
};

export function generateCubeToolsQuestion(config = {}) {
  const skillId = config.logic_type || config.forcedTask || config.templateId || 'cube-tools-build';
  const skill = getCubeToolsSkill(skillId);
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const random = seededRandom(seed);
  const factory = QUESTION_FACTORIES[skill.mode] || makeBuildQuestion;
  const question = factory({ skill, seed, random });

  return {
    id: `cube_tools_${skill.skillId}_${seed}`,
    subject: 'math',
    topic: 'cube-tools',
    skillId: skill.skillId,
    type: 'interactiveTool',
    toolId: 'cube_counter',
    toolVersion: '1.0.0',
    ...question,
    toolConfig: {
      actions: ['add_cube', 'remove_cube', 'undo', 'reset'],
      showLiveCount: true,
      ...question.toolConfig,
    },
    validation: {
      strategy: 'exact_value',
    },
    metadata: {
      subject: 'math',
      topic: 'cube-tools',
      skillId: skill.skillId,
      templateId: skill.templateId,
      engine: 'cube-tools',
      mode: skill.mode,
      seed,
    },
  };
}

export function getCubeToolsTemplate(skillId) {
  const skill = getCubeToolsSkill(skillId);
  return {
    id: skill.templateId,
    logicType: skill.skillId,
    title: skill.title,
    family: 'cube_tools',
    engine: 'cube-tools',
    questionType: 'interactiveTool',
    mode: skill.mode,
  };
}
