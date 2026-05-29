#!/usr/bin/env node

import { generateAdditionTopicQuestion, additionSkillsByGrade } from '../src/lib/practice/generators/math/topics/addition/index.js';
import { generateSubtractionTopicQuestion, subtractionSkillsByGrade } from '../src/lib/practice/generators/math/topics/subtraction/index.js';
import { generateMultiplicationQuestion, multiplicationSkillsByGrade } from '../src/lib/practice/generators/math/topics/multiplication/index.js';
import { generateDivisionTopicQuestion, divisionSkillsByGrade } from '../src/lib/practice/generators/math/topics/division/index.js';
import { cubeToolsCatalog, generateCubeToolsQuestion } from '../src/lib/practice/generators/math/topics/cube-tools/index.js';
import { dataGraphsSkills, generateDataGraphsQuestion } from '../src/lib/practice/generators/math/topics/data-graphs/index.js';
import { storyMathCatalog, generateStoryMathQuestion } from '../src/lib/practice/generators/math/topics/story-math/index.js';
import { interactiveToolsCatalog, generateInteractiveToolsQuestion } from '../src/lib/practice/generators/math/topics/interactive-tools/index.js';
import { testingGenerator, generateTestingQuestion } from '../src/lib/practice/generators/math/topics/testing/index.js';
import { shapesMicroSkills, shapesGenerator } from '../src/lib/practice/generators/math/topics/shapes/index.js';
import { placeValueMicroSkills } from '../src/lib/practice/generators/math/topics/place-values/skills/index.js';
import { placeValueGenerator } from '../src/lib/practice/generators/math/topics/place-values/index.js';
import { fractionsV2Generators, generateFractionsV2Question } from '../src/lib/practice/generators/math/topics/fractions/index.js';
import { MEASUREMENT_CATALOG, generateMeasurementQuestion } from '../src/lib/practice/generators/math/topics/measurement/index.js';
import { somCatalog, generateSOMTopicQuestion } from '../src/lib/practice/generators/math/topics/standard-object-measurement/index.js';
import { unitsMeasurementSkillsByGrade, resolveUnitsMeasurementGenerator } from '../src/lib/practice/generators/science/topics/units-measurement/index.js';
import { solarSystemSkills, resolveSolarSystemGenerator } from '../src/lib/practice/generators/science/topics/solar-system/registry.js';
import { grammarSkillsByGrade } from '../src/lib/practice/generators/english/topics/grammar/skills/index.js';
import { resolveGrammarGenerator } from '../src/lib/practice/generators/english/topics/grammar/engine.js';
import { gkGenerators } from '../src/lib/practice/generators/social/topics/gk/registry.js';
import { generateSmartGKQuestion } from '../src/lib/practice/generators/social/topics/gk/index.js';

const strict = process.argv.includes('--strict');

const SUPPORTED_TYPES = new Set([
  'mcq',
  'multipleChoice',
  'multiplechoice',
  'fillInTheBlank',
  'fillintheblank',
  'gridArithmetic',
  'vertical_arithmetic',
  'categorization',
  'categorizationv2',
  'categorySort',
  'sorting',
  'sort',
  'matching',
  'interactiveApplet',
  'interactiveTool',
  'imageChoice',
]);

function flattenSkillsByGrade(skillsByGrade, idKey = 'id') {
  return Object.values(skillsByGrade || {})
    .flat()
    .map((skill) => skill[idKey] || skill.skillId)
    .filter(Boolean);
}

function seedFor(topic, skillId) {
  return `audit-${topic}-${skillId}`;
}

function baseConfig(topic, skillId) {
  return {
    logic_type: skillId,
    forcedTask: skillId,
    templateId: skillId,
    difficulty: 'adaptive',
    variables: {
      seed: seedFor(topic, skillId),
    },
  };
}

function hasAnswerShape(question) {
  return question.answer !== undefined
    || question.correctAnswer !== undefined
    || question.correctAnswerIndex !== undefined
    || question.correctAnswerText !== undefined
    || question.correct_answer_index !== undefined
    || question.correct_answer_indices !== undefined
    || question.validation?.answer !== undefined
    || Array.isArray(question.pairs)
    || Array.isArray(question.options)
    || question.type === 'interactiveApplet';
}

function validateQuestion(question, { topic, skillId }) {
  const errors = [];
  const warnings = [];

  if (!question || typeof question !== 'object') {
    return { errors: ['generator returned no question object'], warnings };
  }

  if (!question.type) {
    errors.push('missing type');
  } else if (!SUPPORTED_TYPES.has(question.type)) {
    warnings.push(`type is not in known renderer list: ${question.type}`);
  }

  if (!question.questionText && !question.text && !question.title && !Array.isArray(question.parts)) {
    errors.push('missing question text/title/parts');
  }

  if (!hasAnswerShape(question)) {
    warnings.push('missing answer/correct answer shape');
  }

  const templateId = question.metadata?.templateId || question.metadata?.task || question.resolvedConfig?.templateId;
  if (!templateId) {
    warnings.push('missing metadata.templateId/task');
  }

  if (question.type === 'interactiveTool') {
    if (!question.toolId) errors.push('interactiveTool missing toolId');
    if (!question.toolConfig || typeof question.toolConfig !== 'object') errors.push('interactiveTool missing toolConfig');
  }

  if ((question.type === 'categorization' || question.type === 'categorizationv2') && !Array.isArray(question.items)) {
    warnings.push('categorization question has no items array');
  }

  if (question.type === 'mcq' && !Array.isArray(question.options)) {
    errors.push('mcq missing options array');
  }

  return {
    errors: errors.map((message) => `${topic}/${skillId}: ${message}`),
    warnings: warnings.map((message) => `${topic}/${skillId}: ${message}`),
  };
}

