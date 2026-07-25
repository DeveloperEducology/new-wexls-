'use client';

import React from 'react';
import Link from 'next/link';

export default function GridHeaderBar({
  title, setTitle,
  subject, setSubject,
  topic, setTopic,
  grade, setGrade,
  onExportJson,
  onImportCsv
}) {
  return (
    <div style={{ background: '#0f172a', padding: '16px 24px', borderRadius: '12px', border: '1.5px solid #1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Link href="/admin/templates" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Templates
          </Link>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            ⚡ KlassChamp Grid Editor
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Template Title..."
          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: '#f8fafc', fontSize: '20px', fontWeight: 800, width: '100%', maxWidth: '400px' }}
        />
      </div>

      {/* Subject, Topic, Grade selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}
        >
          <option value="Maths">Maths</option>
          <option value="English">English</option>
          <option value="Phonics">Phonics</option>
          <option value="Science">Science</option>
        </select>

        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}
        >
          <option value="Nursery">Nursery</option>
          <option value="LKG">LKG</option>
          <option value="UKG">UKG</option>
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
          <option value="Grade 4">Grade 4</option>
          <option value="Grade 5">Grade 5</option>
        </select>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic..."
          style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', width: '140px' }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onImportCsv}
            style={{ background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            📥 Import CSV / Sheet
          </button>
          <button
            type="button"
            onClick={onExportJson}
            style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
          >
            🚀 Export & Save Template
          </button>
        </div>
      </div>
    </div>
  );
}
