import React, { useContext } from 'react';
import { UniversalDndContext } from '../UniversalDndRenderer';

export default function DraggableCard({
  item,
  isSelected,
  isDragging,
  isAnswered,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  style = {}
}) {
  const { cardStyle, hideItemLabels } = useContext(UniversalDndContext) || {};

  const normalizeStyleToken = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  const checkTransparent = (item, questionCardStyle) => {
    if (!item.imageUrl) return false;
    const qStyle = normalizeStyleToken(questionCardStyle);
    const itemCardStyle = normalizeStyleToken(item.cardStyle || item.imageCardStyle || item.renderStyle || item.variant);
    const itemBorder = normalizeStyleToken(item.border || item.cardBorder);
    const transparentStyles = new Set(['transparent_png', 'transparent', 'borderless', 'border_none', 'none', 'png_only']);

    return (
      transparentStyles.has(qStyle) ||
      transparentStyles.has(itemCardStyle) ||
      itemBorder === 'none' ||
      item.transparent === true ||
      item.showCard === false ||
      item.borderless === true
    );
  };

  const checkHideLabel = (item, questionCardStyle, hideItemLabels) => {
    const qStyle = normalizeStyleToken(questionCardStyle);
    const itemCardStyle = normalizeStyleToken(item.cardStyle || item.imageCardStyle || item.renderStyle || item.variant);
    return (
      hideItemLabels ||
      item.hideLabel === true ||
      itemCardStyle === 'transparent_png' ||
      qStyle === 'transparent_png' ||
      qStyle === 'png_only'
    );
  };

  const isTransparentPng = checkTransparent(item, cardStyle);
  const shouldHideText = checkHideLabel(item, cardStyle, hideItemLabels);

  const hasImage = !!item.imageUrl;
  const hasText = !shouldHideText && !!item.content && item.content.trim().length > 0;
  
  // Compute card size based on imageWidth or defaults
  const imageWidth = item.imageWidth ? parseInt(item.imageWidth, 10) : 120;
  const cardWidth = hasImage ? Math.min(200, Math.max(60, imageWidth + 24)) : 'auto';
  
  const baseCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTransparentPng ? '0px' : (hasImage && !hasText ? '8px' : '12px 16px'),
    backgroundColor: isTransparentPng ? 'transparent' : '#ffffff',
    border: isTransparentPng
      ? '2px solid transparent'
      : (isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0'),
    borderRadius: isTransparentPng ? '0px' : '12px',
    boxShadow: isTransparentPng
      ? 'none'
      : (isSelected 
          ? '0 0 0 2px rgba(37, 99, 235, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
          : '0 2px 4px rgba(0, 0, 0, 0.04)'),
    cursor: isAnswered ? 'default' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
    opacity: isDragging ? 0.4 : 1,
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    width: typeof cardWidth === 'number' ? `${cardWidth}px` : cardWidth,
    maxWidth: '240px',
    minWidth: '80px',
    minHeight: '44px',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: isSelected ? 10 : 1,
    ...style
  };

  const imageContainerStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: hasText ? '0 0 auto' : '1',
    marginBottom: hasText ? '8px' : '0px',
    overflow: isTransparentPng ? 'visible' : 'hidden',
    height: isTransparentPng ? 'auto' : (hasText ? '80px' : '100px'),
  };

  const imageStyle = {
    maxWidth: item.imageWidth ? `${item.imageWidth}px` : '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: isTransparentPng ? '0px' : '6px',
    pointerEvents: 'none',
    mixBlendMode: isTransparentPng ? 'multiply' : 'normal'
  };

  const textStyle = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
    textAlign: 'center',
    wordBreak: 'break-word',
    lineHeight: '1.4'
  };

  const handlePointerDown = (e) => {
    if (isAnswered) return;
    if (onPointerDown) {
      onPointerDown(e, item.id);
    }
  };

  const handlePointerMove = (e) => {
    if (isAnswered) return;
    if (onPointerMove) {
      onPointerMove(e);
    }
  };

  const handlePointerUp = (e) => {
    if (isAnswered) return;
    if (onPointerUp) {
      onPointerUp(e);
    }
  };

  // Hover animations using simple standard mouse events
  const handleMouseEnter = (e) => {
    if (isAnswered || isDragging) return;
    e.currentTarget.style.transform = 'translateY(-2px)';
    if (!isTransparentPng) {
      e.currentTarget.style.boxShadow = isSelected
        ? '0 0 0 2px rgba(37, 99, 235, 0.2), 0 6px 10px rgba(0, 0, 0, 0.08)'
        : '0 4px 8px rgba(0, 0, 0, 0.06)';
      if (!isSelected) {
        e.currentTarget.style.borderColor = '#cbd5e1';
      }
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'none';
    if (!isTransparentPng) {
      e.currentTarget.style.boxShadow = isSelected
        ? '0 0 0 2px rgba(37, 99, 235, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        : '0 2px 4px rgba(0, 0, 0, 0.04)';
      if (!isSelected) {
        e.currentTarget.style.borderColor = '#e2e8f0';
      }
    }
  };

  return (
    <div
      style={baseCardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasImage && (
        <div style={imageContainerStyle}>
          <img 
            src={item.imageUrl} 
            alt={item.content || 'draggable item'} 
            style={imageStyle} 
          />
        </div>
      )}
      {hasText && (
        <span style={textStyle}>
          {item.content}
        </span>
      )}
    </div>
  );
}
