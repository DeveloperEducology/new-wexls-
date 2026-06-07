'use client';

import { useState, useEffect, useMemo } from 'react';
import { evaluateTemplate } from '@/lib/practice/generators/universalEvaluator';
import styles from './templates.module.css';

const DEFAULT_TEMPLATE = {
  id: 'math-subtraction-ten-frame-auto',
  title: 'Subtract with Ten Frame',
  subject: 'math',
  topic: 'ukg-numbers-counting',
  layout: 'prompt_top_visual_center_options_bottom',
  variables: [
    { name: 'A', type: 'integer', min: '5', max: '10' },
    { name: 'B', type: 'integer', min: '1', max: 'A - 1' },
    { name: 'Result', type: 'expression', formula: 'A - B' }
  ],
  visuals: [
    {
      component: 'TenFrame',
      props: {
        filledCount: 'A',
        crossedOutCount: 'B',
        color: 'red'
      }
    }
  ],
  questionText: 'What is [A] minus [B]?',
  optionsType: 'mcq',
  options: [
    { label: '[Result]', isCorrect: true },
    { label: '[Result] + 1', isCorrect: false },
    { label: '[Result] - 1', isCorrect: false },
    { label: '[A]', isCorrect: false }
  ],
  explanation: {
    sections: [
      {
        type: 'text',
        content: 'Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result].'
      }
    ]
  }
};

const VISUAL_COMPONENTS = [
  {
    name: 'None',
    value: '',
    props: {}
  },
  {
    name: 'Ten Frame',
    value: 'TenFrame',
    props: {
      filledCount: 'A',
      crossedOutCount: 'B',
      color: 'red'
    }
  },
  {
    name: 'Jar of Marbles',
    value: 'JarOfMarbles',
    props: {
      colorA: 'blue',
      countA: 'A',
      colorB: 'red',
      countB: 'B'
    }
  },
  {
    name: 'Spinner',
    value: 'Spinner',
    props: {
      colorA: 'blue',
      sectorsA: 'A',
      colorB: 'green',
      sectorsB: 'B'
    }
  },
  {
    name: 'Item Counter Grid',
    value: 'ItemCounter',
    props: {
      count: 'A',
      itemType: 'cupcake'
    }
  },
  {
    name: 'Custom Image',
    value: 'Image',
    props: {
      imageUrl: '',
      width: '200'
    }
  },
  {
    name: 'Visual Choice (Which shows N?)',
    value: 'VisualChoice',
    props: {
      correctCount: 'A',
      itemType: 'cupcake',
      distractorMode: 'auto'
    }
  }
];

const COLORS_LIST = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange'];

const REFERENCE_EXAMPLES = [
  {
    id: "example-mcq",
    title: "Example: Multiple Choice (MCQ)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "5", max: "10" },
      { name: "B", type: "integer", min: "1", max: "A - 1" },
      { name: "Result", type: "expression", formula: "A - B" }
    ],
    visuals: [
      {
        component: "TenFrame",
        props: {
          filledCount: "A",
          crossedOutCount: "B",
          color: "red"
        }
      }
    ],
    questionText: "What is [A] minus [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]", isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]", isCorrect: false }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result]."
        }
      ]
    }
  },
  {
    id: "example-fill-in-the-blank",
    title: "Example: Fill In The Blank (FIB)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "9" },
      { name: "B", type: "integer", min: "2", max: "9" },
      { name: "Result", type: "expression", formula: "A + B" }
    ],
    visuals: [],
    questionText: "Fill in the correct value to complete the addition sentence.",
    optionsType: "fillInTheBlank",
    parts: [
      {
        type: "text",
        content: "[A] + [B] = [[ans]]"
      }
    ],
    answer: {
      ans: "[Result]"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "Adding [A] and [B] gives [Result]. So [A] + [B] = [Result]."
        }
      ]
    }
  },
  {
    id: "example-categorization",
    title: "Example: Categorization (Drag & Drop)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "10" }
    ],
    visuals: [],
    questionText: "Sort the numbers into Even and Odd columns.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        categories: [
          { id: "even", label: "Even Numbers" },
          { id: "odd", label: "Odd Numbers" }
        ],
        items: [
          { id: "item1", content: "2" },
          { id: "item2", content: "3" },
          { id: "item3", content: "4" },
          { id: "item4", content: "5" }
        ],
        answerKey: {
          item1: "even",
          item2: "odd",
          item3: "even",
          item4: "odd"
        }
      }
    ],
    answer: {
      item1: "even",
      item2: "odd",
      item3: "even",
      item4: "odd"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "Even numbers can be divided by 2 without a remainder (e.g. 2, 4), while odd numbers leave a remainder of 1 (e.g. 3, 5)."
        }
      ]
    }
  },
  {
    id: "example-visual-choice",
    title: "Example: Visual Choice",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "5" }
    ],
    visuals: [
      {
        component: "VisualChoice",
        props: {
          correctCount: "A",
          itemType: "cupcake",
          distractorMode: "auto"
        }
      }
    ],
    questionText: "Which plate shows [A] cupcakes?",
    optionsType: "visual_choice",
    explanation: {
      sections: [
        {
          type: "text",
          content: "Count the cupcakes on each plate. The plate with exactly [A] cupcakes is the correct answer."
        }
      ]
    }
  },
  {
    id: "example-hotspot-inside-outside",
    title: "Example: Hotspot (Inside/Outside)",
    subject: "math",
    topic: "ukg-positions-inside-outside",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "animal_label", type: "list", items: ["rabbit", "penguin"] },
      {
        name: "animal_img",
        type: "expression",
        formula: "animal_label == 'rabbit' ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655512965-penguin.png'"
      },
      { name: "target_val", type: "list", items: [0, 1] },
      {
        name: "target_pos",
        type: "expression",
        formula: "target_val == 0 ? 'inside' : 'outside'"
      },
      {
        name: "resolved_image",
        type: "expression",
        formula: "animal_label == 'rabbit' ? (target_val == 0 ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762227249-rabbit-inside-gif.webp' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762118296-rabbit-outside-gif.webp') : (target_val == 0 ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762183192-penguin-inside-gif.webp' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762080125-penguin-outside-gif.webp')"
      }
    ],
    visuals: [],
    questionText: "Click the box where the [animal_label] is **[target_pos]**.",
    optionsType: "hotspot_select",
    parts: [
      {
        type: "hotspot_canvas",
        backgroundUrl: "[resolved_image]",
        canvasWidth: 500,
        canvasHeight: 320,
        transparent: true,
        hotspots: [
          { id: "box_a", label: "Box A", x: 20, y: 150, width: 220, height: 150, optionIndex: 0 },
          { id: "box_b", label: "Box B", x: 260, y: 150, width: 220, height: 150, optionIndex: 1 }
        ]
      }
    ],
    options: [
      { label: "Box A", isCorrect: "target_val == 0" },
      { label: "Box B", isCorrect: "target_val == 1" }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Look at the picture. The [animal_label] is [target_pos] the box, which is [Result]."
        }
      ]
    }
  },
  {
    id: "example-hotspot-dynamic-composition",
    title: "Example: Hotspot (Dynamic Scene Composition)",
    subject: "math",
    topic: "ukg-positions-inside-outside",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "animal_label", type: "list", items: ["rabbit", "penguin"] },
      {
        name: "animal_img",
        type: "expression",
        formula: "animal_label == 'rabbit' ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655512965-penguin.png'"
      },
      { name: "container_type", type: "list", items: ["box", "bowl", "basket", "circle", "house"] },
      { name: "target_val", type: "list", items: [0, 1] },
      { name: "target_pos", type: "list", items: ["inside", "outside"] },
      {
        name: "placement_0",
        type: "expression",
        formula: "target_val == 0 ? target_pos : (target_pos == 'inside' ? 'outside' : 'inside')"
      },
      {
        name: "placement_1",
        type: "expression",
        formula: "target_val == 1 ? target_pos : (target_pos == 'inside' ? 'outside' : 'inside')"
      }
    ],
    visuals: [],
    questionText: "Click the **[container_type]** where the [animal_label] is **[target_pos]**.",
    optionsType: "hotspot_select",
    parts: [
      {
        type: "hotspot_canvas",
        canvasWidth: 500,
        canvasHeight: 320,
        transparent: true,
        composeScene: {
          containerType: "[container_type]",
          targetClipart: "[animal_img]",
          placements: [
            "[placement_0]",
            "[placement_1]"
          ]
        },
        hotspots: [
          { id: "box_a", label: "Box A", x: 40, y: 120, width: 180, height: 160, optionIndex: 0 },
          { id: "box_b", label: "Box B", x: 280, y: 120, width: 180, height: 160, optionIndex: 1 }
        ]
      }
    ],
    options: [
      { label: "Box A", isCorrect: "target_val == 0" },
      { label: "Box B", isCorrect: "target_val == 1" }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Looking at the picture, the [animal_label] is [target_pos] the [container_type] on the [target_val == 0 ? 'left (Box A)' : 'right (Box B)']."
        }
      ]
    }
  }
];

// ─── Math Starter Templates ───────────────────────────────────────────────────
// Ready-made configs for common math concepts. Load any in one click, then
// customise the variables, visual, and options as needed.
const MATH_STARTERS = [
  // ── Odd / Even ──────────────────────────────────────────────────────────────
  {
    id: "starter-odd-even-mcq",
    title: "Odd / Even — MCQ",
    emoji: "🔢",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "N", type: "integer", min: "1", max: "20" },
      { name: "IsEven", type: "expression", formula: "N % 2 === 0 ? 1 : 0" }
    ],
    visuals: [],
    questionText: "Is [N] odd or even?",
    optionsType: "mcq",
    shuffleOptions: false,
    options: [
      { label: "Even", isCorrect: "N % 2 === 0" },
      { label: "Odd",  isCorrect: "N % 2 !== 0" }
    ],
    explanation: {
      sections: [{
        type: "text",
        content: "[N] divided by 2 leaves a remainder of [N % 2]. So [N] is [N % 2 === 0 ? 'even' : 'odd']."
      }]
    }
  },
  {
    id: "starter-odd-even-sort",
    title: "Odd / Even — Sort (Drag & Drop)",
    emoji: "🔢",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "N", type: "integer", min: "1", max: "20" }
    ],
    visuals: [],
    questionText: "Sort these numbers into Even and Odd.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        categories: [
          { id: "even", label: "Even" },
          { id: "odd",  label: "Odd" }
        ],
        items: [
          { id: "n2", content: "2" },
          { id: "n3", content: "3" },
          { id: "n6", content: "6" },
          { id: "n7", content: "7" },
          { id: "n10", content: "10" },
          { id: "n11", content: "11" }
        ],
        answerKey: {
          n2: "even", n3: "odd", n6: "even",
          n7: "odd", n10: "even", n11: "odd"
        }
      }
    ],
    answer: { n2: "even", n3: "odd", n6: "even", n7: "odd", n10: "even", n11: "odd" },
    explanation: {
      sections: [{ type: "text", content: "Even numbers end in 0, 2, 4, 6, 8. Odd numbers end in 1, 3, 5, 7, 9." }]
    }
  },
  {
    id: "starter-shape-sorting-clipart",
    title: "Shape Sorting — SVG Drag & Drop",
    emoji: "📐",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [],
    visuals: [],
    questionText: "Sort the shapes into the correct columns.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        layoutMode: "category_sort",
        htmlLayout: "category_sort",
        cardStyle: "transparent",
        categories: [
          { id: "circles", label: "Circles" },
          { id: "triangles", label: "Triangles" }
        ],
        items: [
          { id: "c1", content: "Circle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"#fbbf24\" stroke=\"#d97706\" stroke-width=\"4\"/></svg>", imageWidth: "80" },
          { id: "c2", content: "Circle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"#ef4444\" stroke=\"#b91c1c\" stroke-width=\"4\"/></svg>", imageWidth: "80" },
          { id: "t1", content: "Triangle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><polygon points=\"50,15 85,85 15,85\" fill=\"#3b82f6\" stroke=\"#1d4ed8\" stroke-width=\"4\"/></svg>", imageWidth: "80" },
          { id: "t2", content: "Triangle", svg: "<svg viewBox=\"0 0 100 100\" width=\"100%\" height=\"auto\"><polygon points=\"50,15 85,85 15,85\" fill=\"#10b981\" stroke=\"#047857\" stroke-width=\"4\"/></svg>", imageWidth: "80" }
        ],
        answerKey: {
          c1: "circles", c2: "circles", t1: "triangles", t2: "triangles"
        }
      }
    ],
    answer: { c1: "circles", c2: "circles", t1: "triangles", t2: "triangles" },
    explanation: {
      sections: [{ type: "text", content: "Circles go under 'Circles' and triangles go under 'Triangles'!" }]
    }
  },
  // ── Addition ─────────────────────────────────────────────────────────────────
  {
    id: "starter-addition-basic",
    title: "Addition — Basic MCQ",
    emoji: "➕",
    subject: "math",
    topic: "grade1-addition-basics",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "20" },
      { name: "B", type: "integer", min: "1", max: "20" },
      { name: "Result", type: "expression", formula: "A + B" }
    ],
    visuals: [],
    questionText: "What is [A] + [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",     isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]",          isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[A] + [B] = [Result]." }]
    }
  },
  {
    id: "starter-addition-carry",
    title: "Addition — With Carry (2-digit)",
    emoji: "➕",
    subject: "math",
    topic: "grade2-addition-carry",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "15", max: "99" },
      { name: "B", type: "integer", min: "15", max: "99" },
      { name: "Result",   type: "expression", formula: "A + B" },
      { name: "HasCarry", type: "expression", formula: "(A % 10 + B % 10) >= 10 ? 1 : 0" },
      { name: "CarryOut", type: "expression", formula: "Math.floor((A % 10 + B % 10) / 10)" }
    ],
    visuals: [],
    questionText: "What is [A] + [B]?",
    optionsType: "fillInTheBlank",
    metaConfig: { hasCarry: true },
    parts: [
      { type: "text", content: "  [A]\n+ [B]\n——\n[[ans]]" }
    ],
    answer: { ans: "[Result]" },
    explanation: {
      sections: [{ type: "text", content: "Add the ones: [A % 10] + [B % 10] = [A % 10 + B % 10]. [HasCarry === 1 ? 'Carry the 1 to tens.' : 'No carry needed.'] Add the tens: [Math.floor(A/10)] + [Math.floor(B/10)] + [CarryOut] = [Math.floor(A/10) + Math.floor(B/10) + CarryOut]. Answer: [Result]." }]
    }
  },
  // ── Subtraction ──────────────────────────────────────────────────────────────
  {
    id: "starter-subtraction-basic",
    title: "Subtraction — Basic MCQ",
    emoji: "➖",
    subject: "math",
    topic: "grade1-subtraction-basics",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "5", max: "20" },
      { name: "B", type: "integer", min: "1", max: "A - 1" },
      { name: "Result", type: "expression", formula: "A - B" }
    ],
    visuals: [
      { component: "TenFrame", props: { filledCount: "A", crossedOutCount: "B", color: "red" } }
    ],
    questionText: "What is [A] - [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",     isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]",          isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "Start with [A], take away [B]. [A] - [B] = [Result]." }]
    }
  },
  {
    id: "starter-subtraction-borrow",
    title: "Subtraction — With Borrowing (2-digit)",
    emoji: "➖",
    subject: "math",
    topic: "grade2-subtraction-borrow",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "20", max: "99" },
      { name: "B", type: "integer", min: "10", max: "A - 1" },
      { name: "Result",    type: "expression", formula: "A - B" },
      { name: "NeedsBorrow", type: "expression", formula: "A % 10 < B % 10 ? 1 : 0" }
    ],
    visuals: [],
    questionText: "What is [A] - [B]?",
    optionsType: "fillInTheBlank",
    metaConfig: { hasBorrow: true },
    parts: [
      { type: "text", content: "  [A]\n- [B]\n——\n[[ans]]" }
    ],
    answer: { ans: "[Result]" },
    explanation: {
      sections: [{ type: "text", content: "[NeedsBorrow === 1 ? 'Borrow 10 from the tens place. ' : '']Subtract ones: [A % 10 < B % 10 ? A % 10 + 10 : A % 10] - [B % 10] = [A % 10 < B % 10 ? A % 10 + 10 - B % 10 : A % 10 - B % 10]. Subtract tens: [Math.floor(A/10) - (A % 10 < B % 10 ? 1 : 0)] - [Math.floor(B/10)] = [Math.floor(A/10) - (A % 10 < B % 10 ? 1 : 0) - Math.floor(B/10)]. Answer: [Result]." }]
    }
  },
  // ── Multiplication ───────────────────────────────────────────────────────────
  {
    id: "starter-multiplication-basic",
    title: "Multiplication — Basic MCQ",
    emoji: "✖️",
    subject: "math",
    topic: "grade2-multiplication",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "12" },
      { name: "B", type: "integer", min: "2", max: "12" },
      { name: "Result", type: "expression", formula: "A * B" }
    ],
    visuals: [],
    questionText: "What is [A] × [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",         isCorrect: true },
      { label: "[Result] + [B]",   isCorrect: false },
      { label: "[Result] - [B]",   isCorrect: false },
      { label: "[A] + [B]",        isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[A] groups of [B] = [A] × [B] = [Result]." }]
    }
  },
  {
    id: "starter-multiplication-fib",
    title: "Multiplication — Fill In The Blank",
    emoji: "✖️",
    subject: "math",
    topic: "grade2-multiplication",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "12" },
      { name: "B", type: "integer", min: "2", max: "12" },
      { name: "Result", type: "expression", formula: "A * B" }
    ],
    visuals: [],
    questionText: "Complete the multiplication sentence.",
    optionsType: "fillInTheBlank",
    parts: [
      { type: "text", content: "[A] × [B] = [[ans]]" }
    ],
    answer: { ans: "[Result]" },
    explanation: {
      sections: [{ type: "text", content: "[A] × [B] = [Result]. Think of it as [A] groups of [B]." }]
    }
  },
  {
    id: "starter-times-table",
    title: "Times Table Quiz — MCQ",
    emoji: "✖️",
    subject: "math",
    topic: "grade3-times-tables",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Table", type: "integer", min: "2", max: "12" },
      { name: "N",     type: "integer", min: "1", max: "12" },
      { name: "Result", type: "expression", formula: "Table * N" }
    ],
    visuals: [],
    questionText: "[Table] × [N] = ?",
    optionsType: "mcq",
    options: [
      { label: "[Result]",         isCorrect: true },
      { label: "[Result] + [Table]",isCorrect: false },
      { label: "[Result] - [Table]",isCorrect: false },
      { label: "[Table] + [N]",     isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[Table] × [N] = [Result]. (Table of [Table]: [Table]×[N] = [Result])" }]
    }
  },
  // ── Division ─────────────────────────────────────────────────────────────────
  {
    id: "starter-division-exact",
    title: "Division — Exact (No Remainder)",
    emoji: "➗",
    subject: "math",
    topic: "grade3-division",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Divisor",  type: "integer", min: "2", max: "10" },
      { name: "Quotient", type: "integer", min: "2", max: "12" },
      { name: "Dividend", type: "expression", formula: "Divisor * Quotient" }
    ],
    visuals: [],
    questionText: "What is [Dividend] ÷ [Divisor]?",
    optionsType: "mcq",
    options: [
      { label: "[Quotient]",       isCorrect: true },
      { label: "[Quotient] + 1",   isCorrect: false },
      { label: "[Quotient] - 1",   isCorrect: false },
      { label: "[Divisor]",        isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "[Dividend] ÷ [Divisor] = [Quotient] because [Divisor] × [Quotient] = [Dividend]." }]
    }
  },
  {
    id: "starter-division-remainder",
    title: "Division — With Remainder",
    emoji: "➗",
    subject: "math",
    topic: "grade3-division",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Dividend", type: "integer", min: "10", max: "99" },
      { name: "Divisor",  type: "integer", min: "2",  max: "9" },
      { name: "Quotient",   type: "expression", formula: "Math.floor(Dividend / Divisor)" },
      { name: "Remainder",  type: "expression", formula: "Dividend % Divisor" },
      { name: "HasRemainder", type: "expression", formula: "Dividend % Divisor !== 0 ? 1 : 0" }
    ],
    visuals: [],
    questionText: "What is [Dividend] ÷ [Divisor]?",
    optionsType: "fillInTheBlank",
    metaConfig: { hasRemainder: true },
    parts: [
      { type: "text", content: "[Dividend] ÷ [Divisor] = [[q]] remainder [[r]]" }
    ],
    answer: { q: "[Quotient]", r: "[Remainder]" },
    explanation: {
      sections: [{ type: "text", content: "[Divisor] × [Quotient] = [Divisor * Quotient]. [Dividend] − [Divisor * Quotient] = [Remainder]. So [Dividend] ÷ [Divisor] = [Quotient] remainder [Remainder]." }]
    }
  },
  // ── Numbers & Comparison ───────────────────────────────────────────────────
  {
    id: "starter-number-comparison",
    title: "Number Comparison — MCQ",
    emoji: "🔢",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "50" },
      { name: "B", type: "integer", min: "1", max: "50" },
      { name: "Rel", type: "expression", formula: "A > B ? '>' : (A < B ? '<' : '=')" }
    ],
    visuals: [],
    questionText: "Compare [A] and [B]. Which sign makes the statement true? \n [A] ___ [B]",
    optionsType: "mcq",
    options: [
      { label: "[A] > [B]", isCorrect: "A > B" },
      { label: "[A] < [B]", isCorrect: "A < B" },
      { label: "[A] = [B]", isCorrect: "A === B" }
    ],
    explanation: {
      sections: [{ type: "text", content: "[A] is [A > B ? 'greater than' : (A < B ? 'less than' : 'equal to')] [B]. So, the correct symbol is [Rel]." }]
    }
  },
  // ── Multiplication Array Model ──────────────────────────────────────────────
  {
    id: "starter-multiplication-array",
    title: "Multiplication — Array Model MCQ",
    emoji: "✖️",
    subject: "math",
    topic: "grade2-multiplication",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "Rows", type: "integer", min: "2", max: "5" },
      { name: "Cols", type: "integer", min: "2", max: "6" },
      { name: "Total", type: "expression", formula: "Rows * Cols" }
    ],
    visuals: [
      {
        component: "ItemCounter",
        props: {
          count: "Total",
          itemType: "apple",
          width: "90"
        }
      }
    ],
    questionText: "Look at the array of apples. It has [Rows] rows and [Cols] columns. Which multiplication sentence shows the total number of apples?",
    optionsType: "mcq",
    options: [
      { label: "[Rows] × [Cols] = [Total]", isCorrect: true },
      { label: "[Rows] + [Cols] = [Rows + Cols]", isCorrect: false },
      { label: "[Rows] × [Rows] = [Rows * Rows]", isCorrect: false },
      { label: "[Cols] × [Cols] = [Cols * Cols]", isCorrect: false }
    ],
    explanation: {
      sections: [{ type: "text", content: "There are [Rows] rows of apples, with [Cols] apples in each row. [Rows] groups of [Cols] is written as [Rows] × [Cols] = [Total]." }]
    }
  }
];

