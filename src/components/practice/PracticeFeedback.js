'use client';

import { useEffect, useRef } from 'react';
import KaTeXRenderer from './KaTeXRenderer';
import { speakText } from '../../lib/ttsClient';
import styles from './FactoryLayout.module.css';
import { parseHTMLToJSX } from '@/lib/practice/htmlParser';

function cleanText(value) {
  return String(value || '').replace(/\*\*/g, '').replace(/^#{1,4}\s*/gm, '');
}

function InlineMarkdown({ text }) {
  return String(text || '').split(/(\*\*[^*]+\*\*)/g).map((piece, index) => {
    const match = piece.match(/^\*\*([^*]+)\*\*$/);
    if (match) return <strong key={index}>{match[1]}</strong>;
    
    const subSegments = piece.split(/(\$[^\$]+\$)/g);
    return (
      <span key={index}>
        {subSegments.map((subPiece, subIndex) => {
          const mathMatch = subPiece.match(/^\$([^\$]+)\$/);
          if (mathMatch) {
            return <KaTeXRenderer key={subIndex} math={mathMatch[1]} displayMode={false} />;
          }
          return <span key={subIndex}>{parseHTMLToJSX(subPiece.replace(/^#{1,4}\s*/, ''))}</span>;
        })}
      </span>
    );
  });
}

function ArithmeticLayoutSolution({ layout }) {
  const isVertical = layout?.variant === 'verticalAdditionReplica' || layout?.variant === 'verticalSubtractionReplica' || layout?.variant === 'verticalMultiplicationReplica';
  const answerRow = layout?.rows?.find((row) => row.kind === 'answer');
  const digitCount = Math.max(
    2,
    answerRow?.cells?.length || 0,
    ...(layout?.rows || []).map((row) => String(row.text || '').replace(/[+×x−\-]/gi, '').trim().length)
  );
  const cellSize = isVertical ? 32 : 44;
  const operatorWidth = isVertical ? 28 : 0;
  const digitGridWidth = digitCount * cellSize;
  const fullGridWidth = operatorWidth + digitGridWidth;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: isVertical ? 3 : 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: isVertical ? '28px' : '38px',
        fontWeight: isVertical ? 500 : 800,
        color: '#0f172a',
      }}
    >
      {(layout?.rows || []).map((row, rowIndex) => {
        if (row.kind === 'divider') {
          return (
            <div
              key={rowIndex}
              style={{
                width: isVertical ? fullGridWidth : '100%',
                height: isVertical ? 2 : 3,
                background: '#0f172a',
              }}
            />
          );
        }

        if (row.kind === 'answer') {
          return (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                gap: isVertical ? 0 : 6,
                width: isVertical ? digitGridWidth : 'auto',
                marginLeft: isVertical ? operatorWidth : 0,
              }}
            >
              {(answerRow?.cells || []).map((cell) => (
                <span
                  key={cell.id}
                  style={{
                    width: cellSize,
                    height: isVertical ? 30 : 54,
                    border: '2px solid #22c55e',
                    borderLeftStyle: isVertical && cell.id !== answerRow.cells[0]?.id ? 'dashed' : 'solid',
                    borderLeftWidth: isVertical && cell.id !== answerRow.cells[0]?.id ? 1 : 2,
                    marginLeft: isVertical && cell.id !== answerRow.cells[0]?.id ? -1 : 0,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: 'inherit',
                    fontSize: isVertical ? 22 : 'inherit',
                    background: '#f0fdf4',
                    color: '#15803d',
                  }}
                >
                  {cell.expected}
                </span>
              ))}
            </div>
          );
        }

        if (isVertical) {
          const rawText = String(row.text || '');
          const operator = rawText.trimStart().match(/^[+×x−\-]/i)?.[0] || '';
          const digits = rawText.replace(/^[\s+×x−\-]+/i, '').trim().padStart(digitCount, ' ').split('');

          return (
            <div
              key={rowIndex}
              style={{
                width: fullGridWidth,
                display: 'grid',
                gridTemplateColumns: `${operatorWidth}px repeat(${digitCount}, ${cellSize}px)`,
                alignItems: 'center',
                whiteSpace: 'pre',
              }}
            >
              <span style={{ textAlign: 'center' }}>{operator.toLowerCase() === 'x' ? '×' : operator}</span>
              {digits.map((digit, digitIndex) => (
                <span key={`${rowIndex}-${digitIndex}`} style={{ textAlign: 'center' }}>
                  {digit === ' ' ? '\u00A0' : digit}
                </span>
              ))}
            </div>
          );
        }

        return <div key={rowIndex}>{row.text}</div>;
      })}
    </div>
  );
}

