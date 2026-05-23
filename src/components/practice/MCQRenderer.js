'use client';

import PartRenderer from './PartRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';
import { speakText, getQuestionSpeechText } from '@/lib/ttsClient';


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
  return option?.content || option?.svg || option?.imageUrl || option?.image || option?.src || null;
}

function hasSvgContent(option) {
  return isSvgString(option) || isSvgString(getOptionContent(option));
}

function hasVisualContent(option) {
  if (option && option.emoji) return true;
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

  const speechText = getQuestionSpeechText(question);
  const firstPartText = (question.parts?.[0]?.content || question.parts?.[0]?.text || '').trim();
  const hideHeader = question.questionText && firstPartText === question.questionText.trim();
  const showHeaderSpeaker = question.questionText && !hideHeader;
  const showInlineSpeaker = !showHeaderSpeaker;

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {question.questionText && !hideHeader ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            title="Read question out loud"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.28, fontWeight: 600 }}>
            <InlineMarkdown text={question.questionText} />
          </h2>
        </div>
      ) : null}

      {Array.isArray(question.parts) && question.parts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          {question.parts.map((part, index) => {
            const isFirstTextPart = index === 0 && (part.type === 'text' || !part.type);
            return (
              <PartRenderer
                key={index}
                part={part}
                question={question}
                userAnswer={userAnswer}
                onAnswer={onAnswer}
                isAnswered={isAnswered}
                showSpeaker={showInlineSpeaker && isFirstTextPart}
                speakTextValue={speechText}
              />
            );
          })}
        </div>
      ) : null}

      {question.interaction === 'interactive_svg' ? null : question.layoutConfig?.variant === 'capsule' ? (
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(8px, 2.5vw, 16px)',
            background: '#f1f5f9',
            padding: 'clamp(10px, 2vw, 14px) clamp(16px, 4vw, 32px)',
            borderRadius: '9999px',
            width: 'fit-content',
            margin: '20px auto',
            maxWidth: '100%',
            boxShadow: 'inset 0 2px 5px rgba(15, 23, 42, 0.05)',
            border: '1px solid rgba(15, 23, 42, 0.04)'
          }}
        >
          {(question.options || []).map((option, index) => {
            const selected = Number.isFinite(selectedIndex) && selectedIndex === index;
            const value = getOptionLabel(option, index);
            
            return (
              <button
                key={option?.id || index}
                type="button"
                disabled={isAnswered}
                onClick={() => {
                  onAnswer(index);
                  if (option?.audioUrl || question.metaConfig?.readOptions || question.metaConfig?.readable) {
                    speakText(value, question.voice || 'Puck', option?.audioUrl);
                  }
                }}
                style={{
                  width: 'clamp(46px, 11vw, 64px)',
                  height: 'clamp(46px, 11vw, 64px)',
                  borderRadius: '50%',
                  border: 'none',
                  background: selected 
                    ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: 'clamp(18px, 4vw, 24px)',
                  fontWeight: '900',
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: selected 
                    ? '0 0 0 4px #93c5fd, 0 8px 16px rgba(29, 78, 216, 0.3)' 
                    : '0 4px 8px rgba(37, 99, 235, 0.2)',
                  transform: selected ? 'scale(1.05)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  outline: 'none',
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      ) : (
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
                onClick={() => {
                  onAnswer(index);
                  if (option?.audioUrl || question.metaConfig?.readOptions || question.metaConfig?.readable) {
                    speakText(getOptionLabel(option, index), question.voice || 'Puck', option?.audioUrl);
                  }
                }}
                className={`${styles.optionButton} ${selected ? styles.optionButtonActive : ''}`}
                style={{
                  position: 'relative',
                  minHeight: hasMedia ? (optionLayout.buttonMinHeight || 150) : undefined,
                  cursor: isAnswered ? 'default' : 'pointer',
                  ...(optionLayout.mode === 'compact' ? { borderRadius: 4, minHeight: 44 } : {}),
                }}
              >
                {(question.metaConfig?.readOptions || question.metaConfig?.readable) ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(getOptionLabel(option, index), question.voice || 'Puck', option?.audioUrl);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        speakText(getOptionLabel(option, index), question.voice || 'Puck', option?.audioUrl);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#f0f9ff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#0369a1',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.1)',
                      transition: 'transform 0.2s ease, background 0.2s ease',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#e0f2fe'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f0f9ff'; }}
                    title="Read option out loud"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  </span>
                ) : null}
                {content && isSvgString(content) ? (
                  <div
                    className={styles.optionMedia}
                    aria-hidden="true"
                    style={{
                      width: optionLayout.mediaWidth || '100%',
                      maxWidth: optionLayout.mediaMaxWidth || 360,
                      minHeight: optionLayout.mediaMinHeight || 0,
                      marginBottom: (option.hideLabel || question.layoutConfig?.hideOptionLabel) ? 0 : (optionLayout.mediaMarginBottom ?? 10),
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
                      width: option.width || optionLayout.mediaWidth || '100%',
                      maxWidth: option.width ? undefined : (optionLayout.mediaMaxWidth || 360),
                      minHeight: option.height || optionLayout.mediaMinHeight || 0,
                      marginBottom: (option.hideLabel || question.layoutConfig?.hideOptionLabel) ? 0 : (optionLayout.mediaMarginBottom ?? 10),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                      <img
                        src={content}
                        alt=""
                        style={{
                          width: option.width || '100%',
                          maxWidth: option.width ? undefined : (optionLayout.mediaMaxWidth || 260),
                          height: option.height || 'auto',
                          maxHeight: option.height ? undefined : 220,
                          objectFit: 'contain',
                          borderRadius: 14,
                        }}
                      />
                  </div>
                ) : null}
                {option && option.emoji && !isSvgOption && !isImageOption ? (
                  <div
                    aria-hidden="true"
                    style={{
                      width: option.width || '100%',
                      height: option.height || 'auto',
                      fontSize: option.fontSize || '64px',
                      marginBottom: (option.hideLabel || question.layoutConfig?.hideOptionLabel) ? 0 : (optionLayout.mediaMarginBottom ?? 10),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none',
                    }}
                  >
                    {option.emoji}
                  </div>
                ) : null}
                {!isSvgOption && !isImageOption && !(option && option.emoji) ? (
                  <div style={{ fontSize: 'clamp(14px, 3.8vw, 17px)', fontWeight: 'inherit', lineHeight: 1.35 }}>
                    {option?.type === 'latex' ? (
                      <KaTeXRenderer math={getOptionLabel(option, index)} />
                    ) : (
                      <InlineMarkdown text={getOptionLabel(option, index)} />
                    )}
                  </div>
                ) : null}
                {(isImageOption || (option && option.emoji)) && getOptionLabel(option, index) && !option.hideLabel && !question.layoutConfig?.hideOptionLabel ? (
                  <div style={{ fontSize: 'clamp(12px, 3.4vw, 14px)', fontWeight: 500, lineHeight: 1.25, color: '#334155' }}>
                    <InlineMarkdown text={getOptionLabel(option, index)} />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
