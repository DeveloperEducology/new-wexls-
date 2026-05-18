import { createSeededRandom, randInt, uid } from "./shared.js";

const TOOL_REGISTRY = {
  measuring_tape: {
    label: "measuring tape",
    svg: `
      <svg viewBox="0 0 240 160" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#e2e8f0" />
            <stop offset="50%" stop-color="#cbd5e1" />
            <stop offset="100%" stop-color="#94a3b8" />
          </linearGradient>
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15" />
          </filter>
        </defs>
        
        <!-- Rolled Tape Body -->
        <g filter="url(#dropShadow)">
          <!-- Outer layers of rolled tape -->
          <circle cx="70" cy="75" r="42" fill="none" stroke="url(#tapeGrad)" stroke-width="12" />
          <circle cx="70" cy="75" r="32" fill="none" stroke="url(#tapeGrad)" stroke-width="8" opacity="0.9" />
          <circle cx="70" cy="75" r="24" fill="none" stroke="url(#tapeGrad)" stroke-width="6" opacity="0.75" />
          <circle cx="70" cy="75" r="16" fill="none" stroke="url(#tapeGrad)" stroke-width="4" opacity="0.6" />
          <!-- Central metallic spindle -->
          <circle cx="70" cy="75" r="8" fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
          <circle cx="70" cy="75" r="3" fill="#1e293b" />
        </g>
        
        <!-- Unrolled Extended Tape ribbon -->
        <g filter="url(#dropShadow)">
          <path d="M 102,94 C 130,94 150,68 185,68" fill="none" stroke="url(#tapeGrad)" stroke-width="14" stroke-linecap="round" />
          
          <!-- Ribbon metal end cap -->
          <path d="M 183,68 C 184,68 194,68 194,68" fill="none" stroke="url(#metalGrad)" stroke-width="14" stroke-linecap="round" />
          <circle cx="192" cy="68" r="1.5" fill="#334155" />
        </g>

        <!-- Tick marks on the extended ribbon -->
        <g stroke="#0f172a" stroke-width="1">
          <line x1="110" y1="88" x2="112" y2="94" />
          <line x1="120" y1="84" x2="122" y2="91" />
          <line x1="130" y1="78" x2="132" y2="85" />
          <line x1="140" y1="73" x2="142" y2="80" />
          
          <line x1="155" y1="65" x2="157" y2="72" />
          <line x1="165" y1="63" x2="167" y2="70" stroke-width="1.5" />
          <line x1="175" y1="62" x2="177" y2="69" />
        </g>

        <text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="15" fill="#0f172a">measuring tape</text>
      </svg>
    `
  },
  inch_ruler: {
    label: "inch ruler",
    svg: `
      <svg viewBox="0 0 240 160" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fef08a" />
            <stop offset="50%" stop-color="#fde047" />
            <stop offset="100%" stop-color="#eab308" />
          </linearGradient>
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15" />
          </filter>
        </defs>

        <!-- Ruler Body -->
        <rect x="15" y="55" width="210" height="42" rx="4" fill="url(#woodGrad)" stroke="#ca8a04" stroke-width="2" filter="url(#dropShadow)" />
        
        <!-- Premium glossy reflection stripe -->
        <rect x="17" y="57" width="206" height="8" fill="#ffffff" opacity="0.35" rx="2" />
        
        <!-- Measurement Ticks -->
        <g stroke="#854d0e" stroke-width="2">
          <!-- Major inch marks -->
          <line x1="20" y1="55" x2="20" y2="73" />
          <line x1="52" y1="55" x2="52" y2="71" />
          <line x1="84" y1="55" x2="84" y2="71" />
          <line x1="116" y1="55" x2="116" y2="71" />
          <line x1="148" y1="55" x2="148" y2="71" />
          <line x1="180" y1="55" x2="180" y2="71" />
          <line x1="212" y1="55" x2="212" y2="73" />
        </g>
        
        <!-- Subdivisions (half, quarter, eighth inches) -->
        <g stroke="#a16207" stroke-width="1">
          <!-- Half inch ticks -->
          <line x1="36" y1="55" x2="36" y2="67" />
          <line x1="68" y1="55" x2="68" y2="67" />
          <line x1="100" y1="55" x2="100" y2="67" />
          <line x1="132" y1="55" x2="132" y2="67" />
          <line x1="164" y1="55" x2="164" y2="67" />
          <line x1="196" y1="55" x2="196" y2="67" />

          <!-- Quarter ticks -->
          <line x1="28" y1="55" x2="28" y2="63" />
          <line x1="44" y1="55" x2="44" y2="63" />
          <line x1="60" y1="55" x2="60" y2="63" />
          <line x1="76" y1="55" x2="76" y2="63" />
          <line x1="92" y1="55" x2="92" y2="63" />
          <line x1="108" y1="55" x2="108" y2="63" />
          <line x1="124" y1="55" x2="124" y2="63" />
          <line x1="140" y1="55" x2="140" y2="63" />
          <line x1="156" y1="55" x2="156" y2="63" />
          <line x1="172" y1="55" x2="172" y2="63" />
          <line x1="188" y1="55" x2="188" y2="63" />
          <line x1="204" y1="55" x2="204" y2="63" />
        </g>

        <!-- Ruler Labels -->
        <g font-family="sans-serif" font-size="11" font-weight="900" fill="#713f12" text-anchor="middle">
          <text x="52" y="87">1</text>
          <text x="84" y="87">2</text>
          <text x="116" y="87">3</text>
          <text x="148" y="87">4</text>
          <text x="180" y="87">5</text>
          <text x="210" y="87" font-size="8">inch</text>
        </g>

        <text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="15" fill="#0f172a">inch ruler</text>
      </svg>
    `
  },
  yardstick: {
    label: "yardstick",
    svg: `
      <svg viewBox="0 0 240 160" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mapleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ebd5b3" />
            <stop offset="55%" stop-color="#ddc39d" />
            <stop offset="100%" stop-color="#c5a982" />
          </linearGradient>
          <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="70%" stop-color="#b45309" />
            <stop offset="100%" stop-color="#78350f" />
          </linearGradient>
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15" />
          </filter>
        </defs>

        <!-- Wooden Body with Grain -->
        <g filter="url(#dropShadow)">
          <rect x="10" y="60" width="220" height="28" rx="2" fill="url(#mapleGrad)" stroke="#a1825c" stroke-width="1.5" />
          
          <!-- Wood grain path decorations -->
          <path d="M 15,67 C 60,69 110,65 180,67 M 40,73 C 90,75 140,71 215,73 M 10,79 C 80,81 120,78 190,79" fill="none" stroke="#ba9e7b" stroke-width="1" opacity="0.65" />
          
          <!-- Brass protection end-caps -->
          <rect x="10" y="60" width="6" height="28" fill="url(#brassGrad)" stroke="#78350f" stroke-width="1" />
          <rect x="224" y="60" width="6" height="28" fill="url(#brassGrad)" stroke="#78350f" stroke-width="1" />
        </g>

        <!-- Calibration Ticks -->
        <g stroke="#3e2723" stroke-width="1.5">
          <line x1="20" y1="60" x2="20" y2="71" />
          <line x1="72" y1="60" x2="72" y2="70" />
          <line x1="124" y1="60" x2="124" y2="70" />
          <line x1="176" y1="60" x2="176" y2="70" />
          <line x1="220" y1="60" x2="220" y2="71" />
        </g>
        
        <!-- Sub ticks -->
        <g stroke="#5d4037" stroke-width="1">
          <line x1="46" y1="60" x2="46" y2="66" />
          <line x1="98" y1="60" x2="98" y2="66" />
          <line x1="150" y1="60" x2="150" y2="66" />
          <line x1="202" y1="60" x2="202" y2="66" />
        </g>

        <!-- Imperial Text Markings -->
        <g font-family="serif" font-style="italic" font-weight="900" font-size="10" fill="#3e2723" text-anchor="middle">
          <text x="72" y="81">1 YD</text>
          <text x="124" y="81">2 YD</text>
          <text x="176" y="81">3 YD</text>
        </g>

        <text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="15" fill="#0f172a">yardstick</text>
      </svg>
    `
  },
  tape_measure: {
    label: "tape measure",
    svg: `
      <svg viewBox="0 0 240 160" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="caseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>
          <linearGradient id="metalBlade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color="#e2e8f0" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15" />
          </filter>
        </defs>

        <!-- Extended Steel Blade ribbon -->
        <g filter="url(#dropShadow)">
          <path d="M 80,82 L 195,82" fill="none" stroke="url(#metalBlade)" stroke-width="16" />
          <!-- Black and Red ticks -->
          <g stroke="#0f172a" stroke-width="1">
            <line x1="95" y1="74" x2="95" y2="80" />
            <line x1="110" y1="74" x2="110" y2="82" />
            <line x1="125" y1="74" x2="125" y2="80" />
            <line x1="140" y1="74" x2="140" y2="82" />
            <line x1="155" y1="74" x2="155" y2="80" />
            <line x1="170" y1="74" x2="170" y2="82" />
            <line x1="185" y1="74" x2="185" y2="80" />
          </g>
          <!-- Steel End hook -->
          <path d="M 195,72 L 195,92 M 194,72 H 197" stroke="#1e293b" stroke-width="3" stroke-linecap="square" />
        </g>

        <!-- Casing body -->
        <g filter="url(#dropShadow)">
          <!-- Robust Yellow and Black Case -->
          <rect x="20" y="32" width="70" height="66" rx="12" fill="url(#caseGrad)" stroke="#1e40af" stroke-width="2" />
          
          <!-- Rubber grips (Black panels) -->
          <path d="M 20,44 C 20,32 36,32 46,32 L 46,98 C 34,98 20,98 20,86 Z" fill="#1e293b" />
          <path d="M 70,32 L 80,44 C 86,52 86,78 80,86 L 70,98 Z" fill="#1e293b" />
          
          <!-- Circular silver metal decal -->
          <circle cx="56" cy="65" r="18" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
          <circle cx="56" cy="65" r="14" fill="#f8fafc" />
          <text x="56" y="69" font-family="sans-serif" font-weight="900" font-size="11" fill="#1e40af" text-anchor="middle">16ft</text>
          
          <!-- Red Slide Lock Switch -->
          <rect x="74" y="44" width="10" height="15" rx="2" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />
          <line x1="76" y1="49" x2="82" y2="49" stroke="#ffffff" stroke-width="1.5" />
          <line x1="76" y1="54" x2="82" y2="54" stroke="#ffffff" stroke-width="1.5" />
        </g>

        <text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="15" fill="#0f172a">tape measure</text>
      </svg>
    `
  },
  odometer: {
    label: "odometer",
    svg: `
      <svg viewBox="0 0 240 160" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Brushed metal dashboard gradient -->
          <linearGradient id="dashBezel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#475569" />
            <stop offset="50%" stop-color="#334155" />
            <stop offset="100%" stop-color="#1e293b" />
          </linearGradient>
          
          <!-- Roller drum cylindrical shadow to make it 3D -->
          <linearGradient id="drumShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.9" />
            <stop offset="25%" stop-color="#000000" stop-opacity="0.0" />
            <stop offset="75%" stop-color="#000000" stop-opacity="0.0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.9" />
          </linearGradient>
          
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.15" />
          </filter>
        </defs>

        <!-- Dashboard Bezel -->
        <rect x="15" y="36" width="210" height="66" rx="8" fill="url(#dashBezel)" stroke="#0f172a" stroke-width="4" filter="url(#dropShadow)" />
        <rect x="17" y="38" width="206" height="62" rx="6" fill="none" stroke="#64748b" stroke-width="1.5" />
        
        <!-- Odometer Window Cutout -->
        <rect x="28" y="46" width="184" height="46" rx="4" fill="#090d16" stroke="#475569" stroke-width="2.5" />
        
        <!-- Rolling Drums -->
        <g font-family="Courier New, monospace" font-weight="900" font-size="26" text-anchor="middle">
          
          <!-- Drum 1: White on Black -->
          <rect x="34" y="49" width="24" height="40" fill="#111827" rx="2" />
          <text x="46" y="78" fill="#ffffff">0</text>
          <rect x="34" y="49" width="24" height="40" fill="url(#drumShadow)" rx="2" />
          
          <!-- Drum 2 -->
          <rect x="62" y="49" width="24" height="40" fill="#111827" rx="2" />
          <text x="74" y="78" fill="#ffffff">8</text>
          <rect x="62" y="49" width="24" height="40" fill="url(#drumShadow)" rx="2" />
          
          <!-- Drum 3 -->
          <rect x="90" y="49" width="24" height="40" fill="#111827" rx="2" />
          <text x="102" y="78" fill="#ffffff">5</text>
          <rect x="90" y="49" width="24" height="40" fill="url(#drumShadow)" rx="2" />
          
          <!-- Drum 4 -->
          <rect x="118" y="49" width="24" height="40" fill="#111827" rx="2" />
          <text x="130" y="78" fill="#ffffff">2</text>
          <rect x="118" y="49" width="24" height="40" fill="url(#drumShadow)" rx="2" />
          
          <!-- Drum 5 -->
          <rect x="146" y="49" width="24" height="40" fill="#111827" rx="2" />
          <text x="158" y="78" fill="#ffffff">9</text>
          <rect x="146" y="49" width="24" height="40" fill="url(#drumShadow)" rx="2" />
          
          <!-- Decimal Drum (Red/White or White/Black) -->
          <rect x="174" y="49" width="22" height="40" fill="#ef4444" rx="2" />
          <text x="185" y="78" fill="#ffffff">4</text>
          <rect x="174" y="49" width="22" height="40" fill="url(#drumShadow)" rx="2" />
        </g>
        
        <!-- Glass reflections -->
        <path d="M 30,50 L 210,50" stroke="#ffffff" stroke-width="1.5" opacity="0.12" />
        
        <!-- MILES subunit label -->
        <text x="206" y="101" font-family="sans-serif" font-weight="900" font-size="8" fill="#94a3b8">mi</text>

        <text x="120" y="152" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="15" fill="#0f172a">odometer</text>
      </svg>
    `
  }
};

