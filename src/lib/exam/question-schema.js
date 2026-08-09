/**
 * question-schema.js — Canonical Question Schema v2
 *
 * Provides:
 *   QUESTION_MODES  — enum of all valid question interaction modes
 *   resolveMode(raw) — normalize any mode string/alias to canonical value
 *   normalizeOptions(raw, correctOption, answer) — always returns {A,B,C,D} dict
 *   normalizeQuestion(doc)  — run on READ: converts any legacy shape to canonical v2
 *   buildQuestion(payload)  — run on WRITE: enforces canonical fields before saving
 *   isAnswerCorrect(q, ans) — unified grading for all question modes
 */

// ---------------------------------------------------------------------------
// 1. QUESTION_MODES enum
// ---------------------------------------------------------------------------
export const QUESTION_MODES = {
  MCQ:               'mcq',
  MSQ:               'msq',
  TAP_TO_FILL:       'tap_to_fill',
  FILL_BLANK:        'fill_blank',
  CATEGORIZATION_V2: 'categorizationv2',
  SENTENCE_ORDERING: 'sentence_ordering',
  TOKEN_SELECT:      'token_select',
  VISUAL_CHOICE:     'visual_choice',
  HOTSPOT:           'hotspot',
  DYNAMIC_POOL:      'dynamic_pool',
};

const MODE_ALIAS = {
  multiplechoice:   'mcq', multipleChoice: 'mcq', multiple_choice: 'mcq',
  picture_mcq:      'mcq', audio_mcq: 'mcq', choice: 'mcq', option_select: 'mcq',
  categorisationv2: 'categorizationv2', categorization: 'categorizationv2',
  copy_drag_drop:   'categorizationv2', drag_drop: 'categorizationv2', sorting: 'categorizationv2',
  fillInTheBlank:   'fill_blank', fillintheblank: 'fill_blank', fill_in_the_blank: 'fill_blank',
  number_input:     'fill_blank', text_input: 'fill_blank',
  multi_select:     'msq',
  sequence:         'sentence_ordering',
  mcq_hotspot:      'hotspot', hotspot_canvas: 'hotspot', hotspot_box: 'hotspot',
};

export function resolveMode(raw) {
  if (!raw) return 'mcq';
  const key = String(raw).trim();
  const allModes = Object.values(QUESTION_MODES);
  return MODE_ALIAS[key] || (allModes.includes(key) ? key : 'mcq');
}

// ---------------------------------------------------------------------------
// 2. OPTIONS NORMALIZER — always produces { A: string, B: string, ... }
// ---------------------------------------------------------------------------
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function normalizeOptions(rawOptions, existingCorrectOption, existingAnswer, vars = null) {
  let options = {};
  let correctOption = existingCorrectOption || null;

  if (!rawOptions) return { options, correctOption: correctOption || 'A' };

  const evalLabel = (lbl) => {
    const s = String(lbl ?? '');
    return vars ? resolveLabelOrExpression(s, vars) : s;
  };

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((opt, idx) => {
      const letter = LETTERS[idx] || `OPT_${idx + 1}`;
      const text = typeof opt === 'object'
        ? String(opt.label ?? opt.text ?? opt.content ?? opt.value ?? '')
        : String(opt ?? '');
      options[letter] = evalLabel(text);
      if (!correctOption && typeof opt === 'object' && opt.isCorrect) {
        correctOption = letter;
      }
    });
    if (!correctOption) {
      const idx = typeof existingAnswer === 'number' ? existingAnswer : parseInt(existingAnswer, 10);
      if (!isNaN(idx) && LETTERS[idx]) correctOption = LETTERS[idx];
    }
    if (!correctOption && typeof existingAnswer === 'string' && LETTERS.includes(existingAnswer.toUpperCase())) {
      correctOption = existingAnswer.toUpperCase();
    }
  } else if (typeof rawOptions === 'object') {
    Object.entries(rawOptions).forEach(([key, val], idx) => {
      const letter = LETTERS.includes(key.toUpperCase()) ? key.toUpperCase() : (LETTERS[idx] || key);
      const text = typeof val === 'object'
        ? String(val?.label ?? val?.text ?? val?.content ?? '')
        : String(val ?? '');
      options[letter] = evalLabel(text);
    });
    if (!correctOption) {
      if (typeof existingAnswer === 'string' && LETTERS.includes(existingAnswer.toUpperCase())) {
        correctOption = existingAnswer.toUpperCase();
      } else if (typeof existingAnswer === 'number' && LETTERS[existingAnswer]) {
        correctOption = LETTERS[existingAnswer];
      }
    }
  }

  return { options, correctOption: correctOption || 'A' };
}

