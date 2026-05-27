'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInteractiveToolEngine } from '../../../lib/practice/interactiveToolEngines/registry.js';
import { normalizeInteractiveToolQuestion } from '../../../lib/practice/interactiveToolEngines/normalizeInteractiveToolQuestion.js';

const TOOL_CONFIGS = {
  fraction_bar: {
    title: 'Fraction Bar',
    prompt: 'How many shaded parts are shown?',
    initial: { parts: 4, shaded: 1 },
  },
  number_line: {
    title: 'Number Line',
    prompt: 'What number is highlighted?',
    initial: { min: 0, max: 10, value: 4 },
  },
  clock: {
    title: 'Clock',
    prompt: 'What hour is shown?',
    initial: { hour: 3, minute: 0 },
  },
  balance_scale: {
    title: 'Balance Scale',
    prompt: 'What is the right-side weight?',
    initial: { left: 4, right: 7 },
  },
  measuring_cup: {
    title: 'Measuring Cup',
    prompt: 'How many milliliters are shown?',
    initial: { level: 300, capacity: 500 },
  },
  thermometer: {
    title: 'Thermometer',
    prompt: 'What temperature is shown?',
    initial: { temperature: 28, min: 0, max: 50 },
  },
  base_ten_blocks: {
    title: 'Base-Ten Blocks',
    prompt: 'What number is modeled?',
    initial: { hundreds: 1, tens: 3, ones: 6 },
  },
  place_value_chart: {
    title: 'Place Value Chart',
    prompt: 'What number is shown?',
    initial: { hundreds: 2, tens: 4, ones: 8 },
  },
  diagram_labeling: {
    title: 'Diagram Labeling',
    prompt: 'Which plant part is selected?',
    initial: { selected: 'leaf' },
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

function getToolKey(question) {
  return question?.toolId || question?.toolConfig?.toolId || question?.manipulativeType || 'fraction_bar';
}

function getAnswer(toolId, state) {
  if (toolId === 'fraction_bar') return { value: state.shaded, fraction: `${state.shaded}/${state.parts}` };
  if (toolId === 'number_line') return { value: state.value };
  if (toolId === 'clock') return { value: state.hour, hour: state.hour, minute: state.minute };
  if (toolId === 'balance_scale') return { value: state.right };
  if (toolId === 'measuring_cup') return { value: state.level };
  if (toolId === 'thermometer') return { value: state.temperature };
  if (toolId === 'base_ten_blocks' || toolId === 'place_value_chart') {
    return { value: state.hundreds * 100 + state.tens * 10 + state.ones };
  }
  if (toolId === 'diagram_labeling') return { value: state.selected };
  return { value: '' };
}

function FractionBarTool({ state, setState }) {
  return (
    <div className="itoolFractionBar" style={{ gridTemplateColumns: `repeat(${state.parts}, minmax(64px, 1fr))` }}>
      {Array.from({ length: state.parts }, (_, index) => (
        <button
          key={index}
          type="button"
          className={index < state.shaded ? 'isFilled' : ''}
          onClick={() => setState((current) => ({ ...current, shaded: index + 1 }))}
        >
          {index < state.shaded ? '✓' : ''}
        </button>
      ))}
    </div>
  );
}

function NumberLineTool({ state, setState }) {
  const range = Math.max(1, state.max - state.min);
  const left = `${((state.value - state.min) / range) * 100}%`;
  return (
    <div className="itoolNumberLine">
      <input
        type="range"
        min={state.min}
        max={state.max}
        value={state.value}
        onChange={(event) => setState((current) => ({ ...current, value: Number(event.target.value) }))}
      />
      <div className="itoolLine"><span style={{ left }}>{state.value}</span></div>
      <div className="itoolScale"><b>{state.min}</b><b>{state.max}</b></div>
    </div>
  );
}

function ClockTool({ state, setState }) {
  const hourAngle = ((state.hour % 12) + state.minute / 60) * 30;
  const minuteAngle = state.minute * 6;
  return (
    <div className="itoolSvgTool">
      <svg viewBox="0 0 220 220">
        <circle cx="110" cy="110" r="92" fill="#fffaf2" stroke="#172033" strokeWidth="5" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index + 1) * 30 - 90;
          const x = 110 + Math.cos(angle * Math.PI / 180) * 72;
          const y = 110 + Math.sin(angle * Math.PI / 180) * 72;
          return <text key={index} x={x} y={y + 5} textAnchor="middle" fontWeight="900">{index + 1}</text>;
        })}
        <line x1="110" y1="110" x2="110" y2="55" stroke="#4fbf8f" strokeWidth="6" strokeLinecap="round" transform={`rotate(${minuteAngle} 110 110)`} />
        <line x1="110" y1="110" x2="110" y2="72" stroke="#172033" strokeWidth="8" strokeLinecap="round" transform={`rotate(${hourAngle} 110 110)`} />
        <circle cx="110" cy="110" r="7" fill="#172033" />
      </svg>
      <input type="range" min="1" max="12" value={state.hour} onChange={(event) => setState((current) => ({ ...current, hour: Number(event.target.value) }))} />
    </div>
  );
}

