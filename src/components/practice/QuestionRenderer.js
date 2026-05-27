'use client';

import MCQRenderer from './MCQRenderer';
import FillInTheBlankRenderer from './FillInTheBlankRenderer';
import CategorizationRenderer from './CategorizationRenderer';
import InteractiveAppletRenderer from './applets/InteractiveAppletRenderer';
import InteractiveToolRenderer from './interactive-tools/InteractiveToolRenderer';

const RENDERERS = {
  mcq: MCQRenderer,
  multiplechoice: MCQRenderer,
  multipleChoice: MCQRenderer,
  fillintheblank: FillInTheBlankRenderer,
  fillInTheBlank: FillInTheBlankRenderer,
  fill_in_the_blank: FillInTheBlankRenderer,
  gridArithmetic: FillInTheBlankRenderer,
  vertical_arithmetic: FillInTheBlankRenderer,
  categorization: CategorizationRenderer,
  categorizationv2: CategorizationRenderer,
  categorySort: CategorizationRenderer,
  sorting: CategorizationRenderer,
  sort: CategorizationRenderer,
  matching: CategorizationRenderer,
  interactiveApplet: InteractiveAppletRenderer,
  interactiveapplet: InteractiveAppletRenderer,
  interactiveTool: InteractiveToolRenderer,
  interactivetool: InteractiveToolRenderer,
};

export default function QuestionRenderer({
  question,
  userAnswer,
  onAnswer,
  onSubmit,
  isAnswered,
  isCorrect,
}) {
  const normalizedType = String(question?.type || '').trim();
  const Renderer = RENDERERS[normalizedType] || RENDERERS[normalizedType.toLowerCase()];

  if (!question) return null;

  if (!Renderer) {
    return (
      <div style={{ padding: 24, color: '#991b1b', fontWeight: 800 }}>
        Unsupported question type: {normalizedType || 'unknown'}
      </div>
    );
  }

  return (
    <Renderer
      question={question}
      userAnswer={userAnswer}
      onAnswer={onAnswer}
      onSubmit={onSubmit}
      isAnswered={isAnswered}
      isCorrect={isCorrect}
    />
  );
}
