'use client';

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import styles from '../../FillInTheBlankRenderer.module.css';
import { speakText } from '@/lib/ttsClient';
import { resolveToolSvg } from '@/lib/practice/svgTools';
import OrderingLayout from './layouts/OrderingLayout';
import GridFillLayout from './layouts/GridFillLayout';
import DiagramSlotsLayout from './layouts/DiagramSlotsLayout';

const isInlineSvg = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg');
};

const cleanSvgContent = (svgStr) => {
  if (!svgStr) return '';
  let cleaned = svgStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
  cleaned = cleaned.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
};

const getSvgDataUrl = (svgStr) => {
  const cleaned = cleanSvgContent(svgStr);
  return `data:image/svg+xml;utf8,${encodeURIComponent(cleaned)}`;
};

const renderCubeSvg = ({ color, stroke, size = 48, hasRightPeg = true }) => {
  const pegSize = Math.round(size * 0.38);
  const rightPegWidth = Math.round(size * 0.12);
  const rightPegHeight = Math.round(size * 0.32);
  const r = 6;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {hasRightPeg && (
        <rect
          x={size - 2}
          y={(size - rightPegHeight) / 2}
          width={rightPegWidth + 2}
          height={rightPegHeight}
          rx={3}
          fill={color}
          stroke={stroke}
          strokeWidth={1.5}
        />
      )}
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={r}
        fill={color}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <rect
        x={2.5}
        y={2.5}
        width={size - 5}
        height={size - 5}
        rx={r - 1}
        stroke="white"
        strokeWidth={1}
        strokeOpacity={0.25}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={pegSize / 2}
        fill={color}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={pegSize / 2 - 1}
        stroke="white"
        strokeWidth={1}
        strokeOpacity={0.2}
      />
      <circle
        cx={size / 2 - 2}
        cy={size / 2 - 2}
        r={pegSize / 4}
        fill="white"
        fillOpacity={0.15}
      />
    </svg>
  );
};

