import React from 'react';

/**
 * Pure SVG & JSX Mathematics Diagram Renderer.
 * Supports:
 * - 'fraction-pie': Shaded circles for ratio/fraction visualization
 * - 'fraction-bar': Horizontal fraction strips
 * - 'number-line': Tick-marked number line with plot indicator
 * - 'place-value': Blocks representing hundreds, tens, and ones
 * - 'geometry-shape': Rectangle, Square, Triangle, or Cuboid with custom measurement labels
 * - 'percentage-grid': 10x10 block grid representing fractions/percentages out of 100
 * - 'clock': Analog clock face with configurable hour and minute hands
 * - 'bar-comparison': Comparative bar model highlighting Profit/Loss or CP vs. SP
 * - 'arithmetic-visual': Visualized addition, subtraction, or multiplication using emojis or image assets
 */
export default function SvgDiagram({ type, params = {} }) {
  const color = params.color || '#3b82f6';
  const size = params.size || 150;

  switch (type) {
    case 'fraction-pie': {
      const num = parseInt(params.numerator ?? 3, 10);
      const den = parseInt(params.denominator ?? 4, 10);
      const r = 80;
      const cx = 100;
      const cy = 100;
      
      const slices = [];
      const angleStep = 360 / den;
      
      for (let i = 0; i < den; i++) {
        const startAngle = i * angleStep - 90; // Start at top
        const endAngle = (i + 1) * angleStep - 90;
        
        const rad1 = (startAngle * Math.PI) / 180;
        const rad2 = (endAngle * Math.PI) / 180;
        
        const x1 = cx + r * Math.cos(rad1);
        const y1 = cy + r * Math.sin(rad1);
        const x2 = cx + r * Math.cos(rad2);
        const y2 = cy + r * Math.sin(rad2);
        
        const largeArcFlag = angleStep > 180 ? 1 : 0;
        const isShaded = i < num;
        
        const pathData = `
          M ${cx} ${cy}
          L ${x1} ${y1}
          A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
          Z
        `;
        
        slices.push(
          <path
            key={i}
            d={pathData}
            fill={isShaded ? color : '#f8fafc'}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        );
      }

      return (
        <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'inline-block' }}>
          {slices}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#64748b" strokeWidth="2.5" />
        </svg>
      );
    }

    case 'fraction-bar': {
      const num = parseInt(params.numerator ?? 2, 10);
      const den = parseInt(params.denominator ?? 5, 10);
      const width = 450;
      const height = 45;
      const barWidth = width / den;
      
      const segments = [];
      for (let i = 0; i < den; i++) {
        segments.push(
          <rect
            key={i}
            x={i * barWidth + 5}
            y={5}
            width={barWidth}
            height={height}
            fill={i < num ? color : '#f8fafc'}
            stroke="#94a3b8"
            strokeWidth="2"
          />
        );
      }
      
      return (
        <svg viewBox={`0 0 ${width + 10} ${height + 10}`} width="100%" height={height + 10} style={{ maxWidth: '460px' }}>
          {segments}
        </svg>
      );
    }

    case 'number-line': {
      const min = parseInt(params.min ?? 0, 10);
      const max = parseInt(params.max ?? 10, 10);
      const val = parseFloat(params.value ?? 5);
      
      const width = 500;
      const startX = 30;
      const endX = width - 30;
      const lineY = 50;
      const range = max - min;
      const stepX = (endX - startX) / range;
      
      const elements = [];
      for (let i = 0; i <= range; i++) {
        const x = startX + i * stepX;
        const tickVal = min + i;
        elements.push(
          <g key={i}>
            <line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8} stroke="#475569" strokeWidth="2" />
            <text x={x} y={lineY + 28} fontSize="12" fontWeight="700" textAnchor="middle" fill="#1e293b">
              {tickVal}
            </text>
          </g>
        );
      }

      if (val >= min && val <= max) {
        const plotX = startX + (val - min) * stepX;
        elements.push(
          <g key="plot-point">
            <circle cx={plotX} cy={lineY} r="10" fill={color} opacity="0.2" />
            <circle cx={plotX} cy={lineY} r="6" fill={color} stroke="#ffffff" strokeWidth="2" />
            <path d={`M ${plotX} ${lineY - 14} L ${plotX - 5} ${lineY - 24} L ${plotX + 5} ${lineY - 24} Z`} fill={color} />
          </g>
        );
      }

      return (
        <svg viewBox={`0 0 ${width} 90`} width="100%" height="90px" style={{ maxWidth: '500px' }}>
          <line x1={startX - 15} y1={lineY} x2={endX + 15} y2={lineY} stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          <path d={`M ${startX - 18} ${lineY} L ${startX - 10} ${lineY - 5} L ${startX - 10} ${lineY + 5} Z`} fill="#1e293b" />
          <path d={`M ${endX + 18} ${lineY} L ${endX + 10} ${lineY - 5} L ${endX + 10} ${lineY + 5} Z`} fill="#1e293b" />
          {elements}
        </svg>
      );
    }

    case 'place-value': {
      const hundreds = parseInt(params.hundreds ?? 0, 10);
      const tens = parseInt(params.tens ?? 0, 10);
      const ones = parseInt(params.ones ?? 0, 10);
      
      const elements = [];
      let currentX = 10;
      
      for (let h = 0; h < hundreds; h++) {
        const hId = `h-${h}`;
        elements.push(
          <g key={hId} transform={`translate(${currentX}, 10)`}>
            <rect width="80" height="80" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`hl-${i}`} x1={i * 8} y1="0" x2={i * 8} y2="80" stroke="#bfdbfe" strokeWidth="0.8" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`vl-${i}`} x1="0" y1={i * 8} x2="80" y2={i * 8} stroke="#bfdbfe" strokeWidth="0.8" />
            ))}
            <text x="40" y="-8" fontSize="10" fontWeight="800" textAnchor="middle" fill="#2563eb">100</text>
          </g>
        );
        currentX += 95;
      }
      
      for (let t = 0; t < tens; t++) {
        const tId = `t-${t}`;
        elements.push(
          <g key={tId} transform={`translate(${currentX}, 10)`}>
            <rect width="10" height="80" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.8" />
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`tl-${i}`} x1="0" y1={i * 8} x2="10" y2={i * 8} stroke="#bbf7d0" strokeWidth="0.8" />
            ))}
            <text x="5" y="-8" fontSize="10" fontWeight="800" textAnchor="middle" fill="#16a34a">10</text>
          </g>
        );
        currentX += 20;
      }
      
      currentX += 10;

      for (let o = 0; o < ones; o++) {
        const oId = `o-${o}`;
        const row = o % 5;
        const col = Math.floor(o / 5);
        elements.push(
          <g key={oId} transform={`translate(${currentX + col * 15}, ${10 + row * 15})`}>
            <rect width="10" height="10" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
            <text x="5" y="-12" fontSize="9" fontWeight="800" textAnchor="middle" fill="#d97706">{o === 0 ? '1' : ''}</text>
          </g>
        );
      }
      
      const width = currentX + Math.ceil(ones / 5) * 20 + 10;
      
      return (
        <svg viewBox={`0 0 ${width} 110`} width="100%" height="110px" style={{ maxWidth: `${width}px` }}>
          {elements}
        </svg>
      );
    }

    case 'geometry-shape': {
      const shape = params.shape || 'rectangle';
      const label1 = params.label1 || '10 cm';
      const label2 = params.label2 || '6 cm';
      const label3 = params.label3 || '4 cm';
      
      if (shape === 'rectangle' || shape === 'square') {
        const w = shape === 'square' ? 100 : 160;
        const h = 100;
        return (
          <svg viewBox="0 0 220 150" width={size * 1.5} height={size} style={{ display: 'inline-block' }}>
            <rect x="20" y="15" width={w} height={h} fill="#f8fafc" stroke={color} strokeWidth="3" rx="4" />
            <text x={20 + w/2} y={15 + h + 22} fontSize="13" fontWeight="800" textAnchor="middle" fill="#1e293b">{label1}</text>
            <text x={20 + w + 12} y={15 + h/2 + 4} fontSize="13" fontWeight="800" textAnchor="start" fill="#1e293b">{label2}</text>
          </svg>
        );
      }
      
      if (shape === 'triangle') {
        return (
          <svg viewBox="0 0 200 150" width={size * 1.3} height={size} style={{ display: 'inline-block' }}>
            <rect x="30" y="100" width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <path d="M 30 20 L 30 112 L 150 112 Z" fill="#f8fafc" stroke={color} strokeWidth="3" strokeLinejoin="round" />
            <text x="90" y="132" fontSize="13" fontWeight="800" textAnchor="middle" fill="#1e293b">{label1}</text>
            <text x="15" y="70" fontSize="13" fontWeight="800" textAnchor="end" fill="#1e293b">{label2}</text>
            {params.label3 && (
              <text x="100" y="60" fontSize="12" fontWeight="800" textAnchor="middle" fill="#64748b" transform="rotate(-37, 100, 60)">{label3}</text>
            )}
          </svg>
        );
      }
      
      if (shape === 'cuboid') {
        return (
          <svg viewBox="0 0 240 160" width={size * 1.5} height={size} style={{ display: 'inline-block' }}>
            <rect x="60" y="15" width="120" height="80" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
            <rect x="20" y="55" width="120" height="80" fill="none" stroke={color} strokeWidth="3" />
            <line x1="20" y1="55" x2="60" y2="15" stroke={color} strokeWidth="2.5" />
            <line x1="140" y1="55" x2="180" y2="15" stroke={color} strokeWidth="2.5" />
            <line x1="20" y1="135" x2="60" y2="95" stroke={color} strokeWidth="2.5" strokeDasharray="3,3" />
            <line x1="140" y1="135" x2="180" y2="95" stroke={color} strokeWidth="2.5" />
            
            <text x="80" y="152" fontSize="13" fontWeight="800" textAnchor="middle" fill="#1e293b">{label1}</text>
            <text x="145" y="100" fontSize="13" fontWeight="800" textAnchor="start" fill="#1e293b">{label2}</text>
            <text x="170" y="45" fontSize="12" fontWeight="800" textAnchor="middle" fill="#64748b">{label3}</text>
          </svg>
        );
      }
      return null;
    }

    case 'percentage-grid': {
      const pct = Math.min(Math.max(parseInt(params.percent ?? 35, 10), 0), 100);
      const cells = [];
      
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const index = row * 10 + col;
          const isFilled = index < pct;
          cells.push(
            <rect
              key={index}
              x={col * 16 + 2}
              y={row * 16 + 2}
              width="15"
              height="15"
              fill={isFilled ? color : '#f8fafc'}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        }
      }
      
      return (
        <svg viewBox="0 0 166 166" width={size} height={size} style={{ display: 'inline-block' }}>
          {cells}
          <text x="83" y="88" fontSize="16" fontWeight="900" textAnchor="middle" fill="#0f172a" stroke="#ffffff" strokeWidth="3" paintOrder="stroke" opacity="0.9">
            {pct}%
          </text>
        </svg>
      );
    }

    case 'clock': {
      const timeStr = params.time || '10:15';
      const [hStr, mStr] = timeStr.split(':');
      const h = parseInt(hStr || '10', 10);
      const m = parseInt(mStr || '15', 10);
      
      const cx = 100;
      const cy = 100;
      const r = 80;
      
      const minAngle = (m * 6) - 90;
      const hourAngle = ((h % 12) * 30) + (m * 0.5) - 90;
      
      const minRad = (minAngle * Math.PI) / 180;
      const hourRad = (hourAngle * Math.PI) / 180;
      
      const clockNumbers = [];
      for (let i = 1; i <= 12; i++) {
        const numAngle = (i * 30) - 90;
        const numRad = (numAngle * Math.PI) / 180;
        const tx = cx + (r - 18) * Math.cos(numRad);
        const ty = cy + (r - 18) * Math.sin(numRad) + 4;
        clockNumbers.push(
          <text key={i} x={tx} y={ty} fontSize="11" fontWeight="800" textAnchor="middle" fill="#334155">
            {i}
          </text>
        );
      }

      return (
        <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: 'inline-block' }}>
          <circle cx={cx} cy={cy} r={r} fill="#f8fafc" stroke="#334155" strokeWidth="4.5" />
          <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          
          {clockNumbers}
          
          <line
            x1={cx}
            y1={cy}
            x2={cx + 42 * Math.cos(hourRad)}
            y2={cy + 42 * Math.sin(hourRad)}
            stroke="#1e293b"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          
          <line
            x1={cx}
            y1={cy}
            x2={cx + 62 * Math.cos(minRad)}
            y2={cy + 62 * Math.sin(minRad)}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          <circle cx={cx} cy={cy} r="6" fill="#1e293b" />
          <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" />
        </svg>
      );
    }

    case 'bar-comparison': {
      const val1 = Math.max(parseFloat(params.value1 ?? 200), 1);
      const val2 = Math.max(parseFloat(params.value2 ?? 250), 1);
      const label1 = params.label1 || 'Cost Price';
      const label2 = params.label2 || 'Selling Price';
      
      const maxVal = Math.max(val1, val2);
      const maxW = 380;
      const w1 = (val1 / maxVal) * maxW;
      const w2 = (val2 / maxVal) * maxW;
      
      const isProfit = val2 > val1;
      const isLoss = val1 > val2;
      const diff = Math.abs(val2 - val1);
      const diffW = (diff / maxVal) * maxW;
      
      return (
        <svg viewBox="0 0 440 130" width="100%" height="130px" style={{ maxWidth: '440px' }}>
          <text x="10" y="18" fontSize="11" fontWeight="800" fill="#475569">{label1} (₹{val1})</text>
          <rect x="10" y="24" width={w1} height="24" fill="#3b82f6" rx="3" />
          
          <text x="10" y="68" fontSize="11" fontWeight="800" fill="#475569">{label2} (₹{val2})</text>
          <rect x="10" y="74" width={w2} height="24" fill={isProfit ? '#10b981' : isLoss ? '#ef4444' : '#64748b'} rx="3" />
          
          {isProfit && (
            <g>
              <rect x={10 + w1} y="74" width={diffW} height="24" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" rx="3" />
              <text x={10 + w1 + diffW/2} y="112" fontSize="11" fontWeight="800" textAnchor="middle" fill="#047857">
                + Profit (₹{diff})
              </text>
              <path d={`M ${10 + w1 + diffW/2} ${102} L ${10 + w1 + diffW/2} ${76}`} stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
            </g>
          )}
          {isLoss && (
            <g>
              <rect x={10 + w2} y="24" width={diffW} height="24" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" rx="3" />
              <text x={10 + w2 + diffW/2} y="112" fontSize="11" fontWeight="800" textAnchor="middle" fill="#b91c1c">
                - Loss (₹{diff})
              </text>
              <path d={`M ${10 + w2 + diffW/2} ${102} L ${10 + w2 + diffW/2} ${26}`} stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            </g>
          )}
        </svg>
      );
    }

    case 'arithmetic-visual': {
      const op = params.operation || 'addition';
      const val1 = parseInt(params.value1 ?? 5, 10);
      const val2 = parseInt(params.value2 ?? 3, 10);
      const itemType = params.itemType || 'emoji';
      const itemSrc = params.itemSource || '🍎';
      
      const renderItem = (isCrossed = false) => {
        if (itemType === 'image') {
          return (
            <div style={{ position: 'relative', display: 'inline-block', margin: '2px' }}>
              <img
                src={itemSrc}
                alt="item"
                style={{ width: '28px', height: '28px', objectFit: 'contain', opacity: isCrossed ? 0.3 : 1 }}
              />
              {isCrossed && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444', fontWeight: 'bold', fontSize: '20px', lineBreak: 'anywhere'
                }}>
                  ❌
                </div>
              )}
            </div>
          );
        }
        return (
          <span style={{
            fontSize: '24px', display: 'inline-block', margin: '2px', position: 'relative',
            opacity: isCrossed ? 0.35 : 1
          }}>
            {itemSrc}
            {isCrossed && (
              <span style={{
                position: 'absolute', left: '2px', top: '1px', color: '#ef4444',
                fontSize: '18px', fontWeight: 'bold'
              }}>
                ❌
              </span>
            )}
          </span>
        );
      };

      if (op === 'addition') {
        const items1 = Array.from({ length: val1 }).map((_, i) => <span key={`g1-${i}`}>{renderItem()}</span>);
        const items2 = Array.from({ length: val2 }).map((_, i) => <span key={`g2-${i}`}>{renderItem()}</span>);
        const itemsRes = Array.from({ length: val1 + val2 }).map((_, i) => <span key={`gr-${i}`}>{renderItem()}</span>);
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', margin: '12px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '140px', justifyContent: 'center' }}>
              {items1}
              <div style={{ width: '100%', fontSize: '13px', color: '#64748b', fontWeight: '800', textAlign: 'center', marginTop: '6px' }}>{val1}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#64748b' }}>+</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '140px', justifyContent: 'center' }}>
              {items2}
              <div style={{ width: '100%', fontSize: '13px', color: '#64748b', fontWeight: '800', textAlign: 'center', marginTop: '6px' }}>{val2}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#64748b' }}>=</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '240px', justifyContent: 'center' }}>
              {itemsRes}
              <div style={{ width: '100%', fontSize: '14px', color: '#10b981', fontWeight: '800', textAlign: 'center', marginTop: '6px' }}>{val1 + val2}</div>
            </div>
          </div>
        );
      }
      
      if (op === 'subtraction') {
        const itemsNormal = Array.from({ length: val1 - val2 }).map((_, i) => <span key={`sn-${i}`}>{renderItem(false)}</span>);
        const itemsCrossed = Array.from({ length: val2 }).map((_, i) => <span key={`sc-${i}`}>{renderItem(true)}</span>);
        const itemsRes = Array.from({ length: val1 - val2 }).map((_, i) => <span key={`sr-${i}`}>{renderItem(false)}</span>);
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', margin: '12px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '240px', justifyContent: 'center' }}>
              {itemsNormal}
              {itemsCrossed}
              <div style={{ width: '100%', fontSize: '13px', color: '#64748b', fontWeight: '800', textAlign: 'center', marginTop: '6px' }}>{val1} total</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#64748b' }}>minus {val2}</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#64748b' }}>=</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '200px', justifyContent: 'center' }}>
              {itemsRes}
              <div style={{ width: '100%', fontSize: '14px', color: '#ef4444', fontWeight: '800', textAlign: 'center', marginTop: '6px' }}>{val1 - val2} left</div>
            </div>
          </div>
        );
      }
      
      if (op === 'multiplication') {
        const groups = [];
        for (let g = 0; g < val1; g++) {
          const items = Array.from({ length: val2 }).map((_, i) => <span key={`g-${g}-${i}`}>{renderItem()}</span>);
          groups.push(
            <div key={g} style={{ border: '2px dashed #3b82f6', borderRadius: '8px', padding: '8px', background: '#ffffff', display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
              {items}
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '12px 0', width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {groups}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#334155', marginTop: '6px' }}>
              {val1} groups of {val2} = <span style={{ color: '#3b82f6', fontSize: '16px' }}>{val1 * val2}</span> items total
            </div>
          </div>
        );
      }
      return null;
    }
    
    default:
      return null;
  }
}
