'use client';

import { cloneElement, useMemo, useRef, useEffect } from 'react';
import PartRenderer from './PartRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';
import { speakText, getQuestionSpeechText } from '@/lib/ttsClient';
import { resolveToolSvg } from '@/lib/practice/svgTools';
import { parseHTMLToJSX } from '@/lib/practice/htmlParser';

/**
 * ClickToFillBridge renders a hidden <input id="ans"> that the TenFrame SVG
 * inline onclick handler can find via document.getElementById('ans').
 *
 * We use a native DOM 'input' event listener (not React onChange) because the
 * TenFrame sets input.value imperatively THEN dispatches the event, which
 * bypasses React's controlled-input tracking.
 *
 * When the value changes, we find the matching MCQ option index so that
 * isAnswerCorrect() (index-based) evaluates correctly.
 */
function ClickToFillBridge({ question, onAnswer }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const handleInput = (event) => {
      const val = event.target.value;
      const opts = Array.isArray(question.options) ? question.options : [];
      const matchedIdx = opts.findIndex(
        (opt, i) => String(getOptionLabel(opt, i)).trim() === String(val).trim()
      );
      onAnswer(matchedIdx >= 0 ? matchedIdx : val);
    };

    el.addEventListener('input', handleInput);
    return () => el.removeEventListener('input', handleInput);
  }, [question.options, onAnswer]);

  return <input ref={inputRef} id="ans" type="text" style={{ display: 'none' }} />;
}

function getOptionLabel(option, index) {
  if (typeof option === 'string' || typeof option === 'number') return String(option);
  if (option?.label !== undefined && option?.label !== null && option?.label !== '') return String(option.label);
  if (option?.text !== undefined && option?.text !== null && option?.text !== '') return String(option.text);
  if (option?.value !== undefined && option?.value !== null && option?.value !== '') return String(option.value);
  if (option?.content !== undefined && option?.content !== null && option?.content !== '') return String(option.content);
  return `Option ${index + 1}`;
}

function isSvgString(value) {
  return typeof value === 'string' && value.includes('<svg');
}

function isImageUrl(value) {
  return typeof value === 'string' && /^(https?:\/\/|\/|data:image\/)/.test(value.trim());
}

