'use client';

import { cloneElement } from 'react';
import PartRenderer, { SvgPart, TextWithBlanks as InlineTextWithBlanks } from './PartRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';
import { speakText, getQuestionSpeechText } from '@/lib/ttsClient';
import { resolveToolSvg } from '@/lib/practice/svgTools';
import InteractiveToolWrapper from './InteractiveToolWrapper';

function readAnswer(userAnswer, blankId) {
  if (typeof userAnswer === 'object' && userAnswer !== null) {
    return userAnswer[blankId] ?? '';
  }
  return blankId === 'ans' || blankId === 'answer' ? userAnswer ?? '' : '';
}

function writeAnswer(userAnswer, blankId, value) {
  const current = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
  return { ...current, [blankId]: value };
}

function responsivePx(value, minPx, fallbackMaxPx) {
  const rawValue = value ?? fallbackMaxPx;
  const numeric = typeof rawValue === 'number'
    ? rawValue
    : Number(String(rawValue).trim().replace('px', ''));

  if (!Number.isFinite(numeric)) return rawValue;
  return `clamp(${minPx}px, ${Math.max(minPx, numeric * 0.16)}vw, ${numeric}px)`;
}

function TextWithBlanks({ text, userAnswer, onAnswer, isAnswered }) {
  const normalizedText = String(text || '').replace(/\\n/g, '\n').replace(/\/n/g, '\n');
  const pieces = normalizedText.split(/(\[\[[^\]]+\]\]|\*\*\[blank(?::[^\]]+)?\]\*\*|\[blank(?::[^\]]+)?\]|\*\*[^*]+\*\*)/g);
  const renderPlainTextPiece = (piece, keyPrefix) => (
    String(piece).split('\n').map((line, lineIndex, lines) => (
      <span key={`${keyPrefix}-${lineIndex}`}>
        {line.replace(/^#{1,4}\s*/, '')}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </span>
    ))
  );

  return (
    <span>
      {pieces.map((piece, index) => {
        const legacyMatch = piece.match(/^(?:\*\*)?\[blank(?::([^\]]+))?\](?:\*\*)?$/);
        const bracketMatch = piece.match(/^\[\[([^\]]+)\]\]$/);
        const rawBracketId = bracketMatch?.[1]?.trim();
        const bracketBlankId = rawBracketId?.toLowerCase() === 'blank' ? 'ans' : rawBracketId;
        const blankId = legacyMatch?.[1] || bracketBlankId || (legacyMatch ? 'blank' : null);

        if (!blankId) {
          const boldMatch = piece.match(/^\*\*([^*]+)\*\*$/);
          if (boldMatch) return <strong key={index}>{boldMatch[1]}</strong>;
          return renderPlainTextPiece(piece, `text-${index}`);
        }

        return (
          <input
            key={`${blankId}-${index}`}
            value={readAnswer(userAnswer, blankId)}
            disabled={isAnswered}
            onChange={(event) => onAnswer(writeAnswer(userAnswer, blankId, event.target.value))}
            inputMode="numeric"
            style={{
              width: 'clamp(54px, 14vw, 76px)',
              height: 'clamp(32px, 8vw, 40px)',
              margin: '0 clamp(2px, 1vw, 6px)',
              border: '1.5px solid #94a3b8',
              borderRadius: 4,
              textAlign: 'center',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 600,
              color: '#0f172a',
              background: isAnswered ? '#f8fafc' : '#ffffff',
              outline: 'none',
            }}
          />
        );
      })}
    </span>
  );
}

function isMarkdownTable(text) {
  const lines = String(text || '').trim().split('\n').map((line) => line.trim());
  return lines.length >= 2 && lines[0].startsWith('|') && /^\|?\s*:?-{3,}:?\s*\|/.test(lines[1]);
}

