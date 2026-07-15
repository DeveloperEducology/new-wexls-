'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const DIVISION_PRESETS = [
  {
    name: '🧁 Division - Share into Equal Groups',
    title: 'Division as equal sharing',
    subject: 'math',
    topic: 'division',
    grade: '2',
    blueprint: 'Share {= groups * size =} cupcakes into {{groups}} equal groups. How many cupcakes are in each group?\n\n{= drawItemCounter(groups * size, "cupcake") =}\n\n{= groups * size =} ÷ {{groups}} = [[blank1]]',
    solution: 'Step 1: Count the total cupcakes: {= groups * size =}.\nStep 2: Share them into {{groups}} equal groups.\nStep 3: Count the cupcakes in one group: {{size}}.\nStep 4: So, {= groups * size =} ÷ {{groups}} = {= size =}.',
    placeholders: {
      groups: '2, 3, 4',
      size: '2-5'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'groups * size',
      itemType: 'cupcake',
      itemsPerRow: 'size'
    }
  },
  {
    name: '🍏 Division - Array Sharing',
    title: 'Division using arrays',
    subject: 'math',
    topic: 'division',
    grade: '2',
    blueprint: 'There are {= rows * cols =} apples arranged in {{rows}} equal rows. How many apples are in each row?\n\n{= drawItemCounter(rows * cols, "apple") =}\n\n{= rows * cols =} ÷ {{rows}} = [[blank1]]',
    solution: 'Step 1: Count the total apples: {= rows * cols =}.\nStep 2: They are arranged in {{rows}} equal rows.\nStep 3: Count the number of columns (apples in each row): {{cols}}.\nStep 4: So, {= rows * cols =} ÷ {{rows}} = {= cols =}.',
    placeholders: {
      rows: '2, 3, 4',
      cols: '2-5'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'rows * cols',
      itemType: 'apple',
      itemsPerRow: 'cols'
    }
  }
];

export default function DivisionGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="➗ Division Template Builder"
      topic="division"
      visualComponent="ItemCounter"
      presets={DIVISION_PRESETS}
      defaultVisualProps={{
        count: 'groups * size',
        itemType: 'cupcake',
        itemsPerRow: 'size'
      }}
      customControls={({ visualProps, setVisualProps, blueprint, setBlueprint, solution, setSolution }) => {
        const changeItemType = (newType) => {
          const oldType = visualProps.itemType || 'cupcake';
          const oldPattern = new RegExp(`"${oldType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          const newQuoted = `"${newType}"`;
          if (setBlueprint) setBlueprint(blueprint.replace(oldPattern, newQuoted));
          if (setSolution) setSolution(solution.replace(oldPattern, newQuoted));
          setVisualProps({ ...visualProps, itemType: newType });
        };
        return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Count</label>
            <input
              type="text"
              value={visualProps.count || ''}
              onChange={(e) => setVisualProps({ ...visualProps, count: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Type</label>
            <select
              value={visualProps.itemType || 'cupcake'}
              onChange={(e) => changeItemType(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px' }}
            >
              <option value="cupcake">🧁 Cupcake</option>
              <option value="apple">🍎 Apple</option>
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
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Items Per Row</label>
            <input
              type="text"
              value={visualProps.itemsPerRow || ''}
              onChange={(e) => setVisualProps({ ...visualProps, itemsPerRow: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        );
      }}
    />
  );
}
