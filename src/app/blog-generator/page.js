'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Markdown inline formatter ────────────────────────────────────────
// Converts **bold**, *italic*, ***bold-italic***, `code` to React elements
function applyMarkdown(text, keyBase) {
  if (!text) return [];
  const mdRegex = /(\*\*\*)(.*?)(\*\*\*)|\*\*(.*?)\*\*|\*((?!\s)[^*\n]*?(?<!\s))\*|`([^`]+)`/g;
  const result = [];
  let last = 0;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    if (match.index > last) result.push(text.substring(last, match.index));
    const k = `${keyBase}-md-${match.index}`;
    if (match[2] !== undefined) {
      result.push(<strong key={k}><em>{match[2]}</em></strong>);
    } else if (match[4] !== undefined) {
      result.push(<strong key={k}>{match[4]}</strong>);
    } else if (match[5] !== undefined) {
      result.push(<em key={k}>{match[5]}</em>);
    } else if (match[6] !== undefined) {
      result.push(
        <code key={k} style={{ fontFamily: 'monospace', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '1px 5px', borderRadius: 4, fontSize: '0.88em', color: '#0f172a' }}>
          {match[6]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) result.push(text.substring(last));
  return result.length === 0 ? [text] : result;
}

// ─── Math + Markdown Renderer ─────────────────────────────────────────
// Handles $$display$$, $inline$, **bold**, *italic*, `code` all at once
function renderMath(text) {
  if (!text || typeof text !== 'string') return text;

  // Step 1: split on display math $$...$$
  const dispParts = text.split(/(\$\$[\s\S]*?\$\$)/g);

  return dispParts.map((part, didx) => {
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      const math = part.slice(2, -2);
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return <div key={`disp-${didx}`} dangerouslySetInnerHTML={{ __html: html }} className="bg-math-block" />;
      } catch {
        return <div key={`disp-${didx}`} className="bg-math-err">{part}</div>;
      }
    }

    // Step 2: split on inline math $...$
    const inlineRegex = /\$(?!\s)([^\$\n]{1,150}?)(?<!\s)\$/g;
    const segments = [];
    let last = 0;
    let m;
    while ((m = inlineRegex.exec(part)) !== null) {
      if (/^\d+[\d,.]*$/.test(m[1])) continue; // skip plain numbers / currency
      // Apply markdown to text BEFORE this math token
      if (m.index > last) {
        segments.push(...applyMarkdown(part.substring(last, m.index), `${didx}-${last}`));
      }
      try {
        const html = katex.renderToString(m[1], { displayMode: false, throwOnError: false });
        segments.push(
          <span key={`inl-${didx}-${m.index}`} dangerouslySetInnerHTML={{ __html: html }} style={{ fontStyle: 'normal' }} />
        );
      } catch {
        segments.push(m[0]);
      }
      last = inlineRegex.lastIndex;
    }
    // Apply markdown to remaining text after last math token
    if (last < part.length) {
      segments.push(...applyMarkdown(part.substring(last), `${didx}-${last}`));
    }
    return <span key={`seg-${didx}`}>{segments}</span>;
  });
}

function MathText({ children, className = '' }) {
  if (!children) return null;
  return <span className={className}>{renderMath(String(children))}</span>;
}

function MathParagraph({ children, className = '' }) {
  if (!children) return null;
  return <p className={className}>{renderMath(String(children))}</p>;
}


// ─── Blog Renderer ────────────────────────────────────────────────────
function BlogRenderer({ blog }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  if (!blog) return null;

  const { seo, hero, introduction, conceptOverview, stepByStepGuide,
    workedExamples, commonMistakes, examTips, practiceProblems, faq, conclusion, callToAction } = blog;

  return (
    <article className="blog-article">

      {/* ── SEO META PANEL ── */}
      {seo && (
        <div className="seo-meta-panel no-print">
          <div className="seo-meta-header">🔍 SEO Metadata Preview</div>
          <div className="seo-meta-body">
            <div className="seo-row">
              <span className="seo-label">Title Tag</span>
              <span className="seo-value seo-title-preview">{seo.title}</span>
              <span className={`seo-len ${(seo.title||'').length > 60 ? 'seo-len-bad' : 'seo-len-ok'}`}>{(seo.title||'').length} chars</span>
            </div>
            <div className="seo-row">
              <span className="seo-label">Meta Description</span>
              <span className="seo-value">{seo.metaDescription}</span>
              <span className={`seo-len ${(seo.metaDescription||'').length > 160 ? 'seo-len-bad' : 'seo-len-ok'}`}>{(seo.metaDescription||'').length} chars</span>
            </div>
            <div className="seo-row">
              <span className="seo-label">Slug</span>
              <code className="seo-slug">/blog/{seo.slug}</code>
            </div>
            <div className="seo-row">
              <span className="seo-label">Focus Keyword</span>
              <span className="seo-keyword-pill">{seo.focusKeyword}</span>
            </div>
            {seo.tags && (
              <div className="seo-row">
                <span className="seo-label">Tags</span>
                <div className="seo-tags">{seo.tags.map((t, i) => <span key={i} className="tag-pill">{t}</span>)}</div>
              </div>
            )}
          </div>
          {/* Google SERP Preview */}
          <div className="serp-preview">
            <div className="serp-title">{seo.title}</div>
            <div className="serp-url">https://yourdomain.com/blog/{seo.slug}</div>
            <div className="serp-desc">{seo.metaDescription}</div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      {hero && (
        <header className="blog-hero">
          <div className="blog-hero-badges">
            {hero.difficulty && <span className="hero-badge difficulty-badge">{hero.difficulty}</span>}
            {hero.readTime && <span className="hero-badge read-time-badge">🕐 {hero.readTime}</span>}
            {seo?.tags?.[0] && <span className="hero-badge subject-badge">{seo.tags[0]}</span>}
          </div>
          <h1 className="blog-headline">{hero.headline}</h1>
          {hero.subheadline && <p className="blog-subheadline">{hero.subheadline}</p>}
          {hero.examRelevance && (
            <div className="exam-relevance-box">
              <span className="exam-relevance-icon">🎯</span>
              <span>{hero.examRelevance}</span>
            </div>
          )}
        </header>
      )}

      {/* ── INTRODUCTION ── */}
      {introduction && (
        <section className="blog-section">
          <div className="blog-intro-text">
            {introduction.split('\n').filter(Boolean).map((para, i) => (
              <MathParagraph key={i}>{para}</MathParagraph>
            ))}
          </div>
        </section>
      )}

      {/* ── CONCEPT OVERVIEW ── */}
      {conceptOverview && (
        <section className="blog-section concept-section">
          <h2 className="blog-h2">{conceptOverview.title}</h2>
          <div className="concept-body">
            {conceptOverview.explanation && conceptOverview.explanation.split('\n').filter(Boolean).map((p, i) => (
              <MathParagraph key={i} className="concept-para">{p}</MathParagraph>
            ))}
            {conceptOverview.keyFormula && (
              <div className="key-formula-box">
                <div className="key-formula-label">📐 Key Formula</div>
                <div className="key-formula-math"><MathText>{conceptOverview.keyFormula}</MathText></div>
                {conceptOverview.formulaExplanation && (
                  <MathParagraph className="formula-explanation">{conceptOverview.formulaExplanation}</MathParagraph>
                )}
              </div>
            )}
            {conceptOverview.realWorldAnalogy && (
              <div className="analogy-box">
                <span className="analogy-icon">💡</span>
                <div>
                  <strong>Think of it this way:</strong>
                  <MathParagraph>{conceptOverview.realWorldAnalogy}</MathParagraph>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── STEP-BY-STEP GUIDE ── */}
      {stepByStepGuide && (
        <section className="blog-section steps-section">
          <h2 className="blog-h2">{stepByStepGuide.title}</h2>
          {stepByStepGuide.intro && <MathParagraph className="steps-intro">{stepByStepGuide.intro}</MathParagraph>}
          {stepByStepGuide.steps && (
            <ol className="steps-list">
              {stepByStepGuide.steps.map((step) => (
                <li key={step.stepNumber} className="step-item">
                  <div className="step-number-badge">{step.stepNumber}</div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <MathParagraph className="step-explanation">{step.explanation}</MathParagraph>
                    {step.math && (
                      <div className="step-math-box">
                        <MathText>{step.math}</MathText>
                      </div>
                    )}
                    {step.proTip && (
                      <div className="step-tip">
                        <span>💡 Pro Tip:</span> <MathText>{step.proTip}</MathText>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* ── WORKED EXAMPLES ── */}
      {workedExamples && workedExamples.length > 0 && (
        <section className="blog-section examples-section">
          <h2 className="blog-h2">✍️ Worked Examples</h2>
          {workedExamples.map((ex) => (
            <div key={ex.exampleNumber} className="example-card">
              <div className="example-header">
                <span className="example-number">Example {ex.exampleNumber}</span>
                {ex.difficulty && <span className={`difficulty-pill diff-${ex.difficulty?.toLowerCase()}`}>{ex.difficulty}</span>}
              </div>
              <div className="example-problem">
                <strong>Problem:</strong> <MathText>{ex.problem}</MathText>
              </div>
              {ex.solution && (
                <div className="example-solution">
                  {ex.solution.approach && (
                    <p className="solution-approach"><em>Approach: </em><MathText>{ex.solution.approach}</MathText></p>
                  )}
                  {ex.solution.steps && ex.solution.steps.length > 0 && (
                    <div className="solution-steps">
                      {ex.solution.steps.map((s) => (
                        <div key={s.stepNumber} className="solution-step">
                          <div className="sol-step-num">Step {s.stepNumber}</div>
                          <div className="sol-step-body">
                            {s.action && <div className="sol-action"><MathText>{s.action}</MathText></div>}
                            {s.math && <div className="sol-math"><MathText>{s.math}</MathText></div>}
                            {s.explanation && <div className="sol-why"><MathText>{s.explanation}</MathText></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.solution.finalAnswer && (
                    <div className="final-answer-box">
                      <span className="final-answer-label">✅ Final Answer:</span>
                      <MathText className="final-answer-math">{ex.solution.finalAnswer}</MathText>
                    </div>
                  )}
                  {ex.solution.checkYourWork && (
                    <div className="check-work">
                      <span>🔍 Check:</span> <MathText>{ex.solution.checkYourWork}</MathText>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── COMMON MISTAKES ── */}
      {commonMistakes && commonMistakes.length > 0 && (
        <section className="blog-section mistakes-section">
          <h2 className="blog-h2">⚠️ Common Mistakes to Avoid</h2>
          <div className="mistakes-grid">
            {commonMistakes.map((m, i) => (
              <div key={i} className="mistake-card">
                <div className="mistake-label">❌ Common Mistake #{i + 1}</div>
                <MathParagraph className="mistake-desc">{m.mistake}</MathParagraph>
                <div className="mistake-compare">
                  <div className="mistake-wrong">
                    <div className="compare-label wrong-label">Wrong ❌</div>
                    <MathText>{m.wrongApproach}</MathText>
                  </div>
                  <div className="mistake-arrow">→</div>
                  <div className="mistake-right">
                    <div className="compare-label right-label">Correct ✅</div>
                    <MathText>{m.correctApproach}</MathText>
                  </div>
                </div>
                {m.memoryTrick && (
                  <div className="memory-trick">🧠 <strong>Remember:</strong> <MathText>{m.memoryTrick}</MathText></div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EXAM TIPS ── */}
      {examTips && (
        <section className="blog-section exam-tips-section">
          <h2 className="blog-h2">{examTips.title || '🎯 Exam Strategy'}</h2>
          {examTips.tips && (
            <ul className="exam-tips-list">
              {examTips.tips.map((tip, i) => (
                <li key={i} className="exam-tip-item">
                  <span className="tip-num">{i + 1}</span>
                  <MathText>{tip}</MathText>
                </li>
              ))}
            </ul>
          )}
          <div className="exam-meta-boxes">
            {examTips.timeManagement && (
              <div className="exam-meta-box time-box">
                <div className="exam-meta-icon">⏱️</div>
                <div className="exam-meta-label">Time Management</div>
                <div className="exam-meta-value"><MathText>{examTips.timeManagement}</MathText></div>
              </div>
            )}
            {examTips.quickCheckMethod && (
              <div className="exam-meta-box check-box">
                <div className="exam-meta-icon">⚡</div>
                <div className="exam-meta-label">Quick Check</div>
                <div className="exam-meta-value"><MathText>{examTips.quickCheckMethod}</MathText></div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PRACTICE PROBLEMS ── */}
      {practiceProblems && practiceProblems.length > 0 && (
        <section className="blog-section practice-section">
          <h2 className="blog-h2">📝 Practice Problems</h2>
          <p className="practice-intro">Try these on your own before revealing the answer!</p>
          {practiceProblems.map((prob, i) => (
            <div key={i} className="practice-card">
              <div className="practice-header">
                <span className="practice-num">Q{i + 1}</span>
                <MathText className="practice-question">{prob.question}</MathText>
              </div>
              {prob.hint && (
                <div className="practice-hint">💡 Hint: <MathText>{prob.hint}</MathText></div>
              )}
              <button
                className="reveal-btn"
                onClick={() => setRevealedAnswers(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                {revealedAnswers[i] ? '🙈 Hide Answer' : '👁 Reveal Answer'}
              </button>
              {revealedAnswers[i] && (
                <div className="practice-answer">
                  <MathText>{prob.answer}</MathText>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── FAQ ── */}
      {faq && faq.length > 0 && (
        <section className="blog-section faq-section">
          <h2 className="blog-h2">❓ Frequently Asked Questions</h2>
          <div className="faq-list">
            {faq.map((item, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.question}</span>
                  <span className="faq-chevron">{openFaq === i ? '▲' : '▼'}</span>
                </button>
                {openFaq === i && (
                  <div className="faq-answer"><MathText>{item.answer}</MathText></div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CONCLUSION ── */}
      {conclusion && (
        <section className="blog-section conclusion-section">
          <h2 className="blog-h2">🏁 Wrapping Up</h2>
          <div className="conclusion-body">
            {conclusion.split('\n').filter(Boolean).map((p, i) => (
              <MathParagraph key={i}>{p}</MathParagraph>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      {callToAction && (
        <div className="blog-cta-box">
          <MathParagraph className="blog-cta-text">{callToAction}</MathParagraph>
          <div className="blog-cta-actions">
            <Link href="/test-lesson" className="cta-btn primary-cta">Generate a Worksheet →</Link>
            <Link href="/blog" className="cta-btn secondary-cta">More Blog Posts</Link>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default function BlogGeneratorPage() {
  // ── Mode: 'keyword' | 'text' ──
  const [mode, setMode] = useState('keyword');

  // ── Keyword mode state ──
  const [examName, setExamName] = useState('JNVST 2026');
  const [subject, setSubject] = useState('Mathematics');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [concept, setConcept] = useState('Fractions');
  const [grade, setGrade] = useState('6');
  const [shortcutDetails, setShortcutDetails] = useState('Using the cross-multiplication butterfly method to add and subtract fractions quickly without finding LCM');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [blogStyle, setBlogStyle] = useState('tutorial'); // 'tutorial' | 'guide'

  // ── Text mode state ──
  const [rawText, setRawText] = useState('');
  const [textExamName, setTextExamName] = useState('JNVST 2026');
  const [textInstructions, setTextInstructions] = useState('');

  // ── Shared state ──
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // { slug, url } | null
  const [savingToDb, setSavingToDb] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [previewMode, setPreviewMode] = useState('render'); // 'render' | 'json'
  const blogRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setBlog(null);
    try {
      const res = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName,
          subject: showCustomSubject ? customSubject : subject,
          concept,
          grade,
          shortcutDetails,
          additionalInstructions,
          blogStyle
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBlog(data.blog);
        setUsage(data.usage || null);
        setTimeout(() => blogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        setError(data.error || 'Generation failed.');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!rawText.trim() || rawText.trim().length < 20) {
      setError('Please paste at least a few sentences of text.');
      return;
    }
    setLoading(true);
    setError('');
    setBlog(null);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/generate-blog-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          examName: textExamName,
          additionalInstructions: textInstructions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBlog(data.blog);
        setUsage(data.usage || null);
        setTimeout(() => blogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        setError(data.error || 'Generation failed.');
        if (data.rawOutput) console.log('Raw AI output:', data.rawOutput);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!blog) return;
    navigator.clipboard.writeText(JSON.stringify(blog, null, 2));
  };

  const handlePrint = () => window.print();

  const handleSaveToDb = async () => {
    if (!blog) return;
    setSavingToDb(true);
    setSaveError('');
    setSaveStatus(null);
    try {
      const res = await fetch('/api/blogs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogJson: blog,
          examName: mode === 'text' ? textExamName : examName,
          subject: mode === 'text' ? (blog.seo?.tags?.[0] || 'general') : subject,
          concept: mode === 'text' ? (blog.seo?.focusKeyword || blog.hero?.headline || 'Unstructured Content') : concept,
          grade: mode === 'text' ? '6' : grade,
          usage,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSaveStatus({ slug: data.slug, url: data.blogUrl });
      } else {
        setSaveError(data.error || 'Save failed.');
      }
    } catch (err) {
      setSaveError('Network error: ' + err.message);
    } finally {
      setSavingToDb(false);
    }
  };

  return (
    <div className="bg-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .bg-page {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
        }

        /* ── TOP NAV ── */
        .bg-nav {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .bg-nav-brand {
          font-size: 1rem;
          font-weight: 800;
          color: #6d28d9;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bg-nav-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* ── HERO BANNER ── */
        .bg-hero-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 40%, #6d28d9 100%);
          color: white;
          padding: 48px 24px 40px;
          text-align: center;
        }
        .bg-hero-banner h1 {
          font-size: clamp(1.6rem, 4vw, 2.5rem);
          font-weight: 900;
          margin: 0 0 12px;
          line-height: 1.2;
        }
        .bg-hero-banner p {
          font-size: 1rem;
          color: #c4b5fd;
          margin: 0;
        }

        /* ── MODE TABS ── */
        .bg-mode-tabs {
          max-width: 900px;
          margin: -16px auto 0;
          position: relative;
          z-index: 11;
          display: flex;
          gap: 0;
          padding: 0 4px;
        }
        .bg-mode-tab {
          padding: 10px 22px;
          font-size: 0.88rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          border-bottom: none;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 10px 10px 0 0;
          transition: all 0.15s ease;
        }
        .bg-mode-tab:first-child { margin-right: 4px; }
        .bg-mode-tab:hover:not(.active) { background: #e2e8f0; color: #334155; }
        .bg-mode-tab.active {
          background: white;
          color: #6d28d9;
          border-color: #e2e8f0;
          box-shadow: 0 -2px 0 0 #7c3aed inset;
        }

        /* ── FORM CARD ── */
        .bg-form-card {
          max-width: 900px;
          margin: -24px auto 32px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          padding: 28px 32px;
          position: relative;
          z-index: 10;
        }
        .bg-form-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #4c1d95;
          margin: 0 0 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bg-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 700px) {
          .bg-form-grid { grid-template-columns: 1fr; }
          .bg-form-card { margin: -16px 16px 24px; padding: 20px; }
        }
        .bg-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .bg-field label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .bg-field input, .bg-field select, .bg-field textarea {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.92rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          color: #1e293b;
          background: white;
        }
        .bg-field input:focus, .bg-field select:focus, .bg-field textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px #7c3aed18;
        }
        .bg-field-full { grid-column: 1 / -1; }
        .bg-generate-row {
          margin-top: 20px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .bg-generate-btn {
          padding: 12px 28px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(124,58,237,0.35);
        }
        .bg-generate-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124,58,237,0.45);
        }
        .bg-generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .bg-action-btn {
          padding: 10px 20px;
          border: 1.5px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          color: #374151;
          transition: background 0.2s, border-color 0.2s;
        }
        .bg-action-btn:hover { background: #f9fafb; border-color: #7c3aed44; color: #7c3aed; }
        .bg-usage-chip {
          font-size: 0.8rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
        }
        .bg-error {
          margin-top: 16px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 0.88rem;
        }

        /* ── LOADING SKELETON ── */
        .bg-skeleton-wrap {
          max-width: 900px;
          margin: 0 auto 32px;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bg-skel {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 400% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* ─── SPINNER ─── */
        .bg-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── BLOG WRAPPER ── */
        .bg-blog-wrap {
          max-width: 900px;
          margin: 0 auto 60px;
          padding: 0 24px;
        }

        /* ── SAVED BANNER ── */
        .bg-saved-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border: 1.5px solid #6ee7b7;
          border-radius: 12px;
          padding: 14px 20px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .bg-saved-icon { font-size: 1.4rem; flex-shrink: 0; }
        .bg-saved-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .bg-saved-body strong { font-size: 0.92rem; color: #065f46; }
        .bg-saved-body span { font-size: 0.8rem; color: #047857; }
        .bg-saved-body code {
          font-family: 'Fira Code', monospace;
          background: rgba(0,0,0,0.07);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.78rem;
        }
        .bg-saved-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .bg-saved-link {
          padding: 7px 16px;
          background: #059669;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 700;
          transition: opacity 0.2s;
        }
        .bg-saved-link:hover { opacity: 0.88; }

        /* ── BLOG ACTION STRIP ── */
        .bg-blog-action-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0 16px;
          flex-wrap: wrap;
        }
        .bg-blog-action-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ── BLOG ARTICLE ── */
        .blog-article {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* ── SEO PANEL ── */
        .seo-meta-panel {
          background: white;
          border: 1.5px solid #e0e7ff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(79,70,229,0.08);
        }
        .seo-meta-header {
          background: linear-gradient(90deg, #4f46e5, #7c3aed);
          color: white;
          padding: 10px 16px;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .seo-meta-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .seo-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.85rem;
        }
        .seo-label {
          flex-shrink: 0;
          width: 130px;
          font-weight: 700;
          color: #6b7280;
          font-size: 0.78rem;
          padding-top: 2px;
        }
        .seo-value { flex: 1; color: #1e293b; line-height: 1.5; }
        .seo-title-preview { font-weight: 600; color: #1a0dab; }
        .seo-len {
          font-size: 0.72rem;
          padding: 2px 7px;
          border-radius: 20px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .seo-len-ok { background: #dcfce7; color: #166534; }
        .seo-len-bad { background: #fee2e2; color: #dc2626; }
        .seo-slug { font-family: 'Fira Code', monospace; font-size: 0.8rem; color: #0ea5e9; background: #f0f9ff; padding: 2px 8px; border-radius: 4px; }
        .seo-keyword-pill {
          background: #ede9fe;
          color: #6d28d9;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .seo-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag-pill {
          background: #f1f5f9;
          color: #475569;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .serp-preview {
          background: #f8faff;
          border-top: 1px solid #e0e7ff;
          padding: 16px;
        }
        .serp-title { color: #1a0dab; font-size: 1.1rem; font-weight: 500; margin-bottom: 2px; }
        .serp-url { color: #006621; font-size: 0.82rem; margin-bottom: 4px; }
        .serp-desc { color: #545454; font-size: 0.88rem; line-height: 1.5; }

        /* ── BLOG HERO ── */
        .blog-hero {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          color: white;
          border-radius: 16px;
          padding: 40px 36px;
          position: relative;
          overflow: hidden;
        }
        .blog-hero::before {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%);
          border-radius: 50%;
        }
        .blog-hero-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .hero-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .difficulty-badge { background: rgba(250,204,21,0.2); color: #fbbf24; border: 1px solid #fbbf2444; }
        .read-time-badge { background: rgba(167,243,208,0.15); color: #6ee7b7; border: 1px solid #6ee7b722; }
        .subject-badge { background: rgba(167,139,250,0.2); color: #c4b5fd; border: 1px solid #c4b5fd33; }
        .blog-headline {
          font-family: 'Merriweather', Georgia, serif;
          font-size: clamp(1.5rem, 3.5vw, 2.2rem);
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 12px;
          color: white;
        }
        .blog-subheadline {
          font-size: 1rem;
          color: #c4b5fd;
          margin: 0 0 16px;
          line-height: 1.5;
        }
        .exam-relevance-box {
          display: inline-flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 0.88rem;
          color: #e0e7ff;
          line-height: 1.4;
        }
        .exam-relevance-icon { font-size: 1rem; flex-shrink: 0; }

        /* ── BLOG SECTIONS ── */
        .blog-section {
          background: white;
          border-radius: 14px;
          padding: 32px 36px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .blog-h2 {
          font-family: 'Merriweather', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #ede9fe;
        }
        .blog-intro-text p {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #374151;
          margin: 0 0 16px;
        }
        .blog-intro-text p:last-child { margin-bottom: 0; }

        /* ── CONCEPT SECTION ── */
        .concept-para {
          font-size: 1rem;
          line-height: 1.7;
          color: #374151;
          margin: 0 0 14px;
        }
        .key-formula-box {
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          border: 1.5px solid #c4b5fd;
          border-radius: 12px;
          padding: 20px 24px;
          margin: 20px 0;
          text-align: center;
        }
        .key-formula-label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6d28d9;
          margin-bottom: 12px;
        }
        .key-formula-math { font-size: 1.1rem; }
        .formula-explanation {
          margin: 12px 0 0;
          font-size: 0.88rem;
          color: #4c1d95;
          line-height: 1.5;
        }
        .analogy-box {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 16px 20px;
          margin-top: 16px;
        }
        .analogy-icon { font-size: 1.4rem; flex-shrink: 0; }
        .analogy-box strong { display: block; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .analogy-box p { margin: 0; font-size: 0.92rem; color: #78350f; line-height: 1.6; }

        /* ── STEPS ── */
        .steps-intro {
          font-size: 0.95rem;
          color: #4b5563;
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .step-item {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }
        .step-number-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }
        .step-content { flex: 1; }
        .step-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 6px;
          padding-top: 8px;
        }
        .step-explanation {
          font-size: 0.92rem;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 10px;
        }
        .step-math-box {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 8px 0;
          font-size: 1rem;
        }
        .step-tip {
          font-size: 0.82rem;
          color: #0369a1;
          background: #e0f2fe;
          border-radius: 6px;
          padding: 8px 12px;
          margin-top: 8px;
        }
        .step-tip span { font-weight: 700; }

        /* ── WORKED EXAMPLES ── */
        .example-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .example-card:last-child { margin-bottom: 0; }
        .example-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .example-number {
          font-size: 0.82rem;
          font-weight: 800;
          color: #4f46e5;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .difficulty-pill {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 20px;
        }
        .diff-easy { background: #dcfce7; color: #166534; }
        .diff-medium { background: #fef9c3; color: #854d0e; }
        .diff-hard { background: #fee2e2; color: #991b1b; }
        .example-problem {
          padding: 16px 20px;
          font-size: 1rem;
          color: #1e293b;
          line-height: 1.6;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbff;
        }
        .example-problem strong { color: #6d28d9; }
        .example-solution { padding: 20px; }
        .solution-approach {
          font-size: 0.88rem;
          color: #6b7280;
          margin: 0 0 16px;
          font-style: italic;
        }
        .solution-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .solution-step {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .solution-step:last-child { border-bottom: none; }
        .sol-step-num {
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 14px 14px;
          min-width: 64px;
          text-align: center;
          border-right: 1px solid #ede9fe;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sol-step-body { padding: 12px 16px; flex: 1; }
        .sol-action { font-size: 0.88rem; font-weight: 600; color: #374151; margin-bottom: 4px; }
        .sol-math {
          font-size: 1rem;
          padding: 6px 0;
        }
        .sol-why { font-size: 0.82rem; color: #6b7280; margin-top: 4px; }
        .final-answer-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #86efac;
          border-radius: 10px;
          padding: 14px 20px;
          margin-bottom: 10px;
        }
        .final-answer-label { font-weight: 700; color: #15803d; font-size: 0.9rem; flex-shrink: 0; }
        .final-answer-math { font-size: 1.05rem; }
        .check-work {
          font-size: 0.82rem;
          color: #0369a1;
          background: #f0f9ff;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .check-work span { font-weight: 700; }

        /* ── MISTAKES ── */
        .mistakes-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mistake-card {
          border: 1.5px solid #fee2e2;
          border-radius: 12px;
          padding: 20px;
          background: #fff5f5;
        }
        .mistake-label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #dc2626;
          margin-bottom: 8px;
        }
        .mistake-desc {
          font-size: 0.92rem;
          color: #374151;
          margin: 0 0 14px;
          line-height: 1.5;
        }
        .mistake-compare {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        .mistake-wrong, .mistake-right {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .mistake-wrong { background: #fee2e2; border: 1px solid #fca5a5; }
        .mistake-right { background: #dcfce7; border: 1px solid #86efac; }
        .compare-label { font-size: 0.72rem; font-weight: 700; margin-bottom: 6px; }
        .wrong-label { color: #dc2626; }
        .right-label { color: #16a34a; }
        .mistake-arrow { font-size: 1.2rem; color: #9ca3af; text-align: center; }
        .memory-trick {
          font-size: 0.85rem;
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 10px 14px;
          color: #78350f;
          line-height: 1.5;
        }

        /* ── EXAM TIPS ── */
        .exam-tips-section { background: linear-gradient(135deg, #faf5ff, #f0fdf4); }
        .exam-tips-list {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .exam-tip-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #374151;
        }
        .tip-num {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .exam-meta-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .exam-meta-box {
          border-radius: 12px;
          padding: 18px 20px;
          text-align: center;
        }
        .time-box { background: #fef3c7; border: 1.5px solid #fde68a; }
        .check-box { background: #e0f2fe; border: 1.5px solid #bae6fd; }
        .exam-meta-icon { font-size: 1.5rem; margin-bottom: 6px; }
        .exam-meta-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 4px; }
        .exam-meta-value { font-size: 0.88rem; color: #374151; line-height: 1.5; }

        /* ── PRACTICE ── */
        .practice-intro { font-size: 0.88rem; color: #6b7280; margin: 0 0 20px; }
        .practice-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          background: #f8fafc;
        }
        .practice-card:last-child { margin-bottom: 0; }
        .practice-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .practice-num {
          background: #4f46e5;
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 4px 9px;
          border-radius: 6px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .practice-question { font-size: 0.95rem; color: #1e293b; line-height: 1.6; }
        .practice-hint {
          font-size: 0.82rem;
          color: #0369a1;
          background: #e0f2fe;
          border-radius: 6px;
          padding: 6px 12px;
          margin-bottom: 12px;
        }
        .reveal-btn {
          padding: 7px 16px;
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          color: #4f46e5;
          transition: background 0.2s, border-color 0.2s;
        }
        .reveal-btn:hover { background: #f5f3ff; border-color: #a5b4fc; }
        .practice-answer {
          margin-top: 12px;
          padding: 12px 16px;
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #15803d;
          font-weight: 600;
        }

        /* ── FAQ ── */
        .faq-list { display: flex; flex-direction: column; gap: 8px; }
        .faq-item { border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
        .faq-item.faq-open { border-color: #a5b4fc; }
        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          text-align: left;
          gap: 12px;
          transition: background 0.15s;
        }
        .faq-question:hover { background: #f5f3ff; }
        .faq-chevron { color: #6d28d9; flex-shrink: 0; font-size: 0.75rem; }
        .faq-answer {
          padding: 14px 20px;
          border-top: 1px solid #e2e8f0;
          background: #fafbff;
          font-size: 0.9rem;
          color: #374151;
          line-height: 1.7;
        }

        /* ── CONCLUSION ── */
        .conclusion-body p {
          font-size: 1rem;
          line-height: 1.8;
          color: #374151;
          margin: 0 0 16px;
        }

        /* ── CTA ── */
        .blog-cta-box {
          background: linear-gradient(135deg, #1e1b4b, #4c1d95);
          border-radius: 16px;
          padding: 36px 40px;
          text-align: center;
          color: white;
        }
        .blog-cta-text {
          font-size: 1.1rem;
          color: #c4b5fd;
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .blog-cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .cta-btn {
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.15s;
        }
        .cta-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .primary-cta { background: #7c3aed; color: white; }
        .secondary-cta { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); }

        /* ── MATH ── */
        .bg-math-block {
          padding: 16px 0;
          overflow-x: auto;
          text-align: center;
        }
        .bg-math-err { color: #dc2626; font-family: monospace; }

        /* ── NAV BUTTONS ── */
        .nav-link { color: #6d28d9; text-decoration: none; font-size: 0.88rem; font-weight: 600; }
        .nav-link:hover { text-decoration: underline; }

        /* ── PRINT ── */
        @media print {
          .bg-nav, .bg-hero-banner, .bg-form-card, .no-print { display: none !important; }
          .bg-blog-wrap { padding: 0; margin: 0; }
          .blog-section { box-shadow: none; break-inside: avoid; }
        }

        @media (max-width: 640px) {
          .blog-section { padding: 20px; }
          .blog-hero { padding: 28px 20px; }
          .bg-form-card { padding: 20px; }
          .mistake-compare { grid-template-columns: 1fr; }
          .mistake-arrow { display: none; }
          .exam-meta-boxes { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="bg-nav no-print">
        <Link href="/test-lesson" className="bg-nav-brand">
          ← Blog Generator
        </Link>
        <div className="bg-nav-actions">
          {blog && (
            <>
              <button onClick={handleCopyJson} className="bg-action-btn">📦 Copy JSON</button>
              <button onClick={handlePrint} className="bg-action-btn">🖨️ Print</button>
            </>
          )}
          <Link href="/blog" className="nav-link">Blog Index →</Link>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div className="bg-hero-banner no-print">
        <h1>📝 SEO Blog Generator</h1>
        <p>Generate a full-length, math-rich, SEO-optimized educational blog post with Gemini AI</p>
      </div>

      {/* ── MODE TABS ── */}
      <div className="bg-mode-tabs no-print">
        <button
          className={`bg-mode-tab ${mode === 'keyword' ? 'active' : ''}`}
          onClick={() => { setMode('keyword'); setError(''); }}
        >
          🔧 Keyword Mode
        </button>
        <button
          className={`bg-mode-tab ${mode === 'text' ? 'active' : ''}`}
          onClick={() => { setMode('text'); setError(''); }}
        >
          ✨ Generate from Text
        </button>
      </div>

      {/* ── FORM: KEYWORD MODE ── */}
      {mode === 'keyword' && (
      <div className="bg-form-card no-print">
        <div className="bg-form-title">🔧 Configure Your Blog Post</div>
        <div className="bg-form-grid">
          <div className="bg-field">
            <label>Exam Name</label>
            <input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. JNVST 2026, NTSE 2026" />
          </div>
          <div className="bg-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ margin: 0 }}>Subject</label>
              <button 
                type="button" 
                onClick={() => setShowCustomSubject(!showCustomSubject)} 
                style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                {showCustomSubject ? '← Standard List' : '✍️ Custom Subject'}
              </button>
            </div>
            {showCustomSubject ? (
              <input 
                type="text" 
                value={customSubject} 
                onChange={e => setCustomSubject(e.target.value)} 
                placeholder="e.g. Exam Guidance / Overview" 
                autoFocus 
              />
            ) : (
              <select value={subject} onChange={e => setSubject(e.target.value)}>
                <option>Mathematics</option>
                <option>Science</option>
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>English</option>
              </select>
            )}
          </div>
          <div className="bg-field">
            <label>Grade Level</label>
            <select value={grade} onChange={e => setGrade(e.target.value)}>
              {['3','4','5','6','7','8','9','10','11','12'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="bg-field bg-field-full">
            <label style={{ marginBottom: 2 }}>Blog Format / Style</label>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, margin: 0, color: '#334155' }}>
                <input 
                  type="radio" 
                  name="blogStyle" 
                  value="tutorial" 
                  checked={blogStyle === 'tutorial'} 
                  onChange={() => setBlogStyle('tutorial')} 
                  style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                />
                🎓 Concept Tutorial (with Examples & Practice)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, margin: 0, color: '#334155' }}>
                <input 
                  type="radio" 
                  name="blogStyle" 
                  value="guide" 
                  checked={blogStyle === 'guide'} 
                  onChange={() => setBlogStyle('guide')} 
                  style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                />
                📖 General Guide / Overview (Details & Strategy)
              </label>
            </div>
          </div>
          <div className="bg-field bg-field-full">
            <label>{blogStyle === 'guide' ? 'Guide Topic / Focus' : 'Concept / Topic'}</label>
            <input 
              value={concept} 
              onChange={e => setConcept(e.target.value)} 
              placeholder={blogStyle === 'guide' ? "e.g. JNVST 2026 Syllabus, Exam Pattern, and Marks Distribution" : "e.g. Fractions, Linear Equations, Photosynthesis"} 
            />
          </div>
          <div className="bg-field bg-field-full">
            <label>{blogStyle === 'guide' ? 'Key Highlights / Strategies to Detail' : 'Shortcut / Technique to Explain'}</label>
            <textarea
              value={shortcutDetails}
              onChange={e => setShortcutDetails(e.target.value)}
              rows={2}
              placeholder={blogStyle === 'guide' ? "e.g. Strategic time-management hacks, marks distribution tables, omission tactics..." : "e.g. Butterfly method for adding fractions, cross-multiplication without finding LCM"}
            />
          </div>
          <div className="bg-field bg-field-full">
            <label>Additional Instructions (Optional)</label>
            <textarea
              value={additionalInstructions}
              onChange={e => setAdditionalInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. Focus on JNVST exam pattern, include Navodaya specific examples, add telugu student context"
            />
          </div>
        </div>

        <div className="bg-generate-row">
          <button onClick={handleGenerate} disabled={loading || !concept.trim()} className="bg-generate-btn">
            {loading ? <><span className="bg-spinner" /> Generating Blog…</> : '✨ Generate Full SEO Blog'}
          </button>

          {blog && (
            <button
              onClick={handleSaveToDb}
              disabled={savingToDb}
              className="bg-generate-btn"
              style={{ background: savingToDb ? '#94a3b8' : 'linear-gradient(135deg,#059669,#0d9488)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}
            >
              {savingToDb ? <><span className="bg-spinner" /> Saving…</> : '💾 Save to DB'}
            </button>
          )}

          {usage && (
            <span className="bg-usage-chip">
              ⚡ {usage.totalTokens?.toLocaleString()} tokens
            </span>
          )}
          {blog && <button onClick={handleCopyJson} className="bg-action-btn">📦 Copy JSON</button>}
          {blog && <button onClick={handlePrint} className="bg-action-btn">🖨️ Print</button>}
        </div>

        {error && <div className="bg-error">⚠️ {error}</div>}
        {saveError && <div className="bg-error">⚠️ Save failed: {saveError}</div>}
      </div>
      )}

      {/* ── FORM: GENERATE FROM TEXT MODE ── */}
      {mode === 'text' && (
      <div className="bg-form-card no-print">
        <div className="bg-form-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>✨ Generate Blog from Raw Text</span>
          <span style={{ fontSize: '0.72rem', background: '#ede9fe', color: '#6d28d9', padding: '2px 10px', borderRadius: 9999, fontWeight: 700 }}>Gemini Vertex AI</span>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '-8px 0 16px' }}>
          Paste your raw notes, bullet points, textbook content, or any unstructured text — Gemini will transform it into a full SEO-optimised blog post.
        </p>

        <div className="bg-form-grid">
          <div className="bg-field">
            <label>Exam Context</label>
            <input
              value={textExamName}
              onChange={e => setTextExamName(e.target.value)}
              placeholder="e.g. JNVST 2026, IMO Grade 6"
            />
          </div>
          <div className="bg-field">
            <label>Additional Instructions (Optional)</label>
            <input
              value={textInstructions}
              onChange={e => setTextInstructions(e.target.value)}
              placeholder="e.g. Focus on shortcuts, add Telugu student context"
            />
          </div>
          <div className="bg-field bg-field-full">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Your Raw Text / Notes</span>
              <span style={{ fontSize: '0.75rem', color: rawText.length < 20 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                {rawText.length} chars {rawText.length >= 20 ? '✓' : '(min 20)'}
              </span>
            </label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={10}
              placeholder={`Paste any raw text here. For example:

