import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { ALL_TEMPLATES_BY_TOPIC } from '@/lib/practice/allTemplates';

export async function POST(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const filterSubject = searchParams.get('subject');
    const filterGrade = searchParams.get('grade');

    // 1. Fetch skills from skills_v2
    const query = {};
    if (filterSubject && filterSubject !== 'all') {
      query.subject = filterSubject.toLowerCase();
    }
    if (filterGrade && filterGrade !== 'all') {
      query.grade = filterGrade.toLowerCase();
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

    let updatedCount = 0;
    let matchedCount = 0;

    for (const skill of skills) {
      const skillId = String(skill.id || '').trim();
      const skillTitleClean = String(skill.title || skill.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Collect explicit IDs already set on skill node
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

      let foundTemplateId = null;
      let foundEngine = null;
      let foundGeneratorType = null;
      let foundStatus = null;

      // A. Check MongoDB templates collection
      const tMatch = templates.find(t => {
        const tid = String(t.id || t._id || '');
        return (
          (skillId && (t.skillId === skillId || t.config?.skillId === skillId || tid === skillId || tid === `tpl-${skillId}`)) ||
          (explicitIds.size > 0 && (explicitIds.has(tid) || explicitIds.has(t.skillId)))
        );
      });

      if (tMatch) {
        foundTemplateId = tMatch.id || String(tMatch._id);
        const rawInter = tMatch.config?.interaction || tMatch.interaction;
        foundEngine = typeof rawInter === 'object' && rawInter !== null ? (rawInter.engine || rawInter.type) : (rawInter || tMatch.type);
        foundGeneratorType = tMatch.generatorType || tMatch.config?.generatorType || "parameterized";
        foundStatus = tMatch.status === "active" ? "active" : "draft";
      } else {
        // B. Check MongoDB dynamic_templates collection
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
          foundTemplateId = dtMatch.id || String(dtMatch._id);
          const rawInter = dtMatch.interaction;
          foundEngine = typeof rawInter === 'object' && rawInter !== null ? (rawInter.engine || rawInter.type) : (rawInter || dtMatch.type);
          foundGeneratorType = dtMatch.generatorType || dtMatch.config?.generatorType || dtMatch.optionsType || "spreadsheet-grid";
          foundStatus = dtMatch.status === "active" ? "active" : "draft";
        } else {
          // C. Check Code Generators in ALL_TEMPLATES_BY_TOPIC
          for (const [topic, tList] of Object.entries(ALL_TEMPLATES_BY_TOPIC)) {
            const codeMatch = tList.find(ct => 
              (skillId && (ct.id === skillId || ct.id === `tpl-${skillId}` || ct.id.includes(skillId))) ||
              (explicitIds.size > 0 && (explicitIds.has(ct.id) || explicitIds.has(ct.engine)))
            );
            if (codeMatch) {
              foundTemplateId = codeMatch.id;
              foundEngine = codeMatch.engine || codeMatch.questionType || "code-generator";
              foundGeneratorType = codeMatch.engine || "code-generator";
              foundStatus = "active";
              break;
            }
          }

          // D. Fall back to existing explicit IDs
          if (!foundTemplateId && explicitIds.size > 0) {
            foundTemplateId = Array.from(explicitIds)[0];
            foundEngine = skill.engine || skill.type || "linked";
            foundGeneratorType = skill.generatorId ? "generator" : (skill.spreadsheetId ? "spreadsheet" : "linked");
            foundStatus = "active";
          }

          // E. Check static question bank
          if (!foundTemplateId && (questionCounts[skillId] || skill.isStatic)) {
            foundTemplateId = `static-bank-${skillId}`;
            foundEngine = "static_question_bank";
            foundGeneratorType = "static_bank";
            foundStatus = "active";
          }
        }
      }

      if (foundTemplateId) {
        matchedCount++;
        // Update skill in database if needed
        const updateFields = { updatedAt: new Date() };
        let needsUpdate = false;

        if (skill.templateId !== foundTemplateId) {
          updateFields.templateId = foundTemplateId;
          needsUpdate = true;
        }
        if (foundEngine && skill.engine !== foundEngine) {
          updateFields.engine = foundEngine;
          needsUpdate = true;
        }
        if (foundGeneratorType && skill.generatorType !== foundGeneratorType) {
          updateFields.generatorType = foundGeneratorType;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await db.collection("skills_v2").updateOne(
            { _id: skill._id },
            { $set: updateFields }
          );
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalSkills: skills.length,
      matchedSkills: matchedCount,
      updatedSkills: updatedCount,
      message: `Successfully synchronized ${matchedCount}/${skills.length} skills (${updatedCount} database entries updated)`
    });
  } catch (error) {
    console.error('Error syncing skills templates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
