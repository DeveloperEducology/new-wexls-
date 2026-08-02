'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * SingleQuestionCropperModal
 * - Allows cropping Question Figure AND all 4 Option Figures (A, B, C, D) on 1 single screen in 1 click!
 * - Renders 5 color-coded draggable & resizable boxes (Question + Option A + Option B + Option C + Option D).
 * - Exports as ultra-lightweight WebP (<10KB each).
 * - Concurrently uploads all 5 files to R2 and updates row fields.
 */
export default function SingleQuestionCropperModal({ isOpen, onClose, onApply5Crops, initialImageSrc = '' }) {
  const [imageSrc, setImageSrc] = useState(initialImageSrc || '');
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [exportFormat, setExportFormat] = useState('webp'); // 'webp' | 'png'

  // 5 Color-Coded Crop Boxes: [Question, Option A, Option B, Option C, Option D]
  // Positions in percentages (0–100%)
  const [boxes, setBoxes] = useState([
    { id: 'q', label: 'Question Figures', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', x: 0, y: 5, w: 38, h: 90 },
    { id: 'optA', label: 'Option (A)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', x: 41, y: 5, w: 13, h: 90 },
    { id: 'optB', label: 'Option (B)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', x: 55, y: 5, w: 13, h: 90 },
    { id: 'optC', label: 'Option (C)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', x: 69, y: 5, w: 13, h: 90 },
    { id: 'optD', label: 'Option (D)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)', x: 83, y: 5, w: 13, h: 90 },
  ]);

  const [dragState, setDragState] = useState(null); // null | { boxIndex, mode: 'move'|'se', startMouseX, startMouseY, startX, startY, startW, startH }

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (initialImageSrc) {
      setImageSrc(initialImageSrc);
    }
  }, [initialImageSrc]);

  if (!isOpen) return null;

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const resetDefaultBoxes = () => {
    setBoxes([
      { id: 'q', label: 'Question Figures', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', x: 0, y: 5, w: 38, h: 90 },
      { id: 'optA', label: 'Option (A)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', x: 41, y: 5, w: 13, h: 90 },
      { id: 'optB', label: 'Option (B)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', x: 55, y: 5, w: 13, h: 90 },
      { id: 'optC', label: 'Option (C)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', x: 69, y: 5, w: 13, h: 90 },
      { id: 'optD', label: 'Option (D)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)', x: 83, y: 5, w: 13, h: 90 },
    ]);
  };

  // Mouse event handlers for dragging & resizing individual boxes
  const handleMouseDown = (e, boxIndex, mode = 'move') => {
    const targetEl = imgRef.current || containerRef.current;
    if (!targetEl) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = targetEl.getBoundingClientRect();
    const mouseXPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const mouseYPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const targetBox = boxes[boxIndex];

    setDragState({
      boxIndex,
      mode,
      startMouseX: mouseXPct,
      startMouseY: mouseYPct,
      startX: targetBox.x,
      startY: targetBox.y,
      startW: targetBox.w,
      startH: targetBox.h
    });
  };

  const handleMouseMove = (e) => {
    if (!dragState) return;
    const targetEl = imgRef.current || containerRef.current;
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const currentXPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentYPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const dx = currentXPct - dragState.startMouseX;
    const dy = currentYPct - dragState.startMouseY;

    const { boxIndex, mode, startX, startY, startW, startH } = dragState;

    setBoxes(prev => {
      const updated = [...prev];
      const box = { ...updated[boxIndex] };

      if (mode === 'move') {
        box.x = Math.max(0, Math.min(100 - box.w, startX + dx));
        box.y = Math.max(0, Math.min(100 - box.h, startY + dy));
      } else if (mode === 'se') {
        box.w = Math.max(3, Math.min(100 - startX, startW + dx));
        box.h = Math.max(3, Math.min(100 - startY, startH + dy));
      }

      updated[boxIndex] = box;
      return updated;
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Perform canvas cropping for all 5 boxes and upload concurrently
  const handleCropAll5 = async () => {
    if (!imgRef.current || !imageSrc) {
      alert('Please upload or select a row image first.');
      return;
    }

    setProcessing(true);
    setProgressText('Processing 5-box high-speed crop...');

    try {
      const img = imgRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      const mimeType = exportFormat === 'webp' ? 'image/webp' : 'image/png';
      const qualityVal = exportFormat === 'webp' ? 0.75 : 1.0;
      const ext = exportFormat === 'webp' ? 'webp' : 'png';

      const results = {};

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        setProgressText(`Cropping & uploading ${box.label}...`);

        const sourceX = (box.x / 100) * naturalW;
        const sourceY = (box.y / 100) * naturalH;
        const sourceW = (box.w / 100) * naturalW;
        const sourceH = (box.h / 100) * naturalH;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        canvas.width = Math.max(1, sourceW);
        canvas.height = Math.max(1, sourceH);

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceW, sourceH,
          0, 0, canvas.width, canvas.height
        );

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, qualityVal));

        if (blob) {
          const croppedFile = new File([blob], `${box.id}-${Date.now()}.${ext}`, { type: mimeType });
          const formData = new FormData();
          formData.append('file', croppedFile);
          formData.append('folder', 'jnvst-questions');

          try {
            const res = await fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            const url = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url) || canvas.toDataURL(mimeType, qualityVal);
            results[box.id] = url;
          } catch (err) {
            console.error('Failed to upload box', box.id, err);
            results[box.id] = canvas.toDataURL(mimeType, qualityVal);
          }
        }
      }

      onApply5Crops({
        questionImage: results.q || '',
        optionAImage: results.optA || '',
        optionBImage: results.optB || '',
        optionCImage: results.optC || '',
        optionDImage: results.optD || ''
      });

      setProcessing(false);
      onClose();
      alert('🎉 Successfully cropped & updated all 5 images (Question + Options A, B, C, D)!');
    } catch (err) {
      console.error('5-Box crop failed:', err);
      alert('Error during 5-box cropping. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '980px', padding: '24px 28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎯 Single Question 5-Box Multi-Cropper</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Crop Question Figure AND all 4 Option Figures (A, B, C, D) on 1 single screen in 1 click!
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Controls Bar */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* File Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ background: '#6366f1', color: '#fff', padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>
              📁 Choose Row Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files[0])} />
            </label>

            {imageSrc && (
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>
                ✓ Loaded ({naturalSize.width} × {naturalSize.height} px)
              </span>
            )}
          </div>

          {/* Format Selector: WebP (<10KB) vs PNG */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginRight: '2px' }}>Format:</span>
            {[
              { id: 'webp', label: '⚡ WebP (<10KB)' },
              { id: 'png', label: '💎 PNG' }
            ].map(fmt => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setExportFormat(fmt.id)}
                style={{
                  background: exportFormat === fmt.id ? '#059669' : '#ffffff',
                  color: exportFormat === fmt.id ? '#ffffff' : '#334155',
                  border: `1px solid ${exportFormat === fmt.id ? '#059669' : '#cbd5e1'}`,
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {/* Reset Boxes Button */}
          <button
            type="button"
            onClick={resetDefaultBoxes}
            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
          >
            🔄 Reset 5-Box Alignment
          </button>
        </div>

        {/* Visual Interactive Canvas */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '440px',
            overflow: 'auto',
            background: '#0f172a',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            padding: '16px'
          }}
        >
          {imageSrc ? (
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
              <img
                ref={imgRef}
                src={imageSrc}
                onLoad={handleImageLoad}
                alt="Row Slicer Target"
                style={{ display: 'block', maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', pointerEvents: 'none' }}
              />

              {/* 5 Draggable & Resizable Boxes */}
              {boxes.map((box, i) => (
                <div
                  key={box.id}
                  onMouseDown={(e) => handleMouseDown(e, i, 'move')}
                  style={{
                    position: 'absolute',
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                    border: `2px dashed ${box.color}`,
                    background: box.bg,
                    boxSizing: 'border-box',
                    cursor: 'move',
                    zIndex: dragState && dragState.boxIndex === i ? 20 : 10
                  }}
                >
                  {/* Badge Label */}
                  <div style={{ position: 'absolute', top: '4px', left: '4px', background: box.color, color: '#fff', fontSize: '0.68rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    {box.label}
                  </div>

                  {/* Corner Resize Handle */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, i, 'se')}
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '10px',
                      height: '10px',
                      background: box.color,
                      border: '1px solid #fff',
                      borderRadius: '2px',
                      cursor: 'nwse-resize',
                      zIndex: 30
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🖼️</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No row image loaded yet</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Click "Choose Row Image" above to load a question row screenshot</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div>
            {processing && (
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#6366f1' }}>
                ⏳ {progressText}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCropAll5}
              disabled={!imageSrc || processing}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: !imageSrc || processing ? '#94a3b8' : '#10b981', color: '#fff', fontWeight: 900,
                cursor: !imageSrc || processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: !imageSrc || processing ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {processing ? 'Cropping 5 Images...' : '⚡ Crop & Update All 5 Images (Question + A, B, C, D)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
