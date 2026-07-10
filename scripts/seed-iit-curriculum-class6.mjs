import { MongoClient } from 'mongodb';

// Load env variables manually from .env.local
import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        }
        if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
  }
} catch (e) {
  console.error("Could not load .env.local:", e.message);
}

const chapter = {
  id: 'iit-measurement-6',
  _id: 'iit-measurement-6',
  title: 'Measurement',
  unitId: 'mechanics',
  gradeId: 'grade-6',
  order: 3,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

const skills = [
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
  { id: 'iit-p6-mixed-measurement', title: 'Solve mixed and integrated measurement problems', chapterId: 'iit-measurement-6', code: 'P.6.10.1', templateId: 'iit-p6-mixed-measurement', engine: 'questionBank', order: 27 }
].map(s => ({
  ...s,
  _id: s.id,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
}));

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding IIT Curriculum Nodes to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Seed Chapter
    await db.collection('iit_chapters').updateOne(
      { id: chapter.id },
      { $set: chapter },
      { upsert: true }
    );
    console.log(`✅ Seeded/updated Chapter: "${chapter.title}"`);

    // Seed Skills
    let skillUpserts = 0;
    for (const s of skills) {
      await db.collection('iit_skills').updateOne(
        { id: s.id },
        { $set: s },
        { upsert: true }
      );
      skillUpserts++;
    }
    console.log(`✅ Seeded/updated ${skillUpserts} Skills`);

  } catch (error) {
    console.error("❌ Error seeding curriculum nodes:", error);
  } finally {
    await client.close();
  }
}

runSeed();
