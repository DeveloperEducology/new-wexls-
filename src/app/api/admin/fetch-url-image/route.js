import { NextResponse } from 'next/server';
import { uploadImageToR2, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';
import { getImageDimensions, generateIxlMetadata } from '@/lib/gemini';
import sharp from 'sharp';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif', 'image/avif', 'image/svg+xml',
]);

const EXT_MAP = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif',
  'image/avif': 'avif', 'image/svg+xml': 'svg',
};

export const runtime = 'nodejs';

/**
 * POST /api/admin/fetch-url-image
 * Body: { url: string, folder?: string }
 * Returns: { r2Url, contentType, sizeBytes } on success
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { url, folder = 'images', customName } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required.' }, { status: 400 });
  }

  // Basic URL validation
  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
  }

  // Fetch the remote image
  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WexlsAdmin/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    return NextResponse.json({ error: `Fetch failed: ${err.message}` }, { status: 502 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `Remote returned ${response.status} ${response.statusText}` },
      { status: 502 }
    );
  }

  const contentType = (response.headers.get('content-type') || 'image/png')
    .split(';')[0].trim().toLowerCase();

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported content-type: ${contentType}` },
      { status: 415 }
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  if (!isR2Configured()) {
    return NextResponse.json({ error: 'R2 is not configured.' }, { status: 503 });
  }

  // Resize and compress non-SVG images to 500x500 px and < 50 KB
  let processedContentType = contentType;
  if (contentType !== 'image/svg+xml') {
    try {
      let sharpInstance = sharp(buffer).resize(500, 500, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });

      if (contentType === 'image/png') {
        buffer = await sharpInstance
          .png({ palette: true, compressionLevel: 9 })
          .toBuffer();
      } else if (contentType === 'image/webp') {
        buffer = await sharpInstance
          .webp({ quality: 80 })
          .toBuffer();
      } else if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
        buffer = await sharpInstance
          .jpeg({ quality: 80 })
          .toBuffer();
      } else if (contentType === 'image/gif') {
        // Convert GIF to transparent compressed PNG
        buffer = await sharpInstance
          .png({ palette: true, compressionLevel: 9 })
          .toBuffer();
        processedContentType = 'image/png';
      } else {
        // Default fallback to PNG
        buffer = await sharpInstance
          .png({ palette: true, compressionLevel: 9 })
          .toBuffer();
        processedContentType = 'image/png';
      }

      // If still larger than 50 KB, compress more aggressively
      if (buffer.length > 50 * 1024) {
        if (processedContentType === 'image/png') {
          buffer = await sharp(buffer)
            .png({ palette: true, quality: 60, compressionLevel: 9 })
            .toBuffer();
        } else if (processedContentType === 'image/webp') {
          buffer = await sharp(buffer)
            .webp({ quality: 60 })
            .toBuffer();
        } else if (processedContentType === 'image/jpeg' || processedContentType === 'image/jpg') {
          buffer = await sharp(buffer)
            .jpeg({ quality: 60 })
            .toBuffer();
        }
      }
    } catch (err) {
      console.error('[fetch-url-image] Failed to resize/compress image:', err);
    }
  }

  const ext = EXT_MAP[processedContentType] || 'png';
  let finalName;

  if (customName && typeof customName === 'string' && customName.trim()) {
    const cleanCustom = customName.trim().replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
    // If it doesn't end with the correct extension, append it
    const extRegex = new RegExp(`\\.${ext}$`, 'i');
    finalName = extRegex.test(cleanCustom) ? cleanCustom : `${cleanCustom}.${ext}`;
  } else {
    // Build a clean filename from the source URL path
    const srcPath = parsed.pathname;
    const srcFilename = srcPath.split('/').pop() || 'image';
    const safeName = srcFilename.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80);
    // If safeName already has a valid ext, keep it; else append correct ext
    const hasExt = /\.[a-z]{2,5}$/.test(safeName);
    finalName = hasExt ? safeName : `${safeName}.${ext}`;
  }

  const cleanFolder = (folder || 'images')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/^\/+|\/+$/g, '') || 'images';

  const timestamp = Date.now();
  const key = `${cleanFolder}/${timestamp}-${finalName}`;

  const r2Url = await uploadImageToR2(buffer, key, processedContentType);

  if (!r2Url) {
    return NextResponse.json({ error: 'Upload returned no URL.' }, { status: 500 });
  }

  // Generate dimensions and AI tags for IXL schema compatibility
  let dimensions = { width: 500, height: 500 };
  let aiTags = { singular: 'item', plural: 'items', article: 'an', category: 'general', tags: ['imported-asset'] };

  try {
    dimensions = getImageDimensions(buffer);
    aiTags = await generateIxlMetadata(buffer, processedContentType);
  } catch (err) {
    console.error('[fetch-url-image] Failed to detect dimensions / run AI tagging:', err);
  }

  // Sync image metadata with MongoDB database
  try {
    const db = await getMongoDb();
    if (db) {
      const cleanName = finalName.replace(/\.[^.]+$/, '');
      await db.collection('image_assets').updateOne(
        { key: key },
        {
          $set: {
            name: cleanName,
            url: r2Url,
            folder: cleanFolder,
            dimensions: {
              width: dimensions.width,
              height: dimensions.height,
              aspectRatio: parseFloat((dimensions.width / dimensions.height).toFixed(3))
            },
            linguistics: {
              singular: aiTags.singular || 'item',
              plural: aiTags.plural || 'items',
              article: aiTags.article || 'an'
            },
            classification: {
              category: aiTags.category || 'general',
              tags: Array.isArray(aiTags.tags) ? aiTags.tags : ['imported-asset']
            },
            metadata: {
              createdAt: new Date(),
              sourceUrl: url
            }
          }
        },
        { upsert: true }
      );
    }
  } catch (dbErr) {
    console.error('[fetch-url-image] MongoDB update failed:', dbErr);
  }

  return NextResponse.json({
    r2Url,
    sourceUrl: url,
    key,
    contentType: processedContentType,
    sizeBytes: buffer.length,
    sizeMB: parseFloat((buffer.length / (1024 * 1024)).toFixed(2)),
    dimensions,
    linguistics: {
      singular: aiTags.singular || 'item',
      plural: aiTags.plural || 'items',
      article: aiTags.article || 'an'
    },
    classification: {
      category: aiTags.category || 'general',
      tags: aiTags.tags || []
    }
  });
}
