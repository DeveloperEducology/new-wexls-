'use client';

import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Stage, Layer, Rect, Text, Group, Circle, Image as KonvaImage } from 'react-konva';
import styles from '../FillInTheBlankRenderer.module.css';

function useLoadedImage(url) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!url) {
      setImage(null);
      return undefined;
    }

    const loadImage = (useCors) => {
      const img = new window.Image();
      if (useCors) img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (isMounted) setImage(img);
      };
      img.onerror = () => {
        if (useCors) {
          loadImage(false);
          return;
        }
        if (isMounted) setImage(null);
      };
      img.src = url;
    };

    setImage(null);
    loadImage(true);

    return () => {
      isMounted = false;
    };
  }, [url]);

  return image;
}

function CategorizationImage({ url, altText, width, height, x, y }) {
  const image = useLoadedImage(url);

  if (!image) {
    return (
      <Group x={x} y={y}>
        <Rect width={width} height={height} fill="#f8fafc" cornerRadius={4} />
        <Text
          text={altText || 'Image'}
          width={width - 8}
          x={4}
          y={height / 2 - 10}
          align="center"
          fill="#334155"
          fontSize={11}
          fontStyle="bold"
        />
      </Group>
    );
  }

  return <KonvaImage image={image} x={x} y={y} width={width} height={height} cornerRadius={4} />;
}

function SpeakerIcon({ x = 0, y = 0, scale = 1 }) {
  return (
    <Group x={x} y={y} scaleX={scale} scaleY={scale}>
      <Circle radius={11} fill="#e0f2fe" stroke="#5cc4ed" strokeWidth={1.5} />
      <Text text="♪" x={-5} y={-9} width={10} align="center" fill="#0369a1" fontSize={14} fontStyle="bold" />
    </Group>
  );
}

