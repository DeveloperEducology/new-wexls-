import { NextResponse } from 'next/server';
import { getSchoolAnalytics } from '@/lib/dashboardService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId') || 'school_1';
    const grade = searchParams.get('grade') || 'Grade 5';

    const data = await getSchoolAnalytics(schoolId, grade);

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("School admin dashboard API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
