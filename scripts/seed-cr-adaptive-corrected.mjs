/**
 * Seed script: Seed Grade 10 Science dynamic templates & adaptive skills (Corrected Formulas)
 *
 * Usage: node --env-file=.env.local scripts/seed-cr-adaptive-corrected2.mjs
 */

import { getMongoDb } from '../src/lib/db/mongo.js';

const DYNAMIC_TEMPLATES = [
  /* ───────────────────────────────────────────────────────────────
     1. MAIN SKILL TEMPLATE (Level 4 matching/categorizationv2)
     ───────────────────────────────────────────────────────────── */
  {
    id: 'science-chemical-reactions-cr1',
    type: 'universal',
    subject: 'science',
    topic: 'chemical-reactions',
    grade: '10',
    skillId: 'cr-g10-identify-reaction',
    competencyId: 'cr_identify',
    title: 'Identify chemical reactions and their signs (Matching)',
    description: 'Match chemical reactions to their signs/observations using drag and drop.',
    optionsType: 'categorizationv2',
    interaction: {
      engine: 'categorizationv2',
      inputMode: 'choice'
    },
    layoutConfig: {
      mode: 'prompt_top',
      responsiveTarget: 'desktop_first',
      clickToSubmit: false,
      audio: false
    },
    validationRules: [
      {
        type: 'exact_match',
        target: 'answer',
        value: '[AnswerMap]'
      }
    ],
    feedbackRules: {
      correct_message: 'Correct! Excellent job matching the observations.',
      incorrect_message: 'Not quite. Check the reaction characteristics and try again.',
      hints: ['Look at the reactants to identify the expected observation.'],
      step_by_step_explanation: 'Look at the reactants: 1. Mg burns with a dazzling white flame to form white MgO powder. 2. Lead nitrate and KI mix to form a bright yellow precipitate of PbI2. 3. Zinc + Acid yields hydrogen gas bubbles.',
      misconception_feedback: {}
    },
    analyticsConfig: {
      attempts: true,
      time_spent: true,
      hints_used: true,
      first_try_correct: true,
      mastery_score: true,
      smart_score: true,
      confidence_score: true
    },
    adaptiveRules: {
      correct: {
        route: 'next_skill',
        targetSkillId: 'cr-g10-classify-reaction'
      },
      incorrect: {
        route: 'remediation_skill',
        targetSkillId: 'cr-g10-identify-reaction-easy'
      },
      masteryAchieved: {
        route: 'harder_template',
        targetTemplateId: 'cr-g10-classify-reaction'
      }
    },
    questionText: 'Match each chemical reaction with its correct observation or sign.',
    answer: '[AnswerMap]',
    correctAnswer: '[AnswerMap]',
    parts: [
      {
        type: 'text',
        content: '### Chemical Reactions and Observations\n\nDrag each observation/sign from the tray below and match it to its corresponding chemical reaction.'
      },
      {
        type: 'categorizationv2',
        renderer: 'html',
        layoutMode: 'grid_fill',
        isCopiable: false,
        hideItemLabels: false,
        items: '[ItemsList]',
        targets: '[TargetsList]',
        grid: {
          columns: 1,
          requiredCount: 3,
          fitToWindow: true,
          cellMinHeight: 84
        },
        behavior: {
          clickToDrop: true,
          clickToNextEmpty: true,
          dragToDrop: true,
          isCopiable: false,
          preserveSourceSlots: true
        }
      }
    ],
    solution: {
      sections: [
        {
          type: 'text',
          content: '💡 **Observations Key:**\n\n* **Magnesium + Oxygen:** Burns with dazzling flame forming White Powder (MgO).\n* **Lead Nitrate + Potassium Iodide:** Yellow Precipitate (PbI2).\n* **Zinc + Sulphuric Acid:** Effervescence/Bubbles of Hydrogen Gas (H2).\n* **Ferrous Sulphate Heating:** SO2 gas with burning sulphur smell.\n* **Lead Nitrate Heating:** Brown fumes of Nitrogen Dioxide (NO2).\n* **Calcium Carbonate Heating:** CO2 gas release.\n* **Iron nail + CuSO4:** Solution turns green.\n* **CaO + Water:** Highly exothermic slaking reaction.'
        }
      ]
    },
    variables: [
      {
        name: 'index',
        type: 'array',
        values: [0, 1, 2]
      },
      {
        name: 'ItemsList',
        type: 'expression',
        formula: '[[{"id":"white_powder","label":"White powder (MgO)","content":"White powder (MgO)"},{"id":"yellow_ppt","label":"Yellow precipitate (PbI2)","content":"Yellow precipitate (PbI2)"},{"id":"h2_gas","label":"Hydrogen gas (H2)","content":"Hydrogen gas (H2)"}],[{"id":"so2_gas","label":"Burning sulphur smell (SO2)","content":"Burning sulphur smell (SO2)"},{"id":"brown_fumes","label":"Brown fumes of NO2 gas","content":"Brown fumes of NO2 gas"},{"id":"co2_gas","label":"Carbon dioxide gas (CO2)","content":"Carbon dioxide gas (CO2)"}],[{"id":"blue_fades","label":"Solution turns pale green","content":"Solution turns pale green"},{"id":"heat_released","label":"Highly exothermic (heats up)","content":"Highly exothermic (heats up)"},{"id":"grey_color","label":"White crystals turn grey","content":"White crystals turn grey"}]][index]'
      },
      {
        name: 'TargetsList',
        type: 'expression',
        formula: '[[{"id":"slot_magnesium","label":"Burning magnesium ribbon in air"},{"id":"slot_lead","label":"Mixing lead nitrate & potassium iodide"},{"id":"slot_zinc","label":"Adding zinc granules to dilute acid"}],[{"id":"slot_feso4","label":"Heating ferrous sulphate crystals"},{"id":"slot_pbno3","label":"Heating lead nitrate powder"},{"id":"slot_caco3","label":"Heating calcium carbonate (limestone)"}],[{"id":"slot_iron_cusa","label":"Iron nail kept in copper sulphate solution"},{"id":"slot_slaking","label":"Adding water to calcium oxide (quicklime)"},{"id":"slot_agcl","label":"Silver chloride left in sunlight"}]][index]'
      },
      {
        name: 'AnswerMap',
        type: 'expression',
        formula: '[Object.fromEntries([[["slot_magnesium", "white_powder"], ["slot_lead", "yellow_ppt"], ["slot_zinc", "h2_gas"]], [["slot_feso4", "so2_gas"], ["slot_pbno3", "brown_fumes"], ["slot_caco3", "co2_gas"]], [["slot_iron_cusa", "blue_fades"], ["slot_slaking", "heat_released"], ["slot_agcl", "grey_color"]]][index])][0]'
      }
    ],
    visuals: [],
    options: []
  },

  /* ───────────────────────────────────────────────────────────────
     2. REMEDIATION TEMPLATE (Level 1 MCQ)
     ───────────────────────────────────────────────────────────── */
  {
    id: 'science-chemical-reactions-cr1-easy',
    type: 'universal',
    subject: 'science',
    topic: 'chemical-reactions',
    grade: '10',
    skillId: 'cr-g10-identify-reaction-easy',
    competencyId: 'cr_identify_remediation',
    title: 'Identify chemical reactions (Easy Remediation)',
    description: 'Basic conceptual MCQ to help clarify reaction signs.',
    optionsType: 'mcq',
    interaction: {
      engine: 'mcq'
    },
    layoutConfig: {
      mode: 'prompt_top_options_bottom',
      responsiveTarget: 'mobile_first',
      audio: false
    },
    feedbackRules: {
      correct_message: 'Correct! Great step back to master the basics.',
      incorrect_message: 'Try again. Remember the key indicators of a chemical change.',
      hints: [],
      step_by_step_explanation: 'Physical changes are reversible and form no new substances. Chemical changes form brand new substances (like rust, gas bubbles, precipitates).',
      misconception_feedback: {}
    },
    analyticsConfig: {
      attempts: true,
      time_spent: true
    },
    adaptiveRules: {
      correct: {
        route: 'next_skill',
        targetSkillId: 'cr-g10-identify-reaction'
      },
      incorrect: {
        route: 'stay',
        targetSkillId: 'cr-g10-identify-reaction-easy'
      }
    },
    questionText: '[QuestionText]',
    parts: [
      {
        type: 'text',
        content: '[QuestionText]'
      }
    ],
    options: [
      { "label": "[OptionA]", "isCorrect": "[IsCorrectA]" },
      { "label": "[OptionB]", "isCorrect": "[IsCorrectB]" },
      { "label": "[OptionC]", "isCorrect": "[IsCorrectC]" },
      { "label": "[OptionD]", "isCorrect": "[IsCorrectD]" }
    ],
    variables: [
      {
        name: 'index',
        type: 'array',
        values: [0, 1, 2, 3, 4, 5]
      },
      {
        name: 'QuestionText',
        type: 'expression',
        formula: '["Which of the following is a chemical change?", "What gas is released when zinc reacts with dilute sulphuric acid?", "What is the colour of the precipitate formed in the lead nitrate and potassium iodide reaction?", "Which of the following is a physical change?", "When calcium oxide (quicklime) reacts vigorously with water, what product is formed?", "Which of the following is a sign that a chemical reaction has taken place?"][index]'
      },
      {
        name: 'OptionA',
        type: 'expression',
        formula: '["Melting of ice", "Oxygen gas", "White", "Burning of wood", "Calcium chloride", "Only change in state"][index]'
      },
      {
        name: 'OptionB',
        type: 'expression',
        formula: '["Tearing of a paper sheet", "Carbon dioxide gas", "Red", "Souring of milk", "Calcium hydroxide (slaked lime)", "Only change in shape"][index]'
      },
      {
        name: 'OptionC',
        type: 'expression',
        formula: '["Rusting of an iron nail", "Hydrogen gas", "Yellow", "Boiling of water to steam", "Calcium carbonate", "Evolution of gas, temperature change, or colour change"][index]'
      },
      {
        name: 'OptionD',
        type: 'expression',
        formula: '["Dissolving sugar in water", "Nitrogen gas", "Blue", "Digestion of food", "Calcium sulphate", "No change of any kind"][index]'
      },
      {
        name: 'Correct',
        type: 'expression',
        formula: '["Rusting of an iron nail", "Hydrogen gas", "Yellow", "Boiling of water to steam", "Calcium hydroxide (slaked lime)", "Evolution of gas, temperature change, or colour change"][index]'
      },
      {
        name: 'Explanation',
        type: 'expression',
        formula: '["Rusting of iron is a chemical change because a new substance (iron oxide) is formed, which cannot be reversed easily.", "Zinc reacts with sulphuric acid to produce zinc sulphate and hydrogen gas bubbles (Zn + H2SO4 -> ZnSO4 + H2).", "Lead nitrate and potassium iodide react to form a bright yellow precipitate of lead iodide (PbI2).", "Boiling of water is a physical change because it only changes state from liquid to gas without forming any new chemical substance.", "CaO + H2O -> Ca(OH)2. This is a highly exothermic combination reaction that forms calcium hydroxide (slaked lime).", "The main signs of a chemical reaction include evolution of a gas, change in temperature, change in colour, or formation of a precipitate."][index]'
      },

      {
        name: 'IsCorrectA',
        type: 'expression',
        formula: 'false'
      },
      {
        name: 'IsCorrectB',
        type: 'expression',
        formula: 'index === 4'
      },
      {
        name: 'IsCorrectC',
        type: 'expression',
        formula: 'index !== 4'
      },
      {
        name: 'IsCorrectD',
        type: 'expression',
        formula: 'false'
      }




    ],
    solution: {
      sections: [
        {
          type: 'text',
          content: '[Explanation]'
        }
      ]
    }
  }
];

