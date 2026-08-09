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

const BLOG_SYSTEM_PROMPT = `You are a world-class SEO content strategist, math educator, and educational blog writer. Your job is to write a comprehensive, long-form educational blog post in ENGLISH.

The blog must:
1. Be 1500-2500 words of rich content
2. Include step-by-step math walkthroughs with proper LaTeX notation
3. Be optimized for Google SEO with natural keyword usage
4. Use clear H2/H3 structure for readability
5. Include worked examples, practice problems, common mistakes, and exam tips

MATH FORMATTING RULES:
- Wrap all math in LaTeX inline delimiters: $formula$ (e.g. $\\\\frac{1}{2}$, $x^2 + y^2$)
- For display/standalone equations use: $$formula$$ (e.g. $$\\\\frac{a}{b} + \\\\frac{c}{d} = \\\\frac{ad+bc}{bd}$$)
- Always double-escape backslashes in JSON strings: write \\\\frac, \\\\times, \\\\div, \\\\sqrt, \\\\cdot, etc.
- Never use plain text for math notation

Return ONLY a valid raw JSON object (no markdown fences) matching this EXACT schema:

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
  "introduction": "3-4 engaging paragraphs that hook the reader, explain why this topic matters for the exam, and preview what they will learn. Use the focus keyword naturally 2-3 times.",
  "conceptOverview": {
    "title": "Understanding [Concept]: The Foundation",
    "explanation": "2-3 paragraphs explaining the core concept clearly for a student at this level",
    "keyFormula": "The most important formula in LaTeX: $$formula$$",
    "formulaExplanation": "Plain-English breakdown of each part of the formula",
    "realWorldAnalogy": "A simple relatable analogy that makes the concept click"
  },
  "stepByStepGuide": {
    "title": "Step-by-Step Method: [Shortcut/Technique Name]",
    "intro": "1-2 sentences introducing the method",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Step title",
        "explanation": "Clear explanation of what to do in this step",
        "math": "LaTeX for this step: $formula$",
        "proTip": "A helpful tip for this step"
      }
    ]
  },
  "workedExamples": [
    {
      "exampleNumber": 1,
      "problem": "The full problem statement",
      "difficulty": "Easy | Medium | Hard",
      "solution": {
        "approach": "Brief explanation of the approach",
        "steps": [
          {
            "stepNumber": 1,
            "action": "What we do",
            "math": "$formula$",
            "explanation": "Why we do this"
          }
        ],
        "finalAnswer": "The final answer with math: $answer$",
        "checkYourWork": "How to verify this answer"
      }
    },
    {
      "exampleNumber": 2,
      "problem": "A harder problem statement",
      "difficulty": "Medium",
      "solution": {
        "approach": "Brief explanation",
        "steps": [],
        "finalAnswer": "$answer$",
        "checkYourWork": "Verification method"
      }
    }
  ],
  "commonMistakes": [
    {
      "mistake": "Description of common error",
      "wrongApproach": "What students incorrectly do: $wrong\\_formula$",
      "correctApproach": "The right way: $correct\\_formula$",
      "memoryTrick": "A mnemonic or trick to remember the correct approach"
    }
  ],
  "examTips": {
    "title": "Exam Strategy: Crushing This Topic in the Exam",
    "tips": [
      "Specific exam tip 1 with example",
      "Specific exam tip 2 with timing advice",
      "Specific exam tip 3 about question patterns"
    ],
    "timeManagement": "How many seconds/minutes to spend on this type of problem",
    "quickCheckMethod": "A 5-second verification trick"
  },
  "practiceProblems": [
    {
      "question": "Practice problem 1 (include numbers and full context)",
      "hint": "A subtle hint",
      "answer": "Answer: $value$"
    },
    {
      "question": "Practice problem 2",
      "hint": "Hint",
      "answer": "Answer: $value$"
    },
    {
      "question": "Practice problem 3 (harder)",
      "hint": "Hint",
      "answer": "Answer: $value$"
    }
  ],
  "faq": [
    {
      "question": "Frequently asked question about this topic",
      "answer": "Clear, concise answer (2-3 sentences max)"
    },
    {
      "question": "Another common question",
      "answer": "Answer"
    },
    {
      "question": "Third question",
      "answer": "Answer"
    }
  ],
  "conclusion": "2-3 paragraphs summarizing key takeaways, encouraging the student, and reinforcing the most important formula/technique. End with a motivational note about the exam.",
  "callToAction": "An engaging CTA sentence inviting students to practice more or explore related topics"
}

IMPORTANT:
- All math MUST use LaTeX syntax with doubled backslashes (\\\\frac, \\\\times, etc.)
- Each step must be self-contained and easy to follow
- Use natural English throughout — avoid robotic language
- The workedExamples must have realistic numbers relevant to the exam level
- practiceProblems must have different difficulty levels
`;

