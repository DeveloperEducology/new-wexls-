'use client';

import { useState } from 'react';
import Link from 'next/link';

const TOPICS = [
  { id: '1', title: '1. The 100-Locker Puzzle', subtitle: 'Factors and Toggling' },
  { id: '2', title: '2. Square Numbers', subtitle: 'Side Length and Area' },
  { id: '3', title: '3. Patterns & Properties of Squares', subtitle: 'Last Digits, Zeros, Parity' },
  { id: '4', title: '4. Squares & Odd Numbers', subtitle: 'Sum of Odds, Subtraction' },
  { id: '5', title: '5. Between Squares', subtitle: 'Non-Square Count' },
  { id: '6', title: '6. Squares & Triangular Numbers', subtitle: 'Triangles to Squares' },
  { id: '7', title: '7. Square Roots', subtitle: 'Inverse & Symbols' },
  { id: '8', title: '8. Finding Square Roots', subtitle: 'Methods & Estimation' },
  { id: '9', title: '9. Cubic Numbers', subtitle: 'Side Length & Volume' },
  { id: '10', title: '10. Patterns & Properties of Cubes', subtitle: 'Ending Digits & Zeros' },
  { id: '11', title: '11. Taxicab Numbers', subtitle: 'Hardy-Ramanujan 1729' },
  { id: '12', title: '12. Cubes & Consecutive Odds', subtitle: 'Summing Odd Patterns' },
  { id: '13', title: '13. Cube Roots', subtitle: 'Triplets & Magic Guessing' },
  { id: '14', title: '14. Successive Differences', subtitle: 'Squares & Cubes levels' },
  { id: '15', title: '15. A Pinch of History', subtitle: 'Sanskrit & Babylonian roots' },
  { id: '16', title: '16. Question Bank', subtitle: 'Interactive MCQs, FIBs & Puzzles' }
];

