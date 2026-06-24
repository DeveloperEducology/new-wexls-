import { getMongoDb } from '../db/mongo.js';

// ── Seed JNVST exam definition ──────────────────────────────────────────
const JNVST_EXAM = {
  _id: 'jnvst',
  name: 'JNVST',
  fullName: 'Jawahar Navodaya Vidyalaya Selection Test',
  targetClass: 6,
  sections: [
    {
      id: 'mat',
      name: 'Mental Ability Test',
      shortName: 'MAT',
      questionCount: 50,
      maxMarks: 60,
      timeLimitMinutes: 60,
      negativeMarking: 0,
      icon: '🧠',
      description: 'Tests spatial, logical and pattern recognition skills',
      topics: ['analogy', 'series', 'coding-decoding', 'odd-one-out', 'figure-completion', 'mirror-image', 'embedded-figures'],
    },
    {
      id: 'arithmetic',
      name: 'Arithmetic Test',
      shortName: 'Arithmetic',
      questionCount: 25,
      maxMarks: 25,
      timeLimitMinutes: 30,
      negativeMarking: 0,
      icon: '🔢',
      description: 'Tests basic mathematical concepts',
      topics: ['fractions', 'percentages', 'ratios', 'time-distance', 'simple-interest', 'lcm-hcf', 'profit-loss', 'mensuration'],
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
  ],
  totalDuration: 120,
  totalMarks: 100,
  examFrequency: 'annual',
  passingCriteria: { general: 65, obc: 60, sc: 55, st: 50 },
  availableLanguages: ['english', 'hindi', 'telugu', 'kannada', 'marathi', 'tamil', 'gujarati'],
};

export async function getExam(examId) {
  const db = await getMongoDb();
  if (!db) return null;
  const exam = await db.collection('exams').findOne({ _id: examId });
  if (!exam && examId === 'jnvst') return JNVST_EXAM; // fallback
  return exam;
}

export async function listExams() {
  const db = await getMongoDb();
  if (!db) return [JNVST_EXAM];
  const exams = await db.collection('exams').find({}).toArray();
  if (exams.length === 0) return [JNVST_EXAM];
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
