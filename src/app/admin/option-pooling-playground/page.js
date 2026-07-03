'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { evaluateTemplate } from '@/lib/practice/generators/universalEvaluator';
import { generateFromDynamicPool } from '@/lib/practice/engine/DynamicPoolGenerator';
import QuestionRenderer from '@/components/practice/QuestionRenderer';

// Pre-packaged pool example templates for the copy-paste JSON playground
const POOL_EXAMPLES = {
  shapes: {
    poolId: "maths-shapes-2d",
    subject: "math",
    topic: "geometry",
    pools: {
      circle: [
        { id: "circle_1", label: "Circle", imageUrl: "/images/shape_circle.svg", color: "red" },
        { id: "circle_2", label: "Round Ring", imageUrl: "/images/shape_ring.svg", color: "blue" }
      ],
      square: [
        { id: "square_1", label: "Square", imageUrl: "/images/shape_square.svg", color: "green" },
        { id: "square_2", label: "Box Shape", imageUrl: "/images/shape_box.svg", color: "yellow" }
      ],
      triangle: [
        { id: "triangle_1", label: "Triangle", imageUrl: "/images/shape_triangle.svg", color: "purple" }
      ]
    }
  },
  nounsVerbs: {
    poolId: "grammar-nouns-verbs",
    subject: "english",
    topic: "grammar",
    pools: {
      nouns: [
        { id: "apple", label: "apple", sentence: "The apple is sweet.", nouns: ["apple"] },
        { id: "dog", label: "dog", sentence: "The dog barked loudly.", nouns: ["dog"] }
      ],
      verbs: [
        { id: "run", label: "run", sentence: "We run fast.", verbs: ["run"] },
        { id: "jump", label: "jump", sentence: "You jump high.", verbs: ["jump"] }
      ]
    }
  }
};

