import { createSeededRandom, randInt, uid } from './shared.js';

const COLOR_SCHEMES = {
  blue: { fill: '#3b82f6', stroke: '#1d4ed8' },
  teal: { fill: '#06b6d4', stroke: '#0e7490' },
  orange: { fill: '#ff8a3d', stroke: '#e06013' },
  pink: { fill: '#ec4899', stroke: '#be185d' },
  yellow: { fill: '#eab308', stroke: '#a16207' },
  purple: { fill: '#c45add', stroke: '#a83ac4' },
};

const pickOne = (arr, random = Math.random) => arr[Math.floor(random() * arr.length)];

function getRandomColor(random) {
  const schemes = Object.values(COLOR_SCHEMES);
  return pickOne(schemes, random);
}

function getRandomColorPair(random) {
  const schemes = Object.keys(COLOR_SCHEMES);
  const key1 = pickOne(schemes, random);
  const remaining = schemes.filter(k => k !== key1);
  const key2 = pickOne(remaining, random);
  return [COLOR_SCHEMES[key1], COLOR_SCHEMES[key2]];
}

export function generateCubeArrayQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const mode = template.config?.mode || 'repeatedAddition';

  if (mode === 'repeatedAddition') {
    return generateRepeatedAdditionQuestion(template, variables, random);
  } else if (mode === 'arrayGrid') {
    return generateArrayGridQuestion(template, variables, random);
  } else if (mode === 'areaModel') {
    return generateAreaModelQuestion(template, variables, random);
  } else if (mode === 'distributiveProperty') {
    return generateDistributiveQuestion(template, variables, random);
  } else if (mode === 'areaGridRectangle') {
    return generateAreaGridRectangleQuestion(template, variables, random);
  } else if (mode === 'areaGridRectangleFill') {
    return generateAreaGridRectangleFillQuestion(template, variables, random);
  } else if (mode === 'dotArray') {
    return generateDotArrayQuestion(template, variables, random);
  }

  // Fallback
  return generateRepeatedAdditionQuestion(template, variables, random);
}

