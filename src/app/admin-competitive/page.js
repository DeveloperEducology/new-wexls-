'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import SiteHeader from '../../components/layout/SiteHeader';
import TestSeriesManager from '../../components/admin/TestSeriesManager';

function parseMathAndText(text) {
  if (!text) return '';
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<div')) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: text }}
        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '4px' }}
      />
    );
  }
  const parts = text.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);
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
    return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

export default function AdminCompetitivePage() {
  const [activeTab, setActiveTab] = useState('spreadsheets'); // 'spreadsheets', 'test-series', 'question-bank'
  const [selectedExamId, setSelectedExamId] = useState('jnvst');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states for Spreadsheets
  const [filterExam, setFilterExam] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  // Filter states for Question Bank
  const [sectionFilter, setSectionFilter] = useState('all'); // 'all', 'mat', 'arithmetic', 'language'
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // Quick Link Modal State
  const [linkModalTarget, setLinkModalTarget] = useState(null);
  const [selectedMockTestForLink, setSelectedMockTestForLink] = useState('');
  const [linkingStatus, setLinkingStatus] = useState(null);

  // Fetch Spreadsheets & Templates
  const loadSpreadsheets = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        let allList = [];
        if (Array.isArray(data.dynamicTemplates)) {
          allList.push(...data.dynamicTemplates);
        }
        if (Array.isArray(data.templates)) {
          allList.push(...data.templates);
        } else if (data.templates && typeof data.templates === 'object') {
          Object.values(data.templates).forEach(val => {
            if (Array.isArray(val)) allList.push(...val);
            else if (val && typeof val === 'object') allList.push(val);
          });
        }

        const seen = new Set();
        const deduped = [];
        allList.forEach(t => {
          const id = String(t.id || t._id);
          if (id && !seen.has(id)) {
            seen.add(id);
            deduped.push(t);
          }
        });

        setTemplates(deduped);
      }
    } catch (err) {
      console.error('Failed to load spreadsheets:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fetch Static Question Bank
  const loadQuestionBank = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/questions?examId=${selectedExamId}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  useEffect(() => {
    if (activeTab === 'spreadsheets') loadSpreadsheets();
    if (activeTab === 'question-bank') loadQuestionBank();
  }, [activeTab, selectedExamId]);

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const title = (t.title || t.name || t.id || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || title.includes(search) || (t.subject || '').toLowerCase().includes(search) || (t.topic || '').toLowerCase().includes(search);
    const matchesExam = filterExam === 'all' || (t.examId || '').toLowerCase() === filterExam.toLowerCase();
    const matchesSubject = filterSubject === 'all' || (t.subject || '').toLowerCase() === filterSubject.toLowerCase();
    const matchesGrade = filterGrade === 'all' || String(t.grade || '').toLowerCase() === filterGrade.toLowerCase();

    return matchesSearch && matchesExam && matchesSubject && matchesGrade;
  });

  // Filter Question Bank
  const filteredQuestions = questions.filter(q => {
    if (sectionFilter === 'all') return true;
    return (q.section || '').toLowerCase() === sectionFilter.toLowerCase();
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SiteHeader />

      {/* Main Admin Portal Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Top Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '24px',
          padding: '32px',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(49, 46, 129, 0.35)',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px' }}>
                🏆 Dedicated Portal V2.0 (100% Optimized)
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                Competitive Exams &amp; Mock Test Admin
              </h1>
              <p style={{ margin: '8px 0 0 0', opacity: 0.88, fontSize: '0.98rem', maxWidth: '750px', lineHeight: 1.5 }}>
                Manage JNVST, IMO, NSO Full Mock Tests, Test Series &amp; Direct Row-by-Row Spreadsheets independently from K-12 School Practice.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/admin-v2"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🏫 Switch to School Practice Admin
              </Link>

              <Link
                href={`/exam-prep/${selectedExamId}/mock-test?templateId=jnvst-full-mock-spreadsheet`}
                target="_blank"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '12px 22px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                🚀 Launch Official Mock Test
              </Link>
            </div>
          </div>

          {/* KPI Dashboard Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Full Mock Tests</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>10 Published</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Spreadsheets &amp; Grids</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>{templates.length} Active</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Orderwise Question Bank</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>{questions.length || 80} Questions</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Official Exam Timer</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>120 Mins (2 Hours)</div>
            </div>
          </div>
        </div>

        {/* Primary Admin Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          background: '#ffffff',
          padding: '8px',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('spreadsheets')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'spreadsheets' ? '#4338ca' : 'transparent',
              color: activeTab === 'spreadsheets' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📊 Direct Spreadsheet Manager ({templates.length})
          </button>

          <button
            onClick={() => setActiveTab('test-series')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'test-series' ? '#4338ca' : 'transparent',
              color: activeTab === 'test-series' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🏆 Test Series &amp; Full Mocks
          </button>

          <button
            onClick={() => setActiveTab('question-bank')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'question-bank' ? '#4338ca' : 'transparent',
              color: activeTab === 'question-bank' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🗃️ Static Question Bank (KaTeX Rendered)
          </button>
        </div>

        {/* Tab 1: Direct Spreadsheet Manager */}
        {activeTab === 'spreadsheets' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  📊 Direct Spreadsheet Grid &amp; CSV Catalog
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Directly edit, preview row-by-row, and link spreadsheet grids to full mock tests.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search topic or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    minWidth: '180px'
                  }}
                />

                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                >
                  <option value="all">🏆 All Exams</option>
                  <option value="jnvst">JNVST (Navodaya)</option>
                  <option value="imo">IMO Olympiad</option>
                  <option value="nso">NSO Olympiad</option>
                  <option value="cbse_class5">CBSE Entrance</option>
                </select>

                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                >
                  <option value="all">📚 All Subjects</option>
                  <option value="math">Math / Arithmetic</option>
                  <option value="english">English / Phonics</option>
                  <option value="science">Science</option>
                  <option value="previous_years">Previous Years PYQs</option>
                </select>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                >
                  <option value="all">🎓 All Classes / Grades</option>
                  <option value="ukg">UKG</option>
                  <option value="5">Class / Grade 5</option>
                  <option value="6">Class / Grade 6</option>
                  <option value="7">Class / Grade 7</option>
                  <option value="8">Class / Grade 8</option>
                </select>

                <Link
                  href="/template-generator-grid"
                  target="_blank"
                  style={{
                    background: '#4338ca',
                    color: '#ffffff',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ➕ Create Spreadsheet Grid
                </Link>
              </div>
            </div>

            {loadingTemplates ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Loading spreadsheets...</div>
            ) : filteredTemplates.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>No spreadsheets found matching search filters.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                {filteredTemplates.map((t, idx) => {
                  const tId = t.id || t._id;
                  const rowCount = Array.isArray(t.rows) ? t.rows.length : (t.variables ? t.variables.length : 0);
                  const isStatic = t.isSpreadsheetStatic || (t.rows && t.rows.length > 0 && t.rows[0].optionA);

                  return (
                    <div
                      key={tId || idx}
                      style={{
                        background: '#ffffff',
                        border: isStatic ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: '14px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <span style={{
                            background: isStatic ? '#dcfce7' : '#e0e7ff',
                            color: isStatic ? '#166534' : '#3730a3',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            textTransform: 'uppercase'
                          }}>
                            {isStatic ? `📊 Static Spreadsheet (${rowCount} Rows)` : `🧮 Dynamic Formula Blueprint`}
                          </span>

                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                            {t.subject || 'math'} • {t.topic || 'general'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                          {t.title || t.name || tId}
                        </h3>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {tId}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <Link
                          href={`/template-generator-grid?templateId=${tId}`}
                          target="_blank"
                          style={{
                            flex: 1,
                            background: '#ffffff',
                            color: '#334155',
                            border: '1.5px solid #cbd5e1',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center'
                          }}
                        >
                          ✏️ Edit Grid
                        </Link>

                        <Link
                          href={`/exam-prep/${t.examId || 'jnvst'}/mock-test?templateId=${tId}`}
                          target="_blank"
                          style={{
                            flex: 1,
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          🚀 Launch Mock
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Test Series & Full Mock Test Manager */}
        {activeTab === 'test-series' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  JNVST &amp; Competitive Exam Test Series
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Create and manage official 80-Question Mock Tests, set timers, and publish exam packages.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#475569' }}>Select Exam Package:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#0f172a'
                  }}
                >
                  <option value="jnvst">JNVST Class 6 (Navodaya)</option>
                  <option value="imo">IMO Math Olympiad</option>
                  <option value="nso">NSO Science Olympiad</option>
                  <option value="cbse_class5">CBSE Class 5 Entrance</option>
                </select>
              </div>
            </div>

            <TestSeriesManager selectedExamId={selectedExamId} />
          </div>
        )}

        {/* Tab 3: Static Question Bank Explorer with KaTeX Rendering & Section Tabs */}
        {activeTab === 'question-bank' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  🗃️ Static Sequential Question Bank (KaTeX Rendered)
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Browse orderwise static questions with math formulas rendered formatted.
                </p>
              </div>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <option value="jnvst">JNVST Class 6</option>
                <option value="imo">IMO Math Olympiad</option>
                <option value="nso">NSO Science Olympiad</option>
              </select>
            </div>

            {/* Section Filter Pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All 80 Questions' },
                { id: 'mat', label: 'Mental Ability (MAT 1-40)' },
                { id: 'arithmetic', label: 'Arithmetic Test (Math 41-60)' },
                { id: 'language', label: 'Language Test (Reading 61-80)' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSectionFilter(sec.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: sectionFilter === sec.id ? '2px solid #4338ca' : '1.5px solid #cbd5e1',
                    background: sectionFilter === sec.id ? '#e0e7ff' : '#ffffff',
                    color: sectionFilter === sec.id ? '#3730a3' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {loadingQuestions ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Loading question bank...</div>
            ) : filteredQuestions.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>No static questions found for selected section filter.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredQuestions.map((q, idx) => {
                  const qId = q._id || q.id || idx;
                  const isExpanded = expandedQuestionId === qId;

                  return (
                    <div
                      key={qId}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '16px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                            fontSize: '0.88rem',
                            flexShrink: 0
                          }}>
                            {q.qNumber || idx + 1}
                          </span>

                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.98rem', lineHeight: 1.5 }}>
                              {parseMathAndText(q.questionText || 'Static Question')}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                              Section: <strong>{q.sectionName || q.section || 'General'}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: 900, fontSize: '0.82rem', padding: '4px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                            Key: {q.correctOption || q.answer || 'A'}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Question Details (Options A, B, C, D & Solution Explanation) */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Options Breakdown:
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            {q.options && typeof q.options === 'object' && Object.entries(q.options).map(([k, val]) => (
                              <div
                                key={k}
                                style={{
                                  background: (q.correctOption === k || String(q.answer) === k) ? '#f0fdf4' : '#ffffff',
                                  border: (q.correctOption === k || String(q.answer) === k) ? '2px solid #10b981' : '1px solid #cbd5e1',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  fontSize: '0.88rem',
                                  fontWeight: (q.correctOption === k || String(q.answer) === k) ? 800 : 500
                                }}
                              >
                                <strong>({k})</strong> {parseMathAndText(String(val))}
                              </div>
                            ))}
                          </div>

                          {q.explanationText && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem', color: '#1e40af' }}>
                              <strong>💡 Solution Explanation:</strong> {parseMathAndText(q.explanationText)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
  );
}
