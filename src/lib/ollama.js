/**
 * Ollama Local AI Integration for `new wexls`
 * Connects directly to local Ollama server (http://localhost:11434)
 * Does NOT disturb existing code or cloud API integrations.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

/**
 * Checks if the local Ollama service is active and reachable.
 * @returns {Promise<boolean>}
 */
export async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { method: 'GET' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Generates raw text response from local Ollama AI.
 * @param {string} prompt - The text prompt for AI
 * @param {string} [model] - Optional model name (defaults to 'qwen2.5:3b')
 * @param {Object} [options] - Additional options (e.g. { format: 'json' })
 * @returns {Promise<string>}
 */
export async function generateLocalAIContent(prompt, model = DEFAULT_MODEL, options = {}) {
  try {
    const body = {
      model,
      prompt,
      stream: false,
      ...options,
    };

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (err) {
    console.error('[generateLocalAIContent] Error connecting to Ollama:', err);
    throw err;
  }
}

/**
 * Safely parses JSON string, cleaning backslashes and extracting valid JSON arrays/objects.
 * @param {string} text 
 * @returns {Object|Array}
 */
function safeJSONParse(text) {
  let cleanText = text.trim();

  // 1. Strip markdown code block wrappers
  if (cleanText.includes('```')) {
    cleanText = cleanText.replace(/```(?:json)?([\s\S]*?)```/g, '$1').trim();
  }

  // 2. Extract JSON object or array bounds
  const firstBrace = cleanText.search(/[\{\[]/);
  const lastBrace = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.slice(firstBrace, lastBrace + 1);
  }

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(cleanText);
  } catch (err1) {
    // Attempt 2: Fix unescaped control characters and invalid backslash escapes
    try {
      const repaired = cleanText
        .replace(/[\u0000-\u001F]+/g, ' ') // replace control chars
        .replace(/\\([^"\\\/bfnrtu])/g, '$1'); // fix invalid escapes like \p -> p
      return JSON.parse(repaired);
    } catch (err2) {
      console.error('[safeJSONParse] Failed to parse JSON even after repair. Raw Text:', text);
      throw new Error(`Invalid JSON output from AI: ${err1.message}`);
    }
  }
}

/**
 * Generates a validated JSON object from local Ollama AI.
 * @param {string} prompt - The prompt instructing AI to output JSON
 * @param {string} [model] - Optional model name
 * @returns {Promise<Object>}
 */
export async function generateLocalAIJSON(prompt, model = DEFAULT_MODEL) {
  const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object or array matching the requested structure.`;
  
  // Use native format: 'json' parameter from Ollama API
  const rawText = await generateLocalAIContent(jsonPrompt, model, { format: 'json' });
  
  return safeJSONParse(rawText);
}
