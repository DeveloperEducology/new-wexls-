'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminV2Page() {
  const [activeTab, setActiveTab] = useState('grade'); // grade, subject, unit, chapter, skill
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // ID of the node currently being edited
  
  // Data lists
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [skills, setSkills] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    icon: '',
    order: 0,
    subjectId: '',
    unitId: '',
    gradeId: '',
    chapterId: '',
    code: '',
    templateId: '',
    engine: '',
    templateLevels: '',
    remediation: '',
  });

  // Difficulty scaling states for skills
  const [skillDifficultyScaling, setSkillDifficultyScaling] = useState(false);
  const [skillTemplateLevels, setSkillTemplateLevels] = useState([
    { level: 1, templateIds: [] },
    { level: 2, templateIds: [] },
    { level: 3, templateIds: [] },
  ]);
  const [levelAddInputs, setLevelAddInputs] = useState({ 1: '', 2: '', 3: '' });

  // Template Search Autocomplete states
  const [allTemplates, setAllTemplates] = useState([]);
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null); // 'primary', '1', '2', '3'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchCollection = async (type) => {
        const res = await fetch(`/api/v2/curriculum?type=${type}`);
        const data = await res.json();
        return data.success ? data.nodes : [];
      };

      const [gList, sList, uList, cList, skList] = await Promise.all([
        fetchCollection('grade'),
        fetchCollection('subject'),
        fetchCollection('unit'),
        fetchCollection('chapter'),
        fetchCollection('skill'),
      ]);

      setGrades(gList);
      setSubjects(sList);
      setUnits(uList);
      setChapters(cList);
      setSkills(skList);

      // Fetch dynamic templates catalog for autocompletion
      try {
        const templatesRes = await fetch('/api/admin/templates');
        const templatesData = await templatesRes.json();
        if (templatesData.success && Array.isArray(templatesData.dynamicTemplates)) {
          setAllTemplates(templatesData.dynamicTemplates);
        }
      } catch (tErr) {
        console.warn('Failed to fetch dynamic templates catalog:', tErr);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch curriculum data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for clicks outside of autocomplete lists to close them
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.suggestion-container')) {
        setActiveSuggestionBox(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Filter templates list based on search term
  const renderSuggestions = (query, onSelect, boxId) => {
    if (activeSuggestionBox !== boxId) return null;
    const q = (query || '').toLowerCase().trim();
    if (!q) return null;

    const matches = allTemplates.filter(t => 
      t.id.toLowerCase().includes(q) || 
      (t.title && t.title.toLowerCase().includes(q))
    ).slice(0, 10);

    if (matches.length === 0) return null;

    return (
      <div 
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          zIndex: 9999,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '2px',
        }}
      >
        {matches.map(t => (
          <div
            key={t.id}
            onClick={() => {
              onSelect(t.id);
              setActiveSuggestionBox(null);
            }}
            style={{
              padding: '6px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '12px',
              textAlign: 'left',
            }}
            className="suggestion-item"
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.title || t.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{t.id}</div>
          </div>
        ))}
      </div>
    );
  };

  // Reset edit state when tab switches
  useEffect(() => {
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      icon: '',
      order: 0,
      subjectId: '',
      unitId: '',
      gradeId: '',
      chapterId: '',
      code: '',
      templateId: '',
      engine: '',
      templateLevels: '',
    });
    setSkillDifficultyScaling(false);
    setSkillTemplateLevels([
      { level: 1, templateIds: [] },
      { level: 2, templateIds: [] },
      { level: 3, templateIds: [] },
    ]);
    setLevelAddInputs({ 1: '', 2: '', 3: '' });
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSeed = async () => {
    if (!confirm('Are you sure you want to seed default v2 curriculum data? This will overwrite or append default LKG/UKG structures.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v2/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seed' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Seeding successful!');
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Seeding request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      id: item.id || '',
      title: item.title || '',
      icon: item.icon || '',
      order: item.order || 0,
      subjectId: item.subjectId || '',
      unitId: item.unitId || '',
      gradeId: item.gradeId || '',
      chapterId: item.chapterId || '',
      code: item.code || '',
      templateId: Array.isArray(item.templateId) ? item.templateId.join(', ') : (item.templateId || ''),
      engine: item.engine || '',
      templateLevels: item.templateLevels ? JSON.stringify(item.templateLevels, null, 2) : '',
      remediation: item.remediation ? (Array.isArray(item.remediation) ? item.remediation.join(', ') : item.remediation) : '',
    });

    if (item.templateLevels && Array.isArray(item.templateLevels) && item.templateLevels.length > 0) {
      setSkillDifficultyScaling(true);
      const levelsMap = { 1: [], 2: [], 3: [] };
      item.templateLevels.forEach(l => {
        if (l.level) {
          levelsMap[l.level] = Array.isArray(l.templateIds) ? l.templateIds : [];
        }
      });
      setSkillTemplateLevels([
        { level: 1, templateIds: levelsMap[1] },
        { level: 2, templateIds: levelsMap[2] },
        { level: 3, templateIds: levelsMap[3] },
      ]);
    } else {
      setSkillDifficultyScaling(false);
      setSkillTemplateLevels([
        { level: 1, templateIds: [] },
        { level: 2, templateIds: [] },
        { level: 3, templateIds: [] },
      ]);
    }
    setLevelAddInputs({ 1: '', 2: '', 3: '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      icon: '',
      order: 0,
      subjectId: '',
      unitId: '',
      gradeId: '',
      chapterId: '',
      code: '',
      templateId: '',
      engine: '',
      templateLevels: '',
      remediation: '',
    });
    setSkillDifficultyScaling(false);
    setSkillTemplateLevels([
      { level: 1, templateIds: [] },
      { level: 2, templateIds: [] },
      { level: 3, templateIds: [] },
    ]);
    setLevelAddInputs({ 1: '', 2: '', 3: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare payload based on activeTab
    const payloadData = {
      id: editingId || formData.id || undefined,
      title: formData.title,
      order: Number(formData.order) || 0,
    };

    if (activeTab === 'subject') {
      payloadData.icon = formData.icon;
    } else if (activeTab === 'unit') {
      payloadData.subjectId = formData.subjectId;
    } else if (activeTab === 'chapter') {
      payloadData.unitId = formData.unitId;
      payloadData.gradeId = formData.gradeId;
    } else if (activeTab === 'skill') {
      payloadData.chapterId = formData.chapterId;
      payloadData.code = formData.code;
      payloadData.templateId = formData.templateId;
      payloadData.engine = formData.engine;
      payloadData.remediation = formData.remediation
        ? formData.remediation.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      if (skillDifficultyScaling) {
        const cleanedLevels = skillTemplateLevels.map(l => ({
          level: l.level,
          templateIds: l.templateIds.map(t => String(t || '').trim()).filter(Boolean)
        })).filter(l => l.templateIds.length > 0);
        
        if (cleanedLevels.length === 0) {
          setError('Please add at least one template ID under a level to use difficulty scaling.');
          setLoading(false);
          return;
        }
        
        payloadData.templateLevels = cleanedLevels;
        payloadData.metadata = {
          difficultyScaling: true,
          templateLevels: cleanedLevels
        };
        
        // Use first template of level 1 as fallback templateId
        const level1 = cleanedLevels.find(l => l.level === 1);
        if (level1 && level1.templateIds.length > 0) {
          payloadData.templateId = level1.templateIds[0];
        }
      } else {
        payloadData.templateLevels = null;
        payloadData.metadata = null;
      }
    }

    try {
      const res = await fetch('/api/v2/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          data: payloadData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Clear form and edit state
        setEditingId(null);
        setFormData({
          id: '',
          title: '',
          icon: '',
          order: 0,
          subjectId: '',
          unitId: '',
          gradeId: '',
          chapterId: '',
          code: '',
          templateId: '',
          engine: '',
          templateLevels: '',
          remediation: '',
        });
        setSkillDifficultyScaling(false);
        setSkillTemplateLevels([
          { level: 1, templateIds: [] },
          { level: 2, templateIds: [] },
          { level: 3, templateIds: [] },
        ]);
        setLevelAddInputs({ 1: '', 2: '', 3: '' });
        fetchData();
      } else {
        setError(data.error || 'Failed to save node.');
      }
    } catch (err) {
      setError('API connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/curriculum?type=${activeTab}&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (editingId === id) {
          handleCancelEdit();
        }
        fetchData();
      } else {
        alert(`Delete failed: ${data.error}`);
      }
    } catch (err) {
      alert('Delete API connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve collection display list
  const getActiveList = () => {
    switch (activeTab) {
      case 'grade': return grades;
      case 'subject': return subjects;
      case 'unit': return units;
      case 'chapter': return chapters;
      case 'skill': return skills;
      default: return [];
    }
  };

  const currentList = getActiveList();

  // Render guides based on active tab
  const renderGuide = () => {
    switch (activeTab) {
      case 'grade':
        return (
          <div style={guideStyle}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>🎓 Grade Creation Guide</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Register child-level segments (e.g. ID: <code>lkg</code>, Title: <code>LKG</code>). The <strong>Order</strong> value determines its position in the grades lists on the main dashboard.
            </p>
          </div>
        );
      case 'subject':
        return (
          <div style={guideStyle}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📚 Subject Creation Guide</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Add a core topic of study (e.g. ID: <code>math</code>, Title: <code>Math</code>). Use an emoji in the <strong>Emoji Icon</strong> field (e.g. 🧮 or 📚) to render beautifully in frontend buttons.
            </p>
          </div>
        );
      case 'unit':
        return (
          <div style={guideStyle}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📂 Unit (Topic) Creation Guide</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Group chapters into parent topics (e.g. ID: <code>counting</code>, Title: <code>Counting & Cardinality</code>). You must link this unit to an existing **Subject** from the dropdown.
            </p>
          </div>
        );
      case 'chapter':
        return (
          <div style={guideStyle}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📖 Chapter Creation Guide</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Create folders that house practice skills (e.g. ID: <code>counting-5</code>, Title: <code>Numbers up to 5</code>). Chapters must be linked to a **Unit (Topic)** and a **Grade level** (e.g., LKG).
            </p>
          </div>
        );
      case 'skill':
        return (
          <div style={guideStyle}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>💡 Skill & Template Connection Guide</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
              <li><strong>Skill Code</strong>: Used as the card number tag (e.g. <code>C.1</code> or <code>A.2</code>).</li>
              <li><strong>Template ID</strong>: Copy the unique ID from your <a href="/admin/templates" target="_blank" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}>Template Editor</a> (e.g., <code>template-1780746102249</code>).</li>
              <li><strong>Engine</strong>: Set to <code>universal-template</code> if rendering template editor designs dynamically. Use <code>StickersEngine</code> / <code>PhonicsEngine</code> for hardcoded generators.</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#1e293b',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            🛠️ Curriculum Builder V2
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
            Manage decoupled curriculum collections parallel to legacy routes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleSeed}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #7a56d6, #6366f1)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🌱 Seed V2 Default Data
          </button>
          <Link 
            href="/grades-v2"
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            👁️ View Grades V2
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #cbd5e1' }}>
        {['grade', 'subject', 'unit', 'chapter', 'skill'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === tab ? '#2563eb' : '#64748b',
              borderBottom: activeTab === tab ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: '-1px',
              textTransform: 'capitalize',
            }}
          >
            {tab}s
          </button>
        ))}
      </nav>

      {/* Error block */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          fontWeight: 600,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Work Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Creation Panel */}
        <section style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          alignSelf: 'start',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: 800, textTransform: 'capitalize' }}>
            {editingId ? 'Edit' : 'Create New'} {activeTab}
          </h2>
          
          {/* Guide Card */}
          {renderGuide()}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Common field: ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Unique ID (Slug)</label>
              <input 
                type="text" 
                name="id" 
                disabled={!!editingId}
                value={formData.id} 
                onChange={handleInputChange}
                placeholder="e.g. lkg-math-counting"
                style={{ 
                  padding: '0.6rem', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '6px',
                  background: editingId ? '#f1f5f9' : '#fff',
                  cursor: editingId ? 'not-allowed' : 'text',
                }}
              />
              <small style={{ color: '#94a3b8' }}>
                {editingId ? 'ID cannot be renamed once created.' : 'Leave blank to auto-generate from title'}
              </small>
            </div>

            {/* Common field: Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Title / Name</label>
              <input 
                type="text" 
                name="title" 
                required
                value={formData.title} 
                onChange={handleInputChange}
                placeholder={`e.g. My New ${activeTab}`}
                style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            {/* Subject Specific: Icon */}
            {activeTab === 'subject' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Emoji Icon</label>
                <input 
                  type="text" 
                  name="icon" 
                  value={formData.icon} 
                  onChange={handleInputChange}
                  placeholder="e.g. 🧮"
                  style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            )}

            {/* Unit Specific: Subject Dropdown */}
            {activeTab === 'unit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Subject</label>
                <select 
                  name="subjectId" 
                  required
                  value={formData.subjectId} 
                  onChange={handleInputChange}
                  style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            )}

            {/* Chapter Specific: Unit & Grade Dropdowns */}
            {activeTab === 'chapter' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Unit (Topic)</label>
                  <select 
                    name="unitId" 
                    required
                    value={formData.unitId} 
                    onChange={handleInputChange}
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Grade</label>
                  <select 
                    name="gradeId" 
                    required
                    value={formData.gradeId} 
                    onChange={handleInputChange}
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="">-- Select Grade --</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Skill Specific: Chapter, Code, Template, Engine */}
            {activeTab === 'skill' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Chapter</label>
                  <select 
                    name="chapterId" 
                    required
                    value={formData.chapterId} 
                    onChange={handleInputChange}
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="">-- Select Chapter --</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Skill Code</label>
                  <input 
                    type="text" 
                    name="code" 
                    required
                    value={formData.code} 
                    onChange={handleInputChange}
                    placeholder="e.g. A.1"
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                <div className="suggestion-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Template ID</label>
                  <input 
                    type="text" 
                    name="templateId" 
                    required
                    value={formData.templateId} 
                    onChange={(e) => {
                      handleInputChange(e);
                      setActiveSuggestionBox('primary');
                    }}
                    onFocus={() => setActiveSuggestionBox('primary')}
                    placeholder="e.g. fractions-g5-add-like-fractions"
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                  {renderSuggestions(
                    formData.templateId, 
                    (tid) => setFormData(prev => ({ ...prev, templateId: tid })), 
                    'primary'
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Engine</label>
                  <input 
                    type="text" 
                    name="engine" 
                    required
                    value={formData.engine} 
                    onChange={handleInputChange}
                    placeholder="e.g. StickersEngine"
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
                {/* Difficulty Scaling Visual Configurator */}
                <div style={{ marginTop: '4px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={skillDifficultyScaling}
                      onChange={e => {
                        setSkillDifficultyScaling(e.target.checked);
                        if (e.target.checked && formData.templateId) {
                          const primaryId = formData.templateId.trim();
                          if (primaryId) {
                            setSkillTemplateLevels(prev => prev.map(l =>
                              l.level === 1 && l.templateIds.length === 0
                                ? { ...l, templateIds: [primaryId] }
                                : l
                            ));
                          }
                        }
                      }}
                    />
                    ⚡ Enable Difficulty Scaling (multiple templates per level)
                  </label>

                  {skillDifficultyScaling && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { level: 1, label: 'Level 1 — Easy (Streak < 3)', color: '#dcfce7', border: '#86efac', badge: '#16a34a' },
                        { level: 2, label: 'Level 2 — Medium (Streak 3-5)', color: '#fef9c3', border: '#fde047', badge: '#ca8a04' },
                        { level: 3, label: 'Level 3 — Hard (Streak ≥ 6)', color: '#fee2e2', border: '#fca5a5', badge: '#dc2626' },
                      ].map(({ level, label, color, border, badge }) => {
                        const levelData = skillTemplateLevels.find(l => l.level === level) || { level, templateIds: [] };
                        return (
                          <div key={level} style={{ border: `1px solid ${border}`, borderRadius: '8px', background: '#fff', padding: '8px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>{label}</span>
                              <span style={{ background: badge, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '11px' }}>
                                {levelData.templateIds.length} template{levelData.templateIds.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px', marginBottom: '8px' }}>
                              {levelData.templateIds.length === 0 && (
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No templates — add below</span>
                              )}
                              {levelData.templateIds.map((tid, ti) => (
                                <span key={ti} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  background: color, border: `1px solid ${border}`, borderRadius: '6px',
                                  padding: '2px 8px', fontSize: '11px', fontWeight: 600
                                }}>
                                  {tid}
                                  <button
                                    type="button"
                                    onClick={() => setSkillTemplateLevels(prev => prev.map(l =>
                                      l.level === level
                                        ? { ...l, templateIds: l.templateIds.filter((_, i) => i !== ti) }
                                        : l
                                    ))}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900, padding: '0 2px', fontSize: '13px', lineHeight: 1 }}
                                  >×</button>
                                </span>
                              ))}
                            </div>

                            {/* Input row */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                              <div className="suggestion-container" style={{ flex: 1, position: 'relative' }}>
                                <input
                                  type="text"
                                  style={{ width: '100%', fontSize: '12px', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                                  placeholder="Template ID (e.g. template-id)"
                                  value={levelAddInputs[level] || ''}
                                  onChange={e => {
                                    setLevelAddInputs(prev => ({ ...prev, [level]: e.target.value }));
                                    setActiveSuggestionBox(String(level));
                                  }}
                                  onFocus={() => setActiveSuggestionBox(String(level))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (levelAddInputs[level] || '').trim();
                                      if (val && !levelData.templateIds.includes(val)) {
                                        setSkillTemplateLevels(prev => prev.map(l =>
                                          l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                        ));
                                        setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                      }
                                    }
                                  }}
                                />
                                {renderSuggestions(
                                  levelAddInputs[level], 
                                  (tid) => {
                                    if (!levelData.templateIds.includes(tid)) {
                                      setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level ? { ...l, templateIds: [...l.templateIds, tid] } : l
                                      ));
                                    }
                                    setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                  }, 
                                  String(level)
                                )}
                              </div>
                              <button
                                type="button"
                                style={{ fontSize: '11px', padding: '4px 10px', background: badge, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700 }}
                                onClick={() => {
                                  const val = (levelAddInputs[level] || '').trim();
                                  if (val && !levelData.templateIds.includes(val)) {
                                    setSkillTemplateLevels(prev => prev.map(l =>
                                      l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                    ));
                                    setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                  }
                                }}
                              >+ Add</button>
                              {formData.templateId && formData.templateId.trim() && !levelData.templateIds.includes(formData.templateId.trim()) && (
                                <button
                                  type="button"
                                  style={{ fontSize: '11px', padding: '4px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    const val = formData.templateId.trim();
                                    setSkillTemplateLevels(prev => prev.map(l =>
                                      l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                    ));
                                  }}
                                >★ Use Primary</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Remediation (comma-separated skill IDs)</label>
                    <input 
                      type="text" 
                      name="remediation" 
                      value={formData.remediation || ''} 
                      onChange={handleInputChange}
                      placeholder="e.g. count-1-to-5, letter-sounds-a"
                      style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Common field: Order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Order / Sort Rank</label>
              <input 
                type="number" 
                name="order" 
                value={formData.order} 
                onChange={handleInputChange}
                style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  flex: 1,
                  background: editingId ? '#16a34a' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Processing...' : editingId ? `Update ${activeTab}` : `Create ${activeTab}`}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  style={{
                    background: '#64748b',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List Viewer Panel */}
        <section style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: 800, textTransform: 'capitalize', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            Current {activeTab}s List ({currentList.length})
          </h2>
          
          {currentList.length === 0 ? (
            <p style={{ color: '#94a3b8', margin: '2rem 0', textAlign: 'center' }}>No items in this collection yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>ID</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>Title</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>Order</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', color: '#0f172a' }}>{item.id}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                        {activeTab === 'subject' && (item.icon ? `${item.icon} ` : '📚 ')}
                        {item.title}
                        {activeTab === 'unit' && <small style={{ display: 'block', color: '#94a3b8', fontWeight: 400 }}>Subject: {item.subjectId}</small>}
                        {activeTab === 'chapter' && <small style={{ display: 'block', color: '#94a3b8', fontWeight: 400 }}>Unit: {item.unitId} | Grade: {item.gradeId}</small>}
                        {activeTab === 'skill' && (
                          <>
                            <small style={{ display: 'block', color: '#94a3b8', fontWeight: 400 }}>Chapter: {item.chapterId} | Code: {item.code}</small>
                            {item.templateLevels && (
                              <small style={{ display: 'block', color: '#16a34a', fontWeight: 600 }}>
                                ⚡ Levels: {item.templateLevels.map(l => `L${l.level} (${l.templateIds ? l.templateIds.length : 0})`).join(', ')}
                              </small>
                            )}
                            <a 
                              href={`/practice?subject=${item.subjectId || 'science'}&topic=${item.topicId || 'general'}&skill=${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.8rem', display: 'inline-block', marginTop: '0.25rem' }}
                            >
                              🔗 Test URL
                            </a>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: '#475569' }}>{item.order}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleEditClick(item)}
                            disabled={loading}
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: 'none',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={loading}
                            style={{
                              background: '#fee2e2',
                              color: '#ef4444',
                              border: 'none',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// Styling tokens
const guideStyle = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '1.25rem',
  fontSize: '0.85rem',
  color: '#1e3a8a',
};
