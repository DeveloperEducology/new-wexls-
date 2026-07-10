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
    _id: 'iit-p6-light-properties',
    id: 'iit-p6-light-properties',
    name: 'Understand light properties, speed, and luminous bodies',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['luminous', 'non_luminous', 'speed_m', 'speed_km'] }
      },
      derivations: {
        question_text: "concept === 'luminous' ? 'Which of the following is an example of a **luminous body**?' : (concept === 'non_luminous' ? 'Which of the following is an example of a **non-luminous body**?' : (concept === 'speed_m' ? 'What is the approximate speed of light in a vacuum in meters per second?' : 'What is the approximate speed of light in a vacuum in kilometers per second?'))",
        opt_correct: "concept === 'luminous' ? 'The Sun' : (concept === 'non_luminous' ? 'The Moon' : (concept === 'speed_m' ? '$3 \\\\times 10^8 \\\\text{ m/s}$' : '$300,000 \\\\text{ km/s}$'))",
        opt_wrong1: "concept === 'luminous' ? 'The Moon' : (concept === 'non_luminous' ? 'The Sun' : (concept === 'speed_m' ? '$3 \\\\times 10^6 \\\\text{ m/s}$' : '$3,000 \\\\text{ km/s}$'))",
        opt_wrong2: "concept === 'luminous' ? 'A wooden table' : (concept === 'non_luminous' ? 'A glowing star' : (concept === 'speed_m' ? '$300,000 \\\\text{ m/s}$' : '$3 \\\\times 10^8 \\\\text{ km/s}$'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Properties of Light:**\n\n* **Definition**: Light is an invisible form of energy that causes in us the sensation of sight. It makes other objects visible but is itself invisible.\n* **Luminous vs Non-luminous**:\n  * **Luminous bodies** emit light energy of their own (e.g., Sun, stars, burning candle, glow worm).\n  * **Non-luminous bodies** do not emit light but become visible by reflecting light falling on them (e.g., Moon, wood, books, furniture).\n* **Speed of Light**:\n  * In vacuum or air, light travels at a speed of approximately $3 \\times 10^8 \\text{ m/s}$.\n  * In kilometers, this speed is:\n\n$$300,000 \\text{ km/s}$$\n\n* **Medium**: Unlike sound, light does not require a material medium to travel and can propagate through a vacuum.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-optical-media',
    id: 'iit-p6-optical-media',
    name: 'Classify optical media and materials',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        medium_type: { pool: ['homogeneous', 'heterogeneous', 'transparent', 'translucent', 'opaque'] }
      },
      derivations: {
        question_text: "medium_type === 'homogeneous' ? 'Which of the following materials is a **homogeneous medium** (uniform composition throughout)?' : (medium_type === 'heterogeneous' ? 'Which of the following materials is a **heterogeneous medium** (non-uniform composition)?' : (medium_type === 'transparent' ? 'Which of the following is a **transparent medium** (allows most light to pass)?' : (medium_type === 'translucent' ? 'Which of the following is a **translucent medium** (allows light to pass partially)?' : 'Which of the following is an **opaque body** (blocks all light)?')))",
        opt_correct: "medium_type === 'homogeneous' ? 'Distilled water' : (medium_type === 'heterogeneous' ? 'Muddy water' : (medium_type === 'transparent' ? 'Clean clear glass' : (medium_type === 'translucent' ? 'Oiled paper' : 'Wooden block')))",
        opt_wrong1: "medium_type === 'homogeneous' ? 'Muddy water' : (medium_type === 'heterogeneous' ? 'Distilled water' : (medium_type === 'transparent' ? 'Oiled paper' : (medium_type === 'translucent' ? 'Clean clear glass' : 'Clean clear glass')))",
        opt_wrong2: "medium_type === 'homogeneous' ? 'Foggy air' : (medium_type === 'heterogeneous' ? 'Pure alcohol' : (medium_type === 'transparent' ? 'Wooden block' : (medium_type === 'translucent' ? 'Wooden block' : 'Oiled paper')))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Optical Media Classification:**\n\n* **Homogeneous Medium**: An optical medium with a uniform composition throughout (e.g., vacuum, pure water, diamond, glass).\n* **Heterogeneous Medium**: A medium with a non-uniform composition at different points (e.g., air, muddy water, fog, mist, smoke).\n* **Transparent**: Allows almost all light to pass through (e.g., vacuum, clear air, clean water, glass).\n* **Translucent**: Allows light to pass through only partially (e.g., oiled paper, tissue paper, ground glass, butter paper).\n* **Opaque**: Does not allow any light to pass through (e.g., wood, brick, metal sheets).',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-rays-and-beams',
    id: 'iit-p6-rays-and-beams',
    name: 'Classify light beams and rays',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        beam_desc: { pool: ['parallel', 'divergent', 'convergent'] }
      },
      derivations: {
        question_text: "beam_desc === 'parallel' ? 'What type of beam is formed when rays of light travel parallel to each other?' : (beam_desc === 'divergent' ? 'What type of beam is formed when light rays originate from a point and spread out in different directions?' : 'What type of beam is formed when light rays coming from different directions meet at a single point?')",
        opt_correct: "beam_desc === 'parallel' ? 'Parallel beam' : (beam_desc === 'divergent' ? 'Divergent beam' : 'Convergent beam')",
        opt_wrong1: "beam_desc === 'parallel' ? 'Divergent beam' : (beam_desc === 'divergent' ? 'Parallel beam' : 'Parallel beam')",
        opt_wrong2: "beam_desc === 'parallel' ? 'Convergent beam' : (beam_desc === 'divergent' ? 'Convergent beam' : 'Divergent beam')"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Rays and Beams of Light:**\n\n* **Ray of Light**: The straight path along which light energy travels in a given direction.\n* **Beam of Light**: A collection or bundle of light rays.\n* **Parallel Beam**: Rays travel parallel to each other (e.g. searchlight beam, sunlight reaching Earth).\n* **Divergent Beam**: Rays originating from a point source spread out in different directions (e.g. light from a bulb, candle, or car headlight).\n* **Convergent Beam**: Rays coming from different directions meet (converge) at a single point (e.g. parallel rays passing through a convex lens).',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-rectilinear-propagation',
    id: 'iit-p6-rectilinear-propagation',
    name: 'Understand rectilinear propagation of light',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['straight_line', 'experiment', 'natural_examples'] }
      },
      derivations: {
        question_text: "concept === 'straight_line' ? 'The property of light travelling in a straight line in a homogeneous medium is called:' : (concept === 'experiment' ? 'In the cardboard experiment for rectilinear propagation, what happens if you slightly displace the middle cardboard?' : 'Which of the following observations demonstrates the rectilinear propagation of light?')",
        opt_correct: "concept === 'straight_line' ? 'Rectilinear propagation' : (concept === 'experiment' ? 'The candle flame becomes invisible' : 'A beam of headlight on a misty night')",
        opt_wrong1: "concept === 'straight_line' ? 'Reflective propagation' : (concept === 'experiment' ? 'The candle flame grows brighter' : 'Light spreading uniformly around a room')",
        opt_wrong2: "concept === 'straight_line' ? 'Curvilinear propagation' : (concept === 'experiment' ? 'The candle flame changes color' : 'A shadow fading away completely')"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Rectilinear Propagation of Light:**\n\n* **Concept**: Light always travels in a straight line as long as it travels within the same homogeneous medium.\n* **Experimental Verification**: Placing three cardboards with aligned central pinholes. If all holes are in a straight line, a candle flame is visible. If one cardboard is displaced, the straight path of light is blocked, showing light does not travel in a zig-zag way.\n* **Everyday Examples**:\n  1. The beam of a car headlight on a misty night.\n  2. A beam of torchlight entering a dark, smoky room.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-pinhole-camera',
    id: 'iit-p6-pinhole-camera',
    name: 'Pinhole camera, image magnification, and factors',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        factor: { pool: ['image_nature', 'magnification_definition', 'object_distance', 'camera_length'] }
      },
      derivations: {
        question_text: "factor === 'image_nature' ? 'Which of the following is correct regarding the nature of the image formed by a pinhole camera?' : (factor === 'magnification_definition' ? 'Which of the following is correct regarding the magnification of a pinhole camera?' : (factor === 'object_distance' ? 'Which of the following is correct regarding how object distance affects the pinhole camera image?' : 'Which of the following is correct regarding how screen distance (camera length) affects the pinhole camera image?'))",
        opt_correct: "factor === 'image_nature' ? 'The image formed is always real and inverted' : (factor === 'magnification_definition' ? 'It is the ratio of image size to object size ($A\\\'B\\\'/AB$)' : (factor === 'object_distance' ? 'The size of the image decreases as the object moves farther' : 'The size of the image increases as screen distance increases'))",
        opt_wrong1: "factor === 'image_nature' ? 'The image formed is virtual and erect' : (factor === 'magnification_definition' ? 'It is the product of image size and object size ($A\\\'B\\\' \\\\times AB$)' : (factor === 'object_distance' ? 'The size of the image increases as the object moves farther' : 'The size of the image decreases as screen distance increases'))",
        opt_wrong2: "factor === 'image_nature' ? 'The image formed is real and erect' : (factor === 'magnification_definition' ? 'It is the ratio of object size to image size ($AB/A\\\'B\\\'$)' : (factor === 'object_distance' ? 'The size of the image remains completely unchanged' : 'The size of the image remains completely unchanged'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Pinhole Camera Principles:**\n\n* **Working Principle**: Based on the **rectilinear propagation of light**.\n* **Nature of Image**: The image formed is **real** (formed on a screen) and **inverted** (upside down) because light rays crossing at the pinhole invert from top to bottom.\n* **Magnification ($m$)** is defined as the ratio of image size to object size:\n\n$$m = \\frac{\\text{Height of Image } (A\'B\')}{\\text{Height of Object } (AB)} = \\frac{\\text{Camera Length } (v)}{\\text{Object Distance } (u)}$$\n\n* **Factors affecting image size**:\n  * Image size **decreases** if the object is moved farther from the pinhole ($u$ increases).\n  * Image size **increases** if the camera length (screen distance $v$) increases.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-reflection-terms',
    id: 'iit-p6-reflection-terms',
    name: 'Identify terms related to reflection of light',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        term: { pool: ['incident_ray', 'normal', 'angle_incidence', 'glance_incidence', 'reflected_ray'] }
      },
      derivations: {
        question_text: "term === 'incident_ray' ? 'A ray of light travelling towards a reflecting surface is called the:' : (term === 'normal' ? 'The perpendicular line drawn to the reflecting surface at the point of incidence is the:' : (term === 'angle_incidence' ? 'The angle between the incident ray and the normal is the:' : (term === 'glance_incidence' ? 'The angle between the incident ray and the surface of the mirror is the:' : 'A ray of light which bounces off the reflecting surface and returns in the same medium is the:')))",
        opt_correct: "term === 'incident_ray' ? 'Incident ray' : (term === 'normal' ? 'Normal' : (term === 'angle_incidence' ? 'Angle of incidence' : (term === 'glance_incidence' ? 'Glance angle of incidence' : 'Reflected ray')))",
        opt_wrong1: "term === 'incident_ray' ? 'Reflected ray' : (term === 'normal' ? 'Incident ray' : (term === 'angle_incidence' ? 'Angle of reflection' : (term === 'glance_incidence' ? 'Angle of incidence' : 'Incident ray')))",
        opt_wrong2: "term === 'incident_ray' ? 'Normal' : (term === 'normal' ? 'Reflected ray' : (term === 'angle_incidence' ? 'Glance angle of incidence' : (term === 'glance_incidence' ? 'Angle of reflection' : 'Normal')))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Reflection Terminology:**\n\nLet a ray of light strike a mirror at point $B$:\n* **Incident Ray**: The ray of light travelling towards the reflecting surface ($AB$).\n* **Reflected Ray**: The ray of light that bounces off the surface and returns in the same medium ($BC$).\n* **Normal**: The perpendicular line drawn to the reflecting surface at the point of incidence ($BN$).\n* **Angle of Incidence ($i$)**: The angle between the incident ray and the normal ($\\angle ABN$).\n* **Angle of Reflection ($r$)**: The angle between the reflected ray and the normal ($\\angle CBN$).\n* **Glance Angle of Incidence ($\\theta_g$)**: The angle the incident ray makes with the mirror surface ($\\angle MBA$). Note: $i + \\theta_g = 90^\\circ$.',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-reflection-laws',
    id: 'iit-p6-reflection-laws',
    name: 'Apply the laws of reflection of light',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        incident_angle: { pool: [30, 45, 60] }
      },
      questionTemplate: 'A ray of light is incident on a plane mirror at an angle of incidence of **{{incident_angle}}**°. Calculate the angle of reflection ($r$) and the glance angle of incidence ($\\theta_g$).',
      explanationTemplate: '**Laws of Reflection:**\n\n1. **First Law**: The incident ray, the reflected ray, and the normal at the point of incidence all lie in the same plane.\n2. **Second Law**: The angle of incidence ($i$) is always equal to the angle of reflection ($r$):\n\n$$r = i$$\n\n**Relation with Glance Angle ($\\theta_g$):**\n\nThe normal is perpendicular ($90^\\circ$) to the mirror. Therefore:\n\n$$i + \\theta_g = 90^\\circ \\implies \\theta_g = 90^\\circ - i$$\n\n**Given values in this problem:**\n* $i = {{incident_angle}}^\\circ$\n* $r = i = {{incident_angle}}^\\circ$\n* $\\theta_g = 90^\\circ - {{incident_angle}}^\\circ = {{glance}}^\\circ$',
      derivations: {
        glance: '90 - incident_angle',
        opt_correct: "'$r = ' + incident_angle + '°$ and $\\\\theta_g = ' + (90 - incident_angle) + '°$'",
        opt_wrong1: "'$r = ' + (90 - incident_angle) + '°$ and $\\\\theta_g = ' + incident_angle + '°$'",
        opt_wrong2: "'$r = ' + incident_angle + '°$ and $\\\\theta_g = ' + incident_angle + '°$'"
      },
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-angle-of-deviation',
    id: 'iit-p6-angle-of-deviation',
    name: 'Calculate the angle of deviation in reflection',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.4,
    config: {
      variables: {
        i: { pool: [30, 40, 45, 60] }
      },
      questionTemplate: 'Calculate the angle of deviation ($d$) of a ray of light incident on a plane mirror at an angle of incidence of **{{i}}**°. The answer is [[blank1]]°.',
      explanationTemplate: '**Angle of Deviation ($d$):**\n\nThe angle of deviation is the angle through which a ray of light is turned from its original straight path after reflection.\n\nFrom the geometry of a straight path line, the sum of the angles is:\n\n$$i + r + d = 180^\\circ$$\n\nSince $r = i$ (Laws of Reflection):\n\n$$2i + d = 180^\\circ \\implies d = 180^\\circ - 2i$$\n\n**Step-by-step Calculation:**\n* Angle of incidence $i = {{i}}^\\circ$\n* $d = 180^\\circ - 2 \\times {{i}}^\\circ = 180^\\circ - {{twoI}}^\\circ$\n* $d = {{deviation}}^\\circ$',
      derivations: {
        twoI: '2 * i',
        deviation: '180 - (2 * i)'
      },
      interaction: { engine: 'fill_blank', inputMode: 'number' },
      answer: {
        blank1: '{{deviation}}'
      },
      validationRules: [
        { type: "exact_match", target: "blank1", value: "{{deviation}}" }
      ]
    }
  },
  {
    _id: 'iit-p6-real-vs-virtual',
    id: 'iit-p6-real-vs-virtual',
    name: 'Distinguish real and virtual images',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        query: { pool: ['real_converge', 'real_screen', 'virtual_diverge', 'virtual_screen'] }
      },
      derivations: {
        question_text: "query === 'real_converge' ? 'When light rays actually converge and meet at a point after reflection/refraction, they form a:' : (query === 'real_screen' ? 'An image that can be caught or projected onto a screen is a:' : (query === 'virtual_diverge' ? 'When light rays do not meet but appear to diverge from a point behind a mirror, they form a:' : 'An image that cannot be caught or projected onto a screen is a:'))",
        opt_correct: "query === 'real_converge' || query === 'real_screen' ? 'Real image' : 'Virtual image'",
        opt_wrong1: "query === 'real_converge' || query === 'real_screen' ? 'Virtual image' : 'Real image'"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Real vs. Virtual Images:**\n\n* **Real Image**:\n  * Light rays diverging from an object actually converge and meet at a point after reflection/refraction.\n  * It is always **inverted** (upside down).\n  * It **can** be caught on a screen (e.g. cinema screen projection).\n* **Virtual Image**:\n  * Light rays do not actually meet but appear to diverge from another point behind the mirror.\n  * It is always **erect** (upright).\n  * It **cannot** be caught on a screen (e.g. image of your face in a plane mirror).',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false }
      ]
    }
  },
  {
    _id: 'iit-p6-shadows-and-eclipses',
    id: 'iit-p6-shadows-and-eclipses',
    name: 'Understand shadow parts and eclipses',
    type: 'parameterized',
    examId: 'iit-foundation',
    section: 'physics',
    topic: 'mechanics',
    difficulty: 0.3,
    config: {
      variables: {
        concept: { pool: ['umbra', 'penumbra', 'solar_eclipse', 'lunar_eclipse'] }
      },
      derivations: {
        question_text: "concept === 'umbra' ? 'The region of total darkness behind an opaque body where no light rays can reach is called the:' : (concept === 'penumbra' ? 'The region of partial darkness surrounding the umbra where some light still reaches is called the:' : (concept === 'solar_eclipse' ? 'An eclipse where the Moon comes directly between the Sun and Earth, casting its shadow on Earth is a:' : 'An eclipse where the Earth comes directly between the Sun and Moon, casting its shadow on the Moon is a:'))",
        opt_correct: "concept === 'umbra' ? 'Umbra' : (concept === 'penumbra' ? 'Penumbra' : (concept === 'solar_eclipse' ? 'Solar Eclipse' : 'Lunar Eclipse'))",
        opt_wrong1: "concept === 'umbra' ? 'Penumbra' : (concept === 'penumbra' ? 'Umbra' : (concept === 'solar_eclipse' ? 'Lunar Eclipse' : 'Solar Eclipse'))",
        opt_wrong2: "concept === 'umbra' ? 'Solar Eclipse' : (concept === 'penumbra' ? 'Solar Eclipse' : (concept === 'solar_eclipse' ? 'Umbra' : 'Umbra'))"
      },
      questionTemplate: '{{question_text}}',
      explanationTemplate: '**Shadows and Eclipses:**\n\n* **Shadow Parts**:\n  * **Umbra**: The region of total darkness behind an opaque object where no light from the source reaches.\n  * **Penumbra**: The region of partial darkness surrounding the umbra where some light rays still reach.\n* **Eclipses** (shadows cast in space):\n  * **Solar Eclipse**: The Moon comes directly between the Sun and the Earth, casting its shadow on the Earth (occurs on a **New Moon** day).\n  * **Lunar Eclipse**: The Earth comes directly between the Sun and the Moon, casting its shadow on the Moon (occurs on a **Full Moon** day).',
      options: [
        { label: "{{opt_correct}}", isCorrect: true },
        { label: "{{opt_wrong1}}", isCorrect: false },
        { label: "{{opt_wrong2}}", isCorrect: false }
      ]
    }
  }
];