function CategorySortLayout({
  categories,
  items,
  cardStyle,
  hideItemLabels = false,
  isCopiable = false,
  isRemoval = false,
  isV2 = false,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const [zones, setZones] = useState({});
  const [copyZones, setCopyZones] = useState({});
  const [removedZones, setRemovedZones] = useState({});
  const [activeDropZone, setActiveDropZone] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [sourceSlots, setSourceSlots] = useState(() => items.map((item) => item.id));
  
  const hasGridCategory = categories.some((cat) => cat.isGrid === true || (Number(cat.rows) > 0 && Number(cat.columns) > 0));
  const isCubeTrain = !hasGridCategory && (categories.some((cat) => cat.id === 'cube_train') || items.some((item) => item.visual === 'cube'));
  const dragMetaRef = useRef(null);

  const cardWidth = 174;
  const cardHeight = 148;
  const textCardMinWidth = 96;
  const textCardMaxWidth = 154;
  const textCardHeight = 54;
  const hasItemVisual = (item) => Boolean(item.imageUrl || item.svg || resolveToolSvg(item));
  const getTextCardWidth = (item) => {
    const contentLength = String(item.content || '').replace(/\s+/g, '').length;
    return Math.max(textCardMinWidth, Math.min(textCardMaxWidth, contentLength * 15 + 34));
  };
  // When imageWidth is specified, shrink the card to wrap tightly around the image
  const getImageCardSize = (item) => {
    if (hasItemVisual(item) && item.imageWidth) {
      const sz = Math.max(60, Math.min(200, Number(item.imageWidth) + 24));
      return sz;
    }
    return null;
  };
  const itemCardWidth = (item) => {
    if (isV2 && !hasItemVisual(item)) return getTextCardWidth(item);
    return getImageCardSize(item) || cardWidth;
  };
  const itemCardHeight = (item) => {
    if (isV2 && !hasItemVisual(item)) return textCardHeight;
    // image-only cards: square; image+label: add ~30px for label
    const sz = getImageCardSize(item);
    if (sz) return item.content && item.content.trim() ? sz + 30 : sz;
    return cardHeight;
  };
  const normalizeStyleToken = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const questionCardStyle = normalizeStyleToken(cardStyle);
  const isTransparentImageStyle = (item) => {
    const itemCardStyle = normalizeStyleToken(item.cardStyle || item.imageCardStyle || item.renderStyle || item.variant);
    const itemBorder = normalizeStyleToken(item.border || item.cardBorder);
    const transparentStyles = new Set(['transparent_png', 'transparent', 'borderless', 'border_none', 'none', 'png_only']);

    return hasItemVisual(item) && (
      transparentStyles.has(questionCardStyle) ||
      transparentStyles.has(itemCardStyle) ||
      itemBorder === 'none' ||
      item.transparent === true ||
      item.showCard === false ||
      item.borderless === true
    );
  };
  const shouldHideImageLabel = (item) => {
    const itemCardStyle = normalizeStyleToken(item.cardStyle || item.imageCardStyle || item.renderStyle || item.variant);
    return hideItemLabels || item.hideLabel === true || itemCardStyle === 'transparent_png' || questionCardStyle === 'transparent_png' || questionCardStyle === 'png_only';
  };
  const allItemsHaveImageWidth = items.length > 0 && items.every((item) => hasItemVisual(item) && item.imageWidth);
  const gridCardWidth = isV2 && !allItemsHaveImageWidth && items.every((item) => !hasItemVisual(item))
    ? Math.max(...items.map(getTextCardWidth), textCardMinWidth)
    : allItemsHaveImageWidth
      ? Math.max(60, Math.min(200, Number(items[0]?.imageWidth || 100) + 24))
      : cardWidth;
  const responsiveGridCardWidth = isV2 && items.some((item) => hasItemVisual(item))
    ? `clamp(96px, 28vw, ${gridCardWidth}px)`
    : `${gridCardWidth}px`;
  const gridCardHeight = isV2 && items.every((item) => !hasItemVisual(item)) ? textCardHeight : gridCardWidth;
  const sourceSlotHeight = Math.max(gridCardHeight, ...items.map(itemCardHeight));
  const responsiveSourceSlotHeight = isV2 && items.some((item) => hasItemVisual(item))
    ? `clamp(96px, 28vw, ${sourceSlotHeight}px)`
    : `${sourceSlotHeight}px`;
  useEffect(() => {
    setZones({});
    setCopyZones({});
    setRemovedZones({});
    setActiveDropZone(null);
    setDraggingId(null);
    setDragState(null);
    setSelectedItemId(null);
    setSourceSlots(items.map((item) => item.id));
  }, [items]);

  useEffect(() => () => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const placeItem = (itemId, categoryId, options = {}) => {
    if (isAnswered) return;
    const next = { ...zones };
    if (categoryId) {
      next[itemId] = categoryId;
    } else {
      delete next[itemId];
    }
    setZones(next);
    setSourceSlots((currentSlots) => {
      const validItemIds = new Set(items.map((item) => item.id));
      const normalizedSlots = (
        currentSlots.length === items.length
        && currentSlots.every((slotId) => slotId === null || validItemIds.has(slotId))
      )
        ? [...currentSlots]
        : items.map((item) => (next[item.id] ? null : item.id));
      const openSlots = normalizedSlots.map((slotId) => (slotId === itemId ? null : slotId));

      if (categoryId) return openSlots;

      const requestedSlotIndex = Number.isInteger(options.sourceSlotIndex)
        && openSlots[options.sourceSlotIndex] === null
        ? options.sourceSlotIndex
        : null;
      const openIndex = requestedSlotIndex ?? openSlots.findIndex((slotId) => slotId === null);
      if (openIndex === -1) return openSlots;
      openSlots[openIndex] = itemId;
      return openSlots;
    });
    if (items.every((item) => next[item.id])) {
      onAnswer?.(next);
    } else {
      onAnswer?.(null);
    }
    setSelectedItemId(null);
  };

  const itemById = new Map(items.map((item) => [item.id, item]));

  const buildCopyAnswer = (nextCopyZones) => Object.fromEntries(
    categories.map((category) => [category.id, (nextCopyZones[category.id] || []).length])
  );

  const isCopyAnswerComplete = (nextCopyZones) => categories.every((category) => (
    (nextCopyZones[category.id] || []).length === Number(category.requiredCount || category.maxCount || 0)
  ));

  const commitCopyAnswer = (nextCopyZones) => {
    onAnswer?.(isCopyAnswerComplete(nextCopyZones) ? buildCopyAnswer(nextCopyZones) : null);
  };

  const buildRemovalAnswer = (nextRemovedZones) => Object.fromEntries(
    categories.map((category) => {
      const prefilledCount = Number(category.prefilledCount || 0);
      const removedCount = (nextRemovedZones[category.id] || []).length;
      return [category.id, prefilledCount - removedCount];
    })
  );

  const isRemovalAnswerComplete = (nextRemovedZones) => categories.every((category) => (
    (nextRemovedZones[category.id] || []).length === Number(category.removeCount || 0)
  ));

  const commitRemovalAnswer = (nextRemovedZones) => {
    onAnswer?.(isRemovalAnswerComplete(nextRemovedZones) ? buildRemovalAnswer(nextRemovedZones) : null);
  };

  const toggleRemovedCube = (categoryId, cubeIndex) => {
    if (isAnswered) return;
    const category = categories.find((candidate) => candidate.id === categoryId);
    const removeCount = Number(category?.removeCount || 0);
    const currentRemoved = removedZones[categoryId] || [];
    const isRemoved = currentRemoved.includes(cubeIndex);
    const nextRemoved = isRemoved
      ? currentRemoved.filter((index) => index !== cubeIndex)
      : currentRemoved.length < removeCount
        ? [...currentRemoved, cubeIndex]
        : currentRemoved;

    const next = {
      ...removedZones,
      [categoryId]: nextRemoved,
    };
    setRemovedZones(next);
    commitRemovalAnswer(next);
  };

  const getCopySourceElement = (itemId) => (
    document.querySelector(`[data-copy-source-id="${itemId}"]`)
  );

  const getCopyElement = (instanceId) => (
    document.querySelector(`[data-copy-instance-id="${instanceId}"]`)
  );

  const animateInsertedCopyFromSource = (sourceRect, instanceId) => {
    if (!sourceRect) return;

    window.requestAnimationFrame(() => {
      const copyElement = getCopyElement(instanceId);
      if (!copyElement) return;

      const targetRect = copyElement.getBoundingClientRect();
      const dx = sourceRect.left - targetRect.left;
      const dy = sourceRect.top - targetRect.top;

      copyElement.style.transition = 'none';
      copyElement.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
      copyElement.style.zIndex = '3';
      copyElement.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        copyElement.style.transition = 'transform 520ms cubic-bezier(0.18, 0.9, 0.2, 1), box-shadow 520ms ease';
        copyElement.style.transform = 'translate(0, 0) scale(1)';
        copyElement.style.boxShadow = '0 18px 34px rgba(15, 23, 42, 0.14)';

        window.setTimeout(() => {
          copyElement.style.transition = '';
          copyElement.style.transform = '';
          copyElement.style.zIndex = '';
          copyElement.style.boxShadow = '';
        }, 550);
      });
    });
  };

  const copyItemToZone = (itemId, categoryId) => {
    if (isAnswered || !categoryId || !itemById.has(itemId)) return;
    const category = categories.find((candidate) => candidate.id === categoryId);
    const maxCopies = Number(category?.requiredCount ?? category?.maxCount ?? Infinity);
    const currentCopies = copyZones[categoryId] || [];
    if (currentCopies.length >= maxCopies) return;
    const sourceRect = getCopySourceElement(itemId)?.getBoundingClientRect();
    const instanceId = `${itemId}_${Date.now()}_${currentCopies.length}`;

    const next = {
      ...copyZones,
      [categoryId]: [
        ...currentCopies,
        {
          instanceId,
          itemId,
        },
      ],
    };
    flushSync(() => setCopyZones(next));
    animateInsertedCopyFromSource(sourceRect, instanceId);
    commitCopyAnswer(next);
  };

  const copyItemToNextOpenSlot = (itemId) => {
    if (isAnswered || !itemById.has(itemId)) return;
    const targetCategory = categories.find((category) => {
      const maxCopies = Number(category.requiredCount ?? category.maxCount ?? Infinity);
      return (copyZones[category.id] || []).length < maxCopies;
    });
    if (targetCategory) copyItemToZone(itemId, targetCategory.id);
  };

  const removeCopyFromZone = (categoryId, instanceId) => {
    if (isAnswered) return;
    const next = {
      ...copyZones,
      [categoryId]: (copyZones[categoryId] || []).filter((copy) => copy.instanceId !== instanceId),
    };
    setCopyZones(next);
    commitCopyAnswer(next);
  };

  const getCardElement = (itemId) => (
    Array.from(document.querySelectorAll('[data-card-id]')).find((element) => element.dataset.cardId === itemId)
  );

  const findPointerDropZone = (clientX, clientY) => {
    const magnetPadding = isV2 ? 46 : 0;
    const sourceSlotElement = Array.from(document.querySelectorAll('[data-source-slot-index]')).find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        clientX >= rect.left - magnetPadding
        && clientX <= rect.right + magnetPadding
        && clientY >= rect.top - magnetPadding
        && clientY <= rect.bottom + magnetPadding
      );
    });
    if (sourceSlotElement?.dataset.sourceSlotIndex) {
      return {
        id: 'pool',
        sourceSlotIndex: Number(sourceSlotElement.dataset.sourceSlotIndex),
      };
    }

    const categoryElement = Array.from(document.querySelectorAll('[data-category-zone-id]')).find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        clientX >= rect.left - magnetPadding
        && clientX <= rect.right + magnetPadding
        && clientY >= rect.top - magnetPadding
        && clientY <= rect.bottom + magnetPadding
      );
    });
    if (categoryElement?.dataset.categoryZoneId) return { id: categoryElement.dataset.categoryZoneId };

    const sourceTray = document.querySelector('[data-source-tray="true"]');
    if (sourceTray) {
      const rect = sourceTray.getBoundingClientRect();
      if (
        clientX >= rect.left - magnetPadding
        && clientX <= rect.right + magnetPadding
        && clientY >= rect.top - magnetPadding
        && clientY <= rect.bottom + magnetPadding
      ) {
        return { id: 'pool' };
      }
    }

    return null;
  };

  const animatePlacedCardFromDrag = (itemId, firstRect) => {
    if (!firstRect) return;

    window.requestAnimationFrame(() => {
      const movedCard = getCardElement(itemId);
      if (!movedCard) return;

      const lastRect = movedCard.getBoundingClientRect();
      const dx = firstRect.left - lastRect.left;
      const dy = firstRect.top - lastRect.top;
      const scaleX = firstRect.width / Math.max(lastRect.width, 1);
      const scaleY = firstRect.height / Math.max(lastRect.height, 1);

      movedCard.style.transition = 'none';
      movedCard.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
      movedCard.style.opacity = '0.96';
      movedCard.style.zIndex = '4';
      movedCard.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        movedCard.style.transition = 'transform 520ms cubic-bezier(0.18, 0.9, 0.2, 1), box-shadow 520ms ease, opacity 180ms ease';
        movedCard.style.transform = 'translate(0, 0) scale(1)';
        movedCard.style.opacity = '1';
        movedCard.style.boxShadow = '0 18px 36px rgba(15, 23, 42, 0.14)';

        window.setTimeout(() => {
          movedCard.style.transition = '';
          movedCard.style.transform = '';
          movedCard.style.opacity = '';
          movedCard.style.zIndex = '';
          movedCard.style.boxShadow = '';
        }, 560);
      });
    });
  };

  const commitPointerDrop = (dropTarget) => {
    const meta = dragMetaRef.current;
    if (!meta) return;
    const targetId = typeof dropTarget === 'string' ? dropTarget : dropTarget?.id;

    const firstRect = {
      left: meta.lastX,
      top: meta.lastY,
      width: meta.width,
      height: meta.height,
    };

    flushSync(() => {
      placeItem(meta.itemId, targetId === 'pool' ? null : targetId, {
        sourceSlotIndex: dropTarget?.sourceSlotIndex,
      });
      setDraggingId(null);
      setDragState(null);
      setActiveDropZone(null);
    });

    animatePlacedCardFromDrag(meta.itemId, firstRect);
    dragMetaRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  const beginPointerDrag = (item, event) => {
    if (isAnswered || isCopiable || isRemoval) return;
    if (event.button !== undefined && event.button !== 0) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const pointerOffsetX = event.clientX - rect.left;
    const pointerOffsetY = event.clientY - rect.top;
    const initialX = event.clientX - pointerOffsetX;
    const initialY = event.clientY - pointerOffsetY;

    event.preventDefault();
    element.setPointerCapture?.(event.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    dragMetaRef.current = {
      itemId: item.id,
      pointerId: event.pointerId,
      pointerOffsetX,
      pointerOffsetY,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
      width: rect.width,
      height: rect.height,
      lastX: initialX,
      lastY: initialY,
    };

    setActiveDropZone(null);
    setDragState({
      item,
      x: initialX,
      y: initialY,
      width: rect.width,
      height: rect.height,
      isActive: false,
    });
  };

  useEffect(() => {
    if (!dragState || !dragMetaRef.current) return undefined;

    let animationFrame = null;

    const handlePointerMove = (event) => {
      const meta = dragMetaRef.current;
      if (!meta) return;
      const nextX = event.clientX - meta.pointerOffsetX;
      const nextY = event.clientY - meta.pointerOffsetY;
      if (Math.abs(event.clientX - meta.startClientX) > 5 || Math.abs(event.clientY - meta.startClientY) > 5) {
        meta.moved = true;
        setDraggingId(meta.itemId);
      }
      meta.lastX = nextX;
      meta.lastY = nextY;

      const zone = findPointerDropZone(event.clientX, event.clientY);
      setActiveDropZone(zone?.id || null);

      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setDragState((current) => (current ? { ...current, x: nextX, y: nextY, isActive: meta.moved } : current));
      });
    };

    const handlePointerUp = (event) => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      const meta = dragMetaRef.current;
      if (isV2 && meta && !meta.moved) {
        dragMetaRef.current = null;
        setDraggingId(null);
        setDragState(null);
        setActiveDropZone(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        return;
      }

      const zone = findPointerDropZone(event.clientX, event.clientY);
      if (zone) {
        commitPointerDrop(zone);
        return;
      }

      dragMetaRef.current = null;
      setDraggingId(null);
      setDragState(null);
      setActiveDropZone(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState]);

  const placeItemWithRealCardAnimation = (itemId, categoryId, options = {}) => {
    const source = getCardElement(itemId);
    const firstRect = source?.getBoundingClientRect();

    flushSync(() => {
      placeItem(itemId, categoryId, options);
      setDraggingId(null);
    });

    if (!firstRect) return;

    window.requestAnimationFrame(() => {
      const movedCard = getCardElement(itemId);
      if (!movedCard) return;

      const lastRect = movedCard.getBoundingClientRect();
      const dx = firstRect.left - lastRect.left;
      const dy = firstRect.top - lastRect.top;

      movedCard.style.transition = 'none';
      movedCard.style.transform = `translate(${dx}px, ${dy}px)`;
      movedCard.style.zIndex = '2';
      movedCard.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        movedCard.style.transition = 'transform 560ms cubic-bezier(0.18, 0.9, 0.2, 1), box-shadow 560ms ease, opacity 160ms ease';
        movedCard.style.transform = 'translate(0, 0)';
        movedCard.style.boxShadow = '0 18px 34px rgba(15, 23, 42, 0.14)';

        window.setTimeout(() => {
          movedCard.style.transition = '';
          movedCard.style.transform = '';
          movedCard.style.zIndex = '';
          movedCard.style.boxShadow = '';
        }, 590);
      });
    });
  };

  const handleDrop = (event, categoryId) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain');
    const copyInstanceId = event.dataTransfer.getData('application/x-copy-instance');
    const copyCategoryId = event.dataTransfer.getData('application/x-copy-category');
    if (copyInstanceId && categoryId === null) {
      removeCopyFromZone(copyCategoryId, copyInstanceId);
      setActiveDropZone(null);
      return;
    }
    if (isCopiable && itemById.has(itemId)) {
      copyItemToZone(itemId, categoryId);
      setActiveDropZone(null);
      return;
    }
    if (itemById.has(itemId)) {
      const sourceSlot = event.target.closest?.('[data-source-slot-index]');
      const sourceSlotIndex = categoryId === null && sourceSlot
        ? Number(sourceSlot.dataset.sourceSlotIndex)
        : undefined;
      placeItemWithRealCardAnimation(itemId, categoryId, { sourceSlotIndex });
    }
    setActiveDropZone(null);
  };

  const renderCopyVisual = (item, size = 64, overrides = {}) => {
    const fill = overrides.color || item.color;
    const stroke = overrides.stroke || item.stroke;

    const svgContent = overrides.svg || item.svg || resolveToolSvg(item);
    const imgUrl = overrides.imageUrl || item.imageUrl;

    if (item.visual === 'cube' || overrides.visual === 'cube') {
      return renderCubeSvg({
        color: fill || '#c45add',
        stroke: stroke || '#a83ac4',
        size: size,
        hasRightPeg: true
      });
    }

    if (item.visual === 'dot' || overrides.visual === 'dot') {
      return (
        <div
          style={{
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: '50%',
            background: fill || '#6366f1',
            border: `2px solid ${stroke || '#4338ca'}`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          }}
        />
      );
    }

    if (svgContent || (imgUrl && isInlineSvg(imgUrl))) {
      const cleaned = svgContent ? cleanSvgContent(svgContent) : cleanSvgContent(imgUrl);
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .inline-svg-wrapper svg {
              max-width: 100%;
              max-height: 100%;
              width: 100%;
              height: 100%;
              display: block;
              pointer-events: none;
            }
            .inline-svg-wrapper svg * {
              pointer-events: none;
            }
          ` }} />
          <div
            className="inline-svg-wrapper"
            style={{
              width: size * 0.8,
              height: size * 0.8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
            dangerouslySetInnerHTML={{ __html: cleaned }}
          />
        </div>
      );
    }

    if (item.visual === 'circle' || item.visual === 'counter' || overrides.visual === 'circle' || overrides.visual === 'counter') {
      return (
        <div
          style={{
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: '50%',
            background: fill || '#ef4444',
            border: `3px solid ${stroke || '#b91c1c'}`,
            boxShadow: 'inset -4px -4px 0 rgba(0, 0, 0, 0.15), 0 4px 10px rgba(15, 23, 42, 0.15)',
          }}
        />
      );
    }

    if (item.visual === 'emoji' || overrides.visual === 'emoji') {
      return (
        <div style={{ fontSize: size * 0.65, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          {overrides.emoji || item.emoji || '🍎'}
        </div>
      );
    }

    if (item.visual === 'image' || overrides.visual === 'image' || imgUrl) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <img 
            src={imgUrl} 
            alt={item.content || ''}
            style={{ width: size * 0.8, height: size * 0.8, objectFit: 'contain' }}
            draggable="false"
          />
        </div>
      );
    }

    if (item.visual === 'die' || item.visual === 'dice') {
      const dots = {
        1: [[50, 50]],
        2: [[32, 32], [68, 68]],
        3: [[30, 30], [50, 50], [70, 70]],
        4: [[30, 30], [70, 30], [30, 70], [70, 70]],
        5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
        6: [[30, 28], [70, 28], [30, 50], [70, 50], [30, 72], [70, 72]],
      }[Number(item.value || 1)] || [[50, 50]];

      return (
        <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
          <rect x="8" y="8" width="84" height="84" rx="16" fill={fill || '#c084fc'} stroke={stroke || '#9333ea'} strokeWidth="4" />
          <rect x="16" y="16" width="62" height="18" rx="9" fill="#ffffff" opacity="0.18" />
          {dots.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill="#ffffff" opacity="0.9" />)}
        </svg>
      );
    }

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          background: fill || '#c084fc',
          border: `3px solid ${stroke || '#9333ea'}`,
          boxShadow: 'inset -8px -8px 0 rgba(0, 0, 0, 0.12), 0 8px 16px rgba(15, 23, 42, 0.10)',
        }}
      />
    );
  };

  const renderCopyMode = () => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{
        display: 'flex',
        flexDirection: categories.some(cat => cat.isTower || cat.layout === 'vertical' || cat.id?.startsWith('tower')) ? 'row' : 'column',
        gap: categories.some(cat => cat.isTower || cat.layout === 'vertical' || cat.id?.startsWith('tower')) ? 8 : (isCubeTrain ? 12 : 16),
        flexWrap: categories.some(cat => cat.isTower || cat.layout === 'vertical' || cat.id?.startsWith('tower')) ? 'nowrap' : 'wrap',
        justifyContent: 'center',
        alignItems: 'stretch',
        overflowX: 'auto'
      }}>
        {categories.map((category) => {
          const requiredCount = Number(category.requiredCount || category.maxCount || 0);
          const prefilledCount = Number(category.prefilledCount || 0);
          const placedCopies = copyZones[category.id] || [];
          const isActive = activeDropZone === category.id;
          const numRows = Number(category.rows || 0);
          const numCols = Number(category.columns || 0);
          const hasGrid = (category.isGrid === true || (numRows > 0 && numCols > 0));
          const isDotGrid = hasGrid && (category.visual === 'dot' || items[0]?.visual === 'dot');
          const isTower = isCubeTrain && (category.isTower === true || category.layout === 'vertical' || category.id?.startsWith('tower'));
          // Adaptive cell size: scale down for larger grids to prevent overflow
          const cellSize = (numCols > 6 || numRows > 5) ? 48 : (numCols > 4 || numRows > 4) ? 60 : 76;
          const totalCubes = prefilledCount + requiredCount;
          const cubeSize = totalCubes > 10 ? (totalCubes > 15 ? 32 : 38) : 48;

          return (
            <div
              key={category.id}
              onDragEnter={() => setActiveDropZone(category.id)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropZone(null);
              }}
              onDrop={(event) => handleDrop(event, category.id)}
              style={isCubeTrain ? {
                padding: '2px 0',
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
                width: isTower ? 'auto' : '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              } : {
                padding: 18,
                border: `2px solid ${isActive ? '#2563eb' : '#dbeafe'}`,
                borderRadius: 16,
                background: isActive ? '#eff6ff' : '#ffffff',
                boxShadow: isActive ? '0 16px 34px rgba(37, 99, 235, 0.12)' : '0 8px 22px rgba(15, 23, 42, 0.05)',
                transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
              }}
            >
              {category.label ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#334155', fontSize: 18, fontWeight: 900 }}>
                  <button
                     type="button"
                     onClick={() => speakText(category.label)}
                     style={{
                       background: '#e0f2fe',
                       border: 'none',
                       borderRadius: '50%',
                       width: '30px',
                       height: '30px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       cursor: 'pointer',
                       color: '#0284c7',
                       boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
                       transition: 'transform 0.2s ease, background 0.2s ease',
                       flexShrink: 0,
                     }}
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#bae6fd'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#e0f2fe'; }}
                     title="Read category name out loud"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  </button>
                  <span>{category.label}</span>
                </div>
              ) : null}

              {isCubeTrain ? (
                <div
                  style={isTower ? {
                    width: 'auto',
                    maxWidth: '160px',
                    minHeight: 'auto',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    alignItems: 'center',
                    padding: '8px 8px',
                    boxShadow: isActive ? '0 8px 24px rgba(37, 99, 235, 0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'border-color 180ms ease, background 180ms ease',
                    position: 'relative',
                    boxSizing: 'border-box'
                  } : {
                    width: '100%',
                    maxWidth: '560px',
                    minHeight: 'auto',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    boxShadow: isActive ? '0 8px 24px rgba(37, 99, 235, 0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'border-color 180ms ease, background 180ms ease',
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: isTower ? 'column-reverse' : 'row',
                    alignItems: 'center',
                    gap: 0,
                    flexWrap: isTower ? 'nowrap' : 'wrap'
                  }}>
                    {/* Prefilled cubes */}
                    {Array.from({ length: prefilledCount }).map((_, index) => (
                      <div key={`prefilled-${index}`} style={{ position: 'relative', marginRight: isTower ? 0 : -2, marginBottom: isTower ? -2 : 0 }}>
                        {renderCubeSvg({
                          color: category.prefillColor || '#ff8a3d',
                          stroke: category.prefillStroke || '#e06013',
                          size: cubeSize,
                          hasRightPeg: !isTower,
                          hasTopPeg: isTower
                        })}
                      </div>
                    ))}
                    
                    {/* Placed copies */}
                    {placedCopies.map((copy, index) => {
                      const sourceItem = itemById.get(copy.itemId);
                      return (
                        <button
                          key={copy.instanceId}
                          data-copy-instance-id={copy.instanceId}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => removeCopyFromZone(category.id, copy.instanceId)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            margin: 0,
                            marginRight: isTower ? 0 : -2,
                            marginBottom: isTower ? -2 : 0,
                            cursor: isAnswered ? 'default' : 'pointer',
                            position: 'relative',
                            animation: 'copyDropIn 200ms cubic-bezier(0.18, 0.9, 0.2, 1.2)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {renderCubeSvg({
                            color: sourceItem?.color || '#c45add',
                            stroke: sourceItem?.stroke || '#a83ac4',
                            size: cubeSize,
                            hasRightPeg: !isTower,
                            hasTopPeg: isTower
                          })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : hasGrid ? (
                <div
                  style={isDotGrid ? {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${numCols}, 1fr)`,
                    gridTemplateRows: `repeat(${numRows}, 1fr)`,
                    gap: '12px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: 16,
                    padding: 16,
                    width: 'max-content',
                    background: '#f8fafc',
                    boxShadow: isActive ? '0 16px 34px rgba(37, 99, 235, 0.08)' : 'none',
                    transition: 'border-color 180ms ease, background 180ms ease',
                  } : {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${numCols}, 1fr)`,
                    gridTemplateRows: `repeat(${numRows}, 1fr)`,
                    gap: 0,
                    border: '3px solid #3b5166',
                    borderRadius: 12,
                    overflow: 'hidden',
                    width: 'max-content',
                    background: '#ffffff',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  {Array.from({ length: numRows * numCols }).map((_, cellIndex) => {
                    const r = Math.floor(cellIndex / numCols);
                    const c = cellIndex % numCols;
                    const isPrefilled = cellIndex < prefilledCount;
                    const isActiveSlot = cellIndex >= prefilledCount && cellIndex < prefilledCount + requiredCount;
                    
                    const cellStyle = {
                      width: cellSize,
                      height: cellSize,
                      borderBottom: isDotGrid ? 'none' : (r < numRows - 1 ? '2px solid #3b5166' : 'none'),
                      borderRight: isDotGrid ? 'none' : (c < numCols - 1 ? '2px solid #3b5166' : 'none'),
                      background: isDotGrid ? 'transparent' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      position: 'relative',
                    };

                    if (isPrefilled) {
                      return (
                        <div key={`cell-${cellIndex}`} style={cellStyle}>
                          {renderCopyVisual(items[0] || {}, cellSize - 16, {
                            color: category.prefillColor,
                            stroke: category.prefillStroke,
                            svg: category.prefillSvg || category.svg,
                            imageUrl: category.prefillImageUrl || category.imageUrl,
                            visual: category.visual
                          })}
                        </div>
                      );
                    }

                    if (isActiveSlot) {
                      const slotIndex = cellIndex - prefilledCount;
                      const copy = placedCopies[slotIndex];
                      const sourceItem = copy ? itemById.get(copy.itemId) : null;
                      
                      return (
                        <div
                          key={`cell-${cellIndex}`}
                          onDragEnter={() => setActiveDropZone(category.id)}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(event) => handleDrop(event, category.id)}
                          style={{
                            ...cellStyle,
                            background: copy ? '#ffffff' : '#f8fafc',
                            cursor: isAnswered ? 'default' : 'pointer',
                          }}
                        >
                          {copy && sourceItem ? (
                            <div
                              data-copy-instance-id={copy.instanceId}
                              draggable={!isAnswered}
                              onDragStart={(event) => {
                                event.dataTransfer.setData('text/plain', sourceItem.id);
                                event.dataTransfer.setData('application/x-copy-instance', copy.instanceId);
                                event.dataTransfer.setData('application/x-copy-category', category.id);
                                event.dataTransfer.effectAllowed = 'move';
                              }}
                              onClick={() => removeCopyFromZone(category.id, copy.instanceId)}
                              style={{
                                cursor: isAnswered ? 'default' : 'pointer',
                                animation: 'copyDropIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                                touchAction: 'manipulation',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {renderCopyVisual(sourceItem, cellSize - 16)}
                            </div>
                          ) : (
                            <div style={{
                              position: 'absolute',
                              inset: 6,
                              border: '2px dashed #cbd5e1',
                              borderRadius: 8,
                              pointerEvents: 'none'
                            }} />
                          )}
                        </div>
                      );
                    }

                    // Inactive empty cell (e.g. spacer cells in a Ten Frame)
                    return (
                      <div key={`cell-${cellIndex}`} style={{ ...cellStyle, background: '#f1f5f9' }} />
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {Array.from({ length: prefilledCount }).map((_, index) => (
                    <div key={`prefilled-${index}`} style={{ width: 76, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderCopyVisual(items[0], 64, { color: category.prefillColor, stroke: category.prefillStroke })}
                    </div>
                  ))}
                  {Array.from({ length: requiredCount }).map((_, index) => {
                    const copy = placedCopies[index];
                    const sourceItem = copy ? itemById.get(copy.itemId) : null;
                    return (
                      <div
                        key={`slot-${index}`}
                        style={{
                          width: 76,
                          height: 76,
                          border: `2px ${copy ? 'solid' : 'dashed'} ${copy ? '#5cc4ed' : '#dbeafe'}`,
                          borderRadius: 12,
                          background: copy ? '#ffffff' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 220ms ease, border-color 220ms ease, transform 220ms ease',
                        }}
                      >
                        {copy && sourceItem ? (
                          <div
                            data-copy-instance-id={copy.instanceId}
                            draggable={!isAnswered}
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', sourceItem.id);
                              event.dataTransfer.setData('application/x-copy-instance', copy.instanceId);
                              event.dataTransfer.setData('application/x-copy-category', category.id);
                              event.dataTransfer.effectAllowed = 'move';
                            }}
                            onClick={() => removeCopyFromZone(category.id, copy.instanceId)}
                            style={{ cursor: isAnswered ? 'default' : 'pointer', animation: 'copyDropIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1)', touchAction: 'manipulation' }}
                          >
                            {renderCopyVisual(sourceItem, 64)}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isCopiable && (
        <div
          onDragEnter={() => setActiveDropZone('pool')}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropZone(null);
          }}
          onDrop={(event) => handleDrop(event, null)}
          style={isCubeTrain ? {
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 14,
            padding: '8px 0',
            marginTop: 10
          } : {
            minHeight: 116,
            border: `2px dashed ${activeDropZone === 'pool' ? '#2563eb' : '#dbeafe'}`,
            borderRadius: 16,
            background: activeDropZone === 'pool' ? '#eff6ff' : '#f8fafc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 14,
            padding: 16,
          }}
        >
          {items.map((item) => {
            if (isCubeTrain) {
              return (
                <button
                  type="button"
                  key={item.id}
                  data-copy-source-id={item.id}
                  disabled={isAnswered}
                  onClick={() => copyItemToNextOpenSlot(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'transform 0.15s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseDown={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'scale(1.08)'; }}
                >
                  {renderCubeSvg({
                    color: item.color || '#c45add',
                    stroke: item.stroke || '#a83ac4',
                    size: 48,
                    hasRightPeg: true
                  })}
                </button>
              );
            }

            return (
              <div
                key={item.id}
                data-copy-source-id={item.id}
                draggable={!isAnswered}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', item.id);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => copyItemToNextOpenSlot(item.id)}
                style={{
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'transform 0.15s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { if (!isAnswered) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div
                  style={{
                    width: 92,
                    height: 92,
                    border: '2px solid #5cc4ed',
                    borderRadius: 14,
                    background: '#ffffff',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isAnswered ? 'default' : 'copy',
                    touchAction: 'manipulation',
                  }}
                >
                  {renderCopyVisual(item, 68)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes copyDropIn {
          from { opacity: 0.2; transform: translateY(-8px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );

  const renderRemovalMode = () => (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {categories.map((category) => {
        const prefilledCount = Number(category.prefilledCount || 0);
        const removeCount = Number(category.removeCount || 0);
        const removed = removedZones[category.id] || [];
        const remaining = prefilledCount - removed.length;
        const sourceItem = items[0] || { visual: 'cube', color: category.prefillColor, stroke: category.prefillStroke };
        const cubeSize = prefilledCount > 10 ? (prefilledCount > 15 ? 32 : 38) : 48;
        const isTower = isCubeTrain && (category.isTower === true || category.layout === 'vertical' || category.id?.startsWith('tower'));

        return (
          <div
            key={category.id}
            style={isCubeTrain ? {
              padding: 12,
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              width: '100%',
            } : {
              padding: 18,
              border: '2px solid #dbeafe',
              borderRadius: 16,
              background: '#ffffff',
              boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)',
            }}
          >
            {category.label ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#334155', fontSize: 18, fontWeight: 900 }}>
                <button
                  type="button"
                  onClick={() => speakText(category.label)}
                  style={{
                    background: '#e0f2fe',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0284c7',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
                    transition: 'transform 0.2s ease, background 0.2s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#bae6fd'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#e0f2fe'; }}
                  title="Read category name out loud"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
                <span>{category.label}</span>
              </div>
            ) : null}

            {isCubeTrain ? (
              <div
                style={isTower ? {
                  width: 'auto',
                  maxWidth: '160px',
                  minHeight: 'auto',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  alignItems: 'center',
                  padding: '8px 8px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                  position: 'relative',
                  boxSizing: 'border-box'
                } : {
                  width: '100%',
                  maxWidth: '560px',
                  minHeight: '84px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 18px',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', flexDirection: isTower ? 'column-reverse' : 'row', alignItems: 'center', gap: 0, flexWrap: isTower ? 'nowrap' : 'wrap' }}>
                  {Array.from({ length: prefilledCount }).map((_, index) => {
                    const removedCube = removed.includes(index);
                    return (
                      <button
                        key={`remove-cube-${index}`}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => toggleRemovedCube(category.id, index)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          margin: 0,
                          marginRight: isTower ? 0 : -2,
                          marginBottom: isTower ? -2 : 0,
                          cursor: isAnswered ? 'default' : 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: removedCube ? 0.38 : 1,
                          transform: removedCube ? 'scale(0.92)' : 'scale(1)',
                          transition: 'opacity 180ms ease, transform 180ms ease',
                          outline: 'none',
                        }}
                        aria-pressed={removedCube}
                      >
                        {renderCubeSvg({
                          color: category.prefillColor || sourceItem.color || '#ff8a3d',
                          stroke: category.prefillStroke || sourceItem.stroke || '#e06013',
                          size: cubeSize,
                          hasRightPeg: !isTower,
                          hasTopPeg: isTower
                        })}
                        {removedCube ? (
                          <span
                            aria-hidden="true"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#e11d48',
                              fontSize: 34,
                              fontWeight: 950,
                              lineHeight: 1,
                              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              pointerEvents: 'none'
                            }}
                          >
                            ×
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {Array.from({ length: prefilledCount }).map((_, index) => {
                  const removedCube = removed.includes(index);
                  return (
                    <button
                      key={`remove-cube-${index}`}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => toggleRemovedCube(category.id, index)}
                      style={{
                        width: 76,
                        height: 76,
                        border: `2px solid ${removedCube ? '#fb7185' : '#5cc4ed'}`,
                        borderRadius: 12,
                        background: removedCube ? '#fff1f2' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isAnswered ? 'default' : 'pointer',
                        opacity: removedCube ? 0.38 : 1,
                        transform: removedCube ? 'scale(0.88)' : 'scale(1)',
                        position: 'relative',
                        transition: 'opacity 180ms ease, transform 180ms ease, border-color 180ms ease, background 180ms ease',
                      }}
                      aria-pressed={removedCube}
                    >
                      {renderCopyVisual(sourceItem, 64, { color: category.prefillColor, stroke: category.prefillStroke })}
                      {removedCube ? (
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            inset: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#e11d48',
                            fontSize: 46,
                            fontWeight: 950,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
            {category.label && !isCubeTrain && (
              <div style={{ marginTop: 14, color: '#64748b', fontSize: 13, fontWeight: 900 }}>
                Removed {removed.length}/{removeCount}. {remaining} left.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderCard = (item, origin = 'pool', options = {}) => {
    const isDragging = draggingId === item.id && !options.isDragLayer;
    const isSelected = selectedItemId === item.id && !options.isDragLayer;
    const toolSvg = resolveToolSvg(item);
    const showCompactImage = Boolean(item.imageUrl || item.svg || toolSvg);
    const mediaCard = Boolean(item.imageUrl || item.svg || toolSvg);
    const transparentImageCard = isV2 && isTransparentImageStyle(item);
    const showImageLabel = item.content && item.content.trim() && !shouldHideImageLabel(item);
    const inlineSvg = item.svg || toolSvg ? cleanSvgContent(item.svg || toolSvg) : (item.imageUrl && isInlineSvg(item.imageUrl) ? cleanSvgContent(item.imageUrl) : null);
    const effectiveWidth = options.width || (isV2 && mediaCard ? responsiveGridCardWidth : itemCardWidth(item));
    const effectiveHeight = options.height || (isV2 && mediaCard ? responsiveSourceSlotHeight : itemCardHeight(item));

    return (
    <div
      key={item.id}
      data-card-id={item.id}
      onPointerDown={(event) => beginPointerDrag(item, event)}
      onClick={(event) => {
        if (!isV2) return;
        event.stopPropagation();
        if (dragMetaRef.current?.moved) return;
        setSelectedItemId((current) => (current === item.id ? null : item.id));
      }}
      title={origin === 'pool' ? 'Drag into a group' : 'Drag to another group or back to the pool'}
      style={{
        width: effectiveWidth,
        maxWidth: options.maxWidth || effectiveWidth,
        minWidth: options.minWidth || effectiveWidth,
        height: effectiveHeight,
        border: transparentImageCard ? '2px solid transparent' : `2px solid ${isSelected ? '#2563eb' : '#5cc4ed'}`,
        borderRadius: transparentImageCard ? 0 : 9,
        background: transparentImageCard ? 'transparent' : '#ffffff',
        boxShadow: options.isDragLayer
          ? transparentImageCard
            ? '0 18px 34px rgba(15, 23, 42, 0.18)'
            : '0 24px 48px rgba(15, 23, 42, 0.22)'
          : isSelected
            ? transparentImageCard
              ? '0 0 0 4px rgba(37, 99, 235, 0.14)'
              : '0 16px 30px rgba(37, 99, 235, 0.16)'
            : transparentImageCard
              ? 'none'
              : '0 10px 22px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        justifySelf: 'center',
        flexDirection: mediaCard ? 'column' : 'row',
        overflow: transparentImageCard ? 'visible' : 'hidden',
        cursor: isAnswered ? 'default' : 'grab',
        opacity: isDragging ? 0 : 1,
        transform: 'scale(1)',
        viewTransitionName: `sort-card-${item.id}`,
        touchAction: 'none',
        userSelect: 'none',
        transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease, border-color 180ms ease, opacity 160ms ease',
        ...options.style,
      }}
    >
      {item.imageUrl || item.svg || toolSvg ? (
        <>
          <div
            style={{
              width: '100%',
              flex: 1,
              padding: transparentImageCard ? 0 : showImageLabel ? '6px 6px 0' : 6,
              background: transparentImageCard ? 'transparent' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: transparentImageCard ? 'visible' : 'hidden',
            }}
          >
            {inlineSvg ? (
              <>
                <style dangerouslySetInnerHTML={{ __html: `
                  .inline-svg-wrapper svg {
                    max-width: 100%;
                    max-height: 100%;
                    width: 100%;
                    height: 100%;
                    display: block;
                    pointer-events: none;
                  }
                  .inline-svg-wrapper svg * {
                    pointer-events: none;
                  }
                ` }} />
                <div 
                  className="inline-svg-wrapper"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: item.imageWidth ? `${item.imageWidth}px` : '100%',
                    maxHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: inlineSvg }}
                />
              </>
            ) : item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.content || item.id}
                style={{
                  maxWidth: item.imageWidth ? `${item.imageWidth}px` : '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: transparentImageCard ? 0 : 6,
                  display: 'block',
                  mixBlendMode: transparentImageCard ? 'multiply' : 'normal'
                }}
              />
            ) : null}
          </div>
          {showImageLabel && (
            <span
              style={{
                width: '100%',
                padding: '4px 6px 6px',
                textAlign: 'center',
                fontSize: 13,
                lineHeight: 1.1,
                fontWeight: 900,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {item.content}
            </span>
          )}
        </>
      ) : (
        <span style={{ padding: isV2 ? '4px 10px' : '8px 12px', textAlign: 'center', fontSize: isV2 ? 18 : 22, lineHeight: 1, fontWeight: 900, color: '#0f172a' }}>{item.content}</span>
      )}
    </div>
  );
  };

  const renderPlaceholder = (key, label = 'Empty slot') => (
    <div
      key={key}
      style={{
        width: '100%',
        height: '100%',
        border: `2px ${label ? 'dashed' : 'solid'} #dbeafe`,
        borderRadius: 8,
        background: label ? '#f8fafc' : '#f1f5f9',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {label}
    </div>
  );

  const hasGridCategories = categories.some((cat) => cat.isGrid === true || (Number(cat.rows) > 0 && Number(cat.columns) > 0));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {isRemoval ? renderRemovalMode() : (isCopiable || hasGridCategories || isCubeTrain) ? renderCopyMode() : (
      <>
      <div className="categories-grid-container" style={{ gap: 16 }}>
        {categories.map((category) => {
          const placedItems = items.filter((item) => zones[item.id] === category.id);
          const rowCount = Math.max(1, Math.ceil(placedItems.length / 3));
          const tallestPlacedItem = placedItems.length
            ? Math.max(...placedItems.map(itemCardHeight))
            : sourceSlotHeight;
          const minHeight = 66 + rowCount * tallestPlacedItem + Math.max(0, rowCount - 1) * 12;

          return (
          <div
            key={category.id}
            data-zone-id={category.id}
            data-category-zone-id={category.id}
            onClick={() => {
              if (isV2 && selectedItemId && !isAnswered) {
                placeItemWithRealCardAnimation(selectedItemId, category.id);
              }
            }}
            onDragEnter={() => setActiveDropZone(category.id)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropZone(null);
            }}
            onDrop={(event) => handleDrop(event, category.id)}
            style={{
              minHeight,
              padding: '14px 16px',
              border: `2px solid ${activeDropZone === category.id || (isV2 && selectedItemId) ? '#2563eb' : '#5cc4ed'}`,
              borderRadius: 10,
              background: '#ffffff',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transform: 'scale(1)',
              transition: 'min-height 220ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 120ms ease',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid rgba(92, 196, 237, 0.45)', paddingBottom: 10, color: '#4b5563', fontWeight: 900, fontSize: 18 }}>
              <button
                type="button"
                onClick={() => speakText(category.label)}
                style={{
                  background: '#e0f2fe',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0284c7',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)',
                  transition: 'transform 0.2s ease, background 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#bae6fd'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#e0f2fe'; }}
                title="Read category name out loud"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
              <span>{category.label}</span>
            </div>
            <div
              data-zone-grid
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${responsiveGridCardWidth}, ${responsiveGridCardWidth}))`,
                gap: 12,
                alignContent: 'start',
                justifyContent: 'center',
                minHeight: placedItems.length ? tallestPlacedItem : sourceSlotHeight,
                transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                width: '100%',
              }}
            >
              {placedItems.map((item) => renderCard(item, category.id))}
            </div>
          </div>
          );
        })}
      </div>

      <div
        data-zone-id="pool"
          data-source-tray="true"
          data-zone-grid
        onClick={(event) => {
          if (isV2 && selectedItemId && zones[selectedItemId] && !isAnswered) {
            const sourceSlot = event.target.closest?.('[data-source-slot-index]');
            const sourceSlotIndex = sourceSlot ? Number(sourceSlot.dataset.sourceSlotIndex) : undefined;
            placeItemWithRealCardAnimation(selectedItemId, null, { sourceSlotIndex });
          }
        }}
        onDragEnter={() => setActiveDropZone('pool')}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setActiveDropZone(null);
        }}
        onDrop={(event) => handleDrop(event, null)}
        style={{
          padding: 0,
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
          display: 'flex',
          gap: 12,
          justifyContent: isV2 ? 'flex-start' : 'center',
          alignItems: 'center',
          minHeight: responsiveSourceSlotHeight,
          overflowX: isV2 ? 'auto' : 'visible',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: isV2 ? 'x proximity' : 'none',
          transition: 'border-color 120ms ease',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {sourceSlots.map((itemId, index) => {
          const item = itemId && !zones[itemId] ? itemById.get(itemId) : null;
          return (
            <div
              key={`source-slot-${index}`}
              data-source-slot-index={index}
              style={{
                width: responsiveGridCardWidth,
                height: responsiveSourceSlotHeight,
                flex: `0 0 ${responsiveGridCardWidth}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
              }}
            >
              {item
                ? renderCard(item, 'pool')
                : renderPlaceholder(`pool-slot-${index}`, activeDropZone === 'pool' ? 'Release back' : '')}
            </div>
          );
        })}
      </div>

      {userAnswer ? (
        <p style={{ margin: 0, textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 800 }}>
          All items sorted. Verify your answer.
        </p>
      ) : null}
      {dragState?.isActive ? (
        <div
          style={{
            position: 'fixed',
            left: dragState.x,
            top: dragState.y,
            width: dragState.width,
            height: dragState.height,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {renderCard(dragState.item, 'drag', {
            isDragLayer: true,
            width: dragState.width,
            maxWidth: dragState.width,
            minWidth: dragState.width,
            height: dragState.height,
          })}
        </div>
      ) : null}
      <style jsx>{`
        .categories-grid-container {
          display: grid;
          width: 100%;
          max-width: 100%;
          grid-template-columns: repeat(${Math.max(categories.length, 1)}, minmax(260px, 1fr));
        }
        @media (max-width: 768px) {
          .categories-grid-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </>
      )}
    </div>
  );
}

export default function CatV2HtmlRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const rawCategories = question.categories || question.parts?.find((part) => part.type === 'categorization')?.categories || [];
  const categories = rawCategories.map((cat) => {
    if (typeof cat === 'string') {
      return { id: cat, label: cat };
    }
    return cat;
  });
  const items = question.items || question.parts?.find((part) => part.type === 'categorization')?.items || [];
  const useHtmlRenderer = question.renderer === 'html' || question.type === 'categorizationv2';
  const layoutMode = question.layoutMode || question.metadata?.layoutMode || question.htmlLayout || 'category_sort';
  const cardStyle = question.cardStyle || question.behavior?.cardStyle || question.itemCardStyle || question.imageCardStyle || question.cardVariant;
  const hideItemLabels = Boolean(question.hideItemLabels || question.behavior?.hideItemLabels);
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      setIsMobile(containerWidth < 768);
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <section className={styles.container} ref={containerRef}>
      <div className={styles.questionCard}>
        {question.questionText ? (
          <div className={styles.questionTextRow} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => speakText(question.questionText)}
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
            <span className={styles.questionText}>{question.questionText}</span>
          </div>
        ) : null}

        {layoutMode === 'ordering' ? (
          <OrderingLayout
            question={question}
            items={items}
            cardStyle={cardStyle}
            hideItemLabels={hideItemLabels}
            userAnswer={userAnswer}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
          />
        ) : layoutMode === 'grid_fill' || layoutMode === 'table_fill' ? (
          <GridFillLayout
            question={question}
            categories={categories}
            items={items}
            cardStyle={cardStyle}
            hideItemLabels={hideItemLabels}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
          />
        ) : layoutMode === 'diagram_slots' || layoutMode === 'diagram_labeling' ? (
          <DiagramSlotsLayout
            question={question}
            items={items}
            cardStyle={cardStyle}
            hideItemLabels={hideItemLabels}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
          />
        ) : (
          <CategorySortLayout
            categories={categories}
            items={items}
            cardStyle={cardStyle}
            hideItemLabels={hideItemLabels}
            isCopiable={Boolean(question.isCopiable)}
            isRemoval={Boolean(question.isRemoval)}
            isV2={useHtmlRenderer || isMobile}
            userAnswer={userAnswer}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
          />
        )}
      </div>
    </section>
  );
}
