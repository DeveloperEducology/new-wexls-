'use client';

import KaTeXRenderer from './KaTeXRenderer';

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
}) {
  if (!question) return null;

  const solutionSections = Array.isArray(question?.solution?.sections)
    ? question.solution.sections
    : [];

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
        style={{
          marginTop: 14,
          padding: '13px 18px',
          borderRadius: 14,
          border: 'none',
          background: isCorrect ? '#16a34a' : '#0f172a',
          color: '#fff',
          fontWeight: 900,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        {nextLabel}
      </button>
    </section>
  );
}