const TOPIC_DETAILS = {
  '1': {
    title: 'The 100-Locker Puzzle',
    dialogue: [
      { speaker: 'Tutor', text: 'Hey there! Ready to solve a royal mystery? 👑 Let\'s imagine we are standing in a secret palace corridor with 100 closed lockers. 100 people walk down: Person 1 opens all, Person 2 toggles every 2nd, Person 3 toggles every 3rd... and so on. If you flip a light switch 3 times, is it on or off?' },
      { speaker: 'Student', text: 'It would be ON! 4 times would be OFF.' },
      { speaker: 'Tutor', text: 'Exactly! An odd number of toggles leaves it open, even leaves it closed. Now, who touches Locker #6?' },
      { speaker: 'Student', text: 'Person 1, 2, 3, and 6 touch it!' },
      { speaker: 'Tutor', text: 'Yes! These are the factors of 6. Since 6 has 4 factors (even), it ends up closed. Factor pairs usually come in pairs (1x6, 2x3). But what about 9?' },
      { speaker: 'Student', text: 'For 9, the factors are 1, 3, and 9 (3 factors, odd) because 3 pairs with itself!' },
      { speaker: 'Tutor', text: 'Perfect! So only square lockers (1, 4, 9, 16, 25, 36, 49, 64, 81, 100) stay open. What about the passcode consisting of lockers touched exactly twice?' },
      { speaker: 'Student', text: 'Lockers with only 2 factors are prime numbers, so they are 2, 3, 5, 7, and 11!' },
      { speaker: 'Tutor', text: 'Awesome! You solved the puzzle!' }
    ],
    recap: [
      'Toggling reverses a locker\'s state.',
      'Odd number of toggles = Open.',
      'Number of toggles = Number of factors.',
      'Perfect squares have an odd number of factors.',
      'Prime lockers are touched exactly twice.'
    ],
    memory: 'Odd is Open (both start with O!).',
    questions: [
      { q: 'If we had only 20 lockers, which ones would remain open?', a: '1, 4, 9, and 16.' },
      { q: 'List all factors of 16 to show why it stays open.', a: '1, 2, 4, 8, 16 (5 factors - odd!).' },
      { q: 'Will Locker 17 be open or closed? How many times was it toggled?', a: 'Closed. 17 is a prime number, so it was toggled 2 times (by Person 1 and Person 17).' }
    ],
    application: 'Transistors in computer chips toggle between 0 and 1 to compute instructions.'
  },
  '2': {
    title: 'Square Numbers',
    dialogue: [
      { speaker: 'Tutor', text: 'Let\'s explore Square Numbers. Imagine building a square floor with tiles. If you put 3 tiles in a row, how many rows do you need?' },
      { speaker: 'Student', text: 'We need 3 rows since a square has equal sides.' },
      { speaker: 'Tutor', text: 'Correct! That\'s 3 × 3 = 9 tiles. In math, multiplying a number by itself is called squaring. We write it as 3² (read as \'3 squared\'). Does 4² mean 4 × 2 = 8?' },
      { speaker: 'Student', text: 'No! The tiny 2 means multiply 4 by itself, so 4² = 4 × 4 = 16.' },
      { speaker: 'Tutor', text: 'Brilliant! Can we square decimals, like a square card of 2.5 cm side?' },
      { speaker: 'Student', text: 'Yes, 2.5 × 2.5 = 6.25.' },
      { speaker: 'Tutor', text: 'Exactly! Whole number squares (1, 4, 9, 16...) are called perfect squares.' }
    ],
    recap: [
      'Squaring is multiplying a number by itself.',
      'Geometrically, it is the area of a square.',
      'Written as n².',
      'Perfect squares come from whole numbers.'
    ],
    memory: 'Twin window panes: multiply twins to get the area.',
    questions: [
      { q: 'What is 9²?', a: '81.' },
      { q: 'Is 30 a perfect square?', a: 'No, because no whole number multiplied by itself equals 30 (5 × 5 = 25, 6 × 6 = 36).' },
      { q: 'Calculate the area of a square card with side length 2/3 meters.', a: '4/9 square meters (since 2/3 × 2/3 = 4/9).' }
    ],
    application: 'Television screen resolution and pixel layouts are arranged in square grids.'
  },
  '3': {
    title: 'Patterns and Properties of Perfect Squares',
    dialogue: [
      { speaker: 'Tutor', text: 'Look at the units digit of perfect squares: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100... what ending digits do you see?' },
      { speaker: 'Student', text: 'I see 0, 1, 4, 5, 6, 9. But 2, 3, 7, and 8 are missing!' },
      { speaker: 'Tutor', text: 'Right! Perfect squares never end in 2, 3, 7, or 8. Can 1,573 be a perfect square?' },
      { speaker: 'Student', text: 'No, it ends in 3.' },
      { speaker: 'Tutor', text: 'Correct. But does ending in 6 mean a number IS a square?' },
      { speaker: 'Student', text: 'No, 26 ends in 6 but isn\'t a square. So it only tells us it might be.' },
      { speaker: 'Tutor', text: 'Perfect! What about zeros? 10² = 100 (2 zeros), 200² = 40,000 (4 zeros).' },
      { speaker: 'Student', text: 'There is always an even number of zeros at the end!' },
      { speaker: 'Tutor', text: 'Yes! And what about parity: square of even/odd numbers?' },
      { speaker: 'Student', text: 'Square of even is even, square of odd is odd!' }
    ],
    recap: [
      'Never end in 2, 3, 7, or 8.',
      'Can end in 0, 1, 4, 5, 6, 9.',
      'Always have an even number of zeros at the end.',
      'Even squares are even, odd squares are odd.'
    ],
    memory: '2, 3, 7, 8 - No Square Gate! They can\'t enter the club.',
    questions: [
      { q: 'Why is 4,568 not a perfect square?', a: 'Because it ends in 8.' },
      { q: 'Is 9,000 a perfect square?', a: 'No, it ends in an odd number of zeros (3 zeros).' },
      { q: 'Is 42² even or odd?', a: 'Even, because 42 is even.' }
    ],
    application: 'Barcode verification scanners check for perfect square checks to verify scan accuracy.'
  },
  '4': {
    title: 'Squares and Odd Numbers',
    dialogue: [
      { speaker: 'Tutor', text: 'Let\'s list odd numbers: 1, 3, 5, 7, 9... watch their sums: 1 = 1², 1+3=4=2², 1+3+5=9=3²...' },
      { speaker: 'Student', text: 'Wow! The sum of the first n odd numbers is always n²!' },
      { speaker: 'Tutor', text: 'Yes! Geometrically, you add an L-shaped border. How can we find 36² if 35² = 1225?' },
      { speaker: 'Student', text: 'Add the 36th odd number! The formula is 2n - 1. So 2 × 36 - 1 = 71. 1225 + 71 = 1296!' },
      { speaker: 'Tutor', text: 'Perfect! We can also check if a number is a square by subtracting odd numbers consecutively. For 25: 25-1=24, 24-3=21, 21-5=16, 16-7=9, 9-9=0. Hitting 0 in 5 steps means √25 = 5. What about 38?' },
      { speaker: 'Student', text: '38-1=37, 37-3=34... eventually we get 2-13 = -11. We went negative! So 38 is not a perfect square.' }
    ],
    recap: [
      'Sum of first n odd numbers is n².',
      'n-th odd number is 2n - 1.',
      'Successive subtraction of odd numbers finds square roots and tests for squares.'
    ],
    memory: 'Odd addition makes square satisfaction!',
    questions: [
      { q: 'Write 49 as a sum of odd numbers.', a: '1 + 3 + 5 + 7 + 9 + 11 + 13 (first 7 odd numbers).' },
      { q: 'Find 21² given 20² = 400.', a: '400 + (2 × 21 - 1) = 400 + 41 = 441.' },
      { q: 'Use successive subtraction to check if 17 is a perfect square.', a: '17-1=16, 16-3=13, 13-5=8, 8-7=1, 1-9=-8. Fails (doesn\'t hit 0).' }
    ],
    application: 'Expanding outdoor patios with square grid brick borders.'
  },
  '5': {
    title: 'Numbers Between Consecutive Perfect Squares',
    dialogue: [
      { speaker: 'Tutor', text: 'Let\'s count non-squares between consecutive squares: between 1 and 4 we have 2, 3 (2 numbers). Between 4 and 9 we have 5, 6, 7, 8 (4 numbers). Between 9 and 16 we have 10-15 (6 numbers).' },
      { speaker: 'Student', text: 'The counts are 2, 4, 6... is there a formula?' },
      { speaker: 'Tutor', text: 'Yes, between n² and (n+1)², there are exactly 2n non-square numbers.' },
      { speaker: 'Student', text: 'So between 100² and 101², there are 2 × 100 = 200 numbers?' },
      { speaker: 'Tutor', text: 'Yes! Exactly 200.' }
    ],
    recap: [
      'Numbers between squares are non-squares.',
      'The count of numbers in the gap is 2n.',
      'Excludes the square numbers themselves.'
    ],
    memory: 'Double the smaller base number.',
    questions: [
      { q: 'How many non-squares between 6² and 7²?', a: '2 × 6 = 12.' },
      { q: 'How many between 12² and 13²?', a: '2 × 12 = 24.' },
      { q: 'If there are 30 numbers, what is n?', a: '15 (since 2n = 30).' }
    ],
    application: 'Computer database memory indexing layouts use gaps between square addresses.'
  },
  '6': {
    title: 'Perfect Squares and Triangular Numbers',
    dialogue: [
      { speaker: 'Tutor', text: 'Bowling pins form a triangle. The counts row-by-row are 1, 3, 6, 10, 15... these are triangular numbers. What happens if we add two consecutive triangular numbers?' },
      { speaker: 'Student', text: 'Let\'s see: 1+3=4 (2²), 3+6=9 (3²), 6+10=16 (4²). Wow! They make perfect squares!' },
      { speaker: 'Tutor', text: 'Yes! Two triangles of dots fit together to form a square grid!' }
    ],
    recap: [
      'Triangular numbers are 1, 3, 6, 10, 15...',
      'Sum of two consecutive triangular numbers is a perfect square.'
    ],
    memory: 'Two triangles form a square card cut diagonally.',
    questions: [
      { q: 'What is the next triangular number after 15?', a: '21 (since 15 + 6 = 21).' },
      { q: 'Add 10 and 15. What square do you get?', a: '25 (which is 5²).' },
      { q: 'Show that 15 and 21 form a square.', a: '15 + 21 = 36 (which is 6²).' }
    ],
    application: 'Louvre glass pyramid architecture combines triangular planes into square faces.'
  },
  '7': {
    title: 'Square Roots',
    dialogue: [
      { speaker: 'Tutor', text: 'If a square garden has an area of 49 square meters, what is its side?' },
      { speaker: 'Student', text: '7 meters, because 7 × 7 = 49.' },
      { speaker: 'Tutor', text: 'Exactly! You found the square root of 49, written as √49 = 7. But what is (-8) × (-8)?' },
      { speaker: 'Student', text: 'Positive 64! And 8 × 8 is also 64.' },
      { speaker: 'Tutor', text: 'So 64 has two square roots: +8 and -8. We write it as ±8. In Grade 8, we mostly focus on the positive one.' }
    ],
    recap: [
      'Square root is the opposite of squaring.',
      'Symbol is √.',
      'Every positive square has two roots (positive and negative).'
    ],
    memory: 'Roots grow down, representing the base of the square.',
    questions: [
      { q: 'What is √81?', a: '9.' },
      { q: 'If x² = 121, what are the two roots?', a: '11 and -11.' },
      { q: 'What is √1?', a: '1.' }
    ],
    application: 'Carpentry wall measurements: finding length from area.'
  },
  '8': {
    title: 'Methods to Find Square Roots',
    dialogue: [
      { speaker: 'Tutor', text: 'How do we find the square root of large numbers like 324? We can use Prime Factorization. Let\'s factor 324: 324 = 2 × 2 × 3 × 3 × 3 × 3.' },
      { speaker: 'Student', text: 'Group them in twin pairs: (2 × 2) × (3 × 3) × (3 × 3). Take one from each twin: 2 × 3 × 3 = 18!' },
      { speaker: 'Tutor', text: 'Perfect! We can also use Estimation for a number like √1936. It is between 40² = 1600 and 50² = 2500. It ends in 6, so the root must end in 4 or 6 (44 or 46). Check 45² = 2025. Since 1936 is less than 2025, it must be 44.' }
    ],
    recap: [
      'Successive subtraction: count steps.',
      'Prime factorization: twin pairs, pick one from each.',
      'Estimation: bound by tens and check units digit.'
    ],
    memory: 'Twin factors holding hands.',
    questions: [
      { q: 'Find √1764 using prime factorization.', a: '42 (since 1764 = 2 × 2 × 3 × 3 × 7 × 7, we pick 2 × 3 × 7 = 42).' },
      { q: 'Use estimation to find √1156.', a: '34 (between 30²=900 and 40²=1600, ending in 6 means 34 or 36. 35²=1225. 1156 < 1225, so 34).' },
      { q: 'Why is 90 not a perfect square?', a: 'Prime factors are 2 × 3 × 3 × 5. 2 and 5 do not have twins.' }
    ],
    application: 'GPS distance triangulation: finding path distances from grid coordinates.'
  },
  '9': {
    title: 'Cubic Numbers',
    dialogue: [
      { speaker: 'Tutor', text: 'Let\'s enter 3D space! 🧊 To build a cube of side 2 cm with 1 cm blocks, how many blocks do you need?' },
      { speaker: 'Student', text: '2 wide, 2 deep, 2 high. That\'s 2 × 2 × 2 = 8 blocks!' },
      { speaker: 'Tutor', text: 'Yes! For a 3 cm cube, it\'s 3 × 3 × 3 = 27 blocks. Multiplying a number by itself three times is called cubing, written as n³. What is (-6)³?' },
      { speaker: 'Student', text: '(-6) × (-6) × (-6) = 36 × (-6) = -216!' },
      { speaker: 'Tutor', text: 'Correct! The cube of a negative number is negative.' }
    ],
    recap: [
      'Cubing is multiplying a number three times.',
      'Represents the volume of a 3D cube.',
      'Exponent is 3.',
      'Negative cubes are negative.'
    ],
    memory: 'Cube is 3D, so power of 3.',
    questions: [
      { q: 'Find 5³.', a: '125.' },
      { q: 'Is 9 a perfect cube?', a: 'No, because 2³ = 8 and 3³ = 27.' },
      { q: 'Calculate (-4)³.', a: '-64.' }
    ],
    application: 'Cardboard box packing volume: sizing boxes for shipping.'
  },
  '10': {
    title: 'Patterns and Properties of Perfect Cubes',
    dialogue: [
      { speaker: 'Tutor', text: 'Look at the units digit of cubes: 1³=1, 2³=8, 3³=27 (ends in 7), 4³=64 (ends in 4), 5³=125 (ends in 5), 6³=216 (ends in 6), 7³=343 (ends in 3), 8³=512 (ends in 2), 9³=729 (ends in 9), 10³=1000 (ends in 0). What do you notice?' },
      { speaker: 'Student', text: 'All digits 0-9 are present! None are missing.' },
      { speaker: 'Tutor', text: 'Yes! And notice the matching: 1, 4, 5, 6, 9, 0 stay the same. 2 and 8 swap, 3 and 7 swap! What about ending zeros?' },
      { speaker: 'Student', text: 'Since 10³ = 1000 (3 zeros), the number of zeros must be a multiple of 3!' }
    ],
    recap: [
      'Cubes can end in any digit.',
      '1, 4, 5, 6, 9, 0 remain identical.',
      '2 ↔ 8 and 3 ↔ 7 swap.',
      'Ending zeros must be a multiple of 3.'
    ],
    memory: 'Friendly pairs: 2+8=10, 3+7=10 swap.',
    questions: [
      { q: 'What is the units digit of 23³?', a: '7 (since 3³ ends in 7).' },
      { q: 'Can 8,000 be a perfect cube?', a: 'Yes, it has 3 zeros (multiple of 3) and 8 is a cube.' },
      { q: 'Why is 100 not a perfect cube?', a: 'It has 2 zeros (not a multiple of 3).' }
    ],
    application: 'Audio decibel calculations: measuring cubic sound pressure waves.'
  },
  '11': {
    title: 'Taxicab Numbers (Hardy-Ramanujan 1729)',
    dialogue: [
      { speaker: 'Tutor', text: 'G.H. Hardy visited Srinivasa Ramanujan in a taxi numbered 1729. Hardy said it was a boring number, but Ramanujan said it is the smallest number that is the sum of two cubes in two different ways! What are the two ways?' },
      { speaker: 'Student', text: 'First way: 1728 + 1 = 12³ + 1³.' },
      { speaker: 'Tutor', text: 'Yes! And the second way uses 10³ = 1000.' },
      { speaker: 'Student', text: 'Ah! 1000 + 729 = 10³ + 9³!' },
      { speaker: 'Tutor', text: 'Perfect! These are called Taxicab Numbers.' }
    ],
    recap: [
      '1729 is the smallest Taxicab Number.',
      'Sum of two cubes in two ways: 12³ + 1³ and 10³ + 9³.'
    ],
    memory: 'Ramanujan\'s taxi 1729.',
    questions: [
      { q: 'Show that 4104 is a taxicab number using (2, 16) and (9, 15).', a: '2³ + 16³ = 8 + 4096 = 4104; 9³ + 15³ = 729 + 3375 = 4104.' },
      { q: 'Show that 13832 is a taxicab number using (18, 20) and (2, 24).', a: '18³ + 20³ = 5832 + 8000 = 13832; 2³ + 24³ = 8 + 13824 = 13832.' },
      { q: 'Is 10 a taxicab number?', a: 'No, it is too small (the smallest is 1729).' }
    ],
    application: 'Cryptography encryption: matching power values creates secure computer code.'
  },
  '12': {
    title: 'Cubes and Consecutive Odd Numbers',
    dialogue: [
      { speaker: 'Tutor', text: 'Let\'s group odd numbers: Group 1: 1 (sum=1=1³). Group 2: 3+5 (sum=8=2³). Group 3: 7+9+11 (sum=27=3³). Group 4: 13+15+17+19 (sum=64=4³). What is Group 5?' },
      { speaker: 'Student', text: 'Five numbers starting after 19: 21+23+25+27+29 = 125 = 5³!' },
      { speaker: 'Tutor', text: 'Exactly! Every cube n³ is the sum of n consecutive odd numbers.' }
    ],
    recap: [
      'Cubes are sums of consecutive odd numbers.',
      'Group n has n numbers and sums to n³.'
    ],
    memory: 'Voxel odd stacking.',
    questions: [
      { q: 'Write 6³ as odd sum.', a: '31 + 33 + 35 + 37 + 39 + 41.' },
      { q: 'Find the sum of 10 odds starting at 91 without adding them.', a: '1000 (since it is the 10th group, summing to 10³ = 1000).' },
      { q: 'Which cube is represented by 31+33+35+37+39+41?', a: '216 (which is 6³).' }
    ],
    application: 'Minecraft voxel engine rendering: sum of offset coordinates optimizes 3D graphics loading.'
  },
  '13': {
    title: 'Cube Roots',
    dialogue: [
      { speaker: 'Tutor', text: 'Cube root is the opposite of cubing, written as ³√y. E.g., ³√8 = 2. For 3375, we can use prime factorization: 3375 = 3 × 3 × 3 × 5 × 5 × 5.' },
      { speaker: 'Student', text: 'Group in triplets: (3 × 3 × 3) × (5 × 5 × 5). Take one from each triplet: 3 × 5 = 15!' },
      { speaker: 'Tutor', text: 'Correct! Now, the magic trick for ³√12,167: First, it ends in 7, so the root ends in 3. Second, cross out the last 3 digits (167) leaving 12. Largest cube below 12 is 8 (2³), so the tens digit is 2. The answer is 23!' },
      { speaker: 'Student', text: 'That is insane! It works!' }
    ],
    recap: [
      'Cube root symbol is ³√.',
      'Triplet grouping in prime factors.',
      'Last digit matching and thousands digit trick.'
    ],
    memory: 'Triplets select a captain.',
    questions: [
      { q: 'Find ³√216 using prime factorization.', a: '6 (since 216 = 2 × 2 × 2 × 3 × 3 × 3, root is 2 × 3 = 6).' },
      { q: 'Guess ³√4913 using the trick.', a: '17 (ends in 3 so root ends in 7; cross out 913 leaving 4; largest cube under 4 is 1 (1³), so tens digit is 1).' },
      { q: 'What is the value of ³√1000?', a: '10.' }
    ],
    application: 'Manufacturing container volume designs: sizing water tanks from liter capacities.'
  },
  '14': {
    title: 'Successive Differences of Squares and Cubes',
    dialogue: [
      { speaker: 'Tutor', text: 'Look at differences of squares: 1, 4, 9, 16, 25. Level 1 diffs are 3, 5, 7, 9. Level 2 diffs are 2, 2, 2. They are constant! What about cubes: 1, 8, 27, 64, 125. Level 1: 7, 19, 37, 61. Level 2: 12, 18, 24. Level 3: 6, 6, 6!' },
      { speaker: 'Student', text: 'Oh! Exponent 2 needs 2 levels, exponent 3 needs 3 levels!' },
      { speaker: 'Tutor', text: 'Yes, the level matches the power!' }
    ],
    recap: [
      'Level 2 differences for squares is constant (2).',
      'Level 3 differences for cubes is constant (6).',
      'Number of levels to constant matches the power.'
    ],
    memory: 'Power equals levels.',
    questions: [
      { q: 'Find the next term in Level 2 of cubes (12, 18, 24, 30...).', a: '36 (increases by 6 each time).' },
      { q: 'How many levels does n⁴ need to reach a constant difference?', a: '4 levels.' },
      { q: 'Find Level 1 difference between 6³ and 7³.', a: '127 (343 - 216 = 127).' }
    ],
    application: 'Rocket launch trajectory calculations: second and third derivative velocity models.'
  },
  '15': {
    title: 'A Pinch of History',
    dialogue: [
      { speaker: 'Tutor', text: 'History! Babylonians wrote squares and cubes in 1700 BCE. In ancient India, squares were called varga, cubes ghana, fourth power varga-varga. Root of a plant is mula in Sanskrit. Translators translated mula to Arabic jidhr and Latin radix.' },
      { speaker: 'Student', text: 'So square root means the base plant root of the square!' },
      { speaker: 'Tutor', text: 'Yes!' }
    ],
    recap: [
      'Babylonians listed squares in 1700 BCE.',
      'varga = square, ghana = cube.',
      'root comes from Sanskrit word mula.'
    ],
    memory: 'Mula is the root.',
    questions: [
      { q: 'What is the Sanskrit word for cube?', a: 'ghana.' },
      { q: 'What does varga-mula mean?', a: 'Square root (origin of the square).' },
      { q: 'Which civilization wrote lists on clay?', a: 'Babylonians.' }
    ],
    application: 'Historical linguistics and translation of ancient scientific texts.'
  }
};

