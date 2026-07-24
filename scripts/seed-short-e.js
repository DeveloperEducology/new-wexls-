const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually
try {
  const envContent = fs.readFileSync('/Users/vijay/Desktop/antigravity/new wexls/.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
} catch (e) {}

const templateData = {
  id: "ukg-english-ukg-eng-short-e-complete",
  skillId: "ukg-eng-short-e-complete",
  type: "parameterized",
  generatorType: "spreadsheet-grid",
  subject: "english",
  topic: "ukg-english-reading-foundations",
  grade: "ukg",
  title: "Complete the short e word",
  questionText: "Listen to the word. Then, fill in the missing letter.",
  interaction: {
    engine: "mcq",
    inputMode: "choice"
  },
  optionsType: "mcq",
  parts: [
    {
      type: "audio",
      content: "[word_audio]",
      label: "[word]"
    },
    {
      type: "text",
      content: "Listen to the word. Then, fill in the missing letter."
    },
    {
      type: "image",
      content: "[word_image]",
      label: "[word]"
    },
    {
      type: "text",
      content: "[word_pattern]"
    }
  ],
  options: [
    {
      label: "[answer_letter]",
      isCorrect: true
    },
    {
      label: "[distractor_letter]",
      isCorrect: false
    }
  ],
  validationRules: [
    {
      type: "exact_match",
      target: "answer",
      value: "[answer_letter]"
    }
  ],
  variables: [
    {
      name: "index",
      type: "random_int",
      min: 0,
      max: 19
    },
    {
      name: "word",
      type: "expression",
      formula: "[\"bed\",\"red\",\"fed\",\"web\",\"hen\",\"pen\",\"ten\",\"men\",\"den\",\"jet\",\"net\",\"wet\",\"leg\",\"peg\",\"gem\",\"vet\",\"nest\",\"vest\",\"desk\",\"sell\"][index]"
    },
    {
      name: "word_image",
      type: "expression",
      formula: "[\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331311909-bed.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331315165-red.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331317682-fed.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331323429-web.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331326128-hen.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331329319-pen.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331332358-ten.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331334406-men.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331337622-den.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331340158-jet.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331343517-net.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331349210-wet.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331351916-leg.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331355082-peg.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331361226-gem.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779986385133-vet.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781143207585-nest.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781143225635-vest.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780983584860-desk.png\",\"https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970102020-sell.png\"][index]"
    },
    {
      name: "word_audio",
      type: "expression",
      formula: "[\"/api/tts?voice=Puck&text=bed\",\"/api/tts?voice=Puck&text=red\",\"/api/tts?voice=Puck&text=fed\",\"/api/tts?voice=Puck&text=web\",\"/api/tts?voice=Puck&text=hen\",\"/api/tts?voice=Puck&text=pen\",\"/api/tts?voice=Puck&text=ten\",\"/api/tts?voice=Puck&text=men\",\"/api/tts?voice=Puck&text=den\",\"/api/tts?voice=Puck&text=jet\",\"/api/tts?voice=Puck&text=net\",\"/api/tts?voice=Puck&text=wet\",\"/api/tts?voice=Puck&text=leg\",\"/api/tts?voice=Puck&text=peg\",\"/api/tts?voice=Puck&text=gem\",\"/api/tts?voice=Puck&text=vet\",\"/api/tts?voice=Puck&text=nest\",\"/api/tts?voice=Puck&text=vest\",\"/api/tts?voice=Puck&text=desk\",\"/api/tts?voice=Puck&text=sell\"][index]"
    },
    {
      name: "word_pattern",
      type: "expression",
      formula: "[\"_ed\",\"_ed\",\"_ed\",\"_eb\",\"_en\",\"_en\",\"_en\",\"_en\",\"_en\",\"_et\",\"_et\",\"_et\",\"_eg\",\"_eg\",\"_em\",\"_et\",\"_est\",\"_est\",\"_esk\",\"_ell\"][index]"
    },
    {
      name: "answer_letter",
      type: "expression",
      formula: "[\"b\",\"r\",\"f\",\"w\",\"h\",\"p\",\"t\",\"m\",\"d\",\"j\",\"n\",\"w\",\"l\",\"p\",\"g\",\"v\",\"n\",\"v\",\"d\",\"s\"][index]"
    },
    {
      name: "distractor_letter",
      type: "expression",
      formula: "[\"r\",\"l\",\"w\",\"d\",\"p\",\"t\",\"m\",\"h\",\"t\",\"v\",\"w\",\"n\",\"b\",\"l\",\"h\",\"b\",\"v\",\"n\",\"t\",\"t\"][index]"
    }
  ],
  columns: [
    "word",
    "word_image",
    "word_audio",
    "word_pattern",
    "answer_letter",
    "distractor_letter"
  ],
  rows: [
    { _level: "l1", word: "bed", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331311909-bed.png", word_audio: "/api/tts?voice=Puck&text=bed", word_pattern: "_ed", answer_letter: "b", distractor_letter: "r" },
    { _level: "l2", word: "red", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331315165-red.png", word_audio: "/api/tts?voice=Puck&text=red", word_pattern: "_ed", answer_letter: "r", distractor_letter: "l" },
    { _level: "l3", word: "fed", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331317682-fed.png", word_audio: "/api/tts?voice=Puck&text=fed", word_pattern: "_ed", answer_letter: "f", distractor_letter: "w" },
    { _level: "l4", word: "web", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331323429-web.png", word_audio: "/api/tts?voice=Puck&text=web", word_pattern: "_eb", answer_letter: "w", distractor_letter: "d" },
    { _level: "l5", word: "hen", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331326128-hen.png", word_audio: "/api/tts?voice=Puck&text=hen", word_pattern: "_en", answer_letter: "h", distractor_letter: "p" },
    { _level: "l6", word: "pen", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331329319-pen.png", word_audio: "/api/tts?voice=Puck&text=pen", word_pattern: "_en", answer_letter: "p", distractor_letter: "t" },
    { _level: "l7", word: "ten", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331332358-ten.png", word_audio: "/api/tts?voice=Puck&text=ten", word_pattern: "_en", answer_letter: "t", distractor_letter: "m" },
    { _level: "l8", word: "men", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331334406-men.png", word_audio: "/api/tts?voice=Puck&text=men", word_pattern: "_en", answer_letter: "m", distractor_letter: "h" },
    { _level: "l9", word: "den", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331337622-den.png", word_audio: "/api/tts?voice=Puck&text=den", word_pattern: "_en", answer_letter: "d", distractor_letter: "t" },
    { _level: "l10", word: "jet", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331340158-jet.png", word_audio: "/api/tts?voice=Puck&text=jet", word_pattern: "_et", answer_letter: "j", distractor_letter: "v" },
    { _level: "l11", word: "net", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331343517-net.png", word_audio: "/api/tts?voice=Puck&text=net", word_pattern: "_et", answer_letter: "n", distractor_letter: "w" },
    { _level: "l12", word: "wet", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331349210-wet.png", word_audio: "/api/tts?voice=Puck&text=wet", word_pattern: "_et", answer_letter: "w", distractor_letter: "n" },
    { _level: "l13", word: "leg", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331351916-leg.png", word_audio: "/api/tts?voice=Puck&text=leg", word_pattern: "_eg", answer_letter: "l", distractor_letter: "b" },
    { _level: "l14", word: "peg", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331355082-peg.png", word_audio: "/api/tts?voice=Puck&text=peg", word_pattern: "_eg", answer_letter: "p", distractor_letter: "l" },
    { _level: "l15", word: "gem", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781331361226-gem.png", word_audio: "/api/tts?voice=Puck&text=gem", word_pattern: "_em", answer_letter: "g", distractor_letter: "h" },
    { _level: "l16", word: "vet", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779986385133-vet.png", word_audio: "/api/tts?voice=Puck&text=vet", word_pattern: "_et", answer_letter: "v", distractor_letter: "b" },
    { _level: "l17", word: "nest", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781143207585-nest.png", word_audio: "/api/tts?voice=Puck&text=nest", word_pattern: "_est", answer_letter: "n", distractor_letter: "v" },
    { _level: "l18", word: "vest", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781143225635-vest.png", word_audio: "/api/tts?voice=Puck&text=vest", word_pattern: "_est", answer_letter: "v", distractor_letter: "n" },
    { _level: "l19", word: "desk", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780983584860-desk.png", word_audio: "/api/tts?voice=Puck&text=desk", word_pattern: "_esk", answer_letter: "d", distractor_letter: "t" },
    { _level: "l20", word: "sell", word_image: "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970102020-sell.png", word_audio: "/api/tts?voice=Puck&text=sell", word_pattern: "_ell", answer_letter: "s", distractor_letter: "t" }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in env!');
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB || 'new-wexls';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Upsert the template doc in dynamic_templates collection
    const res = await db.collection('dynamic_templates').updateOne(
      { id: templateData.id },
      { $set: templateData },
      { upsert: true }
    );
    console.log(`Seeded dynamic template ukg-english-ukg-eng-short-e-complete! Upserted count: ${res.upsertedCount}, Modified count: ${res.modifiedCount}`);
  } catch (err) {
    console.error('Failed to seed short-e template:', err);
  } finally {
    await client.close();
  }
}

seed();
