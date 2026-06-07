'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './stickers.module.css';

// 3 Distinct Mascot stickers with increased size parameters
const MASCOTS = [
  { id: 0, type: 'penguin', name: 'Chubby Penguin', url: '/images/penguin.svg', width: 14, height: 14 },
  { id: 1, type: 'rabbit', name: 'Cute Rabbit', url: '/images/rabbit.svg', width: 15, height: 15 },
  { id: 2, type: 'alex', name: 'Alex Mascot', url: '/images/alex_avatar.png', width: 16, height: 16 },
];

// Target shadows on the landscape background
const TARGETS = [
  { id: 't_penguin', type: 'penguin', name: 'Penguin Shadow', x: 22, y: 56, width: 14, height: 14, label: 'Penguin Area' },
  { id: 't_alex', type: 'alex', name: 'Alex Shadow', x: 45, y: 32, width: 16, height: 16, label: 'Center Sky' },
  { id: 't_rabbit', type: 'rabbit', name: 'Rabbit Shadow', x: 68, y: 55, width: 15, height: 15, label: 'Rabbit Area' },
];

export default function StickersDemoPage() {
  const [placedItems, setPlacedItems] = useState([]); // Array of { id: mascotId, x: percentX, y: percentY, type, isSnapped }
  
  // Game states matching the IXL scoreboard widgets
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [smartScore, setSmartScore] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  // Dragging & UI states
  const [draggedId, setDraggedId] = useState(null); // mascot ID (0, 1, or 2)
  const [isDraggingFromCanvas, setIsDraggingFromCanvas] = useState(false);
  const [selectedDockSticker, setSelectedDockSticker] = useState(null); // Mobile click mascot ID
  const [feedback, setFeedback] = useState({ text: 'Match the stickers to their correct shadow shapes!', type: 'info' });

  const canvasRef = useRef(null);
  const snapAudioRef = useRef({}); // Tracks snapping per mascot type to prevent loops

  // Timer Tick loop
  useEffect(() => {
    let interval = null;
    if (!isTimerPaused) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerPaused]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const generateNewQuestion = () => {
    setPlacedItems([]);
    setSelectedDockSticker(null);
    snapAudioRef.current = {};
    setFeedback({ text: 'Match the stickers to their correct shadow shapes!', type: 'info' });
    speak("Match the stickers to their correct shadow shapes in the picture!");
  };

  // Speaks using Web Speech synthesis
  const speak = (msg) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReadPrompt = () => {
    speak("Match the stickers to their correct shadow shapes in the picture!");
  };

  // Drag and drop mechanics
  const handleDropToCanvas = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    let mascotId = draggedId;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        mascotId = data.mascotId;
        grabOffsetX = data.offsetX || 0;
        grabOffsetY = data.offsetY || 0;
      }
    } catch (err) {
      // fallback
    }

    if (mascotId === null) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const relativeX = clientX - canvasRect.left;
    const relativeY = clientY - canvasRect.top;

    const mascot = MASCOTS.find(m => m.id === mascotId);
    if (!mascot) return;

    // Calculate current pixel size of mascot
    const mascotWidthPx = (mascot.width / 100) * canvasRect.width;
    const mascotHeightPx = (mascot.height / 100) * canvasRect.height;

    // Clamp grab offset to avoid offsets outside the element boundary
    const cleanGrabX = Math.max(0, Math.min(mascotWidthPx, grabOffsetX));
    const cleanGrabY = Math.max(0, Math.min(mascotHeightPx, grabOffsetY));

    // Align top-left of sticker by subtracting offset
    const dropLeftPx = relativeX - cleanGrabX;
    const dropTopPx = relativeY - cleanGrabY;

    let px = (dropLeftPx / canvasRect.width) * 100;
    let py = (dropTopPx / canvasRect.height) * 100;

    // Clamp boundary so sticker stays inside canvas
    px = Math.max(0, Math.min(100 - mascot.width, px));
    py = Math.max(0, Math.min(100 - mascot.height, py));

    // MAGNETIC SNAPPING CHECK
    const target = TARGETS.find(t => t.type === mascot.type);
    let finalX = px;
    let finalY = py;
    let snapped = false;

    if (target) {
      const dx = px - target.x;
      const dy = py - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const snapThreshold = 8.5; // Snap threshold percentage

      if (distance < snapThreshold) {
        finalX = target.x;
        finalY = target.y;
        snapped = true;

        if (!snapAudioRef.current[mascot.type]) {
          speak(`Snapped ${mascot.name}`);
          snapAudioRef.current[mascot.type] = true;
        }
      } else {
        if (snapAudioRef.current[mascot.type]) {
          speak(`Released ${mascot.name}`);
          snapAudioRef.current[mascot.type] = false;
        }
      }
    }

    if (isDraggingFromCanvas) {
      // Repositioning already placed item
      setPlacedItems(prev => prev.map(item => 
        item.id === mascotId ? { ...item, x: finalX, y: finalY, isSnapped: snapped } : item
      ));
    } else {
      // Dropping new item from the dock
      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== mascotId), // Prevent duplicates
        { id: mascotId, x: finalX, y: finalY, type: mascot.type, isSnapped: snapped }
      ]);
    }

    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  const handleDockDragStart = (e, mascotId) => {
    setDraggedId(mascotId);
    setIsDraggingFromCanvas(false);
    
    const offsetX = e.nativeEvent.offsetX || 0;
    const offsetY = e.nativeEvent.offsetY || 0;
    e.dataTransfer.setData('text/plain', JSON.stringify({ mascotId, offsetX, offsetY }));
  };

  const handleCanvasDragStart = (e, mascotId) => {
    e.stopPropagation();
    setDraggedId(mascotId);
    setIsDraggingFromCanvas(true);
    
    const offsetX = e.nativeEvent.offsetX || 0;
    const offsetY = e.nativeEvent.offsetY || 0;
    e.dataTransfer.setData('text/plain', JSON.stringify({ mascotId, offsetX, offsetY }));
  };

  const handleDropToDock = (e) => {
    e.preventDefault();
    if (draggedId !== null && isDraggingFromCanvas) {
      // Return to dock
      setPlacedItems(prev => prev.filter(item => item.id !== draggedId));
      const mascot = MASCOTS.find(m => m.id === draggedId);
      if (mascot) {
        speak(`Removed ${mascot.name}`);
        snapAudioRef.current[mascot.type] = false;
      }
    }
    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  // Mobile Tap Fallbacks
  const handleDockTap = (mascotId) => {
    const isPlaced = placedItems.some(item => item.id === mascotId);
    if (isPlaced) return;

    if (selectedDockSticker === mascotId) {
      setSelectedDockSticker(null);
    } else {
      setSelectedDockSticker(mascotId);
      const mascot = MASCOTS.find(m => m.id === mascotId);
      if (mascot) speak(mascot.name);
    }
  };

  const handleCanvasTap = (e) => {
    if (selectedDockSticker !== null) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      let relativeX = clientX - canvasRect.left;
      let relativeY = clientY - canvasRect.top;

      let px = (relativeX / canvasRect.width) * 100;
      let py = (relativeY / canvasRect.height) * 100;

      const mascot = MASCOTS.find(m => m.id === selectedDockSticker);
      if (!mascot) return;

      // Adjust centered offset
      px = Math.max(0, Math.min(100 - mascot.width, px - mascot.width / 2));
      py = Math.max(0, Math.min(100 - mascot.height, py - mascot.height / 2));

      // Snap logic on touch
      const target = TARGETS.find(t => t.type === mascot.type);
      let finalX = px;
      let finalY = py;
      let snapped = false;

      if (target) {
        const dx = px - target.x;
        const dy = py - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 9.5) {
          finalX = target.x;
          finalY = target.y;
          snapped = true;
          speak(`Snapped to shadow`);
          snapAudioRef.current[mascot.type] = true;
        }
      }

      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== selectedDockSticker),
        { id: selectedDockSticker, x: finalX, y: finalY, type: mascot.type, isSnapped: snapped }
      ]);
      setSelectedDockSticker(null);
    }
  };

  const handlePlacedItemTap = (e, mascotId) => {
    e.stopPropagation();
    // Return back to dock on tap inside canvas
    const item = placedItems.find(p => p.id === mascotId);
    setPlacedItems(prev => prev.filter(p => p.id !== mascotId));
    if (item) {
      speak("Returned");
      snapAudioRef.current[item.type] = false;
    }
  };

  // Check answers
  const handleSubmit = () => {
    const snappedItems = placedItems.filter(item => item.isSnapped);
    
    if (snappedItems.length === MASCOTS.length) {
      // All 3 matched correctly!
      setFeedback({
        text: 'Excellent work! You matched all the stickers to their correct shadows.',
        type: 'success'
      });
      speak("Wonderful! All matched correctly.");
      setSmartScore(prev => Math.min(100, prev + 15));
      setQuestionsAnswered(prev => prev + 1);

      setTimeout(() => {
        generateNewQuestion();
      }, 3500);
    } else {
      // Some are missing or unsnapped
      const placedCount = placedItems.length;
      let errorMsg = '';
      if (placedCount < MASCOTS.length) {
        errorMsg = 'Some stickers are still in the dock. Place all of them on the shadows!';
      } else {
        errorMsg = 'Check your placements. Make sure each sticker matches the correct shadow shape!';
      }

      setFeedback({
        text: errorMsg,
        type: 'error'
      });
      speak(errorMsg);
      setSmartScore(prev => Math.max(0, prev - 5));
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header Navigation */}
      <nav className={styles.ixlNavBar}>
        <div className={styles.ixlBrand}>
          <div className={styles.ixlLogo}>
            IX<span>L</span>
          </div>
          <div className={styles.searchIcon}>🔍</div>
        </div>
        <div className={styles.navLinks}>
          <span>Learning</span>
          <span>Analytics</span>
        </div>
        <div className={styles.authButtons}>
          <button type="button" className={styles.signInBtn}>Sign in</button>
          <button type="button" className={styles.joinBtn}>Join now</button>
        </div>
      </nav>

      {/* Grade Breadcrumbs */}
      <header className={styles.subHeader}>
        <div className={styles.breadcrumbs}>
          <span>Upper kindergarten</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: '800' }}>A.3 Count using stickers - up to 3</span>
        </div>
        <button type="button" className={styles.shareBtn}>Share skill</button>
      </header>

      {/* Main Workspace Layout */}
      <main className={styles.layout}>
        {/* Left Side Practice Sheet */}
        <section className={styles.practiceCard}>
          {/* Example / Restart option */}
          <div className={styles.learnExample} onClick={generateNewQuestion}>
            🔄 Reset Placement / Play Again
          </div>

          {/* Readout prompt instruction */}
          <div className={styles.promptRow}>
            <button 
              type="button" 
              onClick={handleReadPrompt} 
              className={styles.speakerBtn}
              title="Speak instruction"
            >
              🔊
            </button>
            <span>
              Match the <strong>stickers</strong> to their correct <strong>shadow shapes</strong> in the picture.
            </span>
          </div>

          {/* Droppable Interactive Canvas */}
          <div
            ref={canvasRef}
            className={styles.canvasFrame}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToCanvas}
            onClick={handleCanvasTap}
          >
            {/* Background Hills Wallpaper */}
            <img
              src="/images/prek_landscape.webp"
              alt="Landscape scenery background"
              className={styles.canvasBg}
            />

            {/* Render 3 Target Shadow outlines on canvas background */}
            {TARGETS.map((target) => {
              const matchedItem = placedItems.find(item => item.type === target.type);
              const isSnapped = matchedItem?.isSnapped;
              const mascot = MASCOTS.find(m => m.type === target.type);

              return (
                <div
                  key={target.id}
                  className={`${styles.shadowTarget} ${isSnapped ? styles.shadowTargetActive : ''}`}
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: `${target.width}%`,
                    height: `${target.height}%`,
                    backgroundImage: `url(${mascot?.url})`,
                  }}
                >
                  <div className={styles.shadowTargetLabel}>
                    {isSnapped ? '✓ Matched' : target.label}
                  </div>
                </div>
              );
            })}

            {/* Render placed active elements dragging inside canvas */}
            {placedItems.map((item) => {
              const mascot = MASCOTS.find(m => m.id === item.id);
              if (!mascot) return null;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleCanvasDragStart(e, item.id)}
                  onClick={(e) => handlePlacedItemTap(e, item.id)}
                  className={`${styles.placedSticker} ${draggedId === item.id && isDraggingFromCanvas ? styles.placedStickerActive : ''}`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${mascot.width}%`,
                    height: `${mascot.height}%`,
                    backgroundImage: `url(${mascot.url})`,
                  }}
                  title="Drag to adjust, tap to return back to dock"
                />
              );
            })}
          </div>

          {/* Sticker Dock Row */}
          <div 
            className={styles.dockPanel}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToDock}
          >
            {MASCOTS.map((m, index) => {
              const isPlaced = placedItems.some(item => item.id === m.id);
              const isSelected = selectedDockSticker === m.id;

              return (
                <div key={m.id} className={styles.dockSlotWrapper}>
                  <div className={styles.dockSlot}>
                    {isPlaced ? (
                      /* Silhouette outline replacement */
                      <div
                        className={styles.silhouettePlaceholder}
                        style={{ backgroundImage: `url(${m.url})` }}
                      />
                    ) : (
                      /* Active colored sticker card card */
                      <div
                        draggable
                        onDragStart={(e) => handleDockDragStart(e, m.id)}
                        onClick={() => handleDockTap(m.id)}
                        className={`${styles.sticker} ${draggedId === m.id && !isDraggingFromCanvas ? styles.stickerDragging : ''}`}
                        style={{ 
                          backgroundImage: `url(${m.url})`,
                          border: isSelected ? '3.5px solid #0ea5e9' : 'none',
                          borderRadius: isSelected ? '12px' : '0',
                          boxShadow: isSelected ? '0 0 15px rgba(14,165,233,0.5)' : 'none',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }}
                        title={`Drag ${m.name} onto its shadow target`}
                      />
                    )}
                  </div>
                  <span className={styles.slotNumber}>{index + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Live placed tracking statistics */}
          <div className={styles.dockCount}>
            <span>Stickers in picture: <strong>{placedItems.length} / {MASCOTS.length}</strong></span>
            <span>Correctly Snapped: <strong>{placedItems.filter(p => p.isSnapped).length}</strong></span>
          </div>

          {/* Feedback logs alerts */}
          {feedback && (
            <div className={`${styles.feedbackAlert} ${feedback.type === 'success' ? styles.successAlert : feedback.type === 'error' ? styles.errorAlert : styles.successAlert}`} style={{ background: feedback.type === 'info' ? '#f0f9ff' : '', borderColor: feedback.type === 'info' ? '#0ea5e9' : '', color: feedback.type === 'info' ? '#0369a1' : '' }}>
              <span>{feedback.type === 'success' ? '✨' : feedback.type === 'error' ? '❌' : 'ℹ️'}</span>
              <p style={{ margin: 0 }}>{feedback.text}</p>
            </div>
          )}

          {/* Submit action controls row */}
          <div className={styles.actionRow}>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className={styles.submitBtn}
            >
              Submit
            </button>
            <div className={styles.navControls}>
              <button type="button" onClick={generateNewQuestion} className={styles.navBtn}>Refresh Game 🔄</button>
            </div>
          </div>
        </section>

        {/* Right Side Scoring widgets panel */}
        <section className={styles.widgetsPanel}>
          <div className={styles.widget}>
            <div className={`${styles.widgetHeader} ${styles.questionsHeader}`}>
              Questions Answered
            </div>
            <div className={styles.widgetBody}>
              <span className={styles.widgetValue}>{questionsAnswered}</span>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={`${styles.widgetHeader} ${styles.timeHeader}`}>
              Time Elapsed
            </div>
            <div className={styles.widgetBody}>
              <span className={styles.widgetValue}>{formatTime(secondsElapsed)}</span>
              <span 
                onClick={() => setIsTimerPaused(!isTimerPaused)} 
                className={styles.widgetSubtext}
                style={{ cursor: 'pointer', color: '#0ea5e9' }}
              >
                {isTimerPaused ? '▶️ Resume' : '⏸️ Pause'}
              </span>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={`${styles.widgetHeader} ${styles.scoreHeader}`}>
              SmartScore
            </div>
            <div className={styles.widgetBody}>
              <span className={styles.widgetValue} style={{ color: '#f97316' }}>{smartScore}</span>
              <span className={styles.widgetSubtext}>out of 100</span>
            </div>
          </div>

          <div className={styles.scratchpadWidget} onClick={() => speak("Scratchpad clicked")}>
            <span className={styles.scratchpadIcon}>✏️</span>
            <span className={styles.scratchpadText}>Scratchpad</span>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', margin: '40px 0' }}>
        <a href="/practice-move-demo" style={{ color: '#64748b', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
          ← Back to Sandbox Playground
        </a>
      </footer>
    </div>
  );
}
