import { NextResponse } from 'next/server';
import { createV2Node, listV2Nodes, seedV2Initial } from '@/lib/curriculum/storeV2';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    if (!type) {
      return NextResponse.json({ success: false, error: 'Type query parameter is required (grade, subject, unit, chapter, skill)' }, { status: 400 });
    }

    const query = {};
    ['subjectId', 'unitId', 'gradeId', 'chapterId', 'status'].forEach(key => {
      const val = searchParams.get(key);
      if (val) query[key] = val;
    });

    const nodes = await listV2Nodes(type, query);
    return NextResponse.json({ success: true, nodes });
  } catch (error) {
    console.error('API GET V2 curriculum error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'seed') {
      await seedV2Initial();
      return NextResponse.json({ success: true, message: 'Seeded initial grades successfully' });
    }

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'Both type and data fields are required' }, { status: 400 });
    }

    const node = await createV2Node(type, data);
    return NextResponse.json({ success: true, node }, { status: 201 });
  } catch (error) {
    console.error('API POST V2 curriculum error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Both type and id query parameters are required' }, { status: 400 });
    }

    const { deleteV2Node } = await import('@/lib/curriculum/storeV2');
    const result = await deleteV2Node(type, id);
    return NextResponse.json({ success: result.deletedCount > 0, ...result });
  } catch (error) {
    console.error('API DELETE V2 curriculum error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
