'use client';

import React, { useState, useEffect } from 'react';

// Helper to clean raw HTML/SVG tags from option labels
function cleanLabelText(label) {
  if (!label) return '';
  let str = String(typeof label === 'object' ? (label.label || label.text || '') : label);
  // Remove <br/>, <rect.../>, <text...>, <g...>, </g> etc.
  str = str.replace(/<[^>]*>/g, '');
  // Remove leading option prefixes like "A.", "B.", "A: " if present
  str = str.replace(/^[A-D][\.\:\)\s]+/, '').trim();
  return str;
}

// Helper to extract SVG block and clean question text with safe type coercion
function parseQuestionContent(q) {
  let rawText = '';
  let svgCode = '';

  if (typeof q === 'string') {
    rawText = q;
  } else if (q && typeof q === 'object') {
    if (typeof q.questionText === 'string') rawText = q.questionText;
    else if (typeof q.question === 'string') rawText = q.question;
    else if (typeof q.text === 'string') rawText = q.text;
    else if (q.questionText && typeof q.questionText === 'object' && q.questionText.text) rawText = q.questionText.text;

    if (typeof q.svg === 'string') svgCode = q.svg;
    else if (typeof q.diagram === 'string') svgCode = q.diagram;
    else if (typeof q.image === 'string') svgCode = q.image;
  }

  // Force string coercion to avoid rawText.replace is not a function
  rawText = String(rawText || '');

  // If questionText contains embedded <svg>...</svg>, extract it
  if (rawText.includes('<svg')) {
    const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      if (!svgCode) svgCode = svgMatch[0];
      rawText = rawText.replace(/<svg[\s\S]*?<\/svg>/gi, '').trim();
    }
  }

  // Remove any remaining raw HTML tags from questionText
  rawText = rawText.replace(/<br\s*\/?>/gi, ' ').trim();

  return { cleanQuestionText: rawText, extractedSvg: svgCode };
}

// Helper component to safely render SVG markup or SVG diagrams with strict bounds
function SVGDiagramRenderer({ svgString, diagramType }) {
  if (diagramType === 'none') {
    return null;
  }

  const hasValidContent = svgString && 
    typeof svgString === 'string' && 
    svgString.includes('<svg') && 
    !svgString.includes('M1,135') && 
    !svgString.match(/<svg[^>]*>\s*<g>\s*<\/g>\s*<\/svg>/i) &&
    (svgString.includes('<path') || svgString.includes('<rect') || svgString.includes('<circle') || svgString.includes('<polygon') || svgString.includes('<line'));

  if (hasValidContent) {
    let cleanSvg = svgString;
    const match = svgString.match(/<svg[\s\S]*?<\/svg>/i);
    if (match) cleanSvg = match[0];

    // Constrain SVG sizing inline so it never distorts or overflows
    cleanSvg = cleanSvg.replace(/<svg/i, '<svg style="max-width: 100%; max-height: 180px; width: auto; height: auto; display: block; margin: 0 auto;"');

    return (
      <div 
        style={{
          padding: '16px',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid #334155',
          marginBottom: '16px',
          maxHeight: '200px',
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }}
      />
    );
  }

  // Built-in Crisp SVG Component Renderer based on selected type
  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '1px solid #334155',
      marginBottom: '16px'
    }}>
      {renderFallbackSVG(diagramType)}
    </div>
  );
}

