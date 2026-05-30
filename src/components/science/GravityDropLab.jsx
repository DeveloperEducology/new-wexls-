'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════
   PHYSICS DATA
═══════════════════════════════════════════════════════════════════ */
const GRAVITY = {
  earth: {
    g: 9.81, label: 'Earth', emoji: '🌍', color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)', gText: '9.81 m/s²',
    sky: 'linear-gradient(180deg,#020c1b 0%,#0d1b40 25%,#0f2f5e 55%,#1a4a6e 75%,#2a6a8a 100%)',
  },
  moon: {
    g: 1.62, label: 'Moon', emoji: '🌕', color: '#94a3b8',
    bg: 'rgba(148,163,184,0.15)', gText: '1.62 m/s²',
    sky: 'linear-gradient(180deg,#000000 0%,#080820 30%,#0a0a2a 60%,#111130 100%)',
  },
  mars: {
    g: 3.71, label: 'Mars', emoji: '🔴', color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)', gText: '3.71 m/s²',
    sky: 'linear-gradient(180deg,#1a0000 0%,#3d0a00 25%,#7a1a08 55%,#a0300f 75%,#c04010 100%)',
  },
};

// terminal velocities: Earth-air (m/s). Scaled by sqrt(g/9.81) for other planets.
const OBJECTS = {
  feather:    { emoji: '🪶', name: 'Feather',       mass: 0.003, termV: 3.5,   size: 30, wobble: true,  heavy: false, desc: 'Very light, large surface' },
  paper:      { emoji: '📄', name: 'Paper Sheet',   mass: 0.005, termV: 5,     size: 34, wobble: true,  heavy: false, desc: 'Thin, tumbles easily'       },
  parachute:  { emoji: '🪂', name: 'Parachute',     mass: 0.1,   termV: 6,     size: 42, wobble: true,  heavy: false, desc: 'Wide canopy catches air'    },
  apple:      { emoji: '🍎', name: 'Apple',         mass: 0.18,  termV: 18,    size: 36, wobble: false, heavy: false, desc: 'Dense & compact'            },
  basketball: { emoji: '🏀', name: 'Basketball',    mass: 0.62,  termV: 20,    size: 40, wobble: false, heavy: false, desc: 'Hollow, medium drag'        },
  rock:       { emoji: '🪨', name: 'Rock',          mass: 1.0,   termV: 32,    size: 36, wobble: false, heavy: false, desc: 'Dense, small surface'       },
  bowling:    { emoji: '🎳', name: 'Bowling Ball',  mass: 7.2,   termV: 120,   size: 44, wobble: false, heavy: true,  desc: 'Very heavy & dense'         },
};

const OBJ_LIST = Object.entries(OBJECTS).map(([id, d]) => ({ id, ...d }));
const TOWER_H  = 560;  // px — fixed visual tower height

// Module-level counter — guarantees unique particle IDs even when
// two impacts occur in the exact same millisecond (e.g. vacuum mode).
let _pid = 0;

