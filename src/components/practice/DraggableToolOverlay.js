'use client';

import React, { useRef, useState } from 'react';
import { getSvgTool } from '@/lib/practice/svgTools';

export default function DraggableToolOverlay({ toolId, onClose }) {
  const containerRef = useRef(null);
  
  // Positioning and rotation states
  const [pos, setPos] = useState({ x: 100, y: 120 });
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(0.8);
  
  // Dragging and rotation interaction tracking states
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Get static/default SVG content from registry
  const tool = getSvgTool(toolId, { showLabel: false });

  // Start drag handler
  const startDrag = (e) => {
    if (e.target.closest('.control-no-drag')) return;
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
    
    // Store cursor offset relative to card top-left position
    dragStartOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  // Move handler (handles both translate dragging and rotation adjustments)
  const onPointerMove = (e) => {
    if (isDragging) {
      setPos({
        x: e.clientX - dragStartOffset.current.x,
        y: e.clientY - dragStartOffset.current.y
      });
    } else if (isRotating && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      // Calculate angle in degrees from center
      const angleRad = Math.atan2(dy, dx);
      let angleDeg = angleRad * (180 / Math.PI);
      
      // Normalize angle relative to the top handle's neutral rotation (-90 deg offset)
      angleDeg = (angleDeg + 90) % 360;
      setRotation(Math.round(angleDeg));
    }
  };

  // Stop drag handler
  const endDrag = (e) => {
    setIsDragging(false);
    setIsRotating(false);
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Start rotating handle click
  const startRotate = (e) => {
    e.stopPropagation();
    setIsRotating(true);
    e.target.setPointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: 320,
        zIndex: 9999,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        opacity: opacity,
        background: '#ffffff',
        border: '2px dashed #3b82f6',
        borderRadius: 16,
        boxShadow: isDragging ? '0 24px 48px rgba(37, 99, 235, 0.25)' : '0 12px 28px rgba(15, 23, 42, 0.12)',
        userSelect: 'none',
        touchAction: 'none',
        padding: '24px 10px 10px 10px',
        transition: isDragging || isRotating ? 'none' : 'transform 0.1s ease, box-shadow 0.15s ease'
      }}
    >
      {/* Top drag grab area */}
      <div
        onPointerDown={startDrag}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 24,
          cursor: isDragging ? 'grabbing' : 'grab',
          background: '#eff6ff',
          borderRadius: '14px 14px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ width: 42, height: 4, background: '#93c5fd', borderRadius: 99 }} />
      </div>

      {/* Interactive rotate handle hook (positioned above the box) */}
      <div
        onPointerDown={startRotate}
        style={{
          position: 'absolute',
          top: -28,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#3b82f6',
          border: '2.5px solid #ffffff',
          boxShadow: '0 4px 10px rgba(59, 130, 246, 0.45)',
          cursor: 'ew-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Drag to Rotate Tool"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffffff" strokeWidth="3">
          <path strokeLinecap="round" d="M21.5 2v6h-6M21.34 8a10 10 0 10-.5 3.5" />
        </svg>
      </div>

      {/* SVG Image Content */}
      <div 
        dangerouslySetInnerHTML={{ __html: tool?.svg || '' }} 
        style={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
      />

      {/* Overlay Tool Controls (Opacity slider, rotation read, and close button) */}
      <div 
        className="control-no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginTop: 8,
          borderTop: '1px solid #f1f5f9',
          paddingTop: 8,
          fontSize: 11,
          fontWeight: 700,
          color: '#475569'
        }}
      >
        {/* Opacity slider control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <span>Opacity:</span>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', height: 4, background: '#cbd5e1', borderRadius: 99, outline: 'none' }}
          />
        </div>

        {/* Rotate read / indicator */}
        <div style={{ whiteSpace: 'nowrap', background: '#f1f5f9', padding: '3px 6px', borderRadius: 6 }}>
          {rotation}°
        </div>

        {/* Close Overlay tool */}
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: '#fee2e2',
            color: '#ef4444',
            borderRadius: 6,
            padding: '3px 8px',
            cursor: 'pointer',
            fontWeight: 800
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
