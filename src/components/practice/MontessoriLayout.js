'use client';

import React, { useState, useEffect } from 'react';
import styles from './FactoryLayout.module.css';
import MascotGuide from './MascotGuide';
import MontessoriTray from './MontessoriTray';
import { getQuestionSpeechText } from '@/lib/ttsClient';

function StarsJar({ score, lastResult }) {
  const [starList, setStarList] = useState([]);
  const prevScore = React.useRef(score);

  // Generate stars based on score
  useEffect(() => {
    const count = Math.min(20, Math.floor(score / 5)); // cap at 20 stars visually
    const items = [];
    for (let i = 0; i < count; i++) {
      // Deterministic but random-looking positions inside the jar base
      const angle = (i * 137.5) % 360; // golden ratio angle distribution
      const r = Math.min(18, 5 + Math.sqrt(i) * 3.8); // distribute outward
      const x = Math.cos(angle * Math.PI / 180) * r;
      const y = 20 - Math.sin(angle * Math.PI / 180) * r * 0.7; // flat bottom distribution
      items.push({ id: i, x, y, size: 12 + (i % 3) * 2 });
    }
    setStarList(items);

    // If score increased, play star drop animation
    if (score > prevScore.current && lastResult === 'correct') {
      // Trigger a temporary dropping star
      const dropStarId = `drop-${Date.now()}`;
      setStarList((prev) => [...prev, { id: dropStarId, x: 0, y: -45, size: 18, dropping: true }]);
      
      const timer = setTimeout(() => {
        // Remove dropping star, rebuild regular stack
        prevScore.current = score;
      }, 1000);
      return () => clearTimeout(timer);
    }
    prevScore.current = score;
  }, [score, lastResult]);

  return (
    <div className={styles.rewardsJarContainer}>
      <div className={styles.jarGlass}>
        {/* Lid */}
        <div className={styles.jarLid} />
        {/* String/Ribbon */}
        <div className={styles.jarRibbon} />
        
        {/* Stars inside */}
        <div className={styles.jarWorkspace}>
          {starList.map((star) => (
            <span
              key={star.id}
              className={`${styles.jarStar} ${star.dropping ? styles.starDropAnimation : ''}`}
              style={{
                transform: `translate(${star.x}px, ${star.y}px)`,
                fontSize: `${star.size}px`,
                filter: star.dropping ? 'drop-shadow(0 0 8px #facc15)' : 'none',
              }}
            >
              ⭐
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MontessoriLayout({ 
  title,
  subject = 'math',
  smartScore = 0,
  difficulty,
  setDifficulty,
  onReset,
  loading,
  question,
  children,
  feedback,
  isAnswered,
  handleSubmit,
  userAnswer,
  practiceLevel = 1,
  levelStreak = 0,
  isSubmitting = false,
  isCorrect = false,
  onNext = null,
  activeStudent = 'Alex',
  isSecondTry = false,
  lastResult = 'none'
}) {
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const isDirectImageSelect = question?.directImageSelect || question?.interaction === 'direct_image_select';
  const shouldAutoSubmit = Boolean(
    question?.metadata?.clickToSubmit ||
    question?.layoutConfig?.clickToSubmit ||
    question?.metadata?.autoSubmit ||
    question?.layoutConfig?.autoSubmit
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const spokenInstructions = question ? getQuestionSpeechText(question) : '';

  return (
    <div className={styles.montessoriPageContainer}>
      {/* Import Fredoka rounded kid-friendly font */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700;900&display=swap');
        :root {
            --font-outfit: 'Fredoka', 'Outfit', sans-serif;
        }
      `}} />

      {/* Montessori Prepared Classroom Backdrop */}
      <div className={styles.montessoriClassroomBackdrop} />

      <div className={styles.montessoriPageWrapper}>
        {/* Calming, Ordered Header */}
        <header className={styles.montessoriHeader}>
          {/* Left Navigation */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
              } else {
                onReset();
              }
            }}
            className={styles.montessoriBackBtn}
            title="Go back"
          >
            ◀
          </button>

          {/* Center Glass Stars Jar */}
          <StarsJar score={smartScore} lastResult={lastResult} />
        </header>

        {/* Central Learning Sandbox Grid */}
        <main className={styles.montessoriMainGrid}>
          {/* Mascot directress guidance card */}
          <MascotGuide
            questionText={spokenInstructions}
            isCorrect={isCorrect}
            isAnswered={isAnswered}
            triggerJoy={smartScore}
          />

          {/* Main Question Card Board */}
          <div className={styles.montessoriQuestionBoardCard}>
            <div className={styles.montessoriBoardAestheticLine} />
            <div className={styles.montessoriBoardContent}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '70px 0' }}>
                  <div className={styles.montessoriLoaderSpinner} />
                  <p style={{ fontWeight: 900, color: '#7c2d12', fontSize: '15px', marginTop: 16 }}>
                    Preparing materials...
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.montessoriQuestionFocusArea}>
                    {children}
                  </div>

                  {feedback && (
                    <div style={{ marginTop: '22px', borderTop: '3.5px dashed #f5efe6', paddingTop: '18px' }}>
                      {feedback}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Row: Montessori Shelf Toggle and Submit Capsule */}
          <div className={styles.montessoriActionRow}>
            {/* Shelf drawer trigger button */}
            <button
              type="button"
              onClick={() => setIsTrayOpen(!isTrayOpen)}
              className={`${styles.montessoriShelfTriggerBtn} ${isTrayOpen ? styles.shelfTriggerBtnActive : ''}`}
            >
              <span>{isTrayOpen ? '🚪 Close Shelf' : '🧮 Open Montessori Shelf'}</span>
            </button>

            {/* Check/Next Question capsule button */}
            {!isAnswered ? (
              !shouldAutoSubmit && (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={userAnswer === null || isSubmitting || loading}
                  className={isSecondTry ? styles.montessoriRetryBtn : styles.montessoriCheckBtn}
                >
                  {isSecondTry ? (
                    <span>💫 Try Again! (Self-Correct)</span>
                  ) : (
                    <span>{isDirectImageSelect && userAnswer === null ? '👆 Tap a picture' : '🚀 Check My Answer'}</span>
                  )}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => onNext && onNext()}
                className={styles.montessoriNextBtnCapsule}
              >
                <span>🚀 Next Question</span>
              </button>
            )}
          </div>

          {/* Interactive materials sandbox canvas tray drawer */}
          <MontessoriTray
            isOpen={isTrayOpen}
            onClose={() => setIsTrayOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}
