'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styles from './admin.module.css';
import QuestionRenderer from '@/components/practice/QuestionRenderer';
import { isAnswerCorrect } from '@/lib/practice/answerValidation';
import { speakText, stopAllSpeech } from '@/lib/ttsClient';

const isInlineSvg = (url) => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml') || trimmed.includes('<svg');
};

const cleanSvgContent = (svgStr) => {
  if (!svgStr) return '';
  let cleaned = svgStr
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
  cleaned = cleaned.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned;
};

const NODE_TYPES = ['subject', 'topic', 'chapter', 'skill'];

const EMPTY_FORM = {
  id: '',
  type: 'topic',
  title: '',
  subjectId: '',
  topicId: '',
  chapterId: '',
  parentId: '',
  skillId: '',
  code: '',
  grade: '',
  templateId: '',
  engine: '',
  questionType: '',
  order: '',
  description: '',
  prerequisites: '',
  remediation: '',
  tags: '',
  status: 'active',
  metadata: '{}',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractBlankIds(parts, questionText) {
  const ids = new Set();
  const regex = /\[\[([^\]]+)\]\]|\[blank:([^\]]+)\]/g;
  const checkText = (text) => {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(text || '')) !== null) {
      ids.add(match[1] || match[2]);
    }
  };
  if (Array.isArray(parts)) {
    parts.forEach(p => {
      if (p.type === 'text') {
        checkText(p.content);
      }
    });
  }
  checkText(questionText);
  return Array.from(ids);
}


function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}


function computeAutoIds(form, manuallyEdited = {}) {
  const slug = slugify(form.title);
  const type = form.type;
  const grade = form.grade ? slugify(form.grade) : '';
  const subjectId = form.subjectId ? slugify(form.subjectId) : '';
  const topicId = form.topicId ? slugify(form.topicId) : '';
  const chapterId = form.chapterId ? slugify(form.chapterId) : '';

  const updates = {};

  if (type === 'subject') {
    if (!manuallyEdited.id) updates.id = slug;
    if (!manuallyEdited.subjectId) updates.subjectId = slug;
  } else if (type === 'topic') {
    if (!manuallyEdited.id) updates.id = slug;
    if (!manuallyEdited.topicId) updates.topicId = slug;
    if (subjectId && !manuallyEdited.parentId) updates.parentId = subjectId;
  } else if (type === 'chapter') {
    let computedChapterId = slug;
    if (topicId && slug) {
      if (grade && (slug.includes('grade') || slug.includes('skills'))) {
        computedChapterId = `${topicId}-grade-${grade}`;
      } else {
        computedChapterId = `${topicId}-${slug}`;
      }
    }
    if (!manuallyEdited.id) updates.id = computedChapterId;
    if (!manuallyEdited.chapterId) updates.chapterId = computedChapterId;
    if (topicId && !manuallyEdited.parentId) updates.parentId = topicId;
  } else if (type === 'skill') {
    let computedSkillId = slug;
    if (topicId && slug) {
      if (grade) {
        computedSkillId = `${topicId}-g${grade}-${slug}`;
      } else {
        computedSkillId = `${topicId}-${slug}`;
      }
    }
    if (!manuallyEdited.id) updates.id = computedSkillId;
    if (!manuallyEdited.skillId) updates.skillId = computedSkillId;
    if (!manuallyEdited.parentId) {
      updates.parentId = chapterId || topicId || '';
    }
  }

  return updates;
}

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toListText(value) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function safeJson(value) {
  if (!value.trim()) return {};
  return JSON.parse(value);
}

function flattenTree(nodes = [], depth = 0) {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children || [], depth + 1),
  ]);
}

function formFromNode(node) {
  return {
    id: node.id || '',
    type: node.type || 'topic',
    title: node.title || '',
    subjectId: node.subjectId || '',
    topicId: node.topicId || '',
    chapterId: node.chapterId || '',
    parentId: node.parentId || '',
    skillId: node.skillId || '',
    code: node.code || '',
    grade: node.grade == null ? '' : String(node.grade),
    templateId: node.templateId || '',
    engine: node.engine || '',
    questionType: node.questionType || node.practiceType || '',
    order: node.order == null ? '' : String(node.order),
    description: node.description || '',
    prerequisites: toListText(node.prerequisites),
    remediation: toListText(node.remediation),
    tags: toListText(node.tags),
    status: node.status || 'active',
    metadata: JSON.stringify(node.metadata || {}, null, 2),
  };
}

function formFromImport(raw) {
  const source = raw?.question || raw;
  const metadata = source?.metadata || {};
  const resolved = source?.resolvedConfig || raw?.template?.resolved || raw?.template || {};
  const node = {
    ...raw,
    ...source,
    ...metadata,
    ...resolved,
  };
  const inferredType =
    node.type && NODE_TYPES.includes(node.type)
      ? node.type
      : node.skillId || node.microSkillId || node.templateId || node.engine
        ? 'skill'
        : node.chapterId
          ? 'chapter'
          : node.topicId || node.topic
            ? 'topic'
            : 'subject';

  return formFromNode({
    id:
      node.id ||
      node.skillId ||
      node.microSkillId ||
      node.logic_type ||
      node.logicType ||
      node.topicId ||
      node.topic ||
      node.subjectId ||
      node.subject,
    type: inferredType,
    title: node.title || source?.questionText || source?.question_text || node.name || '',
    subjectId: node.subjectId || node.subject || '',
    topicId: node.topicId || node.topic || '',
    chapterId: node.chapterId || '',
    parentId: node.parentId || node.chapterId || node.topicId || node.topic || node.subjectId || node.subject || '',
    skillId: node.skillId || node.microSkillId || node.logic_type || node.logicType || '',
    code: node.code || '',
    grade: node.grade,
    templateId: node.templateId || '',
    engine: node.engine || '',
    questionType: source?.type || node.questionType || node.practiceType || '',
    order: node.order,
    description: node.description || node.summary || '',
    prerequisites: node.prerequisites || node.competency?.prerequisites || [],
    remediation: node.remediation || node.competency?.remediation || [],
    tags: node.tags || [],
    status: node.status || 'active',
    metadata: {
      competencyId: node.competencyId || node.competency?.id,
      competency: node.competency,
      sourceQuestionId: raw?.question?.id ? raw.question.id : undefined,
      importedAt: new Date().toISOString(),
    },
  });
}

function childDefaults(parent, type) {
  const subjectId = parent.type === 'subject' ? parent.id : parent.subjectId;
  const topicId = parent.type === 'topic' ? parent.id : parent.topicId;
  const chapterId = parent.type === 'chapter' ? parent.id : parent.chapterId;
  const grade = parent.grade != null ? String(parent.grade) : '';

  return {
    ...EMPTY_FORM,
    type,
    parentId: parent.id || '',
    subjectId: subjectId || '',
    topicId: topicId || '',
    chapterId: type === 'skill' ? chapterId || '' : '',
    grade: grade || '',
    status: 'active',
  };
}

