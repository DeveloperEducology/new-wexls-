import { NextResponse } from 'next/server';
import { getParentAnalytics } from '@/lib/dashboardService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId') || 'parent_sharma';
    const grade = searchParams.get('grade') || 'Grade 5';

    const data = await getParentAnalytics(parentId, grade);

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("Parent dashboard API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
