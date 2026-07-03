/**
 * SVG Figure Template Engine
 * Generates image-based mental ability questions as inline SVG strings.
 *
 * Supported question types (template.config.svgType):
 *   'rotation'  – What does the shape look like after rotating 90°/180°/270°?
 *   'mirror'    – What is the horizontal/vertical mirror of this shape?
 *   'series'    – What comes next in the pattern sequence?
 *
 * All output is stored as standard question documents with SVG strings
 * in questionText and options. The practice player renders them via
 * parseMathAndText() which already handles <svg> prefix strings.
 */

// ─── SVG Primitive Library ─────────────────────────────────────────────

const SHAPE_FNS = {
  triangle: (cx, cy, r, fill, stroke) => {
    const h = r * Math.sqrt(3) / 2;
    const pts = [`${cx},${cy - r * 0.8}`, `${cx - r},${cy + h * 0.6}`, `${cx + r},${cy + h * 0.6}`].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  },
  square: (cx, cy, r, fill, stroke) =>
    `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
  circle: (cx, cy, r, fill, stroke) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`,
  diamond: (cx, cy, r, fill, stroke) => {
    const pts = [`${cx},${cy - r}`, `${cx + r},${cy}`, `${cx},${cy + r}`, `${cx - r},${cy}`].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  },
  pentagon: (cx, cy, r, fill, stroke) => {
    const pts = Array.from({ length: 5 }, (_, i) => {
      const angle = (i * 72 - 90) * Math.PI / 180;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  },
  arrow: (cx, cy, r, fill, stroke) => {
    const pts = [
      `${cx},${cy - r}`, `${cx + r * 0.5},${cy}`,
      `${cx + r * 0.2},${cy}`, `${cx + r * 0.2},${cy + r}`,
      `${cx - r * 0.2},${cy + r}`, `${cx - r * 0.2},${cy}`,
      `${cx - r * 0.5},${cy}`,
    ].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  },
  star: (cx, cy, r, fill, stroke) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const angle = (i * 36 - 90) * Math.PI / 180;
      const radius = i % 2 === 0 ? r : r * 0.45;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  },
  cross: (cx, cy, r, fill, stroke) => {
    const t = r * 0.3;
    const pts = [
      `${cx - t},${cy - r}`, `${cx + t},${cy - r}`,
      `${cx + t},${cy - t}`, `${cx + r},${cy - t}`,
      `${cx + r},${cy + t}`, `${cx + t},${cy + t}`,
      `${cx + t},${cy + r}`, `${cx - t},${cy + r}`,
      `${cx - t},${cy + t}`, `${cx - r},${cy + t}`,
      `${cx - r},${cy - t}`, `${cx - t},${cy - t}`,
    ].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  },
};

const FILLS   = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
const STROKES = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#475569'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SVG Helpers ──────────────────────────────────────────────────────

const SIZE = 130;  // option figure size (px) — fills 2-col grid cells
const Q_SIZE = 150; // original figure size shown in question

function buildInner(shapeName, fillIdx, r = SIZE * 0.28) {
  const cx = SIZE / 2, cy = SIZE / 2;
  const fill = FILLS[fillIdx % FILLS.length];
  const stroke = STROKES[fillIdx % STROKES.length];
  const fn = SHAPE_FNS[shapeName];
  return fn ? fn(cx, cy, r, fill, stroke) : '';
}

function buildInnerQ(shapeName, fillIdx) {
  const cx = Q_SIZE / 2, cy = Q_SIZE / 2;
  const r = Q_SIZE * 0.28;
  const fill = FILLS[fillIdx % FILLS.length];
  const stroke = STROKES[fillIdx % STROKES.length];
  const fn = SHAPE_FNS[shapeName];
  return fn ? fn(cx, cy, r, fill, stroke) : '';
}

function svgWrap(inner, transform = '', label = '') {
  const cx = SIZE / 2, cy = SIZE / 2;
  const gAttrs = transform ? ` transform="${transform}"` : '';
  const labelEl = label
    ? `<text x="${cx}" y="${SIZE - 3}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="system-ui,sans-serif">${label}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/><g${gAttrs}>${inner}</g>${labelEl}</svg>`;
}

// Wrap the original question figure at Q_SIZE with a subtle style
function svgWrapQ(inner) {
  const cx = Q_SIZE / 2, cy = Q_SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Q_SIZE}" height="${Q_SIZE}" viewBox="0 0 ${Q_SIZE} ${Q_SIZE}"><rect width="${Q_SIZE}" height="${Q_SIZE}" rx="12" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>${inner}</svg>`;
}

