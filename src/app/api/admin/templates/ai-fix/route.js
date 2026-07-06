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

export async function POST(request) {
  try {
    const body = await request.json();
    const template = body.template || {};
    const report = body.report || {};

    if (!template.config && !template.questionText) {
      return NextResponse.json({ success: false, error: 'A template payload is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY.' }, { status: 501 });
    }

    const prompt = `
You are a senior AI math curriculum engineer. Your task is to refactor and fix the mathematical template JSON recipe based on the provided QA Audit Report.

Audit Report findings to resolve:
${JSON.stringify(report, null, 2)}

Template to repair:
${JSON.stringify(template, null, 2)}

Instructions:
1. Fix all blocker and warning issues described in the Audit Report.
2. Ensure variable names in "variables" are simple alphanumeric/underscore identifiers. NEVER define expressions/formulas (like "num1 * multiplier") as variable keys. Instead, define basic parameters (like "num1", "multiplier") as variables and define their calculations as expressions under "derivations".
3. Verify that denominators cannot generate 0 (minimum range values must be >= 1).
4. Verify LaTeX tags (use clean double braces, e.g. \\frac{ {{num}} }{ {{den}} }).
5. Maintain the correct examId, section, topic, and schema structures.
6. The final output must be syntactically valid JSON representing the fully repaired template.

Return ONLY the corrected JSON template matching the input structure, without any markdown backticks.
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
      console.warn('[templates-ai-fix] primary model failed, falling back to gemini-2.5-flash-lite:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    }

    const fixedTemplate = JSON.parse((response.text || '{}').trim());
    return NextResponse.json({ success: true, fixedTemplate });
  } catch (error) {
    console.error('[templates-ai-fix] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'AI repair failed.' }, { status: 500 });
  }
}
