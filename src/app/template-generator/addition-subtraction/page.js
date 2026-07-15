'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const ADD_SUB_PRESETS = [
  {
    name: '⚡ Ten Frame Subtraction Sentence',
    title: 'Subtraction sentence with ten frames',
    subject: 'math',
    topic: 'subtraction',
    grade: '1',
    blueprint: 'Subtract:\n\n{= drawTenFrame(total, takeaway, "red") =}\n\n{{total}} - {{takeaway}} = [[blank1]]',
    solution: 'Step 1: Count the total number of circles. There are {{total}} circles.\nStep 2: Count how many circles are crossed out. There are {{takeaway}} crossed out circles.\nStep 3: Count the remaining circles that are not crossed out: {= total - takeaway =}.\nStep 4: So, {{total}} - {{takeaway}} = {= total - takeaway =}.',
    placeholders: {
      total: '5-10',
      takeaway: '1-4'
    },
    visualComponent: 'TenFrame',
    visualProps: {
      filledCount: 'total',
      crossedOutCount: 'takeaway',
      color: 'red',
      frameCount: '1'
    }
  },
  {
    name: '🛵 Scooter Subtraction (Item Counter)',
    title: 'Subtraction sentence with picture models',
    subject: 'math',
    topic: 'subtraction',
    grade: '1',
    blueprint: 'Subtract:\n\n{= drawItemCounter(total, "apple", takeaway) =}\n\n{{total}} - {{takeaway}} = [[blank1]]',
    solution: 'There are {{total}} apples in total. {{takeaway}} of them are crossed out. What number do you get when you start with {{total}} and take away {{takeaway}}?\n\nTo find {{total}} minus {{takeaway}}, count the apples that are not crossed out.\n\n{= drawItemCounter(total, "apple", takeaway) =}\n\nThere are {= total - takeaway =} apples left. When you start with {{total}} and take away {{takeaway}}, you are left with {= total - takeaway =}.\n\nSo, {{total}} - {{takeaway}} = {= total - takeaway =}.',
    placeholders: {
      total: '5-10',
      takeaway: '1-5'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'total',
      itemType: 'apple',
      crossedOutCount: 'takeaway'
    }
  },
  {
    name: '🐟 Subtraction Models Comparison (Visual MCQ)',
    title: 'Which picture shows the subtraction sentence?',
    subject: 'math',
    topic: 'subtraction',
    grade: '1',
    optionsType: 'visual_choice',
    blueprint: 'Which picture shows {{total}} - {{takeaway}} = {= total - takeaway =}?',
    solution: 'Step 1: The subtraction sentence is {{total}} - {{takeaway}} = {= total - takeaway =}.\nStep 2: Look for the picture that has {{total}} total items with {{takeaway}} items crossed out.\nStep 3: The correct option has {= total - takeaway =} items not crossed out.',
    placeholders: {
      total: '4, 5',
      takeaway: '2, 3'
    },
    visualComponent: 'none',
    options: [
      { label: '{= drawItemCounter(total, "apple", takeaway) =}', isCorrect: true },
      { label: '{= drawItemCounter(total, "apple", takeaway - 1) =}', isCorrect: false },
      { label: '{= drawItemCounter(total + 1, "apple", takeaway) =}', isCorrect: false },
      { label: '{= drawItemCounter(total, "apple", takeaway + 1) =}', isCorrect: false }
    ],
    optionsCount: 4,
    mcqColumns: 2
  },
  {
    name: '⚖️ Balance Scale Addition',
    title: 'Addition using balance scales',
    subject: 'math',
    topic: 'addition',
    grade: '1',
    blueprint: 'Find the total weight on the balance scale:\n\n{= drawBalanceScale(left, right, "Left Pan", "Right Pan") =}\n\n{{left}} + {{right}} = [[blank1]]',
    solution: 'Step 1: Find the weight on the left pan: {{left}}.\nStep 2: Find the weight on the right pan: {{right}}.\nStep 3: Add the weights together to find the total: {{left}} + {{right}} = {= left + right =}.',
    placeholders: {
      left: '1-5',
      right: '1-5'
    },
    visualComponent: 'BalanceScale',
    visualProps: {
      leftWeight: 'left',
      rightWeight: 'right',
      leftLabel: 'Left Pan',
      rightLabel: 'Right Pan'
    }
  },
  {
    name: '📈 Number Line Subtraction',
    title: 'Subtraction on number lines',
    subject: 'math',
    topic: 'subtraction',
    grade: '1',
    blueprint: 'Write the subtraction sentence shown on the number line:\n\n{= drawNumberLine(0, 10, 1, start, "", "", start + " -> " + (start - takeaway)) =}\n\n{{start}} - [[blank1]] = [[blank2]]',
    solution: 'Step 1: The jump starts at the circle at {{start}}.\nStep 2: The curved arrow jumps backward by {{takeaway}} units.\nStep 3: The jump lands at {= start - takeaway =}.\nStep 4: So, the subtraction sentence is {{start}} - {{takeaway}} = {= start - takeaway =}.',
    placeholders: {
      start: '6-10',
      takeaway: '1-5'
    },
    visualComponent: 'NumberLine',
    visualProps: {
      min: '0',
      max: '10',
      step: '1',
      pointValue: 'start',
      jumps: 'start + " -> " + (start - takeaway)'
    }
  }
];

