import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Helper to load env variables from .env.local
function loadEnv() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

process.env.TTS_PROVIDER = 'piper';
process.env.PIPER_TTS_URL = 'http://localhost:5050/api/tts';

async function run() {
  const { generateTtsBuffer } = await import('../src/lib/ttsService.js');
  const { uploadAudioToR2, isR2Configured } = await import('../src/lib/r2Service.js');
  const engineModule = await import('../src/lib/practice/generators/english/topics/lkg/engine.js');

  console.log("Starting Pre-bake of Letter Lines Audio URLs...");
  console.log("R2 Configured:", isR2Configured());

  if (!isR2Configured()) {
    console.error("R2 is not configured in .env.local! Cannot upload audio.");
    process.exit(1);
  }

  // 1. Harvest all unique prompts and option labels for all letter-lines skills
  const skills = [
    'lkg-english-letter-lines-standing',
    'lkg-english-letter-lines-sleeping',
    'lkg-english-letter-lines-slanting',
    'lkg-english-letter-lines-curved',
    'lkg-english-letter-lines-combination'
  ];
  const harvestedTexts = new Set();
  
  skills.forEach(skillId => {
    const gen = engineModule.resolveLkgGenerator(skillId);
    if (!gen) return;
    for (let seed = 1; seed <= 500; seed++) {
      try {
        const q = gen.generate({ seed });
        harvestedTexts.add(q.questionText);
        q.options.forEach(opt => {
          harvestedTexts.add(opt.label);
        });
      } catch (e) {
        // ignore
      }
    }
  });

  const uniqueTexts = Array.from(harvestedTexts);
  console.log(`Total harvested texts: ${uniqueTexts.length}`);

  // 2. Load existing mappings
  const outPath = path.join(process.cwd(), 'src/lib/practice/generators/english/topics/lkg/letterAudios.json');
  let mapping = {};
  if (fs.existsSync(outPath)) {
    try {
      mapping = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      console.log(`Loaded existing mappings: ${Object.keys(mapping).length}`);
    } catch (e) {
      console.warn("Failed to load existing mappings, starting fresh:", e.message);
    }
  }

  let count = 0;
  let successCount = 0;

  // 3. Generate and upload audio for each text
  for (const text of uniqueTexts) {
    count++;
    if (mapping[text]) {
      // Already has mapping, skip
      continue;
    }
    console.log(`[${count}/${uniqueTexts.length}] Generating (Female/Kore): "${text}"`);
    try {
      // Generate audio using female voice 'Kore' (en_US-amy-medium / Gemini female)
      const buffer = await generateTtsBuffer(text, 'Kore');
      
      // Hash text and voice for a unique filename
      const hash = crypto.createHash('sha256').update(text + '_Kore').digest('hex');
      const r2Key = `audio/lkg/${hash}.wav`;

      // Upload to R2
      const r2Url = await uploadAudioToR2(buffer, r2Key);
      if (r2Url) {
        mapping[text] = r2Url;
        successCount++;
        console.log(`   Uploaded -> ${r2Url}`);
      } else {
        console.warn(`   R2 upload returned null for: "${text}"`);
      }

      // Throttle to respect API limits
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (err) {
      console.error(`   Failed to generate/upload audio for: "${text}":`, err.message);
    }

    // Periodically save mapping
    if (count % 10 === 0) {
      fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));
    }
  }

  // Final save
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2));
  console.log(`Pre-bake complete! Generated and uploaded ${successCount} new audios. Total in file: ${Object.keys(mapping).length}`);
}

run();
