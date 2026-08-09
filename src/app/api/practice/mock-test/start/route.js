import { NextResponse } from 'next/server';
import { getMongoDb } from '../../../../../lib/db/mongo.js';
import { createSession } from '../../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, generateFromTemplates } from '../../../../../lib/exam/question-store.js';
import { resolveUserId } from '../../../../../lib/auth/getAuthUser.js';
import { getMockTestById } from '../../../../../lib/exam/test-series-store.js';
import { JNVST_2025_PYQ_TEMPLATE } from '../../../../../lib/exam/jnvst2025PyqData.js';

export async function POST(req) {
  try {
    const { examId = 'jnvst', mockTestId = null, templateId = null, spreadsheetId = null, userId: providedUserId = 'guest_child' } = await req.json();
    const userId = resolveUserId(req, providedUserId);

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    // Check if a specific saved Mock Test was requested from DB
    let savedMockTest = null;
    if (mockTestId) {
      savedMockTest = await getMockTestById(mockTestId);
    }

    // Helper to fetch STATIC questions from DB in exact sequential order (No templates)
    async function getStaticQuestionsForSection(sec, neededCount) {
      const filter = {
        status: { $ne: 'inactive' },
        $or: [
          { section: sec },
          { section: sec.toLowerCase() },
          { examId, section: sec }
        ]
      };
      
      let staticQuestions = await db.collection('questions')
        .find(filter)
        .sort({ qNumber: 1, order: 1, createdAt: 1 })
        .limit(neededCount)
        .toArray();

      if (staticQuestions.length < neededCount) {
        const fallbackFilter = {
          status: { $ne: 'inactive' },
          section: { $regex: new RegExp(`^${sec}$`, 'i') }
        };
        const extra = await db.collection('questions')
          .find(fallbackFilter)
          .sort({ qNumber: 1, order: 1, createdAt: 1 })
          .limit(neededCount)
          .toArray();

        const seen = new Set(staticQuestions.map(q => String(q._id || q.id)));
        for (const q of extra) {
          const qId = String(q._id || q.id);
          if (!seen.has(qId)) {
            seen.add(qId);
            staticQuestions.push(q);
          }
        }
      }

      // If static questions exist, return sliced to neededCount
      if (staticQuestions.length >= neededCount) {
        return staticQuestions.slice(0, neededCount);
      }

      // Fill remaining count with static fallback questions orderwise
      let index = staticQuestions.length + 1;
      while (staticQuestions.length < neededCount) {
        staticQuestions.push({
          _id: `${sec}_static_q_${index}`,
          id: `${sec}_static_q_${index}`,
          examId,
          section: sec,
          qNumber: index,
          questionText: `${sec.toUpperCase()} Static Exam Question #${index}`,
          options: {
            A: 'Option A',
            B: 'Option B',
            C: 'Option C',
            D: 'Option D'
          },
          correctOption: 'A',
          explanationText: `Explanation for ${sec.toUpperCase()} Question #${index}`
        });
        index++;
      }

      return staticQuestions.slice(0, neededCount);
    }

    let all80Questions = [];

    const targetSpreadsheetId = templateId || spreadsheetId || mockTestId;
    if (targetSpreadsheetId) {
      const queryFilter = {
        $or: [
          { id: String(targetSpreadsheetId) },
          { _id: String(targetSpreadsheetId) },
          { id: new RegExp(`^${targetSpreadsheetId}$`, 'i') }
        ]
      };

      const [dynDocs, tplDocs, mockDocs] = await Promise.all([
        db.collection('dynamic_templates').find(queryFilter).sort({ updatedAt: -1 }).toArray(),
        db.collection('templates').find(queryFilter).sort({ updatedAt: -1 }).toArray(),
        db.collection('mock_tests').find(queryFilter).sort({ updatedAt: -1 }).toArray()
      ]);

      const candidates = [...dynDocs, ...tplDocs, ...mockDocs];

      // Sort by most recent updatedAt timestamp
      candidates.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });

      const sheetDoc = candidates.find(c => (Array.isArray(c.rows) && c.rows.length > 0) || (c.config && Array.isArray(c.config.rows) && c.config.rows.length > 0));

      let rawRows = (sheetDoc && Array.isArray(sheetDoc.rows) && sheetDoc.rows.length > 0)
        ? sheetDoc.rows
        : (sheetDoc && sheetDoc.config && Array.isArray(sheetDoc.config.rows) ? sheetDoc.config.rows : []);

      if (rawRows.length === 0 && (String(targetSpreadsheetId).includes('2025-jnvst-official-pyq-template') || String(targetSpreadsheetId) === '2025')) {
        rawRows = JNVST_2025_PYQ_TEMPLATE.rows;
      }

      if (rawRows.length > 0) {
        all80Questions = rawRows.map((row, idx) => {
          const qNum = idx + 1;
          const sec = row.section || (qNum <= 40 ? 'mat' : (qNum <= 60 ? 'arithmetic' : 'language'));
          const secName = row.sectionName || (sec === 'mat' ? 'Mental Ability (MAT)' : (sec === 'arithmetic' ? 'Arithmetic Test' : 'Language Test'));

          const text = row.questionText || row.question || row.Question || row.questionPattern || row.blueprint || `Question #${qNum}`;
          
          const optA = row.optionA ?? row.A ?? row.Option1 ?? row.Distractor1 ?? '';
          const optB = row.optionB ?? row.B ?? row.Option2 ?? row.Distractor2 ?? '';
          const optC = row.optionC ?? row.C ?? row.Option3 ?? row.Distractor3 ?? '';
          const optD = row.optionD ?? row.D ?? row.Option4 ?? row.Result ?? '';

          const ans = row.answer || row.correctOption || row.correct || 'A';
          const exp = row.explanationText || row.explanation || row.Solution || '';

          const qImg = row.questionImage || row.questionImageUrl || row.image || row.imageUrl || row.q_image || row.figure_image || row.figureImage || row.figure || '';
          const optAImg = row.optionAImage || row.optionA_image || row.A_image || row.a_image || '';
          const optBImg = row.optionBImage || row.optionB_image || row.B_image || row.b_image || '';
          const optCImg = row.optionCImage || row.optionC_image || row.C_image || row.c_image || '';
          const optDImg = row.optionDImage || row.optionD_image || row.D_image || row.d_image || '';

          return {
            qNumber: qNum,
            id: row._id || row.id || `${targetSpreadsheetId}_row_${qNum}`,
            examId,
            section: sec,
            sectionName: secName,
            questionText: text,
            questionImage: qImg,
            questionImageUrl: qImg,
            parts: [{ type: 'text', content: text }],
            options: {
              A: String(optA),
              B: String(optB),
              C: String(optC),
              D: String(optD)
            },
            optionsImages: {
              A: optAImg,
              B: optBImg,
              C: optCImg,
              D: optDImg
            },
            answer: String(ans),
            explanationText: String(exp)
          };
        });
      }
    }

    if (all80Questions.length === 0 && savedMockTest && Array.isArray(savedMockTest.questionIds) && savedMockTest.questionIds.length > 0) {
      // Load exact static question list linked to the saved Mock Test
      const qDocs = await db.collection('questions').find({
        $or: [
          { _id: { $in: savedMockTest.questionIds } },
          { id: { $in: savedMockTest.questionIds } }
        ]
      }).toArray();

      const docMap = new Map();
      qDocs.forEach(d => {
        docMap.set(String(d._id), d);
        if (d.id) docMap.set(String(d.id), d);
      });

      savedMockTest.questionIds.forEach((qId, idx) => {
        const doc = docMap.get(String(qId));
        if (doc) {
          all80Questions.push({
            ...doc,
            qNumber: idx + 1,
            sectionName: doc.section === 'mat' ? 'Mental Ability (MAT)' : (doc.section === 'arithmetic' ? 'Arithmetic Test' : 'Language Test')
          });
        }
      });
    }

    if (all80Questions.length === 0) {
      // 1. Fetch Section Questions (40 MAT, 20 Arithmetic, 20 Language = 80 Total) orderwise
      const matQuestions = await getStaticQuestionsForSection('mat', 40);
      const arithmeticQuestions = await getStaticQuestionsForSection('arithmetic', 20);
      const languageQuestions = await getStaticQuestionsForSection('language', 20);

      // 2. Assemble 80 Questions with sequential question index (1 to 80)
      all80Questions = [
        ...matQuestions.map((q, idx) => ({ ...q, qNumber: idx + 1, section: 'mat', sectionName: 'Mental Ability (MAT)' })),
        ...arithmeticQuestions.map((q, idx) => ({ ...q, qNumber: idx + 41, section: 'arithmetic', sectionName: 'Arithmetic Test' })),
        ...languageQuestions.map((q, idx) => ({ ...q, qNumber: idx + 61, section: 'language', sectionName: 'Language Test' })),
      ];
    }

    // Sanitize questions for frontend (include options, images, hide raw answer during exam)
    const sanitizedQuestions = all80Questions.map(q => ({
      qNumber: q.qNumber,
      id: String(q._id || q.id),
      section: q.section,
      sectionName: q.sectionName,
      questionText: q.questionText || '',
      questionImage: q.questionImage || q.questionImageUrl || q.image || q.imageUrl || q.q_image || q.figure_image || '',
      questionImageUrl: q.questionImage || q.questionImageUrl || q.image || q.imageUrl || q.q_image || q.figure_image || '',
      parts: q.parts || [{ type: 'text', content: q.questionText || '' }],
      options: q.options || {},
      optionsImages: q.optionsImages || {},
      optionsType: q.optionsType || 'mcq',
      explanationText: q.explanationText || ''
    }));

    // 3. Create persistent mock test session in DB
    const session = await createSession({
      userId,
      examId,
      section: 'full_mock',
      sessionType: 'full-mock-test',
      initialTheta: 0.5,
      sessionLength: 80,
      timeLimitSeconds: 7200 // 2 Hours (120 Minutes)
    });

    // Store assembled questions array in test_sessions document
    await db.collection('test_sessions').updateOne(
      { _id: session._id },
      {
        $set: {
          templateId: targetSpreadsheetId || '2020-jnvst-official-pyq-template',
          questions: all80Questions.map(q => ({
            id: String(q._id || q.id),
            qNumber: q.qNumber,
            section: q.section,
            sectionName: q.sectionName,
            questionText: q.questionText || '',
            questionImage: q.questionImage || q.imageUrl || '',
            options: q.options || { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
            optionsImages: q.optionsImages || {},
            correctOption: q.correctOption || q.answer || 'A',
            explanationText: q.explanationText || q.explanation || '',
            difficulty: q.difficulty || 0.5
          })),
          timeLimitSeconds: 7200,
          startedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      sessionId: String(session._id),
      totalQuestions: 80,
      timeLimitSeconds: 7200,
      questions: sanitizedQuestions
    });
  } catch (err) {
    console.error('[api/practice/mock-test/start]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
