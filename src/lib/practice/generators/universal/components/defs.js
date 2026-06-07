// Color palettes for premium styling
export const COLORS = {
  red: { fill: 'url(#redGrad)', stroke: '#b91c1c' },
  blue: { fill: 'url(#blueGrad)', stroke: '#1d4ed8' },
  green: { fill: 'url(#greenGrad)', stroke: '#047857' },
  yellow: { fill: 'url(#yellowGrad)', stroke: '#a16207' },
  pink: { fill: 'url(#pinkGrad)', stroke: '#be185d' },
  purple: { fill: 'url(#purpleGrad)', stroke: '#6d28d9' },
  orange: { fill: 'url(#orangeGrad)', stroke: '#c2410c' }
};

// SVG Gradients Definition Block to include in generated SVGs
export const SVG_DEFS = `
  <defs>
    <radialGradient id="redGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fca5a5" />
      <stop offset="70%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#991b1b" />
    </radialGradient>
    <radialGradient id="blueGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="70%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </radialGradient>
    <radialGradient id="greenGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#86efac" />
      <stop offset="70%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#064e3b" />
    </radialGradient>
    <radialGradient id="yellowGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="70%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#854d0e" />
    </radialGradient>
    <radialGradient id="pinkGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fbcfe8" />
      <stop offset="70%" stop-color="#ec4899" />
      <stop offset="100%" stop-color="#9d174d" />
    </radialGradient>
    <radialGradient id="purpleGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ddd6fe" />
      <stop offset="70%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#5b21b6" />
    </radialGradient>
    <radialGradient id="orangeGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fed7aa" />
      <stop offset="70%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#9a3412" />
    </radialGradient>
    
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
`;
