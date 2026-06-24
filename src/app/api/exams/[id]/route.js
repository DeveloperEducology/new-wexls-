import { NextResponse } from 'next/server';
import { getExam } from '../../../../lib/exam/exam-store.js';
import { getOrCreateProfile } from '../../../../lib/exam/profile-store.js';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const exam = await getExam(resolvedParams.id);
    if (!exam) return NextResponse.json({ success: false, error: 'Exam not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    let profile = null;
    
    if (userId) {
      profile = await getOrCreateProfile(userId, resolvedParams.id);
    }

    return NextResponse.json({ success: true, exam, profile });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
