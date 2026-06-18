'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import styles from './student.module.css';

// ── Full LKG Math Curriculum Roadmap ────────────────────────────────────────
// All skills from the LKG mathematics curriculum, in sequential order.
// Positions are generated programmatically via the helper below.

const LKG_MATH_SKILLS = [
  // A – Shapes
  { skillId: 'lkg-shapes-name-shape',       title: 'Name the shape',                    code: 'A.1', group: 'Shapes' },
  { skillId: 'lkg-shapes-circles',          title: 'Circles',                            code: 'A.2', group: 'Shapes' },
  { skillId: 'lkg-shapes-squares',          title: 'Squares',                            code: 'A.3', group: 'Shapes' },
  { skillId: 'lkg-shapes-triangles',        title: 'Triangles',                          code: 'A.4', group: 'Shapes' },
  { skillId: 'lkg-shapes-rectangles',       title: 'Rectangles',                         code: 'A.5', group: 'Shapes' },
  { skillId: 'lkg-shapes-mixed',            title: 'Circles, squares & triangles',       code: 'A.6', group: 'Shapes' },
  // B – Count to 3
  { skillId: 'lkg-count3-learn',            title: 'Learn to count – up to 3',           code: 'B.1', group: 'Count to 3' },
  { skillId: 'lkg-count3-objects',          title: 'Count objects – up to 3',            code: 'B.2', group: 'Count to 3' },
  { skillId: 'lkg-count3-dots',             title: 'Count dots – up to 3',               code: 'B.3', group: 'Count to 3' },
  { skillId: 'lkg-count3-shapes',           title: 'Count shapes – up to 3',             code: 'B.4', group: 'Count to 3' },
  { skillId: 'lkg-count3-ten-frames',       title: 'Count on ten frames – up to 3',      code: 'B.5', group: 'Count to 3' },
  { skillId: 'lkg-count3-show-ten-frames',  title: 'Show numbers on ten frames – up to 3', code: 'B.6', group: 'Count to 3' },
  { skillId: 'lkg-count3-represent',        title: 'Represent numbers – up to 3',        code: 'B.7', group: 'Count to 3' },
  // C – Count to 5
  { skillId: 'lkg-count5-learn',            title: 'Learn to count – up to 5',           code: 'C.1', group: 'Count to 5' },
  { skillId: 'lkg-count5-objects',          title: 'Count objects – up to 5',            code: 'C.2', group: 'Count to 5' },
  { skillId: 'lkg-count5-dots',             title: 'Count dots – up to 5',               code: 'C.3', group: 'Count to 5' },
  { skillId: 'lkg-count5-shapes',           title: 'Count shapes – up to 5',             code: 'C.4', group: 'Count to 5' },
  { skillId: 'lkg-count5-ten-frames',       title: 'Count on ten frames – up to 5',      code: 'C.5', group: 'Count to 5' },
  { skillId: 'lkg-count5-show-ten-frames',  title: 'Show numbers on ten frames – up to 5', code: 'C.6', group: 'Count to 5' },
  { skillId: 'lkg-count5-represent',        title: 'Represent numbers – up to 5',        code: 'C.7', group: 'Count to 5' },
  // D – Count to 10
  { skillId: 'lkg-count10-learn',           title: 'Learn to count – up to 10',          code: 'D.1', group: 'Count to 10' },
  { skillId: 'lkg-count10-objects',         title: 'Count objects – up to 10',           code: 'D.2', group: 'Count to 10' },
  { skillId: 'lkg-count10-dots',            title: 'Count dots – up to 10',              code: 'D.3', group: 'Count to 10' },
  { skillId: 'lkg-count10-shapes',          title: 'Count shapes – up to 10',            code: 'D.4', group: 'Count to 10' },
  { skillId: 'lkg-count10-ten-frames',      title: 'Count on ten frames – up to 10',     code: 'D.5', group: 'Count to 10' },
  { skillId: 'lkg-count10-show-ten-frames', title: 'Show numbers on ten frames – up to 10', code: 'D.6', group: 'Count to 10' },
  { skillId: 'lkg-count10-represent',       title: 'Represent numbers – up to 10',       code: 'D.7', group: 'Count to 10' },
  // E – Comparing
  { skillId: 'lkg-compare-enough',          title: 'Are there enough?',                  code: 'E.1', group: 'Comparing' },
  { skillId: 'lkg-compare-more',            title: 'More',                               code: 'E.2', group: 'Comparing' },
  { skillId: 'lkg-compare-fewer',           title: 'Fewer',                              code: 'E.3', group: 'Comparing' },
  { skillId: 'lkg-compare-counting',        title: 'Fewer and more – compare by counting', code: 'E.4', group: 'Comparing' },
  { skillId: 'lkg-compare-mixed',           title: 'Compare in a mixed group',           code: 'E.5', group: 'Comparing' },
  // F – Positions
  { skillId: 'lkg-position-inside-outside', title: 'Inside and outside',                 code: 'F.1', group: 'Positions' },
  { skillId: 'lkg-position-above-below',    title: 'Above and below',                    code: 'F.2', group: 'Positions' },
  { skillId: 'lkg-position-beside-next',    title: 'Beside and next to',                 code: 'F.3', group: 'Positions' },
  { skillId: 'lkg-position-left-right',     title: 'Left and right',                     code: 'F.4', group: 'Positions' },
  { skillId: 'lkg-position-left-middle-right', title: 'Left, middle and right',          code: 'F.5', group: 'Positions' },
  { skillId: 'lkg-position-top-bottom',     title: 'Top and bottom',                     code: 'F.6', group: 'Positions' },
  { skillId: 'lkg-position-top-middle-bottom', title: 'Top, middle and bottom',          code: 'F.7', group: 'Positions' },
  // G – Classify
  { skillId: 'lkg-classify-same',           title: 'Same',                               code: 'G.1', group: 'Classify' },
  { skillId: 'lkg-classify-different',      title: 'Different',                          code: 'G.2', group: 'Classify' },
  { skillId: 'lkg-classify-same-different', title: 'Same and different',                 code: 'G.3', group: 'Classify' },
  { skillId: 'lkg-classify-shapes-color',   title: 'Classify shapes by colour',          code: 'G.4', group: 'Classify' },
  { skillId: 'lkg-classify-sort-color',     title: 'Classify and sort by colour',        code: 'G.5', group: 'Classify' },
  { skillId: 'lkg-classify-sort-shape',     title: 'Classify and sort by shape',         code: 'G.6', group: 'Classify' },
  // H – Patterns
  { skillId: 'lkg-patterns-color',          title: 'Colour patterns',                    code: 'H.1', group: 'Patterns' },
  { skillId: 'lkg-patterns-size',           title: 'Size patterns',                      code: 'H.2', group: 'Patterns' },
  { skillId: 'lkg-patterns-shape',          title: 'Shape patterns',                     code: 'H.3', group: 'Patterns' },
  { skillId: 'lkg-patterns-next',           title: 'What comes next?',                   code: 'H.4', group: 'Patterns' },
  // I – Size
  { skillId: 'lkg-size-long-short',         title: 'Long and short',                     code: 'I.1', group: 'Size' },
  { skillId: 'lkg-size-tall-short',         title: 'Tall and short',                     code: 'I.2', group: 'Size' },
  { skillId: 'lkg-size-wide-narrow',        title: 'Wide and narrow',                    code: 'I.3', group: 'Size' },
  { skillId: 'lkg-size-light-heavy',        title: 'Light and heavy',                    code: 'I.4', group: 'Size' },
  // J – Money
  { skillId: 'lkg-money-coin-values',       title: 'Coin values',                        code: 'J.1', group: 'Money' },
  { skillId: 'lkg-money-count-1rupee',      title: 'Count 1-rupee coins',                code: 'J.2', group: 'Money' },
];

