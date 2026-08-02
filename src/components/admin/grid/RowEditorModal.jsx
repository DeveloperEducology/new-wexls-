'use client';

import React, { useState, useEffect } from 'react';
import ImageCropperModal from './ImageCropperModal';
import ImageGalleryModal from './ImageGalleryModal';
import SingleQuestionCropperModal from './SingleQuestionCropperModal';

const LEVEL_CONFIG = {
  l1: { label: 'L1 Easy', emoji: '🟢', color: '#10b981' },
  l2: { label: 'L2 Medium', emoji: '🟠', color: '#f59e0b' },
  l3: { label: 'L3 Hard', emoji: '🔴', color: '#ef4444' },
  l4: { label: 'L4 Challenge', emoji: '🔥', color: '#8b5cf6' }
};

export default function RowEditorModal({
  isOpen,
  onClose,
  rowIndex = null,
  rows = [],
  setRows,
  columns = [],
  blueprint = '',
  optionsBinding = []
}) {
  const [editedRow, setEditedRow] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState(null);

  // 5-Box Single Question Cropper State
  const [is5BoxCropperOpen, setIs5BoxCropperOpen] = useState(false);

  const handleApply5Crops = (crops) => {
    setEditedRow(prev => ({
      ...prev,
      questionImage: crops.questionImage || prev.questionImage || '',
      optionAImage: crops.optionAImage || prev.optionAImage || '',
      optionBImage: crops.optionBImage || prev.optionBImage || '',
      optionCImage: crops.optionCImage || prev.optionCImage || '',
      optionDImage: crops.optionDImage || prev.optionDImage || '',
      optionA: prev.optionA || 'Figure 1',
      optionB: prev.optionB || 'Figure 2',
      optionC: prev.optionC || 'Figure 3',
      optionD: prev.optionD || 'Figure 4'
    }));
  };

  // Cropper Modal State
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: '',
    targetField: ''
  });

  // Gallery Modal State
  const [galleryState, setGalleryState] = useState({
    isOpen: false,
    targetField: ''
  });

  useEffect(() => {
    if (rowIndex !== null && rows[rowIndex]) {
      setEditedRow({ ...rows[rowIndex] });
    } else {
      setEditedRow(null);
    }
  }, [rowIndex, rows]);

  if (!isOpen || rowIndex === null || !editedRow) return null;

  const handleFieldChange = (colKey, value) => {
    setEditedRow(prev => ({ ...prev, [colKey]: value }));
  };

  const handleSave = () => {
    const updated = [...rows];
    updated[rowIndex] = editedRow;

    // Auto-discover and append any new image/data columns to grid columns
    const newKeys = Object.keys(editedRow).filter(k => !k.startsWith('_') && !columns.includes(k));
    if (newKeys.length > 0 && typeof setColumns === 'function') {
      setColumns(prev => [...prev, ...newKeys]);
    }

    setRows(updated);
    onClose();
  };

  const handleAiFixRow = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/admin/generate-spreadsheet-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade_distractors',
          columns,
          seedRows: [editedRow]
        })
      });
      const data = await res.json();
      if (data.success && data.rows && data.rows[0]) {
        setEditedRow(data.rows[0]);
      }
    } catch (err) {
      console.error('AI upgrade error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Trigger Image Cropper Modal for Selected File
  const handleSelectFileForCropper = (file, targetField) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperState({
        isOpen: true,
        imageSrc: e.target.result,
        targetField
      });
    };
    reader.readAsDataURL(file);
  };

  // Direct Upload without Cropping
  const handleFileUpload = async (file, targetField) => {
    if (!file) return;
    setUploadingTarget(targetField);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'jnvst-questions');

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success || data.url) {
        const imageUrl = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url);
        handleFieldChange(targetField, imageUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => handleFieldChange(targetField, e.target.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Upload API fallback to data URL:', err);
      const reader = new FileReader();
      reader.onload = (e) => handleFieldChange(targetField, e.target.result);
      reader.readAsDataURL(file);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handlePrevRow = () => {
    if (rowIndex > 0) {
      const updated = [...rows];
      updated[rowIndex] = editedRow;
      setRows(updated);
      setEditedRow({ ...rows[rowIndex - 1] });
    }
  };

  const handleNextRow = () => {
    if (rowIndex < rows.length - 1) {
      const updated = [...rows];
      updated[rowIndex] = editedRow;
      setRows(updated);
      setEditedRow({ ...rows[rowIndex + 1] });
    }
  };

  // Classify Columns into Smart Layout Groups
  const isMetaCol = (c) => /^(section|sectionName|qNumber|grade|topic|subject|tags|isPYQ|pyqYear|examId|id)$/i.test(c);
  const isTextCol = (c) => /^(questionText|target_word|number_to_factor|prompt|title|stem|question)$/i.test(c);
  const isImageCol = (c) => /^(questionImage|target_image|figure_image|image_url|image|diagram)$/i.test(c);
  const isAnswerOrExplanation = (c) => /^(answer|correctOption|correct_answer|ExplanationText|explanation|solution)$/i.test(c);
  const isOptionCol = (c) => /^(option[A-D]|Result|Distractor[1-3]|distractor_[1-3]|option[1-4])$/i.test(c) || /option|distractor|choice/i.test(c);

  const metaCols = columns.filter(isMetaCol);
  const textCols = columns.filter(isTextCol);
  const imageCols = columns.filter(isImageCol);
  const answerCols = columns.filter(isAnswerOrExplanation);
  const optionCols = columns.filter(c => isOptionCol(c) && !isAnswerOrExplanation(c));

  const usedCols = new Set([...metaCols, ...textCols, ...imageCols, ...answerCols, ...optionCols]);
  const extraCols = columns.filter(c => !usedCols.has(c));

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px'
      }}>
        <div style={{
          background: '#ffffff', borderRadius: '24px', maxWidth: '820px', width: '100%',
          maxHeight: '92vh', overflowY: 'auto', padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          border: '1px solid #e2e8f0', fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Edit Row #{rowIndex + 1} (Form View)
              </h3>
              <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
                {rows.length} Total Rows
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handlePrevRow}
                disabled={rowIndex === 0}
                style={{
                  background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px',
                  fontWeight: 800, fontSize: '0.82rem', cursor: rowIndex === 0 ? 'not-allowed' : 'pointer', color: '#334155'
                }}
              >
                ◀ Prev Row
              </button>
              <button
                onClick={handleNextRow}
                disabled={rowIndex >= rows.length - 1}
                style={{
                  background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px',
                  fontWeight: 800, fontSize: '0.82rem', cursor: rowIndex >= rows.length - 1 ? 'not-allowed' : 'pointer', color: '#334155'
                }}
              >
                Next Row ▶
              </button>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', marginLeft: '6px' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Difficulty Level Selector */}
          <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎚️ Question Difficulty Level:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Object.keys(LEVEL_CONFIG).map(lvlKey => {
                const lvl = LEVEL_CONFIG[lvlKey];
                const isSelected = (editedRow._level || 'l1') === lvlKey;
                return (
                  <button
                    key={lvlKey}
                    type="button"
                    onClick={() => setEditedRow(prev => ({ ...prev, _level: lvlKey }))}
                    style={{
                      background: isSelected ? lvl.color : '#fff',
                      color: isSelected ? '#fff' : '#475569',
                      border: `1px solid ${isSelected ? lvl.color : '#cbd5e1'}`,
                      padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                      boxShadow: isSelected ? `0 4px 10px ${lvl.color}40` : 'none'
                    }}
                  >
                    {lvl.emoji} {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORM BODY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Section 1: Metadata Fields Top Grid */}
            {metaCols.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metaCols.length, 3)}, 1fr)`, gap: '12px' }}>
                {metaCols.map(col => (
                  <div key={col}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      {col}
                    </label>
                    <input
                      type="text"
                      value={editedRow[col] || ''}
                      onChange={e => handleFieldChange(col, e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Section 2: Question Text / Prompt Textarea */}
            {textCols.map(col => (
              <div key={col}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Question Text (KaTeX &amp; SVG Enabled)
                </label>
                <textarea
                  rows={3}
                  value={editedRow[col] || ''}
                  onChange={e => handleFieldChange(col, e.target.value)}
                  placeholder="Enter question text or KaTeX formula e.g. What is $\frac{13}{4}$? or <svg>..."
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem', fontFamily: 'inherit' }}
                />
              </div>
            ))}

            {/* Section 3: Question Figure Image (Upload & Crop Card) */}
            {(imageCols.length > 0 ? imageCols : ['questionImage']).map(col => {
              const imgVal = editedRow[col] || '';

              return (
                <div key={col} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    🖼️ Question Figure Image (Crop &amp; Upload to R2 Storage)
                  </label>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="R2 Storage Path URL e.g. https://.../jnvst-questions/q1.png"
                      value={imgVal}
                      onChange={e => handleFieldChange(col, e.target.value)}
                      style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                    />

                    {/* 5-Box Multi-Crop Button */}
                    <button
                      type="button"
                      onClick={() => setIs5BoxCropperOpen(true)}
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 900, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(99, 102, 241, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      🎯 5-Box Multi-Crop (Question + A,B,C,D)
                    </button>

                    {/* Crop & Upload Button */}
                    <label style={{ background: '#10b981', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      ✂️ Crop &amp; Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleSelectFileForCropper(e.target.files[0], col)}
                      />
                    </label>

                    {/* Direct Upload Button */}
                    <label style={{ background: '#4338ca', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploadingTarget === col ? 'Uploading...' : '📁 Direct Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e.target.files[0], col)}
                      />
                    </label>

                    {/* Gallery Button */}
                    <button
                      type="button"
                      onClick={() => setGalleryState({ isOpen: true, targetField: col })}
                      style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      🖼️ Gallery
                    </button>
                  </div>

                  {imgVal && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={imgVal} alt="Question figure preview" style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <button
                        type="button"
                        onClick={() => handleFieldChange(col, '')}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Section 4: 2x2 Options Grid Cards */}
            {optionCols.length > 0 && (
              <div>
                <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  🎯 Answer Options &amp; Distractors
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {optionCols.map(col => {
                    const lower = col.toLowerCase();
                    const val = editedRow[col] || '';

                    // Dynamically determine current answer key (A, B, C, or D)
                    const currentAnsKey = String(
                      editedRow.answer || editedRow.correctOption || editedRow.correct || editedRow.Answer || 'A'
                    ).trim().toUpperCase();

                    // Determine which option letter this column corresponds to
                    let optLetter = col.replace(/option/i, '').replace(/distractor/i, '').trim().toUpperCase();
                    if (optLetter === '1' || optLetter === 'RESULT') optLetter = 'A';
                    if (optLetter === '2') optLetter = 'B';
                    if (optLetter === '3') optLetter = 'C';
                    if (optLetter === '4') optLetter = 'D';

                    const isResult = (currentAnsKey === optLetter) || (currentAnsKey === String(val).trim().toUpperCase());

                    // Optional Image property if available
                    const imgColName = `${col}Image`;
                    const imgVal = editedRow[imgColName] || '';

                    return (
                      <div
                        key={col}
                        style={{
                          background: isResult ? '#f0fdf4' : '#f8fafc',
                          padding: '14px', borderRadius: '14px',
                          border: `1.5px solid ${isResult ? '#bbf7d0' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>{col} {optLetter ? `(${optLetter})` : ''}</span>
                          {isResult ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', border: '1px solid #86efac' }}>
                              🎯 Correct Answer
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>
                              🎲 Distractor
                            </span>
                          )}
                        </label>

                        <input
                          type="text"
                          placeholder={`${col} Text or <svg>...`}
                          value={val}
                          onChange={e => handleFieldChange(col, e.target.value)}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                            border: '1px solid #cbd5e1', fontSize: '0.9rem', marginBottom: '8px',
                            background: '#ffffff'
                          }}
                        />

                        {/* Image Input for Option */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Image R2 URL (optional)"
                            value={imgVal}
                            onChange={e => handleFieldChange(imgColName, e.target.value)}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                          />

                          {/* Crop Button */}
                          <label style={{ background: '#10b981', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            ✂️ Crop
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleSelectFileForCropper(e.target.files[0], imgColName)}
                            />
                          </label>

                          {/* Direct File Button */}
                          <label style={{ background: '#64748b', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            📁 File
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleFileUpload(e.target.files[0], imgColName)}
                            />
                          </label>

                          {/* Gallery Button */}
                          <button
                            type="button"
                            onClick={() => setGalleryState({ isOpen: true, targetField: imgColName })}
                            style={{ background: '#0284c7', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            🖼️ Gallery
                          </button>
                        </div>

                        {imgVal && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={imgVal} alt={`${col}`} style={{ maxHeight: '50px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 5: Answer Key & Explanation */}
            {answerCols.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: answerCols.length > 1 ? '1fr 2fr' : '1fr', gap: '12px' }}>
                {answerCols.map(col => {
                  const lower = col.toLowerCase();
                  const isAnsKey = lower.includes('answer') || lower.includes('correctoption');

                  return (
                    <div key={col}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        {isAnsKey ? 'Correct Answer Key' : 'Solution Explanation'}
                      </label>

                      {isAnsKey ? (
                        <select
                          value={editedRow[col] || ''}
                          onChange={e => handleFieldChange(col, e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}
                        >
                          <option value="">Select Answer Key</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value={editedRow[col] || ''}>{editedRow[col] || 'Custom'}</option>
                        </select>
                      ) : (
                        <textarea
                          rows={2}
                          value={editedRow[col] || ''}
                          onChange={e => handleFieldChange(col, e.target.value)}
                          placeholder="Step-by-step answer explanation..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section 6: Extra Custom Columns */}
            {extraCols.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                {extraCols.map(col => (
                  <div key={col}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      {col}
                    </label>
                    <input
                      type="text"
                      value={editedRow[col] || ''}
                      onChange={e => handleFieldChange(col, e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* AI Helper Bar */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', padding: '14px 18px',
            borderRadius: '14px', marginTop: '24px', marginBottom: '24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
              🤖 AI Single-Row Enhancer
            </div>
            <button
              type="button"
              onClick={handleAiFixRow}
              disabled={loadingAi}
              style={{
                background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px',
                fontWeight: 800, fontSize: '0.82rem', cursor: loadingAi ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingAi ? 'Upgrading...' : '🧠 Upgrade Distractors with AI'}
            </button>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px',
                borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', color: '#475569'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px',
                borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              Save Row Changes
            </button>
          </div>

        </div>
      </div>

      {/* Interactive Image Cropper Modal */}
      {cropperState.isOpen && (
        <ImageCropperModal
          imageSrc={cropperState.imageSrc}
          onCropComplete={(croppedUrl) => {
            handleFieldChange(cropperState.targetField, croppedUrl);
            setCropperState({ isOpen: false, imageSrc: '', targetField: '' });
          }}
          onClose={() => setCropperState({ isOpen: false, imageSrc: '', targetField: '' })}
        />
      )}

      {/* R2 Image Gallery Modal */}
      {galleryState.isOpen && (
        <ImageGalleryModal
          isOpen={galleryState.isOpen}
          onClose={() => setGalleryState({ isOpen: false, targetField: '' })}
          onSelectImage={(selectedUrl) => {
            handleFieldChange(galleryState.targetField, selectedUrl);
            setGalleryState({ isOpen: false, targetField: '' });
          }}
        />
      )}

      {/* 5-Box Single Question Cropper Modal */}
      {is5BoxCropperOpen && (
        <SingleQuestionCropperModal
          isOpen={is5BoxCropperOpen}
          onClose={() => setIs5BoxCropperOpen(false)}
          initialImageSrc={editedRow.questionImage || ''}
          onApply5Crops={handleApply5Crops}
        />
      )}
    </>
  );
}
