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
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Please set GEMINI_API_KEY.' }, { status: 501 });
    }

    const systemPrompt = `
You are an expert curriculum designer and software engineer.
Your task is to convert a raw user-provided math word problem and solution example into a parameterized template structure for an interactive practice platform.

Guidelines for parameterization:
1. **Identify Variables**: Identify names, quantities, and objects that can be varied.
2. **Double Curly Braces**: Wrap these placeholder variable names in double curly braces, e.g. {{student}}, {{friend}}, {{count1}}, {{count2}}, {{fruit}}.
3. **Ranges & Lists**: 
   - For names, subjects, or objects, provide a comma-separated string of 4 varied examples as the default value (e.g. "Marcus, Emma, Jamal, Sofia" or "apples, bananas, strawberries, oranges").
   - For numbers, provide a numeric range (e.g. "5-15" or "10-50") suitable for the problem's grade level.
4. **Kid-Friendly Solution**:
   - Turn the raw solution steps into a step-by-step kid-friendly template using the same variable placeholders.
   - For any dynamic math calculation inside the solution text, wrap the JavaScript-compatible mathematical expression using the "{= expression =}" syntax (e.g. "{= count1 + count2 =}" or "{= total / friends =}" or "{= principal * rate * time / 100 =}").
5. **Classify**: Assign an appropriate title, subject (e.g. "math", "english", "science"), topic (e.g. "addition", "division", "simple-interest"), and target grade (e.g. "1", "2", "3", "4", "5", "6").

Input text from the user:
"${prompt}"

Output MUST be a single JSON object (no markdown wrapping, no comments) matching this exact format:
{
  "title": "A short descriptive title for the template",
  "subject": "math",
  "topic": "addition",
  "grade": "1",
  "blueprint": "The parameterized question blueprint. For example:\\n{{student}} has {{count1}} {{fruit}}.\\nThey get {{count2}} more {{fruit}} from Aarav.\\nHow many {{fruit}} does {{student}} have now?",
  "solution": "The step-by-step parameterized solution. For example:\\nStep 1: Start with {{count1}} {{fruit}}.\\nStep 2: Add {{count2}} more {{fruit}} from Aarav.\\nStep 3: Add them together: {{count1}} + {{count2}} = {= count1 + count2 =} {{fruit}}!",
  "placeholders": {
    "student": "Marcus, Emma, Jamal, Sofia",
    "fruit": "apples, bananas, strawberries, oranges",
    "count1": "5-12",
    "count2": "3-8"
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textResult = response.text || '';
    const parsedData = JSON.parse(textResult.trim());

    return NextResponse.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error('[Generate Masterclass AI] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
