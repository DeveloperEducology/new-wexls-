import {
  INDIAN_PLACES,
  buildButtonMachineSvg,
  buildCommaGroupingSvg,
  buildMagnitudeBarsSvg,
  buildNumberLineRoundingSvg,
  buildPlaceValueChartSvg,
  formatIndianNumber,
  formatInternationalNumber,
} from '../shared/visualBuilders.js';

export const PLACE_VALUE_SYSTEM_TASKS = [
  'indian_comma_grouping',
  'international_comma_grouping',
  'indian_place_chart',
  'expanded_form_large',
  'compare_large_numbers',
  'order_large_numbers',
  'rounding_number_line',
  'rounding_nearest_lakh',
  'button_machine_decomposition',
  'magnitude_benchmark',
  'shortcut_multiplication',
  'system_conversion',
];

const shuffle = (items, rng) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const uniq = (items) => [...new Set(items.map(String))];

const randomNumberByDigits = (rng, digits) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return rng.int(min, max);
};

const getDigits = (number) => String(Math.trunc(Math.abs(number))).split('').map(Number);

const expandedForm = (number) => {
  const digits = getDigits(number);
  return digits
    .map((digit, index) => digit * 10 ** (digits.length - index - 1))
    .filter((value) => value > 0);
};

const makeId = (task, rng) => `pv_system_${task}_${Date.now()}_${rng.int(1000, 9999)}`;

const normalizeOptions = (labels, correctLabel, rng) => {
  const uniqueLabels = uniq(labels);
  const shuffled = shuffle(uniqueLabels, rng);
  const correctAnswerIndex = shuffled.indexOf(String(correctLabel));
  return {
    options: shuffled.map((label, index) => ({
      id: `opt_${index}`,
      label,
      isCorrect: index === correctAnswerIndex,
    })),
    correctAnswerIndex,
    answer: `opt_${correctAnswerIndex}`,
  };
};

const makeMcq = ({ rng, task, questionText, parts = [], labels, correctLabel, solution = [], metadata = {} }) => {
  const optionData = normalizeOptions(labels, correctLabel, rng);
  return {
    id: makeId(task, rng),
    type: 'mcq',
    questionText,
    parts,
    ...optionData,
    solution: {
      sections: solution.map((content) => ({ type: 'text', content })),
    },
    explanation: {
      sections: solution.map((content) => ({ content })),
    },
    metadata: {
      subject: 'math',
      topic: 'place-values',
      engine: 'system',
      task,
      ...metadata,
    },
  };
};

const makeFill = ({ rng, task, questionText, parts = [], answer, solution = [], metadata = {} }) => ({
  id: makeId(task, rng),
  type: 'fillInTheBlank',
  questionText,
  parts,
  answer,
  correctAnswer: answer,
  correctAnswerText: JSON.stringify(answer),
  correctAnswerIndex: null,
  solution: {
    sections: solution.map((content) => ({ type: 'text', content })),
  },
  explanation: {
    sections: solution.map((content) => ({ content })),
  },
  metadata: {
    subject: 'math',
    topic: 'place-values',
    engine: 'system',
    task,
    ...metadata,
  },
});

const placeNameForValue = (value) => INDIAN_PLACES.find((place) => place.value === value);

function generateIndianCommaQuestion(rng) {
  const number = randomNumberByDigits(rng, rng.int(6, 9));
  const correct = formatIndianNumber(number);
  const international = formatInternationalNumber(number);
  const noComma = String(number);
  const wrongIndian = correct.replace(/^(\d+),/, '$1');

  return makeMcq({
    rng,
    task: 'indian_comma_grouping',
    questionText: `Which is the Indian comma form of ${noComma}?`,
    parts: [
      { type: 'svg', content: buildCommaGroupingSvg(number, 'indian'), isVertical: true },
      { type: 'text', content: 'Indian grouping keeps the last 3 digits together, then groups by 2.', isVertical: true },
    ],
    labels: [correct, international, noComma, wrongIndian],
    correctLabel: correct,
    solution: [
      `The Indian number system groups ${noComma} as **${correct}**.`,
      'Keep the last three digits together, then place commas every two digits.',
    ],
    metadata: { templateId: 'place-values.comma.indian', number, system: 'indian' },
  });
}

