'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import SiteHeader from '../../../../components/layout/SiteHeader';

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

export default function FullMockTestPage({ params }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const examId = resolvedParams.examId || 'jnvst';

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0); // 0-indexed (0 to 79)
  const [userAnswers, setUserAnswers] = useState({}); // { 1: 'A', 2: 'C' }
  const [markedForReview, setMarkedForReview] = useState([]); // [3, 14]
  const [visited, setVisited] = useState({ 1: true });
  const [activeSection, setActiveSection] = useState('mat');
  const [timeLeft, setTimeLeft] = useState(7200); // 120 minutes = 7200s
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDebugJson, setShowDebugJson] = useState(false);

  const timerRef = useRef(null);

  // 1. Initialize Mock Test Session
  useEffect(() => {
    async function startMockTest() {
      try {
        let templateId = null;
        let mockTestId = null;
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          templateId = searchParams.get('templateId') || searchParams.get('spreadsheetId') || searchParams.get('id');
          mockTestId = searchParams.get('mockTestId');
        }

        const res = await fetch('/api/practice/mock-test/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId, templateId, mockTestId, userId: 'guest_child' })
        });
        const data = await res.json();
        if (data.success) {
          setSessionId(data.sessionId);
          setQuestions(data.questions || []);
          setTimeLeft(data.timeLimitSeconds || 7200);
        } else {
          alert(data.error || 'Failed to start mock test session.');
        }
      } catch (err) {
        console.error('Failed to start mock test:', err);
      } finally {
        setLoading(false);
      }
    }
    startMockTest();
  }, [examId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || !sessionId) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, sessionId]);

  // Auto submit when time expires
  const handleAutoSubmit = () => {
    submitMockTest();
  };

  // Switch question
  const jumpToQuestion = (idx) => {
    setCurrentIdx(idx);
    const qNum = idx + 1;
    setVisited(prev => ({ ...prev, [qNum]: true }));

    const q = questions[idx];
    if (q && q.section !== activeSection) {
      setActiveSection(q.section);
    }
  };

  const handleSelectOption = (optionKey) => {
    const qNum = currentIdx + 1;
    setUserAnswers(prev => ({
      ...prev,
      [qNum]: optionKey
    }));
  };

  const toggleMarkForReview = () => {
    const qNum = currentIdx + 1;
    setMarkedForReview(prev => 
      prev.includes(qNum) ? prev.filter(n => n !== qNum) : [...prev, qNum]
    );
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      jumpToQuestion(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      jumpToQuestion(currentIdx - 1);
    }
  };

  const submitMockTest = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const res = await fetch('/api/practice/mock-test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAnswers,
          markedForReview,
          timeTakenSeconds: 7200 - timeLeft
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/exam-prep/${examId}/mock-test/report/${sessionId}`);
      } else {
        alert(data.error || 'Failed to submit exam.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitting(false);
    }
  };

  // Format Timer Format (HH:MM:SS)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <h3>Assembling Official 80-Question JNVST Mock Test...</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Preparing Mental Ability, Arithmetic & Language questions</p>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || {};
  const currentQNum = currentIdx + 1;

  // Filter sections
  const matQuestions = questions.filter(q => q.section === 'mat');
  const arithmeticQuestions = questions.filter(q => q.section === 'arithmetic');
  const languageQuestions = questions.filter(q => q.section === 'language');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      <SiteHeader />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .mock-grid-wrap {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            padding: 0 12px !important;
          }
          .mock-player-box {
            padding: 20px !important;
          }
        }
        @media (max-width: 640px) {
          .mock-header-bar {
            padding: 14px 16px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .mock-timer-wrap {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .mock-sec-tab {
            font-size: 12px !important;
            padding: 12px 10px !important;
            white-space: nowrap !important;
          }
          .mock-opt-btn {
            padding: 12px 14px !important;
            min-height: 48px !important;
          }
          .mock-palette-grid {
            grid-template-columns: repeat(5, 1fr) !important;
          }
        }
      ` }} />

      {/* Mock Test Header Bar */}
      <div className="mock-header-bar" style={{ background: '#0f172a', color: '#fff', padding: '16px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏆 JNVST Full Selection Mock Test</span>
            <span style={{ fontSize: '0.75rem', background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>Official 80 Qs</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0' }}>Duration: 120 Mins · Total Marks: 100 · Cutoff: 65 Marks</p>
        </div>

        {/* Timer Display */}
        <div className="mock-timer-wrap" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: timeLeft < 600 ? '#7f1d1d' : '#1e293b', border: `1px solid ${timeLeft < 600 ? '#ef4444' : '#475569'}`, padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Remaining</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: timeLeft < 600 ? '#f87171' : '#38bdf8' }}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
        <button
          className="mock-sec-tab"
          onClick={() => { setActiveSection('mat'); jumpToQuestion(0); }}
          style={{ padding: '14px 16px', border: 'none', borderBottom: activeSection === 'mat' ? '3px solid #6366f1' : '3px solid transparent', background: 'none', fontWeight: 600, color: activeSection === 'mat' ? '#6366f1' : '#64748b', cursor: 'pointer' }}
        >
          🧠 1. MAT (Q1 - Q40)
        </button>
        <button
          className="mock-sec-tab"
          onClick={() => { setActiveSection('arithmetic'); jumpToQuestion(40); }}
          style={{ padding: '14px 16px', border: 'none', borderBottom: activeSection === 'arithmetic' ? '3px solid #6366f1' : '3px solid transparent', background: 'none', fontWeight: 600, color: activeSection === 'arithmetic' ? '#6366f1' : '#64748b', cursor: 'pointer' }}
        >
          🔢 2. Arithmetic (Q41 - Q60)
        </button>
        <button
          className="mock-sec-tab"
          onClick={() => { setActiveSection('language'); jumpToQuestion(60); }}
          style={{ padding: '14px 16px', border: 'none', borderBottom: activeSection === 'language' ? '3px solid #6366f1' : '3px solid transparent', background: 'none', fontWeight: 600, color: activeSection === 'language' ? '#6366f1' : '#64748b', cursor: 'pointer' }}
        >
          📖 3. Language (Q61 - Q80)
        </button>
      </div>

      {/* Main Workspace: Question & Palette Drawer */}
      <div className="mock-grid-wrap" style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Left Column: Question Player */}
        <div className="mock-player-box" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
              Question {currentQNum} of 80 · {currentQ.sectionName}
            </span>

            <button
              onClick={toggleMarkForReview}
              style={{ background: markedForReview.includes(currentQNum) ? '#fae8ff' : '#f8fafc', color: markedForReview.includes(currentQNum) ? '#a855f7' : '#64748b', border: `1px solid ${markedForReview.includes(currentQNum) ? '#d8b4fe' : '#cbd5e1'}`, padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {markedForReview.includes(currentQNum) ? '🟣 Marked for Review' : '⚪ Mark for Review'}
            </button>
          </div>

          {/* Question Text */}
          <div style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '28px', color: '#0f172a' }}>
            {parseMathAndText(currentQ.questionText || 'Question prompt')}
          </div>

          {/* Question Figure Image */}
          {(currentQ.questionImage || currentQ.questionImageUrl || currentQ.image || currentQ.figure_image) && (
            <div style={{ marginBottom: '24px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
              <img
                src={currentQ.questionImage || currentQ.questionImageUrl || currentQ.image || currentQ.figure_image}
                alt="Question figure"
                style={{
                  maxWidth: '100%',
                  width: 'auto',
                  maxHeight: '340px',
                  minHeight: '140px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  padding: '8px',
                  background: '#fff',
                  cursor: 'zoom-in',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onError={(e) => {
                  console.warn('Question figure image failed to load:', e.currentTarget.src);
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.display = 'none';
                  }
                }}
                onClick={(e) => {
                  if (e.currentTarget.style.transform === 'scale(1.4)') {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = '1';
                  } else {
                    e.currentTarget.style.transform = 'scale(1.4)';
                    e.currentTarget.style.zIndex = '10';
                  }
                }}
                title="Click to zoom image"
              />
            </div>
          )}

          {/* Determine if options fit nicely in a 2x2 Grid */}
          {(() => {
            const isShortOptions = ['A', 'B', 'C', 'D'].every(l => {
              const txt = currentQ.options ? currentQ.options[l] : '';
              if (!txt) return true;
              if (txt.includes('<svg')) return true;
              return String(txt).length < 55;
            });
            const use2ColGrid = isShortOptions || currentQ.section === 'mat' || currentQ.section === 'arithmetic';

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: use2ColGrid ? 'repeat(2, 1fr)' : '1fr',
                gap: '12px',
                marginBottom: '28px'
              }}>
                {['A', 'B', 'C', 'D'].map(letter => {
                  const optText = currentQ.options ? currentQ.options[letter] : null;
                  const isSelected = userAnswers[currentQNum] === letter;
                  const optImage = (currentQ.optionsImages && currentQ.optionsImages[letter]) || currentQ[`option${letter}Image`];

                  if (!optText && !optImage) return null;

                  // Hide redundant text label if optImage exists and text is generic like "Figure 1", "Figure 2" or "Option A"
                  const isGenericText = optImage && optText && (
                    optText.toLowerCase().includes('figure') ||
                    optText.toLowerCase().includes('option') ||
                    ['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(optText.trim().toLowerCase())
                  );
                  const showText = optText && !isGenericText;

                  return (
                    <div
                      key={letter}
                      className="mock-opt-btn"
                      onClick={() => handleSelectOption(letter)}
                      style={{
                        padding: optImage ? '6px 10px' : (optText && optText.includes('<svg') ? '10px 14px' : '12px 16px'),
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
                        background: isSelected ? '#f5f3ff' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: optImage ? 'column' : 'row',
                        alignItems: 'flex-start',
                        gap: optImage ? '4px' : '10px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isSelected ? '#6366f1' : '#e2e8f0',
                          color: isSelected ? '#fff' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          flexShrink: 0
                        }}>
                          {letter}
                        </div>
                        {showText && (
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: isSelected ? '#1e1b4b' : '#334155', flex: 1, overflow: 'hidden' }}>
                            {parseMathAndText(optText)}
                          </div>
                        )}
                      </div>

                      {optImage && (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                          <img
                            src={optImage}
                            alt={`Option ${letter} figure`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '85px',
                              objectFit: 'contain',
                              borderRadius: '4px',
                              display: 'block'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', opacity: currentIdx === 0 ? 0.5 : 1, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              ← Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === questions.length - 1}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Next Question →
            </button>
          </div>

          {/* Debug Question JSON Inspector */}
          <div style={{ marginTop: '24px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
            <button
              onClick={() => setShowDebugJson(!showDebugJson)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🛠️ {showDebugJson ? 'Hide Debug Question JSON' : 'Show Debug Question JSON'}
            </button>

            {showDebugJson && (
              <pre style={{
                marginTop: '12px',
                padding: '14px 18px',
                background: '#0f172a',
                color: '#38bdf8',
                borderRadius: '10px',
                fontSize: '0.82rem',
                maxHeight: '320px',
                overflow: 'auto',
                fontFamily: 'monospace',
                lineHeight: 1.5,
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
              }}>
                {JSON.stringify(currentQ, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Question Palette Drawer (1 to 80 Grid) */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', height: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px' }}>Question Palette (80 Qs)</h3>

          {/* Palette Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: '#64748b', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#22c55e' }} /> Answered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#a855f7' }} /> Marked</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} /> Unanswered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#e2e8f0' }} /> Not Visited</div>
          </div>

          {/* Palette Grid (1 to 80 Buttons) */}
          <div className="mock-palette-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {questions.map((q, idx) => {
              const qNum = idx + 1;
              const isAns = userAnswers[qNum] !== undefined;
              const isMarked = markedForReview.includes(qNum);
              const isVis = visited[qNum];
              const isCurrent = idx === currentIdx;

              let bgColor = '#f1f5f9';
              let textColor = '#475569';

              if (isMarked) {
                bgColor = '#a855f7';
                textColor = '#fff';
              } else if (isAns) {
                bgColor = '#22c55e';
                textColor = '#fff';
              } else if (isVis) {
                bgColor = '#ef4444';
                textColor = '#fff';
              }

              return (
                <button
                  key={qNum}
                  onClick={() => jumpToQuestion(idx)}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid #0f172a' : 'none',
                    background: bgColor,
                    color: textColor,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 12px' }}>Submit JNVST Mock Test?</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 24px' }}>
              You have answered <strong>{Object.keys(userAnswers).length}</strong> out of <strong>80 questions</strong>.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Continue Exam
              </button>
              <button
                onClick={submitMockTest}
                disabled={submitting}
                style={{ flex: 1, padding: '12px', border: 'none', background: '#22c55e', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
