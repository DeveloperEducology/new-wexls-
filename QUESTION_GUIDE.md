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

---

## 6. Creating Templates with Option Pools (Visual Template Editor)

> **Where:** Go to `/admin/templates` → open or create a template → scroll to the **Data & Logic Board** → **Data Sources** panel.

Option Pools let you attach a vocabulary/image/audio database to your template. The engine randomly picks items from your chosen categories and injects them as variables you can use anywhere in the question layout.

---

### 6.1 Understanding the Pool Data Structure

Every pool in the database (`vocabulary_pools` collection) looks like:

```json
{
  "poolId": "maths-shapes-2d",
  "subject": "math",
  "topic": "shapes",
  "pools": {
    "circle":    [ { "id": "circle_1", "label": "Circle",   "imageUrl": "/images/shapes/circle.svg" } ],
    "triangle":  [ { "id": "tri_1",   "label": "Triangle",  "imageUrl": "/images/shapes/triangle.svg" } ],
    "rectangle": [ { "id": "rect_1",  "label": "Rectangle", "imageUrl": "/images/shapes/rect.svg" } ],
    "square":    [ { "id": "sq_1",    "label": "Square",    "imageUrl": "/images/shapes/square.svg" } ]
  }
}
```

Key rules:
- **`poolId`** — unique slug, lowercase, hyphenated. e.g. `maths-shapes-2d`, `english-nouns-animals`.
- **`pools`** — an object whose keys are **category names** and values are **arrays of items**.
- Each item can have: `id`, `label`, `imageUrl`, `audioUrl`, `content`, and any custom properties.
- **Target categories** = the correct-answer bucket. **All other categories** automatically become distractor buckets.

---

### 6.2 Step 1 — Pick an Existing Pool or Create a New One

#### Using an existing pool
1. In the Data Sources panel click **`+ Add Pool Source`**.
2. A new pool source card appears. In the **Pool ID** dropdown, all pools are listed grouped by subject. Choose one (e.g. `maths-shapes-2d (4 categories)`).
3. The **Category** dropdown auto-fills with all available categories from that pool.

#### Creating a new pool (Quick Mode)
1. Click **`🧪 Create Pool`** (top-right of the Data Sources panel).
2. The Create Pool modal opens. Fill in:
   - **Pool ID**: e.g. `science-animals-mammals`
   - **Subject**: e.g. `science`
   - **Topic**: e.g. `animals`
   - **Categories (comma-separated)**: e.g. `mammals, reptiles, birds`
3. Click **Save Pool**. An empty pool skeleton is created in the DB.
4. Then click **`📦 Manage Pools`** or visit `/admin/vocabulary-pools` to add items to each category.

#### Creating a new pool (JSON Mode)
1. Click **`🧪 Create Pool`** → switch to the **JSON** tab.
2. Paste a full pool document:
```json
{
  "poolId": "science-animals-farm",
  "subject": "science",
  "topic": "animals",
  "pools": {
    "farm": [
      { "id": "cow",  "label": "Cow",  "imageUrl": "/images/animals/cow.png" },
      { "id": "hen",  "label": "Hen",  "imageUrl": "/images/animals/hen.png" },
      { "id": "goat", "label": "Goat", "imageUrl": "/images/animals/goat.png" }
    ],
    "wild": [
      { "id": "lion",  "label": "Lion",  "imageUrl": "/images/animals/lion.png" },
      { "id": "tiger", "label": "Tiger", "imageUrl": "/images/animals/tiger.png" }
    ]
  }
}
```
3. Click **Save Pool**. The pool is immediately available in the dropdown.

---

### 6.3 Step 2 — Configure the Pool Source Card

After selecting a Pool ID, fill in the rest of the source card:

