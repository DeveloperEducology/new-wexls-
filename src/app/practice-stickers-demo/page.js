'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './stickers.module.css';

// 4 High-quality generated stickers
const STICKERS = [
  { id: 'drum', name: 'Drum', url: '/images/drum_sticker.png', category: 'non-living', width: 18, height: 18 },
  { id: 'lion', name: 'Lion', url: '/images/lion_sticker.png', category: 'living', width: 18, height: 18 },
  { id: 'elephant', name: 'Elephant', url: '/images/elephant_sticker.png', category: 'living', width: 20, height: 20 },
  { id: 'stack_of_rings', name: 'Stack of Rings', url: '/images/stack_of_rings_sticker.png', category: 'non-living', width: 18, height: 18 },
];

// Initial coordinates placed not in order matching the user's screenshot
const INITIAL_PLACED_ITEMS = [
  { id: 'drum', name: 'Drum', url: '/images/drum_sticker.png', category: 'non-living', x: 5, y: 20, width: 18, height: 18 },
  { id: 'lion', name: 'Lion', url: '/images/lion_sticker.png', category: 'living', x: 10, y: 60, width: 18, height: 18 },
  { id: 'elephant', name: 'Elephant', url: '/images/elephant_sticker.png', category: 'living', x: 65, y: 15, width: 20, height: 20 },
  { id: 'stack_of_rings', name: 'Stack of Rings', url: '/images/stack_of_rings_sticker.png', category: 'non-living', x: 70, y: 55, width: 18, height: 18 },
];

