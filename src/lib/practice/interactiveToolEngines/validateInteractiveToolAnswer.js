import { getInteractiveToolEngine } from './registry.js';

export function validateInteractiveToolAnswer(question, userAnswer) {
  const toolId = question?.toolId || question?.toolConfig?.toolId;
  const engine = getInteractiveToolEngine(toolId);

  if (!engine?.validate) {
    const expected = question?.answer ?? question?.correctAnswer;
    if (!expected || expected.value === null || expected.value === undefined) return true;
    const actual = userAnswer && typeof userAnswer === 'object'
      ? userAnswer.value ?? userAnswer.answer?.value
      : userAnswer;
    return String(actual) === String(expected.value);
  }

  return engine.validate(userAnswer, question.answer ?? question.correctAnswer, question.validation).isCorrect;
}
