/**
 * Data contexts for Ratio Chapter question generator
 */

export const RATIO_THEMES = [
  { itemA: "red ball", itemB: "blue ball", pluralA: "red balls", pluralB: "blue balls", emojiA: "🔴", emojiB: "🔵", category: "balls" },
  { itemA: "apple", itemB: "banana", pluralA: "apples", pluralB: "bananas", emojiA: "🍎", emojiB: "🍌", category: "fruits" },
  { itemA: "pencil", itemB: "eraser", pluralA: "pencils", pluralB: "erasers", emojiA: "✏️", emojiB: "🧽", category: "pencils" },
  { itemA: "boy", itemB: "girl", pluralA: "boys", pluralB: "girls", emojiA: "👦", emojiB: "👧", category: "students" },
  { itemA: "cup of sugar", itemB: "cup of flour", pluralA: "cups of sugar", pluralB: "cups of flour", emojiA: "🍚", emojiB: "🌾", category: "recipe" },
  { itemA: "litre of milk", itemB: "litre of water", pluralA: "litres of milk", pluralB: "litres of water", emojiA: "🥛", emojiB: "💧", category: "milk" },
  { itemA: "green marble", itemB: "yellow marble", pluralA: "green marbles", pluralB: "yellow marbles", emojiA: "🟢", emojiB: "🟡", category: "marbles" },
  { itemA: "star sticker", itemB: "heart sticker", pluralA: "star stickers", pluralB: "heart stickers", emojiA: "⭐", emojiB: "💖", category: "stickers" },
  { itemA: "math book", itemB: "science book", pluralA: "math books", pluralB: "science books", emojiA: "📘", emojiB: "📗", category: "books" }
];

export const SAME_KIND_PAIRS = [
  { valA: 10, unitA: "m", valB: 25, unitB: "m", sameKind: true, reason: "both represent lengths" },
  { valA: 5, unitA: "kg", valB: 12, unitB: "kg", sameKind: true, reason: "both represent weights" },
  { valA: 3, unitA: "litres", valB: 8, unitB: "litres", sameKind: true, reason: "both represent volumes" },
  { valA: 200, unitA: "ml", valB: 500, unitB: "ml", sameKind: true, reason: "both represent volumes" },
  { valA: 15, unitA: "seconds", valB: 45, unitB: "seconds", sameKind: true, reason: "both represent times" },
  { valA: 120, unitA: "cm", valB: 150, unitB: "cm", sameKind: true, reason: "both represent lengths" },
  { valA: 50, unitA: "paise", valB: 2, unitB: "rupees", sameKind: true, reason: "both represent monetary values" }
];

export const UNLIKE_KIND_PAIRS = [
  { valA: 5, unitA: "kg", valB: 2, unitB: "metres", sameKind: false, reason: "kilograms represent weight while metres represent length" },
  { valA: 12, unitA: "litres", valB: 15, unitB: "rupees", sameKind: false, reason: "litres represent volume while rupees represent money" },
  { valA: 60, unitA: "km/h", valB: 10, unitB: "seconds", sameKind: false, reason: "km/h represents speed while seconds represent time" },
  { valA: 8, unitA: "apples", valB: 4, unitB: "celsius", sameKind: false, reason: "apples represent count while celsius represents temperature" },
  { valA: 150, unitA: "pages", valB: 3, unitB: "hours", sameKind: false, reason: "pages represent quantity while hours represent time" }
];

export const ERROR_ANALYSIS_NAMES = ["Amit", "Sita", "John", "Priya", "Rahul", "Sarah"];
export const ERROR_MISTAKES = [
  {
    type: "partial_simplification",
    text: "did not simplify completely.",
    wrongSolve: (a, b, factor) => {
      // e.g. 12:18 -> divided by 2 is 6:9 instead of dividing by HCF=6 to get 2:3
      const hcf = 6;
      return `${a/2}:${b/2}`;
    }
  },
  {
    type: "order_confusion",
    text: "wrote the ratio terms in the wrong order.",
    wrongSolve: (a, b) => `${b}:${a}`
  },
  {
    type: "subtraction_instead_of_division",
    text: "subtracted the smaller number from the larger number instead of dividing.",
    wrongSolve: (a, b) => `${Math.abs(a - b)}`
  }
];

export const SCENARIOS_WORD_PROBLEMS = [
  {
    template: "In a class, there are {valA} boys and {valB} girls. What is the ratio of boys to girls?",
    typeA: "boys",
    typeB: "girls",
    solve: (a, b) => `${a}:${b}`
  },
  {
    template: "A recipe requires {valA} spoons of sugar and {valB} spoons of flour. Find the ratio of sugar to flour.",
    typeA: "spoons of sugar",
    typeB: "spoons of flour",
    solve: (a, b) => `${a}:${b}`
  },
  {
    template: "Rohan ran {valA} km and Sohan ran {valB} km. What is the ratio of the distance Rohan ran to the distance Sohan ran?",
    typeA: "distance Rohan ran",
    typeB: "distance Sohan ran",
    solve: (a, b) => `${a}:${b}`
  },
  {
    template: "A gardener planted {valA} rose plants and {valB} jasmine plants. What is the ratio of rose plants to jasmine plants?",
    typeA: "rose plants",
    typeB: "jasmine plants",
    solve: (a, b) => `${a}:${b}`
  }
];
