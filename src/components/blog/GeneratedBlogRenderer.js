'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Markdown inline formatter ────────────────────────────────────────
// Converts **bold**, *italic*, ***bold-italic***, `code` to React elements
function applyMarkdown(text, keyBase) {
  if (!text) return [];
  // Match in priority order: bold-italic > bold > italic > code
  const mdRegex = /(\*\*\*)(.*?)(\*\*\*)|\*\*(.*?)\*\*|\*((?!\s)[^*\n]*?(?<!\s))\*|`([^`]+)`/g;
  const result = [];
  let last = 0;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    if (match.index > last) result.push(text.substring(last, match.index));
    const k = `${keyBase}-md-${match.index}`;
    if (match[2] !== undefined) {
      // ***bold-italic***
      result.push(<strong key={k}><em>{match[2]}</em></strong>);
    } else if (match[4] !== undefined) {
      // **bold**
      result.push(<strong key={k}>{match[4]}</strong>);
    } else if (match[5] !== undefined) {
      // *italic*
      result.push(<em key={k}>{match[5]}</em>);
    } else if (match[6] !== undefined) {
      // `code`
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
        return <div key={`disp-${didx}`} dangerouslySetInnerHTML={{ __html: html }} className="grb-math-block" />;
      } catch {
        return <div key={`disp-${didx}`} className="grb-math-err">{part}</div>;
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

function MathPara({ children, className = '' }) {
  if (!children) return null;
  return <p className={className}>{renderMath(String(children))}</p>;
}

// ─── Full Blog Renderer (used on /blog/[slug] for DB posts) ──────────
export default function GeneratedBlogRenderer({ post }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  if (!post?.blogJson) return null;

  const blog = post.blogJson;
  const {
    seo, hero, introduction, conceptOverview, stepByStepGuide,
    workedExamples, commonMistakes, examTips, practiceProblems, faq,
    conclusion, callToAction,
  } = blog;

  const publishedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recently Published';

  return (
    <div className="grb-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .grb-page {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: #f8fafc;
          color: #1e293b;
        }
        .grb-content {
          max-width: 860px;
          margin: 0 auto;
          padding: 0 24px 60px;
        }
        .grb-breadcrumb {
          padding: 20px 0 12px;
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 0.85rem;
        }
        .grb-breadcrumb a { color: #6d28d9; text-decoration: none; font-weight: 600; }
        .grb-breadcrumb a:hover { text-decoration: underline; }
        .grb-breadcrumb span { color: #94a3b8; }

        /* META ROW */
        .grb-meta-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }
        .grb-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .grb-badge-exam { background: #ede9fe; color: #6d28d9; }
        .grb-badge-subj { background: #e0f2fe; color: #0369a1; }
        .grb-badge-date { background: #f1f5f9; color: #64748b; }
        .grb-badge-diff-beginner { background: #dcfce7; color: #166534; }
        .grb-badge-diff-intermediate { background: #fef9c3; color: #854d0e; }
        .grb-badge-diff-advanced { background: #fee2e2; color: #991b1b; }
        .grb-badge-read { background: #f0f9ff; color: #0284c7; }
        .grb-badge-tag { background: #f1f5f9; color: #475569; }

        /* HERO */
        .grb-hero h1 {
          font-family: 'Merriweather', Georgia, serif;
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 700;
          line-height: 1.3;
          color: #0f172a;
          margin: 0 0 12px;
        }
        .grb-subheadline {
          font-size: 1.05rem;
          color: #475569;
          margin: 0 0 20px;
          line-height: 1.6;
        }
        .grb-exam-relevance {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: #ede9fe;
          border: 1.5px solid #c4b5fd;
          border-radius: 10px;
          padding: 12px 18px;
          font-size: 0.9rem;
          color: #4c1d95;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .grb-divider {
          border: 0;
          border-top: 2px solid #ede9fe;
          margin: 0 0 32px;
        }

        /* SECTIONS */
        .grb-section { margin-bottom: 40px; }
        .grb-h2 {
          font-family: 'Merriweather', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 18px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ede9fe;
        }
        .grb-para {
          font-size: 1rem;
          line-height: 1.8;
          color: #374151;
          margin: 0 0 14px;
        }
        .grb-para:last-child { margin-bottom: 0; }

        /* FORMULA BOX */
        .grb-formula-box {
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          border: 1.5px solid #c4b5fd;
          border-radius: 12px;
          padding: 20px 24px;
          margin: 20px 0;
          text-align: center;
        }
        .grb-formula-label {
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6d28d9;
          margin-bottom: 12px;
        }
        .grb-formula-note {
          margin: 10px 0 0;
          font-size: 0.88rem;
          color: #4c1d95;
          line-height: 1.5;
        }
        .grb-analogy {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: #fefce8;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 14px 18px;
          margin-top: 16px;
        }
        .grb-analogy-icon { font-size: 1.4rem; flex-shrink: 0; }
        .grb-analogy p { margin: 4px 0 0; font-size: 0.9rem; color: #78350f; line-height: 1.6; }
        .grb-analogy strong { color: #92400e; }

        /* STEPS */
        .grb-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .grb-step { display: flex; gap: 18px; }
        .grb-step-num {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(124,58,237,0.3);
          margin-top: 6px;
        }
        .grb-step-body { flex: 1; }
        .grb-step-title { font-size: 1rem; font-weight: 700; color: #1e1b4b; margin: 0 0 6px; }
        .grb-step-expl { font-size: 0.92rem; color: #4b5563; line-height: 1.65; margin: 0 0 8px; }
        .grb-step-math {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 8px 0;
          overflow-x: auto;
        }
        .grb-step-tip {
          font-size: 0.82rem;
          color: #0369a1;
          background: #e0f2fe;
          border-radius: 6px;
          padding: 7px 12px;
          margin-top: 6px;
        }
        .grb-step-tip b { font-weight: 700; }

        /* EXAMPLES */
        .grb-example {
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .grb-example:last-child { margin-bottom: 0; }
        .grb-example-hdr {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .grb-example-num { font-size: 0.78rem; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.06em; }
        .grb-diff-pill {
          font-size: 0.7rem; font-weight: 700;
          padding: 2px 9px; border-radius: 20px;
        }
        .grb-diff-easy { background: #dcfce7; color: #166534; }
        .grb-diff-medium { background: #fef9c3; color: #854d0e; }
        .grb-diff-hard { background: #fee2e2; color: #991b1b; }
        .grb-example-prob {
          padding: 14px 20px;
          font-size: 0.97rem;
          color: #1e293b;
          line-height: 1.6;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbff;
        }
        .grb-example-prob strong { color: #6d28d9; }
        .grb-solution { padding: 18px 20px; }
        .grb-sol-approach { font-size: 0.85rem; color: #6b7280; margin: 0 0 14px; font-style: italic; }
        .grb-sol-steps {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .grb-sol-step { display: flex; border-bottom: 1px solid #f1f5f9; }
        .grb-sol-step:last-child { border-bottom: none; }
        .grb-sol-step-lbl {
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 12px;
          min-width: 60px;
          text-align: center;
          border-right: 1px solid #ede9fe;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .grb-sol-step-body { padding: 10px 14px; flex: 1; }
        .grb-sol-action { font-size: 0.87rem; font-weight: 600; color: #374151; margin-bottom: 3px; }
        .grb-sol-math { padding: 5px 0; font-size: 0.98rem; overflow-x: auto; }
        .grb-sol-why { font-size: 0.8rem; color: #6b7280; margin-top: 3px; }
        .grb-final-ans {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          border-radius: 10px;
          padding: 12px 18px;
          margin-bottom: 8px;
        }
        .grb-final-lbl { font-weight: 700; color: #15803d; font-size: 0.88rem; flex-shrink: 0; }
        .grb-check { font-size: 0.82rem; color: #0369a1; background: #f0f9ff; border-radius: 6px; padding: 7px 12px; }

        /* MISTAKES */
        .grb-mistake { border: 1.5px solid #fee2e2; border-radius: 12px; padding: 18px; background: #fff5f5; margin-bottom: 14px; }
        .grb-mistake-lbl { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #dc2626; margin-bottom: 6px; }
        .grb-mistake-desc { font-size: 0.9rem; color: #374151; margin: 0 0 12px; line-height: 1.5; }
        .grb-mistake-cmp { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center; margin-bottom: 10px; }
        .grb-wrong { padding: 10px 14px; border-radius: 8px; background: #fee2e2; border: 1px solid #fca5a5; font-size: 0.88rem; }
        .grb-right { padding: 10px 14px; border-radius: 8px; background: #dcfce7; border: 1px solid #86efac; font-size: 0.88rem; }
        .grb-cmp-lbl { font-size: 0.7rem; font-weight: 700; margin-bottom: 5px; }
        .grb-wrong-lbl { color: #dc2626; }
        .grb-right-lbl { color: #16a34a; }
        .grb-arrow { font-size: 1.2rem; color: #9ca3af; text-align: center; }
        .grb-mem { font-size: 0.84rem; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 9px 13px; color: #78350f; line-height: 1.5; }
        @media (max-width: 600px) { .grb-mistake-cmp { grid-template-columns: 1fr; } .grb-arrow { display: none; } }

        /* EXAM TIPS */
        .grb-tips-section { background: linear-gradient(135deg, #faf5ff, #f0fdf4); border-radius: 14px; padding: 28px 32px; }
        .grb-tips-list { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 12px; }
        .grb-tip { display: flex; gap: 14px; font-size: 0.95rem; color: #374151; line-height: 1.6; }
        .grb-tip-num {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: white;
          border-radius: 50%;
          font-size: 0.78rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .grb-meta-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .grb-meta-boxes { grid-template-columns: 1fr; } }
        .grb-meta-box { border-radius: 12px; padding: 16px 18px; text-align: center; }
        .grb-time-box { background: #fef3c7; border: 1.5px solid #fde68a; }
        .grb-check-box { background: #e0f2fe; border: 1.5px solid #bae6fd; }
        .grb-meta-icon { font-size: 1.4rem; margin-bottom: 5px; }
        .grb-meta-lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 4px; }
        .grb-meta-val { font-size: 0.87rem; color: #374151; line-height: 1.5; }

        /* PRACTICE */
        .grb-practice-card { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 14px; background: #f8fafc; }
        .grb-practice-hdr { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
        .grb-q-num { background: #4f46e5; color: white; font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 5px; flex-shrink: 0; margin-top: 3px; }
        .grb-q-text { font-size: 0.95rem; color: #1e293b; line-height: 1.6; }
        .grb-hint { font-size: 0.82rem; color: #0369a1; background: #e0f2fe; border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; }
        .grb-reveal { padding: 7px 15px; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: #4f46e5; transition: background 0.2s, border-color 0.2s; }
        .grb-reveal:hover { background: #f5f3ff; border-color: #a5b4fc; }
        .grb-answer { margin-top: 10px; padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; font-size: 0.92rem; color: #15803d; font-weight: 600; }

        /* FAQ */
        .grb-faq-list { display: flex; flex-direction: column; gap: 8px; }
        .grb-faq { border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
        .grb-faq.open { border-color: #a5b4fc; }
        .grb-faq-q {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 13px 18px; background: white; border: none; cursor: pointer;
          font-size: 0.92rem; font-weight: 600; color: #1e293b; text-align: left; gap: 10px;
          transition: background 0.15s;
        }
        .grb-faq-q:hover { background: #f5f3ff; }
        .grb-faq-chev { color: #6d28d9; flex-shrink: 0; font-size: 0.7rem; }
        .grb-faq-a { padding: 12px 18px; border-top: 1px solid #e2e8f0; background: #fafbff; font-size: 0.88rem; color: #374151; line-height: 1.7; }

        /* CONCLUSION */
        .grb-conclusion-body p { font-size: 1rem; line-height: 1.8; color: #374151; margin: 0 0 14px; }

        /* CTA */
        .grb-cta {
          background: linear-gradient(135deg, #1e1b4b, #4c1d95);
          border-radius: 16px; padding: 32px 36px;
          text-align: center; color: white; margin-top: 8px;
        }
        .grb-cta p { font-size: 1rem; color: #c4b5fd; margin: 0 0 20px; line-height: 1.6; }
        .grb-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .grb-cta-btn {
          padding: 11px 26px; border-radius: 10px;
          font-weight: 700; font-size: 0.9rem;
          text-decoration: none; transition: opacity 0.2s;
        }
        .grb-cta-btn:hover { opacity: 0.9; }
        .grb-cta-primary { background: #7c3aed; color: white; }
        .grb-cta-secondary { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); }

        /* MATH */
        .grb-math-block { padding: 14px 0; overflow-x: auto; text-align: center; }
        .grb-math-err { color: #dc2626; font-family: monospace; }

        @media print {
          .grb-breadcrumb, .grb-cta { display: none !important; }
          .grb-page { background: white; }
          .grb-section { break-inside: avoid; }
        }
      `}</style>

      <div className="grb-content">
        {/* Breadcrumb */}
        <div className="grb-breadcrumb">
          <Link href="/blog">← Blog</Link>
          {post.examName && <><span>/</span><span>{post.examName}</span></>}
          {post.subject && <><span>/</span><span>{post.subject}</span></>}
        </div>

        {/* HERO */}
        <div className="grb-hero">
          <div className="grb-meta-row">
            {post.examName && <span className="grb-badge grb-badge-exam">{post.examName}</span>}
            {post.subject && <span className="grb-badge grb-badge-subj">{post.subject}</span>}
            {hero?.difficulty && <span className={`grb-badge grb-badge-diff-${hero.difficulty?.toLowerCase() || 'beginner'}`}>{hero.difficulty}</span>}
            {hero?.readTime && <span className="grb-badge grb-badge-read">🕐 {hero.readTime}</span>}
            <span className="grb-badge grb-badge-date">{publishedDate}</span>
          </div>

          <h1>{hero?.headline || seo?.title || post.headline}</h1>
          {hero?.subheadline && <p className="grb-subheadline">{hero.subheadline}</p>}
          {hero?.examRelevance && (
            <div className="grb-exam-relevance">
              <span>🎯</span><span>{hero.examRelevance}</span>
            </div>
          )}
          {seo?.tags && seo.tags.length > 0 && (
            <div className="grb-meta-row" style={{ marginBottom: 24 }}>
              {seo.tags.map((t, i) => <span key={i} className="grb-badge grb-badge-tag">{t}</span>)}
            </div>
          )}
        </div>

        <hr className="grb-divider" />

        {/* INTRODUCTION */}
        {introduction && (
          <div className="grb-section">
            {introduction.split('\n').filter(Boolean).map((p, i) => (
              <MathPara key={i} className="grb-para">{p}</MathPara>
            ))}
          </div>
        )}

        {/* CONCEPT OVERVIEW */}
        {conceptOverview && (
          <div className="grb-section">
            <h2 className="grb-h2">{conceptOverview.title}</h2>
            {conceptOverview.explanation?.split('\n').filter(Boolean).map((p, i) => (
              <MathPara key={i} className="grb-para">{p}</MathPara>
            ))}
            {conceptOverview.keyFormula && (
              <div className="grb-formula-box">
                <div className="grb-formula-label">📐 Key Formula</div>
                <MathText>{conceptOverview.keyFormula}</MathText>
                {conceptOverview.formulaExplanation && (
                  <MathPara className="grb-formula-note">{conceptOverview.formulaExplanation}</MathPara>
                )}
              </div>
            )}
            {conceptOverview.realWorldAnalogy && (
              <div className="grb-analogy">
                <span className="grb-analogy-icon">💡</span>
                <div><strong>Think of it this way:</strong><MathPara>{conceptOverview.realWorldAnalogy}</MathPara></div>
              </div>
            )}
          </div>
        )}

        {/* STEP-BY-STEP */}
        {stepByStepGuide && (
          <div className="grb-section">
            <h2 className="grb-h2">{stepByStepGuide.title}</h2>
            {stepByStepGuide.intro && <MathPara className="grb-para">{stepByStepGuide.intro}</MathPara>}
            <ol className="grb-steps-list">
              {stepByStepGuide.steps?.map((step) => (
                <li key={step.stepNumber} className="grb-step">
                  <div className="grb-step-num">{step.stepNumber}</div>
                  <div className="grb-step-body">
                    <h3 className="grb-step-title">{step.title}</h3>
                    <MathPara className="grb-step-expl">{step.explanation}</MathPara>
                    {step.math && <div className="grb-step-math"><MathText>{step.math}</MathText></div>}
                    {step.proTip && <div className="grb-step-tip"><b>💡 Pro Tip:</b> <MathText>{step.proTip}</MathText></div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* WORKED EXAMPLES */}
        {workedExamples?.length > 0 && (
          <div className="grb-section">
            <h2 className="grb-h2">✍️ Worked Examples</h2>
            {workedExamples.map((ex) => (
              <div key={ex.exampleNumber} className="grb-example">
                <div className="grb-example-hdr">
                  <span className="grb-example-num">Example {ex.exampleNumber}</span>
                  {ex.difficulty && <span className={`grb-diff-pill grb-diff-${ex.difficulty?.toLowerCase()}`}>{ex.difficulty}</span>}
                </div>
                <div className="grb-example-prob">
                  <strong>Problem:</strong> <MathText>{ex.problem}</MathText>
                </div>
                {ex.solution && (
                  <div className="grb-solution">
                    {ex.solution.approach && <p className="grb-sol-approach"><em>Approach: </em><MathText>{ex.solution.approach}</MathText></p>}
                    {ex.solution.steps?.length > 0 && (
                      <div className="grb-sol-steps">
                        {ex.solution.steps.map((s) => (
                          <div key={s.stepNumber} className="grb-sol-step">
                            <div className="grb-sol-step-lbl">Step {s.stepNumber}</div>
                            <div className="grb-sol-step-body">
                              {s.action && <div className="grb-sol-action"><MathText>{s.action}</MathText></div>}
                              {s.math && <div className="grb-sol-math"><MathText>{s.math}</MathText></div>}
                              {s.explanation && <div className="grb-sol-why"><MathText>{s.explanation}</MathText></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {ex.solution.finalAnswer && (
                      <div className="grb-final-ans">
                        <span className="grb-final-lbl">✅ Final Answer:</span>
                        <MathText>{ex.solution.finalAnswer}</MathText>
                      </div>
                    )}
                    {ex.solution.checkYourWork && (
                      <div className="grb-check">🔍 Check: <MathText>{ex.solution.checkYourWork}</MathText></div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* COMMON MISTAKES */}
        {commonMistakes?.length > 0 && (
          <div className="grb-section">
            <h2 className="grb-h2">⚠️ Common Mistakes to Avoid</h2>
            {commonMistakes.map((m, i) => (
              <div key={i} className="grb-mistake">
                <div className="grb-mistake-lbl">❌ Mistake #{i + 1}</div>
                <MathPara className="grb-mistake-desc">{m.mistake}</MathPara>
                <div className="grb-mistake-cmp">
                  <div className="grb-wrong">
                    <div className="grb-cmp-lbl grb-wrong-lbl">Wrong ❌</div>
                    <MathText>{m.wrongApproach}</MathText>
                  </div>
                  <div className="grb-arrow">→</div>
                  <div className="grb-right">
                    <div className="grb-cmp-lbl grb-right-lbl">Correct ✅</div>
                    <MathText>{m.correctApproach}</MathText>
                  </div>
                </div>
                {m.memoryTrick && <div className="grb-mem">🧠 <strong>Remember:</strong> <MathText>{m.memoryTrick}</MathText></div>}
              </div>
            ))}
          </div>
        )}

        {/* EXAM TIPS */}
        {examTips && (
          <div className="grb-section">
            <div className="grb-tips-section">
              <h2 className="grb-h2" style={{ borderColor: '#bbf7d0' }}>{examTips.title || '🎯 Exam Strategy'}</h2>
              <ul className="grb-tips-list">
                {examTips.tips?.map((tip, i) => (
                  <li key={i} className="grb-tip">
                    <span className="grb-tip-num">{i + 1}</span>
                    <MathText>{tip}</MathText>
                  </li>
                ))}
              </ul>
              <div className="grb-meta-boxes">
                {examTips.timeManagement && (
                  <div className="grb-meta-box grb-time-box">
                    <div className="grb-meta-icon">⏱️</div>
                    <div className="grb-meta-lbl">Time Management</div>
                    <div className="grb-meta-val"><MathText>{examTips.timeManagement}</MathText></div>
                  </div>
                )}
                {examTips.quickCheckMethod && (
                  <div className="grb-meta-box grb-check-box">
                    <div className="grb-meta-icon">⚡</div>
                    <div className="grb-meta-lbl">Quick Check</div>
                    <div className="grb-meta-val"><MathText>{examTips.quickCheckMethod}</MathText></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRACTICE */}
        {practiceProblems?.length > 0 && (
          <div className="grb-section">
            <h2 className="grb-h2">📝 Practice Problems</h2>
            <p className="grb-para" style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 16 }}>
              Try these on your own before revealing the answer!
            </p>
            {practiceProblems.map((prob, i) => (
              <div key={i} className="grb-practice-card">
                <div className="grb-practice-hdr">
                  <span className="grb-q-num">Q{i + 1}</span>
                  <MathText className="grb-q-text">{prob.question}</MathText>
                </div>
                {prob.hint && <div className="grb-hint">💡 Hint: <MathText>{prob.hint}</MathText></div>}
                <button className="grb-reveal" onClick={() => setRevealedAnswers(p => ({ ...p, [i]: !p[i] }))}>
                  {revealedAnswers[i] ? '🙈 Hide Answer' : '👁 Reveal Answer'}
                </button>
                {revealedAnswers[i] && (
                  <div className="grb-answer"><MathText>{prob.answer}</MathText></div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {faq?.length > 0 && (
          <div className="grb-section">
            <h2 className="grb-h2">❓ Frequently Asked Questions</h2>
            <div className="grb-faq-list">
              {faq.map((item, i) => (
                <div key={i} className={`grb-faq ${openFaq === i ? 'open' : ''}`}>
                  <button className="grb-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.question}</span>
                    <span className="grb-faq-chev">{openFaq === i ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="grb-faq-a"><MathText>{item.answer}</MathText></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONCLUSION */}
        {conclusion && (
          <div className="grb-section">
            <h2 className="grb-h2">🏁 Wrapping Up</h2>
            <div className="grb-conclusion-body">
              {conclusion.split('\n').filter(Boolean).map((p, i) => (
                <MathPara key={i}>{p}</MathPara>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {callToAction && (
          <div className="grb-cta">
            <MathPara>{callToAction}</MathPara>
            <div className="grb-cta-btns">
              <Link href="/blog" className="grb-cta-btn grb-cta-primary">Browse All Posts</Link>
              <Link href="/test-lesson" className="grb-cta-btn grb-cta-secondary">Make a Worksheet</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