// Auto-generate serpentine (zigzag) positions for all skills
const NODE_STEP_PX = 190;   // horizontal gap between level platforms
const PADDING_PX   = 170;   // left & right padding
const TOP_Y  = 54;          // upper travel lane (% of container)
const BOT_Y  = 67;          // lower travel lane (% of container)

const LKG_MATH_ROADMAP = LKG_MATH_SKILLS.map((skill, i) => {
  const totalWidth = PADDING_PX + LKG_MATH_SKILLS.length * NODE_STEP_PX + PADDING_PX;
  const xPx = PADDING_PX + i * NODE_STEP_PX;
  const xPct = ((xPx / totalWidth) * 100).toFixed(2) + '%';
  const yPct = (i % 2 === 0 ? BOT_Y : TOP_Y) + '%';
  return { ...skill, left: xPct, top: yPct, _totalWidthPx: totalWidth };
});

// Derive total canvas width from roadmap
const JOURNEY_CANVAS_WIDTH = PADDING_PX + LKG_MATH_SKILLS.length * NODE_STEP_PX + PADDING_PX;


// ── Helper: auto-position skills serpentine ────────────────────────────────
function buildRoadmap(skills) {
  const total = PADDING_PX + skills.length * NODE_STEP_PX + PADDING_PX;
  return skills.map((skill, i) => {
    const xPx = PADDING_PX + i * NODE_STEP_PX;
    const xPct = ((xPx / total) * 100).toFixed(2) + '%';
    const yPct = (60 + Math.sin(i * 0.86) * 8).toFixed(2) + '%';
    return { ...skill, left: xPct, top: yPct };
  });
}

function canvasWidth(skills) {
  return PADDING_PX + skills.length * NODE_STEP_PX + PADDING_PX;
}

