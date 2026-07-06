import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/exam/session-store.js';
import { getQuestion } from '../../../../../lib/exam/question-store.js';
import { computeSessionReport } from '../../../../../lib/exam/adaptive-engine.js';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const session = await getSession(resolvedParams.sessionId);
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

    const report = session.report ?? computeSessionReport(session.responses, session.currentTheta);

    // Resolve details for each question attempted in the session
    const enrichedResponses = [];
    if (session.responses && session.responses.length > 0) {
      for (const resp of session.responses) {
        try {
          const qDetails = await getQuestion(resp.questionId);
          if (qDetails) {
            enrichedResponses.push({
              ...resp,
              questionText: qDetails.questionText,
              options: qDetails.options,
              correctOption: qDetails.correctOption,
              explanationText: qDetails.explanationText || qDetails.explanation?.sections?.[0]?.content || '',
              drillTemplateId: qDetails.drillTemplateId || null,
              section: qDetails.section || null
            });
          } else {
            enrichedResponses.push(resp);
          }
        } catch (err) {
          console.warn(`Failed to resolve question details for id ${resp.questionId}:`, err.message);
          enrichedResponses.push(resp);
        }
      }
    }

    const enrichedSession = {
      ...session,
      _id: String(session._id),
      responses: enrichedResponses
    };

    return NextResponse.json({ success: true, session: enrichedSession, report });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
