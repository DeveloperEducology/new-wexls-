import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/admin/search-web-images?q=...
 * Searches DuckDuckGo for transparent cliparts/icons of the search query.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query parameter q is required.' }, { status: 400 });
    }

    const cleanQuery = query.trim();
    // Add "clipart png" helper suffix to get high quality educational graphics/icons
    const searchTerms = cleanQuery.toLowerCase().includes('clipart')
      ? cleanQuery
      : `${cleanQuery} clipart png`;

    // 1. Get vqd search token from DuckDuckGo
    const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchTerms)}`;
    const initResponse = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!initResponse.ok) {
      throw new Error(`Failed to fetch DDG main page: ${initResponse.status} ${initResponse.statusText}`);
    }

    const html = await initResponse.text();
    const vqdMatch = html.match(/vqd=[\'\"]?([^\'\"]+)/) || html.match(/vqd:[\'\"]?([^\'\"]+)/);
    
    if (!vqdMatch) {
      console.error('[search-web-images] Could not find vqd token in HTML response.');
      return NextResponse.json({ error: 'Failed to retrieve search token from DuckDuckGo' }, { status: 502 });
    }

    const vqd = vqdMatch[1];

    // 2. Fetch images from DuckDuckGo's internal search endpoint
    const searchUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchTerms)}&o=json&vqd=${vqd}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!searchResponse.ok) {
      throw new Error(`Failed to fetch DDG image results: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const data = await searchResponse.json();
    const results = (data.results || []).map(item => ({
      image: item.image,
      thumbnail: item.thumbnail,
      title: item.title,
      source: item.source,
      width: item.width,
      height: item.height,
    }));

    return NextResponse.json({
      success: true,
      query: searchTerms,
      results,
    });

  } catch (err) {
    console.error('[search-web-images] Error:', err);
    return NextResponse.json({ error: err.message || 'Image search failed' }, { status: 500 });
  }
}
