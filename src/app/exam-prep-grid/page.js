'use client';

import React, { useState, useEffect } from 'react';
import TemplateGeneratorGrid from '../template-generator-grid/page';

/**
 * Dedicated 🏆 Exam Prep Mock Test Spreadsheet Editor Page
 * - Filtered strictly for Competitive Exam Prep Mock Tests (JNVST, IMO, Sainik School, NSO, etc.)
 */
export default function ExamPrepGridPage() {
  return (
    <TemplateGeneratorGrid
      initialMode="examprep"
      editorTitle="🏆 KlassChamp Exam Prep Mock Test Spreadsheet Editor"
    />
  );
}
