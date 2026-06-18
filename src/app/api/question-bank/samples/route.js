import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SAMPLES_DIR = path.join(process.cwd(), 'src/app/question-bank/samples');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (fileName) {
      // Prevent directory traversal
      const safeName = path.basename(fileName);
      if (!safeName.endsWith('.json')) {
        return NextResponse.json({ success: false, error: 'Only JSON files can be loaded' }, { status: 400 });
      }

      const filePath = path.join(SAMPLES_DIR, safeName);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ success: false, error: 'Sample file not found' }, { status: 404 });
      }

      const content = await fs.promises.readFile(filePath, 'utf8');
      return NextResponse.json({
        success: true,
        filename: safeName,
        content: JSON.parse(content)
      });
    }

    // List all files in the samples directory
    if (!fs.existsSync(SAMPLES_DIR)) {
      return NextResponse.json({ success: true, samples: [] });
    }

    const files = await fs.promises.readdir(SAMPLES_DIR);
    const samples = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        // Create a human-friendly name
        const displayName = f
          .replace('.json', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return { filename: f, name: displayName };
      });

    return NextResponse.json({
      success: true,
      samples
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
