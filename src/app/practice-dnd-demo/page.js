'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './dnd.module.css';

// Master vocabulary list for the game
const INITIAL_WORDS = [
  { id: 'w1', text: 'Apple', category: 'noun', color: '#fb923c' },
  { id: 'w2', text: 'Dog', category: 'noun', color: '#fb923c' },
  { id: 'w3', text: 'Rocket', category: 'noun', color: '#fb923c' },
  { id: 'w4', text: 'Penguin', category: 'noun', color: '#fb923c' },
  { id: 'w5', text: 'Tree', category: 'noun', color: '#fb923c' },
  
  { id: 'w6', text: 'Run', category: 'verb', color: '#38bdf8' },
  { id: 'w7', text: 'Jump', category: 'verb', color: '#38bdf8' },
  { id: 'w8', text: 'Swim', category: 'verb', color: '#38bdf8' },
  { id: 'w9', text: 'Sing', category: 'verb', color: '#38bdf8' },
  { id: 'w10', text: 'Fly', category: 'verb', color: '#38bdf8' },
  
  { id: 'w11', text: 'Sweet', category: 'adjective', color: '#34d399' },
  { id: 'w12', text: 'Fast', category: 'adjective', color: '#34d399' },
  { id: 'w13', text: 'Blue', category: 'adjective', color: '#34d399' },
  { id: 'w14', text: 'Happy', category: 'adjective', color: '#34d399' },
  { id: 'w15', text: 'Huge', category: 'adjective', color: '#34d399' },
];

const CATEGORIES = [
  { id: 'noun', label: 'Nouns', description: 'Naming words for people, places, or things.', color: '#ea580c', bgColor: 'rgba(234, 88, 12, 0.08)', borderColor: '#ea580c' },
  { id: 'verb', label: 'Verbs', description: 'Action words showing what someone is doing.', color: '#0284c7', bgColor: 'rgba(2, 132, 199, 0.08)', borderColor: '#0284c7' },
  { id: 'adjective', label: 'Adjectives', description: 'Describing words giving more details.', color: '#059669', bgColor: 'rgba(5, 150, 105, 0.08)', borderColor: '#059669' }
];

