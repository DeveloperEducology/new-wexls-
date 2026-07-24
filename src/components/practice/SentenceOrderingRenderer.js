'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
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
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);
  
  // Custom Pointer-events drag state
  const [draggedItem, setDraggedItem] = useState(null); // { id, text, origin, index, rect, startX, startY }
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const lastSwapTimeRef = useRef(0);

  const pillRefs = useRef({});
  const lastRects = useRef({});

  const isLetterSpelling = useMemo(() => {
    const opts = Array.isArray(question.options) ? question.options : [];
    if (opts.length > 0 && opts.every(o => String(o.label || o.text || '').length === 1)) return true;
    const ans = String(question.correctAnswer || question.answer || '').trim();
    return ans.length > 0 && !ans.includes(' ');
  }, [question.options, question.correctAnswer, question.answer]);
  const joinDelimiter = isLetterSpelling ? '' : ' ';

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
    setSelectedWordIndex(null);
    setDraggedItem(null);
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

  // Click handler for scrambled pool words
  const handlePoolClick = (word) => {
    if (isAnswered) return;
    capturePositions();
    setSelectedWordIndex(null);

    // If copyMode is active, generate a unique ID for the new placed card copy
    const wordId = question.copyMode
      ? `${word.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      : word.id;

    const wordToPlace = { id: wordId, text: word.text };
    const nextAssembled = [...assembledSentence, wordToPlace];
    setAssembledSentence(nextAssembled);

    if (!question.copyMode) {
      const nextPool = scrambledPool.filter((w) => w.id !== word.id);
      setScrambledPool(nextPool);
    }

    const isLetterSpelling = (Array.isArray(question.options) && question.options.length > 0 && question.options.every(o => String(o.label || o.text || '').length === 1)) || !String(question.correctAnswer || question.answer || '').trim().includes(' ');
    const joinDelimiter = isLetterSpelling ? '' : ' ';

    speakText(word.text);
    onAnswer(nextAssembled.map((w) => w.text).join(joinDelimiter));
  };

  // Click handler for assembled sentence words
  const handleAssembledClick = (index, word) => {
    if (isAnswered) return;

    const isLetterSpelling = (Array.isArray(question.options) && question.options.length > 0 && question.options.every(o => String(o.label || o.text || '').length === 1)) || !String(question.correctAnswer || question.answer || '').trim().includes(' ');
    const joinDelimiter = isLetterSpelling ? '' : ' ';

    if (selectedWordIndex === null) {
      // First tap: Select this word
      setSelectedWordIndex(index);
      speakText(word.text);
    } else if (selectedWordIndex === index) {
      // Second tap on the same word: Remove it (return to pool if not copyMode)
      capturePositions();

      const nextAssembled = assembledSentence.filter((_, idx) => idx !== index);
      setAssembledSentence(nextAssembled);

      if (!question.copyMode) {
        const baseId = word.id.split('_copy_')[0];
        const nextPool = [...scrambledPool, { id: baseId, text: word.text }];
        setScrambledPool(nextPool);
      }

      speakText(word.text);
      onAnswer(nextAssembled.map((w) => w.text).join(joinDelimiter));
      setSelectedWordIndex(null);
    } else {
      // Tap a different word: Swap them!
      capturePositions();

      const nextAssembled = [...assembledSentence];
      const temp = nextAssembled[selectedWordIndex];
      nextAssembled[selectedWordIndex] = nextAssembled[index];
      nextAssembled[index] = temp;

      setAssembledSentence(nextAssembled);
      speakText(word.text);
      onAnswer(nextAssembled.map((w) => w.text).join(joinDelimiter));
      setSelectedWordIndex(null);
    }
  };

  // Reset sentence builder
  const handleReset = () => {
    if (isAnswered) return;
    capturePositions();
    setSelectedWordIndex(null);
    
    if (question.copyMode) {
      setAssembledSentence([]);
    } else {
      const allWords = [...assembledSentence, ...scrambledPool];
      // Restore base IDs
      const restoredWords = allWords.map(w => ({
        id: w.id.split('_copy_')[0],
        text: w.text
      }));
      // Remove duplicates by ID to be safe
      const uniqueRestored = [];
      const seen = new Set();
      restoredWords.forEach(w => {
        if (!seen.has(w.id)) {
          seen.add(w.id);
          uniqueRestored.push(w);
        }
      });
      setScrambledPool(shuffleArray(uniqueRestored));
      setAssembledSentence([]);
    }
    onAnswer('');
  };

  // Pointer Event Handlers for Drag and Drop
  const handlePointerDown = (e, word, source, index = null) => {
    if (isAnswered) return;
    
    e.preventDefault();

    // Disable text selection on body during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedItem({
      id: word.id,
      text: word.text,
      origin: source,
      index: index,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      },
      startX: e.clientX,
      startY: e.clientY
    });
    setPointerPos({ x: e.clientX, y: e.clientY });
    hasDraggedRef.current = false;

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!draggedItem) return;

    const dx = e.clientX - draggedItem.startX;
    const dy = e.clientY - draggedItem.startY;

    // Start dragging if pointer moves more than 5px
    if (!hasDraggedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      hasDraggedRef.current = true;
    }

    if (hasDraggedRef.current) {
      setPointerPos({ x: e.clientX, y: e.clientY });

      const element = document.elementFromPoint(e.clientX, e.clientY);

      // Check if hovering over a slot in assembly area
      const slotEl = element?.closest('[data-slot-index]');
      if (slotEl) {
        const targetIndex = parseInt(slotEl.getAttribute('data-slot-index'), 10);

        if (draggedItem.origin === 'assembly') {
          const sourceIndex = draggedItem.index;
          if (sourceIndex !== targetIndex && targetIndex < assembledSentence.length) {
            const now = Date.now();
            if (now - lastSwapTimeRef.current > 180) { // 180ms debounce/lock to prevent ping-pong flicker
              lastSwapTimeRef.current = now;
              capturePositions();

              const nextAssembled = [...assembledSentence];
              const [movedWord] = nextAssembled.splice(sourceIndex, 1);
              nextAssembled.splice(targetIndex, 0, movedWord);

              setAssembledSentence(nextAssembled);
              setDraggedItem(prev => ({ ...prev, index: targetIndex }));
              onAnswer(nextAssembled.map((w) => w.text).join(' '));
            }
          }
        } else if (draggedItem.origin === 'pool') {
          const now = Date.now();
          if (now - lastSwapTimeRef.current > 180) {
            lastSwapTimeRef.current = now;
            capturePositions();
            
            // Generate unique ID if copyMode is active
            const newWordId = question.copyMode
              ? `${draggedItem.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
              : draggedItem.id;

            const finalTargetIndex = Math.min(targetIndex, assembledSentence.length);
            const nextAssembled = [...assembledSentence];
            nextAssembled.splice(finalTargetIndex, 0, { id: newWordId, text: draggedItem.text });
            setAssembledSentence(nextAssembled);

            if (!question.copyMode) {
              const nextPool = scrambledPool.filter((w) => w.id !== draggedItem.id);
              setScrambledPool(nextPool);
            }

            setDraggedItem(prev => ({
              ...prev,
              origin: 'assembly',
              index: finalTargetIndex,
              id: newWordId
            }));

            speakText(draggedItem.text);
            onAnswer(nextAssembled.map((w) => w.text).join(' '));
          }
        }
      } else {
        // Check if hovering over scrambled pool tray to return word
        const poolEl = element?.closest('[data-pool-tray]');
        if (poolEl && draggedItem.origin === 'assembly') {
          const now = Date.now();
          if (now - lastSwapTimeRef.current > 180) {
            lastSwapTimeRef.current = now;
            capturePositions();
            const sourceIndex = draggedItem.index;
            const nextAssembled = assembledSentence.filter((_, idx) => idx !== sourceIndex);
            setAssembledSentence(nextAssembled);

            if (!question.copyMode) {
              const baseId = draggedItem.id.split('_copy_')[0];
              const nextPool = [...scrambledPool, { id: baseId, text: draggedItem.text }];
              setScrambledPool(nextPool);
            }

            setDraggedItem(prev => ({
              ...prev,
              origin: 'pool',
              index: null,
              id: draggedItem.id.split('_copy_')[0]
            }));

            speakText(draggedItem.text);
            onAnswer(nextAssembled.map((w) => w.text).join(' '));
          }
        }
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!draggedItem) return;

    // Restore text selection on body
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    if (e.currentTarget.releasePointerCapture) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!hasDraggedRef.current) {
      // Differentiate tap from drag
      const word = { id: draggedItem.id, text: draggedItem.text };
      if (draggedItem.origin === 'pool') {
        handlePoolClick(word);
      } else {
        handleAssembledClick(draggedItem.index, word);
      }
    }

    setDraggedItem(null);
  };

  // Determine visual slots layout
  const expectedWords = String(question.correctAnswer || question.answer || '').split(/\s+/).filter(Boolean);
  const expectedLength = expectedWords.length || question.options?.length || 4;
  const totalSlots = question.copyMode
    ? Math.max(expectedLength, assembledSentence.length)
    : (scrambledPool.length + assembledSentence.length);

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
            background: '#eff6ff',
            border: 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1d4ed8',
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.15)',
            transition: 'transform 0.2s ease, background 0.2s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#dbeafe'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#eff6ff'; }}
          title="Read instructions out loud"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        </button>
        <span 
          style={{ 
            fontSize: 'clamp(18px, 4.2vw, 22px)', 
            fontWeight: '800', 
            color: '#334155', 
            fontFamily: 'var(--font-outfit), sans-serif',
            letterSpacing: '-0.02em'
          }}
        >
          {question.questionText || "Put the words in order to make a complete sentence."}
        </span>
      </div>

      {/* Question Parts / Word Problem Text */}
      {Array.isArray(question.parts) && question.parts.length > 0 && (
        <div 
          style={{ 
            marginBottom: '24px', 
            padding: '16px 20px', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {question.parts.map((part, idx) => {
            if (part.type === 'text') {
              return (
                <div 
                  key={`part-${idx}`} 
                  style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    lineHeight: '1.6',
                    ...part.style
                  }}
                >
                  {part.content}
                </div>
              );
            }
            if (part.type === 'image') {
              const imgSrc = part.imageUrl || part.url || part.src || part.content;
              const rawWidth = part.maxWidth || part.width || question.commonImageWidth || question.imageWidth;
              const widthStyle = rawWidth ? (typeof rawWidth === 'number' || /^\d+$/.test(rawWidth) ? `${rawWidth}px` : rawWidth) : '180px';
              const audioToPlay = part.audioUrl || question.audioUrl;
              const hasAudio = Boolean(part.playLabelSound || part.audioUrl || (question.audioUrl && (part.playLabelSound !== false)));

              return (
                <div key={`part-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', margin: '12px 0' }}>
                  {hasAudio && (
                    <button
                      type="button"
                      onClick={() => speakText(part.label || question.questionText || '', question.voice || 'Puck', audioToPlay)}
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
                      title="Play audio sound"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    </button>
                  )}
                  <img 
                    src={imgSrc} 
                    alt={part.alt || ""} 
                    onClick={() => {
                      if (hasAudio) {
                        speakText(part.label || question.questionText || '', question.voice || 'Puck', audioToPlay);
                      }
                    }}
                    style={{ 
                      borderRadius: part.transparent ? '0px' : '12px', 
                      objectFit: 'contain',
                      maxHeight: '220px',
                      cursor: hasAudio ? 'pointer' : 'default',
                      background: 'transparent',
                      ...part.style,
                      width: widthStyle,
                      maxWidth: '100%', 
                    }} 
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Target/Sentence Assembly Area */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.75)',
          border: '2px dashed #93c5fd',
          borderRadius: '20px',
          minHeight: '80px',
          padding: 'clamp(10px, 3vw, 20px)',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'nowrap', // Force items on a single line
          overflowX: 'auto', // Scroll horizontally if needed
          alignItems: 'center',
          gap: 'clamp(6px, 1.8vw, 12px)',
          position: 'relative',
          boxShadow: 'inset 0 4px 12px rgba(37, 99, 235, 0.05)',
          transition: 'all 0.3s ease',
          justifyContent: totalSlots === 0 ? 'center' : (isLetterSpelling ? 'center' : 'flex-start'),
          scrollbarWidth: 'none', // Hide scrollbars on Firefox
          msOverflowStyle: 'none', // Hide scrollbars on IE/Edge
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedWordIndex(null);
          }
        }}
      >
        {/* Webkit Hide Scrollbar Helper */}
        <style dangerouslySetInnerHTML={{__html: `
          [data-pool-tray]::-webkit-scrollbar,
          div[style*="overflow-x: auto"]::-webkit-scrollbar {
            display: none !important;
          }
        `}} />

        {totalSlots === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: '15px', fontWeight: '600', pointerEvents: 'none' }}>
            No words available.
          </span>
        ) : (
          Array.from({ length: totalSlots }).map((_, index) => {
            const word = assembledSentence[index];
            if (word) {
              const isDragged = draggedItem?.id === word.id && hasDraggedRef.current;
              // Occupied slot
              return (
                <div
                  key={`occupied-${word.id}`}
                  data-slot-index={index}
                  style={{
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    borderRadius: '14px',
                    flexShrink: 0 // Prevent shrinking
                  }}
                >
                  <div
                    ref={(el) => {
                      if (el) pillRefs.current[word.id] = el;
                      else delete pillRefs.current[word.id];
                    }}
                    onPointerDown={(e) => handlePointerDown(e, word, 'assembly', index)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                      background: selectedWordIndex === index 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '14px',
                      minWidth: isLetterSpelling ? 'clamp(52px, 8vw, 68px)' : undefined,
                      height: isLetterSpelling ? 'clamp(58px, 9vw, 74px)' : undefined,
                      padding: isLetterSpelling ? 0 : 'clamp(8px, 1.8vw, 12px) clamp(12px, 2.5vw, 20px)',
                      fontSize: isLetterSpelling ? 'clamp(26px, 5.5vw, 34px)' : 'clamp(14px, 3.2vw, 18px)',
                      fontWeight: '900',
                      cursor: isAnswered ? 'default' : 'grab',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: isLetterSpelling ? '0' : '8px',
                      boxShadow: selectedWordIndex === index
                        ? '0 0 0 3px #f59e0b, 0 8px 16px rgba(245, 158, 11, 0.4)'
                        : '0 4px 0 #1e40af, 0 6px 12px rgba(29, 78, 216, 0.15)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                      position: 'relative',
                      userSelect: 'none',
                      touchAction: 'none', // Prevents touch scrolling while dragging
                      opacity: isDragged ? 0.2 : 1,
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!isAnswered && !isDragged) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = selectedWordIndex === index
                          ? '0 0 0 3px #f59e0b, 0 10px 20px rgba(245, 158, 11, 0.4)'
                          : '0 4px 0 #1e40af, 0 8px 16px rgba(29, 78, 216, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isAnswered && !isDragged) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = selectedWordIndex === index
                          ? '0 0 0 3px #f59e0b, 0 8px 16px rgba(245, 158, 11, 0.4)'
                          : '0 4px 0 #1e40af, 0 6px 12px rgba(29, 78, 216, 0.15)';
                      }
                    }}
                  >
                    <span style={{ fontSize: isLetterSpelling ? 'clamp(26px, 5.5vw, 34px)' : 'clamp(14px, 3.2vw, 18px)' }}>{word.text}</span>
                    {selectedWordIndex === index && !isLetterSpelling && (
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          background: 'rgba(0,0,0,0.2)', 
                          padding: '2px 5px', 
                          borderRadius: '6px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Sel
                      </span>
                    )}
                  </div>
                </div>
              );
            } else {
              // Empty placeholder slot
              return (
                <div
                  key={`empty-${index}`}
                  data-slot-index={index}
                  style={{
                    minWidth: isLetterSpelling ? 'clamp(52px, 8vw, 68px)' : 'clamp(44px, 11vw, 80px)',
                    height: isLetterSpelling ? 'clamp(58px, 9vw, 74px)' : 'clamp(38px, 9.5vw, 48px)',
                    border: isLetterSpelling ? '2.5px dashed #60a5fa' : '2px dashed #cbd5e1',
                    borderRadius: '14px',
                    background: isLetterSpelling ? '#f0f9ff' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLetterSpelling ? '#93c5fd' : '#94a3b8',
                    fontSize: isLetterSpelling ? 'clamp(20px, 4vw, 26px)' : 'clamp(13px, 3vw, 15px)',
                    fontWeight: '800',
                    userSelect: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0 // Prevent shrinking
                  }}
                >
                  {isLetterSpelling ? '_' : (index + 1)}
                </div>
              );
            }
          })
        )}
      </div>

      {/* Scrambled Source Word Tray */}
      <div 
        data-pool-tray="true"
        style={{ 
          background: 'rgba(241, 245, 249, 0.6)',
          border: '1.5px solid #cbd5e1',
          borderRadius: '20px',
          padding: '24px',
          minHeight: '100px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
          transition: 'all 0.2s ease'
        }}
      >
        {question.copyMode && scrambledPool.length > 0 ? (
          scrambledPool.map((word) => {
            return (
              <button
                key={`scrambled-copy-${word.id}`}
                ref={(el) => {
                  if (el) pillRefs.current[word.id] = el;
                  else delete pillRefs.current[word.id];
                }}
                type="button"
                disabled={isAnswered}
                onPointerDown={(e) => handlePointerDown(e, word, 'pool')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  background: '#ffffff',
                  color: '#1d4ed8',
                  border: '2px solid #bfdbfe',
                  borderRadius: '14px',
                  padding: 'clamp(8px, 1.8vw, 12px) clamp(12px, 2.5vw, 20px)',
                  fontSize: 'clamp(14px, 3.2vw, 18px)',
                  fontWeight: '700',
                  cursor: isAnswered ? 'default' : 'grab',
                  boxShadow: '0 4px 0 #bfdbfe, 0 4px 10px rgba(29, 78, 216, 0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none',
                  outline: 'none',
                  touchAction: 'none', // Prevents touch scrolling while dragging
                }}
                onMouseEnter={(e) => {
                  if (!isAnswered) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 0 #bfdbfe, 0 6px 12px rgba(29, 78, 216, 0.08)';
                    e.currentTarget.style.background = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAnswered) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 0 #bfdbfe, 0 4px 10px rgba(29, 78, 216, 0.04)';
                    e.currentTarget.style.background = '#ffffff';
                  }
                }}
                onMouseDown={(e) => {
                  if (!isAnswered) {
                    e.currentTarget.style.transform = 'translateY(2px)';
                    e.currentTarget.style.boxShadow = '0 2px 0 #bfdbfe';
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
            );
          })
        ) : (scrambledPool.length === 0 && assembledSentence.length > 0 && !isLetterSpelling) ? (
          <span style={{ color: '#059669', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🎉 All words placed! Click "Check My Answer" to submit.
          </span>
        ) : scrambledPool.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
            No words available.
          </span>
        ) : (
          scrambledPool.map((word) => {
            const isDragged = draggedItem?.id === word.id && hasDraggedRef.current;
            return (
              <button
                key={`scrambled-${word.id}`}
                ref={(el) => {
                  if (el) pillRefs.current[word.id] = el;
                  else delete pillRefs.current[word.id];
                }}
                type="button"
                disabled={isAnswered}
                onPointerDown={(e) => handlePointerDown(e, word, 'pool')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  background: '#ffffff',
                  color: '#1d4ed8',
                  border: isLetterSpelling ? '2.5px solid #2563eb' : '2px solid #bfdbfe',
                  borderRadius: '14px',
                  minWidth: isLetterSpelling ? 'clamp(52px, 8vw, 68px)' : undefined,
                  height: isLetterSpelling ? 'clamp(58px, 9vw, 74px)' : undefined,
                  padding: isLetterSpelling ? 0 : 'clamp(8px, 1.8vw, 12px) clamp(12px, 2.5vw, 20px)',
                  fontSize: isLetterSpelling ? 'clamp(26px, 5.5vw, 34px)' : 'clamp(14px, 3.2vw, 18px)',
                  fontWeight: '900',
                  cursor: isAnswered ? 'default' : 'grab',
                  boxShadow: '0 4px 0 #bfdbfe, 0 4px 10px rgba(29, 78, 216, 0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  outline: 'none',
                  touchAction: 'none', // Prevents touch scrolling while dragging
                  opacity: isDragged ? 0.2 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isAnswered && !isDragged) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 0 #bfdbfe, 0 6px 12px rgba(29, 78, 216, 0.08)';
                    e.currentTarget.style.background = '#eff6ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAnswered && !isDragged) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 0 #bfdbfe, 0 4px 10px rgba(29, 78, 216, 0.04)';
                    e.currentTarget.style.background = '#ffffff';
                  }
                }}
                onMouseDown={(e) => {
                  if (!isAnswered && !isDragged) {
                    e.currentTarget.style.transform = 'translateY(2px)';
                    e.currentTarget.style.boxShadow = '0 2px 0 #bfdbfe';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isAnswered && !isDragged) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
              >
                {word.text}
              </button>
            );
          })
        )}
      </div>

      {/* Helper Tips & Toolbar */}
      {!isAnswered && (
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Gesture Guide */}
          <span 
            style={{ 
              color: '#64748b', 
              fontSize: '13px', 
              fontWeight: '600', 
              fontFamily: 'var(--font-outfit), sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💡 Drag to reorder, or tap a block to select and tap another to swap/remove.
          </span>

          {assembledSentence.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                transition: 'background 0.2s, color 0.2s',
                fontFamily: 'var(--font-outfit), sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#1e293b';
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
          )}
        </div>
      )}

      {/* Floating Dragged Element portal */}
      {draggedItem && hasDraggedRef.current && (
        <div
          style={{
            position: 'fixed',
            left: draggedItem.rect.left,
            top: draggedItem.rect.top,
            width: draggedItem.rect.width,
            height: draggedItem.rect.height,
            transform: `translate3d(${pointerPos.x - draggedItem.startX}px, ${pointerPos.y - draggedItem.startY}px, 0) scale(1.05)`,
            zIndex: 1000,
            pointerEvents: 'none', // Prevents blocking document.elementFromPoint
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: 'clamp(8px, 1.8vw, 12px) clamp(12px, 2.5vw, 20px)',
            fontSize: 'clamp(14px, 3.2vw, 18px)',
            fontWeight: '700',
            boxShadow: '0 12px 24px rgba(29, 78, 216, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            userSelect: 'none'
          }}
        >
          {draggedItem.text}
        </div>
      )}
    </div>
  );
}
