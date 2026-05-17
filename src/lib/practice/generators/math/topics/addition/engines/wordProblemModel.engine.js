import { createSeededRandom, randInt, uid } from './shared.js';

function barModelSvg({
  first,
  second,
  topLabel = '?',
  firstLabel = null,
  secondLabel = null,
  color = '#fde68a',
  stroke = '#f59e0b',
}) {
  const total = first + second;
  const width = 560;
  const height = 190;
  const startX = 32;
  const barY = 92;
  const barWidth = 496;
  const barHeight = 62;
  const firstWidth = Math.max(70, (first / total) * barWidth);
  const secondWidth = barWidth - firstWidth;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="display:block;">
      <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="4" fill="#ffffff" stroke="#a5e8ff" stroke-width="3" />
      <path d="M${startX} 66 v-14 h${barWidth} v14" fill="none" stroke="#b7b7b7" stroke-width="3" />
      <line x1="${startX + barWidth / 2}" y1="52" x2="${startX + barWidth / 2}" y2="38" stroke="#b7b7b7" stroke-width="3" />
      <text x="${startX + barWidth / 2}" y="28" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="800" fill="#555">${topLabel}</text>
      <rect x="${startX}" y="${barY}" width="${firstWidth}" height="${barHeight}" rx="4" fill="${color}" stroke="${stroke}" stroke-width="2" />
      <rect x="${startX + firstWidth}" y="${barY}" width="${secondWidth}" height="${barHeight}" rx="4" fill="${color}" stroke="${stroke}" stroke-width="2" />
      <text x="${startX + firstWidth / 2}" y="${barY + 39}" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="800" fill="#555">${firstLabel ?? first}</text>
      <text x="${startX + firstWidth + secondWidth / 2}" y="${barY + 39}" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="800" fill="#555">${secondLabel ?? second}</text>
    </svg>
  `.trim();
}

export function generateWordProblemModelQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = template.config?.range || [1, 20];
  const maxTotal = Math.min(20, Number(range[1] || 20));
  const total = randInt(6, maxTotal, random);
  const first = randInt(2, Math.max(2, total - 2), random);
  const second = total - first;
  const people = template.config?.people || ['girls', 'boys', 'kids'];
  const place = template.config?.place || 'park';

  const options = [
    {
      id: 'opt_correct',
      type: 'svg',
      content: barModelSvg({ first, second, topLabel: '?', firstLabel: first, secondLabel: second }),
      label: `${first} and ${second}`,
      isCorrect: true,
    },
    {
      id: 'opt_missing_part',
      type: 'svg',
      content: barModelSvg({
        first,
        second,
        topLabel: second,
        firstLabel: first,
        secondLabel: '?',
        color: '#fdba74',
        stroke: '#f97316',
      }),
      label: `${first} and missing part make ${second}`,
      isCorrect: false,
    },
  ];

  if (random() < 0.5) options.reverse();

  return {
    id: uid(),
    type: 'mcq',
    questionText: 'Pick the model that matches the story.',
    parts: [
      { type: 'text', content: 'Read the story.', hasAudio: true, isVertical: true },
      {
        type: 'text',
        content: `At the ${place}, there are ${first} ${people[0]} and ${second} ${people[1]}. How many ${people[2]} are there in all?`,
        hasAudio: true,
        isVertical: true,
        style: { maxWidth: 760, textAlign: 'left' },
      },
      { type: 'text', content: 'Pick the model that matches the story.', hasAudio: true, isVertical: true },
    ],
    options,
    answer: options.findIndex((option) => option.isCorrect),
    correctAnswerIndex: options.findIndex((option) => option.isCorrect),
    solution: {
      sections: [
        { type: 'text', content: `The story has ${first} ${people[0]} and ${second} ${people[1]}.` },
        { type: 'text', content: `The matching model shows both parts with a question mark for the total.` },
        { type: 'text', content: `${first} + ${second} = ${total}.` },
      ],
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'wordProblemModel',
      first,
      second,
      total,
      range,
    },
  };
}