function rotated(inner, deg) {
  return svgWrap(inner, `rotate(${deg},${SIZE / 2},${SIZE / 2})`, `${deg}\u00b0`);
}

function mirrored(inner, axis) {
  const t = axis === 'h'
    ? `scale(1,-1) translate(0,-${SIZE})`
    : `scale(-1,1) translate(-${SIZE},0)`;
  return svgWrap(inner, t, axis === 'h' ? '\u2195' : '\u2194');
}

/**
 * Add a small asymmetric dot to break shape symmetry so mirror ≠ rotation.
 * Without this, shapes like triangle/arrow mirrored horizontally look
 * identical to a 180° rotation.
 */
function addChiralDot(inner, cx, cy, r) {
  // Dot placed at upper-right of the shape's bounding area
  const dotX = (cx + r * 0.55).toFixed(1);
  const dotY = (cy - r * 0.55).toFixed(1);
  const dotR = Math.max(4, (r * 0.12)).toFixed(1);
  return inner + `<circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="white" stroke="#475569" stroke-width="1.5" opacity="0.9"/>`;
}

// ─── TYPE: ROTATION ────────────────────────────────────────────────────

function makeRotation(config) {
  const shapeName = rand(config.shapes || Object.keys(SHAPE_FNS));
  const fillIdx = Math.floor(Math.random() * FILLS.length);
  const r = SIZE * 0.28;
  const cx = SIZE / 2, cy = SIZE / 2;
  const rQ = Q_SIZE * 0.28;
  const cxQ = Q_SIZE / 2, cyQ = Q_SIZE / 2;

  // Build raw shape inner content
  const fill = FILLS[fillIdx % FILLS.length];
  const stroke = STROKES[fillIdx % STROKES.length];
  const rawInner = SHAPE_FNS[shapeName] ? SHAPE_FNS[shapeName](cx, cy, r, fill, stroke) : '';
  const rawInnerQ = SHAPE_FNS[shapeName] ? SHAPE_FNS[shapeName](cxQ, cyQ, rQ, fill, stroke) : '';

  // Add chiral dot so rotation is visually distinct for all rotations
  const chiralInner = addChiralDot(rawInner, cx, cy, r);
  const chiralInnerQ = addChiralDot(rawInnerQ, cxQ, cyQ, rQ);

  const targetDeg = rand(config.degrees || [90, 180, 270]);

  // Use all 4 rotations as options — NO mirrors.
  const allDegs = [0, 90, 180, 270];
  const correct = rotated(chiralInner, targetDeg);
  const distractors = allDegs
    .filter(d => d !== targetDeg)
    .map(d => rotated(chiralInner, d));

  const original = svgWrapQ(chiralInnerQ);
  return buildQuestion(original, correct, distractors, {
    questionSuffix: `If the figure above is rotated ${targetDeg}\u00b0 clockwise, which of the following will be the result?`,
    explanation: `Rotating ${targetDeg}\u00b0 clockwise moves each point around the centre. Option {{CORRECT}} shows the correct result.`,
    topic: config.topic || 'rotation',
    difficulty: config.difficulty ?? 0.4,
  });
}

// ─── TYPE: MIRROR ──────────────────────────────────────────────────────

