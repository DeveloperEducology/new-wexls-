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

function escapeUnescapedQuotes(str) {
  let result = '';
  let inString = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (char === '"') {
      let backslashes = 0;
      let idx = i - 1;
      while (idx >= 0 && str[idx] === '\\') {
        backslashes++;
        idx--;
      }
      const isEscaped = backslashes % 2 !== 0;
      
      if (isEscaped) {
        result += char;
        continue;
      }
      
      if (!inString) {
        inString = true;
        result += char;
      } else {
        let nextIdx = i + 1;
        while (nextIdx < str.length && /\s/.test(str[nextIdx])) {
          nextIdx++;
        }
        const nextChar = str[nextIdx];
        
        let isClosing = false;
        
        if (nextChar === ':') {
          let afterColonIdx = nextIdx + 1;
          while (afterColonIdx < str.length && /\s/.test(str[afterColonIdx])) {
            afterColonIdx++;
          }
          const afterColonChar = str[afterColonIdx];
          if (['"', '[', '{', 't', 'f', 'n', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'].includes(afterColonChar)) {
            isClosing = true;
          }
        } else if (nextChar === ',') {
          let afterCommaIdx = nextIdx + 1;
          while (afterCommaIdx < str.length && /\s/.test(str[afterCommaIdx])) {
            afterCommaIdx++;
          }
          const afterCommaChar = str[afterCommaIdx];
          if (['"', '}', ']', '[', '{', 't', 'f', 'n', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-'].includes(afterCommaChar)) {
            isClosing = true;
          }
        } else if (nextChar === '}' || nextChar === ']' || nextChar === undefined) {
          isClosing = true;
        }
        
        if (isClosing) {
          inString = false;
          result += char;
        } else {
          result += '\\"';
        }
      }
    } else {
      result += char;
    }
  }
  return result;
}

function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  cleaned = escapeUnescapedQuotes(cleaned);

  let result = '';
  let inString = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (char === '"') {
      let backslashes = 0;
      let idx = i - 1;
      while (idx >= 0 && cleaned[idx] === '\\') {
        backslashes++;
        idx--;
      }
      if (backslashes % 2 === 0) {
        inString = !inString;
      }
      result += char;
    } else if (char === '\\' && inString) {
      const nextChar = cleaned[i + 1];
      if (nextChar === 'n' || nextChar === '"' || nextChar === '\\') {
        result += char;
      } else {
        result += '\\\\';
      }
    } else {
      if (inString && (char === '\n' || char === '\r')) {
        result += '\\n';
      } else {
        result += char;
      }
    }
  }

  let jsonString = result;
  jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("JSON parsing failed. Raw string (first 500 chars):", jsonString.substring(0, 500));
    console.error("Error details:", err);
    throw err;
  }
}

export async function POST(request) {
  const ai = getGeminiClient();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.' },
      { status: 500 }
    );
  }

  try {
    const { systemPrompt = '', inputJson = '' } = await request.json();

    if (!systemPrompt.trim()) {
      return NextResponse.json({ success: false, error: 'systemPrompt is required.' }, { status: 400 });
    }

    // Build user message: if inputJson is provided, append it
    let userMessage = systemPrompt.trim();
    if (inputJson.trim()) {
      // Try to parse to validate, but send as-is for Gemini
      try {
        JSON.parse(inputJson);
      } catch {
        return NextResponse.json({ success: false, error: 'inputJson must be valid JSON.' }, { status: 400 });
      }
      userMessage = `${systemPrompt.trim()}\n\nInput JSON:\n${inputJson.trim()}`;
    }

    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { temperature: 0.7 },
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'No content returned from Gemini.' }, { status: 500 });
    }

    // Try to parse as JSON; fall back to returning raw text
    let parsedData = null;
    let isJson = false;
    try {
      parsedData = cleanAndParseJSON(rawText);
      isJson = true;
    } catch {
      // Not JSON — return raw text so the UI can display it
      parsedData = rawText;
    }

    return NextResponse.json({
      success: true,
      isJson,
      result: parsedData,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });
  } catch (err) {
    console.error('[generate-custom] error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
