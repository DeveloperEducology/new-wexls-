import React from 'react';
import DraggableCard from './DraggableCard';

export default function DropTarget({
  target,
  placedItems = [],
  isActive, // Hovered during drag
  isSelectable, // Click-to-place destination (when selectedItemId is active)
  isAnswered,
  layoutMode,
  onItemPointerDown,
  onItemPointerMove,
  onItemPointerUp,
  onTargetClick,
  style = {}
}) {
  const isMultiple = target.maxItems !== undefined ? target.maxItems > 1 : layoutMode === 'category_sort';
  const hasItems = placedItems.length > 0;

  // Absolute positioning styles if coordinates are present
  const isAbsolute = typeof target.x === 'number' || typeof target.y === 'number';
  const unit = target.unit || 'px';

  const positionStyles = isAbsolute ? {
    position: 'absolute',
    left: typeof target.x === 'number' ? `${target.x}${unit}` : target.x,
    top: typeof target.y === 'number' ? `${target.y}${unit}` : target.y,
    width: typeof target.width === 'number' ? `${target.width}${unit}` : target.width,
    height: typeof target.height === 'number' ? `${target.height}${unit}` : target.height,
  } : {};

  const targetStyle = {
    display: 'flex',
    flexDirection: isMultiple ? 'row' : 'column',
    flexWrap: isMultiple ? 'wrap' : 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: isMultiple ? '16px' : '4px',
    backgroundColor: isActive 
      ? '#eff6ff' 
      : isSelectable 
        ? '#f8fafc' 
        : hasItems 
          ? '#f8fafc' 
          : '#f1f5f9',
    border: isActive
      ? '2px solid #3b82f6'
      : isSelectable
        ? '2px dashed #3b82f6'
        : '1.5px dashed #cbd5e1',
    borderRadius: '12px',
    minHeight: isMultiple ? '120px' : '48px',
    minWidth: isMultiple ? '200px' : '100px',
    boxShadow: isActive 
      ? '0 0 0 4px rgba(59, 130, 246, 0.15)' 
      : 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    cursor: isAnswered ? 'default' : (isSelectable ? 'pointer' : 'default'),
    position: 'relative',
    ...positionStyles,
    ...style
  };

  const placeholderStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    color: isActive ? '#3b82f6' : '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    pointerEvents: 'none',
    userSelect: 'none'
  };

  const handleClick = (e) => {
    if (isAnswered) return;
    
    // If clicking a card, don't trigger target click
    if (e.target.closest('[onpointerdown]') || e.target.closest('img') || e.target.closest('span')) {
      // Let pointer handlers deal with it
      return;
    }
    
    if (onTargetClick) {
      onTargetClick(target.id);
    }
  };

  return (
    <div
      data-target-id={target.id}
      style={targetStyle}
      onClick={handleClick}
    >
      {hasItems ? (
        placedItems.map(item => (
          <DraggableCard
            key={item.id}
            item={item}
            isSelected={false}
            isDragging={false}
            isAnswered={isAnswered}
            onPointerDown={onItemPointerDown}
            onPointerMove={onItemPointerMove}
            onItemPointerUp={onItemPointerUp}
            style={isMultiple ? {} : { width: '100%', height: '100%', maxWidth: 'none' }}
          />
        ))
      ) : (
        <span style={placeholderStyle}>
          {target.placeholder !== undefined
            ? target.placeholder
            : (['diagram_labeling', 'matching', 'hotspot', 'flowchart', 'timeline', 'table_fill'].includes(layoutMode)
              ? ''
              : (target.label || 'Drop here'))}
        </span>
      )}
    </div>
  );
}
