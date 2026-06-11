import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { isR2Configured } from '@/lib/r2Service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentFilter = searchParams.get('student');

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({
        success: false,
        dbConnected: false,
        r2Configured: isR2Configured(),
        totalQuestions: 0,
        questionsWithAudio: 0,
        missingAudio: 0,
        mcqQuestions: 0,
        fibQuestions: 0,
        ttsCacheItems: 0,
        subjects: [],
        topics: [],
        error: 'Database connection failed'
      });
    }

    const questionsCollectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const questionsCollection = db.collection(questionsCollectionName);
    const cacheCollection = db.collection('tts_cache');

    // Perform queries
    const totalQuestions = await questionsCollection.countDocuments();
    
    const questionsWithAudio = await questionsCollection.countDocuments({
      audioUrl: { $exists: true, $ne: null, $ne: '' }
    });

    const mcqQuestions = await questionsCollection.countDocuments({
      type: { $in: ['mcq', 'multiplechoice', 'multipleChoice'] }
    });

    const fibQuestions = await questionsCollection.countDocuments({
      type: { $in: ['fillInTheBlank', 'fillinblank', 'fib'] }
    });

    const ttsCacheItems = await cacheCollection.countDocuments();

    // Fetch unique subjects and topics for filtering
    const subjects = await questionsCollection.distinct('subject');
    const topics = await questionsCollection.distinct('topic');

    // Retrieve Student Practice & Analytics Stats
    const attemptsCollection = db.collection('student_attempts');

    // Build query filter
    const query = {};
    if (studentFilter) {
      query.userId = studentFilter;
    }

    const totalAttempts = await attemptsCollection.countDocuments(query);
    const correctAttempts = await attemptsCollection.countDocuments({ ...query, isCorrect: true });
    const recentAttempts = await attemptsCollection
      .find(query)
      .sort({ loggedAt: -1, createdAt: -1 })
      .limit(10)
      .toArray();

    // Fetch distinct active students
    const activeStudents = await attemptsCollection.distinct('userId');

    // Calculate Topic Breakdown for Donut Chart
    const topicBreakdownRaw = await attemptsCollection.aggregate([
      { $match: query },
      { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]).toArray();

    const topicBreakdown = topicBreakdownRaw.map(item => ({
      topic: item._id || 'unknown',
      count: item.count
    }));

    // Calculate Friction Points (skills with lowest accuracy, min 1 attempt)
    const frictionPointsRaw = await attemptsCollection.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: '$skillId', 
          topic: { $first: '$topic' },
          total: { $sum: 1 }, 
          correct: { $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] } },
          avgTimeSpent: { $avg: '$timeSpentMs' }
        } 
      },
      { 
        $project: {
          skillId: '$_id',
          topic: 1,
          total: 1,
          correct: 1,
          avgTimeSpent: 1,
          accuracy: { $multiply: [{ $divide: ['$correct', '$total'] }, 100] }
        }
      },
      { $match: { total: { $gte: 1 } } },
      { $sort: { accuracy: 1, total: -1 } },
      { $limit: 5 }
    ]).toArray();

    // 1. Fetch unique skillIds defined in curriculum_nodes
    const curriculumCollection = db.collection('curriculum_nodes');
    const skillsDefinedCount = await curriculumCollection.countDocuments({ type: 'skill' });

    // 2. Fetch unique active templates
    let templatesCount = 0;
    try {
      templatesCount = await db.collection('dynamic_templates').countDocuments();
    } catch (e) {
      // fallback
    }

    // 3. Count unique skillIds implemented in questions
    const uniqueSkillsImplemented = (await questionsCollection.distinct('skillId')).length;

    // 4. Calculate questions by grade and topic in memory
    const skillNodes = await curriculumCollection.find({ type: 'skill' }).toArray();
    const skillMap = new Map();
    skillNodes.forEach(node => {
      skillMap.set(node.id || node.skillId, {
        grade: node.grade,
        topic: node.topicId
      });
    });

    const allQuestions = await questionsCollection.find({}, { projection: { id: 1, topic: 1, skillId: 1 } }).toArray();

    const gradeCounts = {};
    const topicCounts = {};

    function inferGrade(skillId, parentId) {
      const s = String(skillId || '').toLowerCase();
      const p = String(parentId || '').toLowerCase();
      if (s.includes('-lkg-') || s.startsWith('lkg-') || p.includes('lkg')) return 'LKG';
      if (s.includes('-ukg-') || s.startsWith('ukg-') || p.includes('ukg')) return 'UKG';
      if (s.includes('-prek-') || s.startsWith('prek-') || p.includes('prek') || p.includes('pre-k')) return 'Pre-K';
      if (s.includes('-g1-') || s.includes('-grade-1-') || p.includes('grade-1') || p.includes('1st-grade') || s.includes('-grade1-')) return 'Grade 1';
      if (s.includes('-g2-') || s.includes('-grade-2-') || p.includes('grade-2') || p.includes('2nd-grade') || s.includes('-grade2-')) return 'Grade 2';
      if (s.includes('-g3-') || s.includes('-grade-3-') || p.includes('grade-3') || p.includes('3rd-grade') || s.includes('-grade3-')) return 'Grade 3';
      if (s.includes('-g4-') || s.includes('-grade-4-') || p.includes('grade-4') || p.includes('4th-grade') || s.includes('-grade4-')) return 'Grade 4';
      if (s.includes('-g5-') || s.includes('-grade-5-') || p.includes('grade-5') || p.includes('5th-grade') || s.includes('-grade5-')) return 'Grade 5';
      if (s.includes('-g6-') || s.includes('-grade-6-') || p.includes('grade-6') || p.includes('6th-grade') || s.includes('-grade6-')) return 'Grade 6';
      if (s.includes('-g7-') || s.includes('-grade-7-') || p.includes('grade-7') || p.includes('7th-grade') || s.includes('-grade7-')) return 'Grade 7';
      if (s.includes('-g8-') || s.includes('-grade-8-') || p.includes('grade-8') || p.includes('8th-grade') || s.includes('-grade8-')) return 'Grade 8';
      if (s.includes('remediation') || p.includes('remediation')) return 'Remediation';
      return 'General Skills';
    }

    allQuestions.forEach(q => {
      let rawGrade = 'General Skills';
      const skillInfo = skillMap.get(q.skillId);
      if (skillInfo && skillInfo.grade) {
        rawGrade = skillInfo.grade;
      } else {
        rawGrade = inferGrade(q.skillId, q.topic);
      }
      
      let grade = String(rawGrade).trim();
      if (grade === '1') grade = 'Grade 1';
      if (grade === '2') grade = 'Grade 2';
      if (grade === '3') grade = 'Grade 3';
      if (grade === '4') grade = 'Grade 4';
      if (grade === '5') grade = 'Grade 5';
      if (grade === '6') grade = 'Grade 6';
      if (grade === '7') grade = 'Grade 7';
      if (grade === '8') grade = 'Grade 8';
      
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
      
      const topicName = q.topic || (skillInfo && skillInfo.topic) || 'general';
      const topicKey = topicName.charAt(0).toUpperCase() + topicName.slice(1);
      topicCounts[topicKey] = (topicCounts[topicKey] || 0) + 1;
    });

    const questionsByGrade = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }));
    const questionsByTopic = Object.entries(topicCounts).map(([topic, count]) => ({ topic, count }));

    return NextResponse.json({
      success: true,
      dbConnected: true,
      r2Configured: isR2Configured(),
      totalQuestions,
      questionsWithAudio,
      missingAudio: Math.max(0, totalQuestions - questionsWithAudio),
      mcqQuestions,
      fibQuestions,
      ttsCacheItems,
      subjects: subjects.filter(Boolean),
      topics: topics.filter(Boolean),
      students: activeStudents.filter(Boolean),
      topicBreakdown,
      frictionPoints: frictionPointsRaw.map(fp => ({
        ...fp,
        accuracy: Math.round(fp.accuracy),
        avgTimeSpent: fp.avgTimeSpent ? Math.round(fp.avgTimeSpent / 1000 * 10) / 10 : null
      })),
      analytics: {
        totalAttempts,
        correctAttempts,
        recentAttempts: recentAttempts.map(att => ({
          ...att,
          _id: String(att._id)
        }))
      },
      skillsDefinedCount,
      templatesCount,
      uniqueSkillsImplemented,
      questionsByGrade,
      questionsByTopic
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      dbConnected: false,
      r2Configured: isR2Configured(),
      error: error.message
    }, { status: 500 });
  }
}
