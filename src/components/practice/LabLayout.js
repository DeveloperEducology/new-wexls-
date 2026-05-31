'use client';

import React, { useState, useEffect } from 'react';
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
    setAutoSubmit,
    practiceLevel = 1,
    levelStreak = 0,
    isSubmitting = false,
    isPreK = false,
    isCorrect = false,
    onNext = null,
    subject = ''
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [showTeacherPanel, setShowTeacherPanel] = useState(false);

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

    const handleOpenTeacherPanel = () => {
        const num1 = Math.floor(Math.random() * 5) + 1;
        const num2 = Math.floor(Math.random() * 5) + 1;
        const answer = prompt(`Adult Gate: What is ${num1} + ${num2}?`);
        if (parseInt(answer, 10) === (num1 + num2)) {
            setShowTeacherPanel(true);
        } else if (answer !== null) {
            alert("Incorrect answer. Settings are locked for adults only.");
        }
    };

    return (
        <div className={isPreK ? styles.preKPageContainer : styles.pageContainer}>
            {isPreK && (
                <>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700;900&display=swap');
                        :root {
                            --font-outfit: 'Fredoka', 'Outfit', sans-serif;
                        }
                    `}} />
                    <div className={styles.preKCloud1}>☁️</div>
                    <div className={styles.preKCloud2}>☁️</div>
                    <div className={styles.preKSun}>☀️</div>
                    <div className={styles.preKLandscapeBackdrop}>
                        <svg className={styles.preKLandscapeHills} viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <path d="M0 80C120 40 280 20 480 50C680 80 880 120 1080 90C1280 60 1380 40 1440 30V180H0V80Z" fill="#86efac" opacity="0.6"/>
                            <path d="M0 110C160 80 320 60 520 95C720 130 920 100 1120 70C1320 40 1400 60 1440 70V180H0V110Z" fill="#4ade80"/>
                        </svg>
                        <div className={styles.preKSparkle} style={{ '--delay': '0.5s', top: '20px', left: '15%' }}>✨</div>
                        <div className={styles.preKSparkle} style={{ '--delay': '1.2s', top: '40px', left: '45%' }}>⭐</div>
                        <div className={styles.preKSparkle} style={{ '--delay': '2s', top: '15px', left: '80%' }}>✨</div>
                    </div>
                </>
            )}

            <div className={styles.pageWrapper}>
                
                {/* Premium Header */}
                {isPreK ? (
                    <header className={styles.preKHeader}>
                        {/* 1. Mascot Avatar on the left with overlapping stars badge */}
                        <div className={styles.preKAvatarContainer} onClick={onReset} title="Restart Practice">
                            <span style={{ fontSize: '48px', display: 'block', transform: 'scaleX(-1)' }}>
                                {String(subject || question?.metadata?.subject || question?.subject || '').toLowerCase() === 'english' ? '🐻' : '🦉'}
                            </span>
                            <div className={styles.preKAvatarStarBadge}>
                                ⭐ <span>{smartScore}</span>
                            </div>
                        </div>

                        {/* 2. Your Learning Journey progress track */}
                        <div className={styles.preKJourneyContainer}>
                            <div className={styles.preKJourneyTitle}>Your Learning Journey</div>
                            <div className={styles.preKProgressTrail}>
                                <div className={styles.preKProgressTrack} />
                                <div className={styles.preKProgressDottedLine} />
                                {Array.from({ length: 4 }).map((_, index) => {
                                    const isFilled = index < levelStreak;
                                    const leftPct = (index / 3) * 75 + 10;
                                    return (
                                        <div
                                            key={index}
                                            className={styles.preKProgressStarNode}
                                            style={{
                                                left: `${leftPct}%`,
                                                opacity: isFilled ? 1 : 0.45,
                                                filter: isFilled ? 'none' : 'grayscale(1)',
                                                transform: isFilled ? 'scale(1.2) translateY(-50%)' : 'scale(1) translateY(-50%)',
                                            }}
                                        >
                                            ⭐
                                        </div>
                                    );
                                })}
                                <div className={styles.preKProgressGoalNode}>
                                    🎁
                                </div>
                                <div 
                                    className={styles.preKProgressRocket}
                                    style={{
                                        left: `${(levelStreak / 5) * 80}%`,
                                    }}
                                >
                                    🚀
                                </div>
                            </div>
                            
                            {/* Level Shield Badge */}
                            <div className={styles.preKLevelShield}>
                                <span className={styles.preKLevelShieldLabel}>Level</span>
                                <span className={styles.preKLevelShieldValue}>{practiceLevel}</span>
                            </div>
                        </div>

                        {/* 3. Streak and Stars stats on the right */}
                        <div className={styles.preKRightStatsContainer}>
                            <div className={`${styles.preKStatCard} ${styles.preKStreakCard}`}>
                                <span className={styles.preKStatCardIcon}>🔥</span>
                                <div className={styles.preKStatCardText}>
                                    <span className={styles.preKStatCardValue}>{levelStreak}</span>
                                    <span className={styles.preKStatCardLabel}>Streak</span>
                                </div>
                            </div>
                            <div className={`${styles.preKStatCard} ${styles.preKStarsCard}`}>
                                <span className={styles.preKStatCardIcon}>⭐</span>
                                <div className={styles.preKStatCardText}>
                                    <span className={styles.preKStatCardValue}>{smartScore}</span>
                                    <span className={styles.preKStatCardLabel}>Stars</span>
                                </div>
                            </div>
                        </div>
                    </header>
                ) : (
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
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

                        <div className={styles.mobileStatusBar} aria-label="Practice progress">
                            <div className={styles.mobileStatusItem}>
                                <span className={styles.mobileStatusLabel}>SmartScore</span>
                                <strong className={styles.mobileStatusValue}>{smartScore}</strong>
                            </div>
                            <div className={styles.mobileStatusItem}>
                                <span className={styles.mobileStatusLabel}>Streak</span>
                                <strong className={styles.mobileStatusValue}>{levelStreak}/5</strong>
                                <span className={styles.mobileStatusSubvalue}>Level {practiceLevel}</span>
                            </div>
                        </div>
                    </header>
                )}

                {isPreK ? (
                    <main className={styles.preKMainGrid}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', width: '100%' }}>
                            
                            {/* Centered Question Card */}
                            <div className={styles.preKQuestionCard}>
                                {(() => {
                                    const subject = question?.metadata?.subject || question?.subject || '';
                                    const accentBg = subject === 'english'
                                        ? 'linear-gradient(90deg, #38bdf8 0%, #06b6d4 100%)'
                                        : 'linear-gradient(90deg, #f59e0b 0%, #eab308 100%)';
                                    return (
                                        <div 
                                            className={styles.accentBar} 
                                            style={{ 
                                                background: accentBg, 
                                                height: '6px' 
                                            }} 
                                        />
                                    );
                                })()}
                                
                                <div className={styles.questionBody} style={{ padding: '10px 0 0 0' }}>
                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                                            <div style={{ width: '56px', height: '56px', border: '5px solid #fef08a', borderTopColor: '#f97316', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
                                            <p style={{ fontWeight: '900', color: '#7c2d12', fontSize: '16px' }}>Making Magic...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.questionFocus} style={{ fontSize: '18px' }}>
                                                {children}
                                            </div>

                                            {!isAnswered && (
                                                <div className={styles.preKRewardBanner}>
                                                    <span className={styles.preKRewardBannerIcon}>🎁</span>
                                                    <span>Answer correctly to earn Stars!</span>
                                                    <span style={{ fontWeight: '950', color: '#ea580c' }}>+10 Stars ⭐</span>
                                                </div>
                                            )}

                                            {feedback && (
                                                <div style={{ marginTop: '20px' }}>
                                                    {feedback}
                                                </div>
                                            )}
                                            
                                            {!isAnswered && question?.showSubmitButton !== false && (
                                                <div className={styles.submitRow} style={{ marginTop: '28px', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => handleSubmit()}
                                                        disabled={userAnswer === null || isSubmitting}
                                                        className={isPreK ? styles.preKSubmitBtn : styles.submitButton}
                                                        style={isPreK ? undefined : {
                                                            ...(question?.submitButtonStyle || {}),
                                                            padding: '16px 36px',
                                                            borderRadius: '20px',
                                                            fontSize: '18px',
                                                            fontWeight: '900',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                                                            border: 'none',
                                                            color: '#ffffff',
                                                            cursor: isSubmitting ? 'not-allowed' : (userAnswer === null ? 'default' : 'pointer'),
                                                            opacity: isSubmitting ? 0.65 : 1,
                                                            transform: userAnswer !== null ? 'scale(1.03)' : 'scale(1)',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {isPreK ? (
                                                            isSubmitting ? 'Checking... 🚀' : '🚀 Check My Answer'
                                                        ) : (
                                                            isSubmitting ? 'Checking... 🎉' : (question?.submitButtonText || "Let's Check! 🌟")
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Centered Parent/Teacher button flows naturally at the bottom */}
                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: isMobile ? '8px' : '16px', marginBottom: '8px' }}>
                                <button
                                    type="button"
                                    onClick={handleOpenTeacherPanel}
                                    className={styles.teacherZoneBtn}
                                    style={{ position: 'static', margin: 0 }}
                                >
                                    🔒 Parent/Teacher Settings
                                </button>
                            </div>

                        </div>
                    </main>
                ) : (
                    <main className={styles.mainGrid}>
                        {/* Left Sidebar */}
                        <aside className={styles.mobileHiddenPanel} style={{ display: 'flex', flexDirection: 'column', gap: '24px', order: isMobile ? 2 : 1 }}>
                            {leftPanel}
                        </aside>

                        {/* Central Question Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', order: isMobile ? 1 : 2 }}>
                            
                            {/* Phase & Progress Card */}
                            <div className={`${styles.panel} ${styles.progressPanel} ${styles.desktopOnlyPanel}`}>
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
                                                        onClick={() => handleSubmit()}
                                                        disabled={userAnswer === null || isSubmitting}
                                                        className={styles.submitButton}
                                                        style={{
                                                            ...(question?.submitButtonStyle || {}),
                                                            cursor: isSubmitting ? 'not-allowed' : (userAnswer === null ? 'default' : 'pointer'),
                                                            opacity: isSubmitting ? 0.65 : 1,
                                                        }}
                                                    >
                                                        {isSubmitting ? 'Verifying...' : (question?.submitButtonText || 'Verify Logic')} {!question?.submitButtonText && !isSubmitting && <span style={{ fontSize: '18px' }}>→</span>}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className={styles.mobileHiddenPanel} style={{ display: 'flex', flexDirection: 'column', gap: '24px', order: 3 }}>
                            
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
                )}
            </div>



            {/* Toggleable Settings Overlay */}
            {showTeacherPanel && (
                <div 
                    className={styles.teacherOverlayModal} 
                    onClick={() => setShowTeacherPanel(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div 
                        className={styles.teacherModalContent} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            type="button" 
                            onClick={() => setShowTeacherPanel(false)}
                            className={styles.teacherModalClose}
                        >
                            &times;
                        </button>
                        
                        <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                            Parent & Teacher Zone
                        </h2>
                        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', fontWeight: '650' }}>
                            Adjust adaptive parameters, manage profiles, or view detailed performance metrics.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase' }}>
                                        Active Settings
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '750', color: '#1e293b' }}>Difficulty Level</span>
                                            <div className={styles.difficultyTabs} style={{ scale: '0.85', transformOrigin: 'right' }}>
                                                {['adaptive', 'easy', 'medium', 'hard'].map((level) => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setDifficulty(level)}
                                                        className={`${styles.difficultyTab} ${difficulty === level ? styles.difficultyTabActive : ''}`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {setAutoSubmit && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '750', color: '#1e293b' }}>Auto Submit MCQ</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAutoSubmit((current) => !current)}
                                                    className={`${styles.autoSubmitToggle} ${autoSubmit ? styles.autoSubmitToggleActive : ''}`}
                                                    style={{ scale: '0.85', transformOrigin: 'right' }}
                                                >
                                                    Auto submit
                                                    <span>{autoSubmit ? 'On' : 'Off'}</span>
                                                </button>
                                            </div>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setShowTeacherPanel(false);
                                                onReset();
                                            }} 
                                            className={styles.resetButton}
                                            style={{ width: '100%', height: '38px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            Reset Session
                                        </button>
                                    </div>
                                </div>
                                {leftPanel}
                            </div>
                            <div>
                                {rightPanel}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isPreK && (
                <>
                    {/* Left Navigation Arrow (Purple Back Arrow) */}
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== 'undefined' && window.history.length > 1) {
                                window.history.back();
                            } else {
                                onReset();
                            }
                        }}
                        className={styles.preKNavArrowLeft}
                        title="Go Back"
                        aria-label="Go Back"
                    >
                        ◀
                    </button>

                    {/* Right Navigation Arrow (Green Forward Arrow - Submit / Next) */}
                    <button
                        type="button"
                        disabled={!isAnswered && (userAnswer === null || isSubmitting || loading)}
                        onClick={() => {
                            if (!isAnswered) {
                                handleSubmit();
                            } else if (onNext) {
                                onNext();
                            }
                        }}
                        className={styles.preKNavArrowRight}
                        title={isAnswered ? "Next Question" : "Submit Answer"}
                        aria-label={isAnswered ? "Next Question" : "Submit Answer"}
                    >
                        ▶
                    </button>
                </>
            )}
        </div>
    );
}
