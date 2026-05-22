import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function TimelineLayout({
  question,
  dndState,
  isAnswered
}) {
  const { targets, items, sourceTray } = question;
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
    gap: '28px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const timelineContainerStyle = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: '24px',
    padding: '24px 16px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    boxSizing: 'border-box',
    width: '100%'
  };

  const lineStyle = {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: '50%',
    height: '4px',
    backgroundColor: '#e2e8f0',
    zIndex: 1,
    transform: 'translateY(-50%)',
  };

  return (
    <div style={layoutStyle}>
      {/* Timeline rail and slots */}
      <div style={timelineContainerStyle}>
        {/* Rail background line (horizontal desktop default, hidden if wrapped too much but CSS handles it nicely) */}
        <div style={lineStyle} className="timeline-rail-line" />

        {targets.map((target, index) => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;

          return (
            <div
              key={target.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                zIndex: 2,
                position: 'relative',
                flexShrink: 0
              }}
            >
              {/* Step indicator dot/number */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: placedItems.length > 0 ? '#2563eb' : '#f1f5f9',
                  border: placedItems.length > 0 ? '2px solid #ffffff' : '2px solid #cbd5e1',
                  color: placedItems.length > 0 ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                {index + 1}
              </div>

              {/* Target Drop Slot */}
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="timeline"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{
                  width: '140px',
                  height: '80px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              />
              
              {/* Optional Target Label (e.g. Date or Event description placeholder) */}
              {target.label && (
                <span
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569',
                    textAlign: 'center',
                    maxWidth: '130px'
                  }}
                >
                  {target.label}
                </span>
              )}
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
