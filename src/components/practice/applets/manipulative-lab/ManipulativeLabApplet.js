'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './manipulative-lab.css';

const MANIPULATIVES = {
  fraction_bar: {
    title: 'Fraction Bar',
    question: 'How many shaded parts are shown?',
    initial: { parts: 4, shaded: 1 },
  },
  number_line: {
    title: 'Number Line',
    question: 'What number is highlighted?',
    initial: { min: 0, max: 10, value: 4 },
  },
  clock: {
    title: 'Clock',
    question: 'What hour is shown?',
    initial: { hour: 3, minute: 0 },
  },
  balance_scale: {
    title: 'Balance Scale',
    question: 'What is the right-side weight?',
    initial: { left: 4, right: 7 },
  },
  measuring_cup: {
    title: 'Measuring Cup',
    question: 'How many milliliters are shown?',
    initial: { level: 300, capacity: 500 },
  },
  thermometer: {
    title: 'Thermometer',
    question: 'What temperature is shown?',
    initial: { temperature: 28, min: 0, max: 50 },
  },
  base_ten_blocks: {
    title: 'Base-Ten Blocks',
    question: 'What number is modeled?',
    initial: { hundreds: 1, tens: 3, ones: 6 },
  },
  place_value_chart: {
    title: 'Place Value Chart',
    question: 'What number is shown?',
    initial: { hundreds: 2, tens: 4, ones: 8 },
  },
  diagram_labeling: {
    title: 'Diagram Labeling',
    question: 'Which plant part is selected?',
    initial: { selected: 'leaf' },
  },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

function FractionBar({ state, setState }) {
  return (
    <div className="mlabFractionBar">
      {Array.from({ length: state.parts }, (_, index) => (
        <button
          key={index}
          type="button"
          className={index < state.shaded ? 'filled' : ''}
          onClick={() => setState({ ...state, shaded: index + 1 })}
        >
          {index < state.shaded ? '✓' : ''}
        </button>
      ))}
    </div>
  );
}

function NumberLine({ state, setState }) {
  const range = state.max - state.min;
  const left = `${((state.value - state.min) / range) * 100}%`;
  return (
    <div className="mlabNumberLine">
      <input
        type="range"
        min={state.min}
        max={state.max}
        value={state.value}
        onChange={(event) => setState({ ...state, value: Number(event.target.value) })}
      />
      <div className="mlabLine">
        <span className="marker" style={{ left }}>{state.value}</span>
      </div>
      <div className="mlabScale"><span>{state.min}</span><span>{state.max}</span></div>
    </div>
  );
}

function Clock({ state, setState }) {
  const hourAngle = ((state.hour % 12) + state.minute / 60) * 30;
  const minuteAngle = state.minute * 6;
  return (
    <div className="mlabClockWrap">
      <svg viewBox="0 0 220 220" className="mlabClock">
        <circle cx="110" cy="110" r="92" fill="#FDFCF8" stroke="#43403A" strokeWidth="5" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index + 1) * 30 - 90;
          const x = 110 + Math.cos(angle * Math.PI / 180) * 72;
          const y = 110 + Math.sin(angle * Math.PI / 180) * 72;
          return <text key={index} x={x} y={y + 5} textAnchor="middle" fontWeight="900">{index + 1}</text>;
        })}
        <line x1="110" y1="110" x2="110" y2="55" stroke="#D27D56" strokeWidth="6" strokeLinecap="round" transform={`rotate(${minuteAngle} 110 110)`} />
        <line x1="110" y1="110" x2="110" y2="72" stroke="#43403A" strokeWidth="8" strokeLinecap="round" transform={`rotate(${hourAngle} 110 110)`} />
        <circle cx="110" cy="110" r="7" fill="#43403A" />
      </svg>
      <input type="range" min="1" max="12" value={state.hour} onChange={(e) => setState({ ...state, hour: Number(e.target.value) })} />
    </div>
  );
}

