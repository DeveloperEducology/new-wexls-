import { NextResponse } from 'next/server';
import { uploadImageToR2, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';
import { getImageDimensions, generateIxlMetadata } from '@/lib/gemini';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

const EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

const MAX_FILE_SIZE_MB = 10;

export const runtime = 'nodejs';

export async function POST(request) {
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

      // Build a unique key: folder/timestamp-sanitizedName.ext or use passed key for overwrites
      const passedKey = formData.get('key');
      let key = '';
      let safeName = '';
      let ext = EXT_MAP[mimeType] || 'jpg';

      if (passedKey) {
        key = passedKey;
        const base = passedKey.split('/').pop() || '';
        safeName = base.replace(/\.[^.]+$/, '').replace(/^[0-9]+-/, '') || 'cropped';
      } else {
        safeName = originalName
          .replace(/\.[^.]+$/, '')           // strip existing extension
          .replace(/[^a-zA-Z0-9_-]/g, '-')  // sanitize
          .slice(0, 80);
        const timestamp = Date.now();
        key = `${folder}/${timestamp}-${safeName}.${ext}`;
      }

      let url = '';
      if (isR2Configured()) {
        url = await uploadImageToR2(buffer, key, mimeType);
      } else {
        const fs = require('fs');
        const path = require('path');
        const publicDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const filename = `${Date.now()}-${safeName}.${ext}`;
        const filePath = path.join(publicDir, filename);
        fs.writeFileSync(filePath, buffer);
        url = `/uploads/${filename}`;
      }

      if (!url) {
        errors.push({ file: originalName, error: 'Upload returned no URL.' });
        continue;
      }

      // Generate dimensions and AI tags for IXL schema compatibility
      let dimensions = { width: 512, height: 512 };
      let aiTags = { singular: 'item', plural: 'items', article: 'an', category: 'general', tags: ['uploaded-asset'] };

      try {
        if (mimeType === 'image/svg+xml') {
          const svgText = buffer.toString('utf8');
          const widthMatch = svgText.match(/width=["'](\d+)(px)?["']/i);
          const heightMatch = svgText.match(/height=["'](\d+)(px)?["']/i);
          const viewBoxMatch = svgText.match(/viewBox=["']\d+\s+\d+\s+(\d+)\s+(\d+)["']/i);
          
          let w = 512, h = 512;
          if (widthMatch) w = parseInt(widthMatch[1], 10);
          if (heightMatch) h = parseInt(heightMatch[1], 10);
          else if (viewBoxMatch) {
            w = parseInt(viewBoxMatch[1], 10);
            h = parseInt(viewBoxMatch[2], 10);
          }
          dimensions = { width: w, height: h };
          aiTags = { singular: 'drawing', plural: 'drawings', article: 'a', category: 'illustrations', tags: ['svg', 'vector'] };
        } else {
          dimensions = getImageDimensions(buffer);
          aiTags = await generateIxlMetadata(buffer, mimeType);
        }
      } catch (err) {
        console.error('[upload-image] Failed to detect dimensions / run AI tagging:', err);
      }

      // Sync image metadata with MongoDB database
      try {
        const db = await getMongoDb();
        if (db) {
          await db.collection('image_assets').updateOne(
            { key: key },
            {
              $set: {
                name: safeName,
                url: url,
                folder: folder,
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
                  tags: Array.isArray(aiTags.tags) ? aiTags.tags : ['uploaded-asset']
                },
                metadata: {
                  createdAt: new Date(),
                  sourceUrl: 'local-upload'
                }
              }
            },
            { upsert: true }
          );
        }
      } catch (dbErr) {
        console.error('[upload-image] MongoDB update failed:', dbErr);
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

    return NextResponse.json({ 
      success: errors.length === 0, 
      url: results[0]?.url || '', 
      results, 
      errors 
    }, { status: 200 });
  } catch (err) {
    console.error('[upload-image] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}
