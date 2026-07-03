/**
 * Visual Transformation Engine
 * 
 * Separates the problem generation into four clean, reusable layers:
 * 1. Scene Builder - Defines the coordinate space and shape properties.
 * 2. Rule Engine - Performs spatial (mirror, rotate) and semantic (swap, color) changes on the scene.
 * 3. Distractor Engine - Generates incorrect options using faulty rules.
 * 4. SVG Renderer - Turns the scene representation into clean, beautiful SVG code.
 */

// ─── 1. SCENE BUILDER ──────────────────────────────────────────────────

const VIEWPORT_SIZE = 100;
const CENTER = VIEWPORT_SIZE / 2;

const COLOR_PALETTE = {
  primary: '#6366f1', // Indigo
  secondary: '#10b981', // Emerald
  accent: '#ef4444', // Red
  warning: '#f59e0b', // Amber
  purple: '#8b5cf6', // Violet
  dark: '#1e293b', // Slate
  white: '#ffffff',
  gray: '#94a3b8'
};

const SHAPE_RENDERERS = {
  circle: (obj, fill, stroke) => 
    `<circle cx="${obj.x}" cy="${obj.y}" r="${obj.size || 8}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`,
  
  square: (obj, fill, stroke) => {
    const s = (obj.size || 16);
    return `<rect x="${obj.x - s/2}" y="${obj.y - s/2}" width="${s}" height="${s}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  },
  
  triangle: (obj, fill, stroke) => {
    const s = obj.size || 20;
    const h = s * Math.sqrt(3) / 2;
    // Check if triangle has a split/fillRegion (e.g., left half, right half, bottom half)
    if (obj.fillRegion) {
      const top = `${obj.x},${obj.y - h*0.6}`;
      const bl = `${obj.x - s/2},${obj.y + h*0.4}`;
      const br = `${obj.x + s/2},${obj.y + h*0.4}`;
      const bm = `${obj.x},${obj.y + h*0.4}`;
      
      if (obj.fillRegion === 'right') {
        return `
          <polygon points="${top} ${bl} ${bm}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
          <polygon points="${top} ${bm} ${br}" fill="${stroke}" stroke="${stroke}" stroke-width="2" />
        `.trim();
      }
      if (obj.fillRegion === 'left') {
        return `
          <polygon points="${top} ${bl} ${bm}" fill="${stroke}" stroke="${stroke}" stroke-width="2" />
          <polygon points="${top} ${bm} ${br}" fill="${fill}" stroke="${stroke}" stroke-width="2" />
        `.trim();
      }
    }
    const pts = [
      `${obj.x},${obj.y - h*0.6}`,
      `${obj.x - s/2},${obj.y + h*0.4}`,
      `${obj.x + s/2},${obj.y + h*0.4}`
    ].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  },
  
  diamond: (obj, fill, stroke) => {
    const s = obj.size || 16;
    const pts = [
      `${obj.x},${obj.y - s}`,
      `${obj.x + s},${obj.y}`,
      `${obj.x},${obj.y + s}`,
      `${obj.x - s},${obj.y}`
    ].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  },
  
  cross: (obj, fill, stroke) => {
    const r = obj.size || 12;
    const t = r * 0.35;
    const pts = [
      `${obj.x - t},${obj.y - r}`, `${obj.x + t},${obj.y - r}`,
      `${obj.x + t},${obj.y - t}`, `${obj.x + r},${obj.y - t}`,
      `${obj.x + r},${obj.y + t}`, `${obj.x + t},${obj.y + t}`,
      `${obj.x + t},${obj.y + r}`, `${obj.x - t},${obj.y + r}`,
      `${obj.x - t},${obj.y + t}`, `${obj.x - r},${obj.y + t}`,
      `${obj.x - r},${obj.y - t}`, `${obj.x - t},${obj.y - t}`
    ].join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  },
  
  line: (obj, fill, stroke) => {
    const x1 = obj.x1 !== undefined ? obj.x1 : obj.x - (obj.size || 15);
    const y1 = obj.y1 !== undefined ? obj.y1 : obj.y;
    const x2 = obj.x2 !== undefined ? obj.x2 : obj.x + (obj.size || 15);
    const y2 = obj.y2 !== undefined ? obj.y2 : obj.y;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" />`;
  },
  
  text: (obj, fill, stroke) => {
    const scaleX = obj.scaleX ?? 1;
    const scaleY = obj.scaleY ?? 1;
    const rotate = obj.rotate ?? 0;
    
    let transformStr = '';
    if (scaleX !== 1 || scaleY !== 1) {
      transformStr = `translate(${obj.x},${obj.y}) scale(${scaleX},${scaleY}) translate(${-obj.x},${-obj.y})`;
    }
    if (rotate) {
      transformStr += (transformStr ? ' ' : '') + `rotate(${rotate},${obj.x},${obj.y})`;
    }
    const transformAttr = transformStr ? ` transform="${transformStr}"` : '';
    
    return `<g${transformAttr}><text x="${obj.x}" y="${obj.y + (obj.size * 0.35)}" text-anchor="middle" font-size="${obj.size || 24}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" fill="${fill}" stroke="none">${obj.textVal || 'A'}</text></g>`;
  }
};

