'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function useCatV2SimpleDnd({ items, targets, onAnswer, isAnswered, isCopiable = false }) {
  // placements maps targetId -> itemId
  const [placements, setPlacements] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);

  const onAnswerRef = useRef(onAnswer);
  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    setPlacements({});
    setSelectedItemId(null);
    setDraggingItemId(null);
    isFirstRender.current = true;
  }, [items.map((item) => item.id).join('|'), targets.map((target) => target.id).join('|')]);

  const sourceItems = useMemo(() => {
    if (isCopiable) return items;
    const placedItemIds = Object.values(placements);
    return items.filter((item) => !placedItemIds.includes(item.id));
  }, [items, placements, isCopiable]);

  const emitAnswer = useCallback((nextPlacements) => {
    // Answer is complete when all targets have a placement
    const complete = targets.every((target) => nextPlacements[target.id]);
    
    if (!complete) {
      onAnswerRef.current?.(null);
      return;
    }

    // Build the union answer object mapping both (itemId -> targetId) and (targetId -> itemId)
    // to support any validation schema.
    const answerPayload = {};
    Object.entries(nextPlacements).forEach(([targetId, itemId]) => {
      if (itemId) {
        answerPayload[targetId] = itemId;
        // For non-copiable, map itemId -> targetId directly.
        // For copiable, we map it anyway (though if duplicated, the last one overwrites,
        // which is fine, but targetId key ensures exact match for copy mode).
        answerPayload[itemId] = targetId;
      }
    });

    onAnswerRef.current?.(answerPayload);
  }, [targets]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    emitAnswer(placements);
  }, [placements, emitAnswer]);

  const placeItem = useCallback((itemId, targetId) => {
    if (isAnswered || !itemId || !targetId) return;
    setPlacements((previous) => {
      const next = { ...previous };
      
      if (!isCopiable) {
        // If not copiable, remove this itemId from any other target first (move behavior)
        Object.keys(next).forEach((key) => {
          if (next[key] === itemId) {
            delete next[key];
          }
        });
      }
      
      next[targetId] = itemId;
      return next;
    });
    setSelectedItemId(null);
  }, [isAnswered, isCopiable]);

  const returnItem = useCallback((itemId, targetId) => {
    if (isAnswered) return;
    setPlacements((previous) => {
      const next = { ...previous };
      if (targetId) {
        delete next[targetId];
      } else {
        // Fallback: delete any target mapping to this itemId
        Object.keys(next).forEach((key) => {
          if (next[key] === itemId) {
            delete next[key];
          }
        });
      }
      return next;
    });
    setSelectedItemId(null);
  }, [isAnswered]);

  const selectItem = useCallback((itemId) => {
    if (isAnswered) return;
    setSelectedItemId((previous) => (previous === itemId ? null : itemId));
  }, [isAnswered]);

  const getTargetItem = useCallback((targetId) => {
    const itemId = placements[targetId];
    return items.find((item) => item.id === itemId) || null;
  }, [items, placements]);

  const handleDragStart = useCallback((event, item) => {
    if (isAnswered) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id);
    setDraggingItemId(item.id);
  }, [isAnswered]);

  const handleDragEnd = useCallback(() => {
    setDraggingItemId(null);
  }, []);

  const handleDrop = useCallback((event, targetId) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain') || draggingItemId;
    placeItem(itemId, targetId);
    setDraggingItemId(null);
  }, [draggingItemId, placeItem]);

  return {
    placements,
    sourceItems,
    selectedItemId,
    draggingItemId,
    placeItem,
    returnItem,
    selectItem,
    getTargetItem,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
}
