'use client';

import dynamic from 'next/dynamic';
import MCQRenderer from './MCQRenderer';
import FillInTheBlankRenderer from './FillInTheBlankRenderer';

const LoadingRenderer = () => (
  <div style={{ padding: 24, color: '#64748b', fontWeight: 800 }}>
    Loading activity...
  </div>
);

const CategorizationRenderer = dynamic(
  () => import('./CategorizationRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const InteractiveToolRenderer = dynamic(
  () => import('./interactive-tools/InteractiveToolRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const SentenceOrderingRenderer = dynamic(
  () => import('./SentenceOrderingRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const ENGINE_TYPE_MAP = {
  mcq: 'mcq',
  picture_mcq: 'picture_mcq',
  audio_mcq: 'audio_mcq',
  multi_select: 'multi_select',
  fill_blank: 'fillInTheBlank',
  number_input: 'fillInTheBlank',
  text_input: 'fillInTheBlank',
  drag_drop: 'categorizationv2',
  sorting: 'categorizationv2',
  matching: 'categorizationv2',
  sequence: 'categorizationv2',
  label_diagram: 'categorizationv2',
  categorization: 'categorizationv2',
  categorizationv2: 'categorizationv2',
  hotspot: 'hotspot_select',
  interactive_tool: 'interactiveTool',
  sentence_ordering: 'sentence_ordering',
};

function normalizeUniversalQuestion(question) {
  const schemaInteraction = question?.schema?.interaction
    || question?.universalSchema?.interaction
    || question?.interactionConfig
    || question?.interaction;
  const engine = typeof schemaInteraction === 'object'
    ? schemaInteraction.engine || schemaInteraction.type
    : schemaInteraction;
  const normalizedEngine = String(engine || question?.interaction || question?.type || 'mcq')
    .trim()
    .toLowerCase();
  const type = ENGINE_TYPE_MAP[normalizedEngine] || question?.type || normalizedEngine || 'mcq';
  const isChoice = ['mcq', 'picture_mcq', 'audio_mcq', 'multi_select', 'hotspot_select'].includes(type);
  const isTextInput = ['fillInTheBlank', 'number_input', 'text_input'].includes(type);

  return {
    ...question,
    type,
    interaction: normalizedEngine === 'interactive_tool' ? 'interactiveTool' : normalizedEngine,
    layoutMode: question?.layoutMode || question?.layoutConfig?.mode || question?.schema?.layout?.mode,
    validationRules: question?.validationRules || question?.schema?.validationRules || [],
    feedbackRules: question?.feedbackRules || question?.schema?.feedbackRules || question?.feedback,
    difficultyRules: question?.difficultyRules || question?.schema?.difficultyRules,
    analyticsConfig: question?.analyticsConfig || question?.schema?.analyticsConfig,
    adaptiveRules: question?.adaptiveRules || question?.schema?.adaptiveRules,
    options: isChoice && Array.isArray(question?.options) ? question.options : question?.options,
    answer: isTextInput ? question?.answer ?? question?.correctAnswer ?? question?.correctAnswerText : question?.answer,
  };
}

export default function UniversalActivityRenderer({
  question,
  userAnswer,
  onAnswer,
  onSubmit,
  isAnswered,
  isCorrect,
}) {
  const normalizedQuestion = normalizeUniversalQuestion(question);
  const normalizedType = String(normalizedQuestion?.type || '').trim().toLowerCase();
  const Renderer = normalizedType === 'categorizationv2'
    ? CategorizationRenderer
    : normalizedType === 'sentence_ordering'
    ? SentenceOrderingRenderer
    : normalizedType === 'fillintheblank' || normalizedType === 'fillinTheblank'.toLowerCase()
    ? FillInTheBlankRenderer
    : normalizedType === 'interactivetool'
    ? InteractiveToolRenderer
    : MCQRenderer;

  return (
    <Renderer
      question={normalizedQuestion}
      userAnswer={userAnswer}
      onAnswer={onAnswer}
      onSubmit={onSubmit}
      isAnswered={isAnswered}
      isCorrect={isCorrect}
    />
  );
}