function BalanceScaleTool({ state, setState }) {
  const tilt = clamp((state.right - state.left) * 4, -18, 18);
  return (
    <div className="itoolSvgTool">
      <svg viewBox="0 0 320 220">
        <line x1="160" y1="70" x2="160" y2="178" stroke="#172033" strokeWidth="8" />
        <g transform={`rotate(${tilt} 160 75)`}>
          <line x1="70" y1="75" x2="250" y2="75" stroke="#172033" strokeWidth="8" strokeLinecap="round" />
        </g>
        <path d="M48 126 H118 Q83 160 48 126Z" fill="#eaf7f0" stroke="#172033" strokeWidth="4" />
        <path d="M202 126 H272 Q237 160 202 126Z" fill="#eaf7f0" stroke="#172033" strokeWidth="4" />
        <text x="83" y="116" textAnchor="middle" fontWeight="900">L: {state.left}</text>
        <text x="237" y="116" textAnchor="middle" fontWeight="900">R: {state.right}</text>
      </svg>
      <label>Right weight <input type="range" min="1" max="10" value={state.right} onChange={(event) => setState((current) => ({ ...current, right: Number(event.target.value) }))} /></label>
    </div>
  );
}

function MeasuringCupTool({ state, setState }) {
  const ratio = state.level / state.capacity;
  const y = 170 - ratio * 120;
  return (
    <div className="itoolSvgTool">
      <svg viewBox="0 0 220 230">
        <path d="M65 35 H150 L136 190 H78 Z" fill="#fffaf2" stroke="#172033" strokeWidth="5" />
        <path d={`M78 ${y} H136 L132 190 H82 Z`} fill="#67c8ff" opacity="0.85" />
        <path d="M150 72 C205 72 205 142 142 138" fill="none" stroke="#172033" strokeWidth="10" strokeLinecap="round" />
        <text x="110" y="215" textAnchor="middle" fontWeight="900">{state.level} ml</text>
      </svg>
      <input type="range" min="0" max={state.capacity} step="50" value={state.level} onChange={(event) => setState((current) => ({ ...current, level: Number(event.target.value) }))} />
    </div>
  );
}

function ThermometerTool({ state, setState }) {
  const ratio = (state.temperature - state.min) / (state.max - state.min);
  const y = 155 - ratio * 115;
  return (
    <div className="itoolSvgTool">
      <svg viewBox="0 0 180 230">
        <rect x="75" y="30" width="30" height="140" rx="15" fill="#fffaf2" stroke="#172033" strokeWidth="5" />
        <circle cx="90" cy="175" r="30" fill="#fffaf2" stroke="#172033" strokeWidth="5" />
        <rect x="84" y={y} width="12" height={178 - y} rx="6" fill="#ef6c35" />
        <circle cx="90" cy="175" r="19" fill="#ef6c35" />
        <text x="90" y="220" textAnchor="middle" fontWeight="900">{state.temperature}°C</text>
      </svg>
      <input type="range" min={state.min} max={state.max} value={state.temperature} onChange={(event) => setState((current) => ({ ...current, temperature: Number(event.target.value) }))} />
    </div>
  );
}

