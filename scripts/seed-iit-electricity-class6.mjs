import { MongoClient } from 'mongodb';
import fs from 'fs';

try {
  if (fs.existsSync('.env.local')) {
    const envFile = fs.readFileSync('.env.local', 'utf-8');
    envFile.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
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
    _id: 'iit-p6-electric-charge',
    id: 'iit-p6-electric-charge',
    name: 'Understand electric charge types and units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['types', 'neutral', 'si_unit', 'static'] }
      },
      derivations: {
        question_text: "concept === 'types' ? 'How many types of electric charges exist in nature?' : (concept === 'neutral' ? 'A body that has equal amounts of positive and negative charges is called:' : (concept === 'si_unit' ? 'What is the S.I. unit of electric charge?' : 'The branch of physics that studies electric charges at rest is called:'))",
        opt_correct: "concept === 'types' ? 'Two (positive and negative)' : (concept === 'neutral' ? 'Neutral' : (concept === 'si_unit' ? 'Coulomb' : 'Static electricity'))",
        opt_wrong1: "concept === 'types' ? 'Three (positive, negative, and neutral)' : (concept === 'neutral' ? 'Negatively charged' : (concept === 'si_unit' ? 'Ampere' : 'Current electricity'))",
        opt_wrong2: "concept === 'types' ? 'One (universal charge)' : (concept === 'neutral' ? 'Positively charged' : (concept === 'si_unit' ? 'Volt' : 'Magnetism'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Electric Charge Concepts:**\n\n* **Types of Charges**: There are two types of charges in nature: positive ($+q$) and negative ($-q$). They can exist independently.\n* **Charged vs. Neutral Bodies**:\n  * A positively charged body has an excess of positive charges.\n  * A negatively charged body has an excess of negative charges.\n  * A **neutral body** has an equal number of positive and negative charges, balancing out to a net charge of zero.\n* **S.I. Unit**: The S.I. unit of charge is the **Coulomb (C)**.\n* **Static Electricity**: The study of electric charges at rest (stationary charges).',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-electric-current-defn',
    id: 'iit-p6-electric-current-defn',
    name: 'Calculate current, charge, and time relations',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        charge: { pool: [12, 60, 100] },
        time: { pool: [3, 4, 10] }
      },
      questionTemplate: 'A quantity of **{{charge}}** Coulombs of charge flows past a point in a circuit in **{{time}}** seconds. Calculate the electric current ($i$) in the circuit. The answer is [[blank1]] A.',
      explanationTemplate: '**Electric Current Definition and Formula:**\n\nElectric current is defined as the rate of flow of electric charge per unit time through a conductor:\n\n$$\\text{Current } (i) = \\frac{\\text{Charge } (q)}{\\text{Time } (t)}$$\n\n**Given values in this problem:**\n* Total Charge ($q$) = {{charge}} C\n* Time ($t$) = {{time}} seconds\n\n**Step-by-step Calculation:**\n\n$$i = \\frac{{{charge}} \\text{ C}}{{{time}} \\text{ s}}$$\n\n$$i = {{current}} \\text{ Amperes (A)}$$\n\n*Note: The S.I. unit of current is Ampere (A), where $1\\text{ Ampere} = 1\\text{ Coulomb / second}$.*',
      derivations: {
        current: 'Math.round((charge / time) * 100) / 100'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{current}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{current}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-electric-cell-terminals',
    id: 'iit-p6-electric-cell-terminals',
    name: 'Identify electric cell terminals and functions',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['metal_cap', 'metal_disc', 'energy_conversion', 'battery'] }
      },
      derivations: {
        question_text: "concept === 'metal_cap' ? 'The metal cap on one side of an electric cell represents which terminal?' : (concept === 'metal_disc' ? 'The metal disc on one side of an electric cell represents which terminal?' : (concept === 'energy_conversion' ? 'An electric cell converts which form of energy into electrical energy?' : 'A combination of two or more electric cells connected in series is called a:'))",
        opt_correct: "concept === 'metal_cap' ? 'Positive terminal (+)' : (concept === 'metal_disc' ? 'Negative terminal (-)' : (concept === 'energy_conversion' ? 'Chemical energy' : 'Battery'))",
        opt_wrong1: "concept === 'metal_cap' ? 'Negative terminal (-)' : (concept === 'metal_disc' ? 'Positive terminal (+)' : (concept === 'energy_conversion' ? 'Magnetic energy' : 'Generator'))",
        opt_wrong2: "concept === 'metal_cap' ? 'Neutral terminal' : (concept === 'metal_disc' ? 'Neutral terminal' : (concept === 'energy_conversion' ? 'Light energy' : 'Switch'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**The Electric Cell:**\n\n* **Terminals**: All electric cells have two terminals:\n  1. **Positive Terminal (+)**: Represented by the raised **metal cap**.\n  2. **Negative Terminal (-)**: Represented by the flat **metal disc**.\n* **Energy Conversion**: An electric cell converts **chemical energy** stored inside it into **electrical energy**. When the chemicals are used up, the cell stops producing electricity.\n* **Battery**: A combination of two or more cells connected in series (positive terminal of one connected to the negative terminal of the next) is called a **battery**.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-conductors-insulators',
    id: 'iit-p6-conductors-insulators',
    name: 'Classify conductors and insulators',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        material_type: { pool: ['conductor', 'insulator'] }
      },
      derivations: {
        type_label: "material_type === 'conductor' ? 'conductors' : 'insulators'"
      },
      questionTemplate: 'Which of the following sets of materials consists entirely of **{{type_label}}**?',
      explanationTemplate: '**Conductors vs. Insulators:**\n\n* **Conductors**: Materials that allow electric current to pass through them easily. Most metals (copper, iron, aluminum) and graphite (a non-metal) are good conductors.\n* **Insulators (Non-conductors)**: Materials that do not allow electric current to pass through them. Examples include rubber, plastic, dry wood, glass, and paper.\n* **Safety role**: Handles of electrical tools are covered with insulators (like plastic or rubber) to protect users from electric shocks.',
      options: [
        { label: "Copper wire, iron nail, aluminum key, and graphite rod.", isCorrect: "material_type === 'conductor'" },
        { label: "Plastic cup, rubber band, glass sheet, and dry wood plank.", isCorrect: "material_type === 'insulator'" }
      ]
    }
  },
  {
    _id: 'iit-p6-circuit-closed-open',
    id: 'iit-p6-circuit-closed-open',
    name: 'Closed vs open circuits and switch functions',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['closed', 'open', 'switch_on', 'switch_off'] }
      },
      derivations: {
        question_text: "concept === 'closed' ? 'An unbroken, complete path that allows electric current to flow is called a:' : (concept === 'open' ? 'A path of current that is broken or incomplete is called an:' : (concept === 'switch_on' ? 'When you close the gap in a circuit using a switch, you are:' : 'When you open a gap in a circuit to stop current, you are:'))",
        opt_correct: "concept === 'closed' ? 'Closed circuit' : (concept === 'open' ? 'Open circuit' : (concept === 'switch_on' ? 'Switching ON' : 'Switching OFF'))",
        opt_wrong1: "concept === 'closed' ? 'Open circuit' : (concept === 'open' ? 'Closed circuit' : (concept === 'switch_on' ? 'Switching OFF' : 'Switching ON'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Electric Circuits and Switch States:**\n\n* **Electric Circuit**: The continuous path along which an electric current flows.\n* **Closed (Complete) Circuit**: An unbroken path starting from the positive terminal of the cell, passing through the appliance (like a bulb), and ending at the negative terminal. Current flows, and the bulb glows.\n* **Open (Incomplete) Circuit**: A path that is broken or interrupted at any point. Current cannot flow, and the bulb does not glow.\n* **Switch**: A simple device used to close (complete) or open (break) the circuit:\n  * **Switch ON**: Completes the circuit, allowing current to flow.\n  * **Switch OFF**: Breaks the circuit, stopping the flow of current.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-circuit-symbols',
    id: 'iit-p6-circuit-symbols',
    name: 'Identify electrical circuit symbols',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        component: { pool: ['cell', 'battery', 'switch_open', 'switch_closed'] }
      },
      derivations: {
        comp_label: "component === 'cell' ? 'an electric cell' : (component === 'battery' ? 'a battery' : (component === 'switch_open' ? 'an open switch (key)' : 'a closed switch (key)'))",
        symbol_svg: "component === 'cell' ? '<svg viewBox=\"0 0 100 40\" style=\"width:100px;height:40px;\"><line x1=\"10\" y1=\"20\" x2=\"45\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"45\" y1=\"5\" x2=\"45\" y2=\"35\" stroke=\"black\" stroke-width=\"3\"/><line x1=\"55\" y1=\"10\" x2=\"55\" y2=\"30\" stroke=\"black\" stroke-width=\"6\"/><line x1=\"55\" y1=\"20\" x2=\"90\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/></svg>' : (component === 'battery' ? '<svg viewBox=\"0 0 120 40\" style=\"width:120px;height:40px;\"><line x1=\"5\" y1=\"20\" x2=\"30\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"30\" y1=\"5\" x2=\"30\" y2=\"35\" stroke=\"black\" stroke-width=\"3\"/><line x1=\"40\" y1=\"10\" x2=\"40\" y2=\"30\" stroke=\"black\" stroke-width=\"6\"/><line x1=\"40\" y1=\"20\" x2=\"55\" y2=\"20\" stroke=\"black\" stroke-width=\"2\" stroke-dasharray=\"2,2\"/><line x1=\"55\" y1=\"20\" x2=\"70\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"70\" y1=\"5\" x2=\"70\" y2=\"35\" stroke=\"black\" stroke-width=\"3\"/><line x1=\"80\" y1=\"10\" x2=\"80\" y2=\"30\" stroke=\"black\" stroke-width=\"6\"/><line x1=\"80\" y1=\"20\" x2=\"115\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/></svg>' : (component === 'switch_open' ? '<svg viewBox=\"0 0 100 40\" style=\"width:100px;height:40px;\"><line x1=\"10\" y1=\"20\" x2=\"35\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><circle cx=\"35\" cy=\"20\" r=\"3\" fill=\"black\"/><line x1=\"37\" y1=\"19\" x2=\"60\" y2=\"5\" stroke=\"black\" stroke-width=\"2\"/><circle cx=\"65\" cy=\"20\" r=\"3\" fill=\"black\"/><line x1=\"65\" y1=\"20\" x2=\"90\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/></svg>' : '<svg viewBox=\"0 0 100 40\" style=\"width:100px;height:40px;\"><line x1=\"10\" y1=\"20\" x2=\"35\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><circle cx=\"35\" cy=\"20\" r=\"3\" fill=\"black\"/><line x1=\"35\" y1=\"20\" x2=\"65\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><circle cx=\"65\" cy=\"20\" r=\"3\" fill=\"black\"/><circle cx=\"50\" cy=\"20\" r=\"2\" fill=\"black\"/><line x1=\"65\" y1=\"20\" x2=\"90\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/></svg>'))"
      },
      questionTemplate: 'Which of the following schematic symbols represents **{{comp_label}}** in a circuit diagram?',
      explanationTemplate: '**Circuit Symbols and Meanings:**\n\n* **Electric Cell**: A long thin line representing the positive (+) terminal, and a shorter thick line representing the negative (-) terminal.\n* **Battery**: A series combination of multiple cell symbols linked together.\n* **Open Switch (Key)**: Shows a break in the path (the switch arm is lifted or contacts are separated).\n* **Closed Switch (Key)**: Shows a complete connection path (contacts are touching, or dot in parentheses).',
      options: [
        { label: "{{symbol_svg}}", isCorrect: true },
        { label: "<svg viewBox=\"0 0 100 40\" style=\"width:100px;height:40px;\"><circle cx=\"50\" cy=\"20\" r=\"10\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"10\" y1=\"20\" x2=\"40\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"60\" y1=\"20\" x2=\"90\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/></svg>", isCorrect: false },
        { label: "<svg viewBox=\"0 0 100 40\" style=\"width:100px;height:40px;\"><rect x=\"35\" y=\"10\" width=\"30\" height=\"20\" fill=\"none\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"10\" y1=\"20\" x2=\"35\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/><line x1=\"65\" y1=\"20\" x2=\"90\" y2=\"20\" stroke=\"black\" stroke-width=\"2\"/></svg>", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-cells-in-series-parallel',
    id: 'iit-p6-cells-in-series-parallel',
    name: 'Calculate cell series and parallel connections',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        cell_emf: { pool: [1.5, 2.0] },
        count: { pool: [3, 4] },
        connection: { pool: ['series', 'parallel'] }
      },
      derivations: {
        conn_label: "connection === 'series' ? 'connected in series' : 'connected in parallel'"
      },
      questionTemplate: 'Calculate the total electromotive force (EMF) when **{{count}}** cells of **{{cell_emf}}** V each are **{{conn_label}}**. The answer is [[blank1]] V.',
      explanationTemplate: '**Electric Cells Connection Rules:**\n\n* **Series Connection**: The negative terminal of one cell is connected to the positive terminal of the next cell. The total EMF is the sum of individual EMFs:\n\n$$\\text{Total EMF (Series)} = \\text{EMF}_1 + \\text{EMF}_2 + \\dots = n \\times \\text{EMF}$$\n\n$$\\text{Total EMF (Series)} = {{count}} \\times {{cell_emf}} = {{ans_series}} \\text{ V}$$\n\n* **Parallel Connection**: All positive terminals are connected together, and all negative terminals are connected together. The total EMF remains the same as that of a single cell, regardless of the number of cells connected:\n\n$$\\text{Total EMF (Parallel)} = \\text{EMF} = {{cell_emf}} \\text{ V}$$\n\n**Calculation for this problem:**\n* Connection: **{{connection}}**\n* Result = **{{result}}** V',
      derivations: {
        ans_series: 'count * cell_emf',
        result: "connection === 'series' ? count * cell_emf : cell_emf"
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{result}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{result}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-bulbs-in-series-parallel',
    id: 'iit-p6-bulbs-in-series-parallel',
    name: 'Understand bulbs series and parallel behavior',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        connection: { pool: ['series', 'parallel'] }
      },
      derivations: {
        conn_label: "connection === 'series' ? 'connected in series' : 'connected in parallel'"
      },
      questionTemplate: 'What happens to the remaining bulbs in a circuit if one bulb fuses (breaks) when they are **{{conn_label}}**?',
      explanationTemplate: '**Bulbs in Series vs. Parallel Circuits:**\n\n* **Series Circuit of Bulbs**:\n  * There is only **one path** for current to flow through all bulbs consecutively.\n  * If one bulb gets fused, the circuit breaks (becomes open) at that filament. Current stops flowing entirely.\n  * **Result**: All other bulbs in the series will **stop glowing**.\n* **Parallel Circuit of Bulbs**:\n  * Each bulb is connected across the common positive and negative terminals, creating **independent branches**.\n  * If one bulb fuses, it only breaks the path for that specific branch. The other branches remain complete closed circuits.\n  * **Result**: The remaining bulbs will **continue to glow normally**.',
      options: [
        { label: "All the other bulbs will stop glowing immediately.", isCorrect: "connection === 'series'" },
        { label: "The remaining bulbs will continue to glow normally.", isCorrect: "connection === 'parallel'" }
      ]
    }
  },
  {
    _id: 'iit-p6-sources-of-electricity',
    id: 'iit-p6-sources-of-electricity',
    name: 'Identify sources of electrical energy',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['power_house', 'electric_generator', 'solar_cell', 'storage_cell'] }
      },
      derivations: {
        question_text: "concept === 'power_house' ? 'A large utility station that converts the energy of flowing water or steam into electricity is a:' : (concept === 'electric_generator' ? 'A device that uses a diesel engine to rotate a dynamo and generate electricity is an:' : (concept === 'solar_cell' ? 'A device that converts light energy from the Sun directly into electrical energy is a:' : 'A chemical battery that can be recharged using an external charger is called a:'))",
        opt_correct: "concept === 'power_house' ? 'Power house' : (concept === 'electric_generator' ? 'Electric generator' : (concept === 'solar_cell' ? 'Solar cell' : 'Storage cell (accumulator)'))",
        opt_wrong1: "concept === 'power_house' ? 'Solar cell' : (concept === 'electric_generator' ? 'Electric cell' : (concept === 'solar_cell' ? 'Dry cell' : 'Primary dry cell'))",
        opt_wrong2: "concept === 'power_house' ? 'Dry cell' : (concept === 'electric_generator' ? 'Solar cell' : (concept === 'solar_cell' ? 'Generator' : 'Voltmeter'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Sources of Electrical Energy:**\n\n* **Power Houses**: Large stations constructed to generate electricity by converting the mechanical energy of flowing water (hydroelectric) or steam (thermal) into electrical energy.\n* **Electric Generators (Dynamos)**: Rotate a dynamo (often powered by a diesel engine) to convert mechanical energy into electrical energy when grid power fails.\n* **Solar Cells**: Specially designed photovoltaic panels that collect light energy from the Sun and convert it directly into electrical energy.\n* **Storage Cells (Accumulators)**: Rechargeable chemical cells (like car batteries) that can be repeatedly charged with an external electric current and used again.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-electrical-safety',
    id: 'iit-p6-electrical-safety',
    name: 'Understand electrical insulation and safety',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['shock_reason', 'insulation_material', 'precaution'] }
      },
      derivations: {
        question_text: "concept === 'shock_reason' ? 'Why does a human body experience a shock when touching a live bare wire?' : (concept === 'insulation_material' ? 'Which of the following materials is commonly used to coat electrical wires for safety?' : 'Why are the handles of screwdrivers and pliers covered with plastic or rubber?')",
        opt_correct: "concept === 'shock_reason' ? 'The body is a conductor and passes current to the ground' : (concept === 'insulation_material' ? 'Plastic or rubber (insulators)' : 'To prevent current from reaching the user\\\'s hand')",
        opt_wrong1: "concept === 'shock_reason' ? 'The body acts as a perfect electrical insulator' : (concept === 'insulation_material' ? 'Copper or aluminum (conductors)' : 'To make the tool heavier and easier to grip')",
        opt_wrong2: "concept === 'shock_reason' ? 'The bare wire absorbs electricity from the body' : (concept === 'insulation_material' ? 'Steel or iron (metals)' : 'To allow electricity to pass from tool to hand')"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Electrical Safety and Insulation:**\n\n* **Insulation**: Coating a metal conductor with a non-conducting material (like plastic or rubber) to prevent current from leaking or passing into human bodies upon contact.\n* **Electric Shock**: If a human body touches a bare metallic wire carrying current, the body (which is a good conductor) provides a path for current to flow to the ground, causing an electric shock which can be harmful or fatal.\n* **Safety Precautions**:\n  1. Handles of electrical tools (screwdrivers, pliers) must be covered with insulators (plastic, rubber, or glass).\n  2. Never touch live wires or appliances with wet hands, as water increases electrical conductivity.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  }
];

