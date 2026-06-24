import { NextResponse } from 'next/server';
import { listExams } from '../../../lib/exam/exam-store.js';

export async function GET() {
  try {
    const exams = await listExams();
    return NextResponse.json({ success: true, exams });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
