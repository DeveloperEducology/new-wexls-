'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import MermaidRenderer from '@/components/MermaidRenderer';

export default function TestLessonPage() {
  const [topic, setTopic] = useState('Writing Linear Equations from Scenarios');
  const [tone, setTone] = useState('teacher');
  const [mode, setMode] = useState('worksheet');
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [hideHeader, setHideHeader] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | { slug, url } | 'error'
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [usage, setUsage] = useState(null); // { promptTokens, candidatesTokens, totalTokens }
  const [format, setFormat] = useState('guided');
  const [activeSections, setActiveSections] = useState({
    keyConcept: true,
    howToIdentify: true,
    workedExample: true,
    checkYourUnderstanding: true,
    guidedPractice: true,
    independentPractice: true,
    extensionChallenge: true,
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  // Custom Prompt Generator
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [customInputJson, setCustomInputJson] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customResult, setCustomResult] = useState(null); // { isJson, result }
  const [customError, setCustomError] = useState('');
  const [customUsage, setCustomUsage] = useState(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/raw-generations');
      const data = await res.json();
      if (data.success) {
        setHistory(data.generations || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const loadHistoryItem = (item) => {
    if (!item || !item.worksheetJson) return;
    setWorksheet(item.worksheetJson);
    setTopic(item.topic || '');
    setTone(item.tone || 'teacher');
    setFormat(item.format || 'guided');
    if (item.activeSections) {
      setActiveSections(item.activeSections);
    } else {
      setActiveSections({
        keyConcept: true,
        howToIdentify: true,
        workedExample: true,
        checkYourUnderstanding: true,
        guidedPractice: true,
        independentPractice: true,
        extensionChallenge: true,
      });
    }
    setCustomInstructions(item.customInstructions || '');
    setTitle(item.worksheetJson.title || item.topic || '');
    setUsage(item.usage || null);
    setSaveStatus(null);
    setError('');
  };

  const calculateCostInINR = (inputTokens, outputTokens) => {
    const usdInputRate = 0.075 / 1000000;
    const usdOutputRate = 0.30 / 1000000;
    const usdToInr = 83.5;
    const costUsd = (inputTokens * usdInputRate) + (outputTokens * usdOutputRate);
    return costUsd * usdToInr;
  };

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    if (newFormat === 'guided') {
      setActiveSections({
        keyConcept: true,
        howToIdentify: true,
        workedExample: true,
        checkYourUnderstanding: true,
        guidedPractice: true,
        independentPractice: true,
        extensionChallenge: true,
      });
    } else if (newFormat === 'homework') {
      setActiveSections({
        keyConcept: false,
        howToIdentify: false,
        workedExample: false,
        checkYourUnderstanding: false,
        guidedPractice: false,
        independentPractice: true,
        extensionChallenge: true,
      });
    } else if (newFormat === 'study_guide') {
      setActiveSections({
        keyConcept: true,
        howToIdentify: true,
        workedExample: true,
        checkYourUnderstanding: false,
        guidedPractice: true,
        independentPractice: true,
        extensionChallenge: true,
      });
    } else if (newFormat === 'quiz') {
      setActiveSections({
        keyConcept: false,
        howToIdentify: false,
        workedExample: false,
        checkYourUnderstanding: false,
        guidedPractice: false,
        independentPractice: true,
        extensionChallenge: false,
      });
    }
  };

  const handleLoadJson = () => {
    setJsonError('');
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      setJsonError('Please paste worksheet JSON first.');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      setWorksheet(parsed);
      setTitle(parsed.title || '');
      setUsage(null);
      setSaveStatus(null);
      setError('');
      setJsonInput('');
    } catch (e) {
      setJsonError('Invalid JSON: ' + e.message);
    }
  };

  const handleCustomGenerate = async () => {
    setCustomError('');
    setCustomResult(null);
    if (!customSystemPrompt.trim()) {
      setCustomError('Please enter a system prompt.');
      return;
    }
    if (customInputJson.trim()) {
      try { JSON.parse(customInputJson); } catch (e) {
        setCustomError('Input JSON is invalid: ' + e.message);
        return;
      }
    }
    setCustomLoading(true);
    try {
      const res = await fetch('/api/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: customSystemPrompt, inputJson: customInputJson }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomResult({ isJson: data.isJson, result: data.result });
        setCustomUsage(data.usage || null);
        // If the result is a worksheet-compatible JSON, offer to load it
      } else {
        setCustomError(data.error || 'Generation failed.');
      }
    } catch (err) {
      setCustomError('Network error: ' + err.message);
    } finally {
      setCustomLoading(false);
    }
  };

  const handleLoadCustomAsWorksheet = () => {
    if (!customResult?.isJson) return;
    setWorksheet(customResult.result);
    setTitle(customResult.result.title || 'Custom Worksheet');
    setUsage(customUsage);
    setSaveStatus(null);
    setError('');
  };

  const handleCopyCustomResult = () => {
    if (!customResult) return;
    const text = customResult.isJson
      ? JSON.stringify(customResult.result, null, 2)
      : String(customResult.result);
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, format, activeSections, customInstructions }),
      });
      const data = await res.json();
      if (data.success) {
        setWorksheet(data.worksheet);
        setTitle(data.worksheet.title || topic);
        setUsage(data.usage || null);
        fetchHistory();
      } else {
        setError(data.error || 'Failed to generate worksheet.');
      }
    } catch (err) {
      setError('An error occurred. Please make sure the server is running and the Gemini API key is configured.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!worksheet) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/lessons/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, worksheetJson: worksheet, title }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ slug: data.slug, url: data.lessonUrl });
      } else {
        setSaveStatus('error');
        setError(data.error || 'Failed to save lesson.');
      }
    } catch (err) {
      setSaveStatus('error');
      setError('Could not save — check your MONGODB_URI config.');
    }
  };

  const handleCopyJson = () => {
    if (!worksheet) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(worksheet, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Could not copy JSON to clipboard.');
    }
  };

  const renderMathAndText = (text) => {
    if (!text) return '';
    
    // First, split by block math $$
    const blocks = text.split(/\$\$(.*?)\$\$/gs);
    
    return blocks.map((block, idx) => {
      if (idx % 2 === 1) {
        try {
          const html = katex.renderToString(block, { displayMode: true, throwOnError: false });
          return <div key={`block-${idx}`} dangerouslySetInnerHTML={{ __html: html }} className="katex-block-wrapper" />;
        } catch (e) {
          return <div key={`block-${idx}`} className="katex-error">{block}</div>;
        }
      }
      
      // Upgrade backticks containing math syntax to inline math
      const normalizedBlock = block.replace(/`([^`]*?[\\_^][^`]*?)`/g, '$$1$');
      
      const renderedSegments = [];
      let lastIndex = 0;
      
      // Matches inline math while ignoring currency tags (like $500)
      const inlineMathRegex = /\$(?!\s)([^\$\n]{1,100}?)(?<!\s)\$/g;
      let match;
      
      while ((match = inlineMathRegex.exec(normalizedBlock)) !== null) {
        const formula = match[1];
        
        // Skip if it's just a number (currency)
        if (/^\d+[\d,.]*$/.test(formula)) {
          continue;
        }
        
        // Push preceding plain text
        if (match.index > lastIndex) {
          renderedSegments.push(normalizedBlock.substring(lastIndex, match.index));
        }
        
        // Push rendered math
        try {
          const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
          renderedSegments.push(
            <span 
              key={`inline-${match.index}`} 
              dangerouslySetInnerHTML={{ __html: html }} 
              className="katex-inline-wrapper" 
              style={{ fontStyle: 'normal' }} 
            />
          );
        } catch (e) {
          renderedSegments.push(match[0]);
        }
        
        lastIndex = inlineMathRegex.lastIndex;
      }
      
      // Push remaining text
      if (lastIndex < normalizedBlock.length) {
        renderedSegments.push(normalizedBlock.substring(lastIndex));
      }
      
      // Render segments with inline code logic
      return (
        <span key={`text-${idx}`}>
          {renderedSegments.map((seg, sIdx) => {
            if (typeof seg === 'string') {
              const parts = seg.split(/`([^`]+)`/g);
              return parts.map((part, pIdx) => {
                if (pIdx % 2 === 1) {
                  return <code key={`code-${sIdx}-${pIdx}`}>{part}</code>;
                }
                return part;
              });
            }
            return seg;
          })}
        </span>
      );
    });
  };

  const cleanQuestionText = (text) => {
    return text.replace(/^\d+[\s.)-]+\s*/, '');
  };

  const renderQuestionText = (question, idx) => {
    const cleaned = cleanQuestionText(question);
    if (mode !== 'lesson' || !worksheet?.checkYourUnderstanding?.answers) {
      return renderMathAndText(cleaned);
    }
    const answer = worksheet.checkYourUnderstanding.answers[idx];
    if (!answer) return renderMathAndText(cleaned);

    const answerParts = answer.split(',').map(s => s.trim());
    const blankRegex = /_{3,}/g;
    const parts = cleaned.split(blankRegex);

    if (parts.length > 1) {
      const rendered = [];
      for (let i = 0; i < parts.length; i++) {
        rendered.push(<span key={`text-${i}`}>{renderMathAndText(parts[i])}</span>);
        if (i < parts.length - 1) {
          const partAnswer = answerParts[i] || answerParts[0] || '';
          rendered.push(
            <span key={`ans-${i}`} className="filled-blank">
              {renderMathAndText(partAnswer)}
            </span>
          );
        }
      }
      return <>{rendered}</>;
    }
    return (
      <>
        {renderMathAndText(cleaned)} <span className="filled-blank-inline">({renderMathAndText(answer)})</span>
      </>
    );
  };

  return (
    <div className="test-lesson-container">
      {hideHeader && (
        <button
          type="button"
          onClick={() => setHideHeader(false)}
          className="floating-show-controls no-print"
          title="Show control panel"
        >
          ⚙️ Show Controls
        </button>
      )}
      {/* ── STICKY CONTROL HEADER (HIDDEN IN PRINT) ── */}
      <header className={`control-header no-print ${hideHeader ? 'header-hidden' : ''}`}>
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/grades" className="back-link">
              ‹ All Grades
            </Link>
            <Link href="/blog-generator" className="back-link" style={{ color: '#7c3aed' }}>
              📝 Blog Generator
            </Link>
          </div>

          {usage && (
            <div className="usage-stats-badge">
              <span className="usage-icon">⚡</span>
              <span>Tokens: <strong>{usage.totalTokens.toLocaleString()}</strong> <span className="usage-breakdown">(In: {usage.promptTokens.toLocaleString()} | Out: {usage.candidatesTokens.toLocaleString()})</span></span>
              <span className="usage-divider">·</span>
              <span>Cost: <strong className="usage-cost">₹{calculateCostInINR(usage.promptTokens, usage.candidatesTokens).toFixed(4)}</strong></span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className={`toggle-sidebar-btn ${showSidebar ? 'active' : ''}`}
              title="Toggle history sidebar"
            >
              📁 History {history.length > 0 && <span className="history-count-badge">{history.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setHideHeader(true)}
              className="toggle-header-action"
              title="Hide control panel"
            >
              🙈 Hide Controls
            </button>
            <span className="badge">Teacher Tools</span>
          </div>
        </div>
        
        <div className="controls-row">
          <div className="input-group">
            <label htmlFor="topic-input">Worksheet Topic:</label>
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Writing Linear Equations from Scenarios"
            />
          </div>

          <div className="input-group shrink">
            <label htmlFor="tone-input">Worksheet Tone:</label>
            <select
              id="tone-input"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="tone-select"
            >
              <option value="teacher">Teacher (Standard Classroom)</option>
              <option value="tutor">Friendly 1-on-1 Tutor</option>
              <option value="eli5">Explain Like I'm 5 (ELI5)</option>
              <option value="storyteller">Storyteller (Adventure/Narrative)</option>
            </select>
          </div>

          <div className="input-group shrink">
            <label htmlFor="mode-input">Document Mode:</label>
            <select
              id="mode-input"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="mode-select"
            >
              <option value="worksheet">Student Worksheet (Blank Lines)</option>
              <option value="lesson">Teacher Explaining Guide (Answers Filled)</option>
            </select>
          </div>

          <div className="actions-group">
            <button 
              onClick={handleGenerate} 
              disabled={loading || !topic.trim()}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Generating...
                </>
              ) : (
                '✨ Generate with Gemini'
              )}
            </button>

            <button 
              onClick={handleSave}
              disabled={loading || !worksheet || saveStatus === 'saving'}
              className="save-btn"
            >
              {saveStatus === 'saving' ? (
                <><span className="spinner save-spinner"></span> Saving…</>
              ) : saveStatus?.slug ? (
                '✅ Saved!'
              ) : (
                '💾 Save to Library'
              )}
            </button>

            <button
              onClick={handleCopyJson}
              disabled={loading || !worksheet}
              className="copy-json-btn"
            >
              {copied ? '📋 Copied!' : '📦 Copy JSON'}
            </button>

            <button 
              onClick={handlePrint} 
              disabled={loading || !worksheet}
              className="print-btn"
            >
              🖨️ Print Handout
            </button>
          </div>
        </div>

        <div className="advanced-toggle-row">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="advanced-toggle-btn"
          >
            {showAdvanced ? '🔼 Hide Layout Customization Settings' : '⚙️ Show Layout Customization Settings'}
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-settings-panel">
            <div className="advanced-grid">
              
              <div className="advanced-col format-col">
                <label className="panel-label">Document Preset Format:</label>
                <select 
                  value={format} 
                  onChange={(e) => handleFormatChange(e.target.value)}
                  className="preset-select"
                >
                  <option value="guided">Guided Notes & Practice Worksheet (Full)</option>
                  <option value="homework">Homework / Practice Sheet Only</option>
                  <option value="study_guide">Study Guide / Reference Sheet</option>
                  <option value="quiz">Short Quiz / Assessment</option>
                </select>
                <p className="panel-hint">Selecting a preset adjusts the active sections below automatically.</p>
              </div>

              <div className="advanced-col sections-col">
                <label className="panel-label">Included Document Sections:</label>
                <div className="checkboxes-grid">
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.keyConcept}
                      onChange={(e) => setActiveSections({...activeSections, keyConcept: e.target.checked})}
                    />
                    Key Concept explanation
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.howToIdentify}
                      onChange={(e) => setActiveSections({...activeSections, howToIdentify: e.target.checked})}
                    />
                    How to Identify keywords
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.workedExample}
                      onChange={(e) => setActiveSections({...activeSections, workedExample: e.target.checked})}
                    />
                    Worked Example walkthrough
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.checkYourUnderstanding}
                      onChange={(e) => setActiveSections({...activeSections, checkYourUnderstanding: e.target.checked})}
                    />
                    Check Your Understanding
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.guidedPractice}
                      onChange={(e) => setActiveSections({...activeSections, guidedPractice: e.target.checked})}
                    />
                    Guided Practice scenarios
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.independentPractice}
                      onChange={(e) => setActiveSections({...activeSections, independentPractice: e.target.checked})}
                    />
                    Independent Practice scenarios
                  </label>
                  <label className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={activeSections.extensionChallenge}
                      onChange={(e) => setActiveSections({...activeSections, extensionChallenge: e.target.checked})}
                    />
                    Extension Challenge problem
                  </label>
                </div>
              </div>
            </div>

            <div className="custom-prompt-container">
              <label className="panel-label">Custom Layout & Style Prompt (Optional):</label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. 'Use space-themed linear scenarios only', 'Make sure there are exactly 5 worked steps', 'Make explanation extremely concise'"
                rows={2}
                className="custom-instructions-textarea"
              />
            </div>

            {/* ── JSON PASTE LOADER ── */}
            <div className="json-input-container">
              <label className="panel-label">📋 Paste Raw Worksheet JSON to Load Directly:</label>
              <textarea
                id="json-input-textarea"
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(''); }}
                placeholder={'{ "title": "My Worksheet", "keyConcept": { ... }, ... }'}
                rows={4}
                className="json-input-textarea"
                spellCheck={false}
              />
              {jsonError && <div className="json-error-msg">⚠️ {jsonError}</div>}
              <button
                type="button"
                onClick={handleLoadJson}
                disabled={!jsonInput.trim()}
                className="load-json-btn"
              >
                📥 Load JSON as Worksheet
              </button>
            </div>
          </div>
        )}

        {/* ── CUSTOM PROMPT GENERATOR (always visible toggle below advanced) ── */}
        <div className="custom-gen-section no-print">
          <button
            type="button"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="custom-gen-toggle-btn"
          >
            {showCustomPrompt ? '🔼 Hide Custom Prompt Generator' : '🤖 Custom Prompt Generator (Blog, Quiz, etc.)'}
          </button>

          {showCustomPrompt && (
            <div className="custom-gen-panel">
              <p className="custom-gen-hint">
                Paste any system prompt below and optionally an input JSON. Gemini will return JSON (or text) which you can copy or load as a worksheet.
              </p>

              <div className="custom-gen-grid">
                <div className="custom-gen-col">
                  <label className="panel-label">📝 System Prompt / Instructions:</label>
                  <textarea
                    id="custom-system-prompt"
                    value={customSystemPrompt}
                    onChange={(e) => { setCustomSystemPrompt(e.target.value); setCustomError(''); }}
                    placeholder={`You are an expert content creator. Return ONLY a raw JSON object.\n\nExpected output:\n{\n  "headline": "...",\n  "problemDescription": "...",\n  "attentionGrabber": "..."\n}`}
                    rows={10}
                    className="json-input-textarea system-prompt-textarea"
                    spellCheck={false}
                  />
                </div>

                <div className="custom-gen-col">
                  <label className="panel-label">📦 Input Params JSON (Optional):</label>
                  <textarea
                    id="custom-input-json"
                    value={customInputJson}
                    onChange={(e) => { setCustomInputJson(e.target.value); setCustomError(''); }}
                    placeholder={'{\n  "examName": "JNVST 2026",\n  "subject": "Mathematics",\n  "concept": "Fractions",\n  "shortcutDetails": "Cross-multiplication butterfly method"\n}'}
                    rows={10}
                    className="json-input-textarea"
                    spellCheck={false}
                  />
                </div>
              </div>

              {customError && <div className="json-error-msg">⚠️ {customError}</div>}

              <div className="custom-gen-actions">
                <button
                  type="button"
                  onClick={handleCustomGenerate}
                  disabled={customLoading || !customSystemPrompt.trim()}
                  className="generate-btn"
                >
                  {customLoading ? <><span className="spinner"></span> Generating…</> : '✨ Generate with Gemini'}
                </button>
                {customResult && (
                  <>
                    <button type="button" onClick={handleCopyCustomResult} className="copy-json-btn">
                      📋 Copy Result
                    </button>
                    {customResult.isJson && (
                      <button type="button" onClick={handleLoadCustomAsWorksheet} className="load-json-btn">
                        📥 Load as Worksheet
                      </button>
                    )}
                  </>
                )}
                {customUsage && (
                  <span className="usage-stats-badge" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                    ⚡ {customUsage.totalTokens?.toLocaleString()} tokens
                  </span>
                )}
              </div>

              {customResult && (
                <div className="custom-gen-result">
                  <div className="custom-gen-result-header">
                    <span>{customResult.isJson ? '✅ JSON Output' : '📄 Text Output'}</span>
                  </div>
                  {customResult.isJson ? (
                    <div className="custom-gen-result-cards">
                      {Object.entries(customResult.result).map(([key, value]) => (
                        <div key={key} className="custom-result-card">
                          <div className="custom-result-key">{key}</div>
                          <div className="custom-result-value">
                            {typeof value === 'object'
                              ? <pre className="custom-result-pre">{JSON.stringify(value, null, 2)}</pre>
                              : <p>{String(value)}</p>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="custom-result-raw">{String(customResult.result)}</pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Saved lesson link */}
        {saveStatus?.url && (
          <div className="saved-banner no-print">
            ✅ Lesson saved! View public page →{' '}
            <a href={saveStatus.url} target="_blank" rel="noreferrer" className="saved-link">
              /lessons/{saveStatus.slug}
            </a>
            <span className="saved-modes-hint">
              &nbsp;·&nbsp;
              <a href={`${saveStatus.url}?mode=student`} target="_blank" rel="noreferrer">Student view</a>
              &nbsp;|&nbsp;
              <a href={`${saveStatus.url}?mode=teacher`} target="_blank" rel="noreferrer">Teacher view</a>
            </span>
          </div>
        )}

        <div className="options-row">
          {worksheet && (
            <div className="title-edit-container">
              <label htmlFor="title-input">Lesson Title:</label>
              <input
                id="title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson Title"
              />
            </div>
          )}
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
            />
            Include Answer Key in printout
          </label>
        </div>

        {error && <div className="error-alert">{error}</div>}
      </header>

      <div className="workspace-layout">
        {showSidebar && (
          <aside className="history-sidebar no-print">
            <div className="sidebar-header">
              <h3>Generation History</h3>
              <button 
                type="button" 
                onClick={() => setShowSidebar(false)}
                className="close-sidebar-btn"
                title="Close sidebar"
              >
                ✕
              </button>
            </div>
            <div className="sidebar-content">
              {history.length === 0 ? (
                <div className="sidebar-empty-state">
                  <p>No previous generations found.</p>
                  <p className="empty-hint">Worksheets you generate will show up here.</p>
                </div>
              ) : (
                <div className="history-list">
                  {history.map((item, idx) => {
                    const date = item.createdAt ? new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '';
                    return (
                      <div 
                        key={item._id || idx} 
                        className={`history-card ${worksheet && worksheet.title === item.worksheetJson?.title ? 'active' : ''}`}
                        onClick={() => loadHistoryItem(item)}
                      >
                        <h4 className="history-item-title">{item.worksheetJson?.title || item.topic || 'Untitled Worksheet'}</h4>
                        <div className="history-item-meta">
                          <span className="history-badge tone-badge">{item.tone}</span>
                          <span className="history-badge format-badge">{item.format || 'guided'}</span>
                        </div>
                        <div className="history-item-footer">
                          {item.usage && (
                            <span className="history-cost">
                              ₹{calculateCostInINR(item.usage.promptTokens || 0, item.usage.candidatesTokens || 0).toFixed(3)}
                            </span>
                          )}
                          <span className="history-date">{date}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="workspace-main">
          {/* ── LOADING SKELETON STATE ── */}
          {loading && (
            <div className="skeleton-container no-print">
              <div className="skeleton-line title"></div>
              <div className="skeleton-box large"></div>
              <div className="skeleton-box medium"></div>
              <div className="skeleton-box large"></div>
            </div>
          )}

          {/* ── WORKSHEET CONTENT ── */}
          {worksheet && !loading && (
            <article className="handout-sheet">
              {/* Handout Header */}
              <div className="handout-header">
                <div className="handout-meta">
                  <span>Name: ____________________________________</span>
                  <span>Date: ________________________</span>
                </div>
                <h1 className="handout-title">{title || worksheet.title}</h1>
              </div>

              {/* Key Concept Box */}
              {worksheet.keyConcept && (
                <section className="handout-section concept-box avoid-page-break">
                  <h2 className="section-title concept-title">Key Concept: {worksheet.keyConcept.title}</h2>
                  <p className="concept-desc">{renderMathAndText(worksheet.keyConcept.description)}</p>
                  {worksheet.keyConcept.diagram && worksheet.keyConcept.diagram.code && (
                    <MermaidRenderer chart={worksheet.keyConcept.diagram.code} />
                  )}
                  
                  {worksheet.keyConcept.equation && (
                    <div className={`math-display ${worksheet.keyConcept.equation.length > 50 ? 'long-math' : ''}`}>
                      {renderMathAndText(worksheet.keyConcept.equation)}
                    </div>
                  )}

                  {worksheet.keyConcept.bullets && (
                    <ul className="concept-bullets">
                      {worksheet.keyConcept.bullets.map((bullet, idx) => (
                        <li key={idx}>{renderMathAndText(bullet)}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* How to Identify Parts */}
              {worksheet.howToIdentify && (
                <section className="handout-section identify-section avoid-page-break">
                  <h2 className="section-title">{worksheet.howToIdentify.title}</h2>
                  <p className="section-desc">{renderMathAndText(worksheet.howToIdentify.description)}</p>
                  
                  <div className="identify-grid">
                    {worksheet.howToIdentify.intercept && (
                      <div className="identify-card">
                        <h3>{worksheet.howToIdentify.intercept.title}</h3>
                        <p>{renderMathAndText(worksheet.howToIdentify.intercept.description)}</p>
                        {worksheet.howToIdentify.intercept.keywords && (
                          <div className="keywords-box">
                            <strong>Keywords:</strong> {renderMathAndText(worksheet.howToIdentify.intercept.keywords)}
                          </div>
                        )}
                      </div>
                    )}
                    {worksheet.howToIdentify.slope && (
                      <div className="identify-card">
                        <h3>{worksheet.howToIdentify.slope.title}</h3>
                        <p>{renderMathAndText(worksheet.howToIdentify.slope.description)}</p>
                        {worksheet.howToIdentify.slope.keywords && (
                          <div className="keywords-box">
                            <strong>Keywords:</strong> {renderMathAndText(worksheet.howToIdentify.slope.keywords)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Worked Example */}
              {worksheet.workedExample && (
                <section className="handout-section example-box avoid-page-break">
                  <h2 className="section-title example-title">{worksheet.workedExample.title}</h2>
                  <p className="scenario-text"><strong>Scenario:</strong> {renderMathAndText(worksheet.workedExample.scenario)}</p>
                  {worksheet.workedExample.diagram && worksheet.workedExample.diagram.code && (
                    <MermaidRenderer chart={worksheet.workedExample.diagram.code} />
                  )}
                  
                  <div className="steps-table">
                    {worksheet.workedExample.steps && worksheet.workedExample.steps.map((step, idx) => (
                      <div className="step-row" key={idx}>
                        <div className="step-col step-header">
                          <strong>{renderMathAndText(step.title)}</strong>
                        </div>
                        <div className="step-col step-desc">
                          {renderMathAndText(step.explanation)}
                        </div>
                        <div className="step-col step-math">
                          <code style={{ background: 'transparent', border: 'none', padding: 0 }}>{renderMathAndText(step.equation)}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Check Your Understanding */}
              {worksheet.checkYourUnderstanding && (
                <section className="handout-section check-understanding avoid-page-break">
                  <h2 className="section-title">{worksheet.checkYourUnderstanding.title}</h2>
                  <p className="section-desc">{renderMathAndText(worksheet.checkYourUnderstanding.instructions)}</p>
                  
                  <ol className="fill-list">
                    {worksheet.checkYourUnderstanding.questions && worksheet.checkYourUnderstanding.questions.map((q, idx) => (
                      <li key={idx}>{renderQuestionText(q, idx)}</li>
                    ))}
                  </ol>

                  {worksheet.checkYourUnderstanding.reflection && (
                    <div className="reflection-area">
                      <p className="reflection-prompt"><strong>{renderMathAndText(worksheet.checkYourUnderstanding.reflection)}</strong></p>
                      {mode === 'lesson' ? (
                        <div className="reflection-answer-container">
                          <p className="hw-label">💡 Answer Guide:</p>
                          <div className="filled-reflection-answer">
                            {renderMathAndText(worksheet.checkYourUnderstanding.reflectionAnswer)}
                          </div>
                        </div>
                      ) : (
                        <div className="handwriting-lines">
                          <div className="hw-line"></div>
                          <div className="hw-line"></div>
                          <div className="hw-line"></div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Guided Practice */}
              {worksheet.guidedPractice && (
                <section className="handout-section guided-practice page-break-before">
                  <h2 className="section-title">{worksheet.guidedPractice.title}</h2>
                  <p className="section-desc">{renderMathAndText(worksheet.guidedPractice.instructions)}</p>
                  
                  <div className="guided-scenarios">
                    {worksheet.guidedPractice.scenarios && worksheet.guidedPractice.scenarios.map((sc, idx) => (
                      <div className="guided-scenario-card avoid-page-break" key={idx}>
                        <h3>{renderMathAndText(sc.title)}</h3>
                        <p className="scenario-body">{renderMathAndText(sc.text)}</p>
                        
                        <div className="fill-table">
                          <div className="fill-row">
                            <span className="fill-label">{renderMathAndText(sc.slopeLabel || 'Slope (m):')}</span>
                            <span className="fill-space">
                              {mode === 'lesson' && <span className="filled-answer">{renderMathAndText(sc.slopeAnswer)}</span>}
                            </span>
                          </div>
                          <div className="fill-row">
                            <span className="fill-label">{renderMathAndText(sc.interceptLabel || 'y-intercept (b):')}</span>
                            <span className="fill-space">
                              {mode === 'lesson' && <span className="filled-answer">{renderMathAndText(sc.interceptAnswer)}</span>}
                            </span>
                          </div>
                          <div className="fill-row">
                            <span className="fill-label">{renderMathAndText(sc.equationLabel || 'Final Equation:')}</span>
                            <span className="fill-space math-font">
                              {mode === 'lesson' && <code className="filled-equation">{renderMathAndText(sc.equationAnswer)}</code>}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Independent Practice */}
              {worksheet.independentPractice && (
                <section className="handout-section independent-practice page-break-before">
                  <h2 className="section-title">{worksheet.independentPractice.title}</h2>
                  <p className="section-desc">{renderMathAndText(worksheet.independentPractice.instructions)}</p>
                  
                  <div className="independent-scenarios">
                    {worksheet.independentPractice.scenarios && worksheet.independentPractice.scenarios.map((sc, idx) => (
                      <div className="independent-scenario-card avoid-page-break" key={idx}>
                        <h3>{renderMathAndText(sc.title)}</h3>
                        <p className="scenario-body">{renderMathAndText(sc.text)}</p>
                        
                        <div className="question-item">
                          <strong>A.</strong> {renderMathAndText(sc.questionA)}
                          {mode === 'lesson' ? (
                            <div className="filled-answer-block">
                              <strong>Answer:</strong> <span className="filled-answer">{renderMathAndText(sc.answerA)}</span>
                            </div>
                          ) : (
                            <div className="hw-line short"></div>
                          )}
                        </div>
                        <div className="question-item">
                          <strong>B.</strong> {renderMathAndText(sc.questionB)}
                          {mode === 'lesson' ? (
                            <div className="filled-answer-block">
                              <strong>Answer:</strong> <span className="filled-answer">{renderMathAndText(sc.answerB)}</span>
                            </div>
                          ) : (
                            <div className="hw-line short"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Extension Challenge */}
              {worksheet.extensionChallenge && (
                <section className="handout-section extension-section avoid-page-break">
                  <h2 className="section-title">{worksheet.extensionChallenge.title || 'Extension Challenge'}</h2>
                  <p className="scenario-body">{renderMathAndText(worksheet.extensionChallenge.text)}</p>
                  <div className="reflection-area">
                    {mode === 'lesson' ? (
                      <div className="extension-answer-container">
                        <p className="hw-label">💡 Solution Guide:</p>
                        <div className="filled-extension-answer">
                          {renderMathAndText(worksheet.extensionChallenge.answer)}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="hw-label">Show your work and explain your answer:</p>
                        <div className="handwriting-lines">
                          <div className="hw-line"></div>
                          <div className="hw-line"></div>
                          <div className="hw-line"></div>
                          <div className="hw-line"></div>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Answer Key */}
              {worksheet.answerKey && showAnswerKey && (
                <section className="handout-section answer-key-section page-break-before">
                  <h2 className="section-title answer-key-title">{worksheet.answerKey.title || 'Answer Key'}</h2>
                  <p className="answer-key-note no-print">Note: This section is forced to print on a separate page.</p>
                  
                  <div className="answer-key-content">
                    {worksheet.answerKey.sections && worksheet.answerKey.sections.map((sect, idx) => (
                      <div className="answer-sect" key={idx}>
                        <h3>{renderMathAndText(sect.title)}</h3>
                        <ul className="answer-bullets">
                          {sect.bullets && sect.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{renderMathAndText(b)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>
          )}

          {!worksheet && !loading && (
            <div className="empty-worksheet-state no-print">
              <div className="empty-card">
                <span className="empty-icon">📝</span>
                <h2>No Document Loaded</h2>
                <p>Use the generator panel above to create a new worksheet, or open the <strong>History</strong> sidebar to load a previously generated document.</p>
                <button 
                  type="button" 
                  onClick={() => setShowSidebar(true)} 
                  className="open-history-empty-btn"
                >
                  📁 Open History Sidebar
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── CUSTOM INLINE STYLES FOR THE LAYOUT ── */}
      <style jsx global>{`
        /* General layout settings */
        .test-lesson-container {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1e293b;
        }

        /* Sticky Control Header styling */
        .control-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .back-link {
          font-size: 0.9rem;
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .badge {
          background: #e0e7ff;
          color: #4338ca;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .usage-stats-badge {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .usage-icon {
          color: #16a34a;
        }

        .usage-breakdown {
          color: #4b5563;
          font-weight: 500;
          font-size: 0.75rem;
        }

        .usage-divider {
          color: #bbf7d0;
          font-weight: bold;
        }

        .usage-cost {
          color: #15803d;
          font-size: 0.85rem;
        }

        .advanced-toggle-row {
          margin-top: 14px;
          display: flex;
          justify-content: flex-start;
          width: 100%;
        }

        .advanced-toggle-btn {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .advanced-toggle-btn:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }

        .advanced-settings-panel {
          margin-top: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
          width: 100%;
        }

        .advanced-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .advanced-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .advanced-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .panel-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 4px;
        }

        .panel-hint {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .preset-select {
          font-size: 0.9rem;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: white;
          outline: none;
          color: #1e293b;
        }

        .checkboxes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .checkbox-item input {
          width: 15px;
          height: 15px;
          cursor: pointer;
          margin: 0;
        }

        .custom-prompt-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
        }

        .custom-instructions-textarea {
          font-size: 0.9rem;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          resize: vertical;
          outline: none;
          color: #1e293b;
          font-family: inherit;
        }

        .custom-instructions-textarea:focus {
          border-color: #6366f1;
        }

        .json-input-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
          margin-top: 4px;
        }

        .json-input-textarea {
          font-size: 0.82rem;
          font-family: 'Fira Code', 'Courier New', monospace;
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          resize: vertical;
          outline: none;
          color: #0f172a;
          line-height: 1.5;
          transition: border-color 0.2s;
        }

        .json-input-textarea:focus {
          border-color: #0891b2;
          background: #fff;
        }

        .json-error-msg {
          font-size: 0.82rem;
          color: #b45309;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 6px 12px;
        }

        .load-json-btn {
          align-self: flex-start;
          padding: 8px 18px;
          background: linear-gradient(135deg, #0891b2, #0e7490);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }

        .load-json-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .load-json-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ── Custom Prompt Generator ── */
        .custom-gen-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 2px;
        }

        .custom-gen-toggle-btn {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, #7c3aed22, #4f46e511);
          border: 1.5px dashed #7c3aed55;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #6d28d9;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s, border-color 0.2s;
        }

        .custom-gen-toggle-btn:hover {
          background: linear-gradient(135deg, #7c3aed33, #4f46e522);
          border-color: #7c3aed99;
        }

        .custom-gen-panel {
          background: #faf5ff;
          border: 1.5px solid #ddd6fe;
          border-radius: 12px;
          padding: 16px;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .custom-gen-hint {
          font-size: 0.82rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .custom-gen-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .custom-gen-grid {
            grid-template-columns: 1fr;
          }
        }

        .custom-gen-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .system-prompt-textarea {
          font-family: inherit !important;
          font-size: 0.85rem !important;
          line-height: 1.6 !important;
        }

        .custom-gen-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .custom-gen-result {
          background: white;
          border: 1.5px solid #ddd6fe;
          border-radius: 10px;
          overflow: hidden;
        }

        .custom-gen-result-header {
          background: linear-gradient(90deg, #7c3aed, #4f46e5);
          color: white;
          padding: 8px 16px;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .custom-gen-result-cards {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .custom-result-card {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .custom-result-card:last-child {
          border-bottom: none;
        }

        .custom-result-key {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7c3aed;
          margin-bottom: 4px;
        }

        .custom-result-value p {
          margin: 0;
          font-size: 0.9rem;
          color: #1e293b;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .custom-result-pre,
        .custom-result-raw {
          margin: 0;
          font-size: 0.78rem;
          font-family: 'Fira Code', 'Courier New', monospace;
          color: #374151;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .custom-result-raw {
          padding: 16px;
        }

        .controls-row {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .input-group {
          flex: 1;
          min-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #475569;
        }

        .input-group input, .input-group select {
          font-size: 0.95rem;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          outline: none;
          background: white;
          transition: border-color 0.2s;
        }

        .input-group input:focus, .input-group select:focus {
          border-color: #6366f1;
        }

        .actions-group {
          display: flex;
          gap: 12px;
        }

        .generate-btn, .print-btn {
          font-weight: 700;
          font-size: 0.95rem;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .generate-btn {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(99, 102, 241, 0.3);
        }

        .generate-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .print-btn {
          background: #0f172a;
          color: white;
        }

        .print-btn:hover:not(:disabled) {
          background: #1e293b;
        }

        .print-btn:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
          cursor: not-allowed;
        }

        .copy-json-btn {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .copy-json-btn:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
        }

        .copy-json-btn:disabled {
          background: #f8fafc;
          color: #cbd5e1;
          border-color: #f1f5f9;
          cursor: not-allowed;
        }

        .save-btn {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(16, 185, 129, 0.3);
        }

        .save-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .save-spinner {
          border-color: rgba(255,255,255,0.3);
          border-top-color: white;
        }

        .saved-banner {
          margin-top: 10px;
          padding: 8px 16px;
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #065f46;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .saved-link {
          color: #059669;
          font-weight: 700;
          text-decoration: underline;
        }

        .saved-modes-hint a {
          color: #059669;
          text-decoration: underline;
        }

        .options-row {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          border-top: 1px dashed #e2e8f0;
          padding-top: 16px;
        }

        .title-edit-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          max-width: 480px;
        }

        .title-edit-container label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #475569;
          white-space: nowrap;
        }

        .title-edit-container input {
          flex: 1;
          font-size: 0.9rem;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          outline: none;
          background: white;
          transition: border-color 0.2s;
        }

        .title-edit-container input:focus {
          border-color: #6366f1;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .error-alert {
          margin-top: 12px;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Skeleton animation */
        .skeleton-container {
          max-width: 800px;
          margin: 40px auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-line {
          height: 20px;
          background: #e2e8f0;
          border-radius: 4px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skeleton-line.title {
          width: 60%;
          height: 32px;
          margin-bottom: 20px;
        }

        .skeleton-box {
          background: #e2e8f0;
          border-radius: 8px;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skeleton-box.large {
          height: 180px;
        }

        .skeleton-box.medium {
          height: 100px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* Handout Document Styling */
        .handout-sheet {
          max-width: 850px;
          margin: 40px auto;
          background: white;
          padding: 50px 60px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          border-radius: 1px;
          box-sizing: border-box;
          line-height: 1.5;
        }

        .handout-header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 28px;
        }

        .handout-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 16px;
        }

        .handout-title {
          font-size: 1.75rem;
          font-weight: 800;
          text-align: left;
          color: #0f172a;
          margin: 0;
        }

        .handout-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }

        .section-desc {
          font-size: 0.95rem;
          color: #475569;
          margin-top: 0;
          margin-bottom: 16px;
        }

        /* Concept box (blue accent) */
        .concept-box {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 20px;
        }

        .concept-title {
          border: none;
          color: #0369a1;
          margin-bottom: 8px;
          padding-bottom: 0;
          font-size: 1.15rem;
        }

        .concept-desc {
          margin-bottom: 16px;
          color: #0c4a6e;
          font-size: 0.95rem;
        }

        .math-display {
          font-family: 'Outfit', 'Times New Roman', serif;
          font-size: 1.4rem;
          font-weight: 700;
          text-align: center;
          margin: 16px 0;
          color: #0f172a;
          background: white;
          padding: 12px 16px;
          border-radius: 6px;
          border: 1px dashed #cbd5e1;
          line-height: 1.5;
          word-break: break-word;
        }

        .math-display.long-math {
          font-size: 1.05rem;
          font-weight: 600;
          text-align: left;
          font-family: inherit;
        }

        .concept-bullets {
          margin: 0;
          padding-left: 20px;
          color: #0c4a6e;
          font-size: 0.95rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Identify Grid */
        .identify-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .identify-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          background: #f8fafc;
        }

        .identify-card h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .identify-card p {
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          color: #475569;
        }

        .keywords-box {
          font-size: 0.85rem;
          background: #f1f5f9;
          padding: 8px 12px;
          border-left: 3px solid #6366f1;
          border-radius: 0 4px 4px 0;
        }

        /* Worked Example (green accent) */
        .example-box {
          border: 1px solid #dcfce7;
          background: #f0fdf4;
          border-radius: 8px;
          padding: 20px;
        }

        .example-title {
          border: none;
          color: #15803d;
          margin-bottom: 8px;
          padding-bottom: 0;
          font-size: 1.15rem;
        }

        .scenario-text {
          margin: 0 0 16px 0;
          color: #14532d;
          font-size: 0.95rem;
        }

        .steps-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #bbf7d0;
          background: white;
          border-radius: 6px;
          overflow: hidden;
        }

        .step-row {
          display: grid;
          grid-template-columns: 180px 1fr 120px;
          border-bottom: 1px solid #bbf7d0;
        }

        .step-row:last-child {
          border-bottom: none;
        }

        .step-col {
          padding: 12px;
          font-size: 0.9rem;
          align-content: center;
        }

        .step-header {
          background: #f0fdf4;
          color: #14532d;
          border-right: 1px solid #bbf7d0;
        }

        .step-desc {
          color: #334155;
          border-right: 1px solid #bbf7d0;
        }

        .step-math {
          text-align: center;
          font-weight: 700;
          color: #14532d;
          background: #f0fdf4;
        }

        /* Check understanding / fill list */
        .fill-list {
          padding-left: 20px;
          margin: 0 0 20px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 0.95rem;
        }

        .reflection-area {
          margin-top: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px;
          border-radius: 8px;
        }

        .reflection-prompt {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 0.95rem;
          color: #0f172a;
        }

        /* Handwriting guides */
        .handwriting-lines {
          display: flex;
          flex-direction: column;
          gap: 22px;
          margin: 20px 0 10px 0;
        }

        .hw-line {
          border-bottom: 1px solid #94a3b8;
          height: 1px;
        }

        .hw-line.short {
          width: 250px;
          margin: 16px 0 8px 0;
          border-bottom-style: dotted;
        }

        .hw-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          margin: 0;
        }

        /* Guided Practice */
        .guided-scenarios {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .guided-scenario-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          background: #ffffff;
        }

        .guided-scenario-card h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }

        .scenario-body {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 0.95rem;
          color: #334155;
        }

        .fill-table {
          display: flex;
          flex-direction: column;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }

        .fill-row {
          display: grid;
          grid-template-columns: 280px 1fr;
          border-bottom: 1px solid #e2e8f0;
        }

        .fill-row:last-child {
          border-bottom: none;
        }

        .fill-label {
          padding: 10px 12px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          font-size: 0.9rem;
          font-weight: 700;
          color: #475569;
        }

        .fill-space {
          padding: 10px 12px;
          background: white;
        }

        /* Independent Practice */
        .independent-scenarios {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }

        .independent-scenario-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          background: #f8fafc;
        }

        .independent-scenario-card h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
        }

        .question-item {
          margin-top: 14px;
          font-size: 0.95rem;
          color: #0f172a;
        }

        /* Answer Key page style */
        .answer-key-section {
          border: 2px dashed #6366f1;
          border-radius: 8px;
          padding: 28px;
          background: #f5f3ff;
          margin-top: 40px;
        }

        .answer-key-title {
          border: none;
          color: #4f39ca;
          font-size: 1.3rem;
          padding-bottom: 0;
          margin-bottom: 6px;
        }

        .answer-key-note {
          font-size: 0.8rem;
          color: #6366f1;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .answer-sect {
          margin-bottom: 18px;
        }

        .answer-sect:last-child {
          margin-bottom: 0;
        }

        .answer-sect h3 {
          margin-top: 0;
          margin-bottom: 6px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #4f39ca;
        }

        .answer-bullets {
          margin: 0;
          padding-left: 20px;
          font-size: 0.9rem;
          color: #312e81;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Filled Answers Styling (Lesson Mode) */
        .filled-blank {
          color: #2563eb;
          font-weight: 700;
          border-bottom: 2px solid #93c5fd;
          padding: 0 4px;
          margin: 0 2px;
          font-family: 'Outfit', sans-serif;
        }

        .filled-blank-inline {
          color: #2563eb;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
        }

        .filled-answer {
          color: #2563eb;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
        }

        .filled-equation {
          color: #1d4ed8;
          font-weight: 700;
          font-family: 'Outfit', 'Courier New', monospace;
          background: #eff6ff;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
        }

        .filled-answer-block {
          margin-top: 8px;
          padding: 6px 12px;
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          font-size: 0.9rem;
          color: #1e3a8a;
          border-radius: 0 4px 4px 0;
        }

        .reflection-answer-container, .extension-answer-container {
          margin-top: 14px;
          padding: 12px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
        }

        .filled-reflection-answer, .filled-extension-answer {
          margin-top: 6px;
          font-size: 0.95rem;
          color: #1e3a8a;
          line-height: 1.5;
        }

        .control-header.header-hidden {
          display: none !important;
        }

        .toggle-header-action {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-header-action:hover {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .floating-show-controls {
          position: fixed;
          top: 16px;
          right: 24px;
          z-index: 200;
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
          transition: all 0.2s;
        }

        .floating-show-controls:hover {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(79, 70, 229, 0.45);
        }

        /* Workspace layout with sidebar support */
        .workspace-layout {
          display: flex;
          min-height: calc(100vh - 120px);
          position: relative;
        }

        .workspace-main {
          flex: 1;
          padding: 20px;
          transition: all 0.3s ease;
        }

        /* History Sidebar */
        .history-sidebar {
          width: 320px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          position: sticky;
          top: 150px; /* adjusted for control header height */
          z-index: 90;
          box-shadow: 4px 0 10px rgba(0, 0, 0, 0.02);
          transition: all 0.3s ease;
        }

        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }

        .close-sidebar-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-sidebar-btn:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .sidebar-empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .sidebar-empty-state p {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
        }

        .empty-hint {
          font-size: 0.78rem !important;
          color: #94a3b8;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-card {
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .history-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .history-card.active {
          border-color: #6366f1;
          background: #f5f7ff;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.08);
        }

        .history-item-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.4;
        }

        .history-item-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .history-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: capitalize;
        }

        .tone-badge {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #dbeafe;
        }

        .format-badge {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .history-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          border-top: 1px dashed #f1f5f9;
          padding-top: 8px;
        }

        .history-cost {
          font-size: 0.75rem;
          font-weight: 700;
          color: #166534;
        }

        .history-date {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        /* Empty state for main worksheet viewer */
        .empty-worksheet-state {
          max-width: 850px;
          margin: 60px auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .empty-card {
          background: #ffffff;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 60px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 500px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }

        .empty-icon {
          font-size: 3rem;
        }

        .empty-card h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
        }

        .empty-card p {
          margin: 0;
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.6;
        }

        .open-history-empty-btn {
          margin-top: 8px;
          background: #4f46e5;
          color: white;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
          transition: all 0.2s;
        }

        .open-history-empty-btn:hover {
          background: #4338ca;
          transform: translateY(-1px);
        }

        /* Toggle History Header Button */
        .toggle-sidebar-btn {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .toggle-sidebar-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .toggle-sidebar-btn.active {
          background: #eff6ff;
          color: #2563eb;
          border-color: #93c5fd;
        }

        .history-count-badge {
          background: #2563eb;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 8px;
          min-width: 14px;
          text-align: center;
        }

        .header-hidden ~ .workspace-layout .history-sidebar {
          top: 0;
          height: 100vh;
        }

        /* ── PRINT-SPECIFIC CSS MEDIA STYLES ── */
        @media print {
          /* Hide all screen widgets */
          .no-print {
            display: none !important;
          }

          /* Reset container styles */
          body, .test-lesson-container {
            background: white !important;
            color: black !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .workspace-layout {
            display: block !important;
            min-height: auto !important;
          }

          .workspace-main {
            padding: 0 !important;
          }

          .handout-sheet {
            max-width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            line-height: 1.6 !important;
          }

          /* Force browser to print backgrounds */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Set margins */
          @page {
            size: letter;
            margin: 0.65in 0.65in 0.65in 0.65in;
          }

          /* Page break controls */
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }

          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }

          .avoid-page-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Handout title adjustment for print */
          .handout-title {
            font-size: 1.9rem !important;
          }

          .section-title {
            font-size: 1.25rem !important;
            margin-top: 15px !important;
          }

          /* Solid border replacements for soft shadows */
          .concept-box {
            border: 1.5px solid #0284c7 !important;
          }

          .example-box {
            border: 1.5px solid #16a34a !important;
          }

          .identify-card {
            border: 1px solid #94a3b8 !important;
          }

          .guided-scenario-card, .independent-scenario-card {
            border: 1px solid #94a3b8 !important;
          }

          .reflection-answer-container, .extension-answer-container {
            border: 1px solid #94a3b8 !important;
          }
        }
      `}</style>
    </div>
  );
}
