'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import styles from './from-image.module.css';

export default function GenerateQuestionsFromImagePage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [toast, setToast] = useState('');
  const [usage, setUsage] = useState(null);

  // Form Fields
  const [subject, setSubject] = useState('english');
  const [topic, setTopic] = useState('phonics');
  const [skillId, setSkillId] = useState('cvc-words');
  const [difficulty, setDifficulty] = useState('easy');
  const [count, setCount] = useState(3);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generationMode, setGenerationMode] = useState('static');

  const fileInputRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        handleFileSelect(droppedFile);
      } else {
        setError('Please drop or select a valid image file.');
      }
    }
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or upload an image file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    const steps = [
      'Uploading image payload...',
      'Running Gemini 2.5 Vision analysis...',
      'Extracting educational patterns...',
      'Formulating questions & explanations...',
      'Saving generated drafts to database...'
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setLoadingStep(steps[stepIndex]);
      }
    }, 2000);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    formData.append('topic', topic);
    formData.append('skillId', skillId);
    formData.append('difficulty', difficulty);
    formData.append('count', String(count));
    formData.append('customPrompt', customPrompt);
    formData.append('generationMode', generationMode);

    try {
      const response = await fetch('/api/admin/questions/generate-from-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions.');
      }

      setResults(data.questions || []);
      setUsage(data.usage || null);
      showToast(`Successfully generated ${data.questions?.length || 0} questions!`);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleApprove = async (questionId) => {
    try {
      const response = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, action: 'approve' }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve question.');
      }

      setResults((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: 'active' } : q))
      );
      showToast('Question approved & published successfully!');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleReject = async (questionId) => {
    try {
      const response = await fetch('/api/admin/questions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, action: 'reject' }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject question.');
      }

      setResults((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: 'rejected' } : q))
      );
      showToast('Question draft rejected.');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <SiteHeader />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>AI Worksheet-to-Question Generator</h1>
            <p>Upload worksheets, textbook pages, or drawings to instantly generate structured digital questions.</p>
          </div>
          <Link href="/admin/questions" className={styles.backBtn}>
            ← Question Manager
          </Link>
        </div>

        {/* Main Content Layout */}
        <div className={styles.grid}>
          {/* Left Panel: Upload and Settings */}
          <div className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span>📤</span> Upload & Configuration
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Dropzone */}
              <div className={styles.formGroup}>
                <label>Upload Document Image</label>
                {!previewUrl ? (
                  <div
                    className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <div className={styles.uploadIcon}>🖼️</div>
                    <span className={styles.dropText}>Drag & drop your image here, or browse</span>
                    <span className={styles.dropHint}>Supports PNG, JPG, WEBP up to 10MB</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div className={styles.previewContainer}>
                    <img src={previewUrl} alt="Upload Preview" className={styles.imagePreview} />
                    <button type="button" className={styles.changeImageBtn} onClick={clearFile}>
                      Change Image
                    </button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  className={styles.select}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="english">English / Literacy</option>
                  <option value="math">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="general">General / Trivia</option>
                </select>
              </div>

              {/* Topic */}
              <div className={styles.formGroup}>
                <label htmlFor="topic">Topic</label>
                <input
                  type="text"
                  id="topic"
                  className={styles.input}
                  value={topic}
                  placeholder="e.g. phonics, addition, fractions"
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              {/* Skill ID */}
              <div className={styles.formGroup}>
                <label htmlFor="skillId">Skill ID / Logic Type</label>
                <input
                  type="text"
                  id="skillId"
                  className={styles.input}
                  value={skillId}
                  placeholder="e.g. cvc-words, short-a, shape-matching"
                  onChange={(e) => setSkillId(e.target.value)}
                  required
                />
              </div>

              {/* Generation Mode */}
              <div className={styles.formGroup}>
                <label htmlFor="generationMode">Generation Mode / Output Target</label>
                <select
                  id="generationMode"
                  className={styles.select}
                  value={generationMode}
                  onChange={(e) => setGenerationMode(e.target.value)}
                >
                  <option value="static">✨ Static Question Drafts (Default)</option>
                  <option value="spreadsheet">📊 Spreadsheet Generator Grid (Rows)</option>
                  <option value="dynamic">⚙️ Dynamic Parameter Templates (Variables)</option>
                  <option value="pooling">🔤 Option Pooling Rules (Distractor Banks)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className={styles.formGroup}>
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  className={styles.select}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy / Beginner (LKG/UKG)</option>
                  <option value="medium">Medium (Grade 1-3)</option>
                  <option value="hard">Hard (Grade 4-5)</option>
                </select>
              </div>

              {/* Count */}
              <div className={styles.formGroup}>
                <label htmlFor="count">Number of Questions to Extract</label>
                <select
                  id="count"
                  className={styles.select}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                >
                  <option value={1}>1 Question</option>
                  <option value={2}>2 Questions</option>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              {/* Custom Prompt Guidelines */}
              <div className={styles.formGroup}>
                <label htmlFor="customPrompt">Additional Instructions / Guidelines</label>
                <textarea
                  id="customPrompt"
                  className={styles.input}
                  style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                  value={customPrompt}
                  placeholder="e.g. Ask only about the vowel sounds in the words, focus on matching visual items, create fill-in-the-blank questions..."
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px', fontWeight: '600' }}>⚠️ {error}</div>}

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.generateBtn}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <div className={styles.loadingSpinner} />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Convert to Questions</span>
                  </>
                )}
              </button>

              {loading && loadingStep && (
                <div className={styles.loadingStatusText}>{loadingStep}</div>
              )}
            </form>
          </div>

          {/* Right Panel: Extracted Results */}
          <div className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span>✨</span> Extracted Digital Questions
            </h2>

            {usage && (
              <div className={styles.usageBadge}>
                <div>
                  ✨ <strong>AI Cost:</strong> {usage.totalTokens?.toLocaleString()} tokens (~${usage.estimatedCost?.toFixed(6)})
                </div>
                <div className={styles.usageDetails}>
                  (Prompt: {usage.promptTokens?.toLocaleString()} | Completion: {usage.completionTokens?.toLocaleString()})
                </div>
              </div>
            )}

            {results.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🤖</div>
                <p>No questions generated yet</p>
                <span>Upload an image and click "Convert to Questions" to let Gemini extract interactive drafts.</span>
              </div>
            ) : generationMode === 'spreadsheet' ? (
              <div className={styles.resultsList}>
                <div className={styles.customOutputHeader}>
                  <h3>📊 Generated Spreadsheet Rows ({results.length})</h3>
                  <button
                    className={styles.copyJsonBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                      showToast('Copied spreadsheet JSON!');
                    }}
                  >
                    📋 Copy Row JSON
                  </button>
                </div>
                <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Target Word</th>
                        <th style={{ padding: '8px' }}>Target Image</th>
                        <th style={{ padding: '8px' }}>Result</th>
                        <th style={{ padding: '8px' }}>Distractors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>{row.target_word}</td>
                          <td style={{ padding: '8px', color: '#64748b' }}>{row.target_image}</td>
                          <td style={{ padding: '8px', color: '#16a34a', fontWeight: 'bold' }}>{row.Result}</td>
                          <td style={{ padding: '8px' }}>
                            {[row.distractor_1, row.distractor_2, row.distractor_3].filter(Boolean).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    className={styles.launchBtn}
                    onClick={() => {
                      localStorage.setItem('import_spreadsheet_rows', JSON.stringify(results));
                      window.location.href = '/template-generator-grid';
                    }}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    Launch Spreadsheet Creator Grid ➔
                  </button>
                </div>
              </div>
            ) : generationMode === 'dynamic' ? (
              <div className={styles.resultsList}>
                <div className={styles.customOutputHeader}>
                  <h3>⚙️ Dynamic Parameter Templates ({results.length})</h3>
                  <button
                    className={styles.copyJsonBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                      showToast('Copied templates JSON!');
                    }}
                  >
                    📋 Copy Templates JSON
                  </button>
                </div>
                {results.map((tmpl, idx) => (
                  <div key={idx} className={styles.questionCard}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Template {idx + 1}</h4>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#334155', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                      {tmpl.templateText}
                    </p>
                    <div style={{ marginTop: '16px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Variables Defined:</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {tmpl.variables?.map((v, vIdx) => (
                          <div key={vIdx} style={{ fontSize: '0.825rem', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ color: '#db2777', fontWeight: 'bold' }}>{v.name}</span> ({v.type}): {v.values?.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    className={styles.launchBtn}
                    onClick={() => {
                      localStorage.setItem('import_dynamic_template', JSON.stringify(results));
                      window.location.href = '/template-generator';
                    }}
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    Launch Universal Template Builder ➔
                  </button>
                </div>
              </div>
            ) : generationMode === 'pooling' ? (
              <div className={styles.resultsList}>
                <div className={styles.customOutputHeader}>
                  <h3>🔤 Option Pooling Distractor Banks</h3>
                  <button
                    className={styles.copyJsonBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                      showToast('Copied pool JSON!');
                    }}
                  >
                    📋 Copy Pool JSON
                  </button>
                </div>
                {results.map((pool, idx) => (
                  <div key={idx} className={styles.questionCard}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{pool.poolName || 'Option Pool'}</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Topic: {pool.topic} | Skill: {pool.skillId}
                      </span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Candidate Distractor Pairings:</strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px' }}>
                        {pool.candidates?.map((c, cIdx) => (
                          <div key={cIdx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fafafa' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>Target: {c.word} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>({c.category})</span></div>
                            <div style={{ fontSize: '0.825rem', color: '#ef4444', marginTop: '6px' }}>
                              Distractors: {c.distractors?.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.resultsList}>
                {results.map((q, idx) => (
                  <div key={q.id || idx} className={styles.questionCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.questionNumber}>Question {idx + 1}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`${styles.qBadge} ${q.type === 'mcq' ? styles.mcqBadge : styles.fibBadge}`}>
                          {q.type}
                        </span>
                        <span
                          className={`${styles.statusBadge} ${
                            q.status === 'active'
                              ? styles.approvedBadge
                              : q.status === 'rejected'
                              ? styles.rejectedBadge
                              : styles.draftBadge
                          }`}
                        >
                          {q.status || 'draft'}
                        </span>
                      </div>
                    </div>

                    {q.parts && q.parts.length > 0 ? (
                      <div className={styles.partsContainer}>
                        {q.parts.map((part, pIdx) => {
                          if (part.type === 'text') {
                            return (
                              <p key={pIdx} className={styles.partText}>
                                {part.content}
                              </p>
                            );
                          }
                          if (part.type === 'image') {
                            return (
                              <div key={pIdx} className={styles.partImagePlaceholder}>
                                <span>🖼️ Image Needed:</span> {part.content}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      <h3 className={styles.questionText}>
                        {q.questionText}
                      </h3>
                    )}

                    {q.options && q.options.length > 0 && (
                      <div className={styles.optionsGrid}>
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`${styles.optionCard} ${
                              opt.isCorrect ? styles.optionCorrect : ''
                            }`}
                          >
                            {opt.isCorrect && <div className={styles.correctDot} />}
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className={styles.explanation}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}

                    {q.status !== 'active' && q.status !== 'rejected' && (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.rejectBtn}`}
                          onClick={() => handleReject(q.id)}
                        >
                          Reject Draft
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.approveBtn}`}
                          onClick={() => handleApprove(q.id)}
                        >
                          Approve & Publish
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
