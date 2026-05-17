'use client';

import PartRenderer from './PartRenderer';

function getOptionLabel(option, index) {
  if (typeof option === 'string' || typeof option === 'number') return String(option);
  return option?.label || option?.text || option?.value || option?.content || `Option ${index + 1}`;
}

function isSvgString(value) {
  return typeof value === 'string' && value.trim().startsWith('<svg');
}

function isImageUrl(value) {
  return typeof value === 'string' && /^(https?:\/\/|\/|data:image\/)/.test(value.trim());
}

function getOptionContent(option) {
  if (isSvgString(option)) return option;
  if (isImageUrl(option)) return option;
  if (typeof option === 'string' || typeof option === 'number') return null;
  return option?.content || option?.svg || option?.imageUrl || option?.src || null;
}

function hasSvgContent(option) {
  return isSvgString(option) || isSvgString(getOptionContent(option));
}

function hasVisualContent(option) {
  const content = getOptionContent(option);
  return isSvgString(content) || isImageUrl(content);
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

function getOptionLayout(question) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const hasMedia = options.some((option) => hasVisualContent(option));
  const labels = options.map((option, index) => cleanText(getOptionLabel(option, index)));
  const longest = Math.max(0, ...labels.map((label) => label.length));

  if (question?.layoutConfig?.variant === 'pictureSentence') {
    return {
      mode: 'pictureSentence',
      columns: question?.layoutConfig?.columns || 2,
      justify: 'start',
      buttonMinHeight: 76,
      buttonPadding: '16px 28px',
      buttonWidth: 'minmax(210px, 270px)',
      fontSize: 30,
    };
  }

  if (hasMedia) {
    const mediaConfig = question?.layoutConfig?.optionMedia || {};
    return {
      mode: 'media',
      columns: question?.layoutConfig?.columns || (options.length <= 2 ? 2 : 3),
      justify: 'stretch',
      buttonMinHeight: mediaConfig.cardMinHeight || 150,
      buttonPadding: mediaConfig.cardPadding || 16,
      buttonWidth: 'auto',
      fontSize: 15,
      mediaWidth: mediaConfig.width || '100%',
      mediaMaxWidth: mediaConfig.maxWidth || 360,
      mediaMinHeight: mediaConfig.minHeight || 0,
      mediaMarginBottom: mediaConfig.marginBottom ?? 10,
    };
  }

  if (longest <= 12 && options.length <= 7) {
    return {
      mode: 'compact',
      columns: options.length <= 4 ? options.length : 4,
      justify: 'center',
      buttonMinHeight: 58,
      buttonPadding: '14px 22px',
      buttonWidth: 'minmax(min(128px, 100%), 168px)',
      fontSize: 17,
    };
  }

  if (longest <= 24 && options.length <= 6) {
    return {
      mode: 'grid',
      columns: options.length <= 3 ? options.length : 2,
      justify: 'stretch',
      buttonMinHeight: 72,
      buttonPadding: '16px 20px',
      buttonWidth: 'minmax(180px, 1fr)',
      fontSize: 16,
    };
  }

  return {
    mode: 'rows',
    columns: 1,
    justify: 'stretch',
    buttonMinHeight: 64,
    buttonPadding: '16px 20px',
    buttonWidth: 'minmax(0, 1fr)',
    fontSize: 15,
  };
}

