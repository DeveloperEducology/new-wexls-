import { NextResponse } from 'next/server';
import { listR2Audio, isR2Configured } from '@/lib/r2Service';

export async function GET(request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 is not configured on this server' },
      { status: 501 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || 'audio/';

    const audioFiles = await listR2Audio(prefix);

    // Sort by last modified descending
    audioFiles.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return NextResponse.json({ audio: audioFiles });
  } catch (error) {
    console.error('API Error in list-audio:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list R2 audio files' },
      { status: 500 }
    );
  }
}
