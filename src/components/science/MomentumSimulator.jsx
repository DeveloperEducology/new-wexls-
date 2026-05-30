'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

/* ──────────────────────────────────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────────────────────────────────── */
const EMOJI_SHAPES = [
  { id: 'ball',       emoji: '⚽', name: 'Soccer Ball', baseSize: 28 },
  { id: 'skateboard', emoji: '🛹', name: 'Skateboard',  baseSize: 30 },
  { id: 'car',        emoji: '🚗', name: 'Race Car',    baseSize: 36 },
  { id: 'truck',      emoji: '🚛', name: 'Lorry Truck', baseSize: 44 },
  { id: 'rocket',     emoji: '🚀', name: 'Rocket',      baseSize: 36 },
];

const LOCKED_P    = 40;   // kg·m/s for same-momentum mode
const MAX_P       = 400;  // bar scale ceiling  (20 kg × 20 m/s)
const DIST_MARKS  = [0, 5, 10, 15, 20];
const SPEED_FACTOR = 5;   // visual multiplier for track animation

function speedLabel(v) {
  if (v <= 5)  return { text: 'slow',   color: '#34d399' };
  if (v <= 12) return { text: 'medium', color: '#fbbf24' };
  return             { text: 'fast',   color: '#f87171' };
}

function elasticCollision(m1, u1, m2, u2) {
  const v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2);
  const v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2);
  return { v1, v2 };
}

