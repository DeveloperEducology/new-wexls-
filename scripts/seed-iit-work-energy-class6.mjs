import { MongoClient } from 'mongodb';

// Load environment variables manually
import fs from 'fs';
import path from 'path';

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
    _id: 'iit-p6-concept-of-work',
    id: 'iit-p6-concept-of-work',
    name: 'Understand scientific work and its conditions',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['scientific_work', 'mental_work'] }
      },
      questionTemplate: 'Which of the following scenarios is an example of **{{concept}}** according to physics principles?',
      explanationTemplate: '**Core Concept of Work in Physics:**\n\nIn science, work is said to be done only when a **force** acts on a body and causes a **displacement** (movement) of the body in the direction of the applied force.\n\nTwo conditions are strictly necessary for work to be done:\n1. A force must act on the body.\n2. The body must move in the direction of the applied force.\n\n*Note: Mental work (like reading, studying, or thinking) or holding a heavy load on your head without moving does not cause physical displacement in the direction of force, so **Work Done = 0**.*',
      options: [
        { label: "Pushing a heavy table across the room so that it moves 3 metres.", isCorrect: "concept === 'scientific_work'" },
        { label: "Kicking a football causing it to roll along the ground.", isCorrect: "concept === 'scientific_work'" },
        { label: "Squeezing an inflated rubber balloon so that it deforms.", isCorrect: "concept === 'scientific_work'" },
        { label: "Preparing school lessons by reading a science textbook.", isCorrect: "concept === 'mental_work'" },
        { label: "A school headmaster addressing the assembly while standing.", isCorrect: "concept === 'mental_work'" },
        { label: "A coolie carrying a heavy bag of 50 kg standing completely still on a platform.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-calculate-work',
    id: 'iit-p6-calculate-work',
    name: 'Calculate work done in SI and CGS units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        force: { pool: [25, 50, 1080, 567] },
        displacement: { pool: [10, 20, 30] }
      },
      questionTemplate: 'Calculate the work done when a force of **{{force}}** N displaces a crate through a distance of **{{displacement}}** m in its own direction. The answer is [[blank1]] J.',
      explanationTemplate: '**Scientific Definition of Work:**\n\nMathematically, work is defined as the product of the applied force and the displacement of the body in the direction of the force:\n\n$$\\text{Work Done } (W) = \\text{Force } (F) \\times \\text{Displacement } (S)$$\n\n**Given values in this problem:**\n* Applied Force ($F$) = {{force}} N\n* Displacement ($S$) = {{displacement}} m\n\n**Step-by-step Calculation:**\n\n$$W = {{force}} \\text{ N} \\times {{displacement}} \\text{ m}$$\n\n$$W = {{work}} \\text{ Joules (J)}$$\n\n*Note: The S.I. unit of work is Joule (J), which equals 1 Newton-metre (N·m).*',
      derivations: {
        work: 'force * displacement'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{work}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{work}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-joule-erg-conversion',
    id: 'iit-p6-joule-erg-conversion',
    name: 'Convert work between Joules and ergs',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        value: { pool: [2, 5, 10] },
        direction: { pool: ['j_to_erg', 'erg_to_j'] }
      },
      questionTemplate: 'Convert a work done of **{{value}}** {{from_unit}} into {{to_unit}}.',
      explanationTemplate: '**Units of Work and their Relationship:**\n\nWork is measured in two common systems of units:\n1. **S.I. System**: The unit is **Joule (J)**. One Joule of work is done when a force of $1\\text{ N}$ displaces a body by $1\\text{ m}$.\n2. **C.G.S. System**: The unit is **erg**. One erg of work is done when a force of $1\\text{ dyne}$ displaces a body by $1\\text{ cm}$.\n\n**Conversion Relation:**\n\n$$1\\text{ Joule} = 1\\text{ Newton} \\times 1\\text{ metre} = 10^5\\text{ dynes} \\times 100\\text{ cm} = 10^7\\text{ ergs}$$\n\nTherefore:\n* To convert Joules to ergs, multiply by $10^7$.\n* To convert ergs to Joules, multiply by $10^{-7}$.',
      derivations: {
        from_unit: "direction === 'j_to_erg' ? 'Joules' : 'ergs'",
        to_unit: "direction === 'j_to_erg' ? 'ergs' : 'Joules'",
        opt_correct: "direction === 'j_to_erg' ? '$' + value + ' \\\\times 10^7$ ergs' : '$' + value + ' \\\\times 10^{-7}$ Joules'",
        opt_wrong1: "direction === 'j_to_erg' ? '$' + value + ' \\\\times 10^{-7}$ ergs' : '$' + value + ' \\\\times 10^7$ Joules'",
        opt_wrong2: "direction === 'j_to_erg' ? '$' + value + ' \\\\times 10^5$ ergs' : '$' + value + ' \\\\times 10^{-5}$ Joules'"
      },
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-types-of-work',
    id: 'iit-p6-types-of-work',
    name: 'Classify positive, negative, and zero work',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        scenario: { pool: ['falling', 'projected', 'brakes', 'suitcase_horiz', 'push_wall'] }
      },
      questionTemplate: 'Identify the type of work (positive, negative, or zero) in this scenario: **{{q_text}}**.',
      explanationTemplate: '**Kinds of Work Done in Physics:**\n\nWork done can be positive, negative, or zero depending on the angle between the applied force and the direction of displacement:\n\n1. **Positive Work**: Done when force and displacement are in the **same direction** (angle is $0^\\circ$).\n   * *Example*: A freely falling stone pulled down by gravity.\n2. **Negative Work**: Done when force and displacement are in **opposite directions** (angle is $180^\\circ$).\n   * *Example*: Applying brakes to slow down a vehicle, or the gravitational force when an object is thrown upwards.\n3. **Zero Work**: Done when displacement is zero ($S = 0$), or the applied force is **perpendicular** to the displacement (angle is $90^\\circ$).\n   * *Example*: Pushing a rigid brick wall, or carrying a bag on your head while walking horizontally.',
      derivations: {
        q_text: "scenario === 'falling' ? 'A stone falling freely under the action of gravity' : (scenario === 'projected' ? 'Work done by the force of gravity when a stone is projected vertically upwards' : (scenario === 'brakes' ? 'Work done by the braking force when brakes are applied to a moving vehicle' : (scenario === 'suitcase_horiz' ? 'Work done by gravity on a person carrying a suitcase walking horizontally' : 'Work done by a person pushing a concrete wall that does not move')))",
        correct_type: "scenario === 'falling' ? 'positive' : (scenario === 'projected' || scenario === 'brakes' ? 'negative' : 'zero')"
      },
      options: [
        { label: "Positive work done", isCorrect: "correct_type === 'positive'" },
        { label: "Negative work done", isCorrect: "correct_type === 'negative'" },
        { label: "Zero work done", isCorrect: "correct_type === 'zero'" }
      ]
    }
  },
  {
    _id: 'iit-p6-energy-concept',
    id: 'iit-p6-energy-concept',
    name: 'Understand energy concept and its units',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        property: { pool: ['definition', 'si_unit', 'relation'] }
      },
      questionTemplate: 'Which of the following is correct regarding **{{property}}** of energy?',
      explanationTemplate: '**Concept of Energy in Physics:**\n\n* **Definition**: Energy is the **capacity or ability of a body to do work**. A body that does work loses energy, and the body on which work is done gains energy.\n* **Equivalence**: Since energy is measured by the amount of work a body can do, both work and energy share the same units:\n  * S.I. Unit: **Joule (J)**\n  * C.G.S. Unit: **erg**\n* **Implication**: Any body possessing energy must be capable of exerting a force on another object to displace it.',
      options: [
        { label: "Energy is defined as the ability or capacity of a body to do work.", isCorrect: "property === 'definition'" },
        { label: "The SI unit of energy is the Joule (J).", isCorrect: "property === 'si_unit'" },
        { label: "A body possessing energy is capable of exerting force and causing motion.", isCorrect: "property === 'definition'" },
        { label: "The CGS unit of energy is the erg.", isCorrect: "property === 'si_unit'" },
        { label: "Energy and work share the same dimensions and units.", isCorrect: "property === 'relation'" }
      ]
    }
  },
  {
    _id: 'iit-p6-potential-energy',
    id: 'iit-p6-potential-energy',
    name: 'Calculate gravitational and configuration P.E.',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        mass: { pool: [15, 50, 100] },
        height: { pool: [2, 10, 20] },
        g: { pool: [9.8, 10] }
      },
      questionTemplate: 'A body of mass **{{mass}}** kg is lifted to a height of **{{height}}** m. Calculate its gravitational potential energy relative to the ground. (Take $g = {{g}}$ m/s²). The answer is [[blank1]] J.',
      explanationTemplate: '**Potential Energy (P.E.):**\n\nPotential energy is the energy possessed by a body by virtue of its **position** (height above the ground) or its **configuration** (shape/deformation, like a compressed spring or stretched rubber catapult).\n\n**Gravitational Potential Energy Formula:**\n\n$$\\text{P.E.} = \\text{Weight} \\times \\text{Height} = mgh$$\n\nWhere:\n* $m$ = mass of the body = {{mass}} kg\n* $g$ = acceleration due to gravity = {{g}} m/s²\n* $h$ = vertical height = {{height}} m\n\n**Step-by-step Calculation:**\n\n$$\\text{P.E.} = {{mass}} \\text{ kg} \\times {{g}} \\text{ m/s}^2 \\times {{height}} \\text{ m}$$\n\n$$\\text{P.E.} = {{pe}} \\text{ Joules (J)}$$',
      derivations: {
        pe: 'mass * g * height'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{pe}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{pe}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-kinetic-energy',
    id: 'iit-p6-kinetic-energy',
    name: 'Calculate and scale Kinetic Energy',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        mass: { pool: [2, 4, 10] },
        velocity: { pool: [5, 10, 20] }
      },
      questionTemplate: 'Calculate the kinetic energy of a body of mass **{{mass}}** kg moving with a uniform velocity of **{{velocity}}** m/s. The answer is [[blank1]] J.',
      explanationTemplate: '**Kinetic Energy (K.E.):**\n\nKinetic energy is the energy possessed by a body by virtue of its **motion**. Any moving material object (like a speeding car, wind, or running train) possesses kinetic energy.\n\n**Kinetic Energy Formula:**\n\n$$\\text{K.E.} = \\frac{1}{2} m v^2$$\n\nWhere:\n* $m$ = mass of the body = {{mass}} kg\n* $v$ = speed/velocity of the body = {{velocity}} m/s\n\n**Step-by-step Calculation:**\n\n$$\\text{K.E.} = 0.5 \\times {{mass}} \\text{ kg} \\times ({{velocity}} \\text{ m/s})^2$$\n\n$$\\text{K.E.} = 0.5 \\times {{mass}} \\times {{valSq}} \\text{ (where velocity squared is } {{valSq}}\\text{)}$$\n\n$$\\text{K.E.} = {{ke}} \\text{ Joules (J)}$$\n\n*Note: K.E. depends on both the mass of the body and is directly proportional to the square of its speed.*',
      derivations: {
        valSq: 'velocity * velocity',
        ke: '0.5 * mass * velocity * velocity'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{ke}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{ke}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-ke-momentum-relation',
    id: 'iit-p6-ke-momentum-relation',
    name: 'Solve kinetic energy and momentum problems',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.5,
    config: {
      variables: {
        concept: { pool: ['ke_formula', 'momentum_formula'] }
      },
      questionTemplate: 'Identify the correct mathematical relationship corresponding to **{{concept}}**.',
      explanationTemplate: '**Deriving the Relation between Kinetic Energy (K.E.) and Momentum ($P$):**\n\n1. **Definitions**:\n   * Linear Momentum: $P = mv \\implies v = \\frac{P}{m}$\n   * Kinetic Energy: $K.E. = \\frac{1}{2}mv^2$\n\n2. **Substitution**:\n   Substitute the value of $v$ into the $K.E.$ formula:\n\n$$K.E. = \\frac{1}{2}m\\left(\\frac{P}{m}\\right)^2 = \\frac{1}{2}m\\left(\\frac{P^2}{m^2}\\right) = \\frac{P^2}{2m}$$\n\n3. **Momentum in terms of K.E.**:\n   Solving for $P$:\n\n$$P^2 = 2m \\cdot K.E. \\implies P = \\sqrt{2m \\cdot K.E.}$$',
      options: [
        { label: "$K.E. = \\frac{P^2}{2m}$", isCorrect: "concept === 'ke_formula'" },
        { label: "$P = \\sqrt{2m \\cdot K.E.}$", isCorrect: "concept === 'momentum_formula'" },
        { label: "$K.E. = 2m P^2$", isCorrect: false },
        { label: "$P = \\frac{K.E.^2}{2m}$", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-energy-transformations',
    id: 'iit-p6-energy-transformations',
    name: 'Identify energy conversions in appliances',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        appliance: { pool: ['fan', 'kettle', 'solar_calc', 'photosynthesis', 'battery', 'microphone', 'steam_engine'] }
      },
      questionTemplate: 'Identify the primary energy transformation occurring in this device: **{{q_text}}**.',
      explanationTemplate: '**Law of Conservation and Energy Transformations:**\n\nAccording to the **Law of Conservation of Energy**, energy can neither be created nor destroyed; it can only be transformed from one form to another. \n\n**Key Transformations in Everyday Devices:**\n* **Electric Motors / Fans**: Convert electrical energy into mechanical energy of motion.\n* **Electric Kettles / Room Heaters**: Convert electrical energy into heat (thermal) energy.\n* **Solar Cells**: Convert light (radiant) energy directly into electrical energy.\n* **Photosynthesis**: Chlorophyll in green plants uses sunlight to convert light energy into chemical energy stored in starch.\n* **Batteries / Cells**: Convert stored chemical energy into electrical energy.\n* **Microphones**: Convert sound energy (vibrations) into electrical energy.',
      derivations: {
        q_text: "appliance === 'fan' ? 'An electric fan' : (appliance === 'kettle' ? 'An electric kettle' : (appliance === 'solar_calc' ? 'A solar-powered calculator cell' : (appliance === 'photosynthesis' ? 'Photosynthesis in green plants' : (appliance === 'battery' ? 'A dry cell battery during discharging' : (appliance === 'microphone' ? 'A sound microphone' : 'A railway steam engine')))))",
        correct_conversion: "appliance === 'fan' ? 'electric_to_mechanical' : (appliance === 'kettle' ? 'electric_to_heat' : (appliance === 'solar_calc' ? 'light_to_electric' : (appliance === 'photosynthesis' ? 'light_to_chemical' : (appliance === 'battery' ? 'chemical_to_electric' : (appliance === 'microphone' ? 'sound_to_electric' : 'heat_to_mechanical')))))"
      },
      options: [
        { label: "Electrical energy to mechanical energy", isCorrect: "correct_conversion === 'electric_to_mechanical'" },
        { label: "Electrical energy to heat energy", isCorrect: "correct_conversion === 'electric_to_heat'" },
        { label: "Light energy to electrical energy", isCorrect: "correct_conversion === 'light_to_electric'" },
        { label: "Light energy to chemical energy", isCorrect: "correct_conversion === 'light_to_chemical'" },
        { label: "Chemical energy to electrical energy", isCorrect: "correct_conversion === 'chemical_to_electric'" },
        { label: "Sound energy to electrical energy", isCorrect: "correct_conversion === 'sound_to_electric'" },
        { label: "Heat energy to mechanical energy", isCorrect: "correct_conversion === 'heat_to_mechanical'" }
      ]
    }
  },
  {
    _id: 'iit-p6-conservation-ultimate-source',
    id: 'iit-p6-conservation-ultimate-source',
    name: 'Law of conservation and the Sun as source',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['conservation', 'ultimate_source'] }
      },
      questionTemplate: 'Which of the following physics concepts describes **{{concept}}**?',
      explanationTemplate: '**The Law of Conservation and the Solar Energy Chain:**\n\n* **Law of Conservation of Energy**: The total energy of an isolated system remains constant. Energy can only change forms (e.g., potential to kinetic).\n* **The Sun as the Ultimate Source**: Almost all energy on Earth originates from the Sun:\n  1. **Chemical Energy in Food/Fossil Fuels**: Stored solar energy trapped by plants through photosynthesis.\n  2. **Mechanical Energy in Wind/Water**: Solar heat drives convection currents in air (wind) and vaporizes water to power the water cycle (rainfall storing potential energy in dams to run hydro-power turbines).',
      options: [
        { label: "Energy can neither be created nor destroyed, but can be changed from one form to another.", isCorrect: "concept === 'conservation'" },
        { label: "The Sun is the ultimate source of energy on Earth, driving the water cycle and plant growth.", isCorrect: "concept === 'ultimate_source'" },
        { label: "Coal, petrol, and wood are forms of stored solar energy trapped by plants.", isCorrect: "concept === 'ultimate_source'" },
        { label: "The total energy in a closed system remains constant over time.", isCorrect: "concept === 'conservation'" }
      ]
    }
  }
];