// ── UKG Maths ─────────────────────────────────────────────────────────────
const UKG_MATH_SKILLS = [
  // A – Count to 3
  { skillId: 'ukg-count3-learn',              title: 'Learn to count to 3',                    code: 'A.1', group: 'Count to 3' },
  { skillId: 'ukg-count3-count',              title: 'Count to 3',                             code: 'A.2', group: 'Count to 3' },
  { skillId: 'ukg-count3-stickers',           title: 'Count using stickers – up to 3',         code: 'A.3', group: 'Count to 3' },
  { skillId: 'ukg-count3-ten-frame-count',    title: 'Count on ten frames – up to 3',          code: 'A.4', group: 'Count to 3' },
  { skillId: 'ukg-count3-ten-frame-show',     title: 'Show numbers on ten frames – up to 3',   code: 'A.5', group: 'Count to 3' },
  { skillId: 'ukg-count3-represent',          title: 'Represent numbers – up to 3',            code: 'A.6', group: 'Count to 3' },
  // B – Count to 5
  { skillId: 'ukg-count5-learn',              title: 'Learn to count to 5',                    code: 'B.1', group: 'Count to 5' },
  { skillId: 'ukg-count5-count',              title: 'Count to 5',                             code: 'B.2', group: 'Count to 5' },
  { skillId: 'ukg-count5-stickers',           title: 'Count using stickers – up to 5',         code: 'B.3', group: 'Count to 5' },
  { skillId: 'ukg-count5-ten-frame-count',    title: 'Count on ten frames – up to 5',          code: 'B.4', group: 'Count to 5' },
  { skillId: 'ukg-count5-ten-frame-show',     title: 'Show numbers on ten frames – up to 5',   code: 'B.5', group: 'Count to 5' },
  { skillId: 'ukg-count5-represent',          title: 'Represent numbers – up to 5',            code: 'B.6', group: 'Count to 5' },
  { skillId: 'ukg-count5-one-more',           title: 'One more – up to 5',                     code: 'B.7', group: 'Count to 5' },
  { skillId: 'ukg-count5-one-less',           title: 'One less – up to 5',                     code: 'B.8', group: 'Count to 5' },
  // C – Count to 10
  { skillId: 'ukg-count10-learn',             title: 'Learn to count to 10',                   code: 'C.1', group: 'Count to 10' },
  { skillId: 'ukg-count10-count',             title: 'Count to 10',                            code: 'C.2', group: 'Count to 10' },
  { skillId: 'ukg-count10-stickers',          title: 'Count using stickers – up to 10',        code: 'C.3', group: 'Count to 10' },
  { skillId: 'ukg-count10-ten-frame-count',   title: 'Count on ten frames – up to 10',         code: 'C.4', group: 'Count to 10' },
  { skillId: 'ukg-count10-ten-frame-show',    title: 'Show numbers on ten frames – up to 10',  code: 'C.5', group: 'Count to 10' },
  { skillId: 'ukg-count10-represent',         title: 'Represent numbers – up to 10',           code: 'C.6', group: 'Count to 10' },
  { skillId: 'ukg-count10-one-more',          title: 'One more – up to 10',                    code: 'C.7', group: 'Count to 10' },
  { skillId: 'ukg-count10-one-less',          title: 'One less – up to 10',                    code: 'C.8', group: 'Count to 10' },
  { skillId: 'ukg-count10-tally-marks',       title: 'Tally marks – up to 10',                 code: 'C.9', group: 'Count to 10' },
  { skillId: 'ukg-count10-number-line',       title: 'Number lines – up to 10',                code: 'C.10', group: 'Count to 10' },
  // D – Count to 20
  { skillId: 'ukg-count20-count',             title: 'Count to 20',                            code: 'D.1', group: 'Count to 20' },
  { skillId: 'ukg-count20-ten-frame-count',   title: 'Count on ten frames – up to 20',         code: 'D.2', group: 'Count to 20' },
  { skillId: 'ukg-count20-tally-marks',       title: 'Tally marks – up to 20',                 code: 'D.3', group: 'Count to 20' },
  { skillId: 'ukg-count20-number-line',       title: 'Number lines – up to 20',                code: 'D.4', group: 'Count to 20' },
  // E – Comparing
  { skillId: 'ukg-comparing-enough',          title: 'Are there enough?',                      code: 'E.1', group: 'Comparing' },
  { skillId: 'ukg-comparing-matching',        title: 'Compare by matching',                    code: 'E.2', group: 'Comparing' },
  { skillId: 'ukg-comparing-counting',        title: 'Compare by counting',                    code: 'E.3', group: 'Comparing' },
  { skillId: 'ukg-comparing-fewer-more-same', title: 'Fewer, more and same',                   code: 'E.4', group: 'Comparing' },
  { skillId: 'ukg-comparing-two-numbers',     title: 'Compare two numbers – up to 10',         code: 'E.5', group: 'Comparing' },
  // F – Patterns
  { skillId: 'ukg-patterns-colour',           title: 'Colour patterns',                        code: 'F.1', group: 'Patterns' },
  { skillId: 'ukg-patterns-size',             title: 'Size patterns',                          code: 'F.2', group: 'Patterns' },
  { skillId: 'ukg-patterns-shape',            title: 'Shape patterns',                         code: 'F.3', group: 'Patterns' },
  { skillId: 'ukg-patterns-complete',         title: 'Complete a pattern',                     code: 'F.4', group: 'Patterns' },
  // G – Positions
  { skillId: 'ukg-positions-inside-outside',  title: 'Inside and outside',                     code: 'G.1', group: 'Positions' },
  { skillId: 'ukg-positions-above-below',     title: 'Above and below',                        code: 'G.2', group: 'Positions' },
  { skillId: 'ukg-positions-beside-next-to',  title: 'Beside and next to',                     code: 'G.3', group: 'Positions' },
  { skillId: 'ukg-positions-left-middle-right', title: 'Left, middle and right',               code: 'G.4', group: 'Positions' },
  { skillId: 'ukg-positions-top-middle-bottom', title: 'Top, middle and bottom',               code: 'G.5', group: 'Positions' },
  // H – Addition up to 5
  { skillId: 'ukg-add5-pictures',             title: 'Add with pictures – up to 5',            code: 'H.1', group: 'Addition to 5' },
  { skillId: 'ukg-add5-sentences',            title: 'Addition sentences – up to 5',           code: 'H.2', group: 'Addition to 5' },
  { skillId: 'ukg-add5-word-problems',        title: 'Addition word problems – up to 5',       code: 'H.3', group: 'Addition to 5' },
  // I – Addition up to 10
  { skillId: 'ukg-add10-pictures',            title: 'Add with pictures – up to 10',           code: 'I.1', group: 'Addition to 10' },
  { skillId: 'ukg-add10-sentences',           title: 'Addition sentences – up to 10',          code: 'I.2', group: 'Addition to 10' },
  { skillId: 'ukg-add10-word-problems',       title: 'Addition word problems – up to 10',      code: 'I.3', group: 'Addition to 10' },
  // J – Subtraction up to 5
  { skillId: 'ukg-sub5-pictures',             title: 'Subtract with pictures – up to 5',       code: 'J.1', group: 'Subtraction to 5' },
  { skillId: 'ukg-sub5-sentences',            title: 'Subtraction sentences – up to 5',        code: 'J.2', group: 'Subtraction to 5' },
  { skillId: 'ukg-sub5-word-problems',        title: 'Subtraction word problems – up to 5',    code: 'J.3', group: 'Subtraction to 5' },
  // K – Subtraction up to 10
  { skillId: 'ukg-sub10-pictures',            title: 'Subtract with pictures – up to 10',      code: 'K.1', group: 'Subtraction to 10' },
  { skillId: 'ukg-sub10-sentences',           title: 'Subtraction sentences – up to 10',       code: 'K.2', group: 'Subtraction to 10' },
  { skillId: 'ukg-sub10-word-problems',       title: 'Subtraction word problems – up to 10',   code: 'K.3', group: 'Subtraction to 10' },
  // L – Classify
  { skillId: 'ukg-classify-same',             title: 'Same',                                   code: 'L.1', group: 'Classify' },
  { skillId: 'ukg-classify-different',        title: 'Different',                              code: 'L.2', group: 'Classify' },
  { skillId: 'ukg-classify-shapes-color',     title: 'Classify shapes by colour',              code: 'L.3', group: 'Classify' },
  { skillId: 'ukg-classify-sort-shape',       title: 'Classify and sort by shape',             code: 'L.4', group: 'Classify' },
  // M – Measurement
  { skillId: 'ukg-size-long-short',           title: 'Long and short',                         code: 'O.1', group: 'Measurement' },
  { skillId: 'ukg-size-tall-short',           title: 'Tall and short',                         code: 'O.2', group: 'Measurement' },
  { skillId: 'ukg-size-wide-narrow',          title: 'Wide and narrow',                        code: 'O.3', group: 'Measurement' },
  { skillId: 'ukg-size-light-heavy',          title: 'Light and heavy',                        code: 'O.4', group: 'Measurement' },
  // N – Money
  { skillId: 'ukg-money-coin-values',         title: 'Coin values',                            code: 'P.1', group: 'Money' },
  { skillId: 'ukg-money-count-1',             title: 'Count money – 1-rupee coins',            code: 'P.2', group: 'Money' },
  { skillId: 'ukg-money-count-1-2',           title: 'Count money – 1- and 2-rupee coins',     code: 'P.3', group: 'Money' },
];

