'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * High-Precision Interactive Image Cropper Modal
 * - High-Quality Crisp Image Export (PNG Lossless / 2x Retina Crisp / WebP 0.98)
 * - Auto-Trim Blank White Margins around figures
 * - Custom Target Export Width (110px, 150px, 200px, 300px, Auto)
 * - Manual Numerical Inputs for X, Y, Width (W), Height (H)
 * - Aspect Ratio Locks (Free Form, 1:1 Square, 4:3, 16:9)
 * - Resizable Corner Handles & Draggable Box Movement
 */
export default function ImageCropperModal({ imageSrc, onCropComplete, onClose }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Crop State (Percentage 0 - 100)
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 50, height: 50 });
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free' | '1:1' | '4:3' | '16:9'
  const [exportQuality, setExportQuality] = useState('png'); // 'png' | 'webp' | '2x'
  const [targetWidth, setTargetWidth] = useState('auto'); // 'auto' | 100 | 110 | 120 | 150 | 200 | 250 | 300
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // Dragging Mode
  const [dragMode, setDragMode] = useState(null); // null | 'draw' | 'move' | 'nw' | 'ne' | 'sw' | 'se'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
  const [uploading, setUploading] = useState(false);

  // Detect Image Natural Dimensions
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  // Helper to enforce aspect ratio constraints
  const enforceAspect = (w, h, ratioStr) => {
    if (ratioStr === 'free' || !naturalSize.width || !naturalSize.height) return { width: w, height: h };
    const imgAspect = naturalSize.width / naturalSize.height;
    let targetRatio = 1;
    if (ratioStr === '1:1') targetRatio = 1;
    if (ratioStr === '4:3') targetRatio = 4 / 3;
    if (ratioStr === '16:9') targetRatio = 16 / 9;

    const targetH = (w * imgAspect) / targetRatio;
    return { width: w, height: Math.min(100, targetH) };
  };

  // Auto Trim White Blank Space Around Figure
  const handleAutoTrimWhite = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let foundDark = false;

    // Scan pixels for non-white content (dark figure strokes)
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a > 20 && (r < 238 || g < 238 || b < 238)) {
          foundDark = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (foundDark) {
      const pMinX = Math.max(0, (minX / canvas.width) * 100 - 1);
      const pMinY = Math.max(0, (minY / canvas.height) * 100 - 1);
      const pMaxX = Math.min(100, (maxX / canvas.width) * 100 + 1);
      const pMaxY = Math.min(100, (maxY / canvas.height) * 100 + 1);

      setCrop({
        x: pMinX,
        y: pMinY,
        width: Math.max(1, pMaxX - pMinX),
        height: Math.max(1, pMaxY - pMinY)
      });
    } else {
      alert('No dark drawing content detected to auto-trim.');
    }
  };

  // Mouse Down Event Listener
  // Mouse Down Event Listener
  const handleMouseDown = (e, mode = 'draw') => {
    const targetEl = imgRef.current || containerRef.current;
    if (!targetEl) return;
    e.stopPropagation();
    const rect = targetEl.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setDragMode(mode);
    setDragStart({
      x: xPct,
      y: yPct,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height,
    });

    if (mode === 'draw') {
      setCrop({ x: xPct, y: yPct, width: 0, height: 0 });
    }
  };

  // Mouse Move Event Listener
  const handleMouseMove = (e) => {
    if (!dragMode) return;
    const targetEl = imgRef.current || containerRef.current;
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;

    if (dragMode === 'draw') {
      const x = Math.min(dragStart.x, currentX);
      const y = Math.min(dragStart.y, currentY);
      let w = Math.abs(currentX - dragStart.x);
      let h = Math.abs(currentY - dragStart.y);

      const constrained = enforceAspect(w, h, aspectRatio);
      setCrop({ x, y, width: constrained.width, height: constrained.height });
    } else if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(100 - crop.width, dragStart.cropX + dx));
      const newY = Math.max(0, Math.min(100 - crop.height, dragStart.cropY + dy));
      setCrop(prev => ({ ...prev, x: newX, y: newY }));
    } else if (dragMode === 'se') {
      let w = Math.max(1, Math.min(100 - dragStart.cropX, dragStart.cropW + dx));
      let h = Math.max(1, Math.min(100 - dragStart.cropY, dragStart.cropH + dy));
      const constrained = enforceAspect(w, h, aspectRatio);
      setCrop(prev => ({ ...prev, width: constrained.width, height: constrained.height }));
    } else if (dragMode === 'nw') {
      let newX = Math.max(0, Math.min(dragStart.cropX + dragStart.cropW - 1, dragStart.cropX + dx));
      let newY = Math.max(0, Math.min(dragStart.cropY + dragStart.cropH - 1, dragStart.cropY + dy));
      let w = dragStart.cropW + (dragStart.cropX - newX);
      let h = dragStart.cropH + (dragStart.cropY - newY);
      setCrop({ x: newX, y: newY, width: w, height: h });
    }
  };

  const handleMouseUp = () => {
    setDragMode(null);
  };

  // Manual Input Change Handlers
  const handleManualValue = (field, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setCrop(prev => {
      let updated = { ...prev, [field]: num };
      if (field === 'width' && aspectRatio !== 'free') {
        const constrained = enforceAspect(num, prev.height, aspectRatio);
        updated.height = constrained.height;
      }
      return updated;
    });
  };

  // Quick Action Helpers
  const handleCenterBox = () => {
    const x = Math.max(0, (100 - crop.width) / 2);
    const y = Math.max(0, (100 - crop.height) / 2);
    setCrop(prev => ({ ...prev, x, y }));
  };

  const handleSelectFull = () => {
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Aspect Ratio Preset Selection
  const handleSelectAspect = (ratio) => {
    setAspectRatio(ratio);
    if (ratio !== 'free') {
      const constrained = enforceAspect(crop.width, crop.height, ratio);
      setCrop(prev => ({ ...prev, height: constrained.height }));
    }
  };

  // High Quality Crop & Save Handler
  const handleCropAndSave = async () => {
    if (!imgRef.current || crop.width === 0 || crop.height === 0) {
      alert('Please drag or enter a box size over the image to crop.');
      return;
    }

    setUploading(true);
    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Enable High-Quality Smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Source Crop Coordinates in Original Natural Pixels
      const sourceX = (crop.x / 100) * img.naturalWidth;
      const sourceY = (crop.y / 100) * img.naturalHeight;
      const sourceW = (crop.width / 100) * img.naturalWidth;
      const sourceH = (crop.height / 100) * img.naturalHeight;

      // Custom Target Export Width handling
      let finalW = sourceW;
      let finalH = sourceH;

      if (targetWidth !== 'auto' && Number(targetWidth) > 0) {
        finalW = Number(targetWidth);
        const aspect = sourceW / sourceH;
        finalH = Math.round(finalW / aspect);
      } else if (exportQuality === '2x') {
        finalW = sourceW * 2;
        finalH = sourceH * 2;
      }

      canvas.width = Math.max(1, finalW);
      canvas.height = Math.max(1, finalH);

      ctx.drawImage(
        img,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, canvas.width, canvas.height
      );

      const mimeType = exportQuality === 'webp' ? 'image/webp' : 'image/png';
      const qualityVal = exportQuality === 'webp' ? 0.98 : 1.0;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          onCropComplete(dataUrl);
          setUploading(false);
          return;
        }

        try {
          const ext = mimeType === 'image/webp' ? 'webp' : 'png';
          const croppedFile = new File([blob], `cropped-${Date.now()}.${ext}`, { type: mimeType });
          const formData = new FormData();
          formData.append('file', croppedFile);
          formData.append('folder', 'jnvst-questions');

          const res = await fetch('/api/admin/upload-image', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();

          if (data.success || data.url) {
            const uploadedUrl = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url);
            onCropComplete(uploadedUrl);
          } else {
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            onCropComplete(dataUrl);
          }
        } catch (e) {
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          onCropComplete(dataUrl);
        } finally {
          setUploading(false);
        }
      }, mimeType, qualityVal);

    } catch (err) {
      console.error('Crop save error:', err);
      alert('Failed to process high-resolution crop.');
      setUploading(false);
    }
  };

  // Calculate Real Source Pixel Dimensions
  const realPxW = naturalSize.width ? Math.round((crop.width / 100) * naturalSize.width) : 0;
  const realPxH = naturalSize.height ? Math.round((crop.height / 100) * naturalSize.height) : 0;

  // Calculate Final Export Pixel Dimensions
  let exportPxW = realPxW;
  let exportPxH = realPxH;
  if (targetWidth !== 'auto' && Number(targetWidth) > 0 && realPxW > 0) {
    exportPxW = Number(targetWidth);
    exportPxH = Math.round(exportPxW * (realPxH / realPxW));
  } else if (exportQuality === '2x') {
    exportPxW = realPxW * 2;
    exportPxH = realPxH * 2;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '940px', padding: '24px 28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✂️ Crop Selected Image Portion</span>
              {naturalSize.width > 0 && (
                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  Natural Source: {naturalSize.width} × {naturalSize.height} px
                </span>
              )}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Drag mouse over image OR type exact Width &amp; Height below for razor-sharp figure crops into R2.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* TOP CONTROLS: Manual W, H, X, Y & Export Size & Aspect Ratio & Quality Presets */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Manual Numerical Inputs (W, H, X, Y) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>📏 Box:</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>W:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={Math.round(crop.width)}
                onChange={(e) => handleManualValue('width', e.target.value)}
                style={{ width: '56px', padding: '4px 6px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>H:</span>
              <input
                type="number"
                min={1}
                max={100}
                value={Math.round(crop.height)}
                onChange={(e) => handleManualValue('height', e.target.value)}
                style={{ width: '56px', padding: '4px 6px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>X:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(crop.x)}
                onChange={(e) => handleManualValue('x', e.target.value)}
                style={{ width: '50px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Y:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(crop.y)}
                onChange={(e) => handleManualValue('y', e.target.value)}
                style={{ width: '50px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Target Output Export Width Selector */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginRight: '2px' }}>📐 Output Width:</span>
            {[
              { id: 'auto', label: 'Auto' },
              { id: '110', label: '110px' },
              { id: '150', label: '150px' },
              { id: '200', label: '200px' },
              { id: '300', label: '300px' }
            ].map(wItem => (
              <button
                key={wItem.id}
                type="button"
                onClick={() => setTargetWidth(wItem.id)}
                style={{
                  background: String(targetWidth) === wItem.id ? '#4338ca' : '#ffffff',
                  color: String(targetWidth) === wItem.id ? '#ffffff' : '#334155',
                  border: `1px solid ${String(targetWidth) === wItem.id ? '#4338ca' : '#cbd5e1'}`,
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {wItem.label}
              </button>
            ))}
          </div>

          {/* Aspect Ratio Presets */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginRight: '2px' }}>Aspect:</span>
            {[
              { id: 'free', label: 'Free' },
              { id: '1:1', label: '1:1 Square' },
              { id: '4:3', label: '4:3' },
              { id: '16:9', label: '16:9' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectAspect(item.id)}
                style={{
                  background: aspectRatio === item.id ? '#0284c7' : '#ffffff',
                  color: aspectRatio === item.id ? '#ffffff' : '#334155',
                  border: `1px solid ${aspectRatio === item.id ? '#0284c7' : '#cbd5e1'}`,
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quality & Resolution Presets */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginRight: '2px' }}>Quality:</span>
            {[
              { id: 'png', label: '💎 PNG' },
              { id: '2x', label: '🚀 2x HD' },
              { id: 'webp', label: '⚡ WebP' }
            ].map(q => (
              <button
                key={q.id}
                type="button"
                onClick={() => setExportQuality(q.id)}
                style={{
                  background: exportQuality === q.id ? '#059669' : '#ffffff',
                  color: exportQuality === q.id ? '#ffffff' : '#334155',
                  border: `1px solid ${exportQuality === q.id ? '#059669' : '#cbd5e1'}`,
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Crop Container */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '440px',
            overflow: 'hidden',
            background: '#0f172a',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          {/* Tight Image Relative Wrapper */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '100%',
              maxHeight: '440px',
              cursor: 'crosshair'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'draw')}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              alt="Crop target"
              style={{ display: 'block', maxWidth: '100%', maxHeight: '440px', objectFit: 'contain', pointerEvents: 'none' }}
            />

            {/* Selection Box & Drag Handles */}
            {crop.width > 0 && crop.height > 0 && (
              <div
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                style={{
                  position: 'absolute',
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                  border: '2px dashed #10b981',
                  background: 'rgba(16, 185, 129, 0.22)',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                  cursor: 'move'
                }}
              >
                {/* Region Label Badge */}
                <div style={{ position: 'absolute', top: '4px', left: '6px', background: '#10b981', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                  Crop Region ({exportPxW} × {exportPxH} px)
                </div>

                {/* Northwest (Top-Left) Corner Handle */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'nw')}
                  style={{ position: 'absolute', top: '-5px', left: '-5px', width: '10px', height: '10px', background: '#10b981', border: '1px solid #fff', borderRadius: '2px', cursor: 'nwse-resize' }}
                />

                {/* Southeast (Bottom-Right) Corner Handle */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'se')}
                  style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '10px', height: '10px', background: '#10b981', border: '1px solid #fff', borderRadius: '2px', cursor: 'nwse-resize' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Auto Trim White Margins Button */}
            <button
              type="button"
              onClick={handleAutoTrimWhite}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #10b981', background: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
              title="Automatically trim blank white space tight around figure drawing"
            >
              ⚡ Auto-Trim White Margins
            </button>
            <button
              type="button"
              onClick={handleCenterBox}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              🎯 Center Box
            </button>
            <button
              type="button"
              onClick={handleSelectFull}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              🖼️ Select Full
            </button>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, marginLeft: '4px' }}>
              Export Dimension: <span style={{ color: '#059669', fontWeight: 900 }}>{exportPxW} × {exportPxH} px</span>
            </span>
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
              onClick={handleCropAndSave}
              disabled={uploading}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: '#10b981', color: '#fff', fontWeight: 800,
                cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {uploading ? 'Processing Crop...' : '✂️ Crop & Save to R2'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
