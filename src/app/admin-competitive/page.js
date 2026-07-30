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

  // Question Form Modal State (Create / Edit / Duplicate)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    examId: 'jnvst',
    section: 'arithmetic',
    qNumber: 1,
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanationText: ''
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Batch JSON & Text Parser Import Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchParsing, setBatchParsing] = useState(false);

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

  // Open Form to Create New Question
  const handleOpenCreateQuestion = () => {
    setEditingQuestionId(null);
    setQuestionFormData({
      examId: selectedExamId,
      section: 'arithmetic',
      qNumber: questions.length + 1,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanationText: ''
    });
    setShowQuestionModal(true);
  };

  // Open Form to Edit Existing Question
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q._id || q.id);
    const opts = q.options || {};
    setQuestionFormData({
      examId: q.examId || selectedExamId,
      section: q.section || 'arithmetic',
      qNumber: q.qNumber || 1,
      questionText: q.questionText || '',
      optionA: typeof opts === 'object' ? (opts.A || opts.optionA || '') : '',
      optionB: typeof opts === 'object' ? (opts.B || opts.optionB || '') : '',
      optionC: typeof opts === 'object' ? (opts.C || opts.optionC || '') : '',
      optionD: typeof opts === 'object' ? (opts.D || opts.optionD || '') : '',
      correctOption: q.correctOption || q.answer || 'A',
      explanationText: q.explanationText || ''
    });
    setShowQuestionModal(true);
  };

  // Open Form to Duplicate Question
  const handleDuplicateQuestion = (q) => {
    setEditingQuestionId(null); // Create new
    const opts = q.options || {};
    setQuestionFormData({
      examId: q.examId || selectedExamId,
      section: q.section || 'arithmetic',
      qNumber: questions.length + 1,
      questionText: (q.questionText || '') + ' (Copy)',
      optionA: typeof opts === 'object' ? (opts.A || opts.optionA || '') : '',
      optionB: typeof opts === 'object' ? (opts.B || opts.optionB || '') : '',
      optionC: typeof opts === 'object' ? (opts.C || opts.optionC || '') : '',
      optionD: typeof opts === 'object' ? (opts.D || opts.optionD || '') : '',
      correctOption: q.correctOption || q.answer || 'A',
      explanationText: q.explanationText || ''
    });
    setShowQuestionModal(true);
  };

  // Save Single Question Form (Create / Edit)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      const payload = {
        _id: editingQuestionId,
        id: editingQuestionId,
        examId: questionFormData.examId,
        section: questionFormData.section,
        qNumber: Number(questionFormData.qNumber),
        questionText: questionFormData.questionText,
        options: {
          A: questionFormData.optionA,
          B: questionFormData.optionB,
          C: questionFormData.optionC,
          D: questionFormData.optionD
        },
        correctOption: questionFormData.correctOption,
        answer: questionFormData.correctOption,
        explanationText: questionFormData.explanationText,
        status: 'active'
      };

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setShowQuestionModal(false);
        loadQuestionBank();
      } else {
        alert(data.error || 'Failed to save question.');
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Error saving question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${qId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadQuestionBank();
      } else {
        alert(data.error || 'Failed to delete question.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting question.');
    }
  };

  // Batch Parse & Import JSON / Raw Text
  const handleBatchImport = async () => {
    if (!batchRawText.trim()) return alert('Please paste JSON or text questions.');
    setBatchParsing(true);

    try {
      let questionsToImport = [];
      const trimmed = batchRawText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // Parse JSON with resilient JS object fallback
        try {
          const parsed = JSON.parse(trimmed);
          questionsToImport = Array.isArray(parsed) ? parsed : [parsed];
        } catch (jsonErr) {
          try {
            const relaxedFn = new Function(`return ${trimmed}`);
            const parsed = relaxedFn();
            questionsToImport = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e2) {
            throw new Error(`JSON Syntax Error: ${jsonErr.message}`);
          }
        }
      } else {
        // Parse Raw Formatted Text (Question blocks)
        const blocks = trimmed.split(/\n\s*\n/);
        blocks.forEach((block, idx) => {
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const qObj = {
              examId: selectedExamId,
              section: 'arithmetic',
              qNumber: idx + 1,
              questionText: lines[0],
              options: {
                A: lines[1] || 'Option A',
                B: lines[2] || 'Option B',
                C: lines[3] || 'Option C',
                D: lines[4] || 'Option D'
              },
              correctOption: 'A',
              explanationText: ''
            };
            questionsToImport.push(qObj);
          }
        });
      }

      if (questionsToImport.length === 0) return alert('No valid questions found to import.');

      // Save each question to DB
      for (const q of questionsToImport) {
        const payload = {
          examId: q.examId || selectedExamId,
          section: q.section || 'arithmetic',
          qNumber: Number(q.qNumber || q.qNum || 1),
          questionText: q.questionText || q.question || '',
          options: q.options || {
            A: q.optionA || 'Option A',
            B: q.optionB || 'Option B',
            C: q.optionC || 'Option C',
            D: q.optionD || 'Option D'
          },
          correctOption: q.correctOption || q.answer || 'A',
          explanationText: q.explanationText || q.explanation || '',
          status: 'active'
        };

        await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      alert(`✅ Successfully imported ${questionsToImport.length} questions!`);
      setShowBatchModal(false);
      setBatchRawText('');
      loadQuestionBank();
    } catch (err) {
      console.error('Batch import failed:', err);
      alert('Failed to parse JSON or text: ' + err.message);
    } finally {
      setBatchParsing(false);
    }
  };

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
                href={`/exam-prep/${selectedExamId}/mock-test?templateId=2025-jnvst-official-pyq-template`}
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
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>{questions.length} Questions</div>
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
            🗃️ Static Question Bank ({questions.length})
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
                        justifyContent: 'space-between',
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

        {/* Tab 3: Static Question Bank Explorer & Production Management Suite */}
        {activeTab === 'question-bank' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  🗃️ Static Sequential Question Bank ({questions.length})
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Create, edit, duplicate, delete, and bulk import static questions with live KaTeX rendering.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Exam Select */}
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

                {/* Batch Import Button */}
                <button
                  onClick={() => setShowBatchModal(true)}
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Parse JSON / Text
                </button>

                {/* Create Question Button */}
                <button
                  onClick={handleOpenCreateQuestion}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  ➕ Add New Question
                </button>
              </div>
            </div>

            {/* Section Filter Pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${questions.length})` },
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredQuestions.map((q, idx) => {
                  const qId = q._id || q.id || idx;
                  const isExpanded = expandedQuestionId === qId;

                  return (
                    <div
                      key={qId}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '18px 22px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        
                        {/* Question Badge & Title */}
                        <div
                          onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                          style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, cursor: 'pointer' }}
                        >
                          <span style={{
                            background: '#4338ca',
                            color: '#fff',
                            fontWeight: 900,
                            borderRadius: '50%',
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}>
                            {q.qNumber || idx + 1}
                          </span>

                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.5 }}>
                              {parseMathAndText(q.questionText || 'Static Question')}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                              Section: <strong>{q.sectionName || q.section || 'General'}</strong> • Key: <strong style={{ color: '#059669' }}>{q.correctOption || q.answer || 'A'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Edit, Duplicate, Delete, Expand */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleEditQuestion(q)}
                            title="Edit Question"
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={() => handleDuplicateQuestion(q)}
                            title="Duplicate Question"
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            👯 Duplicate
                          </button>

                          <button
                            onClick={() => handleDeleteQuestion(qId)}
                            title="Delete Question"
                            style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>

                          <button
                            onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Options Breakdown Drawer */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Options Breakdown:
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            {['A', 'B', 'C', 'D'].map(letter => {
                              const opts = q.options || {};
                              const val = typeof opts === 'object' ? (opts[letter] || opts[`option${letter}`]) : null;
                              if (!val) return null;
                              const isCorrect = (q.correctOption === letter || String(q.answer) === letter);

                              return (
                                <div
                                  key={letter}
                                  style={{
                                    background: isCorrect ? '#f0fdf4' : '#ffffff',
                                    border: isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    fontSize: '0.88rem',
                                    fontWeight: isCorrect ? 800 : 500
                                  }}
                                >
                                  <strong>({letter})</strong> {parseMathAndText(String(val))}
                                </div>
                              );
                            })}
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

      {/* QUESTION FORM MODAL (CREATE / EDIT / DUPLICATE) */}
      {showQuestionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {editingQuestionId ? '✏️ Edit Question' : '➕ Create New Question'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Exam ID</label>
                  <select
                    value={questionFormData.examId}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, examId: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="jnvst">JNVST Class 6</option>
                    <option value="imo">IMO Olympiad</option>
                    <option value="nso">NSO Olympiad</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Section</label>
                  <select
                    value={questionFormData.section}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, section: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="mat">Mental Ability (MAT)</option>
                    <option value="arithmetic">Arithmetic (Math)</option>
                    <option value="language">Language (Reading)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Q. Number</label>
                  <input
                    type="number"
                    value={questionFormData.qNumber}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, qNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Question Text (KaTeX &amp; SVG Enabled)</label>
                <textarea
                  rows={3}
                  value={questionFormData.questionText}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, questionText: e.target.value })}
                  placeholder="Enter question text or KaTeX formula e.g. What is $\frac{13}{4}$? or <svg>..."
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Option A</label>
                  <input
                    type="text"
                    value={questionFormData.optionA}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, optionA: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Option B</label>
                  <input
                    type="text"
                    value={questionFormData.optionB}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, optionB: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Option C</label>
                  <input
                    type="text"
                    value={questionFormData.optionC}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, optionC: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Option D</label>
                  <input
                    type="text"
                    value={questionFormData.optionD}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, optionD: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Correct Answer Key</label>
                  <select
                    value={questionFormData.correctOption}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, correctOption: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, color: '#059669' }}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Solution Explanation</label>
                  <input
                    type="text"
                    value={questionFormData.explanationText}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, explanationText: e.target.value })}
                    placeholder="Step-by-step answer explanation..."
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuestion}
                  style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  {savingQuestion ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH PARSE JSON & RAW TEXT IMPORT MODAL */}
      {showBatchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '750px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                📋 Batch Import JSON or Raw Text
              </h3>
              <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748b' }}>
              Paste a JSON array of questions or block formatted question text. The parser will automatically process and insert them into MongoDB.
            </p>

            <textarea
              rows={12}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder={`Example JSON Format:\n[\n  {\n    "qNumber": 1,\n    "questionText": "What is 15 - 6?",\n    "optionA": "6", "optionB": "9", "optionC": "12", "optionD": "15",\n    "correctOption": "B",\n    "explanationText": "15 - 6 = 9"\n  }\n]`}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBatchImport}
                disabled={batchParsing}
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                {batchParsing ? 'Parsing & Importing...' : '🚀 Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
