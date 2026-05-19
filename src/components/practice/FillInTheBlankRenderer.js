'use client';

import PartRenderer from './PartRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';

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
  const pieces = String(text || '').split(/(\*\*\[blank(?::[^\]]+)?\]\*\*|\[blank(?::[^\]]+)?\]|\*\*[^*]+\*\*)/g);

  return (
    <span>
      {pieces.map((piece, index) => {
        const match = piece.match(/^(?:\*\*)?\[blank(?::([^\]]+))?\](?:\*\*)?$/);
        if (!match) {
          const boldMatch = piece.match(/^\*\*([^*]+)\*\*$/);
          if (boldMatch) return <strong key={index}>{boldMatch[1]}</strong>;
          return <span key={index}>{piece.replace(/^#{1,4}\s*/, '')}</span>;
        }

        const blankId = match[1] || 'blank';
        return (
          <input
            key={blankId}
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

function SvgPart({ content, style, inGroup = false }) {
  return (
    <div
      className={styles.responsiveSvg}
      style={{
        width: inGroup ? 'auto' : '100%',
        maxWidth: '100%',
        flex: inGroup ? '0 0 auto' : 'initial',
        display: 'flex',
        justifyContent: 'flex-start',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

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
  if (part.type === 'svg') return <SvgPart key={index} content={part.content} style={part.style} inGroup={context.inGroup} />;
  if (part.type === 'image') {
    return (
      <div key={index} style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', ...(part.style || {}) }}>
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
  const parts = Array.isArray(question.parts) && question.parts.length
    ? question.parts
    : [{ type: 'text', content: question.questionText }];

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
      {parts.map((part, index) => (
        <PartRenderer
          key={index}
          part={part}
          question={question}
          userAnswer={userAnswer}
          onAnswer={onAnswer}
          isAnswered={isAnswered}
        />
      ))}
    </section>
  );
}
