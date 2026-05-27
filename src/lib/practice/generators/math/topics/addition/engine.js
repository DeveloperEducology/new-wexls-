import { generateModelMatchQuestion } from './engines/modelMatch.engine.js';
import { generateNumbersQuestion } from './engines/numbers.engine.js';
import { generateCopyDiceQuestion } from './engines/copyDice.engine.js';
import { generateVisualCountingQuestion } from './engines/visualCounting.engine.js';
import { generateWordProblemQuestion } from './engines/wordProblem.engine.js';
import { generatePictureSentenceQuestion } from './engines/pictureSentence.engine.js';
import { generateSortFactsQuestion } from './engines/sortFacts.engine.js';
import { generateMakeNumberQuestion } from './engines/makeNumber.engine.js';
import { generateWordProblemModelQuestion } from './engines/wordProblemModel.engine.js';
import { generateDoublesPlusOneQuestion } from './engines/doublesPlusOne.engine.js';
import { generateNonStandardMeasurementQuestion } from '../../shared/engines/nonStandardUnitMeasurement.engine.js';
import { generateCubeCounterQuestion } from './engines/cubeCounter.engine.js';
import { getAdditionTemplate } from './templates/index.js';
import { getAdditionSkill } from './skills/index.js';

const ENGINE_GENERATORS = {
  modelMatch: generateModelMatchQuestion,
  numbers: generateNumbersQuestion,
  copyDice: generateCopyDiceQuestion,
  visualCounting: generateVisualCountingQuestion,
  wordProblem: generateWordProblemQuestion,
  pictureSentence: generatePictureSentenceQuestion,
  sortFacts: generateSortFactsQuestion,
  makeNumber: generateMakeNumberQuestion,
  wordProblemModel: generateWordProblemModelQuestion,
  doublesPlusOne: generateDoublesPlusOneQuestion,
  nonStandardUnitMeasurement: generateNonStandardMeasurementQuestion,
  cubeCounter: generateCubeCounterQuestion
};

export function createAdditionTopicTemplate(skillOrTemplateId, overrides = {}) {
  const skill = getAdditionSkill(skillOrTemplateId);
  const templateId = skill?.templateId || skillOrTemplateId;
  const template = getAdditionTemplate(templateId);
  if (!template) return null;

  return {
    logic_type: skill?.id || template.id,
    microSkillId: skill?.id || null,
    code: skill?.code || null,
    grade: skill?.grade || null,
    competencyId: skill?.competencyId || null,
    title: skill?.title || template.id,
    topic: 'addition',
    templateId: template.id,
    engine: template.engine,
    type: template.questionType,
    config: {
      ...(template.defaultConfig || {}),
      ...(skill?.config || {}),
      ...(overrides.config || {}),
      ...(overrides.difficulty ? { difficulty: overrides.difficulty } : {}),
      ...(overrides.history ? { history: overrides.history } : {})
    },
    adaptiveConfig: {
      logic_type: skill?.id || template.id,
      topic: 'addition',
      templateId: template.id,
      engine: template.engine,
      ...(overrides.adaptiveConfig || {})
    }
  };
}

export function generateAdditionTopicQuestion(config = {}, overrideVariables = null) {
  const logicType = config.logic_type
    || config.adaptiveConfig?.logic_type
    || config.template_id
    || config.templateId
    || config.microSkillId
    || 'addition-g1-e3-model-match-to-10';

  const template = createAdditionTopicTemplate(logicType, config);
  if (!template) {
    throw new Error(`[AdditionTopic] No template or skill registered for: ${logicType}`);
  }

  const generator = ENGINE_GENERATORS[template.engine];
  if (!generator) {
    throw new Error(`[AdditionTopic] No engine registered for: ${template.engine}`);
  }

  const variables = {
    ...(config.variables || {}),
    ...(config.adaptiveConfig?.variables || {}),
    ...(overrideVariables || {})
  };
  const question = generator(template, variables);

  return {
    ...question,
    resolvedConfig: template,
    adaptiveConfig: {
      ...(question.adaptiveConfig || {}),
      ...template.adaptiveConfig,
      variables: {
        seed: variables.seed || config.seed || Date.now().toString()
      }
    },
    metadata: {
      ...(question.metadata || {}),
      subject: 'math',
      logicType,
      skillId: template.microSkillId || logicType,
      microSkillId: template.microSkillId,
      code: template.code,
      grade: template.grade,
      competencyId: template.competencyId,
      topic: 'addition',
      templateId: template.templateId,
      engine: template.engine
    }
  };
}
