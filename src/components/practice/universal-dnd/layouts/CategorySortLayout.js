import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function CategorySortLayout({
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

  const categoriesContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    width: '100%'
  };

  const categoryBoxStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '16px',
    padding: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
  };

  const categoryHeaderStyle = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    borderBottom: '1.5px solid #f1f5f9',
    paddingBottom: '10px',
    margin: 0
  };

  return (
    <div style={layoutStyle}>
      {/* Category Drop Zones */}
      <div style={categoriesContainerStyle}>
        {targets.map(target => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;

          return (
            <div key={target.id} style={categoryBoxStyle}>
              <h3 style={categoryHeaderStyle}>{target.label}</h3>
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="category_sort"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{ flex: 1 }}
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
