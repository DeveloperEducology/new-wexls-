'use client';

import React from 'react';
import UniversalActivityRenderer from '../../UniversalActivityRenderer';

/**
 * Isolated TokenSelect (pick_from_sentence) Activity Component.
 * Completely encapsulated - changes here do not affect MCQ or Math activities.
 */
export default function TokenSelectActivity(props) {
  return (
    <UniversalActivityRenderer
      {...props}
    />
  );
}
