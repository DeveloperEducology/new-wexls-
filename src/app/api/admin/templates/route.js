import { NextResponse } from 'next/server';
import { TEMPLATES_CATALOG } from '../../../../lib/practice/templatesCatalog.js';
import {
  listAllDynamicTemplates,
  saveDynamicTemplate,
  deleteDynamicTemplate
} from '../../../../lib/practice/questionBank/dynamicTemplatesRepository.js';
import { listTemplates, createTemplate } from '../../../../lib/exam/template-store.js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');

    // 1. Fetch dynamic templates from MongoDB (dynamic_templates collection)
    const curriculumDynamic = await listAllDynamicTemplates();

    // 2. Fetch competitive exam templates from MongoDB (templates collection)
    const examTemplates = await listTemplates({
      examId: examId || undefined,
      section: searchParams.get('section') || undefined,
      type: searchParams.get('type') || undefined,
    });

    const mappedCurriculum = curriculumDynamic.map(t => ({
      ...t,
      title: t.title || t.name || t.templateInfo?.title || t.id,
      subject: t.subject || t.templateInfo?.subject || 'other',
      topic: t.topic || t.templateInfo?.topic || 'general',
      id: t.id || String(t._id)
    }));

    const mappedExamTemplates = examTemplates.map(t => {
      let config = t.config || {};
      if (config.config && (!config.variables || Array.isArray(config.variables))) {
        config = { ...config, ...config.config };
      }
      const { config: _, ...rest } = t;
      return {
        ...config,
        ...rest,
        title: t.name || t.title,
        subject: t.section || t.subject || 'other',
        id: String(t._id),
        _id: String(t._id)
      };
    });

    // 3. Combine both flat lists for dynamicTemplates
    const allDynamic = [
      ...mappedCurriculum,
      ...mappedExamTemplates
    ];

    // 4. Merge JNVST templates into static templates catalog
    const groupedExam = {};
    mappedExamTemplates.forEach(t => {
      const subj = t.section || 'other';
      const topicName = t.topic || 'general';
      if (!groupedExam[subj]) groupedExam[subj] = {};
      if (!groupedExam[subj][topicName]) groupedExam[subj][topicName] = [];
      groupedExam[subj][topicName].push(t);
    });

    const mergedTemplatesCatalog = {
      ...TEMPLATES_CATALOG,
      ...groupedExam
    };

    // If a specific exam is queried, return the flat exam templates list for templates key
    // to match what the questions list page expects.
    if (examId) {
      return NextResponse.json({
        success: true,
        templates: mappedExamTemplates,
        dynamicTemplates: mappedExamTemplates,
        groupedTemplates: groupedExam
      });
    }

    return NextResponse.json({
      success: true,
      templates: mergedTemplatesCatalog,
      dynamicTemplates: allDynamic,
      groupedTemplates: mergedTemplatesCatalog
    });
  } catch (err) {
    console.error('Templates API GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export function validateTemplateSchema(template) {
  if (!template || typeof template !== 'object') {
    return 'Template data is not a valid JSON object';
  }

  const id = template.id || template._id;
  if (!id) {
    return 'Template ID (id / _id) is required';
  }

  if (typeof id !== 'string') {
    return 'Template ID must be a string';
  }

  // Validate ID format (slug validation)
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    return 'Template ID must contain only letters, numbers, dashes, and underscores (no spaces or special characters)';
  }

  const title = template.title || template.name || template.config?.title || template.config?.name;
  if (!title) {
    return 'Template title/name is required';
  }

  const type = template.type || template.config?.type || 'parameterized';
  const config = template.config || template;
  const interaction = config.interaction || {};
  const interactionEngine = typeof interaction === 'object' ? interaction.engine : String(interaction);

  // If it's parameterized, do deep structural check
  if (type === 'parameterized') {
    let questionTemplate = config.questionTemplate || config.questionText;
    const hasParts = Array.isArray(config.parts) && config.parts.length > 0;
    if (!hasParts && (!questionTemplate || typeof questionTemplate !== 'string' || questionTemplate.trim() === '')) {
      const fallbackText = config.name || config.title || template.name || template.title || 'Question prompt';
      config.questionText = fallbackText;
      config.questionTemplate = fallbackText;
      if (template.config) {
        template.config.questionText = fallbackText;
        template.config.questionTemplate = fallbackText;
      }
      template.questionText = fallbackText;
      template.questionTemplate = fallbackText;
    }

    const variables = config.variables;
    if (variables !== undefined) {
      if (!Array.isArray(variables) && typeof variables !== 'object') {
        return 'Variables field must be an array or an object';
      }

      if (Array.isArray(variables)) {
        for (let i = 0; i < variables.length; i++) {
          const v = variables[i];
          if (!v || typeof v !== 'object') {
            return `Variable at index ${i} is not a valid object`;
          }
          if (!v.name) {
            return `Variable at index ${i} is missing the "name" field`;
          }
          if (v.type === 'expression' && !v.formula) {
            return `Variable "${v.name}" of type expression is missing the "formula" field`;
          }
        }
      }
    }

    const options = config.options || config.interaction?.options;
    if (options !== undefined) {
      if (!Array.isArray(options)) {
        return 'Options field must be a valid array';
      }

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (opt === undefined || opt === null) {
          return `Option at index ${i} is empty`;
        }
        const label = typeof opt === 'object' ? (opt.label ?? opt.text ?? opt.value ?? opt.content) : opt;
        if (label === undefined || label === null || String(label).trim() === '') {
          return `Option at index ${i} has an empty or missing label`;
        }
      }
    }

    // Interaction engine validation rules check
    const validationRules = config.validationRules || [];
    if (interactionEngine === 'msq' || config.optionsType === 'msq') {
      const allCorrectRule = Array.isArray(validationRules)
        ? validationRules.find(r => r && r.type === 'all_correct')
        : null;
      if (!allCorrectRule) {
        return 'MSQ templates require at least one validation rule of type "all_correct"';
      }
    }
  }

  return null; // Passes validation!
}

