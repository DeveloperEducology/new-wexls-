'use client';

import React from 'react';

export default function CatV2DropZone({
  children,
  active = false,
  filled = false,
  label,
  minHeight = 112,
  onClick,
  onDragOver,
  onDrop,
  style,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        width: '100%',
        minHeight,
        border: `2px ${filled ? 'solid' : 'dashed'} ${active ? '#2563eb' : '#bfdbfe'}`,
        background: active ? '#eff6ff' : '#f8fafc',
        borderRadius: 10,
        padding: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontWeight: 900,
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'background 160ms ease, border-color 160ms ease, transform 160ms ease',
        transform: active ? 'scale(1.01)' : 'scale(1)',
        ...style,
      }}
      aria-label={label}
    >
      {children || label}
    </div>
  );
}
