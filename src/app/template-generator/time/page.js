'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const TIME_PRESETS = [
  {
    name: '⏰ Clock Time Reading',
    title: 'Time – Telling Time',
    subject: 'math',
    topic: 'time',
    grade: '1',
    blueprint: 'What time is shown on the clock?\n[[blank1]]',
    solution: 'Step 1: Look at the short hour hand: it points to {{hour}}.\nStep 2: Look at the long minute hand: it points to {{minute}}.\nStep 3: The time is {{hour}}:{= minute =}!',
    placeholders: {
      hour: '1-12',
      minute: '0, 15, 30, 45'
    },
    visualComponent: 'AnalogClock',
    visualProps: {
      hour: 'hour',
      minute: 'minute'
    }
  }
];

export default function TimeGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="⏰ Time Template Builder"
      topic="time"
      visualComponent="AnalogClock"
      presets={TIME_PRESETS}
      defaultVisualProps={{
        hour: 'hour',
        minute: 'minute'
      }}
      customControls={({ visualProps, setVisualProps }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Hour hand</label>
            <input
              type="text"
              value={visualProps.hour || ''}
              onChange={(e) => setVisualProps({ ...visualProps, hour: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Minute hand</label>
            <input
              type="text"
              value={visualProps.minute || ''}
              onChange={(e) => setVisualProps({ ...visualProps, minute: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}
    />
  );
}
