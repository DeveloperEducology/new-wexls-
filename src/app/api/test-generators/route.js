import { NextResponse } from 'next/server';
import { generateShapesQuestion } from '../../../lib/practice/generators/math/topics/shapes/engine.js';
import { generateDataGraphsQuestion } from '../../../lib/practice/generators/math/topics/data-graphs/engine.js';
import { resolveCompetency } from '../../../lib/competency/index.js';

const SHAPES_SKILLS = [
  'shapes-remedial-match-basic',
  'shapes-remedial-count-sides',
  'shapes-g1-identify-visual-text-opts',
  'shapes-g1-identify-name-visual-opts',
  'shapes-g2-2d-vs-3d',
  'shapes-g2-vertices-edges-faces',
  'shapes-g3-quadrilaterals',
  'shapes-g3-symmetry-lines',
  'shapes-g3-symmetry-check'
];

const DATA_GRAPHS_SKILLS = [
  'data-graphs-remedial-count-objects',
  'data-graphs-remedial-tally-read-5',
  'data-graphs-g1-read-picture-graph',
  'data-graphs-g1-read-pictograph',
  'data-graphs-g1-compare-bar-graph',
  'data-graphs-g1-count-bar-graph',
  'data-graphs-g1-find-least-bar-graph',
  'data-graphs-g2-scaled-bar-graph',
  'data-graphs-g2-scaled-pictograph',
  'data-graphs-g2-read-tally-chart',
  'data-graphs-g3-line-plot'
];

export async function GET(request) {
  const results = [];
  const seed = 'test-seed-12345';

  // 1. Test Shapes Skills
  for (const skill of SHAPES_SKILLS) {
    try {
      const config = {
        difficulty: 'adaptive',
        logic_type: skill,
        forcedTask: skill,
        variables: { seed }
      };
      const question = generateShapesQuestion(config);
      const competency = resolveCompetency({
        subject: 'math',
        topic: 'shapes',
        skillId: skill,
        templateId: question.metadata?.templateId
      });

      const validation = validateQuestionPayload(question, competency);

      results.push({
        topic: 'shapes',
        skill,
        success: true,
        type: question.type,
        competencyId: competency?.id || null,
        validation
      });
    } catch (error) {
      results.push({
        topic: 'shapes',
        skill,
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }

  // 2. Test Data & Graphs Skills
  for (const skill of DATA_GRAPHS_SKILLS) {
    try {
      const config = {
        difficulty: 'adaptive',
        logic_type: skill,
        forcedTask: skill,
        variables: { seed }
      };
      const question = generateDataGraphsQuestion(config);
      const competency = resolveCompetency({
        subject: 'math',
        topic: 'data-graphs',
        skillId: skill,
        templateId: question.metadata?.templateId || question.metadata?.task
      });

      const validation = validateQuestionPayload(question, competency);

      results.push({
        topic: 'data-graphs',
        skill,
        success: true,
        type: question.type,
        competencyId: competency?.id || null,
        validation
      });
    } catch (error) {
      results.push({
        topic: 'data-graphs',
        skill,
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }

  const allPassed = results.every(r => r.success && r.validation?.passed);

  return NextResponse.json({
    allPassed,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success && r.validation?.passed).length,
      failed: results.filter(r => !r.success || !r.validation?.passed).length
    },
    results
  });
}

function validateQuestionPayload(q, comp) {
  const errors = [];

  if (!q.questionText || typeof q.questionText !== 'string') {
    errors.push('Missing or invalid questionText');
  }

  if (!q.type || !['mcq', 'fillInTheBlank'].includes(q.type)) {
    errors.push(`Invalid question type: ${q.type}`);
  }

  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push('MCQ must have at least 2 options');
    }
    if (typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= (q.options?.length || 0)) {
      errors.push(`Invalid correctAnswerIndex: ${q.correctAnswerIndex}`);
    }
  } else if (q.type === 'fillInTheBlank') {
    if (!q.answer || typeof q.answer !== 'object') {
      errors.push('fillInTheBlank must have an answer object mapping blanks');
    }
  }

  if (!q.explanation || !Array.isArray(q.explanation.sections)) {
    errors.push('Missing or invalid explanation sections');
  }

  if (!q.remediation || typeof q.remediation !== 'string') {
    errors.push('Missing or invalid remediation text');
  }

  if (!comp) {
    errors.push('Could not resolve competency mapping');
  }

  return {
    passed: errors.length === 0,
    errors
  };
}
