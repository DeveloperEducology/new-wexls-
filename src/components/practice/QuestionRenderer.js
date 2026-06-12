'use client';

import dynamic from 'next/dynamic';
import MCQRenderer from './MCQRenderer';
import FillInTheBlankRenderer from './FillInTheBlankRenderer';
import PictographMCQRenderer from './PictographMCQRenderer';
import UniversalActivityRenderer from './UniversalActivityRenderer';

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
  picture_mcq: MCQRenderer,
  picturechoice: MCQRenderer,
  picture_choice: MCQRenderer,
  audiomcq: MCQRenderer,
  audio_mcq: MCQRenderer,
  multiselect: MCQRenderer,
  multi_select: MCQRenderer,
  hotspot: MCQRenderer,
  hotspot_select: MCQRenderer,
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
  const schemaEngine = typeof question?.interaction === 'object'
    ? question.interaction.engine || question.interaction.type
    : question?.interactionConfig?.engine || question?.schema?.interaction?.engine || question?.universalSchema?.interaction?.engine;
  const usesUniversalSchema = Boolean(
    question?.schema
    || question?.universalSchema
    || question?.layoutConfig
    || question?.validationRules
    || question?.feedbackRules
    || (question?.difficultyRules && question?.type !== 'dynamic_pool')
    || question?.analyticsConfig
    || question?.adaptiveRules
    || ['fill_blank', 'number_input', 'text_input', 'drag_drop', 'sorting', 'matching', 'sequence', 'label_diagram', 'draw_line', 'interactive_tool'].includes(String(schemaEngine || '').toLowerCase())
  );

  if (question && usesUniversalSchema) {
    return (
      <UniversalActivityRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        onSubmit={onSubmit}
        isAnswered={isAnswered}
        isCorrect={isCorrect}
      />
    );
  }

  const normalizedType = String(question?.type || '').trim();
  const normalizedInteraction = String(question?.interaction || '').trim().toLowerCase();
  const Renderer = normalizedInteraction === 'pictograph_mcq'
    ? PictographMCQRenderer
    : normalizedInteraction === 'interactive_stickers'
    ? MCQRenderer
    : (normalizedInteraction === 'categorization' || normalizedInteraction === 'categorizationv2')
    ? CategorizationRenderer
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
