import { generateScaledGraphQuestion } from './engines/scaled.engine.js';
import { generateTallyLinePlotQuestion } from './engines/tally.engine.js';

function seededRandom(seed) {
  let value = 0;
  const text = String(seed || Date.now());

  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) >>> 0;
  }

  return function random() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

function randInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

export function generateDataGraphsQuestion(config = {}) {
  const skill = config.logic_type || config.forcedTask || 'data-graphs-g1-read-picture-graph';
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const random = seededRandom(seed);

  // Route to Scaled Graphs Engine
  if (skill === 'data-graphs-g2-scaled-bar-graph' || skill === 'data-graphs-g2-scaled-pictograph') {
    return generateScaledGraphQuestion(config);
  }

  // Route to Tally Marks & Line Plots Engine
  if (
    skill === 'data-graphs-g2-read-tally-chart' ||
    skill === 'data-graphs-g3-line-plot' ||
    skill === 'data-graphs-remedial-count-objects' ||
    skill === 'data-graphs-remedial-tally-read-5'
  ) {
    return generateTallyLinePlotQuestion(config);
  }

  // Legacy Grade 1 Generators - Normalized for standard validation requirements
  if (skill === 'data-graphs-g1-count-bar-graph') {
    const fruits = ['apples', 'bananas', 'mangoes', 'oranges'];
    const targetFruit = pick(random, fruits);

    const values = Object.fromEntries(
      fruits.map((fruit) => [fruit, randInt(random, 2, 8)])
    );

    const answer = values[targetFruit];

    return {
      id: `data-graphs-${skill}-${seed}`,
      type: 'fillInTheBlank',
      questionText: `How many students chose ${targetFruit}?`,
      parts: [
        {
          type: 'svg',
          svg: `
            <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
              <text x="20" y="30" font-size="20" font-weight="700">Favorite Fruits</text>

              ${fruits.map((fruit, index) => {
                const x = 50 + index * 85;
                const barHeight = values[fruit] * 16;
                const y = 170 - barHeight;

                return `
                  <rect x="${x}" y="${y}" width="46" height="${barHeight}" fill="#60a5fa"/>
                  <text x="${x + 16}" y="${y - 8}" font-size="14">${values[fruit]}</text>
                  <text x="${x - 6}" y="195" font-size="13">${fruit}</text>
                `;
              }).join('')}
            </svg>
          `
        },
        {
          type: 'text',
          content: `${targetFruit} were chosen by [blank:ans] students.`
        }
      ],
      answer: { ans: String(answer) },
      explanation: {
        sections: [
          { content: `### Reading the bar graph:` },
          { content: `Look at the bar for **${targetFruit}**.\n\nThe height of the bar corresponds to the value **${answer}**.` }
        ]
      },
      remediation: `Find the label for ${targetFruit} on the x-axis, and trace the top of the bar to the y-axis number.`,
      metadata: { task: skill, seed }
    };
  }

  if (skill === 'data-graphs-g1-find-least-bar-graph') {
    const pets = ['cats', 'dogs', 'birds', 'fish'];
    const baseValues = [2, 4, 6, 8].sort(() => random() - 0.5);
    const values = Object.fromEntries(
      pets.map((pet, index) => [pet, baseValues[index]])
    );
    const leastPet = pets.reduce((currentLeast, pet) => (
      values[pet] < values[currentLeast] ? pet : currentLeast
    ), pets[0]);

    const options = pets.map((pet, index) => ({
      id: `opt_${index}`,
      label: pet
    }));
    const correctAnswerIndex = pets.indexOf(leastPet);

    return {
      id: `data-graphs-${skill}-${seed}`,
      type: 'mcq',
      questionText: 'Which pet got the fewest votes?',
      parts: [
        {
          type: 'svg',
          svg: `
            <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
              <text x="20" y="30" font-size="20" font-weight="700">Favorite Pets</text>
              <line x1="36" y1="175" x2="380" y2="175" stroke="#334155" stroke-width="2"/>
              ${pets.map((pet, index) => {
                const x = 55 + index * 82;
                const barHeight = values[pet] * 16;
                const y = 175 - barHeight;

                return `
                  <rect x="${x}" y="${y}" width="46" height="${barHeight}" rx="6" fill="#34d399"/>
                  <text x="${x + 16}" y="${y - 8}" font-size="14" font-weight="700">${values[pet]}</text>
                  <text x="${x + 4}" y="200" font-size="14">${pet}</text>
                `;
              }).join('')}
            </svg>
          `
        }
      ],
      options,
      correctAnswerIndex,
      explanation: {
        sections: [
          { content: `### Finding the Least:` },
          { content: `Look at the heights of the bars for each pet:\n\n- Cats: **${values.cats}**\n- Dogs: **${values.dogs}**\n- Birds: **${values.birds}**\n- Fish: **${values.fish}**\n\nThe shortest bar is for **${leastPet}** with **${values[leastPet]}** votes.` }
        ]
      },
      remediation: `Look for the bar that has the lowest height. That category represents the fewest votes.`,
      metadata: {
        task: skill,
        templateId: 'data_graphs.bar.least',
        seed
      }
    };
  }

  // Default case (Legacy pictographs / count picture graph)
  const pictureItems = [
    { name: 'apples', icon: '🍎' },
    { name: 'bananas', icon: '🍌' },
    { name: 'mangoes', icon: '🥭' },
    { name: 'oranges', icon: '🍊' },
    { name: 'stars', icon: '⭐' }
  ];

  const selected = pick(random, pictureItems);
  const count = randInt(random, 2, 6);
  const icons = Array.from({ length: count }, () => selected.icon).join(' ');

  const finalSkillId = skill === 'data-graphs-g1-read-picture-graph' ? 'data-graphs-g1-read-picture-graph' : 'data-graphs-g1-read-pictograph';
  const finalTemplateId = skill === 'data-graphs-g1-read-picture-graph' ? 'data_graphs.picture.count' : 'data_graphs.pictograph.read';

  return {
    id: `data-graphs-${skill}-${seed}`,
    type: 'fillInTheBlank',
    questionText: `How many children chose ${selected.name}?`,
    parts: [
      {
        type: 'svg',
        svg: `
          <svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg">
            <text x="20" y="32" font-size="20" font-weight="700">Class Choices</text>
            <text x="20" y="78" font-size="30">${icons}</text>
            <text x="20" y="116" font-size="16">${selected.name}</text>
          </svg>
        `
      },
      {
        type: 'text',
        content: `The number of children who chose ${selected.name} is [blank:ans].`
      }
    ],
    answer: { ans: String(count) },
    explanation: {
      sections: [
        { content: `### Counting pictures:` },
        { content: `Count each picture icon shown in the row for **${selected.name}**.\n\nThere are exactly **${count}** icons.` }
      ]
    },
    remediation: `Count the pictures shown next to the name one by one.`,
    metadata: {
      task: skill,
      skillId: finalSkillId,
      templateId: finalTemplateId,
      seed
    }
  };
}