export default function AddSubGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="⚡ Addition & Subtraction Template Builder"
      topic="addition"
      visualComponent="TenFrame"
      presets={ADD_SUB_PRESETS}
      defaultVisualProps={{
        filledCount: 'total',
        crossedOutCount: 'takeaway',
        color: 'red',
        frameCount: '1'
      }}
      customControls={({ visualProps, setVisualProps, visualComponent, blueprint, setBlueprint, solution, setSolution }) => {
        const isItemCounter = visualComponent === 'ItemCounter';

        const changeItemType = (newType) => {
          const oldType = visualProps.itemType || 'apple';
          // Replace all quoted occurrences of the old item type in blueprint and solution
          const oldPattern = new RegExp(`"${oldType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          const newQuoted = `"${newType}"`;
          if (setBlueprint) setBlueprint(blueprint.replace(oldPattern, newQuoted));
          if (setSolution) setSolution(solution.replace(oldPattern, newQuoted));
          setVisualProps({ ...visualProps, itemType: newType });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {isItemCounter ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Count</label>
                    <input
                      type="text"
                      value={visualProps.count || 'total'}
                      onChange={(e) => setVisualProps({ ...visualProps, count: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Type</label>
                    <select
                      value={visualProps.itemType || 'apple'}
                      onChange={(e) => changeItemType(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px' }}
                    >
                      <option value="apple">🍎 Apple</option>
                      <option value="cupcake">🧁 Cupcake</option>
                      <option value="star">⭐ Star</option>
                      <option value="circle">🟡 Dot / Circle</option>
                      <optgroup label="── Stickers &amp; Animals ──">
                        <option value="/images/rabbit.svg">🐰 Rabbit</option>
                        <option value="/images/penguin.svg">🐧 Penguin</option>
                        <option value="/images/elephant_sticker.png">🐘 Elephant</option>
                        <option value="/images/lion_sticker.png">🦁 Lion</option>
                        <option value="/drum_sticker.png">🥁 Drum</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Crossed Out Count</label>
                    <input
                      type="text"
                      value={visualProps.crossedOutCount || 'takeaway'}
                      onChange={(e) => setVisualProps({ ...visualProps, crossedOutCount: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Filled Count</label>
                    <input
                      type="text"
                      value={visualProps.filledCount || ''}
                      onChange={(e) => setVisualProps({ ...visualProps, filledCount: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Crossed Out Count</label>
                    <input
                      type="text"
                      value={visualProps.crossedOutCount || ''}
                      onChange={(e) => setVisualProps({ ...visualProps, crossedOutCount: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Color</label>
                    <select
                      value={visualProps.color || 'red'}
                      onChange={(e) => setVisualProps({ ...visualProps, color: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px' }}
                    >
                      <option value="red">🔴 Gradient Red</option>
                      <option value="blue">🔵 Gradient Blue</option>
                      <option value="green">🟢 Gradient Green</option>
                      <option value="yellow">🟡 Gradient Yellow</option>
                      <option value="pink">🌸 Gradient Pink</option>
                      <option value="purple">🟣 Gradient Purple</option>
                      <option value="orange">🟠 Gradient Orange</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
