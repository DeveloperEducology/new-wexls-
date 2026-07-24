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
async function generateFromSkill(ai, { skillId, skillDescription, subject, topic, grade, rowsPerLevel }) {
  const n = Number(rowsPerLevel) || 3;
  const prompt = `
You are a senior curriculum designer and curriculum engineer.
Your job is to generate a complete spreadsheet-grid template for a student practice question.

Skill ID: "${skillId}"
Skill Description: "${skillDescription}"
Subject: "${subject || 'math'}"
Topic: "${topic || 'general'}"
Grade: "${grade || '3'}"

Generate exactly ${n * 3} rows total — ${n} rows for each difficulty level:
  - L1 (Easy): simpler numbers or basic vocabulary, straightforward, 1-step
  - L2 (Medium): moderate complexity, compound words, phonics patterns
  - L3 (Hard): advanced words/math problems, tricky distractors

Rules:
1. Choose meaningful column names based on the subject:
   - For Math: e.g. "number", "Result", "Distractor1", "Distractor2", "Distractor3"
   - For English / Phonics / Vocabulary / Spelling:
     * "target_word": The full target word (e.g. "cat", "pencil", "pig") - NEVER use "---" or placeholders!
     * "target_image": Image URL
     * "target_audio": Audio TTS URL
     * "Result": The correct answer (e.g. "c" or "cat")
     * "Distractor1", "Distractor2", "Distractor3": WRONG options (e.g. "i", "p", "a"), NOT the letters of the target word!
2. NEVER use "---", "n/a", or dummy dashes in any cell value. Every cell must contain a real, valid value!
3. Always have exactly one correct option column and 2 or 3 distractor option columns.
4. For English templates with Audio and Images:
   - Always populate audio column values using the TTS voice synthesis format: \`/api/tts?voice=Puck&text=WORD\` (e.g. \`/api/tts?voice=Puck&text=feet\`).
   - Populate image column values using standard R2 clipart link format: \`https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/WORD.jpg\` (e.g. \`https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/feet.jpg\` or \`https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/WORD.png\`).
5. The blueprint must use {{columnName}} placeholders. Do NOT repeat answer variables in text unless intended. For spelling, use: \`Listen to the word. Then, spell it.\n\n![{{target_word}}]({{target_image}})\`
6. The solution must be a clear step-by-step explanation using {{columnName}} placeholders.
7. Each row must include a "_level" field: "l1", "l2", or "l3".


Return ONLY valid JSON. No markdown fences. No comments. Use this exact shape:

{
  "title": "Short descriptive title",
  "skillId": "${skillId}",
  "subject": "${subject || 'math'}",
  "topic": "${topic || 'general'}",
  "grade": "${grade || '3'}",
  "targetCollection": "dynamic_templates",
  "columns": ["col1", "col2", "Result", "Distractor1", "Distractor2"],
  "rows": [
    { "_level": "l1", "col1": "...", "Result": "...", "Distractor1": "...", "Distractor2": "..." }
  ],
  "blueprint": "Question text using {{col1}} etc.",
  "solution": "Step-by-step explanation: ... Answer: {{Result}}",
  "optionsBinding": [
    { "column": "Result", "imageColumn": "Result_image", "audioColumn": "Result_audio", "isCorrect": true },
    { "column": "Distractor1", "imageColumn": "Distractor1_image", "audioColumn": "Distractor1_audio", "isCorrect": false },
    { "column": "Distractor2", "imageColumn": "Distractor2_image", "audioColumn": "Distractor2_audio", "isCorrect": false }
  ]
}

Note: For Math, leave "imageColumn" and "audioColumn" out of "optionsBinding" (or set to null/empty). For English, map them to the corresponding column names.
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
  return JSON.parse(text.trim());
}

// ── Mode 2: From-question generation (existing) ──────────────────────────────
async function generateFromQuestion(ai, { questionText, options, explanation, subject, topic }) {
  const prompt = `
You are a senior curriculum architect. Your task is to take a single static multiple-choice question, its choices, and its step-by-step explanation, and generalize it into a dynamic spreadsheet-compatible template.

Original Static Question:
"${questionText}"

Original Choices:
${JSON.stringify(options || [], null, 2)}

Original Explanation:
"${explanation || ''}"

Target Subject: "${subject || 'math'}"
Target Topic: "${topic || 'general'}"

Return ONLY one valid JSON object. Do not wrap it in markdown. Do not include comments.

The JSON object must have this exact shape:
{
  "title": "A short descriptive title for the template",
  "subject": "${subject || 'math'}",
  "topic": "${topic || 'general'}",
  "targetCollection": "dynamic_templates",
  "columns": ["col1", "col2", "Result", "Distractor1", "Distractor2", "Distractor3"],
  "rows": [
    { "_level": "l1", "col1": "value1_row1", "Result": "correct_value_row1", "Distractor1": "wrong1_row1", "Distractor2": "wrong2_row1", "Distractor3": "wrong3_row1" },
    { "_level": "l2", "col1": "value1_row2", "Result": "correct_value_row2", "Distractor1": "wrong1_row2", "Distractor2": "wrong2_row2", "Distractor3": "wrong3_row2" },
    { "_level": "l3", "col1": "value1_row3", "Result": "correct_value_row3", "Distractor1": "wrong1_row3", "Distractor2": "wrong2_row3", "Distractor3": "wrong3_row3" }
  ],
  "blueprint": "The question text with variables wrapped in double-braces like {{colName}}",
  "solution": "The step-by-step explanation, replacing specific values with double-braces like {{colName}}",
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
  return JSON.parse(text.trim());
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

    // Mode 1: skill-based
    if (body.skillId || body.skillDescription) {
      if (!body.skillId && !body.skillDescription) {
        return NextResponse.json({ success: false, error: 'skillId or skillDescription is required.' }, { status: 400 });
      }
      templateJson = await generateFromSkill(ai, body);
    } else {
      // Mode 2: from-question
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