function TreeNode({ node, selectedId, onSelect, onChild }) {
  const isSelected = node.id === selectedId;
  const childTypes =
    node.type === 'subject'
      ? ['topic']
      : node.type === 'topic'
        ? ['chapter', 'skill']
        : node.type === 'chapter'
          ? ['skill']
          : [];

  return (
    <li className={styles.currTreeItem}>
      <div className={`${styles.currNodeRow} ${isSelected ? styles.currNodeRowActive : ''}`}>
        <button type="button" className={styles.currNodeMain} onClick={() => onSelect(node)}>
          <span className={styles.currNodeType}>{node.type}</span>
          <span className={styles.currNodeTitle}>{node.title || node.id}</span>
          <span className={styles.currNodeId}>{node.id}</span>
        </button>
        {childTypes.length > 0 ? (
          <div className={styles.currNodeActions}>
            {childTypes.map((type) => (
              <button key={type} type="button" onClick={() => onChild(node, type)}>
                + {type}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {node.children?.length ? (
        <ul className={styles.currTreeList}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onChild={onChild}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function getNormalizedVoiceValue(v) {
  if (!v) return 'gemini:Puck';
  if (v.startsWith('gemini:') || v.startsWith('piper:')) return v;
  if (v.startsWith('en_US-')) return `piper:${v}`;
  return `gemini:${v}`;
}

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Notification alert state
  const [alert, setAlert] = useState(null); // { type: 'success'|'error'|'info', text: '' }

  // 1. Dashboard & Stats State
  const [stats, setStats] = useState({
    totalQuestions: 0,
    questionsWithAudio: 0,
    missingAudio: 0,
    mcqQuestions: 0,
    fibQuestions: 0,
    ttsCacheItems: 0,
    r2Configured: false,
    dbConnected: false,
    subjects: [],
    topics: [],
    totalAttempts: 0,
    correctAttempts: 0,
    recentAttempts: [],
    topicBreakdown: [],
    frictionPoints: [],
    students: []
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('all');
  
  // Bulk audio state
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProcessed, setBulkProcessed] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkRemaining, setBulkRemaining] = useState(0);

  // 2. Questions Library State
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [qSearch, setQSearch] = useState('');
  const [qSubject, setQSubject] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qType, setQType] = useState('all');
  const [qAudioStatus, setQAudioStatus] = useState('all'); // 'all' | 'withAudio' | 'missingAudio'
  const [qPage, setQPage] = useState(1);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [qTotalCount, setQTotalCount] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  // 3. Authoring Center State
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [subject, setSubject] = useState('english');
  const [topic, setTopic] = useState('grammar');
  const [skillId, setSkillId] = useState('nouns');
  const [difficulty, setDifficulty] = useState('beginner');
  const [type, setType] = useState('mcq');
  const [questionText, setQuestionText] = useState('Is the word **frog** a person, place, animal, or thing?');
  const [voice, setVoice] = useState('Puck');
  const [explanation, setExplanation] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [generateAudioCheckbox, setGenerateAudioCheckbox] = useState('all');
  const [readable, setReadable] = useState(true);
  const [readOptions, setReadOptions] = useState(true);
  
  // MCQ state
  const [options, setOptions] = useState([
    { label: 'person', isCorrect: false },
    { label: 'place', isCorrect: false },
    { label: 'animal', isCorrect: true },
    { label: 'thing', isCorrect: false },
  ]);
  
  // FIB state
  const [correctAnswer, setCorrectAnswer] = useState('animal');
  const [fibAnswers, setFibAnswers] = useState({ ans: 'animal' });

  // Parts state
  const [parts, setParts] = useState([
    { type: 'text', content: 'Is the word **frog** a person, place, animal, or thing?' }
  ]);

  // Categorization state
  const [categories, setCategories] = useState([
    { id: 'cat_1', label: 'Category 1' },
    { id: 'cat_2', label: 'Category 2' }
  ]);
  const [categorizationItems, setCategorizationItems] = useState([
    { id: 'item_1', content: 'Item 1', categoryId: 'cat_1', imageUrl: '', imageWidth: '', svg: '', visualType: 'none' },
    { id: 'item_2', content: 'Item 2', categoryId: 'cat_2', imageUrl: '', imageWidth: '', svg: '', visualType: 'none' }
  ]);

  // Universal DnD specific states
  const [layoutMode, setLayoutMode] = useState('');
  const [interaction, setInteraction] = useState('');
  const [targets, setTargets] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canvas, setCanvas] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [sourceTray, setSourceTray] = useState(null);
  const [cardStyle, setCardStyle] = useState('');
  const [hideItemLabels, setHideItemLabels] = useState(false);

  // New Diagram Labeling states
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [dragging, setDragging] = useState(null);

  // Hotspot MCQ states
  const [hotspots, setHotspots] = useState([]);
  const [isHotspotMultiSelect, setIsHotspotMultiSelect] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [backgroundSvg, setBackgroundSvg] = useState('');
  const [showHotspotLabels, setShowHotspotLabels] = useState(false);
  // Preview Answer checking state
  const [previewAnswer, setPreviewAnswer] = useState(null);
  const [previewCheckResult, setPreviewCheckResult] = useState(null); // 'correct', 'incorrect', or null
  
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [generatingSingleAudio, setGeneratingSingleAudio] = useState(false);

  // --- Redesign States & Workspace Elements ---
  const [authoringMode, setAuthoringMode] = useState('manual'); // 'manual' | 'paste' | 'import'
  const [collapsedSections, setCollapsedSections] = useState({
    details: false,
    content: false,
    answers: false,
    audio: false,
    metadata: false
  });
  
  // Custom metadata fields
  const [teacherNotes, setTeacherNotes] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedGrade, setEstimatedGrade] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [sourceMapping, setSourceMapping] = useState('');

  // Paste & Parse State
  const [rawTextToParse, setRawTextToParse] = useState('');

  // Import JSON State
  const [jsonTextToImport, setJsonTextToImport] = useState('');
  const [jsonValidationError, setJsonValidationError] = useState(null);

  // Live Student Preview State
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewSimulateState, setPreviewSimulateState] = useState(null); // 'correct' | 'wrong' | null
  
  // Autosave and Draft states
  const [autosaveStatus, setAutosaveStatus] = useState('');
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [recoveryTimestamp, setRecoveryTimestamp] = useState(null);
  
  // Track changes (Dirty state)
  const [isDirty, setIsDirty] = useState(false);
  const ignoreDirtyChange = useRef(false);
  const canvasRef = useRef(null);

  // ── Image Upload State ──────────────────────────────────────────────────────
  const [imgFiles, setImgFiles] = useState([]);
  const [imgMaxWidth, setImgMaxWidth] = useState(1200);
  const [imgQuality, setImgQuality] = useState(85);
  const [imgFormat, setImgFormat] = useState('image/webp');
  const [imgFolder, setImgFolder] = useState('images');
  const [imgFolderPreset, setImgFolderPreset] = useState('images');
  const [imgFolderCustom, setImgFolderCustom] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [imgDragOver, setImgDragOver] = useState(false);
  const imgFileInputRef = useRef(null);

  const [activeUploadPreview, setActiveUploadPreview] = useState(null);

  // ── Image Cropper State ──────────────────────────────────────────────────────
  const [cropTarget, setCropTarget] = useState(null); // { id, file, previewUrl }
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 });
  const [dragStart, setDragStart] = useState(null);
  const containerRef = useRef(null);

  // ── URL Import State ────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState('');
  const [urlPreviews, setUrlPreviews] = useState([]);   // [{id,src,selected,status,r2Url,error,sizeBytes}]
  const [urlImporting, setUrlImporting] = useState(false);
  const [imgSubTab, setImgSubTab] = useState('upload'); // 'upload' | 'urls' | 'gallery' | 'autolink'
  const [urlBaseName, setUrlBaseName] = useState('');

  // ── Auto-Link Vocabulary State ──────────────────────────────────────────────
  const [autoLinking, setAutoLinking] = useState(false);
  const [autoLinkResult, setAutoLinkResult] = useState(null);
  const [autoLinkError, setAutoLinkError] = useState('');
  const [overwriteExistingLinks, setOverwriteExistingLinks] = useState(false);

  // ── Web Clipart Search Modal State ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchWordTarget, setSearchWordTarget] = useState('');
  const [importingSearchUrl, setImportingSearchUrl] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);


  const handleWebImageSearch = async (queryStr) => {
    const q = queryStr || searchQuery;
    if (!q || !q.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch search results');
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const importSearchImage = async (imageUrl) => {
    if (!searchWordTarget) return;
    setImportingSearchUrl(imageUrl);
    try {
      // 1. Fetch and upload image to R2, generating dimensions and tags via Gemini
      const res = await fetch('/api/admin/fetch-url-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          folder: 'images/lkg/things',
          customName: searchWordTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import image');
      
      logActivity(`Successfully imported clipart for "${searchWordTarget}" to R2`, 'success');
      
      // 2. Trigger auto-linker with overwrite enabled to map the newly created image asset
      const linkRes = await fetch('/api/admin/auto-link-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteExisting: true }),
      });
      const linkData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkData.error || 'Failed to auto-link newly imported asset');
      
      // Update the local results state dynamically if it was open
      setAutoLinkResult(linkData);
      setSelectedWords(prev => prev.filter(w => w !== searchWordTarget));
      setSearchModalOpen(false);
      logActivity(`Auto-linked "${searchWordTarget}" to the new image URL`, 'success');
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImportingSearchUrl('');
    }
  };

  const handleSelectAllWords = () => {
    if (autoLinkResult && autoLinkResult.missingWords) {
      setSelectedWords([...autoLinkResult.missingWords]);
    }
  };

  const handleDeselectAllWords = () => {
    setSelectedWords([]);
  };

  const toggleWordSelection = (word) => {
    setSelectedWords(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const handleBulkImportMissing = async () => {
    if (!autoLinkResult || !autoLinkResult.missingWords || autoLinkResult.missingWords.length === 0) return;
    if (selectedWords.length === 0) {
      alert("Please select one or more words to import by checking their checkboxes.");
      return;
    }
    const words = [...selectedWords];
    const confirm = window.confirm(`This will automatically search and import the first clipart match for the ${words.length} selected words. Do you want to proceed?`);
    if (!confirm) return;

    setBulkImporting(true);
    setBulkImportProgress(`Starting...`);

    let importedCount = 0;
    let failedCount = 0;

    // Process in batches of 3 for speed and to avoid hitting DDG rate limits
    const CONCURRENCY = 3;
    
    // Helper function to process a single word
    const processWord = async (word) => {
      try {
        setBulkImportProgress(`Searching "${word}"...`);
        // 1. Search for clipart
        const searchRes = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(word)}`);
        const searchData = await searchRes.json();
        if (!searchRes.ok || !searchData.results || searchData.results.length === 0) {
          throw new Error('No clipart results found');
        }
        
        const firstMatchUrl = searchData.results[0].image;
        setBulkImportProgress(`Importing "${word}"...`);
        
        // 2. Fetch and upload to R2
        const importRes = await fetch('/api/admin/fetch-url-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: firstMatchUrl,
            folder: 'images/lkg/things',
            customName: word,
          }),
        });
        const importData = await importRes.json();
        if (!importRes.ok) throw new Error(importData.error || 'Failed to upload');
        
        importedCount++;
        logActivity(`Bulk Auto-Import: successfully imported "${word}"`, 'success');
      } catch (err) {
        failedCount++;
        logActivity(`Bulk Auto-Import failed for "${word}": ${err.message}`, 'warning');
      }
    };

    // Run parallel queue
    for (let i = 0; i < words.length; i += CONCURRENCY) {
      const batch = words.slice(i, i + CONCURRENCY);
      const batchNum = Math.floor(i / CONCURRENCY) + 1;
      const totalBatches = Math.ceil(words.length / CONCURRENCY);
      setBulkImportProgress(`Batch ${batchNum}/${totalBatches}...`);
      await Promise.all(batch.map(word => processWord(word)));
    }

    setBulkImportProgress('Linking...');
    // 3. Final linking step (call auto-link once to update configuration file)
    try {
      const linkRes = await fetch('/api/admin/auto-link-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteExisting: true }),
      });
      const linkResData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkResData.error || 'Failed to auto-link');
      setAutoLinkResult(linkResData);
      setSelectedWords([]); // Reset selected words upon successful import
      alert(`Bulk Auto-Import complete!\nSuccessfully imported: ${importedCount}\nFailed/skipped: ${failedCount}`);
    } catch (err) {
      alert(`Bulk Auto-Import completed but final auto-link failed: ${err.message}`);
    } finally {
      setBulkImporting(false);
      setBulkImportProgress('');
    }
  };

  const handleAutoLinkVocabulary = async () => {
    setAutoLinking(true);
    setAutoLinkError('');
    setAutoLinkResult(null);
    try {
      const res = await fetch('/api/admin/auto-link-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteExisting: overwriteExistingLinks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to auto-link');
      setAutoLinkResult(data);
      if (data && data.missingWords) {
        setSelectedWords([...data.missingWords]);
      }
      logActivity(`Executed auto-linker: linked ${data.linkedCount} terms`, 'success');
    } catch (err) {
      setAutoLinkError(err.message);
      logActivity(`Auto-linker error: ${err.message}`, 'error');
    } finally {
      setAutoLinking(false);
    }
  };


  // ── R2 Gallery State ────────────────────────────────────────────────────────
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [galleryPrefix, setGalleryPrefix] = useState('images'); // default to images folder
  const [selectedGalleryKeys, setSelectedGalleryKeys] = useState([]);
  const [galleryDeleting, setGalleryDeleting] = useState(false);

  // Edit Metadata Modal State
  const [editingMetadataImg, setEditingMetadataImg] = useState(null);
  const [editForm, setEditForm] = useState({ singular: '', plural: '', article: '', category: '', tags: '' });

  const startEditMetadata = (img) => {
    setEditingMetadataImg(img);
    setEditForm({
      singular: img.linguistics?.singular || '',
      plural: img.linguistics?.plural || '',
      article: img.linguistics?.article || 'a',
      category: img.classification?.category || '',
      tags: Array.isArray(img.classification?.tags) ? img.classification.tags.join(', ') : '',
    });
  };

  const fetchGalleryImages = useCallback(async () => {
    setGalleryLoading(true);
    setGalleryError('');
    setSelectedGalleryKeys([]);
    try {
      const res = await fetch(`/api/admin/list-images?prefix=${encodeURIComponent(galleryPrefix)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list images');
      setGalleryImages(data.images || []);
    } catch (err) {
      setGalleryError(err.message);
    } finally {
      setGalleryLoading(false);
    }
  }, [galleryPrefix]);

  useEffect(() => {
    if (activeTab === 'images' && imgSubTab === 'gallery') {
      fetchGalleryImages();
    }
  }, [activeTab, imgSubTab, fetchGalleryImages]);

  // Curriculum Builder State (prefixed with curr to avoid collisions)
  const [currTree, setCurrTree] = useState([]);
  const [currSelected, setCurrSelected] = useState(null);
  const [currForm, setCurrForm] = useState(EMPTY_FORM);
  const [currManuallyEdited, setCurrManuallyEdited] = useState({});
  const [currStatus, setCurrStatus] = useState('');
  const [currError, setCurrError] = useState('');
  const [currLoading, setCurrLoading] = useState(true);
  const [currSaving, setCurrSaving] = useState(false);
  const [currJsonInput, setCurrJsonInput] = useState('');

  const currFlatNodes = useMemo(() => flattenTree(currTree), [currTree]);
  const dbSkills = useMemo(() => currFlatNodes.filter(node => node.type === 'skill'), [currFlatNodes]);

  const loadCurrTree = useCallback(async () => {
    setCurrLoading(true);
    setCurrError('');
    try {
      const response = await fetch('/api/admin/curriculum?tree=true', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load curriculum tree.');
      setCurrTree(data.tree || []);
      setCurrStatus(`Loaded ${data.count || 0} curriculum nodes.`);
    } catch (err) {
      setCurrError(err.message);
    } finally {
      setCurrLoading(false);
    }
  }, []);

  const updateCurrField = (event) => {
    const { name, value } = event.target;
    setCurrForm((current) => ({ ...current, [name]: value }));
    if (!currSelected) {
      setCurrManuallyEdited((prev) => ({ ...prev, [name]: true }));
    }
  };

  const parseJsonToCurrForm = () => {
    setCurrError('');
    try {
      const parsed = JSON.parse(currJsonInput);
      const item = Array.isArray(parsed) ? parsed[0] : parsed;
      if (!item || typeof item !== 'object') {
        throw new Error('Paste a JSON object or an array with at least one object.');
      }
      const nextForm = formFromImport(item);
      setCurrSelected(null);
      setCurrForm(nextForm);
      setCurrManuallyEdited({});
      setCurrStatus(`Parsed JSON into a ${nextForm.type} form. Review and save.`);
    } catch (err) {
      setCurrError(`JSON parse failed: ${err.message}`);
    }
  };

  const startNewCurr = (type = 'topic') => {
    setCurrSelected(null);
    setCurrForm({ ...EMPTY_FORM, type });
    setCurrManuallyEdited({});
    setCurrError('');
    setCurrStatus(`Creating a new ${type}.`);
  };

  const selectCurrNode = (node) => {
    setCurrSelected(node);
    setCurrForm(formFromNode(node));
    setCurrManuallyEdited({});
    setCurrError('');
    setCurrStatus(`Editing ${node.type}: ${node.title || node.id}.`);
  };

  const startChildCurr = (parent, type) => {
    setCurrSelected(null);
    setCurrForm(childDefaults(parent, type));
    setCurrManuallyEdited({});
    setCurrError('');
    setCurrStatus(`Creating ${type} under ${parent.title || parent.id}.`);
  };

  // Real-time interactive calculation of Stable IDs and context fields for new curriculum nodes
  useEffect(() => {
    if (currSelected) return;

    const updates = computeAutoIds(currForm, currManuallyEdited);
    if (Object.keys(updates).length > 0) {
      setCurrForm((current) => {
        let changed = false;
        const next = { ...current };
        for (const [key, val] of Object.entries(updates)) {
          if (next[key] !== val) {
            next[key] = val;
            changed = true;
          }
        }
        return changed ? next : current;
      });
    }
  }, [
    currForm.title,
    currForm.type,
    currForm.grade,
    currForm.subjectId,
    currForm.topicId,
    currForm.chapterId,
    currSelected,
    currManuallyEdited
  ]);

  const buildCurrPayload = () => {
    const metadata = safeJson(currForm.metadata);
    const payload = {
      id: currForm.id.trim() || undefined,
      type: currForm.type,
      title: currForm.title.trim(),
      subjectId: currForm.subjectId.trim() || undefined,
      topicId: currForm.topicId.trim() || undefined,
      chapterId: currForm.chapterId.trim() || undefined,
      parentId: currForm.parentId.trim() || undefined,
      skillId: currForm.skillId.trim() || undefined,
      code: currForm.code.trim() || undefined,
      grade: currForm.grade === '' ? undefined : Number(currForm.grade),
      templateId: currForm.templateId.trim() || undefined,
      engine: currForm.engine.trim() || undefined,
      questionType: currForm.questionType.trim() || undefined,
      order: currForm.order === '' ? undefined : Number(currForm.order),
      description: currForm.description.trim() || undefined,
      prerequisites: splitList(currForm.prerequisites),
      remediation: splitList(currForm.remediation),
      tags: splitList(currForm.tags),
      status: currForm.status || 'active',
      metadata,
    };

    if (payload.type === 'subject' && !payload.subjectId) {
      payload.subjectId = payload.id;
    }
    if (payload.type === 'topic' && !payload.topicId) {
      payload.topicId = payload.id;
    }
    if (payload.type === 'chapter' && !payload.chapterId) {
      payload.chapterId = payload.id;
    }
    if (payload.type === 'skill' && !payload.skillId) {
      payload.skillId = payload.id;
    }

    return payload;
  };

  const saveCurrNode = async (event) => {
    event.preventDefault();
    setCurrSaving(true);
    setCurrError('');
    try {
      const payload = buildCurrPayload();
      if (!payload.title) throw new Error('Title is required.');
      if (!payload.type) throw new Error('Node type is required.');

      const isUpdate = Boolean(currSelected?.id);
      const url = isUpdate
        ? `/api/admin/curriculum/${encodeURIComponent(currSelected.id)}`
        : '/api/admin/curriculum';
      const response = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed.');

      setCurrSelected(data.node);
      setCurrForm(formFromNode(data.node));
      setCurrStatus(`${isUpdate ? 'Updated' : 'Created'} ${data.node.type}: ${data.node.title}.`);
      await loadCurrTree();
    } catch (err) {
      setCurrError(err.message);
    } finally {
      setCurrSaving(false);
    }
  };

  const deleteSelectedCurr = async () => {
    if (!currSelected?.id) return;
    const ok = window.confirm(`Delete ${currSelected.title || currSelected.id}?`);
    if (!ok) return;
    setCurrSaving(true);
    setCurrError('');
    try {
      const response = await fetch(`/api/admin/curriculum/${encodeURIComponent(currSelected.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Delete failed.');
      setCurrSelected(null);
      setCurrForm(EMPTY_FORM);
      setCurrStatus(`Deleted ${data.node?.title || data.node?.id || 'node'}.`);
      await loadCurrTree();
    } catch (err) {
      setCurrError(err.message);
    } finally {
      setCurrSaving(false);
    }
  };

  // Watch for unsaved form changes
  useEffect(() => {
    if (ignoreDirtyChange.current) {
      ignoreDirtyChange.current = false;
      return;
    }
    if (activeTab === 'authoring') {
      setIsDirty(true);
      setAutosaveStatus('● Unsaved changes');
    }
  }, [
    subject, topic, skillId, difficulty, type, questionText, voice, explanation,
    options, correctAnswer, teacherNotes, tags, estimatedGrade, timeEstimate,
    sourceMapping, parts, categories, categorizationItems, cardStyle, hideItemLabels
  ]);

  const QUESTION_TEMPLATES = [
    {
      name: 'Multiple Choice (MCQ)',
      description: 'Standard 4-option grammar or vocabulary question',
      type: 'mcq',
      subject: 'english',
      topic: 'grammar',
      skillId: 'parts-of-speech',
      questionText: 'Which word is a **noun** in the following sentence?\n\nThe quick brown fox jumps over the lazy dog.',
      options: [
        { label: 'quick', isCorrect: false },
        { label: 'fox', isCorrect: true },
        { label: 'jumps', isCorrect: false },
        { label: 'lazy', isCorrect: false },
      ],
      explanation: 'A noun is a word that represents a person, place, thing, or animal. "Fox" is an animal and therefore a noun.',
      difficulty: 'intermediate',
      tags: 'grammar, noun, syntax',
      estimatedGrade: 'Grade 3',
      timeEstimate: '30',
      sourceMapping: 'CCSS.ELA-LITERACY.L.3.1.A',
      teacherNotes: 'Focuses on identification within a sentence context.'
    },
    {
      name: 'Fill in the Blank (FIB)',
      description: 'Arithmetic syntax with blank answer',
      type: 'fillInTheBlank',
      subject: 'math',
      topic: 'arithmetic',
      skillId: 'addition',
      questionText: 'Solve the equation: **12 + 15 = ___**',
      correctAnswer: '27',
      explanation: 'Adding 12 and 15 gives 27.',
      difficulty: 'beginner',
      tags: 'addition, basic-math',
      estimatedGrade: 'Grade 1',
      timeEstimate: '15',
      sourceMapping: 'CCSS.MATH.CONTENT.1.OA.C.6',
      teacherNotes: 'Single digit carryover.'
    },
    {
      name: 'True / False',
      description: 'Standard true or false verification',
      type: 'mcq',
      subject: 'science',
      topic: 'biology',
      skillId: 'mammals',
      questionText: 'True or False: **Whales are mammals.**',
      options: [
        { label: 'True', isCorrect: true },
        { label: 'False', isCorrect: false },
      ],
      explanation: 'Whales are warm-blooded, breathe air with lungs, and nurse their young with milk, which makes them mammals.',
      difficulty: 'beginner',
      tags: 'biology, mammals, truth-val',
      estimatedGrade: 'Grade 2',
      timeEstimate: '20',
      sourceMapping: 'NGSS.LS1.A',
      teacherNotes: 'Clarifies common misconception about whales being fish.'
    },
    {
      name: 'Fraction Visual',
      description: 'Visual fraction grid layout definition',
      type: 'mcq',
      subject: 'math',
      topic: 'fractions',
      skillId: 'fraction-models',
      questionText: 'What fraction of the grid is **shaded**?\n\n[ Shade 3 out of 4 equal parts ]',
      options: [
        { label: '1/4', isCorrect: false },
        { label: '2/4', isCorrect: false },
        { label: '3/4', isCorrect: true },
        { label: '4/4', isCorrect: false },
      ],
      explanation: 'There are 4 total parts, and 3 of them are shaded. This represents the fraction 3/4.',
      difficulty: 'intermediate',
      tags: 'fractions, visual-math',
      estimatedGrade: 'Grade 3',
      timeEstimate: '40',
      sourceMapping: 'CCSS.MATH.CONTENT.3.NF.A.1',
      teacherNotes: 'Requires identification of numerator and denominator.'
    },
    {
      name: 'Number Line',
      description: 'Points plotted on a number line',
      type: 'fillInTheBlank',
      subject: 'math',
      topic: 'number-line',
      skillId: 'coordinates',
      questionText: 'Look at the number line. What number is represented by point **A**?\n\n`0 -- 1 -- 2 -- [A] -- 4 -- 5`',
      correctAnswer: '3',
      explanation: 'Point A sits exactly halfway between 2 and 4, which represents the number 3.',
      difficulty: 'intermediate',
      tags: 'number-line, ordering',
      estimatedGrade: 'Grade 2',
      timeEstimate: '30',
      sourceMapping: 'CCSS.MATH.CONTENT.2.MD.B.6',
      teacherNotes: 'FIB entry should accept 3.'
    },
    {
      name: 'Word Problem',
      description: 'Multi-line word problem description',
      type: 'fillInTheBlank',
      subject: 'math',
      topic: 'word-problems',
      skillId: 'multiplication',
      questionText: 'Sarah has **5 baskets** of apples.\nEach basket has **6 apples**.\n\nHow many apples does Sarah have in total?',
      correctAnswer: '30',
      explanation: 'We multiply the number of baskets by the apples per basket: 5 \u00d7 6 = 30 apples.',
      difficulty: 'intermediate',
      tags: 'multiplication, word-problems',
      estimatedGrade: 'Grade 3',
      timeEstimate: '45',
      sourceMapping: 'CCSS.MATH.CONTENT.3.OA.A.3',
      teacherNotes: 'Check if students write just the number or the word. Keep correct answer as 30.'
    },
    {
      name: 'Categorization (v2)',
      description: 'Drag and drop items into categories',
      type: 'categorizationv2',
      subject: 'math',
      topic: 'time',
      skillId: 'time-g1-categorize-clocks',
      questionText: 'Sort the clocks into the correct time groups.',
      categories: [
        { id: 'o_clock', label: "O'clock" },
        { id: 'half_past', label: "Half past" }
      ],
      items: [
        { id: 'clock_1', content: '3:00', categoryId: 'o_clock' },
        { id: 'clock_2', content: '4:30', categoryId: 'half_past' },
        { id: 'clock_3', content: '8:00', categoryId: 'o_clock' }
      ],
      explanation: "3:00 and 8:00 are o'clock times. 4:30 is half past.",
      difficulty: 'beginner',
      tags: 'time, clock, sorting',
      estimatedGrade: 'Grade 1',
      timeEstimate: '30',
      sourceMapping: 'CCSS.MATH.CONTENT.1.MD.B.3',
      teacherNotes: 'Interactive drag and drop sorting.'
    }
  ];

  // 4. TTS Cache Manager State
  const [cacheItems, setCacheItems] = useState([]);
  const [loadingCache, setLoadingCache] = useState(false);
  const [cacheSearch, setCacheSearch] = useState('');
  const [cachePage, setCachePage] = useState(1);
  const [cacheTotalPages, setCacheTotalPages] = useState(1);
  const [cacheTotalCount, setCacheTotalCount] = useState(0);
  const [playingCacheId, setPlayingCacheId] = useState(null);

  // Visible Columns state
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    subject: true,
    topic: true,
    type: true,
    questionText: true,
    audioStatus: true,
    play: true,
    actions: true
  });
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);

  useEffect(() => {
    const storedColumns = localStorage.getItem('curriculum_admin_visible_columns');
    if (storedColumns) {
      try {
        setVisibleColumns(JSON.parse(storedColumns));
      } catch (e) {
        console.error('Failed to parse visible columns from localStorage:', e);
      }
    }
  }, []);

  const handleToggleColumn = (col) => {
    setVisibleColumns(prev => {
      const updated = { ...prev, [col]: !prev[col] };
      localStorage.setItem('curriculum_admin_visible_columns', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!showColumnsDropdown) return;
    const handleOutsideClick = () => {
      setShowColumnsDropdown(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showColumnsDropdown]);

  // Persistent Activity Log State
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    const storedLog = localStorage.getItem('curriculum_activity_log');
    if (storedLog) {
      try {
        setActivityLog(JSON.parse(storedLog));
      } catch (e) {
        console.error(e);
      }
    } else {
      const initialLog = [
        { id: '1', action: 'System startup initialized', type: 'system', timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() },
        { id: '2', action: 'MongoDB connection established', type: 'system', timestamp: new Date(Date.now() - 3500000).toLocaleTimeString() },
        { id: '3', action: 'Cloudflare R2 Bucket synced', type: 'system', timestamp: new Date(Date.now() - 3400000).toLocaleTimeString() }
      ];
      setActivityLog(initialLog);
      localStorage.setItem('curriculum_activity_log', JSON.stringify(initialLog));
    }
  }, []);

  const logActivity = (action, type = 'info') => {
    const newItem = {
      id: Date.now().toString(),
      action,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setActivityLog(prev => {
      const updated = [newItem, ...prev].slice(0, 30); // keep last 30
      localStorage.setItem('curriculum_activity_log', JSON.stringify(updated));
      return updated;
    });
  };

  // --- FETCH STATS ---
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const studentParam = selectedStudent === 'all' ? '' : `?student=${encodeURIComponent(selectedStudent)}`;
      const res = await fetch(`/api/admin/stats${studentParam}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          totalQuestions: data.totalQuestions,
          questionsWithAudio: data.questionsWithAudio,
          missingAudio: data.missingAudio,
          mcqQuestions: data.mcqQuestions,
          fibQuestions: data.fibQuestions,
          ttsCacheItems: data.ttsCacheItems,
          r2Configured: data.r2Configured,
          dbConnected: data.dbConnected,
          subjects: data.subjects || [],
          topics: data.topics || [],
          totalAttempts: data.analytics?.totalAttempts || 0,
          correctAttempts: data.analytics?.correctAttempts || 0,
          recentAttempts: data.analytics?.recentAttempts || [],
          topicBreakdown: data.topicBreakdown || [],
          frictionPoints: data.frictionPoints || [],
          students: data.students || []
        });
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Could not load stats: ${err.message}` });
    } finally {
      setLoadingStats(false);
    }
  };

  // --- FETCH QUESTIONS LIBRARY ---
  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const queryParams = new URLSearchParams({
        search: qSearch,
        subject: qSubject,
        topic: qTopic,
        type: qType === 'all' ? '' : qType,
        audioStatus: qAudioStatus,
        page: qPage.toString(),
        limit: '15'
      });
      
      const res = await fetch(`/api/admin/questions?${queryParams.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.questions || []);
        setQTotalPages(data.pagination?.pages || 1);
        setQTotalCount(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch questions');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Could not load questions: ${err.message}` });
    } finally {
      setLoadingQuestions(false);
    }
  }, [qSearch, qSubject, qTopic, qType, qAudioStatus, qPage]);

  // --- FETCH TTS CACHE ITEMS ---
  const fetchCacheItems = useCallback(async () => {
    setLoadingCache(true);
    try {
      const queryParams = new URLSearchParams({
        search: cacheSearch,
        page: cachePage.toString(),
        limit: '20'
      });
      
      const res = await fetch(`/api/admin/tts-cache?${queryParams.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setCacheItems(data.items || []);
        setCacheTotalPages(data.pagination?.pages || 1);
        setCacheTotalCount(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch cache items');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Could not load cache: ${err.message}` });
    } finally {
      setLoadingCache(false);
    }
  }, [cacheSearch, cachePage]);

  // Trigger loads on mount & state shifts
  useEffect(() => {
    fetchStats();
  }, [selectedStudent]);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchQuestions();
    } else if (activeTab === 'cache') {
      fetchCacheItems();
    } else if (activeTab === 'curriculum' || activeTab === 'authoring') {
      loadCurrTree();
    }
  }, [activeTab, fetchQuestions, fetchCacheItems, loadCurrTree]);

  // Reset library page on filter changes
  useEffect(() => {
    setQPage(1);
  }, [qSearch, qSubject, qTopic, qType, qAudioStatus]);

  // Reset cache page on search change
  useEffect(() => {
    setCachePage(1);
  }, [cacheSearch]);

  // Reset preview answer when changing type in form
  useEffect(() => {
    setPreviewAnswer(null);
    setPreviewCheckResult(null);
  }, [type]);

  // --- ACTIONS: BULK AUDIO GENERATION ---
  const handleBulkGenerateAudio = async () => {
    if (bulkGenerating) return;
    
    // Initial numbers
    const startMissing = stats.missingAudio;
    if (startMissing === 0) {
      setAlert({ type: 'info', text: 'All questions already have audio!' });
      return;
    }

    setBulkGenerating(true);
    setBulkProcessed(0);
    setBulkTotal(startMissing);
    setBulkRemaining(startMissing);
    setAlert({ type: 'info', text: 'Starting bulk audio generation in batches of 15...' });
    logActivity(`Bulk audio generation started for ${startMissing} items`, 'info');

    let remaining = startMissing;
    let processed = 0;

    try {
      while (remaining > 0) {
        const res = await fetch('/api/admin/generate-audio-bulk', { method: 'POST' });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Error processing batch');
        }

        if (data.processedCount === 0 && data.remainingCount === remaining) {
          // Prevent infinite loop if no items can be processed
          break;
        }

        processed += data.processedCount;
        remaining = data.remainingCount;

        setBulkProcessed(processed);
        setBulkRemaining(remaining);

        if (remaining === 0) break;

        // Be gentle on Gemini API rate limits
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setAlert({
        type: 'success',
        text: `Bulk generation complete! Processed ${processed} questions. Remaining missing: ${remaining}.`
      });
      logActivity(`Bulk generated audio for ${processed} questions`, 'success');
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Bulk generation halted: ${err.message}` });
      logActivity(`Bulk generation failed: ${err.message}`, 'error');
    } finally {
      setBulkGenerating(false);
      fetchStats();
    }
  };

  // --- ACTIONS: CLEAR ALL CACHE ---
  const handleClearAllCache = async () => {
    if (!window.confirm('WARNING: Are you sure you want to PURGE ALL cached text-to-speech audio files? This forces re-generation for all practice elements.')) {
      return;
    }
    
    try {
      const res = await fetch('/api/admin/tts-cache?purgeAll=true', { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        setAlert({ type: 'success', text: `Successfully purged all audio caches (${data.deletedCount} items deleted).` });
        logActivity(`Purged all cached audio streams (${data.deletedCount} files)`, 'danger');
        fetchStats();
        if (activeTab === 'cache') fetchCacheItems();
      } else {
        throw new Error(data.error || 'Failed to purge cache');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Cache purge failed: ${err.message}` });
    }
  };

  // --- ACTIONS: DELETE QUESTION ---
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm(`Are you sure you want to delete question "${id}"? This action cannot be undone.`)) {
      return;
    }
    if (!window.confirm(`Double Check: Really delete question "${id}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/questions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setAlert({ type: 'success', text: `Question "${id}" successfully deleted.` });
        logActivity(`Deleted question "${id}"`, 'danger');
        fetchStats();
        fetchQuestions();
      } else {
        throw new Error(data.error || 'Failed to delete question');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Could not delete question: ${err.message}` });
    }
  };

  // --- ACTIONS: DELETE SINGLE CACHE ---
  const handleDeleteCacheItem = async (hash) => {
    try {
      const res = await fetch(`/api/admin/tts-cache?id=${hash}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setAlert({ type: 'success', text: 'Cache item deleted.' });
        logActivity(`Deleted cache record hash "${hash}"`, 'info');
        fetchStats();
        fetchCacheItems();
      } else {
        throw new Error(data.error || 'Failed to delete cache item');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Cache delete error: ${err.message}` });
    }
  };

  // --- PLAY AUDIO UTILS ---
  const handlePlayUrlAudio = (id, url) => {
    if (!url) return;
    stopAllSpeech();
    
    if (playingAudioId === id) {
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(id);
    const audio = new Audio(url);
    audio.play()
      .then(() => {
        audio.onended = () => setPlayingAudioId(null);
      })
      .catch((err) => {
        console.error(err);
        setPlayingAudioId(null);
        setAlert({ type: 'error', text: 'Failed to play audio from R2 URL. Stale link or network block.' });
      });
  };

  const handlePlayCacheAudio = (hash, base64) => {
    if (!base64) return;
    stopAllSpeech();

    if (playingCacheId === hash) {
      setPlayingCacheId(null);
      return;
    }

    setPlayingCacheId(hash);
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    audio.play()
      .then(() => {
        audio.onended = () => setPlayingCacheId(null);
      })
      .catch((err) => {
        console.error(err);
        setPlayingCacheId(null);
      });
  };

  // --- AUTHORING FORM UTILS ---
  const addOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, { label: `Option ${options.length + 1}`, isCorrect: false }]);
  };

  const removeOption = (idx) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOptionText = (idx, val) => {
    const updated = [...options];
    updated[idx].label = val;
    setOptions(updated);
  };

  const setCorrectOption = (idx) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx
    }));
    setOptions(updated);
    if (updated[idx]) {
      setCorrectAnswer(updated[idx].label);
    }
  };
  const syncTargetsToCategoriesAndItems = (newTargets) => {
    setTargets(newTargets);
    
    // Automatically update categories
    const newCategories = (newTargets || []).map(t => ({
      id: t.id,
      label: t.label || ''
    }));
    setCategories(newCategories);

    // Update items' categoryId if their mapped target/category was deleted
    const validIds = new Set(newCategories.map(c => c.id));
    const fallbackId = newCategories[0]?.id || '';
    setCategorizationItems(prev => prev.map(item => {
      if (!validIds.has(item.categoryId)) {
        return { ...item, categoryId: fallbackId };
      }
      return item;
    }));
  };

  const handleUpdateCategoryLabel = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categories];
    const oldId = updated[index].id;
    const newId = value.trim() ? slugify(value) : `cat_${index + 1}`;
    
    let uniqueNewId = newId;
    let counter = 1;
    while (updated.some((c, idx) => idx !== index && c.id === uniqueNewId)) {
      uniqueNewId = `${newId}_${counter}`;
      counter++;
    }
    
    updated[index] = { ...updated[index], label: value, id: uniqueNewId };
    setCategories(updated);
    
    // Keep targets in sync if they exist
    if (targets) {
      setTargets(prev => prev.map(t => {
        if (t.id === oldId) {
          return { ...t, label: value, id: uniqueNewId };
        }
        return t;
      }));
    }

    setCategorizationItems(prev => prev.map(item => {
      if (item.categoryId === oldId) {
        return { ...item, categoryId: uniqueNewId };
      }
      return item;
    }));
  };

  const handleAddCategory = () => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const nextIdx = categories.length + 1;
    const nextId = `cat_${nextIdx}`;
    const newCategory = { id: nextId, label: `Category ${nextIdx}` };
    setCategories([...categories, newCategory]);
    
    // Also add to targets if targets exist
    if (targets) {
      setTargets([...targets, {
        id: nextId,
        label: newCategory.label,
        x: Math.max(0, Math.min(85, 10 + ((nextIdx - 1) * 20))),
        y: 40,
        width: 15,
        height: 8,
        pointerX: Math.max(0, Math.min(100, 10 + ((nextIdx - 1) * 20) + 7.5)),
        pointerY: 60,
        unit: '%'
      }]);
    }
  };

  const handleRemoveCategory = (index) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const categoryToRemove = categories[index];
    const remaining = categories.filter((_, idx) => idx !== index);
    setCategories(remaining);

    // Keep targets in sync
    if (targets) {
      setTargets(targets.filter(t => t.id !== categoryToRemove.id));
    }

    const fallbackCatId = remaining[0]?.id || '';
    setCategorizationItems(prev => prev.map(item => {
      if (item.categoryId === categoryToRemove.id) {
        return { ...item, categoryId: fallbackCatId };
      }
      return item;
    }));
  };

  // Diagram Labeling Editor helpers
  const handleDiagramImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setBackgroundImage(dataUrl);
      setCanvas(prev => ({
        ...(prev || { width: 800 }),
        backgroundImage: dataUrl
      }));
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDiagramImageUrlChange = (val) => {
    setBackgroundImage(val);
    setCanvas(prev => ({
      ...(prev || { width: 800 }),
      backgroundImage: val
    }));
    setIsDirty(true);
  };

  const handleCanvasWidthChange = (val) => {
    const w = parseInt(val, 10) || 800;
    setCanvas(prev => ({
      ...(prev || {}),
      width: w
    }));
    setIsDirty(true);
  };

  const handleCanvasClick = (e) => {
    // Only trigger if clicking directly on canvas, the background image, or the SVG background wrapper
    if (e.target !== canvasRef.current && e.target.tagName !== 'IMG' && !canvasRef.current.contains(e.target)) return;
    // Don't trigger if clicked on an existing box inside the canvas
    if (e.target.closest('[style*="position: absolute"]')) return;
    if (!canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;
    
    const xPct = parseFloat(((clickX / canvasRect.width) * 100).toFixed(2));
    const yPct = parseFloat(((clickY / canvasRect.height) * 100).toFixed(2));
    
    if (type === 'mcq_hotspot') {
      const newId = `hs_${Date.now()}`;
      const nextNum = (hotspots || []).length + 1;
      
      const newX = Math.max(0, Math.min(85, xPct - 7.5));
      const newY = Math.max(0, Math.min(92, yPct - 4));
      
      const newHotspot = {
        id: newId,
        label: `Hotspot ${nextNum}`,
        x: newX,
        y: newY,
        width: 15,
        height: 8,
        isCircle: false,
        isCorrect: (hotspots || []).length === 0
      };
      
      const nextHotspots = [...(hotspots || []), newHotspot];
      syncHotspotsToOptions(nextHotspots);
      setSelectedHotspotId(newId);
      setIsDirty(true);
      return;
    }
    
    // Default diagram labeling logic
    const newId = `target_${Date.now()}`;
    const nextNum = (targets || []).length + 1;
    
    const newX = Math.max(0, Math.min(85, xPct - 7.5));
    const newY = Math.max(0, Math.min(92, yPct - 4));
    
    const newTarget = {
      id: newId,
      label: `Target ${nextNum}`,
      x: newX,
      y: newY,
      width: 15,
      height: 8,
      pointerX: xPct,
      pointerY: Math.max(0, Math.min(100, yPct + 8)),
      unit: '%'
    };
    
    const newTargets = [...(targets || []), newTarget];
    syncTargetsToCategoriesAndItems(newTargets);
    setSelectedTargetId(newId);
    setIsDirty(true);
  };

  const handleDeleteTarget = (targetId) => {
    const updatedTargets = (targets || []).filter(t => t.id !== targetId);
    syncTargetsToCategoriesAndItems(updatedTargets);
    if (selectedTargetId === targetId) {
      setSelectedTargetId(null);
    }
    setIsDirty(true);
  };

  const handleUpdateTargetLabel = (targetId, newLabel) => {
    const updatedTargets = (targets || []).map(t => {
      if (t.id === targetId) {
        return { ...t, label: newLabel };
      }
      return t;
    });
    syncTargetsToCategoriesAndItems(updatedTargets);
    setIsDirty(true);
  };

  const handleUpdateTargetDimensions = (targetId, field, val) => {
    const num = parseFloat(val) || 0;
    const updatedTargets = (targets || []).map(t => {
      if (t.id === targetId) {
        return { ...t, [field]: num };
      }
      return t;
    });
    if (field === 'label') {
      syncTargetsToCategoriesAndItems(updatedTargets);
    } else {
      setTargets(updatedTargets);
    }
    setIsDirty(true);
  };

  // Pointer dragging logic using React pointer capture
  const handleBoxPointerDown = (e, targetId) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const boxRect = e.currentTarget.getBoundingClientRect();
    setDragging({
      id: targetId,
      type: 'box',
      offsetX: e.clientX - boxRect.left,
      offsetY: e.clientY - boxRect.top
    });
    setSelectedTargetId(targetId);
  };

  const handleBoxPointerMove = (e, targetId) => {
    if (!dragging || dragging.id !== targetId || dragging.type !== 'box') return;
    e.stopPropagation();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const activeTarget = (targets || []).find(t => t.id === targetId);
    const boxWidth = activeTarget ? (activeTarget.width || 15) : 15;
    const boxHeight = activeTarget ? (activeTarget.height || 8) : 8;

    // Top-left corner position relative to canvas
    let xPx = e.clientX - dragging.offsetX - canvasRect.left;
    let yPx = e.clientY - dragging.offsetY - canvasRect.top;
    
    let xPct = Math.max(0, Math.min(100 - boxWidth, (xPx / canvasRect.width) * 100));
    let yPct = Math.max(0, Math.min(100 - boxHeight, (yPx / canvasRect.height) * 100));
    
    // Keep 2 decimal precision
    xPct = parseFloat(xPct.toFixed(2));
    yPct = parseFloat(yPct.toFixed(2));
    
    setTargets(prev => (prev || []).map(t => {
      if (t.id === targetId) {
        return { ...t, x: xPct, y: yPct };
      }
      return t;
    }));
  };

  const handleBoxPointerUp = (e, targetId) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragging(null);
    setIsDirty(true);
  };

  const handlePinPointerDown = (e, targetId) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({
      id: targetId,
      type: 'pin'
    });
    setSelectedTargetId(targetId);
  };

  const handlePinPointerMove = (e, targetId) => {
    if (!dragging || dragging.id !== targetId || dragging.type !== 'pin') return;
    e.stopPropagation();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    let xPx = e.clientX - canvasRect.left;
    let yPx = e.clientY - canvasRect.top;
    
    let xPct = Math.max(0, Math.min(100, (xPx / canvasRect.width) * 100));
    let yPct = Math.max(0, Math.min(100, (yPx / canvasRect.height) * 100));
    
    xPct = parseFloat(xPct.toFixed(2));
    yPct = parseFloat(yPct.toFixed(2));
    
    setTargets(prev => (prev || []).map(t => {
      if (t.id === targetId) {
        return { ...t, pointerX: xPct, pointerY: yPct };
      }
      return t;
    }));
  };

  const handlePinPointerUp = (e, targetId) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragging(null);
    setIsDirty(true);
  };

  const syncHotspotsToOptions = (nextHotspots) => {
    setHotspots(nextHotspots);
    setOptions(nextHotspots.map(hs => ({
      label: hs.label,
      isCorrect: hs.isCorrect
    })));
  };

  const handleHotspotPointerDown = (e, hsId) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const boxRect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const actualWidthPct = canvasRect.width > 0 ? (boxRect.width / canvasRect.width) * 100 : 15;
    const actualHeightPct = canvasRect.height > 0 ? (boxRect.height / canvasRect.height) * 100 : 8;

    setDragging({
      id: hsId,
      type: 'hotspot_box',
      offsetX: e.clientX - boxRect.left,
      offsetY: e.clientY - boxRect.top,
      actualWidthPct,
      actualHeightPct
    });
    setSelectedHotspotId(hsId);
  };

  const handleHotspotPointerMove = (e, hsId) => {
    if (!dragging || dragging.id !== hsId || dragging.type !== 'hotspot_box') return;
    e.stopPropagation();
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const boxWidth = dragging.actualWidthPct !== undefined ? dragging.actualWidthPct : 15;
    const boxHeight = dragging.actualHeightPct !== undefined ? dragging.actualHeightPct : 8;

    let xPx = e.clientX - dragging.offsetX - canvasRect.left;
    let yPx = e.clientY - dragging.offsetY - canvasRect.top;
    
    let xPct = Math.max(0, Math.min(100 - boxWidth, (xPx / canvasRect.width) * 100));
    let yPct = Math.max(0, Math.min(100 - boxHeight, (yPx / canvasRect.height) * 100));
    
    xPct = parseFloat(xPct.toFixed(2));
    yPct = parseFloat(yPct.toFixed(2));
    
    const updated = (hotspots || []).map(h => {
      if (h.id === hsId) {
        return { ...h, x: xPct, y: yPct };
      }
      return h;
    });
    syncHotspotsToOptions(updated);
  };

  const handleHotspotPointerUp = (e, hsId) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setDragging(null);
    setIsDirty(true);
  };

  const handleAutoGrid = (layoutType = 'grid') => {
    if (!hotspots || hotspots.length === 0) return;
    const count = hotspots.length;
    
    let cols = 1;
    let rows = 1;
    
    if (layoutType === 'horizontal') {
      cols = count;
      rows = 1;
    } else if (layoutType === 'vertical') {
      cols = 1;
      rows = count;
    } else {
      cols = Math.ceil(Math.sqrt(count));
      rows = Math.ceil(count / cols);
    }

    const paddingX = 10;
    const paddingY = 10;
    const availableW = 100 - (paddingX * 2);
    const availableH = 100 - (paddingY * 2);
    const gapX = cols > 1 ? 5 : 0;
    const gapY = rows > 1 ? 5 : 0;
    
    const itemW = (availableW - (gapX * (cols - 1))) / cols;
    const itemH = (availableH - (gapY * (rows - 1))) / rows;
    
    const updated = hotspots.map((hs, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = paddingX + col * (itemW + gapX);
      const y = paddingY + row * (itemH + gapY);
      return {
        ...hs,
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        width: parseFloat(itemW.toFixed(2)),
        height: parseFloat(itemH.toFixed(2))
      };
    });
    syncHotspotsToOptions(updated);
    setIsDirty(true);
  };

  const handleUpdateHotspotDimension = (hsId, field, val) => {
    const num = parseFloat(val) || 0;
    const updated = (hotspots || []).map(h => {
      if (h.id === hsId) {
        return { ...h, [field]: num };
      }
      return h;
    });
    syncHotspotsToOptions(updated);
    setIsDirty(true);
  };

  const handleUpdateItemContent = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categorizationItems];
    updated[index] = { ...updated[index], content: value };
    setCategorizationItems(updated);
  };

  const handleUpdateItemCategory = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categorizationItems];
    updated[index] = { ...updated[index], categoryId: value };
    setCategorizationItems(updated);
  };

  const handleUpdateItemImageUrl = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categorizationItems];
    updated[index] = { ...updated[index], imageUrl: value };
    setCategorizationItems(updated);
  };

  const handleUpdateItemImageWidth = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categorizationItems];
    updated[index] = { ...updated[index], imageWidth: value };
    setCategorizationItems(updated);
  };

  const handleUpdateItemSvg = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categorizationItems];
    updated[index] = { ...updated[index], svg: value };
    setCategorizationItems(updated);
  };

  const handleUpdateItemVisualType = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...categorizationItems];
    updated[index] = { ...updated[index], visualType: value };
    setCategorizationItems(updated);
  };

  const handleAddItem = () => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const nextIdx = categorizationItems.length + 1;
    let itemId = `item_${nextIdx}`;
    let counter = 1;
    while (categorizationItems.some(it => it.id === itemId)) {
      itemId = `item_${nextIdx}_${counter}`;
      counter++;
    }
    const defaultCatId = categories[0]?.id || '';
    setCategorizationItems([...categorizationItems, { id: itemId, content: `Item ${nextIdx}`, categoryId: defaultCatId, imageUrl: '', imageWidth: '', svg: '', visualType: 'none' }]);
  };

  const handleRemoveItem = (index) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    setCategorizationItems(categorizationItems.filter((_, idx) => idx !== index));
  };

  const handleUpdatePartType = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...parts];
    updated[index] = { ...updated[index], type: value };
    setParts(updated);
  };

  const handleUpdatePartContent = (index, value) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...parts];
    updated[index] = { ...updated[index], content: value };
    setParts(updated);
    
    if (index === 0 && updated[0].type === 'text') {
      setQuestionText(value);
    }
  };

  const handleUpdatePartFields = (index, fields) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...parts];
    updated[index] = { ...updated[index], ...fields };
    setParts(updated);

    if (index === 0 && updated[0].type === 'text' && fields.content !== undefined) {
      setQuestionText(fields.content);
    }
  };

  const handleAddPart = (partType) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    let newPart = { type: partType };
    if (partType === 'text') {
      newPart.content = '';
    } else if (partType === 'latex') {
      newPart.content = '';
      newPart.display = false;
    } else if (partType === 'image') {
      newPart.content = '';
      newPart.alt = '';
      newPart.style = { maxWidth: '100%', height: 'auto' };
    } else if (partType === 'svg') {
      newPart.content = '';
    }
    setParts([...parts, newPart]);
  };


  const handleRemovePart = (index) => {
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    setParts(parts.filter((_, idx) => idx !== index));
  };

  const handleMovePartUp = (index) => {
    if (index === 0) return;
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...parts];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setParts(updated);
  };

  const handleMovePartDown = (index) => {
    if (index === parts.length - 1) return;
    ignoreDirtyChange.current = false;
    setIsDirty(true);
    const updated = [...parts];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setParts(updated);
  };

  const handleResetForm = () => {
    ignoreDirtyChange.current = true;
    setEditMode(false);
    setEditId(null);
    setSubject('english');
    setTopic('grammar');
    setSkillId('nouns');
    setDifficulty('beginner');
    setType('mcq');
    setQuestionText('Is the word **frog** a person, place, animal, or thing?');
    setVoice('Puck');
    setExplanation('');
    setAudioUrl('');
    setGenerateAudioCheckbox('all');
    setReadable(true);
    setReadOptions(true);
    setOptions([
      { label: 'person', isCorrect: false },
      { label: 'place', isCorrect: false },
      { label: 'animal', isCorrect: true },
      { label: 'thing', isCorrect: false },
    ]);
    setCorrectAnswer('animal');
    
    setParts([
      { type: 'text', content: 'Is the word **frog** a person, place, animal, or thing?' }
    ]);
    setCategories([
      { id: 'cat_1', label: 'Category 1' },
      { id: 'cat_2', label: 'Category 2' }
    ]);
    setCategorizationItems([
      { id: 'item_1', content: 'Item 1', categoryId: 'cat_1', imageUrl: '', imageWidth: '', svg: '', visualType: 'none' },
      { id: 'item_2', content: 'Item 2', categoryId: 'cat_2', imageUrl: '', imageWidth: '', svg: '', visualType: 'none' }
    ]);
    setCorrectAnswer('animal');
    setFibAnswers({ ans: 'animal' });
    
    // Clear custom fields
    setTeacherNotes('');
    setTags('');
    setEstimatedGrade('');
    setTimeEstimate('');
    setSourceMapping('');

    // Clear Universal DnD specific fields
    setLayoutMode('');
    setInteraction('');
    setTargets(null);
    setBackgroundImage('');
    setCanvas(null);
    setBehavior(null);
    setSourceTray(null);
    setCardStyle('');
    setHideItemLabels(false);
    setShowHotspotLabels(false);

    setPreviewAnswer(null);
    setPreviewCheckResult(null);
    setPreviewSimulateState(null);
    setIsDirty(false);
    setAutosaveStatus('');
  };

  const handleResetFormWithConfirm = () => {
    if (isDirty) {
      if (!window.confirm('Are you sure you want to discard your unsaved changes and reset the form?')) {
        return;
      }
    }
    handleResetForm();
    localStorage.removeItem('curriculum_authoring_draft');
  };

  // --- LOAD TO FORM (EDIT OR DUPLICATE) ---
  const loadQuestionData = (q, mode = 'edit') => {
    ignoreDirtyChange.current = true;
    setType(q.type || 'mcq');
    setSubject(q.subject || '');
    setTopic(q.topic || '');
    setSkillId(q.skillId || '');
    setDifficulty(q.difficulty || 'beginner');
    setQuestionText(q.questionText || '');
    setVoice(q.voice || 'Puck');
    
    // Extract explanation fallback from solution.sections
    let explanationText = q.explanation || q.metadata?.explanation || '';
    if (!explanationText && q.solution && Array.isArray(q.solution.sections)) {
      explanationText = q.solution.sections
        .filter(s => s.type === 'text')
        .map(s => s.content)
        .join('\n');
    }
    setExplanation(explanationText);
    
    // Load custom metadata fields
    setTeacherNotes(q.teacherNotes || q.metadata?.teacherNotes || '');
    setTags(Array.isArray(q.tags) ? q.tags.join(', ') : (q.tags || q.metadata?.tags?.join(', ') || ''));
    setEstimatedGrade(q.estimatedGrade || q.metadata?.estimatedGrade || '');
    setTimeEstimate(q.timeEstimate || q.metadata?.timeEstimate || '');
    setSourceMapping(q.sourceMapping || q.metadata?.sourceMapping || '');
    
    // Extract categories, items, and parts for categorizationv2
    let loadedCategories = q.categories || [];
    let loadedItems = q.items || [];
    let loadedParts = q.parts || [];

    // Fall back to nested categorization part if categories/items are empty at root
    if (loadedCategories.length === 0 || loadedItems.length === 0) {
      const nestedPart = loadedParts.find(p => p.type === 'categorization');
      if (nestedPart) {
        if (loadedCategories.length === 0 && nestedPart.categories) {
          loadedCategories = nestedPart.categories;
        }
        if (loadedItems.length === 0 && nestedPart.items) {
          loadedItems = nestedPart.items;
        }
      }
    }

    // Default fallbacks if still empty
    if (loadedCategories.length === 0) {
      loadedCategories = [
        { id: 'cat_1', label: 'Category 1' },
        { id: 'cat_2', label: 'Category 2' }
      ];
    }
    if (loadedItems.length === 0) {
      loadedItems = [
        { id: 'item_1', content: 'Item 1', categoryId: 'cat_1', imageUrl: '', imageWidth: '' },
        { id: 'item_2', content: 'Item 2', categoryId: 'cat_2', imageUrl: '', imageWidth: '' }
      ];
    }

    setCategories(loadedCategories);
    setCategorizationItems(loadedItems.map(item => {
      let visualType = 'none';
      let svgVal = item.svg || '';
      let imageUrlVal = item.imageUrl || '';
      if (item.svg) {
        visualType = 'svg';
      } else if (item.imageUrl) {
        if (isInlineSvg(item.imageUrl)) {
          visualType = 'svg';
          svgVal = item.imageUrl;
          imageUrlVal = '';
        } else {
          visualType = 'imageUrl';
        }
      }
      return {
        ...item,
        id: item.id,
        content: item.content || '',
        categoryId: item.categoryId || item.target || '',
        imageUrl: imageUrlVal,
        svg: svgVal,
        visualType,
        imageWidth: item.imageWidth || ''
      };
    }));

    // Load Universal DnD specific fields
    setLayoutMode(q.layoutMode || '');
    setInteraction(q.interaction || '');
    setTargets(q.targets || null);
    setBackgroundImage(q.backgroundImage || '');
    setCanvas(q.canvas || null);
    setBehavior(q.behavior || null);
    setSourceTray(q.sourceTray || null);
    const extractedCardStyle = q.cardStyle || q.behavior?.cardStyle || q.itemCardStyle || q.imageCardStyle || q.cardVariant || '';
    const extractedHideItemLabels = Boolean(q.hideItemLabels || q.behavior?.hideItemLabels);
    setCardStyle(extractedCardStyle);
    setHideItemLabels(extractedHideItemLabels);
    const extractedShowHotspotLabels = Boolean(
      q.showHotspotLabels || 
      q.behavior?.showHotspotLabels || 
      q.metadata?.showHotspotLabels ||
      q.parts?.find(p => p.type === 'hotspot_canvas')?.showHotspotLabels
    );
    setShowHotspotLabels(extractedShowHotspotLabels);

    // Reconstruct MCQ hotspot select variables
    if (q.interaction === 'hotspot_select' || q.interaction === 'hotspot_multi_select' || q.layoutMode === 'height_comparison' || q.layoutMode === 'mcq_hotspot') {
      setType('mcq_hotspot');
      setIsHotspotMultiSelect(q.interaction === 'hotspot_multi_select');
      const hotspotPart = q.parts?.find(p => p.type === 'hotspot_canvas');
      const canvasW = hotspotPart?.canvasWidth || 800;
      const canvasH = hotspotPart?.canvasHeight || 465;
      
      const loadedBgImage = q.backgroundImage || hotspotPart?.backgroundUrl || '';
      const loadedBgSvg = hotspotPart?.backgroundSvg || '';
      setBackgroundImage(loadedBgImage);
      setBackgroundSvg(loadedBgSvg);
      
      const rawHotspots = q.hotspots || q.metadata?.hotspots;
      if (rawHotspots && Array.isArray(rawHotspots)) {
        setHotspots(rawHotspots);
      } else if (hotspotPart?.hotspots && Array.isArray(hotspotPart.hotspots)) {
        const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer;
        const loadedHotspots = hotspotPart.hotspots.map((hs, idx) => ({
          id: `hs_${idx}_${Date.now()}`,
          label: hs.label || `Hotspot ${idx + 1}`,
          x: parseFloat(((hs.x / canvasW) * 100).toFixed(2)),
          y: parseFloat(((hs.y / canvasH) * 100).toFixed(2)),
          width: parseFloat(((hs.width / canvasW) * 100).toFixed(2)),
          height: parseFloat(((hs.height / canvasH) * 100).toFixed(2)),
          isCircle: Boolean(hs.isCircle),
          isCorrect: idx === correctIdx
        }));
        setHotspots(loadedHotspots);
      } else {
        setHotspots([]);
      }
    } else {
      setHotspots([]);
      setBackgroundSvg('');
    }

    // Extract parts or default to first question text part
    if (loadedParts.length > 0) {
      setParts(loadedParts.filter(p => p.type !== 'categorization' && p.type !== 'hotspot_canvas'));
    } else {
      setParts([
        { type: 'text', content: q.questionText || '' }
      ]);
    }

    // Parse options
    if (q.options && Array.isArray(q.options)) {
      const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer;
      setOptions(q.options.map((opt, idx) => ({
        label: opt.label || '',
        isCorrect: idx === correctIdx || opt.isCorrect || false
      })));
    } else {
      setOptions([
        { label: '', isCorrect: false },
        { label: '', isCorrect: false }
      ]);
    }
    
    const rawAns = q.correctAnswer || q.answer || '';
    if (rawAns && typeof rawAns === 'object' && !Array.isArray(rawAns)) {
      setFibAnswers(rawAns);
      setCorrectAnswer(JSON.stringify(rawAns));
    } else {
      setFibAnswers({ ans: String(rawAns) });
      setCorrectAnswer(String(rawAns));
    }

    const mc = q.metaConfig || {};
    if (mode === 'edit') {
      setEditMode(true);
      setEditId(q.id);
      setAudioUrl(q.audioUrl || '');
      setGenerateAudioCheckbox('none');
      setReadable(mc.readable !== false);
      setReadOptions(mc.readOptions !== false);
    } else {
      // Duplicate Mode / Ingestion / Template
      setEditMode(false);
      setEditId(null);
      setAudioUrl(q.audioUrl || '');
      setGenerateAudioCheckbox(q.audioUrl ? 'none' : 'all');
      setReadable(mc.readable !== false);
      setReadOptions(mc.readOptions !== false);
    }

    setPreviewAnswer(null);
    setPreviewCheckResult(null);
    setPreviewSimulateState(null);
    setIsDirty(mode === 'import' || mode === 'duplicate');
    setAutosaveStatus('');
  };

  const handleLoadQuestionToForm = (q, mode = 'edit') => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes in the Authoring Center. Loading this question will overwrite them. Continue?')) {
        return;
      }
    }
    loadQuestionData(q, mode);
    setActiveTab('authoring');
  };

  // --- TAB NAVIGATION DIRTY WARNING ---
  const handleTabChange = (tabName) => {
    if (activeTab === 'authoring' && isDirty) {
      if (!window.confirm('You have unsaved changes in the Authoring Center. Switch tabs anyway?')) {
        return;
      }
    }
    setActiveTab(tabName);
    if (tabName === 'library') {
      fetchQuestions();
    } else if (tabName === 'cache') {
      fetchCacheItems();
    }
  };

  // --- TEMPLATE LOADING ---
  const handleApplyTemplate = (tpl) => {
    if (isDirty) {
      if (!window.confirm('Applying this template will overwrite current form values. Are you sure?')) {
        return;
      }
    }
    
    ignoreDirtyChange.current = true;
    setType(tpl.type);
    setSubject(tpl.subject);
    setTopic(tpl.topic);
    setSkillId(tpl.skillId);
    setQuestionText(tpl.questionText);
    setExplanation(tpl.explanation);
    setDifficulty(tpl.difficulty);
    setTags(tpl.tags || '');
    setEstimatedGrade(tpl.estimatedGrade || '');
    setTimeEstimate(tpl.timeEstimate || '');
    setSourceMapping(tpl.sourceMapping || '');
    setTeacherNotes(tpl.teacherNotes || '');
    
    if (tpl.type === 'mcq') {
      setOptions(tpl.options.map(opt => ({ label: opt.label, isCorrect: opt.isCorrect })));
      setCorrectAnswer(tpl.options.find(opt => opt.isCorrect)?.label || '');
    } else if (tpl.type === 'categorizationv2') {
      if (tpl.categories && Array.isArray(tpl.categories)) {
        setCategories(tpl.categories);
      }
      if (tpl.items && Array.isArray(tpl.items)) {
        setCategorizationItems(tpl.items.map(item => ({
          id: item.id,
          content: item.content || '',
          categoryId: item.categoryId || item.target || '',
          imageUrl: item.imageUrl || '',
          imageWidth: item.imageWidth || ''
        })));
      }
      setOptions([
        { label: '', isCorrect: false },
        { label: '', isCorrect: false }
      ]);
      setCorrectAnswer('');
    } else {
      setOptions([
        { label: '', isCorrect: false },
        { label: '', isCorrect: false }
      ]);
      setCorrectAnswer(tpl.correctAnswer || tpl.answer || '');
    }

    if (tpl.parts && Array.isArray(tpl.parts)) {
      setParts(tpl.parts);
    } else {
      if (tpl.type === 'categorizationv2') {
        setParts([
          { type: 'text', content: tpl.questionText },
          {
            type: 'categorization',
            categories: tpl.categories || [],
            items: (tpl.items || []).map(item => ({
              id: item.id,
              content: item.content || '',
              target: item.categoryId || item.target || '',
              categoryId: item.categoryId || item.target || ''
            }))
          }
        ]);
      } else {
        setParts([
          { type: 'text', content: tpl.questionText }
        ]);
      }
    }
    
    setAudioUrl('');
    setGenerateAudioCheckbox('all');
    const mc = tpl.metaConfig || {};
    setReadable(mc.readable !== false);
    setReadOptions(mc.readOptions !== false);
    setLayoutMode(tpl.layoutMode || '');
    setInteraction(tpl.interaction || '');
    setTargets(tpl.targets || null);
    setBackgroundImage(tpl.backgroundImage || '');
    setCanvas(tpl.canvas || null);
    setBehavior(tpl.behavior || null);
    setSourceTray(tpl.sourceTray || null);
    const extractedCardStyle = tpl.cardStyle || tpl.behavior?.cardStyle || tpl.itemCardStyle || tpl.imageCardStyle || tpl.cardVariant || '';
    const extractedHideItemLabels = Boolean(tpl.hideItemLabels || tpl.behavior?.hideItemLabels);
    setCardStyle(extractedCardStyle);
    setHideItemLabels(extractedHideItemLabels);
    setEditMode(false);
    setEditId(null);
    
    setPreviewAnswer(null);
    setPreviewCheckResult(null);
    setPreviewSimulateState(null);
    setIsDirty(true);
    
    setAlert({ type: 'info', text: `Loaded template: ${tpl.name}` });
  };

  // --- PASTE & PARSE INGESTION ---
  const parseRawQuestionText = (text) => {
    const lines = text.split('\n');
    let qText = '';
    let parsedOptions = [];
    let parsedCorrect = '';
    let parsedExplanation = '';
    
    let currentSection = 'question';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.startsWith('question:')) {
        currentSection = 'question';
        qText += (qText ? '\n' : '') + line.substring(9).trim();
        continue;
      } else if (lowerLine.startsWith('options:')) {
        currentSection = 'options';
        continue;
      } else if (lowerLine.startsWith('correct:') || lowerLine.startsWith('correct answer:') || lowerLine.startsWith('answer:')) {
        currentSection = 'correct';
        const offset = lowerLine.indexOf(':') + 1;
        parsedCorrect = line.substring(offset).trim();
        continue;
      } else if (lowerLine.startsWith('explanation:') || lowerLine.startsWith('exp:')) {
        currentSection = 'explanation';
        const offset = lowerLine.indexOf(':') + 1;
        parsedExplanation = line.substring(offset).trim();
        continue;
      }
      
      if (currentSection === 'question') {
        const optMatch = line.match(/^([A-Da-d0-9])[\.\)\-]\s+(.*)/);
        if (optMatch) {
          currentSection = 'options';
          parsedOptions.push({
            label: optMatch[2].trim(),
            isCorrect: false
          });
        } else {
          qText += (qText ? '\n' : '') + line;
        }
      } else if (currentSection === 'options') {
        const optMatch = line.match(/^([A-Ha-h0-9])[\.\)\-]\s+(.*)/);
        if (optMatch) {
          parsedOptions.push({
            label: optMatch[2].trim(),
            isCorrect: false
          });
        } else {
          if (parsedOptions.length > 0) {
            parsedOptions[parsedOptions.length - 1].label += ' ' + line;
          } else {
            parsedOptions.push({ label: line, isCorrect: false });
          }
        }
      } else if (currentSection === 'correct') {
        parsedCorrect += (parsedCorrect ? ' ' : '') + line;
      } else if (currentSection === 'explanation') {
        parsedExplanation += (parsedExplanation ? '\n' : '') + line;
      }
    }
    
    let finalCorrectIndex = -1;
    if (parsedOptions.length > 0) {
      const cleanCorrect = parsedCorrect.trim().toLowerCase();
      finalCorrectIndex = parsedOptions.findIndex(o => o.label.toLowerCase() === cleanCorrect);
      
      if (finalCorrectIndex === -1) {
        if (cleanCorrect.length === 1 || (cleanCorrect.endsWith('.') && cleanCorrect.length === 2)) {
          const letter = cleanCorrect[0];
          const charCode = letter.charCodeAt(0) - 97; // 'a' is 97
          if (charCode >= 0 && charCode < parsedOptions.length) {
            finalCorrectIndex = charCode;
          }
        }
      }
      
      if (finalCorrectIndex !== -1) {
        parsedOptions[finalCorrectIndex].isCorrect = true;
      }
    }
    
    return {
      questionText: qText.trim(),
      options: parsedOptions,
      correctAnswer: parsedCorrect.trim(),
      explanation: parsedExplanation.trim(),
      correctAnswerIndex: finalCorrectIndex,
      type: parsedOptions.length > 0 ? 'mcq' : 'fillInTheBlank'
    };
  };

  const handleParseQuestion = () => {
    if (!rawTextToParse.trim()) {
      setAlert({ type: 'error', text: 'Please paste some raw text to parse.' });
      return;
    }
    
    try {
      const result = parseRawQuestionText(rawTextToParse);
      
      if (!result.questionText) {
        throw new Error('Could not identify Question Text. Ensure your text has a question statement.');
      }
      
      ignoreDirtyChange.current = true;
      setQuestionText(result.questionText);
      setType(result.type);
      setExplanation(result.explanation);
      
      if (result.type === 'mcq') {
        setOptions(result.options);
        if (result.correctAnswerIndex !== -1) {
          setCorrectAnswer(result.options[result.correctAnswerIndex].label);
        } else {
          setCorrectAnswer(result.correctAnswer || '');
        }
      } else {
        setCorrectAnswer(result.correctAnswer);
        setOptions([
          { label: '', isCorrect: false },
          { label: '', isCorrect: false }
        ]);
      }
      
      setIsDirty(true);
      setAlert({ type: 'success', text: 'Successfully parsed question text! Loaded into builder.' });
      setPreviewAnswer(null);
      setPreviewCheckResult(null);
      setPreviewSimulateState(null);
      setAuthoringMode('manual');
    } catch (err) {
      setAlert({ type: 'error', text: `Parsing Failed: ${err.message}` });
    }
  };

  // --- JSON IMPORT AND UPLOAD ---
  const handleImportJSON = () => {
    if (!jsonTextToImport.trim()) {
      setJsonValidationError('Please enter JSON text.');
      return;
    }
    
    try {
      const data = JSON.parse(jsonTextToImport);
      setJsonValidationError(null);
      
      const required = ['subject', 'topic', 'skillId', 'type', 'questionText'];
      const missing = required.filter(field => !data[field]);
      
      if (missing.length > 0) {
        setJsonValidationError(`Missing required fields: ${missing.join(', ')}`);
        return;
      }
      
      loadQuestionData(data, data.id ? 'edit' : 'import');
      setAuthoringMode('manual');
      setAlert({ type: 'success', text: 'Successfully imported question JSON schema!' });
    } catch (err) {
      setJsonValidationError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleJsonFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonTextToImport(event.target?.result || '');
      setJsonValidationError(null);
    };
    reader.readAsText(file);
  };

  // --- KEYBOARD SHORTCUTS AND MOVE ROWS ---
  const handleOptionKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (options.length < 8) {
        const newOptions = [...options];
        newOptions.splice(idx + 1, 0, { label: '', isCorrect: false });
        setOptions(newOptions);
        setTimeout(() => {
          const inputs = document.querySelectorAll(`.${styles.optionTextInput}`);
          if (inputs[idx + 1]) {
            inputs[idx + 1].focus();
          }
        }, 50);
      }
    } else if (e.key === 'Backspace' && !options[idx].label) {
      if (options.length > 2) {
        e.preventDefault();
        removeOption(idx);
        setTimeout(() => {
          const inputs = document.querySelectorAll(`.${styles.optionTextInput}`);
          const targetIdx = idx > 0 ? idx - 1 : 0;
          if (inputs[targetIdx]) {
            inputs[targetIdx].focus();
          }
        }, 50);
      }
    }
  };

  const moveOptionUp = (idx) => {
    if (idx === 0) return;
    const newOptions = [...options];
    const temp = newOptions[idx];
    newOptions[idx] = newOptions[idx - 1];
    newOptions[idx - 1] = temp;
    setOptions(newOptions);
  };

  const moveOptionDown = (idx) => {
    if (idx === options.length - 1) return;
    const newOptions = [...options];
    const temp = newOptions[idx];
    newOptions[idx] = newOptions[idx + 1];
    newOptions[idx + 1] = temp;
    setOptions(newOptions);
  };

  // --- PREVIEW SIMULATION ---
  const handleSimulateCorrect = () => {
    if (type === 'mcq') {
      const correctIdx = options.findIndex(o => o.isCorrect);
      if (correctIdx === -1) {
        setAlert({ type: 'error', text: 'Select a correct option in the manual builder first!' });
        return;
      }
      setPreviewAnswer(correctIdx);
      setPreviewCheckResult('correct');
    } else if (type === 'categorizationv2' || type === 'categorization') {
      if (categorizationItems.length === 0) {
        setAlert({ type: 'error', text: 'Add categorization items first!' });
        return;
      }
      const ansObj = {};
      categorizationItems.forEach(item => {
        ansObj[item.id] = item.categoryId;
      });
      setPreviewAnswer(ansObj);
      setPreviewCheckResult('correct');
    } else if (type === 'fillInTheBlank') {
      const blankIds = extractBlankIds(parts, questionText);
      if (blankIds.length > 1) {
        const ansObj = {};
        blankIds.forEach(id => {
          ansObj[id] = fibAnswers[id] || '';
        });
        setPreviewAnswer(ansObj);
        setPreviewCheckResult('correct');
      } else {
        const singleBlankId = blankIds.length === 1 ? blankIds[0] : 'ans';
        const singleValue = blankIds.length === 1 ? (fibAnswers[singleBlankId] || correctAnswer) : correctAnswer;
        if (!singleValue.trim()) {
          setAlert({ type: 'error', text: 'Enter a correct answer first!' });
          return;
        }
        setPreviewAnswer(singleValue.trim());
        setPreviewCheckResult('correct');
      }
    } else {
      if (!correctAnswer.trim()) {
        setAlert({ type: 'error', text: 'Enter a correct answer phrase first!' });
        return;
      }
      setPreviewAnswer(correctAnswer.trim());
      setPreviewCheckResult('correct');
    }
    setPreviewSimulateState('correct');
  };

  const handleSimulateWrong = () => {
    if (type === 'mcq') {
      const correctIdx = options.findIndex(o => o.isCorrect);
      let wrongIdx = options.findIndex(o => !o.isCorrect);
      if (wrongIdx === -1) {
        wrongIdx = correctIdx === 0 ? 1 : 0;
      }
      if (wrongIdx >= options.length) {
        wrongIdx = 0;
      }
      setPreviewAnswer(wrongIdx);
      setPreviewCheckResult('incorrect');
    } else if (type === 'categorizationv2' || type === 'categorization') {
      const ansObj = {};
      categorizationItems.forEach(item => {
        ansObj[item.id] = 'incorrect_category_id';
      });
      setPreviewAnswer(ansObj);
      setPreviewCheckResult('incorrect');
    } else if (type === 'fillInTheBlank') {
      const blankIds = extractBlankIds(parts, questionText);
      if (blankIds.length > 1) {
        const ansObj = {};
        blankIds.forEach(id => {
          ansObj[id] = 'incorrect';
        });
        setPreviewAnswer(ansObj);
        setPreviewCheckResult('incorrect');
      } else {
        setPreviewAnswer('incorrect');
        setPreviewCheckResult('incorrect');
      }
    } else {
      setPreviewAnswer('incorrect answer text');
      setPreviewCheckResult('incorrect');
    }
    setPreviewSimulateState('wrong');
  };

  // --- AUTOSAVE AND RECOVERY TRIGGERS ---
  useEffect(() => {
    // Check if there is an unsaved draft on load
    const savedDraft = localStorage.getItem('curriculum_authoring_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.timestamp) {
          setRecoveryTimestamp(new Date(draft.timestamp).toLocaleString());
          setShowRecoveryBanner(true);
        }
      } catch (e) {
        console.error('Failed to parse draft from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'authoring') return;
    
    const interval = setInterval(() => {
      if (isDirty) {
        const draft = {
          editMode,
          editId,
          subject,
          topic,
          skillId,
          difficulty,
          type,
          questionText,
          voice,
          explanation,
          audioUrl,
          generateAudioCheckbox,
          readable,
          readOptions,
          options,
          correctAnswer,
          fibAnswers,
          teacherNotes,
          tags,
          estimatedGrade,
          timeEstimate,
          sourceMapping,
          parts,
          categories,
          categorizationItems,
          layoutMode,
          interaction,
          targets,
          backgroundImage,
          canvas,
          behavior,
          sourceTray,
          cardStyle,
          hideItemLabels,
          timestamp: Date.now()
        };
        localStorage.setItem('curriculum_authoring_draft', JSON.stringify(draft));
        const timeStr = new Date().toLocaleTimeString();
        setAutosaveStatus(`● Draft saved at ${timeStr}`);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [
    activeTab, isDirty, editMode, editId, subject, topic, skillId, difficulty,
    type, questionText, voice, explanation, audioUrl, generateAudioCheckbox,
    readable, readOptions,
    options, correctAnswer, fibAnswers, teacherNotes, tags, estimatedGrade, timeEstimate,
    sourceMapping, parts, categories, categorizationItems,
    layoutMode, interaction, targets, backgroundImage, canvas, behavior, sourceTray,
    cardStyle, hideItemLabels
  ]);

  const handleLoadDraft = () => {
    const savedDraft = localStorage.getItem('curriculum_authoring_draft');
    if (!savedDraft) return;
    
    try {
      const draft = JSON.parse(savedDraft);
      
      ignoreDirtyChange.current = true;
      setEditMode(draft.editMode);
      setEditId(draft.editId);
      setSubject(draft.subject || '');
      setTopic(draft.topic || '');
      setSkillId(draft.skillId || '');
      setDifficulty(draft.difficulty || 'beginner');
      setType(draft.type || 'mcq');
      setQuestionText(draft.questionText || '');
      setVoice(draft.voice || 'Puck');
      setExplanation(draft.explanation || '');
      setAudioUrl(draft.audioUrl || '');
      if (typeof draft.generateAudioCheckbox === 'boolean') {
        setGenerateAudioCheckbox(draft.generateAudioCheckbox ? 'all' : 'none');
      } else {
        setGenerateAudioCheckbox(draft.generateAudioCheckbox || 'all');
      }
      setReadable(draft.readable !== false);
      setReadOptions(draft.readOptions !== false);
      setOptions(draft.options || []);
      setCorrectAnswer(draft.correctAnswer || '');
      setFibAnswers(draft.fibAnswers || (draft.correctAnswer ? { ans: draft.correctAnswer } : {}));
      setTeacherNotes(draft.teacherNotes || '');
      setTags(draft.tags || '');
      setEstimatedGrade(draft.estimatedGrade || '');
      setTimeEstimate(draft.timeEstimate || '');
      setSourceMapping(draft.sourceMapping || '');
      
      setParts(draft.parts || [
        { type: 'text', content: draft.questionText || '' }
      ]);
      setCategories(draft.categories || [
        { id: 'cat_1', label: 'Category 1' },
        { id: 'cat_2', label: 'Category 2' }
      ]);
      const rawDraftItems = draft.categorizationItems || [
        { id: 'item_1', content: 'Item 1', categoryId: 'cat_1' },
        { id: 'item_2', content: 'Item 2', categoryId: 'cat_2' }
      ];
      setCategorizationItems(rawDraftItems.map(item => {
        let visualType = item.visualType || 'none';
        let svgVal = item.svg || '';
        let imageUrlVal = item.imageUrl || '';
        if (!item.visualType) {
          if (item.svg) {
            visualType = 'svg';
          } else if (item.imageUrl) {
            if (isInlineSvg(item.imageUrl)) {
              visualType = 'svg';
              svgVal = item.imageUrl;
              imageUrlVal = '';
            } else {
              visualType = 'imageUrl';
            }
          }
        }
        return {
          ...item,
          id: item.id,
          content: item.content || '',
          categoryId: item.categoryId || item.target || '',
          imageUrl: imageUrlVal,
          svg: svgVal,
          visualType,
          imageWidth: item.imageWidth || ''
        };
      }));

      setLayoutMode(draft.layoutMode || '');
      setInteraction(draft.interaction || '');
      setTargets(draft.targets || null);
      setBackgroundImage(draft.backgroundImage || '');
      setCanvas(draft.canvas || null);
      setBehavior(draft.behavior || null);
      setSourceTray(draft.sourceTray || null);
      setCardStyle(draft.cardStyle || '');
      setHideItemLabels(Boolean(draft.hideItemLabels));
      
      setIsDirty(true);
      setAutosaveStatus('● Draft restored');
      setShowRecoveryBanner(false);
      setAlert({ type: 'success', text: 'Unsaved draft restored successfully.' });
    } catch (e) {
      setAlert({ type: 'error', text: 'Failed to restore draft: corrupted data.' });
    }
  };

  const handleDismissDraft = () => {
    localStorage.removeItem('curriculum_authoring_draft');
    setShowRecoveryBanner(false);
    setRecoveryTimestamp(null);
  };

  const buildQuestionPayload = (isArchived = false) => {
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const parsedTimeLimit = parseInt(timeEstimate, 10) || 0;

    const payload = {
      subject: subject.trim(),
      topic: topic.trim(),
      skillId: skillId.trim(),
      difficulty,
      type,
      questionText: questionText.trim(),
      voice,
      generateAudio: generateAudioCheckbox,
      explanation: explanation.trim(),
      audioUrl: audioUrl || null,
      teacherNotes: teacherNotes.trim(),
      tags: parsedTags,
      estimatedGrade: estimatedGrade.trim(),
      timeEstimate: parsedTimeLimit,
      sourceMapping: sourceMapping.trim(),
      metaConfig: {
        readable,
        readOptions
      },
      metadata: {
        subject: subject.trim(),
        topic: topic.trim(),
        skillId: skillId.trim(),
        difficulty,
        explanation: explanation.trim(),
        teacherNotes: teacherNotes.trim(),
        tags: parsedTags,
        estimatedGrade: estimatedGrade.trim(),
        timeEstimate: parsedTimeLimit,
        sourceMapping: sourceMapping.trim(),
      }
    };

    if (isArchived) {
      payload.archived = true;
      payload.metadata.archived = true;
    }

    if (editMode && editId) {
      payload.id = editId;
    }

    if (explanation.trim()) {
      payload.solution = {
        sections: explanation.trim().split('\n').map(line => ({
          type: 'text',
          content: line
        }))
      };
    } else {
      payload.solution = { sections: [] };
    }

    if (type === 'mcq_hotspot') {
      payload.type = 'mcq';
      payload.interaction = isHotspotMultiSelect ? 'hotspot_multi_select' : 'hotspot_select';
      
      const canvasW = canvas?.width || 800;
      const canvasH = canvas?.height || 465;
      
      const serializedHotspots = hotspots.map((hs, idx) => ({
        optionIndex: idx,
        x: Math.round((hs.x / 100) * canvasW),
        y: Math.round((hs.y / 100) * canvasH),
        width: Math.round((hs.width / 100) * canvasW),
        height: Math.round((hs.height / 100) * canvasH),
        label: hs.label,
        isCircle: hs.isCircle,
        imageUrl: hs.imageUrl || undefined,
        id: hs.id || undefined
      }));
      
      payload.options = hotspots.map((hs, idx) => ({
        id: `opt_${idx}`,
        label: hs.label.trim(),
      }));
      
      const correctIdx = hotspots.findIndex(hs => hs.isCorrect);
      payload.correctAnswerIndex = correctIdx;
      payload.answer = correctIdx;
      
      payload.hotspots = hotspots;
      payload.metadata.hotspots = hotspots;
      payload.metadata.layoutMode = 'mcq_hotspot';
      payload.layoutMode = 'mcq_hotspot';
      
      const hotspotPart = {
        type: 'hotspot_canvas',
        canvasWidth: canvasW,
        canvasHeight: canvasH,
        hotspots: serializedHotspots,
        showHotspotLabels: showHotspotLabels
      };
      if (backgroundImage) hotspotPart.backgroundUrl = backgroundImage;
      if (backgroundSvg) hotspotPart.backgroundSvg = backgroundSvg;
      
      payload.parts = [...parts.map(p => ({ ...p })), hotspotPart];
    } else if (type === 'mcq') {
      payload.options = options.map((opt, idx) => ({
        id: `opt_${idx}`,
        label: opt.label.trim(),
      }));
      const correctIdx = options.findIndex(opt => opt.isCorrect);
      payload.correctAnswerIndex = correctIdx;
      payload.answer = correctIdx;
      payload.parts = parts.map(p => ({ ...p }));
    } else if (type === 'categorizationv2' || type === 'categorization') {
      payload.options = [];
      const itemMapping = {};
      categorizationItems.forEach(item => {
        itemMapping[item.id] = item.categoryId || item.target || '';
      });
      payload.answer = itemMapping;
      payload.correctAnswer = itemMapping;

      payload.categories = categories.map(cat => ({ ...cat, id: cat.id, label: cat.label }));
      payload.items = categorizationItems.map(item => {
        const mapped = {
          ...item,
          id: item.id,
          content: item.content,
          target: item.categoryId || item.target || '',
          categoryId: item.categoryId || item.target || '',
        };
        delete mapped.imageUrl;
        delete mapped.svg;
        delete mapped.visualType;

        if (item.imageWidth) {
          mapped.imageWidth = item.imageWidth;
        }

        if (item.visualType === 'svg') {
          if (item.svg) mapped.svg = item.svg;
        } else if (item.visualType === 'imageUrl') {
          if (item.imageUrl) mapped.imageUrl = item.imageUrl;
        } else if (item.visualType === 'none') {
          // none
        } else {
          if (item.svg) {
            mapped.svg = item.svg;
          } else if (item.imageUrl) {
            if (isInlineSvg(item.imageUrl)) {
              mapped.svg = item.imageUrl;
            } else {
              mapped.imageUrl = item.imageUrl;
            }
          }
        }
        return mapped;
      });

      const categorizationPart = {
        type: 'categorization',
        categories: payload.categories,
        items: payload.items
      };
      payload.parts = [...parts.map(p => ({ ...p })), categorizationPart];
    } else if (type === 'fillInTheBlank') {
      payload.options = [];
      const blankIds = extractBlankIds(parts, questionText);
      if (blankIds.length > 1) {
        const ansObj = {};
        blankIds.forEach(id => {
          ansObj[id] = fibAnswers[id] || '';
        });
        payload.answer = ansObj;
        payload.correctAnswer = ansObj;
      } else {
        const singleValue = blankIds.length === 1 ? (fibAnswers[blankIds[0]] || correctAnswer) : correctAnswer;
        payload.answer = singleValue.trim();
        payload.correctAnswer = singleValue.trim();
      }
      payload.parts = parts.map(p => ({ ...p }));
    } else {
      payload.options = [];
      payload.answer = correctAnswer.trim();
      payload.correctAnswer = correctAnswer.trim();
      payload.parts = parts.map(p => ({ ...p }));
    }

    // Append Universal DnD fields if present
    if (layoutMode) {
      payload.layoutMode = layoutMode;
      payload.metadata.layoutMode = layoutMode;
    }
    if (interaction) {
      payload.interaction = interaction;
      payload.metadata.interaction = interaction;
    }
    if (targets !== null) {
      payload.targets = targets;
      payload.metadata.targets = targets;
    }
    if (backgroundImage) {
      payload.backgroundImage = backgroundImage;
      payload.metadata.backgroundImage = backgroundImage;
    }
    if (canvas !== null) {
      payload.canvas = canvas;
      payload.metadata.canvas = canvas;
    }
    if (behavior !== null) {
      payload.behavior = behavior;
      payload.metadata.behavior = behavior;
    }
    if (sourceTray !== null) {
      payload.sourceTray = sourceTray;
      payload.metadata.sourceTray = sourceTray;
    }

    // Append card style and hide label flags
    if (cardStyle) {
      payload.cardStyle = cardStyle;
      payload.metadata.cardStyle = cardStyle;
      if (payload.behavior) {
        payload.behavior.cardStyle = cardStyle;
      }
    }
    if (hideItemLabels) {
      payload.hideItemLabels = hideItemLabels;
      payload.metadata.hideItemLabels = hideItemLabels;
      if (payload.behavior) {
        payload.behavior.hideItemLabels = hideItemLabels;
      }
    }
    if (showHotspotLabels) {
      payload.showHotspotLabels = showHotspotLabels;
      payload.metadata.showHotspotLabels = showHotspotLabels;
      if (payload.behavior) {
        payload.behavior.showHotspotLabels = showHotspotLabels;
      }
    }

    return payload;
  };

  // --- ACTIONS: ARCHIVE QUESTION ---
  const handleArchiveQuestion = async () => {
    if (!editId) {
      setAlert({ type: 'error', text: 'You can only archive an existing published question.' });
      return;
    }
    if (!window.confirm('Are you sure you want to archive this question? This will mark it as archived in the database.')) {
      return;
    }
    
    setSavingQuestion(true);
    try {
      const payload = buildQuestionPayload(true);
      
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: payload,
          mode: 'upsert'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', text: `Question "${editId}" successfully archived.` });
        logActivity(`Archived question "${editId}"`, 'warning');
        handleResetForm();
        fetchStats();
      } else {
        throw new Error(data.error || 'Server rejected archive request');
      }
    } catch (err) {
      setAlert({ type: 'error', text: `Failed to archive question: ${err.message}` });
    } finally {
      setSavingQuestion(false);
    }
  };

  // --- VALIDATION AND SAVE ---
  const handleSaveQuestion = async () => {
    if (!subject.trim()) {
      setAlert({ type: 'error', text: 'Validation Error: Subject field is required.' });
      return;
    }
    if (!topic.trim()) {
      setAlert({ type: 'error', text: 'Validation Error: Topic field is required.' });
      return;
    }
    if (!skillId.trim()) {
      setAlert({ type: 'error', text: 'Validation Error: Skill ID field is required.' });
      return;
    }
    if (!questionText.trim()) {
      setAlert({ type: 'error', text: 'Validation Error: Question Text is required.' });
      return;
    }

    if (type === 'mcq') {
      if (options.length < 2) {
        setAlert({ type: 'error', text: 'Validation Error: MCQ questions must have at least 2 options.' });
        return;
      }
      const hasEmptyLabel = options.some(opt => !opt.label.trim());
      if (hasEmptyLabel) {
        setAlert({ type: 'error', text: 'Validation Error: All MCQ option labels must be filled out.' });
        return;
      }
      const correctIndex = options.findIndex(opt => opt.isCorrect);
      if (correctIndex === -1) {
        setAlert({ type: 'error', text: 'Validation Error: Please select one option as the Correct Answer.' });
        return;
      }
    } else if (type === 'mcq_hotspot') {
      if (hotspots.length < 2) {
        setAlert({ type: 'error', text: 'Validation Error: Hotspot MCQ must have at least 2 hotspots.' });
        return;
      }
      const hasEmptyLabel = hotspots.some(hs => !hs.label.trim());
      if (hasEmptyLabel) {
        setAlert({ type: 'error', text: 'Validation Error: All hotspots must have label/option text.' });
        return;
      }
      if (!backgroundImage.trim() && !backgroundSvg.trim()) {
        setAlert({ type: 'error', text: 'Validation Error: Either Background Image URL or Background SVG Code must be provided.' });
        return;
      }
      if (isHotspotMultiSelect) {
        const correctCount = hotspots.filter(hs => hs.isCorrect).length;
        if (correctCount === 0) {
          setAlert({ type: 'error', text: 'Validation Error: Please select at least one hotspot as the Correct Answer.' });
          return;
        }
      } else {
        const correctIndex = hotspots.findIndex(hs => hs.isCorrect);
        if (correctIndex === -1) {
          setAlert({ type: 'error', text: 'Validation Error: Please select one hotspot as the Correct Answer.' });
          return;
        }
      }
    } else if (type === 'categorizationv2' || type === 'categorization') {
      if (categories.length < 1) {
        setAlert({ type: 'error', text: 'Validation Error: Categorization questions must have at least 1 category.' });
        return;
      }
      const hasEmptyLabel = categories.some(cat => !cat.label.trim());
      if (hasEmptyLabel) {
        setAlert({ type: 'error', text: 'Validation Error: All category labels must be filled out.' });
        return;
      }
      if (categorizationItems.length === 0) {
        setAlert({ type: 'error', text: 'Validation Error: Please add at least one item to sort.' });
        return;
      }
      // Each item must have either content text OR an imageUrl OR an svg
      const hasInvalidItem = categorizationItems.some(item => !item.content.trim() && !item.imageUrl?.trim() && !item.svg?.trim());
      if (hasInvalidItem) {
        setAlert({ type: 'error', text: 'Validation Error: Each sort item must have either a label, an image URL, or SVG code.' });
        return;
      }
    } else if (type === 'fillInTheBlank') {
      const blankIds = extractBlankIds(parts, questionText);
      if (blankIds.length > 1) {
        const missingBlank = blankIds.find(id => !(fibAnswers[id] && fibAnswers[id].trim()));
        if (missingBlank) {
          setAlert({ type: 'error', text: `Validation Error: Correct value for blank "${missingBlank}" is required.` });
          return;
        }
      } else {
        if (!correctAnswer.trim()) {
          setAlert({ type: 'error', text: 'Validation Error: Correct Answer field is required for Fill-In-The-Blank.' });
          return;
        }
      }
    } else {
      if (!correctAnswer.trim()) {
        setAlert({ type: 'error', text: 'Validation Error: Correct Answer field is required.' });
        return;
      }
    }

    const payload = buildQuestionPayload(false);

    setSavingQuestion(true);
    setAlert({ type: 'info', text: 'Saving question document and uploading TTS audio streams...' });

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: payload,
          mode: editMode ? 'upsert' : 'insert'
        })
      });

      const data = await response.json();

      if (data.success) {
        const savedQ = data.result?.question || payload;
        
        let msg = `Question saved successfully with ID: ${savedQ.id}.`;
        if (savedQ.audioUrl) {
          msg += ` Audio successfully generated and stored in R2.`;
          setAudioUrl(savedQ.audioUrl);
        } else if (generateAudioCheckbox !== 'none') {
          msg += ` WARNING: Saved question without audio. R2 Credentials are likely not configured on this server.`;
        }

        setAlert({ type: 'success', text: msg });
        logActivity(`${editMode ? 'Updated' : 'Created'} question "${savedQ.id}"`, 'success');
        
        if (!editMode) {
          setEditMode(true);
          setEditId(savedQ.id);
        }

        setIsDirty(false);
        setAutosaveStatus('● Saved');
        localStorage.removeItem('curriculum_authoring_draft');

        fetchStats();
      } else {
        throw new Error(data.error || 'Server rejected question save request');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Failed to save question: ${err.message}` });
    } finally {
      setSavingQuestion(false);
    }
  };


  // --- ON-DEMAND AUDIO GENERATION FOR FORM ---
  const handleGenerateSingleAudio = async () => {
    if (!questionText.trim()) {
      setAlert({ type: 'error', text: 'Enter question text first to generate TTS audio!' });
      return;
    }

    setGeneratingSingleAudio(true);
    setAlert({ type: 'info', text: 'Contacting Gemini TTS and uploading audio to Cloudflare R2...' });

    try {
      const response = await fetch('/api/admin/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: questionText.trim(),
          voice
        })
      });

      const data = await response.json();
      if (data.success) {
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
          setAlert({ type: 'success', text: 'TTS generated and cached in Cloudflare R2! Play preview to listen.' });
          logActivity(`Generated audio stream for question text preview`, 'success');
        } else {
          throw new Error('No URL returned. R2 variables are likely not configured.');
        }
      } else {
        throw new Error(data.error || 'TTS generation failed');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Audio generation failed: ${err.message}` });
    } finally {
      setGeneratingSingleAudio(false);
    }
  };

  // --- PREVIEW RENDER UTILS ---
  const handleTestPreviewSpeak = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakText(questionText, voice));
    } else {
      speakText(questionText, voice);
    }
  };

  const authoringMockQuestion = useMemo(() => {
    const stateHash = [
      type,
      questionText,
      JSON.stringify(parts),
      JSON.stringify(categories),
      JSON.stringify(categorizationItems),
      JSON.stringify(options),
      correctAnswer,
      JSON.stringify(fibAnswers),
      voice,
      audioUrl,
      readable,
      readOptions,
      layoutMode,
      interaction,
      JSON.stringify(targets),
      backgroundImage,
      JSON.stringify(canvas),
      JSON.stringify(behavior),
      JSON.stringify(sourceTray),
      cardStyle,
      hideItemLabels,
      JSON.stringify(hotspots),
      backgroundSvg
    ].join('|');
    
    const uniqueId = `mock_q_${hashCode(stateHash)}`;
    const baseParts = parts.map(p => ({ ...p }));
    let mockParts = baseParts;

    const serializedItems = (type === 'categorizationv2' || type === 'categorization') ? categorizationItems.map(item => {
      const mapped = {
        ...item,
        id: item.id,
        content: item.content,
        target: item.categoryId || item.target || '',
        categoryId: item.categoryId || item.target || '',
      };
      delete mapped.imageUrl;
      delete mapped.svg;
      delete mapped.visualType;

      if (item.imageWidth) {
        mapped.imageWidth = item.imageWidth;
      }

      if (item.visualType === 'svg') {
        if (item.svg) mapped.svg = item.svg;
      } else if (item.visualType === 'imageUrl') {
        if (item.imageUrl) mapped.imageUrl = item.imageUrl;
      } else if (item.visualType === 'none') {
        // none
      } else {
        if (item.svg) {
          mapped.svg = item.svg;
        } else if (item.imageUrl) {
          if (isInlineSvg(item.imageUrl)) {
            mapped.svg = item.imageUrl;
          } else {
            mapped.imageUrl = item.imageUrl;
          }
        }
      }
      return mapped;
    }) : [];

    if (type === 'categorizationv2' || type === 'categorization') {
      mockParts = [
        ...baseParts,
        {
          type: 'categorization',
          categories: categories.map(c => ({ ...c, id: c.id, label: c.label })),
          items: serializedItems
        }
      ];
    }
    
    if (type === 'mcq_hotspot') {
      const canvasW = canvas?.width || 800;
      const canvasH = canvas?.height || 465;
      
      const serializedHotspots = hotspots.map((hs, idx) => ({
        optionIndex: idx,
        x: Math.round((hs.x / 100) * canvasW),
        y: Math.round((hs.y / 100) * canvasH),
        width: Math.round((hs.width / 100) * canvasW),
        height: Math.round((hs.height / 100) * canvasH),
        label: hs.label,
        isCircle: hs.isCircle,
        imageUrl: hs.imageUrl || undefined,
        id: hs.id || undefined
      }));

      const mockPartsHotspot = [
        ...baseParts,
        {
          type: 'hotspot_canvas',
          backgroundUrl: backgroundImage || undefined,
          backgroundSvg: backgroundSvg || undefined,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          hotspots: serializedHotspots
        }
      ];

      return {
        id: uniqueId,
        type: 'mcq',
        interaction: 'hotspot_select',
        questionText: questionText.trim(),
        parts: mockPartsHotspot,
        audioUrl,
        voice,
        options: hotspots.map((hs, idx) => ({ id: `opt_${idx}`, label: hs.label })),
        answer: hotspots.findIndex(hs => hs.isCorrect),
        correctAnswerIndex: hotspots.findIndex(hs => hs.isCorrect),
        solution: {
          sections: explanation.trim() ? explanation.trim().split('\n').map(line => ({ type: 'text', content: line })) : []
        },
        metaConfig: { readable, readOptions }
      };
    }

    return {
      id: uniqueId,
      type,
      questionText: questionText.trim(),
      parts: mockParts,
      audioUrl,
      voice,
      options: type === 'mcq' ? options.map((o, idx) => ({ id: `opt_${idx}`, label: o.label, audioUrl: audioUrl ? null : undefined })) : [],
      categories: (type === 'categorizationv2' || type === 'categorization') ? categories.map(c => ({ ...c, id: c.id, label: c.label })) : undefined,
      items: (type === 'categorizationv2' || type === 'categorization') ? serializedItems : undefined,
      answer: type === 'mcq' ? options.findIndex(o => o.isCorrect) : ((type === 'categorizationv2' || type === 'categorization') ? categorizationItems.reduce((acc, item) => { acc[item.id] = item.categoryId || item.target || ''; return acc; }, {}) : (extractBlankIds(parts, questionText).length > 1 ? fibAnswers : correctAnswer)),
      correctAnswer: type === 'mcq' ? undefined : ((type === 'categorizationv2' || type === 'categorization') ? categorizationItems.reduce((acc, item) => { acc[item.id] = item.categoryId || item.target || ''; return acc; }, {}) : (extractBlankIds(parts, questionText).length > 1 ? fibAnswers : correctAnswer)),
      metaConfig: { readable, readOptions },
      // Universal DnD fields
      layoutMode: layoutMode || undefined,
      interaction: interaction || undefined,
      targets: targets || undefined,
      backgroundImage: backgroundImage || undefined,
      canvas: canvas || undefined,
      behavior: behavior || undefined,
      sourceTray: sourceTray || undefined,
      cardStyle: cardStyle || undefined,
      hideItemLabels: hideItemLabels || undefined
    };
  }, [
    type,
    questionText,
    parts,
    categories,
    categorizationItems,
    options,
    correctAnswer,
    fibAnswers,
    voice,
    audioUrl,
    readable,
    readOptions,
    layoutMode,
    interaction,
    targets,
    backgroundImage,
    canvas,
    behavior,
    sourceTray,
    cardStyle,
    hideItemLabels,
    hotspots,
    backgroundSvg
  ]);

  const handleCheckAnswer = () => {
    if (previewAnswer === null || previewAnswer === undefined) {
      return;
    }
    
    const isCorrect = isAnswerCorrect(authoringMockQuestion, previewAnswer);
    setPreviewCheckResult(isCorrect ? 'correct' : 'incorrect');
  };

  // Audio coverage percent
  const coveragePercent = stats.totalQuestions > 0 
    ? Math.round((stats.questionsWithAudio / stats.totalQuestions) * 100)
    : 0;

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <div className={styles.headerInfo}>
          <h1>Curriculum Operations</h1>
          <p>Educational content library, speech synthesis pipeline, and storage configurations.</p>
        </div>
        
        <div className={styles.headerStatus}>
          <div className={styles.compactStatusBadge} title="MongoDB Status">
            <span className={`${styles.statusIndicatorDot} ${stats.dbConnected ? styles.dotGreen : styles.dotRed}`} />
            <span>DB: {stats.dbConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <div className={styles.compactStatusBadge} title="Cloudflare R2 Synced Status">
            <span className={`${styles.statusIndicatorDot} ${stats.r2Configured ? styles.dotGreen : styles.dotRed}`} />
            <span>R2 Storage: {stats.r2Configured ? 'READY' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Dynamic Alerts Banner */}
      {alert && (
        <div className={`${styles.alertBox} ${
          alert.type === 'success' ? styles.alertSuccess : 
          alert.type === 'error' ? styles.alertError : styles.alertInfo
        }`}>
          <span>{alert.text}</span>
          <button className={styles.alertClose} onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* Tabs Row */}
      <nav className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.tabButtonActive : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          OPERATIONAL OVERVIEW
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'library' ? styles.tabButtonActive : ''}`}
          onClick={() => handleTabChange('library')}
        >
          QUESTIONS LIBRARY
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'authoring' ? styles.tabButtonActive : ''}`}
          onClick={() => handleTabChange('authoring')}
        >
          AUTHORING CENTER {editMode ? ' [EDIT MODE]' : ' [CREATE MODE]'}
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'cache' ? styles.tabButtonActive : ''}`}
          onClick={() => handleTabChange('cache')}
        >
          TTS CACHE MANAGER
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'curriculum' ? styles.tabButtonActive : ''}`}
          onClick={() => handleTabChange('curriculum')}
        >
          CURRICULUM BUILDER
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'images' ? styles.tabButtonActive : ''}`}
          onClick={() => handleTabChange('images')}
        >
          🖼 IMAGE ASSETS
        </button>
      </nav>

      {/* Active Tab View */}
      <main className={styles.consoleContent}>
        
        {/* --- VIEW 1: OPERATIONAL OVERVIEW --- */}
        {activeTab === 'dashboard' && (
          <div className={styles.dashboardLayout}>
            
            {/* Left Side: Stats and Charts */}
            <div className={styles.dashboardMain}>

              {/* Student Analytics Filter */}
              <div className={styles.borderedPanel} style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--color-text)' }}>👤 Student Practice Insights</h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Filter dashboard data and logs by active student profiles.</p>
                </div>
                <div>
                  <select
                    value={selectedStudent}
                    onChange={(event) => setSelectedStudent(event.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--color-border)',
                      background: '#ffffff',
                      color: 'var(--color-text)',
                      fontWeight: 800,
                      fontSize: 12,
                      minWidth: 180,
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <option value="all">👥 All Students (Aggregated)</option>
                    {stats.students && stats.students.map((student) => (
                      <option key={student} value={student}>👤 {student}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Primary Stats Group */}
              <div className={styles.metricsGroup}>
                <h3 className={styles.metricsSectionTitle}>Core Assets</h3>
                <div className={styles.primaryStatsGrid}>
                  
                  <div className={styles.primaryCard}>
                    <span className={styles.statsLabel}>Total Questions</span>
                    <span className={styles.primaryValue}>{loadingStats ? '...' : stats.totalQuestions}</span>
                  </div>

                  <div className={styles.primaryCard}>
                    <span className={styles.statsLabel}>Synced Audio Files</span>
                    <span className={styles.primaryValue}>{loadingStats ? '...' : stats.questionsWithAudio}</span>
                  </div>

                  <div className={styles.primaryCard}>
                    <span className={styles.statsLabel}>Missing Audio URL</span>
                    <span className={styles.primaryValue} style={{ color: stats.missingAudio > 0 ? 'var(--color-danger)' : 'inherit' }}>
                      {loadingStats ? '...' : stats.missingAudio}
                    </span>
                  </div>

                  <div className={styles.primaryCard}>
                    <span className={styles.statsLabel}>TTS Cache Items</span>
                    <span className={styles.primaryValue}>{loadingStats ? '...' : stats.ttsCacheItems}</span>
                  </div>

                </div>
              </div>

              {/* Secondary Stats Group */}
              <div className={styles.metricsGroup}>
                <h3 className={styles.metricsSectionTitle}>Structure Distributions</h3>
                <div className={styles.secondaryStatsGrid}>
                  
                  <div className={styles.secondaryCard}>
                    <span className={styles.statsLabel}>Multiple Choice (MCQ)</span>
                    <span className={styles.secondaryValue}>{loadingStats ? '...' : stats.mcqQuestions}</span>
                  </div>

                  <div className={styles.secondaryCard}>
                    <span className={styles.statsLabel}>Fill-in-the-Blank</span>
                    <span className={styles.secondaryValue}>{loadingStats ? '...' : stats.fibQuestions}</span>
                  </div>

                  <div className={styles.secondaryCard}>
                    <span className={styles.statsLabel}>Unique Subjects</span>
                    <span className={styles.secondaryValue}>{loadingStats ? '...' : stats.subjects.length}</span>
                  </div>

                  <div className={styles.secondaryCard}>
                    <span className={styles.statsLabel}>Unique Skills / Topics</span>
                    <span className={styles.secondaryValue}>{loadingStats ? '...' : stats.topics.length}</span>
                  </div>

                </div>
              </div>

              {/* Visualizations Card */}
              <div className={styles.borderedPanel}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle}>Operations Analytics</h4>
                </div>
                
                <div className={styles.chartsGrid}>
                  
                  {/* Gauge 1: Audio coverage */}
                  <div className={styles.chartContainer}>
                    <h5 className={styles.chartSubtitle}>TTS Synchronization Coverage</h5>
                    <div className={styles.svgProgressContainer}>
                      <svg width="76" height="76" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Background ring */}
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--bg-tertiary)"
                          strokeWidth="4"
                        />
                        {/* Coverage circle */}
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--color-border)"
                          strokeWidth="4"
                          strokeDasharray={`${coveragePercent}, 100`}
                          strokeLinecap="square"
                        />
                      </svg>
                      <div className={styles.progressDetail}>
                        <span className={styles.progressPercentText}>{loadingStats ? '...' : `${coveragePercent}%`}</span>
                        <span className={styles.progressSubText}>With baked R2 Audio</span>
                      </div>
                    </div>
                  </div>

                  {/* Gauge 2: Subject weights */}
                  <div className={styles.chartContainer}>
                    <h5 className={styles.chartSubtitle}>Subjects Density Distribution</h5>
                    <div className={styles.barList}>
                      {loadingStats ? (
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Loading metrics...</span>
                      ) : stats.subjects.length === 0 ? (
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No database records.</span>
                      ) : (
                        stats.subjects.map((subj, idx) => {
                          const mockPercentages = [65, 35, 20, 10];
                          const percent = mockPercentages[idx % mockPercentages.length];
                          return (
                            <div key={subj} className={styles.barRow}>
                              <div className={styles.barInfo}>
                                <span>{subj}</span>
                                <span>{percent}%</span>
                              </div>
                              <div className={styles.barTrack}>
                                <div className={styles.barFill} style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Student Learning Insights & Analytics Charts */}
              <div className={styles.borderedPanel} style={{ marginTop: '1.5rem' }}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle}>Student Learning Insights</h4>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', padding: '20px 16px' }}>
                  {/* Donut Chart: Topic Distribution */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h5 style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 800 }}>Topic Practice Distribution</h5>
                    {loadingStats ? (
                      <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12, padding: '36px 0', textAlign: 'center' }}>Loading distribution...</div>
                    ) : !stats.topicBreakdown || stats.topicBreakdown.length === 0 ? (
                      <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12, padding: '36px 0', textAlign: 'center' }}>No practice data recorded for this student.</div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                          <svg width="110" height="110" viewBox="0 0 42 42">
                            <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
                            {(() => {
                              const totalTopicAttempts = stats.topicBreakdown.reduce((sum, item) => sum + item.count, 0);
                              const topicColors = {
                                addition: '#ff951f',
                                subtraction: '#ef6c35',
                                multiplication: '#f59e0b',
                                division: '#7a56d6',
                                time: '#2fbfd0',
                                fractions: '#8b5cf6',
                                shapes: '#ec4899',
                                'data-graphs': '#2563eb'
                              };
                              let cumulativePercent = 0;
                              return stats.topicBreakdown.map((item, idx) => {
                                const percent = totalTopicAttempts > 0 ? (item.count / totalTopicAttempts) * 100 : 0;
                                const strokeDash = `${percent} 100`;
                                const strokeOffset = 100 - cumulativePercent + 25; // start at 12 o'clock
                                cumulativePercent += percent;
                                const color = topicColors[item.topic.toLowerCase()] || `hsl(${idx * 75 % 360}, 70%, 55%)`;
                                return (
                                  <circle
                                    key={item.topic}
                                    cx="21"
                                    cy="21"
                                    r="15.9155"
                                    fill="transparent"
                                    stroke={color}
                                    strokeWidth="4.5"
                                    strokeDasharray={strokeDash}
                                    strokeDashoffset={strokeOffset}
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                              {stats.topicBreakdown.reduce((sum, item) => sum + item.count, 0)}
                            </div>
                            <div style={{ fontSize: 8, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Attempts</div>
                          </div>
                        </div>

                        {/* Legend list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
                          {stats.topicBreakdown.map((item, idx) => {
                            const totalTopicAttempts = stats.topicBreakdown.reduce((sum, item) => sum + item.count, 0);
                            const percent = totalTopicAttempts > 0 ? Math.round((item.count / totalTopicAttempts) * 100) : 0;
                            const topicColors = {
                              addition: '#ff951f',
                              subtraction: '#ef6c35',
                              multiplication: '#f59e0b',
                              division: '#7a56d6',
                              time: '#2fbfd0',
                              fractions: '#8b5cf6',
                              shapes: '#ec4899',
                              'data-graphs': '#2563eb'
                            };
                            const color = topicColors[item.topic.toLowerCase()] || `hsl(${idx * 75 % 360}, 70%, 55%)`;
                            return (
                              <div key={item.topic} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                                <span style={{ textTransform: 'capitalize', fontWeight: 700, color: 'var(--color-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic}</span>
                                <span style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>{percent}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Friction Points list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h5 style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 800 }}>Friction Points (Struggling Skills)</h5>
                    {loadingStats ? (
                      <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12, padding: '36px 0', textAlign: 'center' }}>Loading friction points...</div>
                    ) : !stats.frictionPoints || stats.frictionPoints.length === 0 ? (
                      <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12, padding: '36px 0', textAlign: 'center' }}>No struggling skills identified yet. Good job!</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {stats.frictionPoints.map((fp) => {
                          const getAccuracyColor = (acc) => {
                            if (acc < 50) return '#dc2626';
                            if (acc < 80) return '#d97706';
                            return '#16a34a';
                          };
                          return (
                            <div key={fp.skillId} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-text)', wordBreak: 'break-all' }}>{fp.skillId}</span>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: 9, textTransform: 'uppercase', fontWeight: 800, marginLeft: 6, flexShrink: 0 }}>{fp.topic}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 99 }}>
                                  <div style={{ width: `${fp.accuracy}%`, height: '100%', background: getAccuracyColor(fp.accuracy), borderRadius: 99 }} />
                                </div>
                                <span style={{ minWidth: 28, textAlign: 'right', fontWeight: 900, fontSize: 11, color: getAccuracyColor(fp.accuracy) }}>
                                  {fp.accuracy}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                <span>Attempts: {fp.total} ({fp.correct} correct)</span>
                                <span>Avg time: {fp.avgTimeSpent ? `${fp.avgTimeSpent}s` : 'N/A'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Practice Analytics Panel */}
              <div className={styles.borderedPanel} style={{ marginTop: '1.5rem' }}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle}>Student Practice Attempts (Live)</h4>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                    Accuracy: {stats.totalAttempts > 0 ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100) : 0}% ({stats.correctAttempts}/{stats.totalAttempts} correct)
                  </div>
                </div>
                
                <div style={{ padding: '12px', overflowX: 'auto' }}>
                  {stats.recentAttempts.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                      No student practice attempts recorded yet. Start practicing to see live logs!
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 500 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                          <th style={{ padding: '8px 4px' }}>Time</th>
                          <th style={{ padding: '8px 4px' }}>Student</th>
                          <th style={{ padding: '8px 4px' }}>Skill ID</th>
                          <th style={{ padding: '8px 4px' }}>Topic</th>
                          <th style={{ padding: '8px 4px' }}>Engine / Source</th>
                          <th style={{ padding: '8px 4px' }}>Result</th>
                          <th style={{ padding: '8px 4px' }}>Time Spent</th>
                          <th style={{ padding: '8px 4px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentAttempts.map((attempt) => {
                          const dateText = new Date(attempt.loggedAt || attempt.createdAt).toLocaleTimeString();
                          return (
                            <tr key={attempt._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 4px', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{dateText}</td>
                              <td style={{ padding: '8px 4px', fontWeight: '800', color: '#4f46e5' }}>{attempt.userId || 'Guest'}</td>
                              <td style={{ padding: '8px 4px', fontWeight: '600', color: 'var(--color-text)' }}>{attempt.skillId}</td>
                              <td style={{ padding: '8px 4px' }}>{attempt.topic}</td>
                              <td style={{ padding: '8px 4px', fontFamily: 'monospace', fontSize: 10, color: 'var(--color-text-muted)' }}>{attempt.engine || 'static (db)'}</td>
                              <td style={{ padding: '8px 4px' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  color: '#ffffff',
                                  backgroundColor: attempt.isCorrect ? '#16a34a' : '#dc2626'
                                }}>
                                  {attempt.isCorrect ? 'CORRECT' : 'INCORRECT'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 4px', color: 'var(--color-text-muted)' }}>
                                {attempt.timeSpentMs ? `${(attempt.timeSpentMs / 1000).toFixed(1)}s` : 'N/A'}
                              </td>
                              <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                                {(() => {
                                  const attemptSeed = attempt.question?.seed || attempt.question?.metadata?.seed || attempt.seed || attempt.variables?.seed || attempt.question?.variables?.seed;
                                  if (!attemptSeed) return <span style={{ color: '#9ca3af', fontSize: 11 }}>N/A</span>;
                                  return (
                                    <a
                                      href={`/practice?subject=math&topic=${attempt.topic}&skill=${attempt.skillId}&seed=${attemptSeed}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 'bold',
                                        color: '#2563eb',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        textDecoration: 'none',
                                      }}
                                      title="Open this exact question in a new tab to practice/test it again"
                                    >
                                      Test Again ↗
                                    </a>
                                  );
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            {/* Right Side: Quick actions and Activity logs */}
            <div className={styles.dashboardSidebar}>
              
              {/* Quick actions box */}
              <div className={styles.borderedPanel}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle}>Operations Panel</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button 
                    className={styles.btnSolid} 
                    onClick={handleBulkGenerateAudio} 
                    disabled={bulkGenerating || loadingStats || stats.missingAudio === 0}
                  >
                    {bulkGenerating ? 'Processing Queue...' : 'Generate Missing Audio'}
                  </button>
                  
                  <button 
                    className={styles.btnOutline} 
                    onClick={fetchStats} 
                    disabled={bulkGenerating || loadingStats}
                  >
                    Refresh Dashboard Stats
                  </button>
                  
                  <button 
                    className={styles.btnDanger} 
                    onClick={handleClearAllCache} 
                    disabled={bulkGenerating || stats.ttsCacheItems === 0}
                  >
                    Purge All Cache
                  </button>
                </div>
              </div>

              {/* Progress Queue visualization (only when active) */}
              {(bulkGenerating || bulkProcessed > 0) && (
                <div className={styles.queueStatusPanel}>
                  <h4 className={styles.queueTitle}>
                    <span className={styles.spinner} style={{ width: 12, height: 12 }} />
                    TTS Generation Queue
                  </h4>
                  <div className={styles.progressInfo}>
                    Synthesizing WAV files and uploading: <strong>{bulkProcessed}</strong> / <strong>{bulkTotal}</strong> completed.
                    <br />({bulkRemaining} remaining in queue)
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressBarFill} 
                      style={{ width: `${(bulkProcessed / Math.max(1, bulkTotal)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Recent Activity Log */}
              <div className={styles.borderedPanel}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle}>Activity Log</h4>
                  <button 
                    className={`${styles.btnOutline} ${styles.btnCompact}`}
                    onClick={() => {
                      const clearLog = [{ id: '1', action: 'Log cleared', type: 'system', timestamp: new Date().toLocaleTimeString() }];
                      setActivityLog(clearLog);
                      localStorage.setItem('curriculum_activity_log', JSON.stringify(clearLog));
                    }}
                  >
                    Clear Feed
                  </button>
                </div>
                
                <div className={styles.activityFeedList}>
                  {activityLog.length === 0 ? (
                    <div className={styles.emptyFeedText}>No recent console actions logged.</div>
                  ) : (
                    activityLog.map((log) => (
                      <div key={log.id} className={styles.activityItemCard}>
                        <span style={{ wordBreak: 'break-word' }}>{log.action}</span>
                        <div className={styles.activityMeta}>
                          <span style={{
                            color: log.type === 'success' ? 'var(--color-success)' :
                                   log.type === 'danger' ? 'var(--color-danger)' : 'inherit'
                          }}>{log.type}</span>
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- VIEW 2: QUESTIONS LIBRARY --- */}
        {activeTab === 'library' && (
          <>
            <div className={styles.stickyFiltersBar}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Search Phrase</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="Query question text..." 
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Subject</label>
                <select 
                  className={styles.formSelect} 
                  value={qSubject} 
                  onChange={(e) => setQSubject(e.target.value)}
                >
                  <option value="">All Subjects</option>
                  {stats.subjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Topic / Skill</label>
                <select 
                  className={styles.formSelect} 
                  value={qTopic} 
                  onChange={(e) => setQTopic(e.target.value)}
                >
                  <option value="">All Skills</option>
                  {stats.topics.map(top => (
                    <option key={top} value={top}>{top}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Format Type</label>
                <select 
                  className={styles.formSelect} 
                  value={qType} 
                  onChange={(e) => setQType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="fillInTheBlank">FIB</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Audio Status</label>
                <select 
                  className={styles.formSelect} 
                  value={qAudioStatus} 
                  onChange={(e) => setQAudioStatus(e.target.value)}
                >
                  <option value="all">All Records</option>
                  <option value="withAudio">With Audio</option>
                  <option value="missingAudio">Missing Audio</option>
                </select>
              </div>

              <div className={styles.filterGroup} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <label className={styles.filterLabel}>Visible Columns</label>
                <button 
                  className={styles.columnsDropdownBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColumnsDropdown(prev => !prev);
                  }}
                  type="button"
                >
                  <span>Columns</span>
                  <span style={{ fontSize: 10 }}>▾</span>
                </button>
                {showColumnsDropdown && (
                  <div className={styles.columnsDropdownPopup} onClick={(e) => e.stopPropagation()}>
                    {Object.keys({
                      id: 'ID',
                      subject: 'Subject',
                      topic: 'Topic',
                      type: 'Type',
                      questionText: 'Question Text',
                      audioStatus: 'Audio Status',
                      play: 'Play',
                      actions: 'Actions'
                    }).map((col) => (
                      <label key={col} className={styles.columnToggleItem}>
                        <input 
                          type="checkbox" 
                          checked={visibleColumns[col]} 
                          onChange={() => handleToggleColumn(col)} 
                        />
                        <span>
                          {{
                            id: 'ID',
                            subject: 'Subject',
                            topic: 'Topic',
                            type: 'Type',
                            questionText: 'Question Text',
                            audioStatus: 'Audio Status',
                            play: 'Play',
                            actions: 'Actions'
                          }[col]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loadingQuestions ? (
              <div className={styles.emptyState}>
                <span className={styles.spinner} style={{ marginRight: 10 }}></span>
                Loading curriculum question database...
              </div>
            ) : questions.length === 0 ? (
              <div className={styles.emptyState}>
                No questions match the active query filters. Select "Authoring Center" to publish one.
              </div>
            ) : (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        {visibleColumns.id && <th style={{ width: '5%' }}>ID</th>}
                        {visibleColumns.subject && <th style={{ width: '9%' }}>Subject</th>}
                        {visibleColumns.topic && <th style={{ width: '9%' }}>Topic</th>}
                        {visibleColumns.type && <th style={{ width: '7%' }}>Type</th>}
                        {visibleColumns.questionText && <th style={{ width: 'auto' }}>Question Text</th>}
                        {visibleColumns.audioStatus && <th style={{ width: '9%' }}>Audio Status</th>}
                        {visibleColumns.play && <th style={{ width: '5%', textAlign: 'center' }}>Play</th>}
                        {visibleColumns.actions && <th style={{ width: '11%' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q) => (
                        <tr key={q.id}>
                          {visibleColumns.id && (
                            <td className={styles.idCol}>
                              <code>{q.id}</code>
                            </td>
                          )}
                          {visibleColumns.subject && (
                            <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{q.subject}</td>
                          )}
                          {visibleColumns.topic && (
                            <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{q.topic}</td>
                          )}
                          {visibleColumns.type && (
                            <td>
                              <span style={{ fontSize: 11, fontWeight: 800 }}>
                                {q.type === 'mcq' ? 'MCQ' : 'FIB'}
                              </span>
                            </td>
                          )}
                          {visibleColumns.questionText && (
                            <td>
                              <div className={styles.truncatedText} title={q.questionText}>
                                {q.questionText}
                              </div>
                            </td>
                          )}
                          {visibleColumns.audioStatus && (
                            <td>
                              {q.audioUrl ? (
                                <span className={`${styles.badgeSolid} ${styles.badgeGreen}`}>Baked R2</span>
                              ) : (
                                <span className={`${styles.badgeSolid} ${styles.badgeRed}`}>Missing</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.play && (
                            <td style={{ textAlign: 'center' }}>
                              {q.audioUrl ? (
                                <button 
                                  className={`${styles.iconPlayBtn} ${playingAudioId === q.id ? styles.iconPlayActive : ''}`} 
                                  onClick={() => handlePlayUrlAudio(q.id, q.audioUrl)}
                                  title="Hear pre-baked R2 voice file"
                                >
                                  {playingAudioId === q.id ? '■' : '▶'}
                                </button>
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: 11 }}>N/A</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.actions && (
                            <td>
                              <div className={styles.actionIconGroup}>
                                <div className={styles.actionRowInline}>
                                  <button 
                                    className={`${styles.btnOutline} ${styles.btnCompact}`}
                                    onClick={() => handleLoadQuestionToForm(q, 'edit')}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className={`${styles.btnOutline} ${styles.btnCompact}`}
                                    onClick={() => handleLoadQuestionToForm(q, 'duplicate')}
                                  >
                                    Duplicate
                                  </button>
                                </div>
                                <button 
                                  className={`${styles.btnDanger} ${styles.btnCompact}`}
                                  onClick={() => handleDeleteQuestion(q.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginationRow}>
                  <span className={styles.paginationText}>
                    Showing {questions.length} of {qTotalCount} questions (Page {qPage} of {qTotalPages})
                  </span>
                  <div className={styles.paginationButtons}>
                    <button 
                      className={styles.btnOutline} 
                      onClick={() => setQPage(p => Math.max(1, p - 1))} 
                      disabled={qPage <= 1}
                    >
                      ◀ Prev
                    </button>
                    <button 
                      className={styles.btnOutline} 
                      onClick={() => setQPage(p => Math.min(qTotalPages, p + 1))} 
                      disabled={qPage >= qTotalPages}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* --- VIEW 3: AUTHORING CENTER --- */}
        {activeTab === 'authoring' && (
          <div className={styles.authoringWorkspaceContainer}>
            
            {/* Column 1: Templates Sidebar */}
            <aside className={styles.templatesSidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Templates</h3>
                <span className={styles.sidebarSubtext}>One-click Pre-fill</span>
              </div>
              <div className={styles.templateList}>
                {QUESTION_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.templateCard}
                    onClick={() => handleApplyTemplate(tpl)}
                  >
                    <div className={styles.templateCardName}>{tpl.name}</div>
                    <div className={styles.templateCardDesc}>{tpl.description}</div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Column 2: Main Workspace */}
            <div className={styles.authoringMainContent}>
              
              {/* Sticky Top Action Bar */}
              <div className={styles.stickyActionBar}>
                <div className={styles.actionBarLeft}>
                  <span className={styles.authoringStatusTitle}>
                    {editMode ? `Editing: ${editId}` : 'Creating New Question'}
                  </span>
                  {autosaveStatus && (
                    <span className={styles.autosaveBadge}>
                      {autosaveStatus}
                    </span>
                  )}
                </div>
                <div className={styles.actionBarRight}>
                  <button 
                    type="button"
                    className={styles.btnOutline} 
                    onClick={handleResetFormWithConfirm}
                  >
                    {editMode ? 'Cancel Edit' : 'Reset Form'}
                  </button>

                  {editMode && (
                    <button 
                      type="button"
                      className={styles.btnDanger} 
                      onClick={handleArchiveQuestion}
                      disabled={savingQuestion}
                    >
                      Archive
                    </button>
                  )}

                  <button 
                    type="button"
                    className={styles.btnOutline} 
                    onClick={() => {
                      // Manual Draft Save: trigger autosave format immediately
                      const draft = {
                        editMode,
                        editId,
                        subject,
                        topic,
                        skillId,
                        difficulty,
                        type,
                        questionText,
                        voice,
                        explanation,
                        audioUrl,
                        generateAudioCheckbox,
                        readable,
                        readOptions,
                        options,
                        correctAnswer,
                        fibAnswers,
                        teacherNotes,
                        tags,
                        estimatedGrade,
                        timeEstimate,
                        sourceMapping,
                        parts,
                        categories,
                        categorizationItems,
                        timestamp: Date.now()
                      };
                      localStorage.setItem('curriculum_authoring_draft', JSON.stringify(draft));
                      setAutosaveStatus(`● Draft saved manually`);
                      setAlert({ type: 'success', text: 'Draft saved successfully to local storage.' });
                    }}
                  >
                    Save Draft
                  </button>

                  <button 
                    type="button"
                    className={styles.btnSolid} 
                    onClick={handleSaveQuestion}
                    disabled={savingQuestion}
                  >
                    {savingQuestion ? 'Publishing...' : editMode ? 'Save Question' : 'Publish Question'}
                  </button>
                </div>
              </div>

              {/* Startup Recovery Banner */}
              {showRecoveryBanner && (
                <div className={styles.recoveryBanner}>
                  <span className={styles.recoveryText}>
                    An unsaved draft from {recoveryTimestamp} is available.
                  </span>
                  <div className={styles.recoveryButtons}>
                    <button 
                      type="button"
                      className={`${styles.btnSolid} ${styles.btnCompact}`} 
                      onClick={handleLoadDraft}
                    >
                      Load Draft
                    </button>
                    <button 
                      type="button"
                      className={`${styles.btnOutline} ${styles.btnCompact}`} 
                      onClick={handleDismissDraft}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Segmented Mode Selector */}
              <div className={styles.modeSegmentedSelector}>
                <button
                  type="button"
                  className={`${styles.selectorButton} ${authoringMode === 'manual' ? styles.selectorButtonActive : ''}`}
                  onClick={() => setAuthoringMode('manual')}
                >
                  Manual Builder
                </button>
                <button
                  type="button"
                  className={`${styles.selectorButton} ${authoringMode === 'paste' ? styles.selectorButtonActive : ''}`}
                  onClick={() => setAuthoringMode('paste')}
                >
                  Paste & Parse
                </button>
                <button
                  type="button"
                  className={`${styles.selectorButton} ${authoringMode === 'import' ? styles.selectorButtonActive : ''}`}
                  onClick={() => setAuthoringMode('import')}
                >
                  Import JSON
                </button>
              </div>

              {/* Workspace Forms depending on Mode */}
              <div className={styles.modeWorkspaceWrapper}>
                
                {/* MODE A: MANUAL BUILDER */}
                {authoringMode === 'manual' && (
                  <div className={styles.manualBuilderContainer}>
                    
                    {/* SECTION 1: QUESTION DETAILS */}
                    <div className={styles.accordionGroup}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setCollapsedSections(prev => ({ ...prev, details: !prev.details }))}
                      >
                        <span>1. Question Info & Details</span>
                        <span>{collapsedSections.details ? '▼' : '▲'}</span>
                      </button>
                      
                      {!collapsedSections.details && (
                        <div className={styles.accordionBody}>
                          <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
                            <div className={styles.formGroup} style={{ flex: '1 1 100%' }}>
                              <label className={styles.filterLabel}>Link to Database Skill (Prefills fields below)</label>
                              <select 
                                className={styles.formSelect}
                                value={dbSkills.some(s => s.id === skillId) ? skillId : ''}
                                onChange={(e) => {
                                  const selectedSkillId = e.target.value;
                                  if (!selectedSkillId) return;
                                  const skill = dbSkills.find(s => s.id === selectedSkillId);
                                  if (skill) {
                                    setSubject(skill.subjectId || '');
                                    setTopic(skill.topicId || '');
                                    setSkillId(skill.id || '');
                                    if (skill.grade) {
                                      setEstimatedGrade(`Grade ${skill.grade}`);
                                    }
                                    logActivity(`Linked question to skill: ${skill.title} (${skill.id})`, 'info');
                                  }
                                }}
                              >
                                <option value="">-- Choose an existing skill to link --</option>
                                {dbSkills.map((skill) => (
                                  <option key={skill.id} value={skill.id}>
                                    {skill.subjectId ? `${skill.subjectId.toUpperCase()} > ` : ''}
                                    {skill.topicId ? `${skill.topicId} > ` : ''}
                                    {skill.title || skill.id} ({skill.id})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Subject</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={subject} 
                                onChange={(e) => setSubject(e.target.value)} 
                                placeholder="e.g. english, math"
                              />
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Topic / Chapter</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={topic} 
                                onChange={(e) => setTopic(e.target.value)} 
                                placeholder="e.g. grammar, fractions"
                              />
                            </div>
                          </div>

                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Skill ID / Logic Type</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={skillId} 
                                onChange={(e) => setSkillId(e.target.value)} 
                                placeholder="e.g. nouns, addition"
                              />
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Difficulty</label>
                              <select 
                                className={styles.formSelect} 
                                value={difficulty} 
                                onChange={(e) => setDifficulty(e.target.value)}
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="adaptive">Adaptive</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: CONTENT */}
                    <div className={styles.accordionGroup}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setCollapsedSections(prev => ({ ...prev, content: !prev.content }))}
                      >
                        <span>2. Question Content</span>
                        <span>{collapsedSections.content ? '▼' : '▲'}</span>
                      </button>

                      {!collapsedSections.content && (
                        <div className={styles.accordionBody}>
                          <div className={styles.formGroup}>
                            <label className={styles.filterLabel}>Question Text Statement (Markdown support)</label>
                            <textarea 
                              className={styles.textareaInput} 
                              value={questionText} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setQuestionText(val);
                                const firstTextIdx = parts.findIndex(p => p.type === 'text');
                                if (firstTextIdx !== -1) {
                                  const updated = [...parts];
                                  updated[firstTextIdx] = { ...updated[firstTextIdx], content: val };
                                  setParts(updated);
                                } else {
                                  setParts([{ type: 'text', content: val }, ...parts]);
                                }
                                ignoreDirtyChange.current = false;
                                setIsDirty(true);
                              }}
                              placeholder="Enter question statement... Markdown bolding is supported (e.g. **frog**)"
                              rows={3}
                            />
                          </div>

                          {/* Layout Parts (Visual Structured Editor) */}
                          <div className={styles.formGroup} style={{ marginTop: 15 }}>
                            <label className={styles.filterLabel}>Layout Parts (Visual Structured Editor)</label>
                            <div className={styles.partsContainer}>
                              {parts.filter(p => p.type !== 'categorization').map((part, idx, arr) => {
                                const realIdx = parts.indexOf(part);
                                return (
                                  <div key={idx} className={styles.partItem}>
                                    <div className={styles.partHeader}>
                                      <span className={styles.partHeaderLabel}>
                                        Part #{idx + 1}: <span className={styles.partBadge}>{part.type || 'text'}</span>
                                      </span>
                                      <div className={styles.partControls}>
                                        <button
                                          type="button"
                                          onClick={() => handleMovePartUp(realIdx)}
                                          disabled={idx === 0}
                                          className={styles.moveBtn}
                                          title="Move layout element up"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMovePartDown(realIdx)}
                                          disabled={idx === arr.length - 1}
                                          className={styles.moveBtn}
                                          title="Move layout element down"
                                        >
                                          ▼
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePart(realIdx)}
                                          disabled={arr.length <= 1}
                                          className={`${styles.btnDanger} ${styles.btnCompact}`}
                                          style={{ padding: '4px 6px', fontSize: 10 }}
                                          title="Delete layout element"
                                        >
                                          × Delete
                                        </button>
                                      </div>
                                    </div>
                                    <div className={styles.partBody}>
                                      {part.type === 'text' && (
                                        <>
                                          <textarea
                                            className={styles.textareaInput}
                                            value={part.content || ''}
                                            onChange={(e) => handleUpdatePartContent(realIdx, e.target.value)}
                                            placeholder="Enter text (supports blanks e.g. [[ans]] or [blank:my_id])"
                                            rows={2}
                                          />
                                          <div className={styles.formRow} style={{ marginTop: 8 }}>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Font Weight</label>
                                              <select
                                                className={styles.formSelect}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.style?.fontWeight || 400}
                                                onChange={(e) => handleUpdatePartFields(realIdx, {
                                                  style: { ...part.style, fontWeight: Number(e.target.value) }
                                                })}
                                              >
                                                <option value={400}>Normal (400)</option>
                                                <option value={700}>Bold (700)</option>
                                                <option value={900}>Heavy (900)</option>
                                              </select>
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Font Size (e.g. 22px)</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.style?.fontSize || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, {
                                                  style: { ...part.style, fontSize: e.target.value }
                                                })}
                                                placeholder="default (22px)"
                                              />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Text Color</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.style?.color || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, {
                                                  style: { ...part.style, color: e.target.value }
                                                })}
                                                placeholder="e.g. #334155"
                                              />
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {part.type === 'latex' && (
                                        <>
                                          <textarea
                                            className={styles.textareaInput}
                                            value={part.content || ''}
                                            onChange={(e) => handleUpdatePartContent(realIdx, e.target.value)}
                                            placeholder="Enter LaTeX formula (without $$ delimiters, e.g. \\frac{a}{b})"
                                            rows={2}
                                          />
                                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <input
                                              type="checkbox"
                                              id={`latex_inline_${idx}`}
                                              className={styles.checkboxInput}
                                              checked={part.style?.display === 'inline' || part.style?.display === 'inline-block'}
                                              onChange={(e) => handleUpdatePartFields(realIdx, {
                                                style: {
                                                  ...part.style,
                                                  display: e.target.checked ? 'inline-block' : undefined
                                                }
                                              })}
                                            />
                                            <label htmlFor={`latex_inline_${idx}`} style={{ fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                              Render inline (flows with surrounding text)
                                            </label>
                                          </div>
                                        </>
                                      )}

                                      {part.type === 'image' && (
                                        <>
                                          <div className={styles.formRow}>
                                            <div className={styles.formGroup} style={{ flex: 2 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Image URL / Path</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                value={part.imageUrl || part.src || part.content || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, {
                                                  imageUrl: e.target.value,
                                                  src: e.target.value,
                                                  content: e.target.value
                                                })}
                                                placeholder="e.g. /images/diagram.png or external link"
                                              />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Alt Text</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                value={part.alt || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { alt: e.target.value })}
                                                placeholder="Alt description"
                                              />
                                            </div>
                                          </div>
                                          <div className={styles.formRow} style={{ marginTop: 8 }}>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Max Width (px)</label>
                                              <input
                                                type="number"
                                                className={styles.formInput}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.maxWidth || 340}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { maxWidth: Number(e.target.value) || 340 })}
                                              />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Max Height (px)</label>
                                              <input
                                                type="number"
                                                className={styles.formInput}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.maxHeight || 280}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { maxHeight: Number(e.target.value) || 280 })}
                                              />
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {part.type === 'svg' && (
                                        <>
                                          <textarea
                                            className={styles.textareaInput}
                                            value={part.content || ''}
                                            onChange={(e) => handleUpdatePartContent(realIdx, e.target.value)}
                                            placeholder="Paste XML raw SVG (e.g. <svg>...</svg>)"
                                            rows={4}
                                            style={{ fontFamily: 'monospace', fontSize: 11 }}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className={styles.addButtonRow} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className={styles.btnOutline}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => handleAddPart('text')}
                              >
                                + Add Text Part
                              </button>
                              <button
                                type="button"
                                className={styles.btnOutline}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => handleAddPart('latex')}
                              >
                                + Add LaTeX Part
                              </button>
                              <button
                                type="button"
                                className={styles.btnOutline}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => handleAddPart('image')}
                              >
                                + Add Image Part
                              </button>
                              <button
                                type="button"
                                className={styles.btnOutline}
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => handleAddPart('svg')}
                              >
                                + Add SVG Part
                              </button>
                            </div>
                          </div>

                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Explanation / Practice Hint (Optional)</label>
                              <textarea 
                                className={styles.textareaInput} 
                                value={explanation} 
                                onChange={(e) => setExplanation(e.target.value)}
                                placeholder="Explain solution steps for student feedback..."
                                rows={2}
                              />
                            </div>

                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Teacher Notes (Internal comments)</label>
                              <textarea 
                                className={styles.textareaInput} 
                                value={teacherNotes} 
                                onChange={(e) => setTeacherNotes(e.target.value)}
                                placeholder="Pedagogical instructions or hints for content managers..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 3: ANSWERS & VALIDATION */}
                    <div className={styles.accordionGroup}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setCollapsedSections(prev => ({ ...prev, answers: !prev.answers }))}
                      >
                        <span>3. Answers & Validation</span>
                        <span>{collapsedSections.answers ? '▼' : '▲'}</span>
                      </button>

                      {!collapsedSections.answers && (
                        <div className={styles.accordionBody}>
                          <div className={styles.formGroup}>
                            <label className={styles.filterLabel}>Question Format</label>
                            <select 
                              className={styles.formSelect} 
                              value={type} 
                              onChange={(e) => {
                                setType(e.target.value);
                                ignoreDirtyChange.current = false;
                                setIsDirty(true);
                              }}
                            >
                              <option value="mcq">Multiple Choice Question (MCQ)</option>
                              <option value="mcq_hotspot">Multiple Choice (Hotspot Select)</option>
                              <option value="fillInTheBlank">Fill-In-The-Blank (FIB)</option>
                              <option value="trueOrFalse">True / False</option>
                              <option value="categorization">Categorization / Sorting (Konva Canvas)</option>
                              <option value="categorizationv2">Categorization / Sorting (HTML5 Drag-Drop)</option>
                            </select>
                          </div>

                          {type === 'mcq' && (
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>
                                MCQ Options (Select correct answer radio, reorder, or edit keyboard shortcuts)
                              </label>
                              
                              <div className={styles.optionsList}>
                                {options.map((option, idx) => (
                                  <div key={idx} className={styles.optionItemRow}>
                                    <div className={styles.optionControlsGroup}>
                                      <input 
                                        type="radio" 
                                        name="correctOptionRadio" 
                                        className={styles.radioInput} 
                                        checked={option.isCorrect} 
                                        onChange={() => setCorrectOption(idx)}
                                        title="Mark option as correct answer"
                                      />
                                      <button 
                                        type="button"
                                        className={styles.moveBtn} 
                                        onClick={() => moveOptionUp(idx)}
                                        disabled={idx === 0}
                                        title="Move option up"
                                      >
                                        ▲
                                      </button>
                                      <button 
                                        type="button"
                                        className={styles.moveBtn} 
                                        onClick={() => moveOptionDown(idx)}
                                        disabled={idx === options.length - 1}
                                        title="Move option down"
                                      >
                                        ▼
                                      </button>
                                    </div>

                                    <input 
                                      type="text" 
                                      className={styles.optionTextInput} 
                                      value={option.label} 
                                      onChange={(e) => updateOptionText(idx, e.target.value)}
                                      onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                                      placeholder={`Option ${idx + 1}`}
                                    />
                                    
                                    <button 
                                      type="button"
                                      className={styles.iconPlayBtn} 
                                      onClick={() => speakText(option.label, voice)}
                                      title="Preview voice read aloud"
                                      disabled={!option.label.trim()}
                                    >
                                      ▶
                                    </button>
                                    <button 
                                      type="button"
                                      className={`${styles.btnDanger} ${styles.btnCompact}`}
                                      onClick={() => removeOption(idx)}
                                      disabled={options.length <= 2}
                                      style={{ padding: '6px 8px' }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                              
                              {options.length < 8 && (
                                <button 
                                  type="button" 
                                  className={styles.btnOutline} 
                                  onClick={addOption}
                                  style={{ padding: '6px 12px', marginTop: 10, alignSelf: 'flex-start' }}
                                >
                                  + Add Option Row
                                </button>
                              )}
                            </div>
                          )}

                          {type === 'mcq_hotspot' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                              <div style={{ paddingBottom: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isHotspotMultiSelect} 
                                    onChange={(e) => {
                                      setIsHotspotMultiSelect(e.target.checked);
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }} 
                                    className={styles.checkbox}
                                  />
                                  <span>Multi-Select (allow multiple correct answers)</span>
                                </label>
                                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={showHotspotLabels} 
                                    onChange={(e) => {
                                      setShowHotspotLabels(e.target.checked);
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }} 
                                    className={styles.checkbox}
                                  />
                                  <span>Show Hotspot Labels (display labels over hotspots in student view)</span>
                                </label>
                              </div>
                              {/* Background Options */}
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                                <div className={styles.formGroup} style={{ flex: 1, minWidth: 250 }}>
                                  <label className={styles.filterLabel}>Canvas Background Image URL</label>
                                  <input
                                    type="text"
                                    className={styles.formInput}
                                    value={backgroundImage || ''}
                                    onChange={(e) => {
                                      setBackgroundImage(e.target.value);
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }}
                                    placeholder="https://example.com/diagram.png"
                                    style={{ marginTop: 6 }}
                                  />
                                  {backgroundImage && (
                                    <button
                                      type="button"
                                      className={styles.btnOutline}
                                      onClick={() => {
                                        const w = canvas?.width || 800;
                                        const h = canvas?.height || 465;
                                        const wrapperSvg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">\n  <image href="${backgroundImage}" x="0" y="0" width="${w}" height="${h}" />\n</svg>`;
                                        setBackgroundSvg(wrapperSvg);
                                        setBackgroundImage('');
                                        ignoreDirtyChange.current = false;
                                        setIsDirty(true);
                                      }}
                                      style={{ marginTop: 6, padding: '4px 10px', fontSize: 11, width: '100%' }}
                                    >
                                      Convert Image URL to Background SVG
                                    </button>
                                  )}
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1, minWidth: 250 }}>
                                  <label className={styles.filterLabel}>Or Custom Background SVG Code</label>
                                  <textarea
                                    className={styles.formInput}
                                    value={backgroundSvg || ''}
                                    onChange={(e) => {
                                      setBackgroundSvg(e.target.value);
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }}
                                    placeholder="<svg>...</svg>"
                                    rows={1}
                                    style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
                                  />
                                </div>
                                <div className={styles.formGroup} style={{ width: 140 }}>
                                  <label className={styles.filterLabel}>Canvas Width (px)</label>
                                  <input
                                    type="number"
                                    className={styles.formInput}
                                    value={canvas?.width || 800}
                                    onChange={(e) => {
                                      const w = parseInt(e.target.value, 10) || 800;
                                      setCanvas(prev => ({ ...(prev || {}), width: w }));
                                      setIsDirty(true);
                                    }}
                                    placeholder="800"
                                    min={300}
                                    max={1600}
                                    style={{ marginTop: 6 }}
                                  />
                                </div>
                                <div className={styles.formGroup} style={{ width: 140 }}>
                                  <label className={styles.filterLabel}>Canvas Height (px)</label>
                                  <input
                                    type="number"
                                    className={styles.formInput}
                                    value={canvas?.height || 465}
                                    onChange={(e) => {
                                      const h = parseInt(e.target.value, 10) || 465;
                                      setCanvas(prev => ({ ...(prev || {}), height: h }));
                                      setIsDirty(true);
                                    }}
                                    placeholder="465"
                                    min={200}
                                    max={1200}
                                    style={{ marginTop: 6 }}
                                  />
                                </div>
                              </div>

                              {/* Interactive Canvas Editor for MCQ Hotspots */}
                              <div className={styles.formGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <label className={styles.filterLabel} style={{ marginBottom: 0 }}>
                                    Interactive Hotspots Canvas
                                  </label>
                                  {(hotspots || []).length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Arrange:</span>
                                      <button 
                                        type="button" 
                                        className={styles.btnOutline}
                                        onClick={() => handleAutoGrid('grid')}
                                        style={{ padding: '4px 10px', fontSize: 11 }}
                                        title="Arrange in a square/rectangular grid"
                                      >
                                        Grid
                                      </button>
                                      <button 
                                        type="button" 
                                        className={styles.btnOutline}
                                        onClick={() => handleAutoGrid('horizontal')}
                                        style={{ padding: '4px 10px', fontSize: 11 }}
                                        title="Arrange side-by-side in one row"
                                      >
                                        Horizontal
                                      </button>
                                      <button 
                                        type="button" 
                                        className={styles.btnOutline}
                                        onClick={() => handleAutoGrid('vertical')}
                                        style={{ padding: '4px 10px', fontSize: 11 }}
                                        title="Arrange stacked in one column"
                                      >
                                        Vertical
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
                                  Click on the canvas to add a new option hotspot. Drag boxes to position, and resize or rename using controls. If you provide an Image URL for a hotspot, it will be rendered.
                                </span>
                                
                                <div
                                  ref={canvasRef}
                                  onClick={handleCanvasClick}
                                  style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: canvas?.width ? `${canvas.width}px` : '800px',
                                    aspectRatio: backgroundImage || backgroundSvg ? 'auto' : '16/9',
                                    minHeight: backgroundImage || backgroundSvg ? 'auto' : '300px',
                                    backgroundColor: '#f8fafc',
                                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                    backgroundSize: '16px 16px',
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    cursor: 'crosshair',
                                    userSelect: 'none'
                                  }}
                                >
                                  {/* Custom SVG Background */}
                                  {backgroundSvg && (
                                    <div 
                                      style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                                      dangerouslySetInnerHTML={{ __html: backgroundSvg }}
                                    />
                                  )}

                                  {/* Custom Image Background */}
                                  {!backgroundSvg && backgroundImage && (
                                    <img
                                      src={backgroundImage}
                                      alt="Diagram Background"
                                      style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block',
                                        pointerEvents: 'none',
                                        userSelect: 'none'
                                      }}
                                    />
                                  )}

                                  {/* Empty state */}
                                  {!backgroundSvg && !backgroundImage && (
                                    <div style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#94a3b8',
                                      fontSize: 14,
                                      fontWeight: 500
                                    }}>
                                      Please enter an image URL, upload an image, or paste SVG code above to start.
                                    </div>
                                  )}

                                  {/* Hotspot boxes */}
                                  {(hotspots || []).map((hs, i) => {
                                    const isSelected = selectedHotspotId === hs.id;
                                    return (
                                      <div
                                        key={hs.id}
                                        onPointerDown={(e) => handleHotspotPointerDown(e, hs.id)}
                                        onPointerMove={(e) => handleHotspotPointerMove(e, hs.id)}
                                        onPointerUp={(e) => handleHotspotPointerUp(e, hs.id)}
                                        style={{
                                          position: 'absolute',
                                          left: `${hs.x}%`,
                                          top: `${hs.y}%`,
                                          width: hs.imageUrl ? 'auto' : `${hs.width}%`,
                                          maxWidth: hs.imageUrl ? `${hs.width}%` : undefined,
                                          height: `${hs.height}%`,
                                          border: isSelected ? '2.5px solid #0284c7' : '1.5px dashed #0284c7',
                                          backgroundColor: hs.isCorrect 
                                            ? (isSelected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                            : (isSelected ? 'rgba(2, 132, 199, 0.12)' : 'rgba(255, 255, 255, 0.75)'),
                                          borderRadius: hs.isCircle ? '50%' : '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: hs.isCorrect ? '#16a34a' : '#0369a1',
                                          cursor: 'move',
                                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                                          zIndex: isSelected ? 12 : 10,
                                          padding: '4px',
                                          textAlign: 'center',
                                          boxSizing: 'border-box',
                                          userSelect: 'none',
                                          touchAction: 'none',
                                          overflow: 'visible'
                                        }}
                                      >
                                        {hs.imageUrl ? (
                                          <>
                                            <img src={hs.imageUrl} alt={hs.label || ''} style={{ height: '100%', width: 'auto', objectFit: 'contain', pointerEvents: 'none', borderRadius: hs.isCircle ? '50%' : '8px', zIndex: 1 }} />
                                            {showHotspotLabels && hs.label && (
                                              <span style={{
                                                position: 'absolute',
                                                bottom: '-22px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '12px',
                                                padding: '1px 6px',
                                                fontSize: '9px',
                                                fontWeight: '800',
                                                color: '#334155',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                pointerEvents: 'none',
                                                whiteSpace: 'nowrap',
                                                zIndex: 10
                                              }}>
                                                {hs.label}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                            {hs.isCorrect ? '✅ ' : ''}{hs.label || '(Empty Hotspot)'}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Selected Hotspot Properties Editor */}
                              {(hotspots || []).some(h => h.id === selectedHotspotId) && (() => {
                                const activeHs = hotspots.find(h => h.id === selectedHotspotId);
                                return (
                                  <div style={{
                                    padding: 16,
                                    border: '1.5px solid #bae6fd',
                                    borderRadius: 8,
                                    background: '#f0f9ff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0f2fe', paddingBottom: 8 }}>
                                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0369a1' }}>
                                        Edit Hotspot Option: {activeHs.label}
                                      </span>
                                      <button
                                        type="button"
                                        className={`${styles.btnDanger} ${styles.btnCompact}`}
                                        onClick={() => {
                                          const updated = hotspots.filter(h => h.id !== activeHs.id);
                                          // Ensure at least one correct option if we deleted the correct one
                                          if (activeHs.isCorrect && updated.length > 0) {
                                            updated[0].isCorrect = true;
                                          }
                                          syncHotspotsToOptions(updated);
                                          setSelectedHotspotId(null);
                                        }}
                                        style={{ padding: '4px 10px', fontSize: 11 }}
                                      >
                                        × Delete Hotspot
                                      </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 11 }}>Option / Label Text</label>
                                        <input
                                          type="text"
                                          className={styles.formInput}
                                          value={activeHs.label || ''}
                                          onChange={(e) => {
                                            const updated = hotspots.map(h => h.id === activeHs.id ? { ...h, label: e.target.value } : h);
                                            syncHotspotsToOptions(updated);
                                          }}
                                          placeholder="e.g. Earth"
                                          style={{ marginTop: 4, fontSize: 12 }}
                                        />
                                      </div>
                                      
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 11 }}>Image URL (Optional)</label>
                                        <input
                                          type="text"
                                          className={styles.formInput}
                                          value={activeHs.imageUrl || ''}
                                          onChange={(e) => {
                                            const updated = hotspots.map(h => h.id === activeHs.id ? { ...h, imageUrl: e.target.value } : h);
                                            syncHotspotsToOptions(updated);
                                          }}
                                          placeholder="https://example.com/image.png"
                                          style={{ marginTop: 4, fontSize: 12 }}
                                        />
                                      </div>

                                      <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'row', gap: 20, alignItems: 'center', marginTop: 16 }}>
                                        <label className={styles.checkboxLabel}>
                                          <input
                                            type="radio"
                                            name="correctHotspotRadio"
                                            className={styles.radioInput}
                                            checked={activeHs.isCorrect}
                                            onChange={() => {
                                              const updated = hotspots.map(h => ({ ...h, isCorrect: h.id === activeHs.id }));
                                              syncHotspotsToOptions(updated);
                                            }}
                                          />
                                          Correct Answer
                                        </label>

                                        <label className={styles.checkboxLabel}>
                                          <input
                                            type="checkbox"
                                            className={styles.checkboxInput}
                                            checked={activeHs.isCircle}
                                            onChange={(e) => {
                                              const updated = hotspots.map(h => h.id === activeHs.id ? { ...h, isCircle: e.target.checked } : h);
                                              syncHotspotsToOptions(updated);
                                            }}
                                          />
                                          Circular Highlight
                                        </label>
                                      </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, borderTop: '1px solid #e0f2fe', paddingTop: 10 }}>
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 10 }}>Box X (%)</label>
                                        <input
                                          type="number"
                                          className={styles.formInput}
                                          value={activeHs.x}
                                          onChange={(e) => handleUpdateHotspotDimension(activeHs.id, 'x', e.target.value)}
                                          style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                        />
                                      </div>
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 10 }}>Box Y (%)</label>
                                        <input
                                          type="number"
                                          className={styles.formInput}
                                          value={activeHs.y}
                                          onChange={(e) => handleUpdateHotspotDimension(activeHs.id, 'y', e.target.value)}
                                          style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                        />
                                      </div>
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 10 }}>Width (%)</label>
                                        <input
                                          type="number"
                                          className={styles.formInput}
                                          value={activeHs.width}
                                          onChange={(e) => handleUpdateHotspotDimension(activeHs.id, 'width', e.target.value)}
                                          style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                        />
                                      </div>
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 10 }}>Height (%)</label>
                                        <input
                                          type="number"
                                          className={styles.formInput}
                                          value={activeHs.height}
                                          onChange={(e) => handleUpdateHotspotDimension(activeHs.id, 'height', e.target.value)}
                                          style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {(type === 'categorizationv2' || type === 'categorization') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                              {/* Layout Mode Selector */}
                              <div className={styles.formGroup} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                                <label className={styles.filterLabel}>Layout Mode</label>
                                <select
                                  className={styles.formSelect}
                                  value={layoutMode}
                                  onChange={(e) => {
                                    const mode = e.target.value;
                                    ignoreDirtyChange.current = false;
                                    setIsDirty(true);
                                    setLayoutMode(mode);
                                    if (mode === 'diagram_labeling' || mode === 'shelf_sort') {
                                      setInteraction('universal_dnd');
                                      if (mode === 'diagram_labeling') {
                                        if (!targets || targets.length === 0) {
                                          // Initialize targets from categories
                                          const initialTargets = categories.map((cat, idx) => ({
                                            id: cat.id,
                                            label: cat.label,
                                            x: Math.max(0, Math.min(85, 10 + (idx * 20))),
                                            y: 40,
                                            width: 15,
                                            height: 8,
                                            pointerX: Math.max(0, Math.min(100, 10 + (idx * 20) + 7.5)),
                                            pointerY: 60,
                                            unit: '%'
                                          }));
                                          setTargets(initialTargets);
                                        }
                                        if (!canvas) {
                                          setCanvas({ width: 800, backgroundImage: backgroundImage });
                                        }
                                      }
                                    } else {
                                      setInteraction('');
                                    }
                                  }}
                                  style={{ marginTop: 6 }}
                                >
                                  <option value="">Standard Grid</option>
                                  <option value="diagram_labeling">Diagram Labeling</option>
                                  <option value="shelf_sort">Shelf Sorting</option>
                                </select>
                              </div>

                              {layoutMode === 'diagram_labeling' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                  {/* Diagram Image / Canvas Settings */}
                                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <div className={styles.formGroup} style={{ flex: 1, minWidth: 250 }}>
                                      <label className={styles.filterLabel}>Diagram Image URL</label>
                                      <input
                                        type="text"
                                        className={styles.formInput}
                                        value={backgroundImage || ''}
                                        onChange={(e) => handleDiagramImageUrlChange(e.target.value)}
                                        placeholder="https://example.com/diagram.png"
                                        style={{ marginTop: 6 }}
                                      />
                                    </div>
                                    <div className={styles.formGroup} style={{ width: 220 }}>
                                      <label className={styles.filterLabel}>Or Upload Local Image</label>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className={styles.formInput}
                                        onChange={handleDiagramImageUpload}
                                        style={{ marginTop: 6, padding: '4px' }}
                                      />
                                    </div>
                                    <div className={styles.formGroup} style={{ width: 140 }}>
                                      <label className={styles.filterLabel}>Canvas Max Width (px)</label>
                                      <input
                                        type="number"
                                        className={styles.formInput}
                                        value={canvas?.width || 800}
                                        onChange={(e) => handleCanvasWidthChange(e.target.value)}
                                        placeholder="800"
                                        min={300}
                                        max={1600}
                                        style={{ marginTop: 6 }}
                                      />
                                    </div>
                                  </div>

                                  {/* Interactive Canvas Editor Section */}
                                  <div className={styles.formGroup}>
                                    <label className={styles.filterLabel}>
                                      Interactive Diagram Canvas
                                    </label>
                                    <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
                                      Click on the diagram to add a new target hotspot. Drag boxes to position labels, and drag pointer pins to locate targets.
                                    </span>
                                    
                                    {/* The Canvas */}
                                    <div
                                      ref={canvasRef}
                                      onClick={handleCanvasClick}
                                      style={{
                                        position: 'relative',
                                        width: '100%',
                                        maxWidth: canvas?.width ? `${canvas.width}px` : '800px',
                                        aspectRatio: backgroundImage ? 'auto' : '16/9',
                                        minHeight: backgroundImage ? 'auto' : '300px',
                                        backgroundColor: '#f8fafc',
                                        backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                        backgroundSize: '16px 16px',
                                        border: '2px dashed #cbd5e1',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        cursor: 'crosshair',
                                        userSelect: 'none'
                                      }}
                                    >
                                      {backgroundImage ? (
                                        <img
                                          src={backgroundImage}
                                          alt="Diagram Background"
                                          style={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            pointerEvents: 'none',
                                            userSelect: 'none'
                                          }}
                                        />
                                      ) : (
                                        <div style={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: '#94a3b8',
                                          fontSize: 14,
                                          fontWeight: 500
                                        }}>
                                          Please upload or enter a diagram image URL to start.
                                        </div>
                                      )}

                                      {/* SVG Connector Lines */}
                                      <svg
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          pointerEvents: 'none',
                                          zIndex: 5
                                        }}
                                      >
                                        {(targets || []).map(t => {
                                          if (t.pointerX === undefined || t.pointerY === undefined) return null;
                                          // Calculate target center relative to canvas (using percent coordinates)
                                          const fromX = `${t.x + (t.width / 2)}%`;
                                          const fromY = `${t.y + (t.height / 2)}%`;
                                          const toX = `${t.pointerX}%`;
                                          const toY = `${t.pointerY}%`;

                                          return (
                                            <g key={`line-${t.id}`}>
                                              <line
                                                x1={fromX}
                                                y1={fromY}
                                                x2={toX}
                                                y2={toY}
                                                stroke="#64748b"
                                                strokeWidth="2"
                                                strokeDasharray="4,4"
                                              />
                                            </g>
                                          );
                                        })}
                                      </svg>

                                      {/* Target Boxes */}
                                      {(targets || []).map(t => {
                                        const isSelected = selectedTargetId === t.id;
                                        return (
                                          <div
                                            key={t.id}
                                            onPointerDown={(e) => handleBoxPointerDown(e, t.id)}
                                            onPointerMove={(e) => handleBoxPointerMove(e, t.id)}
                                            onPointerUp={(e) => handleBoxPointerUp(e, t.id)}
                                            style={{
                                              position: 'absolute',
                                              left: `${t.x}%`,
                                              top: `${t.y}%`,
                                              width: `${t.width}%`,
                                              height: `${t.height}%`,
                                              border: isSelected ? '2px solid #2563eb' : '1.5px dashed #64748b',
                                              backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.85)',
                                              borderRadius: 6,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: 11,
                                              fontWeight: 600,
                                              color: isSelected ? '#1e40af' : '#334155',
                                              cursor: 'move',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                              zIndex: isSelected ? 12 : 10,
                                              padding: '2px',
                                              textAlign: 'center',
                                              boxSizing: 'border-box',
                                              userSelect: 'none',
                                              touchAction: 'none'
                                            }}
                                          >
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                              {t.label || '(Empty Target)'}
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {/* Pointer Hotspot Dots */}
                                      {(targets || []).map(t => {
                                        if (t.pointerX === undefined || t.pointerY === undefined) return null;
                                        const isSelected = selectedTargetId === t.id;
                                        return (
                                          <div
                                            key={`pin-${t.id}`}
                                            onPointerDown={(e) => handlePinPointerDown(e, t.id)}
                                            onPointerMove={(e) => handlePinPointerMove(e, t.id)}
                                            onPointerUp={(e) => handlePinPointerUp(e, t.id)}
                                            style={{
                                              position: 'absolute',
                                              left: `${t.pointerX}%`,
                                              top: `${t.pointerY}%`,
                                              width: 14,
                                              height: 14,
                                              backgroundColor: isSelected ? '#2563eb' : '#475569',
                                              border: '2.5px solid #ffffff',
                                              borderRadius: '50%',
                                              transform: 'translate(-50%, -50%)',
                                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                              cursor: 'crosshair',
                                              zIndex: isSelected ? 13 : 11,
                                              touchAction: 'none'
                                            }}
                                            title="Pointer pin"
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Selected Target Inspector */}
                                  {selectedTargetId && (() => {
                                    const activeTarget = (targets || []).find(t => t.id === selectedTargetId);
                                    if (!activeTarget) return null;
                                    return (
                                      <div style={{
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: 8,
                                        padding: '16px',
                                        backgroundColor: '#f8fafc',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                                            Selected Target Properties ({activeTarget.label})
                                          </span>
                                          <button
                                            type="button"
                                            className={`${styles.btnDanger} ${styles.btnCompact}`}
                                            onClick={() => handleDeleteTarget(activeTarget.id)}
                                            style={{ padding: '4px 10px', fontSize: 11 }}
                                          >
                                            × Delete Target
                                          </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 11 }}>Label Text</label>
                                            <input
                                              type="text"
                                              className={styles.formInput}
                                              value={activeTarget.label || ''}
                                              onChange={(e) => handleUpdateTargetLabel(activeTarget.id, e.target.value)}
                                              placeholder="Target label text"
                                              style={{ marginTop: 4, fontSize: 12 }}
                                            />
                                          </div>
                                          
                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 11 }}>Box Width (%)</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeTarget.width}
                                              onChange={(e) => handleUpdateTargetDimensions(activeTarget.id, 'width', e.target.value)}
                                              min={3}
                                              max={100}
                                              style={{ marginTop: 4, fontSize: 12 }}
                                            />
                                          </div>

                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 11 }}>Box Height (%)</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeTarget.height}
                                              onChange={(e) => handleUpdateTargetDimensions(activeTarget.id, 'height', e.target.value)}
                                              min={2}
                                              max={100}
                                              style={{ marginTop: 4, fontSize: 12 }}
                                            />
                                          </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 10 }}>Box X (%)</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeTarget.x}
                                              onChange={(e) => handleUpdateTargetDimensions(activeTarget.id, 'x', e.target.value)}
                                              style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                            />
                                          </div>
                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 10 }}>Box Y (%)</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeTarget.y}
                                              onChange={(e) => handleUpdateTargetDimensions(activeTarget.id, 'y', e.target.value)}
                                              style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                            />
                                          </div>
                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 10 }}>Pin X (%)</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeTarget.pointerX}
                                              onChange={(e) => handleUpdateTargetDimensions(activeTarget.id, 'pointerX', e.target.value)}
                                              style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                            />
                                          </div>
                                          <div className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 10 }}>Pin Y (%)</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeTarget.pointerY}
                                              onChange={(e) => handleUpdateTargetDimensions(activeTarget.id, 'pointerY', e.target.value)}
                                              style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className={styles.formGroup}>
                                  <label className={styles.filterLabel}>
                                    Categories (Min 1, Max 5)
                                  </label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                                    {categories.map((cat, idx) => (
                                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 80 }}>
                                          Category #{idx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          className={styles.formInput}
                                          value={cat.label}
                                          onChange={(e) => handleUpdateCategoryLabel(idx, e.target.value)}
                                          placeholder={`Category ${idx + 1} Label`}
                                          style={{ flex: 1 }}
                                        />
                                        <button
                                          type="button"
                                          className={`${styles.btnDanger} ${styles.btnCompact}`}
                                          onClick={() => handleRemoveCategory(idx)}
                                          disabled={categories.length <= 1}
                                          style={{ padding: '6px 12px' }}
                                          title="Delete Category"
                                        >
                                          × Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  {categories.length < 5 && (
                                    <button
                                      type="button"
                                      className={styles.btnOutline}
                                      onClick={handleAddCategory}
                                      style={{ padding: '6px 12px', marginTop: 10, alignSelf: 'flex-start' }}
                                    >
                                      + Add Category
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Items Editor */}
                              <div className={styles.formGroup}>
                                <label className={styles.filterLabel}>
                                  Sort Items (Map items to their correct categories)
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                                  {categorizationItems.map((item, idx) => (
                                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
                                      {/* Row 1: index label + content + category + play + delete */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 60 }}>
                                          Item #{idx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          className={styles.formInput}
                                          value={item.content}
                                          onChange={(e) => handleUpdateItemContent(idx, e.target.value)}
                                          placeholder="Label / text"
                                          style={{ flex: 2 }}
                                        />
                                        <select
                                          className={styles.formSelect}
                                          value={item.categoryId}
                                          onChange={(e) => handleUpdateItemCategory(idx, e.target.value)}
                                          style={{ flex: 1, minWidth: 110 }}
                                        >
                                          {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                              {cat.label || '(Untitled)'}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          className={styles.iconPlayBtn}
                                          onClick={() => speakText(item.content, voice)}
                                          title="Preview voice read aloud"
                                          disabled={!item.content.trim()}
                                        >
                                          ▶
                                        </button>
                                        <button
                                          type="button"
                                          className={`${styles.btnDanger} ${styles.btnCompact}`}
                                          onClick={() => handleRemoveItem(idx)}
                                          style={{ padding: '6px 10px' }}
                                          title="Delete Item"
                                        >
                                          ×
                                        </button>
                                      </div>
                                      {/* Row 2: Media Type, Inputs, and Preview */}
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', minWidth: 60 }}>Media Type</span>
                                          <select
                                            className={styles.formSelect}
                                            value={item.visualType || 'none'}
                                            onChange={(e) => handleUpdateItemVisualType(idx, e.target.value)}
                                            style={{ width: 120, fontSize: 12, height: 32, padding: '2px 8px' }}
                                          >
                                            <option value="none">None</option>
                                            <option value="imageUrl">Image URL</option>
                                            <option value="svg">SVG Code</option>
                                          </select>

                                          {item.visualType !== 'none' && (
                                            <>
                                              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginLeft: 8 }}>Width (px)</span>
                                              <input
                                                type="number"
                                                className={styles.formInput}
                                                value={item.imageWidth || ''}
                                                onChange={(e) => handleUpdateItemImageWidth(idx, e.target.value)}
                                                placeholder="e.g. 80"
                                                min={20}
                                                max={400}
                                                style={{ width: 80, fontSize: 12, height: 32 }}
                                              />
                                            </>
                                          )}
                                        </div>

                                        {item.visualType === 'imageUrl' && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', minWidth: 60 }}>URL</span>
                                            <input
                                              type="text"
                                              className={styles.formInput}
                                              value={item.imageUrl || ''}
                                              onChange={(e) => handleUpdateItemImageUrl(idx, e.target.value)}
                                              placeholder="https://… (optional)"
                                              style={{ flex: 1, fontSize: 12, height: 32 }}
                                            />
                                            {item.imageUrl && (
                                              <img
                                                src={item.imageUrl}
                                                alt={item.content || 'preview'}
                                                style={{
                                                  height: 32,
                                                  width: item.imageWidth ? `${item.imageWidth}px` : 'auto',
                                                  objectFit: 'contain',
                                                  border: '1px solid #cbd5e1',
                                                  borderRadius: 4,
                                                  background: '#fff'
                                                }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                              />
                                            )}
                                          </div>
                                        )}

                                        {item.visualType === 'svg' && (
                                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', minWidth: 60, marginTop: 8 }}>SVG Code</span>
                                            <textarea
                                              className={styles.formInput}
                                              value={item.svg || ''}
                                              onChange={(e) => handleUpdateItemSvg(idx, e.target.value)}
                                              placeholder="<svg>...</svg>"
                                              rows={2}
                                              style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }}
                                            />
                                            {item.svg && (
                                              <div
                                                style={{
                                                  height: 36,
                                                  width: item.imageWidth ? `${item.imageWidth}px` : 'auto',
                                                  minWidth: 36,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  border: '1px solid #cbd5e1',
                                                  borderRadius: 4,
                                                  background: '#fff',
                                                  padding: 2,
                                                  overflow: 'hidden'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: cleanSvgContent(item.svg) }}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  className={styles.btnOutline}
                                  onClick={handleAddItem}
                                  style={{ padding: '6px 12px', marginTop: 10, alignSelf: 'flex-start' }}
                                >
                                  + Add Sort Item
                                </button>
                              </div>

                              {/* Categorization Styling Options */}
                              <div className={styles.formGroup} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                <label className={styles.filterLabel} style={{ marginBottom: 10, display: 'block' }}>
                                  Categorization Card Styling
                                </label>
                                <div className={styles.formRow} style={{ gap: '20px' }}>
                                  <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label className={styles.filterLabel} style={{ fontSize: 12 }}>Card Style Variant</label>
                                    <select
                                      className={styles.formSelect}
                                      value={cardStyle}
                                      onChange={(e) => setCardStyle(e.target.value)}
                                    >
                                      <option value="">Standard Card (Default)</option>
                                      <option value="transparent_png">Transparent PNG (No borders/background)</option>
                                    </select>
                                  </div>
                                  <div className={styles.formGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 8 }}>
                                    <label className={styles.checkboxLabel} style={{ marginBottom: 0 }}>
                                      <input
                                        type="checkbox"
                                        className={styles.checkboxInput}
                                        checked={hideItemLabels}
                                        onChange={(e) => setHideItemLabels(e.target.checked)}
                                      />
                                      Hide Text Labels (Images Only)
                                    </label>
                                    {layoutMode === 'hotspot' && (
                                      <label className={styles.checkboxLabel} style={{ marginBottom: 0 }}>
                                        <input
                                          type="checkbox"
                                          className={styles.checkboxInput}
                                          checked={showHotspotLabels}
                                          onChange={(e) => setShowHotspotLabels(e.target.checked)}
                                        />
                                        Show Hotspot Labels
                                      </label>
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}

                          {type === 'fillInTheBlank' && (() => {
                            const blankIds = extractBlankIds(parts, questionText);
                            if (blankIds.length > 1) {
                              return (
                                <div className={styles.formGroup}>
                                  <label className={styles.filterLabel}>
                                    Fill-In-The-Blank (Multi-Blank Answers Mapping)
                                  </label>
                                  <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 8 }}>
                                    Specify the correct value for each blank identifier found in your question content.
                                  </span>
                                  <div className={styles.blankAnswersContainer}>
                                    {blankIds.map((id) => (
                                      <div key={id} className={styles.blankAnswerRow}>
                                        <span className={styles.blankIdBadge}>
                                          {id}
                                        </span>
                                        <input
                                          type="text"
                                          className={styles.formInput}
                                          value={fibAnswers[id] || ''}
                                          onChange={(e) => {
                                            const updatedVal = e.target.value;
                                            const updatedFib = { ...fibAnswers, [id]: updatedVal };
                                            setFibAnswers(updatedFib);
                                            setCorrectAnswer(JSON.stringify(updatedFib));
                                            ignoreDirtyChange.current = false;
                                            setIsDirty(true);
                                          }}
                                          placeholder={`Correct value for [[${id}]]`}
                                          style={{ flex: 1 }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } else {
                              const singleBlankId = blankIds.length === 1 ? blankIds[0] : 'ans';
                              return (
                                <div className={styles.formGroup}>
                                  <label className={styles.filterLabel}>Correct Answer Phrase</label>
                                  <input 
                                    type="text" 
                                    className={styles.formInput} 
                                    value={fibAnswers[singleBlankId] || correctAnswer} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCorrectAnswer(val);
                                      setFibAnswers({ [singleBlankId]: val });
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }}
                                    placeholder="Type exact answer match..."
                                  />
                                </div>
                              );
                            }
                          })()}

                          {type !== 'mcq' && type !== 'mcq_hotspot' && type !== 'categorizationv2' && type !== 'categorization' && type !== 'fillInTheBlank' && (
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Correct Answer Phrase</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={correctAnswer} 
                                onChange={(e) => {
                                  setCorrectAnswer(e.target.value);
                                  ignoreDirtyChange.current = false;
                                  setIsDirty(true);
                                }}
                                placeholder="Type exact answer match..."
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SECTION 4: VOICE & AUDIO */}
                    <div className={styles.accordionGroup}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setCollapsedSections(prev => ({ ...prev, audio: !prev.audio }))}
                      >
                        <span>4. Voice & Speech Synthesis</span>
                        <span>{collapsedSections.audio ? '▼' : '▲'}</span>
                      </button>

                      {!collapsedSections.audio && (
                        <div className={styles.accordionBody}>
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Voice Actor profile</label>
                              <select 
                                className={styles.formSelect} 
                                value={getNormalizedVoiceValue(voice)} 
                                onChange={(e) => setVoice(e.target.value)}
                              >
                                <optgroup label="Gemini Studio Voices (High Expressive)">
                                  <option value="gemini:Puck">Puck (Gemini - friendly boy)</option>
                                  <option value="gemini:Kore">Kore (Gemini - warm female)</option>
                                  <option value="gemini:Charon">Charon (Gemini - calm male)</option>
                                  <option value="gemini:Fenrir">Fenrir (Gemini - deep male)</option>
                                </optgroup>
                                <optgroup label="Piper Local Voices (Cost Saving)">
                                  <option value="piper:en_US-ryan-medium">Ryan Medium (Piper - male)</option>
                                  <option value="piper:en_US-amy-medium">Amy Medium (Piper - female)</option>
                                  <option value="piper:en_US-joe-medium">Joe Medium (Piper - male)</option>
                                  <option value="piper:en_US-lessac-medium">Lessac Medium (Piper - female)</option>
                                  <option value="piper:en_US-ryan-high">Ryan High (Piper - high quality male)</option>
                                </optgroup>
                              </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>R2 CDN Audio URL</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={audioUrl} 
                                onChange={(e) => setAudioUrl(e.target.value)}
                                placeholder="No R2 audio synced yet"
                                disabled
                              />
                            </div>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.filterLabel}>Speech Generation Mode</label>
                            <select 
                              className={styles.formSelect} 
                              value={generateAudioCheckbox} 
                              onChange={(e) => setGenerateAudioCheckbox(e.target.value)}
                            >
                              <option value="all">Generate Audio (Question & Options)</option>
                              <option value="questionOnly">Generate Audio (Question Text Only)</option>
                              <option value="none">Do Not Generate Audio (Question Document Only)</option>
                            </select>
                          </div>

                          <div className={styles.formRow} style={{ marginTop: '10px', gap: '20px' }}>
                            <label className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                className={styles.checkboxInput} 
                                checked={readable} 
                                onChange={(e) => setReadable(e.target.checked)}
                              />
                              TTS Question Reader (readable)
                            </label>

                            <label className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                className={styles.checkboxInput} 
                                checked={readOptions} 
                                onChange={(e) => setReadOptions(e.target.checked)}
                              />
                              TTS Options Reader (readOptions)
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 5: METADATA */}
                    <div className={styles.accordionGroup}>
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => setCollapsedSections(prev => ({ ...prev, metadata: !prev.metadata }))}
                      >
                        <span>5. Curriculum Metadata</span>
                        <span>{collapsedSections.metadata ? '▼' : '▲'}</span>
                      </button>

                      {!collapsedSections.metadata && (
                        <div className={styles.accordionBody}>
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Tags (comma-separated)</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={tags} 
                                onChange={(e) => setTags(e.target.value)} 
                                placeholder="e.g. grammar, nouns, gradeschool"
                              />
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Estimated Grade</label>
                              <select 
                                className={styles.formSelect} 
                                value={estimatedGrade} 
                                onChange={(e) => setEstimatedGrade(e.target.value)}
                              >
                                <option value="">Select Grade Level...</option>
                                <option value="Kindergarten">Kindergarten</option>
                                <option value="Grade 1">Grade 1</option>
                                <option value="Grade 2">Grade 2</option>
                                <option value="Grade 3">Grade 3</option>
                                <option value="Grade 4">Grade 4</option>
                                <option value="Grade 5">Grade 5</option>
                                <option value="Grade 6">Grade 6</option>
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="High School">High School</option>
                              </select>
                            </div>
                          </div>

                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Time Estimate (seconds)</label>
                              <input 
                                type="number" 
                                className={styles.formInput} 
                                value={timeEstimate} 
                                onChange={(e) => setTimeEstimate(e.target.value)} 
                                placeholder="e.g. 30"
                              />
                            </div>
                            
                            <div className={styles.formGroup}>
                              <label className={styles.filterLabel}>Source / Curriculum Mapping</label>
                              <input 
                                type="text" 
                                className={styles.formInput} 
                                value={sourceMapping} 
                                onChange={(e) => setSourceMapping(e.target.value)} 
                                placeholder="e.g. CCSS.ELA-LITERACY.L.3.1.A"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* MODE B: PASTE & PARSE */}
                {authoringMode === 'paste' && (
                  <div className={styles.parseWorkspaceContainer}>
                    <div className={styles.parseInstructions}>
                      <h4>Smart Text Ingest Instructions</h4>
                      <p>Paste a raw question string below. The system will parse question details, choices, correct answers, and explanations dynamically.</p>
                      <pre className={styles.parseFormatExample}>
{`Question: What is 5 + 7?
A. 10
B. 12
C. 14
Correct: B
Explanation: 5 plus 7 is equal to 12.`}
                      </pre>
                    </div>

                    <div className={styles.formGroup} style={{ marginTop: 16 }}>
                      <label className={styles.filterLabel}>Raw Question Text</label>
                      <textarea
                        className={styles.textareaInput}
                        style={{ minHeight: 200, fontFamily: 'monospace' }}
                        value={rawTextToParse}
                        onChange={(e) => setRawTextToParse(e.target.value)}
                        placeholder="Paste question text here..."
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.btnSolid}
                      style={{ marginTop: 12, alignSelf: 'flex-start' }}
                      onClick={handleParseQuestion}
                    >
                      Parse & Load into Builder
                    </button>
                  </div>
                )}

                {/* MODE C: IMPORT JSON */}
                {authoringMode === 'import' && (
                  <div className={styles.importWorkspaceContainer}>
                    <div className={styles.parseInstructions}>
                      <h4>JSON Question Schema Import</h4>
                      <p>Import questions directly via valid WEXLS JSON schema format.</p>
                    </div>

                    <div className={styles.formRow} style={{ marginTop: 16 }}>
                      <div className={styles.formGroup}>
                        <label className={styles.filterLabel}>Direct JSON Input</label>
                        <textarea
                          className={styles.textareaInput}
                          style={{ minHeight: 180, fontFamily: 'monospace' }}
                          value={jsonTextToImport}
                          onChange={(e) => setJsonTextToImport(e.target.value)}
                          placeholder={`{
  "subject": "english",
  "topic": "grammar",
  "skillId": "nouns",
  "type": "mcq",
  "questionText": "Select the noun.",
  "options": [
    {"label": "run", "isCorrect": false},
    {"label": "dog", "isCorrect": true}
  ]
}`}
                        />
                      </div>

                      <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label className={styles.filterLabel}>Upload JSON Schema File</label>
                        <div className={styles.uploadDropZone}>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleJsonFileUpload}
                            style={{ display: 'none' }}
                            id="json-file-input"
                          />
                          <label htmlFor="json-file-input" className={styles.uploadLabelBtn}>
                            📁 Choose JSON file
                          </label>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            Supports single question JSON objects
                          </span>
                        </div>

                        {jsonValidationError && (
                          <div className={styles.validationErrorCard}>
                            <strong>Import Error:</strong>
                            <p>{jsonValidationError}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.btnSolid}
                      style={{ marginTop: 12, alignSelf: 'flex-start' }}
                      onClick={handleImportJSON}
                    >
                      Validate & Import Schema
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* Column 3: Live Student Practice Preview (Sticky) */}
            <aside className={styles.previewStickyColumn}>
              <div className={styles.previewConfigBar}>
                <span className={styles.previewConfigTitle}>Device view</span>
                <div className={styles.deviceButtonsGroup}>
                  <button
                    type="button"
                    className={`${styles.deviceBtn} ${previewDevice === 'mobile' ? styles.deviceBtnActive : ''}`}
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    Mobile
                  </button>
                  <button
                    type="button"
                    className={`${styles.deviceBtn} ${previewDevice === 'tablet' ? styles.deviceBtnActive : ''}`}
                    onClick={() => setPreviewDevice('tablet')}
                  >
                    Tablet
                  </button>
                  <button
                    type="button"
                    className={`${styles.deviceBtn} ${previewDevice === 'desktop' ? styles.deviceBtnActive : ''}`}
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    Desktop
                  </button>
                </div>
              </div>

              {/* Simulation States Row */}
              <div className={styles.simulateStatesRow}>
                <span className={styles.previewConfigTitle}>Simulation states</span>
                <div className={styles.simulateButtonsGroup}>
                  <button
                    type="button"
                    className={`${styles.simulateBtn} ${previewSimulateState === 'correct' ? styles.simulateBtnCorrectActive : ''}`}
                    onClick={handleSimulateCorrect}
                  >
                    Simulate Correct
                  </button>
                  <button
                    type="button"
                    className={`${styles.simulateBtn} ${previewSimulateState === 'wrong' ? styles.simulateBtnWrongActive : ''}`}
                    onClick={handleSimulateWrong}
                  >
                    Simulate Wrong
                  </button>
                </div>
              </div>

              <div 
                className={`${styles.studentCardFrame} ${
                  previewDevice === 'mobile' ? styles.frameMobile : 
                  previewDevice === 'tablet' ? styles.frameTablet : styles.frameDesktop
                }`}
              >
                <div className={styles.studentCardHeader}>
                  <span>Live Student Practice Preview</span>
                  <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Mock UI</span>
                </div>
                
                <div className={styles.studentCardBody}>
                  <div className={styles.previewStudentWrapper}>
                    <QuestionRenderer
                      question={authoringMockQuestion}
                      userAnswer={previewAnswer}
                      onAnswer={setPreviewAnswer}
                      isAnswered={previewCheckResult !== null}
                      isCorrect={previewCheckResult === 'correct'}
                    />
                  </div>
                </div>

                <div className={styles.previewInteractiveRow}>
                  <div className={styles.previewButtonsRow}>
                    <button 
                      type="button"
                      className={styles.btnSolid} 
                      onClick={handleCheckAnswer}
                      disabled={previewAnswer === null || previewAnswer === undefined}
                      style={{ flex: 2 }}
                    >
                      Submit Answer
                    </button>
                    
                    <button 
                      type="button"
                      className={styles.btnOutline} 
                      onClick={handleTestPreviewSpeak}
                      title="Simulate student clicking speaker button"
                      style={{ flex: 1 }}
                    >
                      🔊 Speak
                    </button>
                    
                    <button 
                      type="button"
                      className={styles.btnOutline} 
                      onClick={() => {
                        setPreviewAnswer(null);
                        setPreviewCheckResult(null);
                        setPreviewSimulateState(null);
                        stopAllSpeech();
                      }}
                      style={{ flex: 1 }}
                    >
                      Reset
                    </button>
                  </div>

                  {previewCheckResult === 'correct' && (
                    <div className={`${styles.previewFeedbackBox} ${styles.previewFeedbackBoxSuccess}`}>
                      Correct! 🎉 Excellent work.
                    </div>
                  )}

                  {previewCheckResult === 'incorrect' && (
                    <div className={`${styles.previewFeedbackBox} ${styles.previewFeedbackBoxError}`}>
                      Incorrect. Try again!
                    </div>
                  )}

                  {explanation && previewCheckResult !== null && (
                    <div className={styles.explanationBlock}>
                      <strong>Explanation:</strong> {explanation}
                    </div>
                  )}
                </div>
              </div>
            </aside>

          </div>
        )}

        {/* --- VIEW 4: TTS CACHE MANAGER --- */}
        {activeTab === 'cache' && (
          <>
            <div className={styles.stickyFiltersBar} style={{ gridTemplateColumns: '4fr 1fr' }}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Search Cached Phrases</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="Query text content or hash ID..." 
                  value={cacheSearch}
                  onChange={(e) => setCacheSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className={styles.btnDanger} 
                  onClick={handleClearAllCache}
                  disabled={cacheItems.length === 0}
                  style={{ width: '100%' }}
                >
                  Purge All Cache
                </button>
              </div>
            </div>

            {loadingCache ? (
              <div className={styles.emptyState}>
                <span className={styles.spinner} style={{ marginRight: 10 }}></span>
                Loading speech synthesis cache files...
              </div>
            ) : cacheItems.length === 0 ? (
              <div className={styles.emptyState}>
                No audio cache records found. Practice questions generate cache records automatically.
              </div>
            ) : (
              <>
                <div className={styles.tableContainer}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th style={{ width: '22%' }}>Hash ID</th>
                        <th>Original Text</th>
                        <th style={{ width: '10%' }}>Voice</th>
                        <th style={{ width: '28%' }}>R2 CDN Audio URL</th>
                        <th style={{ width: '6%', textAlign: 'center' }}>Play</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cacheItems.map((item) => (
                        <tr key={item._id}>
                          <td><code style={{ fontSize: 11 }}>{item._id}</code></td>
                          <td style={{ fontSize: 13 }}>{item.text}</td>
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 800 }}>{item.voice}</span>
                          </td>
                          <td>
                            {item.r2Url ? (
                              <a 
                                href={item.r2Url} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ fontSize: 11, wordBreak: 'break-all', textDecoration: 'underline' }}
                              >
                                {item.r2Url}
                              </a>
                            ) : (
                              <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 11 }}>Local cache only</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className={`${styles.iconPlayBtn} ${playingCacheId === item._id ? styles.iconPlayActive : ''}`} 
                              onClick={() => handlePlayCacheAudio(item._id, item.audioBase64)}
                              title="Listen to stored WAV stream"
                            >
                              {playingCacheId === item._id ? '■' : '▶'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className={`${styles.btnDanger} ${styles.btnCompact}`} 
                              onClick={() => handleDeleteCacheItem(item._id)}
                              title="Purge cache record for this phrase"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.paginationRow}>
                  <span className={styles.paginationText}>
                    Showing {cacheItems.length} of {cacheTotalCount} cached audio phrases (Page {cachePage} of {cacheTotalPages})
                  </span>
                  <div className={styles.paginationButtons}>
                    <button 
                      className={styles.btnOutline} 
                      onClick={() => setCachePage(p => Math.max(1, p - 1))} 
                      disabled={cachePage <= 1}
                    >
                      ◀ Prev
                    </button>
                    <button 
                      className={styles.btnOutline} 
                      onClick={() => setCachePage(p => Math.min(cacheTotalPages, p + 1))} 
                      disabled={cachePage >= cacheTotalPages}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* --- VIEW 5: CURRICULUM BUILDER --- */}
        {activeTab === 'curriculum' && (
          <div className={styles.currContainer}>
            <section className={styles.currHero}>
              <div>
                <p className={styles.currEyebrow}>WEXLS Operations</p>
                <h1>Curriculum Builder</h1>
                <p>
                  Create and manage subjects, topics, chapters, and skills without editing static configuration files.
                </p>
              </div>
              <div className={styles.currHeroActions}>
                <button type="button" onClick={loadCurrTree} disabled={currLoading || currSaving}>
                  Refresh Tree
                </button>
                <button type="button" className={styles.currPrimaryButton} onClick={() => startNewCurr('subject')}>
                  New Subject
                </button>
              </div>
            </section>

            {currStatus ? <div className={styles.currNotice}>{currStatus}</div> : null}
            {currError ? <div className={styles.currError}>{currError}</div> : null}

            <section className={styles.currLayout}>
              <aside className={styles.currPanel}>
                <div className={styles.currPanelHeader}>
                  <div>
                    <h2>Curriculum Tree</h2>
                    <p>{currLoading ? 'Loading...' : `${currFlatNodes.length} nodes`}</p>
                  </div>
                  <select value={currForm.type} onChange={(event) => startNewCurr(event.target.value)}>
                    {NODE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        New {type}
                      </option>
                    ))}
                  </select>
                </div>

                {currTree.length ? (
                  <ul className={styles.currTreeListRoot}>
                    {currTree.map((node) => (
                      <TreeNode
                        key={node.id}
                        node={node}
                        selectedId={currSelected?.id}
                        onSelect={selectCurrNode}
                        onChild={startChildCurr}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className={styles.currEmptyState}>
                    No backend curriculum nodes yet. Create a subject first.
                  </div>
                )}
              </aside>

              <section className={styles.currPanel}>
                <div className={styles.currPanelHeader}>
                  <div>
                    <h2>{currSelected ? 'Edit Node' : 'Create Node'}</h2>
                    <p>
                      {currSelected
                        ? `${currForm.type} / ${currForm.id}`
                        : 'Use stable ids like math, fractions, fractions-g5-add-like-fractions.'}
                    </p>
                  </div>
                  <div className={styles.currTypeTabs}>
                    {NODE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={currForm.type === type ? styles.currTypeTabActive : ''}
                        onClick={() => setCurrForm((current) => ({ ...current, type }))}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <section className={styles.currImportBox}>
                  <div>
                    <h3>Paste JSON</h3>
                    <p>Paste a subject, topic, chapter, skill, or question JSON to auto-fill this form.</p>
                  </div>
                  <textarea
                    value={currJsonInput}
                    onChange={(event) => setCurrJsonInput(event.target.value)}
                    rows={5}
                    spellCheck={false}
                    placeholder='{"type":"skill","id":"fractions-g5-add-like-fractions",...}'
                  />
                  <div className={styles.currActions}>
                    <button type="button" onClick={parseJsonToCurrForm} disabled={!currJsonInput.trim() || currSaving}>
                      Parse to form
                    </button>
                    <button type="button" onClick={() => setCurrJsonInput('')} disabled={!currJsonInput || currSaving}>
                      Clear JSON
                    </button>
                  </div>
                </section>

                <form className={styles.currForm} onSubmit={saveCurrNode}>
                  <div className={styles.currFormGrid}>
                    <label>
                      Title
                      <input name="title" value={currForm.title} onChange={updateCurrField} placeholder="Fractions" />
                    </label>
                    <label>
                      Stable id
                      <input name="id" value={currForm.id} onChange={updateCurrField} placeholder="fractions" />
                    </label>
                    <label>
                      Subject id
                      <input name="subjectId" value={currForm.subjectId} onChange={updateCurrField} placeholder="math" />
                    </label>
                    <label>
                      Topic id
                      <input name="topicId" value={currForm.topicId} onChange={updateCurrField} placeholder="fractions" />
                    </label>
                    <label>
                      Chapter id
                      <input name="chapterId" value={currForm.chapterId} onChange={updateCurrField} placeholder="fraction-operations" />
                    </label>
                    <label>
                      Parent id
                      <input name="parentId" value={currForm.parentId} onChange={updateCurrField} placeholder="math" />
                    </label>
                    <label>
                      Skill id
                      <input name="skillId" value={currForm.skillId} onChange={updateCurrField} placeholder="fractions-g5-add-like-fractions" />
                    </label>
                    <label>
                      Code
                      <input name="code" value={currForm.code} onChange={updateCurrField} placeholder="G5.FR.1" />
                    </label>
                    <label>
                      Grade
                      <input name="grade" value={currForm.grade} onChange={updateCurrField} inputMode="numeric" placeholder="5" />
                    </label>
                    <label>
                      Order
                      <input name="order" value={currForm.order} onChange={updateCurrField} inputMode="numeric" placeholder="10" />
                    </label>
                    <label>
                      Template id
                      <input name="templateId" value={currForm.templateId} onChange={updateCurrField} placeholder="fractions.add.like" />
                    </label>
                    <label>
                      Engine
                      <input name="engine" value={currForm.engine} onChange={updateCurrField} placeholder="fractions" />
                    </label>
                    <label>
                      Question type
                      <input name="questionType" value={currForm.questionType} onChange={updateCurrField} placeholder="fillInTheBlank" />
                    </label>
                    <label>
                      Status
                      <select name="status" value={currForm.status} onChange={updateCurrField}>
                        <option value="active">active</option>
                        <option value="draft">draft</option>
                        <option value="paused">paused</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Description
                    <textarea
                      name="description"
                      value={currForm.description}
                      onChange={updateCurrField}
                      rows={3}
                      placeholder="Short catalog description."
                    />
                  </label>

                  <div className={styles.currFormGrid}>
                    <label>
                      Prerequisites
                      <input
                        name="prerequisites"
                        value={currForm.prerequisites}
                        onChange={updateCurrField}
                        placeholder="equal_parts, fraction_visual_models"
                      />
                    </label>
                    <label>
                      Remediation
                      <input
                        name="remediation"
                        value={currForm.remediation}
                        onChange={updateCurrField}
                        placeholder="equal_parts"
                      />
                    </label>
                  </div>

                  <label>
                    Tags
                    <input name="tags" value={currForm.tags} onChange={updateCurrField} placeholder="visual, grade-5, fractions" />
                  </label>

                  <label>
                    Metadata JSON
                    <textarea name="metadata" value={currForm.metadata} onChange={updateCurrField} rows={8} spellCheck={false} />
                  </label>

                  <div className={styles.currActions}>
                    <button type="submit" className={styles.currPrimaryButton} disabled={currSaving}>
                      {currSaving ? 'Saving...' : currSelected ? 'Update node' : 'Create node'}
                    </button>
                    <button type="button" onClick={() => startNewCurr(currForm.type)} disabled={currSaving}>
                      Clear
                    </button>
                    {currSelected ? (
                      <button type="button" className={styles.currDangerButton} onClick={deleteSelectedCurr} disabled={currSaving}>
                        Delete
                      </button>
                    ) : null}
                  </div>
                </form>

                {currSelected && currSelected.type === 'skill' && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1.5px dashed var(--color-border)' }}>
                    <button 
                      type="button" 
                      className={styles.currPrimaryButton}
                      style={{ width: '100%', minHeight: '38px', backgroundColor: '#2563eb', color: '#ffffff', borderColor: '#0f172a' }}
                      onClick={() => {
                        setSubject(currSelected.subjectId || '');
                        setTopic(currSelected.topicId || '');
                        setSkillId(currSelected.id || currSelected.skillId || '');
                        if (currSelected.grade) {
                          setEstimatedGrade(`Grade ${currSelected.grade}`);
                        }
                        if (currSelected.questionType) {
                          const qType = currSelected.questionType.toLowerCase();
                          if (qType.includes('mcq') || qType.includes('choice')) {
                            setType('mcq');
                          } else if (qType.includes('blank') || qType.includes('fib')) {
                            setType('fillInTheBlank');
                          }
                        }
                        setActiveTab('authoring');
                        logActivity(`Switched to authoring question for skill: ${currSelected.title || currSelected.id}`, 'info');
                      }}
                    >
                      ⚡ Author Question for this Skill
                    </button>
                  </div>
                )}

                {currSelected ? (
                  <details className={styles.currPreview}>
                    <summary>Selected node JSON</summary>
                    <pre>{JSON.stringify(currSelected, null, 2)}</pre>
                  </details>
                ) : null}
              </section>
            </section>
          </div>
        )}

        {/* ─── IMAGE ASSETS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'images' && (() => {
          // ── helpers (defined inside render so they close over state) ──────
          const FMT_EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

          // ── URL import helpers ────────────────────────────────────────────
          function parseUrls(raw) {
            return raw
              .split(/[\n,]+/)
              .map(s => s.trim())
              .filter(s => s.startsWith('http'));
          }

          function loadUrlPreviews() {
            const urls = parseUrls(urlInput);
            if (!urls.length) return;
            const entries = urls.map((src, idx) => {
              const filename = src.split('/').pop() || 'image';
              const baseName = filename.replace(/\.[^.]+$/, '');
              const cleanBaseName = urlBaseName.trim() ? `${urlBaseName.trim()}${idx + 1}` : baseName;
              return {
                id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
                src,
                selected: true,
                status: 'preview',  // preview | importing | done | error
                r2Url: null,
                error: null,
                sizeBytes: null,
                customName: cleanBaseName,
              };
            });
            setUrlPreviews(entries);
          }

          function removeUrlFromInput(targetUrl) {
            const lines = urlInput.split(/[\n,]+/);
            const filtered = lines.filter(line => line.trim() !== targetUrl.trim());
            setUrlInput(filtered.join('\n'));
          }

          function removeUrlPreview(id) {
            setUrlPreviews(prev => prev.filter(e => e.id !== id));
          }


          async function importSelectedUrls() {
            const toImport = urlPreviews.filter(e => e.selected && (e.status === 'preview' || e.status === 'error'));
            if (!toImport.length) return;
            setUrlImporting(true);

            for (const entry of toImport) {
              setUrlPreviews(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'importing' } : e));
              try {
                const res = await fetch('/api/admin/fetch-url-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    url: entry.src, 
                    folder: imgFolder || 'images',
                    customName: entry.customName
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Import failed');
                setUrlPreviews(prev => prev.map(e =>
                  e.id === entry.id
                    ? { ...e, status: 'done', r2Url: data.r2Url, sizeBytes: data.sizeBytes }
                    : e
                ));
              } catch (err) {
                setUrlPreviews(prev => prev.map(e =>
                  e.id === entry.id ? { ...e, status: 'error', error: err.message } : e
                ));
              }
            }
            setUrlImporting(false);
          }

          async function copyToClipboard(text) {
            try { await navigator.clipboard.writeText(text); } catch {}
          }

          const urlSelectedCount = urlPreviews.filter(e => e.selected && (e.status === 'preview' || e.status === 'error')).length;
          const urlDoneCount = urlPreviews.filter(e => e.status === 'done').length;

          /** Client-side resize + compress a File → Blob
           *  Returns null for SVG (can't meaningfully rasterize to smaller) */
          function compressImage(file, maxWidth, quality, outputMime) {
            // SVGs are vector XML — skip canvas entirely
            if (file.type === 'image/svg+xml') return Promise.resolve(null);

            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = (e) => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                  let w = img.naturalWidth;
                  let h = img.naturalHeight;
                  if (w > maxWidth) {
                    h = Math.round((h * maxWidth) / w);
                    w = maxWidth;
                  }
                  const canvas = document.createElement('canvas');
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, w, h);
                  canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
                    outputMime,
                    quality / 100
                  );
                };
                img.src = e.target.result;
              };
              reader.readAsDataURL(file);
            });
          }

          /** Add picked files into state */
          function addFiles(fileList) {
            const newEntries = Array.from(fileList)
              .filter(f => f.type.startsWith('image/'))
              .map(f => ({
                id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
                file: f,
                status: 'pending',   // pending | compressing | uploading | done | error
                url: null,
                origKB: Math.round(f.size / 1024),
                outKB: null,
                previewUrl: URL.createObjectURL(f),
                error: null,
              }));
            setImgFiles(prev => [...prev, ...newEntries]);
          }

          /** Upload all pending files */
          async function uploadAll() {
            const pending = imgFiles.filter(e => e.status === 'pending' || e.status === 'error');
            if (!pending.length) return;
            setImgUploading(true);

            for (const entry of pending) {
              // 1. mark compressing
              setImgFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'compressing' } : e));

              const isSvg = entry.file.type === 'image/svg+xml';
              let uploadBlob;   // what actually gets sent
              let uploadMime;   // mime of what gets sent
              let uploadExt;    // extension of what gets sent
              let outKB;
              let usedOriginal = false;

              if (isSvg) {
                // SVGs: upload original as-is
                uploadBlob = entry.file;
                uploadMime = 'image/svg+xml';
                uploadExt  = 'svg';
                outKB      = entry.origKB;
                usedOriginal = true;
              } else {
                let compressed = null;
                try {
                  compressed = await compressImage(entry.file, imgMaxWidth, imgQuality, imgFormat);
                } catch (err) {
                  setImgFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'error', error: 'Compress failed: ' + err.message } : e));
                  continue;
                }

                // If compressed is bigger than original, use original instead
                if (compressed && compressed.size < entry.file.size) {
                  uploadBlob = compressed;
                  uploadMime = imgFormat;
                  uploadExt  = FMT_EXT[imgFormat] || 'webp';
                  outKB      = Math.round(compressed.size / 1024);
                } else {
                  uploadBlob = entry.file;
                  uploadMime = entry.file.type;
                  uploadExt  = entry.file.name.split('.').pop() || 'jpg';
                  outKB      = entry.origKB;
                  usedOriginal = true;
                }
              }

              setImgFiles(prev => prev.map(e => e.id === entry.id ? { ...e, outKB, usedOriginal, status: 'uploading' } : e));

              // 2. send to API
              try {
                const safeName = entry.file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
                const uploadFile = new File([uploadBlob], `${safeName}.${uploadExt}`, { type: uploadMime });

                const fd = new FormData();
                fd.append('file', uploadFile);
                fd.append('folder', imgFolder || 'images');

                const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
                const data = await res.json();

                if (!res.ok || data.errors?.length) {
                  throw new Error(data.errors?.[0]?.error || data.error || 'Upload failed');
                }

                const url = data.results?.[0]?.url;
                setImgFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'done', url, outKB, usedOriginal } : e));
              } catch (err) {
                setImgFiles(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'error', error: err.message } : e));
              }
            }
            setImgUploading(false);
          }

          function removeEntry(id) {
            setImgFiles(prev => prev.filter(e => e.id !== id));
          }

          function clearAll() {
            setImgFiles([]);
          }

          function startCropper(entry) {
            setCropTarget(entry);
            setCropBox({ x: 10, y: 10, w: 80, h: 80 });
          }

          function handleDragStart(e, mode) {
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setDragStart({
              clientX,
              clientY,
              x: cropBox.x,
              y: cropBox.y,
              w: cropBox.w,
              h: cropBox.h,
              mode
            });
          }

          function handleDragMove(e) {
            if (!dragStart || !containerRef.current) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const rect = containerRef.current.getBoundingClientRect();
            const dxPct = ((clientX - dragStart.clientX) / rect.width) * 100;
            const dyPct = ((clientY - dragStart.clientY) / rect.height) * 100;
            
            let nextX = dragStart.x;
            let nextY = dragStart.y;
            let nextW = dragStart.w;
            let nextH = dragStart.h;
            
            if (dragStart.mode === 'move') {
              nextX = Math.max(0, Math.min(100 - dragStart.w, dragStart.x + dxPct));
              nextY = Math.max(0, Math.min(100 - dragStart.h, dragStart.y + dyPct));
            } else if (dragStart.mode === 'se') {
              nextW = Math.max(10, Math.min(100 - dragStart.x, dragStart.w + dxPct));
              nextH = Math.max(10, Math.min(100 - dragStart.y, dragStart.h + dyPct));
            } else if (dragStart.mode === 'sw') {
              const limitX = dragStart.x + dragStart.w;
              nextX = Math.max(0, Math.min(limitX - 10, dragStart.x + dxPct));
              nextW = limitX - nextX;
              nextH = Math.max(10, Math.min(100 - dragStart.y, dragStart.h + dyPct));
            } else if (dragStart.mode === 'ne') {
              const limitY = dragStart.y + dragStart.h;
              nextW = Math.max(10, Math.min(100 - dragStart.x, dragStart.w + dxPct));
              nextY = Math.max(0, Math.min(limitY - 10, dragStart.y + dyPct));
              nextH = limitY - nextY;
            } else if (dragStart.mode === 'nw') {
              const limitX = dragStart.x + dragStart.w;
              const limitY = dragStart.y + dragStart.h;
              nextX = Math.max(0, Math.min(limitX - 10, dragStart.x + dxPct));
              nextW = limitX - nextX;
              nextY = Math.max(0, Math.min(limitY - 10, dragStart.y + dyPct));
              nextH = limitY - nextY;
            }
            
            setCropBox({ x: nextX, y: nextY, w: nextW, h: nextH });
          }

          function handleDragEnd() {
            setDragStart(null);
          }

          function applyCrop() {
            if (!cropTarget) return;
            const img = new Image();
            img.src = cropTarget.previewUrl;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              const cropX = (cropBox.x / 100) * img.naturalWidth;
              const cropY = (cropBox.y / 100) * img.naturalHeight;
              const cropW = (cropBox.w / 100) * img.naturalWidth;
              const cropH = (cropBox.h / 100) * img.naturalHeight;
              
              canvas.width = cropW;
              canvas.height = cropH;
              
              ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
              
              canvas.toBlob((blob) => {
                if (!blob) return;
                const croppedFile = new File([blob], cropTarget.file.name, {
                  type: cropTarget.file.type || 'image/jpeg',
                  lastModified: Date.now()
                });
                
                const croppedUrl = URL.createObjectURL(croppedFile);
                
                if (cropTarget.previewUrl && cropTarget.previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(cropTarget.previewUrl);
                }
                
                setImgFiles(prev => prev.map(item => {
                  if (item.id === cropTarget.id) {
                    return {
                      ...item,
                      file: croppedFile,
                      previewUrl: croppedUrl,
                      origKB: Math.round(croppedFile.size / 1024),
                      status: 'pending',
                      outBlob: null,
                      outKB: null,
                      url: null,
                      error: null
                    };
                  }
                  return item;
                }));
                
                setCropTarget(null);
              }, cropTarget.file.type || 'image/jpeg');
            };
          }

          async function deleteSelectedImages() {
            if (!selectedGalleryKeys.length) return;
            const confirmMsg = `Are you sure you want to permanently delete ${selectedGalleryKeys.length} selected image(s) from Cloudflare R2? This action cannot be undone.`;
            if (!window.confirm(confirmMsg)) return;

            setGalleryDeleting(true);
            setGalleryError('');
            try {
              const res = await fetch('/api/admin/delete-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keys: selectedGalleryKeys }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to delete images');
              
              setGalleryImages(prev => prev.filter(img => !selectedGalleryKeys.includes(img.key)));
              setSelectedGalleryKeys([]);
            } catch (err) {
              setGalleryError(err.message);
            } finally {
              setGalleryDeleting(false);
            }
          }

          function copyCategorizedMap() {
            const targets = selectedGalleryKeys.length > 0
              ? galleryImages.filter(img => selectedGalleryKeys.includes(img.key))
              : galleryImages;

            if (!targets.length) {
              setAlert({ type: 'error', text: "No images to categorize. Upload or select some images first!" });
              return;
            }

            const map = {};
            const assetsList = [];

            targets.forEach(img => {
              const filename = img.key.split('/').pop();
              const baseWithPrefix = filename.replace(/\.[^.]+$/, '');
              const cleanBase = baseWithPrefix.replace(/^\d+-/, '');
              const objectName = cleanBase.replace(/[-_]?\d+$/, '').toLowerCase();

              if (!map[objectName]) {
                map[objectName] = [];
              }
              map[objectName].push(img.url);

              // Auto-detect color from path or filename
              const lowerKey = img.key.toLowerCase();
              let detectedColor = 'none';
              const colors = ['red', 'green', 'yellow', 'blue', 'brown', 'orange', 'purple', 'grey', 'white'];
              
              // 1. Check directories or hyphens first for precise matching
              for (const col of colors) {
                if (lowerKey.includes(`/${col}/`) || lowerKey.includes(`-${col}`) || lowerKey.includes(`${col}-`)) {
                  detectedColor = col;
                  break;
                }
              }
              
              // 2. Fallback check for general substring matching
              if (detectedColor === 'none') {
                for (const col of colors) {
                  if (lowerKey.includes(col)) {
                    detectedColor = col;
                    break;
                  }
                }
              }

              const singular = objectName;
              const plural = objectName.endsWith('y') ? `${objectName.slice(0, -1)}ies` : `${objectName}s`;
              const firstLetter = objectName.charAt(0);

              assetsList.push({
                name: objectName,
                singular,
                plural,
                imageUrl: img.url,
                firstLetter,
                color: detectedColor !== 'none' ? detectedColor : undefined
              });
            });

            const formattedMap = JSON.stringify(map, null, 2);
            const formattedAssets = JSON.stringify(assetsList, null, 2);
            
            const clipboardPayload = `// === GROUPED URL MAP ===\n${formattedMap}\n\n// === READY-TO-PASTE assets.js ARRAY ===\n${formattedAssets}`;

            navigator.clipboard.writeText(clipboardPayload).then(() => {
              setAlert({ type: 'success', text: `Success! Categorized ${Object.keys(map).length} object(s) with ${targets.length} total image URLs and copied to clipboard as JS object and ready-to-paste assets array!` });
            }).catch(() => {
              setAlert({ type: 'error', text: "Failed to write to clipboard. Please copy manually." });
            });
          }

          async function copyToClipboard(text) {
            try { await navigator.clipboard.writeText(text); } catch {}
          }

          const pendingCount = imgFiles.filter(e => e.status === 'pending' || e.status === 'error').length;
          const doneCount = imgFiles.filter(e => e.status === 'done').length;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* ── Sub-tab switcher ── */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)' }}>
                {[['upload', '📁 Upload Files'], ['urls', '🔗 Import from URLs'], ['gallery', '🖼 R2 Gallery'], ['autolink', '🔗 Auto-Link Vocabulary']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setImgSubTab(key)}
                    style={{
                      padding: '10px 20px',
                      fontSize: 13, fontWeight: 800,
                      background: imgSubTab === key ? 'var(--color-border)' : 'var(--bg-primary)',
                      color: imgSubTab === key ? 'var(--bg-primary)' : 'var(--color-text-main)',
                      border: '1.5px solid var(--color-border)',
                      borderBottom: imgSubTab === key ? '2px solid var(--color-border)' : '2px solid transparent',
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      marginBottom: -2,
                      textTransform: 'uppercase',
                      transition: 'all 0.1s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ════════════════════════════════════════════════════════════ */}
              {/* ── URL IMPORT MODE ────────────────────────────────────────── */}
              {/* ════════════════════════════════════════════════════════════ */}
              {imgSubTab === 'urls' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Input + controls row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>

                    {/* Left: textarea + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Paste image URLs (one per line or comma-separated)</label>
                        <textarea
                          className={styles.formInput}
                          rows={10}
                          placeholder={`https://cdn-icons-png.flaticon.com/128/1343/1343799.png\nhttps://cdn-icons-png.flaticon.com/128/7256/7256138.png\n...`}
                          value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          style={{ resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.6, height: 220 }}
                        />
                      </div>

                      {/* Folder picker (shared state) */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>R2 Destination Folder</label>
                        <select
                          className={styles.formSelect}
                          value={imgFolderPreset}
                          onChange={e => {
                            const v = e.target.value;
                            setImgFolderPreset(v);
                            if (v !== '__custom__') setImgFolder(v);
                          }}
                        >
                          <optgroup label="── General ──────────────────">
                            <option value="images">📁 images</option>
                            <option value="images/uploads">📁 images/uploads</option>
                          </optgroup>
                          <optgroup label="── LKG / English ─────────────">
                            <option value="images/lkg">🔤 images/lkg</option>
                            <option value="images/lkg/animals">🐾 images/lkg/animals</option>
                            <option value="images/lkg/fruits">🍎 images/lkg/fruits</option>
                            <option value="images/lkg/vehicles">🚗 images/lkg/vehicles</option>
                            <option value="images/lkg/things">🧸 images/lkg/things</option>
                            <option value="images/lkg/letters">🔡 images/lkg/letters</option>
                          </optgroup>
                          <optgroup label="── Math ──────────────────────">
                            <option value="images/math">🔢 images/math</option>
                            <option value="images/math/shapes">📐 images/math/shapes</option>
                            <option value="images/math/diagrams">📊 images/math/diagrams</option>
                          </optgroup>
                          <optgroup label="── Questions / Content ────────">
                            <option value="images/questions">❓ images/questions</option>
                            <option value="images/icons">🔷 images/icons</option>
                            <option value="images/backgrounds">🖼 images/backgrounds</option>
                            <option value="images/thumbnails">🖼 images/thumbnails</option>
                          </optgroup>
                          <optgroup label="── Custom ────────────────────">
                            <option value="__custom__">✏️ Custom path…</option>
                          </optgroup>
                        </select>
                        {imgFolderPreset === '__custom__' && (
                          <input
                            type="text" className={styles.formInput}
                            placeholder="e.g. images/science/grade3"
                            value={imgFolderCustom} style={{ marginTop: 6 }}
                            onChange={e => { setImgFolderCustom(e.target.value); setImgFolder(e.target.value || 'images'); }}
                          />
                        )}
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
                          R2: <span style={{ color: 'var(--color-primary)' }}>{imgFolder || 'images'}/</span>timestamp-filename.ext
                        </div>
                      </div>

                      {/* Optional Base Name prefix */}
                      <div className={styles.filterGroup} style={{ marginBottom: 16 }}>
                        <label className={styles.filterLabel}>Optional Base Name Prefix (e.g. "grapes" ──► grapes1, grapes2…)</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="e.g. grapes"
                          value={urlBaseName}
                          onChange={e => {
                            const val = e.target.value;
                            setUrlBaseName(val);
                            const trimmed = val.trim();
                            // Update on-the-fly sequentially or fall back to original name if cleared
                            setUrlPreviews(prev => prev.map((item, idx) => {
                              const filename = item.src.split('/').pop() || 'image';
                              const originalBase = filename.replace(/\.[^.]+$/, '');
                              return {
                                ...item,
                                customName: trimmed ? `${trimmed}${idx + 1}` : originalBase
                              };
                            }));
                          }}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          className={styles.btnSolid}
                          onClick={loadUrlPreviews}
                          disabled={!urlInput.trim()}
                        >
                          👁 Preview ({parseUrls(urlInput).length} URLs)
                        </button>
                        {urlPreviews.length > 0 && (
                          <>
                            <button
                              className={styles.btnSolid}
                              style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                              onClick={importSelectedUrls}
                              disabled={urlImporting || urlSelectedCount === 0}
                            >
                              {urlImporting ? '⏳ Importing…' : `⬆ Re-host ${urlSelectedCount} to R2`}
                            </button>
                            <button
                              className={styles.btnOutline}
                              onClick={() => setUrlPreviews(prev => prev.map(e => ({ ...e, selected: true })))}
                            >✓ All</button>
                            <button
                              className={styles.btnOutline}
                              onClick={() => setUrlPreviews(prev => prev.map(e => ({ ...e, selected: false })))}
                            >✗ None</button>
                            <button
                              className={styles.btnOutline}
                              onClick={() => { setUrlPreviews([]); setUrlInput(''); }}
                            >🗑 Clear</button>
                          </>
                        )}
                      </div>

                      {/* Stats row */}
                      {urlPreviews.length > 0 && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', gap: 16 }}>
                          <span>Total: {urlPreviews.length}</span>
                          <span style={{ color: 'var(--color-success)' }}>✓ Done: {urlDoneCount}</span>
                          <span>Selected: {urlSelectedCount}</span>
                          {urlPreviews.filter(e => e.status === 'error').length > 0 && (
                            <span style={{ color: 'var(--color-danger)' }}>⚠ Errors: {urlPreviews.filter(e => e.status === 'error').length}</span>
                          )}
                        </div>
                      )}

                      {/* Copy all R2 URLs */}
                      {urlDoneCount > 0 && (
                        <button
                          className={styles.btnOutline}
                          style={{ width: 'fit-content' }}
                          onClick={() => copyToClipboard(urlPreviews.filter(e => e.r2Url).map(e => e.r2Url).join('\n'))}
                        >
                          📋 Copy All R2 URLs ({urlDoneCount})
                        </button>
                      )}
                    </div>

                    {/* Right: Live preview panel */}
                    <div style={{
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      maxHeight: 520,
                      overflowY: 'auto',
                      position: 'sticky',
                      top: 80,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        👁 Live Preview ({parseUrls(urlInput).length} URLs detected)
                      </div>
                      {parseUrls(urlInput).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                          Paste URLs on the left to preview
                        </div>
                      )}
                      {parseUrls(urlInput).map((src, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 10px',
                          background: 'var(--bg-primary)',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                        }}>
                          <img
                            src={src}
                            alt=""
                            style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 4, flexShrink: 0, background: '#f8fafc', border: '1px solid #f1f5f9' }}
                            onError={e => { e.target.style.opacity = '0.2'; }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                              {src.split('/').pop()}
                            </div>
                            <div style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {src}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => copyToClipboard(src)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8', padding: 2 }}
                              title="Copy source URL"
                            >📋</button>
                            <button
                              onClick={() => removeUrlFromInput(src)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 11,
                                color: '#ef4444',
                                fontWeight: 'bold',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Remove URL"
                            >✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Imported cards grid ── */}
                  {urlPreviews.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                        Import Queue — {urlPreviews.length} images
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 12,
                      }}>
                        {urlPreviews.map(entry => {
                          const statusColor = {
                            preview: 'var(--color-text-muted)',
                            importing: 'var(--color-primary)',
                            done: 'var(--color-success)',
                            error: 'var(--color-danger)',
                          }[entry.status];

                          const statusLabel = {
                            preview: 'PENDING',
                            importing: 'IMPORTING…',
                            done: 'DONE ✓',
                            error: 'ERROR',
                          }[entry.status];

                          return (
                            <div
                              key={entry.id}
                              onClick={() => {
                                if (entry.status === 'importing') return;
                                setUrlPreviews(prev => prev.map(e =>
                                  e.id === entry.id ? { ...e, selected: !e.selected } : e
                                ));
                              }}
                              style={{
                                display: 'flex', flexDirection: 'column',
                                border: `2px solid ${entry.selected ? (entry.status === 'done' ? '#86efac' : 'var(--color-primary)') : '#e2e8f0'}`,
                                borderRadius: 8,
                                overflow: 'hidden',
                                background: entry.selected ? '#f0f9ff' : 'var(--bg-primary)',
                                cursor: entry.status === 'importing' ? 'wait' : 'pointer',
                                transition: 'all 0.15s',
                                position: 'relative',
                              }}
                            >
                              {/* Checkbox overlay */}
                              <div style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 18, height: 18,
                                borderRadius: '50%',
                                background: entry.selected ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)',
                                border: `2px solid ${entry.selected ? 'var(--color-primary)' : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: 'white', fontWeight: 900,
                                zIndex: 2,
                              }}>
                                {entry.selected ? '✓' : ''}
                              </div>

                              {/* Remove button */}
                              <button
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  removeUrlPreview(entry.id);
                                }}
                                style={{
                                  position: 'absolute', top: 6, left: 6,
                                  width: 18, height: 18,
                                  borderRadius: '50%',
                                  background: 'rgba(254, 226, 226, 0.9)',
                                  border: '1px solid #fee2e2',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, color: '#ef4444', fontWeight: 'bold',
                                  cursor: 'pointer',
                                  zIndex: 3,
                                }}
                                title="Remove from queue"
                              >
                                ✕
                              </button>

                              {/* Image */}
                              <div style={{ background: '#f8fafc', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
                                <img
                                  src={entry.src}
                                  alt=""
                                  style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain' }}
                                  onError={e => { e.target.style.opacity = '0.2'; }}
                                />
                              </div>

                                {/* Info */}
                                <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: statusColor, textTransform: 'uppercase' }}>
                                    {statusLabel}
                                  </div>
                                  <div
                                    style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}
                                    onClick={ev => ev.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      placeholder="Custom Name"
                                      value={entry.customName || ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setUrlPreviews(prev => prev.map(item => 
                                          item.id === entry.id ? { ...item, customName: val } : item
                                        ));
                                      }}
                                      disabled={entry.status === 'importing' || entry.status === 'done'}
                                      style={{
                                        fontSize: 10,
                                        padding: '2px 4px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 4,
                                        background: 'var(--bg-primary)',
                                        color: 'var(--color-text-main)',
                                        width: '100%',
                                        fontWeight: 'bold',
                                      }}
                                    />
                                  </div>
                                  <div style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', marginTop: 2 }} title={entry.src}>
                                    src: {entry.src}
                                  </div>
                                {entry.sizeBytes && (
                                  <div style={{ fontSize: 9, color: 'var(--color-success)', fontWeight: 700 }}>
                                    {Math.round(entry.sizeBytes / 1024)} KB
                                  </div>
                                )}
                                {entry.status === 'error' && (
                                  <div style={{ fontSize: 9, color: 'var(--color-danger)', fontWeight: 700 }}>{entry.error}</div>
                                )}
                                {entry.r2Url && (
                                  <button
                                    className={styles.btnOutline}
                                    style={{ fontSize: 9, padding: '2px 6px', marginTop: 2 }}
                                    onClick={ev => { ev.stopPropagation(); copyToClipboard(entry.r2Url); }}
                                  >📋 Copy R2 URL</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ════════════════════════════════════════════════════════════ */}
              {/* ── R2 GALLERY MODE ────────────────────────────────────────── */}
              {/* ════════════════════════════════════════════════════════════ */}
              {imgSubTab === 'gallery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Controls header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 20,
                    flexWrap: 'wrap',
                    padding: 16,
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: '1.5px solid var(--color-border)',
                  }}>
                    {/* Prefix/Folder select filter */}
                    <div className={styles.filterGroup} style={{ flex: 1, minWidth: 260, margin: 0 }}>
                      <label className={styles.filterLabel}>Filter by Folder Prefix</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <select
                          className={styles.formSelect}
                          value={galleryPrefix}
                          onChange={e => setGalleryPrefix(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="">📂 [All Bucket Root]</option>
                          <option value="images">📁 images</option>
                          <option value="images/uploads">📁 images/uploads</option>
                          <option value="images/lkg">🔤 images/lkg</option>
                          <option value="images/lkg/animals">🐾 images/lkg/animals</option>
                          <option value="images/lkg/fruits">🍎 images/lkg/fruits</option>
                          <option value="images/lkg/vehicles">🚗 images/lkg/vehicles</option>
                          <option value="images/lkg/things">🧸 images/lkg/things</option>
                          <option value="images/lkg/letters">🔡 images/lkg/letters</option>
                          <option value="images/math">🔢 images/math</option>
                          <option value="images/math/shapes">📐 images/math/shapes</option>
                          <option value="images/math/diagrams">📊 images/math/diagrams</option>
                          <option value="images/questions">❓ images/questions</option>
                          <option value="images/icons">🔷 images/icons</option>
                          <option value="images/backgrounds">🖼 images/backgrounds</option>
                          <option value="images/thumbnails">🖼 images/thumbnails</option>
                        </select>
                        <button
                          className={styles.btnSolid}
                          onClick={fetchGalleryImages}
                          disabled={galleryLoading}
                        >
                          🔄 Refresh
                        </button>
                      </div>
                    </div>

                    {/* Multi-select and delete controls */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {galleryImages.length > 0 && (
                        <>
                          <button
                            className={styles.btnOutline}
                            onClick={() => setSelectedGalleryKeys(galleryImages.map(img => img.key))}
                          >
                            ✓ Select All
                          </button>
                          <button
                            className={styles.btnOutline}
                            onClick={() => setSelectedGalleryKeys([])}
                            disabled={selectedGalleryKeys.length === 0}
                          >
                            ✗ Deselect All
                          </button>
                          <button
                            className={styles.btnSolid}
                            onClick={copyCategorizedMap}
                            style={{
                              background: 'var(--color-primary)',
                              borderColor: 'var(--color-primary)',
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                            title="Categorize shown/selected images by filename and copy as JS Object Map"
                          >
                            📋 Copy JS Object Map
                          </button>
                        </>
                      )}
                      {selectedGalleryKeys.length > 0 && (
                        <button
                          className={styles.btnSolid}
                          style={{
                            background: 'var(--color-danger)',
                            borderColor: 'var(--color-danger)',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                          onClick={deleteSelectedImages}
                          disabled={galleryDeleting}
                        >
                          {galleryDeleting ? '⏳ Deleting…' : `🗑 Delete Selected (${selectedGalleryKeys.length})`}
                        </button>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        Found: <strong>{galleryImages.length}</strong>
                        {selectedGalleryKeys.length > 0 && (
                          <span> (Selected: <strong>{selectedGalleryKeys.length}</strong>)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {galleryLoading && (
                    <div style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--color-text-muted)', fontSize: 16 }}>
                      <div className={styles.spinner} style={{ margin: '0 auto 16px auto' }}></div>
                      Loading stored R2 images…
                    </div>
                  )}

                  {galleryError && (
                    <div style={{
                      padding: 16,
                      background: '#fef2f2',
                      border: '1.5px solid #fee2e2',
                      color: 'var(--color-danger)',
                      borderRadius: 8,
                      fontWeight: 700,
                    }}>
                      ⚠ {galleryError}
                    </div>
                  )}

                  {!galleryLoading && !galleryError && galleryImages.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '64px 32px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      border: '1.5px dashed var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}>
                      No images found in prefix folder: <strong>{galleryPrefix || '[Root]'}</strong>
                    </div>
                  )}

                  {!galleryLoading && !galleryError && galleryImages.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: 16,
                    }}>
                      {galleryImages.map(img => {
                        const selected = selectedGalleryKeys.includes(img.key);
                        return (
                          <div
                            key={img.key}
                            onClick={() => {
                              setSelectedGalleryKeys(prev =>
                                prev.includes(img.key)
                                  ? prev.filter(k => k !== img.key)
                                  : [...prev, img.key]
                              );
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              borderRadius: 12,
                              overflow: 'hidden',
                              background: selected ? '#f0f9ff' : 'var(--bg-primary)',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                              transition: 'all 0.2s',
                              position: 'relative',
                              cursor: 'pointer',
                            }}
                          >
                            {/* Checkbox overlay */}
                            <div
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedGalleryKeys(prev =>
                                  prev.includes(img.key)
                                    ? prev.filter(k => k !== img.key)
                                    : [...prev, img.key]
                                );
                              }}
                              style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 20, height: 20,
                                borderRadius: '50%',
                                background: selected ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)',
                                border: `2px solid ${selected ? 'var(--color-primary)' : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, color: 'white', fontWeight: 900,
                                zIndex: 2,
                                cursor: 'pointer',
                              }}
                            >
                              {selected ? '✓' : ''}
                            </div>

                            {/* Individual Quick Delete button */}
                            <button
                              onClick={(ev) => {
                                ev.stopPropagation();
                                const confirmMsg = `Are you sure you want to permanently delete "${img.key.split('/').pop()}" from Cloudflare R2?`;
                                if (!window.confirm(confirmMsg)) return;
                                
                                const deleteSingle = async () => {
                                  setGalleryDeleting(true);
                                  setGalleryError('');
                                  try {
                                    const res = await fetch('/api/admin/delete-images', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ keys: [img.key] }),
                                    });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error || 'Failed to delete image');
                                    
                                    setGalleryImages(prev => prev.filter(item => item.key !== img.key));
                                    setSelectedGalleryKeys(prev => prev.filter(key => key !== img.key));
                                  } catch (err) {
                                    setGalleryError(err.message);
                                  } finally {
                                    setGalleryDeleting(false);
                                  }
                                };
                                deleteSingle();
                              }}
                              style={{
                                position: 'absolute', top: 8, left: 8,
                                width: 20, height: 20,
                                borderRadius: '50%',
                                background: 'rgba(254, 226, 226, 0.9)',
                                border: '1px solid #fee2e2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, color: '#ef4444', fontWeight: 'bold',
                                cursor: 'pointer',
                                zIndex: 3,
                              }}
                              title="Delete image"
                            >
                              ✕
                            </button>

                            {/* Image preview frame */}
                            <div style={{
                              background: '#f8fafc',
                              padding: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: 160,
                              position: 'relative',
                              borderBottom: '1px solid #f1f5f9',
                            }}>
                              <img
                                src={img.url}
                                alt=""
                                style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain' }}
                                loading="lazy"
                                onError={e => { e.target.style.opacity = '0.2'; }}
                              />
                              {/* Format label overlay */}
                              <span style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                fontSize: 9,
                                fontWeight: 900,
                                background: 'rgba(15, 23, 42, 0.8)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                              }}>
                                {img.key.split('.').pop()}
                              </span>
                            </div>

                            {/* Info panel */}
                            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Filename */}
                                <div
                                  style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-main)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 28, lineHeight: 1.3 }}
                                  title={img.key.split('/').pop()}
                                >
                                  {img.key.split('/').pop()}
                                </div>
                                {/* Path key */}
                                <div
                                  style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                  title={img.key}
                                >
                                  key: {img.key}
                                </div>
                                {/* Metadata stats */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700, marginTop: 4 }}>
                                  <span>Size: {Math.round(img.size / 1024 * 10) / 10} KB</span>
                                  <span>{new Date(img.lastModified).toLocaleDateString()}</span>
                                </div>

                                {/* IXL Linguistic Schema Details */}
                                <div style={{
                                  marginTop: 8,
                                  padding: '6px 8px',
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  fontSize: 10,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}>Linguistic:</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                      {img.linguistics?.article} {img.linguistics?.singular} / {img.linguistics?.plural}
                                    </span>
                                  </div>
                                  {img.dimensions && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                                      <span style={{ color: 'var(--color-text-muted)' }}>Dimensions:</span>
                                      <span>{img.dimensions.width} × {img.dimensions.height} px</span>
                                    </div>
                                  )}
                                  {img.classification?.category && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                                      <span style={{ color: 'var(--color-text-muted)' }}>Category:</span>
                                      <span style={{ textTransform: 'capitalize' }}>{img.classification.category}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Tags Badges */}
                                {img.classification?.tags && img.classification.tags.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                    {img.classification.tags.slice(0, 3).map(tag => (
                                      <span
                                        key={tag}
                                        style={{
                                          fontSize: 8,
                                          fontWeight: 800,
                                          background: '#e0f2fe',
                                          color: '#0369a1',
                                          padding: '2px 6px',
                                          borderRadius: 4,
                                          textTransform: 'lowercase'
                                        }}
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                    {img.classification.tags.length > 3 && (
                                      <span style={{ fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 800 }}>
                                        +{img.classification.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Action Row */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    className={styles.btnOutline}
                                    style={{ flex: 1, fontSize: 10, padding: '6px 0', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      copyToClipboard(img.url);
                                    }}
                                  >
                                    📋 Copy URL
                                  </button>
                                  <a
                                    href={img.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.btnOutline}
                                    style={{ flex: 1, fontSize: 10, padding: '6px 0', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none', color: 'var(--color-text-main)', background: 'var(--bg-secondary)', border: '1px solid var(--color-border)' }}
                                    onClick={(ev) => ev.stopPropagation()}
                                  >
                                    🔍 Full Size
                                  </a>
                                </div>
                                <button
                                  className={styles.btnOutline}
                                  style={{
                                    width: '100%', fontSize: 10, padding: '6px 0', height: 30,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    borderColor: 'var(--color-primary)', color: 'var(--color-primary)',
                                    background: 'rgba(59, 130, 246, 0.04)'
                                  }}
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    startEditMetadata(img);
                                  }}
                                >
                                  ✏️ Edit IXL Metadata
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* ── Edit Metadata Modal ── */}
                  {editingMetadataImg && (
                    <div style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9999,
                      padding: 24,
                    }}
                    onClick={() => setEditingMetadataImg(null)}
                    >
                      <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 16,
                        width: 'min(500px, 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}
                      onClick={e => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div style={{
                          padding: '16px 20px',
                          borderBottom: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>🏷️ Edit Image Metadata</h3>
                          <button
                            onClick={() => setEditingMetadataImg(null)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 18, color: 'var(--color-text-muted)',
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4, color: 'var(--color-text-muted)' }}>Article</label>
                              <input
                                type="text"
                                value={editForm.article}
                                onChange={e => setEditForm(prev => ({ ...prev, article: e.target.value }))}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--bg-primary)', color: 'var(--color-text-main)', fontSize: 13 }}
                                placeholder="a / an"
                              />
                            </div>
                            <div style={{ flex: 2 }}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4, color: 'var(--color-text-muted)' }}>Singular</label>
                              <input
                                type="text"
                                value={editForm.singular}
                                onChange={e => setEditForm(prev => ({ ...prev, singular: e.target.value }))}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--bg-primary)', color: 'var(--color-text-main)', fontSize: 13 }}
                                placeholder="e.g. cat"
                              />
                            </div>
                            <div style={{ flex: 2 }}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4, color: 'var(--color-text-muted)' }}>Plural</label>
                              <input
                                type="text"
                                value={editForm.plural}
                                onChange={e => setEditForm(prev => ({ ...prev, plural: e.target.value }))}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--bg-primary)', color: 'var(--color-text-main)', fontSize: 13 }}
                                placeholder="e.g. cats"
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4, color: 'var(--color-text-muted)' }}>Category</label>
                            <input
                              type="text"
                              value={editForm.category}
                              onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--bg-primary)', color: 'var(--color-text-main)', fontSize: 13 }}
                              placeholder="e.g. animals"
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4, color: 'var(--color-text-muted)' }}>Tags (comma separated)</label>
                            <input
                              type="text"
                              value={editForm.tags}
                              onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--bg-primary)', color: 'var(--color-text-main)', fontSize: 13 }}
                              placeholder="e.g. orange, cartoon, counter"
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{
                          padding: '16px 20px',
                          borderTop: '1px solid var(--color-border)',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 12,
                        }}>
                          <button
                            className={styles.btnOutline}
                            onClick={() => setEditingMetadataImg(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className={styles.btnSolid}
                            style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                            onClick={async () => {
                              try {
                                const payload = {
                                  key: editingMetadataImg.key,
                                  linguistics: {
                                    singular: editForm.singular,
                                    plural: editForm.plural,
                                    article: editForm.article,
                                  },
                                  classification: {
                                    category: editForm.category,
                                    tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
                                  }
                                };
                                const response = await fetch('/api/admin/update-image-metadata', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(payload),
                                });
                                if (!response.ok) throw new Error('Failed to update metadata');

                                // Update gallery state inline
                                setGalleryImages(prev => prev.map(img => {
                                  if (img.key === editingMetadataImg.key) {
                                    return {
                                      ...img,
                                      linguistics: payload.linguistics,
                                      classification: payload.classification,
                                    };
                                  }
                                  return img;
                                }));
                                setEditingMetadataImg(null);
                              } catch (err) {
                                alert(err.message);
                              }
                            }}
                          >
                            💾 Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ════════════════════════════════════════════════════════════ */}
              {/* ── FILE UPLOAD MODE (existing) ─────────────────────────── */}
              {/* ════════════════════════════════════════════════════════════ */}
              {imgSubTab === 'upload' && (
                <>

              {/* ── Settings strip ── */}
              <div className={styles.borderedPanel}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Upload Settings</h3>
                  {doneCount > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-success)' }}>
                      ✓ {doneCount} uploaded
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
                  {/* Max width */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Max Width (px)</label>
                    <select className={styles.formSelect} value={imgMaxWidth} onChange={e => setImgMaxWidth(Number(e.target.value))}>
                      <option value={400}>400 px — thumbnail</option>
                      <option value={800}>800 px — card</option>
                      <option value={1200}>1200 px — standard</option>
                      <option value={1920}>1920 px — full HD</option>
                      <option value={99999}>Original — no resize</option>
                    </select>
                  </div>

                  {/* Quality */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Quality — {imgQuality}%</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)' }}>50</span>
                      <input
                        type="range" min={50} max={100} step={5}
                        value={imgQuality}
                        onChange={e => setImgQuality(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)' }}>100</span>
                    </div>
                  </div>

                  {/* Output format */}
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Output Format</label>
                    <select className={styles.formSelect} value={imgFormat} onChange={e => setImgFormat(e.target.value)}>
                      <option value="image/webp">WebP (best compression)</option>
                      <option value="image/jpeg">JPEG (compatible)</option>
                      <option value="image/png">PNG (lossless)</option>
                    </select>
                  </div>

                  {/* R2 folder */}
                  <div className={styles.filterGroup} style={{ gridColumn: 'span 1' }}>
                    <label className={styles.filterLabel}>R2 Destination Folder</label>
                    {/* Preset picker */}
                    <select
                      className={styles.formSelect}
                      value={imgFolderPreset}
                      onChange={e => {
                        const v = e.target.value;
                        setImgFolderPreset(v);
                        if (v !== '__custom__') setImgFolder(v);
                      }}
                    >
                      <optgroup label="── General ──────────────────">
                        <option value="images">📁 images</option>
                        <option value="images/uploads">📁 images/uploads</option>
                      </optgroup>
                      <optgroup label="── LKG / English ─────────────">
                        <option value="images/lkg">🔤 images/lkg</option>
                        <option value="images/lkg/animals">🐾 images/lkg/animals</option>
                        <option value="images/lkg/fruits">🍎 images/lkg/fruits</option>
                        <option value="images/lkg/vehicles">🚗 images/lkg/vehicles</option>
                        <option value="images/lkg/things">🧸 images/lkg/things</option>
                        <option value="images/lkg/letters">🔡 images/lkg/letters</option>
                      </optgroup>
                      <optgroup label="── Math ──────────────────────">
                        <option value="images/math">🔢 images/math</option>
                        <option value="images/math/shapes">📐 images/math/shapes</option>
                        <option value="images/math/diagrams">📊 images/math/diagrams</option>
                      </optgroup>
                      <optgroup label="── Questions / Content ────────">
                        <option value="images/questions">❓ images/questions</option>
                        <option value="images/icons">🔷 images/icons</option>
                        <option value="images/backgrounds">🖼 images/backgrounds</option>
                        <option value="images/thumbnails">🖼 images/thumbnails</option>
                      </optgroup>
                      <optgroup label="── Custom ────────────────────">
                        <option value="__custom__">✏️ Custom path…</option>
                      </optgroup>
                    </select>

                    {/* Custom path input — revealed when custom is chosen */}
                    {imgFolderPreset === '__custom__' && (
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="e.g. images/science/grade3"
                        value={imgFolderCustom}
                        style={{ marginTop: 6 }}
                        onChange={e => {
                          const v = e.target.value;
                          setImgFolderCustom(v);
                          setImgFolder(v || 'images');
                        }}
                      />
                    )}

                    {/* Live preview of the final R2 key prefix */}
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
                      R2: <span style={{ color: 'var(--color-primary)' }}>{imgFolder || 'images'}/</span>timestamp-name.ext
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Drop zone ── */}
              <div
                onClick={() => imgFileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setImgDragOver(true); }}
                onDragLeave={() => setImgDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setImgDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                style={{
                  border: `2.5px dashed ${imgDragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 8,
                  background: imgDragOver ? '#eff6ff' : 'var(--bg-secondary)',
                  padding: '48px 32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                  {imgDragOver ? 'Drop images here!' : 'Drag & drop images here, or click to browse'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  JPEG · PNG · WebP · GIF · AVIF &nbsp;|&nbsp; Max 10 MB per file &nbsp;|&nbsp; Unlimited files
                </div>
                <input
                  ref={imgFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                />
              </div>

              {/* ── Action row ── */}
              {imgFiles.length > 0 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className={styles.btnSolid}
                    onClick={uploadAll}
                    disabled={imgUploading || pendingCount === 0}
                  >
                    {imgUploading
                      ? `⏳ Uploading…`
                      : `⬆ Upload ${pendingCount > 0 ? pendingCount : 'All'} Image${pendingCount !== 1 ? 's' : ''}`
                    }
                  </button>
                  <button className={styles.btnOutline} onClick={clearAll} disabled={imgUploading}>
                    🗑 Clear All
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                    {imgFiles.length} file{imgFiles.length !== 1 ? 's' : ''} queued
                    &nbsp;·&nbsp; {doneCount} done
                    {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
                  </span>
                </div>
              )}

              {/* ── File cards ── */}
              {imgFiles.length > 0 && (() => {
                const currentPreviewEntry = imgFiles.find(e => e.id === activeUploadPreview) || imgFiles[0];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
                    
                    {/* Left Column: Scrollable list of cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {imgFiles.map(entry => {
                        const statusColor = {
                          pending: 'var(--color-text-muted)',
                          compressing: '#d97706',
                          uploading: 'var(--color-primary)',
                          done: 'var(--color-success)',
                          error: 'var(--color-danger)',
                        }[entry.status] || 'var(--color-text-muted)';

                        const statusLabel = {
                          pending: 'PENDING',
                          compressing: 'COMPRESSING…',
                          uploading: 'UPLOADING…',
                          done: 'DONE ✓',
                          error: 'ERROR',
                        }[entry.status];

                        const isActive = entry.status === 'compressing' || entry.status === 'uploading';
                        const isHoveredPreview = currentPreviewEntry && currentPreviewEntry.id === entry.id;

                        return (
                          <div
                            key={entry.id}
                            onMouseEnter={() => setActiveUploadPreview(entry.id)}
                            onClick={() => setActiveUploadPreview(entry.id)}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '80px 1fr auto',
                              gap: 16,
                              alignItems: 'center',
                              background: isHoveredPreview ? '#f0f9ff' : 'var(--bg-primary)',
                              border: `1.5px solid ${isHoveredPreview ? 'var(--color-primary)' : (entry.status === 'error' ? 'var(--color-danger)' : entry.status === 'done' ? '#86efac' : 'var(--color-border)')}`,
                              borderRadius: 6,
                              padding: '12px 16px',
                              opacity: entry.status === 'done' ? 0.9 : 1,
                              cursor: 'pointer',
                              transition: 'all 0.1s',
                            }}
                          >
                            {/* Thumbnail */}
                            <img
                              src={entry.previewUrl}
                              alt=""
                              style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0' }}
                            />

                            {/* Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                                  {entry.file.name}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 900, color: statusColor, textTransform: 'uppercase', flexShrink: 0 }}>
                                  {statusLabel}
                                </span>
                              </div>

                              {/* Size info */}
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', gap: 12 }}>
                                <span>Original: {entry.origKB} KB</span>
                                {entry.outKB != null && (
                                  <>
                                    <span>→</span>
                                    <span style={{ color: entry.outKB < entry.origKB ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                      Output: {entry.outKB} KB
                                      {entry.origKB > 0 && ` (${Math.round((1 - entry.outKB / entry.origKB) * 100)}% saved)`}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Progress bar while active */}
                              {isActive && (
                                <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: entry.status === 'uploading' ? '70%' : '30%',
                                    background: 'var(--color-primary)',
                                    borderRadius: 2,
                                    animation: 'pulse 1.2s ease-in-out infinite',
                                  }} />
                                </div>
                              )}

                              {/* URL output */}
                              {entry.status === 'done' && entry.url && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onClick={ev => ev.stopPropagation()}>
                                  <code style={{
                                    fontSize: 11, fontFamily: 'ui-monospace, monospace',
                                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                                    borderRadius: 3, padding: '2px 6px',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    maxWidth: 340, display: 'inline-block',
                                  }}>
                                    {entry.url}
                                  </code>
                                  <button
                                    className={styles.btnOutline}
                                    style={{ padding: '2px 8px', fontSize: 11 }}
                                    onClick={() => copyToClipboard(entry.url)}
                                    title="Copy URL"
                                  >
                                    📋 Copy URL
                                  </button>
                                  <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}
                                  >
                                    ↗ Open
                                  </a>
                                </div>
                              )}

                              {/* Error */}
                              {entry.status === 'error' && (
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)' }}>
                                  ⚠ {entry.error}
                                </div>
                              )}
                            </div>

                            {/* Actions Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', alignSelf: 'flex-start' }} onClick={ev => ev.stopPropagation()}>
                              {/* Remove button */}
                              <button
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  removeEntry(entry.id);
                                }}
                                disabled={isActive}
                                style={{
                                  background: 'none', border: 'none', cursor: isActive ? 'not-allowed' : 'pointer',
                                  fontSize: 18, color: '#94a3b8', padding: 4, lineHeight: 1,
                                }}
                                title="Remove"
                              >
                                ×
                              </button>

                              {/* Crop button (only allowed for pending/error images) */}
                              {(entry.status === 'pending' || entry.status === 'error') && (
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    startCropper(entry);
                                  }}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 16, color: 'var(--color-primary)', padding: 4, lineHeight: 1,
                                  }}
                                  title="Crop image"
                                >
                                  ✂️
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column: Sticky Side Image Viewer */}
                    {currentPreviewEntry && (
                      <div style={{
                        border: '1.5px solid var(--color-border)',
                        borderRadius: 8,
                        background: 'var(--bg-secondary)',
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        position: 'sticky',
                        top: 80,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                          👁 Live Preview
                        </div>
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 240,
                          maxHeight: 320,
                          overflow: 'hidden',
                        }}>
                          <img
                            src={currentPreviewEntry.previewUrl}
                            alt=""
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div
                            style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-main)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}
                            title={currentPreviewEntry.file.name}
                          >
                            {currentPreviewEntry.file.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            Size: <strong>{currentPreviewEntry.origKB} KB</strong>
                            {currentPreviewEntry.outKB != null && (
                              <span> → <strong>{currentPreviewEntry.outKB} KB</strong></span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                            Type: <strong>{currentPreviewEntry.file.type}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* ── Done gallery ── */}
              {doneCount > 0 && (
                <div className={styles.borderedPanel}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Uploaded ({doneCount})</h3>
                    <button
                      className={styles.btnOutline}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => {
                        const urls = imgFiles.filter(e => e.done || e.status === 'done').map(e => e.url).filter(Boolean).join('\n');
                        copyToClipboard(urls);
                      }}
                    >
                      📋 Copy All URLs
                    </button>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 12,
                  }}>
                    {imgFiles.filter(e => e.status === 'done' && e.url).map(entry => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 6,
                          border: '1px solid #e2e8f0', borderRadius: 6,
                          overflow: 'hidden', background: '#f8fafc',
                          cursor: 'pointer',
                        }}
                        title={entry.url}
                        onClick={() => copyToClipboard(entry.url)}
                      >
                        <img
                          src={entry.previewUrl}
                          alt=""
                          style={{ width: '100%', height: 100, objectFit: 'cover' }}
                        />
                        <div style={{ padding: '4px 8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.file.name}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-success)' }}>
                            {entry.origKB} KB → {entry.outKB} KB
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textAlign: 'right' }}>
                            📋 click to copy
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                </>
              )} {/* end imgSubTab === 'upload' */}

              {/* ── AUTO-LINK VOCABULARY MODE ── */}
              {imgSubTab === 'autolink' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className={styles.borderedPanel} style={{ padding: 24 }}>
                    <div className={styles.panelHeader} style={{ marginBottom: 12 }}>
                      <h3 className={styles.panelTitle}>🔗 Auto-Link Vocabulary Images</h3>
                    </div>
                    <p style={{ margin: '0 0 20px 0', fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      This utility scans your English LKG vocabulary lists (from sight words, spotting pools, sentences, and rhyming families) inside <code>vocabulary.json</code> and queries the database catalog for matching drawings or icons. Any matches found will automatically have their R2 hosted URLs linked into the config file.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>
                        <input
                          type="checkbox"
                          checked={overwriteExistingLinks}
                          onChange={(e) => setOverwriteExistingLinks(e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                        />
                        Overwrite existing image URL mappings
                      </label>

                      <button
                        className={styles.btnSolid}
                        style={{
                          background: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 'bold',
                          padding: '12px 24px',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          alignSelf: 'flex-start'
                        }}
                        onClick={handleAutoLinkVocabulary}
                        disabled={autoLinking}
                      >
                        {autoLinking ? (
                          <>
                            <span className={styles.spinner} style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block' }}></span>
                            Auto-Linking Vocabulary...
                          </>
                        ) : (
                          '🔗 Run Auto-Linker'
                        )}
                      </button>
                    </div>
                  </div>

                  {autoLinkError && (
                    <div style={{
                      padding: 16,
                      background: '#fef2f2',
                      border: '1.5px solid #fee2e2',
                      color: 'var(--color-danger)',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13
                    }}>
                      ⚠ Error: {autoLinkError}
                    </div>
                  )}

                  {autoLinkResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {/* Summary Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16
                      }}>
                        <div className={styles.borderedPanel} style={{ padding: 20, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Linked in this Run</div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-success)', marginTop: 8 }}>{autoLinkResult.linkedCount}</div>
                        </div>
                        <div className={styles.borderedPanel} style={{ padding: 20, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Missing Images</div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: autoLinkResult.missingWords.length > 0 ? 'var(--color-warning)' : 'var(--color-success)', marginTop: 8 }}>
                            {autoLinkResult.missingWords.length}
                          </div>
                        </div>
                        <div className={styles.borderedPanel} style={{ padding: 20, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Vocabulary Words</div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-main)', marginTop: 8 }}>{autoLinkResult.totalVocabularyWords}</div>
                        </div>
                      </div>

                      {/* Linked Words Grid */}
                      {autoLinkResult.linkedWords.length > 0 && (
                        <div className={styles.borderedPanel} style={{ padding: 20 }}>
                          <div className={styles.panelHeader} style={{ marginBottom: 16 }}>
                            <h3 className={styles.panelTitle} style={{ fontSize: 14 }}>✓ Newly Linked Illustrations ({autoLinkResult.linkedWords.length})</h3>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 12
                          }}>
                            {autoLinkResult.linkedWords.map(item => (
                              <div key={item.word} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: 10,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 8
                              }}>
                                <img
                                  src={item.url}
                                  alt=""
                                  style={{ width: 40, height: 40, objectFit: 'contain', background: 'white', borderRadius: 4, border: '1px solid #e2e8f0' }}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.word}</div>
                                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.url}>{item.url}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Words Section */}
                      {autoLinkResult.missingWords.length > 0 && (
                        <div className={styles.borderedPanel} style={{ padding: 20 }}>
                          <div className={styles.panelHeader} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <h3 className={styles.panelTitle} style={{ fontSize: 14, color: 'var(--color-warning)', margin: 0 }}>⚠ Missing Image Assets ({autoLinkResult.missingWords.length})</h3>
                            <button
                              className={styles.btnSolid}
                              style={{
                                background: '#fef3c7',
                                borderColor: '#fde68a',
                                color: '#d97706',
                                fontWeight: 'bold',
                                padding: '8px 16px',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                              }}
                              onClick={handleBulkImportMissing}
                              disabled={bulkImporting}
                            >
                              {bulkImporting ? (
                                <>
                                  <span className={styles.spinner} style={{ width: 12, height: 12, border: '2px solid rgba(217,119,6,0.2)', borderTopColor: '#d97706', display: 'inline-block' }}></span>
                                  <span>{bulkImportProgress || 'Importing...'}</span>
                                </>
                              ) : (
                                <>
                                  <span>⚡ Bulk Auto-Import Clipart</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                            The following vocabulary terms currently do not have matching drawings/icons in the image assets database. Click on any word to search the web for free cliparts and auto-link them.
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {autoLinkResult.missingWords.map(word => (
                              <div
                                key={word}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 11,
                                  fontWeight: 'bold',
                                  background: '#fef3c7',
                                  color: '#d97706',
                                  padding: '4px 8px 4px 10px',
                                  borderRadius: 6,
                                  textTransform: 'lowercase',
                                  border: '1px solid #fde68a',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onClick={() => {
                                  setSearchWordTarget(word);
                                  setSearchQuery(word);
                                  setSearchModalOpen(true);
                                  handleWebImageSearch(word);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#fde68a';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fef3c7';
                                  e.currentTarget.style.transform = 'none';
                                }}
                                title={`Click to search web images for "${word}"`}
                              >
                                <span>{word}</span>
                                <span style={{ fontSize: 10 }}>🔍</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Web Clipart Search Modal ── */}
              {searchModalOpen && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: 24,
                }}
                onClick={() => setSearchModalOpen(false)}
                >
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    width: 'min(900px, 100%)',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                  onClick={e => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div style={{
                      padding: '18px 24px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-secondary)',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-text-main)' }}>
                          🔍 Search Web Clipart for "{searchWordTarget}"
                        </h3>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Find transparent educational PNG cliparts to auto-link
                        </span>
                      </div>
                      <button
                        onClick={() => setSearchModalOpen(false)}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--color-text-muted)',
                          fontSize: 20,
                          cursor: 'pointer',
                          padding: 4,
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Input Area */}
                    <div style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      gap: 12,
                      background: 'var(--bg-primary)',
                    }}>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search query (e.g. net, butterfly net, etc.)"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1.5px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 13,
                          outline: 'none',
                          background: 'var(--bg-secondary)',
                          color: 'var(--color-text-main)'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleWebImageSearch();
                        }}
                      />
                      <button
                        onClick={() => handleWebImageSearch()}
                        disabled={searchLoading}
                        className={styles.btnSolid}
                        style={{
                          background: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: 'white',
                          padding: '0 20px',
                          fontSize: 13,
                          fontWeight: 'bold',
                          borderRadius: 8,
                        }}
                      >
                        {searchLoading ? 'Searching...' : 'Search'}
                      </button>
                    </div>

                    {/* Results Container */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 24,
                      background: 'var(--bg-primary)',
                    }}>
                      {searchLoading && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '60px 0',
                          gap: 16
                        }}>
                          <span className={styles.spinner} style={{ width: 40, height: 40, border: '3px solid rgba(139, 92, 246, 0.1)', borderTopColor: 'var(--color-primary)' }}></span>
                          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Searching DuckDuckGo for clipart...</div>
                        </div>
                      )}

                      {searchError && (
                        <div style={{
                          padding: 16,
                          background: '#fef2f2',
                          border: '1.5px solid #fee2e2',
                          color: 'var(--color-danger)',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 'bold'
                        }}>
                          ⚠ Error fetching search results: {searchError}
                        </div>
                      )}

                      {!searchLoading && !searchError && searchResults.length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '60px 0',
                          color: 'var(--color-text-muted)',
                          fontSize: 13
                        }}>
                          No cliparts found. Try refining your query above (e.g. search "butterfly net" instead of "net").
                        </div>
                      )}

                      {!searchLoading && !searchError && searchResults.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 20
                        }}>
                          {searchResults.map((item, index) => {
                            const isThisImporting = importingSearchUrl === item.image;
                            return (
                              <div
                                key={index}
                                style={{
                                  position: 'relative',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 12,
                                  overflow: 'hidden',
                                  background: 'var(--bg-secondary)',
                                  cursor: importingSearchUrl ? 'not-allowed' : 'pointer',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                onClick={() => {
                                  if (!importingSearchUrl) importSearchImage(item.image);
                                }}
                                onMouseEnter={(e) => {
                                  if (!importingSearchUrl) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {/* Image Container */}
                                <div style={{
                                  width: '100%',
                                  aspectRatio: '1',
                                  padding: 12,
                                  background: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  borderBottom: '1px solid var(--color-border)',
                                }}>
                                  <img
                                    src={item.image}
                                    alt=""
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '100%',
                                      objectFit: 'contain',
                                    }}
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27 width%3D%2724%27 height%3D%2724%27 viewBox%3D%270 0 24 24%27 fill%3D%27none%27 stroke%3D%27%23cbd5e1%27 stroke-width%3D%272%27 stroke-linecap%3D%27round%27 stroke-linejoin%3D%27round%27%3E%3Crect x%3D%273%27 y%3D%273%27 width%3D%2718%27 height%3D%2718%27 rx%3D%272%27 ry%3D%272%27%2F%3E%3Ccircle cx%3D%278.5%27 cy%3D%278.5%27 r%3D%271.5%27%2F%3E%3Cpolyline points%3D%2721 15 16 10 5 21%27%2F%3E%3C%2Fsvg%3E'; // SVG fallback
                                    }}
                                  />

                                  {/* Importing Overlay */}
                                  {isThisImporting && (
                                    <div style={{
                                      position: 'absolute',
                                      top: 0, left: 0, right: 0, bottom: 0,
                                      background: 'rgba(255,255,255,0.85)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 8,
                                      zIndex: 10
                                    }}>
                                      <span className={styles.spinner} style={{ width: 24, height: 24, border: '2.5px solid rgba(139,92,246,0.1)', borderTopColor: 'var(--color-primary)' }}></span>
                                      <span style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--color-primary)' }}>Importing...</span>
                                    </div>
                                  )}
                                </div>

                                {/* Metadata & Action */}
                                <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 'bold',
                                      color: 'var(--color-text-main)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={item.title}
                                  >
                                    {item.title || 'Clipart Image'}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-muted)' }}>
                                    <span>{item.width} x {item.height}</span>
                                    <a
                                      href={item.source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                                    >
                                      source
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '16px 24px',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      background: 'var(--bg-secondary)',
                    }}>
                      <button
                        onClick={() => setSearchModalOpen(false)}
                        className={styles.btnOutline}
                        style={{
                          padding: '8px 16px',
                          fontSize: 13,
                          fontWeight: 'bold',
                          borderRadius: 8,
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Crop Modal ── */}
              {cropTarget && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: 24,
                }}
                onClick={() => setCropTarget(null)}
                >
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    width: 'min(700px, 100%)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                  onClick={e => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>✂️ Crop Image</h3>
                      <button
                        onClick={() => setCropTarget(null)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 18, color: 'var(--color-text-muted)',
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Body */}
                    <div style={{
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                      overflowY: 'auto',
                      flex: 1,
                    }}>
                      <div
                        ref={containerRef}
                        style={{
                          position: 'relative',
                          maxHeight: 400,
                          maxWidth: '100%',
                          background: '#0f172a',
                          borderRadius: 8,
                          overflow: 'hidden',
                          userSelect: 'none',
                          display: 'inline-block',
                        }}
                        onMouseMove={handleDragMove}
                        onTouchMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onTouchEnd={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                      >
                        {/* Background Image */}
                        <img
                          src={cropTarget.previewUrl}
                          alt=""
                          style={{
                            maxHeight: 400,
                            maxWidth: '100%',
                            display: 'block',
                            pointerEvents: 'none',
                            opacity: 0.6,
                          }}
                        />

                        {/* Crop Box Overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            top: `${cropBox.y}%`,
                            left: `${cropBox.x}%`,
                            width: `${cropBox.w}%`,
                            height: `${cropBox.h}%`,
                            border: '2px dashed #3b82f6',
                            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)', // dim the rest
                            cursor: 'move',
                          }}
                          onMouseDown={(e) => handleDragStart(e, 'move')}
                          onTouchStart={(e) => handleDragStart(e, 'move')}
                        >
                          {/* Corner Handles */}
                          {/* NW */}
                          <div
                            style={{
                              position: 'absolute', top: -5, left: -5, width: 10, height: 10,
                              background: '#3b82f6', border: '1px solid white', cursor: 'nwse-resize'
                            }}
                            onMouseDown={(e) => handleDragStart(e, 'nw')}
                            onTouchStart={(e) => handleDragStart(e, 'nw')}
                          />
                          {/* NE */}
                          <div
                            style={{
                              position: 'absolute', top: -5, right: -5, width: 10, height: 10,
                              background: '#3b82f6', border: '1px solid white', cursor: 'nesw-resize'
                            }}
                            onMouseDown={(e) => handleDragStart(e, 'ne')}
                            onTouchStart={(e) => handleDragStart(e, 'ne')}
                          />
                          {/* SE */}
                          <div
                            style={{
                              position: 'absolute', bottom: -5, right: -5, width: 10, height: 10,
                              background: '#3b82f6', border: '1px solid white', cursor: 'nwse-resize'
                            }}
                            onMouseDown={(e) => handleDragStart(e, 'se')}
                            onTouchStart={(e) => handleDragStart(e, 'se')}
                          />
                          {/* SW */}
                          <div
                            style={{
                              position: 'absolute', bottom: -5, left: -5, width: 10, height: 10,
                              background: '#3b82f6', border: '1px solid white', cursor: 'nesw-resize'
                            }}
                            onMouseDown={(e) => handleDragStart(e, 'sw')}
                            onTouchStart={(e) => handleDragStart(e, 'sw')}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        Drag the crop box to reposition. Drag the blue corner handles to resize.
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '16px 20px',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 12,
                    }}>
                      <button
                        className={styles.btnOutline}
                        onClick={() => setCropTarget(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.btnSolid}
                        style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                        onClick={applyCrop}
                      >
                        ✂️ Apply Crop
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

      </main>
    </div>
  );
}