const cleanSvgContent = (svgStr) => {
  if (!svgStr) return '';
  let cleaned = svgStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
  cleaned = cleaned.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
};

const isInlineSvg = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg');
};

const getImageUrlPreview = (value) => {
  if (!value || typeof value !== 'string') return null;
  let cleanValue = value.trim();
  
  // Handle prefix like button::https://...
  if (cleanValue.includes('::')) {
    const parts = cleanValue.split('::');
    const urlPart = parts.find(p => p.trim().startsWith('http'));
    if (urlPart) {
      cleanValue = urlPart.trim();
    } else {
      cleanValue = parts[parts.length - 1].trim();
    }
  }
  
  // Handle comma-separated list of URLs
  if (cleanValue.includes(',')) {
    const urls = cleanValue.split(',');
    const firstUrl = urls.find(u => u.trim().startsWith('http'));
    if (firstUrl) {
      cleanValue = firstUrl.trim();
    } else {
      cleanValue = urls[0].trim();
    }
  }

  // Only return if it starts with http, / (relative path), or data: (data URI)
  if (cleanValue.startsWith('http') || cleanValue.startsWith('/') || cleanValue.startsWith('data:')) {
    return cleanValue;
  }
  
  return null;
};

export default function VisualTemplateBuilderPage() {
  // Database templates state
  const [dynamicTemplates, setDynamicTemplates] = useState([]);
  const [staticTemplates, setStaticTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Guide modal states
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('overview');

  // Editor State
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Simulator State
  const [currentStep, setCurrentStep] = useState(1);
  const [seed, setSeed] = useState('12345');
  const [showJson, setShowJson] = useState(false);
  
  // Advanced Live Preview State
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [previewControls, setPreviewControls] = useState({
    randomizeItems: false,
    randomizeOrder: false,
    showCorrectAnswer: false,
    previewAsStudent: true
  });
  const [sampleSet, setSampleSet] = useState('Sample Set 1');

  // Code editor state
  const [editorMode, setEditorMode] = useState('form'); // 'form' or 'json'
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_TEMPLATE, null, 2));
  const [jsonError, setJsonError] = useState(null);

  // Gallery and Custom Selector States
  const [useCustomItemType, setUseCustomItemType] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState([]);
  const [galleryImageLabels, setGalleryImageLabels] = useState({}); // { [url]: customLabel }
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryTargetProp, setGalleryTargetProp] = useState(''); // 'itemType' or 'imageUrl'

  // Modal search and web import states
  const [gallerySearch, setGallerySearch] = useState('');
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchType, setWebSearchType] = useState('clipart');
  const [webResults, setWebResults] = useState([]);
  const [webSearching, setWebSearching] = useState(false);
  const [importingUrl, setImportingUrl] = useState(null);
  const [importedWebUrls, setImportedWebUrls] = useState({}); // { [remoteUrl]: localR2Url }

  // AI Template Builder states
  const [aiTemplatePrompt, setAiTemplatePrompt] = useState('');
  const [aiTemplateGenerating, setAiTemplateGenerating] = useState(false);
  const [aiTemplateSuccessMsg, setAiTemplateSuccessMsg] = useState('');

  // Upgraded Gallery states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Metadata Editor states
  const [editingMetaItem, setEditingMetaItem] = useState(null); // img object
  const [metaEditSingular, setMetaEditSingular] = useState('');
  const [metaEditPlural, setMetaEditPlural] = useState('');
  const [metaEditArticle, setMetaEditArticle] = useState('a');
  const [metaEditCategory, setMetaEditCategory] = useState('general');
  const [metaEditTags, setMetaEditTags] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  // Gallery Direct Upload states
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryDragOver, setGalleryDragOver] = useState(false);
  
  // Gallery zoom lightbox
  const [galleryZoomImg, setGalleryZoomImg] = useState(null);
  const [activeHsIdx, setActiveHsIdx] = useState(0);

  // Curriculum skill linking states
  const [linkToSkill, setLinkToSkill] = useState(false);
  const [curriculumNodes, setCurriculumNodes] = useState([]);
  const [skillSubject, setSkillSubject] = useState('math');
  const [skillSubjectCustomId, setSkillSubjectCustomId] = useState('');
  const [skillSubjectCustomTitle, setSkillSubjectCustomTitle] = useState('');
  const [skillTopic, setSkillTopic] = useState('');
  const [skillTopicCustomId, setSkillTopicCustomId] = useState('');
  const [skillTopicCustomTitle, setSkillTopicCustomTitle] = useState('');
  const [skillChapter, setSkillChapter] = useState('');
  const [skillChapterCustomId, setSkillChapterCustomId] = useState('');
  const [skillChapterCustomTitle, setSkillChapterCustomTitle] = useState('');
  const [skillGrade, setSkillGrade] = useState('');
  const [skillTitle, setSkillTitle] = useState('');
  const [skillIdInput, setSkillIdInput] = useState('');
  const [skillCode, setSkillCode] = useState('');
  const [skillOrder, setSkillOrder] = useState('0');
  // Difficulty scaling state
  const [skillDifficultyScaling, setSkillDifficultyScaling] = useState(false);
  const [skillTemplateLevels, setSkillTemplateLevels] = useState([
    { level: 1, templateIds: [] },
    { level: 2, templateIds: [] },
    { level: 3, templateIds: [] },
  ]);
  const [levelAddInputs, setLevelAddInputs] = useState({ 1: '', 2: '', 3: '' });
  const [expandedLevel, setExpandedLevel] = useState(1);


  const handleAiTemplateGenerate = async () => {
    if (!aiTemplatePrompt.trim()) return;
    setAiTemplateGenerating(true);
    setAiTemplateSuccessMsg('');
    try {
      const res = await fetch('/api/admin/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiTemplatePrompt,
          subject: template.subject || 'math',
          topic: template.topic || 'general'
        })
      });
      const data = await res.json();
      if (data.success && data.template) {
        const generated = data.template;
        setTemplate({
          ...generated,
          variables: generated.variables || [],
          visuals: generated.visuals || [],
          options: generated.options || [],
          explanation: generated.explanation || { sections: [{ type: 'text', content: '' }] }
        });
        setJsonText(JSON.stringify(generated, null, 2));
        setAiTemplateSuccessMsg('✨ AI successfully generated the template! Check it out below.');
        setTimeout(() => setAiTemplateSuccessMsg(''), 5000);
      } else {
        alert(`Failed to generate template: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('AI template generation failed:', err);
      alert(`AI template generation failed: ${err.message}`);
    } finally {
      setAiTemplateGenerating(false);
    }
  };

  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    try {
      const fd = new FormData();
      fd.append('folder', 'images');
      fd.append('maxWidth', '1200');
      fd.append('quality', '85');
      fd.append('format', 'image/webp');
      Array.from(files).forEach(file => {
        fd.append('files[]', file);
      });
      
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      if (data.results && data.results.length > 0) {
        const listRes = await fetch('/api/admin/list-images?prefix=images/');
        const listData = await listRes.json();
        setGalleryImages(listData.images || []);
        
        // Auto-select the first uploaded image
        const firstUploadedUrl = data.results[0].url;
        setSelectedGalleryUrls(prev => {
          if (!prev.includes(firstUploadedUrl)) {
            return [...prev, firstUploadedUrl];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Direct upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleOpenEditMetadata = (img) => {
    setEditingMetaItem(img);
    setMetaEditSingular(img.linguistics?.singular || '');
    setMetaEditPlural(img.linguistics?.plural || '');
    setMetaEditArticle(img.linguistics?.article || 'a');
    setMetaEditCategory(img.classification?.category || 'general');
    setMetaEditTags(Array.isArray(img.classification?.tags) ? img.classification.tags.join(', ') : '');
  };

  const handleSaveMetadata = async () => {
    if (!editingMetaItem) return;
    setIsSavingMeta(true);
    try {
      const tagsArray = metaEditTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/admin/update-image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingMetaItem.key,
          linguistics: {
            singular: metaEditSingular,
            plural: metaEditPlural,
            article: metaEditArticle
          },
          classification: {
            category: metaEditCategory,
            tags: tagsArray
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setGalleryImages(prev => prev.map(img => {
          if (img.key === editingMetaItem.key) {
            return {
              ...img,
              linguistics: { singular: metaEditSingular, plural: metaEditPlural, article: metaEditArticle },
              classification: { category: metaEditCategory, tags: tagsArray }
            };
          }
          return img;
        }));
        setEditingMetaItem(null);
      } else {
        alert(`Failed to save metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed saving metadata:', err);
      alert(`Failed saving metadata: ${err.message}`);
    } finally {
      setIsSavingMeta(false);
    }
  };


  const openGallery = async (targetProp, currentVal = '') => {
    setGalleryTargetProp(targetProp);
    setShowGallery(true);
    setGalleryLoading(true);
    setGallerySearch('');
    setIsWebSearch(false);
    webSearchQuery && setWebSearchQuery('');
    setWebResults([]);
    setWebSearching(false);
    setImportingUrl(null);
    
    // Parse current values — support both legacy "url, url" and new "label::url, label::url" formats
    let initialSelected = [];
    let initialLabels = {};
    const rawEntries = typeof currentVal === 'string' && currentVal.trim()
      ? currentVal.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(currentVal) ? currentVal : [];
    for (const entry of rawEntries) {
      if (entry.includes('::')) {
        const [label, url] = entry.split('::').map(s => s.trim());
        if (url) {
          initialSelected.push(url);
          if (label) initialLabels[url] = label;
        }
      } else {
        initialSelected.push(entry);
      }
    }
    setSelectedGalleryUrls(initialSelected);
    setGalleryImageLabels(initialLabels);
    
    try {
      const res = await fetch('/api/admin/list-images?prefix=images/');
      const data = await res.json();
      setGalleryImages(data.images || []);
    } catch (err) {
      console.error('Failed to load gallery images:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSelectGalleryImage = (url) => {
    setSelectedGalleryUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const applyGallerySelection = () => {
    // Encode as "label::url" when a custom label exists, otherwise just "url"
    const entries = selectedGalleryUrls.map(url => {
      const label = (galleryImageLabels[url] || '').trim();
      return label ? `${label}::${url}` : url;
    });
    const valueStr = entries.join(', ');

    if (galleryTargetProp === 'backgroundUrl') {
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'hotspot_canvas');
      if (partIdx >= 0) {
        newParts[partIdx] = { ...newParts[partIdx], backgroundUrl: valueStr };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp === 'composeScene.targetClipart') {
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'hotspot_canvas');
      if (partIdx >= 0 && newParts[partIdx].composeScene) {
        newParts[partIdx] = {
          ...newParts[partIdx],
          composeScene: {
            ...newParts[partIdx].composeScene,
            targetClipart: valueStr
          }
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('dnd_category_prefillImageUrl_')) {
      const catIdx = parseInt(galleryTargetProp.replace('dnd_category_prefillImageUrl_', ''), 10);
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
      if (partIdx >= 0 && newParts[partIdx].categories?.[catIdx]) {
        newParts[partIdx].categories[catIdx] = {
          ...newParts[partIdx].categories[catIdx],
          prefillImageUrl: valueStr
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('dnd_item_imageUrl_')) {
      const itemIdx = parseInt(galleryTargetProp.replace('dnd_item_imageUrl_', ''), 10);
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
      if (partIdx >= 0 && newParts[partIdx].items?.[itemIdx]) {
        newParts[partIdx].items[itemIdx] = {
          ...newParts[partIdx].items[itemIdx],
          imageUrl: valueStr
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('variable_items_')) {
      const varIdx = parseInt(galleryTargetProp.replace('variable_items_', ''), 10);
      updateVariable(varIdx, 'items', entries);
    } else {
      updateVisualProp(galleryTargetProp, valueStr);
    }
    
    if (galleryTargetProp === 'itemType') {
      setUseCustomItemType(true);
    }
    
    setShowGallery(false);
  };

  // Extracted list of all categories dynamically
  const availableCategories = useMemo(() => {
    const cats = new Set();
    galleryImages.forEach(img => {
      const cat = img.classification?.category || 'general';
      cats.add(cat.toLowerCase().trim());
    });
    return ['all', ...Array.from(cats)];
  }, [galleryImages]);

  // Extracted list of popular tags dynamically
  const popularTags = useMemo(() => {
    const tagsMap = {};
    galleryImages.forEach(img => {
      if (img.classification?.tags) {
        img.classification.tags.forEach(t => {
          const clean = t.toLowerCase().trim();
          if (clean && clean !== 'imported-asset') {
            tagsMap[clean] = (tagsMap[clean] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(tagsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(entry => entry[0]);
  }, [galleryImages]);

  // Local image list filter
  const filteredLocalImages = useMemo(() => {
    let list = galleryImages;
    
    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(img => (img.classification?.category || 'general').toLowerCase().trim() === selectedCategory);
    }
    
    // Tag chip filter
    if (selectedTag) {
      list = list.filter(img => img.classification?.tags?.some(t => t.toLowerCase().trim() === selectedTag));
    }
    
    // Query search filter
    if (gallerySearch.trim()) {
      const q = gallerySearch.toLowerCase();
      list = list.filter(img => {
        const nameMatch = (img.name || '').toLowerCase().includes(q);
        const keyMatch = (img.key || '').toLowerCase().includes(q);
        const tagMatch = img.classification?.tags?.some(t => t.toLowerCase().includes(q));
        const categoryMatch = (img.classification?.category || '').toLowerCase().includes(q);
        return nameMatch || keyMatch || tagMatch || categoryMatch;
      });
    }
    
    return list;
  }, [galleryImages, gallerySearch, selectedCategory, selectedTag]);

  // Handle DuckDuckGo web image search
  const handleWebSearch = async (e) => {
    if (e) e.preventDefault();
    if (!webSearchQuery.trim()) return;
    setWebSearching(true);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(webSearchQuery)}&type=${webSearchType}`);
      const data = await res.json();
      if (data.success) {
        setWebResults(data.results || []);
      } else {
        console.error('Web search error:', data.error);
      }
    } catch (err) {
      console.error('Failed web search:', err);
    } finally {
      setWebSearching(false);
    }
  };

  // Import remote image to R2 and database
  const handleImportWebImage = async (remoteUrl) => {
    // If already imported in this session, toggle selection
    if (importedWebUrls[remoteUrl]) {
      const localUrl = importedWebUrls[remoteUrl];
      setSelectedGalleryUrls(prev => {
        if (prev.includes(localUrl)) {
          return prev.filter(u => u !== localUrl);
        } else {
          return [...prev, localUrl];
        }
      });
      return;
    }

    setImportingUrl(remoteUrl);
    try {
      const res = await fetch('/api/admin/fetch-url-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: remoteUrl,
          folder: 'images',
          customName: webSearchQuery || 'imported-web'
        })
      });
      const data = await res.json();
      if (data.r2Url) {
        const newLocalUrl = data.r2Url;
        
        // Add to imported map
        setImportedWebUrls(prev => ({ ...prev, [remoteUrl]: newLocalUrl }));
        
        // Add to selection list
        setSelectedGalleryUrls(prev => [...prev, newLocalUrl]);
        
        // Add new asset to local list
        const cleanName = data.key.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ');
        const newImgObj = {
          key: data.key,
          url: newLocalUrl,
          name: cleanName,
          classification: data.classification || { tags: ['imported-asset'], category: 'imported' }
        };
        setGalleryImages(prev => [newImgObj, ...prev]);
      } else {
        alert(`Failed to import image: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImportingUrl(null);
    }
  };

  // Load templates on mount
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        setDynamicTemplates(data.dynamicTemplates || []);
        setStaticTemplates(data.templates || {});
        
        // Auto select by query param id
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlId = params.get('id');
          const isDuplicate = params.get('duplicate') === 'true';
          if (urlId) {
            const tpl = (data.dynamicTemplates || []).find(t => t.id === urlId) ||
                        Object.values(data.templates || {}).find(t => t.id === urlId);
            if (tpl) {
              if (isDuplicate) {
                const copyTpl = {
                  ...tpl,
                  id: `${tpl.id}-copy-${Date.now()}`,
                  title: `${tpl.title || 'Untitled'} (Copy)`
                };
                handleSelectTemplate(copyTpl);
                setSelectedId(null);
              } else {
                handleSelectTemplate(tpl);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumNodes = async () => {
    try {
      const res = await fetch('/api/admin/curriculum?limit=1000');
      const data = await res.json();
      if (data.success && data.nodes) {
        setCurriculumNodes(data.nodes);
      }
    } catch (err) {
      console.error('Failed to fetch curriculum nodes:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCurriculumNodes();
  }, []);

  useEffect(() => {
    if (editorMode === 'form') {
      setJsonText(JSON.stringify(template, null, 2));
    }
  }, [template, editorMode]);

  // Auto-fill link skill fields when template changes
  useEffect(() => {
    if (template) {
      setSkillTitle(template.title || '');
      setSkillIdInput(template.id || '');
      
      const subj = template.subject || 'math';
      setSkillSubject(subj);
      setSkillSubjectCustomId('');
      setSkillSubjectCustomTitle('');

      const topic = template.topic || '';
      setSkillTopic(topic);
      setSkillTopicCustomId('');
      setSkillTopicCustomTitle('');

      const chap = topic ? `${topic}-chapter` : '';
      setSkillChapter(chap);
      setSkillChapterCustomId('');
      setSkillChapterCustomTitle('');

      setSkillGrade('');
      setSkillCode('');
      setSkillOrder('0');
    }
  }, [template.id]);

  // Auto-initialize hotspot canvas properties when changed to hotspot_select
  useEffect(() => {
    if (template.optionsType === 'hotspot_select') {
      const hasPart = Array.isArray(template.parts) && template.parts.some(p => p.type === 'hotspot_canvas');
      if (!hasPart) {
        const currentParts = Array.isArray(template.parts) ? template.parts : [];
        const newParts = [
          ...currentParts,
          {
            type: 'hotspot_canvas',
            backgroundUrl: '',
            canvasWidth: 500,
            canvasHeight: 320,
            transparent: true,
            hotspots: [
              { id: 'box_a', label: 'Box A', x: 20, y: 150, width: 220, height: 150, optionIndex: 0 },
              { id: 'box_b', label: 'Box B', x: 260, y: 150, width: 220, height: 150, optionIndex: 1 }
            ]
          }
        ];
        updateField('parts', newParts);
        setActiveHsIdx(0);
      }
    }
  }, [template.optionsType]);


  // Handle template selection from sidebar
  const handleSelectTemplate = (tpl) => {
    setSelectedId(tpl.id);
    
    // Ensure explanation structure is normalized
    const normalized = {
      ...tpl,
      variables: tpl.variables || [],
      visuals: tpl.visuals || [],
      options: tpl.options || [],
      explanation: tpl.explanation || { sections: [{ type: 'text', content: '' }] }
    };
    
    setTemplate(normalized);
    setJsonText(JSON.stringify(normalized, null, 2));
    setJsonError(null);
    setSaveStatus(null);
  };

  // Start a new template
  const handleNewTemplate = () => {
    setSelectedId(null);
    const uniqueId = `template-${Date.now()}`;
    const newTpl = {
      ...DEFAULT_TEMPLATE,
      id: uniqueId,
      title: 'New Custom Template'
    };
    setTemplate(newTpl);
    setJsonText(JSON.stringify(newTpl, null, 2));
    setJsonError(null);
    setSaveStatus(null);
  };

  // Deep update helper
  const updateField = (field, value) => {
    setTemplate(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-update ID if title changes and it's a new unsaved template
      if (field === 'title' && !selectedId) {
        const slug = value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        next.id = slug ? `template-${slug}` : `template-${Date.now()}`;
      }
      
      return next;
    });
  };

  const updateMetaConfigProp = (propName, propVal) => {
    setTemplate(prev => {
      const next = { ...prev };
      next.metaConfig = {
        ...(prev.metaConfig || {}),
        [propName]: propVal
      };
      return next;
    });
  };

  const updateDndPartProp = (propName, propVal) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      newParts[partIdx] = {
        ...newParts[partIdx],
        [propName]: propVal
      };
      // Keep htmlLayout in sync with layoutMode
      if (propName === 'layoutMode') {
        newParts[partIdx].htmlLayout = propVal;
      }
      updateField('parts', newParts);
    }
  };

  const initDndPart = () => {
    updateField('parts', [
      {
        type: 'categorizationv2',
        layoutMode: 'category_sort',
        htmlLayout: 'category_sort',
        cardStyle: 'standard',
        categories: [
          { id: 'cat_1', label: 'Category 1' },
          { id: 'cat_2', label: 'Category 2' }
        ],
        items: [
          { id: 'item_1', content: 'Item 1' },
          { id: 'item_2', content: 'Item 2' }
        ],
        answerKey: {
          'item_1': 'cat_1',
          'item_2': 'cat_2'
        }
      }
    ]);
  };

  const updateDndCategory = (catIdx, field, val) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const categories = [...(part.categories || [])];
      if (categories[catIdx]) {
        categories[catIdx] = {
          ...categories[catIdx],
          [field]: val
        };
        newParts[partIdx] = { ...part, categories };
        updateField('parts', newParts);
      }
    }
  };

  const addDndCategory = () => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const categories = [...(part.categories || [])];
      const newId = `cat_${categories.length + 1}`;
      categories.push({ id: newId, label: `Category ${categories.length + 1}` });
      newParts[partIdx] = { ...part, categories };
      updateField('parts', newParts);
    }
  };

  const removeDndCategory = (catIdx) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const categories = (part.categories || []).filter((_, i) => i !== catIdx);
      newParts[partIdx] = { ...part, categories };
      updateField('parts', newParts);
    }
  };

  const updateDndItem = (itemIdx, field, val) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const items = [...(part.items || [])];
      if (items[itemIdx]) {
        items[itemIdx] = {
          ...items[itemIdx],
          [field]: val
        };
        newParts[partIdx] = { ...part, items };
        updateField('parts', newParts);
      }
    }
  };

  const addDndItem = () => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const items = [...(part.items || [])];
      const newId = `item_${items.length + 1}`;
      items.push({ id: newId, content: `Item ${items.length + 1}` });
      newParts[partIdx] = { ...part, items };
      updateField('parts', newParts);
    }
  };

  const removeDndItem = (itemIdx) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const items = (part.items || []).filter((_, i) => i !== itemIdx);
      newParts[partIdx] = { ...part, items };
      updateField('parts', newParts);
    }
  };

  const updateDndAnswerKey = (itemId, categoryId) => {
    const newParts = [...(template.parts || [])];
    const partIdx = newParts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization');
    if (partIdx >= 0) {
      const part = newParts[partIdx];
      const answerKey = { ...(part.answerKey || {}), [itemId]: categoryId };
      newParts[partIdx] = { ...part, answerKey };
      updateField('parts', newParts);
    }
  };

  // Variable Management
  const addVariable = () => {
    updateField('variables', [
      ...template.variables,
      { name: `Var_${template.variables.length + 1}`, type: 'integer', min: '1', max: '10' }
    ]);
  };

  const updateVariable = (index, key, val) => {
    const vars = [...template.variables];
    vars[index] = { ...vars[index], [key]: val };
    updateField('variables', vars);
  };

  const removeVariable = (index) => {
    const vars = template.variables.filter((_, idx) => idx !== index);
    updateField('variables', vars);
  };

  // Visual component updates
  const handleSelectVisualComponent = (compVal) => {
    const found = VISUAL_COMPONENTS.find(c => c.value === compVal);
    if (!found || !found.value) {
      updateField('visuals', []);
    } else {
      updateField('visuals', [{
        component: found.value,
        props: { ...found.props }
      }]);
    }
  };

  const updateVisualProp = (propName, propVal) => {
    if (template.visuals.length === 0) return;
    const visuals = [...template.visuals];
    visuals[0] = {
      ...visuals[0],
      props: {
        ...visuals[0].props,
        [propName]: propVal
      }
    };
    updateField('visuals', visuals);

    // Auto-set optionsType to fillInTheBlank when clickToFill is checked
    if (propName === 'clickToFill' && propVal === true) {
      updateField('optionsType', 'fillInTheBlank');
    }
  };

  // Options updates
  const updateOption = (index, field, val) => {
    const opts = [...template.options];
    opts[index] = { ...opts[index], [field]: val };
    
    // If setting to true, toggle others off
    if (field === 'isCorrect' && val === true) {
      opts.forEach((o, i) => {
        if (i !== index) o.isCorrect = false;
      });
    }
    
    updateField('options', opts);
  };

  // Save template to DB
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // 1. Save Template
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server returned failure saving template');
      }

      // 2. Link to Curriculum Skill if checked
      if (linkToSkill) {
        // Resolve subjectId, topicId, chapterId, checking if custom is chosen
        let finalSubjectId = skillSubject;
        let finalTopicId = skillTopic;
        let finalChapterId = skillChapter;

        const slugify = (val) => {
          return String(val || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };

        // Save custom subject if needed
        if (skillSubject === '_custom_') {
          if (!skillSubjectCustomId.trim()) {
            throw new Error('Custom Subject ID is required');
          }
          finalSubjectId = slugify(skillSubjectCustomId);
          const subjectPayload = {
            type: 'subject',
            id: finalSubjectId,
            title: skillSubjectCustomTitle.trim() || skillSubjectCustomId,
          };
          const subjectRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subjectPayload)
          });
          const subjectData = await subjectRes.json();
          if (!subjectData.success) {
            throw new Error(subjectData.error || `Failed to create custom subject: ${finalSubjectId}`);
          }
        }

        // Save custom topic if needed
        if (skillTopic === '_custom_') {
          if (!skillTopicCustomId.trim()) {
            throw new Error('Custom Topic ID is required');
          }
          finalTopicId = slugify(skillTopicCustomId);
          const topicPayload = {
            type: 'topic',
            id: finalTopicId,
            title: skillTopicCustomTitle.trim() || skillTopicCustomId,
            parentId: finalSubjectId
          };
          const topicRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(topicPayload)
          });
          const topicData = await topicRes.json();
          if (!topicData.success) {
            throw new Error(topicData.error || `Failed to create custom topic: ${finalTopicId}`);
          }
        }

        // Save custom chapter if needed
        if (skillChapter === '_custom_') {
          if (!skillChapterCustomId.trim()) {
            throw new Error('Custom Chapter ID is required');
          }
          finalChapterId = slugify(skillChapterCustomId);
          const chapterPayload = {
            type: 'chapter',
            id: finalChapterId,
            title: skillChapterCustomTitle.trim() || skillChapterCustomId,
            parentId: finalTopicId
          };
          const chapterRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chapterPayload)
          });
          const chapterData = await chapterRes.json();
          if (!chapterData.success) {
            throw new Error(chapterData.error || `Failed to create custom chapter: ${finalChapterId}`);
          }
        }

        const skillPayload = {
          type: 'skill',
          id: skillIdInput,
          subjectId: finalSubjectId,
          topicId: finalTopicId,
          chapterId: finalChapterId,
          title: skillTitle,
          code: skillCode,
          grade: skillGrade,
          order: Number(skillOrder) || 0,
          templateId: template.id,
          engine: 'universal-template',
          questionType: template.optionsType || 'mcq',
          metadata: skillDifficultyScaling ? {
            difficultyScaling: true,
            templateLevels: skillTemplateLevels.map(l => ({
              level: l.level,
              templateIds: l.templateIds.filter(Boolean)
            })).filter(l => l.templateIds.length > 0)
          } : {}
        };

        const curriculumRes = await fetch('/api/admin/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skillPayload)
        });
        const curriculumData = await curriculumRes.json();
        if (!curriculumData.success) {
          throw new Error(curriculumData.error || 'Failed to link curriculum skill');
        }

        await fetchCurriculumNodes();
      }

      setSaveStatus({
        type: 'success',
        text: linkToSkill
          ? `Template "${template.id}" saved and linked to curriculum skill successfully!`
          : `Template "${template.id}" saved successfully!`
      });
      setSelectedId(template.id);
      await fetchTemplates();
    } catch (err) {
      setSaveStatus({ type: 'error', text: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Live simulation evaluation
  const evaluatedQuestion = useMemo(() => {
    try {
      const q = evaluateTemplate(template, seed);
      return { ok: true, question: q };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [template, seed]);

  // Dynamic lists from static config
  const staticList = useMemo(() => {
    const list = [...REFERENCE_EXAMPLES];
    Object.entries(staticTemplates).forEach(([subj, topics]) => {
      Object.entries(topics).forEach(([topicName, templatesArr]) => {
        templatesArr.forEach(t => {
          list.push({ ...t, subject: subj, topic: topicName, isStatic: true });
        });
      });
    });
    return list;
  }, [staticTemplates]);

  const renderCurriculumLinkerCard = () => {
    const subjects = curriculumNodes.filter(n => n.type === 'subject');
    const topics = curriculumNodes.filter(n => n.type === 'topic' && n.parentId === skillSubject);
    const chapters = curriculumNodes.filter(n => n.type === 'chapter' && n.parentId === skillTopic);

    return (
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <label className={styles.checkboxLabel} style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={linkToSkill}
            onChange={(e) => setLinkToSkill(e.target.checked)}
          />
          Create & Save Curriculum Skill Node
        </label>

        {linkToSkill && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            
            {/* Subject Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-subj">Subject</label>
              <select
                id="skill-subj"
                className={styles.select}
                value={skillSubject}
                onChange={(e) => {
                  setSkillSubject(e.target.value);
                  setSkillTopic('');
                  setSkillChapter('');
                }}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Subject...</option>
              </select>
            </div>

            {skillSubject === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-subj-custom-id">Custom Subject ID (slug)</label>
                  <input
                    id="skill-subj-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. math"
                    value={skillSubjectCustomId}
                    onChange={(e) => setSkillSubjectCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-subj-custom-title">Custom Subject Title</label>
                  <input
                    id="skill-subj-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Mathematics"
                    value={skillSubjectCustomTitle}
                    onChange={(e) => setSkillSubjectCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Topic Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-topic">Topic</label>
              <select
                id="skill-topic"
                className={styles.select}
                value={skillTopic}
                onChange={(e) => {
                  setSkillTopic(e.target.value);
                  setSkillChapter('');
                }}
                disabled={!skillSubject}
              >
                <option value="">-- Select Topic --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Topic...</option>
              </select>
            </div>

            {skillTopic === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-topic-custom-id">Custom Topic ID (slug)</label>
                  <input
                    id="skill-topic-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. addition-basics"
                    value={skillTopicCustomId}
                    onChange={(e) => setSkillTopicCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-topic-custom-title">Custom Topic Title</label>
                  <input
                    id="skill-topic-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Addition Basics"
                    value={skillTopicCustomTitle}
                    onChange={(e) => setSkillTopicCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Chapter Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-chap">Chapter</label>
              <select
                id="skill-chap"
                className={styles.select}
                value={skillChapter}
                onChange={(e) => setSkillChapter(e.target.value)}
                disabled={!skillTopic}
              >
                <option value="">-- Select Chapter --</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Chapter...</option>
              </select>
            </div>

            {skillChapter === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-chap-custom-id">Custom Chapter ID (slug)</label>
                  <input
                    id="skill-chap-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. chapter-1"
                    value={skillChapterCustomId}
                    onChange={(e) => setSkillChapterCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-chap-custom-title">Custom Chapter Title</label>
                  <input
                    id="skill-chap-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Chapter 1: Addition under 10"
                    value={skillChapterCustomTitle}
                    onChange={(e) => setSkillChapterCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-id-input">Skill Node ID (slug)</label>
                  <input
                    id="skill-id-input"
                    type="text"
                    className={styles.input}
                    value={skillIdInput}
                    onChange={(e) => setSkillIdInput(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-title-input">Skill Title</label>
                  <input
                    id="skill-title-input"
                    type="text"
                    className={styles.input}
                    value={skillTitle}
                    onChange={(e) => setSkillTitle(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-grade">Grade</label>
                  <input
                    id="skill-grade"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 1"
                    value={skillGrade}
                    onChange={(e) => setSkillGrade(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-code">Skill Code</label>
                  <input
                    id="skill-code"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. MATH.1.A"
                    value={skillCode}
                    onChange={(e) => setSkillCode(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-order">Order</label>
                  <input
                    id="skill-order"
                    type="number"
                    className={styles.input}
                    value={skillOrder}
                    onChange={(e) => setSkillOrder(e.target.value)}
                  />
                </div>
              </div>

              {/* ─── Difficulty Scaling ─── */}
              <div style={{ marginTop: '4px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={skillDifficultyScaling}
                    onChange={e => {
                      setSkillDifficultyScaling(e.target.checked);
                      if (e.target.checked) {
                        // Auto-seed Level 1 with the current template
                        setSkillTemplateLevels(prev => prev.map(l =>
                          l.level === 1 && !l.templateIds.includes(template.id)
                            ? { ...l, templateIds: [template.id, ...l.templateIds] }
                            : l
                        ));
                      }
                    }}
                  />
                  ⚡ Enable Difficulty Scaling (multiple templates per level)
                </label>

                {skillDifficultyScaling && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { level: 1, label: 'Level 1 — Easy', color: '#dcfce7', border: '#86efac', badge: '#16a34a' },
                      { level: 2, label: 'Level 2 — Medium', color: '#fef9c3', border: '#fde047', badge: '#ca8a04' },
                      { level: 3, label: 'Level 3 — Hard', color: '#fee2e2', border: '#fca5a5', badge: '#dc2626' },
                    ].map(({ level, label, color, border, badge }) => {
                      const levelData = skillTemplateLevels.find(l => l.level === level) || { level, templateIds: [] };
                      const isOpen = expandedLevel === level;
                      return (
                        <div key={level} style={{ border: `1px solid ${border}`, borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Accordion header */}
                          <button
                            type="button"
                            onClick={() => setExpandedLevel(isOpen ? 0 : level)}
                            style={{
                              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 12px', background: color, border: 'none', cursor: 'pointer',
                              fontWeight: 700, fontSize: '12px', color: '#1e293b'
                            }}
                          >
                            <span>{label}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: badge, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '11px' }}>
                                {levelData.templateIds.length} template{levelData.templateIds.length !== 1 ? 's' : ''}
                              </span>
                              <span>{isOpen ? '▲' : '▼'}</span>
                            </span>
                          </button>

                          {/* Accordion body */}
                          {isOpen && (
                            <div style={{ padding: '10px 12px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Hint */}
                              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                                {level === 1 ? 'Triggered when correctStreak < 3 or difficulty=easy'
                                  : level === 2 ? 'Triggered when correctStreak 3–5 or difficulty=medium'
                                  : 'Triggered when correctStreak ≥ 6 or difficulty=hard'}
                                . Templates are picked randomly by seed.
                              </p>

                              {/* Chips */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px' }}>
                                {levelData.templateIds.length === 0 && (
                                  <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No templates — add below</span>
                                )}
                                {levelData.templateIds.map((tid, ti) => (
                                  <span key={ti} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: color, border: `1px solid ${border}`, borderRadius: '6px',
                                    padding: '2px 8px', fontSize: '11px', fontWeight: 600
                                  }}>
                                    {tid === template.id ? `★ ${tid}` : tid}
                                    <button
                                      type="button"
                                      onClick={() => setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level
                                          ? { ...l, templateIds: l.templateIds.filter((_, i) => i !== ti) }
                                          : l
                                      ))}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900, padding: '0 2px', fontSize: '13px', lineHeight: 1 }}
                                    >×</button>
                                  </span>
                                ))}
                              </div>

                              {/* Add row */}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input
                                  type="text"
                                  className={styles.input}
                                  style={{ flex: 1, fontSize: '12px', padding: '5px 8px' }}
                                  placeholder="Template ID (e.g. addition-mcq-tenframe)"
                                  value={levelAddInputs[level] || ''}
                                  onChange={e => setLevelAddInputs(prev => ({ ...prev, [level]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (levelAddInputs[level] || '').trim();
                                      if (val && !levelData.templateIds.includes(val)) {
                                        setSkillTemplateLevels(prev => prev.map(l =>
                                          l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                        ));
                                        setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className={styles.btn}
                                  style={{ fontSize: '11px', padding: '4px 10px', background: badge, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    const val = (levelAddInputs[level] || '').trim();
                                    if (val && !levelData.templateIds.includes(val)) {
                                      setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                      ));
                                      setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                    }
                                  }}
                                >+ Add</button>
                                <button
                                  type="button"
                                  className={styles.btn}
                                  style={{ fontSize: '11px', padding: '4px 10px', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  onClick={() => {
                                    if (!levelData.templateIds.includes(template.id)) {
                                      setSkillTemplateLevels(prev => prev.map(l =>
                                        l.level === level ? { ...l, templateIds: [...l.templateIds, template.id] } : l
                                      ));
                                    }
                                  }}
                                >★ Add current</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* ─── End Difficulty Scaling ─── */}

            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <main className={styles.container}>
      <style dangerouslySetInnerHTML={{ __html: `
        .svg-preview-container svg {
          width: 100% !important;
          height: 100% !important;
          max-width: 18px !important;
          max-height: 18px !important;
          display: block !important;
        }
      ` }} />
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Visual Template Builder</h1>
          <p className={styles.subtitle}>Create and design dynamic mathematics questions visually</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btn + ' ' + styles.btnSecondary}
            style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#c084fc' }}
            onClick={() => setShowGuide(true)}
          >
            📚 Question Types Guide
          </button>
          <a className={styles.btn + ' ' + styles.btnSecondary} href="/admin">
            ← Back to Admin Console
          </a>
          <button type="button" className={styles.btn + ' ' + styles.btnSecondary} onClick={handleNewTemplate}>
            + Create New Template
          </button>
        </div>
      </header>
 
      <div className={styles.workspace}>
        {/* Left column: Sidebar list of existing templates */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Templates Repository</h3>
          {loading ? (
            <p className={styles.emptyStateText}>Loading...</p>
          ) : (
            <div className={styles.templateList}>
              <div className={styles.sectionTitle} style={{ marginTop: 0 }}>
                <span>Custom MongoDB</span>
              </div>
              {dynamicTemplates.length === 0 ? (
                <p className={styles.emptyStateText} style={{ padding: '8px 0' }}>No custom templates</p>
              ) : (
                dynamicTemplates.map(tpl => (
                  <button
                    key={`dynamic-${tpl.id}`}
                    className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                    onClick={() => handleSelectTemplate(tpl)}
                  >
                    <div className={styles.templateItemTitle}>{tpl.title || tpl.id}</div>
                    <div className={styles.templateItemMeta}>{tpl.topic} • {tpl.id}</div>
                  </button>
                ))
              )}
 
              <div className={styles.sectionTitle} style={{ marginTop: '16px' }}>
                <span>Reference Examples</span>
              </div>
              {REFERENCE_EXAMPLES.map(tpl => (
                <button
                  key={`ref-${tpl.id}`}
                  className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className={styles.templateItemTitle}>{tpl.title}</div>
                  <div className={styles.templateItemMeta}>{tpl.topic} • Example</div>
                </button>
              ))}

              {/* ── Math Starters ── */}
              <div className={styles.sectionTitle} style={{ marginTop: '16px' }}>
                <span>⚡ Math Starters</span>
              </div>
              {MATH_STARTERS.map(tpl => (
                <button
                  key={`starter-${tpl.id}`}
                  className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{ borderLeft: '3px solid #f59e0b' }}
                >
                  <div className={styles.templateItemTitle}>{tpl.emoji} {tpl.title}</div>
                  <div className={styles.templateItemMeta}>{tpl.topic} • Starter</div>
                </button>
              ))}

              <div className={styles.sectionTitle} style={{ marginTop: '16px' }}>
                <span>Static Catalog</span>
              </div>
              {staticList.filter(tpl => !REFERENCE_EXAMPLES.some(r => r.id === tpl.id)).map(tpl => (
                <button
                  key={`static-${tpl.subject}-${tpl.topic}-${tpl.id}`}
                  className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className={styles.templateItemTitle}>{tpl.title || tpl.id}</div>
                  <div className={styles.templateItemMeta}>{tpl.topic} • Static</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right columns: Editor Form & Live Simulator */}
        <div className={styles.builderAreaFull}>
          {/* Top Navigation Tabs */}
          <div className={styles.stepTabsContainer}>
            {[
              { id: 1, label: 'Template Info' },
              { id: 2, label: 'Question Setup' },
              { id: 3, label: 'Categories' },
              { id: 4, label: 'Drag Items' },
              { id: 5, label: 'Preview & Test' },
              { id: 6, label: 'Publish' }
            ].map(step => (
              <div 
                key={step.id}
                className={`${styles.stepTab} ${currentStep === step.id ? styles.stepTabActive : ''} ${currentStep > step.id ? styles.stepTabCompleted : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className={styles.stepNumber}>{currentStep > step.id ? '✓' : step.id}</div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>

          {/* Builder Editor Card */}
          <section className={styles.panel} style={{ display: currentStep === 5 ? 'none' : 'block' }}>
            <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>Template Editor</h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedId ? `Editing: ${selectedId}` : 'New Unsaved Template'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: editorMode === 'form' ? '#ffffff' : 'transparent',
                    color: editorMode === 'form' ? '#0f172a' : '#64748b',
                    boxShadow: editorMode === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditorMode('form')}
                >
                  📝 Form Builder
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: editorMode === 'json' ? '#ffffff' : 'transparent',
                    color: editorMode === 'json' ? '#0f172a' : '#64748b',
                    boxShadow: editorMode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditorMode('json')}
                >
                  💻 JSON Recipe
                </button>
              </div>
            </div>

            <div className={styles.panelBody}>
              {/* ✨ AI Template Assistant Card */}
              <div className={styles.aiAssistantCard}>
                <h3 className={styles.aiTitle}>
                  ✨ AI Template Builder Assistant
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>
                  Describe the question template you want to generate. Gemini will write the logic, variables, option choices, and visuals, then load it into both the Form and JSON editors.
                </p>
                <div className={styles.aiPromptArea}>
                  <textarea
                    className={styles.aiPromptTextarea}
                    placeholder="Describe your question, e.g. 'A math subtraction ten frame question where A is between 5 and 10, B is between 1 and A-1, and B counters are crossed out. Give 4 multiple choice options with the correct result.'"
                    value={aiTemplatePrompt}
                    onChange={(e) => setAiTemplatePrompt(e.target.value)}
                    disabled={aiTemplateGenerating}
                  />
                  <button
                    type="button"
                    className={styles.aiBtnGenerate}
                    onClick={handleAiTemplateGenerate}
                    disabled={aiTemplateGenerating || !aiTemplatePrompt.trim()}
                  >
                    {aiTemplateGenerating ? (
                      <>
                        <div className={styles.loadingSpinner} style={{ borderTopColor: '#ffffff' }} />
                        <span style={{ fontSize: '10px' }}>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>🪄 Build</span>
                        <span style={{ fontSize: '10px' }}>Template</span>
                      </>
                    )}
                  </button>
                </div>
                {aiTemplateSuccessMsg && (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                    {aiTemplateSuccessMsg}
                  </div>
                )}
              </div>

              {editorMode === 'json' ? (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                  <div className={styles.formGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="json-editor">JSON Recipe Code Editor</label>
                    <textarea
                      id="json-editor"
                      className={styles.textarea}
                      style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        padding: '12px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        border: jsonError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        minHeight: '420px',
                        resize: 'vertical'
                      }}
                      value={jsonText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setJsonText(val);
                        try {
                          const parsed = JSON.parse(val);
                          if (parsed && typeof parsed === 'object') {
                            setTemplate({
                              ...parsed,
                              variables: parsed.variables || [],
                              visuals: parsed.visuals || [],
                              options: parsed.options || [],
                              explanation: parsed.explanation || { sections: [{ type: 'text', content: '' }] }
                            });
                            setJsonError(null);
                          } else {
                            setJsonError('Must be a JSON object');
                          }
                        } catch (err) {
                          setJsonError(err.message);
                        }
                      }}
                    />
                    {jsonError && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ JSON Syntax Error: {jsonError}
                      </div>
                    )}
                  </div>
                  
                  {renderCurriculumLinkerCard()}

                  {/* Save Button for JSON mode */}
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={styles.btn + ' ' + styles.btnPrimary}
                      style={{ flex: 1, padding: '12px' }}
                      onClick={handleSave}
                      disabled={saving || !!jsonError || (!!selectedId && staticList.some(s => s.id === selectedId))}
                    >
                      {saving ? 'Saving to Database...' : 'Save Template to MongoDB'}
                    </button>
                  </div>
                  {saveStatus && (
                    <div className={`${styles.statusBar} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                      {saveStatus.text}
                    </div>
                  )}
                  {selectedId && staticList.some(s => s.id === selectedId) && (
                    <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px', textAlign: 'center' }}>
                      ⚠️ Static catalogs are read-only. Change the Template ID to save a custom copy.
                    </p>
                  )}
                </div>
              ) : (
              <>
              {currentStep === 1 && (
                <div className={styles.wizardStepContent}>
              {/* Metadata */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-id">Template ID</label>
                  <input
                    id="tpl-id"
                    type="text"
                    className={styles.input}
                    value={template.id || ''}
                    onChange={(e) => updateField('id', e.target.value)}
                    disabled={!!selectedId && staticList.some(s => s.id === selectedId)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-title">Template Title</label>
                  <input
                    id="tpl-title"
                    type="text"
                    className={styles.input}
                    value={template.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-subject">Subject</label>
                  <select
                    id="tpl-subject"
                    className={styles.select}
                    value={template.subject || 'math'}
                    onChange={(e) => updateField('subject', e.target.value)}
                  >
                    <option value="math">math</option>
                    <option value="english">english</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-topic">Topic Node Slug</label>
                  <input
                    id="tpl-topic"
                    type="text"
                    className={styles.input}
                    value={template.topic || ''}
                    placeholder="e.g. ukg-numbers-counting"
                    onChange={(e) => updateField('topic', e.target.value)}
                  />
                </div>
              </div>

              {/* Variables Board */}
              <div className={styles.sectionTitle}>
                <span>Variables Board</span>
                <button type="button" className={styles.btn + ' ' + styles.btnSecondary} style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addVariable}>
                  + Add Variable
                </button>
              </div>

              <div className={styles.varList}>
                {template.variables.map((variable, idx) => (
                  <div key={idx} className={styles.varCard}>
                    <div className={styles.varCardHeader}>
                      <input
                        type="text"
                        className={styles.varNameInput}
                        value={variable.name || ''}
                        onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                        aria-label={`Variable ${idx + 1} Name`}
                      />
                      <button type="button" className={styles.varDeleteBtn} onClick={() => removeVariable(idx)} title="Delete Variable">
                        ✕
                      </button>
                    </div>

                    <div className={styles.varFields}>
                      <label htmlFor={`var-type-${idx}`}>Type</label>
                      <select
                        id={`var-type-${idx}`}
                        className={styles.select}
                        value={variable.type || 'integer'}
                        onChange={(e) => updateVariable(idx, 'type', e.target.value)}
                      >
                        <option value="integer">Integer Range</option>
                        <option value="expression">Arithmetic Expression</option>
                        <option value="list">Choice List</option>
                      </select>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      {variable.type === 'integer' && (
                        <div className={styles.varFieldsSubGrid}>
                          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                            <label htmlFor={`var-min-${idx}`} style={{ fontSize: '11px' }}>Min (Value or Exp)</label>
                            <input
                              id={`var-min-${idx}`}
                              type="text"
                              className={styles.input}
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={variable.min || ''}
                              onChange={(e) => updateVariable(idx, 'min', e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                            <label htmlFor={`var-max-${idx}`} style={{ fontSize: '11px' }}>Max (Value or Exp)</label>
                            <input
                              id={`var-max-${idx}`}
                              type="text"
                              className={styles.input}
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={variable.max || ''}
                              onChange={(e) => updateVariable(idx, 'max', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {variable.type === 'expression' && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label htmlFor={`var-formula-${idx}`} style={{ fontSize: '11px' }}>Math Formula (e.g. A + B)</label>
                          <input
                            id={`var-formula-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={variable.formula || ''}
                            onChange={(e) => updateVariable(idx, 'formula', e.target.value)}
                          />
                        </div>
                      )}

                      {variable.type === 'list' && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label htmlFor={`var-items-${idx}`} style={{ fontSize: '11px', margin: 0 }}>Comma separated list</label>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery(`variable_items_${idx}`, Array.isArray(variable.items) ? variable.items.join(', ') : (variable.items || ''))}
                            >
                              📷 Gallery
                            </button>
                          </div>
                          <input
                            id={`var-items-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={Array.isArray(variable.items) ? variable.items.join(', ') : (variable.items || '')}
                            onChange={(e) => updateVariable(idx, 'items', e.target.value.split(',').map(s => s.trim()))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {template.variables.length === 0 && (
                  <p className={styles.emptyStateText} style={{ padding: '12px' }}>No variables declared. Constants will be evaluated.</p>
                )}
              </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className={styles.wizardStepContent}>
              {/* Visual Binding */}
              <div className={styles.sectionTitle}>
                <span>Visual SVG Model Binding</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-visual-select">Select Visual Model</label>
                <select
                  id="tpl-visual-select"
                  className={styles.select}
                  value={template.visuals?.[0]?.component || ''}
                  onChange={(e) => handleSelectVisualComponent(e.target.value)}
                >
                  {VISUAL_COMPONENTS.map(c => (
                    <option key={c.value} value={c.value}>{c.name}</option>
                  ))}
                </select>
              </div>

              {(template.visuals || []).length > 0 && (
                <div className={styles.visualCard}>
                  <div className={styles.visualCardHeader}>
                    <span className={styles.visualTitle}>Configuring: {template.visuals[0].component}</span>
                  </div>
                  
                  {template.visuals[0].component === 'TenFrame' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-filled">Filled counters</label>
                        <input
                          id="ten-filled"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.filledCount || ''}
                          onChange={(e) => updateVisualProp('filledCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-crossed">Crossed out</label>
                        <input
                          id="ten-crossed"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.crossedOutCount || ''}
                          onChange={(e) => updateVisualProp('crossedOutCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-color">Counter color</label>
                        <select
                          id="ten-color"
                          className={styles.select}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.color || 'red'}
                          onChange={(e) => updateVisualProp('color', e.target.value)}
                        >
                          {COLORS_LIST.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                       <div className={styles.propRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                        <input
                          id="ten-click-to-fill"
                          type="checkbox"
                          checked={Boolean(template.visuals[0].props?.clickToFill === true || template.visuals[0].props?.clickToFill === 'true')}
                          onChange={(e) => updateVisualProp('clickToFill', e.target.checked)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <label htmlFor="ten-click-to-fill" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                          Click to Fill (Interactive)
                        </label>
                      </div>
                      {Boolean(template.visuals[0].props?.clickToFill === true || template.visuals[0].props?.clickToFill === 'true') && template.optionsType !== 'fillInTheBlank' && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                          ⚠️ Set Options Type to <strong>Fill-In-The-Blank (FIB)</strong> in Question Contents below. This hides multiple-choice options for the interactive click-to-fill mode.
                        </div>
                      )}
                    </>
                  )}

                  {template.visuals[0].component === 'JarOfMarbles' && (
                    <>
                      <div className={styles.propGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-colA" style={{ width: 'auto', marginRight: '6px' }}>Color A</label>
                            <select
                              id="jar-colA"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorA || 'blue'}
                              onChange={(e) => updateVisualProp('colorA', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-cntA" style={{ width: 'auto', marginRight: '6px' }}>Count A</label>
                            <input
                              id="jar-cntA"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.countA || ''}
                              onChange={(e) => updateVisualProp('countA', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-colB" style={{ width: 'auto', marginRight: '6px' }}>Color B</label>
                            <select
                              id="jar-colB"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorB || 'red'}
                              onChange={(e) => updateVisualProp('colorB', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-cntB" style={{ width: 'auto', marginRight: '6px' }}>Count B</label>
                            <input
                              id="jar-cntB"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.countB || ''}
                              onChange={(e) => updateVisualProp('countB', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {template.visuals[0].component === 'Spinner' && (
                    <>
                      <div className={styles.propGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-colA" style={{ width: 'auto', marginRight: '6px' }}>Color A</label>
                            <select
                              id="spin-colA"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorA || 'blue'}
                              onChange={(e) => updateVisualProp('colorA', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-secA" style={{ width: 'auto', marginRight: '6px' }}>Sectors A</label>
                            <input
                              id="spin-secA"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.sectorsA || ''}
                              onChange={(e) => updateVisualProp('sectorsA', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-colB" style={{ width: 'auto', marginRight: '6px' }}>Color B</label>
                            <select
                              id="spin-colB"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorB || 'green'}
                              onChange={(e) => updateVisualProp('colorB', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-secB" style={{ width: 'auto', marginRight: '6px' }}>Sectors B</label>
                            <input
                              id="spin-secB"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.sectorsB || ''}
                              onChange={(e) => updateVisualProp('sectorsB', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {template.visuals[0].component === 'ItemCounter' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="item-count">Item Count</label>
                        <input
                          id="item-count"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.count || ''}
                          onChange={(e) => updateVisualProp('count', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="item-width">Custom Width (px)</label>
                        <input
                          id="item-width"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.width || ''}
                          onChange={(e) => updateVisualProp('width', e.target.value)}
                          placeholder="e.g. 90"
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="item-type" style={{ margin: 0 }}>Item Type</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setUseCustomItemType(!useCustomItemType)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              {useCustomItemType ? 'Use Select' : 'Enter Custom / Gallery'}
                            </button>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery('itemType', template.visuals[0].props?.itemType)}
                            >
                              📷 Gallery
                            </button>
                          </div>
                        </div>
                        {useCustomItemType ? (
                          <LabelledListEditor
                            value={template.visuals[0].props?.itemType || ''}
                            onChange={(val) => updateVisualProp('itemType', val)}
                            placeholder="e.g. cupcake or url1, url2"
                          />
                        ) : (
                          <select
                            id="item-type"
                            className={styles.select}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.itemType || 'cupcake'}
                            onChange={(e) => updateVisualProp('itemType', e.target.value)}
                          >
                            <option value="cupcake">cupcake</option>
                            <option value="apple">apple</option>
                            <option value="star">star</option>
                            <option value="random">random (selects randomly)</option>
                            {template.variables.map(v => (
                              <option key={v.name} value={v.name}>variable: {v.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-show-numbers"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.showNumbers === true || template.visuals[0].props?.showNumbers === 'true' || template.visuals[0].props?.showNumbers === 1)}
                            onChange={(e) => updateVisualProp('showNumbers', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-show-numbers" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Show Numbers Overlay
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-hide-images"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.hideImages === true || template.visuals[0].props?.hideImages === 'true')}
                            onChange={(e) => updateVisualProp('hideImages', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-hide-images" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Hide Images (Show Numbers Only)
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-not-clickable"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.notClickable === true || template.visuals[0].props?.notClickable === 'true')}
                            onChange={(e) => updateVisualProp('notClickable', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-not-clickable" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Not Clickable (Disable Interaction)
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                  {template.visuals[0].component === 'Image' && (
                    <>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="img-url" style={{ margin: 0 }}>Image URL</label>
                          <button
                            type="button"
                            className={styles.btn + ' ' + styles.btnSecondary}
                            style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                            onClick={() => openGallery('imageUrl', template.visuals[0].props?.imageUrl)}
                          >
                            📷 Gallery
                          </button>
                        </div>
                        <LabelledListEditor
                          value={template.visuals[0].props?.imageUrl || ''}
                          onChange={(val) => updateVisualProp('imageUrl', val)}
                          placeholder="e.g. https://domain.com/img.png or url1, url2"
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="img-width">Width</label>
                        <input
                          id="img-width"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.width || '200'}
                          placeholder="e.g. 200 or 200px"
                          onChange={(e) => updateVisualProp('width', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* VisualChoice props — which shows N? */}
                  {template.visuals[0].component === 'VisualChoice' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="vc-correct-count">Correct Count (variable)</label>
                        <input
                          id="vc-correct-count"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.correctCount || 'A'}
                          placeholder="e.g. A"
                          onChange={(e) => updateVisualProp('correctCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="vc-item-type" style={{ margin: 0 }}>Item Type</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setUseCustomItemType(!useCustomItemType)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              {useCustomItemType ? 'Use Select' : 'Enter Custom / Gallery'}
                            </button>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery('itemType', template.visuals[0].props?.itemType)}
                            >
                              📷 Gallery
                            </button>
                          </div>
                        </div>
                        {useCustomItemType ? (
                          <LabelledListEditor
                            value={template.visuals[0].props?.itemType || ''}
                            onChange={(val) => updateVisualProp('itemType', val)}
                            placeholder="e.g. strawberry or label::https://url"
                          />
                        ) : (
                          <select
                            id="vc-item-type"
                            className={styles.select}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.itemType || 'cupcake'}
                            onChange={(e) => updateVisualProp('itemType', e.target.value)}
                          >
                            <option value="cupcake">cupcake</option>
                            <option value="apple">apple</option>
                            <option value="star">star</option>
                          </select>
                        )}
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="vc-distractor-mode">Distractor Mode</label>
                        <select
                          id="vc-distractor-mode"
                          className={styles.select}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.distractorMode || 'auto'}
                          onChange={(e) => updateVisualProp('distractorMode', e.target.value)}
                        >
                          <option value="auto">auto (random ±1-3)</option>
                          <option value="manual">manual (set distractorCount)</option>
                        </select>
                      </div>
                      {template.visuals[0].props?.distractorMode === 'manual' && (
                        <div className={styles.propRow}>
                          <label htmlFor="vc-distractor-count">Wrong Count</label>
                          <input
                            id="vc-distractor-count"
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.distractorCount || '1'}
                            placeholder="e.g. 1 or B"
                            onChange={(e) => updateVisualProp('distractorCount', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Auto-set optionsType when VisualChoice component is selected */}
                      {template.optionsType !== 'visual_choice' && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                          ⚠️ Set Options Type to <strong>Visual Choice</strong> in Question Contents below for this to work.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Question Layout and Text */}
              <div className={styles.sectionTitle}>
                <span>Question Contents</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-question-text">Question Text</label>
                <input
                  id="tpl-question-text"
                  type="text"
                  className={styles.input}
                  value={template.questionText || ''}
                  placeholder="e.g. What is [A] minus [B]?"
                  onChange={(e) => updateField('questionText', e.target.value)}
                />
              </div>

              {/* Options Type Selector */}
              <div className={styles.formGroup}>
                <label htmlFor="options-type">Options Type</label>
                <select
                  id="options-type"
                  className={styles.select}
                  value={template.optionsType || 'mcq'}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField('optionsType', val);
                    // Auto-switch visual component when visual_choice is selected
                    if (val === 'visual_choice' && template.visuals[0]?.component !== 'VisualChoice') {
                      const vc = VISUAL_COMPONENTS.find(c => c.value === 'VisualChoice');
                      if (vc) updateField('visuals', [{ component: 'VisualChoice', props: { ...vc.props } }]);
                    }
                    if (val === 'categorizationv2') {
                      const hasDndPart = Array.isArray(template.parts) && template.parts.some(p => p.type === 'categorizationv2' || p.type === 'categorization');
                      if (!hasDndPart) {
                        updateField('parts', [
                          {
                            type: 'categorizationv2',
                            layoutMode: 'category_sort',
                            htmlLayout: 'category_sort',
                            cardStyle: 'standard',
                            categories: [
                              { id: 'cat_1', label: 'Category 1' },
                              { id: 'cat_2', label: 'Category 2' }
                            ],
                            items: [
                              { id: 'item_1', content: 'Item 1' },
                              { id: 'item_2', content: 'Item 2' }
                            ],
                            answerKey: {
                              'item_1': 'cat_1',
                              'item_2': 'cat_2'
                            }
                          }
                        ]);
                      }
                    }
                  }}
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="fillInTheBlank">Fill-In-The-Blank (FIB)</option>
                  <option value="categorizationv2">Categorization / Drag & Drop</option>
                  <option value="visual_choice">Visual Choice (Which shows N?)</option>
                  <option value="hotspot_select">Interactive Hotspot (Click Image)</option>
                </select>
              </div>

              {/* Hotspot Canvas Editor — only show for hotspot_select */}
              {template.optionsType === 'hotspot_select' && (() => {
                const partIdx = Array.isArray(template.parts) ? template.parts.findIndex(p => p.type === 'hotspot_canvas') : -1;
                const part = partIdx >= 0 ? template.parts[partIdx] : null;
                if (!part) return null;
                
                const hotspots = part.hotspots || [];
                const bgUrl = part.backgroundUrl || part.backgroundImage || '';

                const updatePartProp = (propName, propVal) => {
                  const newParts = [...template.parts];
                  newParts[partIdx] = {
                    ...newParts[partIdx],
                    [propName]: propVal
                  };
                  updateField('parts', newParts);
                };

                const updateHotspotProp = (hsIndex, propName, propVal) => {
                  const newHotspots = [...hotspots];
                  newHotspots[hsIndex] = {
                    ...newHotspots[hsIndex],
                    [propName]: propVal
                  };
                  updatePartProp('hotspots', newHotspots);
                };

                return (
                  <div className={styles.visualCard} style={{ background: '#f5f3ff', border: '1px solid #c084fc', marginBottom: '20px' }}>
                    <div className={styles.visualCardHeader} style={{ background: '#ede9fe', padding: '10px 14px', borderBottom: '1px solid #ddd6fe' }}>
                      <span className={styles.visualTitle} style={{ color: '#6d28d9', fontSize: '13px', fontWeight: 'bold' }}>🎯 Interactive Hotspot Zones Mapper</span>
                    </div>

                    <div className={styles.panelBody} style={{ padding: '14px' }}>
                      <div className={styles.formGroup} style={{ marginTop: '0px', marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4c1d95', display: 'block', marginBottom: '4px' }}>
                          Background Image URL (Map Canvas)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className={styles.input}
                            style={{ padding: '8px 10px', fontSize: '13px' }}
                            value={bgUrl}
                            placeholder="Enter image URL or placeholder like [resolved_image]..."
                            onChange={e => updatePartProp('backgroundUrl', e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.btn + ' ' + styles.btnSecondary}
                            onClick={() => openGallery('backgroundUrl', bgUrl)}
                            style={{ padding: '8px 12px' }}
                          >
                            🖼️ Gallery
                          </button>
                        </div>
                      </div>

                      {/* Dynamic SVG Scene Composition Controls */}
                      <div style={{ marginTop: '12px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="checkbox"
                            id="use-dynamic-compose"
                            checked={Boolean(part.composeScene)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updatePartProp('composeScene', {
                                  containerType: 'box',
                                  targetClipart: '',
                                  placements: ['[placement_0]', '[placement_1]']
                                });
                              } else {
                                const newParts = [...template.parts];
                                const updatedPart = { ...newParts[partIdx] };
                                delete updatedPart.composeScene;
                                newParts[partIdx] = updatedPart;
                                updateField('parts', newParts);
                              }
                            }}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <label htmlFor="use-dynamic-compose" style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>
                            ✨ Use Dynamic SVG Scene Composition (No Static Images)
                          </label>
                        </div>

                        {part.composeScene && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Container Type</label>
                                <select
                                  className={styles.select}
                                  style={{ padding: '6px 8px', fontSize: '12px', marginTop: '3px', width: '100%' }}
                                  value={part.composeScene.containerType || 'box'}
                                  onChange={(e) => {
                                    updatePartProp('composeScene', {
                                      ...part.composeScene,
                                      containerType: e.target.value
                                    });
                                  }}
                                >
                                  <option value="box">Box (Rounded Rect)</option>
                                  <option value="bowl">Bowl (Blue curved bowl)</option>
                                  <option value="basket">Basket (Woven basket with handle)</option>
                                  <option value="circle">Circle / Ring (Dashed target ellipse)</option>
                                  <option value="plate">Plate / Table (Flat grey plate)</option>
                                  <option value="house">House (Cottage shape with roof)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Clipart URL / Variable</label>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                  <input
                                    type="text"
                                    className={styles.input}
                                    style={{ padding: '6px 8px', fontSize: '12px', width: '100%' }}
                                    placeholder="e.g. [animal_img] or URL"
                                    value={part.composeScene.targetClipart || ''}
                                    onChange={(e) => {
                                      updatePartProp('composeScene', {
                                        ...part.composeScene,
                                        targetClipart: e.target.value
                                      });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => openGallery('composeScene.targetClipart', part.composeScene.targetClipart || '')}
                                  >
                                    🖼️
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                Placements (For Hotspot Zone 1 and Zone 2)
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {hotspots.map((hs, i) => {
                                  const placementsArr = Array.isArray(part.composeScene.placements) ? part.composeScene.placements : [];
                                  const currentVal = placementsArr[i] || '';
                                  return (
                                    <div key={i}>
                                      <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
                                        {hs.label || `Zone ${i+1}`} Placement:
                                      </span>
                                      <input
                                        type="text"
                                        className={styles.input}
                                        style={{ padding: '5px 8px', fontSize: '11px', marginTop: '3px', width: '100%' }}
                                        placeholder="e.g. [placement_0], inside, outside, empty"
                                        value={currentVal}
                                        onChange={(e) => {
                                          const newPlacements = [...placementsArr];
                                          while (newPlacements.length <= i) {
                                            newPlacements.push('');
                                          }
                                          newPlacements[i] = e.target.value;
                                          updatePartProp('composeScene', {
                                            ...part.composeScene,
                                            placements: newPlacements
                                          });
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        {/* Left: Graphic coordinate helper */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>Visual Zones Preview</span>
                          <div style={{
                            position: 'relative',
                            width: '200px',
                            height: '128px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f8fafc',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            {bgUrl && !bgUrl.includes('[') ? (
                              <img src={bgUrl} alt="Background map" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '9px', textAlign: 'center', padding: '8px' }}>
                                {bgUrl ? `Evaluating: ${bgUrl}` : 'No image loaded'}
                              </div>
                            )}
                            {hotspots.map((hs, i) => (
                              <div
                                key={i}
                                onClick={() => setActiveHsIdx(i)}
                                style={{
                                  position: 'absolute',
                                  left: `${(hs.x / 500) * 100}%`,
                                  top: `${(hs.y / 320) * 100}%`,
                                  width: `${(hs.width / 500) * 100}%`,
                                  height: `${(hs.height / 320) * 100}%`,
                                  border: activeHsIdx === i ? '2px solid #4f46e5' : '1px dashed #64748b',
                                  background: activeHsIdx === i ? 'rgba(79, 70, 229, 0.25)' : 'rgba(100, 116, 139, 0.1)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  color: activeHsIdx === i ? '#4f46e5' : '#64748b',
                                  fontWeight: 'bold',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {hs.label || `Z${i+1}`}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px' }}>Click zone to select it</span>
                        </div>

                        {/* Right: Coordinates Sliders for active zone */}
                        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {hotspots[activeHsIdx] ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '12px', color: '#4f46e5' }}>
                                  Edit Box: {hotspots[activeHsIdx].label || `Zone ${activeHsIdx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                                  onClick={() => {
                                    const newHs = hotspots.filter((_, i) => i !== activeHsIdx);
                                    updatePartProp('hotspots', newHs);
                                    setActiveHsIdx(Math.max(0, activeHsIdx - 1));
                                  }}
                                >
                                  Delete Zone
                                </button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div>
                                  <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>Zone Label</label>
                                  <input
                                    type="text"
                                    className={styles.input}
                                    style={{ padding: '4px 6px', fontSize: '11px' }}
                                    value={hotspots[activeHsIdx].label || ''}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'label', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>Option Index</label>
                                  <input
                                    type="number"
                                    className={styles.input}
                                    style={{ padding: '4px 6px', fontSize: '11px' }}
                                    value={hotspots[activeHsIdx].optionIndex}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'optionIndex', Number(e.target.value))}
                                  />
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600, color: '#475569' }}>
                                  <span>Horiz Position (X):</span>
                                  <span>{hotspots[activeHsIdx].x}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="500"
                                  value={hotspots[activeHsIdx].x}
                                  onChange={e => updateHotspotProp(activeHsIdx, 'x', Number(e.target.value))}
                                  style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                />
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600, color: '#475569' }}>
                                  <span>Vert Position (Y):</span>
                                  <span>{hotspots[activeHsIdx].y}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="320"
                                  value={hotspots[activeHsIdx].y}
                                  onChange={e => updateHotspotProp(activeHsIdx, 'y', Number(e.target.value))}
                                  style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                                    <span>Width:</span>
                                    <span>{hotspots[activeHsIdx].width}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={hotspots[activeHsIdx].width}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'width', Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                                    <span>Height:</span>
                                    <span>{hotspots[activeHsIdx].height}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="320"
                                    value={hotspots[activeHsIdx].height}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'height', Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                              No active zone. Click Add Zone.
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnSecondary}
                        style={{ marginTop: '12px', width: '100%', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          const newHs = [
                            ...hotspots,
                            {
                              id: `zone_${hotspots.length + 1}`,
                              label: `Zone ${hotspots.length + 1}`,
                              x: 50,
                              y: 50,
                              width: 100,
                              height: 100,
                              optionIndex: hotspots.length
                            }
                          ];
                          updatePartProp('hotspots', newHs);
                          setActiveHsIdx(newHs.length - 1);
                        }}
                      >
                        + Add Bounding Box Zone
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Options — show for MCQ and Hotspot */}
              {(template.optionsType === 'mcq' || template.optionsType === 'hotspot_select') && (
              <div className={styles.formGroup}>
                <label>Choices (Multiple Choice Options)</label>
                {template.options.map((opt, idx) => (
                  <div key={idx} className={styles.optionRow}>
                    <input
                      type="text"
                      className={styles.input + ' ' + styles.optionInput}
                      value={opt.label || opt.value || ''}
                      placeholder={`Choice ${idx + 1}`}
                      onChange={(e) => updateOption(idx, 'label', e.target.value)}
                    />
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect || false}
                        onChange={(e) => updateOption(idx, 'isCorrect', e.target.checked)}
                      />
                      Correct
                    </label>
                    {template.options.length > 2 && (
                      <button
                        type="button"
                        className={styles.btnRemoveOption}
                        onClick={() => {
                          const newOpts = template.options.filter((_, i) => i !== idx);
                          updateField('options', newOpts);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnSecondary}
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    updateField('options', [...template.options, { label: '', isCorrect: false }]);
                  }}
                >
                  + Add Choice
                </button>
              </div>
              )}
                </div>
              )}

              {/* Drag & Drop (Categorization) Editor */}
              {template.optionsType === 'categorizationv2' && (() => {
                const partIdx = Array.isArray(template.parts) ? template.parts.findIndex(p => p.type === 'categorizationv2' || p.type === 'categorization') : -1;
                const part = partIdx >= 0 ? template.parts[partIdx] : null;

                if (!part) {
                  return (
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b' }}>
                        Drag & Drop part structure is not initialized for this template yet.
                      </p>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        onClick={initDndPart}
                      >
                        Initialize Drag & Drop Part
                      </button>
                    </div>
                  );
                }

                const categories = part.categories || [];
                const items = part.items || [];
                const answerKey = part.answerKey || {};

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {currentStep === 3 && (
                      <div className={styles.wizardStepContent}>
                    {/* Layout Configuration */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>DND Layout Mode</label>
                        <select
                          className={styles.select}
                          value={part.layoutMode || 'category_sort'}
                          onChange={e => updateDndPartProp('layoutMode', e.target.value)}
                        >
                          <option value="category_sort">Category Sort (Standard Columns)</option>
                          <option value="ordering">Ordering (Sequential sorting)</option>
                          <option value="grid_fill">Grid Fill (Column Grid)</option>
                          <option value="table_fill">Table Fill (Matrix Grid)</option>
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>Card Visual Style</label>
                        <select
                          className={styles.select}
                          value={part.cardStyle || 'standard'}
                          onChange={e => updateDndPartProp('cardStyle', e.target.value)}
                        >
                          <option value="standard">Standard Bordered Card</option>
                          <option value="transparent">Transparent Clipart Card</option>
                          <option value="compact">Compact Small Card</option>
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Counts Configuration */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>Dynamic Categories Display Count</label>
                        <input
                          type="text"
                          className={styles.input}
                          style={{ padding: '8px 12px' }}
                          value={part.categoryCount || ''}
                          placeholder="e.g. 2, or [var] (leave blank for all)"
                          onChange={e => updateDndPartProp('categoryCount', e.target.value)}
                        />
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                        <label>Dynamic Drag Items Display Count</label>
                        <input
                          type="text"
                          className={styles.input}
                          style={{ padding: '8px 12px' }}
                          value={part.itemCount || ''}
                          placeholder="e.g. 4, or [var] (leave blank for all)"
                          onChange={e => updateDndPartProp('itemCount', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Categories Management */}
                    <div style={{ padding: '16px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0d9488' }}>
                          📁 Columns / Categories ({categories.length})
                        </h4>
                        <button
                          type="button"
                          className={styles.btn}
                          style={{ padding: '4px 10px', fontSize: '11px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={addDndCategory}
                        >
                          + Add Category
                        </button>
                      </div>

                      <div className={styles.dndGrid}>
                        {categories.map((cat, catIdx) => (
                          <div key={catIdx} className={styles.dndCard}>
                            <button
                              type="button"
                              className={styles.dndDeleteBtn}
                              onClick={() => removeDndCategory(catIdx)}
                              disabled={categories.length <= 1}
                              title="Remove Category"
                            >
                              ✕
                            </button>

                            <div className={styles.dndPreviewBox}>
                              {(() => {
                                const urlStr = cat.prefillImageUrl || '';
                                const previewUrl = getImageUrlPreview(urlStr);
                                if (previewUrl) {
                                  return <img src={previewUrl} alt="Preview" className={styles.dndPreviewImage} />;
                                }
                                return <div className={styles.dndPreviewText}>{cat.label || 'Empty'}</div>;
                              })()}
                            </div>

                            <div className={styles.dndFormControls}>
                              <div>
                                <label>Category ID</label>
                                <input
                                  type="text"
                                  value={cat.id || ''}
                                  onChange={e => updateDndCategory(catIdx, 'id', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Label Text</label>
                                <input
                                  type="text"
                                  value={cat.label || ''}
                                  onChange={e => updateDndCategory(catIdx, 'label', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Prefill Image / Icon</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input
                                    type="text"
                                    value={cat.prefillImageUrl || ''}
                                    placeholder="URL or [var]"
                                    onChange={e => updateDndCategory(catIdx, 'prefillImageUrl', e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                    style={{ padding: '0 8px' }}
                                    onClick={() => openGallery('dnd_category_prefillImageUrl_' + catIdx, cat.prefillImageUrl || '')}
                                  >
                                    🖼️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div className={styles.wizardStepContent}>
                    {/* Drag Items Management */}
                    <div style={{ padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>
                          🏷️ Drag Items ({items.length})
                        </h4>
                        <button
                          type="button"
                          className={styles.btn}
                          style={{ padding: '4px 10px', fontSize: '11px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={addDndItem}
                        >
                          + Add Drag Item
                        </button>
                      </div>

                      {(() => {
                        const groupedItems = {};
                        const unassignedItems = [];

                        categories.forEach(c => {
                          groupedItems[c.id] = { category: c, items: [] };
                        });

                        items.forEach((item, originalIndex) => {
                          const targetCat = answerKey[item.id];
                          if (targetCat && groupedItems[targetCat]) {
                            groupedItems[targetCat].items.push({ item, index: originalIndex });
                          } else {
                            unassignedItems.push({ item, index: originalIndex });
                          }
                        });

                        const renderCard = ({ item, index }) => (
                          <div key={index} className={styles.dndCard}>
                            <button
                              type="button"
                              className={styles.dndDeleteBtn}
                              onClick={() => removeDndItem(index)}
                              disabled={items.length <= 1}
                              title="Remove Item"
                            >
                              ✕
                            </button>

                            <div className={styles.dndPreviewBox}>
                              {(() => {
                                const urlStr = item.imageUrl || '';
                                if (isInlineSvg(urlStr)) {
                                  return (
                                    <span 
                                      style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                      dangerouslySetInnerHTML={{ __html: cleanSvgContent(urlStr) }} 
                                    />
                                  );
                                }
                                if (isInlineSvg(item.svg)) {
                                  return (
                                    <span 
                                      className="svg-preview-container"
                                      style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                                      dangerouslySetInnerHTML={{ __html: cleanSvgContent(item.svg) }} 
                                    />
                                  );
                                }
                                const previewUrl = getImageUrlPreview(urlStr);
                                if (previewUrl) {
                                  return <img src={previewUrl} alt="Preview" className={styles.dndPreviewImage} />;
                                }
                                return <div className={styles.dndPreviewText}>{item.content || 'Empty'}</div>;
                              })()}
                            </div>

                            <div className={styles.dndFormControls}>
                              <div>
                                <label>Item ID</label>
                                <input
                                  type="text"
                                  value={item.id || ''}
                                  onChange={e => updateDndItem(index, 'id', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Card Text / Content</label>
                                <input
                                  type="text"
                                  value={item.content || ''}
                                  placeholder="Text label"
                                  onChange={e => updateDndItem(index, 'content', e.target.value)}
                                />
                              </div>
                              <div>
                                <label>Target Category</label>
                                <select
                                  value={answerKey[item.id] || ''}
                                  onChange={e => updateDndAnswerKey(item.id, e.target.value)}
                                >
                                  <option value="">-- Unassigned --</option>
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.label} ({c.id})</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ flex: 1 }}>
                                  <label>Image URL</label>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input
                                      type="text"
                                      value={item.imageUrl || ''}
                                      placeholder="URL or [var]"
                                      onChange={e => updateDndItem(index, 'imageUrl', e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      className={styles.btn + ' ' + styles.btnSecondary}
                                      style={{ padding: '0 8px' }}
                                      onClick={() => openGallery('dnd_item_imageUrl_' + index, item.imageUrl || '')}
                                    >
                                      🖼️
                                    </button>
                                  </div>
                                </div>
                                <div style={{ width: '60px' }}>
                                  <label>Width</label>
                                  <input
                                    type="text"
                                    value={item.imageWidth || ''}
                                    placeholder="e.g. 80"
                                    onChange={e => updateDndItem(index, 'imageWidth', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <label>Inline SVG Markup</label>
                                <input
                                  type="text"
                                  value={item.svg || ''}
                                  placeholder="<svg>...</svg> or [var]"
                                  onChange={e => updateDndItem(index, 'svg', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );

                        return (
                          <div>
                            {unassignedItems.length > 0 && (
                              <div className={styles.dndCategoryGroup}>
                                <div className={styles.dndCategoryHeader} style={{ color: '#64748b' }}>
                                  Unassigned Items ({unassignedItems.length})
                                </div>
                                <div className={styles.dndGrid}>
                                  {unassignedItems.map(renderCard)}
                                </div>
                              </div>
                            )}

                            {Object.values(groupedItems).map(group => {
                              if (group.items.length === 0) return null;
                              return (
                                <div key={group.category.id} className={styles.dndCategoryGroup}>
                                  <div className={styles.dndCategoryHeader} style={{ color: '#1d4ed8' }}>
                                    {group.category.label} ({group.category.id}) - {group.items.length} item(s)
                                  </div>
                                  <div className={styles.dndGrid}>
                                    {group.items.map(renderCard)}
                                  </div>
                                </div>
                              );
                            })}

                            {Object.values(groupedItems).every(g => g.items.length === 0) && unassignedItems.length === 0 && (
                              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                No items added yet. Click "+ Add Drag Item" to begin.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {currentStep === 2 && (
                <div className={styles.wizardStepContent}>
              {/* Explanation */}
              <div className={styles.formGroup}>
                <label htmlFor="tpl-explanation">Step-by-step Solution Explanation</label>
                <textarea
                  id="tpl-explanation"
                  className={styles.textarea}
                  value={template.explanation?.sections?.[0]?.content || ''}
                  placeholder="Use variables like [A], [B], [Result] in explanation text."
                  onChange={(e) => {
                    updateField('explanation', {
                      sections: [{ type: 'text', content: e.target.value }]
                    });
                  }}
                />
              </div>

              {/* Concept & Meta Configuration */}
              <div className={styles.sectionTitle}>
                <span>Concept & Meta Config Flags</span>
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Enable specialized conceptual and audio options for practice sessions.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.hasCarry)}
                      onChange={(e) => updateMetaConfigProp('hasCarry', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    ➕ Carry Over (Addition)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.hasBorrow)}
                      onChange={(e) => updateMetaConfigProp('hasBorrow', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    ➖ Borrowing (Subtraction)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.hasRemainder)}
                      onChange={(e) => updateMetaConfigProp('hasRemainder', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    ➗ Remainder (Division)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.oddEven)}
                      onChange={(e) => updateMetaConfigProp('oddEven', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🔢 Odd / Even Config
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.readable)}
                      onChange={(e) => updateMetaConfigProp('readable', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🗣️ Readable (TTS Enabled)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(template.metaConfig?.readOptions)}
                      onChange={(e) => updateMetaConfigProp('readOptions', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    🎙️ Read Options (TTS Choices)
                  </label>
                </div>
                  </div>
                </div>
              )}

                {currentStep === 6 && (
                  <div className={styles.wizardStepContent}>
                {renderCurriculumLinkerCard()}

                {/* Save Button */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnPrimary}
                    style={{ flex: 1, padding: '12px' }}
                    onClick={handleSave}
                    disabled={saving || (!!selectedId && staticList.some(s => s.id === selectedId))}
                  >
                    {saving ? 'Saving to Database...' : 'Save Template to MongoDB'}
                  </button>
                </div>

                {saveStatus && (
                  <div className={`${styles.statusBar} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                    {saveStatus.text}
                  </div>
                )}
                {selectedId && staticList.some(s => s.id === selectedId) && (
                  <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px', textAlign: 'center' }}>
                    ⚠️ Static catalogs are read-only. Click "Create New Template" or change the Template ID to save a custom copy.
                  </p>
                )}
                  </div>
                )}

              </>
            )}
            </div>
          </section>

          {/* Simulator Preview Card */}
          <section className={`${styles.panel} ${styles.simulator}`} style={{ display: (currentStep >= 5) ? 'block' : 'none' }}>
            <div className={styles.panelHeader} style={{ display: currentStep === 5 ? 'flex' : 'none' }}>
              <div className={styles.simulatorHeader}>
                <h2>Live Preview</h2>
                <div className={styles.deviceToggles}>
                  <button 
                    className={`${styles.deviceToggleBtn} ${previewDevice === 'desktop' ? styles.deviceToggleBtnActive : ''}`}
                    onClick={() => setPreviewDevice('desktop')}
                    title="Desktop View"
                  >
                    🖥️
                  </button>
                  <button 
                    className={`${styles.deviceToggleBtn} ${previewDevice === 'tablet' ? styles.deviceToggleBtnActive : ''}`}
                    onClick={() => setPreviewDevice('tablet')}
                    title="Tablet View"
                  >
                    📱
                  </button>
                  <button 
                    className={`${styles.deviceToggleBtn} ${previewDevice === 'mobile' ? styles.deviceToggleBtnActive : ''}`}
                    onClick={() => setPreviewDevice('mobile')}
                    title="Mobile View"
                  >
                    📱
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnSecondary}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                >
                  {isPreviewFullscreen ? '↙️ Exit Full Screen' : '↗️ Full Screen'}
                </button>
              </div>
            </div>

            <div className={styles.panelBody}>
              {currentStep === 5 && (
                <>
              {evaluatedQuestion.ok ? (
                <div className={styles.previewWrapper} style={isPreviewFullscreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: '#f8fafc', padding: '24px', overflowY: 'auto', margin: 0 } : {}}>
                  {isPreviewFullscreen && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewFullscreen(false)}
                      style={{
                        position: 'fixed',
                        top: '16px',
                        right: '16px',
                        zIndex: 10000,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      ↙️ Exit Full Screen
                    </button>
                  )}
                  <div className={`${styles.deviceContainer} ${styles[previewDevice] || ''}`}>
                    <div className={styles.previewContainer}>
                      <div className={styles.practicePrompt}>
                    {evaluatedQuestion.question.questionText}
                  </div>

                  {/* Render Visual Parts (SVG / image / visual_panel / categorization / fill-in-the-blank) */}
                  {(() => {
                    const q = evaluatedQuestion.question;
                    const isVisualChoice = q.type === 'visual_choice';
                    const isCategorization = q.type === 'categorizationv2' || q.type === 'categorization';
                    const panels = q.parts.filter(p => p.type === 'visual_panel');

                    const renderItemVisual = (item) => {
                      const imageWidth = Number(item.imageWidth) || 60;
                      const svgContent = item.svg ? cleanSvgContent(item.svg) : (item.imageUrl && isInlineSvg(item.imageUrl) ? cleanSvgContent(item.imageUrl) : null);
                      const imageUrl = item.imageUrl;
                      const label = item.content || item.label;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' }}>
                          {svgContent ? (
                            <span
                              aria-hidden="true"
                              style={{
                                width: `${imageWidth}px`,
                                height: `${imageWidth}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                          ) : imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              style={{
                                maxWidth: `${imageWidth}px`,
                                maxHeight: `${imageWidth}px`,
                                objectFit: 'contain',
                                display: 'block'
                              }}
                            />
                          ) : null}
                          {label && (
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                              {label}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Categorization (Drag & Drop) Preview */}
                        {isCategorization && (
                          <div style={{ marginTop: '20px', width: '100%' }}>
                            {/* Categories Columns */}
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                              {(q.categories || []).map((cat, idx) => {
                                const catItems = previewControls.showCorrectAnswer
                                  ? (q.items || []).filter(item => {
                                      const ansKey = q.answer || q.answerKey || q.parts?.[0]?.answerKey || {};
                                      return ansKey[item.id] === cat.id || item.target === cat.id;
                                    })
                                  : [];

                                return (
                                  <div
                                    key={cat.id || idx}
                                    style={{
                                      flex: 1,
                                      minWidth: '180px',
                                      maxWidth: '300px',
                                      background: '#f8fafc',
                                      border: '2px dashed #cbd5e1',
                                      borderRadius: '12px',
                                      padding: '16px',
                                      textAlign: 'center',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}>
                                      {cat.label}
                                    </div>
                                    {(cat.prefillImageUrl || cat.imageUrl) && (
                                      <img
                                        src={cat.prefillImageUrl || cat.imageUrl}
                                        alt=""
                                        style={{
                                          maxWidth: '80px',
                                          maxHeight: '80px',
                                          objectFit: 'contain',
                                          marginBottom: '12px',
                                          borderRadius: '8px'
                                        }}
                                      />
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minHeight: '80px', justifyContent: 'center' }}>
                                      {catItems.map((item, itemIdx) => (
                                        <div
                                          key={item.id || itemIdx}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            color: '#334155',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            fontWeight: 600,
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          {renderItemVisual(item)}
                                        </div>
                                      ))}
                                      {catItems.length === 0 && (
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Drop zone</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Items Tray */}
                            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                Drag Items (Correct assignments shown above)
                              </div>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {(q.items || []).filter(item => {
                                  if (!previewControls.showCorrectAnswer) return true;
                                  const ansKey = q.answer || q.answerKey || q.parts?.[0]?.answerKey || {};
                                  const targetCat = ansKey[item.id] || item.target;
                                  return !targetCat || !(q.categories || []).some(c => c.id === targetCat);
                                }).map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '8px 16px',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                      cursor: 'grab',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minWidth: '80px'
                                    }}
                                  >
                                    {renderItemVisual(item)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* General Parts-based rendering (FIB, etc.) */}
                        {!isVisualChoice && !isCategorization && Array.isArray(q.parts) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', margin: '12px 0' }}>
                            {q.parts.map((p, idx) => {
                              if (p.type === 'text') {
                                return (
                                  <div key={idx} style={{ fontSize: '16px', color: '#1e293b', lineHeight: '1.6' }}>
                                    {p.content && typeof p.content === 'string' && p.content.includes('[[') ? (
                                      <span>
                                        {p.content.split(/(\[\[.*?\]\])/g).map((chunk, cIdx) => {
                                          if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
                                            const key = chunk.slice(2, -2).trim();
                                            const correctVal = q.answer?.[key] || q.correctAnswer?.[key] || '';
                                            return (
                                              <input
                                                key={cIdx}
                                                type="text"
                                                value={correctVal}
                                                disabled
                                                style={{
                                                  width: `${Math.max(String(correctVal).length * 10 + 20, 60)}px`,
                                                  padding: '4px 8px',
                                                  margin: '0 4px',
                                                  border: '2px solid #22c55e',
                                                  borderRadius: '6px',
                                                  textAlign: 'center',
                                                  fontWeight: 'bold',
                                                  color: '#15803d',
                                                  background: '#f0fdf4'
                                                }}
                                              />
                                            );
                                          }
                                          return chunk;
                                        })}
                                      </span>
                                    ) : (
                                      p.content
                                    )}
                                  </div>
                                );
                              }
                              if (p.type === 'latex') {
                                return (
                                  <div key={idx} style={{ fontSize: '18px', fontFamily: 'math', margin: '4px 0', color: '#0f172a' }}>
                                    {p.content}
                                  </div>
                                );
                              }
                              if (p.type === 'svg') {
                                return (
                                  <div
                                    key={idx}
                                    className={styles.svgWrapper}
                                    dangerouslySetInnerHTML={{ __html: p.content }}
                                  />
                                );
                              }
                              if (p.type === 'image') {
                                const widthVal = p.commonImageWidth || p.maxWidth || '180px';
                                const resolvedWidth = typeof widthVal === 'number' ? `${widthVal}px` : widthVal;
                                return (
                                  <div
                                    key={idx}
                                    className={styles.svgWrapper}
                                    style={{ margin: '15px auto', display: 'flex', justifyContent: 'center' }}
                                  >
                                    <img
                                      src={p.imageUrl}
                                      alt="Template Visual"
                                      style={{ width: resolvedWidth, maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                  </div>
                                );
                              }
                              if (p.type === 'categorization' || p.type === 'categorizationv2' || p.type === 'drag_drop') {
                                return (
                                  <div key={idx} style={{ marginTop: '10px', width: '100%' }}>
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                                      {(p.categories || []).map((cat, catIdx) => {
                                        const catItems = previewControls.showCorrectAnswer
                                          ? (p.items || []).filter(item => {
                                              const ansKey = p.answer || p.answerKey || {};
                                              return ansKey[item.id] === cat.id || item.target === cat.id;
                                            })
                                          : [];
                                        return (
                                          <div
                                            key={cat.id || catIdx}
                                            style={{
                                              flex: 1,
                                              minWidth: '180px',
                                              maxWidth: '300px',
                                              background: '#f8fafc',
                                              border: '2px dashed #cbd5e1',
                                              borderRadius: '12px',
                                              padding: '16px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', fontSize: '14px' }}>{cat.label}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px', justifyContent: 'center' }}>
                                              {catItems.map((item, itemIdx) => (
                                                <div
                                                  key={item.id || itemIdx}
                                                  style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    color: '#334155',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    fontWeight: 600
                                                  }}
                                                >
                                                  {item.content || item.label}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {(p.items || []).filter(item => {
                                          if (!previewControls.showCorrectAnswer) return true;
                                          const ansKey = p.answer || p.answerKey || {};
                                          const targetCat = ansKey[item.id] || item.target;
                                          return !targetCat || !(p.categories || []).some(c => c.id === targetCat);
                                        }).map((item, itemIdx) => (
                                          <div
                                            key={item.id || itemIdx}
                                            style={{
                                              background: '#ffffff',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: '8px',
                                              padding: '8px 16px',
                                              fontSize: '13px',
                                              fontWeight: 600,
                                              color: '#1e293b'
                                            }}
                                          >
                                            {item.content || item.label}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              if (p.type === 'hotspot_canvas') {
                                const bgUrl = p.backgroundUrl || p.backgroundImage;
                                const w = p.canvasWidth || 500;
                                const h = p.canvasHeight || 320;
                                const hotspotsList = p.hotspots || [];
                                
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: 'relative',
                                      width: '100%',
                                      maxWidth: `${w}px`,
                                      aspectRatio: `${w} / ${h}`,
                                      margin: '20px auto',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      background: '#f8fafc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    {p.backgroundSvg ? (
                                      <div
                                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                        dangerouslySetInnerHTML={{ __html: p.backgroundSvg }}
                                      />
                                    ) : bgUrl ? (
                                      <img
                                        src={bgUrl}
                                        alt="Hotspot Background"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
                                      />
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', zIndex: 1 }}>
                                        No background image or SVG specified
                                      </span>
                                    )}
                                    {/* Overlay Hotspots */}
                                    {hotspotsList.map((hs, hsIdx) => {
                                      // Scale coordinate factors relative to nominal size (w, h)
                                      const leftPercent = (hs.x / w) * 100;
                                      const topPercent = (hs.y / h) * 100;
                                      const widthPercent = (hs.width / w) * 100;
                                      const heightPercent = (hs.height / h) * 100;
                                      
                                      return (
                                        <div
                                          key={hs.id || hsIdx}
                                          style={{
                                            position: 'absolute',
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: `${heightPercent}%`,
                                            border: '2px dashed #4f46e5',
                                            borderRadius: '6px',
                                            background: 'rgba(79, 70, 229, 0.12)',
                                            color: '#4f46e5',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.15s ease',
                                            zIndex: 2,
                                            boxSizing: 'border-box'
                                          }}
                                        >
                                          <span>{hs.label || `Zone ${hsIdx + 1}`}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}

                        {/* Visual Choice Panels */}
                        {isVisualChoice && panels.length > 0 && (
                          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
                            {panels.map((panel, idx) => {
                              const isCorrect = idx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    border: isCorrect ? '3px solid #22c55e' : '2px solid #93c5fd',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#ffffff',
                                    position: 'relative',
                                    boxShadow: isCorrect
                                      ? '0 4px 16px rgba(34, 197, 94, 0.2)'
                                      : '0 2px 8px rgba(147, 197, 253, 0.2)',
                                    cursor: 'pointer',
                                    minWidth: '140px'
                                  }}
                                >
                                  <div
                                    dangerouslySetInnerHTML={{ __html: panel.svg }}
                                    style={{ display: 'block' }}
                                  />
                                  {isCorrect && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                      background: '#22c55e',
                                      color: '#ffffff',
                                      borderRadius: '99px',
                                      padding: '2px 8px',
                                      fontSize: '10px',
                                      fontWeight: 800
                                    }}>
                                      ✓ Correct
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Render Text MCQ Options (hidden for visual_choice / categorization) */}
                  {evaluatedQuestion.question.type !== 'visual_choice' && evaluatedQuestion.question.type !== 'categorizationv2' && evaluatedQuestion.question.type !== 'categorization' && (
                  <div className={styles.optionsContainer}>
                    {evaluatedQuestion.question.options.map((opt, idx) => {
                      const isCorrect = idx === evaluatedQuestion.question.correctAnswerIndex;
                      return (
                        <div
                          key={opt.id}
                          className={`${styles.optionBtn} ${isCorrect ? styles.optionBtnCorrect : ''}`}
                        >
                          <span>{opt.label}</span>
                          {isCorrect && <span className={styles.optionBadge}>Correct</span>}
                        </div>
                      );
                    })}
                  </div>
                  )}

                  {/* Render Explanation */}
                  <div className={styles.explanationBox}>
                    <div className={styles.explanationTitle}>Explanation (Step-by-Step)</div>
                    <p className={styles.explanationText}>
                      {evaluatedQuestion.question.explanation?.sections?.[0]?.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
              ) : (
                <div className={`${styles.statusBar} ${styles.statusError}`} style={{ marginTop: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Evaluation Error:</p>
                  <pre style={{ margin: '8px 0 0 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {evaluatedQuestion.error}
                  </pre>
                  <p style={{ fontSize: '11px', margin: '8px 0 0 0', color: '#991b1b' }}>
                    Make sure formulas refer to defined variables, mathematical expressions evaluate to integers, and there are no syntax loops.
                  </p>
                </div>
              )}

              {/* JSON code viewer */}
              <div className={styles.jsonToggleArea}>
                <button
                  type="button"
                  className={styles.jsonTitle}
                  style={{ background: 'none', border: 'none', width: '100%', textTransform: 'none' }}
                  onClick={() => setShowJson(!showJson)}
                >
                  <span>{showJson ? '▼ Hide Template JSON Recipe' : '▶ Show Template JSON Recipe'}</span>
                </button>
                
                {showJson && (
                  <pre className={styles.codeBlock}>
                    {JSON.stringify(template, null, 2)}
                  </pre>
                )}
              </div>
                  </>
                )}
              
              {currentStep === 5 && (
              <div className={styles.controlsPanel}>
                {/* Controls and Sample Set */}
                <div>
                  <div className={styles.controlSectionTitle}>Preview Controls</div>
                  <div className={styles.toggleRow}>
                    <label>Randomize Items</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.randomizeItems}
                      onClick={() => setPreviewControls(prev => ({ ...prev, randomizeItems: !prev.randomizeItems }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <label>Randomize Order</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.randomizeOrder}
                      onClick={() => setPreviewControls(prev => ({ ...prev, randomizeOrder: !prev.randomizeOrder }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <label>Show Correct Answer</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.showCorrectAnswer}
                      onClick={() => setPreviewControls(prev => ({ ...prev, showCorrectAnswer: !prev.showCorrectAnswer }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <label style={{ color: '#4f46e5', fontWeight: 600 }}>Preview as Student</label>
                    <div 
                      className={styles.toggleSwitch} 
                      data-active={previewControls.previewAsStudent}
                      onClick={() => setPreviewControls(prev => ({ ...prev, previewAsStudent: !prev.previewAsStudent }))}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className={styles.controlSectionTitle}>Sample Set</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <select 
                      className={styles.select} 
                      value={sampleSet} 
                      onChange={(e) => setSampleSet(e.target.value)}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <option value="Sample Set 1">Sample Set 1</option>
                      <option value="Sample Set 2">Sample Set 2</option>
                    </select>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={() => setSeed(Math.floor(Math.random() * 100000).toString())}
                      style={{ padding: '0 12px', whiteSpace: 'nowrap' }}
                      title={`Current Seed: ${seed}`}
                    >
                      🎲 New Seed
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Items</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{template.parts?.[0]?.items?.length || 0}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Categories</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{template.parts?.[0]?.categories?.length || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {currentStep >= 5 && (
              <div className={styles.validationPanel}>
                {/* Validation and Status */}
                <div>
                  <div className={styles.controlSectionTitle}>Validation</div>
                  {[
                    { label: 'Template information is complete', passed: !!(template.id && template.title) },
                    { label: 'At least 2 categories added', passed: (template.parts?.[0]?.categories?.length || 0) >= 2 },
                    { label: 'At least 2 items in total', passed: (template.parts?.[0]?.items?.length || 0) >= 2 },
                    { label: 'All items assigned to categories', passed: (template.parts?.[0]?.items || []).every(i => (template.parts[0].answer || template.parts[0].answerKey)?.[i.id]) },
                    { label: 'Preview generated successfully', passed: !!evaluatedQuestion?.ok }
                  ].map((check, idx) => (
                    <div key={idx} className={styles.validationItem}>
                      <span className={styles.validationLabel}>{check.label}</span>
                      <div className={`${styles.statusIcon} ${check.passed ? styles.passed : styles.failed}`}>
                        {check.passed ? '✓' : '✓'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.overallStatusBox}>
                  <div className={styles.controlSectionTitle} style={{ marginBottom: 0 }}>Overall Status</div>
                  {(() => {
                    const allPassed = [
                      !!(template.id && template.title),
                      (template.parts?.[0]?.categories?.length || 0) >= 2,
                      (template.parts?.[0]?.items?.length || 0) >= 2,
                      (template.parts?.[0]?.items || []).every(i => (template.parts[0].answer || template.parts[0].answerKey)?.[i.id]),
                      !!evaluatedQuestion?.ok
                    ].every(Boolean);

                    return allPassed ? (
                      <>
                        <div className={styles.badgeReady}>✓ Ready to Publish</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                          All good!<br/>Your template is ready<br/>to be published.
                        </div>
                        <div style={{ marginTop: 'auto', alignSelf: 'flex-end', fontSize: '32px' }}>🎉</div>
                      </>
                    ) : (
                      <>
                        <div className={styles.badgeNotReady}>⚠️ Not Ready</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                          Please resolve the missing validation checks to publish.
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              )}

            </div>
          </section>
        </div>
      </div>
      
      {/* Gallery Modal Dialog */}
      {showGallery && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  🖼️ Media Assets Manager
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Select one or more items to include in this question template.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Tab Header */}
              <div className={styles.galleryTabs} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <button
                  type="button"
                  className={`${styles.galleryTabBtn} ${!isWebSearch ? styles.galleryTabBtnActive : ''}`}
                  onClick={() => setIsWebSearch(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📁 Local Assets Gallery
                </button>
                <button
                  type="button"
                  className={`${styles.galleryTabBtn} ${isWebSearch ? styles.galleryTabBtnActive : ''}`}
                  onClick={() => setIsWebSearch(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🔍 Web Clipart (DuckDuckGo)
                </button>
              </div>

              {/* Local Assets Tab Contents */}
              {!isWebSearch && (
                <>
                  {/* Upload Dropzone */}
                  <div
                    className={`${styles.uploadZone} ${galleryDragOver ? styles.uploadZoneDrag : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setGalleryDragOver(true); }}
                    onDragLeave={() => setGalleryDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setGalleryDragOver(false);
                      handleGalleryUpload(e.dataTransfer.files);
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/*';
                      input.onchange = (e) => handleGalleryUpload(e.target.files);
                      input.click();
                    }}
                  >
                    {galleryUploading ? (
                      <>
                        <div className={styles.loadingSpinner} style={{ marginBottom: '8px' }} />
                        <p className={styles.uploadZoneTitle}>Uploading image assets to Cloud Storage...</p>
                      </>
                    ) : (
                      <>
                        <p className={styles.uploadZoneTitle}>📤 Drag & drop images here, or click to upload</p>
                        <p className={styles.uploadZoneDesc}>WebP, PNG, JPG, or SVG. Direct upload to R2 bucket.</p>
                      </>
                    )}
                  </div>

                  {/* Search and Category/Tag Filters */}
                  <div className={styles.searchBarContainer} style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Search assets by name, category, or tags..."
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      style={{ flex: 1, minWidth: '240px' }}
                    />
                    {(gallerySearch || selectedCategory !== 'all' || selectedTag) && (
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnSecondary}
                        onClick={() => {
                          setGallerySearch('');
                          setSelectedCategory('all');
                          setSelectedTag(null);
                        }}
                        style={{ padding: '8px 16px', borderRadius: '8px' }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Dynamic Category Pill Bar */}
                  <div className={styles.categoryBar}>
                    {availableCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryPillActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === 'all' ? '🌐 All Categories' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Tag Chips */}
                  {popularTags.length > 0 && (
                    <div className={styles.tagChipsContainer}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
                        Popular Tags:
                      </span>
                      {popularTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          className={`${styles.tagChip} ${selectedTag === tag ? styles.tagChipActive : ''}`}
                          onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Local Grid View */}
                  {galleryLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontWeight: 600 }}>
                      <div className={styles.loadingSpinner} style={{ margin: '0 auto 12px auto' }} />
                      Loading gallery assets...
                    </div>
                  ) : galleryImages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                      No uploaded images found in the gallery. Use the dropzone above to upload new images.
                    </div>
                  ) : filteredLocalImages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                      No matching local assets found for active filters.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '12px'
                      }}
                    >
                      {filteredLocalImages.map((img) => {
                        const isSelected = selectedGalleryUrls.includes(img.url);
                        const selIdx = selectedGalleryUrls.indexOf(img.url);
                        
                        return (
                          <div
                            key={img.key}
                            style={{
                              border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: '#ffffff',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                              boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.12)' : 'none',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* Clickable Image Thumbnail Box */}
                            <div
                              onClick={() => handleSelectGalleryImage(img.url)}
                              className={styles.checkeredBg}
                              style={{
                                width: '100%',
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                cursor: 'pointer',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={img.url}
                                alt={img.key}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'all 0.2s ease' }}
                              />

                              {/* Hover Details Badges */}
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  left: '4px',
                                  background: 'rgba(15, 23, 42, 0.75)',
                                  color: '#ffffff',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  fontSize: '8px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {img.dimensions ? `${img.dimensions.width}×${img.dimensions.height}` : '512×512'}
                              </div>
                            </div>

                            {/* Label, Metadata Edit and Zoom Controls */}
                            <div
                              style={{
                                padding: '8px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                background: isSelected ? '#f5f3ff' : '#ffffff'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#1e293b',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {img.name || img.key.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ')}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                                  {img.classification?.category || 'general'}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleOpenEditMetadata(img); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                                    title="Edit Metadata (Linguistics / Tags)"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setGalleryZoomImg(img.url); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                                    title="View Full Size"
                                  >
                                    🔍
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Top Selected Badge Order */}
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#4f46e5',
                                  color: '#ffffff',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                {selIdx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Web Search Tab Contents */}
              {isWebSearch && (
                <>
                  <form onSubmit={handleWebSearch} className={styles.searchBarContainer} style={{ marginBottom: '16px' }}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Search transparent clipart on the web (e.g. apple, dog, tree)..."
                      value={webSearchQuery}
                      onChange={(e) => setWebSearchQuery(e.target.value)}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <select
                      className={styles.webSearchSelect}
                      value={webSearchType}
                      onChange={(e) => setWebSearchType(e.target.value)}
                    >
                      <option value="clipart">🎨 Clipart</option>
                      <option value="photo">📷 Photo</option>
                      <option value="any">🌐 Any</option>
                    </select>
                    <button
                      type="submit"
                      className={styles.btn + ' ' + styles.btnPrimary}
                      disabled={webSearching || !webSearchQuery.trim()}
                    >
                      {webSearching ? 'Searching...' : 'Search Web'}
                    </button>
                  </form>

                  {webSearching ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                      <div className={styles.loadingSpinner} />
                      <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Searching DuckDuckGo...</div>
                    </div>
                  ) : webResults.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
                      Enter a query above to search DuckDuckGo for clipart.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '12px'
                      }}
                    >
                      {webResults.map((item) => {
                        const localUrl = importedWebUrls[item.image];
                        const isImported = !!localUrl;
                        const isSelected = isImported && selectedGalleryUrls.includes(localUrl);
                        const selIdx = isSelected ? selectedGalleryUrls.indexOf(localUrl) : -1;
                        const isImporting = importingUrl === item.image;
                        
                        return (
                          <div
                            key={item.image}
                            onClick={() => !isImporting && handleImportWebImage(item.image)}
                            style={{
                              border: isSelected ? '2px solid #4f46e5' : isImported ? '2px solid #10b981' : '1px solid #e2e8f0',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              background: '#ffffff',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                              opacity: isImporting ? 0.6 : 1,
                              cursor: isImporting ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <div className={styles.checkeredBg} style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                              <img
                                src={item.thumbnail || item.image}
                                alt={item.title}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ padding: '8px', fontSize: '11px', fontWeight: 700, color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #f1f5f9' }}>
                              {item.title || 'Web Asset'}
                            </div>
                            
                            {isImporting && (
                              <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(255, 255, 255, 0.85)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                zIndex: 10
                              }}>
                                <div className={styles.loadingSpinner} />
                                <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 700, marginTop: '6px' }}>
                                  Importing...
                                </span>
                              </div>
                            )}

                            {isImported && !isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: '#10b981',
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                              }}>
                                Saved
                              </div>
                            )}

                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#4f46e5',
                                  color: '#ffffff',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                              >
                                {selIdx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Selection Queue & Re-ordering panel */}
            {selectedGalleryUrls.length > 0 && (
              <div className={styles.selectedDrawer}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                    Selection Queue ({selectedGalleryUrls.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedGalleryUrls([]); setGalleryImageLabels({}); }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '10px', fontWeight: 700, color: '#ef4444', textAlign: 'left', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>

                <div className={styles.selectedItemsList}>
                  {selectedGalleryUrls.map((url, idx) => {
                    const labelVal = galleryImageLabels[url] || '';
                    return (
                      <div
                        key={url}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        <div className={styles.selectedItemThumb}>
                          <img src={url} alt="selected" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          <div
                            className={styles.selectedItemRemove}
                            onClick={() => {
                              setSelectedGalleryUrls(prev => prev.filter(u => u !== url));
                              setGalleryImageLabels(prev => {
                                const copy = { ...prev };
                                delete copy[url];
                                return copy;
                              });
                            }}
                          >
                            ✕
                          </div>
                          <div className={styles.selectedItemBadge}>{idx + 1}</div>
                        </div>

                        {/* Reordering Controls & Label input */}
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              setSelectedGalleryUrls(prev => {
                                const copy = [...prev];
                                const tmp = copy[idx - 1];
                                copy[idx - 1] = copy[idx];
                                copy[idx] = tmp;
                                return copy;
                              });
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '1px 4px', fontSize: '8px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                          >
                            ◀
                          </button>
                          <input
                            type="text"
                            value={labelVal}
                            placeholder="Label..."
                            onChange={(e) => {
                              const val = e.target.value;
                              setGalleryImageLabels(prev => ({ ...prev, [url]: val }));
                            }}
                            style={{
                              width: '50px',
                              fontSize: '8px',
                              padding: '2px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                          <button
                            type="button"
                            disabled={idx === selectedGalleryUrls.length - 1}
                            onClick={() => {
                              setSelectedGalleryUrls(prev => {
                                const copy = [...prev];
                                const tmp = copy[idx + 1];
                                copy[idx + 1] = copy[idx];
                                copy[idx] = tmp;
                                return copy;
                              });
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '1px 4px', fontSize: '8px', cursor: idx === selectedGalleryUrls.length - 1 ? 'not-allowed' : 'pointer' }}
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnSecondary}
                    onClick={() => setShowGallery(false)}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnPrimary}
                    onClick={applyGallerySelection}
                    style={{ fontSize: '12px', padding: '8px 16px' }}
                  >
                    Apply Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Overlay */}
      {galleryZoomImg && (
        <div
          className={styles.detailPanelOverlay}
          onClick={() => setGalleryZoomImg(null)}
          style={{ zIndex: 10001 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            <div className={styles.checkeredBg} style={{ padding: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={galleryZoomImg} alt="Zoom" style={{ maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              className={styles.btn + ' ' + styles.btnSecondary}
              onClick={() => setGalleryZoomImg(null)}
              style={{ marginTop: '12px', width: '100%' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Metadata Editor Popup Dialog */}
      {editingMetaItem && (
        <div className={styles.detailPanelOverlay} style={{ zIndex: 10002 }}>
          <div className={styles.detailPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                ✏️ Edit Image Asset Metadata
              </h4>
              <button
                type="button"
                onClick={() => setEditingMetaItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
              <div className={styles.checkeredBg} style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <img src={editingMetaItem.url} alt="editing" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                <strong>Key:</strong> {editingMetaItem.key}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Singular Word Form</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditSingular}
                placeholder="e.g. apple, frog, balloon"
                onChange={e => setMetaEditSingular(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Plural Word Form</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditPlural}
                placeholder="e.g. apples, frogs, balloons"
                onChange={e => setMetaEditPlural(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Grammar Article</label>
              <select
                className={styles.select}
                value={metaEditArticle}
                onChange={e => setMetaEditArticle(e.target.value)}
              >
                <option value="a">a (consonants, e.g. a frog)</option>
                <option value="an">an (vowels, e.g. an apple)</option>
                <option value="some">some (uncountable, e.g. some ice)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Classification Category</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditCategory}
                placeholder="e.g. food, animal, shapes, vehicles"
                onChange={e => setMetaEditCategory(e.target.value)}
                style={{ textTransform: 'lowercase' }}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Classification Tags (comma separated)</label>
              <input
                type="text"
                className={styles.input}
                value={metaEditTags}
                placeholder="e.g. fruit, green, counter, flat"
                onChange={e => setMetaEditTags(e.target.value)}
                style={{ textTransform: 'lowercase' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setEditingMetaItem(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnPrimary}
                onClick={handleSaveMetadata}
                disabled={isSavingMeta}
                style={{ flex: 1 }}
              >
                {isSavingMeta ? 'Saving...' : 'Save Metadata'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em' }}>
                📖 Project Question Types & Schema Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  opacity: 0.8,
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '12px 24px 0 24px',
              gap: '8px',
              overflowX: 'auto',
            }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                { id: 'fillInTheBlank', label: 'Fill-In-The-Blank (FIB)' },
                { id: 'categorizationv2', label: 'Categorization' },
                { id: 'visual_choice', label: 'Visual Choice' },
                { id: 'covered', label: 'All Covered Types' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveGuideTab(t.id)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: activeGuideTab === t.id ? '#4f46e5' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeGuideTab === t.id ? '3px solid #4f46e5' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    paddingBottom: '12px',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: '#334155',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              {activeGuideTab === 'overview' && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>
                    Adaptive Question Templates Overview
                  </h4>
                  <p>
                    This project uses a <strong>dynamic variable-based template schema</strong> to automatically generate billions of unique educational math and English practice questions. Instead of hardcoding questions, templates define variables (e.g. integer ranges or formulas), visual layouts, and the interactive response mechanism.
                  </p>
                  <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0284c7', padding: '12px 16px', borderRadius: '8px', margin: '16px 0' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#0369a1' }}>💡 Dynamic Previews</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#0c4a6e' }}>
                      Click on any reference tab above to read details, view the JSON schema format, or <strong>instantly load that question type as an active template</strong> to test in the simulator.
                    </p>
                  </div>
                  <h5 style={{ margin: '16px 0 8px 0', color: '#1e293b', fontWeight: 700 }}>Project Core Formats:</h5>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>Multiple Choice (MCQ):</strong> Traditional choices generated from math/text variables.</li>
                    <li><strong>Fill-In-The-Blank (FIB):</strong> Text blocks with inline text input fields using double brackets `[[placeholder]]`.</li>
                    <li><strong>Categorization (Drag & Drop):</strong> Buckets with draggable cards correct-mapped via key-value mappings.</li>
                    <li><strong>Visual Choice:</strong> Clickable side-by-side SVG rendering panels (e.g. Which plate shows 5 apples?).</li>
                  </ul>
                </div>
              )}

              {activeGuideTab === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Multiple Choice (MCQ)</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[0]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load MCQ Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      MCQ questions display question text, an optional visual SVG (like spinners, jars, grids), and a shuffled list of choice buttons.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "mcq",
  "options": [
    { "label": "[Result]", "isCorrect": true },
    { "label": "[Result] + 1", "isCorrect": false }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'fillInTheBlank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Fill-In-The-Blank (FIB)</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[1]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load FIB Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      FIB formats render inline input boxes inside sentence parts. Use double-bracket placeholders like `[[ans]]` inside text parts and specify their targets in the `answer` object.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "fillInTheBlank",
  "parts": [
    { "type": "text", "content": "The sum of [A] and [B] is [[ans]]." }
  ],
  "answer": {
    "ans": "[Result]"
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'categorizationv2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Categorization / Drag & Drop</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[2]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load Categorization Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      Categorization formats render columns (categories) and an items tray. Users drag item cards into the correct category columns. Correct mappings are defined in the root `answer` object.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "categorizationv2",
  "parts": [
    {
      "type": "categorizationv2",
      "categories": [
        { "id": "even", "label": "Even" },
        { "id": "odd", "label": "Odd" }
      ],
      "items": [
        { "id": "item1", "content": "2" },
        { "id": "item2", "content": "3" }
      ]
    }
  ],
  "answer": {
    "item1": "even",
    "item2": "odd"
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'visual_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Visual Choice</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[3]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load Visual Choice Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      Visual Choice renders side-by-side panels containing dynamic SVGs (e.g. cupcakes or goldfish). One panel contains the correct target count and the other displays a distractor count. The user clicks on the correct panel to answer.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "visual_choice",
  "visuals": [
    {
      "component": "VisualChoice",
      "props": {
        "correctCount": "A",
        "itemType": "cupcake",
        "distractorMode": "auto"
      }
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'covered' && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>
                    All Question Types Covered in this Project
                  </h4>
                  <p>
                    The practice system supports various question layouts and styles. Here is a comprehensive list of all formats covered by the system and how they resolve internally:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Question Type / Alias</th>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Renderer Used</th>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Description & Features</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>mcq, multiplechoice, dynamic_pool</td>
                        <td style={{ padding: '10px' }}>MCQRenderer</td>
                        <td style={{ padding: '10px' }}>Shuffles option choices. Supports text choices and dynamic visual SVG panels.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>fillInTheBlank, fill_in_the_blank, gridArithmetic</td>
                        <td style={{ padding: '10px' }}>FillInTheBlankRenderer</td>
                        <td style={{ padding: '10px' }}>Renders inline input boxes inside text parts replacing double brackets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>categorization, categorizationv2, categorySort, sorting</td>
                        <td style={{ padding: '10px' }}>CategorizationRenderer</td>
                        <td style={{ padding: '10px' }}>Interactive columns with drag and drop zone blocks. Mapped via key-value targets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>visual_choice</td>
                        <td style={{ padding: '10px' }}>MCQRenderer (Custom layout)</td>
                        <td style={{ padding: '10px' }}>Side-by-side graphical counter cards where the panels act as response targets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>interactiveApplet, interactiveTool</td>
                        <td style={{ padding: '10px' }}>Applet/Tool Renderers</td>
                        <td style={{ padding: '10px' }}>Advanced applet modules (like counting sticks, interactive fraction pie, pizza sharing models).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setShowGuide(false)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Helper functions for parsing/serializing comma-separated labels and URLs
function parseList(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(item => {
    item = item.trim();
    const sepIdx = item.indexOf('::');
    if (sepIdx !== -1) {
      return {
        label: item.slice(0, sepIdx).trim(),
        value: item.slice(sepIdx + 2).trim()
      };
    }
    return {
      label: '',
      value: item
    };
  }).filter(x => x.value !== '');
}

function serializeList(list) {
  return list.map(item => {
    const label = (item.label || '').trim();
    const val = (item.value || '').trim();
    if (label) {
      return `${label}::${val}`;
    }
    return val;
  }).filter(Boolean).join(', ');
}

function cleanNameFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const parts = url.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt
    .replace(/^\d+[-_]/, '') // remove leading unix timestamps e.g. 1780656377875-
    .replace(/[-_]/g, ' ') // convert dashes/underscores to spaces
    .trim();
  return cleanName;
}

// Controlled component for editing a list of URLs and their labels
function LabelledListEditor({ value, onChange, placeholder }) {
  const items = parseList(value);

  const handleRowChange = (index, field, newVal) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newVal };
    onChange(serializeList(newItems));
  };

  const handleAddRow = () => {
    const newItems = [...items, { label: '', value: '' }];
    onChange(serializeList(newItems));
  };

  const handleRemoveRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(serializeList(newItems));
  };

  const handleAutoLabel = () => {
    const newItems = items.map(item => {
      if (item.label) return item; // keep existing label
      const val = item.value.trim();
      if (val.startsWith('http://') || val.startsWith('https://') || val.includes('/') || val.includes('.')) {
        return { ...item, label: cleanNameFromUrl(val) };
      }
      return item;
    });
    onChange(serializeList(newItems));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
      {/* Raw input for easy copy/paste */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Raw Value (comma-separated)</label>
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '6px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            resize: 'vertical',
            outline: 'none',
            background: '#ffffff'
          }}
        />
      </div>

      {/* Structured Rows */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Items & Labels ({items.length})</span>
            <button
              type="button"
              onClick={handleAutoLabel}
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Automatically generate labels from image URLs"
            >
              🪄 Auto-Label URLs
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
            {items.map((item, idx) => {
              const isUrl = typeof item.value === 'string' && (item.value.startsWith('http') || item.value.includes('/') || item.value.includes('.'));
              return (
                <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {isUrl ? (
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.value} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      📦
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      value={item.label}
                      placeholder="Label (e.g. Starfish)"
                      onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}
                    />
                    <input
                      type="text"
                      value={item.value}
                      placeholder="URL or standard item type"
                      onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        color: '#475569',
                        fontFamily: isUrl ? 'monospace' : 'inherit'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleAddRow}
        style={{
          background: '#4f46e5',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          alignSelf: 'flex-start'
        }}
      >
        ➕ Add URL / Item Row
      </button>
    </div>
  );
}