function renderFallbackSVG(type) {
  switch (type) {
    case 'fraction-circle':
      return (
        <svg width="140" height="140" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#38bdf8" opacity="0.3" stroke="#38bdf8" strokeWidth="2" />
          <path d="M 50 50 L 50 5 A 45 45 0 0 1 95 50 Z" fill="#818cf8" stroke="#38bdf8" strokeWidth="2" />
          <path d="M 50 50 L 95 50 A 45 45 0 0 1 50 95 Z" fill="#c084fc" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#f8fafc" strokeWidth="3" />
        </svg>
      );
    case 'fraction-strip':
      return (
        <svg width="260" height="60" viewBox="0 0 260 60">
          <rect x="5" y="10" width="250" height="40" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <rect x="5" y="10" width="62.5" height="40" fill="#818cf8" />
          <rect x="67.5" y="10" width="62.5" height="40" fill="#c084fc" />
          <line x1="67.5" y1="10" x2="67.5" y2="50" stroke="#f8fafc" strokeWidth="2" />
          <line x1="130" y1="10" x2="130" y2="50" stroke="#f8fafc" strokeWidth="2" />
          <line x1="192.5" y1="10" x2="192.5" y2="50" stroke="#f8fafc" strokeWidth="2" />
        </svg>
      );
    case 'number-line':
      return (
        <svg width="260" height="60" viewBox="0 0 260 60">
          <line x1="20" y1="30" x2="240" y2="30" stroke="#38bdf8" strokeWidth="3" />
          <polygon points="10,30 20,24 20,36" fill="#38bdf8" />
          <polygon points="250,30 240,24 240,36" fill="#38bdf8" />
          {[30, 80, 130, 180, 230].map((x, i) => (
            <g key={i}>
              <line x1={x} y1="20" x2={x} y2="40" stroke="#f8fafc" strokeWidth="2" />
              <text x={x} y="55" fill="#cbd5e1" fontSize="12" textAnchor="middle">{i}</text>
            </g>
          ))}
          <circle cx="130" cy="30" r="6" fill="#f43f5e" />
        </svg>
      );
    case 'place-value-blocks':
      return (
        <svg width="280" height="95" viewBox="0 0 280 95">
          {/* Thousands Cube */}
          <g transform="translate(10, 10)">
            <rect x="0" y="15" width="45" height="45" fill="#818cf8" stroke="#f8fafc" strokeWidth="1.5"/>
            <polygon points="0,15 15,0 60,0 45,15" fill="#a78bfa" stroke="#f8fafc" strokeWidth="1.5"/>
            <polygon points="45,15 60,0 60,45 45,60" fill="#6366f1" stroke="#f8fafc" strokeWidth="1.5"/>
            <text x="25" y="78" fill="#cbd5e1" fontSize="11" textAnchor="middle" fontWeight="700">1000s</text>
          </g>
          {/* Hundreds Flat */}
          <g transform="translate(95, 20)">
            <rect x="0" y="0" width="45" height="45" fill="#38bdf8" stroke="#f8fafc" strokeWidth="1.5"/>
            {[1,2,3].map(i => (
              <line key={i} x1={i * 11.25} y1="0" x2={i * 11.25} y2="45" stroke="#0f172a" strokeWidth="1"/>
            ))}
            {[1,2,3].map(i => (
              <line key={i} x1="0" y1={i * 11.25} x2="45" y2={i * 11.25} stroke="#0f172a" strokeWidth="1"/>
            ))}
            <text x="22.5" y="68" fill="#cbd5e1" fontSize="11" textAnchor="middle" fontWeight="700">100s</text>
          </g>
          {/* Tens Rod */}
          <g transform="translate(165, 20)">
            <rect x="0" y="0" width="12" height="45" fill="#34d399" stroke="#f8fafc" strokeWidth="1.5"/>
            {[1,2,3].map(i => (
              <line key={i} x1="0" y1={i * 11.25} x2="12" y2={i * 11.25} stroke="#0f172a" strokeWidth="1"/>
            ))}
            <text x="6" y="68" fill="#cbd5e1" fontSize="11" textAnchor="middle" fontWeight="700">10s</text>
          </g>
          {/* Ones Unit */}
          <g transform="translate(215, 38)">
            <rect x="0" y="0" width="14" height="14" fill="#fbbf24" stroke="#f8fafc" strokeWidth="1.5"/>
            <text x="7" y="32" fill="#cbd5e1" fontSize="11" textAnchor="middle" fontWeight="700">1s</text>
          </g>
        </svg>
      );
    case 'clock-face':
      return (
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
          <line x1="50" y1="50" x2="50" y2="20" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="50" x2="75" y2="50" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4" fill="#38bdf8" />
        </svg>
      );
    case 'percentage-grid':
      return (
        <svg width="120" height="120" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          {Array.from({ length: 100 }).map((_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const isFilled = i < 45;
            return (
              <rect
                key={i}
                x={col * 10}
                y={row * 10}
                width="9"
                height="9"
                fill={isFilled ? '#818cf8' : '#1e293b'}
                rx="1"
              />
            );
          })}
        </svg>
      );
    case 'geometry-shape':
      return (
        <svg width="150" height="100" viewBox="0 0 150 100">
          <polygon points="20,80 75,20 130,80" fill="#818cf8" opacity="0.4" stroke="#818cf8" strokeWidth="2.5" />
          <text x="75" y="94" fill="#cbd5e1" fontSize="12" textAnchor="middle">b = 10 cm</text>
          <line x1="75" y1="20" x2="75" y2="80" stroke="#fbbf24" strokeDasharray="3,3" strokeWidth="1.5" />
          <text x="82" y="55" fill="#fbbf24" fontSize="11">h = 8 cm</text>
        </svg>
      );
    case 'bar-comparison':
      return (
        <svg width="200" height="100" viewBox="0 0 200 100">
          <line x1="30" y1="80" x2="180" y2="80" stroke="#475569" strokeWidth="2"/>
          <line x1="30" y1="10" x2="30" y2="80" stroke="#475569" strokeWidth="2"/>
          <rect x="50" y="40" width="35" height="40" fill="#38bdf8" rx="4"/>
          <text x="67.5" y="95" fill="#cbd5e1" fontSize="11" textAnchor="middle">CP ($50)</text>
          <rect x="110" y="20" width="35" height="60" fill="#34d399" rx="4"/>
          <text x="127.5" y="95" fill="#cbd5e1" fontSize="11" textAnchor="middle">SP ($75)</text>
        </svg>
      );
    case 'arithmetic-visual':
      return (
        <svg width="220" height="80" viewBox="0 0 220 80">
          {[0, 1, 2].map(group => (
            <g key={group} transform={`translate(${group * 70 + 10}, 10)`}>
              <rect x="0" y="0" width="60" height="55" rx="8" fill="#1e293b" stroke="#818cf8" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="8" fill="#f43f5e"/>
              <circle cx="40" cy="20" r="8" fill="#f43f5e"/>
              <circle cx="20" cy="38" r="8" fill="#f43f5e"/>
              <circle cx="40" cy="38" r="8" fill="#f43f5e"/>
            </g>
          ))}
          <text x="110" y="75" fill="#cbd5e1" fontSize="12" textAnchor="middle">3 groups of 4 = 12</text>
        </svg>
      );
    default:
      return (
        <svg width="120" height="100" viewBox="0 0 120 100">
          <rect x="10" y="10" width="100" height="80" rx="8" fill="#1e293b" stroke="#818cf8" strokeWidth="2" />
          <circle cx="45" cy="50" r="20" fill="#c084fc" opacity="0.8" />
          <rect x="65" y="35" width="30" height="30" fill="#38bdf8" opacity="0.8" rx="4" />
        </svg>
      );
  }
}

