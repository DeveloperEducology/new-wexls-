import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client using the environment API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

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
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[generateIxlMetadata] GEMINI_API_KEY is not defined. Using fallback.');
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

function getFallbackMetadata() {
  return {
    singular: 'item',
    plural: 'items',
    article: 'an',
    category: 'general',
    tags: ['imported-asset'],
  };
}