function HtmlCategorizationFallback({ categories, items, isCopiable = false, userAnswer, onAnswer, isAnswered }) {
  const [zones, setZones] = useState({});
  const [copyZones, setCopyZones] = useState({});
  const [activeDropZone, setActiveDropZone] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const dragMetaRef = useRef(null);

  const cardWidth = 174;
  const cardHeight = 148;
  useEffect(() => {
    setZones({});
    setCopyZones({});
    setActiveDropZone(null);
    setDraggingId(null);
    setDragState(null);
  }, [items]);

  useEffect(() => () => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const placeItem = (itemId, categoryId) => {
    if (isAnswered) return;
    const next = { ...zones };
    if (categoryId) {
      next[itemId] = categoryId;
    } else {
      delete next[itemId];
    }
    setZones(next);
    if (items.every((item) => next[item.id])) {
      onAnswer?.(next);
    } else {
      onAnswer?.(null);
    }
  };

  const unsortedItems = items.filter((item) => !zones[item.id]);
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
    const categoryElement = Array.from(document.querySelectorAll('[data-category-zone-id]')).find((element) => {
      const rect = element.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    });
    if (categoryElement?.dataset.categoryZoneId) return categoryElement.dataset.categoryZoneId;

    const sourceTray = document.querySelector('[data-source-tray="true"]');
    if (sourceTray) {
      const rect = sourceTray.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return 'pool';
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

  const commitPointerDrop = (categoryId) => {
    const meta = dragMetaRef.current;
    if (!meta) return;

    const firstRect = {
      left: meta.lastX,
      top: meta.lastY,
      width: meta.width,
      height: meta.height,
    };

    flushSync(() => {
      placeItem(meta.itemId, categoryId === 'pool' ? null : categoryId);
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
    if (isAnswered || isCopiable) return;
    if (event.button !== undefined && event.button !== 0) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const pointerOffsetX = event.clientX - rect.left;
    const pointerOffsetY = event.clientY - rect.top;

    event.preventDefault();
    element.setPointerCapture?.(event.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    dragMetaRef.current = {
      itemId: item.id,
      pointerId: event.pointerId,
      pointerOffsetX,
      pointerOffsetY,
      width: rect.width,
      height: rect.height,
      lastX: rect.left,
      lastY: rect.top,
    };

    setDraggingId(item.id);
    setActiveDropZone(null);
    setDragState({
      item,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
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
      meta.lastX = nextX;
      meta.lastY = nextY;

      const zone = findPointerDropZone(event.clientX, event.clientY);
      setActiveDropZone(zone);

      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setDragState((current) => (current ? { ...current, x: nextX, y: nextY } : current));
      });
    };

    const handlePointerUp = (event) => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
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

  const placeItemWithRealCardAnimation = (itemId, categoryId) => {
    const source = getCardElement(itemId);
    const firstRect = source?.getBoundingClientRect();

    flushSync(() => {
      placeItem(itemId, categoryId);
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
      movedCard.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;
      movedCard.style.zIndex = '2';
      movedCard.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        movedCard.style.transition = 'transform 560ms cubic-bezier(0.18, 0.9, 0.2, 1), box-shadow 560ms ease, opacity 160ms ease';
        movedCard.style.transform = 'translate(0, 0) scale(1)';
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
      placeItemWithRealCardAnimation(itemId, categoryId);
    }
    setActiveDropZone(null);
  };

  const renderCopyVisual = (item, size = 64, overrides = {}) => {
    const fill = overrides.color || item.color;
    const stroke = overrides.stroke || item.stroke;
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {categories.map((category) => {
          const requiredCount = Number(category.requiredCount || category.maxCount || 0);
          const prefilledCount = Number(category.prefilledCount || 0);
          const placedCopies = copyZones[category.id] || [];
          const isActive = activeDropZone === category.id;

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
              style={{
                padding: 18,
                border: `2px solid ${isActive ? '#2563eb' : '#dbeafe'}`,
                borderRadius: 16,
                background: isActive ? '#eff6ff' : '#ffffff',
                boxShadow: isActive ? '0 16px 34px rgba(37, 99, 235, 0.12)' : '0 8px 22px rgba(15, 23, 42, 0.05)',
                transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
              }}
            >
              <div style={{ marginBottom: 14, color: '#334155', fontSize: 18, fontWeight: 900 }}>
                {category.label}
              </div>
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
            </div>
          );
        })}
      </div>

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
        style={{
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
        {items.map((item) => (
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
        ))}
      </div>

      <style jsx>{`
        @keyframes copyDropIn {
          from { opacity: 0.2; transform: translateY(-8px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );

  const renderCard = (item, origin = 'pool', options = {}) => {
    const isDragging = draggingId === item.id && !options.isDragLayer;
    const showCompactImage = Boolean(item.imageUrl);

    return (
    <div
      key={item.id}
      data-card-id={item.id}
      onPointerDown={(event) => beginPointerDrag(item, event)}
      onDoubleClick={() => origin !== 'pool' && !isAnswered && placeItem(item.id, null)}
      title={origin === 'pool' ? 'Drag into a group' : 'Drag to another group or back to the pool'}
      style={{
        width: options.width || '100%',
        maxWidth: options.maxWidth || cardWidth,
        minWidth: options.minWidth || 142,
        height: cardHeight,
        border: '2px solid #5cc4ed',
        borderRadius: 9,
        background: '#ffffff',
        boxShadow: options.isDragLayer ? '0 24px 48px rgba(15, 23, 42, 0.22)' : '0 10px 22px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: isAnswered ? 'default' : 'grab',
        opacity: isDragging ? 0 : 1,
        transform: options.isDragLayer ? 'scale(1.035)' : 'scale(1)',
        viewTransitionName: `sort-card-${item.id}`,
        touchAction: 'none',
        userSelect: 'none',
        transition: 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease, border-color 180ms ease, opacity 160ms ease',
        ...options.style,
      }}
    >
      {item.imageUrl ? (
        <>
          <div
            style={{
              width: '100%',
              height: 104,
              padding: 6,
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.content || item.id}
              style={{
                width: '100%',
                height: '100%',
                objectFit: showCompactImage ? 'cover' : 'contain',
                objectPosition: 'center top',
                borderRadius: 6,
              }}
            />
          </div>
          <span
            style={{
              minHeight: 34,
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
            }}
          >
            {item.content}
          </span>
        </>
      ) : (
        <span style={{ padding: 12, textAlign: 'center', fontSize: 22, lineHeight: 1.1, fontWeight: 900, color: '#0f172a' }}>{item.content}</span>
      )}
    </div>
  );
  };

  const renderPlaceholder = (key, label = 'Empty slot') => (
    <div
      key={key}
      style={{
        width: cardWidth,
        height: cardHeight,
        border: '2px dashed #dbeafe',
        borderRadius: 8,
        background: '#f8fafc',
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

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {isCopiable ? renderCopyMode() : (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(categories.length, 1)}, minmax(260px, 1fr))`, gap: 16 }}>
        {categories.map((category) => {
          const placedItems = items.filter((item) => zones[item.id] === category.id);
          const rows = Math.max(1, Math.ceil(placedItems.length / 2));
          const minHeight = 108 + rows * (cardHeight + 12) + (activeDropZone === category.id ? 18 : 0);

          return (
          <div
            key={category.id}
            data-zone-id={category.id}
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
              padding: 16,
              border: `2px solid ${activeDropZone === category.id ? '#2563eb' : '#5cc4ed'}`,
              borderRadius: 10,
              background: activeDropZone === category.id ? '#f8fbff' : '#ffffff',
              boxShadow: activeDropZone === category.id ? '0 16px 34px rgba(37, 99, 235, 0.14)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'min-height 220ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 180ms ease, box-shadow 180ms ease, background 180ms ease',
            }}
          >
            <div style={{ borderBottom: '2px solid rgba(92, 196, 237, 0.45)', paddingBottom: 10, color: '#4b5563', fontWeight: 900, fontSize: 18 }}>
              ♪ {category.label}
            </div>
            <div
              data-zone-grid
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, ${cardWidth}px))`,
                gap: 12,
                alignContent: 'start',
                justifyContent: 'center',
                minHeight: cardHeight,
                transition: 'all 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
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
        data-zone-grid
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
          padding: 14,
          border: `2px dashed ${activeDropZone === 'pool' ? '#2563eb' : '#dbeafe'}`,
          borderRadius: 12,
          background: activeDropZone === 'pool' ? '#eff6ff' : '#f8fafc',
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${cardWidth}px, ${cardWidth}px))`,
          gap: 12,
          justifyContent: 'center',
          minHeight: cardHeight + 32,
          transition: 'background 160ms ease, border-color 160ms ease',
        }}
      >
        {unsortedItems.map((item) => renderCard(item, 'pool'))}
        {Array.from({ length: Math.max(0, items.length - unsortedItems.length) }).map((_, index) => (
          renderPlaceholder(`pool-slot-${index}`, activeDropZone === 'pool' ? 'Release back' : 'Empty slot')
        ))}
      </div>

      {userAnswer ? (
        <p style={{ margin: 0, textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 800 }}>
          All items sorted. Verify your answer.
        </p>
      ) : null}
      </>
      )}
    </div>
  );
}

function getKonvaLayout(items, categories, maxStackOverride = null) {
  const designWidth = 860;
  const cardWidth = 154;
  const cardHeight = 124;
  const slotStep = cardHeight + 30;
  const trayTop = 24;
  const trayHeight = 158;
  const binTop = 214;
  const binGap = 22;
  const binWidth = (designWidth - 40 - (Math.max(categories.length, 1) - 1) * binGap) / Math.max(categories.length, 1);
  const baseBinHeight = 330;
  const maxStack = Math.max(1, maxStackOverride ?? Math.ceil(items.length / Math.max(categories.length, 1)));
  const binHeight = Math.max(baseBinHeight, 92 + maxStack * slotStep + 22);
  const stageHeight = binTop + binHeight + 28;
  const trayGap = Math.min(18, Math.max(10, (designWidth - 64 - items.length * cardWidth) / Math.max(items.length - 1, 1)));
  const trayRowWidth = items.length * cardWidth + Math.max(items.length - 1, 0) * trayGap;
  const trayStartX = designWidth / 2 - trayRowWidth / 2 + cardWidth / 2;

  return {
    designWidth,
    cardWidth,
    cardHeight,
    slotStep,
    trayTop,
    trayHeight,
    trayCenterY: trayTop + trayHeight / 2 + 8,
    trayStartX,
    trayGap,
    binTop,
    binWidth,
    binGap,
    binHeight,
    baseBinHeight,
    stageHeight,
  };
}

function buildKonvaPool(items, categories) {
  const layout = getKonvaLayout(items, categories);
  return items.map((item, index) => ({
    ...item,
    currentZone: 'pool',
    slotIndex: index,
    x: layout.trayStartX + index * (layout.cardWidth + layout.trayGap),
    y: layout.trayCenterY,
  }));
}

export default function CategorizationRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
  const categories = question.categories || question.parts?.find((part) => part.type === 'categorization')?.categories || [];
  const items = question.items || question.parts?.find((part) => part.type === 'categorization')?.items || [];
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 860, scale: 1 });

  const [pool, setPool] = useState(() => buildKonvaPool(items, categories));
  const [activeZone, setActiveZone] = useState(null);
  const [draggingKonvaId, setDraggingKonvaId] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);

  useEffect(() => {
    setPool(buildKonvaPool(items, categories));
    setActiveZone(null);
    setDraggingKonvaId(null);
    setDropPreview(null);
  }, [question.id, categories.length, items.length]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const layout = getKonvaLayout(items, categories);
      const scale = Math.min(1, (containerWidth - 20) / layout.designWidth);
      setDimensions({ width: containerWidth, scale });
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const maxElasticStack = Math.max(
    1,
    ...categories.map((category) => {
      const placedCount = pool.filter((item) => item.currentZone === category.id).length;
      const hoverReserve = activeZone === category.id && draggingKonvaId ? 1 : 0;
      return placedCount + hoverReserve;
    })
  );
  const layout = getKonvaLayout(items, categories, maxElasticStack);

  const getBinHeight = (categoryId) => {
    const placedCount = pool.filter((item) => item.currentZone === categoryId).length;
    const hoverReserve = activeZone === categoryId && draggingKonvaId ? 1 : 0;
    const stackCount = Math.max(1, placedCount + hoverReserve);
    return Math.max(layout.baseBinHeight, 92 + stackCount * layout.slotStep + 22);
  };

  const findBinIndex = (x, y) => categories.findIndex((category, index) => {
    const bx = 20 + index * (layout.binWidth + layout.binGap);
    return x > bx && x < bx + layout.binWidth && y > layout.binTop && y < layout.binTop + getBinHeight(category.id);
  });

  const isOverSourceTray = (x, y) => (
    x > 20 && x < layout.designWidth - 20 && y > layout.trayTop && y < layout.trayTop + layout.trayHeight
  );

  const getCategoryStack = (zone, currentPool, excludedId = null) => (
    currentPool
      .filter((candidate) => candidate.currentZone === zone && candidate.id !== excludedId)
      .sort((a, b) => a.slotIndex - b.slotIndex)
  );

  const getTargetPosition = (item, zone, currentPool, stackIndexOverride = null) => {
    if (zone === 'pool') {
      return {
        x: layout.trayStartX + item.slotIndex * (layout.cardWidth + layout.trayGap),
        y: layout.trayCenterY,
      };
    }

    const binIndex = categories.findIndex((category) => category.id === zone);
    const itemsInTarget = getCategoryStack(zone, currentPool, item.id);
    const stackIndex = stackIndexOverride ?? itemsInTarget.length;
    const binX = 20 + binIndex * (layout.binWidth + layout.binGap);

    return {
      x: binX + layout.binWidth / 2,
      y: layout.binTop + 92 + stackIndex * layout.slotStep,
    };
  };

  const getDropPreviewForPoint = (zone, y, currentPool) => {
    if (!zone || zone === 'pool' || !draggingKonvaId) return null;

    const stack = getCategoryStack(zone, currentPool, draggingKonvaId);
    const stackIndex = stack.reduce((nextIndex, item, index) => (
      y > item.y ? index + 1 : nextIndex
    ), 0);
    const draggedItem = currentPool.find((item) => item.id === draggingKonvaId);
    if (!draggedItem) return null;
    const target = getTargetPosition(draggedItem, zone, currentPool, stackIndex);
    return { zone, stackIndex, x: target.x, y: target.y };
  };

  const rebalanceKonvaPositions = (nextPool, previewOverride = dropPreview) => {
    const grouped = new Map(categories.map((category) => [category.id, []]));
    nextPool.forEach((item) => {
      if (item.currentZone !== 'pool') grouped.get(item.currentZone)?.push(item);
    });
    grouped.forEach((groupItems) => groupItems.sort((a, b) => a.slotIndex - b.slotIndex));

    return nextPool.map((item) => {
      if (item.currentZone === 'pool') {
        return { ...item, ...getTargetPosition(item, 'pool', nextPool) };
      }

      const binIndex = categories.findIndex((category) => category.id === item.currentZone);
      let stackIndex = grouped.get(item.currentZone)?.findIndex((candidate) => candidate.id === item.id) ?? 0;
      if (previewOverride?.zone === item.currentZone && item.id !== draggingKonvaId && stackIndex >= previewOverride.stackIndex) {
        stackIndex += 1;
      }
      const binX = 20 + binIndex * (layout.binWidth + layout.binGap);
      return {
        ...item,
        x: binX + layout.binWidth / 2,
        y: layout.binTop + 92 + stackIndex * layout.slotStep,
      };
    });
  };

  const handleDragMove = (event) => {
    if (isAnswered) return;
    const x = event.target.x();
    const y = event.target.y();
    const binIndex = findBinIndex(x, y);
    if (binIndex !== -1) {
      const zone = categories[binIndex].id;
      setActiveZone(zone);
      setDropPreview(getDropPreviewForPoint(zone, y, pool));
      return;
    }
    setActiveZone(isOverSourceTray(x, y) ? 'pool' : null);
    setDropPreview(null);
  };

  const handleDragEnd = (id, event) => {
    if (isAnswered) return;

    const x = event.target.x();
    const y = event.target.y();
    const binIndex = findBinIndex(x, y);
    const draggedItem = pool.find((item) => item.id === id);
    if (!draggedItem) return;

    let newZone = draggedItem.currentZone;

    if (binIndex !== -1) {
      newZone = categories[binIndex].id;
    } else if (isOverSourceTray(x, y)) {
      newZone = 'pool';
    }

    const preview = newZone !== 'pool' ? getDropPreviewForPoint(newZone, y, pool) : null;
    const target = getTargetPosition(draggedItem, newZone, pool, preview?.stackIndex ?? null);

    setActiveZone(null);
    setDraggingKonvaId(null);
    setDropPreview(null);
    setPool((previous) => {
      const next = previous.map((item) => {
        if (item.id === id) {
          return { ...item, currentZone: newZone, x: target.x, y: target.y };
        }
        return item;
      });
      const balanced = rebalanceKonvaPositions(next, null);
      const allSorted = balanced.every((item) => item.currentZone !== 'pool');

      if (allSorted && onAnswer) {
        const answerMapping = {};
        balanced.forEach((item) => {
          answerMapping[item.id] = item.currentZone;
        });
        setTimeout(() => onAnswer(answerMapping), 0);
      }

      return balanced;
    });
    if (!newZone || newZone === 'pool') onAnswer?.(null);
    event.currentTarget.to({
      x: target.x,
      y: target.y,
      duration: 0.38,
    });
  };

  const getPreviewPosition = (item) => {
    if (!dropPreview || item.id === draggingKonvaId || item.currentZone !== dropPreview.zone) return item;

    const stack = getCategoryStack(item.currentZone, pool, draggingKonvaId);
    const stackIndex = stack.findIndex((candidate) => candidate.id === item.id);
    if (stackIndex === -1) return item;
    const visualIndex = stackIndex >= dropPreview.stackIndex ? stackIndex + 1 : stackIndex;
    const binIndex = categories.findIndex((category) => category.id === item.currentZone);
    const binX = 20 + binIndex * (layout.binWidth + layout.binGap);

    return {
      ...item,
      x: binX + layout.binWidth / 2,
      y: layout.binTop + 92 + visualIndex * layout.slotStep,
    };
  };

  const renderKonvaCard = (item) => {
    const visualItem = getPreviewPosition(item);
    const isSorted = item.currentZone !== 'pool';
    const isDragging = draggingKonvaId === item.id;

    return (
      <Group
        key={item.id}
        x={visualItem.x}
        y={visualItem.y}
        draggable={!isAnswered}
        onDragMove={handleDragMove}
        onDragStart={(event) => {
          setDraggingKonvaId(item.id);
          setDropPreview(null);
          event.target.moveToTop();
          event.target.to({ scaleX: 1.04, scaleY: 1.04, duration: 0.12 });
        }}
        onDragEnd={(event) => {
          event.target.to({ scaleX: 1, scaleY: 1, duration: 0.12 });
          handleDragEnd(item.id, event);
        }}
        onTap={() => {
          if (!isAnswered && item.currentZone !== 'pool') {
            const target = getTargetPosition(item, 'pool', pool);
            setPool((previous) => rebalanceKonvaPositions(previous.map((candidate) => (
              candidate.id === item.id ? { ...candidate, currentZone: 'pool', x: target.x, y: target.y } : candidate
            )), null));
            setDropPreview(null);
            onAnswer?.(null);
          }
        }}
        onMouseOver={() => { document.body.style.cursor = isAnswered ? 'default' : 'grab'; }}
        onMouseOut={() => { document.body.style.cursor = 'default'; }}
      >
        <Rect
          width={layout.cardWidth}
          height={layout.cardHeight}
          fill="white"
          stroke={isDragging ? '#2563eb' : '#5cc4ed'}
          strokeWidth={isDragging ? 3 : 2}
          cornerRadius={8}
          offsetX={layout.cardWidth / 2}
          offsetY={layout.cardHeight / 2}
          shadowBlur={isDragging ? 18 : isSorted ? 5 : 10}
          shadowOffsetY={isDragging ? 12 : 6}
          shadowColor="rgba(15, 23, 42, 0.16)"
        />
        {item.imageUrl ? (
          <>
            <Group x={-layout.cardWidth / 2 + 7} y={-layout.cardHeight / 2 + 7}>
              <CategorizationImage
                url={item.imageUrl}
                altText={item.content || item.target || item.id}
                width={layout.cardWidth - 14}
                height={82}
                x={0}
                y={0}
              />
            </Group>
            <Text
              text={item.content}
              width={layout.cardWidth - 12}
              x={-layout.cardWidth / 2 + 6}
              y={layout.cardHeight / 2 - 31}
              align="center"
              fill="#0f172a"
              fontSize={13}
              fontStyle="bold"
              listening={false}
            />
          </>
        ) : (
          <Text
            text={item.content}
            width={layout.cardWidth - 18}
            x={-layout.cardWidth / 2 + 9}
            y={-14}
            align="center"
            fill="#0f172a"
            fontSize={22}
            fontStyle="bold"
            listening={false}
          />
        )}
      </Group>
    );
  };

  return (
    <section className={styles.container}>
      <div className={styles.questionCard}>
        {question.questionText ? (
          <div className={styles.questionTextRow}>
            <span className={styles.questionText}>{question.questionText}</span>
          </div>
        ) : null}

        {question.isCopiable ? (
          <HtmlCategorizationFallback
            categories={categories}
            items={items}
            isCopiable={Boolean(question.isCopiable)}
            userAnswer={userAnswer}
            onAnswer={onAnswer}
            isAnswered={isAnswered}
          />
        ) : (
        <div ref={containerRef} style={{ margin: '8px auto 0', width: '100%', maxWidth: 900, overflow: 'hidden' }}>
          <Stage
            width={Math.max(320, dimensions.width - 20)}
            height={layout.stageHeight * dimensions.scale}
            scaleX={dimensions.scale}
            scaleY={dimensions.scale}
            onContextMenu={(event) => event.evt.preventDefault()}
          >
            <Layer>
              <Rect
                x={20}
                y={layout.trayTop}
                width={layout.designWidth - 40}
                height={layout.trayHeight}
                fill={activeZone === 'pool' ? '#eff6ff' : '#f8fafc'}
                stroke={activeZone === 'pool' ? '#2563eb' : '#dbeafe'}
                strokeWidth={2}
                dash={[8, 6]}
                cornerRadius={14}
              />

              {items.map((item, index) => {
                const isOpenSlot = pool.find((candidate) => candidate.id === item.id)?.currentZone !== 'pool';
                return (
                <Rect
                  key={`pool-slot-${item.id || index}`}
                  x={layout.trayStartX + index * (layout.cardWidth + layout.trayGap)}
                  y={layout.trayCenterY}
                  width={layout.cardWidth}
                  height={layout.cardHeight}
                  fill={isOpenSlot ? '#f8fafc' : '#ffffff'}
                  stroke={isOpenSlot ? '#dbeafe' : 'transparent'}
                  strokeWidth={2}
                  dash={[7, 6]}
                  cornerRadius={8}
                  offsetX={layout.cardWidth / 2}
                  offsetY={layout.cardHeight / 2}
                  shadowBlur={isOpenSlot ? 0 : 8}
                  shadowColor="rgba(15, 23, 42, 0.06)"
                  listening={false}
                />
                );
              })}

              {categories.map((category, index) => {
                const bx = 20 + index * (layout.binWidth + layout.binGap);
                const isActive = activeZone === category.id;
                const placedCount = pool.filter((item) => item.currentZone === category.id).length;
                const binHeight = getBinHeight(category.id);

                return (
                  <Group key={category.id} x={bx} y={layout.binTop}>
                    <Rect
                      width={layout.binWidth}
                      height={binHeight}
                      fill={isActive ? '#f0f9ff' : 'white'}
                      stroke={isActive ? '#2563eb' : '#5cc4ed'}
                      strokeWidth={isActive ? 3 : 2}
                      cornerRadius={9}
                      shadowBlur={isActive ? 14 : 0}
                      shadowColor="rgba(37, 99, 235, 0.14)"
                      scaleX={isActive ? 1.015 : 1}
                      scaleY={isActive ? 1.015 : 1}
                      offsetX={isActive ? layout.binWidth * 0.0075 : 0}
                      offsetY={isActive ? binHeight * 0.0075 : 0}
                    />

                    <Group y={24}>
                      <SpeakerIcon x={24} y={2} scale={0.72} />
                      <Text
                        text={category.label}
                        x={42}
                        y={-9}
                        width={layout.binWidth - 54}
                        fill="#4b5563"
                        fontSize={18}
                        fontStyle="bold"
                      />
                      <Rect width={layout.binWidth - 34} height={2} x={17} y={24} fill="#5cc4ed" opacity={0.42} />
                    </Group>

                    {placedCount === 0 ? (
                      <Text
                        text={isActive ? 'release to sort here' : ''}
                        x={0}
                        y={binHeight / 2 - 10}
                        width={layout.binWidth}
                        align="center"
                        fill="#93c5fd"
                        fontSize={14}
                        fontStyle="bold"
                      />
                    ) : null}
                  </Group>
                );
              })}

              {pool.map((item) => renderKonvaCard(item))}
            </Layer>
          </Stage>
        </div>
        )}

        {!question.isCopiable && userAnswer ? (
          <p style={{ margin: '8px 0 0', textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 800 }}>
            All items sorted. Verify your answer.
          </p>
        ) : null}
      </div>
    </section>
  );
}
