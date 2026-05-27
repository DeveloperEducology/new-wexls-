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
      } else {
        question = generateIdentifyCategoryQuestion(seed, r);
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
