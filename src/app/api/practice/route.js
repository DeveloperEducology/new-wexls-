import { NextResponse } from 'next/server';
import {
  createAdditionTopicTemplate,
  generateAdditionTopicQuestion,
} from '../../../lib/practice/generators/math/topics/addition';
import {
  createSubtractionTopicTemplate,
  generateSubtractionTopicQuestion,
} from '../../../lib/practice/generators/math/topics/subtraction';
import {
  getTimeTemplateConfig,
} from '../../../lib/practice/generators/math/topics/time';
import { timeGenerator } from '../../../lib/practice/generators/math/topics/time/registry.js';
import {
  generateFractionsV2Question,
  getFractionsV2TemplateConfig,
} from '../../../lib/practice/generators/math/topics/fractions/index.js';
import {
  getPlaceValueTemplateConfig,
} from '../../../lib/practice/generators/math/topics/place-values/index.js';
import { placeValueGenerator } from '../../../lib/practice/generators/math/topics/place-values/registry.js';
import {
  generateTestingQuestion,
  getTestingTemplateConfig,
} from '../../../lib/practice/generators/math/topics/testing/index.js';
import {
  generateSOMTopicQuestion,
  getSOMSkill,
} from '../../../lib/practice/generators/math/topics/standard-object-measurement/index.js';

import { generateSmartGKQuestion } from '../../../lib/practice/generators/social/topics/gk/index.js';
import { gkGenerators } from '../../../lib/practice/generators/social/topics/gk/registry.js';
import { resolveCompetency } from '../../../lib/competency/index.js';
import {
  createMultiplicationTemplate,
  generateMultiplicationQuestion,
} from '../../../lib/practice/generators/math/topics/multiplication';
import { resolveUnitsMeasurementGenerator } from '../../../lib/practice/generators/science/topics/units-measurement/index.js';
import { resolveSolarSystemGenerator } from '../../../lib/practice/generators/science/topics/solar-system/index.js';
import {
  generateRatioQuestion,
} from '../../../lib/practice/generators/math/topics/ratio/index.js';
import { resolveStoredPracticePayload } from '../../../lib/practice/questionBank/questionResolver.js';
import { getCurriculumNode, listCurriculumNodes } from '../../../lib/curriculum/index.js';
import { findTopicContract } from '../../../lib/practice/topicContracts.js';

