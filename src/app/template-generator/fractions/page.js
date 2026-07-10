'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const FRACTION_PRESETS = [
  {
    name: '🍕 Fraction of a Circle (Pie)',
    title: 'Fractions – Circle Model',
    subject: 'math',
    topic: 'fractions',
    grade: '2',
    blueprint: 'What fraction of the circle is shaded?\n[[blank1]]',
    solution: 'Step 1: Count the total equal parts in the circle: {{total}} parts.\nStep 2: Count how many parts are shaded: {{shaded}} parts.\nStep 3: Write it as a fraction: {{shaded}}/{{total}}!',
    placeholders: {
      total: '4, 6, 8',
      shaded: '1-3'
    },
    visualComponent: 'FractionCircle',
    visualProps: {
      denominator: 'total',
      numerator: 'shaded',
      color: 'orange'
    }
  },
  {
    name: '🍫 Fraction of a Bar (Chocolate)',
    title: 'Fractions – Bar Model',
    subject: 'math',
    topic: 'fractions',
    grade: '2',
    blueprint: 'What fraction of the bar is shaded?\n[[blank1]]',
    solution: 'Step 1: Count the total sections in the bar: {{total}} parts.\nStep 2: Count how many sections are shaded: {{shaded}} parts.\nStep 3: Write it as a fraction: {{shaded}}/{{total}}!',
    placeholders: {
      total: '5-10',
      shaded: '2-4'
    },
    visualComponent: 'FractionBar',
    visualProps: {
      denominator: 'total',
      numerator: 'shaded',
      color: 'blue'
    }
  }
];

export default function FractionsGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="🍕 Fractions Template Builder"
      topic="fractions"
      visualComponent="FractionCircle"
      presets={FRACTION_PRESETS}
      defaultVisualProps={{
        denominator: 'total',
        numerator: 'shaded',
        color: 'orange'
      }}
      customControls={({ visualProps, setVisualProps }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Numerator (Shaded)</label>
            <input
              type="text"
              value={visualProps.numerator || ''}
              onChange={(e) => setVisualProps({ ...visualProps, numerator: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Denominator (Total)</label>
            <input
              type="text"
              value={visualProps.denominator || ''}
              onChange={(e) => setVisualProps({ ...visualProps, denominator: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Shading Color</label>
            <input
              type="text"
              value={visualProps.color || ''}
              onChange={(e) => setVisualProps({ ...visualProps, color: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}
    />
  );
}
