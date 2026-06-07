import { NextResponse } from 'next/server';
import { TEMPLATES_CATALOG } from '@/lib/practice/templatesCatalog';
import {
  listAllDynamicTemplates,
  saveDynamicTemplate,
  deleteDynamicTemplate
} from '@/lib/practice/questionBank/dynamicTemplatesRepository';

export async function GET(request) {
  try {
    const dynamicTemplates = await listAllDynamicTemplates();
    return NextResponse.json({
      success: true,
      templates: TEMPLATES_CATALOG,
      dynamicTemplates
    });
  } catch (error) {
    console.error('Templates API GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { template } = body || {};

    if (!template || !template.id) {
      return NextResponse.json({
        success: false,
        error: 'Template object with a unique "id" field is required.'
      }, { status: 400 });
    }

    const result = await saveDynamicTemplate(template);
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Templates API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Template id query parameter is required.'
      }, { status: 400 });
    }

    const result = await deleteDynamicTemplate(id);
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Templates API DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

