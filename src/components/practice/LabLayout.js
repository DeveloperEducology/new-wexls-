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
    onClear,
    practiceLevel = 1,
    levelStreak = 0,
    isSubmitting = false,
    isPreK = false,
    isCorrect = false,
    onNext = null,
    subject = '',
    activeStudent = 'Alex'
}) {
    const [isMobile, setIsMobile] = useState(false);
    const [showTeacherPanel, setShowTeacherPanel] = useState(false);
    const [isLearningPathOpen, setIsLearningPathOpen] = useState(true);

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

    const isLocationWords = String(question?.id || '').includes('loc_position') || String(question?.id || '').includes('loc_next_beside');
    const resolvedBackgroundUrl = question?.backgroundImage || question?.backgroundUrl;
    const isHotspotQuestion = question?.interaction === 'hotspot_select' || question?.layoutMode === 'mcq_hotspot' || isLocationWords;
    const pageStyle = isPreK ? (
        (resolvedBackgroundUrl && !isHotspotQuestion)
            ? { backgroundImage: `url(${resolvedBackgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center center' }
            : {}
    ) : {};

    return (
        <div className={isPreK ? styles.preKPageContainer : styles.pageContainer} style={pageStyle}>
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
                        {/* 1. Score/Level Pill */}
                        <div className={styles.preKHeaderPill} onClick={onReset} style={{ cursor: 'pointer' }} title="Restart Session">
                            <span className={styles.preKPillIcon}>⭐</span>
                            <span className={styles.preKPillValue} style={{ fontSize: '18px', fontWeight: '950' }}>{smartScore}</span>
                        </div>

                        {/* 2. Streak Pill */}
                        <div className={styles.preKHeaderPill}>
                            <span className={styles.preKPillIcon}>🔥</span>
                            <div className={styles.preKPillText}>
                                <span className={styles.preKPillValue}>{levelStreak}</span>
                                <span className={styles.preKPillLabel}>STREAK</span>
                            </div>
                        </div>

                        {/* 3. Stars Pill */}
                        <div className={styles.preKHeaderPill}>
                            <span className={styles.preKPillIcon}>⭐</span>
                            <div className={styles.preKPillText}>
                                <span className={styles.preKPillValue}>{smartScore}</span>
                                <span className={styles.preKPillLabel}>STARS</span>
                            </div>
                        </div>

                        {/* 4. Parent settings lock button */}
                        <button
                            type="button"
                            onClick={handleOpenTeacherPanel}
                            className={styles.preKLockBtn}
                            title="Parent/Teacher Settings"
                            aria-label="Parent/Teacher Settings"
                        >
                            🔒
                        </button>
                    </header>
                ) : (
                    <header className={styles.wexlsHeader}>
                        <div className={styles.wexlsHeaderLeft}>
                            <button
                                type="button"
                                className={styles.wexlsMenuButton}
                                aria-label={isLearningPathOpen ? 'Hide learning path' : 'Show learning path'}
                                aria-expanded={isLearningPathOpen}
                                onClick={() => setIsLearningPathOpen((current) => !current)}
                            >
                                <span />
                                <span />
                                <span />
                            </button>
                            <div className={styles.wexlsLogo}>
                                <span className={styles.wexlsLogoAccent}>K</span>lassChamp
                            </div>
                            <div className={styles.subjectDropdownPill}>
                                <span>{subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : 'Practice'}</span>
                                <span aria-hidden="true">⌄</span>
                            </div>
                        </div>

                        <div className={styles.wexlsHeaderPills}>
                            <div className={styles.wexlsHeaderPill}>
                                <span className={styles.wexlsPillIcon}>🔥</span>
                                <div className={styles.wexlsPillText}>
                                    <span className={styles.wexlsPillLabel}>7 DAY STREAK</span>
                                    <span className={styles.wexlsPillValue}>{levelStreak}</span>
                                </div>
                            </div>
                            <div className={styles.wexlsHeaderPill}>
                                <span className={styles.wexlsPillIcon}>⭐</span>
                                <div className={styles.wexlsPillText}>
                                    <span className={styles.wexlsPillLabel}>XP</span>
                                    <span className={styles.wexlsPillValue}>{smartScore * 10}</span>
                                </div>
                            </div>
                            <div className={styles.wexlsHeaderPill}>
                                <span className={styles.wexlsPillIcon}>🏆</span>
                                <div className={styles.wexlsPillText}>
                                    <span className={styles.wexlsPillLabel}>LEVEL</span>
                                    <span className={styles.wexlsPillValue}>Bronze {practiceLevel}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.wexlsHeaderRight}>
                            <div className={styles.wexlsLives}>
                                <span>❤️</span>
                                <strong>3</strong>
                                <small>Lives</small>
                            </div>
                            <div className={styles.wexlsNotificationBell} aria-label="Notifications">
                                🔔
                                <span className={styles.wexlsNotificationDot} />
                            </div>
                            <div className={styles.wexlsAvatarBlock}>
                                <div className={styles.wexlsAvatarFrame}>🧑</div>
                                <div className={styles.wexlsAvatarInfo}>
                                    <span className={styles.wexlsAvatarName}>{activeStudent}</span>
                                    <span className={styles.wexlsAvatarGrade}>Level {practiceLevel}</span>
                                </div>
                                <span className={styles.wexlsAvatarChevron}>⌄</span>
                            </div>
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
                                            
                                            {/* Note: Check button is rendered in the unified bottom bar for Pre-K */}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Note: Parent/TeacherSettings button is rendered in the header for Pre-K */}
                        </div>
                    </main>
                ) : (
                    <main className={`${styles.mainGrid} ${!isLearningPathOpen ? styles.mainGridLearningPathClosed : ''}`}>
                        {/* Left Sidebar */}
                        <aside className={`${styles.mobileHiddenPanel} ${styles.standardLeftRail} ${!isLearningPathOpen ? styles.learningPathClosed : ''}`} style={{ order: isMobile ? 2 : 1 }}>
                            {leftPanel}
                        </aside>

                        {/* Central Question Card */}
                        <div className={styles.workspaceColumn} style={{ order: isMobile ? 1 : 2 }}>
                            
                            <div className={styles.practiceTopicBar}>
                                <div className={styles.practiceTopicIdentity}>
                                    <div className={styles.practiceTopicIcon}>
                                        {subject === 'science' ? '🧪' : subject === 'english' ? '📖' : '▦'}
                                    </div>
                                    <div>
                                        <p className={styles.practiceTopicBreadcrumb}>{title}</p>
                                    </div>
                                </div>
                                <div className={styles.practiceModeTabs} aria-label="Practice mode">
                                    <span className={styles.practiceModeTabActive}>▣ Guided</span>
                                    <span className={styles.practiceModeTab}>▣ Practice</span>
                                    <span className={styles.practiceModeTab}>☆ Challenge</span>
                                    <span className={styles.practiceModeTab}>☆ Mastery</span>
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
                                                        {isSubmitting ? 'Checking...' : (question?.submitButtonText || 'Check Answer')} {!question?.submitButtonText && !isSubmitting && <span style={{ fontSize: '18px' }}>✓</span>}
                                                    </button>
                                                    <button type="button" onClick={onClear || onReset} className={styles.clearButton}>
                                                        ↻ Clear
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className={styles.practiceSupportRow}>
                                <button type="button" className={styles.practiceSupportButton}>
                                    <span>💡</span>
                                    <span><strong>Hint</strong><small>Get a small hint</small></span>
                                </button>
                                <button type="button" className={styles.practiceSupportButton}>
                                    <span>📋</span>
                                    <span><strong>Step-by-Step</strong><small>Show solution steps</small></span>
                                </button>
                                <button type="button" className={styles.practiceSupportButton}>
                                    <span>💬</span>
                                    <span><strong>Explain</strong><small>Get concept explanation</small></span>
                                </button>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <aside className={`${styles.mobileHiddenPanel} ${styles.standardRightRail}`} style={{ order: 3 }}>
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
                <div className={styles.preKBottomBar}>
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
                        className={styles.preKBottomArrowBtn}
                        title="Go Back"
                        aria-label="Go Back"
                    >
                        ◀
                    </button>

                    {/* Center Check/Next Button (Orange Capsule Button) */}
                    {!isAnswered ? (
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={userAnswer === null || isSubmitting || loading}
                            className={styles.preKSubmitBtn}
                        >
                            <span>🚀 Check My Answer</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onNext && onNext()}
                            className={styles.preKSubmitBtn}
                        >
                            <span>🚀 Next Question</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
