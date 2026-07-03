'use client';

import React, { useState, useEffect } from 'react';
import SiteHeader from '../../../components/layout/SiteHeader';

const PRESETS = [
  'Create a 3-shape mirror question with a square top-left, circle top-right, and triangle bottom-center.',
  'Rotate a diamond and star 90 degrees clockwise.',
  'Swap a circle and a cross horizontally.',
  'Reflect a split triangle (black on right) vertically.',
  'Create a complex Level 3 question with 4 shapes: square, circle, diamond, and cross.'
];

const PREDESIGNED_TEMPLATES = {
  text_mirror_fan: {
    name: 'Mirror Alphanumeric Text (FAN)',
    layoutMode: 'standard',
    tilt: false,
    transformation: { type: 'mirror_h' },
    objects: [
      { id: 'sq', type: 'text', x: 50, y: 50, size: 24, fill: 'dark', textVal: 'FAN' }
    ]
  },
  text_mirror_class: {
    name: 'Mirror Alphanumeric Text (CLASS)',
    layoutMode: 'standard',
    tilt: false,
    transformation: { type: 'mirror_h' },
    objects: [
      { id: 'sq', type: 'text', x: 50, y: 50, size: 24, fill: 'dark', textVal: 'CLASS' }
    ]
  },
  pattern_diagonals: {
    name: 'Pattern Completion (Diagonals & Divider)',
    layoutMode: 'pattern',
    tilt: false,
    transformation: { type: 'rotate', degrees: 90 },
    objects: [
      { id: 'sq', type: 'line', x: 50, y: 50, size: 15, fill: 'primary', x1: 10, y1: 10, x2: 90, y2: 90 },
      { id: 'ci', type: 'line', x: 50, y: 50, size: 15, fill: 'primary', x1: 90, y1: 10, x2: 10, y2: 90 },
      { id: 'tri', type: 'line', x: 50, y: 50, size: 15, fill: 'primary', x1: 50, y1: 10, x2: 50, y2: 90 }
    ]
  },
  pattern_concentric: {
    name: 'Pattern Completion (Concentric Shapes)',
    layoutMode: 'pattern',
    tilt: false,
    transformation: { type: 'rotate', degrees: 90 },
    objects: [
      { id: 'sq', type: 'circle', x: 50, y: 50, size: 40, fill: 'white', stroke: 'primary' },
      { id: 'ci', type: 'square', x: 50, y: 50, size: 45, fill: 'white', stroke: 'secondary' },
      { id: 'tri', type: 'circle', x: 50, y: 50, size: 20, fill: 'white', stroke: 'accent' }
    ]
  },
  analogy_triangle: {
    name: 'Analogy (Triangle Split Shading)',
    layoutMode: 'analogy',
    tilt: false,
    transformation: { type: 'rotate', degrees: 180 },
    objects: [
      { id: 'sq', type: 'triangle', x: 50, y: 50, size: 22, fill: 'white', fillRegion: 'right' }
    ]
  },
  rotation_arrow: {
    name: 'Standard Transformation (Arrow Rotation)',
    layoutMode: 'standard',
    tilt: false,
    transformation: { type: 'rotate', degrees: 90 },
    objects: [
      { id: 'sq', type: 'arrow', x: 50, y: 50, size: 20, fill: 'primary' }
    ]
  },
  odd_man_out_letters: {
    name: 'Odd-Man Out (KIT letters discrepancy)',
    layoutMode: 'odd_man_out',
    tilt: false,
    transformation: { type: 'mirror_h' },
    objects: [
      { id: 'sq', type: 'text', x: 50, y: 50, size: 24, fill: 'dark', textVal: 'KIT' }
    ]
  },
  odd_man_out_arrows: {
    name: 'Odd-Man Out (Arrow Orientations)',
    layoutMode: 'odd_man_out',
    tilt: false,
    transformation: { type: 'mirror_h' },
    objects: [
      { id: 'sq', type: 'arrow', x: 50, y: 50, size: 20, fill: 'primary' }
    ]
  },
  series_circles: {
    name: 'Figure Series Completion (Expanding Circles)',
    layoutMode: 'series',
    tilt: false,
    transformation: { type: 'scale', factor: 1.3 },
    objects: [
      { id: 'sq', type: 'circle', x: 50, y: 50, size: 10, fill: 'white', stroke: 'primary' }
    ]
  },
  series_lines: {
    name: 'Figure Series Completion (Rotating Lines)',
    layoutMode: 'series',
    tilt: false,
    transformation: { type: 'rotate', degrees: 45 },
    objects: [
      { id: 'sq', type: 'line', x: 50, y: 50, size: 15, fill: 'primary', x1: 50, y1: 15, x2: 50, y2: 85 }
    ]
  },
  punched_hole_q29: {
    name: 'Punched Hole Pattern (Paper Folding Q29)',
    layoutMode: 'punched_hole',
    tilt: false,
    transformation: null,
    objects: [
      { id: 'p1', enabled: true, type: 'circle', x: 15, y: 15, size: 8, fill: 'white' },
      { id: 'p2', enabled: true, type: 'circle', x: 20, y: 10, size: 8, fill: 'white' }
    ]
  }
};

