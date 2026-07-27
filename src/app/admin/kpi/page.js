'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import styles from './kpi.module.css';
import SyncSkillsButton from '@/components/admin/SyncSkillsButton';
import { SkillTemplateAddedToggle, SkillTestingStatusSelector } from '@/components/admin/SkillStatusToggles';

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

  // Curriculum mapping states
  const [activeSection, setActiveSection] = useState('analytics'); // analytics, curriculum
  const [selectedSubject, setSelectedSubject] = useState('english');
  const [selectedGrade, setSelectedGrade] = useState('ukg');
  const [curriculumData, setCurriculumData] = useState({ coverage: { totalSkills: 0, matchedSkills: 0, percentage: 0 }, skills: [] });
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch curriculum mapping live KPIs
  const fetchCurriculumKpis = useCallback(async () => {
    setLoadingCurriculum(true);
    try {
      const res = await fetch(`/api/admin/kpi/curriculum?subject=${selectedSubject}&grade=${selectedGrade}`);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setCurriculumData(data);
      } else {
        throw new Error(data.error || 'Unable to load curriculum KPIs');
      }
    } catch (err) {
      console.error('Error loading curriculum KPIs:', err);
      setAlert({
        type: 'error',
        text: `Error loading curriculum KPIs: ${err.message}`
      });
    } finally {
      setLoadingCurriculum(false);
    }
  }, [selectedSubject, selectedGrade]);

  // Client-side CSV exporter
  const exportCurriculumCsv = () => {
    const headers = ["Unit", "Chapter", "Skill Code", "Skill Title", "Skill ID", "Template Added", "Template ID", "Interaction Type", "Testing Status"];
    const rows = [
      headers.join(","),
      ...curriculumData.skills.map(row => [
        `"${row.unit.replace(/"/g, '""')}"`,
        `"${row.chapter.replace(/"/g, '""')}"`,
        `"${row.code.replace(/"/g, '""')}"`,
        `"${row.title.replace(/"/g, '""')}"`,
        `"${row.id.replace(/"/g, '""')}"`,
        `"${row.templateAdded ? 'Yes' : 'No'}"`,
        `"${row.templateId}"`,
        `"${row.interactionType}"`,
        `"${row.status}"`
      ].join(","))
    ];
    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `curriculum_kpi_${selectedSubject}_${selectedGrade}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch initial stats & refresh on student filter change
  useEffect(() => {
    fetchStats(selectedStudent);
  }, [selectedStudent, fetchStats]);

  // Fetch curriculum mapping when selected selectors change
  useEffect(() => {
    if (activeSection === 'curriculum') {
      fetchCurriculumKpis();
    }
  }, [activeSection, fetchCurriculumKpis, selectedSubject, selectedGrade]);

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

  // Filtered skills list based on search query
  const filteredSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return curriculumData.skills || [];
    return (curriculumData.skills || []).filter(s => 
      (s.code || '').toLowerCase().includes(query) ||
      (s.title || '').toLowerCase().includes(query) ||
      (s.chapter || '').toLowerCase().includes(query) ||
      (s.templateId || '').toLowerCase().includes(query)
    );
  }, [curriculumData.skills, searchQuery]);

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

      {/* Section/Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveSection('analytics')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeSection === 'analytics' ? 'var(--color-primary)' : 'transparent',
            color: activeSection === 'analytics' ? '#ffffff' : 'var(--color-text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📊 Practice Analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('curriculum')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeSection === 'curriculum' ? 'var(--color-primary)' : 'transparent',
            color: activeSection === 'curriculum' ? '#ffffff' : 'var(--color-text-muted)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📚 Curriculum Coverage Mapping
        </button>
      </div>

      {activeSection === 'analytics' ? (
        <div>
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

            </div>
          </section>

          {/* 📁 Operational Controls & Student Selector */}
          <div className={styles.controlsPanel}>
            <div className={styles.controlGroup}>
              <label htmlFor="student-filter" className={styles.controlLabel}>🎯 Filter by Student profile:</label>
              <select
                id="student-filter"
                className={styles.dropdownSelect}
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={loadingStats && stats.students?.length === 0}
              >
                <option value="all">👥 All Students Combined</option>
                {stats.students?.map((student) => (
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
                      <span className={styles.cardLabel}>Audio Cache Coverage</span>
                      <span className={styles.cardIcon}>🔊</span>
                    </div>
                    <span className={styles.cardValue}>{coveragePercent}%</span>
                    <span className={styles.cardSubtext}>{stats.questionsWithAudio} audio tracks ready</span>
                  </div>

                  <div className={`${styles.metricCard} ${styles.orangeCard}`}>
                    <div className={styles.labelWrapper}>
                      <span className={styles.cardLabel}>Missing Audio Tracks</span>
                      <span className={styles.cardIcon}>⚠️</span>
                    </div>
                    <span className={styles.cardValue}>{stats.missingAudio}</span>
                    <span className={styles.cardSubtext}>Pending TTS rendering</span>
                  </div>

                  <div className={`${styles.metricCard} ${styles.blueCard}`}>
                    <div className={styles.labelWrapper}>
                      <span className={styles.cardLabel}>TTS Cache Stores</span>
                      <span className={styles.cardIcon}>📦</span>
                    </div>
                    <span className={styles.cardValue}>{stats.ttsCacheItems}</span>
                    <span className={styles.cardSubtext}>Active cached sound files</span>
                  </div>

                </div>
              </section>

              {/* Section 2: Student practice KPIs */}
              <section className={styles.sectionBlock}>
                <h3 className={styles.sectionTitle}>Practice KPIs & Analytics</h3>
                <div className={styles.splitLayout}>
                  
                  {/* Topic breakdown donut graph */}
                  <div className={styles.donutPanel}>
                    <h4 className={styles.panelTitle}>📂 Practice breakdown by Topic</h4>
                    
                    {stats.topicBreakdown && stats.topicBreakdown.length > 0 ? (
                      <div className={styles.donutContainer}>
                        <svg className={styles.donutSvg} viewBox="0 0 42 42">
                          <circle className={styles.donutHole} cx="21" cy="21" r="15.91549430918954" fill="transparent" />
                          <circle className={styles.donutRing} cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                          
                          {computedTopics.map((item) => (
                            <circle
                              key={item.topic}
                              className={styles.donutSegment}
                              cx="21"
                              cy="21"
                              r="15.91549430918954"
                              fill="transparent"
                              stroke={item.color}
                              strokeWidth="3.2"
                              strokeDasharray={item.strokeDash}
                              strokeDashoffset={item.strokeOffset}
                            />
                          ))}
                        </svg>
                        
                        <div className={styles.donutLegend}>
                          {computedTopics.map((item) => (
                            <div key={item.topic} className={styles.legendItem}>
                              <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                              <span className={styles.legendLabel} style={{ textTransform: 'capitalize' }}>
                                {item.topic}: <strong>{item.count}</strong> ({item.percent}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        No topic metrics available.
                      </div>
                    )}
                  </div>

                  {/* Friction Points / Struggles Panel */}
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

                {/* Question distributions */}
                <div className={styles.splitLayout} style={{ marginTop: '20px' }}>
                  
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
              </section>

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
      ) : (
        <div>
          {/* CURRICULUM KPI TAB MAPPING AND COVERAGE */}
          
          {/* Control bar */}
          <div className={styles.controlsPanel} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Subject:</label>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="english">🔤 English</option>
                    <option value="math">🔢 Mathematics</option>
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Grade Level:</label>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="prek">Pre-Kindergarten</option>
                    <option value="lkg">LKG</option>
                    <option value="ukg">UKG</option>
                    <option value="grade 1">Grade 1</option>
                    <option value="grade 2">Grade 2</option>
                    <option value="grade 3">Grade 3</option>
                    <option value="grade 4">Grade 4</option>
                    <option value="grade 5">Grade 5</option>
                    <option value="grade 6">Grade 6</option>
                    <option value="grade 7">Grade 7</option>
                    <option value="grade 8">Grade 8</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search skills, chapters, or template IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--color-text-main)',
                    fontSize: '13px',
                    width: '100%',
                    maxWidth: '350px'
                  }}
                />

                <button
                  type="button"
                  onClick={exportCurriculumCsv}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-success)',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📥 Export CSV
                </button>

                <SyncSkillsButton 
                  subject={selectedSubject} 
                  grade={selectedGrade} 
                  onSynced={() => fetchCurriculumKpis()} 
                />
              </div>
            </div>
          </div>

          {/* Curriculum scorecard */}
          <section className={styles.scorecardPanel} style={{ marginBottom: '20px' }}>
            <h3 className={styles.scorecardTitle}>📊 Live Curriculum Mapping Status</h3>
            <div className={styles.scorecardGrid}>
              
              <div className={styles.scorecardItem}>
                <div className={styles.scorecardMeta}>
                  <span className={styles.scorecardLabel}>Total Curriculum Skills</span>
                  <span className={styles.scorecardValueText}>{curriculumData.coverage?.totalSkills || 0}</span>
                </div>
                <div className={styles.scorecardProgress}>
                  <div className={styles.scorecardFill} style={{ width: '100%', backgroundColor: '#3b82f6' }}></div>
                </div>
              </div>

              <div className={styles.scorecardItem}>
                <div className={styles.scorecardMeta}>
                  <span className={styles.scorecardLabel}>Templates Implemented</span>
                  <span className={styles.scorecardValueText}>{curriculumData.coverage?.matchedSkills || 0}</span>
                </div>
                <div className={styles.scorecardProgress}>
                  <div className={styles.scorecardFill} style={{ width: `${curriculumData.coverage?.percentage || 0}%`, backgroundColor: '#10b981' }}></div>
                </div>
              </div>

              <div className={styles.scorecardItem}>
                <div className={styles.scorecardMeta}>
                  <span className={styles.scorecardLabel}>Overall Coverage Rate</span>
                  <span className={styles.scorecardValueText}>{curriculumData.coverage?.percentage || 0}%</span>
                </div>
                <div className={styles.scorecardProgress}>
                  <div className={styles.scorecardFill} style={{ width: `${curriculumData.coverage?.percentage || 0}%`, backgroundColor: '#8b5cf6' }}></div>
                </div>
              </div>

            </div>
          </section>

          {/* Live curriculum table mapping */}
          {loadingCurriculum ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <span>Scanning live curriculum mapping & matching templates...</span>
            </div>
          ) : (
            <section className={styles.fullWidthPanel}>
              <div className={styles.tableHeaderWrapper}>
                <h4>📋 Curriculum Skill coverage: {selectedSubject.toUpperCase()} ({selectedGrade.toUpperCase()})</h4>
                <span className={styles.accuracyHighlight}>
                  {filteredSkills.length} skills listed
                </span>
              </div>

              <div className={styles.tableResponsive}>
                {filteredSkills.length === 0 ? (
                  <div className={styles.emptyState}>
                    No skills matched the filter or subject/grade selection.
                  </div>
                ) : (
                  <table className={styles.kpiTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Code</th>
                        <th>Chapter</th>
                        <th>Skill Title</th>
                        <th style={{ width: '120px' }}>Template Added</th>
                        <th>Template ID</th>
                        <th>Interaction Type</th>
                        <th>Testing Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSkills.map((skill) => (
                        <tr key={skill.id}>
                          <td className={styles.skillCell} style={{ fontSize: '13px', fontWeight: 800 }}>{skill.code}</td>
                          <td style={{ textTransform: 'capitalize' }}>{skill.chapter.replace(/-/g, ' ')}</td>
                          <td style={{ fontWeight: 600 }}>{skill.title}</td>
                          <td>
                            <SkillTemplateAddedToggle skillId={skill.id} initialAdded={skill.templateAdded} />
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-primary)' }}>
                            {skill.templateId}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.8 }}>
                            {skill.interactionType}
                          </td>
                          <td>
                            <SkillTestingStatusSelector skillId={skill.id} initialStatus={skill.status} templateAdded={skill.templateAdded} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
