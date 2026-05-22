import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function MatchingLayout({
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

  // Derive prompts from question.prompts, or fallback to targets' prompt fields
  const prompts = question.prompts || targets.map((t, idx) => ({
    id: t.promptId || `prompt_${t.id || idx}`,
    content: t.promptLabel || t.label || `Prompt ${idx + 1}`
  }));

  const layoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const matchingGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    position: 'relative', // Relative for ConnectorLayer SVG overlay
    minHeight: '200px'
  };

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const promptBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    minHeight: '60px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    boxSizing: 'border-box'
  };

  return (
    <div style={layoutStyle}>
      <div style={matchingGridStyle}>
        {/* Left Column: Prompts */}
        <div style={columnStyle}>
          {prompts.map(prompt => (
            <div
              key={prompt.id}
              data-prompt-id={prompt.id} // Let connector layer measure it
              style={promptBoxStyle}
            >
              {prompt.imageUrl && (
                <img
                  src={prompt.imageUrl}
                  alt={prompt.content || 'prompt'}
                  style={{
                    maxHeight: '48px',
                    marginRight: prompt.content ? '10px' : '0',
                    borderRadius: '4px'
                  }}
                />
              )}
              {prompt.content && <span>{prompt.content}</span>}
            </div>
          ))}
        </div>

        {/* Right Column: Drop Targets */}
        <div style={columnStyle}>
          {targets.map(target => {
            const placedItems = getTargetItems(target.id);
            const isActive = activeTargetId === target.id;
            const isSelectable = !!selectedItemId;

            return (
              <DropTarget
                key={target.id}
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="matching"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{
                  minHeight: '60px',
                  borderRadius: '12px',
                  width: '100%'
                }}
              />
            );
          })}
        </div>
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
