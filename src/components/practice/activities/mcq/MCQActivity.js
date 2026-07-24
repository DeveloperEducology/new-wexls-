'use client';

import React from 'react';
import MCQRenderer from '../../MCQRenderer';

/**
 * Isolated MCQ Activity Component.
 * Completely encapsulated - changes here do not affect TokenSelect or Categorization activities.
 */
export default function MCQActivity(props) {
  return (
    <MCQRenderer
      {...props}
    />
  );
}
