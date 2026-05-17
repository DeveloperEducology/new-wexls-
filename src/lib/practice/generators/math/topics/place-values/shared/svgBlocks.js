
/**
 * Place Value Base-10 Blocks SVG Generator (Master Tight Edition)
 */

export const buildPlaceValueSvg = ({ thousands = 0, hundreds = 0, tens = 0, ones = 0 }) => {
    const config = {
        one: { color: '#60a5fa', light: '#93c5fd', dark: '#2563eb', stroke: '#1d4ed8' },
        ten: { color: '#34d399', light: '#6ee7b7', dark: '#059669', stroke: '#047857' },
        hundred: { color: '#fbbf24', light: '#fcd34d', dark: '#d97706', stroke: '#b45309' },
        thousand: { color: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed', stroke: '#6d28d9' }
    };

    let svgContent = `
        <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="1" dy="1" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            
            <linearGradient id="grad-one" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${config.one.light};" />
                <stop offset="100%" style="stop-color:${config.one.dark};" />
            </linearGradient>
            <linearGradient id="grad-ten" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${config.ten.light};" />
                <stop offset="100%" style="stop-color:${config.ten.dark};" />
            </linearGradient>
            <linearGradient id="grad-hundred" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${config.hundred.light};" />
                <stop offset="100%" style="stop-color:${config.hundred.dark};" />
            </linearGradient>
            <linearGradient id="grad-thousand" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${config.thousand.light};" />
                <stop offset="100%" style="stop-color:${config.thousand.dark};" />
            </linearGradient>
        </defs>
    `;

    let currentX = 20;
    let currentY = 20;
    const bSize = 210; // Slightly smaller to allow more per row
    const tSize = 21;
    const gap = 15;    // Tighter vertical gap
    const xMax = 750;
    
    // Helper for Thousands (3D Isometric Cube)
    const renderThousand = (x, y) => `
        <g transform="translate(${x},${y})" filter="url(#shadow)">
            <path d="M15 0 L${bSize + 15} 0 L${bSize + 15} ${bSize} L${bSize} ${bSize + 15} L0 ${bSize + 15} L0 15 Z" fill="${config.thousand.dark}" stroke="${config.thousand.stroke}" stroke-width="0.5" />
            <path d="M0 15 L15 0 L${bSize + 15} 0 L${bSize} 15 Z" fill="${config.thousand.light}" stroke="${config.thousand.stroke}" />
            <rect x="0" y="15" width="${bSize}" height="${bSize}" fill="url(#grad-thousand)" stroke="${config.thousand.stroke}" stroke-width="1.5" rx="2" />
            ${Array.from({length: 9}).map((_, i) => `
                <line x1="${(i+1)*(bSize/10)}" y1="15" x2="${(i+1)*(bSize/10)}" y2="${bSize+15}" stroke="${config.thousand.stroke}" stroke-width="0.5" stroke-opacity="0.2" />
                <line x1="0" y1="${15 + (i+1)*(bSize/10)}" x2="${bSize}" y2="${15 + (i+1)*(bSize/10)}" stroke="${config.thousand.stroke}" stroke-width="0.5" stroke-opacity="0.2" />
            `).join('')}
        </g>
    `;

    // Helper for Hundreds (Flat)
    const renderHundred = (x, y) => `
        <g transform="translate(${x},${y})" filter="url(#shadow)">
            <rect x="0" y="0" width="${bSize}" height="${bSize}" fill="url(#grad-hundred)" stroke="${config.hundred.stroke}" stroke-width="1.5" rx="2" />
            ${Array.from({length: 9}).map((_, i) => `
                <line x1="${(i+1)*(bSize/10)}" y1="0" x2="${(i+1)*(bSize/10)}" y2="${bSize}" stroke="${config.hundred.stroke}" stroke-width="0.8" stroke-opacity="0.3" />
                <line x1="0" y1="${(i+1)*(bSize/10)}" x2="${bSize}" y2="${(i+1)*(bSize/10)}" stroke="${config.hundred.stroke}" stroke-width="0.8" stroke-opacity="0.3" />
            `).join('')}
        </g>
    `;

    // Helper for Tens (Rod)
    const renderTen = (x, y) => `
        <g transform="translate(${x},${y})" filter="url(#shadow)">
            <rect x="0" y="0" width="${tSize}" height="${bSize}" fill="url(#grad-ten)" stroke="${config.ten.stroke}" stroke-width="1.5" rx="2" />
            ${Array.from({length: 9}).map((_, i) => `
                <line x1="0" y1="${(i+1)*(bSize/10)}" x2="${tSize}" y2="${(i+1)*(bSize/10)}" stroke="${config.ten.stroke}" stroke-width="0.8" stroke-opacity="0.3" />
            `).join('')}
        </g>
    `;

    // Helper for Ones (Unit)
    const renderOne = (x, y) => `
        <rect x="${x}" y="${y}" width="${tSize}" height="${tSize}" fill="url(#grad-one)" stroke="${config.one.stroke}" stroke-width="1.5" rx="2" filter="url(#shadow)" />
    `;

    // Layouting
    if (thousands > 0) {
        for (let i = 0; i < thousands; i++) {
            if (currentX + bSize > xMax) { currentX = 20; currentY += bSize + 25; }
            svgContent += renderThousand(currentX, currentY);
            currentX += bSize + 30;
        }
        currentX = 20; currentY += bSize + 15 + gap;
    }

    if (hundreds > 0) {
        for (let i = 0; i < hundreds; i++) {
            if (currentX + bSize > xMax) { currentX = 20; currentY += bSize + 10; }
            svgContent += renderHundred(currentX, currentY);
            currentX += bSize + 10;
        }
        currentX = 20; currentY += bSize + gap;
    }

    if (tens > 0) {
        for (let i = 0; i < tens; i++) {
            if (currentX + tSize > xMax) { currentX = 20; currentY += bSize + 10; }
            svgContent += renderTen(currentX, currentY);
            currentX += tSize + 10;
        }
        currentX = 20; currentY += bSize + gap;
    }

    if (ones > 0) {
        for (let i = 0; i < ones; i++) {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const x = 20 + col * (tSize + 4);
            const y = currentY + row * (tSize + 4);
            svgContent += renderOne(x, y);
            if (i === ones - 1) currentY += (row + 1) * (tSize + 4);
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${currentY + 20}" width="100%" style="border-radius: 12px; background: #ffffff; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05); padding: 10px;">
        ${svgContent}
    </svg>`;
};