/* ═══════════════════════════════════════════════════════════════════
   PHYSICS ENGINE
═══════════════════════════════════════════════════════════════════ */
function accel(v, obj, g, vacuum) {
  if (vacuum) return g;
  const effTerm = obj.termV * Math.sqrt(g / 9.81);
  const k       = g / (effTerm * effTerm);   // drag coefficient
  return Math.max(0, g - k * v * v);
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function GravityDropLab() {

  /* settings */
  const [planet,   setPlanet]   = useState('earth');
  const [vacuum,   setVacuum]   = useState(false);
  const [slowMo,   setSlowMo]   = useState(false);
  const [dropH,    setDropH]    = useState(30);
  const [obj1Id,   setObj1Id]   = useState('bowling');
  const [obj2Id,   setObj2Id]   = useState('feather');

  /* sim display state */
  const [phase,    setPhase]    = useState('ready');
  const [pos1,     setPos1]     = useState(2);   // % from top (0–100)
  const [pos2,     setPos2]     = useState(2);
  const [vel1,     setVel1]     = useState(0);
  const [vel2,     setVel2]     = useState(0);
  const [rot1,     setRot1]     = useState(0);
  const [rot2,     setRot2]     = useState(0);
  const [landed1,  setLanded1]  = useState(false);
  const [landed2,  setLanded2]  = useState(false);
  const [time1,    setTime1]    = useState(null);
  const [time2,    setTime2]    = useState(null);
  const [elapsed,  setElapsed]  = useState(0);
  const [shake,    setShake]    = useState(false);
  const [wow,      setWow]      = useState(false);
  const [particles,setParticles]= useState([]);
  const [streaks1, setStreaks1]  = useState(false);
  const [streaks2, setStreaks2]  = useState(false);

  /* RAF refs */
  const raf      = useRef();
  const lastTs   = useRef();
  const phys     = useRef({});
  const pr       = useRef({});   // params snapshot

  const grav = GRAVITY[planet];
  const o1   = OBJECTS[obj1Id];
  const o2   = OBJECTS[obj2Id];

  /* ── helpers ──────────────────────────────────────────────────── */
  const boom = (lane, heavy) => {
    const n = heavy ? 20 : 10;
    const batch = Array.from({ length: n }, (_, i) => ({
      id: `p_${++_pid}_${i}`,   // always unique — no Date.now() collision
      lane,
      angle: (360 / n) * i,
      r: heavy ? 44 + Math.random() * 28 : 18 + Math.random() * 16,
      color: heavy ? '#fbbf24' : '#94a3b8',
      sz: heavy ? 7 : 4,
    }));
    setParticles(p => [...p, ...batch]);
    setTimeout(() => setParticles(p => p.filter(x => !batch.some(b => b.id === x.id))), 1100);
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 520); };

  /* ── drop ─────────────────────────────────────────────────────── */
  const handleDrop = useCallback(() => {
    cancelAnimationFrame(raf.current);

    pr.current = {
      g: GRAVITY[planet].g, vacuum, slow: slowMo,
      h: dropH, o1: OBJECTS[obj1Id], o2: OBJECTS[obj2Id],
    };
    phys.current = {
      y1:0, v1:0, t1:0, l1:false,
      y2:0, v2:0, t2:0, l2:false, wall:0,
      r1:0, r2:0,
    };

    setPhase('falling');
    setPos1(2); setPos2(2);
    setVel1(0); setVel2(0);
    setRot1(0); setRot2(0);
    setLanded1(false); setLanded2(false);
    setTime1(null); setTime2(null);
    setElapsed(0); setWow(false); setParticles([]);
    setStreaks1(false); setStreaks2(false);
    lastTs.current = undefined;

    const tick = (ts) => {
      if (!lastTs.current) { lastTs.current = ts; raf.current = requestAnimationFrame(tick); return; }

      const rawDt = Math.min((ts - lastTs.current) / 1000, 0.04);
      const dt    = rawDt * (pr.current.slow ? 0.25 : 1);
      lastTs.current = ts;

      const p = phys.current;
      p.wall += rawDt;

      /* ── object 1 ── */
      if (!p.l1) {
        const a1 = accel(p.v1, pr.current.o1, pr.current.g, pr.current.vacuum);
        p.v1 += a1 * dt;
        p.y1 += p.v1 * dt;
        p.t1 += rawDt;
        if (pr.current.o1.wobble) p.r1 = (p.r1 + Math.min(p.v1, 8) * dt * 60) % 360;

        if (p.y1 >= pr.current.h) {
          p.y1 = pr.current.h; p.l1 = true;
          setLanded1(true);
          setTime1(+p.t1.toFixed(2));
          boom('left', pr.current.o1.heavy);
          if (pr.current.o1.heavy) triggerShake();
        }
        setPos1(2 + (p.y1 / pr.current.h) * 94);
        setVel1(+p.v1.toFixed(1));
        setRot1(+p.r1.toFixed(0));
        setStreaks1(p.v1 > 14);
      }

      /* ── object 2 ── */
      if (!p.l2) {
        const a2 = accel(p.v2, pr.current.o2, pr.current.g, pr.current.vacuum);
        p.v2 += a2 * dt;
        p.y2 += p.v2 * dt;
        p.t2 += rawDt;
        if (pr.current.o2.wobble) p.r2 = (p.r2 + Math.min(p.v2, 8) * dt * 60) % 360;

        if (p.y2 >= pr.current.h) {
          p.y2 = pr.current.h; p.l2 = true;
          setLanded2(true);
          setTime2(+p.t2.toFixed(2));
          boom('right', pr.current.o2.heavy);
          if (pr.current.o2.heavy) triggerShake();
        }
        setPos2(2 + (p.y2 / pr.current.h) * 94);
        setVel2(+p.v2.toFixed(1));
        setRot2(+p.r2.toFixed(0));
        setStreaks2(p.v2 > 14);
      }

      setElapsed(+p.wall.toFixed(1));

      if (p.l1 && p.l2) {
        setPhase('done');
        if (Math.abs(p.t1 - p.t2) < 0.15) setWow(true);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
  }, [planet, vacuum, slowMo, dropH, obj1Id, obj2Id]);

  /* ── reset ─────────────────────────────────────────────────────── */
  const handleReset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setPhase('ready');
    setPos1(2); setPos2(2);
    setVel1(0); setVel2(0); setRot1(0); setRot2(0);
    setLanded1(false); setLanded2(false);
    setTime1(null); setTime2(null);
    setElapsed(0); setWow(false); setParticles([]);
    setStreaks1(false); setStreaks2(false); setShake(false);
  }, []);

  /* ── galileo preset ─────────────────────────────────────────────── */
  const handleGalileo = () => {
    setObj1Id('bowling');
    setObj2Id('feather');
    cancelAnimationFrame(raf.current);
    setPhase('ready');
    setPos1(2); setPos2(2);
    setVel1(0); setVel2(0);
    setLanded1(false); setLanded2(false);
    setTime1(null); setTime2(null);
    setElapsed(0); setWow(false); setParticles([]);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* ── static derived values ─────────────────────────────────────── */
  const heightMarks = useMemo(() => {
    const step = dropH <= 20 ? 5 : 10;
    const marks = [];
    for (let m = 0; m <= dropH; m += step) marks.push(m);
    return marks;
  }, [dropH]);

  const atmParticles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: `${(i * 41 + 5) % 90}%`,
      y: `${(i * 31 + 8) % 82}%`,
      s: 1.5 + (i % 3) * 0.5,
      dur: `${3.5 + (i % 4) * 0.8}s`,
      del: `${(i * 0.35) % 4}s`,
    })), []);

  const stars = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      l: `${(i * 47) % 100}%`,
      t: `${(i * 39) % 100}%`,
      big: i % 5 === 0,
      dur: `${1.5 + (i % 3)}s`,
      del: `${(i * 0.18) % 2}s`,
    })), []);

  const explanation = useMemo(() => {
    if (!time1 || !time2) return null;
    const diff  = Math.abs(time1 - time2);
    const first = time1 <= time2 ? o1 : o2;
    const slow  = time1 <= time2 ? o2 : o1;
    if (diff < 0.12) return `🎉 Both objects hit the ground at the SAME time! ${vacuum ? 'In vacuum, gravity pulls all objects equally — mass does NOT affect fall speed.' : 'These objects have similar air resistance, so they landed together!'}`;
    if (vacuum) return `In vacuum mode, gravity accelerates all objects equally. Any tiny difference is simulation rounding — in a perfect vacuum they'd be identical!`;
    return `${first.name} landed first (${Math.min(time1,time2).toFixed(2)}s). ${slow.name} was dramatically slowed by air resistance — its large surface area catches a lot of air. In vacuum, they'd land together at the same time!`;
  }, [time1, time2, o1, o2, vacuum]);

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* keyframe animations */}
      <style>{`
        @keyframes floatDrift {
          0%,100% { transform:translateY(0) translateX(0) rotate(0deg); opacity:.5; }
          33% { transform:translateY(-22px) translateX(9px) rotate(5deg); opacity:1; }
          66% { transform:translateY(14px) translateX(-7px) rotate(-3deg); opacity:.7; }
        }
        @keyframes towerGlow {
          0%,100% { box-shadow: 0 0 30px rgba(99,102,241,.15), inset 0 0 40px rgba(0,0,0,.3); }
          50% { box-shadow: 0 0 60px rgba(99,102,241,.35), inset 0 0 60px rgba(0,0,0,.2); }
        }
        @keyframes shake {
          0%,100%{transform:translateX(0) rotate(0)}
          15%{transform:translateX(-7px) rotate(-.8deg)}
          30%{transform:translateX(7px) rotate(.8deg)}
          45%{transform:translateX(-5px)}
          60%{transform:translateX(5px)}
          75%{transform:translateX(-3px)}
          90%{transform:translateX(3px)}
        }
        @keyframes particleBurst {
          0% { opacity:1; transform:translate(0,0) scale(1); }
          100% { opacity:0; transform:translate(var(--px),var(--py)) scale(.2); }
        }
        @keyframes landRing {
          0% { transform:translate(-50%,-50%) scale(.4); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(2.8); opacity:0; }
        }
        @keyframes wowBanner {
          0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(99,102,241,.4);}
          50%{transform:scale(1.02);box-shadow:0 0 70px rgba(99,102,241,.7),0 0 120px rgba(56,189,248,.3);}
        }
        @keyframes glowPulse {
          0%,100%{opacity:.6;} 50%{opacity:1;}
        }
        @keyframes objDrift {
          0%,100%{transform:translateX(0) rotate(-8deg);}
          25%{transform:translateX(7px) rotate(8deg);}
          75%{transform:translateX(-5px) rotate(-4deg);}
        }
        @keyframes starTwinkle {
          0%,100%{opacity:.3;} 50%{opacity:1;}
        }
        @keyframes scanLine {
          0%{top:0%} 100%{top:100%}
        }
        @keyframes btnGlow {
          0%,100%{box-shadow:0 6px 30px rgba(99,102,241,.5);}
          50%{box-shadow:0 6px 50px rgba(99,102,241,.8), 0 0 80px rgba(56,189,248,.3);}
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#010810 0%,#060c26 50%,#030812 100%)',
        color: '#e2e8f0',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        paddingBottom: 80,
      }}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header style={{
          position:'sticky', top:0, zIndex:200,
          background:'rgba(1,8,16,.96)', backdropFilter:'blur(24px)',
          borderBottom:'1px solid rgba(99,102,241,.25)',
          padding:'0 28px', height:58,
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <Link href="/grades" style={{ color:'#64748b', textDecoration:'none', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
            ‹ Back to Curriculum
          </Link>
          <span style={{ fontSize:16, fontWeight:900, color:'#fff', textShadow:'0 0 25px rgba(99,102,241,.8)', letterSpacing:'-.02em' }}>
            🌍 Gravity Drop Lab
          </span>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase',
            color:'#6366f1', background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.3)',
            padding:'4px 12px', borderRadius:999, animation:'glowPulse 2.5s ease-in-out infinite',
          }}>⚗️ Physics Lab</span>
        </header>

        {/* ── PAGE TITLE ───────────────────────────────────────────── */}
        <div style={{ textAlign:'center', padding:'28px 24px 16px' }}>
          <h1 style={{
            fontSize:'clamp(24px,5vw,46px)', fontWeight:900, color:'#fff', margin:0,
            textShadow:'0 0 50px rgba(99,102,241,.6)', letterSpacing:'-.02em',
          }}>
            🪂 Gravity Drop Lab
          </h1>
          <p style={{ color:'#94a3b8', fontSize:15, marginTop:8, fontWeight:500 }}>
            Why do some things fall faster than others?
          </p>
        </div>

        {/* ── WOW MOMENT ───────────────────────────────────────────── */}
        {wow && (
          <div style={{
            maxWidth:700, margin:'0 auto 20px', padding:'18px 28px',
            background:'rgba(99,102,241,.12)', border:'2px solid rgba(99,102,241,.5)',
            borderRadius:20, textAlign:'center',
            animation:'wowBanner 1.2s ease-in-out infinite',
          }}>
            <div style={{ fontSize:36 }}>🤯</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#38bdf8', marginTop:6 }}>
              WHOA! They landed at the SAME TIME!
            </div>
            <div style={{ fontSize:13, color:'#94a3b8', marginTop:6, lineHeight:1.6 }}>
              In a vacuum, ALL objects fall at the exact same rate.<br/>
              <strong style={{ color:'#f8fafc' }}>Galileo proved this 400 years ago!</strong>
            </div>
          </div>
        )}

        {/* ── 3-COLUMN LAYOUT ─────────────────────────────────────── */}
        <div style={{
          maxWidth:1320, margin:'0 auto', padding:'0 16px',
          display:'grid', gridTemplateColumns:'260px 1fr 230px', gap:18, alignItems:'flex-start',
        }}>

          {/* ═══════════ LEFT: CONTROLS ════════════════════════════ */}
          <aside style={{
            position:'sticky', top:68,
            background:'rgba(6,12,38,.85)', backdropFilter:'blur(24px)',
            border:'1px solid rgba(99,102,241,.22)', borderRadius:20,
            padding:'20px 16px',
            boxShadow:'0 0 40px rgba(99,102,241,.1), 0 24px 60px rgba(0,0,0,.6)',
            animation:'towerGlow 4s ease-in-out infinite',
          }}>

            <div style={{
              fontSize:11, fontWeight:800, color:'#a5b4fc', letterSpacing:'.15em', textTransform:'uppercase',
              marginBottom:18, paddingBottom:12, borderBottom:'1px solid rgba(99,102,241,.18)',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{ fontSize:16 }}>🎛️</span> Lab Controls
            </div>

            {/* ─ Planet ─ */}
            <CtrlSection label="🪐 Gravity Planet">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                {Object.entries(GRAVITY).map(([key, g]) => (
                  <button key={key} onClick={() => { setPlanet(key); handleReset(); }} style={{
                    padding:'9px 4px', borderRadius:10, cursor:'pointer',
                    border:`1px solid ${planet===key ? g.color : 'rgba(99,102,241,.2)'}`,
                    background: planet===key ? g.bg : 'rgba(10,15,42,.7)',
                    color: planet===key ? '#fff' : '#64748b',
                    fontSize:11, fontWeight:700, transition:'all .2s',
                    boxShadow: planet===key ? `0 0 14px ${g.color}55` : 'none',
                  }}>
                    <div style={{ fontSize:17 }}>{g.emoji}</div>
                    <div style={{ marginTop:3, fontSize:10 }}>{g.label}</div>
                    <div style={{ fontSize:8, opacity:.7, marginTop:1 }}>{g.gText}</div>
                  </button>
                ))}
              </div>
            </CtrlSection>

            {/* ─ Air Mode ─ */}
            <CtrlSection label="💨 Atmosphere">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { v:false, emoji:'🌫️', label:'Normal Air',  desc:'Air resistance ON'  },
                  { v:true,  emoji:'🔬', label:'Vacuum',       desc:'Air resistance OFF' },
                ].map(opt => (
                  <button key={String(opt.v)} onClick={() => { setVacuum(opt.v); handleReset(); }} style={{
                    padding:'10px 4px', borderRadius:10, cursor:'pointer',
                    border:`1px solid ${vacuum===opt.v ? '#38bdf8' : 'rgba(99,102,241,.2)'}`,
                    background: vacuum===opt.v ? 'rgba(56,189,248,.14)' : 'rgba(10,15,42,.7)',
                    color: vacuum===opt.v ? '#38bdf8' : '#64748b',
                    fontSize:11, fontWeight:700, transition:'all .2s',
                    boxShadow: vacuum===opt.v ? '0 0 14px rgba(56,189,248,.3)' : 'none',
                  }}>
                    <div style={{ fontSize:18 }}>{opt.emoji}</div>
                    <div style={{ marginTop:3 }}>{opt.label}</div>
                    <div style={{ fontSize:9, opacity:.7, marginTop:2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </CtrlSection>

            {/* ─ Speed ─ */}
            <CtrlSection label="⏱️ Playback Speed">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[{v:false,label:'1× Normal'},{v:true,label:'🐢 0.25× Slow'}].map(opt => (
                  <button key={String(opt.v)} onClick={() => setSlowMo(opt.v)} style={{
                    padding:'9px 4px', borderRadius:10, cursor:'pointer',
                    border:`1px solid ${slowMo===opt.v ? '#a78bfa' : 'rgba(99,102,241,.2)'}`,
                    background: slowMo===opt.v ? 'rgba(167,139,250,.15)' : 'rgba(10,15,42,.7)',
                    color: slowMo===opt.v ? '#a78bfa' : '#64748b',
                    fontSize:11, fontWeight:700, transition:'all .2s',
                  }}>{opt.label}</button>
                ))}
              </div>
            </CtrlSection>

            {/* ─ Height ─ */}
            <CtrlSection label={`📏 Drop Height: ${dropH} m`}>
              <input type="range" min={10} max={50} step={5} value={dropH}
                onChange={e => { setDropH(+e.target.value); handleReset(); }}
                style={{ width:'100%', accentColor:'#6366f1', cursor:'pointer', height:6 }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#475569', marginTop:4 }}>
                <span>10 m</span><span>30 m</span><span>50 m</span>
              </div>
            </CtrlSection>

            {/* ─ Object pickers ─ */}
            <CtrlSection label="🔮 Choose Objects">
              {[
                { lbl:'Lane 1 (left)', val:obj1Id, set:setObj1Id, col:'#38bdf8' },
                { lbl:'Lane 2 (right)', val:obj2Id, set:setObj2Id, col:'#a78bfa' },
              ].map(s => (
                <div key={s.lbl} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:9, fontWeight:700, color:s.col, textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:4 }}>{s.lbl}</label>
                  <select value={s.val} onChange={e => { s.set(e.target.value); handleReset(); }} style={{
                    width:'100%', background:'#070d26', border:'1px solid rgba(99,102,241,.3)',
                    borderRadius:10, padding:'8px 10px', fontSize:12, color:'#e2e8f0', outline:'none', cursor:'pointer',
                  }}>
                    {OBJ_LIST.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.name}</option>)}
                  </select>
                </div>
              ))}
            </CtrlSection>

            {/* ─ Galileo button ─ */}
            <button onClick={handleGalileo} style={{
              width:'100%', borderRadius:12, cursor:'pointer', marginBottom:10,
              background:'linear-gradient(135deg,rgba(251,191,36,.18),rgba(239,68,68,.12))',
              border:'1px solid rgba(251,191,36,.4)',
              color:'#fbbf24', fontWeight:700, fontSize:12, padding:'10px 0',
              transition:'all .2s',
            }}>
              ⚗️ Galileo Mode
              <div style={{ fontSize:9, color:'#f59e0b', marginTop:2, opacity:.8 }}>Bowling Ball vs Feather</div>
            </button>

            {/* ─ RELEASE button ─ */}
            <button onClick={handleDrop} disabled={phase==='falling'} style={{
              width:'100%', borderRadius:14, border:'none', cursor: phase==='falling' ? 'not-allowed' : 'pointer',
              background: phase==='falling'
                ? 'rgba(99,102,241,.28)'
                : 'linear-gradient(135deg,#6366f1,#0ea5e9)',
              color:'#fff', fontWeight:900, fontSize:15, padding:'14px 0', marginBottom:10,
              boxShadow: phase==='falling' ? 'none' : 'none',
              animation: phase==='falling' ? 'none' : 'btnGlow 2s ease-in-out infinite',
              letterSpacing:'.02em', transition:'all .2s',
            }}>
              {phase==='falling' ? '⬇️ Objects Falling…' : '🚀 Release Objects'}
            </button>

            <button onClick={handleReset} style={{
              width:'100%', borderRadius:12, cursor:'pointer',
              background:'rgba(10,15,42,.8)', border:'1px solid rgba(99,102,241,.2)',
              color:'#64748b', fontWeight:700, fontSize:13, padding:'10px 0',
            }}>🔄 Reset</button>
          </aside>

          {/* ═══════════ CENTER: TOWER ═════════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{
              display:'flex', alignItems:'flex-start', width:'100%',
              animation: shake ? 'shake .52s ease-in-out' : 'none',
            }}>

              {/* Height ruler */}
              <div style={{ width:46, height:TOWER_H, position:'relative', flexShrink:0, marginRight:0, paddingTop:2 }}>
                {heightMarks.map((m, i) => {
                  const pct = ((dropH - m) / dropH) * 100;
                  return (
                    <div key={m} style={{
                      position:'absolute', top:`${pct}%`, right:0,
                      display:'flex', alignItems:'center', gap:3,
                      transform:'translateY(-50%)',
                    }}>
                      <span style={{ fontSize:9, fontFamily:'monospace', color: m===0?'#34d399':m===dropH?'#f87171':'#475569', fontWeight: m===0||m===dropH ? 700 : 400 }}>
                        {m}m
                      </span>
                      <div style={{ width:8, height:1, background: m===0?'#34d399':m===dropH?'#f87171':'#334155' }} />
                    </div>
                  );
                })}
              </div>

              {/* Tower body */}
              <div style={{
                flex:1, height:TOWER_H, position:'relative', overflow:'hidden',
                borderRadius:'14px 14px 0 0',
                border:'1px solid rgba(99,102,241,.3)', borderBottom:'none',
                boxShadow:'0 0 60px rgba(99,102,241,.15), inset 0 0 80px rgba(0,0,0,.5)',
                animation: phase!=='falling' ? 'towerGlow 4s ease-in-out infinite' : 'none',
              }}>

                {/* Background sky */}
                <div style={{
                  position:'absolute', inset:0,
                  background: grav.sky,
                  transition:'background 1s ease',
                }} />

                {/* Stars (moon mode) */}
                {planet==='moon' && stars.map(s => (
                  <div key={s.id} style={{
                    position:'absolute', left:s.l, top:s.t,
                    width: s.big ? 2 : 1, height: s.big ? 2 : 1,
                    borderRadius:'50%', background:'#fff',
                    animation:`starTwinkle ${s.dur} ease-in-out infinite`,
                    animationDelay: s.del,
                  }} />
                ))}

                {/* Mars dust texture */}
                {planet==='mars' && (
                  <div style={{
                    position:'absolute', inset:0,
                    backgroundImage:'radial-gradient(circle at 30% 60%, rgba(180,60,0,.06) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(200,80,20,.05) 0%, transparent 40%)',
                  }} />
                )}

                {/* Atmosphere particles */}
                {!vacuum && atmParticles.map(p => (
                  <div key={p.id} style={{
                    position:'absolute', left:p.x, top:p.y,
                    width:p.s, height:p.s, borderRadius:'50%',
                    background:'rgba(148,163,184,.35)',
                    animation:`floatDrift ${p.dur} ease-in-out infinite`,
                    animationDelay:p.del, pointerEvents:'none',
                  }} />
                ))}

                {/* Vacuum grid */}
                {vacuum && (
                  <div style={{
                    position:'absolute', inset:0,
                    backgroundImage:'linear-gradient(rgba(56,189,248,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,.04) 1px,transparent 1px)',
                    backgroundSize:'32px 32px',
                  }} />
                )}

                {/* Scan line (vacuum aura) */}
                {vacuum && phase==='falling' && (
                  <div style={{
                    position:'absolute', left:0, right:0, height:1,
                    background:'linear-gradient(90deg,transparent,rgba(56,189,248,.4),transparent)',
                    animation:'scanLine 3s linear infinite',
                    pointerEvents:'none',
                  }} />
                )}

                {/* Lane divider */}
                <div style={{
                  position:'absolute', left:'50%', top:0, bottom:0, width:1,
                  background:'linear-gradient(180deg,transparent,rgba(99,102,241,.5) 15%,rgba(99,102,241,.5) 85%,transparent)',
                  transform:'translateX(-50%)',
                }} />

                {/* Lane top labels */}
                <div style={{ position:'absolute', top:10, left:0, right:0, display:'flex', zIndex:20 }}>
                  <div style={{ flex:1, textAlign:'center' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#38bdf8', background:'rgba(1,8,22,.85)', padding:'2px 8px', borderRadius:999, border:'1px solid rgba(56,189,248,.3)' }}>
                      {o1.emoji} {o1.name}
                    </span>
                  </div>
                  <div style={{ flex:1, textAlign:'center' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#a78bfa', background:'rgba(1,8,22,.85)', padding:'2px 8px', borderRadius:999, border:'1px solid rgba(167,139,250,.3)' }}>
                      {o2.emoji} {o2.name}
                    </span>
                  </div>
                </div>

                {/* ── OBJECT 1 ── */}
                <FallingObj
                  pos={pos1} laneX="25%" obj={o1}
                  vel={vel1} rot={rot1}
                  landed={landed1} color="#38bdf8"
                  showStreaks={streaks1 && !landed1}
                  phase={phase}
                />

                {/* ── OBJECT 2 ── */}
                <FallingObj
                  pos={pos2} laneX="75%" obj={o2}
                  vel={vel2} rot={rot2}
                  landed={landed2} color="#a78bfa"
                  showStreaks={streaks2 && !landed2}
                  phase={phase}
                />

                {/* Impact particles */}
                {particles.map(pt => {
                  const rad = (pt.angle * Math.PI) / 180;
                  const px  = (Math.cos(rad) * pt.r).toFixed(0) + 'px';
                  const py  = (-Math.abs(Math.sin(rad) * pt.r)).toFixed(0) + 'px';
                  return (
                    <div key={pt.id} style={{
                      position:'absolute', bottom:10,
                      left: pt.lane==='left' ? '25%' : '75%',
                      transform:'translateX(-50%)',
                      width:pt.sz, height:pt.sz,
                      borderRadius:'50%', background:pt.color,
                      '--px': px, '--py': py,
                      animation:'particleBurst 1.1s ease-out forwards',
                      boxShadow:`0 0 6px ${pt.color}`,
                      zIndex:15,
                    }} />
                  );
                })}

                {/* Bottom ground markers */}
                <div style={{
                  position:'absolute', bottom:0, left:0, right:0, height:8,
                  background:'linear-gradient(90deg,rgba(56,189,248,.15) 0%,rgba(99,102,241,.15) 50%,rgba(167,139,250,.15) 100%)',
                  borderTop:'1px solid rgba(52,211,153,.3)',
                }} />
              </div>

              {/* Right side timer */}
              <div style={{ width:46, height:TOWER_H, position:'relative', flexShrink:0 }}>
                {phase!=='ready' && (
                  <div style={{
                    position:'absolute', top:8, left:4,
                    fontSize:13, fontFamily:'monospace', color:'#fbbf24', fontWeight:800,
                    textShadow:'0 0 10px rgba(251,191,36,.5)',
                  }}>{elapsed}s</div>
                )}
                {time1 && (
                  <div style={{ position:'absolute', top:'87%', left:4, fontSize:9, color:'#38bdf8', fontFamily:'monospace', fontWeight:700 }}>
                    L:{time1}s
                  </div>
                )}
                {time2 && (
                  <div style={{ position:'absolute', top:'93%', left:4, fontSize:9, color:'#a78bfa', fontFamily:'monospace', fontWeight:700 }}>
                    R:{time2}s
                  </div>
                )}
              </div>
            </div>

            {/* Ground strip */}
            <div style={{
              width:'100%', marginLeft:46, marginRight:46,
              maxWidth:`calc(100% - 92px)`,
              height:56, flexShrink:0,
              background:'linear-gradient(180deg,#1a2e14 0%,#0c1a0a 100%)',
              border:'1px solid rgba(52,211,153,.25)', borderRadius:'0 0 14px 14px',
              display:'flex', alignItems:'center', justifyContent:'space-around',
              padding:'0 16px', position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 100%,rgba(52,211,153,.12) 0%,transparent 70%)' }} />
              {[{label:'LANE 1',t:time1,col:'#38bdf8'},{label:'LANE 2',t:time2,col:'#a78bfa'}].map((it,i) => (
                <div key={i} style={{ textAlign:'center', zIndex:1 }}>
                  <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700 }}>{it.label}</div>
                  {it.t
                    ? <div style={{ fontSize:14, fontWeight:900, color:it.col }}>{it.t}s ✅</div>
                    : <div style={{ fontSize:11, color:'#334155' }}>—</div>}
                </div>
              ))}
              <div style={{ fontSize:10, color:'#334155', fontWeight:700, letterSpacing:'.15em', zIndex:1 }}>GROUND</div>
            </div>

            {/* ── EXPERIMENT RESULT ─ */}
            {phase==='done' && explanation && (
              <div style={{
                width:'100%', marginTop:20,
                padding:'22px 26px',
                background: wow ? 'rgba(99,102,241,.1)' : 'rgba(6,12,38,.85)',
                border:`1px solid ${wow ? 'rgba(99,102,241,.5)' : 'rgba(52,211,153,.25)'}`,
                borderRadius:18, backdropFilter:'blur(12px)',
                boxShadow: wow ? '0 0 50px rgba(99,102,241,.25)' : 'none',
              }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#34d399', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:14 }}>
                  🧪 Experiment Result
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  {[{o:o1,t:time1,col:'#38bdf8'},{o:o2,t:time2,col:'#a78bfa'}].map((it,i) => (
                    <div key={i} style={{ background:'rgba(1,8,22,.7)', border:`1px solid ${it.col}33`, borderRadius:14, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontSize:26 }}>{it.o.emoji}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:it.col, marginTop:4 }}>{it.o.name}</div>
                      <div style={{ fontSize:22, fontWeight:900, color:'#fff', fontFamily:'monospace' }}>{it.t ?? '—'}s</div>
                      {time1&&time2&&it.t===Math.min(time1,time2)&&Math.abs(time1-time2)>.1 && (
                        <div style={{ fontSize:10, color:'#fbbf24', marginTop:4, fontWeight:700 }}>🏆 Landed First!</div>
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.8, margin:0 }}>{explanation}</p>
              </div>
            )}
          </div>

          {/* ═══════════ RIGHT: LIVE PHYSICS ═══════════════════════ */}
          <aside style={{ position:'sticky', top:68, display:'flex', flexDirection:'column', gap:14 }}>

            <DataCard title="🌐 Environment" accent={grav.color}>
              <Row label="Planet"   val={`${grav.emoji} ${grav.label}`} col={grav.color} />
              <Row label="Gravity"  val={grav.gText}                    col={grav.color} />
              <Row label="Air"      val={vacuum ? '🔬 Vacuum' : '🌫️ Normal'}  col={vacuum?'#38bdf8':'#94a3b8'} />
              <Row label="Speed"    val={slowMo ? '0.25×' : '1×'}      col={slowMo?'#a78bfa':'#64748b'} />
              <Row label="Height"   val={`${dropH} m`}                  col="#fbbf24" />
            </DataCard>

            <DataCard title={`${o1.emoji} Object 1`} accent="#38bdf8">
              <Row label="Object"   val={o1.name}                                     col="#38bdf8" />
              <Row label="Mass"     val={`${o1.mass} kg`}                             />
              <Row label="Desc"     val={o1.desc}                                     col="#64748b" />
              <Row label="Velocity" val={phase!=='ready' ? `${vel1} m/s` : '—'}       col="#38bdf8" />
              <Row label="Time"     val={time1 ? `${time1} s` : '—'}                  col="#34d399" />
              <Row label="Status"   val={landed1 ? '✅ Landed' : phase==='falling' ? '⬇️ Falling' : '⏸ Ready'}
                   col={landed1?'#34d399':phase==='falling'?'#fbbf24':'#475569'} />
            </DataCard>

            <DataCard title={`${o2.emoji} Object 2`} accent="#a78bfa">
              <Row label="Object"   val={o2.name}                                     col="#a78bfa" />
              <Row label="Mass"     val={`${o2.mass} kg`}                             />
              <Row label="Desc"     val={o2.desc}                                     col="#64748b" />
              <Row label="Velocity" val={phase!=='ready' ? `${vel2} m/s` : '—'}       col="#a78bfa" />
              <Row label="Time"     val={time2 ? `${time2} s` : '—'}                  col="#34d399" />
              <Row label="Status"   val={landed2 ? '✅ Landed' : phase==='falling' ? '⬇️ Falling' : '⏸ Ready'}
                   col={landed2?'#34d399':phase==='falling'?'#fbbf24':'#475569'} />
            </DataCard>

            {phase!=='ready' && (
              <DataCard title="⏱️ Timer">
                <div style={{ textAlign:'center', fontSize:38, fontWeight:900, fontFamily:'monospace', color:'#fbbf24', textShadow:'0 0 25px rgba(251,191,36,.6)', lineHeight:1 }}>
                  {elapsed}s
                </div>
                <div style={{ textAlign:'center', fontSize:10, color:'#475569', marginTop:6 }}>
                  {slowMo ? '0.25× slow motion' : 'Real time'}
                </div>
              </DataCard>
            )}

            <DataCard title="💡 What to Notice">
              {[
                'Heavy dense objects are barely slowed by air — thin air means little resistance.',
                'Feather has a huge surface area for its mass — air pushes back hard.',
                'In vacuum 🔬 ALL objects fall at the exact same rate!',
                'Moon gravity (1.62) is 6× weaker than Earth (9.81).',
                'Galileo proved this with experiments in 1589!',
              ].map((tip,i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
                  <span style={{
                    minWidth:18, height:18, borderRadius:'50%',
                    background:'linear-gradient(135deg,#6366f1,#0ea5e9)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:800, color:'#fff', flexShrink:0, marginTop:1,
                  }}>{i+1}</span>
                  <span style={{ fontSize:10, color:'#94a3b8', lineHeight:1.55 }}>{tip}</span>
                </div>
              ))}
            </DataCard>
          </aside>

        </div>{/* end 3-col */}
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════ */

function FallingObj({ pos, laneX, obj, vel, rot, landed, color, showStreaks, phase }) {
  const blur = vel > 20 ? Math.min((vel - 20) / 30, 1.5) : 0;
  return (
    <div style={{
      position:'absolute', left:laneX, top:`${pos}%`,
      transform:'translate(-50%,-50%)',
      zIndex:10, userSelect:'none',
      display:'flex', flexDirection:'column', alignItems:'center',
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      transition: phase==='falling' ? 'top 0.016s linear' : 'none',
    }}>
      {/* Speed streaks */}
      {showStreaks && (
        <div style={{ position:'absolute', top:-18, width:'120%', display:'flex', flexDirection:'column', gap:2.5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              height:1.5, borderRadius:999,
              background:`rgba(${color==='#38bdf8'?'56,189,248':'167,139,250'},${.65-i*.18})`,
              marginLeft:`${12+i*8}%`, marginRight:`${12+i*8}%`,
            }} />
          ))}
        </div>
      )}

      {/* Velocity badge */}
      {phase==='falling' && !landed && (
        <span style={{
          fontSize:8, fontWeight:800, color, marginBottom:2,
          background:'rgba(1,8,22,.9)', padding:'1px 6px', borderRadius:999,
          border:`1px solid ${color}44`, whiteSpace:'nowrap',
          fontFamily:'monospace',
        }}>{vel} m/s</span>
      )}

      {/* Emoji */}
      <span
        role="img" aria-label={obj.name}
        style={{
          fontSize:obj.size, lineHeight:1, display:'inline-block',
          transform: obj.wobble && !landed ? `rotate(${rot}deg)` : 'none',
          animation: obj.wobble && phase!=='falling' ? 'objDrift 2.5s ease-in-out infinite' : 'none',
        }}
      >{obj.emoji}</span>

      {/* Landing ripple */}
      {landed && (
        <div style={{
          position:'absolute', left:'50%', top:'50%',
          width: obj.size * 2.5, height: obj.size * 2.5,
          border:`2px solid ${color}`,
          borderRadius:'50%',
          animation:'landRing .7s ease-out forwards',
          pointerEvents:'none',
        }} />
      )}
    </div>
  );
}

function CtrlSection({ label, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function DataCard({ title, accent, children }) {
  return (
    <div style={{
      background:'rgba(6,12,38,.85)', backdropFilter:'blur(20px)',
      border:`1px solid ${accent ? accent+'2a' : 'rgba(99,102,241,.18)'}`,
      borderRadius:16, padding:'16px 18px',
      boxShadow: accent ? `0 0 20px ${accent}0e` : 'none',
    }}>
      <div style={{ fontSize:11, fontWeight:700, color: accent || '#a5b4fc', marginBottom:12, paddingBottom:10, borderBottom:'1px solid rgba(99,102,241,.12)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, val, col }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, gap:6 }}>
      <span style={{ fontSize:10, color:'#475569', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:10, fontWeight:700, color: col||'#e2e8f0', fontFamily:'monospace', textAlign:'right', lineHeight:1.4 }}>{val}</span>
    </div>
  );
}
