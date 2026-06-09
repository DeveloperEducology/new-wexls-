'use client';

import React, { useState, useRef } from 'react';
import styles from './FactoryLayout.module.css';

// SVG components to render high-fidelity Montessori materials
export function GoldenBeadUnitSvg({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="beadGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="40%" stopColor="#ffb300" />
          <stop offset="85%" stopColor="#ff8f00" />
          <stop offset="100%" stopColor="#e65100" />
        </radialGradient>
        <filter id="beadShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="16" cy="16" r="12" fill="url(#beadGrad)" filter="url(#beadShadow)" />
      {/* Wire loop highlights */}
      <circle cx="16" cy="16" r="12" stroke="#ffeb3b" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M16 4v2M16 26v2" stroke="#b0bec5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GoldenBeadTenSvg({ width = 28, height = 150 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 32 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="beadGradTen" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="40%" stopColor="#ffb300" />
          <stop offset="85%" stopColor="#ff8f00" />
          <stop offset="100%" stopColor="#e65100" />
        </radialGradient>
        <filter id="tenShadow" x="-10%" y="-5%" width="120%" height="110%">
          <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" floodOpacity="0.3" />
        </filter>
      </defs>
      {/* Central copper wire */}
      <line x1="16" y1="10" x2="16" y2="190" stroke="#cfd8dc" strokeWidth="3" strokeLinecap="round" />
      <g filter="url(#tenShadow)">
        {[...Array(10)].map((_, i) => (
          <circle key={i} cx="16" cy={20 + i * 18} r="9.5" fill="url(#beadGradTen)" />
        ))}
      </g>
      {/* Metal loop ends */}
      <path d="M14 10a2 2 0 114 0M14 190a2 2 0 114 0" stroke="#90a4ae" strokeWidth="2" />
    </svg>
  );
}

export function NumberRodSvg({ length = 5, segmentWidth = 24, height = 20 }) {
  const width = length * segmentWidth;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} 24`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="rodShadow" x="-5%" y="-10%" width="110%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodOpacity="0.25" />
        </filter>
        <linearGradient id="woodGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <g filter="url(#rodShadow)">
        {[...Array(length)].map((_, i) => {
          const isRed = i % 2 === 0;
          return (
            <rect
              key={i}
              x={i * segmentWidth}
              y="2"
              width={segmentWidth}
              height="20"
              fill={isRed ? '#ef4444' : '#3b82f6'}
              stroke="#ffffff"
              strokeWidth="0.5"
              rx="1.5"
            />
          );
        })}
        {/* Shiny veneer overlay for wood texture feel */}
        <rect x="0" y="2" width={width} height="20" fill="url(#woodGlow)" rx="1.5" style={{ mixBlendMode: 'multiply' }} />
      </g>
    </svg>
  );
}

export default function MontessoriTray({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const workspaceRef = useRef(null);
  const dragInfo = useRef({ itemId: null, startX: 0, startY: 0, startItemX: 0, startItemY: 0 });

  if (!isOpen) return null;

  // Add manipulative to workspace
  const spawnItem = (type, value = 1) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    // Position spawned item randomly near the top left of the workspace
    const newItem = {
      id,
      type,
      value,
      x: 30 + Math.random() * 50,
      y: 30 + Math.random() * 40,
    };
    
    setItems((prev) => [...prev, newItem]);
    setSelectedId(id);
  };

  // Clear workspace items
  const clearWorkspace = () => {
    setItems([]);
    setSelectedId(null);
  };

  // Remove selected item
  const deleteSelected = () => {
    if (selectedId) {
      setItems((prev) => prev.filter(item => item.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Drag start handler
  const handlePointerDown = (e, item) => {
    e.stopPropagation();
    setSelectedId(item.id);
    
    const rect = workspaceRef.current.getBoundingClientRect();
    dragInfo.current = {
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      startItemX: item.x,
      startItemY: item.y
    };
    
    e.target.setPointerCapture(e.pointerId);
  };

  // Pointer move handler
  const handlePointerMove = (e) => {
    const { itemId, startX, startY, startItemX, startItemY } = dragInfo.current;
    if (!itemId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        
        // Boundaries checks relative to a 260px workspace height
        let newX = startItemX + dx;
        let newY = startItemY + dy;
        
        // Clamp bounds
        newX = Math.max(10, Math.min(620, newX));
        newY = Math.max(10, Math.min(220, newY));

        return { ...item, x: newX, y: newY };
      })
    );
  };

  // Pointer up handler
  const handlePointerUp = (e) => {
    if (dragInfo.current.itemId) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      dragInfo.current = { itemId: null, startX: 0, startY: 0, startItemX: 0, startItemY: 0 };
    }
  };

  return (
    <div className={styles.montessoriContainer}>
      <div className={styles.montessoriWorkspaceHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '18px' }}>🧮</span>
          <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.03em', color: '#5c4033' }}>
            MONTESSORI LEARNING CABINET
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {selectedId && (
            <button
              type="button"
              onClick={deleteSelected}
              className={styles.montessoriActionBtn}
              style={{ background: '#fee2e2', color: '#ef4444', border: '1.5px solid #fecaca' }}
              title="Delete Selected Item"
            >
              🗑️ Put Away
            </button>
          )}
          <button
            type="button"
            onClick={clearWorkspace}
            className={styles.montessoriActionBtn}
            style={{ background: '#fffbeb', color: '#d97706', border: '1.5px solid #fef3c7' }}
          >
            🧹 Clear Tray
          </button>
          <button
            type="button"
            onClick={onClose}
            className={styles.montessoriCloseBtn}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tactile Workspace Sandbox */}
      <div 
        ref={workspaceRef}
        className={styles.montessoriWorkspaceCanvas}
        onPointerMove={handlePointerMove}
      >
        {items.length === 0 ? (
          <div className={styles.montessoriEmptyWorkspace}>
            <p>Your Montessori Tray is empty.</p>
            <p style={{ fontSize: '11px', marginTop: 4, opacity: 0.8 }}>
              Click items in the cabinet below to place them here, then drag to count!
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onPointerDown={(e) => handlePointerDown(e, item)}
                onPointerUp={handlePointerUp}
                style={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  cursor: 'grab',
                  touchAction: 'none',
                  zIndex: isSelected ? 100 : 10,
                  padding: 8,
                  borderRadius: 12,
                  border: isSelected ? '2px dashed #d97706' : '2px solid transparent',
                  background: isSelected ? 'rgba(251, 191, 36, 0.08)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease'
                }}
              >
                {item.type === 'unit' && <GoldenBeadUnitSvg />}
                {item.type === 'ten' && <GoldenBeadTenSvg height={130} />}
                {item.type === 'rod' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <NumberRodSvg length={item.value} />
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#7c2d12', marginTop: 2 }}>{item.value}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Wooden Materials Cabinet Drawer */}
      <div className={styles.montessoriMaterialsCabinet}>
        <div className={styles.cabinetSection}>
          <div className={styles.cabinetLabel}>Golden Beads (Place Values)</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button
              type="button"
              onClick={() => spawnItem('unit')}
              className={styles.spawnMaterialBtn}
              title="Spawn 1 Bead (Unit)"
            >
              <div className={styles.spawnBtnVisual}><GoldenBeadUnitSvg size={24} /></div>
              <span>1 Bead</span>
            </button>
            <button
              type="button"
              onClick={() => spawnItem('ten')}
              className={styles.spawnMaterialBtn}
              title="Spawn 10 Beads (Ten Rod)"
            >
              <div className={styles.spawnBtnVisual} style={{ height: 42, overflow: 'hidden' }}><GoldenBeadTenSvg width={14} height={70} /></div>
              <span>10 Rod</span>
            </button>
          </div>
        </div>

        <div className={styles.cabinetDivider} />

        <div className={styles.cabinetSection} style={{ flex: 1 }}>
          <div className={styles.cabinetLabel}>Number Length Rods</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((length) => (
              <button
                key={length}
                type="button"
                onClick={() => spawnItem('rod', length)}
                className={styles.spawnMaterialBtn}
                style={{ padding: '6px 8px', minWidth: '46px' }}
                title={`Spawn Rod of length ${length}`}
              >
                <div 
                  style={{ 
                    height: 12, 
                    width: Math.min(48, length * 5), 
                    background: 'linear-gradient(90deg, #ef4444 50%, #3b82f6 50%)', 
                    borderRadius: 2,
                    backgroundSize: '10px 100%'
                  }} 
                />
                <span style={{ fontSize: '10px', fontWeight: '950', marginTop: 4 }}>{length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
