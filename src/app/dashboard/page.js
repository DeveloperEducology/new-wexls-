'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';

export default function ShowcaseDashboard({ roleLock = null, hideSwitcher = false }) {
  // Demo states
  const [activeRole, setActiveRole] = useState(roleLock || 'student');
  const [activeGrade, setActiveGrade] = useState('Grade 5');
  const [activeTheme, setActiveTheme] = useState('light');
  const [isDemoMode, setIsDemoMode] = useState(!hideSwitcher);
  
  // Real / Mock data states
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);
  const [featureFlags, setFeatureFlags] = useState({
    adaptiveLearning: true,
    aiInsights: true,
    teacherHeatmaps: true,
    advancedReports: true,
    parentRecommendations: true
  });
  
  // Active statistics state
  const [data, setData] = useState(null);

  // User Creation form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserSchool, setNewUserSchool] = useState('');
  const [newUserClass, setNewUserClass] = useState('');
  const [newUserParent, setNewUserParent] = useState('');
  const [creationStatus, setCreationStatus] = useState(null);
  const [createdUsers, setCreatedUsers] = useState([]);

  const loadUsersList = async () => {
    try {
      const res = await fetch('/api/admin/users?includeArchived=true');
      const payload = await res.json();
      if (payload.success) {
        setCreatedUsers(payload.users || []);
      }
    } catch (e) {
      console.error("Failed to load users list:", e);
    }
  };

  useEffect(() => {
    if (activeRole === 'admin') {
      loadUsersList();
    }
  }, [activeRole]);

  const handleArchiveUser = async (userId) => {
    try {
      const res = await fetch('/api/admin/users/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const resData = await res.json();
      if (resData.success) {
        loadUsersList();
        loadStats(activeRole, activeGrade);
      } else {
        alert(resData.error || 'Failed to archive user');
      }
    } catch (err) {
      alert('Archive operation failed');
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      const res = await fetch('/api/admin/users/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const resData = await res.json();
      if (resData.success) {
        loadUsersList();
        loadStats(activeRole, activeGrade);
      } else {
        alert(resData.error || 'Failed to restore user');
      }
    } catch (err) {
      alert('Restore operation failed');
    }
  };

  // Dynamic theme switching
  useEffect(() => {
    const root = document.getElementById('dashboard-root');
    if (root) {
      root.className = `${styles.dashboardContainer} ${
        activeTheme === 'dark' ? styles.darkMode : activeTheme === 'blue' ? styles.blueMode : ''
      }`;
    }
  }, [activeTheme]);

  // Load stats and feature flags
  const loadStats = async (role, grade) => {
    setLoading(true);
    try {
      // Fetch feature flags first
      const flagRes = await fetch('/api/dashboard/features');
      const flagData = await flagRes.json();
      if (flagData.success) {
        setFeatureFlags(flagData.flags);
      }

      // Fetch role analytics
      const apiRole = role === 'school-admin' ? 'school' : role;
      const res = await fetch(`/api/dashboard/${apiRole}?grade=${encodeURIComponent(grade)}`);
      const payload = await res.json();
      if (payload.success) {
        setData(payload);
      }
    } catch (e) {
      console.error("Failed to load dashboard metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(activeRole, activeGrade);
  }, [activeRole, activeGrade]);

  // Seeding trigger
  const runSeedData = async () => {
    setSeedStatus('seeding');
    try {
      const res = await fetch('/api/dashboard/demo-seed', { method: 'POST' });
      const payload = await res.json();
      if (payload.success) {
        setSeedStatus('success');
        loadStats(activeRole, activeGrade);
      } else {
        setSeedStatus('error');
      }
    } catch (e) {
      setSeedStatus('error');
    }
    setTimeout(() => setSeedStatus(null), 3000);
  };

  // User Creation submit handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreationStatus('creating');
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newUserRole,
          name: newUserName,
          email: newUserEmail,
          username: newUserUsername,
          pin: newUserPin,
          mobile: newUserMobile,
          schoolId: newUserSchool,
          classId: newUserClass,
          parentId: newUserParent
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setCreationStatus('success');
        // Clear fields
        setNewUserName('');
        setNewUserEmail('');
        setNewUserUsername('');
        setNewUserPin('');
        setNewUserMobile('');
        setNewUserSchool('');
        setNewUserClass('');
        setNewUserParent('');
        loadUsersList();
        loadStats(activeRole, activeGrade);
      } else {
        setCreationStatus(`error: ${resData.error || 'Server error'}`);
      }
    } catch (err) {
      setCreationStatus('error: Connection failed');
    }
    setTimeout(() => setCreationStatus(null), 4000);
  };

  // Export report modal helper
  const handleExport = (type) => {
    alert(`Generating ${type.toUpperCase()} file export stream...\nSelected Role: ${activeRole.toUpperCase()}\nGrade Range: ${activeGrade}`);
  };

  // Render Custom SVG Radar Chart
  const renderRadarChart = (radarData = []) => {
    const size = 220;
    const center = size / 2;
    const r = size * 0.35;
    const total = radarData.length || 5;
    
    const points = radarData.map((d, idx) => {
      const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
      const val = d.value || 50;
      const factor = val / 100;
      return {
        x: center + r * factor * Math.cos(angle),
        y: center + r * factor * Math.sin(angle),
        label: d.subject || d.label || ''
      };
    });

    const webCircles = [0.25, 0.5, 0.75, 1].map((f, i) => (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={r * f}
        fill="none"
        stroke="var(--border-color)"
        strokeDasharray={i === 3 ? "none" : "3,3"}
      />
    ));

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {webCircles}
        {/* Draw Web lines */}
        {points.map((p, idx) => {
          const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
          const endX = center + r * Math.cos(angle);
          const endY = center + r * Math.sin(angle);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="var(--border-color)"
            />
          );
        })}
        {/* Fill shape */}
        {polygonPoints && (
          <polygon
            points={polygonPoints}
            fill="var(--color-primary-glow)"
            stroke="var(--color-primary)"
            strokeWidth="2"
          />
        )}
        {/* Label labels */}
        {points.map((p, idx) => {
          const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
          const labelDist = r * 1.25;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);
          return (
            <text
              key={idx}
              x={lx}
              y={ly + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--text-secondary)"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    );
  };

  // Color helper for Heatmaps
  const getHeatmapColor = (score) => {
    if (score >= 85) return 'var(--color-success)'; // Emerald green
    if (score >= 70) return 'var(--color-primary)'; // Indigo
    if (score >= 50) return 'var(--color-warning)'; // Orange/Amber
    return 'var(--color-danger)'; // Red
  };

  return (
    <div id="dashboard-root" className={styles.dashboardContainer}>
      
      {/* 1. PUBLIC DEMO ACCESS CONTROLS */}
      {isDemoMode && (
        <div className={styles.mainWrapper} style={{ paddingBottom: 0 }}>
          <div className={styles.showcaseBar}>
            <div className={styles.showcaseTitle}>
              <span>🏆 KlassChamp Showcase Console</span>
            </div>
            
            <div className={styles.showcaseControls}>
              <div className={styles.selectorWrapper}>
                <label>Active Role:</label>
                <select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="student">Student Dashboard</option>
                  <option value="parent">Parent Dashboard</option>
                  <option value="teacher">Teacher Dashboard</option>
                  <option value="school-admin">School Admin</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>

              <div className={styles.selectorWrapper}>
                <label>Grade Level:</label>
                <select
                  value={activeGrade}
                  onChange={(e) => setActiveGrade(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 5">Grade 5 (Math/Frac)</option>
                  <option value="Grade 7">Grade 7 (Science)</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                </select>
              </div>

              <button
                onClick={runSeedData}
                disabled={seedStatus === 'seeding'}
                className={styles.btnAction}
              >
                {seedStatus === 'seeding' ? '🔄 Seeding DB...' : seedStatus === 'success' ? '✅ Seeded!' : '⚡ Seed Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN DASHBOARD CONTENT ROUTE */}
      <main className={styles.mainWrapper}>
        
        {/* Header Block with theme toggles */}
        <div className={styles.headerRow}>
          <div className={styles.headerInfo}>
            <h1>
              {activeRole === 'student' && 'My Learning Journey'}
              {activeRole === 'parent' && 'Parent Progress Summary'}
              {activeRole === 'teacher' && 'Teacher Class Overview'}
              {activeRole === 'school-admin' && 'School Analytics Console'}
              {activeRole === 'admin' && 'KlassChamp Platform Operations'}
            </h1>
            <p>Grade level target: {activeGrade} | Curriculum standard mappings active</p>
          </div>

          <div className={styles.themeSelector}>
            <button onClick={() => setActiveTheme('light')} className={styles.btnTheme} title="Light Theme">☀️</button>
            <button onClick={() => setActiveTheme('dark')} className={styles.btnTheme} title="Dark Theme">🌙</button>
            <button onClick={() => setActiveTheme('blue')} className={styles.btnTheme} title="Blue Theme">💧</button>
          </div>
        </div>

        {/* LOADING ANIMATION */}
        {loading || !data ? (
          <div className={styles.glassPanel} style={{ textAlign: 'center', padding: '4rem 0' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Calculating real-time KPIs and aggregations...
            </span>
          </div>
        ) : (
          <>
            {/* 3. ALERTS / ACTIVE NOTIFICATIONS BAR */}
            {data.alerts && data.alerts.length > 0 && (
              <section className={styles.alertsGrid} aria-label="System Alerts">
                {data.alerts.map(a => (
                  <div
                    key={a.id}
                    className={`${styles.alertCard} ${
                      a.type.includes('Regression') || a.type.includes('Accuracy')
                        ? styles.alertDanger
                        : a.type.includes('Goal')
                          ? styles.alertWarning
                          : styles.alertInfo
                    }`}
                  >
                    <div className={styles.alertLeft}>
                      <span className={styles.alertIcon}>⚠️</span>
                      <span><strong>{a.type}</strong>: {a.message}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* ========================================================
                ROLE-SPECIFIC LAYOUTS
                ======================================================== */}

            {/* A. STUDENT DASHBOARD VIEW */}
            {activeRole === 'student' && (
              <>
                {/* Student KPIs row */}
                <div className={styles.kpiGrid}>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <div className={styles.kpiCardGlow} />
                    <div className={styles.kpiMeta}>
                      <span className={styles.kpiLabel}>XP / SmartScore</span>
                      <span className={styles.kpiIcon}>🏆</span>
                    </div>
                    <span className={styles.kpiValue}>{data.kpis.smartScore}</span>
                    <span className={styles.kpiSubtext}>Level: {data.kpis.learningLevel}</span>
                  </div>

                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <div className={styles.kpiMeta}>
                      <span className={styles.kpiLabel}>Accuracy</span>
                      <span className={styles.kpiIcon}>🎯</span>
                    </div>
                    <span className={styles.kpiValue} style={{ color: 'var(--color-success)' }}>
                      {data.kpis.accuracyPercent}%
                    </span>
                    <span className={styles.kpiSubtext}>{data.kpis.correctAnswers} / {data.kpis.questionsAttempted} Correct</span>
                  </div>

                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <div className={styles.kpiMeta}>
                      <span className={styles.kpiLabel}>Practice Time</span>
                      <span className={styles.kpiIcon}>⏱️</span>
                    </div>
                    <span className={styles.kpiValue}>{data.kpis.practiceMinutes}m</span>
                    <span className={styles.kpiSubtext}>Average speed: {data.kpis.averageTimePerQuestion}s</span>
                  </div>

                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <div className={styles.kpiMeta}>
                      <span className={styles.kpiLabel}>Daily Goals</span>
                      <span className={styles.kpiIcon}>🔥</span>
                    </div>
                    <span className={styles.kpiValue}>{data.kpis.streakDays} Days</span>
                    <span className={styles.kpiSubtext}>{data.kpis.dailyGoalCompletion}% Done Today</span>
                  </div>
                </div>

                {/* Split Visuals (Radar & Journey Map) */}
                <div className={styles.vizSplit}>
                  {/* Visual Journey Game Map */}
                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>🗺️ Learning Journey Map</h4>
                    <div className={styles.journeyPath}>
                      {data.charts.journeyMap?.map(node => (
                        <div key={node.id} className={styles.journeyNode}>
                          <span className={`${styles.journeyMarker} ${
                            node.status === 'Mastered' ? styles.nodeMastered :
                            node.status === 'Proficient' ? styles.nodeProficient :
                            node.status === 'Learning' ? styles.nodeLearning : styles.nodeLocked
                          }`} />
                          <div className={styles.nodeContent}>
                            <h5>{node.title}</h5>
                            <p>{node.desc}</p>
                            <span className={`${styles.nodeTag} ${
                              node.type === 'Concept' ? styles.tagConcept :
                              node.type === 'Practice' ? styles.tagPractice :
                              node.type === 'Remediation' ? styles.tagRemediation : styles.tagSummative
                            }`}>{node.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competency Radar & Subject Progress */}
                  <div className={styles.glassPanel} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h4 className={styles.panelTitle}>📊 Subject Competency Radar</h4>
                      <div className={styles.radarContainer}>
                        {renderRadarChart(data.charts.competencyRadar)}
                      </div>
                    </div>

                    <div>
                      <h4 className={styles.panelTitle}>📂 Subject Progress Overview</h4>
                      <div className={styles.progressList}>
                        {data.charts.subjectProgress?.map(sub => (
                          <div key={sub.subject} className={styles.progressItem}>
                            <div className={styles.progressLabelRow}>
                              <span>{sub.subject}</span>
                              <span>{sub.completion}% completion ({sub.accuracy}% acc)</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                              <div
                                className={styles.progressBarFill}
                                style={{
                                  width: `${sub.completion}%`,
                                  backgroundColor: 'var(--color-primary)'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adaptive flow Progression (Easy -> Medium -> Hard) */}
                {featureFlags.adaptiveLearning && (
                  <section className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>⚙️ Adaptive Pathways Analytics</h4>
                    <div className={styles.flowContainer}>
                      <div className={styles.flowNode}>
                        <h6>Easy Questions</h6>
                        <p>Promotion Rate: 92%</p>
                      </div>
                      <span className={styles.flowArrow}>➔</span>
                      <div className={styles.flowNode} style={{ borderLeft: '4px solid var(--color-primary)' }}>
                        <h6>Medium Questions</h6>
                        <p>Promotion Rate: 74%</p>
                      </div>
                      <span className={styles.flowArrow}>➔</span>
                      <div className={styles.flowNode} style={{ borderLeft: '4px solid var(--color-success)' }}>
                        <h6>Hard Questions</h6>
                        <p>Path Complete: 58%</p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Recommendations & AI Insights */}
                {featureFlags.aiInsights && (
                  <section className={styles.aiContainer}>
                    <div className={`${styles.glassPanel} ${styles.aiBlock}`}>
                      <h5 className={styles.aiBlockTitle}>💡 Next Practice Recommendation</h5>
                      <p className={styles.aiBlockContent}>
                        <strong>Suggested:</strong> {data.recommendations?.nextBestSkill}<br />
                        <strong>Prerequisites:</strong> {data.recommendations?.personalizedPath?.join(' › ')}
                      </p>
                    </div>

                    <div className={`${styles.glassPanel} ${styles.aiBlock}`} style={{ borderLeftColor: 'var(--color-success)' }}>
                      <h5 className={styles.aiBlockTitle}>🤖 AI Strengths & Insights</h5>
                      <p className={styles.aiBlockContent}>{data.insights?.strengths}</p>
                    </div>
                  </section>
                )}
              </>
            )}

            {/* B. PARENT DASHBOARD VIEW */}
            {activeRole === 'parent' && (
              <>
                {/* Child selector header */}
                <div className={styles.glassPanel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Showing reports for: 👤 <strong>{data.kpis.childName}</strong></h4>
                  <span className={styles.nodeTag} style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>Mother linked</span>
                </div>

                <div className={styles.kpiGrid}>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Accuracy</span>
                    <span className={styles.kpiValue}>{data.kpis.accuracy}%</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Mastered Skills</span>
                    <span className={styles.kpiValue}>{data.kpis.skillsMastered}</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Weekly Delta</span>
                    <span className={styles.kpiValue} style={{ color: 'var(--color-success)' }}>{data.kpis.weeklyGrowth}</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Practice Activity</span>
                    <span className={styles.kpiValue} style={{ fontSize: '1.25rem' }}>{data.kpis.learningTime}</span>
                  </div>
                </div>

                {/* Strength / Improvement Split Grid */}
                <div className={styles.vizSplit}>
                  <div className={styles.glassPanel} style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <h4 className={styles.panelTitle}>🌟 Strengths Areas</h4>
                    <div className={styles.progressList}>
                      {data.strengthAreas?.map(s => (
                        <div key={s.subject} style={{ paddingBottom: '0.5rem' }}>
                          <h6 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{s.subject}</h6>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.glassPanel} style={{ borderLeft: '4px solid var(--color-danger)' }}>
                    <h4 className={styles.panelTitle}>⚠️ Areas for Improvement</h4>
                    <div className={styles.progressList}>
                      {data.improvementAreas?.map(s => (
                        <div key={s.subject} style={{ paddingBottom: '0.5rem' }}>
                          <h6 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{s.subject}</h6>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Teacher feedback logs */}
                <section className={styles.glassPanel}>
                  <h4 className={styles.panelTitle}>💬 Teacher Notes & Home Action Guidelines</h4>
                  {data.teacherNotes?.map((n, i) => (
                    <div key={i} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <p><strong>Feedback:</strong> {n.feedback}</p>
                      <p><strong>Home Recommendation:</strong> <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{n.recommendations}</span></p>
                    </div>
                  ))}
                </section>
              </>
            )}

            {/* C. TEACHER DASHBOARD VIEW */}
            {activeRole === 'teacher' && (
              <>
                {/* Classroom metrics */}
                <div className={styles.kpiGrid}>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Total Students</span>
                    <span className={styles.kpiValue}>{data.kpis.totalStudents}</span>
                    <span className={styles.kpiSubtext}>{data.kpis.activeStudents} active this week</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Avg Accuracy</span>
                    <span className={styles.kpiValue}>{data.kpis.avgAccuracy}%</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Avg Mastery</span>
                    <span className={styles.kpiValue}>{data.kpis.avgMastery}%</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Weekly Delta</span>
                    <span className={styles.kpiValue} style={{ color: 'var(--color-success)', fontSize: '1.25rem' }}>{data.kpis.avgGrowth}</span>
                  </div>
                </div>

                {/* Student Monitoring Lists */}
                <div className={styles.vizSplit}>
                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle} style={{ color: 'var(--color-danger)' }}>⚠️ At-Risk Students (Intervention Needing)</h4>
                    <div className={styles.progressList}>
                      {data.studentMonitoring?.atRisk?.map(s => (
                        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                          <span><strong>{s.name}</strong> ({s.accuracy}% accuracy)</span>
                          <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>{s.alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle} style={{ color: 'var(--color-success)' }}>🏆 High Performers & Improvers</h4>
                    <div className={styles.progressList}>
                      {data.studentMonitoring?.topPerformers?.map(s => (
                        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                          <span><strong>{s.name}</strong></span>
                          <span>{s.accuracy}% accuracy ({s.masteries} Masteries)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Heatmaps */}
                {featureFlags.teacherHeatmaps && (
                  <section className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>🗺️ Classroom Mastery Heatmap Matrix</h4>
                    <div className={styles.heatmapContainer}>
                      <div className={styles.heatmapGrid}>
                        {data.classHeatmaps?.studentVsSkill?.map(row => (
                          <div key={row.studentName} className={styles.heatmapRow}>
                            <span className={styles.heatmapLabel}>{row.studentName}</span>
                            {row.skills.map((score, sIdx) => (
                              <div
                                key={sIdx}
                                className={styles.heatmapCell}
                                style={{ backgroundColor: getHeatmapColor(score) }}
                                title={`Skill ${sIdx + 1}: ${score}% Score`}
                              >
                                {score}%
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* 👩‍🏫 Teacher Capabilities Matrix */}
                <section className={styles.glassPanel} style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--color-success)' }}>
                  <h4 className={styles.panelTitle}>👩‍🏫 Teacher Creation Capabilities Matrix</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    As an Educator (Teacher), you possess classroom level permissions to create:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-primary)' }}>📋 Assignments</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create tasks, specify focus skills, and assign practice tracks to classrooms.</p>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-success)' }}>💬 Teacher Feedback Notes</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Write individual action guidelines and home practice tips for parents.</p>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-warning)' }}>⚙️ Remediation Loops</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Build adaptive homework loops and trouble spots intervention strategies.</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* D. SCHOOL ADMIN DASHBOARD VIEW */}
            {activeRole === 'school-admin' && (
              <>
                <div className={styles.kpiGrid}>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Total Enrollment</span>
                    <span className={styles.kpiValue}>{data.kpis.totalStudents}</span>
                    <span className={styles.kpiSubtext}>Teachers active: {data.kpis.totalTeachers}</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Avg Accuracy</span>
                    <span className={styles.kpiValue}>{data.academicKPIs.avgAccuracy}%</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Curriculum Coverage</span>
                    <span className={styles.kpiValue}>{data.academicKPIs.curriculumCoverage}%</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Weekly Active Users</span>
                    <span className={styles.kpiValue} style={{ fontSize: '1.25rem' }}>{data.operationalKPIs.wau} Active</span>
                  </div>
                </div>

                {/* Class vs Class Comparisons */}
                <div className={styles.vizSplit}>
                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>🏫 Class Performance Comparison</h4>
                    <div className={styles.progressList}>
                      {data.comparisons?.classVsClass?.map(c => (
                        <div key={c.name} className={styles.progressItem}>
                          <div className={styles.progressLabelRow}>
                            <span>{c.name}</span>
                            <span>{c.accuracy}% accuracy | {c.completion}% cover</span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div className={styles.progressBarFill} style={{ width: `${c.accuracy}%`, backgroundColor: 'var(--color-info)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>📈 Weekly Retention Curve</h4>
                    <div className={styles.progressList}>
                      {data.retentionCurve?.map(r => (
                        <div key={r.day} className={styles.progressItem}>
                          <div className={styles.progressLabelRow}>
                            <span>{r.day}</span>
                            <span>{r.value}%</span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div className={styles.progressBarFill} style={{ width: `${r.value}%`, backgroundColor: 'var(--color-primary)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 🏫 School Admin Capabilities Matrix */}
                <section className={styles.glassPanel} style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--color-info)' }}>
                  <h4 className={styles.panelTitle}>🏫 School Admin Creation Capabilities Matrix</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    As a School Admin, you possess permissions to create and configure assets within your school campus:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-info)' }}>🏫 Classes & Sections</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Register grade structures and section groups inside your campus roster.</p>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-success)' }}>👥 Rosters & Linkages</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create student rosters, link parents to children, and assign teachers to classrooms.</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* E. PLATFORM ADMIN DASHBOARD VIEW */}
            {activeRole === 'admin' && (
              <>
                <div className={styles.kpiGrid}>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Total Schools</span>
                    <span className={styles.kpiValue}>{data.userKPIs.schools}</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Registered Students</span>
                    <span className={styles.kpiValue}>{data.userKPIs.students}</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Variants Generated</span>
                    <span className={styles.kpiValue}>{data.contentKPIs.questionVariants}</span>
                    <span className={styles.kpiSubtext}>Audio Coverage: {Math.round(data.contentKPIs.audioAssets / data.contentKPIs.questionVariants * 100)}%</span>
                  </div>
                  <div className={`${styles.glassPanel} ${styles.kpiCard}`}>
                    <span className={styles.kpiLabel}>Platform Churn</span>
                    <span className={styles.kpiValue} style={{ color: 'var(--color-danger)' }}>{data.platformKPIs.churnRate}</span>
                  </div>
                </div>

                {/* Content coverage breakdown */}
                <div className={styles.vizSplit}>
                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>🛠️ Platform Curriculum Coverage</h4>
                    <div className={styles.progressList}>
                      <div className={styles.progressItem}>
                        <div className={styles.progressLabelRow}><span>Grade Coverage</span><span>{data.curriculumKPIs.gradeCoverage}%</span></div>
                        <div className={styles.progressBarContainer}><div className={styles.progressBarFill} style={{ width: `${data.curriculumKPIs.gradeCoverage}%`, backgroundColor: 'var(--color-primary)' }} /></div>
                      </div>
                      <div className={styles.progressItem}>
                        <div className={styles.progressLabelRow}><span>Subject Coverage</span><span>{data.curriculumKPIs.subjectCoverage}%</span></div>
                        <div className={styles.progressBarContainer}><div className={styles.progressBarFill} style={{ width: `${data.curriculumKPIs.subjectCoverage}%`, backgroundColor: 'var(--color-success)' }} /></div>
                      </div>
                      <div className={styles.progressItem}>
                        <div className={styles.progressLabelRow}><span>Skill Coverage</span><span>{data.curriculumKPIs.skillCoverage}%</span></div>
                        <div className={styles.progressBarContainer}><div className={styles.progressBarFill} style={{ width: `${data.curriculumKPIs.skillCoverage}%`, backgroundColor: 'var(--color-info)' }} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Active Feature Flag rollout percentages */}
                  <div className={styles.glassPanel}>
                    <h4 className={styles.panelTitle}>⚙️ Active Engine Rollouts (Feature Flags)</h4>
                    <div className={styles.progressList}>
                      {Object.keys(featureFlags).map(key => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className={styles.nodeTag} style={{
                            background: featureFlags[key] ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: featureFlags[key] ? 'var(--color-success)' : 'var(--color-danger)'
                          }}>{featureFlags[key] ? 'Enabled (100%)' : 'Disabled (0%)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 👤 Platform Admin User & Role Creator Panel */}
                <div className={styles.glassPanel} style={{ marginTop: '1.5rem' }}>
                  <h4 className={styles.panelTitle}>👤 Platform Admin User & Role Creator Panel</h4>
                  <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Aryan Sharma"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        required
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none', fontWeight: 600 }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Assign Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Teacher</option>
                        <option value="school-admin">School Admin</option>
                        <option value="admin">Platform Admin</option>
                      </select>
                    </div>

                    {newUserRole === 'student' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Student Username</label>
                          <input
                            type="text"
                            placeholder="e.g. ryan_p"
                            value={newUserUsername}
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            required
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none', fontWeight: 600 }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Student PIN</label>
                          <input
                            type="text"
                            placeholder="e.g. 1234"
                            value={newUserPin}
                            onChange={(e) => setNewUserPin(e.target.value)}
                            required
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none', fontWeight: 600 }}
                          />
                        </div>
                      </>
                    )}

                    {newUserRole === 'parent' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mobile Number</label>
                          <input
                            type="tel"
                            placeholder="e.g. +91 9876543210"
                            value={newUserMobile}
                            onChange={(e) => setNewUserMobile(e.target.value)}
                            required
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none', fontWeight: 600 }}
                          />
                        </div>
                      </>
                    )}

                    {(newUserRole === 'teacher' || newUserRole === 'school-admin' || newUserRole === 'admin') && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                          <input
                            type="email"
                            placeholder="e.g. name@klasschamp.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            required
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', outline: 'none', fontWeight: 600 }}
                          />
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <button
                        type="submit"
                        disabled={creationStatus === 'creating'}
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), #6366f1)', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', outline: 'none', width: '100%' }}
                      >
                        {creationStatus === 'creating' ? 'Creating...' : 'Create User'}
                      </button>
                    </div>
                  </form>
                  {creationStatus && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: creationStatus.startsWith('error') ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {creationStatus === 'success' ? '✅ User and role record initialized successfully in database!' : creationStatus}
                    </div>
                  )}
                </div>

                {/* ⚙️ Platform Admin Capabilities Matrix */}
                <section className={styles.glassPanel} style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <h4 className={styles.panelTitle}>⚙️ Platform Admin Creation Capabilities Matrix</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    As a Platform Admin (Super Admin), you possess global administrative permissions to create:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-primary)' }}>🏫 Schools</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Initialize school profiles globally under curriculum boards.</p>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-info)' }}>🏫 Classes</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allocate classes and assign sections to school campuses.</p>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-success)' }}>👤 Users & Roles</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create students, parents, teachers, school-admins, or fellow platform admins.</p>
                    </div>
                  </div>
                </section>

                {/* 📋 Platform User Directory Table */}
                <div className={styles.glassPanel} style={{ marginTop: '1.5rem' }}>
                  <h4 className={styles.panelTitle}>📋 Super Admin Created Users Directory</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Active and archived user profiles created globally on the platform.
                  </p>
                  
                  {createdUsers.length === 0 ? (
                    <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No user records found. Create a user above to populate the directory.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Identifier</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>School / Class</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {createdUsers.map(user => (
                            <tr key={user._id || user.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{user.name}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span className={styles.nodeTag} style={{
                                  background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' :
                                              user.role === 'teacher' ? 'rgba(16, 185, 129, 0.15)' :
                                              user.role === 'student' ? 'rgba(59, 130, 246, 0.15)' :
                                              user.role === 'parent' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                  color: user.role === 'admin' ? 'var(--color-primary)' :
                                         user.role === 'teacher' ? 'var(--color-success)' :
                                         user.role === 'student' ? 'var(--color-info)' :
                                         user.role === 'parent' ? '#ec4899' : 'var(--text-secondary)',
                                  textTransform: 'uppercase',
                                  fontSize: '0.7rem'
                                }}>
                                  {user.role}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace' }}>
                                {user.username || user.email || user.mobile || '—'}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {user.schoolId || 'Global'}{user.classId ? ` / ${user.classId}` : ''}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span style={{
                                  color: user.isActive !== false ? 'var(--color-success)' : 'var(--color-danger)',
                                  fontWeight: 'bold'
                                }}>
                                  {user.isActive !== false ? '● Active' : '○ Archived'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                {user.isActive !== false ? (
                                  <button
                                    onClick={() => handleArchiveUser(user._id || user.id)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: 'var(--color-danger)',
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    Archive
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRestoreUser(user._id || user.id)}
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: 'var(--color-success)',
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    Restore
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ========================================================
                4. REUSABLE REPORTS EXPORT DRAWER
                ======================================================== */}
            {featureFlags.advancedReports && (
              <section className={styles.glassPanel}>
                <div className={styles.exportRow}>
                  <div>
                    <h4 style={{ margin: 0 }}>📊 Performance Reports Export Center</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Download dynamic performance audits mapped to curriculum objectives.
                    </p>
                  </div>
                  <div className={styles.exportButtons}>
                    <button onClick={() => handleExport('pdf')} className={styles.btnOutline}>📄 Download PDF Report</button>
                    <button onClick={() => handleExport('excel')} className={styles.btnOutline}>📈 Export Excel Sheet</button>
                    <button onClick={() => handleExport('csv')} className={styles.btnOutline}>📝 Export CSV Sheet</button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