function resolveSkill(searchParams) {
  return searchParams.get('skill')
    || searchParams.get('forcedTask')
    || searchParams.get('logic_type')
    || 'addition-g1-e3-model-match-to-10';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject') || 'math';
  const topic = searchParams.get('topic') || 'addition';
  const skill = resolveSkill(searchParams);
  const seed = searchParams.get('seed') || Date.now().toString();
  const source = searchParams.get('source');
  const difficulty = searchParams.get('difficulty') || 'adaptive';

  // Look up the skill node in the DB if available to resolve centralized templates
  let skillNode = null;
  try {
    const matchingNodes = await listCurriculumNodes({ skillId: skill });
    if (matchingNodes && matchingNodes.length > 0) {
      skillNode = matchingNodes[0];
    }
    if (!skillNode) {
      skillNode = await getCurriculumNode(skill);
    }
    if (!skillNode) {
      skillNode = await getCurriculumNode(`${subject}-${topic}-${skill}`);
    }
  } catch (error) {
    console.error('Practice DB skill node lookup error:', error);
  }

  // Centralized template and topic resolution
  const resolvedTemplateId = skillNode?.templateId || skillNode?.metadata?.templateId || skill;
  const resolvedTopic = skillNode?.topicId || topic;
  const targetTopic = skillNode?.engine || resolvedTopic;

  const topicContract = findTopicContract(subject, targetTopic);

  const streakThreshold = Number(
    skillNode?.metadata?.streakThreshold ||
    skillNode?.streakThreshold ||
    topicContract?.streakThreshold ||
    topicContract?.metadata?.streakThreshold ||
    5
  );

  const withCompetency = (payload, ctx) => normalizeWithCompetency(payload, { ...ctx, streakThreshold });

  // Check stored/DB questions first to support dynamic curriculum/topics
  try {
    const mixWithGenerator = skillNode?.metadata?.mixWithGenerator === true;
    const generatorProbability = Number(skillNode?.metadata?.generatorProbability ?? 0.5);
    
    // Hash seed deterministically between 0 and 1
    const seedVal = (() => {
      const text = String(seed || Date.now());
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
      }
      return (hash % 100) / 100;
    })();

    const skipDbForGenerator = mixWithGenerator && (seedVal < generatorProbability);

    if (!skipDbForGenerator) {
      const storedPayload = await resolveStoredPracticePayload({
        subject,
        topic,
        skill,
        difficulty,
        seed,
        source,
      });

      if (storedPayload) {
        return NextResponse.json(withCompetency(storedPayload, { subject, topic, skill }));
      }
    }
  } catch (error) {
    console.error('Practice DB Pre-fetch error:', error);
  }

  let isDbTopicActive = false;
  try {
    let topicNode = await getCurriculumNode(targetTopic);
    if (!topicNode && !targetTopic.includes('-')) {
      topicNode = await getCurriculumNode(`${subject}-${targetTopic}`);
    }
    isDbTopicActive = topicNode && topicNode.type === 'topic' && topicNode.status === 'active';
  } catch (error) {
    console.error('Practice DB node check error:', error);
  }

  const isMathTopic = subject === 'math' && ['addition', 'subtraction', 'multiplication', 'division', 'time', 'fractions', 'place-values', 'testing', 'ratio', 'ratios', 'lkg', 'shapes', 'measurement', 'standard-object-measurement', 'story-math', 'interactive-tools', 'cube-tools'].includes(targetTopic);

  const isSocialTopic = subject === 'social' && targetTopic === 'gk';

  const isScienceTopic = subject === 'science' && ['units-measurement', 'solar-system'].includes(targetTopic);
  const isEnglishTopic = subject === 'english' && ['grammar', 'lkg'].includes(targetTopic);

  if (!topicContract && !isMathTopic && !isSocialTopic && !isScienceTopic && !isEnglishTopic) {
    if (isDbTopicActive) {
      return NextResponse.json(
        { success: false, error: `No stored questions found for database-fetched skill: ${skill}` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: `Unsupported practice route: ${subject}/${topic}` },
      { status: 404 },
    );
  }

  const config = {
    difficulty,
    logic_type: resolvedTemplateId,
    forcedTask: resolvedTemplateId,
    history: {
      correctStreak: Number(searchParams.get('correctStreak') || 0),
      practiceLevel: Number(searchParams.get('practiceLevel') || 1),
      levelStreak: Number(searchParams.get('levelStreak') || 0),
      lastResult: searchParams.get('lastResult') || 'none',
      remediationActive: searchParams.get('remediationActive') === 'true',
      remediationStep: Number(searchParams.get('remediationStep') || 0),
    },
    variables: { seed },
  };

  try {
    if (topicContract) {
      const rawQuestion = topicContract.generateQuestion(config);
      const question = topicContract.normalizeQuestion(rawQuestion, {
        subject,
        topic: targetTopic,
        skill: resolvedTemplateId,
        seed,
      });

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: topicContract.getTemplate(resolvedTemplateId, question),
      }, { subject, topic, skill }));
    }

    if (subject === 'social' && targetTopic === 'gk') {
      const question = normalizeGenericTopicQuestion(
        generateSmartGKQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'gk', subject: 'social' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logic_type: resolvedTemplateId,
          ...(gkGenerators[resolvedTemplateId] || {}),
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'time') {
      const question = normalizeTimeQuestion(
        timeGenerator(config),
        { skill: resolvedTemplateId, seed },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getTimeTemplateConfig(resolvedTemplateId, question),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'testing') {
      const question = normalizeGenericTopicQuestion(
        generateTestingQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'testing' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getTestingTemplateConfig(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'standard-object-measurement') {
      const question = normalizeGenericTopicQuestion(
        generateSOMTopicQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'standard-object-measurement' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getSOMSkill(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'fractions') {
      const question = normalizeFractionsQuestion(
        generateFractionsV2Question(config),
        { skill: resolvedTemplateId, seed },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getFractionsV2TemplateConfig(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'place-values') {
      const question = normalizeGenericTopicQuestion(
        placeValueGenerator(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'place-values' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getPlaceValueTemplateConfig(question.metadata?.task || resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'subtraction') {
      const question = generateSubtractionTopicQuestion(config);
      const template = createSubtractionTopicTemplate(resolvedTemplateId);

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'division') {
      const { generateDivisionTopicQuestion, createDivisionTopicTemplate } = await import('../../../lib/practice/generators/math/topics/division/index.js');
      const question = generateDivisionTopicQuestion(config);
      const template = createDivisionTopicTemplate(resolvedTemplateId);

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && targetTopic === 'units-measurement') {
      const generator = resolveUnitsMeasurementGenerator(resolvedTemplateId, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${resolvedTemplateId}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: generator.template.engine, subject }
      );
      
      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && targetTopic === 'solar-system') {
      const generator = resolveSolarSystemGenerator(resolvedTemplateId, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${resolvedTemplateId}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: generator.template.engine, subject }
      );
      
      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (subject === 'english' && ['grammar', 'lkg'].includes(targetTopic)) {
      const generator = targetTopic === 'lkg'
        ? (await import('../../../lib/practice/generators/english/topics/lkg/engine.js')).resolveLkgGenerator(resolvedTemplateId, config)
        : (await import('../../../lib/practice/generators/english/topics/grammar/engine.js')).resolveGrammarGenerator(resolvedTemplateId, config);

      if (!generator) {
        throw new Error(`Could not resolve generator for ${resolvedTemplateId}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: generator.template.engine, subject }
      );
      
      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'lkg') {
      const { generateLkgQuestion } = await import('../../../lib/practice/generators/math/topics/lkg/index.js');
      const question = normalizeGenericTopicQuestion(
        generateLkgQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'lkg' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          title: question.metadata?.templateId || resolvedTemplateId,
          description: "LKG Practice Topic"
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'shapes') {
      const { shapesGenerator, getShapesTemplate } = await import('../../../lib/practice/generators/math/topics/shapes/index.js');
      const question = normalizeGenericTopicQuestion(
        shapesGenerator(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'shapes' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getShapesTemplate(question.metadata?.templateId || resolvedTemplateId) || {
          id: resolvedTemplateId,
          family: 'shapes',
          engine: 'shapes',
          questionType: 'mcq'
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'measurement') {
      const { generateMeasurementQuestion } = await import('../../../lib/practice/generators/math/topics/measurement/index.js');
      const question = normalizeGenericTopicQuestion(
        generateMeasurementQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'measurement' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          title: question.metadata?.templateId || resolvedTemplateId,
          description: "Measurement Practice Topic"
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'story-math') {
      const { generateStoryMathQuestion, getStoryMathTemplate } = await import('../../../lib/practice/generators/math/topics/story-math/index.js');
      const question = normalizeGenericTopicQuestion(
        generateStoryMathQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'story-math' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getStoryMathTemplate(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'interactive-tools') {
      const { generateInteractiveToolsQuestion, getInteractiveToolsTemplate } = await import('../../../lib/practice/generators/math/topics/interactive-tools/index.js');
      const question = normalizeGenericTopicQuestion(
        generateInteractiveToolsQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'interactive-tools' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getInteractiveToolsTemplate(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'cube-tools') {
      const { generateCubeToolsQuestion, getCubeToolsTemplate } = await import('../../../lib/practice/generators/math/topics/cube-tools/index.js');
      const question = normalizeGenericTopicQuestion(
        generateCubeToolsQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'cube-tools' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getCubeToolsTemplate(resolvedTemplateId),
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'ratio' || targetTopic === 'ratios') {
      const question = normalizeGenericTopicQuestion(
        generateRatioQuestion(config),
        { topic: targetTopic, skill: resolvedTemplateId, seed, engine: 'ratio' },
      );


      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: question.metadata?.templateId || resolvedTemplateId,
          title: question.metadata?.templateId || resolvedTemplateId,
          description: "Ratio topic template practice",
          competency: {
            id: "ratio_competency",
            title: "Ratio comparison and calculations"
          }
        },
      }, { subject, topic, skill }));
    }

    if (targetTopic === 'multiplication') {
      const question = generateMultiplicationQuestion(config);

      const template = createMultiplicationTemplate(resolvedTemplateId);

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: resolvedTemplateId,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    const question = generateAdditionTopicQuestion(config);
    const template = createAdditionTopicTemplate(resolvedTemplateId);

    return NextResponse.json(withCompetency({
      success: true,
      question,
      seed,
      template: {
        logicType: resolvedTemplateId,
        template,
        resolved: question.resolvedConfig,
        config,
      },
    }, { subject, topic, skill }));
  } catch (error) {
    console.error('Practice API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function normalizeWithCompetency(payload, { subject, topic, skill, streakThreshold }) {
  const payloadWithSource = {
    source: 'generator',
    ...payload,
  };

  if (!payloadWithSource.question) {
    return payloadWithSource;
  }

  const finalStreakThreshold = Number(
    payloadWithSource.question.metadata?.streakThreshold ||
    payloadWithSource.question.streakThreshold ||
    streakThreshold ||
    5
  );

  const competency = resolveCompetency({
    subject,
    topic,
    skillId: skill,
    templateId: payloadWithSource.question.metadata?.templateId,
  });

  const questionMetadata = {
    ...(payloadWithSource.question.metadata || {}),
    streakThreshold: finalStreakThreshold,
  };

  if (competency) {
    questionMetadata.competencyId = competency.id;
    questionMetadata.competency = competency;
  }

  return {
    ...payloadWithSource,
    competency: competency || undefined,
    question: {
      ...payloadWithSource.question,
      metadata: questionMetadata,
    },
    template: payloadWithSource.template
      ? {
          ...payloadWithSource.template,
          competency: competency || undefined,
        }
      : payloadWithSource.template,
  };
}

function normalizeGenericTopicQuestion(question, { topic, skill, seed, engine, subject = 'math' }) {
  if (!question) {
    throw new Error(`No question generated for ${subject}/${topic}/${skill}`);
  }

  const parts = Array.isArray(question.parts) ? question.parts : [];
  const normalizedParts = question.type === 'fillInTheBlank' && question.questionText
    ? [{ type: 'text', content: question.questionText }, ...parts]
    : parts;
  const answer = question.answer
    ?? question.validation?.answer
    ?? parseAnswer(question.correctAnswerText)
    ?? question.correctAnswer
    ?? question.correct_answer_indices
    ?? question.correct_answer_index
    ?? null;

  const rawCategories = Array.isArray(question.categories) ? question.categories : undefined;
  const rawItems = Array.isArray(question.items) ? question.items : undefined;

  let categories = rawCategories;
  let items = rawItems;

  if (question.type === 'matching' && Array.isArray(question.pairs)) {
    const uniqueRights = Array.from(new Set(question.pairs.map(p => p.right?.content || p.right?.label || p.right)));
    categories = uniqueRights.map(val => ({ id: val, label: val }));
    items = question.pairs.map((p, index) => {
      const id = p.left?.content || p.left?.label || p.left?.id || p.id || `left_${index}`;
      return {
        id: id,
        content: p.left?.content || p.left?.label || p.left || '',
        imageUrl: p.left?.imageUrl || undefined
      };
    });
  }
  const normalizedAnswer = answer ?? (
    question.type === 'matching' && Array.isArray(question.pairs)
      ? Object.fromEntries(question.pairs.map((p, index) => {
          const leftId = p.left?.content || p.left?.label || p.left?.id || p.id || `left_${index}`;
          const rightId = p.right?.content || p.right?.label || p.right?.id || p.right;
          return [leftId, rightId];
        }).filter(([leftId, rightId]) => leftId !== undefined && rightId !== undefined))
      : null
  );

  return {
    id: question.id || `${topic}-${skill}-${seed}`,
    type: question.type,
    appletType: question.appletType,
    storyId: question.storyId,
    title: question.title,
    eyebrow: question.eyebrow,
    modes: question.modes,
    defaultMode: question.defaultMode,
    toolId: question.toolId,
    toolVersion: question.toolVersion,
    toolConfig: question.toolConfig,
    validation: question.validation,
    feedback: question.feedback,
    layout: question.layout,
    accessibility: question.accessibility,
    manipulativeType: question.manipulativeType,
    initialState: question.initialState,
    interaction: question.interaction,
    layoutMode: question.layoutMode,
    questionText: question.questionText || question.text || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    metaConfig: question.metaConfig,
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    categories,
    items,
    targets: Array.isArray(question.targets) ? question.targets : undefined,
    canvas: question.canvas,
    connectors: Array.isArray(question.connectors) ? question.connectors : undefined,
    behavior: question.behavior,
    sourceTray: question.sourceTray,
    cardStyle: question.cardStyle,
    itemCardStyle: question.itemCardStyle,
    imageCardStyle: question.imageCardStyle,
    cardVariant: question.cardVariant,
    hideItemLabels: question.hideItemLabels,
    pairs: Array.isArray(question.pairs) ? question.pairs : undefined,
    poolPosition: question.poolPosition,
    answer: normalizedAnswer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex) ?? normalizeIndex(question.correct_answer_index),
    solution: normalizeSolution(question.solution || question.explanation),
    metadata: {
      ...(question.metadata || {}),
      subject,
      topic,
      skillId: skill,
      templateId: question.metadata?.templateId || question.metadata?.task || skill,
      engine,
      seed,
    },
  };
}

function normalizeSolution(solution) {
  if (!solution) return { sections: [] };
  if (Array.isArray(solution)) {
    return {
      sections: solution.flatMap((section) => {
        if (Array.isArray(section?.parts)) return section.parts;
        return section;
      }),
    };
  }
  if (!Array.isArray(solution.sections)) {
    const sections = [];
    if (solution.text) sections.push({ type: 'text', content: solution.text });
    if (solution.explanation) sections.push({ type: 'text', content: solution.explanation });
    return { sections };
  }
  return solution;
}

function normalizeIndex(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
}

function parseAnswer(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeFractionsQuestion(question, { skill, seed }) {
  const answer = question.answer
    ?? question.validation?.answer
    ?? parseAnswer(question.correctAnswerText)
    ?? question.correctAnswer
    ?? question.correctAnswerId
    ?? null;

  return {
    id: question.id || `fractions-${skill}-${seed}`,
    type: question.type,
    interaction: question.interaction,
    questionText: question.questionText || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    metaConfig: question.metaConfig,
    parts: Array.isArray(question.parts) ? question.parts : [],
    options: Array.isArray(question.options) ? question.options : [],
    answer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex),
    solution: normalizeSolution(question.solution || question.explanation),
    metadata: {
      ...(question.metadata || {}),
      subject: 'math',
      topic: 'fractions',
      skillId: skill,
      templateId: question.adaptiveConfig?.logic_type || question.metadata?.logic_type || skill,
      engine: 'fractions',
      seed,
    },
  };
}

function normalizeTimeQuestion(question, { skill, seed }) {
  const metadata = {
    ...(question.metadata || {}),
    subject: 'math',
    topic: 'time',
    skillId: skill,
    templateId: question.metadata?.task || skill,
    engine: 'time',
    seed,
  };
  const answer = question.answer ?? question.correctAnswer ?? question.correctAnswerText ?? null;
  const solution = question.solution || question.explanation || { sections: [] };

  const parts = Array.isArray(question.parts) ? question.parts : [];
  const normalizedParts = question.type === 'fillInTheBlank' && question.questionText
    ? [{ type: 'text', content: question.questionText }, ...parts]
    : parts;

  return {
    id: question.id || `time-${skill}-${seed}`,
    type: question.type,
    interaction: question.interaction,
    questionText: question.questionText || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    metaConfig: question.metaConfig,
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    answer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex),
    solution,
    metadata,
  };
}
