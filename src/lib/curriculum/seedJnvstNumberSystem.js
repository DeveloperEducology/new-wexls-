/**
 * JNVST Arithmetic — NUMBER AND NUMERIC SYSTEM
 * Seed script: Q7–Q24 from JNV past papers (2004–2018)
 * Each template has 3 parameterized rows (index pool = [0,1,2])
 *
 * Usage:
 *   import { seedJnvstNumberSystem } from './seedJnvstNumberSystem';
 *   await seedJnvstNumberSystem();
 *
 * Or call the seed API: GET /api/admin/seed?set=jnvst-number-system
 */

const BASE = {
  type: 'parameterized',
  generatorType: 'spreadsheet-grid',
  examId: 'jnvst',
  section: 'arithmetic',
  topic: 'NUMBER AND NUMERIC SYSTEM',
  difficulty: 0.5,
  status: 'active',
};

export const JNVST_NUMBER_SYSTEM_TEMPLATES = [
  // ── Q7 [JNV 2018] ─── Prime number in which range of tens ────────────────
  {
    ...BASE,
    id: 'jnvst-num-q7-prime-in-range',
    name: 'Prime Number in Range of Tens',
    config: {
      questionTemplate: 'In which of the following pairs of numbers does only one prime number lie?',
      variables: { index: [0, 1, 2] },
      derivations: {
        range_a: '["40 and 50","60 and 70","80 and 90"][index]',
        range_b: '["60 and 70","80 and 90","40 and 50"][index]',
        range_c: '["80 and 90","40 and 50","60 and 70"][index]',
        Result:  '["90 and 100","90 and 100","90 and 100"][index]',
      },
      options: [
        { label: '[range_a]', isCorrect: false },
        { label: '[range_b]', isCorrect: false },
        { label: '[range_c]', isCorrect: false },
        { label: '[Result]',  isCorrect: true  },
      ],
      explanationTemplate:
        'Primes 40–50: 41, 43, 47 → **3 primes**\n' +
        'Primes 60–70: 61, 67 → **2 primes**\n' +
        'Primes 80–90: 83, 89 → **2 primes**\n' +
        'Primes 90–100: **97** → **1 prime** ✓\n\n' +
        'Answer: **[Result]**',
    },
  },

  // ── Q8 [JNV 2018] ─── Quotient in division ───────────────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q8-division-quotient',
    name: 'Division – Find the Quotient',
    config: {
      questionTemplate: 'What is the quotient when [dividend] is divided by [divisor]?',
      variables: { index: [0, 1, 2] },
      derivations: {
        dividend: '["76076","85085","91091"][index]',
        divisor:  '["13","13","13"][index]',
        Result:   '["5852","6545","7007"][index]',
        d1:       '["5652","6345","6907"][index]',
        d2:       '["5762","6445","7107"][index]',
        d3:       '["5662","6745","7077"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        '[dividend] ÷ [divisor] = **[Result]**\n\n' +
        'Verify: [divisor] × [Result] = [dividend] ✓',
    },
  },

  // ── Q9 [JNV 2016] ─── Which is the smallest number? ─────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q9-smallest-number',
    name: 'Identify the Smallest Number',
    config: {
      questionTemplate: 'Which one is the smallest number?',
      variables: { index: [0, 1, 2] },
      derivations: {
        a:      '["7413","3218","5104"][index]',
        b:      '["7985","3812","5410"][index]',
        c:      '["7545","3821","5140"][index]',
        Result: '["7130","3182","5014"][index]',
      },
      options: [
        { label: '[a]',      isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[b]',      isCorrect: false },
        { label: '[c]',      isCorrect: false },
      ],
      explanationTemplate:
        'Compare digits from the **leftmost** place:\n\n' +
        'Among [a], [b], [c], [Result] — the smallest is **[Result]**.',
    },
  },

  // ── Q10 [JNV 2016] ─── Difference: smallest n-digit – largest m-digit ────
  {
    ...BASE,
    id: 'jnvst-num-q10-diff-smallest-largest',
    name: 'Difference: Smallest N-digit vs Largest M-digit Number',
    config: {
      questionTemplate:
        'The difference between the smallest [n]-digit number and the largest [m]-digit number is',
      variables: { index: [0, 1, 2] },
      derivations: {
        n:      '["six","five","seven"][index]',
        m:      '["four","three","five"][index]',
        small:  '["100000","10000","1000000"][index]',
        large:  '["9999","999","99999"][index]',
        Result: '["90001","9001","900001"][index]',
        d1:     '["91000","9100","900100"][index]',
        d2:     '["90100","9010","901000"][index]',
        d3:     '["90010","9001","900010"][index]',
      },
      options: [
        { label: '[Result]', isCorrect: true  },
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'Smallest [n]-digit number = **[small]**\n' +
        'Largest  [m]-digit number = **[large]**\n\n' +
        'Difference = [small] − [large] = **[Result]**',
    },
  },

  // ── Q11 [JNV 2016] ─── True statement for two numbers ────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q11-true-statement-numbers',
    name: 'True Statement for Two Numbers (Common Multiple)',
    config: {
      questionTemplate:
        'Which one of the following is the correct statement for the numbers [num1] and [num2]?',
      variables: { index: [0, 1, 2] },
      derivations: {
        num1:   '["56","35","44"][index]',
        num2:   '["84","70","66"][index]',
        factor: '["14","35","11"][index]',
        Result: '["Both the numbers are multiple of 14","Both the numbers are multiple of 35","Both the numbers are multiple of 11"][index]',
        d1:     '["Both the numbers are prime","Both the numbers are prime","Both the numbers are prime"][index]',
        d2:     '["Both the numbers are co-prime","Both the numbers are co-prime","Both the numbers are co-prime"][index]',
        d3:     '["Both the numbers are odd","Both the numbers are odd","Both the numbers are odd"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        '[num1] ÷ [factor] = exact, [num2] ÷ [factor] = exact\n\n' +
        'Both **[num1]** and **[num2]** are divisible by **[factor]**.\n\n' +
        'Correct statement: **[Result]**',
    },
  },

  // ── Q12 [JNV 2015] ─── Greatest 5-digit number from given digits ──────────
  {
    ...BASE,
    id: 'jnvst-num-q12-greatest-5digit-from-digits',
    name: 'Greatest 5-digit Number from Given Digits',
    config: {
      questionTemplate:
        'The greatest five-digit number that can be formed using digits [digits] (each digit used once) is',
      variables: { index: [0, 1, 2] },
      derivations: {
        digits: '["7, 2, 4, 8 and 0","6, 3, 9, 1 and 0","5, 4, 7, 2 and 0"][index]',
        Result: '["87420","96310","75420"][index]',
        d1:     '["80742","90613","70542"][index]',
        d2:     '["87042","96130","75240"][index]',
        d3:     '["87402","96301","75402"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'Arrange digits **in descending order** to get the greatest number.\n\n' +
        'Digits: [digits]\n' +
        'Sorted descending → **[Result]** ✓',
    },
  },

  // ── Q13 [JNV 2015] ─── Co-prime statement ────────────────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q13-coprime-statement',
    name: 'True Statement: Co-prime Numbers',
    config: {
      questionTemplate: 'Which statement is true for [num1] and [num2]?',
      variables: { index: [0, 1, 2] },
      derivations: {
        num1:   '["11","8","14"][index]',
        num2:   '["21","15","25"][index]',
        Result: '["Both are co-prime numbers","Both are co-prime numbers","Both are co-prime numbers"][index]',
        d1:     '["Both are divisible numbers","Both are prime numbers","Both are prime numbers"][index]',
        d2:     '["Both are even numbers","Both are even numbers","Both are even numbers"][index]',
        d3:     '["Both are multiple of 3","Both are multiple of 3","Both are multiple of 5"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'HCF([num1], [num2]) = **1**.\n\n' +
        'Numbers with HCF = 1 are **co-prime** (also called relatively prime).\n\n' +
        '∴ **[Result]** ✓',
    },
  },

  // ── Q14 [JNV 2014] ─── Greatest 5-digit odd number from digits ────────────
  {
    ...BASE,
    id: 'jnvst-num-q14-greatest-5digit-odd',
    name: 'Greatest 5-digit Odd Number from Given Digits',
    config: {
      questionTemplate:
        'The greatest five-digit odd number that can be formed using digits [digits] is',
      variables: { index: [0, 1, 2] },
      derivations: {
        digits: '["3, 5, 7, 9 and 0","2, 4, 6, 8 and 1","1, 3, 5, 8 and 0"][index]',
        Result: '["97503","86421","85301"][index]',
        d1:     '["90573","82461","80513"][index]',
        d2:     '["97530","86412","85310"][index]',
        d3:     '["97053","86241","85031"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'Strategy: For the **greatest odd** number, place the **largest available odd digit** at the units place, then arrange the remaining digits in descending order.\n\n' +
        'Digits: [digits]\n' +
        '→ Units place: use largest odd digit\n' +
        '→ Remaining sorted descending\n\n' +
        'Greatest odd number = **[Result]** ✓',
    },
  },

  // ── Q15 [JNV 2013] ─── Highest two-digit prime number ────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q15-highest-2digit-prime',
    name: 'Highest Two-digit Prime Number',
    config: {
      questionTemplate: 'What is the highest [n]-digit prime number?',
      variables: { index: [0, 1, 2] },
      derivations: {
        n:      '["two","three","four"][index]',
        Result: '["97","997","9973"][index]',
        d1:     '["93","991","9971"][index]',
        d2:     '["91","993","9967"][index]',
        d3:     '["99","999","9999"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'Starting from the highest [n]-digit number downward:\n' +
        '- [d3]: divisible by 3/9 → not prime\n' +
        '- [d2]: composite → not prime\n' +
        '- [d1]: divisible by 3 → not prime\n' +
        '- **[Result]**: only factors are 1 and itself → **Prime** ✓\n\n' +
        'Highest [n]-digit prime = **[Result]**',
    },
  },

  // ── Q16 [JNV 2013] ─── Greatest 5-digit even number from digits ───────────
  {
    ...BASE,
    id: 'jnvst-num-q16-greatest-5digit-even',
    name: 'Greatest 5-digit Even Number from Given Digits',
    config: {
      questionTemplate:
        'Find the greatest five-digit even number using the digits [digits].',
      variables: { index: [0, 1, 2] },
      derivations: {
        digits: '["3, 0, 5, 7 and 8","1, 4, 6, 9 and 2","2, 0, 5, 8 and 6"][index]',
        Result: '["87530","96412","86520"][index]',
        d1:     '["83570","91642","82560"][index]',
        d2:     '["85703","96142","85620"][index]',
        d3:     '["87350","94612","86502"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'Strategy: For the **greatest even** number, place the **largest available even digit** at the units place, then arrange remaining digits descending.\n\n' +
        'Digits: [digits] → Greatest even = **[Result]** ✓',
    },
  },

  // ── Q17 [JNV 2012] ─── Greatest 5-digit number with one digit repeated ────
  {
    ...BASE,
    id: 'jnvst-num-q17-greatest-digit-repeated',
    name: 'Greatest 5-digit Number with One Digit Repeated Twice',
    config: {
      questionTemplate:
        'Find the greatest five-digit number using the digits [digits] (any one digit may be repeated twice).',
      variables: { index: [0, 1, 2] },
      derivations: {
        digits: '["9, 6, 3 and 0","8, 7, 4 and 1","9, 5, 2 and 0"][index]',
        Result: '["99630","88741","99520"][index]',
        d1:     '["96630","87741","95520"][index]',
        d2:     '["96300","87410","95200"][index]',
        d3:     '["90963","87014","90952"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'To maximise the value: **repeat the largest digit** to fill the leading positions, then place remaining digits descending.\n\n' +
        'Digits: [digits] → Repeat largest → **[Result]** ✓',
    },
  },

  // ── Q18 [JNV 2011] ─── Difference between place values of repeated digit ──
  {
    ...BASE,
    id: 'jnvst-num-q18-place-value-diff-repeated',
    name: 'Difference Between Place Values of a Repeated Digit',
    config: {
      questionTemplate:
        'The difference between the place values of the two [digit]s in [number] is',
      variables: { index: [0, 1, 2] },
      derivations: {
        number: '["27307","53358","46464"][index]',
        digit:  '["7","3","4"][index]',
        pv_big: '["7000","3000","4000"][index]',
        pv_sml: '["7","3","4"][index]',
        Result: '["6993","2997","3996"][index]',
        d1:     '["7300","3300","4400"][index]',
        d2:     '["307","350","464"][index]',
        d3:     '["40","30","60"][index]',
      },
      options: [
        { label: '[Result]', isCorrect: true  },
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'In **[number]**, the digit **[digit]** appears at:\n' +
        '- Thousands place → place value = **[pv_big]**\n' +
        '- Units place → place value = **[pv_sml]**\n\n' +
        'Difference = [pv_big] − [pv_sml] = **[Result]** ✓',
    },
  },

  // ── Q19 [JNV 2011] ─── Identify the prime number ─────────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q19-identify-prime',
    name: 'Identify the Prime Number from Options',
    config: {
      questionTemplate: 'Which one of the following is a prime number?',
      variables: { index: [0, 1, 2] },
      derivations: {
        Result: '["83","107","131"][index]',
        d1:     '["81","105","133"][index]',
        d2:     '["85","111","135"][index]',
        d3:     '["87","117","143"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        '- [d1] is divisible by 3 → **not prime**\n' +
        '- [d2] is divisible by 5 → **not prime**\n' +
        '- [d3] is divisible by 3 → **not prime**\n' +
        '- **[Result]** has no divisors other than 1 and itself → **Prime** ✓',
    },
  },

  // ── Q20 [JNV 2011] ─── Words to number form ──────────────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q20-words-to-number',
    name: 'Words to Number Form (Up to Hundred-Thousands)',
    config: {
      questionTemplate: '[words] is represented in number form as',
      variables: { index: [0, 1, 2] },
      derivations: {
        words:  '["Eighty thousand nine hundred and five","Sixty-two thousand four hundred and seven","Ninety-five thousand three hundred and twelve"][index]',
        Result: '["80905","62407","95312"][index]',
        d1:     '["8095","6247","9532"][index]',
        d2:     '["809005","624007","953012"][index]',
        d3:     '["8009005","6240007","9053012"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        '**[words]**\n\n' +
        'Place value breakdown:\n' +
        '- Tens of thousands + ones of thousands + hundreds + ones\n\n' +
        '= **[Result]** ✓',
    },
  },

  // ── Q21 [JNV 2010] ─── Lakh number words to digit form ───────────────────
  {
    ...BASE,
    id: 'jnvst-num-q21-lakh-words-to-digit',
    name: 'Lakh Number — Words to Digit Form',
    config: {
      questionTemplate: '[words] may be written in digits as',
      variables: { index: [0, 1, 2] },
      derivations: {
        words:  '["Sixteen lakh eight hundred and thirteen","Twenty-four lakh five hundred and twenty","Thirty-one lakh seven hundred and four"][index]',
        Result: '["1600813","2400520","3100704"][index]',
        d1:     '["16813","24520","31704"][index]',
        d2:     '["160830","240052","310074"][index]',
        d3:     '["160813","240520","310704"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
      ],
      explanationTemplate:
        '**[words]**\n\n' +
        '1 lakh = 1,00,000\n' +
        'Indian system: XX lakh = XX,00,000\n\n' +
        '= **[Result]** ✓',
    },
  },

  // ── Q22 [JNV 2010] ─── Place value of digit in decimal ───────────────────
  {
    ...BASE,
    id: 'jnvst-num-q22-place-value-decimal',
    name: 'Place Value of a Digit in a Decimal Number',
    config: {
      questionTemplate: 'The place value of [digit] in [number] is',
      variables: { index: [0, 1, 2] },
      derivations: {
        number: '["214.56","38.427","91.085"][index]',
        digit:  '["5","4","8"][index]',
        Result: '["5 × 0.1","4 × 0.01","8 × 0.01"][index]',
        d1:     '["5 × 1","4 × 1","8 × 1"][index]',
        d2:     '["5 × 10","4 × 10","8 × 10"][index]',
        d3:     '["5 × 0.01","4 × 0.001","8 × 0.001"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        'In **[number]**, identify the position of **[digit]**:\n\n' +
        '- 1st decimal place = tenths (× 0.1)\n' +
        '- 2nd decimal place = hundredths (× 0.01)\n\n' +
        'Place value of [digit] = **[Result]** ✓',
    },
  },

  // ── Q23 [JNV 2008] ─── Prime even number ─────────────────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q23-prime-even-number',
    name: 'Find the Prime Even Number',
    config: {
      questionTemplate: 'Find a prime even number out of the following numbers.',
      variables: { index: [0, 1, 2] },
      derivations: {
        Result: '["2","2","2"][index]',
        d1:     '["4","6","8"][index]',
        d2:     '["6","4","10"][index]',
        d3:     '["13","11","7"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
        { label: '[d3]',     isCorrect: false },
      ],
      explanationTemplate:
        '**2** is the only even prime number.\n\n' +
        '- [d1]: even but divisible by 2 and [d1] itself → **not prime**\n' +
        '- [d3]: prime but **odd**, not even\n' +
        '- **2** = divisible only by 1 and 2 → **prime ✓ and even ✓**',
    },
  },

  // ── Q24 [JNV 2004, 1994] ─── Find the dividend ───────────────────────────
  {
    ...BASE,
    id: 'jnvst-num-q24-find-dividend',
    name: 'Find the Dividend (Divisor × Quotient + Remainder)',
    config: {
      questionTemplate:
        'In a division problem, the divisor is [divisor], the quotient is [quotient], and the remainder is [remainder]. What is the dividend?',
      variables: { index: [0, 1, 2] },
      derivations: {
        divisor:   '["51","43","67"][index]',
        quotient:  '["16","24","15"][index]',
        remainder: '["27","35","42"][index]',
        mul:       '["816","1032","1005"][index]',
        Result:    '["843","1067","1047"][index]',
        d1:        '["483","1025","1035"][index]',
        d2:        '["94","62","82"][index]',
        d3:        '["1393","1075","1055"][index]',
      },
      options: [
        { label: '[d1]',     isCorrect: false },
        { label: '[d2]',     isCorrect: false },
        { label: '[d3]',     isCorrect: false },
        { label: '[Result]', isCorrect: true  },
      ],
      explanationTemplate:
        '**Formula:** Dividend = (Divisor × Quotient) + Remainder\n\n' +
        '= ([divisor] × [quotient]) + [remainder]\n' +
        '= [mul] + [remainder]\n' +
        '= **[Result]** ✓',
    },
  },
];

// ── Seed function ─────────────────────────────────────────────────────────────
export async function seedJnvstNumberSystem() {
  const { getMongoDb } = await import('../db/mongo.js');
  const db = await getMongoDb();
  if (!db) throw new Error('No DB connection');

  const results = [];
  for (const t of JNVST_NUMBER_SYSTEM_TEMPLATES) {
    const setDoc = {
      id: t.id,
      name: t.name,
      type: t.type,
      generatorType: t.generatorType,
      examId: t.examId,
      section: t.section,
      topic: t.topic,
      difficulty: t.difficulty,
      status: t.status,
      config: t.config,
      updatedAt: new Date(),
    };
    try {
      await db.collection('templates').updateOne(
        { id: t.id },
        {
          $set: setDoc,
          $setOnInsert: { createdAt: new Date(), generatedCount: 0 },
        },
        { upsert: true }
      );
      await db.collection('dynamic_templates').updateOne(
        { id: t.id },
        {
          $set: setDoc,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      results.push({ id: t.id, status: 'ok' });
      console.log(`✓  ${t.id}`);
    } catch (err) {
      results.push({ id: t.id, status: 'error', error: err.message });
      console.error(`✗  ${t.id}:`, err.message);
    }
  }
  return results;
}

