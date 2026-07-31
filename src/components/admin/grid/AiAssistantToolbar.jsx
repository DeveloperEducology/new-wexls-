'use client';

import React, { useState } from 'react';

export default function AiAssistantToolbar({
  columns = [],
  rows = [],
  subject = '',
  topic = '',
  questionMode = '',
  onRowsAdded,
  onRowsReplaced
}) {
  const [promptText, setPromptText] = useState('');
  const [generateCount, setGenerateCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const runAiAction = async (actionType, customInstruction = '') => {
    if (columns.length === 0) return alert('No columns found in current spreadsheet schema.');
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/generate-spreadsheet-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          columns,
          seedRows: rows.slice(0, 10),
          count: generateCount,
          prompt: customInstruction || promptText,
          subject,
          topic,
          questionMode
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'AI generation failed');
      }

      if (data.rows && data.rows.length > 0) {
        if (actionType === 'upgrade_distractors') {
          if (onRowsReplaced) onRowsReplaced(data.rows);
          setStatusMessage({ type: 'success', text: `🧠 Upgraded distractors for ${data.rows.length} rows to misconception-based wrong answers!` });
        } else {
          if (onRowsAdded) onRowsAdded(data.rows);
          setStatusMessage({ type: 'success', text: `✨ Generated and added ${data.rows.length} new AI rows to the spreadsheet!` });
        }
        setPromptText('');
      } else {
        setStatusMessage({ type: 'error', text: 'No rows generated. Please try again.' });
      }
    } catch (err) {
      console.error('AI Assistant Error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to generate AI rows' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '24px',
      color: '#fff',
      boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.2)',
      border: '1px solid rgba(255,255,255,0.1)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)'
          }}>
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
              AI Author Assistant
              <span style={{ fontSize: '0.7rem', background: 'rgba(129, 140, 248, 0.2)', color: '#a5b4fc', border: '1px solid rgba(129, 140, 248, 0.4)', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                Gemini 2.5 Flash
              </span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Autonomously expand spreadsheet rows, generate misconception distractors, and balance difficulty.
            </p>
          </div>
        </div>

        {/* Count Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>Rows to generate:</span>
          <select
            value={generateCount}
            onChange={e => setGenerateCount(Number(e.target.value))}
            style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontWeight: 800, fontSize: '0.85rem' }}
          >
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={50}>50 Rows</option>
            <option value={100}>100 Rows</option>
          </select>
        </div>
      </div>

      {/* Preset Action Chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => runAiAction('expand_rows')}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px',
            fontWeight: 800, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            opacity: loading ? 0.7 : 1
          }}
        >
          🚀 Generate {generateCount} Similar Rows
        </button>

        <button
          onClick={() => runAiAction('upgrade_distractors')}
          disabled={loading || rows.length === 0}
          style={{
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px',
            fontWeight: 800, fontSize: '0.85rem', cursor: (loading || rows.length === 0) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
            opacity: (loading || rows.length === 0) ? 0.7 : 1
          }}
        >
          🧠 Upgrade Distractors to Misconceptions
        </button>

        <button
          onClick={() => runAiAction('custom_prompt', 'Ensure difficulty levels L1 to L4 are evenly balanced with distinct challenge tiers')}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          ⚖️ Auto-Balance L1–L4 Difficulty
        </button>
      </div>

      {/* Custom Prompt Input Bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          placeholder="✨ Or type custom instruction e.g. 'Generate 15 3-digit prime factorization rows' or 'Make distractors close values within 5%'"
          onKeyDown={e => { if (e.key === 'Enter' && promptText.trim() && !loading) runAiAction('custom_prompt'); }}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: '0.9rem', outline: 'none'
          }}
        />
        <button
          onClick={() => runAiAction('custom_prompt')}
          disabled={loading || !promptText.trim()}
          style={{
            background: promptText.trim() ? '#06b6d4' : '#334155',
            color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px',
            fontWeight: 800, fontSize: '0.9rem', cursor: (loading || !promptText.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Generating...' : 'Execute AI Prompt'}
        </button>
      </div>

      {/* Status Message / Loading Indicator */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', color: '#a5b4fc', fontSize: '0.88rem', fontWeight: 600 }}>
          <div style={{ width: '18px', height: '18px', border: '3px solid #818cf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Gemini AI is analyzing column schema and synthesizing educational question rows...</span>
        </div>
      )}

      {statusMessage && !loading && (
        <div style={{
          marginTop: '14px', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700,
          background: statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: statusMessage.type === 'success' ? '#4ade80' : '#f87171',
          border: statusMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
