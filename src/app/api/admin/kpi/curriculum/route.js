import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';

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
    const skills = await db.collection("skills_v2")
      .find({ 
        subject: subject.toLowerCase(), 
        grade: grade.toLowerCase() 
      })
      .toArray();

    // 2. Fetch all parameterized and dynamic templates
    const templates = await db.collection("templates").find({}).toArray();
    const dynamicTemplates = await db.collection("dynamic_templates").find({}).toArray();

    // 3. Match templates to skills
    const mappedSkills = [];
    let matchedCount = 0;

    for (const s of skills) {
      let matchedTemplate = null;
      let templateId = "";
      let interactionType = "-";
      let status = "Pending Template";

      // A. Try parameterized templates match
      const tMatch = templates.find(t => 
        t.skillId === s.id || 
        t.config?.skillId === s.id || 
        t.id === s.id ||
        t.id === `tpl-${s.id}`
      );

      if (tMatch) {
        matchedTemplate = tMatch;
        templateId = tMatch.id || String(tMatch._id);
        
        const rawInteraction = tMatch.config?.interaction;
        interactionType = typeof rawInteraction === 'object' && rawInteraction !== null
          ? (rawInteraction.engine || JSON.stringify(rawInteraction))
          : (rawInteraction || tMatch.type || "parameterized");
          
        status = tMatch.status === "active" ? "Verified & Active" : "Draft / In Review";
      } else {
        // B. Try dynamic templates match
        const dtMatch = dynamicTemplates.find(dt => 
          dt.skillId === s.id || 
          dt.id === s.id ||
          dt.id === `ukg-english-${s.id}` ||
          dt.id.includes(s.id) ||
          (dt.title && dt.title.toLowerCase().replace(/[^a-z0-9]/g, '') === s.title.toLowerCase().replace(/[^a-z0-9]/g, ''))
        );

        if (dtMatch) {
          matchedTemplate = dtMatch;
          templateId = dtMatch.id || String(dtMatch._id);
          
          const rawInteraction = dtMatch.interaction;
          interactionType = typeof rawInteraction === 'object' && rawInteraction !== null
            ? (rawInteraction.engine || JSON.stringify(rawInteraction))
            : (rawInteraction || dtMatch.type || "dynamic");
            
          status = dtMatch.status === "active" ? "Verified & Active" : "Draft / In Review";
        }
      }

      if (matchedTemplate !== null) {
        matchedCount++;
      }

      mappedSkills.push({
        id: s.id,
        code: s.code || "-",
        title: s.title || s.name || "-",
        unit: s.unitId || s.metadata?.unitId || "General",
        chapter: s.chapterId || s.metadata?.chapterId || "General",
        templateAdded: matchedTemplate !== null,
        templateId: templateId || "-",
        interactionType: interactionType || "-",
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
