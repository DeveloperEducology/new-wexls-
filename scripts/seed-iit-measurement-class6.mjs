import { MongoClient } from 'mongodb';

// Load env variables manually from .env.local
import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        }
        if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
  }
} catch (e) {
  console.error("Could not load .env.local:", e.message);
}

const templates = [
  {
    _id: 'iit-p6-compare-without-measuring',
    id: 'iit-p6-compare-without-measuring',
    name: 'Compare without measuring',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following objects is **{{property}}**?',
      explanationTemplate: 'We can visually compare physical properties like size, height, and weight based on everyday logic without needing tools.',
      variables: {
        property: { pool: ['longer', 'shorter', 'heavier', 'lighter', 'larger capacity', 'smaller capacity'] }
      },
      options: [
        { label: "A standard classroom chalkboard pointer compared to a new small pencil stub", isCorrect: "property === 'longer'" },
        { label: "A utility telephone pole compared to a short matchstick", isCorrect: "property === 'longer'" },
        { label: "An empty plastic water bottle compared to a metal bottle filled with sand", isCorrect: "property === 'lighter'" },
        { label: "A dry autumn leaf compared to a solid iron dumbbell", isCorrect: "property === 'lighter'" },
        { label: "A massive steel ship anchor compared to a small light plastic button", isCorrect: "property === 'heavier'" },
        { label: "A loaded school bag compared to a single sheet of paper", isCorrect: "property === 'heavier'" },
        { label: "A giant swimming pool compared to a small drinking glass", isCorrect: "property === 'larger capacity'" },
        { label: "A lake compared to a swimming pool", isCorrect: "property === 'larger capacity'" },
        { label: "A sewing needle compared to a wooden yardstick", isCorrect: "property === 'shorter'" },
        { label: "A matchstick compared to a telephone pole", isCorrect: "property === 'shorter'" },
        { label: "A small teacup compared to a large kitchen bucket", isCorrect: "property === 'smaller capacity'" },
        { label: "A drinking glass compared to a swimming pool", isCorrect: "property === 'smaller capacity'" }
      ]
    }
  },
  {
    _id: 'iit-p6-need-standard-units',
    id: 'iit-p6-need-standard-units',
    name: 'Need for standard units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        bodyPart: { pool: ['handspans', 'cubits', 'footspans', 'paces', 'finger widths'] }
      },
      questionTemplate: 'Why can human **{{bodyPart}}** not be used as reliable standard units of measurement?',
      explanationTemplate: 'Standard units must have a fixed, constant size that is identical for everyone. Since physical dimensions of body parts (like {{bodyPart}}) differ from person to person, they cannot serve as standard units.',
      options: [
        { label: "Because the physical size of {{bodyPart}} varies from person to person.", isCorrect: true },
        { label: "Because {{bodyPart}} change size depending on the weather conditions.", isCorrect: false },
        { label: "Because standard units can only be determined by digital sensors.", isCorrect: false },
        { label: "Because {{bodyPart}} cannot measure objects that are longer than one metre.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-identify-length',
    id: 'iit-p6-identify-length',
    name: 'Identify Length',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        quantity: { pool: ['length', 'mass', 'volume', 'time'] }
      },
      questionTemplate: 'Which of the following physical scenarios describes a measurement of **{{quantity}}**?',
      explanationTemplate: 'Length represents distance between points. Mass is how heavy an object is. Volume is the space occupied by a liquid/object. Time is the duration between intervals.',
      options: [
        { 
          label: "Finding the distance between two cities on a map.", 
          isCorrect: "quantity === 'length'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#f0fdf4" stroke="#86efac" stroke-width="2"/><path d="M 25 35 Q 50 65 75 45" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="4,4"/><circle cx="25" cy="35" r="4" fill="#ef4444"/><circle cx="75" cy="45" r="4" fill="#ef4444"/><text x="50" y="80" font-size="8" font-family="system-ui" font-weight="bold" fill="#166534" text-anchor="middle">Distance A to B</text></svg>`
        },
        { 
          label: "Determining how tall a growing sunflower is.", 
          isCorrect: "quantity === 'length'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#fefce8" stroke="#fde047" stroke-width="2"/><line x1="20" y1="90" x2="20" y2="10" stroke="#94a3b8" stroke-width="2" stroke-dasharray="2,2"/><circle cx="50" cy="55" r="16" fill="#eab308"/><circle cx="50" cy="55" r="10" fill="#713f12"/><path d="M 50 90 L 50 71" stroke="#22c55e" stroke-width="4"/><text x="32" y="25" font-size="8" font-family="system-ui" fill="#475569">1.2m</text></svg>`
        },
        { 
          label: "Measuring the amount of space inside a milk carton.", 
          isCorrect: "quantity === 'volume'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#eff6ff" stroke="#93c5fd" stroke-width="2"/><path d="M 30 75 L 30 40 L 50 25 L 70 40 L 70 75 Z" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/><path d="M 30 40 L 50 50 L 70 40 M 50 25 L 50 50" fill="none" stroke="#1d4ed8" stroke-width="1.5"/><text x="50" y="68" font-size="10" font-family="system-ui" font-weight="bold" fill="#1e40af" text-anchor="middle">1 L</text></svg>`
        },
        { 
          label: "Checking how much water a plastic bucket can hold.", 
          isCorrect: "quantity === 'volume'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#eff6ff" stroke="#93c5fd" stroke-width="2"/><ellipse cx="50" cy="35" rx="20" ry="6" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/><path d="M 30 35 L 36 75 C 37 80 63 80 64 75 L 70 35" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/><text x="50" y="60" font-size="8" font-family="system-ui" font-weight="bold" fill="#1e40af" text-anchor="middle">10 Litres</text></svg>`
        },
        { 
          label: "Determining how heavy a sack of potatoes is.", 
          isCorrect: "quantity === 'mass'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#fafaf9" stroke="#d6d3d1" stroke-width="2"/><line x1="20" y1="75" x2="80" y2="75" stroke="#44403c" stroke-width="3"/><path d="M 50 75 L 35 45 C 35 35 65 35 65 45 Z" fill="#d97706" stroke="#92400e" stroke-width="1.5"/><text x="50" y="65" font-size="8" font-family="system-ui" font-weight="bold" fill="#ffffff" text-anchor="middle">5 kg</text></svg>`
        },
        { 
          label: "Measuring the weight of a gold coin on a balance.", 
          isCorrect: "quantity === 'mass'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#fafaf9" stroke="#d6d3d1" stroke-width="2"/><path d="M 50 80 L 50 35 M 30 35 L 70 35 M 30 35 L 30 65 M 70 35 L 70 65" stroke="#44403c" stroke-width="2"/><circle cx="30" cy="65" r="8" fill="#eab308" stroke="#ca8a04"/><circle cx="70" cy="65" r="8" fill="#a8a29e" stroke="#78716c"/><text x="50" y="25" font-size="10" font-family="system-ui" font-weight="bold" fill="#44403c" text-anchor="middle">Balance</text></svg>`
        },
        { 
          label: "Measuring the interval between sunrise and sunset.", 
          isCorrect: "quantity === 'time'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#faf5ff" stroke="#d8b4fe" stroke-width="2"/><path d="M 15 70 Q 50 20 85 70" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="2,2"/><circle cx="50" cy="45" r="8" fill="#f59e0b"/><text x="50" y="80" font-size="8" font-family="system-ui" font-weight="bold" fill="#6b21a8" text-anchor="middle">Day Duration</text></svg>`
        },
        { 
          label: "Tracking the duration of a 100-metre race with a stopwatch.", 
          isCorrect: "quantity === 'time'",
          svg: `<svg viewBox="0 0 100 100" style="width:80px;height:80px;"><rect x="5" y="5" width="90" height="90" rx="10" fill="#faf5ff" stroke="#d8b4fe" stroke-width="2"/><circle cx="50" cy="55" r="22" fill="#ffffff" stroke="#6b21a8" stroke-width="3"/><path d="M 50 33 L 50 25 M 45 25 L 55 25" stroke="#475569" stroke-width="3"/><path d="M 50 55 L 50 40 L 60 50" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/><text x="50" y="90" font-size="8" font-family="system-ui" font-weight="bold" fill="#6b21a8" text-anchor="middle">Stopwatch</text></svg>`
        }
      ]
    }
  },
  {
    _id: 'iit-p6-units-of-length',
    id: 'iit-p6-units-of-length',
    name: 'Units of Length',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following units is most suitable to measure **{{scale}}**?',
      explanationTemplate: 'Astronomical distances are extremely large and are measured in Astronomical Units (A.U.). Small objects are measured in micrometres (μm) or millimetres (mm). standard items are measured in cm or m.',
      variables: {
        scale: { pool: ['very large astronomical distances', 'very small microscopic objects', 'standard household objects'] }
      },
      options: [
        { label: "Astronomical Unit (A.U.)", isCorrect: "scale === 'very large astronomical distances'" },
        { label: "Micrometre (μm) or Angstrom (Å)", isCorrect: "scale === 'very small microscopic objects'" },
        { label: "Centimetre (cm) or Metre (m)", isCorrect: "scale === 'standard household objects'" },
        { label: "Kilogram (kg)", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-convert-units-length',
    id: 'iit-p6-convert-units-length',
    name: 'Convert units of length',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Convert **{{value}}** {{from_unit}} into {{to_unit}}. The answer is [[blank1]] {{to_unit}}.',
      explanationTemplate: 'Conversion rules: 1 m = 100 cm, 1 cm = 10 mm, 1 km = 1000 m. Going down the unit stairs multiplies, going up divides.',
      variables: {
        value: { pool: [5, 12, 25, 80] },
        pair: { pool: ['m_to_cm', 'cm_to_mm', 'km_to_m'] }
      },
      derivations: {
        from_unit: "pair === 'm_to_cm' ? 'm' : (pair === 'cm_to_mm' ? 'cm' : 'km')",
        to_unit: "pair === 'm_to_cm' ? 'cm' : (pair === 'cm_to_mm' ? 'mm' : 'm')",
        correct_val: "pair === 'm_to_cm' ? value * 100 : (pair === 'cm_to_mm' ? value * 10 : value * 1000)"
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{correct_val}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{correct_val}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-read-scale',
    id: 'iit-p6-read-scale',
    name: 'Read scale correctly',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'When measuring a block using a ruler, the left end is aligned at the **{{start}}** cm mark, and the right end aligns at the **{{end}}** cm mark. What is the actual length of the block? The answer is [[blank1]] cm.',
      explanationTemplate: 'Always subtract the starting reading if the object does not begin at zero: \\(\\text{Length} = \\text{End Reading} - \\text{Start Reading} = {{end}} - {{start}} = {{length}}\\) cm.',
      variables: {
        start: { pool: [1, 2, 3] },
        end: { pool: [8, 10, 12] }
      },
      derivations: {
        length: 'end - start'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{length}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{length}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-least-count',
    id: 'iit-p6-least-count',
    name: 'Least count',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'A metre scale has **{{divisions}}** small divisions between the 0 cm and 1 cm marks. What is the least count of this scale? The answer is [[blank1]] mm.',
      explanationTemplate: 'The least count is the smallest value that can be measured accurately. 1 cm = 10 mm. Least count = \\(\\frac{10\\text{ mm}}{{{divisions}}} = {{lc_mm}}\\) mm.',
      variables: {
        divisions: { pool: [10, 20] }
      },
      derivations: {
        lc_mm: '10 / divisions'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{lc_mm}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{lc_mm}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-measure-curved-lines',
    id: 'iit-p6-measure-curved-lines',
    name: 'Measure curved lines',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following is the correct step-by-step procedure to measure the length of a curved line?',
      explanationTemplate: 'A straight wooden ruler cannot bend. The correct way is using a flexible thread to trace the curved path, marking the endpoints, stretching it straight, and then measuring it with a standard ruler.',
      options: [
        { label: "Place a thread along the curve, mark the start and end points, stretch it straight, and measure it with a ruler.", isCorrect: true },
        { label: "Bend a stiff wooden ruler along the curved line and read the marking directly.", isCorrect: false },
        { label: "Measure the straight-line distance between the endpoints and multiply by two.", isCorrect: false },
        { label: "Place a heavy pan balance along the curve to measure its weight.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-measure-tiny-objects',
    id: 'iit-p6-measure-tiny-objects',
    name: 'Measure tiny objects',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'To measure the diameter of a thin wire, a student winds the wire tightly around a pencil to form a coil of **{{turns}}** turns. The total length of the coil is measured to be **{{length}}** mm. What is the diameter of the wire? The answer is [[blank1]] mm.',
      explanationTemplate: 'Measuring a single thin wire is highly inaccurate. We measure the total length of a tightly wound coil and divide by the number of turns: \\(\\text{Diameter} = \\frac{{{length}}}{{{turns}}} = {{diameter}}\\) mm.',
      variables: {
        turns: { pool: [20, 40, 50] },
        length: { pool: [10, 20, 30] }
      },
      derivations: {
        diameter: 'length / turns'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{diameter}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{diameter}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-what-is-area',
    id: 'iit-p6-what-is-area',
    name: 'What is Area?',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['area', 'perimeter'] }
      },
      questionTemplate: 'Which of the following defines **{{concept}}** in physics?',
      explanationTemplate: 'Area is the measure of the surface space occupied by a 2D shape. Perimeter is the total length of the boundary enclosing that shape.',
      options: [
        { label: "The measure of the surface space occupied by a two-dimensional shape.", isCorrect: "concept === 'area'" },
        { label: "The total length of the boundary enclosing a shape.", isCorrect: "concept === 'perimeter'" },
        { label: "The amount of three-dimensional space occupied by a body.", isCorrect: false },
        { label: "The quantity of matter contained within an object.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-area-of-rectangle',
    id: 'iit-p6-area-of-rectangle',
    name: 'Area of rectangle',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Find the area of a rectangular field of length **{{L}}** m and breadth **{{B}}** m. The area is [[blank1]] sq m.',
      explanationTemplate: 'Area of a rectangle is calculated by multiplying its length by its breadth: \\(\\text{Area} = L \\times B = {{L}} \\times {{B}} = {{area}}\\) sq m.',
      variables: {
        L: { pool: [10, 15, 20, 25] },
        B: { pool: [4, 6, 8] }
      },
      derivations: {
        area: 'L * B'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{area}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{area}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-area-units',
    id: 'iit-p6-area-units',
    name: 'Area units conversion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Convert an area of **{{value}}** hectares into square metres (sq m). (Hint: 1 hectare = 10,000 sq m). The answer is [[blank1]] sq m.',
      explanationTemplate: 'Multiply the value in hectares by the conversion factor 10,000: \\({{value}} \\times 10,000 = {{area_sqm}}\\) sq m.',
      variables: {
        value: { pool: [2, 5, 8, 10] }
      },
      derivations: {
        area_sqm: 'value * 10000'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{area_sqm}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{area_sqm}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-irregular-area',
    id: 'iit-p6-irregular-area',
    name: 'Irregular area measurement',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which method is commonly used to estimate the area of an irregular shape like a leaf?',
      explanationTemplate: 'For irregular shapes where no standard formula exists, we place the shape on a standard grid graph paper and count the number of squares it covers.',
      options: [
        { label: "Placing it on graph paper and counting the squares it covers.", isCorrect: true },
        { label: "Multiplying its maximum length by its maximum width.", isCorrect: false },
        { label: "Submerging it in water inside an overflow jar.", isCorrect: false },
        { label: "Wrapping a thread around its boundary and measuring the thread.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-what-is-volume',
    id: 'iit-p6-what-is-volume',
    name: 'What is Volume?',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['volume', 'area', 'mass'] }
      },
      questionTemplate: 'Which of the following defines **{{concept}}** in measurement?',
      explanationTemplate: 'Volume is the 3D space occupied by an object. Area is the 2D surface covered. Mass is the quantity of matter.',
      options: [
        { label: "The amount of space occupied by a three-dimensional substance or object.", isCorrect: "concept === 'volume'" },
        { label: "The total surface covered by a two-dimensional figure.", isCorrect: "concept === 'area'" },
        { label: "The quantity of matter present inside a physical body.", isCorrect: "concept === 'mass'" },
        { label: "The average straight-line distance between two opposite outer edges.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-cuboid-volume',
    id: 'iit-p6-cuboid-volume',
    name: 'Volume of cuboid',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Calculate the volume of a rectangular wooden box of length **{{L}}** cm, breadth **{{B}}** cm, and height **{{H}}** cm. The volume is [[blank1]] cubic cm.',
      explanationTemplate: 'Volume of a cuboid is calculated as: \\(\\text{Volume} = L \\times B \\times H = {{L}} \\times {{B}} \\times {{H}} = {{vol}}\\) cubic cm.',
      variables: {
        L: { pool: [5, 10, 20] },
        B: { pool: [4, 6, 8] },
        H: { pool: [2, 3, 5] }
      },
      derivations: {
        vol: 'L * B * H'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{vol}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{vol}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-liquid-volume',
    id: 'iit-p6-liquid-volume',
    name: 'Liquid volume',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Convert **{{litres}}** litres of milk into millilitres (ml). The answer is [[blank1]] ml.',
      explanationTemplate: '1 litre is equal to 1000 millilitres (ml) or cubic centimetres (cc). Therefore, multiply litres by 1000: \\({{litres}} \\times 1000 = {{ml}}\\) ml.',
      variables: {
        litres: { pool: [2, 3, 5, 8] }
      },
      derivations: {
        ml: 'litres * 1000'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{ml}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{ml}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-irregular-volume',
    id: 'iit-p6-irregular-volume',
    name: 'Irregular volume displacement',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'A stone is lowered into a graduated measuring cylinder filled with water. The initial water level reads **{{initial}}** ml, and the final level reads **{{final}}** ml. What is the volume of the stone? The volume is [[blank1]] cubic cm.',
      explanationTemplate: 'According to the water displacement method, the volume of the submerged object equals the rise in liquid level: \\(\\text{Volume} = \\text{Final Level} - \\text{Initial Level} = {{final}} - {{initial}} = {{vol}}\\) ml (or cubic cm).',
      variables: {
        initial: { pool: [50, 60, 70] },
        final: { pool: [85, 95, 110] }
      },
      derivations: {
        vol: 'final - initial'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{vol}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{vol}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-mass-concept',
    id: 'iit-p6-mass-concept',
    name: 'Mass concept',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['mass', 'weight'] }
      },
      questionTemplate: 'In physics, how is **{{concept}}** defined?',
      explanationTemplate: 'Mass is the quantity of matter contained in a body and does not change. Weight is the force of gravity acting on that body and varies depending on gravity.',
      options: [
        { label: "The quantity of matter contained in a body.", isCorrect: "concept === 'mass'" },
        { label: "The gravitational force exerted on a body.", isCorrect: "concept === 'weight'" },
        { label: "The three-dimensional space occupied by a body.", isCorrect: false },
        { label: "The density per unit volume of an object.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-mass-units',
    id: 'iit-p6-mass-units',
    name: 'Mass units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following is the standard SI unit of mass?',
      explanationTemplate: 'The Standard International (SI) unit of mass is the kilogram (kg). Grams and milligrams are sub-multiples, and tonnes are multiples.',
      options: [
        { label: "Kilogram (kg)", isCorrect: true },
        { label: "Gram (g)", isCorrect: false },
        { label: "Tonne (t)", isCorrect: false },
        { label: "Pound (lb)", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-convert-mass',
    id: 'iit-p6-convert-mass',
    name: 'Convert mass units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'A truck is carrying cargo weighing **{{tonnes}}** metric tonnes. Convert this weight into kilograms (kg). (Hint: 1 metric tonne = 1000 kg). The answer is [[blank1]] kg.',
      explanationTemplate: 'To convert metric tonnes into kilograms, multiply the value by 1000: \\({{tonnes}} \\times 1000 = {{kg}}\\) kg.',
      variables: {
        tonnes: { pool: [3, 5, 8, 12] }
      },
      derivations: {
        kg: 'tonnes * 1000'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{kg}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{kg}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-time-concept',
    id: 'iit-p6-time-concept',
    name: 'Time concept',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['time', 'speed', 'distance'] }
      },
      questionTemplate: 'What represents the measurement of **{{concept}}**?',
      explanationTemplate: 'Time is the interval between two events. Speed is the rate of motion. Distance is the space covered by a moving object.',
      options: [
        { label: "The interval between two distinct events.", isCorrect: "concept === 'time'" },
        { label: "The rate of change of position of an object in motion.", isCorrect: "concept === 'speed'" },
        { label: "The straight-line space covered between two points by an object.", isCorrect: "concept === 'distance'" },
        { label: "The quantity of matter present inside a closed container.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-time-units',
    id: 'iit-p6-time-units',
    name: 'Time units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'How many seconds are there in **{{minutes}}** minutes? The answer is [[blank1]] seconds.',
      explanationTemplate: '1 minute is equal to 60 seconds. Therefore, multiply the number of minutes by 60: \\({{minutes}} \\times 60 = {{seconds}}\\) seconds.',
      variables: {
        minutes: { pool: [5, 10, 15, 30] }
      },
      derivations: {
        seconds: 'minutes * 60'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{seconds}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{seconds}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-clock-reading',
    id: 'iit-p6-clock-reading',
    name: 'Clock reading conversion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Convert a 24-hour clock time of **{{hour_24}}**:{{minute}} into a 12-hour format. The time is [[blank1]] [[blank2]].',
      explanationTemplate: 'For times after 12:00, subtract 12 from the hours value to get the 12-hour PM representation. For example, {{hour_24}} - 12 = {{hour_12}} PM.',
      variables: {
        hour_24: { pool: [14, 18, 20, 23] },
        minute: { pool: ['00', '15', '30', '45'] }
      },
      derivations: {
        hour_12: 'hour_24 - 12',
        am_pm: "'PM'"
      },
      interaction: { engine: 'fill_blank', inputMode: 'text' },
      answer: {
        blank1: '{{hour_12}}:{{minute}}',
        blank2: '{{am_pm}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{hour_12}}:{{minute}}" },
        { type: "exact_match", target: "blank2", value: "{{am_pm}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-choose-instrument',
    id: 'iit-p6-choose-instrument',
    name: 'Choose correct instrument',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which instrument should be selected to measure the **{{quantity}}**?',
      explanationTemplate: 'We choose measuring tools based on accuracy and context. Measuring cylinders for liquid/stone displacement volumes, physical balances for mass, and flexible tapes/thread for curves.',
      variables: {
        quantity: { pool: ['volume of a small stone', 'mass of a bag of rice', 'thickness of a thin copper wire', 'length of a curved running track'] }
      },
      options: [
        { label: "Measuring cylinder & overflow jar", isCorrect: "quantity === 'volume of a small stone'" },
        { label: "Common physical balance", isCorrect: "quantity === 'mass of a bag of rice'" },
        { label: "Winding coil around a pencil with a metre scale", isCorrect: "quantity === 'thickness of a thin copper wire'" },
        { label: "A flexible measuring tape or thread method", isCorrect: "quantity === 'length of a curved running track'" }
      ]
    }
  },
  {
    _id: 'iit-p6-unit-conversion-algorithm',
    id: 'iit-p6-unit-conversion-algorithm',
    name: 'Unit conversion algorithm',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'When converting from a larger unit of measurement to a smaller unit (for example, from kilometres to metres), what mathematical operation is applied?',
      explanationTemplate: 'To go down the unit scale (e.g. large to small unit), we multiply by the unit conversion factor (e.g. 1 km = 1000 m, so multiply by 1000).',
      options: [
        { label: "Multiplication by the unit conversion factor.", isCorrect: true },
        { label: "Division by the unit conversion factor.", isCorrect: false },
        { label: "Addition of the unit conversion factor.", isCorrect: false },
        { label: "Subtraction of the unit conversion factor.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-estimation-real-world',
    id: 'iit-p6-estimation-real-world',
    name: 'Estimation in real-world',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following is the most reasonable estimate for the **{{item}}**?',
      explanationTemplate: 'Real-world estimation builds measurement intuition. Doors are around 2m high, books are a few cm thick, and loaded schoolbags weigh a few kilograms.',
      variables: {
        item: { pool: ['height of a standard classroom door', 'thickness of a standard school textbook', 'mass of a standard school bag'] }
      },
      options: [
        { label: "2 metres", isCorrect: "item === 'height of a standard classroom door'" },
        { label: "2 centimetres", isCorrect: "item === 'thickness of a standard school textbook'" },
        { label: "3 kilograms", isCorrect: "item === 'mass of a standard school bag'" },
        { label: "50 grams", isCorrect: false },
        { label: "20 kilometres", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-mixed-measurement',
    id: 'iit-p6-mixed-measurement',
    name: 'Mixed measurement problems',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.5,
    config: {
      questionTemplate: 'A school playground of length **{{L}}** m and width **{{W}}** m needs to be painted. The total area to paint is [[blank1]] sq m. If a single tin of paint covers 50 sq m of ground, you will need exactly [[blank2]] tins of paint.',
      explanationTemplate: 'First, find the area: \\(\\text{Area} = L \\times W = {{L}} \\times {{W}} = {{area}}\\) sq m. Then, divide by coverage: \\(\\frac{{{area}}}{50} = {{tins}}\\) tins.',
      variables: {
        L: { pool: [50, 100] },
        W: { pool: [20, 30] }
      },
      derivations: {
        area: 'L * W',
        tins: 'L * W / 50'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{area}}',
        blank2: '{{tins}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{area}}" },
        { type: "exact_match", target: "blank2", value: "{{tins}}" }
      ]
    }
  }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding IIT Measurement Templates to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    let upsertCount = 0;
    for (const t of templates) {
      await db.collection('templates').updateOne(
        { _id: t._id },
        {
          $set: {
            ...t,
            updatedAt: new Date()
          },
          $setOnInsert: {
            generatedCount: 0,
            status: 'active',
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      upsertCount++;
    }
    console.log(`🎉 Seeded/updated ${upsertCount} IIT Measurement templates successfully!`);

  } catch (error) {
    console.error("❌ Error seeding templates:", error);
  } finally {
    await client.close();
  }
}

runSeed();
