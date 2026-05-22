import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function DiagramLabelingLayout({
  question,
  dndState,
  isAnswered,
  containerRef
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
      {/* Diagram Canvas */}
      <div data-diagram-canvas="true" style={canvasWrapperStyle}>
        {bgImage && (
          <img 
            src={bgImage} 
            alt="Diagram background" 
            style={imageStyle} 
          />
        )}
        
        {/* Drop Targets overlaid on top */}
        {targets.map(target => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;

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

          return (
            <div key={target.id} style={targetWrapperStyle}>
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="diagram_labeling"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          );
        })}

        {/* Hotspot Target Dots (to show where labels point on the image) */}
        {targets.map(target => {
          if (target.pointerX === undefined || target.pointerY === undefined) return null;
          const unit = target.unit || 'px';
          const pLeft = typeof target.pointerX === 'number' ? `${target.pointerX}${unit}` : target.pointerX;
          const pTop = typeof target.pointerY === 'number' ? `${target.pointerY}${unit}` : target.pointerY;

          return (
            <div
              key={`dot-${target.id}`}
              style={{
                position: 'absolute',
                left: pLeft,
                top: pTop,
                width: '10px',
                height: '10px',
                backgroundColor: '#2563eb',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 6,
                pointerEvents: 'none'
              }}
            />
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
