import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  const project  = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) return null;
  return new GoogleGenAI({ vertexai: true, project, location });
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

const TEXT_TO_BLOG_PROMPT = `You are a world-class SEO content strategist and educational blog writer for Indian competitive exams (JNVST, IMO, NSO, etc.).

The user will provide you with RAW TEXT — this could be rough notes, a topic description, bullet points, or any unstructured content about a math/academic concept.

Your job is to transform this raw text into a comprehensive, polished, long-form educational blog post.

MATH FORMATTING RULES:
- Wrap all math in LaTeX inline delimiters: $formula$ (e.g. $\\frac{1}{2}$, $x^2 + y^2$)
- For display/standalone equations use: $$formula$$ on its own line
- Always double-escape backslashes in JSON strings: \\\\frac, \\\\times, \\\\div, \\\\sqrt etc.
- Never use plain text for math notation (e.g. never write "1/2", always write "$\\frac{1}{2}$")

CONTENT RULES:
- Be 1500-2500 words total
- Add step-by-step worked examples with full LaTeX math
- Add common mistakes students make
- Add exam tips specific to Indian competitive exams
- Add 3-5 practice problems with answers
- Add an FAQ section
- Use clear H2/H3 structure
- Optimize for Google SEO

Return ONLY a valid raw JSON object (no markdown fences, no explanation) matching EXACTLY this schema:

{
  "seo": {
    "title": "Full SEO page title (50-60 chars with focus keyword)",
    "slug": "url-friendly-slug",
    "metaDescription": "Compelling meta description (150-160 chars with keyword)",
    "focusKeyword": "primary SEO keyword",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "hero": {
    "headline": "Attention-grabbing H1 headline with keyword",
    "subheadline": "Supporting subtitle explaining the value of this post",
    "readTime": "8 min read",
    "difficulty": "Beginner | Intermediate | Advanced",
    "examRelevance": "Why this topic appears in the exam"
  },
  "introduction": "3-4 engaging paragraphs that hook the reader. Use \\n between paragraphs.",
  "conceptOverview": {
    "title": "Understanding [Concept]: The Foundation",
    "explanation": "2-3 paragraphs with \\n between them",
    "keyFormula": "$$formula$$",
    "formulaExplanation": "Plain-English breakdown of each part of the formula",
    "realWorldAnalogy": "A simple relatable analogy"
  },
  "stepByStepGuide": {
    "title": "Step-by-Step Method",
    "intro": "1-2 sentences introducing the method",
    "steps": [
      {
        "number": 1,
        "title": "Step title",
        "explanation": "What to do in this step",
        "example": "Example calculation: $$formula$$",
        "tip": "Optional pro tip"
      }
    ]
  },
  "workedExamples": [
    {
      "title": "Example 1: [Type of problem]",
      "problem": "Full problem statement with all necessary info",
      "solution": {
        "approach": "Brief explanation of approach",
        "steps": ["Step 1 with math: $$formula$$", "Step 2", "Step 3"],
        "answer": "Final answer: $$formula$$"
      },
      "insight": "Key learning from this example"
    }
  ],
  "commonMistakes": [
    {
      "mistake": "What students commonly do wrong",
      "why": "Why it's wrong",
      "correction": "The correct approach"
    }
  ],
  "examTips": {
    "title": "Exam Tips for JNVST / Competitive Exams",
    "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
  },
  "practiceProblems": [
    {
      "question": "Problem statement",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "answer": "A",
      "explanation": "Why this is the correct answer"
    }
  ],
  "faq": [
    {
      "question": "Common student question?",
      "answer": "Clear, helpful answer"
    }
  ],
  "conclusion": "2-3 concluding paragraphs with \\n between them",
  "callToAction": {
    "heading": "Ready to Practice?",
    "body": "Encouraging message to take the practice quiz",
    "buttonText": "Start Practice Quiz",
    "buttonUrl": "/exam-prep/jnvst"
  }
}`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { rawText, examName, additionalInstructions } = body;

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least 20 characters of text to generate from.' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json(
        { success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.' },
        { status: 501 }
      );
    }

    const userPrompt = [
      `EXAM CONTEXT: ${examName || 'JNVST Class 6'}`,
      additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : '',
      '',
      'RAW TEXT TO TRANSFORM INTO A BLOG:',
      '---',
      rawText.trim(),
      '---',
      '',
      'Transform the above raw text into a complete, polished educational blog post following the schema exactly.',
    ].filter(Boolean).join('\n');

    const model     = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
    const response  = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: TEXT_TO_BLOG_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const rawOutput = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = response.usageMetadata || {};

    let blog;
    try {
      blog = cleanAndParseJSON(rawOutput);
    } catch (parseErr) {
      console.error('[generate-blog-from-text] JSON parse error:', parseErr.message);
      return NextResponse.json(
        {
          success: false,
          error: `Gemini returned invalid JSON. Try again or simplify your input. (${parseErr.message})`,
          rawOutput: rawOutput.substring(0, 500),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      blog,
      usage: {
        promptTokens:    usage.promptTokenCount     || 0,
        candidatesTokens: usage.candidatesTokenCount || 0,
        totalTokens:     usage.totalTokenCount       || 0,
      },
    });
  } catch (err) {
    console.error('[generate-blog-from-text]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
