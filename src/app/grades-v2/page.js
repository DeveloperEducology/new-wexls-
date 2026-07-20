import React from 'react';
import Link from 'next/link';
import { listV2Nodes, seedV2Initial } from '@/lib/curriculum/storeV2';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeHero from '@/components/home/HomeHero';
import GradeFilterDropdownV2 from './GradeFilterDropdownV2';
import { getMongoDb } from '@/lib/db/mongo';

export const metadata = {
  title: 'Explore Grade Curriculum & Learning Skills (V2) | KlassChamp',
  description: 'Browse curriculum topics in Math, English, and Science. Parallel V2 architecture implementation.',
};

export const dynamic = 'force-dynamic';

function buildGradeCurriculumV2(grades, subjects, units, chapters, skills, activeSubjectId) {
  // Filter units under the active subject
  const subjectUnits = units.filter(u => u.subjectId === activeSubjectId);
  const unitsMap = new Map(subjectUnits.map(u => [u.id, u]));

  const gradeMap = new Map(); // gradeId -> Map(chapterId -> { id, title, color, skills: [], order, unitId })

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
        title: chapter.title,
        color: unit.color || '#ff951f',
        skills: [],
        order: chapter.order || 0,
        unitId: chapter.unitId
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

    // Check if skill is already in any chapter
    let alreadyAdded = false;
    for (const ch of chaptersInGrade.values()) {
      if (ch.skills.some(item => item[2] === s.id)) {
        alreadyAdded = true;
        break;
      }
    }
    if (alreadyAdded) return;

    const chapterId = s.chapterId;
    if (chapterId && chapters.some(c => c.id === chapterId)) {
      const chapter = chapters.find(c => c.id === chapterId);
      if (chapter) {
        if (!chaptersInGrade.has(chapterId)) {
          chaptersInGrade.set(chapterId, {
            id: chapterId,
            title: chapter.title,
            color: unit.color || '#ff951f',
            skills: [],
            order: chapter.order || 0,
            unitId: chapter.unitId
          });
        }
        chaptersInGrade.get(chapterId).skills.push([
          s.code || 'S.1',
          s.title,
          s.id,
          s.templateId,
          s.engine
        ]);
      }
    } else {
      const fallbackChapterId = `fallback-${unitId}`;
      if (!chaptersInGrade.has(fallbackChapterId)) {
        chaptersInGrade.set(fallbackChapterId, {
          id: fallbackChapterId,
          title: unit.title,
          color: unit.color || '#ff951f',
          skills: [],
          order: 999,
          unitId: unitId
        });
      }
      chaptersInGrade.get(fallbackChapterId).skills.push([
        s.code || 'S.1',
        s.title,
        s.id,
        s.templateId,
        s.engine
      ]);
    }
  });

  // Sort skills in each chapter naturally by their code (e.g. A.1, A.2, A.10)
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
    const topicsList = Array.from(chaptersInGrade.values())
      .filter(t => t.skills.length > 0)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
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

