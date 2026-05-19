'use client';

import React from 'react';
import katex from 'katex';

export default function KaTeXRenderer({ math, displayMode = false, style = {} }) {
  if (!math) return null;

  let html = '';
  try {
    html = katex.renderToString(String(math), {
      throwOnError: false,
      displayMode: displayMode,
    });
  } catch (err) {
    console.error('KaTeX rendering error:', err);
    html = String(math);
  }

  return (
    <span
      style={{
        display: displayMode ? 'block' : 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
