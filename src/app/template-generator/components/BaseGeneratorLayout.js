'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { COMPONENT_REGISTRY } from '../../../lib/practice/generators/universal/components/index.js';
import {
  drawBaseTenBlocks,
  drawPlaceValue,
  drawTenFrame,
  drawVisualChoicePanel,
  drawJarOfMarbles,
  drawSpinner,
  drawItemCounter,
  drawNumberLine,
  drawHundredChart,
  drawRekenrek,
  drawNumberBond,
  drawTallyChart,
  drawFractionBar,
  drawFractionCircle,
  drawFractionGrid,
  drawDecimalGrid,
  drawDecimalLine,
  drawShapeCanvas,
  drawCoordinatePlane,
  drawProtractor,
  drawRuler,
  drawGeoboard,
  drawBarGraph,
  drawPictograph,
  drawFrequencyTable,
  drawAnalogClock,
  drawCalendar,
  drawThermometer,
  drawBalanceScale,
  drawMeasuringJug,
  drawMoneyDisplay,
  drawPriceTagCompare
} from '../../../lib/practice/generators/universalEvaluator.js';

const DRAWING_HELPERS = {
  drawBaseTenBlocks,
  drawPlaceValue,
  drawTenFrame,
  drawVisualChoicePanel,
  drawJarOfMarbles,
  drawSpinner,
  drawItemCounter,
  drawNumberLine,
  drawHundredChart,
  drawRekenrek,
  drawNumberBond,
  drawTallyChart,
  drawFractionBar,
  drawFractionCircle,
  drawFractionGrid,
  drawDecimalGrid,
  drawDecimalLine,
  drawShapeCanvas,
  drawCoordinatePlane,
  drawProtractor,
  drawRuler,
  drawGeoboard,
  drawBarGraph,
  drawPictograph,
  drawFrequencyTable,
  drawAnalogClock,
  drawCalendar,
  drawThermometer,
  drawBalanceScale,
  drawMeasuringJug,
  drawMoneyDisplay,
  drawPriceTagCompare
};

