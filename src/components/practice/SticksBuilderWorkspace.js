'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './SticksBuilderWorkspace.module.css';

// Pre-configured dimensions for 8 different shapes
const SHAPE_CONFIGS = {
  square: {
    name: 'Square',
    prompt: 'Use the sticks to build a square.',
    instruction: 'Drag the four equal sticks to make a square.',
    dockStickers: [
      { id: 'sq_h1', type: 'horizontal', name: 'Horizontal Stick', width: 50, height: 4.5 },
      { id: 'sq_h2', type: 'horizontal', name: 'Horizontal Stick', width: 50, height: 4.5 },
      { id: 'sq_v1', type: 'vertical', name: 'Vertical Stick', width: 2.5, height: 50 },
      { id: 'sq_v2', type: 'vertical', name: 'Vertical Stick', width: 2.5, height: 50 }
    ],
    targets: [
      { id: 'top', type: 'horizontal', x: 25, y: 23, width: 50, height: 4.5, label: 'Top Edge' },
      { id: 'bottom', type: 'horizontal', x: 25, y: 73, width: 50, height: 4.5, label: 'Bottom Edge' },
      { id: 'left', type: 'vertical', x: 24, y: 25, width: 2.5, height: 50, label: 'Left Edge' },
      { id: 'right', type: 'vertical', x: 73.5, y: 25, width: 2.5, height: 50, label: 'Right Edge' }
    ]
  },
  rectangle: {
    name: 'Rectangle',
    prompt: 'Use the sticks to build a rectangle.',
    instruction: 'Drag the long and short sticks to make a rectangle.',
    dockStickers: [
      { id: 'rect_h1', type: 'horizontal', name: 'Long Horizontal Stick', width: 60, height: 4.5 },
      { id: 'rect_h2', type: 'horizontal', name: 'Long Horizontal Stick', width: 60, height: 4.5 },
      { id: 'rect_v1', type: 'vertical', name: 'Short Vertical Stick', width: 2.5, height: 40 },
      { id: 'rect_v2', type: 'vertical', name: 'Short Vertical Stick', width: 2.5, height: 40 }
    ],
    targets: [
      { id: 'top', type: 'horizontal', x: 20, y: 28, width: 60, height: 4.5, label: 'Top Edge' },
      { id: 'bottom', type: 'horizontal', x: 20, y: 68, width: 60, height: 4.5, label: 'Bottom Edge' },
      { id: 'left', type: 'vertical', x: 19, y: 30, width: 2.5, height: 40, label: 'Left Edge' },
      { id: 'right', type: 'vertical', x: 78.5, y: 30, width: 2.5, height: 40, label: 'Right Edge' }
    ]
  },
  triangle: {
    name: 'Triangle',
    prompt: 'Use the sticks to build a triangle.',
    instruction: 'Drag the three sticks to make a triangle.',
    dockStickers: [
      { id: 'tri_h1', type: 'horizontal', name: 'Base Stick', width: 40, height: 4.5 },
      { id: 'tri_sl', type: 'sloped_left', name: 'Left Side Stick', width: 32, height: 4.5 },
      { id: 'tri_sr', type: 'sloped_right', name: 'Right Side Stick', width: 32, height: 4.5 }
    ],
    targets: [
      { id: 'bottom', type: 'horizontal', x: 30, y: 73, width: 40, height: 4.5, label: 'Bottom Edge' },
      { id: 'left', type: 'sloped_left', x: 30, y: 75, width: 32, height: 4.5, transform: 'rotate(-51.3deg)', transformOrigin: '0% 50%', label: 'Left Edge' },
      { id: 'right', type: 'sloped_right', x: 50, y: 25, width: 32, height: 4.5, transform: 'rotate(51.3deg)', transformOrigin: '0% 50%', label: 'Right Edge' }
    ]
  },
  diamond: {
    name: 'Diamond',
    prompt: 'Use the sticks to build a diamond.',
    instruction: 'Drag the four sloped sticks to make a diamond.',
    dockStickers: [
      { id: 'dia_ur1', type: 'sloped_up_right', name: 'Sloped Stick', width: 25, height: 4.5 },
      { id: 'dia_ur2', type: 'sloped_up_right', name: 'Sloped Stick', width: 25, height: 4.5 },
      { id: 'dia_dr1', type: 'sloped_down_right', name: 'Sloped Stick', width: 25, height: 4.5 },
      { id: 'dia_dr2', type: 'sloped_down_right', name: 'Sloped Stick', width: 25, height: 4.5 }
    ],
    targets: [
      { id: 'top_left', type: 'sloped_up_right', x: 25, y: 50, width: 25, height: 4.5, transform: 'rotate(-45deg)', transformOrigin: '0% 50%', label: 'Top-Left Side' },
      { id: 'bottom_right', type: 'sloped_up_right', x: 42.7, y: 85.4, width: 25, height: 4.5, transform: 'rotate(-45deg)', transformOrigin: '0% 50%', label: 'Bottom-Right Side' },
      { id: 'bottom_left', type: 'sloped_down_right', x: 25, y: 50, width: 25, height: 4.5, transform: 'rotate(45deg)', transformOrigin: '0% 50%', label: 'Bottom-Left Side' },
      { id: 'top_right', type: 'sloped_down_right', x: 42.7, y: 14.6, width: 25, height: 4.5, transform: 'rotate(45deg)', transformOrigin: '0% 50%', label: 'Top-Right Side' }
    ]
  },
  rhombus: {
    name: 'Rhombus',
    prompt: 'Use the sticks to build a rhombus.',
    instruction: 'Drag the horizontal and slanted sticks to make a rhombus.',
    dockStickers: [
      { id: 'rho_h1', type: 'horizontal', name: 'Horizontal Stick', width: 35, height: 4.5 },
      { id: 'rho_h2', type: 'horizontal', name: 'Horizontal Stick', width: 35, height: 4.5 },
      { id: 'rho_ur1', type: 'sloped_up_right', name: 'Slanted Stick', width: 32, height: 4.5 },
      { id: 'rho_ur2', type: 'sloped_up_right', name: 'Slanted Stick', width: 32, height: 4.5 }
    ],
    targets: [
      { id: 'bottom', type: 'horizontal', x: 25, y: 75, width: 35, height: 4.5, label: 'Bottom Edge' },
      { id: 'top', type: 'horizontal', x: 41, y: 19.6, width: 35, height: 4.5, label: 'Top Edge' },
      { id: 'left', type: 'sloped_up_right', x: 25, y: 75, width: 32, height: 4.5, transform: 'rotate(-60deg)', transformOrigin: '0% 50%', label: 'Left Edge' },
      { id: 'right', type: 'sloped_up_right', x: 60, y: 75, width: 32, height: 4.5, transform: 'rotate(-60deg)', transformOrigin: '0% 50%', label: 'Right Edge' }
    ]
  },
  parallelogram: {
    name: 'Parallelogram',
    prompt: 'Use the sticks to build a parallelogram.',
    instruction: 'Drag the horizontal and slanted sticks to make a parallelogram.',
    dockStickers: [
      { id: 'para_h1', type: 'horizontal', name: 'Long Horizontal Stick', width: 45, height: 4.5 },
      { id: 'para_h2', type: 'horizontal', name: 'Long Horizontal Stick', width: 45, height: 4.5 },
      { id: 'para_ur1', type: 'sloped_up_right', name: 'Short Slanted Stick', width: 28, height: 4.5 },
      { id: 'para_ur2', type: 'sloped_up_right', name: 'Short Slanted Stick', width: 28, height: 4.5 }
    ],
    targets: [
      { id: 'bottom', type: 'horizontal', x: 20, y: 75, width: 45, height: 4.5, label: 'Bottom Edge' },
      { id: 'top', type: 'horizontal', x: 34, y: 26.5, width: 45, height: 4.5, label: 'Top Edge' },
      { id: 'left', type: 'sloped_up_right', x: 20, y: 75, width: 28, height: 4.5, transform: 'rotate(-60deg)', transformOrigin: '0% 50%', label: 'Left Edge' },
      { id: 'right', type: 'sloped_up_right', x: 65, y: 75, width: 28, height: 4.5, transform: 'rotate(-60deg)', transformOrigin: '0% 50%', label: 'Right Edge' }
    ]
  },
  pentagon: {
    name: 'Pentagon',
    prompt: 'Use the sticks to build a pentagon.',
    instruction: 'Drag the five sticks to make a pentagon.',
    dockStickers: [
      { id: 'pent_h', type: 'horizontal', name: 'Base Stick', width: 20.6, height: 4.5 },
      { id: 'pent_ul', type: 'sloped_up_left', name: 'Side Stick', width: 20.5, height: 4.5 },
      { id: 'pent_ur', type: 'sloped_up_right', name: 'Side Stick', width: 20.5, height: 4.5 },
      { id: 'pent_su', type: 'sloped_shallow_up', name: 'Roof Stick', width: 20.5, height: 4.5 },
      { id: 'pent_sd', type: 'sloped_shallow_down', name: 'Roof Stick', width: 20.5, height: 4.5 }
    ],
    targets: [
      { id: 'bottom', type: 'horizontal', x: 39.7, y: 78.3, width: 20.6, height: 4.5, label: 'Bottom Edge' },
      { id: 'left_side', type: 'sloped_up_left', x: 39.7, y: 78.3, width: 20.5, height: 4.5, transform: 'rotate(-108deg)', transformOrigin: '0% 50%', label: 'Left Side' },
      { id: 'right_side', type: 'sloped_up_right', x: 60.3, y: 78.3, width: 20.5, height: 4.5, transform: 'rotate(-72deg)', transformOrigin: '0% 50%', label: 'Right Side' },
      { id: 'left_roof', type: 'sloped_shallow_up', x: 33.4, y: 39.2, width: 20.5, height: 4.5, transform: 'rotate(-36deg)', transformOrigin: '0% 50%', label: 'Left Roof' },
      { id: 'right_roof', type: 'sloped_shallow_down', x: 50, y: 15, width: 20.5, height: 4.5, transform: 'rotate(36deg)', transformOrigin: '0% 50%', label: 'Right Roof' }
    ]
  },
  hexagon: {
    name: 'Hexagon',
    prompt: 'Use the sticks to build a hexagon.',
    instruction: 'Drag the six sticks to make a hexagon.',
    dockStickers: [
      { id: 'hex_h1', type: 'horizontal', name: 'Top Stick', width: 30, height: 4.5 },
      { id: 'hex_h2', type: 'horizontal', name: 'Bottom Stick', width: 30, height: 4.5 },
      { id: 'hex_dr', type: 'sloped_down_right', name: 'Slanted Stick', width: 21.25, height: 4.5 },
      { id: 'hex_dl', type: 'sloped_down_left', name: 'Slanted Stick', width: 21.25, height: 4.5 },
      { id: 'hex_ul', type: 'sloped_up_left', name: 'Slanted Stick', width: 21.25, height: 4.5 },
      { id: 'hex_ur', type: 'sloped_up_right', name: 'Slanted Stick', width: 21.25, height: 4.5 }
    ],
    targets: [
      { id: 'top', type: 'horizontal', x: 35, y: 20, width: 30, height: 4.5, label: 'Top Edge' },
      { id: 'bottom', type: 'horizontal', x: 35, y: 80, width: 30, height: 4.5, label: 'Bottom Edge' },
      { id: 'top_right', type: 'sloped_down_right', x: 65, y: 20, width: 21.25, height: 4.5, transform: 'rotate(45deg)', transformOrigin: '0% 50%', label: 'Top-Right Side' },
      { id: 'bottom_right', type: 'sloped_down_left', x: 80, y: 50, width: 21.25, height: 4.5, transform: 'rotate(135deg)', transformOrigin: '0% 50%', label: 'Bottom-Right Side' },
      { id: 'bottom_left', type: 'sloped_up_left', x: 35, y: 80, width: 21.25, height: 4.5, transform: 'rotate(-135deg)', transformOrigin: '0% 50%', label: 'Bottom-Left Side' },
      { id: 'top_left', type: 'sloped_up_right', x: 20, y: 50, width: 21.25, height: 4.5, transform: 'rotate(-45deg)', transformOrigin: '0% 50%', label: 'Top-Left Side' }
    ]
  }
};

