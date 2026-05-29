'use client';

import React from 'react';

export default function CatV2SourceTray({ children, label = 'Items' }) {
  return (
    <section
      aria-label={label}
      style={{
        width: '100%',
        border: '2px dashed #dbeafe',
        background: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'flex-start',
          minWidth: 'max-content',
          scrollSnapType: 'x proximity',
        }}
      >
        {children}
      </div>
    </section>
  );
}