function BaseTenBlocksTool({ state, setState }) {
  return (
    <div className="itoolBaseTen">
      <div className="itoolHundreds">{Array.from({ length: 100 }, (_, index) => <i key={index} />)}</div>
      <div>{Array.from({ length: state.tens }, (_, index) => <span key={index} className="itoolTenRod" />)}</div>
      <div>{Array.from({ length: state.ones }, (_, index) => <span key={index} className="itoolOneCube" />)}</div>
      <label>Tens <input type="range" min="0" max="9" value={state.tens} onChange={(event) => setState((current) => ({ ...current, tens: Number(event.target.value) }))} /></label>
      <label>Ones <input type="range" min="0" max="9" value={state.ones} onChange={(event) => setState((current) => ({ ...current, ones: Number(event.target.value) }))} /></label>
    </div>
  );
}

function PlaceValueChartTool({ state, setState }) {
  return (
    <div className="itoolPlaceChart">
      {['hundreds', 'tens', 'ones'].map((key) => (
        <div key={key} className="itoolPlaceCell">
          <strong>{key}</strong>
          <span>{state[key]}</span>
          <input type="range" min="0" max="9" value={state[key]} onChange={(event) => setState((current) => ({ ...current, [key]: Number(event.target.value) }))} />
        </div>
      ))}
    </div>
  );
}

function DiagramLabelingTool({ state, setState }) {
  return (
    <div className="itoolDiagram">
      <svg viewBox="0 0 320 320">
        <path d="M160 248 C132 220 111 196 112 156 C113 110 146 92 160 62 C174 92 207 110 208 156 C209 196 188 220 160 248Z" fill="#4fbf8f" opacity="0.35" stroke="#172033" strokeWidth="4" />
        <circle cx="160" cy="70" r="34" fill="#ef6c35" stroke="#172033" strokeWidth="4" />
        <path d="M160 105 L160 245" stroke="#4fbf8f" strokeWidth="12" strokeLinecap="round" />
        <path d="M160 168 C112 140 80 144 54 176 C101 190 135 188 160 168Z" fill="#4fbf8f" stroke="#172033" strokeWidth="4" />
        <text x="160" y="302" textAnchor="middle" fontWeight="900">Selected: {state.selected}</text>
      </svg>
      <div className="itoolChips">
        {['flower', 'leaf', 'stem', 'roots'].map((label) => (
          <button key={label} type="button" className={state.selected === label ? 'active' : ''} onClick={() => setState({ selected: label })}>{label}</button>
        ))}
      </div>
    </div>
  );
}

const TOOL_RENDERERS = {
  fraction_bar: FractionBarTool,
  number_line: NumberLineTool,
  clock: ClockTool,
  balance_scale: BalanceScaleTool,
  measuring_cup: MeasuringCupTool,
  thermometer: ThermometerTool,
  base_ten_blocks: BaseTenBlocksTool,
  place_value_chart: PlaceValueChartTool,
  diagram_labeling: DiagramLabelingTool,
};

