'use client';

import { useState, useEffect, useRef } from 'react';

const SECTIONS = [
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'type-1', label: '1. Audio Sound Card' },
  { id: 'type-2', label: '2. Image Visual Pick' },
  { id: 'type-3', label: '3. Text Only' },
  { id: 'type-4', label: '4. Multi-Select MCQ' },
  { id: 'type-5', label: '5. Categorization HTML5' },
  { id: 'type-6', label: '6. Categorization Konva' },
  { id: 'type-7', label: '7. Random Target' },
  { id: 'type-8', label: '8. Inline Manual Pool' },
  { id: 'type-9', label: '9. Image-Only Options' },
  { id: 'type-10', label: '10. Misconception Distractors' },
  { id: 'field-reference', label: 'Field Reference' },
  { id: 'difficulty-rules', label: 'Difficulty Rules' },
  { id: 'placeholders', label: 'Template Placeholders' },
  { id: 'decision-guide', label: 'Decision Guide' },
];

const TYPE_BADGES = {
  1: { label: 'choice', color: '#6366f1' },
  2: { label: 'choice + visual', color: '#8b5cf6' },
  3: { label: 'choice', color: '#6366f1' },
  4: { label: 'multi_select', color: '#f59e0b' },
  5: { label: 'categorizationv2', color: '#10b981' },
  6: { label: 'categorization', color: '#059669' },
  7: { label: 'choice + random', color: '#3b82f6' },
  8: { label: 'inline pool', color: '#64748b' },
  9: { label: 'image-only', color: '#ec4899' },
  10: { label: 'remediation', color: '#ef4444' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{
      position: 'absolute', top: 10, right: 10,
      background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.15)',
      color: copied ? '#fff' : '#94a3b8',
      borderRadius: 6, padding: '3px 10px', fontSize: 11,
      cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
      letterSpacing: '0.02em'
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code, lang = 'json' }) {
  const trimmed = code.trim();
  return (
    <div style={{ position: 'relative', margin: '14px 0' }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.08)',
          padding: '7px 14px',
          borderBottom: '1px solid rgba(99,102,241,0.15)'
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: '#6366f1', textTransform: 'uppercase'
          }}>{lang}</span>
        </div>
        <pre style={{
          margin: 0, padding: '16px 18px',
          fontSize: 12.5, lineHeight: 1.75,
          color: '#e2e8f0', overflowX: 'auto',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          whiteSpace: 'pre',
        }}><code dangerouslySetInnerHTML={{ __html: highlightCode(trimmed, lang) }} /></pre>
      </div>
      <CopyButton text={trimmed} />
    </div>
  );
}

function highlightCode(code, lang) {
  if (lang === 'json') {
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"\s*:/g, '<span style="color:#93c5fd">"$1"</span>:')
      .replace(/:\s*"([^"\\]*(\\.[^"\\]*)*)"/g, ': <span style="color:#86efac">"$1"</span>')
      .replace(/:\s*(true|false|null)/g, ': <span style="color:#f9a8d4">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span style="color:#fcd34d">$1</span>');
  }
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: '2px 10px', fontSize: 11,
      fontWeight: 700, letterSpacing: '0.04em', fontFamily: 'monospace'
    }}>{label}</span>
  );
}

