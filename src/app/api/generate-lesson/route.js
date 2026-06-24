import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { saveRawGeminiGeneration } from '@/lib/lessons/store';

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

function escapeNewlinesInsideStrings(str) {
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    if (inString && (char === '\n' || char === '\r')) {
      result += '\\n';
    } else {
      result += char;
    }
    if (char === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }
  return result;
}

function repairBackslashes(text) {
  let repaired = text.replace(/\\\\/g, '___DB_BS___');
  repaired = repaired.replace(/\\(?!["n])/g, '\\\\');
  repaired = repaired.replace(/___DB_BS___/g, '\\\\');
  return repaired;
}

function escapeUnescapedQuotes(str) {
  let result = '';
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '\\' && !escaped) {
      escaped = true;
      result += char;
      continue;
    }
    if (char === '"' && !escaped) {
      const beforeStr = str.substring(Math.max(0, i - 10), i);
      const afterStr = str.substring(i + 1, Math.min(str.length, i + 11));
      
      const cleanBefore = beforeStr.trim();
      const cleanAfter = afterStr.trim();
      
      const isValidBefore = 
        cleanBefore.endsWith(':') || 
        cleanBefore.endsWith(',') || 
        cleanBefore.endsWith('{') || 
        cleanBefore.endsWith('[') ||
        cleanBefore === '';
        
      const isValidAfter = 
        cleanAfter.startsWith(':') || 
        cleanAfter.startsWith(',') || 
        cleanAfter.startsWith('}') || 
        cleanAfter.startsWith(']') ||
        cleanAfter === '';
        
      if (!isValidBefore && !isValidAfter) {
        result += '\\"';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
    escaped = false;
  }
  return result;
}

function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  cleaned = escapeNewlinesInsideStrings(cleaned);
  cleaned = repairBackslashes(cleaned);
  cleaned = escapeUnescapedQuotes(cleaned);
  return JSON.parse(cleaned);
}

export async function POST(request) {
  const ai = getGeminiClient();
  if (!ai) {
    return NextResponse.json(
      {
        success: false,
        error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.',
      },
      { status: 500 }
    );
  }

  try {
    const { 
      topic = 'Writing Linear Equations from Scenarios', 
      tone = 'teacher',
      format = 'guided',
      activeSections = {},
      customInstructions = '',
      jsonConfig = null
    } = await request.json();

    const systemInstruction = `
      You are an expert curriculum designer and educator. You generate highly detailed, printable guided notes and worksheets for middle school students.
      
      You must write the entire content (definitions, worked examples, explanations, and practice scenarios) in the requested tone/persona:
      - 'teacher': Standard classroom explanation, clear, professional, well-structured.
      - 'tutor': Encouraging, conversational 1-on-1 tutoring, guiding the student step-by-step with supportive remarks.
      - 'eli5': Explain Like I'm 5 years old. Use extremely simple words, playful analogies (e.g. cookies, candy, toy blocks, sharing toys, animal pets), and a fun, story-like approach.
      - 'storyteller': Explaining the topic as an adventure story, setting each concept, worked example, and practice scenario as part of a narrative quest or mission.

      IMPORTANT MATH FORMATTING & JSON ESCAPING:
      - Always wrap mathematical formulas, equations, variables, operations, and expressions in inline math delimiters like '$' (e.g. '$y = mx + b$', '$v_{ix} = v_i \\cdot \\cos(\\theta)$', '$t^2$').
      - Do not mix plain explanatory text inside the math delimiters.
      - Never use backticks (\`) or code blocks to format math variables or equations.
      - For standalone/display equations, use double dollar signs '$$' (e.g. '$$\\Delta x = v_x \\cdot t$$').
      - CRITICAL: Since you are generating JSON, any backslash character (\\) inside the JSON strings MUST be escaped as double backslashes (\\\\). For example: write '\\\\Delta' instead of '\\Delta', '\\\\cdot' instead of '\\cdot', and '\\\\cos' instead of '\\cos'.
      - CRITICAL: Any double quote character (") inside a JSON string value MUST be escaped as '\\"'. For example, if you want to write 'the "intercept" of the line', you MUST write 'the \\\\"intercept\\\\" of the line' in the JSON string.

      DOCUMENT FORMAT CONFIGURATION:
      - Requested Format Style: '${format}'
      - You must adhere to the Active Sections configuration below. If a section is marked as false (disabled), you MUST output 'null' for that section's key in the JSON response. Do not generate content for disabled sections.
      
      Active Sections:
      * keyConcept: ${activeSections.keyConcept !== false}
      * howToIdentify: ${activeSections.howToIdentify !== false}
      * workedExample: ${activeSections.workedExample !== false}
      * checkYourUnderstanding: ${activeSections.checkYourUnderstanding !== false}
      * guidedPractice: ${activeSections.guidedPractice !== false}
      * independentPractice: ${activeSections.independentPractice !== false}
      * extensionChallenge: ${activeSections.extensionChallenge !== false}

      Additional Layout & Formatting Guidelines:
      ${customInstructions ? `CRITICAL USER INSTRUCTION: ${customInstructions}` : 'None'}

      DIAGRAM GENERATION (MERMAID.JS):
      - If the keyConcept or workedExample would benefit from a visual flowchart, hierarchy, cycle, or sequence map, generate a valid Mermaid.js diagram code under the "diagram" field.
      - Use simple, standard Mermaid flowchart syntax starting with 'graph TD' or 'graph LR'.
      - CRITICAL: Every node MUST start with a simple alphanumeric identifier (e.g., A, B, C) and have its label wrapped in double quotes (e.g., A["Magma"], B["Igneous Rock"]). Never start a line or node directly with brackets (do NOT write '[Magma] --> B').
      - CRITICAL: For arrow/link labels, keep them short (1-3 words) and use plain alphanumeric characters and spaces only. NEVER use parentheses, quotes, or special symbols in arrow labels (e.g., write 'A -->|Cooling| B', NOT 'A -->|Cooling (underground)| B').
      - Keep diagrams concise (typically 3-6 nodes) and highly educational.
      - If no diagram is useful or relevant for the topic, set the "diagram" field to null.

      IMPORTANT: Integrate appropriate, expressive emojis throughout all sections (titles, concepts, keyword descriptions, worked examples, questions, and answers) to act as visual guides/indicators and make the sheet highly engaging and visually explanatory. For example, use mathematical or concept-relevant symbols (e.g., 📈, 📍, 💵, ➕, ➖, 🛠️, 💡, 📝, 🧭, 🎒).
    `;

    const prompt = `
      Create a complete, detailed Guided Notes & Practice Worksheet for the topic: "${topic}".
      The tone of explanation should be exactly: "${tone}".
      ${jsonConfig ? `
      CRITICAL: Use the following specific JSON configuration input to tailor all questions, scenarios, concepts, and formulas:
      ${JSON.stringify(jsonConfig, null, 2)}
      ` : ''}
      
      Generate the worksheet content in a strict JSON format matching the schema below.
      The style should be a print-ready handout including:
      1. Title, key concept explanation, and formula.
      2. Keywords/identifiers to help students distinguish key components.
      3. A step-by-step worked example with scenario, steps, and final solution.
      4. A "Check Your Understanding" section (fill-in-the-blank statements + a reflection prompt).
      5. "Guided Practice" with 3 scenario blocks.
      6. "Independent Practice" with 4 real-world scenarios, each containing a question A (write equation) and question B (solve for a given input).
      7. An "Extension Challenge" question requiring multi-step thinking.
      8. A complete "Answer Key" containing solutions and brief explanations for all parts.

      If the topic is about "Writing Linear Equations from Scenarios" or similar, use exactly the Plumber's Visit, Gym Membership, Savings Account, City Taxi, Equipment Rental, Temperature Drop scenarios from standard math worksheets. If it is any other topic, generate custom contextually appropriate scenarios that follow the same pedagogical structure.

      Return ONLY a raw JSON object matching this schema (do not wrap in markdown \`\`\`json block syntax):
      {
        "title": "Guided Notes: [Title describing the topic]",
        "keyConcept": {
          "title": "[e.g. Slope-Intercept Form]",
          "description": "[A brief explanation of the key concept and how it models real-world situations, written in the style of the selected tone: '${tone}']",
          "equation": "[The core equation, e.g. y = mx + b]",
          "bullets": [
            "[Detail about first component of equation, e.g. 'm represents the Slope...']",
            "[Detail about second component of equation, e.g. 'b represents the y-intercept...']"
          ],
          "diagram": {
            "type": "mermaid",
            "code": "[Mermaid flowchart/diagram syntax representing the concept, or null]"
          }
        },
        "howToIdentify": {
          "title": "How to Identify the Parts",
          "description": "Explanation of keywords to look for in word problems...",
          "intercept": {
            "title": "Identifying [first component/intercept]:",
            "description": "Explanation of what it represents (starting value/initial amount)...",
            "keywords": "Comma-separated list of keywords, e.g. 'flat fee, deposit, starting at...'"
          },
          "slope": {
            "title": "Identifying [second component/slope]:",
            "description": "Explanation of what it represents (rate of change)...",
            "keywords": "Comma-separated list of keywords, e.g. 'per, each, hourly...'"
          }
        },
        "workedExample": {
          "title": "Worked Example: [Example Name]",
          "scenario": "[Word problem scenario details, matching tone: '${tone}']",
          "diagram": {
            "type": "mermaid",
            "code": "[Mermaid flowchart/diagram syntax representing this specific worked example, or null]"
          },
          "steps": [
            {
              "title": "Step 1: Identify [intercept/component].",
              "explanation": "[Short explanation based on scenario]",
              "equation": "[e.g. b = 35]"
            },
            {
              "title": "Step 2: Identify [slope/rate].",
              "explanation": "[Short explanation based on scenario]",
              "equation": "[e.g. m = 10]"
            },
            {
              "title": "Step 3: Write the equation.",
              "explanation": "Substitute the values into [equation form]...",
              "equation": "[e.g. y = 10x + 35]"
            }
          ]
        },
        "checkYourUnderstanding": {
          "title": "Check Your Understanding",
          "instructions": "Use the notes above to fill in the blanks...",
          "questions": [
            "1. Statement with a blank __________.",
            "2. Statement with a blank __________.",
            "3. Statement with a blank __________."
          ],
          "answers": [
            "[Filled word for blank 1, e.g. 'y-intercept']",
            "[Filled word for blank 2, e.g. 'slope']",
            "[Filled words for blank 3, e.g. 'y-intercept, slope']"
          ],
          "reflection": "Reflection Question: [e.g. Why is it important to distinguish between flat fee and rate...]",
          "reflectionAnswer": "[Sample reflection answer, e.g. 'Distinguishing them ensures we don't multiply the one-time fee by the variable.']"
        },
        "guidedPractice": {
          "title": "Guided Practice: [Practice Title]",
          "instructions": "Review of the core rules/notes...",
          "scenarios": [
            {
              "id": 1,
              "title": "Scenario 1: [Name]",
              "text": "[Scenario description]",
              "slopeLabel": "Slope (m): What is the rate?",
              "slopeAnswer": "[Expected slope answer, e.g. '75']",
              "interceptLabel": "y-intercept (b): What is the starting value?",
              "interceptAnswer": "[Expected intercept answer, e.g. '50']",
              "equationLabel": "Final Equation:",
              "equationAnswer": "[Expected final equation, e.g. 'y = 75x + 50']"
            },
            {
              "id": 2,
              "title": "Scenario 2: [Name]",
              "text": "[Scenario description]",
              "slopeLabel": "Slope (m): What is the rate?",
              "slopeAnswer": "[Expected slope answer, e.g. '25']",
              "interceptLabel": "y-intercept (b): What is the starting value?",
              "interceptAnswer": "[Expected intercept answer, e.g. '100']",
              "equationLabel": "Final Equation:",
              "equationAnswer": "[Expected final equation, e.g. 'y = 25x + 100']"
            },
            {
              "id": 3,
              "title": "Scenario 3: [Name]",
              "text": "[Scenario description]",
              "slopeLabel": "Slope (m): What is the rate?",
              "slopeAnswer": "[Expected slope answer, e.g. '15']",
              "interceptLabel": "y-intercept (b): What is the starting value?",
              "interceptAnswer": "[Expected intercept answer, e.g. '250']",
              "equationLabel": "Final Equation:",
              "equationAnswer": "[Expected final equation, e.g. 'y = 15x + 250']"
            }
          ]
        },
        "independentPractice": {
          "title": "Independent Practice: [Title]",
          "instructions": "Instructions for writing and solving...",
          "scenarios": [
            {
              "id": 1,
              "title": "1. [Scenario 1 Title]",
              "text": "[Word problem details]",
              "questionA": "Question to write equation, e.g. 'Write an equation to represent the total cost (y)...'",
              "answerA": "[e.g. 'y = 2.25x + 4.50']",
              "questionB": "Follow-up evaluation question, e.g. 'How much would a 12-mile ride cost?'",
              "answerB": "[e.g. '$31.50']"
            },
            {
              "id": 2,
              "title": "2. [Scenario 2 Title]",
              "text": "[Word problem details]",
              "questionA": "Question to write equation...",
              "answerA": "[Expected equation]",
              "questionB": "Follow-up evaluation question...",
              "answerB": "[Expected solved output]"
            },
            {
              "id": 3,
              "title": "3. [Scenario 3 Title]",
              "text": "[Word problem details]",
              "questionA": "Question to write equation...",
              "answerA": "[Expected equation]",
              "questionB": "Follow-up evaluation question...",
              "answerB": "[Expected solved output]"
            },
            {
              "id": 4,
              "title": "4. [Scenario 4 Title]",
              "text": "[Word problem details]",
              "questionA": "Question to write equation...",
              "answerA": "[Expected equation]",
              "questionB": "Follow-up evaluation question...",
              "answerB": "[Expected solved output]"
            }
          ]
        },
        "extensionChallenge": {
          "title": "Extension Challenge",
          "text": "[A challenge scenario based on the independent practice, e.g. 'If a customer was charged $130, how many hours...']",
          "answer": "[Detailed explanation and final answer, e.g. '7 hours (130 = 15x + 25 -> 105 = 15x -> x = 7)']"
        },
        "answerKey": {
          "title": "Answer Key",
          "sections": [
            {
              "title": "Guided Practice Solutions",
              "bullets": [
                "Detailed answer details for Scenario 1...",
                "Detailed answer details for Scenario 2...",
                "Detailed answer details for Scenario 3..."
              ]
            },
            {
              "title": "Independent Practice Solutions",
              "bullets": [
                "Detailed solution for 1. A & B...",
                "Detailed solution for 2. A & B...",
                "Detailed solution for 3. A & B...",
                "Detailed solution for 4. A & B..."
              ]
            },
            {
              "title": "Extension Challenge Solution",
              "bullets": [
                "Detailed solution for the Extension Challenge..."
              ]
            }
          ]
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const textResult = response.text || '{}';
    let parsedData;
    try {
      parsedData = cleanAndParseJSON(textResult);
    } catch (parseError) {
      console.error('[Generate Lesson API] JSON parse & repair failed:', parseError);
      console.log('[Generate Lesson API] Raw text output was:', textResult);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    const usageObj = {
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata?.totalTokenCount || 0,
    };

    try {
      await saveRawGeminiGeneration({
        topic,
        tone,
        format,
        activeSections,
        customInstructions,
        worksheetJson: parsedData,
        usage: usageObj,
      });
    } catch (saveErr) {
      console.error('[Generate Lesson API] Failed to save raw generation:', saveErr);
    }

    return NextResponse.json({
      success: true,
      worksheet: parsedData,
      usage: usageObj,
    });
  } catch (err) {
    console.error('[Generate Lesson API] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An error occurred while generating the lesson.',
      },
      { status: 500 }
    );
  }
}
