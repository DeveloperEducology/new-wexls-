import React from 'react';
import Link from 'next/link';
import { listV2Nodes, seedV2Initial } from '@/lib/curriculum/storeV2';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeHero from '@/components/home/HomeHero';
import GradeFilterDropdownV2 from './GradeFilterDropdownV2';

export const metadata = {
  title: 'Explore Grade Curriculum & Learning Skills (V2) | KlassChamp',
  description: 'Browse curriculum topics in Math, English, and Science. Parallel V2 architecture implementation.',
};

export const dynamic = 'force-dynamic';

function buildGradeCurriculumV2(grades, subjects, units, chapters, skills, activeSubjectId) {
  // Filter units under the active subject
  const subjectUnits = units.filter(u => u.subjectId === activeSubjectId);
  const unitsMap = new Map(subjectUnits.map(u => [u.id, u]));

  const gradeMap = new Map(); // gradeId -> Map(unitId -> { unitNode, skills: [] })

  chapters.forEach(chapter => {
    const unit = unitsMap.get(chapter.unitId);
    if (!unit) return; // Unit belongs to another subject

    const gradeId = chapter.gradeId;
    if (!gradeMap.has(gradeId)) {
      gradeMap.set(gradeId, new Map());
    }

    const unitsInGrade = gradeMap.get(gradeId);
    if (!unitsInGrade.has(chapter.unitId)) {
      unitsInGrade.set(chapter.unitId, {
        id: chapter.unitId,
        title: unit.title,
        color: unit.color || '#ff951f',
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

    unitsInGrade.get(chapter.unitId).skills.push(...mappedSkills);
  });

  // Assemble the grade levels structure
  const formatted = grades.map(grade => {
    const unitsInGrade = gradeMap.get(grade.id) || new Map();
    const topicsList = Array.from(unitsInGrade.values()).filter(t => t.skills.length > 0);
    return [
      grade.title,
      topicsList,
      grade.id
    ];
  }).filter(([, topicsList]) => topicsList.length > 0);

  // Sort grades by their database order
  return formatted.sort((a, b) => {
    const gradeA = grades.find(g => g.id === a[2]);
    const gradeB = grades.find(g => g.id === b[2]);
    return (gradeA?.order || 0) - (gradeB?.order || 0);
  });
}

function practiceHrefV2(subjectId, unitId, skillId) {
  return `/practice?subject=${subjectId}&topic=${unitId}&skill=${skillId}`;
}

export default async function GradesV2Page({ searchParams }) {
  const params = await searchParams;
  const activeSubjectId = params?.subject || 'math';
  const selectedGradeId = params?.grade || 'all';

  // Load new v2 collection data
  let grades = await listV2Nodes('grade');
  let subjects = await listV2Nodes('subject');
  let units = await listV2Nodes('unit');
  let chapters = await listV2Nodes('chapter');
  let skills = await listV2Nodes('skill');

  // Trigger auto-seeding if v2 database is completely empty
  if (grades.length === 0 && subjects.length === 0) {
    console.log('V2 Curriculum collections empty, auto-seeding sample nodes...');
    await seedV2Initial();
    grades = await listV2Nodes('grade');
    subjects = await listV2Nodes('subject');
    units = await listV2Nodes('unit');
    chapters = await listV2Nodes('chapter');
    skills = await listV2Nodes('skill');
  }

  // Get active subject node
  const activeSubjectNode = subjects.find(s => s.id === activeSubjectId) || subjects[0] || { id: 'math', title: 'Math' };

  // Build the curriculum structure from v2 collections
  const sortedGrades = buildGradeCurriculumV2(grades, subjects, units, chapters, skills, activeSubjectNode.id);

  // Filter if a specific grade is selected
  const renderedGrades = selectedGradeId && selectedGradeId !== 'all'
    ? sortedGrades.filter(([, , gradeId]) => gradeId === selectedGradeId)
    : sortedGrades;

  return (
    <>
      <SiteHeader />
      <main className="ixl-landing-page">
        <HomeHero />
        
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
                  href={`/grades-v2?${tabParams.toString()}`}
                  className={`subject-tab ${activeSubjectNode.id === sub.id ? 'active' : ''}`}
                >
                  {sub.icon || '📚'} {sub.title}
                </Link>
              );
            })}
          </div>
          <div className="tab-actions-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <GradeFilterDropdownV2 grades={grades} selectedGrade={selectedGradeId} />
          </div>
        </div>

        {/* Grades V2 Grid Content */}
        <div className="curriculum-container">
          <section className="grade-content" style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
            {renderedGrades.length === 0 ? (
              <p className="empty-state">No skills available for this subject or grade yet.</p>
            ) : (
              renderedGrades.map(([gradeTitle, gradeTopics, gradeId]) => {
                const isEarlyYears = gradeId === 'lkg' || gradeId === 'ukg' || gradeId === 'prek';
                
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
                                href={practiceHrefV2(activeSubjectNode.id, topic.id, skillId)} 
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
