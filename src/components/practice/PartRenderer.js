'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import CategorizationRenderer from './CategorizationRenderer';
import KaTeXRenderer from './KaTeXRenderer';
import styles from './FactoryLayout.module.css';
import { speakText } from '@/lib/ttsClient';
import { resolveToolSvg } from '@/lib/practice/svgTools';
import InteractiveToolWrapper from './InteractiveToolWrapper';
import { parseHTMLToJSX } from '@/lib/practice/htmlParser';

const getSafeString = (val) => {
  if (!val) return '';
  if (typeof val === 'object' && val !== null) {
    return String(val.id || val.name || val.slug || val.title || '');
  }
  return String(val);
};

export function SvgPart({ part, question, userAnswer, onAnswer, isAnswered, inGroup = false }) {
  if (!part) return null;
  const isDraggableTool = part.toolSvg && part.draggable === true;
  if (isDraggableTool) {
    return (
      <InteractiveToolWrapper
        toolId={part.toolSvg}
        toolProps={part.toolProps}
        userAnswer={userAnswer}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
      />
    );
  }
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
        pointerEvents: isAnswered ? 'none' : 'auto',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

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
  return String(text || '').split(/(\*\*[^*]+\*\*|\[img:[^\]]+\])/g).map((piece, index) => {
    const match = piece.match(/^\*\*([^*]+)\*\*$/);
    if (match) return <strong key={index}>{match[1]}</strong>;
    
    const imgMatch = piece.match(/^\[img:([^\]]+)\]$/);
    if (imgMatch) {
      return (
        <img
          key={index}
          src={imgMatch[1]}
          alt="target word"
          style={{
            display: 'inline-block',
            height: '1.6em',
            verticalAlign: 'middle',
            margin: '0 6px',
            borderRadius: '4px',
            objectFit: 'contain'
          }}
        />
      );
    }
    
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

function TextWithBlanks({ text, userAnswer, onAnswer, isAnswered, question }) {
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

        // Check if this is an MCQ/choice question to render the selected option as text instead of input
        const isMcq = question?.type === 'mcq' || question?.interaction === 'choice' || question?.interaction === 'option_select';
        if (isMcq) {
          const selectedIndex = (userAnswer === null || userAnswer === undefined || userAnswer === '')
            ? NaN
            : (typeof userAnswer === 'object'
                ? Number(userAnswer?.selectedIndex ?? userAnswer?.index ?? userAnswer[blankId])
                : Number(userAnswer));

          let resolvedValue = '';
          if (Number.isFinite(selectedIndex) && question.options?.[selectedIndex]) {
            const option = question.options[selectedIndex];
            resolvedValue = typeof option === 'object'
              ? option.label ?? option.text ?? option.value ?? option.content
              : option;
          } else if (userAnswer && typeof userAnswer === 'object' && userAnswer[blankId] !== undefined) {
            resolvedValue = userAnswer[blankId];
          }

          return (
            <span
              key={`${blankId}-${index}`}
              style={{
                borderBottom: '2.5px solid #3b82f6',
                color: resolvedValue ? '#2563eb' : '#94a3b8',
                padding: '0 8px',
                fontWeight: 700,
                fontSize: '1.05em',
                minWidth: '50px',
                display: 'inline-block',
                textAlign: 'center',
                margin: '0 4px',
              }}
            >
              {resolvedValue || '______'}
            </span>
          );
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
              ...(question?.metaConfig?.hasClickToFill ? { display: 'none' } : {})
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

function MarkdownTable({ text, userAnswer, onAnswer, isAnswered, question }) {
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
                <TextWithBlanks text={cell} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} question={question} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ padding: '12px 14px', borderTop: rowIndex === 0 ? 'none' : '1px solid #e5eefb', color: '#0f172a', fontSize: 18, fontWeight: 800, textAlign: 'center' }}>
                  <TextWithBlanks text={cell} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} question={question} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cleanSpeechText(value) {
  return String(value || '')
    .replace(/\[img:[^\]]+\]/g, '')
    .replace(/\[speak:([^\]]+)\]/g, ' $1')
    .replace(/\*\*/g, '')
    .replace(/^#{1,4}\s*/gm, '')
    .trim();
}

function TextPart({ part, question, userAnswer, onAnswer, isAnswered, showSpeaker, speakTextValue, partIndex }) {
  const content = part.content || part.text || '';
  const spokenRef = useRef(false);
  const shouldShowSpeaker = showSpeaker && part.showSpeaker !== false && !part.noSpeaker;

  const isPreK = useMemo(() => {
    const topic = getSafeString(question?.metadata?.topic || question?.topic).toLowerCase();
    const grade = getSafeString(question?.metadata?.grade || question?.grade).toLowerCase();
    const skillId = getSafeString(question?.metadata?.skillId || question?.skillId).toLowerCase();
    return (
      topic.includes('lkg') || topic.includes('prek') || topic.includes('ukg') ||
      grade.includes('lkg') || grade.includes('prek') || grade.includes('ukg') ||
      skillId.includes('lkg') || skillId.includes('prek') || skillId.includes('ukg')
    );
  }, [question]);

  const cleanSpokenText = useMemo(() => {
    return cleanSpeechText(speakTextValue || content);
  }, [speakTextValue, content]);

  useEffect(() => {
    if (isPreK && !isAnswered && content && !spokenRef.current && !part.noAutoplay && (partIndex === undefined || partIndex === 0)) {
      spokenRef.current = true;
      const skillId = getSafeString(question?.metadata?.skillId || question?.skillId).toLowerCase();
      const isAudioToLetterSkill = skillId === 'lkg-english-letter-recognition-audio-to-letter' ||
                                   skillId === 'lkg-english-word-recognition-same-ending-sound' ||
                                   skillId === 'lkg-english-rhyming-same-ending-single' ||
                                   skillId === 'lkg-english-rhyming-same-ending-double' ||
                                   skillId === 'lkg-english-assoc-upper-consonant-bdj' ||
                                   skillId === 'lkg-english-assoc-upper-consonant-flm' ||
                                   skillId === 'lkg-english-assoc-upper-consonant-cgh' ||
                                   skillId === 'lkg-english-assoc-upper-consonant-review' ||
                                   skillId === 'lkg-english-assoc-lower-word-begins';
      // Play instruction first
      const t = setTimeout(() => {
        speakText(cleanSpokenText, question?.voice || 'Puck', question?.audioUrl);
        // For audio-to-letter, ending-sound, and rhyming: also auto-play the sound after instruction (~2.5s delay)
        if (isAudioToLetterSkill && (question?.soundUrl || question?.soundText)) {
          const t2 = setTimeout(() => {
            speakText(question.soundText || '', question.voice || 'Kore', question.soundUrl);
          }, 2500);
          return () => clearTimeout(t2);
        }
      }, 550);
      return () => clearTimeout(t);
    }
  }, [isPreK, content, question, isAnswered, cleanSpokenText]);

  const renderSegment = (text) => {
    if (isMarkdownTable(text)) {
      return <MarkdownTable text={text} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} question={question} />;
    }
    return <TextWithBlanks text={text} userAnswer={userAnswer} onAnswer={onAnswer} isAnswered={isAnswered} question={question} />;
  };

  const pieces = useMemo(() => {
    return content.split(/(\[speak:[^\]]+\])/g);
  }, [content]);

  const textElement = (
    <div
      style={{
        fontSize: isPreK ? '22px' : responsivePx(part.style?.fontSize, 16, 22),
        fontWeight: isPreK ? 950 : (part.style?.fontWeight || 400),
        color: part.style?.color || '#334155',
        lineHeight: 1.4,
        textAlign: 'left',
        width: '100%',
        fontFamily: isPreK ? 'var(--font-outfit), sans-serif' : undefined,
        ...part.style,
      }}
    >
      {pieces.map((piece, i) => {
        const speakMatch = piece.match(/^\[speak:([^\]]+)\]$/);
        if (speakMatch) {
          const sentenceText = speakMatch[1];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => speakText(sentenceText, question?.voice || 'Kore')}
                style={{
                  background: '#e0f2fe',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
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
                title="Read sentence out loud"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
              <span style={{ fontSize: '26px', fontWeight: '950', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>
                {sentenceText}
              </span>
            </div>
          );
        }
        return <span key={i}>{renderSegment(piece)}</span>;
      })}
    </div>
  );

  if (isPreK && !part.noMascot) {
    const subject = question?.metadata?.subject || question?.subject || '';
    const mascotEmoji = subject === 'english' ? '🐻' : '🦉'; 
    const skillId = getSafeString(question?.metadata?.skillId || question?.skillId).toLowerCase();
    const isAudioToLetter = skillId === 'lkg-english-letter-recognition-audio-to-letter' ||
                            skillId === 'lkg-english-word-recognition-same-ending-sound' ||
                            skillId === 'lkg-english-assoc-upper-consonant-bdj' ||
                            skillId === 'lkg-english-assoc-upper-consonant-flm' ||
                            skillId === 'lkg-english-assoc-upper-consonant-cgh' ||
                            skillId === 'lkg-english-assoc-upper-consonant-review' ||
                            skillId === 'lkg-english-assoc-lower-word-begins';

    return (
      <div className={styles.preKMascotSection}>
        <button
          type="button"
          onClick={() => speakText(cleanSpokenText, question?.voice || 'Puck', question?.audioUrl)}
          className={styles.preKMascotAvatar}
          title="Click to listen"
        >
          <span style={{ fontSize: '48px', display: 'block', transform: 'scaleX(-1)' }}>{mascotEmoji}</span>
          <div className={styles.preKMascotSpeechTag}>Tap me! 🔊</div>
        </button>
        
        <div className={styles.preKMascotBubble}>
          <div className={styles.preKMascotBubbleTail} />
          {shouldShowSpeaker && (
            <button
              type="button"
              onClick={() => speakText(cleanSpokenText, question?.voice || 'Puck', question?.audioUrl)}
              className={styles.preKSpeakerBtnLarge}
              title="Read instruction out loud"
              aria-label="Read instruction out loud"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {textElement}
            {isAudioToLetter && (question?.soundUrl || question?.soundText) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '14px 0 4px 0', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7e22ce', letterSpacing: '0.04em', fontFamily: 'var(--font-outfit), sans-serif', opacity: 0.75 }}>
                  {skillId === 'lkg-english-word-recognition-same-ending-sound' || skillId === 'lkg-english-assoc-upper-consonant-bdj' || skillId === 'lkg-english-assoc-upper-consonant-flm' || skillId === 'lkg-english-assoc-upper-consonant-cgh' || skillId === 'lkg-english-assoc-upper-consonant-review' || skillId === 'lkg-english-assoc-lower-word-begins' ? 'Tap to hear the sound!' : 'Tap to hear the letter!'}
                </div>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className={styles.playSoundPulseRing} />
                  <button
                    type="button"
                    id="play-letter-sound-btn"
                    onClick={() => speakText(question.soundText || '', question.voice || 'Kore', question.soundUrl)}
                    className={styles.preKPlaySoundBtn}
                    aria-label="Play letter sound"
                  >
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    <span>Play Sound</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowSpeaker) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <button
          type="button"
          onClick={() => speakText(cleanSpokenText, question?.voice || 'Puck', question?.audioUrl)}
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



function ImagePart({ part, question, inGroup = false, userAnswer, onAnswer, isAnswered, partIndex }) {
  const routeSearch = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
  const questionTopic = getSafeString(question?.metadata?.topic || question?.topic).toLowerCase();
  const questionGrade = getSafeString(question?.metadata?.grade || question?.grade).toLowerCase();
  const questionSkillId = getSafeString(question?.metadata?.skillId || question?.skillId).toLowerCase();
  const isPreK = [routeSearch, questionTopic, questionGrade, questionSkillId].some((value) => (
    value.includes('lkg') ||
    value.includes('ukg') ||
    value.includes('pre-k') ||
    value.includes('prek')
  ));

  const src = part.imageUrl || part.src || part.content || null;
  if (!src) {
    return (
      <div
        style={{
          width: inGroup ? '120px' : '100%',
          height: inGroup ? '120px' : '150px',
          border: '2px dashed #cbd5e1',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 13,
          fontWeight: 600,
          background: '#f8fafc',
          margin: '10px 0'
        }}
      >
        📷 [Empty Image Part]
      </div>
    );
  }

  const isTransparent = src.match(/\.(png|svg|webp)($|\?)/i);
  const labelText = part.label || part.alt || '';
  const spokenText = labelText || question?.soundText || 'Image';
  const canPlaySound = part.playLabelSound && (spokenText || part.audioUrl);

  const isDirectSelect = question?.directImageSelect || question?.interaction === 'direct_image_select';
  const isSelected = isDirectSelect && partIndex !== undefined && userAnswer !== null && Number(userAnswer) === partIndex;

  const handleImageClick = (e) => {
    if (isDirectSelect && !isAnswered && onAnswer) {
      onAnswer(partIndex);
    } else if (canPlaySound) {
      speakText(spokenText, question?.voice || part.voice || 'Puck', part.audioUrl);
    }
  };

  const handleSpeakerClick = (e) => {
    e.stopPropagation();
    speakText(spokenText, question?.voice || part.voice || 'Puck', part.audioUrl);
  };

  const toPixelNumber = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const rawCommonImageWidth = part.commonImageWidth || question?.commonImageWidth || question?.metadata?.commonImageWidth;
  const partMaxWidth = part.maxWidth || part.style?.maxWidth;
  const commonImageWidth = isPreK
    ? Math.min(Math.max(toPixelNumber(rawCommonImageWidth), toPixelNumber(partMaxWidth), 260), 360)
    : rawCommonImageWidth;
  const isFixedWidth = !!commonImageWidth;
  const widthVal = isFixedWidth
    ? `clamp(${isPreK ? 180 : 100}px, ${isPreK ? 36 : 42}vw, ${commonImageWidth}px)`
    : (inGroup ? 'auto' : '100%');
  const maxWidthVal = partMaxWidth 
    ? (typeof partMaxWidth === 'number' ? `${partMaxWidth}px` : partMaxWidth) 
    : (isFixedWidth ? `${commonImageWidth}px` : (inGroup ? 220 : (isPreK ? 320 : 300)));

  const cardBorder = isSelected 
    ? '4px solid #22c55e' 
    : '2.5px solid #f1f5f9';
  const cardShadow = isSelected 
    ? '0 0 0 6px rgba(34, 197, 94, 0.2), 0 16px 40px rgba(34, 197, 94, 0.15)' 
    : '0 12px 28px rgba(15, 23, 42, 0.06), 0 4px 10px rgba(15, 23, 42, 0.03)';
  const cardTransform = isSelected ? 'scale(1.03)' : 'none';

  const showSpeakerOnLeft = canPlaySound && !isDirectSelect;
  const showSpeakerOnCard = canPlaySound && isDirectSelect;

  const speakerButton = (
    <button
      type="button"
      onClick={handleSpeakerClick}
      style={{
        background: '#e0f2fe',
        border: 'none',
        borderRadius: '50%',
        width: isPreK ? '40px' : '36px',
        height: isPreK ? '40px' : '36px',
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
      title="Play sound"
    >
      <svg viewBox="0 0 24 24" width={isPreK ? "20" : "18"} height={isPreK ? "20" : "18"} fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
    </button>
  );

  const imageContainer = (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: part.transparent ? 'transparent' : '#ffffff',
        borderRadius: part.transparent ? undefined : 20,
        border: part.transparent ? 'none' : cardBorder,
        boxShadow: part.transparent ? 'none' : cardShadow,
        padding: part.transparent ? '0' : '12px',
        boxSizing: 'border-box',
        aspectRatio: part.transparent ? 'auto' : '1.15 / 1',
        maxHeight: part.maxHeight ? (typeof part.maxHeight === 'number' ? `${part.maxHeight}px` : part.maxHeight) : undefined,
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <img
        src={src}
        alt={part.alt || ''}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: isTransparent ? undefined : 14,
          transition: 'transform 0.2s ease, filter 0.2s ease',
          filter: (part.transparent && isSelected)
            ? 'drop-shadow(3px 0 0 #22c55e) drop-shadow(-3px 0 0 #22c55e) drop-shadow(0 3px 0 #22c55e) drop-shadow(0 -3px 0 #22c55e) drop-shadow(0 0 12px rgba(34, 197, 94, 0.45))'
            : 'none',
        }}
        onMouseEnter={(e) => { if (canPlaySound && !isDirectSelect) e.currentTarget.style.transform = 'scale(1.04)'; }}
        onMouseLeave={(e) => { if (canPlaySound && !isDirectSelect) e.currentTarget.style.transform = 'scale(1)'; }}
      />
      {showSpeakerOnCard && (
        <div
          onClick={(e) => {
            if (isDirectSelect) {
              e.stopPropagation();
              speakText(spokenText, question?.voice || part.voice || 'Puck', part.audioUrl);
            }
          }}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#e0f2fe',
            borderRadius: '50%',
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
            color: '#0284c7',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </div>
      )}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: '#22c55e',
            color: '#ffffff',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(34,197,94,0.3)',
            zIndex: 10,
          }}
        >
          ✓
        </div>
      )}
    </div>
  );

  return (
    <div
      onClick={handleImageClick}
      style={{
        width: widthVal,
        maxWidth: maxWidthVal,
        flex: isFixedWidth ? `0 1 ${commonImageWidth}px` : (inGroup ? '0 0 auto' : 'initial'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isPreK ? 'flex-start' : 'center',
        cursor: (isDirectSelect && !isAnswered) ? 'pointer' : (canPlaySound ? 'pointer' : 'default'),
        position: 'relative',
        margin: isPreK ? '0 auto' : undefined,
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: cardTransform,
        ...(part.style || {}),
        ...(isPreK ? { flex: '0 0 auto', height: 'auto', minHeight: 'auto' } : {}),
      }}
    >
      {showSpeakerOnLeft ? (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 12 }}>
          {speakerButton}
          {imageContainer}
        </div>
      ) : (
        imageContainer
      )}

      {part.showLabel && labelText && (
        <div
          style={{
            marginTop: 8,
            fontSize: isPreK ? '18px' : '14px',
            fontWeight: 800,
            color: '#1e293b',
            textAlign: 'center',
            fontFamily: 'var(--font-outfit), sans-serif',
            userSelect: 'none',
          }}
        >
          {labelText}
        </div>
      )}
    </div>
  );
}

