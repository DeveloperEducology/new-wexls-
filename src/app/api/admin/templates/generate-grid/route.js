import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) {
    return null;
  }

  return new GoogleGenAI({
    enterprise: true,
    project,
    location,
  });
}

export async function POST(request) {
  try {
    const { questionText, options, explanation, subject, topic } = await request.json();

    if (!questionText) {
      return NextResponse.json({ success: false, error: 'Question text is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.' }, { status: 501 });
    }

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
  "targetCollection": "templates",
  "columns": ["col1", "col2", "Result", "Distractor1", "Distractor2", "Distractor3"],
  "rows": [
    {
      "col1": "value1_row1",
      "col2": "value2_row1",
      "Result": "correct_value_row1",
      "Distractor1": "wrong1_row1",
      "Distractor2": "wrong2_row1",
      "Distractor3": "wrong3_row1"
    },
    {
      "col1": "value1_row2",
      "col2": "value2_row2",
      "Result": "correct_value_row2",
      "Distractor1": "wrong1_row2",
      "Distractor2": "wrong2_row2",
      "Distractor3": "wrong3_row2"
    },
    {
      "col1": "value1_row3",
      "col2": "value2_row3",
      "Result": "correct_value_row3",
      "Distractor1": "wrong1_row3",
      "Distractor2": "wrong2_row3",
      "Distractor3": "wrong3_row3"
    }
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

Instructions for generalization:
1. Analyze the original static question: Identify the key variable values (e.g. numbers, words, names, expressions).
2. Create column names for these variables. Make one column (e.g. "Result") represent the correct answer, and others represent the incorrect distractors.
3. Write the "rows" array. You MUST generate at least 3 distinct variations (rows) of the variables, showing how they change together.
4. Replace the specific numbers or terms in the question and explanation with double-braces syntax: {{columnName}}.
5. If the question has mathematical expressions, format them beautifully in standard LaTeX notation (using $...$ for inline or $$...$$ for block).
6. Ensure that the generated options in the rows mathematically match the question details for that row.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
    } catch (primaryError) {
      console.warn('[templates-generate-grid] gemini-2.5-flash failed, falling back to gemini-2.5-flash-lite. Error:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
    }

    const text = response.text || '';
    const templateJson = JSON.parse(text.trim());

    return NextResponse.json({
      success: true,
      template: templateJson
    });
  } catch (error) {
    console.error('[templates-generate-grid] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
