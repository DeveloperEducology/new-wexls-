'use client';

import React, { useState } from 'react';
import QuestionRenderer from '../practice/QuestionRenderer';
import { isAnswerCorrect } from '../../lib/exam/question-schema.js';

export default function PreviewWidget({ questions = [], examName = 'JNVST' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
        No preview questions available for this topic.
      </div>
    );
  }

  const isCompleted = currentIndex >= questions.length;
  const currentQ = !isCompleted ? questions[currentIndex] : null;

  const handleSubmitAnswer = () => {
    if (userAnswer === null || userAnswer === undefined) return;
    
    const correct = isAnswerCorrect(currentQ, userAnswer);
    setIsCorrect(correct);
    setIsAnswered(true);
    setShowExplanation(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setUserAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (isCompleted) {
    return (
      <div className="preview-widget-card finish-card">
        <div className="badge-animation">🏆</div>
        <h2>{score}/{questions.length} Questions Correct!</h2>
        <p className="subtitle">
          Great effort! You've successfully finished the preview questions for {examName.toUpperCase()}.
        </p>
        
        <div className="cta-box">
          <h3>Unlock Full Exam Preparation</h3>
          <ul>
            <li>🎯 <strong>1,000+ practice questions</strong> with full explainers</li>
            <li>⏱️ <strong>Timed Mock Tests</strong> matching the latest format</li>
            <li>📈 <strong>Real-time diagnostic analytics</strong> and score improvement hints</li>
          </ul>
          
          <a href={`/login?redirect=/exam-prep/${examName}`} className="cta-button">
            🚀 Access Full Mock Test Free
          </a>
        </div>

        <style jsx>{`
          .preview-widget-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            color: #0f172a;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            max-width: 600px;
            margin: 20px auto;
            position: relative;
            overflow: hidden;
          }
          .badge-animation {
            font-size: 64px;
            margin-bottom: 15px;
            animation: bounce 2s infinite;
          }
          h2 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 10px;
            color: #0284c7;
          }
          .subtitle {
            color: #475569;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .cta-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            margin-top: 20px;
            text-align: left;
          }
          .cta-box h3 {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 15px;
            text-align: center;
          }
          .cta-box ul {
            list-style: none;
            padding: 0;
            margin: 0 0 25px 0;
          }
          .cta-box li {
            font-size: 15px;
            color: #334155;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cta-button {
            display: block;
            text-align: center;
            background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%);
            color: white;
            font-weight: 700;
            padding: 14px 28px;
            border-radius: 12px;
            text-decoration: none;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 4px 15px rgba(2, 132, 199, 0.2);
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(2, 132, 199, 0.3);
            background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%);
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="preview-widget-card">
      <div className="progress-bar-container">
        <div className="progress-bar-header">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="score-badge">Score: {score}</span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="question-container">
        <QuestionRenderer
          question={currentQ}
          userAnswer={userAnswer}
          onAnswer={setUserAnswer}
          onSubmit={handleSubmitAnswer}
          isAnswered={isAnswered}
          isCorrect={isCorrect}
        />
      </div>

      <div className="action-bar">
        {!isAnswered ? (
          <button 
            onClick={handleSubmitAnswer}
            disabled={userAnswer === null || userAnswer === undefined}
            className="action-btn submit-btn"
          >
            Check Answer
          </button>
        ) : (
          <button 
            onClick={handleNext}
            className="action-btn next-btn"
          >
            {currentIndex === questions.length - 1 ? 'Finish Drill' : 'Next Question'}
          </button>
        )}
      </div>

      {showExplanation && currentQ.explanationText && (
        <div className={`explanation-panel ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="explanation-header">
            {isCorrect ? '✅ Excellent!' : '❌ Incorrect'}
          </div>
          <div className="explanation-body">
            <p>{currentQ.explanationText}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .preview-widget-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 30px;
          color: #0f172a;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          max-width: 600px;
          margin: 20px auto;
        }
        .progress-bar-container {
          margin-bottom: 25px;
        }
        .progress-bar-header {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .score-badge {
          background: rgba(2, 132, 199, 0.08);
          color: #0284c7;
          padding: 2px 10px;
          border-radius: 12px;
        }
        .progress-track {
          background: #f1f5f9;
          height: 6px;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          background: linear-gradient(90deg, #38bdf8 0%, #0284c7 100%);
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .question-container {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          min-height: 200px;
        }
        .action-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        .action-btn {
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        .submit-btn {
          background: #0284c7;
          color: white;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
        }
        .submit-btn:hover:not(:disabled) {
          background: #0284c7;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(2, 132, 199, 0.25);
        }
        .submit-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }
        .next-btn {
          background: #22c55e;
          color: white;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
        }
        .next-btn:hover {
          background: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.25);
        }
        .explanation-panel {
          border-radius: 12px;
          padding: 16px 20px;
          margin-top: 15px;
          border-left: 4px solid;
          animation: slideDown 0.25s ease-out;
        }
        .explanation-panel.correct {
          background: rgba(34, 197, 94, 0.05);
          border-color: #22c55e;
        }
        .explanation-panel.incorrect {
          background: rgba(239, 68, 68, 0.05);
          border-color: #ef4444;
        }
        .explanation-header {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 6px;
        }
        .explanation-panel.correct .explanation-header {
          color: #16a34a;
        }
        .explanation-panel.incorrect .explanation-header {
          color: #dc2626;
        }
        .explanation-body {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
