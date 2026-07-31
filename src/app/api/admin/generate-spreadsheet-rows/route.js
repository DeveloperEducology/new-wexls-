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

function normalizeVertexModelName(modelName) {
  const model = String(modelName || '').trim();
  if (model === 'gemini-2.0-flash' || model === 'gemini-2.0-flash-001') return 'gemini-2.5-flash';
  return model || 'gemini-2.5-flash';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      action = 'expand_rows',
      columns = [],
      seedRows = [],
      count = 10,
      prompt: customPrompt = '',
      targetLanguage = 'Hindi',
      subject = '',
      topic = '',
      questionMode = ''
    } = body;

    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ success: false, error: 'Columns array is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini AI is not configured' }, { status: 501 });
    }

    const cleanColumns = columns.filter(c => c && c !== '_id');
    const existingExamples = seedRows.slice(0, 5).map(r => {
      const rowCopy = { ...r };
      delete rowCopy._id;
      return rowCopy;
    });

    let systemInstruction = '';
    let userPrompt = '';

    if (action === 'upgrade_distractors') {
      systemInstruction = `
You are an expert educational content author and pedagogical designer specializing in STEM and language questions for competitive exams (JNVST, IMO, NSO).
Your task is to upgrade naive or weak distractors in a spreadsheet dataset into high-quality, misconception-based educational distractors.

RULES FOR EDUCATIONAL DISTRACTORS:
1. Each distractor must target a specific, common student mistake or misconception (e.g. arithmetic operational error, incomplete factoring, spatial confusion, wrong formula).
2. For prime factorization (e.g. 12 = 2x2x3):
   - Bad distractor: 4, 5, 6 (completely arbitrary numbers)
   - Good distractor: 2x6 (student forgot to factor 6 into 2x3)
   - Good distractor: 3x4 (student forgot to factor 4 into 2x2)
   - Good distractor: 2x2x2 (multiplication error 2^3=8 instead of 12)
3. For grammar/preposition questions (e.g. "The cat is _ the bed"):
   - Bad distractor: red, big, fast (wrong word category)
   - Good distractor: under, inside, above (competing spatial prepositions)
4. Do NOT make distractors duplicate each other or the correct answer.
5. Return a valid JSON array of updated row objects. Every object MUST contain all columns: ${JSON.stringify(cleanColumns)}.
`;

      userPrompt = `
Analyze the following existing spreadsheet rows and rewrite the distractor columns (columns starting with "Distractor", "distractor_", or incorrect option candidates) to be pedagogically sound misconception-based distractors.

Columns in schema: ${JSON.stringify(cleanColumns)}
Subject: ${subject || 'general'}
Topic: ${topic || 'general'}
Question Mode: ${questionMode || 'mcq'}
${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}

Existing rows to upgrade:
${JSON.stringify(existingExamples, null, 2)}

Return ONLY a JSON array containing the upgraded versions of these rows.
`;
    } else if (action === 'custom_prompt') {
      systemInstruction = `
You are an AI assistant for a spreadsheet-based question generator.
Generates or transforms spreadsheet rows matching the requested schema and instruction.
Return ONLY a valid JSON array of objects. Each object MUST contain these exact key names: ${JSON.stringify(cleanColumns)}. Include a "_level" field set to "l1", "l2", "l3", or "l4".
`;

      userPrompt = `
Task instruction: ${customPrompt}
Columns schema: ${JSON.stringify(cleanColumns)}
Subject: ${subject || 'general'}
Topic: ${topic || 'general'}
Seed examples for style reference:
${JSON.stringify(existingExamples, null, 2)}

Generate ${count} rows matching this specification. Return ONLY a JSON array.
`;
    } else if (action === 'translate') {
      systemInstruction = `
You are a multilingual educational translator specializing in translating curriculum and competitive exam questions.
Your task is to translate the text content of the provided spreadsheet rows into ${targetLanguage}.

RULES:
1. Preserve all KaTeX math formulas (e.g. $\\frac{1}{2}$, $x^2$), numbers, and SVG tags exactly as they are.
2. Translate question text, option texts, and distractor texts into high-quality natural ${targetLanguage}.
3. Return ONLY a valid JSON array of objects. Each object MUST contain all columns: ${JSON.stringify(cleanColumns)}.
`;

      userPrompt = `
Translate these rows to ${targetLanguage}:
${JSON.stringify(seedRows, null, 2)}
`;
    } else if (action === 'generate_explanation') {
      systemInstruction = `
You are an expert tutor creating step-by-step solution explanations for questions.
Your task is to generate clear, pedagogical step-by-step explanations for each provided question row.

RULES:
1. Return ONLY a valid JSON array of objects containing all original columns plus an "explanation" or "solution" field.
2. Explanations should be simple, encouraging, and break down why the correct answer is right and why distractors are wrong.
`;

      userPrompt = `
Generate step-by-step explanations for these question rows:
${JSON.stringify(seedRows, null, 2)}
`;
    } else {
      // Default: 'expand_rows'
      systemInstruction = `
You are an expert AI curriculum author for K-12 and competitive entrance exams (JNVST, IMO, NSO).
Your task is to generate ${count} unique, high-quality question data rows for a spreadsheet template.

RULES:
1. Every row MUST be an object containing all column keys: ${JSON.stringify(cleanColumns)}.
2. Every row MUST include a "_level" property set to one of: "l1" (Easy), "l2" (Medium), "l3" (Hard), or "l4" (Challenge).
3. Distribute difficulty levels evenly across the ${count} rows.
4. Distractor values MUST be realistic misconception-based wrong answers (e.g. for prime factors of 18=2x3x3, use 2x9, 3x6, 2x3x3x3).
5. Do NOT duplicate numbers or question content across rows.
6. Return ONLY a valid JSON array. No markdown wrapper, no extra text.
`;

      userPrompt = `
Columns in spreadsheet schema: ${JSON.stringify(cleanColumns)}
Subject: ${subject || 'math'}
Topic: ${topic || 'arithmetic'}
Question Mode: ${questionMode || 'mcq'}
${customPrompt ? `Special instructions: ${customPrompt}` : ''}

Existing seed rows for reference:
${JSON.stringify(existingExamples, null, 2)}

Generate ${count} NEW unique rows. Ensure every row has accurate correct answers and misconception-based distractors.
`;
    }

    const modelName = normalizeVertexModelName(process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash');

    let response;
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: `${systemInstruction}\n\n${userPrompt}`
      });
    } catch (e) {
      console.warn('[generate-spreadsheet-rows] primary model failed, using gemini-2.5-flash-lite:', e);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `${systemInstruction}\n\n${userPrompt}`
      });
    }

    let text = (response.text || '').trim();
    
    // Strip markdown codeblock if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    let rows = [];
    try {
      rows = JSON.parse(text);
      if (!Array.isArray(rows)) {
        if (typeof rows === 'object' && rows !== null) {
          rows = rows.rows || rows.data || [rows];
        } else {
          rows = [];
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', text);
      return NextResponse.json({ success: false, error: `Invalid AI JSON output: ${parseErr.message}`, rawText: text }, { status: 500 });
    }

    // Clean up and ensure _level exists on every row
    const levels = ['l1', 'l2', 'l3', 'l4'];
    const sanitizedRows = rows.map((r, i) => {
      const cleaned = { ...r };
      if (!cleaned._level || !levels.includes(cleaned._level)) {
        cleaned._level = levels[i % levels.length];
      }
      return cleaned;
    });

    return NextResponse.json({
      success: true,
      count: sanitizedRows.length,
      rows: sanitizedRows
    });
  } catch (error) {
    console.error('Generate spreadsheet rows API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
