import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function FlowchartLayout({
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
    height: canvas?.height ? `${canvas.height}px` : '400px',
    borderRadius: '16px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  return (
    <div style={layoutStyle}>
      {/* Flowchart Canvas */}
      <div style={canvasWrapperStyle}>
        {/* Render targets at their designated absolute coordinates */}
        {targets.map(target => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;

          const unit = target.unit || 'px';
          const left = typeof target.x === 'number' ? `${target.x}${unit}` : target.x;
          const top = typeof target.y === 'number' ? `${target.y}${unit}` : target.y;
          const width = typeof target.width === 'number' ? `${target.width}${unit}` : target.width;
          const height = typeof target.height === 'number' ? `${target.height}${unit}` : target.height;

          // Render either as a fixed static flowchart node (if type is static) or a drop target
          const isStatic = target.kind === 'static';

          if (isStatic) {
            return (
              <div
                key={target.id}
                data-target-id={target.id} // Let connector layer reference it
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '2px solid #0f172a',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textAlign: 'center',
                  zIndex: 2
                }}
              >
                {target.label}
              </div>
            );
          }

          return (
            <div
              key={target.id}
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                zIndex: 4
              }}
            >
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="flowchart"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{ width: '100%', height: '100%', borderRadius: '8px' }}
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