// ── LKG English ────────────────────────────────────────────────────────────
const LKG_ENGLISH_SKILLS = [
  // A – Alphabet Recognition
  { skillId: 'lkg-eng-letter-recognition-upper', title: 'Letter recognition: uppercase (A–Z)',  code: 'S.1', group: 'Alphabet' },
  { skillId: 'lkg-eng-letter-recognition-lower', title: 'Letter recognition: lowercase (a–z)',  code: 'S.2', group: 'Alphabet' },
  { skillId: 'lkg-eng-match-capital-small',       title: 'Match capital and small letters',      code: 'S.3', group: 'Alphabet' },
  { skillId: 'lkg-eng-letter-to-phonics',         title: 'Match letters to their phonics sounds',code: 'S.4', group: 'Alphabet' },
  { skillId: 'lkg-eng-fill-missing-alphabet',     title: 'Fill in the missing alphabet letters', code: 'S.5', group: 'Alphabet' },
  { skillId: 'lkg-eng-find-odd-one-out',          title: 'Find the letter that is different',    code: 'S.6', group: 'Alphabet' },
  { skillId: 'lkg-eng-identify-colours',          title: 'Identify colours',                     code: 'S.7', group: 'Alphabet' },
  // T – Phonics
  { skillId: 'lkg-eng-phonics-begin-sound',       title: 'Beginning sound of a word',            code: 'T.1', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-rhyming',           title: 'Identify rhyming words',               code: 'T.2', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-word-family',       title: 'Word families',                        code: 'T.3', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-short-a',           title: 'Short vowel: A',                       code: 'T.4', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-short-e',           title: 'Short vowel: E',                       code: 'T.5', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-short-i',           title: 'Short vowel: I',                       code: 'T.6', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-short-o',           title: 'Short vowel: O',                       code: 'T.7', group: 'Phonics' },
  { skillId: 'lkg-eng-phonics-short-u',           title: 'Short vowel: U',                       code: 'T.8', group: 'Phonics' },
  // U – Vocabulary
  { skillId: 'lkg-eng-vocab-colours',             title: 'Colours',                              code: 'U.1', group: 'Vocabulary' },
  { skillId: 'lkg-eng-vocab-shapes',              title: 'Shapes',                               code: 'U.2', group: 'Vocabulary' },
  { skillId: 'lkg-eng-vocab-animals',             title: 'Animals',                              code: 'U.3', group: 'Vocabulary' },
  { skillId: 'lkg-eng-vocab-fruits',              title: 'Fruits and vegetables',                code: 'U.4', group: 'Vocabulary' },
  { skillId: 'lkg-eng-vocab-body-parts',          title: 'Body parts',                           code: 'U.5', group: 'Vocabulary' },
  { skillId: 'lkg-eng-vocab-action-words',        title: 'Action words',                         code: 'U.6', group: 'Vocabulary' },
];

// ── UKG English ────────────────────────────────────────────────────────────
const UKG_ENGLISH_SKILLS = [
  // A – Alphabet and Reading
  { skillId: 'ukg-eng-letter-uppercase',      title: 'Identify uppercase letters (A–Z)',         code: 'A.1', group: 'Alphabet' },
  { skillId: 'ukg-eng-letter-lowercase',      title: 'Identify lowercase letters (a–z)',         code: 'A.2', group: 'Alphabet' },
  { skillId: 'ukg-eng-match-upper-lower',     title: 'Match uppercase and lowercase letters',    code: 'A.3', group: 'Alphabet' },
  { skillId: 'ukg-eng-alphabet-order',        title: 'Alphabetical order',                       code: 'A.4', group: 'Alphabet' },
  // B – Phonics
  { skillId: 'ukg-eng-phonics-begin',         title: 'Beginning sounds',                         code: 'B.1', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-ending',        title: 'Ending sounds',                            code: 'B.2', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-rhyming',       title: 'Rhyming words',                            code: 'B.3', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-cvc-read',      title: 'Read CVC words',                           code: 'B.4', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-cvc-blend',     title: 'Blend CVC sounds',                         code: 'B.5', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-short-a',       title: 'Short vowel A words',                      code: 'B.6', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-short-e',       title: 'Short vowel E words',                      code: 'B.7', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-short-i',       title: 'Short vowel I words',                      code: 'B.8', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-short-o',       title: 'Short vowel O words',                      code: 'B.9', group: 'Phonics' },
  { skillId: 'ukg-eng-phonics-short-u',       title: 'Short vowel U words',                      code: 'B.10', group: 'Phonics' },
  // C – Words
  { skillId: 'ukg-eng-sight-words-set1',      title: 'Sight words – Set 1',                      code: 'C.1', group: 'Sight Words' },
  { skillId: 'ukg-eng-sight-words-set2',      title: 'Sight words – Set 2',                      code: 'C.2', group: 'Sight Words' },
  { skillId: 'ukg-eng-vocab-colours',         title: 'Colour words',                             code: 'C.3', group: 'Sight Words' },
  { skillId: 'ukg-eng-vocab-number-words',    title: 'Number words (one to ten)',                code: 'C.4', group: 'Sight Words' },
  // D – Grammar
  { skillId: 'ukg-eng-nouns',                 title: 'Nouns – people, places and things',        code: 'D.1', group: 'Grammar' },
  { skillId: 'ukg-eng-action-verbs',          title: 'Action verbs',                             code: 'D.2', group: 'Grammar' },
  { skillId: 'ukg-eng-describing-words',      title: 'Describing words (adjectives)',            code: 'D.3', group: 'Grammar' },
  { skillId: 'ukg-eng-articles',              title: 'Articles: a and an',                       code: 'D.4', group: 'Grammar' },
  { skillId: 'ukg-eng-pronouns',              title: 'Personal pronouns',                        code: 'D.5', group: 'Grammar' },
  { skillId: 'ukg-eng-prepositions',          title: 'Prepositions',                             code: 'D.6', group: 'Grammar' },
  // E – Sentences
  { skillId: 'ukg-eng-sentence-complete',     title: 'Complete the sentence',                    code: 'E.1', group: 'Sentences' },
  { skillId: 'ukg-eng-sentence-fill-blank',   title: 'Fill in the blank',                        code: 'E.2', group: 'Sentences' },
  { skillId: 'ukg-eng-yes-no-questions',      title: 'Yes or No questions',                      code: 'E.3', group: 'Sentences' },
];

// ── Curriculum lookup table ────────────────────────────────────────────────
const CURRICULUM_MAP = {
  'LKG-math':    { label: 'LKG Maths',    emoji: '🔢', topic: 'lkg',                  subject: 'math',    skills: LKG_MATH_SKILLS },
  'LKG-english': { label: 'LKG English',  emoji: '📖', topic: 'lkg-english',           subject: 'english', skills: LKG_ENGLISH_SKILLS },
  'UKG-math':    { label: 'UKG Maths',    emoji: '🧮', topic: 'ukg-numbers-counting',  subject: 'math',    skills: UKG_MATH_SKILLS },
  'UKG-english': { label: 'UKG English',  emoji: '✏️', topic: 'ukg-english',           subject: 'english', skills: UKG_ENGLISH_SKILLS },
};

