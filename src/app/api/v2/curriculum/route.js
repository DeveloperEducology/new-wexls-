import { NextResponse } from 'next/server';
import { createV2Node, listV2Nodes, seedV2Initial } from '@/lib/curriculum/storeV2';
import { createIitNode, listIitNodes, seedIitInitial, deleteIitNode } from '@/lib/curriculum/storeIit';
import { createImoNode, listImoNodes, seedImoInitial, deleteImoNode } from '@/lib/curriculum/storeImo';
import { getMongoDb } from '@/lib/db/mongo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const iit = searchParams.get('iit') === 'true';
    const imo = searchParams.get('imo') === 'true';
    if (!type) {
      return NextResponse.json({ success: false, error: 'Type query parameter is required (grade, subject, unit, chapter, skill)' }, { status: 400 });
    }

    const query = {};
    ['subjectId', 'unitId', 'gradeId', 'chapterId', 'status'].forEach(key => {
      const val = searchParams.get(key);
      if (val) query[key] = val;
    });

    const nodes = iit 
      ? await listIitNodes(type, query)
      : (imo ? await listImoNodes(type, query) : await listV2Nodes(type, query));

    if (type === 'skill') {
      try {
        const db = await getMongoDb();
        if (db) {
          const chapterCollName = iit ? 'iit_chapters' : (imo ? 'imo_chapters' : 'chapters_v2');
          const unitCollName = iit ? 'iit_units' : (imo ? 'imo_units' : 'units_v2');
          
          const dbChapters = await db.collection(chapterCollName).find({}).toArray();
          const dbUnits = await db.collection(unitCollName).find({}).toArray();
          
          const chapterMap = new Map(dbChapters.map(c => [c.id, c]));
          const unitMap = new Map(dbUnits.map(u => [u.id, u]));
          
          nodes.forEach(node => {
            if (node.chapterId) {
              const chapter = chapterMap.get(node.chapterId);
              if (chapter) {
                node.topicId = chapter.unitId || chapter.topicId;
                const unit = unitMap.get(chapter.unitId || chapter.topicId);
                if (unit) {
                  node.subjectId = unit.subjectId;
                }
              }
            }
          });

          const skillIds = nodes.map(n => n.id).filter(Boolean);
          if (skillIds.length > 0) {
            const questions = await db.collection('questions')
              .find({ skillId: { $in: skillIds } })
              .project({ id: 1, skillId: 1, questionText: 1, type: 1 })
              .toArray();

            const skillQuestionsMap = {};
            questions.forEach(q => {
              if (!skillQuestionsMap[q.skillId]) {
                skillQuestionsMap[q.skillId] = [];
              }
              skillQuestionsMap[q.skillId].push({
                id: q.id,
                questionText: q.questionText,
                type: q.type
              });
            });

            nodes.forEach(node => {
              node.questions = skillQuestionsMap[node.id] || [];
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch questions for skills:', err.message);
      }
    }

    return NextResponse.json({ success: true, nodes });
  } catch (error) {
    console.error('API GET V2 curriculum error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const { type, data } = body;
    const iit = searchParams.get('iit') === 'true' || body.iit === true;
    const imo = searchParams.get('imo') === 'true' || body.imo === true;

    if (type === 'seed') {
      if (iit) {
        await seedIitInitial();
      } else if (imo) {
        await seedImoInitial();
      } else {
        await seedV2Initial();
      }
      return NextResponse.json({ success: true, message: 'Seeded initial grades successfully' });
    }

    if (!type || !data) {
      return NextResponse.json({ success: false, error: 'Both type and data fields are required' }, { status: 400 });
    }

    const node = iit
      ? await createIitNode(type, data)
      : (imo ? await createImoNode(type, data) : await createV2Node(type, data));
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
    const iit = searchParams.get('iit') === 'true';
    const imo = searchParams.get('imo') === 'true';

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Both type and id query parameters are required' }, { status: 400 });
    }

    const result = iit
      ? await deleteIitNode(type, id)
      : (imo 
          ? await deleteImoNode(type, id) 
          : await (async () => {
              const { deleteV2Node } = await import('@/lib/curriculum/storeV2');
              return deleteV2Node(type, id);
            })()
        );
    return NextResponse.json({ success: result.deletedCount > 0, ...result });
  } catch (error) {
    console.error('API DELETE V2 curriculum error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
