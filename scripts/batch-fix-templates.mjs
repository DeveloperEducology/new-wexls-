#!/usr/bin/env node
/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │         KlassChamp — Overnight Batch Template Fixer             │
 * │   Scans ALL templates in MongoDB, audits with Gemini AI,        │
 * │   auto-fixes broken ones, and writes a detailed HTML report.    │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   node scripts/batch-fix-templates.js
 *   node scripts/batch-fix-templates.js --dry-run     (audit only, no DB writes)
 *   node scripts/batch-fix-templates.js --examId jnvst
 *   node scripts/batch-fix-templates.js --limit 10
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { MongoClient } from 'mongodb';
import { GoogleGenAI } from '@google/genai';

// Load .env.local manually (dotenv not always available)
function loadEnv() {
  const paths = ['.env.local', '.env'];
  for (const p of paths) {
    if (existsSync(p)) {
      const lines = readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
      }
    }
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB  = (process.env.MONGODB_DB || 'new-wexls').trim();
const MODEL       = (process.env.GEMINI_QA_MODEL || 'gemini-2.5-flash').trim();
const BATCH_DELAY_MS = 2000;

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const EXAM_IDX = args.indexOf('--examId');
const EXAM_ID  = EXAM_IDX >= 0 ? args[EXAM_IDX + 1] : null;
const LIMITX   = args.indexOf('--limit');
const LIMIT    = LIMITX >= 0 ? parseInt(args[LIMITX + 1]) : 0;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const project  = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  if (project) return new GoogleGenAI({ enterprise: true, project, location });
  return null;
}

async function callGemini(ai, prompt) {
  let res;
  try {
    res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { responseMimeType: 'application/json' } });
  } catch {
    res = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt, config: { responseMimeType: 'application/json' } });
  }
  return JSON.parse((res.text || '{}').trim());
}

async function auditTemplate(ai, template) {
  return callGemini(ai, `
You are a strict QA Agent for K-12 and competitive exam parameterized templates (JNVST, SSC).
Audit this template and return a JSON report.

Key checks:
1. Placeholder consistency — every {{placeholder}} in questionTemplate/options/explanationTemplate must exist in variables OR derivations.
2. Mathematical soundness — min/max ranges must be logical. No division-by-zero risk (min >= 1 for denominators).
3. Derivation validity — derivation keys must be simple identifiers. Expressions (like num1*factor) belong in derivations, not variable keys.
4. LaTeX integrity — proper \\frac{}{} formatting, balanced braces, no raw wrong_num_1 style text.
5. Option completeness — at least 1 correct + 3 wrong options; all referenced variables must be defined.

Return ONLY valid JSON:
{
  "isValid": true,
  "score": 85,
  "severity": "pass",
  "summary": "brief one-line summary",
  "issues": [{ "severity": "blocker", "field": "variables", "message": "...", "fix": "..." }],
  "suggestions": ["..."]
}

Template:
${JSON.stringify(template, null, 2)}
`);
}

async function fixTemplate(ai, template, report) {
  return callGemini(ai, `
You are a senior AI math curriculum engineer. Fix the broken template based on this audit report.

Audit findings:
${JSON.stringify(report, null, 2)}

Template to repair:
${JSON.stringify(template, null, 2)}

Rules:
1. Fix ALL blocker and warning issues listed in the audit.
2. Variable names in "variables" must be simple identifiers only (num1, den1, factor).
3. All computed expressions go in "derivations" as formula strings (e.g. "new_num": "num1 * factor").
4. Denominators min must be >= 1 (never 0).
5. Every {{placeholder}} in options/questionTemplate/explanationTemplate must exist in variables or derivations.
6. Include exactly 4 MCQ options: 1 correct + 3 meaningful distractors using derivation variables.
7. Preserve original examId, section, topic, difficulty, name, id fields.

Return ONLY the corrected JSON template, no markdown backticks, no extra text.
`);
}

