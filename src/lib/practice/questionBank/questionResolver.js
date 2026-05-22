import { findStoredPracticeQuestion } from './questionRepository.js';

function buildTemplateFromQuestion(question, { skill }) {
  return {
    logicType: question.metadata?.logicType || question.metadata?.skillId || skill,
    logic_type: question.metadata?.logicType || question.metadata?.skillId || skill,
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
}) {
  if (source === 'generator') return null;

  const question = await findStoredPracticeQuestion({
    subject,
    topic,
    skill,
    difficulty,
    seed,
  });

  if (!question) return null;

  return {
    success: true,
    source: 'mongodb',
    question,
    seed,
    template: buildTemplateFromQuestion(question, { skill }),
  };
}
