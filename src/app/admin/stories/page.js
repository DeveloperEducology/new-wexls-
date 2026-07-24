'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Moral Stories');
  const [grade, setGrade] = useState('LKG / UKG');
  const [readTime, setReadTime] = useState('3 min');
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');

  const [pages, setPages] = useState([
    { text: '', image: '', audioUrl: '', sound: '', vocab: [] }
  ]);

  const [quiz, setQuiz] = useState([
    { question: '', options: ['', '', ''], correctIndex: 0 }
  ]);

  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stories');
      const data = await res.json();
      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Page Handler
  const handleAddPage = () => {
    setPages(prev => [...prev, { text: '', image: '', audioUrl: '', sound: '', vocab: [] }]);
  };

  const handleUpdatePage = (index, field, value) => {
    setPages(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemovePage = (index) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  // Vocab Handler
  const handleAddVocab = (pageIndex) => {
    setPages(prev => {
      const copy = [...prev];
      const currentVocab = copy[pageIndex].vocab || [];
      copy[pageIndex].vocab = [...currentVocab, { word: '', definition: '' }];
      return copy;
    });
  };

  const handleUpdateVocab = (pageIndex, vocabIndex, field, value) => {
    setPages(prev => {
      const copy = [...prev];
      const currentVocab = [...(copy[pageIndex].vocab || [])];
      currentVocab[vocabIndex] = { ...currentVocab[vocabIndex], [field]: value };
      copy[pageIndex].vocab = currentVocab;
      return copy;
    });
  };

  // Quiz Handler
  const handleAddQuiz = () => {
    setQuiz(prev => [...prev, { question: '', options: ['', '', ''], correctIndex: 0 }]);
  };

  const handleUpdateQuiz = (qIndex, field, value) => {
    setQuiz(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value };
      return copy;
    });
  };

  const handleUpdateQuizOption = (qIndex, optIndex, value) => {
    setQuiz(prev => {
      const copy = [...prev];
      const currentOpts = [...copy[qIndex].options];
      currentOpts[optIndex] = value;
      copy[qIndex].options = currentOpts;
      return copy;
    });
  };

  // Submit Handler
  const [loadingAiPrompt, setLoadingAiPrompt] = useState({});
  const [loadingAiAudio, setLoadingAiAudio] = useState({});

  const handleGenerateAiPrompt = async (pIdx, text) => {
    if (!text || !text.trim()) {
      alert('Please enter page story text first!');
      return;
    }
    try {
      setLoadingAiPrompt(prev => ({ ...prev, [pIdx]: true }));
      const res = await fetch('/api/admin/generate-story-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyText: text })
      });
      const data = await res.json();
      if (data.success && data.imagePrompt) {
        setPages(prevPages => {
          const newPages = [...prevPages];
          newPages[pIdx] = {
            ...newPages[pIdx],
            image: data.imagePrompt,
            imagePrompt: data.imagePrompt
          };
          return newPages;
        });
      }
    } catch (err) {
      alert(`Error generating AI prompt: ${err.message}`);
    } finally {
      setLoadingAiPrompt(prev => ({ ...prev, [pIdx]: false }));
    }
  };

  const handleGenerateAiAudio = async (pIdx, text) => {
    if (!text || !text.trim()) {
      alert('Please enter page story text first!');
      return;
    }
    try {
      setLoadingAiAudio(prev => ({ ...prev, [pIdx]: true }));
      const res = await fetch('/api/admin/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Puck' })
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        setPages(prevPages => {
          const newPages = [...prevPages];
          newPages[pIdx] = {
            ...newPages[pIdx],
            audioUrl: data.audioUrl
          };
          return newPages;
        });
      } else {
        alert(`TTS Warning: ${data.error || 'Check TTS server or Gemini key.'}`);
      }
    } catch (err) {
      alert(`Error generating TTS audio: ${err.message}`);
    } finally {
      setLoadingAiAudio(prev => ({ ...prev, [pIdx]: false }));
    }
  };

  const [loadingAiQuiz, setLoadingAiQuiz] = useState(false);

  const handleGenerateAiQuiz = async () => {
    const fullStoryText = pages.map(p => p.text).filter(Boolean).join('\n');
    if (!fullStoryText.trim()) {
      alert('Please add story pages text first!');
      return;
    }
    try {
      setLoadingAiQuiz(true);
      const res = await fetch('/api/admin/generate-story-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyText: fullStoryText, title })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuiz(data.quiz);
      }
    } catch (err) {
      alert(`Error generating AI quiz: ${err.message}`);
    } finally {
      setLoadingAiQuiz(false);
    }
  };

  const [editingSlug, setEditingSlug] = useState(null);

  const handleEditStory = (s) => {
    setEditingSlug(s.slug);
    setTitle(s.title || '');
    setCategory(s.category || 'Moral Stories');
    setGrade(s.grade || 'LKG / UKG');
    setReadTime(s.readTime || '3 min');
    setCoverImage(s.coverImage || '');
    setSummary(s.summary || '');
    setPages(Array.isArray(s.pages) && s.pages.length > 0 ? s.pages : [{ text: '', image: '', audioUrl: '', sound: '', vocab: [] }]);
    setQuiz(Array.isArray(s.quiz) && s.quiz.length > 0 ? s.quiz : [{ question: '', options: ['', '', ''], correctIndex: 0 }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSlug(null);
    setTitle('');
    setCoverImage('');
    setSummary('');
    setPages([{ text: '', image: '', audioUrl: '', sound: '', vocab: [] }]);
    setQuiz([{ question: '', options: ['', '', ''], correctIndex: 0 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || pages.length === 0 || !pages[0].text) {
      setStatusMsg('❌ Title and at least 1 page text are required!');
      return;
    }

    try {
      setStatusMsg('⏳ Saving story to MongoDB...');
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingSlug,
          title,
          category,
          grade,
          readTime,
          coverImage,
          summary,
          pages,
          quiz
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ Success! Story "${title}" saved to database.`);
        handleCancelEdit();
        fetchStories();
      } else {
        setStatusMsg(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setStatusMsg(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '32px 24px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 32px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: '#38bdf8' }}>
            📖 Admin Story Builder & Database Manager
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Create stories with images, audio narration, vocabulary, and quizzes, then save to MongoDB.
          </p>
        </div>
        <Link href="/stories" style={{ background: '#0284c7', color: '#ffffff', padding: '10px 18px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
          👀 View Stories Portal
        </Link>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ background: '#1e293b', borderRadius: '20px', padding: '28px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: editingSlug ? '#f59e0b' : '#38bdf8' }}>
              {editingSlug ? `✏️ Editing Story: "${title}"` : '✨ Create New Story'}
            </h2>
            {editingSlug && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                ✖️ Cancel Edit
              </button>
            )}
          </div>

          {statusMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: statusMsg.startsWith('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: statusMsg.startsWith('✅') ? '#34d399' : '#f87171', fontWeight: 700, marginBottom: '20px' }}>
              {statusMsg}
            </div>
          )}

          {/* Meta Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Story Title</label>
              <input
                type="text"
                placeholder="e.g. The Lion and the Mouse"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '14px' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '14px' }}
              >
                <option value="Moral Stories">Moral Stories</option>
                <option value="Adventure">Adventure</option>
                <option value="Phonics Readers">Phonics Readers</option>
                <option value="Bedtime Stories">Bedtime Stories</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Target Grade</label>
              <input
                type="text"
                placeholder="e.g. LKG / UKG"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Estimated Read Time</label>
              <input
                type="text"
                placeholder="e.g. 3 min"
                value={readTime}
                onChange={e => setReadTime(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Cover Image URL</label>
            <input
              type="text"
              placeholder="https://pub-xxx/cover-image.png"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Summary / Description</label>
            <textarea
              placeholder="Brief summary of the story..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '14px' }}
            />
          </div>

          <hr style={{ borderColor: '#334155', margin: '24px 0' }} />

          {/* Pages Builder */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#f59e0b' }}>
              📚 Story Pages ({pages.length})
            </h3>
            <button
              type="button"
              onClick={handleAddPage}
              style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
            >
              + Add Page
            </button>
          </div>

          {pages.map((p, pIdx) => (
            <div key={pIdx} style={{ background: '#0f172a', borderRadius: '14px', padding: '18px', marginBottom: '16px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '14px' }}>Page {pIdx + 1}</span>
                {pages.length > 1 && (
                  <button type="button" onClick={() => handleRemovePage(pIdx)} style={{ background: 'transparent', color: '#f87171', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    🗑️ Remove Page
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Page Story Text</label>
                <textarea
                  placeholder="Once upon a time..."
                  value={p.text}
                  onChange={e => handleUpdatePage(pIdx, 'text', e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              {/* AI Helper Bar */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleGenerateAiPrompt(pIdx, p.text)}
                  disabled={loadingAiPrompt[pIdx]}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loadingAiPrompt[pIdx] ? '⏳ Generating AI Prompt...' : '🎨 🤖 Generate AI Image Prompt'}
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAiAudio(pIdx, p.text)}
                  disabled={loadingAiAudio[pIdx]}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {loadingAiAudio[pIdx] ? '⏳ Generating TTS...' : '🎙️ 🤖 Generate AI TTS Audio'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Page Image / Prompt URL</label>
                  <textarea
                    rows={2}
                    placeholder="https://pub-xxx/page1.jpg or AI Prompt"
                    value={p.image || ''}
                    onChange={e => handleUpdatePage(pIdx, 'image', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                  />
                  {p.image && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#c084fc', wordBreak: 'break-word' }}>
                      🎨 {p.image}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Page Audio URL (TTS)</label>
                  <input
                    type="text"
                    placeholder="https://pub-xxx/audio.mp3"
                    value={p.audioUrl || ''}
                    onChange={e => handleUpdatePage(pIdx, 'audioUrl', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                  />
                  {p.audioUrl && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const a = new Audio(p.audioUrl);
                          a.play().catch(err => console.error('Audio play error:', err));
                        }}
                        style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                      >
                        ▶️ Play Audio
                      </button>
                      <span style={{ fontSize: '11px', color: '#34d399', wordBreak: 'break-all' }}>
                        {p.audioUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vocab Words */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700 }}>💡 Highlighted Vocab Words</label>
                  <button type="button" onClick={() => handleAddVocab(pIdx)} style={{ background: '#a78bfa', color: '#0f172a', border: 'none', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    + Word
                  </button>
                </div>
                {(p.vocab || []).map((v, vIdx) => (
                  <div key={vIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      placeholder="Word (e.g. mighty)"
                      value={v.word}
                      onChange={e => handleUpdateVocab(pIdx, vIdx, 'word', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      placeholder="Child-friendly definition"
                      value={v.definition}
                      onChange={e => handleUpdateVocab(pIdx, vIdx, 'definition', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', fontSize: '12px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <hr style={{ borderColor: '#334155', margin: '24px 0' }} />

          {/* Quiz Questions Builder */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
              🏆 Story Quiz Questions ({quiz.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleGenerateAiQuiz}
                disabled={loadingAiQuiz}
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
              >
                {loadingAiQuiz ? '⏳ Generating AI Quiz...' : '🤖 Generate AI Quiz'}
              </button>
              <button
                type="button"
                onClick={handleAddQuiz}
                style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
              >
                + Add Question
              </button>
            </div>
          </div>

          {quiz.map((q, qIdx) => (
            <div key={qIdx} style={{ background: '#0f172a', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '13px' }}>Question {qIdx + 1}</span>
                {quiz.length > 1 && (
                  <button type="button" onClick={() => setQuiz(prev => prev.filter((_, i) => i !== qIdx))} style={{ background: 'transparent', color: '#f87171', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                    🗑️ Remove
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Question Text</label>
                <input
                  type="text"
                  placeholder="e.g. What was Kabir doing?"
                  value={q.question}
                  onChange={e => handleUpdateQuiz(qIdx, 'question', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Answer Options</label>
                {(q.options || ['', '', '']).map((opt, optIdx) => (
                  <div key={optIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctIndex === optIdx}
                      onChange={() => handleUpdateQuiz(qIdx, 'correctIndex', optIdx)}
                      title="Mark as correct option"
                      style={{ cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      placeholder={`Option ${optIdx + 1}`}
                      value={opt}
                      onChange={e => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', background: '#1e293b', border: q.correctIndex === optIdx ? '1px solid #10b981' : '1px solid #475569', color: '#ffffff', fontSize: '12px' }}
                    />
                    {q.correctIndex === optIdx && (
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 800 }}>✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(14,165,233,0.3)',
              marginTop: '12px'
            }}
          >
            💾 Save Story to MongoDB
          </button>
        </form>

        {/* Existing Stories List */}
        <div style={{ background: '#1e293b', borderRadius: '20px', padding: '24px', border: '1px solid #334155', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: '#38bdf8' }}>
            📚 Saved Stories ({stories.length})
          </h3>

          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading stories...</p>
          ) : stories.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No stories created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stories.map(s => (
                <div key={s.slug} style={{ background: '#0f172a', padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px' }}>{s.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {s.category} • {s.pages?.length || 0} Pages
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleEditStory(s)}
                      style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ✏️ Edit Story
                    </button>
                    <Link href={`/stories/${s.slug}`} target="_blank" style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
                      🔗 Preview ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
