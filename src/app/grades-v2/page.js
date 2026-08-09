import React from 'react';
import Link from 'next/link';
import { listV2Nodes, seedV2Initial } from '@/lib/curriculum/storeV2';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeHero from '@/components/home/HomeHero';
import GradeFilterDropdownV2 from './GradeFilterDropdownV2';
import SyncSkillsButton from '@/components/admin/SyncSkillsButton';
import { SkillTemplateAddedToggle, SkillTestingStatusSelector } from '@/components/admin/SkillStatusToggles';
import { ALL_TEMPLATES_BY_TOPIC } from '@/lib/practice/allTemplates';
import { getMongoDb } from '@/lib/db/mongo';
import { cookies, headers } from 'next/headers';
import { verifyAccessToken } from '@/lib/authService';

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

function practiceHrefV2(subjectId, unitId, skillId, gradeId = null) {
  let resolvedGrade = gradeId;
  
  if (!resolvedGrade) {
    const targetStr = `${skillId} ${unitId}`.toLowerCase();
    if (targetStr.includes('lkg')) {
      resolvedGrade = 'lkg';
    } else if (targetStr.includes('ukg')) {
      resolvedGrade = 'ukg';
    } else if (targetStr.includes('prek')) {
      resolvedGrade = 'prek';
    } else {
      const match = targetStr.match(/(?:-g|grade[- ]|g)([0-9a-zA-Z])/);
      if (match) {
        resolvedGrade = match[1];
      } else {
        resolvedGrade = '3';
      }
    }
  }

  let cleanTopic = unitId;
  let cleanSkill = skillId;

  if (resolvedGrade) {
    const prefix = `${resolvedGrade}-`;
    if (cleanTopic.startsWith(prefix)) {
      cleanTopic = cleanTopic.slice(prefix.length);
    }
    if (cleanSkill.startsWith(prefix)) {
      cleanSkill = cleanSkill.slice(prefix.length);
    }
    cleanSkill = cleanSkill.replace(/^(size|positions|count\d+|g\d+)-/, '');
  }

  return `/practice/${resolvedGrade}/${subjectId}/${cleanTopic}/${cleanSkill}`;
}

