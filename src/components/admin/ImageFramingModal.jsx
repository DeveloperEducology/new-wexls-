'use client';

import React, { useState, useRef, useEffect } from 'react';
import FramedImage from '../common/FramedImage';

export default function ImageFramingModal({ isOpen, imageUrl, initialCropWindow, onSave, onClose }) {
  const [crop, setCrop] = useState({
    x: initialCropWindow?.x ?? 0,
    y: initialCropWindow?.y ?? 0,
    width: initialCropWindow?.width ?? 100,
    height: initialCropWindow?.height ?? 100
  });

  const [activeHandle, setActiveHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCropOnDrag, setInitialCropOnDrag] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    if (initialCropWindow) {
      setCrop({
        x: Math.max(0, Math.min(100, initialCropWindow.x || 0)),
        y: Math.max(0, Math.min(100, initialCropWindow.y || 0)),
        width: Math.max(5, Math.min(100, initialCropWindow.width || 100)),
        height: Math.max(5, Math.min(100, initialCropWindow.height || 100))
      });
    } else {
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
    }
  }, [initialCropWindow, isOpen]);

  if (!isOpen || !imageUrl) return null;

  const handleReset = () => {
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  const handlePointerDown = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handleType);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCropOnDrag({ ...crop });
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!activeHandle || !containerRef.current || !initialCropOnDrag) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

    let { x, y, width, height } = initialCropOnDrag;

    if (activeHandle === 'move') {
      x = Math.max(0, Math.min(100 - width, initialCropOnDrag.x + deltaXPercent));
      y = Math.max(0, Math.min(100 - height, initialCropOnDrag.y + deltaYPercent));
    } else {
      if (activeHandle.includes('w')) { // Left
        const newX = Math.max(0, Math.min(initialCropOnDrag.x + initialCropOnDrag.width - 5, initialCropOnDrag.x + deltaXPercent));
        width = initialCropOnDrag.x + initialCropOnDrag.width - newX;
        x = newX;
      }
      if (activeHandle.includes('e')) { // Right
        width = Math.max(5, Math.min(100 - initialCropOnDrag.x, initialCropOnDrag.width + deltaXPercent));
      }
      if (activeHandle.includes('n')) { // Top
        const newY = Math.max(0, Math.min(initialCropOnDrag.y + initialCropOnDrag.height - 5, initialCropOnDrag.y + deltaYPercent));
        height = initialCropOnDrag.y + initialCropOnDrag.height - newY;
        y = newY;
      }
      if (activeHandle.includes('s')) { // Bottom
        height = Math.max(5, Math.min(100 - initialCropOnDrag.y, initialCropOnDrag.height + deltaYPercent));
      }
    }

    setCrop({
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      width: parseFloat(width.toFixed(2)),
      height: parseFloat(height.toFixed(2))
    });
  };

  const handlePointerUp = (e) => {
    if (activeHandle) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setActiveHandle(null);
    }
  };

  const handleSave = () => {
    onSave({
      x: Math.round(crop.x * 100) / 100,
      y: Math.round(crop.y * 100) / 100,
      width: Math.round(crop.width * 100) / 100,
      height: Math.round(crop.height * 100) / 100
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              📐 Visual Image Masking &amp; Framing Tool
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Drag side/corner handles to frame the visible window area without altering the original image file.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🔄 Reset Frame
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              Save Mask Frame
            </button>
          </div>
        </div>

        {/* Content Body: Canvas + Live Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', padding: '24px', overflowY: 'auto' }}>
          
          {/* Main Framing Canvas Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                position: 'relative',
                display: 'inline-block',
                maxWidth: '100%',
                maxHeight: '450px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                userSelect: 'none',
                touchAction: 'none'
              }}
            >
              <img
                src={imageUrl}
                alt="Source Diagram"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '450px',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              />

              {/* Darkened Overlay for Outside Regions */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${crop.y}%`, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', top: `${crop.y}%`, bottom: `${100 - (crop.y + crop.height)}%`, left: 0, width: `${crop.x}%`, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', top: `${crop.y}%`, bottom: `${100 - (crop.y + crop.height)}%`, right: 0, width: `${100 - (crop.x + crop.width)}%`, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${100 - (crop.y + crop.height)}%`, background: 'rgba(0,0,0,0.5)' }} />

              {/* Active Selection Box */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'move')}
                style={{
                  position: 'absolute',
                  top: `${crop.y}%`,
                  left: `${crop.x}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                  border: '2px dashed #0284c7',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                  cursor: 'move',
                  zIndex: 10
                }}
              >
                {/* 8 Resize Handles */}
                {[
                  { type: 'nw', top: -6, left: -6, cursor: 'nwse-resize' },
                  { type: 'n', top: -6, left: 'calc(50% - 12px)', cursor: 'ns-resize', isBar: true },
                  { type: 'ne', top: -6, right: -6, cursor: 'nesw-resize' },
                  { type: 'w', top: 'calc(50% - 12px)', left: -6, cursor: 'ew-resize', isBar: true },
                  { type: 'e', top: 'calc(50% - 12px)', right: -6, cursor: 'ew-resize', isBar: true },
                  { type: 'sw', bottom: -6, left: -6, cursor: 'nesw-resize' },
                  { type: 's', bottom: -6, left: 'calc(50% - 12px)', cursor: 'ns-resize', isBar: true },
                  { type: 'se', bottom: -6, right: -6, cursor: 'nwse-resize' }
                ].map(h => (
                  <div
                    key={h.type}
                    onPointerDown={(e) => handlePointerDown(e, h.type)}
                    style={{
                      position: 'absolute',
                      top: h.top,
                      bottom: h.bottom,
                      left: h.left,
                      right: h.right,
                      width: h.isBar ? (h.type === 'n' || h.type === 's' ? '24px' : '8px') : '14px',
                      height: h.isBar ? (h.type === 'w' || h.type === 'e' ? '24px' : '8px') : '14px',
                      background: h.isBar ? '#0284c7' : '#ffffff',
                      border: '2px solid #0284c7',
                      borderRadius: h.isBar ? '4px' : '50%',
                      cursor: h.cursor,
                      zIndex: 20
                    }}
                  />
                ))}
              </div>

            </div>

            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>
              X: <strong>{crop.x}%</strong> | Y: <strong>{crop.y}%</strong> | Width: <strong>{crop.width}%</strong> | Height: <strong>{crop.height}%</strong>
            </div>
          </div>

          {/* Live Preview Card */}
          <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              👁️ Student View Preview
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              This is how your option card / diagram snippet will render to students in the mock test:
            </p>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
              <FramedImage src={imageUrl} cropWindow={crop} alt="Student View Preview" />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '8px 12px', borderRadius: '8px', fontWeight: 600 }}>
              💡 Non-Destructive: Original high-res image is untouched in R2 storage.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
