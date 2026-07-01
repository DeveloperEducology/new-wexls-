# Question Creation Guide

This guide details all the supported question types in this project, their JSON structures, validation schemas, and examples.

---

## 1. General Question Schema

Every question returned by a generator should be a plain JavaScript object adhering to the following base structure:

```typescript
interface BaseQuestion {
  id: string;              // Unique identifier (e.g. prefix + timestamp + counter)
  type: string;            // The question type (e.g., 'mcq', 'fillInTheBlank')
  questionText: string;    // Main fallback prompt for screen readers / TTS
  parts?: Array<Part>;     // Optional rich parts array for rendering text/graphics
  explanation?: string | ExplanationObject; // Step-by-step student explanation
  solutionSteps?: string[]; // Optional array of structured walkthrough steps
  metadata: {              // Diagnostic metadata
    subject: string;
    topic: string;
    templateId: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    [key: string]: any;
  }
}
```

---

## 2. Supported Question Types

### 2.1 Multiple-Choice (mcq)
Used for classic single-choice questions with radio options.

#### Schema
```typescript
interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: Array<{
    id?: string | number; // Optional choice identifier
    label: string;       // Text shown to student (supports LaTeX)
    isCorrect: boolean;  // True for correct option, false otherwise
  }>;
}
```

#### Example
```json
{
  "id": "add_mcq_1001",
  "type": "mcq",
  "questionText": "What is 5 + 3?",
  "parts": [
    { "type": "text", "content": "What is 5 + 3?" }
  ],
  "options": [
    { "label": "8", "isCorrect": true },
    { "label": "7", "isCorrect": false },
    { "label": "9", "isCorrect": false }
  ],
  "explanation": "Adding 3 to 5 gives 8.",
  "metadata": {
    "subject": "math",
    "topic": "addition",
    "templateId": "math-add-facts",
    "difficulty": "easy"
  }
}
```

---

### 2.2 Fill-in-the-Blank (fillInTheBlank)
Used for text-based questions containing one or more inline entry blanks.

#### Blueprint Syntax
- Legacy: Use `[blank]` or `[blank:name]`
- Modern: Use `[[blank_id]]` (e.g. `[[ans]]` or `[[carry]]`)

#### Schema
```typescript
interface FillInTheBlankQuestion extends BaseQuestion {
  type: 'fillInTheBlank';
  correctAnswer?: string | number; // For single-blank questions (fallback)
  answer?: Record<string, string | number>; // For multi-blank questions mapping blank_id -> correct answer
}
```

#### Example (Single Blank)
```json
{
  "id": "fib_single_1002",
  "type": "fillInTheBlank",
  "questionText": "Complete: 10 - [blank] = 4",
  "parts": [
    { "type": "text", "content": "Complete: 10 - [[ans]] = 4" }
  ],
  "answer": {
    "ans": "6"
  },
  "explanation": "Since 10 - 6 = 4, the blank is 6.",
  "metadata": {
    "subject": "math",
    "topic": "subtraction",
    "templateId": "math-sub-facts",
    "difficulty": "easy"
  }
}
```

---

### 2.3 Drag-and-Drop Matching (matching)
Used to match pairs of items side-by-side.

#### Schema
```typescript
interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: Array<{
    left: { content: string };
    right: { content: string };
  }>;
  correctAnswer: Record<string, string>; // Map of left-value -> right-value
}
```

#### Example
```json
{
  "id": "match_ratio_1003",
  "type": "matching",
  "questionText": "Match each ratio with its simplest form.",
  "pairs": [
    { "left": { "content": "4:6" }, "right": { "content": "2:3" } },
    { "left": { "content": "5:10" }, "right": { "content": "1:2" } }
  ],
  "correctAnswer": {
    "4:6": "2:3",
    "5:10": "1:2"
  },
  "explanation": "Divide the ratio terms by their HCF.",
  "metadata": {
    "subject": "math",
    "topic": "ratio",
    "templateId": "math-ratio-simplifying",
    "difficulty": "medium"
  }
}
```

---

### 2.4 Categorization (categorization)
Used to sort cards/items into specific bin categories.

#### Schema
```typescript
interface CategorizationQuestion extends BaseQuestion {
  type: 'categorization';
  categories: Array<{
    id: string;
    label: string;
  }>;
  items: Array<{
    id: string;
    content: string; // Supports text, images or HTML
  }>;
  answer: Record<string, string>; // Map of item_id -> category_id
}
```

#### Example
```json
{
  "id": "sort_nouns_1004",
  "type": "categorization",
  "questionText": "Sort these words into Nouns and Not Nouns.",
  "categories": [
    { "id": "noun", "label": "Nouns" },
    { "id": "not_noun", "label": "Not Nouns" }
  ],
  "items": [
    { "id": "n1", "content": "apple" },
    { "id": "nn1", "content": "run" }
  ],
  "answer": {
    "n1": "noun",
    "nn1": "not_noun"
  },
  "explanation": "'apple' is a naming word (Noun), and 'run' is an action word (Not Noun).",
  "metadata": {
    "subject": "english",
    "topic": "grammar",
    "templateId": "grammar-noun-sort",
    "difficulty": "easy"
  }
}
```