function renderSolutionPart(part, index, context = {}) {
  if (part == null) return null;

  if (typeof part === 'string' || typeof part === 'number') {
    return (
      <p key={index} style={{ margin: 0 }}>
        <InlineMarkdown text={part} />
      </p>
    );
  }

  if (part.type === 'section') {
    return (
      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {part.label ? (
          <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {cleanText(part.label)}
          </div>
        ) : null}
        {(part.parts || []).map((child, childIndex) => renderSolutionPart(child, childIndex))}
      </div>
    );
  }

  if (part.type === 'svg') {
    return (
      <div
        key={index}
        style={{
          width: context.inGroup ? 'auto' : '100%',
          maxWidth: context.inGroup ? 170 : 560,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: context.inGroup ? '0 0 auto' : 'initial',
          margin: context.inGroup ? 0 : '6px auto',
          ...(part.style || {}),
        }}
        dangerouslySetInnerHTML={{ __html: part.content }}
      />
    );
  }

  if (part.type === 'group' || part.type === 'row') {
    const direction = part.direction === 'row' || part.type === 'row' ? 'row' : 'column';
    return (
      <div
        key={index}
        style={{
          display: 'flex',
          flexDirection: direction,
          gap: direction === 'row' ? 14 : 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          ...(part.style || {}),
        }}
      >
        {(part.parts || []).map((child, childIndex) => renderSolutionPart(child, childIndex, { inGroup: true }))}
      </div>
    );
  }

  if (part.type === 'latex') {
    return (
      <div
        key={index}
        style={{
          fontSize: context.inGroup ? 18 : 20,
          color: '#0f172a',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          ...(part.style || {}),
        }}
      >
        <KaTeXRenderer math={part.content} displayMode={true} />
      </div>
    );
  }

  if (part.type === 'arithmeticLayout' && part.layout) {
    return (
      <div key={index} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0', width: '100%' }}>
        <ArithmeticLayoutSolution layout={part.layout} />
      </div>
    );
  }

  return (
    <p key={index} style={{ margin: 0, ...(part.style || {}) }}>
      <InlineMarkdown text={part.content || part.text || ''} />
    </p>
  );
}