// Question Bank Data
const MCQS = [
  {
    q: 'If Locker #36 is toggled, how many times will it be touched during the 100-locker process?',
    options: ['6 times', '8 times', '9 times', '10 times'],
    correct: 2,
    explanation: 'The number of toggles equals the number of factors. The factors of 36 are 1, 2, 3, 4, 6, 9, 12, 18, and 36 (9 unique factors). since it has an odd number of factors, it stays open!'
  },
  {
    q: 'What is the units digit of the square of 79?',
    options: ['9', '1', '8', '7'],
    correct: 1,
    explanation: 'Multiply the units digit by itself: 9 × 9 = 81. The units digit of the result is 1, so 79² will end in 1.'
  },
  {
    q: 'Which of these numbers can never be a perfect square?',
    options: ['324', '576', '1083', '1089'],
    correct: 2,
    explanation: 'Perfect squares can never end in 2, 3, 7, or 8. Since 1083 ends in 3, it cannot be a perfect square.'
  },
  {
    q: 'How many zeros will there be at the end of the value of 600²?',
    options: ['2 zeros', '3 zeros', '4 zeros', '6 zeros'],
    correct: 2,
    explanation: 'Squaring doubles the number of trailing zeros. Since 600 has 2 zeros, 600² will have 4 zeros (360,000).'
  },
  {
    q: 'What is the sum of the first 10 consecutive odd numbers starting from 1?',
    options: ['50', '100', '200', '10'],
    correct: 1,
    explanation: 'The sum of the first n consecutive odd numbers starting from 1 is always n². For 10 numbers, that is 10² = 100.'
  },
  {
    q: 'How many non-square numbers lie between the perfect squares 11² (121) and 12² (144)?',
    options: ['22', '24', '23', '11'],
    correct: 0,
    explanation: 'The number of non-square numbers between n² and (n+1)² is 2n. Here, n = 11, so 2 × 11 = 22.'
  },
  {
    q: 'Adding the triangular numbers 15 and 21 results in which perfect square?',
    options: ['16', '25', '36', '49'],
    correct: 2,
    explanation: 'Adding two consecutive triangular numbers always yields a perfect square. 15 + 21 = 36 (which is 6²).'
  },
  {
    q: 'What is the value of (-7)³?',
    options: ['-343', '+343', '-49', '+49'],
    correct: 0,
    explanation: 'The cube of a negative number is negative. (-7) × (-7) × (-7) = 49 × (-7) = -343.'
  },
  {
    q: 'If we compute the differences of cubic numbers level-by-level, at which level do the differences become constant?',
    options: ['Level 1', 'Level 2', 'Level 3', 'Level 4'],
    correct: 2,
    explanation: 'Since cubes have a power of 3, it takes exactly 3 levels of differences to find a constant number (which is 6).'
  },
  {
    q: 'What does the Sanskrit word "mula" mean in the context of roots?',
    options: ['Power of a number', 'Solid shape', 'Root of a plant / Origin', 'Multiplication'],
    correct: 2,
    explanation: 'Mula means the root of a plant or origin/basis, showing that the square root is the origin of a square.'
  }
];

