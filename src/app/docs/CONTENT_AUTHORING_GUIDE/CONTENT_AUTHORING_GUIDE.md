# KlassChamp Content Authoring Guide

This guide is for moving from coding into content creation. Use it as the working playbook for creating question templates, dynamic option pools, visual activities, and production-ready practice skills.

The goal is simple:

1. Create reusable pools.
2. Create metadata-driven templates.
3. Test many seeds.
4. Publish only when the activity is stable, visual, and age-appropriate.

---

## 1. Core Mental Model

Every dynamic activity should be built in this order:

```text
Pool data
-> Template variables
-> Prompt / visuals / options
-> Answer rule
-> Feedback / hint / explanation
-> Test seeds
-> Publish
```

Do not create one hard-coded question at a time unless it is a special activity. For most LKG to Grade 5 skills, create one reusable template that can generate many question variants.

---

## 2. What To Create First

Start with these three content layers.

### Layer 1: Dynamic Option Pools

Pools store reusable learning objects:

- words
- images
- audio
- science objects
- math objects
- facts
- sentence examples
- phonics words
- categories
- distractors

Example:

```json
{
  "poolId": "science-lkg-ukg-object-properties",
  "subject": "science",
  "topic": "object-properties",
  "grade": "LKG-UKG",
  "pools": {
    "hot": [],
    "cold": [],
    "living_things": [],
    "non_living_things": [],
    "animals": [],
    "plants": []
  }
}
```

### Layer 2: Dynamic Templates

Templates describe the activity:

- what data to pick
- how to show the question
- what visual to render
- which options are correct
- how to validate answers
- what hint/explanation to show

### Layer 3: Curriculum Skill Nodes

Skill nodes connect templates to practice:

- subject
- topic/chapter
- skill ID
- grade
- title
- route URL
- lock/unlock state

---

## 3. Pool Item Schema

Use this general schema for pool items.

```json
{
  "id": "hot_sun",
  "label": "sun",
  "imageUrl": "/images/science/sun.svg",
  "audioUrl": "",
  "category": "hot",
  "kind": "object",
  "property": "temperature",
  "value": "hot",
  "opposite": "cold",
  "simpleFact": "The sun is hot.",
  "questionCue": "Which one is hot?",
  "hint": "Think about what gives heat.",
  "correctFeedback": "Yes! The sun is hot.",
  "incorrectFeedback": "Not quite. Look for the thing that gives heat.",
  "stepByStepExplanation": "The sun gives us heat and light. So the sun is hot.",
  "imagePrompt": "Child-friendly educational image of the sun, centered, simple shape, white or transparent background, no text, no watermark.",
  "tags": ["hot", "sky", "day", "science"],
  "gradeBand": "LKG-UKG",
  "difficulty": "easy",
  "active": true
}
```

For English sentence pools, add POS tags:

```json
{
  "id": "noun_sentence_mouse_cheese",
  "label": "mouse cheese sentence",
  "text": "A tiny mouse nibbled the cheese quietly.",
  "nouns": ["mouse", "cheese"],
  "verbs": ["nibbled"],
  "adjectives": ["tiny"],
  "adverbs": ["quietly"],
  "articles": ["A", "the"],
  "prepositions": [],
  "tags": ["grammar", "nouns", "verbs"]
}
```

For phonics pools, add beginning/middle/ending fields:

```json
{
  "id": "pin",
  "label": "pin",
  "initial": "p",
  "middle": "i",
  "endingLetter": "n",
  "ending": "in",
  "rime": "in",
  "vowelSound": "short_i",
  "phonemeCue": "/p/ /i/ /n/",
  "beginningPattern": "_in",
  "middlePattern": "p_n",
  "endingPattern": "pi_",
  "imageUrl": "/images/phonics/pin.svg",
  "audioUrl": "",
  "phonicPrompt": "p, i, n. Pin.",
  "phonicSoundUrl": ""
}
```

---

## 4. Using Gemini In Content Work

