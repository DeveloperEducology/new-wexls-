'use client';

import { useEffect, useRef, useMemo } from 'react';
import KaTeXRenderer from './KaTeXRenderer';
import { speakText } from '../../lib/ttsClient';
import styles from './FactoryLayout.module.css';
import { parseHTMLToJSX } from '@/lib/practice/htmlParser';

function cleanText(value) {
  return String(value || '').replace(/\*\*/g, '').replace(/^#{1,4}\s*/gm, '');
}

function isSvgString(value) {
  return typeof value === 'string' && value.trim().startsWith('<svg');
}

function InlineMarkdown({ text }) {
  const normalizedText = String(text || '')
    .replace(/\\n/g, '\n')
    .replace(/\/n/g, '\n');
  return (
    <span style={{ whiteSpace: 'pre-line' }}>
      {normalizedText.split(/(\*\*[^*]+\*\*)/g).map((piece, index) => {
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
              if (subPiece.includes('<svg')) {
                const svgParts = subPiece.split(/(<svg[\s\S]*?<\/svg>)/g);
                return (
                  <span key={subIndex}>
                    {svgParts.map((svgPart, pIdx) => {
                      if (svgPart.startsWith('<svg') && svgPart.endsWith('</svg>')) {
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
              return <span key={subIndex}>{parseHTMLToJSX(subPiece.replace(/^#{1,4}\s*/, ''))}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}

function ArithmeticLayoutSolution({ layout }) {
  const isVertical = layout?.variant === 'verticalAdditionReplica' || layout?.variant === 'verticalSubtractionReplica' || layout?.variant === 'verticalMultiplicationReplica';
  const answerRow = layout?.rows?.find((row) => row.kind === 'answer');
  const digitCount = Math.max(
    2,
    answerRow?.cells?.length || 0,
    ...(layout?.rows || []).map((row) => String(row.text || '').replace(/[+×x−\-]/gi, '').trim().length)
  );
  const cellSize = isVertical ? 32 : 44;
  const operatorWidth = isVertical ? 28 : 0;
  const digitGridWidth = digitCount * cellSize;
  const fullGridWidth = operatorWidth + digitGridWidth;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: isVertical ? 3 : 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: isVertical ? '28px' : '38px',
        fontWeight: isVertical ? 500 : 800,
        color: '#0f172a',
      }}
    >
      {(layout?.rows || []).map((row, rowIndex) => {
        if (row.kind === 'divider') {
          return (
            <div
              key={rowIndex}
              style={{
                width: isVertical ? fullGridWidth : '100%',
                height: isVertical ? 2 : 3,
                background: '#0f172a',
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
                gap: isVertical ? 0 : 6,
                width: isVertical ? digitGridWidth : 'auto',
                marginLeft: isVertical ? operatorWidth : 0,
              }}
            >
              {(answerRow?.cells || []).map((cell) => (
                <span
                  key={cell.id}
                  style={{
                    width: cellSize,
                    height: isVertical ? 30 : 54,
                    border: '2px solid #22c55e',
                    borderLeftStyle: isVertical && cell.id !== answerRow.cells[0]?.id ? 'dashed' : 'solid',
                    borderLeftWidth: isVertical && cell.id !== answerRow.cells[0]?.id ? 1 : 2,
                    marginLeft: isVertical && cell.id !== answerRow.cells[0]?.id ? -1 : 0,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: 'inherit',
                    fontSize: isVertical ? 22 : 'inherit',
                    background: '#f0fdf4',
                    color: '#15803d',
                  }}
                >
                  {cell.expected}
                </span>
              ))}
            </div>
          );
        }

        if (isVertical) {
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

        return <div key={rowIndex}>{row.text}</div>;
      })}
    </div>
  );
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

  if (part.type === 'arithmeticLayout' && part.layout) {
    return (
      <div key={index} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0', width: '100%' }}>
        <ArithmeticLayoutSolution layout={part.layout} />
      </div>
    );
  }

  return (
    <p key={index} style={{ margin: 0, ...(part.style || {}) }}>
      <InlineMarkdown text={part.content || part.text || ''} />
    </p>
  );
}

function renderInteractiveSolution(question) {
  if (!question) return null;

  const type = question.type;
  const interaction = question.interaction;
  const layoutMode = question.layoutMode || question.htmlLayout || (question.metadata && question.metadata.layoutMode);

  const isCategorization = interaction === 'categorization' || interaction === 'categorizationv2' || type === 'categorization' || type === 'categorizationv2' || layoutMode === 'category_sort';
  const isOrdering = layoutMode === 'ordering' || type === 'ordering';
  const isMatching = layoutMode === 'matching' || type === 'matching';
  const isWordCompletion = layoutMode === 'word_completion' || layoutMode === 'complete_words';
  const isInteractiveStickers = interaction === 'interactive_stickers' || type === 'interactive_stickers';

  if (isInteractiveStickers) {
    const partStickersObj = question.parts?.find(p => p.type === 'interactive_stickers') || {};
    const categories = question.categories || partStickersObj.categories || [];
    const stickers = question.stickers || partStickersObj.stickers || [];
    const sceneImageUrl = partStickersObj.sceneImageUrl || '';
    const mobileSceneImageUrl = partStickersObj.mobileSceneImageUrl || partStickersObj.sceneImageUrlMobile || '';
    
    // Automatically assign minX and maxX boundaries if missing
    const catCount = categories.length;
    const activeCategories = categories.map((cat, index) => {
      const minX = Math.round((index / catCount) * 100);
      const maxX = Math.round(((index + 1) / catCount) * 100);
      return {
        ...cat,
        minX: cat.minX !== undefined ? cat.minX : minX,
        maxX: cat.maxX !== undefined ? cat.maxX : maxX
      };
    });

    const correctPlacements = [];
    if (partStickersObj.mode === 'shadow_match') {
      const targets = partStickersObj.targets || [];
      targets.forEach((target) => {
        const matchingSticker = stickers.find(s => s.type === target.type);
        if (matchingSticker) {
          correctPlacements.push({
            id: target.id,
            x: target.x,
            y: target.y,
            sticker: matchingSticker
          });
        }
      });
    } else {
      activeCategories.forEach((cat) => {
        const catStickers = stickers.filter(s => s.category === cat.id);
        const colWidth = cat.maxX - cat.minX;
        catStickers.forEach((sticker, index) => {
          const xOffset = catStickers.length === 1 
            ? 0.5 
            : (index % 2 === 0 ? 0.35 : 0.65);
          const yOffset = catStickers.length <= 2 
            ? (index === 0 ? 0.45 : 0.7) 
            : (0.3 + (index / catStickers.length) * 0.45);
          
          const x = cat.minX + colWidth * xOffset;
          const y = yOffset * 100;
          correctPlacements.push({
            id: sticker.id,
            x,
            y,
            sticker
          });
        });
      });
    }

    return (
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Correct Layout
        </h4>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: sceneImageUrl || mobileSceneImageUrl ? undefined : '16 / 7',
            minHeight: sceneImageUrl || mobileSceneImageUrl ? undefined : 'clamp(180px, 48vw, 360px)',
            overflow: 'hidden',
            border: '2px solid #22c55e',
            borderRadius: '16px',
            background: sceneImageUrl || mobileSceneImageUrl
              ? '#ffffff'
              : 'linear-gradient(#62b8ed 0 62%, #b9d85a 62% 76%, #65a83c 76%)',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
          }}
        >
          {sceneImageUrl || mobileSceneImageUrl ? (
            <picture style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none', userSelect: 'none' }}>
              {mobileSceneImageUrl && (
                <source media="(max-width: 768px)" srcSet={mobileSceneImageUrl} />
              )}
              <img 
                src={sceneImageUrl || mobileSceneImageUrl} 
                alt="Scene" 
                draggable={false} 
                style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none' }} 
              />
            </picture>
          ) : null}

          {partStickersObj.mode !== 'shadow_match' && activeCategories.map((cat, index) => {
            const width = cat.maxX - cat.minX;
            const left = cat.minX;
            return (
              <div
                key={cat.id}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: 0,
                  width: `${width}%`,
                  height: '100%',
                  borderRight: index < activeCategories.length - 1 ? '3px dashed rgba(255, 255, 255, 0.55)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 8px',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              >
                <div
                  style={{
                    color: '#0f172a',
                    fontSize: 'clamp(12px, 2vw, 20px)',
                    fontWeight: '800',
                    textShadow: '0 2px 4px rgba(255, 255, 255, 0.8), 0 -1px 1px rgba(255, 255, 255, 0.8)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.label}
                </div>
              </div>
            );
          })}

          {correctPlacements.map((placement) => {
            const sticker = placement.sticker;
            const imgUrl = sticker.imageUrl || '';
            const content = sticker.content || sticker.name || '🦋';
            const sWidth = sticker.widthPercent || sticker.width || partStickersObj.commonStickerWidth || 20;
            const sHeight = sticker.heightPercent || sticker.height || partStickersObj.commonStickerHeight || 20;

            return (
              <div
                key={placement.id}
                style={{
                  position: 'absolute',
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  width: `${sWidth}%`,
                  height: `${sHeight}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {imgUrl ? (
                  <img src={imgUrl} alt={sticker.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  /[a-zA-Z0-9]/.test(content) ? (
                    <span 
                      style={{ 
                        fontSize: 'clamp(10px, 1.8vw, 13px)', 
                        fontWeight: '600', 
                        color: '#1e293b', 
                        background: '#f8fafc', 
                        border: '2px solid #cbd5e1', 
                        borderRadius: '8px', 
                        padding: '2px 6px', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        boxShadow: '0 2px 4px rgba(148, 163, 184, 0.08)'
                      }}
                    >
                      {content}
                    </span>
                  ) : (
                    <span style={{ fontSize: 'clamp(24px, 4vw, 44px)', lineHeight: 1 }}>{content}</span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isWordCompletion) {
    const wordCards = question.wordCards || question.parts?.find(part => part?.layoutMode === 'word_completion' || part?.layoutMode === 'complete_words')?.wordCards || [];
    if (!wordCards.length) return null;

    return (
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 950, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Correct Words
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {wordCards.map((word) => (
            <div
              key={word.id}
              style={{
                background: '#ffffff',
                border: '2px solid #bfdbfe',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 18,
                fontWeight: 950,
                color: '#0f172a',
              }}
            >
              {word.label || `${word.initial || word.answer || ''}${word.ending || ''}`}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isCategorization) {
    const categories = question.categories || [];
    const items = question.items || [];
    const answer = question.answer || question.correctAnswer || question.answerKey || {};

    const isGridFill = layoutMode === 'grid_fill';

    if (isGridFill) {
      const targets = question.targets || [];
      const correctSequence = targets.map(target => {
        const itemId = answer[target.id];
        return items.find(it => it.id === itemId);
      }).filter(Boolean);

      return (
        <div style={{ marginTop: 14, marginBottom: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Correct Answer
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {correctSequence.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                style={{
                  width: 72,
                  height: 72,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: '2px solid #22c55e',
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.08)',
                  padding: 4
                }}
              >
                {item.svg ? (
                  <span
                    aria-hidden="true"
                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    dangerouslySetInnerHTML={{ __html: cleanSvgContent ? cleanSvgContent(item.svg) : item.svg }}
                  />
                ) : item.imageUrl ? (
                  <img src={item.imageUrl} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{item.content || item.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (categories.length === 0) return null;

    const grouped = {};
    categories.forEach(cat => {
      const catId = typeof cat === 'string' ? cat : cat.id;
      grouped[catId] = [];
    });

    items.forEach(item => {
      const correctCatId = answer[item.id] || item.categoryId || item.target || item.category;
      if (correctCatId && grouped[correctCatId]) {
        grouped[correctCatId].push(item);
      }
    });

    // Color palettes for categories (white cards inside colored border zones)
    const colors = [
      { border: '#5cc4ed', bg: '#f0fafd', headerText: '#0284c7', dot: '#0284c7' }, // Blue/Teal category zone
      { border: '#c084fc', bg: '#faf5ff', headerText: '#7e22ce', dot: '#a855f7' }, // Purple
      { border: '#fed7aa', bg: '#fff7ed', headerText: '#c2410c', dot: '#f97316' }, // Orange
      { border: '#a7f3d0', bg: '#ecfdf5', headerText: '#047857', dot: '#10b981' }, // Green
      { border: '#fbcfe8', bg: '#fdf2f8', headerText: '#be185d', dot: '#ec4899' }, // Pink
    ];

    return (
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 950, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Correct Groups
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {categories.map((cat, idx) => {
            const catId = typeof cat === 'string' ? cat : cat.id;
            const catLabel = typeof cat === 'string' ? cat : cat.label;
            const catItems = grouped[catId] || [];
            const color = colors[idx % colors.length];

            return (
              <div
                key={catId}
                style={{
                  background: '#ffffff',
                  border: `2px solid ${color.border}`,
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: `2px solid ${color.bg}`, paddingBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color.dot }} />
                  <span style={{ fontSize: 14, fontWeight: 900, color: color.headerText }}>
                    {catLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {catItems.length > 0 ? (
                    catItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: item.imageUrl ? 'column' : 'row',
                          gap: 6,
                          width: item.imageUrl ? 120 : 'auto',
                          minHeight: 52,
                          background: '#ffffff',
                          border: '2px solid #5cc4ed', // Exact card border color
                          borderRadius: 10,
                          padding: item.imageUrl ? '8px 10px' : '8px 14px',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#1e293b',
                          boxShadow: '0 6px 12px rgba(15, 23, 42, 0.05)',
                          textAlign: 'center',
                        }}
                      >
                        {item.imageUrl && (
                          <div style={{
                            width: '100%',
                            height: 64,
                            background: '#f8fafc', // Exact image wrapper color
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            marginBottom: 4,
                          }}>
                            <img src={item.imageUrl} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                          </div>
                        )}
                        <span style={{ wordBreak: 'break-word' }}>{item.content || item.label}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, fontStyle: 'italic', color: '#94a3b8', padding: '8px 0' }}>Empty</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isOrdering) {
    const targets = question.targets || [];
    const items = question.items || [];
    const answer = question.answer || {};
    let orderedItems = [];

    if (targets.length > 0) {
      const sortedTargets = [...targets].sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedTargets.forEach(target => {
        let item = items.find(it => target.accepts?.includes(it.id));
        if (!item) {
          item = items.find(it => answer[it.id] === target.id);
        }
        if (item) {
          orderedItems.push(item);
        }
      });
    }

    if (orderedItems.length === 0) {
      orderedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return (
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Correct Order
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {orderedItems.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: item.imageUrl ? 'column' : 'row',
                  gap: 6,
                  width: item.imageUrl ? 120 : 'auto',
                  minHeight: 52,
                  background: '#ffffff',
                  border: '2px solid #0284c7', // Darker blue card border
                  borderRadius: 10,
                  padding: item.imageUrl ? '8px 10px' : '8px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0369a1',
                  boxShadow: '0 6px 12px rgba(2, 132, 199, 0.06)',
                  textAlign: 'center',
                }}
              >
                {item.imageUrl && (
                  <div style={{
                    width: '100%',
                    height: 64,
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: 4,
                  }}>
                    <img src={item.imageUrl} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                  </div>
                )}
                <span style={{ wordBreak: 'break-word' }}>{item.content || item.label}</span>
              </div>
              {idx < orderedItems.length - 1 && (
                <span style={{ color: '#94a3b8', fontWeight: 900, fontSize: 18 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isMatching) {
    const targets = question.targets || [];
    const items = question.items || [];
    const answer = question.answer || {};
    const matches = [];

    items.forEach(item => {
      const targetId = answer[item.id] || item.target;
      const target = targets.find(t => t.id === targetId);
      if (target) {
        matches.push({ item, target });
      }
    });

    return (
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Correct Matches
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matches.map(({ item, target }) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Item Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: item.imageUrl ? 'column' : 'row',
                  gap: 6,
                  width: item.imageUrl ? 120 : 'auto',
                  minHeight: 52,
                  background: '#ffffff',
                  border: '2px solid #5cc4ed',
                  borderRadius: 10,
                  padding: item.imageUrl ? '8px 10px' : '8px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1e293b',
                  boxShadow: '0 6px 12px rgba(15, 23, 42, 0.05)',
                  textAlign: 'center',
                }}
              >
                {item.imageUrl && (
                  <div style={{
                    width: '100%',
                    height: 64,
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: 4,
                  }}>
                    <img src={item.imageUrl} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                  </div>
                )}
                <span style={{ wordBreak: 'break-word' }}>{item.content || item.label}</span>
              </div>
              
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 800 }}>── matches to ──</span>
              
              {/* Target Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: target.imageUrl ? 'column' : 'row',
                  gap: 6,
                  width: target.imageUrl ? 120 : 'auto',
                  minHeight: 52,
                  background: '#f8fafc',
                  border: '2px solid #94a3b8',
                  borderRadius: 10,
                  padding: target.imageUrl ? '8px 10px' : '8px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#475569',
                  boxShadow: '0 6px 12px rgba(15, 23, 42, 0.03)',
                  textAlign: 'center',
                }}
              >
                {target.imageUrl && (
                  <div style={{
                    width: '100%',
                    height: 64,
                    background: '#ffffff',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: 4,
                  }}>
                    <img src={target.imageUrl} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                  </div>
                )}
                <span style={{ wordBreak: 'break-word' }}>{target.content || target.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function renderCorrectAnswer(question) {
  if (!question) return null;

  const type = question.type;
  const interaction = question.interaction;
  const layoutMode = question.layoutMode || question.htmlLayout || (question.metadata && question.metadata.layoutMode);
  const isCategorization = interaction === 'categorization' || interaction === 'categorizationv2' || type === 'categorization' || type === 'categorizationv2' || layoutMode === 'category_sort';
  
  if (isCategorization) return null; // already rendered by renderInteractiveSolution

  // Try to resolve the expected answer value
  const isMcq = question.type === 'mcq' || question.interaction === 'choice' || question.interaction === 'multi_select';
  
  let expected = null;
  if (isMcq) {
    const options = Array.isArray(question.options) ? question.options : [];
    let correctIndices = [];
    if (question.correctAnswerIndex !== undefined) {
      correctIndices = [question.correctAnswerIndex];
    } else if (Array.isArray(question.correctAnswerIndices)) {
      correctIndices = question.correctAnswerIndices;
    } else if (typeof question.answer === 'number') {
      correctIndices = [question.answer];
    }
    
    if (correctIndices.length > 0) {
      const labels = correctIndices.map(idx => {
        const opt = options[idx];
        if (!opt) return '';
        return typeof opt === 'object' ? (opt.label ?? opt.text ?? '') : String(opt);
      }).filter(Boolean);
      expected = labels.join(', ');
    }
  } else {
    expected = question.answer ?? question.correctAnswer;
    if (!expected && Array.isArray(question.validationRules)) {
      const rule = question.validationRules.find(r => r.type === 'exact_match' && r.target === 'answer');
      if (rule) expected = rule.value;
    }
  }

  if (expected === undefined || expected === null || expected === '') return null;

  // Render Section
  return (
    <div style={{ marginTop: 14, marginBottom: 14 }}>
      <h4 style={{
        margin: '0 0 10px',
        fontSize: 13,
        fontWeight: 900,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
      }}>
        Correct Answer
      </h4>
      
      {typeof expected === 'object' && !Array.isArray(expected) ? (
        // Multi-blank layout: Render question blueprint with values filled in
        (() => {
          const qText = question.questionText || '';
          if (/\[\[([^\]]+)\]\]/.test(qText)) {
            const parts = qText.split(/(\[\[[^\]]+\]\])/g);
            return (
              <div style={{
                padding: '16px 20px',
                background: '#ffffff',
                borderRadius: 14,
                border: '2px solid #22c55e',
                fontSize: 'clamp(17px, 3.2vw, 20px)',
                fontWeight: 500,
                lineHeight: 1.85,
                color: '#0f172a'
              }}>
                {parts.map((part, idx) => {
                  const match = part.match(/^\[\[([^\]]+)\]\]$/);
                  if (match) {
                    const blankId = match[1].trim();
                    const val = expected[blankId] || '';
                    return (
                      <strong key={idx} style={{
                        color: '#15803d',
                        background: '#dcfce7',
                        padding: '3px 10px',
                        borderRadius: 6,
                        margin: '0 4px',
                        border: '1.5px solid #22c55e',
                        fontFamily: 'var(--font-outfit), sans-serif',
                        fontWeight: 900,
                        fontSize: '1.1em'
                      }}>
                        {val}
                      </strong>
                    );
                  }
                  return part.split('\n').map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ));
                })}
              </div>
            );
          }
          
          // Fallback list of blank values
          return (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.entries(expected).map(([key, val]) => (
                <div key={key} style={{
                  padding: '8px 14px',
                  background: '#f0fdf4',
                  borderRadius: 10,
                  border: '1.5px solid #22c55e',
                  color: '#16a34a',
                  fontWeight: 700,
                  fontSize: 16
                }}>
                  {key}: <strong>{val}</strong>
                </div>
              ))}
            </div>
          );
        })()
      ) : (
        // Single value layout
        <div style={{
          padding: '14px 20px',
          background: '#ffffff',
          borderRadius: 12,
          border: '2px solid #22c55e',
          color: '#15803d',
          fontWeight: 900,
          fontSize: 'clamp(18px, 3.2vw, 21px)',
          display: 'inline-block',
          fontFamily: 'var(--font-outfit), sans-serif',
          boxShadow: '0 4px 10px rgba(34, 197, 94, 0.05)'
        }}>
          {String(expected)}
        </div>
      )}
    </div>
  );
}

export default function PracticeFeedback({
  question,
  isCorrect = false,
  onNext,
  nextLabel = 'Next Challenge',
  loading = false,
  isPreK = false,
}) {
  const spokenRef = useRef(false);

  const activeIsPreK = useMemo(() => {
    const skillGrade = question?.metadata?.grade || question?.grade || question?.metadata?.estimatedGrade || question?.estimatedGrade;
    const g = String(skillGrade || '').toLowerCase().trim();
    const isElementaryOrHigher = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'grade 1', 'grade 2', 'grade 3', 'class 1', 'class 2'].includes(g);
    return isPreK && !isElementaryOrHigher;
  }, [question, isPreK]);

  // Clean explanation text
  const getExplanationText = (exp) => {
    if (!exp) return '';
    if (typeof exp === 'string') return exp;
    if (typeof exp === 'object') {
      if (Array.isArray(exp.sections)) {
        return exp.sections
          .map(s => typeof s === 'string' ? s : (s?.content || s?.text || ''))
          .filter(Boolean)
          .join('\n');
      }
      return exp.content || exp.text || '';
    }
    return String(exp);
  };
  const cleanExp = question?.explanation ? cleanText(getExplanationText(question.explanation)) : '';
  
  // Resolve correct label and image
  let correctLabel = '';
  let correctImageUrl = '';
  const isMultiSelect = question?.interaction === 'multi_select' || question?.multiSelect === true;
  const isInteractiveStickers = question?.interaction === 'interactive_stickers' || question?.type === 'interactive_stickers';

  if (question) {
    if (isInteractiveStickers) {
      const partStickersObj = question.parts?.find(p => p.type === 'interactive_stickers') || {};
      if (partStickersObj.mode === 'shadow_match') {
        correctLabel = 'Correct labeling';
      } else {
        correctLabel = 'Correct sorting';
      }
    } else {
      let indices = [];
      if (isMultiSelect && Array.isArray(question.correctAnswerIndices)) {
        indices = question.correctAnswerIndices;
      } else if (isMultiSelect && Array.isArray(question.answer)) {
        indices = question.answer;
      } else if (question.correctAnswerIndex !== undefined) {
        indices = [question.correctAnswerIndex];
      }

      if (indices.length > 0) {
        const labels = [];
        indices.forEach((idx) => {
          if (Array.isArray(question.options) && question.options[idx]) {
            const opt = question.options[idx];
            const lbl = typeof opt === 'object' ? (opt.label || opt.text || '') : String(opt);
            if (lbl) labels.push(lbl);
          }
        });
        correctLabel = labels.join(', ');
        
        if (indices.length === 1) {
          if (Array.isArray(question.hotspots) && question.hotspots[indices[0]]) {
            const hs = question.hotspots[indices[0]];
            correctImageUrl = hs.imageUrl || '';
          }
        }
      }
    }
  }

  const cleanLabel = cleanText(correctLabel);

  useEffect(() => {
    if (activeIsPreK && !isCorrect && question && !spokenRef.current) {
      spokenRef.current = true;
      const introText = cleanLabel 
        ? `Almost! The correct answer is the ${cleanLabel}.` 
        : `Almost! Let's see the correct answer.`;
      const fullSpeech = `${introText} ${cleanExp}`;
      const t = setTimeout(() => {
        speakText(fullSpeech, 'Puck');
      }, 100);
      return () => clearTimeout(t);
    }
  }, [activeIsPreK, isCorrect, question, cleanLabel, cleanExp]);

  const handlePlaySpeech = () => {
    const introText = cleanLabel 
      ? `Almost! The correct answer is the ${cleanLabel}.` 
      : `Almost! Let's see the correct answer.`;
    const fullSpeech = `${introText} ${cleanExp}`;
    speakText(fullSpeech, 'Puck');
  };

  if (!question) return null;

  const solutionSections = Array.isArray(question?.solution?.sections)
    ? question.solution.sections.filter(s => {
        const secText = typeof s === 'string' ? s : (s?.content || s?.text || '');
        return cleanText(secText) !== cleanExp;
      })
    : [];

  if (activeIsPreK) {
    return (
      <section className={styles.preKFeedbackContainer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 950, color: '#9a3412', fontFamily: 'var(--font-outfit), sans-serif' }}>
                Let's look together!
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#c2410c' }}>
                Almost there! You can do it! ✨
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handlePlaySpeech}
            className={styles.preKSpeakerBtn}
            title="Listen again"
          >
            🔊
          </button>
        </div>

        {renderCorrectAnswer(question, isCorrect)}

        {cleanExp && (
          <div style={{
            marginTop: 14,
            padding: '14px',
            background: '#ffffff',
            borderRadius: 18,
            border: '2px solid rgba(251, 146, 60, 0.15)',
            color: '#334155',
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.8,
          }}>
            <InlineMarkdown text={cleanExp} />
          </div>
        )}

        {renderInteractiveSolution(question)}

        {solutionSections.length > 0 && (
          <div style={{
            marginTop: 14,
            padding: 14,
            background: '#ffffff',
            borderRadius: 18,
            border: '2px solid rgba(251, 146, 60, 0.15)',
            color: '#1e293b',
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflow: 'hidden',
          }}>
            {solutionSections.map((section, index) => renderSolutionPart(section, index))}
          </div>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className={styles.preKNextBtn}
        >
          {loading ? 'Loading...' : 'Try Next! 🌟'}
        </button>
      </section>
    );
  }

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

      {cleanExp && (
        <div
          style={{
            marginBottom: 14,
            padding: 14,
            background: '#ffffff',
            borderRadius: 14,
            border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.12)' : 'rgba(251, 146, 60, 0.12)'}`,
            color: '#334155',
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.8,
          }}
        >
          <InlineMarkdown text={cleanExp} />
        </div>
      )}

      {renderInteractiveSolution(question)}

      {renderCorrectAnswer(question, isCorrect)}

      {solutionSections.length > 0 ? (
        <div
          style={{
            padding: 14,
            background: '#ffffff',
            borderRadius: 14,
            border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.18)' : 'rgba(251, 146, 60, 0.18)'}`,
            color: '#1e293b',
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.8,
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
        disabled={loading}
        style={{
          marginTop: 14,
          padding: '13px 18px',
          borderRadius: 14,
          border: 'none',
          background: isCorrect ? '#16a34a' : '#0f172a',
          color: '#fff',
          fontWeight: 900,
          fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Loading...' : nextLabel}
      </button>
    </section>
  );
}
