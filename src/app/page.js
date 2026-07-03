import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '../components/layout/SiteHeader';
import HomeHero from '../components/home/HomeHero';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <>
      <SiteHeader />
      
      <main className="ixl-landing-page">
        {/* Marketing Hero with CTA */}
        <HomeHero 
          title="Interactive & Adaptive Learning for Kids"
          subtitle="Master Math, English, and Science with gamified worksheets, visual tools, and adaptive questions customized to your child's pace."
          showCTA={true}
          ctaText="Explore Grade-wise Skills ›"
          ctaHref="/grades-v2"
        />

        {/* Feature Highlights Grid */}
        <section className="landing-features-section" aria-label="KlassChamp Features">
          <div className="section-header">
            <h2>Why Parents & Teachers Love KlassChamp</h2>
            <p>A learning platform designed to engage, not just test.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon bg-cyan">🎯</div>
              <h3>Adaptive Practice</h3>
              <p>Worksheets dynamically adjust in difficulty as children practice, keeping them motivated and challenged at the perfect pace.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-purple">🕹️</div>
              <h3>Interactive Tools</h3>
              <p>Visual manipulatives like Fraction Bars, Clocks, and Base-Ten blocks allow students to explore mathematical concepts visually.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-orange">🏆</div>
              <h3>Gamified Shell</h3>
              <p>A specialized, playful UI for LKG/UKG (Early Years) featuring encouraging animal mascots, voice guidance, and stars.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon bg-green">📊</div>
              <h3>Real-Time Analytics</h3>
              <p>Instant tracking of SmartScore, masteries, and unlocked competencies so parents and teachers can track curriculum progress.</p>
            </div>
          </div>
        </section>

        {/* Competitive Exam Prep Section */}
        <section className="landing-features-section" style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '60px 3vw' }}>
          <div className="section-header" style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Calibrated for Entrances</span>
            <h2>Competitive Exam Prep</h2>
            <p>Accelerate JNVST, AISSEE (Sainik School), and entrance exams prep with real-time adaptive drills.</p>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '1 1 500px' }}>
              <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', textTransform: 'uppercase', display: 'inline-block' }}>JNVST (Class 6) Active</span>
              <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '8px', marginBottom: '6px' }}>Jawahar Navodaya Vidyalaya Selection Test</h3>
              <p style={{ color: '#475569', fontSize: '15px', margin: 0 }}>Practice Mental Ability (MAT), Arithmetic, and Language passages aligned to actual cutoffs.</p>
            </div>
            <Link href="/exam-prep" style={{ margin: 0, padding: '12px 24px', fontSize: '15px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.15)' }}>
              Start JNVST Prep ›
            </Link>
          </div>
        </section>

        {/* Subjects Covered Section */}
        <section className="landing-subjects-section" aria-label="Subjects Covered">
          <div className="section-header">
            <h2>Explore Core Subject Areas</h2>
            <p>Covering fundamental competencies from Early Years to Primary Grades.</p>
          </div>

          <div className="subjects-row">
            <div className="subject-box border-orange">
              <span className="subject-emoji">🧮</span>
              <h4>Math</h4>
              <p>Addition, Place Values, Fractions, Geometry, and Ratios.</p>
            </div>
            <div className="subject-box border-purple">
              <span className="subject-emoji">📚</span>
              <h4>English</h4>
              <p>Grammar, Nouns, Pronouns, Verbs, Articles, and Sentence structure.</p>
            </div>
            <div className="subject-box border-cyan">
              <span className="subject-emoji">🔬</span>
              <h4>Science</h4>
              <p>Units, Temperature, Clocks, Solar system, and Measurement.</p>
            </div>
            <div className="subject-box border-green">
              <span className="subject-emoji">🌍</span>
              <h4>GK & Social</h4>
              <p>Famous personalities, Sorting, Trivia, and Reasoning skills.</p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="landing-cta-bottom">
          <div className="cta-content">
            <h2>Ready to start learning?</h2>
            <p>Browse grade curriculum and try interactive visual questions now.</p>
            <Link href="/grades-v2" className="btn-explore-large">
              Go to Grades Page ›
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
