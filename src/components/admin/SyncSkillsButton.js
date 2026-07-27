'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncSkillsButton({ subject = 'all', grade = 'all', onSynced, style = {} }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const handleSync = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/kpi/sync-skills?subject=${subject}&grade=${grade}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ Synced ${data.matchedSkills}/${data.totalSkills} skills! (${data.updatedSkills} DB records updated)` });
        if (onSynced) onSynced(data);
        router.refresh();
      } else {
        setMessage({ type: 'error', text: `❌ ${data.error || 'Sync failed'}` });
      }
    } catch (err) {
      console.error('Error syncing skills:', err);
      setMessage({ type: 'error', text: `❌ ${err.message || 'Network error during sync'}` });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage(null);
      }, 6000);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', ...style }}>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        style={{
          padding: '10px 18px',
          borderRadius: '8px',
          border: 'none',
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '13px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        title="Scan DB templates, spreadsheets, and generators to update linked skill status"
      >
        <span style={{ display: 'inline-block', transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 1s linear' }}>
          🔄
        </span>
        {loading ? 'Fetching & Linking Skills...' : 'Fetch & Link Skills'}
      </button>

      {message && (
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: message.type === 'success' ? '#16a34a' : '#dc2626',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          padding: '4px 10px',
          borderRadius: '6px',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          maxWidth: '380px',
          lineHeight: '1.4'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
