import { fruits, animals, things, vehicles } from './assets.js';
import { lkgEnglishTemplateRegistry, lkgEnglishMicroSkillRegistry } from './registry.js';
import letterAudios from './letterAudios.json' with { type: 'json' };
import vocabulary from './vocabulary.json' with { type: 'json' };
import phonicsImages from './phonicsImages.json' with { type: 'json' };
import { generate as generatePhonicsAssoc } from '../../../../templates/english/phonics/generator.js';

const { wordPool: WORD_POOL, endingFamilies: ENDING_FAMILIES, sentencesPool: SENTENCES_POOL, wordImages: WORD_IMAGES, spottingWordPool: SPOTTING_WORD_POOL } = vocabulary;


function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function shuffle(array, r) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const GRID_COORDINATES = [
  { optionIndex: 0, x: 80, y: 47, width: 300, height: 174, pctX: 10, pctY: 10, pctW: 37.5, pctH: 37.5 },
  { optionIndex: 1, x: 420, y: 47, width: 300, height: 174, pctX: 52.5, pctY: 10, pctW: 37.5, pctH: 37.5 },
  { optionIndex: 2, x: 80, y: 244, width: 300, height: 174, pctX: 10, pctY: 52.5, pctW: 37.5, pctH: 37.5 },
  { optionIndex: 3, x: 420, y: 244, width: 300, height: 174, pctX: 52.5, pctY: 52.5, pctW: 37.5, pctH: 37.5 }
];

const PASTEL_GRADIENTS = [
  '<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fee2e2" /><stop offset="100%" stop-color="#e0e7ff" /></linearGradient>',
  '<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e0f2fe" /><stop offset="100%" stop-color="#f0fdf4" /></linearGradient>',
  '<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef3c7" /><stop offset="100%" stop-color="#fee2e2" /></linearGradient>'
];

function generateBeginningSoundsQuestion(seed, r) {
  const allAssets = [
    ...fruits.map(item => ({ ...item, category: 'fruit' })),
    ...animals.map(item => ({ ...item, category: 'animal' })),
    ...things.map(item => ({ ...item, category: 'thing' })),
    ...vehicles.map(item => ({ ...item, category: 'vehicle' }))
  ];

  // Pick a random target asset
  const targetIdx = Math.floor(r * allAssets.length);
  const targetAsset = allAssets[targetIdx];
  const targetLetter = targetAsset.firstLetter;

  // Filter out distractors that don't start with the target letter
  const potentialDistractors = allAssets.filter(item => item.firstLetter !== targetLetter);

  // Group distractors by starting letter to choose distinct letters
  const distractorMap = {};
  potentialDistractors.forEach(item => {
    if (!distractorMap[item.firstLetter]) {
      distractorMap[item.firstLetter] = [];
    }
    distractorMap[item.firstLetter].push(item);
  });

  const distinctLetters = Object.keys(distractorMap);
  const shuffledLetters = shuffle(distinctLetters, r);

  const selectedDistractors = [];
  for (let i = 0; i < 3 && i < shuffledLetters.length; i++) {
    const letterGroup = distractorMap[shuffledLetters[i]];
    const item = letterGroup[Math.floor(r * letterGroup.length)];
    selectedDistractors.push(item);
  }

  // Combine options
  const rawOptions = [targetAsset, ...selectedDistractors];
  const optionsList = shuffle(rawOptions, r);
  const correctAnswerIndex = optionsList.findIndex(opt => opt.name === targetAsset.name);

  // Format hotspots and part hotspots
  const hotspots = optionsList.map((opt, idx) => {
    const coords = GRID_COORDINATES[idx];
    return {
      id: `hs_${opt.name}_${idx}`,
      label: opt.singular,
      x: coords.pctX,
      y: coords.pctY,
      width: coords.pctW,
      height: coords.pctH,
      isCircle: false,
      isCorrect: idx === correctAnswerIndex,
      imageUrl: opt.imageUrl,
      audioUrl: letterAudios[opt.singular]
    };
  });

  const partHotspots = optionsList.map((opt, idx) => {
    const coords = GRID_COORDINATES[idx];
    return {
      optionIndex: idx,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      label: opt.singular,
      isCircle: false,
      imageUrl: opt.imageUrl,
      id: `hs_${opt.name}_${idx}`,
      audioUrl: letterAudios[opt.singular]
    };
  });

  const gradient = PASTEL_GRADIENTS[Math.floor(r * PASTEL_GRADIENTS.length)];
  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}</defs>
  <rect width="800" height="465" fill="url(#bgGrad)" rx="20" />
</svg>`;

  const questionText = `Click on the object that starts with the sound of letter **${targetLetter.toUpperCase()}**.`;
  const audioUrl = letterAudios[questionText];

  return {
    id: `english_lkg_beginning_sounds_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'all',
    explanation: `**${targetAsset.singular.toUpperCase()}** starts with the letter **${targetLetter.toUpperCase()}**.`,
    options: optionsList.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.singular,
      audioUrl: letterAudios[opt.singular]
    })),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    hotspots,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg
      }
    ]
  };
}

function generateIdentifyCategoryQuestion(seed, r) {
  const categories = [
    { key: 'fruit', label: 'fruit', list: fruits },
    { key: 'animal', label: 'animal', list: animals },
    { key: 'thing', label: 'thing/object', list: things },
    { key: 'vehicle', label: 'vehicle', list: vehicles }
  ];

  // Pick target category
  const targetCategoryIdx = Math.floor(r * categories.length);
  const targetCategory = categories[targetCategoryIdx];

  // Pick correct item
  const correctItemIdx = Math.floor(r * targetCategory.list.length);
  const correctItem = targetCategory.list[correctItemIdx];

  // Pick distractors from other categories
  const otherCategories = categories.filter(c => c.key !== targetCategory.key);
  const selectedDistractors = [];

  otherCategories.forEach(cat => {
    const itemIdx = Math.floor(r * cat.list.length);
    selectedDistractors.push(cat.list[itemIdx]);
  });

  // Combine options
  const rawOptions = [correctItem, ...selectedDistractors];
  const optionsList = shuffle(rawOptions, r);
  const correctAnswerIndex = optionsList.findIndex(opt => opt.name === correctItem.name);

  // Format hotspots
  const hotspots = optionsList.map((opt, idx) => {
    const coords = GRID_COORDINATES[idx];
    return {
      id: `hs_${opt.name}_${idx}`,
      label: opt.singular,
      x: coords.pctX,
      y: coords.pctY,
      width: coords.pctW,
      height: coords.pctH,
      isCircle: false,
      isCorrect: idx === correctAnswerIndex,
      imageUrl: opt.imageUrl,
      audioUrl: letterAudios[opt.singular]
    };
  });

  const partHotspots = optionsList.map((opt, idx) => {
    const coords = GRID_COORDINATES[idx];
    return {
      optionIndex: idx,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      label: opt.singular,
      isCircle: false,
      imageUrl: opt.imageUrl,
      id: `hs_${opt.name}_${idx}`,
      audioUrl: letterAudios[opt.singular]
    };
  });

  const gradient = PASTEL_GRADIENTS[Math.floor(r * PASTEL_GRADIENTS.length)];
  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}</defs>
  <rect width="800" height="465" fill="url(#bgGrad)" rx="20" />
</svg>`;

  const questionText = `Click on the **${targetCategory.label}**.`;
  const audioUrl = letterAudios[questionText];

  return {
    id: `english_lkg_identify_category_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'all',
    explanation: `The **${correctItem.singular}** is a type of **${targetCategory.label}**.`,
    options: optionsList.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.singular,
      audioUrl: letterAudios[opt.singular]
    })),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    hotspots,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg
      }
    ]
  };
}

// ─── Ruled letter card SVG helper ─────────────────────────────────────────────
// Renders a letter with the classic writing-line rules (blue headline, pink
// dashed midline, blue baseline) just like IXL / Handwriting-without-tears cards.
function ruledLetterSvg(letter, w = 200, h = 140) {
  const cx = w / 2;
  const scale = h / 140;
  const headY = 22 * scale;   // top blue rule
  const midY  = 70 * scale;   // pink dashed midline
  const baseY = 118 * scale;  // bottom blue rule
  
  // Detect if any character is uppercase or tall lowercase
  const hasUppercase = /[A-Z]/.test(letter);
  const hasTallLowercase = /[bdfhlkt]/.test(letter);
  const isTall = hasUppercase || hasTallLowercase;
  
  // Font sizes: Arial cap-height is ~72%, x-height is ~52%
  // Visual height needed for tall: 96px (96 / 0.72 = 133.3)
  // Visual height needed for short: 48px (48 / 0.52 = 92.3)
  let fontSize = (isTall ? 133 : 92) * scale;
  
  if (letter.length > 1) {
    // scale font size down to fit within width (with 24px padding total)
    // 0.55 is a conservative width-to-height ratio for Arial characters
    fontSize = Math.min(fontSize, ((w - 24) / (letter.length * 0.55)) * scale);
  }
  
  // Align text baseline to baseY
  const textY = baseY;

  return [
    `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`,
    `  <rect width="${w}" height="${h}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>`,
    // headline
    `  <line x1="12" y1="${headY}" x2="${w - 12}" y2="${headY}" stroke="#3b82f6" stroke-width="1.5"/>`,
    // midline (dashed pink)
    `  <line x1="12" y1="${midY}" x2="${w - 12}" y2="${midY}" stroke="#f87171" stroke-width="1.5" stroke-dasharray="6,4"/>`,
    // baseline
    `  <line x1="12" y1="${baseY}" x2="${w - 12}" y2="${baseY}" stroke="#3b82f6" stroke-width="1.5"/>`,
    // the letter
    `  <text x="${cx}" y="${textY}" font-size="${fontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="alphabetic" fill="#111827">${letter}</text>`,
    `</svg>`
  ].join('\n');
}

// Generates styled, premium vector letters for Pre-K MCQ choices
function getStyledLetterSvg(letter, styleIndex) {
  const normalizedIndex = styleIndex % 3;

  if (normalizedIndex === 0) {
    // Red 3D bubble/glossy letter style
    return `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red3dGrad_${letter}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#991b1b" />
        </linearGradient>
        <filter id="shadow3d_${letter}" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="1.5" flood-color="#7f1d1d" flood-opacity="0.6"/>
        </filter>
      </defs>
      <text x="50" y="72" font-size="70" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="url(#red3dGrad_${letter})" filter="url(#shadow3d_${letter})">${letter}</text>
      <text x="50" y="72" font-size="70" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="none" stroke="#fecaca" stroke-width="1.8" stroke-dasharray="10 5" opacity="0.6">${letter}</text>
    </svg>`;
  } else if (normalizedIndex === 1) {
    // Sunset gradient style
    return `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sunsetGrad_${letter}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7" />
          <stop offset="50%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
        <filter id="softGlow_${letter}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="2.5" flood-color="#db2777" flood-opacity="0.4"/>
        </filter>
      </defs>
      <text x="50" y="74" font-size="70" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="url(#sunsetGrad_${letter})" filter="url(#softGlow_${letter})">${letter}</text>
    </svg>`;
  } else {
    // Neo-Brutalism Outline style
    return `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <text x="53" y="73" font-size="70" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="#0f172a">${letter}</text>
      <text x="50" y="70" font-size="70" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="#38bdf8" stroke="#0f172a" stroke-width="4.5" stroke-linejoin="round">${letter}</text>
    </svg>`;
  }
}

// Group definitions for B.1/B.2/B.3/B.5
const CASE_MATCH_GROUPS = {
  similar:  'ckopsuvwxz'.split(''),  // B.1 – look similar upper/lower
  tall:     'fijlmty'.split(''),     // B.2 – tall/distinctive lowercase
  distinct: 'abdeghmnqr'.split(''), // B.3 – clearly different uppercase/lowercase
};

// 2-option hotspot coords (centred side by side)
const TWO_OPTION_COORDS = [
  { pctX: 20, pctY: 32, pctW: 22, pctH: 36, x: 160, y: 150, width: 176, height: 168 },
  { pctX: 58, pctY: 32, pctW: 22, pctH: 36, x: 464, y: 150, width: 176, height: 168 },
];

