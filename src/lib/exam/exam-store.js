import { getMongoDb } from '../db/mongo.js';

// ── Seed JNVST exam definition ──────────────────────────────────────────
// ── Seed JNVST exam definition ──────────────────────────────────────────
const JNVST_EXAM = {
  _id: 'jnvst',
  id: 'jnvst',
  name: 'JNVST',
  fullName: 'Jawahar Navodaya Vidyalaya Selection Test',
  targetClass: 6,
  status: 'active',
  icon: '🏫',
  description: 'Highly competitive admission test for Jawahar Navodaya Vidyalayas. Consists of Mental Ability, Arithmetic, and Language sections.',
  metrics: '4 Sections • 100 Marks + PYQs',
  color: '#4f46e5',
  colorGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  bgLight: '#eef2ff',
  sections: [
    {
      id: 'mat',
      name: 'Mental Ability Test (MAT)',
      shortName: 'MAT',
      questionCount: 20,
      maxMarks: 25,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🧠',
      description: 'Non-verbal figure tests: Pattern completion, Figure series, Geometry completion, Mirror/Water image, Embedded figures',
      topics: [
        'pattern-completion',
        'figure-series-completion',
        'geometrical-figure-completion',
        'mirror-and-water-imaging',
        'embedded-figure'
      ],
    },
    {
      id: 'evs',
      name: 'Environmental Studies (EVS)',
      shortName: 'EVS',
      questionCount: 20,
      maxMarks: 25,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🌱',
      description: 'Basic awareness of surroundings: Natural world, Human body, Science in daily life, Social surroundings, and EVS passages',
      topics: [
        'the-natural-world',
        'the-human-body',
        'science-in-daily-life',
        'social-surroundings',
        'evs-comprehension-passages'
      ],
    },
    {
      id: 'arithmetic',
      name: 'Arithmetic Test',
      shortName: 'Arithmetic',
      questionCount: 20,
      maxMarks: 25,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🔢',
      description: 'Tests basic mathematical competencies as per 2027 JNVST prospectus',
      topics: [
        'number-and-numeric-system',
        'four-fundamental-operations',
        'factors-and-multiples',
        'fractions-and-operations',
        'measurement-and-unit-conversion',
        'simplification-numerical-expressions',
        'perimeter-and-area',
        'types-of-angles-directions-mapping',
        'data-analysis-bar-diagrams-tables',
        'averages'
      ],
    },
    {
      id: 'language',
      name: 'Language Test',
      shortName: 'Language',
      questionCount: 25,
      maxMarks: 15,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '📝',
      description: 'Tests reading comprehension and grammar',
      topics: ['comprehension', 'grammar', 'vocabulary', 'fill-in-the-blanks', 'sentence-correction'],
    },
    {
      id: 'previous_years',
      name: 'Previous Year Papers',
      shortName: 'PYQs',
      questionCount: 40,
      maxMarks: 50,
      timeLimitMinutes: 60,
      negativeMarking: 0,
      icon: '📅',
      description: 'Practice actual questions from previous year JNVST papers',
      topics: [
        'jnvst-2025-arithmetic',
        'jnvst-2025-language',
        'jnvst-2025-mat',
        'jnvst-2024-arithmetic',
        'jnvst-2024-language',
        'jnvst-2023-arithmetic',
        'jnvst-2023-language',
        'jnvst-2020-arithmetic',
        'jnvst-2020-language',
        'jnvst-2019-arithmetic',
        'jnvst-2019-language',
        'jnvst-2018-arithmetic',
        'jnvst-2018-language'
      ],
    },
  ],
  totalDuration: 120,
  totalMarks: 100,
  examFrequency: 'annual',
  passingCriteria: { general: 65, obc: 60, sc: 55, st: 50 },
  availableLanguages: ['english', 'hindi', 'telugu', 'kannada', 'marathi', 'tamil', 'gujarati'],
};










// ── Seed AISSEE exam definition ──────────────────────────────────────────
const AISSEE_EXAM = {
  _id: 'aissee',
  id: 'aissee',
  name: 'AISSEE',
  fullName: 'All India Sainik Schools Entrance Examination',
  targetClass: 6,
  status: 'active',
  icon: '🎖️',
  description: 'National level entrance examination for admission to Class VI and Class IX in Sainik Schools across India.',
  metrics: '5 Sections • 300 Marks + PYQs',
  color: '#0891b2',
  colorGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  bgLight: '#ecfeff',
  sections: [
    {
      id: 'mathematics',
      name: 'Mathematics',
      shortName: 'Math',
      questionCount: 50,
      maxMarks: 150,
      timeLimitMinutes: 60,
      negativeMarking: 0,
      icon: '🔢',
      description: 'Tests mathematical concepts and calculation skills',
      topics: ['integers', 'fractions-decimals', 'equations', 'geometry', 'mensuration', 'data-handling'],
    },
    {
      id: 'intelligence',
      name: 'Intelligence',
      shortName: 'Intelligence',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🧠',
      description: 'Tests logical reasoning, patterns, and analogical thinking',
      topics: ['analogies', 'classification', 'series', 'pattern-completion', 'logical-reasoning'],
    },
    {
      id: 'english',
      name: 'Language (English)',
      shortName: 'English',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '📝',
      description: 'Tests reading comprehension, grammar, and sentence structure',
      topics: ['comprehension', 'prepositions', 'verbs', 'articles', 'vocabulary', 'spelling-check'],
    },
    {
      id: 'general_knowledge',
      name: 'General Knowledge',
      shortName: 'GK',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🌍',
      description: 'Tests social studies and general science knowledge',
      topics: ['history', 'geography', 'general-science', 'culture-sports', 'civics'],
    },
    {
      id: 'previous_years',
      name: 'Previous Year Papers',
      shortName: 'PYQs',
      questionCount: 48,
      maxMarks: 150,
      timeLimitMinutes: 90,
      negativeMarking: 0,
      icon: '📅',
      description: 'Practice actual questions from previous year AISSEE papers',
      topics: ['aissee-2026-arithmetic', 'aissee-2026-english'],
    },
  ],
  totalDuration: 150,
  totalMarks: 300,
  examFrequency: 'annual',
  passingCriteria: { general: 120, obc: 110, sc: 100, st: 95 },
  availableLanguages: ['english', 'hindi'],
};

