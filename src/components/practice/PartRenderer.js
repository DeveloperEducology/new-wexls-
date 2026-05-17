'use client';

import { useRef, useState } from 'react';
import CategorizationRenderer from './CategorizationRenderer';

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

function cleanText(value) {
  return String(value || '').replace(/\*\*/g, '').replace(/^#{1,4}\s*/gm, '');
}

function InlineMarkdown({ text }) {
  return String(text || '').split(/(\*\*[^*]+\*\*)/g).map((piece, index) => {
    const match = piece.match(/^\*\*([^*]+)\*\*$/);
    if (match) return <strong key={index}>{match[1]}</strong>;
    return <span key={index}>{piece.replace(/^#{1,4}\s*/, '')}</span>;
  });
}

function TextWithBlanks({ text, userAnswer, onAnswer, isAnswered }) {
  const pieces = String(text || '').split(/(\[\[[^\]]+\]\]|\*\*\[blank(?::[^\]]+)?\]\*\*|\[blank(?::[^\]]+)?\]|\*\*[^*]+\*\*)/g);

  return (
    <span>
      {pieces.map((piece, index) => {
        const legacyMatch = piece.match(/^(?:\*\*)?\[blank(?::([^\]]+))?\](?:\*\*)?$/);
        const bracketMatch = piece.match(/^\[\[([^\]]+)\]\]$/);
        const blankId = legacyMatch?.[1] || bracketMatch?.[1] || (legacyMatch ? 'blank' : null);

        if (!blankId) {
          const boldMatch = piece.match(/^\*\*([^*]+)\*\*$/);
          if (boldMatch) return <strong key={index}>{boldMatch[1]}</strong>;
          return <span key={index}>{piece.replace(/^#{1,4}\s*/, '')}</span>;
        }

        return (
          <input
            key={`${blankId}-${index}`}
            value={readAnswer(userAnswer, blankId)}
            disabled={isAnswered}
            onChange={(event) => onAnswer(writeAnswer(userAnswer, blankId, event.target.value))}
            inputMode="numeric"
            style={{
              width: 92,
              height: 48,
              margin: '0 8px',
              border: '2px solid #93c5fd',
              borderRadius: 12,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 900,
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

function TextPart({ part, userAnswer, onAnswer, isAnswered }) {
  const content = part.content || part.text || '';
  return (
    <div
      style={{
        fontSize: part.style?.fontSize || 28,
        fontWeight: part.style?.fontWeight || 800,
        color: part.style?.color || '#0f172a',
        lineHeight: 1.45,
        textAlign: 'center',
        ...part.style,
      }}
    >
      {isMarkdownTable(content) ? (
        <MarkdownTable text={content} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} />
      ) : (
        <TextWithBlanks text={content} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} />
      )}
    </div>
  );
}

function SvgPart({ part, inGroup = false }) {
  return (
    <div
      style={{
        width: inGroup ? 'auto' : '100%',
        maxWidth: inGroup ? 180 : 680,
        flex: inGroup ? '0 0 auto' : 'initial',
        display: 'flex',
        justifyContent: 'center',
        ...(part.style || {}),
      }}
      dangerouslySetInnerHTML={{ __html: part.content }}
    />
  );
}

function ImagePart({ part, inGroup = false }) {
  return (
    <div
      style={{
        width: inGroup ? 'auto' : '100%',
        maxWidth: inGroup ? 220 : 460,
        flex: inGroup ? '0 0 auto' : 'initial',
        display: 'flex',
        justifyContent: 'center',
        ...(part.style || {}),
      }}
    >
      <img
        src={part.imageUrl || part.src || part.content}
        alt={part.alt || ''}
        style={{
          width: '100%',
          maxWidth: part.maxWidth || 340,
          maxHeight: part.maxHeight || 280,
          objectFit: 'contain',
          borderRadius: 18,
          boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12)',
        }}
      />
    </div>
  );
}

function InputPart({ part, userAnswer, onAnswer, isAnswered }) {
  const id = part.id || part.answerId || 'ans';
  return (
    <input
      value={readAnswer(userAnswer, id)}
      disabled={isAnswered}
      onChange={(event) => onAnswer(writeAnswer(userAnswer, id, event.target.value))}
      style={{
        width: 132,
        height: 50,
        border: '2px solid #93c5fd',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 900,
        color: '#0f172a',
        background: isAnswered ? '#f8fafc' : '#ffffff',
        outline: 'none',
        ...part.style,
      }}
    />
  );
}

function NumberLinePart({ part }) {
  const min = Number(part.min ?? 0);
  const max = Number(part.max ?? 10);
  const marker = Number(part.marker ?? part.value ?? 4);
  const ticks = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  const width = Number(part.width ?? 620);
  const height = Number(part.height ?? 150);
  const startX = 56;
  const endX = width - 56;
  const y = 78;
  const markerX = startX + ((marker - min) / Math.max(max - min, 1)) * (endX - startX);

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', ...(part.style || {}) }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width }}>
        <line x1={startX} y1={y} x2={endX} y2={y} stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        <path d={`M${endX - 12} ${y - 8} L${endX} ${y} L${endX - 12} ${y + 8}`} fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {ticks.map((tick) => {
          const x = startX + ((tick - min) / Math.max(max - min, 1)) * (endX - startX);
          return (
            <g key={tick}>
              <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke="#334155" strokeWidth="3" />
              <text x={x} y={y + 42} textAnchor="middle" fontSize="18" fontWeight="800" fill="#334155">{tick}</text>
            </g>
          );
        })}
        <circle cx={markerX} cy={y} r="11" fill="#22c55e" stroke="#15803d" strokeWidth="4" />
        {part.label ? (
          <text x={markerX} y={y - 28} textAnchor="middle" fontSize="18" fontWeight="900" fill="#15803d">{part.label}</text>
        ) : null}
      </svg>
    </div>
  );
}

function BaseTenBlocksPart({ part }) {
  const number = Number(part.number ?? 34);
  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;
  const showHundreds = part.showHundreds !== false && hundreds > 0;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', ...(part.style || {}) }}>
      <svg width="100%" height="190" viewBox="0 0 620 190" style={{ maxWidth: 620 }}>
        <rect x="16" y="16" width="588" height="158" rx="18" fill="#f8fafc" stroke="#dbeafe" strokeWidth="2" />
        {showHundreds ? Array.from({ length: hundreds }).map((_, index) => {
          const x = 42 + index * 82;
          return (
            <g key={`hundred-${index}`}>
              <rect x={x} y="42" width="62" height="62" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
              {Array.from({ length: 9 }).map((__, gridIndex) => (
                <line
                  key={gridIndex}
                  x1={x + ((gridIndex % 3) + 1) * 15.5}
                  y1="42"
                  x2={x + ((gridIndex % 3) + 1) * 15.5}
                  y2="104"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  opacity="0.55"
                />
              ))}
            </g>
          );
        }) : null}
        {Array.from({ length: tens }).map((_, index) => {
          const x = 46 + (showHundreds ? hundreds * 82 + 18 : 0) + index * 24;
          return (
            <g key={`ten-${index}`}>
              <rect x={x} y="44" width="14" height="96" rx="3" fill="#5eead4" stroke="#0f766e" strokeWidth="2" />
              {Array.from({ length: 9 }).map((__, tick) => (
                <line key={tick} x1={x} y1={54 + tick * 9} x2={x + 14} y2={54 + tick * 9} stroke="#ccfbf1" strokeWidth="1" />
              ))}
            </g>
          );
        })}
        {Array.from({ length: ones }).map((_, index) => {
          const x = 46 + (showHundreds ? hundreds * 82 + 18 : 0) + tens * 24 + 22 + (index % 10) * 18;
          const y = 110 + Math.floor(index / 10) * 18;
          return <rect key={`one-${index}`} x={x} y={y} width="12" height="12" rx="3" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}

function ClockSvg({ hour = 3, minute = 0, size = 240 }) {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  const minuteAngle = (parsedMinute / 60) * 360;
  const hourAngle = ((parsedHour % 12) / 12) * 360 + (parsedMinute / 60) * 30;
  const handEnd = (angle, length) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 120 + Math.cos(rad) * length, y: 120 + Math.sin(rad) * length };
  };
  const minuteEnd = handEnd(minuteAngle, 78);
  const hourEnd = handEnd(hourAngle, 54);

  return (
    <svg width={size} height={size} viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="104" fill="#ffffff" stroke="#5cc4ed" strokeWidth="7" />
      {Array.from({ length: 60 }).map((_, index) => {
        const angle = (index / 60) * 360;
        const outer = handEnd(angle, 96);
        const inner = handEnd(angle, index % 5 === 0 ? 82 : 90);
        return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#334155" strokeWidth={index % 5 === 0 ? 3 : 1} />;
      })}
      {Array.from({ length: 12 }).map((_, index) => {
        const value = index === 0 ? 12 : index;
        const point = handEnd(index * 30, 66);
        return <text key={value} x={point.x} y={point.y + 7} textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f172a">{value}</text>;
      })}
      <line x1="120" y1="120" x2={hourEnd.x} y2={hourEnd.y} stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
      <line x1="120" y1="120" x2={minuteEnd.x} y2={minuteEnd.y} stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
      <circle cx="120" cy="120" r="8" fill="#0f172a" />
    </svg>
  );
}

function ClockPart({ part, inGroup = false }) {
  const size = Number(part.size ?? (inGroup ? 150 : 240));

  return (
    <div
      style={{
        width: inGroup ? size : '100%',
        flex: inGroup ? '0 0 auto' : 'initial',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...(part.style || {}),
      }}
    >
      <ClockSvg hour={part.hour} minute={part.minute} size={size} />
      {part.label ? (
        <div style={{ fontSize: 15, fontWeight: 900, color: '#334155', textAlign: 'center' }}>{part.label}</div>
      ) : null}
    </div>
  );
}

function FractionModelPart({ part }) {
  const numerator = Number(part.numerator ?? 3);
  const denominator = Number(part.denominator ?? 4);
  const shape = part.shape || 'circle';
  const size = Number(part.size ?? 230);

  if (shape === 'bar') {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', ...(part.style || {}) }}>
        <svg width="100%" height="130" viewBox="0 0 520 130" style={{ maxWidth: 520 }}>
          {Array.from({ length: denominator }).map((_, index) => {
            const w = 440 / denominator;
            return (
              <rect
                key={index}
                x={40 + index * w}
                y="42"
                width={w}
                height="54"
                fill={index < numerator ? '#bbf7d0' : '#ffffff'}
                stroke="#16a34a"
                strokeWidth="3"
              />
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', ...(part.style || {}) }}>
      <svg width={size} height={size} viewBox="0 0 240 240">
        {Array.from({ length: denominator }).map((_, index) => {
          const start = (index / denominator) * Math.PI * 2 - Math.PI / 2;
          const end = ((index + 1) / denominator) * Math.PI * 2 - Math.PI / 2;
          const x1 = 120 + Math.cos(start) * 92;
          const y1 = 120 + Math.sin(start) * 92;
          const x2 = 120 + Math.cos(end) * 92;
          const y2 = 120 + Math.sin(end) * 92;
          const largeArc = end - start > Math.PI ? 1 : 0;
          return (
            <path
              key={index}
              d={`M120 120 L${x1} ${y1} A92 92 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={index < numerator ? '#bbf7d0' : '#ffffff'}
              stroke="#16a34a"
              strokeWidth="3"
            />
          );
        })}
        <circle cx="120" cy="120" r="92" fill="none" stroke="#16a34a" strokeWidth="4" />
      </svg>
    </div>
  );
}

function ArithmeticLayoutPart({ part, userAnswer, onAnswer, isAnswered }) {
  const layout = part.layout;
  const answerRow = layout?.rows?.find((row) => row.kind === 'answer');
  const inputRefs = useRef([]);
  const isVerticalAdditionReplica = layout?.variant === 'verticalAdditionReplica';
  const digitCount = Math.max(
    2,
    answerRow?.cells?.length || 0,
    ...(layout?.rows || []).map((row) => String(row.text || '').replace('+', '').trim().length)
  );
  const cellSize = isVerticalAdditionReplica ? 32 : 44;
  const operatorWidth = isVerticalAdditionReplica ? 28 : 0;
  const digitGridWidth = digitCount * cellSize;
  const fullGridWidth = operatorWidth + digitGridWidth;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: isVerticalAdditionReplica ? 3 : 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: isVerticalAdditionReplica ? 30 : 42,
        lineHeight: 1.05,
        fontWeight: isVerticalAdditionReplica ? 500 : 800,
        color: '#0f172a',
      }}
    >
      {(layout?.rows || []).map((row, rowIndex) => {
        if (row.kind === 'divider') {
          return (
            <div
              key={rowIndex}
              style={{
                width: isVerticalAdditionReplica ? fullGridWidth : '100%',
                height: isVerticalAdditionReplica ? 2 : 3,
                background: '#0f172a',
                borderRadius: isVerticalAdditionReplica ? 0 : 999,
                marginTop: isVerticalAdditionReplica ? 1 : 0,
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
                gap: isVerticalAdditionReplica ? 0 : 6,
                width: isVerticalAdditionReplica ? digitGridWidth : 'auto',
                marginLeft: isVerticalAdditionReplica ? operatorWidth : 0,
              }}
            >
              {(answerRow?.cells || []).map((cell, cellIndex) => (
                <input
                  key={cell.id}
                  ref={(element) => {
                    inputRefs.current[cellIndex] = element;
                  }}
                  value={readAnswer(userAnswer, cell.id)}
                  disabled={isAnswered}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/\D/g, '').slice(-1);
                    onAnswer(writeAnswer(userAnswer, cell.id, nextValue));

                    const nextIndex = isVerticalAdditionReplica ? cellIndex - 1 : cellIndex + 1;
                    if (nextValue && nextIndex >= 0 && nextIndex < (answerRow?.cells || []).length) {
                      window.requestAnimationFrame(() => {
                        inputRefs.current[nextIndex]?.focus();
                        inputRefs.current[nextIndex]?.select();
                      });
                    }
                  }}
                  onKeyDown={(event) => {
                    const backspaceIndex = isVerticalAdditionReplica ? cellIndex + 1 : cellIndex - 1;
                    if (
                      event.key === 'Backspace'
                      && !readAnswer(userAnswer, cell.id)
                      && backspaceIndex >= 0
                      && backspaceIndex < (answerRow?.cells || []).length
                    ) {
                      window.requestAnimationFrame(() => {
                        inputRefs.current[backspaceIndex]?.focus();
                        inputRefs.current[backspaceIndex]?.select();
                      });
                    }
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  style={{
                    width: cellSize,
                    height: isVerticalAdditionReplica ? 30 : 54,
                    border: '2px solid #38a8ff',
                    borderLeftStyle: isVerticalAdditionReplica && cell.id !== answerRow.cells[0]?.id ? 'dashed' : 'solid',
                    borderLeftWidth: isVerticalAdditionReplica && cell.id !== answerRow.cells[0]?.id ? 1 : 2,
                    borderRadius: isVerticalAdditionReplica ? 0 : 10,
                    marginLeft: isVerticalAdditionReplica && cell.id !== answerRow.cells[0]?.id ? -1 : 0,
                    textAlign: 'center',
                    font: 'inherit',
                    fontSize: isVerticalAdditionReplica ? 24 : 'inherit',
                    lineHeight: 1,
                    padding: 0,
                    background: isAnswered ? '#f8fafc' : '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              ))}
            </div>
          );
        }
        if (isVerticalAdditionReplica) {
          const rawText = String(row.text || '');
          const hasOperator = rawText.trimStart().startsWith('+');
          const digits = rawText.replace('+', '').trim().padStart(digitCount, ' ').split('');

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
              <span style={{ textAlign: 'center' }}>{hasOperator ? '+' : ''}</span>
              {digits.map((digit, digitIndex) => (
                <span key={`${rowIndex}-${digitIndex}`} style={{ textAlign: 'center' }}>
                  {digit === ' ' ? '\u00A0' : digit}
                </span>
              ))}
            </div>
          );
        }
        return (
          <div
            key={rowIndex}
            style={{
              minWidth: isVerticalAdditionReplica ? digitCount * cellSize : 'auto',
              textAlign: 'right',
              whiteSpace: 'pre',
              letterSpacing: isVerticalAdditionReplica ? '0.08em' : 0,
            }}
          >
            {row.text}
          </div>
        );
      })}
    </div>
  );
}

function GroupPart({ part, question, userAnswer, onAnswer, isAnswered }) {
  const direction = part.direction === 'row' || part.type === 'row' ? 'row' : 'column';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: direction === 'row' ? 14 : 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        ...(part.style || {}),
      }}
    >
      {(part.parts || []).map((child, index) => (
        <PartRenderer
          key={index}
          part={child}
          question={question}
          userAnswer={userAnswer}
          onAnswer={onAnswer}
          isAnswered={isAnswered}
          inGroup
        />
      ))}
    </div>
  );
}

function CompactClockCategorizationPart({ part, userAnswer, onAnswer, isAnswered }) {
  const answerKey = part.answer || part.answerKey || {};
  const category = (part.categories || [])[0] || { id: 'missing_clock', label: '?' };
  const items = part.items || [];
  const cardWidth = Number(part.cardWidth || 158);
  const cardHeight = Number(part.cardHeight || 188);
  const clockSize = Number(part.clockSize || 112);
  const current = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
  const selectedId = current[category.id] || null;
  const selectedItem = items.find((item) => item.id === selectedId);

  const writeSelection = (itemId) => {
    if (isAnswered) return;
    onAnswer({ ...current, [category.id]: itemId });
  };

  const clearSelection = () => {
    if (isAnswered) return;
    const next = { ...current };
    delete next[category.id];
    onAnswer(Object.keys(next).length ? next : null);
  };

  const renderClockCard = (item, { draggable = true, isSlotCard = false } = {}) => (
    <button
      key={item.id}
      type="button"
      draggable={draggable && !isAnswered}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
      onClick={() => (selectedId === item.id ? clearSelection() : writeSelection(item.id))}
      disabled={isAnswered}
      style={{
        width: cardWidth,
        height: cardHeight,
        boxSizing: 'border-box',
        border: `3px solid ${selectedId === item.id ? '#2563eb' : '#7dd3fc'}`,
        borderRadius: 20,
        background: '#ffffff',
        boxShadow: isSlotCard ? '0 16px 34px rgba(15, 23, 42, 0.14)' : '0 12px 26px rgba(15, 23, 42, 0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: isAnswered ? 'default' : 'grab',
        padding: 10,
        transition: 'box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease',
      }}
    >
      <ClockSvg hour={item.hour} minute={item.minute} size={clockSize} />
      <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{item.label || item.content}</span>
    </button>
  );

  const renderPatternNode = (node, index) => {
    if (node.type === 'slot') {
      return (
        <div
          key={`slot-${index}`}
          data-clock-pattern-slot="true"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const itemId = event.dataTransfer.getData('text/plain');
            if (items.some((item) => item.id === itemId)) writeSelection(itemId);
          }}
          style={{
            width: cardWidth,
            height: cardHeight,
            boxSizing: 'border-box',
            border: selectedItem ? 'none' : '3px dashed #bfdbfe',
            borderRadius: 20,
            background: selectedItem ? 'transparent' : '#f8fbff',
            boxShadow: selectedItem ? 'none' : 'inset 0 0 0 1px rgba(191, 219, 254, 0.45), 0 12px 26px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: selectedItem ? 0 : 10,
            transition: 'background 180ms ease, border-color 180ms ease, transform 180ms ease',
          }}
        >
          {selectedItem ? renderClockCard(selectedItem, { draggable: false, isSlotCard: true }) : (
            <span style={{ fontSize: 58, lineHeight: 1, color: '#2563eb', fontWeight: 900 }}>?</span>
          )}
        </div>
      );
    }

    return <ClockPart key={`clock-${index}`} part={{ ...node, size: node.size || 150 }} inGroup />;
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, ...(part.style || {}) }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
        {(part.pattern || []).map(renderPatternNode)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0 }}>
          Drag the suitable clock to the missing slot
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
          {items.filter((item) => item.id !== selectedId).map((item) => renderClockCard(item))}
        </div>
      </div>
    </div>
  );
}

function ToolCategorizationPart({ part, userAnswer, onAnswer, isAnswered }) {
  if (part.variant === 'clock_pattern_slot') {
    return (
      <CompactClockCategorizationPart
        part={part}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }

  const answerKey = part.answer || part.answerKey || {};
  const toolQuestion = {
    id: part.id || 'part-categorization',
    type: 'categorization',
    questionText: part.prompt || part.questionText || '',
    categories: part.categories || part.dropZones || part.dropGroups || [],
    items: part.items || part.sourceItems || part.dragItems || [],
    isCopiable: Boolean(part.isCopiable),
    poolPosition: part.poolPosition,
    answer: answerKey,
  };
  const answerKeys = Object.keys(answerKey);

  const handleToolAnswer = (toolAnswer) => {
    if (toolAnswer == null) {
      if (!answerKeys.length) {
        onAnswer(null);
        return;
      }
      const current = typeof userAnswer === 'object' && userAnswer !== null ? { ...userAnswer } : {};
      answerKeys.forEach((key) => delete current[key]);
      onAnswer(Object.keys(current).length ? current : null);
      return;
    }

    const current = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
    onAnswer({ ...current, ...toolAnswer });
  };

  return (
    <CategorizationRenderer
      question={toolQuestion}
      userAnswer={userAnswer}
      onAnswer={handleToolAnswer}
      isAnswered={isAnswered}
    />
  );
}

function InteractiveProtractorPart({ part, userAnswer, onAnswer, isAnswered }) {
  const [rotation, setRotation] = useState(Number(part.initialRotation ?? 0));
  const vertex = part.target?.vertex || { x: 350, y: 238 };
  const targetAngle = Number(part.target?.angle ?? 45);
  const targetBaseLength = Number(part.target?.baseLength ?? 150);
  const targetArmLength = Number(part.target?.armLength ?? 130);
  const initialPosition = part.initialPosition || { x: vertex.x - 210, y: vertex.y - 205 };
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(1);
  const dragRef = useRef(null);
  const toolWidth = 420;
  const toolHeight = 230;
  const workspaceWidth = 680;
  const workspaceHeight = 380;

  const beginDrag = (event) => {
    if (isAnswered) return;
    event.preventDefault();
    const pointer = event.touches?.[0] || event;
    dragRef.current = {
      startX: pointer.clientX,
      startY: pointer.clientY,
      originX: position.x,
      originY: position.y,
    };

    const move = (moveEvent) => {
      const movePointer = moveEvent.touches?.[0] || moveEvent;
      const nextX = dragRef.current.originX + movePointer.clientX - dragRef.current.startX;
      const nextY = dragRef.current.originY + movePointer.clientY - dragRef.current.startY;
      const maxX = workspaceWidth - toolWidth * size;
      const maxY = workspaceHeight - toolHeight * size;
      setPosition({
        x: Math.max(0, Math.min(maxX, nextX)),
        y: Math.max(0, Math.min(maxY, nextY)),
      });
    };

    const end = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  };

  const resize = (delta) => {
    setSize((current) => Math.max(0.65, Math.min(1.25, Number((current + delta).toFixed(2)))));
  };

  return (
    <div style={{ width: '100%', maxWidth: workspaceWidth, margin: '0 auto', ...(part.style || {}) }}>
      <div
        style={{
          position: 'relative',
          height: workspaceHeight,
          border: '1px solid #e2e8f0',
          borderRadius: 18,
          background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            padding: 6,
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid #dbeafe',
            boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
            zIndex: 4,
          }}
        >
          {[
            ['-', () => resize(-0.1), 'Smaller'],
            ['+', () => resize(0.1), 'Larger'],
            ['↺', () => { setPosition(initialPosition); setSize(1); setRotation(Number(part.initialRotation ?? 0)); }, 'Reset'],
          ].map(([label, action, title]) => (
            <button
              key={label}
              type="button"
              title={title}
              disabled={isAnswered}
              onClick={action}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: 14,
                fontWeight: 900,
                cursor: isAnswered ? 'default' : 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${workspaceWidth} ${workspaceHeight}`}
          width="100%"
          height="100%"
          aria-label="Angle to measure"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <line
            x1={vertex.x}
            y1={vertex.y}
            x2={vertex.x + targetBaseLength}
            y2={vertex.y}
            stroke="#334155"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line
            x1={vertex.x}
            y1={vertex.y}
            x2={vertex.x + Math.cos((targetAngle * Math.PI) / 180) * targetArmLength}
            y2={vertex.y - Math.sin((targetAngle * Math.PI) / 180) * targetArmLength}
            stroke="#334155"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx={vertex.x} cy={vertex.y} r="7" fill="#334155" />
        </svg>

        <div
          role="button"
          tabIndex={0}
          aria-label="Move protractor"
          onMouseDown={beginDrag}
          onTouchStart={beginDrag}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: toolWidth,
            height: toolHeight,
            transform: `scale(${size}) rotate(${rotation}deg)`,
            transformOrigin: 'top left',
            cursor: isAnswered ? 'default' : 'grab',
            userSelect: 'none',
            transition: dragRef.current ? 'none' : 'transform 160ms ease',
          }}
        >
          <svg viewBox="0 0 420 230" width="420" height="230" aria-label="Movable protractor">
            <path d="M30 205 A180 180 0 0 1 390 205" fill="#eff6ff" fillOpacity="0.72" stroke="#2563eb" strokeWidth="4" />
            <path d="M82 205 A128 128 0 0 1 338 205" fill="#ffffff" opacity="0.32" />
            <line x1="30" y1="205" x2="390" y2="205" stroke="#0f172a" strokeWidth="3" />
            {Array.from({ length: 181 }).map((_, angle) => {
              const rad = (Math.PI * (180 - angle)) / 180;
              const outer = 178;
              const inner = angle % 10 === 0 ? 154 : angle % 5 === 0 ? 162 : 170;
              const x1 = 210 + Math.cos(rad) * outer;
              const y1 = 205 - Math.sin(rad) * outer;
              const x2 = 210 + Math.cos(rad) * inner;
              const y2 = 205 - Math.sin(rad) * inner;
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={angle % 10 === 0 ? '#0f172a' : '#64748b'}
                  strokeWidth={angle % 10 === 0 ? 2.3 : angle % 5 === 0 ? 1.4 : 0.8}
                />
              );
            })}
            {Array.from({ length: 19 }).map((_, index) => {
              const angle = index * 10;
              const rad = (Math.PI * (180 - angle)) / 180;
              const outerX = 210 + Math.cos(rad) * 134;
              const outerY = 205 - Math.sin(rad) * 134;
              const innerX = 210 + Math.cos(rad) * 105;
              const innerY = 205 - Math.sin(rad) * 105;
              return (
                <g key={angle}>
                  <text x={outerX} y={outerY + 6} textAnchor="middle" fontSize="15" fontWeight="900" fill="#0f172a">{angle}</text>
                  <text x={innerX} y={innerY + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b">{180 - angle}</text>
                </g>
              );
            })}
            <path d="M128 205 A82 82 0 0 1 292 205" fill="none" stroke="#2563eb" strokeWidth="3" />
            <line x1="210" y1="205" x2="210" y2="154" stroke="#2563eb" strokeWidth="3" />
            <circle cx="210" cy="205" r="7" fill="#0f172a" />
            <text x="210" y="226" textAnchor="middle" fontSize="12" fontWeight="800" fill="#64748b">drag tool to move</text>
          </svg>
        </div>
      </div>

      <div
        style={{
          margin: '12px auto 0',
          maxWidth: 520,
          padding: '10px 12px',
          border: '1px solid #dbeafe',
          borderRadius: 14,
          background: '#ffffff',
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Rotation</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#334155' }}>{rotation}°</span>
        </div>
        <input
          type="range"
          min={part.rotationMin ?? -180}
          max={part.rotationMax ?? 180}
          step={part.step ?? 1}
          value={rotation}
          disabled={isAnswered}
          onChange={(event) => setRotation(Number(event.target.value))}
          style={{ width: '100%', accentColor: '#2563eb' }}
        />
      </div>
    </div>
  );
}

const PART_RENDERERS = {
  text: TextPart,
  svg: SvgPart,
  image: ImagePart,
  input: InputPart,
  latex: ({ part }) => (
    <div style={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: 26, fontWeight: 850, color: '#0f172a', textAlign: 'center', ...(part.style || {}) }}>
      {cleanText(part.content || '')}
    </div>
  ),
  arithmeticLayout: ArithmeticLayoutPart,
  row: GroupPart,
  group: GroupPart,
  categorization: ToolCategorizationPart,
  copy_drag_drop: ToolCategorizationPart,
  drag_drop: ToolCategorizationPart,
  interactive_protractor: InteractiveProtractorPart,
  number_line: NumberLinePart,
  base_ten_blocks: BaseTenBlocksPart,
  clock: ClockPart,
  fraction_model: FractionModelPart,
};

export default function PartRenderer({
  part,
  question,
  userAnswer,
  onAnswer,
  isAnswered,
  inGroup = false,
}) {
  if (!part) return null;
  const Renderer = PART_RENDERERS[part.type];

  if (!Renderer) {
    return (
      <div style={{ padding: 12, border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', fontWeight: 800 }}>
        Unsupported part: {part.type || 'unknown'}
      </div>
    );
  }

  return (
    <Renderer
      part={part}
      question={question}
      userAnswer={userAnswer}
      onAnswer={onAnswer}
      isAnswered={isAnswered}
      inGroup={inGroup}
    />
  );
}

export { TextWithBlanks, readAnswer, writeAnswer };