const EARLY_YEAR_GRADES = ['Nursery', 'LKG', 'UKG'];
const CURRICULUM_GRADE_MAP = {
  'LKG-math': 'LKG',
  'LKG-english': 'LKG',
  'UKG-math': 'UKG',
  'UKG-english': 'UKG',
};

function getCurriculumForGrade(nextGrade, fallbackKey = 'LKG-math') {
  const currentSubject = CURRICULUM_MAP[fallbackKey]?.subject || 'math';
  const nextKey = `${nextGrade}-${currentSubject}`;
  if (CURRICULUM_MAP[nextKey]) return nextKey;
  return Object.keys(CURRICULUM_MAP).find(key => key.startsWith(`${nextGrade}-`)) || fallbackKey;
}

const SHOW_STUDENT_TEST_TOOLS = process.env.NEXT_PUBLIC_HIDE_STUDENT_TEST_TOOLS !== 'true';

function getSkillIcon(group = '') {
  const normalized = group.toLowerCase();
  if (normalized.includes('shape')) return '◆';
  if (normalized.includes('count')) return '●';
  if (normalized.includes('compare')) return '↔';
  if (normalized.includes('pattern')) return '▦';
  if (normalized.includes('position')) return '↕';
  if (normalized.includes('money')) return '₹';
  if (normalized.includes('phonics')) return 'Aa';
  if (normalized.includes('alphabet')) return 'A';
  if (normalized.includes('vocab')) return '★';
  return '✓';
}

