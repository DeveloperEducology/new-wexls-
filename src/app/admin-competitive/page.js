'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import SiteHeader from '../../components/layout/SiteHeader';
import TestSeriesManager from '../../components/admin/TestSeriesManager';
import ImageFramingModal from '../../components/admin/ImageFramingModal';
import FramedImage from '../../components/common/FramedImage';

function parseMathAndText(text) {
  if (!text) return '';
  let str = typeof text === 'string' ? text : String(text);
  str = str.replace(/\\n/g, '\n').replace(/\/n/g, '\n');
  const trimmed = str.trim();
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<div')) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: str }}
        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '4px' }}
      />
    );
  }
  const parts = str.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <span key={i}>{part}</span>; }
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <div key={i}>{part}</div>; }
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2);
      try {
        const html = katex.renderToString(formula, { displayMode: true, throwOnError: false });
        return <div key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <div key={i}>{part}</div>; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const formula = part.slice(1, -1);
      try {
        const html = katex.renderToString(formula, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch { return <span key={i}>{part}</span>; }
    }
    let processed = part;
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/\n/g, '<br />');
    return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

import ImageCropperModal from '../../components/admin/grid/ImageCropperModal';

export default function AdminCompetitivePage() {
  const [activeTab, setActiveTab] = useState('spreadsheets'); // 'spreadsheets', 'test-series', 'question-bank', 'guide'
  const [selectedExamId, setSelectedExamId] = useState('jnvst');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states for Spreadsheets
  const [filterExam, setFilterExam] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  // Filter states for Question Bank
  const [sectionFilter, setSectionFilter] = useState('all'); // 'all', 'mat', 'arithmetic', 'language'
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // Question Form Modal State (Create / Edit / Duplicate)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    examId: 'jnvst',
    section: 'arithmetic',
    qNumber: 1,
    questionText: '',
    questionImage: '',
    optionA: '',
    optionAImage: '',
    optionB: '',
    optionBImage: '',
    optionC: '',
    optionCImage: '',
    optionD: '',
    optionDImage: '',
    questionImageCrop: null,
    optionAImageCrop: null,
    optionBImageCrop: null,
    optionCImageCrop: null,
    optionDImageCrop: null,
    correctOption: 'A',
    explanationText: '',
    isPYQ: true,
    pyqYear: 2025,
    tags: ''
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState(null); // 'questionImage', 'optionAImage', etc.

  // Image Framing / Masking Modal State
  const [framingModalOpen, setFramingModalOpen] = useState(false);
  const [framingTarget, setFramingTarget] = useState(null);

  const handleOpenFramingModal = (imageUrl, currentCropWindow, onSaveCrop) => {
    if (!imageUrl) return;
    setFramingTarget({
      imageUrl,
      cropWindow: currentCropWindow || { x: 0, y: 0, width: 100, height: 100 },
      onSave: onSaveCrop
    });
    setFramingModalOpen(true);
  };

  // Cropper Modal State
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: null,
    targetField: null
  });

  // Batch JSON & Text Parser Import Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchParsing, setBatchParsing] = useState(false);
  const [batchMeta, setBatchMeta] = useState({
    examId: 'jnvst',
    section: 'arithmetic',
    pyqYear: 2024,
    isPYQ: true,
    startQNum: 1
  });

  // Fetch Spreadsheets & Templates
  const loadSpreadsheets = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        let allList = [];
        if (Array.isArray(data.dynamicTemplates)) {
          allList.push(...data.dynamicTemplates);
        }
        if (Array.isArray(data.templates)) {
          allList.push(...data.templates);
        } else if (data.templates && typeof data.templates === 'object') {
          Object.values(data.templates).forEach(val => {
            if (Array.isArray(val)) allList.push(...val);
            else if (val && typeof val === 'object') allList.push(val);
          });
        }

        const seen = new Set();
        const deduped = [];
        allList.forEach(t => {
          const id = String(t.id || t._id);
          if (id && !seen.has(id)) {
            seen.add(id);
            deduped.push(t);
          }
        });

        setTemplates(deduped);
      }
    } catch (err) {
      console.error('Failed to load spreadsheets:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fetch Static Question Bank
  const loadQuestionBank = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/questions?examId=${selectedExamId}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  useEffect(() => {
    if (activeTab === 'spreadsheets') loadSpreadsheets();
    if (activeTab === 'question-bank') loadQuestionBank();
  }, [activeTab, selectedExamId]);

  // Trigger Image Cropper Modal for Selected File
  const handleSelectFileForCropper = (file, targetField) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperState({
        isOpen: true,
        imageSrc: e.target.result,
        targetField
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle File Upload directly to R2 Storage (without crop)
  const handleFileUpload = async (file, targetField) => {
    if (!file) return;
    setUploadingTarget(targetField);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'jnvst-questions');

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success || data.url) {
        const imageUrl = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url);
        setQuestionFormData(prev => ({
          ...prev,
          [targetField]: imageUrl
        }));
      } else {
        alert(data.error || 'Failed to upload image to R2.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image to R2 storage.');
    } finally {
      setUploadingTarget(null);
    }
  };

  // Open Form to Create New Question
  const handleOpenCreateQuestion = () => {
    setEditingQuestionId(null);
    setQuestionFormData({
      examId: selectedExamId,
      section: 'arithmetic',
      qNumber: questions.length + 1,
      questionText: '',
      questionImage: '',
      optionA: '',
      optionAImage: '',
      optionB: '',
      optionBImage: '',
      optionC: '',
      optionCImage: '',
      optionD: '',
      optionDImage: '',
      correctOption: 'A',
      explanationText: '',
      isPYQ: true,
      pyqYear: 2025,
      tags: 'jnvst, pyq'
    });
    setShowQuestionModal(true);
  };

  // Open Form to Edit Existing Question
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q._id || q.id);
    const opts = q.options || {};
    const optImgs = q.optionsImages || {};
    const optCrops = q.optionsImagesCrops || {};

    setQuestionFormData({
      examId: q.examId || selectedExamId,
      section: q.section || 'arithmetic',
      qNumber: q.qNumber || 1,
      questionText: q.questionText || '',
      questionImage: q.questionImage || q.imageUrl || '',
      questionImageCrop: q.questionImageCrop || q.cropWindow || null,
      optionA: typeof opts === 'object' ? (opts.A || opts.optionA || '') : '',
      optionAImage: optImgs.A || '',
      optionAImageCrop: optCrops.A || null,
      optionB: typeof opts === 'object' ? (opts.B || opts.optionB || '') : '',
      optionBImage: optImgs.B || '',
      optionBImageCrop: optCrops.B || null,
      optionC: typeof opts === 'object' ? (opts.C || opts.optionC || '') : '',
      optionCImage: optImgs.C || '',
      optionCImageCrop: optCrops.C || null,
      optionD: typeof opts === 'object' ? (opts.D || opts.optionD || '') : '',
      optionDImage: optImgs.D || '',
      optionDImageCrop: optCrops.D || null,
      correctOption: q.correctOption || q.answer || 'A',
      explanationText: q.explanationText || '',
      isPYQ: Boolean(q.isPYQ !== false),
      pyqYear: q.pyqYear || 2025,
      tags: Array.isArray(q.tags) ? q.tags.join(', ') : (q.tags || '')
    });
    setShowQuestionModal(true);
  };

  // Open Form to Duplicate Question
  const handleDuplicateQuestion = (q) => {
    setEditingQuestionId(null);
    const opts = q.options || {};
    const optImgs = q.optionsImages || {};
    const optCrops = q.optionsImagesCrops || {};

    setQuestionFormData({
      examId: q.examId || selectedExamId,
      section: q.section || 'arithmetic',
      qNumber: questions.length + 1,
      questionText: (q.questionText || '') + ' (Copy)',
      questionImage: q.questionImage || q.imageUrl || '',
      questionImageCrop: q.questionImageCrop || q.cropWindow || null,
      optionA: typeof opts === 'object' ? (opts.A || opts.optionA || '') : '',
      optionAImage: optImgs.A || '',
      optionAImageCrop: optCrops.A || null,
      optionB: typeof opts === 'object' ? (opts.B || opts.optionB || '') : '',
      optionBImage: optImgs.B || '',
      optionBImageCrop: optCrops.B || null,
      optionC: typeof opts === 'object' ? (opts.C || opts.optionC || '') : '',
      optionCImage: optImgs.C || '',
      optionCImageCrop: optCrops.C || null,
      optionD: typeof opts === 'object' ? (opts.D || opts.optionD || '') : '',
      optionDImage: optImgs.D || '',
      optionDImageCrop: optCrops.D || null,
      correctOption: q.correctOption || q.answer || 'A',
      explanationText: q.explanationText || '',
      isPYQ: Boolean(q.isPYQ !== false),
      pyqYear: q.pyqYear || 2025,
      tags: Array.isArray(q.tags) ? q.tags.join(', ') : (q.tags || '')
    });
    setShowQuestionModal(true);
  };

  // Save Single Question Form (Create / Edit)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setSavingQuestion(true);
    try {
      const payload = {
        _id: editingQuestionId,
        id: editingQuestionId,
        examId: questionFormData.examId,
        section: questionFormData.section,
        qNumber: Number(questionFormData.qNumber),
        questionText: questionFormData.questionText,
        questionImage: questionFormData.questionImage,
        questionImageCrop: questionFormData.questionImageCrop,
        options: {
          A: questionFormData.optionAImage ? '' : questionFormData.optionA,
          B: questionFormData.optionBImage ? '' : questionFormData.optionB,
          C: questionFormData.optionCImage ? '' : questionFormData.optionC,
          D: questionFormData.optionDImage ? '' : questionFormData.optionD
        },
        optionsImages: {
          A: questionFormData.optionAImage,
          B: questionFormData.optionBImage,
          C: questionFormData.optionCImage,
          D: questionFormData.optionDImage
        },
        optionsImagesCrops: {
          A: questionFormData.optionAImageCrop,
          B: questionFormData.optionBImageCrop,
          C: questionFormData.optionCImageCrop,
          D: questionFormData.optionDImageCrop
        },
        correctOption: questionFormData.correctOption,
        answer: questionFormData.correctOption,
        explanationText: questionFormData.explanationText,
        isPYQ: questionFormData.isPYQ,
        pyqYear: Number(questionFormData.pyqYear) || 2025,
        tags: questionFormData.tags ? questionFormData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: 'active'
      };

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setShowQuestionModal(false);
        loadQuestionBank();
      } else {
        alert(data.error || 'Failed to save question.');
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Error saving question.');
    } finally {
      setSavingQuestion(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${qId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadQuestionBank();
      } else {
        alert(data.error || 'Failed to delete question.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting question.');
    }
  };

  // Batch Parse & Import JSON / Raw Text
  const handleBatchImport = async () => {
    if (!batchRawText.trim()) return alert('Please paste JSON or text questions.');
    setBatchParsing(true);

    try {
      let questionsToImport = [];
      const trimmed = batchRawText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          questionsToImport = Array.isArray(parsed) ? parsed : [parsed];
        } catch (jsonErr) {
          try {
            const relaxedFn = new Function(`return ${trimmed}`);
            const parsed = relaxedFn();
            questionsToImport = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e2) {
            throw new Error(`JSON Syntax Error: ${jsonErr.message}`);
          }
        }
      } else {
        // Smart Raw Text Block Parser
        const blocks = trimmed.split(/\n\s*\n/);
        const startNum = Number(batchMeta.startQNum) || 1;

        blocks.forEach((block, idx) => {
          let lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length === 0) return;

          let detectedAns = 'A';
          let detectedSection = batchMeta.section;
          let questionText = lines[0];

          // Strip question number prefix like "1. ", "Q1: ", "1) "
          questionText = questionText.replace(/^(Q?\d+[\.\:\)]\s*)/i, '');

          const optionLines = [];
          
          lines.slice(1).forEach(line => {
            // Check for answer directive e.g. "Ans: B", "Answer: C", "Correct: A", "Key: D"
            const ansMatch = line.match(/^(?:ans|answer|correct|key)\s*[\:\-\=]\s*([A-D])/i);
            if (ansMatch) {
              detectedAns = ansMatch[1].toUpperCase();
              return;
            }

            // Check for section directive e.g. "Section: mat"
            const secMatch = line.match(/^section\s*[\:\-\=]\s*(\w+)/i);
            if (secMatch) {
              detectedSection = secMatch[1].toLowerCase();
              return;
            }

            // Clean option prefix e.g. "A) ", "A. ", "(A) ", "1) "
            let cleanOpt = line.replace(/^(\([A-D1-4]\)|[A-D1-4][\)\.\:\-]\s*)/i, '').trim();
            if (cleanOpt) {
              optionLines.push(cleanOpt);
            }
          });

          const qObj = {
            examId: batchMeta.examId || selectedExamId,
            section: detectedSection || batchMeta.section,
            qNumber: startNum + idx,
            questionText: questionText,
            options: {
              A: optionLines[0] || 'Option A',
              B: optionLines[1] || 'Option B',
              C: optionLines[2] || 'Option C',
              D: optionLines[3] || 'Option D'
            },
            correctOption: detectedAns,
            explanationText: '',
            isPYQ: Boolean(batchMeta.isPYQ),
            pyqYear: Number(batchMeta.pyqYear) || 2024
          };
          questionsToImport.push(qObj);
        });
      }

      if (questionsToImport.length === 0) return alert('No valid questions found to import.');

      const defaultStartNum = Number(batchMeta.startQNum) || 1;

      for (let i = 0; i < questionsToImport.length; i++) {
        const q = questionsToImport[i];
        const payload = {
          examId: q.examId || batchMeta.examId || selectedExamId,
          section: q.section || batchMeta.section || 'arithmetic',
          qNumber: Number(q.qNumber || q.qNum || (defaultStartNum + i)),
          questionText: q.questionText || q.question || '',
          questionImage: q.questionImage || q.imageUrl || '',
          options: q.options || {
            A: q.optionA || 'Option A',
            B: q.optionB || 'Option B',
            C: q.optionC || 'Option C',
            D: q.optionD || 'Option D'
          },
          optionsImages: q.optionsImages || {},
          correctOption: q.correctOption || q.answer || 'A',
          explanationText: q.explanationText || q.explanation || '',
          isPYQ: q.isPYQ !== undefined ? Boolean(q.isPYQ) : Boolean(batchMeta.isPYQ),
          pyqYear: q.pyqYear ? Number(q.pyqYear) : Number(batchMeta.pyqYear || 2024),
          tags: q.tags || ['jnvst', 'pyq'],
          status: 'active'
        };

        await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      alert(`✅ Successfully imported ${questionsToImport.length} questions!`);
      setShowBatchModal(false);
      setBatchRawText('');
      if (typeof loadQuestionBank === 'function') loadQuestionBank();
    } catch (err) {
      console.error(err);
      alert(`Import error: ${err.message}`);
    } finally {
      setBatchParsing(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const title = (t.title || t.name || t.id || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || title.includes(search) || (t.subject || '').toLowerCase().includes(search) || (t.topic || '').toLowerCase().includes(search);
    const matchesExam = filterExam === 'all' || (t.examId || '').toLowerCase() === filterExam.toLowerCase();
    const matchesSubject = filterSubject === 'all' || (t.subject || '').toLowerCase() === filterSubject.toLowerCase();
    const matchesGrade = filterGrade === 'all' || String(t.grade || '').toLowerCase() === filterGrade.toLowerCase();

    return matchesSearch && matchesExam && matchesSubject && matchesGrade;
  });

  // Filter Question Bank
  const filteredQuestions = questions.filter(q => {
    if (sectionFilter === 'all') return true;
    return (q.section || '').toLowerCase() === sectionFilter.toLowerCase();
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SiteHeader />

      {/* Main Admin Portal Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Top Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '24px',
          padding: '32px',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(49, 46, 129, 0.35)',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '12px' }}>
                🏆 Dedicated Portal V2.0 (100% Optimized)
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
                Competitive Exams &amp; Mock Test Admin
              </h1>
              <p style={{ margin: '8px 0 0 0', opacity: 0.88, fontSize: '0.98rem', maxWidth: '750px', lineHeight: 1.5 }}>
                Manage JNVST, IMO, NSO Full Mock Tests, Test Series &amp; Direct Row-by-Row Spreadsheets independently from K-12 School Practice.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/admin-v2"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🏫 Switch to School Practice Admin
              </Link>

              <Link
                href={`/exam-prep/${selectedExamId}/mock-test?templateId=2025-jnvst-official-pyq-template`}
                target="_blank"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '12px 22px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                🚀 Launch Official Mock Test
              </Link>
            </div>
          </div>

          {/* KPI Dashboard Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Full Mock Tests</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>10 Published</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Spreadsheets &amp; Grids</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>{templates.length} Active</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Orderwise Question Bank</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>{questions.length} Questions</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 18px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', opacity: 0.75, fontWeight: 700 }}>Official Exam Timer</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '2px' }}>120 Mins (2 Hours)</div>
            </div>
          </div>
        </div>

        {/* Primary Admin Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          background: '#ffffff',
          padding: '8px',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('spreadsheets')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'spreadsheets' ? '#4338ca' : 'transparent',
              color: activeTab === 'spreadsheets' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📊 Direct Spreadsheet Manager ({templates.length})
          </button>

          <button
            onClick={() => setActiveTab('test-series')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'test-series' ? '#4338ca' : 'transparent',
              color: activeTab === 'test-series' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🏆 Test Series &amp; Full Mocks
          </button>

          <button
            onClick={() => setActiveTab('question-bank')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'question-bank' ? '#4338ca' : 'transparent',
              color: activeTab === 'question-bank' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🗃️ Static Question Bank ({questions.length})
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '14px 20px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              background: activeTab === 'guide' ? '#0891b2' : 'transparent',
              color: activeTab === 'guide' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📖 How-To Guide
          </button>
        </div>

        {/* Tab 1: Direct Spreadsheet Manager */}
        {activeTab === 'spreadsheets' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  📊 Direct Spreadsheet Grid &amp; CSV Catalog
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Directly edit, preview row-by-row, and link spreadsheet grids to full mock tests.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search topic or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    minWidth: '180px'
                  }}
                />

                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                >
                  <option value="all">🏆 All Exams</option>
                  <option value="jnvst">JNVST (Navodaya)</option>
                  <option value="imo">IMO Olympiad</option>
                  <option value="nso">NSO Olympiad</option>
                  <option value="cbse_class5">CBSE Entrance</option>
                </select>

                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                >
                  <option value="all">📚 All Subjects</option>
                  <option value="math">Math / Arithmetic</option>
                  <option value="english">English / Phonics</option>
                  <option value="science">Science</option>
                  <option value="previous_years">Previous Years PYQs</option>
                </select>

                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                >
                  <option value="all">🎓 All Classes / Grades</option>
                  <option value="ukg">UKG</option>
                  <option value="5">Class / Grade 5</option>
                  <option value="6">Class / Grade 6</option>
                  <option value="7">Class / Grade 7</option>
                  <option value="8">Class / Grade 8</option>
                </select>

                <Link
                  href="/template-generator-grid"
                  target="_blank"
                  style={{
                    background: '#4338ca',
                    color: '#ffffff',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontSize: '0.88rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ➕ Create Spreadsheet Grid
                </Link>
              </div>
            </div>

            {loadingTemplates ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Loading spreadsheets...</div>
            ) : filteredTemplates.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>No spreadsheets found matching search filters.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                {filteredTemplates.map((t, idx) => {
                  const tId = t.id || t._id;
                  const rowCount = Array.isArray(t.rows) ? t.rows.length : (t.variables ? t.variables.length : 0);
                  const isStatic = t.isSpreadsheetStatic || (t.rows && t.rows.length > 0 && t.rows[0].optionA);

                  return (
                    <div
                      key={tId || idx}
                      style={{
                        background: '#ffffff',
                        border: isStatic ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <span style={{
                            background: isStatic ? '#dcfce7' : '#e0e7ff',
                            color: isStatic ? '#166534' : '#3730a3',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            textTransform: 'uppercase'
                          }}>
                            {isStatic ? `📊 Static Spreadsheet (${rowCount} Rows)` : `🧮 Dynamic Formula Blueprint`}
                          </span>

                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                            {t.subject || 'math'} • {t.topic || 'general'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                          {t.title || t.name || tId}
                        </h3>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                          ID: {tId}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <Link
                          href={`/template-generator-grid?templateId=${tId}`}
                          target="_blank"
                          style={{
                            flex: 1,
                            background: '#ffffff',
                            color: '#334155',
                            border: '1.5px solid #cbd5e1',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center'
                          }}
                        >
                          ✏️ Edit Grid
                        </Link>

                        <Link
                          href={`/exam-prep/${t.examId || 'jnvst'}/mock-test?templateId=${tId}`}
                          target="_blank"
                          style={{
                            flex: 1,
                            background: '#10b981',
                            color: '#ffffff',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            textDecoration: 'none',
                            textAlign: 'center',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          🚀 Launch Mock
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Test Series & Full Mock Test Manager */}
        {activeTab === 'test-series' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  JNVST &amp; Competitive Exam Test Series
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Create and manage official 80-Question Mock Tests, set timers, and publish exam packages.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#475569' }}>Select Exam Package:</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#0f172a'
                  }}
                >
                  <option value="jnvst">JNVST Class 6 (Navodaya)</option>
                  <option value="imo">IMO Math Olympiad</option>
                  <option value="nso">NSO Science Olympiad</option>
                  <option value="cbse_class5">CBSE Class 5 Entrance</option>
                </select>
              </div>
            </div>

            <TestSeriesManager selectedExamId={selectedExamId} />
          </div>
        )}

        {/* Tab 4: How-To Guide */}
        {activeTab === 'guide' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontFamily: 'Inter, sans-serif', maxWidth: '860px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2rem' }}>📖</span>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Admin How-To Guide</h2>
                <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>JNVST</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                Complete workflow for adding PYQ question banks and publishing year-specific mock tests.
              </p>
            </div>

            {/* ─── GUIDE SECTION 1: Add a PYQ Question ─── */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>1</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add a question as a PYQ</h3>
              </div>
              <div style={{ marginLeft: '48px', display: 'grid', gap: '12px' }}>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0 }}>
                  Go to the <strong>🗃️ Static Question Bank</strong> tab → click <strong style={{ color: '#10b981' }}>+ Create New Question</strong>.
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>Field</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 800, color: '#475569' }}>What to set</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Exam ID', 'JNVST Class 6'],
                        ['Section', 'mat / arithmetic / language'],
                        ['Q. Number', 'Match the original paper (1–80)'],
                        ['✅ Official PYQ', 'Check this box'],
                        ['PYQ Year', '2020, 2022, 2023…'],
                        ['Tags', 'jnvst, pyq, 2020'],
                        ['Correct Answer', 'A / B / C / D'],
                      ].map(([f, v]) => (
                        <tr key={f} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 700, color: '#334155' }}>{f}</td>
                          <td style={{ padding: '10px 16px', color: '#64748b' }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '0.87rem', color: '#166534' }}>
                  💡 <strong>Bulk import tip:</strong> Use <strong>📋 Parse JSON / Text</strong> to paste a full paper at once. Include <code style={{ background: '#dcfce7', padding: '1px 5px', borderRadius: '4px' }}>isPYQ: true, pyqYear: 2020</code> in each question object.
                </div>
              </div>
            </div>

            {/* ─── GUIDE SECTION 2: Create Test Series ─── */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>2</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Create a Test Series (once per exam package)</h3>
              </div>
              <div style={{ marginLeft: '48px', display: 'grid', gap: '12px' }}>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0 }}>
                  Go to the <strong>🏆 Test Series &amp; Full Mocks</strong> tab → click <strong style={{ background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem' }}>➕ New Test Series</strong>.
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', fontSize: '0.88rem', color: '#334155' }}>
                  <div><strong>Series Title:</strong> <span style={{ color: '#6366f1' }}>"JNVST Official PYQ Test Pack"</span></div>
                  <div style={{ marginTop: '6px' }}><strong>Description:</strong> Year-wise official previous year papers for JNVST Class 6.</div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                  ✅ You only need <strong>one Test Series</strong> for all PYQ years. Each year becomes a separate Mock Test inside it.
                </p>
              </div>
            </div>

            {/* ─── GUIDE SECTION 3: Publish Mock Test per Year ─── */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>3</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Publish one Mock Test per year</h3>
              </div>
              <div style={{ marginLeft: '48px', display: 'grid', gap: '12px' }}>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0 }}>
                  Click <strong style={{ background: '#22c55e', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem' }}>➕ Publish Mock Test</strong> inside your series (or the + Add Mock Test button on a series row).
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'grid', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
                  <div><strong>Title:</strong> <span style={{ color: '#6366f1' }}>"JNVST 2020 Official Full Paper"</span></div>
                  <div><strong>Duration:</strong> 120 mins</div>
                  <div><strong>Total Questions:</strong> 80</div>
                  <div><strong>📅 PYQ Year:</strong> <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', color: '#92400e', fontWeight: 800 }}>2020</code> ← this is the new field, set it!</div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                  Repeat for each year: 2022, 2023, 2024… Each will appear as a separate row with a <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>📅 2020</span> badge.
                </p>
              </div>
            </div>

            {/* ─── GUIDE SECTION 4: Auto-Link by PYQ Year ─── */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>4</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Auto-link all questions to the mock test</h3>
              </div>
              <div style={{ marginLeft: '48px', display: 'grid', gap: '12px' }}>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0 }}>
                  Click <strong style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontSize: '0.82rem' }}>🔗 Link Questions</strong> on the mock test row. The dialog opens with two tabs:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#e0f2fe', border: '2px solid #0284c7', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#0c4a6e', marginBottom: '8px', fontSize: '0.9rem' }}>📅 Auto-Link by PYQ Year <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '8px' }}>RECOMMENDED</span></div>
                    <p style={{ color: '#075985', fontSize: '0.83rem', margin: 0 }}>
                      Just type the year (e.g. <strong>2020</strong>) → click <strong>"🔗 Auto-Link 2020 PYQs"</strong>. The system finds and links all matching questions automatically, sorted in the correct JNVST section order.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: 800, color: '#334155', marginBottom: '8px', fontSize: '0.9rem' }}>✏️ Manual Question IDs</div>
                    <p style={{ color: '#64748b', fontSize: '0.83rem', margin: 0 }}>
                      Paste comma-separated question IDs (e.g. <code>mat-analogy-01, mat-figure-01</code>) for custom or mixed-year mock tests.
                    </p>
                  </div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '0.87rem', color: '#166534' }}>
                  ✅ After auto-linking, you&apos;ll see: <em>"Linked 80 questions from 2020 PYQ paper."</em> The mock test is now live for students.
                </div>
              </div>
            </div>

            {/* ─── Visual Structure Example ─── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>📂 How it looks in the database</h3>
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '20px 24px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.7, color: '#94a3b8', overflow: 'auto' }}>
                <div style={{ color: '#38bdf8' }}>Test Series: <span style={{ color: '#fbbf24' }}>"JNVST Official PYQ Test Pack"</span></div>
                <div style={{ paddingLeft: '16px', color: '#a78bfa' }}>├── Mock Test: <span style={{ color: '#fff' }}>"JNVST 2020 Official Full Paper"</span> <span style={{ color: '#fef3c7' }}>📅 2020</span>  [80 Qs]</div>
                <div style={{ paddingLeft: '16px', color: '#a78bfa' }}>├── Mock Test: <span style={{ color: '#fff' }}>"JNVST 2022 Official Full Paper"</span> <span style={{ color: '#fef3c7' }}>📅 2022</span>  [80 Qs]</div>
                <div style={{ paddingLeft: '16px', color: '#a78bfa' }}>├── Mock Test: <span style={{ color: '#fff' }}>"JNVST 2023 Official Full Paper"</span> <span style={{ color: '#fef3c7' }}>📅 2023</span>  [80 Qs]</div>
                <div style={{ paddingLeft: '16px', color: '#a78bfa' }}>└── Mock Test: <span style={{ color: '#fff' }}>"JNVST 2024 Official Full Paper"</span> <span style={{ color: '#fef3c7' }}>📅 2024</span>  [80 Qs]</div>
              </div>
            </div>

            {/* ─── Section Sort Order ─── */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>📐 JNVST Section Order (auto-applied on link)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { num: 'Q 1–40', label: 'Mental Ability Test', color: '#7c3aed', bg: '#ede9fe', icon: '🧠' },
                  { num: 'Q 41–60', label: 'Arithmetic', color: '#0891b2', bg: '#e0f2fe', icon: '🔢' },
                  { num: 'Q 61–80', label: 'Language', color: '#16a34a', bg: '#f0fdf4', icon: '📝' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ fontWeight: 800, color: s.color, fontSize: '0.9rem' }}>{s.label}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>{s.num}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Quick Reference ─── */}
            <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px 24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>⚡ Quick Reference: Required question fields for auto-linking</h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.87rem' }}>
                {[
                  ['examId', '"jnvst"', 'Must match the exam package'],
                  ['isPYQ', 'true', 'Marks it as a Previous Year Question'],
                  ['pyqYear', '2020', 'The year of the paper (number, not string)'],
                  ['section', '"mat" | "arithmetic" | "language"', 'Controls sort order in mock test'],
                  ['qNumber', '1–80', 'Position within the year paper'],
                  ['status', '"active" (default)', 'Inactive questions are excluded'],
                ].map(([field, val, note]) => (
                  <div key={field} style={{ display: 'grid', gridTemplateColumns: '140px 180px 1fr', gap: '8px', alignItems: 'center', padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <code style={{ color: '#6366f1', fontWeight: 700 }}>{field}</code>
                    <code style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.82rem' }}>{val}</code>
                    <span style={{ color: '#64748b' }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Static Question Bank Explorer & Production Management Suite */}
        {activeTab === 'question-bank' && (
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  🗃️ Static Sequential Question Bank ({questions.length})
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Create, edit, duplicate, delete, crop &amp; upload image figures to Cloudflare R2.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="jnvst">JNVST Class 6</option>
                  <option value="imo">IMO Math Olympiad</option>
                  <option value="nso">NSO Science Olympiad</option>
                </select>

                <button
                  onClick={() => setShowBatchModal(true)}
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Parse JSON / Text
                </button>

                <button
                  onClick={handleOpenCreateQuestion}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  ➕ Add New Question
                </button>
              </div>
            </div>

            {/* Section Filter Pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${questions.length})` },
                { id: 'mat', label: 'Mental Ability (MAT 1-40)' },
                { id: 'arithmetic', label: 'Arithmetic Test (Math 41-60)' },
                { id: 'language', label: 'Language Test (Reading 61-80)' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSectionFilter(sec.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: sectionFilter === sec.id ? '2px solid #4338ca' : '1.5px solid #cbd5e1',
                    background: sectionFilter === sec.id ? '#e0e7ff' : '#ffffff',
                    color: sectionFilter === sec.id ? '#3730a3' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {loadingQuestions ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Loading question bank...</div>
            ) : filteredQuestions.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '1rem' }}>No static questions found for selected section filter.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredQuestions.map((q, idx) => {
                  const qId = q._id || q.id || idx;
                  const isExpanded = expandedQuestionId === qId;
                  const qImg = q.questionImage || q.imageUrl;

                  return (
                    <div
                      key={qId}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '18px 22px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        
                        <div
                          onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                          style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, cursor: 'pointer' }}
                        >
                          <span style={{
                            background: '#4338ca',
                            color: '#fff',
                            fontWeight: 900,
                            borderRadius: '50%',
                            width: '34px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}>
                            {q.qNumber || idx + 1}
                          </span>

                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>{parseMathAndText(q.questionText || 'Static Question')}</span>
                              {q.isPYQ && (
                                <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                                  PYQ {q.pyqYear || 2025}
                                </span>
                              )}
                            </div>

                            {qImg && (
                              <div style={{ marginTop: '8px' }}>
                                <img src={qImg} alt="Question figure" style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                              </div>
                            )}

                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                              Section: <strong>{q.sectionName || q.section || 'General'}</strong> • Key: <strong style={{ color: '#059669' }}>{q.correctOption || q.answer || 'A'}</strong>
                              {Array.isArray(q.tags) && q.tags.length > 0 && ` • Tags: ${q.tags.join(', ')}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleEditQuestion(q)}
                            title="Edit Question"
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={() => handleDuplicateQuestion(q)}
                            title="Duplicate Question"
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            👯 Duplicate
                          </button>

                          <button
                            onClick={() => handleDeleteQuestion(qId)}
                            title="Delete Question"
                            style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>

                          <button
                            onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Options Breakdown Drawer */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                            Options Breakdown:
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                          {['A', 'B', 'C', 'D'].map(letter => {
                              const opts = q.options || {};
                              const optImgs = q.optionsImages || {};
                              const optCrops = q.optionsImagesCrops || {};
                              const val = typeof opts === 'object' ? (opts[letter] || opts[`option${letter}`]) : null;
                              const imgVal = optImgs[letter];
                              const cropVal = optCrops[letter];
                              if (!val && !imgVal) return null;
                              const isCorrect = (q.correctOption === letter || String(q.answer) === letter);

                              return (
                                <div
                                  key={letter}
                                  style={{
                                    background: isCorrect ? '#f0fdf4' : '#ffffff',
                                    border: isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    fontSize: '0.88rem',
                                    fontWeight: isCorrect ? 800 : 500
                                  }}
                                >
                                  <strong>({letter})</strong> {val ? parseMathAndText(String(val)) : ''}
                                  {imgVal && (
                                    <div style={{ marginTop: '6px', maxWidth: '140px' }}>
                                      <FramedImage
                                        src={imgVal}
                                        cropWindow={cropVal || undefined}
                                        alt={`Option ${letter}`}
                                        style={{ width: '100%', borderRadius: '6px' }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanationText && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem', color: '#1e40af' }}>
                              <strong>💡 Solution Explanation:</strong> {parseMathAndText(q.explanationText)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* QUESTION FORM MODAL (CREATE / EDIT / DUPLICATE WITH IMAGE UPLOADER & CROPPER) */}
      {showQuestionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '1300px', maxHeight: '92vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {editingQuestionId ? '✏️ Edit Question' : '➕ Create New Question'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Left Column: Form Fields */}
              <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Row 1: Exam ID, Section, Q. Number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Exam ID</label>
                    <select
                      value={questionFormData.examId}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, examId: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                    >
                      <option value="jnvst">JNVST Class 6</option>
                      <option value="imo">IMO Olympiad</option>
                      <option value="nso">NSO Olympiad</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Section</label>
                    <select
                      value={questionFormData.section}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, section: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                    >
                      <option value="mat">Mental Ability (MAT)</option>
                      <option value="evs">Environmental Studies (EVS)</option>
                      <option value="arithmetic">Arithmetic (Math)</option>
                      <option value="language">Language (Reading)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Q. Number</label>
                    <input
                      type="number"
                      value={questionFormData.qNumber}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, qNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Question Text */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Question Text (KaTeX &amp; SVG Enabled)</label>
                  <textarea
                    rows={2}
                    value={questionFormData.questionText}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, questionText: e.target.value })}
                    placeholder="Enter question text or KaTeX formula e.g. What is $\frac{13}{4}$? or <svg>..."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.95rem' }}
                    required
                  />
                </div>

                {/* Question Image / R2 Storage Path Upload & Crop */}
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    🖼️ Question Figure Image (Crop &amp; Upload to R2 Storage)
                  </label>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="R2 Storage Path URL e.g. https://.../jnvst-questions/q1.png"
                      value={questionFormData.questionImage}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, questionImage: e.target.value })}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                    />

                    {/* Crop & Upload Button */}
                    <label style={{ background: '#10b981', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ✂️ Crop &amp; Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleSelectFileForCropper(e.target.files[0], 'questionImage')}
                      />
                    </label>

                    {/* Direct Upload Button */}
                    <label style={{ background: '#4338ca', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                      {uploadingTarget === 'questionImage' ? 'Uploading...' : '📁 Direct Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e.target.files[0], 'questionImage')}
                      />
                    </label>

                    {/* Frame / Mask Image Button */}
                    {questionFormData.questionImage && (
                      <button
                        type="button"
                        onClick={() => handleOpenFramingModal(
                          questionFormData.questionImage,
                          questionFormData.questionImageCrop,
                          (newCrop) => setQuestionFormData(prev => ({ ...prev, questionImageCrop: newCrop }))
                        )}
                        style={{ background: '#0284c7', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        📐 Frame / Mask Image
                      </button>
                    )}
                  </div>

                  {questionFormData.questionImage && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={questionFormData.questionImage} alt="Question figure preview" style={{ maxHeight: '80px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      {questionFormData.questionImageCrop && (
                        <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                          Framed ({questionFormData.questionImageCrop.width.toFixed(1)}% × {questionFormData.questionImageCrop.height.toFixed(1)}%)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setQuestionFormData({ ...questionFormData, questionImage: '', questionImageCrop: null })}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Options A, B, C, D with text, crop & image inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {['A', 'B', 'C', 'D'].map(letter => {
                    const textKey = `option${letter}`;
                    const imgKey = `option${letter}Image`;
                    const cropKey = `option${letter}ImageCrop`;
                    const hasImage = Boolean(questionFormData[imgKey]);

                    return (
                      <div key={letter} style={{ background: hasImage ? '#f0f9ff' : '#f8fafc', padding: '12px', borderRadius: '12px', border: `1px solid ${hasImage ? '#bae6fd' : '#e2e8f0'}` }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          Option {letter}
                          {hasImage && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>Image only — text optional</span>}
                        </label>

                        <input
                          type="text"
                          placeholder={hasImage ? `(optional — image will be used)` : `Option ${letter} Text or <svg>...`}
                          value={questionFormData[textKey]}
                          onChange={(e) => setQuestionFormData({ ...questionFormData, [textKey]: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '6px', fontSize: '0.88rem', opacity: hasImage ? 0.6 : 1 }}
                          required={!hasImage}
                        />

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Image R2 URL (optional)"
                            value={questionFormData[imgKey]}
                            onChange={(e) => setQuestionFormData({ ...questionFormData, [imgKey]: e.target.value })}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                          />

                          {/* Crop Button for Option Image */}
                          <label style={{ background: '#10b981', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            ✂️ Crop
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleSelectFileForCropper(e.target.files[0], imgKey)}
                            />
                          </label>

                          {/* Direct Upload Button */}
                          <label style={{ background: '#64748b', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            📁 File
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileUpload(e.target.files[0], imgKey)}
                            />
                          </label>

                          {/* Frame / Mask Button for Option Image */}
                          {questionFormData[imgKey] && (
                            <button
                              type="button"
                              onClick={() => handleOpenFramingModal(
                                questionFormData[imgKey],
                                questionFormData[cropKey],
                                (newCrop) => setQuestionFormData(prev => ({ ...prev, [cropKey]: newCrop }))
                              )}
                              style={{ background: '#0284c7', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              title="Frame / Mask option image"
                            >
                              📐 Frame
                            </button>
                          )}
                        </div>

                        {questionFormData[imgKey] && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={questionFormData[imgKey]} alt={`Option ${letter}`} style={{ maxHeight: '50px', borderRadius: '4px' }} />
                            {questionFormData[cropKey] && (
                              <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700, background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                                Framed ({questionFormData[cropKey].width.toFixed(1)}% × {questionFormData[cropKey].height.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* PYQ Metadata & Tags Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px', background: '#f1f5f9', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="isPYQ"
                      checked={questionFormData.isPYQ}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, isPYQ: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="isPYQ" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                      🏆 Official PYQ
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '2px' }}>PYQ Year</label>
                    <input
                      type="number"
                      value={questionFormData.pyqYear}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, pyqYear: e.target.value })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '2px' }}>Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={questionFormData.tags}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, tags: e.target.value })}
                      placeholder="jnvst, mat, odd-one-out"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                {/* Correct Key & Explanation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Correct Answer Key</label>
                    <select
                      value={questionFormData.correctOption}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, correctOption: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontWeight: 800, color: '#059669' }}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '4px' }}>Solution Explanation</label>
                    <input
                      type="text"
                      value={questionFormData.explanationText}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, explanationText: e.target.value })}
                      placeholder="Step-by-step answer explanation..."
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(false)}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingQuestion || uploadingTarget !== null}
                    style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {savingQuestion ? 'Saving...' : 'Save Question'}
                  </button>
                </div>
              </form>

              {/* Right Column: Live Student Preview Card */}
              <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '24px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', maxHeight: '78vh', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <span>👁️ Live Student Preview</span>
                  <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px' }}>
                    Q{questionFormData.qNumber || 1} ({questionFormData.section || 'mat'})
                  </span>
                </h4>

                {/* Question Box */}
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  
                  {/* Question Text */}
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', lineHeight: 1.5 }}>
                    {questionFormData.questionText ? parseMathAndText(questionFormData.questionText) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Question prompt goes here...</span>}
                  </div>

                  {/* Figure Image */}
                  {questionFormData.questionImage && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '280px',
                        height: '180px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {questionFormData.questionImageCrop ? (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${questionFormData.questionImage})`,
                            backgroundPosition: `${questionFormData.questionImageCrop.x}% ${questionFormData.questionImageCrop.y}%`,
                            backgroundSize: `${10000 / questionFormData.questionImageCrop.width}% ${10000 / questionFormData.questionImageCrop.height}%`,
                            backgroundRepeat: 'no-repeat'
                          }} />
                        ) : (
                          <img src={questionFormData.questionImage} alt="Figure image" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Options A, B, C, D */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {['A', 'B', 'C', 'D'].map(letter => {
                      const textVal = questionFormData[`option${letter}`];
                      const imgVal = questionFormData[`option${letter}Image`];
                      const cropVal = questionFormData[`option${letter}ImageCrop`];
                      const isCorrect = questionFormData.correctOption === letter;

                      return (
                        <div
                          key={letter}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: isCorrect ? '2px solid #22c55e' : '1px solid #cbd5e1',
                            background: isCorrect ? '#f0fdf4' : '#ffffff',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isCorrect ? '2px solid #22c55e' : '2px solid #94a3b8',
                            background: isCorrect ? '#22c55e' : 'transparent',
                            color: isCorrect ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            flexShrink: 0
                          }}>
                            {letter}
                          </div>

                          <div style={{ flex: 1, color: '#334155', fontWeight: 600, fontSize: '0.9rem' }}>
                            {imgVal ? (
                              <div style={{
                                width: '100%',
                                maxWidth: '160px',
                                height: '80px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                {cropVal ? (
                                  <div style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${imgVal})`,
                                    backgroundPosition: `${cropVal.x}% ${cropVal.y}%`,
                                    backgroundSize: `${10000 / cropVal.width}% ${10000 / cropVal.height}%`,
                                    backgroundRepeat: 'no-repeat'
                                  }} />
                                ) : (
                                  <img src={imgVal} alt={`Option ${letter}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                )}
                              </div>
                            ) : textVal ? (
                              parseMathAndText(textVal)
                            ) : (
                              <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Empty Option</span>
                            )}
                          </div>

                          {isCorrect && (
                            <span style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Solution Explanation Box */}
                  <div style={{ marginTop: '20px', background: '#f8fafc', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '4px' }}>
                      💡 Official Solution Explanation
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                      {questionFormData.explanationText ? parseMathAndText(questionFormData.explanationText) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No explanation entered.</span>}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE IMAGE CROPPER MODAL */}
      {cropperState.isOpen && (
        <ImageCropperModal
          imageSrc={cropperState.imageSrc}
          onClose={() => setCropperState({ isOpen: false, imageSrc: null, targetField: null })}
          onCropComplete={(r2Url) => {
            setQuestionFormData(prev => ({
              ...prev,
              [cropperState.targetField]: r2Url
            }));
            setCropperState({ isOpen: false, imageSrc: null, targetField: null });
          }}
        />
      )}

      {/* INTERACTIVE IMAGE FRAMING / MASKING MODAL */}
      {framingModalOpen && framingTarget && (
        <ImageFramingModal
          isOpen={framingModalOpen}
          imageUrl={framingTarget.imageUrl}
          initialCropWindow={framingTarget.cropWindow}
          onClose={() => { setFramingModalOpen(false); setFramingTarget(null); }}
          onSave={(newCrop) => {
            if (framingTarget.onSave) framingTarget.onSave(newCrop);
            setFramingModalOpen(false);
            setFramingTarget(null);
          }}
        />
      )}

      {/* BATCH PARSE JSON & RAW TEXT IMPORT MODAL */}
      {showBatchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '820px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxH: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                📋 Batch Import JSON or Raw Text
              </h3>
              <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748b' }}>
              Select target metadata below. If JSON items specify their own <code>examId</code>, <code>section</code>, or <code>pyqYear</code>, those will override these defaults.
            </p>

            {/* Default Metadata Controls Bar */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Target Exam</label>
                <select
                  value={batchMeta.examId}
                  onChange={e => setBatchMeta({ ...batchMeta, examId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  <option value="jnvst">JNVST Class 6</option>
                  <option value="imo">IMO Olympiad</option>
                  <option value="nso">NSO Science</option>
                  <option value="cbse_class5">CBSE Class 5</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Section</label>
                <select
                  value={batchMeta.section}
                  onChange={e => setBatchMeta({ ...batchMeta, section: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  <option value="mat">Mental Ability (mat)</option>
                  <option value="arithmetic">Arithmetic (math)</option>
                  <option value="language">Language (passages)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>📅 PYQ Year</label>
                <input
                  type="number"
                  value={batchMeta.pyqYear}
                  onChange={e => setBatchMeta({ ...batchMeta, pyqYear: Number(e.target.value) || 2024 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Start Q. No.</label>
                <input
                  type="number"
                  value={batchMeta.startQNum}
                  onChange={e => setBatchMeta({ ...batchMeta, startQNum: Number(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ paddingBottom: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 800, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={batchMeta.isPYQ}
                    onChange={e => setBatchMeta({ ...batchMeta, isPYQ: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                  />
                  🏆 Official PYQ
                </label>
              </div>
            </div>

            <textarea
              rows={11}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder={`Option 1: Paste JSON Array Format:
[
  {
    "qNumber": 1,
    "questionText": "What is 15 - 6?",
    "optionA": "6", "optionB": "9", "optionC": "12", "optionD": "15",
    "correctOption": "B",
    "isPYQ": true,
    "pyqYear": 2020,
    "section": "arithmetic"
  }
]

Option 2: Paste Raw Text Blocks (separated by blank lines):
What is 15 - 6?
A) 6
B) 9
C) 12
D) 15
Ans: B`}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.5 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleBatchImport}
                disabled={batchParsing}
                style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                {batchParsing ? 'Parsing & Importing...' : '🚀 Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