function getMatchedTemplate(skill, templates = [], dynamicTemplates = [], questionCount = 0) {
  const skillId = String(skill.id || '').trim();
  const skillTitleClean = String(skill.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Respect manual overrides if set on skill document in database
  if (typeof skill.manualTemplateAdded === 'boolean' || typeof skill.manualTestingStatus === 'string') {
    const isAdded = typeof skill.manualTemplateAdded === 'boolean' ? skill.manualTemplateAdded : Boolean(skill.templateAdded);
    return {
      templateAdded: isAdded,
      templateId: skill.templateId || "-",
      interactionType: skill.engine || skill.type || "-",
      generatorType: skill.generatorType || "manual",
      status: skill.manualTestingStatus || (isAdded ? "Verified & Active" : "Pending")
    };
  }

  // Extract explicit IDs from skill object
  const explicitIds = new Set();
  const rawTpl = skill.templateId || skill.template_id || skill.templateIds;
  if (Array.isArray(rawTpl)) {
    rawTpl.forEach(t => explicitIds.add(String(t).trim()));
  } else if (typeof rawTpl === 'string' && rawTpl.trim()) {
    rawTpl.split(',').forEach(t => explicitIds.add(t.trim()));
  }
  if (skill.generatorId) explicitIds.add(String(skill.generatorId).trim());
  if (skill.spreadsheetId) explicitIds.add(String(skill.spreadsheetId).trim());
  if (skill.engine) explicitIds.add(String(skill.engine).trim());

  // A. Match in templates collection (e.g. parameterized templates)
  const tMatch = templates.find(t => {
    const tid = String(t.id || t._id || '');
    return (
      (skillId && (t.skillId === skillId || t.config?.skillId === skillId || tid === skillId || tid === `tpl-${skillId}`)) ||
      (explicitIds.size > 0 && (explicitIds.has(tid) || explicitIds.has(t.skillId)))
    );
  });

  if (tMatch) {
    const rawInteraction = tMatch.config?.interaction || tMatch.interaction;
    const interactionType = typeof rawInteraction === 'object' && rawInteraction !== null
      ? (rawInteraction.engine || rawInteraction.type || JSON.stringify(rawInteraction))
      : (rawInteraction || tMatch.type || tMatch.generatorType || "parameterized");
    const generatorType = tMatch.generatorType || tMatch.config?.generatorType || "parameterized";
    return {
      templateAdded: true,
      templateId: tMatch.id || String(tMatch._id),
      interactionType: String(interactionType),
      generatorType: String(generatorType),
      status: tMatch.status === "active" ? "Verified & Active" : "Draft / In Review"
    };
  }

  // B. Match in dynamic_templates collection
  const dtMatch = dynamicTemplates.find(dt => {
    const dtid = String(dt.id || dt._id || '');
    return (
      (skillId && (
        dt.skillId === skillId ||
        dtid === skillId ||
        dtid === `ukg-english-${skillId}` ||
        dtid === `universal-template-${skillId}` ||
        dtid.includes(skillId) ||
        (dt.logicType && dt.logicType === skillId) ||
        (dt.logic_type && dt.logic_type === skillId) ||
        (dt.title && dt.title.toLowerCase().replace(/[^a-z0-9]/g, '') === skillTitleClean)
      )) ||
      (explicitIds.size > 0 && (explicitIds.has(dtid) || explicitIds.has(dt.skillId) || explicitIds.has(dt.templateId)))
    );
  });

  if (dtMatch) {
    const rawInteraction = dtMatch.interaction;
    const interactionType = typeof rawInteraction === 'object' && rawInteraction !== null
      ? (rawInteraction.engine || rawInteraction.type || JSON.stringify(rawInteraction))
      : (rawInteraction || dtMatch.type || dtMatch.optionsType || "dynamic");
    const generatorType = dtMatch.generatorType || dtMatch.config?.generatorType || dtMatch.optionsType || "spreadsheet-grid";
    return {
      templateAdded: true,
      templateId: dtMatch.id || String(dtMatch._id),
      interactionType: String(interactionType),
      generatorType: String(generatorType),
      status: dtMatch.status === "active" ? "Verified & Active" : "Draft / In Review"
    };
  }

  // C. Match in Code Generators (ALL_TEMPLATES_BY_TOPIC)
  for (const [topic, tList] of Object.entries(ALL_TEMPLATES_BY_TOPIC)) {
    const codeMatch = tList.find(ct => 
      (skillId && (ct.id === skillId || ct.id === `tpl-${skillId}` || ct.id.includes(skillId))) ||
      (explicitIds.size > 0 && (explicitIds.has(ct.id) || explicitIds.has(ct.engine)))
    );
    if (codeMatch) {
      return {
        templateAdded: true,
        templateId: codeMatch.id,
        interactionType: codeMatch.questionType || codeMatch.engine || "code-generator",
        generatorType: codeMatch.engine || "code-generator",
        status: "Verified & Active"
      };
    }
  }

  // D. Match explicit IDs if present on skill
  if (explicitIds.size > 0) {
    const firstId = Array.from(explicitIds)[0];
    return {
      templateAdded: true,
      templateId: firstId,
      interactionType: skill.engine || skill.type || "linked",
      generatorType: skill.generatorId ? "generator" : (skill.spreadsheetId ? "spreadsheet" : "linked"),
      status: "Linked & Active"
    };
  }

  // E. Match static question bank
  if (questionCount > 0 || skill.isStatic) {
    return {
      templateAdded: true,
      templateId: `static-bank-${skillId}`,
      interactionType: "static_question_bank",
      generatorType: "static_bank",
      status: "Static Questions Available"
    };
  }

  return {
    templateAdded: false,
    templateId: "-",
    interactionType: "-",
    generatorType: "-",
    status: "Pending"
  };
}

export default async function GradesV2Page({ searchParams }) {
  const params = await searchParams;
  const activeSubjectId = params?.subject || 'math';
  const selectedGradeId = params?.grade || 'all';
  const searchQuery = params?.q || '';

  // Security Check: Only display table view to developers
  let isDeveloper = false;
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      isDeveloper = true;
    }
  } catch (e) {}

  if (!isDeveloper) {
    try {
      const cookieStore = await cookies();
      const accessCookie = cookieStore?.get('klasschamp_access');
      if (accessCookie) {
        const session = verifyAccessToken(accessCookie.value);
        if (session?.userId) {
          const db = await getMongoDb();
          if (db) {
            const { ObjectId } = require('mongodb');
            let userDoc = null;
            if (ObjectId.isValid(session.userId)) {
              userDoc = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
            }
            if (!userDoc) {
              userDoc = await db.collection('users').findOne({ username: session.userId });
            }
            if (userDoc && (userDoc.role === 'admin' || userDoc.role === 'developer')) {
              isDeveloper = true;
            }
          }
        }
      }
    } catch (e) {}
  }

  // Force grid view if the user is not a developer
  const activeView = isDeveloper ? (params?.view || 'grid') : 'grid';

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
  let questionCounts = {};
  if (db) {
    templates = await db.collection("templates").find({}).toArray();
    dynamicTemplates = await db.collection("dynamic_templates").find({}).toArray();
    try {
      const counts = await db.collection("questions").aggregate([
        {
          $group: {
            _id: "$skillId",
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      counts.forEach(c => {
        if (c._id) {
          questionCounts[c._id] = c.count;
        }
      });
    } catch (err) {
      console.warn("Failed to aggregate question counts:", err);
    }
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
      topic.skills.forEach(([code, title, skillId, tplIdFromChapter, engineFromChapter]) => {
        const skillNode = skills.find(s => s.id === skillId) || { id: skillId, title, templateId: tplIdFromChapter, engine: engineFromChapter };
        const qCount = questionCounts[skillId] || 0;
        const matched = getMatchedTemplate(skillNode, templates, dynamicTemplates, qCount);
        tableSkills.push({
          id: skillId,
          code: code,
          title: title,
          gradeId: gradeId,
          gradeTitle: gradeTitle,
          chapter: topic.title,
          unitId: topic.unitId || topic.id,
          templateAdded: matched.templateAdded,
          templateId: matched.templateId !== '-' ? matched.templateId : (skillNode.templateId || '-'),
          interactionType: matched.interactionType !== '-' ? matched.interactionType : (skillNode.engine || '-'),
          generatorType: matched.generatorType,
          isStatic: skillNode?.isStatic || skillNode?.static || false,
          questionCount: qCount,
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

          </div>
        </div>

        {/* Grades V2 Layout Content */}
        <div className="curriculum-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          {/* View Toggler */}
          {isDeveloper && (
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
          )}

          {activeView === 'table' ? (
            <section className="grade-content" style={{ flex: 1, width: '100%' }}>
              
              {/* Search Form & Sync Button */}
              <form method="GET" action="/grades-v2" style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', width: '100%', maxWidth: '750px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    flex: '1',
                    minWidth: '240px',
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
                <SyncSkillsButton subject={activeSubjectNode.id} grade={selectedGradeId} />
              </form>

              {/* Stats Summary Bar */}
              {(() => {
                const totalSkills = tableSkills.length;
                const linkedTemplates = tableSkills.filter(s => s.templateAdded).length;
                const pendingTemplates = totalSkills - linkedTemplates;
                const linkedPercentage = totalSkills > 0 ? Math.round((linkedTemplates / totalSkills) * 100) : 0;
                
                const staticSkills = tableSkills.filter(s => s.isStatic).length;
                const totalStaticQuestions = tableSkills.reduce((acc, s) => acc + (s.questionCount || 0), 0);

                return (
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '24px',
                    width: '100%',
                    background: '#ffffff',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '130px' }}>
                      <span style={{ fontSize: '1.8rem' }}>📊</span>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Skills</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>{totalSkills}</div>
                      </div>
                    </div>
                    <div style={{ width: '1.5px', height: '36px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px' }}>
                      <span style={{ fontSize: '1.8rem' }}>📝</span>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Static Skills</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>{staticSkills} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>({totalStaticQuestions} qns)</span></div>
                      </div>
                    </div>
                    <div style={{ width: '1.5px', height: '36px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '170px' }}>
                      <span style={{ fontSize: '1.8rem' }}>✅</span>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linked Templates</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>{linkedTemplates} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>({linkedPercentage}%)</span></div>
                      </div>
                    </div>
                    <div style={{ width: '1.5px', height: '36px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px' }}>
                      <span style={{ fontSize: '1.8rem' }}>⏳</span>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Need to Workout</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444' }}>{pendingTemplates}</div>
                      </div>
                    </div>
                    
                    {/* Completion progress bar */}
                    <div style={{ flex: 1, minWidth: '240px', marginLeft: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                        <span>Completion Progress</span>
                        <span style={{ color: '#4f46e5' }}>{linkedPercentage}%</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: `${linkedPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)', borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155', width: '130px' }}>Practice Mode</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155', width: '130px' }}>Template Added</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Template ID</th>
                        <th style={{ padding: '12px 16px', fontWeight: '800', color: '#334155' }}>Template Type</th>
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
                            {skill.isStatic ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#0369a1',
                                  backgroundColor: '#e0f2fe',
                                  display: 'inline-block',
                                  width: 'fit-content'
                                }}>
                                  Static
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                  {skill.questionCount} question{skill.questionCount === 1 ? '' : 's'}
                                </span>
                              </div>
                            ) : (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#6b21a8',
                                backgroundColor: '#f3e8ff',
                                display: 'inline-block',
                                width: 'fit-content'
                              }}>
                                Dynamic
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <SkillTemplateAddedToggle skillId={skill.id} initialAdded={skill.templateAdded} />
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0284c7' }}>
                            {skill.templateAdded && skill.templateId && skill.templateId !== '-' ? (
                              <Link
                                href={skill.generatorType === 'spreadsheet-grid'
                                  ? `/template-generator-grid?id=${skill.templateId}`
                                  : `/template-generator-v2?id=${skill.templateId}`}
                                target="_blank"
                                style={{ color: '#0284c7', textDecoration: 'underline', fontWeight: 'bold' }}
                                title="Click to open this template for editing"
                              >
                                {skill.templateId}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {skill.templateAdded ? (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#ffffff',
                                backgroundColor: skill.generatorType === 'spreadsheet-grid' ? '#8b5cf6' : '#3b82f6'
                              }}>
                                {skill.generatorType === 'spreadsheet-grid' ? 'Spreadsheet (Grid)' : 'Standard/Form'}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{skill.interactionType}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <SkillTestingStatusSelector skillId={skill.id} initialStatus={skill.status} templateAdded={skill.templateAdded} />
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
                                  href={practiceHrefV2(activeSubjectNode.id, topic.unitId || topic.id, skillId, gradeId)} 
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
