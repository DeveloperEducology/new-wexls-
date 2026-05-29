import { NextResponse } from 'next/server';
import { TEMPLATES_CATALOG } from '@/lib/practice/templatesCatalog';

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      templates: TEMPLATES_CATALOG
    });
  } catch (error) {
    console.error('Templates catalog API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
