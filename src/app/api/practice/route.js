import { NextResponse } from 'next/server';
import {
  createAdditionTopicTemplate,
  generateAdditionTopicQuestion,
} from '../../../lib/practice/generators/math/topics/addition';
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
import { generateSmartGKQuestion } from '../../../lib/practice/generators/social/topics/gk/index.js';
import { gkGenerators } from '../../../lib/practice/generators/social/topics/gk/registry.js';

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

  const isMathTopic = subject === 'math' && ['addition', 'time', 'fractions', 'place-values', 'testing'].includes(topic);
  const isSocialTopic = subject === 'social' && topic === 'gk';

  if (!isMathTopic && !isSocialTopic) {
    return NextResponse.json(
      { success: false, error: `Unsupported practice route: ${subject}/${topic}` },
      { status: 404 },
    );
  }

  const config = {
    difficulty: searchParams.get('difficulty') || 'adaptive',
    logic_type: skill,
    forcedTask: skill,
    history: {
      correctStreak: Number(searchParams.get('correctStreak') || 0),
      practiceLevel: Number(searchParams.get('practiceLevel') || 1),
      levelStreak: Number(searchParams.get('levelStreak') || 0),
      lastResult: searchParams.get('lastResult') || 'none',
    },
    variables: { seed },
  };

  try {
    if (subject === 'social' && topic === 'gk') {
      const question = normalizeGenericTopicQuestion(
        generateSmartGKQuestion(config),
        { topic, skill, seed, engine: 'gk', subject: 'social' },
      );

      return NextResponse.json({
        success: true,
        question,
        seed,
        template: {
          logic_type: skill,
          ...(gkGenerators[skill] || {}),
        },
      });
    }

    if (topic === 'time') {
      const question = normalizeTimeQuestion(
        timeGenerator(config),
        { skill, seed },
      );

      return NextResponse.json({
        success: true,
        question,
        seed,
        template: getTimeTemplateConfig(skill, question),
      });
    }

    if (topic === 'testing') {
      const question = normalizeGenericTopicQuestion(
        generateTestingQuestion(config),
        { topic, skill, seed, engine: 'testing' },
      );

      return NextResponse.json({
        success: true,
        question,
        seed,
        template: getTestingTemplateConfig(skill),
      });
    }

    if (topic === 'fractions') {
      const question = normalizeFractionsQuestion(
        generateFractionsV2Question(config),
        { skill, seed },
      );

      return NextResponse.json({
        success: true,
        question,
        seed,
        template: getFractionsV2TemplateConfig(skill),
      });
    }

    if (topic === 'place-values') {
      const question = normalizeGenericTopicQuestion(
        placeValueGenerator(config),
        { topic, skill, seed, engine: 'place-values' },
      );

      return NextResponse.json({
        success: true,
        question,
        seed,
        template: getPlaceValueTemplateConfig(question.metadata?.task || skill),
      });
    }

    const question = generateAdditionTopicQuestion(config);
    const template = createAdditionTopicTemplate(skill);

    return NextResponse.json({
      success: true,
      question,
      seed,
      template: {
        logicType: skill,
        template,
        resolved: question.resolvedConfig,
        config,
      },
    });
  } catch (error) {
    console.error('Practice API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
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

  return {
    id: question.id || `${topic}-${skill}-${seed}`,
    type: question.type,
    questionText: question.questionText || question.text || '',
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    categories: Array.isArray(question.categories) ? question.categories : undefined,
    items: Array.isArray(question.items) ? question.items : undefined,
    poolPosition: question.poolPosition,
    answer,
    correctAnswerIndex: Number.isFinite(Number(question.correctAnswerIndex))
      ? Number(question.correctAnswerIndex)
      : Number.isFinite(Number(question.correct_answer_index))
        ? Number(question.correct_answer_index)
      : null,
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
    questionText: question.questionText || '',
    parts: Array.isArray(question.parts) ? question.parts : [],
    options: Array.isArray(question.options) ? question.options : [],
    answer,
    correctAnswerIndex: Number.isFinite(Number(question.correctAnswerIndex))
      ? Number(question.correctAnswerIndex)
      : null,
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
    questionText: question.questionText || '',
    parts: normalizedParts,
    options: Array.isArray(question.options) ? question.options : [],
    answer,
    correctAnswerIndex: Number.isFinite(Number(question.correctAnswerIndex))
      ? Number(question.correctAnswerIndex)
      : null,
    solution,
    metadata,
  };
}
