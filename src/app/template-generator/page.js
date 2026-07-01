'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PRESET_EASY, PRESET_MEDIUM, PRESET_HARD } from './presets';
import { COMPONENT_REGISTRY } from '../../lib/practice/generators/universal/components/index.js';

// Example Presets for Template Masterclass
const EXAMPLES = [
  {
    name: '🍎 Apple Addition (Default)',
    title: 'Addition – Apple Counting',
    subject: 'math',
    topic: 'addition',
    grade: '1',
    blueprint: '{{student}} has {{count1}} {{fruit}}.\nThey get {{count2}} more {{fruit}} from their friend {{friend}}.\nHow many {{fruit}} does {{student}} have now?',
    solution: 'Step 1: Start with {{count1}} {{fruit}}.\nStep 2: Add {{count2}} more {{fruit}} from {{friend}}.\nStep 3: Add them together: {{count1}} + {{count2}} = {= count1 + count2 =} {{fruit}}!',
    placeholders: {
      student: 'Marcus, Emma, Jamal, Sofia',
      friend: 'Aarav, Liam, Priya, Chloe',
      fruit: 'apples, bananas, strawberries',
      count1: '5-12',
      count2: '3-8'
    }
  },
  {
    name: '🍫 Chocolate Division',
    title: 'Division – Chocolate Sharing',
    subject: 'math',
    topic: 'division',
    grade: '3',
    blueprint: '{{student}} bought a pack of {{total}} {{item}}.\nThey want to share them equally among {{friends}} friends.\nHow many {{item}} will each friend get?',
    solution: 'Step 1: Start with {{total}} {{item}}.\nStep 2: Split them into {{friends}} equal groups.\nStep 3: {{total}} ÷ {{friends}} = {= total / friends =} {{item}} per friend!',
    placeholders: {
      student: 'Ria, Dev, Nina, Kabir',
      item: 'chocolates, cookies, candies',
      total: '12, 16, 20',
      friends: '2, 4'
    }
  },
  {
    name: '🎈 Balloon Subtraction',
    title: 'Subtraction – Balloon Pop',
    subject: 'math',
    topic: 'subtraction',
    grade: '2',
    blueprint: '{{student}} had {{total}} shiny {{color}} balloons.\nSuddenly, {{popped}} of them popped with a loud BANG! 💥\nHow many balloons does {{student}} have left?',
    solution: 'Step 1: Start with {{total}} {{color}} balloons.\nStep 2: Cross out the {{popped}} popped balloons.\nStep 3: {{total}} − {{popped}} = {= total - popped =} balloons left!',
    placeholders: {
      student: 'Aarav, Myra, Kian',
      color: 'red, blue, green',
      total: '8-15',
      popped: '2-6'
    }
  },
  {
    ...PRESET_EASY,
    name: '🎯 JNVST BODMAS Easy'
  },
  {
    ...PRESET_MEDIUM,
    name: '🎯 JNVST BODMAS Medium'
  },
  {
    ...PRESET_HARD,
    name: '🎯 JNVST BODMAS Hard'
  },
  {
    name: '🧮 Ten Frame Subtraction (Visual)',
    title: 'Subtraction – Ten Frame Model',
    subject: 'math',
    topic: 'subtraction',
    grade: '1',
    blueprint: 'Look at the ten frame. What is {{A}} minus {{B}}?',
    solution: 'Step 1: Start with {{A}} red counters.\nStep 2: Cross out {{B}} counters.\nStep 3: Count the remaining counters: {{A}} − {{B}} = {= A - B =}!',
    placeholders: {
      A: '6-10',
      B: '2-5'
    },
    visualComponent: 'TenFrame',
    visualProps: {
      filledCount: 'A',
      crossedOutCount: 'B',
      color: 'red'
    }
  },
  {
    name: '🍕 Fraction Circle Identification (Visual)',
    title: 'Fractions – Circle Model',
    subject: 'math',
    topic: 'fractions',
    grade: '2',
    blueprint: 'What fraction of the circle is shaded?',
    solution: 'Step 1: Count the total equal parts in the circle: {{total}} parts.\nStep 2: Count how many parts are shaded: {{shaded}} parts.\nStep 3: Write it as a fraction: {{shaded}}/{{total}}!',
    placeholders: {
      total: '4, 6, 8',
      shaded: '1-3'
    },
    visualComponent: 'FractionCircle',
    visualProps: {
      denominator: 'total',
      numerator: 'shaded',
      color: 'orange'
    }
  },
  {
    name: '⏰ Clock Time Reading (Visual)',
    title: 'Time – Telling Time',
    subject: 'math',
    topic: 'time',
    grade: '1',
    blueprint: 'What time is shown on the clock?',
    solution: 'Step 1: Look at the short hour hand: it points to {{hour}}.\nStep 2: Look at the long minute hand: it points to {{minute}}.\nStep 3: The time is {{hour}}:{= minute =}!',
    placeholders: {
      hour: '1-12',
      minute: '0, 15, 30, 45'
    },
    visualComponent: 'AnalogClock',
    visualProps: {
      hour: 'hour',
      minute: 'minute'
    }
  }
];

const VISUAL_COMPONENTS_CONFIG = {
  none: { name: 'None (Text Only)', props: [] },
  TenFrame: {
    name: 'Ten Frame 🧮',
    props: [
      { key: 'filledCount', label: 'Filled Count', placeholder: 'e.g. A or 5', default: 'A' },
      { key: 'crossedOutCount', label: 'Crossed Out Count', placeholder: 'e.g. B or 0', default: 'B' },
      { key: 'color', label: 'Color', placeholder: 'e.g. red, blue', default: 'red' }
    ]
  },
  NumberLine: {
    name: 'Number Line 📏',
    props: [
      { key: 'min', label: 'Minimum Value', placeholder: 'e.g. 0', default: '0' },
      { key: 'max', label: 'Maximum Value', placeholder: 'e.g. 10', default: '10' },
      { key: 'step', label: 'Step Interval', placeholder: 'e.g. 1', default: '1' },
      { key: 'pointValue', label: 'Highlighted Point', placeholder: 'e.g. Result', default: 'Result' },
      { key: 'color', label: 'Color', placeholder: 'e.g. blue', default: 'blue' }
    ]
  },
  BaseTenBlocks: {
    name: 'Base Ten Blocks 🧱',
    props: [
      { key: 'thousands', label: 'Thousands (Cubes)', placeholder: 'e.g. 0', default: '0' },
      { key: 'hundreds', label: 'Hundreds (Flats)', placeholder: 'e.g. count1', default: 'count1' },
      { key: 'tens', label: 'Tens (Rods)', placeholder: 'e.g. count2', default: 'count2' },
      { key: 'ones', label: 'Ones (Units)', placeholder: 'e.g. count3', default: 'count3' }
    ]
  },
  FractionCircle: {
    name: 'Fraction Circle 🍕',
    props: [
      { key: 'denominator', label: 'Denominator (Total Parts)', placeholder: 'e.g. count1', default: 'count1' },
      { key: 'numerator', label: 'Numerator (Shaded Parts)', placeholder: 'e.g. count2', default: 'count2' },
      { key: 'color', label: 'Shaded Color', placeholder: 'e.g. orange', default: 'orange' }
    ]
  },
  FractionBar: {
    name: 'Fraction Bar 🍫',
    props: [
      { key: 'denominator', label: 'Denominator (Total Parts)', placeholder: 'e.g. count1', default: 'count1' },
      { key: 'numerator', label: 'Numerator (Shaded Parts)', placeholder: 'e.g. count2', default: 'count2' },
      { key: 'color', label: 'Shaded Color', placeholder: 'e.g. blue', default: 'blue' }
    ]
  },
  AnalogClock: {
    name: 'Analog Clock ⏰',
    props: [
      { key: 'hour', label: 'Hour (1-12)', placeholder: 'e.g. count1', default: 'count1' },
      { key: 'minute', label: 'Minute (0-59)', placeholder: 'e.g. count2', default: 'count2' }
    ]
  },
  Thermometer: {
    name: 'Thermometer 🌡️',
    props: [
      { key: 'min', label: 'Min Temp', placeholder: 'e.g. 0', default: '0' },
      { key: 'max', label: 'Max Temp', placeholder: 'e.g. 100', default: '100' },
      { key: 'value', label: 'Temperature Value', placeholder: 'e.g. count1', default: 'count1' },
      { key: 'unit', label: 'Unit Label', placeholder: 'e.g. C or F', default: 'C' }
    ]
  },
  BalanceScale: {
    name: 'Balance Scale ⚖️',
    props: [
      { key: 'leftWeight', label: 'Left Weight', placeholder: 'e.g. count1', default: 'count1' },
      { key: 'rightWeight', label: 'Right Weight', placeholder: 'e.g. count2', default: 'count2' },
      { key: 'leftLabel', label: 'Left Label', placeholder: 'e.g. L', default: 'L' },
      { key: 'rightLabel', label: 'Right Label', placeholder: 'e.g. R', default: 'R' }
    ]
  }
};

