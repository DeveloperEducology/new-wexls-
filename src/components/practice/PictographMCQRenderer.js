'use client';

import { useState } from 'react';
import PartRenderer from './PartRenderer';
import { speakText } from '@/lib/ttsClient';

// ── Pictograph Table ──────────────────────────────────────────────────────────

function PictographTable({ pictograph, selected, onClick, isAnswered, optionIndex }) {
  const rows = pictograph?.rows || [];
  const maxCols = Math.max(6, ...rows.map((r) => r.maxCols || r.count || 1));

  const borderColor = selected ? '#16a34a' : '#cbd5e1';
  const shadowStyle = selected
    ? '0 0 0 4px rgba(22, 163, 74, 0.25), 0 8px 24px rgba(22, 163, 74, 0.18)'
    : '0 4px 18px rgba(15, 23, 42, 0.08)';
  const scaleStyle = selected ? 'scale(1.03)' : 'scale(1)';

  return (
    <button
      type="button"
      disabled={isAnswered}
      onClick={() => !isAnswered && onClick(optionIndex)}
      aria-pressed={selected}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        border: `3px solid ${borderColor}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: shadowStyle,
        transform: scaleStyle,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.18s ease',
        cursor: isAnswered ? 'default' : 'pointer',
        padding: 0,
        textAlign: 'left',
        minWidth: 0,
        flex: '1 1 0',
        maxWidth: 340,
        position: 'relative',
      }}
    >
      {/* ── Selected checkmark badge ── */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)',
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      )}

      {/* ── Header row ── */}
      <div
        style={{
          background: '#166534',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: 14,
          padding: '6px 12px', // reduced from 10px 16px
          letterSpacing: '0.02em',
          fontFamily: 'var(--font-outfit), sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>Fruit</span>
      </div>

      {/* ── Data rows ── */}
      {rows.map((row, rowIndex) => {
        const count = row.count || 0;
        const rowBg = rowIndex % 2 === 0 ? '#f0fdf4' : '#ffffff';

        return (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid #dcfce7',
              background: rowBg,
              padding: '4px 8px', // reduced from 6px 10px
              gap: 6,
            }}
          >
            {/* Row label */}
            <div
              style={{
                minWidth: 85, // reduced from 100
                fontWeight: 800,
                fontSize: 12, // reduced from 13
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                fontFamily: 'var(--font-outfit), sans-serif',
              }}
            >
              <span style={{ fontSize: 15 }}>{row.emoji}</span>
              <span>{row.label}</span>
            </div>

            {/* Emoji cells */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                flex: 1,
              }}
            >
              {Array.from({ length: count }, (_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 15, // reduced from 18
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22, // reduced from 26
                    height: 22, // reduced from 26
                    background: '#dcfce7',
                    borderRadius: 4, // reduced from 6
                    border: '1px solid #bbf7d0',
                  }}
                >
                  {row.emoji}
                </span>
              ))}
            </div>

            {/* Count badge */}
            <div
              style={{
                minWidth: 22, // reduced from 26
                height: 22, // reduced from 26
                borderRadius: 6, // reduced from 8
                background: '#166534',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12, // reduced from 13
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {count}
            </div>
          </div>
        );
      })}
    </button>
  );
}

// ── Scatter Scene SVG ─────────────────────────────────────────────────────────

function PictographScenePart({ part }) {
  const items = part.items || [];
  const svgWidth = part.svgWidth || 460;
  const svgHeight = part.svgHeight || 200; // decreased default height to 200

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 350, // tighter container width
        borderRadius: 16,
        border: '2px solid #e2e8f0',
        background: 'linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.07)',
        margin: '2px auto 6px auto', // centered and tight margins
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Scattered fruits scene"
        role="img"
      >
        {/* Light grid pattern */}
        <defs>
          <pattern id="pictoGrid" width="65" height="60" patternUnits="userSpaceOnUse">
            <path d="M 65 0 L 0 0 0 60" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#pictoGrid)" />

        {items.map((item, idx) => (
          <text
            key={idx}
            x={item.x}
            y={item.y}
            fontSize={Math.round(44 * (item.scale || 1))} // increased font size from 28 to make fruits larger
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${item.rotate || 0}, ${item.x}, ${item.y})`}
            style={{ userSelect: 'none', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}
          >
            {item.emoji}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Main Renderer ─────────────────────────────────────────────────────────────

export default function PictographMCQRenderer({
  question,
  userAnswer,
  onAnswer,
  onSubmit,
  isAnswered,
}) {
  const shouldAutoSubmit = Boolean(
    question?.metadata?.clickToSubmit ||
    question?.layoutConfig?.clickToSubmit ||
    question?.metadata?.autoSubmit ||
    question?.layoutConfig?.autoSubmit
  );
  const selectedIndex =
    typeof userAnswer === 'object' && userAnswer !== null
      ? Number(userAnswer?.selectedIndex ?? userAnswer?.index ?? userAnswer)
      : Number(userAnswer);

  const options = Array.isArray(question.options) ? question.options : [];

  // Separate parts: scene parts go above, other text parts go in header
  const sceneParts = (question.parts || []).filter((p) => p.type === 'pictograph_scene');
  const textParts = (question.parts || []).filter((p) => p.type !== 'pictograph_scene');

  // Group consecutive text parts to prevent duplicate mascot speech bubbles
  const mergedTextParts = textParts.length > 0 ? [{
    type: 'text',
    content: textParts.map(p => (p.content || p.text || '').trim()).join(' '),
    showSpeaker: textParts.some(p => p.showSpeaker),
    style: textParts[0].style || {},
  }] : [];

  return (
    <section
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6, // tighter gap
        fontFamily: 'var(--font-outfit), sans-serif',
      }}
    >
      {/* ── Text parts (merged story + question) ── */}
      {mergedTextParts.map((part, idx) => (
        <PartRenderer
          key={idx}
          part={part}
          question={question}
          userAnswer={userAnswer}
          onAnswer={onAnswer}
          isAnswered={isAnswered}
          showSpeaker={part.showSpeaker}
          partIndex={idx}
        />
      ))}

      {/* ── Scene SVG (scattered fruits) ── */}
      {sceneParts.map((part, idx) => (
        <PictographScenePart key={idx} part={part} />
      ))}

      {/* ── Pictograph table options ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12, // tighter gap
          justifyContent: 'center',
          marginTop: 4, // tighter margin
          width: '100%',
        }}
      >
        {options.map((option, idx) => {
          if (!option?.pictograph) return null;
          const isSelected = Number.isFinite(selectedIndex) && selectedIndex === idx;

          return (
            <PictographTable
              key={option.id || idx}
              pictograph={option.pictograph}
              selected={isSelected}
              onClick={(idx) => {
                onAnswer(idx);
                if (shouldAutoSubmit && onSubmit) {
                  onSubmit(idx);
                }
              }}
              isAnswered={isAnswered}
              optionIndex={idx}
            />
          );
        })}
      </div>
    </section>
  );
}
