import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { getMongoDb } from '../src/lib/db/mongo.js';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
}

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if (!project) return null;
  return new GoogleGenAI({
    enterprise: true,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
  });
}

function compileTemplate(preset, questionId, examId, section, topic) {
  const title = preset.title || 'AI Generated Grid Template';
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const templateId = `jnvst-drill-q-${questionId}-${cleanTitle}-tpl`;
  
  const blueprint = preset.blueprint || '';
  const solution = preset.solution || '';
  const columns = preset.columns || [];
  const rows = preset.rows || [];
  const optionsBinding = preset.optionsBinding || [];

  const cleanBlueprint = blueprint.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');
  const cleanSolution = solution.replace(/\{\{\{\s*/g, '{ {{').replace(/\s*\}\}\}/g, '}} }');

  const parallelVariables = {};
  columns.forEach(col => {
    parallelVariables[col] = rows.map(r => {
      const cell = String(r[col] || '').trim();
      return Number.isFinite(Number(cell)) && cell !== '' ? Number(cell) : cell;
    });
  });

  const indicesPool = Array.from({ length: rows.length }, (_, i) => i);
  const compiledVariables = { index: indicesPool };
  
  const compiledDerivations = {};
  columns.forEach(col => {
    const listStr = JSON.stringify(parallelVariables[col]);
    compiledDerivations[col] = `${listStr}[index]`;
  });

  const optionsList = optionsBinding.map(opt => ({
    label: `[${opt.column}]`,
    isCorrect: opt.isCorrect
  }));

  const compiledJson = {
    _id: templateId,
    name: title,
    type: 'parameterized',
    examId: examId || 'jnvst',
    section: section || 'arithmetic',
    topic: topic || 'general',
    difficulty: 0.5,
    status: 'active',
    config: {
      name: title,
      title: title,
      description: 'Generated via Batch script using Gemini Vertex',
      grade: '',
      skillId: '',
      competencyId: '',
      difficultyLevel: 'medium',
      tags: [topic || 'general'],
      constraints: {
        uniqueOptions: true,
        preventDuplicateWords: true,
        minOptionCount: 4,
        maxOptionCount: 4
      },
      layoutConfig: {
        mode: 'prompt_top',
        responsiveTarget: 'desktop_first',
        clickToSubmit: false
      },
      interaction: {
        engine: 'mcq',
        inputMode: 'choice'
      },
      variables: compiledVariables,
      derivations: compiledDerivations,
      options: optionsList,
      questionTemplate: cleanBlueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]').replace(/______/g, '[]'),
      explanationTemplate: cleanSolution.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
    }
  };
  return compiledJson;
}

