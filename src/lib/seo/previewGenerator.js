import { generateFromTemplates } from '../exam/question-store.js';

/**
 * Resolves friendly SEO topic slug to candidate template IDs.
 * E.g. 'template-fraction-visual-id' -> ['template-fraction-visual-id', 'template.fraction.visual.id']
 */
export function resolveSeoTopicToTemplateIds(topicSlug) {
  if (!topicSlug) return [];
  const list = [topicSlug];
  const dotted = topicSlug.replace(/-/g, '.');
  if (dotted !== topicSlug) {
    list.push(dotted);
  }
  return list;
}

/**
 * Generates exactly 3 questions for a specific SEO template drill.
 * @param {string} examId
 * @param {string} subject
 * @param {string} topicSlug
 * @param {Array|null} dbFallbackQuestions - custom fallback questions from the SEO Manager DB (overrides code defaults)
 */
export async function getSeoPreviewQuestions(examId, subject, topicSlug, dbFallbackQuestions = null) {
  // Force-fallback to DB or code fallback questions, bypassing template generation
  const rawQuestions = dbFallbackQuestions?.length ? dbFallbackQuestions : getTopicFallbackQuestions(topicSlug);

  return rawQuestions.map((q, idx) => {
    const questionMode = q.questionMode || q.type || 'mcq';
    const explanationText = q.explanationText || q.explanation || '';
    const qText = q.questionText || '';
    const parts = q.parts?.length ? q.parts : [{ type: 'text', content: qText }];

    return {
      ...q,
      id: q.id || q._id || `fallback_${topicSlug}_${idx}_${Date.now()}`,
      questionMode,
      explanationText,
      parts,
    };
  });
}


/**
 * Returns topic-appropriate fallback questions when DB generation fails.
 * Detects topic group from the slug keywords.
 */
