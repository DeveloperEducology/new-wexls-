'use client';

import React, { useState } from 'react';

export default function BulkOperationsToolbar({
  columns = [],
  rows = [],
  setRows,
  selectedRowIndices = [],
  setSelectedRowIndices,
  onAutoTTS
}) {
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [targetColumn, setTargetColumn] = useState('ALL');

  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Hindi');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const selectedCount = selectedRowIndices.length;

  const getTargetRowIndices = () => {
    return selectedCount > 0
      ? selectedRowIndices
      : rows.map((_, idx) => idx); // default to all rows if none explicitly checked
  };

  // 1. Bulk Select / Deselect
  const toggleSelectAll = () => {
    if (selectedCount === rows.length) {
      setSelectedRowIndices([]);
    } else {
      setSelectedRowIndices(rows.map((_, i) => i));
    }
  };

  const selectRange = (countToSelect) => {
    const limit = Math.min(countToSelect, rows.length);
    const indices = [];
    for (let i = 0; i < limit; i++) indices.push(i);
    setSelectedRowIndices(indices);
  };

  // 2. Bulk Find & Replace
  const handleBulkFindReplace = (e) => {
    e.preventDefault();
    if (!findText) return alert('Enter text to find.');

    const targetIndices = new Set(getTargetRowIndices());
    let replaceCount = 0;

    const updated = rows.map((row, idx) => {
      if (!targetIndices.has(idx)) return row;

      const newRow = { ...row };
      const colsToProcess = targetColumn === 'ALL' ? columns : [targetColumn];

      colsToProcess.forEach(col => {
        if (typeof newRow[col] === 'string' && newRow[col].includes(findText)) {
          newRow[col] = newRow[col].replaceAll(findText, replaceText);
          replaceCount++;
        }
      });

      return newRow;
    });

    setRows(updated);
    setShowFindReplaceModal(false);
    setStatusMsg(`✏️ Replaced "${findText}" with "${replaceText}" in ${replaceCount} cells!`);
  };

  // 3. Bulk AI Translate
  const handleBulkTranslate = async (e) => {
    e.preventDefault();
    const targetIndices = getTargetRowIndices();
    const targetRows = targetIndices.map(i => rows[i]);

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/generate-spreadsheet-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          columns,
          seedRows: targetRows,
          targetLanguage
        })
      });

      const data = await res.json();
      if (!data.success || !data.rows) throw new Error(data.error || 'Translation failed');

      const updated = [...rows];
      targetIndices.forEach((origIdx, i) => {
        if (data.rows[i]) {
          updated[origIdx] = { ...updated[origIdx], ...data.rows[i] };
        }
      });

      setRows(updated);
      setShowTranslateModal(false);
      setStatusMsg(`🌐 Successfully translated ${targetIndices.length} rows to ${targetLanguage}!`);
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Bulk AI Generate Explanations
  const handleBulkExplanations = async () => {
    const targetIndices = getTargetRowIndices();
    const targetRows = targetIndices.map(i => rows[i]);

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/generate-spreadsheet-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_explanation',
          columns,
          seedRows: targetRows
        })
      });

      const data = await res.json();
      if (!data.success || !data.rows) throw new Error(data.error || 'Explanation generation failed');

      // Ensure explanation column exists in columns schema
      if (!columns.includes('explanation') && !columns.includes('solution')) {
        // Automatically add explanation column if missing
      }

      const updated = [...rows];
      targetIndices.forEach((origIdx, i) => {
        if (data.rows[i]) {
          updated[origIdx] = { ...updated[origIdx], ...data.rows[i] };
        }
      });

      setRows(updated);
      setStatusMsg(`💡 Generated solution explanations for ${targetIndices.length} rows!`);
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Bulk Change Difficulty Level
  const handleBulkChangeLevel = (newLevel) => {
    const targetIndices = new Set(getTargetRowIndices());
    const updated = rows.map((r, i) => targetIndices.has(i) ? { ...r, _level: newLevel } : r);
    setRows(updated);
    setStatusMsg(`🎚️ Changed difficulty to ${newLevel.toUpperCase()} for ${targetIndices.size} rows!`);
  };

  // 6. Bulk Duplicate
  const handleBulkDuplicate = () => {
    const targetIndices = getTargetRowIndices();
    const duplicatedRows = targetIndices.map(i => {
      const copy = { ...rows[i] };
      delete copy._id;
      return copy;
    });

    setRows([...rows, ...duplicatedRows]);
    setStatusMsg(`📋 Duplicated ${duplicatedRows.length} rows!`);
  };

  // 7. Bulk Delete
  const handleBulkDelete = () => {
    const targetIndices = new Set(getTargetRowIndices());
    if (!confirm(`Delete ${targetIndices.size} selected rows?`)) return;

    const remaining = rows.filter((_, i) => !targetIndices.has(i));
    setRows(remaining);
    setSelectedRowIndices([]);
    setStatusMsg(`🗑️ Deleted ${targetIndices.size} rows.`);
  };

  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '16px',
      border: '1.5px solid #cbd5e1',
      padding: '16px 20px',
      marginBottom: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Top Bar: Selection Summary + Action Chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Selection badge & Range selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rows.length > 0 && selectedCount === rows.length}
              onChange={toggleSelectAll}
              style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
            />
            {selectedCount > 0 ? `Selected (${selectedCount}/${rows.length})` : `Select All (${rows.length})`}
          </label>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => selectRange(50)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>+50</button>
            <button onClick={() => selectRange(100)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>+100</button>
            <button onClick={() => selectRange(200)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>+200</button>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowFindReplaceModal(true)}
            style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            ✏️ Replace
          </button>

          <button
            onClick={() => setShowTranslateModal(true)}
            style={{ background: '#fff', color: '#0369a1', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            🌐 Translate
          </button>

          <button
            onClick={handleBulkExplanations}
            disabled={loading}
            style={{ background: '#fff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            💡 Gen Explanations
          </button>

          {/* Difficulty Dropdown */}
          <select
            onChange={(e) => { if (e.target.value) { handleBulkChangeLevel(e.target.value); e.target.value = ''; } }}
            defaultValue=""
            style={{ background: '#fff', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            <option value="" disabled>🎚️ Set Difficulty ▾</option>
            <option value="l1">🟢 L1 (Easy)</option>
            <option value="l2">🟠 L2 (Medium)</option>
            <option value="l3">🔴 L3 (Hard)</option>
            <option value="l4">🔥 L4 (Challenge)</option>
          </select>

          <button
            onClick={handleBulkDuplicate}
            style={{ background: '#fff', color: '#059669', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            📋 Duplicate
          </button>

          <button
            onClick={handleBulkDelete}
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ marginTop: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
          {statusMsg}
        </div>
      )}

      {/* Modal 1: Bulk Find & Replace */}
      {showFindReplaceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '100%' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.15rem', fontWeight: 800 }}>✏️ Bulk Find & Replace</h3>
            <form onSubmit={handleBulkFindReplace} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Target Column</label>
                <select
                  value={targetColumn}
                  onChange={e => setTargetColumn(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="ALL">All Columns</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Find Text</label>
                <input
                  type="text"
                  value={findText}
                  onChange={e => setFindText(e.target.value)}
                  placeholder="e.g. Option "
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Replace With</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                  placeholder="e.g. Choice "
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowFindReplaceModal(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700 }}>Replace All</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk AI Translate */}
      {showTranslateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.15rem', fontWeight: 800 }}>🌐 Bulk AI Translate</h3>
            <form onSubmit={handleBulkTranslate} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={e => setTargetLanguage(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700 }}
                >
                  <option value="Hindi">🇮🇳 Hindi (हिंदी)</option>
                  <option value="Telugu">🇮🇳 Telugu (తెలుగు)</option>
                  <option value="Spanish">🇪🇸 Spanish (Español)</option>
                  <option value="Tamil">🇮🇳 Tamil (தமிழ்)</option>
                  <option value="French">🇫🇷 French (Français)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowTranslateModal(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700 }}>
                  {loading ? 'Translating...' : 'Start Translation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