async function run() {
  loadEnv();
  const db = await getMongoDb();
  if (!db) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.error('Gemini is not configured. Set GEMINI_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('Fetching questions from DB...');
  const questions = await db.collection('questions').find({
    examId: 'jnvst',
    topic: 'jnvst-2025-arithmetic',
    $or: [
      { drillTemplateId: { $exists: false } },
      { drillTemplateId: null },
      { drillTemplateId: '' }
    ]
  }).toArray();

  console.log(`Found ${questions.length} questions missing dynamic templates.`);

  const testLinks = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qIdStr = String(q._id);
    console.log(`\n--------------------------------------------------`);
    console.log(`[${i + 1}/${questions.length}] Processing Question: ${qIdStr}`);
    console.log(`Text: ${q.questionText.slice(0, 80)}...`);

    const optionsArray = [];
    const opts = q.options || {};
    ['A', 'B', 'C', 'D'].forEach(letter => {
      if (opts[letter]) {
        optionsArray.push({
          label: opts[letter],
          isCorrect: String(q.correctOption || '').toUpperCase() === letter
        });
      }
    });

    const prompt = `
You are a senior curriculum architect. Your task is to take a single static multiple-choice question, its choices, and its step-by-step explanation, and generalize it into a dynamic spreadsheet-compatible template.

Original Static Question:
"${q.questionText}"

Original Choices:
${JSON.stringify(optionsArray, null, 2)}

Original Explanation:
"${q.explanationText || ''}"

Return ONLY one valid JSON object. Do not wrap it in markdown. Do not include comments.

The JSON object must have this exact shape:
{
  "title": "A short descriptive title for the template",
  "subject": "math",
  "topic": "jnvst-2025-arithmetic",
  "targetCollection": "templates",
  "columns": ["col1", "col2", "Result", "Distractor1", "Distractor2", "Distractor3"],
  "rows": [
    {
      "col1": "value1_row1",
      "col2": "value2_row1",
      "Result": "correct_value_row1",
      "Distractor1": "wrong1_row1",
      "Distractor2": "wrong2_row1",
      "Distractor3": "wrong3_row1"
    },
    {
      "col1": "value1_row2",
      "col2": "value2_row2",
      "Result": "correct_value_row2",
      "Distractor1": "wrong1_row2",
      "Distractor2": "wrong2_row2",
      "Distractor3": "wrong3_row2"
    },
    {
      "col1": "value1_row3",
      "col2": "value2_row3",
      "Result": "correct_value_row3",
      "Distractor1": "wrong1_row3",
      "Distractor2": "wrong2_row3",
      "Distractor3": "wrong3_row3"
    }
  ],
  "blueprint": "The question text with variables wrapped in double-braces like {{colName}}",
  "solution": "The step-by-step explanation, replacing specific values with double-braces like {{colName}}",
  "optionsBinding": [
    { "column": "Result", "isCorrect": true },
    { "column": "Distractor1", "isCorrect": false },
    { "column": "Distractor2", "isCorrect": false },
    { "column": "Distractor3", "isCorrect": false }
  ]
}

Instructions for generalization:
1. Analyze the original static question: Identify the key variable values (e.g. numbers, words, names, expressions).
2. Create column names for these variables. Make one column (e.g. "Result") represent the correct answer, and others represent the incorrect distractors.
3. Write the "rows" array. You MUST generate at least 3 distinct variations (rows) of the variables, showing how they change together.
4. Replace the specific numbers or terms in the question and explanation with double-braces syntax: {{columnName}}.
5. If the question has mathematical expressions, format them beautifully in standard LaTeX notation (using $...$ for inline or $$...$$ for block).
6. Ensure that the generated options in the rows mathematically match the question details for that row.
`;

    try {
      console.log('Calling Gemini API...');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '';
      const preset = JSON.parse(text.trim());
      console.log('Gemini generated preset structure successfully.');

      const compiledDoc = compileTemplate(preset, qIdStr, q.examId, q.section, q.topic);
      const templateId = compiledDoc._id;

      // Save template to database
      console.log(`Writing template ${templateId} to database...`);
      await db.collection('templates').replaceOne(
        { _id: templateId },
        compiledDoc,
        { upsert: true }
      );

      // Update question's drillTemplateId
      console.log(`Linking drillTemplateId to question ${qIdStr}...`);
      await db.collection('questions').updateOne(
        { _id: q._id },
        { $set: { drillTemplateId: templateId } }
      );

      const practiceUrl = `http://localhost:3000/exam-prep/${q.examId}/practice/${q.section || 'arithmetic'}?templateId=${templateId}&userId=guest_child`;
      testLinks.push({
        questionId: qIdStr,
        text: q.questionText,
        testUrl: practiceUrl
      });
      console.log(`✅ Success! Link created: ${templateId}`);

    } catch (e) {
      console.error(`❌ Failed processing question ${qIdStr}:`, e);
    }

    // Wait a brief period to avoid rate limits
    if (i < questions.length - 1) {
      console.log('Sleeping 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n==================================================');
  console.log('🎉 Generation complete!');
  console.log('==================================================\n');
  testLinks.forEach((link, idx) => {
    console.log(`[${idx + 1}] Q_ID: ${link.questionId}`);
    console.log(`    Text: ${link.text.slice(0, 100)}...`);
    console.log(`    Test URL: ${link.testUrl}`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
