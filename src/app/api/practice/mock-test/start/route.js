import { NextResponse } from 'next/server';
import { getMongoDb } from '../../../../../lib/db/mongo.js';
import { createSession } from '../../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, generateFromTemplates } from '../../../../../lib/exam/question-store.js';

export async function POST(req) {
  try {
    const { examId = 'jnvst', userId = 'guest_child' } = await req.json();

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 500 });
    }

    // Helper to fetch/generate N questions for a given section
    async function getQuestionsForSection(sec, neededCount) {
      let questions = await getAdaptiveCandidates({
        examId,
        section: sec,
        theta: 0.5,
        usedIds: [],
        limit: neededCount
      });

      if (questions.length < neededCount) {
        // Auto-generate fresh dynamic questions from templates
        const generated = await generateFromTemplates({ examId, section: sec });
        if (generated.length > 0) {
          const existingIds = new Set(questions.map(q => String(q._id || q.id)));
          for (const g of generated) {
            if (questions.length >= neededCount) break;
            const gId = String(g._id || g.id);
            if (!existingIds.has(gId)) {
              existingIds.add(gId);
              questions.push(g);
            }
          }
        }
      }

      // If still needed, fill with fallback instances to guarantee exact question count
      let seedIndex = 1;
      while (questions.length < neededCount) {
        questions.push({
          _id: `${sec}_mock_q_${seedIndex}_${Date.now()}`,
          id: `${sec}_mock_q_${seedIndex}_${Date.now()}`,
          examId,
          section: sec,
          topic: 'General',
          difficulty: 0.5,
          questionText: `${sec.toUpperCase()} Mock Question #${questions.length + 1}: Select the correct option.`,
          options: {
            A: 'Option A',
            B: 'Option B',
            C: 'Option C',
            D: 'Option D'
          },
          correctOption: 'A',
          explanationText: 'Standard solution derived from section syllabus.'
        });
        seedIndex++;
      }

      return questions.slice(0, neededCount);
    }

    // 1. Fetch Section Questions (40 MAT, 20 Arithmetic, 20 Language = 80 Total)
    const matQuestions = await getQuestionsForSection('mat', 40);
    const arithmeticQuestions = await getQuestionsForSection('arithmetic', 20);
    const languageQuestions = await getQuestionsForSection('language', 20);

    // 2. Assemble 80 Questions with sequential question index (1 to 80)
    const all80Questions = [
      ...matQuestions.map((q, idx) => ({ ...q, qNumber: idx + 1, section: 'mat', sectionName: 'Mental Ability (MAT)' })),
      ...arithmeticQuestions.map((q, idx) => ({ ...q, qNumber: idx + 41, section: 'arithmetic', sectionName: 'Arithmetic Test' })),
      ...languageQuestions.map((q, idx) => ({ ...q, qNumber: idx + 61, section: 'language', sectionName: 'Language Test' })),
    ];

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
