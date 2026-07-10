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