export function createScene(objects = [], tilt = false, layoutMode = 'standard') {
  return {
    tilt,
    layoutMode,
    objects: objects.map(o => ({
      id: o.id || Math.random().toString(36).substr(2, 5),
      type: o.type || 'circle',
      x: o.x ?? CENTER,
      y: o.y ?? CENTER,
      size: o.size || 16,
      fill: o.fill || 'white', // key to COLOR_PALETTE or raw hex
      stroke: o.stroke || 'dark',
      fillRegion: o.fillRegion || null, // for split shapes
      textVal: o.textVal || '',
      x1: o.x1 ?? undefined,
      y1: o.y1 ?? undefined,
      x2: o.x2 ?? undefined,
      y2: o.y2 ?? undefined,
      scaleX: o.scaleX ?? 1,
      scaleY: o.scaleY ?? 1,
      rotate: o.rotate ?? 0
    }))
  };
}

// ─── 2. RULE ENGINE ────────────────────────────────────────────────────

/**
 * Apply a transformation rule to a scene, returning a new scene object.
 */
export function applyRule(scene, rule) {
  const newObjects = scene.objects.map(obj => {
    const copy = { ...obj };
    
    switch (rule.type) {
      case 'mirror_h': {
        // Reflect horizontally around center line (x = 50)
        copy.x = VIEWPORT_SIZE - copy.x;
        // Reflect line endpoints if defined
        if (copy.x1 !== undefined) copy.x1 = VIEWPORT_SIZE - copy.x1;
        if (copy.x2 !== undefined) copy.x2 = VIEWPORT_SIZE - copy.x2;
        // Flip triangle divisions if present
        if (copy.fillRegion === 'left') copy.fillRegion = 'right';
        else if (copy.fillRegion === 'right') copy.fillRegion = 'left';
        // Flip text scaling
        if (copy.type === 'text') copy.scaleX = -copy.scaleX;
        break;
      }
      
      case 'mirror_v': {
        // Reflect vertically around center line (y = 50)
        copy.y = VIEWPORT_SIZE - copy.y;
        // Reflect line endpoints if defined
        if (copy.y1 !== undefined) copy.y1 = VIEWPORT_SIZE - copy.y1;
        if (copy.y2 !== undefined) copy.y2 = VIEWPORT_SIZE - copy.y2;
        // Flip text scaling
        if (copy.type === 'text') copy.scaleY = -copy.scaleY;
        break;
      }
      
      case 'rotate': {
        const rad = (rule.degrees * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Translate center of object
        const dx = obj.x - CENTER;
        const dy = obj.y - CENTER;
        copy.x = Math.round(CENTER + (dx * cos - dy * sin));
        copy.y = Math.round(CENTER + (dx * sin + dy * cos));
        
        // Translate line endpoints
        if (copy.x1 !== undefined && copy.y1 !== undefined) {
          const dx1 = obj.x1 - CENTER;
          const dy1 = obj.y1 - CENTER;
          copy.x1 = Math.round(CENTER + (dx1 * cos - dy1 * sin));
          copy.y1 = Math.round(CENTER + (dx1 * sin + dy1 * cos));
        }
        if (copy.x2 !== undefined && copy.y2 !== undefined) {
          const dx2 = obj.x2 - CENTER;
          const dy2 = obj.y2 - CENTER;
          copy.x2 = Math.round(CENTER + (dx2 * cos - dy2 * sin));
          copy.y2 = Math.round(CENTER + (dx2 * sin + dy2 * cos));
        }
        
        // Rotate text orientation
        if (copy.type === 'text') {
          copy.rotate = ((obj.rotate || 0) + rule.degrees) % 360;
        }
        
        // Rotate internal fill region directions
        if (copy.fillRegion) {
          if (rule.degrees === 180) {
            copy.fillRegion = copy.fillRegion === 'left' ? 'right' : 'left';
          }
        }
        break;
      }
      
      case 'change_color': {
        if (rule.targetId === copy.id || !rule.targetId) {
          copy.fill = rule.fill || copy.fill;
          copy.stroke = rule.stroke || copy.stroke;
        }
        break;
      }
      
      case 'scale': {
        if (rule.targetId === copy.id || !rule.targetId) {
          copy.size = Math.round(copy.size * (rule.factor || 1));
        }
        break;
      }
      
      case 'offset': {
        if (rule.targetId === copy.id || !rule.targetId) {
          copy.x += rule.dx || 0;
          copy.y += rule.dy || 0;
        }
        break;
      }
    }
    return copy;
  });

  // Handle cross-object operations (e.g., Swap position)
  if (rule.type === 'swap_positions') {
    const { id1, id2 } = rule;
    const idx1 = newObjects.findIndex(o => o.id === id1);
    const idx2 = newObjects.findIndex(o => o.id === id2);
    if (idx1 !== -1 && idx2 !== -1) {
      const tempX = newObjects[idx1].x;
      const tempY = newObjects[idx1].y;
      newObjects[idx1].x = newObjects[idx2].x;
      newObjects[idx1].y = newObjects[idx2].y;
      newObjects[idx2].x = tempX;
      newObjects[idx2].y = tempY;
    }
  }

  return {
    ...scene,
    objects: newObjects
  };
}

// ─── 3. DISTRACTOR ENGINE ──────────────────────────────────────────────

/**
 * Generate 3 incorrect/distractor scenes by applying faulty rules.
 */
export function generateDistractors(scene, correctRule) {
  const distractors = [];
  const rules = [];

  // Construct incorrect options depending on what the correct operation is
  if (correctRule.type === 'mirror_h') {
    rules.push(
      { type: 'mirror_v' }, // Faulty rule 1: Reflected vertically instead of horizontally
      { type: 'rotate', degrees: 180 }, // Faulty rule 2: Rotated 180 instead of mirror
      { type: 'mirror_h' } // Faulty rule 3: Mirrored, but with an extra wrong operation (e.g., swapped shapes)
    );
  } else if (correctRule.type === 'rotate') {
    const opDeg = correctRule.degrees === 90 ? 270 : correctRule.degrees === 270 ? 90 : 90;
    rules.push(
      { type: 'rotate', degrees: opDeg }, // Opposite rotation direction
      { type: 'mirror_h' }, // Mirrored instead of rotated
      { type: 'rotate', degrees: correctRule.degrees } // Same rotation but with a missing/faulty sub-object change
    );
  } else {
    // Generic fallback
    rules.push(
      { type: 'mirror_h' },
      { type: 'mirror_v' },
      { type: 'rotate', degrees: 180 }
    );
  }

  // Apply the rules to create final distractor scenes
  rules.forEach((rule, idx) => {
    let distScene = applyRule(scene, rule);
    
    // Add minor visual discrepancies to the last distractor (e.g., change color or swap shapes)
    if (idx === 2 && distScene.objects.length >= 2) {
      const id1 = distScene.objects[0].id;
      const id2 = distScene.objects[1].id;
      distScene = applyRule(distScene, { type: 'swap_positions', id1, id2 });
    }
    
    distractors.push(distScene);
  });

  return distractors;
}

// ─── 4. SVG RENDERER ───────────────────────────────────────────────────

export function renderSceneToSvg(scene, borderSize = 130, isMirrorAxis = false, isQuestion = false) {
  const border = borderSize;
  const scale = border / VIEWPORT_SIZE;
  const isPattern = scene.layoutMode === 'pattern';

  // Render the shapes inside
  const shapesMarkup = scene.objects.map(obj => {
    const fill = COLOR_PALETTE[obj.fill] || obj.fill;
    const stroke = COLOR_PALETTE[obj.stroke] || obj.stroke;
    
    const scaledObj = {
      ...obj,
      x: obj.x * scale,
      y: obj.y * scale,
      size: obj.size * scale
    };
    if (obj.x1 !== undefined) scaledObj.x1 = obj.x1 * scale;
    if (obj.y1 !== undefined) scaledObj.y1 = obj.y1 * scale;
    if (obj.x2 !== undefined) scaledObj.x2 = obj.x2 * scale;
    if (obj.y2 !== undefined) scaledObj.y2 = obj.y2 * scale;
    
    const renderFn = SHAPE_RENDERERS[obj.type];
    return renderFn ? renderFn(scaledObj, fill, stroke) : '';
  }).join('\n');

  // Background card styling (tilted/perspectived or simple flat square)
  let cardBg = '';
  if (scene.tilt) {
    const pts = [
      `${border * 0.12},${border * 0.2}`,
      `${border * 0.92},${border * 0.1}`,
      `${border * 0.88},${border * 0.9}`,
      `${border * 0.08},${border * 0.95}`
    ].join(' ');
    cardBg = `<polygon points="${pts}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="8"/>`;
  } else {
    cardBg = `<rect width="${border}" height="${border}" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />`;
  }

  // Draw Grid Overlay for Pattern Completion Mode
  let patternOverlay = '';
  if (isPattern) {
    const mid = border / 2;
    // Main quadrant divider lines
    patternOverlay += `<line x1="${mid}" y1="0" x2="${mid}" y2="${border}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />`;
    patternOverlay += `<line x1="0" y1="${mid}" x2="${border}" y2="${mid}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />`;
    
    if (isQuestion) {
      // Blank out bottom-right quadrant for the question card
      patternOverlay += `
        <rect x="${mid}" y="${mid}" width="${mid}" height="${mid}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="${mid * 1.5}" y="${mid * 1.5 + 8}" text-anchor="middle" font-size="28" font-family="system-ui, sans-serif" font-weight="900" fill="#6366f1">?</text>
      `.trim();
    }
  }

  // Render a vertical line on the right side if this is showing a mirror axis (question container)
  const mirrorLine = isMirrorAxis ? `
    <line x1="${border + 15}" y1="10" x2="${border + 15}" y2="${border - 10}" stroke="#1e293b" stroke-width="2" />
    <line x1="${border + 15}" y1="20" x2="${border + 22}" y2="28" stroke="#64748b" stroke-width="1" />
    <line x1="${border + 15}" y1="40" x2="${border + 22}" y2="48" stroke="#64748b" stroke-width="1" />
    <line x1="${border + 15}" y1="60" x2="${border + 22}" y2="68" stroke="#64748b" stroke-width="1" />
    <line x1="${border + 15}" y1="80" x2="${border + 22}" y2="88" stroke="#64748b" stroke-width="1" />
    <line x1="${border + 15}" y1="100" x2="${border + 22}" y2="108" stroke="#64748b" stroke-width="1" />
    <text x="${border + 15}" y="8" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="bold">A</text>
    <text x="${border + 15}" y="${border - 1}" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="bold">B</text>
  ` : '';

  const totalWidth = isMirrorAxis ? border + 30 : border;
  
  // For Pattern Completion option cards, we only render Q4 scaled up
  let finalContent = `<g>${shapesMarkup}</g>`;
  if (isPattern && !isQuestion) {
    const clipId = `q4-clip-${Math.random().toString(36).substr(2, 5)}`;
    finalContent = `
      <defs>
        <clipPath id="${clipId}">
          <rect x="${border / 2}" y="${border / 2}" width="${border / 2}" height="${border / 2}" />
        </clipPath>
      </defs>
      <g clip-path="url(#${clipId})" transform="translate(${-border / 2}, ${-border / 2}) scale(2)">
        ${shapesMarkup}
      </g>
    `.trim();
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${border}" viewBox="0 0 ${totalWidth} ${border}" style="display:block;max-width:100%;">
      ${cardBg}
      ${finalContent}
      ${patternOverlay}
      ${mirrorLine}
    </svg>
  `.trim().replace(/\s+/g, ' ');
}

// ─── TEMPLATE INSTANTIATOR ─────────────────────────────────────────────

/**
 * Dynamic generator endpoint wiring.
 * Generates questions using rule configurations defined on templates.
 */
export function instantiateVisualTransformationTemplate(template, count) {
  const config = template.config || {};
  const examId = config.examId || template.examId;
  const section = config.section || template.section;
  const layoutMode = config.layoutMode || 'standard';
  
  // Set up the scene configuration
  const baseObjects = config.objects || [
    { id: 'sq', type: 'square', x: 25, y: 35, size: 14, fill: 'white' },
    { id: 'ci', type: 'circle', x: 75, y: 35, size: 8, fill: 'white' },
    { id: 'tri', type: 'triangle', x: 50, y: 65, size: 20, fillRegion: 'right', fill: 'white' }
  ];

  const rule = config.transformation?.[0] || { type: 'mirror_h' };
  
  const results = [];
  for (let i = 0; i < count; i++) {
    // Build initial scene
    const initialScene = createScene(baseObjects, config.tilt || false, layoutMode);
    
    // Compute correct outcome
    const correctScene = applyRule(initialScene, rule);
    
    // Compute incorrect outcomes
    const distractorScenes = generateDistractors(initialScene, rule);
    
    // Render to SVGs based on layout mode
    let questionText = '';
    let correctSvg = '';
    let optionsSvgs = [];

    if (layoutMode === 'analogy') {
      const cardASvg = renderSceneToSvg(initialScene, 130, false, false);
      const cardBSvg = renderSceneToSvg(correctScene, 130, false, false);
      
      // Card C is the same as A but mutated (e.g. swap colors)
      const mutatedObjects = baseObjects.map(obj => ({
        ...obj,
        fill: obj.fill === 'white' ? 'primary' : 'white'
      }));
      const sceneC = createScene(mutatedObjects, config.tilt || false, layoutMode);
      const correctSceneD = applyRule(sceneC, rule);
      const distractorScenesD = generateDistractors(sceneC, rule);

      const cardCSvg = renderSceneToSvg(sceneC, 130, false, false);
      
      const analogyRow = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;justify-content:center;">
          <div>${cardASvg}</div>
          <div style="font-size:24px;font-weight:bold;color:#475569">:</div>
          <div>${cardBSvg}</div>
          <div style="font-size:24px;font-weight:bold;color:#475569;margin:0 4px">::</div>
          <div>${cardCSvg}</div>
          <div style="font-size:24px;font-weight:bold;color:#475569">:</div>
          <div style="width:130px;height:130px;border:2px dashed #6366f1;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#6366f1;background:#f8fafc">?</div>
        </div>
      `.trim().replace(/\s+/g, ' ');

      questionText = `${analogyRow}\nIdentify the figure that completes the analogy (C : D) following the same relationship as (A : B):`;
      correctSvg = renderSceneToSvg(correctSceneD, 130, false, false);
      optionsSvgs = distractorScenesD.map(d => renderSceneToSvg(d, 130, false, false));

    } else if (layoutMode === 'pattern') {
      const originalSvg = renderSceneToSvg(initialScene, 150, false, true); // isQuestion = true
      questionText = `${originalSvg}\nStudy the incomplete pattern and choose which option fits into the missing bottom-right corner:`;
      
      correctSvg = renderSceneToSvg(initialScene, 130, false, false); // Q4 scaled up
      optionsSvgs = distractorScenes.map(d => renderSceneToSvg(d, 130, false, false));

    } else if (layoutMode === 'series') {
      const cardASvg = renderSceneToSvg(initialScene, 130, false, false);
      const sceneB = applyRule(initialScene, rule);
      const cardBSvg = renderSceneToSvg(sceneB, 130, false, false);
      const sceneC = applyRule(sceneB, rule);
      const cardCSvg = renderSceneToSvg(sceneC, 130, false, false);
      const sceneD = applyRule(sceneC, rule);

      const seriesRow = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;justify-content:center;">
          <div>${cardASvg}</div>
          <div style="font-size:20px;font-weight:bold;color:#6366f1">➔</div>
          <div>${cardBSvg}</div>
          <div style="font-size:20px;font-weight:bold;color:#6366f1">➔</div>
          <div>${cardCSvg}</div>
          <div style="font-size:20px;font-weight:bold;color:#6366f1">➔</div>
          <div style="width:130px;height:130px;border:2px dashed #6366f1;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#6366f1;background:#f8fafc">?</div>
        </div>
      `.trim().replace(/\s+/g, ' ');

      questionText = `${seriesRow}\nSelect the correct figure from the options to complete the series sequence:`;
      correctSvg = renderSceneToSvg(sceneD, 130, false, false);
      const distractorScenesD = generateDistractors(sceneC, rule);
      optionsSvgs = distractorScenesD.map(d => renderSceneToSvg(d, 130, false, false));

    } else if (layoutMode === 'odd_man_out') {
      questionText = `Three of the following figures are similar in some way and one figure is different. Select the figure which is different (Odd-Man Out):`;
      
      const sceneA = renderSceneToSvg(initialScene, 130, false, false);
      const sceneB = renderSceneToSvg(applyRule(initialScene, { type: 'rotate', degrees: 90 }), 130, false, false);
      const sceneC = renderSceneToSvg(applyRule(initialScene, { type: 'rotate', degrees: 180 }), 130, false, false);
      const oddScene = applyRule(initialScene, rule); // mirrored/different
      
      correctSvg = renderSceneToSvg(oddScene, 130, false, false);
      optionsSvgs = [sceneA, sceneB, sceneC];

    } else if (layoutMode === 'punched_hole') {
      // Find base circle punch points (restricted to top-left quadrant)
      const punches = baseObjects.filter(o => o.type === 'circle' && (o.enabled !== false));
      
      const scale = 130 / VIEWPORT_SIZE;
      const punchesMarkup = punches.map(p => {
        return `<circle cx="${p.x * scale}" cy="${p.y * scale}" r="${4 * scale}" fill="#ffffff" stroke="#1e293b" stroke-width="2" />`;
      }).join('\n');

      // Card 1: Square with vertical line dividing top and bottom (folded UP)
      const frame1 = `
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 100 100" style="display:block;max-width:100%;">
          <rect width="100" height="100" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
          <rect x="0" y="50" width="100" height="50" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="0" y="0" width="100" height="50" fill="none" stroke="#1e293b" stroke-width="2" />
          <path d="M50,75 L50,55 M45,63 L50,55 L55,63" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `.trim().replace(/\s+/g, ' ');

      // Card 2: Top half with horizontal line dividing left and right (folded LEFT)
      const frame2 = `
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 100 100" style="display:block;max-width:100%;">
          <rect width="100" height="100" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
          <rect x="0" y="50" width="100" height="50" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
          <rect x="50" y="0" width="50" height="50" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="0" y="0" width="50" height="50" fill="none" stroke="#1e293b" stroke-width="2" />
          <path d="M75,25 L55,25 M63,20 L55,25 L63,30" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `.trim().replace(/\s+/g, ' ');

      // Card 3: Folded top-left quadrant with diagonal fold (folded UP-RIGHT) & punch dots
      const frame3 = `
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 100 100" style="display:block;max-width:100%;">
          <rect width="100" height="100" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
          <rect x="0" y="50" width="100" height="50" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
          <rect x="50" y="0" width="50" height="50" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
          <polygon points="0,50 50,50 50,0" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
          <polygon points="0,0 50,0 0,50" fill="none" stroke="#1e293b" stroke-width="2" />
          <path d="M42,42 L28,28 M30,38 L28,28 L38,30" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          ${punchesMarkup}
        </svg>
      `.trim().replace(/\s+/g, ' ');

      const foldingRow = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;justify-content:center;">
          <div>${frame1}</div>
          <div style="font-size:20px;font-weight:bold;color:#6366f1">➔</div>
          <div>${frame2}</div>
          <div style="font-size:20px;font-weight:bold;color:#6366f1">➔</div>
          <div>${frame3}</div>
        </div>
      `.trim().replace(/\s+/g, ' ');

      questionText = `${foldingRow}\nA piece of paper is folded and punched as shown in the question figures. Select how it will appear when unfolded:`;
      
      const unfoldedCorrect = unfoldPunchedHoles(punches);
      correctSvg = renderPunchedHoleCard(unfoldedCorrect, 130);
      
      const distractors = generatePunchedHoleDistractors(punches);
      optionsSvgs = distractors.map(d => renderPunchedHoleCard(d, 130));

    } else {
      // Standard layout mode
      const originalSvg = renderSceneToSvg(initialScene, 150, rule.type === 'mirror_h', true);
      correctSvg = renderSceneToSvg(correctScene, 130, false, false);
      optionsSvgs = distractorScenes.map(d => renderSceneToSvg(d, 130, false, false));
      questionText = `${originalSvg}\nWhich of the following shows the correct output after applying the transformation rule?`;
    }
    
    // Construct question
    const optionKeys = ['A', 'B', 'C', 'D'];
    const allOptions = shuffle([correctSvg, ...optionsSvgs]);
    
    const options = {};
    allOptions.forEach((svg, idx) => {
      options[optionKeys[idx]] = svg;
    });
    
    const correctOption = optionKeys[allOptions.indexOf(correctSvg)];
    const explanationText = `Applying the transformation rule (${rule.type.replace('_', ' ')}) yields option ${correctOption}.`;
    
    results.push({
      examId,
      section,
      topic: config.topic || 'visual-transformation',
      templateId: String(template._id || template.id || ''),
      difficulty: config.difficulty ?? 0.5,
      questionText,
      options,
      correctOption,
      explanationText,
      isPYQ: false,
      tags: config.tags || ['mental-ability', 'visual-transformation'],
      status: 'active'
    });
  }

  return results;
}

