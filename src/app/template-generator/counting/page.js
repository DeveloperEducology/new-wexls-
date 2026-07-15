'use client';

import React, { useState, useRef } from 'react';
import BaseGeneratorLayout from '../components/BaseGeneratorLayout';

const COUNTING_PRESETS = [
  {
    name: '🦁 Count the Animals (Image Collection)',
    title: 'Counting Animals Collection',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'How many {{animal}}s do you see in the collection?\n[[blank1]]',
    solution: 'Step 1: Point to each {{animal}} and count them.\nStep 2: The count goes up to {{count}}.\nStep 3: There are {= count =} {{animal}}s!',
    placeholders: {
      count: '1-10',
      animal: 'lion, elephant, monkey, bear',
      image: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970163263-lion.png, https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781803349123-Elephant.png, https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781803351655-Monkey.png, https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/things/1780970141189-bear.png'
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
  },
  {
    name: '🖼️ Count on Ten Frame (Boxes & Dots)',
    title: 'Counting on Ten Frame',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'There are {{count}} circles on the frame. A full frame has 10 circles. How many more circles do you need to make 10?\n[[blank1]]',
    solution: 'Step 1: Count the circles on the ten frame. There are {{count}} circles.\nStep 2: A full frame holds 10 circles.\nStep 3: Subtract: 10 - {{count}} = {= 10 - count =}.\nStep 4: You need {= 10 - count =} more circles!',
    placeholders: {
      count: '1-9'
    },
    visualComponent: 'TenFrame',
    visualProps: {
      filledCount: 'count',
      crossedOutCount: '0',
      color: 'blue',
      frameCount: '1',
      shape: 'circle'
    }
  },
  {
    name: '🔺 Multiple Ten Frames with Triangles',
    title: 'Counting Triangles on Multiple Frames',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'How many triangles are on the frames?\n[[blank1]]',
    solution: 'Step 1: The first frame is full, which has 10 triangles.\nStep 2: The second frame has {{count2}} triangles.\nStep 3: Add them together: 10 + {{count2}} = {= 10 + count2 =}.\nStep 4: There are {= 10 + count2 =} triangles!',
    placeholders: {
      count2: '1-9'
    },
    visualComponent: 'TenFrame',
    visualProps: {
      filledCount: '10 + count2',
      crossedOutCount: '0',
      color: 'purple',
      frameCount: '2',
      shape: 'triangle'
    }
  },
  {
    name: '🟡 Tens & Ones Dot Counting (Tailored Shape)',
    title: 'Tens and Ones Dot Counting',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'Count the dots:\n\nThen fill in the missing numbers:\n[[blank1]] tens + [[blank2]] ones = {{count}}',
    solution: 'Step 1: Count the total number of dots. There are {{count}} dots.\nStep 2: Find the number of tens: {= Math.floor(count / 10) =}.\nStep 3: Find the number of ones: {= count % 10 =}.\nStep 4: Fill in the boxes: {= Math.floor(count / 10) =} tens + {= count % 10 =} ones = {{count}}',
    placeholders: {
      count: '1-19'
    },
    visualComponent: 'ItemCounter',
    visualProps: {
      count: 'count',
      itemType: 'circle',
      color: 'yellow',
      itemsPerRow: '5',
      groupByTens: true
    }
  },
  {
    name: '🖼️ Tens & Ones on Ten Frames',
    title: 'Tens and Ones on Ten Frames',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    blueprint: 'Count the dots:\n\nThen fill in the missing numbers:\n[[blank1]] tens + [[blank2]] ones = {{count}}',
    solution: 'Step 1: Count the total number of dots. There are {{count}} dots.\nStep 2: Find the number of tens: {= Math.floor(count / 10) =}.\nStep 3: Find the number of ones: {= count % 10 =}.\nStep 4: Fill in the boxes: {= Math.floor(count / 10) =} tens + {= count % 10 =} ones = {{count}}',
    placeholders: {
      count: '11-19'
    },
    visualComponent: 'TenFrame',
    visualProps: {
      filledCount: 'count',
      crossedOutCount: '0',
      color: 'blue',
      frameCount: '2',
      shape: 'circle'
    }
  },
  {
    name: '⚖️ Which group has fewer? (Visual MCQ)',
    title: 'Which group has fewer?',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    optionsType: 'visual_choice',
    layoutConfig: {
      columns: 2
    },
    blueprint: 'Which group has fewer?',
    solution: 'Step 1: Count the items in GROUP A. There are {{countA}} {{itemA}}s.\nStep 2: Count the items in GROUP B. There are {{countB}} {{itemB}}s.\nStep 3: Compare the counts: {{countA}} and {{countB}}.\nStep 4: {= countB =} is fewer than {= countA =}, so **GROUP B** has fewer.',
    placeholders: {
      countA: '5-8',
      countB: '2-4',
      itemA: 'apple, cupcake, star',
      itemB: 'apple, cupcake, star'
    },
    options: [
      { label: "GROUP A\n\n{= drawVisualChoicePanel(countA, itemA) =}", isCorrect: false },
      { label: "GROUP B\n\n{= drawVisualChoicePanel(countB, itemB) =}", isCorrect: true }
    ],
    visualComponent: 'none',
    visualProps: {}
  },
  {
    name: '🖼️ Which frame shows X? (Ten Frame MCQ)',
    title: 'Identify Ten Frame (MCQ)',
    subject: 'math',
    topic: 'counting',
    grade: '1',
    optionsType: 'visual_choice',
    layoutConfig: {
      columns: 2
    },
    blueprint: 'Which ten frame shows {{count}}?',
    solution: 'Step 1: The target number is {{count}}.\nStep 2: Look at each ten frame and count the dots.\nStep 3: Find the frame that has exactly {= count =} dots.\nStep 4: The correct option has {= count =} dots.',
    placeholders: {
      count: '3-8'
    },
    options: [
      { label: "Option A\n\n{= drawTenFrame(count, 0, 'blue') =}", isCorrect: true },
      { label: "Option B\n\n{= drawTenFrame(count - 1, 0, 'red') =}", isCorrect: false },
      { label: "Option C\n\n{= drawTenFrame(count + 1, 0, 'purple') =}", isCorrect: false },
      { label: "Option D\n\n{= drawTenFrame(count - 2, 0, 'green') =}", isCorrect: false }
    ],
    visualComponent: 'none',
    visualProps: {}
  }
];

export default function CountingGeneratorPage() {
  const [customName, setCustomName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e, placeholderValues, setPlaceholderValues) => {
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

        // Get current lists
        const currentAnimals = (placeholderValues.animal || '').split(',').map(s => s.trim()).filter(Boolean);
        const currentImages = (placeholderValues.image || '').split(',').map(s => s.trim()).filter(Boolean);

        // Append new item
        const updatedAnimals = [...currentAnimals, detectedName].join(', ');
        const updatedImages = [...currentImages, uploadedUrl].join(', ');

        setPlaceholderValues({
          ...placeholderValues,
          animal: updatedAnimals,
          image: updatedImages
        });

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

  const handleRemoveImage = (indexToRemove, placeholderValues, setPlaceholderValues) => {
    const currentAnimals = (placeholderValues.animal || '').split(',').map(s => s.trim()).filter(Boolean);
    const currentImages = (placeholderValues.image || '').split(',').map(s => s.trim()).filter(Boolean);

    currentAnimals.splice(indexToRemove, 1);
    currentImages.splice(indexToRemove, 1);

    setPlaceholderValues({
      ...placeholderValues,
      animal: currentAnimals.join(', '),
      image: currentImages.join(', ')
    });
  };

  return (
    <BaseGeneratorLayout
      title="🦁 Counting & Image Collection Builder"
      topic="counting"
      visualComponent="ItemCounter"
      presets={COUNTING_PRESETS}
      defaultVisualProps={{
        count: 'count',
        itemType: 'image',
        itemsPerRow: '5'
      }}
      customControls={({ visualProps, setVisualProps, placeholderValues, setPlaceholderValues, visualComponent, setVisualComponent, blueprint, setBlueprint, solution, setSolution }) => {
        const currentAnimals = (placeholderValues.animal || '').split(',').map(s => s.trim()).filter(Boolean);
        const currentImages = (placeholderValues.image || '').split(',').map(s => s.trim()).filter(Boolean);

        const itemsPool = [];
        const maxLen = Math.max(currentAnimals.length, currentImages.length);
        for (let i = 0; i < maxLen; i++) {
          itemsPool.push({
            name: currentAnimals[i] || `item_${i + 1}`,
            url: currentImages[i] || ''
          });
        }

        const isTenFrame = visualComponent === 'TenFrame';
        const isImageCollection = !isTenFrame && (visualProps.itemType === 'image' || !visualProps.itemType);

        const changeItemType = (newType) => {
          const oldType = visualProps.itemType || 'image';
          const oldPattern = new RegExp(`"${oldType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
          const newQuoted = `"${newType}"`;
          if (setBlueprint) setBlueprint(blueprint.replace(oldPattern, newQuoted));
          if (setSolution) setSolution(solution.replace(oldPattern, newQuoted));
          setVisualProps({ ...visualProps, itemType: newType });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Visual Display Mode</label>
                <select
                  value={visualComponent || 'ItemCounter'}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    setVisualComponent(selectedVal);
                    if (selectedVal === 'TenFrame') {
                      setVisualProps({
                        filledCount: 'count',
                        crossedOutCount: '0',
                        color: 'blue',
                        frameCount: '1',
                        shape: 'circle'
                      });
                    } else {
                      setVisualProps({
                        count: 'count',
                        itemType: 'image',
                        itemsPerRow: '5'
                      });
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', fontSize: '13px', fontWeight: 600 }}
                >
                  <option value="ItemCounter">🧁 Grid Counter (Cupcakes, Animals, etc.)</option>
                  <option value="TenFrame">🖼️ Ten Frame (Boxes & Dots)</option>
                </select>
              </div>

              {isTenFrame ? (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Frame Dot Color</label>
                  <select
                    value={visualProps.color || 'blue'}
                    onChange={(e) => setVisualProps({ ...visualProps, color: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                  >
                    <option value="blue">🔵 Gradient Blue</option>
                    <option value="red">🔴 Gradient Red</option>
                    <option value="green">🟢 Gradient Green</option>
                    <option value="yellow">🟡 Gradient Yellow</option>
                    <option value="pink">🌸 Gradient Pink</option>
                    <option value="purple">🟣 Gradient Purple</option>
                    <option value="orange">🟠 Gradient Orange</option>
                    <option value="black">⚫ Gradient Black</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Type</label>
                  <select
                    value={visualProps.itemType || 'image'}
                    onChange={(e) => changeItemType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                  >
                    <option value="image">🖼️ Image Collection Pool</option>
                    <option value="cupcake">🧁 Cupcake</option>
                    <option value="apple">🍎 Apple</option>
                    <option value="star">⭐ Star</option>
                    <option value="circle">🟡 Dot / Circle</option>
                    <optgroup label="── Stickers & Animals ──">
                      <option value="/images/rabbit.svg">🐰 Rabbit</option>
                      <option value="/images/penguin.svg">🐧 Penguin</option>
                      <option value="/images/elephant_sticker.png">🐘 Elephant</option>
                      <option value="/images/lion_sticker.png">🦁 Lion</option>
                      <option value="/drum_sticker.png">🥁 Drum</option>
                    </optgroup>
                  </select>
                </div>
              )}
            </div>

            {/* Additional parameters for Ten Frame */}
            {isTenFrame && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Frame Count</label>
                    <select
                      value={visualProps.frameCount || '1'}
                      onChange={(e) => setVisualProps({ ...visualProps, frameCount: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                    >
                      <option value="1">1 Frame (10 cells)</option>
                      <option value="2">2 Frames (20 cells)</option>
                      <option value="3">3 Frames (30 cells)</option>
                      <option value="4">4 Frames (40 cells)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Counter Shape</label>
                    <select
                      value={visualProps.shape || 'circle'}
                      onChange={(e) => setVisualProps({ ...visualProps, shape: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                    >
                      <option value="circle">🔵 Circle / Dot</option>
                      <option value="triangle">🔺 Triangle</option>
                      <option value="star">⭐ Star</option>
                      <option value="square">⬛ Square</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Crossed Out Count</label>
                    <input
                      type="text"
                      value={visualProps.crossedOutCount || '0'}
                      onChange={(e) => setVisualProps({ ...visualProps, crossedOutCount: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional parameters for Grid Counter */}
            {!isTenFrame && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Items Per Row</label>
                  <input
                    type="text"
                    value={visualProps.itemsPerRow || '5'}
                    onChange={(e) => setVisualProps({ ...visualProps, itemsPerRow: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}
                  />
                </div>
                {visualProps.itemType !== 'image' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Item Color</label>
                    <select
                      value={visualProps.color || 'yellow'}
                      onChange={(e) => setVisualProps({ ...visualProps, color: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
                    >
                      <option value="yellow">🟡 Gradient Yellow</option>
                      <option value="blue">🔵 Gradient Blue</option>
                      <option value="red">🔴 Gradient Red</option>
                      <option value="green">🟢 Gradient Green</option>
                      <option value="pink">🌸 Gradient Pink</option>
                      <option value="purple">🟣 Gradient Purple</option>
                      <option value="orange">🟠 Gradient Orange</option>
                      <option value="black">⚫ Gradient Black</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Display image collection manager only if Grid Counter & image type is active */}
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
                      onChange={(e) => handleImageUpload(e, placeholderValues, setPlaceholderValues)}
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
                  {itemsPool.map((item, idx) => (
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
                        onClick={() => handleRemoveImage(idx, placeholderValues, setPlaceholderValues)}
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
