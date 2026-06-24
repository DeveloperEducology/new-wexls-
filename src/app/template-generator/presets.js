// Auto-extracted presets

export const PRESET_EASY = {
  "name": "Simplification – BODMAS Easy",
  "type": "parameterized",
  "examId": "jnvst",
  "section": "arithmetic",
  "topic": "simplification",
  "difficulty": 0.25,
  "config": {
    "name": "Simplification – BODMAS Easy",
    "title": "Simplification – BODMAS Easy",
    "description": "Tests basic BODMAS rules using addition, subtraction, and multiplication.",
    "grade": "",
    "skillId": "",
    "competencyId": "",
    "difficultyLevel": "easy",
    "tags": ["BODMAS", "simplification", "arithmetic"],
    "constraints": {
      "uniqueOptions": true,
      "preventDuplicateWords": true,
      "minOptionCount": 4,
      "maxOptionCount": 4
    },
    "layoutConfig": {
      "mode": "prompt_top",
      "responsiveTarget": "desktop_first",
      "clickToSubmit": false
    },
    "interaction": {
      "engine": "mcq",
      "inputMode": "choice"
    },
    "variables": {
      "a": { "min": 5, "max": 20 },
      "b": { "min": 2, "max": 5 },
      "c": { "min": 6, "max": 10 },
      "d": { "min": 2, "max": 5 }
    },
    "derivations": {
      "multiply_part": "b * c",
      "add_part": "a + multiply_part",
      "correct_answer": "add_part - d",
      "distractor_1": "(a + b) * c - d",
      "distractor_2": "a + b * (c - d)",
      "distractor_3": "add_part + d"
    },
    "options": [
      { "label": "{{correct_answer}}", "isCorrect": true },
      { "label": "{{distractor_1}}", "isCorrect": false },
      { "label": "{{distractor_2}}", "isCorrect": false },
      { "label": "{{distractor_3}}", "isCorrect": false }
    ],
    "questionTemplate": "Simplify: {{a}} + {{b}} × {{c}} − {{d}}",
    "explanationTemplate": "According to BODMAS rules, multiplication must be performed before addition and subtraction.\n\nStep 1 (Multiplication): {{b}} × {{c}} = {{multiply_part}}.\nThe expression becomes: {{a}} + {{multiply_part}} − {{d}}.\n\nStep 2 (Addition): {{a}} + {{multiply_part}} = {{add_part}}.\nThe expression becomes: {{add_part}} − {{d}}.\n\nStep 3 (Subtraction): {{add_part}} − {{d}} = {{correct_answer}}."
  },
  "status": "active"
};

export const PRESET_MEDIUM = {
  "name": "Simplification – BODMAS Medium",
  "type": "parameterized",
  "examId": "jnvst",
  "section": "arithmetic",
  "topic": "simplification",
  "difficulty": 0.50,
  "config": {
    "name": "Simplification – BODMAS Medium",
    "title": "Simplification – BODMAS Medium",
    "description": "Tests division, multiplication, brackets, and subtraction.",
    "grade": "",
    "skillId": "",
    "competencyId": "",
    "difficultyLevel": "medium",
    "tags": ["BODMAS", "brackets", "division"],
    "constraints": {
      "uniqueOptions": true,
      "preventDuplicateWords": true,
      "minOptionCount": 4,
      "maxOptionCount": 4
    },
    "layoutConfig": {
      "mode": "prompt_top",
      "responsiveTarget": "desktop_first",
      "clickToSubmit": false
    },
    "interaction": {
      "engine": "mcq",
      "inputMode": "choice"
    },
    "variables": {
      "k": { "min": 2, "max": 5 },
      "d": { "min": 3, "max": 6 },
      "b": { "min": 4, "max": 8 },
      "c": { "min": 2, "max": 6 },
      "e": { "min": 2, "max": 8 }
    },
    "derivations": {
      "a": "k * d",
      "after_div": "k",
      "sum_bc": "b + c",
      "after_mul": "after_div * sum_bc",
      "correct_answer": "after_mul - e",
      "distractor_1": "after_div * b + c - e",
      "distractor_2": "after_mul + e",
      "distractor_3": "after_div * (b - c) + e"
    },
    "options": [
      { "label": "{{correct_answer}}", "isCorrect": true },
      { "label": "{{distractor_1}}", "isCorrect": false },
      { "label": "{{distractor_2}}", "isCorrect": false },
      { "label": "{{distractor_3}}", "isCorrect": false }
    ],
    "questionTemplate": "Simplify: {{a}} ÷ {{d}} × ({{b}} + {{c}}) − {{e}}",
    "explanationTemplate": "Follow the BODMAS order: Brackets, Division/Multiplication (left to right), and Subtraction.\n\nStep 1 (Brackets first): {{b}} + {{c}} = {{sum_bc}}.\nThe expression becomes: {{a}} ÷ {{d}} × {{sum_bc}} − {{e}}.\n\nStep 2 (Division): {{a}} ÷ {{d}} = {{after_div}}.\nThe expression becomes: {{after_div}} × {{sum_bc}} − {{e}}.\n\nStep 3 (Multiplication): {{after_div}} × {{sum_bc}} = {{after_mul}}.\nThe expression becomes: {{after_mul}} − {{e}}.\n\nStep 4 (Subtraction): {{after_mul}} − {{e}} = {{correct_answer}}."
  },
  "status": "active"
};

