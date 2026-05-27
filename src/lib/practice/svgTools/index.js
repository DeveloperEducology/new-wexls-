const DEFS = `
  <defs>
    <!-- Steel Metallic Gradient -->
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="30%" stop-color="#cbd5e1" />
      <stop offset="70%" stop-color="#64748b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    
    <!-- Chrome Bezel Gradient -->
    <linearGradient id="chromeBezel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <!-- Glass Reflection Gradient -->
    <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Golden Liquid Gradient -->
    <linearGradient id="yellowLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Water Liquid Gradient -->
    <linearGradient id="waterLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.9" />
    </linearGradient>

    <!-- Wood Texture Gradient -->
    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
  </defs>
`.trim();

const svg = (body, viewBox = '0 0 240 160') => `
  <svg viewBox="${viewBox}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img">
    ${DEFS}
    ${normalizeSvgNumbers(body)}
  </svg>
`.trim();

const normalizeSvgNumbers = (markup) => String(markup || '').replace(/-?\d+\.\d{4,}/g, (value) => (
  Number(value).toFixed(3).replace(/\.?0+$/, '')
));

const labelText = (label, showLabel = true) => showLabel ? `
  <text x="120" y="148" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="600" fill="#475569" letter-spacing="0.5">${label.toUpperCase()}</text>
` : '';

