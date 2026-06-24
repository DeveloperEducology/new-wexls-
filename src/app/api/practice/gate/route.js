import { NextResponse } from 'next/server';
import { countTodaySessions } from '../../../../lib/exam/session-store.js';

const FREE_DAILY_LIMIT = 1; // 1 free session per section per day

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    const section = searchParams.get('section');
    const userId = searchParams.get('userId');

    if (!examId || !section || !userId) {
      return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 });
    }

    const sessionsToday = await countTodaySessions(userId, examId, section);
    const isDev = process.env.NODE_ENV === 'development';
    const allowed = isDev ? true : (sessionsToday < FREE_DAILY_LIMIT);

    return NextResponse.json({
      success: true,
      allowed,
      sessionsUsedToday: sessionsToday,
      dailyLimit: FREE_DAILY_LIMIT,
      isPremium: isDev, // Treat dev mode as premium
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