const newSkills = [
  { id: 'iit-p6-concept-of-work', title: 'Understand scientific work and its conditions', chapterId: 'iit-work-energy-6', code: 'P.6.3.1', templateId: 'iit-p6-concept-of-work', engine: 'questionBank', order: 1 },
  { id: 'iit-p6-calculate-work', title: 'Calculate work done in SI and CGS units', chapterId: 'iit-work-energy-6', code: 'P.6.3.2', templateId: 'iit-p6-calculate-work', engine: 'questionBank', order: 2 },
  { id: 'iit-p6-joule-erg-conversion', title: 'Convert work between Joules and ergs', chapterId: 'iit-work-energy-6', code: 'P.6.3.3', templateId: 'iit-p6-joule-erg-conversion', engine: 'questionBank', order: 3 },
  { id: 'iit-p6-types-of-work', title: 'Classify positive, negative, and zero work', chapterId: 'iit-work-energy-6', code: 'P.6.3.4', templateId: 'iit-p6-types-of-work', engine: 'questionBank', order: 4 },
  { id: 'iit-p6-energy-concept', title: 'Understand energy concept and its units', chapterId: 'iit-work-energy-6', code: 'P.6.3.5', templateId: 'iit-p6-energy-concept', engine: 'questionBank', order: 5 },
  { id: 'iit-p6-potential-energy', title: 'Calculate gravitational and configuration P.E.', chapterId: 'iit-work-energy-6', code: 'P.6.3.6', templateId: 'iit-p6-potential-energy', engine: 'questionBank', order: 6 },
  { id: 'iit-p6-kinetic-energy', title: 'Calculate and scale Kinetic Energy', chapterId: 'iit-work-energy-6', code: 'P.6.3.7', templateId: 'iit-p6-kinetic-energy', engine: 'questionBank', order: 7 },
  { id: 'iit-p6-ke-momentum-relation', title: 'Solve kinetic energy and momentum problems', chapterId: 'iit-work-energy-6', code: 'P.6.3.8', templateId: 'iit-p6-ke-momentum-relation', engine: 'questionBank', order: 8 },
  { id: 'iit-p6-energy-transformations', title: 'Identify energy conversions in appliances', chapterId: 'iit-work-energy-6', code: 'P.6.3.9', templateId: 'iit-p6-energy-transformations', engine: 'questionBank', order: 9 },
  { id: 'iit-p6-conservation-ultimate-source', title: 'Law of conservation and the Sun as source', chapterId: 'iit-work-energy-6', code: 'P.6.3.10', templateId: 'iit-p6-conservation-ultimate-source', engine: 'questionBank', order: 10 }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding IIT Energy and Work to: "${dbName}"...`);
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
    console.log(`🎉 Seeded/updated ${templateCount} Energy & Work templates successfully!`);

    // 2. Clear old questions to force dynamic templates evaluation
    for (const t of templates) {
      await db.collection('questions').deleteMany({ templateId: t._id });
    }
    console.log(`🎉 Cleared previously generated questions to force active evaluation!`);

    // 3. Upsert Chapter
    const chapterNode = {
      id: 'iit-work-energy-6',
      title: 'Energy and Work',
      unitId: 'mechanics',
      gradeId: 'grade-6',
      order: 4
    };
    await db.collection('iit_chapters').updateOne(
      { id: chapterNode.id },
      { $set: { ...chapterNode, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`🎉 Chapter iit-work-energy-6 upserted successfully!`);

    // 4. Seed micro-skills
    await db.collection('iit_skills').deleteMany({ chapterId: 'iit-work-energy-6' });
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
    console.log(`🎉 Seeded/updated ${skillCount} Energy & Work micro-skills successfully!`);

  } catch (error) {
    console.error("❌ Error seeding Energy & Work:", error);
  } finally {
    await client.close();
  }
}

runSeed();