Gemini is best used as a helper, not as the final publisher.

Use Gemini for:

- filling missing metadata
- creating image prompts
- generating hints
- generating correct feedback
- generating incorrect feedback
- generating step-by-step explanations
- extracting POS tags
- creating phonics cues
- checking if pool items are in the wrong category
- suggesting distractors
- drafting template JSON
- checking template quality before publishing

In the Option Pool Library:

1. Open a pool.
2. Choose a category.
3. Click **Fill Missing Details**.
4. Review generated fields.
5. Click **Save Pool Changes**.

Important: Gemini should not overwrite core fields like `id`, `label`, `imageUrl`, or `audioUrl`.

---

## 5. Dynamic Option Pool Workflow

Use this workflow for every subject.

1. Create a pool ID.

Example:

```text
science-lkg-ukg-object-properties
english-class1-short-i-words
math-lkg-shapes-basic
```

2. Add categories.

Example:

```json
{
  "hot": [],
  "cold": [],
  "heavy": [],
  "light": [],
  "circle": [],
  "square": []
}
```

3. Add pool items with at least:

```json
{
  "id": "hot_sun",
  "label": "sun",
  "imageUrl": "",
  "audioUrl": "",
  "active": true
}
```

4. Use Gemini to fill metadata.

5. Add or check images.

6. Add or check audio only when needed.

7. Save pool.

8. Build templates from the pool.

---

## 6. Template Base Schema

Use this as your starting template shape.

```json
{
  "id": "science-hot-cold-mcq",
  "title": "Find the Hot Object",
  "subject": "science",
  "topic": "object-properties",
  "grade": "LKG",
  "difficultyLevel": "easy",
  "layoutConfig": {
    "mode": "prompt_top",
    "responsiveTarget": "mobile_first"
  },
  "dataSources": [
    {
      "name": "TargetPool",
      "type": "pool_selection",
      "poolId": "science-lkg-ukg-object-properties",
      "category": "hot",
      "count": 1
    },
    {
      "name": "Distractors",
      "type": "pool_selection",
      "poolId": "science-lkg-ukg-object-properties",
      "category": "cold",
      "count": 2
    }
  ],
  "variables": [
    {
      "name": "Target",
      "type": "expression",
      "formula": "TargetPool[0]"
    },
    {
      "name": "TargetWord",
      "type": "expression",
      "formula": "Target.label"
    },
    {
      "name": "TargetImage",
      "type": "expression",
      "formula": "Target.imageUrl"
    }
  ],
  "questionText": "Which one is hot?",
  "optionsType": "mcq",
  "options": [
    {
      "label": "[TargetWord]",
      "imageUrl": "[TargetImage]",
      "isCorrect": true
    },
    {
      "label": "[Distractors[0].label]",
      "imageUrl": "[Distractors[0].imageUrl]",
      "isCorrect": false
    },
    {
      "label": "[Distractors[1].label]",
      "imageUrl": "[Distractors[1].imageUrl]",
      "isCorrect": false
    }
  ],
  "validationRules": [
    {
      "type": "exact_match",
      "target": "answer",
      "value": "[TargetWord]"
    }
  ],
  "feedbackRules": {
    "correct_message": "Correct!",
    "incorrect_message": "Try again. Look for the object that gives heat.",
    "hints": ["Hot things give heat."],
    "step_by_step_explanation": "The [TargetWord] is hot, so it is the correct answer."
  }
}
```

---

## 7. Question Types To Create

### 7.1 Multiple Choice

Use for:

- vocabulary
- science facts
- shape recognition
- counting
- grammar
- general knowledge

Template pattern:

```json
{
  "optionsType": "mcq",
  "interaction": {
    "engine": "mcq",
    "inputMode": "choice"
  },
  "options": [
    { "label": "[Correct.label]", "isCorrect": true },
    { "label": "[Wrong[0].label]", "isCorrect": false },
    { "label": "[Wrong[1].label]", "isCorrect": false }
  ]
}
```

