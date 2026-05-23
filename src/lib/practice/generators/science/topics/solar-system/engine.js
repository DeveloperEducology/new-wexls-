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
  const CH = 450;

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
      label: planet.label
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
