'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'parent' | 'teacher' | 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [classCode, setClassCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      role: activeTab === 'admin' ? 'admin' : activeTab,
      username,
      pin,
      schoolCode,
      classCode,
      mobile,
      email,
      password
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        // Redirect to corresponding production route
        const targetRoute = 
          activeTab === 'student' ? '/student/dashboard' :
          activeTab === 'parent' ? '/parent/dashboard' :
          activeTab === 'teacher' ? '/teacher/dashboard' :
          activeTab === 'school-admin' ? '/school-admin/dashboard' : '/admin/dashboard';
        
        router.push(targetRoute);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (e) {
      setError('Connection failed. Please verify network state.');
    } finally {
      setLoading(false);
    }
  };

  // Quick credentials loader for developers
  const triggerPreset = async (presetRole, presetName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: presetRole, username: presetName })
      });
      const data = await res.json();
      if (data.success) {
        const targetRoute = 
          presetRole === 'student' ? '/student/dashboard' :
          presetRole === 'parent' ? '/parent/dashboard' :
          presetRole === 'teacher' ? '/teacher/dashboard' :
          presetRole === 'school-admin' ? '/school-admin/dashboard' : '/admin/dashboard';
        router.push(targetRoute);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Preset authorization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        
        <div className={styles.cardHeader}>
          <div className={styles.logoArea}>
            <span>🦁</span>
            <span>KlassChamp</span>
          </div>
          <h2>Access Platform Dashboards</h2>
          <p>Select your user profile role to continue</p>
        </div>

        {/* Tab selector */}
        <div className={styles.roleSelector}>
          <button
            onClick={() => { setActiveTab('student'); setError(null); }}
            className={`${styles.roleBtn} ${activeTab === 'student' ? styles.roleBtnActive : ''}`}
          >
            Student
          </button>
          <button
            onClick={() => { setActiveTab('parent'); setError(null); }}
            className={`${styles.roleBtn} ${activeTab === 'parent' ? styles.roleBtnActive : ''}`}
          >
            Parent
          </button>
          <button
            onClick={() => { setActiveTab('teacher'); setError(null); }}
            className={`${styles.roleBtn} ${activeTab === 'teacher' ? styles.roleBtnActive : ''}`}
          >
            Teacher
          </button>
        </div>

        <div className={styles.roleSelector} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <button
            onClick={() => { setActiveTab('school-admin'); setError(null); }}
            className={`${styles.roleBtn} ${activeTab === 'school-admin' ? styles.roleBtnActive : ''}`}
          >
            School Admin
          </button>
          <button
            onClick={() => { setActiveTab('admin'); setError(null); }}
            className={`${styles.roleBtn} ${activeTab === 'admin' ? styles.roleBtnActive : ''}`}
          >
            Platform Admin
          </button>
        </div>

        {error && <div className={styles.errorText}>{error}</div>}

        {/* Input Forms */}
        <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
          
          {activeTab === 'student' && (
            <>
              <div className={styles.formGroup}>
                <label>School Code</label>
                <input
                  type="text"
                  placeholder="e.g. KC-SHARDA"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Class Code</label>
                <input
                  type="text"
                  placeholder="e.g. 5A"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Student Username</label>
                <input
                  type="text"
                  placeholder="e.g. ryan_p"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Student PIN</label>
                <input
                  type="password"
                  placeholder="e.g. 1234"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
            </>
          )}

          {activeTab === 'parent' && (
            <>
              <div className={styles.formGroup}>
                <label>Registered Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Enter 4-Digit OTP Code</label>
                <input
                  type="password"
                  placeholder="e.g. 0000"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </>
          )}

          {(activeTab === 'teacher' || activeTab === 'school-admin' || activeTab === 'admin') && (
            <>
              <div className={styles.formGroup}>
                <label>Institutional Email</label>
                <input
                  type="email"
                  placeholder="e.g. educator@klasschamp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.formInput}
                />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className={styles.btnSubmit}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Presets Helper */}
        <div className={styles.presetsBox}>
          <div className={styles.presetsTitle}>⚡ Quick Demo Credentials Bypass</div>
          <div className={styles.presetsGrid}>
            <button onClick={() => triggerPreset('student', 'ryan_p')} className={styles.presetTag}>👤 Student (Aryan)</button>
            <button onClick={() => triggerPreset('parent', 'parent_sharma')} className={styles.presetTag}>👥 Parent (Mrs. Sharma)</button>
            <button onClick={() => triggerPreset('teacher', 'teach_sharma')} className={styles.presetTag}>👩‍🏫 Teacher (Mrs. Sharma)</button>
            <button onClick={() => triggerPreset('school-admin', 'school_1')} className={styles.presetTag}>🏫 School Admin</button>
            <button onClick={() => triggerPreset('admin', 'platform_root')} className={styles.presetTag}>⚙️ Platform Admin</button>
          </div>
        </div>

      </div>
    </div>
  );
}
