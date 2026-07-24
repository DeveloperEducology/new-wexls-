'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
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

const COMPONENT_SAMPLE_TEMPLATES = {
  CoordinatePlane: {
    blueprint: 'The graph shows a parabola. In which direction does it open?',
    solution: 'Step 1: Locate the vertex at ({{h}}, {{k}}).\nStep 2: Observe the direction the curve points.\nStep 3: The parabola opens to the {{direction}}.',
    title: 'Coordinate Plane – Parabola Direction',
    subject: 'math',
    topic: 'graphing',
    grade: '4',
    placeholders: {
      direction: 'right, left, up, down',
      h: '-8-8',
      k: '-8-8'
    },
    options: [
      { label: '{{direction}}', isCorrect: true },
      { label: '= direction === "right" ? "left" : "right"', isCorrect: false },
      { label: '= direction === "up" ? "down" : "up"', isCorrect: false },
      { label: '= direction === "left" || direction === "right" ? "up" : "left"', isCorrect: false }
    ],
    visualProps: {
      xMin: '-10',
      xMax: '10',
      yMin: '-10',
      yMax: '10',
      parabolaDirection: 'direction',
      parabolaVertex: 'h,k',
      parabolaA: '0.15'
    }
  },
  Image: {
    blueprint: 'Write the multiplication number sentence shown here:\n\nType the complete multiplication number sentence (for example, 2 x 3 = 6).\n[]',
    solution: 'Step 1: Count the groups (number of boxes): 5 groups.\nStep 2: Count the items in each group: 2 pears.\nStep 3: Write the multiplication sentence: 5 x 2 = 10.',
    title: 'Multiplication – Image Grouping',
    subject: 'math',
    topic: 'multiplication',
    grade: '2',
    placeholders: {
      Result: '5 x 2 = 10'
    },
    options: [],
    visualProps: {
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/2pears_group5.png',
      width: '240'
    }
  },
  ItemCounter: {
    blueprint: 'Look at the groups of pears. Write the multiplication sentence:\n\nType the complete sentence (for example, 2 x 3 = 6).\n[]',
    solution: 'Step 1: Count the groups: {{groups}} groups.\nStep 2: Each group has {{itemsPerGroup}} pears.\nStep 3: Multiply: {{groups}} x {{itemsPerGroup}} = {= groups * itemsPerGroup =}.',
    title: 'Multiplication – Item Groups',
    subject: 'math',
    topic: 'multiplication',
    grade: '2',
    placeholders: {
      groups: '5',
      itemsPerGroup: '2',
      Result: '= groups + " x " + itemsPerGroup + " = " + (groups * itemsPerGroup)'
    },
    options: [],
    visualProps: {
      count: 'groups',
      itemType: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/2pears.png',
      itemsPerRow: '1',
      showBorder: 'true',
      width: '90'
    }
  }
};

const VISUAL_COMPONENTS_CONFIG = {
  none: { name: 'None (Text Only)', props: [] },
  TenFrame: {
    name: 'Ten Frame 🧮',
    props: [
      { key: 'filledCount', type: 'variable', description: 'Placeholder for filled cells count' },
      { key: 'crossedOutCount', type: 'variable', description: 'Placeholder for crossed out cells count' },
      { key: 'color', type: 'color', description: 'Counters color: red or blue' }
    ]
  },
  JarOfMarbles: {
    name: 'Jar of Marbles 🫙',
    props: [
      { key: 'countA', type: 'variable', description: 'Placeholder for Count A (first color)' },
      { key: 'colorA', type: 'color', description: 'First color: red, blue, green' },
      { key: 'countB', type: 'variable', description: 'Placeholder for Count B (second color)' },
      { key: 'colorB', type: 'color', description: 'Second color: red, blue, green' }
    ]
  },
  Spinner: {
    name: 'Spinner Wheel 🎯',
    props: [
      { key: 'sectorsA', type: 'variable', description: 'Placeholder for Count A' },
      { key: 'colorA', type: 'color', description: 'First color: blue, green, yellow' },
      { key: 'sectorsB', type: 'variable', description: 'Placeholder for Count B' },
      { key: 'colorB', type: 'color', description: 'Second color: blue, green, yellow' }
    ]
  },
  ItemCounter: {
    name: 'Item Counter Grid 📦',
    props: [
      { key: 'count', type: 'variable', description: 'Placeholder for items count' },
      { key: 'itemType', type: 'url', description: 'Asset image URL or path' },
      { key: 'itemsPerRow', type: 'number', description: 'Maximum columns per grid row (e.g. 5)' },
      { key: 'width', type: 'number', description: 'Clipart icon width in pixels' }
    ]
  },
  Image: {
    name: 'Custom Image/Clipart 🍕',
    props: [
      { key: 'imageUrl', type: 'url', description: 'Asset image URL' },
      { key: 'width', type: 'number', description: 'Image width in pixels' }
    ]
  }
};

const parseImagePoolString = (str) => {
  if (!str) return [];
  return str.split(',').map(s => {
    const parts = s.split('::');
    return {
      name: parts[0]?.trim() || '',
      url: parts[1]?.trim() || parts[0]?.trim() || ''
    };
  }).filter(x => x.name);
};

const stringifyImagePoolArray = (arr) => {
  if (!arr || arr.length === 0) return '';
  return arr.map(x => `${x.name}::${x.url}`).join(', ');
};

