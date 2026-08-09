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

export async function POST(request) {
  try {
    const { displayName, description } = await request.json();
    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini client is not configured on this server.' }, { status: 501 });
    }

    const prompt = `
      You are an expert educational curriculum writer and illustrator, similar to an editor at IXL or Khan Academy.
      Write a comprehensive, premium study lesson explainer for Class 6 students about the topic: "${displayName}".
      Topic Description Context: "${description || 'None provided'}"
      
      Generate a beautifully structured lesson config that includes:
      1. An introduction section explaining the core concept in friendly terms.
      2. A rules box or formula card.
      3. A visual comparison grid table or grid breakdown showing values.
      4. A step-by-step worked example with instruction sentences and clean formula steps.
      
      Return ONLY a valid JSON object matching the schema below (do not include markdown block syntax or additional text):
      {
        "sections": [
          {
            "type": "introduction",
            "heading": "What is/are [Topic]?",
            "content": "Explanation paragraph. Use LaTeX math markers like $a:b$ or $x^2$ for formulas and double asterisks **text** for bold accents.",
            "callout": {
              "title": "💡 Tip or 🏷️ Key Terms",
              "text": "Additional callout text or list of terms with bullet definitions."
            }
          },
          {
            "type": "rule-box",
            "heading": "Core Formula / General Rules",
            "bullets": [
              "**Formula**: $Formula Equation$",
              "Important rule 1...",
              "Important rule 2..."
            ]
          },
          {
            "type": "visual-grid",
            "heading": "Visualizing [Topic]",
            "description": "Short explanation of the following comparison table...",
            "table": {
              "headers": ["Header Column 1", "Header Column 2", "Header Column 3"],
              "rows": [
                ["Row 1 Cell 1 value", "🔵 🔵 ⚪ Visual representation", "Result/Formulas"],
                ["Row 2 Cell 1 value", "🔵 🔵 🔵 🔵 ⚪ ⚪ Visual representation", "Result/Formulas"]
              ]
            }
          },
          {
            "type": "worked-example",
            "heading": "Worked Example: Solving a Problem",
            "prompt": "The question prompt or word problem to solve, e.g. 'Calculate the missing term: $3:5 = 12:?$', using math symbols.",
            "steps": [
              {
                "stepNumber": 1,
                "instruction": "Step 1 instruction text...",
                "formula": "Math step formula (e.g. \\\\frac{3}{5} = \\\\frac{12}{x})"
              },
              {
                "stepNumber": 2,
                "instruction": "Step 2 instruction text...",
                "formula": "x = 20"
              }
            ],
            "pitfall": {
              "title": "⚠️ Common Mistake or 💡 Pro Tip",
              "text": "Explain a common error students make, or a trick to solve this faster."
            }
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textResult = response.text || '';
    const lessonJson = JSON.parse(textResult.trim());

    return NextResponse.json({ lessonJson });
  } catch (err) {
    console.error('[generate-lesson] Error:', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
