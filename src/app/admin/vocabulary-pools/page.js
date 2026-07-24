'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

/* ─── Dark Light-Blue Theme Tokens ────────────────────────────────────────────
   BG:     #06101e (root), #0c1a2e (panel), #0f1f35 (card), #132436 (input)
   Accent: #0ea5e9 (sky-500), #38bdf8 (sky-400), #7dd3fc (sky-300)
   Border: rgba(14,165,233,0.15) subtle  |  rgba(14,165,233,0.35) active
   Text:   #f0f9ff (main), #94a3b8 (muted), #38bdf8 (accent)
   ─────────────────────────────────────────────────────────────────────────── */

const T = {
  rootBg:        '#06101e',
  panelBg:       'rgba(12,26,46,0.75)',
  cardBg:        'rgba(15,31,53,0.6)',
  inputBg:       '#0d1e33',
  deepBg:        '#060f1b',

  accent:        '#0ea5e9',
  accentLight:   '#38bdf8',
  accentXLight:  '#7dd3fc',
  accentGlow:    'rgba(14,165,233,0.18)',
  accentBorder:  'rgba(14,165,233,0.3)',
  accentActiveBg:'rgba(14,165,233,0.12)',

  success:       '#10b981',
  successBg:     'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.35)',

  danger:        '#f87171',
  dangerBg:      'rgba(239,68,68,0.1)',
  dangerBorder:  'rgba(239,68,68,0.3)',

  textMain:      '#e0f2fe',
  textSub:       '#94a3b8',
  textMuted:     '#475569',
  textAccent:    '#38bdf8',

  borderSubtle:  'rgba(14,165,233,0.12)',
  borderNormal:  'rgba(14,165,233,0.22)',
  borderActive:  'rgba(14,165,233,0.5)',

  radius:        '14px',
  radiusSm:      '8px',
  blur:          'blur(14px)',
};