function Part({ part, inGroup = false }) {
  if (part?.type === 'svg') {
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

  if (part?.type === 'image') {
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

  if (part?.type === 'row') {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', ...(part.style || {}) }}>
        {(part.parts || []).map((child, index) => <Part key={index} part={child} inGroup />)}
      </div>
    );
  }

  if (part?.type === 'group') {
    const direction = part.direction === 'row' ? 'row' : 'column';
    return (
      <div style={{ display: 'flex', flexDirection: direction, gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', ...(part.style || {}) }}>
        {(part.parts || []).map((child, index) => <Part key={index} part={child} inGroup />)}
      </div>
    );
  }

  if (part?.type === 'latex') {
    return (
      <div style={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: 24, fontWeight: 800, color: '#0f172a', ...(part.style || {}) }}>
        {cleanText(part.content || '')}
      </div>
    );
  }

  return (
    <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', color: '#334155', ...(part?.style || {}) }}>
      <InlineMarkdown text={part?.content || part?.text || ''} />
    </div>
  );
}

export default function MCQRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const selectedIndex = typeof userAnswer === 'object'
    ? Number(userAnswer?.selectedIndex ?? userAnswer?.index)
    : Number(userAnswer);
  const optionLayout = getOptionLayout(question);
  const optionsGridStyle = optionLayout.mode === 'compact'
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${optionLayout.columns}, ${optionLayout.buttonWidth})`,
        justifyContent: optionLayout.justify,
        gap: 12,
      }
    : {
        display: 'grid',
        gridTemplateColumns: `repeat(${optionLayout.columns}, ${optionLayout.buttonWidth})`,
        justifyContent: optionLayout.justify,
        gap: optionLayout.mode === 'media' ? 16 : 12,
      };

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {question.questionText ? (
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: 28, lineHeight: 1.25, fontWeight: 900 }}>
          <InlineMarkdown text={question.questionText} />
        </h2>
      ) : null}

      {Array.isArray(question.parts) && question.parts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {question.parts.map((part, index) => (
            <PartRenderer
              key={index}
              part={part}
              question={question}
              userAnswer={userAnswer}
              onAnswer={onAnswer}
              isAnswered={isAnswered}
            />
          ))}
        </div>
      ) : null}

      <div
        data-option-layout={optionLayout.mode}
        style={optionsGridStyle}
      >
        {(question.options || []).map((option, index) => {
          const selected = Number.isFinite(selectedIndex) && selectedIndex === index;
          const content = getOptionContent(option);
          const isSvgOption = hasSvgContent(option);
          const isImageOption = isImageUrl(content);

          return (
            <button
              key={option?.id || index}
              type="button"
              disabled={isAnswered}
              onClick={() => onAnswer(index)}
              style={{
                minHeight: optionLayout.buttonMinHeight,
                padding: optionLayout.buttonPadding,
                borderRadius: optionLayout.mode === 'compact' || optionLayout.mode === 'pictureSentence' ? 4 : 18,
                border: `2px solid ${selected ? '#0ea5e9' : '#dbeafe'}`,
                background: selected ? '#eff6ff' : '#ffffff',
                color: '#0f172a',
                cursor: isAnswered ? 'default' : 'pointer',
                boxShadow: selected ? '0 12px 24px rgba(14, 165, 233, 0.14)' : '0 8px 20px rgba(15, 23, 42, 0.05)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
              }}
            >
              {content && isSvgString(content) ? (
                <div
                  aria-hidden="true"
                  style={{
                    width: optionLayout.mediaWidth || '100%',
                    maxWidth: optionLayout.mediaMaxWidth || 360,
                    minHeight: optionLayout.mediaMinHeight || 0,
                    marginBottom: optionLayout.mediaMarginBottom ?? 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : null}
              {content && isImageOption ? (
                <div
                  aria-hidden="true"
                  style={{
                    width: optionLayout.mediaWidth || '100%',
                    maxWidth: optionLayout.mediaMaxWidth || 360,
                    minHeight: optionLayout.mediaMinHeight || 0,
                    marginBottom: optionLayout.mediaMarginBottom ?? 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                    <img
                      src={content}
                      alt=""
                      style={{
                        width: '100%',
                        maxWidth: optionLayout.mediaMaxWidth || 260,
                        maxHeight: 220,
                        objectFit: 'contain',
                        borderRadius: 14,
                      }}
                    />
                </div>
              ) : null}
              {!isSvgOption && !isImageOption ? (
                <div style={{ fontSize: optionLayout.fontSize, fontWeight: optionLayout.mode === 'pictureSentence' ? 500 : 850, lineHeight: 1.35 }}>
                  <InlineMarkdown text={getOptionLabel(option, index)} />
                </div>
              ) : null}
              {isImageOption && getOptionLabel(option, index) ? (
                <div style={{ fontSize: 14, fontWeight: 850, lineHeight: 1.25, color: '#334155' }}>
                  <InlineMarkdown text={getOptionLabel(option, index)} />
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