function generateCaseMatchQuestion(skillId, seed, r, config = {}) {
  const SKILLS_GROUP_B = {
    'lkg-english-case-match-lower-similar':   { group: 'similar',  mode: 'upper-to-lower' },
    'lkg-english-case-match-lower-different': { group: 'tall',     mode: 'upper-to-lower' },
    'lkg-english-case-match-lower-distinct':  { group: 'distinct', mode: 'upper-to-lower' },
    'lkg-english-case-find-all-lowercase':    { group: 'all',      mode: 'find-lowercase'  },
    'lkg-english-case-match-upper-similar':   { group: 'similar',  mode: 'lower-to-upper' },
    'lkg-english-case-match-upper-different': { group: 'tall',     mode: 'lower-to-upper' },
    'lkg-english-case-match-upper-distinct':  { group: 'distinct', mode: 'lower-to-upper' },
    'lkg-english-case-find-all-uppercase':    { group: 'all',      mode: 'find-uppercase'  },
  };

  const def = SKILLS_GROUP_B[skillId];
  if (!def) return null;

  const lowerAlpha = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const upperAlpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // ── B.4: Find all lowercase letters ────────────────────────────────────────
  if (def.mode === 'find-lowercase') {
    // Read practiceLevel from config, default to 2
    const practiceLevel = config.history?.practiceLevel ?? 2;
    
    let totalCards = 3;
    let numLower = 2;
    
    if (practiceLevel === 1) {
      totalCards = 3;
      numLower = 1;
    } else if (practiceLevel === 2) {
      totalCards = 3;
      numLower = 2;
    } else if (practiceLevel === 3) {
      totalCards = 4;
      numLower = 2;
    } else if (practiceLevel === 4) {
      totalCards = 4;
      numLower = 3;
    } else if (practiceLevel === 5) {
      totalCards = 5;
      numLower = 3;
    }
    
    const numUpper = totalCards - numLower;

    const shuffledLower = [...lowerAlpha].sort(() => r - 0.5);
    const shuffledUpper = [...upperAlpha].sort(() => r - 0.5);
    const chosenLower = shuffledLower.slice(0, numLower);
    const chosenUpper = shuffledUpper.slice(0, numUpper);
    const allCards = [...chosenLower, ...chosenUpper].sort(() => r - 0.5);

    const questionText = 'Find **all** the lowercase letters.';
    const correctAnswerIndices = allCards.map((l, i) => chosenLower.includes(l) ? i : -1).filter(i => i >= 0);

    return {
      id: `english_lkg_case_match_${skillId}_${seed}`,
      type: 'mcq',
      interaction: 'multi_select',
      multiSelect: true,
      questionText,
      audioUrl: letterAudios[questionText],
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `The lowercase letters are: **${chosenLower.join(', ')}**.`,
      options: allCards.map((l, i) => ({
        id: `opt_${i}`,
        label: l,
        content: ruledLetterSvg(l, 200, 140),
        audioUrl: letterAudios[l]
      })),
      correctAnswerIndex: correctAnswerIndices[0] ?? 0,
      correctAnswerIndices,
      answer: correctAnswerIndices,
      metadata: { chapterId: 'english-lkg-case-letters' },
      parts: [
        { type: 'text', content: questionText }
      ]
    };
  }

  // ── B.8: Find all uppercase letters ────────────────────────────────────────
  if (def.mode === 'find-uppercase') {
    // Read practiceLevel from config, default to 2
    const practiceLevel = config.history?.practiceLevel ?? 2;
    
    let totalCards = 3;
    let numUpper = 2;
    
    if (practiceLevel === 1) {
      totalCards = 3;
      numUpper = 1;
    } else if (practiceLevel === 2) {
      totalCards = 3;
      numUpper = 2;
    } else if (practiceLevel === 3) {
      totalCards = 4;
      numUpper = 2;
    } else if (practiceLevel === 4) {
      totalCards = 4;
      numUpper = 3;
    } else if (practiceLevel === 5) {
      totalCards = 5;
      numUpper = 3;
    }
    
    const numLower = totalCards - numUpper;

    const shuffledLower = [...lowerAlpha].sort(() => r - 0.5);
    const shuffledUpper = [...upperAlpha].sort(() => r - 0.5);
    const chosenLower = shuffledLower.slice(0, numLower);
    const chosenUpper = shuffledUpper.slice(0, numUpper);
    const allCards = [...chosenLower, ...chosenUpper].sort(() => r - 0.5);

    const questionText = 'Find **all** the uppercase letters.';
    const correctAnswerIndices = allCards.map((l, i) => chosenUpper.includes(l) ? i : -1).filter(i => i >= 0);

    return {
      id: `english_lkg_case_match_${skillId}_${seed}`,
      type: 'mcq',
      interaction: 'multi_select',
      multiSelect: true,
      questionText,
      audioUrl: letterAudios[questionText],
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `The uppercase letters are: **${chosenUpper.join(', ')}**.`,
      options: allCards.map((l, i) => ({
        id: `opt_${i}`,
        label: l,
        content: ruledLetterSvg(l, 200, 140),
        audioUrl: letterAudios[l]
      })),
      correctAnswerIndex: correctAnswerIndices[0] ?? 0,
      correctAnswerIndices,
      answer: correctAnswerIndices,
      metadata: { chapterId: 'english-lkg-case-letters' },
      parts: [
        { type: 'text', content: questionText }
      ]
    };
  }

  // ── B.1/B.2/B.3/B.5: Choose matching case ──────────────────────────────────
  const group = def.group === 'all'
    ? lowerAlpha
    : (CASE_MATCH_GROUPS[def.group] || lowerAlpha);

  const targetIdx = Math.floor(r * group.length);
  const targetLower = group[targetIdx];
  const targetUpper = targetLower.toUpperCase();
  const isUpperToLower = def.mode === 'upper-to-lower';

  // Pick one distractor from same group
  const others = group.filter(l => l !== targetLower);
  const distractorLower = others[Math.floor(r * others.length)];
  const distractorUpper = distractorLower.toUpperCase();

  const shownLetter   = isUpperToLower ? targetUpper   : targetLower;
  const correctAnswer = isUpperToLower ? targetLower   : targetUpper;
  const wrongAnswer   = isUpperToLower ? distractorLower : distractorUpper;

  const pair = Math.random() > 0.5 ? [correctAnswer, wrongAnswer] : [wrongAnswer, correctAnswer];
  const correctAnswerIndex = pair.indexOf(correctAnswer);

  const questionText = isUpperToLower
    ? `Look at this uppercase letter. Which lowercase letter matches?`
    : `Look at this lowercase letter. Which uppercase letter matches?`;

  const shownLetterSvg = ruledLetterSvg(shownLetter, 220, 155);

  return {
    id: `english_lkg_case_match_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'choice',
    questionText,
    shownLetter,
    shownLetterSvg,
    audioUrl: letterAudios[questionText],
    voice: 'Kore',
    generateAudio: 'all',
    explanation: isUpperToLower
      ? `The lowercase form of **${shownLetter}** is **${correctAnswer}**.`
      : `The uppercase form of **${shownLetter}** is **${correctAnswer}**.`,
    options: pair.map((l, i) => ({
      id: `opt_${i}`,
      label: l,
      content: ruledLetterSvg(l, 176, 140),
      audioUrl: letterAudios[l]
    })),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    metadata: { chapterId: 'english-lkg-case-letters' },
    parts: [
      { type: 'text', content: questionText },
      { type: 'case_match_shown_letter', letter: shownLetter, svgContent: shownLetterSvg }
    ]
  };
}

const UPPER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ROW_COORDINATES = [
  { pctX: 10, pctY: 55, pctW: 16.25, pctH: 25, x: 80, y: 260, width: 130, height: 115 },
  { pctX: 31.25, pctY: 55, pctW: 16.25, pctH: 25, x: 250, y: 260, width: 130, height: 115 },
  { pctX: 52.5, pctY: 55, pctW: 16.25, pctH: 25, x: 420, y: 260, width: 130, height: 115 },
  { pctX: 73.75, pctY: 55, pctW: 16.25, pctH: 25, x: 590, y: 260, width: 130, height: 115 }
];

const CENTER_ROW_COORDINATES = [
  { pctX: 10, pctY: 35, pctW: 16.25, pctH: 30, x: 80, y: 165, width: 130, height: 140 },
  { pctX: 31.25, pctY: 35, pctW: 16.25, pctH: 30, x: 250, y: 165, width: 130, height: 140 },
  { pctX: 52.5, pctY: 35, pctW: 16.25, pctH: 30, x: 420, y: 165, width: 130, height: 140 },
  { pctX: 73.75, pctY: 35, pctW: 16.25, pctH: 30, x: 590, y: 165, width: 130, height: 140 }
];

const CONFUSING_PAIRS = [
  ['b', 'd'], ['p', 'q'], ['M', 'W'], ['E', 'F'], ['n', 'u'], ['O', 'Q']
];

function getRowCoordinates(numOptions, baseCoords) {
  const base = baseCoords[0];
  const width = base.width;
  const pctW = base.pctW;
  const height = base.height;
  const pctH = base.pctH;
  const y = base.y;
  const pctY = base.pctY;

  const gap = 40;
  const totalWidth = numOptions * width + (numOptions - 1) * gap;
  const startX = (800 - totalWidth) / 2;

  const coords = [];
  for (let i = 0; i < numOptions; i++) {
    const x = startX + i * (width + gap);
    const pctX = (x / 800) * 100;
    coords.push({
      pctX,
      pctY,
      pctW,
      pctH,
      x,
      y,
      width,
      height
    });
  }
  return coords;
}

function generateLetterRecognitionQuestion(skillId, seed, r, variables = {}, config = {}) {
  const difficulty = variables.difficulty || config.difficulty || 'adaptive';
  const history = config.history || { correctStreak: 0, practiceLevel: 1 };

  let effectiveDifficulty = 'easy';
  if (difficulty === 'adaptive') {
    if (history.correctStreak >= 6 || history.practiceLevel >= 5) {
      effectiveDifficulty = 'hard';
    } else if (history.correctStreak >= 3 || history.practiceLevel >= 3) {
      effectiveDifficulty = 'medium';
    } else {
      effectiveDifficulty = 'easy';
    }
  } else {
    effectiveDifficulty = difficulty;
  }

  let questionText = '';
  let explanation = '';
  let backgroundSvg = '';
  let hotspots = [];
  let partHotspots = [];
  let optionsList = [];
  let correctAnswerIndex = 0;
  let soundUrl = undefined;
  let soundText = undefined;
  
  if (
    skillId === 'lkg-english-letter-recognition-uppercase' ||
    skillId === 'lkg-english-letter-recognition-lowercase'
  ) {
    const isUpper = skillId === 'lkg-english-letter-recognition-uppercase';
    const alphabet = isUpper ? UPPER_ALPHABET : LOWER_ALPHABET;
    const targetIdx = Math.floor(r * 26);
    const targetLetter = alphabet[targetIdx];
    
    questionText = isUpper
      ? `Click on the big letter **${targetLetter}**.`
      : `Click on the small letter **${targetLetter}**.`;
      
    explanation = isUpper
      ? `This is the big letter **${targetLetter}**.`
      : `This is the small letter **${targetLetter}**.`;

    const positions = [];
    // Row 1 (A-G / a-g)
    for (let col = 0; col < 7; col++) {
      positions.push({ x: 40 + col * 105, y: 45 });
    }
    // Row 2 (H-N / h-n)
    for (let col = 0; col < 7; col++) {
      positions.push({ x: 40 + col * 105, y: 143 });
    }
    // Row 3 (O-U / o-u)
    for (let col = 0; col < 7; col++) {
      positions.push({ x: 40 + col * 105, y: 242 });
    }
    // Row 4 (V-Z / v-z)
    for (let col = 0; col < 5; col++) {
      positions.push({ x: 145 + col * 105, y: 339 });
    }

    hotspots = alphabet.map((letter, idx) => {
      const pos = positions[idx];
      return {
        id: `hs_${letter}_${idx}`,
        label: letter,
        x: (pos.x / 800) * 100,
        y: (pos.y / 465) * 100,
        width: (90 / 800) * 100,
        height: (80 / 465) * 100,
        isCircle: false,
        isCorrect: idx === targetIdx
      };
    });

    partHotspots = alphabet.map((letter, idx) => {
      const pos = positions[idx];
      return {
        optionIndex: idx,
        x: pos.x,
        y: pos.y,
        width: 90,
        height: 80,
        label: letter,
        isCircle: false,
        id: `hs_${letter}_${idx}`
      };
    });

    optionsList = alphabet.map((letter, idx) => ({
      id: `opt_${idx}`,
      label: letter
    }));
    
    correctAnswerIndex = targetIdx;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdf4ff" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
    </svg>`;

  } else if (skillId === 'lkg-english-letter-recognition-case-match') {
    const letterIdx = Math.floor(r * 26);
    const bigLetter = UPPER_ALPHABET[letterIdx];
    const smallLetter = LOWER_ALPHABET[letterIdx];
    
    const shuffled = shuffle(LOWER_ALPHABET, r);
    const distractorCount = effectiveDifficulty === 'easy' ? 1 : (effectiveDifficulty === 'medium' ? 2 : 3);
    const distractors = shuffled.filter(l => l !== smallLetter).slice(0, distractorCount);
    
    optionsList = shuffle([smallLetter, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(smallLetter);
    
    questionText = `Which small letter matches the big letter **${bigLetter}**?`;
    explanation = `**${bigLetter}** matches with **${smallLetter}**.`;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef3c7" />
          <stop offset="100%" stop-color="#fdf4ff" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
      <circle cx="400" cy="130" r="50" fill="#ffffff" stroke="#f59e0b" stroke-width="4" />
      <text x="400" y="148" font-size="52" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#d97706">${bigLetter}</text>
    </svg>`;

    const coordsForOptions = getRowCoordinates(optionsList.length, ROW_COORDINATES);
    hotspots = optionsList.map((letter, idx) => {
      const coords = coordsForOptions[idx];
      return {
        id: `hs_${letter}_${idx}`,
        label: letter,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex
      };
    });

    partHotspots = optionsList.map((letter, idx) => {
      const coords = coordsForOptions[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: letter,
        isCircle: false,
        id: `hs_${letter}_${idx}`
      };
    });

  } else if (skillId === 'lkg-english-letter-recognition-phonics-sound') {
    const letterIdx = Math.floor(r * 26);
    const letter = UPPER_ALPHABET[letterIdx];
    
    const shuffled = shuffle(UPPER_ALPHABET, r);
    const distractorCount = effectiveDifficulty === 'easy' ? 1 : (effectiveDifficulty === 'medium' ? 2 : 3);
    const distractors = shuffled.filter(l => l !== letter).slice(0, distractorCount);
    
    optionsList = shuffle([letter, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(letter);
    
    questionText = `Click on the letter that makes the sound **/ ${letter.toLowerCase()} /**.`;
    explanation = `**${letter}** makes the sound **/ ${letter.toLowerCase()} /**.`;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ecfdf5" />
          <stop offset="100%" stop-color="#d1fae5" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
    </svg>`;

    const coordsForOptions = getRowCoordinates(optionsList.length, CENTER_ROW_COORDINATES);
    hotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        id: `hs_${l}_${idx}`,
        label: l,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex
      };
    });

    partHotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: l,
        isCircle: false,
        id: `hs_${l}_${idx}`
      };
    });

  } else if (skillId === 'lkg-english-letter-recognition-alphabetical-sequence') {
    const startIdx = Math.floor(r * 23); // index 0 to 22
    const L0 = UPPER_ALPHABET[startIdx];
    const L1 = UPPER_ALPHABET[startIdx + 1];
    const L2 = UPPER_ALPHABET[startIdx + 2];
    const L3 = UPPER_ALPHABET[startIdx + 3];
    
    const shuffled = shuffle(UPPER_ALPHABET, r);
    const distractorCount = effectiveDifficulty === 'easy' ? 1 : (effectiveDifficulty === 'medium' ? 2 : 3);
    const distractors = shuffled.filter(l => l !== L0 && l !== L1 && l !== L2 && l !== L3).slice(0, distractorCount);
    
    optionsList = shuffle([L2, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(L2);
    
    questionText = `Which letter is missing? **${L0}, ${L1}, __, ${L3}**`;
    explanation = `The correct alphabetical order is **${L0}, ${L1}, ${L2}, ${L3}**.`;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff6ff" />
          <stop offset="100%" stop-color="#dbeafe" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
      
      <!-- Stone 0 -->
      <rect x="80" y="70" width="120" height="100" rx="20" fill="#ffffff" stroke="#bfdbfe" stroke-width="4" />
      <text x="140" y="135" font-size="44" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#1e3a8a">${L0}</text>
      
      <!-- Stone 1 -->
      <rect x="250" y="70" width="120" height="100" rx="20" fill="#ffffff" stroke="#bfdbfe" stroke-width="4" />
      <text x="310" y="135" font-size="44" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#1e3a8a">${L1}</text>
      
      <!-- Stone 2 (Missing) -->
      <rect x="420" y="70" width="120" height="100" rx="20" fill="#ffffff" stroke="#3b82f6" stroke-width="4" stroke-dasharray="8,6" />
      <text x="480" y="135" font-size="44" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#3b82f6">?</text>
      
      <!-- Stone 3 -->
      <rect x="590" y="70" width="120" height="100" rx="20" fill="#ffffff" stroke="#bfdbfe" stroke-width="4" />
      <text x="650" y="135" font-size="44" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#1e3a8a">${L3}</text>
    </svg>`;

    const coordsForOptions = getRowCoordinates(optionsList.length, ROW_COORDINATES);
    hotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        id: `hs_${l}_${idx}`,
        label: l,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex
      };
    });

    partHotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: l,
        isCircle: false,
        id: `hs_${l}_${idx}`
      };
    });

  } else if (skillId === 'lkg-english-letter-recognition-in-word-spotting') {
    const wordIdx = Math.floor(r * SPOTTING_WORD_POOL.length);
    const word = SPOTTING_WORD_POOL[wordIdx];
    
    // Choose a random letter from the word as the target
    const targetCharIdx = Math.floor(r * word.length);
    const targetLetter = word[targetCharIdx];
    
    questionText = `Find the letter **${targetLetter}** in the word **${word}**.`;
    explanation = `**${targetLetter}** is part of the word **${word}**.`;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdf4ff" />
          <stop offset="100%" stop-color="#fae8ff" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
    </svg>`;

    const N = word.length;
    const colWidth = 110;
    const colHeight = 100;
    const gap = 20;
    const totalWidth = N * colWidth + (N - 1) * gap;
    const startX = (800 - totalWidth) / 2;
    const yVal = 180;

    optionsList = word.split('');
    correctAnswerIndex = optionsList.indexOf(targetLetter);

    hotspots = optionsList.map((letter, idx) => {
      const x = startX + idx * (colWidth + gap);
      return {
        id: `hs_${letter}_${idx}`,
        label: letter,
        x: (x / 800) * 100,
        y: (yVal / 465) * 100,
        width: (colWidth / 800) * 100,
        height: (colHeight / 465) * 100,
        isCircle: false,
        isCorrect: letter === targetLetter
      };
    });

    partHotspots = optionsList.map((letter, idx) => {
      const x = startX + idx * (colWidth + gap);
      return {
        optionIndex: idx,
        x,
        y: yVal,
        width: colWidth,
        height: colHeight,
        label: letter,
        isCircle: false,
        id: `hs_${letter}_${idx}`
      };
    });

  } else if (skillId === 'lkg-english-letter-recognition-next-letter') {
    const startIdx = Math.floor(r * 25);
    const letter = UPPER_ALPHABET[startIdx];
    const nextLetter = UPPER_ALPHABET[startIdx + 1];
    
    const shuffled = shuffle(UPPER_ALPHABET, r);
    const distractorCount = effectiveDifficulty === 'easy' ? 1 : (effectiveDifficulty === 'medium' ? 2 : 3);
    const distractors = shuffled.filter(l => l !== letter && l !== nextLetter).slice(0, distractorCount);
    
    optionsList = shuffle([nextLetter, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(nextLetter);
    
    questionText = `What letter comes right after **${letter}**?`;
    explanation = `**${nextLetter}** comes right after **${letter}** in the alphabet.`;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdf4ff" />
          <stop offset="100%" stop-color="#fae8ff" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
      
      <!-- Prompt Letter Box -->
      <rect x="230" y="80" width="120" height="110" rx="24" fill="#ffffff" stroke="#e9d5ff" stroke-width="4" />
      <text x="290" y="155" font-size="56" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#6b21a8">${letter}</text>
      
      <!-- Arrow -->
      <text x="400" y="150" font-size="48" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#c084fc">➔</text>
      
      <!-- Target question mark -->
      <rect x="450" y="80" width="120" height="110" rx="24" fill="#ffffff" stroke="#c084fc" stroke-width="4" stroke-dasharray="8,6" />
      <text x="510" y="155" font-size="56" font-weight="900" font-family="'Fredoka', sans-serif" text-anchor="middle" fill="#c084fc">?</text>
    </svg>`;

    const coordsForOptions = getRowCoordinates(optionsList.length, ROW_COORDINATES);
    hotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        id: `hs_${l}_${idx}`,
        label: l,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex
      };
    });

    partHotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: l,
        isCircle: false,
        id: `hs_${l}_${idx}`
      };
    });

  } else if (skillId === 'lkg-english-letter-recognition-image-to-letter') {
    const allAssets = [
      ...fruits.map(item => ({ ...item, category: 'fruit' })),
      ...animals.map(item => ({ ...item, category: 'animal' })),
      ...things.map(item => ({ ...item, category: 'thing' })),
      ...vehicles.map(item => ({ ...item, category: 'vehicle' }))
    ];
    
    const assetIdx = Math.floor(r * allAssets.length);
    const asset = allAssets[assetIdx];
    const letter = asset.firstLetter.toUpperCase();
    
    const shuffled = shuffle(UPPER_ALPHABET, r);
    const distractorCount = effectiveDifficulty === 'easy' ? 1 : 2;
    const distractors = shuffled.filter(l => l !== letter).slice(0, distractorCount);
    
    optionsList = shuffle([letter, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(letter);
    
    questionText = `identify the Starting letter ${asset.singular.charAt(0).toUpperCase() + asset.singular.slice(1)}?`;
    explanation = `**${asset.singular.toUpperCase()}** starts with the letter **${letter}**.`;

    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffbeb" />
          <stop offset="100%" stop-color="#fef3c7" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
      
      <image href="${asset.imageUrl}" x="325" y="40" width="150" height="150" />
    </svg>`;

    const coordsForOptions = getRowCoordinates(optionsList.length, ROW_COORDINATES);
    hotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        id: `hs_${l}_${idx}`,
        label: l,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex,
        svgContent: getStyledLetterSvg(l, idx)
      };
    });

    partHotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: l,
        isCircle: false,
        id: `hs_${l}_${idx}`,
        svgContent: getStyledLetterSvg(l, idx)
      };
    });

  } else if (
    skillId === 'lkg-english-letter-recognition-audio-to-letter' ||
    skillId === 'lkg-english-letter-id-hear-lower'
  ) {
    const isUpper = skillId !== 'lkg-english-letter-id-hear-lower';
    const letterIdx = Math.floor(r * 26);
    const alphabet = isUpper ? UPPER_ALPHABET : LOWER_ALPHABET;
    const letter = alphabet[letterIdx];
    
    const shuffled = shuffle(alphabet, r);
    const distractorCount = effectiveDifficulty === 'easy' ? 1 : (effectiveDifficulty === 'medium' ? 2 : 3);
    const distractors = shuffled.filter(l => l !== letter).slice(0, distractorCount);
    
    optionsList = shuffle([letter, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(letter);
    
    questionText = "Listen to the letter. Which letter do you hear?";
    explanation = `The letter you heard is **${letter}**.`;
    soundUrl = `https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/phonics/${letter.toLowerCase()}.wav`;
    soundText = letter;

    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdf4ff" />
          <stop offset="100%" stop-color="#fae8ff" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
    </svg>`;

    const coordsForOptions = getRowCoordinates(optionsList.length, CENTER_ROW_COORDINATES);
    hotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        id: `hs_${l}_${idx}`,
        label: l,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex
      };
    });

    partHotspots = optionsList.map((l, idx) => {
      const coords = coordsForOptions[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: l,
        isCircle: false,
        id: `hs_${l}_${idx}`
      };
    });

  } else {
    // Odd one out / Case mix
    const mixType = r > 0.5 ? 'case' : 'letter';
    let target = '';
    let mainLetter = '';
    
    if (mixType === 'case') {
      const letterIdx = Math.floor(r * 26);
      const big = UPPER_ALPHABET[letterIdx];
      const small = LOWER_ALPHABET[letterIdx];
      
      const letterOptions = [big, big, big, small];
      optionsList = shuffle(letterOptions, r);
      correctAnswerIndex = optionsList.indexOf(small);
      target = small;
      mainLetter = big;
      explanation = `**${small}** is a lowercase (small) letter, while the others are uppercase (big) letters.`;
    } else {
      const pairIdx = Math.floor(r * CONFUSING_PAIRS.length);
      const pair = CONFUSING_PAIRS[pairIdx];
      const majority = pair[0];
      const minority = pair[1];
      
      const letterOptions = [majority, majority, majority, minority];
      optionsList = shuffle(letterOptions, r);
      correctAnswerIndex = optionsList.indexOf(minority);
      target = minority;
      mainLetter = majority;
      explanation = `**${minority}** is different from the other letters.`;
    }
    
    questionText = `Click on the letter that is different.`;
    
    backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff7ed" />
          <stop offset="100%" stop-color="#ffedd5" />
        </linearGradient>
      </defs>
      <rect width="800" height="465" fill="url(#bgGrad)" rx="28" />
    </svg>`;

    hotspots = optionsList.map((l, idx) => {
      const coords = CENTER_ROW_COORDINATES[idx];
      return {
        id: `hs_${l}_${idx}`,
        label: l,
        x: coords.pctX,
        y: coords.pctY,
        width: coords.pctW,
        height: coords.pctH,
        isCircle: false,
        isCorrect: idx === correctAnswerIndex
      };
    });

    partHotspots = optionsList.map((l, idx) => {
      const coords = CENTER_ROW_COORDINATES[idx];
      return {
        optionIndex: idx,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        label: l,
        isCircle: false,
        id: `hs_${l}_${idx}`
      };
    });
  }

  // Enrich hotspots with prebaked audio URLs
  const enrichedHotspots = hotspots.map(hs => ({
    ...hs,
    audioUrl: letterAudios[hs.label]
  }));
  
  const enrichedPartHotspots = partHotspots.map(phs => ({
    ...phs,
    audioUrl: letterAudios[phs.label]
  }));

  const audioUrl = letterAudios[questionText];

  return {
    id: `english_lkg_letter_recognition_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'all',
    explanation,
    soundUrl,
    soundText,
    options: optionsList.map((opt, idx) => {
      const label = typeof opt === 'object' ? (opt.label || opt.singular || opt.name) : opt;
      return { 
        id: `opt_${idx}`, 
        label,
        audioUrl: letterAudios[label]
      };
    }),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    hotspots: enrichedHotspots,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: enrichedPartHotspots,
        backgroundSvg
      }
    ]
  };
}


function generateWordRecognitionQuestion(skillId, seed, r, config = {}) {
  if (skillId === 'lkg-english-word-recognition-choose-two-same-words') {
    const targetWord = WORD_POOL[Math.floor(r * WORD_POOL.length)];
    const otherWords = WORD_POOL.filter(w => w !== targetWord);
    const distractor = otherWords[Math.floor(r * otherWords.length)];

    const optionsList = [
      { label: targetWord, isCorrect: true },
      { label: targetWord, isCorrect: true },
      { label: distractor, isCorrect: false }
    ];

    const shuffledOptions = shuffle(optionsList, r);
    const correctIndices = shuffledOptions
      .map((opt, idx) => (opt.isCorrect ? idx : null))
      .filter(idx => idx !== null);

    const questionText = 'Pick the two words that are the same.';

    return {
      id: `english_lkg_word_rec_same_words_${seed}`,
      type: 'mcq',
      interaction: 'multi_select',
      multiSelect: true,
      questionText,
      audioUrl: letterAudios[questionText] || undefined,
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `The two words that are the same are **${targetWord}** and **${targetWord}**.`,
      options: shuffledOptions.map((opt, idx) => ({
        id: `opt_${idx}`,
        label: opt.label,
        content: ruledLetterSvg(opt.label, 200, 140),
        audioUrl: letterAudios[opt.label] || letterAudios[opt.label.toLowerCase()] || undefined,
        isCorrect: opt.isCorrect
      })),
      correctAnswerIndex: correctIndices[0],
      correctAnswerIndices: correctIndices,
      answer: correctIndices,
      parts: [
        { type: 'text', content: questionText }
      ]
    };
  }

  if (skillId === 'lkg-english-word-recognition-same-ending-sound') {
    const families = Object.keys(ENDING_FAMILIES);
    const family = families[Math.floor(r * families.length)];
    const familyWords = ENDING_FAMILIES[family];

    // Pick 2 distinct words from the family
    const shuffledFamilyWords = shuffle(familyWords, r);
    const target1 = shuffledFamilyWords[0];
    const target2 = shuffledFamilyWords[1];

    // Pick a distractor from other families that doesn't match the ending
    const allDistractorWords = [];
    Object.entries(ENDING_FAMILIES).forEach(([f, words]) => {
      if (f !== family) {
        words.forEach(w => {
          if (!w.endsWith(family)) {
            allDistractorWords.push(w);
          }
        });
      }
    });
    const distractor = allDistractorWords[Math.floor(r * allDistractorWords.length)];

    const optionsList = [
      { label: target1, isCorrect: true },
      { label: target2, isCorrect: true },
      { label: distractor, isCorrect: false }
    ];

    const shuffledOptions = shuffle(optionsList, r);
    const correctIndices = shuffledOptions
      .map((opt, idx) => (opt.isCorrect ? idx : null))
      .filter(idx => idx !== null);

    const questionText = 'Listen to the sound. Which two words have that sound?';

    return {
      id: `english_lkg_word_rec_ending_sound_${seed}`,
      type: 'mcq',
      interaction: 'multi_select',
      multiSelect: true,
      questionText,
      audioUrl: letterAudios[questionText] || undefined,
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `**${target1}** and **${target2}** both end with the sound **/ ${family} /**.`,
      soundText: family,
      soundUrl: letterAudios[family] || undefined,
      options: shuffledOptions.map((opt, idx) => ({
        id: `opt_${idx}`,
        label: opt.label,
        content: ruledLetterSvg(opt.label, 200, 140),
        audioUrl: letterAudios[opt.label] || letterAudios[opt.label.toLowerCase()] || undefined,
        isCorrect: opt.isCorrect
      })),
      correctAnswerIndex: correctIndices[0],
      correctAnswerIndices: correctIndices,
      answer: correctIndices,
      parts: [
        { type: 'text', content: questionText }
      ]
    };
  }

  if (skillId === 'lkg-english-word-recognition-find-word-in-sentence') {
    const item = SENTENCES_POOL[Math.floor(r * SENTENCES_POOL.length)];
    const sentence = item.sentence;
    const target = item.target;

    // Split sentence into words and clean them for the cards
    const rawWords = sentence.split(/\s+/);
    const cleanedWords = rawWords.map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ''));

    // Find the correct index
    const correctAnswerIndex = cleanedWords.findIndex(
      w => w.toLowerCase() === target.toLowerCase()
    );

    // Image for the target word
    const targetImg = WORD_IMAGES[target.toLowerCase()] || 'https://cdn-icons-png.flaticon.com/512/2926/2926214.png';

    const questionText = `Listen to the sentence. Then, find the word ${target} in the sentence.`;
    const speechText = `Listen to the sentence. Then, find the word ${target} in the sentence. ${sentence}`;

    return {
      id: `english_lkg_word_rec_find_word_${seed}`,
      type: 'mcq',
      interaction: 'choice',
      questionText,
      audioUrl: letterAudios[speechText] || letterAudios[questionText] || undefined,
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `**${target}** is in the sentence: **${sentence}**.`,
      options: cleanedWords.map((word, idx) => ({
        id: `opt_${idx}`,
        label: word,
        content: ruledLetterSvg(word, 200, 140),
        audioUrl: letterAudios[word.toLowerCase()] || letterAudios[word] || undefined,
        isCorrect: idx === correctAnswerIndex
      })),
      correctAnswerIndex,
      answer: correctAnswerIndex,
      parts: [
        {
          type: 'text',
          content: `Listen to the sentence. Then, find the word [img:${targetImg}] in the sentence.[speak:${sentence}]`
        }
      ],
      speakTextValue: speechText
    };
  }

  return null;
}

function generateRhymingQuestion(skillId, seed, r) {
  const extendedEndingFamilies = {
    ...ENDING_FAMILIES,
    'et': ['pet', 'net', 'wet', 'jet', 'bet', 'get', 'let'],
    'ill': ['fill', 'hill', 'bill', 'mill', 'pill', 'will'],
    'op': ['pop', 'hop', 'mop', 'top', 'cop']
  };

  const families = Object.keys(extendedEndingFamilies);
  const family = families[Math.floor(r * families.length)];
  const familyWords = extendedEndingFamilies[family];

  // Pick target words from the family
  const shuffledFamilyWords = shuffle(familyWords, r);

  if (skillId === 'lkg-english-rhyming-same-ending-single') {
    const target = shuffledFamilyWords[0];

    // Pick 1 distractor from other families
    const allDistractorWords = [];
    Object.entries(extendedEndingFamilies).forEach(([f, words]) => {
      if (f !== family) {
        words.forEach(w => {
          if (!w.endsWith(family)) {
            allDistractorWords.push(w);
          }
        });
      }
    });
    const distractor = allDistractorWords[Math.floor(r * allDistractorWords.length)];

    const optionsList = [
      { label: target, isCorrect: true },
      { label: distractor, isCorrect: false }
    ];

    const shuffledOptions = shuffle(optionsList, r);
    const correctAnswerIndex = shuffledOptions.findIndex(opt => opt.isCorrect);

    const questionText = 'Listen to the sound. Which word has that sound?';

    return {
      id: `english_lkg_rhyming_single_${seed}`,
      type: 'mcq',
      interaction: 'choice',
      questionText,
      audioUrl: letterAudios[questionText] || undefined,
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `**${target}** ends with the sound **/ ${family} /**.`,
      soundText: family,
      soundUrl: letterAudios[family] || undefined,
      options: shuffledOptions.map((opt, idx) => ({
        id: `opt_${idx}`,
        label: opt.label,
        content: ruledLetterSvg(opt.label, 200, 140),
        audioUrl: letterAudios[opt.label] || letterAudios[opt.label.toLowerCase()] || undefined,
        isCorrect: opt.isCorrect
      })),
      correctAnswerIndex,
      answer: correctAnswerIndex,
      parts: [
        { type: 'text', content: questionText },
        { type: 'play_sound_card' }
      ]
    };
  }

  if (skillId === 'lkg-english-rhyming-same-ending-double') {
    const target1 = shuffledFamilyWords[0];
    const target2 = shuffledFamilyWords[1];

    // Pick 1 distractor from other families
    const allDistractorWords = [];
    Object.entries(extendedEndingFamilies).forEach(([f, words]) => {
      if (f !== family) {
        words.forEach(w => {
          if (!w.endsWith(family)) {
            allDistractorWords.push(w);
          }
        });
      }
    });
    const distractor = allDistractorWords[Math.floor(r * allDistractorWords.length)];

    const optionsList = [
      { label: target1, isCorrect: true },
      { label: target2, isCorrect: true },
      { label: distractor, isCorrect: false }
    ];

    const shuffledOptions = shuffle(optionsList, r);
    const correctIndices = shuffledOptions
      .map((opt, idx) => (opt.isCorrect ? idx : null))
      .filter(idx => idx !== null);

    const questionText = 'Listen to the sound. Which two words have that sound?';

    return {
      id: `english_lkg_rhyming_double_${seed}`,
      type: 'mcq',
      interaction: 'multi_select',
      multiSelect: true,
      questionText,
      audioUrl: letterAudios[questionText] || undefined,
      voice: 'Kore',
      generateAudio: 'all',
      explanation: `**${target1}** and **${target2}** both end with the sound **/ ${family} /**.`,
      soundText: family,
      soundUrl: letterAudios[family] || undefined,
      options: shuffledOptions.map((opt, idx) => ({
        id: `opt_${idx}`,
        label: opt.label,
        content: ruledLetterSvg(opt.label, 200, 140),
        audioUrl: letterAudios[opt.label] || letterAudios[opt.label.toLowerCase()] || undefined,
        isCorrect: opt.isCorrect
      })),
      correctAnswerIndex: correctIndices[0],
      correctAnswerIndices: correctIndices,
      answer: correctIndices,
      parts: [
        { type: 'text', content: questionText },
        { type: 'play_sound_card' }
      ]
    };
  }
  return null;
}

function generateColorIdentificationQuestion(seed, r) {
  // Combine all assets and filter for those that have a defined color
  const allAssets = [
    ...fruits.map(item => ({ ...item, category: 'fruit' })),
    ...animals.map(item => ({ ...item, category: 'animal' })),
    ...things.map(item => ({ ...item, category: 'thing' })),
    ...vehicles.map(item => ({ ...item, category: 'vehicle' }))
  ].filter(item => item.color);

  // Group assets by color
  const colorMap = {};
  allAssets.forEach(item => {
    if (!colorMap[item.color]) {
      colorMap[item.color] = [];
    }
    colorMap[item.color].push(item);
  });

  const availableColors = Object.keys(colorMap);

  // Pick a target color
  const targetColorIdx = Math.floor(r * availableColors.length);
  const targetColor = availableColors[targetColorIdx];
  const targetColorItems = colorMap[targetColor];

  // Pick correct item
  const correctItem = targetColorItems[Math.floor(r * targetColorItems.length)];

  // Pick 3 distractors from different colors
  const otherColors = availableColors.filter(c => c !== targetColor);
  const shuffledOtherColors = shuffle(otherColors, r);

  const selectedDistractors = [];
  for (let i = 0; i < 3 && i < shuffledOtherColors.length; i++) {
    const colorGroup = colorMap[shuffledOtherColors[i]];
    const distractorItem = colorGroup[Math.floor(r * colorGroup.length)];
    selectedDistractors.push(distractorItem);
  }

  // Combine options
  const rawOptions = [correctItem, ...selectedDistractors];
  const optionsList = shuffle(rawOptions, r);
  const correctAnswerIndex = optionsList.findIndex(opt => opt.name === correctItem.name);

  // Format hotspots
  const hotspots = optionsList.map((opt, idx) => {
    const coords = GRID_COORDINATES[idx];
    return {
      id: `hs_${opt.name}_${idx}`,
      label: opt.singular,
      x: coords.pctX,
      y: coords.pctY,
      width: coords.pctW,
      height: coords.pctH,
      isCircle: false,
      isCorrect: idx === correctAnswerIndex,
      imageUrl: opt.imageUrl,
      audioUrl: letterAudios[opt.singular]
    };
  });

  const partHotspots = optionsList.map((opt, idx) => {
    const coords = GRID_COORDINATES[idx];
    return {
      optionIndex: idx,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      label: opt.singular,
      isCircle: false,
      imageUrl: opt.imageUrl,
      id: `hs_${opt.name}_${idx}`,
      audioUrl: letterAudios[opt.singular]
    };
  });

  const gradient = PASTEL_GRADIENTS[Math.floor(r * PASTEL_GRADIENTS.length)];
  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}</defs>
  <rect width="800" height="465" fill="url(#bgGrad)" rx="20" />
</svg>`;

  const questionText = `Click on the object that is **${targetColor}**.`;
  const audioUrl = letterAudios[questionText];

  return {
    id: `english_lkg_color_identification_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'all',
    explanation: `The **${correctItem.singular}** is **${targetColor}**.`,
    options: optionsList.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.singular,
      audioUrl: letterAudios[opt.singular]
    })),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    hotspots,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg
      }
    ]
  };
}

function getThickLinePath(x1, y1, x2, y2, id, thickness = 30, fill = '#4f46e5') {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return '';
  
  const ux = -dy / len;
  const uy = dx / len;
  
  const r = thickness / 2;
  
  const ax = x1 + ux * r;
  const ay = y1 + uy * r;
  const bx = x1 - ux * r;
  const by = y1 - uy * r;
  const cx = x2 - ux * r;
  const cy = y2 - uy * r;
  const dx2 = x2 + ux * r;
  const dy2 = y2 + uy * r;
  
  const idAttr = id ? `id="${id}"` : '';
  const cursorAttr = id ? 'cursor="pointer"' : '';
  
  return `<path ${idAttr} d="M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${dx2.toFixed(1)} ${dy2.toFixed(1)} A ${r} ${r} 0 0 1 ${cx.toFixed(1)} ${cy.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} A ${r} ${r} 0 0 1 ${ax.toFixed(1)} ${ay.toFixed(1)} Z" fill="${fill}" ${cursorAttr} />`;
}

function getThickArcPath(cx, cy, radius, startAngleDeg, endAngleDeg, id, thickness = 30, fill = '#4f46e5') {
  const a1 = (startAngleDeg * Math.PI) / 180;
  const a2 = (endAngleDeg * Math.PI) / 180;
  
  const R = radius + thickness / 2;
  const r_in = radius - thickness / 2;
  const capR = thickness / 2;
  
  const x_os = cx + R * Math.cos(a1);
  const y_os = cy + R * Math.sin(a1);
  const x_oe = cx + R * Math.cos(a2);
  const y_oe = cy + R * Math.sin(a2);
  
  const x_ie = cx + r_in * Math.cos(a2);
  const y_ie = cy + r_in * Math.sin(a2);
  const x_is = cx + r_in * Math.cos(a1);
  const y_is = cy + r_in * Math.sin(a1);
  
  const largeArc = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
  
  const idAttr = id ? `id="${id}"` : '';
  const cursorAttr = id ? 'cursor="pointer"' : '';
  
  return `<path ${idAttr} d="M ${x_os.toFixed(1)} ${y_os.toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 ${largeArc} 1 ${x_oe.toFixed(1)} ${y_oe.toFixed(1)} A ${capR} ${capR} 0 0 1 ${x_ie.toFixed(1)} ${y_ie.toFixed(1)} A ${r_in.toFixed(1)} ${r_in.toFixed(1)} 0 ${largeArc} 0 ${x_is.toFixed(1)} ${y_is.toFixed(1)} A ${capR} ${capR} 0 0 1 ${x_os.toFixed(1)} ${y_os.toFixed(1)} Z" fill="${fill}" ${cursorAttr} />`;
}

function getStrokeBoundingBox(stroke, thickness = 30) {
  const pad = thickness / 2;
  if (stroke.shape === 'line') {
    const minX = Math.min(stroke.x1, stroke.x2) - pad;
    const maxX = Math.max(stroke.x1, stroke.x2) + pad;
    const minY = Math.min(stroke.y1, stroke.y2) - pad;
    const maxY = Math.max(stroke.y1, stroke.y2) + pad;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  } else if (stroke.shape === 'arc') {
    const pointsX = [];
    const pointsY = [];
    const aStart = (stroke.startAngle * Math.PI) / 180;
    const aEnd = (stroke.endAngle * Math.PI) / 180;
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const angle = aStart + (aEnd - aStart) * (i / steps);
      const r_out = stroke.radius + pad;
      const r_in = stroke.radius - pad;
      pointsX.push(stroke.cx + r_out * Math.cos(angle));
      pointsY.push(stroke.cy + r_out * Math.sin(angle));
      pointsX.push(stroke.cx + r_in * Math.cos(angle));
      pointsY.push(stroke.cy + r_in * Math.sin(angle));
    }
    const minX = Math.min(...pointsX);
    const maxX = Math.max(...pointsX);
    const minY = Math.min(...pointsY);
    const maxY = Math.max(...pointsY);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  return { x: 0, y: 0, w: 100, h: 100 };
}

const LETTER_LINES_CONFIG = {
  A: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 400, y1: 112.5, x2: 320, y2: 352.5, type: 'slanting', name: 'left slanting line' },
      { id: 'opt_1', shape: 'line', x1: 400, y1: 112.5, x2: 480, y2: 352.5, type: 'slanting', name: 'right slanting line' },
      { id: 'opt_2', shape: 'line', x1: 345, y1: 252.5, x2: 455, y2: 252.5, type: 'sleeping', name: 'middle sleeping line' }
    ]
  },
  B: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'arc', cx: 320, cy: 172.5, radius: 60, startAngle: -90, endAngle: 90, type: 'curved', name: 'top curved loop' },
      { id: 'opt_2', shape: 'arc', cx: 320, cy: 292.5, radius: 60, startAngle: -90, endAngle: 90, type: 'curved', name: 'bottom curved loop' }
    ]
  },
  C: {
    strokes: [
      { id: 'opt_0', shape: 'arc', cx: 400, cy: 232.5, radius: 100, startAngle: 45, endAngle: 315, type: 'curved', name: 'curved line' }
    ]
  },
  D: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'arc', cx: 320, cy: 232.5, radius: 120, startAngle: -90, endAngle: 90, type: 'curved', name: 'curved loop' }
    ]
  },
  E: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'line', x1: 320, y1: 112.5, x2: 460, y2: 112.5, type: 'sleeping', name: 'top sleeping line' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 232.5, x2: 420, y2: 232.5, type: 'sleeping', name: 'middle sleeping line' },
      { id: 'opt_3', shape: 'line', x1: 320, y1: 352.5, x2: 460, y2: 352.5, type: 'sleeping', name: 'bottom sleeping line' }
    ]
  },
  F: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'line', x1: 320, y1: 112.5, x2: 460, y2: 112.5, type: 'sleeping', name: 'top sleeping line' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 232.5, x2: 420, y2: 232.5, type: 'sleeping', name: 'middle sleeping line' }
    ]
  },
  G: {
    strokes: [
      { id: 'opt_0', shape: 'arc', cx: 400, cy: 232.5, radius: 100, startAngle: 45, endAngle: 360, type: 'curved', name: 'curved line' },
      { id: 'opt_1', shape: 'line', x1: 400, y1: 232.5, x2: 480, y2: 232.5, type: 'sleeping', name: 'middle sleeping line' },
      { id: 'opt_2', shape: 'line', x1: 480, y1: 232.5, x2: 480, y2: 292.5, type: 'standing', name: 'small standing line' }
    ]
  },
  H: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'left standing line' },
      { id: 'opt_1', shape: 'line', x1: 480, y1: 112.5, x2: 480, y2: 352.5, type: 'standing', name: 'right standing line' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 232.5, x2: 480, y2: 232.5, type: 'sleeping', name: 'middle sleeping line' }
    ]
  },
  I: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 480, y2: 112.5, type: 'sleeping', name: 'top sleeping line' },
      { id: 'opt_1', shape: 'line', x1: 400, y1: 112.5, x2: 400, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 352.5, x2: 480, y2: 352.5, type: 'sleeping', name: 'bottom sleeping line' }
    ]
  },
  J: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 440, y1: 112.5, x2: 440, y2: 292.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'arc', cx: 380, cy: 292.5, radius: 60, startAngle: 0, endAngle: 180, type: 'curved', name: 'bottom curved hook' }
    ]
  },
  K: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'line', x1: 320, y1: 232.5, x2: 460, y2: 112.5, type: 'slanting', name: 'upper slanting line' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 232.5, x2: 460, y2: 352.5, type: 'slanting', name: 'lower slanting line' }
    ]
  },
  L: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'line', x1: 320, y1: 352.5, x2: 460, y2: 352.5, type: 'sleeping', name: 'bottom sleeping line' }
    ]
  },
  M: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'left standing line' },
      { id: 'opt_1', shape: 'line', x1: 320, y1: 112.5, x2: 400, y2: 272.5, type: 'slanting', name: 'left slanting line' },
      { id: 'opt_2', shape: 'line', x1: 480, y1: 112.5, x2: 400, y2: 272.5, type: 'slanting', name: 'right slanting line' },
      { id: 'opt_3', shape: 'line', x1: 480, y1: 112.5, x2: 480, y2: 352.5, type: 'standing', name: 'right standing line' }
    ]
  },
  N: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'left standing line' },
      { id: 'opt_1', shape: 'line', x1: 320, y1: 112.5, x2: 480, y2: 352.5, type: 'slanting', name: 'diagonal slanting line' },
      { id: 'opt_2', shape: 'line', x1: 480, y1: 112.5, x2: 480, y2: 352.5, type: 'standing', name: 'right standing line' }
    ]
  },
  O: {
    strokes: [
      { id: 'opt_0', shape: 'arc', cx: 400, cy: 232.5, radius: 100, startAngle: 90, endAngle: 270, type: 'curved', name: 'left curved half' },
      { id: 'opt_1', shape: 'arc', cx: 400, cy: 232.5, radius: 100, startAngle: -90, endAngle: 90, type: 'curved', name: 'right curved half' }
    ]
  },
  P: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'arc', cx: 320, cy: 172.5, radius: 60, startAngle: -90, endAngle: 90, type: 'curved', name: 'curved loop' }
    ]
  },
  R: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 352.5, type: 'standing', name: 'standing line' },
      { id: 'opt_1', shape: 'arc', cx: 320, cy: 172.5, radius: 60, startAngle: -90, endAngle: 90, type: 'curved', name: 'curved loop' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 232.5, x2: 460, y2: 352.5, type: 'slanting', name: 'lower slanting line' }
    ]
  },
  S: {
    strokes: [
      { id: 'opt_0', shape: 'arc', cx: 400, cy: 172.5, radius: 60, startAngle: 90, endAngle: 360, type: 'curved', name: 'top curved half' },
      { id: 'opt_1', shape: 'arc', cx: 400, cy: 292.5, radius: 60, startAngle: -180, endAngle: 90, type: 'curved', name: 'bottom curved half' }
    ]
  },
  T: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 300, y1: 112.5, x2: 500, y2: 112.5, type: 'sleeping', name: 'top sleeping line' },
      { id: 'opt_1', shape: 'line', x1: 400, y1: 112.5, x2: 400, y2: 352.5, type: 'standing', name: 'standing line' }
    ]
  },
  U: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 320, y2: 272.5, type: 'standing', name: 'left standing line' },
      { id: 'opt_1', shape: 'line', x1: 480, y1: 112.5, x2: 480, y2: 272.5, type: 'standing', name: 'right standing line' },
      { id: 'opt_2', shape: 'arc', cx: 400, cy: 272.5, radius: 80, startAngle: 0, endAngle: 180, type: 'curved', name: 'bottom curve' }
    ]
  },
  V: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 400, y2: 352.5, type: 'slanting', name: 'left slanting line' },
      { id: 'opt_1', shape: 'line', x1: 480, y1: 112.5, x2: 400, y2: 352.5, type: 'slanting', name: 'right slanting line' }
    ]
  },
  W: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 300, y1: 112.5, x2: 350, y2: 352.5, type: 'slanting', name: 'outer left slanting' },
      { id: 'opt_1', shape: 'line', x1: 400, y1: 232.5, x2: 350, y2: 352.5, type: 'slanting', name: 'inner left slanting' },
      { id: 'opt_2', shape: 'line', x1: 400, y1: 232.5, x2: 450, y2: 352.5, type: 'slanting', name: 'inner right slanting' },
      { id: 'opt_3', shape: 'line', x1: 500, y1: 112.5, x2: 450, y2: 352.5, type: 'slanting', name: 'outer right slanting' }
    ]
  },
  X: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 480, y2: 352.5, type: 'slanting', name: 'diagonal slanting line' },
      { id: 'opt_1', shape: 'line', x1: 480, y1: 112.5, x2: 320, y2: 352.5, type: 'slanting', name: 'diagonal slanting line' }
    ]
  },
  Y: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 400, y2: 232.5, type: 'slanting', name: 'left upper slanting line' },
      { id: 'opt_1', shape: 'line', x1: 480, y1: 112.5, x2: 400, y2: 232.5, type: 'slanting', name: 'right upper slanting line' },
      { id: 'opt_2', shape: 'line', x1: 400, y1: 232.5, x2: 400, y2: 352.5, type: 'standing', name: 'bottom standing line' }
    ]
  },
  Z: {
    strokes: [
      { id: 'opt_0', shape: 'line', x1: 320, y1: 112.5, x2: 480, y2: 112.5, type: 'sleeping', name: 'top sleeping line' },
      { id: 'opt_1', shape: 'line', x1: 480, y1: 112.5, x2: 320, y2: 352.5, type: 'slanting', name: 'diagonal slanting line' },
      { id: 'opt_2', shape: 'line', x1: 320, y1: 352.5, x2: 480, y2: 352.5, type: 'sleeping', name: 'bottom sleeping line' }
    ]
  }
};

function generateLetterLinesQuestion(skillId, seed, r) {
  let targetType;
  let letter;
  let cfg;

  if (skillId.endsWith('-combination')) {
    // Combination letters must have both curved strokes and straight (standing/sleeping/slanting) strokes
    const combinationLetters = Object.keys(LETTER_LINES_CONFIG).filter(l => {
      const strokes = LETTER_LINES_CONFIG[l].strokes;
      const hasCurved = strokes.some(s => s.type === 'curved');
      const hasStraight = strokes.some(s => s.type === 'standing' || s.type === 'sleeping' || s.type === 'slanting');
      return hasCurved && hasStraight;
    });

    letter = combinationLetters[Math.floor(r * combinationLetters.length)];
    cfg = LETTER_LINES_CONFIG[letter];

    // Get the available stroke types in this specific combination letter
    const strokeTypes = [...new Set(cfg.strokes.map(s => s.type))];
    const r2 = seededRandom(seed + 1);
    targetType = strokeTypes[Math.floor(r2 * strokeTypes.length)];
  } else {
    targetType = skillId.endsWith('-standing') ? 'standing' : 
                 skillId.endsWith('-sleeping') ? 'sleeping' :
                 skillId.endsWith('-slanting') ? 'slanting' : 'curved';

    // Filter letters that have at least one stroke of targetType
    const letters = Object.keys(LETTER_LINES_CONFIG).filter(l => 
      LETTER_LINES_CONFIG[l].strokes.some(s => s.type === targetType)
    );

    letter = letters[Math.floor(r * letters.length)];
    cfg = LETTER_LINES_CONFIG[letter];
  }

  const options = cfg.strokes.map((stroke, idx) => ({
    id: stroke.id,
    label: stroke.name,
    isCorrect: stroke.type === targetType
  }));

  const hotspots = cfg.strokes.map((stroke, idx) => {
    const bbox = getStrokeBoundingBox(stroke, 30);
    return {
      id: `hs_${stroke.id}`,
      label: stroke.name,
      x: (bbox.x / 800) * 100,
      y: (bbox.y / 465) * 100,
      width: (bbox.w / 800) * 100,
      height: (bbox.h / 465) * 100,
      isCircle: false,
      isCorrect: stroke.type === targetType,
      optionIndex: idx
    };
  });

  const partHotspots = cfg.strokes.map((stroke, idx) => {
    const bbox = getStrokeBoundingBox(stroke, 30);
    return {
      optionIndex: idx,
      x: bbox.x,
      y: bbox.y,
      width: bbox.w,
      height: bbox.h,
      label: stroke.name,
      isCircle: false,
      id: `hs_${stroke.id}`
    };
  });

  let lineTypeName = 'standing';
  let lineDesc = 'go straight up and down (vertical).';
  if (targetType === 'sleeping') {
    lineTypeName = 'sleeping';
    lineDesc = 'go straight across (horizontal).';
  } else if (targetType === 'slanting') {
    lineTypeName = 'slanting';
    lineDesc = 'go at a slant (diagonal / or \\).';
  } else if (targetType === 'curved') {
    lineTypeName = 'curved';
    lineDesc = 'are round or curved (◡).';
  }

  const questionText = `Click on all the **${lineTypeName} lines** in the letter **${letter}**.`;

  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:2px solid #e2e8f0; border-radius:24px;">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#faf5ff" />
        <stop offset="100%" stop-color="#eff6ff" />
      </linearGradient>
    </defs>
    <rect width="800" height="465" fill="url(#bgGrad)" rx="24" />

    <!-- Guidelines -->
    <line x1="60" y1="112.5" x2="740" y2="112.5" stroke="#fecaca" stroke-width="2" />
    <line x1="60" y1="192.5" x2="740" y2="192.5" stroke="#93c5fd" stroke-dasharray="6,4" stroke-width="1.5" />
    <line x1="60" y1="272.5" x2="740" y2="272.5" stroke="#93c5fd" stroke-dasharray="6,4" stroke-width="1.5" />
    <line x1="60" y1="352.5" x2="740" y2="352.5" stroke="#fecaca" stroke-width="2" />
    
    <!-- Guidelines labels -->
    <text x="50" y="117.5" font-family="'Outfit', sans-serif" font-size="12" fill="#ef4444" text-anchor="end">top line</text>
    <text x="50" y="357.5" font-family="'Outfit', sans-serif" font-size="12" fill="#ef4444" text-anchor="end">base line</text>
    
    <!-- Background Letter Template (Light grey outline) -->
    ${cfg.strokes.map(stroke => {
      if (stroke.shape === 'line') {
        return getThickLinePath(stroke.x1, stroke.y1, stroke.x2, stroke.y2, '', 30, '#e2e8f0');
      } else {
        return getThickArcPath(stroke.cx, stroke.cy, stroke.radius, stroke.startAngle, stroke.endAngle, '', 30, '#e2e8f0');
      }
    }).join('\n')}
    
    <!-- Interactive Stroke Shapes -->
    ${cfg.strokes.map((stroke, sidx) => {
      const id = `opt_${sidx}`;
      if (stroke.shape === 'line') {
        return getThickLinePath(stroke.x1, stroke.y1, stroke.x2, stroke.y2, id, 30, '#4f46e5');
      } else {
        return getThickArcPath(stroke.cx, stroke.cy, stroke.radius, stroke.startAngle, stroke.endAngle, id, 30, '#4f46e5');
      }
    }).join('\n')}
  </svg>`;

  const correctCount = cfg.strokes.filter(s => s.type === targetType).length;

  const explanation = `The letter **${letter}** has **${correctCount}** ${lineTypeName} line${correctCount > 1 ? 's' : ''}.
  
- **${lineTypeName.charAt(0).toUpperCase() + lineTypeName.slice(1)} lines** ${lineDesc}

Look at the highlighted green lines to see the correct ${lineTypeName} line${correctCount > 1 ? 's' : ''}!`;

  const audioUrl = letterAudios[questionText] || undefined;

  const correctIndices = cfg.strokes
    .map((s, idx) => (s.type === targetType ? idx : null))
    .filter(idx => idx !== null);

  return {
    id: `english_lkg_letter_lines_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_multi_select',
    layoutMode: 'mcq_hotspot',
    hideHotspotText: true,
    invisibleHotspots: true,
    questionText,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'all',
    explanation,
    options,
    correctAnswerIndex: correctIndices[0] ?? 0,
    correctAnswerIndices: correctIndices,
    answer: correctIndices,
    hotspots,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg,
        hideHotspotText: true,
        invisibleHotspots: true
      }
    ]
  };
}


const PHONICS_WORDS = {
  'lkg-english-phonics-short-a': [
    "cat","bat","hat","mat","rat","sat","pat","fat","vat","chat",
    "pan","fan","man","can","ran","tan","van","jam","ham","yam",
    "map","tap","cap","lap","nap","sap","gap","rap","zap","clap",
    "bag","tag","rag","wag","lag","nag","sag","flag","drag","brag",
    "dad","mad","sad","bad","pad","glad","had","lad","fad","rad",
    "cab","dab","jab","lab","nab","tab","grab","crab","slab","scab",
    "bat","chat","flat","gnat","that","spat","brat","drat","splat","sat",
    "ash","dash","lash","mash","rash","cash","flash","trash","crash","smash",
    "and","band","hand","land","sand","stand","grand","brand","planned","strand",
    "ank","bank","tank","rank","thank","blank","crank","plank","spank","shank"
  ],

  'lkg-english-phonics-short-e': [
    "bed","red","fed","led","wed","shed","thread","spread","bled","sled",
    "pen","hen","ten","men","den","Ben","Ken","then","when","wren",
    "net","pet","wet","jet","vet","get","set","let","met","bet",
    "peg","leg","beg","keg","egg","meg","Greg","fled","sled","wed",
    "web","deb","gem","hem","them","stem","step","kept","wept","slept",
    "bell","sell","tell","well","fell","yell","shell","smell","spell","dwell",
    "neck","deck","peck","check","wreck","speck","fleck","trek","crept","step",
    "red","shed","bled","sled","thread","spread","bread","dread","tread","stead",
    "nest","best","rest","test","west","pest","chest","quest","zest","jest",
    "end","bend","lend","send","tend","spend","blend","friend","trend","mend"
  ],

  'lkg-english-phonics-short-i': [
    "pin","bin","tin","win","fin","chin","skin","spin","grin","thin",
    "sit","fit","hit","bit","kit","lit","pit","wit","split","quit",
    "pig","big","dig","fig","wig","jig","twig","rig","gig","sprig",
    "lip","sip","rip","tip","dip","hip","nip","zip","clip","slip",
    "kid","lid","hid","did","bid","rid","skid","grid","mid","quid",
    "fish","dish","wish","swish","finish","trick","brick","stick","click","flick",
    "hill","fill","bill","pill","mill","drill","spill","still","grill","skill",
    "kick","lick","pick","tick","sick","quick","thick","brick","stick","trick",
    "ring","sing","wing","king","bring","swing","thing","sting","cling","spring",
    "ink","pink","sink","wink","blink","drink","think","stink","rink","link"
  ],

  'lkg-english-phonics-short-o': [
    "dog","fog","hog","log","jog","bog","frog","clog","smog","tog",
    "pot","hot","cot","dot","lot","not","got","shot","spot","plot",
    "mop","top","hop","pop","cop","shop","drop","stop","flop","crop",
    "box","fox","pox","ox","rocks","socks","clock","block","shock","stock",
    "rod","cod","nod","pod","sod","trod","prod","plod","odd","god",
    "sob","mob","cob","job","rob","blob","glob","throb","snob","knob",
    "rock","sock","dock","lock","mock","clock","block","shock","stock","flock",
    "pond","bond","fond","beyond","blond","frond","wand","yawn","spawn","strong",
    "cross","loss","boss","moss","toss","gloss","frost","cost","post","most",
    "song","long","gong","strong","wrong","throng","along","belong","prong","pong"
  ],

  'lkg-english-phonics-short-u': [
    "cup","pup","sup","up","shut","strut","cut","hut","nut","gut",
    "sun","fun","run","bun","gun","nun","stun","spun","shun","done",
    "bus","bug","mug","rug","hug","jug","dug","plug","slug","shrug",
    "mud","bud","thud","stud","flood","blood","crud","spud","dud","scud",
    "tub","rub","cub","sub","stub","club","scrub","snub","grub","pub",
    "hum","gum","sum","drum","plum","thumb","crumb","strum","slum","glum",
    "duck","luck","truck","stuck","pluck","snuck","cluck","muck","buck","tuck",
    "jump","bump","hump","dump","pump","stump","thump","lump","grump","trump",
    "must","dust","rust","trust","crust","gust","just","plus","thus","fuss",
    "under","thunder","wonder","blunder","number","runner","summer","butter","puppy","sunny"
  ]
};


function generatePhonicsVowelsQuestion(skillId, seed, r) {
  const category = skillId.replace('lkg-english-phonics-', ''); // e.g. short-a
  const words = PHONICS_WORDS[skillId];
  if (!words) {
    console.warn(`No words found for skill: ${skillId}`);
    return null;
  }

  // Pick a random target word
  const targetWord = words[Math.floor(r * words.length)];

  // Get other words from this group to act as distractors
  const otherWords = words.filter(w => w !== targetWord);
  
  // Also collect words from other groups
  const allOtherWords = [];
  Object.keys(PHONICS_WORDS).forEach(k => {
    if (k !== skillId) {
      allOtherWords.push(...PHONICS_WORDS[k]);
    }
  });

  // Pick 3 distractors:
  // - 1 or 2 from the same vowel category (for close spelling/sound match)
  // - 1 or 2 from other categories (for vowel sound contrast)
  const categoryDistractors = shuffle(otherWords, r);
  const otherDistractors = shuffle(allOtherWords.filter(w => w !== targetWord), r);

  const selectedDistractors = [];
  if (categoryDistractors.length > 0) {
    selectedDistractors.push(categoryDistractors[0]);
  }
  if (categoryDistractors.length > 1) {
    selectedDistractors.push(categoryDistractors[1]);
  }
  while (selectedDistractors.length < 3 && otherDistractors.length > 0) {
    const d = otherDistractors.shift();
    if (!selectedDistractors.includes(d)) {
      selectedDistractors.push(d);
    }
  }

  // Combine and shuffle options
  const rawOptions = [targetWord, ...selectedDistractors.slice(0, 3)];
  const optionsList = shuffle(rawOptions, r);
  const correctAnswerIndex = optionsList.findIndex(w => w === targetWord);

  const questionText = "Listen to the word. Which word do you hear?";
  const audioUrl = `https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/phonics/${category}-${targetWord.toLowerCase()}.wav`;

  return {
    id: `english_lkg_phonics_vowels_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'choice',
    questionText,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'none',
    explanation: `The word you hear is **${targetWord}**.`,
    options: optionsList.map((w, i) => {
      let optCategory = 'short-a';
      Object.keys(PHONICS_WORDS).forEach(k => {
        if (PHONICS_WORDS[k].includes(w)) {
          optCategory = k.replace('lkg-english-phonics-', '');
        }
      });
      const optAudioUrl = `https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/phonics/${optCategory}-${w.toLowerCase()}.wav`;

      return {
        id: `opt_${i}`,
        label: w,
        content: ruledLetterSvg(w, 200, 140),
        audioUrl: optAudioUrl
      };
    }),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    metadata: {
      chapterId: 'english-lkg-phonics',
      chapterTitle: 'Phonics'
    },
    parts: [
      { type: 'text', content: questionText }
    ]
  };
}

function generatePhonicsImagesQuestion(skillId, seed, r) {
  const category = skillId.replace('lkg-english-phonics-image-', ''); // e.g. short-a
  const categoryImages = phonicsImages[category];
  if (!categoryImages || categoryImages.length === 0) {
    console.warn(`No images found for category: ${category}`);
    return null;
  }

  // Pick a random target image
  const targetAsset = categoryImages[Math.floor(r * categoryImages.length)];

  // Gather distractors from other categories
  const otherAssets = [];
  Object.keys(phonicsImages).forEach(cat => {
    if (cat !== category) {
      otherAssets.push(...phonicsImages[cat]);
    }
  });

  // Filter out any distractors that have the same word as the target to avoid ambiguity
  const filteredOtherAssets = otherAssets.filter(item => item.word !== targetAsset.word);

  // Pick 3 distractors randomly
  const shuffledDistractors = shuffle(filteredOtherAssets, r);
  const distractors = [];
  shuffledDistractors.forEach(item => {
    if (distractors.length < 3 && !distractors.some(d => d.word === item.word)) {
      distractors.push(item);
    }
  });

  // If not enough distractors, fallback to target category assets
  if (distractors.length < 3) {
    const categoryFallback = categoryImages.filter(item => item.word !== targetAsset.word);
    const shuffledFallback = shuffle(categoryFallback, r);
    shuffledFallback.forEach(item => {
      if (distractors.length < 3 && !distractors.some(d => d.word === item.word)) {
        distractors.push(item);
      }
    });
  }

  // Combine target + 3 distractors, shuffle options
  const rawOptions = [targetAsset, ...distractors.slice(0, 3)];
  const optionsList = shuffle(rawOptions, r);
  const correctAnswerIndex = optionsList.findIndex(item => item.word === targetAsset.word);

  const vowelChar = category.replace('short-', ''); // "a", "e", "i"
  const questionText = `Listen to each word. Which word has the short ${vowelChar} sound?`;

  return {
    id: `english_lkg_phonics_images_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'choice',
    questionText,
    audioUrl: letterAudios[questionText] || undefined,
    voice: 'Kore',
    generateAudio: 'none',
    explanation: `The word **${targetAsset.word}** has the short ${vowelChar} sound.`,
    options: optionsList.map((item, i) => {
      return {
        id: `opt_${i}`,
        label: item.word,
        content: item.url,
        audioUrl: item.audioUrl,
        hideLabel: true
      };
    }),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    metadata: {
      chapterId: 'english-lkg-phonics',
      chapterTitle: 'Phonics'
    },
    parts: [
      { type: 'text', content: questionText }
    ]
  };
}

// ─── Balloon Tap generator ────────────────────────────────────────────────────
// Produces a `balloon_tap` part where letters float up as balloons.
// The student must tap every balloon that shows the target letter.
const BALLOON_TAP_COLOR_COUNT = 7; // matches PartRenderer BALLOON_COLORS length

function generateBalloonTapQuestion(skillId, seed, r) {
  const useUppercase = !skillId.includes('lowercase');
  const alphabet = useUppercase
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    : 'abcdefghijklmnopqrstuvwxyz'.split('');

  // Pick target letter
  const targetIdx    = Math.floor(r * alphabet.length);
  const targetLetter = alphabet[targetIdx];

  // Pick 4 distinct distractors
  const otherLetters = alphabet.filter(l => l !== targetLetter);
  const shuffled     = shuffle(otherLetters, r);
  const distractors  = shuffled.slice(0, 4);

  // Build letter pool: target appears twice as often as each distractor
  const pool = [
    { letter: targetLetter, colorIndex: targetIdx % BALLOON_TAP_COLOR_COUNT },
    { letter: targetLetter, colorIndex: (targetIdx + 3) % BALLOON_TAP_COLOR_COUNT },
    ...distractors.map((l, i) => ({ letter: l, colorIndex: (targetIdx + i + 1) % BALLOON_TAP_COLOR_COUNT })),
  ];

  const questionText = `Tap every balloon with the letter **${targetLetter}**!`;
  const audioUrl = letterAudios[questionText] || letterAudios[targetLetter] || undefined;

  return {
    id: `english_lkg_balloon_tap_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'balloon_tap',
    questionText,
    targetLetter,
    audioUrl,
    voice: 'Kore',
    generateAudio: 'all',
    hitsNeeded: 3,
    explanation: `The letter **${targetLetter}** floats up on the balloons. You popped them all!`,
    remediation: `Look for the letter **${targetLetter}** — it looks like this: ${targetLetter}`,
    options: pool.map((entry, i) => ({ id: `opt_${i}`, label: entry.letter })),
    correctAnswerIndex: 0,
    answer: targetLetter,
    metadata: {
      chapterId: 'english-lkg-letter-identification',
      chapterTitle: 'Letter Identification',
    },
    parts: [
      { type: 'text', content: questionText },
      {
        type: 'balloon_tap',
        target: targetLetter,
        hitsNeeded: 3,
        letters: pool,
      },
    ],
  };
}

function generateLocNextBesideQuestion(skillId, seed, r) {
  const SCENES = [
    {
      name: 'bed',
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779984568906-bed.png',
      bgElement: { x: 220, y: 160, width: 360, height: 240 },
      positions: {
        beside_left: { x: 80, y: 220, width: 120, height: 120 },
        beside_right: { x: 600, y: 220, width: 120, height: 120 },
        on_top: { x: 340, y: 110, width: 120, height: 100 }
      }
    },
    {
      name: 'table',
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779994263347-table.png',
      bgElement: { x: 220, y: 180, width: 360, height: 220 },
      positions: {
        beside_left: { x: 80, y: 240, width: 120, height: 120 },
        beside_right: { x: 600, y: 240, width: 120, height: 120 },
        on_top: { x: 340, y: 100, width: 120, height: 100 }
      }
    },
    {
      name: 'box',
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779984495333-box.png',
      bgElement: { x: 240, y: 200, width: 320, height: 220 },
      positions: {
        beside_left: { x: 90, y: 240, width: 120, height: 120 },
        beside_right: { x: 590, y: 240, width: 120, height: 120 },
        on_top: { x: 340, y: 110, width: 120, height: 100 }
      }
    }
  ];

  const OBJECTS = [
    { name: 'frog', label: 'frog', imageUrl: '/images/lkg/frog.png' },
    { name: 'duck', label: 'duck', imageUrl: '/images/lkg/duck.png' },
    { name: 'ball', label: 'ball', imageUrl: '/images/lkg/ball.png' },
    { name: 'apple', label: 'apple', imageUrl: '/images/lkg/apple.png' },
    { name: 'car', label: 'toy car', imageUrl: '/images/lkg/car.png' },
    { name: 'butterfly', label: 'butterfly', imageUrl: '/images/lkg/butterfly.png' }
  ];

  const sceneIdx = Math.floor(r * SCENES.length);
  const scene = SCENES[sceneIdx];

  const bgImgUrl = scene.name === 'bed'
    ? 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780336658654-backgroound_image.webp'
    : 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780337176148-room_bg_image.webp';

  const targetObjIdx = Math.floor(r * OBJECTS.length);
  const targetObj = OBJECTS[targetObjIdx];

  const distractorObjIdx = (targetObjIdx + 1) % OBJECTS.length;
  const distractorObj = OBJECTS[distractorObjIdx];

  const targetPosKey = r > 0.5 ? 'beside_left' : 'beside_right';
  const otherBesideKey = targetPosKey === 'beside_left' ? 'beside_right' : 'beside_left';

  const optionsRaw = [
    {
      id: 'correct_beside',
      label: `${targetObj.label} beside the ${scene.name}`,
      imageUrl: targetObj.imageUrl,
      posKey: targetPosKey,
      isCorrect: true
    },
    {
      id: 'distractor_on',
      label: `${targetObj.label} on top of the ${scene.name}`,
      imageUrl: targetObj.imageUrl,
      posKey: 'on_top',
      isCorrect: false
    },
    {
      id: 'distractor_beside',
      label: `${distractorObj.label} beside the ${scene.name}`,
      imageUrl: distractorObj.imageUrl,
      posKey: otherBesideKey,
      isCorrect: false
    }
  ];

  const optionsList = shuffle(optionsRaw, r);
  const correctAnswerIndex = optionsList.findIndex(opt => opt.isCorrect);

  const term = r > 0.5 ? 'beside' : 'next to';
  const questionText = `Click on the **${targetObj.label}** that is **${term}** the **${scene.name}**.`;

  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  ${scene.name !== 'bed' ? `<image href="${scene.imageUrl}" x="${scene.bgElement.x}" y="${scene.bgElement.y}" width="${scene.bgElement.width}" height="${scene.bgElement.height}" />` : ''}
</svg>`;

  const hotspots = optionsList.map((opt, idx) => {
    const coords = scene.positions[opt.posKey];
    return {
      id: `hs_${opt.id}_${idx}`,
      label: opt.label,
      x: (coords.x / 800) * 100,
      y: (coords.y / 465) * 100,
      width: (coords.width / 800) * 100,
      height: (coords.height / 465) * 100,
      isCircle: false,
      isCorrect: opt.isCorrect,
      imageUrl: opt.imageUrl,
      transparent: true
    };
  });

  const partHotspots = optionsList.map((opt, idx) => {
    const coords = scene.positions[opt.posKey];
    return {
      optionIndex: idx,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      label: opt.label,
      isCircle: false,
      imageUrl: opt.imageUrl,
      id: `hs_${opt.id}_${idx}`,
      transparent: true
    };
  });

  return {
    id: `english_lkg_loc_next_beside_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    voice: 'Kore',
    generateAudio: 'all',
    explanation: `The **${targetObj.label}** is sitting right **${term}** (beside) the **${scene.name}**.`,
    options: optionsList.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.label,
      isCorrect: opt.isCorrect
    })),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    hotspots,
    backgroundUrl: bgImgUrl,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg,
        transparent: true
      }
    ]
  };
}

// ─── Above / Below / Next-to / Beside — Multi-Select ────────────────────────
// Each question places 4 transparent objects around a furniture scene:
//   • 1 ABOVE  (the target object, correct if the term is "above")
//   • 1 BELOW  (beside/under the furniture, correct if term is "below")
//   • 1 BESIDE LEFT  (correct if term is "beside" / "next to")
//   • 1 BESIDE RIGHT (another distractor)
// The question asks students to tap ALL objects in a given position.
// Two out of four slots will match the asked position → multi-select answer.
function generateLocPositionMultiQuestion(skillId, seed, r) {
  const SCENES = [
    {
      name: 'bed',
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779984568906-bed.png',
      bgElement: { x: 220, y: 145, width: 360, height: 240 },
      positions: {
        above:        { x: 320, y:  20, width: 120, height: 115 },
        beside_left:  { x:  55, y: 210, width: 130, height: 130 },
        beside_right: { x: 615, y: 210, width: 130, height: 130 },
        below:        { x: 320, y: 330, width: 120, height: 115 }
      }
    },
    {
      name: 'table',
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779994263347-table.png',
      bgElement: { x: 220, y: 155, width: 360, height: 220 },
      positions: {
        above:        { x: 320, y:  20, width: 120, height: 115 },
        beside_left:  { x:  55, y: 225, width: 130, height: 130 },
        beside_right: { x: 615, y: 225, width: 130, height: 130 },
        below:        { x: 320, y: 330, width: 120, height: 115 }
      }
    },
    {
      name: 'box',
      imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1779984495333-box.png',
      bgElement: { x: 240, y: 170, width: 320, height: 220 },
      positions: {
        above:        { x: 320, y:  20, width: 120, height: 115 },
        beside_left:  { x:  60, y: 235, width: 130, height: 130 },
        beside_right: { x: 610, y: 235, width: 130, height: 130 },
        below:        { x: 320, y: 330, width: 120, height: 115 }
      }
    }
  ];

  // Richer set of objects (all local + a couple of remote ones)
  const OBJECTS = [
    { name: 'frog',      label: 'frog',      imageUrl: '/images/lkg/frog.png' },
    { name: 'duck',      label: 'duck',      imageUrl: '/images/lkg/duck.png' },
    { name: 'ball',      label: 'ball',      imageUrl: '/images/lkg/ball.png' },
    { name: 'apple',     label: 'apple',     imageUrl: '/images/lkg/apple.png' },
    { name: 'car',       label: 'toy car',   imageUrl: '/images/lkg/car.png' },
    { name: 'butterfly', label: 'butterfly', imageUrl: '/images/lkg/butterfly.png' },
    { name: 'flower',    label: 'flower',    imageUrl: '/images/lkg/flower.png' },
    { name: 'hippo',     label: 'hippo',     imageUrl: '/images/lkg/hippo.png' }
  ];

  // Choose scene & target position concept
  const sceneIdx    = Math.floor(r * SCENES.length);
  const scene       = SCENES[sceneIdx];

  const bgImgUrl = scene.name === 'bed'
    ? 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780336658654-backgroound_image.webp'
    : 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780337176148-room_bg_image.webp';

  // Which positional concept are we testing this round?
  // 0=above  1=below  2=beside/next-to
  const r2          = seededRandom(seed + 1);
  const conceptIdx  = Math.floor(r2 * 3);
  const CONCEPTS    = [
    { term: 'above',   correctKeys: ['above'],                        questionWord: 'above' },
    { term: 'below',   correctKeys: ['below'],                        questionWord: 'below' },
    { term: 'beside',  correctKeys: ['beside_left', 'beside_right'],  questionWord: r > 0.5 ? 'beside' : 'next to' }
  ];
  const concept = CONCEPTS[conceptIdx];

  // Pick the target object (used in ALL 4 positions so kids must identify by LOCATION)
  const targetObjIdx = Math.floor(seededRandom(seed + 2) * OBJECTS.length);
  const targetObj    = OBJECTS[targetObjIdx];

  // Pick 3 distinct distractor objects for the other positions
  const distractors = [];
  let di = (targetObjIdx + 1) % OBJECTS.length;
  while (distractors.length < 3) {
    if (di !== targetObjIdx) distractors.push(OBJECTS[di]);
    di = (di + 1) % OBJECTS.length;
  }

  // Map each position to an object + whether it's correct
  const posKeys   = ['above', 'beside_left', 'beside_right', 'below'];
  const posItems  = posKeys.map((key, i) => {
    const isCorrect = concept.correctKeys.includes(key);
    // Correct slots get the target object; wrong slots get a distractor
    const obj = isCorrect ? targetObj : distractors[i % distractors.length];
    return { key, obj, isCorrect };
  });

  // Shuffle presentation order but keep mapping
  const shuffled = shuffle(posItems, r2);

  const correctIndices = shuffled
    .map((item, idx) => (item.isCorrect ? idx : -1))
    .filter(idx => idx >= 0);

  const questionText = concept.correctKeys.length > 1
    ? `Tap **all** the **${targetObj.label}** images that are **${concept.questionWord}** the **${scene.name}**.`
    : `Tap **all** the images that are **${concept.questionWord}** the **${scene.name}**.`;

  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  ${scene.name !== 'bed' ? `<image href="${scene.imageUrl}" x="${scene.bgElement.x}" y="${scene.bgElement.y}" width="${scene.bgElement.width}" height="${scene.bgElement.height}" />` : ''}
</svg>`;

  const partHotspots = shuffled.map((item, idx) => {
    const coords = scene.positions[item.key];
    return {
      optionIndex: idx,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      label: `${item.obj.label} ${item.key.replace('_', ' ')} the ${scene.name}`,
      isCircle: false,
      imageUrl: item.obj.imageUrl,
      id: `hs_${item.key}_${idx}`,
      transparent: true
    };
  });

  return {
    id: `english_lkg_loc_position_multi_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_multi_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    voice: 'Kore',
    generateAudio: 'all',
    explanation: `The correct images are those **${concept.questionWord}** the **${scene.name}**.`,
    options: shuffled.map((item, idx) => ({
      id: `opt_${idx}`,
      label: `${item.obj.label} ${item.key.replace('_', ' ')} the ${scene.name}`,
      isCorrect: item.isCorrect
    })),
    answer: correctIndices,
    correctAnswerIndex: correctIndices,
    hotspots: shuffled.map((item, idx) => {
      const coords = scene.positions[item.key];
      return {
        id: `hs_${item.key}_${idx}`,
        label: `${item.obj.label} ${item.key.replace('_', ' ')} the ${scene.name}`,
        x: (coords.x / 800) * 100,
        y: (coords.y / 465) * 100,
        width: (coords.width / 800) * 100,
        height: (coords.height / 465) * 100,
        isCircle: false,
        isCorrect: item.isCorrect,
        imageUrl: item.obj.imageUrl,
        transparent: true
      };
    }),
    backgroundUrl: bgImgUrl,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg,
        transparent: true,
        multiSelect: true
      }
    ]
  };
}

export function resolveLkgGenerator(skillId, config = {}) {
  const skillDef = lkgEnglishMicroSkillRegistry[skillId];
  const templateId = skillDef?.templateId || skillId;
  const template = lkgEnglishTemplateRegistry[templateId];
  
  if (!template) {
    console.warn(`Template not found for: ${templateId}`);
    return null;
  }

  return {
    template,
    generate: (variables = {}) => {
      const seed = Number(variables.seed) || Date.now();
      const r = seededRandom(seed);

      let question;
      if (template.engine === 'beginning_sounds') {
        question = generateBeginningSoundsQuestion(seed, r);
      } else if (template.engine === 'identify_category') {
        question = generateIdentifyCategoryQuestion(seed, r);
      } else if (template.engine === 'letter_recognition') {
        question = generateLetterRecognitionQuestion(skillId, seed, r, variables, config);
      } else if (template.engine === 'case_match') {
        question = generateCaseMatchQuestion(skillId, seed, r, config);
      } else if (template.engine === 'word_recognition') {
        question = generateWordRecognitionQuestion(skillId, seed, r, config);
      } else if (template.engine === 'rhyming') {
        question = generateRhymingQuestion(skillId, seed, r);
      } else if (template.engine === 'color_identification') {
        question = generateColorIdentificationQuestion(seed, r);
      } else if (template.engine === 'letter_lines') {
        question = generateLetterLinesQuestion(skillId, seed, r);
      } else if (template.engine === 'phonics_vowels') {
        question = generatePhonicsVowelsQuestion(skillId, seed, r);
      } else if (template.engine === 'phonics_images') {
        question = generatePhonicsImagesQuestion(skillId, seed, r);
      } else if (template.engine === 'balloon_tap') {
        question = generateBalloonTapQuestion(skillId, seed, r);
      } else if (template.engine === 'loc_next_beside') {
        question = generateLocNextBesideQuestion(skillId, seed, r);
      } else if (template.engine === 'loc_position_multi') {
        question = generateLocPositionMultiQuestion(skillId, seed, r);
      } else if (template.engine === 'assoc_lower_word_begins') {
        question = generatePhonicsAssoc({ seed, difficulty: config.difficulty }, config);
      }

      if (question) {
        question.metadata = {
          ...(question.metadata || {}),
          templateId,
          skillId,
          engine: 'lkg',
          subject: 'english',
          topic: 'lkg'
        };
      }

      return question;
    }
  };
}