export function unfoldPunchedHoles(punches) {
  // Step 1: Unfold diagonal (reflect across x + y = 50)
  let pts = [];
  punches.forEach(p => {
    pts.push({ x: p.x, y: p.y });
    pts.push({ x: 50 - p.y, y: 50 - p.x });
  });
  
  // Step 2: Unfold horizontal (reflect across x = 50)
  let step2 = [];
  pts.forEach(p => {
    step2.push(p);
    step2.push({ x: 100 - p.x, y: p.y });
  });
  
  // Step 3: Unfold vertical (reflect across y = 50)
  let step3 = [];
  step2.forEach(p => {
    step3.push(p);
    step3.push({ x: p.x, y: 100 - p.y });
  });
  
  return step3;
}

export function generatePunchedHoleDistractors(punches) {
  // Distractor 1: Skip diagonal fold (only horizontal & vertical unfold) -> yields 8 corner dots
  let d1 = [];
  punches.forEach(p => {
    d1.push(p);
    d1.push({ x: 100 - p.x, y: p.y });
  });
  let d1_full = [];
  d1.forEach(p => {
    d1_full.push(p);
    d1_full.push({ x: p.x, y: 100 - p.y });
  });
  
  // Distractor 2: Skewed reflection (reflecting diagonally as y = x instead of y = 50 - x)
  let d2_pts = [];
  punches.forEach(p => {
    d2_pts.push(p);
    d2_pts.push({ x: p.y, y: p.x });
  });
  let d2_step2 = [];
  d2_pts.forEach(p => {
    d2_step2.push(p);
    d2_step2.push({ x: 100 - p.x, y: p.y });
  });
  let d2_full = [];
  d2_step2.forEach(p => {
    d2_full.push(p);
    d2_full.push({ x: p.x, y: 100 - p.y });
  });
  
  // Distractor 3: Shifted offset (concentric scaling)
  const d3_full = unfoldPunchedHoles(punches).map(p => ({
    x: p.x + (p.x < 50 ? 6 : -6),
    y: p.y + (p.y < 50 ? 6 : -6)
  }));
  
  return [d1_full, d2_full, d3_full];
}

export function renderPunchedHoleCard(dots, borderSize = 130) {
  const border = borderSize;
  const scale = border / VIEWPORT_SIZE;
  
  const dotsMarkup = dots.map(p => {
    const cx = p.x * scale;
    const cy = p.y * scale;
    const r = 3.5 * scale;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" />`;
  }).join('\n');
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${border}" height="${border}" viewBox="0 0 ${border} ${border}" style="display:block;max-width:100%;">
      <rect width="${border}" height="${border}" rx="10" fill="#f8fafc" stroke="#cbd5e8" stroke-width="1.5" />
      ${dotsMarkup}
    </svg>
  `.trim().replace(/\s+/g, ' ');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