/* ──────────────────────────────────────────────────────────────────────
   ROOT COMPONENT
────────────────────────────────────────────────────────────────────── */
export default function MomentumSimulator() {

  /* ── controls state ─────────────────────────────────────────────── */
  const [mass1,     setMass1]     = useState(10);
  const [mass2,     setMass2]     = useState(4);
  const [velocity,  setVelocity]  = useState(6);
  const [sameMode,  setSameMode]  = useState(false);
  const [shape1,    setShape1]    = useState('truck');
  const [shape2,    setShape2]    = useState('ball');

  /* ── normal track animation positions (0–100 %) ─────────────────── */
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);

  /* ── collision state machine ─────────────────────────────────────── */
  // phases: 'idle' | 'approaching' | 'impact' | 'bouncing' | 'done'
  const [collPhase,  setCollPhase]  = useState('idle');
  const [collPos1,   setCollPos1]   = useState(5);
  const [collPos2,   setCollPos2]   = useState(95);
  const [collResult, setCollResult] = useState(null); // { v1f, v2f, impactPt }
  const [showBoom,   setShowBoom]   = useState(false);

  /* ── quiz state ──────────────────────────────────────────────────── */
  const [quizAnswer, setQuizAnswer] = useState(null);

  /* ── refs for requestAnimationFrame ──────────────────────────────── */
  const normalRaf  = useRef();
  const collRaf    = useRef();
  const prevNormal = useRef();
  const prevColl   = useRef();

  // refs used inside collision RAF (avoids stale closures)
  const collPhaseRef = useRef('idle');
  const cP1Ref       = useRef(5);
  const cP2Ref       = useRef(95);
  const cV1Ref       = useRef(0);
  const cV2Ref       = useRef(0);
  const m1Ref        = useRef(mass1);
  const m2Ref        = useRef(mass2);

  /* ── derived physics ─────────────────────────────────────────────── */
  const v1 = sameMode
    ? parseFloat((LOCKED_P / mass1).toFixed(2))
    : velocity;
  const v2 = sameMode
    ? parseFloat((LOCKED_P / mass2).toFixed(2))
    : velocity;

  const p1 = parseFloat((mass1 * v1).toFixed(1));
  const p2 = parseFloat((mass2 * v2).toFixed(1));

  const emoji1 = EMOJI_SHAPES.find(s => s.id === shape1) || EMOJI_SHAPES[3];
  const emoji2 = EMOJI_SHAPES.find(s => s.id === shape2) || EMOJI_SHAPES[0];

  // object visual size – clamped between 0.5× and 2.2× base
  const scale  = m => Math.max(0.5, Math.min(2.2, 0.5 + m / 14));
  const size1  = emoji1.baseSize * scale(mass1);
  const size2  = emoji2.baseSize * scale(mass2);

  const spd1 = speedLabel(v1);
  const spd2 = speedLabel(v2);

  const inCollision = collPhase !== 'idle' && collPhase !== 'done';
  const showNormal  = collPhase === 'idle' || collPhase === 'done';

  /* ── normal lane animation ───────────────────────────────────────── */
  const normalAnimate = useCallback((t) => {
    if (prevNormal.current !== undefined) {
      const dt = (t - prevNormal.current) / 1000;
      setPos1(p => (p + v1 * dt * SPEED_FACTOR) % 100);
      setPos2(p => (p + v2 * dt * SPEED_FACTOR) % 100);
    }
    prevNormal.current = t;
    normalRaf.current = requestAnimationFrame(normalAnimate);
  }, [v1, v2]);

  useEffect(() => {
    if (showNormal) {
      prevNormal.current = undefined;
      normalRaf.current = requestAnimationFrame(normalAnimate);
    }
    return () => cancelAnimationFrame(normalRaf.current);
  }, [normalAnimate, showNormal]);

  /* ── collision animation ─────────────────────────────────────────── */
  const runCollision = useCallback(() => {
    cancelAnimationFrame(normalRaf.current);
    cancelAnimationFrame(collRaf.current);

    // snapshot current derived velocities and masses into refs
    cP1Ref.current = 5;
    cP2Ref.current = 95;
    cV1Ref.current =  v1;  // obj1 → right
    cV2Ref.current = -v2;  // obj2 → left
    m1Ref.current  = mass1;
    m2Ref.current  = mass2;
    collPhaseRef.current = 'approaching';

    setCollPos1(5);
    setCollPos2(95);
    setCollPhase('approaching');
    setCollResult(null);
    setShowBoom(false);
    prevColl.current = undefined;

    const collFactor = 4;

    const step = (t) => {
      if (prevColl.current !== undefined) {
        const dt = (t - prevColl.current) / 1000;

        if (collPhaseRef.current === 'approaching') {
          cP1Ref.current = Math.min(cP1Ref.current + cV1Ref.current * dt * collFactor, 95);
          cP2Ref.current = Math.max(cP2Ref.current + cV2Ref.current * dt * collFactor, 5);

          setCollPos1(cP1Ref.current);
          setCollPos2(cP2Ref.current);

          // collision check
          if (cP2Ref.current - cP1Ref.current < 14) {
            const impact = (cP1Ref.current + cP2Ref.current) / 2;
            cP1Ref.current = impact - 6;
            cP2Ref.current = impact + 6;
            setCollPos1(cP1Ref.current);
            setCollPos2(cP2Ref.current);

            const { v1: v1f, v2: v2f } = elasticCollision(
              m1Ref.current, cV1Ref.current,
              m2Ref.current, cV2Ref.current,
            );

            setCollResult({ v1f: v1f.toFixed(1), v2f: v2f.toFixed(1), impactPt: impact });
            setShowBoom(true);
            collPhaseRef.current = 'impact';
            setCollPhase('impact');

            setTimeout(() => {
              cV1Ref.current = v1f;
              cV2Ref.current = v2f;
              collPhaseRef.current = 'bouncing';
              setCollPhase('bouncing');
              setShowBoom(false);
            }, 900);
          }

        } else if (collPhaseRef.current === 'bouncing') {
          cP1Ref.current += cV1Ref.current * dt * collFactor;
          cP2Ref.current += cV2Ref.current * dt * collFactor;

          setCollPos1(Math.max(0, Math.min(100, cP1Ref.current)));
          setCollPos2(Math.max(0, Math.min(100, cP2Ref.current)));

          if (
            (cP1Ref.current <= 0 || cP1Ref.current >= 100) &&
            (cP2Ref.current <= 0 || cP2Ref.current >= 100)
          ) {
            collPhaseRef.current = 'done';
            setCollPhase('done');
            return;
          }
        }
      }
      prevColl.current = t;
      if (collPhaseRef.current !== 'done') {
        collRaf.current = requestAnimationFrame(step);
      }
    };

    collRaf.current = requestAnimationFrame(step);
  }, [v1, v2, mass1, mass2]);

  /* ── reset ───────────────────────────────────────────────────────── */
  const handleReset = () => {
    cancelAnimationFrame(normalRaf.current);
    cancelAnimationFrame(collRaf.current);
    collPhaseRef.current = 'idle';
    prevNormal.current = undefined;
    setCollPhase('idle');
    setCollPos1(5); setCollPos2(95);
    setPos1(0); setPos2(0);
    setCollResult(null); setShowBoom(false);
    setQuizAnswer(null);
    setMass1(10); setMass2(4); setVelocity(6);
    setSameMode(false); setShape1('truck'); setShape2('ball');
  };

  /* ────────────────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────────────────── */
  return (
    <main style={S.page}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header style={S.header}>
        <Link href="/grades" style={S.backLink}>‹ Back to Grade Curriculum</Link>
        <span style={S.badge}>⚗️ Science Lab</span>
      </header>

      <div style={S.container}>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={S.h1}>
            Momentum:{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#38bdf8' }}>p = mv</span>
          </h1>
          <p style={S.subtitle}>
            Mass and speed together decide how much momentum an object has.
          </p>
        </div>

        {/* ── 30 / 70 Split ────────────────────────────────────────── */}
        <div style={S.split}>

          {/* ═══ LEFT: CONTROLS (30%) ════════════════════════════════ */}
          <aside style={S.controlsPanel}>
            <div style={S.panelTitle}>🎛️ Controls</div>

            {/* ─ Same Momentum Mode ─ */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>🔒 Same Momentum Mode</span>
                <button role="switch" aria-checked={sameMode}
                  onClick={() => setSameMode(x => !x)}
                  style={S.toggleTrack(sameMode)}>
                  <span style={S.toggleThumb(sameMode)} />
                </button>
              </div>

              {sameMode && (
                <div style={S.sameModeBox}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                    Fixed momentum: <strong style={{ color: '#38bdf8' }}>{LOCKED_P} kg·m/s</strong>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 2 }}>
                    <div>
                      v₁ = {LOCKED_P} ÷ {mass1} ={' '}
                      <strong style={{ color: '#38bdf8' }}>{v1} m/s</strong>
                    </div>
                    <div>
                      v₂ = {LOCKED_P} ÷ {mass2} ={' '}
                      <strong style={{ color: '#a78bfa' }}>{v2} m/s</strong>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: '#64748b', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                    💡 For same momentum, heavier objects move slower and lighter objects move faster.
                  </p>
                </div>
              )}
            </div>

            <Divider />

            {/* ─ Sliders ─ */}
            <Slider label="⚖️ Mass 1 (m₁)" value={mass1} min={1} max={20} step={0.5}
              unit="kg" color="#38bdf8" accent="#0ea5e9" onChange={setMass1} />

            <Slider label="⚖️ Mass 2 (m₂)" value={mass2} min={1} max={20} step={0.5}
              unit="kg" color="#a78bfa" accent="#7c3aed" onChange={setMass2} />

            <Slider label="⚡ Velocity (v)" value={velocity} min={1} max={20} step={0.5}
              unit="m/s" color="#34d399" accent="#10b981"
              disabled={sameMode} disabledLabel="Adaptive"
              onChange={setVelocity} />

            <Divider />

            {/* ─ Shapes ─ */}
            <div style={S.sectionLabel}>Object Shapes</div>
            <SelectCtrl id="s1" label="Object 1" value={shape1} options={EMOJI_SHAPES} onChange={setShape1} />
            <div style={{ height: 10 }} />
            <SelectCtrl id="s2" label="Object 2" value={shape2} options={EMOJI_SHAPES} onChange={setShape2} />

            <Divider />

            {/* ─ Collision button ─ */}
            <button
              onClick={runCollision}
              disabled={inCollision}
              style={{ ...S.collBtn, opacity: inCollision ? 0.5 : 1, cursor: inCollision ? 'not-allowed' : 'pointer' }}
            >
              {inCollision ? '💥 Colliding…' : '▶ Run Collision'}
            </button>

            <div style={{ height: 10 }} />
            <button onClick={handleReset} style={S.resetBtn}>🔄 Reset</button>
          </aside>

          {/* ═══ RIGHT: VISUAL (70%) ═════════════════════════════════ */}
          <div style={S.visualPanel}>

            {/* ── TRACK CARD ────────────────────────────────────────── */}
            <div style={S.trackCard}>

              {/* Distance markers */}
              <div style={{ position: 'relative', height: 20, marginBottom: 4 }}>
                {DIST_MARKS.map((m, i) => (
                  <div key={m} style={{
                    position: 'absolute',
                    left: `${(i / (DIST_MARKS.length - 1)) * 100}%`,
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}>
                    <div style={{ width: 1, height: 7, background: '#334155' }} />
                    <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>{m}m</span>
                  </div>
                ))}
              </div>

              {/* Start / Finish row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
                <span style={S.trackHdrLabel}>🟢 Start</span>
                <span style={S.trackHdrLabel}>Finish 🏁</span>
              </div>

              {/* ─── Normal lanes ─── */}
              {showNormal && (
                <>
                  <TrackLane
                    label="LANE 1"
                    pos={pos1} emoji={emoji1} size={size1}
                    v={v1} spd={spd1} color="#38bdf8"
                    specText={`m₁=${mass1}kg · v₁=${v1}m/s`}
                    objLabel="m₁"
                    showTrails={v1 > 8}
                    borderStyle="1px dashed #1e293b"
                  />
                  <div style={{ height: 8 }} />
                  <TrackLane
                    label="LANE 2"
                    pos={pos2} emoji={emoji2} size={size2}
                    v={v2} spd={spd2} color="#a78bfa"
                    specText={`m₂=${mass2}kg · v₂=${v2}m/s`}
                    objLabel="m₂"
                    showTrails={v2 > 8}
                    borderStyle="none"
                  />
                  <p style={{ fontSize: 10, color: '#475569', textAlign: 'center', margin: '10px 0 0 0' }}>
                    📏 Bigger object = more mass
                  </p>
                </>
              )}

              {/* ─── Collision lane ─── */}
              {!showNormal && (
                <>
                  {/* Phase banner */}
                  <div style={{
                    fontSize: 12, fontWeight: 700, textAlign: 'center',
                    marginBottom: 12, letterSpacing: '0.06em',
                    color: collPhase === 'impact' ? '#f87171' : collPhase === 'bouncing' ? '#fbbf24' : '#38bdf8',
                  }}>
                    {collPhase === 'approaching' && '⚡ Objects approaching…'}
                    {collPhase === 'impact'      && '💥 COLLISION!'}
                    {collPhase === 'bouncing'    && '🔄 Bouncing apart…'}
                    {collPhase === 'done'        && '✅ Collision complete!'}
                  </div>

                  {/* Single collision lane */}
                  <div style={{ position: 'relative', height: 110, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    {/* track line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #1e293b 8%, #1e293b 92%, transparent)' }} />

                    {/* explosion */}
                    {showBoom && (
                      <div style={{
                        position: 'absolute',
                        left: `${collResult?.impactPt ?? 50}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 52, zIndex: 20, userSelect: 'none',
                      }}>💥</div>
                    )}

                    {/* obj1 */}
                    {!showBoom && (
                      <div style={{ position: 'absolute', left: `${collPos1}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, userSelect: 'none' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#38bdf8', background: 'rgba(2,6,23,0.96)', border: '1px solid #1e293b', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', marginBottom: 3 }}>
                          m₁={mass1}kg
                        </span>
                        <span role="img" aria-label={emoji1.name} style={{ fontSize: size1, lineHeight: 1 }}>
                          {emoji1.emoji}
                        </span>
                      </div>
                    )}

                    {/* obj2 */}
                    {!showBoom && (
                      <div style={{ position: 'absolute', left: `${collPos2}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, userSelect: 'none' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#a78bfa', background: 'rgba(2,6,23,0.96)', border: '1px solid #1e293b', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', marginBottom: 3 }}>
                          m₂={mass2}kg
                        </span>
                        <span role="img" aria-label={emoji2.name} style={{ fontSize: size2, lineHeight: 1 }}>
                          {emoji2.emoji}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Before / After result cards */}
                  {collResult && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                      <div style={S.collResultCard}>
                        <div style={S.collResultLabel}>Before Collision</div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#38bdf8', lineHeight: 1.8 }}>
                          p₁ = {(mass1 * v1).toFixed(1)} kg·m/s →
                        </div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#a78bfa', lineHeight: 1.8 }}>
                          p₂ = {(mass2 * v2).toFixed(1)} kg·m/s ←
                        </div>
                      </div>
                      <div style={S.collResultCard}>
                        <div style={S.collResultLabel}>After Collision</div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#38bdf8', lineHeight: 1.8 }}>
                          v₁ = {collResult.v1f} m/s {parseFloat(collResult.v1f) >= 0 ? '→' : '←'}
                        </div>
                        <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#a78bfa', lineHeight: 1.8 }}>
                          v₂ = {collResult.v2f} m/s {parseFloat(collResult.v2f) >= 0 ? '→' : '←'}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── FORMULA + MOMENTUM METERS ─────────────────────────── */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>

              {/* Formula card */}
              <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 16, padding: '20px 24px', minWidth: 180, flex: '0 0 auto' }}>
                <span style={S.cardMicroLabel}>Physics Formula</span>
                <div style={{ fontSize: 'clamp(34px, 4vw, 50px)', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#f8fafc', lineHeight: 1, margin: '10px 0 12px' }}>
                  p = mv
                </div>
                {/* Live substitution */}
                <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2.1 }}>
                  <div>
                    p₁ ={' '}
                    <span style={{ color: '#38bdf8' }}>{mass1}</span>
                    {' × '}
                    <span style={{ color: '#34d399' }}>{v1}</span>
                    {' = '}
                    <strong style={{ color: '#38bdf8' }}>{p1} kg·m/s</strong>
                  </div>
                  <div>
                    p₂ ={' '}
                    <span style={{ color: '#a78bfa' }}>{mass2}</span>
                    {' × '}
                    <span style={{ color: '#34d399' }}>{v2}</span>
                    {' = '}
                    <strong style={{ color: '#a78bfa' }}>{p2} kg·m/s</strong>
                  </div>
                </div>
              </div>

              {/* Momentum bars card */}
              <div style={{ flex: 1, minWidth: 200, background: '#020617', border: '1px solid #1e293b', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
                <span style={S.cardMicroLabel}>Momentum Meter</span>
                <MomentumBar label="Object 1 · p₁" value={p1} max={MAX_P} color="#0ea5e9" />
                <MomentumBar label="Object 2 · p₂" value={p2} max={MAX_P} color="#7c3aed" />
              </div>
            </div>

            {/* ── NOTES ─────────────────────────────────────────────── */}
            <div style={S.notesCard}>
              <h3 style={S.sectionHeading}>📖 What to Notice</h3>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  <><strong style={{ color: '#f8fafc' }}>More mass → more momentum:</strong> Keep speed fixed, raise a Mass slider. The object grows and its momentum bar fills up.</>,
                  <><strong style={{ color: '#f8fafc' }}>More speed → more momentum:</strong> Keep mass fixed, raise Velocity. Watch the object race across the track and the bar shoot up.</>,
                  <><strong style={{ color: '#f8fafc' }}>Same momentum, heavier = slower:</strong> Toggle <em style={{ color: '#38bdf8' }}>Same Momentum Mode</em>. Velocity auto-adjusts so both bars stay equal.</>,
                ].map((txt, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={S.numBadge}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{txt}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── MINI QUIZ ─────────────────────────────────────────── */}
            <div style={S.notesCard}>
              <h3 style={S.sectionHeading}>🧠 Quick Quiz</h3>
              <p style={{ fontSize: 14, color: '#e2e8f0', margin: '0 0 18px 0', lineHeight: 1.7 }}>
                If momentum is{' '}
                <strong style={{ color: '#38bdf8' }}>fixed</strong> and mass{' '}
                <strong style={{ color: '#fbbf24' }}>increases</strong>, what happens to speed?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'A', text: 'Speed increases',       correct: false },
                  { id: 'B', text: 'Speed decreases',       correct: true  },
                  { id: 'C', text: 'Speed stays the same',  correct: false },
                ].map(opt => {
                  const chosen   = quizAnswer === opt.id;
                  const answered = quizAnswer !== null;
                  const right    = opt.correct;

                  let bg     = '#0f172a';
                  let border = '#334155';
                  let color  = '#cbd5e1';
                  if (answered && chosen && right)  { bg = 'rgba(52,211,153,0.15)'; border = '#34d399'; color = '#34d399'; }
                  if (answered && chosen && !right) { bg = 'rgba(248,113,113,0.15)'; border = '#f87171'; color = '#f87171'; }
                  if (answered && !chosen && right) { bg = 'rgba(52,211,153,0.07)'; color = '#34d399'; }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => !answered && setQuizAnswer(opt.id)}
                      style={{
                        background: bg, border: `1px solid ${border}`,
                        borderRadius: 10, padding: '12px 16px',
                        cursor: answered ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                        color, fontSize: 13, fontWeight: 600,
                        transition: 'all 0.2s', textAlign: 'left',
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: answered && chosen ? (right ? '#34d399' : '#f87171') : '#1e293b',
                        color: answered && chosen ? '#fff' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                      }}>
                        {answered && chosen ? (right ? '✓' : '✗') : opt.id}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {quizAnswer !== null && (
                <div style={{
                  marginTop: 14, padding: '14px 16px', borderRadius: 12,
                  background: quizAnswer === 'B' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${quizAnswer === 'B' ? '#34d399' : '#f87171'}`,
                  fontSize: 13, lineHeight: 1.7,
                  color: quizAnswer === 'B' ? '#34d399' : '#f87171',
                }}>
                  {quizAnswer === 'B'
                    ? '✅ Correct! Since p = mv is fixed, if m ↑ then v must ↓. Toggle "Same Momentum Mode" to see this live!'
                    : '❌ Not quite. Since p = mv is fixed: v = p ÷ m. If mass (m) goes up, velocity (v) must go down.'}
                </div>
              )}
            </div>

          </div>{/* end visualPanel */}
        </div>{/* end split */}
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
────────────────────────────────────────────────────────────────────── */

/** Single animated track lane */
function TrackLane({ label, pos, emoji, size, v, spd, color, specText, objLabel, showTrails, borderStyle }) {
  return (
    <div style={{
      position: 'relative', height: 92,
      borderBottom: borderStyle,
      display: 'flex', alignItems: 'center', overflow: 'hidden',
    }}>
      {/* lane tag */}
      <span style={{
        position: 'absolute', bottom: 4, left: 4, zIndex: 2,
        fontSize: 9, fontWeight: 700, color: '#334155',
        background: '#020617', border: '1px solid #1e293b',
        padding: '2px 7px', borderRadius: 6,
      }}>{label}</span>

      {/* track line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #1e293b 8%, #1e293b 92%, transparent)',
      }} />

      {/* ghost trails */}
      {showTrails && [1, 2, 3].map(i => (
        <span key={i} style={{
          position: 'absolute',
          left: `calc(${pos}% - ${i * (v > 14 ? 4.5 : 3)}%)`,
          transform: 'translateX(-50%)',
          fontSize: size * 0.72,
          opacity: Math.max(0.04, 0.22 - i * 0.07),
          lineHeight: 1, zIndex: 5,
          userSelect: 'none', pointerEvents: 'none',
          filter: 'blur(1.5px)',
        }}>{emoji.emoji}</span>
      ))}

      {/* object */}
      <div style={{
        position: 'absolute', left: `${pos}%`,
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 10, userSelect: 'none',
      }}>
        {/* speed label */}
        <span style={{
          fontSize: 8, fontWeight: 800, color: spd.color,
          background: 'rgba(2,6,23,0.9)', padding: '1px 5px',
          borderRadius: 4, marginBottom: 2,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{spd.text}</span>

        {/* spec tag */}
        <span style={{
          fontSize: 9, fontWeight: 800, color,
          background: 'rgba(2,6,23,0.96)', border: '1px solid #1e293b',
          padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', marginBottom: 3,
        }}>{specText}</span>

        <span role="img" aria-label={emoji.name} style={{ fontSize: size, lineHeight: 1 }}>
          {emoji.emoji}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginTop: 2 }}>{objLabel}</span>
      </div>
    </div>
  );
}

/** Horizontal momentum progress bar */
function MomentumBar({ label, value, max, color }) {
  const pct       = Math.min((value / max) * 100, 100);
  const intensity = Math.max(0.3, pct / 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 800, color }}>
          {value} <span style={{ fontSize: 10, color: '#475569' }}>kg·m/s</span>
        </span>
      </div>
      <div style={{ height: 11, background: '#0f172a', borderRadius: 999, border: '1px solid #1e293b', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          borderRadius: 999,
          boxShadow: `0 0 ${Math.round(10 * intensity)}px ${color}`,
          transition: 'width 0.25s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: '#334155' }}>Low</span>
        <span style={{ fontSize: 9, color: '#334155' }}>High</span>
      </div>
    </div>
  );
}

/** Range slider with value badge */
function Slider({ label, value, min, max, step, unit, color, accent, disabled, disabledLabel, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{label}</span>
        <span style={{
          fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
          color: disabled ? '#475569' : color,
          background: disabled ? 'rgba(71,85,105,0.1)' : `${color}18`,
          border: `1px solid ${disabled ? '#334155' : color + '55'}`,
          padding: '2px 8px', borderRadius: 6,
        }}>
          {disabled ? (disabledLabel || 'Locked') : `${value} ${unit}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', height: 6, accentColor: accent, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1 }}
      />
    </div>
  );
}

/** Dropdown select */
function SelectCtrl({ id, label, value, options, onChange }) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '7px 10px', fontSize: 13, color: '#e2e8f0', outline: 'none', cursor: 'pointer' }}>
        {options.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
      </select>
    </div>
  );
}

/** Thin horizontal rule */
function Divider() {
  return <div style={{ height: 1, background: '#1e293b', margin: '16px 0' }} />;
}

/* ──────────────────────────────────────────────────────────────────────
   STYLE TOKENS
────────────────────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f172a 0%, #1a2540 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    paddingBottom: 80,
  },
  header: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(15,23,42,0.94)', backdropFilter: 'blur(14px)',
    borderBottom: '1px solid #1e293b',
    padding: '0 28px', height: 58,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backLink: { color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  badge: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#64748b', background: '#1e293b', border: '1px solid #334155',
    padding: '4px 12px', borderRadius: 999,
  },
  container: { maxWidth: 1140, margin: '0 auto', padding: '32px 28px' },
  h1: { fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.2 },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: '8px 0 0 0' },

  split: { display: 'flex', gap: 24, alignItems: 'flex-start' },

  controlsPanel: {
    width: '30%', flexShrink: 0,
    background: '#020617', border: '1px solid #1e293b', borderRadius: 20,
    padding: '24px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    position: 'sticky', top: 74,
  },
  panelTitle: {
    fontSize: 13, fontWeight: 800, color: '#f8fafc',
    letterSpacing: '0.04em', marginBottom: 18,
    paddingBottom: 12, borderBottom: '1px solid #1e293b',
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
  },
  sameModeBox: {
    background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.22)',
    borderRadius: 10, padding: '12px 14px', marginTop: 8,
  },
  toggleTrack: (on) => ({
    position: 'relative', width: 44, height: 24, borderRadius: 999,
    background: on ? '#0ea5e9' : '#1e293b',
    border: `2px solid ${on ? '#38bdf8' : '#334155'}`,
    cursor: 'pointer', transition: 'background 0.25s, border-color 0.25s',
    flexShrink: 0, outline: 'none',
  }),
  toggleThumb: (on) => ({
    position: 'absolute', top: 3, left: on ? 21 : 3,
    width: 14, height: 14, borderRadius: '50%', background: '#fff',
    transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  }),
  collBtn: {
    width: '100%', borderRadius: 12, fontWeight: 700, fontSize: 13,
    padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    border: 'none', color: '#fff', boxShadow: '0 4px 18px rgba(14,165,233,0.4)',
    transition: 'opacity 0.2s',
  },
  resetBtn: {
    width: '100%', background: '#1e293b', border: '1px solid #334155',
    borderRadius: 10, color: '#e2e8f0', fontWeight: 700, fontSize: 13,
    padding: '9px 0', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },

  visualPanel: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 },
  trackCard: {
    background: '#020617', border: '1px solid #1e293b', borderRadius: 20,
    padding: '20px 24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  trackHdrLabel: {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.12em', color: '#334155',
  },
  collResultCard: {
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: 12, padding: '12px 14px',
  },
  collResultLabel: {
    fontSize: 10, fontWeight: 700, color: '#64748b',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
  },

  cardMicroLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#475569',
    display: 'block', marginBottom: 4,
  },

  notesCard: {
    background: '#020617', border: '1px solid #1e293b',
    borderRadius: 20, padding: '22px 26px',
  },
  sectionHeading: {
    fontSize: 14, fontWeight: 700, color: '#f8fafc',
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 16, marginTop: 0,
  },
  numBadge: {
    minWidth: 24, height: 24, borderRadius: '50%',
    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    color: '#fff', fontWeight: 800, fontSize: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
};