function BalanceScale({ state, setState }) {
  const tilt = clamp((state.right - state.left) * 4, -18, 18);
  return (
    <div className="mlabBalance">
      <svg viewBox="0 0 320 220">
        <line x1="160" y1="70" x2="160" y2="178" stroke="#43403A" strokeWidth="8" />
        <g transform={`rotate(${tilt} 160 75)`}>
          <line x1="70" y1="75" x2="250" y2="75" stroke="#43403A" strokeWidth="8" strokeLinecap="round" />
        </g>
        <path d="M48 126 H118 Q83 160 48 126Z" fill="#E6D5B8" stroke="#43403A" strokeWidth="4" />
        <path d="M202 126 H272 Q237 160 202 126Z" fill="#E6D5B8" stroke="#43403A" strokeWidth="4" />
        <text x="83" y="116" textAnchor="middle" fontWeight="900">L: {state.left}</text>
        <text x="237" y="116" textAnchor="middle" fontWeight="900">R: {state.right}</text>
        <rect x="120" y="178" width="80" height="16" rx="8" fill="#43403A" />
      </svg>
      <label>Right weight <input type="range" min="1" max="10" value={state.right} onChange={(e) => setState({ ...state, right: Number(e.target.value) })} /></label>
    </div>
  );
}

function MeasuringCup({ state, setState }) {
  const ratio = state.level / state.capacity;
  const y = 170 - ratio * 120;
  return (
    <div className="mlabCup">
      <svg viewBox="0 0 220 230">
        <path d="M65 35 H150 L136 190 H78 Z" fill="#FDFCF8" stroke="#43403A" strokeWidth="5" />
        <path d={`M78 ${y} H136 L132 190 H82 Z`} fill="#8ecae6" opacity="0.85" />
        <path d="M150 72 C205 72 205 142 142 138" fill="none" stroke="#43403A" strokeWidth="10" strokeLinecap="round" />
        <text x="110" y="215" textAnchor="middle" fontWeight="900">{state.level} ml</text>
      </svg>
      <input type="range" min="0" max={state.capacity} step="50" value={state.level} onChange={(e) => setState({ ...state, level: Number(e.target.value) })} />
    </div>
  );
}

function Thermometer({ state, setState }) {
  const ratio = (state.temperature - state.min) / (state.max - state.min);
  const y = 155 - ratio * 115;
  return (
    <div className="mlabThermo">
      <svg viewBox="0 0 180 230">
        <rect x="75" y="30" width="30" height="140" rx="15" fill="#FDFCF8" stroke="#43403A" strokeWidth="5" />
        <circle cx="90" cy="175" r="30" fill="#FDFCF8" stroke="#43403A" strokeWidth="5" />
        <rect x="84" y={y} width="12" height={178 - y} rx="6" fill="#D27D56" />
        <circle cx="90" cy="175" r="19" fill="#D27D56" />
        <text x="90" y="220" textAnchor="middle" fontWeight="900">{state.temperature}°C</text>
      </svg>
      <input type="range" min={state.min} max={state.max} value={state.temperature} onChange={(e) => setState({ ...state, temperature: Number(e.target.value) })} />
    </div>
  );
}

function BaseTenBlocks({ state, setState }) {
  return (
    <div className="mlabBaseTen">
      <div className="hundreds">{Array.from({ length: 100 }, (_, i) => <i key={i} />)}</div>
      <div>{Array.from({ length: state.tens }, (_, i) => <span key={i} className="tenRod" />)}</div>
      <div>{Array.from({ length: state.ones }, (_, i) => <span key={i} className="oneCube" />)}</div>
      <label>Tens <input type="range" min="0" max="9" value={state.tens} onChange={(e) => setState({ ...state, tens: Number(e.target.value) })} /></label>
      <label>Ones <input type="range" min="0" max="9" value={state.ones} onChange={(e) => setState({ ...state, ones: Number(e.target.value) })} /></label>
    </div>
  );
}

