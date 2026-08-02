'use client';

import React, { useState, useEffect } from 'react';

/**
 * FramedImage renders a non-destructive visual viewport crop/mask of an image,
 * preserving natural aspect ratio without stretching or distortion.
 * 
 * @param {Object} props
 * @param {string} props.src - Image URL
 * @param {Object} [props.cropWindow] - { x: number (%), y: number (%), width: number (%), height: number (%) }
 * @param {string} [props.alt] - Alt text
 * @param {Object} [props.style] - Custom container styles
 * @param {string} [props.className] - Custom class names
 * @param {Object} [props.imgStyle] - Custom inner img styles
 */
export default function FramedImage({ src, cropWindow, alt = '', style = {}, className = '', imgStyle = {} }) {
  const [naturalAspect, setNaturalAspect] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;
    setHasError(false);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setNaturalAspect(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onerror = () => {
      setHasError(true);
    };
  }, [src]);

  if (!src || hasError) return null;

  // If no crop window or full uncropped 100% window, render normal image
  if (!cropWindow || !cropWindow.width || !cropWindow.height || (cropWindow.x === 0 && cropWindow.y === 0 && cropWindow.width >= 99.5 && cropWindow.height >= 99.5)) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', ...style, ...imgStyle }}
        className={className}
      />
    );
  }

  const { x = 0, y = 0, width = 100, height = 100 } = cropWindow;
  const safeWidth = Math.max(width, 0.1);
  const safeHeight = Math.max(height, 0.1);

  // Correct physical aspect ratio = (Natural Image Aspect Ratio) * (cropWidth / cropHeight)
  const containerAspect = naturalAspect 
    ? naturalAspect * (safeWidth / safeHeight)
    : (safeWidth / safeHeight);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: style.width || '100%',
        maxWidth: style.maxWidth || '100%',
        aspectRatio: `${containerAspect}`,
        borderRadius: style.borderRadius || '8px',
        border: style.border || 'none',
        display: 'inline-block',
        verticalAlign: 'middle',
        boxSizing: 'border-box',
        ...style
      }}
      className={className}
    >
      <img
        src={src}
        alt={alt}
        onLoad={(e) => {
          if (e.target.naturalWidth && e.target.naturalHeight) {
            setNaturalAspect(e.target.naturalWidth / e.target.naturalHeight);
          }
        }}
        style={{
          position: 'absolute',
          top: `-${(y / safeHeight) * 100}%`,
          left: `-${(x / safeWidth) * 100}%`,
          width: `${(100 / safeWidth) * 100}%`,
          height: 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          pointerEvents: 'none',
          userSelect: 'none',
          ...imgStyle
        }}
      />
    </div>
  );
}
