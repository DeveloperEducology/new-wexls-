# Dynamic Template Building — Universal Template JSON Reference Guide

This document details how the **Universal Template System** parses templates, resolves variables, handles visual components (e.g. Ten Frames, Spinner, Jar of Marbles, base-ten blocks, fractions), evaluates expressions, and builds randomized dynamic question variants.

---

## Architecture Overview

```
          JSON Template
 ┌──────────────────────────────────────────────┐
 │ - variables: [ { name: "A", type: "integer" } ] │
 │ - dataSources: [ ... ]                        │
 │ - visuals: [ { component: "TenFrame" } ]     │
 │ - questionText: "What is [A]?"               │
 └──────────────────────┬───────────────────────┘
                        │
                        ▼
            evaluateTemplate(template, seed)
                        │
                        ▼
          Resolved Question Payload
 ┌──────────────────────────────────────────────┐
 │ - questionText: "What is 7?"                 │
 │ - parts: [ { type: "ten_frame", ... } ]       │
 │ - options: [ { label: "7", isCorrect: true } ] │
 └──────────────────────────────────────────────┘
```

---

## 1. Data Sources (`dataSources`)

Data sources define raw lists, ranges, or pools from which variables pull values.

```json
[
  {
    "id": "animalNames",
    "type": "static_data",
    "items": ["cat", "dog", "cow", "lion", "tiger"]
  },
  {
    "id": "luckyNumbers",
    "type": "pool_selection",
    "items": "7, 11, 21, 42, 99",
    "count": 3
  }
]
```

### Supported Source Types
- **`static_data`**: A static array of items or a comma-separated string of entries.
- **`pool_selection`**: Randomly picks `count` number of items from the provided list.
- **`random_number`**: Returns a single random number between `min` and `max`.
- **`random_item`**: Selects a single random item from the list.

---

## 2. Dynamic Variables (`variables`)

Variables are evaluated sequentially at runtime. A variable can reference any previously evaluated variable or data source.

```json
[
  { "name": "A", "type": "integer", "min": "5", "max": "10" },
  { "name": "B", "type": "integer", "min": "1", "max": "A - 1" },
  { "name": "Result", "type": "expression", "formula": "A - B" }
]
```

### Supported Variable Types

| Type | Schema Fields | Description |
|---|---|---|
| **`integer`** or **`random_number`** | `min`, `max` | Picks a random integer between min and max (inclusive). |
| **`expression`** or **`computed`** | `formula` / `expression` / `value` | Evaluates a math or logical expression (e.g. `A + B`). |
| **`string_template`** | `template` | Interpolates placeholders (e.g. `[A] plus [B]`). |
| **`conditional`** | `condition`, `trueValue`, `falseValue` | If `condition` evaluates to true, returns `trueValue`; else `falseValue`. |
| **`list`** or **`random_item`** | `source` | Picks a single random item from the specified data source. |
| **`pool_selection`** | `source`, `count`, `category` | Selects multiple random items from a data source. |
| **`array_transform`** | `source`, `transform` | Transforms lists (e.g., `transform: "join"` or `"labels"`). |

---

## 3. Built-In Functions

The expression parser includes built-in functions that can be used inside variable formulas or string templates:

- **`toWords(n)`**: Converts a number to its English word form.
  - *Example*: `toWords(9)` $\rightarrow$ `"nine"`
  - *Example*: `toWords(21)` $\rightarrow$ `"twenty-one"`

---

## 4. Visual Components Reference

Visual components are listed in the `visuals` array. They dynamically update their properties based on resolved variables.

### 🔴 Ten Frame (`TenFrame`)
Displays counters on a 10-frame grid (with optional crossed-out counters for subtraction).
- **Properties**:
  - `filledCount`: Number of filled counters.
  - `crossedOutCount`: Number of counters to cross out.
  - `color`: Color of counters (`"red"`, `"blue"`, etc.).

### 🔮 Jar of Marbles (`JarOfMarbles`)
Displays a visual jar populated with two colored sets of marbles.
- **Properties**:
  - `colorA`: Color of marble set A.
  - `countA`: Count of marble set A.
  - `colorB`: Color of marble set B.
  - `countB`: Count of marble set B.

