const { MongoClient } = require("mongodb");

async function createOfficialJNVST2025Spreadsheet() {
  const uri = "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("new-wexls");

  const rows = [];

  // ==========================================
  // SVG VECTOR SHAPE GENERATORS (Q1 to Q40)
  // ==========================================

  // Base SVG Wrapper
  function wrapSvg(innerSvg, size = 110) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" fill="none" stroke="#000" stroke-width="3"/>${innerSvg}</svg>`;
  }

  // --- PART I: ODD ONE OUT (Q1 - Q4) ---
  function makeQ1Svg(type) {
    let inner = '';
    if (type === 'A') inner = `<line x1="20" y1="20" x2="80" y2="80" stroke="#000" stroke-width="2.5"/><line x1="50" y1="50" x2="62" y2="38" stroke="#000" stroke-width="2.5"/>`;
    else if (type === 'B') inner = `<line x1="20" y1="80" x2="80" y2="20" stroke="#000" stroke-width="2.5"/><line x1="50" y1="80" x2="50" y2="92" stroke="#000" stroke-width="2.5"/>`;
    else if (type === 'C') inner = `<line x1="20" y1="20" x2="80" y2="80" stroke="#000" stroke-width="2.5"/><line x1="80" y1="50" x2="92" y2="50" stroke="#000" stroke-width="2.5"/>`;
    else if (type === 'D') inner = `<line x1="20" y1="80" x2="80" y2="20" stroke="#000" stroke-width="2.5"/><line x1="20" y1="50" x2="8" y2="50" stroke="#000" stroke-width="2.5"/>`;
    return wrapSvg(inner);
  }

  function makeQ2Svg(letters) {
    return wrapSvg(`<text x="50" y="60" font-size="28" font-family="sans-serif" font-weight="900" text-anchor="middle" letter-spacing="2">${letters}</text>`);
  }

  function makeQ3Svg(type) {
    let inner = '';
    if (type === 'A') inner = `<polygon points="20,20 20,80 80,80" fill="none" stroke="#000" stroke-width="2.5"/><rect x="20" y="70" width="10" height="10" fill="none" stroke="#000" stroke-width="1.5"/>`;
    else if (type === 'B') inner = `<polygon points="20,20 80,20 50,80" fill="none" stroke="#000" stroke-width="2.5"/><path d="M45,70 A10,10 0 0,0 55,70" fill="none" stroke="#000" stroke-width="1.5"/>`;
    else if (type === 'C') inner = `<polygon points="20,80 80,80 80,20" fill="none" stroke="#000" stroke-width="2.5"/><rect x="70" y="70" width="10" height="10" fill="none" stroke="#000" stroke-width="1.5"/>`;
    else if (type === 'D') inner = `<polygon points="20,80 20,20 80,20" fill="none" stroke="#000" stroke-width="2.5"/><rect x="20" y="20" width="10" height="10" fill="none" stroke="#000" stroke-width="1.5"/>`;
    return wrapSvg(inner);
  }

  function makeQ4Svg(type) {
    let inner = `<circle cx="50" cy="50" r="30" fill="none" stroke="#000" stroke-width="2"/><circle cx="50" cy="50" r="14" fill="none" stroke="#000" stroke-width="2"/>`;
    if (type === 'A') inner += `<line x1="50" y1="50" x2="75" y2="25" stroke="#000" stroke-width="2.5"/><polygon points="75,25 67,27 73,33" fill="#000"/>`;
    else if (type === 'B') inner += `<line x1="50" y1="50" x2="25" y2="75" stroke="#000" stroke-width="2.5"/><polygon points="25,75 33,73 27,67" fill="#000"/>`;
    else if (type === 'C') inner += `<line x1="50" y1="50" x2="50" y2="18" stroke="#000" stroke-width="2.5"/><polygon points="50,18 45,26 55,26" fill="#000"/>`;
    else if (type === 'D') inner += `<line x1="50" y1="50" x2="25" y2="75" stroke="#000" stroke-width="2.5"/><circle cx="20" cy="80" r="7" fill="none" stroke="#000" stroke-width="2"/>`;
    return wrapSvg(inner);
  }

  // --- PART II: FIGURE MATCHING (Q5 - Q8) ---
  function makeQ5Svg(variant) {
    return wrapSvg(`
      <circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-width="2"/>
      <path d="M50,50 L50,18 A32,32 0 0,1 72.6,27.4 Z" fill="${variant === 'A' ? '#000' : '#fff'}" stroke="#000"/>
      <path d="M50,50 L72.6,27.4 A32,32 0 0,1 82,50 Z" fill="${variant === 'B' ? '#000' : '#fff'}" stroke="#000"/>
      <path d="M50,50 L82,50 A32,32 0 0,1 72.6,72.6 Z" fill="${variant === 'A' ? '#000' : '#fff'}" stroke="#000"/>
      <path d="M50,50 L72.6,72.6 A32,32 0 0,1 50,82 Z" fill="${variant === 'C' ? '#000' : '#fff'}" stroke="#000"/>
      <line x1="18" y1="50" x2="82" y2="50" stroke="#000" stroke-width="1.5"/>
      <line x1="50" y1="18" x2="50" y2="82" stroke="#000" stroke-width="1.5"/>
      <line x1="27.4" y1="27.4" x2="72.6" y2="72.6" stroke="#000" stroke-width="1.5"/>
      <line x1="27.4" y1="72.6" x2="72.6" y2="27.4" stroke="#000" stroke-width="1.5"/>
    `);
  }

  function makeQ6Svg(variant) {
    return wrapSvg(`
      <circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="27" y1="27" x2="73" y2="73" stroke="#000" stroke-width="2"/>
      <line x1="27" y1="73" x2="73" y2="27" stroke="#000" stroke-width="2"/>
      <circle cx="36" cy="36" r="3" fill="none" stroke="#000" stroke-width="1.5"/>
      <circle cx="64" cy="36" r="3" fill="none" stroke="#000" stroke-width="1.5"/>
      <circle cx="36" cy="64" r="3" fill="none" stroke="#000" stroke-width="1.5"/>
      <circle cx="64" cy="64" r="3" fill="none" stroke="#000" stroke-width="1.5"/>
    `);
  }

  function makeQ7Svg(type) {
    let inner = '';
    if (type === 'A') inner = `<line x1="50" y1="20" x2="50" y2="80" stroke="#000" stroke-width="2"/><line x1="20" y1="50" x2="80" y2="50" stroke="#000" stroke-width="2"/><polygon points="50,20 45,28 55,28" fill="#000"/>`;
    else inner = `<line x1="50" y1="20" x2="50" y2="80" stroke="#000" stroke-width="2"/><line x1="20" y1="50" x2="80" y2="50" stroke="#000" stroke-width="2"/><polygon points="50,20 45,28 55,28" fill="#000"/><polygon points="80,50 72,45 72,55" fill="#000"/>`;
    return wrapSvg(inner);
  }

  function makeQ8Svg() {
    return wrapSvg(`
      <polygon points="50,20 80,40 70,80 30,80 20,40" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="50" y1="20" x2="70" y2="80" stroke="#000" stroke-width="1.5"/>
      <line x1="50" y1="20" x2="30" y2="80" stroke="#000" stroke-width="1.5"/>
      <line x1="20" y1="40" x2="80" y2="40" stroke="#000" stroke-width="1.5"/>
      <line x1="20" y1="40" x2="70" y2="80" stroke="#000" stroke-width="1.5"/>
      <line x1="80" y1="40" x2="30" y2="80" stroke="#000" stroke-width="1.5"/>
    `);
  }

  // --- PART III: PATTERN COMPLETION (Q9 - Q12) ---
  function makeQ9Svg(type) {
    let inner = `<line x1="50" y1="10" x2="50" y2="90" stroke="#000" stroke-width="1.5"/><line x1="10" y1="50" x2="90" y2="50" stroke="#000" stroke-width="1.5"/>`;
    if (type === 'Q') {
      inner += `<line x1="20" y1="20" x2="50" y2="50" stroke="#000" stroke-width="2"/><line x1="80" y1="20" x2="50" y2="50" stroke="#000" stroke-width="2"/><line x1="20" y1="80" x2="50" y2="50" stroke="#000" stroke-width="2"/>`;
    } else if (type === 'A') {
      inner += `<line x1="50" y1="50" x2="80" y2="80" stroke="#000" stroke-width="2.5"/><polygon points="80,80 72,78 78,72" fill="#000"/>`;
    } else {
      inner += `<line x1="50" y1="50" x2="80" y2="80" stroke="#000" stroke-width="2.5"/>`;
    }
    return wrapSvg(inner);
  }

  function makeQ10Svg(type) {
    return wrapSvg(`
      <line x1="10" y1="10" x2="90" y2="90" stroke="#000" stroke-width="2.5"/>
      <circle cx="30" cy="20" r="3" fill="#000"/><circle cx="40" cy="30" r="3" fill="#000"/><circle cx="50" cy="40" r="3" fill="#000"/>
      <circle cx="20" cy="30" r="3" fill="#000"/><circle cx="30" cy="40" r="3" fill="#000"/><circle cx="40" cy="50" r="3" fill="#000"/>
      ${type === 'A' ? '<circle cx="60" cy="70" r="3" fill="#000"/><circle cx="70" cy="80" r="3" fill="#000"/>' : ''}
    `);
  }

  function makeQ11Svg(type) {
    return wrapSvg(`
      <path d="M20,50 A30,30 0 0,1 80,50 Z" fill="${type === 'A' ? '#000' : 'none'}" stroke="#000" stroke-width="2"/>
      <path d="M20,50 A30,30 0 0,0 80,50 Z" fill="${type === 'A' ? '#000' : 'none'}" stroke="#000" stroke-width="2"/>
    `);
  }

  function makeQ12Svg(type) {
    return wrapSvg(`
      <polygon points="10,10 50,50 10,90" fill="#000"/>
      <polygon points="90,10 50,50 90,90" fill="${type === 'A' ? '#000' : 'none'}" stroke="#000" stroke-width="2"/>
    `);
  }

  // --- PART IV: FIGURE SERIES (Q13 - Q16) ---
  function makeQ13Svg(seriesStr) {
    return wrapSvg(`<text x="50" y="58" font-size="22" font-family="monospace" font-weight="900" text-anchor="middle" letter-spacing="4">${seriesStr}</text>`);
  }

  function makeQ14Svg(top, bot) {
    return wrapSvg(`
      <path d="M35,45 A15,15 0 0,1 65,45 L50,75 Z" fill="none" stroke="#000" stroke-width="2"/>
      <text x="50" y="32" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${top}</text>
      <text x="50" y="90" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${bot}</text>
    `);
  }

  function makeQ15Svg(letter, arrowDir) {
    let arrow = '';
    if (arrowDir === 'left') arrow = `<polygon points="25,50 35,42 35,58" fill="#000"/>`;
    else if (arrowDir === 'down') arrow = `<polygon points="50,75 42,65 58,65" fill="#000"/>`;
    else if (arrowDir === 'right') arrow = `<polygon points="75,50 65,42 65,58" fill="#000"/>`;
    else if (arrowDir === 'up') arrow = `<polygon points="50,25 42,35 58,35" fill="#000"/>`;
    return wrapSvg(`
      <text x="50" y="62" font-size="40" font-family="sans-serif" font-weight="900" text-anchor="middle">${letter}</text>
      ${arrow}
    `);
  }

  function makeQ16Svg(topSym, botSym) {
    return wrapSvg(`
      <rect x="25" y="20" width="22" height="22" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="53" y="20" width="22" height="22" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="25" y="58" width="22" height="22" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="53" y="58" width="22" height="22" fill="none" stroke="#000" stroke-width="2"/>
      <text x="36" y="36" font-size="14" font-weight="bold" text-anchor="middle">${topSym}</text>
      <text x="64" y="74" font-size="14" font-weight="bold" text-anchor="middle">${botSym}</text>
    `);
  }

  // --- PART V: ANALOGY (Q17 - Q20) ---
  function makeQ17Svg(type) {
    let inner = `<polygon points="50,20 80,50 80,80 20,80 20,50" fill="none" stroke="#000" stroke-width="2.5"/>`;
    if (type === 'A' || type === 'Q2') inner += `<line x1="20" y1="50" x2="80" y2="80" stroke="#000" stroke-width="2"/><line x1="80" y1="50" x2="20" y2="80" stroke="#000" stroke-width="2"/>`;
    return wrapSvg(inner);
  }

  function makeQ18Svg(type) {
    return wrapSvg(`
      <circle cx="50" cy="50" r="28" fill="none" stroke="#000" stroke-width="2.5"/>
      <circle cx="40" cy="42" r="3" fill="#000"/>
      <circle cx="60" cy="42" r="3" fill="#000"/>
      <path d="M40,62 Q50,${type === 'A' ? '70' : '54'} 60,62" fill="none" stroke="#000" stroke-width="2.5"/>
    `);
  }

  function makeQ19Svg(outerShape, innerShape) {
    let out = '', ins = '';
    if (outerShape === 'circle') out = `<circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-width="2.5"/>`;
    else if (outerShape === 'triangle') out = `<polygon points="50,18 82,78 18,78" fill="none" stroke="#000" stroke-width="2.5"/>`;

    if (innerShape === 'triangle') ins = `<polygon points="50,38 66,66 34,66" fill="none" stroke="#000" stroke-width="2"/>`;
    else if (innerShape === 'circle') ins = `<circle cx="50" cy="54" r="12" fill="none" stroke="#000" stroke-width="2"/>`;
    else if (innerShape === 'square') ins = `<rect x="40" y="44" width="20" height="20" fill="none" stroke="#000" stroke-width="2"/>`;

    return wrapSvg(out + ins);
  }

  function makeQ20Svg(variant) {
    let fill1 = 'none', fill2 = 'none', fill3 = 'none', fill4 = 'none';
    if (variant === 'A') { fill1 = '#000'; fill4 = '#000'; }
    else if (variant === 'B') { fill2 = '#000'; fill3 = '#000'; }
    return wrapSvg(`
      <rect x="20" y="20" width="30" height="30" fill="${fill1}" stroke="#000" stroke-width="2"/>
      <rect x="50" y="20" width="30" height="30" fill="${fill2}" stroke="#000" stroke-width="2"/>
      <rect x="20" y="50" width="30" height="30" fill="${fill3}" stroke="#000" stroke-width="2"/>
      <rect x="50" y="50" width="30" height="30" fill="${fill4}" stroke="#000" stroke-width="2"/>
    `);
  }

  // --- PART VI: GEOMETRICAL COMPLETION (Q21 - Q24) ---
  function makeQ21Svg(type) {
    if (type === 'A') return wrapSvg(`<path d="M30,20 L70,20 L60,40 L75,55 L55,80 L30,80 Z" fill="none" stroke="#000" stroke-width="2.5"/>`);
    return wrapSvg(`<path d="M30,20 L70,20 L50,50 L70,80 L30,80 Z" fill="none" stroke="#000" stroke-width="2.5"/>`);
  }

  function makeQ22Svg(type) {
    return wrapSvg(`
      <path d="M20,50 A30,30 0 0,1 80,50 Z" fill="none" stroke="#000" stroke-width="2.5"/>
      <polygon points="50,50 30,25 70,25" fill="${type === 'B' ? '#000' : 'none'}" stroke="#000" stroke-width="2"/>
    `);
  }

  function makeQ23Svg(type) {
    return wrapSvg(`<path d="M20,20 L80,20 L80,50 L60,60 L80,70 L80,80 L20,80 Z" fill="none" stroke="#000" stroke-width="2.5"/>`);
  }

  function makeQ24Svg(type) {
    if (type === 'A') return wrapSvg(`<polygon points="30,30 70,50 30,70" fill="none" stroke="#000" stroke-width="2.5"/>`);
    return wrapSvg(`<polygon points="30,30 50,70 70,30" fill="none" stroke="#000" stroke-width="2.5"/>`);
  }

  // --- PART VII: MIRROR IMAGE (Q25 - Q28) ---
  function makeQ25Svg(reflected = false) {
    let arrowX = reflected ? '25' : '75';
    return wrapSvg(`
      <line x1="25" y1="25" x2="75" y2="75" stroke="#000" stroke-width="2.5"/>
      <line x1="25" y1="75" x2="75" y2="25" stroke="#000" stroke-width="2.5"/>
      <circle cx="${arrowX}" cy="25" r="5" fill="#000"/>
      <circle cx="${reflected ? '75' : '25'}" cy="75" r="5" fill="none" stroke="#000" stroke-width="2"/>
    `);
  }

  function makeQ26Svg(str) {
    return wrapSvg(`<text x="50" y="58" font-size="22" font-family="sans-serif" font-weight="900" text-anchor="middle">${str}</text>`);
  }

  function makeQ27Svg(str) {
    return wrapSvg(`<text x="50" y="60" font-size="28" font-family="sans-serif" font-weight="900" text-anchor="middle" letter-spacing="3">${str}</text>`);
  }

  function makeQ28Svg(reflected = false) {
    let leftSym = reflected ? '+' : '-';
    let rightSym = reflected ? '-' : '+';
    return wrapSvg(`
      <circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-width="2.5"/>
      <text x="30" y="56" font-size="20" font-weight="bold" text-anchor="middle">${leftSym}</text>
      <text x="70" y="56" font-size="20" font-weight="bold" text-anchor="middle">${rightSym}</text>
      <text x="50" y="32" font-size="20" font-weight="bold" text-anchor="middle">÷</text>
      <text x="50" y="78" font-size="20" font-weight="bold" text-anchor="middle">×</text>
    `);
  }

  // --- PART VIII: PAPER FOLDING (Q29 - Q32) ---
  function makeQ29Svg(type) {
    if (type === 'A') return wrapSvg(`<rect x="25" y="25" width="50" height="50" fill="none" stroke="#000" stroke-width="2"/><rect x="40" y="40" width="20" height="20" fill="#000"/>`);
    return wrapSvg(`<rect x="35" y="35" width="30" height="30" fill="none" stroke="#000" stroke-width="2"/>`);
  }

  function makeQ30Svg(type) {
    return wrapSvg(`
      <rect x="25" y="25" width="50" height="50" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="25" y="40" width="10" height="20" fill="#fff" stroke="#000"/>
      <rect x="65" y="40" width="10" height="20" fill="#fff" stroke="#000"/>
    `);
  }

  function makeQ31Svg(type) {
    return wrapSvg(`
      <circle cx="35" cy="35" r="4" fill="#000"/><circle cx="65" cy="35" r="4" fill="#000"/>
      <circle cx="35" cy="65" r="4" fill="#000"/><circle cx="65" cy="65" r="4" fill="#000"/>
    `);
  }

  function makeQ32Svg(type) {
    return wrapSvg(`
      <circle cx="35" cy="50" r="5" fill="#000"/><polygon points="65,42 72,56 58,56" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="65" cy="50" r="5" fill="#000"/><polygon points="35,42 42,56 28,56" fill="none" stroke="#000" stroke-width="2"/>
    `);
  }

  // --- PART IX: CUT-OUT ASSEMBLY (Q33 - Q36) ---
  function makeQ33Svg(assembled = false) {
    if (assembled) return wrapSvg(`<polygon points="50,20 80,50 50,80 20,50" fill="none" stroke="#000" stroke-width="2.5"/><line x1="20" y1="50" x2="80" y2="50" stroke="#000" stroke-width="1.5"/><line x1="50" y1="20" x2="50" y2="80" stroke="#000" stroke-width="1.5"/>`);
    return wrapSvg(`<polygon points="50,20 70,45 30,45" fill="none" stroke="#000" stroke-width="2"/><polygon points="20,60 40,60 30,80" fill="none" stroke="#000" stroke-width="2"/><polygon points="60,60 80,60 70,80" fill="none" stroke="#000" stroke-width="2"/>`);
  }

  function makeQ34Svg(assembled = false) {
    return wrapSvg(`
      <rect x="25" y="25" width="50" height="50" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="25" y1="25" x2="75" y2="75" stroke="#000" stroke-width="1.5"/>
      <line x1="25" y1="50" x2="75" y2="50" stroke="#000" stroke-width="1.5"/>
    `);
  }

  function makeQ35Svg(assembled = false) {
    return wrapSvg(`
      <rect x="20" y="25" width="12" height="50" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="36" y="25" width="12" height="50" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="52" y="25" width="12" height="50" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="68" y="25" width="12" height="50" fill="none" stroke="#000" stroke-width="2"/>
    `);
  }

  function makeQ36Svg(assembled = false) {
    return wrapSvg(`
      <rect x="25" y="25" width="30" height="30" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="45" y="45" width="30" height="30" fill="none" stroke="#000" stroke-width="2"/>
    `);
  }

  // --- PART X: EMBEDDED FIGURES (Q37 - Q40) ---
  function makeQ37Svg(type) {
    let fPath = `<path d="M35,25 L65,25 M35,25 L35,75 M35,50 L55,50" fill="none" stroke="#000" stroke-width="3"/>`;
    if (type === 'A') return wrapSvg(`<polygon points="35,25 65,25 50,75" fill="none" stroke="#000" stroke-width="2.5"/><line x1="35" y1="50" x2="65" y2="50" stroke="#000" stroke-width="2"/>`);
    if (type === 'B') return wrapSvg(`<polygon points="35,75 65,75 50,25" fill="none" stroke="#000" stroke-width="2.5"/><line x1="35" y1="50" x2="65" y2="50" stroke="#000" stroke-width="2"/>`);
    if (type === 'C') return wrapSvg(fPath);
    return wrapSvg(`<circle cx="50" cy="50" r="30" fill="none" stroke="#000" stroke-width="2.5"/>`);
  }

  function makeQ38Svg(type) {
    return wrapSvg(`
      <rect x="20" y="20" width="60" height="60" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="20" y1="20" x2="80" y2="80" stroke="#000" stroke-width="2"/>
      <line x1="20" y1="80" x2="80" y2="20" stroke="#000" stroke-width="2"/>
    `);
  }

  function makeQ39Svg(type) {
    return wrapSvg(`
      <path d="M30,25 L30,75 L70,25 L70,75" fill="none" stroke="#000" stroke-width="3"/>
      ${type === 'C' ? '<circle cx="50" cy="50" r="30" fill="none" stroke="#000" stroke-width="1.5"/>' : ''}
    `);
  }

  function makeQ40Svg(type) {
    return wrapSvg(`
      <path d="M50,20 L25,80 M50,20 L75,80 M35,55 L65,55" fill="none" stroke="#000" stroke-width="3"/>
    `);
  }

  // ==========================================
  // SECTION I: MENTAL ABILITY QUESTIONS 1-40
  // ==========================================

  // Q1 - Q4 (Part I: Odd One Out)
  rows.push({
    _id: "jnvst2025_q1", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the figure which is different from the other three.",
    optionA: makeQ1Svg('A'), optionB: makeQ1Svg('B'), optionC: makeQ1Svg('C'), optionD: makeQ1Svg('D'), answer: "B",
    explanation: "Figure B contains an extra intersecting bottom stroke extending outside the frame."
  });

  rows.push({
    _id: "jnvst2025_q2", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the figure/word which is different.",
    optionA: makeQ2Svg('KIT'), optionB: makeQ2Svg('TIK'), optionC: makeQ2Svg('ITK'), optionD: makeQ2Svg('IKC'), answer: "D",
    explanation: "KIT, TIK, and ITK all contain the letters {K, I, T}. IKC contains letter C which is different."
  });

  rows.push({
    _id: "jnvst2025_q3", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the triangle figure which is different.",
    optionA: makeQ3Svg('A'), optionB: makeQ3Svg('B'), optionC: makeQ3Svg('C'), optionD: makeQ3Svg('D'), answer: "B",
    explanation: "Figures A, C, and D are right-angled triangles marked with a 90° square symbol. Figure B is an acute isosceles triangle."
  });

  rows.push({
    _id: "jnvst2025_q4", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the arrow circle figure which is different.",
    optionA: makeQ4Svg('A'), optionB: makeQ4Svg('B'), optionC: makeQ4Svg('C'), optionD: makeQ4Svg('D'), answer: "D",
    explanation: "Figure D has an additional small circle attached to the tail of the arrow."
  });

  // Q5 - Q8 (Part II: Figure Matching)
  rows.push({
    _id: "jnvst2025_q5", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part II (Figure Matching): Question #5: Select the answer figure which is EXACTLY THE SAME as the question figure:\n\n${makeQ5Svg('A')}`,
    optionA: makeQ5Svg('A'), optionB: makeQ5Svg('B'), optionC: makeQ5Svg('C'), optionD: makeQ5Svg('D'), answer: "A",
    explanation: "Option A matches the sector shading pattern of the Question Figure."
  });

  rows.push({
    _id: "jnvst2025_q6", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part II (Figure Matching): Question #6: Select the answer figure which is EXACTLY THE SAME as the question figure:\n\n${makeQ6Svg('A')}`,
    optionA: makeQ6Svg('A'), optionB: makeQ6Svg('B'), optionC: makeQ6Svg('C'), optionD: makeQ6Svg('D'), answer: "A",
    explanation: "Option A matches the dot positions in all four quadrants."
  });

  rows.push({
    _id: "jnvst2025_q7", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part II (Figure Matching): Question #7: Select the answer figure which is EXACTLY THE SAME as the question figure:\n\n${makeQ7Svg('A')}`,
    optionA: makeQ7Svg('A'), optionB: makeQ7Svg('B'), optionC: makeQ7Svg('C'), optionD: makeQ7Svg('D'), answer: "A",
    explanation: "Option A matches the 4-way arrow direction."
  });

  rows.push({
    _id: "jnvst2025_q8", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part II (Figure Matching): Question #8: Select the answer figure which is EXACTLY THE SAME as the question figure:\n\n${makeQ8Svg()}`,
    optionA: makeQ8Svg(), optionB: makeQ8Svg(), optionC: makeQ8Svg(), optionD: makeQ8Svg(), answer: "A",
    explanation: "Option A is identical to the pentagon star structure."
  });

  // Q9 - Q12 (Part III: Pattern Completion)
  rows.push({
    _id: "jnvst2025_q9", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part III (Pattern Completion): Question #9: Find the figure which fits into the missing bottom-right part to complete the pattern:\n\n${makeQ9Svg('Q')}`,
    optionA: makeQ9Svg('A'), optionB: makeQ9Svg('B'), optionC: makeQ9Svg('C'), optionD: makeQ9Svg('D'), answer: "A",
    explanation: "Option A completes the diagonal arrow pointing down-right."
  });

  rows.push({
    _id: "jnvst2025_q10", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part III (Pattern Completion): Question #10: Find the figure which fits into the missing part to complete the pattern:\n\n${makeQ10Svg('Q')}`,
    optionA: makeQ10Svg('A'), optionB: makeQ10Svg('B'), optionC: makeQ10Svg('C'), optionD: makeQ10Svg('D'), answer: "A",
    explanation: "Option A continues the wave dot series into the bottom-right corner."
  });

  rows.push({
    _id: "jnvst2025_q11", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part III (Pattern Completion): Question #11: Find the figure which fits into the missing part to complete the pattern:\n\n${makeQ11Svg('Q')}`,
    optionA: makeQ11Svg('A'), optionB: makeQ11Svg('B'), optionC: makeQ11Svg('C'), optionD: makeQ11Svg('D'), answer: "A",
    explanation: "Option A completes the dotted semicircle symmetry."
  });

  rows.push({
    _id: "jnvst2025_q12", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part III (Pattern Completion): Question #12: Find the figure which fits into the missing part to complete the pattern:\n\n${makeQ12Svg('Q')}`,
    optionA: makeQ12Svg('A'), optionB: makeQ12Svg('B'), optionC: makeQ12Svg('C'), optionD: makeQ12Svg('D'), answer: "A",
    explanation: "Option A completes the black diagonal triangle."
  });

  // Q13 - Q16 (Part IV: Figure Series)
  rows.push({
    _id: "jnvst2025_q13", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IV (Figure Series): Question #13: Select the figure which occupies the 4th blank space to complete the series: [ O ] -> [ O X ] -> [ O X O ] -> [ ? ]`,
    optionA: makeQ13Svg('X O X'), optionB: makeQ13Svg('X O X O'), optionC: makeQ13Svg('O X O X'), optionD: makeQ13Svg('O X O X O'), answer: "C",
    explanation: "The series alternates adding O and X. The 4th term is O X O X."
  });

  rows.push({
    _id: "jnvst2025_q14", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IV (Figure Series): Question #14: Select the figure which occupies the 4th blank space to complete the series: [ Top: O, Bot: X ] -> [ Top: XX, Bot: O ] -> [ Top: O, Bot: XXX ] -> [ ? ]`,
    optionA: makeQ14Svg('XXX', 'Square'), optionB: makeQ14Svg('O', 'XXXX'), optionC: makeQ14Svg('XXXX', 'O'), optionD: makeQ14Svg('X', 'OOOO'), answer: "B",
    explanation: "Top and bottom alternate O and X, increasing X count by 1 each step."
  });

  rows.push({
    _id: "jnvst2025_q15", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IV (Figure Series): Question #15: Select the figure which occupies the 4th blank space to complete the series: [ Z ← ] -> [ N ↓ ] -> [ Z → ] -> [ ? ]`,
    optionA: makeQ15Svg('N', 'left'), optionB: makeQ15Svg('N', 'up'), optionC: makeQ15Svg('N', 'down'), optionD: makeQ15Svg('Z', 'up'), answer: "B",
    explanation: "Letter alternates Z and N; arrow rotates 90° counter-clockwise (Left -> Down -> Right -> Up)."
  });

  rows.push({
    _id: "jnvst2025_q16", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IV (Figure Series): Question #16: Select the figure which occupies the 4th blank space to complete the series.`,
    optionA: makeQ16Svg('↓', 'O'), optionB: makeQ16Svg('↑', 'O'), optionC: makeQ16Svg('↑', 'O'), optionD: makeQ16Svg('↑', 'O'), answer: "B",
    explanation: "The top symbol rotates up while the circle moves to bottom-right."
  });

  // Q17 - Q20 (Part V: Analogy)
  rows.push({
    _id: "jnvst2025_q17", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part V (Analogy Figures): Question #17: Square : Square with X diagonals :: Pentagon : ?`,
    optionA: makeQ17Svg('A'), optionB: makeQ17Svg('B'), optionC: makeQ17Svg('C'), optionD: makeQ17Svg('D'), answer: "A",
    explanation: "Adds internal diagonal cross lines into the outer polygon frame."
  });

  rows.push({
    _id: "jnvst2025_q18", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part V (Analogy Figures): Question #18: Circle Face (Smile) : Circle Face (Frown) :: Arc Hat Face : ?`,
    optionA: makeQ18Svg('A'), optionB: makeQ18Svg('B'), optionC: makeQ18Svg('C'), optionD: makeQ18Svg('D'), answer: "B",
    explanation: "Inverts the mouth curve from smile to frown."
  });

  rows.push({
    _id: "jnvst2025_q19", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part V (Analogy Figures): Question #19: Circle (with Triangle inside) : Triangle (with Circle inside) :: Triangle (with Circle inside) : ?`,
    optionA: makeQ19Svg('triangle', 'square'), optionB: makeQ19Svg('triangle', 'circle'), optionC: makeQ19Svg('circle', 'triangle'), optionD: makeQ19Svg('triangle', 'triangle'), answer: "A",
    explanation: "Swaps outer and inner geometric shapes."
  });

  rows.push({
    _id: "jnvst2025_q20", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part V (Analogy Figures): Question #20: Select the figure which satisfies the grid quadrant shading ratio.`,
    optionA: makeQ20Svg('A'), optionB: makeQ20Svg('B'), optionC: makeQ20Svg('C'), optionD: makeQ20Svg('D'), answer: "B",
    explanation: "Inverts shaded and unshaded diagonal quadrants."
  });

  // Q21 - Q24 (Part VI: Geometrical Completion)
  rows.push({
    _id: "jnvst2025_q21", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VI (Geometrical Figure Completion): Question #21: Select the figure that completes the polygon shape.`,
    optionA: makeQ21Svg('A'), optionB: makeQ21Svg('B'), optionC: makeQ21Svg('C'), optionD: makeQ21Svg('D'), answer: "B",
    explanation: "Option B fits the notch cut along the vertical edge."
  });

  rows.push({
    _id: "jnvst2025_q22", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VI (Geometrical Figure Completion): Question #22: Select the figure that completes the circle wedge shape.`,
    optionA: makeQ22Svg('A'), optionB: makeQ22Svg('B'), optionC: makeQ22Svg('C'), optionD: makeQ22Svg('D'), answer: "B",
    explanation: "Option B completes the 90° circular sector."
  });

  rows.push({
    _id: "jnvst2025_q23", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VI (Geometrical Figure Completion): Question #23: Select the figure that completes the zig-zag square cut.`,
    optionA: makeQ23Svg('A'), optionB: makeQ23Svg('B'), optionC: makeQ23Svg('C'), optionD: makeQ23Svg('D'), answer: "B",
    explanation: "Option B fits the zig-zag teeth cut."
  });

  rows.push({
    _id: "jnvst2025_q24", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VI (Geometrical Figure Completion): Question #24: Select the figure that completes the notch square cut.`,
    optionA: makeQ24Svg('A'), optionB: makeQ24Svg('B'), optionC: makeQ24Svg('C'), optionD: makeQ24Svg('D'), answer: "A",
    explanation: "Option A is the triangular wedge piece fitting into the notch."
  });

  // Q25 - Q28 (Part VII: Mirror Image)
  rows.push({
    _id: "jnvst2025_q25", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VII (Mirror Image): Question #25: Select the exact mirror image across line XY:\n\n${makeQ25Svg(false)}`,
    optionA: makeQ25Svg(true), optionB: makeQ25Svg(false), optionC: makeQ25Svg(true), optionD: makeQ25Svg(false), answer: "A",
    explanation: "Mirror reflection flips left and right elements."
  });

  rows.push({
    _id: "jnvst2025_q26", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VII (Mirror Image): Question #26: Select the exact mirror image of **X ⊗ = C** across line XY.`,
    optionA: makeQ26Svg('C = ⊗ X'), optionB: makeQ26Svg('Ɔ = ⊗ X'), optionC: makeQ26Svg('Ɔ = O X'), optionD: makeQ26Svg('Ɔ = ⊗ X'), answer: "B",
    explanation: "C reflects to Ɔ, ⊗ stays symmetric, = stays =, and X stays X."
  });

  rows.push({
    _id: "jnvst2025_q27", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VII (Mirror Image): Question #27: Select the exact mirror image of word **INK** across line XY.`,
    optionA: makeQ27Svg('I N K'), optionB: makeQ27Svg('ʞ И I'), optionC: makeQ27Svg('K N I'), optionD: makeQ27Svg('ʞ I N'), answer: "B",
    explanation: "INK reflected across vertical mirror becomes ʞ И I."
  });

  rows.push({
    _id: "jnvst2025_q28", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VII (Mirror Image): Question #28: Select the exact mirror image of arithmetic symbols circle across line XY.`,
    optionA: makeQ28Svg(true), optionB: makeQ28Svg(false), optionC: makeQ28Svg(true), optionD: makeQ28Svg(false), answer: "A",
    explanation: "Plus and minus symbols invert horizontal positions."
  });

  // Q29 - Q32 (Part VIII: Paper Folding)
  rows.push({
    _id: "jnvst2025_q29", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VIII (Paper Folding & Punching): Question #29: Select the figure which indicates how the paper will appear when unfolded.`,
    optionA: makeQ29Svg('A'), optionB: makeQ29Svg('B'), optionC: makeQ29Svg('C'), optionD: makeQ29Svg('D'), answer: "A",
    explanation: "Unfolding punch holes generates symmetric quadrant patterns."
  });

  rows.push({
    _id: "jnvst2025_q30", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VIII (Paper Folding & Punching): Question #30: Select the figure which indicates how the paper will appear when unfolded.`,
    optionA: makeQ30Svg('A'), optionB: makeQ30Svg('B'), optionC: makeQ30Svg('C'), optionD: makeQ30Svg('D'), answer: "A",
    explanation: "Unfolding notch cut generates castle edge symmetry."
  });

  rows.push({
    _id: "jnvst2025_q31", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VIII (Paper Folding & Punching): Question #31: Select the figure which indicates how the paper will appear when unfolded.`,
    optionA: makeQ31Svg('A'), optionB: makeQ31Svg('B'), optionC: makeQ31Svg('C'), optionD: makeQ31Svg('D'), answer: "A",
    explanation: "Corner dot punch replicates into all 4 corners."
  });

  rows.push({
    _id: "jnvst2025_q32", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part VIII (Paper Folding & Punching): Question #32: Select the figure which indicates how the paper will appear when unfolded.`,
    optionA: makeQ32Svg('A'), optionB: makeQ32Svg('B'), optionC: makeQ32Svg('C'), optionD: makeQ32Svg('D'), answer: "A",
    explanation: "Diagonal fold punch reflects circles and triangles into opposite corners."
  });

  // Q33 - Q36 (Part IX: Cut-out Assembly)
  rows.push({
    _id: "jnvst2025_q33", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IX (Figure Assembly): Question #33: Select the answer figure formed from the cut-out pieces:\n\n${makeQ33Svg(false)}`,
    optionA: makeQ33Svg(true), optionB: makeQ33Svg(false), optionC: makeQ33Svg(false), optionD: makeQ33Svg(false), answer: "A",
    explanation: "Assembles 3 triangles and 1 diamond into a full diamond shape."
  });

  rows.push({
    _id: "jnvst2025_q34", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IX (Figure Assembly): Question #34: Select the answer figure formed from the cut-out pieces.`,
    optionA: makeQ34Svg(true), optionB: makeQ34Svg(false), optionC: makeQ34Svg(false), optionD: makeQ34Svg(false), answer: "A",
    explanation: "Assembles rectangular and triangular pieces into a square."
  });

  rows.push({
    _id: "jnvst2025_q35", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IX (Figure Assembly): Question #35: Select the answer figure formed from the cut-out pieces.`,
    optionA: makeQ35Svg(true), optionB: makeQ35Svg(false), optionC: makeQ35Svg(false), optionD: makeQ35Svg(false), answer: "A",
    explanation: "Assembles 4 vertical strips."
  });

  rows.push({
    _id: "jnvst2025_q36", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part IX (Figure Assembly): Question #36: Select the answer figure formed from the cut-out pieces.`,
    optionA: makeQ36Svg(true), optionB: makeQ36Svg(false), optionC: makeQ36Svg(false), optionD: makeQ36Svg(false), answer: "A",
    explanation: "Assembles L-polygons into a square."
  });

  // Q37 - Q40 (Part X: Embedded Figures)
  rows.push({
    _id: "jnvst2025_q37", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part X (Embedded Figure): Question #37: Select the answer figure in which the F-shape figure is hidden/embedded:\n\n${makeQ37Svg('C')}`,
    optionA: makeQ37Svg('A'), optionB: makeQ37Svg('B'), optionC: makeQ37Svg('C'), optionD: makeQ37Svg('D'), answer: "C",
    explanation: "Option C contains the exact hidden F-shaped perpendicular lines."
  });

  rows.push({
    _id: "jnvst2025_q38", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part X (Embedded Figure): Question #38: Select the answer figure in which the diagonal square shape is hidden/embedded.`,
    optionA: makeQ38Svg('A'), optionB: makeQ38Svg('B'), optionC: makeQ38Svg('C'), optionD: makeQ38Svg('D'), answer: "A",
    explanation: "Option A contains the diagonal cross lines inside the square."
  });

  rows.push({
    _id: "jnvst2025_q39", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part X (Embedded Figure): Question #39: Select the answer figure in which the N-shape line is hidden/embedded.`,
    optionA: makeQ39Svg('A'), optionB: makeQ39Svg('B'), optionC: makeQ39Svg('C'), optionD: makeQ39Svg('D'), answer: "C",
    explanation: "Option C contains the embedded N-shaped stroke."
  });

  rows.push({
    _id: "jnvst2025_q40", section: "mat", sectionName: "Mental Ability (MAT)",
    questionText: `Part X (Embedded Figure): Question #40: Select the answer figure in which the A-shape triangle is hidden/embedded.`,
    optionA: makeQ40Svg('A'), optionB: makeQ40Svg('B'), optionC: makeQ40Svg('C'), optionD: makeQ40Svg('D'), answer: "A",
    explanation: "Option A contains the embedded A-shaped triangle stroke."
  });


  // ==========================================
  // SECTION II: ARITHMETIC TEST (Q41 - Q60)
  // ==========================================

  rows.push({
    _id: "jnvst2025_q41", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "If the number B is 10% less than another number C and C is 5% more than 150, then B is equal to:",
    optionA: "157.85", optionB: "153.85", optionC: "151.75", optionD: "141.75", answer: "D",
    explanation: "C = 150 × 1.05 = 157.5. B = 157.5 × 0.90 = 141.75."
  });

  rows.push({
    _id: "jnvst2025_q42", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "The sum of HCF and LCM of 45, 60 and 75 is:",
    optionA: "330", optionB: "960", optionC: "915", optionD: "630", answer: "C",
    explanation: "HCF(45, 60, 75) = 15. LCM(45, 60, 75) = 900. Sum = 15 + 900 = 915."
  });

  rows.push({
    _id: "jnvst2025_q43", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "The value of $0.9 \\div (0.3 \\times 0.3)$ is:",
    optionA: "0.01", optionB: "0.1", optionC: "1", optionD: "10", answer: "D",
    explanation: "0.3 × 0.3 = 0.09. 0.9 ÷ 0.09 = 10."
  });

  rows.push({
    _id: "jnvst2025_q44", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "What will be the difference between the greatest 6-digit number and the greatest 5-digit number?",
    optionA: "100000", optionB: "100001", optionC: "99999", optionD: "900000", answer: "D",
    explanation: "Greatest 6-digit = 999999. Greatest 5-digit = 99999. Difference = 999999 - 99999 = 900000."
  });

  rows.push({
    _id: "jnvst2025_q45", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "What is the difference between the greatest 7-digit number and the smallest 4-digit number?",
    optionA: "9990999", optionB: "9993999", optionC: "9996999", optionD: "9998999", answer: "D",
    explanation: "Greatest 7-digit = 9999999. Smallest 4-digit = 1000. Difference = 9999999 - 1000 = 9998999."
  });

  rows.push({
    _id: "jnvst2025_q46", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "Amit bought a table for ₹ 1,200 and spent ₹ 200 on its repair. He sold it for ₹ 1,680. His profit or loss percent is:",
    optionA: "12% profit", optionB: "16 2/3% profit", optionC: "20% loss", optionD: "20% profit", answer: "D",
    explanation: "Total CP = ₹1200 + ₹200 = ₹1400. SP = ₹1680. Profit = ₹280. Profit% = (280 / 1400) × 100 = 20% profit."
  });

  rows.push({
    _id: "jnvst2025_q47", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "$140.75 \\times 0.01$ is equal to:",
    optionA: "140.75", optionB: "14000.75", optionC: "1.4075", optionD: "0.14075", answer: "C",
    explanation: "140.75 × 0.01 = 1.4075."
  });

  rows.push({
    _id: "jnvst2025_q48", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "One-fourth of birds of a flock are at a river bank and one-fifth of that flock are in their nest. Remaining 22 birds are wandering in search of food. What is the number of birds which are in their nest?",
    optionA: "40", optionB: "18", optionC: "10", optionD: "8", answer: "D",
    explanation: "Let total birds = N. Remaining fraction = 1 - 1/4 - 1/5 = 11/20. (11/20)N = 22 => N = 40. Birds in nest = 40 / 5 = 8."
  });

  rows.push({
    _id: "jnvst2025_q49", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "In how many years does the sum of ₹ 1,200 become ₹ 1,800 at the rate of simple interest of 5% per annum?",
    optionA: "10 years", optionB: "20 years", optionC: "15 years", optionD: "25 years", answer: "A",
    explanation: "Interest = ₹1800 - ₹1200 = ₹600. Time = (Interest × 100) / (Principal × Rate) = (600 × 100) / (1200 × 5) = 10 years."
  });

  rows.push({
    _id: "jnvst2025_q50", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "How many bricks will be required for a wall 8 m long, 6 m high and 22.5 cm thick, if each brick measures 25 cm × 11.25 cm × 6 cm?",
    optionA: "640", optionB: "1380", optionC: "6400", optionD: "7600", answer: "C",
    explanation: "Wall volume = 800 × 600 × 22.5 = 10,800,000 cm³. Brick volume = 25 × 11.25 × 6 = 1687.5 cm³. Bricks required = 10800000 / 1687.5 = 6,400."
  });

  rows.push({
    _id: "jnvst2025_q51", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "If $15 - 15 \\div 15 \\times 6 = x$, then the value of x is:",
    optionA: "6", optionB: "0", optionC: "9", optionD: "84", answer: "C",
    explanation: "Order of operations: 15 ÷ 15 = 1. 1 × 6 = 6. 15 - 6 = 9."
  });

  rows.push({
    _id: "jnvst2025_q52", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "$\\frac{3}{8} \\div \\left( \\frac{5}{3} - \\frac{1}{6} \\right) + \\frac{5}{8}$ is equal to:",
    optionA: "3/8", optionB: "2 5/8", optionC: "7/8", optionD: "1 1/8", answer: "C",
    explanation: "(5/3 - 1/6) = 9/6 = 3/2. (3/8) ÷ (3/2) = (3/8) × (2/3) = 1/4. 1/4 + 5/8 = 7/8."
  });

  rows.push({
    _id: "jnvst2025_q53", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "The value of x which makes the following statement true is $\\left( 3 \\frac{7}{11} \\times \\frac{11}{5} \\right) \\div \\left( \\frac{3}{7} \\times x \\right) = \\frac{4}{3}$:",
    optionA: "7/2", optionB: "14", optionC: "7", optionD: "28", answer: "B",
    explanation: "3 7/11 = 40/11. (40/11) × (11/5) = 8. 8 ÷ (3x/7) = 4/3 => (56/3x) = 4/3 => 4x = 56 => x = 14."
  });

  rows.push({
    _id: "jnvst2025_q54", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "5% of 10% of 175 grams is equal to:",
    optionA: "8.75 gm", optionB: "0.5 gm", optionC: "0.875 gm", optionD: "17.5 gm", answer: "C",
    explanation: "175 × 0.10 × 0.05 = 0.875 grams."
  });

  rows.push({
    _id: "jnvst2025_q55", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "Which of the following is NOT equal to 25?",
    optionA: "50 - (100 ÷ 4)", optionB: "20 + (20 ÷ 4)", optionC: "10 + (5 × 2) + (10 - 5)", optionD: "24 + (2 × 1)", answer: "D",
    explanation: "Option D evaluates to 24 + 2 = 26, which is not equal to 25."
  });

  rows.push({
    _id: "jnvst2025_q56", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "A square and a rectangle have the same perimeter. If the side of the square is 16 m and the length of the rectangle is 18 m, the breadth of the rectangle is:",
    optionA: "14 m", optionB: "15 m", optionC: "16 m", optionD: "17 m", answer: "A",
    explanation: "Perimeter of square = 4 × 16 = 64 m. Rectangle 2(18 + b) = 64 => 18 + b = 32 => b = 14 m."
  });

  rows.push({
    _id: "jnvst2025_q57", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "A park is 1500 metres long and 750 metres wide. A cyclist has to take four rounds of this park. How much time will he take at the speed of 4.5 km/h?",
    optionA: "40 hours", optionB: "20 hours", optionC: "10 hours", optionD: "4 hours", answer: "D",
    explanation: "Perimeter = 2 × (1500 + 750) = 4500 m. 4 rounds = 18000 m = 18 km. Time = 18 km / 4.5 km/h = 4 hours."
  });

  rows.push({
    _id: "jnvst2025_q58", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "The prime factorisation of 640 is:",
    optionA: "2 × 2 × 2 × 2 × 2 × 5", optionB: "2 × 2 × 2 × 2 × 2 × 2 × 5", optionC: "2 × 2 × 2 × 2 × 2 × 5 × 5", optionD: "2 × 2 × 2 × 2 × 2 × 2 × 2 × 5", answer: "D",
    explanation: "640 = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 5 = 2^7 × 5."
  });

  rows.push({
    _id: "jnvst2025_q59", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "Find the approximate result of the following expression (in whole numbers): $49.6 \\times 10.2 - 7.1 \\times 29.7 - 5.1 \\times 20.1$:",
    optionA: "390", optionB: "290", optionC: "209", optionD: "190", answer: "D",
    explanation: "Approximating: 50 × 10 - 7 × 30 - 5 × 20 = 500 - 210 - 100 = 190."
  });

  rows.push({
    _id: "jnvst2025_q60", section: "arithmetic", sectionName: "Arithmetic Test",
    questionText: "We reached our destination at 2:45 pm after travelling for $4 \\frac{1}{2}$ hours. When did we start?",
    optionA: "9:00 am", optionB: "10:00 am", optionC: "10:15 am", optionD: "8:15 am", answer: "C",
    explanation: "Subtracting 4 hours 30 minutes from 2:45 pm gives 10:15 am."
  });

  // ==========================================
  // SECTION III: LANGUAGE TEST (Q61 - Q80)
  // ==========================================

  // Passage 1: Firefighters (Q61 - Q65)
  const p1 = "Fire is to blame for the loss of countless lives and billions of rupees each and every year. Firefighters help protect people and their property from injury and damage. They put their lives on the line every time they respond to a call.\n\nWhile on duty, firefighters must be ready to respond in a matter of minutes to just about any disaster that may occur. At every fire scene, a superior fire officer takes command and directs the jobs of all the people at the scene. Some firemen connect the hose lines to hydrants. Others manually operate the pumps to send water to the hoses. Teams of firefighters also operate ladders used to reach distances high in the air.";

  rows.push({
    _id: "jnvst2025_q61", section: "language", sectionName: "Language Test",
    questionText: `${p1}\n\n**61. Which is not true about the firefighters?**`,
    optionA: "They are brave.", optionB: "They often put their lives in danger.", optionC: "They never put their lives in danger.", optionD: "They are highly trained.", answer: "C",
    explanation: "The passage states firefighters put their lives on the line, making option C untrue."
  });

  rows.push({
    _id: "jnvst2025_q62", section: "language", sectionName: "Language Test",
    questionText: `${p1}\n\n**62. A firefighter has to prepare to extinguish a fire in:**`,
    optionA: "minutes.", optionB: "hours.", optionC: "days.", optionD: "weeks.", answer: "A",
    explanation: "The passage states they respond in a matter of minutes."
  });

  rows.push({
    _id: "jnvst2025_q63", section: "language", sectionName: "Language Test",
    questionText: `${p1}\n\n**63. 'Firefighters put their lives on the line' means:**`,
    optionA: "they stand in a line.", optionB: "they fight fire.", optionC: "they put their lives in danger.", optionD: "they connect the hose line to hydrant.", answer: "C",
    explanation: "'Put their lives on the line' means risking their lives."
  });

  rows.push({
    _id: "jnvst2025_q64", section: "language", sectionName: "Language Test",
    questionText: `${p1}\n\n**64. To 'operate manually' means to:**`,
    optionA: "make a man work.", optionB: "work with their hands.", optionC: "use a machine.", optionD: "use one's body.", answer: "B",
    explanation: "Manual operation means operating by hand."
  });

  rows.push({
    _id: "jnvst2025_q65", section: "language", sectionName: "Language Test",
    questionText: `${p1}\n\n**65. The word 'occur' means the same as:**`,
    optionA: "come.", optionB: "happen.", optionC: "call.", optionD: "fire.", answer: "B",
    explanation: "'Occur' is synonymous with 'happen'."
  });

  // Passage 2: Hema's Clothes (Q66 - Q70)
  const p2 = "Hema lay on her bed staring at the stars stuck on the ceiling of her room. She was upset as none of the clothes seemed to fit her. She wore them again one by one but they were either too tight or too short. A cupboard full of clothes and she could not wear any of them. She then had a bright idea, her eyes lit up and she ran to her mother's room. 'Ma, I need new clothes,' she said, 'but only after I donate all my old clothes to charity. No more amassing of clothes.' Her mother smiled and hugged her. She did have a kind daughter!";

  rows.push({
    _id: "jnvst2025_q66", section: "language", sectionName: "Language Test",
    questionText: `${p2}\n\n**66. Hema lay on her bed because she:**`,
    optionA: "was tired.", optionB: "liked looking at the stars.", optionC: "was wondering what to wear.", optionD: "was a lazy girl.", answer: "C",
    explanation: "She was upset as none of her clothes fit her."
  });

  rows.push({
    _id: "jnvst2025_q67", section: "language", sectionName: "Language Test",
    questionText: `${p2}\n\n**67. She could not wear any of her clothes because:**`,
    optionA: "they were not fashionable.", optionB: "they were too colourful.", optionC: "she did not know what to choose.", optionD: "none of them fitted her.", answer: "D",
    explanation: "Her clothes were either too tight or too short."
  });

  rows.push({
    _id: "jnvst2025_q68", section: "language", sectionName: "Language Test",
    questionText: `${p2}\n\n**68. The synonym of the word 'amassing' is:**`,
    optionA: "collecting.", optionB: "distributing.", optionC: "sharing.", optionD: "gifting.", answer: "A",
    explanation: "'Amassing' means accumulating or collecting."
  });

  rows.push({
    _id: "jnvst2025_q69", section: "language", sectionName: "Language Test",
    questionText: `${p2}\n\n**69. Hema is:**`,
    optionA: "greedy.", optionB: "charitable.", optionC: "selfish.", optionD: "miserly.", answer: "B",
    explanation: "She decided to donate her clothes to charity."
  });

  rows.push({
    _id: "jnvst2025_q70", section: "language", sectionName: "Language Test",
    questionText: `${p2}\n\n**70. The opposite of the word 'donate' is:**`,
    optionA: "give.", optionB: "receive.", optionC: "distribute.", optionD: "spend.", answer: "B",
    explanation: "'Donate' means to give; its antonym is 'receive'."
  });

  // Passage 3: Travelling (Q71 - Q75)
  const p3 = "Travelling is both recreational and educative. It has always been regarded as an important part of education. In Europe, a young man is considered fully educated only when he has travelled through many countries of Europe. In ancient India also, our sages understood the great value of travelling. They made it a pious duty to visit various pilgrim centres situated in different parts of India. This encouraged the feeling of oneness among Indians.";

  rows.push({
    _id: "jnvst2025_q71", section: "language", sectionName: "Language Test",
    questionText: `${p3}\n\n**71. It is important to _____ if one wants to get real education.**`,
    optionA: "study", optionB: "work", optionC: "travel", optionD: "meditate", answer: "C",
    explanation: "The passage emphasizes that travelling is an important part of education."
  });

  rows.push({
    _id: "jnvst2025_q72", section: "language", sectionName: "Language Test",
    questionText: `${p3}\n\n**72. Which one of the following words is a synonym of 'recreational'?**`,
    optionA: "educational", optionB: "thrilling", optionC: "tiring", optionD: "sight-seeing", answer: "D",
    explanation: "'Recreational' refers to leisure activities like sight-seeing."
  });

  rows.push({
    _id: "jnvst2025_q73", section: "language", sectionName: "Language Test",
    questionText: `${p3}\n\n**73. Visiting the _____ centres was considered holy in ancient India.**`,
    optionA: "training", optionB: "pilgrim", optionC: "city", optionD: "business", answer: "B",
    explanation: "The passage notes visiting pilgrim centres was considered a pious duty."
  });

  rows.push({
    _id: "jnvst2025_q74", section: "language", sectionName: "Language Test",
    questionText: `${p3}\n\n**74. People have a feeling of oneness with others if they _____ a lot.**`,
    optionA: "travel", optionB: "talk", optionC: "play", optionD: "question", answer: "A",
    explanation: "Travelling encouraged the feeling of oneness among Indians."
  });

  rows.push({
    _id: "jnvst2025_q75", section: "language", sectionName: "Language Test",
    questionText: `${p3}\n\n**75. A sage is a person who is _____:**`,
    optionA: "learned", optionB: "smart", optionC: "free", optionD: "wicked", answer: "A",
    explanation: "Sages were wise, learned individuals in ancient India."
  });

  // Passage 4: Cycling (Q76 - Q80)
  const p4 = "To be fit and healthy, you need to be physically active. Regular physical activity protects you from serious diseases such as obesity, heart disease, cancer, mental illness, diabetes and arthritis. Riding a bicycle regularly is one of the best ways to reduce your risk of health problems associated with a sedentary lifestyle. Cycling is a healthy, low-impact exercise that can be enjoyed by people of all ages, from young children to older adults. It is also fun, cheap and good for the environment. Riding to work or the shop is one of the most time-efficient ways to combine regular exercise with everyday routine. An estimated one billion people ride bicycles every day for transport, recreation and sport. Cycling is a good way to reduce weight as it builds muscle and burns body fat. Research suggests that by cycling for half an hour everyday we can shed at least five kilos of weight in a year.";

  rows.push({
    _id: "jnvst2025_q76", section: "language", sectionName: "Language Test",
    questionText: `${p4}\n\n**76. The main focus of the passage is to tell us the advantages of:**`,
    optionA: "keeping fit.", optionB: "cycling.", optionC: "exercising.", optionD: "reducing weight.", answer: "B",
    explanation: "The passage focuses primarily on the health and lifestyle benefits of cycling."
  });

  rows.push({
    _id: "jnvst2025_q77", section: "language", sectionName: "Language Test",
    questionText: `${p4}\n\n**77. When the writer says 'Cycling is good for the environment', which of the following is NOT correct?**`,
    optionA: "It does not emit any unhealthy gas.", optionB: "It can be run without petrol or diesel.", optionC: "It does not pollute air.", optionD: "It can be ridden by all age groups.", answer: "D",
    explanation: "While it can be ridden by all age groups, that statement relates to accessibility, not directly to environmental benefit."
  });

  rows.push({
    _id: "jnvst2025_q78", section: "language", sectionName: "Language Test",
    questionText: `${p4}\n\n**78. The word which means the opposite of the word 'sedentary' is:**`,
    optionA: "active.", optionB: "lazy.", optionC: "inactive.", optionD: "deskbound.", answer: "A",
    explanation: "'Sedentary' means inactive; its opposite is 'active'."
  });

  rows.push({
    _id: "jnvst2025_q79", section: "language", sectionName: "Language Test",
    questionText: `${p4}\n\n**79. A low-impact exercise is one which is:**`,
    optionA: "not tiring.", optionB: "not costly.", optionC: "not efficient.", optionD: "not boring.", answer: "A",
    explanation: "Low-impact exercise puts less strain and fatigue on joints and body."
  });

  rows.push({
    _id: "jnvst2025_q80", section: "language", sectionName: "Language Test",
    questionText: `${p4}\n\n**80. Regular cycling helps us in all of the following except to:**`,
    optionA: "reduce fat and strengthen muscles.", optionB: "combine fun with work.", optionC: "prevent serious accidents.", optionD: "remain healthy.", answer: "C",
    explanation: "Cycling improves health but does not prevent traffic accidents."
  });

  // Create Template Document
  const templateDoc = {
    _id: "2025-jnvst-official-pyq-template",
    id: "2025-jnvst-official-pyq-template",
    title: "Official JNVST 2025 Question Paper (Code R - 80 Questions)",
    name: "Official JNVST 2025 Question Paper (Code R - 80 Questions)",
    examId: "jnvst",
    subject: "previous_years",
    grade: "6",
    topic: "jnvst-2025-official",
    isSpreadsheetStatic: true,
    rows: rows,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection("templates").replaceOne({ _id: templateDoc._id }, templateDoc, { upsert: true });
  await db.collection("dynamic_templates").replaceOne({ _id: templateDoc._id }, templateDoc, { upsert: true });
  await db.collection("mock_tests").replaceOne({ _id: templateDoc._id }, templateDoc, { upsert: true });

  console.log("✅ Successfully Processed PDF & Created Official JNVST 2025 Template with 80 Vector SVG Questions!");
  await client.close();
}

createOfficialJNVST2025Spreadsheet();
