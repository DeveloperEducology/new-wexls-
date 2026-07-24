'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import styles from './illustration-builder.module.css';

export default function IllustrationPromptBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('boy'); // 'boy', 'girl', 'man', 'woman', 'animal', 'object'
  
  // Custom properties
  const [subject, setSubject] = useState('a smiling boy with curly red hair');
  const [action, setAction] = useState('holding up two frying pans');
  const [style, setStyle] = useState('clean dark cartoon outlines');
  const [color, setColor] = useState('simple flat color fill');
  const [background, setBackground] = useState('solid light pastel teal background');
  const [copied, setCopied] = useState(false);
  const [assembledPrompt, setAssembledPrompt] = useState('');

  // Vertex AI image generation and DB saving states
  const [quality, setQuality] = useState('standard'); // 'low', 'standard', 'ultra'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedBase64, setGeneratedBase64] = useState('');
  const [originalBase64, setOriginalBase64] = useState('');
  const [removeBackground, setRemoveBackground] = useState(true);
  const [assetUrl, setAssetUrl] = useState('');
  const [assetName, setAssetName] = useState('smiling_boy_curly_red_hair');
  const [savedAsset, setSavedAsset] = useState(null);

  // Auto-generate clean asset name whenever subject changes
  useEffect(() => {
    const clean = subject.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 32);
    setAssetName(clean || 'clipart');
  }, [subject]);

  const transparentizeImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/png;base64,${base64Str}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        // Scan pixels. If R, G, B are all > 240, make it transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          
          if (r > 240 && g > 240 && b > 240) {
            data[i+3] = 0; // Alpha = 0
          }
        }
        
        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl.replace(/^data:image\/png;base64,/, ''));
      };
    });
  };

  useEffect(() => {
    if (!originalBase64) {
      setGeneratedBase64('');
      return;
    }
    if (removeBackground) {
      transparentizeImage(originalBase64).then(processed => {
        setGeneratedBase64(processed);
      });
    } else {
      setGeneratedBase64(originalBase64);
    }
  }, [removeBackground, originalBase64]);

  const handleGenerateImage = async () => {
    if (loading) return;
    setLoading(true);
    setGeneratedBase64('');
    setOriginalBase64('');
    setAssetUrl('');
    setSavedAsset(null);

    try {
      const res = await fetch('/api/admin/generate-clipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt: assembledPrompt, quality }),
      });
      const data = await res.json();
      if (data.success && data.base64Image) {
        setOriginalBase64(data.base64Image);
      } else {
        alert('Error generating image: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to generate image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!generatedBase64 || saving) return;
    setSaving(true);

    try {
      const res = await fetch('/api/admin/generate-clipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          prompt: assembledPrompt,
          base64Image: generatedBase64,
          name: assetName || 'clipart',
          category: selectedTemplate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssetUrl(data.url);
        setSavedAsset(data.asset);
        alert('Successfully saved image to database!');
      } else {
        alert('Error saving image: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to save image: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Preset Examples
  const presets = {
    two_pans: {
      template: 'boy',
      subject: 'a smiling boy with curly red hair',
      action: 'holding up two frying pans',
      style: 'clean dark cartoon outlines',
      color: 'simple flat color fill',
      background: 'solid light pastel teal background'
    },
    jam: {
      template: 'girl',
      subject: 'a little girl pointing',
      action: 'at a jar of strawberry jam on a table',
      style: 'clean outlines',
      color: 'solid cheerful colors',
      background: 'flat pastel yellow background'
    },
    hat: {
      template: 'animal',
      subject: 'a cute friendly cat',
      action: 'wearing a large blue hat',
      style: 'clean outlines',
      color: 'solid flat colors',
      background: 'pure white background'
    },
    log: {
      template: 'object',
      subject: 'a single brown log',
      action: 'resting flat on the grass',
      style: 'bold clean outlines',
      color: 'solid friendly colors',
      background: 'pure white background'
    }
  };

  const applyPreset = (presetKey) => {
    const p = presets[presetKey];
    if (p) {
      setSelectedTemplate(p.template);
      setSubject(p.subject);
      setAction(p.action);
      setStyle(p.style);
      setColor(p.color);
      setBackground(p.background);
    }
  };

  // Base Template defaults
  useEffect(() => {
    switch (selectedTemplate) {
      case 'boy':
        setSubject('a smiling boy with curly red hair');
        setAction('holding up two frying pans');
        setStyle('clean dark cartoon outlines');
        setColor('simple flat color fill');
        setBackground('solid light pastel teal background');
        break;
      case 'girl':
        setSubject('a little girl with a happy smile pointing');
        setAction('at a jar of strawberry jam on a table');
        setStyle('clean outlines');
        setColor('solid cheerful colors');
        setBackground('flat pastel yellow background');
        break;
      case 'man':
        setSubject('a friendly man wearing glasses smiling');
        setAction('holding a large wooden block');
        setStyle('clean dark outlines');
        setColor('simple flat colors');
        setBackground('solid light blue background');
        break;
      case 'woman':
        setSubject('a smiling woman with braided hair');
        setAction('reading a book under a big green tree');
        setStyle('child-friendly illustration outlines');
        setColor('solid bright colors');
        setBackground('light cream background');
        break;
      case 'animal':
        setSubject('a cute friendly cat');
        setAction('wearing a large blue hat');
        setStyle('clean outlines');
        setColor('solid flat colors');
        setBackground('pure white background');
        break;
      case 'object':
        setSubject('a single red apple');
        setAction('sitting on top of a brown wooden box');
        setStyle('bold clean outlines');
        setColor('solid primary colors');
        setBackground('pure white background');
        break;
    }
  }, [selectedTemplate]);

  // Re-assemble prompt whenever any parameter changes
  useEffect(() => {
    // Blueprint Template 1 for characters/actions, Template 2 for single objects
    if (selectedTemplate === 'object' || selectedTemplate === 'animal') {
      setAssembledPrompt(
        `Isolated flat 2D vector clipart of ${subject} ${action}, ${style}, ${color}, friendly child-friendly illustration style, ${background}, no gradients, vector icon`
      );
    } else {
      setAssembledPrompt(
        `Flat 2D vector clipart of ${subject} ${action}, ${style}, ${color}, friendly child illustration style, ${background}, high resolution, vector illustration`
      );
    }
    // Reset generation state on parameters change
    setGeneratedBase64('');
    setAssetUrl('');
    setSavedAsset(null);
  }, [subject, action, style, color, background, selectedTemplate, quality]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock colors for preview box
  const getBackgroundColorHex = () => {
    if (background.includes('teal')) return '#b2dfdb';
    if (background.includes('yellow')) return '#fef3c7';
    if (background.includes('cream') || background.includes('light cream')) return '#fafaf9';
    if (background.includes('blue')) return '#bae6fd';
    if (background.includes('pink')) return '#fbcfe8';
    return '#ffffff';
  };

  const getPreviewIcon = () => {
    if (selectedTemplate === 'boy') return '👦';
    if (selectedTemplate === 'girl') return '👧';
    if (selectedTemplate === 'man') return '👨';
    if (selectedTemplate === 'woman') return '👩';
    if (selectedTemplate === 'animal') return '🐱';
    return '🍎';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <SiteHeader />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>IXL-Style Prompt Builder</h1>
            <p>Design premium child-friendly vector clipart prompts following the official design recipe guidelines.</p>
          </div>
          <Link href="/admin/questions" className={styles.backBtn}>
            ← Question Manager
          </Link>
        </div>

        {/* Quick Presets */}
        <div className={styles.presetContainer}>
          <span className={styles.presetTitle}>💡 Quick Blueprints / Examples:</span>
          <div className={styles.presetGrid}>
            <div className={styles.presetCard} onClick={() => applyPreset('two_pans')}>
              <span className={styles.presetIcon}>🍳</span>
              <span className={styles.presetLabel}>"Two Frying Pans" (Boy)</span>
            </div>
            <div className={styles.presetCard} onClick={() => applyPreset('jam')}>
              <span className={styles.presetIcon}>🍓</span>
              <span className={styles.presetLabel}>"Strawberry Jam" (Girl)</span>
            </div>
            <div className={styles.presetCard} onClick={() => applyPreset('hat')}>
              <span className={styles.presetIcon}>🐱</span>
              <span className={styles.presetLabel}>"Cat Wearing Hat" (Animal)</span>
            </div>
            <div className={styles.presetCard} onClick={() => applyPreset('log')}>
              <span className={styles.presetIcon}>🪵</span>
              <span className={styles.presetLabel}>"Brown Log" (Object)</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className={styles.grid}>
          {/* Left Panel: Inputs */}
          <div className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span>⚙️</span> Configurator
            </h2>

            {/* Template Selector Tabs */}
            <div className={styles.formGroup}>
              <label>Select Template</label>
              <div className={styles.tabsContainer}>
                <button
                  className={`${styles.tabBtn} ${selectedTemplate === 'boy' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedTemplate('boy')}
                >
                  👦 Boy
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedTemplate === 'girl' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedTemplate('girl')}
                >
                  👧 Girl
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedTemplate === 'man' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedTemplate('man')}
                >
                  👨 Man
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedTemplate === 'woman' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedTemplate('woman')}
                >
                  👩 Woman
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedTemplate === 'animal' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedTemplate('animal')}
                >
                  🐻 Animal
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedTemplate === 'object' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedTemplate('object')}
                >
                  📦 Object
                </button>
              </div>
            </div>

            {/* Subject details */}
            <div className={styles.formGroup}>
              <label htmlFor="subject">Subject Description (Noun + Attributes)</label>
              <input
                id="subject"
                type="text"
                className={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., a smiling boy with curly red hair"
              />
            </div>

            {/* Action */}
            <div className={styles.formGroup}>
              <label htmlFor="actionPreset">Action Preset (Or Select & Customize)</label>
              <select
                id="actionPreset"
                className={styles.select}
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="custom">-- Custom (Type below) --</option>
                <option value="holding up two frying pans">🍳 Holding up two frying pans (Short-A)</option>
                <option value="pointing at a jar of strawberry jam on a table">🍓 Pointing at a jar of strawberry jam (Short-A)</option>
                <option value="wearing a large blue hat">🤠 Wearing a large blue hat (Short-A)</option>
                <option value="sitting cross-legged on a brown log">🪵 Sitting cross-legged on a brown log (Short-O)</option>
                <option value="jumping over a small blue puddle">💦 Jumping over a small blue puddle (Short-U)</option>
                <option value="running quickly on a green running track">🏃 Running quickly on a green running track</option>
                <option value="reading a storybook under a big green tree">📖 Reading a storybook under a big green tree</option>
                <option value="writing on a sheet of paper at a wooden desk">📝 Writing on a sheet of paper at a wooden desk</option>
                <option value="eating a slice of yellow cheese">🧀 Eating a slice of yellow cheese</option>
                <option value="counting colorful wooden beads on an abacus">🧮 Counting colorful wooden beads on an abacus</option>
                <option value="looking through a magnifying glass at a green leaf">🔍 Looking through a magnifying glass at a green leaf</option>
                <option value="holding a large bright red apple">🍎 Holding a large bright red apple</option>
                <option value="playing with a shiny blue toy train">🚂 Playing with a shiny blue toy train</option>
                <option value="sliding down a bright red playground slide">🛝 Sliding down a bright red playground slide</option>
                <option value="climbing up a tall wooden ladder">🪜 Climbing up a tall wooden ladder</option>
                <option value="pointing at a whiteboard showing the letter A">🔤 Pointing at a whiteboard showing the letter A</option>
                <option value="holding a large green crayon">🖍️ Holding a large green crayon</option>
                <option value="building a tower with colorful toy blocks">🧱 Building a tower with colorful toy blocks</option>
                <option value="riding a bright red bicycle with a helmet">🚲 Riding a bright red bicycle with a helmet</option>
                <option value="washing hands with soap at a white sink">🧼 Washing hands with soap at a white sink</option>
                <option value="brushing teeth with a blue toothbrush">🪥 Brushing teeth with a blue toothbrush</option>
                <option value="planting a small green seed in a flowerpot">🌱 Planting a small green seed in a flowerpot</option>
                <option value="flying a colorful diamond kite in the sky">🪁 Flying a colorful diamond kite in the sky</option>
                <option value="kicking a black and white soccer ball">⚽ Kicking a black and white soccer ball</option>
                <option value="catching a yellow tennis ball with a glove">🥎 Catching a yellow tennis ball with a glove</option>
                <option value="splashing in a pool of fresh water">🏊 Splashing in a pool of fresh water</option>
                <option value="feeding a cute little yellow chick">🐥 Feeding a cute little yellow chick</option>
                <option value="hugging a big brown teddy bear">🧸 Hugging a big brown teddy bear</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="action">Customize Action Description</label>
              <input
                id="action"
                type="text"
                className={styles.input}
                value={action === 'custom' ? '' : action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="e.g., holding up two frying pans"
              />
            </div>

            {/* Style Outlines */}
            <div className={styles.formGroup}>
              <label htmlFor="style">Outline / Line Style</label>
              <select
                id="style"
                className={styles.select}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="clean dark cartoon outlines">Clean Dark Cartoon Outlines (Recommended)</option>
                <option value="bold clean outlines">Bold Clean Outlines</option>
                <option value="child-friendly illustration outlines">Child-Friendly Outlines</option>
                <option value="clean outlines">Clean Outlines</option>
                <option value="thick black lines">Thick Black Outlines</option>
              </select>
            </div>

            {/* Color fill */}
            <div className={styles.formGroup}>
              <label htmlFor="color">Color Fill Style</label>
              <select
                id="color"
                className={styles.select}
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                <option value="simple flat color fill">Simple Flat Color Fill (Recommended)</option>
                <option value="solid cheerful colors">Solid Cheerful Colors</option>
                <option value="solid flat colors">Solid Flat Colors</option>
                <option value="solid primary colors">Solid Primary Colors</option>
                <option value="soft bright color tones">Soft Bright Color Tones</option>
              </select>
            </div>

            {/* Background */}
            <div className={styles.formGroup}>
              <label htmlFor="background">Background Setup</label>
              <select
                id="background"
                className={styles.select}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              >
                <option value="solid light pastel teal background">Light Pastel Teal (#b2dfdb)</option>
                <option value="flat pastel yellow background">Pastel Yellow (#fef3c7)</option>
                <option value="solid light blue background">Soft Pastel Blue (#bae6fd)</option>
                <option value="light cream background">Light Cream (#fafaf9)</option>
                <option value="pure white background">Isolated White (#ffffff)</option>
              </select>
            </div>

            {/* Quality & Cost (INR) Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="quality">Image Quality & Cost (INR)</label>
              <select
                id="quality"
                className={styles.select}
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="low">⚡ Low / Fast (Cost: ~₹1.67 INR / image)</option>
                <option value="standard">✨ Standard (Cost: ~₹2.50 INR / image)</option>
                <option value="ultra">🌟 Ultra / High (Cost: ~₹5.00 INR / image)</option>
              </select>
            </div>

            {/* Transparent Background Option */}
            <div className={styles.formGroup} style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #bfdbfe', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 800, color: '#1e40af', cursor: 'pointer', margin: 0, userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={removeBackground}
                  onChange={(e) => setRemoveBackground(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                ✨ Transparent background (Removes white)
              </label>
              <span style={{ fontSize: '0.75rem', color: '#1e3a8a', display: 'block', marginTop: '4px', fontWeight: 500 }}>
                💡 Tip: Use "Isolated White" background for best results.
              </span>
            </div>
          </div>

          {/* Right Panel: Output & Visual Mockup */}
          <div className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span>📋</span> Prompt Output
            </h2>

            {/* Textarea Area */}
            <div className={styles.promptOutputArea}>
              <textarea
                readOnly
                className={styles.promptTextarea}
                value={assembledPrompt}
              />
              <button
                type="button"
                className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? '✓ Copied!' : '📋 Copy Prompt'}
              </button>
            </div>

            {/* Generate Image Button */}
            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleGenerateImage}
              disabled={loading || !assembledPrompt.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Generating illustration... (takes ~15s)
                </>
              ) : (
                <>
                  <span>✨</span> Generate Illustration (Vertex AI)
                </>
              )}
            </button>

            {/* Live Visual Clipart Mockup Preview */}
            <h3 className={styles.sectionTitle} style={{ marginTop: '32px' }}>
              <span>🎨</span> Stylized Clipart Mockup
            </h3>
            <div className={styles.previewContainer}>
              <div
                className={styles.previewMockup}
                style={{
                  backgroundColor: getBackgroundColorHex(),
                  border: '3px solid #1e293b'
                }}
              >
                {generatedBase64 ? (
                  <img
                    src={`data:image/png;base64,${generatedBase64}`}
                    alt="Generated Illustration Preview"
                    className={styles.previewImage}
                  />
                ) : (
                  getPreviewIcon()
                )}
                <span className={styles.previewLabel}>
                  {generatedBase64 ? 'Generated Asset' : 'Clipart Preview'}
                </span>
              </div>
              
              {/* Save Section */}
              {generatedBase64 && (
                <div className={styles.saveSection}>
                  <div className={styles.formGroup} style={{ marginBottom: '12px', width: '100%', textAlign: 'left' }}>
                    <label htmlFor="saveName" style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '6px' }}>
                      Asset File Name
                    </label>
                    <input
                      id="saveName"
                      type="text"
                      className={styles.input}
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}
                      placeholder="e.g. happy_cat"
                      style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                      disabled={saving || !!assetUrl}
                    />
                  </div>
                  {assetUrl ? (
                    <div className={styles.saveStatus}>
                      🎉 Saved successfully! URL: <a href={assetUrl} target="_blank" rel="noreferrer" style={{ color: '#059669', textDecoration: 'underline' }}>{assetUrl}</a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={handleSaveImage}
                      disabled={saving || !generatedBase64}
                    >
                      {saving ? '💾 Saving to Assets DB...' : '💾 Save to Database / Assets'}
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className={styles.paletteBadge}>Style: Flat Vector</span>
                <span className={styles.paletteBadge}>Outlines: Dark Cartoon</span>
                <span className={styles.paletteBadge}>Faces: Friendly Dot-Eyes</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0', maxWidth: '340px' }}>
                {generatedBase64 
                  ? 'Your custom vector clipart has been generated successfully using Google Imagen 3! Set a file name and click "Save to Database / Assets" to register the file.'
                  : 'This is a visual preview mock of how your character will be positioned on the chosen background. Click "Generate Illustration" to generate the asset using Google Vertex AI.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