Best for LKG/UKG:

- 2 options first
- then 3 options
- then 4 options

---

### 7.2 Picture Multiple Choice

Use for:

- “Which picture shows cat?”
- “Find the hot object”
- “Choose the circle”
- “Which animal is wild?”

Template pattern:

```json
{
  "questionText": "Which picture shows [Target.label]?",
  "optionsType": "mcq",
  "optionDisplay": "images_and_labels",
  "options": [
    {
      "label": "[Target.label]",
      "imageUrl": "[Target.imageUrl]",
      "isCorrect": true
    },
    {
      "label": "[Distractors[0].label]",
      "imageUrl": "[Distractors[0].imageUrl]",
      "isCorrect": false
    }
  ]
}
```

Recommended pool fields:

```json
{
  "label": "lion",
  "imageUrl": "/images/science/lion.svg",
  "kind": "animal",
  "tags": ["wild", "living"]
}
```

---

### 7.3 Audio MCQ

Use for:

- phonics
- letter sounds
- word recognition
- listening comprehension
- animal sounds

Template pattern:

```json
{
  "questionText": "Listen and choose the word.",
  "readable": true,
  "optionsType": "mcq",
  "options": [
    {
      "label": "[Target.label]",
      "audioUrl": "[Target.audioUrl]",
      "isCorrect": true
    },
    {
      "label": "[Distractors[0].label]",
      "audioUrl": "[Distractors[0].audioUrl]",
      "isCorrect": false
    }
  ]
}
```

Audio rule:

- First check R2.
- If missing, ask before generating.
- Do not generate audio for every item unless it will be used frequently.

---

### 7.4 Fill In The Blank

Use for:

- grammar
- math number entry
- vocabulary cloze
- place value
- spelling

Inline blanks use this format:

```text
[[blank1]]
[[blank2]]
[[blank3]]
```

Template pattern:

```json
{
  "questionText": "Type the missing numbers.\n\n[FullNumberWord] = [[blank1]] hundreds + [[blank2]] tens + [[blank3]] ones",
  "optionsType": "fillInTheBlank",
  "interaction": {
    "engine": "fill_blank",
    "inputMode": "number"
  },
  "answer": {
    "blank1": "[H]",
    "blank2": "[T]",
    "blank3": "[O]"
  },
  "validationRules": [
    {
      "type": "exact_match",
      "target": "answer",
      "value": {
        "blank1": "[H]",
        "blank2": "[T]",
        "blank3": "[O]"
      }
    }
  ]
}
```

Use `\n\n` to force line breaks in the rendered prompt.

---

### 7.5 Word Completion / Phonics Fill

Use for:

- short vowel words
- beginning sound
- middle sound
- ending sound
- word families

Pool item:

```json
{
  "id": "pin",
  "label": "pin",
  "initial": "p",
  "middle": "i",
  "endingLetter": "n",
  "ending": "in",
  "beginningPattern": "_in",
  "middlePattern": "p_n",
  "endingPattern": "pi_",
  "imageUrl": "/images/phonics/pin.svg"
}
```

Beginning sound activity:

```json
{
  "questionText": "Complete the words.",
  "interaction": {
    "engine": "word_completion",
    "missingMode": "beginning"
  },
  "answer": {
    "pin": "p"
  }
}
```

Middle sound activity:

```json
{
  "questionText": "Fill the middle sound.",
  "interaction": {
    "engine": "word_completion",
    "missingMode": "middle"
  },
  "answer": {
    "pin": "i"
  }
}
```

Ending sound activity:

```json
{
  "questionText": "Fill the ending sound.",
  "interaction": {
    "engine": "word_completion",
    "missingMode": "ending"
  },
  "answer": {
    "pin": "n"
  }
}
```

---

### 7.6 Categorization / Sorting

Use for:

- living vs non-living
- hot vs cold
- animals vs plants
- nouns vs verbs
- 2D vs 3D shapes
- materials

Pool-driven sorting:

