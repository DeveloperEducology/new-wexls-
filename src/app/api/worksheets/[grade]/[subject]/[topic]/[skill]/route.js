import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateWorksheetPdfBuffer } from '@/app/api/worksheets/generate/route';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { grade, subject, topic, skill } = resolvedParams;

    if (!grade || !subject || !topic || !skill) {
      return NextResponse.json({ error: 'Missing route parameters' }, { status: 400 });
    }

    const url = new URL(request.url);
    const columns = parseInt(url.searchParams.get('columns') || '1', 10);
    const includeAnswers = url.searchParams.get('includeAnswers') !== 'false';
    const font = url.searchParams.get('font') || 'Outfit';
    const spacing = url.searchParams.get('spacing') || 'compact';
    const illustrationStyle = url.searchParams.get('illustrationStyle') || 'cartoon outlines';

    // Clean skill filename (remove .pdf extension if added by crawler or browser link)
    const cleanSkill = String(skill).replace(/\.pdf$/i, '');
    const cacheFilename = `${cleanSkill}_col${columns}_ans${includeAnswers}_font${font}_spc${spacing}.pdf`;

    // Define cache path in public/worksheets/
    const relativeCachePath = `/worksheets/${grade}/${subject}/${topic}/${cacheFilename}`;
    const fullCachePath = path.join(process.cwd(), 'public', relativeCachePath);

    // 1. Serve from cache if exists
    if (fs.existsSync(fullCachePath)) {
      console.log(`[Worksheet Cache] Hit: ${relativeCachePath}`);
      const pdfBytes = fs.readFileSync(fullCachePath);
      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanSkill}-worksheet.pdf"`,
          'Content-Length': String(pdfBytes.length)
        }
      });
    }

    // 2. Generate on cache miss
    console.log(`[Worksheet Cache] Miss: ${relativeCachePath}. Generating...`);
    const pdfBuffer = await generateWorksheetPdfBuffer({
      grade,
      subject,
      topic,
      skill: cleanSkill,
      columns,
      includeAnswers,
      font,
      spacing,
      illustrationStyle
    });

    // 3. Write to public/ cache directory
    const dirPath = path.dirname(fullCachePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(fullCachePath, pdfBuffer);

    // 4. Return PDF payload
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${cleanSkill}-worksheet.pdf"`,
        'Content-Length': String(pdfBuffer.length)
      }
    });

  } catch (err) {
    console.error('[Worksheet Cache] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to serve worksheet' }, { status: 500 });
  }
}
