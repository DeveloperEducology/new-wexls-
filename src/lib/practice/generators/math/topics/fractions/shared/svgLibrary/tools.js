/**
 * Geometry Tools SVG Library
 * Implementation of high-fidelity, IXL-style interactive tools.
 */

export const buildProtractorSvg = ({ size = 300, rotation = 0, opacity = 0.6 } = {}) => {
    const W = 400;
    const H = 240; 
    const cx = W / 2;
    const cy = H - 30; 
    const r = 170;
    
    const textColor = "#0f172a";
    const accentColor = "#2563eb";
    
    let ticks = "";
    let labels = "";
    
    // Generate Ticks and Labels
    for (let i = 0; i <= 180; i++) {
        const angleRad = (i * Math.PI) / 180;
        const cos = Math.cos(angleRad); // Start from Right (0) to Left (180)
        const sin = -Math.sin(angleRad); // Upwards
        
        let tickLen = 6;
        let isMajor = i % 10 === 0;
        let isMedium = i % 5 === 0;
        
        if (isMajor) tickLen = 18;
        else if (isMedium) tickLen = 12;
        
        // Tick Line
        const x1 = cx + r * cos;
        const y1 = cy + sin * r;
        const x2 = cx + (r - tickLen) * cos;
        const y2 = cy + sin * (r - tickLen);
        
        ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${textColor}" stroke-width="${isMajor ? 1.5 : 0.4}" />`;
        
        if (isMajor) {
            const labelR = r - 35;
            const lx = cx + labelR * cos;
            const ly = cy + sin * labelR;
            
            // Outer: 180 (Right) -> 0 (Left)
            // Inner: 0 (Right) -> 180 (Left)
            const innerVal = i;
            const outerVal = 180 - i;
            
            labels += `
                <text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" 
                      style="font-size: 12px; font-family: 'Inter', sans-serif; font-weight: 800; fill: ${textColor};">
                    ${outerVal}
                </text>
                <text x="${cx + (labelR - 20) * cos}" y="${cy + sin * (labelR - 20)}" text-anchor="middle" dominant-baseline="middle" 
                      style="font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 600; fill: #64748b;">
                    ${innerVal}
                </text>
            `;
        }
    }
    
    return `
    <svg viewBox="0 0 ${W} ${H}" width="${size}" height="${size * (H/W)}" xmlns="http://www.w3.org/2000/svg">
        <defs>
                <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:0.6" />
                <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:0.4" />
            </linearGradient>
            <filter id="glassShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        
        <g transform="rotate(${rotation}, ${cx}, ${cy})" filter="url(#glassShadow)">
            <!-- Main Semicircle Body -->
            <path d="M ${cx - r - 5} ${cy} A ${r + 5} ${r + 5} 0 0 1 ${cx + r + 5} ${cy} L ${cx + r + 5} ${cy + 10} L ${cx - r - 5} ${cy + 10} Z" 
                  fill="url(#protractorGradient)" stroke="${accentColor}" stroke-width="1.5" />
            
            <!-- Origin Cutout -->
            <path d="M ${cx - 35} ${cy} A 35 35 0 0 1 ${cx + 35} ${cy} Z" 
                  fill="none" stroke="${accentColor}" stroke-width="1.5" />
            
            <!-- Crosshair -->
            <line x1="${cx - 15}" y1="${cy}" x2="${cx + 15}" y2="${cy}" stroke="${accentColor}" stroke-width="1.5" />
            <line x1="${cx}" y1="${cy - 15}" x2="${cx}" y2="${cy}" stroke="${accentColor}" stroke-width="1.5" />
            
            <!-- Ticks & Labels -->
            ${ticks}
            ${labels}
            
            <!-- Bottom Edge Ticks (Ruler-like) -->
            ${Array.from({length: 31}, (_, i) => {
                const x = cx - 150 + i * 10;
                return `<line x1="${x}" y1="${cy}" x2="${x}" y2="${cy + (i % 10 === 0 ? 8 : 4)}" stroke="${textColor}" stroke-width="0.5" />`;
            }).join('')}
        </g>
    </svg>
    `;
};

export const buildRulerSvg = ({ size = 500, rotation = 0, opacity = 0.6 } = {}) => {
    const W = 600;
    const H = 120;
    const cx = W / 2;
    const cy = H / 2;
    
    const textColor = "#0f172a";
    const accentColor = "#2563eb";
    
    let cmTicks = "";
    let inchTicks = "";
    
    // Centimeters (Top Scale)
    for (let i = 0; i <= 200; i++) {
        const x = 30 + i * 2.7; // Approx mapping
        if (x > W - 30) break;
        
        let tickLen = 6;
        let isMajor = i % 10 === 0;
        let isMedium = i % 5 === 0;
        
        if (isMajor) tickLen = 18;
        else if (isMedium) tickLen = 12;
        
        cmTicks += `<line x1="${x}" y1="20" x2="${x}" y2="${20 + tickLen}" stroke="${textColor}" stroke-width="${isMajor ? 1.5 : 0.4}" />`;
        
        if (isMajor) {
            cmTicks += `<text x="${x}" y="50" text-anchor="middle" style="font-size: 11px; font-family: 'Inter', sans-serif; font-weight: 800; fill: ${textColor};">${i/10}</text>`;
        }
    }
    
    // Inches (Bottom Scale)
    for (let i = 0; i <= 80; i++) {
        const x = 30 + i * 6.8; // Approx mapping for 1/8 inch
        if (x > W - 30) break;
        
        let tickLen = 8;
        let isMajor = i % 8 === 0;
        let isMedium = i % 4 === 0;
        
        if (isMajor) tickLen = 22;
        else if (isMedium) tickLen = 16;
        
        inchTicks += `<line x1="${x}" y1="${H - 20}" x2="${x}" y2="${H - 20 - tickLen}" stroke="${textColor}" stroke-width="${isMajor ? 1.5 : 0.5}" />`;
        
        if (isMajor) {
            inchTicks += `<text x="${x}" y="${H - 50}" text-anchor="middle" style="font-size: 12px; font-family: 'Inter', sans-serif; font-weight: 800; fill: ${textColor};">${i/8}</text>`;
        }
    }
    
    return `
    <svg viewBox="0 0 ${W} ${H}" width="${size}" height="${size * (H/W)}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="rulerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:0.6" />
            </linearGradient>
            <filter id="rulerShadow" x="-2%" y="-10%" width="104%" height="120%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="3" result="offsetblur" />
                <feComponentTransfer><feFuncA type="linear" slope="0.15"/></feComponentTransfer>
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
        </defs>
        
        <g transform="rotate(${rotation}, ${cx}, ${cy})" filter="url(#rulerShadow)">
            <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="url(#rulerGradient)" stroke="${accentColor}" stroke-width="1.5" rx="6" />
            ${cmTicks}
            ${inchTicks}
            <text x="${W - 60}" y="40" style="font-size: 9px; fill: #64748b; font-weight: 800; font-family: 'Inter';">CM</text>
            <text x="${W - 60}" y="${H - 30}" style="font-size: 9px; fill: #64748b; font-weight: 800; font-family: 'Inter';">INCH</text>
            
            <!-- Origin Indicator -->
            <line x1="30" y1="20" x2="30" y2="${H - 20}" stroke="${accentColor}" stroke-width="1" stroke-dasharray="2,2" />
        </g>
    </svg>
    `;
};
