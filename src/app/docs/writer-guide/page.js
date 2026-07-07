'use client';

import { useState } from 'react';
import Link from 'next/link';

const EXAMPLES = {
  math: {
    title: '📐 Mathematics Example',
    subtitle: 'Solving One-Step Linear Equations (e.g., x + 5 = 12)',
    steps: [
      {
        title: 'Step 1: Map the Micro-Skill Dependency Chain',
        desc: 'Define prerequisite skills and target micro-skills before drafting the chapter content.',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <h5 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', color: '#64748b' }}>Prerequisites</h5>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Addition and subtraction facts up to 20.</li>
                <li>Variables ($x$, $y$) as empty placeholders or unknown boxes.</li>
              </ul>
            </div>
            <div style={{ background: '#f0fdfa', padding: 16, borderRadius: 10, border: '1px solid #99f6e4' }}>
              <h5 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', color: '#0d9488' }}>Target Micro-Skills</h5>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#0f766e', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>The Equality Balance:</strong> Both sides of the balance scale must hold the same weight to stay level.</li>
                <li><strong>Inverse Operations:</strong> Using subtraction to cancel out addition, and division to cancel out multiplication.</li>
                <li><strong>Isolating the Variable:</strong> Carrying out operations to leave the mystery variable completely alone on one side.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: 'Step 2: Define the "Anchor Analogy"',
        desc: 'Build a concrete, physical model to hook complete beginners before using algebra symbols.',
        content: (
          <div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#334155', margin: '0 0 16px' }}>
              <strong>The Pan Balance Scale Analogy:</strong><br />
              "Imagine a physical balance scale that is perfectly level. On the left side of the scale, we have a mystery present box ($x$) and 5 marble weights. On the right side, we have 12 marble weights. Because the scale is balanced, we know the mystery box plus the 5 marbles weighs exactly the same as the 12 marbles on the other side."
            </p>
            <pre style={{
              background: '#0f172a', color: '#38bdf8', padding: 16, borderRadius: 10,
              fontFamily: 'monospace', fontSize: 13, overflowX: 'auto', margin: '0 0 16px', lineHeight: 1.5
            }}>{`       [Mystery Box]                   
         [ x ]  ●●               ●●●●●●
         ●●●                     ●●●●●●
   ======================     ======================
   \\________L1_________/      \\________R1_________/
            \\                     /
             \\_____/\\    /\\______/
                     \\  /
                      \\/ [Balanced Scale]`}</pre>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#334155', margin: 0 }}>
              <strong>The Rule of Action:</strong><br />
              "If we want to know the weight of the mystery box, we need to get it by itself. If we just swipe away the 5 marbles on the left side, the scale will tip! To keep the scale perfectly balanced, we must perform the <strong>exact same action</strong> on the other side—swipe away 5 marbles from the right side too!"
            </p>
          </div>
        )
      },
      {
        title: 'Step 3: Define the "Misconception Registry"',
        desc: 'Document the student traps and list them as distractor options in the question bank.',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 14, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0',
              fontSize: 14, color: '#991b1b'
            }}>
              <strong>Trap M-MATH-01: Adding instead of Subtracting (Distractor: 17)</strong><br />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>Student sees the "+" sign in $x + 5$ and adds: $12 + 5 = 17$.</span>
            </div>
            <div style={{
              padding: 14, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0',
              fontSize: 14, color: '#991b1b'
            }}>
              <strong>Trap M-MATH-02: Operand Confusion (Distractor: 60)</strong><br />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>Student multiplies instead of subtracts, trying to combine the two visible numbers: $12 \times 5 = 60$.</span>
            </div>
            <div style={{
              padding: 14, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0',
              fontSize: 14, color: '#991b1b'
            }}>
              <strong>Trap M-MATH-03: Sign/Direction Error (Distractor: -7)</strong><br />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>Student subtracts the target sum from the operand: $5 - 12 = -7$.</span>
            </div>
          </div>
        )
      },
      {
        title: 'Step 4: Author the Scaffolding Questions',
        desc: 'Build three distinct levels of cognitive challenges to verify understanding.',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', background: '#ccfbf1', padding: '3px 6px', borderRadius: 4 }}>🟢 Level 1: Easy (Concrete Visual)</span>
              <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                "Look at the balanced scale below. On the left, there is a box $x$ and 3 weights. On the right, there are 8 weights. If we remove 3 weights from both sides to find $x$, how many weights are left on the right side?"
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', background: '#e0f2fe', padding: '3px 6px', borderRadius: 4 }}>🟡 Level 2: Medium (Standard algebra)</span>
              <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                "Solve for $y$: $y + 7 = 19$"
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', background: '#fef3c7', padding: '3px 6px', borderRadius: 4 }}>🔴 Level 3: Hard (Multi-Step Word Problem)</span>
              <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                "A mystery bag of candy and 4 loose pieces weigh the same as 3 bags of 5 candy pieces each. How many candy pieces are in the mystery bag?" (Translates to: $x + 4 = 15$)
              </p>
            </div>
          </div>
        )
      },
      {
        title: 'Step 5: Write the Adaptive Remediation Scripts',
        desc: 'Draft specific tutor explanations corresponding to the misconceptions triggered.',
        content: (
          <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: 20, borderRadius: 10 }}>
            <h5 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: '#0d9488' }}>Remediation Script (Triggered by Option A - "17")</h5>
            <div style={{ fontStyle: 'italic', fontSize: 14, color: '#0f766e', lineHeight: 1.6 }}>
              "Tutor: Oh, I see what happened! You saw the plus sign in $x + 5$ and decided to add $12 + 5$ to get 17. 
              Let's test that out in our balance scale. If the mystery box weighs 17, then the left side is $17 + 5$, which weighs 22. But the right side only weighs 12! The scale would tip!
              <br /><br />
              To undo addition, we have to use its opposite operation: <strong>subtraction</strong>. Let's subtract 5 from both sides of the scale to keep it balanced:
              <br />
              $$x + 5 - 5 = 12 - 5$$
              $$x = 7$$
              Does $7 + 5 = 12$ make the scale balance? Yes! You got it."
            </div>
          </div>
        )
      }
    ]
  },
  science: {
    title: '🧪 Science Example',
    subtitle: 'Photosynthesis (Inputs, Outputs, and Energy Conversion)',
    steps: [
      {
        title: 'Step 1: Map the Micro-Skill Dependency Chain',
        desc: 'Map plant physiological prerequisites to targeted chemistry components.',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <h5 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', color: '#64748b' }}>Prerequisites</h5>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>Knowledge of basic plant structures (roots, stems, leaves).</li>
                <li>Understanding that animals eat food for energy, while plants cannot "swallow" organic food.</li>
              </ul>
            </div>
            <div style={{ background: '#f0fdfa', padding: 16, borderRadius: 10, border: '1px solid #99f6e4' }}>
              <h5 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'uppercase', color: '#0d9488' }}>Target Micro-Skills</h5>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#0f766e', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>Photosynthesis Inputs:</strong> Identifying Water, Carbon Dioxide, and Sunlight as the entry ingredients.</li>
                <li><strong>Photosynthesis Outputs:</strong> Identifying Glucose (sugar plant food) and Oxygen (waste gas) as the products.</li>
                <li><strong>Chloroplast Energy Conversion:</strong> Understanding that green chloroplasts function as biological solar panels that transform light energy into chemical energy stored in glucose bonds.</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: 'Step 2: Define the "Anchor Analogy"',
        desc: 'Translate microscopic biochemical reactions into a relatable, human-scale story.',
        content: (
          <div>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#334155', margin: '0 0 16px' }}>
              <strong>The Solar-Powered Leaf Kitchen:</strong><br />
              "Think of a green leaf as a tiny, busy kitchen inside a restaurant. The chefs in the kitchen are the green <strong>chloroplasts</strong>. 
              The kitchen needs two raw ingredients (Inputs): <strong>water</strong> (sucked up from the ground by roots) and <strong>carbon dioxide</strong> gas (absorbed from the air through tiny leaf pores called stomata).
              <br /><br />
              To bake their food, the chefs need heat. They turn on their solar ovens powered by <strong>sunlight</strong>. Once the baking is complete, the chefs produce two things (Outputs): a delicious <strong>glucose cake</strong> (sugar used as food for the plant) and <strong>oxygen gas</strong> (waste steam). Because they don't need oxygen, they release it out into the air for us to breathe!"
            </p>
            <pre style={{
              background: '#0f172a', color: '#34d399', padding: 16, borderRadius: 10,
              fontFamily: 'monospace', fontSize: 13, overflowX: 'auto', margin: 0, lineHeight: 1.5
            }}>{`                 [ Sun (Power Source) ]
                          |
                          v
   CO2 (Air) ➔ 🟩🟩 [ Leaf Kitchen ] 🟩🟩 ➔ Oxygen (Waste)
                          ^
                          |
                     Water (Roots)`}</pre>
          </div>
        )
      },
      {
        title: 'Step 3: Define the "Misconception Registry"',
        desc: 'Anticipate misunderstandings and build them into the distractor choices.',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 14, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0',
              fontSize: 14, color: '#991b1b'
            }}>
              <strong>Trap M-SCI-01: Plants "eat" soil (Distractor: Soil / Dirt)</strong><br />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>Student believes plants swallow dirt particles through their roots to grow mass.</span>
            </div>
            <div style={{
              padding: 14, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0',
              fontSize: 14, color: '#991b1b'
            }}>
              <strong>Trap M-SCI-02: Photosynthesis is Plant Respiration (Distractor: Plants do not need oxygen)</strong><br />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>Student confuses breathing for energy (respiration) with making sugar (photosynthesis).</span>
            </div>
            <div style={{
              padding: 14, background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0',
              fontSize: 14, color: '#991b1b'
            }}>
              <strong>Trap M-SCI-03: Light is Matter (Distractor: Light is a chemical output)</strong><br />
              <span style={{ fontSize: 13, color: '#7f1d1d' }}>Student treats sunlight as a chemical element made of atoms, rather than a wave of energy.</span>
            </div>
          </div>
        )
      },
      {
        title: 'Step 4: Author the Scaffolding Questions',
        desc: 'Build three progressive testing steps to check depth of conceptual understanding.',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', background: '#ccfbf1', padding: '3px 6px', borderRadius: 4 }}>🟢 Level 1: Easy (Pore inputs)</span>
              <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                "A plant leaf has tiny mouth-pores called stomata. According to the Leaf Kitchen analogy, what gas enters these pores from the air as a main ingredient for cooking?"
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', background: '#e0f2fe', padding: '3px 6px', borderRadius: 4 }}>🟡 Level 2: Medium (Products formula)</span>
              <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                "What are the chemical outputs (products) of photosynthesis?"
              </p>
            </div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', background: '#fef3c7', padding: '3px 6px', borderRadius: 4 }}>🔴 Level 3: Hard (HOTS Sealed Jar Riddle)</span>
              <p style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                "A healthy potted plant is placed under a sealed glass jar with soil and water. The jar is placed in a sunny room, but covered with a thick cardboard box so it is in total darkness. What will happen to the carbon dioxide levels inside the jar after 24 hours?"
              </p>
            </div>
          </div>
        )
      },
      {
        title: 'Step 5: Write the Adaptive Remediation Scripts',
        desc: 'Compose direct, story-based tutor responses for students hitting specific misconceptions.',
        content: (
          <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: 20, borderRadius: 10 }}>
            <h5 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: '#0d9488' }}>Remediation Script (Triggered by Option C - "Soil/Dirt")</h5>
            <div style={{ fontStyle: 'italic', fontSize: 14, color: '#0f766e', lineHeight: 1.6 }}>
              "Tutor: Ah! It is extremely easy to think that plants eat soil because we bury their roots in dirt. But let's think about a famous scientific experiment:
              <br /><br />
              A scientist planted a willow tree in a pot containing 200 pounds of dry soil. After 5 years of watering, the tree grew to weigh 169 pounds! But when the scientist dried and weighed the soil again, the soil had only lost 2 ounces of weight!
              <br /><br />
              If the tree grew by 169 pounds, but the soil only lost 2 ounces, the plant couldn't have built itself out of the soil! It built its entire body out of <strong>carbon dioxide gas</strong> from the air and <strong>water</strong>! Soil nutrients are just like vitamins—they help, but they are not the main food."
            </div>
          </div>
        )
      }
    ]
  }
};

