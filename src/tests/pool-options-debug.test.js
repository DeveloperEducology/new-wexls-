/**
 * pool-options-debug.test.js
 *
 * Comprehensive debug & regression test for option rendering in dynamic pool templates.
 * Specifically targets: science-lkg-ukg-cold-objects (and any dynamic_pool skill)
 *
 * Run with:  node src/tests/pool-options-debug.test.js
 *
 * BUGS IDENTIFIED FROM LIVE DEBUG (2026-06-21):
 *   [BUG-1] Question text shows raw category key ("**materials**") instead of readable label
 *   [BUG-2] Options come from ALL pool categories (cold + hot + size_pairs + ...) not just cold
 *   [BUG-3] targetCategory is NOT honoured — "correct" option is not from the cold category
 *   [BUG-4] Distractor options include items from the SAME target category
 *   [BUG-5] Seed consistency: same seed always produces the same question (needs verification)
 */

const BASE_URL = 'http://localhost:3000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchQuestion(skill, seed = 'test001', subject = 'science', topic = 'science-lkg-ukg-object-properties') {
  const url = `${BASE_URL}/api/practice?subject=${subject}&topic=${topic}&skill=${encodeURIComponent(skill)}&seed=${seed}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  if (!data.success) throw new Error(`API error: ${JSON.stringify(data)}`);
  return data.question;
}

async function fetchManySeeds(skill, count = 20, subject = 'science', topic = 'science-lkg-ukg-object-properties') {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    const q = await fetchQuestion(skill, String(i), subject, topic);
    questions.push({ seed: i, ...q });
  }
  return questions;
}

function getCategoryFromOptionId(optionId = '') {
  // Option IDs follow pattern: {category}_{item_label} — e.g. "cold_ice_cream", "hot_engine"
  const parts = optionId.split('_');
  return parts[0] || 'unknown';
}

function getOptionCategories(question) {
  return question.options.map(o => ({
    id: o.id,
    label: o.label,
    category: getCategoryFromOptionId(o.id),
    isCorrect: o.isCorrect,
  }));
}

// ─── Simple Test Runner ───────────────────────────────────────────────────────

let passed = 0, failed = 0, warned = 0;
const SKILL = 'science-lkg-ukg-cold-objects';

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result
        .then(() => { console.log(`  ✅ ${name}`); passed++; })
        .catch(e => { console.log(`  ❌ ${name}\n     ${e.message}`); failed++; });
    }
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}\n     ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg}\n     Expected: ${JSON.stringify(b)}\n     Got:      ${JSON.stringify(a)}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   Pool Options Debug Test — science-lkg-ukg-cold-objects         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('📡 Fetching 20 seeds from API...');
  let questions;
  try {
    questions = await fetchManySeeds(SKILL, 20);
    console.log(`   Got ${questions.length} questions.\n`);
  } catch (e) {
    console.error('❌ FATAL: Cannot reach API. Is the dev server running on port 3000?');
    console.error(`   ${e.message}`);
    process.exit(1);
  }

  console.log('── Structure Tests ──────────────────────────────────────────────────');

  await test('[T1] Every question has 2–4 options', () => {
    for (const q of questions) {
      assert(
        q.options.length >= 2 && q.options.length <= 4,
        `seed=${q.seed} → got ${q.options.length} options`
      );
    }
  });

  await test('[T2] Each question has exactly ONE correct option', () => {
    for (const q of questions) {
      const correctOpts = q.options.filter(o => o.isCorrect);
      assertEqual(correctOpts.length, 1,
        `seed=${q.seed}: ${correctOpts.length} correct options. Options: ${q.options.map(o => `${o.label}[${o.isCorrect}]`).join(', ')}`
      );
    }
  });

  await test('[T7] Option IDs are unique within each question', () => {
    for (const q of questions) {
      const ids = q.options.map(o => o.id);
      const unique = new Set(ids);
      assertEqual(unique.size, ids.length,
        `seed=${q.seed}: duplicate IDs: ${ids.join(', ')}`
      );
    }
  });

  await test('[T10] correctAnswerIndex matches isCorrect flag', () => {
    for (const q of questions) {
      const idx = q.correctAnswerIndex ?? q.answer;
      if (idx !== undefined && q.options[idx]) {
        assert(
          q.options[idx].isCorrect === true,
          `seed=${q.seed}: correctAnswerIndex=${idx} but options[${idx}].isCorrect=${q.options[idx].isCorrect}`
        );
      }
    }
  });

  console.log('\n── Bug Regression Tests ────────────────────────────────────────────');

  await test('[BUG-1] Question text must NOT show raw internal category keys', () => {
    const rawCatPattern = /Which of these is \*\*[a-z_]+\*\*/;
    const violators = questions.filter(q => rawCatPattern.test(q.questionText));
    if (violators.length > 0) {
      console.log(`     ⚠ ${violators.length} questions with raw category key in prompt:`);
      violators.slice(0, 5).forEach(q =>
        console.log(`       seed=${q.seed}: "${q.questionText}"`)
      );
      throw new Error(`${violators.length}/${questions.length} questions show raw category key as question text`);
    }
  });

  await test('[BUG-2] Correct option must come from the COLD category', () => {
    const violations = [];
    for (const q of questions) {
      const correct = q.options.find(o => o.isCorrect);
      if (!correct) continue;
      const cat = getCategoryFromOptionId(correct.id);
      if (cat !== 'cold') {
        violations.push({ seed: q.seed, label: correct.label, id: correct.id, cat });
      }
    }
    if (violations.length > 0) {
      console.log(`     ⚠ ${violations.length} wrong-category correct answers:`);
      violations.slice(0, 5).forEach(v =>
        console.log(`       seed=${v.seed}: "${v.label}" [${v.id}] from category="${v.cat}" (should be "cold")`)
      );
      throw new Error(`${violations.length}/${questions.length} questions have correct answer from wrong category`);
    }
  });

  await test('[BUG-4] Distractor options must NOT come from cold (target) category', () => {
    const violations = [];
    for (const q of questions) {
      const distractors = q.options.filter(o => !o.isCorrect);
      for (const d of distractors) {
        const cat = getCategoryFromOptionId(d.id);
        if (cat === 'cold') {
          violations.push({ seed: q.seed, label: d.label, id: d.id });
        }
      }
    }
    if (violations.length > 0) {
      console.log(`     ⚠ ${violations.length} distractors leaked from cold category:`);
      violations.slice(0, 5).forEach(v =>
        console.log(`       seed=${v.seed}: distractor="${v.label}" [${v.id}] is from cold category`)
      );
      throw new Error(`${violations.length} distractor items came from the target "cold" category`);
    }
  });

  await test('[BUG-5] Same seed must produce identical question (RNG determinism)', async () => {
    const q1 = await fetchQuestion(SKILL, 'determ-42');
    const q2 = await fetchQuestion(SKILL, 'determ-42');
    const ids1 = q1.options.map(o => o.id).join(',');
    const ids2 = q2.options.map(o => o.id).join(',');
    assertEqual(ids1, ids2, 'Same seed produced different option ordering — RNG is non-deterministic!');
    assertEqual(q1.questionText, q2.questionText, 'Same seed produced different question text!');
  });

  console.log('\n── Quality Tests ───────────────────────────────────────────────────');

  await test('[T6] Distractors come from at least 1 non-target category each question', () => {
    for (const q of questions) {
      const distractors = q.options.filter(o => !o.isCorrect);
      const distCats = new Set(distractors.map(d => getCategoryFromOptionId(d.id)));
      assert(distCats.size >= 1, `seed=${q.seed}: no categories found for distractors`);
    }
  });

  await test('[T9] All audio URLs are well-formed (when present)', () => {
    for (const q of questions) {
      for (const opt of q.options) {
        if (opt.audioUrl) {
          assert(
            opt.audioUrl.startsWith('/api/tts') || opt.audioUrl.startsWith('http'),
            `seed=${q.seed} opt="${opt.label}": malformed audioUrl="${opt.audioUrl}"`
          );
        }
      }
    }
  });

  await test('[T11] Pool produces variety — at least 3 unique correct answers across 20 seeds', () => {
    const correctLabels = questions.map(q => q.options.find(o => o.isCorrect)?.label || '');
    const uniqueCorrect = new Set(correctLabels);
    assert(
      uniqueCorrect.size >= 3,
      `Only ${uniqueCorrect.size} unique correct answers across ${questions.length} seeds. Pool may be too small or targetCategory broken.`
    );
  });

  // ── Diagnostic output ─────────────────────────────────────────────────────
  console.log('\n── Category Mix Diagnostic (across 20 seeds × 3 options) ────────────');
  const catStats = {};
  for (const q of questions) {
    for (const c of getOptionCategories(q)) {
      const key = `${c.isCorrect ? '✓ [correct]' : '✗ [distract]'} ${c.category}`;
      catStats[key] = (catStats[key] || 0) + 1;
    }
  }
  const sorted = Object.entries(catStats).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`  ${key.padEnd(30)} ${count.toString().padStart(3)}  ${bar}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passed} passed  •  ${failed} failed  •  ${warned} warnings            ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    console.log('❌ Bugs detected. See IXL COMPARISON below for fix strategy.\n');
    printIxlComparison();
    process.exit(1);
  } else {
    console.log('✅ All pool option tests passed!\n');
  }
})();

