import { getMongoDb } from '../db/mongo.js';
import { instantiateParameterized } from './template-engine.js';
import { instantiateSvgTemplate, isSvgTemplate } from './svg-template-engine.js';
import { instantiateVisualTransformationTemplate } from './visual-transformation-engine.js';
import { evaluateTemplate } from '../practice/generators/universalEvaluator.js';

const GENERATE_COUNT = 30;

/**
 * question document shape:
 * {
 *   _id, examId, section, topic, subTopic?,
 *   difficulty: 0.0–1.0,
 *   cognitiveLevel: 'recall'|'comprehension'|'application'|'analytical',
 *   questionText, questionImageUrl?,
 *   options: { A, B, C, D },
 *   correctOption: 'A'|'B'|'C'|'D',
 *   explanationText, explanationMath?,
 *   isPYQ: bool, pyqYear?,
 *   templateId?, templateVariables?,
 *   metadata: {
 *     source: string,
 *     exam: string[],
 *     isBilingual: bool,
 *     language: string
 *   },
 *   tags: [],
 *   status: 'active'|'draft'|'rejected',
 *   createdAt, updatedAt,
 * }
 */

export async function insertQuestion(q) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  const doc = {
    ...q,
    status: q.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('questions').insertOne(doc);
  return result.insertedId;
}

