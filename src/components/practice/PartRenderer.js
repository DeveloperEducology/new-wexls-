'use client';

import { useRef, useState, useEffect } from 'react';
import CategorizationRenderer from './CategorizationRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';
import { speakText } from '@/lib/ttsClient';

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
          return <span key={subIndex}>{subPiece.replace(/^#{1,4}\s*/, '')}</span>;
        })}
      </span>
    );
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
          return <InlineMarkdown key={index} text={piece} />;
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

function TextPart({ part, question, userAnswer, onAnswer, isAnswered, showSpeaker, speakTextValue }) {
  const content = part.content || part.text || '';
  
  const textElement = (
    <div
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
      {isMarkdownTable(content) ? (
        <MarkdownTable text={content} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} />
      ) : (
        <TextWithBlanks text={content} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} />
      )}
    </div>
  );

  if (showSpeaker) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <button
          type="button"
          onClick={() => speakText(speakTextValue || content, question?.voice || 'Puck', question?.audioUrl)}
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
          title="Read question out loud"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>
        {textElement}
      </div>
    );
  }

  return textElement;
}

function renderClientStackedWeights(panX, panY, totalWeight) {
  let html = '';
  let yCurrent = panY - 2;

  // Split totalWeight into 5kg and 1kg units
  const weights = [];
  let remaining = totalWeight;
  while (remaining >= 5) {
    weights.push(5);
    remaining -= 5;
  }
  while (remaining >= 1) {
    weights.push(1);
    remaining -= 1;
  }

  weights.forEach((w) => {
    const width = w === 5 ? 36 : 28;
    const height = w === 5 ? 18 : 14;
    const color = w === 5 ? '#f59e0b' : '#94a3b8'; // Gold for 5, Silver for 1
    const stroke = w === 5 ? '#b45309' : '#475569';
    const textCol = w === 5 ? '#ffffff' : '#1e293b';

    const x = panX - width / 2;
    const y = yCurrent - height;

    html += `
      <g>
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" stroke="${stroke}" stroke-width="1.5" rx="3" />
        <ellipse cx="${panX}" cy="${y}" rx="${width / 2}" ry="3" fill="${color}" stroke="${stroke}" stroke-width="1" />
        <text x="${panX}" y="${y + height / 2 + 4}" font-family="Outfit, sans-serif" font-weight="950" font-size="10px" fill="${textCol}" text-anchor="middle">${w}</text>
      </g>
    `;
    yCurrent -= (height + 2);
  });

  return html;
}

function renderClientLabeledBox(panX, panY, weight, label, fillColor) {
  const width = 64;
  const height = 46;
  const x = panX - width / 2;
  const y = panY - height - 2;
  const strokeColor = '#1e293b';

  return `
    <g>
      <!-- Main Box body -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" rx="4" />
      
      <!-- Label -->
      <text x="${panX}" y="${y + 16}" font-family="Outfit, sans-serif" font-weight="bold" font-size="11px" fill="#fff" text-anchor="middle">${label}</text>
      
      <!-- Weight value -->
      <text x="${panX}" y="${y + 34}" font-family="Plus Jakarta Sans, sans-serif" font-weight="800" font-size="13px" fill="#fff" text-anchor="middle">${weight} kg</text>
    </g>
  `;
}

