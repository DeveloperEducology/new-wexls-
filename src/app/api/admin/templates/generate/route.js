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
    const { prompt, subject, topic } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT for ADC auth or GEMINI_API_KEY.' }, { status: 501 });
    }

    const generationPrompt = `
You are a curriculum developer and math/english educational template builder.
Create a dynamic question template based on the following user instructions:
"${prompt}"

Required metadata context to embed:
- Subject: ${subject || 'math'}
- Topic: ${topic || 'general'}

Dynamic Question Template JSON Schema:
The output must be a single valid JSON object representing the dynamic question template recipe. 
Do NOT wrap the output in markdown code blocks like \`\`\`json. Return only the JSON object.

Template fields to populate:
{
  "id": "Descriptive kebab-case ID, e.g. 'math-addition-counting-apples'",
  "title": "A short, engaging title for this template",
  "subject": "${subject || 'math'}",
  "topic": "${topic || 'general'}",
  "layout": "prompt_top_visual_center_options_bottom", // Choose layout: 'prompt_top_visual_center_options_bottom' (default), 'prompt_left_options_right_visual_center', or similar.
  "variables": [
    // Array of dynamic variables. Types can be:
    // - "integer": must have "min" and "max" (number strings or formulas like "A - 1")
    // - "list": must have "items" (array of strings or numbers)
    // - "expression": must have "formula" (javascript expression using other variables, e.g. "A + B")
    // Example: { "name": "A", "type": "integer", "min": "5", "max": "10" }
  ],
  "visuals": [
    // Optional array of visual component definitions. Supported components:
    // - "TenFrame": props: { "filledCount": "A", "crossedOutCount": "B" (optional), "color": "red" }
    // - "JarOfMarbles": props: { "colorA": "blue", "countA": "A", "colorB": "red", "countB": "B" }
    // - "Spinner": props: { "colorA": "blue", "sectorsA": "A", "colorB": "green", "sectorsB": "B" }
    // - "ItemCounter": props: { "count": "A", "itemType": "cupcake" (use standard items like apple, frog, cookie, star) }
    // - "VisualChoice": props: { "correctCount": "A", "itemType": "cupcake", "distractorMode": "auto" }
    // - "Image": props: { "imageUrl": "URL to R2 image asset", "width": "200" }
    // Example: { "component": "TenFrame", "props": { "filledCount": "A", "color": "blue" } }
  ],
  "questionText": "The question prompt. Include variable placeholders in square brackets, e.g. 'What is [A] plus [B]?'",
  "optionsType": "mcq" | "fillInTheBlank" | "categorizationv2" | "visual_choice",
  "options": [
    // For MCQ: Array of 4 choices. One choice must have "isCorrect": true. Use variables like "[Result]"
    // Example: [ { "label": "[Result]", "isCorrect": true }, { "label": "[Result] + 1", "isCorrect": false }, ... ]
  ],
  "parts": [
    // For Fill-in-the-blank or Categorization.
    // If fillInTheBlank: { "type": "text", "content": "Sentence containing double bracket blank, e.g., 'The sum is [[ans]].'" }
    // If categorizationv2: { "type": "categorizationv2", "categories": [ { "id": "even", "label": "Even" }, ... ], "items": [ { "id": "item1", "content": "[A]" }, ... ] }
  ],
  "answer": {
    // For FIB: { "ans": "[Result]" }
    // For Categorization: { "item1": "even", "item2": "odd" }
  },
  "explanation": {
    "sections": [
      { "type": "text", "content": "A detailed explanation of how to solve the question, referencing variables in square brackets, e.g. '[A] + [B] = [Result] because...'" }
    ]
  }
}

Constraint checklist:
1. Ensure all mathematical expressions are mathematically sound.
2. For MCQ, generate exactly 4 options.
3. For FIB, use double brackets like [[ans]] in parts and specify the target mapping in "answer".
4. Choose the most relevant visual component (TenFrame, Spinner, ItemCounter, etc.) to match the question topic.

Return ONLY a valid JSON object. Do not output any other text or wrapping.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: generationPrompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
    } catch (primaryError) {
      console.warn('[templates-generate] gemini-2.5-flash failed, falling back to gemini-2.0-flash. Error:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: generationPrompt,
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
    console.error('[templates-generate] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
