# Grade 5 Fractions Generator Specification

**Purpose:** This document defines the Grade 5 fraction templates, micro-skills, catalog entries, JSON expectations, visual requirements, and validation rules to implement in the existing WEXLS-style practice system.

**Target folder:** `src/lib/practice/generators/math/topics/fractions/`

**Important:** Do not create a new fractions folder, do not create `fractions-v2`, and do not duplicate the existing architecture. Continue from the current fractions topic pattern.

---

## Main Prompt For Antigravity

Please implement the Grade 5 fraction models defined in the attached `fractions_grade5_specification.md`.

Use the existing project architecture:

- Generators produce question JSON only.
- React components render question JSON only.
- Template engines live inside topic folders.
- Micro-skills are grade-wise configs.
- Reuse the shared `PracticeShell`, `QuestionRenderer`, `MCQRenderer`, `FillBlankRenderer`, and `PracticeFeedback`.
- Keep answer validation reusable and compatible with the current practice system.
- Do not hardcode question UI in API routes.
- Do not create experimental routes.

---

## Template Families To Add

### 1. Convert Improper Fraction To Mixed Number

**Micro-skill**

```json
{
  "skillId": "fractions-g5-convert-improper-to-mixed",
  "code": "G5.F.1",
  "title": "Convert improper fractions to mixed numbers",
  "grade": 5,
  "templateId": "fractions.conversion.improperToMixed",
  "engine": "conversion"
}
```

**Example questions**

```txt
Convert 7/3 to a mixed number.
Convert 17/5 to a mixed number.
```

**Expected question JSON shape**

```json
{
  "type": "fillInTheBlank",
  "questionText": "Convert 7/3 to a mixed number.",
  "parts": [
    {
      "type": "text",
      "content": "Convert 7/3 to a mixed number."
    },
    {
      "type": "fraction",
      "numerator": 7,
      "denominator": 3
    },
    {
      "type": "text",
      "content": "7/3 = [[whole]] [[num]]/[[den]]"
    }
  ],
  "answer": {
    "whole": "2",
    "num": "1",
    "den": "3"
  },
  "metadata": {
    "subject": "math",
    "topic": "fractions",
    "skillId": "fractions-g5-convert-improper-to-mixed",
    "templateId": "fractions.conversion.improperToMixed",
    "engine": "conversion",
    "grade": 5,
    "competencyId": "fractions_conversion"
  }
}
```

**Solution requirements**

- Explain division: `7 ÷ 3 = 2 remainder 1`.
- Explain that the quotient becomes the whole number.
- Explain that the remainder becomes the numerator.
- Keep the same denominator.

```txt
7 ÷ 3 = 2 remainder 1.
So, 7/3 = 2 1/3.
```

Use an SVG visual model if practical: groups of thirds with complete wholes highlighted.

---

### 2. Convert Mixed Number To Improper Fraction

**Micro-skill**

```json
{
  "skillId": "fractions-g5-convert-mixed-to-improper",
  "code": "G5.F.2",
  "title": "Convert mixed numbers to improper fractions",
  "grade": 5,
  "templateId": "fractions.conversion.mixedToImproper",
  "engine": "conversion"
}
```

**Example questions**

```txt
Convert 2 1/3 to an improper fraction.
Convert 4 2/5 to an improper fraction.
```

**Expected answer**

```json
{
  "num": "7",
  "den": "3"
}
```

**Solution requirements**

```txt
Multiply the whole number by the denominator: 2 × 3 = 6.
Add the numerator: 6 + 1 = 7.
Keep the denominator: 3.
So, 2 1/3 = 7/3.
```

Use stacked fraction rendering using SVG, LaTeX-style rendering, or the existing fraction renderer. Avoid plain slash-only formatting in the main visual whenever possible.

---

## 3. Comparison Of Fractions

Create three separate Grade 5 micro-skills.

### 3A. Compare Like Fractions

**Micro-skill**

```json
{
  "skillId": "fractions-g5-compare-like-fractions",
  "code": "G5.F.3",
  "title": "Compare like fractions",
  "grade": 5,
  "templateId": "fractions.compare.likeFractions",
  "engine": "comparison"
}
```

**Question examples**

```txt
Compare 3/8 and 5/8.
Which is greater: 4/9 or 7/9?
```

**Rules**

- Denominators must be the same.
- Compare numerators only.
- Answer type can be MCQ or fill-in-the-blank.
- Options can be `<`, `>`, and `=`.

**Solution example**

```txt
Both fractions have denominator 8.
Compare the numerators: 3 and 5.
Since 3 < 5, 3/8 < 5/8.
```

Use an underbrace-style visual explanation if practical:

```txt
3/8 and 5/8
        underbrace: same denominator
```

---

### 3B. Compare Unlike Fractions

**Micro-skill**

