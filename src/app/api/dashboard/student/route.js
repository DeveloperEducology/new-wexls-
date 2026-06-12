import { NextResponse } from 'next/server';
import { getStudentAnalytics } from '@/lib/dashboardService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'ryan_p';
    const grade = searchParams.get('grade') || 'Grade 5';

    const data = await getStudentAnalytics(userId, grade);

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("Student dashboard API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
