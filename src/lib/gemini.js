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

/**
 * Parses image buffer headers in pure JS to retrieve native width & height.
 * Supports PNG, GIF, and JPEG formats.
 * @param {Buffer} buffer 
 * @returns {{width: number, height: number}}
 */
export function getImageDimensions(buffer) {
  try {
    // Check PNG Signature
    if (buffer.readUInt32BE(0) === 0x89504E47) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    // Check GIF Signature
    if (buffer.toString('ascii', 0, 6).startsWith('GIF')) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    // Check JPEG Signature
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0, SOF2
          return {
            height: buffer.readUInt16BE(offset + 3),
            width: buffer.readUInt16BE(offset + 5)
          };
        }
        const length = buffer.readUInt16BE(offset);
        offset += length;
      }
    }
  } catch (err) {
    console.warn('[getImageDimensions] Failed to parse image dimensions from header:', err);
  }
  return { width: 512, height: 512 }; // Default fallback
}

/**
 * Analyzes an image using Gemini 2.5 Flash Vision to extract linguistic properties
 * (singular/plural noun, article), category, and tag keywords.
 * @param {Buffer} buffer - Raw image bytes
 * @param {string} mimeType - Image MIME type (e.g. image/png, image/jpeg)
 * @returns {Promise<{singular: string, plural: string, article: string, category: string, tags: string[]}>}
 */
