'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const COUNTING_PRESETS = [
  {
    name: '🦁 Count the Animals (Image Collection)',
    title: 'Counting Animals Collection',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'How many {{animal}}s do you see in the collection?\n[[blank1]]',
    solution: 'Step 1: Point to each {{animal}} and count them.\nStep 2: The count goes up to {{count}}.\nStep 3: There are {= count =} {{animal}}s!',
    placeholders: {
      count: '1-10',
      animal: 'lion, elephant, monkey, bear',
      image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970163263-lion.png, https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781803349123-Elephant.png, https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781803351655-Monkey.png, https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970141189-bear.png'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'count',
      itemType: 'image',
      itemsPerRow: '5'
    }
  },
  {
    name: '🧁 Count the Cupcakes (Default Visual)',
    title: 'Counting Cupcakes',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'How many cupcakes do you see?\n[[blank1]]',
    solution: 'Step 1: Count the cupcakes in the rows: 1, 2, 3... {{count}}.\nStep 2: There are {= count =} cupcakes!',
    placeholders: {
      count: '1-15'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'count',
      itemType: 'cupcake',
      itemsPerRow: '5'
    }
  }
];

export default function CountingGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="🦁 Counting & Image Collection Builder"
      topic="counting"
      visualComponent="ItemCounter"
      presets={COUNTING_PRESETS}
      defaultVisualProps={{
        count: 'count',
        itemType: 'image',
        itemsPerRow: '5'
      }}
      customControls={({ visualProps, setVisualProps }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Type (URL or Preset)</label>
            <input
              type="text"
              value={visualProps.itemType || ''}
              onChange={(e) => setVisualProps({ ...visualProps, itemType: e.target.value })}
              placeholder="e.g. image, cupcake, apple, star"
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
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
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Count</label>
            <input
              type="text"
              value={visualProps.count || ''}
              onChange={(e) => setVisualProps({ ...visualProps, count: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}
    />
  );
}
