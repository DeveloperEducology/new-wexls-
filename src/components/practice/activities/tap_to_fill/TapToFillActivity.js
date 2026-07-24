'use client';

import React from 'react';
import MCQRenderer from '../../MCQRenderer';

/**
 * Isolated TapToFill Activity Component.
 * Completely encapsulated - changes here do not affect MCQ or Math activities.
 */
export default function TapToFillActivity(props) {
  return (
    <MCQRenderer
      {...props}
    />
  );
}