function makeMirror(config) {
  const shapeName = rand(config.shapes || Object.keys(SHAPE_FNS));
  const fillIdx = Math.floor(Math.random() * FILLS.length);
  const r = SIZE * 0.28;
  const cx = SIZE / 2, cy = SIZE / 2;
  const rQ = Q_SIZE * 0.28;
  const cxQ = Q_SIZE / 2, cyQ = Q_SIZE / 2;

  // Build raw shape inner content
  const fill = FILLS[fillIdx % FILLS.length];
  const stroke = STROKES[fillIdx % STROKES.length];
  const rawInner = SHAPE_FNS[shapeName] ? SHAPE_FNS[shapeName](cx, cy, r, fill, stroke) : '';
  const rawInnerQ = SHAPE_FNS[shapeName] ? SHAPE_FNS[shapeName](cxQ, cyQ, rQ, fill, stroke) : '';

  // Add chiral dot so mirror reflection is visually distinct from any rotation
  const chiralInner = addChiralDot(rawInner, cx, cy, r);
  const chiralInnerQ = addChiralDot(rawInnerQ, cxQ, cyQ, rQ);

  const axis = rand(config.axes || ['h', 'v']);
  const wrongAxis = axis === 'h' ? 'v' : 'h';
  const axisLabel = axis === 'h' ? 'horizontal axis (top-to-bottom flip)' : 'vertical axis (left-to-right flip)';

  const original = svgWrapQ(chiralInnerQ);
  const correct = mirrored(chiralInner, axis);
  // Use rotations as distractors (never same-axis mirror, never opposite-axis which may also look same)
  const distractors = shuffle([
    mirrored(chiralInner, wrongAxis),  // other axis mirror
    rotated(chiralInner, 90),
    rotated(chiralInner, 180),
  ]);

  return buildQuestion(original, correct, distractors, {
    questionSuffix: `Which of the following is the mirror image of the figure above reflected across the ${axisLabel}?`,
    explanation: `A mirror reflection across the ${axisLabel} flips the shape without rotating it. The white dot moves to the opposite side. Option {{CORRECT}} is correct.`,
    topic: config.topic || 'mirror-image',
    difficulty: config.difficulty ?? 0.45,
  });
}

// ─── TYPE: SERIES ──────────────────────────────────────────────────────

const SERIES_RULES = {
  growing:   (step) => ({ r: SIZE * (0.10 + step * 0.055), opacity: 1, deg: 0 }),
  shrinking: (step) => ({ r: SIZE * (0.34 - step * 0.055), opacity: 1, deg: 0 }),
  rotating:  (step) => ({ r: SIZE * 0.26, opacity: 1, deg: step * 45 }),
  fading:    (step) => ({ r: SIZE * 0.26, opacity: Math.max(0.15, 1 - step * 0.22), deg: 0 }),
};

const RULE_DESCRIPTIONS = {
  growing:   'the shape grows progressively larger',
  shrinking: 'the shape shrinks progressively smaller',
  rotating:  'the shape rotates 45\u00b0 clockwise each step',
  fading:    'the shape becomes more transparent each step',
};

function seriesFrame(shapeName, fillIdx, step, rule) {
  const { r, opacity, deg } = SERIES_RULES[rule](step);
  const cx = SIZE / 2, cy = SIZE / 2;
  const fill = FILLS[fillIdx % FILLS.length];
  const stroke = STROKES[fillIdx % STROKES.length];
  const fn = SHAPE_FNS[shapeName];
  const inner = fn ? fn(cx, cy, r, fill, stroke) : '';
  const transformAttr = deg ? ` transform="rotate(${deg},${cx},${cy})"` : '';
  const opacityAttr = opacity !== 1 ? ` opacity="${opacity.toFixed(2)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/><g${transformAttr}${opacityAttr}>${inner}</g></svg>`;
}

