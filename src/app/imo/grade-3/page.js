import React from 'react';
import Link from 'next/link';
import { listImoNodes } from '@/lib/curriculum/storeImo';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeHero from '@/components/home/HomeHero';

export const metadata = {
  title: 'Olympiad (IMO) Grade 3 Curriculum | KlassChamp',
  description: 'Practice IMO Olympiad Number Sense skills with interactive step-by-step solutions.',
};

export const dynamic = 'force-dynamic';

function practiceHrefImo(subjectId, unitId, skillId) {
  return `/practice?subject=${subjectId}&topic=${unitId}&skill=${skillId}&imo=true`;
}

export default async function ImoGrade3Page() {
  // Load IMO nodes specifically for grade-3 math
  const grades = await listImoNodes('grade', { id: 'grade-3' });
  const subjects = await listImoNodes('subject', { id: 'math' });
  const units = await listImoNodes('unit', { subjectId: 'math' });
  const chapters = await listImoNodes('chapter', { gradeId: 'grade-3' });
  const skills = await listImoNodes('skill');

  const activeSubjectNode = subjects[0] || { id: 'math', title: 'Mathematics' };
  const gradeNode = grades[0] || { id: 'grade-3', title: 'Grade 3 (IMO)' };

  // Map chapters and skills
  const chaptersList = chapters.map(chapter => {
    const unit = units.find(u => u.id === chapter.unitId) || { color: '#6366f1' };
    const chapterSkills = skills
      .filter(s => s.chapterId === chapter.id)
      .map(s => [s.code || 'N.3.1.1', s.title, s.id])
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

    return {
      id: chapter.id,
      unitId: chapter.unitId,
      title: chapter.title,
      color: unit.color || '#6366f1',
      skills: chapterSkills
    };
  }).filter(c => c.skills.length > 0);

  return (
    <>
      <SiteHeader />
      <main className="ixl-landing-page">
        <HomeHero 
          title="Olympiad & IMO Foundation" 
          subtitle="Empower young learners to master Olympiad Mathematics concepts through micro-skills practice."
        />
        
        {/* Navigation Breadcrumbs Banner */}
        <div className="subject-tabs-container" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
            <Link href="/iit-foundation" style={{ color: '#4f46e5', textDecoration: 'none' }}>🎓 IIT Foundation</Link>
            <span>/</span>
            <span style={{ color: '#0f172a' }}>🏆 IMO Grade 3</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
            <Link 
              href="/iit-foundation"
              style={{
                textDecoration: 'none',
                background: 'transparent',
                color: '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🎓 IIT Foundation
            </Link>
            <div 
              style={{
                background: '#ffffff',
                color: '#4f46e5',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🏆 IMO Grade 3
            </div>
          </div>
        </div>

        {/* IMO Curriculum Grid */}
        <div className="curriculum-container" style={{ padding: '24px 48px' }}>
          <section className="grade-content" style={{ flex: 1, width: '100%' }}>
            <div className="grade-section">
              <h2 className="grade-heading" style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{gradeNode.title}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Active Curriculum</span>
              </h2>
              
              {chaptersList.length === 0 ? (
                <p className="empty-state">No Olympiad chapters seeded yet.</p>
              ) : (
                <div className="grade-topics-grid">
                  {chaptersList.map(chapter => (
                    <div key={chapter.id} className="topic-block" style={{ '--theme-color': chapter.color, background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      <h3 className="topic-subheading" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: chapter.color }} />
                        {chapter.title}
                      </h3>
                      
                      <div className="skill-pills" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {chapter.skills.map(([code, name, skillId]) => (
                          <Link 
                            key={skillId} 
                            href={practiceHrefImo(activeSubjectNode.id, chapter.unitId, skillId)} 
                            className="skill-pill"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              border: '1.5px solid #edf2f7',
                              background: '#ffffff',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              gap: '12px'
                            }}
                          >
                            <span className="skill-code" style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontFamily: 'monospace'
                            }}>
                              {code}
                            </span>
                            <span className="skill-name" style={{
                              color: '#334155',
                              fontSize: '14px',
                              fontWeight: 600,
                              flex: 1
                            }}>
                              {name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Practice ➔</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
