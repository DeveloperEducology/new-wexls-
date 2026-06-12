'use client';

import { useState } from 'react';

const SECTIONS = [
  { id: 'architecture', label: 'Architecture Overview' },
  { id: 'datasources', label: '1. Data Sources' },
  { id: 'variables', label: '2. Dynamic Variables' },
  { id: 'functions', label: '3. Built-In Functions' },
  { id: 'visuals', label: '4. Visual Components' },
  { id: 'examples', label: '5. Complete JSON Examples' },
];

const COMPONENT_DETAILS = {
  TenFrame: {
    desc: 'Displays counters on a 10-frame grid with optional crossed-out items for subtraction subtraction exercises.',
    props: [
      ['filledCount', 'Number of filled counters (variable or expression)'],
      ['crossedOutCount', 'Number of crossed out counters (variable or expression)'],
      ['color', 'Counter color (e.g. red, blue, green)']
    ]
  },
  JarOfMarbles: {
    desc: 'Renders a visual glass jar filled with two sets of colored marbles.',
    props: [
      ['countA', 'Count of color A marbles'],
      ['colorA', 'Color of marble set A'],
      ['countB', 'Count of color B marbles'],
      ['colorB', 'Color of marble set B']
    ]
  },
  Spinner: {
    desc: 'Draws a circular spinner divided into multiple colored sectors.',
    props: [
      ['sectorsA', 'Number of sectors colored colorA'],
      ['colorA', 'Primary sector color'],
      ['sectorsB', 'Number of sectors colored colorB'],
      ['colorB', 'Secondary sector color']
    ]
  },
  ItemCounter: {
    desc: 'Renders a grid layout of objects (cupcakes, stars, apples) to assist students with counting tasks.',
    props: [
      ['count', 'Total items to display'],
      ['itemType', 'Asset name, or a comma-separated list of values (e.g. apple, cupcake, star) from which one is picked']
    ]
  },
  BaseTenBlocks: {
    desc: 'Renders Base Ten Dienes blocks representing mathematical place values.',
    props: [
      ['thousands', 'Count of thousand blocks'],
      ['hundreds', 'Count of flats (hundreds)'],
      ['tens', 'Count of rods (tens)'],
      ['ones', 'Count of unit cubes (ones)'],
      ['showChart', 'true/false to draw place value chart headers']
    ]
  },
  NumberLine: {
    desc: 'Draws a standard number line with custom start, end, steps, and optional highlighted marker points.',
    props: [
      ['min', 'Minimum boundary value'],
      ['max', 'Maximum boundary value'],
      ['step', 'Step interval size'],
      ['pointValue', 'Target location for the point marker dot'],
      ['pointLabel', 'Custom text next to the marker dot']
    ]
  },
  FractionBar: {
    desc: 'Displays a segmented rectangular strip representing fractional parts of a whole.',
    props: [
      ['denominator', 'Total sections of the bar'],
      ['numerator', 'Number of segments shaded'],
      ['color', 'Shading color']
    ]
  },
  FractionCircle: {
    desc: 'Displays a circular chart representing fractional slices of a whole.',
    props: [
      ['denominator', 'Total segments of the circle'],
      ['numerator', 'Number of shaded sections'],
      ['color', 'Shading color']
    ]
  }
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

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgba(99,102,241,0.15)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                textAlign: 'left', padding: '10px 14px',
                color: '#818cf8', fontWeight: 700,
                borderBottom: '2px solid rgba(99,102,241,0.3)'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} style={{
              borderBottom: '1px solid rgba(99,102,241,0.1)',
              background: rIdx % 2 === 0 ? 'transparent' : 'rgba(99,102,241,0.02)',
              transition: 'background 0.2s'
            }}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} style={{
                  padding: '10px 14px', color: '#94a3b8', lineHeight: 1.5
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
      background: 'rgba(99,102,241,0.12)',
      color: '#a5b4fc',
      padding: '2px 6px',
      borderRadius: 4,
      fontSize: '0.9em',
      fontFamily: 'monospace'
    }}>{children}</code>
  );
}

