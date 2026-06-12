import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';

export async function GET() {
  const defaultFlags = {
    adaptiveLearning: true,
    aiInsights: true,
    teacherHeatmaps: true,
    advancedReports: true,
    parentRecommendations: true
  };

  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, flags: defaultFlags });
    }

    const flags = await db.collection('feature_flags').find({}).toArray();
    if (flags.length === 0) {
      return NextResponse.json({ success: true, flags: defaultFlags });
    }

    const formattedFlags = {};
    flags.forEach(f => {
      formattedFlags[f.featureKey] = f.enabled;
    });

    return NextResponse.json({
      success: true,
      flags: { ...defaultFlags, ...formattedFlags }
    });
  } catch (error) {
    console.error("Feature flag API error:", error);
    return NextResponse.json({ success: true, flags: defaultFlags });
  }
}
