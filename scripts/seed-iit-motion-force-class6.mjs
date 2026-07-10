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
    _id: 'iit-p6-rest-and-motion',
    id: 'iit-p6-rest-and-motion',
    name: 'Understand states of rest and motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        scenario: { pool: ['train', 'bus', 'book', 'room'] }
      },
      questionTemplate: 'Identify the state of rest or motion in this scenario: **{{q_text}}**',
      explanationTemplate: 'Rest and motion are relative terms. An object is at rest if it does not change its position relative to a reference point, and in motion if its position changes relative to that point.',
      derivations: {
        q_text: "scenario === 'train' ? 'A passenger sitting inside a moving train relative to the carriage floor' : (scenario === 'bus' ? 'A passenger sitting inside a moving bus relative to the trees on the roadside' : (scenario === 'book' ? 'A textbook lying on a table relative to the table surface' : 'A building standing on Earth relative to the Sun'))",
        correct_state: "scenario === 'train' ? 'rest' : (scenario === 'bus' ? 'motion' : (scenario === 'book' ? 'rest' : 'motion'))"
      },
      options: [
        { label: "State of rest", isCorrect: "correct_state === 'rest'" },
        { label: "State of motion", isCorrect: "correct_state === 'motion'" },
        { label: "Both rest and motion simultaneously relative to the same observer", isCorrect: false },
        { label: "Neither rest nor motion", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-translatory-motion',
    id: 'iit-p6-translatory-motion',
    name: 'Translatory motion: rectilinear and curvilinear',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        motion_type: { pool: ['translatory', 'rectilinear', 'curvilinear'] },
        format: { pool: ['text', 'visual'] }
      },
      derivations: {
        question_text: "format === 'text' ? 'Which of the following physical scenarios is a correct example of **' + motion_type + '** motion?' : 'Which of the following path diagrams represents **' + motion_type + '** motion?'",
        opt1: "format === 'text' ? 'A car driving along a straight highway path.' : '<svg viewBox=\"0 0 100 100\" style=\"width:80px;height:80px;\"><rect x=\"5\" y=\"5\" width=\"90\" height=\"90\" rx=\"10\" fill=\"#f0fdf4\" stroke=\"#86efac\" stroke-width=\"2\"/><line x1=\"15\" y1=\"50\" x2=\"85\" y2=\"50\" stroke=\"#16a34a\" stroke-width=\"4\"/></svg>'",
        opt2: "format === 'text' ? 'A stone thrown forward at an angle by a boy.' : '<svg viewBox=\"0 0 100 100\" style=\"width:80px;height:80px;\"><rect x=\"5\" y=\"5\" width=\"90\" height=\"90\" rx=\"10\" fill=\"#eff6ff\" stroke=\"#93c5fd\" stroke-width=\"2\"/><path d=\"M 15 70 C 35 20, 65 20, 85 70\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"4\"/></svg>'",
        opt3: "format === 'text' ? 'The blades of an electric ceiling fan rotating.' : '<svg viewBox=\"0 0 100 100\" style=\"width:80px;height:80px;\"><rect x=\"5\" y=\"5\" width=\"90\" height=\"90\" rx=\"10\" fill=\"#faf5ff\" stroke=\"#d8b4fe\" stroke-width=\"2\"/><circle cx=\"50\" cy=\"45\" r=\"22\" fill=\"none\" stroke=\"#8b5cf6\" stroke-width=\"3\" stroke-dasharray=\"4,4\"/><circle cx=\"72\" cy=\"45\" r=\"4\" fill=\"#8b5cf6\"/></svg>'",
        opt4: "format === 'text' ? 'A spinning top rotating on its tip.' : '<svg viewBox=\"0 0 100 100\" style=\"width:80px;height:80px;\"><rect x=\"5\" y=\"5\" width=\"90\" height=\"90\" rx=\"10\" fill=\"#fdf2f8\" stroke=\"#fbcfe8\" stroke-width=\"2\"/><line x1=\"50\" y1=\"15\" x2=\"50\" y2=\"75\" stroke=\"#db2777\" stroke-width=\"3\"/><path d=\"M 35 45 Q 50 55 65 45\" fill=\"none\" stroke=\"#db2777\" stroke-width=\"2\"/></svg>'"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: 'In translatory motion, all parts of the body move the same distance in the same time. Rectilinear is along a straight line, while curvilinear is along a curved path.',
      options: [
        { label: "{{opt1}}", isCorrect: "motion_type === 'translatory' || motion_type === 'rectilinear'" },
        { label: "{{opt2}}", isCorrect: "motion_type === 'translatory' || motion_type === 'curvilinear'" },
        { label: "{{opt3}}", isCorrect: "false" },
        { label: "{{opt4}}", isCorrect: "false" }
      ]
    }
  },
  {
    _id: 'iit-p6-rotational-circular',
    id: 'iit-p6-rotational-circular',
    name: 'Distinguish rotational and circular motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        motion_type: { pool: ['rotational', 'circular'] }
      },
      questionTemplate: 'Which of the following options describes a body undergoing **{{motion_type}}** motion?',
      explanationTemplate: 'In rotational motion, the body rotates about a fixed axis passing through its body (its position in space stays same). In circular motion, the body moves along a circular path whose center lies outside the body (its position in space changes).',
      options: [
        { label: "The blades of a spinning table fan rotating on its axis.", isCorrect: "motion_type === 'rotational'" },
        { label: "A potter's clay wheel spinning around a central pivot.", isCorrect: "motion_type === 'rotational'" },
        { label: "A spinning top rotating about its vertical tip.", isCorrect: "motion_type === 'rotational'" },
        { label: "An athlete running around a circular sports track.", isCorrect: "motion_type === 'circular'" },
        { label: "The Earth revolving around the Sun in its orbit.", isCorrect: "motion_type === 'circular'" },
        { label: "A toy car moving along a circular path layout.", isCorrect: "motion_type === 'circular'" },
        { label: "A bullet fired straight out of a rifle.", isCorrect: false },
        { label: "A pendulum bob swinging back and forth.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-oscillatory-vibratory',
    id: 'iit-p6-oscillatory-vibratory',
    name: 'Oscillatory and vibratory motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        motion_type: { pool: ['oscillatory', 'vibratory'] }
      },
      questionTemplate: 'In which of the following examples does the body undergo **{{motion_type}}** motion?',
      explanationTemplate: 'In oscillatory motion, the body as a whole moves back and forth about its mean position. In vibratory motion, the body does not move as a whole, but its parts vibrate rapidly, changing its shape or size.',
      options: [
        { label: "A child swinging back and forth on a swing in a park.", isCorrect: "motion_type === 'oscillatory'" },
        { label: "The swinging pendulum of a wall clock.", isCorrect: "motion_type === 'oscillatory'" },
        { label: "The piston of a motor car engine moving up and down.", isCorrect: "motion_type === 'oscillatory'" },
        { label: "A plucked guitar string vibrating to and fro to produce music.", isCorrect: "motion_type === 'vibratory'" },
        { label: "The stretched membrane of a struck drum vibrating.", isCorrect: "motion_type === 'vibratory'" },
        { label: "The chest expanding and contracting during breathing.", isCorrect: "motion_type === 'vibratory'" },
        { label: "A train moving along a curved track.", isCorrect: false },
        { label: "A wheel spinning around its center.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-motion-types-misc',
    id: 'iit-p6-motion-types-misc',
    name: 'Periodic, random, and multiple motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        scenario: { pool: ['bee', 'footballer', 'pendulum', 'earth_axis', 'bowler', 'drill', 'bicycle'] }
      },
      questionTemplate: 'Identify the type of motion described in this scenario: **{{q_text}}**.',
      explanationTemplate: 'Periodic motion repeats at regular intervals. Random motion lacks direction. Multiple motion combines two or more motion types simultaneously (like translation + rotation).',
      derivations: {
        q_text: "scenario === 'bee' ? 'A buzzing bee flying in a flower garden' : (scenario === 'footballer' ? 'A football player running on a field during a game' : (scenario === 'pendulum' ? 'A swinging pendulum of a wall clock' : (scenario === 'earth_axis' ? 'The rotation of Earth on its axis' : (scenario === 'bowler' ? 'A spin bowler delivering a cricket ball' : (scenario === 'drill' ? 'A drill bit boring into a piece of wood' : 'A girl riding a bicycle forward')))))",
        correct_type: "scenario === 'bee' || scenario === 'footballer' ? 'random' : (scenario === 'pendulum' || scenario === 'earth_axis' ? 'periodic' : 'multiple')"
      },
      options: [
        { label: "Random motion", isCorrect: "correct_type === 'random'" },
        { label: "Periodic motion", isCorrect: "correct_type === 'periodic'" },
        { label: "Multiple motion (translatory + rotatory)", isCorrect: "correct_type === 'multiple'" },
        { label: "Only rectilinear motion", isCorrect: false },
        { label: "Only oscillatory motion", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-concept-of-force',
    id: 'iit-p6-concept-of-force',
    name: 'Force: push, pull, and effects',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        scenario: { pool: ['kick', 'catch', 'stretch', 'steering', 'brakes'] }
      },
      questionTemplate: 'Which of the following describes the physical effect of the force applied when: **{{q_text}}**?',
      explanationTemplate: 'Force is a push or pull. Its effects include starting motion, stopping motion, changing speed, changing direction, or changing shape and size.',
      derivations: {
        q_text: "scenario === 'kick' ? 'Kicking a soccer ball that was sitting still' : (scenario === 'catch' ? 'A goalkeeper catching a moving football' : (scenario === 'stretch' ? 'Stretching a rubber band' : (scenario === 'steering' ? 'A driver turning the steering wheel of a car' : 'Applying brakes to slow down a moving bicycle')))",
        correct_effect: "scenario === 'kick' ? 'start' : (scenario === 'catch' ? 'stop' : (scenario === 'stretch' ? 'shape' : (scenario === 'steering' ? 'direction' : 'speed')))"
      },
      options: [
        { label: "Moving a body initially at rest.", isCorrect: "correct_effect === 'start'" },
        { label: "Bringing a moving body to rest.", isCorrect: "correct_effect === 'stop'" },
        { label: "Changing the shape or size of a body.", isCorrect: "correct_effect === 'shape'" },
        { label: "Changing the direction of a moving body.", isCorrect: "correct_effect === 'direction'" },
        { label: "Changing the speed of a moving body.", isCorrect: "correct_effect === 'speed'" },
        { label: "Changing the chemical properties of a body.", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-contact-noncontact',
    id: 'iit-p6-contact-noncontact',
    name: 'Contact and non-contact forces',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        force_type: { pool: ['contact', 'non-contact'] }
      },
      questionTemplate: 'Which of the following forces is classified as a **{{force_type}}** force?',
      explanationTemplate: 'Contact forces require direct physical contact between the interacting bodies. Non-contact forces (field forces) act over a distance without physical contact.',
      options: [
        { label: "Muscular force", isCorrect: "force_type === 'contact'" },
        { label: "Frictional force", isCorrect: "force_type === 'contact'" },
        { label: "Tension force in a stretched rope", isCorrect: "force_type === 'contact'" },
        { label: "Elastic spring force", isCorrect: "force_type === 'contact'" },
        { label: "Gravitational force", isCorrect: "force_type === 'non-contact'" },
        { label: "Magnetic force", isCorrect: "force_type === 'non-contact'" },
        { label: "Electrostatic force", isCorrect: "force_type === 'non-contact'" }
      ]
    }
  },
  {
    _id: 'iit-p6-noncontact-types',
    id: 'iit-p6-noncontact-types',
    name: 'Magnetic, electrostatic, and gravitational forces',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        scenario: { pool: ['apple', 'scale', 'magnet', 'orbit'] }
      },
      questionTemplate: 'Identify the primary force acting in the scenario: **{{q_text}}**.',
      explanationTemplate: 'Magnetic force acts between magnets and magnetic materials. Electrostatic force acts between charged bodies. Gravitational force is the universal attraction between masses.',
      derivations: {
        q_text: "scenario === 'apple' ? 'An apple falling down to Earth from a tree' : (scenario === 'scale' ? 'A plastic scale rubbed on dry hair attracting paper pieces' : (scenario === 'magnet' ? 'A magnet holding a steel note on a refrigerator door' : 'The Earth revolving in orbit around the Sun'))",
        correct_force: "scenario === 'apple' || scenario === 'orbit' ? 'gravity' : (scenario === 'scale' ? 'electrostatic' : 'magnetic')"
      },
      options: [
        { label: "Gravitational force", isCorrect: "correct_force === 'gravity'" },
        { label: "Electrostatic force", isCorrect: "correct_force === 'electrostatic'" },
        { label: "Magnetic force", isCorrect: "correct_force === 'magnetic'" },
        { label: "Frictional force", isCorrect: false },
        { label: "Muscular force", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-distance-displacement',
    id: 'iit-p6-distance-displacement',
    name: 'Distance and displacement calculations',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        path_set: { pool: ['walk_abcd', 'round_walk'] },
        quantity: { pool: ['distance', 'displacement'] }
      },
      questionTemplate: 'A boy walks along the path: **{{path}}**. Find the total **{{quantity}}** covered by the boy. The answer is [[blank1]] km.',
      explanationTemplate: 'Distance is the actual path length covered. Displacement is the shortest straight-line distance between the initial and final position.',
      derivations: {
        path: "path_set === 'walk_abcd' ? 'from point A to B (4 km), then B to C (3 km), then C to D (2 km)' : 'from his home, walking 3 km around the town, and returning back home'",
        correct_val: "path_set === 'walk_abcd' ? (quantity === 'distance' ? 9 : 9) : (quantity === 'distance' ? 3 : 0)"
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
    _id: 'iit-p6-net-force',
    id: 'iit-p6-net-force',
    name: 'Calculate net force and direction',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        forceA: { pool: [60, 80, 100] },
        forceB: { pool: [40, 80, 120] }
      },
      questionTemplate: 'In a game of tug-of-war, Mark pulls the rope with a force of **{{forceA}}** N from the right. Sandy and George pull the rope with a total force of **{{forceB}}** N from the left. What is the net force experienced by the rope? The answer is [[blank1]] N.',
      explanationTemplate: 'Net force is the difference between forces acting in opposite directions:\n\n$$\\text{Net Force} = |\\text{Force}_A - \\text{Force}_B|$$\n\n$$\\text{Net Force} = |{{forceA}} - {{forceB}}|$$\n\n$$\\text{Net Force} = {{net}} \\text{ N}$$',
      derivations: {
        net: 'Math.abs(forceA - forceB)'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{net}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{net}}" }
      ]
    }
  }
];

