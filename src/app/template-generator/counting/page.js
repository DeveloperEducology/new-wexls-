'use client';

import React, { useState, useRef, useEffect } from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const DEFAULT_ANIMAL_POOL = [
  { name: 'lion', url: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970163263-lion.png' },
  { name: 'elephant', url: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781803349123-Elephant.png' },
  { name: 'monkey', url: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781803351655-Monkey.png' },
  { name: 'bear', url: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970141189-bear.png' }
];

const COUNTING_PRESETS = [
  {
    name: '🦁 Count the Animals (Image Collection)',
    title: 'Counting Animals Collection',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'How many {{animalName}}s do you see in the collection?\n[[blank1]]',
    solution: 'Step 1: Point to each {{animalName}} and count them.\nStep 2: The count goes up to {{count}}.\nStep 3: There are {= count =} {{animalName}}s!',
    placeholders: {
      count: '1-10'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'count',
      itemType: 'image',
      itemsPerRow: '5'
    }
  },
  {
    name: '🧁 Count the Cupcakes (Default Visual)',
    title: 'Counting Cupcakes',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'How many cupcakes do you see?\n[[blank1]]',
    solution: 'Step 1: Count the cupcakes in the rows: 1, 2, 3... {{count}}.\nStep 2: There are {= count =} cupcakes!',
    placeholders: {
      count: '1-15'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'count',
      itemType: 'cupcake',
      itemsPerRow: '5'
    }
  }
];

export default function CountingGeneratorPage() {
  const [imagePool, setImagePool] = useState(DEFAULT_ANIMAL_POOL);
  const [customName, setCustomName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (Array.isArray(data.results) && data.results.length > 0) {
        const uploadedUrl = data.results[0].url;
        const detectedName = customName.trim() || data.results[0].tags?.singular || 'item';

        // Add to pool state
        setImagePool(prev => [...prev, { name: detectedName, url: uploadedUrl }]);
        setCustomName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errorText = Array.isArray(data.errors) && data.errors[0]?.error
          ? data.errors[0].error
          : (data.error || 'Upload failed.');
        setUploadError(errorText);
      }
    } catch (err) {
      setUploadError(err.message || 'Network upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImagePool(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const extraVariables = [];
  if (imagePool.length > 0) {
    extraVariables.push(
      {
        name: 'animal',
        type: 'choice',
        pool: imagePool
      },
      {
        name: 'animalName',
        type: 'expression',
        formula: 'animal.name'
      },
      {
        name: 'imageUrl',
        type: 'expression',
        formula: 'animal.url'
      }
    );
  }

  return (
    <BaseGeneratorLayout
      title="🦁 Counting & Image Collection Builder"
      topic="counting"
      visualComponent="ItemCounter"
      presets={COUNTING_PRESETS}
      extraVariables={extraVariables}
      defaultVisualProps={{
        count: 'count',
        itemType: 'image',
        itemsPerRow: '5'
      }}
      customControls={({ visualProps, setVisualProps }) => {
        const isImageCollection = visualProps.itemType === 'image';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Type</label>
                <select
                  value={visualProps.itemType || 'image'}
                  onChange={(e) => {
                    const type = e.target.value;
                    setVisualProps({ 
                      ...visualProps, 
                      itemType: type,
                      // Automatically set count visual prop to imageUrl if using image collection
                      count: type === 'image' ? '[imageUrl]' : 'count'
                    });
                    if (type !== 'image') {
                      setImagePool([]);
                    } else {
                      setImagePool(DEFAULT_ANIMAL_POOL);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                >
                  <option value="image">🖼️ Image Collection Pool</option>
                  <option value="cupcake">🧁 Cupcake</option>
                  <option value="apple">🍎 Apple</option>
                  <option value="star">⭐ Star</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Items Per Row</label>
                <input
                  type="text"
                  value={visualProps.itemsPerRow || '5'}
                  onChange={(e) => setVisualProps({ ...visualProps, itemsPerRow: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Frame (Border Box)</label>
                <select
                  value={visualProps.showBorder || 'false'}
                  onChange={(e) => setVisualProps({ ...visualProps, showBorder: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                >
                  <option value="false">❌ No Frame</option>
                  <option value="true">✅ Show Frame</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Count Variable</label>
                <input
                  type="text"
                  value={visualProps.count || 'count'}
                  onChange={(e) => setVisualProps({ ...visualProps, count: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Display image collection manager only if visual type is image */}
            {isImageCollection && (
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #edf2f7',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <label style={{ fontWeight: 800, fontSize: '13px', color: '#475569' }}>
                  🖼️ Manage Image Collection Pool
                </label>

                {/* Upload Section */}
                <div style={{
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter item name (e.g. tiger)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '12.5px' }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {uploading ? 'Uploading...' : '📁 Upload Image'}
                    </button>
                  </div>
                  {uploadError && (
                    <div style={{ color: '#dc2626', fontSize: '11px', fontWeight: 600 }}>⚠️ {uploadError}</div>
                  )}
                </div>

                {/* Pool Grid List */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {imagePool.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative'
                      }}
                    >
                      {/* Delete icon */}
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>

                      {/* Thumbnail */}
                      {item.url ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '4px' }} />
                      )}
                      
                      {/* Label */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        maxWidth: '70px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
