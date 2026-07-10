import { getMongoDb } from '@/lib/db/mongo';
import { categorizedAssets } from './categorizedAssets.js';

// Seeded random number generator helper
function seededRandom(seed) {
  let h = 5381;
  const s = String(seed || Date.now());
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
  }
  let currentSeed = Math.abs(h);
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

function shuffleArray(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ordinalWordsMap = [
  { word: 'first', capitalized: 'First', number: '1st' },
  { word: 'second', capitalized: 'Second', number: '2nd' },
  { word: 'third', capitalized: 'Third', number: '3rd' },
  { word: 'fourth', capitalized: 'Fourth', number: '4th' },
  { word: 'fifth', capitalized: 'Fifth', number: '5th' },
  { word: 'sixth', capitalized: 'Sixth', number: '6th' },
  { word: 'seventh', capitalized: 'Seventh', number: '7th' },
  { word: 'eighth', capitalized: 'Eighth', number: '8th' }
];

export async function generateOrdinalQuestion(templateDoc, seed) {
  // 1. Identify category to use (default: animals)
  const categoryKey = templateDoc.variables?.category || 'animals';
  
  // Resolve database filter based on category
  const dbFilters = {
    animals: { $or: [{ 'classification.category': 'animals' }, { key: /^images\/lkg\/animals\// }] },
    fruits: { $or: [{ 'classification.category': 'fruits' }, { key: /^images\/lkg\/fruits\// }] },
    vehicles: { $or: [{ 'classification.category': 'vehicles' }, { key: /^images\/lkg\/vehicles\// }] },
    birds: { $or: [{ 'classification.category': 'birds' }, { key: /^images\/lkg\/birds\// }] },
    shapes: { $or: [{ 'classification.category': 'shapes' }, { key: /^images\/math\/shapes\// }] },
    schoolObjects: { $or: [{ 'classification.category': 'school' }, { key: /^images\/lkg\/school\// }, { key: /^images\/lkg\/things\/(pencil|book|backpack|ruler|eraser|pen|scissors|crayon|glue|paper|desk|board)/ }] }
  };

  const dbFilter = dbFilters[categoryKey] || dbFilters.animals;

  // 2. Load matching image assets from MongoDB image_assets
  let dbItems = [];
  try {
    const db = await getMongoDb();
    if (db) {
      const dbImages = await db.collection('image_assets').find(dbFilter).toArray();

      const publicUrl = process.env.VITE_R2_PUBLIC_URL || 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev';
      dbItems = dbImages.map(img => {
        const id = img.key ? img.key.split('/').pop().split('.')[0] : String(img._id);
        const label = img.linguistics?.singular || img.name || 'item';
        const image = img.url || `${publicUrl}/${img.key}`;
        const article = img.linguistics?.article || (['a', 'e', 'i', 'o', 'u'].includes(label.charAt(0).toLowerCase()) ? 'an' : 'a');
        return { id, label, image, article };
      });
    }
  } catch (err) {
    console.warn('[ordinalGenerator] Failed to fetch images from DB, using fallbacks:', err.message);
  }

  // 3. Category fallback pool
  const fallbackList = categorizedAssets[categoryKey] || categorizedAssets.animals;
  const pool = dbItems.length >= 4 ? dbItems : fallbackList;

  const rng = seededRandom(seed);

  // 3. Determine sequence length (between min & max)
  const minLen = templateDoc.variables?.sequenceLength?.min || 4;
  const maxLen = templateDoc.variables?.sequenceLength?.max || 8;
  const seqLen = Math.floor(rng() * (maxLen - minLen + 1)) + minLen;

  // 4. Pick unique animals for sequence
  const shuffledPool = shuffleArray([...pool], rng);
  const chosenAnimals = shuffledPool.slice(0, seqLen);

  // 5. Select target index and build words
  const targetIndex = Math.floor(rng() * seqLen);
  const targetAnimal = chosenAnimals[targetIndex];
  const targetOrdinal = ordinalWordsMap[targetIndex] || ordinalWordsMap[0];

  const resolvedOrdinal = targetOrdinal.word;
  const resolvedLabel = targetAnimal.label;

  // 6. Build image parts for the sequence — each is a direct-selectable image.
  //    With no text part prepended, partIndex of each image = its index in parts array.
  //    So correctPartIndex = targetIndex directly.
  const sequenceImageParts = chosenAnimals.map((animal, idx) => ({
    type: 'image',
    imageUrl: animal.image,
    src: animal.image,
    label: animal.label,
    alt: animal.label,
    isCorrect: idx === targetIndex,
    rowImage: true,
    rowImageCount: seqLen,
    rowImageGap: 8,
    commonImageWidth: 80,
    style: {
      width: '70px',
      height: '70px',
      objectFit: 'contain',
      borderRadius: '10px'
    }
  }));

  // 7. Assemble output payload — direct image select, images in one row, no options grid, no hint text
  //    All images go inside a single 'row' group part. partIndexOffset=0 means child[0]=partIndex 0, child[1]=partIndex 1, etc.
  //    answer = targetIndex (the correct image's position in the children array).
  const rowContainerPart = {
    type: 'row',
    partIndexOffset: 0,
    style: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '16px',
      border: '1.5px solid #cbd5e1',
      width: '100%'
    },
    parts: sequenceImageParts
  };

  return {
    type: 'mcq',
    interaction: 'direct_image_select',
    directImageSelect: true,
    questionText: `Which picture is the ${resolvedOrdinal}?`,
    parts: [rowContainerPart],
    options: [],
    answer: targetIndex,
    correctAnswer: targetIndex,
    correctAnswerText: targetAnimal.label,
    explanation: {
      sections: [
        {
          type: 'text',
          content: `Count from the left. The ${resolvedOrdinal} picture is the ${resolvedLabel}.`
        }
      ]
    },
    schema: {
      templateId: templateDoc.id,
      subject: templateDoc.subject || 'math',
      topic: templateDoc.topic || 'counting',
      grade: templateDoc.grade || 'grade-1',
      skillId: templateDoc.skillId || 'g1-a-20',
      variables: {
        ordinalWord: resolvedOrdinal,
        answerLabel: resolvedLabel
      }
    }
  };
}