function generateInternationalCommaQuestion(rng) {
  const number = randomNumberByDigits(rng, rng.int(7, 9));
  const correct = formatInternationalNumber(number);
  const indian = formatIndianNumber(number);
  const noComma = String(number);

  return makeMcq({
    rng,
    task: 'international_comma_grouping',
    questionText: `Which is the international comma form of ${noComma}?`,
    parts: [{ type: 'svg', content: buildCommaGroupingSvg(number, 'international'), isVertical: true }],
    labels: [correct, indian, noComma, correct.replace(',', '')],
    correctLabel: correct,
    solution: [
      `The international number system groups ${noComma} as **${correct}**.`,
      'International grouping places commas every three digits from the right.',
    ],
    metadata: { templateId: 'place-values.comma.international', number, system: 'international' },
  });
}

function generatePlaceChartQuestion(rng) {
  const number = randomNumberByDigits(rng, rng.int(5, 8));
  const places = INDIAN_PLACES.filter((place) => place.value <= 10 ** (String(number).length - 1));
  const target = rng.pick(places);
  const digit = Math.floor(number / target.value) % 10;

  return makeFill({
    rng,
    task: 'indian_place_chart',
    questionText: `What digit is in the ${target.label.toLowerCase()} place?`,
    parts: [
      { type: 'svg', content: buildPlaceValueChartSvg(number, { highlightPlace: target.key }), isVertical: true },
      { type: 'text', content: `In **${formatIndianNumber(number)}**, the digit in the **${target.label}** place is [blank:ans].`, isVertical: true },
    ],
    answer: { ans: String(digit) },
    solution: [`Look at the highlighted **${target.label}** column. The digit there is **${digit}**.`],
    metadata: { templateId: 'place-values.chart.large', number, place: target.key, digit },
  });
}

function generateExpandedLargeQuestion(rng) {
  const number = randomNumberByDigits(rng, rng.int(5, 7));
  const parts = expandedForm(number);
  const correct = parts.map(formatIndianNumber).join(' + ');
  const missingLast = parts.slice(0, -1).map(formatIndianNumber).join(' + ');
  const compact = getDigits(number).filter(Boolean).join(' + ');

  return makeMcq({
    rng,
    task: 'expanded_form_large',
    questionText: `Which expanded form shows ${formatIndianNumber(number)}?`,
    parts: [
      { type: 'svg', content: buildPlaceValueChartSvg(number), isVertical: true },
      { type: 'text', content: 'Expanded form shows the value of each non-zero digit.', isVertical: true },
    ],
    labels: [correct, missingLast, compact, `${formatIndianNumber(parts[0])} + ${formatIndianNumber(number - parts[0] + 10)}`],
    correctLabel: correct,
    solution: [`Break the number into place values: **${correct}**.`],
    metadata: { templateId: 'place-values.expanded-form.large', number, expandedForm: correct },
  });
}

function generateCompareLargeQuestion(rng) {
  const a = randomNumberByDigits(rng, rng.int(5, 8));
  const delta = rng.int(10, 9000);
  const b = rng.pick([a + delta, Math.max(10000, a - delta)]);
  const correct = a > b ? '>' : a < b ? '<' : '=';

  return makeMcq({
    rng,
    task: 'compare_large_numbers',
    questionText: `Compare ${formatIndianNumber(a)} and ${formatIndianNumber(b)}.`,
    parts: [
      {
        type: 'svg',
        content: buildMagnitudeBarsSvg([
          { label: formatIndianNumber(a), value: a, color: '#38bdf8' },
          { label: formatIndianNumber(b), value: b, color: '#a78bfa' },
        ]),
        isVertical: true,
      },
      { type: 'text', content: `Choose the sign: **${formatIndianNumber(a)} __ ${formatIndianNumber(b)}**`, isVertical: true },
    ],
    labels: ['<', '>', '='],
    correctLabel: correct,
    solution: [`${formatIndianNumber(a)} ${correct} ${formatIndianNumber(b)}.`],
    metadata: { templateId: 'place-values.compare.large', a, b },
  });
}

