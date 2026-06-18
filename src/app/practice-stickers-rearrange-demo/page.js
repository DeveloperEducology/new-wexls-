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
  const [dockItems, setDockItems] = useState(INITIAL_STICKERS);
  const [columns, setColumns] = useState({
    col1: { id: 'col1', title: 'Animals (A-Z)', category: 'animals', items: [], centerX: 16.67, themeColor: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.04)', activeBgColor: 'rgba(59, 130, 246, 0.12)' },
    col2: { id: 'col2', title: 'Mascots', category: 'mascots', items: [], centerX: 50, themeColor: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.04)', activeBgColor: 'rgba(139, 92, 246, 0.12)' },
    col3: { id: 'col3', title: 'Emojis (A-Z)', category: 'emojis', items: [], centerX: 83.33, themeColor: '#10b981', bgColor: 'rgba(16, 185, 129, 0.04)', activeBgColor: 'rgba(16, 185, 129, 0.12)' }
  });

  // Scoreboard / Game state
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [smartScore, setSmartScore] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Dragging and UI states
  const [draggedItemInfo, setDraggedItemInfo] = useState(null); // { item, source, colId, index }
  const [selectedDockId, setSelectedDockId] = useState(null); // Mobile click select state
  const [selectedPlacedId, setSelectedPlacedId] = useState(null); // Mobile placed select state: sticker ID
  const [feedback, setFeedback] = useState({ 
    text: 'Drag stickers onto the picture columns! Column 1 is for Animals, Column 2 is for Mascots, and Column 3 is for Emojis. Rearrange them vertically inside the columns to put them in A-Z order!', 
    type: 'info' 
  });
  const [activeColumnId, setActiveColumnId] = useState(null); // Tracks which column is currently hovered under drag
  const [dragHoveredIndex, setDragHoveredIndex] = useState(null); // Index within active column for insertion highlight

  const canvasRef = useRef(null);

  // Timer loop
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
    setDockItems(INITIAL_STICKERS);
    setColumns({
      col1: { ...columns.col1, items: [] },
      col2: { ...columns.col2, items: [] },
      col3: { ...columns.col3, items: [] }
    });
    setSelectedDockId(null);
    setSelectedPlacedId(null);
    setFeedback({
      text: 'Drag stickers onto the picture columns! Column 1 is for Animals, Column 2 is for Mascots, and Column 3 is for Emojis. Rearrange them vertically inside the columns to put them in A-Z order!',
      type: 'info'
    });
    speak("Ready to play again! Sort the stickers on the picture and rearrange them in alphabetical order.");
  };

  // Stack Y positions helper
  const getYCoordinate = (idx, totalItems) => {
    if (totalItems <= 1) return 50;
    if (totalItems === 2) {
      return idx === 0 ? 32 : 68;
    }
    // 3 or more items
    if (idx === 0) return 22;
    if (idx === 1) return 50;
    return 78;
  };

  // Drag Start
  const handleDragStart = (e, item, source, colId = null, index = null) => {
    const payload = { item, source, colId, index };
    setDraggedItemInfo(payload);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
  };

  // Drag Over Canvas
  const handleDragOverCanvas = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Resolve column
    let colId = 'col1';
    if (x > 66.6) colId = 'col3';
    else if (x > 33.3) colId = 'col2';
    
    setActiveColumnId(colId);

    // Resolve insertion index based on vertical Y position
    const colItems = columns[colId].items;
    const L = colItems.length;
    let targetIndex = L;

    if (L > 0) {
      if (y < 35) {
        targetIndex = 0;
      } else if (y < 65) {
        targetIndex = Math.min(1, L);
      } else {
        targetIndex = L;
      }
    }
    setDragHoveredIndex(targetIndex);
  };

  // Drop on Canvas
  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    let payload = draggedItemInfo;
    if (!payload) {
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) payload = JSON.parse(json);
      } catch (err) {
        return;
      }
    }

    if (!payload || !payload.item) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Resolve target column
    let targetColId = 'col1';
    if (x > 66.6) targetColId = 'col3';
    else if (x > 33.3) targetColId = 'col2';

    // Resolve target index
    const colItems = columns[targetColId].items;
    const L = colItems.length;
    let targetIndex = L;

    if (L > 0) {
      if (y < 35) {
        targetIndex = 0;
      } else if (y < 65) {
        targetIndex = Math.min(1, L);
      } else {
        targetIndex = L;
      }
    }

    moveItem(payload.item, payload.source, payload.colId, payload.index, targetColId, targetIndex);
    
    // Clear drag state
    setDraggedItemInfo(null);
    setActiveColumnId(null);
    setDragHoveredIndex(null);
  };

  // Drop on Dock (Returning stickers back)
  const handleDropOnDock = (e) => {
    e.preventDefault();
    let payload = draggedItemInfo;
    if (!payload) {
      try {
        const json = e.dataTransfer.getData('application/json');
        if (json) payload = JSON.parse(json);
      } catch (err) {
        return;
      }
    }

    if (!payload || !payload.item || payload.source === 'dock') return;

    // Remove from source column
    setColumns(prev => {
      const sourceCol = prev[payload.colId];
      const nextItems = [...sourceCol.items];
      nextItems.splice(payload.index, 1);
      return {
        ...prev,
        [payload.colId]: { ...sourceCol, items: nextItems }
      };
    });

    // Add back to dock items
    setDockItems(prev => {
      if (prev.some(d => d.id === payload.item.id)) return prev;
      return [...prev, payload.item];
    });

    speak(`Returned ${payload.item.name} to dock`);
    setDraggedItemInfo(null);
    setActiveColumnId(null);
    setDragHoveredIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemInfo(null);
    setActiveColumnId(null);
    setDragHoveredIndex(null);
  };

  // State update helper for moving items
  const moveItem = (item, source, sourceColId, sourceIndex, targetColId, targetIndex) => {
    // 1. Remove from source
    if (source === 'dock') {
      setDockItems(prev => prev.filter(d => d.id !== item.id));
    } else {
      setColumns(prev => {
        const sourceCol = prev[sourceColId];
        const nextItems = [...sourceCol.items];
        nextItems.splice(sourceIndex, 1);
        return {
          ...prev,
          [sourceColId]: { ...sourceCol, items: nextItems }
        };
      });
    }

    // 2. Insert into target
    setColumns(prev => {
      const targetCol = prev[targetColId];
      const nextItems = [...targetCol.items];

      // Adjust index if moving within the same column
      let finalIndex = targetIndex;
      if (source === 'column' && sourceColId === targetColId) {
        if (sourceIndex < targetIndex) {
          finalIndex = Math.max(0, targetIndex - 1);
        }
      }

      nextItems.splice(finalIndex, 0, item);
      return {
        ...prev,
        [targetColId]: { ...targetCol, items: nextItems }
      };
    });

    speak(`Placed ${item.name} in Column ${targetColId === 'col1' ? '1' : targetColId === 'col2' ? '2' : '3'}`);
  };

  // Mobile Click-to-Move handlers
  const handleDockClick = (item) => {
    setSelectedPlacedId(null);
    if (selectedDockId === item.id) {
      setSelectedDockId(null);
    } else {
      setSelectedDockId(item.id);
      speak(item.name);
    }
  };

  const handlePlacedItemClick = (e, colId, index, item) => {
    e.stopPropagation();
    setSelectedDockId(null);
    if (selectedPlacedId === item.id) {
      setSelectedPlacedId(null);
    } else {
      setSelectedPlacedId(item.id);
      speak(`Selected ${item.name}`);
    }
  };

  const handleColumnLaneClick = (colId) => {
    // If a dock sticker is selected, add it to the column at the end
    if (selectedDockId) {
      const item = dockItems.find(d => d.id === selectedDockId);
      if (item) {
        moveItem(item, 'dock', null, null, colId, columns[colId].items.length);
        setSelectedDockId(null);
      }
    } 
    // If a placed sticker is selected, move it to this column lane
    else if (selectedPlacedId) {
      // Find where selectedPlacedId is currently located
      let foundColId = null;
      let foundIndex = null;
      let foundItem = null;

      Object.keys(columns).forEach(cid => {
        const idx = columns[cid].items.findIndex(item => item.id === selectedPlacedId);
        if (idx !== -1) {
          foundColId = cid;
          foundIndex = idx;
          foundItem = columns[cid].items[idx];
        }
      });

      if (foundItem && foundColId !== colId) {
        moveItem(foundItem, 'column', foundColId, foundIndex, colId, columns[colId].items.length);
      }
      setSelectedPlacedId(null);
    }
  };

  const handlePlacedRemoveClick = (e, colId, index, item) => {
    e.stopPropagation();
    
    // Remove from column
    setColumns(prev => {
      const col = prev[colId];
      const nextItems = [...col.items];
      nextItems.splice(index, 1);
      return {
        ...prev,
        [colId]: { ...col, items: nextItems }
      };
    });

    // Return to dock
    setDockItems(prev => {
      if (prev.some(d => d.id === item.id)) return prev;
      return [...prev, item];
    });

    speak(`Returned ${item.name} to dock`);
    setSelectedPlacedId(null);
  };

  // Submit and Validation
  const handleSubmit = () => {
    if (dockItems.length > 0) {
      const msg = "Place all stickers in the picture columns first!";
      setFeedback({ text: msg, type: 'error' });
      speak(msg);
      setSmartScore(prev => Math.max(0, prev - 5));
      return;
    }

    const col1Items = columns.col1.items;
    const col2Items = columns.col2.items;
    const col3Items = columns.col3.items;

    const col1Correct = col1Items.length === 2 && 
                         col1Items[0].id === 'st-1' && // Penguin
                         col1Items[1].id === 'st-2';    // Rabbit

    const col2Correct = col2Items.length === 1 && 
                         col2Items[0].id === 'st-3';    // Alex

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
      if (col1Items.some(i => i.category !== 'animals') || col2Items.some(i => i.category !== 'mascots') || col3Items.some(i => i.category !== 'emojis')) {
        errorMsg = 'Check your columns! Make sure animals are in Column 1, mascots in Column 2, and emojis in Column 3.';
      } else {
        errorMsg = 'Check your vertical order! Inside each column, stickers must be ordered A-Z from top to bottom.';
      }
      setFeedback({ text: errorMsg, type: 'error' });
      speak(errorMsg);
      setSmartScore(prev => Math.max(0, prev - 8));
    }
  };

  const totalPlaced = columns.col1.items.length + columns.col2.items.length + columns.col3.items.length;

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
          <span style={{ color: '#0f172a', fontWeight: '800' }}>Sticker Sorting & Rearranging inside Canvas</span>
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
            onDragOver={handleDragOverCanvas}
            onDrop={handleDropOnCanvas}
            style={{
              cursor: 'default',
              position: 'relative',
              borderRadius: 16,
              border: '2px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(15,23,42,0.05)'
            }}
          >
            {/* Scenery background wallpaper */}
            <img
              src="/images/prek_landscape.webp"
              alt="Scenery background"
              className={styles.canvasBg}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Render 3 Column Lane Overlays on top of background scenery */}
            {Object.values(columns).map((col, index) => {
              const isColHovered = activeColumnId === col.id;
              const leftPercent = index * 33.33;
              
              return (
                <div
                  key={col.id}
                  onClick={() => handleColumnLaneClick(col.id)}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: 0,
                    width: '33.33%',
                    height: '100%',
                    borderRight: index < 2 ? '2.5px dashed rgba(255, 255, 255, 0.45)' : 'none',
                    background: isColHovered ? col.activeBgColor : col.bgColor,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 8px',
                    zIndex: 2
                  }}
                >
                  {/* Visual Lane Header Label */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: `1.5px solid ${col.borderColor}`,
                      color: col.themeColor,
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                    }}
                  >
                    Column {index + 1}: {col.title}
                  </div>

                  {/* Empty state helper target inside column lane */}
                  {col.items.length === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: '2px dashed rgba(255, 255, 255, 0.6)',
                        borderRadius: 12,
                        width: '76px',
                        height: '76px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '11px',
                        fontWeight: '800',
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.06)'
                      }}
                    >
                      Drop Here
                    </div>
                  )}

                  {/* Visual drag insertion line indicator inside the column lane */}
                  {isColHovered && dragHoveredIndex !== null && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '10%',
                        width: '80%',
                        height: '4px',
                        background: '#ffffff',
                        boxShadow: '0 0 10px #ffffff, 0 0 4px #2563eb',
                        borderRadius: '2px',
                        zIndex: 15,
                        top: `${
                          col.items.length === 0
                            ? 50
                            : dragHoveredIndex === 0
                            ? 22 - 7
                            : dragHoveredIndex === 1
                            ? (col.items.length === 1 ? 78 - 7 : 50 - 7)
                            : 78 + 7
                        }%`,
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Render Placed Stickers Snap-positioned in column lanes on canvas */}
            {Object.entries(columns).flatMap(([colId, col]) => {
              const totalItems = col.items.length;
              return col.items.map((item, idx) => {
                const yPos = getYCoordinate(idx, totalItems);
                const isSelected = selectedPlacedId === item.id;
                
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, 'column', colId, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handlePlacedItemClick(e, colId, idx, item)}
                    style={{
                      position: 'absolute',
                      left: `${col.centerX}%`,
                      top: `${yPos}%`,
                      width: '68px',
                      height: '68px',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      cursor: 'grab',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Visual sticker container wrapper inside canvas */}
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

                      {/* Small floating close button on card hover or selection to return back to dock */}
                      <button
                        type="button"
                        onClick={(e) => handlePlacedRemoveClick(e, colId, idx, item)}
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
              });
            })}
          </div>

          {/* Sticker Dock Row */}
          <div 
            className={styles.dockPanel}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnDock}
            style={{ borderRadius: 16 }}
          >
            {INITIAL_STICKERS.map((m, index) => {
              const isPlaced = !dockItems.some(item => item.id === m.id);
              const isSelected = selectedDockId === m.id;
              const isDragging = draggedItemInfo?.item?.id === m.id;

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
                        onDragStart={(e) => handleDragStart(e, m, 'dock')}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleDockClick(m)}
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
            <span>Stickers Placed: <strong>{totalPlaced} / {INITIAL_STICKERS.length}</strong></span>
            <span>Stickers in Dock: <strong>{dockItems.length}</strong></span>
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
