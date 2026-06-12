import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { hashPassword, hashPin } from '@/lib/authService';

export async function POST(request) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        message: "Demonstration seeding is restricted to development/staging environments."
      }, { status: 403 });
    }

    try {
      const db = await getMongoDb();
      if (!db) {
        return NextResponse.json({
          success: false,
          message: "Database offline. Seeding skipped, using active client-side simulation."
        }, { status: 200 });
      }

    // Clean existing analytics / dashboard collections
    const collectionsToClean = [
      'feature_flags',
      'parent_student_links',
      'subjects',
      'topics',
      'competencies',
      'skills',
      'practice_sessions',
      'student_skill_history',
      'question_attempts',
      'student_mastery',
      'alerts',
      'teacher_notes',
      'ai_insights',
      'content_analytics',
      'students',
      'users',
      'parents',
      'teachers',
      'schools',
      'classes'
    ];

    for (const coll of collectionsToClean) {
      try {
        await db.collection(coll).deleteMany({});
      } catch (e) {
        // Collection might not exist yet
      }
    }

    // 1. Seed Feature Flags
    const defaultFlags = [
      { featureKey: 'adaptiveLearning', enabled: true, description: 'Adapts practice question difficulty level dynamically', rolloutPercentage: 100 },
      { featureKey: 'aiInsights', enabled: true, description: 'Generates automated recommendations and strengths analysis', rolloutPercentage: 100 },
      { featureKey: 'teacherHeatmaps', enabled: true, description: 'Displays student accuracy vs skill and competency matrices', rolloutPercentage: 100 },
      { featureKey: 'advancedReports', enabled: true, description: 'Enables custom exports for PDF, Excel, and CSV formats', rolloutPercentage: 100 },
      { featureKey: 'parentRecommendations', enabled: true, description: 'Generates recommendations for home practice routines', rolloutPercentage: 100 }
    ];
    await db.collection('feature_flags').insertMany(defaultFlags);

    // 2. Seed Subjects, Topics, Competencies, Skills
    const subjectsData = [
      { _id: 'math', title: 'Mathematics', code: 'MATH' },
      { _id: 'english', title: 'English', code: 'ENG' },
      { _id: 'science', title: 'Science', code: 'SCI' },
      { _id: 'evs', title: 'EVS', code: 'EVS' },
      { _id: 'social', title: 'Social Studies', code: 'SOC' }
    ];
    await db.collection('subjects').insertMany(subjectsData);

    const topicsData = [
      { _id: 'math_numbers', subjectId: 'math', title: 'Number Systems & Sense' },
      { _id: 'math_arithmetic', subjectId: 'math', title: 'Operations & Arithmetic' },
      { _id: 'eng_phonics', subjectId: 'english', title: 'Phonics & Grammar' },
      { _id: 'sci_living', subjectId: 'science', title: 'Living Things & Environment' }
    ];
    await db.collection('topics').insertMany(topicsData);

    const competenciesData = [
      { _id: 'comp_phonics_beg', competencyId: 'comp_phonics_beg', subjectId: 'english', topicId: 'eng_phonics', title: 'Beginning Sounds', description: 'Recognizing starting phonemic sounds of verbal nouns', grade: 'UKG', learningObjectives: ['Identify beginning letter sounds', 'Group words by sound similarity'] },
      { _id: 'comp_math_placeval', competencyId: 'comp_math_placeval', subjectId: 'math', topicId: 'math_numbers', title: 'Place Values', description: 'Decomposing integers into ones, tens, hundreds, and thousands', grade: 'Grade 3', learningObjectives: ['Express numbers in expanded form', 'Compare relative digits value'] },
      { _id: 'comp_math_fractions', competencyId: 'comp_math_fractions', subjectId: 'math', topicId: 'math_arithmetic', title: 'Fractions & Parts', description: 'Visual representations and arithmetic operations on parts of a whole', grade: 'Grade 5', learningObjectives: ['Add fractions with like denominators', 'Convert improper fractions'] },
      { _id: 'comp_sci_plants', competencyId: 'comp_sci_plants', subjectId: 'science', topicId: 'sci_living', title: 'Photosynthesis & Flora', description: 'Understanding cell structure, light synthesis, and plants life cycle', grade: 'Grade 7', learningObjectives: ['List equations of photosynthesis', 'Label leaf microscopic views'] }
    ];
    await db.collection('competencies').insertMany(competenciesData);

    const skillsData = [
      { _id: 'skill_phonics_id', competencyId: 'comp_phonics_beg', title: 'Identify Beginning Sound', description: 'Click vocabulary item starting with specified sound', grade: 'UKG' },
      { _id: 'skill_phonics_match', competencyId: 'comp_phonics_beg', title: 'Match Sound to Letter', description: 'Drag-and-drop letter corresponding to the audioguide', grade: 'UKG' },
      { _id: 'skill_placeval_expand', competencyId: 'comp_math_placeval', title: 'Represent Expanded Form', description: 'Rewrite 3-digit and 4-digit numbers in expanded forms', grade: 'Grade 3' },
      { _id: 'skill_placeval_compare', competencyId: 'comp_math_placeval', title: 'Compare Digits Value', description: 'Identify digit positions and values compared to other positions', grade: 'Grade 3' },
      { _id: 'skill_frac_add', competencyId: 'comp_math_fractions', title: 'Adding Like Fractions', description: 'Perform sums on simple fractions with identical bases', grade: 'Grade 5' },
      { _id: 'skill_plant_cells', competencyId: 'comp_sci_plants', title: 'Cell Structure Recognition', description: 'Label cell walls, vacuoles, and chloroplast organelles', grade: 'Grade 7' }
    ];
    await db.collection('skills').insertMany(skillsData);

    // 3. Seed Users & Relationship Data
    const now = new Date();

    const schoolsData = [
      { _id: 'school_1', schoolCode: 'KC-SHARDA', name: 'Sharda International School', city: 'Mumbai', isActive: true, createdAt: now },
      { _id: 'school_2', schoolCode: 'KC-DPS', name: 'Delhi Public School', city: 'Delhi', isActive: true, createdAt: now }
    ];
    await db.collection('schools').insertMany(schoolsData);

    const classesData = [
      { _id: 'class_5a', classCode: '5A', schoolId: 'school_1', grade: 'Grade 5', section: 'A', teacherId: 'teach_sharma', isActive: true, createdAt: now },
      { _id: 'class_3b', classCode: '3B', schoolId: 'school_1', grade: 'Grade 3', section: 'B', teacherId: 'teach_sharma', isActive: true, createdAt: now },
      { _id: 'class_ukg', classCode: 'UKG-A', schoolId: 'school_2', grade: 'UKG', section: 'A', teacherId: 'teach_verma', isActive: true, createdAt: now }
    ];
    await db.collection('classes').insertMany(classesData);

    const usersData = [
      {
        _id: 'ryan_p',
        name: 'Aryan Sharma',
        username: 'ryan_p',
        role: 'student',
        pin: await hashPin('1234'),
        schoolId: 'school_1',
        classId: 'class_5a',
        isActive: true,
        createdAt: now
      },
      {
        _id: 'ananya_p',
        name: 'Ananya Sharma',
        username: 'ananya_p',
        role: 'student',
        pin: await hashPin('1234'),
        schoolId: 'school_1',
        classId: 'class_3b',
        isActive: true,
        createdAt: now
      },
      {
        _id: 'kabir_p',
        name: 'Kabir Patel',
        username: 'kabir_p',
        role: 'student',
        pin: await hashPin('1234'),
        schoolId: 'school_2',
        classId: 'class_ukg',
        isActive: true,
        createdAt: now
      },
      {
        _id: 'parent_sharma',
        name: 'Mrs. Sharma',
        email: 'parent_sharma@klasschamp.com',
        mobile: '+91 9876543210',
        role: 'parent',
        password: await hashPassword('password123'),
        isActive: true,
        createdAt: now
      },
      {
        _id: 'parent_patel',
        name: 'Mr. Patel',
        email: 'parent_patel@klasschamp.com',
        mobile: '+91 9876543211',
        role: 'parent',
        password: await hashPassword('password123'),
        isActive: true,
        createdAt: now
      },
      {
        _id: 'teach_sharma',
        name: 'Mrs. Sharma',
        email: 'teacher_patel@klasschamp.com',
        role: 'teacher',
        password: await hashPassword('password123'),
        schoolId: 'school_1',
        isActive: true,
        createdAt: now
      },
      {
        _id: 'school_admin_sharda',
        name: 'Sharda School Admin',
        email: 'admin_sharda@klasschamp.com',
        role: 'school-admin',
        password: await hashPassword('password123'),
        schoolId: 'school_1',
        isActive: true,
        createdAt: now
      },
      {
        _id: 'platform_root',
        name: 'Global Operational Admin',
        email: 'platform_admin@klasschamp.com',
        username: 'platform_root',
        role: 'admin',
        password: await hashPassword('password123'),
        isActive: true,
        createdAt: now
      }
    ];
    await db.collection('users').insertMany(usersData);

    const mockStudents = [
      { _id: 'stud_ryan', userId: 'ryan_p', parentId: 'parent_sharma', classId: 'class_5a', name: 'Aryan Sharma', streakDays: 7, totalXp: 1840, avatar: '🦁', grade: 'Grade 5' },
      { _id: 'stud_ananya', userId: 'ananya_p', parentId: 'parent_sharma', classId: 'class_3b', name: 'Ananya Sharma', streakDays: 14, totalXp: 3250, avatar: '🐰', grade: 'Grade 3' },
      { _id: 'stud_kabir', userId: 'kabir_p', parentId: 'parent_patel', classId: 'class_ukg', name: 'Kabir Patel', streakDays: 3, totalXp: 480, avatar: '🦊', grade: 'UKG' }
    ];
    await db.collection('students').insertMany(mockStudents);

    const parentStudentLinks = [
      { parentId: 'parent_sharma', studentId: 'stud_ryan', relation: 'Mother', createdAt: now },
      { parentId: 'parent_sharma', studentId: 'stud_ananya', relation: 'Mother', createdAt: now },
      { parentId: 'parent_patel', studentId: 'stud_kabir', relation: 'Father', createdAt: now }
    ];
    await db.collection('parent_student_links').insertMany(parentStudentLinks);

    // 4. Seed Transactional Logs: Practice Sessions & Question Attempts
    const sessions = [];
    const attempts = [];
    const studentsList = ['stud_ryan', 'stud_ananya', 'stud_kabir'];
    
    // Generate mock attempts and sessions over last 14 days
    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const loggedAt = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      studentsList.forEach(studentId => {
        const student = mockStudents.find(s => s._id === studentId);
        const randQuestions = Math.floor(Math.random() * 8) + 3; // 3 to 10 questions
        const randCorrect = Math.floor(Math.random() * (randQuestions - 1)) + 2; // at least 2 correct
        const xpEarned = randCorrect * 15;
        
        const isEnglish = student.grade === 'UKG';
        const activeSubject = isEnglish ? 'english' : 'math';
        const activeTopic = isEnglish ? 'eng_phonics' : 'math_numbers';
        const activeSkill = isEnglish ? 'skill_phonics_id' : (student.grade === 'Grade 3' ? 'skill_placeval_expand' : 'skill_frac_add');

        // Create practice session
        sessions.push({
          sessionId: `sess_${studentId}_${dayOffset}`,
          userId: student.userId,
          role: 'Student',
          grade: student.grade,
          subject: activeSubject,
          startTime: new Date(loggedAt.getTime() - 20 * 60 * 1000), // 20 mins ago
          endTime: loggedAt,
          durationMs: 20 * 60 * 1000,
          questionsAttempted: randQuestions,
          correctAnswers: randCorrect,
          incorrectAnswers: randQuestions - randCorrect,
          xpEarned,
          masteryGain: Math.floor(Math.random() * 8) + 2
        });

        // Create individual question attempts
        for (let q = 1; q <= randQuestions; q++) {
          const isCorrect = q <= randCorrect;
          attempts.push({
            userId: student.userId,
            skillId: activeSkill,
            topic: activeTopic,
            isCorrect,
            timeSpentMs: (Math.floor(Math.random() * 15) + 5) * 1000,
            difficulty: q <= 3 ? 'easy' : (q <= 7 ? 'medium' : 'hard'),
            loggedAt
          });
        }
      });
    }

    await db.collection('practice_sessions').insertMany(sessions);
    await db.collection('question_attempts').insertMany(attempts);

    // 5. Seed Student Mastery States & Growth History
    const masteryData = [
      { userId: 'ryan_p', skillId: 'skill_frac_add', score: 85, state: 'Proficient', lastPracticedAt: now },
      { userId: 'ryan_p', skillId: 'skill_placeval_expand', score: 98, state: 'Mastered', lastPracticedAt: now },
      { userId: 'ananya_p', skillId: 'skill_placeval_expand', score: 78, state: 'Developing', lastPracticedAt: now },
      { userId: 'ananya_p', skillId: 'skill_phonics_id', score: 95, state: 'Mastered', lastPracticedAt: now },
      { userId: 'kabir_p', skillId: 'skill_phonics_id', score: 62, state: 'Learning', lastPracticedAt: now },
      { userId: 'kabir_p', skillId: 'skill_phonics_match', score: 45, state: 'Learning', lastPracticedAt: now }
    ];
    await db.collection('student_mastery').insertMany(masteryData);

    const historyData = [
      { userId: 'ryan_p', skillId: 'skill_frac_add', competencyId: 'comp_math_fractions', masteryScore: 85, previousMasteryScore: 78, growthDelta: 7, createdAt: now },
      { userId: 'ryan_p', skillId: 'skill_placeval_expand', competencyId: 'comp_math_placeval', masteryScore: 98, previousMasteryScore: 92, growthDelta: 6, createdAt: now },
      { userId: 'ananya_p', skillId: 'skill_placeval_expand', competencyId: 'comp_math_placeval', masteryScore: 78, previousMasteryScore: 70, growthDelta: 8, createdAt: now }
    ];
    await db.collection('student_skill_history').insertMany(historyData);

    // 6. Seed Alerts & Notes
    const defaultAlerts = [
      { userId: 'ryan_p', type: 'Skill Regression', severity: 'warning', message: 'Accuracy dropped in Adding Like Fractions during last attempt.', isRead: false, createdAt: now },
      { userId: 'ananya_p', type: 'Long Inactivity', severity: 'info', message: 'Ananya has not practiced Phonics skills for 3 days.', isRead: false, createdAt: now },
      { userId: 'kabir_p', type: 'Falling Accuracy', severity: 'danger', message: 'Kabir experienced 3 consecutive failed attempts on Matching Letter Sound.', isRead: false, createdAt: now }
    ];
    await db.collection('alerts').insertMany(defaultAlerts);

    const teacherNotes = [
      { studentId: 'stud_ryan', teacherId: 'teach_sharma', content: 'Aryan is doing excellent in standard numeric systems but struggles slightly with numerator operations. Practice visualization tools.', recommendations: 'Practice interactive fraction blocks at home.', createdAt: now },
      { studentId: 'stud_kabir', teacherId: 'teach_verma', content: 'Kabir benefits heavily from voice guides. Encourage sound matching repetitions.', recommendations: 'Spend 5 minutes daily on letter sounds.', createdAt: now }
    ];
    await db.collection('teacher_notes').insertMany(teacherNotes);

    // 7. Seed AI Insights Persistence
    const aiInsights = [
      { userId: 'ryan_p', role: 'student', insightType: 'strengths', summary: 'Excellent base-ten visual conceptual understanding. Very high accuracy in multi-digit number expansions.', recommendations: ['Represent complex fractions visually', 'Engage in peer-helping tasks'], confidence: 94, generatedAt: now, expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { userId: 'ryan_p', role: 'parent', insightType: 'gaps', summary: 'Requires reinforcement in fraction additions where numerators sum to greater than one.', recommendations: ['Use visual fraction bars', 'Practice daily goals consistently'], confidence: 88, generatedAt: now, expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { userId: 'ryan_p', role: 'teacher', insightType: 'intervention', summary: 'Student is ready for promotion to harder algebraic challenges. Needs minor teacher prompt on improper fraction representations.', recommendations: ['Introduce conversion of visual formats', 'Pair with developing student'], confidence: 91, generatedAt: now, expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
    ];
    await db.collection('ai_insights').insertMany(aiInsights);

    // 8. Seed content_analytics
    const contentAnalytics = [
      { grade: 'UKG', subject: 'English', coverage: 85, skillCoverage: 90, assetCoverage: { audio: 95, svg: 80, interactive: 75 } },
      { grade: 'Grade 3', subject: 'Mathematics', coverage: 78, skillCoverage: 82, assetCoverage: { audio: 70, svg: 90, interactive: 85 } },
      { grade: 'Grade 5', subject: 'Mathematics', coverage: 92, skillCoverage: 95, assetCoverage: { audio: 85, svg: 95, interactive: 90 } },
      { grade: 'Grade 7', subject: 'Science', coverage: 60, skillCoverage: 65, assetCoverage: { audio: 40, svg: 75, interactive: 50 } }
    ];
    await db.collection('content_analytics').insertMany(contentAnalytics);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with dynamic analytics, curriculum structures, growth nodes, and insights."
    });
  } catch (error) {
    console.error("Dashboard database seeding error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
