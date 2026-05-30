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
          ctaHref="/grades"
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
            <Link href="/grades" className="btn-explore-large">
              Go to Grades Page ›
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
