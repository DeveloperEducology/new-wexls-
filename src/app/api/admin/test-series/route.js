import { NextResponse } from 'next/server';
import { 
  createOrUpdateTestSeries, 
  getTestSeriesByExam, 
  createOrUpdateMockTest, 
  getMockTestById,
  linkQuestionsToMockTest,
  linkQuestionsByPyqYear
} from '../../../../lib/exam/test-series-store.js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId') || 'jnvst';
    const mockTestId = searchParams.get('mockTestId');

    if (mockTestId) {
      const mockTest = await getMockTestById(mockTestId);
      return NextResponse.json({ success: true, mockTest });
    }

    const testSeries = await getTestSeriesByExam(examId);
    return NextResponse.json({ success: true, testSeries });
  } catch (err) {
    console.error('[api/admin/test-series GET]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === 'createSeries') {
      const series = await createOrUpdateTestSeries(data);
      return NextResponse.json({ success: true, series });
    }

    if (action === 'createMockTest') {
      const mockTest = await createOrUpdateMockTest(data);
      return NextResponse.json({ success: true, mockTest });
    }

    if (action === 'linkQuestions') {
      const result = await linkQuestionsToMockTest(data.mockTestId, data.questionIds);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'linkByPyqYear') {
      const { mockTestId, examId, pyqYear } = data;
      if (!mockTestId || !examId || !pyqYear) {
        return NextResponse.json({ success: false, error: 'mockTestId, examId, and pyqYear are required' }, { status: 400 });
      }
      const result = await linkQuestionsByPyqYear(mockTestId, examId, Number(pyqYear));
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use createSeries, createMockTest, linkQuestions, or linkByPyqYear.' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/test-series POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