function drawInteractiveBalanceScaleSVG({ leftWeight, rightWeight, leftLabel = 'Box A', rightLabel = 'Box B', showStacked = false }) {
  const width = 450;
  const height = 300;
  const midX = width / 2;
  const pivotY = height - 60;
  const beamY = 120;
  
  // Calculate tilt angle based on weight difference
  let tiltDegrees = 0;
  if (leftWeight > rightWeight) {
    tiltDegrees = -12; // Left goes down
  } else if (rightWeight > leftWeight) {
    tiltDegrees = 12; // Right goes down
  }
  
  const rad = (tiltDegrees * Math.PI) / 180;
  const armLength = 135;
  
  // Left and right hook points on the beam
  const leftBeamX = midX - armLength * Math.cos(rad);
  const leftBeamY = beamY - armLength * Math.sin(rad);
  const rightBeamX = midX + armLength * Math.cos(rad);
  const rightBeamY = beamY + armLength * Math.sin(rad);
  
  // Platform pan coordinates
  const panH = 80;
  const leftPanX = leftBeamX;
  const leftPanY = leftBeamY + panH;
  const rightPanX = rightBeamX;
  const rightPanY = rightBeamY + panH;

  // Render weights on each pan
  let leftWeightsHTML = '';
  let rightWeightsHTML = '';

  if (showStacked) {
    leftWeightsHTML = renderClientStackedWeights(leftPanX, leftPanY, leftWeight);
    rightWeightsHTML = renderClientStackedWeights(rightPanX, rightPanY, rightWeight);
  } else {
    leftWeightsHTML = renderClientLabeledBox(leftPanX, leftPanY, leftWeight, leftLabel, '#f87171');
    rightWeightsHTML = renderClientLabeledBox(rightPanX, rightPanY, rightWeight, rightLabel, '#60a5fa');
  }

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
      <!-- Table Base -->
      <rect x="50" y="${pivotY + 20}" width="350" height="15" rx="3" fill="#78350f" stroke="#451a03" stroke-width="2" />
      
      <!-- Stand Pillar -->
      <polygon points="${midX - 22},${pivotY + 20} ${midX + 22},${pivotY + 20} ${midX + 10},${beamY} ${midX - 10},${beamY}" fill="#475569" stroke="#000" stroke-width="2" />
      
      <!-- Left Pan Assembly cords -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX - 30}" y2="${leftPanY}" stroke="#64748b" stroke-width="2" />
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX + 30}" y2="${leftPanY}" stroke="#64748b" stroke-width="2" />
      <!-- Platform Pan Left -->
      <path d="M ${leftPanX - 35},${leftPanY} L ${leftPanX + 35},${leftPanY} Q ${leftPanX},${leftPanY + 12} ${leftPanX - 35},${leftPanY} Z" fill="#cbd5e1" stroke="#334155" stroke-width="2" />
      <!-- Left Pan Weights -->
      ${leftWeightsHTML}
      
      <!-- Right Pan Assembly cords -->
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX - 30}" y2="${rightPanY}" stroke="#64748b" stroke-width="2" />
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX + 30}" y2="${rightPanY}" stroke="#64748b" stroke-width="2" />
      <!-- Platform Pan Right -->
      <path d="M ${rightPanX - 35},${rightPanY} L ${rightPanX + 35},${rightPanY} Q ${rightPanX},${rightPanY + 12} ${rightPanX - 35},${rightPanY} Z" fill="#cbd5e1" stroke="#334155" stroke-width="2" />
      <!-- Right Pan Weights -->
      ${rightWeightsHTML}
      
      <!-- Central Balance Beam -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${rightBeamX}" y2="${rightBeamY}" stroke="#334155" stroke-width="5" stroke-linecap="round" />
      <circle cx="${midX}" cy="${beamY}" r="7" fill="#facc15" stroke="#000" stroke-width="2" />
    </svg>
  `;
}

function SvgPart({ part, inGroup = false, userAnswer, question }) {
  let content = '';
  if (question?.metadata?.task === 'interactive_balance') {
    const rightWeight = question.metadata.rightWeight ?? 10;
    let enteredVal = 0;
    if (userAnswer) {
      if (typeof userAnswer === 'object') {
        const val = userAnswer.ans ?? userAnswer.answer ?? userAnswer.value ?? '';
        enteredVal = parseInt(val, 10);
      } else {
        enteredVal = parseInt(userAnswer, 10);
      }
    }
    const leftWeight = isNaN(enteredVal) || enteredVal < 0 ? 0 : enteredVal;
    content = drawInteractiveBalanceScaleSVG({
      leftWeight,
      rightWeight,
      leftLabel: 'Box A',
      rightLabel: 'Box B',
      showStacked: true
    });
  } else {
    content = part.dynamicContent && typeof part.dynamicContent === 'function'
      ? part.dynamicContent(userAnswer)
      : (typeof part.content === 'function' ? part.content(userAnswer) : part.content);
  }

  return (
    <div
      className={styles.responsiveSvg}
      style={{
        width: inGroup ? 'auto' : '100%',
        maxWidth: '100%',
        flex: inGroup ? '0 0 auto' : 'initial',
        display: 'flex',
        justifyContent: 'flex-start',
        ...(part.style || {}),
      }}
      dangerouslySetInnerHTML={{ __html: content }}
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
        justifyContent: 'flex-start',
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
        ...part.style,
      }}
    />
  );
}

function OptionSelectPart({ part, userAnswer, onAnswer, isAnswered, inGroup = false }) {
  const id = part.id || part.answerId || 'selected';
  const selectedValue = readAnswer(userAnswer, id);
  const options = Array.isArray(part.options) ? part.options : [];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'clamp(12px, 3vw, 22px)',
        alignItems: 'center',
        justifyContent: part.align || 'flex-start',
        width: inGroup ? 'auto' : '100%',
        flex: inGroup ? '0 0 auto' : 'initial',
        ...(part.style || {}),
      }}
    >
      {options.map((option, index) => {
        const value = typeof option === 'object'
          ? option.value ?? option.id ?? option.label ?? option.text
          : option;
        const label = typeof option === 'object'
          ? option.label ?? option.text ?? option.value ?? option.id
          : option;
        const selected = String(selectedValue) === String(value);

        return (
          <button
            key={`${value}-${index}`}
            type="button"
            disabled={isAnswered}
            onClick={() => onAnswer(writeAnswer(userAnswer, id, value))}
            style={{
              minWidth: 'clamp(112px, 26vw, 150px)',
              minHeight: 'clamp(58px, 12vw, 76px)',
              padding: '12px 24px',
              border: `2px solid ${selected ? '#38a5e8' : '#a7e3fb'}`,
              borderRadius: 8,
              background: selected ? '#eef6ff' : '#ffffff',
              color: '#000000',
              fontSize: 'clamp(20px, 5vw, 28px)',
              fontWeight: 400,
              fontFamily: 'Arial, Helvetica, sans-serif',
              cursor: isAnswered ? 'default' : 'pointer',
              boxShadow: selected ? '0 3px 0 rgba(56, 165, 232, 0.16)' : 'none',
              transition: 'border-color 140ms ease, background 140ms ease, box-shadow 140ms ease',
              ...(part.buttonStyle || {}),
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function normalizeSentenceTokens(part) {
  if (Array.isArray(part.tokens) && part.tokens.length) {
    return part.tokens.map((token, index) => {
      if (typeof token === 'string') {
        return {
          id: `token_${index}`,
          text: token,
          selectable: true,
        };
      }

      return {
        id: token.id || `token_${index}`,
        text: token.text ?? token.content ?? '',
        display: token.display ?? token.text ?? token.content ?? '',
        trailing: token.trailing ?? '',
        leading: token.leading ?? '',
        selectable: token.selectable !== false,
      };
    });
  }

  return String(part.sentence || part.content || '')
    .split(/(\s+)/)
    .filter((piece) => piece.length)
    .map((piece, index) => ({
      id: `token_${index}`,
      text: piece,
      display: piece,
      selectable: !/^\s+$/.test(piece),
      isSpace: /^\s+$/.test(piece),
    }));
}

function PickFromSentencePart({ part, userAnswer, onAnswer, isAnswered }) {
  const [hoveredToken, setHoveredToken] = useState(null);
  const answerKey = part.answerKey || part.id || 'selectedTokens';
  const multiSelect = Boolean(part.multiSelect);
  const tokens = normalizeSentenceTokens(part);
  const tokenOrder = new Map(tokens.map((token, index) => [token.id, index]));
  const selectedValue = readAnswer(userAnswer, answerKey);
  const selectedIds = String(selectedValue || '')
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);

  function serializeSelected(ids) {
    return [...new Set(ids)]
      .sort((a, b) => (tokenOrder.get(a) ?? 0) - (tokenOrder.get(b) ?? 0))
      .join('|');
  }

  function handleSelect(token) {
    if (isAnswered || !token.selectable) return;

    const nextIds = multiSelect
      ? selectedIds.includes(token.id)
        ? selectedIds.filter((id) => id !== token.id)
        : [...selectedIds, token.id]
      : [token.id];

    onAnswer(writeAnswer(userAnswer, answerKey, serializeSelected(nextIds)));
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: part.align === 'center' ? 'center' : 'flex-start',
        ...(part.wrapperStyle || {}),
      }}
    >
      <div
        role="group"
        aria-label={part.ariaLabel || part.prompt || 'Select words in the sentence'}
        style={{
          maxWidth: part.maxWidth || 940,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: 'clamp(7px, 1.4vw, 13px)',
          rowGap: 'clamp(8px, 1.8vw, 14px)',
          color: '#0f172a',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: responsivePx(part.fontSize || part.style?.fontSize, 27, 42),
          fontWeight: part.fontWeight || 400,
          lineHeight: 1.55,
          textAlign: 'left',
          ...(part.style || {}),
        }}
      >
        {tokens.map((token) => {
          if (token.isSpace) {
            return <span key={token.id} style={{ width: 2 }} />;
          }

          const selected = selectedIds.includes(token.id);
          const hovered = hoveredToken === token.id;
          const canPick = token.selectable && !isAnswered;

          return (
            <button
              key={token.id}
              type="button"
              disabled={!token.selectable || isAnswered}
              onClick={() => handleSelect(token)}
              onMouseEnter={() => setHoveredToken(token.id)}
              onMouseLeave={() => setHoveredToken(null)}
              style={{
                appearance: 'none',
                border: 'none',
                borderBottom: selected
                  ? '4px solid #38a5e8'
                  : hovered && token.selectable
                    ? '3px dotted #38a5e8'
                    : '3px solid transparent',
                borderRadius: 0,
                background: 'transparent',
                padding: '0 2px 5px',
                margin: 0,
                color: selected ? '#0f172a' : 'inherit',
                font: 'inherit',
                fontWeight: selected ? 700 : 'inherit',
                cursor: canPick ? 'pointer' : 'default',
                transition: 'border-color 120ms ease, border-style 120ms ease, color 120ms ease',
              }}
            >
              {token.leading || ''}
              {token.display ?? token.text}
              {token.trailing || ''}
            </button>
          );
        })}
      </div>
    </div>
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

function FractionPart({ part, userAnswer, onAnswer, isAnswered }) {
  const renderItem = (item) => {
    if (typeof item === 'object' && item !== null) {
      if (item.type === 'input') {
        const id = item.id || 'ans';
        return (
          <input
            value={readAnswer(userAnswer, id)}
            disabled={isAnswered}
            onChange={(event) => onAnswer(writeAnswer(userAnswer, id, event.target.value))}
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
              ...(item.style || {}),
            }}
          />
        );
      }
    }
    return (
      <span
        style={{
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 700,
          ...(typeof item === 'object' && item !== null ? item.style || {} : {}),
        }}
      >
        {String(item ?? '')}
      </span>
    );
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        margin: '0 8px',
        ...(part.style || {}),
      }}
    >
      <div style={{ padding: '2px 4px', textAlign: 'center' }}>
        {renderItem(part.numerator)}
      </div>
      <div
        style={{
          width: '100%',
          height: 2,
          background: '#0f172a',
          margin: '2px 0',
        }}
      />
      <div style={{ padding: '2px 4px', textAlign: 'center' }}>
        {renderItem(part.denominator)}
      </div>
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

function getFractionGrid(totalParts, requestedRows, requestedColumns) {
  if (requestedRows && requestedColumns) {
    return { rows: Number(requestedRows), columns: Number(requestedColumns) };
  }

  if (totalParts === 4) return { rows: 2, columns: 2 };
  if (totalParts === 6) return { rows: 2, columns: 3 };
  if (totalParts === 8) return { rows: 2, columns: 4 };
  if (totalParts === 9) return { rows: 3, columns: 3 };
  return { rows: 1, columns: totalParts };
}

function polarPoint(cx, cy, radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
}

function InteractiveFractionCutterPart({ part, userAnswer, onAnswer, isAnswered }) {
  const size = Number(part.size ?? 280);
  const shape = part.shape || 'rectangle'; 
  const dots = Array.isArray(part.dots) ? part.dots : [];
  const preexistingCuts = Array.isArray(part.preexistingCuts) ? part.preexistingCuts : [];
  const requiredCuts = Array.isArray(part.requiredCuts) ? part.requiredCuts : [];
  const sizeSVG = 300;

  const currentAnswer = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
  const userCuts = Array.isArray(currentAnswer.cuts) ? currentAnswer.cuts : [];
  
  const [activeDotId, setActiveDotId] = useState(null);
  const [pointerPos, setPointerPos] = useState(null);
  const svgRef = useRef(null);

  const activeDot = dots.find((d) => d.id === activeDotId);

  const handleDotClick = (dotId, event) => {
    if (isAnswered) return;
    event.stopPropagation();

    if (activeDotId === null) {
      setActiveDotId(dotId);
    } else if (activeDotId === dotId) {
      setActiveDotId(null);
      setPointerPos(null);
    } else {
      const exists = userCuts.some(
        ([a, b]) => (a === activeDotId && b === dotId) || (a === dotId && b === activeDotId)
      ) || preexistingCuts.some(
        ([a, b]) => (a === activeDotId && b === dotId) || (a === dotId && b === activeDotId)
      );

      if (!exists) {
        const nextCuts = [...userCuts, [activeDotId, dotId]];
        
        const checkCutsMatch = (u, r) => {
          if (u.length !== r.length) return false;
          const normU = u.map(([a, b]) => [a, b].sort().join('-')).sort();
          const normR = r.map(([a, b]) => [a, b].sort().join('-')).sort();
          return normU.every((c, i) => c === normR[i]);
        };

        const isCorrect = checkCutsMatch(nextCuts, requiredCuts);

        onAnswer({
          cuts: nextCuts,
          isCorrect: isCorrect ? 'true' : 'false'
        });
      }
      setActiveDotId(null);
      setPointerPos(null);
    }
  };

  const handleSvgMouseMove = (event) => {
    if (isAnswered || activeDotId === null || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const pointerX = event.touches?.[0]?.clientX ?? event.clientX;
    const pointerY = event.touches?.[0]?.clientY ?? event.clientY;
    
    const x = ((pointerX - rect.left) / rect.width) * sizeSVG;
    const y = ((pointerY - rect.top) / rect.height) * sizeSVG;
    
    setPointerPos({ x, y });
  };

  const handleClear = () => {
    if (isAnswered) return;
    onAnswer(null);
    setActiveDotId(null);
    setPointerPos(null);
  };

  const allCuts = [...preexistingCuts, ...userCuts];

  const getDotCoords = (dotId) => {
    const dot = dots.find((d) => d.id === dotId);
    return dot ? { x: dot.x, y: dot.y } : { x: 150, y: 150 };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        margin: '18px 0',
        width: '100%',
        ...(part.style || {}),
      }}
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${sizeSVG} ${sizeSVG}`}
          width="100%"
          height="100%"
          onMouseMove={handleSvgMouseMove}
          onTouchMove={handleSvgMouseMove}
          onMouseLeave={() => setPointerPos(null)}
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '2px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(148, 163, 184, 0.08)',
            cursor: isAnswered ? 'default' : 'crosshair'
          }}
        >
          {shape === 'circle' ? (
            <circle cx="150" cy="150" r="100" fill="#c084fc" stroke="#7c3aed" strokeWidth="4" />
          ) : (
            <rect x="50" y="50" width="200" height="200" rx="12" fill="#6ee7b7" stroke="#059669" strokeWidth="4" />
          )}

          {allCuts.map(([idA, idB], index) => {
            const ptA = getDotCoords(idA);
            const ptB = getDotCoords(idB);
            const isPreexisting = preexistingCuts.some(
              ([a, b]) => (a === idA && b === idB) || (a === idB && b === idA)
            );
            return (
              <line
                key={index}
                x1={ptA.x}
                y1={ptA.y}
                x2={ptB.x}
                y2={ptB.y}
                stroke="#ffffff"
                strokeWidth="4"
                strokeDasharray={isPreexisting ? "none" : "8 6"}
                strokeLinecap="round"
              />
            );
          })}

          {activeDot && pointerPos && (
            <line
              x1={activeDot.x}
              y1={activeDot.y}
              x2={pointerPos.x}
              y2={pointerPos.y}
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              pointerEvents="none"
            />
          )}

          {dots.map((dot) => {
            const isActive = activeDotId === dot.id;
            return (
              <circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={isActive ? "10" : "8"}
                fill={isActive ? "#f97316" : "#64748b"}
                stroke="#ffffff"
                strokeWidth="2.5"
                style={{
                  cursor: isAnswered ? 'default' : 'pointer',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.16))',
                  transition: 'r 150ms ease, fill 150ms ease'
                }}
                onClick={(e) => handleDotClick(dot.id, e)}
              />
            );
          })}
        </svg>
      </div>

      {!isAnswered && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '6px 14px',
            border: '2px solid #cbd5e1',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 180ms ease, border-color 180ms ease'
          }}
        >
          Reset cuts
        </button>
      )}
    </div>
  );
}

