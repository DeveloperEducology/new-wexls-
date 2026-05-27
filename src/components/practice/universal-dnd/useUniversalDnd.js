import { useState, useEffect, useRef, useCallback } from 'react';

export default function useUniversalDnd({
  question,
  userAnswer,
  onAnswer,
  isAnswered
}) {
  // Keep track of normalized layout targets & items
  const { items, targets, layoutMode, behavior, sourceTray } = question;

  const buildInitialPlacements = (answer) => {
    if (layoutMode === 'ordering') {
      const targetIds = new Set(targets.map(target => target.id));
      if (
        answer
        && typeof answer === 'object'
        && items.every(item => targetIds.has(answer[item.id]))
      ) {
        return { ...answer };
      }
      return Object.fromEntries(
        items.map((item, index) => [item.id, targets[index]?.id]).filter(([, targetId]) => targetId)
      );
    }
    if (answer && typeof answer === 'object') return { ...answer };
    return {};
  };

  const [placements, setPlacements] = useState(() => {
    return buildInitialPlacements(userAnswer);
  });

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [previewPlacements, setPreviewPlacements] = useState(null);

  const dragParamsRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0
  });

  const dragStartPos = useRef({ x: 0, y: 0 });
  const pointerCaptureRef = useRef(null);
  const pointerIdRef = useRef(null);
  const lastQuestionIdRef = useRef(question.id);
  const lastReportedAnswer = useRef('');
  const threshold = 6; // movement threshold in px to distinguish click vs drag

  const buildOrderingPlacements = useCallback((currentPlacements, itemId, targetId) => {
    const orderedTargets = [...targets].sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetIndex = orderedTargets.findIndex(target => target.id === targetId);
    if (targetIndex < 0) return currentPlacements;

    const placedItemIds = orderedTargets
      .map(target => items.find(item => currentPlacements[item.id] === target.id)?.id)
      .filter(Boolean);
    const missingItemIds = items
      .map(item => item.id)
      .filter(id => !placedItemIds.includes(id));
    const orderedItemIds = [...placedItemIds, ...missingItemIds].filter(id => id !== itemId);

    orderedItemIds.splice(targetIndex, 0, itemId);

    return orderedItemIds.slice(0, orderedTargets.length).reduce((next, id, index) => {
      next[id] = orderedTargets[index].id;
      return next;
    }, {});
  }, [items, targets]);

  // Sync with external userAnswer changes (e.g. reset or load new question)
  useEffect(() => {
    if (lastQuestionIdRef.current === question.id) return;
    lastQuestionIdRef.current = question.id;

    const nextPlacements = buildInitialPlacements(userAnswer);
    setPlacements((current) => (
      JSON.stringify(current) === JSON.stringify(nextPlacements) ? current : nextPlacements
    ));
    setSelectedItemId(null);
    setDraggingItemId(null);
    setIsDragging(false);
    setActiveTargetId(null);
    setHasInteracted(false);
    setPreviewPlacements(null);
    lastReportedAnswer.current = '';
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
    return layoutMode === 'category_sort' || layoutMode === 'shelf_sort';
  }, [layoutMode]);

  const targetAcceptsItem = useCallback((target, item) => {
    if (behavior?.validateOn === 'submit' || behavior?.showCorrectnessImmediately === false) return true;
    if (!target.accepts || target.accepts.includes('*')) return true;
    return target.accepts.includes(item.id) || (item.category && target.accepts.includes(item.category));
  }, [behavior?.validateOn, behavior?.showCorrectnessImmediately]);

  const placeItem = useCallback((itemId, targetId) => {
    if (isAnswered) return;

    const item = items.find(i => i.id === itemId);
    const target = targets.find(t => t.id === targetId);
    if (!item || !target || !targetAcceptsItem(target, item)) return;

    let next = { ...placements };
    const previousTargetId = next[itemId];

    if (layoutMode === 'ordering') {
      next = buildOrderingPlacements(placements, itemId, targetId);
    } else if (!targetAcceptsMultiple(target)) {
      // If the target only accepts one item, return any currently placed item there back to the source tray
      Object.keys(next).forEach(key => {
        if (next[key] === targetId) {
          if (behavior?.reorderWithinTargets && previousTargetId) {
            next[key] = previousTargetId;
          } else {
            delete next[key];
          }
        }
      });
      next[itemId] = targetId;
    } else {
      next[itemId] = targetId;
    }

    setPlacements(next);
    setSelectedItemId(null);
  }, [behavior?.reorderWithinTargets, buildOrderingPlacements, items, targets, placements, layoutMode, targetAcceptsItem, targetAcceptsMultiple, onAnswer, isComplete, isAnswered]);

  const returnItem = useCallback((itemId) => {
    if (isAnswered) return;

    const next = { ...placements };
    delete next[itemId];
    setPlacements(next);
    setSelectedItemId(null);
  }, [placements, onAnswer, isComplete, isAnswered]);

  useEffect(() => {
    if (!onAnswer || isAnswered) return;

    const answer = isComplete(placements) ? placements : null;
    const serialized = JSON.stringify(answer);
    if (serialized === lastReportedAnswer.current) return;

    lastReportedAnswer.current = serialized;
    const frameId = requestAnimationFrame(() => {
      onAnswer(answer);
    });

    return () => cancelAnimationFrame(frameId);
  }, [placements, onAnswer, isComplete, isAnswered]);

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

    if (placements[itemId] && layoutMode !== 'ordering') {
      // If already placed, click returns it
      returnItem(itemId);
    } else {
      // Toggle selection for click-to-place
      setSelectedItemId(prev => prev === itemId ? null : itemId);
    }
  }, [layoutMode, placements, returnItem, isAnswered]);

  const handleTargetClick = useCallback((targetId) => {
    if (isAnswered) return;

    if (selectedItemId) {
      placeItem(selectedItemId, targetId);
    } else {
      if (layoutMode === 'ordering') return;
      // If a user clicks an occupied single-item target, return the item in it
      const target = targets.find(t => t.id === targetId);
      if (target && !targetAcceptsMultiple(target)) {
        const occupiedItemId = Object.keys(placements).find(key => placements[key] === targetId);
        if (occupiedItemId) {
          returnItem(occupiedItemId);
        }
      }
    }
  }, [layoutMode, selectedItemId, placements, targets, targetAcceptsMultiple, placeItem, returnItem, isAnswered]);

  // Drag handlers
  const handlePointerDown = useCallback((e, itemId) => {
    if (isAnswered) return;
    
    // Left click/pointer only
    if (e.button !== 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragParamsRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX,
      offsetY,
      width: rect.width,
      height: rect.height
    };

    setDraggingItemId(itemId);
    setIsDragging(false);

    if (e.currentTarget?.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerCaptureRef.current = e.currentTarget;
        pointerIdRef.current = e.pointerId;
      } catch (err) {
        console.warn('Pointer capture failed:', err);
      }
    }
  }, [isAnswered]);

  const handlePointerMove = useCallback((e) => {
    if (draggingItemId === null) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const dist = Math.hypot(dx, dy);

    const isDraggingNow = isDragging || dist > threshold;

    dragParamsRef.current.currentX = e.clientX;
    dragParamsRef.current.currentY = e.clientY;

    if (isDraggingNow) {
      if (!isDragging) {
        setIsDragging(true);
      }
      
      // Update the DOM element directly for butter-smooth dragging (bypassing React re-renders)
      const dragEl = document.getElementById('universal-dnd-drag-layer');
      if (dragEl) {
        const x = e.clientX - dragParamsRef.current.offsetX;
        const y = e.clientY - dragParamsRef.current.offsetY;
        const isOrdering = layoutMode === 'ordering';

        const item = items.find(i => i.id === draggingItemId);
        const qStyle = String(question.cardStyle || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
        const itemCardStyle = String(item?.cardStyle || item?.imageCardStyle || item?.renderStyle || item?.variant || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
        const transparentStyles = new Set(['transparent_png', 'transparent', 'borderless', 'border_none', 'none', 'png_only']);
        const isTransparentPng = transparentStyles.has(qStyle) || transparentStyles.has(itemCardStyle) || item?.transparent === true || item?.showCard === false || item?.borderless === true;

        const transformSuffix = isOrdering 
          ? 'scale(1.02)' 
          : (isTransparentPng ? 'scale(1.05)' : 'scale(1.05) rotate(2deg)');
        
        dragEl.style.transform = `translate3d(${x}px, ${y}px, 0) ${transformSuffix}`;
      }
    }

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

    if (!foundTargetId && layoutMode === 'ordering') {
      const orderingTargets = Array.from(document.querySelectorAll('[data-ordering-target="true"]'));
      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      orderingTargets.forEach((targetEl) => {
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = targetEl;
        }
      });
      if (nearest && nearestDistance < 140) {
        foundTargetId = nearest.getAttribute('data-target-id');
      }
    }

    // Only update state if activeTargetId actually changes to prevent render storms
    if (foundTargetId !== activeTargetId) {
      if (foundTargetId) {
        const target = targets.find(t => t.id === foundTargetId);
        const item = items.find(i => i.id === draggingItemId);
        if (target && item && targetAcceptsItem(target, item)) {
          setActiveTargetId(foundTargetId);
          if (layoutMode === 'ordering') {
            const nextPreview = buildOrderingPlacements(placements, draggingItemId, foundTargetId);
            setPreviewPlacements((current) => (
              JSON.stringify(current) === JSON.stringify(nextPreview) ? current : nextPreview
            ));
          }
          setHasInteracted(true);
        } else {
          setActiveTargetId(null);
          setPreviewPlacements(null);
        }
      } else {
        setActiveTargetId(null);
        setPreviewPlacements(null);
      }
    }
  }, [buildOrderingPlacements, layoutMode, draggingItemId, items, targets, placements, targetAcceptsItem, isDragging, activeTargetId, question.cardStyle]);

  const handlePointerUp = useCallback((e) => {
    if (draggingItemId === null) return;

    const capturedElement = pointerCaptureRef.current;
    const capturedPointerId = pointerIdRef.current;
    if (capturedElement?.releasePointerCapture && capturedPointerId !== null) {
      try {
        if (!capturedElement.hasPointerCapture || capturedElement.hasPointerCapture(capturedPointerId)) {
          capturedElement.releasePointerCapture(capturedPointerId);
        }
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
    pointerCaptureRef.current = null;
    pointerIdRef.current = null;

    const isDragTriggered = isDragging;
    const finalTargetId = activeTargetId;
    const shouldKeepOrderingPreview = layoutMode === 'ordering' && isDragTriggered && Boolean(finalTargetId);

    // Reset drag states first
    setDraggingItemId(null);
    setIsDragging(false);
    setActiveTargetId(null);
    if (!shouldKeepOrderingPreview) {
      setPreviewPlacements(null);
    }

    if (isDragTriggered) {
      if (finalTargetId) {
        placeItem(draggingItemId, finalTargetId);
        if (layoutMode === 'ordering') {
          window.setTimeout(() => setPreviewPlacements(null), 220);
        }
        setHasInteracted(true);
      } else if (layoutMode !== 'ordering') {
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
  }, [layoutMode, draggingItemId, isDragging, activeTargetId, placeItem, placements, returnItem, handleItemSelect]);

  // Global window listeners during active dragging to capture fast pointer moves and off-boundary updates
  useEffect(() => {
    if (draggingItemId === null) return;

    const onPointerMove = (e) => {
      handlePointerMove(e);
    };

    const onPointerUp = (e) => {
      handlePointerUp(e);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [draggingItemId, handlePointerMove, handlePointerUp]);

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
    previewPlacements,
    selectedItemId,
    draggingItemId: isDragging ? draggingItemId : null,
    activeTargetId,
    hasInteracted,
    dragState: {
      isDragging,
      startX: dragParamsRef.current.startX,
      startY: dragParamsRef.current.startY,
      currentX: dragParamsRef.current.currentX,
      currentY: dragParamsRef.current.currentY,
      offsetX: dragParamsRef.current.offsetX,
      offsetY: dragParamsRef.current.offsetY,
      width: dragParamsRef.current.width,
      height: dragParamsRef.current.height
    },
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
