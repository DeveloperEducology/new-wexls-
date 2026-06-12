import { NextResponse } from 'next/server';
import { getAdminAnalytics } from '@/lib/dashboardService';
import { authorizeApi } from '@/lib/apiGuard';

export async function GET(request) {
  try {
    authorizeApi(request, ['admin']);

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade') || 'Grade 5';

    const data = await getAdminAnalytics(grade);

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("Platform admin dashboard API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
