'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '../../components/layout/SiteHeader';
import TestSeriesManager from '../../components/admin/TestSeriesManager';

export default function AdminCompetitivePage() {
  const [activeTab, setActiveTab] = useState('test-series'); // 'test-series', 'spreadsheets', 'exams', 'question-bank'
  const [selectedExamId, setSelectedExamId] = useState('jnvst');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Spreadsheets & Templates
  const loadSpreadsheets = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates/list');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
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
    if (activeTab === 'spreadsheets') loadSpreadsheets();
    if (activeTab === 'question-bank') loadQuestionBank();
  }, [activeTab, selectedExamId]);

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const title = (t.title || t.id || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return title.includes(search) || (t.subject || '').toLowerCase().includes(search) || (t.topic || '').toLowerCase().includes(search);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SiteHeader />

      {/* Main Admin Portal Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Top Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px' }}>
              🏆 Dedicated Portal V2.0
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Competitive Exams &amp; Mock Test Admin
            </h1>
            <p style={{ margin: '6px 0 0 0', opacity: 0.85, fontSize: '0.95rem' }}>
              Manage JNVST, IMO, NSO Full Mock Tests, Test Series &amp; Direct Row-by-Row Spreadsheets independently from School Practice.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/admin-v2"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              🏫 Switch to School Practice Admin
            </Link>

            <Link
              href={`/exam-prep/${selectedExamId}/mock-test`}
              target="_blank"
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                textDecoration: 'none',
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              🚀 Launch Mock Test Player
            </Link>
          </div>
        </div>

        {/* Primary Admin Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          background: '#ffffff',
          padding: '8px',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('test-series')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
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
            onClick={() => setActiveTab('spreadsheets')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
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
            📊 Direct Spreadsheet Manager
          </button>

          <button
            onClick={() => setActiveTab('question-bank')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.92rem',
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
            🗃️ Static Question Bank (Orderwise)
          </button>
        </div>

        {/* Tab 1: Test Series & Full Mock Test Manager */}
        {activeTab === 'test-series' && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  JNVST &amp; Competitive Exam Test Series
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Create and manage official 80-Question Mock Tests, set timers, and publish exam packages.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Select Exam:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontWeight: 700,
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

        {/* Tab 2: Direct Spreadsheet Manager */}
        {activeTab === 'spreadsheets' && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  📊 Direct Spreadsheet Grid &amp; CSV Catalog
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Directly edit, preview row-by-row, and link spreadsheet grids to full mock tests.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search spreadsheets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    minWidth: '220px'
                  }}
                />

                <Link
                  href="/template-generator-grid"
                  target="_blank"
                  style={{
                    background: '#4338ca',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ➕ Create New Spreadsheet Grid
                </Link>
              </div>
            </div>

            {loadingTemplates ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading spreadsheets...</div>
            ) : filteredTemplates.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No spreadsheets found matching search.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {filteredTemplates.map((t, idx) => {
                  const tId = t.id || t._id;
                  const rowCount = Array.isArray(t.rows) ? t.rows.length : (t.variables ? t.variables.length : 0);
                  const isStatic = t.isSpreadsheetStatic || (t.rows && t.rows.length > 0 && t.rows[0].optionA);

                  return (
                    <div
                      key={tId || idx}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{
                            background: isStatic ? '#dcfce7' : '#e0e7ff',
                            color: isStatic ? '#166534' : '#3730a3',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase'
                          }}>
                            {isStatic ? `📊 Static Spreadsheet (${rowCount} Rows)` : `🧮 Dynamic Formula Blueprint`}
                          </span>

                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                            {t.subject || 'math'} • {t.topic || 'general'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                          {t.title || t.name || tId}
                        </h3>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {tId}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <Link
                          href={`/template-generator-grid?templateId=${tId}`}
                          target="_blank"
                          style={{
                            flex: 1,
                            background: '#ffffff',
                            color: '#334155',
                            border: '1.5px solid #cbd5e1',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
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
                            padding: '7px 10px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center'
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

        {/* Tab 3: Static Question Bank Explorer */}
        {activeTab === 'question-bank' && (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  🗃️ Static Sequential Question Bank
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Browse orderwise static questions stored in MongoDB for JNVST sections.
                </p>
              </div>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <option value="jnvst">JNVST Class 6</option>
                <option value="imo">IMO Math Olympiad</option>
                <option value="nso">NSO Science Olympiad</option>
              </select>
            </div>

            {loadingQuestions ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading question bank...</div>
            ) : questions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No static questions found for {selectedExamId.toUpperCase()}.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {questions.map((q, idx) => (
                  <div
                    key={q._id || q.id || idx}
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: '#4338ca',
                        color: '#fff',
                        fontWeight: 900,
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        fontSize: '0.8rem'
                      }}>
                        {q.qNumber || idx + 1}
                      </span>

                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          {q.questionText || 'Static Question'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Section: {q.sectionName || q.section || 'General'}
                        </div>
                      </div>
                    </div>

                    <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px' }}>
                      Key: {q.correctOption || q.answer || 'A'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