export default function DynamicTemplatesGuide() {
  const [activeSection, setActiveSection] = useState('architecture');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020617',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 40%)',
      color: '#f1f5f9',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
    }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: 280, background: 'rgba(15,23,42,0.8)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        flexShrink: 0, backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)'
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>⚡</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '0.02em', color: '#fff' }}>WEXLS Engine</h1>
            <p style={{ margin: 0, fontSize: 10, color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template Builder Guide</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                style={{
                  textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                  background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: isActive ? '#818cf8' : '#94a3b8',
                  border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isActive ? '#6366f1' : 'transparent',
                  transition: 'all 0.2s'
                }} />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, padding: '48px 48px 80px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', marginBottom: 10, letterSpacing: '-0.025em' }}>
              Dynamic Template Building Guide
            </h1>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              A comprehensive technical reference for building dynamic, randomized universal question templates inside the WEXLS learning framework.
            </p>
          </div>

          {/* Architecture Overview */}
          <section id="architecture" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>⚡ Architecture Overview</h2>
            <div style={{
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 14, padding: 24, lineHeight: 1.6
            }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Universal templates allow teachers and content authors to build a single question blueprint that scales. When a student practice session is initialized, the evaluator processes the template variables, resolves formulas using a seeded RNG, draws vector graphics components, and outputs a flat student-facing activity.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <pre style={{
                  background: '#090d16', border: '1px solid #1e293b',
                  borderRadius: 10, padding: 16, fontSize: 12, width: '100%',
                  color: '#818cf8', fontFamily: 'monospace', overflowX: 'auto'
                }}>{`Template JSON Blueprint  ──►  evaluateTemplate(seed)  ──►  Resolved Student Payload`}</pre>
              </div>
            </div>
          </section>

          {/* 1. Data Sources */}
          <section id="datasources" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>📊 1. Data Sources</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 24 }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Define resource arrays or random lists to serve as pools for your template questions.
              </p>
              <CodeBlock code={`[
  {
    "id": "animalNames",
    "type": "static_data",
    "items": ["cat", "dog", "cow", "lion", "tiger"]
  },
  {
    "id": "luckyNumbers",
    "type": "pool_selection",
    "items": "7, 11, 21, 42, 99",
    "count": 3
  }
]`} />
            </div>
          </section>

          {/* 2. Dynamic Variables */}
          <section id="variables" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>🧩 2. Dynamic Variables</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 24 }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Variables are computed sequentially. You can reference previously resolved parameters by using their identifiers.
              </p>
              <Table
                headers={['Type', 'Required Fields', 'Description']}
                rows={[
                  ['<code style="color:#6366f1">integer</code>', '<code>min</code>, <code>max</code>', 'Computes a random integer between min and max (inclusive).'],
                  ['<code style="color:#6366f1">expression</code>', '<code>formula</code>', 'Evaluates standard mathematical formulas (e.g. <code>A + B - C</code>).'],
                  ['<code style="color:#6366f1">string_template</code>', '<code>template</code>', 'Interpolates bracket tokens: e.g. <code>"[A] objects"</code>.'],
                  ['<code style="color:#6366f1">conditional</code>', '<code>condition</code>, <code>trueValue</code>, <code>falseValue</code>', 'Checks a boolean expression to route values.'],
                ]}
              />
            </div>
          </section>

          {/* 3. Built-In Functions */}
          <section id="functions" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>🔣 3. Built-In Functions</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 24 }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Built-in functions can be called inside formulas or string placeholders:
              </p>
              <Table
                headers={['Function Signature', 'Return Example', 'Use Case']}
                rows={[
                  ['<code style="color:#fcd34d">toWords(A)</code>', '"nine" (when A=9)', 'Converts numbers to written English names.'],
                ]}
              />
            </div>
          </section>

          {/* 4. Visual Components */}
          <section id="visuals" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>🎨 4. Visual Components Reference</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(COMPONENT_DETAILS).map(([compName, data], index) => (
                <div key={index} style={{
                  background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 12, padding: 20
                }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#818cf8', fontWeight: 800 }}>{compName}</h3>
                  <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>{data.desc}</p>
                  <Table
                    headers={['Parameter Name', 'Description / Expected Value']}
                    rows={data.props}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 5. Complete JSON Examples */}
          <section id="examples" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>📁 5. Complete Template Examples</h2>
            
            <h3 style={{ fontSize: 16, color: '#818cf8', fontWeight: 700, margin: '20px 0 10px' }}>Subtract with Ten Frame</h3>
            <CodeBlock code={`{
  "id": "math-subtraction-ten-frame-example",
  "title": "Subtract with Ten Frame",
  "subject": "math",
  "topic": "numbers-counting",
  "layoutConfig": { "mode": "prompt_top" },
  "variables": [
    { "name": "A", "type": "integer", "min": "5", "max": "10" },
    { "name": "B", "type": "integer", "min": "1", "max": "A - 1" },
    { "name": "Result", "type": "expression", "formula": "A - B" }
  ],
  "visuals": [
    {
      "component": "TenFrame",
      "props": {
        "filledCount": "A",
        "crossedOutCount": "B",
        "color": "red"
      }
    }
  ],
  "questionText": "What is [A] minus [B]?",
  "optionsType": "mcq",
  "options": [
    { "label": "[Result]", "isCorrect": true },
    { "label": "[Result] + 1", "isCorrect": false },
    { "label": "[Result] - 1", "isCorrect": false },
    { "label": "[A]", "isCorrect": false }
  ],
  "explanation": {
    "sections": [
      {
        "type": "text",
        "content": "Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result]."
      }
    ]
  }
}`} />
          </section>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid rgba(99,102,241,0.15)',
            paddingTop: 24, textAlign: 'center',
            color: '#334155', fontSize: 12
          }}>
            WEXLS Template Builder Guide · KlassChamp
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
        }
      `}</style>
    </div>
  );
}
