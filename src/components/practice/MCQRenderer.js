'use client';

import PartRenderer from './PartRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';

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

function responsivePx(value, minPx, fallbackMaxPx) {
  const rawValue = value ?? fallbackMaxPx;
  const numeric = typeof rawValue === 'number'
    ? rawValue
    : Number(String(rawValue).trim().replace('px', ''));

  if (!Number.isFinite(numeric)) return rawValue;
  return `clamp(${minPx}px, ${Math.max(minPx, numeric * 0.16)}vw, ${numeric}px)`;
}

function InlineMarkdown({ text }) {
  return String(text || '').split(/(\*\*[^*]+\*\*)/g).map((piece, index) => {
    const match = piece.match(/^\*\*([^*]+)\*\*$/);
    if (match) return <strong key={index}>{match[1]}</strong>;
    return <span key={index}>{piece.replace(/^#{1,4}\s*/, '')}</span>;
  });
}

function getGridClassName(question, optionLayout) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const hasMedia = options.some((option) => hasVisualContent(option));
  const labels = options.map((option, index) => cleanText(getOptionLabel(option, index)));
  const longest = Math.max(0, ...labels.map((label) => label.length));
  const hasPreferredColumns = Number(optionLayout?.columns) > 1;

  if (hasMedia) {
    return `${styles.optionsGrid} ${styles.optionsGridVisual}`;
  }

  // If any label has > 35 chars, stack them in a single column
  if (longest > 35) {
    return `${styles.optionsGrid} ${styles.optionsGridSingleColumn}`;
  }

  if (hasPreferredColumns) {
    return `${styles.optionsGrid} ${styles.optionsGridText}`;
  }

  // Short labels (e.g. <= 8 chars) and less options, use compact grid
  if (longest <= 8 && options.length <= 8) {
    return `${styles.optionsGrid} ${styles.optionsGridCompact}`;
  }

  return `${styles.optionsGrid} ${styles.optionsGridText}`;
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

function getGridStyle(optionLayout) {
  const columns = Number(optionLayout?.columns);
  if (!Number.isFinite(columns) || columns <= 1 || optionLayout?.mode === 'rows') return undefined;

  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    justifyContent: optionLayout.justify === 'center' ? 'center' : 'stretch',
  };
}

function Part({ part, inGroup = false }) {
  if (part?.type === 'svg') {
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

  if (part?.type === 'row') {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center', ...(part.style || {}) }}>
        {(part.parts || []).map((child, index) => <Part key={index} part={child} inGroup />)}
      </div>
    );
  }

  if (part?.type === 'group') {
    const direction = part.direction === 'row' ? 'row' : 'column';
    return (
      <div style={{ display: 'flex', flexDirection: direction, gap: 12, flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center', ...(part.style || {}) }}>
        {(part.parts || []).map((child, index) => <Part key={index} part={child} inGroup />)}
      </div>
    );
  }

  if (part?.type === 'latex') {
    const isInline = part.style?.display === 'inline-block' || part.style?.display === 'inline';
    return (
      <div style={{
        fontSize: 'clamp(20px, 5vw, 24px)',
        color: '#0f172a',
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

  return (
    <div style={{ fontSize: 16, fontWeight: 400, textAlign: 'left', color: '#334155', width: '100%', ...(part?.style || {}) }}>
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
  const hasMedia = (question.options || []).some((option) => hasVisualContent(option));
  const gridClassName = getGridClassName(question, optionLayout);
  const gridStyle = getGridStyle(optionLayout);

  const firstPartText = (question.parts?.[0]?.content || question.parts?.[0]?.text || '').trim();
  const hideHeader = question.questionText && firstPartText === question.questionText.trim();

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {question.questionText && !hideHeader ? (
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.28, fontWeight: 600 }}>
          <InlineMarkdown text={question.questionText} />
        </h2>
      ) : null}

      {Array.isArray(question.parts) && question.parts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
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

      <div className={gridClassName} style={gridStyle} data-option-layout={optionLayout.mode}>
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
              className={`${styles.optionButton} ${selected ? styles.optionButtonActive : ''}`}
              style={{
                minHeight: hasMedia ? (optionLayout.buttonMinHeight || 150) : undefined,
                ...(optionLayout.mode === 'compact' ? { borderRadius: 4, minHeight: 44 } : {}),
              }}
            >
              {content && isSvgString(content) ? (
                <div
                  className={styles.optionMedia}
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
                  className={styles.optionMedia}
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
                <div style={{ fontSize: 'clamp(14px, 3.8vw, 17px)', fontWeight: 'inherit', lineHeight: 1.35 }}>
                  {option?.type === 'latex' ? (
                    <KaTeXRenderer math={getOptionLabel(option, index)} />
                  ) : (
                    <InlineMarkdown text={getOptionLabel(option, index)} />
                  )}
                </div>
              ) : null}
              {isImageOption && getOptionLabel(option, index) ? (
                <div style={{ fontSize: 'clamp(12px, 3.4vw, 14px)', fontWeight: 500, lineHeight: 1.25, color: '#334155' }}>
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
