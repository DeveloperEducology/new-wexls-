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

function sanitizeItem(item = {}) {
  const label = String(item.label || item.word || item.name || '').trim();
  if (!label) return null;

  const output = { label };
  const scalarFields = [
    'category',
    'kind',
    'property',
    'value',
    'opposite',
    'simpleFact',
    'questionCue',
    'hint',
    'correctFeedback',
    'incorrectFeedback',
    'stepByStepExplanation',
    'imagePrompt',
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
    'initial',
    'middle',
    'endingLetter',
    'ending',
    'rime',
    'vowelSound',
    'phonemeCue',
    'beginningPattern',
    'middlePattern',
    'endingPattern',
    'phonicPrompt'
  ];

  scalarFields.forEach(field => {
    const value = item[field];
    if (value !== undefined && value !== null && String(value).trim()) {
      output[field] = String(value).trim();
    }
  });

  ['tags', 'nouns', 'verbs', 'adjectives', 'adverbs', 'prepositions', 'pronouns', 'conjunctions', 'articles', 'vowels', 'consonants'].forEach(field => {
    const value = item[field];
    const values = Array.isArray(value)
      ? value.map(entry => String(entry).trim()).filter(Boolean)
      : typeof value === 'string'
        ? value.split(',').map(entry => entry.trim()).filter(Boolean)
        : [];
    if (values.length) output[field] = values;
  });

  return output;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      poolId,
      category,
      subject,
      topic,
      grade,
      existingLabels = [],
      count = 10,
      instruction = ''
    } = body || {};

    const targetCategory = String(category || '').trim();
    if (!targetCategory) {
      return NextResponse.json({ success: false, error: 'Category is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.' }, { status: 501 });
    }

    const safeCount = Math.max(1, Math.min(Number(count) || 10, 50));
    const prompt = `
You create reusable option-pool items for a children's K-5 learning app.

Return ONLY valid JSON. Do not include markdown.

Context:
- poolId: ${poolId || ''}
- category: ${targetCategory}
- subject: ${subject || ''}
- topic: ${topic || ''}
- grade: ${grade || ''}
- requested count: ${safeCount}
- extra teacher instruction: ${instruction || 'none'}

Existing labels to avoid:
${JSON.stringify(existingLabels.slice(0, 300))}

Return this shape:
{
  "items": [
    {
      "label": "",
      "category": "",
      "kind": "",
      "property": "",
      "value": "",
      "simpleFact": "",
      "questionCue": "",
      "hint": "",
      "correctFeedback": "",
      "incorrectFeedback": "",
      "stepByStepExplanation": "",
      "imagePrompt": "",
      "tags": [],
      "gradeBand": "",
      "difficulty": ""
    }
  ]
}

Rules:
- Generate exactly ${safeCount} useful, age-appropriate items.
- Do not repeat existing labels.
- Do not include imageUrl, audioUrl, id, or phonicSoundUrl.
- For science pools, include category/kind/property/value/simpleFact/questionCue/tags.
- For phonics pools, include initial/middle/endingLetter/ending/rime/vowelSound/phonemeCue/pattern fields when useful.
- For grammar sentence pools, include text/POS tags only if the label is a sentence.
- For imagePrompt, describe a clean educational image: centered object, white or transparent background, no text, no watermark.
- Use simple words suitable for the grade.
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
      console.warn('[vocabulary-pools/generate-words] primary model failed, falling back to gemini-2.5-flash-lite:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    }

    const parsed = safeJsonParse(response.text || '{}');
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map(sanitizeItem)
      .filter(Boolean)
      .slice(0, safeCount);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('[vocabulary-pools/generate-words] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gemini word generation failed.' }, { status: 500 });
  }
}