function InteractiveFractionModelPart({ part, userAnswer, onAnswer, isAnswered }) {
  const totalParts = Math.max(2, Number(part.totalParts ?? part.denominator ?? 4));
  const targetCount = Math.max(1, Math.min(totalParts, Number(part.removeCount ?? part.fillCount ?? part.numerator ?? 1)));
  const model = part.model || part.shape || 'pie';
  const interaction = part.interaction || 'remove';
  const answerKey = part.answerKey || (interaction === 'fill' ? 'filledCount' : 'removedCount');
  const selectionKey = interaction === 'fill' ? 'filledParts' : 'removedParts';
  const currentAnswer = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
  const selectedParts = Array.isArray(currentAnswer[selectionKey]) ? currentAnswer[selectionKey] : [];
  const selectedSet = new Set(selectedParts);
  const size = Number(part.size ?? 280);

  const updateSelection = (pieceId) => {
    if (isAnswered) return;

    let next = selectedParts.includes(pieceId)
      ? selectedParts.filter((id) => id !== pieceId)
      : [...selectedParts, pieceId];

    if (next.length > targetCount) {
      next = next.slice(next.length - targetCount);
    }

    onAnswer({
      ...currentAnswer,
      [selectionKey]: next,
      [answerKey]: String(next.length),
      totalParts: String(totalParts),
      fraction: `${next.length}/${totalParts}`,
    });
  };

  const pieceStyle = (pieceId) => {
    const selected = selectedSet.has(pieceId);
    const isRemove = interaction === 'remove';
    return {
      fill: isRemove
        ? (selected ? '#ffffff' : (part.fillColor || '#bbf7d0'))
        : (selected ? (part.fillColor || '#bbf7d0') : '#ffffff'),
      stroke: isRemove && selected ? '#94a3b8' : (part.strokeColor || '#16a34a'),
      strokeWidth: isRemove && selected ? 2 : 3,
      strokeDasharray: isRemove && selected ? '8 6' : 'none',
      opacity: isRemove && selected ? 0.75 : 1,
      cursor: isAnswered ? 'default' : 'pointer',
      transition: 'opacity 160ms ease',
    };
  };

  const renderPie = () => (
    <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={`${interaction === 'fill' ? 'Fill' : 'Remove'} ${targetCount} out of ${totalParts} parts`}>
      {Array.from({ length: totalParts }).map((_, index) => {
        const id = `piece_${index}`;
        const start = -90 + (index * 360) / totalParts;
        const end = -90 + ((index + 1) * 360) / totalParts;
        const p1 = polarPoint(120, 120, 92, start);
        const p2 = polarPoint(120, 120, 92, end);
        const largeArc = end - start > 180 ? 1 : 0;
        return (
          <path
            key={id}
            d={`M120 120 L${p1.x} ${p1.y} A92 92 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`}
            {...pieceStyle(id)}
            onClick={() => updateSelection(id)}
          />
        );
      })}
      <circle cx="120" cy="120" r="92" fill="none" stroke={part.strokeColor || '#16a34a'} strokeWidth="4" pointerEvents="none" />
    </svg>
  );

  const renderGridShape = () => {
    const { rows, columns } = getFractionGrid(totalParts, part.rows, part.columns);
    const isRectangle = model === 'rectangle';
    const shapeWidth = isRectangle ? 190 : 180;
    const shapeHeight = isRectangle ? 130 : 180;
    const xOffset = (240 - shapeWidth) / 2;
    const yOffset = (240 - shapeHeight) / 2;
    const cellWidth = shapeWidth / columns;
    const cellHeight = shapeHeight / rows;
    return (
      <svg width={size} height={size} viewBox="0 0 240 240" role="img" aria-label={`${interaction === 'fill' ? 'Fill' : 'Remove'} ${targetCount} out of ${totalParts} parts`}>
        {Array.from({ length: totalParts }).map((_, index) => {
          const id = `piece_${index}`;
          const row = Math.floor(index / columns);
          const column = index % columns;
          return (
            <rect
              key={id}
              x={xOffset + column * cellWidth}
              y={yOffset + row * cellHeight}
              width={cellWidth}
              height={cellHeight}
              {...pieceStyle(id)}
              onClick={() => updateSelection(id)}
            />
          );
        })}
        <rect x={xOffset} y={yOffset} width={shapeWidth} height={shapeHeight} fill="none" stroke={part.strokeColor || '#16a34a'} strokeWidth="4" pointerEvents="none" />
      </svg>
    );
  };

  const renderBar = () => (
    <svg width="100%" height="150" viewBox="0 0 560 150" style={{ maxWidth: 620 }} role="img" aria-label={`${interaction === 'fill' ? 'Fill' : 'Remove'} ${targetCount} out of ${totalParts} parts`}>
      {Array.from({ length: totalParts }).map((_, index) => {
        const id = `piece_${index}`;
        const width = 480 / totalParts;
        return (
          <rect
            key={id}
            x={40 + index * width}
            y="48"
            width={width}
            height="58"
            {...pieceStyle(id)}
            onClick={() => updateSelection(id)}
          />
        );
      })}
      <rect x="40" y="48" width="480" height="58" fill="none" stroke={part.strokeColor || '#16a34a'} strokeWidth="4" pointerEvents="none" />
    </svg>
  );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        margin: '18px 0',
        ...(part.style || {}),
      }}
    >
      {model === 'square' || model === 'rectangle' ? renderGridShape() : model === 'bar' ? renderBar() : renderPie()}
      <div style={{ fontSize: 15, fontWeight: 900, color: '#475569' }}>
        {interaction === 'fill' ? 'Filled' : 'Removed'} {selectedParts.length} of {totalParts} parts
      </div>
    </div>
  );
}

