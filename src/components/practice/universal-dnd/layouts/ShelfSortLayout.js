import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';
import { speakText } from '@/lib/ttsClient';

export default function ShelfSortLayout({
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
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const boxesContainerStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '24px',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 0'
  };

  const crateStyle = (isActive) => ({
    position: 'relative',
    flex: '1',
    minWidth: '260px',
    maxWidth: '480px',
    borderLeft: '12px solid #b45309',
    borderRight: '12px solid #b45309',
    borderBottom: '12px solid #78350f',
    borderTop: '6px solid #d97706',
    borderRadius: '16px',
    background: 'linear-gradient(to bottom, #d2a984 0%, #c49972 100%)', // premium inside wood color
    boxShadow: isActive 
      ? '0 0 20px rgba(37, 99, 235, 0.4), inset 0 6px 12px rgba(0,0,0,0.12)' 
      : '0 8px 16px rgba(15, 23, 42, 0.08), inset 0 6px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    outline: isActive ? '3.5px dashed #2563eb' : 'none',
    outlineOffset: '2px'
  });

  const frontPanelStyle = {
    background: 'linear-gradient(to bottom, #a16207, #713f12)',
    borderTop: '3px solid #eab308',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 -2px 5px rgba(0,0,0,0.15)',
    zIndex: 3
  };

  const frontLabelStyle = {
    fontWeight: '800',
    color: '#fef3c7',
    fontFamily: 'Outfit, Inter, sans-serif',
    fontSize: '16px',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
    textAlign: 'center'
  };

  const speakButtonStyle = {
    background: '#eab308',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#713f12',
    fontSize: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    padding: 0,
    flexShrink: 0
  };

  return (
    <div style={layoutStyle}>
      {/* Individual sorting boxes container */}
      <div style={boxesContainerStyle}>
        {targets.map((target) => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;

          return (
            <div key={target.id} style={crateStyle(isActive)}>
              {/* Crate Interior Drop Target area */}
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="shelf_sort"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  border: 'none',
                  minHeight: '160px',
                  padding: '16px 16px 12px 16px',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'flex-end', // Sit shapes right on top of the bottom board!
                  justifyContent: 'center',
                  width: '100%',
                  zIndex: 2,
                  transition: 'all 0.2s ease'
                }}
              />

              {/* Wooden Crate Front Panel with Placard label */}
              <div style={frontPanelStyle}>
                <button
                  type="button"
                  onClick={() => speakText(target.label || '')}
                  style={speakButtonStyle}
                  title="Read label"
                >
                  🔊
                </button>
                <span style={frontLabelStyle}>{target.label}</span>
              </div>
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