function topicCase(topic, skillIds, generate) {
  return { topic, skillIds: Array.from(new Set(skillIds.filter(Boolean))), generate };
}

const topicCases = [
  topicCase('math/addition', flattenSkillsByGrade(additionSkillsByGrade), (skillId) => generateAdditionTopicQuestion(baseConfig('addition', skillId))),
  topicCase('math/subtraction', flattenSkillsByGrade(subtractionSkillsByGrade), (skillId) => generateSubtractionTopicQuestion(baseConfig('subtraction', skillId))),
  topicCase('math/multiplication', flattenSkillsByGrade(multiplicationSkillsByGrade), (skillId) => generateMultiplicationQuestion(baseConfig('multiplication', skillId))),
  topicCase('math/division', flattenSkillsByGrade(divisionSkillsByGrade), (skillId) => generateDivisionTopicQuestion(baseConfig('division', skillId))),
  topicCase('math/cube-tools', cubeToolsCatalog.map((skill) => skill.skillId), (skillId) => generateCubeToolsQuestion(baseConfig('cube-tools', skillId))),
  topicCase('math/data-graphs', dataGraphsSkills.map((skill) => skill.skillId), (skillId) => generateDataGraphsQuestion(baseConfig('data-graphs', skillId))),
  topicCase('math/story-math', storyMathCatalog.map((skill) => skill.skillId), (skillId) => generateStoryMathQuestion(baseConfig('story-math', skillId))),
  topicCase('math/interactive-tools', interactiveToolsCatalog.map((skill) => skill.skillId), (skillId) => generateInteractiveToolsQuestion(baseConfig('interactive-tools', skillId))),
  topicCase('math/testing', Object.keys(testingGenerator), (skillId) => generateTestingQuestion(baseConfig('testing', skillId))),
  topicCase('math/shapes', shapesMicroSkills.map((skill) => skill.id), (skillId) => shapesGenerator(baseConfig('shapes', skillId))),
  topicCase('math/place-values', placeValueMicroSkills.map((skill) => skill.id), (skillId) => placeValueGenerator(baseConfig('place-values', skillId))),
  topicCase('math/fractions', Object.keys(fractionsV2Generators), (skillId) => generateFractionsV2Question(baseConfig('fractions', skillId))),
  topicCase('math/measurement', MEASUREMENT_CATALOG.map((skill) => skill.skillId), (skillId) => generateMeasurementQuestion(baseConfig('measurement', skillId))),
  topicCase('math/standard-object-measurement', somCatalog.map((skill) => skill.skillId), (skillId) => generateSOMTopicQuestion(baseConfig('standard-object-measurement', skillId))),
  topicCase('science/units-measurement', flattenSkillsByGrade(unitsMeasurementSkillsByGrade), (skillId) => {
    const generator = resolveUnitsMeasurementGenerator(skillId, baseConfig('units-measurement', skillId));
    if (!generator) throw new Error(`could not resolve generator for ${skillId}`);
    return generator.generate({ seed: seedFor('units-measurement', skillId), difficulty: 'adaptive' });
  }),
  topicCase('science/solar-system', Object.keys(solarSystemSkills), (skillId) => {
    const generator = resolveSolarSystemGenerator(skillId, baseConfig('solar-system', skillId));
    if (!generator) throw new Error(`could not resolve generator for ${skillId}`);
    return generator.generate({ seed: seedFor('solar-system', skillId), difficulty: 'adaptive' });
  }),
  topicCase('english/grammar', flattenSkillsByGrade(grammarSkillsByGrade), (skillId) => {
    const generator = resolveGrammarGenerator(skillId, baseConfig('grammar', skillId));
    if (!generator) throw new Error(`could not resolve generator for ${skillId}`);
    return generator.generate({ seed: seedFor('grammar', skillId), difficulty: 'adaptive' });
  }),
  topicCase('social/gk', Object.keys(gkGenerators), (skillId) => generateSmartGKQuestion(baseConfig('gk', skillId))),
];

const errors = [];
const warnings = [];
const counts = [];

for (const entry of topicCases) {
  let passed = 0;
  for (const skillId of entry.skillIds) {
    try {
      const question = entry.generate(skillId);
      const result = validateQuestion(question, { topic: entry.topic, skillId });
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      if (result.errors.length === 0) passed += 1;
    } catch (error) {
      errors.push(`${entry.topic}/${skillId}: ${error.message}`);
    }
  }
  counts.push({ topic: entry.topic, total: entry.skillIds.length, passed });
}

console.log('\nGenerator audit');
console.log('===============');
for (const count of counts) {
  console.log(`${count.topic.padEnd(34)} ${String(count.passed).padStart(3)}/${String(count.total).padEnd(3)} passed`);
}

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length})`);
  warnings.slice(0, 80).forEach((warning) => console.log(`- ${warning}`));
  if (warnings.length > 80) console.log(`- ... ${warnings.length - 80} more warnings`);
}

if (errors.length) {
  console.error(`\nErrors (${errors.length})`);
  errors.slice(0, 120).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 120) console.error(`- ... ${errors.length - 120} more errors`);
}

if (errors.length || (strict && warnings.length)) {
  process.exitCode = 1;
} else {
  console.log('\nAudit passed.');
}
