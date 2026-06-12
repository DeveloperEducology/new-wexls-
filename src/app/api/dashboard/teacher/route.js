import { NextResponse } from 'next/server';
import { getTeacherAnalytics } from '@/lib/dashboardService';
import { authorizeApi } from '@/lib/apiGuard';

export async function GET(request) {
  try {
    authorizeApi(request, ['teacher', 'admin']);

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || 'teach_sharma';
    const grade = searchParams.get('grade') || 'Grade 5';

    const data = await getTeacherAnalytics(teacherId, grade);

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("Teacher dashboard API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
