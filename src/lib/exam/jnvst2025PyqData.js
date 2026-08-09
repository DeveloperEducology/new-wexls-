export const JNVST_2025_PYQ_TEMPLATE = {
  id: "2025-jnvst-official-pyq-template",
  _id: "2025-jnvst-official-pyq-template",
  title: "Official JNVST 2025 Question Paper (Code R - 80 Questions)",
  subject: "previous-papers",
  topic: "jnvst-2025-official",
  grade: "6",
  examId: "jnvst",
  generatorType: "spreadsheet-grid",
  optionsType: "mcq",
  type: "mcq",
  interaction: {
    engine: "mcq",
    inputMode: "choice"
  },
  questionText: "",
  explanation: {
    sections: [
      {
        type: "text",
        content: ""
      }
    ]
  },
  options: [
    { label: "[Result]", isCorrect: true },
    { label: "[Distractor1]", isCorrect: false },
    { label: "[Distractor2]", isCorrect: false },
    { label: "[Distractor3]", isCorrect: false }
  ],
  validationRules: [
    { type: "exact_match", target: "answer", value: "[Result]" }
  ],
  variables: [
    {
      name: "index",
      type: "array",
      values: Array.from({ length: 80 }, (_, i) => i)
    },
    {
      name: "section",
      type: "expression",
      formula: JSON.stringify(Array(40).fill("mat").concat(Array(20).fill("arithmetic")).concat(Array(20).fill("language"))) + "[index]"
    },
    {
      name: "sectionName",
      type: "expression",
      formula: JSON.stringify(Array(40).fill("Mental Ability (MAT)").concat(Array(20).fill("Arithmetic Test")).concat(Array(20).fill("Language Test"))) + "[index]"
    }
  ],
  rows: Array.from({ length: 80 }, (_, i) => {
    const qNum = i + 1;
    const sec = i < 40 ? 'mat' : (i < 60 ? 'arithmetic' : 'language');
    const secName = sec === 'mat' ? 'Mental Ability (MAT)' : (sec === 'arithmetic' ? 'Arithmetic Test' : 'Language Test');

    if (sec === 'mat') {
      const matAnswers = [
        'C','C','A','C','C','B','C','C','D','B',
        'D','D','B','D','B','C','C','B','B','C',
        'D','A','C','A','C','D','C','A','D','A',
        'C','D','B','D','C','D','A','C','C','A'
      ];
      const ans = matAnswers[i] || 'A';
      return {
        qnId: `Q${qNum}`,
        section: sec,
        sectionName: secName,
        questionText: `Mental Ability Test - Part ${Math.floor(i / 4) + 1} (Q${qNum})`,
        optionA: '(A)',
        optionB: '(B)',
        optionC: '(C)',
        optionD: '(D)',
        answer: ans,
        correctOption: ans,
        explanation: `Official Answer Key for Q${qNum} is Option (${ans}).`
      };
    }

    if (sec === 'arithmetic') {
      const arithQs = [
        { q: 'Prime factorisation of 90 is :', a: '9 × 10', b: '3 × 6 × 5', c: '2 × 3² × 5', d: '2 × 3 × 15', ans: 'C', exp: '$90 = 2 × 3^2 × 5$' },
        { q: 'Find the difference between the greatest and the smallest 4-digit numbers formed using all the digits 4, 2, 0 and 7.', a: '5000', b: '5300', c: '5373', d: '5720', ans: 'C', exp: '7420 - 2047 = 5373.' },
        { q: 'If 9432 ÷ 1.25 = 7545.6, then 9.432 ÷ 12.5 is equal to :', a: '7.5456', b: '0.75456', c: '75.456', d: '754.56', ans: 'B', exp: '0.75456' },
        { q: 'The sum of 1.1, 1.01, 1.001, 0.01, 11.01 and 111.1001 is :', a: '125.2312', b: '126.2311', c: '125.2311', d: '125.2321', ans: 'C', exp: '125.2311' },
        { q: 'In a question of division, if divisor is 51, quotient is 16 and remainder is 27, then the dividend is :', a: '843', b: '483', c: '9', d: '1393', ans: 'A', exp: '(51 × 16) + 27 = 843.' },
        { q: 'Which of the following is always a factor of every prime number ?', a: '1', b: '2', c: '4', d: '7', ans: 'A', exp: '1 is a factor of every number.' },
        { q: 'The simplest fraction form of 20.0925 is :', a: '803.7 / 400', b: '8037 / 200', c: '8037 / 400', d: '8037 / 4000', ans: 'C', exp: '8037 / 400' },
        { q: '8 - [18 - {16 - (5 - (4 - 1))}] is equal to :', a: '2', b: '3', c: '4', d: '5', ans: 'B', exp: 'BODMAS evaluation = 3' },
        { q: '3 + 3/100 + 3/1000 + 3/1000000 is equal to the decimal number :', a: '3.030333', b: '3.033003', c: '3.003303', d: '3.0303003', ans: 'B', exp: '3.033003' },
        { q: '17 bottles of water, each of 300 mL and 30 bottles of juice, each of 130 mL are poured into a jug. The total liquid in the jug in litres is :', a: '8', b: '9', c: '10', d: '11', ans: 'B', exp: '5.1L + 3.9L = 9 Litres.' },
        { q: 'Suresh left his home at 9:00 a.m. to meet his uncle. He walked for 10 minutes, travelled in bus for 1 hour 05 minutes and then walked for 15 minutes to reach his uncle\'s home. He stayed there for 3 hours 20 minutes and reached his home at 3:30 p.m. How much time did he take on the return journey ?', a: '1 hour 30 minutes', b: '1 hour 35 minutes', c: '1 hour 40 minutes', d: '1 hour 45 minutes', ans: 'C', exp: 'Return journey = 1 hour 40 minutes.' },
        { q: 'A shopkeeper buys at the rate of 5 toffees for a rupee and sells at the rate of 4 toffees for a rupee. The number of toffees sold, so as to earn a profit of ₹ 125 is :', a: '1,200', b: '1,500', c: '2,000', d: '2,500', ans: 'D', exp: '2,500 toffees.' },
        { q: 'Which of the following rectangles has maximum area and how much is the maximum area (in sq. cm) ? (a) 10cm x 18cm, (b) 14cm x 14cm, (c) 16cm x 12cm, (d) 11cm x 17cm', a: 'Rectangle (c), 192', b: 'Rectangle (b), 196', c: 'Rectangle (d), 212', d: 'Rectangle (a), 280', ans: 'B', exp: 'Rectangle (b), 196 sq. cm.' },
        { q: 'What should be subtracted from 33/40 to get 11/40 ?', a: '11/20', b: '22', c: '11/40', d: '3/5', ans: 'A', exp: '22/40 = 11/20.' },
        { q: 'A square park is of side 50 m. There is a path 2.5 m wide running all around inside it. The cost of levelling the path (in ₹) at ₹ 10 per square metre is :', a: '4,500', b: '4,750', c: '5,000', d: '5,250', ans: 'B', exp: '₹ 4,750.' },
        { q: '5/22 + 7/22 - 3/22 + 9/22 - 1/22, on simplification, gives :', a: '15/22', b: '17/22', c: '19/22', d: '13/22', ans: 'D', exp: '13/22.' },
        { q: 'Teena purchased a scooter for ₹ 55,000. She spent ₹ 3,400 on its repair. She sold the scooter to her friend for ₹ 56,030. Her profit or loss is :', a: 'Profit of ₹ 2,370', b: 'Loss of ₹ 2,370', c: 'Profit of ₹ 1,030', d: 'Loss of ₹ 1,030', ans: 'B', exp: 'Loss of ₹ 2,370.' },
        { q: 'The angle between the minute hand and the hour hand at 6:00 p.m. is :', a: 'Acute angle', b: 'Right angle', c: 'Obtuse angle', d: 'Straight angle', ans: 'D', exp: 'Straight angle (180°).' },
        { q: 'The bar graph shows the number of questions solved by P, Q, R and S. From the above bar graph, find how many more questions Q and R solve together than P and S together did.', a: '4', b: '2', c: '16', d: '12', ans: 'A', exp: 'Difference = 4.' },
        { q: 'A bicycle wheel has a total of 24 spokes. The angle between a pair of adjacent spokes is :', a: '10°', b: '15°', c: '24°', d: '30°', ans: 'B', exp: '360° / 24 = 15°.' }
      ];
      const item = arithQs[i - 40];
      return {
        qnId: `Q${qNum}`,
        section: sec,
        sectionName: secName,
        questionText: item.q,
        optionA: item.a,
        optionB: item.b,
        optionC: item.c,
        optionD: item.d,
        answer: item.ans,
        correctOption: item.ans,
        explanation: item.exp
      };
    }

    // Language Test
    const langQs = [
      { q: 'Passage 1: All spiders spin webs... This passage is about the ____.', a: 'importance of spider\'s web', b: 'importance of bugs for the spiders', c: 'importance of laying eggs', d: 'nature of spiders', ans: 'A', exp: 'Importance of spider\'s web.' },
      { q: 'What is not true about webs of spiders ?', a: 'They hold eggs.', b: 'They catch food.', c: 'They find water.', d: 'They hide from enemies.', ans: 'C', exp: 'Webs do not find water.' },
      { q: 'The synonym of the word \'trapped\' is :', a: 'stuck', b: 'hidden', c: 'eaten', d: 'escape', ans: 'A', exp: 'Trapped means stuck.' },
      { q: 'How can spiders tell when something is trapped in their web ?', a: 'They can hear it.', b: 'They can smell it.', c: 'They can feel it.', d: 'They can taste it.', ans: 'C', exp: 'Spiders feel the web move.' },
      { q: 'As used in the last sentence of the passage, the word \'survival\' means :', a: 'being alive', b: 'hidden', c: 'caught', d: 'defence', ans: 'A', exp: 'Survival means being alive.' },
      { q: 'Passage 2: Books are by far the most lasting products... Of all the products of human effort, books are the most ____ creation.', a: 'caring', b: 'inappropriate', c: 'time consuming', d: 'useful', ans: 'D', exp: 'Useful creation.' },
      { q: 'Good books have been able to stand the test of time because they contain ____.', a: 'the author\'s mind', b: 'great ideas', c: 'inappropriate products', d: 'printed matter', ans: 'B', exp: 'Great ideas.' },
      { q: 'Which of the following words is a synonym of the word \'inappropriate\' ?', a: 'illness', b: 'unaware', c: 'suitable', d: 'incorrect', ans: 'D', exp: 'Inappropriate means incorrect.' },
      { q: 'The world keeps its books with care because they ____.', a: 'train us', b: 'help us in various fields', c: 'are timeless', d: 'celebrate human effort', ans: 'B', exp: 'Help us in various fields.' },
      { q: 'The word \'crumble\', as used in the passage, means :', a: 'disintegrate', b: 'dismiss', c: 'displace', d: 'dissect', ans: 'A', exp: 'Crumble means disintegrate.' },
      { q: 'Passage 3: The golden eagle is easily recognizable... The golden eagle is mostly found in ____.', a: 'areas that have little wind and warm air', b: 'areas that have buildings', c: 'the southern hemisphere', d: 'the northern hemisphere', ans: 'D', exp: 'The northern hemisphere.' },
      { q: 'The female golden eagle can be distinguished by its ____.', a: 'darker plumage', b: 'brighter wings', c: 'dark brown plumage', d: 'larger size', ans: 'D', exp: 'Larger size.' },
      { q: 'Which places would the bird look for building nests ?', a: 'Open country', b: 'Areas isolated from vegetation', c: 'Massive heights', d: 'Open country with houses', ans: 'A', exp: 'Open country.' },
      { q: 'Which word is similar in meaning to the word \'majestic\' ?', a: 'golden', b: 'humble', c: 'grand', d: 'modest', ans: 'C', exp: 'Majestic means grand.' },
      { q: 'Which of the following words is not an antonym of \'massive\' ?', a: 'tiny', b: 'vast', c: 'puny', d: 'weightless', ans: 'B', exp: 'Vast is a synonym.' },
      { q: 'Passage 4: A robot is a special machine... The synonym of \'tired\' is ____.', a: 'explore', b: 'exhausted', c: 'vacuum', d: 'dangerous', ans: 'B', exp: 'Tired means exhausted.' },
      { q: 'Robots don\'t make mistakes because they ____.', a: 'are machines', b: 'follow instructions given by a computer', c: 'look like humans', d: 'don\'t look tired', ans: 'A', exp: 'Because they are machines.' },
      { q: 'According to the passage, for which of the following tasks are robots not used ?', a: 'To clean houses', b: 'To answer telephone calls', c: 'For making cars', d: 'For teaching children', ans: 'D', exp: 'Not used for teaching children.' },
      { q: 'Which of the following words is an antonym of the word \'dangerous\' ?', a: 'explore', b: 'safe', c: 'tired', d: 'recognise', ans: 'B', exp: 'Antonym is safe.' },
      { q: 'Which of the following statements about robots is not true ?', a: 'Most robots look like machines.', b: 'Robots don\'t make mistakes.', c: 'Robots are very useful.', d: 'Most robots look like humans.', ans: 'D', exp: 'Most robots look like machines.' }
    ];
    const item = langQs[i - 60];
    return {
      qnId: `Q${qNum}`,
      section: sec,
      sectionName: secName,
      questionText: item.q,
      optionA: item.a,
      optionB: item.b,
      optionC: item.c,
      optionD: item.d,
      answer: item.ans,
      correctOption: item.ans,
      explanation: item.exp
    };
  })
};
