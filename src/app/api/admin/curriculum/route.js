import { NextResponse } from 'next/server';
import {
  createCurriculumNode,
  getCurriculumTree,
  listCurriculumNodes,
} from '@/lib/curriculum';

function readFilters(request) {
  const { searchParams } = new URL(request.url);
  return {
    type: searchParams.get('type') || '',
    subjectId: searchParams.get('subjectId') || searchParams.get('subject') || '',
    topicId: searchParams.get('topicId') || searchParams.get('topic') || '',
    chapterId: searchParams.get('chapterId') || searchParams.get('chapter') || '',
    parentId: searchParams.get('parentId') || '',
    skillId: searchParams.get('skillId') || searchParams.get('skill') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    limit: searchParams.get('limit') || '',
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = readFilters(request);

    if (searchParams.get('tree') === 'true') {
      const result = await getCurriculumTree(filters);
      return NextResponse.json({ success: true, ...result });
    }

    const nodes = await listCurriculumNodes(filters);
    return NextResponse.json({ success: true, nodes });
  } catch (error) {
    console.error('Admin curriculum list error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = body?.node || body;
    const node = await createCurriculumNode(payload);
    return NextResponse.json({ success: true, node }, { status: 201 });
  } catch (error) {
    console.error('Admin curriculum create error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
