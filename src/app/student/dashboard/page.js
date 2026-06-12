'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './student.module.css';

export default function StudentDashboardPortal() {
  const [grade, setGrade] = useState('Grade 5'); // Default grade band
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load student stats dynamically
  const fetchStudentData = async (gradeVal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/student?userId=ryan_p&grade=${encodeURIComponent(gradeVal)}`);
      const payload = await res.json();
      
      const defaultData = {
        kpis: {
          smartScore: 1380,
          accuracyPercent: 82,
          practiceMinutes: 45,
          streakDays: 9,
          dailyGoalCompletion: 80,
          learningLevel: 'Active Learner',
          badgesEarned: ['First Step', 'Sound Master', '3-Day Streak']
        },
        recommendations: {
          nextBestSkill: 'Represent Place Value via Blocks',
          recommendedPractice: 'Interactive Math Grid Practice - Level B'
        },
        charts: {
          subjectProgress: [
            { subject: 'Mathematics', completion: 65, accuracy: 82 },
            { subject: 'English', completion: 75, accuracy: 80 },
            { subject: 'Science', completion: 40, accuracy: 70 }
          ]
        }
      };

      if (payload.success) {
        setData(payload);
      } else {
        setData(defaultData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData(grade);
  }, [grade]);

  // Mascot audio trigger simulation (Speech synthesis)
  const triggerAudioGuidance = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Kids friendly speed
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Mascot says: "${text}"`);
    }
  };

  const isEarlyYears = ['Nursery', 'LKG', 'UKG'].includes(grade);

  return (
    <div className={`${styles.studentContainer} ${isEarlyYears ? styles.kinderTheme : ''}`}>
      
      {/* 1. Header Row */}
      <header className={styles.headerRow}>
        <div>
          <h1>
            {isEarlyYears ? '🎈 Welcome to KlassChamp! 🎈' : 'My Student Dashboard'}
          </h1>
        </div>
        <div>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={styles.gradeSelector}>
            <option value="UKG">Early Years (UKG)</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 5">Grade 5 (Default)</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 9">Grade 9</option>
          </select>
        </div>
      </header>

      {loading || !data ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <strong>Opening your learning path...</strong>
        </div>
      ) : (
        <>
          {/* ========================================================
              A. EARLY YEARS VIEW (Nursery, LKG, UKG)
              ======================================================== */}
          {isEarlyYears ? (
            <>
              {/* Mascot Bubble Helper */}
              <section className={styles.mascotPanel}>
                <span className={styles.mascotAvatar}>🦁</span>
                <div className={styles.bubbleChat}>
                  <h3>Leo the Lion says:</h3>
                  <p>
                    "Hello friend! Let's play and count numbers today! Click the big buttons below to start!"
                    <button
                      onClick={() => triggerAudioGuidance("Hello friend! Let's play and count numbers today! Click the big buttons below to start!")}
                      className={styles.btnAudio}
                      title="Listen to mascot instructions"
                    >
                      🔊
                    </button>
                  </p>
                </div>
              </section>

              {/* Large Emojis Action Cards */}
              <div className={styles.kinderGrid}>
                <Link href="/practice?subject=math&topic=math_numbers&skill=skill_phonics_id" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className={styles.kinderCard} style={{ borderLeft: '6px solid var(--color-success)' }}>
                    <div className={styles.kinderCardIcon}>🧮</div>
                    <h4 className={styles.kinderCardTitle}>Number Counting</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Count stars, fruits, and shapes!</p>
                  </div>
                </Link>

                <Link href="/practice?subject=english&topic=eng_phonics&skill=skill_phonics_id" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className={styles.kinderCard} style={{ borderLeft: '6px solid var(--color-primary)' }}>
                    <div className={styles.kinderCardIcon}>🗣️</div>
                    <h4 className={styles.kinderCardTitle}>Phonics Sounds</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Match words starting with identical letters!</p>
                  </div>
                </Link>

                <div className={styles.kinderCard} style={{ borderLeft: '6px solid var(--color-warning)' }} onClick={() => triggerAudioGuidance("Great job! You earned three stars today!")}>
                  <div className={styles.kinderCardIcon}>⭐</div>
                  <h4 className={styles.kinderCardTitle}>My Star Count</h4>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-warning)' }}>
                    {data.kpis.streakDays} Stars Earned!
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ========================================================
                  B. PRIMARY & SECONDARY VIEW (Grades 1–10)
                  ======================================================== */}
              
              {/* Standard KPIs Grid */}
              <div className={styles.standardGrid}>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>SmartScore / XP</span>
                  <span className={styles.kpiValue} style={{ color: 'var(--color-primary)' }}>{data.kpis.smartScore}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level: {data.kpis.learningLevel}</span>
                </div>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>Accuracy Rate</span>
                  <span className={styles.kpiValue} style={{ color: 'var(--color-success)' }}>{data.kpis.accuracyPercent}%</span>
                </div>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>Practice Streak</span>
                  <span className={styles.kpiValue} style={{ color: 'var(--color-warning)' }}>🔥 {data.kpis.streakDays} Days</span>
                </div>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>Practice Minutes</span>
                  <span className={styles.kpiValue}>{data.kpis.practiceMinutes}m</span>
                </div>
              </div>

              {/* Journey paths & Recommendations */}
              <div className={styles.standardGrid} style={{ gridTemplateColumns: '2fr 1fr' }}>
                
                {/* Renders Next skill recommendation */}
                <div className={styles.glassCard} style={{ borderLeft: '4px solid var(--color-success)', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💡 Recommended Practice Skill</h4>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{data.recommendations?.nextBestSkill}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Recommended next step for your math curriculum.
                  </p>
                  
                  <Link href={`/practice?subject=math&topic=math_numbers&skill=skill_placeval_expand`} className={styles.btn} style={{ width: 'fit-content', marginTop: '0.5rem', textDecoration: 'none', textAlign: 'center' }}>
                    🚀 Start Practice
                  </Link>
                </div>

                {/* Badges Earned */}
                <div className={styles.glassCard}>
                  <h4 style={{ margin: '0 0 0.75rem 0', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏆 Unlocked Badges</h4>
                  <div className={styles.badgeShelf}>
                    {data.kpis.badgesEarned?.map((badge, idx) => (
                      <span
                        key={idx}
                        className={styles.badgeIcon}
                        title={badge}
                        onClick={() => triggerAudioGuidance(`You unlocked the ${badge} badge! Good work!`)}
                      >
                        {idx === 0 ? '🦁' : idx === 1 ? '🌟' : '🚀'}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Subject completion bars */}
              <section className={styles.glassCard} style={{ width: '100%' }}>
                <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📂 Subject Performance Overview</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.charts.subjectProgress?.map(sub => (
                    <div key={sub.subject} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span>{sub.subject}</span>
                        <span>{sub.completion}% Completed ({sub.accuracy}% Accuracy)</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${sub.completion}%`,
                            backgroundColor: sub.subject.includes('Math') ? 'var(--color-primary)' : 'var(--color-success)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}

    </div>
  );
}
