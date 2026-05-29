'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import styles from '../FillInTheBlankRenderer.module.css';
import { speakText } from '@/lib/ttsClient';

const UniversalDndRenderer = dynamic(
  () => import('./universal-dnd/UniversalDndRenderer'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 24, color: '#64748b', fontWeight: 800 }}>
        Loading drag-and-drop activity...
      </div>
    ),
  },
);

const CatV2HtmlRenderer = dynamic(
  () => import('./catv2-html/CatV2HtmlRenderer'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 24, color: '#64748b', fontWeight: 800 }}>
        Loading sorting activity...
      </div>
    ),
  },
);

const KonvaCategorizationRenderer = dynamic(
  () => import('./KonvaCategorizationRenderer'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 24, color: '#64748b', fontWeight: 800 }}>
        Loading canvas activity...
      </div>
    ),
  },
);

const UNIVERSAL_DND_LAYOUTS = new Set([
  'flowchart',
  'timeline',
  'matching',
  'hotspot',
  'shelf_sort',
]);

const CATV2_HTML_LAYOUTS = new Set([
  'category_sort',
  'ordering',
  'grid_fill',
  'table_fill',
  'diagram_slots',
  'diagram_labeling',
]);

export default function CategorizationRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const catV2LayoutMode = question.layoutMode || question.metadata?.layoutMode || question.htmlLayout;

  if (question.interaction === 'universal_dnd') {
    return (
      <UniversalDndRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }

  if (
    question.type === 'categorizationv2'
    || question.renderer === 'html'
    || CATV2_HTML_LAYOUTS.has(catV2LayoutMode)
  ) {
    return (
      <CatV2HtmlRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }

  if (UNIVERSAL_DND_LAYOUTS.has(question.layoutMode)) {
    return (
      <UniversalDndRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }

  const rawCategories = question.categories || question.parts?.find((part) => part.type === 'categorization')?.categories || [];
  const categories = rawCategories.map((cat) => {
    if (typeof cat === 'string') {
      return { id: cat, label: cat };
    }
    return cat;
  });
  const items = question.items || question.parts?.find((part) => part.type === 'categorization')?.items || [];
  const useHtmlRenderer = question.renderer === 'html' || question.type === 'categorizationv2';
  const hasGridCategory = categories.some((cat) => cat.isGrid === true || (Number(cat.rows) > 0 && Number(cat.columns) > 0));
  const isCubeTrain = !hasGridCategory && (categories.some((cat) => cat.id === 'cube_train') || items.some((item) => item.visual === 'cube'));

  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 860, scale: 1 });
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ));

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      setIsMobile(containerWidth < 768);
      const scale = Math.min(1, (containerWidth - 20) / 860);
      setDimensions({ width: containerWidth, scale });
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const useHtml = question.isCopiable || question.isRemoval || useHtmlRenderer || isMobile || hasGridCategory || isCubeTrain;

  if (useHtml) {
    return (
      <CatV2HtmlRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }

  return (
    <section className={styles.container} ref={containerRef}>
      <div className={styles.questionCard}>
        {question.questionText ? (
          <div className={styles.questionTextRow} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => speakText(question.questionText)}
              style={{
                background: '#e0f2fe',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0284c7',
                boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)',
                transition: 'transform 0.2s ease, background 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(event) => { event.currentTarget.style.transform = 'scale(1.08)'; event.currentTarget.style.background = '#bae6fd'; }}
              onMouseLeave={(event) => { event.currentTarget.style.transform = 'scale(1)'; event.currentTarget.style.background = '#e0f2fe'; }}
              title="Read question out loud"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            <span className={styles.questionText}>{question.questionText}</span>
          </div>
        ) : null}

        <KonvaCategorizationRenderer
          question={question}
          categories={categories}
          items={items}
          dimensions={dimensions}
          userAnswer={userAnswer}
          onAnswer={onAnswer}
          isAnswered={isAnswered}
        />
      </div>
    </section>
  );
}
