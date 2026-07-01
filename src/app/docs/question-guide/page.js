'use client';

import { useState } from 'react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'baseschema', label: '1. General Schema' },
  { id: 'types', label: '2. Question Types' },
  { id: 'dynamicpooling', label: '3. Dynamic Option Pools' },
  { id: 'subjects', label: '4. Subject Contexts' },
  { id: 'auditing', label: '5. Auditing & Verification' }
];

const CODE_EXAMPLES = {
  mcq: `{
  "id": "add_mcq_1001",
  "type": "mcq",
  "questionText": "What is 5 + 3?",
  "parts": [
    { "type": "text", "content": "What is 5 + 3?" }
  ],
  "options": [
    { "label": "8", "isCorrect": true },
    { "label": "7", "isCorrect": false },
    { "label": "9", "isCorrect": false }
  ],
  "explanation": "Adding 3 to 5 gives 8.",
  "metadata": {
    "subject": "math",
    "topic": "addition",
    "templateId": "math-add-facts",
    "difficulty": "easy"
  }
}`,
  fib: `{
  "id": "fib_single_1002",
  "type": "fillInTheBlank",
  "questionText": "Complete: 10 - [blank] = 4",
  "parts": [
    { "type": "text", "content": "Complete: 10 - [[ans]] = 4" }
  ],
  "answer": {
    "ans": "6"
  },
  "explanation": "Since 10 - 6 = 4, the blank is 6.",
  "metadata": {
    "subject": "math",
    "topic": "subtraction",
    "templateId": "math-sub-facts",
    "difficulty": "easy"
  }
}`,
  matching: `{
  "id": "match_ratio_1003",
  "type": "matching",
  "questionText": "Match each ratio with its simplest form.",
  "pairs": [
    { "left": { "content": "4:6" }, "right": { "content": "2:3" } },
    { "left": { "content": "5:10" }, "right": { "content": "1:2" } }
  ],
  "correctAnswer": {
    "4:6": "2:3",
    "5:10": "1:2"
  },
  "explanation": "Divide the ratio terms by their HCF.",
  "metadata": {
    "subject": "math",
    "topic": "ratio",
    "templateId": "math-ratio-simplifying",
    "difficulty": "medium"
  }
}`,
  categorization: `{
  "id": "sort_nouns_1004",
  "type": "categorization",
  "questionText": "Sort these words into Nouns and Not Nouns.",
  "categories": [
    { "id": "noun", "label": "Nouns" },
    { "id": "not_noun", "label": "Not Nouns" }
  ],
  "items": [
    { "id": "n1", "content": "apple" },
    { "id": "nn1", "content": "run" }
  ],
  "answer": {
    "n1": "noun",
    "nn1": "not_noun"
  },
  "explanation": "'apple' is a naming word (Noun), and 'run' is an action word (Not Noun).",
  "metadata": {
    "subject": "english",
    "topic": "grammar",
    "templateId": "grammar-noun-sort",
    "difficulty": "easy"
  }
}`,
  grid: `{
  "id": "grid_add_1005",
  "type": "fillInTheBlank",
  "questionText": "Solve: 24 + 8",
  "parts": [
    {
      "type": "arithmeticLayout",
      "layout": {
        "rows": [
          { "kind": "number", "text": " 24" },
          { "kind": "number", "text": "+ 8" },
          { "kind": "divider" },
          {
            "kind": "answer",
            "cells": [
              { "id": "ans_1", "placeholder": "" },
              { "id": "ans_2", "placeholder": "" }
            ]
          }
        ]
      }
    }
  ],
  "answer": {
    "ans_1": "3",
    "ans_2": "2"
  },
  "explanation": "24 + 8 = 32.",
  "metadata": {
    "subject": "math",
    "topic": "addition",
    "templateId": "math-add-column",
    "difficulty": "medium"
  }
}`,
  interactive: `{
  "id": "clock_tool_1006",
  "type": "interactiveTool",
  "toolId": "analog-clock",
  "toolVersion": "1.0.0",
  "questionText": "Set the analog clock to 3:30.",
  "toolConfig": {
    "targetHour": 3,
    "targetMinute": 30,
    "interactive": true
  },
  "answer": {
    "hour": 3,
    "minute": 30
  },
  "validation": {
    "strategy": "tool_state"
  },
  "metadata": {
    "subject": "math",
    "topic": "measurement",
    "templateId": "interactive-clock",
    "difficulty": "medium"
  }
}`
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
      letterSpacing: '0.02em', zIndex: 10
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

export default function QuestionGuidePage() {
  const [activeSection, setActiveSection] = useState('introduction');

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
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16,185,129,0.3)'
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>📝</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '0.02em', color: '#fff' }}>WEXLS Guide</h1>
            <p style={{ margin: 0, fontSize: 10, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question Schemas</p>
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
                  background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                  color: isActive ? '#34d399' : '#94a3b8',
                  border: isActive ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isActive ? '#10b981' : 'transparent',
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
          
          <div style={{ marginBottom: 40 }} id="introduction">
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', marginBottom: 10, letterSpacing: '-0.025em' }}>
              Question Creation Guide
            </h1>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              A technical guide detailing all the supported question types, validation schemas, dynamic template configuration, and option pooling settings in the WEXLS learning project.
            </p>
          </div>

          {/* 1. General Schema */}
          <section id="baseschema" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>📋 1. General Question Schema</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 24, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Every question returned by a template or engine generator must be a plain JavaScript object adhering to the base structure below:
              </p>
              <CodeBlock code={`interface BaseQuestion {
  id: string;              // Unique identifier (e.g. prefix + timestamp + counter)
  type: string;            // The question type (e.g., 'mcq', 'fillInTheBlank')
  questionText: string;    // Main fallback prompt for screen readers / TTS
  parts?: Array<Part>;     // Optional rich parts array for rendering text/graphics
  explanation?: string | ExplanationObject; // Step-by-step student explanation
  solutionSteps?: string[]; // Optional array of structured walkthrough steps
  metadata: {              // Diagnostic metadata
    subject: string;
    topic: string;
    templateId: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    [key: string]: any;
  }
}`} lang="typescript" />
            </div>
          </section>

          {/* 2. Question Types */}
          <section id="types" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>🧩 2. Supported Question Types</h2>
            <p style={{ color: '#cbd5e1', fontSize: 14.5, marginBottom: 24 }}>
              This project uses specific renderer layouts depending on the <code>type</code> value declared inside the question object:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* MCQ */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#34d399', fontWeight: 800 }}>Multiple-Choice (mcq)</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  Used for single-choice questions. It includes an <code>options</code> array of values with one marked as correct.
                </p>
                <CodeBlock code={CODE_EXAMPLES.mcq} />
              </div>

              {/* FIB */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#34d399', fontWeight: 800 }}>Fill-in-the-Blank (fillInTheBlank)</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  Used for text boxes containing entry blanks. Use <code>[[ans]]</code> or <code>[[blank_id]]</code> tags inside the layout parts and configure mapped answers inside the <code>answer</code> object.
                </p>
                <CodeBlock code={CODE_EXAMPLES.fib} />
              </div>

              {/* Matching */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#34d399', fontWeight: 800 }}>Matching Pairs (matching)</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  Used to match items from left to right. Set the <code>pairs</code> array and map left items directly to right items in the <code>correctAnswer</code> object.
                </p>
                <CodeBlock code={CODE_EXAMPLES.matching} />
              </div>

              {/* Categorization */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#34d399', fontWeight: 800 }}>Categorization / Sorting (categorization)</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  Used for sorting cards into specific bins. Requires listing <code>categories</code> and <code>items</code> to drag, and maps card item IDs to category IDs in the <code>answer</code> object.
                </p>
                <CodeBlock code={CODE_EXAMPLES.categorization} />
              </div>

              {/* Grid Arithmetic */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#34d399', fontWeight: 800 }}>Grid Arithmetic (gridArithmetic)</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  Used for vertical column math with carry boxes. Simply set a part with <code>"type": "arithmeticLayout"</code> and list rows and cell boxes inside.
                </p>
                <CodeBlock code={CODE_EXAMPLES.grid} />
              </div>

              {/* Interactive Tool */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#34d399', fontWeight: 800 }}>Interactive Tool (interactiveTool)</h3>
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.5 }}>
                  Embeds interactive math manipulative applets (like number lines, base-ten block grids, fraction circle models, or analog clocks).
                </p>
                <CodeBlock code={CODE_EXAMPLES.interactive} />
              </div>
            </div>
          </section>

          {/* 3. Dynamic Option Pools */}
          <section id="dynamicpooling" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>🪄 3. Dynamic Option Pools</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 24, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Dynamic option pooling allows you to declare a placeholder array of objects. At generation time, a single scenario object is randomly picked, and all dot-notation property references are resolved dynamically.
              </p>
              
              <h4 style={{ color: '#818cf8', margin: '20px 0 8px' }}>Example JSON Array:</h4>
              <CodeBlock code={`[
  {"name": "boot", "estimate": 32, "correctUnit": "centimetres", "allowedUnits": ["metres", "centimetres"]},
  {"name": "pencil", "estimate": 15, "correctUnit": "centimetres", "allowedUnits": ["metres", "centimetres"]}
]`} />

              <h4 style={{ color: '#818cf8', margin: '20px 0 8px' }}>How to reference:</h4>
              <ul style={{ color: '#cbd5e1', paddingLeft: 20, fontSize: 14.5 }}>
                <li style={{ marginBottom: 8 }}><strong>Blueprint Reference</strong>: <code>Which is a better estimate for the height of a {"{= scenario.name =}"}?</code></li>
                <li style={{ marginBottom: 8 }}><strong>Dynamic Answer</strong>: <code>{"{= scenario.estimate =}"} {"{= scenario.correctUnit =}"}</code></li>
                <li style={{ marginBottom: 8 }}><strong>Dynamic Distractor</strong>: <code>{"{= scenario.estimate =}"} {"{= scenario.allowedUnits.find(u => u !== scenario.correctUnit) =}"}</code></li>
              </ul>
            </div>
          </section>

          {/* 4. Subject Contexts */}
          <section id="subjects" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>🏫 4. Subject Context Walkthroughs</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Math */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#38bdf8', fontWeight: 800 }}>📐 Math Context (Estimation & Lengths)</h3>
                <ol style={{ color: '#94a3b8', paddingLeft: 20, fontSize: 13.5, lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 4 }}>Define a measurement scenario pool with object names, sizes, and allowed units.</li>
                  <li style={{ marginBottom: 4 }}>Write blueprint: <code>Which is a better estimate for the height of a {"{{scenario.name}}"}?</code></li>
                  <li style={{ marginBottom: 4 }}>Configure choices with <code>{"{= scenario.estimate =}"}</code> and its dynamic correct/incorrect units.</li>
                </ol>
              </div>

              {/* English */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#f472b6', fontWeight: 800 }}>🔤 English Grammar Context (Word Sorting)</h3>
                <ol style={{ color: '#94a3b8', paddingLeft: 20, fontSize: 13.5, lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 4 }}>Declare placeholder nouns: <code>"apple, school, dog"</code> and verbs: <code>"run, write, sleep"</code>.</li>
                  <li style={{ marginBottom: 4 }}>Set the categorization bins labeled <code>Nouns</code> and <code>Verbs</code>.</li>
                  <li style={{ marginBottom: 4 }}>Write sorting instruction instructions: <code>"Sort these words into Nouns and Verbs."</code></li>
                </ol>
              </div>

              {/* Science */}
              <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#fbbf24', fontWeight: 800 }}>🧪 Science Context (Solar System Facts)</h3>
                <ol style={{ color: '#94a3b8', paddingLeft: 20, fontSize: 13.5, lineHeight: 1.6 }}>
                  <li style={{ marginBottom: 4 }}>Create facts database objects representing planets, positions, and temperatures.</li>
                  <li style={{ marginBottom: 4 }}>Write question prompt: <code>Which planet is the {"{{scenario.position}}"} planet from the Sun?</code></li>
                  <li style={{ marginBottom: 4 }}>Map correct choice option to <code>{"{= scenario.name =}"}</code>.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* 5. Auditing */}
          <section id="auditing" style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>🛡️ 5. Auditing & Verification</h2>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: 24, lineHeight: 1.6 }}>
              <p style={{ marginTop: 0, color: '#cbd5e1', fontSize: 14.5 }}>
                Ensure all your generators and template configuration evaluate without errors by executing the project audit:
              </p>
              <CodeBlock code={`npm run audit:generators`} lang="bash" />
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 0, marginTop: 12 }}>
                This iterates over all subjects, grades, and templates in the registry, resolving and validating key structures synchronously.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 24, textAlign: 'center',
            color: '#475569', fontSize: 12
          }}>
            WEXLS Content Creator Guide · KlassChamp
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
