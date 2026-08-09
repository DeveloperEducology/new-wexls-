import fs from 'fs';
import path from 'path';
import { getSeoPreviewQuestions } from './src/lib/seo/previewGenerator.js';

// Load .env.local manually
try {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

async function verify() {
  const topics = [
    { exam: 'jnvst', subject: 'math', slug: 'template-fraction-visual-id' },
    { exam: 'jnvst', subject: 'math', slug: 'template-ratios-simplification' },
    { exam: 'jnvst', subject: 'math', slug: 'template-time-distance-speed-calc' }
  ];

  for (const t of topics) {
    console.log(`\n========================================`);
    console.log(`Verifying: ${t.slug} ...`);
    const questions = await getSeoPreviewQuestions(t.exam, t.subject, t.slug);
    console.log(`Result: generated ${questions.length} questions.`);
    if (questions.length > 0) {
      console.log(`Sample Question: ${questions[0].questionText}`);
      console.log(`Explanation: ${questions[0].explanationText.substring(0, 100)}...`);
    }
  }
  process.exit(0);
}

verify();