const inputStyle = {
  width: '100%',
  background: T.inputBg,
  border: `1px solid ${T.borderNormal}`,
  borderRadius: T.radiusSm,
  padding: '7px 11px',
  color: T.textMain,
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export default function VocabularyPoolsPage() {
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [activePool, setActivePool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notFoundPoolId, setNotFoundPoolId] = useState('');

  const [editorTab, setEditorTab] = useState('items');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPoolId, setNewPoolId] = useState('');
  const [newPoolSubject, setNewPoolSubject] = useState('science');
  const [newPoolTopic, setNewPoolTopic] = useState('general');
  const [newPoolCategories, setNewPoolCategories] = useState('');
  const [createError, setCreateError] = useState('');

  const [aiCategory, setAiCategory] = useState('');
  const [aiCount, setAiCount] = useState(6);
  const [aiInstruction, setAiInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  const [selectedCategoryTab, setSelectedCategoryTab] = useState('');

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/vocabulary-pools');
      const data = await res.json();
      if (data.success) setPools(data.pools || []);
    } catch (err) {
      console.error('Failed to load pools:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPool = async (poolId) => {
    setSelectedPoolId(poolId);
    setJsonError('');
    setAiSuccessMsg('');
    setNotFoundPoolId('');
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId)}`);
      const data = await res.json();
      if (data.success && data.pool) {
        setActivePool(data.pool);
        setJsonText(JSON.stringify(data.pool, null, 2));
        const cats = Object.keys(data.pool.pools || {});
        setSelectedCategoryTab(cats[0] || '');
      } else {
        setNotFoundPoolId(poolId);
        setActivePool(null);
      }
    } catch (err) {
      console.error('Failed to fetch pool details:', err);
      setNotFoundPoolId(poolId);
      setActivePool(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchPools();
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlPoolId = params.get('poolId') || params.get('id');
        if (urlPoolId) {
          selectPool(urlPoolId);
        }
      }
    };
    load();
  }, []);

  const saveActivePool = async (poolData = activePool) => {
    if (!poolData || !poolData.poolId) return;
    setSaving(true);
    setJsonError('');
    try {
      const res = await fetch('/api/admin/vocabulary-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poolData)
      });
      const data = await res.json();
      if (data.success) {
        setActivePool(poolData);
        setJsonText(JSON.stringify(poolData, null, 2));
        await fetchPools();
      } else {
        setJsonError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      setJsonError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.poolId) throw new Error('Missing "poolId" property in JSON.');
      if (!parsed.pools) throw new Error('Missing "pools" object containing categories.');
      setActivePool(parsed);
      saveActivePool(parsed);
    } catch (err) {
      setJsonError('⚠️ Invalid JSON: ' + err.message);
    }
  };

  const handleDeletePool = async (poolId) => {
    if (!confirm(`Are you absolutely sure you want to delete the pool "${poolId}"? This action cannot be undone.`)) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActivePool(null);
        setSelectedPoolId('');
        await fetchPools();
      } else {
        alert(data.error || 'Failed to delete pool.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePool = async () => {
    setCreateError('');
    const id = newPoolId.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) { setCreateError('Pool ID is required'); return; }
    const categoriesList = newPoolCategories.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    const newDoc = { poolId: id, subject: newPoolSubject, topic: newPoolTopic, pools: Object.fromEntries(categoriesList.map(c => [c, []])) };
    try {
      setSaving(true);
      const res = await fetch('/api/admin/vocabulary-pools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDoc) });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewPoolId('');
        setNewPoolCategories('');
        await fetchPools();
        selectPool(id);
      } else {
        setCreateError(data.error || 'Failed to create pool');
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiCategory.trim() || !activePool) return;
    setGenerating(true);
    setJsonError('');
    setAiSuccessMsg('');
    try {
      const res = await fetch('/api/admin/vocabulary-pools/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId: activePool.poolId, category: aiCategory.trim(), subject: activePool.subject || 'science', topic: activePool.topic || 'general', count: Number(aiCount) || 6, instruction: aiInstruction })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const updated = JSON.parse(JSON.stringify(activePool));
        updated.pools = updated.pools || {};
        updated.pools[aiCategory] = [...(updated.pools[aiCategory] || []), ...data.items];
        setActivePool(updated);
        setJsonText(JSON.stringify(updated, null, 2));
        saveActivePool(updated);
        setAiSuccessMsg(`✨ AI successfully generated and added ${data.items.length} items to "${aiCategory}"!`);
        setAiInstruction('');
      } else {
        setJsonError(data.error || 'AI generation failed');
      }
    } catch (err) {
      setJsonError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateItem = (category, index, key, value) => {
    if (!activePool) return;
    const updated = JSON.parse(JSON.stringify(activePool));
    updated.pools[category][index][key] = value;
    setActivePool(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleDeleteItem = (category, index) => {
    if (!activePool) return;
    const updated = JSON.parse(JSON.stringify(activePool));
    updated.pools[category].splice(index, 1);
    setActivePool(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleAddItem = (category) => {
    if (!activePool) return;
    const updated = JSON.parse(JSON.stringify(activePool));
    updated.pools[category] = updated.pools[category] || [];
    updated.pools[category].push({ id: `${category}_item_${Date.now().toString().slice(-4)}`, label: '', content: '', active: true, imageUrl: '', audioUrl: '' });
    setActivePool(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleAddCategory = () => {
    const name = prompt('Enter new category name:');
    if (!name || !activePool) return;
    const catName = name.trim().toLowerCase();
    if (activePool.pools[catName]) { alert('Category already exists!'); return; }
    const updated = JSON.parse(JSON.stringify(activePool));
    updated.pools[catName] = [];
    setActivePool(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setSelectedCategoryTab(catName);
  };

  const playAudio = (url, labelText) => {
    if (url) {
      new Audio(url).play().catch(e => console.error('Audio play failed:', e));
    } else {
      const synth = window.speechSynthesis;
      if (synth) { const u = new SpeechSynthesisUtterance(labelText || 'No audio file'); u.rate = 0.85; synth.speak(u); }
    }
  };

  const filteredPools = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return (pools || []).filter(p => p && ((p.poolId || p.id || '').toLowerCase().includes(q) || (p.subject || '').toLowerCase().includes(q) || (p.topic || '').toLowerCase().includes(q)));
  }, [pools, searchQuery]);

  /* ── Tab button renderer ── */
  const TabBtn = ({ id, icon, label }) => (
    <button
      onClick={() => setEditorTab(id)}
      style={{
        background: editorTab === id ? T.accentActiveBg : 'transparent',
        border: editorTab === id ? `1px solid ${T.accentBorder}` : '1px solid transparent',
        color: editorTab === id ? T.accentLight : T.textSub,
        fontSize: '13px',
        fontWeight: '600',
        padding: '7px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: T.rootBg,
      backgroundImage: `radial-gradient(ellipse at 0% 0%, rgba(14,165,233,0.07) 0, transparent 55%),
                        radial-gradient(ellipse at 100% 100%, rgba(56,189,248,0.05) 0, transparent 55%)`,
      color: T.textMain,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '24px',
    }}>

      {/* ─── Top Navbar ─── */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: T.panelBg,
        backdropFilter: T.blur,
        border: `1px solid ${T.borderSubtle}`,
        borderTop: `2px solid ${T.accentBorder}`,
        borderRadius: T.radius,
        padding: '16px 24px',
        marginBottom: '24px',
        boxShadow: `0 4px 32px rgba(14,165,233,0.06)`,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '10px', color: T.textMain }}>
            <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', borderRadius: '8px', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: `0 0 16px ${T.accentGlow}` }}>📦</span>
            Vocabulary Option Pools Manager
          </h1>
          <p style={{ margin: '5px 0 0 42px', fontSize: '12px', color: T.textSub }}>
            Create and edit structured vocab databases used in dynamic question templates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/option-pooling-playground" style={{
            background: T.cardBg, border: `1px solid ${T.borderNormal}`,
            padding: '8px 16px', borderRadius: T.radiusSm,
            color: T.textSub, fontSize: '13px', fontWeight: '600',
            textDecoration: 'none', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            🎮 Playground Simulator
          </Link>
          <Link href="/admin/templates" style={{
            background: T.cardBg, border: `1px solid ${T.borderNormal}`,
            padding: '8px 16px', borderRadius: T.radiusSm,
            color: T.textSub, fontSize: '13px', fontWeight: '600',
            textDecoration: 'none', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ← Template Editor
          </Link>
        </div>
      </header>

      {/* ─── Main Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Left Sidebar ── */}
        <aside style={{
          background: T.panelBg, backdropFilter: T.blur,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: T.radius, padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '14px',
          boxShadow: `0 4px 24px rgba(14,165,233,0.05)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: T.textMain, letterSpacing: '0.02em' }}>
              Vocabulary Pools
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                border: 'none', color: '#fff',
                fontSize: '12px', fontWeight: '700',
                padding: '6px 14px', borderRadius: '8px',
                cursor: 'pointer', boxShadow: `0 4px 14px rgba(14,165,233,0.35)`,
                transition: 'all 0.2s',
              }}
            >
              ➕ Create Pool
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle }}
          />

          {/* Pool List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 'calc(100vh - 290px)', overflowY: 'auto', paddingRight: '2px' }}>
            {filteredPools.map(p => {
              const isActive = selectedPoolId === p.poolId;
              return (
                <div
                  key={p.poolId}
                  onClick={() => selectPool(p.poolId)}
                  style={{
                    background: isActive ? T.accentActiveBg : 'rgba(14,165,233,0.03)',
                    border: isActive ? `1px solid ${T.borderActive}` : `1px solid ${T.borderSubtle}`,
                    borderRadius: '10px', padding: '12px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative',
                    boxShadow: isActive ? `0 0 16px rgba(14,165,233,0.12)` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? T.accentLight : T.textMain, wordBreak: 'break-all', lineHeight: 1.3 }}>
                      {p.poolId}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePool(p.poolId); }}
                      style={{ background: 'none', border: 'none', color: T.danger, fontSize: '12px', cursor: 'pointer', opacity: 0.6, padding: 0, flexShrink: 0 }}
                      title="Delete Pool"
                    >🗑️</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '10px', color: T.textSub }}>
                    <span>📚 {Object.keys(p.categoryCounts || {}).length} categories</span>
                    <span>•</span>
                    <span>Items: {Object.values(p.categoryCounts || {}).reduce((a, b) => a + b, 0)}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {Object.keys(p.categoryCounts || {}).slice(0, 4).map(c => (
                      <span key={c} style={{
                        background: 'rgba(14,165,233,0.08)', color: T.accentXLight,
                        borderRadius: '4px', padding: '2px 6px', fontSize: '9px', fontWeight: '600',
                      }}>{c} ({p.categoryCounts[c]})</span>
                    ))}
                    {Object.keys(p.categoryCounts || {}).length > 4 && (
                      <span style={{ fontSize: '9px', color: T.textMuted, alignSelf: 'center' }}>+more</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredPools.length === 0 && (
              <div style={{ textAlign: 'center', color: T.textMuted, fontSize: '13px', padding: '32px 0' }}>
                No pools found
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Editor Workspace ── */}
        <main style={{
          background: T.panelBg, backdropFilter: T.blur,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: T.radius, padding: '24px',
          minHeight: '600px',
          boxShadow: `0 4px 32px rgba(14,165,233,0.05)`,
        }}>
          {activePool ? (
            <div>
              {/* Pool Info Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `1px solid ${T.borderSubtle}`,
                paddingBottom: '16px', marginBottom: '20px',
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: T.textMain, letterSpacing: '-0.02em' }}>
                    {activePool.poolId}
                  </h2>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', color: T.textSub }}>
                    <span>Subject: <strong style={{ color: T.accentXLight }}>{activePool.subject || 'N/A'}</strong></span>
                    <span>Topic: <strong style={{ color: T.accentXLight }}>{activePool.topic || 'N/A'}</strong></span>
                    <span>Grade: <strong style={{ color: T.accentXLight }}>{activePool.grade || 'N/A'}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link href={`/admin/option-pooling-playground?poolId=${activePool.poolId}`} style={{
                    background: T.accentActiveBg, border: `1px solid ${T.accentBorder}`,
                    padding: '8px 14px', borderRadius: T.radiusSm,
                    color: T.accentLight, fontSize: '12px', fontWeight: '600',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    🎮 Test in Practice Simulator
                  </Link>
                  <button
                    onClick={() => saveActivePool()}
                    disabled={saving}
                    style={{
                      background: `linear-gradient(135deg, ${T.success}, #059669)`,
                      border: 'none', color: '#fff',
                      fontSize: '12px', fontWeight: '700',
                      padding: '8px 18px', borderRadius: T.radiusSm,
                      cursor: 'pointer', opacity: saving ? 0.7 : 1,
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    {saving ? '💾 Saving...' : '💾 Save Pool Changes'}
                  </button>
                </div>
              </div>

              {/* Editor Tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: `1px solid ${T.borderSubtle}`, paddingBottom: '10px' }}>
                <TabBtn id="items" icon="📝" label="Visual Items Editor" />
                <TabBtn id="json"  icon="📁" label="Raw JSON Editor" />
                <TabBtn id="ai"    icon="✨" label="AI Generator (Gemini)" />
              </div>

              {/* ── Tab: Visual Items Editor ── */}
              {editorTab === 'items' && (
                <div>
                  {/* Category Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {Object.keys(activePool.pools || {}).map(cat => {
                      const isSelected = selectedCategoryTab === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategoryTab(cat)}
                          style={{
                            background: isSelected ? `linear-gradient(135deg, rgba(14,165,233,0.25), rgba(56,189,248,0.15))` : 'rgba(14,165,233,0.05)',
                            border: isSelected ? `1px solid ${T.accentBorder}` : `1px solid ${T.borderSubtle}`,
                            borderRadius: '8px',
                            color: isSelected ? T.accentLight : T.textSub,
                            fontSize: '12px', fontWeight: '600',
                            padding: '6px 14px', cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 12px rgba(14,165,233,0.15)` : 'none',
                          }}
                        >
                          {cat} ({activePool.pools[cat]?.length || 0})
                        </button>
                      );
                    })}
                    <button
                      onClick={handleAddCategory}
                      style={{
                        background: T.successBg, border: `1px dashed ${T.successBorder}`,
                        borderRadius: '8px', color: T.success,
                        fontSize: '12px', fontWeight: '600',
                        padding: '6px 14px', cursor: 'pointer',
                      }}
                    >
                      ➕ Add Category
                    </button>
                  </div>

                  {/* Items Grid */}
                  {selectedCategoryTab && activePool.pools[selectedCategoryTab] ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: T.textSub }}>
                          Items in category <strong style={{ color: T.accentXLight }}>"{selectedCategoryTab}"</strong>
                        </span>
                        <button
                          onClick={() => handleAddItem(selectedCategoryTab)}
                          style={{
                            background: T.accentActiveBg,
                            border: `1px solid ${T.accentBorder}`,
                            borderRadius: '6px', color: T.accentLight,
                            fontSize: '12px', fontWeight: '600',
                            padding: '5px 12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          ➕ Add New Row
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activePool.pools[selectedCategoryTab].map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: T.cardBg,
                              border: `1px solid ${T.borderSubtle}`,
                              borderRadius: '12px', padding: '14px 16px',
                              display: 'grid',
                              gridTemplateColumns: '150px 1.5fr 1.5fr 80px',
                              gap: '14px', alignItems: 'center',
                              transition: 'border-color 0.2s',
                            }}
                          >
                            {/* ID + Active */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Item ID"
                                value={item.id || ''}
                                onChange={(e) => handleUpdateItem(selectedCategoryTab, idx, 'id', e.target.value)}
                                style={{ ...inputStyle, fontSize: '11px' }}
                              />
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.textSub, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={item.active !== false}
                                  onChange={(e) => handleUpdateItem(selectedCategoryTab, idx, 'active', e.target.checked)}
                                  style={{ accentColor: T.accent }}
                                />
                                Active
                              </label>
                            </div>

                            {/* Label & Content */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: T.textMuted, marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Label text</label>
                                <input type="text" placeholder="e.g. Lion" value={item.label || ''} onChange={(e) => handleUpdateItem(selectedCategoryTab, idx, 'label', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: T.textMuted, marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content/Emoji</label>
                                <input type="text" placeholder="e.g. 🦁" value={item.content || ''} onChange={(e) => handleUpdateItem(selectedCategoryTab, idx, 'content', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }} />
                              </div>
                            </div>

                            {/* URLs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: T.textMuted, marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image URL</label>
                                <input type="text" placeholder="https://..." value={item.imageUrl || ''} onChange={(e) => handleUpdateItem(selectedCategoryTab, idx, 'imageUrl', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: T.textMuted, marginBottom: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audio URL</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input type="text" placeholder="TTS auto-fallback" value={item.audioUrl || ''} onChange={(e) => handleUpdateItem(selectedCategoryTab, idx, 'audioUrl', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }} />
                                  <button
                                    onClick={() => playAudio(item.audioUrl, item.label || item.id)}
                                    style={{ background: 'rgba(14,165,233,0.12)', border: `1px solid ${T.borderNormal}`, borderRadius: '6px', cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}
                                    title="Play audio"
                                  >🔊</button>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.label} style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: T.deepBg, border: `1px solid ${T.borderSubtle}` }}
                                  onError={(e) => { e.target.style.display = 'none'; }} />
                              )}
                              <button
                                onClick={() => handleDeleteItem(selectedCategoryTab, idx)}
                                style={{ background: 'none', border: 'none', color: T.danger, fontSize: '16px', cursor: 'pointer', opacity: 0.7 }}
                                title="Delete item"
                              >🗑️</button>
                            </div>
                          </div>
                        ))}

                        {activePool.pools[selectedCategoryTab].length === 0 && (
                          <div style={{
                            textAlign: 'center', padding: '48px 24px',
                            background: 'rgba(14,165,233,0.03)',
                            border: `1px dashed ${T.borderNormal}`,
                            borderRadius: '12px', color: T.textMuted,
                            fontSize: '13px',
                          }}>
                            No items in category "{selectedCategoryTab}". Click "➕ Add New Row" or use the ✨ AI tab to populate!
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: T.textMuted, textAlign: 'center', padding: '48px', fontSize: '13px' }}>
                      Please select a category or create a new one to start adding items.
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Raw JSON Editor ── */}
              {editorTab === 'json' && (
                <div>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    style={{
                      width: '100%', height: '460px',
                      background: T.deepBg,
                      border: `1px solid ${T.borderNormal}`,
                      borderRadius: '10px', padding: '16px',
                      color: '#38bdf8',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: '12px', lineHeight: '1.6',
                      outline: 'none', resize: 'vertical',
                    }}
                  />
                  {jsonError && (
                    <div style={{ marginTop: '12px', padding: '12px', background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: '8px', color: T.danger, fontSize: '13px' }}>
                      {jsonError}
                    </div>
                  )}
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSaveJson}
                      disabled={saving}
                      style={{
                        background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                        border: 'none', color: '#fff',
                        fontSize: '13px', fontWeight: '700',
                        padding: '10px 24px', borderRadius: T.radiusSm,
                        cursor: 'pointer', boxShadow: `0 4px 14px rgba(14,165,233,0.3)`,
                      }}
                    >
                      Apply & Save JSON
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab: AI Generator ── */}
              {editorTab === 'ai' && (
                <div style={{
                  background: 'rgba(14,165,233,0.04)',
                  border: `1px solid ${T.borderSubtle}`,
                  borderRadius: '12px', padding: '24px',
                  display: 'flex', flexDirection: 'column', gap: '18px',
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: T.textMain, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: T.accentLight }}>✨</span> Populate Category with Gemini AI
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: T.textSub }}>
                      AI will generate vocabulary items and automatically add them to the selected category.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: T.textMain, marginBottom: '6px', fontWeight: '600' }}>Category Target Name</label>
                      <input type="text" placeholder="e.g. circle, square, action-verbs" value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: T.textMain, marginBottom: '6px', fontWeight: '600' }}>Number of Items to Generate</label>
                      <input type="number" min="2" max="20" value={aiCount} onChange={(e) => setAiCount(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: T.textMain, marginBottom: '6px', fontWeight: '600' }}>Additional Prompt / Constraints (Optional)</label>
                    <textarea
                      placeholder="e.g. generate animals with simple names, include only emojis of forest animals..."
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      style={{ ...inputStyle, height: '80px', resize: 'none' }}
                    />
                  </div>

                  {jsonError && <div style={{ color: T.danger, fontSize: '12px' }}>⚠️ Error: {jsonError}</div>}
                  {aiSuccessMsg && <div style={{ color: T.success, fontSize: '12px', fontWeight: '600' }}>{aiSuccessMsg}</div>}

                  <button
                    onClick={handleAiGenerate}
                    disabled={generating || !aiCategory}
                    style={{
                      background: generating || !aiCategory
                        ? 'rgba(14,165,233,0.15)'
                        : `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                      border: `1px solid ${T.accentBorder}`,
                      color: generating || !aiCategory ? T.textSub : '#fff',
                      fontSize: '13px', fontWeight: '700',
                      padding: '11px 24px', borderRadius: T.radiusSm,
                      cursor: generating || !aiCategory ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      alignSelf: 'flex-start',
                      boxShadow: generating || !aiCategory ? 'none' : `0 4px 16px rgba(14,165,233,0.3)`,
                    }}
                  >
                    {generating ? '✨ Generating...' : '✨ Run Gemini Pool Generator'}
                  </button>
                </div>
              )}
            </div>
          ) : notFoundPoolId ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', gap: '16px', padding: '2rem', textAlign: 'center' }}>
              <span style={{ fontSize: '56px', filter: 'drop-shadow(0 0 24px rgba(248,113,113,0.3))' }}>⚠️</span>
              <h3 style={{ margin: 0, color: T.textMain, fontSize: '18px', fontWeight: '800' }}>Option Pool Not Found</h3>
              <p style={{ margin: 0, color: T.textSub, fontSize: '13.5px', maxWidth: '420px', lineHeight: 1.5 }}>
                Option pool <code style={{ color: T.accentLight, background: 'rgba(14,165,233,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{notFoundPoolId}</code> does not exist in the database.
              </p>
              <button
                onClick={async () => {
                  const id = notFoundPoolId;
                  const newDoc = { 
                    poolId: id, 
                    subject: id.includes('math') ? 'math' : 'science', 
                    topic: 'general', 
                    pools: { options: [] } 
                  };
                  try {
                    setSaving(true);
                    const res = await fetch('/api/admin/vocabulary-pools', { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify(newDoc) 
                    });
                    const data = await res.json();
                    if (data.success) {
                      setNotFoundPoolId('');
                      await fetchPools();
                      selectPool(id);
                    } else {
                      alert(data.error || 'Failed to create pool');
                    }
                  } catch (err) {
                    alert(err.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                style={{
                  background: T.accent, color: '#ffffff', border: 'none',
                  borderRadius: T.radiusSm, padding: '10px 22px', fontWeight: '700',
                  fontSize: '13px', cursor: 'pointer', boxShadow: `0 4px 14px rgba(14,165,233,0.35)`,
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Creating...' : '➕ Create and Initialize Pool'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px', gap: '12px' }}>
              <span style={{ fontSize: '52px', filter: 'drop-shadow(0 0 24px rgba(14,165,233,0.4))' }}>📦</span>
              <h3 style={{ margin: 0, color: T.textMain, fontSize: '16px' }}>No Pool Selected</h3>
              <p style={{ margin: 0, color: T.textMuted, fontSize: '13px', textAlign: 'center' }}>
                Select a vocabulary pool from the left panel or create a new one to begin editing.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ─── Create Pool Modal ─── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(2,8,20,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 999,
        }}>
          <div style={{
            background: '#0c1a2e',
            border: `1px solid ${T.borderNormal}`,
            borderTop: `2px solid ${T.accentBorder}`,
            borderRadius: '16px', width: '460px', padding: '28px',
            display: 'flex', flexDirection: 'column', gap: '18px',
            boxShadow: `0 24px 64px rgba(14,165,233,0.15)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: T.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: T.accentLight }}>🧪</span> Create New Vocabulary Pool
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: T.textSub, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pool ID (lowercase-kebab-case)</label>
              <input type="text" placeholder="e.g. science-plants-leaves" value={newPoolId} onChange={(e) => setNewPoolId(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: T.textSub, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</label>
                <select value={newPoolSubject} onChange={(e) => setNewPoolSubject(e.target.value)} style={inputStyle}>
                  <option value="science">Science</option>
                  <option value="math">Math</option>
                  <option value="english">English</option>
                  <option value="social">Social Studies</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: T.textSub, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Topic</label>
                <input type="text" placeholder="e.g. general" value={newPoolTopic} onChange={(e) => setNewPoolTopic(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: T.textSub, marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categories (comma-separated)</label>
              <input type="text" placeholder="e.g. circles, squares, triangles" value={newPoolCategories} onChange={(e) => setNewPoolCategories(e.target.value)} style={inputStyle} />
            </div>

            {createError && <div style={{ color: T.danger, fontSize: '12px', fontWeight: '600' }}>⚠️ {createError}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: T.cardBg, border: `1px solid ${T.borderNormal}`, borderRadius: T.radiusSm, padding: '9px 20px', color: T.textSub, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePool}
                disabled={saving}
                style={{
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                  border: 'none', borderRadius: T.radiusSm,
                  padding: '9px 24px', color: '#fff',
                  fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer', opacity: saving ? 0.7 : 1,
                  boxShadow: `0 4px 16px rgba(14,165,233,0.3)`,
                }}
              >
                {saving ? 'Creating...' : 'Create Pool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Global styles ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #334d66; }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(14,165,233,0.5) !important;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #06101e; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.25); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(14,165,233,0.4); }
      `}</style>
    </div>
  );
}
