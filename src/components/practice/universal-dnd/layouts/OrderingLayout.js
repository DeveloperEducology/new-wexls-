import React, { useMemo } from 'react';
import DraggableCard from '../components/DraggableCard';

function getDirection(question) {
  const text = String(question.questionText || '').toLowerCase();
  if (text.includes('largest to smallest') || text.includes('greatest to least') || text.includes('descending')) {
    return 'desc';
  }
  return 'asc';
}

function getItemValue(item) {
  return item.value ?? item.content ?? item.label ?? item.text ?? item.id;
}

function compareItems(a, b, direction) {
  const aNumber = Number(getItemValue(a));
  const bNumber = Number(getItemValue(b));
  const result = Number.isFinite(aNumber) && Number.isFinite(bNumber)
    ? aNumber - bNumber
    : String(getItemValue(a)).localeCompare(String(getItemValue(b)), undefined, {
        numeric: true,
        sensitivity: 'base'
      });

  return direction === 'desc' ? -result : result;
}

export default function OrderingLayout({
  question,
  dndState,
  isAnswered
}) {
  const { targets, items } = question;
  const {
    selectedItemId,
    draggingItemId,
    activeTargetId,
    placements,
    previewPlacements,
    hasInteracted,
    getTargetItems,
    handleTargetClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = dndState;

  const direction = getDirection(question);
  const sortedIds = useMemo(() => {
    return [...items].sort((a, b) => compareItems(a, b, direction)).map(item => item.id);
  }, [direction, items]);

  const visualPlacements = previewPlacements || placements;
  const actualOrderItems = targets
    .map(target => items.find(item => placements[item.id] === target.id))
    .filter(Boolean);
  const visualOrderIds = targets
    .map(target => items.find(item => visualPlacements[item.id] === target.id)?.id)
    .filter(Boolean);
  const currentOrderIds = visualOrderIds;
  const inCorrectOrder = currentOrderIds.length === sortedIds.length
    && currentOrderIds.every((id, index) => id === sortedIds[index]);
  const placedCount = currentOrderIds.length;
  const activeIndex = targets.findIndex(target => target.id === activeTargetId);
  const selectedItem = selectedItemId ? items.find(item => item.id === selectedItemId) : null;
  const instructionLabel = direction === 'desc' ? 'Largest' : 'Smallest';
  const destinationLabel = direction === 'desc' ? 'Smallest' : 'Largest';
  const slotPitch = 108;

  const layoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: '100%',
    boxSizing: 'border-box'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '2px 2px 0',
    flexWrap: 'wrap'
  };

  const coachingStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 220,
    color: '#475569',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.35
  };

  const pulseStyle = {
    width: 9,
    height: 9,
    borderRadius: 999,
    background: inCorrectOrder ? '#22c55e' : hasInteracted ? '#3b82f6' : '#94a3b8',
    boxShadow: inCorrectOrder
      ? '0 0 0 5px rgba(34, 197, 94, 0.12)'
      : hasInteracted
        ? '0 0 0 5px rgba(59, 130, 246, 0.12)'
        : 'none',
    flex: '0 0 auto'
  };

  const progressStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: 'uppercase'
  };

  const progressTrackStyle = {
    width: 92,
    height: 7,
    borderRadius: 999,
    background: '#eaf1fb',
    overflow: 'hidden'
  };

  const progressFillStyle = {
    width: `${Math.round((placedCount / Math.max(items.length, 1)) * 100)}%`,
    height: '100%',
    borderRadius: 999,
    background: inCorrectOrder ? '#22c55e' : '#3b82f6',
    transition: 'width 180ms ease, background 180ms ease'
  };

  const railStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '14px 0 18px',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin'
  };

  const railLineStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #dbeafe, #bfdbfe)'
  };

  const endpointStyle = {
    position: 'absolute',
    bottom: -18,
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: 'uppercase'
  };

  const slotStyle = {
    position: 'relative',
    width: 'clamp(74px, 13vw, 96px)',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    border: '2px solid transparent',
    background: 'transparent',
    transition: 'border-color 130ms ease, background 130ms ease, box-shadow 130ms ease, transform 130ms ease',
    flex: '0 0 auto'
  };

  const placeholderStyle = {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    border: '2px dashed #c7dcf8',
    background: '#f8fbff'
  };

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 30,
    padding: '5px 10px',
    borderRadius: 999,
    background: selectedItem ? '#eff6ff' : inCorrectOrder ? '#ecfdf3' : '#f8fafc',
    color: selectedItem ? '#1d4ed8' : inCorrectOrder ? '#15803d' : '#64748b',
    border: selectedItem ? '1px solid #bfdbfe' : inCorrectOrder ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.25
  };

  return (
    <div style={layoutStyle}>
      <div style={headerStyle}>
        <div style={coachingStyle}>
          <span style={pulseStyle} />
          <span>
            {inCorrectOrder
              ? 'Looks ordered. Submit when ready.'
              : selectedItem
                ? `Tap the place for ${getItemValue(selectedItem)}.`
                : 'Compare place values, then arrange the cards.'}
          </span>
        </div>
        <div style={progressStyle} aria-label={`${placedCount} of ${items.length} cards placed`}>
          <span>{placedCount}/{items.length}</span>
          <span style={progressTrackStyle}>
            <span style={progressFillStyle} />
          </span>
        </div>
      </div>

      <div style={railStyle} aria-label="Ordering row">
        <span style={{ ...endpointStyle, left: 0 }}>{instructionLabel}</span>
        <span style={{ ...endpointStyle, right: 0 }}>{destinationLabel}</span>
        <span style={railLineStyle} />

        {actualOrderItems.map((placedItem) => {
          const actualTargetId = placements[placedItem.id];
          const target = targets.find(candidate => candidate.id === actualTargetId) || targets[0];
          const actualIndex = targets.findIndex(candidate => candidate.id === actualTargetId);
          const previewTargetId = previewPlacements?.[placedItem.id];
          const previewIndex = placedItem.id === draggingItemId
            ? actualIndex
            : targets.findIndex(candidate => candidate.id === previewTargetId);
          const isActive = activeTargetId === target.id;
          const isSelectable = Boolean(selectedItemId);
          const isDraggingThis = placedItem && draggingItemId === placedItem.id;
          const isCurrentlyCorrect = sortedIds[actualIndex] === placedItem.id;
          const isPreviewShift = Boolean(previewPlacements && placedItem.id !== draggingItemId && previewIndex >= 0 && previewIndex !== actualIndex);
          const shiftBy = isDraggingThis ? 0 : (isPreviewShift ? (previewIndex - actualIndex) * slotPitch : 0);

          return (
            <div
              key={target.id}
              data-target-id={target.id}
              data-ordering-target="true"
              onClick={() => handleTargetClick(target.id)}
              style={{
                ...slotStyle,
                borderColor: isActive || isSelectable ? '#2563eb' : 'transparent',
                background: isActive ? '#eff6ff' : 'transparent',
                boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.12)' : 'none',
                cursor: isAnswered ? 'default' : isSelectable ? 'pointer' : 'default'
              }}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: activeIndex === 0 ? -4 : -8,
                    top: 5,
                    bottom: 5,
                    width: 4,
                    borderRadius: 999,
                    background: '#2563eb',
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)'
                  }}
                />
              )}

              <DraggableCard
                item={{ ...placedItem, textColor: '#ffffff' }}
                isSelected={selectedItemId === placedItem.id}
                isDragging={isDraggingThis}
                isAnswered={isAnswered}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: '100%',
                  height: '100%',
                  minHeight: '100%',
                  padding: '0 12px',
                  backgroundColor: isCurrentlyCorrect && isAnswered ? '#22c55e' : '#3b7ddd',
                  border: selectedItemId === placedItem.id ? '2px solid #1d4ed8' : '1px solid #2f6fca',
                  borderRadius: 6,
                  color: '#ffffff',
                  transform: !isDraggingThis && isActive
                    ? `translateX(${shiftBy}px) translateY(-1px)`
                    : `translateX(${shiftBy}px)`,
                  boxShadow: isDraggingThis
                    ? '0 10px 22px rgba(37, 99, 235, 0.22)'
                    : isPreviewShift
                      ? '0 5px 12px rgba(37, 99, 235, 0.18)'
                      : '0 2px 4px rgba(15, 23, 42, 0.18)',
                  opacity: isDraggingThis ? 0 : 1,
                  transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 120ms ease, box-shadow 160ms ease',
                  fontSize: 19,
                  fontWeight: 650,
                  disableHover: true
                }}
              />
            </div>
          );
        })}

        {targets.slice(actualOrderItems.length).map((target) => (
          <div
            key={target.id}
            data-target-id={target.id}
            data-ordering-target="true"
            onClick={() => handleTargetClick(target.id)}
            style={{
              ...slotStyle,
              borderColor: activeTargetId === target.id || selectedItemId ? '#2563eb' : 'transparent',
              background: activeTargetId === target.id ? '#eff6ff' : 'transparent',
              boxShadow: activeTargetId === target.id ? '0 0 0 4px rgba(37, 99, 235, 0.12)' : 'none',
              cursor: isAnswered ? 'default' : selectedItemId ? 'pointer' : 'default'
            }}
          >
            <div style={placeholderStyle} />
          </div>
        ))}
      </div>

      <div style={chipStyle}>
        {inCorrectOrder
          ? 'Ready to check'
          : draggingItemId
            ? 'Release near a card to reorder'
            : selectedItem
              ? 'Click a position to move it'
              : 'Drag or tap a number'}
      </div>
    </div>
  );
}