const padOptions = (options) => {
  const baseOptions = options || [];
  const padded = [...baseOptions];
  while (padded.length < 4) {
    padded.push({ label: '', isCorrect: padded.length === 0 });
  }
  return padded;
};

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
  
  // MCQ and Options parameters
  const [optionsType, setOptionsType] = useState(presets[0]?.optionsType || 'fill_blank');
  const [mcqColumns, setMcqColumns] = useState(String(presets[0]?.layoutConfig?.columns || '2'));
  const [optionsCount, setOptionsCount] = useState(presets[0]?.options?.length || 4);
  const [mcqOptions, setMcqOptions] = useState(() => padOptions(presets[0]?.options));

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
    setOptionsType(preset.optionsType || 'fill_blank');
    setMcqColumns(preset.layoutConfig?.columns ? String(preset.layoutConfig.columns) : '2');
    setOptionsCount(preset.options?.length || 4);
    setMcqOptions(padOptions(preset.options));
    setPublishStatus(null);
    setPublishError(null);
  };

  // Dynamically sync placeholder input fields when user types custom variable names
  useEffect(() => {
    const varRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const foundVars = new Set();
    
    let match;
    while ((match = varRegex.exec(blueprint)) !== null) {
      foundVars.add(match[1]);
    }
    while ((match = varRegex.exec(solution)) !== null) {
      foundVars.add(match[1]);
    }
    
    foundVars.delete('animal');
    foundVars.delete('image');
    
    if (foundVars.size === 0) return;

    setPlaceholders((prev) => {
      let updated = false;
      const newPlaceholders = [...prev];
      
      foundVars.forEach((vName) => {
        if (!newPlaceholders.includes(vName)) {
          newPlaceholders.push(vName);
          updated = true;
        }
      });
      
      if (updated) {
        setPlaceholderValues((prevVals) => {
          const newPlaceholderValues = { ...prevVals };
          foundVars.forEach((vName) => {
            if (newPlaceholderValues[vName] === undefined) {
              newPlaceholderValues[vName] = '1-9';
            }
          });
          return newPlaceholderValues;
        });
        return newPlaceholders;
      }
      return prev;
    });
  }, [blueprint, solution]);

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
          const val = arr[Math.floor(Math.random() * arr.length)];
          const num = Number(val);
          if (val !== '' && !isNaN(num) && isFinite(num)) {
            return num;
          }
          return val;
        }
      } catch (e) {
        // Fall back to regular string splitting
      }
    }

    if (cleanStr.includes(',')) {
      const arr = cleanStr.split(',').map(s => s.trim()).filter(Boolean);
      const val = arr[Math.floor(Math.random() * arr.length)] || '';
      const num = Number(val);
      if (val !== '' && !isNaN(num) && isFinite(num)) {
        return num;
      }
      return val;
    }
    const rangeRegex = /^(\d+)-(\d+)$/;
    const match = cleanStr.match(rangeRegex);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    const num = Number(cleanStr);
    if (cleanStr !== '' && !isNaN(num) && isFinite(num)) {
      return num;
    }
    return cleanStr;
  };

  const shuffleSimulator = () => {
    setShuffling(true);
    const newResolved = {};

    const animalVal = String(placeholderValues.animal || '').trim();
    const imageVal = String(placeholderValues.image || '').trim();
    const currentAnimals = animalVal.split(',').map(s => s.trim()).filter(Boolean);
    const currentImages = imageVal.split(',').map(s => s.trim()).filter(Boolean);

    let sharedIndex = null;
    if (currentAnimals.length > 0 && currentImages.length === currentAnimals.length) {
      sharedIndex = Math.floor(Math.random() * currentAnimals.length);
    }

    placeholders.forEach(key => {
      if (key === 'animal' && sharedIndex !== null) {
        newResolved.animal = currentAnimals[sharedIndex];
      } else if (key === 'image' && sharedIndex !== null) {
        newResolved.image = currentImages[sharedIndex];
      } else {
        newResolved[key] = resolvePlaceholder(placeholderValues[key]);
      }
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
        const evaluationCtx = {
          ...resolvedValues,
          ...DRAWING_HELPERS
        };
        const evaluated = new Function('ctx', `with(ctx) { return ${expr}; }`)(evaluationCtx);
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
    const compiledVariables = [];

    const animalVal = String(placeholderValues.animal || '').trim();
    const imageVal = String(placeholderValues.image || '').trim();
    const currentAnimals = animalVal.split(',').map(s => s.trim()).filter(Boolean);
    const currentImages = imageVal.split(',').map(s => s.trim()).filter(Boolean);

    const hasParallelAnimalsAndImages = currentAnimals.length > 0 && currentImages.length === currentAnimals.length;

    if (hasParallelAnimalsAndImages) {
      const pool = currentAnimals.map((name, idx) => ({
        name,
        url: currentImages[idx]
      }));
      compiledVariables.push({
        name: 'animalObject',
        type: 'choice',
        pool
      });
      compiledVariables.push({
        name: 'animal',
        type: 'expression',
        formula: 'animalObject.name'
      });
      compiledVariables.push({
        name: 'image',
        type: 'expression',
        formula: 'animalObject.url'
      });
    }

    placeholders.forEach(key => {
      if (hasParallelAnimalsAndImages && (key === 'animal' || key === 'image')) {
        return; // Handled as synchronized object pool
      }

      const valString = String(placeholderValues[key] || '').trim();
      if (valString.includes(',')) {
        compiledVariables.push({
          name: key,
          type: 'choice',
          pool: valString.split(',').map(s => s.trim()).filter(Boolean)
        });
      } else {
        const rangeRegex = /^(\d+)-(\d+)$/;
        const match = valString.match(rangeRegex);
        if (match) {
          compiledVariables.push({
            name: key,
            type: 'range',
            min: parseInt(match[1], 10),
            max: parseInt(match[2], 10)
          });
        } else {
          compiledVariables.push({
            name: key,
            type: 'choice',
            pool: [valString]
          });
        }
      }
    });

    // Solve for inline evaluations to determine formula variables
    const mathRegex = /\{=\s*(.*?)\s*=\}/g;
    let exprCount = 0;
    let match;
    const nonDrawingExprNames = [];
    while ((match = mathRegex.exec(solution)) !== null) {
      exprCount++;
      const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
      const formula = match[1].trim();
      compiledVariables.push({
        name: exprName,
        type: 'expression',
        formula: formula
      });
      if (!formula.includes('draw')) {
        nonDrawingExprNames.push(exprName);
      }
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
            const exprName = nonDrawingExprNames[num - 1] || (num === 1 ? 'Result' : `Result_${num}`);
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

    const compiledOptions = (optionsType === 'mcq' || optionsType === 'visual_choice')
      ? mcqOptions.slice(0, optionsCount).filter(o => o.label.trim() !== '').map((o) => ({
          label: o.label,
          isCorrect: o.isCorrect
        }))
      : undefined;

    const compiledLayout = (optionsType === 'mcq' || optionsType === 'visual_choice')
      ? { columns: parseInt(mcqColumns, 10) }
      : undefined;

    const compiledJson = {
      id: `template-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title,
      subject,
      topic: activeTopic,
      grade,
      description: 'Generated via Template Masterclass',
      status: 'active',
      optionsType,
      blueprint,
      solution,
      questionText: blueprint,
      explanation: {
        sections: [{ type: 'text', content: solution }]
      },
      validationRules,
      variables: compiledVariables,
      ...(compiledOptions ? { options: compiledOptions } : {}),
      ...(compiledLayout ? { layoutConfig: compiledLayout } : {})
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
  }, [blueprint, solution, placeholderValues, title, subject, topic, grade, placeholders, visualComponent, visualProps, visualPosition, optionsType, mcqOptions, mcqColumns, optionsCount]);

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
        try {
          const evaluated = new Function('ctx', `with(ctx) { return ${resolvedStr}; }`)(resolvedValues);
          if (evaluated !== undefined && evaluated !== null && !isNaN(Number(evaluated))) {
            resolvedProps[key] = Number(evaluated);
          } else {
            resolvedProps[key] = resolvedStr;
          }
        } catch (e) {
          const num = Number(resolvedStr);
          resolvedProps[key] = Number.isFinite(num) ? num : resolvedStr;
        }
      } else {
        try {
          const evaluated = new Function('ctx', `with(ctx) { return ${strVal}; }`)(resolvedValues);
          if (evaluated !== undefined && evaluated !== null && !isNaN(Number(evaluated))) {
            resolvedProps[key] = Number(evaluated);
          } else {
            resolvedProps[key] = strVal;
          }
        } catch (e) {
          const num = Number(strVal);
          resolvedProps[key] = Number.isFinite(num) ? num : strVal;
        }
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
        <Link href="/template-generator/hub" style={{
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
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
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Question Type</label>
                <select
                  value={optionsType}
                  onChange={(e) => setOptionsType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}
                >
                  <option value="fill_blank">✏️ Fill in the Blank</option>
                  <option value="mcq">🔘 Multiple Choice (MCQ)</option>
                  <option value="visual_choice">🖼️ Visual Choice (MCQ with Options)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Option Columns</label>
                <select
                  value={mcqColumns}
                  onChange={(e) => setMcqColumns(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}
                  disabled={!['mcq', 'visual_choice'].includes(optionsType)}
                >
                  <option value="1">1 Column (Stacked)</option>
                  <option value="2">2 Columns (Side by Side)</option>
                  <option value="3">3 Columns</option>
                  <option value="4">4 Columns</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>No. of Options</label>
                <select
                  value={optionsCount}
                  onChange={(e) => setOptionsCount(parseInt(e.target.value, 10))}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}
                  disabled={!['mcq', 'visual_choice'].includes(optionsType)}
                >
                  <option value="2">2 Options</option>
                  <option value="3">3 Options</option>
                  <option value="4">4 Options</option>
                </select>
              </div>
            </div>

            {['mcq', 'visual_choice'].includes(optionsType) && (
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1.5px solid #edf2f7',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔘 MCQ Options & Distractors
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mcqOptions.slice(0, optionsCount).map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, width: '70px', color: '#64748b' }}>
                        Option {idx + 1}:
                      </span>
                      <input
                        type="text"
                        placeholder={`Enter option ${idx + 1} label (e.g. {{Result}} or {= drawBaseTenBlocks(...) =})`}
                        value={opt.label}
                        onChange={(e) => {
                          const newOpts = [...mcqOptions];
                          newOpts[idx] = { ...newOpts[idx], label: e.target.value };
                          setMcqOptions(newOpts);
                        }}
                        style={{ flex: 1, padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="radio"
                          name="mcqCorrect"
                          checked={opt.isCorrect}
                          onChange={() => {
                            const newOpts = mcqOptions.map((o, oIdx) => ({
                              ...o,
                              isCorrect: oIdx === idx
                            }));
                            setMcqOptions(newOpts);
                          }}
                        />
                        <span style={{ fontSize: '13px', color: opt.isCorrect ? '#166534' : '#64748b', fontWeight: opt.isCorrect ? 700 : 500 }}>
                          Correct
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  setPlaceholders,
                  visualComponent,
                  setVisualComponent,
                  blueprint,
                  setBlueprint,
                  solution,
                  setSolution
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
                <InlineMarkdown text={evaluateText(blueprint)} />
              </div>

              {/* Render Visual Preview */}
              {visualComponent !== 'none' && !evaluateText(blueprint).includes('<svg') && (
                <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
                  {renderVisualPreview()}
                </div>
              )}

              {/* Render MCQ Options if MCQ or Visual Choice is active */}
              {['mcq', 'visual_choice'].includes(optionsType) && (
                <div style={{
                  display: 'grid',
                        gridTemplateColumns: `repeat(${mcqColumns}, 1fr)`,
                  gap: '16px',
                  margin: '20px 0'
                }}>
                  {mcqOptions
                    .slice(0, optionsCount)
                    .map((opt, idx) => {
                      const evaluatedVal = evaluateText(opt.label);
                      const hasSvg = evaluatedVal.includes('<svg');
                      const isEmpty = opt.label.trim() === '';
                      
                      let textHeader = '';
                      let svgContent = evaluatedVal;
                      if (hasSvg) {
                        const svgIndex = evaluatedVal.indexOf('<svg');
                        textHeader = evaluatedVal.substring(0, svgIndex).trim();
                        svgContent = evaluatedVal.substring(svgIndex);
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            background: isEmpty ? '#f8fafc' : '#ffffff',
                            border: opt.isCorrect ? '2.5px solid #22c55e' : (isEmpty ? '1.5px dashed #cbd5e1' : '1.5px solid #e2e8f0'),
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: hasSvg ? '190px' : '60px',
                            position: 'relative',
                            boxShadow: opt.isCorrect ? '0 4px 12px rgba(34, 197, 94, 0.15)' : 'none',
                            opacity: isEmpty ? 0.6 : 1
                          }}
                        >
                          {opt.isCorrect && (
                            <span style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: '#22c55e',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '20px',
                              textTransform: 'uppercase'
                            }}>
                              Correct
                            </span>
                          )}
                          {isEmpty ? (
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8', fontStyle: 'italic' }}>
                              (Option {idx + 1} Empty)
                            </span>
                          ) : hasSvg ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              {textHeader && (
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {textHeader}
                                </span>
                              )}
                              <div
                                dangerouslySetInnerHTML={{ __html: svgContent }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </div>
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                              {evaluatedVal}
                            </span>
                          )}
                        </div>
                      );
                    })}
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
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    <InlineMarkdown text={evaluateText(solution)} />
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

function InlineMarkdown({ text }) {
  const cleanText = String(text || '').replace(/<!--[\s\S]*?-->/g, '');

  if (!cleanText.includes('<svg')) {
    const lines = cleanText.split('\n');
    const renderedElements = [];
    let currentTableRows = [];

    const renderTable = (rows, key) => {
      const cleanRows = rows.filter(r => !/^[|\s:-]+$/.test(r.trim()));
      if (cleanRows.length === 0) return null;

      return (
        <div key={key} style={{ overflowX: 'auto', margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
          <table style={{
            borderCollapse: 'collapse',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                {cleanRows[0].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((col, colIdx) => (
                  <th key={colIdx} style={{
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#475569',
                    textAlign: 'center'
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cleanRows.slice(1).map((row, rowIdx) => (
                <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {row.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((col, colIdx) => (
                    <td key={colIdx} style={{
                      border: '1px solid #e2e8f0',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0f172a',
                      textAlign: 'center'
                    }}>
                      {col.startsWith('<u>') && col.endsWith('</u>') ? (
                        <u style={{ color: '#16a34a', fontWeight: 900 }}>{col.replace(/<\/?u>/g, '')}</u>
                      ) : (
                        col
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        currentTableRows.push(line);
      } else {
        if (currentTableRows.length > 0) {
          renderedElements.push(renderTable(currentTableRows, `table-${i}`));
          currentTableRows = [];
        }
        renderedElements.push(
          <div key={i} style={{ minHeight: '1.2em' }}>
            {line}
          </div>
        );
      }
    }
    if (currentTableRows.length > 0) {
      renderedElements.push(renderTable(currentTableRows, `table-last`));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {renderedElements}
      </div>
    );
  }

  // If text contains SVG, split into SVG and non-SVG segments
  const segments = cleanText.split(/(<svg[\s\S]*?<\/svg>)/g);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {segments.map((segment, idx) => {
        const isSvg = segment.trim().startsWith('<svg') && segment.trim().endsWith('</svg>');
        if (isSvg) {
          return (
            <div
              key={idx}
              dangerouslySetInnerHTML={{ __html: segment }}
              style={{ display: 'flex', justifyContent: 'center', margin: '10px 0', width: '100%' }}
            />
          );
        }
        return <InlineMarkdown key={idx} text={segment} />;
      })}
    </div>
  );
}
