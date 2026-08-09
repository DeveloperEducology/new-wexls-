'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import katex from 'katex';
import SiteHeader from '../../../../../components/layout/SiteHeader';

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

function renderOptionsReview(options, selectedOption, correctOption, isCorrect) {
  if (!options) return <div style={{ color: '#64748b', fontStyle: 'italic' }}>Choices not available</div>;

  if (Array.isArray(options)) {
    return options.map((opt, i) => {
      const isOptCorrect = opt.isCorrect;
      const isOptSelected = opt.label === selectedOption || i === Number(selectedOption);
      let borderCol = '#e2e8f0';
      let bgCol = 'transparent';
      let textCol = '#0f172a';
      if (isOptSelected) {
        borderCol = isCorrect ? '#10b981' : '#ef4444';
        bgCol = isCorrect ? '#f0fdf4' : '#fef2f2';
        textCol = isCorrect ? '#15803d' : '#991b1b';
      } else if (isOptCorrect && !isCorrect) {
        borderCol = '#10b981';
        bgCol = '#f0fdf4';
        textCol = '#15803d';
      }
      return (
        <div key={i} className="review-option" style={{ border: `1px solid ${borderCol}`, backgroundColor: bgCol, color: textCol }}>
          <strong>Option {i + 1}:</strong> {opt.label}
        </div>
      );
    });
  } else if (typeof options === 'object') {
    return Object.entries(options).map(([key, val]) => {
      const isOptCorrect = key === correctOption;
      const isOptSelected = key === selectedOption;
      let borderCol = '#e2e8f0';
      let bgCol = 'transparent';
      let textCol = '#0f172a';
      if (isOptSelected) {
        borderCol = isOptCorrect ? '#10b981' : '#ef4444';
        bgCol = isOptCorrect ? '#f0fdf4' : '#fef2f2';
        textCol = isOptCorrect ? '#15803d' : '#991b1b';
      } else if (isOptCorrect) {
        borderCol = '#10b981';
        bgCol = '#f0fdf4';
        textCol = '#15803d';
      }
      return (
        <div key={key} className="review-option" style={{ border: `1px solid ${borderCol}`, backgroundColor: bgCol, color: textCol }}>
          <strong>Option {key}:</strong> {val}
        </div>
      );
    });
  }
  return null;
}