```json
{
  "optionsType": "categorization",
  "interaction": {
    "engine": "sorting",
    "inputMode": "drag_drop"
  },
  "categories": [
    {
      "id": "hot",
      "label": "Hot"
    },
    {
      "id": "cold",
      "label": "Cold"
    }
  ],
  "items": [
    {
      "label": "[HotItems[0].label]",
      "imageUrl": "[HotItems[0].imageUrl]",
      "category": "hot"
    },
    {
      "label": "[ColdItems[0].label]",
      "imageUrl": "[ColdItems[0].imageUrl]",
      "category": "cold"
    }
  ]
}
```

Use sorting for skills where the learner must understand a group, not only pick one answer.

---

### 7.7 Matching

Use for:

- word to picture
- animal to sound
- object to material
- sentence to grammar label
- shape name to shape

Pattern:

```json
{
  "interaction": {
    "engine": "matching"
  },
  "pairs": [
    {
      "left": "[Items[0].label]",
      "right": "[Items[0].imageUrl]"
    },
    {
      "left": "[Items[1].label]",
      "right": "[Items[1].imageUrl]"
    }
  ]
}
```

---

### 7.8 Hotspot

Use for:

- inside/outside
- body parts
- map skills
- diagram labeling
- find an object in a scene

Pattern:

```json
{
  "interaction": {
    "engine": "hotspot"
  },
  "visuals": [
    {
      "component": "Image",
      "props": {
        "imageUrl": "/images/science/body-parts-face.svg"
      }
    }
  ],
  "hotspots": [
    {
      "id": "nose",
      "label": "nose",
      "x": 52,
      "y": 48,
      "isCorrect": true
    }
  ]
}
```

---

### 7.9 Visual Choice

Use when the answer is an image or object, not text.

Examples:

- big vs small
- same vs different
- odd one out
- long vs short
- heavy vs light

Pattern:

```json
{
  "questionText": "Which one is big?",
  "optionsType": "visual_choice",
  "parts": [
    {
      "type": "image",
      "imageUrl": "/images/animals/elephant.png",
      "isCorrect": true,
      "maxWidth": 240,
      "maxHeight": 220
    },
    {
      "type": "image",
      "imageUrl": "/images/animals/elephant.png",
      "isCorrect": false,
      "maxWidth": 150,
      "maxHeight": 140
    }
  ]
}
```

Use custom width/height when teaching size comparison.

---

### 7.10 Number Input

Use for:

- arithmetic
- measurement
- counting
- place value
- fractions

Pattern:

```json
{
  "questionText": "How many apples are there?",
  "interaction": {
    "engine": "number_input",
    "inputMode": "number"
  },
  "answer": "[Count]",
  "validationRules": [
    {
      "type": "exact_match",
      "target": "answer",
      "value": "[Count]"
    }
  ]
}
```

---

## 8. Visual Components

Use visual components instead of making every question image-based.

### Math Visuals

- `TenFrame`
- `JarOfMarbles`
- `Spinner`
- `ItemCounter`
- `PlaceValue`
- `BaseTenBlocks`
- `NumberLine`
- `HundredChart`
- `Rekenrek`
- `NumberBond`
- `TallyChart`
- `FractionBar`
- `FractionCircle`
- `FractionGrid`
- `DecimalGrid`
- `DecimalLine`
- `ShapeCanvas`
- `CoordinatePlane`
- `Protractor`
- `Ruler`
- `Geoboard`
- `BarGraph`
- `Pictograph`
- `FrequencyTable`
- `AnalogClock`
- `Calendar`
- `Thermometer`
- `BalanceScale`
- `MeasuringJug`
- `MoneyDisplay`
- `PriceTagCompare`

### English Visuals

- `Image`
- `Audio`
- `ReadingPassage`
- `WordCompletion`
- `SentenceBuilder`
- `AlphabetCard`
- `WordFamilyBuilder`

### Science / GK Visuals

