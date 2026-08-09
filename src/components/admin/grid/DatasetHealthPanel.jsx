'use client';

import React, { useMemo } from 'react';

export default function DatasetHealthPanel({
  columns = [],
  rows = [],
  onAutoBalanceLevels,
  onRemoveDuplicates,
  onTriggerAiFix
}) {
  const healthMetrics = useMemo(() => {
    if (!rows || rows.length === 0) {
      return {
        overallScore: 0,
        completeness: 0,
        uniqueness: 100,
        difficultyBalance: 0,
        distractorQuality: 0,
        mediaCoverage: 100,
        accessibility: 0,
        duplicateCount: 0,
        emptyCellCount: 0,
        weakDistractorCount: 0
      };
    }

    const totalRows = rows.length;

    // 1. Completeness: % of non-empty cells
    let totalCells = 0;
    let filledCells = 0;
    let emptyCells = 0;

    // 2. Uniqueness & Duplicate Check
    const rowHashes = new Set();
    let duplicateRows = 0;

    // 3. Difficulty Balance
    const levelCounts = { l1: 0, l2: 0, l3: 0, l4: 0 };

    // 4. Distractor Quality Check
    let validDistractorRows = 0;
    let weakDistractorRows = 0;

    // 5. Media & Accessibility
    const hasImageCol = columns.some(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('figure'));
    const hasAudioCol = columns.some(c => c.toLowerCase().includes('audio') || c.toLowerCase().includes('sound') || c.toLowerCase().includes('tts'));
    
    let rowsWithImage = 0;
    let rowsWithAudio = 0;

    rows.forEach((row) => {
      if (!row) return;
      // Check level
      const lvl = row._level || 'l1';
      if (levelCounts[lvl] !== undefined) levelCounts[lvl]++;

      // Check row duplicate
      const rowKey = JSON.stringify(
        Object.keys(row)
          .filter(k => k !== '_id' && k !== '_level')
          .map(k => String(row[k] || '').trim().toLowerCase())
      );
      if (rowHashes.has(rowKey)) {
        duplicateRows++;
      } else {
        rowHashes.add(rowKey);
      }

      // Check completeness
      columns.forEach(col => {
        if (col === '_id') return;
        totalCells++;
        const val = row[col];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          filledCells++;
        } else {
          emptyCells++;
        }
      });

      // Check distractor quality (distractors should exist, be non-empty, and not equal correct answer)
      const resVal = String(row.Result || row.result || row.target_word || '').trim().toLowerCase();
      const distractorKeys = columns.filter(c => c.toLowerCase().includes('distractor') || c.toLowerCase().includes('option'));
      
      let goodDistractors = 0;
      const seenDistractors = new Set([resVal]);

      distractorKeys.forEach(k => {
        const dVal = String(row[k] || '').trim().toLowerCase();
        if (dVal && !seenDistractors.has(dVal)) {
          goodDistractors++;
          seenDistractors.add(dVal);
        }
      });

      if (distractorKeys.length > 0 && goodDistractors >= Math.min(2, distractorKeys.length)) {
        validDistractorRows++;
      } else {
        weakDistractorRows++;
      }

      // Check media & audio
      if (hasImageCol) {
        const imgCol = columns.find(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('figure'));
        if (imgCol && row[imgCol] && String(row[imgCol]).startsWith('http')) {
          rowsWithImage++;
        }
      }

      if (hasAudioCol) {
        const audCol = columns.find(c => c.toLowerCase().includes('audio') || c.toLowerCase().includes('sound') || c.toLowerCase().includes('tts'));
        if (audCol && row[audCol] && String(row[audCol]).trim().length > 0) {
          rowsWithAudio++;
        }
      }
    });

    const completenessPct = Math.round((filledCells / Math.max(1, totalCells)) * 100);
    const uniquenessPct = Math.round(((totalRows - duplicateRows) / totalRows) * 100);

    // Ideal level balance = 25% for each of the 4 levels
    const targetPerLevel = totalRows / 4;
    const levelDiffSum = Object.values(levelCounts).reduce((acc, count) => acc + Math.abs(count - targetPerLevel), 0);
    const maxDiffPossible = totalRows * 1.5;
    const difficultyPct = Math.max(0, Math.round(100 - (levelDiffSum / Math.max(1, maxDiffPossible)) * 100));

    const distractorPct = Math.round((validDistractorRows / totalRows) * 100);
    const mediaPct = hasImageCol ? Math.round((rowsWithImage / totalRows) * 100) : 100;
    const accessPct = hasAudioCol ? Math.round((rowsWithAudio / totalRows) * 100) : Math.round((completenessPct * 0.7) + (uniquenessPct * 0.3));

    // Weighted Overall Score
    const overallScore = Math.round(
      completenessPct * 0.25 +
      uniquenessPct * 0.20 +
      difficultyPct * 0.20 +
      distractorPct * 0.20 +
      mediaPct * 0.08 +
      accessPct * 0.07
    );

    return {
      overallScore,
      completeness: completenessPct,
      uniqueness: uniquenessPct,
      difficultyBalance: difficultyPct,
      distractorQuality: distractorPct,
      mediaCoverage: mediaPct,
      accessibility: accessPct,
      duplicateCount: duplicateRows,
      emptyCellCount: emptyCells,
      weakDistractorCount: weakDistractorRows,
      levelCounts
    };
  }, [columns, rows]);

  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'A+ Production Ready', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🟢' };
    if (score >= 75) return { label: 'B+ High Quality', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '🔵' };
    if (score >= 60) return { label: 'C Moderate Quality', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '🟡' };
    return { label: 'Incomplete / Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🔴' };
  };

  const badge = getScoreBadge(healthMetrics.overallScore);

  const renderProgressBar = (label, pct, icon, subtitle) => {
    let barColor = '#10b981';
    if (pct < 60) barColor = '#ef4444';
    else if (pct < 80) barColor = '#f59e0b';

    return (
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{icon}</span> {label}
          </span>
          <span style={{ fontWeight: 900, color: barColor }}>{pct}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
        </div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{subtitle}</div>}
      </div>
    );
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: '24px',
      border: '1.5px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      marginBottom: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header & Overall Score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊 Dataset Health & Quality Audit</span>
            <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
              {rows.length} Rows
            </span>
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Real-time quality metrics for publisher-grade dynamic templates.
          </p>
        </div>

        {/* Overall Score Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: badge.bg, border: `1px solid ${badge.color}`, padding: '10px 18px', borderRadius: '16px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: badge.color, lineHeight: 1 }}>
            {healthMetrics.overallScore}%
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>Dataset Score</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: badge.color }}>{badge.label}</div>
          </div>
        </div>
      </div>

      {/* Progress Bars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div>
          {renderProgressBar('Completeness', healthMetrics.completeness, '📋', healthMetrics.emptyCellCount > 0 ? `${healthMetrics.emptyCellCount} empty cells found` : 'All cells filled')}
          {renderProgressBar('Duplicate Check', healthMetrics.uniqueness, '🔍', healthMetrics.duplicateCount > 0 ? `⚠️ ${healthMetrics.duplicateCount} duplicate rows detected` : '100% unique rows')}
        </div>

        <div>
          {renderProgressBar('Difficulty Balance', healthMetrics.difficultyBalance, '⚖️', `L1: ${healthMetrics.levelCounts?.l1 || 0} | L2: ${healthMetrics.levelCounts?.l2 || 0} | L3: ${healthMetrics.levelCounts?.l3 || 0} | L4: ${healthMetrics.levelCounts?.l4 || 0}`)}
          {renderProgressBar('Distractor Quality', healthMetrics.distractorQuality, '🧠', healthMetrics.weakDistractorCount > 0 ? `⚠️ ${healthMetrics.weakDistractorCount} rows need misconception distractors` : 'High distractor discrimination')}
        </div>

        <div>
          {renderProgressBar('Media & Figure Coverage', healthMetrics.mediaCoverage, '🖼️', 'Images & figure paths validated')}
          {renderProgressBar('Accessibility & Audio', healthMetrics.accessibility, '🎧', 'TTS audio & text alternatives')}
        </div>
      </div>

      {/* Quick 1-Click Fix Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginRight: '6px' }}>⚡ 1-Click Auto-Fix Actions:</span>
        
        {healthMetrics.duplicateCount > 0 && onRemoveDuplicates && (
          <button
            onClick={onRemoveDuplicates}
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            ✂️ Remove {healthMetrics.duplicateCount} Duplicate Rows
          </button>
        )}

        {healthMetrics.difficultyBalance < 80 && onAutoBalanceLevels && (
          <button
            onClick={onAutoBalanceLevels}
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            ⚖️ Auto-Balance L1–L4 Difficulty
          </button>
        )}

        {healthMetrics.weakDistractorCount > 0 && onTriggerAiFix && (
          <button
            onClick={onTriggerAiFix}
            style={{ background: '#d97706', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            🤖 AI Upgrade {healthMetrics.weakDistractorCount} Weak Distractors
          </button>
        )}

        {healthMetrics.duplicateCount === 0 && healthMetrics.difficultyBalance >= 80 && healthMetrics.weakDistractorCount === 0 && (
          <span style={{ color: '#166534', fontSize: '0.85rem', fontWeight: 800 }}>
            🎉 No automatic fixes needed! Your dataset is in peak health.
          </span>
        )}
      </div>
    </div>
  );
}