const newSkills = [
  { id: 'iit-p6-light-properties', title: 'Understand light properties, speed, and luminous bodies', chapterId: 'iit-light-6', code: 'P.6.4.1', templateId: 'iit-p6-light-properties', engine: 'questionBank', order: 1 },
  { id: 'iit-p6-optical-media', title: 'Classify optical media and materials', chapterId: 'iit-light-6', code: 'P.6.4.2', templateId: 'iit-p6-optical-media', engine: 'questionBank', order: 2 },
  { id: 'iit-p6-rays-and-beams', title: 'Classify light beams and rays', chapterId: 'iit-light-6', code: 'P.6.4.3', templateId: 'iit-p6-rays-and-beams', engine: 'questionBank', order: 3 },
  { id: 'iit-p6-rectilinear-propagation', title: 'Understand rectilinear propagation of light', chapterId: 'iit-light-6', code: 'P.6.4.4', templateId: 'iit-p6-rectilinear-propagation', engine: 'questionBank', order: 4 },
  { id: 'iit-p6-pinhole-camera', title: 'Pinhole camera, image magnification, and factors', chapterId: 'iit-light-6', code: 'P.6.4.5', templateId: 'iit-p6-pinhole-camera', engine: 'questionBank', order: 5 },
  { id: 'iit-p6-reflection-terms', title: 'Identify terms related to reflection of light', chapterId: 'iit-light-6', code: 'P.6.4.6', templateId: 'iit-p6-reflection-terms', engine: 'questionBank', order: 6 },
  { id: 'iit-p6-reflection-laws', title: 'Apply the laws of reflection of light', chapterId: 'iit-light-6', code: 'P.6.4.7', templateId: 'iit-p6-reflection-laws', engine: 'questionBank', order: 7 },
  { id: 'iit-p6-angle-of-deviation', title: 'Calculate the angle of deviation in reflection', chapterId: 'iit-light-6', code: 'P.6.4.8', templateId: 'iit-p6-angle-of-deviation', engine: 'questionBank', order: 8 },
  { id: 'iit-p6-real-vs-virtual', title: 'Distinguish real and virtual images', chapterId: 'iit-light-6', code: 'P.6.4.9', templateId: 'iit-p6-real-vs-virtual', engine: 'questionBank', order: 9 },
  { id: 'iit-p6-shadows-and-eclipses', title: 'Understand shadow parts and eclipses', chapterId: 'iit-light-6', code: 'P.6.4.10', templateId: 'iit-p6-shadows-and-eclipses', engine: 'questionBank', order: 10 }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding IIT Light to: "${dbName}"...`);
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
    console.log(`🎉 Seeded/updated ${templateCount} Light templates successfully!`);

    // 2. Clear old questions to force dynamic templates evaluation
    for (const t of templates) {
      await db.collection('questions').deleteMany({ templateId: t._id });
    }
    console.log(`🎉 Cleared previously generated questions to force active evaluation!`);

    // 3. Upsert Chapter
    const chapterNode = {
      id: 'iit-light-6',
      title: 'Light',
      unitId: 'mechanics',
      gradeId: 'grade-6',
      order: 5
    };
    await db.collection('iit_chapters').updateOne(
      { id: chapterNode.id },
      { $set: { ...chapterNode, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`🎉 Chapter iit-light-6 upserted successfully!`);

    // 4. Seed micro-skills
    await db.collection('iit_skills').deleteMany({ chapterId: 'iit-light-6' });
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
    console.log(`🎉 Seeded/updated ${skillCount} Light micro-skills successfully!`);

  } catch (error) {
    console.error("❌ Error seeding Light:", error);
  } finally {
    await client.close();
  }
}

runSeed();