- `Image`
- `DiagramLabeling`
- `Hotspot`
- `Sorting`
- `SceneComposer`
- `DragCanvas`

---

## 9. Subject-Specific Pool Plans

### English Pools

Create these:

```text
english-lkg-letters
english-lkg-case-match
english-class1-short-vowel-words
english-ukg-parts-of-speech
english-class1-sentence-order
english-reading-passages-grade1
```

Categories:

```text
uppercase_letters
lowercase_letters
short_a_words
short_e_words
short_i_words
short_o_words
short_u_words
nouns
verbs
adjectives
sentences
```

Question types:

- choose letter
- find different letter
- match uppercase/lowercase
- complete word
- choose picture
- identify noun/verb
- arrange sentence
- fill blank

---

### Math Pools

Create these:

```text
math-lkg-shapes-basic
math-ukg-counting-objects
math-grade1-addition-visuals
math-grade2-place-value
math-grade3-measurement
math-grade4-fractions
math-grade5-decimals
```

Categories:

```text
circles
squares
triangles
rectangles
objects_up_to_5
objects_up_to_10
place_value_numbers
fractions
measurements
money_items
```

Question types:

- count objects
- identify shape
- sort shapes
- number input
- ten frame
- number line
- base-ten blocks
- ruler measurement
- clock reading
- money comparison

---

### Science Pools

Create these:

```text
science-lkg-ukg-basics
science-lkg-ukg-object-properties
science-grade1-living-nonliving
science-grade2-plants-animals
science-grade3-materials
science-grade4-systems
science-grade5-forces-energy
```

Categories:

```text
living_things
non_living_things
animals
plants
hot
cold
heavy
light
rough
smooth
wood
metal
plastic
glass
fast
slow
```

Question types:

- classify
- sort
- choose picture
- match object to property
- describe object
- label diagram
- hotspot
- true/false

---

### General Knowledge Pools

Create these:

```text
gk-lkg-common-objects
gk-ukg-community-helpers
gk-grade1-places
gk-grade2-national-symbols
```

Categories:

```text
home_objects
school_objects
community_helpers
vehicles
places
flags
festivals
```

Question types:

- image match
- who uses this tool
- where do we see this
- choose correct fact
- sorting

---

### Coding / Logical Reasoning Pools

Create these:

```text
coding-grade1-sequences
coding-grade2-directions
reasoning-lkg-patterns
reasoning-ukg-same-different
reasoning-grade1-analogies
```

Question types:

- pattern continuation
- sequence order
- drag blocks
- choose next step
- find odd one out
- sort by rule

---

## 10. Difficulty Rules

Use difficulty to change the same template instead of creating three separate templates.

```json
{
  "difficultyRules": {
    "easy": {
      "optionCount": 2,
      "distractorSimilarity": "low",
      "hintVisibility": "high",
      "visualSupport": "high"
    },
    "medium": {
      "optionCount": 3,
      "distractorSimilarity": "medium",
      "hintVisibility": "medium",
      "visualSupport": "medium"
    },
    "hard": {
      "optionCount": 4,
      "distractorSimilarity": "high",
      "hintVisibility": "low",
      "visualSupport": "low"
    }
  }
}
```

Examples:

- Easy: `sun` vs `ice`
- Medium: `sun`, `fire`, `ice`
- Hard: `sun`, `fire`, `stove`, `ice`

---

## 11. Feedback Rules

Every production template should include:

```json
{
  "feedbackRules": {
    "correct_message": "Correct!",
    "incorrect_message": "Not quite. Try again.",
    "hints": ["Look carefully at the picture."],
    "step_by_step_explanation": "The sun gives heat, so it is hot.",
    "misconception_feedback": {
      "cold": "That one is cold. We need something hot."
    }
  }
}
```

For pool items, use:

```json
{
  "hint": "Think about what gives heat.",
  "correctFeedback": "Yes! The sun is hot.",
  "incorrectFeedback": "Not quite. Look for the object that gives heat.",
  "stepByStepExplanation": "The sun gives us heat and light. So the sun is hot."
}
```