function MarkdownTable({ text, userAnswer, onAnswer, isAnswered }) {
  const lines = String(text || '').trim().split('\n').map((line) => line.trim()).filter(Boolean);
  const rows = lines
    .filter((_, index) => index !== 1)
    .map((line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim()));

  return (
    <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 420, overflow: 'hidden', borderRadius: 14, border: '1px solid #dbeafe', background: '#ffffff' }}>
        <thead>
          <tr>
            {(rows[0] || []).map((cell, index) => (
              <th key={index} style={{ padding: '12px 14px', background: '#eff6ff', color: '#1e3a8a', fontSize: 13, fontWeight: 900, borderBottom: '1px solid #dbeafe', textAlign: 'center' }}>
                <TextWithBlanks text={cell} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ padding: '12px 14px', borderTop: rowIndex === 0 ? 'none' : '1px solid #e5eefb', color: '#0f172a', fontSize: 18, fontWeight: 800, textAlign: 'center' }}>
                  <TextWithBlanks text={cell} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function InputPart({ id = 'ans', userAnswer, onAnswer, isAnswered, style }) {
  return (
    <input
      value={readAnswer(userAnswer, id)}
      disabled={isAnswered}
      onChange={(event) => onAnswer(writeAnswer(userAnswer, id, event.target.value))}
      style={{
        width: 'clamp(60px, 15vw, 84px)',
        height: 'clamp(34px, 9vw, 42px)',
        border: '1.5px solid #94a3b8',
        borderRadius: 4,
        textAlign: 'center',
        fontSize: 'clamp(16px, 4vw, 20px)',
        fontWeight: 600,
        color: '#0f172a',
        background: isAnswered ? '#f8fafc' : '#ffffff',
        outline: 'none',
        transition: 'border-color 0.15s ease',
        ...style,
      }}
    />
  );
}

function ArithmeticLayout({ layout, userAnswer, onAnswer, isAnswered }) {
  const answerRow = layout?.rows?.find((row) => row.kind === 'answer');

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 'clamp(30px, 9vw, 42px)', fontWeight: 800, color: '#0f172a' }}>
      {(layout?.rows || []).map((row, rowIndex) => {
        if (row.kind === 'divider') {
          return <div key={rowIndex} style={{ width: '100%', height: 3, background: '#0f172a', borderRadius: 999 }} />;
        }

        if (row.kind === 'answer') {
          return (
            <div key={rowIndex} style={{ display: 'flex', gap: 6 }}>
              {(answerRow?.cells || []).map((cell) => (
                <input
                  key={cell.id}
                  value={readAnswer(userAnswer, cell.id)}
                  disabled={isAnswered}
                  onChange={(event) => onAnswer(writeAnswer(userAnswer, cell.id, event.target.value.slice(-1)))}
                  inputMode="numeric"
                  maxLength={1}
                  style={{
                    width: 44,
                    height: 54,
                    border: '2px solid #93c5fd',
                    borderRadius: 10,
                    textAlign: 'center',
                    font: 'inherit',
                    background: isAnswered ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                  }}
                />
              ))}
            </div>
          );
        }

        return <div key={rowIndex}>{row.text}</div>;
      })}
    </div>
  );
}

function renderPart(part, props, index, context = {}) {
  if (part.type === 'svg') {
    return (
      <SvgPart
        key={index}
        part={part}
        question={props.question}
        userAnswer={props.userAnswer}
        onAnswer={props.onAnswer}
        isAnswered={props.isAnswered}
        inGroup={context.inGroup}
      />
    );
  }
  if (part.type === 'image') {
    return (
      <PartRenderer
        key={index}
        part={part}
        question={props.question}
        userAnswer={props.userAnswer}
        onAnswer={props.onAnswer}
        isAnswered={props.isAnswered}
        inGroup={context.inGroup}
      />
    );
  }
  if (part.type === 'input') return <InputPart key={index} id={part.id || part.name} {...props} style={part.style} />;

  if (part.type === 'latex') {
    const isInline = part.style?.display === 'inline-block' || part.style?.display === 'inline';
    return (
      <div key={index} style={{
        fontSize: 'clamp(20px, 5vw, 26px)',
        color: '#0f172a',
        textAlign: 'left',
        display: isInline ? 'inline-block' : 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: isInline ? 'auto' : '100%',
        ...(part.style || {})
      }}>
        <KaTeXRenderer math={part.content} displayMode={!isInline} />
      </div>
    );
  }
  if (part.type === 'arithmeticLayout') return <ArithmeticLayout key={index} layout={part.layout} {...props} />;
  if (part.type === 'row' || part.type === 'group') {
    const direction = part.direction === 'row' ? 'row' : 'column';
    const defaultJustifyContent = direction === 'row' ? 'flex-start' : 'stretch';
    const defaultAlignItems = direction === 'row' ? 'center' : 'stretch';

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          flexDirection: direction,
          gap: direction === 'row' ? 14 : 10,
          flexWrap: 'wrap',
          justifyContent: defaultJustifyContent,
          alignItems: defaultAlignItems,
          width: '100%',
          ...(part.style || {}),
        }}
      >
        {(part.parts || []).map((child, childIndex) => renderPart(child, props, childIndex, { inGroup: true }))}
      </div>
    );
  }

  return (
    <div
      key={index}
      style={{
        fontSize: responsivePx(part.style?.fontSize, 16, 22),
        fontWeight: part.style?.fontWeight || 400,
        color: part.style?.color || '#334155',
        lineHeight: 1.4,
        textAlign: 'left',
        width: '100%',
        ...part.style,
      }}
    >
      {isMarkdownTable(part.content || part.text) ? (
        <MarkdownTable text={part.content || part.text} {...props} />
      ) : (
        <TextWithBlanks text={part.content || part.text} {...props} />
      )}
    </div>
  );
}