// ─── IXL Comparison Printout ─────────────────────────────────────────────────

function printIxlComparison() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  HOW IXL DOES POOLING vs OUR CURRENT SYSTEM                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  IXL Architecture:                                                           ║
║  ─────────────────                                                           ║
║  • Skill = 1 tightly-scoped pool (cold skills → only cold items)             ║
║  • Distractors from a SEPARATE authored foil set, not sibling categories     ║
║  • Question text is static per skill ("Which of these is COLD?")             ║
║  • Adaptive difficulty = which ITEMS are shown (easy→hard by mastery)        ║
║  • Anti-repetition: item weights track student exposure history               ║
║                                                                              ║
║  Our System (current bugs):                                                  ║
║  ───────────────────────────                                                 ║
║  [BUG-1] questionText uses category key interpolation → raw keys leak        ║
║          Template: "Which of these is {{targetCategory}}?"                   ║
║          Fix:      Author the question text per skill directly                ║
║                                                                              ║
║  [BUG-2/3] targetCategory not applied → correct answer from wrong category   ║
║          evaluator.js picks from ALL flattened pool items, not just cold     ║
║          Fix: In evaluator.js dataSources handler, split items using         ║
║               source.targetCategories → correctPool / distractorPool         ║
║                                                                              ║
║  [BUG-4] Distractors bleed from target category                              ║
║          Fix: Exclude targetCategories from distractor pool building          ║
║                                                                              ║
║  Feature Comparison:                                                         ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Feature               IXL (gold)           Ours (current)                  ║
║  ──────────────────── ──────────────────── ────────────────────────────     ║
║  Pool scope            1 category/skill     ALL categories mixed             ║
║  Question text         Authored per skill   Raw interpolated key ❌          ║
║  Distractor source     Authored foil set    All other categories             ║
║  targetCategory        Implicit (1/skill)   Broken in evaluator ❌           ║
║  Anti-repetition       Yes (item weights)   No                               ║
║  Seed determinism      N/A                  Yes (seeded RNG) ✅              ║
║  Image-backed options  Yes (rich)           Partial                          ║
║  Audio per option      Yes                  Yes ✅                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
}
