import React from 'react';
import Link from 'next/link';
import { listIitNodes, seedIitInitial } from '@/lib/curriculum/storeIit';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeHero from '@/components/home/HomeHero';
import GradeFilterDropdownIit from './GradeFilterDropdownIit';

export const metadata = {
  title: 'Explore IIT Foundation Curriculum & Learning Skills | KlassChamp',
  description: 'Browse curriculum topics for IIT Foundation in Mathematics, Physics, and Chemistry (Grades 6 to 12).',
};

export const dynamic = 'force-dynamic';

function buildGradeCurriculumIit(grades, subjects, units, chapters, skills, activeSubjectId) {
  // Filter units under the active subject
  const subjectUnits = units.filter(u => u.subjectId === activeSubjectId);
  const unitsMap = new Map(subjectUnits.map(u => [u.id, u]));

  const gradeMap = new Map(); // gradeId -> Map(chapterId -> { id, unitId, title, color, order, skills: [] })

  // 1. Group via Chapters
  chapters.forEach(chapter => {
    const unit = unitsMap.get(chapter.unitId);
    if (!unit) return; // Unit belongs to another subject

    const gradeId = chapter.gradeId;
    if (!gradeMap.has(gradeId)) {
      gradeMap.set(gradeId, new Map());
    }

    const chaptersInGrade = gradeMap.get(gradeId);
    if (!chaptersInGrade.has(chapter.id)) {
      chaptersInGrade.set(chapter.id, {
        id: chapter.id,
        unitId: chapter.unitId,
        title: chapter.title,
        color: unit.color || '#ff951f',
        order: chapter.order || 0,
        skills: []
      });
    }

    // Find and map skills under this chapter
    const chapterSkills = skills.filter(s => s.chapterId === chapter.id);
    const mappedSkills = chapterSkills.map(s => [
      s.code || 'S.1',
      s.title,
      s.id,
      s.templateId,
      s.engine
    ]);

    chaptersInGrade.get(chapter.id).skills.push(...mappedSkills);
  });

  // 2. Group via Direct unitId and gradeId on Skill
  skills.forEach(s => {
    const gradeId = s.gradeId;
    const unitId = s.unitId;
    if (!gradeId || !unitId) return;

    const unit = unitsMap.get(unitId);
    if (!unit) return;

    if (!gradeMap.has(gradeId)) {
      gradeMap.set(gradeId, new Map());
    }

    const chaptersInGrade = gradeMap.get(gradeId);
    const fallbackId = s.chapterId || unitId;

    if (!chaptersInGrade.has(fallbackId)) {
      chaptersInGrade.set(fallbackId, {
        id: fallbackId,
        unitId: unitId,
        title: unit.title,
        color: unit.color || '#ff951f',
        order: 999,
        skills: []
      });
    }

    const alreadyAdded = chaptersInGrade.get(fallbackId).skills.some(item => item[2] === s.id);
    if (!alreadyAdded) {
      chaptersInGrade.get(fallbackId).skills.push([
        s.code || 'S.1',
        s.title,
        s.id,
        s.templateId,
        s.engine
      ]);
    }
  });

  // Sort skills in each chapter naturally by their code
  gradeMap.forEach(chaptersInGrade => {
    chaptersInGrade.forEach(chapter => {
      chapter.skills.sort((a, b) => {
        return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
      });
    });
  });

  // Assemble the grade levels structure
  const formatted = grades.map(grade => {
    const chaptersInGrade = gradeMap.get(grade.id) || new Map();
    const chaptersList = Array.from(chaptersInGrade.values())
      .filter(c => c.skills.length > 0)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return [
      grade.title,
      chaptersList,
      grade.id
    ];
  }).filter(([, chaptersList]) => chaptersList.length > 0);

  // Sort grades by their database order
  return formatted.sort((a, b) => {
    const gradeA = grades.find(g => g.id === a[2]);
    const gradeB = grades.find(g => g.id === b[2]);
    return (gradeA?.order || 0) - (gradeB?.order || 0);
  });
}