function generateOrderLargeQuestion(rng) {
  const base = randomNumberByDigits(rng, 6);
  const values = uniq([base, base + rng.int(300, 2000), base - rng.int(300, 2000)]).map(Number);
  const ascending = [...values].sort((a, b) => a - b);
  const correct = ascending.map(formatIndianNumber).join(' < ');
  const labels = [
    correct,
    [...ascending].reverse().map(formatIndianNumber).join(' < '),
    [ascending[1], ascending[0], ascending[2]].map(formatIndianNumber).join(' < '),
    [ascending[0], ascending[2], ascending[1]].map(formatIndianNumber).join(' < '),
  ];

  return makeMcq({
    rng,
    task: 'order_large_numbers',
    questionText: 'Which list shows the numbers in increasing order?',
    parts: [{ type: 'text', content: values.map(formatIndianNumber).join(', '), isVertical: true }],
    labels,
    correctLabel: correct,
    solution: [`From smallest to greatest: **${correct}**.`],
    metadata: { templateId: 'place-values.order.large', values },
  });
}

function roundingQuestion(rng, placeValue, task, templateId, label) {
  const lower = rng.int(1, 80) * placeValue;
  const number = lower + rng.int(1, placeValue - 1);
  const upper = lower + placeValue;
  const midpoint = lower + placeValue / 2;
  const rounded = number < midpoint ? lower : upper;

  return makeMcq({
    rng,
    task,
    questionText: `Round ${formatIndianNumber(number)} to the nearest ${label}.`,
    parts: [{ type: 'svg', content: buildNumberLineRoundingSvg({ number, lower, upper, midpoint, rounded, label: `Nearest ${label}` }), isVertical: true }],
    labels: [rounded, lower, upper, number].map(formatIndianNumber),
    correctLabel: formatIndianNumber(rounded),
    solution: [
      `${formatIndianNumber(number)} is between ${formatIndianNumber(lower)} and ${formatIndianNumber(upper)}.`,
      `It rounds to **${formatIndianNumber(rounded)}**.`,
    ],
    metadata: { templateId, number, rounded, placeValue },
  });
}

function generateButtonMachineQuestion(rng) {
  const number = randomNumberByDigits(rng, rng.int(5, 6));
  const digits = String(number).padStart(6, '0').split('').map(Number);
  const answer = {
    lakh: String(digits[0]),
    tenThousand: String(digits[1]),
    thousand: String(digits[2]),
    hundred: String(digits[3]),
    ten: String(digits[4]),
    one: String(digits[5]),
  };

  return makeFill({
    rng,
    task: 'button_machine_decomposition',
    questionText: `Use the fewest button clicks to make ${formatIndianNumber(number)}.`,
    parts: [
      { type: 'svg', content: buildButtonMachineSvg(number), isVertical: true },
      {
        type: 'text',
        content: `+1,00,000 clicks: [blank:lakh]\n\n+10,000 clicks: [blank:tenThousand]\n\n+1,000 clicks: [blank:thousand]\n\n+100 clicks: [blank:hundred]\n\n+10 clicks: [blank:ten]\n\n+1 clicks: [blank:one]`,
        isVertical: true,
      },
    ],
    answer,
    solution: [
      `Each digit tells the fewest clicks for its place.`,
      `${formatIndianNumber(number)} = ${expandedForm(number).map(formatIndianNumber).join(' + ')}.`,
    ],
    metadata: { templateId: 'place-values.decomposition.button-machine', number },
  });
}

