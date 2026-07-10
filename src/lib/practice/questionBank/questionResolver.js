import { findStoredPracticeQuestion, findVocabularyPool } from './questionRepository.js';
import { generateFromDynamicPool } from '../engine/DynamicPoolGenerator.js';

function buildTemplateFromQuestion(question, { skill }) {
  const resolvedSkill = Array.isArray(skill) ? skill[0] : skill;
  return {
    logicType: question.metadata?.logicType || question.metadata?.skillId || resolvedSkill,
    logic_type: question.metadata?.logicType || question.metadata?.skillId || resolvedSkill,
    templateId: question.metadata?.templateId,
    engine: question.metadata?.engine,
    resolved: question.resolvedConfig,
    source: 'mongodb',
  };
}

export async function resolveStoredPracticePayload({
  subject,
  topic,
  skill,
  difficulty,
  seed,
  source,
  history = {},
  grade = 'lkg',
  qn,
  isStatic,
}) {
  if (source === 'generator') return null;

  const question = await findStoredPracticeQuestion({
    subject,
    topic,
    skill,
    difficulty,
    seed,
    qn,
    isStatic,
  });

  if (!question) return null;

  if (question.type === 'dynamic_pool') {
    const resolvedSkill = Array.isArray(skill) ? skill[0] : skill;
    try {
      // Hydrate centralized option pool if referenced
      if (question.poolId) {
        const poolDoc = await findVocabularyPool(question.poolId);
        if (poolDoc) {
          question.pools = poolDoc.pools;
        }
      }

      const generatedQuestion = generateFromDynamicPool(
        question,
        seed,
        difficulty,
        history,
        grade
      );
      return {
        success: true,
        source: 'mongodb',
        question: generatedQuestion,
        seed,
        template: buildTemplateFromQuestion(generatedQuestion, { skill: resolvedSkill }),
      };
    } catch (err) {
      console.error(`[DynamicPool] Failed to generate question for skill ${resolvedSkill}:`, err);
      return null;
    }
  }

  return {
    success: true,
    source: 'mongodb',
    question,
    seed,
    template: buildTemplateFromQuestion(question, { skill }),
  };
}