function CubeCounterTool({ state, config, dispatch }) {
  const colors = {
    blue: '#4f8df7',
    green: '#30b981',
    amber: '#f5b941',
    coral: '#ef6c57',
    purple: '#8b74f4',
  };
  const current = state.groups.reduce((sum, group) => sum + group.count, 0);
  const canAdd = current < config.max;
  const canRemove = state.groups.some((group) => group.editable !== false && group.count > config.min);

  return (
    <div className="cubeTool">
      <div className="cubeHero">
        <div>
          <p className="cubeEyebrow">{config.mode === 'add' ? 'Build the addends' : 'Build the number'}</p>
          <strong>{config.target}</strong>
        </div>
        {config.showLiveCount !== false && (
          <span>{current} cube{current === 1 ? '' : 's'}</span>
        )}
      </div>

      <div className="cubeGroups">
        {state.groups.map((group) => (
          <section key={group.id} className="cubeGroup">
            <div className="cubeGroupHeader">
              <b>{group.label}</b>
              <span>{group.count}</span>
            </div>
            <div className="cubeGrid" aria-label={`${group.label}: ${group.count} cubes`}>
              {Array.from({ length: group.count }, (_, index) => (
                <i
                  key={`${group.id}-${index}`}
                  className="cubeBlock"
                  style={{ '--cube-color': colors[group.color] || colors.blue }}
                />
              ))}
              {group.count === 0 && <em className="cubeEmpty">Tap + Cube to build</em>}
            </div>
          </section>
        ))}
      </div>

      <div className="cubeActions">
        {config.actions.includes('remove_cube') && (
          <button type="button" onClick={() => dispatch({ type: 'remove_cube' })} disabled={!canRemove}>
            - Cube
          </button>
        )}
        {config.actions.includes('add_cube') && (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'add_cube' })} disabled={!canAdd}>
            + Cube
          </button>
        )}
        {config.actions.includes('undo') && (
          <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={!state.history.length}>
            Undo
          </button>
        )}
        {config.actions.includes('reset') && (
          <button type="button" onClick={() => dispatch({ type: 'reset' })}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function EngineDrivenToolRenderer({ question, onAnswer }) {
  const normalizedQuestion = useMemo(() => normalizeInteractiveToolQuestion(question), [question]);
  const engine = getInteractiveToolEngine(normalizedQuestion.toolId);
  const initialState = useMemo(
    () => engine.createInitialState(normalizedQuestion.toolConfig),
    [engine, normalizedQuestion.toolConfig]
  );
  const [state, setState] = useState(initialState);
  const lastQuestionRef = useRef(normalizedQuestion.id || normalizedQuestion.skillId || normalizedQuestion.questionText);
  const lastAnswerRef = useRef('');
  const answer = useMemo(() => engine.getAnswer(state, normalizedQuestion.toolConfig), [engine, normalizedQuestion.toolConfig, state]);

  useEffect(() => {
    const questionKey = normalizedQuestion.id || normalizedQuestion.skillId || normalizedQuestion.questionText;
    if (lastQuestionRef.current !== questionKey) {
      lastQuestionRef.current = questionKey;
      lastAnswerRef.current = '';
      setState(engine.createInitialState(normalizedQuestion.toolConfig));
    }
  }, [engine, normalizedQuestion.id, normalizedQuestion.questionText, normalizedQuestion.skillId, normalizedQuestion.toolConfig]);

  useEffect(() => {
    const payload = {
      toolId: normalizedQuestion.toolId,
      value: answer.value,
      answer,
      state,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastAnswerRef.current) return;
    lastAnswerRef.current = serialized;
    onAnswer?.(payload);
  }, [answer, normalizedQuestion.toolId, onAnswer, state]);

  const dispatch = useCallback((action) => {
    setState((current) => engine.applyAction(current, action, normalizedQuestion.toolConfig));
  }, [engine, normalizedQuestion.toolConfig]);

  return (
    <section className="itoolShell cubeShell">
      <style>{`
        .cubeShell{width:min(920px,100%);margin:0 auto;padding:22px;border:2px solid #dbeafe;border-radius:24px;background:#fff;color:#172033;font-family:Inter,system-ui,sans-serif}
        .cubeShell .itoolHeader{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
        .cubeShell .itoolHeader p{margin:0 0 6px;color:#16a34a;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .cubeShell .itoolHeader h2{margin:0;font-size:clamp(24px,4vw,38px);line-height:1.05;font-weight:900}
        .cubeShell .itoolHeader span,.cubeAnswer{border-radius:999px;background:#eaf7f0;padding:9px 12px;font-weight:900;color:#166534}
        .cubeStage{border:1.5px solid #dbeafe;border-radius:20px;background:#f8fafc;padding:18px}
        .cubeHero{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px;padding:16px;border-radius:18px;background:#fff}
        .cubeHero strong{display:block;font-size:56px;line-height:1;font-weight:950;color:#2563eb}.cubeHero span{font-weight:900;color:#475569}.cubeEyebrow{margin:0 0 4px;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#64748b}
        .cubeGroups{display:grid;gap:14px}.cubeGroup{border:2px solid #bfdbfe;border-radius:18px;background:#fff;overflow:hidden}.cubeGroupHeader{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #dbeafe}.cubeGroupHeader b{font-size:16px}.cubeGroupHeader span{display:grid;place-items:center;min-width:34px;height:34px;border-radius:999px;background:#eff6ff;font-weight:900;color:#1d4ed8}
        .cubeGrid{min-height:176px;display:flex;align-content:flex-start;align-items:flex-start;flex-wrap:wrap;gap:10px;padding:16px}.cubeBlock{position:relative;width:42px;height:42px;border:2px solid rgba(23,32,51,.24);border-radius:10px;background:var(--cube-color);box-shadow:inset 0 8px 0 rgba(255,255,255,.32), inset -6px -8px 0 rgba(0,0,0,.08), 0 5px 10px rgba(15,23,42,.12);animation:cubePop .16s ease-out}.cubeBlock:after{content:'';position:absolute;inset:7px 8px auto 8px;height:6px;border-radius:999px;background:rgba(255,255,255,.28)}.cubeEmpty{display:grid;place-items:center;width:100%;min-height:130px;border:2px dashed #cbd5e1;border-radius:16px;color:#94a3b8;font-style:normal;font-weight:900}
        .cubeActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.cubeActions button{min-height:46px;border:0;border-radius:14px;padding:0 18px;background:#e2e8f0;color:#172033;font-weight:950;cursor:pointer}.cubeActions button.primary{background:#2563eb;color:#fff;box-shadow:0 8px 18px rgba(37,99,235,.22)}.cubeActions button:disabled{cursor:not-allowed;opacity:.45}.cubeAnswer{width:max-content;margin-top:14px}
        @keyframes cubePop{from{transform:scale(.84);opacity:.3}to{transform:scale(1);opacity:1}}@media(max-width:640px){.cubeShell{padding:16px}.cubeHero{align-items:flex-start;display:grid}.cubeGrid{min-height:146px}.cubeBlock{width:36px;height:36px}.cubeActions button{flex:1 1 42%}}
      `}</style>
      <header className="itoolHeader">
        <div>
          <p>Interactive Cube Tool</p>
          <h2>{normalizedQuestion.questionText}</h2>
        </div>
        <span>{normalizedQuestion.toolId}</span>
      </header>
      <div className="cubeStage">
        <CubeCounterTool state={state} config={normalizedQuestion.toolConfig} dispatch={dispatch} />
      </div>
      <div className="cubeAnswer">Current answer: <strong>{answer.value}</strong></div>
    </section>
  );
}

export default function InteractiveToolRenderer({ question, onAnswer }) {
  const toolId = getToolKey(question);
  const engine = getInteractiveToolEngine(toolId);
  if (engine) {
    return <EngineDrivenToolRenderer question={question} onAnswer={onAnswer} />;
  }

  const config = TOOL_CONFIGS[toolId] || TOOL_CONFIGS.fraction_bar;
  const Tool = TOOL_RENDERERS[toolId] || FractionBarTool;
  const initialState = useMemo(() => ({
    ...config.initial,
    ...(question?.toolConfig?.initialState || {}),
    ...(question?.initialState || {}),
  }), [config.initial, question?.initialState, question?.toolConfig?.initialState]);
  const [state, setState] = useState(initialState);
  const lastAnswerRef = useRef('');
  const answer = useMemo(() => getAnswer(toolId, state), [state, toolId]);

  useEffect(() => {
    const payload = { toolId, value: answer.value, answer, state };
    const serialized = JSON.stringify(payload);
    if (serialized === lastAnswerRef.current) return;
    lastAnswerRef.current = serialized;
    onAnswer?.(payload);
  }, [answer, onAnswer, state, toolId]);

  return (
    <section className="itoolShell">
      <style>{`
        .itoolShell{width:min(920px,100%);margin:0 auto;padding:22px;border:2px solid #dbeafe;border-radius:24px;background:#ffffff;color:#172033;font-family:Inter,system-ui,sans-serif}
        .itoolHeader{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}
        .itoolHeader p{margin:0 0 6px;color:#16a34a;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .itoolHeader h2{margin:0;font-size:clamp(24px,4vw,42px);line-height:1;font-weight:900}
        .itoolHeader span,.itoolAnswer{border-radius:999px;background:#eaf7f0;padding:9px 12px;font-weight:900;color:#166534}
        .itoolPrompt{margin:0 0 16px;font-size:18px;font-weight:800;color:#475569}
        .itoolStage{min-height:360px;display:grid;place-items:center;border:1.5px solid #dbeafe;border-radius:20px;background:#f8fafc;padding:20px}
        .itoolAnswer{width:max-content;margin-top:14px}
        .itoolFractionBar{display:grid;width:min(620px,100%);border:4px solid #172033;border-radius:18px;overflow:hidden}
        .itoolFractionBar button{min-height:112px;border:0;border-right:3px solid #172033;background:#fff;font-size:32px;font-weight:900}
        .itoolFractionBar button:last-child{border-right:0}.itoolFractionBar .isFilled{background:#4fbf8f;color:white}
        .itoolNumberLine,.itoolSvgTool,.itoolDiagram{width:min(620px,100%);display:grid;gap:18px}.itoolLine{position:relative;height:8px;margin:38px 14px 16px;border-radius:999px;background:#172033}.itoolLine span{position:absolute;top:50%;translate:-50% -50%;display:grid;place-items:center;width:42px;height:42px;border:3px solid #172033;border-radius:999px;background:#4fbf8f;color:white;font-weight:900}.itoolScale{display:flex;justify-content:space-between}
        .itoolSvgTool svg,.itoolDiagram svg{width:min(360px,100%);justify-self:center}.itoolBaseTen{width:min(620px,100%);display:grid;grid-template-columns:150px 1fr 1fr;gap:18px;align-items:center}.itoolHundreds{display:grid;grid-template-columns:repeat(10,1fr);width:140px;height:140px;border:3px solid #172033;background:#eaf7f0}.itoolHundreds i{border:1px solid rgba(23,32,51,.18)}.itoolTenRod,.itoolOneCube{display:inline-block;margin:4px;border:2px solid #172033;background:#ef6c35}.itoolTenRod{width:24px;height:120px;border-radius:10px}.itoolOneCube{width:34px;height:34px;border-radius:9px;background:#4fbf8f}
        .itoolPlaceChart{width:min(620px,100%);display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.itoolPlaceCell{display:grid;gap:12px;justify-items:center;padding:18px;border:2px solid #172033;border-radius:18px;background:white}.itoolPlaceCell strong{text-transform:uppercase;font-size:12px}.itoolPlaceCell span{font-size:54px;font-weight:900}
        .itoolChips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}.itoolChips button{border:2px solid #172033;border-radius:999px;padding:10px 14px;background:white;font-weight:900}.itoolChips .active{background:#4fbf8f;color:white}
        .itoolShell input[type=range]{width:100%}@media(max-width:640px){.itoolHeader{display:grid}.itoolBaseTen,.itoolPlaceChart{grid-template-columns:1fr}.itoolStage{min-height:300px}}
      `}</style>
      <header className="itoolHeader">
        <div>
          <p>Interactive Tool</p>
          <h2>{question?.questionText || config.title}</h2>
        </div>
        <span>{toolId}</span>
      </header>
      <div className="itoolPrompt">{question?.toolConfig?.prompt || config.prompt}</div>
      <div className="itoolStage">
        <Tool state={state} setState={setState} />
      </div>
      <div className="itoolAnswer">Current answer: <strong>{String(answer.value)}</strong></div>
    </section>
  );
}