export async function generateIxlMetadata(buffer, mimeType) {
  const ai = getGeminiClient();
  if (!ai) {
    console.warn('[generateIxlMetadata] Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY. Using fallback.');
    return getFallbackMetadata();
  }

  // Convert buffer to base64
  const base64Image = buffer.toString('base64');

  const prompt = `
    Analyze this image and return a JSON object containing grammatical, categorization, and tag metadata.
    This metadata is for an educational curriculum platform, similar to IXL, to help generate dynamic question sentences.
    
    Return ONLY a valid JSON object matching the schema below (do not include markdown block syntax or additional text):
    {
      "singular": "the singular lowercase noun representing the primary item or subject, e.g. 'cat', 'apple', 'duck'",
      "plural": "the correct lowercase plural noun representing the item, e.g. 'cats', 'apples', 'ducks'",
      "article": "either 'a' or 'an' depending on the singular noun, e.g. 'a' for 'cat', 'an' for 'apple'",
      "category": "a single general category word, e.g. 'animals', 'food', 'vehicles', 'household', 'shapes'",
      "tags": ["3 to 5 lowercase descriptive keywords, e.g. ['fruit', 'red', 'sweet', 'fruit-clipart']"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textResult = response.text || '';
    return JSON.parse(textResult.trim());
  } catch (err) {
    console.error('[generateIxlMetadata] Error generating metadata via Gemini:', err);
    return getFallbackMetadata();
  }
}

/**
 * Generates structured questions from an image using Gemini 2.5 Flash.
 * @param {Buffer} buffer - Raw image bytes
 * @param {string} mimeType - Image MIME type (e.g. image/png, image/jpeg)
 * @param {Object} options - Configuration parameters (subject, topic, skillId, difficulty, count)
 * @returns {Promise<Array<Object>>}
 */
export async function generateQuestionsFromImage(buffer, mimeType, options = {}) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini client is not configured.');
  }

  const {
    subject = 'general',
    topic = 'general',
    skillId = 'general',
    difficulty = 'easy',
    count = 3,
    customPrompt = '',
    generationMode = 'static'
  } = options;

  const base64Image = buffer.toString('base64');

  let prompt = `
You are an expert curriculum content generator.
Analyze this uploaded educational image (which could be a worksheet, textbook page, diagram, or illustration).
We want to extract content in the following Mode: "${generationMode}".
`;

  if (generationMode === 'spreadsheet') {
    prompt += `
Extract the content of the worksheet as rows of data suited for a Tabular/Spreadsheet Grid.
Return exactly ${count} rows of parameters representing questions/answers from the worksheet.
For each row, output a JSON object matching this schema:
{
  "target_word": "The primary word or target (e.g. 'cat', '15', 'blue')",
  "target_image": "Short description of the clipart/drawing needed (e.g. 'drawing of a red apple')",
  "target_audio": "The speech/narration text to read out for this row",
  "Result": "The correct answer or matching value",
  "Result_image": "Correct answer drawing description if applicable",
  "Result_audio": "Correct answer audio text if applicable",
  "distractor_1": "Incorrect choice option 1",
  "distractor_2": "Incorrect choice option 2",
  "distractor_3": "Incorrect choice option 3",
  "explanation": "Brief explanation of the answer"
}

Notes:
1. Return ONLY a valid JSON array of these row objects. Do NOT include markdown code block syntax.
`;
  } else if (generationMode === 'dynamic') {
    prompt += `
Extract the underlying logic or question types into a dynamic template with parameterized variables.
Return exactly ${count} templates.
For each template, output a JSON object matching this schema:
{
  "templateText": "The question template with variable placeholders (e.g. 'Which [category] is a [attribute]?', 'Look at the [noun]. What starts with [letter]?')",
  "variables": [
    {
      "name": "name of variable matching placeholder",
      "type": "pool", // or "expression", "range"
      "values": ["list", "of", "candidate", "words", "or", "numbers"]
    }
  ],
  "optionsTemplate": [
    "Option 1 template with placeholders",
    "Option 2 template with placeholders"
  ],
  "explanationTemplate": "Explanation template with placeholders"
}

Notes:
1. Return ONLY a valid JSON array of these template objects. Do NOT include markdown code block syntax.
`;
  } else if (generationMode === 'pooling') {
    prompt += `
Generate a distractor option pool and correct answer bank from the theme of the worksheet.
Return a single JSON object matching this schema:
{
  "poolName": "Descriptive name of the option pool",
  "topic": "${topic}",
  "skillId": "${skillId}",
  "candidates": [
    {
      "word": "a candidate word or target",
      "distractors": ["related distractor 1", "related distractor 2", "related distractor 3"],
      "category": "subset or subtopic name"
    }
  ]
}

Notes:
1. Return ONLY a valid JSON object matching the schema. Do NOT include markdown code block syntax.
`;
  } else {
    // static (default)
    prompt += `
Extract or generate exactly ${count} multiple choice questions (MCQ) or fill-in-the-blank (FIB) questions based on the content of the image.

Details to use:
- Subject: ${subject}
- Topic: ${topic}
- Skill ID / Logic Type: ${skillId}
- Difficulty: ${difficulty}

For each question, return a JSON object matching this schema:
{
  "id": "${subject}_${topic}_${skillId}_ai_<unique_random_number>",
  "type": "mcq", // or "fillInTheBlank"
  "questionText": "The complete combined plain-text of the question",
  "voice": "Puck",
  "generateAudio": "all",
  "explanation": "Optional detailed explanation for the student based on the image",
  "options": [
    { "id": "opt_0", "label": "Option A text", "isCorrect": false },
    { "id": "opt_1", "label": "Option B text", "isCorrect": true }
  ],
  "parts": [
    { "type": "text", "content": "Instruction or intro text part" },
    { "type": "image", "content": "Description of the visual element needed from the source image (e.g. 'drawing of a sun', 'grid of blocks')" },
    { "type": "text", "content": "The actual question prompt text" }
  ],
  "correctAnswerIndex": 1, // index of option with isCorrect: true
  "answer": 1
}

Notes:
1. "parts" must represent the complete question flow in sequence (e.g. text instruction, diagram/illustration description/placeholder, then the question prompt text). Use type "text" for copy and type "image" for visual elements.
2. Return ONLY a valid JSON array of these generated objects. Do NOT include markdown code block syntax like \`\`\`json.
`;
  }

  if (customPrompt) {
    prompt += `
Additional instructions/guidelines from the creator:
"${customPrompt}"
`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textResult = response.text || '';
    const questions = JSON.parse(textResult.trim());
    const usage = response.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const completionTokens = usage.candidatesTokenCount || 0;
    const totalTokens = usage.totalTokenCount || 0;
    const estimatedCost = (promptTokens * 0.075 + completionTokens * 0.30) / 1000000;

    return {
      questions,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost
      }
    };
  } catch (err) {
    console.error('[generateQuestionsFromImage] Error parsing/generating questions via Gemini:', err);
    throw err;
  }
}

function getFallbackMetadata() {
  return {
    singular: 'item',
    plural: 'items',
    article: 'an',
    category: 'general',
    tags: ['imported-asset'],
  };
}
