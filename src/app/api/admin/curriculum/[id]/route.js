import { NextResponse } from 'next/server';
import {
  deleteCurriculumNode,
  getCurriculumNode,
  updateCurriculumNode,
} from '@/lib/curriculum';

async function readId(context) {
  const params = await context.params;
  return decodeURIComponent(params.id);
}

export async function GET(_request, context) {
  try {
    const id = await readId(context);
    const node = await getCurriculumNode(id);
    if (!node) {
      return NextResponse.json({ success: false, error: 'Curriculum node not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, node });
  } catch (error) {
    console.error('Admin curriculum get error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const id = await readId(context);
    const body = await request.json();
    const node = await updateCurriculumNode(id, body?.node || body);
    if (!node) {
      return NextResponse.json({ success: false, error: 'Curriculum node not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, node });
  } catch (error) {
    console.error('Admin curriculum update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  try {
    const id = await readId(context);
    const result = await deleteCurriculumNode(id);
    return NextResponse.json({ success: result.deletedCount > 0, ...result });
  } catch (error) {
    console.error('Admin curriculum delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
