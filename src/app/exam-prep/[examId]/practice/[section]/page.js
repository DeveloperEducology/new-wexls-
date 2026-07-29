'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import katex from 'katex';
import SiteHeader from '../../../../../components/layout/SiteHeader';
import PartRenderer from '../../../../../components/practice/PartRenderer';


function parseMathAndText(text) {
  if (!text) return '';
  const trimmed = typeof text === 'string' ? text.trim() : '';
  // Detect pure SVG or HTML block — render as raw HTML
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<div')) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: text }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6px' }}
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

/** Detect if an option value is an inline SVG string */
function isSvgString(v) {
  return typeof v === 'string' && v.trim().startsWith('<svg');
}

/** Layout mode for options grid */
function getOptionsLayout(options) {
  if (!options) return 'one-col';
  const vals = Object.values(options);
  // Image-object options (imageUrl) — single column
  if (vals.some(v => typeof v === 'object' && v !== null && v.imageUrl)) return 'one-col';
  // SVG string options — 2x2 image grid
  if (vals.length === 4 && vals.every(v => isSvgString(v))) return 'svg-col';
  // Short text — 2-column
  if (vals.every(v => String(v).length <= 30) && vals.length === 4) return 'two-col';
  return 'one-col';
}

/** @deprecated use getOptionsLayout */
function usesTwoColumnLayout(options) {
  return getOptionsLayout(options) === 'two-col';
}

