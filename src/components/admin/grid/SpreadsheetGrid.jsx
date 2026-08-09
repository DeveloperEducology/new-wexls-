'use client';

import React from 'react';

const LEVEL_CONFIG = {
  l1: { label: 'L1', long: 'Easy',      emoji: '🟢', color: '#10b981', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.25)', pill: '#064e3b' },
  l2: { label: 'L2', long: 'Medium',    emoji: '🟠', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.25)',  pill: '#78350f' },
  l3: { label: 'L3', long: 'Hard',      emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.25)',   pill: '#7f1d1d' },
  l4: { label: 'L4', long: 'Challenge', emoji: '🔥', color: '#8b5cf6', bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.25)', pill: '#4c1d95' },
};
const LEVEL_CYCLE = ['l1', 'l2', 'l3', 'l4'];

export default function SpreadsheetGrid({
  columns,
  setColumns,
  rows,
  setRows,
  activeRowIndex,
  setActiveRowIndex,
  onAutoTTS,
  warmingTts,
  canUndo,
  canRedo,
  undo,
  redo,
  selectedVoice = 'Puck',
  setSelectedVoice,
  selectedRowIndices = [],
  setSelectedRowIndices,
  onOpenColumnManager,
  onOpenBatchSlicer
}) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo && redo) redo();
        } else {
          if (canUndo && undo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        if (canRedo && redo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const handleAddColumn = () => {
    const name = prompt("Enter new column header name (e.g. object_5_image_url, sound_effect):");
    if (name && name.trim()) {
      const cleanName = name.trim().replace(/[^a-zA-Z0-9_]+/g, '_');
      if (cleanName && !columns.includes(cleanName)) {
        setColumns([...columns, cleanName]);
        setRows(rows.map(r => ({ ...r, [cleanName]: '' })));
      }
    }
  };

  const handleRenameColumn = (oldCol) => {
    const newName = prompt(`Rename column "${oldCol}" to:`, oldCol);
    if (!newName || !newName.trim()) return;
    const cleanName = newName.trim().replace(/[^a-zA-Z0-9_]+/g, '_');
    if (!cleanName || cleanName === oldCol) return;
    if (columns.includes(cleanName)) {
      alert(`Column "${cleanName}" already exists!`);
      return;
    }

    setColumns(columns.map(c => c === oldCol ? cleanName : c));
    setRows(rows.map(r => {
      const copy = { ...r };
      if (oldCol in copy) {
        copy[cleanName] = copy[oldCol];
        delete copy[oldCol];
      }
      return copy;
    }));
  };

  const handleAddRow = () => {
    const lastLevel = rows.length > 0 ? (rows[rows.length - 1]._level || 'l1') : 'l1';
    const newRow = { _level: lastLevel };
    columns.forEach(c => { newRow[c] = ''; });
    setRows([...rows, newRow]);
    setActiveRowIndex(rows.length);
  };

  const handleLevelCycle = (rIdx) => {
    const copy = [...rows];
    const curr = copy[rIdx]._level || 'l1';
    const nextIdx = (LEVEL_CYCLE.indexOf(curr) + 1) % LEVEL_CYCLE.length;
    copy[rIdx] = { ...copy[rIdx], _level: LEVEL_CYCLE[nextIdx] };
    setRows(copy);
  };

  return (
    <div className="grid-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 className="grid-card-title" style={{ margin: 0 }}>📊 Step 1: Spreadsheet Data Grid</h3>
          <p className="grid-card-desc" style={{ margin: '2px 0 0 0' }}>Add rows, columns, and edit values directly. Press Ctrl+Z to Undo, Ctrl+Y to Redo.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Undo / Redo Buttons */}
          <div style={{ display: 'flex', gap: '4px', marginRight: '6px' }}>
            <button
              type="button"
              disabled={!canUndo}
              onClick={undo}
              title="Undo (Ctrl+Z)"
              style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 700, cursor: canUndo ? 'pointer' : 'not-allowed', opacity: canUndo ? 1 : 0.4 }}
            >
              ↩️ Undo
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={redo}
              title="Redo (Ctrl+Y)"
              style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 700, cursor: canRedo ? 'pointer' : 'not-allowed', opacity: canRedo ? 1 : 0.4 }}
            >
              ↪️ Redo
            </button>
          </div>

          {/* Voice Selector */}
          {setSelectedVoice && (
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{ background: '#0f172a', color: '#38bdf8', border: '1px solid #334155', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 800 }}
            >
              <option value="Puck">🗣️ Voice: Puck (Child)</option>
              <option value="Fenrir">🗣️ Voice: Fenrir (Deep Male)</option>
              <option value="Kore">🗣️ Voice: Kore (Female)</option>
              <option value="Aoede">🗣️ Voice: Aoede (Soft Female)</option>
              <option value="Charon">🗣️ Voice: Charon (Authoritative)</option>
            </select>
          )}

          <button
            type="button"
            onClick={onAutoTTS}
            disabled={warmingTts}
            style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            {warmingTts ? '⏳ Resolving R2 Audios...' : '🪄 Auto-Generate & Warm TTS Audios'}
          </button>
          <button
            type="button"
            onClick={handleAddColumn}
            style={{ background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            ➕ Add Column
          </button>
          {onOpenBatchSlicer && (
            <button
              type="button"
              onClick={onOpenBatchSlicer}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(99,102,241,0.3)' }}
              title="Upload 1 page image and slice it into 5 question rows in 1 click"
            >
              ⚡ Batch Slice Page (5 Rows)
            </button>
          )}
          <button
            type="button"
            onClick={handleAddRow}
            style={{ background: '#10b981', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            ➕ Add Row
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #334155', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '10px', width: '40px', textAlign: 'center' }}>
                {setSelectedRowIndices && (
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedRowIndices.length === rows.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedRowIndices(rows.map((_, i) => i));
                      else setSelectedRowIndices([]);
                    }}
                    style={{ width: '15px', height: '15px', accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                )}
              </th>
              <th style={{ padding: '10px', width: '40px', textAlign: 'center', color: '#94a3b8' }}>#</th>
              <th style={{ padding: '10px', width: '70px', textAlign: 'center', color: '#94a3b8' }}>Level</th>
              {columns.map(col => {
                const lower = col.toLowerCase();
                let badgeIcon = '[fx]';
                let badgeColor = '#06b6d4';
                if (lower.includes('result') || lower.includes('target') || lower.includes('answer')) { badgeIcon = '🎯'; badgeColor = '#10b981'; }
                else if (lower.includes('distractor') || lower.includes('option')) { badgeIcon = '🎲'; badgeColor = '#f59e0b'; }
                else if (lower.includes('image') || lower.includes('figure') || lower.includes('img')) { badgeIcon = '🖼️'; badgeColor = '#a855f7'; }
                else if (lower.includes('audio') || lower.includes('sound') || lower.includes('tts')) { badgeIcon = '🔊'; badgeColor = '#3b82f6'; }
                else if (lower.includes('explanation') || lower.includes('solution')) { badgeIcon = '💬'; badgeColor = '#818cf8'; }

                return (
                  <th key={col} style={{ padding: '10px 12px', textAlign: 'left', color: '#f8fafc', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        title="Click to manage column settings, rename, or transform"
                        onClick={() => {
                          if (onOpenColumnManager) onOpenColumnManager(col);
                          else handleRenameColumn(col);
                        }}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', color: badgeColor, border: `1px solid ${badgeColor}`, padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>
                          {badgeIcon}
                        </span>
                        <span>{col}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>⚙️</span>
                      </span>
                    </div>
                  </th>
                );
              })}
              <th style={{ padding: '10px', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              if (!row) return null;
              const lvl = LEVEL_CONFIG[row?._level || 'l1'] || LEVEL_CONFIG.l1;
              const isActive = rIdx === activeRowIndex;
              return (
                <tr
                  key={rIdx}
                  onClick={() => setActiveRowIndex(rIdx)}
                  style={{
                    background: selectedRowIndices.includes(rIdx) ? 'rgba(99, 102, 241, 0.18)' : (isActive ? 'rgba(56, 189, 248, 0.08)' : (rIdx % 2 === 0 ? '#1e293b' : '#0f172a')),
                    borderBottom: '1px solid #1e293b',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    {setSelectedRowIndices && (
                      <input
                        type="checkbox"
                        checked={selectedRowIndices.includes(rIdx)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRowIndices([...selectedRowIndices, rIdx]);
                          else setSelectedRowIndices(selectedRowIndices.filter(i => i !== rIdx));
                        }}
                        style={{ width: '15px', height: '15px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                    {rIdx + 1}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLevelCycle(rIdx);
                      }}
                      title="Click to cycle difficulty level"
                      style={{ background: lvl.pill, color: '#fff', border: `1px solid ${lvl.border}`, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {lvl.emoji} {lvl.label}
                    </button>
                  </td>
                  {columns.map(col => (
                    <td key={col} style={{ padding: '6px 10px' }}>
                      <input
                        type="text"
                        value={row[col] !== undefined ? String(row[col]) : ''}
                        onChange={(e) => {
                          const copy = [...rows];
                          copy[rIdx] = { ...copy[rIdx], [col]: e.target.value };
                          setRows(copy);
                        }}
                        style={{ width: '100%', background: 'transparent', border: '1px solid transparent', color: '#f8fafc', fontSize: '12px', padding: '4px 6px', borderRadius: '4px' }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete row ${rIdx + 1}?`)) {
                            const copy = rows.filter((_, i) => i !== rIdx);
                            setRows(copy);
                            setActiveRowIndex(Math.max(0, activeRowIndex - 1));
                          }
                        }}
                        style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
