'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './rearrange.module.css';

// Initial 6 Stickers (3 image-based, 3 emoji-based)
const INITIAL_STICKERS = [
  { id: 'st-1', name: 'Penguin', url: '/images/penguin.svg', type: 'image', category: 'animals' },
  { id: 'st-2', name: 'Rabbit', url: '/images/rabbit.svg', type: 'image', category: 'animals' },
  { id: 'st-3', name: 'Alex', url: '/images/alex_avatar.png', type: 'image', category: 'mascots' },
  { id: 'st-4', name: 'Gift', content: '🎁', type: 'emoji', category: 'emojis' },
  { id: 'st-5', name: 'Heart', content: '❤️', type: 'emoji', category: 'emojis' },
  { id: 'st-6', name: 'Star', content: '⭐', type: 'emoji', category: 'emojis' },
];

export default function StickersRearrangeDemoPage() {
  const [dockItems, setDockItems] = useState(INITIAL_STICKERS);
  const [columns, setColumns] = useState({
    col1: { id: 'col1', title: 'Animals (A-Z)', category: 'animals', items: [], themeColor: '#3b82f6', bgColorLight: '#eff6ff', borderColor: '#bfdbfe' },
    col2: { id: 'col2', title: 'Mascots', category: 'mascots', items: [], themeColor: '#8b5cf6', bgColorLight: '#f5f3ff', borderColor: '#ddd6fe' },
    col3: { id: 'col3', title: 'Emojis (A-Z)', category: 'emojis', items: [], themeColor: '#10b981', bgColorLight: '#ecfdf5', borderColor: '#a7f3d0' }
  });

  // Scoreboard / Game state
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [smartScore, setSmartScore] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Dragging and UI states
  const [draggedItemInfo, setDraggedItemInfo] = useState(null); // { item, source, colId, index }
  const [selectedDockId, setSelectedDockId] = useState(null); // Mobile click select state
  const [selectedPlacedInfo, setSelectedPlacedInfo] = useState(null); // Mobile placed select state: { colId, index }
  const [feedback, setFeedback] = useState({ 
    text: 'Sort the stickers: Animals in Column 1, Mascots in Column 2, and Emojis in Column 3. Make sure to arrange them in alphabetical order (A-Z)!', 
    type: 'info' 
  });
  const [hoveredGap, setHoveredGap] = useState(null); // { colId, index } for drag-over line highlights
  const [activeColumnCard, setActiveColumnCard] = useState(null); // Highlight column when dragging over empty areas

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
    speak("Sort the stickers: Animals in Column 1, Mascots in Column 2, and Emojis in Column 3. Make sure to arrange them in alphabetical order from A to Z.");
  };

  const handleReset = () => {
    setDockItems(INITIAL_STICKERS);
    setColumns({
      col1: { ...columns.col1, items: [] },
      col2: { ...columns.col2, items: [] },
      col3: { ...columns.col3, items: [] }
    });
    setSelectedDockId(null);
    setSelectedPlacedInfo(null);
    setFeedback({
      text: 'Sort the stickers: Animals in Column 1, Mascots in Column 2, and Emojis in Column 3. Make sure to arrange them in alphabetical order (A-Z)!',
      type: 'info'
    });
    speak("Ready to play again! Sort the stickers and arrange them in alphabetical order.");
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, item, source, colId = null, index = null) => {
    const dragPayload = { item, source, colId, index };
    setDraggedItemInfo(dragPayload);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
  };

  const handleDragEnd = () => {
    setDraggedItemInfo(null);
    setHoveredGap(null);
    setActiveColumnCard(null);
  };

  const handleDragOverGap = (e, colId, index) => {
    e.preventDefault();
    setHoveredGap({ colId, index });
    setActiveColumnCard(colId);
  };

  const handleDragLeaveGap = () => {
    setHoveredGap(null);
  };

  const handleDropOnGap = (e, targetColId, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    moveItem(payload.item, payload.source, payload.colId, payload.index, targetColId, targetIndex);
    
    setDraggedItemInfo(null);
    setHoveredGap(null);
    setActiveColumnCard(null);
  };

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

    // Add back to dock
    setDockItems(prev => {
      if (prev.some(d => d.id === payload.item.id)) return prev;
      return [...prev, payload.item];
    });

    speak(`Returned ${payload.item.name} to dock`);
    setDraggedItemInfo(null);
    setHoveredGap(null);
    setActiveColumnCard(null);
  };

  // Helper to move item in state
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
      
      // Adjust insert index if moving within the same column
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

    speak(`Placed ${item.name} in ${columns[targetColId].title}`);
  };

  // Mobile Click-to-Move handlers
  const handleDockClick = (item) => {
    setSelectedPlacedInfo(null);
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
    if (selectedPlacedInfo && selectedPlacedInfo.colId === colId && selectedPlacedInfo.index === index) {
      setSelectedPlacedInfo(null);
    } else {
      setSelectedPlacedInfo({ colId, index, item });
      speak(`Selected ${item.name}`);
    }
  };

  const handleColumnHeaderClick = (colId) => {
    // If a dock item is selected, move it to the end of this column
    if (selectedDockId) {
      const item = dockItems.find(d => d.id === selectedDockId);
      if (item) {
        moveItem(item, 'dock', null, null, colId, columns[colId].items.length);
        setSelectedDockId(null);
      }
    } 
    // If a placed item is selected, move it to the end of this column
    else if (selectedPlacedInfo) {
      const { item, colId: sourceColId, index: sourceIndex } = selectedPlacedInfo;
      moveItem(item, 'column', sourceColId, sourceIndex, colId, columns[colId].items.length);
      setSelectedPlacedInfo(null);
    }
  };

  const handleGapClick = (colId, index) => {
    if (selectedDockId) {
      const item = dockItems.find(d => d.id === selectedDockId);
      if (item) {
        moveItem(item, 'dock', null, null, colId, index);
        setSelectedDockId(null);
      }
    } else if (selectedPlacedInfo) {
      const { item, colId: sourceColId, index: sourceIndex } = selectedPlacedInfo;
      moveItem(item, 'column', sourceColId, sourceIndex, colId, index);
      setSelectedPlacedInfo(null);
    }
  };

  const handleRemoveClick = (e, colId, index, item) => {
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

    // Add back to dock
    setDockItems(prev => {
      if (prev.some(d => d.id === item.id)) return prev;
      return [...prev, item];
    });

    speak(`Removed ${item.name}`);
    setSelectedPlacedInfo(null);
  };

  // Submit & Validation
  const handleSubmit = () => {
    // Check if any items are still in dock
    if (dockItems.length > 0) {
      const msg = "Place all stickers in the columns first!";
      setFeedback({ text: msg, type: 'error' });
      speak(msg);
      setSmartScore(prev => Math.max(0, prev - 5));
      return;
    }

    // Validation rules:
    // 1. Column 1 (col1): Category must be 'animals', items must be sorted A-Z (Penguin first, Rabbit second)
    // 2. Column 2 (col2): Category must be 'mascots', items must be 'Alex'
    // 3. Column 3 (col3): Category must be 'emojis', items must be sorted A-Z (Gift, Heart, Star)
    
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
        text: 'Fantastic! All stickers are sorted into the correct columns and arranged perfectly in A-Z order!',
        type: 'success'
      });
      speak("Excellent work! You sorted and arranged all stickers correctly.");
      setSmartScore(prev => Math.min(100, prev + 20));
      setQuestionsAnswered(prev => prev + 1);

      setTimeout(() => {
        handleReset();
      }, 3500);
    } else {
      let errorMsg = '';
      if (col1Items.some(i => i.category !== 'animals') || col2Items.some(i => i.category !== 'mascots') || col3Items.some(i => i.category !== 'emojis')) {
        errorMsg = 'Some stickers are placed in the wrong columns. Check their categories!';
      } else {
        errorMsg = 'Check your alphabetical arrangement. Stickers inside the columns must be ordered A-Z!';
      }
      setFeedback({ text: errorMsg, type: 'error' });
      speak(errorMsg);
      setSmartScore(prev => Math.max(0, prev - 8));
    }
  };

  const totalPlaced = columns.col1.items.length + columns.col2.items.length + columns.col3.items.length;

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
          <span>Grade 1 Practice</span>
          <span>›</span>
          <span style={{ color: '#0f172a', fontWeight: '800' }}>Sticker Sorting & Rearranging Demo</span>
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

          {/* Prompt header instruction */}
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
              Sort the stickers into columns and <strong>rearrange them in alphabetical order (A-Z)</strong>.
            </span>
          </div>

          {/* 3-Column Dropzone Canvas area */}
          <div className={styles.columnsContainer}>
            {Object.values(columns).map((col) => {
              const isActive = activeColumnCard === col.id;
              
              return (
                <div 
                  key={col.id} 
                  className={`${styles.columnCard} ${isActive ? styles.columnCardActive : ''}`}
                  style={{ 
                    '--theme-color': col.themeColor,
                    '--theme-color-light': col.bgColorLight,
                    '--theme-color-border': col.borderColor
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (col.items.length === 0) setActiveColumnCard(col.id);
                  }}
                  onDragLeave={() => setActiveColumnCard(null)}
                  onDrop={(e) => {
                    if (col.items.length === 0) {
                      handleDropOnGap(e, col.id, 0);
                    }
                  }}
                  onClick={() => handleColumnHeaderClick(col.id)}
                >
                  <div className={styles.columnHeader}>
                    <h3>{col.title}</h3>
                    <span className={styles.columnBadge}>{col.items.length} placed</span>
                  </div>

                  <div className={styles.columnDropArea}>
                    {col.items.length === 0 ? (
                      <div className={styles.columnPlaceholder}>
                        Drop stickers here
                      </div>
                    ) : (
                      <>
                        {/* Gap Dropzone before the first card */}
                        <div
                          className={styles.dragIndicatorLine}
                          style={{
                            height: hoveredGap?.colId === col.id && hoveredGap?.index === 0 ? '12px' : '6px',
                            background: hoveredGap?.colId === col.id && hoveredGap?.index === 0 ? col.themeColor : 'transparent',
                            cursor: 'pointer',
                          }}
                          onDragOver={(e) => handleDragOverGap(e, col.id, 0)}
                          onDragLeave={handleDragLeaveGap}
                          onDrop={(e) => handleDropOnGap(e, col.id, 0)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGapClick(col.id, 0);
                          }}
                        />

                        {col.items.map((item, idx) => {
                          const isItemSelected = selectedPlacedInfo?.colId === col.id && selectedPlacedInfo?.index === idx;
                          const isDragging = draggedItemInfo?.item?.id === item.id;
                          
                          return (
                            <React.Fragment key={item.id}>
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, item, 'column', col.id, idx)}
                                onDragEnd={handleDragEnd}
                                onClick={(e) => handlePlacedItemClick(e, col.id, idx, item)}
                                className={`${styles.placedStickerItem} ${isItemSelected ? styles.placedStickerItemActive : ''} ${isDragging ? styles.placedStickerItemDragging : ''}`}
                                title="Drag to reorder, click to select / remove"
                              >
                                <div className={styles.stickerIconWrapper}>
                                  {item.type === 'image' ? (
                                    <img src={item.url} alt={item.name} className={styles.stickerIconImage} />
                                  ) : (
                                    <span className={styles.stickerIconEmoji}>{item.content}</span>
                                  )}
                                </div>
                                <div className={styles.stickerInfo}>
                                  <span className={styles.stickerName}>{item.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveClick(e, col.id, idx, item)}
                                  className={styles.stickerRemoveBtn}
                                  title="Return back to dock"
                                >
                                  ✕
                                </button>
                                <span className={styles.stickerDragHandle}>☰</span>
                              </div>

                              {/* Gap Dropzone after this card */}
                              <div
                                className={styles.dragIndicatorLine}
                                style={{
                                  height: hoveredGap?.colId === col.id && hoveredGap?.index === idx + 1 ? '12px' : '6px',
                                  background: hoveredGap?.colId === col.id && hoveredGap?.index === idx + 1 ? col.themeColor : 'transparent',
                                  cursor: 'pointer',
                                }}
                                onDragOver={(e) => handleDragOverGap(e, col.id, idx + 1)}
                                onDragLeave={handleDragLeaveGap}
                                onDrop={(e) => handleDropOnGap(e, col.id, idx + 1)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGapClick(col.id, idx + 1);
                                }}
                              />
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticker Dock Row */}
          <div 
            className={`${styles.dockPanel} ${activeColumnCard === 'dock' ? styles.dockPanelActive : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnDock}
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
                        title={`Drag ${m.name} into columns`}
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

          {/* Statistics summary */}
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