export const PRESET_HARD = {
  "name": "Simplification – BODMAS Hard",
  "type": "parameterized",
  "examId": "jnvst",
  "section": "arithmetic",
  "topic": "simplification",
  "difficulty": 0.80,
  "config": {
    "name": "Simplification – BODMAS Hard",
    "title": "Simplification – BODMAS Hard",
    "description": "Tests nested brackets (parentheses, braces, brackets) and complex precedence.",
    "grade": "",
    "skillId": "",
    "competencyId": "",
    "difficultyLevel": "hard",
    "tags": ["BODMAS", "nested-brackets", "precedence"],
    "constraints": {
      "uniqueOptions": true,
      "preventDuplicateWords": true,
      "minOptionCount": 4,
      "maxOptionCount": 4
    },
    "layoutConfig": {
      "mode": "prompt_top",
      "responsiveTarget": "desktop_first",
      "clickToSubmit": false
    },
    "interaction": {
      "engine": "mcq",
      "inputMode": "choice"
    },
    "variables": {
      "f": { "min": 2, "max": 4 },
      "diff": { "min": 2, "max": 4 },
      "d": { "min": 2, "max": 3 },
      "c_add": { "min": 3, "max": 6 },
      "b": { "min": 2, "max": 4 },
      "a": { "min": 10, "max": 20 }
    },
    "derivations": {
      "e": "f + diff",
      "c": "d * diff + c_add",
      "inner_sub": "e - f",
      "inner_mul": "d * inner_sub",
      "bracket_val": "c - inner_mul",
      "after_mul": "b * bracket_val",
      "correct_answer": "a + after_mul",
      "distractor_1": "(a + b) * bracket_val",
      "distractor_2": "a + b * c - d * inner_sub",
      "distractor_3": "correct_answer + 10"
    },
    "options": [
      { "label": "{{correct_answer}}", "isCorrect": true },
      { "label": "{{distractor_1}}", "isCorrect": false },
      { "label": "{{distractor_2}}", "isCorrect": false },
      { "label": "{{distractor_3}}", "isCorrect": false }
    ],
    "questionTemplate": "Simplify: {{a}} + {{b}} × [{{c}} − { {{d}} × ({{e}} − {{f}}) }]",
    "explanationTemplate": "Following BODMAS, evaluate starting from the innermost bracket: Parentheses (), then Curly Braces {}, then Square Brackets [], and then apply order of operations.\n\nStep 1 (Innermost parenthesis): ({{e}} − {{f}}) = {{inner_sub}}.\nThe expression becomes: {{a}} + {{b}} × [{{c}} − { {{d}} × {{inner_sub}} }].\n\nStep 2 (Curly braces): { {{d}} × {{inner_sub}} } = {{inner_mul}}.\nThe expression becomes: {{a}} + {{b}} × [{{c}} − {{inner_mul}}].\n\nStep 3 (Square brackets): [{{c}} − {{inner_mul}}] = {{bracket_val}}.\nThe expression becomes: {{a}} + {{b}} × {{bracket_val}}.\n\nStep 4 (Multiplication): {{b}} × {{bracket_val}} = {{after_mul}}.\nThe expression becomes: {{a}} + {{after_mul}}.\n\nStep 5 (Addition): {{a}} + {{after_mul}} = {{correct_answer}}."
  },
  "status": "active"
};

