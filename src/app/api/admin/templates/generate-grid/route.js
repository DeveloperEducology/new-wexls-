import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) return null;
  return new GoogleGenAI({ enterprise: true, project, location });
}

// ── Mode 1: Skill-based generation ──────────────────────────────────────────
async function generateFromSkill(ai, { skillId, skillDescription, subject, topic, grade, rowsPerLevel, targetCollection, jnvstExamId, jnvstSection, jnvstTopic }) {
  const n = Number(rowsPerLevel) || 3;
  const isCompetitive = targetCollection === 'jnvst';
  const effectiveSection = jnvstSection || subject || 'evs';
  const effectiveTopic = jnvstTopic || topic || 'general';

  const prompt = `
You are a senior curriculum designer and competitive exam expert (JNVST / Sainik School / NCERT).
Your job is to generate a complete spreadsheet-grid template for student practice.

Target Database Mode: "${isCompetitive ? 'Competitive Exam Template (JNVST)' : 'Curriculum Dynamic Template'}"
Exam ID: "${jnvstExamId || 'jnvst'}"
Section: "${effectiveSection}"
Topic: "${effectiveTopic}"
Skill ID / Slug: "${skillId}"
Skill Instructions: "${skillDescription}"
Grade Level: "${grade || '5'}"

Generate exactly ${n * 3} rows total — ${n} rows for each difficulty level:
  - L1 (Easy): straightforward, 1-step concept test
  - L2 (Medium): moderate complexity, multi-step calculation or reasoning
  - L3 (Hard): advanced problem, tricky distractors

Rules:
1. Base the questions strictly on the Skill Instructions ("${skillDescription}").
2. Column naming for Competitive / EVS / Science / Math:
   - "question_prompt": Clear question statement or parameter text (or "number", "target_word")
   - "Result": The correct answer key
   - "Distractor1", "Distractor2", "Distractor3": 3 WRONG choice options
3. NEVER use "---", "n/a", or dummy dashes in any cell value. Every cell must contain real, realistic values!
4. The blueprint must wrap variables with {{columnName}} placeholders. (e.g. "{{question_prompt}}")
5. The solution MUST be a beautifully formatted Markdown step-by-step explanation using {{columnName}} placeholders:
   - Include **📌 Correct Answer:** {{Result}}
   - Include **Step-by-Step Breakdown:** with bullet points (- ) explaining the logic clearly.
   - Include 💡 **Key Takeaway:** summary line.
6. Each row must include a "_level" field: "l1", "l2", or "l3".

Return ONLY valid JSON matching this exact shape:

{
  "title": "Short descriptive title",
  "skillId": "${skillId}",
  "subject": "${effectiveSection}",
  "topic": "${effectiveTopic}",
  "grade": "${grade || '5'}",
  "targetCollection": "${isCompetitive ? 'jnvst' : 'dynamic_templates'}",
  "columns": ["question_prompt", "Result", "Distractor1", "Distractor2", "Distractor3"],
  "rows": [
    { "_level": "l1", "question_prompt": "...", "Result": "...", "Distractor1": "...", "Distractor2": "...", "Distractor3": "..." }
  ],
  "blueprint": "{{question_prompt}}",
  "solution": "**📌 Correct Answer:** {{Result}}\n\n**Step-by-Step Breakdown:**\n- **Step 1:** Analyze the question requirement.\n- **Step 2:** {{Result}} is correct because...\n\n💡 **Key Takeaway:** Essential concept summary.",
  "optionsBinding": [
    { "column": "Result", "isCorrect": true },
    { "column": "Distractor1", "isCorrect": false },
    { "column": "Distractor2", "isCorrect": false },
    { "column": "Distractor3", "isCorrect": false }
  ]
}
`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  } catch {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  }

  const text = response.text || '';
  let cleanJson = text.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleanJson);
}

// ── Mode 2: From-question generation ──────────────────────────────────────────────
async function generateFromQuestion(ai, { questionText, options, explanation, subject, topic, targetCollection, jnvstSection, jnvstTopic }) {
  const effectiveSection = jnvstSection || subject || 'evs';
  const effectiveTopic = jnvstTopic || topic || 'general';

  const prompt = `
You are a senior curriculum architect. Take a single static multiple-choice question, its choices, and explanation, and generalize it into a dynamic spreadsheet-compatible template for section "${effectiveSection}".

Original Question: "${questionText}"
Original Choices: ${JSON.stringify(options || [], null, 2)}
Original Explanation: "${explanation || ''}"

Return ONLY one valid JSON object:
{
  "title": "A short descriptive title for the template",
  "subject": "${effectiveSection}",
  "topic": "${effectiveTopic}",
  "targetCollection": "${targetCollection === 'jnvst' ? 'jnvst' : 'dynamic_templates'}",
  "columns": ["question_prompt", "Result", "Distractor1", "Distractor2", "Distractor3"],
  "rows": [
    { "_level": "l1", "question_prompt": "value1", "Result": "correct_value", "Distractor1": "wrong1", "Distractor2": "wrong2", "Distractor3": "wrong3" },
    { "_level": "l2", "question_prompt": "value2", "Result": "correct_value", "Distractor1": "wrong1", "Distractor2": "wrong2", "Distractor3": "wrong3" },
    { "_level": "l3", "question_prompt": "value3", "Result": "correct_value", "Distractor1": "wrong1", "Distractor2": "wrong2", "Distractor3": "wrong3" }
  ],
  "blueprint": "{{question_prompt}}",
  "solution": "Step-by-step explanation. Answer: {{Result}}",
  "optionsBinding": [
    { "column": "Result", "isCorrect": true },
    { "column": "Distractor1", "isCorrect": false },
    { "column": "Distractor2", "isCorrect": false },
    { "column": "Distractor3", "isCorrect": false }
  ]
}
`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  } catch {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  }

  const text = response.text || '';
  let cleanJson = text.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleanJson);
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json(
        { success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY.' },
        { status: 501 }
      );
    }

    let templateJson;

    if (body.skillId || body.skillDescription) {
      if (!body.skillId && !body.skillDescription) {
        return NextResponse.json({ success: false, error: 'skillId or skillDescription is required.' }, { status: 400 });
      }
      templateJson = await generateFromSkill(ai, body);
    } else {
      if (!body.questionText) {
        return NextResponse.json({ success: false, error: 'questionText is required for question-to-grid mode.' }, { status: 400 });
      }
      templateJson = await generateFromQuestion(ai, body);
    }

    return NextResponse.json({ success: true, template: templateJson });
  } catch (error) {
    console.error('[templates-generate-grid] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
