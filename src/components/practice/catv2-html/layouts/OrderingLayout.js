'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatV2Card from '../components/CatV2Card';

const buildAnswer = (order) => {
  const answer = { order };
  order.forEach((itemId, index) => {
    answer[itemId] = `slot_${index + 1}`;
  });
  return answer;
};

const moveItem = (order, itemId, targetIndex) => {
  const fromIndex = order.indexOf(itemId);
  if (fromIndex === -1) return order;
  const next = order.filter((id) => id !== itemId);
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, itemId);
  return next;
};

export default function OrderingLayout({
  question,
  items,
  cardStyle,
  hideItemLabels,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const [order, setOrder] = useState(() => items.map((item) => item.id));
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);

  useEffect(() => {
    setOrder(items.map((item) => item.id));
    setSelectedItemId(null);
    setDraggingItemId(null);
  }, [question.id, items.map((item) => item.id).join('|')]);

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const emitOrder = useCallback((nextOrder) => {
    onAnswer?.(buildAnswer(nextOrder));
  }, [onAnswer]);

  const reorderTo = useCallback((itemId, targetIndex) => {
    if (isAnswered || !itemId) return;
    setOrder((previous) => {
      const next = moveItem(previous, itemId, targetIndex);
      emitOrder(next);
      return next;
    });
    setSelectedItemId(null);
  }, [emitOrder, isAnswered]);

  const handleCardClick = useCallback((itemId, index) => {
    if (isAnswered) return;
    if (!selectedItemId) {
      setSelectedItemId(itemId);
      return;
    }
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
      return;
    }
    reorderTo(selectedItemId, index);
  }, [isAnswered, reorderTo, selectedItemId]);

  const handleDragStart = useCallback((event, item) => {
    if (isAnswered) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
    setDraggingItemId(item.id);
  }, [isAnswered]);

  const handleDragOver = useCallback((event, index) => {
    if (isAnswered || !draggingItemId) return;
    event.preventDefault();
    setOrder((previous) => moveItem(previous, draggingItemId, index));
  }, [draggingItemId, isAnswered]);

  const handleDrop = useCallback((event, index) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain') || draggingItemId;
    reorderTo(itemId, index);
    setDraggingItemId(null);
  }, [draggingItemId, reorderTo]);

  return (
    <div
      style={{
        display: 'grid',
        gap: 18,
        paddingTop: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#64748b',
          fontSize: 13,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 0,
        }}
      >
        <span>{question.orderLabel || 'Arrange in order'}</span>
        {userAnswer ? <span style={{ color: '#16a34a' }}>Ready</span> : null}
      </div>

      <section
        aria-label="Ordering row"
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '18px 4px 24px',
        }}
      >
        <div
          style={{
            minWidth: 'max-content',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {order.map((itemId, index) => {
            const item = itemById.get(itemId);
            if (!item) return null;
            return (
              <div
                key={item.id}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => handleDrop(event, index)}
                style={{
                  transition: 'transform 220ms ease',
                  transform: draggingItemId === item.id ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <CatV2Card
                  item={item}
                  selected={selectedItemId === item.id}
                  dragging={draggingItemId === item.id}
                  disabled={isAnswered}
                  compact={!item.imageUrl && !item.svg && !item.toolSvg}
                  cardStyle={cardStyle}
                  hideLabel={hideItemLabels}
                  onClick={() => handleCardClick(item.id, index)}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggingItemId(null)}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