function SectionCard({ id, number, title, description, badge, children }) {
  return (
    <section id={id} style={{ marginBottom: 48 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 14, padding: '24px 28px',
        marginBottom: 4
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          {number && (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0
            }}>{number}</div>
          )}
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>{title}</h2>
          {badge && <Badge label={badge.label} color={badge.color} />}
        </div>
        {description && (
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgba(99,102,241,0.15)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 14px', textAlign: 'left',
                color: '#c4b5fd', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                borderBottom: '1px solid rgba(99,102,241,0.25)'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '9px 14px', color: '#cbd5e1', verticalAlign: 'top'
                }} dangerouslySetInnerHTML={{ __html: cell }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InlineCode({ children }) {
  return (
    <code style={{
      background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
      borderRadius: 4, padding: '1px 6px', fontSize: '0.88em',
      fontFamily: 'monospace'
    }}>{children}</code>
  );
}

function Callout({ type = 'info', children }) {
  const styles = {
    info: { bg: 'rgba(99,102,241,0.1)', border: '#6366f1', icon: 'ℹ️' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', icon: '⚠️' },
    tip: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', icon: '💡' },
  };
  const s = styles[type];
  return (
    <div style={{
      background: s.bg, borderLeft: `3px solid ${s.border}`,
      borderRadius: '0 8px 8px 0', padding: '12px 16px',
      margin: '14px 0', color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.65
    }}>
      <span style={{ marginRight: 6 }}>{s.icon}</span>{children}
    </div>
  );
}

export default function OptionPoolingDocs() {
  const [activeSection, setActiveSection] = useState('how-it-works');
  const [tocOpen, setTocOpen] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(2,6,23,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 10, padding: '6px 10px',
            fontSize: 20, lineHeight: 1
          }}>🗂️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>
              Option Pooling — Reference Guide
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              WEXLS · Dynamic Pool Engine · 10 Question Types
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            background: 'rgba(16,185,129,0.15)', color: '#34d399',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700
          }}>v1.0</span>
          <button
            onClick={() => setTocOpen(o => !o)}
            style={{
              display: 'none',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc', borderRadius: 8, padding: '7px 14px',
              cursor: 'pointer', fontSize: 13, fontWeight: 600
            }}
            className="toc-toggle"
          >
            ☰ Contents
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', maxWidth: 1400, margin: '0 auto' }}>
        {/* Sidebar ToC */}
        <aside style={{
          width: 220, flexShrink: 0,
          position: 'sticky', top: 61, alignSelf: 'flex-start',
          height: 'calc(100vh - 61px)', overflowY: 'auto',
          padding: '24px 16px',
          borderRight: '1px solid rgba(99,102,241,0.1)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Contents
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  textAlign: 'left', background: activeSection === id
                    ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: 'none', borderRadius: 6,
                  padding: '6px 10px',
                  color: activeSection === id ? '#a5b4fc' : '#64748b',
                  fontSize: 12.5, fontWeight: activeSection === id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderLeft: activeSection === id ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >{label}</button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '36px 48px 80px', minWidth: 0 }}>

          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 16, padding: '32px 36px', marginBottom: 48
          }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 900, color: '#f1f5f9', lineHeight: 1.2 }}>
              Option Pooling
              <span style={{ color: '#818cf8' }}> — All Question Types</span>
            </h1>
            <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
              Complete JSON reference for every <strong style={{ color: '#c4b5fd' }}>Dynamic Option Pool</strong> question type supported by WEXLS.
              Each entry includes the question document, vocabulary pool, and expected rendered output.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { icon: '📄', text: 'Question Documents' },
                { icon: '📦', text: 'Vocabulary Pools' },
                { icon: '✅', text: 'Expected Outputs' },
                { icon: '📊', text: 'Difficulty Scaling' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#cbd5e1'
                }}>
                  <span>{item.icon}</span> {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Type Overview Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12, marginBottom: 56
          }}>
            {[
              { num: 1, title: 'Audio Sound Card', icon: '🔊', desc: 'Hear a sound, pick the word' },
              { num: 2, title: 'Image Visual Pick', icon: '🖼️', desc: 'See an image, pick the label' },
              { num: 3, title: 'Text Only', icon: '📝', desc: 'Read a prompt, pick a word' },
              { num: 4, title: 'Multi-Select', icon: '☑️', desc: 'Select all correct words' },
              { num: 5, title: 'Categorization HTML5', icon: '🗂️', desc: 'Drag into bins (HTML5)' },
              { num: 6, title: 'Categorization Konva', icon: '🎨', desc: 'Drag into bins (Canvas)' },
              { num: 7, title: 'Random Target', icon: '🎲', desc: 'Random category each session' },
              { num: 8, title: 'Inline Pool', icon: '📋', desc: 'Options embedded in question' },
              { num: 9, title: 'Image-Only Options', icon: '🌄', desc: 'Image buttons, labels hidden' },
              { num: 10, title: 'Misconception Targeted', icon: '🎯', desc: 'Remediation distractors' },
            ].map((item) => (
              <button
                key={item.num}
                onClick={() => scrollTo(`type-${item.num}`)}
                style={{
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 12, padding: '16px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s', color: 'inherit',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                  e.currentTarget.style.background = 'rgba(15,23,42,0.6)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0
                  }}>{item.num}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{item.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>{item.desc}</p>
              </button>
            ))}
          </div>

          {/* ── HOW IT WORKS ── */}
          <section id="how-it-works" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>
              🔄 How Dynamic Pools Work
            </h2>
            <div style={{
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 14, padding: 24, marginBottom: 20
            }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{
                  flex: 1, minWidth: 200,
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 10, padding: '16px 18px'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 8, letterSpacing: '0.08em' }}>
                    MONGODB: questions
                  </div>
                  {['type: "dynamic_pool"', 'poolId: "my-pool-id"  ─────────►', 'interaction: "choice"', 'targetCategory: "nouns"', 'difficultyRules: { ... }'].map((line, i) => (
                    <div key={i} style={{
                      fontFamily: 'monospace', fontSize: 12, color: i === 1 ? '#a5b4fc' : '#94a3b8',
                      fontWeight: i === 1 ? 700 : 400, padding: '1px 0'
                    }}>{line}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#6366f1', flexShrink: 0 }}>→</div>
                <div style={{
                  flex: 1, minWidth: 200,
                  background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 10, padding: '16px 18px'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 8, letterSpacing: '0.08em' }}>
                    MONGODB: vocabulary_pools
                  </div>
                  {['poolId: "my-pool-id"', 'pools: {', '  nouns: [...],', '  verbs: [...],', '  correctPool: [...]', '}'].map((line, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', padding: '1px 0' }}>{line}</div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', margin: '16px 0 8px', color: '#6366f1', fontSize: 18 }}>↓</div>
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 10, padding: '12px 18px', textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fcd34d', fontWeight: 700 }}>
                  generateFromDynamicPool(poolDoc, seed, difficulty, history)
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  → Rendered MCQ / Categorization payload delivered to student
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd', marginBottom: 8 }}>
              Option Item Schema <span style={{ color: '#475569', fontWeight: 400 }}>(inside pools.*)</span>
            </h3>
            <CodeBlock lang="json" code={`{
  "id": "unique-item-id",
  "label": "apple",
  "imageUrl": "https://cdn.example.com/apple.png",
  "audioUrl": "https://cdn.example.com/audio/apple.wav",
  "prompt": "apple",
  "soundText": "apple",
  "distractors": ["mango", "grape"],
  "misconceptionType": "confusion_a_u",
  "similarity": "high",
  "allowedModes": ["identify_text", "identify_visual"],
  "active": true,
  "assetStatus": {
    "image": "approved",
    "audio": "approved"
  }
}`} />
          </section>

          <div style={{ height: 1, background: 'rgba(99,102,241,0.15)', marginBottom: 48 }} />

          {/* ── TYPE 1 ── */}
          <SectionCard id="type-1" number={1} title="MCQ — Audio Sound Card" badge={TYPE_BADGES[1]}
            description="Student hears a phonics sound and must select the matching word from buttons.">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', margin: '20px 0 6px' }}>📄 Question Document</h3>
            <CodeBlock lang="json" code={`{
  "id": "english_phonics_short-vowel-a_1001",
  "type": "dynamic_pool",
  "interaction": "choice",
  "status": "active",
  "subject": "english",
  "topic": "phonics",
  "skillId": "phonics-short-vowel-a",

  "poolId": "english-phonics-short-a-v1",
  "targetCategory": "short_a",
  "distractorCategories": ["short_i", "short_o"],

  "questionText": "Click the button. Which word do you hear?",
  "voice": "Puck",
  "generateAudio": "all",

  "parts": [
    { "type": "text", "content": "{{questionText}}" },
    { "type": "play_sound_card" }
  ],

  "hideOptionImages": false,
  "hideOptionLabel": false,

  "difficultyRules": {
    "easy":   { "optionCount": 2, "distractorSimilarity": "low",    "showLabels": true },
    "medium": { "optionCount": 3, "distractorSimilarity": "medium", "showLabels": true },
    "hard":   { "optionCount": 4, "distractorSimilarity": "high",   "showLabels": false }
  },

  "feedback": {
    "correct": "Great! **{{target}}** is correct!",
    "incorrect": "Not quite. Listen again."
  },
  "explanation": "The word you hear is **{{target}}**."
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', margin: '20px 0 6px' }}>📦 Vocabulary Pool</h3>
            <CodeBlock lang="json" code={`{
  "poolId": "english-phonics-short-a-v1",
  "subject": "english",
  "topic": "phonics",
  "status": "active",
  "pools": {
    "short_a": [
      { "id": "sa_cat", "label": "cat", "audioUrl": "https://cdn/audio/cat.wav", "active": true },
      { "id": "sa_bat", "label": "bat", "audioUrl": "https://cdn/audio/bat.wav", "active": true },
      { "id": "sa_hat", "label": "hat", "audioUrl": "https://cdn/audio/hat.wav", "active": true },
      { "id": "sa_mat", "label": "mat", "audioUrl": "https://cdn/audio/mat.wav", "active": true }
    ],
    "short_i": [
      { "id": "si_sit", "label": "sit", "audioUrl": "https://cdn/audio/sit.wav", "active": true },
      { "id": "si_bit", "label": "bit", "audioUrl": "https://cdn/audio/bit.wav", "active": true }
    ],
    "short_o": [
      { "id": "so_dog", "label": "dog", "audioUrl": "https://cdn/audio/dog.wav", "active": true },
      { "id": "so_pot", "label": "pot", "audioUrl": "https://cdn/audio/pot.wav", "active": true }
    ]
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (Easy, target = "cat")</h3>
            <CodeBlock lang="json" code={`{
  "id": "english_phonics_short-vowel-a_1001_<seed>_cat",
  "type": "mcq",
  "interaction": "choice",
  "questionText": "Click the button. Which word do you hear?",
  "soundText": "cat",
  "soundUrl": "https://cdn/audio/cat.wav",
  "parts": [
    { "type": "text", "content": "Click the button. Which word do you hear?" },
    { "type": "play_sound_card" }
  ],
  "options": [
    { "id": "so_dog", "label": "dog", "audioUrl": "...", "isCorrect": false },
    { "id": "sa_cat", "label": "cat", "audioUrl": "...", "isCorrect": true }
  ],
  "correctAnswerIndex": 1,
  "answer": 1,
  "explanation": "The word you hear is **cat**.",
  "feedback": { "correct": "Great! **cat** is correct!", "incorrect": "Not quite. Listen again." },
  "metadata": {
    "subject": "english", "topic": "phonics",
    "skillId": "phonics-short-vowel-a",
    "difficulty": "easy", "targetCategory": "short_a"
  }
}`} />
          </SectionCard>

          {/* ── TYPE 2 ── */}
          <SectionCard id="type-2" number={2} title="MCQ — Image Visual Pick" badge={TYPE_BADGES[2]}
            description="An image appears (e.g. an animal), student picks the matching word button.">
            <Callout type="info">
              <strong>Key:</strong> Set <InlineCode>mode: "identify_visual"</InlineCode> directly in the pool document (MongoDB) — not in the admin UI. Combined with <InlineCode>hideOptionImages: true</InlineCode>, the image shows as the prompt while choice buttons show text labels only.
            </Callout>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', margin: '20px 0 6px' }}>📄 Question Document</h3>
            <CodeBlock lang="json" code={`{
  "id": "english_vocab_animals_2001",
  "type": "dynamic_pool",
  "interaction": "choice",
  "poolId": "english-animals-v1",
  "targetCategory": "farm_animals",
  "distractorCategories": ["wild_animals"],
  "questionText": "What animal is this?",
  "parts": [
    { "type": "text", "content": "What animal is this?" },
    { "type": "image", "imageUrl": "{{targetImage}}", "alt": "{{targetWord}}" }
  ],
  "hideOptionImages": true,
  "hideOptionLabel": false,
  "mode": "identify_visual",
  "difficultyRules": {
    "easy":   { "optionCount": 2, "distractorSimilarity": "low",    "showLabels": true },
    "medium": { "optionCount": 3, "distractorSimilarity": "medium", "showLabels": true },
    "hard":   { "optionCount": 4, "distractorSimilarity": "high",   "showLabels": true }
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (target = "cow", Easy)</h3>
            <CodeBlock lang="json" code={`{
  "type": "mcq",
  "interaction": "choice",
  "questionText": "What animal is this?",
  "parts": [
    { "type": "text", "content": "What animal is this?" },
    { "type": "image", "imageUrl": "https://cdn/animals/cow.png", "alt": "cow" }
  ],
  "options": [
    { "id": "wa_lion", "label": "lion", "imageUrl": null, "isCorrect": false },
    { "id": "fa_cow",  "label": "cow",  "imageUrl": null, "isCorrect": true }
  ],
  "correctAnswerIndex": 1,
  "answer": 1
}`} />
          </SectionCard>

          {/* ── TYPE 3 ── */}
          <SectionCard id="type-3" number={3} title="MCQ — Text Only" badge={TYPE_BADGES[3]}
            description="A definition or phrase is shown; student picks the matching vocabulary word.">
            <CodeBlock lang="json" code={`{
  "id": "english_grammar_pos_3001",
  "type": "dynamic_pool",
  "interaction": "choice",
  "poolId": "english-grammar-pos-v1",
  "targetCategory": "nouns",
  "distractorCategories": ["verbs", "adjectives"],
  "questionText": "Which of these is a noun?",
  "parts": [{ "type": "text", "content": "Which of these is a noun?" }],
  "hideOptionImages": true,
  "hideOptionLabel": false,
  "difficultyRules": {
    "easy":   { "optionCount": 2, "distractorSimilarity": "low",    "showLabels": true },
    "medium": { "optionCount": 4, "distractorSimilarity": "medium", "showLabels": true },
    "hard":   { "optionCount": 6, "distractorSimilarity": "high",   "showLabels": true }
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (target = "apple", Easy)</h3>
            <CodeBlock lang="json" code={`{
  "type": "mcq",
  "interaction": "choice",
  "questionText": "Which of these is a noun?",
  "options": [
    { "id": "v_run",   "label": "run",   "imageUrl": null, "isCorrect": false },
    { "id": "n_apple", "label": "apple", "imageUrl": null, "isCorrect": true }
  ],
  "correctAnswerIndex": 1,
  "answer": 1,
  "explanation": "The correct answer is **apple**."
}`} />
          </SectionCard>

          {/* ── TYPE 4 ── */}
          <SectionCard id="type-4" number={4} title="Multi-Select MCQ" badge={TYPE_BADGES[4]}
            description="Student must select all words that match a criterion (e.g. all nouns in a list).">
            <Callout type="info">
              <strong>Key:</strong> <InlineCode>interaction: "multi_select"</InlineCode> activates checkbox rendering. <InlineCode>correctCount</InlineCode> in <InlineCode>difficultyRules</InlineCode> controls how many target options appear per variant. If <InlineCode>correctCount &gt; 1</InlineCode> the engine switches to multi-select automatically.
            </Callout>
            <CodeBlock lang="json" code={`{
  "id": "english_grammar_multi_4001",
  "type": "dynamic_pool",
  "interaction": "multi_select",
  "poolId": "english-grammar-pos-v1",
  "targetCategory": "nouns",
  "distractorCategories": ["verbs", "adjectives"],
  "questionText": "Select all the nouns.",
  "parts": [{ "type": "text", "content": "Select all the nouns." }],
  "difficultyRules": {
    "easy":   { "optionCount": 4, "correctCount": 2, "distractorSimilarity": "low",    "showLabels": true },
    "medium": { "optionCount": 5, "correctCount": 2, "distractorSimilarity": "medium", "showLabels": true },
    "hard":   { "optionCount": 6, "correctCount": 3, "distractorSimilarity": "high",   "showLabels": true }
  },
  "feedback": {
    "correct": "Great! You found all the nouns.",
    "incorrect": "Not all correct — check your selections."
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (Easy, 4 options, 2 correct)</h3>
            <CodeBlock lang="json" code={`{
  "type": "mcq",
  "interaction": "multi_select",
  "questionText": "Select all the nouns.",
  "options": [
    { "id": "v_run",    "label": "run",    "isCorrect": false },
    { "id": "n_apple",  "label": "apple",  "isCorrect": true  },
    { "id": "adj_big",  "label": "big",    "isCorrect": false },
    { "id": "n_school", "label": "school", "isCorrect": true  }
  ],
  "correctAnswerIndices": [1, 3],
  "answer": [1, 3],
  "explanation": "The correct words are: **apple**, **school**."
}`} />
          </SectionCard>

          {/* ── TYPE 5 ── */}
          <SectionCard id="type-5" number={5} title="Categorization — HTML5 Drag & Drop" badge={TYPE_BADGES[5]}
            description="Student drags word/image cards into the correct category bins using the modern HTML5 renderer.">
            <div style={{
              background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 10, padding: 16, marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 10 }}>📊 Difficulty Scaling</div>
              <Table
                headers={['Difficulty', 'Max Categories', 'Items / Category', 'Total Drag Items']}
                rows={[
                  ['<span style="color:#86efac">Easy</span>', '2', '2', '<strong>4</strong>'],
                  ['<span style="color:#fcd34d">Medium</span>', '3', '2', '<strong>6</strong>'],
                  ['<span style="color:#f87171">Hard</span>', '3', '3', '<strong>9</strong>'],
                ]}
              />
            </div>
            <CodeBlock lang="json" code={`{
  "id": "science_matter_categorization_5001",
  "type": "dynamic_pool",
  "interaction": "categorizationv2",
  "poolId": "science-states-of-matter-v1",
  "categories": [],
  "questionText": "Sort each item into its correct state of matter.",
  "parts": [{ "type": "text", "content": "{{questionText}}" }],
  "difficultyRules": {
    "easy":   { "maxCategories": 2, "itemsPerCategory": 2 },
    "medium": { "maxCategories": 3, "itemsPerCategory": 2 },
    "hard":   { "maxCategories": 3, "itemsPerCategory": 3 }
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', margin: '20px 0 6px' }}>📦 Vocabulary Pool</h3>
            <CodeBlock lang="json" code={`{
  "poolId": "science-states-of-matter-v1",
  "status": "active",
  "pools": {
    "solids":  [
      { "id": "s_ice",   "label": "ice",   "imageUrl": "https://cdn/ice.png",   "active": true },
      { "id": "s_rock",  "label": "rock",  "imageUrl": "https://cdn/rock.png",  "active": true },
      { "id": "s_brick", "label": "brick", "imageUrl": "https://cdn/brick.png", "active": true }
    ],
    "liquids": [
      { "id": "l_water", "label": "water", "imageUrl": "https://cdn/water.png", "active": true },
      { "id": "l_milk",  "label": "milk",  "imageUrl": "https://cdn/milk.png",  "active": true }
    ],
    "gases":   [
      { "id": "g_steam",  "label": "steam",  "imageUrl": "https://cdn/steam.png",  "active": true },
      { "id": "g_oxygen", "label": "oxygen", "imageUrl": "https://cdn/oxygen.png", "active": true }
    ]
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (Easy: 2 categories, 4 items)</h3>
            <CodeBlock lang="json" code={`{
  "type": "categorizationv2",
  "interaction": "categorizationv2",
  "categories": [
    { "id": "solids",  "label": "Solids" },
    { "id": "liquids", "label": "Liquids" }
  ],
  "items": [
    { "id": "l_water", "content": "water", "label": "water", "imageUrl": "...", "target": "liquids" },
    { "id": "s_brick", "content": "brick", "label": "brick", "imageUrl": "...", "target": "solids" },
    { "id": "l_milk",  "content": "milk",  "label": "milk",  "imageUrl": "...", "target": "liquids" },
    { "id": "s_rock",  "content": "rock",  "label": "rock",  "imageUrl": "...", "target": "solids" }
  ],
  "answer": { "l_water": "liquids", "s_brick": "solids", "l_milk": "liquids", "s_rock": "solids" }
}`} />
          </SectionCard>

          {/* ── TYPE 6 ── */}
          <SectionCard id="type-6" number={6} title="Categorization — Konva Canvas" badge={TYPE_BADGES[6]}
            description="Same as #5 but routes to the Konva canvas renderer with smooth animations.">
            <Callout type="info">
              Use <InlineCode>interaction: "categorization"</InlineCode> (without "v2") to route to <strong>KonvaCategorizationRenderer</strong>. Use <InlineCode>"categorizationv2"</InlineCode> for the modern HTML5 version.
            </Callout>
            <CodeBlock lang="json" code={`{
  "id": "science_matter_konva_6001",
  "type": "dynamic_pool",
  "interaction": "categorization",
  "poolId": "science-states-of-matter-v1",
  "categories": [
    { "id": "solids",  "label": "Solids" },
    { "id": "liquids", "label": "Liquids" },
    { "id": "gases",   "label": "Gases"  }
  ],
  "questionText": "Drag each item into the correct state of matter.",
  "difficultyRules": {
    "easy":   { "maxCategories": 2, "itemsPerCategory": 1 },
    "medium": { "maxCategories": 3, "itemsPerCategory": 2 },
    "hard":   { "maxCategories": 3, "itemsPerCategory": 3 }
  }
}`} />
          </SectionCard>

          {/* ── TYPE 7 ── */}
          <SectionCard id="type-7" number={7} title="MCQ — Random Target Category" badge={TYPE_BADGES[7]}
            description="Each practice session picks a different random category as the target.">
            <Callout type="tip">
              <InlineCode>targetCategory: "[random]"</InlineCode> makes the generator pick a random pool category on every call. The seed makes it deterministic per session — so the same student gets the same variant on reload.
            </Callout>
            <CodeBlock lang="json" code={`{
  "id": "english_phonics_random_7001",
  "type": "dynamic_pool",
  "interaction": "choice",
  "poolId": "english-phonics-short-a-v1",
  "targetCategory": "[random]",
  "distractorCategories": [],
  "questionText": "Click the button. Which word do you hear?",
  "parts": [
    { "type": "text",           "content": "{{questionText}}" },
    { "type": "play_sound_card" }
  ],
  "difficultyRules": {
    "easy":   { "optionCount": 2, "distractorSimilarity": "low",    "showLabels": true },
    "medium": { "optionCount": 3, "distractorSimilarity": "medium", "showLabels": true },
    "hard":   { "optionCount": 4, "distractorSimilarity": "high",   "showLabels": false }
  }
}`} />
            <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 13.5, lineHeight: 1.7 }}>
              <strong style={{ color: '#c4b5fd' }}>Expected behavior:</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>Session 1 (seed A): target = <InlineCode>short_a</InlineCode> → "cat", "bat", "hat" as correct</li>
                <li>Session 2 (seed B): target = <InlineCode>short_o</InlineCode> → "dog", "pot" as correct</li>
                <li>Same seed always reproduces the same variant</li>
              </ul>
            </div>
          </SectionCard>

          {/* ── TYPE 8 ── */}
          <SectionCard id="type-8" number={8} title="MCQ — Inline Manual Pool" badge={TYPE_BADGES[8]}
            description="Options embedded directly in the question doc — no centralized poolId needed.">
            <Callout type="warning">
              No <InlineCode>poolId</InlineCode> is set. Use <InlineCode>pools.correctPool</InlineCode> and <InlineCode>pools.distractorPool</InlineCode> embedded directly in the question document.
            </Callout>
            <CodeBlock lang="json" code={`{
  "id": "english_phonics_inline_8001",
  "type": "dynamic_pool",
  "interaction": "choice",
  "questionText": "Click the button. Which word do you hear?",
  "parts": [
    { "type": "text",           "content": "{{questionText}}" },
    { "type": "play_sound_card" }
  ],
  "pools": {
    "correctPool": [
      { "id": "p_bat", "label": "bat", "audioUrl": "https://cdn/audio/bat.wav", "active": true },
      { "id": "p_bed", "label": "bed", "audioUrl": "https://cdn/audio/bed.wav", "active": true },
      { "id": "p_big", "label": "big", "audioUrl": "https://cdn/audio/big.wav", "active": true }
    ],
    "distractorPool": [
      { "id": "p_cat",  "label": "cat",  "similarity": "low",    "active": true },
      { "id": "p_rat",  "label": "rat",  "similarity": "medium", "active": true },
      { "id": "p_band", "label": "band", "similarity": "high",   "active": true }
    ]
  },
  "difficultyRules": {
    "easy":   { "optionCount": 2, "distractorSimilarity": "low",    "showLabels": true },
    "medium": { "optionCount": 3, "distractorSimilarity": "medium", "showLabels": true },
    "hard":   { "optionCount": 4, "distractorSimilarity": "high",   "showLabels": false }
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (Easy, target = "bat")</h3>
            <CodeBlock lang="json" code={`{
  "type": "mcq",
  "interaction": "choice",
  "soundText": "bat",
  "options": [
    { "id": "opt_0", "label": "cat", "isCorrect": false },
    { "id": "opt_1", "label": "bat", "isCorrect": true }
  ],
  "correctAnswerIndex": 1,
  "answer": 1
}`} />
          </SectionCard>

          {/* ── TYPE 9 ── */}
          <SectionCard id="type-9" number={9} title="MCQ — Image-Only Options" badge={TYPE_BADGES[9]}
            description="Student hears a word (audio), then picks from image buttons with no text labels.">
            <Callout type="info">
              <InlineCode>hideOptionLabel: true</InlineCode> clears labels. <InlineCode>hideOptionImages: false</InlineCode> keeps images. The generator <strong>silently excludes</strong> any option without a valid <InlineCode>imageUrl</InlineCode> or where <InlineCode>assetStatus.image === "needs_review"</InlineCode>.
            </Callout>
            <CodeBlock lang="json" code={`{
  "id": "english_vocab_images_9001",
  "type": "dynamic_pool",
  "interaction": "choice",
  "poolId": "english-animals-v1",
  "targetCategory": "farm_animals",
  "distractorCategories": ["wild_animals"],
  "questionText": "Which picture matches the word you hear?",
  "parts": [
    { "type": "text",           "content": "{{questionText}}" },
    { "type": "play_sound_card" }
  ],
  "hideOptionImages": false,
  "hideOptionLabel": true,
  "difficultyRules": {
    "easy":   { "optionCount": 2, "showLabels": false },
    "medium": { "optionCount": 3, "showLabels": false },
    "hard":   { "optionCount": 4, "showLabels": false }
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (target = "cow", Easy)</h3>
            <CodeBlock lang="json" code={`{
  "type": "mcq",
  "interaction": "choice",
  "soundText": "cow",
  "options": [
    { "id": "wa_lion", "label": "", "imageUrl": "https://cdn/animals/lion.png", "hideLabel": true, "isCorrect": false },
    { "id": "fa_cow",  "label": "", "imageUrl": "https://cdn/animals/cow.png",  "hideLabel": true, "isCorrect": true  }
  ],
  "correctAnswerIndex": 1
}`} />
          </SectionCard>

          {/* ── TYPE 10 ── */}
          <SectionCard id="type-10" number={10} title="MCQ — Misconception-Targeted Distractors" badge={TYPE_BADGES[10]}
            description="When a student has a known weakness, the system injects the specific confusable distractor for targeted remediation.">
            <Callout type="warning">
              Pass <InlineCode>history = {'{ weaknesses: { b_d_confusion: 3 } }'}</InlineCode> from the student session to activate. The distractor with matching <InlineCode>misconceptionType</InlineCode> is always injected first, before other distractors are selected.
            </Callout>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', margin: '20px 0 6px' }}>📦 Pool — with misconceptionType on distractors</h3>
            <CodeBlock lang="json" code={`{
  "poolId": "english-phonics-bd-v1",
  "pools": {
    "letter_b": [
      { "id": "lb_bat", "label": "bat", "active": true, "distractors": ["dat", "pat"], "similarity": "low" },
      { "id": "lb_bed", "label": "bed", "active": true, "distractors": ["ded"],        "similarity": "low" }
    ],
    "letter_d": [
      { "id": "ld_dat", "label": "dat", "active": true, "misconceptionType": "b_d_confusion", "similarity": "high" },
      { "id": "ld_ded", "label": "ded", "active": true, "misconceptionType": "b_d_confusion", "similarity": "high" }
    ],
    "letter_p": [
      { "id": "lp_pat", "label": "pat", "active": true, "misconceptionType": "b_p_confusion", "similarity": "medium" }
    ]
  }
}`} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', margin: '20px 0 6px' }}>✅ Expected Output (student has b_d_confusion weakness)</h3>
            <CodeBlock lang="json" code={`{
  "type": "mcq",
  "interaction": "choice",
  "questionText": "Which word starts with the letter B?",
  "options": [
    { "id": "ld_dat", "label": "dat", "isCorrect": false, "misconceptionType": "b_d_confusion" },
    { "id": "lb_bat", "label": "bat", "isCorrect": true,  "misconceptionType": null }
  ],
  "correctAnswerIndex": 1,
  "metadata": {
    "remediationActive": true,
    "targetMisconception": "b_d_confusion"
  }
}`} />
          </SectionCard>

          {/* ── FIELD REFERENCE ── */}
          <section id="field-reference" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>📋 Option Item Field Reference</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '20px 24px' }}>
              <Table
                headers={['Field', 'Type', 'Required', 'Description']}
                rows={[
                  ['<code style="color:#93c5fd">id</code>', 'string', '✅', 'Unique item ID — used as the answer key in categorization'],
                  ['<code style="color:#93c5fd">label</code>', 'string', '✅', 'Display text on the option button or drag card'],
                  ['<code style="color:#93c5fd">imageUrl</code>', 'string', 'Optional', 'Image to display on the option card'],
                  ['<code style="color:#93c5fd">audioUrl</code>', 'string', 'Optional', 'Pre-recorded audio URL. Falls back to TTS if absent'],
                  ['<code style="color:#93c5fd">prompt</code>', 'string', 'Optional', 'Override text used as question prompt ({{targetPrompt}})'],
                  ['<code style="color:#93c5fd">soundText</code>', 'string', 'Optional', 'Override text used for TTS sound generation'],
                  ['<code style="color:#93c5fd">distractors</code>', 'string[]', 'Optional', 'Labels of thematic distractors from the distractor pool'],
                  ['<code style="color:#93c5fd">misconceptionType</code>', 'string', 'Optional', 'Distractor category key for targeted remediation'],
                  ['<code style="color:#93c5fd">similarity</code>', '"low"|"medium"|"high"', 'Optional', 'Used by distractorSimilarity rules to filter candidates'],
                  ['<code style="color:#93c5fd">allowedModes</code>', 'string[]', 'Optional', 'Restrict item to modes: identify_text, identify_visual'],
                  ['<code style="color:#93c5fd">active</code>', 'boolean', 'Optional', 'false = excluded from all generation'],
                  ['<code style="color:#93c5fd">assetStatus.image</code>', 'string', 'Optional', '"needs_review" = image excluded from visual modes'],
                  ['<code style="color:#93c5fd">assetStatus.audio</code>', 'string', 'Optional', '"needs_review" = falls back to TTS'],
                  ['<code style="color:#93c5fd">explanation</code>', 'string', 'Optional', 'Per-item explanation shown after answer is checked'],
                ]}
              />
            </div>
          </section>

          {/* ── DIFFICULTY RULES ── */}
          <section id="difficulty-rules" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>⚙️ difficultyRules Field Reference</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
              <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd', marginTop: 0, marginBottom: 12 }}>For MCQ / Multi-Select</h3>
                <CodeBlock lang="json" code={`{
  "easy":   { "optionCount": 2, "correctCount": 1, "distractorSimilarity": "low",    "showLabels": true  },
  "medium": { "optionCount": 4, "correctCount": 2, "distractorSimilarity": "medium", "showLabels": true  },
  "hard":   { "optionCount": 6, "correctCount": 3, "distractorSimilarity": "high",   "showLabels": false }
}`} />
                <Table
                  headers={['Field', 'Description']}
                  rows={[
                    ['<code style="color:#93c5fd">optionCount</code>', 'Total options rendered (correct + distractors)'],
                    ['<code style="color:#93c5fd">correctCount</code>', 'For multi-select: how many correct items to include'],
                    ['<code style="color:#93c5fd">distractorSimilarity</code>', '"low", "medium", or "high" — matches similarity on items'],
                    ['<code style="color:#93c5fd">showLabels</code>', 'false = labels hidden from option buttons'],
                  ]}
                />
              </div>
              <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginTop: 0, marginBottom: 12 }}>For Categorization</h3>
                <CodeBlock lang="json" code={`{
  "easy":   { "maxCategories": 2, "itemsPerCategory": 2 },
  "medium": { "maxCategories": 3, "itemsPerCategory": 2 },
  "hard":   { "maxCategories": 3, "itemsPerCategory": 3 }
}`} />
                <Table
                  headers={['Field', 'Description']}
                  rows={[
                    ['<code style="color:#93c5fd">maxCategories</code>', 'Max category bins rendered (alias: categoryCount)'],
                    ['<code style="color:#93c5fd">itemsPerCategory</code>', 'Items pulled from each pool category (alias: itemCount)'],
                  ]}
                />
              </div>
            </div>
          </section>

          {/* ── PLACEHOLDERS ── */}
          <section id="placeholders" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>🔣 Template Variable Placeholders</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 20 }}>
              <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: 13.5 }}>
                Use in <InlineCode>questionText</InlineCode>, <InlineCode>parts[].content</InlineCode>, <InlineCode>parts[].imageUrl</InlineCode>, <InlineCode>feedback</InlineCode>, and <InlineCode>explanation</InlineCode>.
              </p>
              <Table
                headers={['Placeholder', 'Resolves To']}
                rows={[
                  ['<code style="color:#fcd34d">{{questionText}}</code>', "The question's questionText field"],
                  ['<code style="color:#fcd34d">{{target}}</code> / <code style="color:#fcd34d">{{targetWord}}</code>', 'Label of the selected correct target item'],
                  ['<code style="color:#fcd34d">{{targetPrompt}}</code>', 'prompt field on item, falls back to label'],
                  ['<code style="color:#fcd34d">{{targetImage}}</code>', 'imageUrl of the selected correct target item'],
                  ['<code style="color:#fcd34d">{{targetAudio}}</code>', 'audioUrl of the selected correct target item'],
                  ['<code style="color:#fcd34d">{{targetCategory}}</code>', 'The resolved category key (e.g. "nouns")'],
                ]}
              />
            </div>
          </section>

          {/* ── DECISION GUIDE ── */}
          <section id="decision-guide" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>🧭 Quick Decision Guide</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '🔊', q: 'Hear a sound → click matching word', answer: 'interaction: "choice"', note: '+ parts: [play_sound_card]', color: '#6366f1' },
                { icon: '🖼️', q: 'See an image → click matching word', answer: 'interaction: "choice"', note: '+ mode: "identify_visual" on pool', color: '#8b5cf6' },
                { icon: '📝', q: 'Read a prompt → click word', answer: 'interaction: "choice"', note: '+ parts: [text only]', color: '#6366f1' },
                { icon: '☑️', q: 'Select ALL correct words', answer: 'interaction: "multi_select"', note: '', color: '#f59e0b' },
                { icon: '🗂️', q: 'Drag items into bins (HTML5)', answer: 'interaction: "categorizationv2"', note: '', color: '#10b981' },
                { icon: '🎨', q: 'Drag items into bins (Konva canvas)', answer: 'interaction: "categorization"', note: '', color: '#059669' },
                { icon: '📋', q: 'No centralized pool, custom options', answer: 'no poolId', note: '+ use pools.correctPool + pools.distractorPool', color: '#64748b' },
                { icon: '🎲', q: 'Random category each session', answer: 'targetCategory: "[random]"', note: '', color: '#3b82f6' },
                { icon: '🎯', q: 'Target specific student misconception', answer: 'misconceptionType on items', note: '+ pass history.weaknesses', color: '#ef4444' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(15,23,42,0.6)',
                  border: `1px solid ${item.color}22`,
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: 10, padding: '12px 16px',
                  flexWrap: 'wrap', gap: 10
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{item.q}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, color: '#475569' }}>→</span>
                    <code style={{
                      background: item.color + '18', color: item.color,
                      borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700
                    }}>{item.answer}</code>
                    {item.note && <span style={{ fontSize: 12, color: '#64748b' }}>{item.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid rgba(99,102,241,0.15)',
            paddingTop: 24, textAlign: 'center',
            color: '#334155', fontSize: 12
          }}>
            WEXLS Option Pooling Reference · Generated from DynamicPoolGenerator.js · KlassChamp
          </div>

        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        @media (max-width: 768px) {
          aside { display: none !important; }
          main { padding: 20px 16px 60px !important; }
          .toc-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
