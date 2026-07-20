'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { speakText } from '@/lib/ttsClient';
import styles from './FactoryLayout.module.css';

export default function SentenceOrderingRenderer({
  question,
  userAnswer,
  onAnswer,
  onSubmit,
  isAnswered,
  isCorrect,
}) {
  const [scrambledPool, setScrambledPool] = useState([]);
  const [assembledSentence, setAssembledSentence] = useState([]);
  const pillRefs = useRef({});
  const lastRects = useRef({});

  // Parse words from question options or fallback by splitting correct answer
  useEffect(() => {
    let wordsList = [];
    if (Array.isArray(question.options) && question.options.length > 0) {
      wordsList = question.options.map((opt, idx) => ({
        id: opt.id || `word_${idx}`,
        text: opt.label,
      }));
    } else {
      const sentence = question.correctAnswer || question.answer || '';
      const splitWords = sentence.split(/\s+/).filter(Boolean);
      wordsList = splitWords.map((word, idx) => ({
        id: `word_${idx}`,
        text: word,
      }));
      // Shuffle if we auto-split
      wordsList = shuffleArray(wordsList);
    }

    setScrambledPool(wordsList);
    setAssembledSentence([]);
    onAnswer(''); // Clear any previous answer
  }, [question.id]);

  // Helper to shuffle array
  const shuffleArray = (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Capture layout positions before state change (FLIP animation - First)
  const capturePositions = () => {
    const rects = {};
    Object.keys(pillRefs.current).forEach((id) => {
      const el = pillRefs.current[id];
      if (el) {
        rects[id] = el.getBoundingClientRect();
      }
    });
    lastRects.current = rects;
  };

  // Apply visual correction after state change (FLIP animation - Invert & Play)
  useLayoutEffect(() => {
    const oldRects = lastRects.current;
    if (!oldRects || Object.keys(oldRects).length === 0) return;

    requestAnimationFrame(() => {
      Object.keys(pillRefs.current).forEach((id) => {
        const el = pillRefs.current[id];
        const oldRect = oldRects[id];
        if (el && oldRect) {
          const newRect = el.getBoundingClientRect();
          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;
          if (dx !== 0 || dy !== 0) {
            // Invert: position element back to its starting layout location
            el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.05)`;
            el.style.transition = 'none';
            el.style.zIndex = '50';
            
            // Force a DOM browser reflow
            el.offsetHeight;

            // Play: animate back to origin (0, 0)
            el.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), z-index 0.4s ease';
            el.style.transform = 'translate3d(0, 0, 0) scale(1)';
            el.style.zIndex = '1';
          }
        }
      });
    });
  }, [scrambledPool, assembledSentence]);

  // Click handler to move word from scrambled pool to assembled sentence
  const handleAddToSentence = (word) => {
    if (isAnswered) return;
    capturePositions();
    
    // Add to assembled sentence
    const nextAssembled = [...assembledSentence, word];
    setAssembledSentence(nextAssembled);
    
    // Remove from scrambled pool
    const nextPool = scrambledPool.filter((w) => w.id !== word.id);
    setScrambledPool(nextPool);

    // Speak word
    speakText(word.text);

    // Report answer
    onAnswer(nextAssembled.map((w) => w.text).join(' '));
  };

  // Click handler to return word from assembled sentence to scrambled pool
  const handleRemoveFromSentence = (wordIndex, word) => {
    if (isAnswered) return;
    capturePositions();

    // Remove from assembled sentence
    const nextAssembled = assembledSentence.filter((_, idx) => idx !== wordIndex);
    setAssembledSentence(nextAssembled);

    // Add back to scrambled pool
    const nextPool = [...scrambledPool, word];
    setScrambledPool(nextPool);

    // Speak word
    speakText(word.text);

    // Report answer
    onAnswer(nextAssembled.map((w) => w.text).join(' '));
  };

  // Move a word left in the assembled sentence
  const handleMoveLeft = (wordIndex, e) => {
    e.stopPropagation(); // Prevent trigger removal
    if (isAnswered || wordIndex === 0) return;
    capturePositions();

    const nextAssembled = [...assembledSentence];
    const temp = nextAssembled[wordIndex];
    nextAssembled[wordIndex] = nextAssembled[wordIndex - 1];
    nextAssembled[wordIndex - 1] = temp;

    setAssembledSentence(nextAssembled);
    onAnswer(nextAssembled.map((w) => w.text).join(' '));
  };

  // Move a word right in the assembled sentence
  const handleMoveRight = (wordIndex, e) => {
    e.stopPropagation(); // Prevent trigger removal
    if (isAnswered || wordIndex === assembledSentence.length - 1) return;
    capturePositions();

    const nextAssembled = [...assembledSentence];
    const temp = nextAssembled[wordIndex];
    nextAssembled[wordIndex] = nextAssembled[wordIndex + 1];
    nextAssembled[wordIndex + 1] = temp;

    setAssembledSentence(nextAssembled);
    onAnswer(nextAssembled.map((w) => w.text).join(' '));
  };

  // Reset sentence builder
  const handleReset = () => {
    if (isAnswered) return;
    capturePositions();
    const allWords = [...assembledSentence, ...scrambledPool];
    // Keep the current options ordering or shuffle
    setScrambledPool(shuffleArray(allWords));
    setAssembledSentence([]);
    onAnswer('');
  };

  return (
    <div style={{ padding: '8px 4px', width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      {/* Title & Instructions */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '20px', 
          padding: '0 4px' 
        }}
      >
        <button
          type="button"
          onClick={() => speakText(question.questionText || "Put the words in order to make a complete sentence.")}
          style={{
            background: '#e0f2fe',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0284c7',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)',
            transition: 'transform 0.2s ease, background 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#bae6fd'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#e0f2fe'; }}
          title="Read instructions out loud"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </button>
        <span 
          style={{ 
            fontSize: 'clamp(18px, 4.2vw, 22px)', 
            fontWeight: '700', 
            color: '#475569', 
            fontFamily: 'var(--font-outfit), sans-serif' 
          }}
        >
          {question.questionText || "Put the words in order to make a complete sentence."}
        </span>
      </div>

      {/* Target/Sentence Assembly Area */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.7)',
          border: '2px dashed #93c5fd',
          borderRadius: '16px',
          minHeight: '84px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          boxShadow: 'inset 0 2px 8px rgba(37, 99, 235, 0.03)',
          transition: 'all 0.3s ease',
          justifyContent: assembledSentence.length === 0 ? 'center' : 'flex-start'
        }}
      >
        {assembledSentence.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: '15px', fontWeight: '500', pointerEvents: 'none' }}>
            Tap scrambled word blocks below to construct your sentence
          </span>
        ) : (
          assembledSentence.map((word, index) => (
            <div
              key={`assembled-${word.id}`}
              ref={(el) => {
                if (el) pillRefs.current[word.id] = el;
                else delete pillRefs.current[word.id];
              }}
              onClick={() => handleRemoveFromSentence(index, word)}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: isAnswered ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px rgba(2, 132, 199, 0.2), 0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
                position: 'relative',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(2, 132, 199, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(2, 132, 199, 0.2)';
                }
              }}
            >
              {/* Optional audio indicator click inside pill */}
              <span style={{ fontSize: '17px' }}>{word.text}</span>

              {/* Quick Left / Right reordering arrows inside selected pills */}
              {!isAnswered && assembledSentence.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
                  {index > 0 && (
                    <button
                      type="button"
                      title="Move Left"
                      onClick={(e) => handleMoveLeft(index, e)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.stopPropagation()}
                    >
                      ◀
                    </button>
                  )}
                  {index < assembledSentence.length - 1 && (
                    <button
                      type="button"
                      title="Move Right"
                      onClick={(e) => handleMoveRight(index, e)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.stopPropagation()}
                    >
                      ▶
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Scrambled Source Word Tray */}
      <div 
        style={{ 
          background: 'rgba(241, 245, 249, 0.6)',
          border: '1.5px solid #cbd5e1',
          borderRadius: '16px',
          padding: '20px',
          minHeight: '84px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
        }}
      >
        {scrambledPool.length === 0 && assembledSentence.length > 0 ? (
          <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
            🎉 All words placed! Click "Check My Answer" to submit.
          </span>
        ) : scrambledPool.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
            No words available.
          </span>
        ) : (
          scrambledPool.map((word) => (
            <button
              key={`scrambled-${word.id}`}
              ref={(el) => {
                if (el) pillRefs.current[word.id] = el;
                else delete pillRefs.current[word.id];
              }}
              type="button"
              disabled={isAnswered}
              onClick={() => handleAddToSentence(word)}
              style={{
                background: '#ffffff',
                color: '#0284c7',
                border: '2px solid #bae6fd',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: isAnswered ? 'default' : 'pointer',
                boxShadow: '0 4px 0 #bae6fd, 0 4px 10px rgba(2, 132, 199, 0.04)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                userSelect: 'none',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 #bae6fd, 0 6px 12px rgba(2, 132, 199, 0.08)';
                  e.currentTarget.style.background = '#f0f9ff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 0 #bae6fd, 0 4px 10px rgba(2, 132, 199, 0.04)';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
              onMouseDown={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 2px 0 #bae6fd';
                }
              }}
              onMouseUp={(e) => {
                if (!isAnswered) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
            >
              {word.text}
            </button>
          ))
        )}
      </div>

      {/* Reset & Instructions Helper Toolbar */}
      {!isAnswered && assembledSentence.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Reset Order
          </button>
        </div>
      )}
    </div>
  );
}