export default function FillInTheBlankRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const speechText = getQuestionSpeechText(question);
  const parts = Array.isArray(question.parts) && question.parts.length
    ? question.parts
    : [{ type: 'text', content: question.questionText }];

  const extractPartText = (part) => {
    if (!part) return '';
    if (typeof part === 'string') return part;
    if (part.content) return String(part.content);
    if (part.text) return String(part.text);
    if (Array.isArray(part.parts)) {
      return part.parts.map(extractPartText).filter(Boolean).join('\n');
    }
    return '';
  };

  const firstPartText = extractPartText(parts[0]).trim();
  const totalPartsText = parts.map(extractPartText).filter(Boolean).join('\n\n').trim();
  const isDuplicateParts = Boolean(
    question.questionText && (
      totalPartsText === question.questionText.trim() ||
      (parts.length === 1 && firstPartText === question.questionText.trim())
    )
  );
  const displayParts = isDuplicateParts ? [] : (question.questionText && firstPartText === question.questionText.trim() ? parts.slice(1) : parts);

  const hasClickToFill = question.metaConfig?.hasClickToFill === true;
  const hasBlankToken = (text) => String(text || '').includes('[blank') || /\[\[[^\]]+\]\]/.test(String(text || ''));
  
  const partHasBlank = (part) => {
    if (!part) return false;
    if (part.type === 'input' || part.type === 'arithmeticLayout') return true;
    if (hasBlankToken(extractPartText(part))) return true;
    if (Array.isArray(part.parts)) {
      return part.parts.some(partHasBlank);
    }
    return false;
  };
  
  const hasInlineInput = hasBlankToken(question.questionText) || displayParts.some(partHasBlank);

  const visualParts = displayParts.filter(p => p && (p.type === 'svg' || p.type === 'image' || p.component || p.type === 'visual_panel'));
  const nonVisualParts = displayParts.filter(p => !p || !(p.type === 'svg' || p.type === 'image' || p.component || p.type === 'visual_panel'));

  const renderQuestionTextAndVisuals = () => {
    const text = question.questionText || '';
    
    const topVisuals = visualParts.filter(p => p && p.position === 'top');
    const middleVisuals = visualParts.filter(p => p && p.position === 'middle');
    const bottomVisuals = visualParts.filter(p => p && p.position !== 'top' && p.position !== 'middle');
    
    const renderPartElement = (part, idx) => (
      <PartRenderer
        key={`vis-${idx}`}
        part={part}
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );

    const topElements = topVisuals.map((part, idx) => renderPartElement(part, idx));
    const bottomElements = bottomVisuals.map((part, idx) => renderPartElement(part, idx));
    const nonVisualElements = nonVisualParts.map((part, idx) => (
      <PartRenderer
        key={`non-vis-${idx}`}
        part={part}
        question={question}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    ));
    
    let middleElements = [];
    const paragraphs = text.split(/\n\n/);
    if (paragraphs.length >= 2) {
      middleElements.push(
        <h2 key="p0" style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
          <InlineTextWithBlanks
            text={paragraphs[0]}
            userAnswer={userAnswer}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
            question={question}
          />
        </h2>
      );
      if (middleVisuals.length > 0) {
        middleVisuals.forEach((part, idx) => {
          middleElements.push(
            <div key={`mid-vis-${idx}`} style={{ margin: '16px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {renderPartElement(part, idx)}
            </div>
          );
        });
      }
      middleElements.push(
        <h2 key="p1" style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
          <InlineTextWithBlanks
            text={paragraphs.slice(1).join('\n\n')}
            userAnswer={userAnswer}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
            question={question}
          />
        </h2>
      );
    } else {
      const lines = text.split(/\n/);
      if (lines.length >= 2) {
        middleElements.push(
          <h2 key="l0" style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
            <InlineTextWithBlanks
              text={lines[0]}
              userAnswer={userAnswer}
              onAnswer={onAnswer}
              isAnswered={isAnswered}
              question={question}
            />
          </h2>
        );
        if (middleVisuals.length > 0) {
          middleVisuals.forEach((part, idx) => {
            middleElements.push(
              <div key={`mid-vis-${idx}`} style={{ margin: '16px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                {renderPartElement(part, idx)}
              </div>
            );
          });
        }
        middleElements.push(
          <h2 key="l1" style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
            <InlineTextWithBlanks
              text={lines.slice(1).join('\n')}
              userAnswer={userAnswer}
              onAnswer={onAnswer}
              isAnswered={isAnswered}
              question={question}
            />
          </h2>
        );
      } else {
        middleElements.push(
          <h2 key="single" style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
            <InlineTextWithBlanks
              text={text}
              userAnswer={userAnswer}
              onAnswer={onAnswer}
              isAnswered={isAnswered}
              question={question}
            />
          </h2>
        );
        if (middleVisuals.length > 0) {
          middleVisuals.forEach((part, idx) => {
            middleElements.push(
              <div key={`mid-vis-${idx}`} style={{ margin: '16px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                {renderPartElement(part, idx)}
              </div>
            );
          });
        }
      }
    }

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
        {topElements}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
            <button
              type="button"
              onClick={() => speakText(speechText, question.voice || 'Puck', question.audioUrl)}
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
                marginTop: 6
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#bae6fd'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#e0f2fe'; }}
              title="Read instruction out loud"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
              {middleElements}
            </div>
          </div>
        </div>
        {nonVisualElements}
        {bottomElements}
      </div>
    );
  };

  const hasVisualInterleaving = question.questionText && visualParts.length > 0;

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
      {hasClickToFill && !hasInlineInput && (
        <input
          id="ans"
          type="text"
          value={typeof userAnswer === 'object' && userAnswer !== null ? (userAnswer.ans ?? userAnswer.answer ?? '') : (userAnswer ?? '')}
          disabled={isAnswered}
          onChange={(event) => {
            const val = event.target.value;
            if (typeof userAnswer === 'object' && userAnswer !== null) {
              onAnswer(writeAnswer(userAnswer, 'ans', val));
            } else {
              onAnswer(val);
            }
          }}
          style={{ display: 'none' }}
        />
      )}
      
      {hasVisualInterleaving ? (
        renderQuestionTextAndVisuals()
      ) : (
        <>
          {question.questionText ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <button
                type="button"
                onClick={() => speakText(speechText, question.voice || 'Puck', question.audioUrl)}
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
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#bae6fd'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#e0f2fe'; }}
                title="Read instruction out loud"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
                <InlineTextWithBlanks
                  text={question.questionText}
                  userAnswer={userAnswer}
                  onAnswer={onAnswer}
                  isAnswered={isAnswered}
                  question={question}
                />
              </h2>
            </div>
          ) : null}

          {(() => {
            if (question.arrangeImagesRow) {
              const elements = [];
              let currentImageRow = [];

              const flushImageRow = (key) => {
                if (currentImageRow.length > 0) {
                  const rowMode = question.imageRowMode || question.metadata?.imageRowMode || 'wrap';
                  const rowGap = Number(question.imageRowGap || question.metadata?.imageRowGap || 20);
                  const singleRow = rowMode === 'scroll';
                  const rowCount = currentImageRow.length;
                  const cardWidth = Number(question.commonImageWidth || question.metadata?.commonImageWidth || 170);
                  const rowMaxWidth = (rowCount * cardWidth) + (Math.max(0, rowCount - 1) * Math.max(8, rowGap));
                  elements.push(
                    <div
                      key={`image-row-${key}`}
                      style={{
                        display: singleRow ? 'flex' : 'grid',
                        flexDirection: singleRow ? 'row' : undefined,
                        flexWrap: singleRow ? 'nowrap' : undefined,
                        gridTemplateColumns: singleRow
                          ? undefined
                          : `repeat(${rowCount}, minmax(72px, 1fr))`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: `clamp(8px, 2vw, ${Math.max(8, rowGap)}px)`,
                        width: '100%',
                        maxWidth: singleRow ? 'min(100%, 1160px)' : `min(100%, ${rowMaxWidth}px)`,
                        margin: '10px 0',
                        overflowX: singleRow ? 'auto' : 'visible',
                        overflowY: 'visible',
                        padding: '2px clamp(16px, 4vw, 44px) 8px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {currentImageRow.map((element) => cloneElement(element, {
                        part: {
                          ...element.props.part,
                          rowImageCount: rowCount,
                          rowImageGap: rowGap,
                          rowImageMode: rowMode,
                        }
                      }))}
                    </div>
                  );
                  currentImageRow = [];
                }
              };

              displayParts.forEach((part, index) => {
                const isFirstTextPart = index === 0 && (part.type === 'text' || !part.type);
                const partElement = (
                  <PartRenderer
                    key={index}
                    part={{
                      ...part,
                      ...(part.type === 'image' ? { commonImageWidth: question.commonImageWidth || 180, rowImage: true } : {})
                    }}
                    question={question}
                    userAnswer={userAnswer}
                    onAnswer={onAnswer}
                    isAnswered={isAnswered}
                    showSpeaker={!question.questionText && isFirstTextPart}
                    speakTextValue={speechText}
                  />
                );

                if (part.type === 'image') {
                  currentImageRow.push(partElement);
                } else {
                  flushImageRow(index);
                  elements.push(partElement);
                }
              });

              flushImageRow('end');
              return elements;
            }

            return displayParts.map((part, index) => {
              const isFirstTextPart = index === 0 && (part.type === 'text' || !part.type);
              return (
                <PartRenderer
                  key={index}
                  part={part}
                  question={question}
                  userAnswer={userAnswer}
                  onAnswer={onAnswer}
                  isAnswered={isAnswered}
                  showSpeaker={!question.questionText && isFirstTextPart}
                  speakTextValue={speechText}
                />
              );
            });
          })()}
        </>
      )}

      {!hasClickToFill && !hasInlineInput && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start' }}>
          <span style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, color: '#475569' }}>Answer:</span>
          <input
            id="ans"
            type="text"
            placeholder="e.g. 1/4"
            value={typeof userAnswer === 'object' && userAnswer !== null ? (userAnswer.ans ?? userAnswer.answer ?? '') : (userAnswer ?? '')}
            disabled={isAnswered}
            onChange={(event) => {
              const val = event.target.value;
              if (typeof userAnswer === 'object' && userAnswer !== null) {
                onAnswer(writeAnswer(userAnswer, 'ans', val));
              } else {
                onAnswer(val);
              }
            }}
            style={{
              width: 'clamp(100px, 25vw, 160px)',
              height: 'clamp(38px, 9.5vw, 46px)',
              border: '2px solid #cbd5e1',
              borderRadius: 12,
              textAlign: 'center',
              fontSize: 'clamp(16px, 4.2vw, 22px)',
              fontWeight: 800,
              color: '#0f172a',
              background: isAnswered ? '#f8fafc' : '#ffffff',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.05)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              if (!isAnswered) {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(15, 23, 42, 0.05)';
              }
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#cbd5e1';
              e.target.style.boxShadow = '0 2px 4px rgba(15, 23, 42, 0.05)';
            }}
          />
        </div>
      )}
    </section>
  );
}