const TOOL_ORDER = [
  "measuring_tape",
  "inch_ruler",
  "yardstick",
  "tape_measure",
  "odometer"
];

const MEASUREMENT_SITUATIONS = {
  measuring_tape: [
    "around a pinecone",
    "around your wrist",
    "around a pumpkin",
    "around a ball",
    "around a tree trunk",
    "around a person's waist",
    "around a water bottle",
    "around a gift box",
    "around a hat",
    "around a basket"
  ],

  inch_ruler: [
    "the length of a pencil",
    "the length of an eraser",
    "the width of a notebook",
    "the length of a crayon",
    "the length of a spoon",
    "the length of a toothbrush",
    "the width of a book",
    "the length of a marker",
    "the length of a paper clip",
    "the length of a small toy car"
  ],

  yardstick: [
    "the length of a classroom table",
    "the height of a desk",
    "the width of a door",
    "the length of a blackboard",
    "the height of a chair",
    "the length of a bench",
    "the width of a window",
    "the length of a small rug",
    "the height of a bookshelf",
    "the length of a hallway bulletin board"
  ],

  tape_measure: [
    "the length of a room",
    "the width of a bedroom",
    "the height of a wall",
    "the length of a sofa",
    "the width of a bed",
    "the height of a refrigerator",
    "the length of a carpet",
    "the width of a doorway",
    "the length of a dining table",
    "the height of a cupboard"
  ],

  odometer: [
    "how far a car travels",
    "the distance of a road trip",
    "how far a bus travels",
    "the distance between two towns",
    "how many miles a truck travels",
    "the distance to another city",
    "how far a taxi drives",
    "the distance to the airport",
    "how far a delivery van travels",
    "the distance across a city"
  ]
};

