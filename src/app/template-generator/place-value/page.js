'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const PLACE_VALUE_PRESETS = [
  {
    name: '🧱 Match Number to Place Value Blocks',
    title: 'Match Number to Place Value Blocks',
    subject: 'math',
    topic: 'place-value',
    grade: '1',
    blueprint: 'Look at the place value blocks. What number is shown?\n[[blank1]]',
    solution: 'Step 1: Count the tens (rods): {{tens}} tens.\nStep 2: Count the ones (units): {{ones}} ones.\nStep 3: Combine them: {{tens}}0 + {{ones}} = {= tens * 10 + ones =}!',
    placeholders: {
      tens: '1-9',
      ones: '0-9'
    },
    visualComponent: 'BaseTenBlocks',
    visualProps: {
      thousands: '0',
      hundreds: '0',
      tens: 'tens',
      ones: 'ones'
    }
  },
  {
    name: '📊 Understand Tens and Ones (Chart)',
    title: 'Place Value Chart Identification',
    subject: 'math',
    topic: 'place-value',
    grade: '1',
    blueprint: 'Look at the place value chart. How many tens and ones are there?\nThere are {{tens}} tens and {{ones}} ones.\nWhat number does this make?\n[[blank1]]',
    solution: 'Step 1: The tens column shows {{tens}}.\nStep 2: The ones column shows {{ones}}.\nStep 3: This represents {= tens * 10 + ones =}!',
    placeholders: {
      tens: '1-9',
      ones: '0-9'
    },
    visualComponent: 'PlaceValue',
    visualProps: {
      thousands: '0',
      hundreds: '0',
      tens: 'tens',
      ones: 'ones',
      showChart: 'true'
    }
  },
  {
    name: '🖼️ Identify base-ten blocks (MCQ - 4 Digits)',
    title: 'Identify base-ten blocks (MCQ)',
    subject: 'math',
    topic: 'place-value',
    grade: '1',
    optionsType: 'visual_choice',
    layoutConfig: {
      columns: 1
    },
    blueprint: 'Which place-value model shows {{count}}?',
    solution: 'Step 1: The target number is {{count}}.\nStep 2: Look at the options and find the option that shows {= Math.floor(count / 1000) =} thousands, {= Math.floor((count % 1000) / 100) =} hundreds, {= Math.floor((count % 100) / 10) =} tens, and {= count % 10 =} ones.',
    placeholders: {
      count: '2939-2939'
    },
    options: [
      { label: '{= drawBaseTenBlocks(Math.floor((count % 100) / 10), count % 10, Math.floor((count % 1000) / 100), Math.floor(count / 1000), \'orange\') =}', isCorrect: true },
      { label: '{= drawBaseTenBlocks(Math.floor((count % 100) / 10), count % 10 + 1, Math.floor((count % 1000) / 100), Math.floor(count / 1000), \'purple\') =}', isCorrect: false },
      { label: '{= drawBaseTenBlocks(Math.floor((count % 100) / 10) + 1, count % 10, Math.floor((count % 1000) / 100), Math.floor(count / 1000), \'blue\') =}', isCorrect: false },
      { label: '{= drawBaseTenBlocks(Math.floor((count % 100) / 10), count % 10, Math.floor((count % 1000) / 100) + 1, Math.floor(count / 1000), \'green\') =}', isCorrect: false }
    ],
    visualComponent: 'none',
    visualProps: {}
  },
  {
    name: '📝 Decompose Numbers into Tens & Ones',
    title: 'Decompose Numbers into Tens & Ones',
    subject: 'math',
    topic: 'place-value',
    grade: '1',
    optionsType: 'fill_blank',
    blueprint: '{= tens * 10 + ones =} = [[blank1]] tens + [[blank2]] ones',
    solution: "<!-- {= tens =} {= ones =} -->\nRemember the place values:\n\n| tens | ones |\n| :---: | :---: |\n| {= tens =} | {= ones =} |\n\n{= tens * 10 + ones =} = {= tens =} {= tens === 1 ? 'ten' : 'tens' =} + {= ones =} {= ones === 1 ? 'one' : 'ones' =}",
    placeholders: {
      tens: '1-9',
      ones: '0-9'
    },
    visualComponent: 'none',
    visualProps: {}
  },
  {
    name: '🔍 Value of Underlined Digit (MCQ)',
    title: 'Value of Underlined Digit',
    subject: 'math',
    topic: 'place-value',
    grade: '1',
    optionsType: 'mcq',
    layoutConfig: {
      columns: 2
    },
    blueprint: "What is the value of the underlined digit?\n\n# {= underlinePos === 'tens' ? '<u>' + t + '</u>' + o : t + '<u>' + o + '</u>' =}",
    solution: "Write the number in a place-value chart:\n\n| tens | ones |\n| :---: | :---: |\n| {= underlinePos === 'tens' ? '<u>' + t + '</u>' : String(t) =} | {= underlinePos === 'ones' ? '<u>' + o + '</u>' : String(o) =} |\n\nThe underlined digit is the {= underlinePos === 'tens' ? t : o =} in the {= underlinePos =} place.\n\nIt is worth {= underlinePos === 'tens' ? t + ' tens' : o + ' ones' =}. Its value is **{= underlinePos === 'tens' ? t * 10 : o =}**.",
    placeholders: {
      t: '1-9',
      o: '0-9',
      underlinePos: 'tens, ones'
    },
    options: [
      { label: "{= underlinePos === 'tens' ? t * 10 : o =}", isCorrect: true },
      { label: "{= underlinePos === 'tens' ? t : (o === 0 ? 10 : o * 10) =}", isCorrect: false }
    ],
    visualComponent: 'none',
    visualProps: {}
  },
  {
    name: '🔄 Regrouping Tens and Ones',
    title: 'Regrouping Tens & Ones',
    subject: 'math',
    topic: 'place-value',
    grade: '1',
    optionsType: 'fill_blank',
    blueprint: 'Regroup. Write a number from 0 to 9 in each box:\n\n{{t1}} tens + {{o1}} ones = [[blank1]] tens + [[blank2]] ones',
    solution: "<!-- {= t1 + Math.floor(o1 / 10) =} {= o1 % 10 =} -->\nRegroup the ones:\n{{t1}} tens + **{{o1}} ones** = {{t1}} tens + {= Math.floor(o1 / 10) =} {= Math.floor(o1 / 10) === 1 ? 'ten' : 'tens' =} + {= o1 % 10 =} ones\n\nCount all the tens together:\n**{{t1}} tens + {= Math.floor(o1 / 10) =} {= Math.floor(o1 / 10) === 1 ? 'ten' : 'tens' =}** + {= o1 % 10 =} ones = **{= t1 + Math.floor(o1 / 10) =} tens** + {= o1 % 10 =} ones\n\n| Group | tens | ones |\n| :--- | :---: | :---: |\n| Original | {{t1}} | {{o1}} |\n| Regrouped | {{t1}} + {= Math.floor(o1 / 10) =} | {= o1 % 10 =} |\n| **Final** | **{= t1 + Math.floor(o1 / 10) =}** | **{= o1 % 10 =}** |\n\nThen:\n{{t1}} tens + {{o1}} ones = {= t1 + Math.floor(o1 / 10) =} tens + {= o1 % 10 =} ones",
    placeholders: {
      t1: '2-8',
      o1: '11-29'
    },
    visualComponent: 'none',
    visualProps: {}
  }
];

export default function PlaceValueGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="🧱 Place Value Template Builder"
      topic="place-value"
      visualComponent="BaseTenBlocks"
      presets={PLACE_VALUE_PRESETS}
      defaultVisualProps={{
        thousands: '0',
        hundreds: '0',
        tens: 'tens',
        ones: 'ones'
      }}
      customControls={({ visualProps, setVisualProps }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tens (Rods)</label>
            <input
              type="text"
              value={visualProps.tens || ''}
              onChange={(e) => setVisualProps({ ...visualProps, tens: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ones (Units)</label>
            <input
              type="text"
              value={visualProps.ones || ''}
              onChange={(e) => setVisualProps({ ...visualProps, ones: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Hundreds (Flats)</label>
            <input
              type="text"
              value={visualProps.hundreds || ''}
              onChange={(e) => setVisualProps({ ...visualProps, hundreds: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Thousands (Cubes)</label>
            <input
              type="text"
              value={visualProps.thousands || ''}
              onChange={(e) => setVisualProps({ ...visualProps, thousands: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}
    />
  );
}