// ---------------------------------------------------------------------------
// 3. normalizeQuestion — READ LAYER (idempotent, backward-compatible)
// ---------------------------------------------------------------------------
export function normalizeQuestion(doc) {
  if (!doc) return doc;

  const vars = doc.schema?.variables || doc.variables || doc.metadata?.variables || null;

  const rawMode =
    doc.questionMode ||
    doc.metadata?.questionMode ||
    doc.optionsType ||
    doc.type ||
    (typeof doc.interaction === 'string' ? doc.interaction : doc.interaction?.engine) ||
    'mcq';
  const questionMode = resolveMode(rawMode);

  const { options, correctOption } = normalizeOptions(
    doc.options,
    doc.correctOption || null,
    doc.answer ?? doc.correctAnswerIndex ?? null,
    vars
  );

  const correctOptions = doc.correctOptions ||
    (questionMode === 'msq' && correctOption ? [correctOption] : undefined);

  let correctAnswer =
    doc.correctAnswer || doc.answerKey ||
    (questionMode === 'categorizationv2' && doc.answer && typeof doc.answer === 'object' ? doc.answer : undefined);

  if (typeof correctAnswer === 'string' && vars) {
    correctAnswer = resolveLabelOrExpression(correctAnswer, vars);
  }

  let parts = doc.parts;
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    const text = doc.questionText || '';
    parts = text ? [{ type: 'text', content: text }] : [];
  }

  const questionText = (typeof doc.questionText === 'string' && doc.questionText.trim())
    ? doc.questionText
    : (doc.questionTemplate || doc.title || doc.name || doc.prompt || parts[0]?.content || '');

  let explanationText = doc.explanationText ||
    (typeof doc.explanation === 'string' ? doc.explanation : doc.explanation?.sections?.[0]?.content) || null;

  if (explanationText && vars) {
    explanationText = resolveLabelOrExpression(explanationText, vars);
  }

  const isTemplateDoc = Boolean(
    doc.metadata?.templateId ||
    doc.templateId ||
    doc.drillTemplateId ||
    doc.generatorType === 'spreadsheet-grid' ||
    doc.schema?.generatorType === 'spreadsheet-grid'
  );

  const finalMetadata = {
    ...(doc.metadata || {}),
    ...(isTemplateDoc ? { isStatic: false } : {})
  };

  return {
    _id: doc._id,
    id:  doc.id || String(doc._id || ''),
    schemaVersion: 2,

    examId:   doc.examId   || null,
    subject:  doc.subject  || null,
    topic:    doc.topic    || null,
    subTopic: doc.subTopic || null,
    section:  doc.section  || null,
    skillId:  doc.skillId  || null,
    grade:    doc.grade    || null,
    tags:     Array.isArray(doc.tags) ? doc.tags : [],

    questionText,
    parts,
    questionImageUrl:  doc.questionImageUrl || doc.questionImage || doc.imageUrl || null,
    questionImageCrop: doc.questionImageCrop || null,
    audioUrl:          doc.audioUrl || null,
    voice:             doc.voice    || null,

    questionMode,

    options,
    optionsImages:      doc.optionsImages      || {},
    optionsImagesCrops: doc.optionsImagesCrops || {},

    correctOption,
    ...(correctOptions ? { correctOptions } : {}),
    ...(correctAnswer  ? { correctAnswer  } : {}),
    ...(doc.categories ? { categories: doc.categories } : {}),
    ...(doc.items      ? { items:       doc.items      } : {}),

    explanationText: explanationText || null,
    explanationMath: doc.explanationMath || null,

    difficulty:      typeof doc.difficulty === 'number' ? doc.difficulty : 0.5,
    bFactor:         doc.bFactor        ?? null,
    cognitiveLevel:  doc.cognitiveLevel || null,
    isPYQ:           Boolean(doc.isPYQ),
    pyqYear:         doc.pyqYear        || null,
    metadata:        finalMetadata,
    metaConfig:      doc.metaConfig     || null,
    generatorType:   doc.generatorType  || null,
    templateId:      doc.templateId     || null,
    drillTemplateId: doc.drillTemplateId || null,

    status:    doc.status    || 'active',
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

// ---------------------------------------------------------------------------
// 4. buildQuestion — WRITE LAYER
// ---------------------------------------------------------------------------
export function buildQuestion(payload) {
  const rawMode =
    payload.questionMode ||
    payload.metadata?.questionMode ||
    payload.optionsType ||
    payload.type ||
    (typeof payload.interaction === 'string' ? payload.interaction : payload.interaction?.engine) ||
    'mcq';
  const questionMode = resolveMode(rawMode);

  const { options, correctOption } = normalizeOptions(
    payload.options,
    payload.correctOption || null,
    payload.answer ?? payload.correctAnswerIndex ?? null
  );

  let parts = payload.parts;
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    const text = payload.questionText || '';
    parts = text ? [{ type: 'text', content: text }] : [];
  }

  const catExtras = {};
  if (questionMode === 'categorizationv2') {
    if (payload.categories)    catExtras.categories    = payload.categories;
    if (payload.items)         catExtras.items         = payload.items;
    if (payload.correctAnswer) catExtras.correctAnswer = payload.correctAnswer;
    if (payload.answerKey)     catExtras.answerKey     = payload.answerKey;
  }

  const metaClean = payload.metadata ? { ...payload.metadata } : null;
  if (metaClean) delete metaClean.questionMode;

  const doc = {
    schemaVersion: 2,
    ...(payload._id && { _id: payload._id }),
    ...(payload.id  && { id:  payload.id  }),
    ...(payload.examId      && { examId:      payload.examId      }),
    ...(payload.subject     && { subject:     payload.subject     }),
    ...(payload.topic       && { topic:       payload.topic       }),
    ...(payload.subTopic    && { subTopic:    payload.subTopic    }),
    ...(payload.section     && { section:     payload.section     }),
    ...(payload.skillId     && { skillId:     payload.skillId     }),
    ...(payload.grade       && { grade:       payload.grade       }),
    tags: Array.isArray(payload.tags) ? payload.tags
      : (typeof payload.tags === 'string' ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : []),

    questionText:      payload.questionText || '',
    parts,
    questionImageUrl:  payload.questionImageUrl || payload.questionImage || payload.imageUrl || null,
    questionImageCrop: payload.questionImageCrop  || null,
    audioUrl:          payload.audioUrl || null,
    voice:             payload.voice    || null,

    questionMode,
    options,
    optionsImages:      payload.optionsImages      || {},
    optionsImagesCrops: payload.optionsImagesCrops || {},

    correctOption,
    ...(payload.correctOptions ? { correctOptions: payload.correctOptions } : {}),
    ...catExtras,

    explanationText: payload.explanationText || null,
    explanationMath: payload.explanationMath || null,

    difficulty:     typeof payload.difficulty === 'number' ? payload.difficulty : (parseFloat(payload.difficulty) || 0.5),
    cognitiveLevel: payload.cognitiveLevel || null,
    isPYQ:          Boolean(payload.isPYQ),
    pyqYear:        payload.pyqYear ? Number(payload.pyqYear) : null,

    ...(metaClean && Object.keys(metaClean).length ? { metadata: metaClean } : {}),
    ...(payload.metaConfig     && { metaConfig:      payload.metaConfig      }),
    ...(payload.generatorType  && { generatorType:   payload.generatorType   }),
    ...(payload.templateId     && { templateId:      payload.templateId      }),
    ...(payload.drillTemplateId && { drillTemplateId: payload.drillTemplateId }),

    status:    payload.status || 'active',
    updatedAt: new Date(),
  };

  return doc;
}

