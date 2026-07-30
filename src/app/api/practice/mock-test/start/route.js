import { NextResponse } from 'next/server';
import { getMongoDb } from '../../../../../lib/db/mongo.js';
import { createSession } from '../../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, generateFromTemplates } from '../../../../../lib/exam/question-store.js';
import { resolveUserId } from '../../../../../lib/auth/getAuthUser.js';
import { getMockTestById } from '../../../../../lib/exam/test-series-store.js';

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
      let sheetDoc = await db.collection('templates').findOne({ $or: [{ id: targetSpreadsheetId }, { _id: targetSpreadsheetId }] });
      if (!sheetDoc) {
        sheetDoc = await db.collection('dynamic_templates').findOne({ $or: [{ id: targetSpreadsheetId }, { _id: targetSpreadsheetId }] });
      }
      if (!sheetDoc) {
        sheetDoc = await db.collection('mock_tests').findOne({ $or: [{ id: targetSpreadsheetId }, { _id: targetSpreadsheetId }] });
      }

      if (sheetDoc && Array.isArray(sheetDoc.rows) && sheetDoc.rows.length > 0) {
        all80Questions = sheetDoc.rows.map((row, idx) => {
          const qNum = idx + 1;
          const sec = row.section || (qNum <= 40 ? 'mat' : (qNum <= 60 ? 'arithmetic' : 'language'));
          const secName = row.sectionName || (sec === 'mat' ? 'Mental Ability (MAT)' : (sec === 'arithmetic' ? 'Arithmetic Test' : 'Language Test'));

          const text = row.questionText || row.question || row.Question || row.questionPattern || row.blueprint || `Question #${qNum}`;
          
          const optA = row.optionA || row.A || row.Option1 || row.Distractor1 || '';
          const optB = row.optionB || row.B || row.Option2 || row.Distractor2 || '';
          const optC = row.optionC || row.C || row.Option3 || row.Distractor3 || '';
          const optD = row.optionD || row.D || row.Option4 || row.Result || '';

          const ans = row.answer || row.correctOption || row.correct || 'A';
          const exp = row.explanationText || row.explanation || row.Solution || '';

          return {
            qNumber: qNum,
            id: row._id || row.id || `${targetSpreadsheetId}_row_${qNum}`,
            examId,
            section: sec,
            sectionName: secName,
            questionText: text,
            parts: [{ type: 'text', content: text }],
            options: {
              A: String(optA),
              B: String(optB),
              C: String(optC),
              D: String(optD)
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

    // Sanitize questions for frontend (include options, hide raw answer during exam)
    const sanitizedQuestions = all80Questions.map(q => ({
      qNumber: q.qNumber,
      id: String(q._id || q.id),
      section: q.section,
      sectionName: q.sectionName,
      questionText: q.questionText || '',
      parts: q.parts || [{ type: 'text', content: q.questionText || '' }],
      options: q.options || {},
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

    // Store assembled questions array in session document
    await db.collection('sessions').updateOne(
      { _id: session._id },
      {
        $set: {
          questions: all80Questions.map(q => ({
            id: String(q._id || q.id),
            qNumber: q.qNumber,
            section: q.section,
            correctOption: q.correctOption || q.answer || 'A',
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