function getMatchedTemplate(skill, templates, dynamicTemplates) {
  // A. Match in templates collection (e.g. parameterized templates)
  const tMatch = templates.find(t => 
    t.skillId === skill.id || 
    t.config?.skillId === skill.id || 
    t.id === skill.id ||
    t.id === `tpl-${skill.id}`
  );

  if (tMatch) {
    const rawInteraction = tMatch.config?.interaction;
    const interactionType = typeof rawInteraction === 'object' && rawInteraction !== null
      ? (rawInteraction.engine || JSON.stringify(rawInteraction))
      : (rawInteraction || tMatch.type || "parameterized");
    return {
      templateAdded: true,
      templateId: tMatch.id || String(tMatch._id),
      interactionType: interactionType,
      status: tMatch.status === "active" ? "Verified & Active" : "Draft / In Review"
    };
  }

  // B. Match in dynamic_templates collection
  const dtMatch = dynamicTemplates.find(dt => 
    dt.skillId === skill.id || 
    dt.id === skill.id ||
    dt.id === `ukg-english-${skill.id}` ||
    dt.id.includes(skill.id) ||
    (dt.title && dt.title.toLowerCase().replace(/[^a-z0-9]/g, '') === skill.title.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  if (dtMatch) {
    const rawInteraction = dtMatch.interaction;
    const interactionType = typeof rawInteraction === 'object' && rawInteraction !== null
      ? (rawInteraction.engine || JSON.stringify(rawInteraction))
      : (rawInteraction || dtMatch.type || "dynamic");
    return {
      templateAdded: true,
      templateId: dtMatch.id || String(dtMatch._id),
      interactionType: interactionType,
      status: dtMatch.status === "active" ? "Verified & Active" : "Draft / In Review"
    };
  }

  return {
    templateAdded: false,
    templateId: "-",
    interactionType: "-",
    status: "Pending"
  };
}

export default async function GradesV2Page({ searchParams }) {
  const params = await searchParams;
  const activeSubjectId = params?.subject || 'math';
  const selectedGradeId = params?.grade || 'all';
  const activeView = params?.view || 'grid';
  const searchQuery = params?.q || '';

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

  // Fetch templates for live matching
  const db = await getMongoDb();
  let templates = [];
  let dynamicTemplates = [];
  if (db) {
    templates = await db.collection("templates").find({}).toArray();
    dynamicTemplates = await db.collection("dynamic_templates").find({}).toArray();
  }

  // Get active subject node
  const activeSubjectNode = subjects.find(s => s.id === activeSubjectId) || subjects[0] || { id: 'math', title: 'Math' };

  // Build the curriculum structure from v2 collections
  const sortedGrades = buildGradeCurriculumV2(grades, subjects, units, chapters, skills, activeSubjectNode.id);

  // Filter if a specific grade is selected
  const renderedGrades = selectedGradeId && selectedGradeId !== 'all'
    ? sortedGrades.filter(([, , gradeId]) => gradeId === selectedGradeId)
    : sortedGrades;

  // Flatten and build structured skills list for table rendering
  const tableSkills = [];
  renderedGrades.forEach(([gradeTitle, gradeTopics, gradeId]) => {
    gradeTopics.forEach(topic => {
      topic.skills.forEach(([code, title, skillId]) => {
        const matched = getMatchedTemplate({ id: skillId, title }, templates, dynamicTemplates);
        tableSkills.push({
          id: skillId,
          code: code,
          title: title,
          gradeId: gradeId,
          gradeTitle: gradeTitle,
          chapter: topic.title,
          unitId: topic.unitId || topic.id,
          templateAdded: matched.templateAdded,
          templateId: matched.templateId,
          interactionType: matched.interactionType,
          status: matched.status
        });
      });
    });
  });

  // Sort logically by code
  tableSkills.sort((a, b) => {
    return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Filter based on search query
  const query = searchQuery.trim().toLowerCase();
  const filteredTableSkills = query
    ? tableSkills.filter(s => 
        (s.code || '').toLowerCase().includes(query) ||
        (s.title || '').toLowerCase().includes(query) ||
        (s.chapter || '').toLowerCase().includes(query) ||
        (s.templateId || '').toLowerCase().includes(query)
      )
    : tableSkills;

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
              if (activeView !== 'grid') {
                tabParams.set('view', activeView);
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
            <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
              <Link 
                href="/grades-v2"
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
                🏫 Grades V2
              </Link>
              <Link 
                href="/admin-v2"
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
                🛠️ Admin V2
              </Link>
            </div>
          </div>
        </div>

        {/* Grades V2 Layout Content */}
        <div className="curriculum-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          {/* View Toggler */}
          <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', borderRadius: '8px', padding: '4px', alignSelf: 'flex-start', margin: '1rem 0' }}>
            <Link 
              href={`/grades-v2?subject=${activeSubjectNode.id}&grade=${selectedGradeId}&view=grid`}
              style={{
                textDecoration: 'none',
                background: activeView === 'grid' ? '#ffffff' : 'transparent',
                color: activeView === 'grid' ? '#4f46e5' : '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: activeView === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📱 Grid View
            </Link>
            <Link 
              href={`/grades-v2?subject=${activeSubjectNode.id}&grade=${selectedGradeId}&view=table`}
              style={{
                textDecoration: 'none',
                background: activeView === 'table' ? '#ffffff' : 'transparent',
                color: activeView === 'table' ? '#4f46e5' : '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: activeView === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📋 KPI Mapping Table
            </Link>
          </div>

          {activeView === 'table' ? (
            <section className="grade-content" style={{ flex: 1, width: '100%' }}>
              
              {/* Search Form */}
              <form method="GET" action="/grades-v2" style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', width: '100%', maxWidth: '500px' }}>
                <input type="hidden" name="subject" value={activeSubjectNode.id} />
                <input type="hidden" name="grade" value={selectedGradeId} />
                <input type="hidden" name="view" value="table" />
                <input 
                  type="text" 
                  name="q" 
                  placeholder="Search skills, chapters, or template IDs..." 
                  defaultValue={searchQuery}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    width: '100%',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#1e293b'
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Search
                </button>
                {searchQuery && (
                  <Link
                    href={`/grades-v2?subject=${activeSubjectNode.id}&grade=${selectedGradeId}&view=table`}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    Clear
                  </Link>
                )}
              </form>

              {/* Matched Skills Table */}
              <div style={{ overflowX: 'auto', width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {filteredTableSkills.length === 0 ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No skills matched the filter.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155', width: '80px' }}>Code</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Chapter</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Skill Title</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155', width: '130px' }}>Template Added</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Template ID</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Interaction Type</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Testing Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableSkills.map((skill) => (
                        <tr key={skill.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#4f46e5' }}>{skill.code}</td>
                          <td style={{ padding: '12px 16px', color: '#475569', textTransform: 'capitalize' }}>{skill.chapter.replace(/-/g, ' ')}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>
                            <Link 
                              href={practiceHrefV2(activeSubjectNode.id, skill.unitId, skill.id)}
                              style={{ color: '#2563eb', textDecoration: 'none' }}
                              title="Click to practice this skill"
                            >
                              {skill.title} ↗
                            </Link>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#ffffff',
                              backgroundColor: skill.templateAdded ? '#10b981' : '#ef4444'
                            }}>
                              {skill.templateAdded ? '✅ YES' : '❌ NO'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0284c7' }}>{skill.templateId}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{skill.interactionType}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#ffffff',
                              backgroundColor: skill.templateAdded 
                                ? (skill.status.includes('Active') ? '#10b981' : '#eab308')
                                : '#64748b'
                            }}>
                              {skill.templateAdded ? skill.status.toUpperCase() : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ) : (
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
                                  href={practiceHrefV2(activeSubjectNode.id, topic.unitId || topic.id, skillId)} 
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
          )}
        </div>
      </main>
    </>
  );
}
