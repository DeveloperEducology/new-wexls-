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
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePoolWordInput(value) {
  const lines = String(value || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const text = lines[0] || '';
  if (/^[A-Za-zăĕĭŏŭĂĔĬŎŬ]+,\s*[A-Za-zăĕĭŏŭĂĔĬŎŬ]+,\s*[^,]+$/.test(text)) {
    return [text];
  }

  return text.split(',').map(word => word.trim()).filter(Boolean);
}

function makeUniquePoolItemId(category, label, usedIds) {
  const categoryPrefix = slugify(category.replace(/s$/, '')) || 'item';
  const labelSlug = slugify(label) || crypto.randomUUID().slice(0, 8);
  const base = `${categoryPrefix}_${labelSlug}`.replace(/-/g, '_');
  let candidate = base;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
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

function parseCategoryList(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function isWordCompletionAuthoringType(value) {
  return value === 'word_completion_pool';
}

function isPoolDrivenAuthoringType(value) {
  return value === 'dynamic_pool' || isWordCompletionAuthoringType(value);
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
  const [isExpanded, setIsExpanded] = useState(node.type === 'subject');
  const isSelected = node.id === selectedId;
  const hasChildren = node.children && node.children.length > 0;
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
        {hasChildren ? (
          <button
            type="button"
            className={styles.currNodeToggle}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px 8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: 23, display: 'inline-block' }} />
        )}
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
      {hasChildren && isExpanded ? (
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

function getQuestionTemplateForSkill(skillId) {
  const normalized = (skillId || '').toLowerCase().trim();
  let baseTemplate = '';
  
  if (normalized.includes('noun')) {
    baseTemplate = 'Generate questions where the student has to identify the noun(s) in a sentence. Keep sentences simple and engaging (e.g. "The brown dog barked loudly.").';
  } else if (normalized.includes('parts-of-speech') || normalized.includes('speech')) {
    baseTemplate = 'Generate questions asking the student to identify the part of speech (noun, verb, adjective, pronoun, etc.) of a highlighted word in a sentence.';
  } else if (normalized.includes('addition')) {
    baseTemplate = 'Generate basic addition word problems or numerical equations suitable for elementary students, focusing on conceptual understanding (e.g. combining items).';
  } else if (normalized.includes('subtraction')) {
    baseTemplate = 'Generate basic subtraction word problems or equations suitable for elementary students (e.g. taking items away or finding difference).';
  } else if (normalized.includes('multiplication')) {
    baseTemplate = 'Generate simple multiplication problems (e.g. single/double digit multiplication) or array/grouping-based word problems.';
  } else if (normalized.includes('fraction')) {
    baseTemplate = 'Generate questions about fractions, parts of a whole, fraction models (visual representations), or basic fraction comparisons.';
  } else if (normalized.includes('coordinate')) {
    baseTemplate = 'Generate questions about coordinates, locating points on a 2D plane, identifying X and Y axes, or simple coordinate grid patterns.';
  } else if (normalized.includes('mammal') || normalized.includes('animal')) {
    baseTemplate = 'Generate questions about mammal classification, differences between warm-blooded and cold-blooded animals, habitats, or diets.';
  } else if (normalized.includes('time') || normalized.includes('clock')) {
    baseTemplate = 'Generate questions about reading analog clocks, identifying half-hours/quarter-hours, or converting between digital and analog times.';
  } else {
    baseTemplate = `Generate multiple choice questions focused on teaching and testing the concept of "${skillId}". Ensure questions are clear, have a single correct answer, and include helpful explanations.`;
  }

  return `${baseTemplate}

Example Format:
Question: Which word matches the picture?
A. pin
B. dad
C. pot
Correct: B
Explanation: The word dad has the short a sound, like the a in bad.`;
}

export default function AdminConsolePage() {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [imageBuster, setImageBuster] = useState(Date.now());

  const getBustedUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?tb=${imageBuster}`;
  }, [imageBuster]);
  
  useEffect(() => {
    const stored = localStorage.getItem('adminTheme');
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    let nextTheme;
    if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'blue';
    else nextTheme = 'light';
    setTheme(nextTheme);
    localStorage.setItem('adminTheme', nextTheme);
  };

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
  const [qSkillId, setQSkillId] = useState('');
  const [qType, setQType] = useState('all');
  const [qAudioStatus, setQAudioStatus] = useState('all'); // 'all' | 'withAudio' | 'missingAudio'
  const [qPage, setQPage] = useState(1);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [qTotalCount, setQTotalCount] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [libraryMode, setLibraryMode] = useState('questions'); // 'questions' | 'templates'

  // 3. Authoring Center State
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [subject, setSubject] = useState('english');
  const [topic, setTopic] = useState('grammar');
  const [skillId, setSkillId] = useState('nouns');
  const [difficulty, _setDifficulty] = useState('easy');
  const setDifficulty = (val) => {
    if (!val) {
      _setDifficulty('easy');
      return;
    }
    const d = String(val).toLowerCase();
    if (d === 'easy' || d === 'beginner') {
      _setDifficulty('easy');
    } else if (d === 'medium' || d === 'intermediate') {
      _setDifficulty('medium');
    } else if (d === 'hard' || d === 'advanced') {
      _setDifficulty('hard');
    } else {
      _setDifficulty(d);
    }
  };
  const [type, setType] = useState('mcq');
  const [poolId, setPoolId] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [targetKey, setTargetKey] = useState('nouns');
  const [distractorCategories, setDistractorCategories] = useState('');
  const [missingLetterMode, setMissingLetterMode] = useState('beginning');
  const [vocabularyPools, setVocabularyPools] = useState([]);
  const [vocabularyPoolsLoading, setVocabularyPoolsLoading] = useState(false);
  const [vocabularyPoolsError, setVocabularyPoolsError] = useState('');
  const [poolWordManagerOpen, setPoolWordManagerOpen] = useState(false);
  const [poolWordManagerData, setPoolWordManagerData] = useState(null);
  const [poolWordCategory, setPoolWordCategory] = useState('');
  const [poolWordInput, setPoolWordInput] = useState('');
  const [poolWordManagerStatus, setPoolWordManagerStatus] = useState('');
  const [poolWordManagerSaving, setPoolWordManagerSaving] = useState(false);
  const [poolManagerModalOpen, setPoolManagerModalOpen] = useState(false);
  const [createPoolModalOpen, setCreatePoolModalOpen] = useState(false);
  const [newPoolId, setNewPoolId] = useState('');
  const [newPoolCategories, setNewPoolCategories] = useState('');
  const [createPoolStatus, setCreatePoolStatus] = useState('');
  const [createPoolSaving, setCreatePoolSaving] = useState(false);
  const [poolManagerSearch, setPoolManagerSearch] = useState('');
  const [canvaDesignUrl, setCanvaDesignUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanvaDesignUrl(localStorage.getItem('canva_design_url') || 'https://canva.link/w9hc0502n2fbjo9');
    }
  }, []);
  const [poolManagerGeneratingId, setPoolManagerGeneratingId] = useState('');
  const [editingPoolItemKey, setEditingPoolItemKey] = useState(null); // 'category:index'

  useEffect(() => {
    setEditingPoolItemKey(null);
  }, [poolWordCategory, poolManagerModalOpen]);

  const [imgPickerPoolItem, setImgPickerPoolItem] = useState(null);
  const [poolAssetAudit, setPoolAssetAudit] = useState(null);
  const [poolAssetAuditLoading, setPoolAssetAuditLoading] = useState(false);
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
  const [arrangeImagesRow, setArrangeImagesRow] = useState(false);
  const [commonImageWidth, setCommonImageWidth] = useState(180);
  const [directImageSelect, setDirectImageSelect] = useState(false);
  const [hideOptionImages, setHideOptionImages] = useState(false);
  const [hideOptionLabel, setHideOptionLabel] = useState(false);
  const [difficultyRules, setDifficultyRules] = useState({
    easy: { optionCount: 2, distractorSimilarity: 'low', showLabels: true },
    medium: { optionCount: 4, distractorSimilarity: 'medium', showLabels: true },
    hard: { optionCount: 6, distractorSimilarity: 'high', showLabels: false }
  });
  const selectedVocabularyPool = useMemo(
    () => vocabularyPools.find(pool => pool.poolId === poolId.trim()) || null,
    [poolId, vocabularyPools]
  );
  const selectedPoolCategories = useMemo(
    () => Object.keys(selectedVocabularyPool?.categoryCounts || selectedVocabularyPool?.pools || {}),
    [selectedVocabularyPool]
  );

  const openPoolWordManager = async () => {
    if (!poolId.trim()) return;
    setPoolWordManagerOpen(true);
    setPoolWordManagerStatus('Loading full pool…');
    try {
      const response = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId.trim())}`);
      const data = await response.json();
      if (!data.success || !data.pool) throw new Error(data.error || 'Unable to load pool.');
      setPoolWordManagerData(data.pool);
      const categories = Object.keys(data.pool.pools || {});
      setPoolWordCategory(current => categories.includes(current) ? current : (targetCategory || categories[0] || ''));
      setPoolWordManagerStatus('');
    } catch (error) {
      setPoolWordManagerStatus(error.message || 'Unable to load pool.');
    }
  };

  const openPoolManagerModal = async () => {
    setPoolManagerModalOpen(true);
    setPoolManagerSearch('');
    await openPoolWordManager();
  };

  const openCreatePoolModal = () => {
    setNewPoolId(`${subject || 'science'}-${topic || 'general'}-options-v1`);
    setNewPoolCategories(subject === 'science' ? 'solids, liquids, gases' : 'targets, distractors');
    setCreatePoolStatus('');
    setCreatePoolModalOpen(true);
  };

  const createCentralizedPool = async () => {
    const nextPoolId = newPoolId.trim();
    const categoryNames = [...new Set(
      newPoolCategories
        .split(/[\n,]+/)
        .map(category => slugify(category.trim()).replace(/-/g, '_'))
        .filter(Boolean)
    )];
    if (!nextPoolId || categoryNames.length < 2) {
      setCreatePoolStatus('Enter a unique Pool ID and at least two categories.');
      return;
    }
    if (vocabularyPools.some(pool => pool.poolId === nextPoolId)) {
      setCreatePoolStatus('That Pool ID already exists. Choose a different Pool ID.');
      return;
    }

    const nextPool = {
      poolId: nextPoolId,
      subject: subject || 'science',
      topic: topic || 'general',
      status: 'draft',
      version: 1,
      pools: Object.fromEntries(categoryNames.map(category => [category, []]))
    };

    setCreatePoolSaving(true);
    setCreatePoolStatus('Creating reusable pool…');
    try {
      const response = await fetch('/api/admin/vocabulary-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPool)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to create pool.');
      const summary = {
        poolId: nextPoolId,
        status: 'draft',
        version: 1,
        categoryCounts: Object.fromEntries(categoryNames.map(category => [category, 0]))
      };
      setVocabularyPools(current => [...current.filter(pool => pool.poolId !== nextPoolId), summary]);
      setPoolId(nextPoolId);
      setTargetCategory(categoryNames[0]);
      setDistractorCategories(categoryNames.slice(1).join(', '));
      setPoolWordManagerData(nextPool);
      setPoolWordCategory(categoryNames[0]);
      setCreatePoolModalOpen(false);
      setPoolManagerModalOpen(true);
      setPoolManagerSearch('');
      setPoolWordManagerStatus('Pool created. Add options to each category, then save pool changes.');
      setIsDirty(true);
    } catch (error) {
      setCreatePoolStatus(error.message || 'Unable to create pool.');
    } finally {
      setCreatePoolSaving(false);
    }
  };

  const updatePoolManagerItem = (category, index, changes) => {
    setPoolWordManagerData(current => {
      if (!current) return current;
      const categoryItems = [...(current.pools?.[category] || [])];
      categoryItems[index] = { ...categoryItems[index], ...changes };
      return { ...current, pools: { ...(current.pools || {}), [category]: categoryItems } };
    });
    setPoolWordManagerStatus('Unsaved pool changes.');
  };

  const savePoolManagerChanges = async () => {
    if (!poolWordManagerData) return;
    setPoolWordManagerSaving(true);
    setPoolWordManagerStatus('Saving pool changes…');
    try {
      const response = await fetch('/api/admin/vocabulary-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poolWordManagerData)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unable to save pool.');
      setPoolWordManagerStatus('Pool changes saved.');
    } catch (error) {
      setPoolWordManagerStatus(error.message || 'Unable to save pool.');
    } finally {
      setPoolWordManagerSaving(false);
    }
  };

  const generatePoolItemAudio = async (category, index, item) => {
    if (!item?.label?.trim()) return;
    setPoolManagerGeneratingId(`${category}:${index}`);
    try {
      const response = await fetch('/api/admin/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.label.trim(), voice: voice || 'Puck' })
      });
      const data = await response.json();
      if (!data.success || !data.audioUrl) throw new Error(data.error || 'Audio generation failed.');
      updatePoolManagerItem(category, index, { audioUrl: data.audioUrl });
      handlePlayUrlAudio(`pool_${category}_${index}`, data.audioUrl);
    } catch (error) {
      setPoolWordManagerStatus(error.message || 'Audio generation failed.');
    } finally {
      setPoolManagerGeneratingId('');
    }
  };

  const generateMissingAudiosForCategory = async () => {
    if (!poolWordManagerData || !poolWordCategory) return;
    const category = poolWordCategory;
    const items = poolWordManagerData.pools[category] || [];

    const missingItems = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.audioUrl);

    if (missingItems.length === 0) {
      setPoolWordManagerStatus(`No missing audios in category "${category}"!`);
      return;
    }

    setPoolWordManagerStatus(`Preparing to generate ${missingItems.length} missing audios...`);
    setPoolWordManagerSaving(true);

    let generatedCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < missingItems.length; i++) {
        const { item, index } = missingItems[i];
        if (!item.label?.trim()) continue;

        setPoolWordManagerStatus(`Generating audio for "${item.label}" (${i + 1}/${missingItems.length})...`);

        try {
          const response = await fetch('/api/admin/generate-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: item.label.trim(), voice: voice || 'Puck' })
          });
          const data = await response.json();
          if (!data.success || !data.audioUrl) throw new Error(data.error || 'Failed');

          updatePoolManagerItem(category, index, { audioUrl: data.audioUrl });
          generatedCount++;
        } catch (err) {
          console.error(`Failed to generate audio for "${item.label}":`, err);
          failedCount++;
        }
      }
      setPoolWordManagerStatus(`Done! Successfully generated ${generatedCount} audios. Failed: ${failedCount}. Click "Save Pool Changes" to save.`);
    } catch (error) {
      setPoolWordManagerStatus(`Bulk audio process failed: ${error.message}`);
    } finally {
      setPoolWordManagerSaving(false);
    }
  };

  const generateMissingImagesForCategory = async () => {
    if (!poolWordManagerData || !poolWordCategory) return;
    const category = poolWordCategory;
    const items = poolWordManagerData.pools[category] || [];

    const missingItems = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.imageUrl);

    if (missingItems.length === 0) {
      setPoolWordManagerStatus(`No missing images in category "${category}"!`);
      return;
    }

    if (!confirm(`Are you sure you want to search and download clipart images for the ${missingItems.length} words in "${category}" that don't have images? This might take a minute.`)) {
      return;
    }

    setPoolWordManagerStatus(`Preparing to search and download ${missingItems.length} missing images...`);
    setPoolWordManagerSaving(true);

    let generatedCount = 0;
    let failedCount = 0;

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
      for (let i = 0; i < missingItems.length; i++) {
        const { item, index } = missingItems[i];
        if (!item.label?.trim()) continue;

        setPoolWordManagerStatus(`Searching & downloading clipart for "${item.label}" (${i + 1}/${missingItems.length})...`);

        try {
          const searchRes = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(item.label.trim())}&type=clipart`);
          const searchData = await searchRes.json();
          if (!searchRes.ok || !searchData.results || searchData.results.length === 0) {
            throw new Error(searchData.error || 'No search results found');
          }

          const firstResult = searchData.results[0];

          const fetchRes = await fetch('/api/admin/fetch-url-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: firstResult.image,
              folder: 'images',
              customName: item.label.trim()
            })
          });
          const fetchData = await fetchRes.json();
          if (!fetchRes.ok || !fetchData.r2Url) {
            throw new Error(fetchData.error || 'Failed to download search image');
          }

          updatePoolManagerItem(category, index, { imageUrl: fetchData.r2Url });
          generatedCount++;
        } catch (err) {
          console.error(`Failed to generate image for "${item.label}":`, err);
          failedCount++;
        }

        await sleep(400);
      }
      setPoolWordManagerStatus(`Done! Successfully downloaded ${generatedCount} clipart images. Failed: ${failedCount}. Click "Save Pool Changes" to save.`);
    } catch (error) {
      setPoolWordManagerStatus(`Bulk image process failed: ${error.message}`);
    } finally {
      setPoolWordManagerSaving(false);
    }
  };

  const openImgPickerForPoolItem = (category, index) => {
    const item = poolWordManagerData?.pools?.[category]?.[index];
    const label = item?.label || '';
    setImgPickerPoolItem({ category, index });
    setImgPickerOptionIdx(null);
    setImgPickerPartIdx(null);
    setImgPickerHotspotId(null);
    setImgPickerTab('web');
    setImgPickerSearch('');
    setWebSearchQuery(label);
    setWebSearchType('clipart');
    setWebSearchResults([]);
    setWebSearchSelectedUrl('');
    setImgPickerOpen(true);
    if (label.trim()) {
      handleWebSearch(label.trim(), 'clipart');
    }
  };

  const addWordsToCentralizedPool = async () => {
  const category = poolWordCategory.trim();
    const words = parsePoolWordInput(poolWordInput);
    if (!poolWordManagerData || !category || words.length === 0) {
      setPoolWordManagerStatus('Choose a category and enter at least one word.');
      return;
    }

    const existingItems = Array.isArray(poolWordManagerData.pools?.[category])
      ? poolWordManagerData.pools[category]
      : [];
    const existingLabels = new Set(existingItems.map(item => String(item.label || '').trim().toLowerCase()));
    const usedIds = new Set(existingItems.map(item => String(item.id || '').trim()).filter(Boolean));
    const additions = words
      .filter(word => !existingLabels.has(word.toLowerCase()))
      .map(word => ({
        id: makeUniquePoolItemId(category, word, usedIds),
        label: word,
        active: true
      }));

    if (additions.length === 0) {
      setPoolWordManagerStatus('No new words to add. Those words already exist in this category.');
      return;
    }

    const nextPool = {
      ...poolWordManagerData,
      pools: {
        ...(poolWordManagerData.pools || {}),
        [category]: [...existingItems, ...additions]
      }
    };

    setPoolWordManagerSaving(true);
    setPoolWordManagerStatus('Saving words…');
    try {
      const response = await fetch('/api/admin/vocabulary-pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextPool)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Unable to save pool.');
      setPoolWordManagerData(nextPool);
      setVocabularyPools(current => current.map(pool => (
        pool.poolId === nextPool.poolId
          ? {
              ...pool,
              categoryCounts: Object.fromEntries(
                Object.entries(nextPool.pools || {}).map(([name, items]) => [name, Array.isArray(items) ? items.length : 0])
              )
            }
          : pool
      )));
      setPoolWordInput('');
      setPoolWordManagerStatus(`Added ${additions.length} word${additions.length === 1 ? '' : 's'} to ${category}.`);
    } catch (error) {
      setPoolWordManagerStatus(error.message || 'Unable to save pool.');
    } finally {
      setPoolWordManagerSaving(false);
    }
  };

  const auditDynamicPoolAssets = async () => {
    setPoolAssetAuditLoading(true);
    try {
      let auditItems = options;
      if (poolId.trim()) {
        const response = await fetch(`/api/admin/vocabulary-pools?poolId=${encodeURIComponent(poolId.trim())}`);
        const data = await response.json();
        if (!data.success || !data.pool) throw new Error(data.error || 'Unable to load pool.');
        const isCatLike = interaction === 'categorization' || interaction === 'categorizationv2' || interaction === 'word_completion';
        const categoriesToAudit = interaction === 'word_completion'
          ? (targetCategory.trim() === '[random]' ? selectedPoolCategories : [targetCategory.trim()].filter(Boolean))
          : isCatLike
          ? (categories.length > 0 ? categories.map(c => c.id) : selectedPoolCategories)
          : (targetCategory.trim() === '[random]'
              ? selectedPoolCategories
              : [targetCategory.trim(), ...parseCategoryList(distractorCategories)].filter(Boolean));
        auditItems = categoriesToAudit.flatMap(category => data.pool.pools?.[category] || []);
      }

      const activeItems = auditItems.filter(item => item?.active !== false);
      setPoolAssetAudit({
        total: activeItems.length,
        missingImages: activeItems.filter(item => !item.imageUrl).map(item => item.label || item.id || 'Unnamed'),
        missingAudio: activeItems.filter(item => !item.audioUrl).map(item => item.label || item.id || 'Unnamed')
      });
    } catch (error) {
      setPoolAssetAudit({ error: error.message || 'Unable to audit pool assets.' });
    } finally {
      setPoolAssetAuditLoading(false);
    }
  };

  const fetchVocabularyPools = useCallback(async () => {
    setVocabularyPoolsLoading(true);
    setVocabularyPoolsError('');
    try {
      const response = await fetch('/api/admin/vocabulary-pools');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to load vocabulary pools.');
      setVocabularyPools(Array.isArray(data.pools) ? data.pools : []);
    } catch (error) {
      setVocabularyPoolsError(error.message || 'Unable to load vocabulary pools.');
    } finally {
      setVocabularyPoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (type !== 'dynamic_pool' || vocabularyPools.length > 0 || vocabularyPoolsLoading || vocabularyPoolsError) return;

    fetchVocabularyPools();
  }, [type, vocabularyPools.length, vocabularyPoolsLoading, vocabularyPoolsError, fetchVocabularyPools]);

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
  const [isHotspotTransparent, setIsHotspotTransparent] = useState(false);
  const [activePreviewDevice, setActivePreviewDevice] = useState('desktop');
  const [layouts, setLayouts] = useState({ desktop: null, mobile: null });

  // Shadow Match states
  const [shadowStickers, setShadowStickers] = useState([]);
  const [shadowTargets, setShadowTargets] = useState([]);
  const [shadowSceneImageUrl, setShadowSceneImageUrl] = useState('');
  const [selectedShadowTargetId, setSelectedShadowTargetId] = useState(null);
  const [shadowTargetDragging, setShadowTargetDragging] = useState(null); // {id, offsetX, offsetY}
  // Preview Answer checking state
  const [previewAnswer, setPreviewAnswer] = useState(null);
  const [previewCheckResult, setPreviewCheckResult] = useState(null); // 'correct', 'incorrect', or null
  
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [generatingSingleAudio, setGeneratingSingleAudio] = useState(false);
  const [generatingAudioOptionIdx, setGeneratingAudioOptionIdx] = useState(null);
  const [aiCheckLoading, setAiCheckLoading] = useState(false);
  const [aiCheckReport, setAiCheckReport] = useState(null);

  const [authoringMode, setAuthoringMode] = useState('manual'); // 'manual' | 'paste' | 'import' | 'ai_bulk'
  const [questionStatus, setQuestionStatus] = useState('active');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [generatingAi, setGeneratingAi] = useState(false);
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
  const [parsedBatch, setParsedBatch] = useState([]); // array of parsed question objects
  const [parseBatchSaving, setParseBatchSaving] = useState(false);
  const [parseBatchSubject, setParseBatchSubject] = useState('');
  const [parseBatchTopic, setParseBatchTopic] = useState('');
  const [parseBatchSkillId, setParseBatchSkillId] = useState('');
  const [parseBatchDifficulty, _setParseBatchDifficulty] = useState('easy');
  const setParseBatchDifficulty = (val) => {
    if (!val) {
      _setParseBatchDifficulty('easy');
      return;
    }
    const d = String(val).toLowerCase();
    if (d === 'easy' || d === 'beginner') {
      _setParseBatchDifficulty('easy');
    } else if (d === 'medium' || d === 'intermediate') {
      _setParseBatchDifficulty('medium');
    } else if (d === 'hard' || d === 'advanced') {
      _setParseBatchDifficulty('hard');
    } else {
      _setParseBatchDifficulty(d);
    }
  };

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
  const [imgQuality, setImgQuality] = useState(82);
  const [imgFormat, setImgFormat] = useState('image/webp');
  const [imgFolder, setImgFolder] = useState('images');
  const [imgFolderPreset, setImgFolderPreset] = useState('images');
  const [imgFolderCustom, setImgFolderCustom] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [imgDragOver, setImgDragOver] = useState(false);
  const imgFileInputRef = useRef(null);

  const [activeUploadPreview, setActiveUploadPreview] = useState(null);

  // ── Image Picker Modal State (for Part editor Upload/Gallery buttons) ─────────
  const [imgPickerOpen, setImgPickerOpen]         = useState(false);
  const [imgPickerPartIdx, setImgPickerPartIdx]   = useState(null); // which part to fill
  const [imgPickerOptionIdx, setImgPickerOptionIdx] = useState(null); // which MCQ option to fill
  const [imgPickerHotspotId, setImgPickerHotspotId] = useState(null); // which hotspot to fill
  const [imgPickerTab, setImgPickerTab]           = useState('gallery'); // 'gallery' | 'upload'
  const [imgPickerSearch, setImgPickerSearch]     = useState('');
  const [imgPickerFolder, setImgPickerFolder]     = useState('images');
  const [imgPickerImages, setImgPickerImages]     = useState([]);
  const [imgPickerLoading, setImgPickerLoading]   = useState(false);
  const [imgPickerError, setImgPickerError]       = useState('');
  const [imgPickerUploading, setImgPickerUploading] = useState(false);
  const imgPickerFileRef = useRef(null);
  const [imgPreviewUrl, setImgPreviewUrl]         = useState(null);

  // ── R2 Audio Gallery Modal State ──────────────────────────────────────────
  const [showAudioGallery, setShowAudioGallery]     = useState(false);
  const [audioGalleryPartIdx, setAudioGalleryPartIdx] = useState(null);
  const [audioGalleryOptionIdx, setAudioGalleryOptionIdx] = useState(null);
  const [audioGalleryForMainText, setAudioGalleryForMainText] = useState(false);
  const [r2AudioFiles, setR2AudioFiles]             = useState([]);
  
  // ── Clone Random State ────────────────────────────────────────────────────
  const [cloneCount, setCloneCount] = useState(5);
  const [cloneSkillId, setCloneSkillId] = useState('');
  const [customCloneSkillId, setCustomCloneSkillId] = useState('');
  const [cloningInProgress, setCloningInProgress] = useState(false);
  const [r2AudioLoading, setR2AudioLoading]         = useState(false);
  const [r2AudioSearch, setR2AudioSearch]           = useState('');
  const [r2AudioFolderFilter, setR2AudioFolderFilter] = useState(''); // '' = all folders
  const [r2AudioPreview, setR2AudioPreview]         = useState(null); // url being previewed

  const [webSearchQuery, setWebSearchQuery]       = useState('');
  const [webSearchType, setWebSearchType]         = useState('clipart'); // 'clipart' | 'photo' | 'any'
  const [webSearchResults, setWebSearchResults]   = useState([]);
  const [webSearchLoading, setWebSearchLoading]   = useState(false);
  const [webSearchSelectedUrl, setWebSearchSelectedUrl] = useState(''); // track downloading image URL

  const closeImgPicker = () => {
    setImgPickerOpen(false);
    setImgPickerPoolItem(null);
  };

  const openImgPicker = (partIdx, tab = 'gallery') => {
    setImgPickerPoolItem(null);
    setImgPickerPartIdx(partIdx);
    setImgPickerOptionIdx(null);
    setImgPickerHotspotId(null);
    setImgPickerTab(tab);
    setImgPickerSearch('');
    setWebSearchQuery('');
    setWebSearchResults([]);
    setImgPickerOpen(true);
    // auto-load gallery
    fetchImgPickerGallery('images');
  };

  const fetchR2AudioFiles = async () => {
    setR2AudioLoading(true);
    try {
      const res = await fetch('/api/admin/list-audio?prefix=audio/');
      const data = await res.json();
      if (data.audio) setR2AudioFiles(data.audio);
    } catch (e) {
      console.warn('Failed to load R2 audio files:', e);
    } finally {
      setR2AudioLoading(false);
    }
  };

  const openImgPickerForOption = (optionIdx, tab = 'gallery') => {
    setImgPickerPoolItem(null);
    setImgPickerOptionIdx(optionIdx);
    setImgPickerPartIdx(null);
    setImgPickerHotspotId(null);
    setImgPickerTab(tab);
    setImgPickerSearch('');
    setWebSearchQuery('');
    setWebSearchResults([]);
    setImgPickerOpen(true);
    // auto-load gallery
    fetchImgPickerGallery('images');
  };

  const openImgPickerForHotspot = (hotspotId, tab = 'gallery') => {
    setImgPickerPoolItem(null);
    setImgPickerHotspotId(hotspotId);
    setImgPickerOptionIdx(null);
    setImgPickerPartIdx(null);
    setImgPickerTab(tab);
    setImgPickerSearch('');
    setWebSearchQuery('');
    setWebSearchResults([]);
    setImgPickerOpen(true);
    // auto-load gallery
    fetchImgPickerGallery('images');
  };

  const openAudioGalleryForOption = (optionIdx) => {
    setAudioGalleryOptionIdx(optionIdx);
    setAudioGalleryPartIdx(null);
    setShowAudioGallery(true);
    if (r2AudioFiles.length === 0) fetchR2AudioFiles();
  };

  const updateOptionAudioUrl = (idx, url) => {
    const updated = [...options];
    updated[idx].audioUrl = url;
    setOptions(updated);
  };

  const handleWebSearch = async (query = webSearchQuery, type = webSearchType) => {
    if (!query || !query.trim()) return;
    setWebSearchLoading(true);
    setImgPickerError('');
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(query.trim())}&type=${type}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Web search failed');
      setWebSearchResults(data.results || []);
    } catch (err) {
      setImgPickerError(err.message);
    } finally {
      setWebSearchLoading(false);
    }
  };

  const handleWebSearchSelect = async (item) => {
    if (webSearchSelectedUrl) return; // prevent double clicks
    setWebSearchSelectedUrl(item.image);
    setImgPickerError('');
    try {
      const res = await fetch('/api/admin/fetch-url-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.image,
          folder: imgPickerFolder || 'images',
          customName: webSearchQuery.trim() || 'web-search-import'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to download search image');
      // Auto-select the newly uploaded R2 URL
      handleImgPickerSelect(data.r2Url);
      // Refresh the background gallery list
      fetchImgPickerGallery(imgPickerFolder);
    } catch (err) {
      setImgPickerError(err.message);
    } finally {
      setWebSearchSelectedUrl('');
    }
  };

  const fetchImgPickerGallery = async (prefix = imgPickerFolder) => {
    setImgPickerLoading(true);
    setImgPickerError('');
    try {
      const res  = await fetch(`/api/admin/list-images?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list images');
      setImgPickerImages(data.images || []);
    } catch (err) {
      setImgPickerError(err.message);
    } finally {
      setImgPickerLoading(false);
    }
  };

  const extractLabelFromUrl = (url) => {
    if (!url) return '';
    try {
      const filename = url.substring(url.lastIndexOf('/') + 1);
      const cleanFilename = filename.split(/[?#]/)[0];
      const withoutExt = cleanFilename.substring(0, cleanFilename.lastIndexOf('.')) || cleanFilename;
      const decoded = decodeURIComponent(withoutExt);
      return decoded.replace(/[-_]/g, ' ').trim();
    } catch (err) {
      console.error('Failed to extract label:', err);
      return '';
    }
  };

  const handleImgPickerSelect = (url) => {
    if (imgPickerPoolItem) {
      updatePoolManagerItem(imgPickerPoolItem.category, imgPickerPoolItem.index, { imageUrl: url });
      setImgPickerPoolItem(null);
      setImgPickerOpen(false);
    } else if (typeof imgPickerHotspotId === 'string' && imgPickerHotspotId.startsWith('shadow_sticker_')) {
      // Shadow match sticker image picker
      const stickerId = parseInt(imgPickerHotspotId.replace('shadow_sticker_', ''), 10);
      setShadowStickers(prev => prev.map(s => s.id === stickerId ? { ...s, imageUrl: url } : s));
      setImgPickerHotspotId(null);
      setImgPickerOpen(false);
      setIsDirty(true);
    } else if (imgPickerHotspotId !== null) {
      const updated = hotspots.map(h => {
        if (h.id === imgPickerHotspotId) {
          const newLabel = (!h.label || h.label.startsWith('Hotspot ') || h.label === '')
            ? extractLabelFromUrl(url)
            : h.label;
          return { ...h, imageUrl: url, label: newLabel };
        }
        return h;
      });
      syncHotspotsToOptions(updated);
      setImgPickerHotspotId(null);
      setImgPickerOpen(false);
    } else if (imgPickerOptionIdx !== null) {
      updateOptionImageUrl(imgPickerOptionIdx, url);
      // Auto-fill label when picking image
      const currentLabel = options[imgPickerOptionIdx]?.label || '';
      if (currentLabel.startsWith('Option ') || !currentLabel.trim()) {
        const extractedLabel = extractLabelFromUrl(url);
        updateOptionText(imgPickerOptionIdx, extractedLabel);
      }
      setImgPickerOptionIdx(null);
      setImgPickerOpen(false);
    } else if (imgPickerPartIdx === -99) {
      // Special sentinel: shadow match scene / background image
      setShadowSceneImageUrl(url);
      setImgPickerPartIdx(null);
      setImgPickerOpen(false);
      setIsDirty(true);
    } else if (imgPickerPartIdx !== null) {
      handleUpdatePartFields(imgPickerPartIdx, { imageUrl: url, src: url, content: url });
      setImgPickerPartIdx(null);
      setImgPickerOpen(false);
    }
  };

  const handleImgPickerUploads = async (files) => {
    if (!files || files.length === 0) return;
    setImgPickerUploading(true);
    setImgPickerError('');
    try {
      const fd = new FormData();
      fd.append('folder', imgPickerFolder || 'images');
      fd.append('maxWidth', '1200');
      fd.append('quality', '85');
      fd.append('format', 'image/webp');
      files.forEach(file => {
        fd.append('files[]', file);
      });
      const res  = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (data.errors && data.errors.length > 0) {
        const errMsg = data.errors.map(e => `${e.file}: ${e.error}`).join(', ');
        setImgPickerError(`Some files failed: ${errMsg}`);
      }
      if (files.length === 1 && data.results && data.results.length === 1) {
        handleImgPickerSelect(data.results[0].url);
      } else {
        setImgPickerTab('gallery');
        await fetchImgPickerGallery(imgPickerFolder);
      }
    } catch (err) {
      setImgPickerError(err.message);
    } finally {
      setImgPickerUploading(false);
    }
  };

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
  const [selectedSearchImages, setSelectedSearchImages] = useState([]);
  const [importingSearchStatus, setImportingSearchStatus] = useState('');
  const [previewSearchImageUrl, setPreviewSearchImageUrl] = useState(null);
  const [importedSearchUrls, setImportedSearchUrls] = useState({});
  const [autoLinkOnImport, setAutoLinkOnImport] = useState(true);
  const [gallerySearch, setGallerySearch] = useState('');
  const [searchFolder, setSearchFolder] = useState('images/lkg/things');
  const [searchFolderPreset, setSearchFolderPreset] = useState('images/lkg/things');
  const [searchFolderCustom, setSearchFolderCustom] = useState('');
  const [searchType, setSearchType] = useState('clipart');

  const handleWebImageSearch = async (queryStr) => {
    const q = queryStr || searchQuery;
    if (!q || !q.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    setSelectedSearchImages([]);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(q.trim())}&type=${encodeURIComponent(searchType)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch search results');
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleSearchImageSelection = (imageUrl) => {
    setSelectedSearchImages(prev =>
      prev.includes(imageUrl) ? prev.filter(url => url !== imageUrl) : [...prev, imageUrl]
    );
  };

  const handleSelectAllSearchImages = () => {
    setSelectedSearchImages(searchResults.map(item => item.image));
  };

  const handleClearSearchImages = () => {
    setSelectedSearchImages([]);
  };

  const importSelectedSearchImages = async () => {
    if (!searchWordTarget || selectedSearchImages.length === 0) return;
    setSearchLoading(true);
    setSearchError('');
    setImportingSearchStatus(`Importing ${selectedSearchImages.length} images...`);
    
    let successCount = 0;
    let failedCount = 0;
    
    try {
      for (let i = 0; i < selectedSearchImages.length; i++) {
        const imageUrl = selectedSearchImages[i];
        setImportingSearchStatus(`Uploading image ${i + 1}/${selectedSearchImages.length}...`);
        
        const res = await fetch('/api/admin/fetch-url-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            folder: searchFolder || 'images/lkg/things',
            customName: searchWordTarget,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          successCount++;
        } else {
          failedCount++;
          console.error(`Failed to import search image ${imageUrl}:`, data.error);
        }
      }
      
      logActivity(`Imported ${successCount} images for "${searchWordTarget}" to R2`, 'success');
      
      if (autoLinkOnImport) {
        setImportingSearchStatus('Linking...');
        const linkRes = await fetch('/api/admin/auto-link-vocabulary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overwriteExisting: true }),
        });
        const linkData = await linkRes.json();
        if (!linkRes.ok) throw new Error(linkData.error || 'Failed to auto-link newly imported assets');
        
        setAutoLinkResult(linkData);
        setSelectedWords(prev => prev.filter(w => w !== searchWordTarget));
        logActivity(`Auto-linked "${searchWordTarget}" to the new image URL`, 'success');
      }
      
      setSearchModalOpen(false);
      alert(`Import complete!\nSuccessfully imported: ${successCount}\nFailed: ${failedCount}`);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setSearchLoading(false);
      setImportingSearchStatus('');
      setSelectedSearchImages([]);
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
          folder: searchFolder || 'images/lkg/things',
          customName: searchWordTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import image');
      
      logActivity(`Successfully imported clipart for "${searchWordTarget}" to R2`, 'success');
      
      if (autoLinkOnImport) {
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
        logActivity(`Auto-linked "${searchWordTarget}" to the new image URL`, 'success');
      }
      setSearchModalOpen(false);
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

  // Cropper State for Gallery
  const [galleryCroppingImg, setGalleryCroppingImg] = useState(null);

  const startGalleryCropper = (img) => {
    setGalleryCroppingImg(img);
  };

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

  const availableSkillsForClone = useMemo(() => {
    if (!qSubject || !qTopic) return [];
    return dbSkills.filter(
      s => (s.subjectId || '').toLowerCase() === qSubject.toLowerCase() &&
           (s.topicId || '').toLowerCase() === qTopic.toLowerCase()
    );
  }, [dbSkills, qSubject, qTopic]);

  useEffect(() => {
    setCloneSkillId('');
    setCustomCloneSkillId('');
    setQSkillId('');
  }, [qSubject, qTopic]);

  const [selectedLinkSubject, setSelectedLinkSubject] = useState('');
  const [selectedLinkTopic, setSelectedLinkTopic]     = useState('');
  const [skillSearchQuery, setSkillSearchQuery]       = useState('');

  const uniqueLinkSubjects = useMemo(() => {
    const subs = dbSkills.map(s => s.subjectId).filter(Boolean);
    return Array.from(new Set(subs)).sort();
  }, [dbSkills]);

  const uniqueLinkTopics = useMemo(() => {
    if (!selectedLinkSubject) return [];
    const topics = dbSkills
      .filter(s => s.subjectId === selectedLinkSubject)
      .map(s => s.topicId)
      .filter(Boolean);
    return Array.from(new Set(topics)).sort();
  }, [dbSkills, selectedLinkSubject]);

  const filteredLinkSkills = useMemo(() => {
    const q = skillSearchQuery.toLowerCase().trim();
    if (q) {
      return dbSkills.filter(s => 
        (s.title || '').toLowerCase().includes(q) || 
        (s.id || '').toLowerCase().includes(q) ||
        (s.skillId || '').toLowerCase().includes(q) ||
        (s.topicId || '').toLowerCase().includes(q) ||
        (s.subjectId || '').toLowerCase().includes(q)
      );
    }
    if (!selectedLinkSubject || !selectedLinkTopic) return [];
    return dbSkills.filter(s => s.subjectId === selectedLinkSubject && s.topicId === selectedLinkTopic);
  }, [dbSkills, selectedLinkSubject, selectedLinkTopic, skillSearchQuery]);

  useEffect(() => {
    if (skillId && dbSkills.length > 0) {
      const skill = dbSkills.find(s => s.id === skillId || s.skillId === skillId);
      if (skill) {
        if (skill.subjectId && skill.subjectId !== selectedLinkSubject) {
          setSelectedLinkSubject(skill.subjectId);
        }
        if (skill.topicId && skill.topicId !== selectedLinkTopic) {
          setSelectedLinkTopic(skill.topicId);
        }
      }
    }
  }, [skillId, dbSkills]);

  useEffect(() => {
    if (authoringMode === 'ai_bulk' && skillId) {
      setAiPrompt(getQuestionTemplateForSkill(skillId));
    }
  }, [skillId, authoringMode]);

  const [currTreeSearch, setCurrTreeSearch] = useState('');
  const [currTreeSubjectFilter, setCurrTreeSubjectFilter] = useState('all');

  const [useCustomSubjectId, setUseCustomSubjectId] = useState(false);
  const [useCustomTopicId, setUseCustomTopicId] = useState(false);
  const [useCustomChapterId, setUseCustomChapterId] = useState(false);
  const [useCustomParentId, setUseCustomParentId] = useState(false);
  const [templatesCatalog, setTemplatesCatalog] = useState(null);
  const [dynamicTemplates, setDynamicTemplates] = useState([]);
  const [useCustomTemplateId, setUseCustomTemplateId] = useState(false);

  const uniqueSubjects = useMemo(() => {
    const subs = currFlatNodes.filter(n => n.type === 'subject').map(n => n.id);
    return Array.from(new Set(subs));
  }, [currFlatNodes]);

  const availableSubjects = useMemo(() => {
    return currFlatNodes.filter(n => n.type === 'subject');
  }, [currFlatNodes]);

  const availableTopics = useMemo(() => {
    return currFlatNodes.filter(n => n.type === 'topic');
  }, [currFlatNodes]);

  const availableChapters = useMemo(() => {
    return currFlatNodes.filter(n => n.type === 'chapter');
  }, [currFlatNodes]);

  const parentOptions = useMemo(() => {
    if (currForm.type === 'topic') return availableSubjects;
    if (currForm.type === 'chapter') return availableTopics;
    if (currForm.type === 'skill') return [...availableChapters, ...availableTopics];
    return [];
  }, [currForm.type, availableSubjects, availableTopics, availableChapters]);

  const groupedOptions = useMemo(() => {
    const groups = [];
    if (templatesCatalog) {
      for (const [subject, topics] of Object.entries(templatesCatalog)) {
        for (const [topic, templates] of Object.entries(topics)) {
          groups.push({
            label: `${subject.toUpperCase()} - ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
            templates: templates
          });
        }
      }
    }
    if (dynamicTemplates && dynamicTemplates.length > 0) {
      groups.push({
        label: 'CUSTOM DYNAMIC TEMPLATES (MONGODB)',
        templates: dynamicTemplates.map(t => ({
          id: t.id,
          title: t.title || t.id,
          engine: t.engine || 'universal-template',
          questionType: t.questionType || t.optionsType || 'fillInTheBlank'
        }))
      });
    }
    return groups;
  }, [templatesCatalog, dynamicTemplates]);

  const filteredTree = useMemo(() => {
    if (!currTreeSearch && currTreeSubjectFilter === 'all') {
      return currTree;
    }
    const matchesSearch = (node) => {
      const q = currTreeSearch.toLowerCase();
      return (
        node.title?.toLowerCase().includes(q) ||
        node.id?.toLowerCase().includes(q) ||
        node.code?.toLowerCase().includes(q)
      );
    };

    const filterNode = (node) => {
      if (currTreeSubjectFilter !== 'all' && node.type === 'subject' && node.id !== currTreeSubjectFilter) {
        return null;
      }
      
      const childrenMatches = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];
      
      const nodeMatches = !currTreeSearch || matchesSearch(node) || childrenMatches.length > 0;
      
      if (nodeMatches) {
        return {
          ...node,
          children: childrenMatches
        };
      }
      return null;
    };

    return currTree.map(filterNode).filter(Boolean);
  }, [currTree, currTreeSearch, currTreeSubjectFilter]);

  const loadCurrTree = useCallback(async () => {
    setCurrLoading(true);
    setCurrError('');
    try {
      const response = await fetch('/api/admin/curriculum?tree=true', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load curriculum tree.');
      setCurrTree(data.tree || []);
      setCurrStatus(`Loaded ${(data.nodes || []).length} curriculum nodes.`);
    } catch (err) {
      setCurrError(err.message);
    } finally {
      setCurrLoading(false);
    }
  }, []);

  const loadTemplatesCatalog = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/templates');
      const data = await response.json();
      if (data.success) {
        setTemplatesCatalog(data.templates);
        setDynamicTemplates(data.dynamicTemplates || []);
      }
    } catch (err) {
      console.error('Error loading templates catalog:', err);
    }
  }, []);

  const handleTemplateSelectChange = (event) => {
    const val = event.target.value;
    setCurrForm((current) => {
      const updated = { ...current, templateId: val };
      if (val) {
        let foundTpl = null;
        if (templatesCatalog) {
          for (const subject of Object.values(templatesCatalog)) {
            for (const topicTemplates of Object.values(subject)) {
              const found = topicTemplates.find(t => t.id === val);
              if (found) {
                foundTpl = found;
                break;
              }
            }
            if (foundTpl) break;
          }
        }
        if (!foundTpl && dynamicTemplates) {
          const found = dynamicTemplates.find(t => t.id === val);
          if (found) {
            foundTpl = {
              id: found.id,
              title: found.title || found.id,
              engine: found.engine || 'universal-template',
              questionType: found.questionType || found.optionsType || 'fillInTheBlank'
            };
          }
        }
        if (foundTpl) {
          updated.engine = foundTpl.engine || '';
          updated.questionType = foundTpl.questionType || '';
        }
      }
      return updated;
    });
    if (!currSelected) {
      setCurrManuallyEdited((prev) => ({
        ...prev,
        templateId: true,
        engine: true,
        questionType: true
      }));
    }
  };

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

      // Client-side loop validation
      if (payload.parentId && payload.id && payload.parentId === payload.id) {
        throw new Error(`Circular reference detected: Parent ID cannot be equal to the node's own ID (${payload.id}).`);
      }

      // Recursive cycle detection
      const checkIsAncestor = (nodeId, potentialParentId) => {
        let current = currFlatNodes.find(n => n.id === potentialParentId);
        const visited = new Set();
        while (current) {
          if (current.id === nodeId) return true;
          if (visited.has(current.id)) return true;
          visited.add(current.id);
          current = current.parentId ? currFlatNodes.find(n => n.id === current.parentId) : null;
        }
        return false;
      };

      if (payload.parentId && payload.id && checkIsAncestor(payload.id, payload.parentId)) {
        throw new Error(`Circular reference detected: Parent node "${payload.parentId}" is a descendant of this node "${payload.id}".`);
      }

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
    skillId: true,
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
        const parsed = JSON.parse(storedColumns);
        setVisibleColumns(prev => ({ ...prev, ...parsed }));
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
        skillId: qSkillId,
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
  }, [qSearch, qSubject, qTopic, qSkillId, qType, qAudioStatus, qPage]);

  // Reset page when libraryMode changes
  useEffect(() => {
    setQPage(1);
  }, [libraryMode]);

  // Flatten templates catalog and dynamic templates for listing/filtering
  const allTemplates = useMemo(() => {
    const list = [];
    if (templatesCatalog) {
      for (const [subjectKey, subjectVal] of Object.entries(templatesCatalog)) {
        for (const [topicKey, topicTemplates] of Object.entries(subjectVal)) {
          if (Array.isArray(topicTemplates)) {
            topicTemplates.forEach(tpl => {
              list.push({
                ...tpl,
                subject: subjectKey,
                topic: topicKey,
                isStatic: true
              });
            });
          }
        }
      }
    }
    if (Array.isArray(dynamicTemplates)) {
      dynamicTemplates.forEach(tpl => {
        list.push({
          ...tpl,
          subject: tpl.subject || '',
          topic: tpl.topic || '',
          isStatic: false
        });
      });
    }
    return list;
  }, [templatesCatalog, dynamicTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(tpl => {
      // 1. Search phrase filter
      if (qSearch) {
        const searchLower = qSearch.toLowerCase();
        const matchesId = String(tpl.id || '').toLowerCase().includes(searchLower);
        const matchesTitle = String(tpl.title || '').toLowerCase().includes(searchLower);
        const matchesText = String(tpl.questionText || '').toLowerCase().includes(searchLower);
        if (!matchesId && !matchesTitle && !matchesText) return false;
      }
      
      // 2. Subject filter
      if (qSubject && String(tpl.subject || '').toLowerCase() !== qSubject.toLowerCase()) {
        return false;
      }
      
      // 3. Topic filter
      if (qTopic && String(tpl.topic || '').toLowerCase() !== qTopic.toLowerCase()) {
        return false;
      }
      
      // 4. Format Type filter
      if (qType && qType !== 'all') {
        const tplType = tpl.optionsType || tpl.type || 'mcq';
        if (String(tplType).toLowerCase() !== qType.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [allTemplates, qSearch, qSubject, qTopic, qType]);

  const paginatedTemplates = useMemo(() => {
    return filteredTemplates.slice((qPage - 1) * 15, qPage * 15);
  }, [filteredTemplates, qPage]);

  const tTotalTemplates = filteredTemplates.length;
  const tTotalPages = Math.ceil(tTotalTemplates / 15) || 1;

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm(`Are you sure you want to delete the template "${templateId}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/templates?id=${encodeURIComponent(templateId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', text: `Successfully deleted template "${templateId}".` });
        loadTemplatesCatalog(); // Refresh
      } else {
        throw new Error(data.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Could not delete template: ${err.message}` });
    }
  };

  const handleCloneRandomQuestions = async () => {
    if (!qSubject || !qTopic) {
      setAlert({ type: 'error', text: 'Please select a specific Subject and Topic/Skill in the filters to clone from.' });
      return;
    }

    const targetSkillId = cloneSkillId === '__custom__' ? customCloneSkillId.trim() : cloneSkillId.trim();

    setCloningInProgress(true);
    const skillText = targetSkillId ? ` (Skill: ${targetSkillId})` : '';
    setAlert({ type: 'info', text: `Cloning ${cloneCount} random questions from ${qSubject.toUpperCase()} / ${qTopic.toUpperCase()}${skillText} as drafts...` });

    try {
      const res = await fetch('/api/admin/questions/clone-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: qSubject,
          topic: qTopic,
          skillId: targetSkillId || undefined,
          count: cloneCount
        })
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', text: `Successfully cloned ${data.clonedCount} questions as drafts! Check the library list below.` });
        fetchQuestions();
      } else {
        throw new Error(data.error || 'Failed to clone questions');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Cloning failed: ${err.message}` });
    } finally {
      setCloningInProgress(false);
    }
  };

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
      loadCurrTree();
      loadTemplatesCatalog();
    } else if (activeTab === 'cache') {
      fetchCacheItems();
    } else if (activeTab === 'curriculum' || activeTab === 'authoring') {
      loadCurrTree();
      loadTemplatesCatalog();
    }
  }, [activeTab, fetchQuestions, fetchCacheItems, loadCurrTree, loadTemplatesCatalog]);

  useEffect(() => {
    if (currForm.type === 'skill' && (templatesCatalog || dynamicTemplates.length > 0)) {
      const templateId = currSelected?.templateId || '';
      if (templateId) {
        let isKnown = false;
        if (templatesCatalog) {
          for (const subject of Object.values(templatesCatalog)) {
            for (const topicTemplates of Object.values(subject)) {
              if (topicTemplates.some(t => t.id === templateId)) {
                isKnown = true;
                break;
              }
            }
            if (isKnown) break;
          }
        }
        if (!isKnown && dynamicTemplates) {
          isKnown = dynamicTemplates.some(t => t.id === templateId);
        }
        setUseCustomTemplateId(!isKnown);
      } else {
        setUseCustomTemplateId(false);
      }
    }
  }, [currSelected, templatesCatalog, dynamicTemplates]);

  // Reset library page on filter changes
  useEffect(() => {
    setQPage(1);
  }, [qSearch, qSubject, qTopic, qSkillId, qType, qAudioStatus]);

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
    const maxOptions = type === 'dynamic_pool' ? 100 : 8;
    if (options.length >= maxOptions) return;
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

  const updateOptionImageUrl = (idx, url) => {
    const updated = [...options];
    updated[idx].imageUrl = url;
    setOptions(updated);
  };

  const updateOptionHideLabel = (idx, hide) => {
    const updated = [...options];
    updated[idx].hideLabel = hide;
    setOptions(updated);
  };

  const updateOptionDistractors = (idx, val) => {
    const updated = [...options];
    updated[idx].distractors = val;
    setOptions(updated);
  };

  const addCorrectOption = () => {
    const maxOptions = type === 'dynamic_pool' ? 100 : 8;
    if (options.length >= maxOptions) return;
    setOptions([...options, { label: `Target ${options.filter(o => !o.isDistractorOnly).length + 1}`, isCorrect: false, isDistractorOnly: false, misconceptionType: 'general_confusion', similarity: 'medium', explanation: '' }]);
  };

  const addDistractorOption = () => {
    const maxOptions = type === 'dynamic_pool' ? 100 : 8;
    if (options.length >= maxOptions) return;
    setOptions([...options, { label: `Distractor ${options.filter(o => o.isDistractorOnly).length + 1}`, isCorrect: false, isDistractorOnly: true, misconceptionType: 'general_confusion', similarity: 'medium', explanation: '' }]);
  };

  const bulkAddDynamicPoolOptions = (isDistractorOnly) => {
    const kind = isDistractorOnly ? 'distractors' : 'targets';
    const text = prompt(`Paste ${kind} separated by commas, spaces, or new lines:`);
    if (!text) return;

    const words = text.split(/[\s,\n]+/).map(word => word.trim()).filter(Boolean);
    if (words.length === 0) return;

    const existing = options.filter(option => option.label.trim() !== '');
    const additions = words.slice(0, Math.max(0, 100 - existing.length)).map(label => ({
      label,
      isCorrect: false,
      isDistractorOnly,
      ...(isDistractorOnly ? { misconceptionType: 'general_confusion', similarity: 'medium' } : { explanation: '' })
    }));
    setOptions([...existing, ...additions]);
    setIsDirty(true);
  };

  const updateOptionExplanation = (idx, val) => {
    const updated = [...options];
    updated[idx].explanation = val;
    setOptions(updated);
  };

  const updateOptionMisconception = (idx, val) => {
    const updated = [...options];
    updated[idx].misconceptionType = val;
    setOptions(updated);
  };

  const updateOptionSimilarity = (idx, val) => {
    const updated = [...options];
    updated[idx].similarity = val;
    setOptions(updated);
  };

  const handleAutoLinkOptions = async () => {
    const hasLabels = options.some(opt => opt.label.trim());
    if (!hasLabels) {
      setAlert({ type: 'error', text: 'Please type some option text labels first to auto-link matching assets.' });
      return;
    }

    setAlert({ type: 'info', text: 'Scanning database for matching images and audio files...' });
    try {
      const imagesRes = await fetch('/api/admin/list-images?prefix=images/');
      const imagesData = await imagesRes.json();
      const imagesList = imagesData.images || [];

      const audioRes = await fetch('/api/admin/list-audio?prefix=audio/');
      const audioData = await audioRes.json();
      const audioList = audioData.audio || [];

      const updated = [...options];
      let linkedImagesCount = 0;
      let linkedAudioCount = 0;
      const matchedDetails = [];

      for (let i = 0; i < updated.length; i++) {
        const label = updated[i].label.trim().toLowerCase();
        if (!label) continue;

        let imageMatched = false;
        let audioMatched = false;

        if (!updated[i].imageUrl) {
          const matchedImg = imagesList.find(img => {
            const cleanKey = img.key.substring(img.key.lastIndexOf('/') + 1)
              .split(/[?#]/)[0]
              .replace(/\.[^/.]+$/, "")
              .toLowerCase()
              .replace(/[-_]/g, ' ')
              .trim();
            const filenameMatch = cleanKey === label || cleanKey.includes(label);
            const tagMatch = img.classification?.tags?.some(tag => tag.toLowerCase().trim() === label);
            return filenameMatch || tagMatch;
          });

          if (matchedImg) {
            updated[i].imageUrl = matchedImg.url;
            linkedImagesCount++;
            imageMatched = true;
          }
        }

        if (!updated[i].audioUrl) {
          const matchedAud = audioList.find(aud => {
            const cleanKey = aud.key.substring(aud.key.lastIndexOf('/') + 1)
              .split(/[?#]/)[0]
              .replace(/\.[^/.]+$/, "")
              .toLowerCase()
              .replace(/[-_]/g, ' ')
              .trim();
            return cleanKey === label || cleanKey.includes(label);
          });

          if (matchedAud) {
            updated[i].audioUrl = matchedAud.url;
            linkedAudioCount++;
            audioMatched = true;
          }
        }

        if (imageMatched || audioMatched) {
          const subDetails = [];
          if (imageMatched) subDetails.push('Image 🖼️');
          if (audioMatched) subDetails.push('Audio 🔊');
          matchedDetails.push(`"${updated[i].label}" (${subDetails.join(' + ')})`);
        }
      }

      setOptions(updated);

      if (linkedImagesCount > 0 || linkedAudioCount > 0) {
        setAlert({ 
          type: 'success', 
          text: `Auto-linked ${linkedImagesCount} images and ${linkedAudioCount} audio files for: ${matchedDetails.join(', ')}!` 
        });
      } else {
        setAlert({ 
          type: 'info', 
          text: 'No matching image or audio assets found in database for the typed option labels.' 
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Failed to auto-link option assets: ${err.message}` });
    }
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
    
    // Propagate structural changes to other device layout
    const otherDevice = activePreviewDevice === 'desktop' ? 'mobile' : 'desktop';
    const otherLayout = layouts?.[otherDevice];
    
    const updatedActiveLayout = {
      backgroundImage: backgroundImage || '',
      backgroundSvg: backgroundSvg || '',
      canvasWidth: canvas?.width || (activePreviewDevice === 'mobile' ? 360 : 800),
      canvasHeight: canvas?.height || (activePreviewDevice === 'mobile' ? 640 : 465),
      hotspots: nextHotspots
    };
    
    if (otherLayout) {
      const otherHotspots = otherLayout.hotspots || [];
      const updatedOtherHotspots = nextHotspots.map((activeHs, idx) => {
        const matchingHs = otherHotspots.find(h => h.id === activeHs.id || h.optionIndex === activeHs.optionIndex);
        if (matchingHs) {
          return {
            ...matchingHs,
            label: activeHs.label,
            isCorrect: activeHs.isCorrect,
            isCircle: activeHs.isCircle,
            imageUrl: activeHs.imageUrl,
            optionIndex: activeHs.optionIndex ?? idx
          };
        } else {
          // Default mobile vs desktop sizing adjustments
          const otherW = otherDevice === 'mobile' ? Math.min(30, activeHs.width * 2) : Math.max(10, activeHs.width / 2);
          const otherH = otherDevice === 'mobile' ? Math.min(15, activeHs.height * 2) : Math.max(5, activeHs.height / 2);
          return {
            id: activeHs.id,
            label: activeHs.label,
            x: activeHs.x,
            y: activeHs.y,
            width: otherW,
            height: otherH,
            isCircle: activeHs.isCircle,
            isCorrect: activeHs.isCorrect,
            imageUrl: activeHs.imageUrl,
            optionIndex: activeHs.optionIndex ?? idx
          };
        }
      });
      
      const filteredOtherHotspots = updatedOtherHotspots.filter(otherHs => 
        nextHotspots.some(activeHs => activeHs.id === otherHs.id || activeHs.optionIndex === otherHs.optionIndex)
      );
      
      setLayouts(prev => ({
        ...prev,
        [activePreviewDevice]: updatedActiveLayout,
        [otherDevice]: {
          ...otherLayout,
          hotspots: filteredOtherHotspots
        }
      }));
    } else {
      setLayouts(prev => ({
        ...prev,
        [activePreviewDevice]: updatedActiveLayout
      }));
    }
  };

  const switchPreviewDevice = (nextDevice) => {
    if (nextDevice === activePreviewDevice) return;
    
    const currentLayoutConfig = {
      backgroundImage: backgroundImage || '',
      backgroundSvg: backgroundSvg || '',
      canvasWidth: canvas?.width || (activePreviewDevice === 'mobile' ? 360 : 800),
      canvasHeight: canvas?.height || (activePreviewDevice === 'mobile' ? 640 : 465),
      hotspots: hotspots
    };
    
    const updatedLayouts = {
      ...layouts,
      [activePreviewDevice]: currentLayoutConfig
    };
    setLayouts(updatedLayouts);
    
    const nextConfig = updatedLayouts[nextDevice] || {
      backgroundImage: '',
      backgroundSvg: '',
      canvasWidth: nextDevice === 'mobile' ? 360 : 800,
      canvasHeight: nextDevice === 'mobile' ? 640 : 465,
      hotspots: hotspots.map(hs => ({
        ...hs,
        width: nextDevice === 'mobile' ? Math.min(30, hs.width * 2) : Math.max(10, hs.width / 2),
        height: nextDevice === 'mobile' ? Math.min(15, hs.height * 2) : Math.max(5, hs.height / 2)
      }))
    };
    
    setActivePreviewDevice(nextDevice);
    setBackgroundImage(nextConfig.backgroundImage || '');
    setBackgroundSvg(nextConfig.backgroundSvg || '');
    setCanvas({ width: nextConfig.canvasWidth, height: nextConfig.canvasHeight });
    
    if (nextConfig.hotspots && nextConfig.hotspots.length === hotspots.length) {
      setHotspots(nextConfig.hotspots);
    } else {
      const initializedHotspots = hotspots.map((hs, idx) => {
        const existingHs = nextConfig.hotspots?.find(h => h.id === hs.id || h.optionIndex === hs.optionIndex || h.label === hs.label);
        if (existingHs) return existingHs;
        return {
          ...hs,
          width: nextDevice === 'mobile' ? Math.min(30, hs.width * 2) : Math.max(10, hs.width / 2),
          height: nextDevice === 'mobile' ? Math.min(15, hs.height * 2) : Math.max(5, hs.height / 2)
        };
      });
      setHotspots(initializedHotspots);
    }
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
    } else if (partType === 'audio') {
      newPart.audioUrl = '';
      newPart.label = '';
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
    setPoolId('');
    setTargetCategory('');
    setTargetKey('nouns');
    setDistractorCategories('');
    setMissingLetterMode('beginning');
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
    setArrangeImagesRow(false);
    setCommonImageWidth(180);
    setDirectImageSelect(false);
    setHideOptionImages(false);
    setHideOptionLabel(false);
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
    setIsHotspotTransparent(false);
    setActivePreviewDevice('desktop');
    setLayouts({ desktop: null, mobile: null });
    setShadowStickers([]);
    setShadowTargets([]);
    setShadowSceneImageUrl('');
    setSelectedShadowTargetId(null);

    setPreviewAnswer(null);
    setPreviewCheckResult(null);
    setPreviewSimulateState(null);
    setIsDirty(false);
    setAutosaveStatus('');
    setQuestionStatus('active');
  };

  const handleEmptyFields = () => {
    ignoreDirtyChange.current = true;
    setEditMode(false);
    setEditId(null);
    setSubject('english');
    setTopic('');
    setSkillId('');
    setDifficulty('beginner');
    setType('mcq');
    setQuestionText('');
    setVoice('Puck');
    setExplanation('');
    setAudioUrl('');
    setGenerateAudioCheckbox('all');
    setReadable(true);
    setReadOptions(true);
    setOptions([
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
    ]);
    setCorrectAnswer('');
    
    setParts([
      { type: 'text', content: '' }
    ]);
    setArrangeImagesRow(false);
    setCommonImageWidth(180);
    setDirectImageSelect(false);
    setHideOptionImages(false);
    setCategories([]);
    setCategorizationItems([]);
    setFibAnswers({});
    
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
    setIsHotspotTransparent(false);
    setActivePreviewDevice('desktop');
    setLayouts({ desktop: null, mobile: null });
    setShadowStickers([]);
    setShadowTargets([]);
    setShadowSceneImageUrl('');
    setSelectedShadowTargetId(null);

    setPreviewAnswer(null);
    setPreviewCheckResult(null);
    setPreviewSimulateState(null);
    setIsDirty(false);
    setAutosaveStatus('');
    setQuestionStatus('active');
  };

  const handleEmptyFieldsWithConfirm = () => {
    if (isDirty) {
      if (!window.confirm('Are you sure you want to discard your changes and clear all form fields?')) {
        return;
      }
    }
    handleEmptyFields();
    localStorage.removeItem('curriculum_authoring_draft');
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
    setQuestionStatus(q.status || 'active');
    const loadedLayoutMode = q.layoutMode || q.metadata?.layoutMode || '';
    const loadedInteraction = q.interaction || q.metadata?.interaction || '';
    const loadedType = q.type === 'dynamic_pool' && loadedLayoutMode === 'word_completion'
      ? 'word_completion_pool'
      : (q.type || 'mcq');
    setType(loadedType);
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
    
    setTeacherNotes(q.teacherNotes || q.metadata?.teacherNotes || '');
    setTags(Array.isArray(q.tags) ? q.tags.join(', ') : (q.tags || q.metadata?.tags?.join(', ') || ''));
    setEstimatedGrade(q.estimatedGrade || q.metadata?.estimatedGrade || '');
    setTimeEstimate(q.timeEstimate || q.metadata?.timeEstimate || '');
    setSourceMapping(q.sourceMapping || q.metadata?.sourceMapping || '');
    const activePoolId = q.poolId || q.metadata?.poolId || '';
    setPoolId(activePoolId);
    setTargetCategory(q.targetCategory || q.metadata?.targetCategory || '');
    setTargetKey(q.targetKey || q.metadata?.targetKey || 'nouns');
    setMissingLetterMode(q.missingLetterMode || q.metadata?.missingLetterMode || 'beginning');
    setDistractorCategories(
      Array.isArray(q.distractorCategories || q.metadata?.distractorCategories)
        ? (q.distractorCategories || q.metadata?.distractorCategories).join(', ')
        : (q.distractorCategories || q.metadata?.distractorCategories || '')
    );

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
    setLayoutMode(loadedLayoutMode);
    setInteraction(loadedInteraction);
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
    const extractedIsHotspotTransparent = Boolean(
      q.transparent || 
      q.behavior?.transparent || 
      q.metadata?.transparent ||
      q.parts?.find(p => p.type === 'hotspot_canvas')?.transparent
    );
    setIsHotspotTransparent(extractedIsHotspotTransparent);

    // Reconstruct MCQ hotspot select variables
    if (q.interaction === 'hotspot_select' || q.interaction === 'hotspot_multi_select' || q.layoutMode === 'height_comparison' || q.layoutMode === 'mcq_hotspot') {
      setType('mcq_hotspot');
      setIsHotspotMultiSelect(q.interaction === 'hotspot_multi_select');
      const hotspotPart = q.parts?.find(p => p.type === 'hotspot_canvas');
      
      const resolvedLayouts = q.layouts || q.metadata?.layouts || hotspotPart?.layouts;
      if (resolvedLayouts) {
        // Reconstruct from layouts
        const desktopLayout = {
          backgroundImage: resolvedLayouts.desktop?.backgroundImage || resolvedLayouts.desktop?.backgroundUrl || '',
          backgroundSvg: resolvedLayouts.desktop?.backgroundSvg || '',
          canvasWidth: resolvedLayouts.desktop?.canvasWidth || 800,
          canvasHeight: resolvedLayouts.desktop?.canvasHeight || 465,
          hotspots: []
        };
        const mobileLayout = {
          backgroundImage: resolvedLayouts.mobile?.backgroundImage || resolvedLayouts.mobile?.backgroundUrl || '',
          backgroundSvg: resolvedLayouts.mobile?.backgroundSvg || '',
          canvasWidth: resolvedLayouts.mobile?.canvasWidth || 360,
          canvasHeight: resolvedLayouts.mobile?.canvasHeight || 640,
          hotspots: []
        };
        
        const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer;
        
        // 1. Desktop hotspots
        const dRaw = resolvedLayouts.desktop?.hotspots || [];
        if (dRaw.length > 0) {
          desktopLayout.hotspots = dRaw.map((hs, idx) => {
            const isPixel = hs.x > 100 || hs.y > 100 || hs.width > 100 || hs.height > 100;
            return {
              id: hs.id || `hs_${idx}_${Date.now()}`,
              label: hs.label || `Hotspot ${idx + 1}`,
              x: isPixel ? parseFloat(((hs.x / desktopLayout.canvasWidth) * 100).toFixed(2)) : hs.x,
              y: isPixel ? parseFloat(((hs.y / desktopLayout.canvasHeight) * 100).toFixed(2)) : hs.y,
              width: isPixel ? parseFloat(((hs.width / desktopLayout.canvasWidth) * 100).toFixed(2)) : hs.width,
              height: isPixel ? parseFloat(((hs.height / desktopLayout.canvasHeight) * 100).toFixed(2)) : hs.height,
              isCircle: Boolean(hs.isCircle),
              imageUrl: hs.imageUrl || undefined,
              optionIndex: hs.optionIndex ?? idx,
              isCorrect: hs.isCorrect ?? (hs.optionIndex === correctIdx || idx === correctIdx)
            };
          });
        }
        
        // 2. Mobile hotspots
        const mRaw = resolvedLayouts.mobile?.hotspots || [];
        if (mRaw.length > 0) {
          mobileLayout.hotspots = mRaw.map((hs, idx) => {
            const isPixel = hs.x > 100 || hs.y > 100 || hs.width > 100 || hs.height > 100;
            return {
              id: hs.id || `hs_${idx}_${Date.now()}`,
              label: hs.label || `Hotspot ${idx + 1}`,
              x: isPixel ? parseFloat(((hs.x / mobileLayout.canvasWidth) * 100).toFixed(2)) : hs.x,
              y: isPixel ? parseFloat(((hs.y / mobileLayout.canvasHeight) * 100).toFixed(2)) : hs.y,
              width: isPixel ? parseFloat(((hs.width / mobileLayout.canvasWidth) * 100).toFixed(2)) : hs.width,
              height: isPixel ? parseFloat(((hs.height / mobileLayout.canvasHeight) * 100).toFixed(2)) : hs.height,
              isCircle: Boolean(hs.isCircle),
              imageUrl: hs.imageUrl || undefined,
              optionIndex: hs.optionIndex ?? idx,
              isCorrect: hs.isCorrect ?? (hs.optionIndex === correctIdx || idx === correctIdx)
            };
          });
        }
        
        setLayouts({ desktop: desktopLayout, mobile: mobileLayout });
        setActivePreviewDevice('desktop');
        setBackgroundImage(desktopLayout.backgroundImage);
        setBackgroundSvg(desktopLayout.backgroundSvg);
        setCanvas({ width: desktopLayout.canvasWidth, height: desktopLayout.canvasHeight });
        setHotspots(desktopLayout.hotspots);
      } else {
        // Fallback to legacy structure
        const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer;
        const loadedBgImage = q.backgroundImage || hotspotPart?.backgroundUrl || '';
        const loadedBgSvg = hotspotPart?.backgroundSvg || '';
        const canvasW = hotspotPart?.canvasWidth || 800;
        const canvasH = hotspotPart?.canvasHeight || 465;
        
        let loadedHotspots = [];
        const rawHotspots = q.hotspots || q.metadata?.hotspots;
        if (rawHotspots && Array.isArray(rawHotspots)) {
          loadedHotspots = rawHotspots.map((hs, idx) => ({
            ...hs,
            isCorrect: hs.isCorrect ?? (hs.optionIndex === correctIdx || idx === correctIdx)
          }));
        } else if (hotspotPart?.hotspots && Array.isArray(hotspotPart.hotspots)) {
          loadedHotspots = hotspotPart.hotspots.map((hs, idx) => ({
            id: `hs_${idx}_${Date.now()}`,
            label: hs.label || `Hotspot ${idx + 1}`,
            x: parseFloat(((hs.x / canvasW) * 100).toFixed(2)),
            y: parseFloat(((hs.y / canvasH) * 100).toFixed(2)),
            width: parseFloat(((hs.width / canvasW) * 100).toFixed(2)),
            height: parseFloat(((hs.height / canvasH) * 100).toFixed(2)),
            isCircle: Boolean(hs.isCircle),
            imageUrl: hs.imageUrl || undefined,
            optionIndex: hs.optionIndex ?? idx,
            isCorrect: idx === correctIdx
          }));
        }
        
        const desktopLayout = {
          backgroundImage: loadedBgImage,
          backgroundSvg: loadedBgSvg,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          hotspots: loadedHotspots
        };
        
        const mobileLayout = {
          backgroundImage: loadedBgImage,
          backgroundSvg: loadedBgSvg,
          canvasWidth: 360,
          canvasHeight: 640,
          hotspots: loadedHotspots.map(hs => ({
            ...hs,
            width: Math.min(30, hs.width * 2),
            height: Math.min(15, hs.height * 2)
          }))
        };
        
        setLayouts({ desktop: desktopLayout, mobile: mobileLayout });
        setActivePreviewDevice('desktop');
        setBackgroundImage(loadedBgImage);
        setBackgroundSvg(loadedBgSvg);
        setCanvas({ width: canvasW, height: canvasH });
        setHotspots(loadedHotspots);
      }
    } else {
      setHotspots([]);
      setBackgroundSvg('');
      setLayouts({ desktop: null, mobile: null });
      setActivePreviewDevice('desktop');
    }

    // Load shadow match data
    const shadowPart = q.parts?.find(p => p.type === 'interactive_stickers' && p.mode === 'shadow_match');
    if (shadowPart) {
      setType('shadow_match');
      setShadowSceneImageUrl(shadowPart.sceneImageUrl || '');
      setShadowStickers((shadowPart.stickers || []).map((s, i) => ({
        id: s.id ?? i,
        type: s.type || `sticker_${i}`,
        name: s.name || `Sticker ${i + 1}`,
        imageUrl: s.imageUrl || '',
        widthPercent: s.widthPercent || s.width || 14,
        heightPercent: s.heightPercent || s.height || 14,
      })));
      setShadowTargets((shadowPart.targets || []).map((t, i) => ({
        id: t.id || `st_${i}`,
        type: t.type || `sticker_${i}`,
        x: t.x,
        y: t.y,
        widthPercent: t.widthPercent || t.width || 14,
        heightPercent: t.heightPercent || t.height || 14,
      })));
    } else {
      setShadowStickers([]);
      setShadowTargets([]);
      setShadowSceneImageUrl('');
    }

    setArrangeImagesRow(Boolean(q.arrangeImagesRow || q.metadata?.arrangeImagesRow));
    setCommonImageWidth(q.commonImageWidth || q.metadata?.commonImageWidth || 180);
    setDirectImageSelect(Boolean(q.directImageSelect || q.interaction === 'direct_image_select' || q.metadata?.directImageSelect));
    setHideOptionImages(Boolean(q.hideOptionImages || q.metadata?.hideOptionImages));
    setHideOptionLabel(Boolean(q.hideOptionLabel || q.metadata?.hideOptionLabel));

    // Extract parts or default to first question text part
    if (loadedParts.length > 0) {
      setParts(loadedParts.filter(p => p.type !== 'categorization' && p.type !== 'hotspot_canvas'));
    } else {
      setParts([
        { type: 'text', content: q.questionText || '' }
      ]);
    }

    // Parse options & pools
    if (q.pools) {
      const correctPool = q.pools.correctPool || [];
      const distractorPool = q.pools.distractorPool || [];
      
      const loadedOptions = [
        ...correctPool.map(opt => ({
          label: opt.label || '',
          isCorrect: false,
          imageUrl: opt.imageUrl || '',
          audioUrl: opt.audioUrl || '',
          explanation: opt.explanation || '',
          isDistractorOnly: false,
          misconceptionType: 'general_confusion',
          similarity: 'medium'
        })),
        ...distractorPool.map(opt => ({
          label: opt.label || '',
          isCorrect: false,
          imageUrl: opt.imageUrl || '',
          audioUrl: opt.audioUrl || '',
          explanation: '',
          isDistractorOnly: true,
          misconceptionType: opt.misconceptionType || 'general_confusion',
          similarity: opt.similarity || 'medium'
        }))
      ];
      setOptions(loadedOptions.length > 0 ? loadedOptions : [
        { label: '', isCorrect: false, isDistractorOnly: false },
        { label: '', isCorrect: false, isDistractorOnly: true }
      ]);
      
      if (q.difficultyRules) {
        setDifficultyRules({
          easy: {
            optionCount: q.difficultyRules.easy?.optionCount || 2,
            distractorSimilarity: q.difficultyRules.easy?.distractorSimilarity || 'low',
            showLabels: q.difficultyRules.easy?.showLabels !== false
          },
          medium: {
            optionCount: q.difficultyRules.medium?.optionCount || 4,
            distractorSimilarity: q.difficultyRules.medium?.distractorSimilarity || 'medium',
            showLabels: q.difficultyRules.medium?.showLabels !== false
          },
          hard: {
            optionCount: q.difficultyRules.hard?.optionCount || 6,
            distractorSimilarity: q.difficultyRules.hard?.distractorSimilarity || 'high',
            showLabels: q.difficultyRules.hard?.showLabels !== false
          }
        });
      }
    } else if (q.options && Array.isArray(q.options)) {
      const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer;
      setOptions(q.options.map((opt, idx) => ({
        label: opt.label || '',
        isCorrect: idx === correctIdx || opt.isCorrect || false,
        imageUrl: opt.imageUrl || '',
        hideLabel: !!opt.hideLabel,
        audioUrl: opt.audioUrl || '',
        distractors: Array.isArray(opt.distractors) ? opt.distractors.join(', ') : (opt.distractors || ''),
        isDistractorOnly: Boolean(opt.isDistractorOnly),
        misconceptionType: opt.misconceptionType || 'general_confusion',
        similarity: opt.similarity || 'medium',
        explanation: opt.explanation || ''
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
    setAuthoringMode('manual');
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
    setPoolId(tpl.poolId || tpl.metadata?.poolId || '');
    setTargetCategory(tpl.targetCategory || tpl.metadata?.targetCategory || '');
    setTargetKey(tpl.targetKey || tpl.metadata?.targetKey || 'nouns');
    setMissingLetterMode(tpl.missingLetterMode || tpl.metadata?.missingLetterMode || 'beginning');
    setDistractorCategories(
      Array.isArray(tpl.distractorCategories || tpl.metadata?.distractorCategories)
        ? (tpl.distractorCategories || tpl.metadata?.distractorCategories).join(', ')
        : (tpl.distractorCategories || tpl.metadata?.distractorCategories || '')
    );
    
    if (tpl.type === 'mcq') {
      setOptions(tpl.options.map(opt => ({
        label: opt.label,
        isCorrect: opt.isCorrect,
        imageUrl: opt.imageUrl || '',
        hideLabel: !!opt.hideLabel,
        audioUrl: opt.audioUrl || ''
      })));
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

  const parseRawQuestionText = (text) => {
    const lines = text.split('\n');
    let qText = '';
    let parsedOptions = [];
    let parsedCorrect = '';
    let parsedExplanation = '';
    let parsedDifficulty = '';
    let parsedType = '';
    let hasMarkers = false;
    
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
      } else if (lowerLine.startsWith('difficulty:') || lowerLine.startsWith('diff:')) {
        currentSection = 'difficulty';
        const offset = lowerLine.indexOf(':') + 1;
        parsedDifficulty = line.substring(offset).trim();
        continue;
      } else if (lowerLine.startsWith('type:') || lowerLine.startsWith('format:')) {
        currentSection = 'type';
        const offset = lowerLine.indexOf(':') + 1;
        parsedType = line.substring(offset).trim();
        continue;
      }
      
      if (currentSection === 'question') {
        const optMatch = line.match(/^([A-Da-d0-9])[\.\)\-]\s+(.*)/);
        if (optMatch) {
          currentSection = 'options';
          hasMarkers = true;
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
          hasMarkers = true;
          parsedOptions.push({
            label: optMatch[2].trim(),
            isCorrect: false
          });
        } else {
          if (hasMarkers && parsedOptions.length > 0) {
            parsedOptions[parsedOptions.length - 1].label += ' ' + line;
          } else {
            parsedOptions.push({ label: line, isCorrect: false });
          }
        }
      } else if (currentSection === 'correct') {
        parsedCorrect += (parsedCorrect ? ' ' : '') + line;
      } else if (currentSection === 'explanation') {
        parsedExplanation += (parsedExplanation ? '\n' : '') + line;
      } else if (currentSection === 'difficulty') {
        parsedDifficulty += (parsedDifficulty ? ' ' : '') + line;
      } else if (currentSection === 'type') {
        parsedType += (parsedType ? ' ' : '') + line;
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
    
    let normDiff = '';
    const cleanDiff = parsedDifficulty.trim().toLowerCase();
    if (cleanDiff === 'easy' || cleanDiff === 'beginner') normDiff = 'easy';
    else if (cleanDiff === 'medium' || cleanDiff === 'intermediate') normDiff = 'medium';
    else if (cleanDiff === 'hard' || cleanDiff === 'advanced') normDiff = 'hard';
    
    return {
      questionText: qText.trim(),
      options: parsedOptions,
      correctAnswer: parsedCorrect.trim(),
      explanation: parsedExplanation.trim(),
      difficulty: normDiff,
      correctAnswerIndex: finalCorrectIndex,
      type: (() => {
        const cleanType = parsedType.trim().toLowerCase();
        if (cleanType === 'dynamic_pool' || cleanType === 'dynamic-pool' || cleanType === 'pool') {
          return 'dynamic_pool';
        }
        if (cleanType === 'mcq' || cleanType === 'multiplechoice' || cleanType === 'multiple choice') {
          return 'mcq';
        }
        if (cleanType === 'fib' || cleanType === 'fillintheblank' || cleanType === 'fill_in_the_blank') {
          return 'fillInTheBlank';
        }
        return parsedOptions.length > 0 ? 'mcq' : 'fillInTheBlank';
      })()
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
      if (result.difficulty) {
        setDifficulty(result.difficulty);
      }
      
      if (result.type === 'mcq' || result.type === 'dynamic_pool') {
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

  // --- BULK PASTE & PARSE (multi-question, save as draft) ---
  const handleParseBulk = () => {
    if (!rawTextToParse.trim()) {
      setAlert({ type: 'error', text: 'Please paste at least one question.' });
      return;
    }

    // Split by --- (separator) or double blank lines
    const blocks = rawTextToParse
      .split(/\n---+\n|\n\s*\n\s*\n/)
      .map(b => b.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      setAlert({ type: 'error', text: 'No question blocks found. Separate questions with ---.' });
      return;
    }

    const results = [];
    const errors = [];

    blocks.forEach((block, idx) => {
      try {
        const parsed = parseRawQuestionText(block);
        if (!parsed.questionText) throw new Error('No question text found.');
        results.push({ ...parsed, _blockIndex: idx + 1, _raw: block });
      } catch (e) {
        errors.push(`Block ${idx + 1}: ${e.message}`);
      }
    });

    setParsedBatch(results);

    if (errors.length > 0) {
      setAlert({ type: 'error', text: `Parsed ${results.length} questions. ${errors.length} failed: ${errors.join('; ')}` });
    } else {
      setAlert({ type: 'success', text: `Parsed ${results.length} question(s) successfully. Fill in the skill fields below and click Save All as Drafts.` });
    }
  };

  const handleSaveParsedBulk = async () => {
    if (parsedBatch.length === 0) {
      setAlert({ type: 'error', text: 'No parsed questions to save. Parse first.' });
      return;
    }
    if (!parseBatchSubject || !parseBatchTopic || !parseBatchSkillId) {
      setAlert({ type: 'error', text: 'Please fill in Subject, Topic, and Skill ID before saving.' });
      return;
    }

    setParseBatchSaving(true);
    setAlert({ type: 'info', text: `Saving ${parsedBatch.length} questions as drafts...` });

    let saved = 0;
    const errs = [];

    for (let i = 0; i < parsedBatch.length; i++) {
      const q = parsedBatch[i];
      try {
        const payload = {
          subject: parseBatchSubject,
          topic: parseBatchTopic,
          skillId: parseBatchSkillId,
          difficulty: q.difficulty || parseBatchDifficulty || 'easy',
          type: q.type || 'mcq',
          questionText: q.questionText,
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          correctAnswerIndex: q.correctAnswerIndex ?? -1,
          explanation: q.explanation || '',
          status: 'draft',
          voice: 'Puck',
          generateAudio: 'none', // don't auto-generate audio on bulk paste draft
        };

        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: payload, mode: 'insert' })
        });
        const data = await res.json();
        if (data.success) {
          saved++;
        } else {
          errs.push(`Q${i + 1}: ${data.error || 'Save failed'}`);
        }
      } catch (e) {
        errs.push(`Q${i + 1}: ${e.message}`);
      }
    }

    setParseBatchSaving(false);

    if (errs.length === 0) {
      setAlert({ type: 'success', text: `✅ ${saved} question(s) saved as drafts! Find them in the Questions Library.` });
      setParsedBatch([]);
      setRawTextToParse('');
      fetchQuestions();
    } else {
      setAlert({ type: 'error', text: `Saved ${saved}. Errors: ${errs.join('; ')}` });
      fetchQuestions();
    }
  };

  const handleGenerateAiBulk = async () => {
    if (!aiPrompt.trim()) {
      setAlert({ type: 'error', text: 'Please provide prompt guidelines.' });
      return;
    }

    setGeneratingAi(true);
    setAlert({ type: 'info', text: 'Generating draft questions via Gemini. Please wait...' });

    try {
      const res = await fetch('/api/admin/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          subject,
          topic,
          skillId,
          difficulty,
          count: aiCount
        })
      });

      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', text: `Successfully generated ${data.questions.length} draft questions! Find them in the Questions Library.` });
        setAiPrompt('');
        fetchQuestions();
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to generate questions.' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: err.message });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleApproveQuestion = async (q) => {
    try {
      const updated = {
        ...q,
        status: 'active',
      };
      
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: updated,
          mode: 'upsert'
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', text: `Question ${q.id} approved and published successfully!` });
        fetchQuestions();
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to approve question.' });
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: err.message });
    }
  };

  const handleImportJSON = async () => {
    if (!jsonTextToImport.trim()) {
      setJsonValidationError('Please enter JSON text.');
      return;
    }
    
    try {
      const data = JSON.parse(jsonTextToImport);
      setJsonValidationError(null);
      
      // Check if it is a vocabulary pool document
      const pools = data.pools || data.categories;
      if (data.poolId && pools) {
        setJsonValidationError('Saving vocabulary pool to database...');
        try {
          const res = await fetch('/api/admin/vocabulary-pools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, pools })
          });
          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.error || 'Failed to save vocabulary pool.');
          }
          
          // Refresh vocabulary pools list
          await fetchVocabularyPools();
          
          // Automatically switch type to dynamic_pool and prefill the poolId
          setType('dynamic_pool');
          setPoolId(data.poolId);
          setTargetCategory('');
          setDistractorCategories('');
          setCategories([]);
          
          setAuthoringMode('manual');
          setJsonValidationError(null);
          setAlert({ type: 'success', text: `Successfully imported and saved vocabulary pool "${data.poolId}"!` });
        } catch (dbErr) {
          setJsonValidationError(`Database Error: ${dbErr.message}`);
        }
        return;
      }
      
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
      const maxOptions = type === 'dynamic_pool' ? 100 : 8;
      if (options.length < maxOptions) {
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
          poolId,
          targetCategory,
          targetKey,
          distractorCategories,
          missingLetterMode,
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
          hideOptionImages,
          hideOptionLabel,
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
    sourceMapping, poolId, targetCategory, targetKey, distractorCategories, parts, categories, categorizationItems,
    missingLetterMode, layoutMode, interaction, targets, backgroundImage, canvas, behavior, sourceTray,
    cardStyle, hideItemLabels, hideOptionImages, hideOptionLabel
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
      setPoolId(draft.poolId || '');
      setTargetCategory(draft.targetCategory || '');
      setTargetKey(draft.targetKey || 'nouns');
      setDistractorCategories(draft.distractorCategories || '');
      setMissingLetterMode(draft.missingLetterMode || 'beginning');
      
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
    setHideOptionImages(Boolean(draft.hideOptionImages));
    setHideOptionLabel(Boolean(draft.hideOptionLabel));
      
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
      arrangeImagesRow,
      commonImageWidth: Number(commonImageWidth) || 180,
      directImageSelect,
      metaConfig: {
        readable,
        readOptions,
        hasClickToFill: interaction === 'pick_from_sentence' ? true : undefined
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
        arrangeImagesRow,
        commonImageWidth: Number(commonImageWidth) || 180,
        directImageSelect,
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

    if (type === 'shadow_match') {
      // Serialize shadow match question
      payload.type = 'mcq';
      payload.interaction = 'interactive_stickers';
      payload.correctAnswerIndex = undefined;
      payload.answer = null;
      payload.options = [];

      const shadowMatchPart = {
        type: 'interactive_stickers',
        mode: 'shadow_match',
        sceneImageUrl: shadowSceneImageUrl || '',
        stickers: shadowStickers.map(s => ({
          id: s.id,
          type: s.type,
          name: s.name,
          imageUrl: s.imageUrl,
          widthPercent: Number(s.widthPercent) || 14,
          heightPercent: Number(s.heightPercent) || 14,
        })),
        targets: shadowTargets.map(t => ({
          id: t.id,
          type: t.type,
          x: Number(t.x),
          y: Number(t.y),
          widthPercent: Number(t.widthPercent) || 14,
          heightPercent: Number(t.heightPercent) || 14,
        })),
        itemLabel: 'sticker',
      };

      payload.parts = [...parts.map(p => ({ ...p })), shadowMatchPart];
      payload.metadata.layoutMode = 'shadow_match';
      payload.layoutMode = 'shadow_match';

    } else if (type === 'mcq_hotspot') {
      const activeConfig = {
        backgroundImage: backgroundImage || '',
        backgroundSvg: backgroundSvg || '',
        canvasWidth: canvas?.width || (activePreviewDevice === 'mobile' ? 360 : 800),
        canvasHeight: canvas?.height || (activePreviewDevice === 'mobile' ? 640 : 465),
        hotspots: hotspots
      };

      const finalLayouts = {
        desktop: activePreviewDevice === 'desktop' ? activeConfig : (layouts.desktop || {
          backgroundImage: '',
          backgroundSvg: '',
          canvasWidth: 800,
          canvasHeight: 465,
          hotspots: []
        }),
        mobile: activePreviewDevice === 'mobile' ? activeConfig : (layouts.mobile || {
          backgroundImage: '',
          backgroundSvg: '',
          canvasWidth: 360,
          canvasHeight: 640,
          hotspots: []
        })
      };

      // Ensure that if mobile hotspots have no items but desktop does, we copy options & correct tags
      if (finalLayouts.desktop.hotspots.length > 0 && finalLayouts.mobile.hotspots.length === 0) {
        finalLayouts.mobile.hotspots = finalLayouts.desktop.hotspots.map(hs => ({
          ...hs,
          width: Math.min(30, hs.width * 2),
          height: Math.min(15, hs.height * 2)
        }));
      }

      const serializedDesktopHotspots = finalLayouts.desktop.hotspots.map((hs, idx) => ({
        optionIndex: hs.optionIndex ?? idx,
        x: Math.round((hs.x / 100) * finalLayouts.desktop.canvasWidth),
        y: Math.round((hs.y / 100) * finalLayouts.desktop.canvasHeight),
        width: Math.round((hs.width / 100) * finalLayouts.desktop.canvasWidth),
        height: Math.round((hs.height / 100) * finalLayouts.desktop.canvasHeight),
        label: hs.label,
        isCircle: hs.isCircle,
        imageUrl: hs.imageUrl || undefined,
        id: hs.id || undefined
      }));

      const serializedMobileHotspots = finalLayouts.mobile.hotspots.map((hs, idx) => ({
        optionIndex: hs.optionIndex ?? idx,
        x: Math.round((hs.x / 100) * finalLayouts.mobile.canvasWidth),
        y: Math.round((hs.y / 100) * finalLayouts.mobile.canvasHeight),
        width: Math.round((hs.width / 100) * finalLayouts.mobile.canvasWidth),
        height: Math.round((hs.height / 100) * finalLayouts.mobile.canvasHeight),
        label: hs.label,
        isCircle: hs.isCircle,
        imageUrl: hs.imageUrl || undefined,
        id: hs.id || undefined
      }));

      payload.type = 'mcq';
      payload.interaction = isHotspotMultiSelect ? 'hotspot_multi_select' : 'hotspot_select';
      
      payload.options = hotspots.map((hs, idx) => ({
        id: `opt_${idx}`,
        label: hs.label.trim(),
      }));
      
      const correctIdx = hotspots.findIndex(hs => hs.isCorrect);
      payload.correctAnswerIndex = correctIdx;
      payload.answer = correctIdx;
      
      payload.hotspots = finalLayouts.desktop.hotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent }));
      payload.metadata.hotspots = finalLayouts.desktop.hotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent }));
      payload.metadata.layoutMode = 'mcq_hotspot';
      payload.layoutMode = 'mcq_hotspot';
      payload.transparent = isHotspotTransparent;
      payload.metadata.transparent = isHotspotTransparent;

      payload.layouts = {
        desktop: {
          backgroundImage: finalLayouts.desktop.backgroundImage || undefined,
          backgroundSvg: finalLayouts.desktop.backgroundSvg || undefined,
          canvasWidth: finalLayouts.desktop.canvasWidth,
          canvasHeight: finalLayouts.desktop.canvasHeight,
          hotspots: finalLayouts.desktop.hotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent }))
        },
        mobile: {
          backgroundImage: finalLayouts.mobile.backgroundImage || undefined,
          backgroundSvg: finalLayouts.mobile.backgroundSvg || undefined,
          canvasWidth: finalLayouts.mobile.canvasWidth,
          canvasHeight: finalLayouts.mobile.canvasHeight,
          hotspots: finalLayouts.mobile.hotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent }))
        }
      };
      payload.metadata.layouts = payload.layouts;
      
      const hotspotPart = {
        type: 'hotspot_canvas',
        canvasWidth: finalLayouts.desktop.canvasWidth,
        canvasHeight: finalLayouts.desktop.canvasHeight,
        hotspots: serializedDesktopHotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent })),
        showHotspotLabels: showHotspotLabels,
        transparent: isHotspotTransparent,
        layouts: {
          desktop: {
            backgroundUrl: finalLayouts.desktop.backgroundImage || undefined,
            backgroundSvg: finalLayouts.desktop.backgroundSvg || undefined,
            canvasWidth: finalLayouts.desktop.canvasWidth,
            canvasHeight: finalLayouts.desktop.canvasHeight,
            hotspots: serializedDesktopHotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent }))
          },
          mobile: {
            backgroundUrl: finalLayouts.mobile.backgroundImage || undefined,
            backgroundSvg: finalLayouts.mobile.backgroundSvg || undefined,
            canvasWidth: finalLayouts.mobile.canvasWidth,
            canvasHeight: finalLayouts.mobile.canvasHeight,
            hotspots: serializedMobileHotspots.map(hs => ({ ...hs, transparent: isHotspotTransparent }))
          }
        }
      };
      if (finalLayouts.desktop.backgroundImage) hotspotPart.backgroundUrl = finalLayouts.desktop.backgroundImage;
      if (finalLayouts.desktop.backgroundSvg) hotspotPart.backgroundSvg = finalLayouts.desktop.backgroundSvg;
      
      payload.parts = [...parts.map(p => ({ ...p })), hotspotPart];
    } else if (type === 'mcq') {
      if (directImageSelect) {
        payload.interaction = 'direct_image_select';
        payload.directImageSelect = true;
        payload.metadata.directImageSelect = true;
        payload.options = [];
        const correctIdx = parts.findIndex(p => p.isCorrect);
        payload.correctAnswerIndex = correctIdx >= 0 ? correctIdx : null;
        payload.answer = correctIdx >= 0 ? correctIdx : null;
        payload.parts = parts.map(p => ({ ...p }));
      } else {
        payload.options = options.map((opt, idx) => ({
          id: `opt_${idx}`,
          label: opt.label.trim(),
          imageUrl: opt.imageUrl || undefined,
          hideLabel: opt.hideLabel || undefined,
          audioUrl: opt.audioUrl || undefined,
        }));
        const correctIdx = options.findIndex(opt => opt.isCorrect);
        payload.correctAnswerIndex = correctIdx;
        payload.answer = correctIdx;
        payload.parts = parts.map(p => ({ ...p }));
      }
    } else if (type === 'word_completion_pool') {
      const selectedCategory = targetCategory.trim();
      payload.type = 'dynamic_pool';
      payload.interaction = 'categorizationv2';
      payload.layoutMode = 'word_completion';
      payload.metadata.interaction = 'categorizationv2';
      payload.metadata.layoutMode = 'word_completion';
      payload.poolId = poolId.trim();
      payload.metadata.poolId = poolId.trim();
      payload.targetCategory = selectedCategory;
      payload.metadata.targetCategory = selectedCategory;
      payload.missingLetterMode = missingLetterMode;
      payload.metadata.missingLetterMode = missingLetterMode;
      payload.randomizeTargetCategory = selectedCategory === '[random]';
      payload.metadata.randomizeTargetCategory = selectedCategory === '[random]';
      payload.wordCount = 2;
      payload.itemsPerCategory = 2;
      payload.hideOptionImages = false;
      payload.hideOptionLabel = false;
      payload.metadata.hideOptionImages = false;
      payload.metadata.hideOptionLabel = false;
      payload.options = [];
      payload.answer = {};
      payload.correctAnswer = {};
      payload.parts = [
        ...parts.map(p => ({ ...p })),
        {
          type: 'categorizationv2',
          layoutMode: 'word_completion',
          renderer: 'html5',
          source: {
            poolId: poolId.trim(),
            category: selectedCategory,
            count: 2,
            missingLetterMode,
            randomizeTargetCategory: selectedCategory === '[random]'
          }
        }
      ];
      payload.difficultyRules = difficultyRules;
      payload.metadata.difficultyRules = difficultyRules;
    } else if (type === 'dynamic_pool') {
      payload.hideOptionImages = hideOptionImages;
      payload.metadata.hideOptionImages = hideOptionImages;
      payload.hideOptionLabel = hideOptionLabel;
      payload.metadata.hideOptionLabel = hideOptionLabel;
      const isWordCompletionInteraction = interaction === 'word_completion';
      
      const correctPool = options
        .filter(opt => !opt.isDistractorOnly)
        .map((opt, idx) => ({
          id: opt.id || opt.label.replace(/\s+/g, '_').toLowerCase().trim(),
          label: opt.label.trim(),
          imageUrl: opt.imageUrl || undefined,
          audioUrl: opt.audioUrl || undefined,
          explanation: opt.explanation?.trim() || undefined
        }));

      const distractorPool = options
        .filter(opt => opt.isDistractorOnly)
        .map((opt, idx) => ({
          id: opt.id || opt.label.replace(/\s+/g, '_').toLowerCase().trim(),
          label: opt.label.trim(),
          imageUrl: opt.imageUrl || undefined,
          audioUrl: opt.audioUrl || undefined,
          misconceptionType: opt.misconceptionType || 'general_confusion',
          similarity: opt.similarity || 'medium'
        }));

      if (poolId.trim()) {
        payload.poolId = poolId.trim();
        payload.metadata.poolId = poolId.trim();
        if (isWordCompletionInteraction) {
          payload.interaction = 'categorizationv2';
          payload.metadata.interaction = 'categorizationv2';
          payload.layoutMode = 'word_completion';
          payload.metadata.layoutMode = 'word_completion';
          payload.targetCategory = targetCategory.trim();
          payload.metadata.targetCategory = targetCategory.trim();
          payload.missingLetterMode = missingLetterMode;
          payload.metadata.missingLetterMode = missingLetterMode;
          payload.randomizeTargetCategory = targetCategory.trim() === '[random]';
          payload.metadata.randomizeTargetCategory = targetCategory.trim() === '[random]';
          payload.wordCount = 2;
          payload.itemsPerCategory = 2;
          payload.parts = [
            ...parts.map(p => ({ ...p })),
            {
              type: 'categorizationv2',
              layoutMode: 'word_completion',
              renderer: 'html5',
              source: {
                poolId: poolId.trim(),
                category: targetCategory.trim(),
                count: 2,
                missingLetterMode,
                randomizeTargetCategory: targetCategory.trim() === '[random]'
              }
            }
          ];
        } else if (interaction === 'categorization' || interaction === 'categorizationv2') {
          payload.categories = categories.map(cat => ({ ...cat, id: cat.id, label: cat.label }));
          payload.metadata.categories = payload.categories;
        } else {
          payload.targetCategory = targetCategory.trim();
          payload.metadata.targetCategory = targetCategory.trim();
          if (interaction === 'pick_from_sentence') {
            payload.targetKey = targetKey;
            payload.metadata.targetKey = targetKey;
          }
          const parsedCats = parseCategoryList(distractorCategories);
          payload.distractorCategories = parsedCats;
          payload.metadata.distractorCategories = parsedCats;
        }
      } else {
        payload.pools = {
          correctPool,
          distractorPool
        };
        payload.metadata.pools = payload.pools;
      }

      payload.difficultyRules = difficultyRules;
      payload.metadata.difficultyRules = difficultyRules;

      payload.correctAnswerIndex = undefined;
      payload.answer = undefined;
      if (!isWordCompletionInteraction) {
        payload.parts = parts.map(p => ({ ...p }));
      }
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
    if (interaction === 'word_completion') {
      payload.interaction = 'categorizationv2';
      payload.metadata.interaction = 'categorizationv2';
      payload.layoutMode = 'word_completion';
      payload.metadata.layoutMode = 'word_completion';
      payload.missingLetterMode = missingLetterMode;
      payload.metadata.missingLetterMode = missingLetterMode;
    } else if (interaction) {
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
  const handleSaveQuestion = async (statusOverride = 'active') => {
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
      const hasEmptyLabel = options.some(opt => !opt.label.trim() && !opt.imageUrl);
      if (hasEmptyLabel) {
        setAlert({ type: 'error', text: 'Validation Error: All MCQ options must have a text label or an image.' });
        return;
      }
      const correctIndex = options.findIndex(opt => opt.isCorrect);
      if (correctIndex === -1) {
        setAlert({ type: 'error', text: 'Validation Error: Please select one option as the Correct Answer.' });
        return;
      }
    } else if (type === 'word_completion_pool') {
      if (!poolId.trim()) {
        setAlert({ type: 'error', text: 'Validation Error: Word Completion needs a centralized Pool ID.' });
        return;
      }
      if (!selectedVocabularyPool) {
        setAlert({ type: 'error', text: `Validation Error: Centralized pool "${poolId.trim()}" was not found.` });
        return;
      }
      const isRandomWordCategory = targetCategory.trim() === '[random]';
      if (!targetCategory.trim() || (!isRandomWordCategory && !selectedPoolCategories.includes(targetCategory.trim()))) {
        setAlert({ type: 'error', text: 'Validation Error: Select a valid word pool category.' });
        return;
      }
      const categoryCount = isRandomWordCategory
        ? Math.max(0, ...selectedPoolCategories.map(category => (
            selectedVocabularyPool.categoryCounts?.[category]
            ?? selectedVocabularyPool.pools?.[category]?.length
            ?? 0
          )))
        : (selectedVocabularyPool.categoryCounts?.[targetCategory.trim()]
            ?? selectedVocabularyPool.pools?.[targetCategory.trim()]?.length
            ?? 0);
      if (categoryCount < 2) {
        setAlert({ type: 'error', text: 'Validation Error: Word Completion needs at least one category with 2 words.' });
        return;
      }
    } else if (type === 'dynamic_pool') {
      const isWordCompletionInteraction = interaction === 'word_completion';
      const isCat = interaction === 'categorization' || interaction === 'categorizationv2' || isWordCompletionInteraction;
      if ((isCat || interaction === 'pick_from_sentence') && !poolId.trim()) {
        setAlert({ type: 'error', text: 'Validation Error: Select Word in Sentence dynamic pools must use a Centralized Pool. Select an existing Pool ID.' });
        return;
      }
      if (poolId.trim()) {
        if (!selectedVocabularyPool) {
          setAlert({ type: 'error', text: `Validation Error: Centralized pool "${poolId.trim()}" was not found. Select an existing pool or clear Pool ID to author an inline pool.` });
          return;
        }
        if (isWordCompletionInteraction) {
          const isRandomWordCategory = targetCategory.trim() === '[random]';
          if (!targetCategory.trim() || (!isRandomWordCategory && !selectedPoolCategories.includes(targetCategory.trim()))) {
            setAlert({ type: 'error', text: 'Validation Error: Select a valid word pool category.' });
            return;
          }
          const categoryCount = isRandomWordCategory
            ? Math.max(0, ...selectedPoolCategories.map(category => (
                selectedVocabularyPool.categoryCounts?.[category]
                ?? selectedVocabularyPool.pools?.[category]?.length
                ?? 0
              )))
            : (selectedVocabularyPool.categoryCounts?.[targetCategory.trim()]
                ?? selectedVocabularyPool.pools?.[targetCategory.trim()]?.length
                ?? 0);
          if (categoryCount < 2) {
            setAlert({ type: 'error', text: 'Validation Error: Word Completion needs at least one category with 2 words.' });
            return;
          }
        } else if (interaction === 'pick_from_sentence') {
          if (!targetCategory.trim() || (!selectedPoolCategories.includes(targetCategory.trim()) && targetCategory.trim() !== '[random]')) {
            setAlert({ type: 'error', text: 'Validation Error: Select a valid target category containing the sentences.' });
            return;
          }
          // Validate that pool sentences have the required targetKey field
          if (targetKey && targetKey !== 'nouns') {
            const categoriesToCheck = targetCategory.trim() === '[random]'
              ? selectedPoolCategories
              : [targetCategory.trim()];
            const hasTargetKeyData = categoriesToCheck.some(cat => {
              const catPosKeys = selectedVocabularyPool?.posKeys?.[cat] || [];
              return catPosKeys.includes(targetKey);
            });
            if (!hasTargetKeyData) {
              setAlert({ type: 'error', text: `Validation Error: None of the sentences in the selected pool have "${targetKey}" annotated. Open the Pool Word Manager and add ${targetKey} arrays to your sentences.` });
              return;
            }
          }
        } else if (!isCat) {
          const parsedDistractors = parseCategoryList(distractorCategories);
          if (!targetCategory.trim() || (!selectedPoolCategories.includes(targetCategory.trim()) && targetCategory.trim() !== '[random]')) {
            setAlert({ type: 'error', text: 'Validation Error: Select a valid target category from the centralized pool.' });
            return;
          }
          if (targetCategory.trim() !== '[random]') {
            if (parsedDistractors.length === 0 || parsedDistractors.some(category => !selectedPoolCategories.includes(category))) {
              setAlert({ type: 'error', text: 'Validation Error: Select at least one valid distractor category from the centralized pool.' });
              return;
            }
            if (parsedDistractors.includes(targetCategory.trim())) {
              setAlert({ type: 'error', text: 'Validation Error: The target category cannot also be a distractor category.' });
              return;
            }
            const targetCount = selectedVocabularyPool.categoryCounts?.[targetCategory.trim()]
              ?? selectedVocabularyPool.pools?.[targetCategory.trim()]?.length
              ?? 0;
            if (targetCount === 0) {
              setAlert({ type: 'error', text: 'Validation Error: The selected target category has no options.' });
              return;
            }
          } else {
            if (parsedDistractors.length > 0 && parsedDistractors.some(category => !selectedPoolCategories.includes(category))) {
              setAlert({ type: 'error', text: 'Validation Error: Select valid distractor categories from the centralized pool.' });
              return;
            }
          }
        }
      } else {
        const targets = options.filter(option => !option.isDistractorOnly);
        const distractors = options.filter(option => option.isDistractorOnly);
        if (targets.length === 0 || distractors.length === 0) {
          setAlert({ type: 'error', text: 'Validation Error: An inline Dynamic Option Pool needs at least one target and one distractor.' });
          return;
        }
        const hasEmptyLabel = options.some(opt => !opt.label.trim());
        if (hasEmptyLabel) {
          setAlert({ type: 'error', text: 'Validation Error: All inline Dynamic Option Pool options must have a text label.' });
          return;
        }
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
    payload.status = statusOverride; 

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
          msg += ` Audio successfully generated and stored.`;
        } else if (generateAudioCheckbox !== 'none') {
          msg += ` WARNING: Saved question without audio. R2 Credentials are likely not configured on this server.`;
        }
        
        setAudioUrl(savedQ.audioUrl || '');

        if (savedQ.pools) {
          const correctPool = savedQ.pools.correctPool || [];
          const distractorPool = savedQ.pools.distractorPool || [];
          
          const loadedOptions = [
            ...correctPool.map(opt => ({
              label: opt.label || '',
              isCorrect: false,
              imageUrl: opt.imageUrl || '',
              audioUrl: opt.audioUrl || '',
              explanation: opt.explanation || '',
              isDistractorOnly: false,
              misconceptionType: 'general_confusion',
              similarity: 'medium'
            })),
            ...distractorPool.map(opt => ({
              label: opt.label || '',
              isCorrect: false,
              imageUrl: opt.imageUrl || '',
              audioUrl: opt.audioUrl || '',
              explanation: '',
              isDistractorOnly: true,
              misconceptionType: opt.misconceptionType || 'general_confusion',
              similarity: opt.similarity || 'medium'
            }))
          ];
          setOptions(loadedOptions.length > 0 ? loadedOptions : [
            { label: '', isCorrect: false, isDistractorOnly: false },
            { label: '', isCorrect: false, isDistractorOnly: true }
          ]);
        } else if (savedQ.options && Array.isArray(savedQ.options)) {
          const correctIdx = savedQ.correctAnswerIndex !== undefined ? savedQ.correctAnswerIndex : savedQ.answer;
          setOptions(savedQ.options.map((opt, idx) => ({
            label: opt.label || '',
            isCorrect: idx === correctIdx || opt.isCorrect || false,
            imageUrl: opt.imageUrl || '',
            hideLabel: !!opt.hideLabel,
            audioUrl: opt.audioUrl || '',
            isDistractorOnly: Boolean(opt.isDistractorOnly),
            misconceptionType: opt.misconceptionType || 'general_confusion',
            similarity: opt.similarity || 'medium',
            explanation: opt.explanation || ''
          })));
        }

        if (savedQ.parts && Array.isArray(savedQ.parts)) {
          const filteredParts = savedQ.parts.filter(p => p.type !== 'categorization' && p.type !== 'hotspot_canvas');
          if (filteredParts.length > 0) {
            setParts(filteredParts);
          }
        }

        setAlert({ type: 'success', text: msg });
        logActivity(`${editMode ? 'Updated' : 'Created'} question "${savedQ.id}"`, 'success');
        
        if (!editMode) {
          setEditMode(true);
          setEditId(savedQ.id);
        }

        setQuestionStatus(statusOverride);
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

  const handleGenerateAndPlayOptionAudio = async (idx) => {
    const option = options[idx];
    if (!option || !option.label || !option.label.trim()) {
      setAlert({ type: 'error', text: 'Enter option label first to generate TTS audio!' });
      return;
    }

    setGeneratingAudioOptionIdx(idx);
    setAlert({ type: 'info', text: `Generating TTS for "${option.label.trim()}"...` });
    try {
      const response = await fetch('/api/admin/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: option.label.trim(),
          voice: voice || 'Puck'
        })
      });

      const data = await response.json();
      if (data.success && data.audioUrl) {
        const updated = [...options];
        updated[idx].audioUrl = data.audioUrl;
        setOptions(updated);
        setAlert({ type: 'success', text: `Audio generated and saved upfront for "${option.label.trim()}"!` });
        handlePlayUrlAudio(`opt_preview_${idx}`, data.audioUrl);
      } else {
        throw new Error(data.error || 'TTS generation failed');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: `Audio generation failed: ${err.message}` });
    } finally {
      setGeneratingAudioOptionIdx(null);
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

  const handleAiCheckQuestion = async () => {
    const poolSummary = selectedVocabularyPool ? {
      poolId: selectedVocabularyPool.poolId || poolId,
      categoryCounts: selectedVocabularyPool.categoryCounts || Object.fromEntries(
        Object.entries(selectedVocabularyPool.pools || {}).map(([category, items]) => [category, Array.isArray(items) ? items.length : 0])
      ),
      selectedCategory: targetCategory,
      randomCategory: targetCategory === '[random]',
    } : null;

    const questionSnapshot = {
      subject,
      topic,
      skillId,
      difficulty,
      type,
      interaction,
      layoutMode,
      missingLetterMode: (type === 'word_completion_pool' || interaction === 'word_completion') ? missingLetterMode : undefined,
      questionText,
      voice,
      explanation,
      poolId: poolId || undefined,
      targetCategory: targetCategory || undefined,
      distractorCategories: distractorCategories ? parseCategoryList(distractorCategories) : undefined,
      options: options.map((option, index) => ({
        id: option.id || `opt_${index}`,
        label: option.label,
        isCorrect: Boolean(option.isCorrect),
        isDistractorOnly: Boolean(option.isDistractorOnly),
        hasImage: Boolean(option.imageUrl),
        hasAudio: Boolean(option.audioUrl),
      })),
      parts: parts.map(part => ({
        ...part,
        imageUrl: part.imageUrl ? '[image-url-present]' : part.imageUrl,
        audioUrl: part.audioUrl ? '[audio-url-present]' : part.audioUrl,
      })),
      categories: categories.map(category => ({ id: category.id, label: category.label })),
      items: categorizationItems.map(item => ({
        id: item.id,
        content: item.content,
        target: item.target || item.categoryId,
        hasImage: Boolean(item.imageUrl || item.svg),
      })),
      answer: type === 'mcq'
        ? options.findIndex(option => option.isCorrect)
        : type === 'fillInTheBlank'
          ? fibAnswers
          : correctAnswer,
      correctAnswer,
      correctAnswerIndex: options.findIndex(option => option.isCorrect),
      feedback: {
        correct: 'Correct!',
        incorrect: 'Try again.',
        hint: explanation,
      },
      metadata: {
        estimatedGrade,
        tags,
        readable,
        readOptions,
        hideOptionImages,
        hideOptionLabel,
      },
      poolSummary,
    };

    setAiCheckLoading(true);
    setAiCheckReport(null);
    try {
      const response = await fetch('/api/admin/questions/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionSnapshot }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Gemini check failed.');
      setAiCheckReport(data.report);
      const severity = data.report?.severity || 'warning';
      setAlert({
        type: severity === 'blocker' ? 'error' : severity === 'pass' ? 'success' : 'info',
        text: `Gemini check complete: ${data.report?.score ?? '—'}/100 (${severity}).`,
      });
    } catch (error) {
      setAlert({ type: 'error', text: error.message || 'Gemini check failed.' });
    } finally {
      setAiCheckLoading(false);
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
      missingLetterMode,
      JSON.stringify(targets),
      backgroundImage,
      JSON.stringify(canvas),
      JSON.stringify(behavior),
      JSON.stringify(sourceTray),
      cardStyle,
      hideItemLabels,
      JSON.stringify(hotspots),
      backgroundSvg,
      arrangeImagesRow,
      commonImageWidth,
      directImageSelect,
      JSON.stringify(layouts),
      activePreviewDevice,
      hideOptionImages
    ].join('|');
    
    const uniqueId = `mock_q_${hashCode(stateHash)}`;
    const baseParts = parts.map(p => ({ ...p }));
    let mockParts = baseParts;
    let mockItemsForDynamicCategorization = [];
    let mockWordCompletionItems = [];
    let mockWordCompletionCards = [];
    let mockWordCompletionAnswer = undefined;
    if (type === 'dynamic_pool' || type === 'word_completion_pool') {
      const isWordCompletionInteraction = interaction === 'word_completion';
      const isCat = interaction === 'categorization' || interaction === 'categorizationv2';
      if (isWordCompletionInteraction || type === 'word_completion_pool') {
        const previewEligibleCategories = selectedPoolCategories.filter(category => {
          const count = selectedVocabularyPool?.categoryCounts?.[category]
            ?? selectedVocabularyPool?.pools?.[category]?.length
            ?? 0;
          return count >= 2;
        });
        const randomCategoryIndex = Math.abs(hashCode(`${targetCategory}:${missingLetterMode}:${questionText}:${selectedPoolCategories.join('|')}`)) % Math.max(1, previewEligibleCategories.length);
        const activeCategory = targetCategory === '[random]'
          ? (previewEligibleCategories[randomCategoryIndex] || selectedPoolCategories[0] || 'short_i_words')
          : (targetCategory || selectedPoolCategories[0] || 'short_i_words');
        const words = selectedVocabularyPool?.pools?.[activeCategory] || [];
        const getPreviewWordFields = (word) => {
          const label = String(word?.label || word?.id || '').trim().toLowerCase();
          const initial = word?.initial || label[0] || '';
          const ending = word?.ending || label.slice(1);
          const middle = word?.middle || (label.length >= 3 ? label[1] : label[0]) || '';
          const endingLetter = word?.endingLetter || label[label.length - 1] || '';

          if (missingLetterMode === 'middle') {
            return {
              answer: middle,
              prefix: word?.middlePrefix || initial,
              suffix: word?.middleSuffix || label.slice(2),
              pattern: word?.middlePattern || `${initial}_${label.slice(2)}`,
            };
          }

          if (missingLetterMode === 'ending') {
            return {
              answer: endingLetter,
              prefix: word?.endingPrefix || label.slice(0, -1),
              suffix: word?.endingSuffix || '',
              pattern: word?.endingPattern || `${label.slice(0, -1)}_`,
            };
          }

          return {
            answer: initial,
            prefix: word?.beginningPrefix || '',
            suffix: word?.beginningSuffix || ending,
            pattern: word?.beginningPattern || `_${ending}`,
          };
        };
        const selectedWords = words
          .filter(item => item?.label && getPreviewWordFields(item).answer)
          .slice(0, 2);
        const fallbackWords = selectedWords.length >= 2 ? selectedWords : [
          { id: 'pin', label: 'pin', initial: 'p', middle: 'i', endingLetter: 'n', ending: 'in', imageUrl: '/images/phonics/pin.svg' },
          { id: 'fin', label: 'fin', initial: 'f', middle: 'i', endingLetter: 'n', ending: 'in', imageUrl: '/images/phonics/fin.svg' }
        ];
        const fallbackFields = fallbackWords.map(getPreviewWordFields);

        mockWordCompletionItems = fallbackWords.map((word, idx) => ({
          id: `letter_${idx + 1}`,
          content: fallbackFields[idx].answer,
          label: fallbackFields[idx].answer,
          audioUrl: word.audioUrl || undefined
        }));
        mockWordCompletionCards = fallbackWords.map((word, idx) => ({
          id: `slot_${idx + 1}`,
          label: word.label,
          imageUrl: word.imageUrl || '',
          audioUrl: word.audioUrl || undefined,
          initial: word.initial,
          middle: word.middle,
          endingLetter: word.endingLetter,
          prefix: fallbackFields[idx].prefix,
          ending: fallbackFields[idx].suffix,
          pattern: fallbackFields[idx].pattern,
          answer: fallbackFields[idx].answer,
          missingLetterMode
        }));
        mockWordCompletionAnswer = Object.fromEntries(mockWordCompletionCards.map((card, idx) => [card.id, mockWordCompletionItems[idx].id]));
        mockParts = [
          ...baseParts,
          {
            type: 'categorizationv2',
            layoutMode: 'word_completion',
            renderer: 'html5',
            items: mockWordCompletionItems,
            wordCards: mockWordCompletionCards,
            answerKey: mockWordCompletionAnswer
          }
        ];
      } else if (interaction === 'pick_from_sentence') {
        const sentences = selectedVocabularyPool?.pools?.[targetCategory] || selectedVocabularyPool?.pools?.[selectedPoolCategories[0]] || [];
        const activeSentence = sentences[0] || { text: "The deer wandered through the forest trail.", nouns: ["deer", "forest", "trail"] };
        const sentenceText = activeSentence.text || activeSentence.sentence || "";
        const targetWords = activeSentence[targetKey] || activeSentence.nouns || activeSentence.targets || activeSentence.correctAnswer || [];

        const normalizeWord = (value) => String(value || '').toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
        const targetSet = new Set(targetWords.map(normalizeWord));

        const tokens = sentenceText.split(/\s+/).map((rawWord, index) => {
          const leading = rawWord.match(/^[^A-Za-z0-9]*/)?.[0] || '';
          const trailing = rawWord.match(/[^A-Za-z0-9]*$/)?.[0] || '';
          const text = rawWord.slice(leading.length, rawWord.length - trailing.length);
          const normalized = normalizeWord(text);

          return {
            id: `word_${index}_${normalized || 'token'}`,
            text,
            display: text,
            leading,
            trailing,
            selectable: true,
            isTarget: targetSet.has(normalized)
          };
        });

        const targetTokenIds = tokens.filter(t => t.isTarget).map(t => t.id).join('|');
        const targetCount = tokens.filter(t => t.isTarget).length;
        const resolvedQuestionText = questionText.trim() || (targetCount > 1 ? 'Select the correct words in the sentence.' : 'Select the correct word in the sentence.');

        mockParts = [
          {
            type: 'text',
            content: resolvedQuestionText,
            isVertical: true,
            style: {
              fontSize: '28px',
              fontWeight: 400,
              color: '#000',
              textAlign: 'left'
            }
          },
          {
            type: 'pick_from_sentence',
            answerKey: 'selectedTokens',
            sentence: sentenceText,
            tokens,
            multiSelect: targetCount > 1,
            fontSize: 42,
            isVertical: true,
            style: {
              marginTop: 18,
              marginBottom: 8
            }
          }
        ];

        mockWordCompletionAnswer = {
          selectedTokens: targetTokenIds
        };
      } else if (isCat) {
        const cats = categories.length > 0
          ? categories.map(c => ({ ...c, id: c.id, label: c.label }))
          : selectedPoolCategories.map(c => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));
        
        if (selectedVocabularyPool) {
          cats.forEach(cat => {
            const catPool = selectedVocabularyPool.pools?.[cat.id] || [];
            catPool.slice(0, 2).forEach((item, idx) => {
              mockItemsForDynamicCategorization.push({
                id: item.id || `mock_${cat.id}_${idx}`,
                content: item.label,
                label: item.label,
                imageUrl: item.imageUrl || undefined,
                audioUrl: item.audioUrl || undefined,
                target: cat.id,
                categoryId: cat.id
              });
            });
          });
        } else {
          mockItemsForDynamicCategorization = [
            { id: 'mock_item_1', content: 'Item 1', target: cats[0]?.id || 'cat_1', categoryId: cats[0]?.id || 'cat_1' },
            { id: 'mock_item_2', content: 'Item 2', target: cats[1]?.id || 'cat_2', categoryId: cats[1]?.id || 'cat_2' }
          ];
        }

        const isCatV2 = interaction === 'categorizationv2';
        mockParts = [
          ...baseParts,
          {
            type: isCatV2 ? 'categorizationv2' : 'categorization',
            categories: cats,
            items: mockItemsForDynamicCategorization
          }
        ];
      } else {
        const extendedParts = baseParts;
        
        // Interpolate placeholders using the first valid non-distractor option as a mock target
        const targetOption = options.find(o => !o.isDistractorOnly) || options[0];
        const targetWord = targetOption?.label || 'word';
        const targetPrompt = targetOption?.prompt || targetWord;
        const targetImage = targetOption?.imageUrl || '';
        const targetAudio = targetOption?.audioUrl || '';

        mockParts = extendedParts.map(part => {
          const newPart = { ...part };
          if (newPart.content) {
            newPart.content = newPart.content
              .replace(/\{\{target\}\}/g, targetWord)
              .replace(/\{\{targetWord\}\}/g, targetWord)
              .replace(/\{\{targetPrompt\}\}/g, targetPrompt)
              .replace(/\{\{targetImage\}\}/g, targetImage)
              .replace(/\{\{targetAudio\}\}/g, targetAudio);
          }
          if (newPart.imageUrl) {
            newPart.imageUrl = newPart.imageUrl.replace(/\{\{targetImage\}\}/g, targetImage);
          }
          if (newPart.audioUrl) {
            newPart.audioUrl = newPart.audioUrl.replace(/\{\{targetAudio\}\}/g, targetAudio);
          }
          if (newPart.label) {
            newPart.label = newPart.label.replace(/\{\{targetWord\}\}/g, targetWord).replace(/\{\{targetPrompt\}\}/g, targetPrompt);
          }
          if (newPart.alt) {
            newPart.alt = newPart.alt.replace(/\{\{targetWord\}\}/g, targetWord).replace(/\{\{targetPrompt\}\}/g, targetPrompt);
          }
          return newPart;
        });
      }
    }

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
      const activeConfig = {
        backgroundImage: backgroundImage || '',
        backgroundSvg: backgroundSvg || '',
        canvasWidth: canvas?.width || (activePreviewDevice === 'mobile' ? 360 : 800),
        canvasHeight: canvas?.height || (activePreviewDevice === 'mobile' ? 640 : 465),
        hotspots: hotspots
      };

      const finalLayouts = {
        desktop: activePreviewDevice === 'desktop' ? activeConfig : (layouts.desktop || {
          backgroundImage: '',
          backgroundSvg: '',
          canvasWidth: 800,
          canvasHeight: 465,
          hotspots: []
        }),
        mobile: activePreviewDevice === 'mobile' ? activeConfig : (layouts.mobile || {
          backgroundImage: '',
          backgroundSvg: '',
          canvasWidth: 360,
          canvasHeight: 640,
          hotspots: []
        })
      };

      const serializedDesktopHotspots = finalLayouts.desktop.hotspots.map((hs, idx) => ({
        optionIndex: hs.optionIndex ?? idx,
        x: Math.round((hs.x / 100) * finalLayouts.desktop.canvasWidth),
        y: Math.round((hs.y / 100) * finalLayouts.desktop.canvasHeight),
        width: Math.round((hs.width / 100) * finalLayouts.desktop.canvasWidth),
        height: Math.round((hs.height / 100) * finalLayouts.desktop.canvasHeight),
        label: hs.label,
        isCircle: hs.isCircle,
        imageUrl: hs.imageUrl || undefined,
        id: hs.id || undefined
      }));

      const serializedMobileHotspots = finalLayouts.mobile.hotspots.map((hs, idx) => ({
        optionIndex: hs.optionIndex ?? idx,
        x: Math.round((hs.x / 100) * finalLayouts.mobile.canvasWidth),
        y: Math.round((hs.y / 100) * finalLayouts.mobile.canvasHeight),
        width: Math.round((hs.width / 100) * finalLayouts.mobile.canvasWidth),
        height: Math.round((hs.height / 100) * finalLayouts.mobile.canvasHeight),
        label: hs.label,
        isCircle: hs.isCircle,
        imageUrl: hs.imageUrl || undefined,
        id: hs.id || undefined
      }));

      const mockPartsHotspot = [
        ...baseParts,
        {
          type: 'hotspot_canvas',
          backgroundUrl: finalLayouts.desktop.backgroundImage || undefined,
          backgroundSvg: finalLayouts.desktop.backgroundSvg || undefined,
          canvasWidth: finalLayouts.desktop.canvasWidth,
          canvasHeight: finalLayouts.desktop.canvasHeight,
          hotspots: serializedDesktopHotspots,
          layouts: {
            desktop: {
              backgroundUrl: finalLayouts.desktop.backgroundImage || undefined,
              backgroundSvg: finalLayouts.desktop.backgroundSvg || undefined,
              canvasWidth: finalLayouts.desktop.canvasWidth,
              canvasHeight: finalLayouts.desktop.canvasHeight,
              hotspots: serializedDesktopHotspots
            },
            mobile: {
              backgroundUrl: finalLayouts.mobile.backgroundImage || undefined,
              backgroundSvg: finalLayouts.mobile.backgroundSvg || undefined,
              canvasWidth: finalLayouts.mobile.canvasWidth,
              canvasHeight: finalLayouts.mobile.canvasHeight,
              hotspots: serializedMobileHotspots
            }
          }
        }
      ];

      return {
        id: uniqueId,
        type: 'mcq',
        interaction: isHotspotMultiSelect ? 'hotspot_multi_select' : 'hotspot_select',
        questionText: questionText.trim(),
        parts: mockPartsHotspot,
        audioUrl,
        voice,
        arrangeImagesRow,
        commonImageWidth: Number(commonImageWidth) || 180,
        options: hotspots.map((hs, idx) => ({ id: `opt_${idx}`, label: hs.label })),
        answer: hotspots.findIndex(hs => hs.isCorrect),
        correctAnswerIndex: hotspots.findIndex(hs => hs.isCorrect),
        layouts: {
          desktop: {
            backgroundImage: finalLayouts.desktop.backgroundImage || undefined,
            backgroundSvg: finalLayouts.desktop.backgroundSvg || undefined,
            canvasWidth: finalLayouts.desktop.canvasWidth,
            canvasHeight: finalLayouts.desktop.canvasHeight,
            hotspots: finalLayouts.desktop.hotspots
          },
          mobile: {
            backgroundImage: finalLayouts.mobile.backgroundImage || undefined,
            backgroundSvg: finalLayouts.mobile.backgroundSvg || undefined,
            canvasWidth: finalLayouts.mobile.canvasWidth,
            canvasHeight: finalLayouts.mobile.canvasHeight,
            hotspots: finalLayouts.mobile.hotspots
          }
        },
        solution: {
          sections: explanation.trim() ? explanation.trim().split('\n').map(line => ({ type: 'text', content: line })) : []
        },
        metaConfig: { 
          readable, 
          readOptions,
          hasClickToFill: interaction === 'pick_from_sentence' ? true : undefined
        }
      };
    }

    return {
      id: uniqueId,
      type: (type === 'dynamic_pool' && interaction === 'word_completion') || type === 'word_completion_pool' 
        ? 'categorizationv2' 
        : (type === 'dynamic_pool' && interaction === 'pick_from_sentence')
          ? 'fillInTheBlank'
          : type,
      interaction: directImageSelect
        ? 'direct_image_select'
        : ((type === 'dynamic_pool' && interaction === 'word_completion') || type === 'word_completion_pool' ? 'categorizationv2' : (interaction || undefined)),
      directImageSelect,
      questionText: questionText.trim(),
      parts: mockParts,
      audioUrl,
      voice,
      arrangeImagesRow,
      commonImageWidth: Number(commonImageWidth) || 180,
      options: directImageSelect ? [] : ((type === 'mcq' || type === 'dynamic_pool') ? options.map((o, idx) => ({
        id: o.id || `opt_${idx}`,
        label: o.label,
        imageUrl: (type === 'dynamic_pool' && hideOptionImages) ? undefined : (o.imageUrl || undefined),
        hideLabel: (type === 'dynamic_pool' && hideOptionLabel) || o.hideLabel || undefined,
        audioUrl: o.audioUrl || undefined,
        isCorrect: !o.isDistractorOnly,
        isDistractorOnly: o.isDistractorOnly || undefined,
        misconceptionType: o.misconceptionType || undefined,
        similarity: o.similarity || undefined,
        explanation: o.explanation || undefined
      })) : []),
      categories: (type === 'categorizationv2' || type === 'categorization') 
        ? categories.map(c => ({ ...c, id: c.id, label: c.label })) 
        : (type === 'dynamic_pool' && (interaction === 'categorization' || interaction === 'categorizationv2'))
          ? (categories.length > 0 ? categories.map(c => ({ ...c, id: c.id, label: c.label })) : selectedPoolCategories.map(c => ({ id: c, label: c.charAt(0).toUpperCase() + c.slice(1) })))
          : undefined,
      items: (type === 'categorizationv2' || type === 'categorization') 
        ? serializedItems 
        : ((type === 'dynamic_pool' && interaction === 'word_completion') || type === 'word_completion_pool')
          ? mockWordCompletionItems
        : (type === 'dynamic_pool' && (interaction === 'categorization' || interaction === 'categorizationv2'))
          ? mockItemsForDynamicCategorization
          : undefined,
      wordCards: ((type === 'dynamic_pool' && interaction === 'word_completion') || type === 'word_completion_pool') ? mockWordCompletionCards : undefined,
      answer: directImageSelect ? parts.findIndex(p => p.isCorrect) : (type === 'mcq' ? options.findIndex(o => o.isCorrect) : ((type === 'dynamic_pool' || type === 'word_completion_pool') ? mockWordCompletionAnswer : ((type === 'categorizationv2' || type === 'categorization') ? categorizationItems.reduce((acc, item) => { acc[item.id] = item.categoryId || item.target || ''; return acc; }, {}) : (extractBlankIds(parts, questionText).length > 1 ? fibAnswers : correctAnswer)))),
      correctAnswer: directImageSelect ? undefined : (type === 'mcq' ? undefined : ((type === 'dynamic_pool' || type === 'word_completion_pool') ? mockWordCompletionAnswer : ((type === 'categorizationv2' || type === 'categorization') ? categorizationItems.reduce((acc, item) => { acc[item.id] = item.categoryId || item.target || ''; return acc; }, {}) : (extractBlankIds(parts, questionText).length > 1 ? fibAnswers : correctAnswer)))),
      metaConfig: { 
        readable, 
        readOptions,
        hasClickToFill: interaction === 'pick_from_sentence' ? true : undefined
      },
      // Advanced Dynamic Pool fields
      poolId: (type === 'dynamic_pool' && poolId) ? poolId.trim() : undefined,
      targetCategory: (type === 'dynamic_pool' && targetCategory) ? targetCategory.trim() : undefined,
      targetKey: (type === 'dynamic_pool' && interaction === 'pick_from_sentence') ? targetKey : undefined,
      distractorCategories: (type === 'dynamic_pool' && distractorCategories) ? distractorCategories.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      pools: (type === 'dynamic_pool' && !poolId) ? {
        correctPool: options.filter(o => !o.isDistractorOnly).map(o => ({
          id: o.id || o.label.replace(/\s+/g, '_').toLowerCase().trim(),
          label: o.label,
          imageUrl: o.imageUrl || undefined,
          audioUrl: o.audioUrl || undefined,
          explanation: o.explanation || undefined
        })),
        distractorPool: options.filter(o => o.isDistractorOnly).map(o => ({
          id: o.id || o.label.replace(/\s+/g, '_').toLowerCase().trim(),
          label: o.label,
          imageUrl: o.imageUrl || undefined,
          audioUrl: o.audioUrl || undefined,
          misconceptionType: o.misconceptionType || 'general_confusion',
          similarity: o.similarity || 'medium'
        }))
      } : undefined,
      difficultyRules: type === 'dynamic_pool' ? difficultyRules : undefined,
      // Universal DnD fields
      layoutMode: ((type === 'dynamic_pool' && interaction === 'word_completion') || type === 'word_completion_pool') ? 'word_completion' : (layoutMode || undefined),
      missingLetterMode: ((type === 'dynamic_pool' && interaction === 'word_completion') || type === 'word_completion_pool') ? missingLetterMode : undefined,
      targets: targets || undefined,
      backgroundImage: backgroundImage || undefined,
      canvas: canvas || undefined,
      behavior: behavior || undefined,
      sourceTray: sourceTray || undefined,
      cardStyle: cardStyle || undefined,
      hideItemLabels: hideItemLabels || undefined,
      hideOptionImages: type === 'dynamic_pool' ? hideOptionImages : undefined,
      hideOptionLabel: type === 'dynamic_pool' ? hideOptionLabel : undefined
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
    backgroundSvg,
    directImageSelect,
    hideOptionImages,
    hideOptionLabel,
    difficultyRules,
    poolId,
    targetCategory,
    targetKey,
    distractorCategories,
    missingLetterMode
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
    <>
    <div className={`${styles.adminContainer} ${theme === 'dark' ? styles.darkMode : theme === 'blue' ? styles.blueMode : ''}`}>
      <header className={styles.adminHeader}>
        <div className={styles.headerInfo}>
          <h1>Curriculum Operations</h1>
          <p>Educational content library, speech synthesis pipeline, and storage configurations.</p>
        </div>
        
        <div className={styles.headerStatus}>
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1.5px solid var(--color-border)',
              background: 'var(--bg-primary)',
              color: 'var(--color-text-main)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              height: '31px',
              boxSizing: 'border-box',
            }}
            title={
              theme === 'light' ? 'Switch to Dark Mode' :
              theme === 'dark' ? 'Switch to Ocean Blue Mode' : 'Switch to Light Mode'
            }
          >
            {theme === 'light' ? '🌙 Dark Mode' :
             theme === 'dark' ? '💧 Blue Mode' : '☀️ Light Mode'}
          </button>

          <div className={styles.compactStatusBadge} title="MongoDB Status">
            <span className={`${styles.statusIndicatorDot} ${stats.dbConnected ? styles.dotGreen : stats.dotRed}`} />
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
        <a 
          className={styles.tabButton}
          href="/admin/templates"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          ⚙️ VISUAL TEMPLATE BUILDER
        </a>
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
            <div style={{ padding: '16px 20px 0 20px', display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-bg-panel)' }}>
              <button
                type="button"
                onClick={() => setLibraryMode('questions')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: libraryMode === 'questions' ? 'var(--color-brand)' : 'var(--color-border)',
                  backgroundColor: libraryMode === 'questions' ? 'var(--color-brand)' : 'transparent',
                  color: libraryMode === 'questions' ? '#ffffff' : 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: libraryMode === 'questions' ? '0 4px 10px rgba(79, 70, 229, 0.15)' : 'none'
                }}
              >
                📝 Generated Questions ({qTotalCount})
              </button>
              <button
                type="button"
                onClick={() => setLibraryMode('templates')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: libraryMode === 'templates' ? 'var(--color-brand)' : 'var(--color-border)',
                  backgroundColor: libraryMode === 'templates' ? 'var(--color-brand)' : 'transparent',
                  color: libraryMode === 'templates' ? '#ffffff' : 'var(--color-text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: libraryMode === 'templates' ? '0 4px 10px rgba(79, 70, 229, 0.15)' : 'none'
                }}
              >
                ⚙️ Universal Templates ({tTotalTemplates})
              </button>
            </div>
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
                  <option value="">All Topics</option>
                  {stats.topics.map(top => (
                    <option key={top} value={top}>{top}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Skill</label>
                <select 
                  className={styles.formSelect} 
                  value={qSkillId} 
                  onChange={(e) => setQSkillId(e.target.value)}
                  disabled={!qSubject || !qTopic}
                >
                  <option value="">All Skills</option>
                  {availableSkillsForClone.map(skill => {
                    const skId = skill.skillId || skill.id;
                    return (
                      <option key={skill.id} value={skId}>
                        {skill.code ? `[${skill.code}] ` : ''}{skill.title || skId}
                      </option>
                    );
                  })}
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
                      skillId: 'Skill',
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
                            skillId: 'Skill',
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

            {libraryMode === 'questions' && (
              <div style={{ padding: '0 20px 12px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={styles.btnOutline}
                  onClick={handleCloneRandomQuestions}
                  style={{ 
                    background: 'var(--color-bg-panel)', 
                    borderColor: 'var(--color-brand)',
                    color: 'var(--color-brand)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '34px'
                  }}
                  disabled={cloningInProgress}
                >
                  {cloningInProgress ? (
                    <>
                      <span className={styles.spinner} style={{ width: '12px', height: '12px', borderSize: '2px', marginRight: 4 }}></span>
                      Cloning...
                    </>
                  ) : (
                    <>📋 Clone Random Drafts</>
                  )}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 700 }}>Count:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={cloneCount}
                    onChange={(e) => setCloneCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className={styles.formInput}
                    style={{ width: '56px', height: '34px', textAlign: 'center', padding: '0 4px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 700 }}>Skill ID:</span>
                  <select
                    value={cloneSkillId}
                    onChange={(e) => setCloneSkillId(e.target.value)}
                    className={styles.formSelect}
                    style={{ height: '34px', padding: '0 8px', minWidth: '150px' }}
                    disabled={!qSubject || !qTopic}
                  >
                    <option value="">-- All Skills --</option>
                    {availableSkillsForClone.map(skill => (
                      <option key={skill.id} value={skill.skillId || skill.id}>
                        {skill.code ? `[${skill.code}] ` : ''}{skill.title || skill.skillId || skill.id} ({skill.skillId || skill.id})
                      </option>
                    ))}
                    <option value="__custom__">-- Custom Skill ID --</option>
                  </select>
                </div>
                {cloneSkillId === '__custom__' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter custom Skill ID..."
                      value={customCloneSkillId}
                      onChange={(e) => setCustomCloneSkillId(e.target.value)}
                      className={styles.formInput}
                      style={{ height: '34px', padding: '0 8px', width: '200px' }}
                      disabled={!qSubject || !qTopic}
                    />
                  </div>
                )}
                <small style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 650 }}>
                  Picks random active questions from the selected <strong>Subject</strong>, <strong>Topic/Skill</strong>, and optional <strong>Skill ID</strong>, duplicates them, and saves them as reviewable drafts.
                </small>
              </div>
            )}

            {libraryMode === 'questions' ? (
              loadingQuestions ? (
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
                          {visibleColumns.subject && <th style={{ width: '8%' }}>Subject</th>}
                          {visibleColumns.topic && <th style={{ width: '8%' }}>Topic</th>}
                          {visibleColumns.skillId && <th style={{ width: '10%' }}>Skill</th>}
                          {visibleColumns.type && <th style={{ width: '6%' }}>Type</th>}
                          {visibleColumns.questionText && <th style={{ width: 'auto' }}>Question Text</th>}
                          {visibleColumns.audioStatus && <th style={{ width: '8%' }}>Audio Status</th>}
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
                                {q.status === 'draft' && (
                                  <span style={{ 
                                    marginLeft: 6, 
                                    padding: '2px 6px', 
                                    fontSize: 9, 
                                    fontWeight: 'bold', 
                                    color: '#ea580c', 
                                    backgroundColor: '#ffedd5', 
                                    borderRadius: 4,
                                    border: '1px solid #fed7aa',
                                    display: 'inline-block' 
                                  }}>
                                    DRAFT
                                  </span>
                                )}
                              </td>
                            )}
                            {visibleColumns.subject && (
                              <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{q.subject}</td>
                            )}
                            {visibleColumns.topic && (
                              <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{q.topic}</td>
                            )}
                            {visibleColumns.skillId && (
                              <td style={{ fontSize: 12, wordBreak: 'break-all' }}>{q.skillId || '—'}</td>
                            )}
                            {visibleColumns.type && (
                              <td>
                                <span style={{ fontSize: 11, fontWeight: 800 }}>
                                  {q.type === 'mcq' ? 'MCQ' : (q.type === 'dynamic_pool' ? 'POOL' : String(q.type).toUpperCase())}
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
                                    {q.status === 'draft' && (
                                      <button 
                                        className={styles.btnSolid}
                                        onClick={() => handleApproveQuestion(q)}
                                        style={{ 
                                          backgroundColor: '#16a34a', 
                                          borderColor: '#16a34a', 
                                          color: '#fff',
                                          fontWeight: 'bold',
                                          padding: '2px 8px',
                                          fontSize: 10,
                                          marginRight: 4
                                        }}
                                      >
                                        Approve
                                      </button>
                                    )}
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
                                  <div className={styles.actionRowInline} style={{ marginTop: 4, gap: 4 }}>
                                    <a 
                                      href={`/practice?subject=${q.subject}&topic=${q.topic}&skill=${q.skillId}&qn=${q.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`${styles.btnOutline} ${styles.btnCompact}`}
                                      style={{ textDecoration: 'none', color: '#0ea5e9', borderColor: '#0ea5e9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, padding: '2px 6px' }}
                                    >
                                      Test (qn)
                                    </a>
                                    <a 
                                      href={`/practice?subject=${q.subject}&topic=${q.topic}&skill=${q.skillId}&id=${q.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`${styles.btnOutline} ${styles.btnCompact}`}
                                      style={{ textDecoration: 'none', color: '#8b5cf6', borderColor: '#8b5cf6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, padding: '2px 6px' }}
                                    >
                                      Test (id)
                                    </a>
                                  </div>
                                  <button 
                                    className={`${styles.btnDanger} ${styles.btnCompact}`}
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    style={{ marginTop: 4 }}
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
              )
            ) : (
              paginatedTemplates.length === 0 ? (
                <div className={styles.emptyState}>
                  No templates match the active query filters. Create one in the Visual Template Builder.
                </div>
              ) : (
                <>
                  <div className={styles.tableContainer}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          {visibleColumns.id && <th style={{ width: '15%' }}>ID</th>}
                          {visibleColumns.subject && <th style={{ width: '8%' }}>Subject</th>}
                          {visibleColumns.topic && <th style={{ width: '10%' }}>Topic</th>}
                          {visibleColumns.skillId && <th style={{ width: '10%' }}>Skill</th>}
                          {visibleColumns.type && <th style={{ width: '8%' }}>Type</th>}
                          {visibleColumns.questionText && <th style={{ width: 'auto' }}>Title / Question Text</th>}
                          {visibleColumns.audioStatus && <th style={{ width: '8%' }}>Audio Status</th>}
                          {visibleColumns.play && <th style={{ width: '5%', textAlign: 'center' }}>Play</th>}
                          {visibleColumns.actions && <th style={{ width: '11%' }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTemplates.map((tpl) => (
                          <tr key={tpl.id}>
                            {visibleColumns.id && (
                              <td className={styles.idCol}>
                                <code>{tpl.id}</code>
                                {tpl.isStatic ? (
                                  <span style={{ 
                                    marginLeft: 6, 
                                    padding: '2px 6px', 
                                    fontSize: 9, 
                                    fontWeight: 'bold', 
                                    color: '#0369a1', 
                                    backgroundColor: '#e0f2fe', 
                                    borderRadius: 4,
                                    border: '1px solid #bae6fd',
                                    display: 'inline-block' 
                                  }}>
                                    STATIC CATALOG
                                  </span>
                                ) : (
                                  <span style={{ 
                                    marginLeft: 6, 
                                    padding: '2px 6px', 
                                    fontSize: 9, 
                                    fontWeight: 'bold', 
                                    color: '#16a34a', 
                                    backgroundColor: '#dcfce7', 
                                    borderRadius: 4,
                                    border: '1px solid #bbf7d0',
                                    display: 'inline-block' 
                                  }}>
                                    DYNAMIC / DB
                                  </span>
                                )}
                              </td>
                            )}
                            {visibleColumns.subject && (
                              <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{tpl.subject}</td>
                            )}
                            {visibleColumns.topic && (
                              <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{tpl.topic}</td>
                            )}
                            {visibleColumns.skillId && (
                              <td style={{ fontSize: 12, wordBreak: 'break-all' }}>{tpl.skillId || '—'}</td>
                            )}
                            {visibleColumns.type && (
                              <td>
                                <span style={{ fontSize: 11, fontWeight: 800 }}>
                                  {String(tpl.optionsType || tpl.type || 'MCQ').toUpperCase()}
                                </span>
                              </td>
                            )}
                            {visibleColumns.questionText && (
                              <td>
                                <div className={styles.truncatedText} title={tpl.questionText}>
                                  {tpl.title || tpl.questionText || '—'}
                                </div>
                              </td>
                            )}
                            {visibleColumns.audioStatus && (
                              <td>
                                <span style={{ color: '#9ca3af', fontSize: 11 }}>N/A</span>
                              </td>
                            )}
                            {visibleColumns.play && (
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ color: '#9ca3af', fontSize: 11 }}>N/A</span>
                              </td>
                            )}
                            {visibleColumns.actions && (
                              <td>
                                <div className={styles.actionIconGroup}>
                                  <div className={styles.actionRowInline}>
                                    {tpl.isStatic ? (
                                      <button 
                                        className={`${styles.btnOutline} ${styles.btnCompact}`}
                                        onClick={() => window.location.href = `/admin/templates?id=${encodeURIComponent(tpl.id)}&duplicate=true`}
                                        title="Create a custom template copy in builder"
                                      >
                                        Customize
                                      </button>
                                    ) : (
                                      <>
                                        <button 
                                          className={`${styles.btnOutline} ${styles.btnCompact}`}
                                          onClick={() => window.location.href = `/admin/templates?id=${encodeURIComponent(tpl.id)}`}
                                          title="Edit this dynamic template in builder"
                                        >
                                          Edit
                                        </button>
                                        <button 
                                          className={`${styles.btnOutline} ${styles.btnCompact}`}
                                          onClick={() => window.location.href = `/admin/templates?id=${encodeURIComponent(tpl.id)}&duplicate=true`}
                                          title="Duplicate this template"
                                        >
                                          Duplicate
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  <button 
                                    className={`${styles.btnDanger} ${styles.btnCompact}`}
                                    disabled={tpl.isStatic}
                                    onClick={() => handleDeleteTemplate(tpl.id)}
                                    style={{
                                      marginTop: 4,
                                      opacity: tpl.isStatic ? 0.5 : 1,
                                      cursor: tpl.isStatic ? 'not-allowed' : 'pointer'
                                    }}
                                    title={tpl.isStatic ? "Static catalog templates cannot be deleted" : "Delete custom template from database"}
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
                      Showing {paginatedTemplates.length} of {tTotalTemplates} templates (Page {qPage} of {tTotalPages})
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
                        onClick={() => setQPage(p => Math.min(tTotalPages, p + 1))} 
                        disabled={qPage >= tTotalPages}
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </>
              )
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

                  <button 
                    type="button"
                    className={styles.btnOutline} 
                    onClick={handleEmptyFieldsWithConfirm}
                  >
                    Empty Fields
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

                  {questionStatus === 'draft' ? (
                    <>
                      <button 
                        type="button"
                        className={styles.btnOutline} 
                        style={{ marginRight: 8 }}
                        onClick={() => handleSaveQuestion('draft')}
                        disabled={savingQuestion}
                      >
                        {savingQuestion ? 'Saving...' : 'Save Draft to DB'}
                      </button>
                      <button 
                        type="button"
                        className={styles.btnSolid} 
                        onClick={() => handleSaveQuestion('active')}
                        disabled={savingQuestion}
                        style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                      >
                        {savingQuestion ? 'Approving...' : 'Approve & Publish'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button"
                        className={styles.btnOutline} 
                        style={{ marginRight: 8 }}
                        onClick={handleAiCheckQuestion}
                        disabled={aiCheckLoading}
                      >
                        {aiCheckLoading ? 'Checking...' : 'Check with Gemini'}
                      </button>

                      <button 
                        type="button"
                        className={styles.btnOutline} 
                        style={{ marginRight: 8 }}
                        onClick={() => {
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
                        onClick={() => handleSaveQuestion('active')}
                        disabled={savingQuestion}
                      >
                        {savingQuestion ? 'Publishing...' : editMode ? 'Save Question' : 'Publish Question'}
                      </button>
                    </>
                  )}
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

              {aiCheckReport && (
                <div
                  style={{
                    border: `1.5px solid ${aiCheckReport.severity === 'blocker' ? '#ef4444' : aiCheckReport.severity === 'pass' ? '#22c55e' : '#f59e0b'}`,
                    background: aiCheckReport.severity === 'blocker' ? '#fef2f2' : aiCheckReport.severity === 'pass' ? '#f0fdf4' : '#fffbeb',
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 16,
                    color: '#0f172a',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Gemini Question Check
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                        {aiCheckReport.summary || 'Review completed.'}
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 950, color: aiCheckReport.severity === 'blocker' ? '#b91c1c' : aiCheckReport.severity === 'pass' ? '#15803d' : '#b45309' }}>
                      {aiCheckReport.score ?? '—'}/100
                    </div>
                  </div>
                  {Array.isArray(aiCheckReport.issues) && aiCheckReport.issues.length > 0 && (
                    <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                      {aiCheckReport.issues.slice(0, 5).map((issue, index) => (
                        <div key={`${issue.field || 'issue'}_${index}`} style={{ fontSize: 12, lineHeight: 1.45 }}>
                          <strong style={{ textTransform: 'uppercase' }}>{issue.severity || 'warning'}</strong>
                          {issue.field ? ` · ${issue.field}` : ''}: {issue.message}
                          {issue.fix ? <span style={{ color: '#475569' }}> Fix: {issue.fix}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(aiCheckReport.suggestions) && aiCheckReport.suggestions.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#334155' }}>
                      <strong>Suggestions:</strong> {aiCheckReport.suggestions.slice(0, 3).join(' ')}
                    </div>
                  )}
                  {aiCheckReport.fixedQuestionText && aiCheckReport.fixedQuestionText !== questionText && (
                    <button
                      type="button"
                      className={`${styles.btnOutline} ${styles.btnCompact}`}
                      style={{ marginTop: 12 }}
                      onClick={() => {
                        setQuestionText(aiCheckReport.fixedQuestionText);
                        setIsDirty(true);
                      }}
                    >
                      Apply suggested question text
                    </button>
                  )}
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
                  onClick={() => {
                    // Auto-sync current form fields into batch skill assignment
                    if (subject && !parseBatchSubject) setParseBatchSubject(subject);
                    if (topic && !parseBatchTopic) setParseBatchTopic(topic);
                    if (skillId && !parseBatchSkillId) setParseBatchSkillId(skillId);
                    if (difficulty && !parseBatchDifficulty) setParseBatchDifficulty(difficulty);
                    setAuthoringMode('paste');
                  }}
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
                <button
                  type="button"
                  className={`${styles.selectorButton} ${authoringMode === 'ai_bulk' ? styles.selectorButtonActive : ''}`}
                  onClick={() => setAuthoringMode('ai_bulk')}
                >
                  AI Bulk Generator
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
                          <div className={styles.formRow} style={{ marginBottom: '1rem', gap: '12px' }}>
                            <div className={styles.formGroup} style={{ flex: '1 1 33%' }}>
                              <label className={styles.filterLabel}>Link to Database Skill: 1. Subject</label>
                              <select 
                                className={styles.formSelect}
                                value={selectedLinkSubject}
                                onChange={(e) => {
                                  setSelectedLinkSubject(e.target.value);
                                  setSelectedLinkTopic('');
                                  setSkillId('');
                                }}
                              >
                                <option value="">-- Select Subject --</option>
                                {uniqueLinkSubjects.map(sub => (
                                  <option key={sub} value={sub}>{sub.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>

                            <div className={styles.formGroup} style={{ flex: '1 1 33%' }}>
                              <label className={styles.filterLabel}>2. Topic / Chapter</label>
                              <select 
                                className={styles.formSelect}
                                value={selectedLinkTopic}
                                disabled={!selectedLinkSubject}
                                onChange={(e) => {
                                  setSelectedLinkTopic(e.target.value);
                                  setSkillId('');
                                }}
                              >
                                <option value="">-- Select Topic --</option>
                                {uniqueLinkTopics.map(topic => (
                                  <option key={topic} value={topic}>{topic}</option>
                                ))}
                              </select>
                            </div>

                            <div className={styles.formGroup} style={{ flex: '1 1 34%' }}>
                              <label className={styles.filterLabel}>3. Skill to Link</label>
                              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  placeholder="Search database skills..."
                                  value={skillSearchQuery}
                                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                                  style={{ padding: '6px 10px', fontSize: 13, height: 38 }}
                                />
                                {skillSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setSkillSearchQuery('')}
                                    style={{
                                      border: '1px solid #cbd5e1',
                                      background: '#f1f5f9',
                                      borderRadius: 8,
                                      padding: '0 12px',
                                      cursor: 'pointer',
                                      fontSize: 12,
                                      color: '#475569',
                                      fontWeight: 500,
                                      height: 38,
                                      flexShrink: 0
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <select 
                                className={styles.formSelect}
                                value={dbSkills.find(s => s.id === skillId || s.skillId === skillId)?.id || ''}
                                disabled={!skillSearchQuery.trim() && (!selectedLinkSubject || !selectedLinkTopic)}
                                onChange={(e) => {
                                  const selectedSkillId = e.target.value;
                                  if (!selectedSkillId) {
                                    setSkillId('');
                                    return;
                                  }
                                  const skill = dbSkills.find(s => s.id === selectedSkillId);
                                  if (skill) {
                                    setSubject(skill.subjectId || '');
                                    setTopic(skill.topicId || '');
                                    setSkillId(skill.skillId || skill.id || '');
                                    if (skill.grade) {
                                      setEstimatedGrade(`Grade ${skill.grade}`);
                                    }
                                    logActivity(`Linked question to skill: ${skill.title} (${skill.id})`, 'info');
                                    setSkillSearchQuery(''); // clear search after linking
                                  }
                                }}
                              >
                                <option value="">-- Select Skill --</option>
                                {filteredLinkSkills.map((skill, index) => (
                                  <option key={skill.id} value={skill.id}>
                                    {index + 1}. {skill.code ? `[${skill.code}] ` : ''}{skill.title || skill.id} ({skill.id})
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
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
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
                                          {/* ── Image URL row + Upload/Gallery buttons ── */}
                                          <div className={styles.formRow} style={{ alignItems: 'flex-end', gap: 8 }}>
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
                                            {/* Upload button */}
                                            <button
                                              type="button"
                                              title="Upload a file from your computer"
                                              onClick={() => openImgPicker(realIdx, 'upload')}
                                              style={{
                                                flexShrink: 0, height: 34, padding: '0 12px',
                                                borderRadius: 8, border: '1.5px solid #6366f1',
                                                background: '#6366f1', color: '#fff',
                                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                                              Upload
                                            </button>
                                            {/* Gallery button */}
                                            <button
                                              type="button"
                                              title="Pick from R2 image gallery"
                                              onClick={() => openImgPicker(realIdx, 'gallery')}
                                              style={{
                                                flexShrink: 0, height: 34, padding: '0 12px',
                                                borderRadius: 8, border: '1.5px solid #0ea5e9',
                                                background: '#0ea5e9', color: '#fff',
                                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                              Gallery
                                            </button>
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
                                          {/* Image preview strip */}
                                          {(part.imageUrl || part.src || part.content) && !isInlineSvg(part.imageUrl || part.src || part.content) && (
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                              <img
                                                src={part.imageUrl || part.src || part.content}
                                                alt="preview"
                                                style={{ height: 52, maxWidth: 90, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                              />
                                              <span style={{ fontSize: 10, color: '#64748b', wordBreak: 'break-all' }}>{part.imageUrl || part.src || part.content}</span>
                                            </div>
                                          )}
                                          <div className={styles.formRow} style={{ marginTop: 8, gap: 12, alignItems: 'center' }}>
                                            <div className={styles.formGroup} style={{ flex: 2 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Label Text (Optional)</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.label || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { label: e.target.value })}
                                                placeholder="Text displayed / spoken"
                                              />
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 16 }}>
                                              <input
                                                type="checkbox"
                                                id={`part_showLabel_${idx}`}
                                                className={styles.checkboxInput}
                                                checked={!!part.showLabel}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { showLabel: e.target.checked })}
                                              />
                                              <label htmlFor={`part_showLabel_${idx}`} style={{ fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                                Show Label
                                              </label>
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 16 }}>
                                              <input
                                                type="checkbox"
                                                id={`part_playLabelSound_${idx}`}
                                                className={styles.checkboxInput}
                                                checked={!!part.playLabelSound}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { playLabelSound: e.target.checked })}
                                              />
                                              <label htmlFor={`part_playLabelSound_${idx}`} style={{ fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                                Click to Play Sound
                                              </label>
                                            </div>
                                            <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 16 }}>
                                              <input
                                                type="checkbox"
                                                id={`part_transparent_${idx}`}
                                                className={styles.checkboxInput}
                                                checked={!!part.transparent}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { transparent: e.target.checked })}
                                              />
                                              <label htmlFor={`part_transparent_${idx}`} style={{ fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                                Transparent
                                              </label>
                                            </div>
                                            {directImageSelect && (
                                              <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 16 }}>
                                                <input
                                                  type="checkbox"
                                                  id={`part_isCorrect_${idx}`}
                                                  className={styles.checkboxInput}
                                                  checked={!!part.isCorrect}
                                                  onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const updatedParts = parts.map((p, pIdx) => {
                                                      if (pIdx === realIdx) {
                                                        return { ...p, isCorrect: checked };
                                                      }
                                                      if (checked) {
                                                        return { ...p, isCorrect: false };
                                                      }
                                                      return p;
                                                    });
                                                    setParts(updatedParts);
                                                    setIsDirty(true);
                                                    ignoreDirtyChange.current = false;
                                                  }}
                                                />
                                                <label htmlFor={`part_isCorrect_${idx}`} style={{ fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#16a34a' }}>
                                                  Correct Answer?
                                                </label>
                                              </div>
                                            )}
                                          </div>

                                          <div className={styles.formRow} style={{ marginTop: 8 }}>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Audio URL / Placeholder (Optional)</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                style={{ padding: '4px', height: 28, fontSize: 11 }}
                                                value={part.audioUrl || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { audioUrl: e.target.value })}
                                                placeholder="e.g. {{targetAudio}} or path to audio file"
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

                                      {part.type === 'audio' && (
                                        <>
                                          <div className={styles.formRow} style={{ alignItems: 'flex-end', gap: 8 }}>
                                            <div className={styles.formGroup} style={{ flex: 2 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Audio URL (R2 or external)</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                value={part.audioUrl || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { audioUrl: e.target.value })}
                                                placeholder="https://pub-xxx.r2.dev/audio/phonics/aa.wav"
                                              />
                                            </div>
                                            {/* Browse R2 Audio Gallery */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setAudioGalleryPartIdx(realIdx);
                                                setShowAudioGallery(true);
                                                if (r2AudioFiles.length === 0) fetchR2AudioFiles();
                                              }}
                                              style={{
                                                flexShrink: 0, height: 34, padding: '0 12px',
                                                borderRadius: 8, border: '1.5px solid #7c3aed',
                                                background: '#7c3aed', color: '#fff',
                                                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              🎵 Browse R2
                                            </button>
                                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                              <label style={{ fontSize: 11, fontWeight: 700 }}>Label (spoken/display)</label>
                                              <input
                                                type="text"
                                                className={styles.formInput}
                                                value={part.label || ''}
                                                onChange={(e) => handleUpdatePartFields(realIdx, { label: e.target.value })}
                                                placeholder="e.g. /æ/ as in cat"
                                              />
                                            </div>
                                          </div>
                                          {/* Audio preview */}
                                          {part.audioUrl && (
                                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                              <audio controls src={part.audioUrl} style={{ height: 32 }} />
                                              <span style={{ fontSize: 10, color: '#64748b', wordBreak: 'break-all', flex: 1 }}>{part.audioUrl.split('/').pop()}</span>
                                            </div>
                                          )}
                                          {!part.audioUrl && (
                                            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>No audio attached. Click Browse R2 to pick a file, or paste a URL above.</p>
                                          )}
                                        </>
                                      )}

                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className={styles.addButtonRow} style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                              <button
                                type="button"
                                className={styles.btnOutline}
                                style={{ padding: '4px 8px', fontSize: 11, borderColor: '#7c3aed', color: '#7c3aed' }}
                                onClick={() => handleAddPart('audio')}
                              >
                                🎵 + Add Audio Part
                              </button>
                            </div>

                            {/* Image Layout Configuration */}
                            <div className={styles.formRow} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #cbd5e1', gap: 20 }}>
                              <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input
                                  type="checkbox"
                                  id="arrangeImagesRow"
                                  className={styles.checkboxInput}
                                  checked={arrangeImagesRow}
                                  onChange={(e) => {
                                    setArrangeImagesRow(e.target.checked);
                                    ignoreDirtyChange.current = false;
                                    setIsDirty(true);
                                  }}
                                />
                                <label htmlFor="arrangeImagesRow" className={styles.filterLabel} style={{ cursor: 'pointer', margin: 0, fontWeight: 700 }}>
                                  Arrange image parts in a horizontal flex row
                                </label>
                              </div>

                              {arrangeImagesRow && (
                                <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <label htmlFor="commonImageWidth" className={styles.filterLabel} style={{ margin: 0, fontWeight: 700 }}>
                                    Common Fixed Width (px)
                                  </label>
                                  <input
                                    type="number"
                                    id="commonImageWidth"
                                    className={styles.formInput}
                                    style={{ width: 80, height: 32, padding: '4px 8px' }}
                                    value={commonImageWidth}
                                    onChange={(e) => {
                                      setCommonImageWidth(Number(e.target.value) || 180);
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }}
                                  />
                                </div>
                              )}

                              <div className={styles.formGroup} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                                <input
                                  type="checkbox"
                                  id="directImageSelect"
                                  className={styles.checkboxInput}
                                  checked={directImageSelect}
                                  onChange={(e) => {
                                    setDirectImageSelect(e.target.checked);
                                    ignoreDirtyChange.current = false;
                                    setIsDirty(true);
                                  }}
                                />
                                <label htmlFor="directImageSelect" className={styles.filterLabel} style={{ cursor: 'pointer', margin: 0, fontWeight: 700, color: '#0ea5e9' }}>
                                  🎯 Direct Image Selection (No Bottom Options Grid)
                                </label>
                              </div>
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
                                const nextType = e.target.value;
                                setType(nextType);
                                if (nextType === 'dynamic_pool' && type !== 'dynamic_pool') {
                                  setPoolId('');
                                  setTargetCategory('');
                                  setDistractorCategories('');
                                  setOptions([
                                    { label: '', isCorrect: false, isDistractorOnly: false, explanation: '' },
                                    { label: '', isCorrect: false, isDistractorOnly: true, misconceptionType: 'general_confusion', similarity: 'medium' }
                                  ]);
                                }
                                if (nextType === 'word_completion_pool') {
                                  setInteraction('categorizationv2');
                                  setLayoutMode('word_completion');
                                  setTargetCategory(!targetCategory || targetCategory === '[random]' ? 'short_i_words' : targetCategory);
                                  if (!questionText.trim()) {
                                    setQuestionText('Complete the words.');
                                  }
                                  setCategories([]);
                                }
                                ignoreDirtyChange.current = false;
                                setIsDirty(true);
                              }}
                            >
                              <option value="mcq">Multiple Choice Question (MCQ)</option>
                              <option value="dynamic_pool">Dynamic Option Pool</option>
                              <option value="mcq_hotspot">Multiple Choice (Hotspot Select)</option>
                              <option value="shadow_match">Shadow Match (Sticker Drag)</option>
                              <option value="fillInTheBlank">Fill-In-The-Blank (FIB)</option>
                              <option value="trueOrFalse">True / False</option>
                              <option value="categorization">Categorization / Sorting (Konva Canvas)</option>
                              <option value="categorizationv2">Categorization / Sorting (HTML5 Drag-Drop)</option>
                              <option value="word_completion_pool">Word Completion / Phonics Fill (CatV2)</option>
                            </select>
                          </div>

                          {(type === 'mcq' || isPoolDrivenAuthoringType(type)) && (
                            <div className={styles.formGroup}>
                              {isPoolDrivenAuthoringType(type) && (
                                <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                  <h4 style={{ fontSize: 13, fontWeight: 'bold', color: '#0f766e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    🌐 Pool Source
                                  </h4>
                                  <p style={{ fontSize: 11, color: '#0d9488', margin: '0 0 10px' }}>
                                    Select a centralized pool to reuse reviewed vocabulary, or choose Inline manual pool to store options inside this question.
                                  </p>
                                  {/* Interaction Type Selector */}
                                  <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: '600', color: '#0f766e', display: 'block', marginBottom: 4 }}>Interaction Type</label>
                                      <select
                                        className={styles.formSelect}
                                        style={{ width: '100%', margin: 0, padding: '6px 8px', fontSize: 12 }}
                                        value={interaction || 'choice'}
                                        onChange={(e) => {
                                          const nextInteraction = e.target.value;
                                          setInteraction(nextInteraction);
                                          if (nextInteraction === 'word_completion' || type === 'word_completion_pool') {
                                            setLayoutMode('word_completion');
                                            setTargetCategory(!targetCategory || targetCategory === '[random]' ? 'short_i_words' : targetCategory);
                                            setCategories([]);
                                            if (!questionText.trim()) {
                                              setQuestionText('Complete the words.');
                                            }
                                          }
                                          setPoolAssetAudit(null);
                                          setIsDirty(true);
                                          if (nextInteraction === 'categorization' || nextInteraction === 'categorizationv2') {
                                            if (categories.length === 2 && categories[0].id === 'cat_1') {
                                              setCategories([]);
                                            }
                                          }
                                        }}
                                      >
                                        <option value="choice">Multiple Choice (MCQ)</option>
                                        <option value="multi_select">Multi-Select MCQ</option>
                                        <option value="categorization">Categorization / Sorting (Konva Canvas)</option>
                                        <option value="categorizationv2">Categorization / Sorting (HTML5 Drag-Drop)</option>
                                        <option value="word_completion">Word Completion / Phonics Fill</option>
                                        <option value="pick_from_sentence">Select Word in Sentence</option>
                                      </select>
                                      {(type === 'word_completion_pool' || interaction === 'word_completion') && (
                                        <p style={{ margin: '6px 0 0', fontSize: 10, color: '#0f766e' }}>
                                          Saves as CatV2 word_completion for IXL-style phonics cards.
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: '600', color: '#0f766e', display: 'block', marginBottom: 4 }}>Pool ID</label>
                                      <select
                                        className={styles.formSelect}
                                        style={{ width: '100%', margin: 0, padding: '6px 8px', fontSize: 12 }}
                                        value={poolId}
                                        onChange={(e) => {
                                          setPoolId(e.target.value);
                                          setTargetCategory('');
                                          setDistractorCategories('');
                                          setCategories([]);
                                          setPoolWordManagerOpen(false);
                                          setPoolWordManagerData(null);
                                          setPoolWordCategory('');
                                          setPoolWordInput('');
                                          setPoolWordManagerStatus('');
                                          setPoolAssetAudit(null);
                                          ignoreDirtyChange.current = false;
                                          setIsDirty(true);
                                        }}
                                      >
                                        <option value="">Inline manual pool</option>
                                        {vocabularyPools.map(pool => (
                                          <option key={pool.poolId} value={pool.poolId}>
                                            {pool.poolId}{pool.status ? ` (${pool.status})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        className={`${styles.btnOutline} ${styles.btnCompact}`}
                                        onClick={openCreatePoolModal}
                                        style={{ marginTop: 6, width: '100%', padding: '5px 8px' }}
                                      >
                                        + Create New Pool
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: 8 }}>
                                    {(type === 'word_completion_pool' || interaction === 'word_completion') ? (
                                      <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                          <div>
                                            <label style={{ fontSize: 11, fontWeight: '600', color: '#0f766e', display: 'block', marginBottom: 4 }}>Word Pool Category</label>
                                            <select
                                              className={styles.formSelect}
                                              style={{ width: '100%', margin: 0, padding: '6px 8px', fontSize: 12 }}
                                              value={targetCategory}
                                              disabled={!selectedVocabularyPool}
                                              onChange={(e) => {
                                                setTargetCategory(e.target.value);
                                                setPoolAssetAudit(null);
                                                ignoreDirtyChange.current = false;
                                                setIsDirty(true);
                                              }}
                                            >
                                              <option value="">Select word category</option>
                                              <option value="[random]">[random] Pick a random category</option>
                                              {selectedPoolCategories.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label style={{ fontSize: 11, fontWeight: '600', color: '#0f766e', display: 'block', marginBottom: 4 }}>Missing Letter Mode</label>
                                            <select
                                              className={styles.formSelect}
                                              style={{ width: '100%', margin: 0, padding: '6px 8px', fontSize: 12 }}
                                              value={missingLetterMode}
                                              onChange={(e) => {
                                                setMissingLetterMode(e.target.value);
                                                setPoolAssetAudit(null);
                                                ignoreDirtyChange.current = false;
                                                setIsDirty(true);
                                              }}
                                            >
                                              <option value="beginning">Beginning: _at</option>
                                              <option value="middle">Middle: c_t</option>
                                              <option value="ending">Ending: ca_</option>
                                            </select>
                                          </div>
                                        </div>
                                        <p style={{ fontSize: 11, color: '#0f766e', margin: '6px 0 0' }}>
                                          The generator will pick two words and use <code>initial</code>, <code>middle</code>, or <code>endingLetter</code> with each word&apos;s saved pattern, image, and audio.
                                        </p>
                                      </div>
                                    ) : interaction !== 'categorization' && interaction !== 'categorizationv2' ? (
                                      <div style={{ display: 'grid', gridTemplateColumns: interaction === 'pick_from_sentence' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
                                        <div>
                                          <label style={{ fontSize: 11, fontWeight: '600', color: '#0f766e', display: 'block', marginBottom: 4 }}>Target Category</label>
                                          <select
                                            className={styles.formSelect}
                                            style={{ width: '100%', margin: 0, padding: '6px 8px', fontSize: 12 }}
                                            value={targetCategory}
                                            disabled={!selectedVocabularyPool}
                                            onChange={(e) => {
                                              setTargetCategory(e.target.value);
                                              setPoolAssetAudit(null);
                                              const nextDistractors = parseCategoryList(distractorCategories).filter(category => category !== e.target.value);
                                              setDistractorCategories(nextDistractors.join(', '));
                                              ignoreDirtyChange.current = false;
                                              setIsDirty(true);
                                            }}
                                          >
                                            <option value="">Select target category</option>
                                            <option value="[random]">[random] (Pick a random category)</option>
                                            {selectedPoolCategories.map(category => (
                                              <option key={category} value={category}>{category}</option>
                                            ))}
                                          </select>
                                        </div>
                                        {interaction === 'pick_from_sentence' && (
                                          <div>
                                            <label style={{ fontSize: 11, fontWeight: '600', color: '#7c3aed', display: 'block', marginBottom: 4 }}>Target Part of Speech</label>
                                            <select
                                              className={styles.formSelect}
                                              style={{ width: '100%', margin: 0, padding: '6px 8px', fontSize: 12 }}
                                              value={targetKey}
                                              onChange={(e) => {
                                                setTargetKey(e.target.value);
                                                ignoreDirtyChange.current = false;
                                                setIsDirty(true);
                                              }}
                                            >
                                              <option value="nouns">Nouns</option>
                                              <option value="verbs">Verbs</option>
                                              <option value="adjectives">Adjectives</option>
                                              <option value="adverbs">Adverbs</option>
                                              <option value="prepositions">Prepositions</option>
                                              <option value="pronouns">Pronouns</option>
                                              <option value="conjunctions">Conjunctions</option>
                                              <option value="articles">Articles</option>
                                            </select>
                                            {(() => {
                                              if (!selectedVocabularyPool || !targetKey || targetKey === 'nouns') return null;
                                              const cats = targetCategory.trim() === '[random]' ? selectedPoolCategories : [targetCategory.trim()];
                                              const hasData = cats.some(cat => (selectedVocabularyPool?.posKeys?.[cat] || []).includes(targetKey));
                                              if (hasData) return <p style={{ fontSize: 10, color: '#7c3aed', margin: '3px 0 0' }}>✅ Pool sentences have <strong>{targetKey}</strong> annotated.</p>;
                                              return <p style={{ fontSize: 10, color: '#dc2626', margin: '3px 0 0' }}>⚠️ Pool sentences missing <strong>{targetKey}</strong> data. Add {targetKey} arrays to pool sentences.</p>;
                                            })()}
                                          </div>
                                        )}
                                        <div>
                                          <label style={{ fontSize: 11, fontWeight: '600', color: '#be123c', display: 'block', marginBottom: 4 }}>Distractor Categories</label>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minHeight: 32, alignItems: 'center' }}>
                                            {selectedPoolCategories.filter(category => category !== targetCategory).map(category => {
                                              const checked = parseCategoryList(distractorCategories).includes(category);
                                              return (
                                                <label key={category} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                                                  <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => {
                                                      const current = parseCategoryList(distractorCategories);
                                                      const next = checked ? current.filter(item => item !== category) : [...current, category];
                                                      setDistractorCategories(next.join(', '));
                                                      setPoolAssetAudit(null);
                                                      ignoreDirtyChange.current = false;
                                                      setIsDirty(true);
                                                    }}
                                                  />
                                                  {category}
                                                </label>
                                              );
                                            })}
                                            {selectedVocabularyPool && selectedPoolCategories.length === 0 && <span style={{ fontSize: 11, color: '#be123c' }}>No categories found</span>}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <label style={{ fontSize: 11, fontWeight: '600', color: '#0f766e', display: 'block', marginBottom: 4 }}>Categories to Include (Leave empty to use all pool categories)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 32, alignItems: 'center' }}>
                                          {selectedPoolCategories.map(category => {
                                            const checked = categories.some(c => c.id === category);
                                            return (
                                              <label key={category} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                                                <input
                                                  type="checkbox"
                                                  checked={checked}
                                                  onChange={() => {
                                                    const next = checked 
                                                      ? categories.filter(c => c.id !== category)
                                                      : [...categories, { id: category, label: category.charAt(0).toUpperCase() + category.slice(1) }];
                                                    setCategories(next);
                                                    ignoreDirtyChange.current = false;
                                                    setIsDirty(true);
                                                  }}
                                                />
                                                {category}
                                              </label>
                                            );
                                          })}
                                          {selectedVocabularyPool && selectedPoolCategories.length === 0 && <span style={{ fontSize: 11, color: '#be123c' }}>No categories found</span>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {vocabularyPoolsLoading && <p style={{ fontSize: 11, color: '#0d9488', margin: 0 }}>Loading centralized pools…</p>}
                                  {vocabularyPoolsError && <p style={{ fontSize: 11, color: '#be123c', margin: 0 }}>{vocabularyPoolsError}</p>}
                                  {selectedVocabularyPool && (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <p style={{ fontSize: 11, color: '#0f766e', margin: 0 }}>
                                          Referenced pool categories: {selectedPoolCategories.map(category => `${category} (${selectedVocabularyPool.categoryCounts?.[category] ?? selectedVocabularyPool.pools?.[category]?.length ?? 0})`).join(', ')}.
                                        </p>
                                        <button
                                          type="button"
                                          className={`${styles.btnOutline} ${styles.btnCompact}`}
                                          onClick={openPoolManagerModal}
                                          style={{ padding: '5px 10px', whiteSpace: 'nowrap' }}
                                        >
                                          Manage Option Pool
                                        </button>
                                      </div>
                                    </>
                                  )}
                                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #99f6e4' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) auto', gap: 10, alignItems: 'end' }}>
                                      <div>
                                        <label style={{ fontSize: 11, fontWeight: 650, color: '#0f766e', display: 'block', marginBottom: 4 }}>Option Display</label>
                                        <select
                                          className={styles.formSelect}
                                          value={hideOptionImages ? (hideOptionLabel ? 'audio_only' : 'label_only') : (hideOptionLabel ? 'image_only' : 'image_label')}
                                          onChange={(event) => {
                                            const mode = event.target.value;
                                            setHideOptionImages(mode === 'label_only' || mode === 'audio_only');
                                            setHideOptionLabel(mode === 'image_only' || mode === 'audio_only');
                                            setPoolAssetAudit(null);
                                            setIsDirty(true);
                                          }}
                                          style={{ width: '100%', margin: 0 }}
                                        >
                                          <option value="image_label">Show images and labels</option>
                                          <option value="image_only">Show images, hide labels</option>
                                          <option value="label_only">Hide images, show labels</option>
                                          <option value="audio_only">Hide images and labels (audio only)</option>
                                        </select>
                                      </div>
                                      <button
                                        type="button"
                                        className={`${styles.btnOutline} ${styles.btnCompact}`}
                                        onClick={auditDynamicPoolAssets}
                                        disabled={poolAssetAuditLoading || (poolId.trim() && (interaction !== 'categorization' && interaction !== 'categorizationv2' && interaction !== 'word_completion' && interaction !== 'pick_from_sentence') && (!targetCategory.trim() || (targetCategory.trim() !== '[random]' && parseCategoryList(distractorCategories).length === 0)))}
                                        style={{ padding: '6px 10px' }}
                                      >
                                        {poolAssetAuditLoading ? 'Checking…' : 'Check Images & Audio'}
                                      </button>
                                    </div>
                                    {poolAssetAudit && !poolAssetAudit.error && (
                                      <div style={{ marginTop: 8, fontSize: 11, color: '#334155', lineHeight: 1.5 }}>
                                        <strong>{poolAssetAudit.total} active options checked.</strong>
                                        <div style={{ color: poolAssetAudit.missingImages.length ? '#b45309' : '#047857' }}>
                                          Images: {poolAssetAudit.missingImages.length ? `${poolAssetAudit.missingImages.length} missing — ${poolAssetAudit.missingImages.slice(0, 12).join(', ')}${poolAssetAudit.missingImages.length > 12 ? '…' : ''}` : 'all available'}
                                        </div>
                                        <div style={{ color: poolAssetAudit.missingAudio.length ? '#b45309' : '#047857' }}>
                                          Audio: {poolAssetAudit.missingAudio.length ? `${poolAssetAudit.missingAudio.length} missing — ${poolAssetAudit.missingAudio.slice(0, 12).join(', ')}${poolAssetAudit.missingAudio.length > 12 ? '…' : ''}` : 'all available'}
                                        </div>
                                      </div>
                                    )}
                                    {poolAssetAudit?.error && <p style={{ margin: '8px 0 0', fontSize: 11, color: '#be123c' }}>{poolAssetAudit.error}</p>}
                                  </div>
                                </div>
                              )}
                              {(!poolId.trim() || !isPoolDrivenAuthoringType(type)) && (
                                <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label className={styles.filterLabel} style={{ marginBottom: 0 }}>
                                  {type === 'dynamic_pool'
                                    ? 'Dynamic Option Pool (Manage option pool words, their audio assets, and image mappings)'
                                    : 'MCQ Options (Select correct answer radio, reorder, or edit keyboard shortcuts)'}
                                </label>
                                <button
                                  type="button"
                                  className={`${styles.btnOutline} ${styles.btnCompact}`}
                                  onClick={handleAutoLinkOptions}
                                  title="Automatically link matching images and audio files from database based on typed option text"
                                  style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  🔗 Auto-Link Option Assets
                                </button>
                              </div>
                              
                              <div className={styles.optionsList}>
                                {type === 'dynamic_pool' ? (
                                  <>
                                    <div style={{ marginBottom: 24 }}>
                                      <h4 style={{ fontSize: 13, fontWeight: 'bold', color: '#0f766e', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🎯 Target Pool (Correct Words)
                                      </h4>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {options.map((option, idx) => {
                                          if (option.isDistractorOnly) return null;
                                          return (
                                            <div key={idx} className={styles.optionItemRow} style={{ borderLeft: '4px solid #10b981', paddingLeft: 8 }}>
                                              <div className={styles.optionControlsGroup}>
                                                <button 
                                                  type="button"
                                                  className={styles.moveBtn} 
                                                  onClick={() => moveOptionUp(idx)}
                                                  disabled={idx === 0}
                                                >
                                                  ▲
                                                </button>
                                                <button 
                                                  type="button"
                                                  className={styles.moveBtn} 
                                                  onClick={() => moveOptionDown(idx)}
                                                  disabled={idx === options.length - 1}
                                                >
                                                  ▼
                                                </button>
                                              </div>

                                              {option.imageUrl && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, position: 'relative', flexShrink: 0 }}>
                                                  <img 
                                                    src={option.imageUrl} 
                                                    alt="" 
                                                    style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 6, border: '2px solid #e2e8f0', background: '#f8fafc' }} 
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => updateOptionImageUrl(idx, '')}
                                                    title="Remove image"
                                                    style={{
                                                      position: 'absolute', top: -6, right: -6, border: 'none', background: '#ef4444', color: '#ffffff',
                                                      borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                      fontSize: 9, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                    }}
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              )}

                                              {option.audioUrl ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, position: 'relative', flexShrink: 0 }}>
                                                  <button
                                                    type="button"
                                                    onClick={() => handlePlayUrlAudio(`opt_preview_${idx}`, option.audioUrl)}
                                                    className={styles.iconPlayBtn}
                                                    style={{
                                                      width: 42, height: 42, borderRadius: 6,
                                                      border: '2px solid #e2e8f0', background: '#f8fafc',
                                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                      fontSize: 16, cursor: 'pointer', padding: 0
                                                    }}
                                                  >
                                                    {playingAudioId === `opt_preview_${idx}` ? '⏹' : '🔊'}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateOptionAudioUrl(idx, '')}
                                                    title="Remove audio"
                                                    style={{
                                                      position: 'absolute', top: -6, right: -6, border: 'none', background: '#ef4444', color: '#ffffff',
                                                      borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                      fontSize: 9, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                    }}
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => handleGenerateAndPlayOptionAudio(idx)}
                                                  disabled={generatingAudioOptionIdx === idx}
                                                  className={styles.iconPlayBtn}
                                                  style={{
                                                    width: 42, height: 42, borderRadius: 6,
                                                    border: '2px dashed #cbd5e1', background: '#f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 16, cursor: 'pointer', padding: 0,
                                                    color: '#64748b', marginRight: 8, flexShrink: 0
                                                  }}
                                                  title="Generate & Play Audio"
                                                >
                                                  {generatingAudioOptionIdx === idx ? '⏳' : '🎙️'}
                                                </button>
                                              )}

                                              <input 
                                                type="text" 
                                                className={styles.optionTextInput} 
                                                value={option.label} 
                                                onChange={(e) => updateOptionText(idx, e.target.value)}
                                                placeholder={`Target word (e.g. cat)`}
                                              />

                                              <input 
                                                type="text" 
                                                className={styles.optionTextInput} 
                                                value={option.explanation || ''} 
                                                onChange={(e) => updateOptionExplanation(idx, e.target.value)}
                                                placeholder="Explanation (Optional)"
                                                style={{ marginLeft: 8, flex: 1.5 }}
                                              />

                                              <button 
                                                type="button"
                                                className={styles.iconPlayBtn} 
                                                onClick={() => openImgPickerForOption(idx, 'gallery')}
                                                title="Add image"
                                                style={{ marginRight: 4 }}
                                              >
                                                🖼️
                                              </button>
                                              
                                              <button 
                                                type="button"
                                                className={styles.iconPlayBtn} 
                                                onClick={() => openAudioGalleryForOption(idx)}
                                                title="Add audio"
                                                style={{ marginRight: 4 }}
                                              >
                                                🎵
                                              </button>

                                              <button 
                                                type="button"
                                                className={`${styles.btnDanger} ${styles.btnCompact}`}
                                                onClick={() => removeOption(idx)}
                                                style={{ padding: '6px 8px' }}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 style={{ fontSize: 13, fontWeight: 'bold', color: '#be123c', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        👾 Distractor Pool (Options & Matching Rules)
                                      </h4>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {options.map((option, idx) => {
                                          if (!option.isDistractorOnly) return null;
                                          return (
                                            <div key={idx} className={styles.optionItemRow} style={{ borderLeft: '4px solid #ef4444', paddingLeft: 8 }}>
                                              <div className={styles.optionControlsGroup}>
                                                <button 
                                                  type="button"
                                                  className={styles.moveBtn} 
                                                  onClick={() => moveOptionUp(idx)}
                                                  disabled={idx === 0}
                                                >
                                                  ▲
                                                </button>
                                                <button 
                                                  type="button"
                                                  className={styles.moveBtn} 
                                                  onClick={() => moveOptionDown(idx)}
                                                  disabled={idx === options.length - 1}
                                                >
                                                  ▼
                                                </button>
                                              </div>

                                              {option.imageUrl && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, position: 'relative', flexShrink: 0 }}>
                                                  <img 
                                                    src={option.imageUrl} 
                                                    alt="" 
                                                    style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 6, border: '2px solid #e2e8f0', background: '#f8fafc' }} 
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => updateOptionImageUrl(idx, '')}
                                                    title="Remove image"
                                                    style={{
                                                      position: 'absolute', top: -6, right: -6, border: 'none', background: '#ef4444', color: '#ffffff',
                                                      borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                      fontSize: 9, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                    }}
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              )}

                                              {option.audioUrl ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, position: 'relative', flexShrink: 0 }}>
                                                  <button
                                                    type="button"
                                                    onClick={() => handlePlayUrlAudio(`opt_preview_${idx}`, option.audioUrl)}
                                                    className={styles.iconPlayBtn}
                                                    style={{
                                                      width: 42, height: 42, borderRadius: 6,
                                                      border: '2px solid #e2e8f0', background: '#f8fafc',
                                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                      fontSize: 16, cursor: 'pointer', padding: 0
                                                    }}
                                                  >
                                                    {playingAudioId === `opt_preview_${idx}` ? '⏹' : '🔊'}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateOptionAudioUrl(idx, '')}
                                                    title="Remove audio"
                                                    style={{
                                                      position: 'absolute', top: -6, right: -6, border: 'none', background: '#ef4444', color: '#ffffff',
                                                      borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                      fontSize: 9, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                    }}
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => handleGenerateAndPlayOptionAudio(idx)}
                                                  disabled={generatingAudioOptionIdx === idx}
                                                  className={styles.iconPlayBtn}
                                                  style={{
                                                    width: 42, height: 42, borderRadius: 6,
                                                    border: '2px dashed #cbd5e1', background: '#f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 16, cursor: 'pointer', padding: 0,
                                                    color: '#64748b', marginRight: 8, flexShrink: 0
                                                  }}
                                                  title="Generate & Play Audio"
                                                >
                                                  {generatingAudioOptionIdx === idx ? '⏳' : '🎙️'}
                                                </button>
                                              )}

                                              <input 
                                                type="text" 
                                                className={styles.optionTextInput} 
                                                value={option.label} 
                                                onChange={(e) => updateOptionText(idx, e.target.value)}
                                                placeholder={`Distractor (e.g. dog)`}
                                              />

                                              <select
                                                value={option.misconceptionType || 'general_confusion'}
                                                onChange={(e) => updateOptionMisconception(idx, e.target.value)}
                                                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginLeft: 8, background: '#fff' }}
                                              >
                                                <option value="general_confusion">General Confusion</option>
                                                <option value="movement_confusion">Movement Confusion</option>
                                                <option value="diet_confusion">Diet Confusion</option>
                                                <option value="size_confusion">Size Confusion</option>
                                                <option value="habitat_confusion">Habitat Confusion</option>
                                                <option value="spelling_mismatch">Spelling Mismatch</option>
                                                <option value="similar_sound">Similar Sound</option>
                                              </select>

                                              <select
                                                value={option.similarity || 'medium'}
                                                onChange={(e) => updateOptionSimilarity(idx, e.target.value)}
                                                style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', marginLeft: 8, background: '#fff' }}
                                              >
                                                <option value="low">Low Similarity</option>
                                                <option value="medium">Medium Similarity</option>
                                                <option value="high">High Similarity</option>
                                              </select>

                                              <button 
                                                type="button"
                                                className={styles.iconPlayBtn} 
                                                onClick={() => openImgPickerForOption(idx, 'gallery')}
                                                title="Add image"
                                                style={{ marginRight: 4 }}
                                              >
                                                🖼️
                                              </button>
                                              
                                              <button 
                                                type="button"
                                                className={styles.iconPlayBtn} 
                                                onClick={() => openAudioGalleryForOption(idx)}
                                                title="Add audio"
                                                style={{ marginRight: 4 }}
                                              >
                                                🎵
                                              </button>

                                              <button 
                                                type="button"
                                                className={`${styles.btnDanger} ${styles.btnCompact}`}
                                                onClick={() => removeOption(idx)}
                                                style={{ padding: '6px 8px' }}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  options.map((option, idx) => (
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

                                      {option.imageUrl && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, position: 'relative', flexShrink: 0 }}>
                                          <img 
                                            src={option.imageUrl} 
                                            alt="" 
                                            style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 6, border: '2px solid #e2e8f0', background: '#f8fafc' }} 
                                          />
                                          <button
                                            type="button"
                                            onClick={() => updateOptionImageUrl(idx, '')}
                                            title="Remove image from this option"
                                            style={{
                                              position: 'absolute',
                                              top: -6,
                                              right: -6,
                                              border: 'none',
                                              background: '#ef4444',
                                              color: '#ffffff',
                                              borderRadius: '50%',
                                              width: 16,
                                              height: 16,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: 9,
                                              cursor: 'pointer',
                                              fontWeight: 'bold',
                                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}

                                      {option.audioUrl && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, position: 'relative', flexShrink: 0 }}>
                                          <button
                                            type="button"
                                            onClick={() => handlePlayUrlAudio(`opt_preview_${idx}`, option.audioUrl)}
                                            className={styles.iconPlayBtn}
                                            style={{
                                              width: 42, height: 42, borderRadius: 6,
                                              border: '2px solid #e2e8f0', background: '#f8fafc',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: 16, cursor: 'pointer',
                                              padding: 0
                                            }}
                                            title="Play option audio"
                                          >
                                            {playingAudioId === `opt_preview_${idx}` ? '⏹' : '🔊'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => updateOptionAudioUrl(idx, '')}
                                            title="Remove audio from this option"
                                            style={{
                                              position: 'absolute',
                                              top: -6,
                                              right: -6,
                                              border: 'none',
                                              background: '#ef4444',
                                              color: '#ffffff',
                                              borderRadius: '50%',
                                              width: 16,
                                              height: 16,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: 9,
                                              cursor: 'pointer',
                                              fontWeight: 'bold',
                                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      )}

                                      <input 
                                        type="text" 
                                        className={styles.optionTextInput} 
                                        value={option.label} 
                                        onChange={(e) => updateOptionText(idx, e.target.value)}
                                        onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                                        placeholder={option.imageUrl ? "Option Text Label (Optional caption)" : `Option ${idx + 1}`}
                                      />

                                      {option.imageUrl && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, userSelect: 'none', color: '#64748b', cursor: 'pointer', flexShrink: 0, marginLeft: 8, marginRight: 4 }}>
                                          <input
                                            type="checkbox"
                                            checked={!!option.hideLabel}
                                            onChange={(e) => updateOptionHideLabel(idx, e.target.checked)}
                                            style={{ width: 14, height: 14, cursor: 'pointer' }}
                                          />
                                          Hide Label
                                        </label>
                                      )}

                                      <button 
                                        type="button"
                                        className={styles.iconPlayBtn} 
                                        onClick={() => openImgPickerForOption(idx, 'gallery')}
                                        title="Add/Upload image for this option"
                                        style={{ marginRight: 4 }}
                                      >
                                        🖼️
                                      </button>
                                      
                                      <button 
                                        type="button"
                                        className={styles.iconPlayBtn} 
                                        onClick={() => openAudioGalleryForOption(idx)}
                                        title="Add/Select audio for this option"
                                        style={{ marginRight: 4 }}
                                      >
                                        🎵
                                      </button>
                                      
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
                                  ))
                                )}
                              </div>
                              
                              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                                {type === 'dynamic_pool' ? (
                                  <>
                                    <button 
                                      type="button" 
                                      className={styles.btnOutline} 
                                      onClick={addCorrectOption}
                                      style={{ padding: '6px 12px', borderColor: '#10b981', color: '#10b981', background: '#f0fdf4' }}
                                    >
                                      + Add Correct Target Card
                                    </button>
                                    <button 
                                      type="button" 
                                      className={styles.btnOutline} 
                                      onClick={addDistractorOption}
                                      style={{ padding: '6px 12px', borderColor: '#ef4444', color: '#ef4444', background: '#fef2f2' }}
                                    >
                                      + Add Distractor Candidate Card
                                    </button>
                                  </>
                                ) : (
                                  options.length < 8 && (
                                    <button 
                                      type="button" 
                                      className={styles.btnOutline} 
                                      onClick={addOption}
                                      style={{ padding: '6px 12px' }}
                                    >
                                      + Add Option Row
                                    </button>
                                  )
                                )}
                                {type === 'dynamic_pool' ? (
                                  <>
                                    <button type="button" className={styles.btnOutline} onClick={() => bulkAddDynamicPoolOptions(false)} style={{ padding: '6px 12px' }}>
                                      📋 Bulk Add Targets
                                    </button>
                                    <button type="button" className={styles.btnOutline} onClick={() => bulkAddDynamicPoolOptions(true)} style={{ padding: '6px 12px' }}>
                                      📋 Bulk Add Distractors
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.btnOutline}
                                    onClick={() => {
                                      const text = prompt("Paste a list of words (space, comma, or newline separated) to add to the options list:");
                                      if (!text) return;
                                      const words = text.split(/[\s,\n]+/).map(word => word.trim()).filter(Boolean);
                                      setOptions([...options.filter(option => option.label.trim() !== ''), ...words.slice(0, Math.max(0, 8 - options.length)).map(label => ({ label, isCorrect: false }))]);
                                      setIsDirty(true);
                                    }}
                                    style={{ padding: '6px 12px' }}
                                  >
                                    📋 Bulk Add Words
                                  </button>
                                )}

                              </div>
                                </>
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
                                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isHotspotTransparent} 
                                    onChange={(e) => {
                                      setIsHotspotTransparent(e.target.checked);
                                      ignoreDirtyChange.current = false;
                                      setIsDirty(true);
                                    }} 
                                    className={styles.checkbox}
                                  />
                                  <span>Transparent Hotspots (hides border / cards, supports clean clipart outlines and outlines on hover/select)</span>
                                </label>
                              </div>
                              {/* Layout Tabs (Desktop vs Mobile) */}
                              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                <button
                                  type="button"
                                  onClick={() => switchPreviewDevice('desktop')}
                                  style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '2px solid',
                                    borderColor: activePreviewDevice === 'desktop' ? '#0284c7' : '#cbd5e1',
                                    backgroundColor: activePreviewDevice === 'desktop' ? '#f0f9ff' : '#ffffff',
                                    color: activePreviewDevice === 'desktop' ? '#0369a1' : '#64748b',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: activePreviewDevice === 'desktop' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none'
                                  }}
                                >
                                  <span>🖥️</span> Desktop Layout (Landscape)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => switchPreviewDevice('mobile')}
                                  style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '2px solid',
                                    borderColor: activePreviewDevice === 'mobile' ? '#0284c7' : '#cbd5e1',
                                    backgroundColor: activePreviewDevice === 'mobile' ? '#f0f9ff' : '#ffffff',
                                    color: activePreviewDevice === 'mobile' ? '#0369a1' : '#64748b',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: activePreviewDevice === 'mobile' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none'
                                  }}
                                >
                                  <span>📱</span> Mobile Layout (Portrait 9:16)
                                </button>
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
                                    maxWidth: canvas?.width ? `${canvas.width}px` : (activePreviewDevice === 'mobile' ? '360px' : '800px'),
                                    aspectRatio: backgroundImage || backgroundSvg ? 'auto' : (activePreviewDevice === 'mobile' ? '360/640' : '16/9'),
                                    minHeight: backgroundImage || backgroundSvg ? 'auto' : (activePreviewDevice === 'mobile' ? '450px' : '300px'),
                                    backgroundColor: '#f8fafc',
                                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                                    backgroundSize: '16px 16px',
                                    border: '2px dashed #cbd5e1',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    cursor: 'crosshair',
                                    userSelect: 'none',
                                    margin: '0 auto'
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
                                          width: `${hs.width}%`,
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
                                            <img src={hs.imageUrl} alt={hs.label || ''} style={{ height: '100%', width: '100%', objectFit: 'contain', pointerEvents: 'none', borderRadius: hs.isCircle ? '50%' : '8px', zIndex: 1 }} />
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
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                                          <input
                                            type="text"
                                            className={styles.formInput}
                                            value={activeHs.imageUrl || ''}
                                            onChange={(e) => {
                                              const updated = hotspots.map(h => h.id === activeHs.id ? { ...h, imageUrl: e.target.value } : h);
                                              syncHotspotsToOptions(updated);
                                            }}
                                            placeholder="https://example.com/image.png"
                                            style={{ fontSize: 12, flex: 1, margin: 0 }}
                                          />
                                          <button
                                            type="button"
                                            className={styles.btnOutline}
                                            onClick={() => openImgPickerForHotspot(activeHs.id, 'gallery')}
                                            title="Browse local gallery or search web images"
                                            style={{ padding: '6px 12px', fontSize: 12, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}
                                          >
                                            🔍 Search
                                          </button>
                                        </div>
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

                          {type === 'shadow_match' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                              {/* Header Info */}
                              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px' }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: '0 0 4px' }}>🎯 Shadow Match Builder</h4>
                                <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>Add stickers (the draggable items in the tray), then click on the scene canvas to place shadow targets. Each target must match a sticker by its <strong>Type ID</strong>.</p>
                              </div>

                              {/* Scene Image URL */}
                              <div className={styles.formGroup}>
                                <label className={styles.filterLabel}>Scene / Background Image URL</label>
                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                  <input
                                    type="text"
                                    className={styles.formInput}
                                    value={shadowSceneImageUrl}
                                    onChange={e => { setShadowSceneImageUrl(e.target.value); setIsDirty(true); }}
                                    placeholder="/images/prek_landscape.webp or https://..."
                                    style={{ flex: 1 }}
                                  />
                                  <button
                                    type="button"
                                    className={styles.btnOutline}
                                    onClick={() => {
                                      setImgPickerPartIdx(-99); // special sentinel
                                      setImgPickerTab('gallery');
                                      setImgPickerOpen(true);
                                    }}
                                    style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                                  >
                                    🖼 Browse
                                  </button>
                                </div>
                              </div>

                              {/* Sticker List */}
                              <div className={styles.formGroup}>
                                <label className={styles.filterLabel}>Stickers (draggable items in the tray)</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                                  {shadowStickers.map((sticker, idx) => (
                                    <div key={sticker.id} style={{
                                      border: '1.5px solid #e2e8f0',
                                      borderRadius: 8,
                                      padding: '12px 14px',
                                      background: '#f8fafc',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 10
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Sticker #{idx + 1}</span>
                                        <button
                                          type="button"
                                          className={`${styles.btnDanger} ${styles.btnCompact}`}
                                          onClick={() => {
                                            const updated = shadowStickers.filter(s => s.id !== sticker.id);
                                            setShadowStickers(updated.map((s, i) => ({ ...s, id: i })));
                                            // Remove matching target
                                            setShadowTargets(prev => prev.filter(t => t.type !== sticker.type));
                                            setIsDirty(true);
                                          }}
                                          style={{ padding: '3px 10px', fontSize: 11 }}
                                        >
                                          × Remove
                                        </button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div className={styles.formGroup}>
                                          <label className={styles.filterLabel} style={{ fontSize: 11 }}>Name (display label)</label>
                                          <input
                                            type="text"
                                            className={styles.formInput}
                                            value={sticker.name}
                                            onChange={e => {
                                              const updated = shadowStickers.map(s => s.id === sticker.id ? { ...s, name: e.target.value } : s);
                                              setShadowStickers(updated);
                                              setIsDirty(true);
                                            }}
                                            placeholder="e.g. Penguin"
                                            style={{ marginTop: 4, fontSize: 12 }}
                                          />
                                        </div>
                                        <div className={styles.formGroup}>
                                          <label className={styles.filterLabel} style={{ fontSize: 11 }}>Type ID (must match target)</label>
                                          <input
                                            type="text"
                                            className={styles.formInput}
                                            value={sticker.type}
                                            onChange={e => {
                                              const oldType = sticker.type;
                                              const newType = e.target.value;
                                              setShadowStickers(prev => prev.map(s => s.id === sticker.id ? { ...s, type: newType } : s));
                                              setShadowTargets(prev => prev.map(t => t.type === oldType ? { ...t, type: newType } : t));
                                              setIsDirty(true);
                                            }}
                                            placeholder="e.g. penguin"
                                            style={{ marginTop: 4, fontSize: 12 }}
                                          />
                                        </div>
                                      </div>
                                      <div className={styles.formGroup}>
                                        <label className={styles.filterLabel} style={{ fontSize: 11 }}>Image URL</label>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                                          {sticker.imageUrl && (
                                            <img src={sticker.imageUrl} alt={sticker.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }} />
                                          )}
                                          <input
                                            type="text"
                                            className={styles.formInput}
                                            value={sticker.imageUrl || ''}
                                            onChange={e => {
                                              const updated = shadowStickers.map(s => s.id === sticker.id ? { ...s, imageUrl: e.target.value } : s);
                                              setShadowStickers(updated);
                                              setIsDirty(true);
                                            }}
                                            placeholder="/images/penguin.svg"
                                            style={{ flex: 1, fontSize: 12, margin: 0 }}
                                          />
                                          <button
                                            type="button"
                                            className={styles.btnOutline}
                                            onClick={() => {
                                              setImgPickerHotspotId(`shadow_sticker_${sticker.id}`);
                                              setImgPickerTab('gallery');
                                              setImgPickerOpen(true);
                                            }}
                                            style={{ padding: '6px 10px', fontSize: 11, whiteSpace: 'nowrap' }}
                                          >
                                            🔍
                                          </button>
                                        </div>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div className={styles.formGroup}>
                                          <label className={styles.filterLabel} style={{ fontSize: 11 }}>Width %</label>
                                          <input
                                            type="number"
                                            className={styles.formInput}
                                            value={sticker.widthPercent}
                                            min={5} max={40}
                                            onChange={e => {
                                              const updated = shadowStickers.map(s => s.id === sticker.id ? { ...s, widthPercent: parseFloat(e.target.value) || 14 } : s);
                                              setShadowStickers(updated);
                                              // Also update matching target size
                                              setShadowTargets(prev => prev.map(t => t.type === sticker.type ? { ...t, widthPercent: parseFloat(e.target.value) || 14 } : t));
                                              setIsDirty(true);
                                            }}
                                            style={{ marginTop: 4, fontSize: 12 }}
                                          />
                                        </div>
                                        <div className={styles.formGroup}>
                                          <label className={styles.filterLabel} style={{ fontSize: 11 }}>Height %</label>
                                          <input
                                            type="number"
                                            className={styles.formInput}
                                            value={sticker.heightPercent}
                                            min={5} max={40}
                                            onChange={e => {
                                              const updated = shadowStickers.map(s => s.id === sticker.id ? { ...s, heightPercent: parseFloat(e.target.value) || 14 } : s);
                                              setShadowStickers(updated);
                                              setShadowTargets(prev => prev.map(t => t.type === sticker.type ? { ...t, heightPercent: parseFloat(e.target.value) || 14 } : t));
                                              setIsDirty(true);
                                            }}
                                            style={{ marginTop: 4, fontSize: 12 }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  className={styles.btnOutline}
                                  onClick={() => {
                                    const newId = shadowStickers.length;
                                    const newType = `sticker_${newId}`;
                                    setShadowStickers(prev => [...prev, {
                                      id: newId,
                                      type: newType,
                                      name: `Sticker ${newId + 1}`,
                                      imageUrl: '',
                                      widthPercent: 14,
                                      heightPercent: 14,
                                    }]);
                                    setIsDirty(true);
                                  }}
                                  style={{ marginTop: 10, padding: '6px 14px', alignSelf: 'flex-start' }}
                                >
                                  + Add Sticker
                                </button>
                              </div>

                              {/* Shadow Target Canvas */}
                              <div className={styles.formGroup}>
                                <label className={styles.filterLabel}>Shadow Target Canvas</label>
                                <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
                                  Click on the scene to place a shadow target. Select a sticker type from the dropdown first. Drag targets to reposition.
                                </span>

                                {/* Sticker selector for next click */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                                  <label className={styles.filterLabel} style={{ marginBottom: 0 }}>Place target for sticker:</label>
                                  <select
                                    className={styles.formSelect}
                                    id="shadowTargetStickerSelect"
                                    style={{ minWidth: 180, fontSize: 12 }}
                                    defaultValue=""
                                  >
                                    <option value="">— Select a sticker type —</option>
                                    {shadowStickers.map(s => (
                                      <option key={s.id} value={s.type}>{s.name} ({s.type})</option>
                                    ))}
                                  </select>
                                  <span style={{ fontSize: 11, color: '#94a3b8' }}>then click on the canvas below</span>
                                </div>

                                {/* Canvas */}
                                <div
                                  ref={canvasRef}
                                  style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '800px',
                                    aspectRatio: shadowSceneImageUrl ? 'auto' : '16/9',
                                    minHeight: shadowSceneImageUrl ? 'auto' : '300px',
                                    backgroundColor: '#f0fdf4',
                                    backgroundImage: !shadowSceneImageUrl ? 'radial-gradient(#bbf7d0 1.5px, transparent 1.5px)' : 'none',
                                    backgroundSize: '16px 16px',
                                    border: '2px dashed #4ade80',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    cursor: 'crosshair',
                                    userSelect: 'none',
                                    margin: '0 auto'
                                  }}
                                  onClick={e => {
                                    // Don't trigger if clicked on an existing target
                                    if (e.target.closest('[data-shadow-target]')) return;
                                    const rect = canvasRef.current?.getBoundingClientRect();
                                    if (!rect) return;
                                    const xPct = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
                                    const yPct = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2));
                                    const select = document.getElementById('shadowTargetStickerSelect');
                                    const selectedType = select?.value;
                                    if (!selectedType) { window.alert('Please select a sticker type first.'); return; }
                                    // Check if target for this type already exists
                                    if (shadowTargets.find(t => t.type === selectedType)) {
                                      window.alert(`A target for "${selectedType}" already exists. Delete it first or move it.`);
                                      return;
                                    }
                                    const matchingSticker = shadowStickers.find(s => s.type === selectedType);
                                    const newTarget = {
                                      id: `st_${Date.now()}`,
                                      type: selectedType,
                                      x: Math.max(0, Math.min(85, xPct - 7)),
                                      y: Math.max(0, Math.min(85, yPct - 7)),
                                      widthPercent: matchingSticker?.widthPercent || 14,
                                      heightPercent: matchingSticker?.heightPercent || 14,
                                    };
                                    setShadowTargets(prev => [...prev, newTarget]);
                                    setSelectedShadowTargetId(newTarget.id);
                                    setIsDirty(true);
                                  }}
                                >
                                  {shadowSceneImageUrl ? (
                                    <img
                                      src={shadowSceneImageUrl}
                                      alt="Scene"
                                      style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
                                    />
                                  ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: 14, fontWeight: 500 }}>
                                      Enter a scene image URL above to start placing targets
                                    </div>
                                  )}

                                  {/* Render shadow targets on canvas */}
                                  {shadowTargets.map(target => {
                                    const matchingSt = shadowStickers.find(s => s.type === target.type);
                                    const isSelected = selectedShadowTargetId === target.id;
                                    return (
                                      <div
                                        key={target.id}
                                        data-shadow-target="true"
                                        title={`${target.type} — click to select`}
                                        onPointerDown={e => {
                                          e.stopPropagation();
                                          setSelectedShadowTargetId(target.id);
                                          const rect = canvasRef.current?.getBoundingClientRect();
                                          if (!rect) return;
                                          const offsetX = e.clientX - rect.left - (target.x / 100 * rect.width);
                                          const offsetY = e.clientY - rect.top - (target.y / 100 * rect.height);
                                          setShadowTargetDragging({ id: target.id, offsetX, offsetY });
                                          e.currentTarget.setPointerCapture(e.pointerId);
                                        }}
                                        onPointerMove={e => {
                                          if (!shadowTargetDragging || shadowTargetDragging.id !== target.id) return;
                                          const rect = canvasRef.current?.getBoundingClientRect();
                                          if (!rect) return;
                                          const newX = parseFloat((((e.clientX - rect.left - shadowTargetDragging.offsetX) / rect.width) * 100).toFixed(2));
                                          const newY = parseFloat((((e.clientY - rect.top - shadowTargetDragging.offsetY) / rect.height) * 100).toFixed(2));
                                          setShadowTargets(prev => prev.map(t => t.id === target.id ? { ...t, x: Math.max(0, Math.min(95, newX)), y: Math.max(0, Math.min(95, newY)) } : t));
                                        }}
                                        onPointerUp={() => { setShadowTargetDragging(null); setIsDirty(true); }}
                                        onPointerCancel={() => setShadowTargetDragging(null)}
                                        style={{
                                          position: 'absolute',
                                          left: `${target.x}%`,
                                          top: `${target.y}%`,
                                          width: `${target.widthPercent}%`,
                                          height: `${target.heightPercent}%`,
                                          border: isSelected ? '2.5px solid #16a34a' : '2px dashed #4ade80',
                                          borderRadius: 6,
                                          background: isSelected ? 'rgba(22, 163, 74, 0.15)' : 'rgba(74, 222, 128, 0.1)',
                                          cursor: 'move',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          overflow: 'hidden',
                                          touchAction: 'none',
                                          zIndex: isSelected ? 10 : 5,
                                        }}
                                      >
                                        {matchingSt?.imageUrl && (
                                          <img
                                            src={matchingSt.imageUrl}
                                            alt={matchingSt.name}
                                            style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'brightness(0) opacity(0.3)', pointerEvents: 'none' }}
                                          />
                                        )}
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', textAlign: 'center', padding: '0 2px', lineHeight: 1.2, pointerEvents: 'none' }}>
                                          {target.type}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Selected Target Inspector */}
                                {selectedShadowTargetId && (() => {
                                  const activeSt = shadowTargets.find(t => t.id === selectedShadowTargetId);
                                  if (!activeSt) return null;
                                  return (
                                    <div style={{ border: '1.5px solid #bbf7d0', borderRadius: 8, padding: 14, backgroundColor: '#f0fdf4', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>Target: {activeSt.type}</span>
                                        <button
                                          type="button"
                                          className={`${styles.btnDanger} ${styles.btnCompact}`}
                                          onClick={() => {
                                            setShadowTargets(prev => prev.filter(t => t.id !== activeSt.id));
                                            setSelectedShadowTargetId(null);
                                            setIsDirty(true);
                                          }}
                                          style={{ padding: '3px 10px', fontSize: 11 }}
                                        >
                                          × Delete
                                        </button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {[['x', 'X (%)'], ['y', 'Y (%)'], ['widthPercent', 'Width (%)'], ['heightPercent', 'Height (%)']].map(([field, label]) => (
                                          <div key={field} className={styles.formGroup}>
                                            <label className={styles.filterLabel} style={{ fontSize: 10 }}>{label}</label>
                                            <input
                                              type="number"
                                              className={styles.formInput}
                                              value={activeSt[field]}
                                              min={0} max={100}
                                              onChange={e => {
                                                setShadowTargets(prev => prev.map(t => t.id === activeSt.id ? { ...t, [field]: parseFloat(e.target.value) || 0 } : t));
                                                setIsDirty(true);
                                              }}
                                              style={{ marginTop: 4, fontSize: 11, padding: '4px' }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Targets Summary */}
                                {shadowTargets.length > 0 && (
                                  <div style={{ marginTop: 12 }}>
                                    <label className={styles.filterLabel}>Placed Targets ({shadowTargets.length}/{shadowStickers.length})</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                      {shadowStickers.map(s => {
                                        const hasTarget = shadowTargets.find(t => t.type === s.type);
                                        return (
                                          <span key={s.id} style={{
                                            padding: '3px 10px',
                                            borderRadius: 20,
                                            fontSize: 11,
                                            fontWeight: 600,
                                            background: hasTarget ? '#dcfce7' : '#fee2e2',
                                            color: hasTarget ? '#15803d' : '#b91c1c',
                                            border: `1px solid ${hasTarget ? '#86efac' : '#fca5a5'}`
                                          }}>
                                            {hasTarget ? '✓' : '○'} {s.name}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
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

                          {type !== 'mcq' && type !== 'dynamic_pool' && type !== 'mcq_hotspot' && type !== 'categorizationv2' && type !== 'categorization' && type !== 'fillInTheBlank' && (
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
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input 
                                  type="text" 
                                  className={styles.formInput} 
                                  style={{ flex: 1 }}
                                  value={audioUrl} 
                                  onChange={(e) => setAudioUrl(e.target.value)}
                                  placeholder="No R2 audio synced yet"
                                />
                                {audioUrl && (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.btnOutline}
                                      onClick={() => handlePlayUrlAudio('main_question_audio', audioUrl)}
                                      style={{ padding: '6px 12px', fontSize: 13, height: 38 }}
                                      title="Preview audio playback"
                                    >
                                      {playingAudioId === 'main_question_audio' ? '⏹' : '🔊'}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.btnOutline}
                                      onClick={() => setAudioUrl('')}
                                      style={{ padding: '6px 12px', fontSize: 13, height: 38, color: 'var(--color-status-wrong)', borderColor: 'var(--color-status-wrong)' }}
                                      title="Clear audio URL from question"
                                    >
                                      ❌
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  className={styles.btnOutline}
                                  onClick={() => {
                                    setAudioGalleryForMainText(true);
                                    setAudioGalleryPartIdx(null);
                                    setAudioGalleryOptionIdx(null);
                                    setShowAudioGallery(true);
                                    fetchR2AudioFiles();
                                  }}
                                  style={{ padding: '6px 12px', fontSize: 13, height: 38 }}
                                  title="Browse audio from Cloudflare R2 bucket"
                                >
                                  🎵 Browse
                                </button>
                              </div>
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

                {/* MODE B: PASTE & PARSE (multi-question bulk draft) */}
                {authoringMode === 'paste' && (
                  <div className={styles.parseWorkspaceContainer}>

                    {/* Instructions + Format */}
                    <div className={styles.parseInstructions}>
                      <h4>📋 Paste & Parse — Bulk Draft Importer</h4>
                      <p style={{ marginBottom: 8 }}>Paste one or more questions in the format below. Separate multiple questions with <code>---</code> on its own line. All questions will be saved as <strong>drafts</strong> (invisible to students until approved).</p>
                      <pre className={styles.parseFormatExample}>{`Question: Which word has the short /a/ sound?
A. pin
B. dad
C. pot
D. mud
Correct: B
Explanation: The word "dad" has the short a sound, like the a in "bad".

---

Question: What is 5 + 7?
A. 10
B. 12
C. 14
Correct: B
Explanation: 5 plus 7 is equal to 12.

---

Question: Which sentence uses the correct punctuation?
A. Where are you going
B. Where are you going?
C. where are you going?
Correct: B
Explanation: A question must end with a question mark.`}</pre>
                    </div>

                    {/* Skill assignment fields */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1.5px solid var(--color-border)', borderRadius: 4, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, color: 'var(--color-text-main)' }}>Skill Assignment (applied to all questions)</div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.filterLabel}>Subject *</label>
                          <select
                            className={styles.formSelect}
                            value={parseBatchSubject}
                            onChange={e => {
                              setParseBatchSubject(e.target.value);
                              setParseBatchTopic('');
                              setParseBatchSkillId('');
                            }}
                          >
                            <option value="">-- Select Subject --</option>
                            {uniqueLinkSubjects.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.filterLabel}>Topic *</label>
                          <select
                            className={styles.formSelect}
                            value={parseBatchTopic}
                            disabled={!parseBatchSubject}
                            onChange={e => {
                              setParseBatchTopic(e.target.value);
                              setParseBatchSkillId('');
                            }}
                          >
                            <option value="">-- Select Topic --</option>
                            {dbSkills
                              .filter(s => s.subjectId === parseBatchSubject)
                              .map(s => s.topicId).filter(Boolean)
                              .filter((v, i, a) => a.indexOf(v) === i).sort()
                              .map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))
                            }
                          </select>
                        </div>
                        <div className={styles.formGroup} style={{ flex: 2 }}>
                          <label className={styles.filterLabel}>Skill *</label>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <input
                              type="text"
                              className={styles.formInput}
                              placeholder="Search skill by name or ID..."
                              value={skillSearchQuery}
                              onChange={e => setSkillSearchQuery(e.target.value)}
                              style={{ fontSize: 12, height: 34 }}
                            />
                            {skillSearchQuery && (
                              <button type="button" className={`${styles.btnOutline} ${styles.btnCompact}`} onClick={() => setSkillSearchQuery('')} style={{ height: 34, whiteSpace: 'nowrap' }}>Clear</button>
                            )}
                          </div>
                          <select
                            className={styles.formSelect}
                            value={parseBatchSkillId}
                            disabled={!skillSearchQuery.trim() && (!parseBatchSubject || !parseBatchTopic)}
                            onChange={e => {
                              const selectedId = e.target.value;
                              if (!selectedId) { setParseBatchSkillId(''); return; }
                              const skill = dbSkills.find(s => s.id === selectedId);
                              if (skill) {
                                setParseBatchSubject(skill.subjectId || '');
                                setParseBatchTopic(skill.topicId || '');
                                setParseBatchSkillId(skill.skillId || skill.id || '');
                                setSkillSearchQuery('');
                              }
                            }}
                          >
                            <option value="">-- Select Skill --</option>
                            {(skillSearchQuery.trim()
                              ? filteredLinkSkills
                              : dbSkills.filter(s => s.subjectId === parseBatchSubject && s.topicId === parseBatchTopic)
                            ).map((skill, index) => (
                              <option key={skill.id} value={skill.id}>
                                {index + 1}. {skill.code ? `[${skill.code}] ` : ''}{skill.title || skill.id} ({skill.skillId || skill.id})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.filterLabel}>Difficulty</label>
                          <select
                            className={styles.formSelect}
                            value={parseBatchDifficulty}
                            onChange={e => setParseBatchDifficulty(e.target.value)}
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      {/* Show resolved values once skill is selected */}
                      {parseBatchSkillId && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>✓ Subject: <strong style={{ color: 'var(--color-text-main)' }}>{parseBatchSubject}</strong></span>
                          <span>✓ Topic: <strong style={{ color: 'var(--color-text-main)' }}>{parseBatchTopic}</strong></span>
                          <span>✓ Skill ID: <strong style={{ color: 'var(--color-text-main)' }}>{parseBatchSkillId}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Paste textarea */}
                    <div className={styles.formGroup}>
                      <label className={styles.filterLabel}>Paste Questions Here</label>
                      <textarea
                        className={styles.textareaInput}
                        style={{ minHeight: 280, fontFamily: 'monospace', fontSize: 12 }}
                        value={rawTextToParse}
                        onChange={(e) => { setRawTextToParse(e.target.value); setParsedBatch([]); }}
                        placeholder={`Question: Which word has the short /a/ sound?\nA. pin\nB. dad\nC. pot\nCorrect: B\nExplanation: Dad has the short a sound.\n\n---\n\nQuestion: What is 5 + 7?\nA. 10\nB. 12\nC. 14\nCorrect: B`}
                      />
                      <small style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                        Separate multiple questions with <code>---</code> on its own line. Supported fields: <code>Question:</code>, <code>A. / B. / C. / D.</code>, <code>Correct:</code>, <code>Explanation:</code>
                      </small>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={handleParseBulk}
                        disabled={!rawTextToParse.trim()}
                      >
                        🔍 Preview Parsed Questions ({rawTextToParse.trim() ? rawTextToParse.split(/\n---+\n|\n\s*\n\s*\n/).filter(b => b.trim()).length : 0})
                      </button>

                      {parsedBatch.length > 0 && (
                        <button
                          type="button"
                          className={styles.btnSolid}
                          onClick={handleSaveParsedBulk}
                          disabled={parseBatchSaving || !parseBatchSubject || !parseBatchTopic || !parseBatchSkillId}
                        >
                          {parseBatchSaving ? 'Saving...' : `💾 Save All ${parsedBatch.length} as Drafts`}
                        </button>
                      )}

                      {parsedBatch.length > 0 && (!parseBatchSubject || !parseBatchTopic || !parseBatchSkillId) && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 10px' }}>
                          ⚠️ Fill in Subject, Topic & Skill ID above to enable saving
                        </span>
                      )}

                      {parsedBatch.length > 0 && (
                        <button
                          type="button"
                          className={styles.btnOutline}
                          style={{ marginLeft: 'auto' }}
                          onClick={() => {
                            // Load first parsed question into builder
                            const q = parsedBatch[0];
                            ignoreDirtyChange.current = true;
                            setQuestionText(q.questionText);
                            setType(q.type);
                            setExplanation(q.explanation);
                            setOptions(q.options || []);
                            if (q.correctAnswerIndex !== -1 && q.options[q.correctAnswerIndex]) {
                              setCorrectAnswer(q.options[q.correctAnswerIndex].label);
                            } else {
                              setCorrectAnswer(q.correctAnswer || '');
                            }
                            if (parseBatchSubject) setSubject(parseBatchSubject);
                            if (parseBatchTopic) setTopic(parseBatchTopic);
                            if (parseBatchSkillId) setSkillId(parseBatchSkillId);
                            setIsDirty(true);
                            setAuthoringMode('manual');
                            setAlert({ type: 'info', text: 'Loaded Q1 into builder.' });
                          }}
                        >
                          ✏️ Edit Q1 in Builder
                        </button>
                      )}
                    </div>

                    {/* Parsed Preview Table */}
                    {parsedBatch.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Parsed Questions Preview</span>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 4, padding: '2px 8px', fontSize: 10 }}>{parsedBatch.length} questions</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {parsedBatch.map((q, idx) => (
                            <div key={idx} style={{ border: '1.5px solid var(--color-border)', borderRadius: 4, padding: '10px 14px', background: 'var(--bg-primary)', fontSize: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 900, marginBottom: 4, color: 'var(--color-text-main)' }}>
                                    <span style={{ color: 'var(--color-text-muted)', marginRight: 6 }}>Q{idx + 1}</span>
                                    {q.questionText}
                                  </div>
                                  {q.options && q.options.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 4 }}>
                                      {q.options.map((opt, oi) => (
                                        <span key={oi} style={{
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          border: `1px solid ${opt.isCorrect ? '#16a34a' : 'var(--color-border)'}`,
                                          background: opt.isCorrect ? '#f0fdf4' : 'var(--bg-secondary)',
                                          color: opt.isCorrect ? '#15803d' : 'var(--color-text-muted)',
                                          fontWeight: opt.isCorrect ? 900 : 700,
                                          fontSize: 11
                                        }}>
                                          {String.fromCharCode(65 + oi)}. {opt.label}{opt.isCorrect ? ' ✓' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {q.explanation && (
                                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>💡 {q.explanation}</div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                                  <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{q.type}</span>
                                  <button
                                    type="button"
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-muted)', padding: '2px 4px' }}
                                    onClick={() => {
                                      ignoreDirtyChange.current = true;
                                      setQuestionText(q.questionText);
                                      setType(q.type);
                                      setExplanation(q.explanation);
                                      setOptions(q.options || []);
                                      if (q.correctAnswerIndex !== -1 && q.options[q.correctAnswerIndex]) {
                                        setCorrectAnswer(q.options[q.correctAnswerIndex].label);
                                      } else {
                                        setCorrectAnswer(q.correctAnswer || '');
                                      }
                                      if (parseBatchSubject) setSubject(parseBatchSubject);
                                      if (parseBatchTopic) setTopic(parseBatchTopic);
                                      if (parseBatchSkillId) setSkillId(parseBatchSkillId);
                                      setIsDirty(true);
                                      setAuthoringMode('manual');
                                    }}
                                    title="Edit this question in the builder"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    type="button"
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: '#dc2626', padding: '2px 4px' }}
                                    onClick={() => setParsedBatch(prev => prev.filter((_, i) => i !== idx))}
                                    title="Remove this question"
                                  >
                                    🗑 Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

                {/* MODE D: AI BULK GENERATOR */}
                {authoringMode === 'ai_bulk' && (
                  <div className={styles.parseWorkspaceContainer}>
                    <div className={styles.parseInstructions}>
                      <h4>⚡ Option 4: AI Bulk Question Generator (Super Fast AI Seeding)</h4>
                      <p>Generate multiple draft questions using Gemini AI for a specific skill. Drafts are saved to the database with <code>status: 'draft'</code> and remain invisible to students until approved.</p>
                    </div>

                    <div className={styles.formRow} style={{ marginTop: 16 }}>
                      <div className={styles.formGroup} style={{ flex: 2 }}>
                        <label className={styles.filterLabel}>Link to Curriculum Skill (Search by Title or ID)</label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input 
                            type="text" 
                            className={styles.formInput} 
                            placeholder="Type to filter skills..." 
                            value={skillSearchQuery}
                            onChange={(e) => setSkillSearchQuery(e.target.value)}
                            style={{ padding: '6px 10px', fontSize: 13, height: 38 }}
                          />
                          {skillSearchQuery && (
                            <button
                              type="button"
                              className={`${styles.btnOutline} ${styles.btnCompact}`}
                              onClick={() => setSkillSearchQuery('')}
                              style={{ height: 38 }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <select 
                          className={styles.formSelect}
                          value={dbSkills.find(s => s.id === skillId || s.skillId === skillId)?.id || ''}
                          disabled={!skillSearchQuery.trim() && (!selectedLinkSubject || !selectedLinkTopic)}
                          onChange={(e) => {
                            const selectedSkillId = e.target.value;
                            if (!selectedSkillId) {
                              setSkillId('');
                              return;
                            }
                            const skill = dbSkills.find(s => s.id === selectedSkillId);
                            if (skill) {
                              setSubject(skill.subjectId || '');
                              setTopic(skill.topicId || '');
                              setSkillId(skill.skillId || skill.id || '');
                              if (skill.grade) {
                                setEstimatedGrade(`Grade ${skill.grade}`);
                              }
                              logActivity(`Linked AI Seeder to skill: ${skill.title} (${skill.id})`, 'info');
                              setSkillSearchQuery(''); // clear search after linking
                            }
                          }}
                        >
                          <option value="">-- Select Skill --</option>
                          {filteredLinkSkills.map((skill, index) => (
                            <option key={skill.id} value={skill.id}>
                              {index + 1}. {skill.code ? `[${skill.code}] ` : ''}{skill.title || skill.id} ({skill.id})
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
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ marginTop: 16 }}>
                      <label className={styles.filterLabel}>Prompt Guidelines / Question Template</label>
                      <textarea
                        className={styles.textareaInput}
                        style={{ minHeight: 120 }}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="E.g., Generate questions asking to select the nouns..."
                      />
                      <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: 4 }}>
                        Describe the format or context of the questions. Overwritten with a customized template when a skill is selected.
                      </small>
                    </div>

                    <div className={styles.formGroup} style={{ marginTop: 16, maxWidth: 200 }}>
                      <label className={styles.filterLabel}>Number of Questions to Generate</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        min={1}
                        max={20}
                        value={aiCount}
                        onChange={(e) => setAiCount(parseInt(e.target.value) || 5)}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.btnSolid}
                      style={{ marginTop: 16, alignSelf: 'flex-start' }}
                      onClick={handleGenerateAiBulk}
                      disabled={generatingAi}
                    >
                      {generatingAi ? 'Generating and seeding...' : '⚡ Generate Draft Questions'}
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
                      key={authoringMockQuestion.id}
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

                  {editMode && editId && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, padding: 10, background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#64748b', textAlign: 'center' }}>Test Saved Question</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a 
                          href={`/practice?subject=${subject}&topic=${topic}&skill=${skillId}&qn=${editId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnOutline}
                          style={{ textDecoration: 'none', color: '#0ea5e9', borderColor: '#0ea5e9', fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontWeight: 700 }}
                        >
                          🎯 Test (qn)
                        </a>
                        <a 
                          href={`/practice?subject=${subject}&topic=${topic}&skill=${skillId}&id=${editId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnOutline}
                          style={{ textDecoration: 'none', color: '#8b5cf6', borderColor: '#8b5cf6', fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontWeight: 700 }}
                        >
                          🎯 Test (id)
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <details style={{
                marginTop: 20,
                background: 'var(--bg-card, #ffffff)',
                border: '1.5px solid var(--color-border-subtle, #e2e8f0)',
                borderRadius: 12,
                padding: '12px 16px',
                color: 'var(--text-primary, #0f172a)'
              }}>
                <summary style={{ fontWeight: 800, fontSize: 13, cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                  🔍 View Generated Question JSON payload
                </summary>
                <pre style={{
                  marginTop: 10,
                  maxHeight: 300,
                  overflowY: 'auto',
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--color-border-subtle, #cbd5e1)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--text-primary, #0f172a)',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {JSON.stringify(authoringMockQuestion, null, 2)}
                </pre>
              </details>

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

                {/* Tree Search and Filter controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', padding: '0 4px' }}>
                  <input
                    type="text"
                    placeholder="Search tree..."
                    value={currTreeSearch}
                    onChange={(e) => setCurrTreeSearch(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <select
                    value={currTreeSubjectFilter}
                    onChange={(e) => setCurrTreeSubjectFilter(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '120px' }}
                  >
                    <option value="all">All Subjects</option>
                    {uniqueSubjects.map(subId => (
                      <option key={subId} value={subId}>{subId}</option>
                    ))}
                  </select>
                </div>

                {filteredTree.length ? (
                  <ul className={styles.currTreeListRoot}>
                    {filteredTree.map((node) => (
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

                    {/* Subject field (for topics, chapters, skills) */}
                    {currForm.type !== 'subject' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Subject id</span>
                          <button
                            type="button"
                            onClick={() => setUseCustomSubjectId(!useCustomSubjectId)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                          >
                            {useCustomSubjectId ? 'Use Select' : 'Enter Custom'}
                          </button>
                        </div>
                        {useCustomSubjectId ? (
                          <input name="subjectId" value={currForm.subjectId} onChange={updateCurrField} placeholder="math" />
                        ) : (
                          <select name="subjectId" value={currForm.subjectId} onChange={updateCurrField}>
                            <option value="">-- Select Subject --</option>
                            {availableSubjects.map(sub => (
                              <option key={sub.id} value={sub.id}>{sub.title} ({sub.id})</option>
                            ))}
                          </select>
                        )}
                      </label>
                    )}

                    {/* Topic field (for chapters, skills) */}
                    {(currForm.type === 'chapter' || currForm.type === 'skill') && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Topic id</span>
                          <button
                            type="button"
                            onClick={() => setUseCustomTopicId(!useCustomTopicId)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                          >
                            {useCustomTopicId ? 'Use Select' : 'Enter Custom'}
                          </button>
                        </div>
                        {useCustomTopicId ? (
                          <input name="topicId" value={currForm.topicId} onChange={updateCurrField} placeholder="fractions" />
                        ) : (
                          <select name="topicId" value={currForm.topicId} onChange={updateCurrField}>
                            <option value="">-- Select Topic --</option>
                            {availableTopics.map(top => (
                              <option key={top.id} value={top.id}>{top.title || top.id} ({top.id})</option>
                            ))}
                          </select>
                        )}
                      </label>
                    )}

                    {/* Chapter field (only for skills) */}
                    {currForm.type === 'skill' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Chapter id</span>
                          <button
                            type="button"
                            onClick={() => setUseCustomChapterId(!useCustomChapterId)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                          >
                            {useCustomChapterId ? 'Use Select' : 'Enter Custom'}
                          </button>
                        </div>
                        {useCustomChapterId ? (
                          <input name="chapterId" value={currForm.chapterId} onChange={updateCurrField} placeholder="fraction-operations" />
                        ) : (
                          <select name="chapterId" value={currForm.chapterId} onChange={updateCurrField}>
                            <option value="">-- Select Chapter --</option>
                            {availableChapters.map(ch => (
                              <option key={ch.id} value={ch.id}>{ch.title || ch.id} ({ch.id})</option>
                            ))}
                          </select>
                        )}
                      </label>
                    )}

                    {/* Parent field (for topics, chapters, skills) */}
                    {currForm.type !== 'subject' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Parent id</span>
                          <button
                            type="button"
                            onClick={() => setUseCustomParentId(!useCustomParentId)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                          >
                            {useCustomParentId ? 'Use Select' : 'Enter Custom'}
                          </button>
                        </div>
                        {useCustomParentId ? (
                          <input name="parentId" value={currForm.parentId} onChange={updateCurrField} placeholder="math" />
                        ) : (
                          <select name="parentId" value={currForm.parentId} onChange={updateCurrField}>
                            <option value="">-- Select Parent --</option>
                            {parentOptions.map(p => (
                              <option key={p.id} value={p.id}>{p.title || p.id} ({p.id})</option>
                            ))}
                          </select>
                        )}
                      </label>
                    )}

                    {/* Skill id field (only for skills) */}
                    {currForm.type === 'skill' && (
                      <label>
                        Skill id
                        <input name="skillId" value={currForm.skillId} onChange={updateCurrField} placeholder="fractions-g5-add-like-fractions" />
                      </label>
                    )}

                    {/* Code field (only for skills) */}
                    {currForm.type === 'skill' && (
                      <label>
                        Code
                        <input name="code" value={currForm.code} onChange={updateCurrField} placeholder="G5.FR.1" />
                      </label>
                    )}

                    {/* Grade field (for chapters and skills) */}
                    {(currForm.type === 'chapter' || currForm.type === 'skill') && (
                      <label>
                        Grade
                        <input name="grade" value={currForm.grade} onChange={updateCurrField} inputMode="numeric" placeholder="5" />
                      </label>
                    )}

                    <label>
                      Order
                      <input name="order" value={currForm.order} onChange={updateCurrField} inputMode="numeric" placeholder="10" />
                    </label>

                    {/* Template properties (only for skills) */}
                    {currForm.type === 'skill' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Template id</span>
                          <button
                            type="button"
                            onClick={() => setUseCustomTemplateId(!useCustomTemplateId)}
                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                          >
                            {useCustomTemplateId ? 'Use Select' : 'Enter Custom'}
                          </button>
                        </div>
                        {useCustomTemplateId ? (
                          <input name="templateId" value={currForm.templateId} onChange={updateCurrField} placeholder="fractions.add.like" />
                        ) : (
                          <select name="templateId" value={currForm.templateId} onChange={handleTemplateSelectChange}>
                            <option value="">-- Select Template --</option>
                            {groupedOptions.map(group => (
                              <optgroup key={group.label} label={group.label}>
                                {group.templates.map(tpl => (
                                  <option key={tpl.id} value={tpl.id}>
                                    {tpl.title} ({tpl.id})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </label>
                    )}
                    {currForm.type === 'skill' && (
                      <label>
                        Engine
                        <input name="engine" value={currForm.engine} onChange={updateCurrField} placeholder="fractions" />
                      </label>
                    )}
                    {currForm.type === 'skill' && (
                      <label>
                        Question type
                        <input name="questionType" value={currForm.questionType} onChange={updateCurrField} placeholder="fillInTheBlank" />
                      </label>
                    )}

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

                  {currForm.type === 'skill' && (
                    <>
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
                    </>
                  )}

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
                setImageBuster(Date.now());
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
              }, cropTarget.file.type || 'image/jpeg', 0.82);
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
                                src={getBustedUrl(img.url)}
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
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    className={styles.btnOutline}
                                    style={{
                                      flex: 1, fontSize: 10, padding: '6px 0', height: 30,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                      borderColor: 'var(--color-primary)', color: 'var(--color-primary)',
                                      background: 'rgba(59, 130, 246, 0.04)'
                                    }}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      startEditMetadata(img);
                                    }}
                                  >
                                    ✏️ Edit Metadata
                                  </button>
                                  <button
                                    className={styles.btnOutline}
                                    style={{
                                      flex: 1, fontSize: 10, padding: '6px 0', height: 30,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                      borderColor: '#10b981', color: '#10b981',
                                      background: 'rgba(16, 185, 129, 0.04)'
                                    }}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      startGalleryCropper(img);
                                    }}
                                  >
                                    ✂️ Crop Image
                                  </button>
                                </div>
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

                  {/* ── Image Cropper Modal ── */}
                  {galleryCroppingImg && (
                    <GalleryImageCropper
                      img={galleryCroppingImg}
                      styles={styles}
                      onCancel={() => setGalleryCroppingImg(null)}
                      onSave={() => {
                        setGalleryCroppingImg(null);
                        setImageBuster(Date.now());
                        fetchGalleryImages();
                      }}
                    />
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
                  JPEG · PNG · WebP · SVG · GIF · AVIF &nbsp;|&nbsp; Max 10 MB per file &nbsp;|&nbsp; Unlimited files
                </div>
                <input
                  ref={imgFileInputRef}
                  type="file"
                  accept="image/*,image/svg+xml"
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

                  {/* Manual Search & Link Section */}
                  <div className={styles.borderedPanel} style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>🔍</span>
                      <h3 className={styles.panelTitle} style={{ margin: 0 }}>Manual Web Search & Import</h3>
                    </div>
                    <p style={{ margin: '0 0 20px 0', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      Type any English vocabulary word (even if it's not in the missing list) to search the web for clean cliparts, import them directly to R2 storage, and automatically update <code>vocabulary.json</code>.
                    </p>
                    <div style={{ display: 'flex', gap: 12, maxWidth: 500 }}>
                      <input
                        type="text"
                        placeholder="Enter word to search (e.g. monkey, kite)..."
                        id="manualSearchWordInput"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1.5px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 13,
                          outline: 'none',
                          background: 'var(--bg-secondary)',
                          color: 'var(--color-text-main)',
                          transition: 'border-color 0.2s',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim().toLowerCase();
                            if (val) {
                              setSearchWordTarget(val);
                              setSearchQuery(val);
                              setSearchModalOpen(true);
                              handleWebImageSearch(val);
                            }
                          }
                        }}
                      />
                      <button
                        className={styles.btnSolid}
                        style={{
                          background: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: 'white',
                          fontWeight: 'bold',
                          padding: '10px 20px',
                          fontSize: 13,
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => {
                          const input = document.getElementById('manualSearchWordInput');
                          const val = input ? input.value.trim().toLowerCase() : '';
                          if (val) {
                            setSearchWordTarget(val);
                            setSearchQuery(val);
                            setSearchModalOpen(true);
                            handleWebImageSearch(val);
                          } else {
                            alert('Please enter a vocabulary word to search.');
                          }
                        }}
                      >
                        Search Clipart
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
                      borderBottom: '1.5px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      background: 'var(--bg-primary)',
                    }}>
                      <div style={{ display: 'flex', gap: 12 }}>
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
                          disabled={searchLoading || !!importingSearchStatus}
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

                      {/* Action buttons inside the search query card/bar */}
                      {searchResults.length > 0 && !searchLoading && !importingSearchStatus && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                          paddingTop: 8,
                          borderTop: '1px solid var(--color-border)',
                        }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={handleSelectAllSearchImages}
                              className={styles.btnOutline}
                              style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              ☑ Select All
                            </button>
                            <button
                              onClick={handleClearSearchImages}
                              className={styles.btnOutline}
                              style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              ☒ Clear Selection
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              {selectedSearchImages.length} of {searchResults.length} selected
                            </span>
                            <button
                              onClick={importSelectedSearchImages}
                              disabled={selectedSearchImages.length === 0}
                              className={styles.btnSolid}
                              style={{
                                background: selectedSearchImages.length > 0 ? 'var(--color-success)' : '#e2e8f0',
                                borderColor: selectedSearchImages.length > 0 ? 'var(--color-success)' : '#e2e8f0',
                                color: selectedSearchImages.length > 0 ? 'white' : '#94a3b8',
                                cursor: selectedSearchImages.length > 0 ? 'pointer' : 'not-allowed',
                                padding: '6px 14px',
                                fontSize: 11,
                                fontWeight: 'bold',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              ⚡ Import Selected ({selectedSearchImages.length})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Results Container */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 24,
                      background: 'var(--bg-primary)',
                    }}>
                      {importingSearchStatus && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '60px 0',
                          gap: 16
                        }}>
                          <span className={styles.spinner} style={{ width: 40, height: 40, border: '3px solid rgba(139, 92, 246, 0.1)', borderTopColor: 'var(--color-primary)' }}></span>
                          <div style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 'bold' }}>{importingSearchStatus}</div>
                        </div>
                      )}

                      {!importingSearchStatus && searchLoading && (
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

                      {!importingSearchStatus && searchError && (
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

                      {!importingSearchStatus && !searchLoading && !searchError && searchResults.length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '60px 0',
                          color: 'var(--color-text-muted)',
                          fontSize: 13
                        }}>
                          No cliparts found. Try refining your query above (e.g. search "butterfly net" instead of "net").
                        </div>
                      )}

                      {!importingSearchStatus && !searchLoading && !searchError && searchResults.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 20
                        }}>
                          {searchResults.map((item, index) => {
                            const isSelected = selectedSearchImages.includes(item.image);
                            const isThisImporting = importingSearchUrl === item.image;
                            return (
                              <div
                                key={index}
                                style={{
                                  position: 'relative',
                                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                  borderRadius: 12,
                                  overflow: 'hidden',
                                  background: 'var(--bg-secondary)',
                                  cursor: (importingSearchUrl || importingSearchStatus) ? 'not-allowed' : 'pointer',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                }}
                                onClick={() => {
                                  if (!importingSearchUrl && !importingSearchStatus) {
                                    toggleSearchImageSelection(item.image);
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (!importingSearchUrl && !importingSearchStatus) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                {/* Checkbox Overlay */}
                                <div style={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  zIndex: 5,
                                  background: isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.9)',
                                  border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                                  borderRadius: 4,
                                  width: 20,
                                  height: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: 12,
                                  fontWeight: 'bold',
                                  pointerEvents: 'none',
                                }}>
                                  {isSelected && '✓'}
                                </div>

                                {/* Preview Button Overlay */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewSearchImageUrl(item);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 5,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 6,
                                    width: 28,
                                    height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    transition: 'all 0.2s',
                                  }}
                                  title="Preview large image"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                >
                                  🔍
                                </button>

                                {/* Image Container */}
                                <div 
                                  style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    padding: 12,
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    borderBottom: '1px solid var(--color-border)',
                                  }}
                                >
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

              {/* ── Web Clipart Preview Overlay ── */}
              {previewSearchImageUrl && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10000,
                  padding: 24,
                }}
                onClick={() => setPreviewSearchImageUrl(null)}
                >
                  <div style={{
                    position: 'relative',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border)',
                    padding: 20,
                    borderRadius: 16,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    width: 'min(550px, 95vw)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16
                  }}
                  onClick={e => e.stopPropagation()}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setPreviewSearchImageUrl(null)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        border: 'none',
                        background: 'rgba(15, 23, 42, 0.1)',
                        color: 'var(--color-text-main)',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        fontSize: 16,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.1)'}
                    >
                      ✕
                    </button>

                    {/* Large Image */}
                    <div style={{
                      width: '100%',
                      height: 'min(450px, 55vh)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'white',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                      padding: 8
                    }}>
                      <img
                        src={previewSearchImageUrl.image}
                        alt={previewSearchImageUrl.title}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27 width%3D%2724%27 height%3D%2724%27 viewBox%3D%270 0 24 24%27 fill%3D%27none%27 stroke%3D%27%23cbd5e1%27 stroke-width%3D%272%27 stroke-linecap%3D%27round%27 stroke-linejoin%3D%27round%27%3E%3Crect x%3D%273%27 y%3D%273%27 width%3D%2718%27 height%3D%2718%27 rx%3D%272%27 ry%3D%272%27%2F%3E%3Ccircle cx%3D%278.5%27 cy%3D%278.5%27 r%3D%271.5%27%2F%3E%3Cpolyline points%3D%2721 15 16 10 5 21%27%2F%3E%3C%2Fsvg%3E';
                        }}
                      />
                    </div>

                    {/* Image Details */}
                    <div style={{ width: '100%', textAlig: 'center' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 'bold', color: 'var(--color-text-main)', textAlign: 'center' }}>
                        {previewSearchImageUrl.title || 'Clipart Preview'}
                      </h4>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'center', gap: 16 }}>
                        <span>Resolution: <strong>{previewSearchImageUrl.width} x {previewSearchImageUrl.height}</strong></span>
                        <a
                          href={previewSearchImageUrl.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}
                        >
                          source website
                        </a>
                      </div>
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

    {createPoolModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create centralized option pool"
        onClick={event => { if (event.target === event.currentTarget) setCreatePoolModalOpen(false); }}
        style={{ position: 'fixed', inset: 0, zIndex: 8900, background: 'rgba(15,23,42,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <div style={{ width: 'min(560px, 94vw)', background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Create Centralized Option Pool</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, lineHeight: 1.5, color: '#64748b' }}>
            Create reusable option categories. After creation, add labels, images, audio, and review metadata in the Option Pool Library.
          </p>

          <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 700, color: '#334155' }}>Pool ID</label>
          <input
            className={styles.formInput}
            value={newPoolId}
            onChange={event => setNewPoolId(event.target.value)}
            placeholder="science-states-of-matter-v1"
            style={{ width: '100%', margin: 0 }}
          />
          <div style={{ marginTop: 5, fontSize: 11, color: '#64748b' }}>Use a stable, unique ID. Existing pools cannot be overwritten here.</div>

          <label style={{ display: 'block', margin: '16px 0 5px', fontSize: 12, fontWeight: 700, color: '#334155' }}>Categories</label>
          <textarea
            className={styles.formInput}
            value={newPoolCategories}
            onChange={event => setNewPoolCategories(event.target.value)}
            placeholder="solids, liquids, gases"
            rows={4}
            style={{ width: '100%', margin: 0, resize: 'vertical' }}
          />
          <div style={{ marginTop: 5, fontSize: 11, color: '#64748b' }}>Separate categories with commas or new lines. The first category becomes the initial correct-answer pool.</div>

          {createPoolStatus && (
            <p style={{ margin: '14px 0 0', padding: '8px 10px', borderRadius: 7, background: '#fff7ed', color: '#9a3412', fontSize: 12 }}>
              {createPoolStatus}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <button type="button" className={styles.btnOutline} onClick={() => setCreatePoolModalOpen(false)} disabled={createPoolSaving}>Cancel</button>
            <button type="button" className={styles.btnSolid} onClick={createCentralizedPool} disabled={createPoolSaving}>
              {createPoolSaving ? 'Creating…' : 'Create Pool'}
            </button>
          </div>
        </div>
      </div>
    )}

    {poolManagerModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manage option pool"
        onClick={event => { if (event.target === event.currentTarget) setPoolManagerModalOpen(false); }}
        style={{ position: 'fixed', inset: 0, zIndex: 8800, background: 'rgba(15,23,42,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <div style={{ width: 'min(1180px, 96vw)', height: 'min(88vh, 850px)', background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>Option Pool Library</h3>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{poolId}</div>
            </div>
            <input
              type="search"
              value={poolManagerSearch}
              onChange={event => setPoolManagerSearch(event.target.value)}
              placeholder="Search label or ID"
              style={{ width: 180, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8 }}
            />
            <select className={styles.formSelect} value={poolWordCategory} onChange={event => setPoolWordCategory(event.target.value)} style={{ width: 150, margin: 0 }}>
              {Object.keys(poolWordManagerData?.pools || {}).map(category => (
                <option key={category} value={category}>{category} ({poolWordManagerData.pools[category]?.length || 0})</option>
              ))}
            </select>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={generateMissingAudiosForCategory}
              disabled={!poolWordManagerData || poolWordManagerSaving}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              🎙️ Generate Missing Audios
            </button>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={generateMissingImagesForCategory}
              disabled={!poolWordManagerData || poolWordManagerSaving}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              🖼️ Generate Missing Images
            </button>
            <button type="button" className={styles.btnOutline} onClick={savePoolManagerChanges} disabled={!poolWordManagerData || poolWordManagerSaving}>
              {poolWordManagerSaving ? 'Saving…' : 'Save Pool Changes'}
            </button>
            <button type="button" className={styles.btnOutline} onClick={() => setPoolManagerModalOpen(false)}>Close</button>
          </div>

          <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '170px 1fr auto', gap: 8, alignItems: 'center', background: '#f8fafc' }}>
            <select className={styles.formSelect} value={poolWordCategory} onChange={event => setPoolWordCategory(event.target.value)} style={{ margin: 0 }}>
              {Object.keys(poolWordManagerData?.pools || {}).map(category => <option key={category} value={category}>Add to {category}</option>)}
            </select>
            <input className={styles.formInput} value={poolWordInput} onChange={event => setPoolWordInput(event.target.value)} placeholder="Add words separated by commas or new lines" />
            <button type="button" className={styles.btnOutline} onClick={addWordsToCentralizedPool} disabled={!poolWordInput.trim() || poolWordManagerSaving}>Add Words</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f8fafc' }}>
            {!poolWordManagerData ? (
              <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>{poolWordManagerStatus || 'Loading pool…'}</div>
            ) : (
              (() => {
                const query = poolManagerSearch.trim().toLowerCase();
                const matchingItems = (poolWordManagerData.pools?.[poolWordCategory] || [])
                  .map((item, index) => ({ item, index }))
                  .filter(({ item }) => (
                    !query
                    || String(item.label || '').toLowerCase().includes(query)
                    || String(item.id || '').toLowerCase().includes(query)
                  ));

                if (matchingItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>
                      No pool items match “{poolManagerSearch}”.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))', gap: 12 }}>
                    {matchingItems.map(({ item, index }) => {
                      const audioId = `pool_${poolWordCategory}_${index}`;
                      const itemKey = `${item.id || 'pool_item'}_${index}`;
                      const isEditing = editingPoolItemKey === `${poolWordCategory}:${index}`;
                      return (
                        <div key={itemKey} style={{
                          background: '#fff',
                          border: isEditing ? '2px solid var(--color-primary, #3b82f6)' : '1px solid #dbeafe',
                          borderRadius: 10,
                          padding: 10,
                          display: 'grid',
                          gridTemplateRows: isEditing ? '120px auto' : '120px auto auto',
                          gap: 8,
                          position: 'relative',
                          boxShadow: isEditing ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
                          transition: 'all 0.2s ease-in-out'
                        }}>
                      <div style={{ background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.label || ''} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>No image</span>
                        )}
                        <button type="button" onClick={() => openImgPickerForPoolItem(poolWordCategory, index)} style={{ position: 'absolute', right: 6, bottom: 6, border: '1px solid #cbd5e1', borderRadius: 7, background: '#fff', padding: '4px 7px', cursor: 'pointer', fontSize: 11 }}>
                          🔍 Image Search
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPoolItemKey(isEditing ? null : `${poolWordCategory}:${index}`)}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: isEditing ? 'var(--color-primary, #3b82f6)' : 'rgba(255,255,255,0.95)',
                            color: isEditing ? '#fff' : '#475569',
                            border: 'none',
                            borderRadius: '50%',
                            width: 26,
                            height: 26,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 12,
                            zIndex: 10,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            padding: 0
                          }}
                          title={isEditing ? "Close detailed editor" : "Edit all fields"}
                        >
                          ✏️
                        </button>
                      </div>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" className={styles.btnOutline} onClick={() => handlePlayUrlAudio(audioId, item.audioUrl)} disabled={!item.audioUrl} style={{ flex: 1, padding: '5px 7px', fontSize: 11 }}>
                              {item.audioUrl ? (playingAudioId === audioId ? 'Stop' : 'Play') : 'No Audio'}
                            </button>
                            <button type="button" className={styles.btnOutline} onClick={() => generatePoolItemAudio(poolWordCategory, index, item)} disabled={poolManagerGeneratingId === `${poolWordCategory}:${index}`} style={{ flex: 1, padding: '5px 7px', fontSize: 11 }}>
                              {poolManagerGeneratingId === `${poolWordCategory}:${index}` ? 'Gen…' : 'Gen Audio'}
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}>
                            <div>
                              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 2 }}>Item ID</label>
                              <input
                                type="text"
                                className={styles.formInput}
                                value={item.id || ''}
                                onChange={e => updatePoolManagerItem(poolWordCategory, index, { id: e.target.value })}
                                style={{ padding: '4px 8px', fontSize: 11, width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 2 }}>Label</label>
                              <input
                                type="text"
                                className={styles.formInput}
                                value={item.label || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  updatePoolManagerItem(poolWordCategory, index, { 
                                    label: val,
                                    ...(item.text !== undefined ? { text: val } : {})
                                  });
                                }}
                                style={{ padding: '4px 8px', fontSize: 11, width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                            {(item.text !== undefined || poolWordCategory.toLowerCase().includes('sentence') || poolWordCategory.toLowerCase().includes('grammar')) && (
                              <div>
                                <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 2 }}>Sentence Text</label>
                                <input
                                  type="text"
                                  className={styles.formInput}
                                  value={item.text || ''}
                                  onChange={e => updatePoolManagerItem(poolWordCategory, index, { text: e.target.value })}
                                  style={{ padding: '4px 8px', fontSize: 11, width: '100%', boxSizing: 'border-box' }}
                                />
                              </div>
                            )}
                            <div>
                              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 2 }}>Image URL</label>
                              <input
                                type="text"
                                className={styles.formInput}
                                value={item.imageUrl || ''}
                                onChange={e => updatePoolManagerItem(poolWordCategory, index, { imageUrl: e.target.value })}
                                style={{ padding: '4px 8px', fontSize: 11, width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontWeight: 600, color: '#475569', marginBottom: 2 }}>Audio URL</label>
                              <input
                                type="text"
                                className={styles.formInput}
                                value={item.audioUrl || ''}
                                onChange={e => updatePoolManagerItem(poolWordCategory, index, { audioUrl: e.target.value })}
                                style={{ padding: '4px 8px', fontSize: 11, width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div style={{ marginTop: 4, padding: 6, background: '#fff', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4, fontSize: 10 }}>POS Tags (comma separated)</div>
                              {[
                                { label: 'Nouns', field: 'nouns' },
                                { label: 'Verbs', field: 'verbs' },
                                { label: 'Adjectives', field: 'adjectives' },
                                { label: 'Adverbs', field: 'adverbs' },
                                { label: 'Prepositions', field: 'prepositions' },
                                { label: 'Pronouns', field: 'pronouns' },
                                { label: 'Conjunctions', field: 'conjunctions' },
                                { label: 'Articles', field: 'articles' }
                              ].map(pos => (
                                <div key={pos.field} style={{ marginBottom: 4 }}>
                                  <label style={{ display: 'block', fontSize: 9, fontWeight: 600, color: '#64748b', marginBottom: 1 }}>{pos.label}</label>
                                  <input
                                    type="text"
                                    className={styles.formInput}
                                    value={Array.isArray(item[pos.field]) ? item[pos.field].join(', ') : (item[pos.field] || '')}
                                    onChange={e => {
                                      const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                      updatePoolManagerItem(poolWordCategory, index, { [pos.field]: arr });
                                    }}
                                    placeholder="e.g. dog, cat"
                                    style={{ padding: '3px 6px', fontSize: 10, width: '100%', boxSizing: 'border-box' }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <input
                              className={styles.formInput}
                              value={item.label || ''}
                              onChange={event => updatePoolManagerItem(poolWordCategory, index, { label: event.target.value })}
                              placeholder="Label"
                              style={{ width: '100%' }}
                            />
                            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.id}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" className={styles.btnOutline} onClick={() => handlePlayUrlAudio(audioId, item.audioUrl)} disabled={!item.audioUrl} style={{ flex: 1, padding: '5px 7px' }}>
                              {item.audioUrl ? (playingAudioId === audioId ? 'Stop Audio' : 'Play Audio') : 'No Audio'}
                            </button>
                            <button type="button" className={styles.btnOutline} onClick={() => generatePoolItemAudio(poolWordCategory, index, item)} disabled={poolManagerGeneratingId === `${poolWordCategory}:${index}`} style={{ flex: 1, padding: '5px 7px' }}>
                              {poolManagerGeneratingId === `${poolWordCategory}:${index}` ? 'Generating…' : item.audioUrl ? 'Make New Audio' : 'Create Audio'}
                            </button>
                          </div>
                        </>
                      )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', fontSize: 11, color: poolWordManagerStatus === 'Pool changes saved.' ? '#047857' : '#64748b' }}>
            {poolWordManagerStatus || 'Review labels, images, and audio. Save changes when finished.'}
          </div>
        </div>
      </div>
    )}

    {/* ═══════════════════════════════════════════════════════════
        IMAGE PICKER MODAL
        Opens when user clicks Upload or Gallery on an image part
    ═══════════════════════════════════════════════════════════ */}
    {imgPickerOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pick an image"
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={e => { if (e.target === e.currentTarget) closeImgPicker(); }}
      >
        <div style={{
          background: '#fff', borderRadius: 16, width: 'min(92vw, 860px)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}>
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🖼</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Pick an Image</span>
            </div>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[['gallery','🗂 Gallery'], ['upload','⬆ Upload'], ['web','🔍 Web Search']].map(([t,label]) => (
                <button key={t} type="button"
                  onClick={() => setImgPickerTab(t)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12,
                    background: imgPickerTab === t ? '#6366f1' : '#f1f5f9',
                    color: imgPickerTab === t ? '#fff' : '#475569',
                    transition: 'all .15s',
                  }}
                >{label}</button>
              ))}
            </div>
            <button type="button" onClick={closeImgPicker}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', lineHeight: 1, padding: 4 }}
              aria-label="Close"
            >✕</button>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

            {/* ────── GALLERY TAB ────── */}
            {imgPickerTab === 'gallery' && (
              <>
                {/* Search + folder */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by filename…"
                    value={imgPickerSearch}
                    onChange={e => setImgPickerSearch(e.target.value)}
                    style={{
                      flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Folder prefix (e.g. images)"
                    value={imgPickerFolder}
                    onChange={e => setImgPickerFolder(e.target.value)}
                    style={{
                      width: 180, padding: '8px 12px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                  <button type="button"
                    onClick={() => fetchImgPickerGallery(imgPickerFolder)}
                    disabled={imgPickerLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: '#0ea5e9', color: '#fff', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >{imgPickerLoading ? '⏳ Loading…' : '🔍 Browse'}</button>
                </div>

                {imgPickerError && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>⚠ {imgPickerError}</div>
                )}

                {/* Grid */}
                {(() => {
                  const q = imgPickerSearch.trim().toLowerCase();
                  const filtered = q
                    ? imgPickerImages.filter(img => img.key?.toLowerCase().includes(q) || img.url?.toLowerCase().includes(q))
                    : imgPickerImages;
                  if (imgPickerLoading) return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading images…</div>;
                  if (filtered.length === 0) return (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
                      <div style={{ fontSize: 13 }}>{imgPickerImages.length === 0 ? 'Click Browse to load images' : 'No images match your search'}</div>
                    </div>
                  );
                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: 10,
                    }}>
                       {filtered.map(img => (
                        <div
                          key={img.key}
                          title={img.key}
                          onClick={() => handleImgPickerSelect(img.url)}
                          style={{
                            background: '#f8fafc', border: '2px solid #e2e8f0',
                            borderRadius: 10, padding: 6, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            transition: 'border-color .15s, transform .12s',
                            minHeight: 100,
                            position: 'relative',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          <img
                            src={img.url}
                            alt={img.key}
                            style={{ width: '100%', height: 72, objectFit: 'contain', borderRadius: 6 }}
                            loading="lazy"
                            onError={e => { e.target.style.opacity = '.3'; }}
                          />
                          <span style={{
                            fontSize: 9, color: '#475569', wordBreak: 'break-all',
                            textAlign: 'center', lineHeight: 1.3, maxWidth: '100%',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{img.key?.split('/').pop()}</span>
                          
                          {/* Preview button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImgPreviewUrl(img.url);
                            }}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              width: 22, height: 22, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.85)', border: '1px solid #cbd5e1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', fontSize: 11, boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'all 0.15s',
                              color: '#475569',
                            }}
                            title="Preview image"
                            onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#6366f1'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            👁️
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}

            {/* ────── UPLOAD TAB ────── */}
            {imgPickerTab === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Folder target */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Upload to folder:</label>
                  <input
                    type="text"
                    value={imgPickerFolder}
                    onChange={e => setImgPickerFolder(e.target.value)}
                    placeholder="e.g. images/science"
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => imgPickerFileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#eef2ff'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = '#f8fafc'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#c7d2fe';
                    e.currentTarget.style.background = '#f8fafc';
                    const files = Array.from(e.dataTransfer.files || []);
                    if (files.length > 0) handleImgPickerUploads(files);
                  }}
                  style={{
                    border: '2.5px dashed #c7d2fe', borderRadius: 14,
                    background: '#f8fafc', padding: '48px 24px',
                    textAlign: 'center', cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {imgPickerUploading ? (
                    <div style={{ color: '#6366f1', fontWeight: 700, fontSize: 14 }}>⏳ Uploading…</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>📤</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#334155' }}>Click to browse or drag & drop (multiple allowed)</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>PNG, JPG, WebP, GIF, SVG</div>
                    </>
                  )}
                </div>
                <input
                  ref={imgPickerFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) handleImgPickerUploads(files);
                    e.target.value = '';
                  }}
                />
                {imgPickerError && (
                  <div style={{ color: '#ef4444', fontSize: 12 }}>⚠ {imgPickerError}</div>
                )}
              </div>
            )}

            {/* ────── WEB SEARCH TAB ────── */}
            {imgPickerTab === 'web' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Search Bar */}
                <form 
                  onSubmit={e => { e.preventDefault(); handleWebSearch(); }}
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    placeholder="Search DuckDuckGo (e.g. red apple)…"
                    value={webSearchQuery}
                    onChange={e => setWebSearchQuery(e.target.value)}
                    style={{
                      flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                  <select
                    value={webSearchType}
                    onChange={e => setWebSearchType(e.target.value)}
                    style={{
                      width: 120, padding: '8px 12px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                      background: '#fff', cursor: 'pointer'
                    }}
                  >
                    <option value="clipart">🎨 Clipart</option>
                    <option value="photo">📷 Photo</option>
                    <option value="any">🌐 Any</option>
                  </select>
                  <button 
                    type="submit"
                    disabled={webSearchLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    {webSearchLoading ? '⏳ Searching…' : '🔍 Search'}
                  </button>
                </form>

                {imgPickerError && (
                  <div style={{ color: '#ef4444', fontSize: 12, margin: '4px 0' }}>⚠ {imgPickerError}</div>
                )}

                {/* Search Results Grid */}
                {(() => {
                  if (webSearchLoading) return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Searching Web Images (via DuckDuckGo)…</div>;
                  if (webSearchResults.length === 0) return (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🌐</div>
                      <div style={{ fontSize: 13 }}>Enter a keyword and click Search to query DuckDuckGo</div>
                    </div>
                  );
                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: 12,
                      maxHeight: '40vh',
                      overflowY: 'auto',
                      padding: '4px'
                    }}>
                      {webSearchResults.map((item, idx) => {
                        const isDownloading = webSearchSelectedUrl === item.image;
                        return (
                          <div
                            key={idx}
                            title={item.title}
                            onClick={() => {
                              if (!webSearchSelectedUrl) handleWebSearchSelect(item);
                            }}
                            style={{
                              background: '#f8fafc', border: '2px solid #e2e8f0',
                              borderRadius: 10, padding: 6, cursor: isDownloading ? 'wait' : (webSearchSelectedUrl ? 'not-allowed' : 'pointer'),
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                              transition: 'border-color .15s, transform .12s',
                              minHeight: 110,
                              position: 'relative',
                              opacity: (!!webSearchSelectedUrl && !isDownloading) ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!webSearchSelectedUrl) { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'scale(1.04)'; } }}
                            onMouseLeave={e => { if (!webSearchSelectedUrl) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; } }}
                          >
                            <img
                              src={item.thumbnail || item.image}
                              alt=""
                              style={{ width: '100%', height: 80, objectFit: 'contain', borderRadius: 6 }}
                              loading="lazy"
                              onError={e => { e.target.style.opacity = '.3'; }}
                            />
                            <span style={{
                              fontSize: 9, color: '#475569', wordBreak: 'break-all',
                              textAlign: 'center', lineHeight: 1.3, maxWidth: '100%',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{item.source || 'Web Image'}</span>
                            
                            {/* Preview button */}
                            {!isDownloading && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImgPreviewUrl(item.image);
                                }}
                                style={{
                                  position: 'absolute', top: 4, right: 4,
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.85)', border: '1px solid #cbd5e1',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', fontSize: 11, boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  transition: 'all 0.15s',
                                  color: '#475569',
                                }}
                                title="Preview image"
                                onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#6366f1'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                              >
                                👁️
                              </button>
                            )}

                            {isDownloading && (
                              <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
                                borderRadius: 8, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 4
                              }}>
                                <span style={{ fontSize: 16 }}>⏳</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>Saving…</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0, background: '#f8fafc',
          }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {imgPickerTab === 'gallery'
                ? `${imgPickerImages.length} images in folder`
                : imgPickerTab === 'web'
                  ? 'Selected image will be downloaded, saved to R2, and inserted'
                  : 'Image will be uploaded to R2 and auto-inserted'}
            </span>
            <button type="button" onClick={closeImgPicker}
              style={{
                padding: '8px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        </div>
      </div>
    )}
    {imgPreviewUrl && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image Preview"
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}
        onClick={() => setImgPreviewUrl(null)}
      >
        <div 
          style={{
            position: 'relative',
            background: '#fff', borderRadius: 12, padding: 10,
            maxWidth: '90vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <img 
            src={imgPreviewUrl} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '75vh', 
              objectFit: 'contain', 
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }} 
          />
          <div style={{ 
            marginTop: 10, 
            display: 'flex', 
            justifyContent: 'space-between', 
            width: '100%', 
            alignItems: 'center',
            gap: 20
          }}>
            <span style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all', flex: 1 }}>{imgPreviewUrl}</span>
            <button
              type="button"
              onClick={() => setImgPreviewUrl(null)}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none',
                background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ═══════════════════════════════════════════════════════════
        R2 AUDIO GALLERY MODAL
        Opens when user clicks "Browse R2" on an audio part
    ═══════════════════════════════════════════════════════════ */}
    {showAudioGallery && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pick an audio file"
        style={{
          position: 'fixed', inset: 0, zIndex: 9100,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={e => { if (e.target === e.currentTarget) { setShowAudioGallery(false); setAudioGalleryPartIdx(null); setAudioGalleryOptionIdx(null); setAudioGalleryForMainText(false); } }}
      >
        <div style={{
          background: '#fff', borderRadius: 16, width: 'min(92vw, 740px)',
          maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🎵</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>R2 Audio Gallery</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Browse and attach audio files from Cloudflare R2 storage</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setShowAudioGallery(false); setAudioGalleryPartIdx(null); setAudioGalleryOptionIdx(null); setAudioGalleryForMainText(false); }}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
            >×</button>
          </div>

          {/* Search + Folder Filter + Refresh */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={r2AudioSearch}
                onChange={e => {
                  setR2AudioSearch(e.target.value);
                  if (e.target.value.trim() !== '') {
                    setR2AudioFolderFilter('');
                  }
                }}
                placeholder="Search filename across ALL folders (e.g. aa, short_a, phonics)..."
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={fetchR2AudioFiles}
                disabled={r2AudioLoading}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1.5px solid #7c3aed',
                  background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {r2AudioLoading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>
            {/* Folder filter pills */}
            {r2AudioFiles.length > 0 && (() => {
              const folders = ['', ...Array.from(new Set(r2AudioFiles.map(f => f.folder || ''))).sort()];
              return (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {folders.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setR2AudioFolderFilter(f)}
                      style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                        border: `1.5px solid ${r2AudioFolderFilter === f ? '#7c3aed' : '#e2e8f0'}`,
                        background: r2AudioFolderFilter === f ? '#7c3aed' : '#f8fafc',
                        color: r2AudioFolderFilter === f ? '#fff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {f === '' ? '📂 All Folders' : `📁 ${f}`}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
            {r2AudioLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#7c3aed', fontWeight: 700 }}>Loading audio files from R2...</div>
            )}
            {!r2AudioLoading && r2AudioFiles.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
                No audio files found in R2 storage.<br/>
                <span style={{ fontSize: 11 }}>Upload .wav/.mp3 files to your R2 bucket under the <code>audio/</code> prefix.</span>
              </div>
            )}
            {!r2AudioLoading && (() => {
              const q = r2AudioSearch.toLowerCase().trim();
              const filtered = r2AudioFiles.filter(f => {
                // folder filter
                if (r2AudioFolderFilter !== '' && (f.folder || '') !== r2AudioFolderFilter) return false;
                // text search — matches anywhere in the full key path
                if (q && !f.key.toLowerCase().includes(q)) return false;
                return true;
              });
              if (filtered.length === 0) {
                return <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
                  {q || r2AudioFolderFilter ? `No files matching your filter.` : 'No audio files found.'}
                </div>;
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filtered.map((file, fi) => {
                    const fileName = file.key.split('/').pop();
                    const isPreviewing = r2AudioPreview === file.url;
                    const isSelected = (audioGalleryPartIdx !== null && parts[audioGalleryPartIdx]?.audioUrl === file.url) ||
                      (audioGalleryOptionIdx !== null && options[audioGalleryOptionIdx]?.audioUrl === file.url) ||
                      (audioGalleryForMainText && audioUrl === file.url);
                    return (
                      <div
                        key={fi}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 8,
                          border: `1.5px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`,
                          background: isSelected ? '#f5f3ff' : '#fafafa',
                          transition: 'all 0.1s',
                        }}
                      >
                        {/* Play/stop toggle */}
                        <button
                          type="button"
                          onClick={() => setR2AudioPreview(isPreviewing ? null : file.url)}
                          style={{
                            flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                            border: '1.5px solid #7c3aed', background: isPreviewing ? '#7c3aed' : '#f5f3ff',
                            color: isPreviewing ? '#fff' : '#7c3aed',
                            fontSize: 14, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                          title={isPreviewing ? 'Stop preview' : 'Preview audio'}
                        >
                          {isPreviewing ? '⏹' : '▶'}
                        </button>

                        {/* File info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {fileName}
                            </span>
                            {file.folder && (
                              <span style={{
                                fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                                background: '#ede9fe', color: '#6d28d9',
                                border: '1px solid #c4b5fd', borderRadius: 4,
                                padding: '1px 5px', flexShrink: 0,
                              }}>
                                {file.folder}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.key}
                          </div>
                          {isPreviewing && (
                            <audio
                              autoPlay
                              src={file.url}
                              onEnded={() => setR2AudioPreview(null)}
                              style={{ marginTop: 6, height: 28, width: '100%' }}
                              controls
                            />
                          )}
                        </div>

                        {/* Size */}
                        <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                        </span>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Are you sure you want to permanently delete "${fileName}" from Cloudflare R2? This cannot be undone.`)) {
                              return;
                            }
                            try {
                              const res = await fetch('/api/admin/delete-audio', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ keys: [file.key] })
                              });
                              const data = await res.json();
                              if (data.success) {
                                setAlert({ type: 'success', text: 'Audio file deleted from R2 successfully.' });
                                fetchR2AudioFiles();
                              } else {
                                throw new Error(data.error || 'Failed to delete audio file.');
                              }
                            } catch (err) {
                              setAlert({ type: 'error', text: err.message });
                            }
                          }}
                          style={{
                            flexShrink: 0, padding: '6px 10px', borderRadius: 8,
                            border: '1.5px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            marginRight: 6
                          }}
                          title="Delete from Cloudflare R2 bucket permanently"
                        >
                          🗑️
                        </button>

                        {/* Select button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (audioGalleryPartIdx !== null) {
                              handleUpdatePartFields(audioGalleryPartIdx, { audioUrl: file.url });
                            } else if (audioGalleryOptionIdx !== null) {
                              updateOptionAudioUrl(audioGalleryOptionIdx, file.url);
                            } else if (audioGalleryForMainText) {
                              setAudioUrl(file.url);
                            }
                            setShowAudioGallery(false);
                            setAudioGalleryPartIdx(null);
                            setAudioGalleryOptionIdx(null);
                            setAudioGalleryForMainText(false);
                            setR2AudioPreview(null);
                          }}
                          style={{
                            flexShrink: 0, padding: '6px 14px', borderRadius: 8,
                            border: 'none',
                            background: isSelected ? '#6d28d9' : '#7c3aed',
                            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Use This'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0, fontSize: 11, color: '#94a3b8',
          }}>
            <span>
              {r2AudioFiles.length} total file(s)
              {(r2AudioSearch || r2AudioFolderFilter) && (
                <> &bull; filtered</>
              )}
              {' '}&bull; Prefix: <code>audio/</code>
            </span>
            <button
              type="button"
              onClick={() => { setShowAudioGallery(false); setAudioGalleryPartIdx(null); setAudioGalleryOptionIdx(null); setAudioGalleryForMainText(false); setR2AudioPreview(null); }}
              style={{
                padding: '6px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: '#fff', color: '#374151', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >Close</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── IMAGE CROPPER COMPONENT ──────────────────────────────────────────────────
function GalleryImageCropper({ img, styles, onCancel, onSave }) {
  const [crop, setCrop] = useState({ x: 5, y: 5, w: 90, h: 90 });
  const [renderedDims, setRenderedDims] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState('overwrite'); // 'overwrite' or 'copy'
  
  const imgRef = useRef(null);
  const dragStateRef = useRef(null);

  const proxyUrl = `/api/admin/proxy-image?url=${encodeURIComponent(img.url)}`;

  const handleImageLoad = () => {
    if (imgRef.current) {
      setRenderedDims({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
        naturalWidth: imgRef.current.naturalWidth,
        naturalHeight: imgRef.current.naturalHeight,
      });
    }
  };

  // Adjust coordinates on resize
  useEffect(() => {
    const handleResize = () => {
      handleImageLoad();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartDrag = (ev, handle) => {
    ev.preventDefault();
    ev.stopPropagation();
    
    if (!renderedDims) return;

    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    
    dragStateRef.current = {
      handle,
      startX: clientX,
      startY: clientY,
      startCrop: { ...crop },
    };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (ev) => {
    if (!dragStateRef.current || !renderedDims) return;
    
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    
    const deltaX = ((clientX - dragStateRef.current.startX) / renderedDims.width) * 100;
    const deltaY = ((clientY - dragStateRef.current.startY) / renderedDims.height) * 100;
    
    const { handle, startCrop } = dragStateRef.current;
    let newCrop = { ...startCrop };
    
    if (handle === 'move') {
      newCrop.x = Math.max(0, Math.min(100 - startCrop.w, startCrop.x + deltaX));
      newCrop.y = Math.max(0, Math.min(100 - startCrop.h, startCrop.y + deltaY));
    } else {
      // East (right resize)
      if (handle.includes('e')) {
        newCrop.w = Math.max(5, Math.min(100 - startCrop.x, startCrop.w + deltaX));
      }
      // West (left resize)
      if (handle.includes('w')) {
        const maxW = startCrop.x + startCrop.w;
        const proposedW = Math.max(5, startCrop.w - deltaX);
        newCrop.x = Math.max(0, Math.min(maxW - 5, maxW - proposedW));
        newCrop.w = maxW - newCrop.x;
      }
      // South (bottom resize)
      if (handle.includes('s')) {
        newCrop.h = Math.max(5, Math.min(100 - startCrop.y, startCrop.h + deltaY));
      }
      // North (top resize)
      if (handle.includes('n')) {
        const maxH = startCrop.y + startCrop.h;
        const proposedH = Math.max(5, startCrop.h - deltaY);
        newCrop.y = Math.max(0, Math.min(maxH - 5, maxH - proposedH));
        newCrop.h = maxH - newCrop.y;
      }
    }
    
    setCrop(newCrop);
  };

  const handleDragEnd = () => {
    dragStateRef.current = null;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };

  const executeCrop = () => {
    if (!renderedDims || !imgRef.current) return;
    setSaving(true);

    const naturalWidth = renderedDims.naturalWidth;
    const naturalHeight = renderedDims.naturalHeight;

    const sourceX = (crop.x / 100) * naturalWidth;
    const sourceY = (crop.y / 100) * naturalHeight;
    const sourceWidth = (crop.w / 100) * naturalWidth;
    const sourceHeight = (crop.h / 100) * naturalHeight;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Canvas context could not be created.');
      setSaving(false);
      return;
    }

    // Draw cropped image
    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    // Determine type (use original type or fallback to image/jpeg)
    const ext = img.url.split('.').pop().toLowerCase().split('?')[0];
    const mimeType = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('Failed to generate image blob.');
        setSaving(false);
        return;
      }

      try {
        const formData = new FormData();
        const cleanName = img.name || 'cropped';
        const file = new File([blob], `${cleanName}.${ext}`, { type: mimeType });
        
        formData.append('file', file);
        formData.append('folder', img.folder || 'images');

        if (saveMode === 'overwrite') {
          formData.append('key', img.key);
        }

        const response = await fetch('/api/admin/upload-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save cropped image.');
        }

        alert(saveMode === 'overwrite' ? 'Cropped image overwritten successfully!' : 'Cropped image saved as copy successfully!');
        onSave();
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        setSaving(false);
      }
    }, mimeType, 0.82);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 24,
    }}
    onClick={onCancel}
    >
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        width: 'min(700px, 100%)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        maxHeight: '90vh'
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
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>✂️ Crop Image: {img.name}</h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: 'var(--color-text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body (Image + Interactive crop zone) */}
        <div style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          overflowY: 'auto',
          flex: 1,
          minHeight: 200,
          position: 'relative'
        }}>
          <div style={{
            position: 'relative',
            maxHeight: '55vh',
            maxWidth: '100%',
            display: 'inline-block'
          }}>
            <img
              ref={imgRef}
              src={proxyUrl}
              alt="crop preview"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
              style={{
                maxHeight: '55vh',
                maxWidth: '100%',
                display: 'block',
                userSelect: 'none',
                WebkitUserDrag: 'none'
              }}
            />

            {renderedDims && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'auto'
              }}>
                {/* 4 Mask backdrops (semi-transparent overlays) */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, right: 0,
                  height: `${crop.y}%`,
                  background: 'rgba(0, 0, 0, 0.65)'
                }} />
                <div style={{
                  position: 'absolute',
                  left: 0, top: `${crop.y + crop.h}%`, right: 0, bottom: 0,
                  background: 'rgba(0, 0, 0, 0.65)'
                }} />
                <div style={{
                  position: 'absolute',
                  left: 0, top: `${crop.y}%`,
                  width: `${crop.x}%`,
                  height: `${crop.h}%`,
                  background: 'rgba(0, 0, 0, 0.65)'
                }} />
                <div style={{
                  position: 'absolute',
                  left: `${crop.x + crop.w}%`, top: `${crop.y}%`, right: 0,
                  height: `${crop.h}%`,
                  background: 'rgba(0, 0, 0, 0.65)'
                }} />

                {/* Bounding box outline & drag surface */}
                <div
                  onMouseDown={(e) => handleStartDrag(e, 'move')}
                  onTouchStart={(e) => handleStartDrag(e, 'move')}
                  style={{
                    position: 'absolute',
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.w}%`,
                    height: `${crop.h}%`,
                    border: '2px dashed #10b981',
                    cursor: 'move',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', top: '33.3%', left: 0, right: 0, height: 1, borderTop: '1px dashed rgba(255, 255, 255, 0.3)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '66.6%', left: 0, right: 0, height: 1, borderTop: '1px dashed rgba(255, 255, 255, 0.3)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: '33.3%', top: 0, bottom: 0, width: 1, borderLeft: '1px dashed rgba(255, 255, 255, 0.3)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: '66.6%', top: 0, bottom: 0, width: 1, borderLeft: '1px dashed rgba(255, 255, 255, 0.3)', pointerEvents: 'none' }} />

                  {/* Handles */}
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'nw')}
                    onTouchStart={(e) => handleStartDrag(e, 'nw')}
                    style={{ position: 'absolute', top: -5, left: -5, width: 12, height: 12, background: '#10b981', border: '1.5px solid #fff', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10 }}
                  />
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'ne')}
                    onTouchStart={(e) => handleStartDrag(e, 'ne')}
                    style={{ position: 'absolute', top: -5, right: -5, width: 12, height: 12, background: '#10b981', border: '1.5px solid #fff', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 10 }}
                  />
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'sw')}
                    onTouchStart={(e) => handleStartDrag(e, 'sw')}
                    style={{ position: 'absolute', bottom: -5, left: -5, width: 12, height: 12, background: '#10b981', border: '1.5px solid #fff', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 10 }}
                  />
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'se')}
                    onTouchStart={(e) => handleStartDrag(e, 'se')}
                    style={{ position: 'absolute', bottom: -5, right: -5, width: 12, height: 12, background: '#10b981', border: '1.5px solid #fff', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10 }}
                  />
                  
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'n')}
                    onTouchStart={(e) => handleStartDrag(e, 'n')}
                    style={{ position: 'absolute', top: -4, left: 10, right: 10, height: 8, cursor: 'ns-resize', zIndex: 9 }}
                  />
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 's')}
                    onTouchStart={(e) => handleStartDrag(e, 's')}
                    style={{ position: 'absolute', bottom: -4, left: 10, right: 10, height: 8, cursor: 'ns-resize', zIndex: 9 }}
                  />
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'w')}
                    onTouchStart={(e) => handleStartDrag(e, 'w')}
                    style={{ position: 'absolute', left: -4, top: 10, bottom: 10, width: 8, cursor: 'ew-resize', zIndex: 9 }}
                  />
                  <div
                    onMouseDown={(e) => handleStartDrag(e, 'e')}
                    onTouchStart={(e) => handleStartDrag(e, 'e')}
                    style={{ position: 'absolute', right: -4, top: 10, bottom: 10, width: 8, cursor: 'ew-resize', zIndex: 9 }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 14, textAlign: 'center', pointerEvents: 'none' }}>
            {renderedDims ? (
              <>
                Original: {renderedDims.naturalWidth} x {renderedDims.naturalHeight} &bull;{' '}
                Cropped Selection:{' '}
                {Math.round((crop.w / 100) * renderedDims.naturalWidth)} x{' '}
                {Math.round((crop.h / 100) * renderedDims.naturalHeight)}
              </>
            ) : (
              'Loading image data...'
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-primary)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>Save option:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--color-text-main)' }}>
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === 'overwrite'}
                onChange={() => setSaveMode('overwrite')}
                style={{ cursor: 'pointer' }}
              />
              Overwrite Original
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--color-text-main)' }}>
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === 'copy'}
                onChange={() => setSaveMode('copy')}
                style={{ cursor: 'pointer' }}
              />
              Save as Copy
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              className={styles.btnOutline}
              style={{ padding: '8px 16px', fontSize: 12, height: 36 }}
            >
              Cancel
            </button>
            <button
              disabled={saving || !renderedDims}
              onClick={executeCrop}
              style={{
                padding: '0 20px',
                borderRadius: 8,
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 12,
                height: 36,
                cursor: (saving || !renderedDims) ? 'not-allowed' : 'pointer',
                opacity: (saving || !renderedDims) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {saving ? 'Saving...' : '💾 Apply & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
