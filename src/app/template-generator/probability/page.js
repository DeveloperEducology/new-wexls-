'use client';

import React from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const PROBABILITY_PRESETS = [
  {
    name: '🔴 Probability - Jar of Marbles',
    title: 'Probability with marbles in a jar',
    subject: 'math',
    topic: 'probability',
    grade: '3',
    blueprint: 'A jar contains {{green}} green marbles and {{red}} red marbles.\n\n{= drawJarOfMarbles("green", green, "red", red, 42) =}\n\nIf you pick a marble without looking, what is the probability that it is red?\nWrite your answer as a fraction.\n[[blank1]]',
    solution: 'Step 1: Count the number of red marbles: {{red}}.\nStep 2: Find the total number of marbles in the jar: {= green + red =}.\nStep 3: The probability of picking a red marble is the number of red red marbles divided by the total number of marbles.\nStep 4: So, the probability is {{red}}/{= green + red =}.',
    placeholders: {
      green: '3-6',
      red: '2-5'
    },
    visualComponent: 'JarOfMarbles',
    visualProps: {
      colorA: 'green',
      countA: 'green',
      colorB: 'red',
      countB: 'red'
    }
  },
  {
    name: '🎯 Probability - Circular Spinner',
    title: 'Probability using spinners',
    subject: 'math',
    topic: 'probability',
    grade: '3',
    blueprint: 'Look at the spinner below.\n\n{= drawSpinner("blue", blue, "yellow", yellow) =}\n\nWhat is the probability that the spinner lands on blue?\nWrite your answer as a fraction.\n[[blank1]]',
    solution: 'Step 1: Count the number of blue sectors: {{blue}}.\nStep 2: Find the total number of sectors on the spinner: {= blue + yellow =}.\nStep 3: The probability of landing on blue is the number of blue sectors divided by the total number of sectors.\nStep 4: So, the probability is {{blue}}/{= blue + yellow =}.',
    placeholders: {
      blue: '1-4',
      yellow: '2-5'
    },
    visualComponent: 'Spinner',
    visualProps: {
      colorA: 'blue',
      sectorsA: 'blue',
      colorB: 'yellow',
      sectorsB: 'yellow'
    }
  }
];

export default function ProbabilityGeneratorPage() {
  return (
    <BaseGeneratorLayout
      title="🎲 Probability Template Builder"
      topic="probability"
      visualComponent="JarOfMarbles"
      presets={PROBABILITY_PRESETS}
      defaultVisualProps={{
        colorA: 'green',
        countA: 'green',
        colorB: 'red',
        countB: 'red'
      }}
      customControls={({ visualProps, setVisualProps }) => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Color A</label>
            <input
              type="text"
              value={visualProps.colorA || ''}
              onChange={(e) => setVisualProps({ ...visualProps, colorA: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Count A</label>
            <input
              type="text"
              value={visualProps.countA || ''}
              onChange={(e) => setVisualProps({ ...visualProps, countA: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Color B</label>
            <input
              type="text"
              value={visualProps.colorB || ''}
              onChange={(e) => setVisualProps({ ...visualProps, colorB: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Count B</label>
            <input
              type="text"
              value={visualProps.countB || ''}
              onChange={(e) => setVisualProps({ ...visualProps, countB: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}
    />
  );
}
