/**
 * Seed script: Grade 10 Science curriculum into the v2 MongoDB collections
 * (grades_v2, subjects_v2, units_v2, chapters_v2, skills_v2)
 *
 * Usage:  node scripts/seed-grade10-science.mjs
 * Server must be running on http://localhost:3000
 */

const BASE = 'http://localhost:3000';

async function post(type, data) {
  const res = await fetch(`${BASE}/api/v2/curriculum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),   // ← API expects { type, data }
  });
  const json = await res.json();
  if (!json.success) {
    console.warn(`  ⚠ ${type} "${data.id || data.title}" — ${json.error || 'unknown error'}`);
  } else {
    console.log(`  ✅ ${type.padEnd(8)} created: ${json.node?.id || data.id}`);
  }
  return json;
}


async function seed() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  Seeding Grade 10 Science into admin-v2');
  console.log('══════════════════════════════════════════════\n');

  /* ── 1. Grade ── */
  console.log('▶ Grade');
  await post('grade', { id: 'grade-10', title: 'Grade 10', order: 10 });

  /* ── 2. Subject ── */
  console.log('\n▶ Subject');
  await post('subject', { id: 'science', title: 'Science', icon: '🔬', order: 3 });

  /* ── 3. Units (= Topic areas inside Science) ── */
  console.log('\n▶ Units');
  const units = [
    { id: 'chemical-reactions',    title: 'Chemical Reactions & Equations', subjectId: 'science', color: '#f59e0b', order: 1 },
    { id: 'acids-bases-salts',     title: 'Acids, Bases and Salts',          subjectId: 'science', color: '#06b6d4', order: 2 },
    { id: 'metals-nonmetals',      title: 'Metals and Non-metals',           subjectId: 'science', color: '#8b5cf6', order: 3 },
    { id: 'carbon-compounds',      title: 'Carbon and its Compounds',        subjectId: 'science', color: '#22c55e', order: 4 },
    { id: 'life-processes',        title: 'Life Processes',                  subjectId: 'science', color: '#10b981', order: 5 },
    { id: 'control-coordination',  title: 'Control and Coordination',        subjectId: 'science', color: '#ec4899', order: 6 },
    { id: 'electricity',           title: 'Electricity',                     subjectId: 'science', color: '#eab308', order: 7 },
    { id: 'magnetism',             title: 'Magnetic Effects of Electric Current', subjectId: 'science', color: '#0ea5e9', order: 8 },
    { id: 'light-reflection',      title: 'Light – Reflection and Refraction', subjectId: 'science', color: '#f97316', order: 9 },
    { id: 'our-environment',       title: 'Our Environment',                 subjectId: 'science', color: '#84cc16', order: 10 },
  ];
  for (const u of units) await post('unit', u);

  /* ── 4. Chapters (one per unit, tied to grade-10) ── */
  console.log('\n▶ Chapters');
  const chapters = units.map((u, i) => ({
    id: `${u.id}-g10`,
    title: u.title,
    unitId: u.id,
    gradeId: 'grade-10',
    order: i + 1,
  }));
  for (const c of chapters) await post('chapter', c);

  /* ── 5. Skills ── */
  console.log('\n▶ Skills');
  const skills = [
    // Chapter 1 – Chemical Reactions (LIVE – adaptive engine)
    { id: 'cr-g10-identify-reaction',  title: 'Identify chemical reactions and their signs',   code: 'CR.1', chapterId: 'chemical-reactions-g10', unitId: 'chemical-reactions', gradeId: 'grade-10', templateId: 'chemical-reactions.mcq.adaptive', engine: 'chemicalReactions', order: 1 },
    { id: 'cr-g10-classify-reaction',  title: 'Classify types of chemical reactions',          code: 'CR.2', chapterId: 'chemical-reactions-g10', unitId: 'chemical-reactions', gradeId: 'grade-10', templateId: 'chemical-reactions.mcq.adaptive', engine: 'chemicalReactions', order: 2 },
    { id: 'cr-g10-balance-equation',   title: 'Balance chemical equations and apply redox',    code: 'CR.3', chapterId: 'chemical-reactions-g10', unitId: 'chemical-reactions', gradeId: 'grade-10', templateId: 'chemical-reactions.mcq.adaptive', engine: 'chemicalReactions', order: 3 },

    // Chapter 2 – Acids, Bases & Salts
    { id: 'abs-g10-identify',          title: 'Identify acids, bases and salts',                code: 'AB.1', chapterId: 'acids-bases-salts-g10',    unitId: 'acids-bases-salts',    gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'abs-g10-ph',                title: 'pH scale and indicators',                        code: 'AB.2', chapterId: 'acids-bases-salts-g10',    unitId: 'acids-bases-salts',    gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'abs-g10-reactions',         title: 'Reactions of acids and bases',                   code: 'AB.3', chapterId: 'acids-bases-salts-g10',    unitId: 'acids-bases-salts',    gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 3 – Metals & Non-metals
    { id: 'mn-g10-identify',           title: 'Physical properties of metals and non-metals',   code: 'MN.1', chapterId: 'metals-nonmetals-g10',     unitId: 'metals-nonmetals',     gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'mn-g10-reactivity',         title: 'Reactivity series',                              code: 'MN.2', chapterId: 'metals-nonmetals-g10',     unitId: 'metals-nonmetals',     gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'mn-g10-bonding',            title: 'Ionic bonding and extraction of metals',         code: 'MN.3', chapterId: 'metals-nonmetals-g10',     unitId: 'metals-nonmetals',     gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 4 – Carbon & Compounds
    { id: 'cc-g10-bonding',            title: 'Covalent bonding in carbon',                     code: 'CC.1', chapterId: 'carbon-compounds-g10',     unitId: 'carbon-compounds',     gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'cc-g10-functional',         title: 'Homologous series and functional groups',         code: 'CC.2', chapterId: 'carbon-compounds-g10',     unitId: 'carbon-compounds',     gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'cc-g10-reactions',          title: 'Chemical properties and reactions of carbon',    code: 'CC.3', chapterId: 'carbon-compounds-g10',     unitId: 'carbon-compounds',     gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 5 – Life Processes
    { id: 'lp-g10-nutrition',          title: 'Nutrition in plants and animals',                code: 'LP.1', chapterId: 'life-processes-g10',       unitId: 'life-processes',       gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'lp-g10-respiration',        title: 'Respiration, transportation and excretion',      code: 'LP.2', chapterId: 'life-processes-g10',       unitId: 'life-processes',       gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'lp-g10-systems',            title: 'Human digestive and circulatory systems',        code: 'LP.3', chapterId: 'life-processes-g10',       unitId: 'life-processes',       gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 6 – Control & Coordination
    { id: 'cc2-g10-nervous',           title: 'Nervous system and reflex action',               code: 'CN.1', chapterId: 'control-coordination-g10', unitId: 'control-coordination', gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'cc2-g10-hormones',          title: 'Hormones in animals and plants',                 code: 'CN.2', chapterId: 'control-coordination-g10', unitId: 'control-coordination', gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'cc2-g10-tropism',           title: 'Coordination in plants (tropism)',               code: 'CN.3', chapterId: 'control-coordination-g10', unitId: 'control-coordination', gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 7 – Electricity
    { id: 'el-g10-ohm',                title: "Ohm's law and electric circuits",                code: 'EL.1', chapterId: 'electricity-g10',          unitId: 'electricity',          gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'el-g10-circuits',           title: 'Series and parallel circuits',                   code: 'EL.2', chapterId: 'electricity-g10',          unitId: 'electricity',          gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'el-g10-power',              title: 'Heating effect and power',                       code: 'EL.3', chapterId: 'electricity-g10',          unitId: 'electricity',          gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 8 – Magnetism
    { id: 'mg-g10-magnetic-field',     title: 'Magnetic field and field lines',                 code: 'MG.1', chapterId: 'magnetism-g10',            unitId: 'magnetism',            gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'mg-g10-electromagnet',      title: 'Electromagnets and electric motor',              code: 'MG.2', chapterId: 'magnetism-g10',            unitId: 'magnetism',            gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'mg-g10-induction',          title: 'Electromagnetic induction and generator',        code: 'MG.3', chapterId: 'magnetism-g10',            unitId: 'magnetism',            gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 9 – Light
    { id: 'lt-g10-reflection',         title: 'Reflection and laws of reflection',              code: 'LT.1', chapterId: 'light-reflection-g10',     unitId: 'light-reflection',     gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'lt-g10-refraction',         title: "Refraction and Snell's law",                    code: 'LT.2', chapterId: 'light-reflection-g10',     unitId: 'light-reflection',     gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'lt-g10-lenses',             title: 'Lenses and mirrors (ray diagrams)',              code: 'LT.3', chapterId: 'light-reflection-g10',     unitId: 'light-reflection',     gradeId: 'grade-10', templateId: '', engine: '', order: 3 },

    // Chapter 10 – Environment
    { id: 'en-g10-ecosystem',          title: 'Ecosystem and food chains',                      code: 'EN.1', chapterId: 'our-environment-g10',      unitId: 'our-environment',      gradeId: 'grade-10', templateId: '', engine: '', order: 1 },
    { id: 'en-g10-waste',              title: 'Biodegradable and non-biodegradable waste',      code: 'EN.2', chapterId: 'our-environment-g10',      unitId: 'our-environment',      gradeId: 'grade-10', templateId: '', engine: '', order: 2 },
    { id: 'en-g10-ozone',              title: 'Ozone layer depletion and environmental impact', code: 'EN.3', chapterId: 'our-environment-g10',      unitId: 'our-environment',      gradeId: 'grade-10', templateId: '', engine: '', order: 3 },
  ];
  for (const s of skills) await post('skill', s);

  console.log('\n══════════════════════════════════════════════');
  console.log('  Done! Open http://localhost:3000/grades-v2?subject=science');
  console.log('  to see Grade 10 Science appear in the curriculum.');
  console.log('══════════════════════════════════════════════\n');
}

seed().catch(console.error);
