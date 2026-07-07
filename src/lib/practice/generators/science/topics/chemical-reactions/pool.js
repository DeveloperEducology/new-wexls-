/**
 * Adaptive Question Pool – Chemical Reactions & Equations (Grade 10 Science)
 *
 * Difficulty tiers:
 *   easy   → basic recall / identification
 *   medium → application / classification
 *   hard   → balancing / multi-step reasoning / real-life analysis
 *
 * adaptiveRules.incorrect.targetSkillId  → fallback skill when wrong
 * adaptiveRules.masteryAchieved.target   → next skill to unlock when mastered
 */

export const CHEMICAL_REACTIONS_POOL = {

  /* ─────────────────────────── EASY ─────────────────────────── */
  easy: [
    {
      id: 'cr_e1',
      type: 'mcq',
      questionText: 'Iron getting rusted when left in moist air is an example of a ___.',
      options: [
        { id: 'a', label: 'Physical change', value: 'physical' },
        { id: 'b', label: 'Chemical change', value: 'chemical', isCorrect: true },
        { id: 'c', label: 'No change at all', value: 'none' },
        { id: 'd', label: 'Reversible change', value: 'reversible' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'Rusting of iron is a chemical change because a new substance — iron oxide (rust) — is formed. This cannot be reversed easily.' },
          { type: 'text', content: '🔑 Clue: If a NEW substance is formed and the change is hard to reverse → Chemical change.' },
        ],
      },
      metadata: { difficulty: 'easy', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-identify-reaction' },
    },
    {
      id: 'cr_e2',
      type: 'mcq',
      questionText: 'When magnesium ribbon is burned, a white powder is formed. This white powder is called ___.',
      options: [
        { id: 'a', label: 'Magnesium sulphate', value: 'sulphate' },
        { id: 'b', label: 'Magnesium oxide', value: 'oxide', isCorrect: true },
        { id: 'c', label: 'Magnesium carbonate', value: 'carbonate' },
        { id: 'd', label: 'Magnesium chloride', value: 'chloride' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'When magnesium (Mg) burns in oxygen (O₂), it combines to form magnesium oxide (MgO) — a white powder.' },
          { type: 'text', content: '2Mg + O₂ → 2MgO' },
        ],
      },
      metadata: { difficulty: 'easy', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-identify-reaction' },
    },
    {
      id: 'cr_e3',
      type: 'mcq',
      questionText: 'In a chemical equation, the substances written on the LEFT side of the arrow are called ___.',
      options: [
        { id: 'a', label: 'Products', value: 'products' },
        { id: 'b', label: 'Reactants', value: 'reactants', isCorrect: true },
        { id: 'c', label: 'Catalysts', value: 'catalysts' },
        { id: 'd', label: 'Precipitates', value: 'precipitates' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'Reactants → Products' },
          { type: 'text', content: 'The substances that react (go IN) are called Reactants (LHS). The new substances formed (come OUT) are called Products (RHS).' },
        ],
      },
      metadata: { difficulty: 'easy', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-identify-reaction' },
    },
    {
      id: 'cr_e4',
      type: 'mcq',
      questionText: 'Which of these is a sign that a chemical reaction has taken place?',
      options: [
        { id: 'a', label: 'Ice melting into water', value: 'melt' },
        { id: 'b', label: 'Sugar dissolving in tea', value: 'dissolve' },
        { id: 'c', label: 'Gas bubbles released when zinc is added to acid', value: 'gas', isCorrect: true },
        { id: 'd', label: 'Glass breaking into pieces', value: 'break' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Signs of a chemical reaction include: change of colour, change of state, evolution of gas, change in temperature.' },
          { type: 'text', content: 'When zinc is added to acid, hydrogen gas bubbles are released — a clear sign of a chemical reaction.' },
        ],
      },
      metadata: { difficulty: 'easy', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-identify-reaction' },
    },
    {
      id: 'cr_e5',
      type: 'mcq',
      questionText: 'What does the symbol (aq) mean in a chemical equation?',
      options: [
        { id: 'a', label: 'Aqueous solution (dissolved in water)', value: 'aq', isCorrect: true },
        { id: 'b', label: 'Gas form', value: 'gas' },
        { id: 'c', label: 'Solid form', value: 'solid' },
        { id: 'd', label: 'Liquid form', value: 'liquid' },
      ],
      answer: 0,
      correctAnswerIndex: 0,
      solution: {
        sections: [
          { type: 'text', content: 'State symbols used in chemical equations:' },
          { type: 'text', content: '(s) = solid | (l) = liquid | (g) = gas | (aq) = dissolved in water (aqueous solution)' },
        ],
      },
      metadata: { difficulty: 'easy', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-identify-reaction' },
    },
    {
      id: 'cr_e6',
      type: 'mcq',
      questionText: 'Which reaction produces a gas when zinc pieces are added to sulphuric acid?',
      options: [
        { id: 'a', label: 'Oxygen gas', value: 'oxygen' },
        { id: 'b', label: 'Carbon dioxide gas', value: 'co2' },
        { id: 'c', label: 'Hydrogen gas', value: 'h2', isCorrect: true },
        { id: 'd', label: 'Nitrogen gas', value: 'n2' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Zn + H₂SO₄ → ZnSO₄ + H₂↑' },
          { type: 'text', content: 'Zinc reacts with sulphuric acid to produce zinc sulphate and hydrogen gas (H₂). The bubbles you see are hydrogen gas.' },
        ],
      },
      metadata: { difficulty: 'easy', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-identify-reaction' },
    },
  ],

  /* ────────────────────────── MEDIUM ─────────────────────────── */
  medium: [
    {
      id: 'cr_m1',
      type: 'mcq',
      questionText: 'CaO + H₂O → Ca(OH)₂ + Heat. What type of reaction is this?',
      options: [
        { id: 'a', label: 'Decomposition reaction', value: 'decomp' },
        { id: 'b', label: 'Combination (synthesis) reaction', value: 'combo', isCorrect: true },
        { id: 'c', label: 'Displacement reaction', value: 'disp' },
        { id: 'd', label: 'Double displacement reaction', value: 'double' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'In a Combination Reaction, two or more reactants combine to form ONE product.' },
          { type: 'text', content: 'CaO + H₂O → Ca(OH)₂: Calcium oxide + water → calcium hydroxide. Two reactants, one product = Combination Reaction.' },
          { type: 'text', content: '💡 Memory trick: "Combo" = things coming TOGETHER.' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
    {
      id: 'cr_m2',
      type: 'mcq',
      questionText: '2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂. What type of reaction is this?',
      options: [
        { id: 'a', label: 'Combination reaction', value: 'combo' },
        { id: 'b', label: 'Decomposition reaction', value: 'decomp', isCorrect: true },
        { id: 'c', label: 'Double displacement', value: 'double' },
        { id: 'd', label: 'Oxidation reaction', value: 'oxid' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'In a Decomposition Reaction, ONE reactant breaks down into two or more products.' },
          { type: 'text', content: 'Lead nitrate (1 reactant) breaks into PbO, NO₂, O₂ (3 products) on heating → Decomposition.' },
          { type: 'text', content: '💡 Visible sign: Brown fumes of NO₂ are released.' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
    {
      id: 'cr_m3',
      type: 'mcq',
      questionText: 'Fe + CuSO₄ → FeSO₄ + Cu. What kind of reaction is this?',
      options: [
        { id: 'a', label: 'Double displacement reaction', value: 'double' },
        { id: 'b', label: 'Single displacement reaction', value: 'single', isCorrect: true },
        { id: 'c', label: 'Combination reaction', value: 'combo' },
        { id: 'd', label: 'Decomposition reaction', value: 'decomp' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'In a Displacement Reaction, a more reactive element displaces a less reactive one from its compound.' },
          { type: 'text', content: 'Iron (Fe) is more reactive than Copper (Cu), so it displaces Cu from copper sulphate solution.' },
          { type: 'text', content: 'Visual clue: Blue solution of CuSO₄ turns pale green as FeSO₄ forms.' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
    {
      id: 'cr_m4',
      type: 'mcq',
      questionText: 'Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl. The ↓ symbol means ___.',
      options: [
        { id: 'a', label: 'A gas is produced', value: 'gas' },
        { id: 'b', label: 'The reaction needs heat', value: 'heat' },
        { id: 'c', label: 'A precipitate (solid) is formed', value: 'ppt', isCorrect: true },
        { id: 'd', label: 'The reaction is reversible', value: 'rev' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: '↓ = Precipitate: an insoluble solid that settles at the bottom of the solution.' },
          { type: 'text', content: '↑ = Gas being released.' },
          { type: 'text', content: 'BaSO₄ is the white precipitate formed in this double displacement reaction.' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
    {
      id: 'cr_m5',
      type: 'mcq',
      questionText: '2AgCl → 2Ag + Cl₂. This reaction is an example of decomposition by ___.',
      options: [
        { id: 'a', label: 'Heat', value: 'heat' },
        { id: 'b', label: 'Electricity', value: 'elec' },
        { id: 'c', label: 'Light', value: 'light', isCorrect: true },
        { id: 'd', label: 'Pressure', value: 'pressure' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Silver chloride (white) turns grey when exposed to sunlight — it decomposes using LIGHT energy (photodecomposition).' },
          { type: 'text', content: '📷 This is the principle behind black-and-white photography!' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
    {
      id: 'cr_m6',
      type: 'mcq',
      questionText: 'When CuO reacts with H₂, which substance gets OXIDISED?',
      options: [
        { id: 'a', label: 'CuO (copper oxide)', value: 'cuo' },
        { id: 'b', label: 'Cu (copper)', value: 'cu' },
        { id: 'c', label: 'H₂ (hydrogen)', value: 'h2', isCorrect: true },
        { id: 'd', label: 'H₂O (water)', value: 'h2o' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'CuO + H₂ → Cu + H₂O' },
          { type: 'text', content: 'OXIDATION = gaining oxygen (or losing hydrogen).' },
          { type: 'text', content: 'H₂ gains oxygen to form H₂O → H₂ is oxidised.' },
          { type: 'text', content: 'CuO loses oxygen → CuO is reduced. Both happen together → REDOX reaction.' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
    {
      id: 'cr_m7',
      type: 'mcq',
      questionText: 'Quick lime (CaO) is added to water. Which of these is TRUE about this reaction?',
      options: [
        { id: 'a', label: 'The reaction absorbs heat (endothermic)', value: 'endo' },
        { id: 'b', label: 'The reaction releases heat (exothermic)', value: 'exo', isCorrect: true },
        { id: 'c', label: 'No energy change occurs', value: 'none' },
        { id: 'd', label: 'Light energy is released', value: 'light' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'CaO + H₂O → Ca(OH)₂ + Heat' },
          { type: 'text', content: 'When water is added to quick lime, the beaker becomes VERY HOT — heat is RELEASED → Exothermic reaction.' },
          { type: 'text', content: '💡 EXOthermic = EXit of heat (heat goes OUT).' },
        ],
      },
      metadata: { difficulty: 'medium', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-classify-reaction' },
    },
  ],

  /* ─────────────────────────── HARD ──────────────────────────── */
  hard: [
    {
      id: 'cr_h1',
      type: 'mcq',
      questionText: 'Which balanced equation correctly represents the electrolysis of water?',
      options: [
        { id: 'a', label: 'H₂O → H₂ + O₂', value: 'a' },
        { id: 'b', label: '2H₂O → 2H₂ + O₂', value: 'b', isCorrect: true },
        { id: 'c', label: 'H₂O → 2H + O', value: 'c' },
        { id: 'd', label: '2H₂O → H₂ + 2O₂', value: 'd' },
      ],
      answer: 1,
      correctAnswerIndex: 1,
      solution: {
        sections: [
          { type: 'text', content: 'Step 1: Count atoms on both sides for each option.' },
          { type: 'text', content: 'Option B: 2H₂O → 2H₂ + O₂' },
          { type: 'text', content: 'Left: H=4, O=2 | Right: H=4, O=2 ✅ Balanced!' },
          { type: 'text', content: '⚡ Note: Electrolysis uses electricity to break water into H₂ and O₂. Volume of H₂ is DOUBLE that of O₂.' },
        ],
      },
      metadata: { difficulty: 'hard', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-balance-equation' },
    },
    {
      id: 'cr_h2',
      type: 'mcq',
      questionText: 'In the reaction: _Fe + 4H₂O → Fe₃O₄ + 4H₂, what is the coefficient before Fe?',
      options: [
        { id: 'a', label: '1', value: '1' },
        { id: 'b', label: '2', value: '2' },
        { id: 'c', label: '3', value: '3', isCorrect: true },
        { id: 'd', label: '4', value: '4' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Balance step by step:' },
          { type: 'text', content: '1. Fe₃O₄ has 3 Fe atoms on right → need 3 Fe on left.' },
          { type: 'text', content: '2. O: 4H₂O gives 4 O → Fe₃O₄ has 4 O ✅' },
          { type: 'text', content: '3. H: 4H₂O gives 8 H → 4H₂ gives 8 H ✅' },
          { type: 'text', content: 'Balanced: 3Fe + 4H₂O → Fe₃O₄ + 4H₂' },
        ],
      },
      metadata: { difficulty: 'hard', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-balance-equation' },
    },
    {
      id: 'cr_h3',
      type: 'mcq',
      questionText: 'Potato chips are packed in nitrogen gas instead of air. Which is the BEST reason for this?',
      options: [
        { id: 'a', label: 'Nitrogen makes chips crispier by absorbing moisture', value: 'a' },
        { id: 'b', label: 'Nitrogen is heavier than air so chips do not float', value: 'b' },
        { id: 'c', label: 'Nitrogen prevents oxidation of oils, stopping rancidity', value: 'c', isCorrect: true },
        { id: 'd', label: 'Nitrogen adds flavour to chips', value: 'd' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Fats and oils in chips react with oxygen (O₂) in air → oxidation → rancidity (bad smell & taste).' },
          { type: 'text', content: 'N₂ is an inert gas (does not react). Filling packets with N₂ removes O₂, preventing oxidation → chips stay fresh longer.' },
          { type: 'text', content: '🔬 This is the principle of antioxidant packaging.' },
        ],
      },
      metadata: { difficulty: 'hard', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-balance-equation' },
    },
    {
      id: 'cr_h4',
      type: 'mcq',
      questionText: 'Which of the following reactions will NOT occur? (Reactivity: Zn > Fe > Cu)',
      options: [
        { id: 'a', label: 'Zn + CuSO₄ → ZnSO₄ + Cu', value: 'a' },
        { id: 'b', label: 'Fe + CuSO₄ → FeSO₄ + Cu', value: 'b' },
        { id: 'c', label: 'Cu + FeSO₄ → CuSO₄ + Fe', value: 'c', isCorrect: true },
        { id: 'd', label: 'Fe + ZnSO₄ → No reaction', value: 'd' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Rule: A MORE reactive metal can displace a LESS reactive metal from its salt solution.' },
          { type: 'text', content: 'Reactivity order: Zn > Fe > Cu' },
          { type: 'text', content: 'Option C: Cu + FeSO₄ → Cu is LESS reactive than Fe, so Cu CANNOT displace Fe. This reaction does NOT occur.' },
          { type: 'text', content: '(Option D is also true as a no-reaction, but C is the direct answer to the given choices.)' },
        ],
      },
      metadata: { difficulty: 'hard', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-balance-equation' },
    },
    {
      id: 'cr_h5',
      type: 'mcq',
      questionText: '2Pb(NO₃)₂ → 2PbO + _NO₂ + O₂. What is the missing coefficient for NO₂?',
      options: [
        { id: 'a', label: '2', value: '2' },
        { id: 'b', label: '3', value: '3' },
        { id: 'c', label: '4', value: '4', isCorrect: true },
        { id: 'd', label: '6', value: '6' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: 'Count Nitrogen (N): Left has 2Pb(NO₃)₂ → 2×2 = 4 N atoms.' },
          { type: 'text', content: 'Right: PbO has no N. So all 4 N must come from NO₂ → coefficient = 4.' },
          { type: 'text', content: 'Check Oxygen: Left = 2×6=12 O. Right = 2×1 (PbO) + 4×2 (NO₂) + 1×2 (O₂) = 2+8+2 = 12 ✅' },
        ],
      },
      metadata: { difficulty: 'hard', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-balance-equation' },
    },
    {
      id: 'cr_h6',
      type: 'mcq',
      questionText: 'Ferrous sulphate crystals are green. On heating, the residue turns reddish-brown. Which product causes this colour?',
      options: [
        { id: 'a', label: 'SO₂', value: 'so2' },
        { id: 'b', label: 'SO₃', value: 'so3' },
        { id: 'c', label: 'Fe₂O₃', value: 'fe2o3', isCorrect: true },
        { id: 'd', label: 'FeS', value: 'fes' },
      ],
      answer: 2,
      correctAnswerIndex: 2,
      solution: {
        sections: [
          { type: 'text', content: '2FeSO₄ → Fe₂O₃ + SO₂ + SO₃' },
          { type: 'text', content: 'Green FeSO₄ crystals decompose on heating. Fe₂O₃ (iron(III) oxide) is the reddish-brown residue.' },
          { type: 'text', content: '🔬 SO₂ and SO₃ are pungent gases released. The colour change from green→reddish-brown confirms the decomposition.' },
        ],
      },
      metadata: { difficulty: 'hard', subject: 'science', topic: 'chemical-reactions', skillId: 'cr-g10-balance-equation' },
    },
  ],
};

/**
 * Adaptive progression map:
 *   wrong answer  → fall back to easier pool
 *   correct answer → stay in current pool (engine handles promotion to next difficulty)
 */
export const ADAPTIVE_FALLBACK_MAP = {
  hard:   'medium',
  medium: 'easy',
  easy:   'easy',  // already at easiest – stay here
};

export const ADAPTIVE_PROMOTE_MAP = {
  easy:   'medium',
  medium: 'hard',
  hard:   null, // mastered!
};
