'use client';

import dynamic from 'next/dynamic';
import MCQRenderer from './MCQRenderer';
import FillInTheBlankRenderer from './FillInTheBlankRenderer';
import PictographMCQRenderer from './PictographMCQRenderer';

const LoadingRenderer = () => (
  <div style={{ padding: 24, color: '#64748b', fontWeight: 800 }}>
    Loading activity...
  </div>
);

const InteractiveAppletRenderer = dynamic(
  () => import('./applets/InteractiveAppletRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const InteractiveToolRenderer = dynamic(
  () => import('./interactive-tools/InteractiveToolRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const CategorizationRenderer = dynamic(
  () => import('./CategorizationRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const RENDERERS = {
  mcq: MCQRenderer,
  multiplechoice: MCQRenderer,
  multipleChoice: MCQRenderer,
  dynamic_pool: MCQRenderer,
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
  visual_choice: MCQRenderer,
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
  const normalizedInteraction = String(question?.interaction || '').trim().toLowerCase();
  const Renderer = normalizedInteraction === 'pictograph_mcq'
    ? PictographMCQRenderer
    : normalizedInteraction === 'interactive_stickers'
    ? MCQRenderer
    : RENDERERS[normalizedType] || RENDERERS[normalizedType.toLowerCase()];

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