export const SVG_TOOL_REGISTRY = {
  inch_ruler: {
    id: 'inch_ruler',
    label: 'inch ruler',
    category: 'measurement',
    defaultProps: { length: 4 },
    interactiveSpec: {
      type: 'linear-horizontal',
      valKey: 'length',
      min: 0,
      max: 6,
      xMin: 24,
      xMax: 216,
      step: 0.25
    },
    svg: ''
  },

  centimeter_ruler: {
    id: 'centimeter_ruler',
    label: 'centimeter ruler',
    category: 'measurement',
    defaultProps: { length: 8 },
    interactiveSpec: {
      type: 'linear-horizontal',
      valKey: 'length',
      min: 0,
      max: 15,
      xMin: 26,
      xMax: 213.5,
      step: 0.5
    },
    svg: ''
  },

  measuring_tape: {
    id: 'measuring_tape',
    label: 'measuring tape',
    category: 'measurement',
    defaultProps: { length: 7, unit: 'ft' },
    interactiveSpec: {
      type: 'linear-horizontal',
      valKey: 'length',
      min: 1,
      max: 12,
      xMin: 108,
      xMax: 213,
      step: 1
    },
    svg: ''
  },

  protractor: {
    id: 'protractor',
    label: 'protractor',
    category: 'geometry',
    defaultProps: { angle: 60 },
    interactiveSpec: {
      type: 'protractor-angular',
      valKey: 'angle',
      min: 0,
      max: 180,
      centerX: 120,
      centerY: 110,
      step: 5
    },
    svg: ''
  },

  compass: {
    id: 'compass',
    label: 'compass',
    category: 'geometry',
    defaultProps: { radius: 4 },
    interactiveSpec: {
      type: 'linear-horizontal',
      valKey: 'radius',
      min: 2,
      max: 8,
      xMin: 90,
      xMax: 150,
      step: 0.5
    },
    svg: ''
  },

  thermometer: {
    id: 'thermometer',
    label: 'thermometer',
    category: 'measurement',
    defaultProps: { temperature: 20, unit: 'C', min: 0, max: 60 },
    interactiveSpec: {
      type: 'linear-vertical',
      valKey: 'temperature',
      minKey: 'min',
      maxKey: 'max',
      yMin: 110,
      yMax: 35,
      step: 1
    },
    svg: ''
  },

  thermometer_dial: {
    id: 'thermometer_dial',
    label: 'dial thermometer',
    category: 'measurement',
    defaultProps: { temperature: 20, unit: 'C', min: 0, max: 60 },
    interactiveSpec: {
      type: 'angular',
      valKey: 'temperature',
      min: 0,
      max: 60,
      centerX: 120,
      centerY: 80
    },
    svg: ''
  },

  balance_scale: {
    id: 'balance_scale',
    label: 'balance scale',
    category: 'measurement',
    defaultProps: { leftWeight: 5, rightWeight: 8, leftLabel: 'A', rightLabel: 'B' },
    svg: ''
  },

  measuring_cup: {
    id: 'measuring_cup',
    label: 'measuring cup',
    category: 'measurement',
    defaultProps: { level: 600, capacity: 1000, unit: 'ml' },
    interactiveSpec: {
      type: 'linear-vertical',
      valKey: 'level',
      min: 0,
      maxKey: 'capacity',
      yMin: 132,
      yMax: 32
    },
    svg: ''
  },

  liter_jug: {
    id: 'liter_jug',
    label: 'liter jug',
    category: 'measurement',
    defaultProps: { level: 500, capacity: 1000, unit: 'ml' },
    interactiveSpec: {
      type: 'linear-vertical',
      valKey: 'level',
      min: 0,
      maxKey: 'capacity',
      yMin: 132,
      yMax: 32,
      step: 100
    },
    svg: ''
  },

  graduated_cylinder: {
    id: 'graduated_cylinder',
    label: 'graduated cylinder',
    category: 'measurement',
    defaultProps: { level: 60, capacity: 100, unit: 'ml' },
    interactiveSpec: {
      type: 'linear-vertical',
      valKey: 'level',
      min: 0,
      maxKey: 'capacity',
      yMin: 132,
      yMax: 32,
      step: 10
    },
    svg: ''
  },

  beaker: {
    id: 'beaker',
    label: 'beaker',
    category: 'measurement',
    defaultProps: { level: 150, capacity: 250, unit: 'ml' },
    interactiveSpec: {
      type: 'linear-vertical',
      valKey: 'level',
      min: 0,
      maxKey: 'capacity',
      yMin: 132,
      yMax: 32,
      step: 25
    },
    svg: ''
  },


  stopwatch: {
    id: 'stopwatch',
    label: 'stopwatch',
    category: 'time',
    defaultProps: { seconds: 25 },
    interactiveSpec: {
      type: 'angular',
      valKey: 'seconds',
      min: 0,
      max: 60,
      centerX: 120,
      centerY: 80
    },
    svg: ''
  },

  number_line: {
    id: 'number_line',
    label: 'number line',
    category: 'math',
    defaultProps: { min: 0, max: 5, highlight: 3, step: 1 },
    interactiveSpec: {
      type: 'linear-horizontal',
      valKey: 'highlight',
      minKey: 'min',
      maxKey: 'max',
      xMin: 42,
      xMax: 192,
      step: 1
    },
    svg: ''
  },

  ruler: {
    id: 'ruler',
    label: 'ruler',
    category: 'measurement',
    defaultProps: { length: 8, unit: 'cm' },
    svg: ''
  },
  meter_stick: {
    id: 'meter_stick',
    label: 'meter stick',
    category: 'measurement',
    defaultProps: { highlight: null },
    svg: ''
  },
  yardstick: {
    id: 'yardstick',
    label: 'yardstick',
    category: 'measurement',
    defaultProps: { highlight: null },
    svg: ''
  },
  tape_measure: {
    id: 'tape_measure',
    label: 'tape measure',
    category: 'measurement',
    defaultProps: { length: 7, unit: 'ft' },
    svg: ''
  },
  set_square: {
    id: 'set_square',
    label: 'set square',
    category: 'geometry',
    defaultProps: { angle: 90 },
    svg: ''
  },
  digital_scale: {
    id: 'digital_scale',
    label: 'digital scale',
    category: 'measurement',
    defaultProps: { weight: 5.2, unit: 'kg', label: '' },
    svg: ''
  },
  spring_scale: {
    id: 'spring_scale',
    label: 'spring scale',
    category: 'measurement',
    defaultProps: { weight: 4.5, unit: 'lbs', maxWeight: 10 },
    svg: ''
  },
  clock: {
    id: 'clock',
    label: 'clock',
    category: 'time',
    defaultProps: { hour: 10, minute: 10, showDigital: false },
    svg: ''
  },
  pipette: {
    id: 'pipette',
    label: 'pipette',
    category: 'science',
    defaultProps: { level: 2, capacity: 5, color: '#38bdf8' },
    svg: ''
  },
  magnifying_glass: {
    id: 'magnifying_glass',
    label: 'magnifying glass',
    category: 'science',
    defaultProps: { text: '5x' },
    svg: ''
  },
  ten_frame: {
    id: 'ten_frame',
    label: 'ten frame',
    category: 'math',
    defaultProps: { count: 6, color: '#ef4444' },
    svg: ''
  },
  base_ten_blocks: {
    id: 'base_ten_blocks',
    label: 'base ten blocks',
    category: 'math',
    defaultProps: { thousands: 0, hundreds: 1, tens: 3, ones: 5 },
    svg: ''
  },
  fraction_strips: {
    id: 'fraction_strips',
    label: 'fraction strips',
    category: 'math',
    defaultProps: { numerator: 2, denominator: 3, color: '#3b82f6' },
    svg: ''
  },
  fraction_circles: {
    id: 'fraction_circles',
    label: 'fraction circles',
    category: 'math',
    defaultProps: { numerator: 3, denominator: 4, color: '#3b82f6' },
    svg: ''
  },
  bar_model: {
    id: 'bar_model',
    label: 'bar model',
    category: 'math',
    defaultProps: { parts: [30, 20], labels: ['30', '20'], wholeLabel: '?' },
    svg: ''
  },
  graph_axes: {
    id: 'graph_axes',
    label: 'graph axes',
    category: 'math',
    defaultProps: { type: 'bar', labels: ['A', 'B', 'C'], values: [10, 20, 15], maxY: 25 },
    svg: ''
  },
  coordinate_grid: {
    id: 'coordinate_grid',
    label: 'coordinate grid',
    category: 'math',
    defaultProps: { x: 2, y: 3 },
    svg: ''
  },
  tally_chart: {
    id: 'tally_chart',
    label: 'tally chart',
    category: 'math',
    defaultProps: { data: [{ label: 'Apples', count: 7 }, { label: 'Bananas', count: 4 }] },
    svg: ''
  },
  pictograph_icons: {
    id: 'pictograph_icons',
    label: 'pictograph icons',
    category: 'math',
    defaultProps: { data: [{ label: 'Red', count: 6 }, { label: 'Blue', count: 4 }], icon: 'apple', valuePerIcon: 2 },
    svg: ''
  },
  cube_train: {
    id: 'cube_train',
    label: 'cube train',
    category: 'measurement',
    defaultProps: { cubesCount: 5, orientation: 'horizontal', objectLength: 4.3, objectType: 'crayon' },
    svg: ''
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

const dynamicRenderers = {
  inch_ruler: ({ length = 4, objectLength, objectOffset = 0, objectType = 'pencil', showLabel = true } = {}) => {
    const lenVal = objectLength !== undefined ? objectLength : length;
    const measuredLength = clamp(lenVal, 0, 6);
    const offset = clamp(objectOffset, 0, 6);
    const rulerZeroX = 24;
    const pxPerInch = 32;
    const objStartX = rulerZeroX + offset * pxPerInch;
    const objEndX = objStartX + measuredLength * pxPerInch;
    
    const drawObject = (type, x, y, w, h) => {
      if (type === 'crayon') {
        const bodyW = w - 12;
        return `
          <g>
            <rect x="${x}" y="${y}" width="${bodyW}" height="10" rx="1.5" fill="#3b82f6" stroke="#2563eb" stroke-width="0.5" />
            <path d="M${x + bodyW} ${y} L${x + bodyW + 12} ${y + 5} L${x + bodyW} ${y + 10} Z" fill="#2563eb" />
            ${bodyW > 20 ? `<rect x="${x + 4}" y="${y}" width="${bodyW - 8}" height="10" fill="#93c5fd" />` : ''}
          </g>
        `;
      }
      if (type === 'key') {
        return `
          <g transform="translate(${x}, ${y - 4})">
            <circle cx="10" cy="9" r="8" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5" />
            <circle cx="10" cy="9" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="1" />
            <rect x="18" y="7" width="${w - 18}" height="4" fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
            <rect x="${w - 10}" y="11" width="3" height="4" fill="#64748b" />
            <rect x="${w - 5}" y="11" width="3" height="5" fill="#64748b" />
          </g>
        `;
      }
      // default pencil
      const bodyW = w - 15;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${bodyW}" height="10" fill="#facc15" stroke="#ca8a04" stroke-width="0.75" />
          <path d="M${x + bodyW} ${y} L${x + bodyW + 15} ${y + 5} L${x + bodyW} ${y + 10} Z" fill="#fed7aa" stroke="#c2410c" stroke-width="0.5" />
          <path d="M${x + bodyW + 10} ${y + 3.3} L${x + bodyW + 15} ${y + 5} L${x + bodyW + 10} ${y + 6.7} Z" fill="#1e293b" />
          ${bodyW > 8 ? `<rect x="${x}" y="${y}" width="8" height="10" fill="#f43f5e" rx="1" />` : ''}
          ${bodyW > 12 ? `<rect x="${x + 8}" y="${y}" width="4" height="10" fill="#94a3b8" />` : ''}
        </g>
      `;
    };

    return svg(`
      <!-- Ruler Body (Semi-transparent Glass/Acrylic Plastic) -->
      <rect x="15" y="50" width="210" height="48" rx="6" fill="#fef08a" fill-opacity="0.3" stroke="#eab308" stroke-width="2.5" />
      <path d="M 16 51 L 224 51 L 224 64 L 16 68 Z" fill="#ffffff" fill-opacity="0.25" />
      
      <!-- Measured Object -->
      ${measuredLength > 0 ? `
        ${drawObject(objectType, objStartX, 30, measuredLength * pxPerInch, 10)}
        <!-- Dashed alignment lines -->
        <line x1="${objStartX}" y1="28" x2="${objStartX}" y2="98" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3" />
        <line x1="${objEndX}" y1="28" x2="${objEndX}" y2="98" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3" />
      ` : ''}

      <!-- Ticks -->
      ${Array.from({ length: 49 }, (_, i) => {
        const x = rulerZeroX + i * 4; // 8 divisions per inch (32px per inch) -> 4px per division
        const isInch = i % 8 === 0;
        const isHalf = i % 4 === 0 && !isInch;
        const isQuarter = i % 2 === 0 && !isInch && !isHalf;
        const h = isInch ? 18 : isHalf ? 13 : isQuarter ? 9 : 6;
        return `<line x1="${x}" y1="50" x2="${x}" y2="${50 + h}" stroke="#334155" stroke-width="${isInch ? 1.6 : 0.8}" />`;
      }).join('')}

      <!-- Numbers -->
      <g font-family="Outfit, system-ui, sans-serif" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">
        ${Array.from({ length: 7 }, (_, i) => `<text x="${rulerZeroX + i * pxPerInch}" y="82">${i}</text>`).join('')}
        <text x="212" y="82" fill="#ca8a04">in</text>
      </g>
      ${labelText('inch ruler', showLabel)}
    `);
  },

  centimeter_ruler: ({ length = 8, objectLength, objectOffset = 0, objectType = 'crayon', showLabel = true } = {}) => {
    const lenVal = objectLength !== undefined ? objectLength : length;
    const measuredLength = clamp(lenVal, 0, 15);
    const offset = clamp(objectOffset, 0, 15);
    const rulerZeroX = 26;
    const pxPerCm = 12.5;
    const objStartX = rulerZeroX + offset * pxPerCm;
    const objEndX = objStartX + measuredLength * pxPerCm;

    const drawObject = (type, x, y, w, h) => {
      if (type === 'crayon') {
        const bodyW = w - 12;
        return `
          <g>
            <rect x="${x}" y="${y}" width="${bodyW}" height="10" rx="1.5" fill="#3b82f6" stroke="#2563eb" stroke-width="0.5" />
            <path d="M${x + bodyW} ${y} L${x + bodyW + 12} ${y + 5} L${x + bodyW} ${y + 10} Z" fill="#2563eb" />
            ${bodyW > 20 ? `<rect x="${x + 4}" y="${y}" width="${bodyW - 8}" height="10" fill="#93c5fd" />` : ''}
          </g>
        `;
      }
      if (type === 'key') {
        return `
          <g transform="translate(${x}, ${y - 4})">
            <circle cx="10" cy="9" r="8" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5" />
            <circle cx="10" cy="9" r="3.5" fill="#f8fafc" stroke="#475569" stroke-width="1" />
            <rect x="18" y="7" width="${w - 18}" height="4" fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
            <rect x="${w - 10}" y="11" width="3" height="4" fill="#64748b" />
            <rect x="${w - 5}" y="11" width="3" height="5" fill="#64748b" />
          </g>
        `;
      }
      // default pencil
      const bodyW = w - 15;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${bodyW}" height="10" fill="#facc15" stroke="#ca8a04" stroke-width="0.75" />
          <path d="M${x + bodyW} ${y} L${x + bodyW + 15} ${y + 5} L${x + bodyW} ${y + 10} Z" fill="#fed7aa" stroke="#c2410c" stroke-width="0.5" />
          <path d="M${x + bodyW + 10} ${y + 3.3} L${x + bodyW + 15} ${y + 5} L${x + bodyW + 10} ${y + 6.7} Z" fill="#1e293b" />
          ${bodyW > 8 ? `<rect x="${x}" y="${y}" width="8" height="10" fill="#f43f5e" rx="1" />` : ''}
          ${bodyW > 12 ? `<rect x="${x + 8}" y="${y}" width="4" height="10" fill="#94a3b8" />` : ''}
        </g>
      `;
    };

    return svg(`
      <!-- Ruler Body (Semi-transparent Blue Glass) -->
      <rect x="15" y="50" width="210" height="48" rx="6" fill="#e0f2fe" fill-opacity="0.3" stroke="#0284c7" stroke-width="2.5" />
      <path d="M 16 51 L 224 51 L 224 64 L 16 68 Z" fill="#ffffff" fill-opacity="0.25" />

      <!-- Measured Object -->
      ${measuredLength > 0 ? `
        ${drawObject(objectType, objStartX, 30, measuredLength * pxPerCm, 10)}
        <!-- Dashed alignment lines -->
        <line x1="${objStartX}" y1="28" x2="${objStartX}" y2="98" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3" />
        <line x1="${objEndX}" y1="28" x2="${objEndX}" y2="98" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3" />
      ` : ''}

      <!-- Ticks -->
      ${Array.from({ length: 151 }, (_, i) => {
        const x = rulerZeroX + i * 1.25; // 10 divisions per cm (12.5px per cm) -> 1.25px per mm
        const isCm = i % 10 === 0;
        const isHalfCm = i % 5 === 0 && !isCm;
        const h = isCm ? 18 : isHalfCm ? 12 : 7;
        return `<line x1="${x}" y1="50" x2="${x}" y2="${50 + h}" stroke="#334155" stroke-width="${isCm ? 1.4 : 0.7}" />`;
      }).join('')}

      <!-- Numbers -->
      <g font-family="Outfit, system-ui, sans-serif" font-size="8.5" font-weight="500" fill="#334155" text-anchor="middle">
        ${Array.from({ length: 16 }, (_, i) => `<text x="${rulerZeroX + i * pxPerCm}" y="82">${i}</text>`).join('')}
      </g>
      ${labelText('centimeter ruler', showLabel)}
    `);
  },

  measuring_tape: ({ length = 7, unit = 'ft', showLabel = true } = {}) => {
    const displayLength = clamp(length, 1, 12);
    return svg(`
      <!-- Steel tape belt clip / housing back shadow -->
      <rect x="35" y="32" width="76" height="76" rx="14" fill="#1e293b" opacity="0.15" />
      
      <!-- Main tape housing -->
      <rect x="30" y="28" width="76" height="76" rx="14" fill="#fbbf24" stroke="#cbd5e1" stroke-width="3.5" />
      <!-- Black rubber grips -->
      <path d="M 30 42 C 45 42 45 90 30 90 Z" fill="#1e293b" />
      <path d="M 106 42 C 91 42 91 90 106 90 Z" fill="#1e293b" />
      <circle cx="68" cy="66" r="20" fill="url(#metalGrad)" stroke="#475569" stroke-width="2" />
      <text x="68" y="70" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="600" fill="#1e293b">16ft</text>

      <!-- Extending yellow steel tape -->
      <path d="M 106 82 Q 130 82 170 65 L 170 77 Q 130 94 106 94 Z" fill="url(#yellowLiquid)" stroke="#ca8a04" stroke-width="1" />
      <!-- Steel Hook at the end of extending tape -->
      <path d="M 170 65 L 175 65 L 175 83 L 170 77 Z" fill="#cbd5e1" stroke="#475569" stroke-width="1.5" />
      
      <!-- Tape tick lines -->
      <g stroke="#1e293b" stroke-width="1">
        <line x1="120" y1="81" x2="120" y2="86" />
        <line x1="135" y1="76" x2="135" y2="82" />
        <line x1="150" y1="71" x2="150" y2="77" />
      </g>

      <!-- Text indicator display -->
      <g transform="translate(108, 100)">
        <rect x="0" y="0" width="105" height="30" rx="8" fill="#1e293b" />
        <text x="52.5" y="20" text-anchor="middle" font-family="Outfit, sans-serif" font-size="14" font-weight="600" fill="#fbbf24">${displayLength} ${unit}</text>
      </g>
      ${labelText('measuring tape', showLabel)}
    `);
  },

  protractor: ({ angle = 60, showLabel = true, showAngle = false, showValue = false } = {}) => {
    const a = clamp(angle, 0, 180);
    const rad = ((180 - a) * Math.PI) / 180;
    const rayX = 120 + Math.cos(rad) * 78;
    const rayY = 110 - Math.sin(rad) * 78;
    const displayAngle = showAngle || showValue;

    return svg(`
      <!-- Outer Acrylic Arc -->
      <path d="M35 110 A85 85 0 0 1 205 110 Z" fill="#e0f2fe" fill-opacity="0.4" stroke="#0284c7" stroke-width="2.5" />
      
      <!-- Inner cut-out -->
      <path d="M55 110 A65 65 0 0 1 185 110 Z" fill="#ffffff" fill-opacity="0.8" stroke="#0284c7" stroke-width="1.5" />
      
      <!-- Base line -->
      <line x1="30" y1="110" x2="210" y2="110" stroke="#0369a1" stroke-width="3" />

      <!-- Protractor ticks -->
      ${Array.from({ length: 181 }, (_, i) => {
        const isMajor = i % 10 === 0;
        const isMedium = i % 5 === 0 && !isMajor;
        const tickRad = ((180 - i) * Math.PI) / 180;
        const startRadius = isMajor ? 73 : isMedium ? 77 : 80;
        const endRadius = 85;
        
        const x1 = 120 + Math.cos(tickRad) * startRadius;
        const y1 = 110 - Math.sin(tickRad) * startRadius;
        const x2 = 120 + Math.cos(tickRad) * endRadius;
        const y2 = 110 - Math.sin(tickRad) * endRadius;
        
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#0369a1" stroke-width="${isMajor ? 1.2 : 0.6}" />`;
      }).join('')}

      <!-- Center point bubble -->
      <circle cx="120" cy="110" r="6" fill="none" stroke="#ef4444" stroke-width="1.5" />
      <line x1="114" y1="110" x2="126" y2="110" stroke="#ef4444" stroke-width="1" />
      <line x1="120" y1="104" x2="120" y2="116" stroke="#ef4444" stroke-width="1" />

      <!-- Laser/indicator line pointer -->
      <line x1="120" y1="110" x2="${rayX.toFixed(1)}" y2="${rayY.toFixed(1)}" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />
      <circle cx="${rayX.toFixed(1)}" cy="${rayY.toFixed(1)}" r="4.5" fill="#ef4444" />

       <!-- Text Label of current Angle -->
      ${displayAngle ? `
        <rect x="95" y="122" width="50" height="20" rx="5" fill="#1e293b" />
        <text x="120" y="136" text-anchor="middle" font-family="Outfit, sans-serif" font-size="12" font-weight="600" fill="#f8fafc">${a}°</text>
      ` : ''}
      
      <!-- Double scale angle numbers (Selected) -->
      ${Array.from({ length: 19 }, (_, i) => {
        const angleValue = i * 10;
        const angleRad = ((180 - angleValue) * Math.PI) / 180;
        
        const outerX = 120 + Math.cos(angleRad) * 66;
        const outerY = 110 - Math.sin(angleRad) * 66;
        const innerX = 120 + Math.cos(angleRad) * 52;
        const innerY = 110 - Math.sin(angleRad) * 52;
        
        return `
          <text x="${outerX.toFixed(1)}" y="${(outerY + 3).toFixed(1)}" text-anchor="middle" font-family="Outfit, sans-serif" font-size="7" font-weight="500" fill="#0f172a">${angleValue}</text>
          <text x="${innerX.toFixed(1)}" y="${(innerY + 3).toFixed(1)}" text-anchor="middle" font-family="Outfit, sans-serif" font-size="6" font-weight="500" fill="#0284c7">${180 - angleValue}</text>
        `;
      }).join('')}
      ${labelText('protractor', showLabel)}
    `);
  },

  compass: ({ radius = 4, showLabel = true, showRadius = false, showValue = false } = {}) => {
    const r = clamp(radius, 2, 8);
    const displayRadius = showRadius || showValue;
    return svg(`
      <!-- Drawn Circle / Arc -->
      <circle cx="120" cy="110" r="${r * 9}" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.75" />
      
      <!-- Joint center screw -->
      <circle cx="120" cy="38" r="8" fill="url(#metalGrad)" stroke="#475569" stroke-width="1" />
      <circle cx="120" cy="38" r="3" fill="#e2e8f0" />
      
      <!-- Compass Legs -->
      <!-- Left leg with point -->
      <line x1="116" y1="42" x2="90" y2="110" stroke="#64748b" stroke-width="5" stroke-linecap="round" />
      <line x1="90" y1="110" x2="88" y2="124" stroke="#475569" stroke-width="2" stroke-linecap="round" />
      <line x1="88" y1="124" x2="88" y2="132" stroke="#1e293b" stroke-width="1" />

      <!-- Right leg with pencil -->
      <line x1="124" y1="42" x2="150" y2="100" stroke="#64748b" stroke-width="5" stroke-linecap="round" />
      <circle cx="150" cy="100" r="5" fill="#facc15" stroke="#854d0e" stroke-width="1.5" />
      
      <g transform="translate(142, 95) rotate(15)">
        <rect x="0" y="0" width="8" height="24" fill="#ef4444" rx="1" />
        <path d="M 0 24 L 4 30 L 8 24 Z" fill="#ffedd5" />
        <path d="M 3 28.5 L 4 30 L 5 28.5 Z" fill="#1e293b" />
      </g>

      <!-- Label details -->
      ${displayRadius ? `
        <rect x="90" y="132" width="60" height="18" rx="6" fill="#e0f2fe" stroke="#bae6fd" />
        <text x="120" y="145" text-anchor="middle" font-family="Outfit, sans-serif" font-size="10" font-weight="600" fill="#0369a1">r = ${r} cm</text>
      ` : ''}
      ${labelText('compass', showLabel)}
    `);
  },

  thermometer: ({ temperature = 20, unit = 'C', min = 0, max = 60, showLabel = true, showTemperature = false, showValue = false } = {}) => {
    const temp = clamp(temperature, min, max);
    const ratio = (temp - min) / Math.max(1, max - min);
    const liquidTop = 110 - ratio * 75;
    const displayTemp = showTemperature || showValue;

    return svg(`
      <!-- Casing background -->
      <rect x="92" y="15" width="56" height="122" rx="20" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="3" />
      
      <!-- Ticks on the right side of the tube -->
      <g stroke="#64748b" stroke-width="1">
        ${Array.from({ length: 7 }, (_, i) => {
          const val = min + i * ((max - min) / 6);
          const y = 110 - (i / 6) * 75;
          return `
            <line x1="130" y1="${y}" x2="140" y2="${y}" stroke-width="1.8" />
            <text x="143" y="${y + 3}" font-family="Outfit, sans-serif" font-size="8.5" font-weight="500" fill="#475569">${Math.round(val)}</text>
          `;
        }).join('')}
        ${Array.from({ length: 31 }, (_, i) => {
          if (i % 5 === 0) return '';
          const y = 110 - (i / 30) * 75;
          return `<line x1="130" y1="${y}" x2="135" y2="${y}" stroke-width="0.8" />`;
        }).join('')}
      </g>

      <!-- Glass tube capsule -->
      <rect x="114" y="24" width="12" height="92" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
      <!-- Bulb at the bottom -->
      <circle cx="120" cy="116" r="16" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />

      <!-- Yellow Fluid inside -->
      <rect x="116.5" y="${liquidTop.toFixed(1)}" width="7" height="${(116 - liquidTop).toFixed(1)}" rx="3.5" fill="url(#yellowLiquid)" />
      <circle cx="120" cy="116" r="12" fill="url(#yellowLiquid)" />
      
      <!-- Bulb glow reflection -->
      <circle cx="117" cy="113" r="5" fill="#ffffff" fill-opacity="0.3" />

      <!-- Current Temperature Text box -->
      ${displayTemp ? `
        <rect x="52" y="55" width="36" height="22" rx="5" fill="#1e293b" />
        <text x="70" y="70" text-anchor="middle" font-family="Outfit, sans-serif" font-size="11" font-weight="600" fill="#eab308">${Math.round(temp)}°${unit}</text>
      ` : ''}

      ${labelText('thermometer', showLabel)}
    `);
  },

  thermometer_dial: ({ temperature = 20, unit = 'C', min = 0, max = 60, showLabel = true, showTemperature = false, showValue = false } = {}) => {
    const temp = clamp(temperature, min, max);
    const angle = ((temp - min) / (max - min)) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const needleX = 120 + Math.cos(rad) * 38;
    const needleY = 80 + Math.sin(rad) * 38;
    const displayTemp = showTemperature || showValue;

    return svg(`
      <!-- Black outer casing -->
      <circle cx="120" cy="80" r="55" fill="#1e293b" stroke="url(#chromeBezel)" stroke-width="4" />
      <!-- Inner silver bezel ring -->
      <circle cx="120" cy="80" r="51" fill="#cbd5e1" />
      <!-- Dial plate -->
      <circle cx="120" cy="80" r="47" fill="#f8fafc" />

      <!-- Ticks and numbers around the dial -->
      ${Array.from({ length: 60 }, (_, i) => {
        const tickAngle = (i / 60) * 360 - 90;
        const tickRad = (tickAngle * Math.PI) / 180;
        const isMajor = i % 10 === 0;
        const isMedium = i % 5 === 0 && !isMajor;
        
        const startR = isMajor ? 38 : isMedium ? 41 : 44;
        const endR = 47;
        
        const x1 = 120 + Math.cos(tickRad) * startR;
        const y1 = 80 + Math.sin(tickRad) * startR;
        const x2 = 120 + Math.cos(tickRad) * endR;
        const y2 = 80 + Math.sin(tickRad) * endR;

        let numberLabel = '';
        if (isMajor) {
          const numR = 29;
          const numX = 120 + Math.cos(tickRad) * numR;
          const numY = 80 + Math.sin(tickRad) * numR;
          const labelVal = Math.round(min + (i / 60) * (max - min));
          numberLabel = `<text x="${numX}" y="${numY + 3.5}" text-anchor="middle" font-family="Outfit" font-size="8.5" font-weight="500" fill="#0f172a">${labelVal}</text>`;
        }
        
        return `
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="${isMajor ? 1.5 : 0.8}" />
          ${numberLabel}
        `;
      }).join('')}

      <!-- Center spindle -->
      <circle cx="120" cy="80" r="6" fill="#475569" />
      
      <!-- Needle pointer (Orange) -->
      <line x1="120" y1="80" x2="${needleX}" y2="${needleY}" stroke="#f97316" stroke-width="3" stroke-linecap="round" />
      <circle cx="120" cy="80" r="3.5" fill="#facc15" />

      <!-- Current reading digital overlay -->
      ${displayTemp ? `
        <rect x="100" y="105" width="40" height="15" rx="4" fill="#0f172a" />
        <text x="120" y="116" text-anchor="middle" font-family="Outfit" font-size="10" font-weight="600" fill="#facc15">${Math.round(temp)}°${unit}</text>
      ` : ''}

      ${labelText('dial thermometer', showLabel)}
    `, '0 0 240 160');
  },

  balance_scale: ({ leftWeight = 5, rightWeight = 8, leftLabel = 'A', rightLabel = 'B', showLabel = true, showWeights = false, showValue = false } = {}) => {
    const left = Number(leftWeight);
    const right = Number(rightWeight);
    const tilt = clamp((right - left) * 2.4, -14, 14);
    const displayWeights = showWeights || showValue;
    const rad = (tilt * Math.PI) / 180;
    
    // Core geometry
    const armLength = 55;
    const leftBeamX = 120 - armLength * Math.cos(rad);
    const leftBeamY = 48 - armLength * Math.sin(rad);
    const rightBeamX = 120 + armLength * Math.cos(rad);
    const rightBeamY = 48 + armLength * Math.sin(rad);
    
    const panH = 43;
    const leftPanX = leftBeamX;
    const leftPanY = leftBeamY + panH;
    const rightPanX = rightBeamX;
    const rightPanY = rightBeamY + panH;

    // Helper to render stacked blocks for count practice
    const drawBlocks = (panX, panY, count, isLeft) => {
      const roundedCount = Math.round(count);
      if (roundedCount <= 0) return '';
      
      let blocks = '';
      const blockW = 10;
      const blockH = 8;
      const stroke = '#1e293b';
      
      const colors = isLeft 
        ? ['#f87171', '#fca5a5', '#ef4444', '#f87171', '#fca5a5']
        : ['#60a5fa', '#93c5fd', '#3b82f6', '#60a5fa', '#93c5fd'];
      
      const positions = [];
      
      if (roundedCount === 1) {
        positions.push({ dx: 0, dy: -blockH });
      } else if (roundedCount === 2) {
        positions.push({ dx: -blockW / 2 - 1, dy: -blockH });
        positions.push({ dx: blockW / 2 + 1, dy: -blockH });
      } else if (roundedCount === 3) {
        positions.push({ dx: -blockW - 1, dy: -blockH });
        positions.push({ dx: 0, dy: -blockH });
        positions.push({ dx: blockW + 1, dy: -blockH });
      } else if (roundedCount === 4) {
        positions.push({ dx: -blockW - 1, dy: -blockH });
        positions.push({ dx: 0, dy: -blockH });
        positions.push({ dx: blockW + 1, dy: -blockH });
        positions.push({ dx: 0, dy: -2 * blockH - 1 });
      } else if (roundedCount === 5) {
        positions.push({ dx: -blockW - 1, dy: -blockH });
        positions.push({ dx: 0, dy: -blockH });
        positions.push({ dx: blockW + 1, dy: -blockH });
        positions.push({ dx: -blockW / 2 - 0.5, dy: -2 * blockH - 1 });
        positions.push({ dx: blockW / 2 + 0.5, dy: -2 * blockH - 1 });
      } else if (roundedCount === 6) {
        positions.push({ dx: -blockW - 1, dy: -blockH });
        positions.push({ dx: 0, dy: -blockH });
        positions.push({ dx: blockW + 1, dy: -blockH });
        positions.push({ dx: -blockW / 2 - 0.5, dy: -2 * blockH - 1 });
        positions.push({ dx: blockW / 2 + 0.5, dy: -2 * blockH - 1 });
        positions.push({ dx: 0, dy: -3 * blockH - 2 });
      } else {
        let remaining = roundedCount;
        let row = 0;
        while (remaining > 0) {
          const rowCount = Math.min(remaining, 4 - row);
          if (rowCount <= 0) break;
          const startDx = -((rowCount - 1) * (blockW + 1)) / 2;
          for (let i = 0; i < rowCount; i++) {
            positions.push({
              dx: startDx + i * (blockW + 1),
              dy: -(row + 1) * blockH - row
            });
          }
          remaining -= rowCount;
          row++;
        }
      }

      positions.forEach((pos, idx) => {
        const fill = colors[idx % colors.length];
        blocks += `<rect x="${(panX + pos.dx - blockW / 2).toFixed(1)}" y="${(panY + pos.dy).toFixed(1)}" width="${blockW}" height="${blockH}" rx="1.5" fill="${fill}" stroke="${stroke}" stroke-width="1" />`;
      });

      return blocks;
    };

    // Render beautiful 3D-ish weight cylinders when numbers are shown or too large to stack
    const drawWeightCylinder = (panX, panY, label, weight, fill, topFill) => {
      return `
        <g>
          <!-- Cylindrical weight body -->
          <rect x="${panX - 16}" y="${panY - 24}" width="32" height="22" rx="3" fill="${fill}" stroke="#1e293b" stroke-width="1.8" />
          <!-- 3D top lid -->
          <ellipse cx="${panX}" cy="${panY - 24}" rx="16" ry="4" fill="${topFill}" stroke="#1e293b" stroke-width="1" />
          <!-- Label and value text -->
          <text x="${panX}" y="${panY - 14}" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="700" fill="#ffffff">${label}</text>
          <text x="${panX}" y="${panY - 5}" text-anchor="middle" font-family="Outfit" font-size="8.5" font-weight="900" fill="#ffffff">${weight}</text>
        </g>
      `;
    };

    const leftPanContent = (displayWeights || left > 10)
      ? drawWeightCylinder(leftPanX, leftPanY, leftLabel, left, '#ef4444', '#fca5a5')
      : drawBlocks(leftPanX, leftPanY, left, true);

    const rightPanContent = (displayWeights || right > 10)
      ? drawWeightCylinder(rightPanX, rightPanY, rightLabel, right, '#3b82f6', '#93c5fd')
      : drawBlocks(rightPanX, rightPanY, right, false);

    return svg(`
      <!-- Wooden Base pedestal -->
      <rect x="60" y="122" width="120" height="10" rx="3" fill="#7c2d12" stroke="#451a03" stroke-width="2" />
      
      <!-- Central Pillar Stand (Tapered high-contrast column) -->
      <polygon points="108,122 132,122 125,48 115,48" fill="#475569" stroke="#1e293b" stroke-width="2.5" />
      <line x1="120" y1="48" x2="120" y2="122" stroke="#334155" stroke-width="1.5" />

      <!-- Pivot assembly -->
      <g transform="rotate(${tilt} 120 48)">
        <!-- Horizontal Beam -->
        <line x1="58" y1="48" x2="182" y2="48" stroke="#1e293b" stroke-width="5.5" stroke-linecap="round" />
        <!-- Gold Pivot cap -->
        <circle cx="120" cy="48" r="8" fill="#eab308" stroke="#1e293b" stroke-width="2" />
        <circle cx="120" cy="48" r="3" fill="#fef08a" />
      </g>

      <!-- Left hanging cord and pan -->
      <g stroke="#475569" stroke-width="1.8">
        <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX - 20}" y2="${leftPanY}" />
        <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX + 20}" y2="${leftPanY}" />
      </g>
      <!-- Left Pan -->
      <path d="M ${leftPanX - 25} ${leftPanY} L ${leftPanX + 25} ${leftPanY} Q ${leftPanX} ${leftPanY + 12} ${leftPanX - 25} ${leftPanY} Z" fill="#cbd5e1" stroke="#1e293b" stroke-width="2" />
      <!-- Left Pan content -->
      ${leftPanContent}

      <!-- Right hanging cord and pan -->
      <g stroke="#475569" stroke-width="1.8">
        <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX - 20}" y2="${rightPanY}" />
        <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX + 20}" y2="${rightPanY}" />
      </g>
      <!-- Right Pan -->
      <path d="M ${rightPanX - 25} ${rightPanY} L ${rightPanX + 25} ${rightPanY} Q ${rightPanX} ${rightPanY + 12} ${rightPanX - 25} ${rightPanY} Z" fill="#cbd5e1" stroke="#1e293b" stroke-width="2" />
      <!-- Right Pan content -->
      ${rightPanContent}

      <!-- Left Weight Label Box (kept for backward compatibility & alignment) -->
      <rect x="35" y="14" width="56" height="18" rx="5" fill="#f87171" stroke="#1e293b" stroke-width="1.2" />
      <text x="63" y="27" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="600" fill="#ffffff">${leftLabel}${displayWeights ? ': ' + left : ''}</text>

      <!-- Right Weight Label Box (kept for backward compatibility & alignment) -->
      <rect x="149" y="14" width="56" height="18" rx="5" fill="#60a5fa" stroke="#1e293b" stroke-width="1.2" />
      <text x="177" y="27" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="600" fill="#ffffff">${rightLabel}${displayWeights ? ': ' + right : ''}</text>

      ${labelText('balance scale', showLabel)}
    `);
  },

  measuring_cup: ({ level = 300, capacity = 500, unit = 'ml', showLabel = true, showVolume = false, showValue = false } = {}) => {
    const cap = Math.max(1, Number(capacity));
    const amount = clamp(level, 0, cap);
    const ratio = amount / cap;
    const displayVolume = showVolume || showValue;

    const scaleHeight = 100;
    const yFloor = 132;
    const yCeiling = 32;
    const fillY = yFloor - scaleHeight * ratio;

    const drawWater = () => {
      if (amount <= 0) return '';
      const t = (yFloor - fillY) / scaleHeight;
      const xLeft = 76 - t * 16;
      const xRight = 152 + t * 16;

      const drawBubble = (cx, cy, r) => {
        if (cy >= 131) return '';
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="#ffffff" fill-opacity="0.75" stroke="#003087" stroke-width="0.3" />`;
      };

      return `
        <!-- Translucent Water body -->
        <path d="M ${xLeft.toFixed(1)} ${fillY.toFixed(1)} L ${xRight.toFixed(1)} ${fillY.toFixed(1)} L 152 132 Q 114 135 76 132 Z" fill="url(#waterLiquid)" />
        <!-- Meniscus top ellipse -->
        <ellipse cx="${((xLeft + xRight) / 2).toFixed(1)}" cy="${fillY.toFixed(1)}" rx="${((xRight - xLeft) / 2).toFixed(1)}" ry="4.5" fill="#a5f3fc" fill-opacity="0.65" stroke="#38bdf8" stroke-width="0.5" />
        
        <!-- Animated-style Bubbles inside water level -->
        ${drawBubble(xRight - 15, fillY + 12, 2)}
        ${drawBubble(xRight - 10, fillY + 22, 1.5)}
        ${drawBubble(xRight - 18, fillY + 34, 2.5)}
        ${drawBubble(xRight - 14, fillY + 48, 1.5)}
        ${drawBubble(xRight - 22, fillY + 58, 2)}
      `;
    };

    return svg(`
      <!-- Thick glass handle on the right side (blended curves + inner highlight) -->
      <path d="M 166 40 C 205 40 205 110 151 114 L 152 102 C 190 100 190 50 164 50 Z" fill="#ffffff" fill-opacity="0.25" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 165 45 C 196 45 196 105 151 108" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />

      <!-- Water Liquid layer -->
      ${drawWater()}

      <!-- Thick curved bottom glass base plate (translucent white-blue fill) -->
      <path d="M 74 131 Q 114 134 154 131 L 155 133 Q 153 140 144 140 Q 106 142 68 140 Q 59 140 57 133 Z" fill="#f1f5f9" fill-opacity="0.85" stroke="#3b82f6" stroke-width="1.8" />
      <ellipse cx="114" cy="138" rx="38" ry="2" fill="#ffffff" fill-opacity="0.7" />

      <!-- Measuring Cup Glass outer silhouette (with spout lip, rounded base corners, and double-walled look) -->
      <path d="M 42 26 C 53 28, 57 30, 60 32 Q 114 26 168 26 L 172 26 L 155 133 C 153 138, 149 140, 144 140 Q 106 142 68 140 C 61 140, 58 138, 57 133 L 48 36 C 44 32, 42 29, 42 26 Z" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Inner wall highlight -->
      <path d="M 60 32 L 76 132 Q 114 135 152 132 L 168 32" fill="none" stroke="#93c5fd" stroke-width="1.2" opacity="0.8" />

      <!-- Vertical glass reflection highlights for premium realistic look -->
      <path d="M 50 36 L 73 130" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45" />
      <path d="M 166 32 L 151 130" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45" />
      <path d="M 68 138 Q 106 140 144 138" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.5" />

      <!-- Vertical Scale Line running down the cup -->
      <line x1="94" y1="32" x2="94" y2="132" stroke="#003087" stroke-width="2.2" stroke-linecap="round" />

      <!-- Scale Title -->
      <text x="114" y="21" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="900" fill="#003087" letter-spacing="0.3">MILLILITERS (ml)</text>

      <!-- Tick Marks on the Left of the Vertical Line -->
      <g stroke="#003087">
        ${(() => {
          const majorStep = cap === 250 ? 50 : cap === 500 ? 50 : 100;
          const minorStep = cap === 250 ? 10 : cap === 500 ? 10 : 20;

          let markups = [];
          for (let v = 0; v <= cap; v += minorStep) {
            const y = yFloor - (v / cap) * scaleHeight;
            const isMajor = v % majorStep === 0;

            if (isMajor) {
              // Major tick (long, labeled)
              markups.push(`
                <line x1="94" y1="${y.toFixed(1)}" x2="80" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="1.8" />
                <text x="74" y="${(y + 3).toFixed(1)}" font-family="Outfit" font-size="8.5" font-weight="700" fill="#003087" text-anchor="end">${v} ml</text>
              `);
            } else {
              // Minor tick (short, unlabeled)
              markups.push(`
                <line x1="94" y1="${y.toFixed(1)}" x2="87" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="1.0" />
              `);
            }
          }
          return markups.join('');
        })()}
      </g>

      <!-- Digital Overlay Badge -->
      ${displayVolume ? `
        <g transform="translate(178 50)">
          <rect x="0" y="0" width="46" height="28" rx="6" fill="#1e293b" />
          <text x="23" y="13.5" text-anchor="middle" font-family="Outfit" font-size="10" font-weight="600" fill="#38bdf8">${amount}</text>
          <text x="23" y="24" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="#38bdf8">${unit}</text>
        </g>
      ` : ''}
      ${labelText('measuring cup', showLabel)}
    `);
  },

  liter_jug: ({ level = 500, capacity = 1000, unit = 'ml', showLabel = true, showVolume = false, showValue = false } = {}) => {
    const cap = Math.max(1, Number(capacity));
    const amount = clamp(level, 0, cap);
    const ratio = amount / cap;
    const displayVolume = showVolume || showValue;

    const scaleHeight = 100;
    const yFloor = 132;
    const yCeiling = 32;
    const fillY = yFloor - scaleHeight * ratio;

    const drawWater = () => {
      if (amount <= 0) return '';
      const t = (yFloor - fillY) / scaleHeight;
      const xLeft = 55 - t * 5;
      const xRight = 145 + t * 5;

      const drawBubble = (cx, cy, r) => {
        if (cy >= 131) return '';
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="#ffffff" fill-opacity="0.75" stroke="#003087" stroke-width="0.3" />`;
      };

      return `
        <!-- Translucent Water body -->
        <path d="M ${xLeft.toFixed(1)} ${fillY.toFixed(1)} L ${xRight.toFixed(1)} ${fillY.toFixed(1)} L 145 132 Q 100 135 55 132 Z" fill="url(#waterLiquid)" />
        <!-- Meniscus top ellipse -->
        <ellipse cx="${((xLeft + xRight) / 2).toFixed(1)}" cy="${fillY.toFixed(1)}" rx="${((xRight - xLeft) / 2).toFixed(1)}" ry="4.5" fill="#a5f3fc" fill-opacity="0.65" stroke="#38bdf8" stroke-width="0.5" />
        
        <!-- Bubbles -->
        ${drawBubble(xRight - 15, fillY + 12, 2)}
        ${drawBubble(xRight - 10, fillY + 25, 1.5)}
        ${drawBubble(xLeft + 15, fillY + 35, 2.5)}
        ${drawBubble(xRight - 22, fillY + 48, 1.5)}
        ${drawBubble(xLeft + 22, fillY + 58, 2)}
      `;
    };

    return svg(`
      <!-- Thick glass handle on the right side -->
      <path d="M 147 42 C 190 42 190 112 145 116 L 146 104 C 176 100 176 54 148 54 Z" fill="#ffffff" fill-opacity="0.25" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M 147 47 C 179 47 179 107 146 110" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />

      <!-- Water Liquid layer -->
      ${drawWater()}

      <!-- Curved bottom glass base plate -->
      <path d="M 53 131 Q 100 134 147 131 L 148 133 Q 146 140 137 140 Q 100 142 63 140 Q 54 140 52 133 Z" fill="#f1f5f9" fill-opacity="0.85" stroke="#3b82f6" stroke-width="1.8" />
      <ellipse cx="100" cy="138" rx="36" ry="2" fill="#ffffff" fill-opacity="0.7" />

      <!-- Glass outer silhouette with wide spout lip at top left -->
      <path d="M 35 26 C 45 28, 48 30, 50 32 L 150 32 L 145 133 C 143 138, 139 140, 133 140 Q 100 142 67 140 C 61 140, 57 138, 55 133 L 50 32 C 46 30, 41 28, 35 26 Z" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Inner wall highlight -->
      <path d="M 50 32 L 55 132 Q 100 135 145 132 L 150 32" fill="none" stroke="#93c5fd" stroke-width="1.2" opacity="0.8" />

      <!-- Vertical glass reflection highlights -->
      <path d="M 43 36 L 53 130" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45" />
      <path d="M 148 32 L 144 130" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45" />
      <path d="M 63 138 Q 100 140 137 138" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.5" />

      <!-- Vertical Scale Line -->
      <line x1="75" y1="32" x2="75" y2="132" stroke="#003087" stroke-width="2.2" stroke-linecap="round" />

      <!-- Scale Title -->
      <text x="100" y="21" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="900" fill="#003087" letter-spacing="0.3">LITER JUG (${unit.toUpperCase()})</text>

      <!-- Ticks and numbers -->
      <g stroke="#003087">
        ${(() => {
          const isLiters = unit.toLowerCase() === 'l' || cap <= 10;
          const majorStep = isLiters ? 0.2 : 100;
          const minorStep = isLiters ? 0.05 : 20;

          let markups = [];
          for (let v = 0; v <= cap; v += minorStep) {
            const val = Number(v.toFixed(3));
            const y = yFloor - (val / cap) * scaleHeight;

            const stepsFromZero = Math.round(val / minorStep);
            const minorPerMajor = Math.round(majorStep / minorStep);
            const isMajor = stepsFromZero % minorPerMajor === 0;

            if (isMajor) {
              const displayVal = isLiters ? val.toFixed(1) : val;
              markups.push(`
                <line x1="75" y1="${y.toFixed(1)}" x2="63" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="1.8" />
                <text x="58" y="${(y + 3).toFixed(1)}" font-family="Outfit" font-size="8.5" font-weight="700" fill="#003087" text-anchor="end">${displayVal} ${unit}</text>
              `);
            } else {
              markups.push(`
                <line x1="75" y1="${y.toFixed(1)}" x2="69" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="1.0" />
              `);
            }
          }
          return markups.join('');
        })()}
      </g>

      <!-- Digital Overlay Badge -->
      ${displayVolume ? `
        <g transform="translate(178 50)">
          <rect x="0" y="0" width="46" height="28" rx="6" fill="#1e293b" />
          <text x="23" y="13.5" text-anchor="middle" font-family="Outfit" font-size="10" font-weight="600" fill="#38bdf8">${amount}</text>
          <text x="23" y="24" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="#38bdf8">${unit}</text>
        </g>
      ` : ''}
      ${labelText('liter jug', showLabel)}
    `);
  },

  graduated_cylinder: ({ level = 60, capacity = 100, unit = 'ml', showLabel = true, showVolume = false, showValue = false } = {}) => {
    const cap = Math.max(1, Number(capacity));
    const amount = clamp(level, 0, cap);
    const ratio = amount / cap;
    const displayVolume = showVolume || showValue;

    const scaleHeight = 100;
    const yFloor = 132;
    const yCeiling = 32;
    const fillY = yFloor - scaleHeight * ratio;

    const drawWater = () => {
      if (amount <= 0) return '';
      const xLeft = 90;
      const xRight = 150;

      const drawBubble = (cx, cy, r) => {
        if (cy >= 131) return '';
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="#ffffff" fill-opacity="0.75" stroke="#003087" stroke-width="0.3" />`;
      };

      return `
        <!-- Translucent Water body -->
        <path d="M 90 ${fillY.toFixed(1)} L 150 ${fillY.toFixed(1)} L 150 132 Q 120 134 90 132 Z" fill="url(#waterLiquid)" />
        <!-- Meniscus top ellipse -->
        <ellipse cx="120" cy="${fillY.toFixed(1)}" rx="30" ry="3.5" fill="#a5f3fc" fill-opacity="0.7" stroke="#38bdf8" stroke-width="0.5" />
        
        <!-- Bubbles -->
        ${drawBubble(112, fillY + 15, 1.5)}
        ${drawBubble(124, fillY + 30, 2)}
        ${drawBubble(118, fillY + 48, 1.2)}
        ${drawBubble(126, fillY + 65, 1.8)}
        ${drawBubble(110, fillY + 80, 1.5)}
      `;
    };

    return svg(`
      <!-- Double base stand -->
      <ellipse cx="120" cy="140" rx="55" ry="7" fill="#334155" stroke="#1e293b" stroke-width="1.8" />
      <ellipse cx="120" cy="136" rx="46" ry="6" fill="#475569" stroke="#1e293b" stroke-width="1.8" />

      <!-- Water Liquid layer -->
      ${drawWater()}

      <!-- Glass outer cylinder silhouette -->
      <path d="M 83 28 C 86 30, 88 31, 90 32 L 90 132 C 90 133, 91 134, 93 134 Q 120 136 147 134 C 149 134, 150 133, 150 132 L 150 32 C 150 31, 152 30, 155 28 Z" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Inner wall highlight -->
      <path d="M 90 32 L 90 132 Q 120 134 150 132 L 150 32" fill="none" stroke="#93c5fd" stroke-width="1.2" opacity="0.8" />

      <!-- Vertical glass reflection highlights -->
      <path d="M 94 34 L 94 130" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />
      <path d="M 146 34 L 146 130" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />

      <!-- Vertical Scale Line -->
      <line x1="132" y1="32" x2="132" y2="132" stroke="#003087" stroke-width="1.8" stroke-linecap="round" />

      <!-- Scale Title -->
      <text x="120" y="21" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="900" fill="#003087" letter-spacing="0.3">CYLINDER (${unit})</text>

      <!-- Ticks and numbers -->
      <g stroke="#003087">
        ${(() => {
          const isLiters = unit.toLowerCase() === 'l' || cap <= 10;
          const majorStep = cap === 100 ? 10 : (isLiters ? 0.2 : 20);
          const minorStep = cap === 100 ? 2 : (isLiters ? 0.05 : 5);

          let markups = [];
          for (let v = 0; v <= cap; v += minorStep) {
            const val = Number(v.toFixed(3));
            const y = yFloor - (val / cap) * scaleHeight;

            const stepsFromZero = Math.round(val / minorStep);
            const minorPerMajor = Math.round(majorStep / minorStep);
            const isMajor = stepsFromZero % minorPerMajor === 0;

            if (isMajor) {
              const displayVal = isLiters ? val.toFixed(1) : val;
              markups.push(`
                <line x1="132" y1="${y.toFixed(1)}" x2="120" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="1.6" />
                <text x="115" y="${(y + 3).toFixed(1)}" font-family="Outfit" font-size="8" font-weight="700" fill="#003087" text-anchor="end">${displayVal}</text>
              `);
            } else {
              markups.push(`
                <line x1="132" y1="${y.toFixed(1)}" x2="126" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="0.8" />
              `);
            }
          }
          return markups.join('');
        })()}
      </g>

      <!-- Digital Overlay Badge -->
      ${displayVolume ? `
        <g transform="translate(178 50)">
          <rect x="0" y="0" width="46" height="28" rx="6" fill="#1e293b" />
          <text x="23" y="13.5" text-anchor="middle" font-family="Outfit" font-size="10" font-weight="600" fill="#38bdf8">${amount}</text>
          <text x="23" y="24" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="#38bdf8">${unit}</text>
        </g>
      ` : ''}
      ${labelText('graduated cylinder', showLabel)}
    `);
  },

  beaker: ({ level = 150, capacity = 250, unit = 'ml', showLabel = true, showVolume = false, showValue = false } = {}) => {
    const cap = Math.max(1, Number(capacity));
    const amount = clamp(level, 0, cap);
    const ratio = amount / cap;
    const displayVolume = showVolume || showValue;

    const scaleHeight = 100;
    const yFloor = 132;
    const yCeiling = 32;
    const fillY = yFloor - scaleHeight * ratio;

    const drawWater = () => {
      if (amount <= 0) return '';
      const xLeft = 45;
      const xRight = 195;

      const drawBubble = (cx, cy, r) => {
        if (cy >= 131) return '';
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="#ffffff" fill-opacity="0.75" stroke="#003087" stroke-width="0.3" />`;
      };

      return `
        <!-- Translucent Water body -->
        <path d="M 45.5 ${fillY.toFixed(1)} L 194.5 ${fillY.toFixed(1)} L 194.5 132 Q 120 134 45.5 132 Z" fill="url(#waterLiquid)" />
        <!-- Meniscus top ellipse -->
        <ellipse cx="120" cy="${fillY.toFixed(1)}" rx="74.5" ry="4.5" fill="#a5f3fc" fill-opacity="0.65" stroke="#38bdf8" stroke-width="0.5" />
        
        <!-- Bubbles -->
        ${drawBubble(95, fillY + 12, 2)}
        ${drawBubble(145, fillY + 22, 1.5)}
        ${drawBubble(110, fillY + 38, 2.5)}
        ${drawBubble(135, fillY + 52, 1.5)}
        ${drawBubble(102, fillY + 68, 2)}
      `;
    };

    return svg(`
      <!-- Curved bottom glass base plate for beaker -->
      <path d="M 43 131 Q 120 134 197 131 L 198 133 Q 196 140 187 140 L 53 140 Q 44 140 42 133 Z" fill="#f1f5f9" fill-opacity="0.85" stroke="#3b82f6" stroke-width="1.8" />
      <ellipse cx="120" cy="138" rx="72" ry="1.5" fill="#ffffff" fill-opacity="0.7" />

      <!-- Water Liquid layer -->
      ${drawWater()}

      <!-- Glass outer silhouette with pour spout at top left -->
      <path d="M 33 26 C 39 28, 42 30, 45 32 L 195 32 C 198 30, 201 28, 207 26 L 203 32 L 195 132 C 195 138, 191 140, 185 140 L 55 140 C 49 140, 45 138, 45 132 L 37 32 Z" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
      <!-- Inner wall highlight -->
      <path d="M 45 32 L 45 132 Q 120 134 195 132 L 195 32" fill="none" stroke="#93c5fd" stroke-width="1.2" opacity="0.8" />

      <!-- Vertical glass reflection highlights -->
      <path d="M 49 36 L 49 130" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45" />
      <path d="M 191 36 L 191 130" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.45" />

      <!-- Vertical Scale Line -->
      <line x1="75" y1="32" x2="75" y2="132" stroke="#003087" stroke-width="1.8" stroke-linecap="round" />

      <!-- Scale Title -->
      <text x="120" y="21" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="900" fill="#003087" letter-spacing="0.3">BEAKER (${unit})</text>

      <!-- Ticks and numbers -->
      <g stroke="#003087">
        ${(() => {
          const isLiters = unit.toLowerCase() === 'l' || cap <= 10;
          const majorStep = cap === 250 ? 50 : (isLiters ? 0.2 : 100);
          const minorStep = cap === 250 ? 25 : (isLiters ? 0.05 : 20);

          let markups = [];
          for (let v = 0; v <= cap; v += minorStep) {
            const val = Number(v.toFixed(3));
            const y = yFloor - (val / cap) * scaleHeight;

            const stepsFromZero = Math.round(val / minorStep);
            const minorPerMajor = Math.round(majorStep / minorStep);
            const isMajor = stepsFromZero % minorPerMajor === 0;

            if (isMajor) {
              const displayVal = isLiters ? val.toFixed(1) : val;
              markups.push(`
                <line x1="75" y1="${y.toFixed(1)}" x2="90" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="1.6" />
                <text x="95" y="${(y + 3).toFixed(1)}" font-family="Outfit" font-size="8.5" font-weight="700" fill="#003087" text-anchor="start">${displayVal}</text>
              `);
            } else {
              markups.push(`
                <line x1="75" y1="${y.toFixed(1)}" x2="82" y2="${y.toFixed(1)}" stroke="#003087" stroke-width="0.8" />
              `);
            }
          }
          return markups.join('');
        })()}
      </g>

      <!-- Digital Overlay Badge -->
      ${displayVolume ? `
        <g transform="translate(178 50)">
          <rect x="0" y="0" width="46" height="28" rx="6" fill="#1e293b" />
          <text x="23" y="13.5" text-anchor="middle" font-family="Outfit" font-size="10" font-weight="600" fill="#38bdf8">${amount}</text>
          <text x="23" y="24" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="#38bdf8">${unit}</text>
        </g>
      ` : ''}
      ${labelText('beaker', showLabel)}
    `);
  },

  stopwatch: ({ seconds = 25, showLabel = true, showTime = false, showValue = false } = {}) => {

    const total = Math.max(0, Number(seconds));
    const displayMinutes = Math.floor(total / 60);
    const displaySeconds = Math.floor(total % 60);
    const handAngle = (displaySeconds / 60) * 360 - 90;
    const handX = 120 + Math.cos((handAngle * Math.PI) / 180) * 35;
    const handY = 80 + Math.sin((handAngle * Math.PI) / 180) * 35;
    const displayTime = showTime || showValue;

    return svg(`
      <!-- Plunger button at the top -->
      <rect x="110" y="14" width="20" height="14" fill="url(#metalGrad)" stroke="#475569" stroke-width="1.5" rx="2" />
      <rect x="106" y="11" width="28" height="4" fill="#475569" rx="1" />
      
      <!-- Side clicker button -->
      <g transform="translate(155, 23) rotate(35)">
        <rect x="0" y="0" width="12" height="10" fill="url(#metalGrad)" stroke="#475569" stroke-width="1" rx="1" />
      </g>

      <!-- Steel outer ring casing -->
      <circle cx="120" cy="80" r="54" fill="url(#metalGrad)" stroke="#475569" stroke-width="3" />
      <circle cx="120" cy="80" r="49" fill="#1e293b" />
      <circle cx="120" cy="80" r="46" fill="#f8fafc" />

      <!-- Tick marks (60 seconds) -->
      ${Array.from({ length: 60 }, (_, i) => {
        const angle = (i / 60) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const isMajor = i % 5 === 0;
        const startR = isMajor ? 38 : 42;
        const endR = 46;
        const x1 = 120 + Math.cos(rad) * startR;
        const x2 = 120 + Math.cos(rad) * endR;
        const y2 = 80 + Math.sin(rad) * endR;

        let labelMarkup = '';
        if (isMajor) {
          const textR = 31;
          const textX = 120 + Math.cos(rad) * textR;
          const textY = 80 + Math.sin(rad) * textR;
          labelMarkup = `<text x="${textX}" y="${textY + 3}" text-anchor="middle" font-family="Outfit" font-size="8" font-weight="500" fill="#334155">${i}</text>`;
        }

        return `
          <line x1="${x1.toFixed(1)}" y1="${(80 + Math.sin(rad) * startR).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#334155" stroke-width="${isMajor ? 1.5 : 0.6}" />
          ${labelMarkup}
        `;
      }).join('')}

      <!-- Center spindle -->
      <circle cx="120" cy="80" r="5" fill="#334155" />
      
      <!-- Needle pointer (Red steel) -->
      <line x1="120" y1="80" x2="${handX.toFixed(1)}" y2="${handY.toFixed(1)}" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="120" cy="80" r="2.5" fill="#facc15" />

      <!-- Digital timer display read-out -->
      ${displayTime ? `
        <rect x="100" y="105" width="40" height="15" rx="4" fill="#0f172a" />
        <text x="120" y="116" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="600" fill="#facc15">${displayMinutes}:${String(displaySeconds).padStart(2, '0')}</text>
      ` : ''}
      ${labelText('stopwatch', showLabel)}
    `);
  },

  number_line: ({ min = 0, max = 5, highlight = null, step = 1, showLabel = true } = {}) => {
    const start = Number(min);
    const end = Number(max);
    const safeStep = Math.max(1, Number(step));
    const values = [];
    for (let value = start; value <= end && values.length < 11; value += safeStep) values.push(value);
    const count = Math.max(1, values.length - 1);
    const h = highlight === null || highlight === undefined ? null : Number(highlight);
    const highlightX = h === null ? null : 42 + ((h - start) / Math.max(1, end - start)) * 150;

    return svg(`
      <!-- Grid ruler background style -->
      <rect x="15" y="45" width="210" height="68" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
      
      <!-- Main Line -->
      <line x1="28" y1="82" x2="212" y2="82" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
      <!-- Arrows at ends -->
      <path d="M28 82 L36 78 L36 86 Z" fill="#1e293b" />
      <path d="M212 82 L204 78 L204 86 Z" fill="#1e293b" />
      
      ${values.map((value, i) => {
        const x = 42 + (i / count) * 150;
        return `<line x1="${x}" y1="72" x2="${x}" y2="92" stroke="#1e293b" stroke-width="2" />
          <text x="${x}" y="105" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="11" font-weight="500" fill="#1e293b">${value}</text>`;
      }).join('')}
      
      ${highlightX !== null ? `
        <circle cx="${highlightX.toFixed(1)}" cy="82" r="7" fill="#10b981" stroke="#059669" stroke-width="2.5" />
        <text x="${highlightX.toFixed(1)}" y="63" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="12" font-weight="600" fill="#059669">${h}</text>
      ` : ''}
      ${labelText('number line', showLabel)}
    `);
  },

  ruler: (props = {}) => {
    const unit = props.unit || 'cm';
    if (unit === 'in') {
      return dynamicRenderers.inch_ruler(props);
    }
    return dynamicRenderers.centimeter_ruler(props);
  },

  meter_stick: ({ highlight = null, showLabel = true } = {}) => {
    const startX = 20;
    const width = 200;
    const y = 60;
    const height = 30;
    
    // Draw tick marks
    let ticks = '';
    for (let cm = 0; cm <= 100; cm += 1) {
      const px = startX + (cm / 100) * width;
      const isMajor = cm % 10 === 0;
      const isMedium = cm % 5 === 0 && !isMajor;
      const tickH = isMajor ? 12 : isMedium ? 8 : 5;
      ticks += `<line x1="${px}" y1="${y}" x2="${px}" y2="${y + tickH}" stroke="#471a03" stroke-width="${isMajor ? 1.2 : 0.6}" />`;
      if (isMajor && cm % 20 === 0) {
        ticks += `<text x="${px}" y="${y + 24}" text-anchor="middle" font-family="Outfit" font-size="7" font-weight="600" fill="#471a03">${cm}</text>`;
      }
    }

    let marker = '';
    if (highlight !== null) {
      const hVal = clamp(highlight, 0, 100);
      const hx = startX + (hVal / 100) * width;
      marker = `
        <line x1="${hx}" y1="${y - 15}" x2="${hx}" y2="${y + height}" stroke="#ef4444" stroke-dasharray="2 2" stroke-width="1.5" />
        <circle cx="${hx}" cy="${y - 15}" r="5" fill="#ef4444" />
        <text x="${hx}" y="${y - 22}" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="700" fill="#ef4444">${hVal} cm</text>
      `;
    }

    return svg(`
      <rect x="${startX}" y="${y}" width="${width}" height="${height}" fill="url(#woodGrad)" stroke="#451a03" stroke-width="2.5" rx="3" />
      <text x="${startX + 10}" y="${y + 12}" font-family="Outfit" font-size="6.5" font-weight="900" fill="#7c2d12" opacity="0.8">METER STICK (100cm)</text>
      ${ticks}
      ${marker}
      ${labelText('meter stick', showLabel)}
    `);
  },

  yardstick: ({ highlight = null, showLabel = true } = {}) => {
    const startX = 20;
    const width = 200;
    const y = 60;
    const height = 30;
    
    // Draw tick marks
    let ticks = '';
    for (let inch = 0; inch <= 36; inch += 0.25) {
      const px = startX + (inch / 36) * width;
      const isWhole = inch % 1 === 0;
      const isHalf = inch % 0.5 === 0 && !isWhole;
      const isQuarter = !isWhole && !isHalf;
      const tickH = isWhole ? 12 : isHalf ? 8 : 5;
      ticks += `<line x1="${px}" y1="${y}" x2="${px}" y2="${y + tickH}" stroke="#471a03" stroke-width="${isWhole ? 1.2 : 0.6}" />`;
      if (isWhole && inch % 6 === 0) {
        ticks += `<text x="${px}" y="${y + 24}" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="#471a03">${inch}</text>`;
      }
    }

    let marker = '';
    if (highlight !== null) {
      const hVal = clamp(highlight, 0, 36);
      const hx = startX + (hVal / 36) * width;
      marker = `
        <line x1="${hx}" y1="${y - 15}" x2="${hx}" y2="${y + height}" stroke="#ef4444" stroke-dasharray="2 2" stroke-width="1.5" />
        <circle cx="${hx}" cy="${y - 15}" r="5" fill="#ef4444" />
        <text x="${hx}" y="${y - 22}" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="700" fill="#ef4444">${hVal} in</text>
      `;
    }

    return svg(`
      <rect x="${startX}" y="${y}" width="${width}" height="${height}" fill="url(#woodGrad)" stroke="#451a03" stroke-width="2.5" rx="3" />
      <text x="${startX + 10}" y="${y + 12}" font-family="Outfit" font-size="6.5" font-weight="900" fill="#7c2d12" opacity="0.8">YARDSTICK (36in)</text>
      ${ticks}
      ${marker}
      ${labelText('yardstick', showLabel)}
    `);
  },

  tape_measure: (props = {}) => {
    return dynamicRenderers.measuring_tape(props);
  },

  set_square: ({ showLabel = true } = {}) => {
    const pointsOuter = '30,120 190,120 30,30';
    const pointsInner = '50,110 155,110 50,47';
    
    // Draw bottom ticks (30 to 180, 150px length)
    let bottomTicks = '';
    const pxScale = 15; // 10 units of 15px each
    for (let cm = 0; cm <= 10; cm++) {
      const x = 30 + cm * pxScale;
      bottomTicks += `
        <line x1="${x}" y1="120" x2="${x}" y2="112" stroke="#0369a1" stroke-width="1.2" />
        <text x="${x}" y="108" text-anchor="middle" font-family="Outfit" font-size="6.5" font-weight="600" fill="#0369a1">${cm}</text>
      `;
    }

    // Draw vertical ticks (30 to 120, 90px length)
    let leftTicks = '';
    const pyScale = 15; // 6 units of 15px each
    for (let cm = 0; cm <= 6; cm++) {
      const y = 120 - cm * pyScale;
      leftTicks += `
        <line x1="30" y1="${y}" x2="38" y2="${y}" stroke="#0369a1" stroke-width="1.2" />
        <text x="43" y="${y + 2.5}" text-anchor="start" font-family="Outfit" font-size="6.5" font-weight="600" fill="#0369a1">${cm}</text>
      `;
    }

    return svg(`
      <!-- Outer Glass triangle -->
      <polygon points="${pointsOuter}" fill="#e0f2fe" fill-opacity="0.35" stroke="#0284c7" stroke-width="2.5" stroke-linejoin="round" />
      
      <!-- Inner cutout -->
      <polygon points="${pointsInner}" fill="#ffffff" fill-opacity="0.85" stroke="#0284c7" stroke-width="1.5" stroke-linejoin="round" />
      
      <!-- Markings -->
      ${bottomTicks}
      ${leftTicks}
      
      ${labelText('set square / triangle ruler', showLabel)}
    `);
  },

  digital_scale: ({ weight = 5.2, unit = 'kg', label = '', showLabel = true } = {}) => {
    const displayWeight = Number(weight).toFixed(2);
    
    // Draw an apple or box on the scale to make it look premium
    const objectMarkup = `
      <!-- Red Apple sitting on platter -->
      <g transform="translate(120, 60) scale(0.6)">
        <path d="M 0,-15 Q 12,-32 25,-25 Q 15,0 0,-5 Q -15,0 -25,-25 Q -12,-32 0,-15 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="2" />
        <!-- stem -->
        <path d="M 0,-15 C 2,-25 10,-28 10,-28" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
        <!-- leaf -->
        <path d="M 5,-23 C 12,-23 18,-15 18,-15 C 18,-15 10,-10 5,-23" fill="#22c55e" stroke="#15803d" stroke-width="1" />
      </g>
    `;

    return svg(`
      <!-- Stand / Shadow -->
      <rect x="50" y="90" width="140" height="42" rx="8" fill="#1e293b" opacity="0.1" />

      <!-- Scale Platter (Oval metal platter) -->
      <ellipse cx="120" cy="72" rx="72" ry="12" fill="url(#metalGrad)" stroke="#475569" stroke-width="2" />
      <ellipse cx="120" cy="70" rx="66" ry="10" fill="#94a3b8" />
      <ellipse cx="116" cy="68" rx="60" ry="7" fill="#cbd5e1" opacity="0.5" />

      <!-- Platter load -->
      ${objectMarkup}

      <!-- Main Scale Base (Sleek plastic body) -->
      <path d="M 45 80 L 195 80 L 185 125 L 55 125 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3" stroke-linejoin="round" />
      <path d="M 46 82 L 194 82 L 185 96 L 55 96 Z" fill="#ffffff" fill-opacity="0.25" />

      <!-- LCD Display Bezel and Screen -->
      <rect x="80" y="96" width="80" height="22" rx="3" fill="#334155" stroke="#475569" stroke-width="2" />
      <rect x="83" y="99" width="74" height="16" rx="1.5" fill="#ecfdf5" />
      
      <!-- Digital LCD readout -->
      <text x="142" y="112" text-anchor="end" font-family="Courier New, monospace" font-size="13" font-weight="900" fill="#065f46" letter-spacing="0.5">${displayWeight}</text>
      <text x="145" y="111" text-anchor="start" font-family="Outfit" font-size="8" font-weight="700" fill="#065f46">${unit}</text>

      ${label ? `<text x="120" y="90" text-anchor="middle" font-family="Outfit" font-size="8" font-weight="700" fill="#475569">${label.toUpperCase()}</text>` : ''}
      ${labelText('digital scale', showLabel)}
    `);
  },

  spring_scale: ({ weight = 4.5, unit = 'lbs', maxWeight = 10, showLabel = true } = {}) => {
    const val = Number(weight);
    const maxW = Math.max(1, Number(maxWeight));
    const cx = 120;
    const cy = 76;
    const r = 44;

    // Pointer angle range: 270 degrees clockwise, starting from -135
    const startAngle = -135;
    const totalAngleRange = 270;
    const ratio = clamp(val, 0, maxW) / maxW;
    const angleDeg = startAngle + ratio * totalAngleRange;
    const angleRad = (angleDeg * Math.PI) / 180;

    const needleX = cx + (r - 12) * Math.cos(angleRad);
    const needleY = cy + (r - 12) * Math.sin(angleRad);

    // Ticks
    let ticks = '';
    for (let i = 0; i <= maxW; i++) {
      const tickRatio = i / maxW;
      const tickDeg = startAngle + tickRatio * totalAngleRange;
      const tickRad = (tickDeg * Math.PI) / 180;
      
      const xOuter = cx + r * Math.cos(tickRad);
      const yOuter = cy + r * Math.sin(tickRad);
      const xInner = cx + (r - 6) * Math.cos(tickRad);
      const yInner = cy + (r - 6) * Math.sin(tickRad);
      
      ticks += `<line x1="${xInner.toFixed(1)}" y1="${yInner.toFixed(1)}" x2="${xOuter.toFixed(1)}" y2="${yOuter.toFixed(1)}" stroke="#334155" stroke-width="1.2" />`;
      
      // Every few ticks show number
      const showText = maxW <= 10 || i % 2 === 0;
      if (showText) {
        const textR = r - 15;
        const textX = cx + textR * Math.cos(tickRad);
        const textY = cy + textR * Math.sin(tickRad) + 3;
        ticks += `<text x="${textX.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="#1e293b">${i}</text>`;
      }
    }

    return svg(`
      <!-- Hanger ring -->
      <circle cx="${cx}" cy="22" r="10" fill="none" stroke="#475569" stroke-width="3" />
      <rect x="${cx - 5}" y="29" width="10" height="10" fill="#475569" />

      <!-- Scale casing back shadow -->
      <circle cx="${cx + 3}" cy="${cy + 3}" r="${r + 2}" fill="#1e293b" opacity="0.1" />

      <!-- Scale Face -->
      <circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="url(#metalGrad)" stroke="#475569" stroke-width="2.5" />
      <circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="#f8fafc" />

      <!-- Dial tick marks -->
      ${ticks}

      <!-- Center spindle -->
      <circle cx="${cx}" cy="${cy}" r="4" fill="#334155" />
      
      <!-- Needle pointer (Red steel) -->
      <line x1="${cx}" y1="${cy}" x2="${needleX.toFixed(1)}" y2="${needleY.toFixed(1)}" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />
      <circle cx="${cx}" cy="${cy}" r="2" fill="#facc15" />

      <!-- Unit Label -->
      <text x="${cx}" y="${cy + r/2}" font-family="Outfit" font-weight="800" font-size="8" fill="#64748b" text-anchor="middle">${unit.toUpperCase()}</text>

      <!-- Hook hanging from bottom -->
      <path d="M ${cx} ${cy + r + 2} L ${cx} ${cy + r + 15} Q ${cx} ${cy + r + 24} ${cx - 8} ${cy + r + 24} Q ${cx - 14} ${cy + r + 20} ${cx - 10} ${cy + r + 14}" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round" />

      ${labelText('spring scale', showLabel)}
    `);
  },

  clock: ({ hour = 10, minute = 10, showDigital = false, showLabel = true } = {}) => {
    const cx = 120;
    const cy = 76;
    const r = 45;

    // Hand angles
    const mAngle = (minute / 60) * 360 - 90;
    const hAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30 - 90;

    const mRad = (mAngle * Math.PI) / 180;
    const hRad = (hAngle * Math.PI) / 180;

    const mX = cx + (r - 10) * Math.cos(mRad);
    const mY = cy + (r - 10) * Math.sin(mRad);

    const hX = cx + (r - 20) * Math.cos(hRad);
    const hY = cy + (r - 20) * Math.sin(hRad);

    // Major numbers 12, 3, 6, 9
    let numbers = '';
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    hours.forEach((h) => {
      const ang = (h / 12) * 360 - 90;
      const rad = (ang * Math.PI) / 180;
      const tx = cx + (r - 10) * Math.cos(rad);
      const ty = cy + (r - 10) * Math.sin(rad) + 2.5;
      
      const isBig = h % 3 === 0;
      numbers += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="Outfit" font-size="${isBig ? '8' : '5.5'}" font-weight="${isBig ? '700' : '500'}" fill="${isBig ? '#0f172a' : '#64748b'}">${h}</text>`;
    });

    let digitalBox = '';
    if (showDigital) {
      const hrStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      digitalBox = `
        <rect x="${cx - 18}" y="${cy + 15}" width="36" height="12" rx="3" fill="#1e293b" />
        <text x="${cx}" y="${cy + 24}" text-anchor="middle" font-family="Outfit" font-size="8" font-weight="700" fill="#fef08a">${hrStr}:${minStr}</text>
      `;
    }

    return svg(`
      <!-- Clock border casing -->
      <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#ef4444" stroke="#b91c1c" stroke-width="2.5" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" />

      <!-- Tick marks for minutes -->
      ${Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return '';
        const ang = (i / 60) * 360 - 90;
        const rad = (ang * Math.PI) / 180;
        const x1 = cx + (r - 3) * Math.cos(rad);
        const y1 = cy + (r - 3) * Math.sin(rad);
        const x2 = cx + r * Math.cos(rad);
        const y2 = cy + r * Math.sin(rad);
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#cbd5e1" stroke-width="0.6" />`;
      }).join('')}

      <!-- Numbers -->
      ${numbers}

      <!-- Digital panel if requested -->
      ${digitalBox}

      <!-- Hour Hand (Thick) -->
      <line x1="${cx}" y1="${cy}" x2="${hX.toFixed(1)}" y2="${hY.toFixed(1)}" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
      
      <!-- Minute Hand (Thin, longer) -->
      <line x1="${cx}" y1="${cy}" x2="${mX.toFixed(1)}" y2="${mY.toFixed(1)}" stroke="#475569" stroke-width="2" stroke-linecap="round" />

      <!-- Center spindle -->
      <circle cx="${cx}" cy="${cy}" r="3.5" fill="#b91c1c" stroke="#ffffff" stroke-width="1" />

      ${labelText('analog clock', showLabel)}
    `);
  },

  pipette: ({ level = 2, capacity = 5, color = '#38bdf8', showLabel = true } = {}) => {
    const cap = Math.max(1, Number(capacity));
    const amt = clamp(level, 0, cap);
    const ratio = amt / cap;

    const tubeH = 75;
    const yFloor = 125;
    const fillH = tubeH * ratio;
    const fillY = yFloor - fillH;

    let ticks = '';
    for (let i = 0; i <= cap; i++) {
      const y = yFloor - (i / cap) * tubeH;
      ticks += `
        <line x1="123" y1="${y}" x2="128" y2="${y}" stroke="#003087" stroke-width="1.2" />
        <text x="131" y="${y + 2.5}" font-family="Outfit" font-size="6.5" font-weight="600" fill="#003087">${i} ml</text>
      `;
    }

    return svg(`
      <!-- Pipette Squeeze Bulb at the top -->
      <path d="M 110 32 C 110 12, 130 12, 130 32 L 127 50 L 113 50 Z" fill="#ef4444" stroke="#991b1b" stroke-width="1.5" />
      <ellipse cx="120" cy="50" rx="7" ry="2" fill="#991b1b" />

      <!-- Liquid fill inside glass tube -->
      ${amt > 0 ? `
        <rect x="113.5" y="${fillY.toFixed(1)}" width="13" height="${fillH.toFixed(1)}" fill="${color}" />
        <path d="M 113.5 ${yFloor} L 126.5 ${yFloor} L 120 140 Z" fill="${color}" />
      ` : ''}

      <!-- Glass pipette tube cylinder -->
      <rect x="113" y="50" width="14" height="75" fill="none" stroke="#3b82f6" stroke-width="1.8" />
      <path d="M 113 125 L 127 125 L 120 142 Z" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linejoin="round" />

      <!-- Glass reflection highlight -->
      <line x1="115.5" y1="53" x2="115.5" y2="122" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5" />

      <!-- Graduations -->
      ${ticks}

      ${labelText('pipette / dropper', showLabel)}
    `);
  },

  magnifying_glass: ({ text = '5x', showLabel = true } = {}) => {
    return svg(`
      <!-- Handle -->
      <rect x="145" y="105" width="45" height="10" rx="3" fill="#78350f" stroke="#451a03" stroke-width="1.5" transform="rotate(45 145 105)" />
      <!-- Metal connector band -->
      <rect x="136" y="96" width="10" height="12" fill="url(#metalGrad)" stroke="#475569" stroke-width="0.8" transform="rotate(45 136 96)" />

      <!-- Background Grid representing magnified object pattern -->
      <g stroke="#cbd5e1" stroke-width="0.75" opacity="0.6">
        <line x1="50" y1="30" x2="50" y2="110" />
        <line x1="70" y1="30" x2="70" y2="110" />
        <line x1="90" y1="30" x2="90" y2="110" />
        <line x1="110" y1="30" x2="110" y2="110" />
        <line x1="130" y1="30" x2="130" y2="110" />
        <line x1="40" y1="50" x2="140" y2="50" />
        <line x1="40" y1="70" x2="140" y2="70" />
        <line x1="40" y1="90" x2="140" y2="90" />
      </g>

      <!-- Magnified Grid center (Shifted/Larger inside magnifying glass area) -->
      <g opacity="0.85">
        <circle cx="90" cy="70" r="34" fill="#f0f9ff" fill-opacity="0.85" />
        
        <!-- Magnified crosshairs -->
        <g stroke="#93c5fd" stroke-width="2">
          <line x1="72" y1="70" x2="108" y2="70" />
          <line x1="90" y1="52" x2="90" y2="88" />
        </g>
        <circle cx="90" cy="70" r="18" fill="none" stroke="#60a5fa" stroke-width="1" stroke-dasharray="2 2" />
        <text x="90" y="73" text-anchor="middle" font-family="Outfit" font-size="10" font-weight="900" fill="#1e3a8a">${text}</text>
      </g>

      <!-- Outer Bezel Ring of Glass -->
      <circle cx="90" cy="70" r="35" fill="none" stroke="url(#metalGrad)" stroke-width="4.5" />
      <!-- Glass reflection highlight -->
      <path d="M 62 52 A 32 32 0 0 1 118 52" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.6" />

      ${labelText('magnifying glass', showLabel)}
    `);
  },

  ten_frame: ({ count = 6, color = '#ef4444', showLabel = true } = {}) => {
    const cnt = clamp(count, 0, 10);
    const startX = 35;
    const startY = 48;
    const cellW = 34;
    const cellH = 30;

    let counters = '';
    for (let i = 0; i < cnt; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const cx = startX + col * cellW + cellW / 2;
      const cy = startY + row * cellH + cellH / 2;
      
      const shadowColor = color === '#ef4444' ? '#991b1b' : '#b45309';
      counters += `
        <circle cx="${cx}" cy="${cy + 1.2}" r="10" fill="${shadowColor}" />
        <circle cx="${cx}" cy="${cy}" r="10" fill="${color}" stroke="#ffffff" stroke-width="1" />
        <!-- inner shine -->
        <circle cx="${cx - 3.5}" cy="${cy - 3.5}" r="3" fill="#ffffff" fill-opacity="0.35" />
      `;
    }

    return svg(`
      <!-- Base Outer Border Box -->
      <rect x="${startX - 2}" y="${startY - 2}" width="${cellW * 5 + 4}" height="${cellH * 2 + 4}" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="3" />

      <!-- Inner Grid lines -->
      <g stroke="#64748b" stroke-width="2">
        <line x1="${startX}" y1="${startY + cellH}" x2="${startX + cellW * 5}" y2="${startY + cellH}" />
        ${Array.from({ length: 4 }, (_, i) => {
          const x = startX + (i + 1) * cellW;
          return `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + cellH * 2}" />`;
        }).join('')}
      </g>

      <!-- Draw Counters -->
      ${counters}

      ${labelText('ten frame', showLabel)}
    `);
  },

  base_ten_blocks: ({ thousands = 0, hundreds = 1, tens = 3, ones = 5, showLabel = true } = {}) => {
    const drawIsometricCube = (cx, cy, size, col1, col2, col3) => {
      const dx = size * Math.cos(Math.PI / 6);
      const dy = size * Math.sin(Math.PI / 6);
      return `
        <g>
          <!-- Top face -->
          <polygon points="${cx},${cy - size} ${cx + dx},${cy - dy} ${cx},${cy} ${cx - dx},${cy - dy}" fill="${col1}" stroke="#1e3a8a" stroke-width="0.4" />
          <!-- Left face -->
          <polygon points="${cx - dx},${cy - dy} ${cx},${cy} ${cx},${cy + size} ${cx - dx},${cy + size - dy}" fill="${col2}" stroke="#1e3a8a" stroke-width="0.4" />
          <!-- Right face -->
          <polygon points="${cx},${cy} ${cx + dx},${cy - dy} ${cx + dx},${cy + size - dy} ${cx},${cy + size}" fill="${col3}" stroke="#1e3a8a" stroke-width="0.4" />
        </g>
      `;
    };

    let cubes = '';
    const size = 5;
    const col1 = '#93c5fd';
    const col2 = '#3b82f6';
    const col3 = '#1d4ed8';

    const onesCount = clamp(ones, 0, 19);
    for (let i = 0; i < onesCount; i++) {
      const x = 185 + (i % 4) * 11 - (Math.floor(i / 4) * 2);
      const y = 80 + Math.floor(i / 4) * 12 + (i % 4) * 2;
      cubes += drawIsometricCube(x, y, size, col1, col2, col3);
    }

    const tensCount = clamp(tens, 0, 8);
    for (let t = 0; t < tensCount; t++) {
      const tx = 140 + t * 11;
      const ty = 92 - t * 2;
      for (let i = 0; i < 10; i++) {
        cubes += drawIsometricCube(tx, ty - i * size, size, col1, col2, col3);
      }
    }

    const hundredsCount = clamp(hundreds, 0, 3);
    for (let h = 0; h < hundredsCount; h++) {
      const hx = 75 + h * 15;
      const hy = 80 + h * 8;
      const dx = 10 * size * Math.cos(Math.PI / 6);
      const dy = 10 * size * Math.sin(Math.PI / 6);
      cubes += `
        <g>
          <polygon points="${hx},${hy - 10 * size} ${hx + dx},${hy - dy} ${hx},${hy} ${hx - dx},${hy - dy}" fill="${col1}" stroke="#1e3a8a" stroke-width="1.2" />
          <polygon points="${hx - dx},${hy - dy} ${hx},${hy} ${hx},${hy + 1.2 * size} ${hx - dx},${hy + 1.2 * size - dy}" fill="${col2}" stroke="#1e3a8a" stroke-width="1.2" />
          <polygon points="${hx},${hy} ${hx + dx},${hy - dy} ${hx + dx},${hy + 1.2 * size - dy} ${hx},${hy + 1.2 * size}" fill="${col3}" stroke="#1e3a8a" stroke-width="1.2" />
          ${Array.from({ length: 9 }, (_, k) => {
            const ratio = (k + 1) / 10;
            const lx1 = hx + ratio * dx;
            const ly1 = hy - ratio * dy;
            const lx2 = hx - (1 - ratio) * dx;
            const ly2 = hy - (1 - ratio) * dy - 10 * size;
            
            const rx1 = hx - ratio * dx;
            const ry1 = hy - ratio * dy;
            const rx2 = hx + (1 - ratio) * dx;
            const ry2 = hy - (1 - ratio) * dy - 10 * size;
            
            return `
              <line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}" stroke="#2563eb" stroke-width="0.4" />
              <line x1="${rx1}" y1="${ry1}" x2="${rx2}" y2="${ry2}" stroke="#2563eb" stroke-width="0.4" />
            `;
          }).join('')}
        </g>
      `;
    }

    const thousandsCount = clamp(thousands, 0, 2);
    for (let th = 0; th < thousandsCount; th++) {
      const thx = 35 + th * 20;
      const thy = 75 + th * 10;
      const dx = 10 * size * Math.cos(Math.PI / 6);
      const dy = 10 * size * Math.sin(Math.PI / 6);
      const stackH = 10 * size;

      cubes += `
        <g>
          <polygon points="${thx},${thy - stackH} ${thx + dx},${thy - dy} ${thx},${thy} ${thx - dx},${thy - dy}" fill="${col1}" stroke="#1e3a8a" stroke-width="1.5" />
          <polygon points="${thx - dx},${thy - dy} ${thx},${thy} ${thx},${thy + stackH} ${thx - dx},${thy + stackH - dy}" fill="${col2}" stroke="#1e3a8a" stroke-width="1.5" />
          <polygon points="${thx},${thy} ${thx + dx},${thy - dy} ${thx + dx},${thy + stackH - dy} ${thx},${thy + stackH}" fill="${col3}" stroke="#1e3a8a" stroke-width="1.5" />
        </g>
      `;
    }

    return svg(`
      <g font-family="Outfit" font-size="7" font-weight="700" fill="#64748b" text-anchor="middle">
        ${thousands > 0 ? `<text x="35" y="125">Thousands (${thousands})</text>` : ''}
        ${hundreds > 0 ? `<text x="85" y="125">Hundreds (${hundreds})</text>` : ''}
        ${tens > 0 ? `<text x="145" y="125">Tens (${tens})</text>` : ''}
        ${ones > 0 ? `<text x="195" y="125">Ones (${ones})</text>` : ''}
      </g>

      ${cubes}
      ${labelText('base ten blocks', showLabel)}
    `);
  },

  fraction_strips: ({ numerator = 2, denominator = 3, color = '#3b82f6', showLabel = true } = {}) => {
    const num = Math.max(0, Number(numerator));
    const den = Math.max(1, Number(denominator));
    const startX = 30;
    const width = 180;
    const yWhole = 40;
    const yFraction = 70;
    const stripH = 20;

    let segments = '';
    const segW = width / den;
    for (let i = 0; i < den; i++) {
      const isShaded = i < num;
      const fill = isShaded ? color : '#f8fafc';
      segments += `
        <rect x="${startX + i * segW}" y="${yFraction}" width="${segW}" height="${stripH}" fill="${fill}" stroke="#1e293b" stroke-width="1.8" />
        <text x="${startX + i * segW + segW / 2}" y="${yFraction + 12}" text-anchor="middle" font-family="Outfit" font-size="7.5" font-weight="600" fill="${isShaded ? '#ffffff' : '#64748b'}">1/${den}</text>
      `;
    }

    return svg(`
      <rect x="${startX}" y="${yWhole}" width="${width}" height="${stripH}" fill="#cbd5e1" stroke="#1e293b" stroke-width="1.8" />
      <text x="${startX + width / 2}" y="${yWhole + 12}" text-anchor="middle" font-family="Outfit" font-size="8" font-weight="800" fill="#1e293b">1 WHOLE</text>
      ${segments}
      <text x="120" y="112" text-anchor="middle" font-family="Outfit" font-size="11" font-weight="900" fill="#1e293b">${num} / ${den} SHADED</text>
      ${labelText('fraction strips', showLabel)}
    `);
  },

  fraction_circles: ({ numerator = 3, denominator = 4, color = '#3b82f6', showLabel = true } = {}) => {
    const num = Math.max(0, Number(numerator));
    const den = Math.max(1, Number(denominator));
    const cx = 120;
    const cy = 70;
    const r = 40;

    let slices = '';
    for (let i = 0; i < den; i++) {
      const startAngle = (i / den) * 360 - 90;
      const endAngle = ((i + 1) / den) * 360 - 90;
      const rad1 = (startAngle * Math.PI) / 180;
      const rad2 = (endAngle * Math.PI) / 180;
      
      const x1 = cx + r * Math.cos(rad1);
      const y1 = cy + r * Math.sin(rad1);
      const x2 = cx + r * Math.cos(rad2);
      const y2 = cy + r * Math.sin(rad2);
      
      const largeArc = 360 / den > 180 ? 1 : 0;
      const isShaded = i < num;
      const fill = isShaded ? color : '#f8fafc';
      
      slices += `
        <path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${fill}" stroke="#1e293b" stroke-width="1.6" />
      `;
    }

    return svg(`
      <circle cx="${cx + 2}" cy="${cy + 2}" r="${r}" fill="#1e293b" opacity="0.1" />
      ${slices}
      <text x="${cx}" y="${cy + r + 20}" text-anchor="middle" font-family="Outfit" font-size="11" font-weight="900" fill="#1e293b">${num} / ${den} SHADED</text>
      ${labelText('fraction circle', showLabel)}
    `);
  },

  bar_model: ({ parts = [30, 20], labels = ['30', '20'], wholeLabel = '?', showLabel = true } = {}) => {
    const startX = 30;
    const width = 180;
    const y = 50;
    const h = 24;

    const totalVal = parts.reduce((a, b) => Number(a) + Number(b), 0);
    let cumulativeWidth = 0;
    let partsMarkup = '';

    const colors = ['#3b82f6', '#10b981', '#fbbf24', '#ec4899'];

    parts.forEach((val, idx) => {
      const partRatio = totalVal > 0 ? Number(val) / totalVal : 1 / parts.length;
      const partW = width * partRatio;
      const fill = colors[idx % colors.length];
      
      partsMarkup += `
        <rect x="${startX + cumulativeWidth}" y="${y}" width="${partW}" height="${h}" fill="${fill}" fill-opacity="0.85" stroke="#1e293b" stroke-width="1.8" />
        <text x="${startX + cumulativeWidth + partW / 2}" y="${y + h / 2 + 3.5}" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="700" fill="#ffffff">${labels[idx] || val}</text>
      `;
      cumulativeWidth += partW;
    });

    return svg(`
      ${partsMarkup}
      <path d="M ${startX} ${y + h + 4} L ${startX} ${y + h + 10} Q ${startX} ${y + h + 15} ${startX + 10} ${y + h + 15} L ${startX + width/2 - 10} ${y + h + 15} Q ${startX + width/2} ${y + h + 15} ${startX + width/2} ${y + h + 20} Q ${startX + width/2} ${y + h + 15} ${startX + width/2 + 10} ${y + h + 15} L ${startX + width - 10} ${y + h + 15} Q ${startX + width} ${y + h + 15} ${startX + width} ${y + h + 15} L ${startX + width} ${y + h + 4}" fill="none" stroke="#475569" stroke-width="1.8" />
      <text x="${startX + width / 2}" y="${y + h + 32}" text-anchor="middle" font-family="Outfit" font-size="11" font-weight="900" fill="#1e293b">${wholeLabel}</text>
      ${labelText('bar model', showLabel)}
    `);
  },

  graph_axes: ({ type = 'bar', labels = ['A', 'B', 'C'], values = [10, 20, 15], maxY = 25, showLabel = true } = {}) => {
    const originX = 45;
    const originY = 110;
    const graphW = 160;
    const graphH = 80;

    let grid = '';
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const yVal = Math.round((i / steps) * maxY);
      const gy = originY - (i / steps) * graphH;
      grid += `
        <line x1="${originX}" y1="${gy}" x2="${originX + graphW}" y2="${gy}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${originX - 6}" y="${gy + 3}" text-anchor="end" font-family="Outfit" font-size="7.5" font-weight="600" fill="#64748b">${yVal}</text>
      `;
    }

    let columns = '';
    if (type === 'bar') {
      const colGroupW = graphW / values.length;
      const barW = colGroupW * 0.6;
      values.forEach((val, idx) => {
        const valH = (clamp(val, 0, maxY) / maxY) * graphH;
        const bx = originX + idx * colGroupW + (colGroupW - barW) / 2;
        const by = originY - valH;
        
        columns += `
          <rect x="${bx}" y="${by}" width="${barW}" height="${valH}" fill="#3b82f6" fill-opacity="0.85" stroke="#1d4ed8" stroke-width="1.5" rx="1.5" />
          <text x="${originX + idx * colGroupW + colGroupW / 2}" y="${originY + 12}" text-anchor="middle" font-family="Outfit" font-size="8" font-weight="700" fill="#475569">${labels[idx] || ''}</text>
        `;
      });
    }

    return svg(`
      ${grid}
      <line x1="${originX}" y1="${originY}" x2="${originX + graphW + 10}" y2="${originY}" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
      <line x1="${originX}" y1="${originY}" x2="${originX}" y2="${originY - graphH - 5}" stroke="#1e293b" stroke-width="2" stroke-linecap="round" />
      ${columns}
      ${labelText('graph axes', showLabel)}
    `);
  },

  coordinate_grid: ({ x = 2, y = 3, showLabel = true } = {}) => {
    const cx = 120;
    const cy = 70;
    const scale = 9;

    let lines = '';
    for (let i = -5; i <= 5; i++) {
      const gx = cx + i * scale;
      const gy = cy - i * scale;
      const isAxis = i === 0;
      lines += `
        <line x1="${gx}" y1="${cy - 47}" x2="${gx}" y2="${cy + 47}" stroke="${isAxis ? '#1e293b' : '#cbd5e1'}" stroke-width="${isAxis ? 1.5 : 0.6}" />
        <line x1="${cx - 47}" y1="${gy}" x2="${cx + 47}" y2="${gy}" stroke="${isAxis ? '#1e293b' : '#cbd5e1'}" stroke-width="${isAxis ? 1.5 : 0.6}" />
      `;
      if (i !== 0) {
        lines += `
          <text x="${gx}" y="${cy + 8}" text-anchor="middle" font-family="Outfit" font-size="5" font-weight="700" fill="#475569">${i}</text>
          <text x="${cx - 6}" y="${gy + 2}" text-anchor="end" font-family="Outfit" font-size="5" font-weight="700" fill="#475569">${i}</text>
        `;
      }
    }

    const px = cx + clamp(x, -5, 5) * scale;
    const py = cy - clamp(y, -5, 5) * scale;

    return svg(`
      <rect x="${cx - 50}" y="${cy - 50}" width="100" height="100" fill="#f8fafc" stroke="#94a3b8" stroke-width="1" />
      ${lines}
      <circle cx="${cx}" cy="${cy}" r="2" fill="#ef4444" />
      <circle cx="${px}" cy="${py}" r="4" fill="#10b981" stroke="#047857" stroke-width="1.5" />
      <text x="${px}" y="${py - 6}" text-anchor="middle" font-family="Outfit" font-size="8.5" font-weight="900" fill="#047857">(${x}, ${y})</text>
      ${labelText('coordinate grid', showLabel)}
    `);
  },

  tally_chart: ({ data = [{ label: 'Apples', count: 7 }, { label: 'Bananas', count: 4 }], showLabel = true } = {}) => {
    const drawTallies = (count) => {
      let tallyStr = '';
      const numGroups = Math.floor(count / 5);
      const remaining = count % 5;
      
      for (let g = 0; g < numGroups; g++) {
        const gx = g * 28;
        tallyStr += `
          <g transform="translate(${gx}, 0)" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round">
            <line x1="2" y1="4" x2="2" y2="20" />
            <line x1="7" y1="4" x2="7" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="17" y1="4" x2="17" y2="20" />
            <line x1="0" y1="18" x2="19" y2="6" stroke="#b91c1c" />
          </g>
        `;
      }
      const rx = numGroups * 28;
      for (let r = 0; r < remaining; r++) {
        const sx = rx + r * 5;
        tallyStr += `
          <line x1="${sx + 2}" y1="4" x2="${sx + 2}" y2="20" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />
        `;
      }
      return tallyStr;
    };

    let rows = '';
    const startY = 36;
    const rowH = 28;

    data.forEach((row, idx) => {
      const y = startY + idx * rowH;
      rows += `
        <rect x="25" y="${y}" width="65" height="${rowH}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2" />
        <text x="57.5" y="${y + 17}" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="700" fill="#1e293b">${row.label}</text>
        <rect x="90" y="${y}" width="125" height="${rowH}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" />
        <g transform="translate(100, ${y + 2})">
          ${drawTallies(row.count)}
        </g>
      `;
    });

    return svg(`
      <rect x="25" y="${startY - 20}" width="65" height="20" fill="#475569" stroke="#334155" stroke-width="1.2" />
      <text x="57.5" y="${startY - 7}" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="900" fill="#ffffff">ITEM</text>
      <rect x="90" y="${startY - 20}" width="125" height="20" fill="#475569" stroke="#334155" stroke-width="1.2" />
      <text x="152.5" y="${startY - 7}" text-anchor="middle" font-family="Outfit" font-size="9" font-weight="900" fill="#ffffff">TALLIES</text>
      ${rows}
      ${labelText('tally chart', showLabel)}
    `);
  },

  pictograph_icons: ({ data = [{ label: 'Red', count: 6 }, { label: 'Blue', count: 4 }], icon = 'apple', valuePerIcon = 2, showLabel = true } = {}) => {
    const drawIcon = (cx, cy, type) => {
      if (type === 'apple') {
        return `
          <g transform="translate(${cx}, ${cy}) scale(0.45)">
            <path d="M 0,-10 Q 8,-20 15,-15 Q 10,0 0,-3 Q -10,0 -15,-15 Q -8,-20 0,-10 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.2" />
            <path d="M 0,-10 C 2,-18 6,-20 6,-20" fill="none" stroke="#78350f" stroke-width="2.2" />
          </g>
        `;
      } else if (type === 'star') {
        return `
          <polygon points="${cx},${cy - 8} ${cx + 2.5},${cy - 2.5} ${cx + 8},${cy - 2.5} ${cx + 3.5},${cy + 1} ${cx + 5.5},${cy + 6.5} ${cx},${cy + 3} ${cx - 5.5},${cy + 6.5} ${cx - 3.5},${cy + 1} ${cx - 8},${cy - 2.5} ${cx - 2.5},${cy - 2.5}" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
        `;
      } else {
        return `<circle cx="${cx}" cy="${cy}" r="6" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.2" />`;
      }
    };

    let rows = '';
    const startY = 38;
    const rowH = 26;

    data.forEach((row, idx) => {
      const y = startY + idx * rowH;
      const numIcons = Math.ceil(row.count / valuePerIcon);
      let icons = '';
      for (let i = 0; i < numIcons; i++) {
        const cx = 95 + i * 16;
        icons += drawIcon(cx, y + rowH / 2, icon);
      }
      rows += `
        <rect x="25" y="${y}" width="60" height="${rowH}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" />
        <text x="55" y="${y + 16}" text-anchor="middle" font-family="Outfit" font-size="8.5" font-weight="700" fill="#1e293b">${row.label}</text>
        <rect x="85" y="${y}" width="130" height="${rowH}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
        ${icons}
      `;
    });

    return svg(`
      ${rows}
      <g transform="translate(120, ${startY + data.length * rowH + 12})">
        ${drawIcon(-35, 0, icon)}
        <text x="-23" y="3" font-family="Outfit" font-size="8" font-weight="800" fill="#475569">Key: 1 Icon = ${valuePerIcon} items</text>
      </g>
      ${labelText('pictograph', showLabel)}
    `);
  },

  cube_train: ({ cubesCount = 5, orientation = 'horizontal', objectLength = 4.3, objectType = 'crayon', showLabel = true } = {}) => {
    const cubeSize = 24;
    const startX = 30;
    const startY = 40;
    
    const drawMeasuredObject = (type, x, y, width, height) => {
      if (type === 'pencil') {
        const tipW = 12;
        const eraserW = 6;
        const leadW = 4;
        const bodyW = width - tipW - eraserW;
        return `
          <g>
            <rect x="${x}" y="${y + height*0.1}" width="${bodyW}" height="${height*0.8}" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
            <path d="M${x + bodyW} ${y + height*0.1} L${x + bodyW + tipW} ${y + height*0.5} L${x + bodyW} ${y + height*0.9} Z" fill="#fed7aa" stroke="#c2410c" stroke-width="0.8" />
            <path d="M${x + bodyW + tipW - leadW} ${y + height*0.37} L${x + bodyW + tipW} ${y + height*0.5} L${x + bodyW + tipW - leadW} ${y + height*0.63} Z" fill="#1e293b" />
            <rect x="${x - eraserW}" y="${y + height*0.1}" width="${eraserW}" height="${height*0.8}" fill="#f43f5e" rx="1" />
          </g>
        `;
      } else if (type === 'crayon') {
        const bodyW = width - 8;
        return `
          <g>
            <rect x="${x}" y="${y + height*0.15}" width="${bodyW}" height="${height*0.7}" fill="#3b82f6" rx="2" stroke="#2563eb" stroke-width="0.8" />
            <path d="M${x + bodyW} ${y + height*0.15} L${x + bodyW + 8} ${y + height*0.5} L${x + bodyW} ${y + height*0.85} Z" fill="#2563eb" />
          </g>
        `;
      } else {
        return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#64748b" rx="2" />`;
      }
    };

    let cubes = '';
    const colors = ['#3b82f6', '#f43f5e', '#10b981', '#fbbf24', '#8b5cf6'];

    if (orientation === 'vertical') {
      const objH = objectLength * cubeSize;
      const objectMarkup = drawMeasuredObject(objectType, startX + 10, startY + (cubesCount * cubeSize) - objH, 18, objH);
      
      for (let i = 0; i < cubesCount; i++) {
        const fill = colors[i % colors.length];
        const cy = startY + (cubesCount - 1 - i) * cubeSize;
        cubes += `
          <rect x="${startX + 40}" y="${cy}" width="${cubeSize}" height="${cubeSize}" fill="${fill}" stroke="#1e293b" stroke-width="1.5" rx="3" />
          <circle cx="${startX + 40 + cubeSize/2}" cy="${cy + cubeSize/2}" r="3" fill="#ffffff" opacity="0.35" />
        `;
      }

      return svg(`
        ${objectMarkup}
        ${cubes}
        <line x1="${startX + 5}" y1="${startY}" x2="${startX + 75}" y2="${startY}" stroke="#f43f5e" stroke-dasharray="2 2" stroke-width="1" />
        <line x1="${startX + 5}" y1="${startY + cubesCount * cubeSize}" x2="${startX + 75}" y2="${startY + cubesCount * cubeSize}" stroke="#f43f5e" stroke-dasharray="2 2" stroke-width="1" />
        ${labelText('cube train measurement', showLabel)}
      `);
    } else {
      const objW = objectLength * cubeSize;
      const objectMarkup = drawMeasuredObject(objectType, startX, startY, objW, 18);

      for (let i = 0; i < cubesCount; i++) {
        const fill = colors[i % colors.length];
        const cx = startX + i * cubeSize;
        cubes += `
          <rect x="${cx}" y="${startY + 32}" width="${cubeSize}" height="${cubeSize}" fill="${fill}" stroke="#1e293b" stroke-width="1.5" rx="3" />
          <circle cx="${cx + cubeSize/2}" cy="${startY + 32 + cubeSize/2}" r="3" fill="#ffffff" opacity="0.35" />
        `;
      }

      return svg(`
        ${objectMarkup}
        ${cubes}
        <line x1="${startX}" y1="${startY - 5}" x2="${startX}" y2="${startY + 62}" stroke="#f43f5e" stroke-dasharray="2 2" stroke-width="1" />
        <line x1="${startX + cubesCount * cubeSize}" y1="${startY - 5}" x2="${startX + cubesCount * cubeSize}" y2="${startY + 62}" stroke="#f43f5e" stroke-dasharray="2 2" stroke-width="1" />
        ${labelText('cube train measurement', showLabel)}
      `);
    }
  }
};

Object.entries(dynamicRenderers).forEach(([id, render]) => {
  if (SVG_TOOL_REGISTRY[id]) SVG_TOOL_REGISTRY[id].render = render;
});

export function getSvgTool(toolId, props = {}) {
  const key = String(toolId || '').trim();
  if (!key) return null;
  const tool = SVG_TOOL_REGISTRY[key] || SVG_TOOL_REGISTRY[key.toLowerCase().replace(/[\s-]+/g, '_')] || null;
  if (!tool) return null;
  return {
    ...tool,
    svg: typeof tool.render === 'function' ? tool.render({ ...(tool.defaultProps || {}), ...props }) : tool.svg
  };
}

export function resolveToolSvg(entity) {
  const tool = getSvgTool(
    entity?.toolSvg || entity?.svgTool || entity?.toolId,
    entity?.toolProps || entity?.svgProps || entity?.visualProps || {}
  );
  return tool?.svg || null;
}

export function listSvgTools() {
  return Object.values(SVG_TOOL_REGISTRY).map(({ id, label, category }) => ({ id, label, category }));
}