function InputPart({ part, userAnswer, onAnswer, isAnswered, question }) {
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
        ...(question?.metaConfig?.hasClickToFill ? { display: 'none' } : {})
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
  const height = Number(part.height ?? 160);
  const startX = 56;
  const endX = width - 56;
  const y = 88;
  const markerX = startX + ((marker - min) / Math.max(max - min, 1)) * (endX - startX);

  const numJumps = Number(part.numJumps || part.jumpCount || 0);
  const jumpSize = Number(part.jumpSize || 1);
  const absJumpSize = Math.abs(jumpSize);
  const startPoint = part.startPoint !== undefined ? Number(part.startPoint) : min;
  const jumpDirection = part.jumpDirection || (part.jumpSize < 0 ? 'backward' : 'forward');
  const isJumping = numJumps > 0;

  const visitedTicks = new Set();
  if (isJumping) {
    for (let i = 0; i <= numJumps; i++) {
      if (jumpDirection === 'backward') {
        visitedTicks.add(startPoint - i * absJumpSize);
      } else {
        visitedTicks.add(startPoint + i * absJumpSize);
      }
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', ...(part.style || {}) }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width, overflow: 'visible' }}>
        <defs>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes drawArc {
              from { stroke-dashoffset: 400; }
              to { stroke-dashoffset: 0; }
            }
          ` }} />
          {isJumping && (
            <marker
              id="jump-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={part.color || '#4f46e5'} />
            </marker>
          )}
        </defs>
        
        <line x1={startX} y1={y} x2={endX} y2={y} stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        <path d={`M${endX - 12} ${y - 8} L${endX} ${y} L${endX - 12} ${y + 8}`} fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        
        {ticks.map((tick) => {
          const x = startX + ((tick - min) / Math.max(max - min, 1)) * (endX - startX);
          const isLanding = isJumping && visitedTicks.has(tick);
          const isMissing = part.missingTicks?.includes(tick);
          const shouldShowLabel = !isJumping || isLanding || tick === min || tick === max;

          if (!shouldShowLabel) {
            return (
              <line key={tick} x1={x} y1={y - 8} x2={x} y2={y + 8} stroke="#cbd5e1" strokeWidth="1.5" />
            );
          }

          if (isMissing) {
            return (
              <g key={tick}>
                <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke="#334155" strokeWidth="3" />
                <circle cx={x} cy={y + 36} r="15" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
                <text x={x} y={y + 42} textAnchor="middle" fontSize="18" fontWeight="900" fill="#ef4444">?</text>
              </g>
            );
          }

          return (
            <g key={tick}>
              <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={isLanding ? (part.color || "#4f46e5") : "#334155"} strokeWidth={isLanding ? "3" : "2"} />
              <text x={x} y={y + 42} textAnchor="middle" fontSize="18" fontWeight={isLanding ? "900" : "800"} fill={isLanding ? (part.color || "#4f46e5") : "#334155"}>{tick}</text>
            </g>
          );
        })}

        {isJumping && (
          <g>
            {Array.from({ length: numJumps }).map((_, i) => {
              let fromVal, toVal;
              if (jumpDirection === 'backward') {
                fromVal = startPoint - i * absJumpSize;
                toVal = startPoint - (i + 1) * absJumpSize;
              } else {
                fromVal = startPoint + i * absJumpSize;
                toVal = startPoint + (i + 1) * absJumpSize;
              }
              const x1 = startX + ((fromVal - min) / Math.max(max - min, 1)) * (endX - startX);
              const x2 = startX + ((toVal - min) / Math.max(max - min, 1)) * (endX - startX);
              const h = Math.min(65, Math.abs(x2 - x1) * 0.38);
              const controlX = (x1 + x2) / 2;
              const controlY = y - h * 2;
              const pathD = `M ${x1} ${y} Q ${controlX} ${controlY} ${x2} ${y}`;

              const labelText = jumpDirection === 'backward' ? `-${absJumpSize}` : `+${absJumpSize}`;

              return (
                <g key={i}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={part.color || '#4f46e5'}
                    strokeWidth="3.5"
                    markerEnd="url(#jump-arrow)"
                    strokeDasharray="400"
                    strokeDashoffset="400"
                    style={{
                      animation: 'drawArc 800ms ease-out forwards',
                      animationDelay: `${i * 300}ms`
                    }}
                  />
                  <text
                    x={controlX}
                    y={y - h - 10}
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="900"
                    fill={part.color || '#4f46e5'}
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {part.marker !== undefined && (
          <g>
            <circle cx={markerX} cy={y} r="11" fill="#22c55e" stroke="#15803d" strokeWidth="4" />
            {part.label ? (
              <text x={markerX} y={y - 28} textAnchor="middle" fontSize="18" fontWeight="900" fill="#15803d">{part.label}</text>
            ) : null}
          </g>
        )}
      </svg>
    </div>
  );
}

function BarModelPart({ part }) {
  const bars = part.bars || [];
  const mode = part.mode || 'single';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '600px', margin: '0 auto', padding: '10px 0', ...(part.style || {}) }}>
      {bars.map((bar, barIdx) => {
        const segCount = bar.segmentCount || 1;
        const segVal = bar.segmentValue || '';
        const hasBracket = Boolean(bar.bracketLabel);
        
        return (
          <div key={barIdx} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
              {bar.label ? (
                <div style={{ width: '100px', fontWeight: '800', color: '#475569', fontSize: '15px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {bar.label}
                </div>
              ) : null}
              
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
                {/* Segments Row */}
                <div style={{ display: 'flex', width: '100%', height: '46px', border: `2.5px solid ${bar.stroke || '#0284c7'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 4px 6px rgba(15, 23, 42, 0.04)' }}>
                  {Array.from({ length: segCount }).map((_, segIdx) => {
                    const isLast = segIdx === segCount - 1;
                    const showLabel = bar.showSegmentLabels !== false || segIdx === 0;
                    return (
                      <div
                        key={segIdx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          backgroundColor: bar.color || '#e0f2fe',
                          borderRight: isLast ? 'none' : `2px solid ${bar.stroke || '#0284c7'}`,
                          color: bar.textColor || '#0c4a6e',
                          fontWeight: '900',
                          fontSize: '18px',
                          boxSizing: 'border-box'
                        }}
                      >
                        {showLabel ? segVal : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Bracket Row */}
                {hasBracket && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '6px', position: 'relative' }}>
                    {/* SVG Linear Bracket with End Ticks */}
                    <svg width="100%" height="28" style={{ overflow: 'visible' }}>
                      <path
                        d="M 2 4 L 2 12 L 2 8 L 100% 8 L 100% 12 L 100% 4"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {/* Bracket Label Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0px',
                      backgroundColor: '#f1f5f9',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '20px',
                      padding: '2px 14px',
                      color: '#334155',
                      fontWeight: '900',
                      fontSize: '15px',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.05)',
                      transform: 'translateY(15%)'
                    }}>
                      {bar.bracketLabel}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FunctionMachinePart({ part }) {
  const input = part.input ?? '5';
  const operation = part.operation ?? '× 3';
  const output = part.output ?? '15';

  const isInputMissing = input === '?';
  const isRuleMissing = operation.includes('?');
  const isOutputMissing = output === '?';

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '12px auto', ...(part.style || {}) }}>
      <svg width="100%" height="130" viewBox="0 0 540 130" style={{ maxWidth: '540px', overflow: 'visible' }}>
        <defs>
          <linearGradient id="machine-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="machine-grad-missing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#cbd5e1" />
          </marker>
        </defs>

        {/* Connection Arrows */}
        <line x1="104" y1="65" x2="182" y2="65" stroke="#cbd5e1" strokeWidth="4" markerEnd="url(#arrowhead)" />
        <line x1="358" y1="65" x2="436" y2="65" stroke="#cbd5e1" strokeWidth="4" markerEnd="url(#arrowhead)" />

        {/* Input Node */}
        <g>
          <circle cx="68" cy="65" r="32" fill={isInputMissing ? "#fff5f5" : "#f0fdf4"} stroke={isInputMissing ? "#ef4444" : "#22c55e"} strokeWidth="3" strokeDasharray={isInputMissing ? "6 4" : "none"} />
          <text x="68" y="72" textAnchor="middle" fontSize={isInputMissing ? "24" : "20"} fontWeight="900" fill={isInputMissing ? "#ef4444" : "#15803d"}>{input}</text>
          <text x="68" y="24" textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b" letterSpacing="0.05em">INPUT</text>
        </g>

        {/* Machine Box */}
        <g>
          <rect
            x="192"
            y="25"
            width="156"
            height="80"
            rx="16"
            fill={isRuleMissing ? "url(#machine-grad-missing)" : "url(#machine-grad)"}
            stroke={isRuleMissing ? "#9f1239" : "#4c1d95"}
            strokeWidth="3.5"
            filter="drop-shadow(0 10px 15px rgba(109, 40, 217, 0.12))"
          />
          {/* Mechanical details / Gear accents */}
          <circle cx="216" cy="46" r="6" fill="#ffffff" opacity="0.25" />
          <circle cx="324" cy="46" r="6" fill="#ffffff" opacity="0.25" />
          <circle cx="216" cy="84" r="6" fill="#ffffff" opacity="0.25" />
          <circle cx="324" cy="84" r="6" fill="#ffffff" opacity="0.25" />
          
          <text x="270" y="72" textAnchor="middle" fontSize="24" fontWeight="900" fill="#ffffff" letterSpacing="0.02em">{operation}</text>
          <text x="270" y="16" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7c3aed" letterSpacing="0.05em">MACHINE</text>
        </g>

        {/* Output Node */}
        <g>
          <circle cx="472" cy="65" r="32" fill={isOutputMissing ? "#fff5f5" : "#f0f9ff"} stroke={isOutputMissing ? "#ef4444" : "#0284c7"} strokeWidth="3" strokeDasharray={isOutputMissing ? "6 4" : "none"} />
          <text x="472" y="72" textAnchor="middle" fontSize={isOutputMissing ? "24" : "20"} fontWeight="900" fill={isOutputMissing ? "#ef4444" : "#0369a1"}>{output}</text>
          <text x="472" y="24" textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b" letterSpacing="0.05em">OUTPUT</text>
        </g>
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
  const isVerticalAdditionReplica = layout?.variant === 'verticalAdditionReplica' || layout?.variant === 'verticalSubtractionReplica';
  const isVerticalArithmeticReplica = isVerticalAdditionReplica || layout?.variant === 'verticalMultiplicationReplica';
  const digitCount = Math.max(
    2,
    answerRow?.cells?.length || 0,
    ...(layout?.rows || []).map((row) => String(row.text || '').replace(/[+×x−\-]/gi, '').trim().length)
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
    showItemBorders: part.showItemBorders,
    borderlessItems: part.borderlessItems,
    cardStyle: part.cardStyle,
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

function InteractiveStickersPart({ part, userAnswer, onAnswer, isAnswered }) {
  const isShadowMatch = part.mode === 'shadow_match';
  const capacity = isShadowMatch
    ? (part.stickers?.length || 3)
    : Math.max(Number(part.capacity || 5), Number(part.targetCount || 1));

  const sceneRef = useRef(null);
  const trayRef = useRef(null);
  const dragRef = useRef(null);
  const placementsRef = useRef([]);
  const [draggingId, setDraggingId] = useState(null);
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  const draggedSticker = part.stickers?.find(s => s.id === draggingId);
  const isOutsideDragged = part.isVenn && draggedSticker?.type === 'outside';

  const stickerConfig = typeof part.sticker === 'object' && part.sticker !== null
    ? part.sticker
    : {};
  const stickerImageUrl = part.stickerImageUrl || stickerConfig.imageUrl || '';
  const stickerContent = stickerConfig.content || part.sticker || '🦋';
  const stickerWidth = Number(stickerConfig.widthPercent || part.stickerWidthPercent || 10);
  const stickerHeight = Number(stickerConfig.heightPercent || part.stickerHeightPercent || 15);

  const initialPositions = [
    { x: 24, y: 58 }, { x: 43, y: 42 }, { x: 68, y: 58 }, { x: 78, y: 30 },
    { x: 54, y: 70 }, { x: 30, y: 28 }, { x: 84, y: 68 }, { x: 60, y: 27 },
    { x: 14, y: 36 }, { x: 38, y: 72 },
  ];

  const getVennRegion = (xPercent, yPercent) => {
    const xPx = (xPercent / 100) * 550;
    const yPx = (yPercent / 100) * 240;

    const LEFT_CENTER = { x: 215, y: 120 };
    const RIGHT_CENTER = { x: 335, y: 120 };
    const RADIUS = 90;

    const d1 = Math.hypot(xPx - LEFT_CENTER.x, yPx - LEFT_CENTER.y);
    const d2 = Math.hypot(xPx - RIGHT_CENTER.x, yPx - RIGHT_CENTER.y);

    const inLeft = d1 <= RADIUS;
    const inRight = d2 <= RADIUS;

    if (inLeft && inRight) return 'middle';
    if (inLeft) return 'left';
    if (inRight) return 'right';
    return 'outside';
  };

  const checkSnap = (id, x, y) => {
    if (!isShadowMatch) return { x, y, isSnapped: false };
    const mascot = part.stickers?.find(s => s.id === id);
    if (!mascot) return { x, y, isSnapped: false };

    if (part.isVenn) {
      const region = getVennRegion(x, y);
      if (region === mascot.type) {
        if (region === 'outside') {
          return { x, y, isSnapped: true, type: 'outside' };
        } else {
          const target = part.targets?.find(t => t.type === region);
          if (target) {
            return { x: target.x, y: target.y, isSnapped: true, type: region };
          }
        }
      }
      return { x, y, isSnapped: false, type: mascot.type };
    }
    
    const matchingTargets = part.targets?.filter(t => t.type === mascot.type) || [];
    if (matchingTargets.length === 0) return { x, y, isSnapped: false, type: mascot.type };
    
    // Find the matching target closest to the current pointer position (x, y)
    let closestTarget = matchingTargets[0];
    let minDistance = Infinity;
    for (const targetItem of matchingTargets) {
      const dx = x - targetItem.x;
      const dy = y - targetItem.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = targetItem;
      }
    }
    const target = closestTarget;

    const dx = x - target.x;
    const dy = y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const snapThreshold = 8.5; // Snap threshold percentage
    if (distance < snapThreshold) {
      return { x: target.x, y: target.y, isSnapped: true, type: mascot.type };
    }
    return { x, y, isSnapped: false, type: mascot.type };
  };

  const placementsFromAnswer = () => {
    if (userAnswer && typeof userAnswer === 'object' && Array.isArray(userAnswer.placements)) {
      return userAnswer.placements;
    }
    if (part.initialPlacements && Array.isArray(part.initialPlacements)) {
      return part.initialPlacements;
    }
    if (isShadowMatch) {
      return [];
    }
    const count = Math.max(0, Math.min(capacity, Number(userAnswer || 0)));
    return Array.from({ length: count }, (_, index) => ({
      id: index,
      ...initialPositions[index % initialPositions.length],
    }));
  };

  const [placements, setPlacements] = useState(placementsFromAnswer);

  useEffect(() => {
    const nextPlacements = placementsFromAnswer();
    placementsRef.current = nextPlacements;
    setPlacements(nextPlacements);
  }, [userAnswer, capacity]);

  const emitPlacements = (nextPlacements) => {
    if (isAnswered || !onAnswer) return;
    onAnswer({ count: nextPlacements.length, placements: nextPlacements });
  };

  const positionFromPointer = (clientX, clientY, offsetX = 0, offsetY = 0, sWidth = stickerWidth, sHeight = stickerHeight) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((clientX - rect.left - offsetX) / rect.width) * 100;
    const y = ((clientY - rect.top - offsetY) / rect.height) * 100;
    return {
      x: Math.max(sWidth / 2, Math.min(100 - sWidth / 2, x)),
      y: Math.max(sHeight / 2, Math.min(100 - sHeight / 2, y)),
    };
  };

  const startDrag = (event, id, source) => {
    if (isAnswered) return;
    event.preventDefault();
    const sceneRect = sceneRef.current?.getBoundingClientRect();
    const existing = placements.find((placement) => placement.id === id);
    const centerX = existing && sceneRect ? sceneRect.left + (existing.x / 100) * sceneRect.width : event.clientX;
    const centerY = existing && sceneRect ? sceneRect.top + (existing.y / 100) * sceneRect.height : event.clientY;
    dragRef.current = {
      id,
      source,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY,
      moved: false,
    };
    setDraggingId(id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || isAnswered) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.moved && distance < 5) return;
    drag.moved = true;

    const stickerInfo = isShadowMatch ? part.stickers?.find(s => s.id === drag.id) : null;
    const sWidth = stickerInfo ? (stickerInfo.widthPercent || stickerInfo.width) : stickerWidth;
    const sHeight = stickerInfo ? (stickerInfo.heightPercent || stickerInfo.height) : stickerHeight;

    const position = positionFromPointer(event.clientX, event.clientY, drag.offsetX, drag.offsetY, sWidth, sHeight);
    if (!position) return;
    setPlacements((current) => {
      const exists = current.some((placement) => placement.id === drag.id);
      const nextPlacements = exists
        ? current.map((placement) => placement.id === drag.id ? { ...placement, ...position } : placement)
        : [...current, { id: drag.id, ...position }];
      placementsRef.current = nextPlacements;
      return nextPlacements;
    });
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || isAnswered) return;
    event.preventDefault();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const trayRect = trayRef.current?.getBoundingClientRect();
    const overTray = trayRect
      && event.clientX >= trayRect.left && event.clientX <= trayRect.right
      && event.clientY >= trayRect.top && event.clientY <= trayRect.bottom;
    let nextPlacements = placementsRef.current;

    if (overTray && drag.source === 'scene') {
      nextPlacements = nextPlacements.filter((placement) => placement.id !== drag.id);
    } else if (!drag.moved) {
      if (drag.source === 'scene') {
        nextPlacements = nextPlacements.filter((placement) => placement.id !== drag.id);
      } else {
        const exists = nextPlacements.some((placement) => placement.id === drag.id);
        if (!exists) {
          const fallback = initialPositions[drag.id % initialPositions.length];
          const snapResult = checkSnap(drag.id, fallback.x, fallback.y);
          nextPlacements = [...nextPlacements, { id: drag.id, ...snapResult }];
        }
      }
    } else {
      nextPlacements = nextPlacements.map((placement) => {
        if (placement.id === drag.id) {
          const snapResult = checkSnap(placement.id, placement.x, placement.y);
          return { ...placement, ...snapResult };
        }
        return placement;
      });
    }

    placementsRef.current = nextPlacements;
    setPlacements(nextPlacements);
    emitPlacements(nextPlacements);
    setSelectedTrayId(null);
    setDraggingId(null);
    dragRef.current = null;
  };

  useEffect(() => {
    if (draggingId === null || isAnswered) return undefined;

    const handleMove = (event) => moveDrag(event);
    const handleEnd = (event) => endDrag(event);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [draggingId, isAnswered]);

  const placeSelected = (event) => {
    if (selectedTrayId === null || isAnswered) return;

    const stickerInfo = isShadowMatch ? part.stickers?.find(s => s.id === selectedTrayId) : null;
    const sWidth = stickerInfo ? (stickerInfo.widthPercent || stickerInfo.width) : stickerWidth;
    const sHeight = stickerInfo ? (stickerInfo.heightPercent || stickerInfo.height) : stickerHeight;

    const position = positionFromPointer(event.clientX, event.clientY, 0, 0, sWidth, sHeight);
    if (!position) return;

    const snapResult = checkSnap(selectedTrayId, position.x, position.y);
    const nextPlacements = [...placements, { id: selectedTrayId, ...snapResult }];
    placementsRef.current = nextPlacements;
    setPlacements(nextPlacements);
    emitPlacements(nextPlacements);
    setSelectedTrayId(null);
  };

  const startNativeDrag = (event, id, source) => {
    if (isAnswered) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id,
      source,
      moved: true,
      offsetX: source === 'scene' ? event.clientX - (rect.left + rect.width / 2) : 0,
      offsetY: source === 'scene' ? event.clientY - (rect.top + rect.height / 2) : 0,
    };
    setDraggingId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(id));
  };

  const dropOnScene = (event) => {
    event.preventDefault();
    const drag = dragRef.current;
    if (!drag || isAnswered) return;

    const stickerInfo = isShadowMatch ? part.stickers?.find(s => s.id === drag.id) : null;
    const sWidth = stickerInfo ? (stickerInfo.widthPercent || stickerInfo.width) : stickerWidth;
    const sHeight = stickerInfo ? (stickerInfo.heightPercent || stickerInfo.height) : stickerHeight;

    const position = positionFromPointer(event.clientX, event.clientY, drag.offsetX, drag.offsetY, sWidth, sHeight);
    if (!position) return;

    const snapResult = checkSnap(drag.id, position.x, position.y);
    const current = placementsRef.current;
    const exists = current.some((placement) => placement.id === drag.id);
    const nextPlacements = exists
      ? current.map((placement) => placement.id === drag.id ? { ...placement, ...snapResult } : placement)
      : [...current, { id: drag.id, ...snapResult }];
    placementsRef.current = nextPlacements;
    setPlacements(nextPlacements);
    emitPlacements(nextPlacements);
    dragRef.current = null;
    setDraggingId(null);
  };

  const dropOnTray = (event) => {
    event.preventDefault();
    const drag = dragRef.current;
    if (!drag || drag.source !== 'scene' || isAnswered) return;
    const nextPlacements = placementsRef.current.filter((placement) => placement.id !== drag.id);
    placementsRef.current = nextPlacements;
    setPlacements(nextPlacements);
    emitPlacements(nextPlacements);
    dragRef.current = null;
    setDraggingId(null);
  };

  const renderSticker = (label, stickerInfo) => {
    const imgUrl = stickerInfo?.imageUrl || stickerImageUrl;
    const content = stickerInfo?.content || stickerContent;
    return imgUrl ? (
      <img src={imgUrl} alt={label} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
    ) : (
      <span aria-hidden="true" style={{ fontSize: 'clamp(38px, 7vw, 68px)', lineHeight: 1 }}>{content}</span>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'grid', gap: 0 }}>
      <div
        ref={sceneRef}
        aria-label={`${placements.length} ${part.itemLabel || 'stickers'} placed`}
        onPointerDown={placeSelected}
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropOnScene}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 7',
          minHeight: 230,
          overflow: 'hidden',
          border: isOutsideDragged ? '3px dashed #fb8c00' : '2px solid #93c5fd',
          borderRadius: '18px 18px 0 0',
          background: part.sceneImageUrl
            ? `url("${part.sceneImageUrl}") center / cover no-repeat`
            : 'linear-gradient(#62b8ed 0 62%, #b9d85a 62% 76%, #65a83c 76%)',
          boxShadow: isOutsideDragged ? '0 0 15px rgba(251, 140, 0, 0.5), inset 0 0 20px rgba(251, 140, 0, 0.2)' : 'inset 0 -18px 0 rgba(32, 108, 43, 0.13)',
          touchAction: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isOutsideDragged ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(251, 140, 0, 0.04)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ) : null}
        {!part.sceneImageUrl ? (
          <>
            <div style={{ position: 'absolute', width: 86, height: 86, borderRadius: '50%', background: '#fff4a8', right: '8%', top: '8%', opacity: 0.9 }} />
            <div style={{ position: 'absolute', fontSize: 'clamp(58px, 10vw, 105px)', left: '5%', bottom: '10%' }}>🌳</div>
            <div style={{ position: 'absolute', fontSize: 'clamp(36px, 6vw, 64px)', right: '7%', bottom: '3%' }}>🌼</div>
          </>
        ) : null}

        {/* Render target shadows behind stickers */}
        {isShadowMatch && part.targets?.map((target) => {
          const matchedItem = placements.find(item => item.type === target.type && item.isSnapped && Math.abs(item.x - target.x) < 0.1 && Math.abs(item.y - target.y) < 0.1);
          const isSnapped = !!matchedItem;
          const mascot = part.stickers?.find(s => s.type === target.type);

          return (
            <div
              key={target.id}
              style={{
                position: 'absolute',
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.widthPercent || target.width || 15}%`,
                height: `${target.heightPercent || target.height || 15}%`,
                transform: 'translate(-50%, -50%)',
                backgroundImage: mascot?.imageUrl ? `url(${mascot.imageUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                filter: isSnapped
                  ? 'brightness(1.1) contrast(1.1) drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
                  : (part.hideTargetShadows ? 'opacity(0)' : 'brightness(0) opacity(0.25)'), // Silhouette shadow
                transition: 'filter 0.3s ease',
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {placements.map((placement) => {
          const stickerInfo = isShadowMatch && part.stickers
            ? part.stickers.find(s => s.id === placement.id)
            : null;
          const sWidth = stickerInfo ? (stickerInfo.widthPercent || stickerInfo.width) : stickerWidth;
          const sHeight = stickerInfo ? (stickerInfo.heightPercent || stickerInfo.height) : stickerHeight;

          return (
            <button
              key={placement.id}
              type="button"
              disabled={isAnswered}
              draggable={false}
              aria-label={`Move ${part.itemLabel || 'sticker'} ${placement.id + 1}`}
              onPointerDown={(event) => startDrag(event, placement.id, 'scene')}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{
                position: 'absolute',
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                width: `${sWidth}%`,
                height: `${sHeight}%`,
                transform: `translate(-50%, -50%) scale(${draggingId === placement.id ? 1.08 : 1})`,
                border: 0,
                background: 'transparent',
                padding: 0,
                cursor: isAnswered ? 'default' : 'grab',
                filter: 'drop-shadow(0 5px 3px rgba(15, 23, 42, 0.22))',
                transition: draggingId === placement.id ? 'none' : 'transform 150ms ease',
                touchAction: 'none',
                zIndex: draggingId === placement.id ? 3 : 1,
              }}
            >
              {renderSticker(`${part.itemLabel || 'sticker'} ${placement.id + 1}`, stickerInfo)}
            </button>
          );
        })}
      </div>

      <div
        ref={trayRef}
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropOnTray}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(12px, 4vw, 36px)',
          minHeight: 116,
          padding: '14px 18px',
          border: '2px solid #dbeafe',
          borderTop: 0,
          borderRadius: '0 0 18px 18px',
          background: '#ffffff',
        }}
      >
        {Array.from({ length: capacity }, (_, index) => {
          const used = placements.some((placement) => placement.id === index);
          const selected = selectedTrayId === index;
          const stickerInfo = isShadowMatch && part.stickers
            ? part.stickers[index]
            : null;

          return (
            <button
              key={index}
              type="button"
              disabled={isAnswered}
              draggable={false}
              aria-label={used ? `${part.itemLabel || 'sticker'} placed` : `Drag ${part.itemLabel || 'sticker'} into picture`}
              onPointerDown={(event) => {
                if (used) return;
                setSelectedTrayId(selected ? null : index);
                startDrag(event, index, 'tray');
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{
                width: 'clamp(58px, 11vw, 86px)', // Larger Pre-K sizing
                height: 'clamp(58px, 11vw, 86px)',
                border: selected ? '3px solid #2563eb' : '2px solid transparent',
                borderRadius: 12,
                background: selected ? '#eff6ff' : 'transparent',
                padding: 4,
                cursor: isAnswered || used ? 'default' : 'grab',
                filter: used
                  ? 'grayscale(1) opacity(.2)'
                  : 'drop-shadow(0 4px 3px rgba(15, 23, 42, 0.18))',
                transform: used ? 'scale(.92)' : 'scale(1)',
                transition: 'filter 160ms ease, transform 160ms ease',
                touchAction: 'none',
              }}
            >
              {renderSticker(part.itemLabel || 'sticker', stickerInfo)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OneMoreRowsPart({ part }) {
  const startCount = Math.max(0, Number(part.startCount || 0));
  const comparisonCount = Math.max(0, Number(part.comparisonCount ?? startCount + 1));
  const capacity = Math.max(Number(part.capacity || 5), startCount, comparisonCount);
  const object = part.object || {};
  const imageUrl = object.imageUrl || part.imageUrl || '';
  const emoji = object.emoji || part.emoji || '⭐';
  const label = object.plural || object.label || part.itemLabel || 'objects';
  const rows = [
    { count: startCount, value: startCount, answer: false },
    { count: comparisonCount, value: comparisonCount, answer: part.hideComparisonValue !== false },
  ];

  return (
    <div
      aria-label={`${startCount} ${label} in the top row and ${comparisonCount} ${label} in the bottom row`}
      style={{
        width: 'min(100%, 680px)',
        margin: '4px auto 2px',
        display: 'grid',
        gap: 12,
      }}
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, minWidth: 0 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${capacity}, minmax(38px, 64px))`,
              border: '3px solid #bae6fd',
              background: '#f8fcff',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            {Array.from({ length: capacity }, (_, index) => (
              <div
                key={index}
                style={{
                  aspectRatio: '1 / 1',
                  minWidth: 0,
                  borderRight: index === capacity - 1 ? 0 : '3px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                {index < row.count ? (
                  imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      style={{ width: '92%', height: '92%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span aria-hidden="true" style={{ fontSize: 'clamp(24px, 5vw, 42px)', lineHeight: 1 }}>{emoji}</span>
                  )
                ) : null}
              </div>
            ))}
          </div>
          <div
            aria-label={row.answer ? 'Find this number' : String(row.value)}
            style={{
              width: 48,
              height: 48,
              flex: '0 0 48px',
              borderRadius: row.answer ? 6 : '50%',
              border: row.answer ? '3px solid #7dd3fc' : 0,
              background: row.answer ? '#ffffff' : '#38a9e8',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 900,
              boxShadow: row.answer ? 'none' : '0 4px 0 #0284c7',
            }}
          >
            {row.answer ? '' : row.value}
          </div>
        </div>
      ))}
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
  const isVertical = part.orientation === 'vertical';

  // Server-side theme colors
  const cubeColor = part.cubeColor || '#ef4444';
  const strokeColor = part.strokeColor || '#b91c1c';
  const pipColor = part.pipColor || '#ffffff';

  // Placed dice array on the canvas
  const [placedDice, setPlacedDice] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [diceSize, setDiceSize] = useState(44);
  const containerRef = useRef(null);

  // Position reference for checking drag vs click
  const dragStartPos = useRef(null);

  // Dimension tracking for responsiveness
  const canvasHeight = isVertical ? 360 : 200;
  const baselineY = isVertical ? 320 : 130; // Ground/baseline position
  const lineY = 50; // top coordinate for line in horizontal mode
  const slotY = lineY + 8; // top coordinate for slots in horizontal mode

  const [dimensions, setDimensions] = useState({
    width: 600,
    lineStartX: 60,
    slotsStartX: 300,
    imageStartX: 100
  });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (isVertical) {
          setDiceSize(44);
          const imageWidth = 120;
          const gap = 24;
          const totalContentWidth = imageWidth + gap + 44;
          const contentStartX = Math.max(20, (w - totalContentWidth) / 2);
          setDimensions({
            width: w,
            imageStartX: contentStartX,
            slotsStartX: contentStartX + imageWidth + gap,
            lineStartX: 0
          });
        } else {
          const padding = 40;
          const maxAllowedWidth = w - padding;
          let currentDiceSize = 44;
          if (targetLength * 44 > maxAllowedWidth) {
            currentDiceSize = Math.max(30, Math.floor(maxAllowedWidth / targetLength));
          }
          setDiceSize(currentDiceSize);
          
          const start = Math.max(20, (w - targetLength * currentDiceSize) / 2);
          setDimensions({
            width: w,
            lineStartX: start,
            slotsStartX: 0,
            imageStartX: 0
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial trigger
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [targetLength, isVertical]);

  // Keep snapped dice aligned during dimension or diceSize changes
  useEffect(() => {
    setPlacedDice(prev => prev.map(d => {
      if (d.slotIndex >= 0) {
        const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + d.slotIndex * diceSize;
        const y = isVertical ? baselineY - (d.slotIndex + 1) * diceSize : slotY;
        return { ...d, x, y };
      }
      return d;
    }));
  }, [dimensions, diceSize, isVertical, baselineY, slotY]);

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

  const spawnDice = (pips, clientX, clientY, e, customColor, customStroke) => {
    if (isAnswered) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left - diceSize / 2;
    const y = clientY - rect.top - diceSize / 2;

    const newId = 'dice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newDice = {
      id: newId,
      x,
      y,
      pips,
      slotIndex: -1,
      color: customColor,
      stroke: customStroke
    };

    // Track original pointer position and new tag for click-to-snap/click-to-remove
    dragStartPos.current = { x: clientX, y: clientY, isNew: true };

    setPlacedDice(prev => [...prev, newDice]);
    setDraggingId(newId);
    setDragOffset({ x: diceSize / 2, y: diceSize / 2 });
    playSnapTone(350);

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
      dragStartPos.current = { x: clientX, y: clientY, isNew: false };

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

    // Find the next empty slot index sequentially
    let nextSlotIndex = 0;
    while (occupied.includes(nextSlotIndex)) {
      nextSlotIndex++;
    }

    let targetSlotX, targetSlotY;
    if (isVertical) {
      targetSlotX = dimensions.slotsStartX;
      targetSlotY = baselineY - (nextSlotIndex + 1) * diceSize;
    } else {
      targetSlotX = dimensions.lineStartX + nextSlotIndex * diceSize;
      targetSlotY = slotY;
    }

    // Calculate distance for magnetic snap attraction
    const diceCenterX = clampedX + diceSize / 2;
    const diceCenterY = clampedY + diceSize / 2;
    const slotCenterX = targetSlotX + diceSize / 2;
    const slotCenterY = targetSlotY + diceSize / 2;
    const dist = Math.hypot(diceCenterX - slotCenterX, diceCenterY - slotCenterY);

    let x = clampedX;
    let y = clampedY;
    let tempSlot = -1;

    // Snapping range threshold
    if (dist < 35) {
      x = targetSlotX;
      y = targetSlotY;
      tempSlot = nextSlotIndex;
    }

    setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, tempSlotIndex: tempSlot } : d));
  };

  const handlePointerUp = (e) => {
    if (draggingId === null) return;

    const dragged = placedDice.find(d => d.id === draggingId);
    if (dragged && dragStartPos.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dragDist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);

      if (dragDist < 6) {
        // Treat as a TAP/CLICK
        if (dragStartPos.current.isNew) {
          // Clicked a tray dice -> Snap to next empty slot
          const occupied = placedDice
            .filter(d => d.id !== draggingId && d.slotIndex >= 0)
            .map(d => d.slotIndex);

          let firstEmptySlot = 0;
          while (occupied.includes(firstEmptySlot)) {
            firstEmptySlot++;
          }

          if (firstEmptySlot < targetLength) {
            const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + firstEmptySlot * diceSize;
            const y = isVertical ? baselineY - (firstEmptySlot + 1) * diceSize : slotY;

            setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, slotIndex: firstEmptySlot, tempSlotIndex: undefined } : d));
            playSnapTone(440);
          } else {
            // Already full -> remove the spawned dice
            setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
            playSnapTone(250);
          }
        } else {
          // Clicked a canvas dice -> Remove/Delete from canvas
          setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
          playSnapTone(250);
        }
      } else {
        // Treat as a DRAG AND DROP
        if (dragged.y > rect.height - 20 || dragged.y < -20 || dragged.x < -20 || dragged.x > rect.width - 20) {
          setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
          playSnapTone(250);
        } else if (dragged.tempSlotIndex !== undefined && dragged.tempSlotIndex >= 0) {
          // Confirm snap
          const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + dragged.tempSlotIndex * diceSize;
          const y = isVertical ? baselineY - (dragged.tempSlotIndex + 1) * diceSize : slotY;

          setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, slotIndex: d.tempSlotIndex, tempSlotIndex: undefined } : d));
          playSnapTone(440);
        } else {
          // Place freely
          setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, slotIndex: -1, tempSlotIndex: undefined } : d));
          playSnapTone(320);
        }
      }
    }

    setDraggingId(null);
  };

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
    <div 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: '100%', maxWidth: '640px', margin: '8px auto', display: 'flex', flexDirection: 'column', gap: '12px', touchAction: 'none' }}
    >
      {/* Main Workspace Card */}
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: `${canvasHeight}px`,
          background: '#f0f9ff', 
          border: '1px solid #e0f2fe', 
          borderRadius: '20px', 
          position: 'relative', 
          overflow: 'hidden', 
          boxShadow: '0 4px 12px rgba(186, 230, 253, 0.15)'
        }}
      >
        {/* Floating Reset Button */}
        <button
          type="button"
          disabled={isAnswered}
          onClick={() => {
            setPlacedDice([]);
            playSnapTone(220);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 30,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            opacity: isAnswered ? 0.5 : 1
          }}
          onMouseEnter={(e) => { if(!isAnswered) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { if(!isAnswered) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'; e.currentTarget.style.transform = 'none'; } }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M16 3h5v5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 21H3v-5"/>
          </svg>
          <span>Reset</span>
        </button>

        {isVertical ? (
          <>
            {/* Ground Line */}
            <div style={{
              position: 'absolute',
              left: '20px',
              right: '20px',
              top: `${baselineY}px`,
              height: '4px',
              background: '#94a3b8',
              borderRadius: '999px',
              pointerEvents: 'none'
            }} />

            {/* Object Image to measure */}
            {part.objectImage && (
              <img
                src={part.objectImage}
                alt={part.objectName || 'object'}
                style={{
                  position: 'absolute',
                  right: `${dimensions.width - dimensions.slotsStartX + 24}px`,
                  bottom: `${canvasHeight - baselineY}px`,
                  height: `${targetLength * diceSize}px`,
                  width: 'auto',
                  maxHeight: `${targetLength * diceSize}px`,
                  objectFit: 'contain',
                  objectPosition: 'bottom right',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Vertical Dash Border Empty Slots */}
            {Array.from({ length: targetLength }).map((_, i) => {
              const isOccupied = placedDice.some(d => d.slotIndex === i);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${dimensions.slotsStartX}px`,
                    top: `${baselineY - (i + 1) * diceSize}px`,
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
          </>
        ) : (
          <>
            {/* Target measurement line (Horizontal) */}
            <div style={{ 
              position: 'absolute', 
              left: `${dimensions.lineStartX}px`, 
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

            {/* Dash Border Empty Slots (Horizontal) */}
            {Array.from({ length: targetLength }).map((_, i) => {
              const isOccupied = placedDice.some(d => d.slotIndex === i);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${dimensions.lineStartX + i * diceSize}px`,
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
          </>
        )}

        {/* Placed/floating dice */}
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
                transition: isDragging ? 'none' : 'left 0.12s ease-out, top 0.12s ease-out'
              }}
            >
              {renderDiceSVG(dice.pips, diceSize)}
            </div>
          );
        })}
      </div>

      {/* Storage Tray */}
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
          {isVertical ? 'Click or drag dice next to the object' : 'Click or drag dice from tray to measure'}
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

function NonStandardObjectMeasurementPart({ part, userAnswer, onAnswer, isAnswered }) {
  const layoutMode = part.layoutMode || 'horizontal_row';
  const dimension = part.dimension || 'length';
  const orientation = part.orientation || 'horizontal';
  const unitObject = part.unitObject || 'cubes';
  const targetLength = Number(part.targetLength ?? 5);
  const firstLength = Number(part.firstLength ?? 0);
  const secondLength = Number(part.secondLength ?? 0);
  const objectImage = part.objectImage || '';
  const objectName = part.objectName || '';
  const layoutFamily = part.layoutFamily || 'measurement';
  const patternGroupSize = Number(part.patternGroupSize ?? 2);
  const patternRule = part.patternRule || 'ABAB';
  const groupCount = Number(part.groupCount ?? 2);
  const groupSize = Number(part.groupSize ?? 4);
  const subCount = Number(part.subCount ?? 2);

  const gridW = Number(part.gridW || part.firstLength || 3);
  const gridH = Number(part.gridH || part.secondLength || 3);
  const gridCellSize = Math.min(56, Math.floor(300 / Math.max(gridW, gridH)));

  const isVertical = (orientation === 'vertical' || layoutMode === 'compare_two_objects') && orientation !== 'horizontal';

  // Server-side theme colors
  const unitColor = part.unitColor || '#ef4444';
  const strokeColor = part.strokeColor || '#b91c1c';
  const pipColor = part.pipColor || '#ffffff';
  const secondaryColor = part.secondaryColor || '#3b82f6';
  const secondaryStroke = part.secondaryStroke || '#1d4ed8';

  // Placed dice/units array on the canvas (for drag_to_measure)
  const [placedDice, setPlacedDice] = useState(() => {
    if (firstLength > 0 && layoutMode === 'drag_to_measure') {
      return Array.from({ length: firstLength }).map((_, i) => ({
        id: `prefilled_${i}`,
        x: 0,
        y: 0,
        slotIndex: i,
        isPrefilled: true,
        pips: (i % 6) + 1,
        color: part.prefilledColors?.[i],
        stroke: part.prefilledStrokes?.[i]
      }));
    }
    return [];
  });
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [removedIndices, setRemovedIndices] = useState([]);
  const [filledCells, setFilledCells] = useState(new Set());

  const containerRef = useRef(null);
  const dragStartPos = useRef(null);

  // Dimension tracking for responsiveness
  const [diceSize, setDiceSize] = useState(56);
  const canvasHeight = (() => {
    if (isVertical) return 360;
    if (layoutFamily === 'ten_frame') return 200;
    if (layoutFamily === 'number_line') return 140;
    if (layoutFamily === 'money') return 140;
    if (layoutFamily === 'odd_even') return 160;
    if (layoutFamily === 'division') return 200;
    if (layoutFamily === 'number_bonds') return 240;
    if (layoutFamily === 'area_grid') {
      return gridH * gridCellSize + 140;
    }
    if (layoutFamily === 'place_value') return 240;
    if (layoutFamily === 'equal_groups') return 300;
    if (layoutFamily === 'graphs') return 300;
    return 200;
  })();
  const baselineY = isVertical ? 320 : 130; // Ground/baseline position
  const lineY = 50; // top coordinate for line in horizontal mode
  const slotY = lineY + 8; // top coordinate for slots in horizontal mode

  const [dimensions, setDimensions] = useState({
    width: 600,
    lineStartX: 60,
    slotsStartX: 300,
    imageStartX: 100
  });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (isVertical) {
          setDiceSize(56);
          const imageWidth = 120;
          const gap = 24;
          const totalContentWidth = imageWidth + gap + 56;
          const contentStartX = Math.max(20, (w - totalContentWidth) / 2);
          setDimensions({
            width: w,
            imageStartX: contentStartX,
            slotsStartX: contentStartX + imageWidth + gap,
            lineStartX: 0
          });
        } else {
          const padding = 40;
          const maxAllowedWidth = w - padding;
          let currentDiceSize = 56;
          if (targetLength * 56 > maxAllowedWidth) {
            currentDiceSize = Math.max(34, Math.floor(maxAllowedWidth / targetLength));
          }
          setDiceSize(currentDiceSize);
          
          const start = Math.max(20, (w - targetLength * currentDiceSize) / 2);
          setDimensions({
            width: w,
            lineStartX: start,
            slotsStartX: 0,
            imageStartX: 0
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [targetLength, isVertical]);

  // Keep snapped dice aligned during dimension or diceSize changes
  useEffect(() => {
    setPlacedDice(prev => prev.map(d => {
      if (d.slotIndex >= 0) {
        const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + d.slotIndex * diceSize;
        const y = isVertical ? baselineY - (d.slotIndex + 1) * diceSize : slotY;
        return { ...d, x, y };
      }
      return d;
    }));
  }, [dimensions, diceSize, isVertical, baselineY, slotY]);

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

  const spawnDice = (pips, clientX, clientY, e, customColor, customStroke) => {
    if (isAnswered) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left - diceSize / 2;
    const y = clientY - rect.top - diceSize / 2;

    const newId = 'unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const newDice = {
      id: newId,
      x,
      y,
      pips,
      slotIndex: -1,
      color: customColor,
      stroke: customStroke
    };

    dragStartPos.current = { x: clientX, y: clientY, isNew: true };

    setPlacedDice(prev => [...prev, newDice]);
    setDraggingId(newId);
    setDragOffset({ x: diceSize / 2, y: diceSize / 2 });
    playSnapTone(350);

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
      if (dice.isPrefilled) return;
      dragStartPos.current = { x: clientX, y: clientY, isNew: false };

      setDraggingId(id);
      setDragOffset({
        x: clientX - rect.left - dice.x,
        y: clientY - rect.top - dice.y
      });
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

    const clampedX = Math.max(-10, Math.min(rect.width - (diceSize - 10), rawX));
    const clampedY = Math.max(-10, Math.min(rect.height - (diceSize - 10), rawY));

    const occupied = placedDice
      .filter(d => d.id !== draggingId && d.slotIndex >= 0)
      .map(d => d.slotIndex);

    let nextSlotIndex = 0;
    while (occupied.includes(nextSlotIndex)) {
      nextSlotIndex++;
    }

    let targetSlotX, targetSlotY;
    if (isVertical) {
      targetSlotX = dimensions.slotsStartX;
      targetSlotY = baselineY - (nextSlotIndex + 1) * diceSize;
    } else {
      targetSlotX = dimensions.lineStartX + nextSlotIndex * diceSize;
      targetSlotY = slotY;
    }

    const diceCenterX = clampedX + diceSize / 2;
    const diceCenterY = clampedY + diceSize / 2;
    const slotCenterX = targetSlotX + diceSize / 2;
    const slotCenterY = targetSlotY + diceSize / 2;
    const dist = Math.hypot(diceCenterX - slotCenterX, diceCenterY - slotCenterY);

    let x = clampedX;
    let y = clampedY;
    let tempSlot = -1;

    if (dist < 35) {
      x = targetSlotX;
      y = targetSlotY;
      tempSlot = nextSlotIndex;
    }

    setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, tempSlotIndex: tempSlot } : d));
  };

  const handlePointerUp = (e) => {
    if (draggingId === null) return;

    const dragged = placedDice.find(d => d.id === draggingId);
    if (dragged && dragStartPos.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dragDist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);

      if (dragDist < 6) {
        if (dragStartPos.current.isNew) {
          const occupied = placedDice
            .filter(d => d.id !== draggingId && d.slotIndex >= 0)
            .map(d => d.slotIndex);

          let firstEmptySlot = 0;
          while (occupied.includes(firstEmptySlot)) {
            firstEmptySlot++;
          }

          if (firstEmptySlot < targetLength) {
            const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + firstEmptySlot * diceSize;
            const y = isVertical ? baselineY - (firstEmptySlot + 1) * diceSize : slotY;

            setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, slotIndex: firstEmptySlot, tempSlotIndex: undefined } : d));
            playSnapTone(440);
          } else {
            setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
            playSnapTone(250);
          }
        } else {
          setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
          playSnapTone(250);
        }
      } else {
        if (dragged.y > rect.height - 20 || dragged.y < -20 || dragged.x < -20 || dragged.x > rect.width - 20) {
          setPlacedDice(prev => prev.filter(d => d.id !== draggingId));
          playSnapTone(250);
        } else if (dragged.tempSlotIndex !== undefined && dragged.tempSlotIndex >= 0) {
          const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + dragged.tempSlotIndex * diceSize;
          const y = isVertical ? baselineY - (dragged.tempSlotIndex + 1) * diceSize : slotY;

          setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, x, y, slotIndex: d.tempSlotIndex, tempSlotIndex: undefined } : d));
          playSnapTone(440);
        } else {
          setPlacedDice(prev => prev.map(d => d.id === draggingId ? { ...d, slotIndex: -1, tempSlotIndex: undefined } : d));
          playSnapTone(320);
        }
      }
    }

    setDraggingId(null);
  };

  const drawUnitSVG = (type, index, options = {}) => {
    const col = options.primary || unitColor;
    const str = options.stroke || strokeColor;
    const pip = options.pip || pipColor;
    const isVert = options.isVertical !== undefined ? options.isVertical : isVertical;
    
    if (type === 'dice') {
      const pips = (index % 6) + 1;
      return (
        <svg width={diceSize} height={diceSize} viewBox="0 0 60 60" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.12))', userSelect: 'none' }}>
          <rect x="2" y="5" width="54" height="52" rx="10" fill={str} />
          <rect x="2" y="2" width="54" height="50" rx="10" fill={col} stroke={str} strokeWidth="2" />
          <path d="M 6 6 Q 29 13 52 6" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
          {pips === 1 && <circle cx="30" cy="30" r="4.5" fill={pip} />}
          {pips === 2 && (
            <>
              <circle cx="16" cy="16" r="4.5" fill={pip} />
              <circle cx="44" cy="44" r="4.5" fill={pip} />
            </>
          )}
          {pips === 3 && (
            <>
              <circle cx="16" cy="16" r="4.5" fill={pip} />
              <circle cx="30" cy="30" r="4.5" fill={pip} />
              <circle cx="44" cy="44" r="4.5" fill={pip} />
            </>
          )}
          {pips === 4 && (
            <>
              <circle cx="16" cy="16" r="4.5" fill={pip} />
              <circle cx="44" cy="16" r="4.5" fill={pip} />
              <circle cx="16" cy="44" r="4.5" fill={pip} />
              <circle cx="44" cy="44" r="4.5" fill={pip} />
            </>
          )}
          {pips === 5 && (
            <>
              <circle cx="16" cy="16" r="4.5" fill={pip} />
              <circle cx="44" cy="16" r="4.5" fill={pip} />
              <circle cx="30" cy="30" r="4.5" fill={pip} />
              <circle cx="16" cy="44" r="4.5" fill={pip} />
              <circle cx="44" cy="44" r="4.5" fill={pip} />
            </>
          )}
          {pips === 6 && (
            <>
              <circle cx="16" cy="16" r="4.5" fill={pip} />
              <circle cx="16" cy="30" r="4.5" fill={pip} />
              <circle cx="16" cy="44" r="4.5" fill={pip} />
              <circle cx="44" cy="16" r="4.5" fill={pip} />
              <circle cx="44" cy="30" r="4.5" fill={pip} />
              <circle cx="44" cy="44" r="4.5" fill={pip} />
            </>
          )}
        </svg>
      );
    }

    if (type === 'cubes') {
      return (
        <svg width={diceSize} height={diceSize} viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))' }}>
          {isVert ? (
            <circle cx="25" cy="4" r="6" fill={col} stroke={str} strokeWidth="2" />
          ) : (
            <circle cx="46" cy="25" r="6" fill={col} stroke={str} strokeWidth="2" />
          )}
          <rect x="5" y="5" width="40" height="40" rx="6" fill={col} stroke={str} strokeWidth="2" />
          <rect x="9" y="9" width="32" height="32" rx="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" />
          <circle cx="25" cy="25" r="4" fill={str} opacity="0.3" />
        </svg>
      );
    }

    if (type === 'paperclips') {
      return (
        <svg width={diceSize} height={diceSize} viewBox="0 0 44 44" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))', transform: isVert ? 'rotate(90deg)' : 'none' }}>
          <rect width="44" height="44" fill="transparent" />
          <path
            d="M 12 14 L 12 30 A 10 10 0 0 0 32 30 L 32 12 A 7 7 0 0 0 18 12 L 18 30 A 4 4 0 0 0 26 30 L 26 18"
            fill="none"
            stroke={str || '#475569'}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (type === 'pennies') {
      return (
        <svg width={diceSize} height={diceSize} viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.12))' }}>
          <circle cx="25" cy="25" r="22" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          <circle cx="25" cy="25" r="18" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3 3" />
          <text x="25" y="27" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#78350f" style={{ userSelect: 'none' }}>1¢</text>
        </svg>
      );
    }

    // Default block
    return (
      <div style={{
        width: `${diceSize}px`,
        height: `${diceSize}px`,
        backgroundColor: col,
        border: `2px solid ${str}`,
        borderRadius: '6px'
      }} />
    );
  };

  // Render pre-placed row or tower
  const renderPreplacedUnits = (count, options = {}) => {
    const errorType = options.errorType || 'none';
    const isVert = options.isVertical !== undefined ? options.isVertical : isVertical;
    const startX = options.slotsStartX !== undefined ? options.slotsStartX : (isVert ? dimensions.slotsStartX : dimensions.lineStartX);

    return Array.from({ length: count }).map((_, i) => {
      let x = isVert ? startX : startX + i * diceSize;
      let y = isVert ? baselineY - (i + 1) * diceSize : (options.lineY ?? slotY);

      // Introduce Deliberate Errors for error-spotting mode
      if (errorType === 'gap' && !isVert) {
        x = startX + i * (diceSize + 8);
      } else if (errorType === 'overlap' && !isVert) {
        x = startX + i * (diceSize - 10);
      } else if (errorType === 'wrong_start' && !isVert) {
        x = startX + 40 + i * diceSize;
      } else if (errorType === 'gap' && isVert) {
        y = baselineY - (i + 1) * (diceSize + 8);
      } else if (errorType === 'overlap' && isVert) {
        y = baselineY - (i + 1) * (diceSize - 10);
      } else if (errorType === 'wrong_start' && isVert) {
        y = baselineY - 40 - (i + 1) * diceSize;
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${diceSize}px`,
            height: `${diceSize}px`,
            pointerEvents: 'none'
          }}
        >
          {drawUnitSVG(unitObject, i, { ...options, isVertical: isVert })}
        </div>
      );
    });
  };

  // Render addition blocks with two different colors
  const renderAdditionUnits = () => {
    const list = [];
    // First group
    for (let i = 0; i < firstLength; i++) {
      const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + i * diceSize;
      const y = isVertical ? baselineY - (i + 1) * diceSize : slotY;
      list.push(
        <div key={`f_${i}`} style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${diceSize}px`, height: `${diceSize}px` }}>
          {drawUnitSVG(unitObject, i, { primary: unitColor, stroke: strokeColor, pip: pipColor })}
        </div>
      );
    }
    // Second group
    for (let i = 0; i < secondLength; i++) {
      const totalIdx = firstLength + i;
      const x = isVertical ? dimensions.slotsStartX : dimensions.lineStartX + totalIdx * diceSize;
      const y = isVertical ? baselineY - (totalIdx + 1) * diceSize : slotY;
      list.push(
        <div key={`s_${i}`} style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${diceSize}px`, height: `${diceSize}px` }}>
          {drawUnitSVG(unitObject, totalIdx, { primary: secondaryColor, stroke: secondaryStroke, pip: pipColor })}
        </div>
      );
    }
    return list;
  };

  const renderHorizontalComparison = () => {
    const topY = 35;
    const bottomY = 95;
    const startX = dimensions.lineStartX;

    const firstWidth = firstLength * diceSize;
    const secondWidth = secondLength * diceSize;

    const shorterWidth = Math.min(firstWidth, secondWidth);
    const longerWidth = Math.max(firstWidth, secondWidth);
    const diffCubes = Math.abs(firstLength - secondLength);
    const isTopLonger = firstLength > secondLength;

    return (
      <>
        {/* Top Train Label & Train */}
        <div style={{ position: 'absolute', left: `${startX - 100}px`, top: `${topY + 12}px`, width: '90px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>
          {part.firstName}
        </div>
        {renderPreplacedUnits(firstLength, {
          errorType: 'none',
          slotsStartX: startX,
          isVertical: false,
          lineY: topY,
          primary: '#ef4444',
          stroke: '#b91c1c'
        })}

        {/* Bottom Train Label & Train */}
        <div style={{ position: 'absolute', left: `${startX - 100}px`, top: `${bottomY + 12}px`, width: '90px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>
          {part.secondName}
        </div>
        {renderPreplacedUnits(secondLength, {
          errorType: 'none',
          slotsStartX: startX,
          isVertical: false,
          lineY: bottomY,
          primary: '#3b82f6',
          stroke: '#1d4ed8'
        })}

        {/* Difference Shaded Area and Alignment Lines */}
        {diffCubes > 0 && (
          <>
            {/* Dashed line at end of shorter train */}
            <div style={{
              position: 'absolute',
              left: `${startX + shorterWidth}px`,
              top: `${topY}px`,
              width: '2px',
              height: `${bottomY - topY + diceSize}px`,
              borderLeft: '2px dashed #94a3b8',
              zIndex: 5
            }} />
            {/* Dashed line at end of longer train */}
            <div style={{
              position: 'absolute',
              left: `${startX + longerWidth}px`,
              top: `${topY}px`,
              width: '2px',
              height: `${bottomY - topY + diceSize}px`,
              borderLeft: '2px dashed #94a3b8',
              zIndex: 5
            }} />
            {/* Shaded difference overlay */}
            <div style={{
              position: 'absolute',
              left: `${startX + shorterWidth}px`,
              top: `${isTopLonger ? topY : bottomY}px`,
              width: `${longerWidth - shorterWidth}px`,
              height: `${diceSize}px`,
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              borderRadius: '6px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '900',
              color: '#15803d',
              zIndex: 6
            }}>
              +{diffCubes}
            </div>
          </>
        )}
      </>
    );
  };

  const renderCanvasContent = () => {

    // ── TEN FRAME ──────────────────────────────────────────────────────────
    if (layoutFamily === 'ten_frame') {
      const frameMax = part.frameMax || 10;
      const frameCount = part.frameCount || 1;
      const count = part.firstLength || 0;
      const renderFrame = (frameIndex) => {
        const startDot = frameIndex * 10;
        return (
          <div key={frameIndex} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '6px',
            padding: '10px',
            background: '#fff',
            border: '3px solid #334155',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const dotNum = startDot + i;
              const filled = dotNum < count;
              return (
                <div key={i} style={{
                  width: '44px', height: '44px',
                  borderRadius: '50%',
                  background: filled ? '#ef4444' : 'transparent',
                  border: filled ? '3px solid #b91c1c' : '3px dashed #94a3b8',
                  boxShadow: filled ? '0 2px 6px rgba(239,68,68,0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }} />
              );
            })}
          </div>
        );
      };
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', height: '100%', width: '100%', padding: '16px', boxSizing: 'border-box', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
            {Array.from({ length: frameCount }).map((_, fi) => renderFrame(fi))}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '4px 16px', borderRadius: '20px' }}>
            {count} / {frameMax}
          </div>
        </div>
      );
    }

    // ── NUMBER BONDS ────────────────────────────────────────────────────────
    if (layoutFamily === 'number_bonds') {
      const whole = part.bondWhole || (part.firstLength + part.secondLength);
      const partA = part.bondPartA;
      const partB = part.bondPartB;
      const missingA = partA === null || partA === undefined;
      const shownPart = missingA ? partB : partA;
      const circleStyle = (val, isMissing, color) => ({
        width: '80px', height: '80px', borderRadius: '50%',
        background: isMissing ? '#fff' : color,
        border: isMissing ? '4px dashed #94a3b8' : `4px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isMissing ? '28px' : '32px', fontWeight: '900',
        color: isMissing ? '#94a3b8' : '#fff',
        boxShadow: isMissing ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
        animation: isMissing ? 'pulse-dash 2s infinite ease-in-out' : 'none'
      });
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', padding: '16px', boxSizing: 'border-box' }}>
          {/* Whole circle */}
          <div style={circleStyle(whole, false, '#6366f1')}>{whole}</div>
          {/* Connecting lines */}
          <svg width="200" height="60" viewBox="0 0 200 60">
            <line x1="100" y1="0" x2="50" y2="55" stroke="#64748b" strokeWidth="3" strokeDasharray="6,3" />
            <line x1="100" y1="0" x2="150" y2="55" stroke="#64748b" strokeWidth="3" strokeDasharray="6,3" />
          </svg>
          {/* Parts row */}
          <div style={{ display: 'flex', gap: '80px', alignItems: 'center' }}>
            <div style={circleStyle(missingA ? '?' : partA, missingA, '#f59e0b')}>
              {missingA ? '?' : partA}
            </div>
            <div style={circleStyle(!missingA ? '?' : partB, !missingA, '#22c55e')}>
              {!missingA ? '?' : partB}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
            {shownPart} + ? = {whole}
          </div>
        </div>
      );
    }

    // ── NUMBER LINE ─────────────────────────────────────────────────────────
    if (layoutFamily === 'number_line') {
      const lineMax = part.lineMax || 10;
      const lineStep = part.lineStep || 1;
      const markerPos = part.markerPos || part.firstLength || 5;
      const ticks = [];
      for (let v = 0; v <= lineMax; v += lineStep) ticks.push(v);
      const pct = (markerPos / lineMax) * 100;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', padding: '20px 32px', boxSizing: 'border-box', gap: '12px' }}>
          <div style={{ position: 'relative', width: '100%', height: '80px' }}>
            {/* Main line */}
            <div style={{ position: 'absolute', top: '40px', left: '0', right: '0', height: '4px', background: '#334155', borderRadius: '2px' }} />
            {/* Tick marks + labels */}
            {ticks.map((v, i) => {
              const left = `${(v / lineMax) * 100}%`;
              return (
                <div key={i} style={{ position: 'absolute', left, top: '28px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '2px', height: '24px', background: '#334155' }} />
                  <span style={{ fontSize: lineMax >= 100 ? '10px' : '12px', fontWeight: '700', color: '#334155' }}>{v}</span>
                </div>
              );
            })}
            {/* Marker */}
            <div style={{ position: 'absolute', left: `${pct}%`, top: '0px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '16px solid #ef4444' }} />
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: '3px solid #b91c1c', marginTop: '-2px', boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }} />
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '4px 16px', borderRadius: '20px' }}>
            0 — {lineMax}  •  step {lineStep}
          </div>
        </div>
      );
    }

    // ── AREA GRID ───────────────────────────────────────────────────────────
    if (layoutFamily === 'area_grid') {
      const gridW = part.gridW || part.firstLength || 3;
      const gridH = part.gridH || part.secondLength || 3;
      const total = gridW * gridH;
      const isInteractive = part.interactionMode === 'click';
      const cellSize = Math.min(56, Math.floor(300 / Math.max(gridW, gridH)));
      const colors = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'];
      const fillColor = colors[(gridW + gridH) % colors.length];
      const emptyColor = '#f8fafc';
      const filledCount = filledCells.size;
      const allFilled = filledCount === total;

      const toggleCell = (i) => {
        if (isAnswered) return;
        setFilledCells(prev => {
          const next = new Set(prev);
          if (next.has(i)) next.delete(i);
          else next.add(i);
          playSnapTone(next.has(i) ? 440 : 330);
          return next;
        });
      };

      const fillAll = () => {
        if (isAnswered) return;
        setFilledCells(new Set(Array.from({ length: total }, (_, i) => i)));
      };

      const clearAll = () => {
        if (isAnswered) return;
        setFilledCells(new Set());
      };

      if (isInteractive) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '12px', boxSizing: 'border-box' }}>
            {/* Instruction badge */}
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', background: '#e2e8f0', padding: '4px 14px', borderRadius: '20px' }}>
              Click squares to fill them
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridW}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridH}, ${cellSize}px)`,
              gap: '3px',
              border: `3px solid ${allFilled ? '#22c55e' : '#334155'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: allFilled
                ? '0 0 0 4px rgba(34,197,94,0.25), 0 4px 16px rgba(0,0,0,0.1)'
                : '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              cursor: isAnswered ? 'default' : 'pointer',
              userSelect: 'none',
              flexShrink: 0
            }}>
              {Array.from({ length: total }).map((_, i) => {
                const filled = filledCells.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleCell(i)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: filled ? fillColor : emptyColor,
                      border: `1px solid ${filled ? 'rgba(0,0,0,0.12)' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.15s ease, transform 0.1s ease',
                      transform: filled ? 'scale(0.94)' : 'scale(1)',
                      cursor: isAnswered ? 'default' : 'pointer',
                      position: 'relative'
                    }}
                  >
                    {filled && (
                      <div style={{
                        width: cellSize * 0.35,
                        height: cellSize * 0.35,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.12)'
                      }} />
                    )}
                    {!filled && (
                      <div style={{
                        width: cellSize * 0.5,
                        height: cellSize * 0.5,
                        borderRadius: '50%',
                        border: '2px dashed #cbd5e1'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live counter + controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '900',
                color: allFilled ? '#16a34a' : '#334155',
                background: allFilled ? '#dcfce7' : '#f1f5f9',
                padding: '5px 18px',
                borderRadius: '20px',
                transition: 'all 0.3s ease',
                border: allFilled ? '2px solid #86efac' : '2px solid transparent'
              }}>
                {filledCount} / {total} filled {allFilled ? '✓' : ''}
              </div>
              {!isAnswered && filledCount > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    fontSize: '11px', fontWeight: '700', color: '#64748b',
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: '14px', padding: '4px 12px', cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
              {!isAnswered && filledCount < total && (
                <button
                  onClick={fillAll}
                  style={{
                    fontSize: '11px', fontWeight: '700', color: '#3b82f6',
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: '14px', padding: '4px 12px', cursor: 'pointer'
                  }}
                >
                  Fill all
                </button>
              )}
            </div>

            {/* Dimension label */}
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
              {gridW} columns × {gridH} rows
            </div>
          </div>
        );
      }

      // ── STATIC mode (SOM.32 / SOM.33) ──────────────────────────────────
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridW}, ${cellSize}px)`, gridTemplateRows: `repeat(${gridH}, ${cellSize}px)`, gap: '2px', border: '3px solid #334155', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{ width: cellSize, height: cellSize, background: fillColor, border: '1px solid rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: cellSize * 0.3, height: cellSize * 0.3, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '4px 16px', borderRadius: '20px' }}>
            {gridW} × {gridH} = {total} squares
          </div>
        </div>
      );
    }


    // ── DIVISION / SHARING ──────────────────────────────────────────────────
    if (layoutFamily === 'division') {
      const groups = part.groupCount || part.secondLength || 2;
      const perGroup = part.groupSize || part.firstLength || 3;
      const total = groups * perGroup;
      const groupColors = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca'];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#475569', background: '#e2e8f0', padding: '5px 16px', borderRadius: '20px' }}>
            {total} shared into {groups} equal groups
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: groups }).map((_, g) => (
              <div key={g} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(perGroup, 3)}, 1fr)`, gap: '4px', padding: '10px', background: groupColors[g % groupColors.length], borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', boxShadow: '0 3px 8px rgba(0,0,0,0.08)', minWidth: '60px' }}>
                  {Array.from({ length: perGroup }).map((_, i) => (
                    <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ef4444', border: '2px solid #b91c1c', boxShadow: '0 2px 4px rgba(239,68,68,0.3)' }} />
                  ))}
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Group {g + 1}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>
            {total} ÷ {groups} = ?
          </div>
        </div>
      );
    }

    // ── MONEY / COINS ───────────────────────────────────────────────────────
    if (layoutFamily === 'money') {
      const coins = part.coins || [1, 2, 5];
      const total = coins.reduce((s, c) => s + c, 0);
      const coinStyle = (val) => {
        const meta = {
          1: { bg: '#fbbf24', border: '#d97706', label: '₹1', size: 48 },
          2: { bg: '#a3e635', border: '#65a30d', label: '₹2', size: 52 },
          5: { bg: '#c084fc', border: '#9333ea', label: '₹5', size: 58 }
        };
        return meta[val] || meta[1];
      };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {coins.map((c, i) => {
              const m = coinStyle(c);
              return (
                <div key={i} style={{
                  width: m.size, height: m.size, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${m.bg}, ${m.border})`,
                  border: `4px solid ${m.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '900', color: '#1e293b',
                  boxShadow: `0 4px 10px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
                  textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                }}>
                  {m.label}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
            {coins.map((c, i) => (
              <span key={i} style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '12px' }}>₹{c}</span>
            ))}
            <span style={{ fontWeight: '900', color: '#334155' }}>= ₹{total}</span>
          </div>
        </div>
      );
    }

    // ── ODD / EVEN ──────────────────────────────────────────────────────────
    if (layoutFamily === 'odd_even') {
      const num = part.oddEvenCount || part.firstLength || 4;
      const isEven = num % 2 === 0;
      const pairs = Math.floor(num / 2);
      const hasLeftover = num % 2 === 1;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', paddingTop: '28px' }}>
            {Array.from({ length: pairs }).map((_, p) => (
              <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
                {/* Pairing arch */}
                <svg width="72" height="24" viewBox="0 0 72 24" style={{ position: 'absolute', top: '-24px' }}>
                  <path d="M 4 24 Q 36 0 68 24" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1].map(ci => (
                    <div key={ci} style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#6366f1', border: '2px solid #4f46e5', boxShadow: '0 2px 6px rgba(99,102,241,0.4)' }} />
                  ))}
                </div>
              </div>
            ))}
            {hasLeftover && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '32px', height: '16px' }} /> {/* spacer */}
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ef4444', border: '2px solid #b91c1c', boxShadow: '0 2px 6px rgba(239,68,68,0.5)', animation: 'pulse-dash 1.5s infinite ease-in-out' }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>{num} cubes</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>{pairs} pair{pairs !== 1 ? 's' : ''}{hasLeftover ? ' + 1 leftover' : ' — no leftover'}</span>
          </div>
        </div>
      );
    }

    if (layoutFamily === 'equal_groups') {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '32px',
          height: '100%',
          width: '100%',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          {Array.from({ length: groupCount }).map((_, g) => (
            <div
              key={`group_${g}`}
              style={{
                background: '#ffffff',
                border: '2px solid #cbd5e1',
                borderRadius: '16px',
                padding: '16px',
                minWidth: '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Group {g + 1}
              </div>
              {/* Stacked blocks inside the group */}
              <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px' }}>
                {Array.from({ length: groupSize }).map((_, i) => (
                  <div key={i} style={{ width: `${diceSize}px`, height: `${diceSize}px` }}>
                    {drawUnitSVG('cubes', g * groupSize + i, { primary: unitColor, stroke: strokeColor })}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                {groupSize} cubes
              </div>
            </div>
          ))}
          
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '800',
            color: '#1e3a8a',
            background: 'rgba(239, 246, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            padding: '10px 16px',
            borderTop: '1px solid #dbeafe',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px'
          }}>
            <span>{Array.from({ length: groupCount }).map(() => groupSize).join(' + ')} = {groupCount * groupSize}</span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span>{groupCount} × {groupSize} = {groupCount * groupSize}</span>
          </div>
        </div>
      );
    }

    if (layoutFamily === 'graphs') {
      const maxGraphValue = 8;
      const topOffset = 40;
      const bottomOffset = 240; // Adjusted for height constraints
      const cellHeight = (bottomOffset - topOffset) / maxGraphValue;
      const colWidth = Math.min(56, diceSize);

      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Title Header */}
          <div style={{ position: 'absolute', top: '10px', left: '0', right: '0', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Favorite Fruits block graph
          </div>

          {/* Grid lines */}
          {Array.from({ length: maxGraphValue + 1 }).map((_, val) => {
            const y = bottomOffset - (val * (bottomOffset - topOffset)) / maxGraphValue;
            return (
              <div key={val} style={{ position: 'absolute', left: '60px', right: '40px', top: `${y}px`, height: '1px', background: val === 0 ? '#475569' : '#e2e8f0', zIndex: 2 }}>
                <span style={{ position: 'absolute', left: '-25px', top: '-8px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', width: '20px', textAlign: 'right' }}>
                  {val}
                </span>
              </div>
            );
          })}

          {/* Apples Column */}
          {(() => {
            const xPercent = 38;
            const length = firstLength;
            return (
              <div style={{ position: 'absolute', left: `${xPercent}%`, transform: 'translateX(-50%)', top: `${topOffset}px`, height: `${bottomOffset - topOffset}px`, width: `${colWidth}px`, zIndex: 3 }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column-reverse' }}>
                  {Array.from({ length }).map((_, i) => (
                    <div key={i} style={{ width: `${colWidth}px`, height: `${cellHeight}px`, padding: '1px', boxSizing: 'border-box' }}>
                      <svg width="100%" height="100%" viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))' }}>
                        <rect x="2" y="2" width="46" height="46" rx="6" fill="#ef4444" stroke="#b91c1c" strokeWidth="2.5" />
                        <rect x="6" y="6" width="38" height="38" rx="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" />
                        <circle cx="25" cy="25" r="4" fill="#b91c1c" opacity="0.3" />
                      </svg>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: `${bottomOffset - topOffset + 8}px`, left: '-40px', width: '124px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '20px' }}>🍎</span>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b' }}>{part.firstName}</span>
                </div>
              </div>
            );
          })()}

          {/* Bananas Column */}
          {(() => {
            const xPercent = 68;
            const length = secondLength;
            return (
              <div style={{ position: 'absolute', left: `${xPercent}%`, transform: 'translateX(-50%)', top: `${topOffset}px`, height: `${bottomOffset - topOffset}px`, width: `${colWidth}px`, zIndex: 3 }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column-reverse' }}>
                  {Array.from({ length }).map((_, i) => (
                    <div key={i} style={{ width: `${colWidth}px`, height: `${cellHeight}px`, padding: '1px', boxSizing: 'border-box' }}>
                      <svg width="100%" height="100%" viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))' }}>
                        <rect x="2" y="2" width="46" height="46" rx="6" fill="#eab308" stroke="#a16207" strokeWidth="2.5" />
                        <rect x="6" y="6" width="38" height="38" rx="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" />
                        <circle cx="25" cy="25" r="4" fill="#a16207" opacity="0.3" />
                      </svg>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: `${bottomOffset - topOffset + 8}px`, left: '-40px', width: '124px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '20px' }}>🍌</span>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b' }}>{part.secondName}</span>
                </div>
              </div>
            );
          })()}
        </div>
      );
    }

    if (layoutFamily === 'place_value') {
      const drawTensRod = () => (
        <svg width="18" height="130" viewBox="0 0 50 250" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.12))' }}>
          <rect x="5" y="5" width="40" height="240" rx="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2.5" />
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={i}>
              {i > 0 && <line x1="5" y1={5 + i * 24} x2="45" y2={5 + i * 24} stroke="#1d4ed8" strokeWidth="2" />}
              <rect x="9" y={8 + i * 24} width="32" height="18" rx="3" fill="none" stroke="white" strokeWidth="1.2" opacity="0.25" />
            </g>
          ))}
        </svg>
      );

      const drawOnesCube = () => (
        <svg width="24" height="24" viewBox="0 0 50 50" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))' }}>
          <rect x="4" y="4" width="42" height="42" rx="6" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
          <rect x="8" y="8" width="34" height="34" rx="4" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" />
          <circle cx="25" cy="25" r="4" fill="#15803d" opacity="0.3" />
        </svg>
      );

      const drawHundredsFlat = () => (
        <svg width="48" height="48" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}>
          <rect x="2" y="2" width="96" height="96" rx="4" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
          {Array.from({ length: 9 }).map((_, i) => {
            const pos = 2 + (i + 1) * 9.6;
            return (
              <g key={i}>
                <line x1={pos} y1="2" x2={pos} y2="98" stroke="#b91c1c" strokeWidth="1" />
                <line x1="2" y1={pos} x2="98" y2={pos} stroke="#b91c1c" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      );

      const drawThousandsCube = () => (
        <svg width="52" height="52" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.18))' }}>
          <path d="M 60 10 L 105 32.5 L 60 55 L 15 32.5 Z" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
          <path d="M 15 32.5 L 60 55 L 60 110 L 15 87.5 Z" fill="#9333ea" stroke="#7e22ce" strokeWidth="1.5" />
          <path d="M 60 55 L 105 32.5 L 105 87.5 L 60 110 Z" fill="#7e22ce" stroke="#6b21a8" strokeWidth="1.5" />
        </svg>
      );

      const placeValueCols = [];
      const tCount = Number(part.thousands ?? 0);
      const hCount = Number(part.hundreds ?? 0);
      const tenCount = Number(part.tens ?? 0);
      const oCount = Number(part.ones ?? 0);

      if (tCount > 0) {
        placeValueCols.push({
          label: 'THOUSANDS',
          count: tCount,
          color: '#f3e8ff',
          textColor: '#6b21a8',
          border: '#e9d5ff',
          render: drawThousandsCube,
          desc: `${tCount} ${tCount === 1 ? 'thousand' : 'thousands'} (${tCount * 1000} cubes)`,
          width: '56px'
        });
      }
      if (hCount > 0) {
        placeValueCols.push({
          label: 'HUNDREDS',
          count: hCount,
          color: '#fee2e2',
          textColor: '#991b1b',
          border: '#fca5a5',
          render: drawHundredsFlat,
          desc: `${hCount} ${hCount === 1 ? 'hundred' : 'hundreds'} (${hCount * 100} cubes)`,
          width: '52px'
        });
      }
      if (tenCount > 0) {
        placeValueCols.push({
          label: 'TENS',
          count: tenCount,
          color: '#eff6ff',
          textColor: '#1e40af',
          border: '#bfdbfe',
          render: drawTensRod,
          desc: `${tenCount} ${tenCount === 1 ? 'ten' : 'tens'} (${tenCount * 10} cubes)`,
          width: '20px',
          isRow: true
        });
      }
      if (oCount > 0) {
        placeValueCols.push({
          label: 'ONES',
          count: oCount,
          color: '#f0fdf4',
          textColor: '#166534',
          border: '#bbf7d0',
          render: drawOnesCube,
          desc: `${oCount} ${oCount === 1 ? 'one' : 'ones'} (${oCount} cubes)`,
          width: '28px'
        });
      }

      if (placeValueCols.length === 0) {
        const fbTens = 1;
        const fbOnes = secondLength || 4;
        placeValueCols.push({
          label: 'TENS',
          count: fbTens,
          color: '#eff6ff',
          textColor: '#1e40af',
          border: '#bfdbfe',
          render: drawTensRod,
          desc: `${fbTens} ten (${fbTens * 10} cubes)`,
          width: '20px',
          isRow: true
        });
        placeValueCols.push({
          label: 'ONES',
          count: fbOnes,
          color: '#f0fdf4',
          textColor: '#166534',
          border: '#bbf7d0',
          render: drawOnesCube,
          desc: `${fbOnes} ones (${fbOnes} cubes)`,
          width: '28px'
        });
      }

      return (
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#ffffff',
          boxSizing: 'border-box'
        }}>
          {placeValueCols.map((col, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                borderRight: index < placeValueCols.length - 1 ? '2px dashed #cbd5e1' : 'none',
                boxSizing: 'border-box'
              }}
            >
              <div style={{
                background: col.color,
                color: col.textColor,
                border: `1px solid ${col.border}`,
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px'
              }}>
                {col.label}
              </div>
              <div style={col.isRow ? {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '3px',
                justifyContent: 'center',
                alignItems: 'flex-end',
                height: '260px',
                width: '100%',
                overflow: 'hidden',
                padding: '0 4px',
                boxSizing: 'border-box'
              } : {
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, ${col.width})`,
                gap: '6px',
                justifyContent: 'center',
                alignContent: 'center',
                alignItems: 'center',
                height: '260px',
                width: '100%',
                overflow: 'hidden'
              }}>
                {Array.from({ length: col.count }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {col.render()}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                {col.desc}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (layoutFamily === 'subtraction') {
      const toggleRemoved = (idx) => {
        if (isAnswered) return;
        setRemovedIndices(prev => {
          const next = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
          playSnapTone(next.includes(idx) ? 300 : 400);
          return next;
        });
      };

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          height: '100%',
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#475569', background: '#e2e8f0', padding: '6px 16px', borderRadius: '20px' }}>
            Click {part.subCount} cubes to take them away
          </div>

          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
            {Array.from({ length: targetLength }).map((_, i) => {
              const isRemoved = removedIndices.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleRemoved(i)}
                  style={{
                    width: `${diceSize}px`,
                    height: `${diceSize}px`,
                    cursor: isAnswered ? 'default' : 'pointer',
                    position: 'relative',
                    opacity: isRemoved ? 0.25 : 1,
                    transform: isRemoved ? 'scale(0.8)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {drawUnitSVG(unitObject, i, { primary: unitColor, stroke: strokeColor })}
                  {isRemoved && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      fontWeight: '900',
                      fontSize: '26px',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      pointerEvents: 'none'
                    }}>
                      ✕
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            fontSize: '20px',
            fontWeight: '900',
            color: '#1e3a8a',
            background: '#eff6ff',
            padding: '8px 24px',
            borderRadius: '16px',
            border: '1.5px solid #dbeafe',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
          }}>
            {targetLength} − {removedIndices.length} = {targetLength - removedIndices.length}
          </div>
        </div>
      );
    }

    // Default Canvas Layout Branch (Measurement, Patterns, and standard Comparison layouts)
    const allSlotsFilled = layoutFamily === 'patterns' && Array.from({ length: targetLength }).every((_, i) => 
      placedDice.some(d => d.slotIndex === i)
    );

    return (
      <>
        {/* Scoped CSS animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulse-dash {
            0% { border-color: #bae6fd; box-shadow: 0 0 0 0px rgba(186, 230, 253, 0.4); }
            50% { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25); }
            100% { border-color: #bae6fd; box-shadow: 0 0 0 0px rgba(186, 230, 253, 0.4); }
          }
          @keyframes success-glow {
            0% { box-shadow: 0 0 4px #10b981; border-color: #10b981; }
            50% { box-shadow: 0 0 16px #10b981; border-color: #34d399; }
            100% { box-shadow: 0 0 4px #10b981; border-color: #10b981; }
          }
        `}} />

        {/* Patterns specific headers and badge */}
        {layoutFamily === 'patterns' && (
          <>
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 30,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
              pointerEvents: 'none'
            }}>
              {patternRule} Pattern
            </div>
            {allSlotsFilled && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '90px',
                zIndex: 30,
                background: '#ecfdf5',
                border: '1.5px solid #10b981',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: '800',
                color: '#065f46',
                animation: 'success-glow 1.5s infinite ease-in-out',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                pointerEvents: 'none'
              }}>
                Pattern Complete! 🎉
              </div>
            )}
            {/* Pattern group backgrounds */}
            {(() => {
              const numGroups = Math.ceil(targetLength / patternGroupSize);
              return Array.from({ length: numGroups }).map((_, g) => {
                const startIdx = g * patternGroupSize;
                const endIdx = Math.min(targetLength, (g + 1) * patternGroupSize);
                const count = endIdx - startIdx;
                const x = dimensions.lineStartX + startIdx * diceSize;
                const width = count * diceSize;
                return (
                  <div
                    key={`group_${g}`}
                    style={{
                      position: 'absolute',
                      left: `${x - 4}px`,
                      top: `${slotY - 4}px`,
                      width: `${width + 8}px`,
                      height: `${diceSize + 8}px`,
                      backgroundColor: g % 2 === 0 ? 'rgba(59, 130, 246, 0.03)' : 'rgba(16, 185, 129, 0.03)',
                      border: '1.5px dashed rgba(148, 163, 184, 0.25)',
                      borderRadius: '12px',
                      zIndex: 1,
                      pointerEvents: 'none'
                    }}
                  />
                );
              });
            })()}
          </>
        )}

        {/* COMPARISON LAYOUT MODE */}
        {layoutMode === 'compare_two_objects' ? (
          layoutFamily === 'comparison' && orientation === 'horizontal' ? (
            renderHorizontalComparison()
          ) : (
            <>
              {/* Ground Line */}
              <div style={{ position: 'absolute', left: '20px', right: '20px', top: `${baselineY}px`, height: '4px', background: '#94a3b8', borderRadius: '999px' }} />

              {/* Left Column Object & Stack */}
              <div style={{ position: 'absolute', left: `${dimensions.width / 4 - 60}px`, bottom: `${canvasHeight - baselineY}px`, width: '120px', height: `${firstLength * diceSize}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {part.firstImage && <img src={part.firstImage} alt={part.firstName} draggable={false} style={{ height: '100%', width: 'auto', objectFit: 'contain', objectPosition: 'bottom right', pointerEvents: 'none', userSelect: 'none' }} />}
              </div>
              {/* Left Column Stack */}
              {renderPreplacedUnits(firstLength, {
                errorType: 'none',
                slotsStartX: dimensions.width / 4 + 40,
                isVertical: true
              })}
              {/* Left Name Label */}
              <div style={{ position: 'absolute', left: `${dimensions.width / 4 - 50}px`, top: `${baselineY + 10}px`, width: '100px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                {part.firstName}
              </div>

              {/* Right Column Object & Stack */}
              <div style={{ position: 'absolute', left: `${(3 * dimensions.width) / 4 - 80}px`, bottom: `${canvasHeight - baselineY}px`, width: '120px', height: `${secondLength * diceSize}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {part.secondImage && <img src={part.secondImage} alt={part.secondName} draggable={false} style={{ height: '100%', width: 'auto', objectFit: 'contain', objectPosition: 'bottom right', pointerEvents: 'none', userSelect: 'none' }} />}
              </div>
              {/* Right Column Stack */}
              {renderPreplacedUnits(secondLength, {
                errorType: 'none',
                slotsStartX: (3 * dimensions.width) / 4 + 20,
                isVertical: true
              })}
              {/* Right Name Label */}
              <div style={{ position: 'absolute', left: `${(3 * dimensions.width) / 4 - 70}px`, top: `${baselineY + 10}px`, width: '100px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                {part.secondName}
              </div>

              {/* Enhanced Comparison Guides */}
              {layoutFamily === 'comparison' && (() => {
                const tallerLength = Math.max(firstLength, secondLength);
                const shorterLength = Math.min(firstLength, secondLength);
                const diff = tallerLength - shorterLength;
                const isLeftTaller = firstLength > secondLength;

                const leftX = dimensions.width / 4 + 40;
                const rightX = (3 * dimensions.width) / 4 + 20;

                const yTaller = baselineY - tallerLength * diceSize;
                const yShorter = baselineY - shorterLength * diceSize;

                return diff > 0 ? (
                  <>
                    <div style={{
                      position: 'absolute',
                      left: `${Math.min(leftX, rightX) + diceSize}px`,
                      width: `${Math.abs(rightX - leftX) - diceSize}px`,
                      top: `${yShorter}px`,
                      height: '2px',
                      borderTop: '2px dashed #94a3b8',
                      zIndex: 5
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: `${isLeftTaller ? leftX + diceSize : rightX + diceSize}px`,
                      width: '60px',
                      top: `${yTaller}px`,
                      height: '2px',
                      borderTop: '2px dashed #94a3b8',
                      zIndex: 5
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: `${isLeftTaller ? leftX + diceSize + 10 : rightX - 70}px`,
                      top: `${yTaller}px`,
                      width: '50px',
                      height: `${diff * diceSize}px`,
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '2px solid #22c55e',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '900',
                      color: '#15803d',
                      zIndex: 6
                    }}>
                      +{diff}
                    </div>
                  </>
                ) : null;
              })()}
            </>
          )
        ) : isVertical ? (
          /* VERTICAL LAYOUT MODES */
          <>
            {/* Ground Line */}
            {(layoutFamily === 'measurement' || layoutFamily === 'comparison') && (
              <div style={{ position: 'absolute', left: '20px', right: '20px', top: `${baselineY}px`, height: '4px', background: '#94a3b8', borderRadius: '999px', pointerEvents: 'none' }} />
            )}

            {/* Object Image */}
            {objectImage && (
              <img
                src={objectImage}
                alt={objectName}
                draggable={false}
                style={{
                  position: 'absolute',
                  right: `${dimensions.width - dimensions.slotsStartX + 24}px`,
                  bottom: `${canvasHeight - baselineY}px`,
                  height: `${targetLength * diceSize}px`,
                  width: 'auto',
                  maxHeight: `${targetLength * diceSize}px`,
                  objectFit: 'contain',
                  objectPosition: 'bottom right',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              />
            )}

            {/* Empty Snap Guides (Only for drag_to_measure) */}
            {layoutMode === 'drag_to_measure' && Array.from({ length: targetLength }).map((_, i) => {
              const isOccupied = placedDice.some(d => d.slotIndex === i);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${dimensions.slotsStartX}px`,
                    top: `${baselineY - (i + 1) * diceSize}px`,
                    width: `${diceSize}px`,
                    height: `${diceSize}px`,
                    border: '2px dashed #bae6fd',
                    borderRadius: '8px',
                    background: isOccupied ? 'transparent' : 'rgba(224, 242, 254, 0.4)',
                    pointerEvents: 'none'
                  }}
                />
              );
            })}

            {/* Render Static Units for Pre-placed & Error Spotting */}
            {(layoutMode === 'vertical_stack' || layoutMode === 'wrong_measure_fix') && renderPreplacedUnits(targetLength, { errorType: part.errorType || 'none' })}

            {/* Render Addition Stack */}
            {layoutMode === 'add_heights' && renderAdditionUnits()}

            {/* Render Draggable Placed Dice */}
            {layoutMode === 'drag_to_measure' && placedDice.map((dice) => {
              const isDragging = dice.id === draggingId;
              const col = dice.isPrefilled ? (dice.color || unitColor) : (dice.color || secondaryColor);
              const stroke = dice.isPrefilled ? (dice.stroke || strokeColor) : (dice.stroke || secondaryStroke);
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
                    cursor: isAnswered ? 'default' : (dice.isPrefilled ? 'default' : (isDragging ? 'grabbing' : 'grab')),
                    touchAction: 'none',
                    zIndex: isDragging ? 50 : 10,
                    transition: isDragging ? 'none' : 'left 0.12s ease-out, top 0.12s ease-out'
                  }}
                >
                  {drawUnitSVG(unitObject, dice.pips, { primary: col, stroke: stroke, pip: pipColor })}
                </div>
              );
            })}
          </>
        ) : (
          /* HORIZONTAL LAYOUT MODES */
          <>
            {/* Target line (Guide Line) */}
            {layoutFamily === 'measurement' && (
              <div style={{ 
                position: 'absolute', 
                left: `${dimensions.lineStartX}px`, 
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
            )}

            {/* Empty Snap Guides (Only for drag_to_measure) */}
            {layoutMode === 'drag_to_measure' && Array.from({ length: targetLength }).map((_, i) => {
              const isOccupied = placedDice.some(d => d.slotIndex === i);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${dimensions.lineStartX + i * diceSize}px`,
                    top: `${slotY}px`,
                    width: `${diceSize}px`,
                    height: `${diceSize}px`,
                    border: '2px dashed #bae6fd',
                    borderRadius: '8px',
                    background: isOccupied ? 'transparent' : 'rgba(224, 242, 254, 0.4)',
                    pointerEvents: 'none',
                    animation: layoutFamily === 'patterns' ? 'pulse-dash 2s infinite ease-in-out' : 'none'
                  }}
                />
              );
            })}

            {/* Render Static Units for Pre-placed & Error Spotting */}
            {(layoutMode === 'horizontal_row' || layoutMode === 'wrong_measure_fix') && renderPreplacedUnits(targetLength, { errorType: part.errorType || 'none' })}

            {/* Render Addition Stack */}
            {layoutMode === 'add_lengths' && renderAdditionUnits()}

            {/* Render Draggable Placed Dice */}
            {layoutMode === 'drag_to_measure' && placedDice.map((dice) => {
              const isDragging = dice.id === draggingId;
              const col = dice.isPrefilled ? (dice.color || unitColor) : (dice.color || secondaryColor);
              const stroke = dice.isPrefilled ? (dice.stroke || strokeColor) : (dice.stroke || secondaryStroke);
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
                    cursor: isAnswered ? 'default' : (dice.isPrefilled ? 'default' : (isDragging ? 'grabbing' : 'grab')),
                    touchAction: 'none',
                    zIndex: isDragging ? 50 : 10,
                    transition: isDragging ? 'none' : 'left 0.12s ease-out, top 0.12s ease-out'
                  }}
                >
                  {drawUnitSVG(unitObject, dice.pips, { primary: col, stroke: stroke, pip: pipColor })}
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  return (
    <div 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: '100%', maxWidth: '640px', margin: '8px auto', display: 'flex', flexDirection: 'column', gap: '12px', touchAction: 'none' }}
    >
      {/* Main Workspace Canvas */}
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: `${canvasHeight}px`,
          background: '#f0f9ff', 
          border: '1px solid #e0f2fe', 
          borderRadius: '20px', 
          position: 'relative', 
          overflow: 'hidden', 
          boxShadow: '0 4px 12px rgba(186, 230, 253, 0.15)'
        }}
      >
        {/* Reset Button (Only for drag mode) */}
        {layoutMode === 'drag_to_measure' && layoutFamily !== 'subtraction' && (
          <button
            type="button"
            disabled={isAnswered}
            onClick={() => {
              setPlacedDice(prev => prev.filter(d => d.isPrefilled));
              playSnapTone(220);
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 30,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              opacity: isAnswered ? 0.5 : 1
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
        )}

        {renderCanvasContent()}
      </div>

      {/* Interactive Tray (Only for drag_to_measure layouts except subtraction) */}
      {layoutMode === 'drag_to_measure' && layoutFamily !== 'subtraction' && (
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
            {isVertical ? `Click or drag ${unitObject} next to the object` : `Click or drag ${unitObject} from tray to measure`}
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {(part.trayColors || (unitObject === 'dice' ? [3, 6, 5, 1, 4, 2] : [1])).map((item, idx) => {
              const pips = typeof item === 'number' ? item : 1;
              const col = typeof item === 'string' ? item : (firstLength > 0 ? secondaryColor : unitColor);
              const getStrokeForColor = (c) => {
                if (c === '#ef4444') return '#b91c1c';
                if (c === '#3b82f6') return '#1d4ed8';
                if (c === '#22c55e') return '#15803d';
                if (c === '#eab308') return '#a16207';
                if (c === '#a855f7') return '#7e22ce';
                return '#475569';
              };
              const stroke = typeof item === 'string' ? getStrokeForColor(item) : (firstLength > 0 ? secondaryStroke : strokeColor);
              return (
                <div
                  key={idx}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    spawnDice(pips, e.clientX, e.clientY, e, col, stroke);
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
                  {drawUnitSVG(unitObject, pips, { primary: col, stroke: stroke, pip: pipColor })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PlaySoundCard({ question }) {
  const soundText = question?.soundText || '';
  const soundUrl = question?.soundUrl || null;
  const voice = question?.voice || 'Kore';

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '12px 0' }}>
      <button
        type="button"
        onClick={() => speakText(soundText, voice, soundUrl)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          outline: 'none',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Play sound"
        aria-label="Play sound"
      >
        <svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          {/* Lime green card background */}
          <rect width="160" height="160" rx="20" fill="#a3e635" stroke="#84cc16" strokeWidth="2" />
          
          {/* White play circle */}
          <circle cx="98" cy="80" r="32" fill="#ffffff" />
          
          {/* Blue play triangle */}
          <polygon points="94,68 94,92 112,80" fill="#0ea5e9" />
          
          {/* Cupped-ear mascot on the left */}
          <g transform="translate(15, 30)">
            {/* Hair (brown) */}
            <path d="M 15 10 C 10 10, 5 20, 5 35 C 5 50, 10 70, 15 80 C 17 80, 20 70, 18 60 C 18 50, 23 45, 23 35 C 23 20, 20 10, 15 10 Z" fill="#78350f" />
            
            {/* Face/Neck/Ear base (flesh-toned) */}
            <path d="M 23 35 C 23 30, 29 30, 29 40 C 29 48, 24 50, 23 48" fill="#fed7aa" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
            {/* Inner ear detail */}
            <path d="M 25 38 C 25 36, 27 36, 27 40 C 27 43, 26 44, 25 44" fill="none" stroke="#fdba74" strokeWidth="1" />
            
            {/* Hand cupped behind the ear */}
            {/* Arm/Wrist */}
            <path d="M 12 90 L 25 70 C 27 65, 30 65, 33 70 L 33 90" fill="#fed7aa" />
            {/* Hand palm & fingers */}
            <path d="M 28 72 C 32 60, 32 50, 32 46 C 32 44, 34 44, 34 46 C 34 50, 35 60, 32 72 Z" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
            <path d="M 33 65 C 36 55, 37 48, 37 45 C 37 43, 39 43, 39 45 C 39 49, 38 57, 35 68 Z" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
            <path d="M 36 68 C 40 58, 41 51, 41 48 C 41 46, 43 46, 43 48 C 43 52, 42 59, 38 71 Z" fill="#fed7aa" stroke="#fdba74" strokeWidth="1" />
          </g>
        </svg>
      </button>
    </div>
  );
}

// ─── Balloon Tap Part ────────────────────────────────────────────────────────
// Animated letters float up as colourful balloons; student taps the target one.
const BALLOON_COLORS = [
  { body: '#f87171', shine: '#fca5a5', knot: '#dc2626', shadow: '#991b1b' }, // red
  { body: '#fb923c', shine: '#fdba74', knot: '#ea580c', shadow: '#9a3412' }, // orange
  { body: '#facc15', shine: '#fde68a', knot: '#ca8a04', shadow: '#713f12' }, // yellow
  { body: '#4ade80', shine: '#86efac', knot: '#16a34a', shadow: '#14532d' }, // green
  { body: '#60a5fa', shine: '#93c5fd', knot: '#2563eb', shadow: '#1e3a8a' }, // blue
  { body: '#c084fc', shine: '#e9d5ff', knot: '#9333ea', shadow: '#581c87' }, // purple
  { body: '#f472b6', shine: '#f9a8d4', knot: '#db2777', shadow: '#831843' }, // pink
];

function BalloonSvg({ letter, color, size = 90 }) {
  const { body, shine, knot } = color;
  return (
    <svg viewBox="0 0 80 110" width={size} height={size * 1.37} xmlns="http://www.w3.org/2000/svg">
      {/* balloon body */}
      <ellipse cx="40" cy="42" rx="32" ry="36" fill={body} />
      {/* shine highlight */}
      <ellipse cx="28" cy="24" rx="10" ry="12" fill={shine} opacity="0.55" />
      {/* knot */}
      <polygon points="37,77 43,77 40,84" fill={knot} />
      {/* string */}
      <path d="M40 84 Q45 95 40 108" stroke={knot} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* letter */}
      <text
        x="40" y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="30"
        fontWeight="900"
        fontFamily="'Outfit','Fredoka','Arial Rounded MT Bold',sans-serif"
        fill="white"
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
      >
        {letter}
      </text>
    </svg>
  );
}

function BalloonTapPart({ part, question, userAnswer, onAnswer, isAnswered }) {
  // part.letters   — array of letter objects: [{letter, colorIndex}]
  // part.target    — the letter the student must tap
  // part.hitsNeeded— how many correct taps to win (default 3)
  const target      = part.target || question.targetLetter || 'A';
  const hitsNeeded  = part.hitsNeeded || 3;
  const allLetters  = part.letters  || [];
  const audioUrl    = question.audioUrl;

  // ── state ──────────────────────────────────────────────────────────────────
  const [balloons, setBalloons] = useState(() => []);
  const [hits, setHits]         = useState(0);
  const [bursts, setBursts]     = useState([]);
  const [shakeIds, setShakeIds] = useState(new Set());
  const nextId   = useRef(0);
  const timerRef = useRef(null);
  const done     = hits >= hitsNeeded;

  // ── CSS keyframes injected once ────────────────────────────────────────────
  useEffect(() => {
    const styleId = 'balloon-tap-styles';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
        @keyframes balloonFloat {
          0%   { transform: translateY(0)    rotate(-2deg); opacity: 1; }
          50%  { transform: translateY(-45%) rotate(2deg);  opacity: 1; }
          100% { transform: translateY(-95%) rotate(-1deg); opacity: 0; }
        }
        @keyframes balloonPop {
          0%   { transform: scale(1);    opacity: 1; }
          40%  { transform: scale(1.35); opacity: 0.8; }
          100% { transform: scale(0);   opacity: 0; }
        }
        @keyframes burstParticle {
          0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
          100% { transform: translate(var(--bx), var(--by)) scale(0); opacity: 0; }
        }
        @keyframes balloonShake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-8px) rotate(-6deg); }
          75%       { transform: translateX(8px)  rotate(6deg); }
        }
        .balloon-float  { animation: balloonFloat var(--dur, 4s) linear forwards; }
        .balloon-pop    { animation: balloonPop 0.35s ease-out forwards; }
        .balloon-shake  { animation: balloonShake 0.4s ease; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  // ── spawn balloons on a timer ───────────────────────────────────────────────
  useEffect(() => {
    if (done || isAnswered) return;
    const pool = allLetters.length > 0 ? allLetters : [{ letter: target, colorIndex: 0 }];

    const spawn = () => {
      const idx      = Math.floor(Math.random() * pool.length);
      const entry    = pool[idx];
      const id       = nextId.current++;
      const leftPct  = 8 + Math.random() * 78;          // 8..86 %
      const dur      = 3.5 + Math.random() * 2.5;       // 3.5..6 s
      const size     = 72 + Math.random() * 28;         // 72..100 px

      setBalloons(prev => [
        ...prev.filter(b => !b.popped || Date.now() - b.poppedAt < 600),
        { id, letter: entry.letter, colorIndex: entry.colorIndex, leftPct, dur, size, popped: false }
      ]);

      // auto-remove after animation ends
      setTimeout(() => {
        setBalloons(prev => prev.filter(b => b.id !== id));
      }, (dur + 0.5) * 1000);
    };

    spawn(); // spawn immediately
    timerRef.current = setInterval(spawn, 1200);
    return () => clearInterval(timerRef.current);
  }, [done, isAnswered, allLetters, target]);

  // ── tap handler ────────────────────────────────────────────────────────────
  const handleTap = (balloon) => {
    if (balloon.popped || isAnswered) return;

    if (balloon.letter === target) {
      // ✅ correct — pop + burst
      const newHits = hits + 1;
      setHits(newHits);
      setBalloons(prev => prev.map(b =>
        b.id === balloon.id ? { ...b, popped: true, poppedAt: Date.now() } : b
      ));

      // burst particles
      const color = BALLOON_COLORS[balloon.colorIndex % BALLOON_COLORS.length];
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: `${balloon.id}-${i}`,
        left: balloon.leftPct,
        color: i % 2 === 0 ? color.body : color.shine,
        angle: (i / 8) * 360,
      }));
      setBursts(prev => [...prev, ...particles]);
      setTimeout(() => setBursts(prev => prev.filter(p => !particles.some(pp => pp.id === p.id))), 700);

      if (newHits >= hitsNeeded) {
        clearInterval(timerRef.current);
        onAnswer(newHits);
        speakText(target, question.voice || 'Kore', audioUrl);
      } else {
        speakText(target, question.voice || 'Kore', audioUrl);
      }
    } else {
      // ❌ wrong — shake
      setShakeIds(prev => new Set([...prev, balloon.id]));
      setTimeout(() => setShakeIds(prev => { const s = new Set(prev); s.delete(balloon.id); return s; }), 450);
    }
  };

  const progressPct = Math.min(100, (hits / hitsNeeded) * 100);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'clamp(280px, 55vw, 420px)',
      background: 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 40%, #f0fdf4 100%)',
      borderRadius: 24,
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'manipulation',
    }}>
      {/* ── ground strip ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
        background: 'linear-gradient(0deg, #bbf7d0, #d1fae5)',
        borderTop: '2px solid #6ee7b7',
      }} />

      {/* ── progress bar ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 'min(240px, 80%)', height: 14,
        background: 'rgba(255,255,255,0.55)',
        borderRadius: 99, overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        border: '1.5px solid rgba(255,255,255,0.8)',
      }}>
        <div style={{
          height: '100%', width: `${progressPct}%`,
          background: 'linear-gradient(90deg, #34d399, #10b981)',
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* ── hits counter ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
        fontSize: 12, fontWeight: 700, color: '#065f46',
        fontFamily: 'var(--font-outfit, sans-serif)',
      }}>
        {hits} / {hitsNeeded}
      </div>

      {/* ── done banner ────────────────────────────────────────────── */}
      {done && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(240,253,244,0.85)', zIndex: 20,
          animation: 'none',
        }}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <div style={{
            fontSize: 'clamp(22px,6vw,32px)', fontWeight: 900,
            color: '#065f46', fontFamily: 'var(--font-outfit,sans-serif)',
            marginTop: 8,
          }}>Great job!</div>
        </div>
      )}

      {/* ── burst particles ────────────────────────────────────────── */}
      {bursts.map(p => {
        const bx = `${Math.cos(p.angle * Math.PI / 180) * 60}px`;
        const by = `${Math.sin(p.angle * Math.PI / 180) * 60}px`;
        return (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '30%',
            width: 10, height: 10,
            borderRadius: '50%',
            background: p.color,
            '--bx': bx, '--by': by,
            animation: 'burstParticle 0.65s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 15,
          }} />
        );
      })}

      {/* ── balloons ───────────────────────────────────────────────── */}
      {balloons.map(balloon => {
        const color = BALLOON_COLORS[balloon.colorIndex % BALLOON_COLORS.length];
        const isWrong = balloon.letter !== target;
        return (
          <div
            key={balloon.id}
            onClick={() => handleTap(balloon)}
            className={[
              balloon.popped ? 'balloon-pop' : 'balloon-float',
              shakeIds.has(balloon.id) ? 'balloon-shake' : '',
            ].join(' ')}
            style={{
              position: 'absolute',
              bottom: 28,
              left: `${balloon.leftPct}%`,
              '--dur': `${balloon.dur}s`,
              cursor: balloon.popped ? 'default' : 'pointer',
              zIndex: 10,
              filter: isWrong
                ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))'
                : 'drop-shadow(0 4px 12px rgba(16,185,129,0.35))',
              transition: 'filter 0.2s',
            }}
          >
            <BalloonSvg letter={balloon.letter} color={color} size={balloon.size} />
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// AudioPart — plays an attached audio URL (R2 or external)
// ───────────────────────────────────────────────────────────────────────────
function AudioPart({ part }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const url = part.audioUrl || part.content || '';
  const label = part.label || '';

  const handlePlay = () => {
    if (!url) return;
    if (playing) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current?.play();
      setPlaying(true);
    }
  };

  if (!url) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      margin: '8px 0',
    }}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        preload="auto"
      />

      {/* Big tap-to-play button */}
      <button
        type="button"
        onClick={handlePlay}
        aria-label={label ? `Play: ${label}` : 'Play audio'}
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: 'none',
          background: playing
            ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
            : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          boxShadow: playing
            ? '0 0 0 8px rgba(124,58,237,0.2), 0 8px 24px rgba(124,58,237,0.4)'
            : '0 4px 16px rgba(124,58,237,0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: playing ? 'scale(1.08)' : 'scale(1)',
          animation: playing ? 'audioPulse 1.2s ease-in-out infinite' : 'none',
        }}
      >
        {playing ? '⏹' : '🔊'}
      </button>

      {/* Label */}
      {label && (
        <span style={{
          fontSize: 'clamp(14px, 3.5vw, 18px)',
          fontWeight: 700,
          color: '#4c1d95',
          letterSpacing: '0.01em',
          textAlign: 'center',
          fontFamily: 'var(--font-outfit, sans-serif)',
        }}>
          {label}
        </span>
      )}

      {/* Inject pulse keyframe once */}
      <style>{`
        @keyframes audioPulse {
          0%, 100% { box-shadow: 0 0 0 8px rgba(124,58,237,0.2), 0 8px 24px rgba(124,58,237,0.4); }
          50%       { box-shadow: 0 0 0 16px rgba(124,58,237,0.08), 0 8px 32px rgba(124,58,237,0.5); }
        }
      `}</style>
    </div>
  );
}


// ── Pictograph Scene Part ────────────────────────────────────────────────────
function PictographScenePart({ part }) {
  const items = part.items || [];
  const svgWidth = part.svgWidth || 460;
  const svgHeight = part.svgHeight || 320;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: svgWidth,
        borderRadius: 16,
        border: '2px solid #e2e8f0',
        background: 'linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.07)',
        margin: '4px auto',
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Scattered fruits scene"
        role="img"
      >
        <defs>
          <pattern id="pictoGrid" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M 70 0 L 0 0 0 70" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#pictoGrid)" />
        {items.map((item, idx) => (
          <text
            key={idx}
            x={item.x}
            y={item.y}
            fontSize={Math.round(28 * (item.scale || 1))}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${item.rotate || 0}, ${item.x}, ${item.y})`}
            style={{ userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
          >
            {item.emoji}
          </text>
        ))}
      </svg>
    </div>
  );
}

const PART_RENDERERS = {

  text: TextPart,
  play_sound_card: PlaySoundCard,
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
  non_standard_object_measurement: NonStandardObjectMeasurementPart,
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
  bar_model: BarModelPart,
  function_machine: FunctionMachinePart,
  base_ten_blocks: BaseTenBlocksPart,
  clock: ClockPart,
  fraction_model: FractionModelPart,
  interactive_fraction_model: InteractiveFractionModelPart,
  interactive_fraction_cutter: InteractiveFractionCutterPart,
  fraction: FractionPart,
  interactive_counting: InteractiveCountingPart,
  interactive_stickers: InteractiveStickersPart,
  one_more_rows: OneMoreRowsPart,
  side_by_side_display: SideBySideDisplayPart,
  interactive_svg: InteractiveSvgPart,
  hotspot_canvas: HotspotCanvasPart,
  case_match_shown_letter: CaseMatchShownLetterPart,
  balloon_tap: BalloonTapPart,
  audio: AudioPart,
  pictograph_scene: PictographScenePart,
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
// ─── Case-match: show the "source" ruled letter card ─────────────────────────
function CaseMatchShownLetterPart({ part }) {
  const svg = part?.svgContent || '';
  const letter = part?.letter || '';
  if (!svg && !letter) return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      margin: '12px 0 4px 0',
    }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '2px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(59,130,246,0.10)',
          padding: '4px 8px',
          display: 'inline-block',
          lineHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

function HotspotCanvasPart({ part, question, userAnswer, onAnswer, isAnswered }) {
  const containerRef = useRef(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      setIsMobileLayout(containerWidth < 768);
    };

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateSize)
      : null;

    if (containerRef.current && observer) {
      observer.observe(containerRef.current);
    }
    updateSize();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const isPreK = useMemo(() => {
    const topic = getSafeString(question?.metadata?.topic || question?.topic).toLowerCase();
    const grade = getSafeString(question?.metadata?.grade || question?.grade).toLowerCase();
    const skillId = getSafeString(question?.metadata?.skillId || question?.skillId).toLowerCase();
    return (
      topic.includes('lkg') || topic.includes('prek') || topic.includes('ukg') ||
      grade.includes('lkg') || grade.includes('prek') || grade.includes('ukg') ||
      skillId.includes('lkg') || skillId.includes('prek') || skillId.includes('ukg')
    );
  }, [question]);

  // Resolve layouts object
  const resolvedLayouts = part?.layouts || question?.layouts || question?.metadata?.layouts;
  
  // Pick active layout based on viewport layout context
  const activeLayout = useMemo(() => {
    if (!resolvedLayouts) return null;
    if (isMobileLayout && resolvedLayouts.mobile) {
      return resolvedLayouts.mobile;
    }
    return resolvedLayouts.desktop || null;
  }, [resolvedLayouts, isMobileLayout]);

  const backgroundSvg = activeLayout 
    ? (activeLayout.backgroundSvg || activeLayout.backgroundImageSvg) 
    : part?.backgroundSvg;

  const backgroundUrl = activeLayout 
    ? (activeLayout.backgroundUrl || activeLayout.backgroundImage) 
    : (part?.backgroundUrl || question?.backgroundImage || question?.backgroundUrl);

  const canvasWidth = activeLayout?.canvasWidth ?? (part?.canvasWidth || 360);
  const canvasHeight = activeLayout?.canvasHeight ?? (part?.canvasHeight || 300);
  const hotspots = activeLayout?.hotspots ?? (part?.hotspots || []);

  const hasImages = useMemo(() => {
    return (hotspots || []).some(hs => {
      const qHs = (question?.hotspots || question?.metadata?.hotspots || []).find(
        qh => (qh.id && hs.id && qh.id === hs.id) ||
              (qh.label && hs.label && qh.label.toLowerCase() === hs.label.toLowerCase())
      ) || (question?.hotspots || question?.metadata?.hotspots)?.[hs.optionIndex];
      return Boolean(hs.imageUrl || qHs?.imageUrl || hs.svgContent || qHs?.svgContent);
    });
  }, [hotspots, question]);

  const isMultiSelect = question?.interaction === 'hotspot_multi_select' || part?.multiSelect === true;
  const showLabels = Boolean(question?.showHotspotLabels || part?.showHotspotLabels || question?.metadata?.showHotspotLabels);

  const selectedIndex = typeof userAnswer === 'object' && !Array.isArray(userAnswer)
    ? Number(userAnswer?.selectedIndex ?? userAnswer?.index)
    : Number(userAnswer);

  const selectedIndices = useMemo(() => {
    if (!isMultiSelect) return [];
    if (Array.isArray(userAnswer)) {
      return userAnswer.map(Number);
    }
    if (userAnswer && typeof userAnswer === 'object') {
      return Object.entries(userAnswer)
        .filter(([_, val]) => Boolean(val))
        .map(([key]) => Number(key));
    }
    if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
      return [Number(userAnswer)];
    }
    return [];
  }, [userAnswer, isMultiSelect]);

  const handleClick = (optionIndex) => {
    if (isAnswered) return;
    
    if (isMultiSelect) {
      const nextSelected = selectedIndices.includes(optionIndex)
        ? selectedIndices.filter(idx => idx !== optionIndex)
        : [...selectedIndices, optionIndex];
      onAnswer(nextSelected);
    } else {
      onAnswer(optionIndex);
      if (question.options?.[optionIndex]) {
        const option = question.options[optionIndex];
        speakText(option.label || option.text || '', question.voice || 'Puck', option.audioUrl);
      }
    }
  };

  const isAnyTransparent = Boolean(part.transparent || question?.transparent || (hotspots || []).some(hs => hs.transparent));

  return (
    <div 
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}
    >
      <div
        className={`${styles.hotspotCanvasWrapper} ${isPreK ? styles.preKHotspotCanvasWrapper : ''} ${isPreK && hasImages && !isAnyTransparent ? styles.preKHotspotGrid : ''}`}
        style={{
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          height: 'auto',
          width: '100%',
        }}
      >
      <div 
        className={styles.hotspotCanvasInner}
        data-hovered-index={hoveredIndex !== null ? hoveredIndex : undefined}
        data-selected-index={!isMultiSelect && Number.isFinite(selectedIndex) ? selectedIndex : undefined}
      >
        {/* Background: inline SVG and/or <img> */}
        {(() => {
          const resolvedBackgroundUrl = backgroundUrl || question?.backgroundImage || question?.backgroundUrl;
          
          const getOptionIds = (idx) => {
            const opt = question.options?.[idx];
            if (opt?.id) return [opt.id, `option${idx + 1}`];
            return [`opt_${idx}`, `option${idx + 1}`];
          };

          const activeIndices = isMultiSelect ? selectedIndices : (Number.isFinite(selectedIndex) ? [selectedIndex] : []);
          const activeIds = activeIndices.flatMap(idx => getOptionIds(idx));

          const svgHighlightStyles = activeIds.length > 0 ? activeIds.map(id => `
            #${id} {
              fill: rgba(34, 197, 94, 0.4) !important;
              stroke: #22c55e !important;
              stroke-width: 2px !important;
              transition: all 0.2s ease-in-out;
            }
          `).join('\\n') : '';

          const handleSvgClick = (e) => {
            if (isAnswered) return;
            let target = e.target;
            while (target && target !== e.currentTarget) {
              if (target.id) {
                const allOptions = question.options || hotspots;
                const matchedIdx = allOptions.findIndex((opt, idx) => {
                  const ids = getOptionIds(idx);
                  return ids.includes(target.id);
                });
                if (matchedIdx !== -1) {
                  handleClick(matchedIdx);
                  return;
                }
              }
              target = target.parentNode;
            }
          };

          return (
            <>
              {backgroundSvg && (
                <div
                  className={styles.hotspotBg}
                  style={{
                    ...(resolvedBackgroundUrl ? { position: 'absolute', inset: 0, zIndex: 2 } : {}),
                    cursor: isAnswered ? 'default' : 'pointer'
                  }}
                  onClick={handleSvgClick}
                  dangerouslySetInnerHTML={{ 
                    __html: (resolvedBackgroundUrl 
                      ? backgroundSvg.replace(/fill="#f8fafc"/g, 'fill="none"') 
                      : backgroundSvg)
                  }}
                />
              )}
              {svgHighlightStyles && (
                <style key={activeIds.join(',')}>
                  {svgHighlightStyles}
                </style>
              )}
              {resolvedBackgroundUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={resolvedBackgroundUrl} 
                  alt="scene" 
                  className={styles.hotspotBg} 
                  style={backgroundSvg ? { position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' } : undefined} 
                />
              )}

            </>
          );
        })()}

        {/* Transparent absolute-positioned hotspot buttons */}
        {hotspots.map((hs, i) => {
          const isSelected = isMultiSelect
            ? selectedIndices.includes(hs.optionIndex)
            : selectedIndex === hs.optionIndex;

          const isHovered = hoveredIndex === hs.optionIndex;

          // Lookup imageUrl from the question top-level hotspots or metadata hotspots
          // matching by id or label
          const qHs = (question?.hotspots || question?.metadata?.hotspots || []).find(
            qh => (qh.id && hs.id && qh.id === hs.id) ||
                  (qh.label && hs.label && qh.label.toLowerCase() === hs.label.toLowerCase())
          ) || (question?.hotspots || question?.metadata?.hotspots)?.[hs.optionIndex];

          const imageUrl = hs.imageUrl || qHs?.imageUrl;

          const scale = imageUrl ? 1.0 : 1.35; // 100% size for image hotspots, 35% size increase for invisible hotspots
          const origWidth = hs.width;
          const origHeight = hs.height;
          const newWidth = origWidth * scale;
          const newHeight = origHeight * scale;

          let newX = hs.x - (newWidth - origWidth) / 2;
          let newY = hs.y - (newHeight - origHeight) / 2;

          // Clamp new values to stay within the canvas boundaries
          if (newX < 0) newX = 0;
          if (newY < 0) newY = 0;
          if (!imageUrl) {
            if (newX + newWidth > canvasWidth) {
              newX = Math.max(0, canvasWidth - newWidth);
            }
            if (newY + newHeight > canvasHeight) {
              newY = Math.max(0, canvasHeight - newHeight);
            }
          } else {
            // For image hotspots, they shrink-to-fit, so visual width is smaller than nominal width.
            // Ensure they don't start outside the canvas area.
            if (newX > canvasWidth) newX = Math.max(0, canvasWidth - 20);
            if (newY > canvasHeight) newY = Math.max(0, canvasHeight - 20);
          }

          const rotation = isPreK ? (i % 2 === 0 ? '-1.5deg' : '1.5deg') : '0deg';
          const isCard = Boolean(imageUrl || question?.layoutMode === 'mcq_hotspot');
          const isInvisible = Boolean(part.invisibleHotspots || question?.invisibleHotspots);

          const isTransparentHotspot = Boolean(part.transparent || hs.transparent || question?.transparent);

          const dynamicStyles = isInvisible ? {
            background: 'transparent',
            border: 'none',
            cursor: isAnswered ? 'default' : 'pointer',
            outline: 'none',
            boxShadow: 'none',
            zIndex: isSelected ? 30 : (isHovered ? 20 : 10)
          } : (isTransparentHotspot ? {
            background: 'transparent',
            border: 'none',
            cursor: isAnswered ? 'default' : 'pointer',
            outline: 'none',
            boxShadow: 'none',
            transform: isSelected 
              ? 'scale(1.02)' 
              : (isHovered ? 'scale(1.05)' : 'scale(1)'),
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: isSelected ? 30 : (isHovered ? 20 : 10)
          } : (isPreK ? (isCard ? {
            border: isSelected 
              ? '4px solid #22c55e' 
              : (isHovered ? '4px solid #38bdf8' : '4px solid #ffffff'),
            backgroundColor: '#ffffff',
            boxShadow: isSelected 
              ? '0 8px 0 #15803d, 0 12px 24px rgba(34, 197, 94, 0.2)' 
              : (isHovered ? '0 10px 0 #0ea5e9, 0 12px 20px rgba(14, 165, 233, 0.15)' : '0 8px 0 #cbd5e1, 0 10px 16px rgba(0, 0, 0, 0.05)'),
            transform: isSelected 
              ? `scale(1.02) rotate(${rotation})` 
              : (isHovered ? `scale(1.05) rotate(${rotation})` : `scale(1) rotate(${rotation})`),
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
            zIndex: isSelected ? 30 : (isHovered ? 20 : 10)
          } : {
            zIndex: isSelected ? 30 : (isHovered ? 20 : 10)
          }) : (isCard ? {
            border: isSelected 
              ? '3px solid #0284c7' 
              : (isHovered ? '3px solid #38bdf8' : '3px solid transparent'),
            backgroundColor: isSelected 
              ? 'rgba(2, 132, 199, 0.06)' 
              : (isHovered ? 'rgba(14, 165, 233, 0.03)' : 'transparent'),
            boxShadow: isSelected 
              ? '0 12px 24px -8px rgba(2, 132, 199, 0.4), 0 0 0 4px rgba(2, 132, 199, 0.25)' 
              : (isHovered ? '0 8px 16px -6px rgba(14, 165, 233, 0.2)' : 'none'),
            transform: isSelected 
              ? 'scale(1.02)' 
              : (isHovered ? 'scale(1.04)' : 'scale(1)'),
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
            zIndex: isSelected ? 30 : (isHovered ? 20 : 10)
          } : {
            zIndex: isSelected ? 30 : (isHovered ? 20 : 10)
          })));

          return (
            <button
              key={i}
              aria-label={hs.label}
              disabled={isAnswered}
              onClick={() => handleClick(hs.optionIndex)}
              onMouseEnter={() => setHoveredIndex(hs.optionIndex)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={isInvisible ? '' : (
                isTransparentHotspot
                  ? styles.hotspotZoneTransparent
                  : [
                      styles.hotspotZone,
                      isSelected ? styles.hotspotZoneSelected : '',
                    ].join(' ')
              )}
              style={{
                left:   `${(newX / canvasWidth)      * 100}%`,
                top:    `${(newY / canvasHeight)     * 100}%`,
                width:  `${(newWidth / canvasWidth)  * 100}%`,
                height: `${(newHeight / canvasHeight) * 100}%`,
                borderRadius: hs.borderRadius || (hs.isCircle || hs.shape === 'circle' ? '50%' : (imageUrl ? '22px' : undefined)),
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 0,
                position: 'absolute',
                ...dynamicStyles
              }}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={hs.label || ''} 
                  style={{ 
                    height: '100%', 
                    width: '100%', 
                    padding: '4px',
                    boxSizing: 'border-box',
                    objectFit: 'contain', 
                    pointerEvents: 'none', 
                    zIndex: 1,
                    transition: 'filter 0.25s ease, transform 0.25s ease',
                    filter: isTransparentHotspot
                      ? (isSelected
                          ? 'drop-shadow(3px 0 0 #22c55e) drop-shadow(-3px 0 0 #22c55e) drop-shadow(0 3px 0 #22c55e) drop-shadow(0 -3px 0 #22c55e) drop-shadow(0 0 12px rgba(34, 197, 94, 0.45))'
                          : (isHovered ? 'drop-shadow(3px 0 0 #38bdf8) drop-shadow(-3px 0 0 #38bdf8) drop-shadow(0 3px 0 #38bdf8) drop-shadow(0 -3px 0 #38bdf8) drop-shadow(0 0 8px rgba(56, 189, 248, 0.35))' : 'none'))
                      : 'none'
                  }} 
                />
              ) : hs.svgContent ? (
                <div
                  style={{ 
                    width: '90%', 
                    height: '90%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    pointerEvents: 'none', 
                    zIndex: 1,
                    transition: 'filter 0.25s ease, transform 0.25s ease',
                    filter: isTransparentHotspot
                      ? (isSelected
                          ? 'drop-shadow(3px 0 0 #22c55e) drop-shadow(-3px 0 0 #22c55e) drop-shadow(0 3px 0 #22c55e) drop-shadow(0 -3px 0 #22c55e) drop-shadow(0 0 12px rgba(34, 197, 94, 0.45))'
                          : (isHovered ? 'drop-shadow(3px 0 0 #38bdf8) drop-shadow(-3px 0 0 #38bdf8) drop-shadow(0 3px 0 #38bdf8) drop-shadow(0 -3px 0 #38bdf8) drop-shadow(0 0 8px rgba(56, 189, 248, 0.35))' : 'none'))
                      : 'none'
                  }}
                  dangerouslySetInnerHTML={{ __html: hs.svgContent }}
                />
              ) : (
                hs.label && !part.hideHotspotText && !question.hideHotspotText && (
                  <span style={{ 
                    fontSize: isPreK ? '32px' : '18px', 
                    fontWeight: '900', 
                    color: isPreK ? '#4a044e' : '#334155',
                    fontFamily: 'var(--font-outfit), sans-serif',
                    userSelect: 'none',
                    zIndex: 1
                  }}>
                    {hs.label}
                  </span>
                )
              )}
              {isSelected && (
                <div 
                  className={styles.hotspotCheckmark}
                  style={{
                    position: 'absolute',
                    top: hs.borderRadius === '50%' || hs.isCircle || hs.shape === 'circle' ? '12%' : (isPreK ? '-10px' : '8px'),
                    right: hs.borderRadius === '50%' || hs.isCircle || hs.shape === 'circle' ? '12%' : (isPreK ? '-10px' : '8px'),
                    width: isPreK ? '34px' : '24px',
                    height: isPreK ? '34px' : '24px',
                    borderRadius: '50%',
                    backgroundColor: isPreK ? '#22c55e' : '#0284c7',
                    border: isPreK ? '3px solid #ffffff' : '2px solid #ffffff',
                    boxShadow: isPreK ? '0 6px 14px rgba(34, 197, 94, 0.4)' : '0 2px 6px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 15,
                    color: '#ffffff',
                    fontSize: isPreK ? '16px' : '13px',
                    fontWeight: '950',
                    animation: `${styles.badgePop} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                    pointerEvents: 'none'
                  }}
                >
                  ✓
                </div>
              )}
              {showLabels && hs.label && (
                <span style={{
                  position: 'absolute',
                  bottom: imageUrl ? '-24px' : '50%',
                  left: '50%',
                  transform: imageUrl ? 'translateX(-50%)' : 'translate(-50%, 50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#334155',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}>
                  {hs.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
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
  partIndex,
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
      partIndex={partIndex}
    />
  );
}

export { TextWithBlanks, readAnswer, writeAnswer };
