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

function safeJsonParse(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}');
}

function sanitizeArray(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
  return [];
}

function sanitizeDetails(details = {}) {
  const allowedScalarFields = [
    'category',
    'kind',
    'property',
    'value',
    'opposite',
    'simpleFact',
    'questionCue',
    'gradeBand',
    'difficulty',
    'sound',
    'animal',
    'adult',
    'baby',
    'shape2d',
    'shape3d',
    'color',
    'texture',
    'material',
    'length',
    'weight',
    'temperature',
    'speed',
    'phonicPrompt',
    'imagePrompt',
    'hint',
    'correctFeedback',
    'incorrectFeedback',
    'stepByStepExplanation'
  ];

  const allowedArrayFields = [
    'tags',
    'nouns',
    'verbs',
    'adjectives',
    'adverbs',
    'prepositions',
    'pronouns',
    'conjunctions',
    'articles',
    'vowels',
    'consonants'
  ];

  const output = {};
  allowedScalarFields.forEach(field => {
    const value = details[field];
    if (value !== undefined && value !== null && String(value).trim()) {
      output[field] = String(value).trim();
    }
  });

  allowedArrayFields.forEach(field => {
    const values = sanitizeArray(details[field]);
    if (values.length) output[field] = values;
  });

  return output;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item, poolId, category, subject, topic, grade } = body || {};

    if (!item || typeof item !== 'object') {
      return NextResponse.json({ success: false, error: 'Missing pool item.' }, { status: 400 });
    }

    const label = String(item.label || item.text || item.id || '').trim();
    if (!label) {
      return NextResponse.json({ success: false, error: 'Pool item needs a label, text, or id.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.' }, { status: 501 });
    }

    const prompt = `
You enrich pool item metadata for a children's K-5 learning app.

Return ONLY valid JSON. Do not include markdown.

Context:
- poolId: ${poolId || ''}
- category: ${category || ''}
- subject: ${subject || ''}
- topic: ${topic || ''}
- grade: ${grade || ''}

Item:
${JSON.stringify(item, null, 2)}

Create useful metadata fields for dynamic option-pool filtering and feedback.

Allowed output fields:
{
  "category": "",
  "kind": "",
  "property": "",
  "value": "",
  "opposite": "",
  "simpleFact": "",
  "questionCue": "",
  "tags": [],
  "gradeBand": "",
  "difficulty": "",
  "sound": "",
  "animal": "",
  "adult": "",
  "baby": "",
  "shape2d": "",
  "shape3d": "",
  "color": "",
  "texture": "",
  "material": "",
  "length": "",
  "weight": "",
  "temperature": "",
  "speed": "",
  "phonicPrompt": "",
  "imagePrompt": "",
  "hint": "",
  "correctFeedback": "",
  "incorrectFeedback": "",
  "stepByStepExplanation": "",
  "nouns": [],
  "verbs": [],
  "adjectives": [],
  "adverbs": [],
  "prepositions": [],
  "pronouns": [],
  "conjunctions": [],
  "articles": [],
  "vowels": [],
  "consonants": []
}

Rules:
- Use simple, child-safe words.
- For science object pools, fill category/kind/property/value/simpleFact/questionCue/tags/difficulty/gradeBand when relevant.
- For object properties, property should be like color, material, texture, temperature, weight, speed, shape2d, or shape3d.
- Create one short hint, correctFeedback, incorrectFeedback, and stepByStepExplanation suitable for the item/category.
- Feedback must be encouraging and simple for young learners.
- For grammar sentence pools, extract POS tags from the sentence text.
- POS arrays must contain only actual words from the item text/label.
- For imagePrompt, write one consistent child-friendly visual prompt for a clean educational image: simple object, centered, white or transparent background, no text, no watermark.
- Do not invent image or audio URLs.
- Do not include id, label, imageUrl, or audioUrl.
- If a field is not relevant, omit it or leave it empty.
`;

    const configuredModel = String(process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash').trim();
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
      console.warn('[vocabulary-pools/enrich-item] primary model failed, falling back to gemini-2.5-flash-lite:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    }

    const details = sanitizeDetails(safeJsonParse(response.text || '{}'));
    return NextResponse.json({ success: true, details });
  } catch (error) {
    console.error('[vocabulary-pools/enrich-item] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gemini enrichment failed.' }, { status: 500 });
  }
}
