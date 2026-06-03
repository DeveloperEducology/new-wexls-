import React from 'react';

/**
 * Parses simple HTML tags (strong, b, u, i, em, span with style/color) into React elements
 * to prevent literal tag rendering while avoiding unsafe dangerouslySetInnerHTML.
 * 
 * @param {string} text - The input text containing potential HTML tags
 * @returns {React.ReactNode} Parsed React elements or the original text
 */
export function parseHTMLToJSX(text) {
  if (typeof text !== 'string') return text;
  if (!text.includes('<') || !text.includes('>')) return text;

  // Split string by HTML tags to tokenize
  const tokens = text.split(/(<\/?[a-zA-Z0-9]+(?:\s+[^>]*)*>)/g);
  const elements = [];
  
  // Style stack to accumulate styles from open tags
  const styleStack = [{
    bold: false,
    italic: false,
    underline: false,
    color: null
  }];

  const currentStyle = () => {
    const res = {};
    styleStack.forEach(s => {
      if (s.bold) res.fontWeight = 'bold';
      if (s.italic) res.fontStyle = 'italic';
      if (s.underline) res.textDecoration = 'underline';
      if (s.color) res.color = s.color;
    });
    return res;
  };

  tokens.forEach((token, index) => {
    if (!token) return;

    if (token.startsWith('<') && token.endsWith('>')) {
      const isClosing = token.startsWith('</');
      const tagMatch = token.match(/^<\/?([a-zA-Z0-9]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';

      if (isClosing) {
        if (styleStack.length > 1) {
          styleStack.pop();
        }
      } else {
        const newStyle = { ...styleStack[styleStack.length - 1] };
        if (tagName === 'strong' || tagName === 'b') {
          newStyle.bold = true;
        } else if (tagName === 'i' || tagName === 'em') {
          newStyle.italic = true;
        } else if (tagName === 'u') {
          newStyle.underline = true;
        } else if (tagName === 'span') {
          // Parse potential color style, e.g., style="color: #7c3aed"
          const colorMatch = token.match(/color:\s*([^;"]+)/);
          if (colorMatch) {
            newStyle.color = colorMatch[1].trim();
          }
        }
        styleStack.push(newStyle);
      }
    } else {
      const styles = currentStyle();
      if (Object.keys(styles).length > 0) {
        elements.push(
          React.createElement('span', { key: index, style: styles }, token)
        );
      } else {
        elements.push(token);
      }
    }
  });

  return elements;
}
