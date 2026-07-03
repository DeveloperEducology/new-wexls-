import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { 
  createScene, 
  applyRule, 
  generateDistractors, 
  renderSceneToSvg 
} from '../../../../lib/exam/visual-transformation-engine.js';

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) return null;
  return new GoogleGenAI({ enterprise: true, project, location });
}

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Missing prompt' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Please set GEMINI_API_KEY.' }, { status: 501 });
    }

    const systemPrompt = `You are a layout builder for intelligence and mental ability tests.
Based on the user's prompt, generate a structured visual transformation configuration containing a base scene and a transformation rule.

Allowed shapes (type): "square", "circle", "triangle", "diamond", "cross".
Coordinate system: (x, y) integers from 10 to 90 inside a 100x100 space.
Color palette keys (fill): "white", "primary", "secondary", "accent", "warning", "purple", "dark".
Triangle split: Set fillRegion to "left" or "right" only if type is "triangle" and you want it split-filled.

Allowed transformation types:
- "mirror_h" (horizontal flip)
- "mirror_v" (vertical flip)
- "rotate" (requires "degrees": 90 or 180 or 270)
- "swap_positions" (requires "id1" and "id2" pointing to object ids)

Return ONLY a valid JSON object matching this schema:
{
  "tilt": false,
  "objects": [
    { "id": "sq", "type": "square", "x": 25, "y": 35, "size": 14, "fill": "white", "fillRegion": null }
  ],
  "transformation": {
    "type": "mirror_h",
    "degrees": 180,
    "id1": "sq",
    "id2": "ci"
  }
}
No markdown wrappers, no backticks, no extra text. Just raw JSON.`;

    const modelName = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `${systemPrompt}\n\nUser request: ${prompt}`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    let config;
    try {
      config = JSON.parse(cleaned);
    } catch (e) {
      console.warn('[generate-visual-prompt] JSON parse failed, raw text:', text);
      throw new Error('Gemini failed to return a valid JSON configuration.');
    }

    // 1. Scene Builder Layer
    const layoutMode = config.layoutMode || 'standard';
    const initialScene = createScene(config.objects || [], config.tilt || false, layoutMode);

    // 2. Rule Engine Layer
    const rule = config.transformation || { type: 'mirror_h' };
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
      
      const mutatedObjects = (config.objects || []).map(obj => ({
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

    } else if (layoutMode === 'punched_hole') {
      const punches = (config.objects || []).filter(o => o.type === 'circle' && (o.enabled !== false));
      const scale = 130 / VIEWPORT_SIZE;
      const punchesMarkup = punches.map(p => {
        return `<circle cx="${p.x * scale}" cy="${p.y * scale}" r="${4 * scale}" fill="#ffffff" stroke="#1e293b" stroke-width="2" />`;
      }).join('\n');

      const frame1 = `
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 100 100" style="display:block;max-width:100%;">
          <rect width="100" height="100" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
          <rect x="0" y="50" width="100" height="50" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="0" y="0" width="100" height="50" fill="none" stroke="#1e293b" stroke-width="2" />
          <path d="M50,75 L50,55 M45,63 L50,55 L55,63" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `.trim().replace(/\s+/g, ' ');

      const frame2 = `
        <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 100 100" style="display:block;max-width:100%;">
          <rect width="100" height="100" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
          <rect x="0" y="50" width="100" height="50" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
          <rect x="50" y="0" width="50" height="50" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3" />
          <rect x="0" y="0" width="50" height="50" fill="none" stroke="#1e293b" stroke-width="2" />
          <path d="M75,25 L55,25 M63,20 L55,25 L63,30" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `.trim().replace(/\s+/g, ' ');

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

    // Shuffle options
    const optionKeys = ['A', 'B', 'C', 'D'];
    const allOptions = shuffle([correctSvg, ...optionsSvgs]);
    const options = {};
    allOptions.forEach((svg, idx) => {
      options[optionKeys[idx]] = svg;
    });

    const correctOption = optionKeys[allOptions.indexOf(correctSvg)];
    const explanationText = `Applying the transformation rule (${rule.type.replace('_', ' ')}) yields option ${correctOption}.`;

    const usage = response.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const completionTokens = usage.candidatesTokenCount || 0;
    const totalTokens = usage.totalTokenCount || 0;
    const estimatedCost = (promptTokens * 0.075 + completionTokens * 0.30) / 1000000;

    return NextResponse.json({
      success: true,
      config,
      questionText,
      options,
      correctOption,
      explanationText,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost
      }
    });

  } catch (err) {
    console.error('[generate-visual-prompt]', err);
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
