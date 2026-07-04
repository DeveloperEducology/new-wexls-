import { NextResponse } from 'next/server';
import { listExams, upsertExam, deleteExam } from '../../../lib/exam/exam-store.js';

export async function GET() {
  try {
    const exams = await listExams();
    return NextResponse.json({ success: true, exams });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ success: false, error: 'Exam ID (id) is required' }, { status: 400 });
    }
    const examData = {
      _id: data.id,
      ...data,
    };
    await upsertExam(examData);
    return NextResponse.json({ success: true, exam: examData });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing exam ID' }, { status: 400 });
    }
    const res = await deleteExam(id);
    return NextResponse.json({ success: res.deletedCount > 0 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
