'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './rearrange.module.css';

// 6 Stickers (3 image-based, 3 emoji-based)
const INITIAL_STICKERS = [
  { id: 'st-1', name: 'Penguin', url: '/images/penguin.svg', type: 'image', category: 'animals', width: 14, height: 14 },
  { id: 'st-2', name: 'Rabbit', url: '/images/rabbit.svg', type: 'image', category: 'animals', width: 14, height: 14 },
  { id: 'st-3', name: 'Alex', url: '/images/alex_avatar.png', type: 'image', category: 'mascots', width: 15, height: 15 },
  { id: 'st-4', name: 'Gift', content: '🎁', type: 'emoji', category: 'emojis', width: 14, height: 14 },
  { id: 'st-5', name: 'Heart', content: '❤️', type: 'emoji', category: 'emojis', width: 14, height: 14 },
  { id: 'st-6', name: 'Star', content: '⭐', type: 'emoji', category: 'emojis', width: 14, height: 14 },
];

export default function StickersRearrangeDemoPage() {
  const [placedItems, setPlacedItems] = useState([]); // Array of { id, x, y, name, type, category, url, content, width, height }
  
  // Game states matching the IXL scoreboard widgets
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [smartScore, setSmartScore] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Dragging & UI states
  const [draggedId, setDraggedId] = useState(null); // sticker ID
  const [isDraggingFromCanvas, setIsDraggingFromCanvas] = useState(false);
  const [selectedDockSticker, setSelectedDockSticker] = useState(null); // Mobile click sticker ID
  const [feedback, setFeedback] = useState({ 
    text: 'Drag stickers onto the picture columns! Column 1 is for Animals, Column 2 is for Mascots, and Column 3 is for Emojis. Rearrange them vertically inside the columns to put them in A-Z order!', 
    type: 'info' 
  });

  const canvasRef = useRef(null);

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
    speak("Drag stickers onto the picture columns. Column 1 is for Animals, Column 2 is for Mascots, and Column 3 is for Emojis. Rearrange them vertically in alphabetical order from A to Z.");
  };

  const handleReset = () => {
    setPlacedItems([]);
    setSelectedDockSticker(null);
    setFeedback({
      text: 'Drag stickers onto the picture columns! Column 1 is for Animals, Column 2 is for Mascots, and Column 3 is for Emojis. Rearrange them vertically inside the columns to put them in A-Z order!',
      type: 'info'
    });
    speak("Ready to play again! Sort the stickers on the picture and rearrange them in alphabetical order.");
  };

  // Drag and drop mechanics
  const handleDropToCanvas = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    let stickerId = draggedId;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        stickerId = data.stickerId;
        grabOffsetX = data.offsetX || 0;
        grabOffsetY = data.offsetY || 0;
      }
    } catch (err) {
      // fallback
    }

    if (!stickerId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const relativeX = e.clientX - canvasRect.left;
    const relativeY = e.clientY - canvasRect.top;

    const sticker = INITIAL_STICKERS.find(s => s.id === stickerId);
    if (!sticker) return;

    // Calculate current pixel size of mascot
    const stickerWidthPx = (sticker.width / 100) * canvasRect.width;
    const stickerHeightPx = (sticker.height / 100) * canvasRect.height;

    // Clamp grab offset
    const cleanGrabX = Math.max(0, Math.min(stickerWidthPx, grabOffsetX));
    const cleanGrabY = Math.max(0, Math.min(stickerHeightPx, grabOffsetY));

    // Align top-left of sticker by subtracting offset
    const dropLeftPx = relativeX - cleanGrabX;
    const dropTopPx = relativeY - cleanGrabY;

    let px = (dropLeftPx / canvasRect.width) * 100;
    let py = (dropTopPx / canvasRect.height) * 100;

    // Clamp boundary so sticker stays inside canvas
    px = Math.max(0, Math.min(100 - sticker.width, px));
    py = Math.max(0, Math.min(100 - sticker.height, py));

    if (isDraggingFromCanvas) {
      // Repositioning already placed item
      setPlacedItems(prev => prev.map(item => 
        item.id === stickerId ? { ...item, x: px, y: py } : item
      ));
    } else {
      // Dropping new item from dock
      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== stickerId),
        { ...sticker, x: px, y: py }
      ]);
    }

    // Speak column placement feedback
    let columnNum = 1;
    if (px > 66.6) columnNum = 3;
    else if (px > 33.3) columnNum = 2;
    speak(`Placed ${sticker.name} in Column ${columnNum}`);

    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  const handleDockDragStart = (e, stickerId) => {
    setDraggedId(stickerId);
    setIsDraggingFromCanvas(false);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('application/json', JSON.stringify({ stickerId, offsetX, offsetY }));
  };

  const handleCanvasDragStart = (e, stickerId) => {
    e.stopPropagation();
    setDraggedId(stickerId);
    setIsDraggingFromCanvas(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('application/json', JSON.stringify({ stickerId, offsetX, offsetY }));
  };

  const handleDropToDock = (e) => {
    e.preventDefault();
    if (draggedId !== null && isDraggingFromCanvas) {
      // Return to dock
      setPlacedItems(prev => prev.filter(item => item.id !== draggedId));
      const sticker = INITIAL_STICKERS.find(s => s.id === draggedId);
      if (sticker) {
        speak(`Returned ${sticker.name} to dock`);
      }
    }
    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setIsDraggingFromCanvas(false);
  };

  // Mobile Tap Fallbacks
  const handleDockTap = (stickerId) => {
    const isPlaced = placedItems.some(item => item.id === stickerId);
    if (isPlaced) return;

    if (selectedDockSticker === stickerId) {
      setSelectedDockSticker(null);
    } else {
      setSelectedDockSticker(stickerId);
      const sticker = INITIAL_STICKERS.find(s => s.id === stickerId);
      if (sticker) speak(sticker.name);
    }
  };

  const handleCanvasTap = (e) => {
    if (selectedDockSticker !== null) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      let relativeX = e.clientX - canvasRect.left;
      let relativeY = e.clientY - canvasRect.top;

      let px = (relativeX / canvasRect.width) * 100;
      let py = (relativeY / canvasRect.height) * 100;

      const sticker = INITIAL_STICKERS.find(s => s.id === selectedDockSticker);
      if (!sticker) return;

      // Center the sticker around the tap location
      px = Math.max(0, Math.min(100 - sticker.width, px - sticker.width / 2));
      py = Math.max(0, Math.min(100 - sticker.height, py - sticker.height / 2));

      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== selectedDockSticker),
        { ...sticker, x: px, y: py }
      ]);
      
      let columnNum = 1;
      if (px > 66.6) columnNum = 3;
      else if (px > 33.3) columnNum = 2;
      speak(`Placed ${sticker.name} in Column ${columnNum}`);

      setSelectedDockSticker(null);
    }
  };

  const handlePlacedItemTap = (e, stickerId) => {
    e.stopPropagation();
    // Return back to dock on tap inside canvas
    const item = placedItems.find(p => p.id === stickerId);
    setPlacedItems(prev => prev.filter(p => p.id !== stickerId));
    if (item) {
      speak(`Returned ${item.name} to dock`);
    }
  };

  // Submit and Validation
  const handleSubmit = () => {
    if (placedItems.length < INITIAL_STICKERS.length) {
      const msg = "Place all stickers in the columns first!";
      setFeedback({ text: msg, type: 'error' });
      speak(msg);
      setSmartScore(prev => Math.max(0, prev - 5));
      return;
    }

    // Group placed stickers into columns based on their X coordinates
    const col1Items = placedItems.filter(item => item.x < 33.33).sort((a, b) => a.y - b.y);
    const col2Items = placedItems.filter(item => item.x >= 33.33 && item.x < 66.66).sort((a, b) => a.y - b.y);
    const col3Items = placedItems.filter(item => item.x >= 66.66).sort((a, b) => a.y - b.y);

    // Validation rules:
    // 1. Column 1: Only Animals (Penguin, Rabbit) ordered A-Z (Penguin above Rabbit, i.e., Penguin Y < Rabbit Y)
    const col1Correct = col1Items.length === 2 && 
                         col1Items[0].id === 'st-1' && // Penguin
                         col1Items[1].id === 'st-2';    // Rabbit

    // 2. Column 2: Only Mascots (Alex)
    const col2Correct = col2Items.length === 1 && 
                         col2Items[0].id === 'st-3';    // Alex

    // 3. Column 3: Only Emojis (Gift, Heart, Star) ordered A-Z (Gift Y < Heart Y < Star Y)
    const col3Correct = col3Items.length === 3 && 
                         col3Items[0].id === 'st-4' && // Gift
                         col3Items[1].id === 'st-5' && // Heart
                         col3Items[2].id === 'st-6';    // Star

    if (col1Correct && col2Correct && col3Correct) {
      setFeedback({
        text: 'Fantastic! All stickers are sorted and arranged perfectly in A-Z order inside the landscape columns!',
        type: 'success'
      });
      speak("Wonderful work! You solved the puzzle.");
      setSmartScore(prev => Math.min(100, prev + 20));
      setQuestionsAnswered(prev => prev + 1);

      setTimeout(() => {
        handleReset();
      }, 3500);
    } else {
      let errorMsg = '';
      const col1HasIncorrect = col1Items.some(i => i.category !== 'animals');
      const col2HasIncorrect = col2Items.some(i => i.category !== 'mascots');
      const col3HasIncorrect = col3Items.some(i => i.category !== 'emojis');

      if (col1HasIncorrect || col2HasIncorrect || col3HasIncorrect) {
        errorMsg = 'Check your columns! Make sure animals are in Column 1, mascots in Column 2, and emojis in Column 3.';
      } else {
        errorMsg = 'Check your vertical order! Inside each column, stickers must be ordered A-Z from top to bottom.';
      }
      setFeedback({ text: errorMsg, type: 'error' });
      speak(errorMsg);
      setSmartScore(prev => Math.max(0, prev - 8));
    }
  };

  // Group columns for statistics tracking display
  const col1Count = placedItems.filter(item => item.x < 33.33).length;
  const col2Count = placedItems.filter(item => item.x >= 33.33 && item.x < 66.66).length;
  const col3Count = placedItems.filter(item => item.x >= 66.66).length;

  return (
    <div className={styles.container}>
      {/* Top Navigation Header */}
      <nav className={styles.ixlNavBar}>
        <div className={styles.ixlBrand}>
          <div className={styles.ixlLogo}>
            Klass<span>Champ</span>
          </div>
          <div className={styles.searchIcon}>🔍</div>
        </div>
        <div className={styles.navLinks}>
          <span>Learning Path</span>
          <span>Analytics</span>
          <span>Leaderboard</span>
        </div>
        <div className={styles.authButtons}>
          <button type="button" className={styles.signInBtn}>Dashboard</button>
          <button type="button" className={styles.joinBtn}>Log out</button>
        </div>
      </nav>

      {/* Grade Breadcrumbs */}
      <header className={styles.subHeader}>
        <div className={styles.breadcrumbs}>
          <span>Grade 1 Practice</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: '800' }}>Sticker Free-dragging Sorting Demo</span>
        </div>
        <Link href="/grades" className={styles.shareBtn}>‹ Back to Catalog</Link>
      </header>

      {/* Main Workspace Layout */}
      <main className={styles.layout}>
        {/* Left Side Practice Sheet */}
        <section className={styles.practiceCard}>
          <div className={styles.learnExample} onClick={handleReset}>
            🔄 Reset Placement / Play Again
          </div>

          {/* Readout instruction prompt */}
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
              Sort the stickers into columns <strong>inside the picture</strong> and rearrange them vertically in A-Z order.
            </span>
          </div>

          {/* Landscape Canvas Frame divided into 3 vertical lanes */}
          <div
            ref={canvasRef}
            className={styles.canvasFrame}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToCanvas}
            onClick={handleCanvasTap}
            style={{
              position: 'relative',
              borderRadius: 16,
              border: '2px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(15,23,42,0.05)',
              touchAction: 'none'
            }}
          >
            {/* Scenery background wallpaper */}
            <img
              src="/images/prek_landscape.webp"
              alt="Scenery background"
              className={styles.canvasBg}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Render 3 Column Lane Separators/Guidelines */}
            {[0, 1, 2].map((index) => {
              const leftPercent = index * 33.33;
              const titles = ['Column 1: Animals', 'Column 2: Mascots', 'Column 3: Emojis'];
              const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: 0,
                    width: '33.33%',
                    height: '100%',
                    borderRight: index < 2 ? '2.5px dashed rgba(255, 255, 255, 0.45)' : 'none',
                    background: 'rgba(255, 255, 255, 0.015)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 8px',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                >
                  {/* Visual Lane Header Label */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      color: colors[index],
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                    }}
                  >
                    {titles[index]}
                  </div>
                </div>
              );
            })}

            {/* Render placed stickers dragging freely on the canvas */}
            {placedItems.map((item) => {
              const isSelected = selectedDockSticker === item.id;
              
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleCanvasDragStart(e, item.id)}
                  onClick={(e) => handlePlacedItemTap(e, item.id)}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${item.width}%`,
                    height: `${item.height}%`,
                    zIndex: 10,
                    cursor: 'grab',
                    transition: draggedId === item.id ? 'none' : 'transform 100ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Sticker card container inside canvas */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#ffffff',
                      border: isSelected ? '3px solid #0ea5e9' : '1.5px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      padding: '4px',
                      boxShadow: isSelected 
                        ? '0 0 15px rgba(14,165,233,0.5), 0 4px 6px rgba(0,0,0,0.1)' 
                        : '0 4px 8px rgba(0,0,0,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                  >
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        style={{ width: '85%', height: '85%', objectFit: 'contain', pointerEvents: 'none' }} 
                      />
                    ) : (
                      <span style={{ fontSize: '32px', pointerEvents: 'none', lineHeight: 1 }}>{item.content}</span>
                    )}

                    {/* Close marker to return sticker back to dock */}
                    <button
                      type="button"
                      onClick={(e) => handlePlacedItemTap(e, item.id)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: '1.5px solid #ffffff',
                        fontSize: '9px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        zIndex: 12
                      }}
                      title="Return back to dock"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticker Dock Row */}
          <div 
            className={styles.dockPanel}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToDock}
            style={{ borderRadius: 16 }}
          >
            {INITIAL_STICKERS.map((m, index) => {
              const isPlaced = placedItems.some(item => item.id === m.id);
              const isSelected = selectedDockSticker === m.id;
              const isDragging = draggedId === m.id && !isDraggingFromCanvas;

              return (
                <div key={m.id} className={styles.dockSlotWrapper}>
                  <div className={styles.dockSlot}>
                    {isPlaced ? (
                      <div className={styles.silhouettePlaceholder}>
                        {m.type === 'image' ? (
                          <img src={m.url} alt={m.name} className={styles.dockStickerImage} style={{ opacity: 0.15, filter: 'grayscale(1)' }} />
                        ) : (
                          <span className={styles.dockStickerEmoji} style={{ opacity: 0.15, filter: 'grayscale(1)' }}>{m.content}</span>
                        )}
                      </div>
                    ) : (
                      <div
                        draggable
                        onDragStart={(e) => handleDockDragStart(e, m.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleDockTap(m.id)}
                        className={`${styles.dockSlot} ${isSelected ? styles.dockSlotSelected : ''} ${isDragging ? styles.dockSlotDragging : ''}`}
                        title={`Drag ${m.name} onto the canvas columns`}
                        style={{ border: 'none', boxShadow: 'none', width: '100%', height: '100%' }}
                      >
                        {m.type === 'image' ? (
                          <img src={m.url} alt={m.name} className={styles.dockStickerImage} />
                        ) : (
                          <span className={styles.dockStickerEmoji}>{m.content}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={styles.slotNumber}>{index + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Statistics summary footer */}
          <div className={styles.dockCount}>
            <span>Stickers Placed: <strong>{placedItems.length} / {INITIAL_STICKERS.length}</strong></span>
            <span>Col 1: <strong>{col1Count}</strong> | Col 2: <strong>{col2Count}</strong> | Col 3: <strong>{col3Count}</strong></span>
          </div>

          {/* Feedback alerts */}
          {feedback && (
            <div 
              className={`${styles.feedbackAlert} ${
                feedback.type === 'success' ? styles.successAlert : feedback.type === 'error' ? styles.errorAlert : ''
              }`}
              style={{
                background: feedback.type === 'info' ? '#f0f9ff' : '',
                borderColor: feedback.type === 'info' ? '#0ea5e9' : '',
                color: feedback.type === 'info' ? '#0369a1' : ''
              }}
            >
              <span>{feedback.type === 'success' ? '✨' : feedback.type === 'error' ? '❌' : 'ℹ️'}</span>
              <p style={{ margin: 0 }}>{feedback.text}</p>
            </div>
          )}

          {/* Submit Action Row */}
          <div className={styles.actionRow}>
            <button 
              type="button" 
              onClick={handleSubmit} 
              className={styles.submitBtn}
            >
              Submit Answer
            </button>
            <div className={styles.navControls}>
              <Link href="/grades" className={styles.navBtn}>Grades</Link>
              <Link href="/practice-stickers-demo" className={styles.navBtn}>Stickers Demo 1</Link>
            </div>
          </div>
        </section>

        {/* Right Side Scoring Widgets Panel */}
        <aside className={styles.widgetsPanel}>
          <div className={styles.widget}>
            <div className={`${styles.widgetHeader} ${styles.questionsHeader}`}>
              Questions
            </div>
            <div className={styles.widgetBody}>
              <span className={styles.widgetValue}>{questionsAnswered}</span>
              <span className={styles.widgetSubtext}>Answered</span>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={`${styles.widgetHeader} ${styles.timeHeader}`}>
              Time Elapsed
            </div>
            <div className={styles.widgetBody}>
              <span className={styles.widgetValue}>{formatTime(secondsElapsed)}</span>
              <span className={styles.widgetSubtext}>Elapsed</span>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={`${styles.widgetHeader} ${styles.scoreHeader}`}>
              SmartScore
            </div>
            <div className={styles.widgetBody}>
              <span className={styles.widgetValue}>{smartScore}</span>
              <span className={styles.widgetSubtext}>Out of 100</span>
            </div>
          </div>

          <div className={styles.scratchpadWidget}>
            <span className={styles.scratchpadIcon}>✏️</span>
            <span className={styles.scratchpadText}>Scratchpad</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
