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
import { getCurriculumNode } from '../../../lib/curriculum/index.js';



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

  // Check stored/DB questions first to support dynamic curriculum/topics
  try {
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
  } catch (error) {
    console.error('Practice DB Pre-fetch error:', error);
  }

  let isDbTopicActive = false;
  try {
    let topicNode = await getCurriculumNode(topic);
    if (!topicNode && !topic.includes('-')) {
      topicNode = await getCurriculumNode(`${subject}-${topic}`);
    }
    isDbTopicActive = topicNode && topicNode.type === 'topic' && topicNode.status === 'active';
  } catch (error) {
    console.error('Practice DB node check error:', error);
  }

  const isMathTopic = subject === 'math' && ['addition', 'subtraction', 'multiplication', 'time', 'fractions', 'place-values', 'testing', 'ratio', 'ratios', 'lkg', 'shapes', 'measurement', 'standard-object-measurement'].includes(topic);

  const isSocialTopic = subject === 'social' && topic === 'gk';

  const isScienceTopic = subject === 'science' && ['units-measurement', 'solar-system'].includes(topic);
  const isEnglishTopic = subject === 'english' && topic === 'grammar';

  if (!isMathTopic && !isSocialTopic && !isScienceTopic && !isEnglishTopic) {
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
    logic_type: skill,
    forcedTask: skill,
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

    if (subject === 'social' && topic === 'gk') {
      const question = normalizeGenericTopicQuestion(
        generateSmartGKQuestion(config),
        { topic, skill, seed, engine: 'gk', subject: 'social' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logic_type: skill,
          ...(gkGenerators[skill] || {}),
        },
      }, { subject, topic, skill }));
    }

    if (topic === 'time') {
      const question = normalizeTimeQuestion(
        timeGenerator(config),
        { skill, seed },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getTimeTemplateConfig(skill, question),
      }, { subject, topic, skill }));
    }

    if (topic === 'testing') {
      const question = normalizeGenericTopicQuestion(
        generateTestingQuestion(config),
        { topic, skill, seed, engine: 'testing' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getTestingTemplateConfig(skill),
      }, { subject, topic, skill }));
    }

    if (topic === 'standard-object-measurement') {
      const question = normalizeGenericTopicQuestion(
        generateSOMTopicQuestion(config),
        { topic, skill, seed, engine: 'standard-object-measurement' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getSOMSkill(skill),
      }, { subject, topic, skill }));
    }


    if (topic === 'fractions') {
      const question = normalizeFractionsQuestion(
        generateFractionsV2Question(config),
        { skill, seed },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getFractionsV2TemplateConfig(skill),
      }, { subject, topic, skill }));
    }

    if (topic === 'place-values') {
      const question = normalizeGenericTopicQuestion(
        placeValueGenerator(config),
        { topic, skill, seed, engine: 'place-values' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getPlaceValueTemplateConfig(question.metadata?.task || skill),
      }, { subject, topic, skill }));
    }

    if (topic === 'subtraction') {
      const question = generateSubtractionTopicQuestion(config);
      const template = createSubtractionTopicTemplate(skill);

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: skill,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && topic === 'units-measurement') {
      const generator = resolveUnitsMeasurementGenerator(skill, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${skill}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic, skill, seed, engine: generator.template.engine, subject }
      );
      
      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (subject === 'science' && topic === 'solar-system') {
      const generator = resolveSolarSystemGenerator(skill, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${skill}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic, skill, seed, engine: generator.template.engine, subject }
      );
      
      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (subject === 'english' && topic === 'grammar') {
      const { resolveGrammarGenerator } = await import('../../../lib/practice/generators/english/topics/grammar/engine.js');
      const generator = resolveGrammarGenerator(skill, config);
      if (!generator) {
        throw new Error(`Could not resolve generator for ${skill}`);
      }
      
      const questionData = generator.generate({ ...config.variables, difficulty: config.difficulty });
      const question = normalizeGenericTopicQuestion(
        questionData,
        { topic, skill, seed, engine: generator.template.engine, subject }
      );
      
      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: generator.template,
      }, { subject, topic, skill }));
    }

    if (topic === 'lkg') {
      const { generateLkgQuestion } = await import('../../../lib/practice/generators/math/topics/lkg/index.js');
      const question = normalizeGenericTopicQuestion(
        generateLkgQuestion(config),
        { topic, skill, seed, engine: 'lkg' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: skill,
          title: question.metadata?.templateId || skill,
          description: "LKG Practice Topic"
        },
      }, { subject, topic, skill }));
    }

    if (topic === 'shapes') {
      const { shapesGenerator, getShapesTemplate } = await import('../../../lib/practice/generators/math/topics/shapes/index.js');
      const question = normalizeGenericTopicQuestion(
        shapesGenerator(config),
        { topic, skill, seed, engine: 'shapes' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: getShapesTemplate(question.metadata?.templateId || skill) || {
          id: skill,
          family: 'shapes',
          engine: 'shapes',
          questionType: 'mcq'
        },
      }, { subject, topic, skill }));
    }

    if (topic === 'measurement') {
      const { generateMeasurementQuestion } = await import('../../../lib/practice/generators/math/topics/measurement/index.js');
      const question = normalizeGenericTopicQuestion(
        generateMeasurementQuestion(config),
        { topic, skill, seed, engine: 'measurement' },
      );

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: skill,
          title: question.metadata?.templateId || skill,
          description: "Measurement Practice Topic"
        },
      }, { subject, topic, skill }));
    }

    if (topic === 'ratio' || topic === 'ratios') {
      const question = normalizeGenericTopicQuestion(
        generateRatioQuestion(config),
        { topic, skill, seed, engine: 'ratio' },
      );


      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: question.metadata?.templateId || skill,
          title: question.metadata?.templateId || skill,
          description: "Ratio topic template practice",
          competency: {
            id: "ratio_competency",
            title: "Ratio comparison and calculations"
          }
        },
      }, { subject, topic, skill }));
    }

    if (topic === 'multiplication') {
      const question = generateMultiplicationQuestion(config);

      const template = createMultiplicationTemplate(skill);

      return NextResponse.json(withCompetency({
        success: true,
        question,
        seed,
        template: {
          logicType: skill,
          template,
          resolved: question.resolvedConfig,
          config,
        },
      }, { subject, topic, skill }));
    }

    const question = generateAdditionTopicQuestion(config);
    const template = createAdditionTopicTemplate(skill);

    return NextResponse.json(withCompetency({
      success: true,
      question,
      seed,
      template: {
        logicType: skill,
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

function withCompetency(payload, { subject, topic, skill }) {
  const payloadWithSource = {
    source: 'generator',
    ...payload,
  };

  const competency = resolveCompetency({
    subject,
    topic,
    skillId: skill,
    templateId: payloadWithSource.question?.metadata?.templateId,
  });

  if (!competency || !payloadWithSource.question) return payloadWithSource;

  return {
    ...payloadWithSource,
    competency,
    question: {
      ...payloadWithSource.question,
      metadata: {
        ...(payloadWithSource.question.metadata || {}),
        competencyId: competency.id,
        competency,
      },
    },
    template: payloadWithSource.template
      ? {
          ...payloadWithSource.template,
          competency,
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
    items = question.pairs.map(p => {
      const id = p.left?.content || p.left?.id || p.id || String(Math.random());
      return {
        id: id,
        content: p.left?.content || p.left?.label || p.left || '',
        imageUrl: p.left?.imageUrl || undefined
      };
    });
  }

  return {
    id: question.id || `${topic}-${skill}-${seed}`,
    type: question.type,
    interaction: question.interaction,
    questionText: question.questionText || question.text || '',
    audioUrl: question.audioUrl,
    voice: question.voice,
    metaConfig: question.metaConfig,
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    categories,
    items,
    pairs: Array.isArray(question.pairs) ? question.pairs : undefined,
    poolPosition: question.poolPosition,
    answer,
    correctAnswerIndex: normalizeIndex(question.correctAnswerIndex) ?? normalizeIndex(question.correct_answer_index),
    solution: normalizeSolution(question.solution || question.explanation),
    metadata: {
      ...(question.metadata || {}),
      subject,
      topic,
      skillId: skill,
      templateId: question.metadata?.task || skill,
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
