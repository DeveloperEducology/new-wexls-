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
    _id: 'iit-kinematics-vs-dynamics',
    id: 'iit-kinematics-vs-dynamics',
    name: 'Kinematics vs Dynamics Concepts',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'In physics mechanics, which of the following scenarios is a study of {{concept}}?',
      explanationTemplate: '{{concept_explanation}}',
      variables: {
        concept: { pool: ['kinematics', 'dynamics'] }
      },
      derivations: {
        concept_explanation: "concept === 'kinematics' ? 'Kinematics describes motion without referencing the forces causing it.' : 'Dynamics studies the relationship between forces and the motion they cause.'"
      },
      options: [
        { label: "Describing a train's acceleration on a curved track without looking at engine force", isCorrect: "concept === 'kinematics'" },
        { label: "Calculating the friction force acting on a sliding box", isCorrect: "concept === 'dynamics'" },
        { label: "Finding the gravitational pull causing rain to fall", isCorrect: "concept === 'dynamics'" },
        { label: "Calculating the engine thrust needed to launch a rocket", isCorrect: "concept === 'dynamics'" }
      ]
    }
  },
  {
    _id: 'iit-relativity-rest-motion',
    id: 'iit-relativity-rest-motion',
    name: 'Relativity of Rest & Motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Two passengers are sitting next to each other in a moving train. An observer is standing stationary on the platform. With respect to the observer, the passengers are in **{{state_observer}}**, and with respect to each other, they are in **{{state_passenger}}**.',
      explanationTemplate: 'Rest and motion are relative terms. Since the distance between passengers does not change, they are at rest relative to each other. Since their distance from the platform observer changes, they are in motion relative to the observer.',
      variables: {
        state_observer: { pool: ['motion'] },
        state_passenger: { pool: ['rest'] }
      },
      options: [
        { label: "motion, rest", isCorrect: true },
        { label: "rest, motion", isCorrect: false },
        { label: "motion, motion", isCorrect: false },
        { label: "rest, rest", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-rectilinear-vs-curvilinear',
    id: 'iit-rectilinear-vs-curvilinear',
    name: 'Rectilinear vs Curvilinear Motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Identify which of the following is an example of **{{motion_type}}** motion.',
      explanationTemplate: 'Rectilinear motion occurs along a straight line, while curvilinear motion occurs along a curved path.',
      variables: {
        motion_type: { pool: ['rectilinear', 'curvilinear'] }
      },
      options: [
        { label: "A stone falling freely from a roof straight down", isCorrect: "motion_type === 'rectilinear'" },
        { label: "A coin sliding straight across a carom board", isCorrect: "motion_type === 'rectilinear'" },
        { label: "A javelin thrown by an athlete flying through the air", isCorrect: "motion_type === 'curvilinear'" },
        { label: "A car negotiating a sharp curved bend on a road", isCorrect: "motion_type === 'curvilinear'" }
      ]
    }
  },
  {
    _id: 'iit-rotational-vs-circular',
    id: 'iit-rotational-vs-circular',
    name: 'Rotational vs Circular Motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following describes **{{motion_type}}** motion?',
      explanationTemplate: 'In rotational motion, the body spins around a fixed axis passing through its own body. In circular motion, the object moves along a circular path whose center lies outside the body.',
      variables: {
        motion_type: { pool: ['rotational', 'circular'] }
      },
      options: [
        { label: "Blades of a ceiling fan spinning about their center pin", isCorrect: "motion_type === 'rotational'" },
        { label: "A spinning top rotating on its tip", isCorrect: "motion_type === 'rotational'" },
        { label: "A toy train running along a circular track", isCorrect: "motion_type === 'circular'" },
        { label: "The Earth revolving around the Sun in its orbit", isCorrect: "motion_type === 'circular'" }
      ]
    }
  },
  {
    _id: 'iit-oscillatory-vs-vibratory',
    id: 'iit-oscillatory-vs-vibratory',
    name: 'Oscillatory vs Vibratory Motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'When a body moves to-and-fro as a whole, it is **oscillatory**. When parts of a body vibrate, changing its shape/size, it is **vibratory**. Which of these is an example of **{{motion_type}}** motion?',
      explanationTemplate: 'Sitar strings change shape dynamically when plucked and generate sound, which is vibratory. A child on a swing moves to-and-fro as a single unit, which is oscillatory.',
      variables: {
        motion_type: { pool: ['oscillatory', 'vibratory'] }
      },
      options: [
        { label: "A child swinging on a park swing", isCorrect: "motion_type === 'oscillatory'" },
        { label: "The swinging pendulum of a wall clock", isCorrect: "motion_type === 'oscillatory'" },
        { label: "Plucking the string of a sitar or guitar", isCorrect: "motion_type === 'vibratory'" },
        { label: "The struck membrane of a tabla or drum", isCorrect: "motion_type === 'vibratory'" }
      ]
    }
  },
  {
    _id: 'iit-periodic-vs-random',
    id: 'iit-periodic-vs-random',
    name: 'Periodic vs Random Motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Identify the example of **{{motion_type}}** motion.',
      explanationTemplate: 'Periodic motion repeats at fixed, regular intervals of time. Random motion changes direction and speed unpredictably.',
      variables: {
        motion_type: { pool: ['periodic', 'random'] }
      },
      options: [
        { label: "A grandfather clock pendulum swinging", isCorrect: "motion_type === 'periodic'" },
        { label: "The needle of a sewing machine running at constant speed", isCorrect: "motion_type === 'periodic'" },
        { label: "A buzzing honeybee flying from flower to flower", isCorrect: "motion_type === 'random'" },
        { label: "A football player running across the field during a match", isCorrect: "motion_type === 'random'" }
      ]
    }
  },
  {
    _id: 'iit-multiple-motion',
    id: 'iit-multiple-motion',
    name: 'Decomposing Multiple Motion',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Which of the following objects displays both **translatory** and **rotatory** motion at the same time?',
      explanationTemplate: 'Bicycle wheels rotate (rotatory motion) and simultaneously move forward along a path (translatory motion). A drill bit rotates and moves forward into wood.',
      options: [
        { label: "A rolling bicycle wheel on a straight road", isCorrect: true },
        { label: "A drilling bit boring a hole in wood", isCorrect: true },
        { label: "A ceiling fan spinning on its stand", isCorrect: false },
        { label: "A stone falling straight down from a cliff", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-scalars-vs-vectors',
    id: 'iit-scalars-vs-vectors',
    name: 'Scalars vs Vectors Classification',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'Which of the following physical quantities is a **{{qty_type}}**?',
      explanationTemplate: 'Scalars have magnitude only (e.g. speed, distance). Vectors require both magnitude and direction to be specified (e.g. velocity, displacement).',
      variables: {
        qty_type: { pool: ['scalar', 'vector'] }
      },
      options: [
        { label: "Speed", isCorrect: "qty_type === 'scalar'" },
        { label: "Distance", isCorrect: "qty_type === 'scalar'" },
        { label: "Velocity", isCorrect: "qty_type === 'vector'" },
        { label: "Displacement", isCorrect: "qty_type === 'vector'" }
      ]
    }
  },
  {
    _id: 'iit-vector-representation',
    id: 'iit-vector-representation',
    name: 'Vector Representation',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'In the graphical representation of a vector as a straight line with an arrowhead, the length of the straight line represents [[blank1]] and the arrowhead indicates the [[blank2]].',
      explanationTemplate: 'A vector is represented by a directed line segment where its length is proportional to the magnitude and the arrow points in the direction of the vector.',
      interaction: { engine: 'fill_blank', inputMode: 'text' },
      answer: {
        blank1: 'magnitude',
        blank2: 'direction'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "magnitude" },
        { type: "exact_match", target: "blank2", value: "direction" }
      ]
    }
  },
  {
    _id: 'iit-distance-displacement-1d',
    id: 'iit-distance-displacement-1d',
    name: '1D Distance & Displacement',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'A boy walks **{{A}}** meters East, turns around and walks **{{B}}** meters West. His total distance is [[blank1]] meters, and his net displacement magnitude is [[blank2]] meters.',
      explanationTemplate: 'Distance is the total path length: {{A}} + {{B}} = {{dist}} m. Net displacement is the shortest path from start to end: {{A}} - {{B}} = {{disp}} m.',
      variables: {
        A: { pool: [30, 40, 50, 60, 80] },
        B: { pool: [10, 20, 30, 40] }
      },
      derivations: {
        dist: 'A + B',
        disp: 'A - B'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{dist}}',
        blank2: '{{disp}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{dist}}" },
        { type: "exact_match", target: "blank2", value: "{{disp}}" }
      ]
    }
  },
  {
    _id: 'iit-distance-displacement-circular',
    id: 'iit-distance-displacement-circular',
    name: 'Distance & Displacement on Circular Paths',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.5,
    config: {
      questionTemplate: 'A body moves along a circular path of radius **{{R}}** m. If it covers exactly **{{fraction}}** of the circle, its distance is [[blank1]] m and displacement magnitude is [[blank2]] m. (Take \\(\\pi = 22/7\\))',
      explanationTemplate: 'For a half circle, distance is half of circumference: \\(\\pi R = 22/7 \\times R\\). Displacement is the diameter: \\(2R\\). For a full circle, distance is circumference: \\(2\\pi R\\). Displacement is 0.',
      variables: {
        R: { pool: [7, 14, 21, 28] },
        fraction: { pool: ['half', 'full'] }
      },
      derivations: {
        dist: "fraction === 'half' ? 22 * R / 7 : 44 * R / 7",
        disp: "fraction === 'half' ? 2 * R : 0"
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{dist}}',
        blank2: '{{disp}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{dist}}" },
        { type: "exact_match", target: "blank2", value: "{{disp}}" }
      ]
    }
  },
  {
    _id: 'iit-distance-displacement-2d',
    id: 'iit-distance-displacement-2d',
    name: 'Distance & Displacement on 2D Grids',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.5,
    config: {
      questionTemplate: 'An ant crawls **{{X}}** cm East, then turns North and crawls **{{Y}}** cm. Its total distance is [[blank1]] cm and displacement magnitude is [[blank2]] cm.',
      explanationTemplate: 'Distance is the sum of perpendicular segments: {{X}} + {{Y}} = {{dist}} cm. Net displacement is the straight line hypotenuse: \\(\\sqrt{{{X}}^2 + {{Y}}^2} = {{disp}}\\) cm.',
      variables: {
        X: { pool: [4, 8, 12] },
        Y: { pool: [3, 6, 9] }
      },
      derivations: {
        dist: 'X + Y',
        disp: 'Math.sqrt(X*X + Y*Y)'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{dist}}',
        blank2: '{{disp}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{dist}}" },
        { type: "exact_match", target: "blank2", value: "{{disp}}" }
      ]
    }
  },
  {
    _id: 'iit-speed-distance-time',
    id: 'iit-speed-distance-time',
    name: 'Basic Speed, Distance & Time',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'A horse runs a distance of **{{distance}}** meters in **{{time}}** seconds. What is the average speed of the horse in m/s?',
      explanationTemplate: 'Average speed is calculated as \\(\\text{Speed} = \\frac{\\text{Distance}}{\\text{Time}} = \\frac{{{distance}}}{{{time}}} = {{correct_answer}}\\) m/s.',
      variables: {
        distance: { pool: [200, 400, 600, 800, 1000] },
        time: { pool: [10, 20, 40, 50] }
      },
      derivations: {
        correct_answer: 'distance / time',
        distractor_1: 'distance * time',
        distractor_2: 'time / distance',
        distractor_3: '(distance / time) + 5'
      },
      options: [
        { label: "{{correct_answer}} m/s", isCorrect: true },
        { label: "{{distractor_1}} m/s", isCorrect: false },
        { label: "{{distractor_2}} m/s", isCorrect: false },
        { label: "{{distractor_3}} m/s", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-speed-unit-conversion',
    id: 'iit-speed-unit-conversion',
    name: 'Speed Unit Conversions',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Convert a speed of **{{speed_kmh}}** km/h into m/s. The answer is [[blank1]] m/s.',
      explanationTemplate: 'To convert km/h to m/s, multiply by the conversion factor \\(\\frac{5}{18}\\): \\({{speed_kmh}} \\times \\frac{5}{18} = {{speed_ms}}\\) m/s.',
      variables: {
        speed_kmh: { pool: [36, 54, 72, 90, 108, 144] }
      },
      derivations: {
        speed_ms: 'speed_kmh * 5 / 18'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{speed_ms}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{speed_ms}}" }
      ]
    }
  },
  {
    _id: 'iit-odometer-average-speed',
    id: 'iit-odometer-average-speed',
    name: 'Odometer & Average Speed',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      questionTemplate: 'Before starting a journey, the odometer of a car reads **{{start_odo}}** km. At the end of the journey, it reads **{{end_odo}}** km. If the journey took exactly **{{time_hours}}** hours, what is the average speed of the car in km/h?',
      explanationTemplate: 'Distance traveled = {{end_odo}} - {{start_odo}} = {{distance}} km. Average speed = \\(\\frac{\\text{Distance}}{\\text{Time}} = \\frac{{{distance}}}{{{time_hours}}} = {{correct_answer}}\\) km/h.',
      variables: {
        start_odo: { pool: [12400, 36580, 45200] },
        distance: { pool: [60, 120, 180, 240] },
        time_hours: { pool: [2, 3, 4] }
      },
      derivations: {
        end_odo: 'start_odo + distance',
        correct_answer: 'distance / time_hours',
        distractor_1: 'distance * time_hours',
        distractor_2: 'distance / (time_hours + 1)',
        distractor_3: 'distance'
      },
      options: [
        { label: "{{correct_answer}} km/h", isCorrect: true },
        { label: "{{distractor_1}} km/h", isCorrect: false },
        { label: "{{distractor_2}} km/h", isCorrect: false },
        { label: "{{distractor_3}} km/h", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-distance-time-graph-qualitative',
    id: 'iit-distance-time-graph-qualitative',
    name: 'Qualitative Graph Interpretation',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      questionTemplate: 'On a distance-time graph, a flat horizontal line parallel to the time axis indicates that the body is **{{state}}**.',
      explanationTemplate: 'A horizontal line parallel to the time axis means distance does not change as time passes, which represents a body in a state of rest.',
      variables: {
        state: { pool: ['at rest'] }
      },
      options: [
        { label: "at rest", isCorrect: true },
        { label: "moving with uniform speed", isCorrect: false },
        { label: "accelerating", isCorrect: false },
        { label: "moving in random direction", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-speed-graph-slope',
    id: 'iit-speed-graph-slope',
    name: 'Calculating Speed from Graph Slopes',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.5,
    config: {
      questionTemplate: 'A straight line segment on a distance-time graph connects coordinate points (t = **{{X1}}** s, d = **{{Y1}}** m) and (t = **{{X2}}** s, d = **{{Y2}}** m). The speed of the object during this segment is [[blank1]] m/s.',
      explanationTemplate: 'Speed is the slope of the distance-time graph segment: \\(\\text{Slope} = \\frac{Y_2 - Y_1}{X_2 - X_1} = \\frac{{{Y2}} - {{Y1}}}{{{X2}} - {{X1}}} = {{speed}}\\) m/s.',
      variables: {
        X1: { pool: [0, 2, 4] },
        Y1: { pool: [0, 10, 20] },
        X2: { pool: [10, 12, 14] },
        Y2: { pool: [50, 60, 70] }
      },
      derivations: {
        speed: '(Y2 - Y1) / (X2 - X1)'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{speed}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{speed}}" }
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
  console.log(`🔌 Seeding IIT Templates to: "${dbName}"...`);
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
    console.log(`🎉 Seeded/updated ${upsertCount} IIT templates successfully!`);

  } catch (error) {
    console.error("❌ Error seeding templates:", error);
  } finally {
    await client.close();
  }
}

runSeed();
