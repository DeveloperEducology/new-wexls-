'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './move.module.css';

const SCENES = [
  { 
    id: 'room', 
    name: 'Cozy Bedroom', 
    url: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780337176148-room_bg_image.webp',
    targetX: 22, 
    targetY: 58,
    targetName: 'the Bed 🛏️'
  },
  { 
    id: 'landscape', 
    name: 'Sunny Pre-K Hills', 
    url: '/images/prek_landscape.webp',
    targetX: 65, 
    targetY: 50,
    targetName: 'the Picnic Rug 🧺'
  },
  { 
    id: 'science', 
    name: 'Countryside Lab', 
    url: '/images/countryside_science_desktop.png',
    targetX: 48, 
    targetY: 56,
    targetName: 'the Lab Desk 🧪'
  },
];

const MASCOTS = [
  { id: 'rabbit', name: 'Cute Rabbit', url: '/images/rabbit.svg', width: 14, height: 14 },
  { id: 'penguin', name: 'Chubby Penguin', url: '/images/penguin.svg', width: 12, height: 12 },
  { id: 'alex', name: 'Alex Mascot', url: '/images/alex_avatar.png', width: 15, height: 15 },
];

export default function MoveDemoPage() {
  const [activeScene, setActiveScene] = useState(SCENES[0]);
  const [activeMascot, setActiveMascot] = useState(MASCOTS[0]);
  
  // Starting coordinates in percentage (far from target to prevent immediate snapping)
  const [coords, setCoords] = useState({ x: 55, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapped, setIsSnapped] = useState(false);
  const [mascotScale, setMascotScale] = useState(1);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [log, setLog] = useState(['Canvas initialized. Drag the character toward the target!']);

  const canvasRef = useRef(null);
  const mascotRef = useRef(null);
  
  // Ref to track snap state changes for audio alerts
  const snapAudioRef = useRef(false);

  // Add message to tracking log console
  const addLog = (msg) => {
    setLog(prev => [msg, ...prev.slice(0, 8)]);
  };

  // Speaks feedback using browser speech synthesis
  const speak = (msg) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Calculate mouse/touch relative coordinates
  const handleStart = (clientX, clientY) => {
    if (!canvasRef.current || !mascotRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mascotRect = mascotRef.current.getBoundingClientRect();

    // Store offset where the cursor grabbed the image
    const grabX = clientX - mascotRect.left;
    const grabY = clientY - mascotRect.top;

    setDragStartOffset({ x: grabX, y: grabY });
    setIsDragging(true);
    speak(`Grabbed ${activeMascot.name}`);
    addLog(`Grabbed ${activeMascot.name} at X: ${coords.x.toFixed(1)}%, Y: ${coords.y.toFixed(1)}%`);
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Relative target coordinates from top-left of canvas
    let relX = clientX - canvasRect.left - dragStartOffset.x;
    let relY = clientY - canvasRect.top - dragStartOffset.y;

    // Convert to percentage
    let pctX = (relX / canvasRect.width) * 100;
    let pctY = (relY / canvasRect.height) * 100;

    // Calculate current width and height of mascot card in percentage
    const baseWidth = activeMascot.width * mascotScale;
    const baseHeight = activeMascot.height * mascotScale * (canvasRect.width / canvasRect.height);

    // Clamp coordinates so object stays completely inside canvas boundaries
    pctX = Math.max(0, Math.min(100 - baseWidth, pctX));
    pctY = Math.max(0, Math.min(100 - baseHeight, pctY));

    // MAGNETIC EFFECT CALCULATION
    // Euclidean distance between target point and calculated point
    const dx = pctX - activeScene.targetX;
    const dy = pctY - activeScene.targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Magnetic threshold: 8.5% distance
    const snapThreshold = 8.5;
    
    if (distance < snapThreshold) {
      // Snap to target coordinates
      setCoords({ x: activeScene.targetX, y: activeScene.targetY });
      
      if (!isSnapped) {
        setIsSnapped(true);
        // Play audio confirmation when magnet locks
        if (!snapAudioRef.current) {
          speak(`Magnet locked on ${activeScene.targetName}`);
          addLog(`🧲 Magnet snapped to ${activeScene.targetName}!`);
          snapAudioRef.current = true;
        }
      }
    } else {
      // Normal free movement
      setCoords({ x: pctX, y: pctY });
      
      if (isSnapped) {
        setIsSnapped(false);
        if (snapAudioRef.current) {
          speak(`Mascot break free`);
          addLog(`🔓 Broken free from target magnet pull.`);
          snapAudioRef.current = false;
        }
      }
    }
  };

  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      if (isSnapped) {
        speak(`Successfully snapped ${activeMascot.name} onto ${activeScene.targetName}`);
        addLog(`🎯 Released: Locked onto ${activeScene.targetName}`);
      } else {
        speak(`Placed ${activeMascot.name} at ${Math.round(coords.x)} percent`);
        addLog(`Placed ${activeMascot.name} at X: ${coords.x.toFixed(1)}%, Y: ${coords.y.toFixed(1)}%`);
      }
    }
  };

  // Event handlers for desktop mouse events
  const onMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX, e.clientY);
    }
  };

  // Event handlers for mobile touch screens
  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e) => {
    if (isDragging && e.touches && e.touches[0]) {
      e.preventDefault(); // Stop mobile scrolling while dragging
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Setup global mouse/touch release handlers to capture mouseup outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleEnd();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, coords, activeMascot, isSnapped, activeScene]);

  const resetPosition = () => {
    setCoords({ x: 55, y: 20 });
    setIsSnapped(false);
    snapAudioRef.current = false;
    setMascotScale(1);
    addLog('Reset placement coordinates to default.');
    speak('Position reset');
  };

  // Trigger reset whenever scene changes so magnet isn't immediate
  useEffect(() => {
    resetPosition();
  }, [activeScene]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>Magnetic Snap Engine V2</div>
        <h1>Interactive Canvas Sandbox</h1>
        <p>Drag the mascot near its target silhouette. When close enough, a magnetic force snaps it into place!</p>
      </header>

      <main className={styles.workspace}>
        {/* Left Side: Control Panel */}
        <section className={styles.panel}>
          <div className={styles.sectionTitle}>🎨 Scene Configurations</div>
          
          <div className={styles.optionGroup}>
            <label className={styles.label}>Select Background Wallpaper</label>
            <div className={styles.btnGrid}>
              {SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => {
                    setActiveScene(scene);
                    addLog(`Swapped background scene to: ${scene.name}`);
                  }}
                  className={`${styles.selectBtn} ${activeScene.id === scene.id ? styles.activeBtn : ''}`}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <label className={styles.label}>Select Draggable Mascot</label>
            <div className={styles.btnGrid}>
              {MASCOTS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMascot(m);
                    addLog(`Swapped active mascot to: ${m.name}`);
                    resetPosition();
                  }}
                  className={`${styles.selectBtn} ${activeMascot.id === m.id ? styles.activeBtn : ''}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionGroup}>
            <label className={styles.label}>Mascot Scale Sizing ({Math.round(mascotScale * 100)}%)</label>
            <div className={styles.scaleSliderContainer}>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={mascotScale}
                onChange={(e) => {
                  const s = parseFloat(e.target.value);
                  setMascotScale(s);
                  addLog(`Adjusted mascot scale size to: ${s}x`);
                }}
                className={styles.slider}
              />
              <button type="button" onClick={resetPosition} className={styles.resetBtn}>
                Reset Position 🔄
              </button>
            </div>
          </div>

          {/* Coordinate Readouts */}
          <div className={styles.telemetry}>
            <div className={styles.telemetryTitle}>🛰️ Real-Time Telemetry Coordinates</div>
            <div className={styles.coordinateRow}>
              <div className={styles.coordinateBox}>
                <span>X Position</span>
                <strong style={{ color: isSnapped ? '#4ade80' : '#38bdf8' }}>
                  {coords.x.toFixed(1)}%
                </strong>
              </div>
              <div className={styles.coordinateBox}>
                <span>Y Position</span>
                <strong style={{ color: isSnapped ? '#4ade80' : '#38bdf8' }}>
                  {coords.y.toFixed(1)}%
                </strong>
              </div>
            </div>
            {isSnapped && (
              <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', marginTop: '12px', letterSpacing: '0.04em' }}>
                🧲 SNAP LOCKED TO TARGET!
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Interactive Canvas & Logger */}
        <section className={styles.canvasArea}>
          {/* Main Drag-and-Drop Canvas Board */}
          <div
            ref={canvasRef}
            className={`${styles.canvasFrame} ${isDragging ? styles.canvasDragging : ''}`}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
          >
            {/* Background scene wallpaper */}
            <img
              src={activeScene.url}
              alt={activeScene.name}
              className={styles.canvasBg}
              draggable={false}
            />

            {/* Target Drop Zone Shadow Silhouette */}
            <div
              className={`${styles.dropZoneShadow} ${isSnapped ? styles.dropZoneSnapped : ''}`}
              style={{
                left: `${activeScene.targetX}%`,
                top: `${activeScene.targetY}%`,
                width: `${activeMascot.width * mascotScale}%`,
                height: `${activeMascot.height * mascotScale}%`,
                backgroundImage: `url(${activeMascot.url})`,
              }}
            >
              <div className={styles.shadowLabel}>
                {isSnapped ? '🧲 Locked' : `Align on ${activeScene.targetName}`}
              </div>
            </div>

            {/* Draggable Mascot Element */}
            <div
              ref={mascotRef}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              className={`${styles.draggableMascot} ${isDragging ? styles.mascotMoving : ''}`}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                width: `${activeMascot.width * mascotScale}%`,
                height: `${activeMascot.height * mascotScale}%`,
                backgroundImage: `url(${activeMascot.url})`,
              }}
              title="Drag me!"
            >
              <div className={styles.grabOverlay}>
                <span>✥</span>
              </div>
            </div>

            {/* Grid alignment layout lines (Subtle guidelines overlay) */}
            <div className={styles.gridOverlay}>
              <div className={styles.gridXLine} style={{ left: '25%' }} />
              <div className={styles.gridXLine} style={{ left: '50%' }} />
              <div className={styles.gridXLine} style={{ left: '75%' }} />
              <div className={styles.gridYLine} style={{ top: '25%' }} />
              <div className={styles.gridYLine} style={{ top: '50%' }} />
              <div className={styles.gridYLine} style={{ top: '75%' }} />
            </div>
          </div>

          {/* Running Console Logger */}
          <div className={styles.loggerPanel}>
            <div className={styles.loggerHeader}>
              <span>📋 Activity Logs</span>
              <button type="button" onClick={() => setLog([])} className={styles.clearBtn}>
                Clear
              </button>
            </div>
            <div className={styles.loggerBody}>
              {log.length === 0 ? (
                <div className={styles.logPlaceholder}>No actions logged yet. Drag the object!</div>
              ) : (
                log.map((entry, index) => (
                  <div key={index} className={styles.logRow}>
                    <span className={styles.logBullet}>»</span>
                    <span>{entry}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <a href="/practice-dnd-demo" className={styles.backLink}>
          ← Go back to Vocabulary Sorter Demo
        </a>
      </footer>
    </div>
  );
}