export default function DnDDemoPage() {
  const [words, setWords] = useState([]);
  const [placedWords, setPlacedWords] = useState({ noun: [], verb: [], adjective: [] });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeDragId, setActiveDragId] = useState(null);
  const [selectedWordId, setSelectedWordId] = useState(null); // Mobile tap fallback support
  const [dragOverBin, setDragOverBin] = useState(null);
  const [feedback, setFeedback] = useState({ text: 'Drag a word card to its category bin!', type: 'info' });
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'completed'

  // Initialize and shuffle words
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const shuffled = [...INITIAL_WORDS].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setPlacedWords({ noun: [], verb: [], adjective: [] });
    setScore(0);
    setStreak(0);
    setActiveDragId(null);
    setSelectedWordId(null);
    setDragOverBin(null);
    setGameState('playing');
    setFeedback({ text: 'Drag a word card to its category bin!', type: 'info' });
    speak('Welcome to parts of speech drag and drop! Sort the words to win.');
  };

  // Speaks feedback message using browser TTS
  const speak = (msg) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // HTML5 DnD event handlers
  const handleDragStart = (e, id, text) => {
    setActiveDragId(id);
    setSelectedWordId(null); // Clear selected state on tap fallback
    e.dataTransfer.setData('text/plain', id);
    // Visual drag feedback
    e.currentTarget.classList.add(styles.dragging);
    speak(text);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove(styles.dragging);
    setActiveDragId(null);
  };

  const handleDragOver = (e, categoryId) => {
    e.preventDefault();
    if (dragOverBin !== categoryId) {
      setDragOverBin(categoryId);
    }
  };

  const handleDragLeave = () => {
    setDragOverBin(null);
  };

  const handleDrop = (e, targetCategory) => {
    e.preventDefault();
    setDragOverBin(null);
    const wordId = e.dataTransfer.getData('text/plain') || activeDragId;
    if (wordId) {
      processPlacement(wordId, targetCategory);
    }
  };

  // Mobile-friendly tap fallback handler
  const handleWordTap = (id, text) => {
    if (selectedWordId === id) {
      // Toggle off if tapped again
      setSelectedWordId(null);
    } else {
      setSelectedWordId(id);
      speak(text);
    }
  };

  const handleBinTap = (targetCategory) => {
    if (selectedWordId) {
      processPlacement(selectedWordId, targetCategory);
      setSelectedWordId(null);
    }
  };

  // Core game placement logic
  const processPlacement = (wordId, targetCategory) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    if (word.category === targetCategory) {
      // Correct Match!
      setPlacedWords(prev => ({
        ...prev,
        [targetCategory]: [...prev[targetCategory], word]
      }));
      setWords(prev => prev.filter(w => w.id !== wordId));
      
      const newScore = score + 10 + Math.floor(streak / 3) * 5;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      
      const positivePhrases = ['Correct!', 'Excellent!', 'Fantastic!', 'Superb!', 'Great job!'];
      const randomPhrase = positivePhrases[Math.floor(Math.random() * positivePhrases.length)];
      const msg = `${randomPhrase} "${word.text}" is indeed a ${targetCategory}.`;
      
      setFeedback({
        text: msg,
        type: 'success'
      });
      speak(msg);

      // Check for completion
      if (words.length <= 1) {
        setGameState('completed');
        speak(`Congratulations! You sorted all words successfully! Final score: ${newScore} points.`);
      }
    } else {
      // Incorrect Match
      setStreak(0);
      setScore(prev => Math.max(0, prev - 5));
      const msg = `Not quite. "${word.text}" is a ${word.category}, not a ${targetCategory}.`;
      setFeedback({
        text: msg,
        type: 'error'
      });
      speak(msg);
      
      // Flash drop zone red
      const binElement = document.getElementById(`bin-${targetCategory}`);
      if (binElement) {
        binElement.classList.add(styles.shake);
        setTimeout(() => binElement.classList.remove(styles.shake), 500);
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>DND ENGINE V2 DEMO</div>
        <h1>Vocabulary Category Sorter</h1>
        <p>Categorize words into Nouns, Verbs, and Adjectives. Drag and drop cards or tap-to-place!</p>
      </header>

      {/* Score Dashboard */}
      <section className={styles.dashboard}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>{score}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Streak</span>
          <span className={styles.statValue}>🔥 {streak}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Cards Left</span>
          <span className={styles.statValue}>{words.length}</span>
        </div>
      </section>

      {/* Feedback Banner */}
      <div className={`${styles.feedback} ${styles[feedback.type]}`}>
        <span className={styles.feedbackIcon}>
          {feedback.type === 'success' ? '✨' : feedback.type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <p>{feedback.text}</p>
      </div>

      {/* Main Play Area */}
      {gameState === 'playing' ? (
        <main className={styles.gameArea}>
          {/* Draggable Word Deck */}
          <div className={styles.deckSection}>
            <h2>Available Words</h2>
            <p className={styles.subtext}>Drag these cards to the correct category bins below</p>
            <div className={styles.deck}>
              {words.map((word) => (
                <div
                  key={word.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, word.id, word.text)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleWordTap(word.id, word.text)}
                  className={`${styles.card} ${selectedWordId === word.id ? styles.selected : ''}`}
                  style={{ '--card-accent': word.color }}
                >
                  <span className={styles.cardIndicator}>✥</span>
                  <span className={styles.cardText}>{word.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Placed Target Bins */}
          <div className={styles.binsSection}>
            {CATEGORIES.map((cat) => {
              const items = placedWords[cat.id] || [];
              const isOver = dragOverBin === cat.id;
              
              return (
                <div
                  key={cat.id}
                  id={`bin-${cat.id}`}
                  onDragOver={(e) => handleDragOver(e, cat.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cat.id)}
                  onClick={() => handleBinTap(cat.id)}
                  className={`${styles.bin} ${isOver ? styles.dragOver : ''} ${selectedWordId ? styles.accepting : ''}`}
                  style={{
                    '--bin-accent': cat.color,
                    '--bin-bg': cat.bgColor,
                    '--bin-border': cat.borderColor
                  }}
                >
                  <div className={styles.binHeader}>
                    <h3>{cat.label}</h3>
                    <span className={styles.binCount}>{items.length} placed</span>
                  </div>
                  <p className={styles.binDesc}>{cat.description}</p>
                  
                  {/* Words dropped inside this category */}
                  <div className={styles.binContent}>
                    {items.length === 0 ? (
                      <div className={styles.placeholder}>Drop {cat.label} here</div>
                    ) : (
                      <div className={styles.placedGrid}>
                        {items.map((item) => (
                          <div key={item.id} className={styles.placedCard}>
                            {item.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        /* Completion screen */
        <section className={styles.completeScreen}>
          <div className={styles.trophy}>🏆</div>
          <h2>Wonderful Sorting!</h2>
          <p>You categorized all vocabulary cards correctly with a final score of <strong>{score} points</strong>.</p>
          <div className={styles.completeStats}>
            <div>
              <span>Words Sorted</span>
              <span>15</span>
            </div>
            <div>
              <span>Streak Bonus</span>
              <span>+{Math.floor(score / 50) * 10}</span>
            </div>
          </div>
          <button type="button" className={styles.resetBtn} onClick={resetGame}>
            Play Again 🔄
          </button>
        </section>
      )}

      {/* Navigation Footer */}
      <footer className={styles.footer}>
        <a href="/practice?subject=english&topic=english-ukg" className={styles.backLink}>
          ← Return to Student Practice View
        </a>
      </footer>
    </div>
  );
}