export default function OptionPoolingPlayground() {
  // Pool management states
  const [poolsList, setPoolsList] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [activePool, setActivePool] = useState(null);
  const [loadingPool, setLoadingPool] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(POOL_EXAMPLES.shapes, null, 2));
  const [jsonError, setJsonError] = useState('');

  // Template configuration states
  const [mode, setMode] = useState('dynamic_pool'); // 'dynamic_pool' (Pure Engine) or 'universal' (Custom Builder)
  
  // A. Pure Dynamic Pool parameters
  const [interactionType, setInteractionType] = useState('mcq'); // 'mcq' | 'categorization' | 'word_completion' | 'interactive_stickers'
  const [missingLetterMode, setMissingLetterMode] = useState('beginning');
  const [difficultyLevel, setDifficultyLevel] = useState('easy');
  const [grade, setGrade] = useState('lkg');
  const [wordCount, setWordCount] = useState(2);
  const [itemsPerCategory, setItemsPerCategory] = useState(2);
  const [dynamicTargetCategory, setDynamicTargetCategory] = useState('');
  const [dynamicQuestionText, setDynamicQuestionText] = useState('Identify the {{targetCategory}}?');

  // B. Universal Custom parameters
  const [dataSourceName, setDataSourceName] = useState('TargetNoun');
  const [targetCategory, setTargetCategory] = useState('');
  const [selectionCount, setSelectionCount] = useState(1);
  const [targetProperty, setTargetProperty] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [distractorProperty, setDistractorProperty] = useState('');
  const [distractorValue, setDistractorValue] = useState('');
  
  const [questionText, setQuestionText] = useState('Identify the [TargetNoun[0].label]?');
  const [choicesMode, setChoicesMode] = useState('auto'); // 'auto' (automatic distractors) or 'custom'
  const [option1, setOption1] = useState('[TargetNoun[0].label]');
  const [option2, setOption2] = useState('[TargetNoun:distractors[0].label]');
  const [option3, setOption3] = useState('[TargetNoun:distractors[1].label]');

  // Variant control
  const [seed, setSeed] = useState('1001');

  // Preview / Simulation Interactive States
  const [userAnswer, setUserAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showJson, setShowJson] = useState(true);

  // AI pool generation states
  const [aiPoolId, setAiPoolId] = useState('nature-elements');
  const [aiCategory, setAiCategory] = useState('insects');
  const [aiSubject, setAiSubject] = useState('science');
  const [aiTopic, setAiTopic] = useState('biology');
  const [aiInstruction, setAiInstruction] = useState('');
  const [generatingPool, setGeneratingPool] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Fetch list of pools from API
  const fetchPools = async () => {
    try {
      const res = await fetch('/api/admin/vocabulary-pools');
      const data = await res.json();
      if (data.success && Array.isArray(data.pools)) {
        setPoolsList(data.pools);
      }
    } catch (err) {
      console.error('Failed to fetch pools:', err);
    }
  };

  useEffect(() => {
    fetchPools();
    // Default load shapes example
    setActivePool(POOL_EXAMPLES.shapes);
  }, []);

  // Fetch individual pool details
  const handleSelectPool = async (poolId) => {
    setSelectedPoolId(poolId);
    if (!poolId) return;
    setLoadingPool(true);
    setJsonError('');
    try {
      const res = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId)}`);
      const data = await res.json();
      if (data.success && data.pool) {
        setActivePool(data.pool);
        setJsonText(JSON.stringify(data.pool, null, 2));
      } else {
        setJsonError(data.error || 'Failed to fetch pool details');
      }
    } catch (err) {
      setJsonError('Failed to fetch pool details: ' + err.message);
    } finally {
      setLoadingPool(false);
    }
  };

  // Apply custom JSON pool
  const handleApplyJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.poolId) {
        throw new Error('JSON is missing a "poolId" property.');
      }
      if (!parsed.pools) {
        throw new Error('JSON must contain a "pools" object with categories.');
      }
      setActivePool(parsed);
      setSelectedPoolId('');
      setUserAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } catch (err) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  // AI Pool Generator call
  const handleAiGeneratePool = async () => {
    if (!aiCategory.trim()) return;
    setGeneratingPool(true);
    setJsonError('');
    setAiSuccessMsg('');
    try {
      const res = await fetch('/api/admin/vocabulary-pools/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: aiPoolId || activePool?.poolId || 'custom-pool',
          category: aiCategory,
          subject: aiSubject,
          topic: aiTopic,
          count: 5,
          instruction: aiInstruction
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const newPool = activePool ? JSON.parse(JSON.stringify(activePool)) : {
          poolId: aiPoolId || 'custom-pool',
          subject: aiSubject,
          topic: aiTopic,
          pools: {}
        };
        newPool.pools[aiCategory] = data.items;
        setActivePool(newPool);
        setJsonText(JSON.stringify(newPool, null, 2));
        setAiSuccessMsg(`✨ AI successfully generated ${data.items.length} items for "${aiCategory}"!`);
      } else {
        setJsonError(data.error || 'Failed to generate words via Gemini');
      }
    } catch (err) {
      setJsonError('Failed to generate words: ' + err.message);
    } finally {
      setGeneratingPool(false);
    }
  };

  // Set first category of the active pool as default target category
  useEffect(() => {
    if (activePool && activePool.pools) {
      const categories = Object.keys(activePool.pools);
      if (categories.length > 0) {
        setTargetCategory(categories[0]);
      }
    }
  }, [activePool]);

  // Load example presets
  const handleLoadPreset = (key) => {
    const preset = POOL_EXAMPLES[key];
    setJsonText(JSON.stringify(preset, null, 2));
    setActivePool(preset);
    setSelectedPoolId('');
    setUserAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  // Randomize Seed
  const handleRandomizeSeed = () => {
    setSeed(String(Math.floor(Math.random() * 9000) + 1000));
    setUserAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  // helper function to verify property filters on client-side
  const matchesPropertyFilter = (option, property, value) => {
    const prop = String(property || '').trim();
    const expected = String(value || '').trim();
    if (!prop || !expected) return true;
    const actual = option?.[prop];
    if (Array.isArray(actual)) {
      return actual.map(entry => String(entry).toLowerCase()).includes(expected.toLowerCase());
    }
    return String(actual ?? '').toLowerCase() === expected.toLowerCase();
  };

  // Client-side template compiler & evaluator
  const resolvedTemplate = useMemo(() => {
    if (!activePool) return null;

    if (mode === 'dynamic_pool') {
      return {
        id: activePool.poolId + '-dynamic',
        type: 'dynamic_pool',
        poolId: activePool.poolId,
        pools: activePool.pools,
        interaction: interactionType,
        missingLetterMode,
        difficultyLevel,
        grade,
        wordCount,
        itemsPerCategory,
        targetCategory: dynamicTargetCategory || undefined,
        questionText: interactionType === 'mcq' ? dynamicQuestionText : undefined
      };
    }

    // Mode B: Universal Template Custom layout structure
    const targetCats = targetCategory ? [targetCategory] : [];
    let correctItems = targetCats.flatMap(cat => activePool.pools?.[cat] || []);
    const targetSet = new Set(targetCats);
    let distractorItems = Object.entries(activePool.pools || {})
      .filter(([cat]) => !targetSet.has(cat) && cat !== 'correctPool' && cat !== 'distractorPool')
      .flatMap(([, items]) => items);
    const categoryLabel = targetCategory || '';

    if (targetProperty && targetValue) {
      correctItems = correctItems.filter(item => matchesPropertyFilter(item, targetProperty, targetValue));
    }
    if (distractorProperty && distractorValue) {
      distractorItems = distractorItems.filter(item => matchesPropertyFilter(item, distractorProperty, distractorValue));
    }

    const mockDataSource = {
      id: dataSourceName,
      name: dataSourceName,
      type: 'pool_selection',
      poolId: activePool.poolId,
      category: targetCategory,
      count: selectionCount,
      items: correctItems,
      _distractorItems: distractorItems,
      _categoryLabel: categoryLabel
    };

    // Construct custom options list based on choice settings
    let finalOptions = [];
    if (choicesMode === 'auto') {
      // Auto MCQ choices mapping: Correct item + 2 distractors
      finalOptions = [
        { label: `[${dataSourceName}[0].label]`, isCorrect: true },
        { label: `[${dataSourceName}:distractors[0].label]`, isCorrect: false },
        { label: `[${dataSourceName}:distractors[1].label]`, isCorrect: false }
      ];
    } else {
      // Custom option expressions
      finalOptions = [
        { label: option1, isCorrect: true },
        { label: option2, isCorrect: false },
        { label: option3, isCorrect: false }
      ];
    }

    return {
      id: activePool.poolId + '-universal',
      type: 'universal',
      subject: activePool.subject || 'math',
      topic: activePool.topic || 'general',
      layoutConfig: { mode: 'prompt_top' },
      dataSources: [mockDataSource],
      questionText,
      optionsType: 'mcq',
      options: finalOptions
    };
  }, [
    activePool, mode, interactionType, missingLetterMode, difficultyLevel, grade, wordCount,
    itemsPerCategory, dynamicTargetCategory, dynamicQuestionText, dataSourceName, targetCategory, 
    selectionCount, targetProperty, targetValue, distractorProperty, distractorValue, questionText, 
    choicesMode, option1, option2, option3
  ]);

  // Evaluate the compiled template with the given seed
  const evaluatedQuestion = useMemo(() => {
    if (!resolvedTemplate || !activePool) return null;
    try {
      if (resolvedTemplate.type === 'dynamic_pool') {
        const q = generateFromDynamicPool(
          resolvedTemplate,
          seed,
          difficultyLevel,
          {},
          grade
        );
        return { ok: true, question: q };
      } else {
        // Universal template evaluation
        const q = evaluateTemplate(resolvedTemplate, seed);
        return { ok: true, question: q };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [resolvedTemplate, activePool, seed, difficultyLevel, grade]);

  // Handle interactive preview answers
  const handleAnswer = (val) => {
    setUserAnswer(val);
    const q = evaluatedQuestion?.question;
    if (!q) return;

    if (q.type === 'mcq') {
      const correctIdx = q.correctAnswerIndex ?? q.options?.findIndex(o => o.isCorrect);
      const correct = Number(val) === correctIdx;
      setIsCorrect(correct);
    } else if (q.type === 'fillInTheBlank') {
      // Single blank matching
      const userStr = String(val?.ans || val || '').trim().toLowerCase();
      const correctStr = String(q.correctAnswer || q.answer?.ans || '').trim().toLowerCase();
      setIsCorrect(userStr === correctStr);
    } else if (q.type === 'categorization' || q.type === 'categorizationv2') {
      // Direct correct checking if layout has answer mapping
      setIsCorrect(true);
    }
    setIsAnswered(true);
  };

  const handleResetAnswer = () => {
    setUserAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #06101e 0%, #0c1a2e 50%, #0a1628 100%)',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#f0f9ff',
      padding: '24px'
    }}>
      <style>{`
        input:focus, select:focus, textarea:focus {
          outline: none !important;
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 2px rgba(14,165,233,0.25) !important;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(14,165,233,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.35); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(14,165,233,0.55); }
      `}</style>
      {/* Top Navigation */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(14, 165, 233, 0.2)',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Flask/Lab Icon */}
            <div style={{
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.1))',
              border: '1px solid rgba(14,165,233,0.35)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(14,165,233,0.2)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6M9 3v7l-5 9a1 1 0 00.9 1.5h14.2a1 1 0 00.9-1.5L15 10V3"/>
                <circle cx="10.5" cy="17" r="0.5" fill="#38bdf8"/>
                <circle cx="13.5" cy="15" r="0.5" fill="#7dd3fc"/>
                <circle cx="11.5" cy="19" r="0.3" fill="#38bdf8"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #f0f9ff, #7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Option Pooling Playground
            </h1>
          </div>
          <p style={{ color: '#7dd3fc', opacity: 0.7, fontSize: '13px', margin: '6px 0 0 32px' }}>
            Interactive testing playground to create, preview, and validate dynamic vocabulary option pools.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/docs/option-pooling" style={{
            background: 'rgba(14,165,233,0.07)',
            border: '1px solid rgba(14,165,233,0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            color: '#7dd3fc',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            Read Guide
          </Link>
          <Link href="/admin/vocabulary-pools" style={{
            background: 'rgba(14,165,233,0.07)',
            border: '1px solid rgba(14,165,233,0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            color: '#7dd3fc',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14.5" x2="15" y2="14.5"/></svg>
            Manage Pools
          </Link>
          <Link href="/admin/templates" style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            padding: '8px 18px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Template Editor
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Sidebar: Pool Selection & JSON Editor */}
        <aside style={{
          background: 'rgba(12, 26, 46, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(14, 165, 233, 0.18)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 4px 24px rgba(14,165,233,0.06)'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              1. Choose Vocabulary Pool
            </h3>
            
            {/* Database dropdown */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>
                Load Existing Pool ID
              </label>
              <select
                value={selectedPoolId}
                onChange={(e) => handleSelectPool(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">-- Choose Pool from DB --</option>
                {poolsList.map(p => (
                  <option key={p.poolId} value={p.poolId}>
                    {p.poolId} ({Object.keys(p.categoryCounts || {}).length} categories)
                  </option>
                ))}
              </select>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => handleLoadPreset('shapes')}
                style={{
                  flex: 1,
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  color: '#7dd3fc',
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                🔷 Preset: shapes-2d
              </button>
              <button
                onClick={() => handleLoadPreset('nounsVerbs')}
                style={{
                  flex: 1,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#6ee7b7',
                  padding: '6px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                📝 Preset: grammar-nouns
              </button>
            </div>

            {/* JSON Schema Playboard */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>
                Paste / Edit Pool JSON Structure
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                style={{
                  width: '100%',
                  height: '240px',
                  background: '#020c14',
                  border: '1px solid rgba(14,165,233,0.15)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#a7f3d0',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  resize: 'none',
                  outline: 'none'
                }}
              />
              {jsonError && (
                <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                  ❌ {jsonError}
                </div>
              )}
              <button
                onClick={handleApplyJson}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  marginTop: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.3)'
                }}
              >
                ⚡ Apply Custom JSON Pool
              </button>
            </div>

            {/* AI Generator Panel */}
            <div style={{
              background: 'rgba(14,165,233,0.04)',
              border: '1px solid rgba(14,165,233,0.15)',
              borderRadius: '10px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>
                AI Pool Generator
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    New Category Name
                  </label>
                  <input
                    type="text"
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    placeholder="e.g. insects, ocean_animals"
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                      Topic
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
                    Extra AI Instructions (optional)
                  </label>
                  <input
                    type="text"
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    placeholder="e.g. Include animal sounds"
                    style={{
                      width: '100%',
                      background: '#090d16',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                </div>

                {aiSuccessMsg && (
                  <div style={{ color: '#34d399', fontSize: '10px', fontWeight: '600' }}>
                    {aiSuccessMsg}
                  </div>
                )}

                <button
                  onClick={handleAiGeneratePool}
                  disabled={generatingPool}
                  style={{
                    width: '100%',
                    background: generatingPool ? '#1e3a4c' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#fff',
                    border: generatingPool ? '1px solid rgba(14,165,233,0.2)' : 'none',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: generatingPool ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                    boxShadow: generatingPool ? 'none' : '0 4px 14px rgba(14,165,233,0.3)'
                  }}
                >
                  {generatingPool ? '⏳ Generating via Gemini...' : '✨ Generate via Gemini AI'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Pool Overview Info */}
          {activePool && (
            <div style={{
              background: 'rgba(14,165,233,0.06)',
              borderRadius: '8px',
              padding: '12px',
              borderLeft: '3px solid #0ea5e9',
              boxShadow: '0 0 10px rgba(14,165,233,0.08)'
            }}>
              <div style={{ fontSize: '11px', color: '#7dd3fc', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ✦ Active Option Pool
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '2px', color: '#38bdf8' }}>
                {activePool.poolId}
              </div>
              <div style={{ fontSize: '11px', color: '#bae6fd', marginTop: '6px', opacity: 0.8 }}>
                Categories: {Object.keys(activePool.pools || {}).join(', ')}
              </div>
            </div>
          )}
        </aside>

        {/* Right Workspace: Configurator & Real-time Previews */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Step 2: Select Mode and Parameters */}
          <section style={{
            background: 'rgba(12, 26, 46, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(14, 165, 233, 0.18)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(14,165,233,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                2. Configure Question & Engine Parameters
              </h3>
              
              {/* Mode Select Tabs */}
              <div style={{
                background: '#020c14',
                padding: '4px',
                borderRadius: '8px',
                display: 'flex',
                gap: '4px',
                border: '1px solid rgba(14,165,233,0.2)'
              }}>
                <button
                  onClick={() => setMode('dynamic_pool')}
                  style={{
                    background: mode === 'dynamic_pool' ? 'rgba(14,165,233,0.18)' : 'transparent',
                    border: mode === 'dynamic_pool' ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                    color: mode === 'dynamic_pool' ? '#7dd3fc' : '#64748b',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ⚡ A. Dynamic Pool Engine
                </button>
                <button
                  onClick={() => setMode('universal')}
                  style={{
                    background: mode === 'universal' ? 'rgba(14,165,233,0.18)' : 'transparent',
                    border: mode === 'universal' ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                    color: mode === 'universal' ? '#7dd3fc' : '#64748b',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📐 B. Universal Custom template
                </button>
              </div>
            </div>

            {/* A. Pure Dynamic Pool Parameters */}
            {mode === 'dynamic_pool' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                    Interaction Format
                  </label>
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  >
                    <option value="mcq">Standard MCQ (Single Select)</option>
                    <option value="categorization">Categorization / Sorting</option>
                    <option value="word_completion">Word Completion (Phonics)</option>
                    <option value="interactive_stickers">Drag-and-Drop Stickers</option>
                  </select>
                </div>

                {interactionType === 'word_completion' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Missing Letter Placement
                    </label>
                    <select
                      value={missingLetterMode}
                      onChange={(e) => setMissingLetterMode(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    >
                      <option value="beginning">Beginning Sound (e.g. _at)</option>
                      <option value="middle">Middle Sound (e.g. c_t)</option>
                      <option value="ending">Ending Sound (e.g. ca_)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                    Target Grade
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  >
                    <option value="lkg">LKG / Pre-K</option>
                    <option value="ukg">UKG / Kindergarten</option>
                    <option value="class1">Class 1</option>
                    <option value="class2">Class 2</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                    Difficulty Level
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  >
                    <option value="easy">Easy (fewer options)</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard (more options)</option>
                  </select>
                </div>

                {interactionType === 'mcq' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Target Category (Mode A)
                    </label>
                    <select
                      value={dynamicTargetCategory}
                      onChange={(e) => setDynamicTargetCategory(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    >
                      <option value="">-- Random Category --</option>
                      {activePool && activePool.pools && Object.keys(activePool.pools)
                        .filter(k => k !== 'correctPool' && k !== 'distractorPool')
                        .map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))
                      }
                    </select>
                  </div>
                )}

                {interactionType === 'mcq' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Question Prompt Pattern (Mode A)
                    </label>
                    <input
                      type="text"
                      value={dynamicQuestionText}
                      onChange={(e) => setDynamicQuestionText(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                )}

                {interactionType === 'word_completion' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Word count to complete
                    </label>
                    <input
                      type="number"
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                )}

                {interactionType === 'categorization' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Items Per Category
                    </label>
                    <input
                      type="number"
                      value={itemsPerCategory}
                      onChange={(e) => setItemsPerCategory(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* B. Universal Custom template parameters */}
            {mode === 'universal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      DataSource Name (Variable)
                    </label>
                    <input
                      type="text"
                      value={dataSourceName}
                      onChange={(e) => setDataSourceName(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Target Category Filter
                    </label>
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    >
                      {activePool && Object.keys(activePool.pools || {}).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                      Items Count to Pull
                    </label>
                    <input
                      type="number"
                      value={selectionCount}
                      onChange={(e) => setSelectionCount(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Property filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Target Property Filter (e.g. color)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Key"
                        value={targetProperty}
                        onChange={(e) => setTargetProperty(e.target.value)}
                        style={{ flex: 1, background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        style={{ flex: 1, background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Distractor Property Filter
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Key"
                        value={distractorProperty}
                        onChange={(e) => setDistractorProperty(e.target.value)}
                        style={{ flex: 1, background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={distractorValue}
                        onChange={(e) => setDistractorValue(e.target.value)}
                        style={{ flex: 1, background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Prompt Template */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '600' }}>
                    Blueprint Prompt Text (square brackets evaluate properties)
                  </label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Examples:</span>
                    <button onClick={() => setQuestionText('Identify the [TargetNoun[0].label]?')} style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
                      Text Label
                    </button>
                    <button onClick={() => setQuestionText('Which one matches: [TargetNoun[0].imageUrl]?')} style={{ background: 'none', border: 'none', color: '#a5b4fc', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
                      Visual Image
                    </button>
                  </div>
                </div>

                {/* MCQ Choices */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>
                      MCQ Choices Configuration
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={choicesMode === 'auto'}
                          onChange={() => setChoicesMode('auto')}
                        />
                        Auto Distractors (From other categories)
                      </label>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={choicesMode === 'custom'}
                          onChange={() => setChoicesMode('custom')}
                        />
                        Custom Options Formula
                      </label>
                    </div>
                  </div>

                  {choicesMode === 'custom' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                          Option 1 (Correct)
                        </label>
                        <input
                          type="text"
                          value={option1}
                          onChange={(e) => setOption1(e.target.value)}
                          style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                          Option 2 (Incorrect)
                        </label>
                        <input
                          type="text"
                          value={option2}
                          onChange={(e) => setOption2(e.target.value)}
                          style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                          Option 3 (Incorrect)
                        </label>
                        <input
                          type="text"
                          value={option3}
                          onChange={(e) => setOption3(e.target.value)}
                          style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Seed and Evaluation Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(14,165,233,0.04)',
            border: '1px solid rgba(14,165,233,0.15)',
            padding: '12px 20px',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                SEED:
              </span>
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                style={{
                  width: '80px',
                  background: '#020c14',
                  border: '1px solid rgba(14,165,233,0.25)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#7dd3fc',
                  fontSize: '13px',
                  textAlign: 'center',
                  fontWeight: '700'
                }}
              />
              <button
                onClick={handleRandomizeSeed}
                style={{
                  background: 'rgba(14,165,233,0.1)',
                  border: '1px solid rgba(14,165,233,0.25)',
                  color: '#7dd3fc',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                🎲 Randomize Seed
              </button>
              <button
                onClick={() => setShowJson(!showJson)}
                style={{
                  background: showJson ? 'rgba(239, 68, 68, 0.1)' : 'rgba(14,165,233,0.1)',
                  border: showJson ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(14,165,233,0.25)',
                  color: showJson ? '#fca5a5' : '#7dd3fc',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                {showJson ? '👁️ Hide JSON' : '👁️ Show JSON'}
              </button>
            </div>
            {isAnswered && (
              <button
                onClick={handleResetAnswer}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Clear Student Answer State
              </button>
            )}
          </div>

          {/* Step 3: Question Preview & Output */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: showJson ? '1fr 1fr' : '1fr',
            gap: '24px'
          }}>
            {/* Live Visual Preview */}
            <section style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              color: '#0f172a',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <div>
                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '16px'
                }}>
                  Live Student Practice Simulator
                </span>
                
                {evaluatedQuestion ? (
                  evaluatedQuestion.ok ? (
                    <QuestionRenderer
                      question={evaluatedQuestion.question}
                      userAnswer={userAnswer}
                      onAnswer={handleAnswer}
                      onSubmit={handleAnswer}
                      isAnswered={isAnswered}
                      isCorrect={isCorrect}
                    />
                  ) : (
                    <div style={{ color: '#ef4444', padding: '20px 0', fontWeight: '700' }}>
                      ⚠️ Evaluation Error: {evaluatedQuestion.error}
                    </div>
                  )
                ) : (
                  <div style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>
                    Load or create an option pool first to generate the preview.
                  </div>
                )}
              </div>

              {/* Feedback strip */}
              {isAnswered && (
                <div style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: isCorrect ? '#f0fdf4' : '#fef2f2',
                  border: isCorrect ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>{isCorrect ? '✅' : '❌'}</span>
                  <div>
                    <div style={{ fontWeight: '800', color: isCorrect ? '#166534' : '#991b1b', fontSize: '13px' }}>
                      {isCorrect ? 'Correct Answer!' : 'Incorrect Choice'}
                    </div>
                    <div style={{ color: isCorrect ? '#15803d' : '#b91c1c', fontSize: '11px', marginTop: '2px' }}>
                      {evaluatedQuestion?.question?.explanation || 'See structural explanation in JSON.'}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Structured JSON Output */}
            {showJson && (
              <section style={{
                background: '#020c14',
                border: '1px solid rgba(14,165,233,0.15)',
                borderRadius: '16px',
                padding: '20px',
                maxHeight: '440px',
                overflowY: 'auto',
                boxShadow: 'inset 0 0 20px rgba(14,165,233,0.04)'
              }}>
                <span style={{
                  background: 'rgba(14,165,233,0.1)',
                  color: '#38bdf8',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '16px',
                  border: '1px solid rgba(14,165,233,0.2)'
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  Generated Question Payload
                </span>

                {evaluatedQuestion && evaluatedQuestion.ok ? (
                  <pre style={{
                    margin: 0,
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#cbd5e1',
                    fontFamily: 'monospace'
                  }}>
                    {JSON.stringify(evaluatedQuestion.question, null, 2)}
                  </pre>
                ) : (
                  <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '12px' }}>
                    {evaluatedQuestion?.error || 'Empty payload'}
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
