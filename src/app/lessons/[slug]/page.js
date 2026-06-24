import { getLessonBySlug } from '@/lib/lessons/store';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PrintButton from './PrintButton';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import MermaidRenderer from '@/components/MermaidRenderer';

// ── SEO: Dynamic Metadata ────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  if (!lesson) return {};

  return {
    title: `${lesson.title} | WEXLS Guided Notes`,
    description: `Free printable guided notes and worksheet on "${lesson.topic}". Includes key concepts, formulas, worked examples, practice scenarios, and a complete answer key.`,
    alternates: {
      canonical: `/lessons/${slug}`,
    },
    openGraph: {
      title: lesson.title,
      description: `Printable guided notes on ${lesson.topic}. Student worksheet and teacher explaining guide included.`,
      type: 'article',
      url: `https://wexls.com/lessons/${slug}`,
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function LessonPage({ params, searchParams }) {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  if (!lesson) notFound();

  const sp = await searchParams;
  const mode = sp?.mode === 'teacher' ? 'teacher' : 'student';
  const markdown = lesson.markdownContent?.[mode] || '';

  // JSON-LD Structured Data for Google rich results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: `Printable study worksheet on ${lesson.topic}.`,
    learningResourceType: 'Worksheet',
    educationalLevel: lesson.metadata?.grade || 'Middle School',
    inLanguage: 'en',
    about: {
      '@type': 'Thing',
      name: lesson.topic,
    },
    dateModified: lesson.updatedAt,
    dateCreated: lesson.createdAt,
  };

  return (
    <>
      {/* Inject JSON-LD for SEO rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── LESSON PAGE CONTAINER ── */}
      <div className="lesson-page-container">

        {/* ── TOP BAR ── */}
        <header className="lesson-top-bar">
          <div className="lesson-breadcrumb">
            <Link href="/grades">← All Grades</Link>
            <span className="sep">›</span>
            <Link href="/lessons">Lesson Library</Link>
            <span className="sep">›</span>
            <span className="current">{lesson.topic}</span>
          </div>

          <div className="lesson-mode-switcher">
            <a
              href={`/lessons/${slug}?mode=student`}
              className={`mode-tab ${mode === 'student' ? 'active' : ''}`}
            >
              ✏️ Student Worksheet
            </a>
            <a
              href={`/lessons/${slug}?mode=teacher`}
              className={`mode-tab ${mode === 'teacher' ? 'active' : ''}`}
            >
              💡 Teacher Guide
            </a>
            <a
              href={`/test-lesson`}
              className="mode-tab generate-tab"
            >
              ✨ Generate New
            </a>
          </div>
        </header>

        {/* ── LESSON METADATA CHIP BAR ── */}
        <div className="lesson-chips">
          {lesson.tone && (
            <span className="chip tone-chip">
              🎙️ Tone: {lesson.tone.charAt(0).toUpperCase() + lesson.tone.slice(1)}
            </span>
          )}
          {lesson.metadata?.grade && (
            <span className="chip grade-chip">📚 {lesson.metadata.grade}</span>
          )}
          {lesson.metadata?.subject && (
            <span className="chip subject-chip">🔬 {lesson.metadata.subject}</span>
          )}
          {lesson.updatedAt && (
            <span className="chip date-chip">
              🕐 {new Date(lesson.updatedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* ── MARKDOWN ARTICLE ── */}
        <article className="lesson-article">
          <MarkdownRenderer content={markdown} />
        </article>

        {/* ── PRINT BUTTON ── */}
        <div className="lesson-actions no-print">
          <PrintButton />
        </div>
      </div>

      {/* ── INLINE STYLES ── */}
      <style>{`
        .lesson-page-container {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1e293b;
        }

        .lesson-top-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .lesson-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #64748b;
        }

        .lesson-breadcrumb a {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }

        .lesson-breadcrumb .sep { color: #cbd5e1; }

        .lesson-breadcrumb .current {
          font-weight: 700;
          color: #0f172a;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lesson-mode-switcher {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .mode-tab {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          text-decoration: none;
          transition: all 0.18s;
        }

        .mode-tab:hover { background: #f8fafc; color: #0f172a; }

        .mode-tab.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .mode-tab.generate-tab {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }

        .lesson-chips {
          padding: 10px 24px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .chip {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .tone-chip  { background: #e0e7ff; color: #3730a3; }
        .grade-chip { background: #dcfce7; color: #166534; }
        .subject-chip { background: #fef3c7; color: #92400e; }
        .date-chip  { background: #f1f5f9; color: #64748b; }

        .lesson-article {
          max-width: 860px;
          margin: 24px auto 48px;
          background: white;
          border-radius: 2px;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.07);
          padding: 52px 64px;
          line-height: 1.7;
        }

        /* Markdown typography */
        .lesson-article h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 20px 0; color: #0f172a; }
        .lesson-article h2 { font-size: 1.25rem; font-weight: 800; margin: 32px 0 10px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .lesson-article h3 { font-size: 1.05rem; font-weight: 700; margin: 20px 0 6px; color: #1e293b; }
        .lesson-article h4 { font-size: 0.95rem; font-weight: 700; margin: 16px 0 4px; color: #334155; }
        .lesson-article p  { margin: 0 0 14px; color: #334155; }
        .lesson-article ul, .lesson-article ol { padding-left: 22px; margin: 10px 0 14px; color: #334155; }
        .lesson-article li { margin-bottom: 6px; }
        .lesson-article code {
          background: #eff6ff;
          color: #1d4ed8;
          font-family: 'Courier New', monospace;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 0.9em;
          font-weight: 700;
        }
        .lesson-article pre {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px 20px;
          overflow-x: auto;
          font-size: 0.9rem;
          margin: 14px 0;
        }
        .lesson-article blockquote {
          border-left: 4px solid #6366f1;
          margin: 14px 0;
          padding: 10px 16px;
          background: #f5f3ff;
          border-radius: 0 6px 6px 0;
          color: #312e81;
          font-style: italic;
        }
        .lesson-article table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 0.9rem;
        }
        .lesson-article th {
          background: #f8fafc;
          font-weight: 700;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          color: #0f172a;
        }
        .lesson-article td {
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          color: #334155;
          vertical-align: top;
        }
        .lesson-article tr:nth-child(even) td { background: #fafafa; }
        .lesson-article strong { color: #1e293b; }
        .lesson-article hr { border: none; border-top: 2px solid #e2e8f0; margin: 30px 0; }

        .lesson-actions {
          max-width: 860px;
          margin: 0 auto 64px;
          display: flex;
          justify-content: flex-end;
          padding: 0 0 16px;
        }

        .print-action-btn {
          background: #0f172a;
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .print-action-btn:hover { background: #1e293b; }

        @media print {
          .lesson-top-bar, .lesson-chips, .lesson-actions { display: none !important; }
          .lesson-page-container { background: white !important; }
          .lesson-article {
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page { margin: 0.65in; }
        }
      `}</style>
    </>
  );
}

// ── Minimal SSR-safe Markdown renderer ─────────────────────────────────────
// Renders Markdown line-by-line without any npm dependency.
function MarkdownRenderer({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let tableBuffer = [];
  let listBuffer = [];
  let blockquoteBuffer = [];
  let i = 0;

  const flushList = () => {
    if (listBuffer.length) {
      elements.push(
        <ul key={`ul-${i}`}>
          {listBuffer.map((item, li) => (
            <li key={li} dangerouslySetInnerHTML={{ __html: inlineRender(item) }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteBuffer.length) {
      elements.push(
        <blockquote key={`bq-${i}`}>
          {blockquoteBuffer.map((bq, bi) => (
            <p key={bi} dangerouslySetInnerHTML={{ __html: inlineRender(bq) }} />
          ))}
        </blockquote>
      );
      blockquoteBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      const [header, , ...rows] = tableBuffer;
      const headers = parseCols(header);
      elements.push(
        <table key={`tbl-${i}`}>
          <thead>
            <tr>{headers.map((h, hi) => <th key={hi} dangerouslySetInnerHTML={{ __html: inlineRender(h) }} />)}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {parseCols(row).map((cell, ci) => (
                  <td key={ci} dangerouslySetInnerHTML={{ __html: inlineRender(cell) }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    tableBuffer = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('| ') || line.startsWith('|-')) {
      flushList(); flushBlockquote();
      tableBuffer.push(line);
      i++; continue;
    } else if (tableBuffer.length) { flushTable(); }

    if (line.startsWith('> ')) {
      flushList();
      blockquoteBuffer.push(line.slice(2));
      i++; continue;
    } else if (blockquoteBuffer.length) { flushBlockquote(); }

    if (line.startsWith('- ') || line.match(/^\d+\. /)) {
      const text = line.startsWith('- ') ? line.slice(2) : line.replace(/^\d+\. /, '');
      listBuffer.push(text);
      i++; continue;
    } else if (listBuffer.length) { flushList(); }

    if (line.startsWith('#### ')) {
      elements.push(<h4 key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line.slice(5)) }} />);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line.slice(4)) }} />);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line.slice(3)) }} />);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line.slice(2)) }} />);
    } else if (line.startsWith('---') || line.startsWith('***')) {
      elements.push(<hr key={i} />);
    } else if (line.trim().startsWith('```')) {
      // Code block or Mermaid diagram
      const lang = line.trim().slice(3).trim().toLowerCase();
      let codeLines = [];
      let foundClosing = false;
      let j = i + 1;
      while (j < lines.length) {
        if (lines[j].trim().startsWith('```')) {
          foundClosing = true;
          break;
        }
        codeLines.push(lines[j]);
        j++;
      }
      if (foundClosing) {
        const codeContent = codeLines.join('\n');
        if (lang === 'mermaid') {
          elements.push(<MermaidRenderer key={i} chart={codeContent} />);
        } else {
          elements.push(
            <pre key={i}>
              <code className={lang ? `language-${lang}` : ''}>{codeContent}</code>
            </pre>
          );
        }
        i = j; // Advance past the closing line
      } else {
        elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line) }} />);
      }
    } else if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
      // Single-line block math
      const formula = line.trim().slice(2, -2).trim();
      let mathHtml = formula;
      try {
        mathHtml = katex.renderToString(formula, { displayMode: true, throwOnError: false });
      } catch (e) {
        console.error('KaTeX block error:', e);
      }
      elements.push(
        <div key={i} className="math-block" dangerouslySetInnerHTML={{ __html: mathHtml }} />
      );
    } else if (line.trim() === '$$') {
      // Multi-line block math
      let mathLines = [];
      let foundClosing = false;
      let j = i + 1;
      while (j < lines.length) {
        if (lines[j].trim() === '$$') {
          foundClosing = true;
          break;
        }
        mathLines.push(lines[j]);
        j++;
      }
      if (foundClosing) {
        const formula = mathLines.join('\n').trim().replace(/^\$\$?|\$\$?$/g, '').trim();
        let mathHtml = formula;
        try {
          mathHtml = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        } catch (e) {
          console.error('KaTeX block error:', e);
        }
        elements.push(
          <div key={i} className="math-block" dangerouslySetInnerHTML={{ __html: mathHtml }} />
        );
        i = j; // Skip past the closing $$
      } else {
        // Mismatched $$; treat as regular paragraph
        elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line) }} />);
      }
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineRender(line) }} />);
    }
    i++;
  }

  flushList(); flushBlockquote(); flushTable();
  return <>{elements}</>;
}

function parseCols(line) {
  return line.split('|').map(s => s.trim()).filter(Boolean);
}

function inlineRender(text) {
  if (!text) return '';
  
  // Render display/double-dollar math $$...$$ first
  let parsedText = text.replace(/\$\$(?!\s)([^\$\n]{1,200}?)(?<!\s)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // Render inline math $...$ safely
  parsedText = parsedText.replace(/\$(?!\s)([^\$\n]{1,100}?)(?<!\s)\$/g, (match, formula) => {
    // If it's just a number, it's currency
    if (/^\d+[\d,.]*$/.test(formula)) {
      return match;
    }
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  return parsedText
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}


