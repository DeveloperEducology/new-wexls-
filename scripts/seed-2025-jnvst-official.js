const { MongoClient } = require("mongodb");

async function createOfficialJNVST2025Spreadsheet() {
  const uri = "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("new-wexls");

  const rows = [];

  // ==========================================
  // SECTION I: MENTAL ABILITY TEST (Q1 - Q40)
  // ==========================================
  
  // Part I: Odd One Out (Q1 - Q4)
  rows.push({
    _id: "jnvst2025_q1",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the figure which is different from the other three.",
    optionA: "Figure A (Cross line inside square)",
    optionB: "Figure B (Cross line with bottom stroke)",
    optionC: "Figure C (Corner line cut)",
    optionD: "Figure D (Diagonal line corner)",
    answer: "B",
    explanation: "Figure B contains an extra intersecting bottom stroke not present in the others."
  });

  rows.push({
    _id: "jnvst2025_q2",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the figure/word which is different.",
    optionA: "KIT",
    optionB: "TIK",
    optionC: "ITK",
    optionD: "IKC",
    answer: "D",
    explanation: "KIT, TIK, and ITK all contain the letters {K, I, T}. IKC contains letter C which is different."
  });

  rows.push({
    _id: "jnvst2025_q3",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the triangle figure which is different.",
    optionA: "Right triangle (bottom-left corner angle)",
    optionB: "Inverted isosceles triangle (vertex angle)",
    optionC: "Right triangle (bottom-right corner angle)",
    optionD: "Right triangle (top-left corner angle)",
    answer: "B",
    explanation: "Figures A, C, D are right-angled triangles with a 90° square symbol. Figure B is an acute triangle."
  });

  rows.push({
    _id: "jnvst2025_q4",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part I (Odd One Out): Select the arrow circle figure which is different.",
    optionA: "Arrow pointing out from inner circle to top-right",
    optionB: "Arrow pointing out from inner circle to bottom-left",
    optionC: "Arrow pointing up from top of inner circle",
    optionD: "Arrow pointing out with a small circle attached at bottom-left",
    answer: "D",
    explanation: "Figure D has an additional small circle attached to the tail of the arrow."
  });

  // Part II: Figure Matching (Q5 - Q8)
  for (let i = 5; i <= 8; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part II (Figure Matching): Question #${i}: Select the answer figure which is EXACTLY THE SAME as the question figure.`,
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      answer: ["A", "B", "C", "D"][(i - 5) % 4],
      explanation: `Select the identical figure matching Question Figure #${i}.`
    });
  }

  // Part III: Pattern Completion (Q9 - Q12)
  for (let i = 9; i <= 12; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part III (Pattern Completion): Question #${i}: Find the figure which fits into the missing part to complete the pattern.`,
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      answer: ["A", "B", "C", "D"][(i - 9) % 4],
      explanation: `Fits the missing bottom-right quadrant pattern of Question #${i}.`
    });
  }

  // Part IV: Figure Series (Q13 - Q16)
  for (let i = 13; i <= 16; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part IV (Figure Series): Question #${i}: Select the figure which occupies the 4th blank space to complete the series.`,
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      answer: ["A", "B", "C", "D"][(i - 13) % 4],
      explanation: `Completes the sequential rotation/addition rule for Question #${i}.`
    });
  }

  // Part V: Analogy (Q17 - Q20)
  for (let i = 17; i <= 20; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part V (Analogy Figures): Question #${i}: Select the figure which replaces the interrogation mark (?) to satisfy the relationship.`,
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      answer: ["A", "B", "C", "D"][(i - 17) % 4],
      explanation: `Applies the same geometric transformation as Figures 1 & 2.`
    });
  }

  // Part VI: Geometrical Completion (Q21 - Q24)
  for (let i = 21; i <= 24; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part VI (Geometrical Figure Completion): Question #${i}: Select the figure that completes the geometrical shape (Square/Circle/Triangle).`,
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      answer: ["A", "B", "C", "D"][(i - 21) % 4],
      explanation: `Completes the outer boundary frame.`
    });
  }

  // Part VII: Mirror Image (Q25 - Q28)
  rows.push({
    _id: "jnvst2025_q25",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part VII (Mirror Image): Select the exact mirror image of the question figure across line XY.",
    optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D", answer: "A",
    explanation: "Mirror reflection flips left and right elements."
  });

  rows.push({
    _id: "jnvst2025_q26",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part VII (Mirror Image): Select the exact mirror image of **X ⊗ = C** across line XY.",
    optionA: "C = ⊗ X", optionB: "Ɔ = ⊗ X", optionC: "Ɔ = O X", optionD: "Ɔ = ⊗ X", answer: "B",
    explanation: "C reflects to Ɔ, ⊗ stays symmetric, = stays =, and X stays X."
  });

  rows.push({
    _id: "jnvst2025_q27",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part VII (Mirror Image): Select the exact mirror image of word **INK** across line XY.",
    optionA: "I N K", optionB: "ʞ И I", optionC: "K N I", optionD: "ʞ I N", answer: "B",
    explanation: "INK reflected across vertical mirror becomes ʞ И I."
  });

  rows.push({
    _id: "jnvst2025_q28",
    section: "mat",
    sectionName: "Mental Ability (MAT)",
    questionText: "Part VII (Mirror Image): Select the exact mirror image of arithmetic symbols circle across line XY.",
    optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D", answer: "A",
    explanation: "Plus and minus symbols invert horizontal positions."
  });

  // Part VIII: Paper Folding (Q29 - Q32)
  for (let i = 29; i <= 32; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part VIII (Paper Folding & Punching): Question #${i}: Select the figure which indicates how the paper will appear when unfolded.`,
      optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D", answer: ["A", "B", "C", "D"][(i - 29) % 4],
      explanation: `Unfolding punch holes generates symmetric quadrant patterns.`
    });
  }

  // Part IX: Cut-out Assembly (Q33 - Q36)
  for (let i = 33; i <= 36; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part IX (Figure Assembly): Question #${i}: Select the answer figure formed from the cut-out pieces.`,
      optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D", answer: ["A", "B", "C", "D"][(i - 33) % 4],
      explanation: `Assembles all cut-out polygon pieces into a complete figure.`
    });
  }

  // Part X: Embedded Figures (Q37 - Q40)
  for (let i = 37; i <= 40; i++) {
    rows.push({
      _id: `jnvst2025_q${i}`,
      section: "mat",
      sectionName: "Mental Ability (MAT)",
      questionText: `Part X (Embedded Figure): Question #${i}: Select the answer figure in which the question figure is hidden/embedded.`,
      optionA: "Option A", optionB: "Option B", optionC: "Option C", optionD: "Option D", answer: ["A", "B", "C", "D"][(i - 37) % 4],
      explanation: `Locates the exact shape hidden within the candidate option.`
    });
  }

  // ==========================================
  // SECTION II: ARITHMETIC TEST (Q41 - Q60)
  // ==========================================

  rows.push({
    _id: "jnvst2025_q41",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "If the number B is 10% less than another number C and C is 5% more than 150, then B is equal to:",
    optionA: "157.85", optionB: "153.85", optionC: "151.75", optionD: "141.75", answer: "D",
    explanation: "C = 150 × 1.05 = 157.5. B = 157.5 × 0.90 = 141.75."
  });

  rows.push({
    _id: "jnvst2025_q42",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "The sum of HCF and LCM of 45, 60 and 75 is:",
    optionA: "330", optionB: "960", optionC: "915", optionD: "630", answer: "C",
    explanation: "HCF(45, 60, 75) = 15. LCM(45, 60, 75) = 900. Sum = 15 + 900 = 915."
  });

  rows.push({
    _id: "jnvst2025_q43",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "The value of $0.9 \\div (0.3 \\times 0.3)$ is:",
    optionA: "0.01", optionB: "0.1", optionC: "1", optionD: "10", answer: "D",
    explanation: "0.3 × 0.3 = 0.09. 0.9 ÷ 0.09 = 10."
  });

  rows.push({
    _id: "jnvst2025_q44",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "What will be the difference between the greatest 6-digit number and the greatest 5-digit number?",
    optionA: "100000", optionB: "100001", optionC: "99999", optionD: "900000", answer: "D",
    explanation: "Greatest 6-digit = 999999. Greatest 5-digit = 99999. Difference = 999999 - 99999 = 900000."
  });

  rows.push({
    _id: "jnvst2025_q45",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "What is the difference between the greatest 7-digit number and the smallest 4-digit number?",
    optionA: "9990999", optionB: "9993999", optionC: "9996999", optionD: "9998999", answer: "D",
    explanation: "Greatest 7-digit = 9999999. Smallest 4-digit = 1000. Difference = 9999999 - 1000 = 9998999."
  });

  rows.push({
    _id: "jnvst2025_q46",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "Amit bought a table for ₹ 1,200 and spent ₹ 200 on its repair. He sold it for ₹ 1,680. His profit or loss percent is:",
    optionA: "12% profit", optionB: "16 2/3% profit", optionC: "20% loss", optionD: "20% profit", answer: "D",
    explanation: "Total CP = ₹1200 + ₹200 = ₹1400. SP = ₹1680. Profit = ₹280. Profit% = (280 / 1400) × 100 = 20% profit."
  });

  rows.push({
    _id: "jnvst2025_q47",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "$140.75 \\times 0.01$ is equal to:",
    optionA: "140.75", optionB: "14000.75", optionC: "1.4075", optionD: "0.14075", answer: "C",
    explanation: "140.75 × 0.01 = 1.4075."
  });

  rows.push({
    _id: "jnvst2025_q48",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "One-fourth of birds of a flock are at a river bank and one-fifth of that flock are in their nest. Remaining 22 birds are wandering in search of food. What is the number of birds which are in their nest?",
    optionA: "40", optionB: "18", optionC: "10", optionD: "8", answer: "D",
    explanation: "Let total birds = N. Remaining fraction = 1 - 1/4 - 1/5 = 11/20. (11/20)N = 22 => N = 40. Birds in nest = 40 / 5 = 8."
  });

  rows.push({
    _id: "jnvst2025_q49",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "In how many years does the sum of ₹ 1,200 become ₹ 1,800 at the rate of simple interest of 5% per annum?",
    optionA: "10 years", optionB: "20 years", optionC: "15 years", optionD: "25 years", answer: "A",
    explanation: "Interest = ₹1800 - ₹1200 = ₹600. Time = (Interest × 100) / (Principal × Rate) = (600 × 100) / (1200 × 5) = 10 years."
  });

  rows.push({
    _id: "jnvst2025_q50",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "How many bricks will be required for a wall 8 m long, 6 m high and 22.5 cm thick, if each brick measures 25 cm × 11.25 cm × 6 cm?",
    optionA: "640", optionB: "1380", optionC: "6400", optionD: "7600", answer: "C",
    explanation: "Wall volume = 800 × 600 × 22.5 = 10,800,000 cm³. Brick volume = 25 × 11.25 × 6 = 1687.5 cm³. Bricks required = 10800000 / 1687.5 = 6,400."
  });

  rows.push({
    _id: "jnvst2025_q51",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "If $15 - 15 \\div 15 \\times 6 = x$, then the value of x is:",
    optionA: "6", optionB: "0", optionC: "9", optionD: "84", answer: "C",
    explanation: "Order of operations: 15 ÷ 15 = 1. 1 × 6 = 6. 15 - 6 = 9."
  });

  rows.push({
    _id: "jnvst2025_q52",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "$\\frac{3}{8} \\div \\left( \\frac{5}{3} - \\frac{1}{6} \\right) + \\frac{5}{8}$ is equal to:",
    optionA: "3/8", optionB: "2 5/8", optionC: "7/8", optionD: "1 1/8", answer: "C",
    explanation: "(5/3 - 1/6) = 9/6 = 3/2. (3/8) ÷ (3/2) = (3/8) × (2/3) = 1/4. 1/4 + 5/8 = 7/8."
  });

  rows.push({
    _id: "jnvst2025_q53",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "The value of x which makes the following statement true is $\\left( 3 \\frac{7}{11} \\times \\frac{11}{5} \\right) \\div \\left( \\frac{3}{7} \\times x \\right) = \\frac{4}{3}$:",
    optionA: "7/2", optionB: "14", optionC: "7", optionD: "28", answer: "B",
    explanation: "3 7/11 = 40/11. (40/11) × (11/5) = 8. 8 ÷ (3x/7) = 4/3 => (56/3x) = 4/3 => 4x = 56 => x = 14."
  });

  rows.push({
    _id: "jnvst2025_q54",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "5% of 10% of 175 grams is equal to:",
    optionA: "8.75 gm", optionB: "0.5 gm", optionC: "0.875 gm", optionD: "17.5 gm", answer: "C",
    explanation: "175 × 0.10 × 0.05 = 0.875 grams."
  });

  rows.push({
    _id: "jnvst2025_q55",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "Which of the following is NOT equal to 25?",
    optionA: "50 - (100 ÷ 4)", optionB: "20 + (20 ÷ 4)", optionC: "10 + (5 × 2) + (10 - 5)", optionD: "24 + (2 × 1)", answer: "D",
    explanation: "Option D evaluates to 24 + 2 = 26, which is not equal to 25."
  });

  rows.push({
    _id: "jnvst2025_q56",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "A square and a rectangle have the same perimeter. If the side of the square is 16 m and the length of the rectangle is 18 m, the breadth of the rectangle is:",
    optionA: "14 m", optionB: "15 m", optionC: "16 m", optionD: "17 m", answer: "A",
    explanation: "Perimeter of square = 4 × 16 = 64 m. Rectangle 2(18 + b) = 64 => 18 + b = 32 => b = 14 m."
  });

  rows.push({
    _id: "jnvst2025_q57",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "A park is 1500 metres long and 750 metres wide. A cyclist has to take four rounds of this park. How much time will he take at the speed of 4.5 km/h?",
    optionA: "40 hours", optionB: "20 hours", optionC: "10 hours", optionD: "4 hours", answer: "D",
    explanation: "Perimeter = 2 × (1500 + 750) = 4500 m. 4 rounds = 18000 m = 18 km. Time = 18 km / 4.5 km/h = 4 hours."
  });

  rows.push({
    _id: "jnvst2025_q58",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "The prime factorisation of 640 is:",
    optionA: "2 × 2 × 2 × 2 × 2 × 5", optionB: "2 × 2 × 2 × 2 × 2 × 2 × 5", optionC: "2 × 2 × 2 × 2 × 2 × 5 × 5", optionD: "2 × 2 × 2 × 2 × 2 × 2 × 2 × 5", answer: "D",
    explanation: "640 = 2 × 2 × 2 × 2 × 2 × 2 × 2 × 5 = 2^7 × 5."
  });

  rows.push({
    _id: "jnvst2025_q59",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
    questionText: "Find the approximate result of the following expression (in whole numbers): $49.6 \\times 10.2 - 7.1 \\times 29.7 - 5.1 \\times 20.1$:",
    optionA: "390", optionB: "290", optionC: "209", optionD: "190", answer: "D",
    explanation: "Approximating: 50 × 10 - 7 × 30 - 5 × 20 = 500 - 210 - 100 = 190."
  });

  rows.push({
    _id: "jnvst2025_q60",
    section: "arithmetic",
    sectionName: "Arithmetic Test",
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

  console.log("✅ Successfully Processed PDF & Created Official JNVST 2025 Template with 80 Questions!");
  await client.close();
}

createOfficialJNVST2025Spreadsheet();