export async function insertQuestions(questions) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  if (!questions || questions.length === 0) return [];

  const ops = questions.map(q => ({
    updateOne: {
      filter: { _id: q._id || q.id },
      update: {
        $set: {
          ...q,
          status: q.status || 'active',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      upsert: true
    }
  }));

  const result = await db.collection('questions').bulkWrite(ops);
  return result;
}

export async function getQuestion(id) {
  const db = await getMongoDb();
  if (!db) return null;
  const { ObjectId } = await import('mongodb');
  let query = {};
  try {
    query = { _id: new ObjectId(id) };
  } catch (err) {
    query = { $or: [{ _id: id }, { id: id }] };
  }
  let q = await db.collection('questions').findOne(query);
  if (q) return q;

  // Dynamic on-the-fly evaluation fallback for un-inserted template questions (Free Tier / On-The-Fly Mode)
  if (typeof id === 'string' && id.includes('_')) {
    const parts = id.split('_');
    if (parts.length >= 3) {
      const seed = parseInt(parts[parts.length - 2], 10);
      const templateId = parts.slice(0, parts.length - 2).join('_');

      if (!isNaN(seed) && templateId) {
        let tpl = await db.collection('templates').findOne({ $or: [{ id: templateId }, { _id: templateId }] });
        if (tpl || dynTpl) {
          const tplTime = tpl ? new Date(tpl.updatedAt || tpl.createdAt || 0).getTime() : 0;
          const dynTime = dynTpl ? new Date(dynTpl.updatedAt || dynTpl.createdAt || 0).getTime() : 0;
          const chosen = (dynTime > tplTime) ? dynTpl : (tpl || dynTpl);
          const evalQ = evaluateTemplate(chosen, seed);
          if (evalQ) {
            let optionsDict = {};
            let correctKey = 'A';
            if (Array.isArray(evalQ.options)) {
              const letters = ['A', 'B', 'C', 'D'];
              evalQ.options.forEach((opt, idx) => {
                const letter = letters[idx] || `OPT_${idx + 1}`;
                const label = typeof opt === 'object' ? (opt.label || opt.content || '') : String(opt);
                optionsDict[letter] = label;
                if (opt.isCorrect || label === evalQ.answer || letter === evalQ.answer) {
                  correctKey = letter;
                }
              });
            } else if (typeof evalQ.options === 'object' && evalQ.options !== null) {
              optionsDict = evalQ.options;
              correctKey = typeof evalQ.answer === 'string' && evalQ.answer.length === 1 ? evalQ.answer : (evalQ.correctOption || 'A');
            }

            return {
              _id: id,
              templateId,
              questionText: evalQ.questionText || merged.name || merged.id || 'Practice Drill',
              parts: evalQ.parts || [{ type: 'text', content: evalQ.questionText || '' }],
              options: optionsDict,
              optionsType: evalQ.optionsType || merged.optionsType || 'mcq',
              interaction: evalQ.interaction || merged.interaction || 'mcq',
              type: evalQ.type || merged.type || 'mcq',
              answer: correctKey,
              correctOption: correctKey,
              explanationText: typeof evalQ.explanation === 'object' ? (evalQ.explanation?.sections?.[0]?.content || '') : (evalQ.explanation || ''),
              generatorType: 'spreadsheet-grid'
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Fetch candidate questions for adaptive selection.
 * Returns questions near `theta` difficulty, excluding already-used IDs.
 */
export async function generateFromTemplates({ examId, section, topic, templateId = null }) {
  const db = await getMongoDb();
  if (!db) return [];

  let templateIds = null;
  let objectIds = [];
  if (templateId) {
    if (typeof templateId === 'string' && templateId.includes(',')) {
      templateIds = templateId.split(',').map(s => s.trim());
    } else if (Array.isArray(templateId)) {
      templateIds = templateId;
    } else {
      templateIds = [templateId];
    }
    const { ObjectId } = await import('mongodb');
    for (const id of templateIds) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {}
    }
  }

  // Find matching templates (supporting parameterized, svg-figure, visual-transformation, and spreadsheet-grid)
  const filter = {
    examId,
    status: { $ne: 'inactive' },
    ...(!templateIds ? { section } : {}),
    ...(!templateIds && topic ? { topic } : {}),
    ...(templateIds ? {
      $or: [
        { id: { $in: templateIds } },
        { _id: { $in: templateIds } },
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : [])
      ]
    } : {})
  };

  let templates = await db.collection('templates').find(filter).limit(10).toArray();
  if (templateIds) {
    const dynFilter = {
      $or: [
        { id: { $in: templateIds } },
        { _id: { $in: templateIds } },
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : [])
      ]
    };
    const dynTemplates = await db.collection('dynamic_templates').find(dynFilter).limit(10).toArray();
    for (const dynTpl of dynTemplates) {
      const existingIdx = templates.findIndex(t => (t.id || String(t._id)) === (dynTpl.id || String(dynTpl._id)));
      if (existingIdx !== -1) {
        const existingTpl = templates[existingIdx];
        const tplTime = new Date(existingTpl.updatedAt || existingTpl.createdAt || 0).getTime();
        const dynTime = new Date(dynTpl.updatedAt || dynTpl.createdAt || 0).getTime();
        if (dynTime > tplTime) {
          templates[existingIdx] = dynTpl;
        }
      } else {
        templates.push(dynTpl);
      }
    }
  }

  if (templates.length === 0 && topic && !templateId) {
    const allSection = await db.collection('templates').find({
      examId, section,
      status: { $ne: 'inactive' }
    }).limit(10).toArray();
    templates.push(...allSection);
  }

  const allGenerated = [];
  for (const tpl of templates) {
    try {
      const isSpreadsheetGrid = tpl.generatorType === 'spreadsheet-grid' || 
                                tpl.type === 'spreadsheet-grid' || 
                                tpl.config?.type === 'spreadsheet-grid' || 
                                tpl.config?.generatorType === 'spreadsheet-grid' ||
                                (tpl.variables && (Array.isArray(tpl.parts) || Array.isArray(tpl.options))) ||
                                (Array.isArray(tpl.rows) && tpl.rows.length > 0);

      if (isSpreadsheetGrid) {
        for (let i = 0; i < GENERATE_COUNT; i++) {
          const seed = Math.floor(Math.random() * 1000000);
          let evalQ = null;
          try {
            evalQ = evaluateTemplate(tpl, seed);
          } catch (e) {
            console.warn(`[evaluateTemplate] Error for ${tpl.id || tpl._id}:`, e.message);
          }

          const hasValidOptions = evalQ && evalQ.options && (Array.isArray(evalQ.options) ? evalQ.options.length > 0 : Object.keys(evalQ.options).length > 0);

          if (hasValidOptions) {
            let optionsDict = {};
            let correctKey = 'A';
            if (Array.isArray(evalQ.options)) {
              const letters = ['A', 'B', 'C', 'D'];
              evalQ.options.forEach((opt, idx) => {
                const letter = letters[idx] || `OPT_${idx + 1}`;
                const label = typeof opt === 'object' ? (opt.label || opt.content || '') : String(opt);
                optionsDict[letter] = label;
                if (opt.isCorrect || label === evalQ.answer || letter === evalQ.answer) {
                  correctKey = letter;
                }
              });
            } else if (typeof evalQ.options === 'object' && evalQ.options !== null) {
              optionsDict = evalQ.options;
              correctKey = typeof evalQ.answer === 'string' && evalQ.answer.length === 1 ? evalQ.answer : (evalQ.correctOption || 'A');
            }

            allGenerated.push({
              _id: `${tpl.id || tpl._id}_${seed}_${i}`,
              templateId: tpl.id || String(tpl._id),
              examId: tpl.examId || examId,
              section: tpl.section || section,
              topic: tpl.topic || topic || 'general',
              difficulty: tpl.bFactor !== undefined ? Math.min(1, Math.max(0, (tpl.bFactor + 3) / 6)) : 0.5,
              bFactor: tpl.bFactor !== undefined ? tpl.bFactor : 0.0,
              questionText: evalQ.questionText || tpl.name || tpl.id || 'Practice Drill',
              parts: evalQ.parts || [{ type: 'text', content: evalQ.questionText || '' }],
              options: optionsDict,
              optionsType: evalQ.optionsType || tpl.optionsType || 'mcq',
              interaction: evalQ.interaction || tpl.interaction || 'mcq',
              type: evalQ.type || tpl.type || 'mcq',
              answer: correctKey,
              correctOption: correctKey,
              explanationText: typeof evalQ.explanation === 'object' ? (evalQ.explanation?.sections?.[0]?.content || '') : (evalQ.explanation || ''),
              generatorType: 'spreadsheet-grid'
            });
          }
        }
      } else if (tpl.type === 'visual-transformation') {
        const questions = instantiateVisualTransformationTemplate(tpl, GENERATE_COUNT);
        allGenerated.push(...questions);
      } else if (isSvgTemplate(tpl)) {
        const questions = instantiateSvgTemplate(tpl, GENERATE_COUNT);
        allGenerated.push(...questions);
      } else {
        let config = tpl.config || {};
        if (config.config && (!config.variables || Array.isArray(config.variables))) {
          config = { ...config, ...config.config };
        }
        if (!config.variables || Array.isArray(config.variables) || !config.derivations) continue;
        const normalizedTpl = { ...tpl, config };
        const questions = instantiateParameterized(normalizedTpl, GENERATE_COUNT);
        allGenerated.push(...questions);
      }
    } catch (e) {
      console.warn(`[generateFromTemplates] Failed to instantiate template ${tpl._id}:`, e.message);
    }
  }

  return allGenerated;
}

/**
 * Fetch candidate questions for adaptive selection.
 * Returns questions near `theta` difficulty, excluding already-used IDs.
 */
export async function getAdaptiveCandidates({ examId, section, topic = null, templateId = null, theta, usedIds = [], limit = 20 }) {
  const db = await getMongoDb();
  if (!db) return [];
  const { ObjectId } = await import('mongodb');

  const usedObjectIds = usedIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean);

  const window = 0.2;
  const low = Math.max(0, theta - window);
  const high = Math.min(1, theta + window);

  let templateFilter = null;
  if (templateId) {
    if (Array.isArray(templateId)) {
      templateFilter = { $in: templateId };
    } else if (typeof templateId === 'string') {
      if (templateId.includes(',')) {
        templateFilter = { $in: templateId.split(',').map(s => s.trim()) };
      } else {
        templateFilter = templateId;
      }
    }
  }

  const filter = {
    ...(templateFilter ? { templateId: templateFilter } : { examId, section }),
    status: 'active',
    difficulty: { $gte: low, $lte: high },
    ...(topic && !templateFilter ? { topic } : {}),
    ...(usedObjectIds.length ? { _id: { $nin: usedObjectIds } } : {}),
  };

  let questions = await db.collection('questions').find(filter).limit(limit).toArray();

  // Fallback: widen search window if not enough candidates
  if (questions.length < 1) {
    const fallbackFilter = {
      ...(templateFilter ? { templateId: templateFilter } : { examId, section }),
      status: 'active',
      ...(topic && !templateFilter ? { topic } : {}),
      ...(usedObjectIds.length ? { _id: { $nin: usedObjectIds } } : {}),
    };
    questions = await db.collection('questions').find(fallbackFilter).sort({ difficulty: 1 }).limit(limit).toArray();
  }

  // Resolve replacements for any candidate that has drillTemplateId
  const resolvedQuestions = [];
  for (const q of questions) {
    if (q.drillTemplateId) {
      const dynamicFilter = {
        examId,
        templateId: q.drillTemplateId,
        status: 'active',
        ...(usedObjectIds.length ? { _id: { $nin: usedObjectIds } } : {}),
      };
      let dynamicCandidates = await db.collection('questions').find(dynamicFilter).toArray();

      if (dynamicCandidates.length < 5) {
        try {
          const generated = await generateFromTemplates({
            examId,
            section: q.section,
            topic: q.topic,
            templateId: q.drillTemplateId
          });
          if (generated.length > 0) {
            await insertQuestions(generated);
            dynamicCandidates = await db.collection('questions').find(dynamicFilter).toArray();
          }
        } catch (e) {
          console.warn(`[getAdaptiveCandidates] Failed to auto-generate for template ${q.drillTemplateId}:`, e);
        }
      }

      if (dynamicCandidates.length > 0) {
        const randIndex = Math.floor(Math.random() * dynamicCandidates.length);
        const replacement = dynamicCandidates[randIndex];
        resolvedQuestions.push(replacement);
        usedObjectIds.push(replacement._id);
        continue;
      }
    }
    resolvedQuestions.push(q);
  }

  return resolvedQuestions;
}

export async function listQuestions({ examId, section, topic, status, isPYQ, limit = 50, skip = 0 } = {}) {
  const db = await getMongoDb();
  if (!db) return [];
  const filter = {};
  if (examId) filter.examId = examId;
  if (section) filter.section = section;
  if (topic) filter.topic = topic;
  if (status) filter.status = status;
  if (isPYQ !== undefined) filter.isPYQ = isPYQ;
  return db.collection('questions').find(filter).skip(skip).limit(limit).toArray();
}

export async function countQuestions({ examId, section } = {}) {
  const db = await getMongoDb();
  if (!db) return 0;
  const filter = { status: 'active' };
  if (examId) filter.examId = examId;
  if (section) filter.section = section;
  return db.collection('questions').countDocuments(filter);
}

export async function updateQuestionStatus(id, status) {
  const db = await getMongoDb();
  if (!db) return;
  const { ObjectId } = await import('mongodb');
  let query = {};
  try {
    query = { _id: new ObjectId(id) };
  } catch (err) {
    query = { $or: [{ _id: id }, { id: id }] };
  }
  await db.collection('questions').updateOne(
    query,
    { $set: { status, updatedAt: new Date() } }
  );
}

export async function updateQuestion(id, updates) {
  const db = await getMongoDb();
  if (!db) return;
  const { ObjectId } = await import('mongodb');
  let query = {};
  try {
    query = { _id: new ObjectId(id) };
  } catch (err) {
    query = { $or: [{ _id: id }, { id: id }] };
  }
  await db.collection('questions').updateOne(
    query,
    { $set: { ...updates, updatedAt: new Date() } }
  );
}
