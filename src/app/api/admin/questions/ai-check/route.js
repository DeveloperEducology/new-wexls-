import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) return null;

  return new GoogleGenAI({
    enterprise: true,
    project,
    location,
  });
}

function compactQuestionPayload(payload) {
  const compact = {
    subject: payload.subject,
    topic: payload.topic,
    skillId: payload.skillId,
    difficulty: payload.difficulty,
    type: payload.type,
    interaction: payload.interaction,
    layoutMode: payload.layoutMode,
    missingLetterMode: payload.missingLetterMode,
    questionText: payload.questionText,
    poolId: payload.poolId,
    targetCategory: payload.targetCategory,
    distractorCategories: payload.distractorCategories,
    options: payload.options,
    parts: payload.parts,
    categories: payload.categories,
    items: payload.items,
    wordCards: payload.wordCards,
    answer: payload.answer,
    correctAnswer: payload.correctAnswer,
    correctAnswerIndex: payload.correctAnswerIndex,
    explanation: payload.explanation,
    feedback: payload.feedback,
    metadata: payload.metadata,
    poolSummary: payload.poolSummary,
  };

  return JSON.parse(JSON.stringify(compact, (_key, value) => {
    if (typeof value === 'string' && value.length > 800) return `${value.slice(0, 800)}...`;
    return value;
  }));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = compactQuestionPayload(body?.question || body || {});

    if (!payload.questionText && !payload.parts?.length) {
      return NextResponse.json({ success: false, error: 'Question text or parts are required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT for ADC auth or GEMINI_API_KEY.' }, { status: 501 });
    }

    const prompt = `
You are a strict educational content QA reviewer for a K-10 learning app.

Review this question authoring payload. Check only the given JSON. Do not invent missing assets.

Evaluate:
- child-friendly clarity and grammar
- grade/subject/topic fit
- answer correctness and ambiguity
- option quality and duplicate/near-duplicate choices
- validation risk
- dynamic pool logic
- word-completion phonics logic when present:
  - beginning mode should use initial / beginningPattern
  - middle mode should use middle / middlePattern
  - ending mode should use endingLetter / endingPattern
  - random category is valid if at least one pool category has enough words
- feedback and explanation usefulness
- missing image/audio assets only as warnings, not blockers, unless the question cannot function without them

Return ONLY valid JSON with this shape:
{
  "isValid": true,
  "score": 0,
  "severity": "pass",
  "summary": "",
  "issues": [
    {
      "severity": "blocker",
      "field": "questionText",
      "message": "",
      "fix": ""
    }
  ],
  "suggestions": [],
  "fixedQuestionText": "",
  "recommendedDifficulty": "",
  "recommendedFeedback": {
    "correct": "",
    "incorrect": "",
    "hint": "",
    "explanation": ""
  }
}

Rules:
- score must be 0-100.
- severity must be one of "pass", "warning", "blocker".
- isValid is false if there is any blocker.
- Keep messages short and actionable.

Question payload:
${JSON.stringify(payload, null, 2)}
`;

    const configuredModel = String(process.env.GEMINI_QA_MODEL || 'gemini-2.5-flash').trim();
    const primaryModel = configuredModel === 'gemini-2.0-flash' || configuredModel === 'gemini-2.0-flash-001'
      ? 'gemini-2.5-flash'
      : configuredModel;

    let response;
    try {
      response = await ai.models.generateContent({
        model: primaryModel,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    } catch (primaryError) {
      console.warn('[questions-ai-check] primary model failed, falling back to gemini-2.5-flash-lite:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    }

    const report = JSON.parse((response.text || '{}').trim());
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('[questions-ai-check] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'AI check failed.' }, { status: 500 });
  }
}
