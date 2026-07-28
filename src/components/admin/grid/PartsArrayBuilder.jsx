'use client';

import React, { useMemo } from 'react';
import { findAudioColumn, findImageColumn } from '@/lib/grid/gridColumnUtils';

export default function PartsArrayBuilder({
  customPartsText,
  setCustomPartsText,
  isPartsRawJsonMode,
  setIsPartsRawJsonMode,
  columns = []
}) {
  const currentArr = useMemo(() => {
    if (!customPartsText || !customPartsText.trim()) return [];
    try {
      const arr = JSON.parse(customPartsText);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }, [customPartsText]);

  const updateArr = (nextArr) => {
    setCustomPartsText(nextArr.length > 0 ? JSON.stringify(nextArr, null, 2) : '');
  };

  const handleAutoBuildAudioText = () => {
    const audioCol = findAudioColumn(columns);
    const newParts = [
      { type: 'text', content: 'Click on the button. Then, answer the question.' },
      { type: 'audio', content: audioCol ? `[${audioCol}]` : '[target_audio]' }
    ];
    updateArr(newParts);
  };

  const handleAutoSyncAllImageColumns = () => {
    const audioCol = findAudioColumn(columns);
    const imgCols = columns.filter(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('img') || c.toLowerCase().includes('pic'));
    const newParts = [
      { type: 'text', content: 'Click on the button. Then, answer the question.' }
    ];
    if (audioCol) {
      newParts.push({ type: 'audio', content: `[${audioCol}]` });
    }
    if (imgCols.length > 0) {
      imgCols.forEach(col => {
        newParts.push({ type: 'image', content: `[${col}]`, maxWidth: 140, showSpeaker: false });
      });
    } else {
      newParts.push({ type: 'image', content: '[target_image]', maxWidth: 140, showSpeaker: false });
    }
    updateArr(newParts);
  };

  const handleAutoBuild2x2Grid = () => {
    const audioCol = findAudioColumn(columns);
    const imgCols = columns.filter(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('img') || c.toLowerCase().includes('pic'));
    const newParts = [
      { type: 'text', content: 'Click on the button. Then, answer the question.' }
    ];
    if (audioCol) {
      newParts.push({ type: 'audio', content: `[${audioCol}]` });
    }
    const gridImageParts = (imgCols.length > 0 ? imgCols : ['target_image']).map(col => ({
      type: 'image',
      content: `[${col}]`,
      maxWidth: 160,
      showSpeaker: false
    }));

    newParts.push({
      type: 'row',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '14px',
        maxWidth: '380px',
        margin: '12px auto'
      },
      parts: gridImageParts
    });

    updateArr(newParts);
  };

  const handleAutoBuildHorizontalRow = () => {
    const audioCol = findAudioColumn(columns);
    const imgCols = columns.filter(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('img') || c.toLowerCase().includes('pic'));
    const newParts = [
      { type: 'text', content: 'Click on the button. Then, answer the question.' }
    ];
    if (audioCol) {
      newParts.push({ type: 'audio', content: `[${audioCol}]` });
    }
    const rowImageParts = (imgCols.length > 0 ? imgCols : ['target_image']).map(col => ({
      type: 'image',
      content: `[${col}]`,
      maxWidth: 130,
      showSpeaker: false
    }));

    newParts.push({
      type: 'row',
      style: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        margin: '12px 0'
      },
      parts: rowImageParts
    });

    updateArr(newParts);
  };

  const is2x2GridActive = currentArr.some(p => p.type === 'row' && p.style?.display === 'grid');
  const isRowLayoutActive = currentArr.some(p => p.type === 'row' && (p.style?.display === 'flex' || !p.style?.display));
  const isAutoSyncActive = currentArr.every(p => p.type !== 'row') && currentArr.filter(p => p.type === 'image').length >= 2;

  return (
    <div style={{ marginTop: '20px', padding: '16px', background: '#0f172a', borderRadius: '12px', border: '1.5px solid #1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <label className="mc-dev-label" style={{ color: '#f8fafc', fontSize: '13px', margin: 0 }}>
            🧩 Question Prompt Parts Array Builder
          </label>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
            Manually add or order text, audio, and image parts in sequence.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAutoBuild2x2Grid}
            style={{
              background: is2x2GridActive ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: is2x2GridActive ? '2px solid #4ade80' : 'none',
              boxShadow: is2x2GridActive ? '0 0 12px rgba(74, 222, 128, 0.4)' : 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Arrange all spreadsheet images into a compact 2x2 grid layout"
          >
            {is2x2GridActive ? '✓ 🔲 2x2 Grid (Active)' : '🔲 2x2 Grid'}
          </button>
          <button
            type="button"
            onClick={handleAutoBuildHorizontalRow}
            style={{
              background: isRowLayoutActive ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: isRowLayoutActive ? '2px solid #4ade80' : 'none',
              boxShadow: isRowLayoutActive ? '0 0 12px rgba(74, 222, 128, 0.4)' : 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Arrange all spreadsheet images into a horizontal row layout"
          >
            {isRowLayoutActive ? '✓ ↔️ Row Layout (Active)' : '↔️ Row Layout'}
          </button>
          <button
            type="button"
            onClick={handleAutoSyncAllImageColumns}
            style={{
              background: isAutoSyncActive ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)' : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
              color: '#ffffff',
              border: isAutoSyncActive ? '2px solid #4ade80' : 'none',
              boxShadow: isAutoSyncActive ? '0 0 12px rgba(74, 222, 128, 0.4)' : 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Auto-detect all image columns in spreadsheet and add them to prompt parts"
          >
            {isAutoSyncActive ? '✓ 🖼️ Vertical List (Active)' : `🖼️ Vertical List (${columns.filter(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('img') || c.toLowerCase().includes('pic')).length})`}
          </button>
          <button
            type="button"
            onClick={handleAutoBuildAudioText}
            style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
          >
            ✨ Audio+Text
          </button>
          <button
            type="button"
            onClick={() => setIsPartsRawJsonMode(!isPartsRawJsonMode)}
            style={{ background: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            {isPartsRawJsonMode ? '🎨 Visual Builder' : '💻 Raw JSON'}
          </button>
        </div>
      </div>

      {isPartsRawJsonMode ? (
        <textarea
          className="grid-textarea"
          style={{ minHeight: '130px', fontFamily: 'Courier, monospace', fontSize: '0.8rem', background: '#020617', color: '#38bdf8' }}
          value={customPartsText}
          onChange={(e) => setCustomPartsText(e.target.value)}
          placeholder='e.g. [{"type": "text", "content": "Instruction..."}, {"type": "audio", "content": "[target_audio]"}]'
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentArr.length === 0 && (
            <div style={{ padding: '14px', background: '#1e293b', borderRadius: '8px', border: '1px dashed #475569', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
              No custom parts set yet. Click below to add Text, Audio, or Image parts to your prompt!
            </div>
          )}

          {currentArr.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: p.type === 'audio' ? '#38bdf8' : (p.type === 'image' ? '#a855f7' : (p.type === 'row' ? '#60a5fa' : '#f59e0b')), background: '#0f172a', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  #{idx + 1} {p.type || 'text'}
                </span>

                {/* Type dropdown */}
                <select
                  value={p.type || 'text'}
                  onChange={(e) => {
                    const copy = [...currentArr];
                    copy[idx] = { ...copy[idx], type: e.target.value };
                    updateArr(copy);
                  }}
                  style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}
                >
                  <option value="text">📝 Text</option>
                  <option value="audio">🔊 Audio</option>
                  <option value="image">🖼️ Image</option>
                  <option value="video">🎥 Video / Animation</option>
                  <option value="row">↔️ Row / Grid Group</option>
                  <option value="play_sound_card">🎵 Play Sound Card</option>
                </select>

                {p.type !== 'row' && p.type !== 'grid' && (
                  <>
                    <input
                      type="text"
                      value={p.content || ''}
                      onChange={(e) => {
                        const copy = [...currentArr];
                        copy[idx] = { ...copy[idx], content: e.target.value };
                        updateArr(copy);
                      }}
                      placeholder={p.type === 'audio' ? '[target_audio]' : (p.type === 'image' ? '[qn_image]' : 'Part text content...')}
                      style={{ flex: 1, minWidth: '180px', background: '#0f172a', color: '#f8fafc', border: '1px solid #475569', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}
                    />

                    <select
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const copy = [...currentArr];
                        copy[idx] = { ...copy[idx], content: `[${e.target.value}]` };
                        updateArr(copy);
                        e.target.value = '';
                      }}
                      style={{ background: '#020617', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '4px 6px', fontSize: '11px' }}
                    >
                      <option value="">Insert Col...</option>
                      {columns.map(c => <option key={c} value={c}>[{c}]</option>)}
                    </select>
                  </>
                )}

                {/* Reorder and Delete buttons */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...currentArr];
                        const temp = copy[idx - 1];
                        copy[idx - 1] = copy[idx];
                        copy[idx] = temp;
                        updateArr(copy);
                      }}
                      style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      ↑
                    </button>
                  )}
                  {idx < currentArr.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...currentArr];
                        const temp = copy[idx + 1];
                        copy[idx + 1] = copy[idx];
                        copy[idx] = temp;
                        updateArr(copy);
                      }}
                      style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      ↓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const copy = currentArr.filter((_, i) => i !== idx);
                      updateArr(copy);
                    }}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 7px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Container sub-parts builder for row/grid types */}
              {(p.type === 'row' || p.type === 'grid') && (
                <div style={{ width: '100%', padding: '10px', background: '#090d16', borderRadius: '6px', border: '1px solid #2563eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#60a5fa' }}>
                      📦 {p.style?.display === 'grid' ? '🔲 2x2 Grid Group' : '↔️ Horizontal Row Group'} ({ (p.parts || []).length } Image Sub-Parts)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...currentArr];
                        const childParts = [...(copy[idx].parts || [])];
                        childParts.push({ type: 'image', content: '[target_image]', maxWidth: 140, showSpeaker: false });
                        copy[idx] = { ...copy[idx], parts: childParts };
                        updateArr(copy);
                      }}
                      style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + Add Image Sub-Part
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(p.parts || []).map((cp, cIdx) => (
                      <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '10px', color: '#a855f7', fontWeight: 800 }}>
                          Sub #{cIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={cp.content || ''}
                          onChange={(e) => {
                            const copy = [...currentArr];
                            const childParts = [...(copy[idx].parts || [])];
                            childParts[cIdx] = { ...childParts[cIdx], content: e.target.value };
                            copy[idx] = { ...copy[idx], parts: childParts };
                            updateArr(copy);
                          }}
                          placeholder="[object_1_image_url]"
                          style={{ flex: 1, background: '#0f172a', color: '#f8fafc', border: '1px solid #475569', borderRadius: '4px', padding: '3px 8px', fontSize: '11px' }}
                        />
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const copy = [...currentArr];
                            const childParts = [...(copy[idx].parts || [])];
                            childParts[cIdx] = { ...childParts[cIdx], content: `[${e.target.value}]` };
                            copy[idx] = { ...copy[idx], parts: childParts };
                            updateArr(copy);
                            e.target.value = '';
                          }}
                          style={{ background: '#020617', color: '#94a3b8', border: '1px solid #334155', borderRadius: '4px', padding: '3px 6px', fontSize: '10px' }}
                        >
                          <option value="">Insert Col...</option>
                          {columns.map(c => <option key={c} value={c}>[{c}]</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...currentArr];
                            const childParts = (copy[idx].parts || []).filter((_, i) => i !== cIdx);
                            copy[idx] = { ...copy[idx], parts: childParts };
                            updateArr(copy);
                          }}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Part Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                updateArr([...currentArr, { type: 'text', content: 'Click on the button. Then, answer the question.' }]);
              }}
              style={{ background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
            >
              ➕ Add Text Part
            </button>
            <button
              type="button"
              onClick={() => {
                const audioCol = findAudioColumn(columns);
                updateArr([...currentArr, { type: 'audio', content: audioCol ? `[${audioCol}]` : '[target_audio]' }]);
              }}
              style={{ background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
            >
              ➕ Add Audio Part
            </button>
            <button
              type="button"
              onClick={() => {
                const imageCol = findImageColumn(columns);
                updateArr([...currentArr, { type: 'image', content: imageCol ? `[${imageCol}]` : '[qn_image]' }]);
              }}
              style={{ background: '#9333ea', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
            >
              ➕ Add Image Part
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
