import { NextResponse } from 'next/server';
import { getTemplate, incrementGeneratedCount } from '@/lib/exam/template-store.js';
import { instantiateParameterized, buildAiExpandedPrompt, parseAiGeneratedQuestions } from '@/lib/exam/template-engine.js';
import { insertQuestions } from '@/lib/exam/question-store.js';

export async function POST(req, { params }) {
  try {
    const { count = 20 } = await req.json();
    const resolvedParams = await params;
    const template = await getTemplate(resolvedParams.id);
    if (!template) return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });

    if (template.type === 'parameterized') {
      // Generate deterministically, insert immediately as active
      const questions = instantiateParameterized(template, count);
      if (questions.length === 0) return NextResponse.json({ success: false, error: 'No valid combinations generated' }, { status: 400 });
      await insertQuestions(questions.map(q => ({ ...q, templateId: String(template._id), status: 'active' })));
      await incrementGeneratedCount(String(template._id), questions.length);
      return NextResponse.json({ success: true, type: 'parameterized', generated: questions.length, requiresReview: false });
    }

    if (template.type === 'ai-expanded') {
      // Build prompt, call Gemini, insert as drafts
      const prompt = buildAiExpandedPrompt(template, count);
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      const rawText = response.text || '';
      const drafts = parseAiGeneratedQuestions(rawText, template);
      if (drafts.length === 0) return NextResponse.json({ success: false, error: 'Gemini returned no valid questions' }, { status: 500 });
      await insertQuestions(drafts.map(q => ({ ...q, templateId: String(template._id), status: 'draft' })));
      await incrementGeneratedCount(String(template._id), drafts.length);
      return NextResponse.json({ success: true, type: 'ai-expanded', generated: drafts.length, requiresReview: true, message: `${drafts.length} drafts added to review queue` });
    }

    return NextResponse.json({ success: false, error: 'This template type does not generate questions directly' }, { status: 400 });
  } catch (err) {
    console.error('template generate error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
