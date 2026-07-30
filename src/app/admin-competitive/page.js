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
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<div')) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: text }}
        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '4px' }}
      />
    );
  }
  const parts = text.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);
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
    return <span key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

// INTERACTIVE CANVAS IMAGE CROPPER MODAL COMPONENT
function ImageCropperModal({ imageSrc, onCropComplete, onClose }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);

  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDragging(true);
    setDragStart({ x: xPct, y: yPct });
    setCrop({ x: xPct, y: yPct, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentXPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentYPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const x = Math.min(dragStart.x, currentXPct);
    const y = Math.min(dragStart.y, currentYPct);
    const width = Math.abs(currentXPct - dragStart.x);
    const height = Math.abs(currentYPct - dragStart.y);

    setCrop({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropAndSave = async () => {
    if (!imgRef.current || crop.width === 0 || crop.height === 0) {
      alert('Please drag a box over the image portion you want to crop.');
      return;
    }

    setUploading(true);
    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const sourceX = (crop.x / 100) * img.naturalWidth;
      const sourceY = (crop.y / 100) * img.naturalHeight;
      const sourceW = (crop.width / 100) * img.naturalWidth;
      const sourceH = (crop.height / 100) * img.naturalHeight;

      canvas.width = sourceW;
      canvas.height = sourceH;

      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Canvas blob generation failed.');

        const croppedFile = new File([blob], `cropped-${Date.now()}.webp`, { type: 'image/webp' });
        const formData = new FormData();
        formData.append('file', croppedFile);
        formData.append('folder', 'jnvst-questions');

        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success || data.url) {
          const uploadedUrl = data.url || (data.file && data.file.url) || (data.files && data.files[0] && data.files[0].url);
          onCropComplete(uploadedUrl);
        } else {
          alert(data.error || 'Failed to upload cropped image to R2.');
        }
        setUploading(false);
      }, 'image/webp', 0.92);

    } catch (err) {
      console.error('Crop save error:', err);
      alert('Failed to process image crop.');
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '850px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              ✂️ Crop Selected Image Portion
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Click &amp; drag mouse over the image to select the exact figure portion to save into R2 storage.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Interactive Crop Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '500px',
            overflow: 'hidden',
            background: '#0f172a',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'crosshair',
            userSelect: 'none'
          }}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop target"
            style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', pointerEvents: 'none' }}
          />

          {/* Semi-transparent Selection Box */}
          {crop.width > 0 && crop.height > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
                border: '2px dashed #10b981',
                background: 'rgba(16, 185, 129, 0.25)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none'
              }}
            >
              <div style={{ position: 'absolute', top: '4px', left: '6px', background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                Crop Region
              </div>
            </div>
          )}
        </div>

        {/* Crop Controls & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
            {crop.width > 0 ? `Selected Box: ${Math.round(crop.width)}% × ${Math.round(crop.height)}%` : 'Drag mouse over image to select crop area'}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>

            <button
              onClick={handleCropAndSave}
              disabled={uploading}
              style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
            >
              {uploading ? 'Cropping & Uploading to R2...' : '✂️ Crop & Save to R2'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompetitivePage() {
  const [activeTab, setActiveTab] = useState('spreadsheets'); // 'spreadsheets', 'test-series', 'question-bank'
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
        const blocks = trimmed.split(/\n\s*\n/);
        blocks.forEach((block, idx) => {
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const qObj = {
              examId: selectedExamId,
              section: 'arithmetic',
              qNumber: idx + 1,
              questionText: lines[0],
              options: {
                A: lines[1] || 'Option A',
                B: lines[2] || 'Option B',
                C: lines[3] || 'Option C',
                D: lines[4] || 'Option D'
              },
              correctOption: 'A',
              explanationText: '',
              isPYQ: true,
              pyqYear: 2025
            };
            questionsToImport.push(qObj);
          }
        });
      }

      if (questionsToImport.length === 0) return alert('No valid questions found to import.');

      for (const q of questionsToImport) {
        const payload = {
          examId: q.examId || selectedExamId,
          section: q.section || 'arithmetic',
          qNumber: Number(q.qNumber || q.qNum || 1),
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
          isPYQ: Boolean(q.isPYQ !== false),
          pyqYear: q.pyqYear ? Number(q.pyqYear) : 2025,
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
      loadQuestionBank();
    } catch (err) {
      console.error('Batch import failed:', err);
      alert('Failed to parse JSON or text: ' + err.message);
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
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '92vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {editingQuestionId ? '✏️ Edit Question' : '➕ Create New Question'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

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
          <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '750px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                📋 Batch Import JSON or Raw Text
              </h3>
              <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748b' }}>
              Paste a JSON array of questions or block formatted question text. The parser will automatically process and insert them into MongoDB.
            </p>

            <textarea
              rows={12}
              value={batchRawText}
              onChange={(e) => setBatchRawText(e.target.value)}
              placeholder={`Example JSON Format:\n[\n  {\n    "qNumber": 1,\n    "questionText": "What is 15 - 6?",\n    "questionImage": "https://.../figure.png",\n    "optionA": "6", "optionB": "9", "optionC": "12", "optionD": "15",\n    "correctOption": "B",\n    "isPYQ": true,\n    "pyqYear": 2025,\n    "tags": ["jnvst", "pyq"]\n  }\n]`}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem' }}
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