const isCompatible = (st, tg) => {
  if (st.type === 'vertical') {
    return tg.type === 'vertical' && Math.abs(st.height - tg.height) < 1.0;
  }
  if (tg.type === 'vertical') {
    return false;
  }
  // Horizontal sticks must match horizontal targets
  if (st.type === 'horizontal' || tg.type === 'horizontal') {
    return st.type === 'horizontal' && tg.type === 'horizontal' && Math.abs(st.width - tg.width) < 1.0;
  }
  // Both are sloped/slanted sticks, check length compatibility
  return Math.abs(st.width - tg.width) < 1.0;
};

export default function SticksBuilderWorkspace({
  smartScore,
  setSmartScore,
  questionsAnswered,
  setQuestionsAnswered,
  levelStreak,
  setLevelStreak,
  setTransitionState,
  setPraiseMessage,
  fetchQuestion
}) {
  const [isRandomMode, setIsRandomMode] = useState(true);
  const [activeMode, setActiveMode] = useState('square');
  const config = SHAPE_CONFIGS[activeMode];

  // Placed items state: Array of { id, x: pctX, y: pctY, type, isSnapped, targetId }
  const [placedItems, setPlacedItems] = useState([]);
  
  // Dragging & UI states
  const [draggedId, setDraggedId] = useState(null);
  const [isDraggingFromCanvas, setIsDraggingFromCanvas] = useState(false);
  const [feedback, setFeedback] = useState({ text: config.prompt, type: 'info' });

  const canvasRef = useRef(null);
  const snapAudioRef = useRef({});

  // Select a random shape mode
  const selectRandomShape = (currentMode) => {
    const modes = Object.keys(SHAPE_CONFIGS);
    const filtered = modes.filter(m => m !== currentMode);
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  // Initialize random mode on mount
  useEffect(() => {
    if (isRandomMode) {
      const startMode = selectRandomShape('');
      setActiveMode(startMode);
    }
  }, []);

  // Reset when active mode changes
  useEffect(() => {
    resetWorkspace(activeMode);
  }, [activeMode]);

  const resetWorkspace = (mode = activeMode) => {
    setPlacedItems([]);
    snapAudioRef.current = {};
    setFeedback({ text: SHAPE_CONFIGS[mode].prompt, type: 'info' });
    speak(SHAPE_CONFIGS[mode].prompt + " " + SHAPE_CONFIGS[mode].instruction);
  };

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

  // Drag and Drop
  const handleDropToCanvas = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    let stickId = draggedId;
    let grabRatioX = 0.5;
    let grabRatioY = 0.5;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        stickId = data.stickId;
        if (data.grabRatioX !== undefined) grabRatioX = data.grabRatioX;
        if (data.grabRatioY !== undefined) grabRatioY = data.grabRatioY;
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

    let px = (relativeX / canvasRect.width) * 100 - grabRatioX * stick.width;
    let py = (relativeY / canvasRect.height) * 100 - grabRatioY * stick.height;

    px = Math.max(0, Math.min(100 - stick.width, px));
    py = Math.max(0, Math.min(100 - stick.height, py));

    // Magnetic snap target checks
    const activePlacements = placedItems.filter(item => item.id !== stickId);
    const takenTargetIds = new Set(activePlacements.filter(p => p.isSnapped).map(p => p.targetId));

    const candidateTargets = config.targets.filter(t => 
      isCompatible(stick, t) && !takenTargetIds.has(t.id)
    );

    let finalX = px;
    let finalY = py;
    let snapped = false;
    let snappedTargetId = null;
    const snapThreshold = 10.0;

    for (const target of candidateTargets) {
      const stickCenterX = px + stick.width / 2;
      const stickCenterY = py + stick.height / 2;
      const targetCenterX = target.x + target.width / 2;
      const targetCenterY = target.y + target.height / 2;

      const dx = stickCenterX - targetCenterX;
      const dy = stickCenterY - targetCenterY;
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
        speak(`Snapped to ${snappedTargetId.replace('_', ' ')} edge`);
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
    
    const rect = e.currentTarget.getBoundingClientRect();
    const grabRatioX = (e.clientX - rect.left) / rect.width;
    const grabRatioY = (e.clientY - rect.top) / rect.height;
    e.dataTransfer.setData('text/plain', JSON.stringify({ stickId, grabRatioX, grabRatioY }));
  };

  const handleCanvasDragStart = (e, stickId) => {
    e.stopPropagation();
    setDraggedId(stickId);
    setIsDraggingFromCanvas(true);
    
    // For already placed items, snap center to cursor for clean movement
    const grabRatioX = 0.5;
    const grabRatioY = 0.5;
    e.dataTransfer.setData('text/plain', JSON.stringify({ stickId, grabRatioX, grabRatioY }));
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

  // Mobile Taps / Click to place
  const handleDockTap = (stickId) => {
    const isPlaced = placedItems.some(item => item.id === stickId);
    if (isPlaced) return;

    const stick = config.dockStickers.find(s => s.id === stickId);
    if (!stick) return;

    // Find the first compatible target outline that is not already occupied
    const activePlacements = placedItems.filter(item => item.id !== stickId);
    const takenTargetIds = new Set(activePlacements.filter(p => p.isSnapped).map(p => p.targetId));

    const candidateTarget = config.targets.find(t => 
      isCompatible(stick, t) && !takenTargetIds.has(t.id)
    );

    if (candidateTarget) {
      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== stickId),
        { 
          id: stickId, 
          x: candidateTarget.x, 
          y: candidateTarget.y, 
          type: stick.type, 
          isSnapped: true, 
          targetId: candidateTarget.id 
        }
      ]);
      speak(`Snapped to ${candidateTarget.id.replace('_', ' ')} edge`);
      snapAudioRef.current[candidateTarget.id] = true;
    } else {
      // Fallback: Place in the center of the canvas
      const centerX = Math.max(0, 100 - stick.width) / 2;
      const centerY = Math.max(0, 100 - stick.height) / 2;
      setPlacedItems(prev => [
        ...prev.filter(item => item.id !== stickId),
        { 
          id: stickId, 
          x: centerX, 
          y: centerY, 
          type: stick.type, 
          isSnapped: false, 
          targetId: null 
        }
      ]);
      speak(`Placed ${stick.name}`);
    }
  };

  const handleCanvasTap = (e) => {
    // Click on canvas is now handled directly by placed item clicks or tray taps
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

  // Submit Answer
  const handleSubmit = () => {
    const snappedItems = placedItems.filter(item => item.isSnapped);
    
    if (snappedItems.length === config.dockStickers.length) {
      const congrats = `Awesome job! You successfully built a ${config.name}!`;
      setFeedback({ text: congrats, type: 'success' });
      speak(congrats);
      
      // Update scoring states in practice shell natively
      setSmartScore(prev => Math.min(100, prev + 15));
      setQuestionsAnswered(prev => prev + 1);
      setLevelStreak(prev => prev + 1);
      
      // Trigger native praise animation and banner
      setPraiseMessage(`Terrific! You completed the ${config.name}!`);
      setTransitionState('praise');

      // Cycle to the next shape after the praise card finishes
      setTimeout(() => {
        if (isRandomMode) {
          const nextMode = selectRandomShape(activeMode);
          setActiveMode(nextMode);
        } else {
          // cycle through the list sequentially
          const modes = Object.keys(SHAPE_CONFIGS);
          const nextIdx = (modes.indexOf(activeMode) + 1) % modes.length;
          setActiveMode(modes[nextIdx]);
        }
        setTransitionState('idle');
      }, 2500);
    } else {
      let errorMsg = '';
      if (placedItems.length < config.dockStickers.length) {
        errorMsg = 'Some sticks are still in the tray. Drag all sticks onto the blueprint outlines!';
      } else {
        errorMsg = `Not quite complete. Align each stick to the correct edge of the ${config.name}!`;
      }

      setFeedback({ text: errorMsg, type: 'error' });
      speak(errorMsg);
      setSmartScore(prev => Math.max(0, prev - 5));
      setLevelStreak(0);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Mode selectors */}
      <div className={styles.modeToggleGroup}>
        <button 
          type="button" 
          onClick={() => {
            setIsRandomMode(true);
            const start = selectRandomShape(activeMode);
            setActiveMode(start);
          }}
          className={`${styles.modeBtn} ${isRandomMode ? styles.modeBtnActive : ''}`}
        >
          Random Shape 🎲
        </button>
        <div style={{ width: '1.5px', height: '24px', background: '#cbd5e1', alignSelf: 'center', margin: '0 4px' }} />
        {Object.keys(SHAPE_CONFIGS).map((key) => (
          <button 
            key={key}
            type="button" 
            onClick={() => {
              setIsRandomMode(false);
              setActiveMode(key);
            }}
            className={`${styles.modeBtn} ${!isRandomMode && activeMode === key ? styles.modeBtnActive : ''}`}
          >
            {SHAPE_CONFIGS[key].name}
          </button>
        ))}
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

      {/* Blueprint Canvas Frame */}
      <div
        ref={canvasRef}
        className={styles.canvasFrame}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToCanvas}
        onClick={handleCanvasTap}
      >
        <div className={styles.blueprintGrid} />

        {/* Target outlines */}
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

        {/* Placed sticks */}
        {placedItems.map((item) => {
          const stick = config.dockStickers.find(s => s.id === item.id);
          if (!stick) return null;

          const target = item.targetId ? config.targets.find(t => t.id === item.targetId) : null;
          const rotationTarget = target || config.targets.find(t => isCompatible(stick, t));
          const rotation = rotationTarget?.transform || '';
          const origin = rotationTarget?.transformOrigin || '';

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

      {/* Stick Dock Panel */}
      <div 
        className={styles.dockPanel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToDock}
      >
        {config.dockStickers.map((stick, index) => {
          const isPlaced = placedItems.some(item => item.id === stick.id);

          return (
            <div key={stick.id} className={styles.dockSlotWrapper}>
              <div className={styles.dockSlot}>
                {isPlaced ? (
                  <div className={`${styles.silhouettePlaceholder} ${stick.type === 'vertical' ? styles.stickVertical : styles.stickHorizontal}`} />
                ) : (
                  <div
                    draggable
                    onDragStart={(e) => handleDockDragStart(e, stick.id)}
                    onClick={() => handleDockTap(stick.id)}
                    className={`${styles.sticker} ${stick.type === 'vertical' ? styles.stickVertical : styles.stickHorizontal} ${draggedId === stick.id && !isDraggingFromCanvas ? styles.stickerDragging : ''}`}
                    style={{ 
                      borderRadius: '8px'
                    }}
                    title={`Drag or click ${stick.name} onto outline`}
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
          Submit Answer
        </button>
        <div className={styles.navControls}>
          <button type="button" onClick={() => resetWorkspace()} className={styles.navBtn}>Reset Placement 🔄</button>
        </div>
      </div>
    </div>
  );
}
