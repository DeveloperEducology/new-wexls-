'use client';

import dynamic from 'next/dynamic';
import MCQActivity from './activities/mcq/MCQActivity';
import TapToFillActivity from './activities/tap_to_fill/TapToFillActivity';
import TokenSelectActivity from './activities/token_select/TokenSelectActivity';
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

const SentenceOrderingRenderer = dynamic(
  () => import('./SentenceOrderingRenderer'),
  { ssr: false, loading: LoadingRenderer },
);

const RENDERERS = {
  sentence_ordering: SentenceOrderingRenderer,
  sentenceOrdering: SentenceOrderingRenderer,
  ordering: SentenceOrderingRenderer,
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
  visual_choice: MCQActivity,
  tap_to_fill: TapToFillActivity,
  tapToFill: TapToFillActivity,
  'tap-to-fill': TapToFillActivity,
  interactiveApplet: InteractiveAppletRenderer,
  interactiveapplet: InteractiveAppletRenderer,
  interactiveTool: InteractiveToolRenderer,
  interactivetool: InteractiveToolRenderer,
  pick_from_sentence: TokenSelectActivity,
  select_from_sentence: TokenSelectActivity,
  token_select: TokenSelectActivity,
  universal: UniversalActivityRenderer,
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
  const isTapToFillType = question?.type === 'tap_to_fill' ||
    question?.optionsType === 'tap_to_fill' ||
    schemaEngine === 'tap_to_fill' ||
    question?.interaction === 'tap_to_fill';

  const usesUniversalSchema = !isTapToFillType && Boolean(
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
  // interactionConfig (set by parameterized FIB templates) takes priority
  const interactionConfigEngine = String(question?.interactionConfig?.engine || '').toLowerCase();
  if (interactionConfigEngine === 'fillintheblank' || question?.correctOption === 'fib') {
    return (
      <FillInTheBlankRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        onSubmit={onSubmit}
        isAnswered={isAnswered}
        isCorrect={isCorrect}
      />
    );
  }

  const isCategorizationInteraction = [
    'categorization',
    'categorizationv2',
    'categorisation',
    'categorisationv2',
    'sorting',
    'sort',
    'drag_drop',
    'category_sort',
    'grid_fill'
  ].includes(normalizedInteraction) || [
    'categorization',
    'categorizationv2',
    'sorting',
    'sort',
    'drag_drop',
    'grid_fill'
  ].includes(schemaEngine) || [
    'categorization',
    'categorizationv2',
    'sorting',
    'sort',
    'drag_drop',
    'grid_fill'
  ].includes(normalizedType);

  const Renderer = normalizedInteraction === 'pictograph_mcq'
    ? PictographMCQRenderer
    : normalizedInteraction === 'interactive_stickers'
    ? MCQRenderer
    : isCategorizationInteraction
    ? CategorizationRenderer
    : RENDERERS[schemaEngine] || RENDERERS[normalizedType] || RENDERERS[normalizedType.toLowerCase()];

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
