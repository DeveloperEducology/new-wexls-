'use client';

import Link from 'next/link';

const LABS = [
  {
    href:    '/science/momentum',
    emoji:   '🏀',
    title:   'Momentum Simulator',
    tagline: 'p = mv',
    desc:    'Explore how mass and velocity create momentum. Run collisions and watch physics in action!',
    tags:    ['Grade 6–8', 'Forces', 'Motion'],
    color:   '#0ea5e9',
    glow:    'rgba(14,165,233,0.35)',
    bg:      'linear-gradient(135deg,rgba(14,165,233,0.1) 0%,rgba(99,102,241,0.07) 100%)',
    border:  'rgba(14,165,233,0.28)',
  },
  {
    href:    '/science/gravity-drop-lab',
    emoji:   '🪂',
    title:   'Gravity Drop Lab',
    tagline: 'Why do things fall?',
    desc:    "Drop objects on Earth, Moon & Mars. Discover air resistance, vacuum physics, and Galileo's legendary experiment!",
    tags:    ['Grade 6–8', 'Gravity', 'Air Resistance'],
    color:   '#a78bfa',
    glow:    'rgba(167,139,250,0.35)',
    bg:      'linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(168,85,247,0.07) 100%)',
    border:  'rgba(99,102,241,0.28)',
  },
  {
    href:    '/science/chemical-reactions',
    emoji:   '🧪',
    title:   'Chemical Reactions & Equations',
    tagline: 'Reactants → Products',
    desc:    'Master chemical reactions with adaptive IXL-style questions. Goes easier when you slip, harder when you ace it!',
    tags:    ['Grade 10', 'Chemistry', 'Adaptive'],
    color:   '#f59e0b',
    glow:    'rgba(245,158,11,0.35)',
    bg:      'linear-gradient(135deg,rgba(245,158,11,0.1) 0%,rgba(234,88,12,0.07) 100%)',
    border:  'rgba(245,158,11,0.28)',
  },
];


function LabCard({ lab }) {
  return (
    <Link href={lab.href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: lab.bg,
          border: `1px solid ${lab.border}`,
          borderRadius: 24, padding: '32px 28px',
          cursor: 'pointer', height: '100%', boxSizing: 'border-box',
          transition: 'transform .22s, box-shadow .22s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
          e.currentTarget.style.boxShadow = `0 24px 70px ${lab.glow}`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 16, filter: `drop-shadow(0 0 20px ${lab.glow})` }}>
          {lab.emoji}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: lab.color, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {lab.tagline}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-.01em' }}>
          {lab.title}
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 20px' }}>
          {lab.desc}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {lab.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 700, color: lab.color,
              background: `${lab.color}18`, border: `1px solid ${lab.color}33`,
              padding: '3px 10px', borderRadius: 999,
            }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: lab.color, fontWeight: 700, fontSize: 13 }}>
          Launch Lab <span style={{ fontSize: 16 }}>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function SciencePage() {
  return (
    <>
      <style>{`
        @keyframes glowPulse {
          0%,100% { opacity:.6; } 50% { opacity:1; }
        }
        @keyframes float {
          0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#020818 0%,#0a0f2e 60%,#050d1a 100%)',
        color: '#e2e8f0',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        paddingBottom: 80,
      }}>
        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(2,8,24,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          padding: '0 28px', height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/grades" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            ‹ Back to Grades
          </Link>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 0 25px rgba(99,102,241,.7)', letterSpacing: '-.02em' }}>
            ⚗️ Science Labs
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
            color: '#6366f1', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.3)',
            padding: '4px 12px', borderRadius: 999,
            animation: 'glowPulse 2.5s ease-in-out infinite',
          }}>Grades 6–8</span>
        </header>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '60px 24px 44px' }}>
          <div style={{ fontSize: 62, marginBottom: 20, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>
            🔬
          </div>
          <h1 style={{
            fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, color: '#fff',
            margin: '0 0 14px', textShadow: '0 0 50px rgba(99,102,241,.5)', letterSpacing: '-.02em',
          }}>
            Science Lab Hub
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 0' }}>
            Interactive simulations that make physics come alive.<br />
            Explore, experiment, and discover the laws of the universe.
          </p>
        </div>

        {/* Lab cards */}
        <div style={{
          maxWidth: 900, margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 24,
        }}>
          {LABS.map(lab => <LabCard key={lab.href} lab={lab} />)}
        </div>

        {/* Coming soon teaser */}
        <div style={{ maxWidth: 900, margin: '24px auto 0', padding: '0 24px' }}>
          <div style={{
            background: 'rgba(10,15,42,.6)', border: '1px dashed rgba(99,102,241,.2)',
            borderRadius: 20, padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{ fontSize: 40, filter: 'grayscale(1)', opacity: .5 }}>🌊</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>Wave Lab · Coming Soon</div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>Explore wave frequency, amplitude and sound physics</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#334155', background: '#1e293b', padding: '4px 12px', borderRadius: 999 }}>
              SOON
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
