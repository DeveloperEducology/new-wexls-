'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EXAM_OPTIONS    = ['jnvst', 'imo', 'nso', 'lkg', 'ukg'];
const SUBJECT_OPTIONS = ['math', 'language', 'science', 'mat'];

const BLANK_TOPIC = {
  slug: '', examName: 'jnvst', subject: 'math',
  displayName: '', description: '',
  relatedTopics: [], fallbackQuestions: [], published: false,
  lessonJson: null,
  metaTitle: '', metaDescription: '', metaKeywords: '',
};

const BLANK_QUESTION = {
  questionText: '', options: { A: '', B: '', C: '', D: '' },
  correctOption: 'A', explanationText: '',
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function SeoManagerPage() {
  const [topics, setTopics]         = useState([]);
  const [selected, setSelected]     = useState(null);   // full topic object being edited
  const [isNew, setIsNew]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterSub, setFilterSub]   = useState('');
  const [search, setSearch]         = useState('');
  const [qEditing, setQEditing]     = useState(null);   // index of question being edited
  const [qDraft, setQDraft]         = useState(null);   // draft of that question
  const iframeRef = useRef(null);
  const [editorTab, setEditorTab]   = useState('visual');

  // ── Gallery Modal State & Helpers ──
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTargetIdx, setGalleryTargetIdx] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  async function openGallery(sectionIdx) {
    setGalleryTargetIdx(sectionIdx);
    setGalleryOpen(true);
    setGalleryLoading(true);
    try {
      const res = await fetch('/api/admin/list-images');
      const data = await res.json();
      setGalleryImages(data.images || []);
    } catch (e) {
      console.error('Failed to list gallery images:', e);
    } finally {
      setGalleryLoading(false);
    }
  }

  function selectGalleryImage(url) {
    if (galleryTargetIdx !== null) {
      editSectionField(galleryTargetIdx, 'src', url);
    }
    setGalleryOpen(false);
  }

  // ── AI Lesson Generator Helper ──
  const [generatingLesson, setGeneratingLesson] = useState(false);

  async function handleAiGenerateLesson() {
    if (!selected?.displayName) {
      alert('Please enter a Display Name first so the AI knows what topic to generate.');
      return;
    }
    if (!confirm(`Generate lesson outline using Gemini AI for "${selected.displayName}"? This will replace your current builder sections.`)) {
      return;
    }
    setGeneratingLesson(true);
    try {
      const res = await fetch('/api/admin/seo-topics/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: selected.displayName,
          description: selected.description
        })
      });
      const data = await res.json();
      if (data.lessonJson) {
        handleField('lessonJson', data.lessonJson);
        alert('✨ Lesson explainer outline generated successfully!');
      } else {
        alert('❌ Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Generation failed: ' + err.message);
    } finally {
      setGeneratingLesson(false);
    }
  }

  // ── AI Fallback Questions Generator Helper ──
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  async function handleAiGenerateQuestions() {
    if (!selected?.displayName) {
      alert('Please enter a Display Name first so the AI knows what topic to generate.');
      return;
    }
    const mode = confirm('Generate fallback questions using Gemini AI? Select OK to append to your current questions, or CANCEL to replace them.') ? 'append' : 'replace';
    
    setGeneratingQuestions(true);
    try {
      const res = await fetch('/api/admin/seo-topics/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: selected.displayName,
          subject: selected.subject,
          count: 3
        })
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        const currentQuestions = selected.fallbackQuestions || [];
        const newQuestions = mode === 'append' ? [...currentQuestions, ...data.questions] : data.questions;
        handleField('fallbackQuestions', newQuestions);
        alert('✨ Fallback questions generated successfully!');
      } else {
        alert('❌ Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Generation failed: ' + err.message);
    } finally {
      setGeneratingQuestions(false);
    }
  }

  // ── Visual Lesson Helper functions ──
  let parsedLesson = { sections: [] };
  if (selected && selected.lessonJson) {
    if (typeof selected.lessonJson === 'object') {
      parsedLesson = selected.lessonJson;
    } else {
      try {
        parsedLesson = JSON.parse(selected.lessonJson);
      } catch (e) {
        // Keeps it empty
      }
    }
  }
  const lessonSections = Array.isArray(parsedLesson?.sections) ? parsedLesson.sections : [];

  function updateLessonSections(newSecs) {
    if (!selected) return;
    handleField('lessonJson', { ...parsedLesson, sections: newSecs });
  }

  function addLessonSection(type) {
    let newSec = { type };
    if (type === 'introduction') {
      newSec.heading = 'New Introduction Section';
      newSec.content = 'Write introductory content here.';
    } else if (type === 'rule-box') {
      newSec.heading = 'Key Rules';
      newSec.bullets = ['First key concept rule...', 'Second key concept rule...'];
    } else if (type === 'worked-example') {
      newSec.heading = 'Worked Example';
      newSec.prompt = 'Write example prompt/question...';
      newSec.steps = [
        { stepNumber: 1, instruction: 'Step 1 instruction...', formula: 'y = mx + c' }
      ];
    } else if (type === 'visual-grid') {
      newSec.heading = 'Visual Representation';
      newSec.description = 'Write grid table description...';
      newSec.table = {
        headers: ['Column 1', 'Column 2'],
        rows: [['Row 1 Cell 1', 'Row 1 Cell 2']]
      };
    } else if (type === 'image') {
      newSec.src = '';
      newSec.alt = '';
      newSec.width = '300px';
      newSec.alignment = 'center';
      newSec.caption = '';
    } else if (type === 'diagram') {
      newSec.heading = 'Dynamic Math Diagram';
      newSec.description = 'Use the options below to configure this visual model:';
      newSec.diagramType = 'fraction-pie';
      newSec.alignment = 'center';
      newSec.params = { numerator: 3, denominator: 4, color: '#3b82f6', size: 150 };
      newSec.caption = '';
    }
    updateLessonSections([...lessonSections, newSec]);
  }

  function removeLessonSection(idx) {
    updateLessonSections(lessonSections.filter((_, i) => i !== idx));
  }

  function moveLessonSection(idx, dir) {
    const newSecs = [...lessonSections];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= newSecs.length) return;
    const temp = newSecs[idx];
    newSecs[idx] = newSecs[targetIdx];
    newSecs[targetIdx] = temp;
    updateLessonSections(newSecs);
  }

  function editSectionField(idx, field, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        return { ...sec, [field]: val };
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  function editSectionParamsField(idx, paramField, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        return {
          ...sec,
          params: {
            ...(sec.params || {}),
            [paramField]: val
          }
        };
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  function editSectionNestedField(idx, path, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        const copy = { ...sec };
        if (path === 'callout.title') {
          copy.callout = { ...copy.callout, title: val };
        } else if (path === 'callout.text') {
          copy.callout = { ...copy.callout, text: val };
        } else if (path === 'pitfall.title') {
          copy.pitfall = { ...copy.pitfall, title: val };
        } else if (path === 'pitfall.text') {
          copy.pitfall = { ...copy.pitfall, text: val };
        }
        return copy;
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  function updateBullets(idx, bulletIdx, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        const bullets = [...(sec.bullets || [])];
        if (bulletIdx === -1) {
          bullets.push('');
        } else if (val === null) {
          bullets.splice(bulletIdx, 1);
        } else {
          bullets[bulletIdx] = val;
        }
        return { ...sec, bullets };
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  function updateSteps(idx, stepIdx, field, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        const steps = [...(sec.steps || [])];
        if (stepIdx === -1) {
          steps.push({ stepNumber: steps.length + 1, instruction: '', formula: '' });
        } else if (val === null) {
          steps.splice(stepIdx, 1);
        } else {
          steps[stepIdx] = { ...steps[stepIdx], [field]: val };
        }
        return { ...sec, steps };
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  function updateTableHeaders(idx, headerIdx, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        const table = { ...sec.table };
        const headers = [...(table.headers || [])];
        if (headerIdx === -1) {
          headers.push('');
        } else if (val === null) {
          headers.splice(headerIdx, 1);
        } else {
          headers[headerIdx] = val;
        }
        table.headers = headers;
        return { ...sec, table };
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  function updateTableRows(idx, rowIdx, colIdx, val) {
    const newSecs = lessonSections.map((sec, i) => {
      if (i === idx) {
        const table = { ...sec.table };
        const rows = (table.rows || []).map(r => [...r]);
        if (rowIdx === -1) {
          const numCols = table.headers?.length || 2;
          rows.push(Array(numCols).fill(''));
        } else if (val === null) {
          rows.splice(rowIdx, 1);
        } else {
          rows[rowIdx][colIdx] = val;
        }
        table.rows = rows;
        return { ...sec, table };
      }
      return sec;
    });
    updateLessonSections(newSecs);
  }

  // ── Fetch topic list ──
  const fetchTopics = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterExam) params.set('examName', filterExam);
    if (filterSub)  params.set('subject',  filterSub);
    const res = await fetch(`/api/admin/seo-topics?${params}`);
    const data = await res.json();
    setTopics(data.topics || []);
  }, [filterExam, filterSub]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  // ── Select a topic to edit ──
  function handleSelect(t) {
    setSelected(JSON.parse(JSON.stringify(t)));   // deep copy
    setIsNew(false);
    setQEditing(null);
  }

  // ── New topic ──
  function handleNew() {
    setSelected({ ...BLANK_TOPIC });
    setIsNew(true);
    setQEditing(null);
  }

  // ── Field change ──
  function handleField(field, value) {
    setSelected(s => ({ ...s, [field]: value }));
  }

  // ── Auto-slug from display name (only when creating new) ──
  function handleDisplayName(val) {
    setSelected(s => ({
      ...s,
      displayName: val,
      slug: isNew ? slugify(val) : s.slug,
    }));
  }

  // ── Related topics ──
  function addRelated() {
    setSelected(s => ({
      ...s,
      relatedTopics: [...(s.relatedTopics || []), { slug: '', label: '' }],
    }));
  }
  function updateRelated(i, field, val) {
    setSelected(s => {
      const rt = [...(s.relatedTopics || [])];
      rt[i] = { ...rt[i], [field]: val };
      return { ...s, relatedTopics: rt };
    });
  }
  function removeRelated(i) {
    setSelected(s => ({
      ...s,
      relatedTopics: s.relatedTopics.filter((_, idx) => idx !== i),
    }));
  }

  // ── Fallback question editor ──
  function startEditQuestion(i) {
    const q = selected.fallbackQuestions?.[i] || BLANK_QUESTION;
    setQEditing(i);
    setQDraft(JSON.parse(JSON.stringify(q)));
  }
  function startAddQuestion() {
    setQEditing('new');
    setQDraft({ ...BLANK_QUESTION, options: { A: '', B: '', C: '', D: '' } });
  }
  function saveQuestion() {
    setSelected(s => {
      const qs = [...(s.fallbackQuestions || [])];
      if (qEditing === 'new') qs.push(qDraft);
      else qs[qEditing] = qDraft;
      return { ...s, fallbackQuestions: qs };
    });
    setQEditing(null);
    setQDraft(null);
  }
  function removeQuestion(i) {
    setSelected(s => ({
      ...s,
      fallbackQuestions: s.fallbackQuestions.filter((_, idx) => idx !== i),
    }));
  }

  // ── Save (create or update) ──
  async function handleSave(publish = null) {
    if (!selected) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload = { ...selected };
      if (publish !== null) payload.published = publish;

      // Validate and parse lessonJson if it is set as a string
      if (payload.lessonJson && typeof payload.lessonJson === 'string') {
        try {
          payload.lessonJson = JSON.parse(payload.lessonJson);
        } catch (e) {
          throw new Error('Lesson JSON Configuration is not valid JSON. Please correct syntax errors.');
        }
      }

      let res;
      if (isNew) {
        res = await fetch('/api/admin/seo-topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/seo-topics/${selected._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSelected(data.topic);
      setIsNew(false);
      setSaveMsg(publish ? '✅ Published!' : '✅ Saved!');
      await fetchTopics();
      // Reload iframe preview
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (err) {
      setSaveMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!selected?._id) return;
    if (!confirm(`Delete "${selected.displayName || selected.slug}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/seo-topics/${selected._id}`, { method: 'DELETE' });
    setSelected(null);
    await fetchTopics();
  }

  // ── Filtered topic list ──
  const filteredTopics = topics.filter(t => {
    if (search && !t.slug.includes(search.toLowerCase()) && !t.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const previewUrl = selected
    ? `/exams/${selected.examName}/${selected.subject}/${selected.slug}`
    : null;

  return (
    <div className="mgr-wrap">
      {/* ── Left panel ── */}
      <aside className="mgr-sidebar">
        <div className="mgr-sidebar-head">
          <h1 className="mgr-title">SEO Manager</h1>
          <button className="mgr-btn mgr-btn-primary" onClick={handleNew}>+ New Topic</button>
        </div>

        {/* Filters */}
        <div className="mgr-filters">
          <input
            className="mgr-input"
            placeholder="🔍 Search topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="mgr-select" value={filterExam} onChange={e => setFilterExam(e.target.value)}>
            <option value="">All exams</option>
            {EXAM_OPTIONS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>
          <select className="mgr-select" value={filterSub} onChange={e => setFilterSub(e.target.value)}>
            <option value="">All subjects</option>
            {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Topic list */}
        <div className="mgr-list">
          {filteredTopics.length === 0 && (
            <div className="mgr-empty">No topics yet. Click "+ New Topic" to start.</div>
          )}
          {filteredTopics.map(t => (
            <button
              key={t._id}
              className={`mgr-list-item ${selected?._id === t._id ? 'active' : ''}`}
              onClick={() => handleSelect(t)}
            >
              <span className={`mgr-dot ${t.published ? 'pub' : 'draft'}`} title={t.published ? 'Published' : 'Draft'} />
              <div className="mgr-list-text">
                <div className="mgr-list-name">{t.displayName || t.slug}</div>
                <div className="mgr-list-meta">{t.examName?.toUpperCase()} · {t.subject} · {t.slug}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="mgr-main">
        {!selected ? (
          <div className="mgr-placeholder">
            <div className="mgr-placeholder-icon">📄</div>
            <p>Select a topic from the list, or create a new one.</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="mgr-toolbar">
              <div className="mgr-toolbar-left">
                <span className={`mgr-status-badge ${selected.published ? 'pub' : 'draft'}`}>
                  {selected.published ? '🟢 Published' : '⚪ Draft'}
                </span>
                {saveMsg && <span className="mgr-save-msg">{saveMsg}</span>}
              </div>
              <div className="mgr-toolbar-right">
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="mgr-btn mgr-btn-ghost">
                    Open Page ↗
                  </a>
                )}
                {selected._id && (
                  <button className="mgr-btn mgr-btn-danger" onClick={handleDelete}>Delete</button>
                )}
                <button className="mgr-btn mgr-btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button className="mgr-btn mgr-btn-primary" onClick={() => handleSave(true)} disabled={saving}>
                  {saving ? 'Publishing…' : selected.published ? 'Update & Publish' : 'Publish'}
                </button>
              </div>
            </div>

            <div className="mgr-editor-body">
              {/* ── Left: Form ── */}
              <div className="mgr-form-col">

                {/* Section: Basic Info */}
                <section className="mgr-section">
                  <h2 className="mgr-section-title">Basic Info</h2>
                  <div className="mgr-row-2">
                    <div className="mgr-field">
                      <label className="mgr-label">Exam</label>
                      <select className="mgr-select" value={selected.examName} onChange={e => handleField('examName', e.target.value)}>
                        {EXAM_OPTIONS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="mgr-field">
                      <label className="mgr-label">Subject</label>
                      <select className="mgr-select" value={selected.subject} onChange={e => handleField('subject', e.target.value)}>
                        {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mgr-field">
                    <label className="mgr-label">Display Name <span className="mgr-hint">(shown on the live page)</span></label>
                    <input
                      className="mgr-input"
                      placeholder="e.g. Calculate Distance from Speed & Time"
                      value={selected.displayName}
                      onChange={e => handleDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="mgr-field">
                    <label className="mgr-label">Slug <span className="mgr-hint">(URL identifier — auto-generated from name)</span></label>
                    <div className="mgr-slug-row">
                      <span className="mgr-slug-prefix">/exams/{selected.examName}/{selected.subject}/</span>
                      <input
                        className="mgr-input mgr-input-slug"
                        placeholder="template-time-distance-dist-calc"
                        value={selected.slug}
                        onChange={e => handleField('slug', slugify(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="mgr-field">
                    <label className="mgr-label">Description <span className="mgr-hint">(shown below the title on the live page)</span></label>
                    <textarea
                      className="mgr-textarea"
                      rows={3}
                      placeholder="Practice calculating distance using the Speed × Time formula. Suitable for JNVST Class 6 Arithmetic..."
                      value={selected.description}
                      onChange={e => handleField('description', e.target.value)}
                    />
                  </div>
                </section>

                {/* Section: SEO Tags */}
                <section className="mgr-section">
                  <h2 className="mgr-section-title">🔍 SEO Metadata Tags</h2>
                  
                  <div className="mgr-field">
                    <label className="mgr-label">
                      Meta Title 
                      <span className="mgr-hint">
                        (Ideal length: 50–60 characters. Current: {selected.metaTitle?.length || 0})
                      </span>
                    </label>
                    <input
                      className="mgr-input"
                      placeholder="e.g. JNVST Class 6 Math: Distance & Time Practice | KlassChamp"
                      value={selected.metaTitle || ''}
                      onChange={e => handleField('metaTitle', e.target.value)}
                    />
                  </div>

                  <div className="mgr-field">
                    <label className="mgr-label">
                      Meta Description 
                      <span className="mgr-hint">
                        (Ideal length: 150–160 characters. Current: {selected.metaDescription?.length || 0})
                      </span>
                    </label>
                    <textarea
                      className="mgr-textarea"
                      rows={3}
                      placeholder="e.g. Free interactive practice questions with step-by-step solutions for JNVST Class 6 Math distance, speed, and time. Try 3 sample problems today!"
                      value={selected.metaDescription || ''}
                      onChange={e => handleField('metaDescription', e.target.value)}
                    />
                  </div>

                  <div className="mgr-field">
                    <label className="mgr-label">
                      Meta Keywords 
                      <span className="mgr-hint">(Comma-separated list of keywords)</span>
                    </label>
                    <input
                      className="mgr-input"
                      placeholder="e.g. jnvst math, distance time speed, class 6 prep"
                      value={selected.metaKeywords || ''}
                      onChange={e => handleField('metaKeywords', e.target.value)}
                    />
                  </div>
                </section>

                {/* Section: Related Topics */}
                <section className="mgr-section">
                  <div className="mgr-section-header">
                    <h2 className="mgr-section-title">Related Topics <span className="mgr-hint">(shown in the sidebar)</span></h2>
                    <button className="mgr-btn mgr-btn-ghost" onClick={addRelated}>+ Add</button>
                  </div>
                  {(selected.relatedTopics || []).length === 0 && (
                    <div className="mgr-empty-inline">No related topics yet.</div>
                  )}
                  {(selected.relatedTopics || []).map((rt, i) => (
                    <div key={i} className="mgr-related-row">
                      <input
                        className="mgr-input"
                        placeholder="Label (e.g. Calculate Speed)"
                        value={rt.label}
                        onChange={e => updateRelated(i, 'label', e.target.value)}
                      />
                      <input
                        className="mgr-input"
                        placeholder="Slug (e.g. template-time-distance-speed-calc)"
                        value={rt.slug}
                        onChange={e => updateRelated(i, 'slug', e.target.value)}
                      />
                      <button className="mgr-btn-icon" onClick={() => removeRelated(i)} title="Remove">✕</button>
                    </div>
                  ))}
                </section>

                {/* Section: Fallback Questions */}
                <section className="mgr-section">
                  <div className="mgr-section-header">
                    <h2 className="mgr-section-title">Fallback Questions <span className="mgr-hint">(used when DB template has no questions)</span></h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="mgr-btn mgr-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', cursor: 'pointer' }}
                        onClick={handleAiGenerateQuestions}
                        disabled={generatingQuestions}
                      >
                        {generatingQuestions ? '⚡ Generating...' : '✨ AI Generate Questions'}
                      </button>
                      <button className="mgr-btn mgr-btn-ghost" onClick={startAddQuestion}>+ Add Question</button>
                    </div>
                  </div>

                  {(selected.fallbackQuestions || []).length === 0 && qEditing !== 'new' && (
                    <div className="mgr-empty-inline">No fallback questions. Add at least 3 for best results.</div>
                  )}

                  {(selected.fallbackQuestions || []).map((q, i) => (
                    <div key={i} className={`mgr-q-card ${qEditing === i ? 'editing' : ''}`}>
                      {qEditing === i ? (
                        <QuestionEditor
                          draft={qDraft}
                          onChange={setQDraft}
                          onSave={saveQuestion}
                          onCancel={() => setQEditing(null)}
                        />
                      ) : (
                        <>
                          <div className="mgr-q-preview">
                            <span className="mgr-q-num">Q{i + 1}</span>
                            <span className="mgr-q-text">{q.questionText || '(empty question)'}</span>
                          </div>
                          <div className="mgr-q-actions">
                            <button className="mgr-btn mgr-btn-ghost" onClick={() => startEditQuestion(i)}>Edit</button>
                            <button className="mgr-btn-icon" onClick={() => removeQuestion(i)} title="Remove">✕</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {qEditing === 'new' && (
                    <div className="mgr-q-card editing">
                      <QuestionEditor
                        draft={qDraft}
                        onChange={setQDraft}
                        onSave={saveQuestion}
                        onCancel={() => setQEditing(null)}
                      />
                    </div>
                  )}
                </section>

                {/* Section: Lesson Explainer */}
                <section className="mgr-section">
                  <div className="mgr-section-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2 className="mgr-section-title" style={{ margin: 0 }}>Lesson Explainer Content</h2>
                      <button
                        type="button"
                        className="mgr-btn mgr-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px', background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#6d28d9', cursor: 'pointer' }}
                        onClick={handleAiGenerateLesson}
                        disabled={generatingLesson}
                      >
                        {generatingLesson ? '⚡ Generating outline...' : '✨ AI Generate Lesson'}
                      </button>
                    </div>
                    <div className="mgr-tab-bar">
                      <button
                        className={`mgr-tab-btn ${editorTab === 'visual' ? 'active' : ''}`}
                        onClick={() => setEditorTab('visual')}
                      >
                        🛠️ Visual Builder
                      </button>
                      <button
                        className={`mgr-tab-btn ${editorTab === 'raw' ? 'active' : ''}`}
                        onClick={() => setEditorTab('raw')}
                      >
                        💻 Raw JSON
                      </button>
                    </div>
                  </div>

                  {editorTab === 'raw' ? (
                    <div className="mgr-field">
                      <label className="mgr-label">Lesson JSON Configuration <span className="mgr-hint">(Define visual blocks, worked examples, and tables)</span></label>
                      <textarea
                        className="mgr-textarea"
                        rows={14}
                        style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.4 }}
                        placeholder={`{\n  "sections": [\n    {\n      "type": "introduction",\n      "heading": "What are Equivalent Ratios?",\n      "content": "Ratios compare two quantities..."\n    }\n  ]\n}`}
                        value={selected.lessonJson ? (typeof selected.lessonJson === 'object' ? JSON.stringify(selected.lessonJson, null, 2) : selected.lessonJson) : ''}
                        onChange={e => handleField('lessonJson', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="mgr-visual-builder">
                      {lessonSections.length === 0 && (
                        <div className="mgr-empty-inline" style={{ padding: '24px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                          No explainer sections defined yet. Use the action bar below to build your study content!
                        </div>
                      )}
                      
                      <div className="mgr-sec-list">
                        {lessonSections.map((sec, idx) => (
                          <div key={idx} className="mgr-sec-card">
                            <div className="mgr-sec-card-header">
                              <span className="mgr-sec-badge">{sec.type}</span>
                              <div className="mgr-sec-card-actions">
                                <button className="mgr-btn-sec-action" onClick={() => moveLessonSection(idx, -1)} disabled={idx === 0} title="Move Up">⬆️</button>
                                <button className="mgr-btn-sec-action" onClick={() => moveLessonSection(idx, 1)} disabled={idx === lessonSections.length - 1} title="Move Down">⬇️</button>
                                <button className="mgr-btn-sec-action danger" onClick={() => removeLessonSection(idx)} title="Delete Section">✕</button>
                              </div>
                            </div>
                            
                            <div className="mgr-sec-card-body">
                              {/* Heading - common to all types except image */}
                              {sec.type !== 'image' && (
                                <div className="mgr-field">
                                  <label className="mgr-label">Section Heading</label>
                                  <input
                                    className="mgr-input"
                                    placeholder="Enter heading..."
                                    value={sec.heading || ''}
                                    onChange={e => editSectionField(idx, 'heading', e.target.value)}
                                  />
                                </div>
                              )}

                              {/* INTRODUCTION SECTION FIELDS */}
                              {sec.type === 'introduction' && (
                                <>
                                  <div className="mgr-field">
                                    <label className="mgr-label">Intro Text Content <span className="mgr-hint">(supports $math$ & **bold**)</span></label>
                                    <textarea
                                      className="mgr-textarea"
                                      rows={3}
                                      placeholder="Write introductory content..."
                                      value={sec.content || ''}
                                      onChange={e => editSectionField(idx, 'content', e.target.value)}
                                    />
                                  </div>
                                  <div className="mgr-field-group">
                                    <div className="mgr-field-group-title">💡 Optional Callout Box</div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Callout Title</label>
                                      <input
                                        className="mgr-input"
                                        placeholder="e.g. Note, Tip, Pro Tip"
                                        value={sec.callout?.title || ''}
                                        onChange={e => editSectionNestedField(idx, 'callout.title', e.target.value)}
                                      />
                                    </div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Callout Content</label>
                                      <textarea
                                        className="mgr-textarea"
                                        rows={2}
                                        placeholder="Write callout notes..."
                                        value={sec.callout?.text || ''}
                                        onChange={e => editSectionNestedField(idx, 'callout.text', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* RULE BOX SECTION FIELDS */}
                              {sec.type === 'rule-box' && (
                                <div className="mgr-field">
                                  <label className="mgr-label">Rule Bullets <span className="mgr-hint">(supports $math$)</span></label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(sec.bullets || []).map((bullet, bIdx) => (
                                      <div key={bIdx} style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                          className="mgr-input"
                                          value={bullet}
                                          onChange={e => updateBullets(idx, bIdx, e.target.value)}
                                        />
                                        <button className="mgr-btn-icon" onClick={() => updateBullets(idx, bIdx, null)}>✕</button>
                                      </div>
                                    ))}
                                    <button className="mgr-btn mgr-btn-ghost" style={{ alignSelf: 'flex-start', marginTop: '4px' }} onClick={() => updateBullets(idx, -1, 'New rule bullet...')}>
                                      + Add Bullet
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* WORKED EXAMPLE SECTION FIELDS */}
                              {sec.type === 'worked-example' && (
                                <>
                                  <div className="mgr-field">
                                    <label className="mgr-label">Example Prompt / Question <span className="mgr-hint">(supports $math$)</span></label>
                                    <textarea
                                      className="mgr-textarea"
                                      rows={2}
                                      placeholder="e.g. Find the simple interest..."
                                      value={sec.prompt || ''}
                                      onChange={e => editSectionField(idx, 'prompt', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="mgr-field">
                                    <label className="mgr-label">Timeline Steps</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      {(sec.steps || []).map((step, sIdx) => (
                                        <div key={sIdx} className="mgr-step-editor-card">
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>Step {step.stepNumber}</span>
                                            <button className="mgr-btn-icon" onClick={() => updateSteps(idx, sIdx, null)}>✕ Remove Step</button>
                                          </div>
                                          <div className="mgr-field">
                                            <label className="mgr-label">Instruction Text</label>
                                            <input
                                              className="mgr-input"
                                              placeholder="What should the student do in this step?"
                                              value={step.instruction || ''}
                                              onChange={e => updateSteps(idx, sIdx, 'instruction', e.target.value)}
                                            />
                                          </div>
                                          <div className="mgr-field">
                                            <label className="mgr-label">Formula / Math Equation <span className="mgr-hint">(centered, raw math style e.g. SI = P * R * T / 100)</span></label>
                                            <input
                                              className="mgr-input"
                                              placeholder="e.g. SI = \\frac{1000 \\times 5 \\times 3}{100}"
                                              value={step.formula || ''}
                                              onChange={e => updateSteps(idx, sIdx, 'formula', e.target.value)}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                      <button className="mgr-btn mgr-btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => updateSteps(idx, -1, null)}>
                                        + Add Step
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mgr-field-group">
                                    <div className="mgr-field-group-title">⚠️ Pitfall / Warning Box</div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Warning Title</label>
                                      <input
                                        className="mgr-input"
                                        placeholder="e.g. Common Mistake, Warning"
                                        value={sec.pitfall?.title || ''}
                                        onChange={e => editSectionNestedField(idx, 'pitfall.title', e.target.value)}
                                      />
                                    </div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Warning Text</label>
                                      <textarea
                                        className="mgr-textarea"
                                        rows={2}
                                        placeholder="Write common mistake info..."
                                        value={sec.pitfall?.text || ''}
                                        onChange={e => editSectionNestedField(idx, 'pitfall.text', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* VISUAL GRID SECTION FIELDS */}
                              {sec.type === 'visual-grid' && (
                                <>
                                  <div className="mgr-field">
                                    <label className="mgr-label">Grid Description</label>
                                    <textarea
                                      className="mgr-textarea"
                                      rows={2}
                                      placeholder="Write description/explainer..."
                                      value={sec.description || ''}
                                      onChange={e => editSectionField(idx, 'description', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="mgr-field">
                                    <label className="mgr-label">Data Table Columns</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {(sec.table?.headers || []).map((header, hIdx) => (
                                          <div key={hIdx} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                                            <input
                                              className="mgr-input"
                                              style={{ width: '100px', border: 'none', background: 'transparent', padding: 0 }}
                                              value={header}
                                              onChange={e => updateTableHeaders(idx, hIdx, e.target.value)}
                                            />
                                            <button className="mgr-btn-icon" style={{ padding: '2px' }} onClick={() => updateTableHeaders(idx, hIdx, null)}>✕</button>
                                          </div>
                                        ))}
                                        <button className="mgr-btn mgr-btn-ghost" style={{ padding: '4px 10px' }} onClick={() => updateTableHeaders(idx, -1, 'New Header')}>
                                          + Add Col
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mgr-field">
                                    <label className="mgr-label">Data Table Rows</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      {(sec.table?.rows || []).map((row, rIdx) => (
                                        <div key={rIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                          {(row || []).map((cell, cIdx) => (
                                            <input
                                              key={cIdx}
                                              className="mgr-input"
                                              value={cell}
                                              onChange={e => updateTableRows(idx, rIdx, cIdx, e.target.value)}
                                            />
                                          ))}
                                          <button className="mgr-btn-icon" onClick={() => updateTableRows(idx, rIdx, null, null)}>✕</button>
                                        </div>
                                      ))}
                                      <button className="mgr-btn mgr-btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => updateTableRows(idx, -1, null, null)}>
                                        + Add Row
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* IMAGE SECTION FIELDS */}
                              {sec.type === 'image' && (
                                <>
                                  <div className="mgr-field">
                                    <label className="mgr-label">Image Source URL <span className="mgr-hint">(supports static paths e.g. /images/... or public URLs)</span></label>
                                    <input
                                      className="mgr-input"
                                      placeholder="e.g. /images/ratios.png or https://example.com/image.png"
                                      value={sec.src || ''}
                                      onChange={e => editSectionField(idx, 'src', e.target.value)}
                                      style={{ marginBottom: '8px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      {/* Hidden File Input */}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id={`file-upload-${idx}`}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          
                                          const formData = new FormData();
                                          formData.append('file', file);
                                          formData.append('folder', 'seo-lessons');
                                          
                                          try {
                                            const res = await fetch('/api/admin/upload-image', {
                                              method: 'POST',
                                              body: formData
                                            });
                                            const data = await res.json();
                                            if (data.url) {
                                              editSectionField(idx, 'src', data.url);
                                              alert('✅ Uploaded successfully!');
                                            } else {
                                              alert('❌ Upload failed: ' + (data.error || 'Unknown error'));
                                            }
                                          } catch (err) {
                                            alert('❌ Upload failed: ' + err.message);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="mgr-btn mgr-btn-secondary"
                                        onClick={() => document.getElementById(`file-upload-${idx}`).click()}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                                      >
                                        📤 Upload Image
                                      </button>
                                      
                                      <button
                                        type="button"
                                        className="mgr-btn mgr-btn-secondary"
                                        onClick={() => openGallery(idx)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                                      >
                                        🖼️ Open Gallery
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mgr-row-2">
                                    <div className="mgr-field">
                                      <label className="mgr-label">Width (CSS size)</label>
                                      <input
                                        className="mgr-input"
                                        placeholder="e.g. 300px, 100%, 50%, auto"
                                        value={sec.width || '300px'}
                                        onChange={e => editSectionField(idx, 'width', e.target.value)}
                                      />
                                    </div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Alignment</label>
                                      <select
                                        className="mgr-select"
                                        value={sec.alignment || 'center'}
                                        onChange={e => editSectionField(idx, 'alignment', e.target.value)}
                                      >
                                        <option value="center">Center</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="mgr-field">
                                    <label className="mgr-label">Alt Image Description</label>
                                    <input
                                      className="mgr-input"
                                      placeholder="Describe image contents for accessibility..."
                                      value={sec.alt || ''}
                                      onChange={e => editSectionField(idx, 'alt', e.target.value)}
                                    />
                                  </div>
                                  <div className="mgr-field">
                                    <label className="mgr-label">Optional Image Caption <span className="mgr-hint">(displayed below image, supports $math$)</span></label>
                                    <input
                                      className="mgr-input"
                                      placeholder="Write image caption text..."
                                      value={sec.caption || ''}
                                      onChange={e => editSectionField(idx, 'caption', e.target.value)}
                                    />
                                  </div>
                                </>
                              )}

                              {/* DIAGRAM SECTION FIELDS */}
                              {sec.type === 'diagram' && (
                                <>
                                  <div className="mgr-row-2">
                                    <div className="mgr-field">
                                      <label className="mgr-label">Diagram Type</label>
                                      <select
                                        className="mgr-select"
                                        value={sec.diagramType || 'fraction-pie'}
                                        onChange={e => editSectionField(idx, 'diagramType', e.target.value)}
                                      >
                                        <option value="fraction-pie">Fraction Circle (Pie)</option>
                                        <option value="fraction-bar">Fraction Strip (Bar)</option>
                                        <option value="number-line">Number Line Segment</option>
                                        <option value="place-value">Place Value Unit Blocks</option>
                                        <option value="geometry-shape">Geometry Shape (2D/3D)</option>
                                        <option value="percentage-grid">Percentage Grid (10x10)</option>
                                        <option value="clock">Analog Clock Face</option>
                                        <option value="bar-comparison">Bar Comparison (CP vs. SP)</option>
                                        <option value="arithmetic-visual">Arithmetic Visual Groups</option>
                                      </select>
                                    </div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Alignment</label>
                                      <select
                                        className="mgr-select"
                                        value={sec.alignment || 'center'}
                                        onChange={e => editSectionField(idx, 'alignment', e.target.value)}
                                      >
                                        <option value="center">Center</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Conditionally render parameters based on diagramType */}
                                  {(sec.diagramType === 'fraction-pie' || sec.diagramType === 'fraction-bar' || !sec.diagramType) && (
                                    <div className="mgr-row-2">
                                      <div className="mgr-field">
                                        <label className="mgr-label">Numerator (Shaded slices)</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.numerator ?? 3}
                                          onChange={e => editSectionParamsField(idx, 'numerator', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Denominator (Total slices)</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.denominator ?? 4}
                                          onChange={e => editSectionParamsField(idx, 'denominator', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {sec.diagramType === 'number-line' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Min Val</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.min ?? 0}
                                          onChange={e => editSectionParamsField(idx, 'min', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Max Val</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.max ?? 10}
                                          onChange={e => editSectionParamsField(idx, 'max', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Plot Value</label>
                                        <input
                                          type="number"
                                          step="any"
                                          className="mgr-input"
                                          value={sec.params?.value ?? 5}
                                          onChange={e => editSectionParamsField(idx, 'value', parseFloat(e.target.value))}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {sec.diagramType === 'place-value' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Hundreds Blocks</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.hundreds ?? 0}
                                          onChange={e => editSectionParamsField(idx, 'hundreds', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Tens Rods</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.tens ?? 0}
                                          onChange={e => editSectionParamsField(idx, 'tens', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Ones Cubes</label>
                                        <input
                                          type="number"
                                          className="mgr-input"
                                          value={sec.params?.ones ?? 0}
                                          onChange={e => editSectionParamsField(idx, 'ones', parseInt(e.target.value, 10))}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {sec.diagramType === 'geometry-shape' && (
                                    <>
                                      <div className="mgr-row-2">
                                        <div className="mgr-field">
                                          <label className="mgr-label">Shape Style</label>
                                          <select
                                            className="mgr-select"
                                            value={sec.params?.shape || 'rectangle'}
                                            onChange={e => editSectionParamsField(idx, 'shape', e.target.value)}
                                          >
                                            <option value="rectangle">Rectangle</option>
                                            <option value="square">Square</option>
                                            <option value="triangle">Right Triangle</option>
                                            <option value="cuboid">3D Cuboid/Box</option>
                                          </select>
                                        </div>
                                        <div className="mgr-field">
                                          <label className="mgr-label">Label 1 (Base/Length)</label>
                                          <input
                                            type="text"
                                            className="mgr-input"
                                            placeholder="e.g. 12 cm"
                                            value={sec.params?.label1 || ''}
                                            onChange={e => editSectionParamsField(idx, 'label1', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="mgr-row-2">
                                        <div className="mgr-field">
                                          <label className="mgr-label">Label 2 (Height/Width)</label>
                                          <input
                                            type="text"
                                            className="mgr-input"
                                            placeholder="e.g. 8 cm"
                                            value={sec.params?.label2 || ''}
                                            onChange={e => editSectionParamsField(idx, 'label2', e.target.value)}
                                          />
                                        </div>
                                        <div className="mgr-field">
                                          <label className="mgr-label">Label 3 (Depth/Hypotenuse)</label>
                                          <input
                                            type="text"
                                            className="mgr-input"
                                            placeholder="e.g. 5 cm"
                                            value={sec.params?.label3 || ''}
                                            onChange={e => editSectionParamsField(idx, 'label3', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {sec.diagramType === 'percentage-grid' && (
                                    <div className="mgr-field">
                                      <label className="mgr-label">Shaded Percentage (0 - 100)</label>
                                      <input
                                        type="number"
                                        className="mgr-input"
                                        value={sec.params?.percent ?? 35}
                                        onChange={e => editSectionParamsField(idx, 'percent', parseInt(e.target.value, 10))}
                                      />
                                    </div>
                                  )}

                                  {sec.diagramType === 'clock' && (
                                    <div className="mgr-field">
                                      <label className="mgr-label">Time Value (HH:MM)</label>
                                      <input
                                        type="text"
                                        className="mgr-input"
                                        placeholder="e.g. 10:15 or 08:30"
                                        value={sec.params?.time || '10:15'}
                                        onChange={e => editSectionParamsField(idx, 'time', e.target.value)}
                                      />
                                    </div>
                                  )}

                                  {sec.diagramType === 'bar-comparison' && (
                                    <>
                                      <div className="mgr-row-2">
                                        <div className="mgr-field">
                                          <label className="mgr-label">Bar 1 Value</label>
                                          <input
                                            type="number"
                                            className="mgr-input"
                                            value={sec.params?.value1 ?? 200}
                                            onChange={e => editSectionParamsField(idx, 'value1', parseFloat(e.target.value))}
                                          />
                                        </div>
                                        <div className="mgr-field">
                                          <label className="mgr-label">Bar 1 Label</label>
                                          <input
                                            type="text"
                                            className="mgr-input"
                                            placeholder="e.g. Cost Price"
                                            value={sec.params?.label1 || ''}
                                            onChange={e => editSectionParamsField(idx, 'label1', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      <div className="mgr-row-2">
                                        <div className="mgr-field">
                                          <label className="mgr-label">Bar 2 Value</label>
                                          <input
                                            type="number"
                                            className="mgr-input"
                                            value={sec.params?.value2 ?? 250}
                                            onChange={e => editSectionParamsField(idx, 'value2', parseFloat(e.target.value))}
                                          />
                                        </div>
                                        <div className="mgr-field">
                                          <label className="mgr-label">Bar 2 Label</label>
                                          <input
                                            type="text"
                                            className="mgr-input"
                                            placeholder="e.g. Selling Price"
                                            value={sec.params?.label2 || ''}
                                            onChange={e => editSectionParamsField(idx, 'label2', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {sec.diagramType === 'arithmetic-visual' && (
                                    <>
                                      <div className="mgr-row-2">
                                        <div className="mgr-field">
                                          <label className="mgr-label">Operation</label>
                                          <select
                                            className="mgr-select"
                                            value={sec.params?.operation || 'addition'}
                                            onChange={e => editSectionParamsField(idx, 'operation', e.target.value)}
                                          >
                                            <option value="addition">Addition (+)</option>
                                            <option value="subtraction">Subtraction (-)</option>
                                            <option value="multiplication">Multiplication (×)</option>
                                          </select>
                                        </div>
                                        <div className="mgr-field">
                                          <label className="mgr-label">Item Type</label>
                                          <select
                                            className="mgr-select"
                                            value={sec.params?.itemType || 'emoji'}
                                            onChange={e => editSectionParamsField(idx, 'itemType', e.target.value)}
                                          >
                                            <option value="emoji">Emoji Character</option>
                                            <option value="image">Image Asset Path</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="mgr-row-2">
                                        <div className="mgr-field">
                                          <label className="mgr-label">Value 1 (First Number)</label>
                                          <input
                                            type="number"
                                            className="mgr-input"
                                            value={sec.params?.value1 ?? 5}
                                            onChange={e => editSectionParamsField(idx, 'value1', parseInt(e.target.value, 10))}
                                          />
                                        </div>
                                        <div className="mgr-field">
                                          <label className="mgr-label">Value 2 (Second Number)</label>
                                          <input
                                            type="number"
                                            className="mgr-input"
                                            value={sec.params?.value2 ?? 3}
                                            onChange={e => editSectionParamsField(idx, 'value2', parseInt(e.target.value, 10))}
                                          />
                                        </div>
                                      </div>
                                      <div className="mgr-field">
                                        <label className="mgr-label">Item Character or URL Source</label>
                                        <input
                                          type="text"
                                          className="mgr-input"
                                          placeholder="e.g. 🍎 or ⭐ or /uploads/custom-image.png"
                                          value={sec.params?.itemSource || '🍎'}
                                          onChange={e => editSectionParamsField(idx, 'itemSource', e.target.value)}
                                        />
                                      </div>
                                    </>
                                  )}

                                  <div className="mgr-row-2" style={{ marginTop: '8px' }}>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Display Color</label>
                                      <input
                                        type="text"
                                        className="mgr-input"
                                        placeholder="e.g. #3b82f6"
                                        value={sec.params?.color || '#3b82f6'}
                                        onChange={e => editSectionParamsField(idx, 'color', e.target.value)}
                                      />
                                    </div>
                                    <div className="mgr-field">
                                      <label className="mgr-label">Display Size (px)</label>
                                      <input
                                        type="number"
                                        className="mgr-input"
                                        value={sec.params?.size ?? 150}
                                        onChange={e => editSectionParamsField(idx, 'size', parseInt(e.target.value, 10))}
                                      />
                                    </div>
                                  </div>

                                  <div className="mgr-field">
                                    <label className="mgr-label">Optional Image Caption <span className="mgr-hint">(supports $math$)</span></label>
                                    <input
                                      className="mgr-input"
                                      placeholder="Write image caption text..."
                                      value={sec.caption || ''}
                                      onChange={e => editSectionField(idx, 'caption', e.target.value)}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add section control buttons */}
                      <div className="mgr-sec-creator" style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                          Add Explainer Section Block
                        </span>
                        <div className="mgr-sec-creator-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button className="mgr-btn mgr-btn-secondary" onClick={() => addLessonSection('introduction')}>
                            + Introduction
                          </button>
                          <button className="mgr-btn mgr-btn-secondary" onClick={() => addLessonSection('rule-box')}>
                            + Rule Box
                          </button>
                          <button className="mgr-btn mgr-btn-secondary" onClick={() => addLessonSection('worked-example')}>
                            + Worked Example
                          </button>
                          <button className="mgr-btn mgr-btn-secondary" onClick={() => addLessonSection('visual-grid')}>
                            + Table Grid
                          </button>
                          <button className="mgr-btn mgr-btn-secondary" onClick={() => addLessonSection('image')}>
                            🖼️ Custom Image
                          </button>
                          <button className="mgr-btn mgr-btn-secondary" onClick={() => addLessonSection('diagram')}>
                            📊 Math Diagram
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* ── Right: Live preview iframe ── */}
              <div className="mgr-preview-col">
                <div className="mgr-preview-header">
                  <span>Live Preview</span>
                  {previewUrl && selected._id && (
                    <button
                      className="mgr-btn mgr-btn-ghost"
                      onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }}
                    >↺ Refresh</button>
                  )}
                </div>
                <div className="mgr-preview-frame-wrap">
                  {selected._id && previewUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      className="mgr-preview-iframe"
                      title="Page Preview"
                    />
                  ) : (
                    <div className="mgr-preview-placeholder">
                      Save the topic first to see the live preview.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Asset Gallery Modal ── */}
      {galleryOpen && (
        <div className="gallery-modal-overlay" onClick={() => setGalleryOpen(false)}>
          <div className="gallery-modal" onClick={e => e.stopPropagation()}>
            <div className="gallery-modal-header">
              <h3>🖼️ Image Asset Gallery</h3>
              <button className="gallery-modal-close" onClick={() => setGalleryOpen(false)}>✕</button>
            </div>
            
            <div className="gallery-modal-body">
              {galleryLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading assets...
                </div>
              ) : galleryImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No uploaded assets found. Upload an image to start!
                </div>
              ) : (
                <div className="gallery-grid">
                  {galleryImages.map((img, i) => (
                    <div
                      key={i}
                      className="gallery-item-card"
                      onClick={() => selectGalleryImage(img.url)}
                    >
                      <div className="gallery-item-preview">
                        <img src={img.url} alt={img.key} />
                      </div>
                      <div className="gallery-item-info">
                        <span className="gallery-item-name" title={img.key}>{img.key.split('/').pop()}</span>
                        <span className="gallery-item-size">{(img.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mgr-wrap {
          display: flex;
          height: 100vh;
          font-family: 'Outfit', system-ui, sans-serif;
          background: #f8fafc;
          color: #0f172a;
          overflow: hidden;
        }

        /* ── Sidebar ── */
        .mgr-sidebar {
          width: 300px;
          min-width: 260px;
          max-width: 320px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .mgr-sidebar-head {
          padding: 20px 16px 14px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .mgr-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: #0f172a;
        }
        .mgr-filters {
          padding: 12px 12px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mgr-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }
        .mgr-list-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .mgr-list-item:hover { background: #f1f5f9; border-color: #e2e8f0; }
        .mgr-list-item.active { background: #eff6ff; border-color: #bfdbfe; }
        .mgr-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .mgr-dot.pub   { background: #22c55e; }
        .mgr-dot.draft { background: #94a3b8; }
        .mgr-list-text { min-width: 0; }
        .mgr-list-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mgr-list-meta { font-size: 11px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mgr-empty { text-align: center; color: #94a3b8; font-size: 13px; padding: 40px 16px; }

        /* ── Main ── */
        .mgr-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .mgr-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          gap: 12px;
        }
        .mgr-placeholder-icon { font-size: 48px; }
        .mgr-placeholder p { font-size: 15px; }

        /* Toolbar */
        .mgr-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          gap: 12px;
          flex-shrink: 0;
        }
        .mgr-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .mgr-toolbar-right { display: flex; align-items: center; gap: 8px; }
        .mgr-status-badge {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }
        .mgr-status-badge.pub   { background: #dcfce7; color: #16a34a; }
        .mgr-status-badge.draft { background: #f1f5f9; color: #64748b; }
        .mgr-save-msg { font-size: 13px; font-weight: 600; }

        /* Editor body */
        .mgr-editor-body {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          overflow: hidden;
        }
        .mgr-form-col {
          overflow-y: auto;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Sections */
        .mgr-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mgr-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mgr-section-title { font-size: 14px; font-weight: 800; color: #0f172a; }
        .mgr-hint { font-size: 11px; font-weight: 400; color: #94a3b8; margin-left: 6px; }

        /* Fields */
        .mgr-field { display: flex; flex-direction: column; gap: 5px; }
        .mgr-label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; }
        .mgr-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .mgr-input, .mgr-select, .mgr-textarea {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: inherit;
          color: #0f172a;
          transition: border-color 0.2s;
          outline: none;
        }
        .mgr-input:focus, .mgr-select:focus, .mgr-textarea:focus {
          border-color: #3b82f6;
          background: #ffffff;
        }
        .mgr-textarea { resize: vertical; min-height: 80px; }

        .mgr-slug-row { display: flex; align-items: center; gap: 0; }
        .mgr-slug-prefix {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-right: none;
          border-radius: 8px 0 0 8px;
          padding: 9px 10px;
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
        }
        .mgr-input-slug { border-radius: 0 8px 8px 0; flex: 1; }

        /* Related topics */
        .mgr-related-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 8px;
          align-items: center;
        }
        .mgr-empty-inline { font-size: 13px; color: #94a3b8; }

        /* Question cards */
        .mgr-q-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          background: #f8fafc;
        }
        .mgr-q-card.editing {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .mgr-q-preview {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .mgr-q-num {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          background: #e2e8f0;
          padding: 2px 7px;
          border-radius: 6px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .mgr-q-text {
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
          flex: 1;
        }
        .mgr-q-actions {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          justify-content: flex-end;
        }

        /* Buttons */
        .mgr-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          font-family: inherit;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .mgr-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .mgr-btn-primary  { background: #3b82f6; color: #fff; }
        .mgr-btn-primary:hover:not(:disabled) { background: #2563eb; }
        .mgr-btn-secondary { background: #f1f5f9; color: #334155; border-color: #e2e8f0; }
        .mgr-btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
        .mgr-btn-ghost { background: transparent; color: #475569; border-color: #e2e8f0; }
        .mgr-btn-ghost:hover { background: #f1f5f9; }
        .mgr-btn-danger { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
        .mgr-btn-danger:hover { background: #fecaca; }
        .mgr-btn-icon {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 14px;
          padding: 4px 6px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .mgr-btn-icon:hover { background: #fee2e2; color: #dc2626; }

        /* Preview pane */
        .mgr-preview-col {
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          background: #f1f5f9;
          overflow: hidden;
        }
        .mgr-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .mgr-preview-frame-wrap {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .mgr-preview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          transform-origin: top left;
          /* scale to 60% so the full page fits in the sidebar */
          transform: scale(0.6);
          width: 166.67%;
          height: 166.67%;
        }
        }

        /* Lesson visual builder */
        .mgr-tab-bar {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 8px;
        }
        .mgr-tab-btn {
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mgr-tab-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .mgr-sec-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 12px;
        }
        .mgr-sec-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }
        .mgr-sec-card-header {
          background: #f8fafc;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }
        .mgr-sec-badge {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .mgr-sec-card-actions {
          display: flex;
          gap: 4px;
        }
        .mgr-btn-sec-action {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 11px;
          padding: 4px 6px;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .mgr-btn-sec-action:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .mgr-btn-sec-action:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .mgr-btn-sec-action.danger:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        .mgr-sec-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mgr-field-group {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mgr-field-group-title {
          font-size: 11px;
          font-weight: 800;
          color: #475569;
        }
        .mgr-step-editor-card {
          background: #fafafa;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
        }
        
        .mgr-preview-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
          font-size: 13px;
          text-align: center;
          padding: 24px;
        }

        /* Gallery Modal Styles */
        .gallery-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }
        .gallery-modal {
          background: #ffffff;
          width: 90%;
          max-width: 800px;
          height: 80%;
          max-height: 600px;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gallery-modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .gallery-modal-header h3 {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .gallery-modal-close {
          background: transparent;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #94a3b8;
          transition: color 0.15s;
        }
        .gallery-modal-close:hover {
          color: #0f172a;
        }
        .gallery-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
        }
        .gallery-item-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .gallery-item-card:hover {
          transform: translateY(-2px);
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }
        .gallery-item-preview {
          height: 100px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #f1f5f9;
          padding: 8px;
          overflow: hidden;
        }
        .gallery-item-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .gallery-item-info {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .gallery-item-name {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gallery-item-size {
          font-size: 9px;
          color: #64748b;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 1100px) {
          .mgr-editor-body { grid-template-columns: 1fr; }
          .mgr-preview-col { display: none; }
        }
        @media (max-width: 768px) {
          .mgr-sidebar { width: 100%; max-width: 100%; border-right: none; border-bottom: 1px solid #e2e8f0; }
          .mgr-wrap { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

// ── Question Editor Sub-component ────────────────────────────────────────────
function QuestionEditor({ draft, onChange, onSave, onCancel }) {
  function setField(field, val) {
    onChange(d => ({ ...d, [field]: val }));
  }
  function setOption(key, val) {
    onChange(d => ({ ...d, options: { ...d.options, [key]: val } }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>
          Question Text
        </label>
        <textarea
          style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 60, outline: 'none' }}
          placeholder="e.g. A car travels at 60 km/h for 3 hours. What distance does it cover?"
          value={draft.questionText}
          onChange={e => setField('questionText', e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {['A', 'B', 'C', 'D'].map(key => (
          <div key={key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>Option {key}</label>
            <input
              style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              placeholder={`Option ${key}`}
              value={draft.options?.[key] || ''}
              onChange={e => setOption(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>
          Correct Answer
        </label>
        <select
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          value={draft.correctOption}
          onChange={e => setField('correctOption', e.target.value)}
        >
          {['A', 'B', 'C', 'D'].map(k => <option key={k} value={k}>Option {k}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4 }}>
          Explanation
        </label>
        <textarea
          style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 50, outline: 'none' }}
          placeholder="e.g. Distance = Speed × Time = 60 × 3 = 180 km."
          value={draft.explanationText}
          onChange={e => setField('explanationText', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#334155', fontFamily: 'inherit' }}
          onClick={onCancel}
        >Cancel</button>
        <button
          style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#3b82f6', color: '#fff', fontFamily: 'inherit' }}
          onClick={onSave}
        >Save Question</button>
      </div>
    </div>
  );
}
