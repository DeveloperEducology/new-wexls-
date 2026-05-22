import React from 'react';
import DropTarget from '../components/DropTarget';
import SourceTray from '../components/SourceTray';

export default function TableFillLayout({
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

  const tableData = question.table;

  const layoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const tableWrapperStyle = {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
    backgroundColor: '#ffffff'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    textAlign: 'left'
  };

  const thStyle = {
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontWeight: '700',
    padding: '12px 16px',
    borderBottom: '1.5px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
  };

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    color: '#0f172a'
  };

  // Render fallback if table grid metadata is not provided
  const renderFallback = () => {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        padding: '20px',
        border: '1.5px dashed #cbd5e1',
        borderRadius: '12px'
      }}>
        {targets.map(target => {
          const placedItems = getTargetItems(target.id);
          const isActive = activeTargetId === target.id;
          const isSelectable = !!selectedItemId;

          return (
            <div key={target.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                {target.label}
              </span>
              <DropTarget
                target={target}
                placedItems={placedItems}
                isActive={isActive}
                isSelectable={isSelectable}
                isAnswered={isAnswered}
                layoutMode="table_fill"
                onItemPointerDown={handlePointerDown}
                onItemPointerMove={handlePointerMove}
                onItemPointerUp={handlePointerUp}
                onTargetClick={handleTargetClick}
                style={{ minHeight: '60px' }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={layoutStyle}>
      {tableData ? (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            {tableData.headers && (
              <thead>
                <tr>
                  {tableData.headers.map((header, idx) => (
                    <th 
                      key={`th-${idx}`} 
                      style={{
                        ...thStyle,
                        borderRight: idx === tableData.headers.length - 1 ? 'none' : thStyle.borderRight
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableData.rows && tableData.rows.map((row, rowIdx) => (
                <tr key={`tr-${rowIdx}`}>
                  {row.map((cell, cellIdx) => {
                    const isLastCell = cellIdx === row.length - 1;
                    const cellTdStyle = {
                      ...tdStyle,
                      borderRight: isLastCell ? 'none' : tdStyle.borderRight,
                      borderBottom: rowIdx === tableData.rows.length - 1 ? 'none' : tdStyle.borderBottom
                    };

                    if (cell.type === 'target') {
                      const target = targets.find(t => t.id === cell.targetId);
                      if (target) {
                        const placedItems = getTargetItems(target.id);
                        const isActive = activeTargetId === target.id;
                        const isSelectable = !!selectedItemId;

                        return (
                          <td key={`cell-${rowIdx}-${cellIdx}`} style={cellTdStyle}>
                            <DropTarget
                              target={target}
                              placedItems={placedItems}
                              isActive={isActive}
                              isSelectable={isSelectable}
                              isAnswered={isAnswered}
                              layoutMode="table_fill"
                              onItemPointerDown={handlePointerDown}
                              onItemPointerMove={handlePointerMove}
                              onItemPointerUp={handlePointerUp}
                              onTargetClick={handleTargetClick}
                              style={{ 
                                minHeight: '52px', 
                                width: '100%',
                                backgroundColor: isActive ? '#eff6ff' : '#f8fafc',
                                border: isActive ? '2px solid #3b82f6' : '1.5px dashed #cbd5e1'
                              }}
                            />
                          </td>
                        );
                      }
                    }

                    // Render static text / cell content
                    return (
                      <td key={`cell-${rowIdx}-${cellIdx}`} style={cellTdStyle}>
                        {cell.content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : renderFallback()}

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