export default function SessionReport({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const sessionId = params.sessionId;
  const examId = params.examId;

  const [report, setReport] = useState(null);
  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [expandedExplanations, setExpandedExplanations] = useState({});
  const [generatingStates, setGeneratingStates] = useState({});

  const toggleExplanation = (index) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAiGridGenerate = async (resp) => {
    setGeneratingStates(prev => ({ ...prev, [resp.questionId]: true }));
    try {
      const subject = examId === 'jnvst' ? 'math' : 'math';
      const topic = resp.topic || 'general';
      const body = {
        questionText: resp.questionText,
        options: resp.options || [],
        explanation: resp.explanationText || '',
        subject: subject,
        topic: topic
      };

      const res = await fetch('/api/admin/templates/generate-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.template) {
        localStorage.setItem('klasschamp_grid_loader', JSON.stringify(data.template));
        window.open('/template-generator-grid', '_blank');
      } else {
        alert('Failed to generate template: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error calling AI generation API: ' + err.message);
    } finally {
      setGeneratingStates(prev => ({ ...prev, [resp.questionId]: false }));
    }
  };

  // Fetch exam config dynamically
  useEffect(() => {
    if (!examId) return;
    async function loadExam() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
        }
      } catch (err) {
        console.error("Failed to load exam config in report page:", err);
      }
    }
    loadExam();
  }, [examId]);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/practice/${sessionId}/report`);
        const data = await res.json();
        if (data.success) {
          setReport(data.report);
          setSession(data.session);
        } else {
          setError(data.error || 'Failed to load report');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="loader-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .loader-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f8fafc;
          }
          .spinner {
            border: 4px solid #e2e8f0;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border-left-color: #6366f1;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` }} />
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="error-panel">
        <style dangerouslySetInnerHTML={{ __html: `
          .error-panel {
            max-width: 500px;
            margin: 80px auto;
            text-align: center;
            padding: 32px;
            background: white;
            border-radius: 20px;
            border: 1px solid #fee2e2;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            font-family: var(--font-outfit), sans-serif;
          }
          .error-title {
            color: #dc2626;
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 12px;
          }
          .btn-err-back {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            margin-top: 20px;
          }
        ` }} />
        <h2 className="error-title">Oops! Report Not Found</h2>
        <p style={{ color: '#475569' }}>{error || 'The requested practice session report could not be loaded.'}</p>
        <button className="btn-err-back" onClick={() => router.push(`/exam-prep/${examId}`)}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { estimatedScore, accuracy, correct, total, avgTimeSec, topicBreakdown, weakTopics, strongTopics } = report;
  const isPassing = estimatedScore >= (exam?.passingCriteria?.general || 65);

  // Pacing calculations
  const responses = session?.responses || [];
  const totalQuestions = responses.length;
  
  // 1. Exceeded pace count (threshold paceThreshold computed dynamically)
  const secId = session?.section || session?.sectionId;
  const sec = exam?.sections?.find(s => s.id === secId);
  const paceThreshold = sec && sec.timeLimitMinutes && sec.questionCount
    ? Math.round((sec.timeLimitMinutes * 60) / sec.questionCount)
    : 72;
    
  const exceededPaceCount = responses.filter(r => Math.round((r.timeTakenMs || 0) / 1000) > paceThreshold).length;
  
  // 2. Average correct vs incorrect times
  const correctResponses = responses.filter(r => r.isCorrect);
  const incorrectResponses = responses.filter(r => !r.isCorrect);
  
  const avgCorrectTime = correctResponses.length > 0
    ? Math.round(correctResponses.reduce((sum, r) => sum + (r.timeTakenMs || 0), 0) / correctResponses.length / 1000)
    : 0;
    
  const avgIncorrectTime = incorrectResponses.length > 0
    ? Math.round(incorrectResponses.reduce((sum, r) => sum + (r.timeTakenMs || 0), 0) / incorrectResponses.length / 1000)
    : 0;
    
  // 3. Total time spent vs allotted exam time
  const totalTimeSec = Math.round(responses.reduce((sum, r) => sum + (r.timeTakenMs || 0), 0) / 1000);
  const totalAllottedSec = totalQuestions * paceThreshold;
  const timeDifferenceSec = totalAllottedSec - totalTimeSec;
  
  const formatMinutesSeconds = (seconds) => {
    const absSec = Math.abs(seconds);
    const mins = Math.floor(absSec / 60);
    const secs = absSec % 60;
    return `${mins}m ${secs}s`;
  };

  const scrollToQuestion = (id) => {
    const element = document.getElementById(`q-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Quick flash animation
      element.style.transition = 'background-color 0.3s ease';
      element.style.backgroundColor = '#f5f3ff';
      setTimeout(() => {
        element.style.backgroundColor = '#fafafb';
      }, 1000);
    }
  };

  const filteredResponses = (session?.responses || []).filter(resp => {
    if (filterTab === 'correct') return resp.isCorrect;
    if (filterTab === 'incorrect') return !resp.isCorrect;
    return true;
  });

  return (
    <div className="session-report-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .session-report-root {
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-outfit), 'Inter', sans-serif;
          color: #0f172a;
          display: flex;
          flex-direction: column;
        }

        .report-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 24px 80px;
          width: 100%;
        }

        .report-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .report-title {
          font-size: 36px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .report-subtitle {
          font-size: 16px;
          color: #64748b;
        }

        .main-score-panel {
          background: white;
          border-radius: 28px;
          border: 1px solid #e2e8f0;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03);
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 40px;
          align-items: center;
          margin-bottom: 40px;
        }

        @media (max-width: 768px) {
          .main-score-panel {
            grid-template-columns: 1fr;
            text-align: center;
          }
        }

        .dial-container {
          display: flex;
          justify-content: center;
        }

        .radial-dial {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: conic-gradient(${isPassing ? '#10b981' : '#f59e0b'} ${(estimatedScore / 100) * 360}deg, #f1f5f9 0deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(99,102,241,0.08);
        }

        .dial-inner {
          width: 152px;
          height: 152px;
          border-radius: 50%;
          background: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .dial-score {
          font-size: 48px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }

        .dial-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
        }

        .score-info h2 {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .cutoff-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .cutoff-passing {
          background: #dcfce7;
          color: #166534;
        }

        .cutoff-failing {
          background: #fef3c7;
          color: #b45309;
        }

        .score-info p {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);
        }

        .stat-val {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .stat-lbl {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .detail-panel {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 36px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          margin-bottom: 40px;
        }

        .panel-title {
          font-size: 20px;
          font-weight: 800;
          color: #334155;
          margin-bottom: 24px;
        }

        .topic-table {
          width: 100%;
          border-collapse: collapse;
        }

        .topic-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }

        .topic-table td {
          padding: 16px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 15px;
        }

        .topic-name {
          font-weight: 700;
          color: #0f172a;
        }

        .topic-accuracy-bg {
          width: 100px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 999px;
          display: inline-block;
          vertical-align: middle;
          margin-right: 12px;
          overflow: hidden;
        }

        .topic-accuracy-fill {
          height: 100%;
          border-radius: 999px;
        }

        .recommendation-panel {
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          border-radius: 24px;
          padding: 36px;
          border: 1px solid rgba(99, 102, 241, 0.15);
          margin-bottom: 48px;
        }

        .rec-title {
          font-size: 18px;
          font-weight: 800;
          color: #4f46e5;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rec-desc {
          font-size: 15px;
          color: #3730a3;
          line-height: 1.6;
        }

        .action-bar {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .btn-action-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 16px 36px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(99,102,241,0.15);
          transition: all 0.2s;
        }

        .btn-action-primary:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .btn-action-secondary {
          background: white;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 15px 36px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-action-secondary:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        /* Question Review Section Styles */
        .review-panel {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 36px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          margin-bottom: 40px;
        }

        .review-filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
        }

        .filter-tab-btn {
          border: none;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          background: #f1f5f9;
          color: #64748b;
          transition: all 0.15s ease;
        }

        .filter-tab-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .active-tab {
          background: #4f46e5;
          color: white !important;
        }

        .no-review-placeholder {
          text-align: center;
          padding: 32px;
          color: #64748b;
          font-weight: 600;
          font-style: italic;
        }

        .review-questions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .review-question-card {
          border: 1px solid #f1f5f9;
          background: #fafafb;
          border-radius: 16px;
          padding: 20px;
        }

        .review-q-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .review-q-index {
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .review-q-status {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .status-correct {
          background: #dcfce7;
          color: #166534;
        }

        .status-incorrect {
          background: #fef2f2;
          color: #991b1b;
        }

        .review-q-time {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }

        .pace-warning-text {
          color: #d97706 !important;
        }

        .review-q-text {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .review-options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .review-options-grid {
            grid-template-columns: 1fr;
          }
        }

        .review-option {
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .review-explanation-btn {
          background: none;
          border: none;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          outline: none;
        }

        .review-explanation-btn:hover {
          text-decoration: underline;
        }

        .review-explanation-content {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          margin-top: 10px;
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }

        /* JNVST Pacing CSS Styles */
        .pacing-insights-panel {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          margin-bottom: 40px;
        }
        .pacing-insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 640px) {
          .pacing-insights-grid {
            grid-template-columns: 1fr;
          }
        }
        .pacing-metric-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          border: 1px solid #f1f5f9;
        }
        .pacing-metric-lbl {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pacing-metric-val {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 8px;
        }
        .pacing-metric-desc {
          font-size: 12px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }
        .coaching-advice-box {
          background: #faf5ff;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 14px;
          border: 1px solid #f3e8ff;
        }
        .coaching-advice-icon {
          font-size: 24px;
        }
        .coaching-advice-text {
          display: flex;
          flex-direction: column;
        }

        .pacing-timeline-container {
          margin-bottom: 28px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 16px;
          border: 1px dashed #e2e8f0;
        }
        .pacing-timeline-title {
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 14px;
        }
        .pacing-timeline-grid {
          display: grid;
          grid-template-columns: repeat(15, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        @media (max-width: 768px) {
          .pacing-timeline-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
          }
        }
        .timeline-block {
          border: 1.5px solid;
          border-radius: 10px;
          padding: 8px 4px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .timeline-block:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .timeline-block-warning {
          box-shadow: 0 0 0 1px #f59e0b;
        }
        .timeline-block-num {
          font-size: 11px;
          font-weight: 800;
        }
        .timeline-block-time {
          font-size: 13px;
          font-weight: 900;
          margin-top: 2px;
        }
        .timeline-warn-dot {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 10px;
        }
        .timeline-legend {
          display: flex;
          gap: 16px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
      ` }} />

      <SiteHeader />

      <main className="report-content">
        <div className="report-header">
          <h1 className="report-title">Session Performance</h1>
          <p className="report-subtitle">Practice session completed successfully</p>
        </div>

        <div className="main-score-panel">
          <div className="dial-container">
            <div className="radial-dial">
              <div className="dial-inner">
                <span className="dial-score">{estimatedScore}</span>
                <span className="dial-label">Rating Score</span>
              </div>
            </div>
          </div>
          <div className="score-info">
            {isPassing ? (
              <span className="cutoff-badge cutoff-passing">✓ Clearing {exam?.name || 'Exam'} Cutoff ({exam?.passingCriteria?.general || 65})</span>
            ) : (
              <span className="cutoff-badge cutoff-failing">⚠ Under {exam?.name || 'Exam'} Cutoff ({exam?.passingCriteria?.general || 65})</span>
            )}
            <h2>
              {estimatedScore >= (exam?.passingCriteria?.general ? exam.passingCriteria.general + 15 : 80) 
                ? 'Fantastic! You are exam-ready.' 
                : estimatedScore >= (exam?.passingCriteria?.general || 65) 
                  ? 'Great progress! Keep maintaining this level.' 
                  : 'Good attempt! Focus on weak areas to boost your score.'}
            </h2>
            <p>
              Your estimated {exam?.name || 'exam'} section proficiency is currently at <strong>{estimatedScore}/100</strong>.
              This estimate is calibrated based on correct responses against questions of varying difficulties.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{accuracy}%</div>
            <div className="stat-lbl">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{correct} / {total}</div>
            <div className="stat-lbl">Correct Answers</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{avgTimeSec}s</div>
            <div className="stat-lbl">Avg Time / Q</div>
          </div>
        </div>

        {/* Pacing Insights Panel */}
        {session && session.responses && session.responses.length > 0 && (
          <div className="pacing-insights-panel">
            <h3 className="panel-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> {exam?.name || 'Exam'} Pacing & Coach Insights
            </h3>
            <div className="pacing-insights-grid">
              <div className="pacing-metric-card">
                <span className="pacing-metric-lbl">Target Pace Met</span>
                <span className="pacing-metric-val">
                  {totalQuestions - exceededPaceCount} / {totalQuestions}
                </span>
                <span className="pacing-metric-desc">answered within {paceThreshold}s pace</span>
              </div>
              <div className="pacing-metric-card">
                <span className="pacing-metric-lbl">Avg Time / Question</span>
                <span className="pacing-metric-val" style={{ fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <span style={{ color: '#16a34a' }}>✓ Correct: <strong>{avgCorrectTime}s</strong></span>
                  <span style={{ color: '#dc2626' }}>✗ Incorrect: <strong>{avgIncorrectTime}s</strong></span>
                </span>
              </div>
              <div className="pacing-metric-card">
                <span className="pacing-metric-lbl">Session Time Efficiency</span>
                <span className="pacing-metric-val">
                  {formatMinutesSeconds(totalTimeSec)}
                </span>
                <span className="pacing-metric-desc">
                  {timeDifferenceSec >= 0 
                    ? `Saved ${formatMinutesSeconds(timeDifferenceSec)} of ${Math.round(totalAllottedSec / 60)}m`
                    : `Exceeded target by ${formatMinutesSeconds(timeDifferenceSec)}`}
                </span>
              </div>
            </div>
            
            {/* Coaching Box */}
            <div className="coaching-advice-box">
              <span className="coaching-advice-icon">💡</span>
              <div className="coaching-advice-text">
                <strong style={{ fontSize: '15px', color: '#581c87' }}>Coach's Pacing Advice:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#3b0764', lineHeight: '1.5' }}>
                  {exceededPaceCount === 0 ? (
                    `Incredible speed control! You stayed within the ${paceThreshold}-second target pace on every single question. Maintaining this steady flow during the actual exam will give you ample time to verify answers.`
                  ) : avgIncorrectTime > avgCorrectTime + 15 ? (
                    `You spent significantly longer on incorrect questions (${avgIncorrectTime}s) compared to correct ones (${avgCorrectTime}s). Remember the golden rule of pacing: if you get stuck on a calculation for over 60 seconds, make an educated guess, skip it, and move on!`
                  ) : totalTimeSec < totalAllottedSec - 180 ? (
                    `Excellent time management! You finished ${formatMinutesSeconds(timeDifferenceSec)} faster than the target of ${Math.round(totalAllottedSec / 60)} minutes. Speed is a huge advantage, just make sure to double-check calculation steps to prevent silly mistakes.`
                  ) : (
                    `You exceeded the ${paceThreshold}-second target pace on ${exceededPaceCount} questions. Work on mental math drills and calculation short-cuts to shave off a few seconds and increase your overall buffer.`
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {topicBreakdown && topicBreakdown.length > 0 && (
          <div className="detail-panel">
            <h3 className="panel-title">Topic Breakdown</h3>
            <table className="topic-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Questions</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {topicBreakdown.map((t, idx) => {
                  const fillCol = t.accuracy >= 75 ? '#10b981' : t.accuracy >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={idx}>
                      <td className="topic-name">{t.topic}</td>
                      <td style={{ color: '#64748b', fontWeight: 600 }}>{t.correct} / {t.total}</td>
                      <td>
                        <div className="topic-accuracy-bg">
                          <div 
                            className="topic-accuracy-fill"
                            style={{ width: `${t.accuracy}%`, backgroundColor: fillCol }}
                          ></div>
                        </div>
                        <span style={{ fontWeight: 800, color: fillCol }}>{t.accuracy}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {session && session.responses && session.responses.length > 0 && (
          <div className="review-panel">
            <h3 className="panel-title">Question Review</h3>

            {/* Interactive Pacing Timeline */}
            <div className="pacing-timeline-container">
              <span className="pacing-timeline-title">⏱️ Click question to scroll directly to review</span>
              <div className="pacing-timeline-grid">
                {session.responses.map((resp, idx) => {
                  const timeSec = Math.round((resp.timeTakenMs || 0) / 1000);
                  const isPaceWarning = timeSec > 72;
                  let bgCol = '#dcfce7'; // correct
                  let borderCol = '#10b981';
                  let textCol = '#15803d';
                  if (!resp.isCorrect) {
                    if (resp.selectedOption === null) {
                      bgCol = '#fff7ed'; // timed out
                      borderCol = '#f97316';
                      textCol = '#c2410c';
                    } else {
                      bgCol = '#fef2f2'; // incorrect
                      borderCol = '#ef4444';
                      textCol = '#991b1b';
                    }
                  }
                  
                  return (
                    <div 
                      key={resp.questionId} 
                      className={`timeline-block ${isPaceWarning ? 'timeline-block-warning' : ''}`}
                      style={{ 
                        backgroundColor: bgCol, 
                        borderColor: isPaceWarning ? '#f59e0b' : borderCol,
                        color: textCol
                      }}
                      onClick={() => scrollToQuestion(resp.questionId)}
                    >
                      <div className="timeline-block-num">Q{idx + 1}</div>
                      <div className="timeline-block-time">{timeSec}s</div>
                      {isPaceWarning && <span className="timeline-warn-dot">⚠️</span>}
                    </div>
                  );
                })}
              </div>
              <div className="timeline-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }}></span> Correct</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> Incorrect</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> Timed Out</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '2px', width: '12px', height: '12px' }}></span> Exceeded 72s Pace Target</span>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="review-filter-tabs">
              <button 
                className={`filter-tab-btn ${filterTab === 'all' ? 'active-tab' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All ({session.responses.length})
              </button>
              <button 
                className={`filter-tab-btn ${filterTab === 'correct' ? 'active-tab' : ''}`}
                onClick={() => setFilterTab('correct')}
              >
                Correct ({session.responses.filter(r => r.isCorrect).length})
              </button>
              <button 
                className={`filter-tab-btn ${filterTab === 'incorrect' ? 'active-tab' : ''}`}
                onClick={() => setFilterTab('incorrect')}
              >
                Incorrect ({session.responses.filter(r => !r.isCorrect).length})
              </button>
            </div>

            {/* Questions List */}
            {filteredResponses.length === 0 ? (
              <div className="no-review-placeholder">
                No questions match this filter.
              </div>
            ) : (
              <div className="review-questions-list">
                {filteredResponses.map((resp, idx) => {
                  const displayIndex = session.responses.indexOf(resp) + 1;
                  const timeSec = Math.round((resp.timeTakenMs || 0) / 1000);
                  const isPaceWarning = timeSec > 72;
                  
                  return (
                    <div key={resp.questionId} id={`q-card-${resp.questionId}`} className="review-question-card">
                      <div className="review-q-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="review-q-index">Question {displayIndex}</span>
                          <span className={`review-q-status ${resp.isCorrect ? 'status-correct' : 'status-incorrect'}`}>
                            {resp.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>
                        <span className={`review-q-time ${isPaceWarning ? 'pace-warning-text' : ''}`}>
                          ⏱ {timeSec}s {isPaceWarning ? '(Pace warning > 72s)' : ''}
                        </span>
                      </div>

                      <div className="review-q-text">
                        {parseMathAndText(resp.questionText || 'Question text not available.')}
                      </div>

                      <div className="review-options-grid">
                        {renderOptionsReview(resp.options, resp.selectedOption, resp.correctOption, resp.isCorrect)}
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {resp.explanationText && (
                            <button 
                              className="review-explanation-btn"
                              onClick={() => toggleExplanation(resp.questionId)}
                            >
                              {expandedExplanations[resp.questionId] ? '▼ Hide Explanation' : '▶ Show Explanation'}
                            </button>
                          )}
                          {resp.drillTemplateId && (
                            <a
                              href={`/exam-prep/${examId}/practice/${resp.section || session?.section || 'arithmetic'}?templateId=${resp.drillTemplateId}&userId=${session?.userId || 'guest_child'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-drill-concept-mini"
                              style={{
                                padding: '5px 12px',
                                backgroundColor: '#f59e0b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '700',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(245, 158, 11, 0.15)',
                                textDecoration: 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                            >
                              🔥 Drill Concept (Infinite Practice)
                            </a>
                          )}
                          <button
                            onClick={() => handleAiGridGenerate(resp)}
                            disabled={generatingStates[resp.questionId]}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#6366f1',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: '700',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'background-color 0.2s',
                              opacity: generatingStates[resp.questionId] ? 0.7 : 1
                            }}
                          >
                            {generatingStates[resp.questionId] ? '⏳ Generating...' : '🪄 AI Grid Template (Dev)'}
                          </button>
                        </div>
                        {resp.explanationText && expandedExplanations[resp.questionId] && (
                          <div className="review-explanation-content">
                            <strong>Explanation:</strong>
                            <div style={{ marginTop: '8px' }}>
                              {parseMathAndText(resp.explanationText)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {weakTopics.length > 0 && (
          <div className="recommendation-panel">
            <h3 className="rec-title">
              <span>💡</span> Recommended Action Plan
            </h3>
            <p className="rec-desc">
              Your drill shows that your accuracy drops when answering questions in <strong>{weakTopics.join(', ')}</strong>.
              We recommend launching another focused practice run, or reviewing standard textbook templates in these specific topics to lock down key concepts.
            </p>
          </div>
        )}

        <div className="action-bar">
          <Link href={`/exam-prep/${examId}`} className="btn-action-primary">
            Back to dashboard
          </Link>
          <Link href="/exam-prep" className="btn-action-secondary">
            Try other exams
          </Link>
        </div>
      </main>
    </div>
  );
}