const newSkills = [
  { id: 'iit-p6-electric-charge', title: 'Understand electric charge types and units', chapterId: 'iit-electricity-6', code: 'P.6.5.1', templateId: 'iit-p6-electric-charge', engine: 'questionBank', order: 1 },
  { id: 'iit-p6-electric-current-defn', title: 'Calculate current, charge, and time relations', chapterId: 'iit-electricity-6', code: 'P.6.5.2', templateId: 'iit-p6-electric-current-defn', engine: 'questionBank', order: 2 },
  { id: 'iit-p6-electric-cell-terminals', title: 'Identify electric cell terminals and functions', chapterId: 'iit-electricity-6', code: 'P.6.5.3', templateId: 'iit-p6-electric-cell-terminals', engine: 'questionBank', order: 3 },
  { id: 'iit-p6-conductors-insulators', title: 'Classify conductors and insulators', chapterId: 'iit-electricity-6', code: 'P.6.5.4', templateId: 'iit-p6-conductors-insulators', engine: 'questionBank', order: 4 },
  { id: 'iit-p6-circuit-closed-open', title: 'Closed vs open circuits and switch functions', chapterId: 'iit-electricity-6', code: 'P.6.5.5', templateId: 'iit-p6-circuit-closed-open', engine: 'questionBank', order: 5 },
  { id: 'iit-p6-circuit-symbols', title: 'Identify electrical circuit symbols', chapterId: 'iit-electricity-6', code: 'P.6.5.6', templateId: 'iit-p6-circuit-symbols', engine: 'questionBank', order: 6 },
  { id: 'iit-p6-cells-in-series-parallel', title: 'Calculate cell series and parallel connections', chapterId: 'iit-electricity-6', code: 'P.6.5.7', templateId: 'iit-p6-cells-in-series-parallel', engine: 'questionBank', order: 7 },
  { id: 'iit-p6-bulbs-in-series-parallel', title: 'Understand bulbs series and parallel behavior', chapterId: 'iit-electricity-6', code: 'P.6.5.8', templateId: 'iit-p6-bulbs-in-series-parallel', engine: 'questionBank', order: 8 },
  { id: 'iit-p6-sources-of-electricity', title: 'Identify sources of electrical energy', chapterId: 'iit-electricity-6', code: 'P.6.5.9', templateId: 'iit-p6-sources-of-electricity', engine: 'questionBank', order: 9 },
  { id: 'iit-p6-electrical-safety', title: 'Understand electrical insulation and safety', chapterId: 'iit-electricity-6', code: 'P.6.5.10', templateId: 'iit-p6-electrical-safety', engine: 'questionBank', order: 10 }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding IIT Electricity to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Seed Templates
    let templateCount = 0;
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
      templateCount++;
    }
    console.log(`🎉 Seeded/updated ${templateCount} Electricity templates successfully!`);

    // 2. Clear old questions to force dynamic templates evaluation
    for (const t of templates) {
      await db.collection('questions').deleteMany({ templateId: t._id });
    }
    console.log(`🎉 Cleared previously generated questions to force active evaluation!`);

    // 3. Upsert Chapter
    const chapterNode = {
      id: 'iit-electricity-6',
      title: 'Electricity',
      unitId: 'mechanics',
      gradeId: 'grade-6',
      order: 6
    };
    await db.collection('iit_chapters').updateOne(
      { id: chapterNode.id },
      { $set: { ...chapterNode, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`🎉 Chapter iit-electricity-6 upserted successfully!`);

    // 4. Seed micro-skills
    await db.collection('iit_skills').deleteMany({ chapterId: 'iit-electricity-6' });
    let skillCount = 0;
    for (const s of newSkills) {
      await db.collection('iit_skills').updateOne(
        { id: s.id },
        {
          $set: {
            ...s,
            updatedAt: new Date()
          },
          $setOnInsert: {
            status: 'active',
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      skillCount++;
    }
    console.log(`🎉 Seeded/updated ${skillCount} Electricity micro-skills successfully!`);

  } catch (error) {
    console.error("❌ Error seeding Electricity:", error);
  } finally {
    await client.close();
  }
}

runSeed();