const FIBS = [
  { q: 'A perfect square has an _____ number of factors because one factor multiplies by itself.', a: 'odd' },
  { q: 'The square of an odd number is always _____, and the square of an even number is always even.', a: 'odd' },
  { q: 'The formula to find the n-th odd number is _____.', a: '2n-1' },
  { q: 'The two integer square roots of 100 are 10 and _____.', a: '-10' },
  { q: 'In prime factorization of a perfect cube, every prime factor must appear in groups of _____.', a: 'three' },
  { q: '1729 is the smallest _____ number (expressed as sum of two cubes in two different ways).', a: 'taxicab' },
  { q: 'Sum of the consecutive odd numbers 13 + 15 + 17 + 19 is equal to 64, which is the cube of _____.', a: '4' },
  { q: 'The units digit of the cube of any number ending in 8 will always be _____.', a: '2' },
  { q: 'In ancient Sanskrit texts, the term used for a solid cube was _____.', a: 'ghana' },
  { q: 'The number of non-square numbers between 50² and 51² is _____.', a: '100' }
];

const MATCHES = [
  { left: '√441', right: '21', exp: '21 × 21 = 441' },
  { left: '³√729', right: '9', exp: '9 × 9 × 9 = 729' },
  { left: '15²', right: '225', exp: '15 × 15 = 225' },
  { left: '6³', right: '216', exp: '6 × 6 × 6 = 216' },
  { left: '³√1331', right: '11', exp: '11 × 11 × 11 = 1331' }
];