---

## 3. Creating Dynamic Templates & Option Pools

Dynamic templates allow parameterizing text, values, and options so that each student gets a unique version of a question. 

### 3.1 Placeholders and Math Expressions
- **Placeholders**: Wrap names, ranges, or lists in `{{variable_name}}` (e.g., `{{student}}`, `{{count1}}`).
- **Math Expressions**: Wrap mathematical calculations or JavaScript expressions in `{= expression =}` (e.g., `{= count1 + count2 =}`). These are computed dynamically at runtime.

### 3.2 Dynamic Option Pooling
A dynamic option pool is a JSON array of objects representing different question scenarios. The template generator randomly picks one scenario object and makes its properties available as variables.

#### Scenario Definition Example:
```json
[
  {"name": "boot", "estimate": 32, "correctUnit": "centimetres", "allowedUnits": ["metres", "centimetres"]},
  {"name": "pencil", "estimate": 15, "correctUnit": "centimetres", "allowedUnits": ["metres", "centimetres"]}
]
```

#### Blueprint Reference:
- Refer to properties of the selected object using dot notation: `{= scenario.name =}`, `{= scenario.estimate =}`, `{= scenario.correctUnit =}`.
- To compute a dynamic distractor (incorrect option): `{= scenario.allowedUnits.find(u => u !== scenario.correctUnit) =}`.

---

## 4. Subject Context Walkthroughs (Step-by-Step)

Here is how to design templates and option pools for each subject area in this project.

### 4.1 Math Context (e.g., Estimation & Measurement)
Math templates focus on numerical variance, unit conversions, and dynamic calculations.

#### Step-by-Step Creation:
1. **Identify the Core Logic**: For example, estimating the length of real-world objects.
2. **Define the Scenario Pool**: Create a JSON array of objects with an estimate and correct/incorrect units.
3. **Write the Blueprint**:
   > Which is a better estimate for the height of a {{scenario.name}}?
4. **Configure MCQ Choices (Card 1c)**:
   - Option 1 (Correct): `{= scenario.estimate =} {= scenario.correctUnit =}`
   - Option 2 (Incorrect): `{= scenario.estimate =} {= scenario.allowedUnits.find(u => u !== scenario.correctUnit) =}`
5. **Add explanation (Card 1b)**:
   > A {{scenario.name}} is usually `{= scenario.estimate =}` `{= scenario.correctUnit =}` tall.

---

### 4.2 English Grammar Context (e.g., Noun Identification & Word Sorting)
Grammar templates focus on sentence structures, parts of speech, and text categorizations.

#### Step-by-Step Creation:
1. **Identify the Parts of Speech**: For example, sorting words into Nouns and Verbs.
2. **Define the Word Lists**:
   - `{{nouns}}`: `"apple, school, teacher, dog"`
   - `{{verbs}}`: `"run, jump, write, sleep"`
3. **Select Categorization Layout**:
   - Category 1: `Nouns`
   - Category 2: `Verbs`
4. **Write the Instruction Blueprint**:
   > Sort these words into Nouns and Verbs.
5. **Assign Correct Bins (Card 1d)**:
   - Set the correct mapping for dynamic items.

---

### 4.3 Science Context (e.g., Solar System & Units of Measurement)
Science templates focus on factual associations, ordering, and properties.

#### Step-by-Step Creation:
1. **Define the Facts Database**: For example, planets and their relative position from the Sun.
   ```json
   [
     {"name": "Mercury", "position": 1, "temp": "hot"},
     {"name": "Earth", "position": 3, "temp": "moderate"},
     {"name": "Neptune", "position": 8, "temp": "cold"}
   ]
   ```
2. **Write the Blueprint**:
   > Which planet is the {{scenario.position}} planet from the Sun?
3. **Define MCQ Choices**:
   - Option 1 (Correct): `{= scenario.name =}`
   - Options 2 & 3 (Distractors): Generate from other planets or random distractors.

---

### 4.4 Social Studies & GK Context (e.g., Personalities & Matches)
GK templates utilize associations between historical facts, locations, and titles.

#### Step-by-Step Creation:
1. **Define the GK Option Pool**:
   ```json
   [
     {"leader": "Mahatma Gandhi", "title": "Father of the Nation"},
     {"leader": "Jawaharlal Nehru", "title": "First Prime Minister"}
   ]
   ```
2. **Write the Matching Blueprint**:
   > Match the famous leader with their title.
3. **Configure Left/Right Pairs**:
   - Left: `{= scenario.leader =}`
   - Right: `{= scenario.title =}`

---

## 5. Auditing and Verification

Run the compiler audit check to verify that all question templates evaluate correctly:
```bash
npm run audit:generators
```
This runs `scripts/audit-generators.mjs` synchronously across all topics to make sure no generator raises JavaScript exceptions or has missing fields.