const BLOG_GUIDE_SYSTEM_PROMPT = `You are a world-class SEO content strategist, expert educator, and educational blog writer. Your job is to write a comprehensive, long-form educational guide/article in ENGLISH.

The blog must:
1. Be 1500-2500 words of rich content
2. Be structured as a detailed, informative exam guide/overview (NOT a math concept tutorial/worksheet)
3. Be optimized for Google SEO with natural keyword usage
4. Use clear H2/H3 structure for readability
5. Detail exam structures, registration, syllabus breakdown, marks distribution, and strategies
6. NOT contain math worked examples, practice problems, or formula worksheets (keep these sections empty)

Return ONLY a valid raw JSON object (no markdown fences) matching this EXACT schema:

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
    "examRelevance": "Why this guide matters for the aspirants"
  },
  "introduction": "3-4 engaging paragraphs that hook the reader, explain the importance of the exam/syllabus details, and preview what they will learn. Use the focus keyword naturally 2-3 times.",
  "conceptOverview": {
    "title": "Exam Structure & Key Highlights",
    "explanation": "2-3 detailed paragraphs detailing the general overview, exam pattern, eligibility, and core highlights of this topic/exam",
    "keyFormula": "",
    "formulaExplanation": "",
    "realWorldAnalogy": "A relatable analogy comparing exam preparation strategy to a real-world scenario (e.g. mapping a journey, preparing for a marathon)"
  },
  "stepByStepGuide": {
    "title": "Detailed Syllabus Breakdown & Weightage",
    "intro": "A brief overview explaining the structure and marks allocation of the exam sections.",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Section Title (e.g. Mental Ability Test, Arithmetic)",
        "explanation": "Detailed paragraph breaking down the topics, chapters, and question types in this specific section.",
        "math": "",
        "proTip": "Preparation advice/strategy for this section"
      }
    ]
  },
  "workedExamples": [],
  "commonMistakes": [],
  "examTips": {
    "title": "Strategy & Preparation Hacks",
    "tips": [
      "Specific score-maximizing tip 1 (e.g. section order, time allocation)",
      "Specific score-maximizing tip 2 (e.g. shortcut tricks, skipping difficult questions)",
      "Specific score-maximizing tip 3 (e.g. OMR bubble filling strategy, no negative marking hack)"
    ],
    "timeManagement": "Recommended section-wise time allocation breakdown",
    "quickCheckMethod": "Revision strategy during the last minutes of the exam"
  },
  "practiceProblems": [],
  "faq": [
    {
      "question": "Commonly asked student/parent question 1 about registration, eligibility, or pattern",
      "answer": "Clear, informative answer (2-3 sentences max)"
    },
    {
      "question": "Commonly asked question 2",
      "answer": "Answer"
    },
    {
      "question": "Commonly asked question 3",
      "answer": "Answer"
    }
  ],
  "conclusion": "2-3 paragraphs summarizing key takeaways, motivating the aspirant, and outlining next steps in their study plan. End with a highly motivational note.",
  "callToAction": "A supportive CTA sentence inviting students to start practicing worksheets or mock tests."
}
`;

export async function POST(request) {
  const ai = getGeminiClient();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT.' },
      { status: 500 }
    );
  }

  try {
    const {
      topic = '',
      examName = 'Competitive Exam 2026',
      subject = 'Mathematics',
      concept = '',
      grade = '6',
      shortcutDetails = '',
      additionalInstructions = '',
      blogStyle = 'tutorial', // 'tutorial' | 'guide'
    } = await request.json();

    let userPrompt = '';
    if (blogStyle === 'guide') {
      userPrompt = `Generate a full SEO informative guide/overview (NOT a worksheet) for the following:

- Exam: ${examName}
- Subject: ${subject}
- Guide Topic: ${concept || topic}
- Target Grade: Grade ${grade}
- Key Highlights / Strategies: ${shortcutDetails || 'Standard overview and preparation strategy'}
${additionalInstructions ? `- Additional Instructions: ${additionalInstructions}` : ''}

Provide a comprehensive exam guide (1500-2500 words equivalent in content), with a detailed syllabus section-by-section breakdown inside "stepByStepGuide.steps", 3 exam tips, and 3 FAQ entries. Leave "workedExamples", "commonMistakes", and "practiceProblems" as empty arrays.`;
    } else {
      userPrompt = `Generate a full SEO blog post with step-by-step math (worksheet style) for the following:

- Exam: ${examName}
- Subject: ${subject}
- Concept/Topic: ${concept || topic}
- Grade Level: Grade ${grade}
- Key Shortcut / Technique to Explain: ${shortcutDetails || 'Standard approach with shortcuts'}
${additionalInstructions ? `- Additional Instructions: ${additionalInstructions}` : ''}

Make the blog comprehensive (1500-2500 words equivalent in content), with at least 2 fully worked examples each having 4-6 steps with math at each step, 3 practice problems, 3 common mistakes, 3 exam tips, and 3 FAQ entries.`;
    }

    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: blogStyle === 'guide' ? BLOG_GUIDE_SYSTEM_PROMPT : BLOG_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'No content returned from Gemini.' }, { status: 500 });
    }

    let blogData;
    try {
      blogData = cleanAndParseJSON(rawText);
    } catch (parseErr) {
      console.error('[generate-blog] JSON parse error:', parseErr.message);
      return NextResponse.json({
        success: false,
        error: 'JSON parse failed: ' + parseErr.message,
        rawText: rawText.substring(0, 500),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blog: blogData,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });
  } catch (err) {
    console.error('[generate-blog] error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
