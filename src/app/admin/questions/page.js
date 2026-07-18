'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '../../../components/layout/SiteHeader';

export default function AdminQuestionsManager() {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions', 'templates', 'review'
  
  // Question Bank states
  const [questions, setQuestions] = useState([]);
  const [examId, setExamId] = useState('jnvst');
  const [section, setSection] = useState('');
  const [qLimit, setQLimit] = useState(50);
  const [qLoading, setQLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  // New Question Form state
  const [newQ, setNewQ] = useState({
    examId: 'jnvst',
    section: 'mat',
    topic: 'series',
    difficulty: 0.5,
    questionText: '',
    options: { A: '', B: '', C: '', D: '' },
    correctOption: 'A',
    explanationText: '',
    isPYQ: false,
    pyqYear: 2024
  });

  // Bulk Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importMessage, setImportMessage] = useState('');

  // Templates states
  const [templates, setTemplates] = useState([]);
  const [tLoading, setTLoading] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);
  const [genCount, setGenCount] = useState(10);
  const [templateMessage, setTemplateMessage] = useState('');

  // Review states
  const [drafts, setDrafts] = useState([]);
  const [rLoading, setRLoading] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editDraftForm, setEditDraftForm] = useState({
    questionText: '',
    options: { A: '', B: '', C: '', D: '' },
    correctOption: 'A',
    explanationText: ''
  });

  // ─── 1. Load active questions ───────────────────────────────────────
  const fetchQuestions = async () => {
    setQLoading(true);
    try {
      const url = `/api/admin/questions?examId=${examId}&section=${section}&limit=${qLimit}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQLoading(false);
    }
  };

  // ─── 2. Load templates ──────────────────────────────────────────────
  const fetchTemplates = async () => {
    setTLoading(true);
    try {
      const res = await fetch(`/api/admin/templates?examId=${examId}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTLoading(false);
    }
  };

  // ─── 3. Load draft review queue ─────────────────────────────────────
  const fetchDrafts = async () => {
    setRLoading(true);
    try {
      const res = await fetch('/api/admin/questions/review');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'review') fetchDrafts();
  }, [activeTab, examId, section, qLimit]);

  // ─── Question Form Handlers ─────────────────────────────────────────
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setNewQ({
          examId: 'jnvst',
          section: 'mat',
          topic: 'series',
          difficulty: 0.5,
          questionText: '',
          options: { A: '', B: '', C: '', D: '' },
          correctOption: 'A',
          explanationText: '',
          isPYQ: false,
          pyqYear: 2024
        });
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    setImportMessage('');
    try {
      const parsed = JSON.parse(importJsonText);
      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: parsed })
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage(`🎉 Bulk import successful! Imported ${data.insertedCount} questions.`);
        setImportJsonText('');
        fetchQuestions();
      } else {
        setImportMessage(`❌ Import failed: ${data.error}`);
      }
    } catch (err) {
      setImportMessage(`❌ Invalid JSON input: ${err.message}`);
    }
  };

  // ─── Template Generation Handler ────────────────────────────────────
  const handleGenerateFromTemplate = async (templateId) => {
    setGeneratingTemplateId(templateId);
    setTemplateMessage('');
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: genCount })
      });
      const data = await res.json();
      if (data.success) {
        setTemplateMessage(`✅ Generated ${data.generated} questions successfully. ${data.requiresReview ? 'Check the Review Queue.' : 'They are live!'}`);
        fetchTemplates();
      } else {
        setTemplateMessage(`❌ Generation failed: ${data.error}`);
      }
    } catch (e) {
      setTemplateMessage(`❌ Error: ${e.message}`);
    } finally {
      setGeneratingTemplateId(null);
    }
  };

  // ─── Review Action Handlers ─────────────────────────────────────────
  const handleReviewAction = async (questionId, action, edits = null) => {
    try {
      const res = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, action, edits })
      });
      const data = await res.json();
      if (data.success) {
        setEditingDraftId(null);
        fetchDrafts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEditDraft = (q) => {
    setEditingDraftId(q._id);
    setEditDraftForm({
      questionText: q.questionText,
      options: { ...q.options },
      correctOption: q.correctOption,
      explanationText: q.explanationText
    });
  };

  return (
    <div className="admin-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-root {
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-outfit), 'Inter', sans-serif;
          color: #0f172a;
        }

        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .admin-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .admin-title {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .tabs-header {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          gap: 32px;
          margin-bottom: 32px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 12px 0;
          font-size: 16px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab-btn:hover {
          color: #4f46e5;
        }

        .tab-btn.active {
          color: #4f46e5;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #4f46e5;
        }

        .control-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 16px 24px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .select-input, .text-input {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          color: #334155;
          font-weight: 600;
          outline: none;
        }

        .select-input:focus, .text-input:focus {
          border-color: #6366f1;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          font-weight: 700;
          font-size: 14px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(99,102,241,0.15);
          transition: all 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.95;
        }

        .btn-outline {
          background: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 10px 20px;
          font-weight: 700;
          font-size: 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: #f8fafc;
        }

        .grid-panel {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: #f8fafc;
          text-align: left;
          padding: 14px 20px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table td {
          padding: 18px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          vertical-align: top;
        }

        .question-snippet {
          max-width: 480px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-weight: 600;
          color: #334155;
        }

        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .badge-info { background: #e0f2fe; color: #0369a1; }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef3c7; color: #b45309; }

        .form-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .form-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group-full {
          grid-column: 1 / span 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label-text {
          font-size: 13px;
          font-weight: 700;
          color: #475569;
        }

        .textarea-input {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          min-height: 80px;
          font-family: inherit;
        }

        .message-banner {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 24px;
        }
      ` }} />

      <SiteHeader />

      <main className="admin-container">
        <div className="admin-title-row">
          <h1 className="admin-title">Exam Content Manager</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin/illustration-builder" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>🎨</span> Clipart Prompt Builder
            </Link>
            <Link href="/admin/questions/from-image" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>✨</span> Generate from Image
            </Link>
            <button className="btn-outline" onClick={() => setShowImportForm(true)}>Bulk JSON Import</button>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>+ Add Question</button>
          </div>
        </div>

        <div className="tabs-header">
          <button className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
            Question Bank ({questions.length})
          </button>
          <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
            Templates ({templates.length})
          </button>
          <button className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>
            Review Queue ({drafts.length})
          </button>
        </div>

        {/* ──────── TAB 1: QUESTION BANK ──────── */}
        {activeTab === 'questions' && (
          <>
            <div className="control-strip">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select className="select-input" value={examId} onChange={(e) => setExamId(e.target.value)}>
                  <option value="jnvst">JNVST</option>
                </select>
                <select className="select-input" value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="">All Sections</option>
                  <option value="mat">Mental Ability (MAT)</option>
                  <option value="arithmetic">Arithmetic</option>
                  <option value="language">Language</option>
                </select>
              </div>
              <div>
                <select className="select-input" value={qLimit} onChange={(e) => setQLimit(Number(e.target.value))}>
                  <option value="20">Show 20</option>
                  <option value="50">Show 50</option>
                  <option value="100">Show 100</option>
                </select>
              </div>
            </div>

            <div className="grid-panel">
              {qLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading question bank...</div>
              ) : questions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No active questions found.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Section / Topic</th>
                      <th>Question</th>
                      <th>Options</th>
                      <th>Correct</th>
                      <th>Diff</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="badge badge-info">{q.section}</span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 700 }}>{q.topic}</div>
                        </td>
                        <td>
                          <div className="question-snippet">{q.questionText}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            A: {q.options.A?.substring(0, 20)} | B: {q.options.B?.substring(0, 20)}
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, color: '#10b981' }}>{q.correctOption}</td>
                        <td style={{ fontWeight: 700 }}>{q.difficulty}</td>
                        <td>
                          {q.isPYQ ? (
                            <span className="badge badge-success">PYQ {q.pyqYear}</span>
                          ) : (
                            <span className="badge badge-info">AI Gen</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ──────── TAB 2: TEMPLATES ──────── */}
        {activeTab === 'templates' && (
          <>
            {templateMessage && <div className="message-banner">{templateMessage}</div>}
            <div className="grid-panel">
              {tLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading templates...</div>
              ) : templates.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No templates seeded yet.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name / Topic</th>
                      <th>Type</th>
                      <th>Base Difficulty</th>
                      <th>Generated Count</th>
                      <th>Instant Generator</th>
                      <th>Edit in Builder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: '15px' }}>{t.name}</div>
                          <span className="badge badge-info" style={{ marginTop: '4px' }}>{t.section} • {t.topic}</span>
                        </td>
                        <td>
                          <span className={`badge ${t.type === 'parameterized' ? 'badge-success' : 'badge-warning'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{t.difficulty}</td>
                        <td style={{ fontWeight: 750, color: '#4f46e5' }}>{t.generatedCount || 0}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select className="select-input" style={{ padding: '6px 10px', fontSize: '12px' }} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}>
                              <option value="5">5 Qs</option>
                              <option value="10">10 Qs</option>
                              <option value="20">20 Qs</option>
                            </select>
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={generatingTemplateId === String(t._id)}
                              onClick={() => handleGenerateFromTemplate(String(t._id))}
                            >
                              {generatingTemplateId === String(t._id) ? 'Running...' : 'Instantiate'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <a
                            href={`/admin/templates?id=${String(t._id)}`}
                            style={{
                              padding: '6px 14px',
                              fontSize: '12px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#334155',
                              textDecoration: 'none',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ✏️ Edit
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid #e2e8f0', marginTop: '8px' }}>
                <a
                  href="/admin/templates"
                  style={{
                    padding: '8px 16px',
                    background: '#4f46e5',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  + Create Template
                </a>
                <a
                  href="/admin/templates?examId=jnvst"
                  style={{
                    padding: '8px 16px',
                    background: '#0ea5e9',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  + JNVST Template
                </a>
              </div>
            </div>
          </>
        )}

        {/* ──────── TAB 3: REVIEW QUEUE ──────── */}
        {activeTab === 'review' && (
          <div className="grid-panel">
            {rLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading review queue...</div>
            ) : drafts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#10b981', fontWeight: 800 }}>
                🎉 Review Queue clean! No pending drafts.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Section / Topic</th>
                    <th>Question Details</th>
                    <th>Options & Answer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((q) => {
                    const isEditing = editingDraftId === q._id;

                    return (
                      <tr key={q._id}>
                        <td>
                          <span className="badge badge-warning">{q.section}</span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 700 }}>{q.topic}</div>
                        </td>
                        <td>
                          {isEditing ? (
                            <>
                              <div style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 8px 0', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span>💡 Use <strong>_</strong> for a Tap-to-Fill blank.</span>
                                <button type="button" onClick={() => setEditDraftForm(prev => ({ ...prev, questionText: prev.questionText + ' _' }))} style={{ padding: '2px 4px', fontSize: '9px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}>+ Insert Blank</button>
                              </div>
                              <textarea
                                className="textarea-input"
                                style={{ width: '100%' }}
                                value={editDraftForm.questionText}
                                onChange={(e) => setEditDraftForm(prev => ({ ...prev, questionText: e.target.value }))}
                              />
                            </>
                          ) : (
                            <div style={{ fontWeight: 650, color: '#334155', lineHeight: '1.4' }}>{q.questionText}</div>
                          )}
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                            <strong>Explanation: </strong>
                            {isEditing ? (
                              <textarea
                                className="textarea-input"
                                style={{ width: '100%', marginTop: '4px' }}
                                value={editDraftForm.explanationText}
                                onChange={(e) => setEditDraftForm(prev => ({ ...prev, explanationText: e.target.value }))}
                              />
                            ) : q.explanationText}
                          </div>
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'grid', gap: '6px', fontSize: '12px' }}>
                              {['A', 'B', 'C', 'D'].map(o => (
                                <div key={o} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  <strong>{o}:</strong>
                                  <input
                                    type="text"
                                    className="text-input"
                                    style={{ padding: '4px 8px', fontSize: '12px', flexGrow: 1 }}
                                    value={editDraftForm.options[o]}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditDraftForm(prev => ({
                                        ...prev,
                                        options: { ...prev.options, [o]: val }
                                      }));
                                    }}
                                  />
                                </div>
                              ))}
                              <div style={{ marginTop: '4px' }}>
                                <strong>Correct: </strong>
                                <select
                                  className="select-input"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  value={editDraftForm.correctOption}
                                  onChange={(e) => setEditDraftForm(prev => ({ ...prev, correctOption: e.target.value }))}
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                              <div>A: {q.options.A}</div>
                              <div>B: {q.options.B}</div>
                              <div>C: {q.options.C}</div>
                              <div>D: {q.options.D}</div>
                              <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 800 }}>
                                Correct Option: {q.correctOption}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleReviewAction(q._id, 'edit', editDraftForm)}
                              >
                                Save & Approve
                              </button>
                              <button
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => setEditingDraftId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                className="btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px', background: '#10b981' }}
                                onClick={() => handleReviewAction(q._id, 'approve')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => startEditDraft(q)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444', borderColor: '#fee2e2' }}
                                onClick={() => handleReviewAction(q._id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* ─── ADD QUESTION MODAL ─── */}
      {showAddForm && (
        <div className="form-overlay" onClick={() => setShowAddForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>Add New Question</h2>
            <form onSubmit={handleCreateQuestion}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="label-text">Section</label>
                  <select className="select-input" value={newQ.section} onChange={(e) => setNewQ({ ...newQ, section: e.target.value })}>
                    <option value="mat">Mental Ability (MAT)</option>
                    <option value="arithmetic">Arithmetic</option>
                    <option value="language">Language</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label-text">Topic</label>
                  <input type="text" className="text-input" value={newQ.topic} onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label-text">Difficulty (0.0 - 1.0)</label>
                  <input type="number" step="0.05" min="0" max="1" className="text-input" value={newQ.difficulty} onChange={(e) => setNewQ({ ...newQ, difficulty: parseFloat(e.target.value) })} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                  <input type="checkbox" id="add-is-pyq" checked={newQ.isPYQ} onChange={(e) => setNewQ({ ...newQ, isPYQ: e.target.checked })} />
                  <label htmlFor="add-is-pyq" className="label-text" style={{ cursor: 'pointer' }}>Is Previous Year Question (PYQ)</label>
                </div>
                <div className="form-group-full">
                  <label className="label-text">Question Text (supports LaTeX \\( ... \\) and \\([ ... \\))</label>
                  <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>💡 Use <strong>_</strong> or <strong>___</strong> for a Tap-to-Fill blank.</span>
                    <button type="button" onClick={() => setNewQ(prev => ({ ...prev, questionText: prev.questionText + ' _' }))} style={{ padding: '2px 6px', fontSize: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>+ Insert Blank</button>
                  </div>
                  <textarea className="textarea-input" value={newQ.questionText} onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })} required />
                </div>
                
                {['A', 'B', 'C', 'D'].map(o => (
                  <div key={o} className="form-group">
                    <label className="label-text">Option {o}</label>
                    <input type="text" className="text-input" value={newQ.options[o]} onChange={(e) => {
                      const val = e.target.value;
                      setNewQ(prev => ({ ...prev, options: { ...prev.options, [o]: val } }));
                    }} required />
                  </div>
                ))}

                <div className="form-group">
                  <label className="label-text">Correct Option</label>
                  <select className="select-input" value={newQ.correctOption} onChange={(e) => setNewQ({ ...newQ, correctOption: e.target.value })}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <div className="form-group-full">
                  <label className="label-text">Explanation Text</label>
                  <textarea className="textarea-input" value={newQ.explanationText} onChange={(e) => setNewQ({ ...newQ, explanationText: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BULK IMPORT MODAL ─── */}
      {showImportForm && (
        <div className="form-overlay" onClick={() => setShowImportForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Bulk JSON Question Import</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Paste a valid JSON array of questions matching the schema. Status will default to active.
            </p>
            {importMessage && <div className="message-banner" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>{importMessage}</div>}
            <form onSubmit={handleBulkImport}>
              <div className="form-group-full" style={{ marginBottom: '24px' }}>
                <textarea
                  className="textarea-input"
                  style={{ minHeight: '260px', fontFamily: 'monospace', fontSize: '12px' }}
                  placeholder={`[\n  {\n    "examId": "jnvst",\n    "section": "arithmetic",\n    "topic": "fractions",\n    "difficulty": 0.4,\n    "questionText": "Question here...",\n    "options": { "A": "1", "B": "2", "C": "3", "D": "4" },\n    "correctOption": "C",\n    "explanationText": "Explanation here..."\n  }\n]`}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-outline" onClick={() => { setShowImportForm(false); setImportMessage(''); }}>Cancel</button>
                <button type="submit" className="btn-primary">Import Questions</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
