'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import katex from 'katex';
import SiteHeader from '@/components/layout/SiteHeader';
import PartRenderer from '@/components/practice/PartRenderer';
import FramedImage from '@/components/common/FramedImage';
import { formatPracticeUrl } from '@/lib/curriculum/urlHelpers';

function parseMdTable(tableStr) {
  const lines = tableStr.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
  if (lines.length < 2) return null;
  const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  const isSepRow = l => /^\|[\s|:\-]+\|$/.test(l);
  let bodyLines = lines.slice(1);
  if (bodyLines.length > 0 && isSepRow(bodyLines[0])) bodyLines = bodyLines.slice(1);
  const rows = bodyLines.map(l => l.split('|').map(c => c.trim()).filter(Boolean));
  return (
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit', border: '2px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#1e3a5f', color: '#fff' }}>
            {headerCells.map((cell, ci) => (
              <th key={ci} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, borderRight: ci < headerCells.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#f8fafc' : '#fff' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '8px 14px', textAlign: 'center', borderTop: '1px solid #e2e8f0', borderRight: ci < row.length - 1 ? '1px solid #e2e8f0' : 'none', fontWeight: ci === 0 ? 700 : 500, color: ci === 0 ? '#1e3a5f' : '#374151' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseMathAndText(text) {
  if (!text) return '';
  let str = typeof text === 'string' ? text : String(text);
  str = str.replace(/\\n/g, '\n').replace(/\/n/g, '\n');
  const trimmed = str.trim();

  if (trimmed.startsWith('<svg') || trimmed.startsWith('<div') || trimmed.startsWith('<table')) {
    return <div dangerouslySetInnerHTML={{ __html: str }} style={{ display: 'flex', justifyContent: 'center', padding: '6px' }} />;
  }

  const htmlBlockRe = /(<(?:div|table|svg)[^>]*>[\s\S]*?<\/(?:div|table|svg)>)/g;
  const topSegments = [];
  let lastIdx = 0;
  let m;
  while ((m = htmlBlockRe.exec(str)) !== null) {
    if (m.index > lastIdx) topSegments.push({ type: 'mixed', content: str.slice(lastIdx, m.index) });
    topSegments.push({ type: 'html', content: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < str.length) topSegments.push({ type: 'mixed', content: str.slice(lastIdx) });

  const renderMixed = (mixedStr, baseIdx) => {
    const lines = mixedStr.split('\n');
    const segments = [];
    let i = 0;
    while (i < lines.length) {
      if (lines[i].trim().startsWith('|')) {
        let j = i;
        while (j < lines.length && lines[j].trim().startsWith('|')) j++;
        segments.push({ type: 'table', content: lines.slice(i, j).join('\n') });
        i = j;
      } else {
        let j = i;
        while (j < lines.length && !lines[j].trim().startsWith('|')) j++;
        segments.push({ type: 'text', content: lines.slice(i, j).join('\n') });
        i = j;
      }
    }

    const renderTextSeg = (segText, segIdx) => {
      const parts = segText.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);
      return (
        <React.Fragment key={`${baseIdx}-${segIdx}`}>
          {parts.map((part, pi) => {
            const key = `${baseIdx}-${segIdx}-${pi}`;
            if (part.startsWith('\\(') && part.endsWith('\\)')) {
              try { return <span key={key} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2,-2), { displayMode:false, throwOnError:false }) }} />; } catch { return <span key={key}>{part}</span>; }
            } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
              try { return <div key={key} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2,-2), { displayMode:true, throwOnError:false }) }} />; } catch { return <div key={key}>{part}</div>; }
            } else if (part.startsWith('$$') && part.endsWith('$$')) {
              try { return <div key={key} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2,-2), { displayMode:true, throwOnError:false }) }} />; } catch { return <div key={key}>{part}</div>; }
            } else if (part.startsWith('$') && part.endsWith('$')) {
              try { return <span key={key} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(1,-1), { displayMode:false, throwOnError:false }) }} />; } catch { return <span key={key}>{part}</span>; }
            }
            const html = part
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n/g, '<br />');
            return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
          })}
        </React.Fragment>
      );
    };

    return segments.map((seg, si) => {
      if (seg.type === 'table') {
        const tbl = parseMdTable(seg.content);
        return tbl ? <React.Fragment key={`${baseIdx}-tbl-${si}`}>{tbl}</React.Fragment> : null;
      }
      return renderTextSeg(seg.content, si);
    });
  };

  return topSegments.map((seg, si) => {
    if (seg.type === 'html') {
      return <div key={si} dangerouslySetInnerHTML={{ __html: seg.content }} style={{ margin: '4px 0' }} />;
    }
    return <React.Fragment key={si}>{renderMixed(seg.content, si)}</React.Fragment>;
  });
}

