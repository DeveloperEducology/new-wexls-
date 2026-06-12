'use client';

import React, { useState, useEffect } from 'react';
import styles from './schools.module.css';

export default function AdminSchoolsConsole() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [city, setCity] = useState('');

  const loadSchools = async () => {
    setLoading(true);
    try {
      const dbRes = await fetch('/api/admin/stats');
      const data = await dbRes.json();
      
      // Fallback mockup if database is empty/down
      const defaultSchools = [
        { _id: 'school_1', schoolCode: 'KC-SHARDA', name: 'Sharda Public School', city: 'Delhi', teachers: 12, students: 240 },
        { _id: 'school_2', schoolCode: 'KC-DOON', name: 'The Doon Academy', city: 'Dehradun', teachers: 8, students: 180 },
        { _id: 'school_3', schoolCode: 'KC-DAV', name: 'DAV Centenary School', city: 'Jaipur', teachers: 14, students: 310 }
      ];

      if (data.success && data.schools && data.schools.length > 0) {
        // Build list based on database distinct schools
        const mapped = data.schools.map((code, idx) => ({
          _id: `school_${idx + 1}`,
          schoolCode: code,
          name: `${code.replace('KC-', '')} KlassChamp Campus`,
          city: 'Metro City',
          teachers: 6 + idx * 3,
          students: 120 + idx * 45
        }));
        setSchools(mapped);
      } else {
        setSchools(defaultSchools);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    try {
      // Mock creation locally for demonstration
      const newSchool = {
        _id: `school_${schools.length + 1}`,
        schoolCode: schoolCode.toUpperCase(),
        name,
        city,
        teachers: 0,
        students: 0
      };
      setSchools([...schools, newSchool]);
      setShowModal(false);
      setName('');
      setSchoolCode('');
      setCity('');
      alert("New school campus registered successfully.");
    } catch (err) {
      alert("Registration failed.");
    }
  };

  return (
    <div className={styles.schoolContainer}>
      
      <header className={styles.headerRow}>
        <div>
          <h1>Registered Campuses & Schools</h1>
          <p>Configure regional institutional codes and monitor student registration coverages.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.btn}>
          ➕ Register New School
        </button>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><strong>Scanning schools directory...</strong></div>
      ) : (
        <div className={styles.schoolGrid}>
          {schools.map(s => (
            <div key={s._id} className={styles.schoolCard}>
              <div className={styles.schoolHeader}>
                <div>
                  <h3 className={styles.schoolName}>{s.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 {s.city}</span>
                </div>
                <span className={styles.schoolCode}>{s.schoolCode}</span>
              </div>
              
              <div className={styles.schoolStats}>
                <span>👩‍🏫 {s.teachers} Teachers</span>
                <span>👥 {s.students} Students</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register School Overlay Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Register School Campus</h3>
            <form onSubmit={handleCreateSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Campus School Code</label>
                <input type="text" placeholder="e.g. KC-SHARDA" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Institution Name</label>
                <input type="text" placeholder="e.g. Sharda Public School" value={name} onChange={(e) => setName(e.target.value)} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>City Location</label>
                <input type="text" placeholder="e.g. Delhi" value={city} onChange={(e) => setCity(e.target.value)} required className={styles.formInput} />
              </div>
              <button type="submit" className={styles.btn}>Save Campus</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