---

## 12. Validation Rules

### Exact Match

```json
{
  "type": "exact_match",
  "target": "answer",
  "value": "[CorrectAnswer]"
}
```

### Case Insensitive

```json
{
  "type": "case_insensitive",
  "target": "answer",
  "value": "[CorrectWord]"
}
```

### Numeric Tolerance

```json
{
  "type": "numeric_tolerance",
  "target": "answer",
  "value": "[Answer]",
  "tolerance": 0.1
}
```

### Multi Input

```json
{
  "type": "exact_match",
  "target": "answer",
  "value": {
    "blank1": "[H]",
    "blank2": "[T]",
    "blank3": "[O]"
  }
}
```

---

## 13. Production Checklist

Before publishing any template:

- Template has a clear title.
- Subject/topic/grade are set.
- Pool ID is correct.
- Target category is correct.
- Distractor categories are correct.
- Preview works.
- New Seed changes the question.
- Test 20 seeds passes.
- No `undefined` text appears.
- No `[object Object]` appears.
- Images fit on desktop and mobile.
- Audio buttons work or are hidden.
- Correct answer validates.
- Wrong answer shows useful feedback.
- Hint is age-appropriate.
- Explanation is short and clear.
- Difficulty rules are set.
- Pool items have `active: true`.
- Pool items have useful tags.
- Template is saved and tested in practice page.

---

## 14. Recommended Content Creation Order

Use this order to avoid chaos.

### Phase 1: LKG / UKG Foundations

1. Shapes
2. Colors
3. Counting to 5
4. Counting to 10
5. Big/small
6. Long/short
7. Heavy/light
8. Hot/cold
9. Living/non-living
10. Letters
11. Short vowel phonics

### Phase 2: Grade 1

1. Addition within 10
2. Subtraction within 10
3. Place value tens/ones
4. Short vowel words
5. Nouns/verbs/adjectives
6. Plants/animals
7. Materials

### Phase 3: Grade 2 to Grade 5

1. Place value
2. Money
3. Time
4. Measurement
5. Fractions
6. Decimals
7. Geometry
8. Data and graphs
9. Science diagrams
10. Reading comprehension

---

## 15. Example: Science Hot / Cold Pool

```json
{
  "poolId": "science-lkg-ukg-object-properties",
  "subject": "science",
  "topic": "object-properties",
  "grade": "LKG-UKG",
  "pools": {
    "hot": [
      {
        "id": "hot_sun",
        "label": "sun",
        "imageUrl": "/images/science/sun.svg",
        "category": "hot",
        "kind": "object",
        "property": "temperature",
        "value": "hot",
        "opposite": "cold",
        "simpleFact": "The sun is hot.",
        "questionCue": "Which one is hot?",
        "hint": "Think about what gives heat.",
        "correctFeedback": "Yes! The sun is hot.",
        "incorrectFeedback": "Not quite. Look for the thing that gives heat.",
        "stepByStepExplanation": "The sun gives heat and light. So it is hot.",
        "tags": ["hot", "sky", "day"],
        "difficulty": "easy",
        "gradeBand": "LKG-UKG"
      }
    ],
    "cold": [
      {
        "id": "cold_ice",
        "label": "ice",
        "imageUrl": "/images/science/ice.svg",
        "category": "cold",
        "kind": "object",
        "property": "temperature",
        "value": "cold",
        "opposite": "hot",
        "simpleFact": "Ice is cold.",
        "questionCue": "Which one is cold?",
        "tags": ["cold", "water"],
        "difficulty": "easy",
        "gradeBand": "LKG-UKG"
      }
    ]
  }
}
```

---

## 16. Example: English Short Vowel Pool

