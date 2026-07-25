'use client';

import { useState, useCallback } from 'react';

const DEFAULT_COLUMNS = ['number_to_factor', 'Result', 'Distractor1', 'Distractor2', 'Distractor3'];
const DEFAULT_ROWS = [
  {
    _level: 'l1',
    number_to_factor: '640',
    Result: '2 x 2 x 2 x 2 x 2 x 2 x 2 x 5',
    Distractor1: '2 x 2 x 2 x 2 x 2 x 5',
    Distractor2: '2 x 2 x 2 x 2 x 2 x 2 x 5',
    Distractor3: '2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 x 5'
  },
  {
    _level: 'l2',
    number_to_factor: '450',
    Result: '2 x 3 x 3 x 5 x 5',
    Distractor1: '2 x 3 x 3 x 5',
    Distractor2: '2 x 3 x 5 x 5',
    Distractor3: '2 x 2 x 3 x 3 x 5 x 5'
  },
  {
    _level: 'l3',
    number_to_factor: '360',
    Result: '2 x 2 x 2 x 3 x 3 x 5',
    Distractor1: '2 x 2 x 3 x 3 x 5',
    Distractor2: '2 x 2 x 2 x 3 x 5',
    Distractor3: '2 x 2 x 2 x 2 x 3 x 3 x 5'
  }
];

export function useGridEditorStore() {
  // Metadata state
  const [title, setTitle] = useState('Prime Factorization Grid');
  const [subject, setSubject] = useState('Maths');
  const [topic, setTopic] = useState('Factors');
  const [grade, setGrade] = useState('Grade 5');
  const [targetCollection, setTargetCollection] = useState('questions_v2');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [jnvstSection, setJnvstSection] = useState('Mental Ability');
  const [jnvstTopic, setJnvstTopic] = useState('');
  const [jnvstDifficulty, setJnvstDifficulty] = useState('medium');
  const [customTemplateId, setCustomTemplateId] = useState('');

  // Grid Data state
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  // Prompt & Parts state
  const [blueprint, setBlueprint] = useState('Find the prime factorization of [number_to_factor].');
  const [solution, setSolution] = useState('');
  const [customPartsText, setCustomPartsText] = useState('');
  const [isPartsRawJsonMode, setIsPartsRawJsonMode] = useState(false);

  // Option Choices state
  const [questionMode, setQuestionMode] = useState('mcq');
  const [imageHasAudio, setImageHasAudio] = useState(false);
  const [imageIsTransparent, setImageIsTransparent] = useState(false);
  const [optionsBinding, setOptionsBinding] = useState([
    { column: 'Result', isCorrect: true, misconception: '' },
    { column: 'Distractor1', isCorrect: false, misconception: 'Missing factor' },
    { column: 'Distractor2', isCorrect: false, misconception: 'Extra factor' },
    { column: 'Distractor3', isCorrect: false, misconception: 'Calculation error' }
  ]);

  // Loading & Modal Status flags
  const [warmingTts, setWarmingTts] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [pushingToGoogleSheet, setPushingToGoogleSheet] = useState(false);

  const setGridData = useCallback((newColumns, newRows) => {
    setColumns(newColumns);
    setRows(newRows);
    setActiveRowIndex(0);
  }, []);

  return {
    // Metadata
    title, setTitle,
    subject, setSubject,
    topic, setTopic,
    grade, setGrade,
    targetCollection, setTargetCollection,
    selectedExamId, setSelectedExamId,
    jnvstSection, setJnvstSection,
    jnvstTopic, setJnvstTopic,
    jnvstDifficulty, setJnvstDifficulty,
    customTemplateId, setCustomTemplateId,

    // Grid Data
    columns, setColumns,
    rows, setRows,
    activeRowIndex, setActiveRowIndex,
    setGridData,

    // Prompt & Parts
    blueprint, setBlueprint,
    solution, setSolution,
    customPartsText, setCustomPartsText,
    isPartsRawJsonMode, setIsPartsRawJsonMode,

    // Option Choices
    questionMode, setQuestionMode,
    imageHasAudio, setImageHasAudio,
    imageIsTransparent, setImageIsTransparent,
    optionsBinding, setOptionsBinding,

    // Status Flags
    warmingTts, setWarmingTts,
    fetchingImages, setFetchingImages,
    aiGenerating, setAiGenerating,
    pushingToGoogleSheet, setPushingToGoogleSheet
  };
}
