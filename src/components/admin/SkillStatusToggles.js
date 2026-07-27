'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SkillTemplateAddedToggle({ skillId, initialAdded }) {
  const [added, setAdded] = useState(Boolean(initialAdded));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async (event) => {
    event.stopPropagation();
    if (loading) return;

    const nextAdded = !added;
    setAdded(nextAdded);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/skills/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          templateAdded: nextAdded
        })
      });
      const data = await res.json();
      if (!data.success) {
        setAdded(added); // revert on error
        console.error('Failed to update templateAdded:', data.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setAdded(added); // revert on error
      console.error('Error updating templateAdded:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title="Click to toggle Template Added (Yes / No)"
      style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '800',
        color: '#ffffff',
        backgroundColor: added ? '#10b981' : '#ef4444',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'all 0.15s ease',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {added ? '✅ YES' : '❌ NO'}
    </button>
  );
}

export function SkillTestingStatusSelector({ skillId, initialStatus, templateAdded }) {
  const [status, setStatus] = useState(initialStatus || 'Pending');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const STATUS_OPTIONS = [
    { value: 'Verified & Active', label: 'VERIFIED & ACTIVE', color: '#10b981' },
    { value: 'Tested & Verified', label: 'TESTED & VERIFIED', color: '#0d9488' },
    { value: 'Linked & Active', label: 'LINKED & ACTIVE', color: '#0284c7' },
    { value: 'Draft / In Review', label: 'DRAFT / IN REVIEW', color: '#d97706' },
    { value: 'Pending', label: 'PENDING', color: '#64748b' }
  ];

  const currentOpt = STATUS_OPTIONS.find(o => o.value.toLowerCase() === String(status).toLowerCase()) || {
    value: status,
    label: String(status).toUpperCase(),
    color: templateAdded ? '#10b981' : '#64748b'
  };

  const handleChange = async (event) => {
    const nextStatus = event.target.value;
    setStatus(nextStatus);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/skills/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          testingStatus: nextStatus
        })
      });
      const data = await res.json();
      if (!data.success) {
        setStatus(status); // revert on error
        console.error('Failed to update testingStatus:', data.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setStatus(status); // revert on error
      console.error('Error updating testingStatus:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={currentOpt.value}
      onChange={handleChange}
      disabled={loading}
      title="Click to manually change Testing Status"
      style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '800',
        color: '#ffffff',
        backgroundColor: currentOpt.color,
        border: '1.5px solid rgba(255,255,255,0.3)',
        cursor: loading ? 'wait' : 'pointer',
        outline: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: '#ffffff', color: '#1e293b', fontWeight: 'bold' }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