function shuffle(arr, random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getOptionCount(difficulty) {
  if (difficulty === "easy") return 2;
  if (difficulty === "medium") return 3;
  return 4;
}

function getWrongTools(correctTool, count, random) {
  return shuffle(
    TOOL_ORDER.filter(tool => tool !== correctTool),
    random
  ).slice(0, count);
}

function makeQuestionText(situation) {
  return `Which tool is better for measuring ${situation}?`;
}

export function generateMeasurementToolQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(
    variables.seed || template.seed || Date.now()
  );

  let difficulty = variables.difficulty || "easy";
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    difficulty = "easy";
  }
  const optionCount = getOptionCount(difficulty);

  const correctTool =
    variables.tool ||
    TOOL_ORDER[randInt(0, TOOL_ORDER.length - 1, random)];

  const situations = MEASUREMENT_SITUATIONS[correctTool];
  const situation =
    variables.situation ||
    situations[randInt(0, situations.length - 1, random)];

  const wrongTools = getWrongTools(correctTool, optionCount - 1, random);

  const optionToolIds = shuffle(
    [correctTool, ...wrongTools],
    random
  );

  const options = optionToolIds.map((toolId, index) => {
    const tool = TOOL_REGISTRY[toolId];
    return {
      id: `opt_${index}_${toolId}`,
      svg: tool.svg.trim(),
      label: tool.label,
      value: toolId,
      isCorrect: toolId === correctTool
    };
  });

  const answerIndex = options.findIndex(option => option.isCorrect);

  return {
    id: uid(),
    type: "mcq",
    questionText: makeQuestionText(situation),
    parts: [],
    options,
    answer: answerIndex,
    correctAnswerIndex: answerIndex,
    layoutConfig: {
      optionMedia: {
        cardMinHeight: 210,
        cardPadding: 16,
        width: "100%",
        maxWidth: 380,
        minHeight: 135,
        marginBottom: 10
      }
    },
    solution: {
      sections: [
        {
          type: "text",
          content: `${TOOL_REGISTRY[correctTool].label.charAt(0).toUpperCase() + TOOL_REGISTRY[correctTool].label.slice(1)} is better for measuring ${situation}.`
        }
      ]
    },
    metadata: {
      subject: "science",
      topic: "units-measurement",
      engine: "measurementToolChoice",
      templateId: template.id,
      situation,
      correctTool,
      difficulty
    }
  };
}