```json
{
  "poolId": "english-class1-short-vowel-words",
  "subject": "english",
  "topic": "phonics",
  "grade": "Class 1",
  "pools": {
    "short_a_words": [
      {
        "id": "cat",
        "label": "cat",
        "initial": "c",
        "middle": "a",
        "endingLetter": "t",
        "ending": "at",
        "rime": "at",
        "vowelSound": "short_a",
        "phonemeCue": "/c/ /a/ /t/",
        "beginningPattern": "_at",
        "middlePattern": "c_t",
        "endingPattern": "ca_",
        "imageUrl": "/images/phonics/cat.svg",
        "audioUrl": "",
        "phonicPrompt": "c, a, t. Cat.",
        "phonicSoundUrl": ""
      }
    ],
    "short_i_words": [
      {
        "id": "pin",
        "label": "pin",
        "initial": "p",
        "middle": "i",
        "endingLetter": "n",
        "ending": "in",
        "rime": "in",
        "vowelSound": "short_i",
        "phonemeCue": "/p/ /i/ /n/",
        "beginningPattern": "_in",
        "middlePattern": "p_n",
        "endingPattern": "pi_",
        "imageUrl": "/images/phonics/pin.svg",
        "audioUrl": "",
        "phonicPrompt": "p, i, n. Pin.",
        "phonicSoundUrl": ""
      }
    ]
  }
}
```

---

## 17. Gemini Prompt Examples

### Generate Pool Metadata

```text
Fill missing metadata for these LKG science objects.
For each item add category, kind, property, value, simpleFact, questionCue, hint, correctFeedback, incorrectFeedback, stepByStepExplanation, tags, difficulty, gradeBand, and imagePrompt.
Do not change id, label, imageUrl, or audioUrl.
Use simple child-safe language.
```

### Generate A Template

```text
Create a dynamic template for LKG science.
Skill: identify hot objects.
Use poolId science-lkg-ukg-object-properties.
Target category: hot.
Distractor category: cold.
Question type: picture MCQ.
Use 2 options for easy, 3 for medium, 4 for hard.
Include hint, correct feedback, incorrect feedback, and step-by-step explanation.
Return valid JSON only.
```

### Check A Template

```text
Review this template for production readiness.
Check variable resolution, option count, answer validation, mobile rendering risk, missing pool fields, missing feedback, and whether it can generate 20 different seeds.
Return issues and fixed JSON.
```

---

## 18. Daily Authoring Routine

Use this routine for content production.

1. Pick one skill.
2. Create or select one pool.
3. Add 20 to 50 pool items.
4. Use Gemini to fill missing details.
5. Review and fix obvious metadata.
6. Add images for most-used items.
7. Add audio only where needed.
8. Create one dynamic template.
9. Test New Seed.
10. Test 20 seeds.
11. Open practice page.
12. Try correct and wrong answers.
13. Publish.

---

## 19. Common Problems And Fixes

### Problem: Question repeats the same item

Fix:

- Check pool has enough items.
- Use `count` greater than 1.
- Use New Seed.
- Make sure template uses pool variables, not hard-coded labels.

### Problem: `undefined` appears

Fix:

- Check variable names.
- Check pool item has that field.
- Check expression path like `Target.label`.

### Problem: `[object Object]` appears

Fix:

- Use `[Target.label]`, not `[Target]`.
- For image, use `[Target.imageUrl]`.

### Problem: MCQ save says at least 2 options required

Fix:

- Add at least two options.
- For dynamic pool templates, ensure target + distractor categories produce options.

### Problem: Image does not fit

Fix:

- Add `maxWidth`.
- Add `maxHeight`.
- Use row/wrap layout.
- Keep images centered with object-fit contain.

### Problem: Audio missing

Fix:

- Use Find / Generate Missing Audios.
- First check R2.
- Generate only missing audio.

---

## 20. Final Rule

For production, every skill should answer these questions:

1. What pool powers it?
2. What changes when seed changes?
3. What is the correct answer rule?
4. What does the child see?
5. What happens when the child is wrong?
6. Can this work on mobile?
7. Can a teacher understand and edit it later?

If all seven are clear, the template is ready to publish.