- LCM stands for Lowest Common Multiple
- To find LCM of 12 and 18: list multiples of each
  - 12: 12, 24, 36, 48...
  - 18: 18, 36, 54...
  - First common = 36, so LCM = 36
- Short trick: LCM = (a × b) / HCF(a, b)
- Appears in JNVST Section 1 almost every year
- Common mistake: confusing LCM with HCF`}
              style={{ minHeight: 220, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, letterSpacing: 0 }}
            />
          </div>
        </div>

        <div className="bg-generate-row">
          <button
            onClick={handleGenerateFromText}
            disabled={loading || rawText.trim().length < 20}
            className="bg-generate-btn"
            style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
          >
            {loading
              ? <><span className="bg-spinner" /> Generating from Text…</>
              : '🤖 Generate Blog with Gemini AI'}
          </button>

          {blog && (
            <button
              onClick={handleSaveToDb}
              disabled={savingToDb}
              className="bg-generate-btn"
              style={{ background: savingToDb ? '#94a3b8' : 'linear-gradient(135deg,#059669,#0d9488)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}
            >
              {savingToDb ? <><span className="bg-spinner" /> Saving…</> : '💾 Save to DB'}
            </button>
          )}

          {usage && (
            <span className="bg-usage-chip">
              ⚡ {usage.totalTokens?.toLocaleString()} tokens
            </span>
          )}
          {blog && <button onClick={handleCopyJson} className="bg-action-btn">📦 Copy JSON</button>}
        </div>

        {error && <div className="bg-error">⚠️ {error}</div>}
        {saveError && <div className="bg-error">⚠️ Save failed: {saveError}</div>}

        {/* ── SAVED BANNER ── */}
        {saveStatus && (
          <div className="bg-saved-banner">
            <span className="bg-saved-icon">✅</span>
            <div className="bg-saved-body">
              <strong>Blog saved to database!</strong>
              <span>Slug: <code>{saveStatus.slug}</code></span>
            </div>
            <div className="bg-saved-actions">
              <a href={saveStatus.url} target="_blank" rel="noreferrer" className="bg-saved-link">
                View Live Blog →
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${saveStatus.url}`)}
                className="bg-action-btn"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                📋 Copy URL
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ── LOADING SKELETON ── */}
      {loading && (
        <div className="bg-skeleton-wrap">
          <div className="bg-skel" style={{ height: 220, borderRadius: 16 }} />
          <div className="bg-skel" style={{ height: 180 }} />
          <div className="bg-skel" style={{ height: 280 }} />
          <div className="bg-skel" style={{ height: 320 }} />
          <div className="bg-skel" style={{ height: 200 }} />
        </div>
      )}

      {/* ── BLOG OUTPUT ── */}
      {/* ── BLOG OUTPUT & INTERACTIVE METADATA/TAGS EDITOR ── */}
      {blog && !loading && (
        <div className="bg-blog-wrap" ref={blogRef} style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 24px 60px' }}>
          {/* Action strip above the blog preview */}
          <div className="bg-blog-action-strip no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#ffffff', padding: '16px 24px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
            <span className="bg-blog-action-label" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>📄 Interactive Blog Publisher</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleSaveToDb}
                disabled={savingToDb}
                className="bg-generate-btn"
                style={{
                  fontSize: '0.85rem', padding: '8px 18px',
                  background: saveStatus
                    ? 'linear-gradient(135deg,#059669,#0d9488)'
                    : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                  boxShadow: 'none',
                }}
              >
                {savingToDb ? <><span className="bg-spinner" /> Saving…</>
                  : saveStatus ? '✅ Saved — Save Again'
                  : '💾 Save to DB'}
              </button>
              {saveStatus && (
                <a
                  href={saveStatus.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-generate-btn"
                  style={{ fontSize: '0.85rem', padding: '8px 18px', background: 'linear-gradient(135deg,#0369a1,#0284c7)', boxShadow: 'none', textDecoration: 'none' }}
                >
                  🔗 Open /blog/{saveStatus.slug}
                </a>
              )}
              <button onClick={handleCopyJson} className="bg-action-btn" style={{ fontSize: '0.85rem' }}>📦 Copy JSON</button>
              <button onClick={handlePrint} className="bg-action-btn" style={{ fontSize: '0.85rem' }}>🖨️ Print</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px', alignItems: 'start' }}>
            
            {/* Left Column: Metadata & Exam Tags Editor Panel */}
            <div className="no-print" style={{ background: '#ffffff', borderRadius: '18px', border: '1.5px solid #cbd5e1', padding: '24px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✏️ Blog Meta &amp; Exam Tags Editor</span>
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Headline</label>
                <input
                  type="text"
                  value={blog.hero?.headline || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setBlog(prev => ({
                      ...prev,
                      hero: { ...prev.hero, headline: val },
                      seo: { ...prev.seo, title: val }
                    }));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Subheadline</label>
                <textarea
                  rows={2}
                  value={blog.hero?.subheadline || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setBlog(prev => ({
                      ...prev,
                      hero: { ...prev.hero, subheadline: val }
                    }));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>SEO Slug</label>
                <input
                  type="text"
                  value={blog.seo?.slug || ''}
                  onChange={e => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                    setBlog(prev => ({
                      ...prev,
                      seo: { ...prev.seo, slug: val }
                    }));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>SEO Meta Description</label>
                <textarea
                  rows={3}
                  value={blog.seo?.metaDescription || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setBlog(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: val }
                    }));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>🏷️ Exam Tags Selector</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {['jnvst', 'imo', 'nso', 'mat', 'math', 'fractions', 'ratios', 'time-distance', 'simplification', 'english'].map(tag => {
                    const existingTags = blog.seo?.tags || [];
                    const isSelected = existingTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? existingTags.filter(t => t !== tag)
                            : [...existingTags, tag];
                          setBlog(prev => ({
                            ...prev,
                            seo: { ...prev.seo, tags: updated }
                          }));
                        }}
                        style={{
                          background: isSelected ? '#ede9fe' : '#f1f5f9',
                          border: `1px solid ${isSelected ? '#8b5cf6' : '#cbd5e1'}`,
                          color: isSelected ? '#6d28d9' : '#475569',
                          borderRadius: '16px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Custom comma-separated tags..."
                  value={(blog.seo?.tags || []).join(', ')}
                  onChange={e => {
                    const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setBlog(prev => ({
                      ...prev,
                      seo: { ...prev.seo, tags: val }
                    }));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Focus Keyword</label>
                <input
                  type="text"
                  value={blog.seo?.focusKeyword || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setBlog(prev => ({
                      ...prev,
                      seo: { ...prev.seo, focusKeyword: val }
                    }));
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* Right Column: Preview / Toggle Mode Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              
              {/* Tab Selector */}
              <div className="no-print" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px', border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  onClick={() => setPreviewMode('render')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: previewMode === 'render' ? '#ffffff' : 'transparent',
                    color: previewMode === 'render' ? '#0f172a' : '#64748b',
                    boxShadow: previewMode === 'render' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.1s'
                  }}
                >
                  👁️ Student Preview Render
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('json')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    background: previewMode === 'json' ? '#ffffff' : 'transparent',
                    color: previewMode === 'json' ? '#0f172a' : '#64748b',
                    boxShadow: previewMode === 'json' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.1s'
                  }}
                >
                  ⚙️ Raw JSON Editor
                </button>
              </div>

              {previewMode === 'render' ? (
                <div style={{ background: '#ffffff', borderRadius: '18px', border: '1.5px solid #cbd5e1', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <BlogRenderer blog={blog} />
                </div>
              ) : (
                <div style={{ background: '#ffffff', borderRadius: '18px', border: '1.5px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                    Raw Structure JSON Editor (Direct edits immediately sync to preview and database saves)
                  </label>
                  <textarea
                    rows={30}
                    value={JSON.stringify(blog, null, 2)}
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setBlog(parsed);
                      } catch (err) {
                        // Keep text as-is but don't parse invalid JSON
                      }
                    }}
                    style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, background: '#0f172a', color: '#38bdf8' }}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