function quickValidate(template) {
  const config = template.config || {};
  const allText = [
    config.questionTemplate || '',
    config.explanationTemplate || '',
    ...(config.options || []).map(o => o.label || ''),
  ].join(' ');

  const placeholders = [...allText.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  const defined = new Set([
    ...Object.keys(config.variables || {}).map(k => k.replace(/^\{+/, '').replace(/\}+$/, '').trim()),
    ...Object.keys(config.derivations || {}),
  ]);

  const undefinedVars   = [...new Set(placeholders)].filter(p => !defined.has(p));
  const hasExprInVars   = Object.keys(config.variables || {}).some(k => /[*+=\s]/.test(k));
  const zeroDenomRisk   = Object.values(config.variables || {}).some(v => v?.min === 0);
  const missingCorrect  = !(config.options || []).some(o => o.isCorrect);
  const tooFewOptions   = (config.options || []).length < 4;

  const issues = [];
  if (undefinedVars.length > 0) issues.push({ severity: 'blocker', field: 'variables', message: `Undefined placeholders: ${undefinedVars.join(', ')}` });
  if (hasExprInVars)            issues.push({ severity: 'blocker', field: 'variables', message: 'Variable keys contain expressions — should be simple identifiers' });
  if (zeroDenomRisk)            issues.push({ severity: 'blocker', field: 'variables', message: 'Variable min=0 may cause division by zero' });
  if (missingCorrect)           issues.push({ severity: 'blocker', field: 'options',   message: 'No option is marked as correct' });
  if (tooFewOptions)            issues.push({ severity: 'blocker', field: 'options',   message: `Only ${(config.options||[]).length} option(s) — need at least 4` });
  return issues;
}

function generateHtmlReport(results, startTime) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const counts   = { passed: 0, fixed: 0, failed: 0, error: 0, skipped: 0 };
  results.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);

  const rows = results.map(r => `
    <tr class="row-${r.status}">
      <td><code>${r.id}</code></td>
      <td>${r.name}</td>
      <td>${r.examId || '-'}</td>
      <td>${r.topic || '-'}</td>
      <td><span class="badge badge-${r.status}">${r.status.toUpperCase()}</span></td>
      <td>${r.score ?? '-'}</td>
      <td><small>${(r.issues || []).map(i => `<b>[${i.severity}]</b> ${i.message}`).join('<br>') || '✅ Clean'}</small></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>KlassChamp Batch Fix Report</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 32px; }
h1 { font-size: 1.8rem; background: linear-gradient(135deg, #7c3aed, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 6px; }
.sub { color: #64748b; font-size: 0.85rem; margin-bottom: 28px; }
.stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.stat { background: #1e1e2e; border: 1px solid #2d2d44; border-radius: 12px; padding: 18px 26px; text-align: center; min-width: 110px; }
.num { font-size: 2.2rem; font-weight: 900; }
.lbl { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }
.c-total{color:#06b6d4} .c-passed{color:#10b981} .c-fixed{color:#7c3aed} .c-failed,.c-error{color:#ef4444} .c-skipped{color:#f59e0b}
table { width: 100%; border-collapse: collapse; background: #1e1e2e; border-radius: 12px; overflow: hidden; font-size: 0.82rem; }
thead { background: #2d2d44; }
th { padding: 12px 14px; text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; }
td { padding: 10px 14px; border-bottom: 1px solid #1a1a2e; vertical-align: top; }
.row-passed{background:#071a0f} .row-fixed{background:#0f0a1f} .row-failed,.row-error{background:#1a0707} .row-skipped{background:#1a1400}
code { background: #2d2d44; padding: 2px 6px; border-radius: 4px; color: #c4b5fd; font-size: 0.76rem; }
.badge { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
.badge-passed{background:#065f46;color:#6ee7b7} .badge-fixed{background:#4c1d95;color:#c4b5fd}
.badge-failed,.badge-error{background:#7f1d1d;color:#fca5a5} .badge-skipped{background:#78350f;color:#fde68a}
.footer { margin-top: 20px; color: #334155; font-size: 0.76rem; text-align: center; }
</style></head><body>
<h1>🤖 KlassChamp — Batch Template Fix Report</h1>
<p class="sub">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Duration: ${duration}s &nbsp;|&nbsp; Mode: ${DRY_RUN ? '⚠️ DRY RUN' : '🟢 LIVE'} &nbsp;|&nbsp; Model: ${MODEL}</p>
<div class="stats">
  <div class="stat"><div class="num c-total">${results.length}</div><div class="lbl">Total</div></div>
  <div class="stat"><div class="num c-passed">${counts.passed||0}</div><div class="lbl">Passed</div></div>
  <div class="stat"><div class="num c-fixed">${counts.fixed||0}</div><div class="lbl">Fixed</div></div>
  <div class="stat"><div class="num c-failed">${(counts.failed||0)+(counts.error||0)}</div><div class="lbl">Errors</div></div>
</div>
<table><thead><tr><th>ID</th><th>Name</th><th>Exam</th><th>Topic</th><th>Status</th><th>Score</th><th>Issues</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer">KlassChamp AI Batch Fixer — google/genai ${MODEL}</div>
</body></html>`;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   KlassChamp — Overnight Batch Template Fixer    ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  if (DRY_RUN) console.log('⚠️  DRY RUN mode — audit only, no DB writes\n');

  if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set. Check .env.local'); process.exit(1); }
  const ai = getGeminiClient();
  if (!ai) { console.error('❌ Gemini not configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT'); process.exit(1); }
  console.log(`✅ Gemini connected  (model: ${MODEL})`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  console.log(`✅ MongoDB connected (db: ${MONGODB_DB})\n`);

  const filter = {};
  if (EXAM_ID) filter.examId = EXAM_ID;
  let templates = await db.collection('templates').find(filter).sort({ createdAt: -1 }).toArray();
  if (LIMIT > 0) templates = templates.slice(0, LIMIT);
  console.log(`📋 ${templates.length} template(s) to process\n`);

  const results   = [];
  const startTime = Date.now();

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const id   = template.id || String(template._id);
    const name = template.name || template.config?.name || id;
    process.stdout.write(`[${i + 1}/${templates.length}] ${name} ... `);

    const result = { id, name, examId: template.examId, topic: template.topic, status: 'passed', score: 100, issues: [] };

    try {
      // Phase 1: Fast local pre-check (no API cost)
      const localIssues = quickValidate(template);

      if (localIssues.length > 0) {
        // Has obvious bugs — send directly to fixer
        process.stdout.write(`❌ ${localIssues.length} local issue(s) → fixing...\n`);
        await sleep(BATCH_DELAY_MS);
        const fixed = await fixTemplate(ai, template, { isValid: false, score: 20, issues: localIssues });

        if (!DRY_RUN && fixed.config) {
          await db.collection('templates').updateOne(
            { _id: template._id },
            { $set: { config: fixed.config, updatedAt: new Date(), lastFixedAt: new Date() } }
          );
        }
        result.status = 'fixed'; result.score = 20; result.issues = localIssues;

      } else {
        // Phase 2: Full Gemini audit
        await sleep(BATCH_DELAY_MS);
        const report = await auditTemplate(ai, template);
        result.score  = report.score ?? 100;
        result.issues = report.issues || [];

        if (!report.isValid) {
          process.stdout.write(`⚠️  score=${report.score} → fixing...\n`);
          await sleep(BATCH_DELAY_MS);
          const fixed = await fixTemplate(ai, template, report);

          if (!DRY_RUN && fixed.config) {
            await db.collection('templates').updateOne(
              { _id: template._id },
              { $set: { config: fixed.config, updatedAt: new Date(), lastFixedAt: new Date() } }
            );
          }
          result.status = 'fixed';
        } else {
          process.stdout.write(`✅ score=${report.score}\n`);
          result.status = 'passed';
        }
      }
    } catch (err) {
      process.stdout.write(`💥 ${err.message}\n`);
      result.status = 'error';
      result.issues = [{ severity: 'blocker', field: 'system', message: err.message }];
    }

    results.push(result);
  }

  await client.close();

  // Summary
  const passed = results.filter(r => r.status === 'passed').length;
  const fixed  = results.filter(r => r.status === 'fixed').length;
  const errors = results.filter(r => r.status === 'error').length;
  const secs   = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📊 Done in ${secs}s`);
  console.log(`   ✅ Passed : ${passed}`);
  console.log(`   🔧 Fixed  : ${fixed}`);
  console.log(`   💥 Errors : ${errors}`);
  console.log(`   📋 Total  : ${results.length}`);

  mkdirSync('scripts/reports', { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(`scripts/reports/batch-fix-${ts}.json`, JSON.stringify({ ts: new Date(), results }, null, 2));
  writeFileSync(`scripts/reports/batch-fix-${ts}.html`, generateHtmlReport(results, startTime));
  console.log(`\n📁 Report → scripts/reports/batch-fix-${ts}.html`);
  console.log('   Open it in your browser for the full visual report!\n');

  if (errors > 0) process.exit(1);
}

main().catch(err => { console.error('\n💥 Fatal:', err.message); process.exit(1); });
