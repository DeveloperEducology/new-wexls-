import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';

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

// Generate printable HTML structure
export function generateWorksheetHtml(data) {
  const { title, grade, subject, topic, instructions, questions, columns = 1, includeAnswers = true, font = 'Outfit', spacing = 'compact' } = data;
  
  const questionBlocks = questions.map((q, idx) => {
    let answerMarkup = '';
    
    if (q.answerSpaceType === 'choices' && Array.isArray(q.choices)) {
      answerMarkup = `
        <div class="options-container">
          ${q.choices.map(c => `
            <div class="option-item">
              <span class="checkbox-box"></span>
              <span class="option-text">${c}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else if (q.answerSpaceType === 'lines') {
      const lineCount = q.lineCount || 3;
      answerMarkup = `
        <div class="lines-container">
          ${Array.from({ length: lineCount }).map(() => '<div class="write-line"></div>').join('')}
        </div>
      `;
    } else if (q.answerSpaceType === 'grid') {
      answerMarkup = `
        <div class="grid-container">
          <div class="grid-box"></div>
        </div>
      `;
    } else {
      answerMarkup = `
        <div class="blank-container">
          <span class="answer-label">Answer:</span>
          <div class="blank-line"></div>
        </div>
      `;
    }

    return `
      <div class="question-block">
        <div class="question-header">
          <span class="question-number">Q${idx + 1}.</span>
          <span class="question-text">${q.questionText}</span>
        </div>
        ${q.svgMarkup ? `<div class="svg-diagram-container">${q.svgMarkup}</div>` : (q.imagePlaceholder ? `<div class="image-box">[Draw or paste: ${q.imagePlaceholder}]</div>` : '')}
        ${answerMarkup}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Playpen+Sans:wght@400;600;800&family=Inter:wght@400;600;800&family=Comic+Neue:wght@400;700&display=swap');
        
        @page {
          size: A4 portrait;
          margin: ${spacing === 'compact' ? '6mm 8mm 8mm 8mm' : '12mm 15mm 15mm 15mm'};
        }
        
        body {
          font-family: '${font}', 'Outfit', 'Playpen Sans', sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          line-height: 1.35;
        }

        .header-table {
          width: 100%;
          border-bottom: 2.5px double #64748b;
          padding-bottom: 8px;
          margin-bottom: ${spacing === 'compact' ? '8px' : '16px'};
        }

        .school-title {
          font-size: 18px;
          font-weight: 800;
          color: #4f46e5;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .meta-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-value {
          font-size: 11px;
          font-weight: 600;
          color: #0f172a;
          border-bottom: 1px dotted #94a3b8;
          padding: 0 8px;
        }

        .worksheet-title {
          text-align: center;
          font-size: 18px;
          font-weight: 800;
          margin: 8px 0 6px 0;
          color: #0f172a;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .instructions-box {
          background-color: #f8fafc;
          border: 1.2px dashed #cbd5e1;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }

        .instructions-title {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2px;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        .questions-list {
          display: flex;
          flex-direction: column;
          gap: ${spacing === 'compact' ? '10px' : '18px'};
        }

        /* 2 Column mode support */
        .questions-list.columns-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 24px;
          row-gap: ${spacing === 'compact' ? '12px' : '20px'};
        }

        .questions-list.columns-2 .image-box {
          width: 80%;
          margin-left: 20px;
        }

        .questions-list.columns-2 .options-container {
          grid-template-columns: 1fr;
          margin-left: 20px;
        }

        .questions-list.columns-2 .lines-container {
          margin-left: 20px;
        }

        .questions-list.columns-2 .blank-container {
          margin-left: 20px;
        }

        .questions-list.columns-2 .grid-container {
          margin-left: 20px;
        }

        .questions-list.columns-2 .svg-diagram-container {
          margin-left: 20px;
        }

        .question-block {
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
          gap: ${spacing === 'compact' ? '3px' : '6px'};
        }

        .question-header {
          display: flex;
          gap: 6px;
          align-items: flex-start;
        }

        .question-number {
          font-weight: 800;
          color: #4f46e5;
          font-size: 13px;
        }

        .question-text {
          font-weight: 600;
          color: #0f172a;
          font-size: 13px;
        }

        .image-box {
          width: 45%;
          height: 48px;
          border: 1.2px dashed #cbd5e1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #94a3b8;
          font-weight: 600;
          text-align: center;
          padding: 0 8px;
          margin-left: 24px;
        }

        /* SVG diagrams generated inline by Gemini */
        .svg-diagram-container {
          margin-left: 24px;
          margin-top: 6px;
          display: inline-block;
        }

        .svg-diagram-container svg {
          display: block;
          max-width: 150px;
          max-height: 85px;
        }

        /* Options for MCQs */
        .options-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          margin-left: 24px;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox-box {
          width: 13px;
          height: 13px;
          border: 1.2px solid #64748b;
          border-radius: 3px;
          display: inline-block;
        }

        .option-text {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        /* Lines for Writing Practice */
        .lines-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-left: 24px;
          margin-top: 4px;
        }

        .write-line {
          border-bottom: 1.2px dotted #94a3b8;
          height: 0;
          width: 100%;
        }

        /* Calculation Grid */
        .grid-container {
          margin-left: 24px;
          margin-top: 4px;
        }

        .grid-box {
          width: 120px;
          height: 80px;
          border: 1.2px dashed #cbd5e1;
          border-radius: 6px;
          background-image: 
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px);
          background-size: 16px 16px;
        }

        /* Blank line fill */
        .blank-container {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-left: 24px;
          margin-top: 4px;
        }

        .answer-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
        }

        .blank-line {
          border-bottom: 1.2px solid #475569;
          width: 150px;
          height: 0;
        }

        /* Solutions Layout */
        .page-break {
          page-break-before: always;
        }

        .solutions-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 6px;
        }

        .solutions-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .solution-item {
          font-size: 12px;
          color: #334155;
          line-height: 1.4;
        }

        .solution-q {
          font-weight: 800;
          color: #4f46e5;
          font-size: 13px;
        }

        .explanation {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
          margin-left: 20px;
        }

        /* Footer info */
        .footer-info {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          font-weight: 600;
          border-top: 1px solid #e2e8f0;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td class="school-title">KlassChamp Printable</td>
          <td align="right" class="meta-label">
            Name: <span class="meta-value" style="width: 150px; display: inline-block;"></span>
            Date: <span class="meta-value" style="width: 100px; display: inline-block;"></span>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 6px;">
            <span class="meta-label">Grade:</span> <span class="meta-value">${grade.toUpperCase()}</span>
            <span class="meta-label" style="margin-left: 15px;">Subject:</span> <span class="meta-value">${subject.toUpperCase()}</span>
          </td>
          <td align="right" class="meta-label" style="padding-top: 6px;">
            <span class="meta-label">Topic:</span> <span class="meta-value">${topic}</span>
          </td>
        </tr>
      </table>

      <h1 class="worksheet-title">${title}</h1>

      <div class="instructions-box">
        <div class="instructions-title">Instructions:</div>
        ${instructions}
      </div>

      <div class="questions-list columns-${columns}">
        ${questionBlocks}
      </div>

      <div class="footer-info">
        © 2026 KlassChamp Interactive Practice. Scan or visit KlassChamp.com to check your answers!
      </div>

      ${includeAnswers ? `
        <div class="page-break"></div>
        <table class="header-table">
          <tr>
            <td class="school-title">KlassChamp Printable</td>
            <td align="right" class="meta-label">
              <strong>ANSWER KEY & SOLUTIONS</strong>
            </td>
          </tr>
        </table>
        
        <h2 class="solutions-title">Solutions Key: ${title}</h2>
        <div class="solutions-grid">
          ${questions.map((q, idx) => `
            <div class="solution-item" style="page-break-inside: avoid;">
              <div class="solution-q">Q${idx + 1}. ${q.questionText}</div>
              <div style="margin-left: 20px; color: #10b981; font-weight: 800; margin-top: 3px;">
                Correct Answer: ${q.correctAnswer}
              </div>
              ${q.explanationText ? `
                <div class="explanation">
                  <strong>Explanation:</strong> ${q.explanationText}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="footer-info">
          © 2026 KlassChamp Interactive Practice. Teacher & Parent Solutions Key.
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

// Exportable generator core
export async function generateWorksheetPdfBuffer({ grade, subject, topic, skill, customPrompt = '', columns = 1, includeAnswers = true, font = 'Outfit', spacing = 'compact', illustrationStyle = 'cartoon outlines' }) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Gemini client not configured.');
  }

  const systemPrompt = `
    You are a premium curriculum content developer who creates beautiful, educational school worksheets.
    Generate exactly 5 practice questions for a printable worksheet on the topic/skill: "${skill}" for ${grade} grade ${subject}.
    
    Worksheet Styling Specifications:
    - Typography Family: ${font}
    - Spacing Layout: ${spacing}
    - Drawing illustration Style: ${illustrationStyle}

    Your output must be a JSON object matching this structure exactly (do not include markdown block syntax):
    {
      "worksheetTitle": "Appropriate SEO Friendly Printable Title",
      "instructions": "General instructions telling the student what to do on this worksheet.",
      "questions": [
        {
          "questionText": "The question statement. Keep it grade appropriate and friendly.",
          "answerSpaceType": "choices" | "lines" | "grid" | "blank",
          "choices": ["Choice A", "Choice B", "Choice C", "Choice D"], // Only if answerSpaceType is "choices"
          "lineCount": 3, // Only if answerSpaceType is "lines", default is 3
          "imagePlaceholder": "Describe a drawing/image that should go here matching the style '${illustrationStyle}' or leave blank",
          "svgMarkup": "An optional string containing valid, clean inline SVG code representing a geometric shape, fraction circle, or diagram relating to this question. The SVG must be self-contained, use black/dark-slate lines, fill='none' or translucent fills, and have clear text labels using font-family='Outfit' or sans-serif. Use width and height under 150px and viewBox.",
          "correctAnswer": "The correct response or choice text (e.g. 'a small cup' or the numerical solution)",
          "explanationText": "A brief explanation of why this answer is correct."
        }
      ]
    }

    Formatting rules:
    - Use "choices" for multiple choice questions.
    - Use "lines" for writing practice, short answers, or sentences.
    - Use "grid" for double-digit math calculations or box drawings.
    - Use "blank" for fill-in-the-blanks or single word responses.
    - Make questions highly realistic and matching ${grade} educational standards.
    - IMPORTANT FOR GEOMETRY, MATH & FRACTIONS: If a question references a shape (like triangle, rectangle, parallelogram, or circle slice), ALWAYS output a clean inline SVG in "svgMarkup" representing that shape with the correct side or height dimensions labeled as text within the SVG, so that the diagram is fully visible and educational.
    ${customPrompt ? `Apply these custom directions: ${customPrompt}` : ''}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: systemPrompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const parsedJson = JSON.parse(response.text.trim());
  
  const htmlContent = generateWorksheetHtml({
    title: parsedJson.worksheetTitle,
    grade,
    subject,
    topic,
    instructions: parsedJson.instructions,
    questions: parsedJson.questions,
    columns,
    includeAnswers,
    font,
    spacing
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return pdfBuffer;
}

export async function POST(request) {
  try {
    const { grade = 'ukg', subject = 'english', topic = 'Phonics', skill = 'eng-short-u-find', customPrompt = '', columns = 1, includeAnswers = true, font = 'Outfit', spacing = 'compact', illustrationStyle = 'cartoon outlines' } = await request.json();
    const pdfBuffer = await generateWorksheetPdfBuffer({ grade, subject, topic, skill, customPrompt, columns, includeAnswers, font, spacing, illustrationStyle });

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${grade}-${subject}-${skill}-worksheet.pdf"`,
        'Content-Length': String(pdfBuffer.length)
      }
    });

  } catch (err) {
    console.error('[generate-worksheet] Error:', err);
    return NextResponse.json({ error: err.message || 'Worksheet generation failed' }, { status: 500 });
  }
}
