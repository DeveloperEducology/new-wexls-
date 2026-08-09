'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import SiteHeader from '../../../../../../components/layout/SiteHeader';

function parseMathAndText(text) {
  if (!text) return '';
  let str = typeof text === 'string' ? text : String(text);
  str = str.replace(/\\n/g, '\n').replace(/\/n/g, '\n');
  const trimmed = str.trim();
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<div')) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: str }}
        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '4px' }}
      />
    );
  }
  const parts = str.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <span key={i}>{part}</span>; }
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <div key={i}>{part}</div>; }
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <div key={i}>{part}</div>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const formula = part.slice(1, -1);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <span key={i}>{part}</span>; }
    }
    let processed = part;
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/\n/g, '<br />');
    return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

export default function MockTestReportPage({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const examId = resolvedParams.examId || 'jnvst';
  const sessionId = resolvedParams.sessionId;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review Filters
  const [sectionTab, setSectionTab] = useState('all'); // 'all', 'mat', 'arithmetic', 'language'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'correct', 'incorrect', 'unanswered'

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/practice/mock-test/report?sessionId=${sessionId}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.report) {
            setReport(data.report);
            return;
          }
        }

        // Fallback fetch from session route if stored in custom shape
        const sessRes = await fetch(`/api/practice/${sessionId}`);
        const sessContentType = sessRes.headers.get('content-type') || '';
        if (sessContentType.includes('application/json')) {
          const sessData = await sessRes.json();
          if (sessData.success && sessData.session && sessData.session.report) {
            setReport(sessData.session.report);
          }
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) {
      loadReport();
    }
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

  // Helper to normalize section name
  const getNormalizedSection = (ans) => {
    if (ans.section) {
      const s = String(ans.section).toLowerCase();
      if (s.includes('mat') || s.includes('mental')) return 'mat';
      if (s.includes('arithmetic') || s.includes('math')) return 'arithmetic';
      if (s.includes('language') || s.includes('reading')) return 'language';
    }
    const qNum = Number(ans.qNumber);
    if (qNum >= 1 && qNum <= 40) return 'mat';
    if (qNum >= 41 && qNum <= 60) return 'arithmetic';
    if (qNum >= 61 && qNum <= 80) return 'language';
    return 'general';
  };

  // Filter Answers
  const filteredAnswers = evaluatedAnswers.filter(ans => {
    const normSec = getNormalizedSection(ans);
    const matchesSection = sectionTab === 'all' || normSec === sectionTab;
    
    let matchesStatus = true;
    if (statusFilter === 'correct') matchesStatus = ans.isCorrect;
    else if (statusFilter === 'incorrect') matchesStatus = !ans.isCorrect && ans.selectedOption !== null;
    else if (statusFilter === 'unanswered') matchesStatus = ans.selectedOption === null;

    return matchesSection && matchesStatus;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      <SiteHeader />

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#fff', padding: '40px 24px', textAlign: 'center' }}>
        <span style={{
          background: passedCutoff ? '#166534' : '#991b1b',
          color: passedCutoff ? '#4ade80' : '#fca5a5',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 800,
          display: 'inline-block',
          marginBottom: '12px'
        }}>
          {passedCutoff ? '🎉 JNVST SELECTION CUTOFF PASSED' : '⚠️ UNDER JNVST CUTOFF (TARGET: 65+ MARKS)'}
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 8px' }}>JNVST Full Mock Test Score Card</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Official 80-Question Selection Test Performance &amp; Solution Review</p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-30px auto 40px', padding: '0 24px' }}>
        
        {/* Main Score Metrics */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Total Score</div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: passedCutoff ? '#16a34a' : '#dc2626' }}>{totalScore} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>/ {maxScore}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Accuracy</div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#2563eb' }}>{accuracyPercent}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Time Efficiency</div>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0f172a' }}>{formatMinSec(timeTakenSeconds)}</div>
          </div>
        </div>

        {/* Section Score Cards */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '36px 0 20px', color: '#0f172a' }}>Section Performance Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {sections && Object.entries(sections).map(([key, sec]) => (
            <div key={key} style={{ background: '#fff', borderRadius: '18px', border: '1.5px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>{sec.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Correct Answers:</span>
                <span style={{ fontWeight: 800 }}>{sec.correct} / {sec.total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Section Score:</span>
                <span style={{ fontWeight: 900, color: '#4338ca' }}>{sec.score} / {sec.maxScore} Marks</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${sec.accuracy}%`, height: '100%', background: sec.accuracy >= 75 ? '#22c55e' : (sec.accuracy >= 50 ? '#f59e0b' : '#ef4444') }} />
              </div>
            </div>
          ))}
        </div>

        {/* SECTION-WISE DETAILED QUESTION & SOLUTION REVIEW */}
        <div style={{ marginTop: '40px', background: '#ffffff', borderRadius: '24px', padding: '32px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                🔍 Detailed Section-Wise Question Review
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Review your selected answer, correct key, and clear step-by-step solutions for every question.
              </p>
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'correct', label: '✅ Correct' },
                { id: 'incorrect', label: '❌ Incorrect' },
                { id: 'unanswered', label: '⚪ Unanswered' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: statusFilter === st.id ? '2px solid #4338ca' : '1px solid #cbd5e1',
                    background: statusFilter === st.id ? '#e0e7ff' : '#ffffff',
                    color: statusFilter === st.id ? '#3730a3' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section Filter Navigation Pills */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px', overflowX: 'auto' }}>
            {[
              { id: 'all', label: `All 80 Questions (${evaluatedAnswers.length})` },
              { id: 'mat', label: '🧠 Mental Ability (MAT Q1-40)' },
              { id: 'arithmetic', label: '🔢 Arithmetic Test (Q41-60)' },
              { id: 'language', label: '📖 Language Test (Q61-80)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSectionTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: sectionTab === tab.id ? '#4338ca' : '#f1f5f9',
                  color: sectionTab === tab.id ? '#ffffff' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Questions List */}
          {filteredAnswers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>
              No questions found matching your filter selection.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredAnswers.map((ans) => {
                const qNum = ans.qNumber;
                const userSelected = ans.selectedOption;
                const correctOpt = ans.correctOption;
                const isCorrect = ans.isCorrect;
                const isUnanswered = userSelected === null;

                return (
                  <div
                    key={qNum}
                    style={{
                      background: isCorrect ? '#f0fdf4' : (isUnanswered ? '#ffffff' : '#fef2f2'),
                      border: `1.5px solid ${isCorrect ? '#bbf7d0' : (isUnanswered ? '#e2e8f0' : '#fecaca')}`,
                      borderRadius: '18px',
                      padding: '22px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Top Bar: Question #, Section Badge, Status Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          background: '#4338ca',
                          color: '#fff',
                          fontWeight: 900,
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.88rem'
                        }}>
                          {qNum}
                        </span>

                        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.78rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>
                          {ans.section || 'Question'}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span style={{
                        background: isCorrect ? '#dcfce7' : (isUnanswered ? '#f1f5f9' : '#fee2e2'),
                        color: isCorrect ? '#166534' : (isUnanswered ? '#64748b' : '#991b1b'),
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        padding: '4px 12px',
                        borderRadius: '12px'
                      }}>
                        {isCorrect ? '✅ Correct (+1.25)' : (isUnanswered ? '⚪ Unanswered (0)' : '❌ Incorrect (0)')}
                      </span>
                    </div>

                    {/* Question Text */}
                    <div style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', lineHeight: 1.5 }}>
                      {parseMathAndText(ans.questionText || `Question #${qNum}`)}
                    </div>

                    {/* Question Figure Image (if any) */}
                    {ans.questionImage && (
                      <div style={{ marginBottom: '16px' }}>
                        <img src={ans.questionImage} alt="Question Diagram" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                    )}

                    {/* Options Grid (2x2 Matrix) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      {['A', 'B', 'C', 'D'].map(letter => {
                        const opts = ans.options || {};
                        const optImgs = ans.optionsImages || {};
                        const val = typeof opts === 'object' ? (opts[letter] || opts[`option${letter}`]) : null;
                        const imgVal = optImgs[letter];
                        if (!val && !imgVal) return null;

                        const isUserChoice = userSelected === letter;
                        const isCorrectKey = correctOpt === letter;

                        let bg = '#ffffff';
                        let border = '1.5px solid #e2e8f0';
                        let textColor = '#334155';

                        if (isCorrectKey) {
                          bg = '#dcfce7';
                          border = '2px solid #16a34a';
                          textColor = '#14532d';
                        } else if (isUserChoice && !isCorrect) {
                          bg = '#fee2e2';
                          border = '2px solid #dc2626';
                          textColor = '#7f1d1d';
                        }

                        return (
                          <div
                            key={letter}
                            style={{
                              background: bg,
                              border: border,
                              borderRadius: '12px',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.92rem',
                              fontWeight: (isCorrectKey || isUserChoice) ? 800 : 500
                            }}
                          >
                            <span style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: isCorrectKey ? '#16a34a' : (isUserChoice ? '#dc2626' : '#f1f5f9'),
                              color: (isCorrectKey || isUserChoice) ? '#fff' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 900,
                              flexShrink: 0
                            }}>
                              {letter}
                            </span>

                            <div style={{ color: textColor, flex: 1 }}>
                              {val ? parseMathAndText(String(val)) : ''}
                              {imgVal && (
                                <div style={{ marginTop: '4px' }}>
                                  <img src={imgVal} alt={`Option ${letter}`} style={{ maxHeight: '50px', borderRadius: '4px' }} />
                                </div>
                              )}
                            </div>

                            {isUserChoice && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 900, background: isCorrect ? '#16a34a' : '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Step-by-Step Clear Solution Explanation */}
                    {ans.explanation && (
                      <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: '14px 18px', borderRadius: '12px', fontSize: '0.9rem', color: '#1e40af', lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 900, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem' }}>
                          💡 Clear Step-by-Step Solution:
                        </div>
                        <div>{parseMathAndText(ans.explanation)}</div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '36px', justifyContent: 'center' }}>
          <Link href={`/exam-prep/${examId}/mock-test?templateId=2020-jnvst-official-pyq-template`} style={{ background: '#4338ca', color: '#fff', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(67, 56, 202, 0.3)' }}>
            🔄 Retake Full Mock Test
          </Link>

          <Link href="/admin-competitive" style={{ background: '#fff', color: '#334155', border: '1.5px solid #cbd5e1', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>
            🏠 Return to Competitive Admin
          </Link>
        </div>

      </div>
    </div>
  );
}
