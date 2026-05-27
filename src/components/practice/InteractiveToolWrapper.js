'use client';

import React, { useRef, useState, useEffect } from 'react';
import { getSvgTool } from '@/lib/practice/svgTools';
import styles from './FactoryLayout.module.css';

export default function InteractiveToolWrapper({
  toolId,
  toolProps = {},
  userAnswer,
  onAnswer,
  isAnswered = false
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentVal, setCurrentVal] = useState(null);

  // Retrieve tool registry configuration
  const dummyTool = getSvgTool(toolId, toolProps);
  const spec = dummyTool?.interactiveSpec;

  // Resolve current value from user answer or default props
  useEffect(() => {
    if (!spec) return;
    const ansKey = spec.valKey;
    
    let resolvedVal = null;
    if (userAnswer !== undefined && userAnswer !== null) {
      if (typeof userAnswer === 'object') {
        const val = userAnswer.ans ?? userAnswer.answer ?? userAnswer.value ?? userAnswer[ansKey];
        resolvedVal = val !== undefined ? Number(val) : null;
      } else {
        resolvedVal = Number(userAnswer);
      }
    }
    
    if (resolvedVal === null || isNaN(resolvedVal)) {
      resolvedVal = Number(toolProps[ansKey] ?? dummyTool?.defaultProps?.[ansKey] ?? 0);
    }
    
    setCurrentVal(resolvedVal);
  }, [userAnswer, toolProps, spec, dummyTool]);

  if (!spec) {
    // If not interactive, render simple static SVG tool
    const tool = getSvgTool(toolId, toolProps);
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: tool?.svg || '' }} 
        style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }} 
      />
    );
  }

  // Handle pointer down
  const handlePointerDown = (e) => {
    if (isAnswered) return;
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  // Handle pointer move
  const handlePointerMove = (e) => {
    if (!isDragging && e.type !== 'pointerdown') return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Convert screen coordinates to SVG viewBox coords (0 0 240 160)
    const viewBoxW = 240;
    const viewBoxH = 160;
    const svgX = ((clientX - rect.left) / rect.width) * viewBoxW;
    const svgY = ((clientY - rect.top) / rect.height) * viewBoxH;

    let newVal = 0;
    if (spec.type === 'linear-vertical') {
      const min = typeof spec.min === 'number' ? spec.min : (toolProps[spec.minKey] ?? dummyTool?.defaultProps?.[spec.minKey] ?? 0);
      const max = typeof spec.max === 'number' ? spec.max : (toolProps[spec.maxKey] ?? dummyTool?.defaultProps?.[spec.maxKey] ?? 100);
      
      const ratio = (spec.yMin - svgY) / (spec.yMin - spec.yMax);
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const rawVal = min + clampedRatio * (max - min);

      let step = spec.step ?? 1;
      if (spec.valKey === 'level' && !spec.step) {
        const capacity = toolProps.capacity ?? 1000;
        step = capacity === 250 ? 25 : capacity === 500 ? 50 : 100;
      }

      // Round to step, but handle decimal steps (like 0.25) correctly
      newVal = Math.round(rawVal / step) * step;
      if (step % 1 !== 0) {
        newVal = Number(newVal.toFixed(2));
      }
    } else if (spec.type === 'linear-horizontal') {
      const min = typeof spec.min === 'number' ? spec.min : (toolProps[spec.minKey] ?? dummyTool?.defaultProps?.[spec.minKey] ?? 0);
      const max = typeof spec.max === 'number' ? spec.max : (toolProps[spec.maxKey] ?? dummyTool?.defaultProps?.[spec.maxKey] ?? 100);
      
      const ratio = (svgX - spec.xMin) / (spec.xMax - spec.xMin);
      const clampedRatio = Math.max(0, Math.min(1, ratio));
      const rawVal = min + clampedRatio * (max - min);

      const step = spec.step ?? 1;
      newVal = Math.round(rawVal / step) * step;
      if (step % 1 !== 0) {
        newVal = Number(newVal.toFixed(2));
      }
    } else if (spec.type === 'angular') {
      const dx = svgX - spec.centerX;
      const dy = svgY - spec.centerY;
      let angleRad = Math.atan2(dy, dx);
      let angle = angleRad + Math.PI / 2; // offset starting from top
      if (angle < 0) angle += 2 * Math.PI;

      const ratio = angle / (2 * Math.PI);
      const rawSeconds = ratio * (spec.max - spec.min);
      newVal = Math.round(rawSeconds);
    } else if (spec.type === 'protractor-angular') {
      const dx = svgX - spec.centerX;
      const dy = -(svgY - spec.centerY); // flip Y axis since SVG is y-down
      let angleRad = Math.atan2(dy, dx);
      if (angleRad < 0) angleRad += 2 * Math.PI;
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      if (angleDeg > 180) {
        angleDeg = angleDeg > 270 ? 0 : 180;
      }
      const step = spec.step ?? 1;
      newVal = Math.round(angleDeg / step) * step;
    }

    setCurrentVal(newVal);

    // Sync answer back to parent form block
    const updatedAnswer = typeof userAnswer === 'object' 
      ? { ...userAnswer, ans: String(newVal), answer: String(newVal), [spec.valKey]: String(newVal) }
      : String(newVal);
    
    onAnswer(updatedAnswer);
  };

  // Handle pointer up
  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  // Get dynamic tool SVG string based on current interactive state
  const interactiveProps = {
    ...toolProps,
    showAngle: true,
    showRadius: true,
    showTemperature: true,
    showVolume: true,
    showTime: true,
    showWeights: true,
    showValue: true,
    [spec.valKey]: currentVal !== null ? currentVal : toolProps[spec.valKey]
  };
  const activeTool = getSvgTool(toolId, interactiveProps);

  return (
    <div
      ref={containerRef}
      className={styles.responsiveSvg}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: '100%',
        maxWidth: 640,
        margin: '0 auto',
        touchAction: 'none', // Prevents page scroll while dragging
        cursor: isAnswered ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        userSelect: 'none',
        position: 'relative'
      }}
    >
      {/* Dynamic SVG container */}
      <div 
        dangerouslySetInnerHTML={{ __html: activeTool?.svg || '' }} 
        style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center', width: '100%' }} 
      />

      {/* Touch slider/indicator indicator inside interactive tool wrapper */}
      {!isAnswered && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: '#10b981',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 900,
          padding: '3px 6px',
          borderRadius: 6,
          boxShadow: '0 4px 8px rgba(16, 185, 129, 0.25)',
          animation: 'pulse 2s infinite'
        }}>
          DRAG ME
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
