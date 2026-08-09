import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { generateLocalAIJSON, isOllamaAvailable } from '@/lib/ollama';

export async function POST(req) {
  try {
    const available = await isOllamaAvailable();
    if (!available) {
      return NextResponse.json(
        { error: 'Ollama is not running locally. Please start Ollama on your Mac.' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }

    // Convert file to Buffer & extract PDF text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText = '';
    let pageCount = 1;

    try {
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText();
      pdfText = res.text || '';
      pageCount = res.total || 1;
    } catch (pdfErr) {
      console.warn('[pdf-analyzer] PDFParse warning:', pdfErr.message);
      pdfText = buffer.toString('utf-8');
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from the uploaded PDF file.' },
        { status: 422 }
      );
    }

    // Truncate text if extremely long to fit LLM context cleanly
    const truncatedText = pdfText.length > 7000 ? pdfText.slice(0, 7000) + '\n...[truncated for summary]' : pdfText;

    const prompt = `
Analyze the following extracted text from an educational PDF document or worksheet.

Extracted PDF Content:
"""
${truncatedText}
"""

Provide a comprehensive analysis and structured JSON summary with the following schema:
{
  "title": "Inferred or extracted title of the PDF document",
  "executiveSummary": "A clear, well-written 2-3 paragraph summary of what this PDF document covers.",
  "keyPoints": [
    "Important takeaway or key concept 1",
    "Important takeaway or key concept 2",
    "Important takeaway or key concept 3"
  ],
  "curriculumBreakdown": {
    "estimatedGrade": "Grade 1-5 / Middle School / High School",
    "subject": "Math / Science / English / General",
    "mainTopics": ["Topic 1", "Topic 2", "Topic 3"],
    "learningGoal": "Main objective of the PDF"
  },
  "extractedQuestionsOrInsights": [
    "Key question or insight derived from the document 1",
    "Key question or insight derived from the document 2"
  ]
}
`;

    const summaryData = await generateLocalAIJSON(prompt, 'qwen2.5:3b');

    return NextResponse.json({
      success: true,
      filename: file.name,
      pageCount,
      characterCount: pdfText.length,
      extractedText: pdfText,
      summary: summaryData
    });

  } catch (err) {
    console.error('[API local-ai/pdf-analyzer] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to extract and summarize PDF' },
      { status: 500 }
    );
  }
}