```json
{
  "skillId": "fractions-g5-compare-unlike-fractions",
  "code": "G5.F.4",
  "title": "Compare unlike fractions",
  "grade": 5,
  "templateId": "fractions.compare.unlikeFractions",
  "engine": "comparison"
}
```

**Question examples**

```txt
Compare 2/3 and 3/5.
Which is greater: 5/6 or 7/10?
```

**Difficulty**

```json
{
  "easy": {
    "denominatorMax": 10
  },
  "medium": {
    "denominatorMax": 15
  },
  "hard": {
    "denominatorMax": 20
  }
}
```

**Solution example**

```txt
The denominators are different.
Use a common denominator.
The common denominator of 3 and 5 is 15.
2/3 = 10/15.
3/5 = 9/15.
Since 10/15 > 9/15, 2/3 > 3/5.
```

Use SVG fraction strips when possible.

---

### 3C. Compare Proper Fractions

**Micro-skill**

```json
{
  "skillId": "fractions-g5-compare-proper-fractions",
  "code": "G5.F.5",
  "title": "Compare proper fractions",
  "grade": 5,
  "templateId": "fractions.compare.properFractions",
  "engine": "comparison"
}
```

**Rules**

- Both fractions must be proper fractions.
- Numerator must be smaller than denominator.
- Difficulty may include like or unlike denominators.
- Use common denominator explanation for unlike denominators.

**Solution should explain**

```txt
Both fractions are proper fractions because each numerator is smaller than its denominator.
Then compare them using a common denominator.
```

---

## 4. Addition Of Fractions

### 4A. Add Like Fractions

**Micro-skill**

```json
{
  "skillId": "fractions-g5-add-like-fractions",
  "code": "G5.F.6",
  "title": "Add like fractions",
  "grade": 5,
  "templateId": "fractions.addition.likeFractions",
  "engine": "addition"
}
```

**Examples**

```txt
2/9 + 4/9 = ?
3/10 + 5/10 = ?
```

**Rules**

- Same denominator.
- Add numerators.
- Keep denominator.
- Simplify result when possible.

**Solution example**

```txt
The denominators are the same.
Add the numerators: 2 + 4 = 6.
Keep the denominator 9.
2/9 + 4/9 = 6/9.
Simplify: 6/9 = 2/3.
```

---

### 4B. Add Improper Fractions

**Micro-skill**

```json
{
  "skillId": "fractions-g5-add-improper-fractions",
  "code": "G5.F.7",
  "title": "Add improper fractions",
  "grade": 5,
  "templateId": "fractions.addition.improperFractions",
  "engine": "addition"
}
```

**Examples**

```txt
7/4 + 5/4 = ?
9/5 + 6/5 = ?
```

**Rules**

- Fractions may be improper.
- Start with like denominators.
- Result may be improper or mixed.
- Accept one canonical answer unless reusable equivalent-fraction validation already exists.

**Solution example**

```txt
7/4 + 5/4 = 12/4.
12/4 = 3.
```

---

### 4C. Add A Fraction And An Integer

**Micro-skill**

```json
{
  "skillId": "fractions-g5-add-fraction-and-integer",
  "code": "G5.F.8",
  "title": "Add a fraction and an integer",
  "grade": 5,
  "templateId": "fractions.addition.fractionAndInteger",
  "engine": "addition"
}
```

**Examples**

```txt
3 + 2/5 = ?
4 + 3/7 = ?
```

**Expected answer**

```json
{
  "whole": "3",
  "num": "2",
  "den": "5"
}
```

**Solution example**

```txt
The whole number stays whole.
The fraction part stays beside it.
3 + 2/5 = 3 2/5.
```

---

### 4D. Missing Addend: Fraction

**Micro-skill**

```json
{
  "skillId": "fractions-g5-missing-fraction-addend",
  "code": "G5.F.9",
  "title": "Find the missing fraction addend",
  "grade": 5,
  "templateId": "fractions.addition.missingFractionAddend",
  "engine": "addition"
}
```

**Examples**

```txt
2/7 + ? = 5/7
? + 3/8 = 6/8
```

**Rules**

- Use like fractions first.
- Missing numerator only for easy level.
- Denominator stays the same.

**Expected answer example**

```json
{
  "num": "3",
  "den": "7"
}
```

**Solution example**

```txt
Since the denominators are the same, subtract the numerators.
5 - 2 = 3.
The missing addend is 3/7.
```

---

### 4E. Missing Addend: Integer Or Mixed Result

**Micro-skill**

```json
{
  "skillId": "fractions-g5-missing-integer-addend",
  "code": "G5.F.10",
  "title": "Find the missing integer addend",
  "grade": 5,
  "templateId": "fractions.addition.missingIntegerAddend",
  "engine": "addition"
}
```

**Examples**

```txt
? + 2/5 = 4 2/5
3 + ? = 3 4/7
```

