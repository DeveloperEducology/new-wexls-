'use client';

import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Image as KonvaImage } from 'react-konva';
import { speakText } from '@/lib/ttsClient';
import { resolveToolSvg } from '@/lib/practice/svgTools';

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
      if (useCors && !isInlineSvg(url)) img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (isMounted) setImage(img);
      };
      img.onerror = () => {
        if (useCors && !isInlineSvg(url)) {
          loadImage(false);
          return;
        }
        if (isMounted) setImage(null);
      };
      img.src = isInlineSvg(url) ? getSvgDataUrl(url) : url;
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

function SpeakerIcon({ x = 0, y = 0, scale = 1, onClick, onTap }) {
  return (
    <Group
      x={x}
      y={y}
      scaleX={scale}
      scaleY={scale}
      onClick={onClick}
      onTap={onTap}
      onMouseEnter={() => { document.body.style.cursor = 'pointer'; }}
      onMouseLeave={() => { document.body.style.cursor = 'default'; }}
    >
      <Circle radius={11} fill="#e0f2fe" stroke="#5cc4ed" strokeWidth={1.5} />
      <Text text="♪" x={-5} y={-9} width={10} align="center" fill="#0369a1" fontSize={14} fontStyle="bold" />
    </Group>
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

export default function KonvaCategorizationRenderer({
  question,
  categories,
  items,
  dimensions,
  userAnswer,
  onAnswer,
  isAnswered,
}) {
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
        {item.imageUrl || item.svg || resolveToolSvg(item) ? (
          <>
            <Group x={-layout.cardWidth / 2 + 7} y={-layout.cardHeight / 2 + 7}>
              <CategorizationImage
                url={item.svg || resolveToolSvg(item) || item.imageUrl}
                altText={item.content || item.target || item.id}
                width={layout.cardWidth - 14}
                height={item.content && item.content.trim() ? 82 : layout.cardHeight - 14}
                x={0}
                y={0}
              />
            </Group>
            {item.content && item.content.trim() && (
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
            )}
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
    <>
      <div style={{ margin: '8px auto 0', width: '100%', maxWidth: 900, overflow: 'hidden' }}>
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
                    <SpeakerIcon
                      x={24}
                      y={2}
                      scale={0.72}
                      onClick={() => speakText(category.label)}
                      onTap={() => speakText(category.label)}
                    />
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

      {userAnswer ? (
        <p style={{ margin: '8px 0 0', textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 800 }}>
          All items sorted. Verify your answer.
        </p>
      ) : null}
    </>
  );
}
