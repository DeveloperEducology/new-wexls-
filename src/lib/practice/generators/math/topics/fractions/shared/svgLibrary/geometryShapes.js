/**
 * Geometry SVG Library
 * Optimized for clean 2D and 3D diagram rendering in worksheets.
 */

export const buildGeometrySvg = ({ shapeType, dimensions, unit, color, size = 300, showLabels = true, angleLabels = [] }) => {
  const W = 400;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2;
  const scale = 30;
  const strokeWidth = 3;

  const palettes = [
    { stroke: '#2563eb', fill: '#eff6ff' }, // Blue
    { stroke: '#059669', fill: '#ecfdf5' }, // Green
    { stroke: '#db2777', fill: '#fdf2f8' }, // Pink
  ];

  // Pick a random palette if no specific color is forced
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  const strokeColor = color || palette.stroke;
  const fillColor = palette.fill;

  const labelStyle = `font-family: sans-serif; font-weight: bold; font-size: 16px; fill: #1e293b;`;

  let content = '';

  // Helpers for decorations
  const getMidpoint = (p1, p2) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  
  const drawTickMarks = (p1, p2, count, color) => {
    if (!count) return '';
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [mx, my] = getMidpoint(p1, p2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy; // normal
    const ny = ux;
    
    const tickLen = 8;
    const spacing = 4;
    let ticks = '';
    
    for (let i = 0; i < count; i++) {
      const shift = (i - (count - 1) / 2) * spacing;
      const tx = mx + shift * ux;
      const ty = my + shift * uy;
      ticks += `<line x1="${tx - nx * tickLen}" y1="${ty - ny * tickLen}" x2="${tx + nx * tickLen}" y2="${ty + ny * tickLen}" stroke="${color}" stroke-width="2" />`;
    }
    return ticks;
  };

  const drawAngleArc = (center, p1, p2, count, color) => {
    if (!count) return '';
    const r = 25;
    const spacing = 4;
    const [cx, cy] = center;
    
    const a1 = Math.atan2(p1[1] - cy, p1[0] - cx);
    const a2 = Math.atan2(p2[1] - cy, p2[0] - cx);
    
    let arcs = '';
    for (let i = 0; i < count; i++) {
      const radius = r + i * spacing;
      const xStart = cx + radius * Math.cos(a1);
      const yStart = cy + radius * Math.sin(a1);
      const xEnd = cx + radius * Math.cos(a2);
      const yEnd = cy + radius * Math.sin(a2);
      
      // Arc logic
      let diff = a2 - a1;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
      const sweep = diff > 0 ? 1 : 0;
      
      arcs += `<path d="M${xStart},${yStart} A${radius},${radius} 0 ${largeArc} ${sweep} ${xEnd},${yEnd}" fill="none" stroke="${color}" stroke-width="1.5" />`;
    }
    return arcs;
  };

  const formatLabel = (val) => typeof val === 'object' ? val.display : val;

  switch (shapeType) {
    case 'rectangle':
    case 'square': {
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;
      const x = cx - w / 2;
      const y = cy - h / 2;
      
      content = `
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="4" />
        ${showLabels ? `<text x="${cx}" y="${y - 15}" text-anchor="middle" style="${labelStyle}">${formatLabel(dimensions.width)} ${unit}</text>` : ''}
        ${(showLabels && shapeType === 'rectangle') ? `<text x="${x + w + 10}" y="${cy}" text-anchor="start" style="${labelStyle}">${formatLabel(dimensions.height)} ${unit}</text>` : ''}
      `;
      break;
    }

    case 'cylinder': {
      const rw = dimensions.width * scale;
      const rh = 30;
      const hScale = dimensions.height * scale;
      const topY = cy - hScale / 2;
      const bottomY = cy + hScale / 2;

      content = `
        <ellipse cx="${cx}" cy="${topY}" rx="${rw / 2}" ry="${rh / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${cx - rw / 2}" y1="${topY}" x2="${cx - rw / 2}" y2="${bottomY}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${cx + rw / 2}" y1="${topY}" x2="${cx + rw / 2}" y2="${bottomY}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <path d="M${cx - rw / 2},${bottomY} A${rw / 2},${rh / 2} 0 0 0 ${cx + rw / 2},${bottomY}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <path d="M${cx - rw / 2},${bottomY} A${rw / 2},${rh / 2} 0 0 1 ${cx + rw / 2},${bottomY}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="6,6" />
        
        <line x1="${cx}" y1="${topY}" x2="${cx + rw / 2}" y2="${topY}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" />
        ${showLabels ? `
          <text x="${cx + rw / 4}" y="${topY - 10}" text-anchor="middle" style="${labelStyle}">r=${formatLabel(dimensions.width / 2)}</text>
          <text x="${cx - rw / 2 - 40}" y="${cy}" text-anchor="middle" style="${labelStyle}">h=${formatLabel(dimensions.height)}</text>
        ` : ''}
      `;
      break;
    }

    case 'rectangular_prism':
    case 'cube': {
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;
      const d = dimensions.depth * scale * 0.5; // perspective
      
      const x0 = cx - w / 2 - d / 2;
      const y0 = cy - h / 2 + d / 2;

      // Front Face
      content += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="2" />`;
      // Back Face (dashed)
      content += `<rect x="${x0 + d}" y="${y0 - d}" width="${w}" height="${h}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="6,6" />`;
      // Connecting lines
      const corners = [
        [x0, y0, x0 + d, y0 - d],
        [x0 + w, y0, x0 + w + d, y0 - d],
        [x0, y0 + h, x0 + d, y0 + h - d],
        [x0 + w, y0 + h, x0 + w + d, y0 + h - d]
      ];
      corners.forEach(([x1, y1, x2, y2], i) => {
        const isDashed = i === 2; // Bottom left back line usually hidden
        content += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${isDashed ? 1.5 : strokeWidth}" ${isDashed ? 'stroke-dasharray="6,6"' : ''} />`;
      });

      // Labels
      if (showLabels) {
        content += `<text x="${x0 + w / 2}" y="${y0 + h + 25}" text-anchor="middle" style="${labelStyle}">l=${formatLabel(dimensions.width)}</text>`;
        content += `<text x="${x0 - 40}" y="${y0 + h / 2}" text-anchor="middle" style="${labelStyle}">h=${formatLabel(dimensions.height)}</text>`;
        content += `<text x="${x0 + w + d / 2 + 15}" y="${y0 - d / 2}" text-anchor="start" style="${labelStyle}">w=${formatLabel(dimensions.depth)}</text>`;
      }
      break;
    }

    case 'pentagon':
    case 'hexagon':
    case 'octagon':
    case 'regular_polygon': {
      let sides = dimensions.sides;
      if (shapeType === 'pentagon') sides = 5;
      if (shapeType === 'hexagon') sides = 6;
      if (shapeType === 'octagon') sides = 8;
      if (!sides) sides = 5;
      
      const r = (dimensions.width * scale) / 2;
      const angleOffset = -Math.PI / 2;
      const vertices = Array.from({ length: sides }, (_, i) => {
        const angle = angleOffset + (2 * Math.PI * i) / sides;
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
      });
      const points = vertices.map(v => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join(' ');
      
      content = `
        <polygon points="${points}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" />
        ${showLabels ? `<text x="${cx}" y="${cy}" text-anchor="middle" style="${labelStyle}">s=${formatLabel(dimensions.sideLength || dimensions.width)}</text>` : ''}
      `;
      break;
    }

    case 'equilateral_triangle':
    case 'triangle':
    case 'right_triangle':
    case 'isosceles_triangle':
    case 'scalene_triangle': {
      const b = dimensions.width * scale;
      const h = dimensions.height * scale;
      let x1, y1, x2, y2, x3, y3;
      let decorations = '';

      if (shapeType === 'right_triangle') {
        x1 = cx - b / 2; y1 = cy + h / 2;
        x2 = cx + b / 2; y2 = cy + h / 2;
        x3 = cx - b / 2; y3 = cy - h / 2;
        // Right angle marker
        const s = 15;
        decorations += `<path d="M${x1 + s},${y1} L${x1 + s},${y1 - s} L${x1},${y1 - s}" fill="none" stroke="${strokeColor}" stroke-width="1.5" />`;
      } else if (shapeType === 'scalene_triangle') {
        x1 = cx - b / 2; y1 = cy + h / 2;
        x2 = cx + b / 2; y2 = cy + h / 2;
        x3 = cx - b / 4; y3 = cy - h / 2;
      } else if (shapeType === 'isosceles_triangle') {
        x1 = cx - b / 2; y1 = cy + h / 2;
        x2 = cx + b / 2; y2 = cy + h / 2;
        x3 = cx; y3 = cy - h / 2;
        // Ticks on equal sides
        decorations += drawTickMarks([x1, y1], [x3, y3], 1, strokeColor);
        decorations += drawTickMarks([x2, y2], [x3, y3], 1, strokeColor);
        // Arcs on equal angles
        decorations += drawAngleArc([x1, y1], [x2, y2], [x3, y3], 1, strokeColor);
        decorations += drawAngleArc([x2, y2], [x1, y1], [x3, y3], 1, strokeColor);
      } else if (shapeType === 'equilateral_triangle' || shapeType === 'triangle') {
        // Force equilateral if not specified
        const side = dimensions.width * scale;
        const eqH = side * (Math.sqrt(3)/2);
        x1 = cx - side / 2; y1 = cy + eqH / 3;
        x2 = cx + side / 2; y2 = cy + eqH / 3;
        x3 = cx; y3 = cy - (eqH * 2/3);
        
        // Triple ticks if equilateral
        decorations += drawTickMarks([x1, y1], [x2, y2], 2, strokeColor);
        decorations += drawTickMarks([x2, y2], [x3, y3], 2, strokeColor);
        decorations += drawTickMarks([x3, y3], [x1, y1], 2, strokeColor);
        
        // Arcs on all angles
        decorations += drawAngleArc([x1, y1], [x2, y2], [x3, y3], 1, strokeColor);
        decorations += drawAngleArc([x2, y2], [x1, y1], [x3, y3], 1, strokeColor);
        decorations += drawAngleArc([x3, y3], [x1, y1], [x2, y2], 1, strokeColor);
      }

      // Add Angle Labels if provided
      if (angleLabels && angleLabels.length === 3) {
        const points = [[x1, y1], [x2, y2], [x3, y3]];
        const gx = (x1 + x2 + x3) / 3;
        const gy = (y1 + y2 + y3) / 3;
        
        angleLabels.forEach((label, i) => {
          const [px, py] = points[i];
          // Position label 30% towards centroid
          const lx = px + 0.3 * (gx - px);
          const ly = py + 0.3 * (gy - py);
          decorations += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" style="font-size: 14px; fill: #475569; font-weight: bold;">${label}</text>`;
        });
      }

      content = `
        <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        ${decorations}
        ${showLabels ? `
          <text x="${cx}" y="${y1 + 25}" text-anchor="middle" style="${labelStyle}">b=${formatLabel(dimensions.width)}</text>
          <text x="${cx - 40}" y="${cy}" text-anchor="middle" style="${labelStyle}">h=${formatLabel(dimensions.height)}</text>
        ` : ''}
      `;
      break;
    }

    case 'triangular_prism': {
      const b = dimensions.width * scale;
      const h = dimensions.height * scale;
      const d = dimensions.depth * scale * 0.5;
      const x0 = cx - b / 2 - d / 2, y0 = cy + h / 2;
      
      const f1 = `${x0},${y0} ${x0 + b},${y0} ${x0 + b/2},${y0 - h}`;
      const f2 = `${x0 + d},${y0 - d} ${x0 + b + d},${y0 - d} ${x0 + b/2 + d},${y0 - h - d}`;
      
      content = `
        <polygon points="${f2}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="6,6" />
        <line x1="${x0}" y1="${y0}" x2="${x0 + d}" y2="${y0 - d}" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="6,6" />
        <line x1="${x0 + b}" y1="${y0}" x2="${x0 + b + d}" y2="${y0 - d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <line x1="${x0 + b/2}" y1="${y0 - h}" x2="${x0 + b/2 + d}" y2="${y0 - h - d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        <polygon points="${f1}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        ${showLabels ? `
          <text x="${x0 + b/2}" y="${y0 + 25}" text-anchor="middle" style="${labelStyle}">b=${formatLabel(dimensions.width)}</text>
          <text x="${x0 + b + d / 2 + 15}" y="${y0 - d / 2}" text-anchor="start" style="${labelStyle}">L=${formatLabel(dimensions.depth)}</text>
        ` : ''}
      `;
      break;
    }

    case 'trapezium': {
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;
      const offset = w * 0.2;
      const x1 = cx - w / 2, y1 = cy + h / 2;
      const x2 = cx + w / 2, y2 = cy + h / 2;
      const x3 = cx + w / 2 - offset, y3 = cy - h / 2;
      const x4 = cx - w / 2 + offset, y4 = cy - h / 2;
      content = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
      if (showLabels) {
        content += `<text x="${cx}" y="${y1 + 25}" text-anchor="middle" style="${labelStyle}">b1=${formatLabel(dimensions.width)}</text>`;
      }
      break;
    }

    case 'parallelogram': {
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;
      const offset = w * 0.3;
      const x1 = cx - w / 2, y1 = cy + h / 2;
      const x2 = cx + w / 2 - offset, y2 = cy + h / 2;
      const x3 = cx + w / 2, y3 = cy - h / 2;
      const x4 = cx - w / 2 + offset, y4 = cy - h / 2;
      content = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
      if (showLabels) {
        content += `<text x="${cx - offset / 2}" y="${y1 + 25}" text-anchor="middle" style="${labelStyle}">b=${formatLabel(dimensions.width)}</text>`;
      }
      break;
    }

    case 'rhombus': {
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;
      const x1 = cx, y1 = cy - h / 2;
      const x2 = cx + w / 2, y2 = cy;
      const x3 = cx, y3 = cy + h / 2;
      const x4 = cx - w / 2, y4 = cy;
      content = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
      break;
    }

    case 'sphere':
    case 'circle': {
      const r = (dimensions.width * scale) / 2;
      if (shapeType === 'circle') {
        content = `
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
        `;
      } else {
        content = `
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r / 3}" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="6,6" />
          <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" />
          ${showLabels ? `<text x="${cx + r / 2}" y="${cy - 10}" text-anchor="middle" style="${labelStyle}">r=${formatLabel(dimensions.width / 2)}</text>` : ''}
        `;
      }
      break;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto" style="max-width: ${W}px;">
      ${content}
    </svg>
  `;
};