const LatexToolbar = ({ activeField, theme = 'blue' }) => {
  const insertLatex = (type) => {
    if (!activeField || !activeField.element) return;
    const textarea = activeField.element;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value || '';
    const selectedText = value.substring(start, end);

    let textToInsert = '';
    switch (type) {
      case 'inline':
        textToInsert = `\\(${selectedText || 'math'}\\)`;
        break;
      case 'block':
        textToInsert = `\\[\n${selectedText || 'math'}\n\\]`;
        break;
      case 'frac':
        textToInsert = `\\frac{ ${selectedText || 'a'} }{ b }`;
        break;
      case 'mixfrac':
        textToInsert = `a\\frac{ b }{ c }`;
        break;
      case 'paren':
        textToInsert = `\\left( ${selectedText || 'x'} \\right)`;
        break;
      case 'sqrt':
        textToInsert = `\\sqrt{ ${selectedText || 'x'} }`;
        break;
      case 'mult':
        textToInsert = `\\times`;
        break;
      case 'div':
        textToInsert = `\\div`;
        break;
      case 'degree':
        textToInsert = `^{\\circ}`;
        break;
      case 'pi':
        textToInsert = `\\pi`;
        break;
      default:
        textToInsert = type;
    }

    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    textarea.value = newValue;
    activeField.onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const themeColors = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', btnBg: '#3b82f6', btnText: '#fff' },
    purple: { bg: '#faf5ff', border: '#e9d5ff', btnBg: '#8b5cf6', btnText: '#fff' },
    disabled: { bg: '#f8fafc', border: '#e2e8f0', btnBg: '#cbd5e1', btnText: '#94a3b8' }
  };

  const isEnabled = activeField !== null;
  const colors = isEnabled ? themeColors[theme] || themeColors.blue : themeColors.disabled;

  const buttons = [
    { label: 'Inline \\(...\\)', type: 'inline' },
    { label: 'Block \\[...\\]', type: 'block' },
    { label: 'Fraction \\frac{a}{b}', type: 'frac' },
    { label: 'Mixed Fraction', type: 'mixfrac' },
    { label: '(...) Parentheses', type: 'paren' },
    { label: 'Square Root \\sqrt{x}', type: 'sqrt' },
    { label: '× (Multiply)', type: 'mult' },
    { label: '÷ (Divide)', type: 'div' },
    { label: 'π (Pi)', type: 'pi' },
    { label: '° (Degree)', type: 'degree' }
  ];

  return (
    <div style={{
      background: colors.bg,
      border: `1.5px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '12px',
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: '16px'
    }}>
      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: isEnabled ? '#475569' : '#94a3b8', textTransform: 'uppercase', marginRight: '6px' }}>
        ∑ LaTeX Insert {isEnabled ? `(Editing: ${activeField.label || 'Active Field'})` : '(Click a text field to activate)'}:
      </span>
      {buttons.map((btn, i) => (
        <button
          key={i}
          disabled={!isEnabled}
          onClick={() => insertLatex(btn.type)}
          style={{
            background: colors.btnBg,
            color: colors.btnText,
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            outline: 'none',
            opacity: isEnabled ? 1 : 0.6
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default function TemplateMasterclass() {
  const aiPromptRef = useRef(null);
  const blueprintRef = useRef(null);
  const solutionRef = useRef(null);

  const [activeField, setActiveField] = useState(null);

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
  const [showImagePoolMap, setShowImagePoolMap] = useState({});
  const [lastUsedImageUrl, setLastUsedImageUrl] = useState('');
  const [visualPosition, setVisualPosition] = useState('bottom');

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

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('jnvst');

  // Authoring IDE states
  const [wizardStep, setWizardStep] = useState(0); // 0 = Choose Method, 1 = Question, 2 = Solution, 3 = Variables, 4 = Options, 5 = Visuals, 6 = Preview/Stress, 7 = Publish
  const [creationMethod, setCreationMethod] = useState(null); // 'ai' | 'manual' | 'import'
  const [activeInspectorVar, setActiveInspectorVar] = useState(null);
  const [stressTestResults, setStressTestResults] = useState(null);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [variableTypes, setVariableTypes] = useState({});
  const [variableRules, setVariableRules] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);

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

  // AI Audit State
  const [aiAuditReport, setAiAuditReport] = useState(null);
  const [aiAuditing, setAiAuditing] = useState(false);
  const [aiAuditError, setAiAuditError] = useState(null);
  
  // AI Auto-Fix State
  const [isFixingTemplate, setIsFixingTemplate] = useState(false);
  const [fixError, setFixError] = useState(null);

  // Fetch Exams list from DB
  useEffect(() => {
    async function fetchExams() {
      try {
        const res = await fetch('/api/exams');
        const data = await res.json();
        if (data.success && Array.isArray(data.exams)) {
          setExams(data.exams);
        }
      } catch (err) {
        console.warn('Failed to fetch exams catalog:', err);
      }
    }
    fetchExams();
  }, []);

  // Autoload template from URL parameters on mount
  useEffect(() => {
    async function loadTemplateFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id') || params.get('templateId');
      if (urlId) {
        try {
          const res = await fetch('/api/admin/templates');
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.dynamicTemplates)) {
              const matched = data.dynamicTemplates.find(t => t.id === urlId || String(t._id) === urlId);
              if (matched) {
                loadTemplateData(matched);
                setPublishStatus({ id: matched.id || urlId, mode: 'loaded' });
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load template from URL:', err);
        }
      }
    }
    loadTemplateFromUrl();
  }, []);

  // Sync section and topic selections when exam changes
  useEffect(() => {
    if (exams.length === 0) return;
    const examObj = exams.find(e => e.id === selectedExamId);
    if (!examObj) return;
    const sections = examObj.sections || [];
    const hasSection = sections.some(s => s.id === jnvstSection);
    if (!hasSection && sections.length > 0) {
      setJnvstSection(sections[0].id);
    }
  }, [selectedExamId, exams]);

  useEffect(() => {
    if (exams.length === 0) return;
    const examObj = exams.find(e => e.id === selectedExamId);
    if (!examObj) return;
    const sections = examObj.sections || [];
    const secObj = sections.find(s => s.id === jnvstSection);
    if (!secObj) return;

    const topics = secObj.topics || [];
    const hasTopic = topics.includes(jnvstTopic);
    if (!hasTopic && topics.length > 0) {
      setJnvstTopic(topics[0]);
    } else if (topics.length === 0) {
      setJnvstTopic('custom');
    }
  }, [jnvstSection, selectedExamId, exams]);

  // Live extract placeholders whenever blueprint, solution, or options change
  useEffect(() => {
    const cleanBlueprint = blueprint.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
    const cleanSolution = solution.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');

    const regex = /\{\{([^}]+)\}\}/g;
    const found = new Set();
    let match;

    while ((match = regex.exec(cleanBlueprint)) !== null) {
      const cleanKey = match[1].trim().replace(/^\{+/, '').replace(/\}+$/, '');
      if (cleanKey) found.add(cleanKey);
    }
    while ((match = regex.exec(cleanSolution)) !== null) {
      const cleanKey = match[1].trim().replace(/^\{+/, '').replace(/\}+$/, '');
      if (cleanKey) found.add(cleanKey);
    }

    optionsState.forEach(opt => {
      if (opt.label) {
        const cleanOpt = opt.label.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
        const optRegex = /\{\{([^}]+)\}\}/g;
        let optMatch;
        while ((optMatch = optRegex.exec(cleanOpt)) !== null) {
          const cleanKey = optMatch[1].trim().replace(/^\{+/, '').replace(/\}+$/, '');
          if (cleanKey) found.add(cleanKey);
        }
      }
    });

    const currentList = Array.from(found);
    
    // Compare currentList with placeholders to avoid infinite loops/unnecessary state updates
    const hasChanged = currentList.length !== placeholders.length || currentList.some((val, idx) => val !== placeholders[idx]);
    if (hasChanged) {
      setPlaceholders(currentList);
    }

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
  }, [blueprint, solution, optionsState]);

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
          const matchedVar = placeholders.find(p => p.toLowerCase() === blankId.toLowerCase());
          if (matchedVar) {
            next[blankId] = `{{${matchedVar}}}`;
          } else {
            const num = index + 1;
            const exprName = num === 1 ? 'Result' : `Result_${num}`;
            next[blankId] = `{{${exprName}}}`;
          }
        }
      });
      
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

  const isPrime = (num) => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  const handleShuffle = () => {
    setShuffleClass('shuffling');
    setTimeout(() => setShuffleClass(''), 450);

    const resolved = {};
    
    // Detect all comma-separated lists and determine their lengths
    const listLengths = {};
    placeholders.forEach(key => {
      const valString = String(placeholderValues[key] || '').trim();
      if (valString.includes(',') && !valString.startsWith('[') && !valString.startsWith('{')) {
        const list = valString.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 1) {
          listLengths[list.length] = list.length;
        }
      }
    });

    // Select a synchronized index for each unique list length
    const syncIndices = {};
    Object.keys(listLengths).forEach(len => {
      syncIndices[len] = Math.floor(Math.random() * Number(len));
    });

    placeholders.forEach(key => {
      const valString = String(placeholderValues[key] || '').trim();
      
      if ((valString.startsWith('[') && valString.endsWith(']')) || (valString.startsWith('{') && valString.endsWith('}'))) {
        try {
          const parsed = JSON.parse(valString);
          if (Array.isArray(parsed)) {
            resolved[key] = parsed[Math.floor(Math.random() * parsed.length)];
          } else {
            resolved[key] = parsed;
          }
          return;
        } catch {}
      }

      const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(valString);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        const rule = variableRules[key] || 'none';
        const valids = [];
        for (let v = min; v <= max; v++) {
          if (rule === 'even' && v % 2 !== 0) continue;
          if (rule === 'odd' && v % 2 === 0) continue;
          if (rule === 'prime' && !isPrime(v)) continue;
          if (rule === 'multiples' && v % 5 !== 0) continue;
          valids.push(v);
        }
        if (valids.length > 0) {
          resolved[key] = valids[Math.floor(Math.random() * valids.length)];
        } else {
          resolved[key] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
      } else if (valString.includes(',')) {
        const list = valString.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 0) {
          const len = list.length;
          if (syncIndices[len] !== undefined) {
            resolved[key] = list[syncIndices[len]];
          } else {
            resolved[key] = list[Math.floor(Math.random() * len)];
          }
        } else {
          resolved[key] = valString;
        }
      } else {
        const num = Number(valString);
        if (Number.isFinite(num)) {
          resolved[key] = num;
        } else {
          const isFormula = checkIsFormula(valString);
          if (isFormula) {
            resolved[key] = { isFormula: true, formula: valString };
          } else {
            resolved[key] = valString;
          }
        }
      }
    });

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
            if (varVal && typeof varVal === 'object' && varVal.isFormula) return;
            const isNumeric = typeof varVal === 'number' || (typeof varVal === 'string' && !isNaN(Number(varVal)));
            const replacement = isNumeric ? String(varVal) : JSON.stringify(varVal);
            const varRegex = new RegExp(`\\b${varKey}\\b`, 'g');
            substitutedExpr = substitutedExpr.replace(varRegex, replacement);
          });
          
          const strippedExpr = substitutedExpr.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/\.[a-zA-Z_][a-zA-Z0-9_]*/g, '');
          if (/[a-zA-Z_]/.test(strippedExpr)) canEvaluate = false;
          
          if (canEvaluate) {
            let exprToEval = substitutedExpr.trim();
            if (exprToEval.startsWith('=')) {
              exprToEval = exprToEval.substring(1).trim();
            }
            try {
              let evaluated = Function('return (' + exprToEval + ')')();
              if (typeof evaluated === 'number' && !Number.isInteger(evaluated)) {
                evaluated = Math.round(evaluated * 100) / 100;
              }
              resolved[k] = evaluated;
              changed = true;
            } catch {
              const sanitized = exprToEval.replace(/[^0-9+\-*/().\s%]/g, '');
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

    for (const [k, val] of Object.entries(resolved)) {
      if (val && typeof val === 'object' && val.isFormula) {
        resolved[k] = val.formula;
      }
    }

    setResolvedValues(resolved);
    setShuffledCount(prev => prev + 1);
  };

  useEffect(() => {
    if (placeholders.length > 0) handleShuffle();
  }, [placeholders, placeholderValues, solution]);

  const getVariableOccurrences = (varName) => {
    const counts = { question: 0, solution: 0, options: 0 };
    const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}|\\[\\s*${varName}\\s*\\]`, 'g');
    
    if (blueprint) {
      const qMatches = blueprint.match(regex);
      if (qMatches) counts.question = qMatches.length;
    }
    if (solution) {
      const sMatches = solution.match(regex);
      if (sMatches) counts.solution = sMatches.length;
    }
    optionsState.forEach(opt => {
      if (opt.label) {
        const oMatches = opt.label.match(regex);
        if (oMatches) counts.options += oMatches.length;
      }
    });
    return counts;
  };

  const getHealthScore = () => {
    let score = 5;
    const reasons = [];
    if (placeholders.length === 0) {
      score -= 1;
      reasons.push('No variables defined');
    }
    if (!solution || !solution.trim()) {
      score -= 1;
      reasons.push('Empty step-by-step solution');
    }
    if (visualComponent === 'none') {
      score -= 0.5;
      reasons.push('No visual component diagram connected');
    }
    if (optionsState.length < 4 && targetCollection !== 'dynamic_templates') {
      score -= 1;
      reasons.push('MCQ templates need exactly 4 options');
    }
    if (!optionsState.some(o => o.isCorrect) && targetCollection !== 'dynamic_templates') {
      score -= 1;
      reasons.push('No correct option designated');
    }
    return { score: Math.max(1, Math.round(score)), reasons };
  };

  const runStressTest = () => {
    setIsStressTesting(true);
    setStressTestResults(null);
    setTimeout(() => {
      let passed = 0;
      let failed = 0;
      const failures = [];
      const uniqueQuestions = new Set();
      
      for (let i = 0; i < 100; i++) {
        const resolved = {};
        let stepFailed = false;
        let failReason = '';
        
        try {
          placeholders.forEach(key => {
            const valString = String(placeholderValues[key] || '').trim();
            const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(valString);
            if (rangeMatch) {
              const min = parseInt(rangeMatch[1], 10);
              const max = parseInt(rangeMatch[2], 10);
              const rule = variableRules[key] || 'none';
              const valids = [];
              for (let v = min; v <= max; v++) {
                if (rule === 'even' && v % 2 !== 0) continue;
                if (rule === 'odd' && v % 2 === 0) continue;
                if (rule === 'prime' && !isPrime(v)) continue;
                if (rule === 'multiples' && v % 5 !== 0) continue;
                valids.push(v);
              }
              if (valids.length > 0) {
                resolved[key] = valids[Math.floor(Math.random() * valids.length)];
              } else {
                resolved[key] = Math.floor(Math.random() * (max - min + 1)) + min;
              }
            } else {
              resolved[key] = valString;
            }
          });
          
          const qText = blueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, pName) => {
            return resolved[pName] !== undefined ? String(resolved[pName]) : match;
          });

          if (uniqueQuestions.has(qText)) {
            stepFailed = true;
            failReason = 'Duplicate Question Generated (Range too narrow)';
          } else {
            uniqueQuestions.add(qText);
          }
        } catch (e) {
          stepFailed = true;
          failReason = `Formula Exception: ${e.message}`;
        }
        
        if (stepFailed) {
          failed++;
          if (!failures.includes(failReason)) failures.push(failReason);
        } else {
          passed++;
        }
      }
      
      setStressTestResults({
        total: 100,
        passed,
        failed,
        failures: failures.length > 0 ? failures : ['None']
      });
      setIsStressTesting(false);
    }, 1000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = {
        blueprint,
        solution,
        optionsState,
        placeholderValues,
        visualComponent,
        visualProps,
        visualPosition,
        title,
        subject,
        topic,
        grade,
        targetCollection,
        selectedExamId,
        jnvstSection,
        jnvstTopic,
        jnvstDifficulty,
        variableTypes,
        variableRules
      };
      localStorage.setItem('klasschamp_template_draft', JSON.stringify(draft));
    }
  }, [blueprint, solution, optionsState, placeholderValues, visualComponent, visualProps, visualPosition, title, subject, topic, grade, targetCollection, selectedExamId, jnvstSection, jnvstTopic, jnvstDifficulty, variableTypes, variableRules]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('klasschamp_template_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.blueprint || parsed.solution) {
            setHasDraft(true);
            setDraftData(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  const handleResumeDraft = () => {
    if (draftData) {
      if (draftData.blueprint !== undefined) setBlueprint(draftData.blueprint);
      if (draftData.solution !== undefined) setSolution(draftData.solution);
      if (draftData.optionsState !== undefined) setOptionsState(draftData.optionsState);
      if (draftData.placeholderValues !== undefined) setPlaceholderValues(draftData.placeholderValues);
      if (draftData.visualComponent !== undefined) setVisualComponent(draftData.visualComponent);
      if (draftData.visualProps !== undefined) setVisualProps(draftData.visualProps);
      if (draftData.visualPosition !== undefined) setVisualPosition(draftData.visualPosition);
      if (draftData.title !== undefined) setTitle(draftData.title);
      if (draftData.subject !== undefined) setSubject(draftData.subject);
      if (draftData.topic !== undefined) setTopic(draftData.topic);
      if (draftData.grade !== undefined) setGrade(draftData.grade);
      if (draftData.targetCollection !== undefined) setTargetCollection(draftData.targetCollection);
      if (draftData.selectedExamId !== undefined) setSelectedExamId(draftData.selectedExamId);
      if (draftData.jnvstSection !== undefined) setJnvstSection(draftData.jnvstSection);
      if (draftData.jnvstTopic !== undefined) setJnvstTopic(draftData.jnvstTopic);
      if (draftData.jnvstDifficulty !== undefined) setJnvstDifficulty(draftData.jnvstDifficulty);
      if (draftData.variableTypes !== undefined) setVariableTypes(draftData.variableTypes);
      if (draftData.variableRules !== undefined) setVariableRules(draftData.variableRules);
      setWizardStep(1);
    }
    setHasDraft(false);
  };

  const evaluateText = (tplText) => {
    if (!tplText) return '';
    let result = tplText;

    Object.keys(resolvedValues).forEach(key => {
      const val = resolvedValues[key];
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      result = result.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), val);
      result = result.replace(new RegExp(`\\[\\s*${escapedKey}\\s*\\]`, 'g'), val);
    });

    const mathRegex = /\{=\s*(.*?)\s*=\}/g;
    result = result.replace(mathRegex, (match, expr) => {
      let substitutedExpr = expr;
      Object.keys(resolvedValues).forEach(key => {
        const val = resolvedValues[key];
        if (typeof val === 'number' || !isNaN(Number(val))) {
          const varRegex = new RegExp(`\\b${key}\\b`, 'g');
          substitutedExpr = substitutedExpr.replace(varRegex, val);
        }
      });

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

  const renderEvaluatedText = (tplText) => {
    return renderMathText(evaluateText(tplText));
  };

  const renderMathText = (text) => {
    if (!text) return '';
    const regex = /(\\\[[\s\S]*?\\\]|\\\(.*?\\\)|\\\$[^$]*?\\\$|\$[^\$]+\$)/g;
    const parts = String(text).split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <div key={index} style={{ color: '#dc2626' }}>{part}</div>;
        }
      }
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={index} style={{ color: '#dc2626' }}>{part}</span>;
        }
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={index} style={{ color: '#dc2626' }}>{part}</span>;
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const evalOptionLabel = (label, ctx) => {
    if (typeof label !== 'string') return label;
    let interpolated = label.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
      const trimmed = name.trim();
      return ctx[trimmed] !== undefined ? String(ctx[trimmed]) : match;
    });

    interpolated = interpolated.replace(/\{=\s*(.*?)\s*=\}/g, (match, expr) => {
      try {
        let resolved = expr;
        for (const [key, val] of Object.entries(ctx)) {
          resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
        }
        const result = new Function(`return (${resolved})`)();
        return result !== undefined && result !== null && !isNaN(result) ? String(Math.round(result * 100) / 100) : match;
      } catch {
        return match;
      }
    });

    if (/^[-0-9\s\+\-\*\/\(\)\.]+$/.test(interpolated)) {
      try {
        return new Function(`return (${interpolated})`)();
      } catch {
        return interpolated;
      }
    }
    return interpolated;
  };

  const loadPreset = (preset) => {
    if (preset.blueprint !== undefined) setBlueprint(preset.blueprint);
    if (preset.solution !== undefined) setSolution(preset.solution);
    if (preset.title !== undefined) setTitle(preset.title);
    if (preset.subject !== undefined) setSubject(preset.subject);
    if (preset.topic !== undefined) setTopic(preset.topic);
    if (preset.grade !== undefined) setGrade(preset.grade);
    if (preset.placeholders !== undefined) {
      setPlaceholders(Object.keys(preset.placeholders));
      setPlaceholderValues(preset.placeholders);
    }
    if (preset.visualComponent !== undefined) {
      setVisualComponent(preset.visualComponent);
      setVisualProps(preset.visualProps || {});
    } else {
      setVisualComponent('none');
      setVisualProps({});
    }
    if (preset.options !== undefined) {
      const mapped = preset.options.map(opt => ({
        label: opt.label,
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
    setPublishStatus(null);
    setPublishError(null);
  };

  const handleSelectVisualComponent = (compName) => {
    setVisualComponent(compName);
    const defaults = {};
    const config = VISUAL_COMPONENTS_CONFIG[compName];
    if (config) {
      config.props.forEach(p => {
        defaults[p.key] = '';
      });
    }
    setVisualProps(defaults);

    const sample = COMPONENT_SAMPLE_TEMPLATES[compName];
    if (sample) {
      if (sample.blueprint !== undefined) setBlueprint(sample.blueprint);
      if (sample.solution !== undefined) setSolution(sample.solution);
      if (sample.title !== undefined) setTitle(sample.title);
      if (sample.subject !== undefined) setSubject(sample.subject);
      if (sample.topic !== undefined) setTopic(sample.topic);
      if (sample.grade !== undefined) setGrade(sample.grade);
      if (sample.placeholders !== undefined) {
        setPlaceholders(Object.keys(sample.placeholders));
        setPlaceholderValues(sample.placeholders);
      }
      if (sample.options !== undefined) {
        setOptionsState(sample.options);
      }
      setVisualProps(sample.visualProps || {});
    }
  };

  const renderVisualPreview = () => {
    if (!visualComponent || visualComponent === 'none') return null;
    const builder = COMPONENT_REGISTRY[visualComponent];
    if (!builder) return null;

    const resolvedProps = {};
    const config = VISUAL_COMPONENTS_CONFIG[visualComponent];
    if (config) {
      config.props.forEach(({ key }) => {
        const rawVal = visualProps[key];
        if (rawVal === undefined || rawVal === null || rawVal === '') return;
        const strVal = String(rawVal).trim();
        let resolvedStr = strVal;
        let hasReplacements = false;
        const sortedKeys = Object.keys(resolvedValues || {}).sort((a, b) => b.length - a.length);

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

        if (key === 'itemType' || key === 'imageUrl') {
          const valToParse = resolvedProps[key] !== undefined ? resolvedProps[key] : (hasReplacements ? resolvedStr : strVal);
          const pool = parseImagePoolString(String(valToParse));
          if (pool.length > 0) {
            resolvedProps[key] = pool[0].url;
          }
        }
      });
    }

    try {
      const result = builder(resolvedProps, () => Math.random());
      
      if (result && result.type === 'image') {
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
              🎨 Live Visual Preview — Image Clipart
            </div>
            <img 
              src={result.imageUrl} 
              alt="Clipart Aid" 
              style={{ maxWidth: '100%', height: 'auto', maxHeight: '240px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
            />
          </div>
        );
      }

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

  const getSolutionNumberLineProps = () => {
    const min = Number(visualProps.min) !== undefined && !isNaN(Number(visualProps.min)) ? Number(visualProps.min) : 0;
    const max = Number(visualProps.max) !== undefined && !isNaN(Number(visualProps.max)) ? Number(visualProps.max) : 10;
    const step = Number(visualProps.step) || 1;
    const color = visualProps.color || 'blue';

    let start = min;
    if (resolvedValues.A !== undefined && !isNaN(Number(resolvedValues.A))) start = Number(resolvedValues.A);
    else if (resolvedValues.count1 !== undefined && !isNaN(Number(resolvedValues.count1))) start = Number(resolvedValues.count1);
    else if (resolvedValues.a !== undefined && !isNaN(Number(resolvedValues.a))) start = Number(resolvedValues.a);
    else {
      const nums = Object.values(resolvedValues).map(Number).filter(n => !isNaN(n));
      if (nums.length > 0) start = nums[0];
    }

    let jumpsCount = 0;
    if (resolvedValues.B !== undefined && !isNaN(Number(resolvedValues.B))) jumpsCount = Number(resolvedValues.B);
    else if (resolvedValues.count2 !== undefined && !isNaN(Number(resolvedValues.count2))) jumpsCount = Number(resolvedValues.count2);
    else if (resolvedValues.b !== undefined && !isNaN(Number(resolvedValues.b))) jumpsCount = Number(resolvedValues.b);
    else {
      const nums = Object.values(resolvedValues).map(Number).filter(n => !isNaN(n));
      if (nums.length > 1) jumpsCount = nums[1];
    }

    if (isNaN(start) || start < min || start > max) start = min;
    if (isNaN(jumpsCount) || jumpsCount < 0) jumpsCount = 0;
    if (start + jumpsCount > max) jumpsCount = max - start;

    const end = start + jumpsCount;

    const jumpList = [];
    for (let val = start; val <= end; val += step) {
      jumpList.push(val);
    }
    const jumpsStr = jumpList.join('->');
    const highlightBoxesStr = [start, end].join(',');

    return {
      min,
      max,
      step,
      pointValue: null,
      color,
      jumps: jumpsStr,
      highlightBoxes: highlightBoxesStr,
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
          border: '1.5px dashed rgba(16, 185, 129, 0.3)',
          background: '#1e293b',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          width: '100%'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💡 Number Line Solution Steps
          </div>
          <div
            style={{ width: '100%', overflow: 'hidden', borderRadius: 12 }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      );
    } catch (err) {
      console.warn('Failed to render solution visual:', err);
      return null;
    }
  };


  useEffect(() => {
    const cleanBlueprint = blueprint.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
    const cleanSolution = solution.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
    const activeTopic = topic === 'custom' ? (customTopic || 'custom-topic') : topic;

    if (targetCollection === 'templates') {
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
      let modifiedSolution = cleanSolution;

      while ((match = mathRegex.exec(cleanSolution)) !== null) {
        exprCount++;
        const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
        jnvstDerivations[exprName] = match[1].trim();
        modifiedSolution = modifiedSolution.replace(match[0], `{{${exprName}}}`);
      }

      let modifiedBlueprint = cleanBlueprint;
      modifiedBlueprint = modifiedBlueprint.replace(/\[\]/g, '______');

      const activeJnvstTopic = jnvstTopic === 'custom' ? (customTopic || 'custom-topic') : jnvstTopic;
      const difficultyLevel = jnvstDifficulty < 0.4 ? 'easy' : (jnvstDifficulty >= 0.7 ? 'hard' : 'medium');
      const templateId = 'template-' + String(title || 'custom').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const compiledJson = {
        id: templateId,
        _id: templateId,
        name: title || 'Custom JNVST Template',
        type: 'parameterized',
        examId: selectedExamId,
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
            label: (opt.label || '').replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }'),
            isCorrect: opt.isCorrect
          })),
          questionTemplate: modifiedBlueprint,
          explanationTemplate: modifiedSolution
        }
      };

      setJsonText(JSON.stringify(compiledJson, null, 2));
    } else {
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
      let modifiedSolution = cleanSolution;

      while ((match = mathRegex.exec(cleanSolution)) !== null) {
        exprCount++;
        const exprName = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
        compiledVariables.push({
          name: exprName,
          type: 'expression',
          formula: match[1].trim()
        });
        modifiedSolution = modifiedSolution.replace(match[0], `[${exprName}]`);
      }

      let modifiedBlueprint = cleanBlueprint;
      placeholders.forEach(key => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        modifiedBlueprint = modifiedBlueprint.replace(regex, `[${key}]`);
        modifiedSolution = modifiedSolution.replace(regex, `[${key}]`);
      });

      let blankCount = 0;
      modifiedBlueprint = modifiedBlueprint.replace(/\[\]/g, () => {
        blankCount++;
        while (blueprint.includes(`[[blank${blankCount}]]`)) {
          blankCount++;
        }
        return `[[blank${blankCount}]]`;
      });

      const blanksRegex = /\[\[([^\]]+)\]\]/g;
      const foundBlanks = [];
      let matchBlank;
      while ((matchBlank = blanksRegex.exec(modifiedBlueprint)) !== null) {
        const bId = matchBlank[1].trim();
        if (!foundBlanks.includes(bId)) foundBlanks.push(bId);
      }

      const hasMathResult = exprCount > 0;
      let optionsType = 'mcq';
      let interaction = { engine: 'mcq', inputMode: 'choice' };
      let options = null;
      let answerObj = null;
      let validationRules = [];

      if (foundBlanks.length > 0) {
        optionsType = 'fillInTheBlank';
        interaction = { engine: 'fill_blank', inputMode: 'number' };
        answerObj = {};
        
        foundBlanks.forEach((blankId) => {
          if (blankAnswers[blankId]) {
            const cleanAns = blankAnswers[blankId].replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
            answerObj[blankId] = cleanAns.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]');
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
        
        validationRules = [{ type: 'exact_match', target: 'answer', value: answerObj }];
      } else {
        const finalResultVar = exprCount === 1 ? 'Result' : `Result_${exprCount}`;
        options = optionsState.map(opt => {
          const cleanLabel = (opt.label || '').replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
          const labelWithBrackets = cleanLabel.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]');
          return { label: labelWithBrackets, isCorrect: opt.isCorrect };
        });

        const correctOpt = options.find(o => o.isCorrect);
        validationRules = [{
          type: 'exact_match',
          target: 'answer',
          value: correctOpt ? correctOpt.label : (hasMathResult ? `[${finalResultVar}]` : '')
        }];
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
          visuals: [{
            component: visualComponent,
            position: visualPosition,
            props: visualProps
          }]
        } : {}),
        ...(answerObj ? { answer: answerObj } : {}),
        questionText: modifiedBlueprint,
        explanation: { sections: [{ type: 'text', content: modifiedSolution }] },
        ...(options ? { options } : {}),
        validationRules: validationRules,
        variables: compiledVariables
      };

      setJsonText(JSON.stringify(compiledJson, null, 2));
    }
  }, [blueprint, solution, placeholderValues, title, subject, topic, grade, customTopic, placeholders, targetCollection, selectedExamId, jnvstSection, jnvstTopic, jnvstDifficulty, visualComponent, visualProps, visualPosition]);

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

  const handleAiAudit = async () => {
    setAiAuditing(true);
    setAiAuditReport(null);
    setAiAuditError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/admin/templates/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: parsed })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setAiAuditReport(data.report);
      } else {
        setAiAuditError(data.error || 'Gemini audit failed.');
      }
    } catch (err) {
      setAiAuditError(err.message || 'Failed to run AI check.');
    } finally {
      setAiAuditing(false);
    }
  };

  const handleAiFix = async () => {
    if (!aiAuditReport) return;
    setIsFixingTemplate(true);
    setFixError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/admin/templates/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: parsed, report: aiAuditReport })
      });
      const data = await res.json();
      if (data.success && data.fixedTemplate) {
        loadTemplateData(data.fixedTemplate);
        setAiAuditReport(null);
      } else {
        setFixError(data.error || 'AI repair failed.');
      }
    } catch (err) {
      setFixError(err.message || 'Auto-fix API failed.');
    } finally {
      setIsFixingTemplate(false);
    }
  };

  const loadTemplateData = (parsed) => {
    const config = parsed.config || parsed;
    if (config.title) setTitle(config.title);
    if (config.subject) setSubject(config.subject);
    if (parsed.subject) setSubject(parsed.subject);
    if (config.topic) setTopic(config.topic);
    if (parsed.topic) setTopic(parsed.topic);
    if (config.grade) setGrade(config.grade);
    if (parsed.grade) setGrade(parsed.grade);

    if (parsed.examId) {
      setTargetCollection('templates');
      setSelectedExamId(parsed.examId);
      if (parsed.section) setJnvstSection(parsed.section);
      if (parsed.topic) setJnvstTopic(parsed.topic);
      if (parsed.difficulty) setJnvstDifficulty(parsed.difficulty);
    } else {
      setTargetCollection('dynamic_templates');
    }

    let rawBlueprint = config.questionTemplate || parsed.questionText || config.blueprint || parsed.blueprint || '';
    let rawSolution = config.explanationTemplate || (config.explanation?.sections?.[0]?.content) || config.solution || parsed.solution || '';

    const varsObj = config.variables || config.placeholders || parsed.placeholders || {};
    const placeholderVals = {};
    const extractedKeys = [];

    if (Array.isArray(varsObj)) {
      varsObj.forEach(v => {
        extractedKeys.push(v.name);
        if (v.type === 'integer') {
          placeholderVals[v.name] = `${v.min}-${v.max}`;
        } else if (v.type === 'array') {
          placeholderVals[v.name] = Array.isArray(v.values) ? v.values.join(', ') : String(v.values || '');
        } else if (v.type === 'computed') {
          placeholderVals[v.name] = v.formula;
        } else if (v.type === 'constant') {
          placeholderVals[v.name] = String(v.value);
        } else if (v.type === 'expression') {
          placeholderVals[v.name] = v.formula;
        }
      });
    } else {
      Object.keys(varsObj).forEach(k => {
        extractedKeys.push(k);
        const val = varsObj[k];
        if (val && typeof val === 'object' && val.min !== undefined) {
          placeholderVals[k] = `${val.min}-${val.max}`;
        } else if (Array.isArray(val)) {
          placeholderVals[k] = val.join(', ');
        } else {
          placeholderVals[k] = String(val);
        }
      });

      const derivations = config.derivations || {};
      Object.keys(derivations).forEach(k => {
        const rawExpr = derivations[k];
        rawSolution = rawSolution.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), `{= ${rawExpr} =}`);
      });
    }

    rawBlueprint = rawBlueprint.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}').replace(/______/g, '[]');
    rawSolution = rawSolution.replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}');

    setBlueprint(rawBlueprint);
    setSolution(rawSolution);
    setPlaceholders(extractedKeys);
    setPlaceholderValues(placeholderVals);

    const visuals = config.visuals || parsed.visuals;
    if (Array.isArray(visuals) && visuals.length > 0) {
      setVisualComponent(visuals[0].component || 'none');
      setVisualPosition(visuals[0].position || 'bottom');
      setVisualProps(visuals[0].props || {});
    } else {
      setVisualComponent('none');
      setVisualProps({});
    }

    const rawOptions = config.options || parsed.options;
    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      const mapped = rawOptions.map(opt => ({
        label: (opt.label || '').replace(/\[([a-zA-Z0-9_]+)\]/g, '{{$1}}'),
        isCorrect: opt.isCorrect === true || opt.isCorrect === 'true'
      }));
      setOptionsState(mapped);
    } else {
      setOptionsState([]);
    }
  };

  const handleLoadJsonText = () => {
    setPublishError(null);
    setPublishStatus(null);
    try {
      const parsed = JSON.parse(jsonText);
      loadTemplateData(parsed);
      setPublishStatus({ id: parsed.id || 'pasted', mode: 'loaded' });
    } catch (err) {
      setPublishError('Pasted text is not valid JSON: ' + err.message);
    }
  };

  const handleParseWithoutAi = () => {
    setAiStatus(null);
    if (!aiPrompt.trim()) {
      setAiStatus({ success: false, message: 'Please enter a raw problem example.' });
      return;
    }

    const matchQuestion = aiPrompt.match(/^(.*?)(Solution:|\*\*Solution\*\*|$)/s);
    const qText = matchQuestion ? matchQuestion[1].trim() : aiPrompt;

    let solText = '';
    const matchSolution = aiPrompt.match(/(Solution:|\*\*Solution\*\*)(.*)$/s);
    if (matchSolution) solText = matchSolution[2].trim();

    setBlueprint(qText);
    setSolution(solText);
    setAiStatus({ success: true, message: 'Template populated successfully!' });
  };

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) {
      setAiStatus({ success: false, message: 'Please enter a raw example first.' });
      return;
    }
    setIsGeneratingAi(true);
    setAiStatus(null);
    try {
      const res = await fetch('/api/admin/templates/generate-masterclass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      const payload = data.data || data.template;
      if (data.success && payload) {
        loadTemplateData(payload);
        setAiStatus({ success: true, message: 'Template generated successfully!' });
      } else {
        setAiStatus({ success: false, message: data.error || 'Generation failed.' });
      }
    } catch (err) {
      setAiStatus({ success: false, message: err.message || 'API failed.' });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="mc-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        .mc-page {
          min-height: 100vh;
          background: #0b0f19;
          font-family: 'Outfit', sans-serif;
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
        }

        .mc-top-bar {
          background: #111827;
          border-bottom: 1.5px solid #1f2937;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .mc-top-brand {
          font-size: 1.2rem;
          font-weight: 800;
          color: #818cf8;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mc-top-brand span {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .mc-ide-container {
          display: grid;
          grid-template-columns: 240px 1fr 420px;
          min-height: calc(100vh - 64px);
          position: relative;
        }
        @media (max-width: 1024px) {
          .mc-ide-container {
            grid-template-columns: 1fr;
          }
        }

        .mc-sidebar {
          background: #0f172a;
          border-right: 1.5px solid #1e293b;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }
        .mc-sidebar-title {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-weight: 800;
          padding-left: 12px;
        }
        .mc-step-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mc-step-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          border: none;
          text-align: left;
          width: 100%;
        }
        .mc-step-item:hover {
          background: #1e293b;
          color: #e2e8f0;
        }
        .mc-step-item.active {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border-left: 3px solid #6366f1;
        }
        .mc-step-item.completed {
          color: #10b981;
        }
        .mc-step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #475569;
        }
        .mc-step-item.active .mc-step-dot {
          background: #6366f1;
          box-shadow: 0 0 8px #6366f1;
        }
        .mc-step-item.completed .mc-step-dot {
          background: #10b981;
        }

        .mc-main-panel {
          padding: 32px 40px;
          overflow-y: auto;
          background: #0b0f19;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .mc-preview-panel {
          background: #0f172a;
          border-left: 1.5px solid #1e293b;
          padding: 32px 24px;
          position: sticky;
          top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .mc-wizard-select-screen {
          max-width: 900px;
          margin: 60px auto;
          padding: 0 24px;
        }
        .mc-select-title {
          font-size: 2.2rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .mc-select-desc {
          text-align: center;
          color: #94a3b8;
          font-size: 1.05rem;
          margin-bottom: 48px;
        }
        .mc-select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }
        .mc-select-card {
          background: #111827;
          border: 1.5px solid #1f2937;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mc-select-card:hover {
          transform: translateY(-4px);
          border-color: #6366f1;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.1);
        }
        .mc-select-icon {
          font-size: 2.8rem;
          margin-bottom: 20px;
        }
        .mc-select-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #f1f5f9;
          margin-bottom: 10px;
        }
        .mc-select-card-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .mc-card {
          background: #111827;
          border: 1.5px solid #1f2937;
          border-radius: 20px;
          padding: 24px;
        }
        .mc-card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #f8fafc;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mc-card-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .mc-textarea {
          width: 100%;
          min-height: 120px;
          background: #0b0f19;
          border: 1.5px solid #1f2937;
          border-radius: 12px;
          color: #f1f5f9;
          padding: 14px;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          resize: vertical;
          box-sizing: border-box;
          line-height: 1.5;
          transition: border-color 0.15s;
        }
        .mc-textarea:focus {
          border-color: #6366f1;
        }
        .mc-input {
          background: #0b0f19;
          border: 1.5px solid #1f2937;
          border-radius: 8px;
          color: #f1f5f9;
          padding: 10px 14px;
          outline: none;
          font-family: inherit;
          font-size: 0.92rem;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .mc-input:focus {
          border-color: #6366f1;
        }
        .mc-select {
          background: #0b0f19;
          border: 1.5px solid #1f2937;
          border-radius: 8px;
          color: #f1f5f9;
          padding: 10px 14px;
          outline: none;
          font-family: inherit;
          font-size: 0.92rem;
          width: 100%;
          cursor: pointer;
        }

        .mc-var-row {
          display: grid;
          grid-template-columns: 140px 120px 120px 1fr 100px;
          gap: 12px;
          align-items: center;
          background: #111827;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #1f2937;
        }
        .mc-var-name {
          font-weight: 800;
          color: #818cf8;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-style: dotted;
          font-size: 0.9rem;
        }
        .mc-var-name:hover {
          color: #a5b4fc;
        }

        .mc-preview-box {
          background: #111827;
          border: 1.5px solid #1f2937;
          border-radius: 18px;
          padding: 20px;
          min-height: 180px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .mc-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .mc-preview-header-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #818cf8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .mc-shuffle-btn {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1.5px solid rgba(16, 185, 129, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .mc-shuffle-btn:hover {
          background: rgba(16, 185, 129, 0.2);
        }

        .mc-btn-row {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
        }
        .mc-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .mc-btn-primary:hover {
          opacity: 0.95;
        }
        .mc-btn-secondary {
          background: #1f2937;
          color: #d1d5db;
          border: 1.5px solid #374151;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .mc-health-badge {
          background: rgba(245, 158, 11, 0.1);
          border: 1.5px solid rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.88rem;
        }

        .mc-alert-box {
          background: rgba(239, 68, 68, 0.08);
          border: 1.5px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.82rem;
          line-height: 1.4;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mc-dev-drawer {
          grid-column: 1 / -1;
          background: #111827;
          border-top: 1.5px solid #1f2937;
          padding: 24px;
        }
        
        .mc-example-dropdown {
          background: #1f2937;
          border: 1px solid #374151;
          color: #f1f5f9;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
        }
      ` }} />

      {/* 1. Header Bar */}
      <div className="mc-top-bar">
        <Link href="/admin-v2" className="mc-top-brand">
          🎓 KlassChamp Authoring IDE
          <span>v2.0</span>
        </Link>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {hasDraft && (
            <button className="mc-shuffle-btn" onClick={handleResumeDraft} style={{ background: '#f59e0b', color: '#1e1b4b', border: 'none' }}>
              ✏️ Resume Draft
            </button>
          )}
          <select 
            className="mc-example-dropdown"
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              if (!isNaN(idx) && EXAMPLES[idx]) {
                loadPreset(EXAMPLES[idx]);
                setWizardStep(1);
              }
            }}
            defaultValue="0"
          >
            <option value="" disabled>⚡ Choose Preset Blueprint</option>
            {EXAMPLES.map((ex, i) => (
              <option key={i} value={i}>{ex.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Step 0 Method Selector Dashboard */}
      {wizardStep === 0 ? (
        <div className="mc-wizard-select-screen">
          <h2 className="mc-select-title">Choose Template Creation Method</h2>
          <p className="mc-select-desc">Select how you want to build this educational template</p>
          <div className="mc-select-grid">
            <div className="mc-select-card" onClick={() => { setCreationMethod('ai'); setWizardStep(1); }}>
              <div className="mc-select-icon">🪄</div>
              <h3 className="mc-select-card-title">AI Generate from Example</h3>
              <p className="mc-select-card-desc">Paste a sample question/solution and let Gemini construct variables, math derivations, and MCQ distractors automatically.</p>
            </div>
            <div className="mc-select-card" onClick={() => { setCreationMethod('manual'); setWizardStep(1); }}>
              <div className="mc-select-icon">✏️</div>
              <h3 className="mc-select-card-title">Build Manually</h3>
              <p className="mc-select-card-desc">Write your own question blueprint, configure ranges, custom formulas, and connect dynamic graphics from scratch.</p>
            </div>
            <div className="mc-select-card" onClick={() => { setCreationMethod('import'); setWizardStep(1); }}>
              <div className="mc-select-icon">📥</div>
              <h3 className="mc-select-card-title">Import Existing JSON</h3>
              <p className="mc-select-card-desc">Paste a raw JSON template configuration to load, inspect, test, or modify it instantly.</p>
            </div>
            <Link href="/template-generator-grid" className="mc-select-card" style={{ textDecoration: 'none' }}>
              <div className="mc-select-icon">📊</div>
              <h3 className="mc-select-card-title">Spreadsheet Grid Editor</h3>
              <p className="mc-select-card-desc">Use a structured spreadsheet grid to define custom rows of variables and direct values for JNVST & Curriculum templates.</p>
            </Link>
          </div>
        </div>
      ) : (
        /* 3. The Three-Column IDE Workspace */
        <div className="mc-ide-container">
          
          {/* Column A: Left Progress Sidebar */}
          <div className="mc-sidebar">
            <div className="mc-sidebar-title">Step Progress</div>
            <div className="mc-step-list">
              {[
                { step: 1, label: '1. Question Text', check: blueprint.trim().length > 0 },
                { step: 2, label: '2. Solution Steps', check: solution.trim().length > 0 },
                { step: 3, label: '3. Variables Config', check: placeholders.length > 0 },
                { step: 4, label: '4. Answer Choices', check: optionsState.length > 0 },
                { step: 5, label: '5. Visual Graphics', check: visualComponent !== 'none' },
                { step: 6, label: '6. Preview & Stress Test', check: stressTestResults !== null },
                { step: 7, label: '7. Publish Readiness', check: publishStatus !== null }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setWizardStep(s.step)}
                  className={`mc-step-item ${wizardStep === s.step ? 'active' : ''} ${s.check ? 'completed' : ''}`}
                >
                  <div className="mc-step-dot" />
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1.5px solid #1e293b' }}>
              <div className="mc-sidebar-title" style={{ marginBottom: '10px' }}>Health Score</div>
              <div className="mc-health-badge">
                <span>⭐ Quality Score:</span>
                <span>{getHealthScore().score} / 5</span>
              </div>
            </div>
          </div>

          {/* Column B: Middle Form Editor Step Panel */}
          <div className="mc-main-panel">
            <LatexToolbar activeField={activeField} theme="purple" />
            
            {/* Step 1: Question Blueprint */}
            {wizardStep === 1 && (
              <div className="mc-card">
                <h3 className="mc-card-title">📖 Step 1: Question Blueprint</h3>
                <p className="mc-card-desc">Write your question. Use double curly braces <code>{"{{variable_name}}"}</code> to insert dynamic values. Use <code>{"[]"}</code> for fill-in-the-blank spaces.</p>
                
                {creationMethod === 'ai' && (
                  <div style={{ marginBottom: '24px', background: '#1e1b4b', padding: '16px', borderRadius: '12px', border: '1.5px solid #3730a3' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '8px' }}>🤖 AI Prompt Assistant</div>
                    <textarea
                      ref={aiPromptRef}
                      className="mc-textarea"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Find the prime factorisation of 640..."
                      style={{ minHeight: '80px', marginBottom: '10px' }}
                    />
                    <button className="mc-publish-btn" onClick={handleGenerateAiTemplate} disabled={isGeneratingAi}>
                      {isGeneratingAi ? '✨ Processing Template...' : '🪄 Generate Template blueprint'}
                    </button>
                  </div>
                )}

                <textarea
                  ref={blueprintRef}
                  className="mc-textarea"
                  value={blueprint}
                  onChange={(e) => setBlueprint(e.target.value)}
                  onFocus={(e) => setActiveField({ label: 'Question Blueprint', element: e.target, onChange: setBlueprint })}
                  placeholder="The prime factorisation of {{number}} is:"
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label className="mc-dev-label">Template Title</label>
                    <input className="mc-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="mc-dev-label">Subject</label>
                    <select className="mc-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                      <option value="math">Mathematics</option>
                      <option value="english">English / Language</option>
                    </select>
                  </div>
                </div>

                <div className="mc-btn-row">
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(0)}>Back</button>
                  <button className="mc-btn-primary" onClick={() => setWizardStep(2)}>Next Step</button>
                </div>
              </div>
            )}

            {/* Step 2: Solution Explanation */}
            {wizardStep === 2 && (
              <div className="mc-card">
                <h3 className="mc-card-title">🎒 Step 2: Solution Explanation</h3>
                <p className="mc-card-desc">Provide a step-by-step solution. You can do inline math like <code>{"{= num1 * multiplier =}"}</code>, but avoid using alphabetical function names inside math brackets to prevent errors.</p>
                <textarea
                  ref={solutionRef}
                  className="mc-textarea"
                  style={{ minHeight: '160px' }}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  onFocus={(e) => setActiveField({ label: 'Solution Steps', element: e.target, onChange: setSolution })}
                  placeholder="Step 1: Divide by 2..."
                />
                <div className="mc-btn-row">
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(1)}>Back</button>
                  <button className="mc-btn-primary" onClick={() => setWizardStep(3)}>Next Step</button>
                </div>
              </div>
            )}

            {/* Step 3: Variable Manager */}
            {wizardStep === 3 && (
              <div className="mc-card">
                <h3 className="mc-card-title">🔢 Step 3: Variables & Range Manager</h3>
                <p className="mc-card-desc">Configure range restrictions, custom types, and math logic rules for each variable placeholder. Click any variable name to inspect it.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {placeholders.map((key) => (
                    <div key={key} className="mc-var-row">
                      <span className="mc-var-name" onClick={() => setActiveInspectorVar(key)}>
                        {key}
                      </span>
                      <select
                        className="mc-select"
                        value={variableTypes[key] || 'Integer'}
                        onChange={(e) => setVariableTypes({ ...variableTypes, [key]: e.target.value })}
                      >
                        <option value="Integer">Integer</option>
                        <option value="Decimal">Decimal</option>
                        <option value="Fraction">Fraction</option>
                        <option value="Text">Text</option>
                        <option value="Boolean">Boolean</option>
                      </select>
                      <select
                        className="mc-select"
                        value={variableRules[key] || 'none'}
                        onChange={(e) => setVariableRules({ ...variableRules, [key]: e.target.value })}
                      >
                        <option value="none">No Rule</option>
                        <option value="even">Even Only</option>
                        <option value="odd">Odd Only</option>
                        <option value="prime">Prime Only</option>
                        <option value="multiples">Multiples of 5</option>
                      </select>
                      <input
                        className="mc-input"
                        value={placeholderValues[key] || ''}
                        onChange={(e) => setPlaceholderValues({ ...placeholderValues, [key]: e.target.value })}
                        placeholder="e.g. 5-12 or red, blue"
                      />
                      <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>
                        Preview: {resolvedValues[key] !== undefined ? String(resolvedValues[key]) : '-'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mc-btn-row">
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(2)}>Back</button>
                  <button className="mc-btn-primary" onClick={() => setWizardStep(4)}>Next Step</button>
                </div>
              </div>
            )}

            {/* Step 4: MCQ Options / Distractors */}
            {wizardStep === 4 && (
              <div className="mc-card">
                <h3 className="mc-card-title">📝 Step 4: Configure MCQ Options</h3>
                <p className="mc-card-desc">Define correct options and distractor formulas using placeholders (e.g. <code>{"{{Result}} + 10"}</code>).</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {optionsState.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = optionsState.map((o, i) => ({
                            ...o,
                            isCorrect: i === idx ? e.target.checked : false
                          }));
                          setOptionsState(updated);
                        }}
                      />
                      <input
                        className="mc-input"
                        value={opt.label || ''}
                        onChange={(e) => {
                          const updated = optionsState.map((o, i) => i === idx ? { ...o, label: e.target.value } : o);
                          setOptionsState(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mc-btn-row">
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(3)}>Back</button>
                  <button className="mc-btn-primary" onClick={() => setWizardStep(5)}>Next Step</button>
                </div>
              </div>
            )}

            {/* Step 5: Visual Components */}
            {wizardStep === 5 && (
              <div className="mc-card">
                <h3 className="mc-card-title">🎨 Step 5: Connect Visual Component</h3>
                <p className="mc-card-desc">Choose a dynamic SVG component to represent the question model graphically.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="mc-dev-label">Select Component</label>
                    <select className="mc-select" value={visualComponent} onChange={(e) => setVisualComponent(e.target.value)}>
                      <option value="none">None (Text Only)</option>
                      <option value="TenFrame">Ten Frame 🧮</option>
                      <option value="JarOfMarbles">Jar of Marbles 🫙</option>
                      <option value="Spinner">Spinner 🎯</option>
                      <option value="ItemCounter">Item Counter 📦</option>
                      <option value="Image">Custom Clipart 🍕</option>
                    </select>
                  </div>
                  <div>
                    <label className="mc-dev-label">Layout Position</label>
                    <select className="mc-select" value={visualPosition} onChange={(e) => setVisualPosition(e.target.value)}>
                      <option value="top">Top</option>
                      <option value="middle">Middle</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </div>

                <div className="mc-btn-row">
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(4)}>Back</button>
                  <button className="mc-btn-primary" onClick={() => setWizardStep(6)}>Next Step</button>
                </div>
              </div>
            )}

            {/* Step 6: Preview & Stress Test */}
            {wizardStep === 6 && (
              <div className="mc-card">
                <h3 className="mc-card-title">⚙️ Step 6: Preview & Template Stress Test</h3>
                <p className="mc-card-desc">Automatically verify math ranges and generate 100 random variations to test duplication rates and exception handling.</p>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <button className="mc-publish-btn" onClick={runStressTest} disabled={isStressTesting}>
                    {isStressTesting ? '⚙️ Stress Testing 100 variations...' : '🚀 Stress Test (Generate 100 Variations)'}
                  </button>
                </div>

                {stressTestResults && (
                  <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1.5px solid #1f2937' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#818cf8', marginBottom: '10px' }}>Stress Test Report</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', marginBottom: '10px' }}>
                      <span style={{ color: '#10b981' }}>Passed: {stressTestResults.passed} / 100</span>
                      <span style={{ color: '#ef4444' }}>Failed: {stressTestResults.failed} / 100</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Failures Detected: {stressTestResults.failures.join(', ')}
                    </div>
                  </div>
                )}

                <div className="mc-btn-row">
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(5)}>Back</button>
                  <button className="mc-btn-primary" onClick={() => setWizardStep(7)}>Final Publish Checklist</button>
                </div>
              </div>
            )}

            {/* Step 7: Publish Readiness Checklist */}
            {wizardStep === 7 && (
              <div className="mc-card">
                <h3 className="mc-card-title">🚀 Step 7: Publish Readiness Checklist</h3>
                <p className="mc-card-desc">Review database mappings and target sections before publishing the template live.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label className="mc-dev-label">Target Database Mode</label>
                    <select className="mc-select" value={targetCollection} onChange={(e) => setTargetCollection(e.target.value)}>
                      <option value="dynamic_templates">Curriculum Dynamic Templates</option>
                      <option value="templates">Competitive Exams Templates (JNVST/SSC)</option>
                    </select>
                  </div>
                  {targetCollection === 'templates' && (
                    <div>
                      <label className="mc-dev-label">JNVST Section</label>
                      <select className="mc-select" value={jnvstSection} onChange={(e) => setJnvstSection(e.target.value)}>
                        <option value="arithmetic">Arithmetic</option>
                        <option value="mat">Mental Ability (MAT)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ background: '#0b0f19', padding: '16px', borderRadius: '12px', border: '1.5px solid #1f2937', marginBottom: '24px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#818cf8', marginBottom: '10px' }}>Publishing Checklist</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                    <li>✅ Question Blueprint Written: {blueprint.trim().length > 0 ? 'Passed' : 'Failed'}</li>
                    <li>✅ Variables Ranges Configured: {placeholders.length > 0 ? 'Passed' : 'Failed'}</li>
                    <li>✅ Explanation Solution Written: {solution.trim().length > 0 ? 'Passed' : 'Failed'}</li>
                    <li>✅ Health Audit Checked: Score {getHealthScore().score} / 5</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <button className="mc-publish-btn" onClick={handlePublish} disabled={publishing}>
                    {publishing ? 'Publishing live...' : '🚀 Publish Template Live'}
                  </button>
                  {publishStatus && (
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.88rem' }}>
                      ✅ Published Successfully! ID: {publishStatus.id}
                    </span>
                  )}
                </div>

                <div className="mc-btn-row" style={{ marginTop: '24px' }}>
                  <button className="mc-btn-secondary" onClick={() => setWizardStep(6)}>Back</button>
                </div>
              </div>
            )}

            {/* Developer Mode Drawer */}
            <div style={{ marginTop: '32px', borderTop: '1.5px solid #1f2937', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#94a3b8' }}>🔧 Developer Mode Editor</span>
                <input
                  type="checkbox"
                  checked={isDevModeOpen}
                  onChange={(e) => setIsDevModeOpen(e.target.checked)}
                />
              </div>
              
              {isDevModeOpen && (
                <div style={{ background: '#111827', padding: '16px', borderRadius: '12px', border: '1.5px solid #1f2937' }}>
                  <textarea
                    className="mc-textarea"
                    style={{ fontFamily: 'Courier, monospace', fontSize: '0.82rem', minHeight: '260px' }}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button className="mc-btn-secondary" onClick={handleLoadJsonText}>📥 Parse & Load JSON</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column C: Right Sticky Preview Panel */}
          <div className="mc-preview-panel">
            <div className="mc-preview-box">
              <div className="mc-preview-header">
                <span className="mc-preview-header-title">Live Simulator Preview</span>
                <button className={`mc-shuffle-btn ${shuffleClass}`} onClick={handleShuffle}>
                  Shuffle
                </button>
              </div>

              {/* Dynamic render visual preview top/middle/bottom */}
              <div style={{ fontSize: '1.05rem', lineHeight: '1.5', color: '#f1f5f9', whiteSpace: 'pre-line' }}>
                {(() => {
                  const visual = renderVisualPreview();
                  const hasVisual = visual !== null;
                  
                  if (hasVisual && visualPosition === 'top') {
                    return (
                      <>
                        <div style={{ marginBottom: 16 }}>{visual}</div>
                        <div>{renderEvaluatedText(blueprint)}</div>
                      </>
                    );
                  }
                  
                  if (hasVisual && visualPosition === 'middle') {
                    const paragraphs = blueprint.split(/\n\n/);
                    if (paragraphs.length >= 2) {
                      return (
                        <>
                          <div>{renderEvaluatedText(paragraphs[0])}</div>
                          <div style={{ margin: '16px 0' }}>{visual}</div>
                          <div>{renderEvaluatedText(paragraphs.slice(1).join('\n\n'))}</div>
                        </>
                      );
                    }
                  }
                  
                  return (
                    <>
                      <div>{renderEvaluatedText(blueprint)}</div>
                      {hasVisual && <div style={{ marginTop: 16 }}>{visual}</div>}
                    </>
                  );
                })()}
              </div>

              {/* Render MCQ Choices if MCQ */}
              {extractBlanks(blueprint).length === 0 && optionsState.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  {optionsState.map((opt, idx) => (
                    <div key={idx} style={{ background: '#1e293b', border: '1.5px solid #334155', padding: '12px', borderRadius: '8px', fontSize: '0.88rem' }}>
                      {renderMathText(evalOptionLabel(opt.label, resolvedValues))}
                    </div>
                  ))}
                </div>
              )}

              {/* Render Explanation Solution steps */}
              {solution.trim() && (
                <div style={{ marginTop: '24px', background: 'rgba(16, 185, 129, 0.05)', border: '1.5px dashed rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>🎒 Step-by-Step Solution</div>
                  <div style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {renderMathText(evaluateText(solution))}
                    {renderSolutionVisual()}
                  </div>
                </div>
              )}
            </div>

            {/* Variable Inspector Side Panel (within right column) */}
            {activeInspectorVar && (
              <div style={{ background: '#111827', border: '1.5px solid #1f2937', padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#818cf8', textTransform: 'uppercase' }}>🔍 Variable Inspector</span>
                  <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setActiveInspectorVar(null)}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  <div><strong>Variable Name:</strong> <code>{activeInspectorVar}</code></div>
                  <div><strong>Type:</strong> {variableTypes[activeInspectorVar] || 'Integer'}</div>
                  <div><strong>Rule Constraints:</strong> {variableRules[activeInspectorVar] || 'None'}</div>
                  <div>
                    <strong>Occurrences in Templates:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.78rem', marginTop: '6px', color: '#94a3b8' }}>
                      <span>Question: {getVariableOccurrences(activeInspectorVar).question}</span>
                      <span>Solution: {getVariableOccurrences(activeInspectorVar).solution}</span>
                      <span>Options: {getVariableOccurrences(activeInspectorVar).options}</span>
                    </div>
                  </div>
                  <div><strong>Current Value:</strong> {resolvedValues[activeInspectorVar] !== undefined ? String(resolvedValues[activeInspectorVar]) : '-'}</div>
                </div>
              </div>
            )}
            
            {/* Live AI suggestions banner */}
            {aiAuditReport && (
              <div style={{ background: '#1e1b4b', border: '1.5px solid #3730a3', padding: '16px', borderRadius: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '8px' }}>🤖 AI Audit Report (Score: {aiAuditReport.score})</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(aiAuditReport.issues || []).map((issue, idx) => (
                    <li key={idx}><strong>[{issue.severity}]</strong> {issue.message}</li>
                  ))}
                </ul>
                <button className="mc-shuffle-btn" onClick={handleAiFix} disabled={isFixingTemplate} style={{ marginTop: '12px', background: '#6366f1', color: 'white', border: 'none' }}>
                  {isFixingTemplate ? '🔧 Fixing...' : '🔧 Auto-Fix with AI'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
