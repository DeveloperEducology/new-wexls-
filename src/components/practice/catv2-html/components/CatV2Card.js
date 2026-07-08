'use client';

import React from 'react';
import { resolveToolSvg } from '@/lib/practice/svgTools';
import KaTeXRenderer from '../../KaTeXRenderer';

function InlineMarkdown({ text }) {
  const sanitizedText = String(text || '').replace(/\$\$(.*?)\$\$/g, (match, p1) => `$${p1}$`);
  
  const parseMathAndText = (str, keyPrefix) => {
    const subSegments = str.split(/(\$[^\$]+\$)/g);
    return subSegments.map((subPiece, subIndex) => {
      const mathMatch = subPiece.match(/^\$([^\$]+)\$/);
      if (mathMatch) {
        return <KaTeXRenderer key={`${keyPrefix}-${subIndex}`} math={mathMatch[1]} displayMode={false} />;
      }
      return subPiece;
    });
  };

  return sanitizedText.split(/(\*\*[^*]+\*\*)/g).map((piece, index) => {
    const match = piece.match(/^\*\*([^*]+)\*\*$/);
    if (match) {
      return <strong key={index}>{parseMathAndText(match[1], `bold-${index}`)}</strong>;
    }
    return (
      <span key={index}>
        {parseMathAndText(piece, `text-${index}`)}
      </span>
    );
  });
}

const cleanSvgContent = (svgStr) => {
  if (!svgStr) return '';
  let cleaned = svgStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
  cleaned = cleaned.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
};

const isInlineSvg = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg');
};

export default function CatV2Card({
  item,
  selected = false,
  dragging = false,
  disabled = false,
  compact = false,
  cardStyle,
  hideLabel = false,
  onClick,
  onDragStart,
  onDragEnd,
}) {
  const toolSvg = resolveToolSvg(item);
  const svgContent = item.svg || toolSvg;
  const imageUrl = item.imageUrl;
  const transparent = cardStyle === 'transparent_png' || cardStyle === 'borderless';
  const hasVisual = Boolean(svgContent || imageUrl);
  const label = item.content || item.label || item.id;
  const isMath = typeof label === 'string' && (label.includes('$') || label.includes('\\'));
  const cardWidth = compact ? 92 : Number(item.imageWidth) || (hasVisual ? 132 : (isMath ? 320 : 96));

  return (
    <button
      type="button"
      draggable={!disabled}
      onClick={onClick}
      onDragStart={(event) => onDragStart?.(event, item)}
      onDragEnd={(event) => onDragEnd?.(event, item)}
      disabled={disabled}
      style={{
        width: 'auto',
        minWidth: cardWidth,
        maxWidth: isMath ? 400 : 280,
        minHeight: compact ? 58 : 78,
        border: transparent ? '1px solid transparent' : `2px solid ${selected ? '#2563eb' : '#5cc4ed'}`,
        background: transparent ? 'transparent' : '#ffffff',
        borderRadius: transparent ? 0 : 8,
        padding: transparent ? 0 : compact ? 8 : 10,
        boxShadow: transparent ? 'none' : dragging ? '0 16px 32px rgba(15,23,42,0.2)' : '0 8px 18px rgba(15,23,42,0.08)',
        color: '#0f172a',
        cursor: disabled ? 'default' : dragging ? 'grabbing' : 'grab',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        touchAction: 'manipulation',
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
      }}
      aria-pressed={selected}
    >
      {svgContent ? (
        <span
          aria-hidden="true"
          style={{
            width: '100%',
            height: compact ? 42 : 76,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: cleanSvgContent(svgContent) }}
        />
      ) : null}

      {!svgContent && imageUrl ? (
        isInlineSvg(imageUrl) ? (
          <span
            aria-hidden="true"
            style={{ width: '100%', height: compact ? 42 : 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: cleanSvgContent(imageUrl) }}
          />
        ) : (
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: compact ? 42 : 76,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )
      ) : null}

      {(!hasVisual || !hideLabel) && label ? (
        <span style={{ fontSize: compact ? 15 : 17, fontWeight: 900, lineHeight: 1.2, whiteSpace: isMath ? 'nowrap' : 'normal', textAlign: 'center' }}>
          <InlineMarkdown text={label} />
        </span>
      ) : null}
    </button>
  );
}
