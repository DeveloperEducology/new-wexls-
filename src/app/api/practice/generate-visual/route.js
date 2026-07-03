import { NextResponse } from 'next/server';
import { 
  createScene, 
  applyRule, 
  generateDistractors, 
  renderSceneToSvg 
} from '../../../../lib/exam/visual-transformation-engine.js';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // 1. Scene Builder Layer
    const baseObjects = body.objects || [
      { id: 'sq', type: 'square', x: 25, y: 35, size: 14, fill: 'white' },
      { id: 'ci', type: 'circle', x: 75, y: 35, size: 7, fill: 'white' },
      { id: 'tri', type: 'triangle', x: 50, y: 65, size: 20, fillRegion: 'right', fill: 'white' }
    ];
    const layoutMode = body.layoutMode || 'standard';
    const initialScene = createScene(baseObjects, body.tilt || false, layoutMode);

    // 2. Rule Engine Layer
    const rule = body.transformation || { type: 'mirror_h' };
    const correctScene = applyRule(initialScene, rule);

    // 3. Distractor Engine Layer
    const distractorScenes = generateDistractors(initialScene, rule);

    // 4. Renderer Layer (Render to SVGs based on layout mode)
    let questionText = '';
    let correctSvg = '';
    let optionsSvgs = [];

    if (layoutMode === 'analogy') {
      const cardASvg = renderSceneToSvg(initialScene, 130, false, false);
      const cardBSvg = renderSceneToSvg(correctScene, 130, false, false);
      
      const mutatedObjects = baseObjects.map(obj => ({
        ...obj,
        fill: obj.fill === 'white' ? 'primary' : 'white'
      }));
      const sceneC = createScene(mutatedObjects, body.tilt || false, layoutMode);
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
      
      correctSvg = renderSceneToSvg(initialScene, 130, false, false);
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

    } else {
      // Standard layout mode
      const originalSvg = renderSceneToSvg(initialScene, 150, rule.type === 'mirror_h', true);
      correctSvg = renderSceneToSvg(correctScene, 130, false, false);
      optionsSvgs = distractorScenes.map(d => renderSceneToSvg(d, 130, false, false));
      questionText = `${originalSvg}\nWhich of the following shows the correct output after applying the transformation rule?`;
    }

    // Shuffle options programmatically
    const optionKeys = ['A', 'B', 'C', 'D'];
    const allOptions = shuffle([correctSvg, ...optionsSvgs]);
    const options = {};
    allOptions.forEach((svg, idx) => {
      options[optionKeys[idx]] = svg;
    });

    const correctOption = optionKeys[allOptions.indexOf(correctSvg)];
    const explanationText = `Applying the transformation rule (${rule.type.replace('_', ' ')}) yields option ${correctOption}.`;

    return NextResponse.json({
      success: true,
      questionText,
      options,
      correctOption,
      explanationText
    });

  } catch (err) {
    console.error('[generate-visual]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