function PlaceValueChart({ state, setState }) {
  return (
    <div className="mlabPlaceChart">
      {['hundreds', 'tens', 'ones'].map((key) => (
        <div key={key} className="placeCell">
          <strong>{key}</strong>
          <span>{state[key]}</span>
          <input type="range" min="0" max="9" value={state[key]} onChange={(e) => setState({ ...state, [key]: Number(e.target.value) })} />
        </div>
      ))}
    </div>
  );
}

function DiagramLabeling({ state, setState }) {
  const labels = ['flower', 'leaf', 'stem', 'roots'];
  return (
    <div className="mlabDiagram">
      <svg viewBox="0 0 320 320">
        <path d="M160 248 C132 220 111 196 112 156 C113 110 146 92 160 62 C174 92 207 110 208 156 C209 196 188 220 160 248Z" fill="#8A9A5B" opacity="0.35" stroke="#43403A" strokeWidth="4" />
        <circle cx="160" cy="70" r="34" fill="#D27D56" stroke="#43403A" strokeWidth="4" />
        <path d="M160 105 L160 245" stroke="#8A9A5B" strokeWidth="12" strokeLinecap="round" />
        <path d="M160 168 C112 140 80 144 54 176 C101 190 135 188 160 168Z" fill="#8A9A5B" stroke="#43403A" strokeWidth="4" />
        <path d="M160 246 C130 270 104 283 78 292 M160 246 C191 270 218 282 246 292" stroke="#8A9A5B" strokeWidth="7" strokeLinecap="round" />
        <text x="160" y="302" textAnchor="middle" fontWeight="900">Selected: {state.selected}</text>
      </svg>
      <div className="labelChips">
        {labels.map((label) => <button key={label} className={state.selected === label ? 'active' : ''} onClick={() => setState({ selected: label })}>{label}</button>)}
      </div>
    </div>
  );
}

const RENDERERS = {
  fraction_bar: FractionBar,
  number_line: NumberLine,
  clock: Clock,
  balance_scale: BalanceScale,
  measuring_cup: MeasuringCup,
  thermometer: Thermometer,
  base_ten_blocks: BaseTenBlocks,
  place_value_chart: PlaceValueChart,
  diagram_labeling: DiagramLabeling,
};

function answerFor(type, state) {
  if (type === 'fraction_bar') return String(state.shaded);
  if (type === 'number_line') return String(state.value);
  if (type === 'clock') return String(state.hour);
  if (type === 'balance_scale') return String(state.right);
  if (type === 'measuring_cup') return String(state.level);
  if (type === 'thermometer') return String(state.temperature);
  if (type === 'base_ten_blocks' || type === 'place_value_chart') return String(state.hundreds * 100 + state.tens * 10 + state.ones);
  if (type === 'diagram_labeling') return state.selected;
  return '';
}

export default function ManipulativeLabApplet({ question, onAnswer }) {
  const type = question?.manipulativeType || 'fraction_bar';
  const config = MANIPULATIVES[type] || MANIPULATIVES.fraction_bar;
  const Renderer = RENDERERS[type] || FractionBar;
  const [state, setState] = useState(() => ({ ...config.initial, ...(question?.initialState || {}) }));
  const lastReportedAnswerRef = useRef('');
  const answer = useMemo(() => answerFor(type, state), [type, state]);

  useEffect(() => {
    const nextAnswer = { manipulativeType: type, value: answer, state };
    const serialized = JSON.stringify(nextAnswer);
    if (serialized === lastReportedAnswerRef.current) return;
    lastReportedAnswerRef.current = serialized;
    onAnswer?.(nextAnswer);
  }, [answer, onAnswer, state, type]);

  return (
    <section className="mlabShell">
      <header className="mlabHeader">
        <p>Universal Manipulative</p>
        <h1>{config.title}</h1>
        <span>{type}</span>
      </header>
      <div className="mlabPrompt">{config.question}</div>
      <div className="mlabStage">
        <Renderer state={state} setState={setState} />
      </div>
      <footer className="mlabAnswer">Current answer: <strong>{answer}</strong></footer>
    </section>
  );
}
