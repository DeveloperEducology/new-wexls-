'use client';

import React, { useMemo } from 'react';
import CatV2Card from '../components/CatV2Card';
import CatV2DropZone from '../components/CatV2DropZone';
import CatV2SourceTray from '../components/CatV2SourceTray';
import useCatV2SimpleDnd from '../useCatV2SimpleDnd';

const normalizeTargets = (question) => {
  const targets = Array.isArray(question.targets) ? question.targets : [];
  return targets.map((target, index) => ({
    ...target,
    id: target.id || `slot_${index + 1}`,
    label: target.label || target.prompt || `Slot ${index + 1}`,
    x: Number(target.x ?? target.left ?? 50),
    y: Number(target.y ?? target.top ?? 50),
    width: Number(target.width ?? 18),
    height: Number(target.height ?? 8),
    unit: target.unit || 'percent',
  }));
};

const toCssUnit = (value, unit) => (unit === 'px' ? `${value}px` : `${value}%`);

export default function DiagramSlotsLayout({
  question,
  items,
  cardStyle,
  hideItemLabels,
  onAnswer,
  isAnswered,
}) {
  const targets = useMemo(() => normalizeTargets(question), [question]);
  const dnd = useCatV2SimpleDnd({ items, targets, onAnswer, isAnswered });
  const canvas = question.canvas || {};
  const backgroundImage = canvas.backgroundImage || question.backgroundImage || question.imageUrl;
  const aspectRatio = `${Number(canvas.width) || 900} / ${Number(canvas.height) || 620}`;

  return (
    <div style={{ display: 'grid', gap: 18, paddingTop: 6 }}>
      <section
        aria-label="Diagram labeling area"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 320,
          aspectRatio,
          border: '2px solid #dbeafe',
          borderRadius: 14,
          background: '#ffffff',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minWidth: 360,
            minHeight: 320,
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: canvas.backgroundSize || 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          {targets.map((target) => {
            const item = dnd.getTargetItem(target.id);
            const active = dnd.selectedItemId && !item;
            return (
              <div
                key={target.id}
                style={{
                  position: 'absolute',
                  left: toCssUnit(target.x, target.unit),
                  top: toCssUnit(target.y, target.unit),
                  width: toCssUnit(target.width, target.unit),
                  minWidth: 92,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <CatV2DropZone
                  label={target.label}
                  active={Boolean(active)}
                  filled={Boolean(item)}
                  minHeight={Math.max(50, target.height * 8)}
                  onClick={() => {
                    if (item) dnd.returnItem(item.id);
                    else dnd.placeItem(dnd.selectedItemId, target.id);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dnd.handleDrop(event, target.id)}
                  style={{
                    background: item ? '#ffffff' : active ? '#eff6ff' : '#eaf2fb',
                    padding: 6,
                  }}
                >
                  {item ? (
                    <CatV2Card
                      item={item}
                      compact
                      cardStyle={cardStyle}
                      hideLabel={hideItemLabels}
                      disabled={isAnswered}
                      onClick={(event) => {
                        event.stopPropagation();
                        dnd.returnItem(item.id);
                      }}
                    />
                  ) : (
                    <span>{target.placeholder || target.label}</span>
                  )}
                </CatV2DropZone>
              </div>
            );
          })}
        </div>
      </section>

      <CatV2SourceTray label="Labels">
        {dnd.sourceItems.map((item) => (
          <CatV2Card
            key={item.id}
            item={item}
            selected={dnd.selectedItemId === item.id}
            dragging={dnd.draggingItemId === item.id}
            disabled={isAnswered}
            compact
            cardStyle={cardStyle}
            hideLabel={hideItemLabels}
            onClick={() => dnd.selectItem(item.id)}
            onDragStart={dnd.handleDragStart}
            onDragEnd={dnd.handleDragEnd}
          />
        ))}
      </CatV2SourceTray>
    </div>
  );
}
