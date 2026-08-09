'use client';

import React, { useState, useEffect } from 'react';

export default function TestSeriesManager({ selectedExamId = 'jnvst' }) {
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [showCreateMockModal, setShowCreateMockModal] = useState(false);

  // New Series Form State
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    examId: selectedExamId || 'jnvst',
    description: '',
    isPremium: false
  });

  // New Mock Test Form State
  const [mockForm, setMockForm] = useState({
    title: '',
    testSeriesId: '',
    examId: selectedExamId || 'jnvst',
    durationMinutes: 120,
    totalQuestions: 80,
    totalMarks: 100,
    cutoffScore: 65,
    pyqYear: '',         // optional — set this for year-specific PYQ mock tests
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Test Series & Mock Tests from MongoDB
  const loadTestSeries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/test-series?examId=${selectedExamId || 'jnvst'}`);
      const data = await res.json();
      if (data.success) {
        setTestSeriesList(data.testSeries || []);
        if (data.testSeries && data.testSeries.length > 0) {
          setMockForm(prev => ({ ...prev, testSeriesId: data.testSeries[0]._id || data.testSeries[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load test series:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestSeries();
  }, [selectedExamId]);

  // Create Test Series
  const handleCreateSeries = async (e) => {
    e.preventDefault();
    if (!seriesForm.title) return alert('Please enter series title');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createSeries',
          data: {
            ...seriesForm,
            id: seriesForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            totalTests: 0,
            tests: []
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateSeriesModal(false);
        setSeriesForm({ title: '', examId: selectedExamId, description: '', isPremium: false });
        await loadTestSeries();
      } else {
        alert(data.error || 'Failed to create Test Series');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Create Mock Test
  const handleCreateMockTest = async (e) => {
    e.preventDefault();
    if (!mockForm.title || !mockForm.testSeriesId) return alert('Please complete title and test series selection');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createMockTest',
          data: {
            ...mockForm,
            id: mockForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            timeLimitSeconds: mockForm.durationMinutes * 60,
            sections: [
              { id: 'mat', name: 'Mental Ability Test', questionCount: 40, marksPerQuestion: 1.25 },
              { id: 'arithmetic', name: 'Arithmetic Test', questionCount: 20, marksPerQuestion: 1.25 },
              { id: 'language', name: 'Language Test', questionCount: 20, marksPerQuestion: 1.25 }
            ]
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateMockModal(false);
        setMockForm(prev => ({ ...prev, title: '' }));
        await loadTestSeries();
      } else {
        alert(data.error || 'Failed to publish Mock Test');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Question Linker State
  const [showLinkerModal, setShowLinkerModal] = useState(false);
  const [selectedMockForLink, setSelectedMockForLink] = useState(null);
  const [linkedQuestionIdsText, setLinkedQuestionIdsText] = useState('');
  const [linkerTab, setLinkerTab] = useState('year'); // 'year' | 'manual'
  const [pyqLinkYear, setPyqLinkYear] = useState(new Date().getFullYear() - 1);
  const [linkerResult, setLinkerResult] = useState(null);

  const openLinkerModal = (test) => {
    setSelectedMockForLink(test);
    const existingIds = test.questionIds || [];
    setLinkedQuestionIdsText(existingIds.join(', '));
    setPyqLinkYear(test.pyqYear || new Date().getFullYear() - 1);
    setLinkerTab('year');
    setLinkerResult(null);
    setShowLinkerModal(true);
  };

  // Auto-link by PYQ Year
  const handleLinkByYear = async (e) => {
    e.preventDefault();
    if (!selectedMockForLink || !pyqLinkYear) return;
    setSubmitting(true);
    setLinkerResult(null);
    try {
      const res = await fetch('/api/admin/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'linkByPyqYear',
          data: {
            mockTestId: selectedMockForLink.mockTestId || selectedMockForLink.id,
            examId: selectedExamId || 'jnvst',
            pyqYear: Number(pyqLinkYear),
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setLinkerResult({ type: 'success', message: `✅ Auto-linked ${data.result.questionCount} questions from ${pyqLinkYear} PYQ paper.` });
        await loadTestSeries();
      } else {
        setLinkerResult({ type: 'error', message: data.error || 'Failed to link questions by year' });
      }
    } catch (err) {
      setLinkerResult({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLinkedQuestions = async (e) => {
    e.preventDefault();
    if (!selectedMockForLink) return;
    setSubmitting(true);

    const idsArray = linkedQuestionIdsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'linkQuestions',
          data: {
            mockTestId: selectedMockForLink.mockTestId || selectedMockForLink.id,
            questionIds: idsArray
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowLinkerModal(false);
        await loadTestSeries();
      } else {
        alert(data.error || 'Failed to link questions');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
            <span>🏆 Test Series & Mock Tests Manager</span>
            <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
              MongoDB Connected
            </span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Manage full-length timed mock tests, question blueprints, and published exam packages.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCreateSeriesModal(true)}
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ➕ New Test Series
          </button>
          <button
            onClick={() => setShowCreateMockModal(true)}
            style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ➕ Publish Mock Test
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p>Fetching Test Series & Mock Tests from MongoDB...</p>
        </div>
      ) : testSeriesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
          <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No Test Series Created Yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px' }}>Create your first test series to publish full-length mock exams.</p>
          <button
            onClick={() => setShowCreateSeriesModal(true)}
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Create First Test Series
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {testSeriesList.map(series => (
            <div key={series._id || series.id} style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{series.title}</h3>
                    <span style={{ background: series.isPremium ? '#fef3c7' : '#dcfce7', color: series.isPremium ? '#d97706' : '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {series.isPremium ? 'PRO ONLY' : 'FREE TIER'}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{series.description || 'Full-length practice test package.'}</p>
                </div>

                <button
                  onClick={() => {
                    setMockForm(prev => ({ ...prev, testSeriesId: series._id || series.id }));
                    setShowCreateMockModal(true);
                  }}
                  style={{ background: '#fff', color: '#6366f1', border: '1px solid #6366f1', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  + Add Mock Test
                </button>
              </div>

              {/* Embedded Mock Tests List */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {!series.tests || series.tests.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                    No mock tests published in this series yet.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '12px 16px' }}>Mock Test Title</th>
                        <th style={{ padding: '12px 16px' }}>Duration</th>
                        <th style={{ padding: '12px 16px' }}>Questions</th>
                        <th style={{ padding: '12px 16px' }}>Total Marks</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {series.tests.map((test, idx) => (
                        <tr key={test.mockTestId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                            {test.title}
                            {test.pyqYear && (
                              <span style={{ marginLeft: '8px', background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px' }}>
                                📅 {test.pyqYear}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>{test.durationMinutes} Mins</td>
                          <td style={{ padding: '14px 16px' }}>
                            {test.totalQuestions === 80 ? (
                              <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                                ✅ Ready (80 Qs)
                              </span>
                            ) : (
                              <span style={{ background: '#fff7ed', color: '#c2410c', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #fed7aa' }}>
                                ⚠️ Incomplete ({test.totalQuestions || 0} Qs)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>{test.totalMarks} Marks</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                              PUBLISHED
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                            <button
                              onClick={() => openLinkerModal(test)}
                              style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'background 0.15s' }}
                            >
                              🔗 Link Questions
                            </button>
                            <a
                              href={`/exam-prep/${selectedExamId || 'jnvst'}/mock-test?templateId=${test.mockTestId}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', color: '#2563eb', border: '1px solid #dbeafe', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', fontSize: '0.8rem' }}
                            >
                              ▶️ Preview
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create Test Series */}
      {showCreateSeriesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>Create New Test Series</h3>
            <form onSubmit={handleCreateSeries} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Series Title</label>
                <input
                  type="text"
                  placeholder="e.g. JNVST Class 6 Selection Test Series 2026"
                  value={seriesForm.title}
                  onChange={e => setSeriesForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Description</label>
                <textarea
                  placeholder="Describe the test package contents..."
                  value={seriesForm.description}
                  onChange={e => setSeriesForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', rows: 3 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateSeriesModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submitting ? 'Creating...' : 'Save Test Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Mock Test */}
      {showCreateMockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>Publish New Mock Test</h3>
            <form onSubmit={handleCreateMockTest} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Target Test Series</label>
                <select
                  value={mockForm.testSeriesId}
                  onChange={e => setMockForm(prev => ({ ...prev, testSeriesId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                >
                  {testSeriesList.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Mock Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. Official JNVST Full Mock Test #4"
                  value={mockForm.title}
                  onChange={e => setMockForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Duration (Mins)</label>
                  <input
                    type="number"
                    value={mockForm.durationMinutes}
                    onChange={e => setMockForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value, 10) || 120 }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Total Questions</label>
                  <input
                    type="number"
                    value={mockForm.totalQuestions}
                    onChange={e => setMockForm(prev => ({ ...prev, totalQuestions: parseInt(e.target.value, 10) || 80 }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  📅 PYQ Year <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — for year-specific papers)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2020, 2022, 2023"
                  value={mockForm.pyqYear}
                  onChange={e => setMockForm(prev => ({ ...prev, pyqYear: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                  Set this to auto-link questions by year using the 🔗 Link Questions button after publishing.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateMockModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {submitting ? 'Publishing...' : 'Publish Mock Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Link Questions to Mock Test */}
      {showLinkerModal && selectedMockForLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '580px', width: '100%' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>🔗 Link Questions to Mock Test</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px' }}>
              Linking for: <strong>{selectedMockForLink.title}</strong>
            </p>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
              <button
                onClick={() => setLinkerTab('year')}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  background: linkerTab === 'year' ? '#4338ca' : 'transparent',
                  color: linkerTab === 'year' ? '#fff' : '#64748b' }}
              >
                📅 Auto-Link by PYQ Year
              </button>
              <button
                onClick={() => setLinkerTab('manual')}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  background: linkerTab === 'manual' ? '#4338ca' : 'transparent',
                  color: linkerTab === 'manual' ? '#fff' : '#64748b' }}
              >
                ✏️ Manual Question IDs
              </button>
            </div>

            {/* Result banner */}
            {linkerResult && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontWeight: 600, fontSize: '0.9rem',
                background: linkerResult.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: linkerResult.type === 'success' ? '#166534' : '#991b1b' }}>
                {linkerResult.message}
              </div>
            )}

            {/* TAB: Auto-Link by Year */}
            {linkerTab === 'year' && (
              <form onSubmit={handleLinkByYear} style={{ display: 'grid', gap: '16px' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 16px', fontSize: '0.88rem', color: '#0c4a6e' }}>
                  ℹ️ This will <strong>automatically find all questions</strong> in the database that have <code>isPYQ: true</code> + the year you select, and link them to this mock test in the correct section order (MAT → Arithmetic → Language).
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    📅 PYQ Year
                  </label>
                  <input
                    type="number"
                    min={2000}
                    max={2099}
                    value={pyqLinkYear}
                    onChange={e => setPyqLinkYear(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #6366f1', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center' }}
                    required
                  />
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                    e.g. 2020, 2022, 2023 — must match the <code>pyqYear</code> field on questions.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowLinkerModal(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#4338ca', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                    {submitting ? 'Linking...' : `🔗 Auto-Link ${pyqLinkYear} PYQs`}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: Manual IDs */}
            {linkerTab === 'manual' && (
              <form onSubmit={handleSaveLinkedQuestions} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Question / Template IDs (Comma Separated)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="e.g. jnvst-comp-moral, mat-analogy-01, mat-figure-01"
                    value={linkedQuestionIdsText}
                    onChange={e => setLinkedQuestionIdsText(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace', lineHeight: 1.5 }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '6px 0 0' }}>
                    Tip: Get IDs from the Questions table in the admin panel.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowLinkerModal(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#4338ca', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                    {submitting ? 'Linking...' : 'Save Linked Questions'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
