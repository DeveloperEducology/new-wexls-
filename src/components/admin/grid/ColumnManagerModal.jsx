'use client';

import React, { useState, useEffect } from 'react';

export default function ColumnManagerModal({
  isOpen,
  onClose,
  columns = [],
  setColumns,
  rows = [],
  setRows,
  editingColumn = null
}) {
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState('variable');
  const [defaultValue, setDefaultValue] = useState('');

  useEffect(() => {
    if (editingColumn) {
      setColName(editingColumn);
      const lower = editingColumn.toLowerCase();
      if (lower.includes('result') || lower.includes('target') || lower.includes('answer')) setColType('result');
      else if (lower.includes('distractor') || lower.includes('option')) setColType('distractor');
      else if (lower.includes('image') || lower.includes('figure') || lower.includes('img')) setColType('image');
      else if (lower.includes('audio') || lower.includes('sound') || lower.includes('tts')) setColType('audio');
      else if (lower.includes('explanation') || lower.includes('solution') || lower.includes('hint')) setColType('explanation');
      else setColType('variable');
    } else {
      setColName('');
      setColType('variable');
      setDefaultValue('');
    }
  }, [editingColumn]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!colName.trim()) return alert('Column name is required.');
    const cleanName = colName.trim().replace(/[^a-zA-Z0-9_]+/g, '_');

    if (editingColumn) {
      // Renaming existing column
      if (cleanName !== editingColumn && columns.includes(cleanName)) {
        return alert(`Column "${cleanName}" already exists!`);
      }

      setColumns(columns.map(c => c === editingColumn ? cleanName : c));
      setRows(rows.map(r => {
        const copy = { ...r };
        if (editingColumn in copy) {
          copy[cleanName] = copy[editingColumn];
          delete copy[editingColumn];
        }
        if (defaultValue && !copy[cleanName]) {
          copy[cleanName] = defaultValue;
        }
        return copy;
      }));
    } else {
      // Adding new column
      if (columns.includes(cleanName)) return alert(`Column "${cleanName}" already exists!`);
      setColumns([...columns, cleanName]);
      setRows(rows.map(r => ({ ...r, [cleanName]: defaultValue || '' })));
    }

    onClose();
  };

  const handleTransform = (transformType) => {
    if (!editingColumn) return;
    const updated = rows.map(r => {
      let val = String(r[editingColumn] || '');
      if (transformType === 'uppercase') val = val.toUpperCase();
      if (transformType === 'lowercase') val = val.toLowerCase();
      if (transformType === 'trim') val = val.trim();
      if (transformType === 'katex') val = val.startsWith('$') ? val : `$${val}$`;
      return { ...r, [editingColumn]: val };
    });
    setRows(updated);
  };

  const handleDeleteColumn = () => {
    if (!editingColumn) return;
    if (confirm(`Are you sure you want to delete column "${editingColumn}"?`)) {
      setColumns(columns.filter(c => c !== editingColumn));
      setRows(rows.map(r => {
        const copy = { ...r };
        delete copy[editingColumn];
        return copy;
      }));
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', maxWidth: '480px', width: '100%',
        padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0', fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️ {editingColumn ? 'Edit Column Settings' : 'Add New Column'}</span>
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: '16px' }}>
          {/* Column Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Column Header Name (Variable Key)
            </label>
            <input
              type="text"
              value={colName}
              onChange={e => setColName(e.target.value)}
              placeholder="e.g. number_to_factor, Result, Distractor1"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
              required
            />
          </div>

          {/* Column Data Type Role */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Column Role & Data Type
            </label>
            <select
              value={colType}
              onChange={e => setColType(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
            >
              <option value="variable">🧮 Input Parameter / Variable ({`{variable_name}`})</option>
              <option value="result">🎯 Correct Answer Candidate (Result)</option>
              <option value="distractor">🎲 Misconception Distractor (Wrong Answer)</option>
              <option value="image">🖼️ Image Figure URL (Cloudflare R2 / SVG)</option>
              <option value="audio">🔊 Audio Speech / TTS Prompt</option>
              <option value="explanation">💬 Solution Explanation / Hint</option>
            </select>
          </div>

          {/* Default Fill Value */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              Default Fill Value (For empty cells)
            </label>
            <input
              type="text"
              value={defaultValue}
              onChange={e => setDefaultValue(e.target.value)}
              placeholder="Optional default string or URL"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          {/* Quick Value Transformers (If editing existing column) */}
          {editingColumn && (
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '8px' }}>
                ⚡ Batch Transform Values in Column:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleTransform('uppercase')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>UPPERCASE</button>
                <button type="button" onClick={() => handleTransform('lowercase')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>lowercase</button>
                <button type="button" onClick={() => handleTransform('trim')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Trim Space</button>
                <button type="button" onClick={() => handleTransform('katex')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Enclose KaTeX ($x$)</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            {editingColumn && columns.length > 2 ? (
              <button type="button" onClick={handleDeleteColumn} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '9px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                🗑️ Delete Column
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '9px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