export default function StudentDashboardPortal() {
  const [studentName, setStudentName] = useState('Alex');
  const [userId, setUserId] = useState('');
  const [grade, setGrade] = useState(''); // Initialize to empty string
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardMode, setDashboardMode] = useState('journey'); // 'grid' or 'journey'
  const [curriculumKey, setCurriculumKey] = useState('LKG-math'); // active curriculum for journey map
  const activeNodeRef = useRef(null);
  const journeyContainerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const dashboardAudioCacheRef = useRef(new Map());

  // Hydrate states from localStorage on client mount
  useEffect(() => {
    const savedGrade = window.localStorage.getItem('student_dashboard_grade');
    const savedMode = window.localStorage.getItem('student_dashboard_mode');
    const savedCurriculum = window.localStorage.getItem('student_dashboard_curriculum');
    if (savedGrade) setGrade(savedGrade);
    if (savedMode) setDashboardMode(savedMode);
    if (savedCurriculum && CURRICULUM_MAP[savedCurriculum]) {
      setCurriculumKey(savedCurriculum);
      setGrade(CURRICULUM_GRADE_MAP[savedCurriculum] || savedGrade || 'LKG');
    }
  }, []);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        const payload = await res.json();
        if (payload.success && payload.session?.userId) {
          setUserId(payload.session.userId);
          setStudentName(payload.session.name || payload.session.userId);
          if (payload.session.grade) {
            setGrade(payload.session.grade);
            if (EARLY_YEAR_GRADES.includes(payload.session.grade)) {
              setCurriculumKey(prevKey => getCurriculumForGrade(payload.session.grade, prevKey));
            }
          }
        } else {
          // Fallback if not authenticated
          setUserId('ryan_p');
          setStudentName('Alex');
          setGrade(prev => prev || 'LKG');
        }
      } catch (err) {
        console.warn('Failed to load session in student dashboard:', err);
        setUserId('ryan_p');
        setStudentName('Alex');
        setGrade(prev => prev || 'LKG');
      }
    }
    loadSession();
  }, []);

  // Save states to localStorage when changed
  useEffect(() => {
    window.localStorage.setItem('student_dashboard_grade', grade);
  }, [grade]);

  useEffect(() => {
    window.localStorage.setItem('student_dashboard_mode', dashboardMode);
  }, [dashboardMode]);

  useEffect(() => {
    window.localStorage.setItem('student_dashboard_curriculum', curriculumKey);
  }, [curriculumKey]);

  useEffect(() => {
    if (!userId || !grade) return;

    let active = true;
    setLoading(true);

    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/student?userId=${userId}&grade=${encodeURIComponent(grade)}`);
        const payload = await res.json();
        
        if (!active) return;

        const defaultData = {
          kpis: {
            smartScore: 1380,
            accuracyPercent: 82,
            practiceMinutes: 45,
            streakDays: 9,
            dailyGoalCompletion: 80,
            learningLevel: 'Active Learner',
            badgesEarned: ['First Step', 'Sound Master', '3-Day Streak']
          },
          recommendations: {
            nextBestSkill: 'Represent Place Value via Blocks',
            recommendedPractice: 'Interactive Math Grid Practice - Level B'
          },
          charts: {
            subjectProgress: [
              { subject: 'Mathematics', completion: 65, accuracy: 82 },
              { subject: 'English', completion: 75, accuracy: 80 },
              { subject: 'Science', completion: 40, accuracy: 70 }
            ]
          }
        };

        if (payload.success) {
          setData(payload);
        } else {
          setData(defaultData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [grade, userId]);


  const simulateLevelUnlock = () => {
    if (!data) return;
    const currentMastery = data.skillsMastery || {};
    const activeCurriculumSkills = CURRICULUM_MAP[curriculumKey]?.skills || LKG_MATH_SKILLS;
    const nextSkillToUnlock = activeCurriculumSkills.find(skill => {
      const score = currentMastery[skill.skillId]?.score || 0;
      return score < 80;
    });
    if (nextSkillToUnlock) {
      const updatedMastery = {
        ...currentMastery,
        [nextSkillToUnlock.skillId]: { score: 90, state: 'Mastered' }
      };
      setData({
        ...data,
        skillsMastery: updatedMastery
      });
      triggerAudioGuidance(`Unlocked next level! ${nextSkillToUnlock.title} is now completed!`);
    } else {
      triggerAudioGuidance("All lessons on the roadmap are completed!");
    }
  };

  const playDashboardAudio = async (audioUrl) => {
    if (!audioUrl || typeof window === 'undefined') return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }

    const player = audioPlayerRef.current;
    player.pause();
    player.currentTime = 0;
    player.src = audioUrl;
    player.preload = 'auto';
    await player.play();
  };

  const triggerAudioGuidance = async (text, voice = 'gemini:Puck') => {
    const spokenText = String(text || '').trim();
    if (!spokenText) return;

    const cacheKey = `${voice}:${spokenText}`;
    const cachedUrl = dashboardAudioCacheRef.current.get(cacheKey);
    if (cachedUrl) {
      try {
        await playDashboardAudio(cachedUrl);
      } catch (error) {
        console.warn('Dashboard cached audio playback failed:', error);
      }
      return;
    }

    try {
      const response = await fetch('/api/student/dashboard-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, voice }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.audioUrl) {
        throw new Error(result.error || 'Dashboard TTS failed.');
      }
      dashboardAudioCacheRef.current.set(cacheKey, result.audioUrl);
      await playDashboardAudio(result.audioUrl);
    } catch (error) {
      console.warn('Dashboard Gemini TTS failed:', error);
      alert(`Listen: ${spokenText}`);
    }
  };

  const isEarlyYears = EARLY_YEAR_GRADES.includes(grade);

  // Active curriculum config
  const activeCurriculum = CURRICULUM_MAP[curriculumKey] || CURRICULUM_MAP['LKG-math'];
  const activeRoadmap = useMemo(() => buildRoadmap(activeCurriculum.skills), [activeCurriculum]);
  const activeCanvasWidth = useMemo(() => canvasWidth(activeCurriculum.skills), [activeCurriculum]);

  // Calculate dynamic roadmap states for the selected curriculum
  const skillsMastery = data?.skillsMastery || {};
  let activeFound = false;
  const roadmapNodes = activeRoadmap.map((skill, index) => {
    const mastery = skillsMastery[skill.skillId] || {};
    const score = mastery.score !== undefined ? mastery.score : 0;
    let isUnlocked = false;
    if (index === 0) {
      isUnlocked = true;
    } else {
      const prevSkill = activeRoadmap[index - 1];
      const prevMastery = skillsMastery[prevSkill.skillId] || {};
      const prevScore = prevMastery.score !== undefined ? prevMastery.score : 0;
      isUnlocked = prevScore >= 80;
    }
    const isCompleted = isUnlocked && score >= 80;
    let isActive = false;
    if (isUnlocked && !isCompleted && !activeFound) {
      isActive = true;
      activeFound = true;
    }
    const isLocked = !isUnlocked;
    return { ...skill, score, isUnlocked, isCompleted, isActive, isLocked };
  });

  const activeNode = roadmapNodes.find(node => node.isActive) || roadmapNodes.find(node => node.isUnlocked);
  const completedCount = roadmapNodes.filter(node => node.isCompleted).length;
  const progressPercent = roadmapNodes.length ? Math.round((completedCount / roadmapNodes.length) * 100) : 0;

  useEffect(() => {
    if (dashboardMode !== 'journey' || !activeNodeRef.current || !journeyContainerRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      activeNodeRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dashboardMode, curriculumKey, activeNode?.skillId, loading]);

  const handleGradeChange = (nextGrade) => {
    setGrade(nextGrade);
    if (EARLY_YEAR_GRADES.includes(nextGrade)) {
      setDashboardMode('journey');
      setCurriculumKey(prevKey => getCurriculumForGrade(nextGrade, prevKey));
    } else {
      setDashboardMode('grid');
    }
  };

  const handleCurriculumChange = (key) => {
    setCurriculumKey(key);
    setGrade(CURRICULUM_GRADE_MAP[key] || grade);
    setDashboardMode('journey');
  };

  return (
    <div className={`${styles.studentContainer} ${isEarlyYears ? styles.kinderTheme : ''} ${(isEarlyYears && dashboardMode === 'journey') ? styles.fullscreenMode : ''}`}>
      
      {/* 1. Header Row */}
      <header className={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <h1>
            {isEarlyYears ? '🎈 Welcome to KlassChamp! 🎈' : 'My Student Dashboard'}
          </h1>
          {!isEarlyYears && (
            <nav className={styles.dashboardNav}>
              <span className={styles.navTabActive}>My Path</span>
              <Link href="/grades" className={styles.navTab}>Explore Curriculum</Link>
            </nav>
          )}
        </div>
        <div>
          <select value={grade} onChange={(e) => handleGradeChange(e.target.value)} className={styles.gradeSelector}>
            <option value="LKG">Early Years (LKG)</option>
            <option value="UKG">Early Years (UKG)</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 9">Grade 9</option>
          </select>
        </div>
      </header>


      {loading || !data ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <strong>Opening your learning path...</strong>
        </div>
      ) : (
        <>
          {/* ========================================================
              A. EARLY YEARS VIEW (Nursery, LKG, UKG)
              ======================================================== */}
          {isEarlyYears ? (
            <>
              {/* Mascot Bubble Helper */}
              <section className={styles.mascotPanel}>
                <span className={styles.mascotAvatar}>🦁</span>
                <div className={styles.bubbleChat}>
                  <h3>Leo the Lion says:</h3>
                  <p>
                    "Hello friend! Let's play and count numbers today! Click the big buttons below to start!"
                    <button
                      onClick={() => triggerAudioGuidance("Hello friend! Let's play and count numbers today! Click the big buttons below to start!")}
                      className={styles.btnAudio}
                      title="Listen to mascot instructions"
                    >
                      🔊
                    </button>
                  </p>
                </div>
              </section>

              {/* View Mode Selection Toggles */}
              <div className={styles.viewModeToggleRow}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${dashboardMode === 'grid' ? styles.activeToggle : ''}`}
                  onClick={() => setDashboardMode('grid')}
                >
                  🗂️ Card Grid View
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${dashboardMode === 'journey' ? styles.activeToggle : ''}`}
                  onClick={() => setDashboardMode('journey')}
                >
                  🗺️ Journey Path View
                </button>
              </div>

              {dashboardMode === 'journey' ? (
                /* ── Full-Curriculum Journey Map ────────────────────────────── */
                <div className={styles.journeyContainer}>
                  <div className={styles.playerHud}>
                    <span className={styles.playerAvatar}>👦</span>
                    <span>
                      <strong>{studentName}</strong>
                      <small>Level 1</small>
                    </span>
                  </div>

                  <div className={styles.livesHud}>
                    <span>❤️</span>
                    <strong>3</strong>
                    <small>Lives</small>
                    <span className={styles.hudDivider} />
                    <span className={styles.notificationBell}>🔔<b>2</b></span>
                  </div>

                  {/* Floating Overlay Header */}
                  <div className={styles.floatingPathHeader}>
                    {/* Row 1: Subject selector pills */}
                    <div className={styles.curriculumPillRow}>
                      {Object.entries(CURRICULUM_MAP).map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleCurriculumChange(key)}
                            className={`${styles.curriculumPill} ${curriculumKey === key ? styles.activeCurriculumPill : ''}`}
                            data-subject={cfg.subject}
                        >
                          {cfg.emoji} {cfg.label}
                          <span>({cfg.skills.length} lessons)</span>
                        </button>
                      ))}
                    </div>

                    <div className={styles.journeyProgressStrip} aria-label={`${progressPercent}% of this path completed`}>
                        <span>Your progress</span>
                        <div className={styles.journeyProgressTrack}>
                          <div className={styles.journeyProgressFill} style={{ width: `${progressPercent}%` }} />
                        </div>
                        <strong>⭐ {data.kpis.smartScore}</strong>
                        <span className={styles.levelPill}>🏆 Bronze 1</span>
                      </div>

                    {/* Row 2: Action buttons */}
                    <div className={styles.floatingActionRow}>
                        {SHOW_STUDENT_TEST_TOOLS ? (
                          <button
                            type="button"
                            className={`${styles.floatingToggleBtn} ${styles.testUnlockBtn}`}
                            onClick={simulateLevelUnlock}
                          >
                            ⭐ Unlock Next
                          </button>
                        ) : null}
                      <button
                        type="button"
                        className={styles.floatingToggleBtn}
                        onClick={() => setDashboardMode('grid')}
                      >
                        🗂️ Card Grid
                      </button>
                      <Link href="/grades" className={styles.floatingToggleBtn} style={{ textDecoration: 'none' }}>
                        🏠 Exit
                      </Link>
                    </div>
                  </div>

                  {/* Canvas — wide enough for all lessons */}
                    <div className={styles.journeyScrollArea} ref={journeyContainerRef}>
	                  <div className={styles.journeyPath} style={{ width: activeCanvasWidth + 'px' }}>

	                    {/* Smooth serpentine adventure trail drawn under the level islands. */}
	                    <svg className={styles.journeySvgPath} viewBox={`0 0 ${activeCanvasWidth} 480`} preserveAspectRatio="none">
	                      {/* Build points: a gentle platform path across the jungle scene. */}
	                      <polyline
                          className={styles.trailShadow}
	                        points={roadmapNodes.map((node, i) => {
	                          const xPx = PADDING_PX + i * NODE_STEP_PX;
	                          const yPx = (60 + Math.sin(i * 0.86) * 8) / 100 * 480;
	                          return `${xPx},${yPx}`;
	                        }).join(' ')}
	                        fill="none"
	                        stroke="#3f2c1d"
	                        strokeWidth="36"
	                        strokeLinecap="round"
	                        strokeLinejoin="round"
	                      />
	                      <polyline
                          className={styles.trailMain}
	                        points={roadmapNodes.map((node, i) => {
	                          const xPx = PADDING_PX + i * NODE_STEP_PX;
	                          const yPx = (60 + Math.sin(i * 0.86) * 8) / 100 * 480;
	                          return `${xPx},${yPx}`;
	                        }).join(' ')}
	                        fill="none"
	                        stroke="#b98a55"
	                        strokeWidth="24"
	                        strokeLinecap="round"
	                        strokeLinejoin="round"
	                      />
	                      <polyline
                          className={styles.trailHighlight}
	                        points={roadmapNodes.map((node, i) => {
	                          const xPx = PADDING_PX + i * NODE_STEP_PX;
	                          const yPx = (60 + Math.sin(i * 0.86) * 8) / 100 * 480;
	                          return `${xPx},${yPx - 6}`;
	                        }).join(' ')}
	                        fill="none"
	                        stroke="rgba(255,255,255,0.45)"
	                        strokeWidth="8"
	                        strokeLinecap="round"
	                        strokeLinejoin="round"
	                      />
	                    </svg>

                    {/* Render all nodes */}
                    {roadmapNodes.map((node, idx) => {
                      const skillTitle = node.title;
                      const practiceHref = `/practice?subject=${activeCurriculum.subject}&topic=${activeCurriculum.topic}&skill=${node.skillId}`;

                      // Group banner: show topic name only for first node in each group
                      const isGroupStart = idx === 0 || roadmapNodes[idx - 1].group !== node.group;
                      const groupBanner = isGroupStart ? (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '8px',
                          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                          color: '#d1fae5',
                          fontWeight: 900,
                          fontSize: '0.65rem',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          whiteSpace: 'nowrap',
                          border: '2px solid #6ee7b7',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          zIndex: 6,
                        }}>
                          {node.group}
                        </div>
                      ) : null;

                      if (node.isCompleted) {
                        return (
	                          <div key={node.skillId} className={styles.journeyNodeWrapper} style={{ left: node.left, top: node.top }}>
                            {groupBanner}
	                            <Link
	                              href={practiceHref}
	                              className={`${styles.journeyNode} ${styles.completedNode}`}
	                              onClick={() => triggerAudioGuidance(`You completed ${skillTitle}! Great job!`)}
	                            >
	                              <span className={styles.nodeIcon}>{getSkillIcon(node.group)}</span>
	                              <span className={`${styles.nodeStatusBadge} ${styles.starBadge}`}>⭐</span>
	                            </Link>
                            <span className={styles.nodeLabel}>{node.code}<br/>{skillTitle}</span>
                          </div>
                        );
                      }

                      if (node.isActive) {
                        return (
	                          <div
                              key={node.skillId}
                              ref={node.skillId === activeNode?.skillId ? activeNodeRef : null}
                              className={styles.journeyNodeWrapper}
                              style={{ left: node.left, top: node.top }}
                            >
                            {groupBanner}
	                            <Link
	                              href={practiceHref}
	                              className={`${styles.journeyNode} ${styles.activeNode}`}
	                              onClick={() => triggerAudioGuidance(`Let's practice ${skillTitle}!`)}
	                            >
	                              <span className={styles.nodeIcon}>{idx + 1}</span>
	                              <span
	                                className={`${styles.nodeStatusBadge} ${styles.activeBadge}`}
	                              >
	                                Start
	                              </span>
                            </Link>
                            <span className={styles.nodeLabel}>{node.code}<br/>{skillTitle}</span>

                            {/* Leo mascot under the active node */}
                            <div className={styles.pathMascot}>
                              <div className={styles.pathMascotBubble}>
                                Let&apos;s play here! 🦁🤠
                              </div>
                              <span className={styles.pathMascotAvatar}>🦁🤠</span>
		                  </div>
	                    </div>
                        );
                      }

                      // Locked node
                      return (
                        <div key={node.skillId} className={styles.journeyNodeWrapper} style={{ left: node.left, top: node.top }}>
                          {groupBanner}
	                          <button
                              type="button"
	                            className={`${styles.journeyNode} ${styles.lockedNode}`}
	                            onClick={() => triggerAudioGuidance('This lesson is locked. Complete the previous lesson with 80% or more to unlock it!')}
                              aria-label={`${skillTitle} is locked. Complete the previous lesson to unlock it.`}
	                          >
	                            <span className={styles.nodeIcon}>{getSkillIcon(node.group)}</span>
	                            <span className={`${styles.nodeStatusBadge} ${styles.lockBadge}`}>🔒</span>
	                          </button>
                          <span className={styles.nodeLabel}>{node.code}<br/>{skillTitle}</span>
                        </div>
                      );
                    })}

	                  </div>
                    </div>
                    <div className={styles.journeyMascotPanel}>
                      <span className={styles.journeyMascot}>🦁</span>
                      <div className={styles.journeySpeechBubble}>
                        <strong>Great job!</strong>
                        <span>Keep going, you&apos;re doing awesome! ✨</span>
                      </div>
                    </div>

                    <div className={styles.journeyToolDock}>
                      <button type="button" onClick={() => triggerAudioGuidance('Step by step solutions help you learn one move at a time.')}>
                        <span>📋</span>
                        <strong>Step-by-Step</strong>
                        <small>Solutions</small>
                      </button>
                      <button type="button" onClick={() => triggerAudioGuidance('Here is a hint for your current quest.')}>
                        <span>💡</span>
                        <strong>Hints</strong>
                      </button>
                      <button type="button" onClick={() => triggerAudioGuidance(activeNode ? `This quest is ${activeNode.title}.` : 'Pick a quest to learn more.')}>
                        <span>💬</span>
                        <strong>Explain</strong>
                      </button>
                    </div>
	                </div>

              ) : (
                /* Large Emojis Action Cards (Standard Grid) */
                <div className={styles.kinderGrid}>
                  <Link href="/practice?subject=math&topic=ukg-numbers-counting&skill=ukg-count3-count" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.kinderCard} style={{ borderLeft: '6px solid var(--color-success)' }}>
                      <div className={styles.kinderCardIcon}>🧮</div>
                      <h4 className={styles.kinderCardTitle}>Number Counting</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Count stars, fruits, and shapes!</p>
                    </div>
                  </Link>

                  <Link href="/practice?subject=english&topic=english-ukg&skill=ukg-eng-phonics-short-a" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.kinderCard} style={{ borderLeft: '6px solid var(--color-primary)' }}>
                      <div className={styles.kinderCardIcon}>🗣️</div>
                      <h4 className={styles.kinderCardTitle}>Phonics Sounds</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Match words starting with identical letters!</p>
                    </div>
                  </Link>


                  <div className={styles.kinderCard} style={{ borderLeft: '6px solid var(--color-warning)' }} onClick={() => triggerAudioGuidance("Great job! You earned three stars today!")}>
                    <div className={styles.kinderCardIcon}>⭐</div>
                    <h4 className={styles.kinderCardTitle}>My Star Count</h4>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-warning)' }}>
                      {data.kpis.streakDays} Stars Earned!
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ========================================================
                  B. PRIMARY & SECONDARY VIEW (Grades 1–10)
                  ======================================================== */}
              
              {/* Standard KPIs Grid */}
              <div className={styles.standardGrid}>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>SmartScore / XP</span>
                  <span className={styles.kpiValue} style={{ color: 'var(--color-primary)' }}>{data.kpis.smartScore}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level: {data.kpis.learningLevel}</span>
                </div>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>Accuracy Rate</span>
                  <span className={styles.kpiValue} style={{ color: 'var(--color-success)' }}>{data.kpis.accuracyPercent}%</span>
                </div>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>Practice Streak</span>
                  <span className={styles.kpiValue} style={{ color: 'var(--color-warning)' }}>🔥 {data.kpis.streakDays} Days</span>
                </div>
                <div className={styles.glassCard}>
                  <span className={styles.kpiLabel}>Practice Minutes</span>
                  <span className={styles.kpiValue}>{data.kpis.practiceMinutes}m</span>
                </div>
              </div>

              {/* Journey paths & Recommendations */}
              <div className={styles.standardGrid}>
                
                {/* Renders Next skill recommendation */}
                <div className={styles.glassCard} style={{ borderLeft: '4px solid var(--color-success)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💡 Recommended Practice Skill</h4>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{data.recommendations?.nextBestSkill}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                    Recommended next step for your math curriculum.
                  </p>
                  
                  <Link href="/practice?subject=math&topic=dynamic-templetes&skill=place-value-word-to-digits-multi-input" className={styles.btn} style={{ width: 'fit-content', marginTop: '0.5rem', textDecoration: 'none', textAlign: 'center' }}>
                    🚀 Start Practice
                  </Link>
                </div>

                {/* Curriculum Directory Card */}
                <div className={styles.glassCard} style={{ borderLeft: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📚 Curriculum Directory</h4>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Explore All Grades</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                    Practice math, English, and science skills from Kindergarten to Grade 10.
                  </p>
                  
                  <Link href="/grades" className={styles.btnSecondary} style={{ width: 'fit-content', marginTop: '0.5rem', textDecoration: 'none', textAlign: 'center' }}>
                    🔍 Browse Topics
                  </Link>
                </div>

                {/* Badges Earned */}
                <div className={styles.glassCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏆 Unlocked Badges</h4>
                  <div className={styles.badgeShelf}>
                    {data.kpis.badgesEarned?.map((badge, idx) => (
                      <span
                        key={idx}
                        className={styles.badgeIcon}
                        title={badge}
                        onClick={() => triggerAudioGuidance(`You unlocked the ${badge} badge! Good work!`)}
                      >
                        {idx === 0 ? '🦁' : idx === 1 ? '🌟' : '🚀'}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Subject completion bars */}
              <section className={styles.glassCard} style={{ width: '100%' }}>
                <h4 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📂 Subject Performance Overview</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.charts.subjectProgress?.map(sub => (
                    <div key={sub.subject} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span>{sub.subject}</span>
                        <span>{sub.completion}% Completed ({sub.accuracy}% Accuracy)</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${sub.completion}%`,
                            backgroundColor: sub.subject.includes('Math') ? 'var(--color-primary)' : 'var(--color-success)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}

    </div>
  );
}
