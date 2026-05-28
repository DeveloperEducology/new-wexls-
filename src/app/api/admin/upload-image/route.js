import { NextResponse } from 'next/server';
import { uploadImageToR2, isR2Configured } from '@/lib/r2Service';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const MAX_FILE_SIZE_MB = 10;

export const runtime = 'nodejs';

export async function POST(request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 storage is not configured on this server.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const results = [];
    const errors = [];

    // Support both single field "file" and multi-field "files[]"
    const files = [];
    const single = formData.get('file');
    if (single) files.push(single);

    // Also collect files[] array entries
    for (const [key, val] of formData.entries()) {
      if (key === 'files[]' || (key !== 'file' && val instanceof File)) {
        files.push(val);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No file(s) provided.' }, { status: 400 });
    }

    // Optional folder prefix from form (default: 'images')
    const folder = (formData.get('folder') || 'images')
      .replace(/[^a-zA-Z0-9/_-]/g, '')
      .replace(/^\/+|\/+$/g, '') || 'images';

    for (const file of files) {
      const originalName = file.name || 'upload';
      const mimeType = file.type || 'image/jpeg';

      if (!ALLOWED_TYPES.has(mimeType)) {
        errors.push({ file: originalName, error: `Unsupported type: ${mimeType}` });
        continue;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_SIZE_MB) {
        errors.push({ file: originalName, error: `File too large (${sizeMB.toFixed(1)} MB, max ${MAX_FILE_SIZE_MB} MB)` });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Build a unique key: folder/timestamp-sanitizedName.ext
      const ext = EXT_MAP[mimeType] || 'jpg';
      const safeName = originalName
        .replace(/\.[^.]+$/, '')           // strip existing extension
        .replace(/[^a-zA-Z0-9_-]/g, '-')  // sanitize
        .slice(0, 80);
      const timestamp = Date.now();
      const key = `${folder}/${timestamp}-${safeName}.${ext}`;

      const url = await uploadImageToR2(buffer, key, mimeType);

      if (!url) {
        errors.push({ file: originalName, error: 'Upload returned no URL.' });
        continue;
      }

      results.push({
        originalName,
        key,
        url,
        mimeType,
        sizeBytes: buffer.length,
        sizeMB: parseFloat((buffer.length / (1024 * 1024)).toFixed(2)),
      });
    }

    return NextResponse.json({ results, errors }, { status: 200 });
  } catch (err) {
    console.error('[upload-image] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}