const PUZZLES = [
  {
    q: 'Magic Box Puzzle: A collection of marbles can be arranged in a perfect square grid of side 8, or a perfect cube of side 4. How many marbles are in the collection?',
    a: '64 marbles',
    explanation: '8² = 64 (perfect square) and 4³ = 64 (perfect cube). So 64 is a number that is both a perfect square and a perfect cube.'
  },
  {
    q: 'The Missing Row Puzzle: Rohan built a square stack of floor tiles with side length 15 tiles (so 225 tiles in total). He wants to increase the side length of the square to 16 tiles. What is the minimum number of additional tiles he needs to buy?',
    a: '31 tiles',
    explanation: 'To go from 15² to 16², he needs to add the 16th odd number. The formula is 2n - 1. So 2 × 16 - 1 = 31 tiles! (Also, 16² - 15² = 256 - 225 = 31).'
  },
  {
    q: 'The Prime Toggle Riddle: A locker is toggled exactly twice during the 100-locker puzzle. If the sum of its factors is 18, what is the locker number?',
    a: '17',
    explanation: 'Toggled exactly twice means the locker number must be prime. The factors of a prime number p are only 1 and p. Sum of factors is 1 + p = 18. So p = 17.'
  }
];

export default function SquareAndCubeDocs() {
  const [selectedTopicId, setSelectedTopicId] = useState('1');
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [activeQbTab, setActiveQbTab] = useState('mcq');
  
  // MCQ state
  const [selectedMcqOpts, setSelectedMcqOpts] = useState({});
  
  // FIB state
  const [fibInputs, setFibInputs] = useState({});
  const [checkedFibs, setCheckedFibs] = useState({});

  const topicData = TOPIC_DETAILS[selectedTopicId];

  const handleNext = () => {
    const nextId = String(Number(selectedTopicId) + 1);
    if (TOPIC_DETAILS[nextId] || nextId === '16') {
      setSelectedTopicId(nextId);
      setRevealedAnswers({});
    }
  };

  const toggleAnswer = (index) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleMcqSelect = (qIdx, optIdx) => {
    setSelectedMcqOpts(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleFibCheck = (qIdx) => {
    setCheckedFibs(prev => ({
      ...prev,
      [qIdx]: true
    }));
  };

  const renderQuestionBank = () => {
    return (
      <div>
        <div style={{ marginBottom: 24, borderBottom: '2px dashed #e2e8f0', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setActiveQbTab('mcq')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: activeQbTab === 'mcq' ? '#0d9488' : '#e2e8f0',
                color: activeQbTab === 'mcq' ? '#fff' : '#475569',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              📝 MCQs
            </button>
            <button
              onClick={() => setActiveQbTab('fib')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: activeQbTab === 'fib' ? '#0d9488' : '#e2e8f0',
                color: activeQbTab === 'fib' ? '#fff' : '#475569',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              ✍️ Fill in Blanks
            </button>
            <button
              onClick={() => setActiveQbTab('match')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: activeQbTab === 'match' ? '#0d9488' : '#e2e8f0',
                color: activeQbTab === 'match' ? '#fff' : '#475569',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              🔗 Match Pairs
            </button>
            <button
              onClick={() => setActiveQbTab('puzzle')}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: activeQbTab === 'puzzle' ? '#0d9488' : '#e2e8f0',
                color: activeQbTab === 'puzzle' ? '#fff' : '#475569',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              🧩 Brain Puzzles
            </button>
          </div>
        </div>

        {activeQbTab === 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {MCQS.map((mcq, qIdx) => {
              const selectedOpt = selectedMcqOpts[qIdx];
              const isChecked = selectedOpt !== undefined;
              const isCorrect = selectedOpt === mcq.correct;
              return (
                <div key={qIdx} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Q{qIdx + 1}. {mcq.q}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {mcq.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      let bg = '#f8fafc';
                      let border = '1px solid #e2e8f0';
                      let color = '#334155';
                      
                      if (isOptionSelected) {
                        if (optIdx === mcq.correct) {
                          bg = '#d1fae5';
                          border = '1px solid #34d399';
                          color = '#065f46';
                        } else {
                          bg = '#fee2e2';
                          border = '1px solid #f87171';
                          color = '#991b1b';
                        }
                      } else if (isChecked && optIdx === mcq.correct) {
                        // Highlight correct answer if checked wrong
                        bg = '#d1fae5';
                        border = '1px solid #34d399';
                        color = '#065f46';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => !isChecked && handleMcqSelect(qIdx, optIdx)}
                          disabled={isChecked}
                          style={{
                            textAlign: 'left', padding: '12px 14px', borderRadius: 8, fontSize: 13.5,
                            fontWeight: 600, background: bg, border: border, color: color,
                            cursor: isChecked ? 'default' : 'pointer', transition: 'all 0.1s'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {isChecked && (
                    <div style={{
                      marginTop: 16, padding: '12px 16px', borderRadius: 8,
                      background: isCorrect ? '#f0fdf4' : '#fff5f5',
                      borderLeft: isCorrect ? '4px solid #10b981' : '4px solid #ef4444',
                      fontSize: 13.5, color: isCorrect ? '#14532d' : '#7f1d1d', lineHeight: 1.5
                    }}>
                      <strong>{isCorrect ? '🎉 Correct!' : '❌ Incorrect!'}</strong> {mcq.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeQbTab === 'fib' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {FIBS.map((fib, qIdx) => {
              const userInput = fibInputs[qIdx] || '';
              const isChecked = checkedFibs[qIdx];
              const isCorrect = userInput.trim().toLowerCase() === fib.a.toLowerCase();
              return (
                <div key={qIdx} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>
                    Statement {qIdx + 1}:
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: 15, color: '#334155', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{fib.q}"
                  </p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Type blank word..."
                      value={userInput}
                      onChange={(e) => !isChecked && setFibInputs(prev => ({ ...prev, [qIdx]: e.target.value }))}
                      disabled={isChecked}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5,
                        width: 200, outline: 'none', background: isChecked ? '#f1f5f9' : '#fff'
                      }}
                    />
                    {!isChecked ? (
                      <button
                        onClick={() => handleFibCheck(qIdx)}
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          background: '#0d9488', color: '#fff', border: 'none'
                        }}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <span style={{
                        fontSize: 13.5, fontWeight: 700,
                        color: isCorrect ? '#10b981' : '#ef4444'
                      }}>
                        {isCorrect ? '🎉 Correct!' : `❌ Incorrect! Answer is: "${fib.a}"`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeQbTab === 'match' && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24 }}>
            <p style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Match the equations with their correct results:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MATCHES.map((item, index) => (
                <div key={index} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto 1fr 2fr', gap: 20, alignItems: 'center',
                  padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9'
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f766e' }}>{item.left}</span>
                  <span style={{ fontSize: 16, color: '#94a3b8' }}>➔</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0369a1' }}>{item.right}</span>
                  <span style={{ fontSize: 12.5, color: '#64748b', fontStyle: 'italic' }}>({item.exp})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeQbTab === 'puzzle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {PUZZLES.map((item, index) => {
              const isRevealed = revealedAnswers[index];
              return (
                <div key={index} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🧩 Brain Puzzle {index + 1}
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.6, color: '#1e293b', fontWeight: 600 }}>
                    {item.q}
                  </p>
                  <div>
                    {isRevealed ? (
                      <div style={{
                        background: '#f8fafc', borderLeft: '4px solid #b45309', padding: '12px 16px',
                        borderRadius: '0 8px 8px 0', fontSize: 13.5, color: '#78350f', lineHeight: 1.5
                      }}>
                        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Answer: {item.a}</p>
                        <p style={{ margin: 0 }}><strong>Explanation:</strong> {item.explanation}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleAnswer(index)}
                        style={{
                          background: '#fef3c7', border: 'none', color: '#b45309', padding: '8px 16px',
                          borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        💡 Reveal Solution
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#1e293b',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
    }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: 320,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0,
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13,148,136,0.2)'
          }}>
            <span style={{ fontSize: 18, color: '#fff' }}>📘</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Grade 8 Math</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Squares & Cubes</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {TOPICS.map((topic) => {
            const isActive = selectedTopicId === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  setRevealedAnswers({});
                  setSelectedMcqOpts({});
                  setFibInputs({});
                  setCheckedFibs({});
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(13,148,136,0.08)' : 'transparent',
                  color: isActive ? '#0d9488' : '#64748b',
                  border: isActive ? '1px solid rgba(13,148,136,0.15)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? '#0f766e' : '#334155' }}>
                  {topic.title}
                </span>
                <span style={{ fontSize: 11, color: isActive ? '#0d9488' : '#94a3b8' }}>
                  {topic.subtitle}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <main style={{ flex: 1, padding: '48px 48px 80px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
          
          <div style={{ marginBottom: 32, borderBottom: '2px solid #f1f5f9', paddingBottom: 16 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#0d9488',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: '#ccfbf1',
              padding: '4px 8px',
              borderRadius: 6
            }}>
              {selectedTopicId === '16' ? 'Practice' : `Topic ${selectedTopicId}`}
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '12px 0 6px', letterSpacing: '-0.03em' }}>
              {selectedTopicId === '16' ? 'Comprehensive Question Bank' : topicData.title}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
              {selectedTopicId === '16' ? 'Test your skills with interactive questions' : 'Interactive tutor explanation for 10-year-olds'}
            </p>
          </div>

          {selectedTopicId === '16' ? (
            renderQuestionBank()
          ) : (
            <div>
              {/* Dialogue Section */}
              <section style={{ marginBottom: 40 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
                  💬 Tutor-Student Dialogue
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {topicData.dialogue.map((msg, index) => {
                    const isTutor = msg.speaker === 'Tutor';
                    return (
                      <div key={index} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isTutor ? 'flex-start' : 'flex-end',
                        width: '100%'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: '#64748b',
                          marginBottom: 4,
                          fontWeight: 600
                        }}>
                          <span>{isTutor ? '🧑‍🏫 Tutor' : '👤 Student'}</span>
                        </div>
                        <div style={{
                          maxWidth: '75%',
                          background: isTutor ? '#f0fdfa' : '#f1f5f9',
                          border: isTutor ? '1px solid #ccfbf1' : '1px solid #e2e8f0',
                          color: '#0f172a',
                          padding: '14px 18px',
                          borderRadius: isTutor ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                          fontSize: 14.5,
                          lineHeight: 1.6,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          {msg.text.split('**').map((chunk, cIdx) => 
                            cIdx % 2 === 1 ? <strong key={cIdx} style={{ color: isTutor ? '#0f766e' : '#0f172a' }}>{chunk}</strong> : chunk
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Quick Recap */}
              <section style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 24,
                marginBottom: 32,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✅ Quick Recap
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topicData.recap.map((item, index) => (
                    <li key={index} style={{ fontSize: 14.5, lineHeight: 1.5, color: '#334155' }}>
                      {item.split('**').map((chunk, cIdx) => 
                        cIdx % 2 === 1 ? <strong key={cIdx} style={{ color: '#0f172a' }}>{chunk}</strong> : chunk
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Memory Trick & Real Life App */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                {topicData.memory && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 16,
                    padding: 20
                  }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🧠 Memory Trick
                    </h4>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: '#78350f' }}>
                      {topicData.memory}
                    </p>
                  </div>
                )}

                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 16,
                  padding: 20
                }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🌍 Real-Life Application
                  </h4>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: '#0c4a6e' }}>
                    {topicData.application}
                  </p>
                </div>
              </div>

              {/* Practice Questions */}
              <section style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 24,
                marginBottom: 40
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✍️ Practice Questions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {topicData.questions.map((item, index) => (
                    <div key={index} style={{
                      borderBottom: index < topicData.questions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      paddingBottom: index < topicData.questions.length - 1 ? 16 : 0
                    }}>
                      <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                        Q{index + 1}: {item.q}
                      </p>
                      <div>
                        {revealedAnswers[index] ? (
                          <div style={{
                            background: '#f8fafc',
                            borderLeft: '4px solid #0d9488',
                            padding: '10px 14px',
                            borderRadius: '0 8px 8px 0',
                            fontSize: 13.5,
                            color: '#0f766e',
                            lineHeight: 1.5
                          }}>
                            <strong>Answer:</strong> {item.a}
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleAnswer(index)}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              color: '#64748b',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
                            onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
                          >
                            👁️ Show Answer
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Next Topic Navigation */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#f8fafc',
                border: '2px dashed #cbd5e1',
                borderRadius: 16,
                padding: 24,
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                  🤔 Are you ready for the next topic?
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                  Up next: {selectedTopicId === '15' ? 'Question Bank' : TOPICS[Number(selectedTopicId)].title}
                </p>
                <button
                  onClick={handleNext}
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #0ea5e9)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'none'}
                >
                  Go to {selectedTopicId === '15' ? 'Question Bank' : `Topic ${Number(selectedTopicId) + 1}`} ➔
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
