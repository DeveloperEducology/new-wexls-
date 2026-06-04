import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Server-side image proxy to bypass CORS restrictions during client-side HTML5 canvas cropping.
 * Supports cropping both local R2 assets and external web search images.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[proxy-image] Failed to proxy image:', err);
    return NextResponse.json({ error: err.message || 'Failed to proxy image.' }, { status: 500 });
  }
}