async function run() {
  const db = await getMongoDb();
  if (!db) {
    console.error('Cannot connect to database.');
    process.exit(1);
  }

  // 1. Seed dynamic templates
  console.log('Seeding dynamic templates...');
  for (const t of DYNAMIC_TEMPLATES) {
    const { id, ...rest } = t;
    const now = new Date();
    await db.collection('dynamic_templates').updateOne(
      { id },
      {
        $set: { ...rest, updatedAt: now },
        $setOnInsert: { id, createdAt: now }
      },
      { upsert: true }
    );
    console.log(`  ✅ Seeded template: ${id}`);
  }

  // 2. Update existing skill cr-g10-identify-reaction to use universal-template
  console.log('\nUpdating skill nodes in skills_v2...');
  const res = await db.collection('skills_v2').updateOne(
    { id: 'cr-g10-identify-reaction' },
    {
      $set: {
        engine: 'universal-template',
        templateId: 'science-chemical-reactions-cr1',
        unlocks: ['cr-g10-classify-reaction'],
        prereqs: []
      }
    }
  );
  console.log(`  ✅ Updated skill cr-g10-identify-reaction: matched=${res.matchedCount}, modified=${res.modifiedCount}`);

  // 3. Upsert remediation skill cr-g10-identify-reaction-easy
  const easySkill = {
    id: 'cr-g10-identify-reaction-easy',
    title: 'Identify chemical reactions (Remediation)',
    chapterId: 'chemical-reactions-g10',
    code: 'CR.1.R',
    templateId: 'science-chemical-reactions-cr1-easy',
    engine: 'universal-template',
    gradeId: 'grade-10',
    unitId: 'chemical-reactions',
    order: 0,
    status: 'active'
  };

  const res2 = await db.collection('skills_v2').updateOne(
    { id: easySkill.id },
    { $set: easySkill },
    { upsert: true }
  );
  console.log(`  ✅ Seeded/Updated skill cr-g10-identify-reaction-easy: matched=1, upsertedId=null`);

  console.log('\nSeeding complete!');
  process.exit(0);
}

run().catch(console.error);
