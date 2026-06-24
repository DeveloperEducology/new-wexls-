'use client';

import { useEffect } from 'react';

export default function MermaidLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const runMermaid = () => {
      // If already loaded, just re-run scanner
      if (window.mermaid) {
        try {
          window.mermaid.contentLoaded();
        } catch (e) {
          console.error('Mermaid re-run failed:', e);
        }
        return;
      }

      // Check if script is already added in head to prevent duplicates
      const existingScript = document.getElementById('mermaid-cdn-script');
      if (existingScript) {
        return;
      }

      // Dynamically load Mermaid UMD build from CDN to bypass Turbopack dynamic import limitations
      const script = document.createElement('script');
      script.id = 'mermaid-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.0/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        if (window.mermaid) {
          try {
            window.mermaid.initialize({ 
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose'
            });
            window.mermaid.contentLoaded();
          } catch (e) {
            console.error('Mermaid initialization failed:', e);
          }
        }
      };
      script.onerror = (err) => console.error('Failed to load mermaid from CDN:', err);
      document.head.appendChild(script);
    };

    // Small delay to ensure the HTML elements are fully painted in the DOM
    const timer = setTimeout(runMermaid, 150);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
