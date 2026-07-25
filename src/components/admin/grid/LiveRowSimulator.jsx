'use client';

import React, { useState } from 'react';
import PartRenderer from '@/components/practice/PartRenderer';
import { speakText } from '@/lib/ttsClient';

export default function LiveRowSimulator({
  activeRowIndex,
  setActiveRowIndex,
  rows,
  columns,
  evaluatedQuestionText,
  evaluatedParts,
  evaluatedOptions,
  blueprint
}) {
  const [selectedOptId, setSelectedOptId] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null);

  const currentRow = rows[activeRowIndex] || {};

  const handleOptionClick = (opt) => {
    setSelectedOptId(opt.id);
    if (opt.audioUrl) {
      speakText(opt.audioUrl);
    } else if (opt.label) {
      speakText(opt.label);
    }

    if (opt.isCorrect) {
      setFeedbackState({ type: 'correct', message: '🎉 Correct Answer!' });
    } else {
      setFeedbackState({
        type: 'incorrect',
        message: opt.misconception ? `❌ Incorrect: ${opt.misconception}` : '❌ Incorrect choice'
      });
    }
  };

  return (
    <div style={{ position: 'sticky', top: '20px' }}>
      <div className="grid-card" style={{ background: '#090d16', border: '1.5px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="grid-card-title" style={{ margin: 0, color: '#f8fafc' }}>
              👁️ Live Row Simulator
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Row {activeRowIndex + 1} of {rows.length} ({currentRow._level ? currentRow._level.toUpperCase() : 'L1'})
            </span>
          </div>

          {/* Row Pager */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              disabled={activeRowIndex <= 0}
              onClick={() => {
                setActiveRowIndex(prev => Math.max(0, prev - 1));
                setSelectedOptId(null);
                setFeedbackState(null);
              }}
              style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', opacity: activeRowIndex <= 0 ? 0.4 : 1 }}
            >
              ◀ Prev
            </button>
            <button
              type="button"
              disabled={activeRowIndex >= rows.length - 1}
              onClick={() => {
                setActiveRowIndex(prev => Math.min(rows.length - 1, prev + 1));
                setSelectedOptId(null);
                setFeedbackState(null);
              }}
              style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', opacity: activeRowIndex >= rows.length - 1 ? 0.4 : 1 }}
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Mascot Speech Bubble & Prompt */}
        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 800, marginBottom: '6px' }}>
            💬 Prompt Text:
          </div>
          <div style={{ color: '#f8fafc', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {evaluatedQuestionText || blueprint || 'No prompt evaluated.'}
          </div>
        </div>

        {/* Evaluated Parts Render */}
        {evaluatedParts && evaluatedParts.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {evaluatedParts.map((part, idx) => (
              <PartRenderer key={idx} part={part} index={idx} />
            ))}
          </div>
        )}

        {/* Option Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
            Answer Choices:
          </div>
          {evaluatedOptions.map((opt, idx) => {
            const isSelected = selectedOptId === opt.id;
            return (
              <button
                key={opt.id || idx}
                onClick={() => handleOptionClick(opt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                  background: isSelected ? '#0f172a' : '#1e293b',
                  color: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{opt.label || `Choice ${idx + 1}`}</span>
                {isSelected && (opt.isCorrect ? '✅' : '❌')}
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {feedbackState && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              background: feedbackState.type === 'correct' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: feedbackState.type === 'correct' ? '#10b981' : '#ef4444',
              border: feedbackState.type === 'correct' ? '1px solid #10b981' : '1px solid #ef4444'
            }}
          >
            {feedbackState.message}
          </div>
        )}
      </div>
    </div>
  );
}
