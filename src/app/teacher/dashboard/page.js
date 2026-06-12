'use client';

import React, { useState, useEffect } from 'react';
import styles from './teacher.module.css';

export default function TeacherDashboardPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'assign-skill' | 'add-note'
  
  // Form input states
  const [targetClass, setTargetClass] = useState('5A');
  const [targetSkill, setTargetSkill] = useState('');
  const [targetNoteStudent, setTargetNoteStudent] = useState('');
  const [targetNoteContent, setTargetNoteContent] = useState('');
  const [targetNoteRecs, setTargetNoteRecs] = useState('');

  // Quick Add Student states
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPin, setNewStudentPin] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('5A');

  // Load stats
  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/teacher?teacherId=teach_sharma');
      const payload = await res.json();
      
      const defaultData = {
        kpis: { totalStudents: 32, activeStudents: 28, avgAccuracy: 78, avgMastery: 64, avgGrowth: '+12%' },
        studentMonitoring: {
          atRisk: [
            { name: 'Rohan Gupta', accuracy: 52, alert: 'Accuracy dropped below 60%' },
            { name: 'Zoya Khan', accuracy: 48, alert: 'Inactivity warning (5 days)' }
          ],
          topPerformers: [
            { name: 'Aryan Sharma', accuracy: 94, masteries: 12 },
            { name: 'Nisha Vyas', accuracy: 91, masteries: 10 }
          ],
          recentlyImproved: [
            { name: 'Dev Joshi', accuracy: 78, delta: '+15%' }
          ]
        },
        skillAnalytics: {
          mostDifficult: ['skill_frac_add'],
          mostFailed: ['Subtracting carrying values'],
          mostPracticed: ['Expanded place values'],
          leastPracticed: ['Simple clocks reading']
        },
        interventionCenter: [
          { student: 'Zoya Khan', issue: 'Fraction denominators concepts gap', recommendations: 'Spend 5 minutes on visual models.' }
        ],
        classHeatmaps: {
          studentVsSkill: [
            { studentName: 'Aryan Sharma', skills: [98, 85, 92, 100, 78] },
            { studentName: 'Ananya Sharma', skills: [95, 78, 62, 84, 90] },
            { studentName: 'Dev Joshi', skills: [78, 82, 90, 45, 60] },
            { studentName: 'Rohan Gupta', skills: [52, 60, 48, 70, 55] },
            { studentName: 'Zoya Khan', skills: [48, 55, 30, 42, 50] }
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
    fetchTeacherData();
  }, []);

  const handleAssignSkill = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: targetClass, skillId: targetSkill })
      });
      const resData = await res.json();
      if (resData.success) {
        alert(resData.message || `Successfully assigned skill ${targetSkill} to Class ${targetClass}.`);
        setActiveModal(null);
        setTargetSkill('');
      } else {
        alert(`Failed: ${resData.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Error: Network connection failed.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: targetNoteStudent,
          content: targetNoteContent,
          recommendations: targetNoteRecs
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert(resData.message || `Added note to student profile ${targetNoteStudent} successfully.`);
        setActiveModal(null);
        setTargetNoteContent('');
        setTargetNoteRecs('');
        setTargetNoteStudent('');
      } else {
        alert(`Failed: ${resData.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Error: Network connection failed.');
    }
  };

  const handleQuickAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teacher/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName,
          username: newStudentUsername,
          pin: newStudentPin,
          classId: newStudentClass
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert(resData.message || `Successfully registered student ${newStudentName}!`);
        setActiveModal(null);
        setNewStudentName('');
        setNewStudentUsername('');
        setNewStudentPin('');
        // Reload dashboard so stats/roster refreshes immediately
        fetchTeacherData();
      } else {
        alert(`Failed: ${resData.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Error: Network connection failed.');
    }
  };

  // Color helper for Heatmap
  const getCellColor = (score) => {
    if (score >= 85) return 'var(--color-success)'; // Green
    if (score >= 70) return 'var(--color-primary)'; // Indigo
    if (score >= 50) return 'var(--color-warning)'; // Orange
    return 'var(--color-danger)'; // Red
  };

  return (
    <div className={styles.teacherContainer}>
      
      <header className={styles.headerRow}>
        <div>
          <h1>IXL-Like Teacher Dashboard</h1>
          <p>Real-time class tracking, classroom matrices, and custom assignments.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setActiveModal('quick-add-student')} className={styles.btn} style={{ background: 'linear-gradient(135deg, var(--color-success), #10b981)' }}>
            ➕ Quick Add Student
          </button>
          <button onClick={() => setActiveModal('assign-skill')} className={styles.btn}>
            📋 Assign Skill to Class
          </button>
          <button onClick={() => setActiveModal('add-note')} className={styles.btnSecondary}>
            ✍️ Add Teacher Note
          </button>
        </div>
      </header>

      {loading || !data ? (
        <div className={styles.glassPanel} style={{ textAlign: 'center', padding: '3rem' }}>
          <strong>Analyzing classroom progress...</strong>
        </div>
      ) : (
        <>
          {/* 1. Class KPIs */}
          <section className={styles.kpiGrid} aria-label="Teacher Dashboard KPIs">
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Students</span>
              <span className={styles.kpiValue}>{data.kpis.totalStudents}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Active Today</span>
              <span className={styles.kpiValue} style={{ color: 'var(--color-success)' }}>
                {data.kpis.activeStudents}
              </span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Avg Accuracy</span>
              <span className={styles.kpiValue}>{data.kpis.avgAccuracy}%</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Mastery Level</span>
              <span className={styles.kpiValue}>{data.kpis.avgMastery}%</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Growth Delta</span>
              <span className={styles.kpiValue} style={{ color: 'var(--color-info)' }}>
                {data.kpis.avgGrowth}
              </span>
            </div>
          </section>

          {/* 2. Split (Live log & Trouble Spots) */}
          <div className={styles.gridSplit}>
            {/* Live active students presence */}
            <div className={styles.glassPanel}>
              <h4 className={styles.panelTitle}>
                <span className={styles.presenceDot} /> Real-Time Live Classroom Activity
              </h4>
              <div className={styles.liveList}>
                <div className={styles.liveRow}>
                  <span><strong>Aryan Sharma</strong> is practicing: <em>"Represent Expanded Place Value"</em></span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 800 }}>Active Now</span>
                </div>
                <div className={styles.liveRow}>
                  <span><strong>Ananya Sharma</strong> is practicing: <em>"Identify Beginning Phonetic sound"</em></span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 800 }}>Active Now</span>
                </div>
                <div className={styles.liveRow}>
                  <span><strong>Dev Joshi</strong> answered: <em>"Subtracting fraction models"</em></span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 mins ago</span>
                </div>
              </div>
            </div>

            {/* Trouble Spots alert boxes */}
            <div className={styles.glassPanel}>
              <h4 className={styles.panelTitle}>⚠️ Classroom Trouble Spots</h4>
              <div className={styles.spotCard}>
                <div className={styles.spotHeader}>
                  <span>Skill: Adding Unlike Denominator Fractions</span>
                  <span style={{ color: 'var(--color-danger)' }}>5 Students Stuck</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Common mistake: Summing denominator values directly (e.g. 1/3 + 1/2 = 2/5).
                </div>
                <div className={styles.spotAction}>
                  💡 Suggested Action: Reteach visually using fraction manipulatives strips before practice.
                </div>
              </div>
            </div>
          </div>

          {/* 3. Heatmap Matrix grid */}
          <section className={styles.glassPanel} style={{ marginBottom: '2rem' }}>
            <h4 className={styles.panelTitle}>🗺️ Student vs Skill Mastery Heatmap</h4>
            <div className={styles.heatmapWrapper}>
              <div className={styles.heatmapGrid}>
                {data.classHeatmaps?.studentVsSkill?.map(row => (
                  <div key={row.studentName} className={styles.heatmapRow}>
                    <span className={styles.heatmapLabel}>{row.studentName}</span>
                    {row.skills.map((score, sIdx) => (
                      <div
                        key={sIdx}
                        className={styles.heatmapCell}
                        style={{ backgroundColor: getCellColor(score) }}
                        title={`Skill ${sIdx + 1}: ${score}% Accuracy`}
                      >
                        {score}%
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Student Roster status listing */}
          <section className={styles.glassPanel}>
            <h4 className={styles.panelTitle}>📋 Student Progress & Watch List</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem' }}>Student Name</th>
                  <th style={{ padding: '0.5rem' }}>Accuracy</th>
                  <th style={{ padding: '0.5rem' }}>XP / SmartScore</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Aryan Sharma</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-success)', fontWeight: 800 }}>94%</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>✨ 1,840</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}><span style={{ color: 'var(--color-success)', fontWeight: 800 }}>On Track</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Ananya Sharma</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-success)', fontWeight: 800 }}>95%</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>✨ 3,250</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}><span style={{ color: 'var(--color-success)', fontWeight: 800 }}>On Track</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Rohan Gupta</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-warning)', fontWeight: 800 }}>52%</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>✨ 450</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}><span style={{ color: 'var(--color-warning)', fontWeight: 800 }}>Watch</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Zoya Khan</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-danger)', fontWeight: 800 }}>48%</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>✨ 180</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}><span style={{ color: 'var(--color-danger)', fontWeight: 800 }}>Needs Help</span></td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* ========================================================
          MODAL OVERLAYS
          ======================================================== */}

      {/* Modal: Assign Skill */}
      {activeModal === 'assign-skill' && (
        <div className={styles.overlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Assign Skill to Classroom</h3>
            <form onSubmit={handleAssignSkill} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Select Target Class</label>
                <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className={styles.formInput}>
                  <option value="5A">Class 5A</option>
                  <option value="3B">Class 3B</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Skill Identifier (ID)</label>
                <input type="text" placeholder="e.g. skill_frac_add" value={targetSkill} onChange={(e) => setTargetSkill(e.target.value)} required className={styles.formInput} />
              </div>
              <button type="submit" className={styles.btn}>Save Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Teacher Note */}
      {activeModal === 'add-note' && (
        <div className={styles.overlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Add Teacher Note</h3>
            <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Select Student</label>
                <input type="text" placeholder="e.g. Rohan Gupta" value={targetNoteStudent} onChange={(e) => setTargetNoteStudent(e.target.value)} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Teacher Observations</label>
                <textarea rows={3} placeholder="Observations..." value={targetNoteContent} onChange={(e) => setTargetNoteContent(e.target.value)} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Home Action Guidance</label>
                <input type="text" placeholder="e.g. Practice 10 minutes visual math" value={targetNoteRecs} onChange={(e) => setTargetNoteRecs(e.target.value)} className={styles.formInput} />
              </div>
              <button type="submit" className={styles.btn}>Save Note</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Add Student */}
      {activeModal === 'quick-add-student' && (
        <div className={styles.overlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>➕ Quick Add Student</h3>
            <form onSubmit={handleQuickAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aryan Verma"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Username (Sign In)</label>
                <input
                  type="text"
                  placeholder="e.g. aryan_v"
                  value={newStudentUsername}
                  onChange={(e) => setNewStudentUsername(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>4-Digit PIN</label>
                <input
                  type="text"
                  pattern="[0-9]{4}"
                  placeholder="e.g. 1234"
                  value={newStudentPin}
                  onChange={(e) => setNewStudentPin(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Select Target Class</label>
                <select
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="5A">Class 5A</option>
                  <option value="3B">Class 3B</option>
                </select>
              </div>
              <button type="submit" className={styles.btn}>Register Student</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
