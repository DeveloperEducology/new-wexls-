function getSeededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  }
}

export function generateSolarSystemQuestion(config, params) {
  const seed = config.variables?.seed || Date.now().toString();
  const random = getSeededRandom(seed);

  if (params?.subType === 'height_measure') {
    const images = [
      "https://cdn-icons-png.flaticon.com/512/146/146010.png",
      "https://cdn-icons-png.flaticon.com/512/388/388246.png",
      "https://cdni.iconscout.com/illustration/premium/thumb/standing-girl-illustration-svg-download-png-4136845.png",
      "https://cdn.freepixel.com/thumb/free-icons-cartoon-character-of-girl-standing-in-stylish-pose-th-11004470.jpg",
      "https://static.vecteezy.com/system/resources/thumbnails/014/175/146/small/cute-little-girl-standing-free-vector.jpg",
      "https://media.lordicon.com/icons/wired/flat/633-female-standing.svg",
      "https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-flat/512/Woman-Standing-Flat-Medium-icon.png"
    ];

    const allNames = ["Anna", "Bella", "Chloe", "Daisy", "Emma", "Fiona", "Grace"];

    // Shuffle and pick 3 or 4 characters
    const count = 3 + Math.floor(random() * 2); // 3 or 4
    
    // Seeded shuffle helper
    const shuffledIndices = [0, 1, 2, 3, 4, 5, 6].sort(() => random() - 0.5);
    const selectedImages = [];
    const selectedNames = [];
    for (let i = 0; i < count; i++) {
      selectedImages.push(images[shuffledIndices[i]]);
      selectedNames.push(allNames[shuffledIndices[i]]);
    }

    // Assign random, distinct heights (multiples of 20 or 30 for clear measurement)
    // E.g. from 150px to 300px
    const heightPool = [150, 180, 210, 240, 270, 300];
    const shuffledHeights = heightPool.sort(() => random() - 0.5);
    
    const characters = [];
    const CW = 800;
    const CH = 465;
    const groundY = 380;

    // Distribute X coordinates evenly
    const startX = count === 3 ? 180 : 120;
    const gapX = count === 3 ? 220 : 170;

    for (let i = 0; i < count; i++) {
      const h = shuffledHeights[i];
      const w = Math.round(h * 0.45); // standard human aspect ratio
      const cx = startX + i * gapX;
      characters.push({
        index: i,
        name: selectedNames[i],
        imgUrl: selectedImages[i],
        height: h,
        width: w,
        cx: cx,
        cy: groundY - h / 2, // center Y
        x: cx - w / 2,
        y: groundY - h
      });
    }

    // Randomize question types:
    // 0: Who is the tallest?
    // 1: Who is the shortest?
    // 2: Who is the second person from the left?
    // 3: Who is the third person from the left? (only if count === 4)
    // 4: Who is the first person from the left (far left)?
    // 5: Who is the last person (far right)?
    // 6: Who is taller: Name X or Name Y?
    const qTypes = [0, 1, 2, 4, 5, 6];
    if (count === 4) qTypes.push(3);

    const qType = qTypes[Math.floor(random() * qTypes.length)];
    let questionText = "";
    let answerIndex = 0;
    let explanationText = "";

    if (qType === 0) {
      let maxH = -1;
      let maxIdx = 0;
      for (let i = 0; i < count; i++) {
        if (characters[i].height > maxH) {
          maxH = characters[i].height;
          maxIdx = i;
        }
      }
      questionText = `Who is the tallest?`;
      answerIndex = maxIdx;
      explanationText = `${characters[maxIdx].name} is the tallest with a height of ${Math.round(characters[maxIdx].height / 30)} units on the scale.`;
    } else if (qType === 1) {
      let minH = 9999;
      let minIdx = 0;
      for (let i = 0; i < count; i++) {
        if (characters[i].height < minH) {
          minH = characters[i].height;
          minIdx = i;
        }
      }
      questionText = `Who is the shortest?`;
      answerIndex = minIdx;
      explanationText = `${characters[minIdx].name} is the shortest with a height of ${Math.round(characters[minIdx].height / 30)} units on the scale.`;
    } else if (qType === 2) {
      questionText = `Who is the second person from the left?`;
      answerIndex = 1;
      explanationText = `Counting from the left: 1st is ${characters[0].name}, 2nd is ${characters[1].name}.`;
    } else if (qType === 3) {
      questionText = `Who is the third person from the left?`;
      answerIndex = 2;
      explanationText = `Counting from the left: 1st is ${characters[0].name}, 2nd is ${characters[1].name}, 3rd is ${characters[2].name}.`;
    } else if (qType === 4) {
      questionText = `Who is on the far left?`;
      answerIndex = 0;
      explanationText = `${characters[0].name} is on the far left.`;
    } else if (qType === 5) {
      questionText = `Who is on the far right?`;
      answerIndex = count - 1;
      explanationText = `${characters[count - 1].name} is on the far right.`;
    } else if (qType === 6) {
      const idxA = Math.floor(random() * count);
      let idxB = Math.floor(random() * count);
      while (idxB === idxA) {
        idxB = Math.floor(random() * count);
      }
      const charA = characters[idxA];
      const charB = characters[idxB];
      questionText = `Who is taller, ${charA.name} or ${charB.name}?`;
      if (charA.height > charB.height) {
        answerIndex = idxA;
        explanationText = `${charA.name} stands at ${Math.round(charA.height / 30)} units, while ${charB.name} stands at ${Math.round(charB.height / 30)} units. Therefore, ${charA.name} is taller.`;
      } else {
        answerIndex = idxB;
        explanationText = `${charB.name} stands at ${Math.round(charB.height / 30)} units, while ${charA.name} stands at ${Math.round(charA.height / 30)} units. Therefore, ${charB.name} is taller.`;
      }
    }

    let gridLinesSvg = "";
    for (let x = 100; x < CW; x += 100) {
      gridLinesSvg += `    <line x1="${x}" y1="50" x2="${x}" y2="${groundY}" stroke="#bae6fd" stroke-width="1" stroke-dasharray="3,3" />\n`;
    }
    let rulerLabelsSvg = "";
    for (let y = groundY; y >= 80; y -= 30) {
      const units = (groundY - y) / 30;
      gridLinesSvg += `    <line x1="60" y1="${y}" x2="${CW - 40}" y2="${y}" stroke="#bae6fd" stroke-width="1" stroke-dasharray="3,3" />\n`;
      gridLinesSvg += `    <line x1="50" y1="${y}" x2="60" y2="${y}" stroke="#0369a1" stroke-width="2" />\n`;
      rulerLabelsSvg += `    <text x="38" y="${y + 4}" font-family="sans-serif" font-size="12" font-weight="700" fill="#0369a1" text-anchor="end">${units}</text>\n`;
    }

    const groundFloorSvg = `
      <rect x="0" y="${groundY}" width="${CW}" height="${CH - groundY}" fill="#bae6fd" />
      <line x1="0" y1="${groundY}" x2="${CW}" y2="${groundY}" stroke="#0284c7" stroke-width="4" />
      <rect x="0" y="${groundY + 4}" width="${CW}" height="${CH - groundY - 4}" fill="#f0f9ff" opacity="0.9" />
    `;

    let charsSvg = "";
    const hotspots = characters.map((c, i) => {
      charsSvg += `
        <g>
          <image href="${c.imgUrl}" x="${c.cx - c.height / 2}" y="${c.y}" width="${c.height}" height="${c.height}" preserveAspectRatio="xMidYMax meet" />
          <rect x="${c.cx - 35}" y="${groundY + 15}" width="70" height="22" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
          <text x="${c.cx}" y="${groundY + 30}" font-family="sans-serif" font-size="11" font-weight="700" fill="#334155" text-anchor="middle">${c.name}</text>
        </g>
      `;

      const paddingX = Math.round(c.width / 2) + 12;
      const paddingY = Math.round(c.height / 2) + 18;
      return {
        optionIndex: i,
        x: Math.round(c.cx - paddingX),
        y: Math.round(c.cy - paddingY + 8),
        width: Math.round(paddingX * 2),
        height: Math.round(paddingY * 2),
        label: c.name,
        isCircle: false
      };
    });

    const backgroundSvg = `<svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f0f9ff" />
          <stop offset="100%" stop-color="#bae6fd" />
        </linearGradient>
      </defs>

      <rect width="${CW}" height="${CH}" fill="url(#skyGrad)" />
${gridLinesSvg}
      <line x1="60" y1="50" x2="60" y2="${groundY}" stroke="#0369a1" stroke-width="3" />
${rulerLabelsSvg}
${groundFloorSvg}
${charsSvg}
    </svg>`;

    return {
      type: 'mcq',
      interaction: 'hotspot_select',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        {
          type: 'hotspot_canvas',
          backgroundSvg,
          canvasWidth: CW,
          canvasHeight: CH,
          hotspots,
        },
      ],
      options: characters.map(c => ({
        id: c.name.toLowerCase(),
        label: c.name
      })),
      answer: characters[answerIndex].name.toLowerCase(),
      correctAnswerIndex: answerIndex,
      solution: {
        sections: [
          { type: 'text', content: explanationText }
        ]
      }
    };
  }

  const PLANETS = [
    { id: 'mercury', label: 'Mercury', cx: 73,  cy: 197, r: 8,  desc: 'the smallest planet and closest to the Sun' },
    { id: 'venus',   label: 'Venus',   cx: 142, cy: 206, r: 13, desc: 'the second planet from the Sun, bright and yellow' },
    { id: 'earth',   label: 'Earth',   cx: 220, cy: 225, r: 14, desc: 'our home planet, the blue and green planet' },
    { id: 'mars',    label: 'Mars',    cx: 302, cy: 251, r: 11, desc: 'the Red Planet, located fourth from the Sun' },
    { id: 'jupiter', label: 'Jupiter', cx: 387, cy: 285, r: 25, desc: 'the largest gas giant, known for its Great Red Spot' },
    { id: 'saturn',  label: 'Saturn',  cx: 475, cy: 325, r: 21, desc: 'the gas giant famous for its spectacular ring system' },
    { id: 'uranus',  label: 'Uranus',  cx: 563, cy: 375, r: 17, desc: 'the ice giant with faint rings, pale blue-green' },
    { id: 'neptune', label: 'Neptune', cx: 653, cy: 429, r: 16, desc: 'the blue ice giant located farthest from the Sun' }
  ];

  // Pick a random planet as the target
  const targetIndex = Math.floor(random() * PLANETS.length);
  const targetPlanet = PLANETS[targetIndex];

  const CW = 800;
  const CH = 465;

  // Starfield background
  const starsCount = 60;
  let starsSvg = '';
  for (let i = 0; i < starsCount; i++) {
    const starX = Math.floor(random() * CW);
    const starY = Math.floor(random() * CH);
    const starR = (random() * 1.3 + 0.4).toFixed(1);
    const starOp = (random() * 0.7 + 0.3).toFixed(2);
    starsSvg += `    <circle cx="${starX}" cy="${starY}" r="${starR}" fill="#ffffff" opacity="${starOp}" />\n`;
  }

  // Hotspots bounding boxes
  const hotspots = PLANETS.map((planet, index) => {
    // Make Saturn's hotspot wider to account for rings
    const isSaturn = planet.id === 'saturn';
    const paddingX = isSaturn ? 42 : (planet.r + 10);
    const paddingY = planet.r + 10;
    return {
      optionIndex: index,
      x: Math.round(planet.cx - paddingX),
      y: Math.round(planet.cy - paddingY),
      width: Math.round(paddingX * 2),
      height: Math.round(paddingY * 2),
      label: planet.label,
      isCircle: true
    };
  });

  const backgroundSvg = `<svg width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Space background gradient -->
      <linearGradient id="spaceBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="60%" stop-color="#0b1329"/>
        <stop offset="100%" stop-color="#111827"/>
      </linearGradient>

      <!-- Radial gradient for Sun's glow -->
      <radialGradient id="sunGlow" cx="0%" cy="50%" r="100%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="1"/>
        <stop offset="25%" stop-color="#f97316" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="#ea580c" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#ea580c" stop-opacity="0"/>
      </radialGradient>

      <!-- Planet radial gradients for 3D sphere illusion -->
      <radialGradient id="mercuryGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#cbd5e1"/>
        <stop offset="70%" stop-color="#64748b"/>
        <stop offset="100%" stop-color="#334155"/>
      </radialGradient>

      <radialGradient id="venusGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffedd5"/>
        <stop offset="60%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#78350f"/>
      </radialGradient>

      <radialGradient id="earthGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#93c5fd"/>
        <stop offset="60%" stop-color="#2563eb"/>
        <stop offset="100%" stop-color="#1e3a8a"/>
      </radialGradient>

      <radialGradient id="marsGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fca5a5"/>
        <stop offset="60%" stop-color="#dc2626"/>
        <stop offset="100%" stop-color="#7f1d1d"/>
      </radialGradient>

      <radialGradient id="jupiterGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#ffedd5"/>
        <stop offset="40%" stop-color="#fed7aa"/>
        <stop offset="80%" stop-color="#ca8a04"/>
        <stop offset="100%" stop-color="#78350f"/>
      </radialGradient>

      <radialGradient id="saturnGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fef9c3"/>
        <stop offset="60%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#854d0e"/>
      </radialGradient>

      <radialGradient id="uranusGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#e0f7fa"/>
        <stop offset="65%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#083344"/>
      </radialGradient>

      <radialGradient id="neptuneGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#bfdbfe"/>
        <stop offset="60%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#172554"/>
      </radialGradient>

      <!-- Saturn rings gradient -->
      <linearGradient id="saturnRings" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ca8a04" stop-opacity="0.1"/>
        <stop offset="30%" stop-color="#eab308" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="#fef08a" stop-opacity="0.9"/>
        <stop offset="70%" stop-color="#eab308" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#ca8a04" stop-opacity="0.1"/>
      </linearGradient>

      <!-- Clip paths for striping -->
      <clipPath id="jupiterClip">
        <circle cx="387" cy="285" r="25" />
      </clipPath>
      <clipPath id="saturnClip">
        <circle cx="475" cy="325" r="21" />
      </clipPath>
    </defs>

    <!-- Deep space background -->
    <rect width="${CW}" height="${CH}" fill="url(#spaceBg)" />

    <!-- Stars -->
${starsSvg}
    <!-- Concentric elliptical orbits centered on Left (-100, 225) -->
    <ellipse cx="-100" cy="225" rx="180" ry="100" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="245" ry="135" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="320" ry="175" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="405" ry="220" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="500" ry="270" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="605" ry="325" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="720" ry="385" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />
    <ellipse cx="-100" cy="225" rx="845" ry="450" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3" />

    <!-- Sun Glow -->
    <circle cx="0" cy="225" r="220" fill="url(#sunGlow)" />
    <!-- Sun Core -->
    <circle cx="0" cy="225" r="100" fill="#fef08a" filter="drop-shadow(0 0 20px #ea580c)" />
    <path d="M 0,125 A 100 100 0 0 1 0,325 Z" fill="#facc15" />
    <text x="14" y="230" font-family="sans-serif" font-size="14" font-weight="900" fill="#7c2d12" opacity="0.8">SUN</text>

    <!-- PLANETS -->

    <!-- Mercury -->
    <g class="svg-object-0">
      <circle cx="73" cy="197" r="8" fill="url(#mercuryGrad)" />
    </g>

    <!-- Venus -->
    <g class="svg-object-1">
      <circle cx="142" cy="206" r="13" fill="url(#venusGrad)" />
    </g>

    <!-- Earth -->
    <g class="svg-object-2">
      <circle cx="220" cy="225" r="14" fill="url(#earthGrad)" />
      <!-- Continents -->
      <path d="M 211,217 Q 215,215 220,218 T 222,225 T 212,223 Z" fill="#15803d" opacity="0.6" pointer-events="none" />
      <path d="M 224,222 Q 228,225 229,230 T 223,232 Z" fill="#15803d" opacity="0.6" pointer-events="none" />
    </g>

    <!-- Mars -->
    <g class="svg-object-3">
      <circle cx="302" cy="251" r="11" fill="url(#marsGrad)" />
      <!-- Dark spots -->
      <ellipse cx="299" cy="249" rx="2" ry="1.5" fill="#450a0a" opacity="0.4" pointer-events="none" />
      <ellipse cx="304" cy="254" rx="2.5" ry="1" fill="#450a0a" opacity="0.4" pointer-events="none" />
    </g>

    <!-- Jupiter -->
    <g class="svg-object-4">
      <circle cx="387" cy="285" r="25" fill="url(#jupiterGrad)" />
      <g clip-path="url(#jupiterClip)" pointer-events="none">
        <rect x="350" y="270" width="70" height="6" fill="#7c2d12" opacity="0.4" />
        <rect x="350" y="292" width="70" height="5" fill="#78350f" opacity="0.4" />
        <rect x="350" y="280" width="70" height="4" fill="#ea580c" opacity="0.3" />
        <!-- Great Red Spot -->
        <ellipse cx="395" cy="293" rx="5" ry="3.5" fill="#dc2626" opacity="0.85" />
      </g>
    </g>

    <!-- Saturn rings (Back portion) -->
    <ellipse cx="475" cy="325" rx="42" ry="12" transform="rotate(-15, 475, 325)" fill="none" stroke="url(#saturnRings)" stroke-width="7" opacity="0.75" />
    <ellipse cx="475" cy="325" rx="42" ry="12" transform="rotate(-15, 475, 325)" fill="none" stroke="#a16207" stroke-width="1.5" opacity="0.8" />

    <!-- Saturn Planet Core -->
    <g class="svg-object-5">
      <circle cx="475" cy="325" r="21" fill="url(#saturnGrad)" />
      <g clip-path="url(#saturnClip)" pointer-events="none">
        <rect x="440" y="315" width="70" height="4" fill="#a16207" opacity="0.3" />
        <rect x="440" y="328" width="70" height="3" fill="#ca8a04" opacity="0.2" />
      </g>
    </g>

    <!-- Saturn rings (Front portion overlay) -->
    <path d="M 433.5,325 A 42 12 0 0 0 516.5,325" transform="rotate(-15, 475, 325)" fill="none" stroke="url(#saturnRings)" stroke-width="7" opacity="0.75" pointer-events="none" />
    <path d="M 433.5,325 A 42 12 0 0 0 516.5,325" transform="rotate(-15, 475, 325)" fill="none" stroke="#a16207" stroke-width="1.5" opacity="0.8" pointer-events="none" />

    <!-- Uranus -->
    <g class="svg-object-6">
      <circle cx="563" cy="375" r="17" fill="url(#uranusGrad)" />
      <!-- Vertical-ish thin rings -->
      <ellipse cx="563" cy="375" rx="4" ry="26" transform="rotate(25, 563, 375)" fill="none" stroke="#94a3b8" stroke-width="1.2" opacity="0.6" pointer-events="none" />
    </g>

    <!-- Neptune -->
    <g class="svg-object-7">
      <circle cx="653" cy="429" r="16" fill="url(#neptuneGrad)" />
      <!-- Great Dark Spot -->
      <ellipse cx="649" cy="425" rx="3" ry="2" fill="#0f172a" opacity="0.5" pointer-events="none" />
    </g>
  </svg>`;

  const questionText = `Which planet is ${targetPlanet.label}?`;
  const solutionText = `${targetPlanet.label} is ${targetPlanet.desc}. Count outward from the Sun: Mercury (1st), Venus (2nd), Earth (3rd), Mars (4th), Jupiter (5th), Saturn (6th), Uranus (7th), and Neptune (8th).`;

  return {
    type: 'mcq',
    interaction: 'hotspot_select',
    questionText,
    parts: [
      { type: 'text', content: questionText },
      {
        type: 'hotspot_canvas',
        backgroundSvg,
        canvasWidth: CW,
        canvasHeight: CH,
        hotspots,
      },
    ],
    options: PLANETS.map(p => ({
      id: p.id,
      label: p.label
    })),
    answer: targetPlanet.id,
    correctAnswerIndex: targetIndex,
    solution: {
      sections: [
        { type: 'text', content: solutionText }
      ]
    }
  };
}
