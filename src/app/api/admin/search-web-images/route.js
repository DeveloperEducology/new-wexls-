import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/admin/search-web-images?q=...
 * Searches DuckDuckGo for transparent cliparts/icons of the search query.
 */
async function fetchDDG(searchTerms) {
  try {
    const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchTerms)}`;
    const initResponse = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!initResponse.ok) {
      console.warn(`[search-web-images] Failed to fetch DDG main page for "${searchTerms}": ${initResponse.status}`);
      return [];
    }

    const html = await initResponse.text();
    const vqdMatch = html.match(/vqd=[\'\"]?([^\'\"]+)/) || html.match(/vqd:[\'\"]?([^\'\"]+)/);
    
    if (!vqdMatch) {
      console.warn(`[search-web-images] Could not find vqd token for "${searchTerms}".`);
      return [];
    }

    const vqd = vqdMatch[1];

    const searchUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchTerms)}&o=json&vqd=${vqd}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!searchResponse.ok) {
      console.warn(`[search-web-images] Failed to fetch DDG image results for "${searchTerms}": ${searchResponse.status}`);
      return [];
    }

    const data = await searchResponse.json();
    return data.results || [];
  } catch (err) {
    console.error(`[search-web-images] Error fetching for "${searchTerms}":`, err.message);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query parameter q is required.' }, { status: 400 });
    }

    const type = searchParams.get('type') || 'clipart';
    const cleanQuery = query.trim();
    
    let queries = [];
    if (type === 'photo') {
      // Photo query patterns for transparent background images/real items
      queries = [
        `${cleanQuery} transparent png`,
        `${cleanQuery} photo transparent background`,
        `${cleanQuery} stock photo png`
      ];
    } else if (type === 'any') {
      // Unfiltered / exact query patterns
      queries = [
        `${cleanQuery} png`,
        `${cleanQuery} transparent`,
        cleanQuery
      ];
    } else {
      // Default: Clipart
      queries = [
        `${cleanQuery} flat icon flaticon`,
        `${cleanQuery} vecteezy`,
        cleanQuery.toLowerCase().includes('clipart') ? cleanQuery : `${cleanQuery} clipart png`
      ];
    }

    const resultsArray = await Promise.all(queries.map(q => fetchDDG(q)));

    // Merge and deduplicate by image URL
    const seenUrls = new Set();
    const allResults = [];
    
    for (const results of resultsArray) {
      for (const item of results) {
        if (item.image && !seenUrls.has(item.image)) {
          seenUrls.add(item.image);
          allResults.push({
            image: item.image,
            thumbnail: item.thumbnail,
            title: item.title,
            source: item.source,
            width: item.width,
            height: item.height,
          });
        }
      }
    }

    // Sort/group results: Flaticon first, Vecteezy second, Others last
    const flaticon = [];
    const vecteezy = [];
    const others = [];

    for (const item of allResults) {
      const url = item.image.toLowerCase();
      const title = (item.title || '').toLowerCase();
      const source = (item.source || '').toLowerCase();
      
      if (url.includes('flaticon.com') || title.includes('flaticon') || source.includes('flaticon')) {
        flaticon.push(item);
      } else if (url.includes('vecteezy.com') || title.includes('vecteezy') || source.includes('vecteezy')) {
        vecteezy.push(item);
      } else {
        others.push(item);
      }
    }

    const sortedResults = [...flaticon, ...vecteezy, ...others];

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      results: sortedResults,
    });

  } catch (err) {
    console.error('[search-web-images] Error:', err);
    return NextResponse.json({ error: err.message || 'Image search failed' }, { status: 500 });
  }
}