export default function TemplateMasterclass() {
  // Main inputs
  const [blueprint, setBlueprint] = useState(EXAMPLES[0].blueprint);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [solution, setSolution] = useState(EXAMPLES[0].solution);
  const [optionsState, setOptionsState] = useState([
    { label: '{{Result}}', isCorrect: true },
    { label: '{{Result}} + 1', isCorrect: false },
    { label: '{{Result}} - 1', isCorrect: false },
    { label: '{{Result}} + 2', isCorrect: false }
  ]);
  const [placeholders, setPlaceholders] = useState(Object.keys(EXAMPLES[0].placeholders));
  const [placeholderValues, setPlaceholderValues] = useState(EXAMPLES[0].placeholders);
  const [blankAnswers, setBlankAnswers] = useState({});

  // Visual component configuration states
  const [visualComponent, setVisualComponent] = useState(EXAMPLES[0].visualComponent || 'none');
  const [visualProps, setVisualProps] = useState(EXAMPLES[0].visualProps || {});

  // Meta configurations for Publishing
  const [title, setTitle] = useState(EXAMPLES[0].title);
  const [subject, setSubject] = useState(EXAMPLES[0].subject);
  const [topic, setTopic] = useState(EXAMPLES[0].topic);
  const [grade, setGrade] = useState(EXAMPLES[0].grade);
  const [customTopic, setCustomTopic] = useState('');

  // Target database & Format state
  const [targetCollection, setTargetCollection] = useState('dynamic_templates'); // 'dynamic_templates' or 'templates' (JNVST)
  const [jnvstSection, setJnvstSection] = useState('arithmetic');
  const [jnvstTopic, setJnvstTopic] = useState('simplification');
  const [jnvstDifficulty, setJnvstDifficulty] = useState(0.5);

  // Simulator / Shuffled active values
  const [resolvedValues, setResolvedValues] = useState({});
  const [shuffledCount, setShuffledCount] = useState(0);
  const [shuffleClass, setShuffleClass] = useState('');

  // JSON compiler text
  const [jsonText, setJsonText] = useState('');
  const [isDevModeOpen, setIsDevModeOpen] = useState(false);

  // DB Publish State
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishError, setPublishError] = useState(null);

  // 1. Live extract placeholders whenever blueprint or solution changes
  useEffect(() => {
    const regex = /\{\{([^}]+)\}\}/g;
    const found = new Set();
    let match;

    while ((match = regex.exec(blueprint)) !== null) {
      found.add(match[1].trim());
    }
    while ((match = regex.exec(solution)) !== null) {
      found.add(match[1].trim());
    }

    const currentList = Array.from(found);
    setPlaceholders(currentList);

    // Initialize default values for newly added placeholders
    setPlaceholderValues(prev => {
      const next = { ...prev };
      let updated = false;
      currentList.forEach(key => {
        if (!(key in next)) {
          updated = true;
          if (key === 'student' || key === 'name' || key.includes('name')) {
            next[key] = 'Marcus, Emma, Jamal, Sofia';
          } else if (key.includes('count') || key.includes('apples') || key.includes('balloons') || key.includes('chocolates') || key.includes('number')) {
            next[key] = '5-10';
          } else {
            next[key] = '2-6';
          }
        }
      });
      return updated ? next : prev;
    });
  }, [blueprint, solution]);

  const extractBlanks = (text) => {
    if (!text) return [];
    const regex = /(\[\]|\[\[([a-zA-Z0-9_-]+)\]\])/g;
    const list = [];
    let match;
    let anonCount = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match[1] === '[]') {
        anonCount++;
        list.push(`blank${anonCount}`);
      } else {
        list.push(match[2]);
      }
    }
    return list;
  };

  useEffect(() => {
    const detected = extractBlanks(blueprint);
    setBlankAnswers(prev => {
      const next = { ...prev };
      let updated = false;
      detected.forEach((blankId, index) => {
        if (!(blankId in next)) {
          updated = true;
          // Default guess logic
          const matchedVar = placeholders.find(p => p.toLowerCase() === blankId.toLowerCase());
          if (matchedVar) {
            next[blankId] = `{{${matchedVar}}}`;
          } else {
            // Fallback to Result, or Result_N based on index
            const num = index + 1;
            const exprName = num === 1 ? 'Result' : `Result_${num}`;
            next[blankId] = `{{${exprName}}}`;
          }
        }
      });
      
      // Remove deleted blanks
      Object.keys(next).forEach(key => {
        if (!detected.includes(key)) {
          delete next[key];
          updated = true;
        }
      });
      
      return updated ? next : prev;
    });
  }, [blueprint, placeholders]);

  const checkIsFormula = (valString) => {
    const trimmed = valString.trim();
    if (Number.isFinite(Number(trimmed))) return false;
    if (/[a-zA-Z_]\.[a-zA-Z_]/.test(trimmed)) return true;
    if (/[+\-*/]/.test(trimmed)) return true;
    return false;
  };

  // 2. Resolve placeholers to active values (triggered initially & on Shuffle)
  const handleShuffle = () => {
    setShuffleClass('shuffling');
    setTimeout(() => setShuffleClass(''), 450);

    const resolved = {};
    placeholders.forEach(key => {
      const valString = String(placeholderValues[key] || '').trim();
      
      // JSON Array or Object parse
      if ((valString.startsWith('[') && valString.endsWith(']')) || (valString.startsWith('{') && valString.endsWith('}'))) {
        try {
          const parsed = JSON.parse(valString);
          if (Array.isArray(parsed)) {
            resolved[key] = parsed[Math.floor(Math.random() * parsed.length)];
          } else {
            resolved[key] = parsed;
          }
          return;
        } catch {
          // fallback
        }
      }

      // Range parse (e.g. 5-10)
      const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(valString);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        resolved[key] = Math.floor(Math.random() * (max - min + 1)) + min;
      }
      // Comma-separated list parse
      else if (valString.includes(',')) {
        const list = valString.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 0) {
          resolved[key] = list[Math.floor(Math.random() * list.length)];
        } else {
          resolved[key] = valString;
        }
      }
      // Constant / literal or formula
      else {
        const num = Number(valString);
        if (Number.isFinite(num)) {
          resolved[key] = num;
        } else {
          // If it contains math operators or property access, treat as formula
          const isFormula = checkIsFormula(valString);
          if (isFormula) {
            resolved[key] = { isFormula: true, formula: valString };
          } else {
            resolved[key] = valString;
          }
        }
      }
    });

    // Resolve formula placeholders dynamically (handles dependencies between placeholders)
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 5) {
      changed = false;
      iterations++;
      for (const [k, val] of Object.entries(resolved)) {
        if (val && typeof val === 'object' && val.isFormula) {
          let substitutedExpr = val.formula;
          let canEvaluate = true;
          
          Object.keys(resolved).forEach(varKey => {
            const varVal = resolved[varKey];
            if (varVal && typeof varVal === 'object' && varVal.isFormula) {
              return; // wait until referenced variable is resolved
            }
            const isNumeric = typeof varVal === 'number' || (typeof varVal === 'string' && !isNaN(Number(varVal)));
            const replacement = isNumeric ? String(varVal) : JSON.stringify(varVal);
            const varRegex = new RegExp(`\\b${varKey}\\b`, 'g');
            substitutedExpr = substitutedExpr.replace(varRegex, replacement);
          });
          
          const strippedExpr = substitutedExpr.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');
          if (/[a-zA-Z_]/.test(strippedExpr)) {
            canEvaluate = false;
          }
          
          if (canEvaluate) {
            try {
              let evaluated = Function('return (' + substitutedExpr + ')')();
              if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
                evaluated = Math.round(evaluated * 100) / 100;
              }
              resolved[k] = evaluated;
              changed = true;
            } catch {
              const sanitized = substitutedExpr.replace(/[^0-9+\-*/().\s%]/g, '');
              try {
                let evaluated = Function('return (' + sanitized + ')')();
                if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
                  evaluated = Math.round(evaluated * 100) / 100;
                }
                resolved[k] = evaluated;
                changed = true;
              } catch {
                resolved[k] = `[Error]`;
                changed = true;
              }
            }
          }
        }
      }
    }

    // Evaluate math expressions from solution and store in resolved for preview
    const mathRegex = /\{=\s*(.*?)\s*=\}/g;
    let exprCount = 0;
    let match;
    while ((match = mathRegex.exec(solution)) !== null) {
      exprCount++;
      const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
      const expr = match[1].trim();
      
      let substitutedExpr = expr;
      Object.keys(resolved).forEach(k => {
        const val = resolved[k];
        const isNumeric = typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)));
        const replacement = isNumeric ? String(val) : JSON.stringify(val);
        const varRegex = new RegExp(`\\b${k}\\b`, 'g');
        substitutedExpr = substitutedExpr.replace(varRegex, replacement);
      });
      
      try {
        let evaluated = Function('return (' + substitutedExpr + ')')();
        if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
          evaluated = Math.round(evaluated * 100) / 100;
        }
        resolved[exprName] = evaluated;
      } catch {
        const sanitized = substitutedExpr.replace(/[^0-9+\-*/().\s%]/g, '');
        try {
          let evaluated = Function('return (' + sanitized + ')')();
          if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
            evaluated = Math.round(evaluated * 100) / 100;
          }
          resolved[exprName] = evaluated;
        } catch {
          resolved[exprName] = `[Math Error: ${expr}]`;
        }
      }
    }

    setResolvedValues(resolved);
    setShuffledCount(prev => prev + 1);
  };

  // Run initial shuffle on load or when placeholders configuration list changes
  useEffect(() => {
    if (placeholders.length > 0) {
      handleShuffle();
    }
  }, [placeholders, placeholderValues, solution]);

  // 3. Helper to evaluate math expressions and substitute placeholders
  const evaluateText = (tplText) => {
    if (!tplText) return '';
    let result = tplText;

    // Substitute {{placeholder}} and [placeholder] variables
    Object.keys(resolvedValues).forEach(key => {
      const val = resolvedValues[key];
      // Escape special regex characters in the placeholder key
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Replace {{key}}
      result = result.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), val);
      // Replace [key]
      result = result.replace(new RegExp(`\\[\\s*${escapedKey}\\s*\\]`, 'g'), val);
    });

    // Evaluate math expressions: {= expression =}
    const mathRegex = /\{=\s*(.*?)\s*=\}/g;
    result = result.replace(mathRegex, (match, expr) => {
      let substitutedExpr = expr;
      
      // Replace variable names inside the math expression with their resolved numbers
      Object.keys(resolvedValues).forEach(key => {
        const val = resolvedValues[key];
        if (typeof val === 'number' || !isNaN(Number(val))) {
          // Use boundary check to match the variable exactly
          const varRegex = new RegExp(`\\b${key}\\b`, 'g');
          substitutedExpr = substitutedExpr.replace(varRegex, val);
        }
      });

      // Sanitize math string to prevent arbitrary code execution
      const sanitized = substitutedExpr.replace(/[^0-9+\-*/().\s%]/g, '');
      try {
        let evaluated = Function('return (' + sanitized + ')')();
        if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
          evaluated = Math.round(evaluated * 100) / 100;
        }
        return evaluated;
      } catch (err) {
        return `[Math Error: ${expr}]`;
      }
    });

    return result;
  };

  // 3b. Helper to render text with styled input blanks for live preview
  const renderEvaluatedText = (tplText) => {
    if (!tplText) return null;
    const evaluatedString = evaluateText(tplText);
    
    // Detect either "[]" or "[[blank1]]" / "[[blank2]]" etc.
    const blankRegex = /(\[\]|\[\[blank\d+\]\])/g;
    const parts = evaluatedString.split(blankRegex);
    
    let blankIndex = 0;
    return parts.map((part, index) => {
      if (blankRegex.test(part)) {
        blankIndex++;
        const exprName = blankIndex === 1 ? 'Result' : `Result_${blankIndex}`;
        const answerVal = resolvedValues[exprName] !== undefined ? resolvedValues[exprName] : '?';
        
        return (
          <span 
            key={index} 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f5f9',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              padding: '2px 8px',
              margin: '0 4px',
              fontWeight: '800',
              color: '#4f46e5',
              fontSize: '1rem',
              minWidth: '50px',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            {answerVal}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // 3c. Render the live SVG preview of the selected visual component
  const renderVisualPreview = () => {
    if (!visualComponent || visualComponent === 'none') return null;
    const builder = COMPONENT_REGISTRY[visualComponent];
    if (!builder) return null;

    // Resolve each prop value: if the value matches a resolved variable name, use it; otherwise use literal
    const resolvedProps = {};
    const config = VISUAL_COMPONENTS_CONFIG[visualComponent];
    if (config) {
      config.props.forEach(({ key }) => {
        const rawVal = visualProps[key];
        if (rawVal === undefined || rawVal === null || rawVal === '') return;
        const strVal = String(rawVal).trim();
        // If it references a resolved variable
        if (resolvedValues[strVal] !== undefined) {
          const num = Number(resolvedValues[strVal]);
          resolvedProps[key] = Number.isFinite(num) ? num : resolvedValues[strVal];
        } else {
          const num = Number(strVal);
          resolvedProps[key] = Number.isFinite(num) ? num : strVal;
        }
      });
    }

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
        <div style={{
          marginTop: 16,
          borderRadius: 16,
          border: '2px solid rgba(16, 185, 129, 0.2)',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🎨 Live Visual Preview — {VISUAL_COMPONENTS_CONFIG[visualComponent]?.name || visualComponent}
          </div>
          <div
            style={{ maxWidth: '100%', overflow: 'hidden', borderRadius: 12 }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      );
    } catch (err) {
      return (
        <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: 8 }}>
          ⚠️ Preview error: {err.message}
        </div>
      );
    }
  };

  // 4. Auto-generate Dynamic Template JSON recipe
  useEffect(() => {
    const activeTopic = topic === 'custom' ? (customTopic || 'custom-topic') : topic;

    if (targetCollection === 'templates') {
      // Competitive / JNVST schema
      const jnvstVariables = {};
      placeholders.forEach(key => {
        const valString = String(placeholderValues[key] || '').trim();
        
        let isJson = false;
        let parsedJson = null;
        if ((valString.startsWith('[') && valString.endsWith(']')) || (valString.startsWith('{') && valString.endsWith('}'))) {
          try {
            parsedJson = JSON.parse(valString);
            isJson = true;
          } catch {}
        }

        const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(valString);
        if (isJson) {
          jnvstVariables[key] = parsedJson;
        } else if (rangeMatch) {
          jnvstVariables[key] = {
            min: parseInt(rangeMatch[1], 10),
            max: parseInt(rangeMatch[2], 10)
          };
        } else if (valString.includes(',')) {
          jnvstVariables[key] = valString.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          jnvstVariables[key] = Number.isFinite(Number(valString)) ? Number(valString) : valString;
        }
      });

      const jnvstDerivations = {};
      const mathRegex = /\{=\s*(.*?)\s*=\}/g;
      let exprCount = 0;
      let match;
      let modifiedSolution = solution;

      while ((match = mathRegex.exec(solution)) !== null) {
        exprCount++;
        const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
        jnvstDerivations[exprName] = match[1].trim();
        modifiedSolution = modifiedSolution.replace(match[0], `{{${exprName}}}`);
      }

      // For JNVST, replace [] with ______ (blank line)
      let modifiedBlueprint = blueprint;
      modifiedBlueprint = modifiedBlueprint.replace(/\[\]/g, '______');

      const activeJnvstTopic = jnvstTopic === 'custom' ? (customTopic || 'custom-topic') : jnvstTopic;
      const difficultyLevel = jnvstDifficulty < 0.4 ? 'easy' : (jnvstDifficulty >= 0.7 ? 'hard' : 'medium');

      const templateId = 'template-' + String(title || 'custom').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const compiledJson = {
        id: templateId,
        _id: templateId,
        name: title || 'Custom JNVST Template',
        type: 'parameterized',
        examId: 'jnvst',
        section: jnvstSection,
        topic: activeJnvstTopic,
        difficulty: Number(jnvstDifficulty),
        status: 'active',
        config: {
          name: title || 'Custom JNVST Template',
          title: title || 'Custom JNVST Template',
          description: 'Generated via Template Masterclass',
          grade: '',
          skillId: '',
          competencyId: '',
          difficultyLevel: difficultyLevel,
          tags: [activeJnvstTopic],
          constraints: {
            uniqueOptions: true,
            preventDuplicateWords: true,
            minOptionCount: 4,
            maxOptionCount: 4
          },
          layoutConfig: {
            mode: 'prompt_top',
            responsiveTarget: 'desktop_first',
            clickToSubmit: false
          },
          interaction: {
            engine: 'mcq',
            inputMode: 'choice'
          },
          variables: jnvstVariables,
          derivations: jnvstDerivations,
          options: optionsState.map(opt => ({
            label: opt.label,
            isCorrect: opt.isCorrect
          })),
          questionTemplate: modifiedBlueprint,
          explanationTemplate: modifiedSolution
        }
      };

      setJsonText(JSON.stringify(compiledJson, null, 2));
    } else {
      // General curriculum schema
      const templateId = 'template-' + String(title || 'custom').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const compiledVariables = [];

      placeholders.forEach(key => {
        const valString = String(placeholderValues[key] || '').trim();
        
        let isJson = false;
        let parsedJson = null;
        if ((valString.startsWith('[') && valString.endsWith(']')) || (valString.startsWith('{') && valString.endsWith('}'))) {
          try {
            parsedJson = JSON.parse(valString);
            isJson = true;
          } catch {}
        }

        const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(valString);
        
        if (isJson) {
          compiledVariables.push({
            name: key,
            type: 'array',
            values: Array.isArray(parsedJson) ? parsedJson : [parsedJson]
          });
        } else if (rangeMatch) {
          compiledVariables.push({
            name: key,
            type: 'integer',
            min: parseInt(rangeMatch[1], 10),
            max: parseInt(rangeMatch[2], 10)
          });
        } else if (valString.includes(',')) {
          compiledVariables.push({
            name: key,
            type: 'array',
            values: valString.split(',').map(s => s.trim()).filter(Boolean)
          });
        } else {
          const isFormula = checkIsFormula(valString);
          if (isFormula) {
            compiledVariables.push({
              name: key,
              type: 'computed',
              formula: valString
            });
          } else {
            compiledVariables.push({
              name: key,
              type: 'constant',
              value: Number.isFinite(Number(valString)) ? Number(valString) : valString
            });
          }
        }
      });

      const mathRegex = /\{=\s*(.*?)\s*=\}/g;
      let exprCount = 0;
      let match;
      let modifiedSolution = solution;

      while ((match = mathRegex.exec(solution)) !== null) {
        exprCount++;
        const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
        compiledVariables.push({
          name: exprName,
          type: 'expression',
          formula: match[1].trim()
        });
        modifiedSolution = modifiedSolution.replace(match[0], `[${exprName}]`);
      }

      let modifiedBlueprint = blueprint;
      placeholders.forEach(key => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        modifiedBlueprint = modifiedBlueprint.replace(regex, `[${key}]`);
        modifiedSolution = modifiedSolution.replace(regex, `[${key}]`);
      });

      // Parse blanks in blueprint (e.g. [] or [[blankN]] or [[count1]])
      let blankCount = 0;
      modifiedBlueprint = modifiedBlueprint.replace(/\[\]/g, () => {
        blankCount++;
        while (blueprint.includes(`[[blank${blankCount}]]`)) {
          blankCount++;
        }
        return `[[blank${blankCount}]]`;
      });

      // Find all custom blanks e.g. [[count1]], [[Result]], [[blank1]]
      const blanksRegex = /\[\[([^\]]+)\]\]/g;
      const foundBlanks = [];
      let matchBlank;
      while ((matchBlank = blanksRegex.exec(modifiedBlueprint)) !== null) {
        const bId = matchBlank[1].trim();
        if (!foundBlanks.includes(bId)) {
          foundBlanks.push(bId);
        }
      }

      const hasMathResult = exprCount > 0;
      
      let optionsType = 'mcq';
      let interaction = {
        engine: 'mcq',
        inputMode: 'choice'
      };
      let options = null;
      let answerObj = null;
      let validationRules = [];

      if (foundBlanks.length > 0) {
        optionsType = 'fillInTheBlank';
        interaction = {
          engine: 'fill_blank',
          inputMode: 'number'
        };
        answerObj = {};
        
        foundBlanks.forEach((blankId) => {
          if (blankAnswers[blankId]) {
            answerObj[blankId] = blankAnswers[blankId].replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]');
          } else {
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
          }
        });
        
        validationRules = [
          {
            type: 'exact_match',
            target: 'answer',
            value: answerObj
          }
        ];
      } else {
        const finalResultVar = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
        options = optionsState.map(opt => {
          const labelWithBrackets = opt.label.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]');
          return {
            label: labelWithBrackets,
            isCorrect: opt.isCorrect
          };
        });

        const correctOpt = options.find(o => o.isCorrect);
        validationRules = [
          {
            type: 'exact_match',
            target: 'answer',
            value: correctOpt ? correctOpt.label : (hasMathResult ? `[${finalResultVar}]` : '')
          }
        ];
      }

      const compiledJson = {
        id: templateId,
        title: title || 'Custom Masterclass Template',
        subject: subject,
        topic: activeTopic,
        grade: grade,
        optionsType: optionsType,
        interaction: interaction,
        ...(visualComponent !== 'none' ? {
          visuals: [
            {
              component: visualComponent,
              props: visualProps
            }
          ]
        } : {}),
        ...(answerObj ? { answer: answerObj } : {}),
        questionText: modifiedBlueprint,
        explanation: {
          sections: [
            {
              type: 'text',
              content: modifiedSolution
            }
          ]
        },
        ...(options ? { options } : {}),
        validationRules: validationRules,
        variables: compiledVariables
      };

      setJsonText(JSON.stringify(compiledJson, null, 2));
    }
  }, [blueprint, solution, placeholderValues, title, subject, topic, grade, customTopic, placeholders, targetCollection, jnvstSection, jnvstTopic, jnvstDifficulty, visualComponent, visualProps]);

  // 5. Publish generated dynamic template to MongoDB
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
        setPublishError(data.error || 'Failed to save template to database.');
      }
    } catch (err) {
      setPublishError(err.message || 'JSON is invalid or API failed.');
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) {
      setAiStatus({ success: false, message: 'Please enter a prompt first.' });
      return;
    }
    setIsGeneratingAi(true);
    setAiStatus({ success: true, message: 'Constructing template...' });
    try {
      const res = await fetch('/api/admin/templates/generate-masterclass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const payload = data.data;
        if (payload.blueprint) setBlueprint(payload.blueprint);
        if (payload.solution) setSolution(payload.solution);
        if (payload.title) setTitle(payload.title);
        if (payload.subject) setSubject(payload.subject);
        if (payload.topic) setTopic(payload.topic);
        if (payload.grade) setGrade(payload.grade);
        if (payload.placeholders) {
          setPlaceholderValues(prev => ({
            ...prev,
            ...payload.placeholders
          }));
          setPlaceholders(Object.keys(payload.placeholders));
        }
        if (payload.options && Array.isArray(payload.options)) {
          setOptionsState(payload.options);
        } else {
          setOptionsState([
            { label: '{{Result}}', isCorrect: true },
            { label: '{{Result}} + 1', isCorrect: false },
            { label: '{{Result}} - 1', isCorrect: false },
            { label: '{{Result}} + 2', isCorrect: false }
          ]);
        }
        setAiStatus({ success: true, message: 'Template populated successfully!' });
      } else {
        setAiStatus({ success: false, message: data.error || 'Failed to generate template.' });
      }
    } catch (err) {
      console.error(err);
      setAiStatus({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 6. Handle loading Example Presets
  const loadPreset = (preset) => {
    if (preset.examId === 'jnvst' || preset.exam === 'jnvst') {
      setTargetCollection('templates');
      setTitle(preset.name);
      setJnvstSection(preset.section || 'arithmetic');
      setJnvstTopic(preset.topic || 'simplification');
      setJnvstDifficulty(preset.difficulty || 0.5);
      
      const config = preset.config || {};
      setBlueprint(config.questionTemplate || '');
      setSolution(config.explanationTemplate || '');
      
      const initialPlaceholders = {};
      if (config.variables) {
        Object.entries(config.variables).forEach(([k, v]) => {
          if (v && typeof v === 'object') {
            if ('min' in v && 'max' in v) {
              initialPlaceholders[k] = `${v.min}-${v.max}`;
            } else if (Array.isArray(v)) {
              initialPlaceholders[k] = v.join(', ');
            } else if (v.values && Array.isArray(v.values)) {
              initialPlaceholders[k] = v.values.join(', ');
            } else {
              initialPlaceholders[k] = String(v.value ?? '');
            }
          } else {
            initialPlaceholders[k] = String(v ?? '');
          }
        });
      }
      setPlaceholderValues(initialPlaceholders);
      setVisualComponent('none');
      setVisualProps({});

      if (config.options && Array.isArray(config.options)) {
        const mapped = config.options.map(opt => ({
          label: String(opt.label || opt.value || '').replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}'),
          isCorrect: opt.isCorrect === true || opt.isCorrect === 'true'
        }));
        setOptionsState(mapped);
      } else {
        setOptionsState([
          { label: '{{Result}}', isCorrect: true },
          { label: '{{Result}} + 1', isCorrect: false },
          { label: '{{Result}} - 1', isCorrect: false },
          { label: '{{Result}} + 2', isCorrect: false }
        ]);
      }
    } else {
      setTargetCollection('dynamic_templates');
      setTitle(preset.title);
      setSubject(preset.subject);
      setTopic(preset.topic);
      setGrade(preset.grade);
      setBlueprint(preset.blueprint);
      setSolution(preset.solution);
      setPlaceholderValues(preset.placeholders);
      setVisualComponent(preset.visualComponent || 'none');
      setVisualProps(preset.visualProps || {});

      if (preset.options && Array.isArray(preset.options)) {
        const mapped = preset.options.map(opt => ({
          label: String(opt.label || opt.value || '').replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}'),
          isCorrect: opt.isCorrect === true || opt.isCorrect === 'true'
        }));
        setOptionsState(mapped);
      } else {
        setOptionsState([
          { label: '{{Result}}', isCorrect: true },
          { label: '{{Result}} + 1', isCorrect: false },
          { label: '{{Result}} - 1', isCorrect: false },
          { label: '{{Result}} + 2', isCorrect: false }
        ]);
      }
    }
    setPublishStatus(null);
    setPublishError(null);
  };

  return (
    <div className="mc-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        .mc-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Outfit', sans-serif;
          color: #0f172a;
          padding-bottom: 80px;
        }

        /* Nav Bar */
        .mc-nav {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 24px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .mc-brand {
          font-size: 1.3rem;
          font-weight: 900;
          color: #4f46e5;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mc-brand span {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 800;
        }
        .mc-example-dropdown {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .mc-example-dropdown:hover {
          background: #e2e8f0;
        }

        /* Container Layout */
        .mc-grid {
          max-width: 1240px;
          margin: 32px auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 32px;
          align-items: start;
        }
        @media (max-width: 968px) {
          .mc-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Column Elements */
        .mc-editor-col {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .mc-preview-col {
          position: sticky;
          top: 102px;
        }

        /* Premium Cards */
        .mc-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(15,23,42,0.03), 0 8px 16px -6px rgba(15,23,42,0.03);
          border: 1.5px solid #e2e8f0;
          padding: 28px;
          position: relative;
          transition: border-color 0.2s;
        }
        .mc-card-blue { border-left: 6px solid #4f46e5; }
        .mc-card-amber { border-left: 6px solid #f59e0b; }
        .mc-card-green { border-left: 6px solid #10b981; }
        .mc-card-purple { border-left: 6px solid #a855f7; }

        /* Step Badges */
        .mc-step-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          margin-right: 12px;
        }
        .mc-step-badge-blue { background: #eef2ff; color: #4f46e5; }
        .mc-step-badge-amber { background: #fffbeb; color: #d97706; }
        .mc-step-badge-green { background: #f0fdf4; color: #059669; }
        .mc-step-badge-purple { background: #faf5ff; color: #a855f7; }

        /* Headings */
        .mc-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1e293b;
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }
        .mc-card-desc {
          font-size: 0.95rem;
          color: #64748b;
          margin-bottom: 20px;
          line-height: 1.45;
        }

        /* Tip Banners */
        .mc-tip-banner {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .mc-tip-banner-blue {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        }
        .mc-tip-banner-purple {
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          color: #6b21a8;
        }

        /* Inputs */
        .mc-textarea {
          width: 100%;
          min-height: 110px;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          font-size: 1rem;
          font-family: inherit;
          color: #1e293b;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s;
          box-sizing: border-box;
          line-height: 1.5;
        }
        .mc-textarea:focus {
          border-color: #4f46e5;
        }

        /* Step 2 Placeholder List */
        .mc-placeholder-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mc-placeholder-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .mc-tag {
          background: #fffbeb;
          color: #b45309;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.9rem;
          border: 1.5px solid #fef3c7;
          min-width: 100px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(180,83,9,0.03);
        }
        .mc-arrow {
          color: #94a3b8;
          font-size: 1.1rem;
          font-weight: bold;
        }
        .mc-input {
          flex: 1;
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1e293b;
          outline: none;
          transition: border-color 0.15s;
        }
        .mc-input:focus {
          border-color: #f59e0b;
        }

        /* Shuffle Button & Animation */
        .mc-shuffle-btn {
          background: #e6fcf5;
          color: #0ca678;
          border: 1.5px solid #c3fae8;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          position: absolute;
          top: 24px;
          right: 28px;
          box-shadow: 0 4px 6px -1px rgba(12,166,120,0.06);
        }
        .mc-shuffle-btn:hover {
          background: #c3fae8;
          transform: translateY(-1px);
        }
        .mc-shuffle-icon {
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mc-shuffle-btn.shuffling .mc-shuffle-icon {
          transform: rotate(360deg);
        }

        /* Simulator Content */
        .mc-sim-box {
          background: white;
          border-radius: 18px;
          border: 1.5px solid #f1f5f9;
          padding: 24px;
          min-height: 200px;
          box-shadow: inset 0 2px 6px rgba(15,23,42,0.02);
        }
        .mc-sim-problem {
          font-size: 1.15rem;
          line-height: 1.6;
          font-weight: 500;
          color: #0f172a;
          margin-bottom: 24px;
          white-space: pre-line;
        }
        .mc-sim-solution-box {
          background: #f0fdf4;
          border: 2px dashed #bbf7d0;
          border-radius: 14px;
          padding: 20px;
        }
        .mc-sim-solution-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #15803d;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .mc-sim-solution-steps {
          font-size: 0.98rem;
          line-height: 1.6;
          color: #1e3a1e;
          font-weight: 500;
          white-space: pre-line;
        }

        /* Success Alert */
        .mc-success-alert {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          color: #065f46;
          border-radius: 16px;
          padding: 14px 20px;
          font-weight: 700;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          box-shadow: 0 4px 6px -1px rgba(6,95,70,0.04);
        }

        /* Developer Drawer Drawer */
        .mc-dev-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .mc-dev-toggle {
          background: #f1f5f9;
          border: none;
          color: #475569;
          font-weight: 800;
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .mc-dev-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 18px 0;
        }
        @media (max-width: 640px) {
          .mc-dev-form-grid {
            grid-template-columns: 1fr;
          }
        }
        .mc-dev-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mc-dev-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #475569;
        }

        /* Publish Actions */
        .mc-publish-row {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-top: 18px;
        }
        .mc-publish-btn {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: white;
          font-weight: 800;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          transition: transform 0.15s, opacity 0.15s;
          box-shadow: 0 4px 12px rgba(79,70,229,0.25);
        }
        .mc-publish-btn:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .mc-publish-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }
        .mc-db-status {
          font-weight: 700;
          font-size: 0.9rem;
        }
        
      ` }} />

      {/* Navigation */}
      <div className="mc-nav">
        <Link href="/admin-v2" className="mc-brand">
          🎓 Template Masterclass
          <span>Beta</span>
        </Link>
        <select 
          className="mc-example-dropdown"
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            if (!isNaN(idx) && EXAMPLES[idx]) {
              loadPreset(EXAMPLES[idx]);
            }
          }}
          defaultValue="0"
        >
          <option value="" disabled>⚡ Show Me an Example</option>
          {EXAMPLES.map((ex, i) => (
            <option key={i} value={i}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Main Grid */}
      <div className="mc-grid">
        {/* Left column: Editor */}
        <div className="mc-editor-col">

          {/* AI Template Generator Card */}
          <div className="mc-card mc-card-purple" style={{ marginBottom: '24px' }}>
            <h3 className="mc-card-title">
              <span className="mc-step-badge mc-step-badge-purple">🪄</span>
              AI Template Generator
            </h3>
            <p className="mc-card-desc">
              Enter a raw math problem and solution example below. The AI will convert it into a dynamic, parameterized template.
            </p>
            <textarea
              className="mc-textarea"
              style={{ minHeight: '90px', border: '1px solid #d8b4fe' }}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Sofia has 9 apples. They get 8 more apples from their friend Aarav. How many apples does Sofia have now? Solution: Step 1: Start with 9 apples. Step 2: Add 8 more apples from Aarav. Step 3: Add them together: 9 + 8 = 17 apples!"
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="mc-publish-btn"
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', 
                  boxShadow: '0 4px 12px rgba(168,85,247,0.25)',
                  padding: '10px 20px',
                  fontSize: '0.9rem'
                }}
                onClick={handleGenerateAiTemplate}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? '✨ Constructing Blueprint...' : '🪄 Generate Template blueprint'}
              </button>
              {aiStatus && (
                <span style={{ 
                  color: aiStatus.success ? '#16a34a' : '#dc2626', 
                  fontSize: '0.88rem', 
                  fontWeight: '800' 
                }}>
                  {aiStatus.message}
                </span>
              )}
            </div>
          </div>
          
          {/* Card 1: Blueprint & Solution */}
          <div className="mc-card mc-card-blue">
            <h3 className="mc-card-title">
              <span className="mc-step-badge mc-step-badge-blue">1</span>
              Write your Blueprint
            </h3>
            <p className="mc-card-desc">
              Type your math problem below. Wrap any word you want to change later in <code>{"{{double braces}}"}</code>.
              <strong> To create a Fill-in-the-Blank question, simply type <code>{"[]"}</code> where the answer blank should appear!</strong>
            </p>
            <div className="mc-tip-banner mc-tip-banner-blue" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <div>💡 <strong>Placeholder variables:</strong> Wrap name/range in <code>{"{{variable_name}}"}</code> (e.g. <code>{"{{apples}}"}</code>)</div>
              <div>✏️ <strong>Fill-in-the-Blank:</strong> Type <code>{"[]"}</code> to make an entry blank (e.g. <code>{"How many [] apples does..."}</code>)</div>
            </div>
            
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: extractBlanks(blueprint).length > 0 ? '#eff6ff' : '#ecfdf5',
              border: extractBlanks(blueprint).length > 0 ? '1px solid #bfdbfe' : '1px solid #a7f3d0',
              color: extractBlanks(blueprint).length > 0 ? '#1e40af' : '#065f46',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '800',
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <span>Active Question Type:</span>
              <strong>{extractBlanks(blueprint).length > 0 ? '✏️ Fill-in-the-Blank (Answer Config Enabled)' : '🔢 Multiple-Choice (MCQ Options Enabled)'}</strong>
            </div>

            <textarea
              className="mc-textarea"
              value={blueprint}
              onChange={(e) => setBlueprint(e.target.value)}
              placeholder="e.g. {{student}} has {{apples}} apples..."
            />

            <div style={{ marginTop: '28px' }}>
              <h3 className="mc-card-title">
                <span className="mc-step-badge mc-step-badge-blue">1b</span>
                Write the Kid-Friendly Solution
              </h3>
              <p className="mc-card-desc">
                Explain the steps simply. Use <code>{"{= math =}"}</code> to automatically calculate the answer! (e.g., <code>{"{= apples + more_apples =}"}</code>)
              </p>
              <textarea
                className="mc-textarea"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="e.g. Step 1: Draw {{apples}}..."
              />
            </div>

            {extractBlanks(blueprint).length === 0 && (
              <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <h3 className="mc-card-title">
                  <span className="mc-step-badge mc-step-badge-blue">1c</span>
                  Configure Options / Distractors
                </h3>
                <p className="mc-card-desc">
                  Define the formulas or values for MCQ choices. Use <code>{"{{variable_name}}"}</code> to refer to variables (e.g. <code>{"{{Result}} - 10"}</code>).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {optionsState.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={opt.isCorrect}
                        onChange={() => {
                          setOptionsState(prev => prev.map((o, idx) => ({ ...o, isCorrect: idx === i })));
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', width: '90px', color: opt.isCorrect ? '#4f46e5' : '#64748b' }}>
                        {opt.isCorrect ? 'Correct ✅' : `Option ${i + 1}`}
                      </span>
                      <input
                        type="text"
                        className="mc-input"
                        style={{ flex: 1, margin: 0, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        value={opt.label}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setOptionsState(prev => prev.map((o, idx) => idx === i ? { ...o, label: newVal } : o));
                        }}
                        placeholder={i === 0 ? 'e.g. {{Result}}' : `e.g. {{Result}} - 10`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {extractBlanks(blueprint).length > 0 && (
              <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <h3 className="mc-card-title">
                  <span className="mc-step-badge mc-step-badge-blue">1d</span>
                  Configure Fill-in-the-Blank Answers
                </h3>
                <p className="mc-card-desc">
                  Map each blank input to its correct answer formula. Use <code>{"{{variable_name}}"}</code> (e.g. <code>{"{{Result}}"}</code>).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.keys(blankAnswers).map((blankId) => (
                    <div key={blankId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', width: '150px', color: '#4f46e5' }}>
                        Blank ({blankId}):
                      </span>
                      <input
                        type="text"
                        className="mc-input"
                        style={{ flex: 1, margin: 0, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        value={blankAnswers[blankId] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlankAnswers(prev => ({ ...prev, [blankId]: val }));
                        }}
                        placeholder="e.g. {{Result}}"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Fill in the Blanks */}
          <div className="mc-card mc-card-amber">
            <h3 className="mc-card-title">
              <span className="mc-step-badge mc-step-badge-amber">2</span>
              Fill in the Blanks
            </h3>
            <p className="mc-card-desc">
              Great! We found {placeholders.length} placeholder{placeholders.length === 1 ? '' : 's'}. Give them actual values.
            </p>
            <div className="mc-tip-banner mc-tip-banner-purple">
              ✨ <strong>Superpower:</strong> Type a list like "Alice, Bob" for a random name, or a range like "10-25" for a random number!
            </div>

            {placeholders.length === 0 ? (
              <div style={{ padding: '16px', textvalue: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                No placeholders found. Wrap text with double curly braces (e.g. {"{{my_var}}"}) to add them.
              </div>
            ) : (
              <div className="mc-placeholder-list">
                {placeholders.map((key) => (
                  <div className="mc-placeholder-row" key={key}>
                    <div className="mc-tag">{key}</div>
                    <div className="mc-arrow">➔</div>
                    <input
                      type="text"
                      className="mc-input"
                      value={placeholderValues[key] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlaceholderValues(prev => ({
                          ...prev,
                          [key]: val
                        }));
                      }}
                      placeholder="e.g. 5-10 or Alice, Bob"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: SVG Visual Helper */}
          <div className="mc-card" style={{ borderLeft: '6px solid #8b5cf6' }}>
            <h3 className="mc-card-title">
              <span className="mc-step-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>3</span>
              Add a Visual Component <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b5cf6', marginLeft: 8, background: '#f5f3ff', padding: '3px 10px', borderRadius: 20 }}>NEW ✨</span>
            </h3>
            <p className="mc-card-desc">
              Attach an interactive SVG diagram to your question — counters, number lines, fraction models, clocks and more!
            </p>

            {/* Component Selector Dropdown */}
            <div style={{ marginBottom: 16 }}>
              <label className="mc-dev-label" style={{ marginBottom: 8, display: 'block' }}>Visual Component</label>
              <select
                className="mc-input"
                value={visualComponent}
                onChange={(e) => {
                  const comp = e.target.value;
                  setVisualComponent(comp);
                  // Reset to defaults for the newly selected component
                  const defaults = {};
                  if (VISUAL_COMPONENTS_CONFIG[comp]) {
                    VISUAL_COMPONENTS_CONFIG[comp].props.forEach(p => {
                      defaults[p.key] = p.default || '';
                    });
                  }
                  setVisualProps(defaults);
                }}
                style={{ fontSize: '1rem', fontWeight: 700, borderRadius: 12, border: '2px solid #ddd6fe', padding: '10px 14px', outline: 'none', cursor: 'pointer' }}
              >
                {Object.entries(VISUAL_COMPONENTS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.name}</option>
                ))}
              </select>
            </div>

            {/* Dynamic prop inputs for the selected component */}
            {visualComponent !== 'none' && VISUAL_COMPONENTS_CONFIG[visualComponent] && (
              <div>
                <div className="mc-tip-banner" style={{ background: '#faf5ff', border: '1px solid #e9d5ff', color: '#6b21a8', marginBottom: 14 }}>
                  🎯 <strong>Tip:</strong> Use variable names like <code>A</code>, <code>count1</code> or <code>Result</code> to make props dynamic!
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                  {VISUAL_COMPONENTS_CONFIG[visualComponent].props.map(({ key, label, placeholder }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6b21a8' }}>{label}</label>
                      <input
                        type="text"
                        className="mc-input"
                        value={visualProps[key] || ''}
                        onChange={(e) => setVisualProps(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ borderColor: '#ddd6fe' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visualComponent === 'none' && (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', padding: '8px 0' }}>
                Select a visual component above to add a diagram to your template.
              </div>
            )}
          </div>

          {/* Card 4: Dev JSON Export & Publish */}
          <div className="mc-card">
            <div className="mc-dev-header" onClick={() => setIsDevModeOpen(!isDevModeOpen)}>
              <h3 className="mc-card-title" style={{ margin: 0 }}>
                🛠️ Developer Mode: Export & Publish JSON Recipe
              </h3>
              <button type="button" className="mc-dev-toggle">
                {isDevModeOpen ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            
            {isDevModeOpen && (
              <div style={{ marginTop: '20px' }}>
                <p className="mc-card-desc" style={{ marginBottom: '14px' }}>
                  This panel compiles your Masterclass inputs in real-time into a database-ready dynamic template recipe.
                </p>

                {/* Target Toggle */}
                <div className="mc-dev-form-group" style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
                  <label className="mc-dev-label">Target Database & Schema</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setTargetCollection('dynamic_templates')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '2px solid ' + (targetCollection === 'dynamic_templates' ? '#4f46e5' : '#e2e8f0'),
                        background: targetCollection === 'dynamic_templates' ? '#eef2ff' : 'white',
                        color: targetCollection === 'dynamic_templates' ? '#4f46e5' : '#64748b',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      📁 General Curriculum (dynamic_templates)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetCollection('templates')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '2px solid ' + (targetCollection === 'templates' ? '#7c3aed' : '#e2e8f0'),
                        background: targetCollection === 'templates' ? '#faf5ff' : 'white',
                        color: targetCollection === 'templates' ? '#7c3aed' : '#64748b',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      🏆 Competitive Exam / JNVST (templates)
                    </button>
                  </div>
                </div>

                {/* DB Config fields */}
                <div className="mc-dev-form-grid">
                  <div className="mc-dev-form-group">
                    <label className="mc-dev-label">Template ID / Title</label>
                    <input 
                      type="text" 
                      className="mc-input" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Addition – Apple Counting"
                    />
                  </div>

                  {targetCollection === 'dynamic_templates' ? (
                    <>
                      <div className="mc-dev-form-group">
                        <label className="mc-dev-label">Subject</label>
                        <select 
                          className="mc-input" 
                          value={subject} 
                          onChange={e => setSubject(e.target.value)}
                        >
                          <option value="math">math</option>
                          <option value="science">science</option>
                          <option value="english">english</option>
                        </select>
                      </div>
                      <div className="mc-dev-form-group">
                        <label className="mc-dev-label">Topic / Unit</label>
                        <select 
                          className="mc-input" 
                          value={topic} 
                          onChange={e => setTopic(e.target.value)}
                        >
                          <option value="counting">counting</option>
                          <option value="addition">addition</option>
                          <option value="subtraction">subtraction</option>
                          <option value="multiplication">multiplication</option>
                          <option value="division">division</option>
                          <option value="custom">-- Custom Topic --</option>
                        </select>
                      </div>
                      {topic === 'custom' && (
                        <div className="mc-dev-form-group">
                          <label className="mc-dev-label">Custom Topic ID</label>
                          <input 
                            type="text" 
                            className="mc-input" 
                            value={customTopic} 
                            onChange={e => setCustomTopic(e.target.value)} 
                            placeholder="e.g. ukg-numbers-counting"
                          />
                        </div>
                      )}
                      <div className="mc-dev-form-group">
                        <label className="mc-dev-label">Grade</label>
                        <select 
                          className="mc-input" 
                          value={grade} 
                          onChange={e => setGrade(e.target.value)}
                        >
                          <option value="lkg">LKG</option>
                          <option value="ukg">UKG</option>
                          <option value="1">Grade 1</option>
                          <option value="2">Grade 2</option>
                          <option value="3">Grade 3</option>
                          <option value="4">Grade 4</option>
                          <option value="5">Grade 5</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mc-dev-form-group">
                        <label className="mc-dev-label">JNVST Section</label>
                        <select 
                          className="mc-input" 
                          value={jnvstSection} 
                          onChange={e => setJnvstSection(e.target.value)}
                        >
                          <option value="arithmetic">arithmetic</option>
                          <option value="mental-ability">mental-ability</option>
                          <option value="language">language</option>
                        </select>
                      </div>
                      <div className="mc-dev-form-group">
                        <label className="mc-dev-label">JNVST Topic</label>
                        <select 
                          className="mc-input" 
                          value={jnvstTopic} 
                          onChange={e => setJnvstTopic(e.target.value)}
                        >
                          <option value="simplification">simplification</option>
                          <option value="number-system">number-system</option>
                          <option value="fraction">fraction</option>
                          <option value="percentage">percentage</option>
                          <option value="interest">interest</option>
                          <option value="custom">-- Custom Topic --</option>
                        </select>
                      </div>
                      {(jnvstTopic === 'custom' || jnvstTopic === 'custom-topic') && (
                        <div className="mc-dev-form-group">
                          <label className="mc-dev-label">Custom Topic ID</label>
                          <input 
                            type="text" 
                            className="mc-input" 
                            value={customTopic} 
                            onChange={e => setCustomTopic(e.target.value)} 
                            placeholder="e.g. speed-distance-time"
                          />
                        </div>
                      )}
                      <div className="mc-dev-form-group">
                        <label className="mc-dev-label">Difficulty ({jnvstDifficulty})</label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1.0" 
                          step="0.05"
                          className="mc-input"
                          style={{ padding: 0 }}
                          value={jnvstDifficulty} 
                          onChange={e => setJnvstDifficulty(parseFloat(e.target.value))}
                        />
                      </div>
                    </>
                  )}
                </div>

                <textarea
                  className="mc-textarea"
                  style={{ minHeight: '260px', fontFamily: 'monospace', fontSize: '0.85rem', background: '#f8fafc' }}
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                />

                {/* Publish row */}
                <div className="mc-publish-row">
                  <button 
                    type="button" 
                    className="mc-publish-btn"
                    onClick={handlePublish}
                    disabled={publishing}
                  >
                    {publishing ? 'Publishing...' : '🚀 Publish Template'}
                  </button>

                  {publishStatus && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                      <span className="mc-db-status" style={{ color: '#16a34a' }}>
                        🎉 Published successfully as ID: <code>{publishStatus.id}</code> ({publishStatus.mode})!
                      </span>
                      <a
                        href={`/practice?skill=${encodeURIComponent(publishStatus.id)}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic === 'custom' ? (customTopic || 'custom-topic') : topic)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: '#fff',
                          padding: '10px 20px',
                          borderRadius: 12,
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          textDecoration: 'none',
                          boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        ▶ Play in Practice
                      </a>
                    </div>
                  )}

                  {publishError && (
                    <span className="mc-db-status" style={{ color: '#dc2626' }}>
                      ❌ Save Error: {publishError}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right column: Simulator / Magic Result */}
        <div className="mc-preview-col">
          <div className="mc-card mc-card-green">
            <h3 className="mc-card-title">
              <span className="mc-step-badge mc-step-badge-green">4</span>
              The Magic Result
            </h3>
            <p className="mc-card-desc">
              Watch your template transform into a real math problem!
            </p>

            <button 
              type="button" 
              className={`mc-shuffle-btn ${shuffleClass}`}
              onClick={handleShuffle}
            >
              <svg className="mc-shuffle-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-2.73" />
              </svg>
              Shuffle
            </button>

            {/* Simulated inner card */}
            <div className="mc-sim-box">
              {/* Problem text */}
              <div className="mc-sim-problem">
                {blueprint ? renderEvaluatedText(blueprint) : 'Provide blueprint content...'}
              </div>

              {/* Live SVG visual preview */}
              {renderVisualPreview()}

              {/* Solution box */}
              {solution.trim() && (
                <div className="mc-sim-solution-box">
                  <div className="mc-sim-solution-title">
                    🎒 {targetCollection === 'templates' ? 'Step-by-Step JNVST Solution:' : `Step-by-Step ${grade ? (grade === 'lkg' || grade === 'ukg' ? grade.toUpperCase() : (grade === '1' ? '1st' : (grade === '2' ? '2nd' : (grade === '3' ? '3rd' : `${grade}th`)))) : '1st'} Grade Solution:`}
                  </div>
                  <div className="mc-sim-solution-steps">
                    {evaluateText(solution)}
                  </div>
                </div>
              )}
            </div>

            {/* Perfect success badge */}
            <div className="mc-success-alert">
              🎉 Perfect! You've successfully created a dynamic math problem!
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
