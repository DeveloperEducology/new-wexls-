import { useState, useEffect, useRef, useCallback } from 'react';

export default function useUniversalDnd({
  question,
  userAnswer,
  onAnswer,
  isAnswered
}) {
  const [placements, setPlacements] = useState(() => {
    if (userAnswer && typeof userAnswer === 'object') {
      return { ...userAnswer };
    }
    return {};
  });

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [activeTargetId, setActiveTargetId] = useState(null);

  const [dragState, setDragState] = useState({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false
  });

  const dragStartPos = useRef({ x: 0, y: 0 });
  const threshold = 6; // movement threshold in px to distinguish click vs drag

  // Keep track of normalized layout targets & items
  const { items, targets, layoutMode, behavior, sourceTray } = question;

  // Sync with external userAnswer changes (e.g. reset or load new question)
  useEffect(() => {
    if (userAnswer && typeof userAnswer === 'object') {
      setPlacements({ ...userAnswer });
    } else {
      setPlacements({});
    }
    setSelectedItemId(null);
    setDraggingItemId(null);
    setActiveTargetId(null);
  }, [question.id, userAnswer]);

  // Derived state: check if all items are placed
  const isComplete = useCallback((currentPlacements) => {
    if (items.length === 0) return false;
    return items.every(item => currentPlacements[item.id] !== undefined && currentPlacements[item.id] !== null);
  }, [items]);

  const targetAcceptsMultiple = useCallback((target) => {
    if (target.maxItems !== undefined) {
      return target.maxItems > 1;
    }
    return layoutMode === 'category_sort';
  }, [layoutMode]);

  const targetAcceptsItem = useCallback((target, item) => {
    if (!target.accepts || target.accepts.includes('*')) return true;
    return target.accepts.includes(item.id) || (item.category && target.accepts.includes(item.category));
  }, []);

  const placeItem = useCallback((itemId, targetId) => {
    if (isAnswered) return;

    const item = items.find(i => i.id === itemId);
    const target = targets.find(t => t.id === targetId);
    if (!item || !target || !targetAcceptsItem(target, item)) return;

    setPlacements(prev => {
      const next = { ...prev };

      // If the target only accepts one item, return any currently placed item there back to the source tray
      if (!targetAcceptsMultiple(target)) {
        Object.keys(next).forEach(key => {
          if (next[key] === targetId) {
            delete next[key];
          }
        });
      }

      next[itemId] = targetId;

      // Report answer to parent framework
      if (onAnswer) {
        onAnswer(isComplete(next) ? next : null);
      }
      return next;
    });

    setSelectedItemId(null);
  }, [items, targets, targetAcceptsItem, targetAcceptsMultiple, onAnswer, isComplete, isAnswered]);

  const returnItem = useCallback((itemId) => {
    if (isAnswered) return;

    setPlacements(prev => {
      const next = { ...prev };
      delete next[itemId];

      if (onAnswer) {
        onAnswer(isComplete(next) ? next : null);
      }
      return next;
    });

    setSelectedItemId(null);
  }, [onAnswer, isComplete, isAnswered]);

  // Derived sourceSlots
  const sourceSlots = items.map(item => {
    const isPlaced = placements[item.id] !== undefined && placements[item.id] !== null;
    if (sourceTray.placeholderMode === 'fixed') {
      return isPlaced ? null : item.id;
    }
    return isPlaced ? null : item.id;
  }).filter(slot => sourceTray.placeholderMode === 'fixed' ? true : slot !== null);

  // Click / select handlers
  const handleItemSelect = useCallback((itemId) => {
    if (isAnswered) return;

    if (placements[itemId]) {
      // If already placed, click returns it
      returnItem(itemId);
    } else {
      // Toggle selection for click-to-place
      setSelectedItemId(prev => prev === itemId ? null : itemId);
    }
  }, [placements, returnItem, isAnswered]);

  const handleTargetClick = useCallback((targetId) => {
    if (isAnswered) return;

    if (selectedItemId) {
      placeItem(selectedItemId, targetId);
    } else {
      // If a user clicks an occupied single-item target, return the item in it
      const target = targets.find(t => t.id === targetId);
      if (target && !targetAcceptsMultiple(target)) {
        const occupiedItemId = Object.keys(placements).find(key => placements[key] === targetId);
        if (occupiedItemId) {
          returnItem(occupiedItemId);
        }
      }
    }
  }, [selectedItemId, placements, targets, targetAcceptsMultiple, placeItem, returnItem, isAnswered]);

  // Drag handlers
  const handlePointerDown = useCallback((e, itemId) => {
    if (isAnswered) return;
    
    // Left click/pointer only
    if (e.button !== 0) return;

    e.target.setPointerCapture(e.pointerId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDraggingItemId(itemId);
    setDragState({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX,
      offsetY,
      width: rect.width,
      height: rect.height,
      isDragging: false
    });
  }, [isAnswered]);

  const handlePointerMove = useCallback((e) => {
    if (draggingItemId === null) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const dist = Math.hypot(dx, dy);

    setDragState(prev => {
      const isDraggingNow = prev.isDragging || dist > threshold;
      return {
        ...prev,
        isDragging: isDraggingNow,
        currentX: e.clientX,
        currentY: e.clientY
      };
    });

    // Detect target elements using document.elementFromPoint
    const elements = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [document.elementFromPoint(e.clientX, e.clientY)];
    
    let foundTargetId = null;
    for (const el of elements) {
      if (!el) continue;
      const targetEl = el.closest('[data-target-id]');
      if (targetEl) {
        foundTargetId = targetEl.getAttribute('data-target-id');
        break;
      }
    }

    if (foundTargetId) {
      const target = targets.find(t => t.id === foundTargetId);
      const item = items.find(i => i.id === draggingItemId);
      if (target && item && targetAcceptsItem(target, item)) {
        setActiveTargetId(foundTargetId);
      } else {
        setActiveTargetId(null);
      }
    } else {
      setActiveTargetId(null);
    }
  }, [draggingItemId, items, targets, targetAcceptsItem]);

  const handlePointerUp = useCallback((e) => {
    if (draggingItemId === null) return;

    e.target.releasePointerCapture(e.pointerId);

    const isDragTriggered = dragState.isDragging;
    const finalTargetId = activeTargetId;

    // Reset drag state first
    setDraggingItemId(null);
    setActiveTargetId(null);
    setDragState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false
    });

    if (isDragTriggered) {
      if (finalTargetId) {
        placeItem(draggingItemId, finalTargetId);
      } else {
        // If dropped outside, check if it was placed and now dropped in source area (return item)
        // Or if we just drop it back to return it
        const elements = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [document.elementFromPoint(e.clientX, e.clientY)];
        let droppedInSource = false;
        for (const el of elements) {
          if (el && el.closest('[data-source-tray]')) {
            droppedInSource = true;
            break;
          }
        }
        if (droppedInSource || placements[draggingItemId]) {
          returnItem(draggingItemId);
        }
      }
    } else {
      // If it didn't move beyond threshold, treat it as a click
      handleItemSelect(draggingItemId);
    }
  }, [draggingItemId, dragState.isDragging, activeTargetId, placeItem, placements, returnItem, handleItemSelect]);

  // Query helpers for layouts
  const getItemPlacement = useCallback((itemId) => placements[itemId] || null, [placements]);
  const getTargetItems = useCallback((targetId) => {
    return items.filter(item => placements[item.id] === targetId);
  }, [items, placements]);

  const isItemInSource = useCallback((itemId) => {
    return placements[itemId] === undefined || placements[itemId] === null;
  }, [placements]);

  return {
    placements,
    selectedItemId,
    draggingItemId,
    activeTargetId,
    dragState,
    sourceSlots,
    
    // Actions
    placeItem,
    returnItem,
    handleTargetClick,
    handleItemSelect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,

    // Helpers
    getItemPlacement,
    getTargetItems,
    isItemInSource,
    isComplete: isComplete(placements)
  };
}