export default function VisualGeneratorPage() {
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'builder'
  
  // Prompt Mode States
  const [prompt, setPrompt] = useState(PRESETS[0]);
  
  // Visual Builder Mode States
  const [layoutMode, setLayoutMode] = useState('standard');
  const [transformationType, setTransformationType] = useState('mirror_h');
  const [rotateDegrees, setRotateDegrees] = useState(90);
  const [swapId1, setSwapId1] = useState('sq');
  const [swapId2, setSwapId2] = useState('ci');
  const [tilt, setTilt] = useState(false);
  
  const [shapes, setShapes] = useState([
    { id: 'sq', enabled: true, type: 'square', x: 25, y: 35, size: 14, fill: 'primary', fillRegion: null, textVal: 'A', x1: 15, y1: 35, x2: 35, y2: 35 },
    { id: 'ci', enabled: true, type: 'circle', x: 75, y: 35, size: 8, fill: 'secondary', fillRegion: null, textVal: '', x1: 65, y1: 35, x2: 85, y2: 35 },
    { id: 'tri', enabled: true, type: 'triangle', x: 50, y: 65, size: 20, fill: 'white', fillRegion: 'right', textVal: '', x1: 40, y1: 65, x2: 60, y2: 65 },
    { id: 'dia', enabled: false, type: 'diamond', x: 50, y: 35, size: 12, fill: 'warning', fillRegion: null, textVal: '', x1: 40, y1: 35, x2: 60, y2: 35 }
  ]);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState(null);
  const [jsonConfig, setJsonConfig] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  // Sync builder changes to JSON config
  useEffect(() => {
    if (activeTab === 'builder') {
      const activeShapes = shapes
        .filter(s => s.enabled)
        .map(({ enabled, ...rest }) => {
          // Clean unused parameters depending on shape type
          const cleaned = { ...rest };
          if (rest.type !== 'text') delete cleaned.textVal;
          if (rest.type !== 'line') {
            delete cleaned.x1;
            delete cleaned.y1;
            delete cleaned.x2;
            delete cleaned.y2;
          }
          return cleaned;
        });

      const config = {
        tilt,
        layoutMode,
        objects: activeShapes,
        transformation: {
          type: transformationType,
          ...(transformationType === 'rotate' ? { degrees: Number(rotateDegrees) } : {}),
          ...(transformationType === 'swap_positions' ? { id1: swapId1, id2: swapId2 } : {})
        }
      };
      setJsonConfig(JSON.stringify(config, null, 2));
    }
  }, [shapes, transformationType, rotateDegrees, swapId1, swapId2, tilt, layoutMode, activeTab]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/practice/generate-visual-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) {
        setQuestion(data);
        setJsonConfig(JSON.stringify(data.config, null, 2));
        
        // Try parsing into visual builder controls if structures align
        if (data.config?.objects) {
          const loadedShapes = shapes.map(orig => {
            const match = data.config.objects.find(o => o.id === orig.id);
            if (match) {
              return { ...orig, enabled: true, ...match };
            }
            return { ...orig, enabled: false };
          });
          setShapes(loadedShapes);
          setTilt(!!data.config.tilt);
          if (data.config.transformation) {
            setTransformationType(data.config.transformation.type);
            if (data.config.transformation.degrees) setRotateDegrees(data.config.transformation.degrees);
            if (data.config.transformation.id1) setSwapId1(data.config.transformation.id1);
            if (data.config.transformation.id2) setSwapId2(data.config.transformation.id2);
          }
        }
      } else {
        setError(data.error || 'Failed to generate');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateFromJson(explicitConfig = null) {
    setLoading(true);
    setError(null);
    try {
      const config = explicitConfig || JSON.parse(jsonConfig);
      const res = await fetch('/api/practice/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setQuestion({
          ...question,
          ...data,
          config
        });
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (err) {
      setError('Invalid JSON structure: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleShapeChange = (index, field, value) => {
    const updated = [...shapes];
    updated[index][field] = value;
    setShapes(updated);
  };

  const handleLoadTemplate = (key) => {
    const tpl = PREDESIGNED_TEMPLATES[key];
    if (!tpl) return;
    
    setLayoutMode(tpl.layoutMode);
    setTilt(tpl.tilt);
    if (tpl.transformation) {
      setTransformationType(tpl.transformation.type);
      if (tpl.transformation.degrees) setRotateDegrees(tpl.transformation.degrees);
      if (tpl.transformation.id1) setSwapId1(tpl.transformation.id1);
      if (tpl.transformation.id2) setSwapId2(tpl.transformation.id2);
    }
    
    const newShapes = shapes.map(orig => {
      const match = tpl.objects.find(o => o.id === orig.id);
      if (match) {
        return {
          ...orig,
          enabled: true,
          type: match.type || 'circle',
          x: match.x ?? 50,
          y: match.y ?? 50,
          size: match.size ?? 16,
          fill: match.fill || 'white',
          fillRegion: match.fillRegion || null,
          textVal: match.textVal || '',
          x1: match.x1 ?? (match.x - 15),
          y1: match.y1 ?? match.y,
          x2: match.x2 ?? (match.x + 15),
          y2: match.y2 ?? match.y
        };
      }
      return { ...orig, enabled: false };
    });
    setShapes(newShapes);

    const activeShapes = tpl.objects;
    const config = {
      tilt: tpl.tilt,
      layoutMode: tpl.layoutMode,
      objects: activeShapes,
      transformation: tpl.transformation
    };
    
    setJsonConfig(JSON.stringify(config, null, 2));
    handleUpdateFromJson(config);
  };

  async function handleSaveToDb() {
    if (!question) return;
    setLoading(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: 'aissee',
          section: 'intelligence',
          topic: question.config?.topic || 'visual-transformation',
          difficulty: question.config?.difficulty || 0.5,
          questionText: question.questionText,
          options: question.options,
          correctOption: question.correctOption,
          explanationText: question.explanationText,
          tags: ['visual-transformation', 'ai-generated'],
          status: 'active'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
      } else {
        setError(data.error || 'Failed to save question');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <SiteHeader />
      
      <main className="main-content">
        <div className="header-section">
          <h1>Visual Question Builder</h1>
          <p>Instantly generate and configure figure matching, mirror reflection, and rotation questions.</p>
        </div>

        {/* Tab Selector */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            ✨ AI Prompt Mode
          </button>
          <button 
            className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            🛠️ Visual Builder Mode
          </button>
        </div>

        <div className="grid-container">
          
          {/* Left panel */}
          <div className="input-panel card">
            
            {activeTab === 'prompt' ? (
              <div className="prompt-mode">
                <h2>1. AI Prompt</h2>
                <p className="subtitle">Tell the AI what shapes to lay out and what transformations to apply.</p>
                
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. Mirror a triangle and a star horizontally..."
                  rows={3}
                />

                <div className="presets-wrap">
                  <strong>Quick Presets:</strong>
                  <div className="presets">
                    {PRESETS.map((p, idx) => (
                      <button key={idx} className="preset-btn" onClick={() => setPrompt(p)}>
                        {p.substring(0, 45)}...
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
                  {loading ? 'Generating Figure...' : '✨ Generate with Gemini'}
                </button>
              </div>
            ) : (
              <div className="builder-mode">
                <h2>1. Pre-designed Templates</h2>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>Load Presets</label>
                  <select 
                    defaultValue="" 
                    onChange={e => {
                      const key = e.target.value;
                      if (!key) return;
                      handleLoadTemplate(key);
                    }}
                  >
                    <option value="" disabled>-- Choose a Pre-designed Template --</option>
                    {Object.entries(PREDESIGNED_TEMPLATES).map(([key, tpl]) => (
                      <option key={key} value={key}>{tpl.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="divider" />

                <h2>2. Visual Controls</h2>
                <p className="subtitle">Configure transformation rules and card shapes manually.</p>

                {/* Layout Selector */}
                <div className="form-group">
                  <label>Question Category Layout</label>
                  <select 
                    value={layoutMode} 
                    onChange={e => {
                      const lm = e.target.value;
                      setLayoutMode(lm);
                      // In pattern mode, we draw quadrants, straight cards fit better
                      if (lm === 'pattern') setTilt(false);
                    }}
                  >
                    <option value="standard">Figure Matching / Rotation (1-Card)</option>
                    <option value="analogy">Analogy comparison (A : B :: C : ?)</option>
                    <option value="pattern">Pattern Completion (2x2 Grid)</option>
                    <option value="series">Figure Series Completion (A ➔ B ➔ C ➔ ?)</option>
                    <option value="odd_man_out">Odd-Man Out (Find the different one)</option>
                    <option value="punched_hole">Punched Hole Pattern (Paper Folding & Cutting)</option>
                  </select>
                </div>

                {/* Rules controls */}
                <div className="form-group">
                  <label>Transformation Type</label>
                  <select 
                    value={transformationType} 
                    onChange={e => setTransformationType(e.target.value)}
                  >
                    <option value="mirror_h">Mirror Horizontal (↔)</option>
                    <option value="mirror_v">Mirror Vertical (↕)</option>
                    <option value="rotate">Rotation (↻)</option>
                    <option value="swap_positions">Swap Positions</option>
                  </select>
                </div>

                {transformationType === 'rotate' && (
                  <div className="form-group">
                    <label>Target Rotation Angle</label>
                    <select 
                      value={rotateDegrees} 
                      onChange={e => setRotateDegrees(Number(e.target.value))}
                    >
                      <option value="90">90° Clockwise</option>
                      <option value="180">180° Rotation</option>
                      <option value="270">270° Clockwise (90° Counter-Clockwise)</option>
                    </select>
                  </div>
                )}

                {transformationType === 'swap_positions' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Object</label>
                      <select value={swapId1} onChange={e => setSwapId1(e.target.value)}>
                        {shapes.filter(s => s.enabled).map(s => (
                          <option key={s.id} value={s.id}>{s.id.toUpperCase()} ({s.type})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Second Object</label>
                      <select value={swapId2} onChange={e => setSwapId2(e.target.value)}>
                        {shapes.filter(s => s.enabled && s.id !== swapId1).map(s => (
                          <option key={s.id} value={s.id}>{s.id.toUpperCase()} ({s.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={tilt} 
                      onChange={e => setTilt(e.target.checked)} 
                    />
                    Tilt card (3D perspective slant)
                  </label>
                </div>

                <div className="divider" />

                <h2>2. Configured Shapes</h2>
                <p className="subtitle">Enable/disable shapes and customize types, sizes, and colors.</p>

                {shapes.map((s, idx) => (
                  <div key={s.id} className={`shape-row ${s.enabled ? 'active-row' : ''}`}>
                    <div className="shape-row-header">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={s.enabled}
                          onChange={e => handleShapeChange(idx, 'enabled', e.target.checked)}
                        />
                        <strong>Slot {idx + 1} ({s.id.toUpperCase()})</strong>
                      </label>
                    </div>

                    {s.enabled && (
                      <div className="shape-row-body">
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Shape Type</label>
                            <select 
                              value={s.type} 
                              onChange={e => handleShapeChange(idx, 'type', e.target.value)}
                            >
                              <option value="square">Square</option>
                              <option value="circle">Circle</option>
                              <option value="triangle">Triangle</option>
                              <option value="diamond">Diamond</option>
                              <option value="cross">Cross</option>
                              <option value="line">Line Segment</option>
                              <option value="text">Alphanumeric Text</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Color</label>
                            <select 
                              value={s.fill} 
                              onChange={e => handleShapeChange(idx, 'fill', e.target.value)}
                            >
                              <option value="white">White</option>
                              <option value="primary">Indigo</option>
                              <option value="secondary">Green</option>
                              <option value="accent">Red</option>
                              <option value="warning">Amber</option>
                              <option value="purple">Purple</option>
                              <option value="dark">Slate</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="form-group">
                            <label>Position X (10-90)</label>
                            <input 
                              type="number" 
                              min="10" 
                              max="90" 
                              value={s.x}
                              onChange={e => handleShapeChange(idx, 'x', Number(e.target.value))}
                            />
                          </div>
                          <div className="form-group">
                            <label>Position Y (10-90)</label>
                            <input 
                              type="number" 
                              min="10" 
                              max="90" 
                              value={s.y}
                              onChange={e => handleShapeChange(idx, 'y', Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {s.type === 'triangle' && (
                          <div className="form-group">
                            <label>Split Fill (Half Color / Half White)</label>
                            <select 
                              value={s.fillRegion || ''} 
                              onChange={e => handleShapeChange(idx, 'fillRegion', e.target.value || null)}
                            >
                              <option value="">No Split (Solid Color)</option>
                              <option value="left">Left Half Filled</option>
                              <option value="right">Right Half Filled</option>
                            </select>
                          </div>
                        )}

                        {s.type === 'text' && (
                          <div className="form-group">
                            <label>Text Value (eg. INK, PHS, A)</label>
                            <input 
                              type="text" 
                              value={s.textVal || ''} 
                              onChange={e => handleShapeChange(idx, 'textVal', e.target.value)}
                              placeholder="e.g. INK"
                            />
                          </div>
                        )}

                        {s.type === 'line' && (
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Line Endpoint 1 (X1, Y1)</label>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input 
                                  type="number" 
                                  value={s.x1 ?? (s.x - 15)} 
                                  onChange={e => handleShapeChange(idx, 'x1', Number(e.target.value))}
                                  placeholder="x1"
                                />
                                <input 
                                  type="number" 
                                  value={s.y1 ?? s.y} 
                                  onChange={e => handleShapeChange(idx, 'y1', Number(e.target.value))}
                                  placeholder="y1"
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Line Endpoint 2 (X2, Y2)</label>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input 
                                  type="number" 
                                  value={s.x2 ?? (s.x + 15)} 
                                  onChange={e => handleShapeChange(idx, 'x2', Number(e.target.value))}
                                  placeholder="x2"
                                />
                                <input 
                                  type="number" 
                                  value={s.y2 ?? s.y} 
                                  onChange={e => handleShapeChange(idx, 'y2', Number(e.target.value))}
                                  placeholder="y2"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button 
                  className="btn-generate-builder" 
                  onClick={() => handleUpdateFromJson()}
                  disabled={loading}
                >
                  {loading ? 'Updating Preview...' : '🔄 Apply Visual Controls'}
                </button>
              </div>
            )}

            {question && (
              <div className="json-editor-wrap">
                <div className="json-header">
                  <h2>2. Raw JSON Schema</h2>
                  <button className="btn-update" onClick={() => handleUpdateFromJson()}>
                    Update Preview
                  </button>
                </div>
                <textarea
                  className="code-area"
                  value={jsonConfig}
                  onChange={e => setJsonConfig(e.target.value)}
                  rows={10}
                />
              </div>
            )}
          </div>

          {/* Right panel: Previews */}
          <div className="preview-panel card">
            <div className="preview-header-wrap">
              <h2>3. Interactive Preview</h2>
              {question && (
                <div className={`usage-badge ${question.usage ? 'ai-used' : 'local-used'}`}>
                  {question.usage ? (
                    <span>
                      ✨ <strong>AI Cost:</strong> {question.usage.totalTokens} tokens (~${question.usage.estimatedCost.toFixed(6)})
                    </span>
                  ) : (
                    <span>
                      ⚙️ <strong>Local Cost:</strong> 0 tokens ($0.00)
                    </span>
                  )}
                </div>
              )}
            </div>
            {error && <div className="error-message">⚠️ {error}</div>}
            
            {!question && !loading && (
              <div className="empty-state">
                <div className="icon">🎨</div>
                <p>Configure controls or prompt on the left, then click Apply / Generate to preview questions.</p>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner" />
                <p>Assembling layers, executing rule matrices, and generating SVGs...</p>
              </div>
            )}

            {question && !loading && (
              <div className="question-preview">
                <div className="section-label">Original Question (Base Figure)</div>
                <div 
                  className="base-figure-card"
                  dangerouslySetInnerHTML={{ 
                    __html: question.questionText.split('\n')[0] 
                  }} 
                />
                
                <div className="question-instructions">
                  {question.questionText.split('\n').slice(1).join('\n')}
                </div>

                <div className="section-label">Options (2x2 Grid)</div>
                <div className="options-grid">
                  {Object.entries(question.options).map(([key, svg]) => {
                    const isCorrect = key === question.correctOption;
                    return (
                      <div key={key} className={`option-cell ${isCorrect ? 'correct-highlight' : ''}`}>
                        <span className="badge">{key} {isCorrect && '✓'}</span>
                        <div dangerouslySetInnerHTML={{ __html: svg }} />
                      </div>
                    );
                  })}
                </div>

                <div className="explanation-box">
                  <strong>Explanation:</strong>
                  <p>{question.explanationText}</p>
                </div>

                <div className="actions">
                  <button className="btn-save" onClick={handleSaveToDb}>
                    {saveStatus === 'saved' ? '✓ Question Saved!' : '💾 Save to Live Question Bank'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: #f7f3eb;
          color: #1a1612;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .header-section {
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          font-weight: 800;
          color: #1a1612;
          margin-bottom: 6px;
        }
        .header-section p {
          color: #70624d;
          font-size: 15px;
        }
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 2px solid #ddd5c8;
          padding-bottom: 1px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 700;
          color: #70624d;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.15s;
        }
        .tab-btn.active {
          color: #6366f1;
          border-bottom-color: #6366f1;
        }
        .grid-container {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
        }
        .card {
          background: #ffffff;
          border: 2px solid #ddd5c8;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(29, 23, 16, 0.04);
        }
        h2 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 13px;
          color: #70624d;
          margin-bottom: 16px;
        }
        .form-group {
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: #70624d;
        }
        .form-group select, .form-group input {
          padding: 10px;
          font-size: 13px;
          border: 2px solid #ddd5c8;
          border-radius: 8px;
          background: #fcfbfa;
          outline: none;
        }
        .form-group select:focus, .form-group input:focus {
          border-color: #6366f1;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .form-checkbox {
          margin: 14px 0;
          font-size: 13px;
          font-weight: 600;
        }
        .form-checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .divider {
          height: 1.5px;
          background: #ddd5c8;
          margin: 20px 0;
        }
        .shape-row {
          border: 1.5px solid #ddd5c8;
          border-radius: 10px;
          margin-bottom: 10px;
          background: #fbf9f5;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .shape-row.active-row {
          border-color: #a5b4fc;
          background: #fcfbfa;
        }
        .shape-row-header {
          padding: 10px 14px;
          background: #f3edd3;
          border-bottom: 1.5px solid #ddd5c8;
        }
        .shape-row.active-row .shape-row-header {
          background: #e0e7ff;
          border-bottom-color: #c7d2fe;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          cursor: pointer;
        }
        .shape-row-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        textarea {
          width: 100%;
          border: 2px solid #ddd5c8;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
          background: #fcfbfa;
          resize: vertical;
          outline: none;
        }
        textarea:focus {
          border-color: #6366f1;
        }
        .presets-wrap {
          margin-top: 14px;
          font-size: 12px;
        }
        .presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
          margin-bottom: 18px;
        }
        .preset-btn {
          background: #f3edd3;
          border: 1.5px solid #ddd5c8;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 11px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .preset-btn:hover {
          background: #e8dfbe;
        }
        .btn-generate, .btn-generate-builder {
          width: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .btn-generate:active, .btn-generate-builder:active {
          transform: scale(0.98);
        }
        .json-editor-wrap {
          margin-top: 24px;
        }
        .json-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .btn-update {
          background: #10b981;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .code-area {
          font-family: monospace;
          font-size: 12px;
          background: #1e293b;
          color: #f8fafc;
          border: none;
        }
        /* Right panel styling */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          text-align: center;
          color: #8c7e6a;
        }
        .empty-state .icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          text-align: center;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #ddd5c8;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .section-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8c7e6a;
          margin-top: 18px;
          margin-bottom: 8px;
        }
        .base-figure-card {
          display: flex;
          justify-content: center;
          padding: 16px;
          background: #fcfbfa;
          border: 2px solid #ddd5c8;
          border-radius: 12px;
        }
        .question-instructions {
          font-size: 14px;
          color: #1a1612;
          margin-top: 8px;
          font-weight: 600;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .option-cell {
          position: relative;
          background: #fcfbfa;
          border: 2px solid #ddd5c8;
          border-radius: 12px;
          padding: 16px 12px 12px;
          display: flex;
          justify-content: center;
        }
        .option-cell .badge {
          position: absolute;
          top: 6px;
          left: 8px;
          font-size: 11px;
          font-weight: 700;
          background: #ddd5c8;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .correct-highlight {
          border-color: #10b981;
          background: #f0fdf4;
        }
        .correct-highlight .badge {
          background: #10b981;
          color: #ffffff;
        }
        .explanation-box {
          margin-top: 20px;
          background: #fcfbfa;
          border-left: 4px solid #6366f1;
          padding: 12px;
          border-radius: 0 8px 8px 0;
          font-size: 13px;
        }
        .actions {
          margin-top: 24px;
        }
        .btn-save {
          width: 100%;
          background: #1e293b;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .preview-header-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .preview-header-wrap h2 {
          margin-bottom: 0;
        }
        .usage-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .usage-badge.ai-used {
          background: #e0e7ff;
          color: #4f46e5;
          border: 1px solid #c7d2fe;
        }
        .usage-badge.local-used {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .error-message {
          background: #fef2f2;
          border: 1.5px solid #fca5a5;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
