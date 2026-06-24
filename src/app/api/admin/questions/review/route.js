import { NextResponse } from 'next/server';
import { listQuestions, updateQuestionStatus, updateQuestion } from '../../../../../lib/exam/question-store.js';

// GET - list draft questions pending review
export async function GET() {
  try {
    const drafts = await listQuestions({ status: 'draft', limit: 50 });
    return NextResponse.json({ success: true, drafts: drafts.map(q => ({ ...q, _id: String(q._id) })) });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - approve, reject, or edit a draft question
export async function POST(req) {
  try {
    const { questionId, action, edits } = await req.json();
    if (!questionId || !action) return NextResponse.json({ success: false, error: 'Missing questionId or action' }, { status: 400 });

    if (action === 'approve') {
      await updateQuestionStatus(questionId, 'active');
    } else if (action === 'reject') {
      await updateQuestionStatus(questionId, 'rejected');
    } else if (action === 'edit') {
      await updateQuestion(questionId, { ...edits, status: 'active' });
    } else {
      return NextResponse.json({ success: false, error: 'action must be approve|reject|edit' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