export default function StickersDemoPage() {
  const [placedItems, setPlacedItems] = useState(INITIAL_PLACED_ITEMS);
  
  // Game states matching the IXL scoreboard widgets
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [smartScore, setSmartScore] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  // Dragging & UI states
  const [draggedId, setDraggedId] = useState(null); // sticker ID
  const [selectedDockSticker, setSelectedDockSticker] = useState(null); // Mobile click/tap sticker ID
  const [feedback, setFeedback] = useState({ 
    text: 'Drag the stickers into their correct columns! Put living things on the left, and non-living things on the right.', 
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

  const generateNewQuestion = () => {
    setPlacedItems(INITIAL_PLACED_ITEMS);
    setSelectedDockSticker(null);
    setFeedback({ 
      text: 'Sort the stickers! Drag living things to the left, and non-living things to the right.', 
      type: 'info' 
    });
    speak("Ready to play again! Sort the stickers into the correct columns.");
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
    speak("Sort the stickers into the correct columns. Put living things on the left, and non-living things on the right.");
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

    const sticker = STICKERS.find(s => s.id === stickerId);
    if (!sticker) return;

    // Calculate current pixel size of sticker
    const stickerWidthPx = (sticker.width / 100) * canvasRect.width;
    const stickerHeightPx = (sticker.height / 100) * canvasRect.height;

    // Clamp grab offset to avoid offsets outside the element boundary
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

    // Update coordinates
    setPlacedItems(prev => prev.map(item => 
      item.id === stickerId ? { ...item, x: px, y: py } : item
    ));

    // Speak placement feedback
    let columnName = px < 50 ? "living things" : "Non-living things";
    speak(`Placed ${sticker.name} in ${columnName}`);

    setDraggedId(null);
  };

  const handleCanvasDragStart = (e, stickerId) => {
    e.stopPropagation();
    setDraggedId(stickerId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('application/json', JSON.stringify({ stickerId, offsetX, offsetY }));
  };

  // Mobile Tap Fallbacks
  const handleCanvasTap = (e) => {
    if (selectedDockSticker !== null) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      let relativeX = e.clientX - canvasRect.left;
      let relativeY = e.clientY - canvasRect.top;

      let px = (relativeX / canvasRect.width) * 100;
      let py = (relativeY / canvasRect.height) * 100;

      const sticker = STICKERS.find(s => s.id === selectedDockSticker);
      if (!sticker) return;

      // Center the sticker around the tap location
      px = Math.max(0, Math.min(100 - sticker.width, px - sticker.width / 2));
      py = Math.max(0, Math.min(100 - sticker.height, py - sticker.height / 2));

      setPlacedItems(prev => prev.map(item => 
        item.id === selectedDockSticker ? { ...item, x: px, y: py } : item
      ));
      
      let columnName = px < 50 ? "living things" : "Non-living things";
      speak(`Moved ${sticker.name} to ${columnName}`);

      setSelectedDockSticker(null);
    }
  };

  const handlePlacedItemTap = (e, stickerId) => {
    e.stopPropagation();
    if (selectedDockSticker === stickerId) {
      setSelectedDockSticker(null);
    } else {
      setSelectedDockSticker(stickerId);
      const sticker = STICKERS.find(s => s.id === stickerId);
      if (sticker) speak(sticker.name);
    }
  };

  // Check answers
  const handleSubmit = () => {
    const livingItems = placedItems.filter(item => item.x < 50);
    const nonLivingItems = placedItems.filter(item => item.x >= 50);

    const correctLiving = livingItems.length === 2 && 
                         livingItems.some(i => i.id === 'lion') && 
                         livingItems.some(i => i.id === 'elephant');

    const correctNonLiving = nonLivingItems.length === 2 && 
                            nonLivingItems.some(i => i.id === 'drum') && 
                            nonLivingItems.some(i => i.id === 'stack_of_rings');
    
    if (correctLiving && correctNonLiving) {
      setFeedback({
        text: 'Excellent work! You sorted all the stickers into their correct columns correctly.',
        type: 'success'
      });
      speak("Wonderful! All matched correctly.");
      setSmartScore(prev => Math.min(100, prev + 20));
      setQuestionsAnswered(prev => prev + 1);

      setTimeout(() => {
        generateNewQuestion();
      }, 3500);
    } else {
      const errorMsg = 'Check your placements. Make sure living things (Lion, Elephant) are on the left, and non-living things (Drum, Stack of Rings) are on the right!';
      setFeedback({
        text: errorMsg,
        type: 'error'
      });
      speak(errorMsg);
      setSmartScore(prev => Math.max(0, prev - 10));
    }
  };

  const livingCount = placedItems.filter(item => item.x < 50).length;
  const nonLivingCount = placedItems.filter(item => item.x >= 50).length;

  return (
    <div className={styles.container}>
      {/* Top Header Navigation */}
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
          <span>Upper kindergarten science</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: '800' }}>Living and Non-living things classification</span>
        </div>
        <Link href="/grades" className={styles.shareBtn}>‹ Back to Catalog</Link>
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
              Drag the stickers to arrange them into <strong>living things</strong> or <strong>Non-living things</strong>.
            </span>
          </div>

          {/* Droppable Interactive Canvas */}
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
            {/* Background Hills Wallpaper */}
            <img
              src="/images/prek_landscape.webp"
              alt="Landscape scenery background"
              className={styles.canvasBg}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Render 2 Column Lane Labels and Separator */}
            {[0, 1].map((index) => {
              const leftPercent = index * 50;
              const titles = ['living things', 'Non-living things'];
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: 0,
                    width: '50%',
                    height: '100%',
                    borderRight: index === 0 ? '3px dashed rgba(255, 255, 255, 0.55)' : 'none',
                    background: 'rgba(255, 255, 255, 0.015)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px 8px',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                >
                  {/* Visual Lane Header Label */}
                  <div
                    style={{
                      color: '#0f172a',
                      fontSize: '28px',
                      fontWeight: '800',
                      textShadow: '0 2px 4px rgba(255, 255, 255, 0.8), 0 -1px 1px rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {titles[index]}
                  </div>
                </div>
              );
            })}

            {/* Render placed active elements dragging inside canvas */}
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
                      border: isSelected ? '4.5px solid #0ea5e9' : '2px solid rgba(0,0,0,0.08)',
                      borderRadius: '20px',
                      padding: '8px',
                      boxShadow: isSelected 
                        ? '0 0 20px rgba(14,165,233,0.6), 0 4px 10px rgba(0,0,0,0.15)' 
                        : '0 6px 16px rgba(0,0,0,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      style={{ width: '90%', height: '90%', objectFit: 'contain', pointerEvents: 'none' }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live placed tracking statistics */}
          <div className={styles.dockCount} style={{ borderRadius: 12 }}>
            <span>Stickers Sorted: <strong>{placedItems.length} / 4</strong></span>
            <span>Living Column: <strong>{livingCount}</strong> | Non-living Column: <strong>{nonLivingCount}</strong></span>
          </div>

          {/* Feedback logs alerts */}
          {feedback && (
            <div 
              className={`${styles.feedbackAlert} ${feedback.type === 'success' ? styles.successAlert : feedback.type === 'error' ? styles.errorAlert : ''}`} 
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

          {/* Submit action controls row */}
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
              <Link href="/practice-stickers-rearrange-demo" className={styles.navBtn}>Rearrange Demo 2</Link>
            </div>
          </div>
        </section>

        {/* Right Side Scoring widgets panel */}
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
              <span className={styles.widgetSubtext}>Out of 100</span>
            </div>
          </div>

          <div className={styles.scratchpadWidget} onClick={() => speak("Scratchpad active")}>
            <span className={styles.scratchpadIcon}>✏️</span>
            <span className={styles.scratchpadText}>Scratchpad</span>
          </div>
        </aside>
      </main>

      <footer style={{ textAlign: 'center', margin: '40px 0' }}>
        <Link href="/practice-move-demo" style={{ color: '#64748b', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
          ← Back to Sandbox Playground
        </Link>
      </footer>
    </div>
  );
}
