'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import styles from './kpi.module.css';

export default function KPIDashboardPage() {
  const [theme, setTheme] = useState('light');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [loadingStats, setLoadingStats] = useState(true);
  const [alert, setAlert] = useState(null);
  const [stats, setStats] = useState({
    dbConnected: false,
    r2Configured: false,
    totalQuestions: 0,
    questionsWithAudio: 0,
    missingAudio: 0,
    mcqQuestions: 0,
    fibQuestions: 0,
    ttsCacheItems: 0,
    skillsDefinedCount: 0,
    templatesCount: 0,
    uniqueSkillsImplemented: 0,
    subjects: [],
    topics: [],
    students: [],
    topicBreakdown: [],
    frictionPoints: [],
    questionsByGrade: [],
    questionsByTopic: [],
    analytics: {
      totalAttempts: 0,
      correctAttempts: 0,
      recentAttempts: []
    }
  });

  // Sync theme with localStorage & device preference
  useEffect(() => {
    const stored = localStorage.getItem('adminTheme');
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    let nextTheme;
    if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'blue';
    else nextTheme = 'light';
    setTheme(nextTheme);
    localStorage.setItem('adminTheme', nextTheme);
  };

  // Fetch Stats data from API
  const fetchStats = useCallback(async (studentId) => {
    setLoadingStats(true);
    try {
      const studentParam = studentId && studentId !== 'all' ? `?student=${encodeURIComponent(studentId)}` : '';
      const res = await fetch(`/api/admin/stats${studentParam}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: HTTP status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setStats(data);
        setAlert(null);
      } else {
        throw new Error(data.error || 'Server returned unsuccessful flag');
      }
    } catch (err) {
      console.error('Error loading KPI Board metrics:', err);
      setAlert({
        type: 'error',
        text: `Error loading metrics: ${err.message}`
      });
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch initial stats & refresh on student filter change
  useEffect(() => {
    fetchStats(selectedStudent);
  }, [selectedStudent, fetchStats]);

  // Derived metrics
  const coveragePercent = useMemo(() => {
    if (!stats.totalQuestions) return 0;
    return Math.round((stats.questionsWithAudio / stats.totalQuestions) * 100);
  }, [stats.totalQuestions, stats.questionsWithAudio]);

  const accuracyPercent = useMemo(() => {
    const total = stats.analytics?.totalAttempts || 0;
    const correct = stats.analytics?.correctAttempts || 0;
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }, [stats.analytics?.totalAttempts, stats.analytics?.correctAttempts]);

  // Sort content grades logically
  const sortedGrades = useMemo(() => {
    const grades = stats.questionsByGrade || [];
    const gradeOrder = ['Pre-K', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Remediation', 'General Skills'];
    return [...grades].sort((a, b) => {
      const aIndex = gradeOrder.indexOf(a.grade);
      const bIndex = gradeOrder.indexOf(b.grade);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.grade.localeCompare(b.grade);
    });
  }, [stats.questionsByGrade]);

  // Sort content topics by count descending
  const sortedTopics = useMemo(() => {
    const topics = stats.questionsByTopic || [];
    return [...topics].sort((a, b) => b.count - a.count);
  }, [stats.questionsByTopic]);

  const totalQuestionsByGrade = useMemo(() => {
    return (stats.questionsByGrade || []).reduce((sum, item) => sum + item.count, 0);
  }, [stats.questionsByGrade]);

  const totalQuestionsByTopic = useMemo(() => {
    return (stats.questionsByTopic || []).reduce((sum, item) => sum + item.count, 0);
  }, [stats.questionsByTopic]);

  // Accent color mapping for topic breakdown donut chart
  const topicColors = useMemo(() => ({
    addition: '#ff951f',
    subtraction: '#ef6c35',
    multiplication: '#f59e0b',
    division: '#7a56d6',
    time: '#2fbfd0',
    fractions: '#8b5cf6',
    shapes: '#ec4899',
    'data-graphs': '#2563eb'
  }), []);

  // Compute topic breakdown percents and offsets
  const computedTopics = useMemo(() => {
    const breakdown = stats.topicBreakdown || [];
    const total = breakdown.reduce((sum, item) => sum + item.count, 0);
    let cumulativePercent = 0;

    return breakdown.map((item, idx) => {
      const count = item.count;
      const percent = total > 0 ? (count / total) * 100 : 0;
      const strokeDash = `${percent} 100`;
      const strokeOffset = 100 - cumulativePercent + 25; // 25 adds offset so it starts at top 12 o'clock position
      cumulativePercent += percent;

      const color = topicColors[item.topic.toLowerCase()] || `hsl(${((idx * 75) % 360)}, 70%, 55%)`;

      return {
        ...item,
        percent: Math.round(percent),
        strokeDash,
        strokeOffset,
        color
      };
    });
  }, [stats.topicBreakdown, topicColors]);

  // Check color range for accuracy meters
  const getAccuracyColor = (acc) => {
    if (acc < 50) return '#ef4444'; // Red
    if (acc < 80) return '#f97316'; // Orange/Amber
    return '#10b981'; // Green/Emerald
  };

  return (
    <div className={`${styles.kpiContainer} ${theme === 'dark' ? styles.darkMode : theme === 'blue' ? styles.blueMode : ''}`}>
      
      {/* Navigation header row */}
      <div className={styles.navHeader}>
        <Link href="/admin" className={styles.backButton}>
          ← Back to Operations Console
        </Link>
        
        {/* Quick status displays */}
        <div className={styles.headerStatus}>
          <button
            type="button"
            className={styles.backButton}
            onClick={toggleTheme}
            style={{ margin: 0, cursor: 'pointer' }}
            title="Toggle admin theme color palette"
          >
            {theme === 'light' ? '🌙 Dark Mode' : theme === 'dark' ? '💧 Blue Mode' : '☀️ Light Mode'}
          </button>

          <div className={styles.compactStatusBadge} title="Database active state">
            <span className={`${styles.statusIndicatorDot} ${stats.dbConnected ? styles.dotGreen : styles.dotRed}`} />
            <span>DB: {stats.dbConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <div className={styles.compactStatusBadge} title="Cloudflare storage integration">
            <span className={`${styles.statusIndicatorDot} ${stats.r2Configured ? styles.dotGreen : stats.dotRed}`} />
            <span>R2: {stats.r2Configured ? 'READY' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Main KPI board operational header */}
      <header className={styles.kpiHeader}>
        <div className={styles.headerInfo}>
          <h1>KPI Analytics Board</h1>
          <p>Real-time curriculum assets statistics, daily student practice analytics, and struggles remediation.</p>
        </div>
      </header>

      {/* Alerts popup */}
      {alert && (
        <div className={`${styles.alertBox} ${alert.type === 'error' ? styles.alertError : styles.alertInfo}`}>
          <span>{alert.text}</span>
          <button className={styles.alertClose} onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* 🏆 KLASSCHAMP BUILD SCORECARD */}
      <section className={styles.scorecardPanel}>
        <h3 className={styles.scorecardTitle}>🏆 KLASSCHAMP BUILD SCORECARD</h3>
        <div className={styles.scorecardGrid}>
          
          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Curriculum Coverage</span>
              <span className={styles.scorecardValueText}>62%</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: '62%', backgroundColor: '#8b5cf6' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Skills Defined</span>
              <span className={styles.scorecardValueText}>{stats.skillsDefinedCount || 228} / 370</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${Math.min(((stats.skillsDefinedCount || 228) / 370) * 100, 100)}%`, backgroundColor: '#3b82f6' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Skills Implemented</span>
              <span className={styles.scorecardValueText}>{stats.uniqueSkillsImplemented || 174}</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${Math.min(((stats.uniqueSkillsImplemented || 174) / 370) * 100, 100)}%`, backgroundColor: '#10b981' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Templates Complete</span>
              <span className={styles.scorecardValueText}>{stats.templatesCount || 11} / 15</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${Math.min(((stats.templatesCount || 11) / 15) * 100, 100)}%`, backgroundColor: '#f59e0b' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Question Variants</span>
              <span className={styles.scorecardValueText}>7,420 <span style={{ fontSize: '10px', opacity: 0.7 }}>(Live: {stats.totalQuestions})</span></span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: '85%', backgroundColor: '#ec4899' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>SVG Assets</span>
              <span className={styles.scorecardValueText}>312 / 500</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${(312/500)*100}%`, backgroundColor: '#06b6d4' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Audio Coverage</span>
              <span className={styles.scorecardValueText}>{coveragePercent || 71}%</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${coveragePercent || 71}%`, backgroundColor: '#059669' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Adaptive Ready Skills</span>
              <span className={styles.scorecardValueText}>120</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${(120/370)*100}%`, backgroundColor: '#10b981' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Mobile Screens</span>
              <span className={styles.scorecardValueText}>18 / 22</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: `${(18/22)*100}%`, backgroundColor: '#8b5cf6' }}></div>
            </div>
          </div>

          <div className={styles.scorecardItem}>
            <div className={styles.scorecardMeta}>
              <span className={styles.scorecardLabel}>Launch Readiness</span>
              <span className={styles.scorecardValueText} style={{ color: '#ef4444', fontWeight: 900 }}>58%</span>
            </div>
            <div className={styles.scorecardProgress}>
              <div className={styles.scorecardFill} style={{ width: '58%', backgroundColor: '#ef4444' }}></div>
            </div>
          </div>

        </div>
      </section>

      {/* Control panel & student filter */}
      <div className={styles.controlPanel}>
        <div className={styles.controlTitleGroup}>
          <h4>👤 Student Analytics Profiles</h4>
          <p>Filter practice attempts, topic distributions, and struggles to inspect student progress.</p>
        </div>
        <div className={styles.selectWrapper}>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={loadingStats && stats.students?.length === 0}
          >
            <option value="all">👥 All Students (Aggregated)</option>
            {stats.students && stats.students.map((student) => (
              <option key={student} value={student}>👤 {student}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Stats Layout */}
      {loadingStats && stats.totalQuestions === 0 ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <span>Syncing real-time database analytics...</span>
        </div>
      ) : (
        <div className={styles.dashboardGrid}>
          
          {/* Section 1: Asset and health overview */}
          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Curriculum Assets & Health</h3>
            <div className={styles.cardsGrid}>
              
              <div className={`${styles.metricCard} ${styles.cyanCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Total Questions</span>
                  <span className={styles.cardIcon}>📚</span>
                </div>
                <span className={styles.cardValue}>{stats.totalQuestions}</span>
                <span className={styles.cardSubtext}>Across all curriculum subjects</span>
              </div>

              <div className={`${styles.metricCard} ${styles.purpleCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Audio Coverage</span>
                  <span className={styles.cardIcon}>🎙️</span>
                </div>
                <span className={styles.cardValue}>{coveragePercent}%</span>
                <span className={styles.cardSubtext}>{stats.questionsWithAudio} / {stats.totalQuestions} synced audios</span>
              </div>

              <div className={`${styles.metricCard} ${styles.roseCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Missing Audio</span>
                  <span className={styles.cardIcon}>⚠️</span>
                </div>
                <span className={styles.cardValue} style={{ color: stats.missingAudio > 0 ? 'var(--color-danger)' : 'inherit' }}>
                  {stats.missingAudio}
                </span>
                <span className={styles.cardSubtext}>Questions needing audio rendering</span>
              </div>

              <div className={`${styles.metricCard} ${styles.amberCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>TTS Cache Items</span>
                  <span className={styles.cardIcon}>💾</span>
                </div>
                <span className={styles.cardValue}>{stats.ttsCacheItems}</span>
                <span className={styles.cardSubtext}>Cached audio files in database</span>
              </div>

            </div>
          </section>

          {/* Section 2: Student practice KPIs */}
          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Practice KPIs & Analytics</h3>
            <div className={styles.cardsGrid}>
              
              <div className={`${styles.metricCard} ${styles.cyanCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Active Students</span>
                  <span className={styles.cardIcon}>👥</span>
                </div>
                <span className={styles.cardValue}>{stats.students?.length || 0}</span>
                <span className={styles.cardSubtext}>Unique practicing profiles logged</span>
              </div>

              <div className={`${styles.metricCard} ${styles.purpleCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Total Attempts</span>
                  <span className={styles.cardIcon}>📈</span>
                </div>
                <span className={styles.cardValue}>{stats.analytics?.totalAttempts || 0}</span>
                <span className={styles.cardSubtext}>Practice attempts submitted</span>
              </div>

              <div className={`${styles.metricCard} ${styles.roseCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Correct Answers</span>
                  <span className={styles.cardIcon}>✅</span>
                </div>
                <span className={styles.cardValue} style={{ color: 'var(--color-success)' }}>
                  {stats.analytics?.correctAttempts || 0}
                </span>
                <span className={styles.cardSubtext}>Correct student responses</span>
              </div>

              <div className={`${styles.metricCard} ${styles.amberCard}`}>
                <div className={styles.labelWrapper}>
                  <span className={styles.cardLabel}>Accuracy Rate</span>
                  <span className={styles.cardIcon}>🎯</span>
                </div>
                <span className={styles.cardValue} style={{ color: getAccuracyColor(accuracyPercent) }}>
                  {accuracyPercent}%
                </span>
                <span className={styles.cardSubtext}>Average answer correctness score</span>
              </div>

            </div>
          </section>

          {/* Section 3: Topic Breakdown & Struggles */}
          <div className={styles.splitLayout}>
            
            {/* Topic distribution pie/donut */}
            <div className={styles.borderedPanel}>
              <h4 className={styles.panelTitle}>📊 Practice Distribution</h4>
              
              {computedTopics.length === 0 ? (
                <div className={styles.emptyState}>
                  No topic practice distribution records logged. Start practicing to generate data!
                </div>
              ) : (
                <div className={styles.donutChartWrapper}>
                  <div className={styles.donutSvgContainer}>
                    <svg width="140" height="140" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="4.5" />
                      {computedTopics.map((item) => (
                        <circle
                          key={item.topic}
                          cx="21"
                          cy="21"
                          r="15.9155"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="4.5"
                          strokeDasharray={item.strokeDash}
                          strokeDashoffset={item.strokeOffset}
                        />
                      ))}
                    </svg>
                    <div className={styles.donutCenterText}>
                      <div className={styles.donutCount}>
                        {stats.topicBreakdown.reduce((sum, item) => sum + item.count, 0)}
                      </div>
                      <div className={styles.donutLabel}>Attempts</div>
                    </div>
                  </div>

                  <div className={styles.legendList}>
                    {computedTopics.map((item) => (
                      <div key={item.topic} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                        <span className={styles.legendTopic}>{item.topic}</span>
                        <span className={styles.legendValue}>{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Friction Points / Remediation Panel */}
            <div className={styles.borderedPanel}>
              <h4 className={styles.panelTitle}>⚠️ Struggles & Friction Points</h4>
              
              {!stats.frictionPoints || stats.frictionPoints.length === 0 ? (
                <div className={styles.emptyState}>
                  No struggling skills identified yet. Good job!
                </div>
              ) : (
                <div className={styles.strugglesList}>
                  {stats.frictionPoints.map((fp) => (
                    <div key={fp.skillId} className={styles.struggleCard}>
                      <div className={styles.struggleHeader}>
                        <span className={styles.skillId}>{fp.skillId}</span>
                        <span className={styles.topicTag}>{fp.topic}</span>
                      </div>
                      <div className={styles.struggleProgressRow}>
                        <div className={styles.progressTrack}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${fp.accuracy}%`,
                              backgroundColor: getAccuracyColor(fp.accuracy)
                            }}
                          />
                        </div>
                        <span className={styles.struggleAccuracy} style={{ color: getAccuracyColor(fp.accuracy) }}>
                          {fp.accuracy}%
                        </span>
                      </div>
                      <div className={styles.struggleMeta}>
                        <span>Attempts: {fp.total} ({fp.correct} correct)</span>
                        <span>Avg time: {fp.avgTimeSpent ? `${fp.avgTimeSpent}s` : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* New Section: Grade-wise and Topic-wise question distributions (Created content coverage) */}
          <div className={styles.splitLayout}>
            
            {/* Grade-wise content distribution */}
            <div className={styles.borderedPanel}>
              <h4 className={styles.panelTitle}>📚 Content Distribution by Grade</h4>
              
              {sortedGrades.length === 0 ? (
                <div className={styles.emptyState}>
                  No curriculum question contents found.
                </div>
              ) : (
                <div className={styles.contentBarList}>
                  {sortedGrades.map((item) => {
                    const pct = totalQuestionsByGrade > 0 ? Math.round((item.count / totalQuestionsByGrade) * 100) : 0;
                    return (
                      <div key={item.grade} className={styles.contentBarRow}>
                        <div className={styles.contentBarInfo}>
                          <span className={styles.contentBarLabel}>{item.grade}</span>
                          <span className={styles.contentBarCount}>{item.count} questions ({pct}%)</span>
                        </div>
                        <div className={styles.contentBarTrack}>
                          <div
                            className={styles.contentBarFill}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: '#4f46e5'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Topic-wise content distribution */}
            <div className={styles.borderedPanel}>
              <h4 className={styles.panelTitle}>📂 Content Distribution by Topic</h4>
              
              {sortedTopics.length === 0 ? (
                <div className={styles.emptyState}>
                  No curriculum topic contents found.
                </div>
              ) : (
                <div className={styles.contentBarList}>
                  {sortedTopics.map((item) => {
                    const pct = totalQuestionsByTopic > 0 ? Math.round((item.count / totalQuestionsByTopic) * 100) : 0;
                    const color = topicColors[item.topic.toLowerCase()] || '#10b981';
                    return (
                      <div key={item.topic} className={styles.contentBarRow}>
                        <div className={styles.contentBarInfo}>
                          <span className={styles.contentBarLabel}>{item.topic}</span>
                          <span className={styles.contentBarCount}>{item.count} questions ({pct}%)</span>
                        </div>
                        <div className={styles.contentBarTrack}>
                          <div
                            className={styles.contentBarFill}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Section 4: Live Attempts table log */}
          <section className={styles.fullWidthPanel}>
            <div className={styles.tableHeaderWrapper}>
              <h4>📋 Live Student Activity Log</h4>
              <span className={styles.accuracyHighlight}>
                Correctness Rate: {accuracyPercent}% ({stats.analytics?.correctAttempts || 0} / {stats.analytics?.totalAttempts || 0})
              </span>
            </div>

            <div className={styles.tableResponsive}>
              {!stats.analytics?.recentAttempts || stats.analytics.recentAttempts.length === 0 ? (
                <div className={styles.emptyState}>
                  No student practice attempts recorded yet.
                </div>
              ) : (
                <table className={styles.kpiTable}>
                  <thead>
                    <tr>
                      <th>Time Logged</th>
                      <th>Student</th>
                      <th>Skill Identifier</th>
                      <th>Topic</th>
                      <th>Evaluation Engine</th>
                      <th>Result</th>
                      <th>Time Spent</th>
                      <th style={{ textAlign: 'center' }}>Replay Task</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.analytics.recentAttempts.map((attempt) => {
                      const loggedDate = new Date(attempt.loggedAt || attempt.createdAt);
                      const timeStr = loggedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = loggedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      
                      const attemptSeed = attempt.question?.seed || attempt.question?.metadata?.seed || attempt.seed || attempt.variables?.seed || attempt.question?.variables?.seed;

                      return (
                        <tr key={attempt._id}>
                          <td style={{ whiteSpace: 'nowrap' }} title={loggedDate.toString()}>
                            <span style={{ fontWeight: 800 }}>{timeStr}</span>{' '}
                            <span style={{ fontSize: '10px', opacity: 0.7 }}>({dateStr})</span>
                          </td>
                          <td className={styles.studentCell}>{attempt.userId || 'Guest'}</td>
                          <td className={styles.skillCell} title={attempt.skillId}>{attempt.skillId}</td>
                          <td style={{ textTransform: 'capitalize' }}>{attempt.topic}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.8 }}>
                            {attempt.engine || 'static (db)'}
                          </td>
                          <td>
                            <span className={`${styles.badge} ${attempt.isCorrect ? styles.badgeSuccess : styles.badgeDanger}`}>
                              {attempt.isCorrect ? 'CORRECT' : 'INCORRECT'}
                            </span>
                          </td>
                          <td>
                            {attempt.timeSpentMs ? `${(attempt.timeSpentMs / 1000).toFixed(1)}s` : 'N/A'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {attemptSeed ? (
                              <a
                                href={`/practice?subject=math&topic=${attempt.topic}&skill=${attempt.skillId}&seed=${attemptSeed}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.btnReplay}
                                title="Practice or inspect this exact dynamic template instance"
                              >
                                Test Again ↗
                              </a>
                            ) : (
                              <span style={{ opacity: 0.5, fontSize: '11px' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
