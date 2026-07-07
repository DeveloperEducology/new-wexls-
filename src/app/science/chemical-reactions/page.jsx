'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

/* ─── Static question pool (client-side, mirrors the server pool) ─── */
import { CHEMICAL_REACTIONS_POOL, ADAPTIVE_FALLBACK_MAP, ADAPTIVE_PROMOTE_MAP } from '../../../lib/practice/generators/science/topics/chemical-reactions/pool.js';

/* ─── SmartScore thresholds ─── */
const MASTERY_THRESHOLD = 100;
const LEVEL_LABELS = {
  easy:   { label: '🟢 Starter',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  medium: { label: '🟡 Explorer',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  hard:   { label: '🔴 Master',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function calcSmartScore(current, correct) {
  const s = Number(current || 0);
  if (correct) {
    if (s < 40) return Math.min(s + 15, 40);
    if (s < 70) return Math.min(s + 10, 70);
    if (s < 80) return Math.min(s + 6,  80);
    if (s < 90) return Math.min(s + 4,  90);
    if (s < 99) return Math.min(s + 2,  99);
    return 100;
  }
  if (s < 40) return Math.max(s - 4,  0);
  if (s < 70) return Math.max(s - 8,  30);
  if (s < 80) return Math.max(s - 12, 45);
  if (s < 90) return Math.max(s - 16, 60);
  return Math.max(s - 22, 70);
}

function pickQuestion(pool, seenIds) {
  const fresh = pool.filter((q) => !seenIds.includes(q.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* ─── SmartScore Ring ─── */
function SmartScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#6366f1';
  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{score}</span>
        <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: '.05em' }}>SMART</span>
      </div>
    </div>
  );
}

/* ─── Option Button ─── */
function OptionBtn({ opt, selected, revealed, onSelect }) {
  let bg = 'rgba(255,255,255,0.04)';
  let border = 'rgba(255,255,255,0.12)';
  let color = '#e2e8f0';

  if (revealed) {
    if (opt.isCorrect) { bg = 'rgba(34,197,94,0.18)'; border = '#22c55e'; color = '#86efac'; }
    else if (selected === opt.id) { bg = 'rgba(239,68,68,0.18)'; border = '#ef4444'; color = '#fca5a5'; }
    else { bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.06)'; color = '#475569'; }
  } else if (selected === opt.id) {
    bg = 'rgba(99,102,241,0.2)'; border = '#6366f1'; color = '#c7d2fe';
  }

  return (
    <button
      onClick={() => !revealed && onSelect(opt.id)}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 18px',
        background: bg, border: `1.5px solid ${border}`, borderRadius: 14,
        color, fontSize: 14, fontWeight: 600, cursor: revealed ? 'default' : 'pointer',
        transition: 'all .2s', outline: 'none', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <span style={{
        width: 28, height: 28, borderRadius: '50%',
        background: revealed && opt.isCorrect ? 'rgba(34,197,94,0.3)' : revealed && selected === opt.id ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 12, fontWeight: 900,
        border: `1px solid ${border}`,
      }}>
        {opt.id.toUpperCase()}
      </span>
      {opt.label}
      {revealed && opt.isCorrect && <span style={{ marginLeft: 'auto' }}>✅</span>}
      {revealed && selected === opt.id && !opt.isCorrect && <span style={{ marginLeft: 'auto' }}>❌</span>}
    </button>
  );
}

/* ─── Solution Box ─── */
function SolutionBox({ sections }) {
  return (
    <div style={{
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 14, padding: '16px 20px', marginTop: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#6366f1', letterSpacing: '.1em', marginBottom: 10 }}>
        💡 EXPLANATION
      </div>
      {sections.map((s, i) => (
        <p key={i} style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: '0 0 6px', fontFamily: 'monospace' }}>
          {s.content}
        </p>
      ))}
    </div>
  );
}

/* ─── Feedback Bar ─── */
function FeedbackBar({ correct, message, levelChanged }) {
  if (!message) return null;
  return (
    <div style={{
      background: correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${correct ? '#22c55e' : '#ef4444'}`,
      borderRadius: 14, padding: '12px 18px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 700,
      color: correct ? '#86efac' : '#fca5a5',
      animation: 'fadeIn .3s ease',
    }}>
      {correct ? '🎉' : '💪'} {message}
      {levelChanged && (
        <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 999 }}>
          {levelChanged}
        </span>
      )}
    </div>
  );
}

/* ─── Progress Steps ─── */
function ProgressDots({ history }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {history.map((h, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: '50%',
          background: h ? '#22c55e' : '#ef4444',
          opacity: 0.8,
        }} />
      ))}
    </div>
  );
}

/* ─── Mastery Screen ─── */
function MasteryScreen({ stats, onRestart }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 72, marginBottom: 16, animation: 'float 2s ease-in-out infinite' }}>🏆</div>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Chapter Mastered!</h2>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>You answered all levels of Chemical Reactions & Equations.</p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
        {[
          { label: 'Questions', val: stats.total },
          { label: 'Correct',   val: stats.correct },
          { label: 'Accuracy',  val: `${Math.round((stats.correct / stats.total) * 100)}%` },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '16px 24px', minWidth: 90,
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onRestart} style={{
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 14,
        padding: '14px 36px', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
      }}>
        Practice Again
      </button>
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function ChemicalReactionsPage() {
  const [difficulty, setDifficulty] = useState('easy');
  const [smartScore, setSmartScore] = useState(0);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState(null); // { correct, message, levelChanged }
  const [history, setHistory] = useState([]); // booleans
  const [seenIds, setSeenIds] = useState([]);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [mastered, setMastered] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadQuestion = useCallback((diff, seen) => {
    const pool = CHEMICAL_REACTIONS_POOL[diff] || CHEMICAL_REACTIONS_POOL.easy;
    const q = pickQuestion(pool, seen);
    setQuestion(q);
    setSelected(null);
    setRevealed(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    loadQuestion('easy', []);
  }, []);

  const handleSelect = (optId) => {
    if (revealed) return;
    setSelected(optId);
  };

  const handleSubmit = () => {
    if (!selected || revealed) return;

    const correctOpt = question.options.find((o) => o.isCorrect);
    const isCorrect = selected === correctOpt?.id;

    const newScore = calcSmartScore(smartScore, isCorrect);
    setSmartScore(newScore);

    const newTotal   = stats.total   + 1;
    const newCorrect = stats.correct + (isCorrect ? 1 : 0);
    setStats({ total: newTotal, correct: newCorrect });
    setHistory((h) => [...h, isCorrect]);
    setSeenIds((s) => [...s, question.id]);

    let nextDiff = difficulty;
    let levelMsg = null;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Promote after 3 correct in a row
      if (newStreak >= 3) {
        const promote = ADAPTIVE_PROMOTE_MAP[difficulty];
        if (promote) {
          nextDiff = promote;
          levelMsg = `⬆️ Level up → ${LEVEL_LABELS[promote].label}`;
          setStreak(0);
        } else {
          // Already at hard — check mastery
          if (newScore >= MASTERY_THRESHOLD) {
            setMastered(true);
            return;
          }
        }
      }

      setFeedback({
        correct: true,
        message: newStreak >= 3 ? 'Excellent streak! 🔥' : 'Great job! Keep going!',
        levelChanged: levelMsg,
      });
    } else {
      setStreak(0);
      // Fall back to easier on wrong
      const fallback = ADAPTIVE_FALLBACK_MAP[difficulty];
      if (fallback && fallback !== difficulty) {
        nextDiff = fallback;
        levelMsg = `⬇️ Let's review → ${LEVEL_LABELS[fallback].label}`;
      }
      setFeedback({
        correct: false,
        message: 'Not quite! Read the explanation below.',
        levelChanged: levelMsg,
      });
    }

    setDifficulty(nextDiff);
    setRevealed(true);
  };

  const handleNext = () => {
    loadQuestion(difficulty, seenIds);
  };

  const handleRestart = () => {
    setDifficulty('easy');
    setSmartScore(0);
    setSelected(null);
    setRevealed(false);
    setFeedback(null);
    setHistory([]);
    setSeenIds([]);
    setStats({ total: 0, correct: 0 });
    setMastered(false);
    setStreak(0);
    loadQuestion('easy', []);
  };

  const lvl = LEVEL_LABELS[difficulty];

  return (
    <>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg,#020818 0%,#0a0f2e 60%,#050d1a 100%)',
        color: '#e2e8f0',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        paddingBottom: 80,
      }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(2,8,24,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          padding: '0 24px', height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/science" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            ‹ Science Hub
          </Link>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-.01em' }}>
            🧪 Chemical Reactions
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
            color: '#f59e0b', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
            padding: '4px 12px', borderRadius: 999, animation: 'glowPulse 2.5s ease-in-out infinite',
          }}>Grade 10</span>
        </header>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px' }}>

          {/* ── Top bar: SmartScore + Level ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '16px 20px', marginBottom: 24,
          }}>
            <SmartScoreRing score={smartScore} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '.1em', marginBottom: 4 }}>
                CURRENT LEVEL
              </div>
              <div style={{
                display: 'inline-block', fontSize: 13, fontWeight: 800,
                color: lvl.color, background: lvl.bg,
                border: `1px solid ${lvl.color}40`,
                padding: '4px 14px', borderRadius: 999,
              }}>
                {lvl.label}
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                {stats.total} answered · {stats.correct} correct
                {streak >= 2 && <span style={{ color: '#f59e0b', marginLeft: 8 }}>🔥 {streak} streak</span>}
              </div>
              {/* Progress dots */}
              {history.length > 0 && (
                <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                  {history.slice(-20).map((h, i) => (
                    <div key={i} style={{
                      width: 9, height: 9, borderRadius: '50%',
                      background: h ? '#22c55e' : '#ef4444', opacity: 0.85,
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['easy', 'medium', 'hard'].map((d) => (
                <button key={d} onClick={() => { setDifficulty(d); loadQuestion(d, seenIds); }}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                    cursor: 'pointer', border: `1px solid ${LEVEL_LABELS[d].color}`,
                    background: difficulty === d ? LEVEL_LABELS[d].bg : 'transparent',
                    color: LEVEL_LABELS[d].color,
                    letterSpacing: '.06em', textTransform: 'uppercase',
                  }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* ── Adaptive info banner ── */}
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 12, padding: '10px 16px', marginBottom: 20,
            fontSize: 12, color: '#6366f1', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🎯 <span>Adaptive mode: wrong answer → easier question · 3 correct in a row → harder level</span>
          </div>

          {/* ── Mastery screen ── */}
          {mastered && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24, overflow: 'hidden',
            }}>
              <MasteryScreen stats={stats} onRestart={handleRestart} />
            </div>
          )}

          {/* ── Question card ── */}
          {!mastered && question && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24, padding: '28px 24px',
              animation: 'slideIn .3s ease',
            }}>
              {/* Question number + chapter label */}
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 14, letterSpacing: '.06em' }}>
                Chapter 1 · Chemical Reactions & Equations &nbsp;·&nbsp; Q {stats.total + 1}
              </div>

              {/* Feedback bar */}
              {feedback && (
                <FeedbackBar correct={feedback.correct} message={feedback.message} levelChanged={feedback.levelChanged} />
              )}

              {/* Question text */}
              <div style={{
                fontSize: 17, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.6,
                marginBottom: 22, padding: '16px 18px',
                background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                borderLeft: `3px solid ${lvl.color}`,
              }}>
                {question.questionText}
              </div>

              {/* Options */}
              <div>
                {question.options.map((opt) => (
                  <OptionBtn
                    key={opt.id} opt={opt}
                    selected={selected} revealed={revealed}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              {/* Solution */}
              {revealed && question.solution && (
                <SolutionBox sections={question.solution.sections} />
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {!revealed ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selected}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                      background: selected
                        ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                        : 'rgba(255,255,255,0.05)',
                      color: selected ? '#fff' : '#475569',
                      fontWeight: 800, fontSize: 15, cursor: selected ? 'pointer' : 'not-allowed',
                      transition: 'all .2s',
                    }}>
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                      color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                    }}>
                    Next Question →
                  </button>
                )}
                <button
                  onClick={handleRestart}
                  style={{
                    padding: '14px 18px', borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: '#64748b',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                  Restart
                </button>
              </div>
            </div>
          )}

          {/* ── Level guide ── */}
          <div style={{
            marginTop: 24, background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 12, letterSpacing: '.08em' }}>
              HOW ADAPTIVE SCORING WORKS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🟢', text: 'Starter — Identify reactions & signs' },
                { icon: '🟡', text: 'Explorer — Classify reaction types' },
                { icon: '🔴', text: 'Master — Balance equations & redox' },
              ].map((r) => (
                <div key={r.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#64748b' }}>
                  <span>{r.icon}</span> {r.text}
                </div>
              ))}
              <div style={{ marginTop: 6, fontSize: 11, color: '#334155', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                ✅ 3 correct in a row → Level up &nbsp;·&nbsp; ❌ Wrong → Step back &nbsp;·&nbsp; 🏆 SmartScore 100 → Mastered
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