export default function LocalAIGeneratorPage() {
  const [prompt, setPrompt] = useState('Generate 2 fraction circle (pie) visual math questions with SVG diagram code, 4 MCQ options, and explanation.');
  const [format, setFormat] = useState('json');
  const [diagramType, setDiagramType] = useState('fraction-circle');
  const [engine, setEngine] = useState('ollama'); // 'ollama' or 'gemini'
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'code'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('checking');
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    fetch('/api/local-ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'ping', format: 'text' })
    })
      .then(res => res.ok ? setStatus('ready') : setStatus('error'))
      .catch(() => setStatus('error'));
  }, []);

  const handleDiagramTypeChange = (e) => {
    const type = e.target.value;
    setDiagramType(type);
    
    if (type === 'none') {
      setPrompt('Generate 3 text-only questions (Science/Math/General). Return a JSON array of objects with keys: questionText, options (array of {label, isCorrect}), and explanation.');
      setFormat('json');
      return;
    }

    const typeLabels = {
      'fraction-circle': 'Fraction Circle (Pie)',
      'fraction-strip': 'Fraction Strip (Bar)',
      'number-line': 'Number Line Segment',
      'place-value-blocks': 'Place Value Unit Blocks',
      'geometry-shape': 'Geometry Shape (2D/3D)',
      'percentage-grid': 'Percentage Grid (10x10)',
      'clock-face': 'Analog Clock Face',
      'bar-comparison': 'Bar Comparison (CP vs. SP)',
      'arithmetic-visual': 'Arithmetic Visual Groups'
    };

    setPrompt(`Generate 2 visual math questions using a ${typeLabels[type]} diagram. Return a JSON array of objects with keys: questionText, svg (clean horizontal inline SVG with viewBox '0 0 300 100'), options (array of {label, isCorrect}), and explanation.`);
    setFormat('json');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAnswers({});

    try {
      const res = await fetch('/api/local-ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, format, model: 'qwen2.5-coder:7b', engine })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract question list array for Live Preview
  const getQuestionsList = () => {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (typeof result === 'object') {
      if (Array.isArray(result.questions)) return result.questions;
      if (Array.isArray(result.question)) return result.question;
      if (Array.isArray(result.items)) return result.items;
      if (Array.isArray(result.data)) return result.data;
      if (Array.isArray(result.results)) return result.results;
      if (Array.isArray(result.output)) return result.output;
      return [result];
    }
    return [];
  };

  const questionsList = getQuestionsList();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1e293b'
        }}>
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <a href="/local-ai" style={{ color: '#38bdf8', fontWeight: '700', textDecoration: 'none', fontSize: '13px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid #38bdf8' }}>
                ⚡ AI Question Generator
              </a>
              <a href="/pdf-analyzer" style={{ color: '#94a3b8', fontWeight: '600', textDecoration: 'none', fontSize: '13px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px' }}>
                📄 PDF Extractor & AI Summarizer
              </a>
              <a href="/pdf-spreadsheet" style={{ color: '#94a3b8', fontWeight: '600', textDecoration: 'none', fontSize: '13px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '6px' }}>
                📊 PDF to Spreadsheet (Excel)
              </a>
            </div>
            <h1 style={{
              margin: '0 0 6px 0',
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ⚡ Hybrid AI Question & Visual Diagram Generator
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
              Switch seamlessly between Local Ollama AI (Private) & Gemini Cloud AI (High Precision)
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: status === 'ready' ? '#064e3b' : status === 'checking' ? '#1e293b' : '#7f1d1d',
            color: status === 'ready' ? '#6ee7b7' : status === 'checking' ? '#cbd5e1' : '#fca5a5',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status === 'ready' ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }} />
            {status === 'ready' ? 'Ollama Active (http://localhost:11434)' : status === 'checking' ? 'Checking Ollama...' : 'Ollama Offline'}
          </div>
        </div>

        {/* Controls Container */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
        }}>

          {/* AI Engine Selector Switch */}
          <div style={{
            backgroundColor: '#0f172a',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                🤖 CHOOSE AI ENGINE:
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {engine === 'gemini' 
                  ? '☁️ Gemini 2.5 Flash Cloud AI (Highest Accuracy, Best Diagrams)'
                  : '⚡ Local Ollama AI - qwen2.5-coder:7b (100% Free & Private on Mac)'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setEngine('ollama')}
                style={{
                  backgroundColor: engine === 'ollama' ? '#38bdf8' : 'transparent',
                  color: engine === 'ollama' ? '#0f172a' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⚡ Local Ollama AI
              </button>

              <button
                type="button"
                onClick={() => setEngine('gemini')}
                style={{
                  backgroundColor: engine === 'gemini' ? '#818cf8' : 'transparent',
                  color: engine === 'gemini' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ☁️ Gemini Cloud AI
              </button>
            </div>
          </div>

          {/* Diagram Type Selector Dropdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.5px' }}>
                🎨 DIAGRAM TYPE:
              </label>
              <select
                value={diagramType}
                onChange={handleDiagramTypeChange}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1.5px solid #818cf8',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="none">🚫 None (Text-only / No Diagram)</option>
                <option value="fraction-circle">🍕 Fraction Circle (Pie)</option>
                <option value="fraction-strip">📊 Fraction Strip (Bar)</option>
                <option value="number-line">📏 Number Line Segment</option>
                <option value="place-value-blocks">🧊 Place Value Unit Blocks</option>
                <option value="geometry-shape">📐 Geometry Shape (2D/3D)</option>
                <option value="percentage-grid">⬛ Percentage Grid (10x10)</option>
                <option value="clock-face">🕒 Analog Clock Face</option>
                <option value="bar-comparison">📈 Bar Comparison (CP vs. SP)</option>
                <option value="arithmetic-visual">🔢 Arithmetic Visual Groups</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>
                ⚙️ OUTPUT FORMAT:
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="json">Structured JSON (With SVG & MCQ Options)</option>
                <option value="text">Plain Text (Markdown Questions & Explanation)</option>
              </select>
            </div>
          </div>

          {/* Prompt Area */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>
              PROMPT INSTRUCTIONS:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#475569' : engine === 'gemini' ? '#818cf8' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Generating Content with {engine === 'gemini' ? 'Gemini Cloud AI' : 'Local Ollama AI'}...
              </>
            ) : (
              `⚡ Generate Question with ${engine === 'gemini' ? 'Gemini Cloud AI' : 'Local Ollama AI'}`
            )}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#450a0a',
            border: '1px solid #991b1b',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Output Section with Preview & Code Tabs */}
        {result && (
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
          }}>

            {/* Tab Header & Copy Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #334155'
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('preview')}
                  style={{
                    backgroundColor: activeTab === 'preview' ? '#818cf8' : '#0f172a',
                    color: activeTab === 'preview' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  🎨 Live Interactive Preview
                </button>

                <button
                  onClick={() => setActiveTab('code')}
                  style={{
                    backgroundColor: activeTab === 'code' ? '#818cf8' : '#0f172a',
                    color: activeTab === 'code' ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  💻 Raw JSON / Code
                </button>
              </div>

              <button
                onClick={handleCopy}
                style={{
                  backgroundColor: copied ? '#059669' : '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Output'}
              </button>
            </div>

            {/* TAB 1: LIVE INTERACTIVE PREVIEW */}
            {activeTab === 'preview' && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '18px' }}>
                  📝 Student Question Card Preview
                </h3>

                {questionsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {questionsList.map((q, qIdx) => {
                      const options = (q && typeof q === 'object') ? (q.options || q.choices || []) : [];
                      const { cleanQuestionText, extractedSvg } = parseQuestionContent(q);

                      return (
                        <div
                          key={qIdx}
                          style={{
                            backgroundColor: '#0f172a',
                            borderRadius: '14px',
                            padding: '24px',
                            border: '1.5px solid #334155',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', marginBottom: '12px' }}>
                            QUESTION #{qIdx + 1}
                          </div>

                          {/* SVG Diagram Rendering with constrained viewBox & sizing */}
                          <SVGDiagramRenderer svgString={extractedSvg} diagramType={diagramType} />

                          {/* Question Text */}
                          <h4 style={{ margin: '0 0 20px 0', fontSize: '17px', lineHeight: '1.5', color: '#f8fafc' }}>
                            {cleanQuestionText || 'How many parts are represented in the diagram above?'}
                          </h4>

                          {/* Options Grid */}
                          {options.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                              {options.map((opt, optIdx) => {
                                const cleanOptText = cleanLabelText(opt);
                                const isCorrect = typeof opt === 'object' ? opt.isCorrect : (q.correctAnswerIndex === optIdx || q.answer === optIdx);
                                const isSelected = selectedAnswers[qIdx] === optIdx;

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                    style={{
                                      backgroundColor: isSelected 
                                        ? (isCorrect ? '#065f46' : '#991b1b') 
                                        : '#1e293b',
                                      color: '#ffffff',
                                      border: isSelected 
                                        ? (isCorrect ? '2px solid #10b981' : '2px solid #ef4444')
                                        : '1px solid #334155',
                                      borderRadius: '10px',
                                      padding: '14px',
                                      fontSize: '15px',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontWeight: isSelected ? '700' : '500',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <span style={{
                                      display: 'inline-block',
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      backgroundColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : '#334155',
                                      color: '#ffffff',
                                      textAlign: 'center',
                                      lineHeight: '24px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      marginRight: '12px',
                                      flexShrink: 0
                                    }}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{cleanOptText}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Explanation Box */}
                          {q && q.explanation && (
                            <div style={{
                              backgroundColor: '#1e293b',
                              borderLeft: '4px solid #818cf8',
                              padding: '14px 16px',
                              borderRadius: '0 8px 8px 0',
                              fontSize: '14px',
                              color: '#cbd5e1'
                            }}>
                              <strong style={{ color: '#818cf8' }}>💡 Explanation: </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#0f172a',
                    padding: '24px',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RAW CODE / JSON */}
            {activeTab === 'code' && (
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                padding: '20px',
                borderRadius: '12px',
                overflowX: 'auto',
                fontSize: '14px',
                fontFamily: 'monospace',
                margin: 0,
                border: '1px solid #334155',
                maxHeight: '500px'
              }}>
                {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
              </pre>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
