'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import katex from 'katex';
import SiteHeader from '../../../../../components/layout/SiteHeader';

const SESSION_LENGTH = 15;

function parseMathAndText(text) {
  if (!text) return '';
  if (typeof text === 'string' && text.trim().startsWith('<svg')) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: text }} 
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6px' }} 
      />
    );
  }
  const parts = text.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <span key={i}>{part}</span>;
      }
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <div key={i}>{part}</div>;
      }
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <div key={i}>{part}</div>;
      }
    }
    
    // Simple bold/italic formatting
    let processed = part;
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

export default function PracticePlayer({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'guest_child';
  const topic = searchParams.get('topic') || null;
  const sectionId = params.section;

  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(72); // 72 seconds JNVST pace
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Refs to prevent stale closures in setInterval
  const handleSubmitAnswerRef = useRef(null);
  const handleTimeOutRef = useRef(null);

  // 1. Initialize Practice Session
  useEffect(() => {
    async function startSession() {
      try {
        const res = await fetch('/api/practice/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: 'jnvst', section: sectionId, userId, topic })
        });
        const data = await res.json();
        if (data.success) {
          setSessionId(data.sessionId);
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
  }, [sectionId, userId]);

  // 2. Timer management
  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(72);
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

  const handleTimeOut = () => {
    // Automatically submit with empty answer
    if (handleSubmitAnswerRef.current) {
      handleSubmitAnswerRef.current(null);
    }
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
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          selectedOption: option,
          timeTakenMs
        })
      });
      const data = await res.json();
      if (data.success) {
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
      // Completed, view report
      router.push(`/exam-prep/jnvst/report/${sessionId}`);
    }
  };

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

  if (error) {
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
        <h2 className="error-title">Oops! An Error Occurred</h2>
        <p style={{ color: '#475569' }}>{error}</p>
        <button className="btn-err-back" onClick={() => router.push('/exam-prep/jnvst')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const timerColor = timeLeft > 30 ? '#10b981' : timeLeft > 10 ? '#f59e0b' : '#ef4444';

  return (
    <div className="practice-player">
      <style dangerouslySetInnerHTML={{ __html: `
        .practice-player {
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-outfit), 'Inter', sans-serif;
          color: #0f172a;
          display: flex;
          flex-direction: column;
        }

        .player-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 24px 80px;
          width: 100%;
          flex-grow: 1;
        }

        .status-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .progress-label {
          font-size: 15px;
          font-weight: 800;
          color: #64748b;
        }

        .timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          background: white;
          padding: 8px 16px;
          border-radius: 9999px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: color 0.2s, transform 0.2s;
        }

        .timer-badge-pulse {
          animation: pulse 1s infinite alternate;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.35);
          border-color: #fca5a5 !important;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }

        .pacing-warning-prompt {
          margin-top: 4px;
          margin-bottom: 20px;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #b45309;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: slideUp 0.25s ease-out;
        }

        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 999px;
          margin-bottom: 32px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #4f46e5);
          width: ${(questionIndex / SESSION_LENGTH) * 100}%;
          transition: width 0.3s ease;
        }

        .question-box {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03);
          margin-bottom: 24px;
        }

        .topic-badge {
          display: inline-block;
          background: #eef2ff;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .question-text {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.6;
          margin-bottom: 32px;
          white-space: pre-wrap;
        }

        .options-list {
          display: grid;
          gap: 16px;
          margin-bottom: 32px;
        }

        .option-button {
          width: 100%;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 24px;
          text-align: left;
          font-size: 16px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .option-button:hover:not(:disabled) {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .option-button.selected {
          border-color: #6366f1;
          background: #f5f3ff;
          color: #4f46e5;
          box-shadow: 0 0 0 1px #6366f1;
        }

        .option-letter {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          color: #64748b;
        }

        .option-button.selected .option-letter {
          background: #6366f1;
          color: white;
        }

        .option-correct {
          border-color: #10b981 !important;
          background: #f0fdf4 !important;
          color: #166534 !important;
        }

        .option-correct .option-letter {
          background: #10b981 !important;
          color: white !important;
        }

        .option-incorrect {
          border-color: #ef4444 !important;
          background: #fdf2f2 !important;
          color: #991b1b !important;
        }

        .option-incorrect .option-letter {
          background: #ef4444 !important;
          color: white !important;
        }

        .player-actions {
          display: flex;
          justify-content: flex-end;
        }

        .btn-submit {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 16px 36px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .btn-submit:hover:not(:disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .feedback-box {
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 36px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03);
          margin-bottom: 24px;
          animation: slideUp 0.3s ease-out;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 20px;
          font-weight: 800;
        }

        .feedback-correct {
          color: #10b981;
        }

        .feedback-incorrect {
          color: #ef4444;
        }

        .explanation-title {
          font-size: 15px;
          font-weight: 800;
          color: #334155;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .explanation-text {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />

      <SiteHeader />

      <main className="player-content">
        <div className="status-header">
          <div className="progress-label">
            Question {questionIndex} of {SESSION_LENGTH}
          </div>
          <div className={`timer-badge ${timeLeft <= 15 ? 'timer-badge-pulse' : ''}`} style={{ color: timerColor }}>
            <span>⏱</span>
            <span>{timeLeft}s</span>
          </div>
        </div>

        <div className="progress-bar-bg">
          <div className="progress-bar-fill"></div>
        </div>

        {question && (
          <div className="question-box">
            <span className="topic-badge">{question.topic}</span>
            {timeLeft < 22 && !isAnswered && (
              <div className="pacing-warning-prompt">
                ⚠️ Spending over 50s. Pace target is 72s.
              </div>
            )}
            <div className="question-text">
              {parseMathAndText(question.questionText)}
            </div>

            <div className="options-list">
              {Object.entries(question.options).map(([key, value]) => {
                const isSelected = selectedOption === key;
                let optClass = '';
                
                if (isSelected) optClass = 'selected';
                if (isAnswered) {
                  if (key === feedback?.correctOption) {
                    optClass = 'option-correct';
                  } else if (isSelected && !feedback?.isCorrect) {
                    optClass = 'option-incorrect';
                  }
                }

                return (
                  <button
                    key={key}
                    className={`option-button ${optClass}`}
                    onClick={() => !isAnswered && setSelectedOption(key)}
                    disabled={isAnswered}
                  >
                    <span className="option-letter">{key}</span>
                    <span>{parseMathAndText(value)}</span>
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
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        )}

        {isAnswered && feedback && (
          <div className="feedback-box">
            <div className={`feedback-header ${feedback.isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
              {feedback.isCorrect ? (
                <><span>✓</span> Correct Answer!</>
              ) : selectedOption === null ? (
                <><span>⏱</span> Time Out!</>
              ) : (
                <><span>✗</span> Incorrect Answer</>
              )}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div className="explanation-title">Explanation</div>
              <div className="explanation-text">
                {parseMathAndText(feedback.explanationText)}
              </div>
            </div>

            <div className="player-actions">
              <button className="btn-submit" onClick={handleNext}>
                {questionIndex < SESSION_LENGTH ? 'Next Question' : 'View Report'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