function generateMagnitudeBenchmarkQuestion(rng) {
  const choices = [
    { label: '1 lakh', value: 100000, correct: '100 groups of 1,000' },
    { label: '1 crore', value: 10000000, correct: '100 groups of 1 lakh' },
  ];
  const target = rng.pick(choices);

  return makeMcq({
    rng,
    task: 'magnitude_benchmark',
    questionText: `${target.label} is equal to which quantity?`,
    parts: [
      {
        type: 'svg',
        content: buildMagnitudeBarsSvg([
          { label: '1 thousand', value: 1000, color: '#38bdf8' },
          { label: '1 lakh', value: 100000, color: '#22c55e' },
          { label: '1 crore', value: 10000000, color: '#f97316' },
        ]),
        isVertical: true,
      },
    ],
    labels: [target.correct, '10 groups of 1,000', '1,000 groups of 1 lakh', '100 groups of 100'],
    correctLabel: target.correct,
    solution: [`${target.label} = **${formatIndianNumber(target.value)}**.`],
    metadata: { templateId: 'place-values.magnitude.benchmark', value: target.value },
  });
}

function generateShortcutMultiplicationQuestion(rng) {
  const factor = rng.pick([10, 100, 1000]);
  const number = rng.int(12, 999);
  const product = number * factor;

  return makeFill({
    rng,
    task: 'shortcut_multiplication',
    questionText: `Multiply by ${formatIndianNumber(factor)}.`,
    parts: [{ type: 'text', content: `**${number} × ${formatIndianNumber(factor)} = [blank:ans]**`, isVertical: true }],
    answer: { ans: String(product) },
    solution: [`Multiplying by ${formatIndianNumber(factor)} shifts the number ${String(factor).length - 1} place(s) left: **${formatIndianNumber(product)}**.`],
    metadata: { templateId: 'place-values.shortcut-multiplication', number, factor, product },
  });
}

function generateSystemConversionQuestion(rng) {
  const number = randomNumberByDigits(rng, rng.int(7, 9));
  const indian = formatIndianNumber(number);
  const international = formatInternationalNumber(number);
  const askIndian = rng.next() > 0.5;
  const correct = askIndian ? indian : international;

  return makeMcq({
    rng,
    task: 'system_conversion',
    questionText: `Which option shows ${number} in the ${askIndian ? 'Indian' : 'international'} number system?`,
    parts: [
      { type: 'svg', content: buildCommaGroupingSvg(number, askIndian ? 'indian' : 'international'), isVertical: true },
    ],
    labels: [correct, askIndian ? international : indian, String(number), correct.replace(/,/g, ' ')],
    correctLabel: correct,
    solution: [`${number} is written as **${correct}** in the ${askIndian ? 'Indian' : 'international'} number system.`],
    metadata: { templateId: 'place-values.system.conversion', number, system: askIndian ? 'indian' : 'international' },
  });
}

export function generatePlaceValueSystemQuestion(rng, forcedTask, context = {}) {
  const difficulty = context.difficulty || 'easy';

  switch (forcedTask) {
    case 'indian_comma_grouping':
      return generateIndianCommaQuestion(rng);
    case 'international_comma_grouping':
      return generateInternationalCommaQuestion(rng);
    case 'indian_place_chart':
      return generatePlaceChartQuestion(rng);
    case 'expanded_form_large':
      return generateExpandedLargeQuestion(rng);
    case 'compare_large_numbers':
      return generateCompareLargeQuestion(rng);
    case 'order_large_numbers':
      return generateOrderLargeQuestion(rng);
    case 'rounding_number_line':
      return roundingQuestion(rng, 1000, forcedTask, 'place-values.rounding.nearest-thousand', 'thousand');
    case 'rounding_nearest_lakh':
      return roundingQuestion(rng, 100000, forcedTask, 'place-values.rounding.nearest-lakh', 'lakh');
    case 'button_machine_decomposition':
      return generateButtonMachineQuestion(rng);
    case 'magnitude_benchmark':
      return generateMagnitudeBenchmarkQuestion(rng);
    case 'shortcut_multiplication':
      return generateShortcutMultiplicationQuestion(rng);
    case 'system_conversion':
      return generateSystemConversionQuestion(rng);
    default:
      return difficulty === 'hard' ? generateExpandedLargeQuestion(rng) : generateIndianCommaQuestion(rng);
  }
}
