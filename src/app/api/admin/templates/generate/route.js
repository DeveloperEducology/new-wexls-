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
    const { prompt, subject, topic } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT for ADC auth or GEMINI_API_KEY.' }, { status: 501 });
    }

    const generationPrompt = `
You are a senior curriculum architect for a production learning platform similar to IXL, Khan Academy Kids, and Duolingo.
Create one metadata-driven Universal Learning Activity Template from the user's instruction.

User instruction:
"${prompt}"

Context:
- Default subject: ${subject || 'math'}
- Default topic: ${topic || 'general'}

Return ONLY one valid JSON object. Do not wrap it in markdown. Do not include comments.

The template must be schema-based and reusable across Kindergarten through Grade 10.
It should support any subject:
- english
- math
- science
- general_knowledge
- social_studies
- coding
- logical_reasoning

Use this exact top-level shape whenever possible:
{
  "id": "kebab-case-template-id",
  "templateId": "same-as-id",
  "title": "Short template title",
  "description": "What this activity teaches",
  "subject": "${subject || 'math'}",
  "topic": "${topic || 'general'}",
  "grade": "K, UKG, 1, 2, ... or 10",
  "skillId": "kebab-case-skill-id",
  "competencyId": "kebab-case-competency-id",
  "difficultyLevel": "easy",
  "tags": ["short", "searchable", "tags"],

  "dataSources": [],
  "variables": [],
  "constraints": {
    "uniqueOptions": true,
    "preventDuplicateWords": true,
    "minOptionCount": 3,
    "maxOptionCount": 6,
    "distractorSimilarity": "medium"
  },
  "layoutConfig": {
    "mode": "prompt_top",
    "responsiveTarget": "mobile_first",
    "density": "balanced",
    "showWorkArea": false
  },
  "visuals": [],
  "interaction": {
    "engine": "mcq",
    "inputMode": "choice",
    "options": []
  },
  "validationRules": [],
  "feedbackRules": {
    "correct_message": "Correct!",
    "incorrect_message": "Try again.",
    "hints": [],
    "step_by_step_explanation": "",
    "misconception_feedback": {}
  },
  "difficultyRules": {
    "easy": {
      "optionCount": 3,
      "distractorSimilarity": "low",
      "hintVisibility": "high",
      "visualSupport": "high",
      "answerComplexity": "low"
    },
    "medium": {
      "optionCount": 4,
      "distractorSimilarity": "medium",
      "hintVisibility": "medium",
      "visualSupport": "medium",
      "answerComplexity": "medium"
    },
    "hard": {
      "optionCount": 5,
      "distractorSimilarity": "high",
      "hintVisibility": "low",
      "visualSupport": "low",
      "answerComplexity": "high"
    }
  },
  "analyticsConfig": {
    "attempts": true,
    "time_spent": true,
    "hints_used": true,
    "first_try_correct": true,
    "mastery_score": true,
    "smart_score": true,
    "confidence_score": true
  },
  "adaptiveRules": {
    "correct": { "route": "next_skill", "targetSkillId": "" },
    "incorrect": { "route": "remediation_skill", "targetSkillId": "" },
    "masteryAchieved": { "route": "harder_template", "targetTemplateId": "" }
  },

  "questionText": "Student-facing prompt using [VariableName] placeholders",
  "optionsType": "mcq",
  "options": [],
  "parts": [],
  "answer": "",
  "explanation": {
    "sections": [
      { "type": "text", "content": "Student-friendly explanation." }
    ]
  }
}

Supported dataSources.type values:
- "pool_selection"
- "random_number"
- "random_item"
- "static_data"
- "curriculum_dataset"
- "image_library"
- "audio_library"
- "svg_library"
- "facts_database"

Data source examples:
- Pool selection: { "id": "source_words", "name": "WordsPool", "type": "pool_selection", "poolId": "english-class1-short-i-words", "category": "short_i_words", "count": 3 }
- Random number: { "id": "source_a", "name": "A", "type": "random_number", "min": 1, "max": 10 }
- Static data: { "id": "source_facts", "name": "Facts", "type": "static_data", "items": [{ "label": "Sun", "category": "star" }] }

Supported variable types:
- "integer" with "min" and "max"
- "list" with "items"
- "expression" with "formula"
- "computed" with "formula"
- "string_template" with "template"
- "array_transform" with "source" and "transform"
- "conditional" with "condition", "whenTrue", "whenFalse"
- "pool_selection" with "poolId", "category", "count"

Built-in Math Helpers available for computed formulas:
- gcd(a, b): returns greatest common divisor
- lcm(a, b): returns least common multiple
- simplifyFraction(n, d): returns { numerator, denominator, string }
- addFractions(n1, d1, n2, d2): returns { numerator, denominator, string }
NOTE: All formulas MUST be valid JavaScript. Do NOT omit the '*' operator (e.g., write "6 * lcm(a,b)", not "6 lcm(a,b)").

Use square-bracket interpolation in prompts/options/visual props to evaluate math and insert values:
- [A]
- [B]
- [Result]
- [WordsPool[0].label]
- [TargetWord]
- [addFractions(v_n1, v_d1, v_n2, v_d2).string] <-- MUST use brackets to evaluate helper functions in options!

Supported layoutConfig.mode values:
- "prompt_top"
- "prompt_left"
- "visual_center"
- "split_screen"
- "reading_passage"
- "worksheet"
- "mobile_first"
- "tablet_first"
- "desktop_first"

Supported visuals.component values:
- "Text"
- "Image"
- "Audio"
- "SVG"
- "Video"
- "TenFrame"
- "JarOfMarbles"
- "Spinner"
- "ItemCounter"
- "SceneComposer"
- "PlaceValue"
- "BaseTenBlocks"
- "NumberLine"
- "HundredChart"
- "Rekenrek"
- "NumberBond"
- "TallyChart"
- "FractionBar"
- "FractionCircle"
- "FractionGrid"
- "DecimalGrid"
- "DecimalLine"
- "ShapeCanvas"
- "CoordinatePlane"
- "Protractor"
- "Ruler"
- "Geoboard"
- "BarGraph"
- "Pictograph"
- "FrequencyTable"
- "AnalogClock"
- "Calendar"
- "Thermometer"
- "BalanceScale"
- "MeasuringJug"
- "MoneyDisplay"
- "PriceTagCompare"
- "Clock"
- "MeasuringCup"
- "GeometryCanvas"
- "DragCanvas"
- "ReadingPassage"

Supported interaction.engine values:
- "mcq"
- "picture_mcq"
- "audio_mcq"
- "multi_select"
- "drag_drop"
- "sorting"
- "matching"
- "fill_blank"
- "number_input"
- "text_input"
- "sequence"
- "hotspot"
- "draw_line"
- "label_diagram"
- "interactive_tool"
- "categorizationv2"

Supported validationRules.type values:
- "exact_match"
- "case_insensitive"
- "numeric_tolerance"
- "multi_answer"
- "regex_validation"
- "custom_formula"

Subject-aware guidance:
- English: vocabulary, phonics, grammar, reading; prefer pools, sentence parts, Image/Audio, categorizationv2, fill_blank, matching, picture_mcq.
- Math: arithmetic, fractions, geometry, measurement; prefer random_number variables and visuals like TenFrame, NumberLine, FractionBar, BaseTenBlocks, CoordinatePlane, Ruler, Clock.
- Science: diagrams, labels, experiments; prefer label_diagram, hotspot, Image/SVG, facts_database.
- General knowledge: facts, image matching, associations; prefer static_data/facts_database and picture_mcq/matching.
- Social studies: maps, timelines, civics; prefer hotspot, sequence, matching, reading_passage.
- Coding: sequencing, debugging, logic; prefer sequence, sorting, text_input, interactive_tool.
- Logical reasoning: patterns, analogy, classification; prefer sequence, sorting, matching, pattern visuals.

Important output rules:
1. Always include a usable "questionText".
2. Always include "interaction.engine" and matching "optionsType".
3. Always include at least one validation rule.
4. For MCQ/picture_mcq/audio_mcq, include 3-5 options and mark exactly one with "isCorrect": true unless multi_select.
5. For fill_blank, include a part with a [[blankId]] and answer mapping like { "blankId": "[CorrectAnswer]" }.
6. For categorizationv2/sorting, include categories, items, and answer mapping.
7. For dynamic pool templates, prefer dataSources and variables over hardcoded options.
8. Avoid custom React code. Use metadata, visuals, variables, and interaction config.
9. Keep IDs kebab-case and stable.
10. Return only JSON.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: generationPrompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
    } catch (primaryError) {
      console.warn('[templates-generate] gemini-2.5-flash failed, falling back to gemini-2.5-flash-lite. Error:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: generationPrompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
    }

    const text = response.text || '';
    const templateJson = JSON.parse(text.trim());

    return NextResponse.json({
      success: true,
      template: templateJson
    });
  } catch (error) {
    console.error('[templates-generate] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
