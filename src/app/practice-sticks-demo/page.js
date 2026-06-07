'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './sticks.module.css';

// Pre-configured dimensions for Square, Rectangle, and Triangle shapes
const SHAPE_CONFIGS = {
  rectangle: {
    name: 'Rectangle',
    prompt: 'Use the sticks to build a rectangle.',
    instruction: 'Drag the long and short sticks to make a rectangle.',
    // Stick descriptions for Dock (flat layout)
    dockStickers: [
      { id: 'h_stick_1', type: 'horizontal', name: 'Long Horizontal Stick', width: 60, height: 4.5, isLong: true },
      { id: 'h_stick_2', type: 'horizontal', name: 'Long Horizontal Stick', width: 60, height: 4.5, isLong: true },
      { id: 'v_stick_1', type: 'vertical', name: 'Short Vertical Stick', width: 2.5, height: 40, isLong: false },
      { id: 'v_stick_2', type: 'vertical', name: 'Short Vertical Stick', width: 2.5, height: 40, isLong: false }
    ],
    // Targets in percentage coordinates
    targets: [
      { id: 'top', type: 'horizontal', x: 20, y: 28, width: 60, height: 4.5, label: 'Top Edge' },
      { id: 'bottom', type: 'horizontal', x: 20, y: 68, width: 60, height: 4.5, label: 'Bottom Edge' },
      { id: 'left', type: 'vertical', x: 19, y: 30, width: 2.5, height: 40, label: 'Left Edge' },
      { id: 'right', type: 'vertical', x: 78.5, y: 30, width: 2.5, height: 40, label: 'Right Edge' }
    ]
  },
  square: {
    name: 'Square',
    prompt: 'Use the sticks to build a square.',
    instruction: 'Drag the four equal sticks to make a square.',
    // Stick descriptions for Dock (flat layout)
    dockStickers: [
      { id: 'h_stick_1', type: 'horizontal', name: 'Horizontal Stick', width: 50, height: 4.5, isLong: false },
      { id: 'h_stick_2', type: 'horizontal', name: 'Horizontal Stick', width: 50, height: 4.5, isLong: false },
      { id: 'v_stick_1', type: 'vertical', name: 'Vertical Stick', width: 2.5, height: 50, isLong: false },
      { id: 'v_stick_2', type: 'vertical', name: 'Vertical Stick', width: 2.5, height: 50, isLong: false }
    ],
    // Targets in percentage coordinates
    targets: [
      { id: 'top', type: 'horizontal', x: 25, y: 23, width: 50, height: 4.5, label: 'Top Edge' },
      { id: 'bottom', type: 'horizontal', x: 25, y: 73, width: 50, height: 4.5, label: 'Bottom Edge' },
      { id: 'left', type: 'vertical', x: 24, y: 25, width: 2.5, height: 50, label: 'Left Edge' },
      { id: 'right', type: 'vertical', x: 73.5, y: 25, width: 2.5, height: 50, label: 'Right Edge' }
    ]
  },
  triangle: {
    name: 'Triangle',
    prompt: 'Use the sticks to build a triangle.',
    instruction: 'Drag the three sticks to make a triangle.',
    // Stick descriptions for Dock
    dockStickers: [
      { id: 'h_stick_1', type: 'horizontal', name: 'Base Stick', width: 40, height: 4.5 },
      { id: 'v_stick_1', type: 'sloped_left', name: 'Left Side Stick', width: 32, height: 4.5 },
      { id: 'v_stick_2', type: 'sloped_right', name: 'Right Side Stick', width: 32, height: 4.5 }
    ],
    // Sloped targets: using transform rotation and origin to build triangle
    targets: [
      { id: 'bottom', type: 'horizontal', x: 30, y: 73, width: 40, height: 4.5, label: 'Bottom Edge' },
      { id: 'left', type: 'sloped_left', x: 30, y: 75, width: 32, height: 4.5, transform: 'rotate(-51.3deg)', transformOrigin: '0% 50%', label: 'Left Edge' },
      { id: 'right', type: 'sloped_right', x: 50, y: 25, width: 32, height: 4.5, transform: 'rotate(51.3deg)', transformOrigin: '0% 50%', label: 'Right Edge' }
    ]
  }
};