function practiceHrefIit(subjectId, unitId, skillId) {
  return `/practice?subject=${subjectId}&topic=${unitId}&skill=${skillId}&iit=true`;
}

export default async function IitFoundationPage({ searchParams }) {
  const params = await searchParams;
  const activeSubjectId = params?.subject || 'math';
  const selectedGradeId = params?.grade || 'all';

  // Load IIT collection data
  let grades = await listIitNodes('grade');
  let subjects = await listIitNodes('subject');
  let units = await listIitNodes('unit');
  let chapters = await listIitNodes('chapter');
  let skills = await listIitNodes('skill');

  // Trigger auto-seeding if IIT database is completely empty
  if (grades.length === 0 && subjects.length === 0) {
    console.log('IIT Curriculum collections empty, auto-seeding nodes...');
    await seedIitInitial();
    grades = await listIitNodes('grade');
    subjects = await listIitNodes('subject');
    units = await listIitNodes('unit');
    chapters = await listIitNodes('chapter');
    skills = await listIitNodes('skill');
  }

  // Get active subject node
  const activeSubjectNode = subjects.find(s => s.id === activeSubjectId) || subjects[0] || { id: 'math', title: 'Mathematics' };

  // Build the curriculum structure from IIT collections
  const sortedGrades = buildGradeCurriculumIit(grades, subjects, units, chapters, skills, activeSubjectNode.id);

  // Filter if a specific grade is selected
  const renderedGrades = selectedGradeId && selectedGradeId !== 'all'
    ? sortedGrades.filter(([, , gradeId]) => gradeId === selectedGradeId)
    : sortedGrades;

  return (
    <>
      <SiteHeader />
      <main className="ixl-landing-page">
        <HomeHero 
          title="IIT Foundation Curriculum" 
          subtitle="Ace IIT JEE foundation concepts with custom dynamic assessments for Mathematics, Physics, and Chemistry."
        />
        
        {/* Dynamic Subject Tabs & Grade Dropdown Filter */}
        <div className="subject-tabs-container">
          <div className="subject-tabs">
            {subjects.map((sub) => {
              const tabParams = new URLSearchParams();
              tabParams.set('subject', sub.id);
              if (selectedGradeId !== 'all') {
                tabParams.set('grade', selectedGradeId);
              }
              return (
                <Link 
                  key={sub.id} 
                  href={`/iit-foundation?${tabParams.toString()}`}
                  className={`subject-tab ${activeSubjectNode.id === sub.id ? 'active' : ''}`}
                >
                  {sub.icon || '📚'} {sub.title}
                </Link>
              );
            })}
          </div>
          <div className="tab-actions-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <GradeFilterDropdownIit grades={grades} selectedGrade={selectedGradeId} />
            <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
              <Link 
                href="/iit-foundation"
                style={{
                  textDecoration: 'none',
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
                🎓 IIT Foundation
              </Link>
              <Link 
                href="/grades-v2"
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
                🏫 School Grades (V2)
              </Link>
            </div>
          </div>
        </div>

        {/* IIT Grid Content */}
        <div className="curriculum-container">
          <section className="grade-content" style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
            {renderedGrades.length === 0 ? (
              <p className="empty-state">No skills available for this subject or grade yet.</p>
            ) : (
              renderedGrades.map(([gradeTitle, gradeTopics, gradeId]) => {
                return (
                  <div key={gradeId} id={`grade-${gradeId}`} className="grade-section" style={{ marginTop: '2rem' }}>
                    <h2 className="grade-heading">{gradeTitle}</h2>
                    <div className="grade-topics-grid">
                      {gradeTopics.map(topic => (
                        <div key={topic.id} className="topic-block" style={{ '--theme-color': topic.color }}>
                          <h3 className="topic-subheading">{topic.title}</h3>
                          <div className="skill-pills">
                            {topic.skills.map(([code, name, skillId]) => (
                              <Link 
                                key={skillId} 
                                href={practiceHrefIit(activeSubjectNode.id, topic.unitId || topic.id, skillId)} 
                                className="skill-pill"
                              >
                                <span className="skill-code">{code}</span>
                                <span className="skill-name">{name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </main>
    </>
  );
}
