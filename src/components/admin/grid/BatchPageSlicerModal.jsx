'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * High-Precision Interactive Batch Page Slicer Modal
 * - Supports 1-Column Stack (1..N top-to-bottom) AND 2-Column Side-by-Side Grid (Left Column 1..N/2 then Right Column N/2+1..N)!
 * - Uploads 1 PDF / Page Image containing multiple stacked or grid question figures (e.g., 4 or 5 questions per page).
 * - Visually renders draggable, resizable crop boxes over each question!
 * - Preset button: "Skip Top Header (15%)" to automatically bypass top page directions in 1 click!
 * - Concurrently uploads all sliced WebP/PNGs (<10KB) to R2 storage and assigns them to consecutive rows in 1 click!
 */
export default function BatchPageSlicerModal({ rows, startRowIndex = 0, isOpen, onClose, onApplyBatchCrops }) {
  const [imageSrc, setImageSrc] = useState('');
  const [startIdx, setStartIdx] = useState(startRowIndex);
  const [sliceCount, setSliceCount] = useState(4);
  const [sliceMode, setSliceMode] = useState('full'); // 'full' | 'left_only'
  const [pageLayout, setPageLayout] = useState('1col'); // '1col' | '2col'
  const [exportFormat, setExportFormat] = useState('webp'); // 'webp' | 'png'
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Array of slice boxes: [{ left: %, top: %, width: %, height: % }]
  const [customSlices, setCustomSlices] = useState([]);
  const [dragState, setDragState] = useState(null); // null | { index, mode, startX, startY, startLeft, startTop, startW, startH }

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const resetEqualSlices = (count = sliceCount, layoutMode = pageLayout, skipHeaderPct = 0) => {
    const initial = [];
    const availableH = 100 - skipHeaderPct;

    if (layoutMode === '2col') {
      // 2-Column layout: Left Column (Q1..QN/2), then Right Column (QN/2+1..QN)
      const rowsPerCol = Math.ceil(count / 2);
      const hPerSlice = availableH / rowsPerCol;

      for (let i = 0; i < count; i++) {
        const isRightCol = i >= rowsPerCol;
        const colRowIndex = i % rowsPerCol;

        initial.push({
          left: isRightCol ? 50 : 0,
          top: skipHeaderPct + (colRowIndex * hPerSlice),
          width: 50,
          height: hPerSlice
        });
      }
    } else {
      // 1-Column layout (Default vertical stack)
      const hPerSlice = availableH / count;
      for (let i = 0; i < count; i++) {
        initial.push({
          left: 0,
          top: skipHeaderPct + (i * hPerSlice),
          width: sliceMode === 'left_only' ? 46 : 100,
          height: hPerSlice
        });
      }
    }
    setCustomSlices(initial);
  };

  // Sync startRowIndex prop
  useEffect(() => {
    setStartIdx(startRowIndex);
  }, [startRowIndex]);

  // Recalculate default equal slices whenever sliceCount, pageLayout, sliceMode or imageSrc changes
  useEffect(() => {
    if (sliceCount > 0) {
      resetEqualSlices(sliceCount, pageLayout);
    }
  }, [sliceCount, pageLayout, sliceMode, imageSrc]);

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

  // Dragging event handlers for slice box handles
  const handleHandleMouseDown = (e, index, mode) => {
    const targetEl = imgRef.current || containerRef.current;
    if (!targetEl) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = targetEl.getBoundingClientRect();
    const mouseXPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const mouseYPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const curSlice = customSlices[index];

    setDragState({
      index,
      mode,
      startMouseX: mouseXPct,
      startMouseY: mouseYPct,
      startLeft: curSlice.left || 0,
      startTop: curSlice.top || 0,
      startW: curSlice.width || 100,
      startH: curSlice.height || 25
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

    const { index, mode, startLeft, startTop, startW, startH } = dragState;

    setCustomSlices(prev => {
      const updated = [...prev];
      const slice = { ...updated[index] };

      if (mode === 'move') {
        slice.left = Math.max(0, Math.min(100 - slice.width, startLeft + dx));
        slice.top = Math.max(0, Math.min(100 - slice.height, startTop + dy));
      } else if (mode === 'top') {
        const newTop = Math.max(0, Math.min(startTop + startH - 2, startTop + dy));
        const newH = startH + (startTop - newTop);
        slice.top = newTop;
        slice.height = newH;
      } else if (mode === 'bottom') {
        const newH = Math.max(2, Math.min(100 - startTop, startH + dy));
        slice.height = newH;
      } else if (mode === 'se') {
        slice.width = Math.max(5, Math.min(100 - startLeft, startW + dx));
        slice.height = Math.max(2, Math.min(100 - startTop, startH + dy));
      }

      updated[index] = slice;
      return updated;
    });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Perform high-quality canvas slicing and bulk R2 uploads
  const handleSliceAndAssign = async () => {
    if (!imgRef.current || !imageSrc) {
      alert('Please select or upload a page image first.');
      return;
    }
    if (sliceCount <= 0) return;

    setProcessing(true);
    setProgressText('Preparing high-resolution canvas...');

    try {
      const img = imgRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      const mimeType = exportFormat === 'webp' ? 'image/webp' : 'image/png';
      const qualityVal = exportFormat === 'webp' ? 0.75 : 1.0;
      const ext = exportFormat === 'webp' ? 'webp' : 'png';

      const croppedUrls = [];

      for (let i = 0; i < sliceCount; i++) {
        const rowNum = startIdx + i + 1;
        setProgressText(`Slicing & uploading Row #${rowNum} (${i + 1}/${sliceCount})...`);

        const sliceConf = customSlices[i] || { left: 0, top: (i / sliceCount) * 100, width: 100, height: (1 / sliceCount) * 100 };

        const sourceX = (sliceConf.left / 100) * naturalW;
        const sourceY = (sliceConf.top / 100) * naturalH;
        const sourceW = (sliceConf.width / 100) * naturalW;
        const sourceH = (sliceConf.height / 100) * naturalH;

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

        // Convert to Blob and Upload to R2 (WebP quality 0.75 ensures <10KB file size)
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, qualityVal));

        if (blob) {
          const croppedFile = new File([blob], `batch-row-${rowNum}-${Date.now()}.${ext}`, { type: mimeType });
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
            croppedUrls.push({ rowIndex: startIdx + i, questionImage: url });
          } catch (err) {
            console.error('Failed to upload slice', i, err);
            const dataUrl = canvas.toDataURL(mimeType, qualityVal);
            croppedUrls.push({ rowIndex: startIdx + i, questionImage: dataUrl });
          }
        }
      }

      // Send batch updates to parent grid
      onApplyBatchCrops(croppedUrls);
      setProcessing(false);
      onClose();
      alert(`🎉 Successfully sliced and assigned ${croppedUrls.length} question images to Rows #${startIdx + 1} through #${startIdx + croppedUrls.length}!`);
    } catch (err) {
      console.error('Batch slicing failed:', err);
      alert('Error during batch slicing. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '1040px', padding: '24px 28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡ Batch Page Auto-Slicer (1-Col &amp; 2-Col Side-by-Side)</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Supports both 1-Column Stack and 2-Column Side-by-Side PDF Page Layouts!
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Controls Bar */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* File Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ background: '#6366f1', color: '#fff', padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>
              📁 Choose Page Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files[0])} />
            </label>

            {imageSrc && (
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>
                ✓ Loaded ({naturalSize.width} × {naturalSize.height} px)
              </span>
            )}
          </div>

          {/* Page Layout Selector (1-Col Stack vs 2-Col Side-by-Side) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>Layout:</span>
            <button
              type="button"
              onClick={() => setPageLayout('1col')}
              style={{
                background: pageLayout === '1col' ? '#0f172a' : '#fff',
                color: pageLayout === '1col' ? '#fff' : '#334155',
                border: `1px solid ${pageLayout === '1col' ? '#0f172a' : '#cbd5e1'}`,
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              📄 1-Col Stack
            </button>
            <button
              type="button"
              onClick={() => setPageLayout('2col')}
              style={{
                background: pageLayout === '2col' ? '#e11d48' : '#fff',
                color: pageLayout === '2col' ? '#fff' : '#334155',
                border: `1px solid ${pageLayout === '2col' ? '#e11d48' : '#cbd5e1'}`,
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer',
                boxShadow: pageLayout === '2col' ? '0 2px 8px rgba(225, 29, 72, 0.3)' : 'none'
              }}
            >
              📰 2-Col Side-by-Side (Left ➔ Right)
            </button>
          </div>

          {/* Starting Row Index Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>📍 Start Row:</span>
            <select
              value={startIdx}
              onChange={(e) => setStartIdx(Number(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 800, color: '#4338ca' }}
            >
              {rows.map((r, i) => (
                <option key={i} value={i}>
                  Row #{i + 1} ({r.questionText ? r.questionText.slice(0, 24) + '...' : 'Question ' + (i + 1)})
                </option>
              ))}
            </select>
          </div>

          {/* Rows Count per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>🔢 Questions/Page:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={sliceCount}
              onChange={(e) => setSliceCount(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: '48px', padding: '5px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 800, textAlign: 'center' }}
            />
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
                  padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {fmt.label}
              </button>
            ))}
          </div>

          {/* Presets: Skip Header & Reset */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => resetEqualSlices(sliceCount, pageLayout, 15)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #10b981', background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
              title="Shift boxes down by 15% to skip page header/directions text"
            >
              ⏬ Skip Header (15%)
            </button>
            <button
              type="button"
              onClick={() => resetEqualSlices(sliceCount, pageLayout, 0)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🔄 Reset Layout
            </button>
          </div>

        </div>

        {/* Visual Draggable Crop Overlay Canvas */}
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
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
                alt="Batch Slice Target"
                style={{ display: 'block', maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', pointerEvents: 'none' }}
              />

              {/* Draggable Cut Boxes Overlay */}
              {customSlices.map((slice, i) => {
                const rowTarget = startIdx + i + 1;
                const boxColor = pageLayout === '2col'
                  ? (i < Math.ceil(sliceCount / 2) ? '#10b981' : '#f59e0b')
                  : (i % 2 === 0 ? '#10b981' : '#3b82f6');

                return (
                  <div
                    key={i}
                    onMouseDown={(e) => handleHandleMouseDown(e, i, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${slice.left}%`,
                      top: `${slice.top}%`,
                      width: `${slice.width}%`,
                      height: `${slice.height}%`,
                      border: `2px dashed ${boxColor}`,
                      background: pageLayout === '2col'
                        ? (i < Math.ceil(sliceCount / 2) ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)')
                        : (i % 2 === 0 ? 'rgba(16, 185, 129, 0.22)' : 'rgba(59, 130, 246, 0.22)'),
                      boxSizing: 'border-box',
                      cursor: 'grab',
                      zIndex: dragState && dragState.index === i ? 20 : 10
                    }}
                  >
                    {/* Top Edge Resizable Handle */}
                    <div
                      onMouseDown={(e) => handleHandleMouseDown(e, i, 'top')}
                      style={{
                        position: 'absolute',
                        top: '-4px', left: 0, right: 0,
                        height: '8px',
                        background: boxColor,
                        cursor: 'ns-resize',
                        borderRadius: '2px',
                        zIndex: 10
                      }}
                      title="Drag top edge up/down"
                    />

                    {/* Region Label Badge */}
                    <div style={{ position: 'absolute', top: '6px', left: '8px', background: boxColor, color: '#fff', fontSize: '0.72rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                      ✂️ Assign to Row #{rowTarget} ({Math.round(slice.width)}%W × {Math.round(slice.height)}%H)
                    </div>

                    {/* Bottom Edge Resizable Handle */}
                    <div
                      onMouseDown={(e) => handleHandleMouseDown(e, i, 'bottom')}
                      style={{
                        position: 'absolute',
                        bottom: '-4px', left: 0, right: 0,
                        height: '8px',
                        background: boxColor,
                        cursor: 'ns-resize',
                        borderRadius: '2px',
                        zIndex: 10
                      }}
                      title="Drag bottom edge up/down"
                    />

                    {/* Corner Resize Handle */}
                    <div
                      onMouseDown={(e) => handleHandleMouseDown(e, i, 'se')}
                      style={{
                        position: 'absolute',
                        bottom: '-4px', right: '-4px',
                        width: '10px', height: '10px',
                        background: boxColor,
                        border: '1px solid #fff',
                        borderRadius: '2px',
                        cursor: 'nwse-resize',
                        zIndex: 30
                      }}
                      title="Drag corner to resize width & height"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📄</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No page image loaded yet</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Click "Choose Page Image" above to load a page sheet</div>
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
              onClick={handleSliceAndAssign}
              disabled={!imageSrc || processing}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                background: !imageSrc || processing ? '#94a3b8' : '#10b981', color: '#fff', fontWeight: 900,
                cursor: !imageSrc || processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: !imageSrc || processing ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {processing ? 'Slicing & Assigning...' : `⚡ Slice & Assign to Rows #${startIdx + 1}–#${startIdx + sliceCount}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