export default function SticksDemoPage() {
  const [activeMode, setActiveMode] = useState('rectangle'); // 'rectangle', 'square', or 'triangle'
  const config = SHAPE_CONFIGS[activeMode];

  // Placed sticks state: Array of { id, x: pctX, y: pctY, type, isSnapped, targetId }
  const [placedItems, setPlacedItems] = useState([]);
  
  // Game states matching the IXL scoreboard widgets
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [smartScore, setSmartScore] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  // Dragging & UI states
  const [draggedId, setDraggedId] = useState(null); // stick ID (e.g. 'h_stick_1')
  const [isDraggingFromCanvas, setIsDraggingFromCanvas] = useState(false);
  const [selectedDockSticker, setSelectedDockSticker] = useState(null); // Mobile click stick ID
  const [feedback, setFeedback] = useState({ text: config.prompt, type: 'info' });

  const canvasRef = useRef(null);
  const snapAudioRef = useRef({}); // Tracks snapping per targetId to prevent loops

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

  // Sync mode changes and reset state
  useEffect(() => {
    generateNewQuestion(activeMode);
  }, [activeMode]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const generateNewQuestion = (mode = activeMode) => {
    setPlacedItems([]);
    setSelectedDockSticker(null);
    snapAudioRef.current = {};
    setFeedback({ text: SHAPE_CONFIGS[mode].prompt, type: 'info' });
    speak(SHAPE_CONFIGS[mode].prompt + " " + SHAPE_CONFIGS[mode].instruction);
  };

  // Speaks using Web Speech synthesis (Amy voice mappings)
  const speak = (msg) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.95;
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.includes('Amy') || 
        v.name.includes('Samantha') || 
        v.name.includes('Google US English') ||
        v.lang.startsWith('en-US')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReadPrompt = () => {
    speak(config.prompt + " " + config.instruction);
  };

  // Drag and drop mechanics
  const handleDropToCanvas = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    let stickId = draggedId;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        stickId = data.stickId;
        grabOffsetX = data.offsetX || 0;
        grabOffsetY = data.offsetY || 0;
      }
    } catch (err) {
      // fallback
    }

    if (!stickId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const relativeX = clientX - canvasRect.left;
    const relativeY = clientY - canvasRect.top;

    const stick = config.dockStickers.find(s => s.id === stickId);
    if (!stick) return;

    // Calculate current pixel size of stick
    const stickWidthPx = (stick.width / 100) * canvasRect.width;
    const stickHeightPx = (stick.height / 100) * canvasRect.height;

    // Clamp grab offset
    const cleanGrabX = Math.max(0, Math.min(stickWidthPx, grabOffsetX));
    const cleanGrabY = Math.max(0, Math.min(stickHeightPx, grabOffsetY));

    // Align top-left of sticker by subtracting offset
    const dropLeftPx = relativeX - cleanGrabX;
    const dropTopPx = relativeY - cleanGrabY;

    let px = (dropLeftPx / canvasRect.width) * 100;
    let py = (dropTopPx / canvasRect.height) * 100;

    // Clamp boundary so stick stays inside canvas
    px = Math.max(0, Math.min(100 - stick.width, px));
    py = Math.max(0, Math.min(100 - stick.height, py));

    // MAGNETIC SNAPPING CHECK
    const activePlacements = placedItems.filter(item => item.id !== stickId);
    const takenTargetIds = new Set(activePlacements.filter(p => p.isSnapped).map(p => p.targetId));

    const candidateTargets = config.targets.filter(t => 
      t.type === stick.type && !takenTargetIds.has(t.id)
    );

    let finalX = px;
    let finalY = py;
    let snapped = false;
    let snappedTargetId = null;
    const snapThreshold = 7.5; // Snap threshold percentage

    for (const target of candidateTargets) {
      const dx = px - target.x;
      const dy = py - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < snapThreshold) {
        finalX = target.x;
        finalY = target.y;
        snapped = true;
        snappedTargetId = target.id;
        break;
      }
    }

    if (snapped) {
      if (!snapAudioRef.current[snappedTargetId]) {
        speak(`Snapped to ${snappedTargetId} edge`);
        snapAudioRef.current[snappedTargetId] = true;
      }
    } else {
      const currentPlacement = placedItems.find(p => p.id === stickId);
      if (currentPlacement?.isSnapped && currentPlacement?.targetId) {
        snapAudioRef.current[currentPlacement.targetId] = false;
        speak(`Released stick`);
      }
    }

    if (isDraggingFromCanvas) {
      setPlacedItems(prev => prev.map(item => 
        item.id === stickId ? { ...item, x: finalX, y: finalY, isSnapped: snapped, targetId: snappedTargetId } : item
      ));
    } else {
      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== stickId),
        { id: stickId, x: finalX, y: finalY, type: stick.type, isSnapped: snapped, targetId: snappedTargetId }
      ]);
    }

    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  const handleDockDragStart = (e, stickId) => {
    setDraggedId(stickId);
    setIsDraggingFromCanvas(false);
    
    const offsetX = e.nativeEvent.offsetX || 0;
    const offsetY = e.nativeEvent.offsetY || 0;
    e.dataTransfer.setData('text/plain', JSON.stringify({ stickId, offsetX, offsetY }));
  };

  const handleCanvasDragStart = (e, stickId) => {
    e.stopPropagation();
    setDraggedId(stickId);
    setIsDraggingFromCanvas(true);
    
    const offsetX = e.nativeEvent.offsetX || 0;
    const offsetY = e.nativeEvent.offsetY || 0;
    e.dataTransfer.setData('text/plain', JSON.stringify({ stickId, offsetX, offsetY }));
  };

  const handleDropToDock = (e) => {
    e.preventDefault();
    if (draggedId !== null && isDraggingFromCanvas) {
      const item = placedItems.find(p => p.id === draggedId);
      setPlacedItems(prev => prev.filter(p => p.id !== draggedId));
      if (item) {
        speak(`Returned stick`);
        if (item.targetId) {
          snapAudioRef.current[item.targetId] = false;
        }
      }
    }
    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  // Mobile Tap Fallbacks
  const handleDockTap = (stickId) => {
    const isPlaced = placedItems.some(item => item.id === stickId);
    if (isPlaced) return;

    if (selectedDockSticker === stickId) {
      setSelectedDockSticker(null);
    } else {
      setSelectedDockSticker(stickId);
      const stick = config.dockStickers.find(s => s.id === stickId);
      if (stick) speak(stick.name);
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

      const stick = config.dockStickers.find(s => s.id === selectedDockSticker);
      if (!stick) return;

      px = Math.max(0, Math.min(100 - stick.width, px - stick.width / 2));
      py = Math.max(0, Math.min(100 - stick.height, py - stick.height / 2));

      // Snap logic on touch
      const activePlacements = placedItems.filter(item => item.id !== selectedDockSticker);
      const takenTargetIds = new Set(activePlacements.filter(p => p.isSnapped).map(p => p.targetId));

      const candidateTargets = config.targets.filter(t => 
        t.type === stick.type && !takenTargetIds.has(t.id)
      );

      let finalX = px;
      let finalY = py;
      let snapped = false;
      let snappedTargetId = null;

      for (const target of candidateTargets) {
        const dx = px - target.x;
        const dy = py - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 9.5) {
          finalX = target.x;
          finalY = target.y;
          snapped = true;
          snappedTargetId = target.id;
          speak(`Snapped to ${target.id} edge`);
          snapAudioRef.current[target.id] = true;
          break;
        }
      }

      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== selectedDockSticker),
        { id: selectedDockSticker, x: finalX, y: finalY, type: stick.type, isSnapped: snapped, targetId: snappedTargetId }
      ]);
      setSelectedDockSticker(null);
    }
  };

  const handlePlacedItemTap = (e, stickId) => {
    e.stopPropagation();
    const item = placedItems.find(p => p.id === stickId);
    setPlacedItems(prev => prev.filter(p => p.id !== stickId));
    if (item) {
      speak("Returned");
      if (item.targetId) {
        snapAudioRef.current[item.targetId] = false;
      }
    }
  };

  // Submit and check answers
  const handleSubmit = () => {
    const snappedItems = placedItems.filter(item => item.isSnapped);
    
    if (snappedItems.length === config.dockStickers.length) {
      const congrats = `Awesome job! You successfully built a ${config.name}!`;
      setFeedback({
        text: congrats,
        type: 'success'
      });
      speak(congrats);
      setSmartScore(prev => Math.min(100, prev + 20));
      setQuestionsAnswered(prev => prev + 1);

      setTimeout(() => {
        // Cycle active modes
        let nextMode;
        if (activeMode === 'rectangle') nextMode = 'square';
        else if (activeMode === 'square') nextMode = 'triangle';
        else nextMode = 'rectangle';
        setActiveMode(nextMode);
      }, 3500);
    } else {
      let errorMsg = '';
      if (placedItems.length < config.dockStickers.length) {
        errorMsg = 'Some sticks are still in the tray. Drag all sticks onto the blueprint outlines!';
      } else {
        errorMsg = `Not quite all sides are complete. Align each stick to the correct edge of the ${config.name}!`;
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
          <span>Kindergarten</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: '800' }}>M.K7 Build shapes with sticks</span>
        </div>
        <div className={styles.modeToggleGroup}>
          <button 
            type="button" 
            onClick={() => setActiveMode('rectangle')}
            className={`${styles.modeBtn} ${activeMode === 'rectangle' ? styles.modeBtnActive : ''}`}
          >
            Rectangle
          </button>
          <button 
            type="button" 
            onClick={() => setActiveMode('square')}
            className={`${styles.modeBtn} ${activeMode === 'square' ? styles.modeBtnActive : ''}`}
          >
            Square
          </button>
          <button 
            type="button" 
            onClick={() => setActiveMode('triangle')}
            className={`${styles.modeBtn} ${activeMode === 'triangle' ? styles.modeBtnActive : ''}`}
          >
            Triangle
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className={styles.layout}>
        {/* Left Side Practice Sheet */}
        <section className={styles.practiceCard}>
          {/* Restart button */}
          <div className={styles.learnExample} onClick={() => generateNewQuestion()}>
            🔄 Reset Placement / Play Again
          </div>

          {/* Prompt Instruction */}
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
              {config.prompt} <strong>{config.instruction}</strong>
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
            {/* Blueprint grid background */}
            <div className={styles.blueprintGrid} />

            {/* Target outline guides (rectangle/square/triangle outlines inside) */}
            {config.targets.map((target) => {
              const matchedItem = placedItems.find(item => item.targetId === target.id);
              const isSnapped = !!matchedItem;

              return (
                <div
                  key={target.id}
                  className={`${styles.shadowTarget} ${isSnapped ? styles.shadowTargetActive : ''} ${target.type === 'vertical' ? styles.shadowVertical : styles.shadowHorizontal}`}
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: `${target.width}%`,
                    height: `${target.height}%`,
                    transform: target.transform || '',
                    transformOrigin: target.transformOrigin || ''
                  }}
                >
                  <div className={styles.shadowTargetLabel}>
                    {isSnapped ? '✓ Snapped' : target.label}
                  </div>
                </div>
              );
            })}

            {/* Placed sticks rendered on the canvas with correct rotations */}
            {placedItems.map((item) => {
              const stick = config.dockStickers.find(s => s.id === item.id);
              if (!stick) return null;

              const target = config.targets.find(t => t.id === item.targetId);
              const rotation = target?.transform || '';
              const origin = target?.transformOrigin || '';

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleCanvasDragStart(e, item.id)}
                  onClick={(e) => handlePlacedItemTap(e, item.id)}
                  className={`${styles.placedStick} ${stick.type === 'vertical' ? styles.placedStickVertical : styles.placedStickHorizontal} ${draggedId === item.id && isDraggingFromCanvas ? styles.placedStickActive : ''}`}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${stick.width}%`,
                    height: `${stick.height}%`,
                    transform: rotation,
                    transformOrigin: origin
                  }}
                  title="Drag to adjust, tap to return back to tray"
                />
              );
            })}
          </div>

          {/* Sticks Tray Dock Panel */}
          <div 
            className={styles.dockPanel}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToDock}
          >
            {config.dockStickers.map((stick, index) => {
              const isPlaced = placedItems.some(item => item.id === stick.id);
              const isSelected = selectedDockSticker === stick.id;

              return (
                <div key={stick.id} className={styles.dockSlotWrapper}>
                  <div className={styles.dockSlot}>
                    {isPlaced ? (
                      /* Silhouette outline when stick is placed */
                      <div className={`${styles.silhouettePlaceholder} ${stick.type === 'vertical' ? styles.stickVertical : styles.stickHorizontal}`} />
                    ) : (
                      /* Draggable wooden stick card */
                      <div
                        draggable
                        onDragStart={(e) => handleDockDragStart(e, stick.id)}
                        onClick={() => handleDockTap(stick.id)}
                        className={`${styles.sticker} ${stick.type === 'vertical' ? styles.stickVertical : styles.stickHorizontal} ${draggedId === stick.id && !isDraggingFromCanvas ? styles.stickerDragging : ''}`}
                        style={{ 
                          border: isSelected ? '3.5px solid #0ea5e9' : '',
                          borderRadius: '8px',
                          boxShadow: isSelected ? '0 0 15px rgba(14,165,233,0.6)' : ''
                        }}
                        title={`Drag ${stick.name} onto outline`}
                      />
                    )}
                  </div>
                  <span className={styles.slotNumber}>{index + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Placed statistics */}
          <div className={styles.dockCount}>
            <span>Sticks placed: <strong>{placedItems.length} / {config.dockStickers.length}</strong></span>
            <span>Correct Snaps: <strong>{placedItems.filter(p => p.isSnapped).length}</strong></span>
          </div>

          {/* Feedback log alerts */}
          {feedback && (
            <div className={`${styles.feedbackAlert} ${feedback.type === 'success' ? styles.successAlert : feedback.type === 'error' ? styles.errorAlert : styles.successAlert}`} style={{ background: feedback.type === 'info' ? '#f0f9ff' : '', borderColor: feedback.type === 'info' ? '#0ea5e9' : '', color: feedback.type === 'info' ? '#0369a1' : '' }}>
              <span>{feedback.type === 'success' ? '✨' : feedback.type === 'error' ? '❌' : '🏗️'}</span>
              <p style={{ margin: 0 }}>{feedback.text}</p>
            </div>
          )}

          {/* Action Submit controls */}
          <div className={styles.actionRow}>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className={styles.submitBtn}
            >
              Submit
            </button>
            <div className={styles.navControls}>
              <button type="button" onClick={() => generateNewQuestion()} className={styles.navBtn}>Refresh Layout 🔄</button>
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

          <div className={styles.scratchpadWidget} onClick={() => speak("Scratchpad active")}>
            <span className={styles.scratchpadIcon}>✏️</span>
            <span className={styles.scratchpadText}>Scratchpad</span>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', margin: '40px 0' }}>
        <a href="/practice-stickers-demo" style={{ color: '#64748b', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
          ← Switch to Character Shadows Stickers Demo
        </a>
      </footer>
    </div>
  );
}
