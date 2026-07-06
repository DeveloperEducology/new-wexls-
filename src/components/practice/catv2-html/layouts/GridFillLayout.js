'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CatV2Card from '../components/CatV2Card';
import CatV2DropZone from '../components/CatV2DropZone';
import CatV2SourceTray from '../components/CatV2SourceTray';
import useCatV2SimpleDnd from '../useCatV2SimpleDnd';

const buildTargets = (question, categories) => {
  if (Array.isArray(question.targets) && question.targets.length) return question.targets;
  if (Array.isArray(question.grid?.cells) && question.grid.cells.length) return question.grid.cells;

  const gridCategory = categories.find((category) => Number(category.rows) > 0 && Number(category.columns) > 0);
  if (gridCategory) {
    const rows = Number(gridCategory.rows);
    const columns = Number(gridCategory.columns);
    return Array.from({ length: rows * columns }, (_, index) => ({
      id: `${gridCategory.id || 'grid'}_${index + 1}`,
      label: '',
      row: Math.floor(index / columns) + 1,
      column: (index % columns) + 1,
    }));
  }

  return categories.map((category) => ({
    id: category.id,
    label: category.label,
  }));
};

function SortableSingleRowLayout({
  question,
  targets,
  items,
  cardStyle,
  hideItemLabels,
  onAnswer,
  isAnswered,
  isCopiable,
}) {
  const [rowEntries, setRowEntries] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingKey, setDraggingKey] = useState(null);
  const onAnswerRef = useRef(onAnswer);
  const itemSignature = items.map((item) => item.id).join('|');
  const targetSignature = targets.map((target) => target.id).join('|');
  const clickToDrop = question.behavior?.clickToDrop !== false && question.clickToDrop !== false;

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    setRowEntries([]);
    setSelectedItemId(null);
    setDraggingKey(null);
  }, [itemSignature, targetSignature]);

  useEffect(() => {
    const requiredCount = Number(question.grid?.requiredCount || question.requiredCount || targets.length || items.length);
    if (!rowEntries.length || rowEntries.length < requiredCount) {
      onAnswerRef.current?.(null);
      return;
    }

    const answerPayload = {};
    rowEntries.slice(0, requiredCount).forEach((entry, index) => {
      const targetId = targets[index]?.id || `cell-${index + 1}`;
      answerPayload[entry.itemId] = targetId;
      answerPayload[targetId] = entry.itemId;
    });
    answerPayload.row = rowEntries.slice(0, requiredCount).map((entry) => entry.itemId);
    onAnswerRef.current?.(answerPayload);
  }, [items.length, question.grid?.requiredCount, question.requiredCount, rowEntries, targetSignature]);

  const itemById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const sourceItems = useMemo(() => {
    if (isCopiable) return items;
    const placed = new Set(rowEntries.map((entry) => entry.itemId));
    return items.filter((item) => !placed.has(item.id));
  }, [isCopiable, items, rowEntries]);

  const visibleRowEntries = useMemo(() => (
    rowEntries.filter((entry) => entry.entryId !== draggingKey)
  ), [draggingKey, rowEntries]);

  const insertSourceItem = useCallback((itemId, requestedIndex = rowEntries.length) => {
    if (isAnswered || !itemId || !itemById.has(itemId)) return;
    setRowEntries((previous) => {
      const next = isCopiable ? [...previous] : previous.filter((entry) => entry.itemId !== itemId);
      const index = Math.max(0, Math.min(requestedIndex, next.length));
      next.splice(index, 0, {
        entryId: `${itemId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        itemId,
      });
      return next;
    });
    setSelectedItemId(null);
  }, [isAnswered, isCopiable, itemById, rowEntries.length]);

  const moveEntry = useCallback((entryId, requestedIndex) => {
    if (isAnswered || !entryId) return;
    setRowEntries((previous) => {
      const currentIndex = previous.findIndex((entry) => entry.entryId === entryId);
      if (currentIndex < 0) return previous;
      const next = [...previous];
      const [entry] = next.splice(currentIndex, 1);
      const index = Math.max(0, Math.min(requestedIndex, next.length));
      next.splice(index, 0, entry);
      return next;
    });
  }, [isAnswered]);

  const handleDropAt = useCallback((event, index = rowEntries.length) => {
    event.preventDefault();
    event.stopPropagation();
    const entryId = event.dataTransfer.getData('application/x-catv2-row-entry');
    const itemId = event.dataTransfer.getData('application/x-catv2-source-item') || event.dataTransfer.getData('text/plain');

    if (entryId) {
      moveEntry(entryId, index);
    } else if (itemId) {
      insertSourceItem(itemId, index);
    }
    setDraggingKey(null);
  }, [insertSourceItem, moveEntry, rowEntries.length]);

  const handleSourceDragStart = useCallback((event, item) => {
    if (isAnswered) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-catv2-source-item', item.id);
    event.dataTransfer.setData('text/plain', item.id);
    setDraggingKey(item.id);
  }, [isAnswered]);

  const handleRowDragStart = useCallback((event, entryId) => {
    if (isAnswered) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-catv2-row-entry', entryId);
    setDraggingKey(entryId);
  }, [isAnswered]);

  const handleDragEnd = useCallback(() => {
    setDraggingKey(null);
  }, []);

  const requiredCount = Number(question.grid?.requiredCount || question.requiredCount || targets.length || items.length);

  return (
    <div style={{ display: 'grid', gap: 18, paddingTop: 6 }}>
      <section
        aria-label={question.grid?.label || 'Sortable answer row'}
        onClick={() => {
          if (clickToDrop) insertSourceItem(selectedItemId);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDropAt(event, visibleRowEntries.length)}
        style={{
          minHeight: 132,
          border: `2px solid ${selectedItemId ? '#2563eb' : '#bfdbfe'}`,
          background: '#ffffff',
          borderRadius: 14,
          padding: 14,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
          boxShadow: selectedItemId ? '0 14px 30px rgba(37,99,235,0.12)' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 'max-content',
            minHeight: 96,
          }}
        >
          {rowEntries.length ? visibleRowEntries.map((entry, index) => {
            const item = itemById.get(entry.itemId);
            if (!item) return null;
            return (
              <React.Fragment key={entry.entryId}>
                <span
                  aria-hidden="true"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropAt(event, index)}
                  style={{
                    width: 10,
                    alignSelf: 'stretch',
                    borderRadius: 999,
                    background: draggingKey ? '#dbeafe' : 'transparent',
                    transition: 'background 140ms ease',
                  }}
                />
                <CatV2Card
                  item={item}
                  compact
                  selected={draggingKey === entry.entryId}
                  dragging={draggingKey === entry.entryId}
                  cardStyle={cardStyle}
                  hideLabel={hideItemLabels}
                  disabled={isAnswered}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                  onDragStart={(event) => handleRowDragStart(event, entry.entryId)}
                  onDragEnd={handleDragEnd}
                />
              </React.Fragment>
            );
          }) : (
            <div
              style={{
                minWidth: 180,
                minHeight: 76,
                border: '2px dashed #dbeafe',
                borderRadius: 12,
                color: '#94a3b8',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 18px',
              }}
            >
              Drop numbers here
            </div>
          )}

          <span
            aria-hidden="true"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDropAt(event, visibleRowEntries.length)}
            style={{
              width: 10,
              alignSelf: 'stretch',
              borderRadius: 999,
              background: draggingKey ? '#dbeafe' : 'transparent',
              transition: 'background 140ms ease',
            }}
          />
        </div>
      </section>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          color: '#64748b',
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        <span>{rowEntries.length}/{requiredCount} placed</span>
        <span>Drag between cards to reorder</span>
      </div>

      <CatV2SourceTray label="Available items">
        {sourceItems.map((item) => (
          <CatV2Card
            key={item.id}
            item={item}
            selected={selectedItemId === item.id}
            dragging={draggingKey === item.id}
            disabled={isAnswered}
            compact
            cardStyle={cardStyle}
            hideLabel={hideItemLabels}
            onClick={() => {
              if (isAnswered || !clickToDrop) return;
              setSelectedItemId((previous) => (previous === item.id ? null : item.id));
            }}
            onDragStart={handleSourceDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </CatV2SourceTray>
    </div>
  );
}

export default function GridFillLayout({
  question,
  categories,
  items,
  cardStyle,
  hideItemLabels,
  onAnswer,
  isAnswered,
}) {
  const targets = useMemo(() => buildTargets(question, categories), [question, categories]);
  const columnCount = Number(question.grid?.columns) || Number(question.columns) || Math.min(Math.max(targets.length, 1), 4);
  const isCopiable = Boolean(question.isCopiable || question.behavior?.isCopiable || question.metadata?.isCopiable);
  const isSortable = Boolean(question.isSortable || question.grid?.isSortable || question.behavior?.isSortable || question.metadata?.isSortable);
  const dnd = useCatV2SimpleDnd({ items, targets, onAnswer, isAnswered, isCopiable });
  const fitToWindow = Boolean(question.grid?.fitToWindow || question.fitToWindow || question.pattern);
  const clickToDrop = question.behavior?.clickToDrop !== false && question.clickToDrop !== false;
  const clickToNextEmpty = clickToDrop && Boolean(
    question.pattern ||
    isCopiable ||
    question.grid?.clickToNextEmpty ||
    question.behavior?.clickToNextEmpty ||
    question.metadata?.clickToNextEmpty
  );
  const cellMinHeight = Number(question.grid?.cellMinHeight) || (fitToWindow ? 84 : 116);
  const itemById = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);
  const patternRows = useMemo(() => {
    if (Array.isArray(question.pattern?.rows) && question.pattern.rows.length) {
      return question.pattern.rows;
    }
    if (Array.isArray(question.pattern?.promptItems) && question.pattern.promptItems.length) {
      return [question.pattern.promptItems];
    }
    return [];
  }, [question.pattern]);
  const hidePatternLabels = question.pattern?.hideLabels !== false;
  const firstEmptyTargetId = targets.find((target) => !dnd.placements[target.id])?.id || null;

  const handleSourceClick = useCallback((itemId) => {
    if (isAnswered || !itemId) return;
    if (clickToNextEmpty && firstEmptyTargetId) {
      dnd.placeItem(itemId, firstEmptyTargetId);
      return;
    }
    dnd.selectItem(itemId);
  }, [clickToNextEmpty, dnd, firstEmptyTargetId, isAnswered]);

  if (isSortable) {
    return (
      <SortableSingleRowLayout
        question={question}
        targets={targets}
        items={items}
        cardStyle={cardStyle}
        hideItemLabels={hideItemLabels}
        onAnswer={onAnswer}
        isAnswered={isAnswered}
        isCopiable={isCopiable}
      />
    );
  }

  const isInlinePattern = Boolean(question.pattern && targets.length === 1 && patternRows.length > 0);

  if (isInlinePattern) {
    const row = patternRows[0] || [];
    return (
      <div style={{ display: 'grid', gap: 18, paddingTop: 6 }}>
        <div
          aria-label="Find the next shape pattern"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: fitToWindow ? 'center' : 'flex-start',
            gap: fitToWindow ? 8 : 12,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '4px 0 10px',
            minWidth: 'max-content',
          }}
        >
          {row.map((itemId, index) => {
            const item = itemById.get(itemId);
            if (!item) return null;
            return (
              <CatV2Card
                key={`inline-pattern-${itemId}-${index}`}
                item={item}
                compact
                cardStyle="borderless"
                hideLabel={hidePatternLabels}
                disabled
              />
            );
          })}

          {targets.map((target) => {
            const item = dnd.getTargetItem(target.id);
            const active = dnd.selectedItemId && !item;
            return (
              <CatV2DropZone
                key={target.id}
                label=""
                active={Boolean(active)}
                filled={Boolean(item)}
                minHeight={cellMinHeight}
                style={{
                  width: 92,
                  minWidth: 92,
                  height: 58,
                  minHeight: 58,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item ? '#ffffff' : '#e0f2fe',
                  border: `2px dashed ${active ? '#2563eb' : '#0284c7'}`,
                  borderRadius: 8,
                  boxShadow: active ? '0 0 10px rgba(37,99,235,0.2)' : 'none',
                }}
                onClick={() => {
                  if (item) dnd.returnItem(item.id, target.id);
                  else dnd.placeItem(dnd.selectedItemId, target.id);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dnd.handleDrop(event, target.id)}
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
                      dnd.returnItem(item.id, target.id);
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: '#0284c7', fontWeight: 700 }}>?</span>
                )}
              </CatV2DropZone>
            );
          })}
        </div>

        <CatV2SourceTray label="Available items">
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
              onClick={() => handleSourceClick(item.id)}
              onDragStart={dnd.handleDragStart}
              onDragEnd={dnd.handleDragEnd}
            />
          ))}
        </CatV2SourceTray>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18, paddingTop: 6 }}>
      {patternRows.length ? (
        <div
          aria-label="Pattern to copy"
          style={{
            display: 'grid',
            gap: 10,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '2px 0 4px',
          }}
        >
          {patternRows.map((row, rowIndex) => (
            <div
              key={`pattern-row-${rowIndex}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: fitToWindow ? 'center' : 'flex-start',
                gap: fitToWindow ? 8 : 12,
                minWidth: 'max-content',
              }}
            >
              {row.map((itemId, index) => {
                const item = itemById.get(itemId);
                if (!item) return null;
                return (
                  <CatV2Card
                    key={`${rowIndex}-${itemId}-${index}`}
                    item={item}
                    compact
                    cardStyle="borderless"
                    hideLabel={hidePatternLabels}
                    disabled
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: fitToWindow
            ? `repeat(${Math.max(columnCount, 1)}, minmax(64px, 88px))`
            : `repeat(${Math.max(columnCount, 1)}, minmax(92px, 1fr))`,
          justifyContent: fitToWindow ? 'center' : 'stretch',
          gap: 10,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {targets.map((target) => {
          const item = dnd.getTargetItem(target.id);
          const active = dnd.selectedItemId && !item;
          return (
            <CatV2DropZone
              key={target.id}
              label={target.label || `Slot ${target.row || ''}${target.column ? `-${target.column}` : ''}`}
              active={Boolean(active)}
              filled={Boolean(item)}
              minHeight={cellMinHeight}
              style={fitToWindow ? { padding: 6, background: item ? '#ffffff' : '#dff6ff' } : undefined}
              onClick={() => {
                if (item) dnd.returnItem(item.id, target.id);
                else dnd.placeItem(dnd.selectedItemId, target.id);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dnd.handleDrop(event, target.id)}
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
                    dnd.returnItem(item.id, target.id);
                  }}
                />
              ) : (
                <span>{target.label || 'Drop here'}</span>
              )}
            </CatV2DropZone>
          );
        })}
      </div>

      <CatV2SourceTray label="Available items">
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
            onClick={() => handleSourceClick(item.id)}
            onDragStart={dnd.handleDragStart}
            onDragEnd={dnd.handleDragEnd}
          />
        ))}
      </CatV2SourceTray>
    </div>
  );
}