const newSkills = [
  { id: 'iit-p6-rest-and-motion', title: 'Understand states of rest and motion', chapterId: 'iit-motion-6', code: 'P.6.1.1', templateId: 'iit-p6-rest-and-motion', engine: 'questionBank', order: 1 },
  { id: 'iit-p6-translatory-motion', title: 'Translatory motion: rectilinear and curvilinear', chapterId: 'iit-motion-6', code: 'P.6.1.2', templateId: 'iit-p6-translatory-motion', engine: 'questionBank', order: 2 },
  { id: 'iit-p6-rotational-circular', title: 'Distinguish rotational and circular motion', chapterId: 'iit-motion-6', code: 'P.6.1.3', templateId: 'iit-p6-rotational-circular', engine: 'questionBank', order: 3 },
  { id: 'iit-p6-oscillatory-vibratory', title: 'Oscillatory and vibratory motion', chapterId: 'iit-motion-6', code: 'P.6.1.4', templateId: 'iit-p6-oscillatory-vibratory', engine: 'questionBank', order: 4 },
  { id: 'iit-p6-motion-types-misc', title: 'Periodic, random, and multiple motion', chapterId: 'iit-motion-6', code: 'P.6.1.5', templateId: 'iit-p6-motion-types-misc', engine: 'questionBank', order: 5 },
  { id: 'iit-p6-concept-of-force', title: 'Force: push, pull, and effects', chapterId: 'iit-motion-6', code: 'P.6.2.1', templateId: 'iit-p6-concept-of-force', engine: 'questionBank', order: 6 },
  { id: 'iit-p6-contact-noncontact', title: 'Contact and non-contact forces', chapterId: 'iit-motion-6', code: 'P.6.2.2', templateId: 'iit-p6-contact-noncontact', engine: 'questionBank', order: 7 },
  { id: 'iit-p6-noncontact-types', title: 'Magnetic, electrostatic, and gravitational forces', chapterId: 'iit-motion-6', code: 'P.6.2.3', templateId: 'iit-p6-noncontact-types', engine: 'questionBank', order: 8 },
  { id: 'iit-p6-distance-displacement', title: 'Distance and displacement calculations', chapterId: 'iit-motion-6', code: 'P.6.2.4', templateId: 'iit-p6-distance-displacement', engine: 'questionBank', order: 9 },
  { id: 'iit-p6-net-force', title: 'Calculate net force and direction', chapterId: 'iit-motion-6', code: 'P.6.2.5', templateId: 'iit-p6-net-force', engine: 'questionBank', order: 10 }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding IIT Motion & Force Templates & Skills to: "${dbName}"...`);
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
    console.log(`🎉 Seeded/updated ${templateCount} Motion & Force templates successfully!`);

    // Clear old generated questions from question bank for this template
    await db.collection('questions').deleteMany({ templateId: 'iit-p6-translatory-motion' });
    console.log(`🎉 Cleared previously generated questions for "iit-p6-translatory-motion" to force regeneration!`);

    // 2. Update Chapter Title
    await db.collection('iit_chapters').updateOne(
      { id: 'iit-motion-6' },
      { $set: { title: 'Motion and Force', updatedAt: new Date() } }
    );
    console.log(`🎉 Chapter iit-motion-6 title updated to "Motion and Force"!`);

    // 3. Clear old skills for chapter iit-motion-6 and seed new micro-skills
    await db.collection('iit_skills').deleteMany({ chapterId: 'iit-motion-6' });
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
    console.log(`🎉 Seeded/updated ${skillCount} Motion & Force micro-skills successfully!`);

  } catch (error) {
    console.error("❌ Error seeding Motion & Force:", error);
  } finally {
    await client.close();
  }
}

runSeed();