// ── Seed SSC CGL exam definition ──────────────────────────────────────────
const SSC_EXAM = {
  _id: 'ssc',
  id: 'ssc',
  name: 'SSC CGL',
  fullName: 'Staff Selection Commission - Combined Graduate Level',
  targetClass: 16,
  status: 'active',
  icon: '💼',
  description: 'Government service entrance exam for recruiting staff to various posts in ministries, departments and organizations.',
  metrics: '4 Sections • Tier I & II',
  color: '#059669',
  colorGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  bgLight: '#ecfdf5',
  sections: [
    {
      id: 'quantitative_aptitude',
      name: 'Quantitative Aptitude',
      shortName: 'Quant',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 20,
      negativeMarking: 0.5,
      icon: '🔢',
      description: 'Tests numerical ability and quantitative reasoning',
      topics: ['algebra', 'trigonometry', 'geometry', 'mensuration', 'arithmetic-ability', 'data-interpretation'],
    },
    {
      id: 'reasoning',
      name: 'General Intelligence & Reasoning',
      shortName: 'Reasoning',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 20,
      negativeMarking: 0.5,
      icon: '🧠',
      description: 'Tests logical and analytical reasoning capabilities',
      topics: ['syllogisms', 'blood-relations', 'direction-sense', 'coding-decoding', 'non-verbal-reasoning'],
    },
    {
      id: 'english_comprehension',
      name: 'English Comprehension',
      shortName: 'English',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 20,
      negativeMarking: 0.5,
      icon: '📝',
      description: 'Tests English language proficiency, grammar, and vocabulary',
      topics: ['reading-comprehension', 'spot-the-error', 'synonyms-antonyms', 'one-word-substitution', 'idioms-phrases'],
    },
    {
      id: 'general_awareness',
      name: 'General Awareness',
      shortName: 'GK/GA',
      questionCount: 25,
      maxMarks: 50,
      timeLimitMinutes: 20,
      negativeMarking: 0.5,
      icon: '🌍',
      description: 'Tests knowledge of current events, history, economy, and general science',
      topics: ['current-affairs', 'indian-history', 'geography', 'economics', 'general-science', 'polity'],
    },
  ],
  totalDuration: 60,
  totalMarks: 200,
  examFrequency: 'annual',
  passingCriteria: { general: 130, obc: 120, sc: 110, st: 100 },
  availableLanguages: ['english', 'hindi'],
};

export async function getExam(examId) {
  const db = await getMongoDb();
  if (!db) {
    if (examId === 'jnvst') return JNVST_EXAM;
    if (examId === 'aissee') return AISSEE_EXAM;
    if (examId === 'ssc') return SSC_EXAM;
    return null;
  }
  const exam = await db.collection('exams').findOne({ _id: examId });
  if (!exam) {
    if (examId === 'jnvst') return JNVST_EXAM;
    if (examId === 'aissee') return AISSEE_EXAM;
    if (examId === 'ssc') return SSC_EXAM;
  }
  return exam;
}

export async function listExams() {
  const db = await getMongoDb();
  const fallbacks = [JNVST_EXAM, AISSEE_EXAM, SSC_EXAM];
  if (!db) return fallbacks;

  try {
    for (const fallback of fallbacks) {
      await db.collection('exams').updateOne(
        { _id: fallback._id },
        { $set: { ...fallback, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('Failed to auto-seed exams:', err);
  }

  const exams = await db.collection('exams').find({}).toArray();
  if (exams.length === 0) return fallbacks;
  return exams;
}

export async function upsertExam(examData) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  await db.collection('exams').updateOne(
    { _id: examData._id },
    { $set: { ...examData, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getExamSection(examId, sectionId) {
  const exam = await getExam(examId);
  return exam?.sections?.find(s => s.id === sectionId) || null;
}

export async function deleteExam(examId) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  return db.collection('exams').deleteOne({ _id: examId });
}