function ArithmeticLayoutPart({ part, userAnswer, onAnswer, isAnswered }) {
  const layout = part.layout;
  const answerRow = layout?.rows?.find((row) => row.kind === 'answer');
  const inputRefs = useRef([]);
  const isVerticalAdditionReplica = layout?.variant === 'verticalAdditionReplica';
  const isVerticalArithmeticReplica = isVerticalAdditionReplica || layout?.variant === 'verticalMultiplicationReplica';
  const digitCount = Math.max(
    2,
    answerRow?.cells?.length || 0,
    ...(layout?.rows || []).map((row) => String(row.text || '').replace(/[+×x]/gi, '').trim().length)
  );
  const cellSize = isVerticalArithmeticReplica ? 32 : 44;
  const operatorWidth = isVerticalArithmeticReplica ? 28 : 0;
  const digitGridWidth = digitCount * cellSize;
  const fullGridWidth = operatorWidth + digitGridWidth;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: isVerticalArithmeticReplica ? 3 : 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: isVerticalArithmeticReplica ? 'clamp(24px, 7vw, 30px)' : 'clamp(30px, 9vw, 42px)',
        lineHeight: 1.05,
        fontWeight: isVerticalArithmeticReplica ? 500 : 800,
        color: '#0f172a',
      }}
    >
      {(layout?.rows || []).map((row, rowIndex) => {
        if (row.kind === 'divider') {
          return (
            <div
              key={rowIndex}
              style={{
                width: isVerticalArithmeticReplica ? fullGridWidth : '100%',
                height: isVerticalArithmeticReplica ? 2 : 3,
                background: '#0f172a',
                borderRadius: isVerticalArithmeticReplica ? 0 : 999,
                marginTop: isVerticalArithmeticReplica ? 1 : 0,
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
                gap: isVerticalArithmeticReplica ? 0 : 6,
                width: isVerticalArithmeticReplica ? digitGridWidth : 'auto',
                marginLeft: isVerticalArithmeticReplica ? operatorWidth : 0,
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
                    const nextAnswer = writeAnswer(userAnswer, cell.id, nextValue);
                    const nextJoined = (answerRow?.cells || [])
                      .map((answerCell) => readAnswer(nextAnswer, answerCell.id))
                      .join('');

                    onAnswer(
                      isVerticalArithmeticReplica
                        ? { ...nextAnswer, _joined: nextJoined }
                        : nextAnswer
                    );

                    const nextIndex = isVerticalArithmeticReplica ? cellIndex - 1 : cellIndex + 1;
                    if (nextValue && nextIndex >= 0 && nextIndex < (answerRow?.cells || []).length) {
                      window.requestAnimationFrame(() => {
                        inputRefs.current[nextIndex]?.focus();
                        inputRefs.current[nextIndex]?.select();
                      });
                    }
                  }}
                  onKeyDown={(event) => {
                    const backspaceIndex = isVerticalArithmeticReplica ? cellIndex + 1 : cellIndex - 1;
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
                    height: isVerticalArithmeticReplica ? 30 : 54,
                    border: '2px solid #38a8ff',
                    borderLeftStyle: isVerticalArithmeticReplica && cell.id !== answerRow.cells[0]?.id ? 'dashed' : 'solid',
                    borderLeftWidth: isVerticalArithmeticReplica && cell.id !== answerRow.cells[0]?.id ? 1 : 2,
                    borderRadius: isVerticalArithmeticReplica ? 0 : 10,
                    marginLeft: isVerticalArithmeticReplica && cell.id !== answerRow.cells[0]?.id ? -1 : 0,
                    textAlign: 'center',
                    font: 'inherit',
                    fontSize: isVerticalArithmeticReplica ? 24 : 'inherit',
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
        if (isVerticalArithmeticReplica) {
          const rawText = String(row.text || '');
          const operator = rawText.trimStart().match(/^[+×x]/i)?.[0] || '';
          const digits = rawText.replace(/^[\s+×x]+/i, '').trim().padStart(digitCount, ' ').split('');

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
        return (
          <div
            key={rowIndex}
            style={{
              minWidth: isVerticalArithmeticReplica ? digitCount * cellSize : 'auto',
              textAlign: 'right',
              whiteSpace: 'pre',
              letterSpacing: isVerticalArithmeticReplica ? '0.08em' : 0,
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
  const defaultJustifyContent = direction === 'row' ? 'flex-start' : 'stretch';
  const defaultAlignItems = direction === 'row' ? 'center' : 'stretch';
  
  return (
    <div
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
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', item.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(event) => event.preventDefault()}
      disabled={isAnswered}
      style={{
        width: cardWidth,
        height: cardHeight,
        boxSizing: 'border-box',
        border: '3px solid #7dd3fc',
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
        transition: 'box-shadow 180ms ease, border-color 180ms ease',
        touchAction: 'none',
        userSelect: 'none',
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
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
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
            transition: 'background 180ms ease, border-color 180ms ease',
          }}
        >
          {selectedItem ? renderClockCard(selectedItem, { isSlotCard: true }) : (
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
        <div
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(event) => {
            event.preventDefault();
            const itemId = event.dataTransfer.getData('text/plain');
            if (itemId === selectedId) clearSelection();
          }}
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}
        >
          {items.map((item) => (
            <div
              key={`bank-slot-${item.id}`}
              style={{
                width: cardWidth,
                height: cardHeight,
                boxSizing: 'border-box',
                border: item.id === selectedId ? '3px solid #dbeafe' : 'none',
                borderRadius: 20,
                background: item.id === selectedId ? '#f1f5f9' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.id === selectedId ? null : renderClockCard(item)}
            </div>
          ))}
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
    isRemoval: Boolean(part.isRemoval),
    renderer: part.renderer,
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

function InteractiveCountingPart({ part, isAnswered }) {
  const count = part.count || 0;
  const imageSrc = part.image || '';
  const [clickedIndices, setClickedIndices] = useState([]);

  const handleItemClick = (index) => {
    if (isAnswered) return;
    setClickedIndices((prev) => {
      const idx = prev.indexOf(index);
      if (idx !== -1) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', alignItems: 'flex-start' }}>
      {part.instruction ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => speakText(part.instruction)}
            style={{
              background: '#e0f2fe',
              border: 'none',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0284c7',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)',
              transition: 'transform 0.2s ease, background 0.2s ease',
            }}
            title="Read instruction out loud"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          <span style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: '700', color: '#1e293b' }}>
            {part.instruction}
          </span>
        </div>
      ) : null}

      <div 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 'clamp(12px, 3vw, 24px)', 
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
          margin: '12px 0'
        }}
      >
        {Array.from({ length: count }).map((_, index) => {
          const clickOrder = clickedIndices.indexOf(index);
          const isClicked = clickOrder !== -1;
          const displayNum = clickOrder + 1;

          return (
            <div
              key={index}
              onClick={() => handleItemClick(index)}
              style={{
                position: 'relative',
                cursor: isAnswered ? 'default' : 'pointer',
                width: 'clamp(90px, 20vw, 130px)',
                height: 'clamp(70px, 16vw, 100px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => {
                if (!isAnswered) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={part.itemLabel || 'counting item'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: isClicked ? 'drop-shadow(0 8px 16px rgba(99, 102, 241, 0.15))' : 'none',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && part.emoji) {
                      const fallbackSpan = document.createElement('span');
                      fallbackSpan.style.fontSize = '48px';
                      fallbackSpan.style.userSelect = 'none';
                      fallbackSpan.innerText = part.emoji;
                      parent.insertBefore(fallbackSpan, parent.firstChild);
                    }
                  }}
                />
              ) : part.emoji ? (
                <span style={{ fontSize: '48px', userSelect: 'none' }}>{part.emoji}</span>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 12, background: '#e2e8f0', border: '2px dashed #94a3b8' }} />
              )}

              {isClicked ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'clamp(28px, 6vw, 38px)',
                    height: 'clamp(28px, 6vw, 38px)',
                    borderRadius: '50%',
                    background: '#6366f1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    fontWeight: '900',
                    boxShadow: '0 4px 8px rgba(99, 102, 241, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                    border: '2px solid #ffffff',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {displayNum}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      
      {part.subInstruction ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button
            type="button"
            onClick={() => speakText(part.subInstruction)}
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
            }}
            title="Read question out loud"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          
          <span style={{ fontSize: 'clamp(15px, 3.8vw, 20px)', fontWeight: '700', color: '#1e293b' }}>
            {part.subInstruction}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SideBySideDisplayPart({ part }) {
  const groupA = part.groupA || { count: 0, image: '', itemLabel: '' };
  const groupB = part.groupB || { count: 0, image: '', itemLabel: '' };

  const renderGroup = (group, title) => {
    const itemWidth = group.width || part.itemWidth || '46px';
    const itemHeight = group.height || part.itemHeight || '46px';
    const itemFontSize = group.fontSize || part.itemFontSize || '32px';

    return (
      <div style={{
        flex: 1,
        minWidth: '180px',
        padding: '16px',
        borderRadius: '16px',
        border: '1.5px solid #0f172a',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 0px #0f172a'
      }}>
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </h4>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70px',
          width: '100%'
        }}>
          {Array.from({ length: group.count }).map((_, i) => (
            <div key={i} style={{ width: itemWidth, height: itemHeight, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.itemLabel || 'item'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && group.emoji) {
                      const fallbackSpan = document.createElement('span');
                      fallbackSpan.style.fontSize = itemFontSize;
                      fallbackSpan.style.userSelect = 'none';
                      fallbackSpan.innerText = group.emoji;
                      parent.insertBefore(fallbackSpan, parent.firstChild);
                    }
                  }}
                />
              ) : group.emoji ? (
                <span style={{ fontSize: itemFontSize, userSelect: 'none' }}>{group.emoji}</span>
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: '#e2e8f0', border: '1px dashed #94a3b8' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      width: '100%',
      margin: '16px 0',
      justifyContent: 'center'
    }}>
      {renderGroup(groupA, 'Group A')}
      {renderGroup(groupB, 'Group B')}
    </div>
  );
}

function InteractiveDiceMeasurementPart({ part, userAnswer, onAnswer, isAnswered }) {
  const targetLength = Number(part.targetLength ?? 6);
  
  // Dynamic Cube Customization Theme
  const [cubeColor, setCubeColor] = useState('#ef4444'); // Default Red-500
  const [strokeColor, setStrokeColor] = useState('#b91c1c'); // Red-700
  const [pipColor, setPipColor] = useState('#ffffff');

  // Placed dice array on the canvas
  const [placedDice, setPlacedDice] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Line coordinates inside the canvas
  const lineY = 50;
  const slotY = lineY + 8;
  const diceSize = 44;

  const [lineStartX, setLineStartX] = useState(60);

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const start = Math.max(20, (w - targetLength * diceSize) / 2);
      setLineStartX(start);
    }
  }, [targetLength]);

  // --- AUDIO SYNTHESIS SNAP TONE ---
  const playSnapTone = (freq = 440) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  };

  const spawnDice = (pips, clientX, clientY, e) => {
    if (isAnswered) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left - diceSize / 2;
    const y = clientY - rect.top - diceSize / 2;
    
    // Spawn a new dice in dragging mode
    const newId = 'dice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newDice = {
      id: newId,
      x,
      y,
      pips,
      slotIndex: -1
    };
    
    setPlacedDice(prev => [...prev, newDice]);
    setDraggingId(newId);
    setDragOffset({ x: diceSize / 2, y: diceSize / 2 });
    playSnapTone(350);

    // Set pointer capture to track movement correctly
    if (e && e.target && typeof e.target.setPointerCapture === 'function') {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const grabDice = (id, clientX, clientY, e) => {
    if (isAnswered) return;
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const dice = placedDice.find(d => d.id === id);
    if (dice) {
      setDraggingId(id);
      setDragOffset({
        x: clientX - rect.left - dice.x,
        y: clientY - rect.top - dice.y
      });
      // Free its slot when grabbed
      setPlacedDice(prev => prev.map(d => d.id === id ? { ...d, slotIndex: -1 } : d));
    }

    if (e && e.target && typeof e.target.setPointerCapture === 'function') {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (draggingId === null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left - dragOffset.x;
    const rawY = e.clientY - rect.top - dragOffset.y;

    // Boundary constraints
    const clampedX = Math.max(-10, Math.min(rect.width - (diceSize - 10), rawX));
    const clampedY = Math.max(-10, Math.min(rect.height - (diceSize - 10), rawY));

    // Determine occupied slots by other dice
    const occupied = placedDice
      .filter(d => d.id !== draggingId && d.slotIndex >= 0)
      .map(d => d.slotIndex);

    // Find the next empty slot index sequentially (left to right)
    let nextSlotIndex = 0;
    while (occupied.includes(nextSlotIndex)) {
      nextSlotIndex++;
    }

    const targetSlotX = lineStartX + nextSlotIndex * diceSize;
    const targetSlotY = slotY;

    // Calculate distance for magnetic snap attraction
    const diceCenterX = clampedX + diceSize / 2;
    const diceCenterY = clampedY + diceSize / 2;
    const slotCenterX = targetSlotX + diceSize / 2;
    const slotCenterY = targetSlotY + diceSize / 2;
    const dist = Math.hypot(diceCenterX - slotCenterX, diceCenterY - slotCenterY);

    let x = clampedX;
    let y = clampedY;
    let tempSlot = -1;

    // Snapping range threshold: 30 pixels
    if (dist < 30) {
      x = targetSlotX;
      y = targetSlotY;
      tempSlot = nextSlotIndex;
    }

    setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, tempSlotIndex: tempSlot } : d));
  };

  const handlePointerUp = () => {
    if (draggingId === null) return;

    const dragged = placedDice.find(d => d.id === draggingId);
    if (dragged) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // If dropped out of bounds or near bottom edge, delete it
      if (dragged.y > rect.height - 20 || dragged.y < -20 || dragged.x < -20 || dragged.x > rect.width - 20) {
        setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
        playSnapTone(250);
      } else if (dragged.tempSlotIndex !== undefined && dragged.tempSlotIndex >= 0) {
        // Confirm magnetic snap
        setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x: lineStartX + d.tempSlotIndex * diceSize, y: slotY, slotIndex: d.tempSlotIndex, tempSlotIndex: undefined } : d));
        playSnapTone(440);
      } else {
        // Place freely
        setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, slotIndex: -1, tempSlotIndex: undefined } : d));
        playSnapTone(320);
      }
    }

    setDraggingId(null);
  };

  // Color presets
  const colorPresets = [
    { primary: '#ef4444', stroke: '#b91c1c', pip: '#ffffff', label: 'Red' },
    { primary: '#3b82f6', stroke: '#1d4ed8', pip: '#ffffff', label: 'Blue' },
    { primary: '#10b981', stroke: '#047857', pip: '#ffffff', label: 'Emerald' },
    { primary: '#f59e0b', stroke: '#b45309', pip: '#fffbeb', label: 'Amber' },
    { primary: '#a78bfa', stroke: '#6d28d9', pip: '#ffffff', label: 'Purple' },
    { primary: '#1e293b', stroke: '#0f172a', pip: '#94a3b8', label: 'Slate' },
  ];

  const renderDiceSVG = (pips, size = 44) => {
    const renderPips = () => {
      switch (pips) {
        case 1: return <circle cx="30" cy="30" r="4.5" fill={pipColor} />;
        case 2: return (
          <>
            <circle cx="16" cy="16" r="4.5" fill={pipColor} />
            <circle cx="44" cy="44" r="4.5" fill={pipColor} />
          </>
        );
        case 3: return (
          <>
            <circle cx="16" cy="16" r="4.5" fill={pipColor} />
            <circle cx="30" cy="30" r="4.5" fill={pipColor} />
            <circle cx="44" cy="44" r="4.5" fill={pipColor} />
          </>
        );
        case 4: return (
          <>
            <circle cx="16" cy="16" r="4.5" fill={pipColor} />
            <circle cx="44" cy="16" r="4.5" fill={pipColor} />
            <circle cx="16" cy="44" r="4.5" fill={pipColor} />
            <circle cx="44" cy="44" r="4.5" fill={pipColor} />
          </>
        );
        case 5: return (
          <>
            <circle cx="16" cy="16" r="4.5" fill={pipColor} />
            <circle cx="44" cy="16" r="4.5" fill={pipColor} />
            <circle cx="30" cy="30" r="4.5" fill={pipColor} />
            <circle cx="16" cy="44" r="4.5" fill={pipColor} />
            <circle cx="44" cy="44" r="4.5" fill={pipColor} />
          </>
        );
        case 6: return (
          <>
            <circle cx="16" cy="16" r="4.5" fill={pipColor} />
            <circle cx="16" cy="30" r="4.5" fill={pipColor} />
            <circle cx="16" cy="44" r="4.5" fill={pipColor} />
            <circle cx="44" cy="16" r="4.5" fill={pipColor} />
            <circle cx="44" cy="30" r="4.5" fill={pipColor} />
            <circle cx="44" cy="44" r="4.5" fill={pipColor} />
          </>
        );
        default: return null;
      }
    };

    return (
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.12))', userSelect: 'none', transition: 'all 0.3s' }}>
        <rect x="2" y="5" width="54" height="52" rx="10" fill={strokeColor} />
        <rect x="2" y="2" width="54" height="50" rx="10" fill={cubeColor} stroke={strokeColor} strokeWidth="2" />
        <path d="M 6 6 Q 29 13 52 6" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
        {renderPips()}
      </svg>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '16px auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Theme selector and control bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          <span>Dynamic Cube Skins</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {colorPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => {
                setCubeColor(preset.primary);
                setStrokeColor(preset.stroke);
                setPipColor(preset.pip);
                playSnapTone(600 + idx * 50);
              }}
              style={{
                backgroundColor: preset.primary,
                borderColor: preset.stroke,
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: '2px solid',
                cursor: isAnswered ? 'default' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'transform 0.1s'
              }}
              title={preset.label}
              onMouseEnter={(e) => { if(!isAnswered) e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { if(!isAnswered) e.currentTarget.style.transform = 'scale(1)'; }}
            />
          ))}
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }} />
          <button
            type="button"
            disabled={isAnswered}
            onClick={() => {
              setPlacedDice([]);
              playSnapTone(220);
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#475569',
              cursor: isAnswered ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M16 3h5v5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 21H3v-5"/>
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Free-Drag Blue Canvas Workspace */}
      <div 
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ 
          width: '100%', 
          height: '240px',
          background: '#f0f9ff', 
          border: '1px solid #e0f2fe', 
          borderRadius: '20px', 
          position: 'relative', 
          overflow: 'hidden', 
          boxShadow: '0 4px 12px rgba(186, 230, 253, 0.15)',
          touchAction: 'none' // Disable pull-to-refresh / touch scrolling during drag
        }}
      >
        {/* Target measurement line */}
        <div style={{ 
          position: 'absolute', 
          left: `${lineStartX}px`, 
          top: `${lineY}px`, 
          width: `${targetLength * diceSize}px`, 
          height: '6px', 
          background: '#64748b', 
          borderRadius: '999px',
          transition: 'left 0.3s, width 0.3s'
        }}>
          <div style={{ position: 'absolute', top: '-5px', left: 0, width: '6px', height: '16px', background: '#64748b', borderRadius: '999px' }} />
          <div style={{ position: 'absolute', top: '-5px', right: 0, width: '6px', height: '16px', background: '#64748b', borderRadius: '999px' }} />
        </div>

        {/* Dash border empty slots (Visual Snapping Guide) */}
        {Array.from({ length: targetLength }).map((_, i) => {
          const isOccupied = placedDice.some(d => d.slotIndex === i);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${lineStartX + i * diceSize}px`,
                top: `${slotY}px`,
                width: `${diceSize}px`,
                height: `${diceSize}px`,
                border: '2px dashed #bae6fd',
                borderRadius: '8px',
                background: isOccupied ? 'transparent' : 'rgba(224, 242, 254, 0.4)',
                transition: 'background 0.2s',
                pointerEvents: 'none'
              }}
            />
          );
        })}

        {/* Render placed/floating dice */}
        {placedDice.map((dice) => {
          const isDragging = dice.id === draggingId;
          return (
            <div
              key={dice.id}
              onPointerDown={(e) => grabDice(dice.id, e.clientX, e.clientY, e)}
              style={{
                position: 'absolute',
                left: `${dice.x}px`,
                top: `${dice.y}px`,
                width: `${diceSize}px`,
                height: `${diceSize}px`,
                cursor: isAnswered ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                touchAction: 'none',
                zIndex: isDragging ? 50 : 10,
                // Add a smooth slide animation when snapping into grid or dropping freely
                transition: isDragging ? 'none' : 'left 0.12s ease-out, top 0.12s ease-out'
              }}
            >
              {renderDiceSVG(dice.pips, diceSize)}
            </div>
          );
        })}
      </div>

      {/* Storage Tray source */}
      <div style={{ 
        width: '100%', 
        background: 'rgba(241, 245, 249, 0.85)', 
        border: '1px solid rgba(226, 232, 240, 0.7)', 
        borderRadius: '16px', 
        padding: '16px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' 
      }}>
        <span style={{ 
          fontSize: '9px', 
          fontWeight: 'bold', 
          color: '#94a3b8', 
          textTransform: 'uppercase', 
          letterSpacing: '0.12em', 
          pointerEvents: 'none' 
        }}>
          Drag dice from tray to measure the line
        </span>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {[3, 6, 5, 1, 4, 2].map((pips, idx) => (
            <div
              key={idx}
              onPointerDown={(e) => {
                e.preventDefault();
                spawnDice(pips, e.clientX, e.clientY, e);
              }}
              style={{
                cursor: isAnswered ? 'default' : 'grab',
                transition: 'transform 0.2s',
                userSelect: 'none',
                touchAction: 'none'
              }}
              onMouseEnter={(e) => { if(!isAnswered) e.currentTarget.style.transform = 'scale(1.15)'; }}
              onMouseLeave={(e) => { if(!isAnswered) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {renderDiceSVG(pips, 38)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PART_RENDERERS = {
  text: TextPart,
  svg: SvgPart,
  image: ImagePart,
  input: InputPart,
  option_select: OptionSelectPart,
  choice: OptionSelectPart,
  choices: OptionSelectPart,
  pick_from_sentence: PickFromSentencePart,
  select_from_sentence: PickFromSentencePart,
  token_select: PickFromSentencePart,
  interactive_dice_measurement: InteractiveDiceMeasurementPart,
  latex: ({ part }) => {
    const isInline = part.style?.display === 'inline-block' || part.style?.display === 'inline';
    return (
      <div style={{
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
  },
  arithmeticLayout: ArithmeticLayoutPart,
  row: GroupPart,
  group: GroupPart,
  categorization: ToolCategorizationPart,
  categorizationv2: ToolCategorizationPart,
  copy_drag_drop: ToolCategorizationPart,
  drag_drop: ToolCategorizationPart,
  interactive_protractor: InteractiveProtractorPart,
  number_line: NumberLinePart,
  base_ten_blocks: BaseTenBlocksPart,
  clock: ClockPart,
  fraction_model: FractionModelPart,
  interactive_fraction_model: InteractiveFractionModelPart,
  interactive_fraction_cutter: InteractiveFractionCutterPart,
  fraction: FractionPart,
  interactive_counting: InteractiveCountingPart,
  side_by_side_display: SideBySideDisplayPart,
  interactive_svg: InteractiveSvgPart,
  hotspot_canvas: HotspotCanvasPart,
};

function InteractiveSvgPart({ part, question, userAnswer, onAnswer, isAnswered }) {
  const containerRef = useRef(null);
  const selectedIndex = typeof userAnswer === 'object'
    ? Number(userAnswer?.selectedIndex ?? userAnswer?.index)
    : Number(userAnswer);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements = containerRef.current.querySelectorAll('[data-option-index]');
    elements.forEach((el) => {
      const idx = Number(el.getAttribute('data-option-index'));
      if (idx === selectedIndex) {
        el.classList.add('interactive-hotspot-selected');
      } else {
        el.classList.remove('interactive-hotspot-selected');
      }
      
      if (isAnswered) {
        el.style.pointerEvents = 'none';
      } else {
        el.style.pointerEvents = 'auto';
      }
    });
  }, [selectedIndex, isAnswered]);

  const handleClick = (e) => {
    if (isAnswered) return;
    const target = e.target.closest('[data-option-index]');
    if (target) {
      const idx = Number(target.getAttribute('data-option-index'));
      onAnswer(idx);
      
      // Optionally speak option label on select
      if (question.options?.[idx]) {
        const option = question.options[idx];
        const label = option.label || option.text || '';
        speakText(label, question.voice || 'Puck', option.audioUrl);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={styles.interactiveSvgContainer}
      dangerouslySetInnerHTML={{ __html: part.content }}
    />
  );
}

// ─── Option B: Hotspot Canvas Overlay ─────────────────────────────────────────
// Background SVG/image with absolutely-positioned transparent click zones.
// Coordinates are percentage-based so the layout is fully responsive.
function HotspotCanvasPart({ part, question, userAnswer, onAnswer, isAnswered }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const selectedIndex = typeof userAnswer === 'object'
    ? Number(userAnswer?.selectedIndex ?? userAnswer?.index)
    : Number(userAnswer);

  const {
    backgroundSvg,
    backgroundUrl,
    canvasWidth = 360,
    canvasHeight = 300,
    hotspots = [],
  } = part;

  const handleClick = (optionIndex) => {
    if (isAnswered) return;
    onAnswer(optionIndex);
    if (question.options?.[optionIndex]) {
      const option = question.options[optionIndex];
      speakText(option.label || option.text || '', question.voice || 'Puck', option.audioUrl);
    }
  };

  return (
    <div
      className={styles.hotspotCanvasWrapper}
      style={{
        aspectRatio: `${canvasWidth} / ${canvasHeight}`,
        height: 'auto',
      }}
    >
      <div 
        className={styles.hotspotCanvasInner}
        data-hovered-index={hoveredIndex !== null ? hoveredIndex : undefined}
        data-selected-index={Number.isFinite(selectedIndex) ? selectedIndex : undefined}
      >
        {/* Background: inline SVG or <img> */}
        {backgroundSvg && (
          <div
            className={styles.hotspotBg}
            dangerouslySetInnerHTML={{ __html: backgroundSvg }}
          />
        )}
        {backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="scene" className={styles.hotspotBg} />
        )}

        {/* Transparent absolute-positioned hotspot buttons */}
        {hotspots.map((hs, i) => {
          const isSelected = selectedIndex === hs.optionIndex;
          return (
            <button
              key={i}
              aria-label={hs.label}
              disabled={isAnswered}
              onClick={() => handleClick(hs.optionIndex)}
              onMouseEnter={() => setHoveredIndex(hs.optionIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={[
                styles.hotspotZone,
                isSelected ? styles.hotspotZoneSelected : '',
              ].join(' ')}
              style={{
                left:   `${(hs.x / canvasWidth)      * 100}%`,
                top:    `${(hs.y / canvasHeight)     * 100}%`,
                width:  `${(hs.width / canvasWidth)  * 100}%`,
                height: `${(hs.height / canvasHeight) * 100}%`,
                borderRadius: hs.borderRadius || (hs.isCircle || hs.shape === 'circle' ? '50%' : undefined),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function PartRenderer({
  part,
  question,
  userAnswer,
  onAnswer,
  isAnswered,
  inGroup = false,
  showSpeaker,
  speakTextValue,
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
      showSpeaker={showSpeaker}
      speakTextValue={speakTextValue}
    />
  );
}

export { TextWithBlanks, readAnswer, writeAnswer };