function generateRepeatedAdditionQuestion(template, variables, random) {
  const mode = 'repeatedAddition';
  const groupsRange = template.config?.groupsRange || [2, 4];
  const eachRange = template.config?.eachRange || [2, 5];
  const isTower = template.config?.layout === 'vertical' || template.config?.isTower || false;

  const groups = randInt(groupsRange[0], groupsRange[1], random);
  const each = randInt(eachRange[0], eachRange[1], random);
  const product = groups * each;

  const color = getRandomColor(random);

  const questionText = isTower ? `Find the sum of these towers of cubes.` : `Find the sum of these equal groups of cubes.`;

  const additionString = Array.from({ length: groups }, () => each).join(' + ');

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: false,
        categories: Array.from({ length: groups }, (_, i) => ({
          id: isTower ? `tower_${i}` : `group_${i}`,
          label: '',
          requiredCount: each,
          prefilledCount: each,
          prefillColor: color.fill,
          prefillStroke: color.stroke,
          isTower
        })),
        items: [
          {
            id: 'cube_unit',
            content: '',
            visual: 'cube',
            color: color.fill,
            stroke: color.stroke
          }
        ],
        answerKey: {},
        isVertical: true
      },
      {
        type: 'text',
        content: `Add to find the total:\n\n${additionString} = [[addition_ans]]\n\nWrite it as a multiplication equation:\n\n${groups} × ${each} = [[mult_ans]]`,
        style: {
          marginTop: 24,
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: { addition_ans: String(product), mult_ans: String(product) },
    correctAnswerText: JSON.stringify({ addition_ans: String(product), mult_ans: String(product) }),
    solution: {
      sections: [
        { type: 'text', content: isTower ? `There are ${groups} towers. Each tower has ${each} cubes.` : `There are ${groups} groups. Each group has ${each} cubes.` },
        { type: 'text', content: `Adding them together: ${additionString} = ${product}.` },
        { type: 'text', content: `This can be written as ${groups} × ${each} = ${product}.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      groups,
      each,
      product,
      isTower,
      mode
    }
  };
}

function generateArrayGridQuestion(template, variables, random) {
  const mode = 'arrayGrid';
  const rowsRange = template.config?.rowsRange || [2, 4];
  const colsRange = template.config?.colsRange || [2, 5];

  const rows = randInt(rowsRange[0], rowsRange[1], random);
  const cols = randInt(colsRange[0], colsRange[1], random);
  const product = rows * cols;

  const color = getRandomColor(random);

  const questionText = `Find the total number of cubes in this array.`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: false,
        categories: Array.from({ length: rows }, (_, i) => ({
          id: `row_${i}`,
          label: '',
          requiredCount: cols,
          prefilledCount: cols,
          prefillColor: color.fill,
          prefillStroke: color.stroke
        })),
        items: [
          {
            id: 'cube_unit',
            content: '',
            visual: 'cube',
            color: color.fill,
            stroke: color.stroke
          }
        ],
        answerKey: {},
        isVertical: true
      },
      {
        type: 'text',
        content: `Complete the sentence describing the array:\n\n[[rows_ans]] rows of [[cols_ans]] cubes = [[total_ans]]\n\nWrite the multiplication equation:\n\n[[rows_ans2]] × [[cols_ans2]] = [[total_ans2]]`,
        style: {
          marginTop: 24,
          fontSize: '17px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      rows_ans: String(rows),
      cols_ans: String(cols),
      total_ans: String(product),
      rows_ans2: String(rows),
      cols_ans2: String(cols),
      total_ans2: String(product)
    },
    correctAnswerText: JSON.stringify({
      rows_ans: String(rows),
      cols_ans: String(cols),
      total_ans: String(product),
      rows_ans2: String(rows),
      cols_ans2: String(cols),
      total_ans2: String(product)
    }),
    solution: {
      sections: [
        { type: 'text', content: `The array has ${rows} rows and ${cols} columns.` },
        { type: 'text', content: `This represents ${rows} rows of ${cols} cubes, which is ${product} cubes in total.` },
        { type: 'text', content: `The multiplication equation is ${rows} × ${cols} = ${product}.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      rows,
      cols,
      product,
      mode
    }
  };
}

function generateAreaModelQuestion(template, variables, random) {
  const mode = 'areaModel';
  const rowsRange = template.config?.rowsRange || [3, 5];
  const colsRange = template.config?.colsRange || [4, 7];

  const rows = randInt(rowsRange[0], rowsRange[1], random);
  const cols = randInt(colsRange[0], colsRange[1], random);
  const product = rows * cols;

  const color = getRandomColor(random);

  const questionText = `Fill the area model with cubes. What is the area of a ${rows} by ${cols} rectangle?`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: true,
        categories: Array.from({ length: rows }, (_, i) => ({
          id: `row_${i}`,
          label: `Row ${i + 1}`,
          requiredCount: cols,
          prefilledCount: 0,
          prefillColor: color.fill,
          prefillStroke: color.stroke
        })),
        items: [
          {
            id: 'cube_unit',
            content: 'Cube',
            visual: 'cube',
            color: color.fill,
            stroke: color.stroke
          }
        ],
        answerKey: Array.from({ length: rows }, (_, i) => ({ [`row_${i}`]: cols })).reduce((acc, cur) => ({ ...acc, ...cur }), {}),
        isVertical: true
      },
      {
        type: 'text',
        content: `Solve the equation to find the area:\n\n${rows} × ${cols} = [[ans]]`,
        style: {
          marginTop: 24,
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    // The key checks row placements and numerical input answer
    answer: {
      ...Array.from({ length: rows }, (_, i) => ({ [`row_${i}`]: cols })).reduce((acc, cur) => ({ ...acc, ...cur }), {}),
      ans: String(product)
    },
    correctAnswerText: JSON.stringify({
      ...Array.from({ length: rows }, (_, i) => ({ [`row_${i}`]: cols })).reduce((acc, cur) => ({ ...acc, ...cur }), {}),
      ans: String(product)
    }),
    solution: {
      sections: [
        { type: 'text', content: `Place ${cols} cubes in each of the ${rows} rows.` },
        { type: 'text', content: `A ${rows} by ${cols} grid contains exactly ${rows} × ${cols} = ${product} cubes.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      rows,
      cols,
      product,
      mode
    }
  };
}

function generateDistributiveQuestion(template, variables, random) {
  const mode = 'distributiveProperty';
  const rowsRange = template.config?.rowsRange || [3, 5];
  const colsRange = template.config?.colsRange || [5, 8];

  const rows = randInt(rowsRange[0], rowsRange[1], random);
  const totalCols = randInt(colsRange[0], colsRange[1], random);
  
  // Split total columns into two parts
  const cols1 = randInt(2, totalCols - 2, random);
  const cols2 = totalCols - cols1;

  const product1 = rows * cols1;
  const product2 = rows * cols2;
  const totalProduct = rows * totalCols;

  const [color1, color2] = getRandomColorPair(random);

  const questionText = `Use the two colored arrays of cubes to solve the large multiplication sentence ${rows} × ${totalCols}.`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'row',
        direction: 'row',
        style: {
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          width: '100%',
          flexWrap: 'wrap',
          marginBottom: '16px'
        },
        parts: [
          {
            type: 'group',
            direction: 'column',
            style: {
              flex: '1 1 280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            },
            parts: [
              {
                type: 'text',
                content: `**Array 1 (Teal):**`,
                style: { fontWeight: 600, color: color1.stroke }
              },
              {
                type: 'copy_drag_drop',
                prompt: '',
                isCopiable: false,
                categories: Array.from({ length: rows }, (_, i) => ({
                  id: `row1_${i}`,
                  label: '',
                  requiredCount: cols1,
                  prefilledCount: cols1,
                  prefillColor: color1.fill,
                  prefillStroke: color1.stroke
                })),
                items: [
                  {
                    id: 'cube_unit',
                    content: '',
                    visual: 'cube',
                    color: color1.fill,
                    stroke: color1.stroke
                  }
                ],
                answerKey: {},
                isVertical: true
              }
            ]
          },
          {
            type: 'group',
            direction: 'column',
            style: {
              flex: '1 1 280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            },
            parts: [
              {
                type: 'text',
                content: `**Array 2 (Pink):**`,
                style: { fontWeight: 600, color: color2.stroke }
              },
              {
                type: 'copy_drag_drop',
                prompt: '',
                isCopiable: false,
                categories: Array.from({ length: rows }, (_, i) => ({
                  id: `row2_${i}`,
                  label: '',
                  requiredCount: cols2,
                  prefilledCount: cols2,
                  prefillColor: color2.fill,
                  prefillStroke: color2.stroke
                })),
                items: [
                  {
                    id: 'cube_unit',
                    content: '',
                    visual: 'cube',
                    color: color2.fill,
                    stroke: color2.stroke
                  }
                ],
                answerKey: {},
                isVertical: true
              }
            ]
          }
        ]
      },
      {
        type: 'text',
        content: `Find the value of each colored part:\n\nArray 1 (Teal): ${rows} × ${cols1} = [[part1_ans]]\n\nArray 2 (Pink): ${rows} × ${cols2} = [[part2_ans]]\n\nAdd both parts to solve the total equation:\n\n${rows} × ${totalCols} = [[part1_ans2]] + [[part2_ans2]] = [[total_ans]]`,
        style: {
          marginTop: 24,
          fontSize: '16px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      part1_ans: String(product1),
      part2_ans: String(product2),
      part1_ans2: String(product1),
      part2_ans2: String(product2),
      total_ans: String(totalProduct)
    },
    correctAnswerText: JSON.stringify({
      part1_ans: String(product1),
      part2_ans: String(product2),
      part1_ans2: String(product1),
      part2_ans2: String(product2),
      total_ans: String(totalProduct)
    }),
    solution: {
      sections: [
        { type: 'text', content: `First, solve the two smaller arrays:` },
        { type: 'text', content: `Teal Array: ${rows} × ${cols1} = ${product1}` },
        { type: 'text', content: `Pink Array: ${rows} × ${cols2} = ${product2}` },
        { type: 'text', content: `Adding them together: ${product1} + ${product2} = ${totalProduct}.` },
        { type: 'text', content: `So, ${rows} × ${totalCols} = ${totalProduct}.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      rows,
      cols1,
      cols2,
      totalCols,
      product1,
      product2,
      totalProduct,
      mode
    }
  };
}

function generateAreaGridRectangleQuestion(template, variables, random) {
  const mode = 'areaGridRectangle';
  const difficulty = template.config?.difficulty || variables.difficulty || 'medium';

  // Adaptive dimension ranges based on difficulty
  let rowsRange, colsRange;
  if (difficulty === 'easy') {
    rowsRange = template.config?.rowsRange || [2, 3];
    colsRange = template.config?.colsRange || [2, 4];
  } else if (difficulty === 'hard') {
    rowsRange = template.config?.rowsRange || [5, 7];
    colsRange = template.config?.colsRange || [6, 8];
  } else {
    // medium
    rowsRange = template.config?.rowsRange || [3, 5];
    colsRange = template.config?.colsRange || [4, 6];
  }

  const rows = randInt(rowsRange[0], rowsRange[1], random);
  const cols = randInt(colsRange[0], colsRange[1], random);
  const product = rows * cols;

  const color = getRandomColor(random);

  const questionText = `Count the squares in this rectangle grid. How many squares are there in all?`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: false,
        // Single category representing the whole rectangle grid
        categories: [
          {
            id: 'grid_rect',
            label: '',
            requiredCount: product,
            prefilledCount: product,
            prefillColor: color.fill,
            prefillStroke: color.stroke,
            // Grid layout metadata for the renderer
            rows,
            columns: cols,
            isGrid: true
          }
        ],
        items: [],
        answerKey: {},
        isVertical: true
      },
      {
        type: 'text',
        content: `How many squares are in the grid?\n\n[[rows_ans]] rows × [[cols_ans]] columns = [[total_ans]] squares`,
        style: {
          marginTop: 24,
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      rows_ans: String(rows),
      cols_ans: String(cols),
      total_ans: String(product)
    },
    correctAnswerText: JSON.stringify({
      rows_ans: String(rows),
      cols_ans: String(cols),
      total_ans: String(product)
    }),
    solution: {
      sections: [
        { type: 'text', content: `The rectangle grid has ${rows} rows and ${cols} columns.` },
        { type: 'text', content: `Count across each row: ${cols} squares. Count down the column: ${rows} rows.` },
        { type: 'text', content: `Multiply: ${rows} × ${cols} = ${product} squares total.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      rows,
      cols,
      product,
      difficulty,
      mode
    }
  };
}

function generateAreaGridRectangleFillQuestion(template, variables, random) {
  const mode = 'areaGridRectangleFill';
  const difficulty = template.config?.difficulty || variables.difficulty || 'medium';

  // Adaptive dimension ranges — same tiers as the count skill
  let rowsRange, colsRange;
  if (difficulty === 'easy') {
    rowsRange = template.config?.rowsRange || [2, 3];
    colsRange = template.config?.colsRange || [2, 4];
  } else if (difficulty === 'hard') {
    rowsRange = template.config?.rowsRange || [5, 7];
    colsRange = template.config?.colsRange || [6, 8];
  } else {
    // medium
    rowsRange = template.config?.rowsRange || [3, 5];
    colsRange = template.config?.colsRange || [4, 6];
  }

  const rows = randInt(rowsRange[0], rowsRange[1], random);
  const cols = randInt(colsRange[0], colsRange[1], random);
  const product = rows * cols;

  const color = getRandomColor(random);

  const questionText = `Fill the rectangle grid with cubes. The grid has ${rows} rows and ${cols} columns.`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        // Students copy cubes from the source pool into the grid
        isCopiable: true,
        categories: [
          {
            id: 'grid_rect',
            label: '',
            // Empty grid — all cells need to be filled
            requiredCount: product,
            prefilledCount: 0,
            prefillColor: color.fill,
            prefillStroke: color.stroke,
            rows,
            columns: cols,
            isGrid: true
          }
        ],
        // Source cube item students copy from
        items: [
          {
            id: 'cube_unit',
            content: '',
            visual: 'cube',
            color: color.fill,
            stroke: color.stroke
          }
        ],
        answerKey: { grid_rect: product },
        isVertical: true
      },
      {
        type: 'text',
        content: `Write the multiplication equation:\n\n${rows} rows × ${cols} columns = [[ans]] cubes`,
        style: {
          marginTop: 24,
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      grid_rect: product,
      ans: String(product)
    },
    correctAnswerText: JSON.stringify({
      grid_rect: product,
      ans: String(product)
    }),
    solution: {
      sections: [
        { type: 'text', content: `The grid has ${rows} rows and ${cols} columns.` },
        { type: 'text', content: `Place ${cols} cubes in each of the ${rows} rows.` },
        { type: 'text', content: `${rows} × ${cols} = ${product} cubes in total.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      rows,
      cols,
      product,
      difficulty,
      mode
    }
  };
}

function generateDotArrayQuestion(template, variables, random) {
  const mode = 'dotArray';
  const rowsRange = template.config?.rowsRange || [2, 4];
  const colsRange = template.config?.colsRange || [2, 5];

  const rows = randInt(rowsRange[0], rowsRange[1], random);
  const cols = randInt(colsRange[0], colsRange[1], random);
  const product = rows * cols;

  const color = getRandomColor(random);

  const questionText = `Find the total number of dots in this dot array.`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: false,
        categories: [
          {
            id: 'dot_grid',
            label: '',
            requiredCount: product,
            prefilledCount: product,
            prefillColor: color.fill,
            prefillStroke: color.stroke,
            rows,
            columns: cols,
            isGrid: true,
            visual: 'dot'
          }
        ],
        items: [],
        answerKey: {},
        isVertical: true
      },
      {
        type: 'text',
        content: `Complete the sentence describing the dot array:\n\n[[rows_ans]] rows of [[cols_ans]] dots = [[total_ans]] dots\n\nWrite the multiplication equation:\n\n[[rows_ans2]] × [[cols_ans2]] = [[total_ans2]]`,
        style: {
          marginTop: 24,
          fontSize: '17px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      rows_ans: String(rows),
      cols_ans: String(cols),
      total_ans: String(product),
      rows_ans2: String(rows),
      cols_ans2: String(cols),
      total_ans2: String(product)
    },
    correctAnswerText: JSON.stringify({
      rows_ans: String(rows),
      cols_ans: String(cols),
      total_ans: String(product),
      rows_ans2: String(rows),
      cols_ans2: String(cols),
      total_ans2: String(product)
    }),
    solution: {
      sections: [
        { type: 'text', content: `The dot array has ${rows} rows and ${cols} columns.` },
        { type: 'text', content: `This represents ${rows} rows of ${cols} dots, which is ${product} dots in total.` },
        { type: 'text', content: `The multiplication equation is ${rows} × ${cols} = ${product}.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'cubeArray',
      rows,
      cols,
      product,
      mode
    }
  };
}
