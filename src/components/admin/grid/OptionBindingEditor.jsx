'use client';

import React from 'react';

export default function OptionBindingEditor({
  questionMode,
  setQuestionMode,
  optionsBinding,
  setOptionsBinding,
  columns,
  imageHasAudio,
  setImageHasAudio,
  imageIsTransparent,
  setImageIsTransparent,
  preserveOptionOrder,
  setPreserveOptionOrder,
  isSequential,
  setIsSequential,
  pairRemediationRows,
  setPairRemediationRows
}) {
  const imageCol = columns.find(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('clipart'));

  return (
    <div className="grid-card" style={{ marginTop: '20px' }}>
      <h3 className="grid-card-title">📝 Step 3: Map Answer Choices & Question Ordering</h3>
      <p className="grid-card-desc">Assign correct answers, distractor options, and index-wise ordering / remediation preferences.</p>

      {/* MCQ / MSQ / Mode toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Type:</span>
        <div style={{ display: 'flex', background: '#0f172a', borderRadius: '10px', border: '1.5px solid #334155', overflow: 'hidden' }}>
          {[
            ['mcq', '🔘 MCQ', 'Single correct answer'],
            ['msq', '☑️ MSQ', 'Multiple correct answers'],
            ['tap_to_fill', '✏️ Tap-to-Fill', 'Student taps option into a blank'],
            ['sentence_ordering', '🧩 Sentence / Word Ordering', 'Student arranges scrambled words or letters']
          ].map(([mode, label, hint]) => (
            <button
              key={mode}
              title={hint}
              onClick={() => {
                setQuestionMode(mode);
                if (mode === 'mcq') {
                  const firstCorrectIdx = optionsBinding.findIndex(o => o.isCorrect);
                  setOptionsBinding(prev => prev.map((o, i) => ({
                    ...o,
                    isCorrect: i === (firstCorrectIdx >= 0 ? firstCorrectIdx : 0)
                  })));
                }
              }}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: questionMode === mode ? '#38bdf8' : 'transparent',
                color: questionMode === mode ? '#0f172a' : '#94a3b8',
                transition: 'all 0.15s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Option & Question Ordering & Image Toggles */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '18px', padding: '12px 16px', background: '#0f172a', borderRadius: '8px', border: '1.5px solid #334155', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(preserveOptionOrder)}
            onChange={(e) => setPreserveOptionOrder?.(e.target.checked)}
          />
          🔢 Keep options index-wise (No random option shuffle)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(isSequential)}
            onChange={(e) => setIsSequential?.(e.target.checked)}
          />
          🔄 Keep questions index-wise (Sequential row-by-row)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(pairRemediationRows)}
            onChange={(e) => setPairRemediationRows?.(e.target.checked)}
          />
          💡 Auto-pair is_remediation rows as step-down scaffold questions on wrong answer
        </label>

        {imageCol && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f1f5f9', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={imageHasAudio}
                onChange={(e) => setImageHasAudio(e.target.checked)}
              />
              🔊 Play audio on image tap
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f1f5f9', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={imageIsTransparent}
                onChange={(e) => setImageIsTransparent(e.target.checked)}
              />
              ✨ Transparent clipart image background
            </label>
          </>
        )}
      </div>

      {/* Option Binding Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {optionsBinding.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: opt.isCorrect ? '#10b981' : '#f59e0b', minWidth: '70px' }}>
              Option #{idx + 1}
            </span>

            {/* Column Selector */}
            <select
              value={opt.column || ''}
              onChange={(e) => {
                const next = [...optionsBinding];
                next[idx] = { ...next[idx], column: e.target.value };
                setOptionsBinding(next);
              }}
              style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}
            >
              <option value="">Select Column...</option>
              {columns.map(c => (
                <option key={c} value={c}>Column: [{c}]</option>
              ))}
            </select>

            {/* Correct Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: opt.isCorrect ? '#10b981' : '#94a3b8', cursor: 'pointer' }}>
              <input
                type={questionMode === 'mcq' ? 'radio' : 'checkbox'}
                name="correctOption"
                checked={opt.isCorrect}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (questionMode === 'mcq') {
                    setOptionsBinding(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                  } else {
                    const next = [...optionsBinding];
                    next[idx] = { ...next[idx], isCorrect: checked };
                    setOptionsBinding(next);
                  }
                }}
              />
              {opt.isCorrect ? '✅ Correct Choice' : '❌ Distractor'}
            </label>

            {/* Misconception Input */}
            <input
              type="text"
              value={opt.misconception || ''}
              onChange={(e) => {
                const next = [...optionsBinding];
                next[idx] = { ...next[idx], misconception: e.target.value };
                setOptionsBinding(next);
              }}
              placeholder="Misconception tag (optional)"
              style={{ flex: 1, minWidth: '160px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }}
            />

            {/* Remove Option Button */}
            {optionsBinding.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  setOptionsBinding(optionsBinding.filter((_, i) => i !== idx));
                }}
                style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                🗑️ Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      <button
        type="button"
        onClick={() => {
          const unusedCol = columns.find(c => !optionsBinding.some(o => o.column === c)) || columns[0];
          setOptionsBinding([...optionsBinding, { column: unusedCol, isCorrect: false, misconception: '' }]);
        }}
        style={{ marginTop: '12px', background: '#334155', color: '#38bdf8', border: '1px dashed #38bdf8', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
      >
        ➕ Add Option Binding
      </button>
    </div>
  );
}
