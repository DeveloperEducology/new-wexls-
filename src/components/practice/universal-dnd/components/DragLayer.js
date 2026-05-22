import React, { useContext } from 'react';
import { UniversalDndContext } from '../UniversalDndRenderer';

export default function DragLayer({
  draggingItemId,
  dragState,
  items
}) {
  const { cardStyle, hideItemLabels } = useContext(UniversalDndContext) || {};

  if (!draggingItemId || !dragState || !dragState.isDragging) return null;

  const item = items.find(i => i.id === draggingItemId);
  if (!item) return null;

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

  const layerStyle = {
    position: 'fixed',
    left: `${dragState.currentX - (dragState.offsetX || 0)}px`,
    top: `${dragState.currentY - (dragState.offsetY || 0)}px`,
    width: `${dragState.width || 120}px`,
    height: `${dragState.height || 44}px`,
    pointerEvents: 'none',
    zIndex: 9999,
    boxSizing: 'border-box',
    transform: isTransparentPng ? 'scale(1.05)' : 'scale(1.05) rotate(2deg)',
    transformOrigin: 'center center',
    transition: 'transform 0.05s ease',
    opacity: 0.95
  };

  const cardStyleObj = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: isTransparentPng ? '0px' : (hasImage && !hasText ? '8px' : '12px 16px'),
    backgroundColor: isTransparentPng ? 'transparent' : '#ffffff',
    border: isTransparentPng ? '2px solid transparent' : '2px solid #3b82f6',
    borderRadius: isTransparentPng ? '0px' : '12px',
    boxShadow: isTransparentPng ? 'none' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
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

  return (
    <div style={layerStyle}>
      <div style={cardStyleObj}>
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
    </div>
  );
}