function makeSeries(config) {
  const shapeName = rand(config.shapes || Object.keys(SHAPE_FNS));
  const fillIdx = Math.floor(Math.random() * FILLS.length);
  const rule = rand(config.rules || Object.keys(SERIES_RULES));

  const frames = [0, 1, 2].map(s => seriesFrame(shapeName, fillIdx, s, rule));
  const correctFrame = seriesFrame(shapeName, fillIdx, 3, rule);

  // Distractors
  const wrongShapes = Object.keys(SHAPE_FNS).filter(s => s !== shapeName);
  const d1Shape = rand(wrongShapes);
  const d2Shape = rand(wrongShapes.filter(s => s !== d1Shape));
  const distractors = shuffle([
    seriesFrame(d1Shape, fillIdx, 3, rule),            // wrong shape, correct step
    seriesFrame(shapeName, fillIdx, 2, rule),           // correct shape, wrong step (repeat)
    seriesFrame(d2Shape, (fillIdx + 1) % FILLS.length, 3, rule), // wrong shape + color
  ]);

  const seriesHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE * 4 + 48}" height="${SIZE + 10}" viewBox="0 0 ${SIZE * 4 + 48} ${SIZE + 10}">${frames.map((f, i) => `<image href="data:image/svg+xml,${encodeURIComponent(f)}" x="${i * (SIZE + 16)}" y="0" width="${SIZE}" height="${SIZE}"/><text x="${i * (SIZE + 16) + SIZE + 4}" y="${SIZE / 2 + 4}" font-size="18" fill="#94a3b8" font-family="system-ui">\u2192</text>`).join('')}<text x="${frames.length * (SIZE + 16)}" y="${SIZE / 2 + 8}" font-size="26" fill="#6366f1" font-weight="900" font-family="system-ui">?</text></svg>`;

  return buildQuestion(seriesHtml, correctFrame, distractors, {
    questionSuffix: 'Study the series and choose which figure comes next:',
    questionPrefix: true,
    explanation: `In this series, ${RULE_DESCRIPTIONS[rule] || 'a rule applies'}. Continuing the same rule gives option {{CORRECT}}.`,
    topic: config.topic || 'series',
    difficulty: config.difficulty ?? 0.5,
  });
}

// ─── Option Builder ────────────────────────────────────────────────────

function buildQuestion(original, correct, distractors, { questionSuffix, questionPrefix, explanation, topic, difficulty }) {
  const optionKeys = ['A', 'B', 'C', 'D'];
  const allOptions = shuffle([correct, ...distractors.slice(0, 3)]);
  
  // Verify all options are visually unique by stripping <text> elements
  const visualContents = allOptions.map(opt => opt.replace(/<text[^>]*>.*?<\/text>/g, ''));
  const uniqueVisuals = new Set(visualContents);
  if (uniqueVisuals.size < 4) {
    return null; // Duplicate detected!
  }

  const options = {};
  allOptions.forEach((svg, i) => { options[optionKeys[i]] = svg; });
  const correctOption = optionKeys[allOptions.indexOf(correct)];

  const questionText = questionPrefix
    ? `${questionSuffix}\n${original}`
    : `${original}\n${questionSuffix}`;

  return {
    questionText,
    options,
    correctOption,
    explanationText: explanation.replace('{{CORRECT}}', correctOption),
    topic,
    difficulty,
  };
}

// ─── Main Export ──────────────────────────────────────────────────────

/**
 * Generate SVG-based mental ability questions from a template.
 *
 * @param {Object} template  Template document. Must have config.svgType.
 * @param {number} count     Number of questions to generate.
 * @returns {Array}          Question-ready objects for DB insertion.
 */
export function instantiateSvgTemplate(template, count) {
  const config = template.config || {};
  const svgType = config.svgType;
  const examId = config.examId || template.examId;
  const section = config.section || template.section;
  const tags = config.tags || [section];

  const generators = { rotation: makeRotation, mirror: makeMirror, series: makeSeries };
  const generate = generators[svgType];
  if (!generate) {
    console.warn(`[svg-template-engine] Unknown svgType: "${svgType}"`);
    return [];
  }

  const results = [];
  for (let i = 0; i < count; i++) {
    let question = null;
    // Retry up to 15 times to generate a visually unique question
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        const q = generate(config);
        if (q) {
          question = q;
          break;
        }
      } catch (err) {
        console.warn(`[svg-template-engine] Q${i} attempt ${attempt} failed:`, err.message);
      }
    }

    if (question) {
      results.push({
        examId,
        section,
        topic: question.topic,
        templateId: String(template._id || template.id || ''),
        difficulty: question.difficulty,
        questionText: question.questionText,
        options: question.options,
        correctOption: question.correctOption,
        explanationText: question.explanationText,
        isPYQ: false,
        tags,
        status: 'active',
      });
    } else {
      console.warn(`[svg-template-engine] Failed to generate a unique question for index ${i} after 15 attempts`);
    }
  }
  return results;
}

/**
 * Returns true if this template should be handled by the SVG engine.
 * Use this to route in practice/start and admin APIs.
 */
export function isSvgTemplate(template) {
  return template?.type === 'svg-figure' || !!template?.config?.svgType;
}