export default function PracticePlayer({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'guest_child';
  const topic = searchParams.get('topic') || null;
  const templateId = searchParams.get('templateId') || null;
  const examId = params.examId;
  const sectionId = params.section;

  const [sessionId, setSessionId] = useState(null);
  const [sessionLength, setSessionLength] = useState(15);
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  // Dynamic Pacing states
  const [exam, setExam] = useState(null);
  const [targetPaceSeconds, setTargetPaceSeconds] = useState(72);
  const targetPaceSecondsRef = useRef(72);
  const [timeLeft, setTimeLeft] = useState(72);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Refs to prevent stale closures in setInterval
  const handleSubmitAnswerRef = useRef(null);
  const handleTimeOutRef = useRef(null);

  // Update target pace seconds ref to prevent stale closure in interval
  useEffect(() => {
    targetPaceSecondsRef.current = targetPaceSeconds;
  }, [targetPaceSeconds]);

  // Load Exam configuration dynamically
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

  // Initialize Practice Session
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


  // Timer management
  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(targetPaceSecondsRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (handleTimeOutRef.current) handleTimeOutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    if (handleSubmitAnswerRef.current) handleSubmitAnswerRef.current(null);
  };

  const handleSubmitAnswer = async (forcedOption = undefined) => {
    const option = forcedOption !== undefined ? forcedOption : selectedOption;
    if (isAnswered) return;
    clearInterval(timerRef.current);
    const timeTakenMs = Date.now() - startTimeRef.current;
    setIsAnswered(true);

    try {
      const res = await fetch('/api/practice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId: question.id, selectedOption: option, timeTakenMs })
      });
      const data = await res.json();
      if (data.success) {
        setScore(prev => ({
          correct: prev.correct + (data.isCorrect ? 1 : 0),
          incorrect: prev.incorrect + (!data.isCorrect ? 1 : 0),
        }));
        setFeedback({
          isCorrect: data.isCorrect,
          correctOption: data.correctOption,
          explanationText: data.explanationText,
          nextQuestion: data.nextQuestion
        });
      } else {
        setError(data.error || 'Failed to submit answer');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  handleSubmitAnswerRef.current = handleSubmitAnswer;
  handleTimeOutRef.current = handleTimeOut;

  const handleNext = () => {
    if (!feedback) return;
    if (feedback.nextQuestion) {
      setQuestion(feedback.nextQuestion);
      setQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setFeedback(null);
      resetTimer();
    } else {
      router.push(`/exam-prep/${examId}/report/${sessionId}`);
    }
  };

  // Keyboard shortcut: A/B/C/D to select, Enter to submit/next
  useEffect(() => {
    const handler = (e) => {
      if (isAnswered) {
        if (e.key === 'Enter') handleNext();
        return;
      }
      const keyMap = { a: 'A', b: 'B', c: 'C', d: 'D' };
      const mapped = keyMap[e.key.toLowerCase()];
      if (mapped && question?.options?.[mapped] !== undefined) {
        setSelectedOption(mapped);
      }
      if (e.key === 'Enter' && selectedOption) {
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnswered, selectedOption, question]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .spinner { border: 4px solid #e2e8f0; width: 48px; height: 48px; border-radius: 50%; border-left-color: #6366f1; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        ` }} />
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: 32, background: 'white', borderRadius: 20, border: '1px solid #fee2e2', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <h2 style={{ color: '#dc2626', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Oops! An Error Occurred</h2>
        <p style={{ color: '#475569' }}>{error}</p>
        <button
          style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', marginTop: 20 }}
          onClick={() => router.push(`/exam-prep/${examId}`)}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const timerColor = timeLeft > (targetPaceSeconds * 0.4)
    ? '#10b981'
    : timeLeft > (targetPaceSeconds * 0.15)
    ? '#f59e0b'
    : '#ef4444';

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / targetPaceSeconds) * 100));
  const optionsLayout = getOptionsLayout(question?.options);
  const sectionLabel = exam?.sections?.find(s => s.id === sectionId)?.name || sectionId;

  // SVG ring constants
  const R = 18, CIRC = 2 * Math.PI * R;
  const dash = (timerPercent / 100) * CIRC;

  return (
    <div className="practice-player">
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }

        .practice-player {
          min-height: 100vh;
          background: var(--bg-page, #f2ede6);
          font-family: var(--font-outfit), 'Inter', sans-serif;
          color: var(--text-base, #1a1612);
          display: flex;
          flex-direction: column;
        }

        .player-content {
          max-width: 720px;
          margin: 0 auto;
          padding: 28px 20px 80px;
          width: 100%;
          flex-grow: 1;
        }

        /* ── Status Bar ── */
        .status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          gap: 12px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
        }
        .breadcrumb-sep { color: #cbd5e1; }
        .breadcrumb-current { color: #4f46e5; }

        .status-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Score streak pills */
        .score-strip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 13px;
          font-weight: 800;
          gap: 10px;
        }
        .score-correct { color: #10b981; }
        .score-incorrect { color: #ef4444; }
        .score-divider { color: #e2e8f0; font-size: 16px; }

        /* Timer ring */
        .timer-ring-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 14px 5px 8px;
          transition: border-color 0.3s;
        }
        .timer-ring-wrap.pulse {
          animation: timerPulse 0.8s infinite alternate;
          border-color: #fca5a5;
          box-shadow: 0 0 12px rgba(239,68,68,0.25);
        }
        @keyframes timerPulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        .timer-ring-text {
          font-size: 15px;
          font-weight: 800;
        }

        /* ── Progress bar ── */
        .progress-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .progress-label {
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
          white-space: nowrap;
        }
        .progress-bar-bg {
          flex: 1;
          height: 7px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #818cf8, #6366f1);
          border-radius: 999px;
          width: ${(questionIndex / sessionLength) * 100}%;
          transition: width 0.4s cubic-bezier(.4,0,.2,1);
        }
        .progress-count {
          font-size: 13px;
          font-weight: 800;
          color: #6366f1;
          white-space: nowrap;
        }

        /* ── Question Card ── */
        .question-box {
          background: var(--bg-card, #faf6f0);
          border-radius: 20px;
          border: 1px solid var(--border-ui, #ddd5c8);
          padding: 28px 32px 24px;
          box-shadow: 0 2px 8px rgba(26,22,18,0.04), 0 8px 24px rgba(26,22,18,0.03);
          margin-bottom: 16px;
          animation: cardIn 0.25s ease-out;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .question-meta {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          margin-bottom: 14px;
          gap: 8px;
        }

        .topic-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #eef2ff;
          color: #4338ca;
          font-size: 10.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .kbd-hint {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px; height: 18px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-bottom: 2px solid #cbd5e1;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #475569;
        }

        .pacing-warning-prompt {
          margin-bottom: 12px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 12.5px;
          font-weight: 700;
          color: #b45309;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          animation: cardIn 0.25s ease-out;
        }

        .question-text {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.65;
          margin-bottom: 22px;
          white-space: pre-wrap;
        }

        /* ── Options ── */
        .options-grid {
          display: grid;
          gap: 10px;
          margin-bottom: 22px;
        }
        .options-grid.two-col {
          grid-template-columns: 1fr 1fr;
        }
        .options-grid.one-col {
          grid-template-columns: 1fr;
        }
        /* 2x2 image grid for SVG figure options */
        .options-grid.svg-col {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .options-grid.svg-col .option-button {
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 10px 8px 8px;
          gap: 0;
          min-height: 0;
          text-align: center;
        }
        .options-grid.svg-col .option-letter {
          position: absolute;
          top: 8px;
          left: 10px;
          width: 22px;
          height: 22px;
          min-width: 22px;
          font-size: 11px;
        }
        .options-grid.svg-col .option-svg-wrap {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 6px;
        }
        .options-grid.svg-col .option-svg-wrap svg,
        .options-grid.svg-col .option-svg-wrap > div > svg {
          width: 100% !important;
          height: auto !important;
          max-width: 140px;
          max-height: 140px;
          border-radius: 8px;
        }

        /* ── Question Image (diagram below question text) ── */
        .question-image-wrap {
          margin: 10px 0 16px;
          display: flex;
          justify-content: center;
          border-radius: 10px;
          overflow: hidden;
          border: 1.5px solid var(--border-ui, #ddd5c8);
          background: var(--bg-input, #f7f2eb);
        }
        .question-image {
          max-width: 100%;
          max-height: 320px;
          object-fit: contain;
          display: block;
        }

        /* ── Option with Image ── */
        .option-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .option-image {
          max-width: 100%;
          max-height: 140px;
          object-fit: contain;
          border-radius: 6px;
          display: block;
        }
        .option-button--image {
          align-items: flex-start;
          padding: 14px 16px;
        }
        .option-button--image .option-letter {
          margin-top: 2px;
        }


        .option-button {
          width: 100%;
          background: var(--bg-input, #f7f2eb);
          border: 2px solid var(--border-ui, #ddd5c8);
          border-radius: 12px;
          padding: 13px 18px;
          text-align: left;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-base, #1a1612);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s, box-shadow 0.15s;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }
        .option-button::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: transparent;
          border-radius: 12px 0 0 12px;
          transition: background 0.15s;
        }
        .option-button:hover:not(:disabled) {
          border-color: #a5b4fc;
          background: #f5f3ff;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(99,102,241,0.1);
        }
        .option-button:hover:not(:disabled)::before {
          background: #a5b4fc;
        }
        .option-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .option-button.selected {
          border-color: #6366f1;
          background: #f0efff;
          color: #3730a3;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .option-button.selected::before { background: #6366f1; }

        .option-letter {
          width: 26px;
          height: 26px;
          min-width: 26px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          transition: background 0.15s, color 0.15s;
        }
        .option-button.selected .option-letter {
          background: #6366f1;
          color: white;
        }

        .option-correct {
          border-color: #10b981 !important;
          background: #f0fdf4 !important;
          color: #065f46 !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important;
        }
        .option-correct::before { background: #10b981 !important; }
        .option-correct .option-letter {
          background: #10b981 !important;
          color: white !important;
        }

        .option-incorrect {
          border-color: #ef4444 !important;
          background: #fff5f5 !important;
          color: #7f1d1d !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .option-incorrect::before { background: #ef4444 !important; }
        .option-incorrect .option-letter {
          background: #ef4444 !important;
          color: white !important;
        }

        /* ── Submit / Next Button ── */
        .player-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 15px 36px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.01em;
        }
        .btn-submit:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(99,102,241,0.35);
          transform: translateY(-1px);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .enter-hint {
          text-align: center;
          font-size: 11.5px;
          font-weight: 600;
          color: #94a3b8;
        }

        /* ── Feedback Card ── */
        .feedback-box {
          background: var(--bg-card, #faf6f0);
          border-radius: 20px;
          border: 1px solid var(--border-ui, #ddd5c8);
          padding: 24px 28px;
          box-shadow: 0 2px 8px rgba(26,22,18,0.04);
          margin-bottom: 16px;
          animation: cardIn 0.3s ease-out;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 800;
        }
        .feedback-icon {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .feedback-correct { color: #059669; }
        .feedback-correct .feedback-icon { background: #d1fae5; }
        .feedback-incorrect { color: #dc2626; }
        .feedback-incorrect .feedback-icon { background: #fee2e2; }
        .feedback-timeout { color: #d97706; }
        .feedback-timeout .feedback-icon { background: #fef3c7; }

        .explanation-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .explanation-text {
          font-size: 14.5px;
          color: var(--text-muted, #6b6358);
          line-height: 1.7;
          white-space: pre-wrap;
          background: var(--bg-subtle, #ede8e0);
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid var(--border-ui, #ddd5c8);
        }

        .btn-next {
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 15px 36px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(16,185,129,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }
        .btn-next:hover {
          box-shadow: 0 6px 20px rgba(16,185,129,0.35);
          transform: translateY(-1px);
        }
        .btn-next:active { transform: translateY(0); }

        @media (max-width: 520px) {
          .options-grid.two-col { grid-template-columns: 1fr; }
          .question-text { font-size: 16px; }
          .player-content { padding: 16px 14px 60px; }
          .question-box { padding: 20px 18px 18px; }
          .kbd-hint { display: none; }
        }
      ` }} />

      <SiteHeader />

      <main className="player-content">

        {/* Status Bar */}
        <div className="status-bar">
          <div className="breadcrumb">
            <span>{exam?.name || examId?.toUpperCase()}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{sectionLabel}</span>
          </div>

          <div className="status-right">
            {/* Score tracker */}
            <div className="score-strip">
              <span className="score-correct">✓ {score.correct}</span>
              <span className="score-divider">|</span>
              <span className="score-incorrect">✗ {score.incorrect}</span>
            </div>

            {/* Timer with SVG ring */}
            <div className={`timer-ring-wrap ${timeLeft <= targetPaceSeconds * 0.15 ? 'pulse' : ''}`}>
              <svg width="42" height="42" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r={R} fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="21" cy="21" r={R}
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeDasharray={`${dash} ${CIRC}`}
                  strokeLinecap="round"
                  transform="rotate(-90 21 21)"
                  style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.5s' }}
                />
                <text x="21" y="25.5" textAnchor="middle" fontSize="11" fontWeight="800" fill={timerColor} fontFamily="inherit">
                  {timeLeft}s
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-row">
          <span className="progress-label">Progress</span>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" />
          </div>
          <span className="progress-count">{questionIndex}/{sessionLength}</span>
        </div>

        {/* Question Card */}
        {question && (
          <div className="question-box" key={question.id}>
            <div className="question-meta">
              <span className="topic-badge">📘 {question.topic}</span>
              {question.cognitiveLevel && (
                <span className="topic-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                  🧠 {question.cognitiveLevel}
                </span>
              )}
              {question.metadata?.source && (
                <span className="topic-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  🏷️ {question.metadata.source}
                </span>
              )}
              {Array.isArray(question.metadata?.exam) && question.metadata.exam.map(ex => (
                <span key={ex} className="topic-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  📝 {ex}
                </span>
              ))}
              {!isAnswered && (
                <span className="kbd-hint" style={{ marginLeft: 'auto' }}>
                  Press&nbsp;
                  {['A','B','C','D'].map(k => <kbd key={k} className="kbd">{k}</kbd>)}
                  &nbsp;to select
                </span>
              )}
            </div>

            {timeLeft < (targetPaceSeconds * 0.3) && !isAnswered && (
              <div className="pacing-warning-prompt">
                ⚡ Move on — target pace: {targetPaceSeconds}s per question
              </div>
            )}

            {/* Question prompt — render PartRenderer if question.parts exists (spreadsheet grid templates) */}
            {Array.isArray(question.parts) && question.parts.length > 0 ? (
              <div style={{ marginBottom: '20px' }}>
                <PartRenderer parts={question.parts} question={question} />
              </div>
            ) : (
              (() => {
                const qt = question.questionText || '';
                const trimmed = qt.trim();
                // If questionText is "<svg.../> \n some text", split them
                if (trimmed.startsWith('<svg')) {
                  const svgEnd = qt.indexOf('</svg>') + 6;
                  if (svgEnd > 6) {
                    const svgPart = qt.slice(qt.indexOf('<svg'), svgEnd);
                    const textPart = qt.slice(svgEnd).replace(/^\n+/, '').trim();
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}
                             dangerouslySetInnerHTML={{ __html: svgPart }} />
                        {textPart && <div className="question-text">{parseMathAndText(textPart)}</div>}
                      </>
                    );
                  }
                }
                return <div className="question-text">{parseMathAndText(qt)}</div>;
              })()
            )}

            {/* Question image — shown below question text if provided */}
            {question.questionImageUrl && (
              <div className="question-image-wrap">
                <img
                  src={question.questionImageUrl}
                  alt="Question diagram"
                  className="question-image"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}

            <div className={`options-grid ${optionsLayout}`}>
              {Object.entries(question.options).map(([key, value]) => {
                let optClass = '';
                const isSelected = selectedOption === key;
                if (isSelected) optClass = 'selected';
                if (isAnswered) {
                  if (key === feedback?.correctOption) optClass = 'option-correct';
                  else if (isSelected && !feedback?.isCorrect) optClass = 'option-incorrect';
                }
                // SVG string option (mental ability figure)
                if (isSvgString(value)) {
                  return (
                    <button
                      key={key}
                      className={`option-button ${optClass}`}
                      onClick={() => !isAnswered && setSelectedOption(key)}
                      disabled={isAnswered}
                    >
                      <span className="option-letter">{key}</span>
                      <span className="option-svg-wrap" dangerouslySetInnerHTML={{ __html: value }} />
                    </button>
                  );
                }
                // Image-URL object option
                const isImageOption = typeof value === 'object' && value !== null && value.imageUrl;
                const optText = isImageOption ? value.text : value;
                const optImgUrl = isImageOption ? value.imageUrl : null;
                return (
                  <button
                    key={key}
                    className={`option-button ${optClass}${isImageOption ? ' option-button--image' : ''}`}
                    onClick={() => !isAnswered && setSelectedOption(key)}
                    disabled={isAnswered}
                  >
                    <span className="option-letter">{key}</span>
                    <span className="option-content">
                      {optImgUrl && (
                        <img
                          src={optImgUrl}
                          alt={`Option ${key}`}
                          className="option-image"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      {optText && <span>{parseMathAndText(optText)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {!isAnswered && (
              <div className="player-actions">
                <button
                  className="btn-submit"
                  onClick={() => handleSubmitAnswer()}
                  disabled={selectedOption === null}
                >
                  {selectedOption ? '✓ Submit Answer' : 'Select an option above'}
                </button>
                {selectedOption && (
                  <p className="enter-hint">or press <strong>Enter ↵</strong></p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Card */}
        {isAnswered && feedback && (
          <div className="feedback-box">
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

            {feedback.explanationText && (
              <div style={{ marginBottom: 4 }}>
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
                  router.push(`/exam-prep/${examId}/practice/${question.section || sectionId}?templateId=${question.drillTemplateId}&userId=${userId}`);
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
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
              >
                🔥 Drill this Concept (Infinite Practice)
              </button>
            )}

            <button className="btn-next" onClick={handleNext}>
              {questionIndex < sessionLength
                ? <>Next Question <span>→</span></>
                : <>View Report <span>🏁</span></>
              }
            </button>

            <p className="enter-hint" style={{ marginTop: 8 }}>or press <strong>Enter ↵</strong></p>
          </div>
        )}

      </main>
    </div>
  );
}