**Rules**

- Support missing whole number.
- Support missing fraction part.
- Compare whole parts and fraction parts separately.
- Keep difficulty conservative.

---

### 4F. Add Three Or More Fractions

**Micro-skill**

```json
{
  "skillId": "fractions-g5-add-multiple-fractions",
  "code": "G5.F.11",
  "title": "Add three or more fractions",
  "grade": 5,
  "templateId": "fractions.addition.multipleFractions",
  "engine": "addition"
}
```

**Examples**

```txt
1/8 + 2/8 + 3/8 = ?
2/10 + 3/10 + 4/10 = ?
```

**Rules**

- Start with like denominators.
- Use three addends first.
- Add numerators.
- Keep denominator.
- Simplify if possible.

**Solution example**

```txt
The denominators are the same.
Add the numerators: 1 + 2 + 3 = 6.
Keep denominator 8.
6/8 = 3/4.
```

---

## Grade 5 Catalog Entries

Add these skills to the Fractions topic catalog/homepage under a `Grade 5 skills` section.

```json
[
  {
    "code": "G5.F.1",
    "title": "Convert improper fractions to mixed numbers",
    "skillId": "fractions-g5-convert-improper-to-mixed"
  },
  {
    "code": "G5.F.2",
    "title": "Convert mixed numbers to improper fractions",
    "skillId": "fractions-g5-convert-mixed-to-improper"
  },
  {
    "code": "G5.F.3",
    "title": "Compare like fractions",
    "skillId": "fractions-g5-compare-like-fractions"
  },
  {
    "code": "G5.F.4",
    "title": "Compare unlike fractions",
    "skillId": "fractions-g5-compare-unlike-fractions"
  },
  {
    "code": "G5.F.5",
    "title": "Compare proper fractions",
    "skillId": "fractions-g5-compare-proper-fractions"
  },
  {
    "code": "G5.F.6",
    "title": "Add like fractions",
    "skillId": "fractions-g5-add-like-fractions"
  },
  {
    "code": "G5.F.7",
    "title": "Add improper fractions",
    "skillId": "fractions-g5-add-improper-fractions"
  },
  {
    "code": "G5.F.8",
    "title": "Add a fraction and an integer",
    "skillId": "fractions-g5-add-fraction-and-integer"
  },
  {
    "code": "G5.F.9",
    "title": "Find the missing fraction addend",
    "skillId": "fractions-g5-missing-fraction-addend"
  },
  {
    "code": "G5.F.10",
    "title": "Find the missing integer addend",
    "skillId": "fractions-g5-missing-integer-addend"
  },
  {
    "code": "G5.F.11",
    "title": "Add three or more fractions",
    "skillId": "fractions-g5-add-multiple-fractions"
  }
]
```

---

## Visual Requirements

Use SVG or LaTeX-style formatting for:

- stacked fractions
- mixed numbers
- fraction bars
- visual fraction strips
- underbrace-style explanations
- highlighted same denominators
- common denominator conversion steps

For like denominators, show the concept visually:

```txt
2/7 + 3/7
     underbrace: same denominator, same-size parts
```

For unlike denominators, show conversion:

```txt
2/3 = 10/15
3/5 = 9/15
```

Use compact visuals that fit mobile screens.

---

## Validation Requirements

MCQ should validate using either:

```json
{
  "correctAnswerIndex": 1
}
```

or:

```json
{
  "answer": "option-id-or-label"
}
```

Fill-in-the-blank should validate every expected field:

```json
{
  "answer": {
    "whole": "2",
    "num": "1",
    "den": "3"
  }
}
```

Equivalent fractions should only be accepted if reusable fraction-equivalence validation already exists. Otherwise, use one canonical expected answer.

---

## Test URLs

After implementation, these routes must work:

```txt
/practice?subject=math&topic=fractions&skill=fractions-g5-convert-improper-to-mixed
/practice?subject=math&topic=fractions&skill=fractions-g5-convert-mixed-to-improper
/practice?subject=math&topic=fractions&skill=fractions-g5-compare-like-fractions
/practice?subject=math&topic=fractions&skill=fractions-g5-compare-unlike-fractions
/practice?subject=math&topic=fractions&skill=fractions-g5-compare-proper-fractions
/practice?subject=math&topic=fractions&skill=fractions-g5-add-like-fractions
/practice?subject=math&topic=fractions&skill=fractions-g5-add-improper-fractions
/practice?subject=math&topic=fractions&skill=fractions-g5-add-fraction-and-integer
/practice?subject=math&topic=fractions&skill=fractions-g5-missing-fraction-addend
/practice?subject=math&topic=fractions&skill=fractions-g5-missing-integer-addend
/practice?subject=math&topic=fractions&skill=fractions-g5-add-multiple-fractions
```

---

## Build Check

Run:

```bash
npm run build
```

The build must pass.

