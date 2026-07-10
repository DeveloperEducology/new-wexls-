'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { COMPONENT_REGISTRY } from '../../../lib/practice/generators/universal/components/index.js';

export default function BaseGeneratorLayout({
  title: pageTitle,
  topic: defaultTopic,
  visualComponent: defaultVisualComponent,
  presets = [],
  customControls = null,
  visualPropsSchema = [],
  defaultVisualProps = {}
}) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [title, setTitle] = useState(presets[0]?.title || '');
  const [subject, setSubject] = useState(presets[0]?.subject || 'math');
  const [topic, setTopic] = useState(presets[0]?.topic || defaultTopic);
  const [grade, setGrade] = useState(presets[0]?.grade || '1');
  const [blueprint, setBlueprint] = useState(presets[0]?.blueprint || '');
  const [solution, setSolution] = useState(presets[0]?.solution || '');
  const [placeholders, setPlaceholders] = useState(Object.keys(presets[0]?.placeholders || {}));
  const [placeholderValues, setPlaceholderValues] = useState(presets[0]?.placeholders || {});

  // Visual parameters
  const [visualComponent, setVisualComponent] = useState(presets[0]?.visualComponent || defaultVisualComponent);
  const [visualProps, setVisualProps] = useState(presets[0]?.visualProps || defaultVisualProps);
  const [visualPosition, setVisualPosition] = useState(presets[0]?.visualPosition || 'middle');

  // Resolved simulator values
  const [resolvedValues, setResolvedValues] = useState({});
  const [shuffling, setShuffling] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  // Load selected preset
  const loadPreset = (presetIndex) => {
    const preset = presets[presetIndex];
    if (!preset) return;
    setSelectedPresetIndex(presetIndex);
    setTitle(preset.title || '');
    setSubject(preset.subject || 'math');
    setTopic(preset.topic || defaultTopic);
    setGrade(preset.grade || '1');
    setBlueprint(preset.blueprint || '');
    setSolution(preset.solution || '');
    setPlaceholders(Object.keys(preset.placeholders || {}));
    setPlaceholderValues(preset.placeholders || {});
    setVisualComponent(preset.visualComponent || defaultVisualComponent);
    setVisualProps(preset.visualProps || defaultVisualProps);
    setVisualPosition(preset.visualPosition || 'middle');
    setPublishStatus(null);
    setPublishError(null);
  };

  // Helper to parse lists like "Marcus, Emma, Jamal" or ranges like "3-8"
  const resolvePlaceholder = (valStr) => {
    if (!valStr) return '';
    const cleanStr = String(valStr).trim();

    // Check if it's a pool of JSON objects
    if (cleanStr.includes('{')) {
      try {
        const wrapped = cleanStr.startsWith('[') ? cleanStr : `[${cleanStr}]`;
        const arr = JSON.parse(wrapped);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr[Math.floor(Math.random() * arr.length)];
        }
      } catch (e) {
        // Fall back to regular string splitting
      }
    }

    if (cleanStr.includes(',')) {
      const arr = cleanStr.split(',').map(s => s.trim()).filter(Boolean);
      return arr[Math.floor(Math.random() * arr.length)] || '';
    }
    const rangeRegex = /^(\d+)-(\d+)$/;
    const match = cleanStr.match(rangeRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return cleanStr;
  };

  const shuffleSimulator = () => {
    setShuffling(true);
    const newResolved = {};
    placeholders.forEach(key => {
      newResolved[key] = resolvePlaceholder(placeholderValues[key]);
    });
    setResolvedValues(newResolved);
    setTimeout(() => setShuffling(false), 500);
  };

  // Trigger initial shuffle
  useEffect(() => {
    shuffleSimulator();
  }, [placeholderValues, placeholders]);

  // Derive mathematical operations and fill placeholders
  const evaluateText = (tplText) => {
    if (!tplText) return '';
    let result = tplText;

    // Substitute {{placeholder}} variables
    Object.keys(resolvedValues).forEach(key => {
      const val = resolvedValues[key];
      if (val && typeof val === 'object') {
        Object.keys(val).forEach(prop => {
          const escapedKey = `${key}.${prop}`.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          result = result.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), val[prop]);
          result = result.replace(new RegExp(`\\[\\s*${escapedKey}\\s*\\]`, 'g'), val[prop]);
        });
      } else {
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        result = result.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), val);
        result = result.replace(new RegExp(`\\[\\s*${escapedKey}\\s*\\]`, 'g'), val);
      }
    });

    // Evaluate math expressions: {= expression =}
    const mathRegex = /\{=\s*(.*?)\s*=\}/g;
    result = result.replace(mathRegex, (match, expr) => {
      try {
        const evaluated = new Function('ctx', `with(ctx) { return ${expr}; }`)(resolvedValues);
        if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
          return Math.round(evaluated * 100) / 100;
        }
        return evaluated !== undefined && evaluated !== null ? String(evaluated) : '';
      } catch (err) {
        return `[Math Error: ${expr}]`;
      }
    });

    return result;
  };

  // Compile full template JSON recipe
  useEffect(() => {
    const activeTopic = topic || 'addition';
    
    // Extract variables config from placeholders
    const compiledVariables = placeholders.map(key => {
      const valString = String(placeholderValues[key] || '').trim();
      if (valString.includes(',')) {
        return {
          name: key,
          type: 'choice',
          pool: valString.split(',').map(s => s.trim()).filter(Boolean)
        };
      }
      const rangeRegex = /^(\d+)-(\d+)$/;
      const match = valString.match(rangeRegex);
      if (match) {
        return {
          name: key,
          type: 'range',
          min: parseInt(match[1], 10),
          max: parseInt(match[2], 10)
        };
      }
      return {
        name: key,
        type: 'choice',
        pool: [valString]
      };
    });

    // Group parallel choice variables of the same length to synchronize them
    const choiceVars = compiledVariables.filter(v => v.type === 'choice' && Array.isArray(v.pool) && v.pool.length > 1);
    const groupsByLength = {};
    choiceVars.forEach(v => {
      const len = v.pool.length;
      if (!groupsByLength[len]) groupsByLength[len] = [];
      groupsByLength[len].push(v);
    });

    Object.keys(groupsByLength).forEach(lenStr => {
      const vars = groupsByLength[lenStr];
      if (vars.length < 2) return;

      const len = Number(lenStr);
      const varNames = vars.map(v => v.name);
      const syncVarName = `_sync_${varNames.join('_')}`;

      const syncPool = [];
      for (let i = 0; i < len; i++) {
        const obj = {};
        vars.forEach(v => {
          obj[v.name] = v.pool[i];
        });
        syncPool.push(obj);
      }

      vars.forEach(v => {
        const idx = compiledVariables.indexOf(v);
        if (idx > -1) compiledVariables.splice(idx, 1);
      });

      compiledVariables.unshift({
        name: syncVarName,
        type: 'choice',
        pool: syncPool
      });

      vars.forEach(v => {
        compiledVariables.push({
          name: v.name,
          type: 'expression',
          formula: `${syncVarName}.${v.name}`
        });
      });
    });

    // Solve for inline evaluations to determine formula variables
    const mathRegex = /\{=\s*(.*?)\s*=\}/g;
    let exprCount = 0;
    let match;
    while ((match = mathRegex.exec(solution)) !== null) {
      exprCount++;
      const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
      compiledVariables.push({
        name: exprName,
        type: 'expression',
        formula: match[1].trim()
      });
    }

    // Extract blank IDs from blueprint
    const blankRegex = /\[\[\s*([a-zA-Z0-9_]+)\s*\]\]/g;
    const foundBlanks = [];
    let blankMatch;
    while ((blankMatch = blankRegex.exec(blueprint)) !== null) {
      foundBlanks.push(blankMatch[1]);
    }

    const isMcq = foundBlanks.length === 0;
    let validationRules = [];

    if (!isMcq) {
      const answerObj = {};
      foundBlanks.forEach((blankId) => {
        const matchedVar = compiledVariables.find(v => v.name.toLowerCase() === blankId.toLowerCase());
        if (matchedVar) {
          answerObj[blankId] = `[${matchedVar.name}]`;
        } else {
          const numMatch = blankId.match(/^blank(\d+)$/i);
          if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            const exprName = num === 1 ? 'Result' : `Result_${num}`;
            answerObj[blankId] = `[${exprName}]`;
          } else {
            answerObj[blankId] = `[${blankId}]`;
          }
        }
      });
      validationRules = [
        {
          type: 'exact_match',
          target: 'answer',
          value: answerObj
        }
      ];
    }

    const compiledJson = {
      id: `template-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title,
      subject,
      topic: activeTopic,
      grade,
      description: 'Generated via Template Masterclass',
      status: 'active',
      optionsType: isMcq ? 'mcq' : 'fill_blank',
      blueprint,
      solution,
      questionText: blueprint,
      explanation: {
        sections: [{ type: 'text', content: solution }]
      },
      validationRules,
      variables: compiledVariables
    };

    if (visualComponent !== 'none') {
      compiledJson.visuals = [
        {
          component: visualComponent,
          position: visualPosition,
          props: visualProps
        }
      ];
    }

    setJsonText(JSON.stringify(compiledJson, null, 2));
  }, [blueprint, solution, placeholderValues, title, subject, topic, grade, placeholders, visualComponent, visualProps, visualPosition]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishStatus(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus({
          id: parsed.id || data.id || data.result?.id,
          mode: data.result?.mode || 'saved'
        });
      } else {
        setPublishError(data.error || 'Failed to save template.');
      }
    } catch (err) {
      setPublishError(err.message || 'API call failed.');
    } finally {
      setPublishing(false);
    }
  };

  // Render visual preview SVG
  const renderVisualPreview = () => {
    if (!visualComponent || visualComponent === 'none') return null;
    const builder = COMPONENT_REGISTRY[visualComponent];
    if (!builder) return null;

    const resolvedProps = {};
    Object.keys(visualProps).forEach(key => {
      const rawVal = visualProps[key];
      if (rawVal === undefined || rawVal === null || rawVal === '') return;
      const strVal = String(rawVal).trim();
      let resolvedStr = strVal;
      let hasReplacements = false;
      const sortedKeys = Object.keys(resolvedValues).sort((a, b) => b.length - a.length);

      sortedKeys.forEach(k => {
        const regex = new RegExp(`\\b${k}\\b`, 'g');
        if (regex.test(resolvedStr)) {
          resolvedStr = resolvedStr.replace(regex, resolvedValues[k]);
          hasReplacements = true;
        }
      });

      if (hasReplacements) {
        const num = Number(resolvedStr);
        resolvedProps[key] = Number.isFinite(num) ? num : resolvedStr;
      } else {
        const num = Number(strVal);
        resolvedProps[key] = Number.isFinite(num) ? num : strVal;
      }
    });

    try {
      const result = builder(resolvedProps, () => Math.random());
      let svgContent = null;
      if (typeof result === 'string') {
        svgContent = result;
      } else if (result && result.content) {
        svgContent = result.content;
      }
      if (!svgContent) return null;
      return (
        <div style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: 12 }} dangerouslySetInnerHTML={{ __html: svgContent }} />
      );
    } catch (err) {
      return <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>⚠️ Preview error: {err.message}</div>;
    }
  };

  const getSolutionNumberLineProps = () => {
    const min = Number(visualProps.min) || 0;
    const max = Number(visualProps.max) || 10;
    const step = Number(visualProps.step) || 1;
    const color = visualProps.color || 'blue';

    let start = min;
    if (resolvedValues.A !== undefined) start = Number(resolvedValues.A);
    else if (resolvedValues.count1 !== undefined) start = Number(resolvedValues.count1);
    else if (resolvedValues.a !== undefined) start = Number(resolvedValues.a);

    let jumpsCount = 0;
    if (resolvedValues.B !== undefined) jumpsCount = Number(resolvedValues.B);
    else if (resolvedValues.count2 !== undefined) jumpsCount = Number(resolvedValues.count2);
    else if (resolvedValues.b !== undefined) jumpsCount = Number(resolvedValues.b);

    if (isNaN(start) || start < min || start > max) start = min;
    if (isNaN(jumpsCount) || jumpsCount < 0) jumpsCount = 0;
    if (start + jumpsCount > max) jumpsCount = max - start;

    const end = start + jumpsCount;

    const jumpList = [];
    for (let val = start; val <= end; val += step) {
      jumpList.push(val);
    }
    return {
      min,
      max,
      step,
      pointValue: null,
      color,
      jumps: jumpList.join('->'),
      highlightBoxes: [start, end].join(','),
      interactive: false
    };
  };

  const renderSolutionVisual = () => {
    if (visualComponent !== 'NumberLine') return null;
    const builder = COMPONENT_REGISTRY[visualComponent];
    if (!builder) return null;

    try {
      const resolvedProps = getSolutionNumberLineProps();
      const result = builder(resolvedProps, () => Math.random());
      let svgContent = typeof result === 'string' ? result : result?.content;
      if (!svgContent) return null;
      return (
        <div style={{
          marginTop: 16,
          borderRadius: 16,
          border: '1.5px dashed rgba(59, 130, 246, 0.3)',
          background: '#f8fafc',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          width: '100%'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💡 Number Line Solution Steps
          </div>
          <div style={{ width: '100%', overflow: 'hidden', borderRadius: 12 }} dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>
      );
    } catch (err) {
      return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px'
    }}>
      {/* Header bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '16px 24px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🎓</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
              {pageTitle}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Topic: <strong style={{ color: '#4f46e5' }}>{topic}</strong>
            </p>
          </div>
        </div>
        <Link href="/template-generator" style={{
          textDecoration: 'none',
          color: '#4f46e5',
          fontWeight: 700,
          fontSize: '14px',
          background: '#f0f0ff',
          padding: '10px 16px',
          borderRadius: '12px',
          transition: 'background 0.2s'
        }}>
          ← Back Dashboard
        </Link>
      </header>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Side: Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Preset Selector */}
          {presets.length > 0 && (
            <div style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
                Load Template Preset:
              </label>
              <select
                value={selectedPresetIndex}
                onChange={(e) => loadPreset(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  background: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  color: '#1e293b'
                }}
              >
                {presets.map((preset, idx) => (
                  <option key={idx} value={idx}>{preset.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Config details */}
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              ✍️ Question Settings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Template Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '10px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Target Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}
                >
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Question Blueprint text
              </label>
              <textarea
                value={blueprint}
                onChange={(e) => setBlueprint(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                Solution steps
              </label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Placeholders / Variables editor */}
            {placeholders.length > 0 && (
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1.5px solid #edf2f7',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#475569' }}>
                  🔑 Placeholders & Ranges
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {placeholders.map((key) => (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#4a5568' }}>{`{{${key}}}`}</span>
                      <input
                        type="text"
                        value={placeholderValues[key] || ''}
                        onChange={(e) => setPlaceholderValues({
                          ...placeholderValues,
                          [key]: e.target.value
                        })}
                        placeholder="e.g. 1-10 or lion, bear"
                        style={{ padding: '6px 10px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', width: '100%' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Controls Specific to Topic */}
            {customControls && (
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1.5px solid #edf2f7'
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#475569' }}>
                  ⚙️ Topic Parameters
                </h4>
                {customControls({
                  visualProps,
                  setVisualProps,
                  placeholderValues,
                  setPlaceholderValues,
                  placeholders,
                  setPlaceholders
                })}
              </div>
            )}

            {/* General Visual Component parameters list */}
            {visualPropsSchema.length > 0 && !customControls && (
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1.5px solid #edf2f7'
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#475569' }}>
                  📐 Visual Parameters
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {visualPropsSchema.map((field) => (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={visualProps[field.key] || ''}
                        onChange={(e) => setVisualProps({
                          ...visualProps,
                          [field.key]: e.target.value
                        })}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Simulator & Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Simulator Box */}
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            <button
              onClick={shuffleSimulator}
              disabled={shuffling}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#e0f2fe',
                border: 'none',
                color: '#0369a1',
                fontWeight: 700,
                fontSize: '12px',
                padding: '8px 14px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              🔄 Shuffle
            </button>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#334155' }}>
              🔬 Live Question Simulator
            </h3>
            
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #f1f5f9',
              borderRadius: '12px',
              padding: '20px',
              minHeight: '200px'
            }}>
              {/* Question text */}
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', whiteSpace: 'pre-line' }}>
                {evaluateText(blueprint)}
              </div>

              {/* Render Visual Preview */}
              {visualComponent !== 'none' && (
                <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
                  {renderVisualPreview()}
                </div>
              )}

              {/* Solution steps */}
              {solution.trim() && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px dashed #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '20px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
                    🎒 Step-by-Step Solution
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e293b', whiteSpace: 'pre-line' }}>
                    {evaluateText(solution)}
                  </div>
                  {renderSolutionVisual()}
                </div>
              )}
            </div>
          </div>

          {/* Publisher Card */}
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800, color: '#334155' }}>
              🚀 Publish to Database
            </h3>
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {publishing ? 'Publishing...' : 'Publish Template Recipe'}
            </button>

            {publishStatus && (
              <div style={{
                marginTop: '14px',
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                padding: '12px',
                borderRadius: '10px',
                color: '#166534',
                fontSize: '14px'
              }}>
                🎉 Published successfully as ID: <code>{publishStatus.id}</code> ({publishStatus.mode})!
              </div>
            )}

            {publishError && (
              <div style={{
                marginTop: '14px',
                background: '#fef2f2',
                border: '1.5px solid #fca5a5',
                padding: '12px',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                ⚠️ Error: {publishError}
              </div>
            )}

            <button
              onClick={() => setShowJson(!showJson)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontSize: '13px',
                fontWeight: 600,
                marginTop: '12px',
                cursor: 'pointer',
                display: 'block',
                textAlign: 'center',
                width: '100%'
              }}
            >
              {showJson ? 'Hide JSON Recipe' : 'Show JSON Recipe'}
            </button>

            {showJson && (
              <pre style={{
                background: '#0f172a',
                color: '#38edf2',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '11px',
                overflowX: 'auto',
                marginTop: '10px'
              }}>
                {jsonText}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
