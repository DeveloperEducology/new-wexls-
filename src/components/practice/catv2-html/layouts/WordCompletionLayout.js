'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const isInlineSvg = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg');
};

const cleanSvgContent = (svgStr) => {
  if (!svgStr) return '';
  return svgStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\')
    .trim();
};

function VisualPanel({ word }) {
  const imageUrl = word.imageUrl || word.src;
  const svg = word.svg || (isInlineSvg(imageUrl) ? imageUrl : '');

  return (
    <div
      style={{
        minHeight: 'clamp(126px, 21vw, 176px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 2.5vw, 18px)',
        background: '#ffffff',
      }}
    >
      {svg ? (
        <div
          aria-hidden="true"
          style={{ width: '100%', height: 'clamp(112px, 18vw, 168px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: cleanSvgContent(svg) }}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={word.alt || word.answer || word.ending || 'word picture'}
          draggable={false}
          style={{ width: '100%', height: 'clamp(112px, 18vw, 168px)', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <div style={{ color: '#94a3b8', fontWeight: 900 }}>No image</div>
      )}
    </div>
  );
}

function LetterTile({ item, selected, dragging, disabled, onClick, onDragStart, onDragEnd }) {
  const label = item.content || item.letter || item.label || item.id;

  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      onClick={onClick}
      onDragStart={(event) => onDragStart?.(event, item)}
      onDragEnd={(event) => onDragEnd?.(event, item)}
      style={{
        width: 'clamp(42px, 10vw, 52px)',
        height: 'clamp(54px, 13vw, 66px)',
        border: selected ? '3px solid #60a5fa' : '1px solid #0b75c9',
        borderRadius: 7,
        background: '#0f83df',
        color: '#ffffff',
        boxShadow: dragging
          ? '0 18px 28px rgba(15, 23, 42, 0.22)'
          : selected
            ? '0 7px 0 #075aa7, 0 0 0 4px rgba(96, 165, 250, 0.22)'
            : '0 5px 0 #075aa7, 0 8px 13px rgba(15, 23, 42, 0.16)',
        fontSize: 'clamp(26px, 6.4vw, 34px)',
        lineHeight: 1,
        fontWeight: 600,
        fontFamily: 'var(--font-outfit), Arial, sans-serif',
        cursor: disabled ? 'default' : dragging ? 'grabbing' : 'grab',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        touchAction: 'manipulation',
      }}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

export default function WordCompletionLayout({
  question,
  items,
  onAnswer,
  isAnswered,
}) {
  const words = useMemo(() => {
    const explicitWords = question.words || question.wordCards || question.targets || question.grid?.words || [];
    return explicitWords.map((word, index) => ({
      id: word.id || `word_${index + 1}`,
      slotId: word.slotId || word.targetId || word.id || `slot_${index + 1}`,
      ending: word.ending || word.suffix || word.visibleText || '',
      answer: word.answer || word.word || '',
      imageUrl: word.imageUrl || word.src,
      svg: word.svg,
      alt: word.alt,
      prompt: word.prompt,
    }));
  }, [question.grid?.words, question.targets, question.wordCards, question.words]);

  const tileItems = useMemo(() => (
    items.map((item) => ({
      ...item,
      content: item.content || item.letter || item.label || item.id,
    }))
  ), [items]);

  const [placements, setPlacements] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const onAnswerRef = useRef(onAnswer);
  const wordSignature = words.map((word) => `${word.slotId}:${word.answer}:${word.ending}`).join('|');
  const itemSignature = tileItems.map((item) => item.id).join('|');

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    setPlacements({});
    setSelectedItemId(null);
    setDraggingId(null);
    setActiveSlotId(null);
    onAnswerRef.current?.(null);
  }, [itemSignature, wordSignature]);

  const emitAnswer = useCallback((nextPlacements) => {
    const complete = words.length > 0 && words.every((word) => nextPlacements[word.slotId]);
    onAnswerRef.current?.(complete ? nextPlacements : null);
  }, [words]);

  const placeItem = useCallback((itemId, slotId) => {
    if (isAnswered || !itemId || !slotId) return;
    const next = { ...placements };
    Object.keys(next).forEach((key) => {
      if (next[key] === itemId) delete next[key];
    });
    next[slotId] = itemId;
    setPlacements(next);
    setSelectedItemId(null);
    setActiveSlotId(null);
    emitAnswer(next);
  }, [emitAnswer, isAnswered, placements]);

  const removePlacement = useCallback((slotId) => {
    if (isAnswered) return;
    const next = { ...placements };
    delete next[slotId];
    setPlacements(next);
    emitAnswer(next);
  }, [emitAnswer, isAnswered, placements]);

  const handleTileClick = useCallback((itemId) => {
    if (isAnswered) return;
    setSelectedItemId((current) => (current === itemId ? null : itemId));
  }, [isAnswered]);

  const handleSlotClick = useCallback((slotId) => {
    if (isAnswered) return;
    if (selectedItemId) {
      placeItem(selectedItemId, slotId);
    } else if (placements[slotId]) {
      removePlacement(slotId);
    }
  }, [isAnswered, placeItem, placements, removePlacement, selectedItemId]);

  const handleDragStart = useCallback((event, item) => {
    if (isAnswered) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-catv2-source-item', item.id);
    event.dataTransfer.setData('text/plain', item.id);
    setDraggingId(item.id);
  }, [isAnswered]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setActiveSlotId(null);
  }, []);

  const handleDrop = useCallback((event, slotId) => {
    event.preventDefault();
    event.stopPropagation();
    const itemId = event.dataTransfer.getData('application/x-catv2-source-item') || event.dataTransfer.getData('text/plain');
    placeItem(itemId, slotId);
    setDraggingId(null);
    setActiveSlotId(null);
  }, [placeItem]);

  const itemById = useMemo(() => {
    const map = new Map();
    tileItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [tileItems]);

  const usedItemIds = new Set(Object.values(placements));
  const availableItems = tileItems.filter((item) => !usedItemIds.has(item.id));

  return (
    <div style={{ display: 'grid', gap: 'clamp(18px, 3vw, 30px)', paddingTop: 6, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <section
        aria-label="Letter choices"
        style={{
          display: 'flex',
          gap: 'clamp(8px, 2vw, 12px)',
          alignItems: 'center',
          flexWrap: 'wrap',
          minHeight: 68,
          paddingLeft: 2,
        }}
      >
        {availableItems.map((item) => (
          <LetterTile
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            dragging={draggingId === item.id}
            disabled={isAnswered}
            onClick={() => handleTileClick(item.id)}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </section>

      <section
        aria-label="Complete the words"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'clamp(10px, 2.5vw, 22px)',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {words.map((word) => {
          const placedItem = itemById.get(placements[word.slotId]);
          const slotActive = selectedItemId || draggingId;
          const isCardActive = activeSlotId === word.slotId || Boolean(selectedItemId);

          return (
            <article
              key={word.slotId}
              role="button"
              tabIndex={isAnswered ? -1 : 0}
              onClick={(event) => {
                if (event.defaultPrevented || isAnswered) return;
                handleSlotClick(word.slotId);
              }}
              onKeyDown={(event) => {
                if (isAnswered) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSlotClick(word.slotId);
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!isAnswered && draggingId) setActiveSlotId(word.slotId);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!isAnswered) {
                  event.dataTransfer.dropEffect = 'move';
                  if (draggingId) setActiveSlotId(word.slotId);
                }
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setActiveSlotId((current) => (current === word.slotId ? null : current));
                }
              }}
              onDrop={(event) => handleDrop(event, word.slotId)}
              style={{
                border: `2px solid ${isCardActive ? '#3b9cf4' : '#e1e5ea'}`,
                background: '#ffffff',
                borderRadius: 3,
                overflow: 'hidden',
                minWidth: 0,
                boxShadow: isCardActive ? '0 0 0 4px rgba(59, 156, 244, 0.16)' : 'none',
                cursor: isAnswered ? 'default' : 'pointer',
                transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
              }}
              aria-label={`Place selected letter for ${word.answer || word.ending}`}
            >
              <VisualPanel word={word} />
              <div
                style={{
                  minHeight: 'clamp(68px, 14vw, 88px)',
                  background: activeSlotId === word.slotId ? '#eff6ff' : '#f4f4f4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'clamp(8px, 2vw, 12px)',
                }}
              >
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleSlotClick(word.slotId);
                  }}
                  onDragEnter={() => {
                    if (!isAnswered && draggingId) setActiveSlotId(word.slotId);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    if (!isAnswered && draggingId) setActiveSlotId(word.slotId);
                  }}
                  onDrop={(event) => handleDrop(event, word.slotId)}
                  style={{
                    width: 'min(100%, 150px)',
                    minWidth: 0,
                    minHeight: 'clamp(52px, 11vw, 66px)',
                    border: `3px solid ${slotActive || activeSlotId === word.slotId ? '#60a5fa' : '#0f83df'}`,
                    borderRadius: 7,
                    background: '#0f83df',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'clamp(6px, 1.6vw, 10px)',
                    padding: 'clamp(5px, 1.4vw, 7px) clamp(8px, 2.6vw, 16px)',
                    cursor: isAnswered ? 'default' : 'pointer',
                    boxShadow: activeSlotId === word.slotId
                      ? '0 5px 0 #075aa7, 0 0 0 6px rgba(96, 165, 250, 0.2), 0 12px 22px rgba(15, 23, 42, 0.16)'
                      : '0 5px 0 #075aa7, 0 9px 18px rgba(15, 23, 42, 0.13)',
                  }}
                  aria-label={`Complete ${word.answer || word.ending}`}
                >
                  <span
                    style={{
                      width: 'clamp(38px, 8.5vw, 50px)',
                      height: 'clamp(38px, 8.5vw, 50px)',
                      borderRadius: 9,
                      background: placedItem ? '#ffffff' : '#eaf6ff',
                      color: '#0f8ae6',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(24px, 5.6vw, 32px)',
                      fontWeight: 650,
                      lineHeight: 1,
                    }}
                  >
                    {placedItem?.content || ''}
                  </span>
                  <span style={{ fontSize: 'clamp(24px, 5.6vw, 32px)', fontWeight: 600, letterSpacing: '0.12em' }}>
                    {word.ending}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
