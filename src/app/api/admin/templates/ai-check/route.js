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
    const template = body.template || body || {};

    if (!template.config && !template.questionText) {
      return NextResponse.json({ success: false, error: 'A valid template configuration is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.' }, { status: 501 });
    }

    const prompt = `
You are a strict QA Agent specializing in mathematical curriculum templates for K-12 and competitive examinations (JNVST, SSC).

Your job is to audit this dynamic, parameterized template and return a JSON validation report.

Key checks to perform:
1. **Placeholder Consistency**: Verify that every placeholder in the question template (e.g. {{improper_num_1}} or [improper_num_1]) exists in the defined variables.
2. **Mathematical Soundness**:
   - Verify that range values (e.g. min/max) are logical.
   - Check derivations: make sure formulas do not trigger division by zero, invalid expressions, or negative fractions if unexpected.
3. **LaTeX Integrity**: Check option labels for LaTeX formatting (e.g. \\frac{a}{b}). Ensure there are no unbalanced brackets or legacy brace extraction remnants.
4. **Pedagogical Alignment**: Does the template title, text, options, and explanation align with the target grade/exam category and topic?
5. **Answer Validity**: Ensure that at least one option is marked as correct and that the options are unique.

Return ONLY valid JSON with this shape:
{
  "isValid": true,
  "score": 0,
  "severity": "pass",
  "summary": "",
  "issues": [
    {
      "severity": "blocker",
      "field": "variables",
      "message": "Variable improper_denom_1 contains 0 which might cause division by zero.",
      "fix": "Increase minimum value to 1."
    }
  ],
  "suggestions": [
    "Add more options to make the question more challenging."
  ]
}

Rules:
- score must be 0-100.
- severity must be one of "pass", "warning", "blocker".
- isValid must be false if there is any blocker.
- Keep audit findings clear, brief, and educational.

Template payload:
${JSON.stringify(template, null, 2)}
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
      console.warn('[templates-ai-check] primary model failed, falling back to gemini-2.5-flash-lite:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    }

    const report = JSON.parse((response.text || '{}').trim());
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('[templates-ai-check] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'AI check failed.' }, { status: 500 });
  }
}