export default function PracticeFeedback({
  question,
  isCorrect = false,
  onNext,
  nextLabel = 'Next Challenge',
  loading = false,
  isPreK = false,
}) {
  const spokenRef = useRef(false);

  // Clean explanation text
  const getExplanationText = (exp) => {
    if (!exp) return '';
    if (typeof exp === 'string') return exp;
    if (typeof exp === 'object') {
      if (Array.isArray(exp.sections)) {
        return exp.sections
          .map(s => typeof s === 'string' ? s : (s?.content || s?.text || ''))
          .filter(Boolean)
          .join('\n');
      }
      return exp.content || exp.text || '';
    }
    return String(exp);
  };
  const cleanExp = question?.explanation ? cleanText(getExplanationText(question.explanation)) : '';
  
  // Resolve correct label and image
  let correctLabel = '';
  let correctImageUrl = '';
  const isMultiSelect = question?.interaction === 'multi_select' || question?.multiSelect === true;

  if (question) {
    let indices = [];
    if (isMultiSelect && Array.isArray(question.correctAnswerIndices)) {
      indices = question.correctAnswerIndices;
    } else if (isMultiSelect && Array.isArray(question.answer)) {
      indices = question.answer;
    } else if (question.correctAnswerIndex !== undefined) {
      indices = [question.correctAnswerIndex];
    }

    if (indices.length > 0) {
      const labels = [];
      indices.forEach((idx) => {
        if (Array.isArray(question.options) && question.options[idx]) {
          const opt = question.options[idx];
          const lbl = typeof opt === 'object' ? (opt.label || opt.text || '') : String(opt);
          if (lbl) labels.push(lbl);
        }
      });
      correctLabel = labels.join(', ');
      
      if (indices.length === 1) {
        if (Array.isArray(question.hotspots) && question.hotspots[indices[0]]) {
          const hs = question.hotspots[indices[0]];
          correctImageUrl = hs.imageUrl || '';
        }
      }
    }
  }

  const cleanLabel = cleanText(correctLabel);

  useEffect(() => {
    if (isPreK && !isCorrect && question && !spokenRef.current) {
      spokenRef.current = true;
      const introText = cleanLabel 
        ? `Almost! The correct answer is the ${cleanLabel}.` 
        : `Almost! Let's see the correct answer.`;
      const fullSpeech = `${introText} ${cleanExp}`;
      const t = setTimeout(() => {
        speakText(fullSpeech, 'Puck');
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isPreK, isCorrect, question, cleanLabel, cleanExp]);

  const handlePlaySpeech = () => {
    const introText = cleanLabel 
      ? `Almost! The correct answer is the ${cleanLabel}.` 
      : `Almost! Let's see the correct answer.`;
    const fullSpeech = `${introText} ${cleanExp}`;
    speakText(fullSpeech, 'Puck');
  };

  if (!question) return null;

  const solutionSections = Array.isArray(question?.solution?.sections)
    ? question.solution.sections
    : [];

  if (isPreK) {
    return (
      <section className={styles.preKFeedbackContainer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 950, color: '#9a3412', fontFamily: 'var(--font-outfit), sans-serif' }}>
                Let's look together!
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#c2410c' }}>
                Almost there! You can do it! ✨
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handlePlaySpeech}
            className={styles.preKSpeakerBtn}
            title="Listen again"
          >
            🔊
          </button>
        </div>

        {/* Visual Spotlight Choice Card */}
        <div className={styles.preKSpotlightCard}>
          <div className={styles.preKSpotlightCircle}>
            {correctImageUrl ? (
              <img src={correctImageUrl} alt={cleanLabel} style={{ width: 68, height: 68, objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 950, color: '#16a34a' }}>✓</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Correct Answer
            </div>
            <div style={{ fontSize: 19, fontWeight: 950, color: '#0f172a', fontFamily: 'var(--font-outfit), sans-serif' }}>
              {cleanLabel || 'Right choice'}
            </div>
          </div>
        </div>

        {cleanExp && (
          <div style={{
            marginTop: 14,
            padding: '14px',
            background: '#ffffff',
            borderRadius: 18,
            border: '2px solid rgba(251, 146, 60, 0.15)',
            color: '#334155',
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.55,
          }}>
            <InlineMarkdown text={cleanExp} />
          </div>
        )}

        {solutionSections.length > 0 && (
          <div style={{
            marginTop: 14,
            padding: 14,
            background: '#ffffff',
            borderRadius: 18,
            border: '2px solid rgba(251, 146, 60, 0.15)',
            color: '#1e293b',
            fontSize: 14,
            lineHeight: 1.55,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflow: 'hidden',
          }}>
            {solutionSections.map((section, index) => renderSolutionPart(section, index))}
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className={styles.preKNextBtn}
        >
          {loading ? 'Loading...' : 'Try Next! 🌟'}
        </button>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: 18,
        borderRadius: 18,
        border: `1px solid ${isCorrect ? '#bbf7d0' : '#fed7aa'}`,
        background: isCorrect ? '#f0fdf4' : '#fff7ed',
        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
      }}
    >
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: 18,
          fontWeight: 900,
          color: isCorrect ? '#166534' : '#9a3412',
        }}
      >
        {isCorrect ? 'Nice work!' : 'Not quite yet.'}
      </h3>
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 14,
          fontWeight: 700,
          color: isCorrect ? '#15803d' : '#c2410c',
          lineHeight: 1.5,
        }}
      >
        {isCorrect ? 'That answer matches the model.' : 'Review the model and try the next one.'}
      </p>

      {solutionSections.length > 0 ? (
        <div
          style={{
            padding: 14,
            background: '#ffffff',
            borderRadius: 14,
            border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.18)' : 'rgba(251, 146, 60, 0.18)'}`,
            color: '#1e293b',
            fontSize: 15,
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflow: 'hidden',
          }}
        >
          {solutionSections.map((section, index) => renderSolutionPart(section, index))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        style={{
          marginTop: 14,
          padding: '13px 18px',
          borderRadius: 14,
          border: 'none',
          background: isCorrect ? '#16a34a' : '#0f172a',
          color: '#fff',
          fontWeight: 900,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Loading...' : nextLabel}
      </button>
    </section>
  );
}
