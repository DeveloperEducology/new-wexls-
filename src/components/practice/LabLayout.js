'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './FactoryLayout.module.css';

export default function LabLayout({
    title,
    grade = 'Elementary Mathematics',
    smartScore = 0,
    difficulty,
    setDifficulty,
    onReset,
    loading,
    question,
    children,
    leftPanel,
    rightPanel,
    feedback,
    isAnswered,
    handleSubmit,
    userAnswer,
    autoSubmit = false,
    setAutoSubmit
}) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getStatusText = (score) => {
        if (score >= 100) return '🏆 Mastered';
        if (score >= 80) return '💎 Proficient';
        return '✨ Learner';
    };

    const getPhaseText = (score) => {
        if (score >= 100) return '🏅 MASTERY PHASE';
        if (score >= 80) return '📈 PROFICIENCY PHASE';
        if (score >= 40) return '🌿 BUILDING PHASE';
        return '🌱 FOUNDATION PHASE';
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageWrapper}>
                
                {/* Premium Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/" className={styles.backButton}>←</Link>
                        <div>
                            <h1 className={styles.title}>{title}</h1>
                            <p className={styles.subtitle}>{grade}</p>
                        </div>
                    </div>

                    <div className={styles.headerControls}>
                        <div className={styles.difficultyTabs}>
                            {['adaptive', 'easy', 'medium', 'hard'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`${styles.difficultyTab} ${difficulty === level ? styles.difficultyTabActive : ''}`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        {setAutoSubmit ? (
                            <button
                                type="button"
                                onClick={() => setAutoSubmit((current) => !current)}
                                className={`${styles.autoSubmitToggle} ${autoSubmit ? styles.autoSubmitToggleActive : ''}`}
                                aria-pressed={autoSubmit}
                            >
                                Auto submit
                                <span>{autoSubmit ? 'On' : 'Off'}</span>
                            </button>
                        ) : null}
                        <button onClick={onReset} className={styles.resetButton}>
                            Reset
                        </button>
                    </div>
                </header>

                <main className={styles.mainGrid}>
                    
                    {/* Left Sidebar */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', order: isMobile ? 2 : 1 }}>
                        {leftPanel}
                    </aside>

                    {/* Central Question Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', order: isMobile ? 1 : 2 }}>
                        
                        {/* Phase & Progress Card */}
                        <div className={`${styles.panel} ${styles.progressPanel}`}>
                            <div className={styles.levelBadge}>
                                <span className={styles.levelLabel}>{getPhaseText(smartScore)}</span>
                                <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '16px' }}>{smartScore} / 100</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill} 
                                    style={{ width: `${smartScore}%` }} 
                                />
                            </div>
                        </div>

                        {/* Main Question Area */}
                        <div className={styles.questionCard}>
                            <div className={styles.accentBar} />
                            
                            <div className={styles.questionBody}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                                        <div style={{ width: '48px', height: '48px', border: '5px solid #f1f5f9', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
                                        <p style={{ fontWeight: '800', color: '#64748b', fontSize: '15px' }}>Materializing Practice...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.questionFocus}>
                                            {children}
                                        </div>

                                        {feedback && (
                                            <div style={{ marginTop: '20px' }}>
                                                {feedback}
                                            </div>
                                        )}
                                        
                                        {!isAnswered && question?.showSubmitButton !== false && (
                                            <div className={styles.submitRow}>
                                                <button 
                                                    onClick={handleSubmit}
                                                    disabled={userAnswer === null}
                                                    className={styles.submitButton}
                                                >
                                                    Verify Logic <span style={{ fontSize: '18px' }}>→</span>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', order: 3 }}>
                        
                        {/* SmartScore Dashboard */}
                        <div className={styles.panel} style={{ position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <span className={styles.panelTitle}>SmartScore</span>
                                <div style={{ 
                                    background: smartScore >= 90 ? '#fef3c7' : '#ecfdf5', 
                                    padding: '6px 12px', 
                                    borderRadius: '12px', 
                                    fontSize: '11px', 
                                    fontWeight: '900', 
                                    color: smartScore >= 90 ? '#92400e' : '#065f46',
                                    textTransform: 'uppercase'
                                }}>
                                    {getStatusText(smartScore)}
                                </div>
                            </div>
                            <div style={{ fontSize: '48px', fontWeight: '950', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.04em' }}>
                                {smartScore}
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', lineHeight: '1.5' }}>
                                {smartScore >= 100 ? 'Mastery reached. Keep practicing to stay sharp.' : smartScore >= 80 ? 'Proficiency reached. Mastery is the next milestone.' : 'Consistency is key to unlocking Proficient status.'}
                            </p>
                        </div>

                        {rightPanel}
                    </aside>

                </main>
            </div>
        </div>
    );
}