### 🎯 Spinner (`Spinner`)
Renders an interactive circle spinner divided into sectors.
- **Properties**:
  - `sectorsA`: Number of sectors colored colorA.
  - `colorA`: Primary sector color.
  - `sectorsB`: Number of sectors colored colorB.
  - `colorB`: Secondary sector color.

### 📦 Item Counter Grid (`ItemCounter`)
Renders a grid of simple object assets (e.g., cupcakes, apples, stars) to support counting activities.
- **Properties**:
  - `count`: Total items to render.
  - `itemType`: Type of item (e.g. `"cupcake"`, `"apple"`, `"star"`). Also supports a list of values from which one is randomly chosen.

### 🧩 Base Ten Blocks (`BaseTenBlocks`)
Renders standard Dienes blocks representing thousands, hundreds, tens, and ones.
- **Properties**:
  - `thousands`: Count of thousand blocks.
  - `hundreds`: Count of flat hundred blocks.
  - `tens`: Count of ten rods.
  - `ones`: Count of unit cubes.
  - `showChart`: `"true"` or `"false"` to display blocks inside a grid layout or stacked.

### 📈 Number Line (`NumberLine`)
Draws a number line between set bounds with an optional highlighted point.
- **Properties**:
  - `min`: Start value of the number line.
  - `max`: End value of the number line.
  - `step`: Interval between tick marks.
  - `pointValue`: Numeric coordinate of the highlighted dot.
  - `pointLabel`: Optional label shown next to the dot.

### 📊 Fraction Bar (`FractionBar`) & Fraction Circle (`FractionCircle`)
Draws custom fractional graphics representing parts of a whole.
- **Properties**:
  - `denominator`: Total number of segments.
  - `numerator`: Number of shaded segments.
  - `color`: Shading color.

---

## 5. Complete Template Examples

### Example 1: Basic Subtraction with Ten Frame

```json
{
  "id": "math-subtraction-ten-frame-example",
  "title": "Subtract with Ten Frame",
  "subject": "math",
  "topic": "numbers-counting",
  "layoutConfig": { "mode": "prompt_top" },
  "variables": [
    { "name": "A", "type": "integer", "min": "5", "max": "10" },
    { "name": "B", "type": "integer", "min": "1", "max": "A - 1" },
    { "name": "Result", "type": "expression", "formula": "A - B" }
  ],
  "visuals": [
    {
      "component": "TenFrame",
      "props": {
        "filledCount": "A",
        "crossedOutCount": "B",
        "color": "red"
      }
    }
  ],
  "questionText": "What is [A] minus [B]?",
  "optionsType": "mcq",
  "options": [
    { "label": "[Result]", "isCorrect": true },
    { "label": "[Result] + 1", "isCorrect": false },
    { "label": "[Result] - 1", "isCorrect": false },
    { "label": "[A]", "isCorrect": false }
  ],
  "explanation": {
    "sections": [
      {
        "type": "text",
        "content": "Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result]."
      }
    ]
  }
}
```

### Example 2: Vocabulary Word to Image Match

```json
{
  "id": "vocab-word-to-image-example",
  "title": "Match Word to Image",
  "subject": "english",
  "topic": "vocabulary",
  "layoutConfig": { "mode": "prompt_top" },
  "dataSources": [
    {
      "id": "wordsList",
      "type": "static_data",
      "items": [
        "apple::https://cdn.example.com/apple.png",
        "banana::https://cdn.example.com/banana.png",
        "orange::https://cdn.example.com/orange.png",
        "cherry::https://cdn.example.com/cherry.png"
      ]
    }
  ],
  "variables": [
    { "name": "correctPair", "type": "random_item", "source": "wordsList" },
    { "name": "wrongPairs", "type": "pool_selection", "source": "wordsList", "count": 2 }
  ],
  "visuals": [
    {
      "component": "Image",
      "props": {
        "imageUrl": "correctPair",
        "width": "200"
      }
    }
  ],
  "questionText": "Which word matches the image?",
  "optionsType": "mcq",
  "options": [
    { "label": "correctPair", "isCorrect": true },
    { "label": "wrongPairs[0]", "isCorrect": false },
    { "label": "wrongPairs[1]", "isCorrect": false }
  ]
}
```
