import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { ALL_TEMPLATES_BY_TOPIC } from '@/lib/practice/allTemplates';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || 'english';
    const grade = searchParams.get('grade') || 'ukg';

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    // 1. Fetch skills for the specified subject/grade from skills_v2
    const query = {};
    if (subject && subject !== 'all') {
      query.subject = subject.toLowerCase();
    }
    if (grade && grade !== 'all') {
      query.grade = grade.toLowerCase();
    }

    const skills = await db.collection("skills_v2").find(query).toArray();
    const templates = await db.collection("templates").find({}).toArray();
    const dynamicTemplates = await db.collection("dynamic_templates").find({}).toArray();

    // Aggregated question counts
    let questionCounts = {};
    try {
      const counts = await db.collection("questions").aggregate([
        { $group: { _id: "$skillId", count: { $sum: 1 } } }
      ]).toArray();
      counts.forEach(c => {
        if (c._id) questionCounts[c._id] = c.count;
      });
    } catch (e) {
      console.warn("Question counts aggregation warning:", e);
    }

    // 2. Match templates to skills
    const mappedSkills = [];
    let matchedCount = 0;

    for (const s of skills) {
      const skillId = String(s.id || '').trim();
      const skillTitleClean = String(s.title || s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Explicit IDs set on skill
      const explicitIds = new Set();
      const rawTpl = s.templateId || s.template_id || s.templateIds;
      if (Array.isArray(rawTpl)) {
        rawTpl.forEach(t => explicitIds.add(String(t).trim()));
      } else if (typeof rawTpl === 'string' && rawTpl.trim()) {
        rawTpl.split(',').forEach(t => explicitIds.add(t.trim()));
      }
      if (s.generatorId) explicitIds.add(String(s.generatorId).trim());
      if (s.spreadsheetId) explicitIds.add(String(s.spreadsheetId).trim());
      if (s.engine) explicitIds.add(String(s.engine).trim());

      let templateAdded = false;
      let templateId = "-";
      let interactionType = "-";
      let status = "Pending Template";

      // A. Parameterized templates
      const tMatch = templates.find(t => {
        const tid = String(t.id || t._id || '');
        return (
          (skillId && (t.skillId === skillId || t.config?.skillId === skillId || tid === skillId || tid === `tpl-${skillId}`)) ||
          (explicitIds.size > 0 && (explicitIds.has(tid) || explicitIds.has(t.skillId)))
        );
      });

      if (tMatch) {
        templateAdded = true;
        templateId = tMatch.id || String(tMatch._id);
        const rawInter = tMatch.config?.interaction || tMatch.interaction;
        interactionType = typeof rawInter === 'object' && rawInter !== null ? (rawInter.engine || rawInter.type) : (rawInter || tMatch.type || "parameterized");
        status = tMatch.status === "active" ? "Verified & Active" : "Draft / In Review";
      } else {
        // B. Dynamic / Spreadsheet templates
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
          templateAdded = true;
          templateId = dtMatch.id || String(dtMatch._id);
          const rawInter = dtMatch.interaction;
          interactionType = typeof rawInter === 'object' && rawInter !== null ? (rawInter.engine || rawInter.type) : (rawInter || dtMatch.type || "dynamic");
          status = dtMatch.status === "active" ? "Verified & Active" : "Draft / In Review";
        } else {
          // C. Code Generators in ALL_TEMPLATES_BY_TOPIC
          let codeMatch = null;
          for (const [topic, tList] of Object.entries(ALL_TEMPLATES_BY_TOPIC)) {
            const found = tList.find(ct => 
              (skillId && (ct.id === skillId || ct.id === `tpl-${skillId}` || ct.id.includes(skillId))) ||
              (explicitIds.size > 0 && (explicitIds.has(ct.id) || explicitIds.has(ct.engine)))
            );
            if (found) {
              codeMatch = found;
              break;
            }
          }

          if (codeMatch) {
            templateAdded = true;
            templateId = codeMatch.id;
            interactionType = codeMatch.questionType || codeMatch.engine || "code-generator";
            status = "Verified & Active";
          } else if (explicitIds.size > 0) {
            templateAdded = true;
            templateId = Array.from(explicitIds)[0];
            interactionType = s.engine || s.type || "linked";
            status = "Linked & Active";
          } else if (questionCounts[skillId] || s.isStatic) {
            templateAdded = true;
            templateId = `static-bank-${skillId}`;
            interactionType = "static_question_bank";
            status = "Static Questions Available";
          }
        }
      }

      if (templateAdded) matchedCount++;

      mappedSkills.push({
        id: s.id,
        code: s.code || "-",
        title: s.title || s.name || "-",
        unit: s.unitId || s.metadata?.unitId || "General",
        chapter: s.chapterId || s.metadata?.chapterId || "General",
        templateAdded: templateAdded,
        templateId: templateId,
        interactionType: interactionType,
        status: status
      });
    }

    // Sort logically by skill code
    mappedSkills.sort((a, b) => {
      if (a.code === "-" || b.code === "-") return 0;
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    });

    return NextResponse.json({
      success: true,
      subject,
      grade,
      coverage: {
        totalSkills: skills.length,
        matchedSkills: matchedCount,
        percentage: skills.length > 0 ? Math.round((matchedCount / skills.length) * 100) : 0
      },
      skills: mappedSkills
    });
  } catch (error) {
    console.error('Curriculum KPI API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