function getOptionContent(option) {
  if (isSvgString(option)) return option;
  if (isImageUrl(option)) return option;
  if (typeof option === 'string' || typeof option === 'number') return null;
  const labelVal = option?.label || option?.text || option?.value || '';
  if (isSvgString(labelVal)) return labelVal;
  if (isImageUrl(labelVal)) return labelVal;
  return resolveToolSvg(option) || option?.content || option?.svg || option?.imageUrl || option?.image || option?.src || null;
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

function InlineMarkdown({ text, userAnswerLabel, userAnswerLabels }) {
  const sanitizedText = String(text || '').replace(/\$\$(.*?)\$\$/g, (match, p1) => `$${p1}$`);
  const normalizedText = sanitizedText
    .replace(/\\n/g, '\n')
    .replace(/\/n/g, '\n');
  
  // Normalize answer labels into an array if available
  const answersArray = Array.isArray(userAnswerLabels)
    ? userAnswerLabels.map(s => String(s || '').trim()).filter(Boolean)
    : (userAnswerLabel ? [String(userAnswerLabel).trim()] : []);

  let globalBlankIndex = 0;

  const parseMathAndText = (str, keyPrefix) => {
    const subSegments = str.split(/(\$[^\$]+\$)/g);
    return subSegments.flatMap((subPiece, subIndex) => {
      const mathMatch = subPiece.match(/^\$([^\$]+)\$/);
      if (mathMatch) {
        return [<KaTeXRenderer key={`${keyPrefix}-${subIndex}`} math={mathMatch[1]} displayMode={false} />];
      }
      
      // Match blank placeholders: '_', '__', '___', '[]', '[[blank1]]', '{{blank}}'
      const blankSegments = subPiece.split(/(_+|\[\]|\[\[blank\d*\]\]|\{\{blank\}\})/g);
      return blankSegments.map((segment, segIdx) => {
        if (/^(_+|\[\]|\[\[blank\d*\]\]|\{\{blank\}\})$/.test(segment)) {
          const currentBlankIdx = globalBlankIndex++;
          const filledVal = answersArray[currentBlankIdx];

          if (filledVal) {
            return (
              <span key={`${keyPrefix}-${subIndex}-${segIdx}`} className={styles.blankFilled}>
                {filledVal}
              </span>
            );
          } else {
            return (
              <span key={`${keyPrefix}-${subIndex}-${segIdx}`} className={styles.blankEmpty}>
                &nbsp;&nbsp;&nbsp;&nbsp;
              </span>
            );
          }
        }
        
        if (segment.includes('/api/tts') || segment.includes('.mp3') || segment.includes('.wav')) {
          const audioUrlMatch = segment.match(/(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/i);
          if (audioUrlMatch) {
            const audioUrl = audioUrlMatch[0];
            const parts = segment.split(audioUrl);
            return (
              <span key={`${keyPrefix}-${subIndex}-${segIdx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', verticalAlign: 'middle', margin: '4px 0' }}>
                {parts[0] && <span>{parseHTMLToJSX(parts[0].replace(/^#{1,4}\s*/, ''))}</span>}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      speakText(audioUrl, 'Puck', audioUrl);
                    } catch (err) {
                      new Audio(audioUrl).play().catch(e => console.error(e));
                    }
                  }}
                  className="speech-btn-pulse"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  🔊 Listen Sound
                </button>
                {parts[1] && <span>{parseHTMLToJSX(parts[1].replace(/^#{1,4}\s*/, ''))}</span>}
              </span>
            );
          }
        }
        
        if (segment.includes('<svg')) {
          const svgParts = segment.split(/(<svg[\s\S]*?<\/svg>)/g);
          return (
            <span key={`${keyPrefix}-${subIndex}-${segIdx}`}>
              {svgParts.map((svgPart, pIdx) => {
                if (svgPart.trim().startsWith('<svg') && svgPart.trim().endsWith('</svg>')) {
                  return (
                    <span
                      key={pIdx}
                      dangerouslySetInnerHTML={{ __html: svgPart }}
                      style={{ display: 'inline-block', verticalAlign: 'middle' }}
                    />
                  );
                }
                return <span key={pIdx}>{parseHTMLToJSX(svgPart.replace(/^#{1,4}\s*/, ''))}</span>;
              })}
            </span>
          );
        }
        return <span key={`${keyPrefix}-${subIndex}-${segIdx}`}>{parseHTMLToJSX(segment.replace(/^#{1,4}\s*/, ''))}</span>;
      });
    });
  };

  // Regex to detect inline images: ![alt](url) or [img:url] or ![alt]{{url}}
  const imageRegex = /(!\[\s*[^\]]*\s*\]\(\s*[^)\s]+\s*\)|!\[\s*[^\]]*\s*\]\{\{\s*[^}\s]+\s*\}\}|\[img:[^\]]+\]|\*\*[^*]+\*\*)/g;

  return (
    <span style={{ whiteSpace: 'pre-line' }}>
      {normalizedText.split(imageRegex).map((piece, index) => {
        const match = piece.match(/^\*\*([^*]+)\*\*$/);
        if (match) {
          return <strong key={index}>{parseMathAndText(match[1], `bold-${index}`)}</strong>;
        }
        
        const imgMatch = piece.match(/^\[img:([^\]]+)\]$/);
        if (imgMatch) {
          return (
            <img
              key={index}
              src={imgMatch[1]}
              alt="target word"
              style={{
                display: 'inline-block',
                maxHeight: '160px',
                verticalAlign: 'middle',
                margin: '8px 6px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          );
        }

        const mdImgMatch = piece.match(/^!\[\s*([^\]]*)\s*\]\(\s*([^)\s]+)\s*\)$/) || piece.match(/^!\[\s*([^\]]*)\s*\]\{\{\s*([^}\s]+)\s*\}\}$/);
        if (mdImgMatch) {
          return (
            <img
              key={index}
              src={mdImgMatch[2]}
              alt={mdImgMatch[1] || "inline image"}
              style={{
                display: 'inline-block',
                maxHeight: '160px',
                verticalAlign: 'middle',
                margin: '8px 6px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          );
        }
        
        return (
          <span key={index}>
            {parseMathAndText(piece, `text-${index}`)}
          </span>
        );
      })}
    </span>
  );
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
      buttonMinHeight: mediaConfig.cardMinHeight || 110,
      buttonPadding: mediaConfig.cardPadding || 12,
      buttonWidth: 'auto',
      fontSize: 15,
      mediaWidth: mediaConfig.width || '100%',
      mediaMaxWidth: mediaConfig.maxWidth || 210,
      mediaMinHeight: mediaConfig.minHeight || 0,
      mediaMarginBottom: mediaConfig.marginBottom ?? 6,
    };
  }

  if (longest <= 12 && options.length <= 7) {
    return {
      mode: 'compact',
      columns: question?.layoutConfig?.columns || (options.length <= 4 ? options.length : 4),
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
    const svgContent = resolveToolSvg(part) || part.content || part.svg || '';
    const widthMatch = svgContent.match(/<svg[^>]*\bwidth=["']?(\d+)(px|%)?/i);
    const nativeWidth = widthMatch && widthMatch[2] !== '%' ? parseInt(widthMatch[1], 10) : null;
    const style = part.style || {};
    const resolvedMaxWidth = style.maxWidth || (nativeWidth && nativeWidth < 500 ? `${nativeWidth}px` : '100%');

    return (
      <div
        className={styles.responsiveSvg}
        style={{
          width: inGroup ? 'auto' : '100%',
          maxWidth: resolvedMaxWidth,
          flex: inGroup ? '0 0 auto' : 'initial',
          display: 'flex',
          justifyContent: 'flex-start',
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  if (part?.type === 'image') {
    const isTransparent = (part.imageUrl || part.src || part.content || '').match(/\.(png|svg|webp)($|\?)/i);
    return (
      <div
        style={{
          width: inGroup ? 'auto' : '100%',
          maxWidth: inGroup ? 220 : 460,
          flex: inGroup ? '0 0 auto' : 'initial',
          display: 'flex',
          justifyContent: inGroup ? 'flex-start' : 'center',
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
            borderRadius: (isTransparent || part.transparent) ? undefined : 18,
            boxShadow: (isTransparent || part.transparent || part.isTransparent) ? 'none' : '0 16px 36px rgba(15, 23, 42, 0.12)',
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

// ── Pictograph Table Option ──────────────────────────────────────────────────
function PictographTableOption({ option, index, selected, isAnswered, onSelect }) {
  const rows = option?.pictograph?.rows || [];
  return (
    <button
      type="button"
      disabled={isAnswered}
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: 0,
        border: `3px solid ${selected ? '#38a5e8' : '#cbd5e1'}`,
        borderRadius: 16,
        background: selected ? '#f0f9ff' : '#ffffff',
        cursor: isAnswered ? 'default' : 'pointer',
        boxShadow: selected
          ? '0 0 0 4px rgba(56, 165, 232, 0.18), 0 4px 16px rgba(15, 23, 42, 0.08)'
          : '0 2px 8px rgba(15, 23, 42, 0.08)',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, background 160ms ease',
        minWidth: 140,
        maxWidth: 220,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Option label header */}
      <div style={{
        background: selected ? '#e0f2fe' : '#f1f5f9',
        padding: '6px 12px',
        borderBottom: `2px solid ${selected ? '#bae6fd' : '#e2e8f0'}`,
        fontSize: 13,
        fontWeight: 700,
        color: selected ? '#0369a1' : '#64748b',
        textAlign: 'center',
        letterSpacing: '0.04em',
        transition: 'background 160ms ease, color 160ms ease',
      }}>
        Option {index + 1}
      </div>

      {/* Rows: emoji col + count col */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Fruit</th>
            <th style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? 'transparent' : 'rgba(241,245,249,0.7)' }}>
              <td style={{ padding: '6px 10px', fontSize: 22, lineHeight: 1 }}>{row.emoji}</td>
              <td style={{ padding: '6px 10px', fontSize: 17, fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Selected tick */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: 6, right: 8,
          width: 22, height: 22,
          borderRadius: '50%',
          background: '#38a5e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          fontSize: 13,
          fontWeight: 900,
          boxShadow: '0 2px 6px rgba(56,165,232,0.35)',
        }}>
          ✓
        </div>
      )}
    </button>
  );
}

export default function MCQRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
  onSubmit,
}) {
  const routeSearch = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
  const isPreK = useMemo(() => {
    const getSafeString = (val) => {
      if (!val) return '';
      if (typeof val === 'object' && val !== null) {
        return String(val.id || val.name || val.slug || val.title || '');
      }
      return String(val);
    };
    const topic = getSafeString(question?.metadata?.topic || question?.topic).toLowerCase();
    const grade = getSafeString(question?.metadata?.grade || question?.grade || question?.metadata?.estimatedGrade || question?.estimatedGrade).toLowerCase();
    const skillId = getSafeString(question?.metadata?.skillId || question?.skillId).toLowerCase();
    const checkPreK = (s) => (
      s.includes('lkg') || s.includes('prek') || s.includes('ukg') || s.includes('pre-k') ||
      s.includes('letter-identification') || s.includes('letter-recognition') ||
      s.includes('rhyming') || s.includes('phonics') || s.includes('kindergarten') ||
      s.includes('short-vowel') || s.includes('cvc')
    );
    return checkPreK(topic) || checkPreK(grade) || checkPreK(skillId) || checkPreK(routeSearch);
  }, [question, routeSearch]);

  const isMultiSelect = question.interaction === 'multi_select' || question.multiSelect === true ||
    question.optionsType === 'msq' ||
    (typeof question.interaction === 'object'
      ? (question.interaction?.engine === 'msq' || question.interaction?.inputMode === 'multi-choice')
      : (question.interaction === 'msq' || question.interaction === 'multi-choice'));

  const isTapToFill = question.type === 'tap_to_fill' ||
    question.interaction === 'tap_to_fill' ||
    question.optionsType === 'tap_to_fill' ||
    (typeof question.interaction === 'object'
      ? (question.interaction?.engine === 'tap_to_fill' || question.interaction?.type === 'tap_to_fill')
      : (question.interaction === 'tap_to_fill'));

  const shouldAutoSubmit = Boolean(
    question?.metadata?.clickToSubmit ||
    question?.layoutConfig?.clickToSubmit ||
    question?.metadata?.autoSubmit ||
    question?.layoutConfig?.autoSubmit
  );
  const displayOptions = useMemo(() => {
    const rawOptions = Array.isArray(question?.options) ? [...question.options] : [];
    
    // Check if options have A/B/C/D letter prefixes
    const hasAlphaPrefixes = rawOptions.length > 0 && rawOptions.every(opt => {
      const label = String(typeof opt === 'object' && opt !== null ? (opt.label || opt.text || opt.value || '') : opt).trim();
      return /^\(?[A-Da-d]\)?[\.\s)]/.test(label);
    });

    if (hasAlphaPrefixes) {
      return rawOptions.sort((a, b) => {
        const labelA = String(typeof a === 'object' && a !== null ? (a.label || a.text || a.value || '') : a).trim();
        const labelB = String(typeof b === 'object' && b !== null ? (b.label || b.text || b.value || '') : b).trim();
        return labelA.localeCompare(labelB);
      });
    }

    return rawOptions;
  }, [question?.options]);

  const selectedIndices = useMemo(() => {
    if (!isMultiSelect && !isTapToFill) return [];
    if (Array.isArray(userAnswer)) {
      return userAnswer.map(item => typeof item === 'object' ? Number(item?.selectedIndex ?? item?.index) : Number(item)).filter(Number.isFinite);
    } else if (userAnswer && typeof userAnswer === 'object') {
      if ('selectedIndex' in userAnswer || 'index' in userAnswer) {
        const val = Number(userAnswer.selectedIndex ?? userAnswer.index);
        return Number.isFinite(val) ? [val] : [];
      }
      return Object.entries(userAnswer)
        .filter(([_, val]) => Boolean(val))
        .map(([key]) => Number(key));
    } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
      const val = Number(userAnswer);
      return Number.isFinite(val) ? [val] : [];
    }
    return [];
  }, [userAnswer, isMultiSelect, isTapToFill]);

  const selectedIndex = useMemo(() => {
    if (userAnswer === null || userAnswer === undefined || userAnswer === '') return -1;
    if (Array.isArray(userAnswer)) {
      if (userAnswer.length === 0) return -1;
      const first = userAnswer[0];
      return typeof first === 'object' ? Number(first?.selectedIndex ?? first?.index ?? -1) : Number(first);
    }
    if (typeof userAnswer === 'object' && userAnswer !== null) {
      return Number(userAnswer.selectedIndex ?? userAnswer.index ?? -1);
    }
    return Number(userAnswer);
  }, [userAnswer]);

  const selectedOptionLabel = useMemo(() => {
    if (Number.isFinite(selectedIndex) && Array.isArray(question.options) && selectedIndex >= 0 && selectedIndex < question.options.length) {
      return getOptionLabel(question.options[selectedIndex], selectedIndex);
    }
    if (typeof userAnswer === 'string' && userAnswer.trim() !== '') {
      return userAnswer.trim();
    }
    return null;
  }, [selectedIndex, question.options, userAnswer]);

  const selectedOptionLabels = useMemo(() => {
    if (Array.isArray(userAnswer)) {
      return userAnswer.map(item => {
        const idx = typeof item === 'object' ? Number(item?.selectedIndex ?? item?.index) : Number(item);
        if (Number.isFinite(idx) && Array.isArray(question.options) && idx >= 0 && idx < question.options.length) {
          return getOptionLabel(question.options[idx], idx);
        }
        return String(item || '');
      }).filter(Boolean);
    }
    if (selectedOptionLabel) {
      return [selectedOptionLabel];
    }
    return [];
  }, [userAnswer, selectedOptionLabel, question.options]);

  const handleSelectOptionIndex = (index) => {
    if (isMultiSelect) {
      const nextSelected = selectedIndices.includes(index)
        ? selectedIndices.filter((i) => i !== index)
        : [...selectedIndices, index].sort((a, b) => a - b);
      onAnswer(nextSelected);
    } else if (isTapToFill) {
      const fullText = (question.questionText || '') + ' ' + (question.parts || []).map(p => p.content || p.text || '').join(' ');
      const blanksCount = (fullText.match(/(_+|\[\]|\[\[blank\d*\]\]|\{\{blank\}\})/g) || []).length || 1;

      if (blanksCount <= 1) {
        onAnswer(index);
        if (shouldAutoSubmit && onSubmit) {
          onSubmit(index);
        }
      } else {
        let currentArr = Array.isArray(userAnswer)
          ? [...userAnswer]
          : (userAnswer !== null && userAnswer !== undefined && userAnswer !== '' ? [userAnswer] : []);
        
        const nextSelected = [...currentArr, index];
        onAnswer(nextSelected);

        if (nextSelected.length >= blanksCount && onSubmit) {
          onSubmit(nextSelected);
        }
      }
    } else {
      onAnswer(index);
      if (shouldAutoSubmit && onSubmit) {
        onSubmit(index);
      }
    }
  };
  const optionLayout = getOptionLayout(question);
  const hasMedia = (question.options || []).some((option) => hasVisualContent(option));
  const gridClassName = getGridClassName(question, optionLayout);
  const gridStyle = getGridStyle(optionLayout);
  const isVisualAnswerSplit = !isPreK && question?.layoutConfig?.workspace === 'visual_answer_split';
  const useNumberButtons = question?.layoutConfig?.variant === 'numbers' || question?.numberOptions === true;

  const speechText = getQuestionSpeechText(question);
  const firstPartText = (question.parts?.[0]?.content || question.parts?.[0]?.text || '').trim();
  const combinedPartsText = (question.parts || [])
    .filter(part => part.type === 'text' || !part.type)
    .map(part => (part.content || part.text || '').trim())
    .filter(Boolean)
    .join(' ');
  const cleanString = (str) => String(str || '').replace(/(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/gi, '').replace(/\s+/g, ' ').trim();
  const hideHeader = question.questionText && (
    (isPreK && routeSearch.includes('theme=montessori')) ||
    cleanString(firstPartText) === cleanString(question.questionText) ||
    cleanString(combinedPartsText) === cleanString(question.questionText)
  );
  const showHeaderSpeaker = question.questionText && !hideHeader;
  const showInlineSpeaker = !showHeaderSpeaker;

  // Merge consecutive text parts for Pre-K to avoid duplicate mascot speech bubbles
  const displayParts = useMemo(() => {
    const parts = (Array.isArray(question.parts) ? question.parts : [])
      .filter(p => p?.type !== 'visual_panel');
    if (!isPreK) return parts;

    const merged = [];
    let currentTextPart = null;

    parts.forEach((part) => {
      const isText = part.type === 'text' || !part.type;
      if (isText) {
        if (!currentTextPart) {
          currentTextPart = { ...part, type: 'text' };
        } else {
          currentTextPart.content = ((currentTextPart.content || currentTextPart.text || '').trim() + ' ' + (part.content || part.text || '').trim()).trim();
          if (part.showSpeaker) currentTextPart.showSpeaker = true;
          currentTextPart.style = { ...(currentTextPart.style || {}), ...(part.style || {}) };
        }
      } else {
        if (currentTextPart) {
          merged.push(currentTextPart);
          currentTextPart = null;
        }
        merged.push(part);
      }
    });

    if (currentTextPart) {
      merged.push(currentTextPart);
    }

    return merged;
  }, [question.parts, isPreK]);


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
        partIndex={idx}
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
        partIndex={idx}
      />
    ));
    
    let middleElements = [];
    const paragraphs = text.split(/\n\n/);
    if (paragraphs.length >= 2) {
      middleElements.push(
        <h2 key="p0" style={isPreK ? {
          margin: '0 auto',
          textAlign: 'center',
          color: '#3b0764',
          fontSize: 'clamp(22px, 5vw, 28px)',
          lineHeight: 1.85,
          fontWeight: 900,
          fontFamily: 'var(--font-outfit), sans-serif',
        } : { margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
          <InlineMarkdown text={paragraphs[0]} userAnswerLabel={selectedOptionLabel} />
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
        <h2 key="p1" style={isPreK ? {
          margin: '0 auto',
          textAlign: 'center',
          color: '#3b0764',
          fontSize: 'clamp(22px, 5vw, 28px)',
          lineHeight: 1.85,
          fontWeight: 900,
          fontFamily: 'var(--font-outfit), sans-serif',
        } : { margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
          <InlineMarkdown text={paragraphs.slice(1).join('\n\n')} userAnswerLabel={selectedOptionLabel} />
        </h2>
      );
    } else {
      const lines = text.split(/\n/);
      if (lines.length >= 2) {
        middleElements.push(
          <h2 key="l0" style={isPreK ? {
            margin: '0 auto',
            textAlign: 'center',
            color: '#3b0764',
            fontSize: 'clamp(22px, 5vw, 28px)',
            lineHeight: 1.85,
            fontWeight: 900,
            fontFamily: 'var(--font-outfit), sans-serif',
          } : { margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
            <InlineMarkdown text={lines[0]} userAnswerLabel={selectedOptionLabel} />
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
          <h2 key="l1" style={isPreK ? {
            margin: '0 auto',
            textAlign: 'center',
            color: '#3b0764',
            fontSize: 'clamp(22px, 5vw, 28px)',
            lineHeight: 1.85,
            fontWeight: 900,
            fontFamily: 'var(--font-outfit), sans-serif',
          } : { margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
            <InlineMarkdown text={lines.slice(1).join('\n')} userAnswerLabel={selectedOptionLabel} />
          </h2>
        );
      } else {
        middleElements.push(
          <h2 key="single" style={isPreK ? {
            margin: '0 auto',
            textAlign: 'center',
            color: '#3b0764',
            fontSize: 'clamp(22px, 5vw, 28px)',
            lineHeight: 1.85,
            fontWeight: 900,
            fontFamily: 'var(--font-outfit), sans-serif',
          } : { margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
            <InlineMarkdown text={text} userAnswerLabel={selectedOptionLabel} />
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
              title="Read question out loud"
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

  const hasVisualInterleaving = question.questionText && !hideHeader && visualParts.length > 0;

  return (
    <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPreK ? 4 : 14 }}>
      {/* Demo / Sequential Index / Static Badge */}
      {(question?.isSequential || question?.isOrdered || question?.metadata?.isSequential || question?.metadata?.isOrdered || question?.preserveOptionOrder || question?.metadata?.preserveOptionOrder || question?.shuffleOptions === false || question?.isStatic || question?.metadata?.isStatic || routeSearch.includes('mode=static') || routeSearch.includes('iit=true')) && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
          marginBottom: '6px',
          width: 'fit-content',
          fontFamily: 'monospace'
        }}>
          <span>📌 {routeSearch.includes('iit=true') || routeSearch.includes('mode=static') ? 'STATIC / IIT QN:' : 'ORDER MODE:'}</span>
          <span>
            {routeSearch.includes('mode=static') || routeSearch.includes('iit=true')
              ? `Question 1 (Static Bank)`
              : `Row Index #${((typeof question?.rowIndex === 'number' ? question.rowIndex : (typeof question?.metadata?.rowIndex === 'number' ? question.metadata.rowIndex : 0)) + 1)} (Sequential)`
            }
          </span>
          <span>• Options Ordered (A, B, C, D)</span>
        </div>
      )}
      {question.metaConfig?.hasClickToFill && (
        <ClickToFillBridge
          question={question}
          onAnswer={onAnswer}
        />
      )}
      <div
        className={isVisualAnswerSplit ? styles.mcqVisualAnswerSplit : undefined}
        style={isVisualAnswerSplit ? undefined : { display: 'contents' }}
        data-workspace-layout={isVisualAnswerSplit ? 'visual_answer_split' : undefined}
      >
        {hasVisualInterleaving ? (
          renderQuestionTextAndVisuals()
        ) : (
          <>
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
                <h2 style={isPreK ? {
                  margin: '0 auto',
                  textAlign: 'center',
                  color: '#3b0764',
                  fontSize: 'clamp(22px, 5vw, 28px)',
                  lineHeight: 1.85,
                  fontWeight: 900,
                  fontFamily: 'var(--font-outfit), sans-serif',
                } : { margin: 0, color: '#0f172a', fontSize: 'clamp(18px, 4.2vw, 24px)', lineHeight: 1.85, fontWeight: 400 }}>
                  <InlineMarkdown text={question.questionText} userAnswerLabel={selectedOptionLabel} />
                </h2>
              </div>
            ) : null}

            {Array.isArray(displayParts) && displayParts.length > 0 ? (
              <div
                className={isVisualAnswerSplit ? styles.mcqSplitVisual : undefined}
                data-workspace-region={isVisualAnswerSplit ? 'visual' : undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: isPreK ? 'center' : 'flex-start', gap: isPreK ? 4 : 12, width: '100%' }}
              >
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
                        showSpeaker={(showInlineSpeaker && isFirstTextPart) || part.showSpeaker}
                        speakTextValue={isFirstTextPart ? speechText : undefined}
                        partIndex={index}
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
                      showSpeaker={(showInlineSpeaker && isFirstTextPart) || part.showSpeaker}
                      speakTextValue={isFirstTextPart ? speechText : undefined}
                      partIndex={index}
                    />
                  );
                });
              })()}
            </div>
          ) : null}
        </>
      )}

      {question.metaConfig?.hasClickToFill ? null : question.interaction === 'pictograph_mcq' ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(16px, 3vw, 28px)',
            justifyContent: 'center',
            width: '100%',
            padding: '8px 0',
          }}
        >
          {(question.options || []).map((option, index) => {
            const selected = Number.isFinite(selectedIndex) && selectedIndex === index;
            return (
              <PictographTableOption
                key={option?.id || index}
                option={option}
                index={index}
                selected={selected}
                isAnswered={isAnswered}
                onSelect={() => {
                  onAnswer(index);
                  if (!isMultiSelect && shouldAutoSubmit && onSubmit) {
                    onSubmit(index);
                  }
                }}
              />
            );
          })}
        </div>
      ) : ['interactive_svg', 'interactive_stickers', 'hotspot_select', 'hotspot_multi_select', 'balloon_tap', 'direct_image_select', 'side_by_side_display'].includes(question.interaction) || question.directImageSelect ? null : useNumberButtons ? (
        <div
          aria-label="Number choices"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(8px, 1.8vw, 14px)',
            width: 'fit-content',
            maxWidth: 'min(100%, 680px)',
            margin: 'clamp(8px, 2vh, 18px) auto',
            padding: 'clamp(9px, 1.7vw, 14px)',
            borderRadius: 22,
            background: '#eef1f5',
            boxShadow: 'inset 0 2px 5px rgba(15, 23, 42, 0.08)',
          }}
        >
          {(question.options || []).map((option, index) => {
            const selected = isMultiSelect
              ? selectedIndices.includes(index)
              : Number.isFinite(selectedIndex) && selectedIndex === index;
            const value = getOptionLabel(option, index);

            return (
              <button
                key={option?.id || index}
                type="button"
                disabled={isAnswered}
                onClick={() => {
                  handleSelectOptionIndex(index);
                  if (isPreK || option?.audioUrl || question.metaConfig?.readOptions || question.metaConfig?.readable) {
                    speakText(value, question.voice || 'Puck', option?.audioUrl);
                  }
                }}
                style={{
                  width: 'clamp(58px, 8vw, 78px)',
                  height: 'clamp(56px, 7.5vw, 74px)',
                  flex: '0 0 auto',
                  borderRadius: 22,
                  border: selected ? '3px solid #bfdbfe' : '2px solid #1d4ed8',
                  background: selected ? '#1d4ed8' : '#3b82f6',
                  color: '#ffffff',
                  fontSize: 'clamp(24px, 4vw, 34px)',
                  lineHeight: 1,
                  fontWeight: 900,
                  cursor: isAnswered ? 'default' : 'pointer',
                  boxShadow: selected
                    ? '0 3px 0 #1e3a8a, 0 0 0 4px rgba(147, 197, 253, 0.75)'
                    : '0 5px 0 #075aa7, 0 8px 12px rgba(30, 64, 175, 0.18)',
                  transform: selected ? 'translateY(2px) scale(1.04)' : 'none',
                  transition: 'transform 150ms ease, box-shadow 150ms ease, background 150ms ease',
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      ) : question.layoutConfig?.variant === 'capsule' ? (
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
            const selected = isMultiSelect 
              ? selectedIndices.includes(index)
              : Number.isFinite(selectedIndex) && selectedIndex === index;
            const value = getOptionLabel(option, index);
            
            return (
              <button
                key={option?.id || index}
                type="button"
                disabled={isAnswered}
                onClick={() => {
                  handleSelectOptionIndex(index);
                  if (isPreK || option?.audioUrl || question.metaConfig?.readOptions || question.metaConfig?.readable) {
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
        <div
          className={`${isPreK ? styles.preKOptionsContainer : ''} ${isVisualAnswerSplit ? styles.mcqSplitOptions : ''}`.trim() || undefined}
          data-workspace-region={isVisualAnswerSplit ? 'answers' : undefined}
        >
          <div
            className={isPreK ? styles.preKOptionsGrid : gridClassName}
            style={isPreK ? (optionLayout.columns === 1 ? { gridTemplateColumns: '1fr' } : undefined) : gridStyle}
            data-option-layout={optionLayout.mode}
          >
            {question.type === 'visual_choice' ? (
              // Visual Choice Panels rendering
              visualPanels.map((panel, index) => {
                const selected = Number.isFinite(selectedIndex) && selectedIndex === index;
                const isCorrectChoice = index === question.correctAnswerIndex;
                
                let borderStyle = '3px solid #cbd5e1';
                let shadowStyle = '0 2px 8px rgba(15, 23, 42, 0.08)';
                let bgStyle = '#ffffff';

                if (selected) {
                  borderStyle = '3px solid #3b82f6';
                  shadowStyle = '0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(15, 23, 42, 0.08)';
                  bgStyle = '#eff6ff';
                }

                if (isAnswered) {
                  if (isCorrectChoice) {
                    borderStyle = '3px solid #22c55e';
                    bgStyle = '#f0fdf4';
                    shadowStyle = '0 4px 16px rgba(34, 197, 94, 0.2)';
                  } else if (selected) {
                    borderStyle = '3px solid #ef4444';
                    bgStyle = '#fef2f2';
                    shadowStyle = '0 4px 16px rgba(239, 68, 68, 0.2)';
                  }
                }

                return (
                  <button
                    key={`panel_${index}`}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => {
                      onAnswer(index);
                      if (shouldAutoSubmit && onSubmit) {
                        onSubmit(index);
                      }
                      if (isPreK || question.metaConfig?.readable) {
                        speakText(`Option ${index + 1}`, question.voice || 'Puck');
                      }
                    }}
                    className={`${styles.montessoriVisualChoicePanel} ${selected ? styles.montessoriVisualChoicePanelActive : ''}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 12,
                      border: borderStyle,
                      borderRadius: 20,
                      background: bgStyle,
                      boxShadow: shadowStyle,
                      cursor: isAnswered ? 'default' : 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      minWidth: '160px',
                      maxWidth: '260px',
                      outline: 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: panel.svg }}
                      style={{ width: '100%', display: 'block' }}
                    />
                    
                    {isAnswered && isCorrectChoice && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: '#22c55e',
                        color: '#ffffff',
                        borderRadius: 99,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 900,
                        boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)'
                      }}>
                        ✓ Correct
                      </div>
                    )}
                    {isAnswered && selected && !isCorrectChoice && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: '#ef4444',
                        color: '#ffffff',
                        borderRadius: 99,
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 900,
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                      }}>
                        ✗ Incorrect
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              // Standard MCQ Options rendering
              (displayOptions || []).map((option, index) => {
                const originalIndex = (question.options || []).indexOf(option);
                const activeIndex = originalIndex >= 0 ? originalIndex : index;
                const selected = isMultiSelect
                  ? selectedIndices.includes(activeIndex)
                  : Number.isFinite(selectedIndex) && selectedIndex === activeIndex;
                const content = getOptionContent(option);
                const isSvgOption = hasSvgContent(option);
                const isImageOption = isImageUrl(content);
   
                 return (
                  <button
                    key={option?.id || index}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => {
                      handleSelectOptionIndex(activeIndex);
                      if (isPreK || option?.audioUrl || question.metaConfig?.readOptions || question.metaConfig?.readable) {
                        speakText(getOptionLabel(option, activeIndex), question.voice || 'Puck', option?.audioUrl);
                      }
                    }}
                    className={(() => {
                      if (!isPreK) {
                        return `${styles.optionButton} ${selected ? styles.optionButtonActive : ''}`;
                      }
                      const themes = [
                        { base: styles.preKOptionYellow, active: styles.preKOptionYellowActive },
                        { base: styles.preKOptionPink, active: styles.preKOptionPinkActive },
                        { base: styles.preKOptionBlue, active: styles.preKOptionBlueActive },
                        { base: styles.preKOptionGreen, active: styles.preKOptionGreenActive },
                      ];
                      const theme = themes[index % themes.length];
                      const mediaClass = hasMedia ? styles.preKOptionButtonWithMedia : styles.preKOptionButtonTextOnly;
                      return `${styles.preKOptionButton} ${mediaClass} ${theme.base} ${selected ? `${styles.preKOptionButtonActive} ${theme.active}` : ''}`;
                    })()}
                    style={{
                      position: 'relative',
                      minHeight: hasMedia ? (optionLayout.buttonMinHeight || 150) : undefined,
                      cursor: isAnswered ? 'default' : 'pointer',
                      ...(optionLayout.mode === 'compact' ? { borderRadius: 4, minHeight: 44 } : {}),
                      ...(isPreK ? {
                        transform: selected
                          ? `scale(1.02) rotate(${index % 2 === 0 ? '-1.5deg' : '1.5deg'})`
                          : `rotate(${index % 2 === 0 ? '-1.5deg' : '1.5deg'})`,
                        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                        zIndex: selected ? 30 : 10,
                        // keeps standard column layout so label is centered below the image
                      } : {})
                    }}
                  >
                    {isPreK && isMultiSelect && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        border: '3px solid #38bdf8',
                        backgroundColor: selected ? '#38bdf8' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#ffffff',
                        fontSize: '16px',
                        fontWeight: '950',
                        flexShrink: 0,
                        boxShadow: selected ? '0 4px 10px rgba(56, 189, 248, 0.3)' : 'none',
                        transition: 'all 0.2s ease',
                        zIndex: 20
                      }}>
                        {selected ? '✓' : ''}
                      </div>
                    )}
                    {(!isPreK && (question.metaConfig?.readOptions || question.metaConfig?.readable)) ? (
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
                        marginBottom: (option.hideLabel || question.layoutConfig?.hideOptionLabel) ? 0 : (isPreK ? 4 : (optionLayout.mediaMarginBottom ?? 10)),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...(isPreK ? { flex: '1 1 auto', overflow: 'hidden' } : {}),
                      }}
                    >
                        <img
                          src={content}
                          alt=""
                          style={{
                            width: option.width || '100%',
                            maxWidth: option.width ? undefined : (optionLayout.mediaMaxWidth || 260),
                            height: option.height || 'auto',
                            maxHeight: option.height ? undefined : (isPreK ? 'clamp(90px, 14vh, 120px)' : 140),
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
                    <div 
                      style={{ 
                        fontSize: isPreK ? 'clamp(20px, 4.8vw, 26px)' : 'clamp(14px, 3.8vw, 17px)', 
                        fontWeight: isPreK ? '900' : 'inherit', 
                        lineHeight: 1.35 
                      }}
                    >
                      {option?.type === 'latex' ? (
                        <KaTeXRenderer math={getOptionLabel(option, index)} />
                      ) : (
                        <InlineMarkdown text={getOptionLabel(option, index)} />
                      )}
                    </div>
                  ) : null}
                  {(isImageOption || isSvgOption || (option && option.emoji)) && getOptionLabel(option, index) && !isImageUrl(getOptionLabel(option, index)) && !isSvgString(getOptionLabel(option, index)) && !option.hideLabel && !question.layoutConfig?.hideOptionLabel ? (
                    <div
                      className={isPreK ? styles.preKOptionLabel : undefined}
                      style={{ fontSize: isPreK ? 'clamp(14px, 2vw, 17px)' : 'clamp(12px, 3.4vw, 14px)', fontWeight: isPreK ? 900 : 500, lineHeight: 1.25, color: '#334155' }}
                    >
                      <InlineMarkdown text={getOptionLabel(option, index)} />
                    </div>
                  ) : null}
                  {selected && isPreK && !isMultiSelect && (
                    <div className={styles.preKCheckmarkBadge}>
                      ✓
                    </div>
                  )}
                </button>
              );
            }))}
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
