import React from 'react';
import DraggableCard from './DraggableCard';

export default function SourceTray({
  items,
  sourceSlots,
  selectedItemId,
  draggingItemId,
  isAnswered,
  placeholderMode = 'fixed',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  style = {}
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    overflowX: 'auto',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '120px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
    // Support custom scrollbar styles
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    ...style
  };

  return (
    <div data-source-tray="true" style={containerStyle}>
      {sourceSlots.map((slot, index) => {
        // Find which item corresponds to this slot
        // In 'fixed' mode, slot corresponds directly to index in the items array.
        // In 'collapse' mode, slots are just a list of remaining item IDs.
        const itemId = slot;
        const item = itemId ? items.find(i => i.id === itemId) : null;
        
        // If placeholderMode is fixed, we want to know which item is currently missing
        const referenceItem = placeholderMode === 'fixed' ? items[index] : null;

        if (item) {
          const isSelected = selectedItemId === item.id;
          const isDragging = draggingItemId === item.id;

          return (
            <DraggableCard
              key={item.id}
              item={item}
              isSelected={isSelected}
              isDragging={isDragging}
              isAnswered={isAnswered}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          );
        } else if (placeholderMode === 'fixed' && referenceItem) {
          // Render a fixed placeholder card to prevent layout shifts
          const hasImage = !!referenceItem.imageUrl || !!referenceItem.svg;
          const imageWidth = referenceItem.imageWidth ? parseInt(referenceItem.imageWidth, 10) : 120;
          const cardWidth = hasImage ? Math.min(200, Math.max(60, imageWidth + 24)) : 80;

          const placeholderStyle = {
            width: typeof cardWidth === 'number' ? `${cardWidth}px` : cardWidth,
            minWidth: typeof cardWidth === 'number' ? `${cardWidth}px` : '80px',
            height: hasImage ? (referenceItem.content ? '146px' : '116px') : '44px',
            border: '1.5px dashed #cbd5e1',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            boxSizing: 'border-box',
            flexShrink: 0,
            opacity: 0.5
          };

          return (
            <div key={`placeholder-${referenceItem.id}`} style={placeholderStyle} />
          );
        }

        return null;
      })}
      {sourceSlots.length === 0 && (
        <div style={{
          width: '100%',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '14px',
          fontWeight: '500',
          fontStyle: 'italic',
          padding: '12px 0'
        }}>
          All items sorted
        </div>
      )}
    </div>
  );
}
