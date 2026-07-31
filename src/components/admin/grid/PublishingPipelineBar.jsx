'use client';

import React, { useState } from 'react';

const STAGES = [
  { id: 'draft', label: 'Draft', icon: '📝', color: '#64748b', bg: '#f1f5f9' },
  { id: 'validate', label: 'Validation', icon: '🔍', color: '#0284c7', bg: '#e0f2fe' },
  { id: 'qa', label: 'QA Audit', icon: '🧪', color: '#7c3aed', bg: '#f3e8ff' },
  { id: 'approved', label: 'Approved', icon: '🟢', color: '#059669', bg: '#d1fae5' },
  { id: 'published', label: 'Published', icon: '🚀', color: '#16a34a', bg: '#dcfce7' },
  { id: 'archived', label: 'Archived', icon: '📦', color: '#475569', bg: '#f1f5f9' }
];

export default function PublishingPipelineBar({
  currentStatus = 'draft',
  onStatusChange,
  onSaveToDatabase,
  saving = false,
  healthScore = 100
}) {
  const [qaNotes, setQaNotes] = useState('');
  const [showQaModal, setShowQaModal] = useState(false);

  const getCurrentStageIndex = () => {
    const idx = STAGES.findIndex(s => s.id === currentStatus);
    return idx >= 0 ? idx : 0;
  };

  const currentIdx = getCurrentStageIndex();

  const handleNextStage = () => {
    if (currentStatus === 'draft') {
      onStatusChange('validate');
    } else if (currentStatus === 'validate') {
      if (healthScore < 75) {
        alert(`⚠️ Dataset Health Score is ${healthScore}%. Please fix completeness or distractor issues before proceeding to QA.`);
        return;
      }
      onStatusChange('qa');
    } else if (currentStatus === 'qa') {
      setShowQaModal(true);
    } else if (currentStatus === 'approved') {
      onStatusChange('published');
      if (onSaveToDatabase) onSaveToDatabase('published');
    } else if (currentStatus === 'published') {
      if (confirm('Archive this published template? It will no longer be served in live student practice.')) {
        onStatusChange('archived');
      }
    } else if (currentStatus === 'archived') {
      onStatusChange('draft');
    }
  };

  const handleApproveQa = () => {
    setShowQaModal(false);
    onStatusChange('approved');
    if (onSaveToDatabase) onSaveToDatabase('approved');
  };

  const handleRejectQa = () => {
    setShowQaModal(false);
    onStatusChange('draft');
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: '24px',
      border: '1.5px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      marginBottom: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚀 Publisher Pipeline & Lifecycle Workflow</span>
            <span style={{
              background: STAGES[currentIdx].bg,
              color: STAGES[currentIdx].color,
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '12px',
              border: `1px solid ${STAGES[currentIdx].color}`
            }}>
              {STAGES[currentIdx].icon} {STAGES[currentIdx].label.toUpperCase()}
            </span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Formal publishing workflow: Draft ➔ Automated Validation ➔ Peer QA ➔ Approved ➔ Production Live.
          </p>
        </div>

        {/* Primary Action Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              if (onSaveToDatabase) onSaveToDatabase(currentStatus);
            }}
            disabled={saving}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            💾 Save {STAGES[currentIdx].label}
          </button>

          <button
            onClick={handleNextStage}
            disabled={saving}
            style={{
              background: currentStatus === 'published' ? '#475569' : STAGES[Math.min(currentIdx + 1, STAGES.length - 1)].color,
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {saving ? 'Processing...' : (
              currentStatus === 'draft' ? 'Submit for Validation ➔' :
              currentStatus === 'validate' ? 'Proceed to QA Audit ➔' :
              currentStatus === 'qa' ? 'Review QA Audit ➔' :
              currentStatus === 'approved' ? '🚀 Deploy to Live Production' :
              currentStatus === 'published' ? '📦 Archive Version' :
              '📝 Re-open as Draft'
            )}
          </button>
        </div>
      </div>

      {/* Lifecycle Progress Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginTop: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
        {/* Connecting line */}
        <div style={{
          position: 'absolute', top: '18px', left: '40px', right: '40px', height: '3px',
          background: '#e2e8f0', zIndex: 1
        }} />
        <div style={{
          position: 'absolute', top: '18px', left: '40px',
          width: `${(currentIdx / (STAGES.length - 1)) * 100}%`, height: '3px',
          background: STAGES[currentIdx].color, zIndex: 2, transition: 'width 0.4s ease'
        }} />

        {/* Stage Nodes */}
        {STAGES.map((stage, idx) => {
          const isPassed = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div
              key={stage.id}
              onClick={() => onStatusChange(stage.id)}
              style={{
                zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', opacity: isPassed ? 1 : 0.4, transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: isCurrent ? stage.color : (isPassed ? '#0f172a' : '#fff'),
                color: (isCurrent || isPassed) ? '#fff' : '#64748b',
                border: isCurrent ? `3px solid ${stage.color}` : '2px solid #cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 900, boxShadow: isCurrent ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none'
              }}>
                {isPassed && !isCurrent ? '✓' : stage.icon}
              </div>
              <span style={{
                marginTop: '6px', fontSize: '0.78rem', fontWeight: isCurrent ? 900 : 700,
                color: isCurrent ? stage.color : '#475569'
              }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* QA Review Modal */}
      {showQaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧪 Peer QA & Curriculum Audit
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Dataset Health Score: <strong style={{ color: healthScore >= 80 ? '#166534' : '#991b1b' }}>{healthScore}%</strong>. Leave reviewer notes below before approving for production deployment.
            </p>

            <textarea
              rows={4}
              value={qaNotes}
              onChange={e => setQaNotes(e.target.value)}
              placeholder="e.g. Verified distractor accuracy for all 80 questions. Formulas checked against JNVST 2024 syllabus."
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleRejectQa}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b', fontWeight: 800, cursor: 'pointer' }}
              >
                ❌ Reject to Draft
              </button>

              <button
                type="button"
                onClick={handleApproveQa}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#059669', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                🟢 Approve & Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