export async function POST(req) {
  try {
    const body = await req.json();
    const tData = body.template || body;

    if (!tData) {
      return NextResponse.json({ success: false, error: 'Template object is required' }, { status: 400 });
    }

    const validationError = validateTemplateSchema(tData);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    // If it has a competitive examId, save to templates collection
    if (tData.examId || tData.exam) {
      const name = tData.name || tData.title;
      const type = tData.type || 'parameterized';
      const examId = tData.examId || tData.exam;
      const section = tData.section || tData.subject;
      const topic = tData.topic;
      const difficulty = Number(tData.difficulty) || 0.5;

      if (!name || !type || !examId || !section || !topic) {
        return NextResponse.json({ success: false, error: 'Missing required fields for competitive template (name, type, examId, section, topic)' }, { status: 400 });
      }

      const { getMongoDb } = await import('../../../../lib/db/mongo.js');
      const db = await getMongoDb();
      if (!db) {
        return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
      }

      const { _id, id, createdAt, updatedAt, config: nestedConfig, ...configData } = tData;
      const config = {
        ...(typeof nestedConfig === 'object' && nestedConfig !== null ? nestedConfig : configData),
        examId,
        section,
        topic,
        difficulty
      };

      const { ObjectId } = await import('mongodb');
      let templateId = tData._id || tData.id;
      let isUpdate = false;
      let finalId = null;

      if (templateId) {
        let queryId;
        try {
          queryId = new ObjectId(templateId);
        } catch {
          queryId = templateId;
        }

        const existing = await db.collection('templates').findOne({ _id: queryId });
        if (existing) {
          isUpdate = true;
          finalId = String(existing._id);
          await db.collection('templates').updateOne(
            { _id: queryId },
            {
              $set: {
                name,
                type,
                examId,
                section,
                topic,
                difficulty,
                config,
                updatedAt: new Date()
              }
            }
          );
        }
      }

      if (!isUpdate) {
        const doc = {
          ...(templateId ? { _id: templateId } : {}),
          name,
          type,
          examId,
          section,
          topic,
          difficulty,
          config,
          generatedCount: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const insertRes = await db.collection('templates').insertOne(doc);
        finalId = String(insertRes.insertedId);
      }

      // Automatic exam topic registration
      try {
        const examDoc = await db.collection('exams').findOne({ _id: examId });
        if (examDoc) {
          let updated = false;
          const updatedSections = examDoc.sections.map(s => {
            if (s.id === section) {
              if (!s.topics.includes(topic)) {
                s.topics.push(topic);
                updated = true;
              }
            }
            return s;
          });
          if (updated) {
            await db.collection('exams').updateOne(
              { _id: examId },
              { $set: { sections: updatedSections, updatedAt: new Date() } }
            );
            console.log(`Auto-registered new ${examId} topic "${topic}" under section "${section}"`);
          }
        }
      } catch (examErr) {
        console.error(`Failed to auto-register ${examId} topic in exams collection:`, examErr);
      }

      // Link to original question if provided
      const linkId = body.linkToQuestionId || tData.linkToQuestionId;
      if (linkId) {
        let questionQuery;
        try {
          questionQuery = { _id: new ObjectId(linkId) };
        } catch {
          questionQuery = { _id: linkId };
        }
        await db.collection('questions').updateOne(
          questionQuery,
          { $set: { drillTemplateId: finalId } }
        );
        console.log(`Successfully linked template ${finalId} to question ${linkId}`);
      }

      return NextResponse.json({
        success: true,
        id: finalId,
        result: {
          id: finalId,
          mode: isUpdate ? 'update' : 'insert'
        }
      });
    } else {
      // General curriculum dynamic template
      if (!tData.id) {
        return NextResponse.json({ success: false, error: 'Template ID is required for curriculum template' }, { status: 400 });
      }
      const result = await saveDynamicTemplate(tData);
      return NextResponse.json({ success: true, result });
    }
  } catch (err) {
    console.error('Templates API POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const isExam = searchParams.get('exam') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template id query parameter is required.' }, { status: 400 });
    }
    if (isExam) {
      const { ObjectId } = await import('mongodb');
      const { getMongoDb } = await import('../../../../lib/db/mongo.js');
      const db = await getMongoDb();
      let res;
      try {
        res = await db.collection('templates').deleteOne({ _id: new ObjectId(id) });
      } catch {
        res = await db.collection('templates').deleteOne({ _id: id });
      }
      return NextResponse.json({ success: true, result: res });
    } else {
      const result = await deleteDynamicTemplate(id);
      return NextResponse.json({ success: true, result });
    }
  } catch (err) {
    console.error('Templates API DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/templates — update an existing template's config by id
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, updates, isExam } = body;

    if (!id || !updates) {
      return NextResponse.json({ success: false, error: 'id and updates are required.' }, { status: 400 });
    }

    if (isExam !== false) {
      // Update competitive exam template in 'templates' collection
      const { updateTemplate } = await import('../../../../lib/exam/template-store.js');
      await updateTemplate(id, updates);
      return NextResponse.json({ success: true, message: `Template ${id} updated.` });
    } else {
      // Update curriculum template in 'dynamic_templates' collection
      const { getMongoDb } = await import('../../../../lib/db/mongo.js');
      const { ObjectId } = await import('mongodb');
      const db = await getMongoDb();
      let res;
      try {
        res = await db.collection('dynamic_templates').updateOne(
          { _id: new ObjectId(id) },
          { $set: { ...updates, updatedAt: new Date() } }
        );
      } catch {
        res = await db.collection('dynamic_templates').updateOne(
          { _id: id },
          { $set: { ...updates, updatedAt: new Date() } }
        );
      }
      return NextResponse.json({ success: true, result: res });
    }
  } catch (err) {
    console.error('Templates API PATCH error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