| Field | What it does | Example |
|---|---|---|
| **Source ID** | Internal identifier for this data source | `source_1` |
| **Pool ID** | Which pool to draw from | `maths-shapes-2d` |
| **Category** | The primary category to sample | `circle` |
| **🎯 Target Categories** | Checkboxes — items from these categories become **correct answer** candidates | ☑ `circle` |
| **Count** | How many items to randomly pick from the target category | `1` |
| **🎯 Target Filter Property** | *(optional)* Filter correct items by an item property name | `kind` |
| **🎯 Target Filter Value** | *(optional)* Filter correct items matching this value | `2d` |
| **👾 Distractor Filter Property** | *(optional)* Filter distractor items by property | `tags` |
| **👾 Distractor Filter Value** | *(optional)* Filter distractors matching this value | `basic` |
| **Save as variable** | The variable name to use in prompts/options | `TargetShape` |

> **Important:** When you check categories under **🎯 Target Categories**, those items become **correct** options. Every other category in the pool automatically becomes a **distractor** pool.

After filling in all fields, click **Save Variable**. This creates a `pool_selection` variable in the Variables section.

---

### 6.4 Step 3 — Reference the Variable in Your Template

Once saved, the variable (e.g. `TargetShape`) is an **array** of selected items. Use index `[0]` to access the first item. The available tokens are:

| Token | Outputs |
|---|---|
| `[TargetShape[0].label]` | The text label of the selected item (e.g. "Circle") |
| `[TargetShape[0].imageUrl]` | The image URL of the selected item |
| `[TargetShape[0].audioUrl]` | The audio URL of the selected item |
| `[TargetShape[0].content]` | The `content` property (if set on the item) |
| `[TargetShape[0].id]` | The item's unique ID |

#### In the Question Prompt:
```
Identify the [TargetShape[0].label].
```
Or with an image shown in the visual:
```
What shape is shown above?
```
(and the visual panel displays `[TargetShape[0].imageUrl]`)

---

### 6.5 Step 4 — Build MCQ Options Using the Pool

In the **Options** section of the layout builder, set up choices like this:

#### Text-label MCQ (identify the shape by name)

| Option | Label | isCorrect |
|---|---|---|
| Option 1 | `[TargetShape[0].label]` | `true` |
| Option 2 | *(auto distractor from pool)* | `false` |
| Option 3 | *(auto distractor from pool)* | `false` |
| Option 4 | *(auto distractor from pool)* | `false` |

> The engine automatically fills distractor slots from the pool's **non-target categories**.

#### Image MCQ (picture_mcq — choose the correct image)

| Option | imageUrl | isCorrect |
|---|---|---|
| Option 1 | `[TargetShape[0].imageUrl]` | `true` |
| Option 2–4 | *(distractor images from pool)* | `false` |

Set the **Interaction Engine** to `picture_mcq` in the Layout Config panel.

#### Audio MCQ (audio_mcq — listen and choose)

| Option | audioUrl | Label | isCorrect |
|---|---|---|---|
| Option 1 | `[TargetSound[0].audioUrl]` | `[TargetSound[0].label]` | `true` |
| Option 2–4 | *(distractor audio)* | *(distractor labels)* | `false` |

Set the **Interaction Engine** to `audio_mcq`.

---

### 6.6 Step 5 — Set the Prompt Preview and Interaction Engine

In the **Question Text / Prompt** field:
```
What is the name of this shape?
```

Or dynamic:
```
Identify the [TargetShape[0].label] from the options below.
```

In **Layout Config**:
- **Interaction Engine**: `mcq` (text choices), `picture_mcq` (image choices), `audio_mcq` (audio choices)
- **Layout Mode**: `prompt_top` (question above) or `visual_center` (image/audio in the centre)

---

### 6.7 Complete Worked Example — Shapes MCQ with Pool

Here is a complete template JSON (as it would be saved to the DB) for a shapes MCQ using pool `maths-shapes-2d`:

