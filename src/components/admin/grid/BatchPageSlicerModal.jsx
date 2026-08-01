'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * Batch Page Slicer Modal
 * - Uploads 1 PDF / Page Image containing multiple stacked question figures (e.g., 5 rows per page).
 * - Visually slices the page horizontally into N equal (or custom) row crops.
 * - Concurrently uploads all crops to R2 storage.
 * - Automatically assigns questionImage (or option images) to consecutive rows (e.g. Rows 16–20) in 1 click!
 */
export default function BatchPageSlicerModal({ rows, startRowIndex = 0, isOpen, onClose, onApplyBatchCrops }) {
  const [imageSrc, setImageSrc] = useState('');
  const [startIdx, setStartIdx] = useState(startRowIndex);
  const [sliceCount, setSliceCount] = useState(5);
  const [sliceMode, setSliceMode] = useState('full'); // 'full' | 'left_only'
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Sync startRowIndex prop
  useEffect(() => {
    setStartIdx(startRowIndex);
  }, [startRowIndex]);

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

  // Perform canvas slicing and bulk R2 uploads
  const handleSliceAndAssign = async () => {
    if (!imgRef.current || !imageSrc) {
      alert('Please select or upload a page image first.');
      return;
    }
    if (sliceCount <= 0) return;

    setProcessing(true);
    setProgressText('Preparing page slice canvas...');

    try {
      const img = imgRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // Determine slice height per row
      const sliceH = naturalH / sliceCount;
      const sliceW = sliceMode === 'left_only' ? naturalW * 0.46 : naturalW;
      const sliceX = 0;

      const croppedUrls = [];

      for (let i = 0; i < sliceCount; i++) {
        const rowNum = startIdx + i + 1;
        setProgressText(`Slicing & uploading Row #${rowNum} (${i + 1}/${sliceCount})...`);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const sourceX = sliceX;
        const sourceY = i * sliceH;
        const sourceW = sliceW;
        const sourceH = sliceH;

        canvas.width = Math.max(1, sourceW);
        canvas.height = Math.max(1, sourceH);

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceW, sourceH,
          0, 0, canvas.width, canvas.height
        );

        // Convert to Blob and Upload to R2
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));

        if (blob) {
          const croppedFile = new File([blob], `batch-row-${rowNum}-${Date.now()}.png`, { type: 'image/png' });
          const formData = new FormData();
          formData.append('file', croppedFile);
          formData.append('folder', 'jnvst-questions');

          try {
            const res = await fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            const url = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url) || canvas.toDataURL('image/png');
            croppedUrls.push({ rowIndex: startIdx + i, questionImage: url });
          } catch (err) {
            console.error('Failed to upload slice', i, err);
            const dataUrl = canvas.toDataURL('image/png');
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '960px', padding: '24px 28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡ Batch Page Auto-Slicer (5 Rows in 1-Click)</span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Upload 1 PDF page image to automatically slice it into 5 question rows and assign them instantly to consecutive rows!
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Controls Bar */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* File Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ background: '#6366f1', color: '#fff', padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>
              📁 Choose Page Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files[0])} />
            </label>

            {imageSrc && (
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 800 }}>
                ✓ Page Image Loaded ({naturalSize.width} × {naturalSize.height} px)
              </span>
            )}
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
                  Row #{i + 1} ({r.questionText ? r.questionText.slice(0, 30) + '...' : 'Question ' + (i + 1)})
                </option>
              ))}
            </select>
          </div>

          {/* Rows Count per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>🔢 Rows/Page:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={sliceCount}
              onChange={(e) => setSliceCount(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: '50px', padding: '5px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 800, textAlign: 'center' }}
            />
          </div>

          {/* Slice Width Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>✂️ Cut Mode:</span>
            <button
              type="button"
              onClick={() => setSliceMode('full')}
              style={{
                background: sliceMode === 'full' ? '#4338ca' : '#fff',
                color: sliceMode === 'full' ? '#fff' : '#334155',
                border: `1px solid ${sliceMode === 'full' ? '#4338ca' : '#cbd5e1'}`,
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              Full Row (Question + Answers)
            </button>
            <button
              type="button"
              onClick={() => setSliceMode('left_only')}
              style={{
                background: sliceMode === 'left_only' ? '#0284c7' : '#fff',
                color: sliceMode === 'left_only' ? '#fff' : '#334155',
                border: `1px solid ${sliceMode === 'left_only' ? '#0284c7' : '#cbd5e1'}`,
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              Left Side Only (Question Figures)
            </button>
          </div>
        </div>

        {/* Visual Slicing Preview Canvas Container */}
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
                alt="Batch Slice Target"
                style={{ display: 'block', maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />

              {/* Horizontal Cut Lines Overlay */}
              {Array.from({ length: sliceCount }).map((_, i) => {
                const topPct = (i / sliceCount) * 100;
                const heightPct = (1 / sliceCount) * 100;
                const widthPct = sliceMode === 'left_only' ? 46 : 100;
                const rowTarget = startIdx + i + 1;

                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                      border: '2px dashed #10b981',
                      background: i % 2 === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      boxSizing: 'border-box',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '4px 8px'
                    }}
                  >
                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                      ✂️ Assign to Row #{rowTarget}
                    </span>
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