function isSvgString(v) {
  return typeof v === 'string' && v.trim().startsWith('<svg');
}

function getOptionsLayout(options) {
  if (!options) return 'one-col';
  const vals = Object.values(options);
  if (vals.some(v => typeof v === 'object' && v !== null && v.imageUrl)) return 'one-col';
  if (vals.length === 4 && vals.every(v => isSvgString(v))) return 'svg-col';
  if (vals.every(v => String(v).length <= 30) && vals.length === 4) return 'two-col';
  return 'one-col';
}

export default function SectionPracticePlayer({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();

  const examId = params.examId || 'jnvst';
  const sectionId = params.section || 'arithmetic';
  const topic = searchParams.get('topic') || null;
  const templateId = searchParams.get('templateId') || null;
  const userId = searchParams.get('userId') || 'guest_child';

  const [sessionId, setSessionId] = useState(null);
  const [sessionLength, setSessionLength] = useState(15);
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDebugJson, setShowDebugJson] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  const [exam, setExam] = useState(null);
  const [targetPaceSeconds, setTargetPaceSeconds] = useState(72);
  const targetPaceSecondsRef = useRef(72);
  const [timeLeft, setTimeLeft] = useState(72);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const handleSubmitAnswerRef = useRef(null);
  const handleTimeOutRef = useRef(null);

  useEffect(() => {
    targetPaceSecondsRef.current = targetPaceSeconds;
  }, [targetPaceSeconds]);

  useEffect(() => {
    if (!examId) return;
    async function loadExam() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
          const sec = data.exam.sections?.find(s => s.id === sectionId);
          if (sec && sec.timeLimitMinutes && sec.questionCount) {
            const pace = Math.round((sec.timeLimitMinutes * 60) / sec.questionCount);
            setTargetPaceSeconds(pace);
            setTimeLeft(pace);
          }
        }
      } catch (err) {
        console.error('Failed to load exam config:', err);
      }
    }
    loadExam();
  }, [examId, sectionId]);

  useEffect(() => {
    if (!examId) return;
    async function startSession() {
      try {
        const res = await fetch('/api/practice/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId, section: sectionId, userId, topic, templateId })
        });
        const data = await res.json();
        if (data.success) {
          setSessionId(data.sessionId);
          setSessionLength(data.sessionLength || 15);
          setQuestion(data.question);
          startTimeRef.current = Date.now();
          resetTimer();
        } else {
          setError(data.error || 'Failed to start session');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    startSession();
    return () => clearInterval(timerRef.current);
  }, [examId, sectionId, userId, topic, templateId]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(targetPaceSecondsRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (handleTimeOutRef.current) {
            handleTimeOutRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);

    const timeTakenSeconds = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);

    fetch('/api/practice/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionId: question?._id || question?.id,
        selectedOption: null,
        timeTakenSeconds,
        isTimeout: true
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeedback(data);
          setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }
      })
      .catch(err => console.error('Timeout submit error:', err));
  }, [isAnswered, sessionId, question]);

  useEffect(() => {
    handleTimeOutRef.current = handleTimeOut;
  }, [handleTimeOut]);

  const handleSubmitAnswer = useCallback((optionKey) => {
    if (isAnswered || !sessionId || !question) return;

    setSelectedOption(optionKey);
    setIsAnswered(true);
    clearInterval(timerRef.current);

    const timeTakenSeconds = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);

    fetch('/api/practice/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionId: question._id || question.id,
        selectedOption: optionKey,
        timeTakenSeconds
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeedback(data);
          if (data.isCorrect) {
            setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
          } else {
            setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
          }
        } else {
          setError(data.error || 'Failed to submit answer');
        }
      })
      .catch(err => setError(err.message));
  }, [isAnswered, sessionId, question]);

  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || !question) return;
      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key) && !isAnswered) {
        if (question.options && question.options[key]) {
          handleSubmitAnswerRef.current?.(key);
        }
      }

      if (e.key === 'Enter' && isAnswered) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, loading, question]);

  const handleNext = () => {
    if (questionIndex >= sessionLength) {
      router.push(`/exam-prep/${examId}/report/${sessionId}`);
      return;
    }

    setLoading(true);
    setSelectedOption(null);
    setIsAnswered(false);
    setFeedback(null);
    setQuestionIndex(prev => prev + 1);

    if (feedback?.nextQuestion) {
      setQuestion(feedback.nextQuestion);
      setLoading(false);
      resetTimer();
    } else {
      fetch(`/api/practice/next?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.question) {
            setQuestion(data.question);
            resetTimer();
          } else {
            router.push(`/exam-prep/${examId}/report/${sessionId}`);
          }
        })
        .catch(() => router.push(`/exam-prep/${examId}/report/${sessionId}`))
        .finally(() => setLoading(false));
    }
  };

  const getSectionBadge = () => {
    switch (sectionId) {
      case 'mat': return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe', text: 'Mental Ability (MAT)' };
      case 'arithmetic': return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', text: 'Arithmetic Test' };
      case 'language': return { bg: '#fef3c7', color: '#92400e', border: '#fde68a', text: 'Language Test' };
      default: return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', text: sectionId.toUpperCase() };
    }
  };

  const badge = getSectionBadge();

  if (loading) {
    return (
      <div className="practice-root">
        <SiteHeader />
        <main className="practice-container flex-center">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Practice Question...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-root">
        <SiteHeader />
        <main className="practice-container flex-center">
          <div className="error-card">
            <h2>Error Loading Practice</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  const optionsLayout = getOptionsLayout(question?.options);

  return (
    <div className="practice-root">
      <SiteHeader />

      <style>{`
        .practice-root { min-height: 100vh; background-color: #f8fafc; color: #0f172a; font-family: 'Outfit', sans-serif; display: flex; flex-direction: column; }
        .practice-container { width: 100%; max-width: 860px; margin: 0 auto; padding: 24px 16px 60px; flex: 1; display: flex; flex-direction: column; }
        .flex-center { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .practice-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .breadcrumb-nav { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: #64748b; }
        .breadcrumb-nav a { color: #4f46e5; text-decoration: none; }
        .breadcrumb-nav a:hover { text-decoration: underline; }
        .score-pill-group { display: flex; align-items: center; gap: 10px; }
        .score-badge { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 9999px; font-size: 0.85rem; font-weight: 700; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .score-correct { color: #16a34a; }
        .score-incorrect { color: #dc2626; }
        .timer-circle { width: 44px; height: 44px; border-radius: 50%; border: 3px solid #6366f1; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; color: #4338ca; background: #eef2ff; transition: all 0.3s ease; }
        .timer-circle.timer-warning { border-color: #ef4444; color: #dc2626; background: #fef2f2; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .progress-bar-container { width: 100%; height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; margin-bottom: 24px; position: relative; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%); transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 9999px; }
        .progress-text { position: absolute; right: 0; top: -20px; font-size: 0.75rem; font-weight: 700; color: #64748b; }
        .question-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); margin-bottom: 20px; display: flex; flex-direction: column; gap: 20px; }
        .topic-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
        .question-text-box { font-size: 1.15rem; font-weight: 700; color: #0f172a; line-height: 1.6; }
        .options-grid { display: grid; gap: 12px; }
        .options-grid.one-col { grid-template-columns: 1fr; }
        .options-grid.two-col { grid-template-columns: 1fr 1fr; }
        .options-grid.svg-col { grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .options-grid.two-col, .options-grid.svg-col { grid-template-columns: 1fr; } }
        .option-button { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border: 2px solid #e2e8f0; border-radius: 14px; background: #ffffff; color: #1e293b; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; text-align: left; position: relative; width: 100%; outline: none; }
        .options-grid.svg-col .option-button { flex-direction: column; align-items: center; justify-content: center; padding: 12px; }
        .option-button:hover:not(:disabled) { border-color: #6366f1; background: #f8fafc; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08); }
        .option-key { width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .option-content { flex: 1; display: flex; align-items: center; }
        .option-selected { border-color: #6366f1; background: #eef2ff; }
        .option-correct { border-color: #22c55e !important; background: #f0fdf4 !important; color: #15803d !important; }
        .option-correct .option-key { background: #22c55e !important; color: #ffffff !important; }
        .option-wrong { border-color: #ef4444 !important; background: #fef2f2 !important; color: #b91c1c !important; }
        .option-wrong .option-key { background: #ef4444 !important; color: #ffffff !important; }
        .feedback-box { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 14px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .feedback-header { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 800; }
        .feedback-correct { color: #16a34a; }
        .feedback-incorrect { color: #dc2626; }
        .feedback-timeout { color: #d97706; }
        .feedback-icon { font-size: 1.4rem; }
        .explanation-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .explanation-text { font-size: 0.95rem; color: #334155; line-height: 1.5; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .btn-next { width: 100%; padding: 14px 20px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; border-radius: 12px; font-size: 1rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); transition: all 0.2s ease; }
        .btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35); }
        .btn-next-sm { padding: 8px 18px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; border: none; border-radius: 10px; font-size: 0.88rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(99, 102, 241, 0.25); transition: all 0.2s ease; }
        .btn-next-sm:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(99, 102, 241, 0.35); }
        .enter-hint { text-align: center; font-size: 0.75rem; color: #94a3b8; margin: 0; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .error-card { background: #ffffff; border: 1.5px solid #fca5a5; padding: 32px; border-radius: 16px; max-width: 400px; }
      `}</style>

      <main className="practice-container">
        <header className="practice-header">
          <div className="breadcrumb-nav">
            <a href="/exam-prep/jnvst">JNVST</a>
            <span>›</span>
            <span style={{ color: badge.color, fontWeight: 700 }}>{badge.text}</span>
          </div>

          <div className="score-pill-group">
            <div className="score-badge">
              <span className="score-correct">✓ {score.correct}</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span className="score-incorrect">✗ {score.incorrect}</span>
            </div>

            <div className={`timer-circle ${timeLeft <= 15 ? 'timer-warning' : ''}`}>
              {timeLeft}s
            </div>
          </div>
        </header>

        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(questionIndex / sessionLength) * 100}%` }}
          ></div>
          <span className="progress-text">Q{questionIndex}</span>
        </div>

        {question && (
          <div className="question-card">
            <div>
              {question.topic ? (
                <span className="topic-badge" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  📘 {question.topic}
                </span>
              ) : (
                <span className="topic-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  🎯 Practice Question
                </span>
              )}
              {question.difficultyLabel && (
                <span className="topic-badge" style={{ background: '#dcfce7', color: '#166534', marginLeft: 8 }}>
                  🟢 {question.difficultyLabel}
                </span>
              )}
            </div>

            <div className="question-text-box">
              {parseMathAndText(question.questionText)}
            </div>

            {question.questionImageUrl && (
              <FramedImage 
                src={question.questionImageUrl} 
                alt="Question Figure" 
                style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', margin: '0 auto' }} 
              />
            )}

            {question.parts && question.parts.length > 0 && (
              <PartRenderer parts={question.parts} />
            )}

            <div className={`options-grid ${optionsLayout}`}>
              {question.options && Object.entries(question.options).map(([key, val]) => {
                let optClass = 'option-button';
                if (isAnswered) {
                  if (key === feedback?.correctOption) {
                    optClass += ' option-correct';
                  } else if (key === selectedOption && !feedback?.isCorrect) {
                    optClass += ' option-wrong';
                  }
                } else if (selectedOption === key) {
                  optClass += ' option-selected';
                }

                const isObj = typeof val === 'object' && val !== null;
                const isSvg = isSvgString(val);

                return (
                  <button
                    key={key}
                    className={optClass}
                    onClick={() => handleSubmitAnswer(key)}
                    disabled={isAnswered}
                  >
                    <span className="option-key">{key}</span>
                    <span className="option-content">
                      {isSvg ? (
                        <div dangerouslySetInnerHTML={{ __html: val }} style={{ display: 'flex', justifyContent: 'center' }} />
                      ) : isObj && val.imageUrl ? (
                        <FramedImage src={val.imageUrl} alt={`Option ${key}`} style={{ maxHeight: '100px', objectFit: 'contain' }} />
                      ) : (
                        parseMathAndText(isObj ? (val.label || val.content || '') : val)
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <button 
                onClick={() => setShowDebugJson(!showDebugJson)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {showDebugJson ? '🔽 Hide Question JSON' : '🔍 Debug: View Raw Question JSON'}
              </button>
              {showDebugJson && (
                <pre style={{
                  marginTop: '12px',
                  width: '100%',
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  maxHeight: '380px'
                }}>
                  {JSON.stringify(question, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {isAnswered && feedback && (
          <div className="feedback-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div className={`feedback-header ${
                feedback.isCorrect ? 'feedback-correct'
                : selectedOption === null ? 'feedback-timeout'
                : 'feedback-incorrect'
              }`}>
                <span className="feedback-icon">
                  {feedback.isCorrect ? '✓' : selectedOption === null ? '⏱' : '✗'}
                </span>
                {feedback.isCorrect
                  ? 'Correct Answer!'
                  : selectedOption === null
                  ? 'Time Out!'
                  : 'Incorrect Answer'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="enter-hint" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>press <strong>Enter ↵</strong></span>
                <button className="btn-next-sm" onClick={handleNext}>
                  {questionIndex < sessionLength
                    ? <>Next Question <span>→</span></>
                    : <>View Report <span>🏁</span></>
                  }
                </button>
              </div>
            </div>

            {feedback.explanationText && (
              <div style={{ marginTop: 8 }}>
                <div className="explanation-label">Explanation</div>
                <div className="explanation-text">
                  {parseMathAndText(feedback.explanationText)}
                </div>
              </div>
            )}

            {question.drillTemplateId && (
              <button 
                className="btn-drill-concept"
                onClick={() => {
                  router.push(formatPracticeUrl({ examId, section: question.section || sectionId, topicId: question.topic || topic, skillId: question.drillTemplateId, userId }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🔥 Drill this Concept (Infinite Practice)
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
