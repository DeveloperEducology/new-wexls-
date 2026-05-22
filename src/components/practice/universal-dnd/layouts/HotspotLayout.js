import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function HotspotLayout({
  question,
  dndState,
  isAnswered
}) {
  const { targets, items, sourceTray, canvas } = question;
  const {
    selectedItemId,
    draggingItemId,
    activeTargetId,
    sourceSlots,
    getTargetItems,
    handleTargetClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = dndState;

  const bgImage = canvas?.backgroundImage || question.backgroundImage;

  const layoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const canvasWrapperStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: canvas?.width ? `${canvas.width}px` : '800px',
    margin: '0 auto',
    borderRadius: '16px',
    border: '1.5px solid #e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  };

  const imageStyle = {
    width: '100%',
    height: 'auto',
    display: 'block',
    userSelect: 'none',
    pointerEvents: 'none'
  };

  return (
    <div style={layoutStyle}>
      {/* Hotspot Image Canvas */}
      <div style={canvasWrapperStyle}>
        {bgImage && (
          <img 
            src={bgImage} 
            alt="Hotspot background" 
            style={imageStyle} 
          />
        )}
        
        {/* Hotspot regions overlaid */}
        {targets.map(target => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;
          const hasItems = placedItems.length > 0;

          // Convert coordinates to CSS values
          const unit = target.unit || 'px';
          const left = typeof target.x === 'number' ? `${target.x}${unit}` : target.x;
          const top = typeof target.y === 'number' ? `${target.y}${unit}` : target.y;
          const width = typeof target.width === 'number' ? `${target.width}${unit}` : target.width;
          const height = typeof target.height === 'number' ? `${target.height}${unit}` : target.height;

          const targetWrapperStyle = {
            position: 'absolute',
            left,
            top,
            width,
            height,
            zIndex: 10
          };

          // For hotspots, if they are empty, we want them to look semi-transparent
          // but if click-to-place or hover is active, highlight them.
          const hotspotCustomStyle = {
            width: '100%',
            height: '100%',
            backgroundColor: isActive 
              ? 'rgba(59, 130, 246, 0.25)' 
              : isSelectable 
                ? 'rgba(59, 130, 246, 0.1)' 
                : hasItems 
                  ? 'transparent' 
                  : 'rgba(148, 163, 184, 0.15)',
            border: isActive
              ? '2.5px solid #2563eb'
              : isSelectable
                ? '2.5px dashed #2563eb'
                : hasItems
                  ? 'none'
                  : '1.5px dashed rgba(71, 85, 105, 0.4)',
            borderRadius: '6px',
            boxShadow: isActive ? '0 0 8px rgba(37, 99, 235, 0.4)' : 'none',
          };

          return (
            <div key={target.id} style={targetWrapperStyle}>
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="hotspot"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={hotspotCustomStyle}
              />
            </div>
          );
        })}
      </div>

      {/* Source Tray at bottom */}
      {sourceTray.position === 'bottom' && (
        <SourceTray
          items={items}
          sourceSlots={sourceSlots}
          selectedItemId={selectedItemId}
          draggingItemId={draggingItemId}
          isAnswered={isAnswered}
          placeholderMode={sourceTray.placeholderMode}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  );
}