export default function WriterGuideDocs() {
  const [activeSubject, setActiveSubject] = useState('math');
  const [activeStep, setActiveStep] = useState(0);

  const subjectData = EXAMPLES[activeSubject];
  const stepData = subjectData.steps[activeStep];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#1e293b',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
    }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: 300,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0,
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13,148,136,0.2)'
          }}>
            <span style={{ fontSize: 18, color: '#fff' }}>✍️</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>Writer Playbook</h1>
            <p style={{ margin: 0, fontSize: 10, color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adaptive Content</p>
          </div>
        </div>

        {/* Subject Toggles */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, background: '#f1f5f9', borderRadius: 8 }}>
          <button
            onClick={() => { setActiveSubject('math'); setActiveStep(0); }}
            style={{
              flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', background: activeSubject === 'math' ? '#ffffff' : 'transparent',
              color: activeSubject === 'math' ? '#0f766e' : '#64748b',
              boxShadow: activeSubject === 'math' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.1s'
            }}
          >
            📐 Math
          </button>
          <button
            onClick={() => { setActiveSubject('science'); setActiveStep(0); }}
            style={{
              flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', background: activeSubject === 'science' ? '#ffffff' : 'transparent',
              color: activeSubject === 'science' ? '#0f766e' : '#64748b',
              boxShadow: activeSubject === 'science' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.1s'
            }}
          >
            🧪 Science
          </button>
        </div>

        {/* Steps List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {subjectData.steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(13,148,136,0.08)' : 'transparent',
                  color: isActive ? '#0d9488' : '#475569',
                  border: isActive ? '1px solid rgba(13,148,136,0.15)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1.4
                }}
              >
                Step {idx + 1}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <main style={{ flex: 1, padding: '48px 48px 80px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
          
          <div style={{ marginBottom: 32, borderBottom: '2px solid #f1f5f9', paddingBottom: 16 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#0d9488',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: '#ccfbf1',
              padding: '4px 8px',
              borderRadius: 6
            }}>
              {subjectData.title}
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '12px 0 6px', letterSpacing: '-0.025em' }}>
              {subjectData.subtitle}
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: '#64748b' }}>
              Interactive handbook examples for curriculum creators.
            </p>
          </div>

          {/* Active Step Panel */}
          <section style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {stepData.title}
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, color: '#64748b', lineHeight: 1.5 }}>
                {stepData.desc}
              </p>
            </div>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, flex: 1 }}>
              {stepData.content}
            </div>
          </section>

          {/* Footer Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: '#ffffff', border: '1px solid #cbd5e1', color: activeStep === 0 ? '#94a3b8' : '#334155',
                opacity: activeStep === 0 ? 0.5 : 1, transition: 'all 0.1s'
              }}
            >
              ◀ Previous Step
            </button>
            <button
              onClick={() => setActiveStep(prev => Math.min(subjectData.steps.length - 1, prev + 1))}
              disabled={activeStep === subjectData.steps.length - 1}
              style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: '#0d9488', border: 'none', color: '#ffffff',
                opacity: activeStep === subjectData.steps.length - 1 ? 0.5 : 1, transition: 'all 0.1s'
              }}
            >
              Next Step ▶
            </button>
          </div>

        </main>
      </div>
      
      <style>{`
        body { margin: 0; background: #f8fafc; }
        * { box-sizing: border-box; }
        button:hover { filter: brightness(0.98); }
      `}</style>
    </div>
  );
}
