import { getMongoDb } from '@/lib/db/mongo';

const COLLECTION_MAP = {
  grade: 'iit_grades',
  subject: 'iit_subjects',
  unit: 'iit_units',
  chapter: 'iit_chapters',
  skill: 'iit_skills',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const createdIitIndexes = new Set();

export async function getIitCollection(type) {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection failed.');
  const collectionName = COLLECTION_MAP[type];
  if (!collectionName) throw new Error(`Unknown IIT curriculum type: ${type}`);
  const collection = db.collection(collectionName);
  
  if (!createdIitIndexes.has(type)) {
    createdIitIndexes.add(type);
    collection.createIndex({ id: 1 }, { unique: true }).catch(console.warn);
    if (type === 'unit') {
      collection.createIndex({ subjectId: 1 }).catch(console.warn);
    } else if (type === 'chapter') {
      collection.createIndex({ unitId: 1, gradeId: 1 }).catch(console.warn);
    } else if (type === 'skill') {
      collection.createIndex({ chapterId: 1 }).catch(console.warn);
    }
  }
  
  return collection;
}

export async function createIitNode(type, data) {
  const collection = await getIitCollection(type);
  const id = slugify(data.id || data.title || data.name);
  if (!id) throw new Error('ID or Title is required to create a node.');
  
  const now = new Date();
  const normalized = {
    ...data,
    id,
    _id: id,
    status: data.status || 'active',
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  if (normalized.title && typeof normalized.title === 'string') {
    normalized.title = normalized.title.trim();
  }
  if (normalized.code && typeof normalized.code === 'string') {
    normalized.code = normalized.code.trim();
  }
  if (normalized.engine && typeof normalized.engine === 'string') {
    normalized.engine = normalized.engine.trim();
  }

  // Normalize relation IDs
  if (normalized.subjectId) normalized.subjectId = slugify(normalized.subjectId);
  if (normalized.unitId) normalized.unitId = slugify(normalized.unitId);
  if (normalized.gradeId) normalized.gradeId = slugify(normalized.gradeId);
  if (normalized.chapterId) normalized.chapterId = slugify(normalized.chapterId);

  const updateDoc = { ...normalized };
  delete updateDoc._id;
  await collection.updateOne({ id }, { $set: updateDoc, $setOnInsert: { _id: id } }, { upsert: true });
  return collection.findOne({ id });
}

export async function listIitNodes(type, query = {}) {
  const collection = await getIitCollection(type);
  const filter = { ...query };
  
  if (filter.subjectId) filter.subjectId = slugify(filter.subjectId);
  if (filter.unitId) filter.unitId = slugify(filter.unitId);
  if (filter.gradeId) filter.gradeId = slugify(filter.gradeId);
  if (filter.chapterId) filter.chapterId = slugify(filter.chapterId);

  const docs = await collection.find(filter).sort({ order: 1, title: 1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    _id: doc._id ? String(doc._id) : undefined
  }));
}

export async function deleteIitNode(type, id) {
  const collection = await getIitCollection(type);
  const result = await collection.deleteOne({ id: slugify(id) });
  return { deletedCount: result.deletedCount };
}

export async function seedIitInitial() {
  try {
    console.log('Seeding IIT collections...');

    // 1. Seed Grades (Grade 6 to 12)
    const grades = [
      { id: 'grade-6', title: 'Grade 6 (IIT Foundation)', order: 6 },
      { id: 'grade-7', title: 'Grade 7 (IIT Foundation)', order: 7 },
      { id: 'grade-8', title: 'Grade 8 (IIT Foundation)', order: 8 },
      { id: 'grade-9', title: 'Grade 9 (IIT Foundation)', order: 9 },
      { id: 'grade-10', title: 'Grade 10 (IIT Foundation)', order: 10 },
      { id: 'grade-11', title: 'Grade 11 (IIT Foundation)', order: 11 },
      { id: 'grade-12', title: 'Grade 12 (IIT Foundation)', order: 12 },
    ];
    for (const g of grades) {
      await createIitNode('grade', g);
    }

    // 2. Seed Subjects
    const subjects = [
      { id: 'math', title: 'Mathematics', icon: '🧮', order: 1 },
      { id: 'physics', title: 'Physics', icon: '⚛️', order: 2 },
      { id: 'chemistry', title: 'Chemistry', icon: '🧪', order: 3 },
    ];
    for (const s of subjects) {
      await createIitNode('subject', s);
    }

    // 3. Seed Units (Topics)
    const units = [
      { id: 'algebra', title: 'Algebra & Number Systems', subjectId: 'math', color: '#3b82f6', order: 1 },
      { id: 'geometry', title: 'Geometry & Trigonometry', subjectId: 'math', color: '#8b5cf6', order: 2 },
      { id: 'mechanics', title: 'Measurements', subjectId: 'physics', color: '#10b981', order: 3 },
      { id: 'electricity', title: 'Electricity & Magnetism', subjectId: 'physics', color: '#f59e0b', order: 4 },
      { id: 'physical-chemistry', title: 'Physical Chemistry', subjectId: 'chemistry', color: '#ef4444', order: 5 },
      { id: 'inorganic-chemistry', title: 'Inorganic Chemistry', subjectId: 'chemistry', color: '#ec4899', order: 6 },
    ];
    for (const u of units) {
      await createIitNode('unit', u);
    }

    // 4. Seed Chapters
    const chapters = [
      // Grade 6
      { id: 'linear-equations', title: 'Linear Equations in One Variable', unitId: 'algebra', gradeId: 'grade-6', order: 1 },
      { id: 'iit-motion-6', title: 'Motion and Force', unitId: 'mechanics', gradeId: 'grade-6', order: 2 },
      { id: 'iit-measurement-6', title: 'Measurement', unitId: 'mechanics', gradeId: 'grade-6', order: 3 },
      { id: 'iit-work-energy-6', title: 'Energy and Work', unitId: 'mechanics', gradeId: 'grade-6', order: 4 },
      { id: 'iit-light-6', title: 'Light', unitId: 'mechanics', gradeId: 'grade-6', order: 5 },
      { id: 'iit-electricity-6', title: 'Electricity', unitId: 'mechanics', gradeId: 'grade-6', order: 6 },
      
      // Grade 7
      { id: 'triangles', title: 'Properties of Triangles', unitId: 'geometry', gradeId: 'grade-7', order: 1 },
      { id: 'iit-heat-7', title: 'Heat and Temperature', unitId: 'mechanics', gradeId: 'grade-7', order: 2 },
      { id: 'iit-motion-7', title: 'Motion and Time', unitId: 'mechanics', gradeId: 'grade-7', order: 3 },
      { id: 'iit-electric-7', title: 'Electric Current & Its Effects', unitId: 'electricity', gradeId: 'grade-7', order: 4 },

      // Grade 8
      { id: 'exponents', title: 'Exponents and Powers', unitId: 'algebra', gradeId: 'grade-8', order: 1 },
      { id: 'iit-forces-8', title: 'Force and Pressure', unitId: 'mechanics', gradeId: 'grade-8', order: 2 },

      // Grade 9
      { id: 'polynomials', title: 'Polynomials & Algebraic Expressions', unitId: 'algebra', gradeId: 'grade-9', order: 1 },
      { id: 'iit-kinematics-9', title: 'Kinematics & Laws of Motion', unitId: 'mechanics', gradeId: 'grade-9', order: 2 },

      // Grade 10
      { id: 'quadratic-equations', title: 'Quadratic Equations', unitId: 'algebra', gradeId: 'grade-10', order: 1 },
      { id: 'light-refraction', title: 'Light - Reflection and Refraction', unitId: 'electricity', gradeId: 'grade-10', order: 2 },

      // Grade 11
      { id: 'vectors-11', title: 'Vectors and Coordinate Geometry', unitId: 'geometry', gradeId: 'grade-11', order: 1 },
      { id: 'atomic-structure', title: 'Atomic Structure & Periodicity', unitId: 'inorganic-chemistry', gradeId: 'grade-11', order: 2 },

      // Grade 12
      { id: 'electrostatics', title: 'Electrostatics & Capacitance', unitId: 'electricity', gradeId: 'grade-12', order: 1 },
      { id: 'chemical-kinetics', title: 'Chemical Kinetics', unitId: 'physical-chemistry', gradeId: 'grade-12', order: 2 },
    ];
    for (const c of chapters) {
      await createIitNode('chapter', c);
    }

    // 5. Seed Skills
    const skills = [
      // Grade 6 Algebra
      { id: 'solve-one-step', title: 'Solve one-step linear equations', chapterId: 'linear-equations', code: 'A.1', templateId: 'fractions-g5-add-like-fractions', engine: 'StickersEngine', order: 1 },
      { id: 'solve-two-step', title: 'Solve two-step linear equations', chapterId: 'linear-equations', code: 'A.2', templateId: 'fractions-g5-add-like-fractions', engine: 'StickersEngine', order: 2 },

      // Grade 6 Mechanics - Motion and Force
      { id: 'iit-p6-rest-and-motion', title: 'Understand states of rest and motion', chapterId: 'iit-motion-6', code: 'P.6.1.1', templateId: 'iit-p6-rest-and-motion', engine: 'questionBank', order: 1 },
      { id: 'iit-p6-translatory-motion', title: 'Translatory motion: rectilinear and curvilinear', chapterId: 'iit-motion-6', code: 'P.6.1.2', templateId: 'iit-p6-translatory-motion', engine: 'questionBank', order: 2 },
      { id: 'iit-p6-rotational-circular', title: 'Distinguish rotational and circular motion', chapterId: 'iit-motion-6', code: 'P.6.1.3', templateId: 'iit-p6-rotational-circular', engine: 'questionBank', order: 3 },
      { id: 'iit-p6-oscillatory-vibratory', title: 'Oscillatory and vibratory motion', chapterId: 'iit-motion-6', code: 'P.6.1.4', templateId: 'iit-p6-oscillatory-vibratory', engine: 'questionBank', order: 4 },
      { id: 'iit-p6-motion-types-misc', title: 'Periodic, random, and multiple motion', chapterId: 'iit-motion-6', code: 'P.6.1.5', templateId: 'iit-p6-motion-types-misc', engine: 'questionBank', order: 5 },
      { id: 'iit-p6-concept-of-force', title: 'Force: push, pull, and effects', chapterId: 'iit-motion-6', code: 'P.6.2.1', templateId: 'iit-p6-concept-of-force', engine: 'questionBank', order: 6 },
      { id: 'iit-p6-contact-noncontact', title: 'Contact and non-contact forces', chapterId: 'iit-motion-6', code: 'P.6.2.2', templateId: 'iit-p6-contact-noncontact', engine: 'questionBank', order: 7 },
      { id: 'iit-p6-noncontact-types', title: 'Magnetic, electrostatic, and gravitational forces', chapterId: 'iit-motion-6', code: 'P.6.2.3', templateId: 'iit-p6-noncontact-types', engine: 'questionBank', order: 8 },
      { id: 'iit-p6-distance-displacement', title: 'Distance and displacement calculations', chapterId: 'iit-motion-6', code: 'P.6.2.4', templateId: 'iit-p6-distance-displacement', engine: 'questionBank', order: 9 },
      { id: 'iit-p6-net-force', title: 'Calculate net force and direction', chapterId: 'iit-motion-6', code: 'P.6.2.5', templateId: 'iit-p6-net-force', engine: 'questionBank', order: 10 },
      {
        id: 'iit-p6-unit-normalization-time',
        title: 'Unit Normalization (Time)',
        chapterId: 'iit-motion-6',
        code: 'P.6.2.6',
        templateId: 'iit-p6-unit-normalization-time',
        engine: 'universal-template',
        order: 11,
        metadata: {
          difficultyScaling: true,
          templateLevels: [
            { level: 1, templateIds: ['iit-p6-unit-normalization-time'] },
            { level: 2, templateIds: ['iit-p6-direct-velocity-application'] },
            { level: 3, templateIds: ['iit-p6-multi-step-procedural-synthesis'] }
          ]
        },
        templateLevels: [
          { level: 1, templateIds: ['iit-p6-unit-normalization-time'] },
          { level: 2, templateIds: ['iit-p6-direct-velocity-application'] },
          { level: 3, templateIds: ['iit-p6-multi-step-procedural-synthesis'] }
        ]
      },
      { id: 'iit-p6-direct-velocity-application', title: 'Direct Velocity Application', chapterId: 'iit-motion-6', code: 'P.6.2.7', templateId: 'iit-p6-direct-velocity-application', engine: 'universal-template', order: 12 },
      { id: 'iit-p6-segmented-motion-aggregation', title: 'Segmented Motion Aggregation', chapterId: 'iit-motion-6', code: 'P.6.2.8', templateId: 'iit-p6-segmented-motion-aggregation', engine: 'universal-template', order: 13 },
      { id: 'iit-p6-multi-step-procedural-synthesis', title: 'Multi-Step Procedural Synthesis', chapterId: 'iit-motion-6', code: 'P.6.2.9', templateId: 'iit-p6-multi-step-procedural-synthesis', engine: 'universal-template', order: 14 },

      // Grade 6 Mechanics - Measurement (27 Chained Micro-skills)
      { id: 'iit-p6-compare-without-measuring', title: 'Compare quantities visually without measuring', chapterId: 'iit-measurement-6', code: 'P.6.1.1', templateId: 'iit-p6-compare-without-measuring', engine: 'questionBank', order: 1 },
      { id: 'iit-p6-need-standard-units', title: 'Understand the need for standard units', chapterId: 'iit-measurement-6', code: 'P.6.1.2', templateId: 'iit-p6-need-standard-units', engine: 'questionBank', order: 2 },
      { id: 'iit-p6-identify-length', title: 'Identify length as distance between points', chapterId: 'iit-measurement-6', code: 'P.6.2.1', templateId: 'iit-p6-identify-length', engine: 'questionBank', order: 3 },
      { id: 'iit-p6-units-of-length', title: 'Units of length (multiples & sub-multiples)', chapterId: 'iit-measurement-6', code: 'P.6.2.2', templateId: 'iit-p6-units-of-length', engine: 'questionBank', order: 4 },
      { id: 'iit-p6-convert-units-length', title: 'Convert length units (mm, cm, m, km)', chapterId: 'iit-measurement-6', code: 'P.6.2.3', templateId: 'iit-p6-convert-units-length', engine: 'questionBank', order: 5 },
      { id: 'iit-p6-read-scale', title: 'Read a scale correctly & apply end corrections', chapterId: 'iit-measurement-6', code: 'P.6.2.4', templateId: 'iit-p6-read-scale', engine: 'questionBank', order: 6 },
      { id: 'iit-p6-least-count', title: 'Determine the least count of an instrument', chapterId: 'iit-measurement-6', code: 'P.6.2.5', templateId: 'iit-p6-least-count', engine: 'questionBank', order: 7 },
      { id: 'iit-p6-measure-curved-lines', title: 'Measure lengths of curved lines using thread', chapterId: 'iit-measurement-6', code: 'P.6.2.6', templateId: 'iit-p6-measure-curved-lines', engine: 'questionBank', order: 8 },
      { id: 'iit-p6-measure-tiny-objects', title: 'Measure dimensions of tiny/indirect objects', chapterId: 'iit-measurement-6', code: 'P.6.2.7', templateId: 'iit-p6-measure-tiny-objects', engine: 'questionBank', order: 9 },
      { id: 'iit-p6-what-is-area', title: 'Understand area as surface space covered', chapterId: 'iit-measurement-6', code: 'P.6.3.1', templateId: 'iit-p6-what-is-area', engine: 'questionBank', order: 10 },
      { id: 'iit-p6-area-of-rectangle', title: 'Calculate area of a rectangle/square', chapterId: 'iit-measurement-6', code: 'P.6.3.2', templateId: 'iit-p6-area-of-rectangle', engine: 'questionBank', order: 11 },
      { id: 'iit-p6-area-units', title: 'Convert units of area (cm², m², hectares)', chapterId: 'iit-measurement-6', code: 'P.6.3.3', templateId: 'iit-p6-area-units', engine: 'questionBank', order: 12 },
      { id: 'iit-p6-irregular-area', title: 'Measure irregular area using graph paper', chapterId: 'iit-measurement-6', code: 'P.6.3.4', templateId: 'iit-p6-irregular-area', engine: 'questionBank', order: 13 },
      { id: 'iit-p6-what-is-volume', title: 'Understand volume as space occupied by objects', chapterId: 'iit-measurement-6', code: 'P.6.4.1', templateId: 'iit-p6-what-is-volume', engine: 'questionBank', order: 14 },
      { id: 'iit-p6-cuboid-volume', title: 'Calculate volume of regular solids (cuboids)', chapterId: 'iit-measurement-6', code: 'P.6.4.2', templateId: 'iit-p6-cuboid-volume', engine: 'questionBank', order: 15 },
      { id: 'iit-p6-liquid-volume', title: 'Measure liquid volume & read meniscus', chapterId: 'iit-measurement-6', code: 'P.6.4.3', templateId: 'iit-p6-liquid-volume', engine: 'questionBank', order: 16 },
      { id: 'iit-p6-irregular-volume', title: 'Measure irregular volume (water displacement)', chapterId: 'iit-measurement-6', code: 'P.6.4.4', templateId: 'iit-p6-irregular-volume', engine: 'questionBank', order: 17 },
      { id: 'iit-p6-mass-concept', title: 'Understand mass as the amount of matter', chapterId: 'iit-measurement-6', code: 'P.6.5.1', templateId: 'iit-p6-mass-concept', engine: 'questionBank', order: 18 },
      { id: 'iit-p6-mass-units', title: 'Units of mass (mg, g, kg, quintal, tonne)', chapterId: 'iit-measurement-6', code: 'P.6.5.2', templateId: 'iit-p6-mass-units', engine: 'questionBank', order: 19 },
      { id: 'iit-p6-convert-mass', title: 'Convert units of mass', chapterId: 'iit-measurement-6', code: 'P.6.5.3', templateId: 'iit-p6-convert-mass', engine: 'questionBank', order: 20 },
      { id: 'iit-p6-time-concept', title: 'Understand time as interval between events', chapterId: 'iit-measurement-6', code: 'P.6.6.1', templateId: 'iit-p6-time-concept', engine: 'questionBank', order: 21 },
      { id: 'iit-p6-time-units', title: 'Units of time (seconds to millennia)', chapterId: 'iit-measurement-6', code: 'P.6.6.2', templateId: 'iit-p6-time-units', engine: 'questionBank', order: 22 },
      { id: 'iit-p6-clock-reading', title: 'Read clocks & convert 12h/24h formats', chapterId: 'iit-measurement-6', code: 'P.6.6.3', templateId: 'iit-p6-clock-reading', engine: 'questionBank', order: 23 },
      { id: 'iit-p6-choose-instrument', title: 'Choose the correct measuring instrument', chapterId: 'iit-measurement-6', code: 'P.6.7.1', templateId: 'iit-p6-choose-instrument', engine: 'questionBank', order: 24 },
      { id: 'iit-p6-unit-conversion-algorithm', title: 'Apply the universal unit conversion algorithm', chapterId: 'iit-measurement-6', code: 'P.6.8.1', templateId: 'iit-p6-unit-conversion-algorithm', engine: 'questionBank', order: 25 },
      { id: 'iit-p6-estimation-real-world', title: 'Estimate physical quantities in real-world', chapterId: 'iit-measurement-6', code: 'P.6.9.1', templateId: 'iit-p6-estimation-real-world', engine: 'questionBank', order: 26 },
      { id: 'iit-p6-mixed-measurement', title: 'Solve mixed and integrated measurement problems', chapterId: 'iit-measurement-6', code: 'P.6.10.1', templateId: 'iit-p6-mixed-measurement', engine: 'questionBank', order: 27 },

      // Grade 6 Mechanics - Energy and Work (10 Chained Micro-skills)
      { id: 'iit-p6-concept-of-work', title: 'Understand scientific work and its conditions', chapterId: 'iit-work-energy-6', code: 'P.6.3.1', templateId: 'iit-p6-concept-of-work', engine: 'questionBank', order: 1 },
      { id: 'iit-p6-calculate-work', title: 'Calculate work done in SI and CGS units', chapterId: 'iit-work-energy-6', code: 'P.6.3.2', templateId: 'iit-p6-calculate-work', engine: 'questionBank', order: 2 },
      { id: 'iit-p6-joule-erg-conversion', title: 'Convert work between Joules and ergs', chapterId: 'iit-work-energy-6', code: 'P.6.3.3', templateId: 'iit-p6-joule-erg-conversion', engine: 'questionBank', order: 3 },
      { id: 'iit-p6-types-of-work', title: 'Classify positive, negative, and zero work', chapterId: 'iit-work-energy-6', code: 'P.6.3.4', templateId: 'iit-p6-types-of-work', engine: 'questionBank', order: 4 },
      { id: 'iit-p6-energy-concept', title: 'Understand energy concept and its units', chapterId: 'iit-work-energy-6', code: 'P.6.3.5', templateId: 'iit-p6-energy-concept', engine: 'questionBank', order: 5 },
      { id: 'iit-p6-potential-energy', title: 'Calculate gravitational and configuration P.E.', chapterId: 'iit-work-energy-6', code: 'P.6.3.6', templateId: 'iit-p6-potential-energy', engine: 'questionBank', order: 6 },
      { id: 'iit-p6-kinetic-energy', title: 'Calculate and scale Kinetic Energy', chapterId: 'iit-work-energy-6', code: 'P.6.3.7', templateId: 'iit-p6-kinetic-energy', engine: 'questionBank', order: 7 },
      { id: 'iit-p6-ke-momentum-relation', title: 'Solve kinetic energy and momentum problems', chapterId: 'iit-work-energy-6', code: 'P.6.3.8', templateId: 'iit-p6-ke-momentum-relation', engine: 'questionBank', order: 8 },
      { id: 'iit-p6-energy-transformations', title: 'Identify energy conversions in appliances', chapterId: 'iit-work-energy-6', code: 'P.6.3.9', templateId: 'iit-p6-energy-transformations', engine: 'questionBank', order: 9 },
      { id: 'iit-p6-conservation-ultimate-source', title: 'Law of conservation and the Sun as source', chapterId: 'iit-work-energy-6', code: 'P.6.3.10', templateId: 'iit-p6-conservation-ultimate-source', engine: 'questionBank', order: 10 },

      // Grade 6 Mechanics - Light (10 Chained Micro-skills)
      { id: 'iit-p6-light-properties', title: 'Understand light properties, speed, and luminous bodies', chapterId: 'iit-light-6', code: 'P.6.4.1', templateId: 'iit-p6-light-properties', engine: 'questionBank', order: 1 },
      { id: 'iit-p6-optical-media', title: 'Classify optical media and materials', chapterId: 'iit-light-6', code: 'P.6.4.2', templateId: 'iit-p6-optical-media', engine: 'questionBank', order: 2 },
      { id: 'iit-p6-rays-and-beams', title: 'Classify light beams and rays', chapterId: 'iit-light-6', code: 'P.6.4.3', templateId: 'iit-p6-rays-and-beams', engine: 'questionBank', order: 3 },
      { id: 'iit-p6-rectilinear-propagation', title: 'Understand rectilinear propagation of light', chapterId: 'iit-light-6', code: 'P.6.4.4', templateId: 'iit-p6-rectilinear-propagation', engine: 'questionBank', order: 4 },
      { id: 'iit-p6-pinhole-camera', title: 'Pinhole camera, image magnification, and factors', chapterId: 'iit-light-6', code: 'P.6.4.5', templateId: 'iit-p6-pinhole-camera', engine: 'questionBank', order: 5 },
      { id: 'iit-p6-reflection-terms', title: 'Identify terms related to reflection of light', chapterId: 'iit-light-6', code: 'P.6.4.6', templateId: 'iit-p6-reflection-terms', engine: 'questionBank', order: 6 },
      { id: 'iit-p6-reflection-laws', title: 'Apply the laws of reflection of light', chapterId: 'iit-light-6', code: 'P.6.4.7', templateId: 'iit-p6-reflection-laws', engine: 'questionBank', order: 7 },
      { id: 'iit-p6-angle-of-deviation', title: 'Calculate the angle of deviation in reflection', chapterId: 'iit-light-6', code: 'P.6.4.8', templateId: 'iit-p6-angle-of-deviation', engine: 'questionBank', order: 8 },
      { id: 'iit-p6-real-vs-virtual', title: 'Distinguish real and virtual images', chapterId: 'iit-light-6', code: 'P.6.4.9', templateId: 'iit-p6-real-vs-virtual', engine: 'questionBank', order: 9 },
      { id: 'iit-p6-shadows-and-eclipses', title: 'Understand shadow parts and eclipses', chapterId: 'iit-light-6', code: 'P.6.4.10', templateId: 'iit-p6-shadows-and-eclipses', engine: 'questionBank', order: 10 },

      // Grade 6 Mechanics - Electricity (10 Chained Micro-skills)
      { id: 'iit-p6-electric-charge', title: 'Understand electric charge types and units', chapterId: 'iit-electricity-6', code: 'P.6.5.1', templateId: 'iit-p6-electric-charge', engine: 'questionBank', order: 1 },
      { id: 'iit-p6-electric-current-defn', title: 'Calculate current, charge, and time relations', chapterId: 'iit-electricity-6', code: 'P.6.5.2', templateId: 'iit-p6-electric-current-defn', engine: 'questionBank', order: 2 },
      { id: 'iit-p6-electric-cell-terminals', title: 'Identify electric cell terminals and functions', chapterId: 'iit-electricity-6', code: 'P.6.5.3', templateId: 'iit-p6-electric-cell-terminals', engine: 'questionBank', order: 3 },
      { id: 'iit-p6-conductors-insulators', title: 'Classify conductors and insulators', chapterId: 'iit-electricity-6', code: 'P.6.5.4', templateId: 'iit-p6-conductors-insulators', engine: 'questionBank', order: 4 },
      { id: 'iit-p6-circuit-closed-open', title: 'Closed vs open circuits and switch functions', chapterId: 'iit-electricity-6', code: 'P.6.5.5', templateId: 'iit-p6-circuit-closed-open', engine: 'questionBank', order: 5 },
      { id: 'iit-p6-circuit-symbols', title: 'Identify electrical circuit symbols', chapterId: 'iit-electricity-6', code: 'P.6.5.6', templateId: 'iit-p6-circuit-symbols', engine: 'questionBank', order: 6 },
      { id: 'iit-p6-cells-in-series-parallel', title: 'Calculate cell series and parallel connections', chapterId: 'iit-electricity-6', code: 'P.6.5.7', templateId: 'iit-p6-cells-in-series-parallel', engine: 'questionBank', order: 7 },
      { id: 'iit-p6-bulbs-in-series-parallel', title: 'Understand bulbs series and parallel behavior', chapterId: 'iit-electricity-6', code: 'P.6.5.8', templateId: 'iit-p6-bulbs-in-series-parallel', engine: 'questionBank', order: 8 },
      { id: 'iit-p6-sources-of-electricity', title: 'Identify sources of electrical energy', chapterId: 'iit-electricity-6', code: 'P.6.5.9', templateId: 'iit-p6-sources-of-electricity', engine: 'questionBank', order: 9 },
      { id: 'iit-p6-electrical-safety', title: 'Understand electrical insulation and safety', chapterId: 'iit-electricity-6', code: 'P.6.5.10', templateId: 'iit-p6-electrical-safety', engine: 'questionBank', order: 10 },
      { id: 'iit-p6-electricity-static-demo', title: 'Static Sequential Questions (Demo)', chapterId: 'iit-electricity-6', code: 'P.6.5.11', templateId: 'iit-p6-electricity-static-demo', engine: 'questionBank', isStatic: true, order: 11 },
      { id: 'iit-p6-electricity-branching-demo', title: 'Branching Question Paths (Demo)', chapterId: 'iit-electricity-6', code: 'P.6.5.12', templateId: 'iit-p6-electricity-branching-demo', engine: 'questionBank', isStatic: true, order: 12 },

      // Grade 7 Geometry
      { id: 'triangle-angle-sum', title: 'Angle sum property of triangles', chapterId: 'triangles', code: 'G.1', templateId: 'fractions-g5-add-like-fractions', engine: 'StickersEngine', order: 1 },

      // Grade 7 Physics - Heat & Thermodynamics
      { id: 'heat-transfer-modes', title: 'Identify Conduction, Convection & Radiation', chapterId: 'iit-heat-7', code: 'P.7.1', templateId: 'iit-heat-transfer-modes', engine: 'questionBank', order: 1 },
      { id: 'celsius-fahrenheit-conv', title: 'Convert between Celsius & Fahrenheit', chapterId: 'iit-heat-7', code: 'P.7.2', templateId: 'iit-celsius-fahrenheit-conv', engine: 'questionBank', order: 2 },

      // Grade 7 Physics - Motion and Time (17 Chained Micro-skills)
      { id: 'iit-kinematics-vs-dynamics', title: 'Mechanics — Kinematics vs. Dynamics Concepts', chapterId: 'iit-motion-7', code: 'M.1', templateId: 'iit-kinematics-vs-dynamics', engine: 'questionBank', order: 1 },
      { id: 'iit-relativity-rest-motion', title: 'State of Rest and Motion as Relative Concepts', chapterId: 'iit-motion-7', code: 'M.2', templateId: 'iit-relativity-rest-motion', engine: 'questionBank', order: 2 },
      { id: 'iit-rectilinear-vs-curvilinear', title: 'Translatory Motion: Rectilinear vs. Curvilinear', chapterId: 'iit-motion-7', code: 'M.3', templateId: 'iit-rectilinear-vs-curvilinear', engine: 'questionBank', order: 3 },
      { id: 'iit-rotational-vs-circular', title: 'Spins & Paths: Rotational vs. Circular Motion', chapterId: 'iit-motion-7', code: 'M.4', templateId: 'iit-rotational-vs-circular', engine: 'questionBank', order: 4 },
      { id: 'iit-oscillatory-vs-vibratory', title: 'To-and-Fro Motions: Oscillatory vs. Vibratory', chapterId: 'iit-motion-7', code: 'M.5', templateId: 'iit-oscillatory-vs-vibratory', engine: 'questionBank', order: 5 },
      { id: 'iit-periodic-vs-random', title: 'Intervals & Paths: Periodic vs. Random Motion', chapterId: 'iit-motion-7', code: 'M.6', templateId: 'iit-periodic-vs-random', engine: 'questionBank', order: 6 },
      { id: 'iit-multiple-motion', title: 'Simultaneous Motions: Decomposing Multiple Motion', chapterId: 'iit-motion-7', code: 'M.7', templateId: 'iit-multiple-motion', engine: 'questionBank', order: 7 },
      { id: 'iit-scalars-vs-vectors', title: 'Classifying Physics Quantities: Scalars vs. Vectors', chapterId: 'iit-motion-7', code: 'M.8', templateId: 'iit-scalars-vs-vectors', engine: 'questionBank', order: 8 },
      { id: 'iit-vector-representation', title: 'Graphical Representation and Notation of Vectors', chapterId: 'iit-motion-7', code: 'M.9', templateId: 'iit-vector-representation', engine: 'questionBank', order: 9 },
      { id: 'iit-distance-displacement-1d', title: 'Calculating 1D Distance and Displacement', chapterId: 'iit-motion-7', code: 'M.10', templateId: 'iit-distance-displacement-1d', engine: 'questionBank', order: 10 },
      { id: 'iit-distance-displacement-circular', title: 'Distance and Displacement on Semicircular & Circular Paths', chapterId: 'iit-motion-7', code: 'M.11', templateId: 'iit-distance-displacement-circular', engine: 'questionBank', order: 11 },
      { id: 'iit-distance-displacement-2d', title: 'Distance and Displacement on 2D Grid Paths', chapterId: 'iit-motion-7', code: 'M.12', templateId: 'iit-distance-displacement-2d', engine: 'questionBank', order: 12 },
      { id: 'iit-speed-distance-time', title: 'Basic Speed, Distance, and Time Calculations', chapterId: 'iit-motion-7', code: 'M.13', templateId: 'iit-speed-distance-time', engine: 'questionBank', order: 13 },
      { id: 'iit-speed-unit-conversion', title: 'Speed Unit Conversions (km/h <-> m/s)', chapterId: 'iit-motion-7', code: 'M.14', templateId: 'iit-speed-unit-conversion', engine: 'questionBank', order: 14 },
      { id: 'iit-odometer-average-speed', title: 'Odometer Logs and Average Speed Analysis', chapterId: 'iit-motion-7', code: 'M.15', templateId: 'iit-odometer-average-speed', engine: 'questionBank', order: 15 },
      { id: 'iit-distance-time-graph-qualitative', title: 'Interpreting Distance-Time Graphs (Qualitative)', chapterId: 'iit-motion-7', code: 'M.16', templateId: 'iit-distance-time-graph-qualitative', engine: 'questionBank', order: 16 },
      { id: 'iit-speed-graph-slope', title: 'Calculating Speed from Graph Slopes (Quantitative)', chapterId: 'iit-motion-7', code: 'M.17', templateId: 'iit-speed-graph-slope', engine: 'questionBank', order: 17 },

      // Grade 7 Physics - Electricity & Magnetism
      { id: 'electric-current-effects', title: 'Understand Heating & Magnetic effects of Current', chapterId: 'iit-electric-7', code: 'P.7.5', templateId: 'iit-electric-current-effects', engine: 'questionBank', order: 1 },

      // Grade 8 Mechanics
      { id: 'calculate-pressure', title: 'Calculate pressure given force and area', chapterId: 'iit-forces-8', code: 'F.1', templateId: 'fractions-g5-add-like-fractions', engine: 'StickersEngine', order: 1 },

      // Grade 9 Algebra
      { id: 'factorize-quadratic', title: 'Factorize simple quadratic polynomials', chapterId: 'polynomials', code: 'A.1', templateId: 'fractions-g5-add-like-fractions', engine: 'StickersEngine', order: 1 },

      // Grade 9 Mechanics
      { id: 'newtons-laws-verify', title: 'Identify application of Newton\'s laws', chapterId: 'iit-kinematics-9', code: 'K.1', templateId: 'fractions-g5-add-like-fractions', engine: 'StickersEngine', order: 1 },
    ];
    for (const s of skills) {
      await createIitNode('skill', s);
    }

    console.log('Successfully seeded IIT database nodes.');
  } catch (error) {
    console.error('Error seeding IIT collections:', error);
  }
}
