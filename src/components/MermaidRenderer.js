'use client';

import { useEffect, useRef, useState } from 'react';

export default function MermaidRenderer({ chart }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // If mermaid is already loaded on the window, use it
    if (window.mermaid) {
      setLoaded(true);
      return;
    }

    // Load from CDN dynamically so we do not bloat server bundles or cause SSR errors
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        });
        setLoaded(true);
      } catch (err) {
        console.error('Mermaid initialization failed:', err);
      }
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (loaded && ref.current && chart) {
      try {
        ref.current.innerHTML = `<div style="font-size:0.85rem;color:#64748b;padding:8px;">Rendering diagram...</div>`;
        
        // Auto-repair common Mermaid syntax errors
        const repairedChart = chart
          .replace(/(^|[\s|;])\[([^\]\n]+)\]/g, (match, prefix, nodeName) => {
            const sanitizedId = nodeName.replace(/[^a-zA-Z0-9]/g, '') || 'node';
            return `${prefix}${sanitizedId}["${nodeName.trim()}"]`;
          })
          .replace(/(-->|-\.-\.>|==>)\|([^|\n]+)\|/g, (match, arrow, label) => {
            const trimmed = label.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
              return match;
            }
            return `${arrow}|"${trimmed.replace(/"/g, '\\"')}"|`;
          });

        const id = 'mermaid-' + Math.random().toString(36).substring(2, 11);
        
        window.mermaid.render(id, repairedChart).then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        }).catch((err) => {
          console.error('Mermaid render error:', err);
          // Find and clean any bad elements Mermaid might leave behind
          const badEl = document.getElementById(id);
          if (badEl) badEl.remove();

          if (ref.current) {
            ref.current.innerHTML = `
              <div style="color:#ef4444;font-size:0.82rem;padding:10px 14px;background:#fef2f2;border:1px solid #fee2e2;border-radius:6px;margin:8px 0;max-width:100%;text-align:left;">
                <strong>⚠️ Diagram rendering failed:</strong><br/>
                <code style="font-size:0.78rem;background:none;color:#b91c1c;word-break:break-all;font-weight:600;">${err.message || 'Syntax error'}</code>
              </div>
            `;
          }
        });
      } catch (e) {
        console.error('Mermaid exception:', e);
      }
    }
  }, [loaded, chart]);

  return (
    <div 
      className="mermaid-container no-print" 
      ref={ref} 
      style={{ 
        margin: '20px 0', 
        display: 'flex', 
        justifyContent: 'center', 
        overflowX: 'auto',
        background: '#f8fafc',
        padding: '16px',
        borderRadius: '8px',
        border: '1px dashed #cbd5e1'
      }} 
    />
  );
}
