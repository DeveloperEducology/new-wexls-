import { NextResponse } from 'next/server';
import { createSeoTopic, getSeoTopicBySlug } from '@/lib/seo/seoTopicsStore';

const SEED_TOPICS = [
  // ── Fractions & Ratios ────────────────────────────────────────────────
  {
    slug: 'template-ratios-simplification',
    examName: 'jnvst', subject: 'math',
    displayName: 'Simplify Ratios',
    description: 'Practice simplifying ratios to their lowest terms by dividing both parts by their GCD. A key skill for JNVST Class 6 Arithmetic.',
    relatedTopics: [
      { slug: 'template-ratios-equivalence',    label: 'Equivalent Ratios' },
      { slug: 'template-fraction-classify',     label: 'Classify Fractions' },
      { slug: 'template-fraction-like-addition',label: 'Add Like Fractions' },
    ],
    fallbackQuestions: [
      { questionText: 'Simplify the ratio 24 : 36.', options: { A: '2 : 3', B: '3 : 4', C: '4 : 6', D: '6 : 9' }, correctOption: 'A', explanationText: 'GCD of 24 and 36 is 12. 24 ÷ 12 = 2, 36 ÷ 12 = 3. Simplified ratio = 2 : 3.' },
      { questionText: 'Simplify the ratio 18 : 27.', options: { A: '2 : 3', B: '3 : 4', C: '6 : 9', D: '9 : 18' }, correctOption: 'A', explanationText: 'GCD of 18 and 27 is 9. 18 ÷ 9 = 2, 27 ÷ 9 = 3. Simplified ratio = 2 : 3.' },
      { questionText: 'Simplify the ratio 35 : 56.', options: { A: '5 : 7', B: '5 : 8', C: '7 : 8', D: '7 : 9' }, correctOption: 'B', explanationText: 'GCD of 35 and 56 is 7. 35 ÷ 7 = 5, 56 ÷ 7 = 8. Simplified ratio = 5 : 8.' },
    ],
    published: true,
  },
  {
    slug: 'template-ratios-equivalence',
    examName: 'jnvst', subject: 'math',
    displayName: 'Equivalent Ratios',
    description: 'Find and verify equivalent ratios by multiplying or dividing both terms by the same number. Essential for JNVST Class 6 Arithmetic.',
    relatedTopics: [
      { slug: 'template-ratios-simplification',  label: 'Simplify Ratios' },
      { slug: 'template-fraction-classify',      label: 'Classify Fractions' },
    ],
    fallbackQuestions: [
      { questionText: 'Find the missing number: 3 : 5 = 12 : ?', options: { A: '15', B: '18', C: '20', D: '25' }, correctOption: 'C', explanationText: '3 × 4 = 12, so 5 × 4 = 20. The missing number is 20.' },
      { questionText: 'Which ratio is equivalent to 2 : 5?', options: { A: '4 : 10', B: '4 : 8', C: '6 : 12', D: '3 : 8' }, correctOption: 'A', explanationText: 'Multiply both terms of 2 : 5 by 2 → 4 : 10.' },
      { questionText: 'Find the missing number: 4 : 9 = ? : 27', options: { A: '10', B: '12', C: '14', D: '16' }, correctOption: 'B', explanationText: '9 × 3 = 27, so 4 × 3 = 12. The missing number is 12.' },
    ],
    published: true,
  },
  {
    slug: 'template-fraction-classify',
    examName: 'jnvst', subject: 'math',
    displayName: 'Classify Fractions (Proper, Improper, Mixed)',
    description: 'Learn to identify and classify fractions as proper, improper, or mixed numbers. A foundational JNVST Class 6 Math skill.',
    relatedTopics: [
      { slug: 'template-fraction-like-addition', label: 'Add Like Fractions' },
      { slug: 'template-ratios-equivalence',     label: 'Equivalent Ratios' },
      { slug: 'template-ratios-simplification',  label: 'Simplify Ratios' },
    ],
    fallbackQuestions: [
      { questionText: 'Which of the following is an improper fraction?', options: { A: '3/7', B: '5/5', C: '7/4', D: '1/9' }, correctOption: 'C', explanationText: 'An improper fraction has a numerator greater than or equal to its denominator. 7/4 has numerator 7 > denominator 4.' },
      { questionText: 'Convert 2¾ into an improper fraction.', options: { A: '9/4', B: '11/4', C: '8/4', D: '10/4' }, correctOption: 'B', explanationText: '2¾ = (2 × 4 + 3)/4 = 11/4.' },
      { questionText: 'Which fraction is a proper fraction?', options: { A: '9/4', B: '5/5', C: '3/8', D: '7/3' }, correctOption: 'C', explanationText: 'A proper fraction has numerator < denominator. 3/8 satisfies this.' },
    ],
    published: true,
  },
  {
    slug: 'template-fraction-like-addition',
    examName: 'jnvst', subject: 'math',
    displayName: 'Add Like Fractions',
    description: 'Practice adding fractions with the same denominator. The simplest form of fraction addition — a core JNVST Class 6 Arithmetic skill.',
    relatedTopics: [
      { slug: 'template-fraction-classify',      label: 'Classify Fractions' },
      { slug: 'template-ratios-simplification',  label: 'Simplify Ratios' },
    ],
    fallbackQuestions: [
      { questionText: 'Add: 1/5 + 2/5', options: { A: '3/5', B: '3/10', C: '2/5', D: '4/5' }, correctOption: 'A', explanationText: 'Same denominator → add numerators: 1 + 2 = 3. Answer: 3/5.' },
      { questionText: 'Add: 3/8 + 4/8', options: { A: '6/8', B: '7/16', C: '7/8', D: '1/8' }, correctOption: 'C', explanationText: '3 + 4 = 7. Answer: 7/8.' },
      { questionText: 'Add: 2/9 + 5/9', options: { A: '6/9', B: '7/9', C: '7/18', D: '8/9' }, correctOption: 'B', explanationText: '2 + 5 = 7. Answer: 7/9.' },
    ],
    published: true,
  },

  // ── Time, Distance & Speed ────────────────────────────────────────────
  {
    slug: 'template-time-distance-speed-calc',
    examName: 'jnvst', subject: 'math',
    displayName: 'Calculate Speed from Distance & Time',
    description: 'Practice finding speed using the formula Speed = Distance ÷ Time. A key JNVST Class 6 Arithmetic topic.',
    relatedTopics: [
      { slug: 'template-time-distance-dist-calc',  label: 'Calculate Distance' },
      { slug: 'template-time-distance-kmh-to-ms',  label: 'Convert km/h ↔ m/s' },
    ],
    fallbackQuestions: [
      { questionText: 'A bus covers 240 km in 4 hours. What is its speed?', options: { A: '60 km/h', B: '40 km/h', C: '80 km/h', D: '50 km/h' }, correctOption: 'A', explanationText: 'Speed = Distance ÷ Time = 240 ÷ 4 = 60 km/h.' },
      { questionText: 'A runner completes 10 km in 2 hours. What is her speed?', options: { A: '4 km/h', B: '5 km/h', C: '8 km/h', D: '6 km/h' }, correctOption: 'B', explanationText: 'Speed = 10 ÷ 2 = 5 km/h.' },
      { questionText: 'A train travels 360 km in 3 hours. Find its speed.', options: { A: '100 km/h', B: '90 km/h', C: '120 km/h', D: '110 km/h' }, correctOption: 'C', explanationText: 'Speed = 360 ÷ 3 = 120 km/h.' },
    ],
    published: true,
  },
  {
    slug: 'template-time-distance-dist-calc',
    examName: 'jnvst', subject: 'math',
    displayName: 'Calculate Distance from Speed & Time',
    description: 'Practice finding distance using the formula Distance = Speed × Time. A key JNVST Class 6 Arithmetic topic.',
    relatedTopics: [
      { slug: 'template-time-distance-speed-calc', label: 'Calculate Speed' },
      { slug: 'template-time-distance-kmh-to-ms',  label: 'Convert km/h ↔ m/s' },
    ],
    fallbackQuestions: [
      { questionText: 'A car travels at 60 km/h for 3 hours. What distance does it cover?', options: { A: '180 km', B: '160 km', C: '200 km', D: '240 km' }, correctOption: 'A', explanationText: 'Distance = Speed × Time = 60 × 3 = 180 km.' },
      { questionText: 'A train moves at 90 km/h for 2 hours. What is the distance travelled?', options: { A: '180 km', B: '45 km', C: '270 km', D: '150 km' }, correctOption: 'A', explanationText: 'Distance = 90 × 2 = 180 km.' },
      { questionText: 'A cyclist rides at 15 km/h for 4 hours. How far does she go?', options: { A: '45 km', B: '60 km', C: '75 km', D: '30 km' }, correctOption: 'B', explanationText: 'Distance = 15 × 4 = 60 km.' },
    ],
    published: true,
  },
  {
    slug: 'template-time-distance-kmh-to-ms',
    examName: 'jnvst', subject: 'math',
    displayName: 'Convert km/h to m/s',
    description: 'Practice converting speed between km/h and m/s using the factor 3.6. A useful skill for JNVST Class 6 Arithmetic.',
    relatedTopics: [
      { slug: 'template-time-distance-speed-calc', label: 'Calculate Speed' },
      { slug: 'template-time-distance-dist-calc',  label: 'Calculate Distance' },
    ],
    fallbackQuestions: [
      { questionText: 'Convert 72 km/h into m/s.', options: { A: '18 m/s', B: '20 m/s', C: '25 m/s', D: '15 m/s' }, correctOption: 'B', explanationText: 'Divide by 3.6: 72 ÷ 3.6 = 20 m/s.' },
      { questionText: 'Convert 15 m/s into km/h.', options: { A: '54 km/h', B: '60 km/h', C: '45 km/h', D: '48 km/h' }, correctOption: 'A', explanationText: 'Multiply by 3.6: 15 × 3.6 = 54 km/h.' },
      { questionText: 'Convert 108 km/h into m/s.', options: { A: '25 m/s', B: '30 m/s', C: '36 m/s', D: '20 m/s' }, correctOption: 'B', explanationText: '108 ÷ 3.6 = 30 m/s.' },
    ],
    published: true,
  },

  // ── Percentages & Interest ────────────────────────────────────────────
  {
    slug: 'template-percentage-fraction-to-percent',
    examName: 'jnvst', subject: 'math',
    displayName: 'Convert Fractions to Percentages',
    description: 'Practice converting fractions to percentages by multiplying by 100. A core JNVST Class 6 Arithmetic skill.',
    relatedTopics: [
      { slug: 'template-percentage-change',        label: '% Increase & Decrease' },
      { slug: 'template-simple-interest-calc',     label: 'Simple Interest' },
    ],
    fallbackQuestions: [
      { questionText: 'Express 3/5 as a percentage.', options: { A: '55%', B: '65%', C: '60%', D: '70%' }, correctOption: 'C', explanationText: '3/5 × 100 = 60%.' },
      { questionText: 'Convert 7/20 to a percentage.', options: { A: '30%', B: '35%', C: '25%', D: '40%' }, correctOption: 'B', explanationText: '7/20 × 100 = 35%.' },
      { questionText: 'Express 1/4 as a percentage.', options: { A: '20%', B: '30%', C: '25%', D: '40%' }, correctOption: 'C', explanationText: '1/4 × 100 = 25%.' },
    ],
    published: true,
  },
  {
    slug: 'template-percentage-change',
    examName: 'jnvst', subject: 'math',
    displayName: 'Percentage Increase & Decrease',
    description: 'Practice calculating percentage increase and decrease in real-life scenarios like discounts and price changes. Key for JNVST Class 6.',
    relatedTopics: [
      { slug: 'template-percentage-fraction-to-percent', label: 'Fractions to %' },
      { slug: 'template-simple-interest-calc',           label: 'Simple Interest' },
    ],
    fallbackQuestions: [
      { questionText: 'A shirt costs ₹500. After a 20% discount, what is the sale price?', options: { A: '₹350', B: '₹400', C: '₹450', D: '₹380' }, correctOption: 'B', explanationText: 'Discount = 20% of 500 = ₹100. Sale price = 500 − 100 = ₹400.' },
      { questionText: 'A price increased from ₹200 to ₹250. What is the percentage increase?', options: { A: '20%', B: '25%', C: '30%', D: '50%' }, correctOption: 'B', explanationText: 'Increase = 50. % increase = (50/200) × 100 = 25%.' },
      { questionText: 'What is 15% of 300?', options: { A: '40', B: '45', C: '50', D: '60' }, correctOption: 'B', explanationText: '15% of 300 = (15/100) × 300 = 45.' },
    ],
    published: true,
  },
  {
    slug: 'template-simple-interest-calc',
    examName: 'jnvst', subject: 'math',
    displayName: 'Calculate Simple Interest',
    description: 'Practice computing Simple Interest using SI = (P × R × T) ÷ 100. A standard JNVST Class 6 Arithmetic topic.',
    relatedTopics: [
      { slug: 'template-percentage-change',              label: '% Increase & Decrease' },
      { slug: 'template-percentage-fraction-to-percent', label: 'Fractions to %' },
    ],
    fallbackQuestions: [
      { questionText: 'Find the simple interest on ₹1000 at 5% per year for 3 years.', options: { A: '₹100', B: '₹150', C: '₹200', D: '₹250' }, correctOption: 'B', explanationText: 'SI = (1000 × 5 × 3) / 100 = ₹150.' },
      { questionText: 'Find SI on ₹2000 at 4% per year for 2 years.', options: { A: '₹160', B: '₹200', C: '₹120', D: '₹80' }, correctOption: 'A', explanationText: 'SI = (2000 × 4 × 2) / 100 = ₹160.' },
      { questionText: 'Find the amount after 1 year if principal is ₹500 at 10% p.a.', options: { A: '₹500', B: '₹550', C: '₹600', D: '₹450' }, correctOption: 'B', explanationText: 'SI = (500 × 10 × 1) / 100 = ₹50. Amount = 500 + 50 = ₹550.' },
    ],
    published: true,
  },

  // ── LCM & HCF ─────────────────────────────────────────────────────────
  {
    slug: 'template-lcm-hcf-lcm-basic',
    examName: 'jnvst', subject: 'math',
    displayName: 'Find the LCM of Numbers',
    description: 'Practice finding the Lowest Common Multiple (LCM) of two or three numbers. A foundational JNVST Class 6 Arithmetic topic.',
    relatedTopics: [
      { slug: 'template-ratios-simplification', label: 'Simplify Ratios' },
      { slug: 'template-fraction-classify',     label: 'Classify Fractions' },
    ],
    fallbackQuestions: [
      { questionText: 'Find the LCM of 12 and 18.', options: { A: '24', B: '36', C: '48', D: '72' }, correctOption: 'B', explanationText: 'LCM(12, 18) = 36. (12 = 2²×3, 18 = 2×3², LCM = 2²×3² = 36)' },
      { questionText: 'Find the LCM of 6, 8, and 12.', options: { A: '24', B: '48', C: '96', D: '72' }, correctOption: 'A', explanationText: 'LCM(6, 8, 12) = 24.' },
      { questionText: 'Find the LCM of 4 and 9.', options: { A: '18', B: '27', C: '36', D: '45' }, correctOption: 'C', explanationText: '4 = 2², 9 = 3². LCM = 2² × 3² = 36.' },
    ],
    published: true,
  },
  {
    slug: 'template-associative-property-math',
    examName: 'jnvst', subject: 'math',
    displayName: 'The Associative Property',
    description: 'Learn the associative property of addition and multiplication to group numbers and simplify calculations. A core arithmetic skill for JNVST Class 6 Math.',
    relatedTopics: [
      { slug: 'template-ratios-simplification', label: 'Simplify Ratios' },
      { slug: 'template-fraction-classify',     label: 'Classify Fractions' },
    ],
    fallbackQuestions: [
      { questionText: 'Which equation shows the associative property of addition?', options: { A: '(4 + 3) + 7 = 4 + (3 + 7)', B: '4 + 3 = 3 + 4', C: '4 + 0 = 4', D: '(4 + 3) + 7 = 7 + (4 + 3)' }, correctOption: 'A', explanationText: 'The associative property of addition shows that grouping addends differently does not change their sum: (a + b) + c = a + (b + c).' },
      { questionText: 'Which equation shows the associative property of multiplication?', options: { A: '5 × 2 = 2 × 5', B: '(2 × 3) × 4 = 2 × (3 × 4)', C: '5 × 1 = 5', D: '2 × (3 + 4) = 2 × 3 + 2 × 4' }, correctOption: 'B', explanationText: 'The associative property of multiplication shows that grouping factors differently does not change their product: (a × b) × c = a × (b × c).' },
      { questionText: 'Simplify using the associative property: 3 × (5 × 8)', options: { A: '40', B: '120', C: '240', D: '15' }, correctOption: 'B', explanationText: 'By grouping 5 × 8 first, we get 3 × 40 = 120, which is easier to calculate mentally.' },
    ],
    published: true,
  },
];

/** POST /api/admin/seo-topics/seed — seed all 11 topics (skips existing ones) */
export async function POST() {
  const results = { created: [], skipped: [], errors: [] };

  for (const topic of SEED_TOPICS) {
    try {
      const existing = await getSeoTopicBySlug(topic.slug, topic.examName);
      if (existing) {
        results.skipped.push(topic.slug);
        continue;
      }
      await createSeoTopic(topic);
      results.created.push(topic.slug);
    } catch (err) {
      results.errors.push({ slug: topic.slug, error: err.message });
    }
  }

  return Response.json({
    message: `Seeded ${results.created.length} topics, skipped ${results.skipped.length} existing.`,
    ...results,
  });
}

export async function GET() {
  return POST();
}