function getTopicFallbackQuestions(topicSlug) {
  const slug = String(topicSlug || '').toLowerCase();

  // ── Time, Distance & Speed ───────────────────────────────────────────
  if (slug.includes('time-distance') || slug.includes('speed') || slug.includes('distance')) {
    if (slug.includes('dist-calc') || slug.includes('distance')) {
      return [
        {
          id: 'fallback_td_1', questionMode: 'mcq',
          questionText: 'A car travels at 60 km/h for 3 hours. What distance does it cover?',
          options: { A: '180 km', B: '160 km', C: '200 km', D: '240 km' },
          correctOption: 'A',
          explanationText: 'Distance = Speed × Time = 60 × 3 = 180 km.',
          parts: [{ type: 'text', content: 'A car travels at 60 km/h for 3 hours. What distance does it cover?' }]
        },
        {
          id: 'fallback_td_2', questionMode: 'mcq',
          questionText: 'A train moves at 90 km/h for 2 hours. What is the distance travelled?',
          options: { A: '180 km', B: '45 km', C: '270 km', D: '150 km' },
          correctOption: 'A',
          explanationText: 'Distance = Speed × Time = 90 × 2 = 180 km.',
          parts: [{ type: 'text', content: 'A train moves at 90 km/h for 2 hours. What is the distance travelled?' }]
        },
        {
          id: 'fallback_td_3', questionMode: 'mcq',
          questionText: 'A cyclist rides at 15 km/h for 4 hours. How far does she go?',
          options: { A: '45 km', B: '60 km', C: '75 km', D: '30 km' },
          correctOption: 'B',
          explanationText: 'Distance = Speed × Time = 15 × 4 = 60 km.',
          parts: [{ type: 'text', content: 'A cyclist rides at 15 km/h for 4 hours. How far does she go?' }]
        }
      ];
    }
    if (slug.includes('speed-calc') || slug.includes('speed')) {
      return [
        {
          id: 'fallback_sp_1', questionMode: 'mcq',
          questionText: 'A bus covers 240 km in 4 hours. What is its speed?',
          options: { A: '60 km/h', B: '40 km/h', C: '80 km/h', D: '50 km/h' },
          correctOption: 'A',
          explanationText: 'Speed = Distance ÷ Time = 240 ÷ 4 = 60 km/h.',
          parts: [{ type: 'text', content: 'A bus covers 240 km in 4 hours. What is its speed?' }]
        },
        {
          id: 'fallback_sp_2', questionMode: 'mcq',
          questionText: 'A runner completes 10 km in 2 hours. What is her speed?',
          options: { A: '4 km/h', B: '5 km/h', C: '8 km/h', D: '6 km/h' },
          correctOption: 'B',
          explanationText: 'Speed = Distance ÷ Time = 10 ÷ 2 = 5 km/h.',
          parts: [{ type: 'text', content: 'A runner completes 10 km in 2 hours. What is her speed?' }]
        },
        {
          id: 'fallback_sp_3', questionMode: 'mcq',
          questionText: 'A train travels 360 km in 3 hours. Find its speed.',
          options: { A: '100 km/h', B: '120 km/h', C: '90 km/h', D: '110 km/h' },
          correctOption: 'B',
          explanationText: 'Speed = Distance ÷ Time = 360 ÷ 3 = 120 km/h.',
          parts: [{ type: 'text', content: 'A train travels 360 km in 3 hours. Find its speed.' }]
        }
      ];
    }
    if (slug.includes('time-calc')) {
      return [
        {
          id: 'fallback_tc_1', questionMode: 'mcq',
          questionText: 'A car travels 150 km at 50 km/h. How long does the journey take?',
          options: { A: '2 hours', B: '3 hours', C: '4 hours', D: '5 hours' },
          correctOption: 'B',
          explanationText: 'Time = Distance ÷ Speed = 150 ÷ 50 = 3 hours.',
          parts: [{ type: 'text', content: 'A car travels 150 km at 50 km/h. How long does the journey take?' }]
        },
        {
          id: 'fallback_tc_2', questionMode: 'mcq',
          questionText: 'A train covers 420 km at 70 km/h. What is the travel time?',
          options: { A: '4 hours', B: '5 hours', C: '6 hours', D: '7 hours' },
          correctOption: 'C',
          explanationText: 'Time = Distance ÷ Speed = 420 ÷ 70 = 6 hours.',
          parts: [{ type: 'text', content: 'A train covers 420 km at 70 km/h. What is the travel time?' }]
        },
        {
          id: 'fallback_tc_3', questionMode: 'mcq',
          questionText: 'A cyclist travels 90 km at 30 km/h. How many hours does she take?',
          options: { A: '2 hours', B: '4 hours', C: '3 hours', D: '5 hours' },
          correctOption: 'C',
          explanationText: 'Time = Distance ÷ Speed = 90 ÷ 30 = 3 hours.',
          parts: [{ type: 'text', content: 'A cyclist travels 90 km at 30 km/h. How many hours does she take?' }]
        }
      ];
    }
    // Generic km/h ↔ m/s conversion fallback
    return [
      {
        id: 'fallback_tdg_1', questionMode: 'mcq',
        questionText: 'Convert 72 km/h into m/s.',
        options: { A: '18 m/s', B: '20 m/s', C: '25 m/s', D: '15 m/s' },
        correctOption: 'B',
        explanationText: 'To convert km/h to m/s, divide by 3.6. 72 ÷ 3.6 = 20 m/s.',
        parts: [{ type: 'text', content: 'Convert 72 km/h into m/s.' }]
      },
      {
        id: 'fallback_tdg_2', questionMode: 'mcq',
        questionText: 'Convert 15 m/s into km/h.',
        options: { A: '54 km/h', B: '60 km/h', C: '45 km/h', D: '48 km/h' },
        correctOption: 'A',
        explanationText: 'To convert m/s to km/h, multiply by 3.6. 15 × 3.6 = 54 km/h.',
        parts: [{ type: 'text', content: 'Convert 15 m/s into km/h.' }]
      },
      {
        id: 'fallback_tdg_3', questionMode: 'mcq',
        questionText: 'A car goes 200 km in 4 hours. What is its average speed?',
        options: { A: '40 km/h', B: '50 km/h', C: '60 km/h', D: '55 km/h' },
        correctOption: 'B',
        explanationText: 'Speed = Distance ÷ Time = 200 ÷ 4 = 50 km/h.',
        parts: [{ type: 'text', content: 'A car goes 200 km in 4 hours. What is its average speed?' }]
      }
    ];
  }

  // ── Percentages ──────────────────────────────────────────────────────
  if (slug.includes('percent')) {
    return [
      {
        id: 'fallback_pct_1', questionMode: 'mcq',
        questionText: 'What is 25% of 200?',
        options: { A: '40', B: '50', C: '60', D: '25' },
        correctOption: 'B',
        explanationText: '25% of 200 = (25/100) × 200 = 50.',
        parts: [{ type: 'text', content: 'What is 25% of 200?' }]
      },
      {
        id: 'fallback_pct_2', questionMode: 'mcq',
        questionText: 'Express 3/5 as a percentage.',
        options: { A: '55%', B: '65%', C: '60%', D: '70%' },
        correctOption: 'C',
        explanationText: '3/5 = 0.6 = 60%.',
        parts: [{ type: 'text', content: 'Express 3/5 as a percentage.' }]
      },
      {
        id: 'fallback_pct_3', questionMode: 'mcq',
        questionText: 'A shirt costs ₹500. After a 20% discount, what is the sale price?',
        options: { A: '₹350', B: '₹400', C: '₹450', D: '₹380' },
        correctOption: 'B',
        explanationText: 'Discount = 20% of 500 = 100. Sale price = 500 − 100 = ₹400.',
        parts: [{ type: 'text', content: 'A shirt costs ₹500. After a 20% discount, what is the sale price?' }]
      }
    ];
  }

  // ── Simple Interest ───────────────────────────────────────────────────
  if (slug.includes('interest')) {
    return [
      {
        id: 'fallback_si_1', questionMode: 'mcq',
        questionText: 'Find the simple interest on ₹1000 at 5% per year for 3 years.',
        options: { A: '₹100', B: '₹150', C: '₹200', D: '₹250' },
        correctOption: 'B',
        explanationText: 'SI = (P × R × T) / 100 = (1000 × 5 × 3) / 100 = ₹150.',
        parts: [{ type: 'text', content: 'Find the simple interest on ₹1000 at 5% per year for 3 years.' }]
      },
      {
        id: 'fallback_si_2', questionMode: 'mcq',
        questionText: 'What is the simple interest on ₹2000 at 4% per year for 2 years?',
        options: { A: '₹160', B: '₹200', C: '₹120', D: '₹80' },
        correctOption: 'A',
        explanationText: 'SI = (2000 × 4 × 2) / 100 = ₹160.',
        parts: [{ type: 'text', content: 'What is the simple interest on ₹2000 at 4% per year for 2 years?' }]
      },
      {
        id: 'fallback_si_3', questionMode: 'mcq',
        questionText: 'Find the amount after 1 year if principal is ₹500 at 10% per year.',
        options: { A: '₹500', B: '₹550', C: '₹600', D: '₹450' },
        correctOption: 'B',
        explanationText: 'SI = (500 × 10 × 1) / 100 = ₹50. Amount = 500 + 50 = ₹550.',
        parts: [{ type: 'text', content: 'Find the amount after 1 year if principal is ₹500 at 10% per year.' }]
      }
    ];
  }

  // ── Ratios ────────────────────────────────────────────────────────────
  if (slug.includes('ratio')) {
    return [
      {
        id: 'fallback_rt_1', questionMode: 'mcq',
        questionText: 'Simplify the ratio 24 : 36.',
        options: { A: '3 : 4', B: '2 : 3', C: '4 : 6', D: '6 : 9' },
        correctOption: 'B',
        explanationText: 'GCD of 24 and 36 is 12. 24 ÷ 12 = 2, 36 ÷ 12 = 3. Simplified ratio = 2 : 3.',
        parts: [{ type: 'text', content: 'Simplify the ratio 24 : 36.' }]
      },
      {
        id: 'fallback_rt_2', questionMode: 'mcq',
        questionText: 'Find the missing number: 3 : 5 = 12 : ?',
        options: { A: '15', B: '18', C: '20', D: '25' },
        correctOption: 'C',
        explanationText: '3 × 4 = 12, so 5 × 4 = 20. The missing number is 20.',
        parts: [{ type: 'text', content: 'Find the missing number: 3 : 5 = 12 : ?' }]
      },
      {
        id: 'fallback_rt_3', questionMode: 'mcq',
        questionText: 'A and B share ₹300 in the ratio 2 : 3. How much does A get?',
        options: { A: '₹100', B: '₹120', C: '₹150', D: '₹180' },
        correctOption: 'B',
        explanationText: 'Total parts = 5. A gets 2/5 × 300 = ₹120.',
        parts: [{ type: 'text', content: 'A and B share ₹300 in the ratio 2 : 3. How much does A get?' }]
      }
    ];
  }

  // ── LCM & HCF ─────────────────────────────────────────────────────────
  if (slug.includes('lcm') || slug.includes('hcf')) {
    return [
      {
        id: 'fallback_lcm_1', questionMode: 'mcq',
        questionText: 'Find the LCM of 12 and 18.',
        options: { A: '24', B: '36', C: '48', D: '72' },
        correctOption: 'B',
        explanationText: 'LCM(12, 18) = 36. (12 = 2²×3, 18 = 2×3², LCM = 2²×3² = 36)',
        parts: [{ type: 'text', content: 'Find the LCM of 12 and 18.' }]
      },
      {
        id: 'fallback_lcm_2', questionMode: 'mcq',
        questionText: 'Find the HCF of 24 and 36.',
        options: { A: '6', B: '8', C: '12', D: '18' },
        correctOption: 'C',
        explanationText: 'HCF(24, 36) = 12.',
        parts: [{ type: 'text', content: 'Find the HCF of 24 and 36.' }]
      },
      {
        id: 'fallback_lcm_3', questionMode: 'mcq',
        questionText: 'What is the LCM of 6, 8, and 12?',
        options: { A: '24', B: '48', C: '96', D: '72' },
        correctOption: 'A',
        explanationText: 'LCM(6, 8, 12) = 24.',
        parts: [{ type: 'text', content: 'What is the LCM of 6, 8, and 12?' }]
      }
    ];
  }

  // ── Mensuration ───────────────────────────────────────────────────────
  if (slug.includes('mensuration') || slug.includes('area') || slug.includes('perimeter')) {
    return [
      {
        id: 'fallback_men_1', questionMode: 'mcq',
        questionText: 'Find the area of a rectangle with length 8 cm and breadth 5 cm.',
        options: { A: '30 cm²', B: '40 cm²', C: '26 cm²', D: '45 cm²' },
        correctOption: 'B',
        explanationText: 'Area = Length × Breadth = 8 × 5 = 40 cm².',
        parts: [{ type: 'text', content: 'Find the area of a rectangle with length 8 cm and breadth 5 cm.' }]
      },
      {
        id: 'fallback_men_2', questionMode: 'mcq',
        questionText: 'Find the perimeter of a square with side 7 cm.',
        options: { A: '14 cm', B: '21 cm', C: '28 cm', D: '49 cm' },
        correctOption: 'C',
        explanationText: 'Perimeter = 4 × side = 4 × 7 = 28 cm.',
        parts: [{ type: 'text', content: 'Find the perimeter of a square with side 7 cm.' }]
      },
      {
        id: 'fallback_men_3', questionMode: 'mcq',
        questionText: 'Find the area of a triangle with base 10 cm and height 6 cm.',
        options: { A: '30 cm²', B: '60 cm²', C: '16 cm²', D: '20 cm²' },
        correctOption: 'A',
        explanationText: 'Area = ½ × base × height = ½ × 10 × 6 = 30 cm².',
        parts: [{ type: 'text', content: 'Find the area of a triangle with base 10 cm and height 6 cm.' }]
      }
    ];
  }

  // ── Fractions (default / explicit) ───────────────────────────────────
  return [
    {
      id: 'fallback_1', questionMode: 'mcq',
      questionText: 'Simplify the fraction: 4/8',
      options: { A: '1/2', B: '1/4', C: '2/3', D: '3/4' },
      correctOption: 'A',
      explanationText: 'To simplify 4/8, divide both numerator and denominator by their GCD (4). Answer: 1/2.',
      parts: [{ type: 'text', content: 'Simplify the fraction: 4/8' }]
    },
    {
      id: 'fallback_2', questionMode: 'mcq',
      questionText: 'Which fraction is equivalent to 1/3?',
      options: { A: '2/6', B: '2/5', C: '3/6', D: '1/4' },
      correctOption: 'A',
      explanationText: 'Multiplying both numerator and denominator of 1/3 by 2 gives 2/6.',
      parts: [{ type: 'text', content: 'Which fraction is equivalent to 1/3?' }]
    },
    {
      id: 'fallback_3', questionMode: 'mcq',
      questionText: 'Add the fractions: 1/5 + 2/5',
      options: { A: '3/5', B: '3/10', C: '4/5', D: '1/5' },
      correctOption: 'A',
      explanationText: 'Since denominators are equal, add numerators: 1+2=3. Answer: 3/5.',
      parts: [{ type: 'text', content: 'Add the fractions: 1/5 + 2/5' }]
    }
  ];
}