// ---------------------------------------------------------------------------
// 5. isAnswerCorrect — unified grading for all modes
// ---------------------------------------------------------------------------
export function isAnswerCorrect(question, userAnswer) {
  if (userAnswer === null || userAnswer === undefined) return false;

  const mode = question.questionMode || 'mcq';

  switch (mode) {
    case 'msq': {
      const correct = new Set(question.correctOptions || [question.correctOption].filter(Boolean));
      const given   = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
      if (correct.size !== given.size) return false;
      for (const v of correct) { if (!given.has(v)) return false; }
      return true;
    }
    case 'categorizationv2': {
      const key = question.correctAnswer || {};
      if (typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return false;
      const entries = Object.entries(key);
      if (!entries.length) return false;
      return entries.every(([itemId, catId]) => userAnswer[itemId] === catId);
    }
    case 'fill_blank': {
      const correctAnswer = question.correctAnswer || question.correctOption;
      if (typeof userAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === String(correctAnswer || '').trim().toLowerCase();
      }
      if (typeof userAnswer === 'object' && correctAnswer && typeof correctAnswer === 'object') {
        return Object.entries(correctAnswer).every(
          ([k, v]) => String(userAnswer[k] || '').trim().toLowerCase() === String(v || '').trim().toLowerCase()
        );
      }
      return false;
    }
    case 'sentence_ordering': {
      const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const given   = Array.isArray(userAnswer) ? userAnswer : [];
      if (correct.length !== given.length) return false;
      return correct.every((v, i) => String(v) === String(given[i]));
    }
    default: {
      if (typeof userAnswer !== 'string') return false;
      return userAnswer.toUpperCase() === String(question.correctOption || '').toUpperCase();
    }
  }
}
