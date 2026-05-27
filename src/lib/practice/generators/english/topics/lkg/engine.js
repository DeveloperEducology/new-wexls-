import { fruits, animals, things, vehicles } from './assets.js';
import { lkgEnglishTemplateRegistry, lkgEnglishMicroSkillRegistry } from './registry.js';

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
      imageUrl: opt.imageUrl
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
      id: `hs_${opt.name}_${idx}`
    };
  });

  const gradient = PASTEL_GRADIENTS[Math.floor(r * PASTEL_GRADIENTS.length)];
  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}</defs>
  <rect width="800" height="465" fill="url(#bgGrad)" rx="20" />
</svg>`;

  const questionText = `Click on the object that starts with the sound of letter **${targetLetter.toUpperCase()}**.`;

  return {
    id: `english_lkg_beginning_sounds_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    voice: 'Puck',
    generateAudio: 'all',
    explanation: `**${targetAsset.singular.toUpperCase()}** starts with the letter **${targetLetter.toUpperCase()}**.`,
    options: optionsList.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.singular
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
      imageUrl: opt.imageUrl
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
      id: `hs_${opt.name}_${idx}`
    };
  });

  const gradient = PASTEL_GRADIENTS[Math.floor(r * PASTEL_GRADIENTS.length)];
  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
  <defs>${gradient}</defs>
  <rect width="800" height="465" fill="url(#bgGrad)" rx="20" />
</svg>`;

  const questionText = `Click on the **${targetCategory.label}**.`;

  return {
    id: `english_lkg_identify_category_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    voice: 'Puck',
    generateAudio: 'all',
    explanation: `The **${correctItem.singular}** is a type of **${targetCategory.label}**.`,
    options: optionsList.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.singular
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

function generateLetterRecognitionQuestion(skillId, seed, r) {
  let questionText = '';
  let explanation = '';
  let backgroundSvg = '';
  let hotspots = [];
  let partHotspots = [];
  let optionsList = [];
  let correctAnswerIndex = 0;
  
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
    const distractors = shuffled.filter(l => l !== smallLetter).slice(0, 3);
    
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

    hotspots = optionsList.map((letter, idx) => {
      const coords = ROW_COORDINATES[idx];
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
      const coords = ROW_COORDINATES[idx];
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
    const distractors = shuffled.filter(l => l !== letter).slice(0, 3);
    
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

  } else if (skillId === 'lkg-english-letter-recognition-alphabetical-sequence') {
    const startIdx = Math.floor(r * 23); // index 0 to 22
    const L0 = UPPER_ALPHABET[startIdx];
    const L1 = UPPER_ALPHABET[startIdx + 1];
    const L2 = UPPER_ALPHABET[startIdx + 2];
    const L3 = UPPER_ALPHABET[startIdx + 3];
    
    const shuffled = shuffle(UPPER_ALPHABET, r);
    const distractors = shuffled.filter(l => l !== L0 && l !== L1 && l !== L2 && l !== L3).slice(0, 3);
    
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

    hotspots = optionsList.map((l, idx) => {
      const coords = ROW_COORDINATES[idx];
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
      const coords = ROW_COORDINATES[idx];
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
    const wordList = ["CAT", "DOG", "BABY", "FISH", "BIRD", "FROG", "LION", "DUCK", "BEAR", "COW", "PIG", "GOAT", "SHEEP", "HORSE"];
    const wordIdx = Math.floor(r * wordList.length);
    const word = wordList[wordIdx];
    
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
    const distractors = shuffled.filter(l => l !== letter && l !== nextLetter).slice(0, 3);
    
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

    hotspots = optionsList.map((l, idx) => {
      const coords = ROW_COORDINATES[idx];
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
      const coords = ROW_COORDINATES[idx];
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
    const distractors = shuffled.filter(l => l !== letter).slice(0, 2);
    
    optionsList = shuffle([letter, ...distractors], r);
    correctAnswerIndex = optionsList.indexOf(letter);
    
    questionText = `Which letter does the word **${asset.singular}** start with?`;
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

    const THREE_ROW_COORDINATES = [
      { pctX: 20, pctY: 55, pctW: 16.25, pctH: 25, x: 160, y: 260, width: 130, height: 115 },
      { pctX: 41.875, pctY: 55, pctW: 16.25, pctH: 25, x: 335, y: 260, width: 130, height: 115 },
      { pctX: 63.75, pctY: 55, pctW: 16.25, pctH: 25, x: 510, y: 260, width: 130, height: 115 }
    ];

    hotspots = optionsList.map((l, idx) => {
      const coords = THREE_ROW_COORDINATES[idx];
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
      const coords = THREE_ROW_COORDINATES[idx];
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

  return {
    id: `english_lkg_letter_recognition_${skillId}_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    voice: 'Puck',
    generateAudio: 'all',
    explanation,
    options: optionsList.map((opt, idx) => {
      const label = typeof opt === 'object' ? opt.label : opt;
      return { id: `opt_${idx}`, label };
    }),
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
        question = generateLetterRecognitionQuestion(skillId, seed, r);
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
