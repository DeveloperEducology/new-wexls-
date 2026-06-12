'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './users.module.css';

export default function AdminUsersConsole() {
  // Lists and stats states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Expandable Drawers toggles
  const [activeDrawer, setActiveDrawer] = useState(null); // 'create' | 'edit' | 'import' | 'link-parent' | 'link-teacher' | 'pin-cards'
  const [selectedUser, setSelectedUser] = useState(null);

  // Roster inputs for create/edit
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [schoolId, setSchoolId] = useState('school_1');
  const [classId, setClassId] = useState('');
  const [parentId, setParentId] = useState('');
  const [studentId, setStudentId] = useState('');

  // Linkage inputs
  const [targetClassId, setTargetClassId] = useState('');
  const [targetParentId, setTargetParentId] = useState('');
  const [targetRelation, setTargetRelation] = useState('Guardian');

  // CSV Bulk Wizard states
  const [csvData, setCsvData] = useState('');
  const [importType, setImportType] = useState('students');
  const [validationPreview, setValidationPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importStatus, setImportStatus] = useState(null);

  // Load User List from backend
  const loadUsersList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (schoolFilter) params.append('schoolId', schoolFilter);
      if (classFilter) params.append('classId', classFilter);
      if (gradeFilter) params.append('grade', gradeFilter);
      params.append('includeArchived', 'true'); // Show archived users to allow restoration

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const payload = await res.json();
      if (payload.success) {
        setUsers(payload.users || []);
      } else {
        setError(payload.error);
      }
    } catch (e) {
      setError("Failed to fetch user list records.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, schoolFilter, classFilter, gradeFilter]);

  useEffect(() => {
    loadUsersList();
  }, [loadUsersList]);

  // Form submit handlers
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role, name, email, password, username, pin, schoolId, classId, parentId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("User account registered successfully.");
        setActiveDrawer(null);
        clearForm();
        loadUsersList();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert("API request failure");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser._id,
          name, email, schoolId, classId, role
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("User details updated successfully.");
        setActiveDrawer(null);
        loadUsersList();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert("API request failure");
    }
  };

  // Archive / Restore
  const handleToggleArchive = async (user) => {
    const isArchive = user.isActive !== false;
    const path = isArchive ? 'archive' : 'restore';
    if (!confirm(`Are you sure you want to ${path} ${user.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await res.json();
      if (data.success) {
        alert(`User account ${isArchive ? 'archived' : 'restored'} successfully.`);
        loadUsersList();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert("API request failure");
    }
  };

  // Credentials Resets
  const handleResetPassword = async (user) => {
    const newPass = prompt(`Enter new password for ${user.name}:`, "KlassChamp123");
    if (!newPass) return;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, newPassword: newPass })
      });
      const data = await res.json();
      if (data.success) {
        alert("Password updated successfully.");
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert("API request failure");
    }
  };

  const handleResetPin = async (user) => {
    const newPin = prompt(`Enter new 4-digit PIN for ${user.name}:`, "1234");
    if (!newPin) return;

    try {
      const res = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, newPin })
      });
      const data = await res.json();
      if (data.success) {
        alert("Student PIN updated successfully.");
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert("API request failure");
    }
  };

  // CSV Validation & Import
  const handleValidateCSV = async () => {
    setValidationErrors([]);
    setValidationPreview(null);
    setImportStatus('validating');

    try {
      const res = await fetch('/api/admin/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, importType, dryRun: true })
      });
      const data = await res.json();
      
      if (data.success) {
        setImportStatus('validated');
        setValidationPreview(data);
      } else {
        setImportStatus('error');
        setValidationErrors(data.errors || [{ error: data.error }]);
      }
    } catch (e) {
      setImportStatus('error');
      setValidationErrors([{ error: 'API connection validation failure' }]);
    }
  };

  const handleCommitCSVImport = async () => {
    setImportStatus('importing');
    try {
      const res = await fetch('/api/admin/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, importType, dryRun: false })
      });
      const data = await res.json();
      if (data.success) {
        setImportStatus('completed');
        alert("Roster list imported successfully.");
        setActiveDrawer(null);
        setCsvData('');
        setValidationPreview(null);
        loadUsersList();
      } else {
        setImportStatus('error');
        setValidationErrors([{ error: data.error }]);
      }
    } catch (e) {
      setImportStatus('error');
      setValidationErrors([{ error: 'API execution failure' }]);
    }
  };

  // Linkages setups
  const handleLinkParent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/links/parent-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: targetParentId, studentId: selectedUser._id, relation: targetRelation })
      });
      const data = await res.json();
      if (data.success) {
        alert("Parent linked to student successfully.");
        setActiveDrawer(null);
        loadUsersList();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Failed to submit request.");
    }
  };

  const handleLinkTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/links/teacher-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedUser._id, classId: targetClassId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Teacher linked to class successfully.");
        setActiveDrawer(null);
        loadUsersList();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Failed to submit request.");
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setUsername('');
    setPin('');
    setPassword('');
    setClassId('');
    setParentId('');
  };

  const triggerEditDrawer = (user) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email || '');
    setUsername(user.username || '');
    setRole(user.role);
    setClassId(user.classId || '');
    setSchoolId(user.schoolId || 'school_1');
    setActiveDrawer('edit');
  };

  return (
    <div className={styles.consoleContainer}>
      
      {/* 1. Header Area */}
      <header className={styles.headerRow}>
        <div className={styles.headerInfo}>
          <h1>Platform User Management Console</h1>
          <p>Register studentPIN cards, configure teacher classes, map parent linkages, and audit roster logs.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => { clearForm(); setRole('student'); setActiveDrawer('create'); }} className={styles.btn}>
            ➕ Add Single User
          </button>
          <button onClick={() => { setActiveDrawer('import'); setImportStatus(null); setValidationPreview(null); }} className={`${styles.btn} ${styles.btnSecondary}`}>
            📥 Bulk Import CSV
          </button>
        </div>
      </header>

      {/* 2. Quick KPI summary */}
      <section className={styles.kpiGrid} aria-label="Console Stats summary">
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Accounts</span>
          <span className={styles.kpiValue}>{users.length}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Users</span>
          <span className={styles.kpiValue}>{users.filter(u => u.isActive !== false).length}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Archived Users</span>
          <span className={styles.kpiValue}>{users.filter(u => u.isActive === false).length}</span>
        </div>
      </section>

      {/* 3. Search and Filters Bar */}
      <section className={styles.filterBar} aria-label="Filters bar">
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={styles.filterSelect}>
          <option value="">👥 All Roles</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="teacher">Teacher</option>
          <option value="school-admin">School Admin</option>
          <option value="admin">Platform Admin</option>
        </select>

        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={styles.filterSelect}>
          <option value="">📚 All Grades</option>
          <option value="UKG">UKG</option>
          <option value="Grade 3">Grade 3</option>
          <option value="Grade 5">Grade 5</option>
          <option value="Grade 7">Grade 7</option>
        </select>

        <button onClick={loadUsersList} className={styles.btnSecondary}>
          🔍 Refresh
        </button>
      </section>

      {/* 4. Users Table */}
      <section className={styles.tableWrapper}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <strong>Analyzing directory credentials...</strong>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No users match selected filter queries. Add users or import class rosters.
          </div>
        ) : (
          <table className={styles.rosterTable}>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Role</th>
                <th>Identities / Login Creds</th>
                <th>School & Class</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td>
                    <span className={`${styles.badge} ${
                      u.role === 'student' ? styles.badgeStudent :
                      u.role === 'parent' ? styles.badgeParent :
                      u.role === 'teacher' ? styles.badgeTeacher : styles.badgeAdmin
                    }`}>{u.role}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {u.email && <div>✉️ {u.email}</div>}
                      {u.username && <div>👤 {u.username}</div>}
                      {u.mobile && <div>📱 {u.mobile}</div>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {u.schoolId || 'Global'}
                      </span>
                      {u.classId && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {u.classId}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.isActive !== false ? styles.badgeActive : styles.badgeArchived}`}>
                      {u.isActive !== false ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => triggerEditDrawer(u)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>
                      ✏️ Edit
                    </button>
                    
                    <button onClick={() => handleToggleArchive(u)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall} ${styles.btnDanger}`}>
                      {u.isActive !== false ? '📦 Archive' : '♻️ Restore'}
                    </button>

                    {u.role === 'student' && (
                      <button onClick={() => handleResetPin(u)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>
                        🔑 Reset PIN
                      </button>
                    )}

                    {['teacher', 'school-admin', 'admin'].includes(u.role) && (
                      <button onClick={() => handleResetPassword(u)} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>
                        🔑 Pass
                      </button>
                    )}

                    {u.role === 'student' && (
                      <button onClick={() => { setSelectedUser(u); setTargetRelation('Mother'); setActiveDrawer('link-parent'); }} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>
                        🔗 Link Parent
                      </button>
                    )}

                    {u.role === 'teacher' && (
                      <button onClick={() => { setSelectedUser(u); setTargetClassId(''); setActiveDrawer('link-teacher'); }} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>
                        🔗 Link Class
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ========================================================
          EXPANDABLE SIDE DRAWER FORMS
          ======================================================== */}
      
      {/* Drawer: Add Single User */}
      {activeDrawer === 'create' && (
        <div className={styles.drawerOverlay} onClick={() => setActiveDrawer(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Register Single User Account</h3>
              <button onClick={() => setActiveDrawer(null)} className={styles.btnClose}>×</button>
            </div>
            
            <form onSubmit={handleRegisterUser} className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label>User Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.formInput}>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="school-admin">School Admin</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input type="text" placeholder="e.g. Aryan Sharma" value={name} onChange={(e) => setName(e.target.value)} required className={styles.formInput} />
              </div>

              {role === 'student' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Username</label>
                    <input type="text" placeholder="e.g. ryan_p" value={username} onChange={(e) => setUsername(e.target.value)} required className={styles.formInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Student PIN (4-digit)</label>
                    <input type="text" placeholder="e.g. 1234" value={pin} onChange={(e) => setPin(e.target.value)} className={styles.formInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Target Class ID (ClassCode)</label>
                    <input type="text" placeholder="e.g. 5A" value={classId} onChange={(e) => setClassId(e.target.value)} className={styles.formInput} />
                  </div>
                </>
              )}

              {role === 'parent' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Mobile Number</label>
                    <input type="tel" placeholder="e.g. +91 9876543210" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.formInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>PIN (for OTP matches)</label>
                    <input type="text" placeholder="e.g. 0000" value={pin} onChange={(e) => setPin(e.target.value)} className={styles.formInput} />
                  </div>
                </>
              )}

              {['teacher', 'school-admin', 'admin'].includes(role) && (
                <>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input type="email" placeholder="e.g. educator@klasschamp.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.formInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>System Password</label>
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.formInput} />
                  </div>
                </>
              )}

              <button type="submit" className={styles.btn}>Submit Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Edit User */}
      {activeDrawer === 'edit' && (
        <div className={styles.drawerOverlay} onClick={() => setActiveDrawer(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Modify User Profile</h3>
              <button onClick={() => setActiveDrawer(null)} className={styles.btnClose}>×</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={styles.formInput} />
              </div>
              
              {role !== 'student' && (
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.formInput} />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>School ID</label>
                <input type="text" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={styles.formInput} />
              </div>

              {role === 'student' && (
                <div className={styles.formGroup}>
                  <label>Class ID</label>
                  <input type="text" value={classId} onChange={(e) => setClassId(e.target.value)} className={styles.formInput} />
                </div>
              )}

              <button type="submit" className={styles.btn}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Link Parent */}
      {activeDrawer === 'link-parent' && (
        <div className={styles.drawerOverlay} onClick={() => setActiveDrawer(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Link Parent to: {selectedUser?.name}</h3>
              <button onClick={() => setActiveDrawer(null)} className={styles.btnClose}>×</button>
            </div>
            
            <form onSubmit={handleLinkParent} className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label>Parent ID (User ObjectId or Email)</label>
                <input type="text" placeholder="e.g. parent_sharma" value={targetParentId} onChange={(e) => setTargetParentId(e.target.value)} required className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Relation</label>
                <select value={targetRelation} onChange={(e) => setTargetRelation(e.target.value)} className={styles.formInput}>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>
              <button type="submit" className={styles.btn}>Link Parent Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Link Teacher */}
      {activeDrawer === 'link-teacher' && (
        <div className={styles.drawerOverlay} onClick={() => setActiveDrawer(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Link Teacher: {selectedUser?.name}</h3>
              <button onClick={() => setActiveDrawer(null)} className={styles.btnClose}>×</button>
            </div>
            
            <form onSubmit={handleLinkTeacher} className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label>Target Class ID (ClassCode)</label>
                <input type="text" placeholder="e.g. 5A" value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)} required className={styles.formInput} />
              </div>
              <button type="submit" className={styles.btn}>Link Classroom</button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: CSV Import Wizard */}
      {activeDrawer === 'import' && (
        <div className={styles.drawerOverlay} onClick={() => setActiveDrawer(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className={styles.drawerHeader}>
              <h3>📥 Bulk CSV Import Wizard</h3>
              <button onClick={() => setActiveDrawer(null)} className={styles.btnClose}>×</button>
            </div>
            
            <div className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label>Select Import Target Type</label>
                <select value={importType} onChange={(e) => setImportType(e.target.value)} className={styles.formInput}>
                  <option value="students">Students Spreadsheet</option>
                  <option value="parents">Parents Spreadsheet</option>
                  <option value="teachers">Teachers Spreadsheet</option>
                  <option value="classes">Classes Spreadsheet</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Paste CSV Data</label>
                <textarea
                  rows={8}
                  placeholder={
                    importType === 'students' ? "name,username,pin,schoolid,classid,parentid\nAryan Sharma,ryan_p,1234,school_1,class_5a,parent_sharma" :
                    importType === 'parents' ? "name,email,mobile,pin\nParent Sharma,parent@sharma.com,+919876543210,0000" :
                    importType === 'teachers' ? "name,email,password,classid\nMrs. Sharma,educator@klasschamp.com,KlassChamp123,class_5a" :
                    "classcode,schoolid,grade,section,teacherid\n5A,school_1,Grade 5,A,teach_sharma"
                  }
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className={styles.formInput}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleValidateCSV} className={`${styles.btn} ${styles.btnSecondary}`}>
                  🔄 Validate & Dry-Run
                </button>
                
                {importStatus === 'validated' && (
                  <button onClick={handleCommitCSVImport} className={styles.btn}>
                    🚀 Confirm Import
                  </button>
                )}
              </div>

              {/* Validation errors/success previews */}
              {importStatus === 'validated' && validationPreview && (
                <div>
                  <h5 style={{ margin: '0 0 0.5rem 0' }}>✅ Validation Passed: {validationPreview.totalCount} Rows Found</h5>
                  <div className={styles.csvPreview}>
                    <pre>{JSON.stringify(validationPreview.preview, null, 2)}</pre>
                  </div>
                </div>
              )}

              {importStatus === 'error' && validationErrors.length > 0 && (
                <div className={styles.errorBox}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-danger)' }}>❌ CSV Validation Errors:</h5>
                  {validationErrors.map((err, i) => (
                    <div key={i} className={styles.errorRow}>
                      {err.row ? `Row ${err.row}: ` : ''} {err.error}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
