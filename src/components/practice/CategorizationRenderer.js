'use client';

import dynamic from 'next/dynamic';
import React from 'react';

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

export default function CategorizationRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  if (question?.interaction === 'universal_dnd') {
    return (
      <UniversalDndRenderer
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }

  return (
    <CatV2HtmlRenderer
      question={question}
      userAnswer={userAnswer}
      onAnswer={onAnswer}
      isAnswered={isAnswered}
    />
  );
}
