'use client';

import React, { useState, useEffect, useRef } from 'react';
import { speakText, stopAllSpeech } from '@/lib/ttsClient';
import styles from './FactoryLayout.module.css';

const MASCOTS = [
  {
    id: 'owl',
    name: 'Oliver the Owl',
    emoji: '🦉',
    voice: 'Puck',
    color: '#7c2d12',
    bg: '#ffedd5',
    tagline: 'Wise Owl guide ready to help!',
    intro: 'Hi there! I am Oliver. Let’s explore this together!'
  },
  {
    id: 'panda',
    name: 'Pippin the Panda',
    emoji: '🐼',
    voice: 'Kore',
    color: '#0f172a',
    bg: '#f1f5f9',
    tagline: 'Playful Panda helper!',
    intro: 'Hello! I am Pippin! Let’s have fun learning!'
  },
  {
    id: 'bunny',
    name: 'Bella the Bunny',
    emoji: '🐰',
    voice: 'Fenrir',
    color: '#701a75',
    bg: '#fae8ff',
    tagline: 'Soft Bunny friend!',
    intro: 'Hi friend! I am Bella. We can do this!'
  }
];

export default function MascotGuide({ questionText, isCorrect, isAnswered, triggerJoy }) {
  const [selectedMascot, setSelectedMascot] = useState(MASCOTS[0]);
  const [showSelector, setShowSelector] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const spokenRef = useRef(null);

  // Load selection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('montessoriMascot');
    if (saved) {
      const match = MASCOTS.find((m) => m.id === saved);
      if (match) setSelectedMascot(match);
    }
  }, []);

  // Autoplay instructions on question text change
  useEffect(() => {
    if (questionText && spokenRef.current !== questionText) {
      spokenRef.current = questionText;
      // Short delay to allow user transition
      const timer = setTimeout(() => {
        speakText(questionText, selectedMascot.voice);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [questionText, selectedMascot]);

  // Mascot joy bounce trigger on correct answers or clicks
  useEffect(() => {
    if (isAnswered && isCorrect) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, isCorrect, triggerJoy]);

  const selectMascot = (mascot) => {
    setSelectedMascot(mascot);
    localStorage.setItem('montessoriMascot', mascot.id);
    setShowSelector(false);
    
    // Play intro voice
    stopAllSpeech();
    speakText(mascot.intro, mascot.voice);
    
    // Quick bounce animation
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 800);
  };

  const handleMascotClick = () => {
    setShowSelector(!showSelector);
    if (!showSelector) {
      // Gentle bounce when opened
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500);
    }
  };

  const handleSpeakInstructions = (e) => {
    e.stopPropagation();
    if (questionText) {
      speakText(questionText, selectedMascot.voice);
    }
  };

  const displayQuestionText = useMemo(() => {
    if (!questionText) return "Let's read this question.";
    return String(questionText)
      .replace(/(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/gi, '')
      .replace(/\\n/g, '\n')
      .trim();
  }, [questionText]);

  return (
    <div className={styles.mascotGuideContainer}>
      <div style={{ position: 'relative' }}>
        {/* Mascot Avatar Bubble */}
        <button
          type="button"
          onClick={handleMascotClick}
          className={`${styles.mascotAvatarBubble} ${isBouncing ? styles.mascotBounce : ''}`}
          style={{ background: selectedMascot.bg, border: `4.5px solid ${selectedMascot.color}33` }}
          title="Click to Choose Guide"
        >
          <span style={{ fontSize: '48px' }}>{selectedMascot.emoji}</span>
          <span className={styles.mascotChangeBadge}>✏️</span>
        </button>

        {/* Circular Guide Selector overlay */}
        {showSelector && (
          <div className={styles.mascotSelectorDrawer}>
            <div className={styles.mascotSelectorBackdrop} onClick={() => setShowSelector(false)} />
            <div className={styles.mascotSelectorBubbleList}>
              <div className={styles.mascotSelectorTitle}>Choose Your Guide</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {MASCOTS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMascot(m)}
                    className={`${styles.mascotSelectorItem} ${selectedMascot.id === m.id ? styles.activeMascotItem : ''}`}
                    style={{ '--hover-color': m.color }}
                  >
                    <span style={{ fontSize: '30px' }}>{m.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: m.color }}>{m.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hand-drawn style speech bubble */}
      <div className={styles.mascotSpeechBubble} style={{ border: `3.5px solid ${selectedMascot.color}25` }}>
        <div className={styles.mascotSpeechBubbleTail} style={{ borderLeft: `3.5px solid ${selectedMascot.color}25`, borderBottom: `3.5px solid ${selectedMascot.color}25` }} />
        <div className={styles.mascotSpeechContent}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontWeight: 900, fontSize: '12px', color: selectedMascot.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {selectedMascot.name}
            </span>
            <button
              type="button"
              onClick={handleSpeakInstructions}
              className={`${styles.mascotSpeakerBtn} ${styles.pulsingSpeaker}`}
              style={{ background: selectedMascot.bg, color: selectedMascot.color }}
              title="Speak Instructions"
            >
              🔊
            </button>
          </div>
          <div className={styles.mascotSpeechText} style={{ marginTop: 6 }}>
            {displayQuestionText}
          </div>
        </div>
      </div>
    </div>
  );
}
