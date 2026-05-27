'use client';

import React from 'react';

const ALL_TOOLS = [
  { id: 'inch_ruler', name: 'Inch Ruler', icon: '📏' },
  { id: 'centimeter_ruler', name: 'Metric Ruler', icon: '📏' },
  { id: 'measuring_tape', name: 'Measuring Tape', icon: '📼' },
  { id: 'protractor', name: 'Protractor', icon: '📐' },
  { id: 'stopwatch', name: 'Stopwatch', icon: '⏱️' },
  { id: 'compass', name: 'Compass', icon: '🧭' }
];

export default function OverlayToolbar({ activeOverlays = [], onToggleOverlay, question }) {
  const allowedToolsList = question?.allowedTools || question?.metadata?.allowedTools;

  let tools = ALL_TOOLS;
  if (allowedToolsList && Array.isArray(allowedToolsList)) {
    tools = ALL_TOOLS.filter(t => allowedToolsList.includes(t.id));
  } else {
    // Context-sensitive defaults if not explicitly configured per-question
    const topic = question?.metadata?.topic || '';
    if (topic === 'measurement') {
      tools = ALL_TOOLS.filter(t => ['inch_ruler', 'centimeter_ruler', 'measuring_tape'].includes(t.id));
    } else if (topic === 'shapes' || topic === 'geometry') {
      tools = ALL_TOOLS.filter(t => ['protractor'].includes(t.id));
    } else {
      // General default tools
      tools = ALL_TOOLS.filter(t => ['inch_ruler', 'centimeter_ruler', 'protractor'].includes(t.id));
    }
  }

  if (tools.length === 0) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1.5px solid #dbeafe',
      borderRadius: 14,
      padding: '8px 16px',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
      backdropFilter: 'blur(8px)',
      userSelect: 'none',
      marginTop: 6
    }}>
      <span style={{ fontSize: 13, fontWeight: 900, color: '#64748b', marginRight: 4 }}>
        🧰 MEASUREMENT UTILITIES:
      </span>
      {tools.map((tool) => {
        const isOpen = activeOverlays.includes(tool.id);
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToggleOverlay(tool.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isOpen ? '#2563eb' : '#f8fafc',
              color: isOpen ? '#ffffff' : '#0f172a',
              border: '1px solid',
              borderColor: isOpen ? '#2563eb' : '#cbd5e1',
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: isOpen ? '0 4px 10px rgba(37, 99, 235, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tool.icon}</span>
            <span>{tool.name}</span>
          </button>
        );
      })}
    </div>
  );
}
