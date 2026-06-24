import { NextResponse } from 'next/server';
import { insertQuestions } from '../../../../../lib/exam/question-store.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { questions } = body; // array of question objects
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'questions array required' }, { status: 400 });
    }
    // Validate each has minimum fields
    const valid = questions.filter(q => q.questionText && q.options && q.correctOption && q.examId && q.section);
    if (valid.length === 0) return NextResponse.json({ success: false, error: 'No valid questions found' }, { status: 400 });

    const ids = await insertQuestions(valid.map(q => ({ ...q, difficulty: Number(q.difficulty) || 0.5, status: q.status || 'active' })));
    return NextResponse.json({ success: true, inserted: Object.keys(ids).length, ids: Object.values(ids).map(String) });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