```json
{
  "id": "math-shapes-identify-mcq",
  "title": "Identify the 2D Shape",
  "subject": "math",
  "topic": "shapes",
  "dataSources": [
    {
      "id": "source_1",
      "type": "pool_selection",
      "poolId": "maths-shapes-2d",
      "category": "circle",
      "targetCategories": ["circle"],
      "count": 1,
      "variableName": "TargetShape"
    }
  ],
  "variables": [
    {
      "name": "TargetShape",
      "type": "pool_selection",
      "source": "source_1",
      "poolId": "maths-shapes-2d",
      "category": "circle",
      "count": 1
    }
  ],
  "questionText": "What is the name of this shape?",
  "visuals": [
    {
      "component": "Image",
      "props": {
        "src": "[TargetShape[0].imageUrl]",
        "alt": "[TargetShape[0].label]"
      }
    }
  ],
  "optionsType": "mcq",
  "options": [
    { "label": "[TargetShape[0].label]", "isCorrect": true },
    { "label": "[distractor_1]", "isCorrect": false },
    { "label": "[distractor_2]", "isCorrect": false },
    { "label": "[distractor_3]", "isCorrect": false }
  ],
  "explanation": {
    "sections": [
      {
        "type": "text",
        "content": "This shape is a [TargetShape[0].label]. It has the properties of a [TargetShape[0].label]."
      }
    ]
  },
  "interaction": { "engine": "mcq" },
  "metadata": {
    "subject": "math",
    "topic": "shapes",
    "difficulty": "easy"
  }
}
```

> **How distractors work:** The engine reads the pool's `pools` object. Items from `targetCategories` (`circle`) are correct options. Items from all other categories (`triangle`, `rectangle`, `square`) are shuffled and used as distractors.

---

### 6.8 Other Question Types with Option Pools

#### Fill-in-the-Blank with Pool
```
The shape that has no corners is called a [[ans]].
```
Answer:
```json
{ "ans": "[TargetShape[0].label]" }
```

#### Matching with Pool (two sources)
Set up **two** pool sources:
- Source 1: `TargetShape` — picks a shape
- Source 2: `TargetAnimal` — picks an animal

Then define matching pairs:
```json
"pairs": [
  { "left": { "content": "[TargetShape[0].imageUrl]" },  "right": { "content": "[TargetShape[0].label]" } },
  { "left": { "content": "[TargetAnimal[0].imageUrl]" }, "right": { "content": "[TargetAnimal[0].label]" } }
]
```

#### Categorization with Pool
Use pool items as **draggable cards** sorted into category bins:
```json
"parts": [
  {
    "type": "categorizationv2",
    "categories": [
      { "id": "farm", "label": "Farm Animals" },
      { "id": "wild", "label": "Wild Animals" }
    ],
    "items": [
      { "id": "[TargetAnimal[0].id]", "content": "[TargetAnimal[0].label]", "imageUrl": "[TargetAnimal[0].imageUrl]" }
    ],
    "answerKey": {
      "[TargetAnimal[0].id]": "farm"
    }
  }
]
```

---

### 6.9 Quick Reference — Pool Variable Tokens

| You want to show | Use this token |
|---|---|
| The text label | `[VarName[0].label]` |
| An image | `[VarName[0].imageUrl]` |
| An audio clip | `[VarName[0].audioUrl]` |
| The raw content field | `[VarName[0].content]` |
| The item's ID | `[VarName[0].id]` |
| Second item (if count ≥ 2) | `[VarName[1].label]` |

> Pool variable names are **case-sensitive**. Use `TargetShape`, not `targetshape`.

---

### 6.10 Checklist Before Saving

- [ ] Pool ID exists in DB (check `/admin/vocabulary-pools`)
- [ ] Target categories are checked in the pool source card
- [ ] Variable name set and "Save Variable" clicked
- [ ] Token `[VarName[0].label]` used correctly in question text / options
- [ ] Interaction engine set (`mcq`, `picture_mcq`, `audio_mcq`, etc.)
- [ ] Layout mode selected (`prompt_top`, `visual_center`, etc.)
- [ ] Click **Save Template** in the top action bar
- [ ] Click **🔗 Test in Practice** to verify it renders correctly in the practice session
