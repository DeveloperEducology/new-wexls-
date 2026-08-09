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
      console.warn('[pdf-spreadsheet] PDFParse warning:', pdfErr.message);
      pdfText = buffer.toString('utf-8');
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from the uploaded PDF file.' },
        { status: 422 }
      );
    }

    // Truncate text if extremely long to fit LLM context cleanly
    const truncatedText = pdfText.length > 6000 ? pdfText.slice(0, 6000) + '\n...[truncated]' : pdfText;

    const prompt = `
Analyze the following extracted text from an educational PDF / worksheet.
Convert the content into a structured Spreadsheet Grid (Table Rows).

PDF Extracted Content:
"""
${truncatedText}
"""

Return ONLY a JSON array of row objects matching this exact Spreadsheet schema:
[
  {
    "Row_ID": 1,
    "Question": "The question text or problem statement extracted from the PDF",
    "Option_A": "Choice A text",
    "Option_B": "Choice B text",
    "Option_C": "Choice C text",
    "Option_D": "Choice D text",
    "Correct_Answer": "The correct option text or label",
    "Explanation": "Explanation or working solution"
  }
]
`;

    const rows = await generateLocalAIJSON(prompt, 'qwen2.5:3b');
    const safeRows = Array.isArray(rows) ? rows : (rows.items || rows.rows || [rows]);

    return NextResponse.json({
      success: true,
      filename: file.name,
      pageCount,
      rowsCount: safeRows.length,
      rows: safeRows
    });

  } catch (err) {
    console.error('[API local-ai/pdf-spreadsheet] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to analyze PDF into spreadsheet format' },
      { status: 500 }
    );
  }
}
