'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../../../../components/layout/SiteHeader';

export default function MockTestReportPage({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const examId = resolvedParams.examId || 'jnvst';
  const sessionId = resolvedParams.sessionId;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/practice/session?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.success && data.session && data.session.report) {
          setReport(data.session.report);
        } else {
          // Fallback fetch if stored in report structure
          const repRes = await fetch(`/api/practice/mock-test/report?sessionId=${sessionId}`);
          const repData = await repRes.json();
          if (repData.success) setReport(repData.report);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <h3>Generating JNVST Performance Analysis...</h3>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2>Report Not Found</h2>
        <Link href={`/exam-prep/${examId}`} style={{ color: '#6366f1' }}>Back to JNVST Dashboard</Link>
      </div>
    );
  }

  const { totalScore, maxScore, accuracyPercent, timeTakenSeconds, passedCutoff, sections, evaluatedAnswers = [] } = report;

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      <SiteHeader />

      {/* Header Banner */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <span style={{
          background: passedCutoff ? '#166534' : '#991b1b',
          color: passedCutoff ? '#4ade80' : '#fca5a5',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'inline-block',
          marginBottom: '12px'
        }}>
          {passedCutoff ? '🎉 JNVST SELECTION CUTOFF PASSED' : '⚠️ UNDER JNVST CUTOFF (TARGET: 65+)'}
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px' }}>JNVST Full Mock Test Score Card</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Official 80-Question Selection Test Analysis</p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '-30px auto 40px', padding: '0 24px' }}>
        
        {/* Main Score Metrics */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Marks</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: passedCutoff ? '#16a34a' : '#dc2626' }}>{totalScore} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>/ {maxScore}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Accuracy</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563eb' }}>{accuracyPercent}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Time Efficiency</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>{formatMinSec(timeTakenSeconds)}</div>
          </div>
        </div>

        {/* Section Score Cards */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '36px 0 20px' }}>Section Performance Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {sections && Object.entries(sections).map(([key, sec]) => (
            <div key={key} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{sec.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Correct Answers:</span>
                <span style={{ fontWeight: 700 }}>{sec.correct} / {sec.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Section Score:</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>{sec.score} / {sec.maxScore} Marks</span>
              </div>
              {/* Progress Bar */}
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${sec.accuracy}%`, height: '100%', background: sec.accuracy >= 75 ? '#22c55e' : (sec.accuracy >= 50 ? '#f59e0b' : '#ef4444') }} />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '36px', justifyContent: 'center' }}>
          <Link href={`/exam-prep/${examId}/mock-test`} style={{ background: '#6366f1', color: '#fff', padding: '14px 28px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none' }}>
            🔄 Retake Full Mock Test
          </Link>
          <Link href={`/exam-prep/${examId}`} style={{ background: '#fff', color: '#334155', border: '1px solid #cbd5e1', padding: '14px 28px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none' }}>
            🏠 Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
