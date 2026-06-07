'use client';

import { useState, useEffect, useMemo } from 'react';
import { evaluateTemplate } from '@/lib/practice/generators/universalEvaluator';
import styles from './templates.module.css';

const DEFAULT_TEMPLATE = {
  id: 'math-subtraction-ten-frame-auto',
  title: 'Subtract with Ten Frame',
  subject: 'math',
  topic: 'ukg-numbers-counting',
  layout: 'prompt_top_visual_center_options_bottom',
  variables: [
    { name: 'A', type: 'integer', min: '5', max: '10' },
    { name: 'B', type: 'integer', min: '1', max: 'A - 1' },
    { name: 'Result', type: 'expression', formula: 'A - B' }
  ],
  visuals: [
    {
      component: 'TenFrame',
      props: {
        filledCount: 'A',
        crossedOutCount: 'B',
        color: 'red'
      }
    }
  ],
  questionText: 'What is [A] minus [B]?',
  optionsType: 'mcq',
  options: [
    { label: '[Result]', isCorrect: true },
    { label: '[Result] + 1', isCorrect: false },
    { label: '[Result] - 1', isCorrect: false },
    { label: '[A]', isCorrect: false }
  ],
  explanation: {
    sections: [
      {
        type: 'text',
        content: 'Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result].'
      }
    ]
  }
};

const VISUAL_COMPONENTS = [
  {
    name: 'None',
    value: '',
    props: {}
  },
  {
    name: 'Ten Frame',
    value: 'TenFrame',
    props: {
      filledCount: 'A',
      crossedOutCount: 'B',
      color: 'red'
    }
  },
  {
    name: 'Jar of Marbles',
    value: 'JarOfMarbles',
    props: {
      colorA: 'blue',
      countA: 'A',
      colorB: 'red',
      countB: 'B'
    }
  },
  {
    name: 'Spinner',
    value: 'Spinner',
    props: {
      colorA: 'blue',
      sectorsA: 'A',
      colorB: 'green',
      sectorsB: 'B'
    }
  },
  {
    name: 'Item Counter Grid',
    value: 'ItemCounter',
    props: {
      count: 'A',
      itemType: 'cupcake'
    }
  },
  {
    name: 'Custom Image',
    value: 'Image',
    props: {
      imageUrl: '',
      width: '200'
    }
  },
  {
    name: 'Visual Choice (Which shows N?)',
    value: 'VisualChoice',
    props: {
      correctCount: 'A',
      itemType: 'cupcake',
      distractorMode: 'auto'
    }
  }
];

const COLORS_LIST = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange'];

const REFERENCE_EXAMPLES = [
  {
    id: "example-mcq",
    title: "Example: Multiple Choice (MCQ)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "5", max: "10" },
      { name: "B", type: "integer", min: "1", max: "A - 1" },
      { name: "Result", type: "expression", formula: "A - B" }
    ],
    visuals: [
      {
        component: "TenFrame",
        props: {
          filledCount: "A",
          crossedOutCount: "B",
          color: "red"
        }
      }
    ],
    questionText: "What is [A] minus [B]?",
    optionsType: "mcq",
    options: [
      { label: "[Result]", isCorrect: true },
      { label: "[Result] + 1", isCorrect: false },
      { label: "[Result] - 1", isCorrect: false },
      { label: "[A]", isCorrect: false }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Start with [A] counters on the ten frame. Cross out [B] of them. There are [Result] counters left, so [A] - [B] = [Result]."
        }
      ]
    }
  },
  {
    id: "example-fill-in-the-blank",
    title: "Example: Fill In The Blank (FIB)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "9" },
      { name: "B", type: "integer", min: "2", max: "9" },
      { name: "Result", type: "expression", formula: "A + B" }
    ],
    visuals: [],
    questionText: "Fill in the correct value to complete the addition sentence.",
    optionsType: "fillInTheBlank",
    parts: [
      {
        type: "text",
        content: "[A] + [B] = [[ans]]"
      }
    ],
    answer: {
      ans: "[Result]"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "Adding [A] and [B] gives [Result]. So [A] + [B] = [Result]."
        }
      ]
    }
  },
  {
    id: "example-categorization",
    title: "Example: Categorization (Drag & Drop)",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "1", max: "10" }
    ],
    visuals: [],
    questionText: "Sort the numbers into Even and Odd columns.",
    optionsType: "categorizationv2",
    parts: [
      {
        type: "categorizationv2",
        categories: [
          { id: "even", label: "Even Numbers" },
          { id: "odd", label: "Odd Numbers" }
        ],
        items: [
          { id: "item1", content: "2" },
          { id: "item2", content: "3" },
          { id: "item3", content: "4" },
          { id: "item4", content: "5" }
        ],
        answerKey: {
          item1: "even",
          item2: "odd",
          item3: "even",
          item4: "odd"
        }
      }
    ],
    answer: {
      item1: "even",
      item2: "odd",
      item3: "even",
      item4: "odd"
    },
    explanation: {
      sections: [
        {
          type: "text",
          content: "Even numbers can be divided by 2 without a remainder (e.g. 2, 4), while odd numbers leave a remainder of 1 (e.g. 3, 5)."
        }
      ]
    }
  },
  {
    id: "example-visual-choice",
    title: "Example: Visual Choice",
    subject: "math",
    topic: "ukg-numbers-counting",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "A", type: "integer", min: "2", max: "5" }
    ],
    visuals: [
      {
        component: "VisualChoice",
        props: {
          correctCount: "A",
          itemType: "cupcake",
          distractorMode: "auto"
        }
      }
    ],
    questionText: "Which plate shows [A] cupcakes?",
    optionsType: "visual_choice",
    explanation: {
      sections: [
        {
          type: "text",
          content: "Count the cupcakes on each plate. The plate with exactly [A] cupcakes is the correct answer."
        }
      ]
    }
  },
  {
    id: "example-hotspot-inside-outside",
    title: "Example: Hotspot (Inside/Outside)",
    subject: "math",
    topic: "ukg-positions-inside-outside",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "animal_label", type: "list", items: ["rabbit", "penguin"] },
      {
        name: "animal_img",
        type: "expression",
        formula: "animal_label == 'rabbit' ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655512965-penguin.png'"
      },
      { name: "target_val", type: "list", items: [0, 1] },
      {
        name: "target_pos",
        type: "expression",
        formula: "target_val == 0 ? 'inside' : 'outside'"
      },
      {
        name: "resolved_image",
        type: "expression",
        formula: "animal_label == 'rabbit' ? (target_val == 0 ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762227249-rabbit-inside-gif.webp' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762118296-rabbit-outside-gif.webp') : (target_val == 0 ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762183192-penguin-inside-gif.webp' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780762080125-penguin-outside-gif.webp')"
      }
    ],
    visuals: [],
    questionText: "Click the box where the [animal_label] is **[target_pos]**.",
    optionsType: "hotspot_select",
    parts: [
      {
        type: "hotspot_canvas",
        backgroundUrl: "[resolved_image]",
        canvasWidth: 500,
        canvasHeight: 320,
        transparent: true,
        hotspots: [
          { id: "box_a", label: "Box A", x: 20, y: 150, width: 220, height: 150, optionIndex: 0 },
          { id: "box_b", label: "Box B", x: 260, y: 150, width: 220, height: 150, optionIndex: 1 }
        ]
      }
    ],
    options: [
      { label: "Box A", isCorrect: "target_val == 0" },
      { label: "Box B", isCorrect: "target_val == 1" }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Look at the picture. The [animal_label] is [target_pos] the box, which is [Result]."
        }
      ]
    }
  },
  {
    id: "example-hotspot-dynamic-composition",
    title: "Example: Hotspot (Dynamic Scene Composition)",
    subject: "math",
    topic: "ukg-positions-inside-outside",
    layout: "prompt_top_visual_center_options_bottom",
    variables: [
      { name: "animal_label", type: "list", items: ["rabbit", "penguin"] },
      {
        name: "animal_img",
        type: "expression",
        formula: "animal_label == 'rabbit' ? 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png' : 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655512965-penguin.png'"
      },
      { name: "container_type", type: "list", items: ["box", "bowl", "basket", "circle", "house"] },
      { name: "target_val", type: "list", items: [0, 1] },
      { name: "target_pos", type: "list", items: ["inside", "outside"] },
      {
        name: "placement_0",
        type: "expression",
        formula: "target_val == 0 ? target_pos : (target_pos == 'inside' ? 'outside' : 'inside')"
      },
      {
        name: "placement_1",
        type: "expression",
        formula: "target_val == 1 ? target_pos : (target_pos == 'inside' ? 'outside' : 'inside')"
      }
    ],
    visuals: [],
    questionText: "Click the **[container_type]** where the [animal_label] is **[target_pos]**.",
    optionsType: "hotspot_select",
    parts: [
      {
        type: "hotspot_canvas",
        canvasWidth: 500,
        canvasHeight: 320,
        transparent: true,
        composeScene: {
          containerType: "[container_type]",
          targetClipart: "[animal_img]",
          placements: [
            "[placement_0]",
            "[placement_1]"
          ]
        },
        hotspots: [
          { id: "box_a", label: "Box A", x: 40, y: 120, width: 180, height: 160, optionIndex: 0 },
          { id: "box_b", label: "Box B", x: 280, y: 120, width: 180, height: 160, optionIndex: 1 }
        ]
      }
    ],
    options: [
      { label: "Box A", isCorrect: "target_val == 0" },
      { label: "Box B", isCorrect: "target_val == 1" }
    ],
    explanation: {
      sections: [
        {
          type: "text",
          content: "Looking at the picture, the [animal_label] is [target_pos] the [container_type] on the [target_val == 0 ? 'left (Box A)' : 'right (Box B)']."
        }
      ]
    }
  }
];


export default function VisualTemplateBuilderPage() {
  // Database templates state
  const [dynamicTemplates, setDynamicTemplates] = useState([]);
  const [staticTemplates, setStaticTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  // Guide modal states
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('overview');

  // Editor State
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Simulator State
  const [seed, setSeed] = useState('12345');
  const [showJson, setShowJson] = useState(false);

  // Code editor state
  const [editorMode, setEditorMode] = useState('form'); // 'form' or 'json'
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_TEMPLATE, null, 2));
  const [jsonError, setJsonError] = useState(null);

  // Gallery and Custom Selector States
  const [useCustomItemType, setUseCustomItemType] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState([]);
  const [galleryImageLabels, setGalleryImageLabels] = useState({}); // { [url]: customLabel }
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryTargetProp, setGalleryTargetProp] = useState(''); // 'itemType' or 'imageUrl'

  // Modal search and web import states
  const [gallerySearch, setGallerySearch] = useState('');
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchType, setWebSearchType] = useState('clipart');
  const [webResults, setWebResults] = useState([]);
  const [webSearching, setWebSearching] = useState(false);
  const [importingUrl, setImportingUrl] = useState(null);
  const [importedWebUrls, setImportedWebUrls] = useState({}); // { [remoteUrl]: localR2Url }
  const [activeHsIdx, setActiveHsIdx] = useState(0);

  // Curriculum skill linking states
  const [linkToSkill, setLinkToSkill] = useState(false);
  const [curriculumNodes, setCurriculumNodes] = useState([]);
  const [skillSubject, setSkillSubject] = useState('math');
  const [skillSubjectCustomId, setSkillSubjectCustomId] = useState('');
  const [skillSubjectCustomTitle, setSkillSubjectCustomTitle] = useState('');
  const [skillTopic, setSkillTopic] = useState('');
  const [skillTopicCustomId, setSkillTopicCustomId] = useState('');
  const [skillTopicCustomTitle, setSkillTopicCustomTitle] = useState('');
  const [skillChapter, setSkillChapter] = useState('');
  const [skillChapterCustomId, setSkillChapterCustomId] = useState('');
  const [skillChapterCustomTitle, setSkillChapterCustomTitle] = useState('');
  const [skillGrade, setSkillGrade] = useState('');
  const [skillTitle, setSkillTitle] = useState('');
  const [skillIdInput, setSkillIdInput] = useState('');
  const [skillCode, setSkillCode] = useState('');
  const [skillOrder, setSkillOrder] = useState('0');


  const openGallery = async (targetProp, currentVal = '') => {
    setGalleryTargetProp(targetProp);
    setShowGallery(true);
    setGalleryLoading(true);
    setGallerySearch('');
    setIsWebSearch(false);
    webSearchQuery && setWebSearchQuery('');
    setWebResults([]);
    setWebSearching(false);
    setImportingUrl(null);
    
    // Parse current values — support both legacy "url, url" and new "label::url, label::url" formats
    let initialSelected = [];
    let initialLabels = {};
    const rawEntries = typeof currentVal === 'string' && currentVal.trim()
      ? currentVal.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(currentVal) ? currentVal : [];
    for (const entry of rawEntries) {
      if (entry.includes('::')) {
        const [label, url] = entry.split('::').map(s => s.trim());
        if (url) {
          initialSelected.push(url);
          if (label) initialLabels[url] = label;
        }
      } else {
        initialSelected.push(entry);
      }
    }
    setSelectedGalleryUrls(initialSelected);
    setGalleryImageLabels(initialLabels);
    
    try {
      const res = await fetch('/api/admin/list-images?prefix=images/');
      const data = await res.json();
      setGalleryImages(data.images || []);
    } catch (err) {
      console.error('Failed to load gallery images:', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSelectGalleryImage = (url) => {
    setSelectedGalleryUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  const applyGallerySelection = () => {
    // Encode as "label::url" when a custom label exists, otherwise just "url"
    const entries = selectedGalleryUrls.map(url => {
      const label = (galleryImageLabels[url] || '').trim();
      return label ? `${label}::${url}` : url;
    });
    const valueStr = entries.join(', ');

    if (galleryTargetProp === 'backgroundUrl') {
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'hotspot_canvas');
      if (partIdx >= 0) {
        newParts[partIdx] = { ...newParts[partIdx], backgroundUrl: valueStr };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp === 'composeScene.targetClipart') {
      const newParts = [...template.parts];
      const partIdx = newParts.findIndex(p => p.type === 'hotspot_canvas');
      if (partIdx >= 0 && newParts[partIdx].composeScene) {
        newParts[partIdx] = {
          ...newParts[partIdx],
          composeScene: {
            ...newParts[partIdx].composeScene,
            targetClipart: valueStr
          }
        };
        updateField('parts', newParts);
      }
    } else if (galleryTargetProp.startsWith('variable_items_')) {
      const varIdx = parseInt(galleryTargetProp.replace('variable_items_', ''), 10);
      updateVariable(varIdx, 'items', entries);
    } else {
      updateVisualProp(galleryTargetProp, valueStr);
    }
    
    if (galleryTargetProp === 'itemType') {
      setUseCustomItemType(true);
    }
    
    setShowGallery(false);
  };

  // Local image list filter
  const filteredLocalImages = useMemo(() => {
    if (!gallerySearch.trim()) return galleryImages;
    const q = gallerySearch.toLowerCase();
    return galleryImages.filter(img => {
      const nameMatch = (img.name || '').toLowerCase().includes(q);
      const keyMatch = (img.key || '').toLowerCase().includes(q);
      const tagMatch = img.classification?.tags?.some(t => t.toLowerCase().includes(q));
      const categoryMatch = (img.classification?.category || '').toLowerCase().includes(q);
      return nameMatch || keyMatch || tagMatch || categoryMatch;
    });
  }, [galleryImages, gallerySearch]);

  // Handle DuckDuckGo web image search
  const handleWebSearch = async (e) => {
    if (e) e.preventDefault();
    if (!webSearchQuery.trim()) return;
    setWebSearching(true);
    try {
      const res = await fetch(`/api/admin/search-web-images?q=${encodeURIComponent(webSearchQuery)}&type=${webSearchType}`);
      const data = await res.json();
      if (data.success) {
        setWebResults(data.results || []);
      } else {
        console.error('Web search error:', data.error);
      }
    } catch (err) {
      console.error('Failed web search:', err);
    } finally {
      setWebSearching(false);
    }
  };

  // Import remote image to R2 and database
  const handleImportWebImage = async (remoteUrl) => {
    // If already imported in this session, toggle selection
    if (importedWebUrls[remoteUrl]) {
      const localUrl = importedWebUrls[remoteUrl];
      setSelectedGalleryUrls(prev => {
        if (prev.includes(localUrl)) {
          return prev.filter(u => u !== localUrl);
        } else {
          return [...prev, localUrl];
        }
      });
      return;
    }

    setImportingUrl(remoteUrl);
    try {
      const res = await fetch('/api/admin/fetch-url-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: remoteUrl,
          folder: 'images',
          customName: webSearchQuery || 'imported-web'
        })
      });
      const data = await res.json();
      if (data.r2Url) {
        const newLocalUrl = data.r2Url;
        
        // Add to imported map
        setImportedWebUrls(prev => ({ ...prev, [remoteUrl]: newLocalUrl }));
        
        // Add to selection list
        setSelectedGalleryUrls(prev => [...prev, newLocalUrl]);
        
        // Add new asset to local list
        const cleanName = data.key.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ');
        const newImgObj = {
          key: data.key,
          url: newLocalUrl,
          name: cleanName,
          classification: data.classification || { tags: ['imported-asset'], category: 'imported' }
        };
        setGalleryImages(prev => [newImgObj, ...prev]);
      } else {
        alert(`Failed to import image: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setImportingUrl(null);
    }
  };

  // Load templates on mount
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        setDynamicTemplates(data.dynamicTemplates || []);
        setStaticTemplates(data.templates || {});
        
        // Auto select by query param id
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlId = params.get('id');
          const isDuplicate = params.get('duplicate') === 'true';
          if (urlId) {
            const tpl = (data.dynamicTemplates || []).find(t => t.id === urlId) ||
                        Object.values(data.templates || {}).find(t => t.id === urlId);
            if (tpl) {
              if (isDuplicate) {
                const copyTpl = {
                  ...tpl,
                  id: `${tpl.id}-copy-${Date.now()}`,
                  title: `${tpl.title || 'Untitled'} (Copy)`
                };
                handleSelectTemplate(copyTpl);
                setSelectedId(null);
              } else {
                handleSelectTemplate(tpl);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurriculumNodes = async () => {
    try {
      const res = await fetch('/api/admin/curriculum?limit=1000');
      const data = await res.json();
      if (data.success && data.nodes) {
        setCurriculumNodes(data.nodes);
      }
    } catch (err) {
      console.error('Failed to fetch curriculum nodes:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCurriculumNodes();
  }, []);

  useEffect(() => {
    if (editorMode === 'form') {
      setJsonText(JSON.stringify(template, null, 2));
    }
  }, [template, editorMode]);

  // Auto-fill link skill fields when template changes
  useEffect(() => {
    if (template) {
      setSkillTitle(template.title || '');
      setSkillIdInput(template.id || '');
      
      const subj = template.subject || 'math';
      setSkillSubject(subj);
      setSkillSubjectCustomId('');
      setSkillSubjectCustomTitle('');

      const topic = template.topic || '';
      setSkillTopic(topic);
      setSkillTopicCustomId('');
      setSkillTopicCustomTitle('');

      const chap = topic ? `${topic}-chapter` : '';
      setSkillChapter(chap);
      setSkillChapterCustomId('');
      setSkillChapterCustomTitle('');

      setSkillGrade('');
      setSkillCode('');
      setSkillOrder('0');
    }
  }, [template.id]);

  // Auto-initialize hotspot canvas properties when changed to hotspot_select
  useEffect(() => {
    if (template.optionsType === 'hotspot_select') {
      const hasPart = Array.isArray(template.parts) && template.parts.some(p => p.type === 'hotspot_canvas');
      if (!hasPart) {
        const currentParts = Array.isArray(template.parts) ? template.parts : [];
        const newParts = [
          ...currentParts,
          {
            type: 'hotspot_canvas',
            backgroundUrl: '',
            canvasWidth: 500,
            canvasHeight: 320,
            transparent: true,
            hotspots: [
              { id: 'box_a', label: 'Box A', x: 20, y: 150, width: 220, height: 150, optionIndex: 0 },
              { id: 'box_b', label: 'Box B', x: 260, y: 150, width: 220, height: 150, optionIndex: 1 }
            ]
          }
        ];
        updateField('parts', newParts);
        setActiveHsIdx(0);
      }
    }
  }, [template.optionsType]);


  // Handle template selection from sidebar
  const handleSelectTemplate = (tpl) => {
    setSelectedId(tpl.id);
    
    // Ensure explanation structure is normalized
    const normalized = {
      ...tpl,
      variables: tpl.variables || [],
      visuals: tpl.visuals || [],
      options: tpl.options || [],
      explanation: tpl.explanation || { sections: [{ type: 'text', content: '' }] }
    };
    
    setTemplate(normalized);
    setJsonText(JSON.stringify(normalized, null, 2));
    setJsonError(null);
    setSaveStatus(null);
  };

  // Start a new template
  const handleNewTemplate = () => {
    setSelectedId(null);
    const uniqueId = `template-${Date.now()}`;
    const newTpl = {
      ...DEFAULT_TEMPLATE,
      id: uniqueId,
      title: 'New Custom Template'
    };
    setTemplate(newTpl);
    setJsonText(JSON.stringify(newTpl, null, 2));
    setJsonError(null);
    setSaveStatus(null);
  };

  // Deep update helper
  const updateField = (field, value) => {
    setTemplate(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-update ID if title changes and it's a new unsaved template
      if (field === 'title' && !selectedId) {
        const slug = value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        next.id = slug ? `template-${slug}` : `template-${Date.now()}`;
      }
      
      return next;
    });
  };

  // Variable Management
  const addVariable = () => {
    updateField('variables', [
      ...template.variables,
      { name: `Var_${template.variables.length + 1}`, type: 'integer', min: '1', max: '10' }
    ]);
  };

  const updateVariable = (index, key, val) => {
    const vars = [...template.variables];
    vars[index] = { ...vars[index], [key]: val };
    updateField('variables', vars);
  };

  const removeVariable = (index) => {
    const vars = template.variables.filter((_, idx) => idx !== index);
    updateField('variables', vars);
  };

  // Visual component updates
  const handleSelectVisualComponent = (compVal) => {
    const found = VISUAL_COMPONENTS.find(c => c.value === compVal);
    if (!found || !found.value) {
      updateField('visuals', []);
    } else {
      updateField('visuals', [{
        component: found.value,
        props: { ...found.props }
      }]);
    }
  };

  const updateVisualProp = (propName, propVal) => {
    if (template.visuals.length === 0) return;
    const visuals = [...template.visuals];
    visuals[0] = {
      ...visuals[0],
      props: {
        ...visuals[0].props,
        [propName]: propVal
      }
    };
    updateField('visuals', visuals);

    // Auto-set optionsType to fillInTheBlank when clickToFill is checked
    if (propName === 'clickToFill' && propVal === true) {
      updateField('optionsType', 'fillInTheBlank');
    }
  };

  // Options updates
  const updateOption = (index, field, val) => {
    const opts = [...template.options];
    opts[index] = { ...opts[index], [field]: val };
    
    // If setting to true, toggle others off
    if (field === 'isCorrect' && val === true) {
      opts.forEach((o, i) => {
        if (i !== index) o.isCorrect = false;
      });
    }
    
    updateField('options', opts);
  };

  // Save template to DB
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      // 1. Save Template
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server returned failure saving template');
      }

      // 2. Link to Curriculum Skill if checked
      if (linkToSkill) {
        // Resolve subjectId, topicId, chapterId, checking if custom is chosen
        let finalSubjectId = skillSubject;
        let finalTopicId = skillTopic;
        let finalChapterId = skillChapter;

        const slugify = (val) => {
          return String(val || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };

        // Save custom subject if needed
        if (skillSubject === '_custom_') {
          if (!skillSubjectCustomId.trim()) {
            throw new Error('Custom Subject ID is required');
          }
          finalSubjectId = slugify(skillSubjectCustomId);
          const subjectPayload = {
            type: 'subject',
            id: finalSubjectId,
            title: skillSubjectCustomTitle.trim() || skillSubjectCustomId,
          };
          const subjectRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subjectPayload)
          });
          const subjectData = await subjectRes.json();
          if (!subjectData.success) {
            throw new Error(subjectData.error || `Failed to create custom subject: ${finalSubjectId}`);
          }
        }

        // Save custom topic if needed
        if (skillTopic === '_custom_') {
          if (!skillTopicCustomId.trim()) {
            throw new Error('Custom Topic ID is required');
          }
          finalTopicId = slugify(skillTopicCustomId);
          const topicPayload = {
            type: 'topic',
            id: finalTopicId,
            title: skillTopicCustomTitle.trim() || skillTopicCustomId,
            parentId: finalSubjectId
          };
          const topicRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(topicPayload)
          });
          const topicData = await topicRes.json();
          if (!topicData.success) {
            throw new Error(topicData.error || `Failed to create custom topic: ${finalTopicId}`);
          }
        }

        // Save custom chapter if needed
        if (skillChapter === '_custom_') {
          if (!skillChapterCustomId.trim()) {
            throw new Error('Custom Chapter ID is required');
          }
          finalChapterId = slugify(skillChapterCustomId);
          const chapterPayload = {
            type: 'chapter',
            id: finalChapterId,
            title: skillChapterCustomTitle.trim() || skillChapterCustomId,
            parentId: finalTopicId
          };
          const chapterRes = await fetch('/api/admin/curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chapterPayload)
          });
          const chapterData = await chapterRes.json();
          if (!chapterData.success) {
            throw new Error(chapterData.error || `Failed to create custom chapter: ${finalChapterId}`);
          }
        }

        const skillPayload = {
          type: 'skill',
          id: skillIdInput,
          subjectId: finalSubjectId,
          topicId: finalTopicId,
          chapterId: finalChapterId,
          title: skillTitle,
          code: skillCode,
          grade: skillGrade,
          order: Number(skillOrder) || 0,
          templateId: template.id,
          engine: 'universal-template',
          questionType: template.optionsType || 'mcq'
        };

        const curriculumRes = await fetch('/api/admin/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skillPayload)
        });
        const curriculumData = await curriculumRes.json();
        if (!curriculumData.success) {
          throw new Error(curriculumData.error || 'Failed to link curriculum skill');
        }

        await fetchCurriculumNodes();
      }

      setSaveStatus({
        type: 'success',
        text: linkToSkill
          ? `Template "${template.id}" saved and linked to curriculum skill successfully!`
          : `Template "${template.id}" saved successfully!`
      });
      setSelectedId(template.id);
      await fetchTemplates();
    } catch (err) {
      setSaveStatus({ type: 'error', text: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Live simulation evaluation
  const evaluatedQuestion = useMemo(() => {
    try {
      const q = evaluateTemplate(template, seed);
      return { ok: true, question: q };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [template, seed]);

  // Dynamic lists from static config
  const staticList = useMemo(() => {
    const list = [...REFERENCE_EXAMPLES];
    Object.entries(staticTemplates).forEach(([subj, topics]) => {
      Object.entries(topics).forEach(([topicName, templatesArr]) => {
        templatesArr.forEach(t => {
          list.push({ ...t, subject: subj, topic: topicName, isStatic: true });
        });
      });
    });
    return list;
  }, [staticTemplates]);

  const renderCurriculumLinkerCard = () => {
    const subjects = curriculumNodes.filter(n => n.type === 'subject');
    const topics = curriculumNodes.filter(n => n.type === 'topic' && n.parentId === skillSubject);
    const chapters = curriculumNodes.filter(n => n.type === 'chapter' && n.parentId === skillTopic);

    return (
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <label className={styles.checkboxLabel} style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={linkToSkill}
            onChange={(e) => setLinkToSkill(e.target.checked)}
          />
          Create & Save Curriculum Skill Node
        </label>

        {linkToSkill && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            
            {/* Subject Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-subj">Subject</label>
              <select
                id="skill-subj"
                className={styles.select}
                value={skillSubject}
                onChange={(e) => {
                  setSkillSubject(e.target.value);
                  setSkillTopic('');
                  setSkillChapter('');
                }}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Subject...</option>
              </select>
            </div>

            {skillSubject === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-subj-custom-id">Custom Subject ID (slug)</label>
                  <input
                    id="skill-subj-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. math"
                    value={skillSubjectCustomId}
                    onChange={(e) => setSkillSubjectCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-subj-custom-title">Custom Subject Title</label>
                  <input
                    id="skill-subj-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Mathematics"
                    value={skillSubjectCustomTitle}
                    onChange={(e) => setSkillSubjectCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Topic Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-topic">Topic</label>
              <select
                id="skill-topic"
                className={styles.select}
                value={skillTopic}
                onChange={(e) => {
                  setSkillTopic(e.target.value);
                  setSkillChapter('');
                }}
                disabled={!skillSubject}
              >
                <option value="">-- Select Topic --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Topic...</option>
              </select>
            </div>

            {skillTopic === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-topic-custom-id">Custom Topic ID (slug)</label>
                  <input
                    id="skill-topic-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. addition-basics"
                    value={skillTopicCustomId}
                    onChange={(e) => setSkillTopicCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-topic-custom-title">Custom Topic Title</label>
                  <input
                    id="skill-topic-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Addition Basics"
                    value={skillTopicCustomTitle}
                    onChange={(e) => setSkillTopicCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Chapter Selector */}
            <div className={styles.formGroup}>
              <label htmlFor="skill-chap">Chapter</label>
              <select
                id="skill-chap"
                className={styles.select}
                value={skillChapter}
                onChange={(e) => setSkillChapter(e.target.value)}
                disabled={!skillTopic}
              >
                <option value="">-- Select Chapter --</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
                ))}
                <option value="_custom_">+ Create Custom Chapter...</option>
              </select>
            </div>

            {skillChapter === '_custom_' && (
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-chap-custom-id">Custom Chapter ID (slug)</label>
                  <input
                    id="skill-chap-custom-id"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. chapter-1"
                    value={skillChapterCustomId}
                    onChange={(e) => setSkillChapterCustomId(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-chap-custom-title">Custom Chapter Title</label>
                  <input
                    id="skill-chap-custom-title"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Chapter 1: Addition under 10"
                    value={skillChapterCustomTitle}
                    onChange={(e) => setSkillChapterCustomTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-id-input">Skill Node ID (slug)</label>
                  <input
                    id="skill-id-input"
                    type="text"
                    className={styles.input}
                    value={skillIdInput}
                    onChange={(e) => setSkillIdInput(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-title-input">Skill Title</label>
                  <input
                    id="skill-title-input"
                    type="text"
                    className={styles.input}
                    value={skillTitle}
                    onChange={(e) => setSkillTitle(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-grade">Grade</label>
                  <input
                    id="skill-grade"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. 1"
                    value={skillGrade}
                    onChange={(e) => setSkillGrade(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-code">Skill Code</label>
                  <input
                    id="skill-code"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. MATH.1.A"
                    value={skillCode}
                    onChange={(e) => setSkillCode(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="skill-order">Order</label>
                  <input
                    id="skill-order"
                    type="number"
                    className={styles.input}
                    value={skillOrder}
                    onChange={(e) => setSkillOrder(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Visual Template Builder</h1>
          <p className={styles.subtitle}>Create and design dynamic mathematics questions visually</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btn + ' ' + styles.btnSecondary}
            style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#c084fc' }}
            onClick={() => setShowGuide(true)}
          >
            📚 Question Types Guide
          </button>
          <a className={styles.btn + ' ' + styles.btnSecondary} href="/admin">
            ← Back to Admin Console
          </a>
          <button type="button" className={styles.btn + ' ' + styles.btnSecondary} onClick={handleNewTemplate}>
            + Create New Template
          </button>
        </div>
      </header>
 
      <div className={styles.workspace}>
        {/* Left column: Sidebar list of existing templates */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Templates Repository</h3>
          {loading ? (
            <p className={styles.emptyStateText}>Loading...</p>
          ) : (
            <div className={styles.templateList}>
              <div className={styles.sectionTitle} style={{ marginTop: 0 }}>
                <span>Custom MongoDB</span>
              </div>
              {dynamicTemplates.length === 0 ? (
                <p className={styles.emptyStateText} style={{ padding: '8px 0' }}>No custom templates</p>
              ) : (
                dynamicTemplates.map(tpl => (
                  <button
                    key={`dynamic-${tpl.id}`}
                    className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                    onClick={() => handleSelectTemplate(tpl)}
                  >
                    <div className={styles.templateItemTitle}>{tpl.title || tpl.id}</div>
                    <div className={styles.templateItemMeta}>{tpl.topic} • {tpl.id}</div>
                  </button>
                ))
              )}
 
              <div className={styles.sectionTitle} style={{ marginTop: '16px' }}>
                <span>Reference Examples</span>
              </div>
              {REFERENCE_EXAMPLES.map(tpl => (
                <button
                  key={`ref-${tpl.id}`}
                  className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className={styles.templateItemTitle}>{tpl.title}</div>
                  <div className={styles.templateItemMeta}>{tpl.topic} • Example</div>
                </button>
              ))}

              <div className={styles.sectionTitle}>
                <span>Static Catalog</span>
              </div>
              {staticList.filter(tpl => !REFERENCE_EXAMPLES.some(r => r.id === tpl.id)).map(tpl => (
                <button
                  key={`static-${tpl.subject}-${tpl.topic}-${tpl.id}`}
                  className={`${styles.templateItem} ${selectedId === tpl.id ? styles.templateItemActive : ''}`}
                  onClick={() => handleSelectTemplate(tpl)}
                >
                  <div className={styles.templateItemTitle}>{tpl.title || tpl.id}</div>
                  <div className={styles.templateItemMeta}>{tpl.topic} • Static</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right columns: Editor Form & Live Simulator */}
        <div className={styles.builderArea}>
          {/* Builder Editor Card */}
          <section className={styles.panel}>
            <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>Template Editor</h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedId ? `Editing: ${selectedId}` : 'New Unsaved Template'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: editorMode === 'form' ? '#ffffff' : 'transparent',
                    color: editorMode === 'form' ? '#0f172a' : '#64748b',
                    boxShadow: editorMode === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditorMode('form')}
                >
                  📝 Form Builder
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: editorMode === 'json' ? '#ffffff' : 'transparent',
                    color: editorMode === 'json' ? '#0f172a' : '#64748b',
                    boxShadow: editorMode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditorMode('json')}
                >
                  💻 JSON Recipe
                </button>
              </div>
            </div>

            <div className={styles.panelBody}>
              {editorMode === 'json' ? (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                  <div className={styles.formGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="json-editor">JSON Recipe Code Editor</label>
                    <textarea
                      id="json-editor"
                      className={styles.textarea}
                      style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        padding: '12px',
                        background: '#0f172a',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        border: jsonError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        minHeight: '420px',
                        resize: 'vertical'
                      }}
                      value={jsonText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setJsonText(val);
                        try {
                          const parsed = JSON.parse(val);
                          if (parsed && typeof parsed === 'object') {
                            setTemplate({
                              ...parsed,
                              variables: parsed.variables || [],
                              visuals: parsed.visuals || [],
                              options: parsed.options || [],
                              explanation: parsed.explanation || { sections: [{ type: 'text', content: '' }] }
                            });
                            setJsonError(null);
                          } else {
                            setJsonError('Must be a JSON object');
                          }
                        } catch (err) {
                          setJsonError(err.message);
                        }
                      }}
                    />
                    {jsonError && (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: 600 }}>
                        ⚠️ JSON Syntax Error: {jsonError}
                      </div>
                    )}
                  </div>
                  
                  {renderCurriculumLinkerCard()}

                  {/* Save Button for JSON mode */}
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={styles.btn + ' ' + styles.btnPrimary}
                      style={{ flex: 1, padding: '12px' }}
                      onClick={handleSave}
                      disabled={saving || !!jsonError || (!!selectedId && staticList.some(s => s.id === selectedId))}
                    >
                      {saving ? 'Saving to Database...' : 'Save Template to MongoDB'}
                    </button>
                  </div>
                  {saveStatus && (
                    <div className={`${styles.statusBar} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                      {saveStatus.text}
                    </div>
                  )}
                  {selectedId && staticList.some(s => s.id === selectedId) && (
                    <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px', textAlign: 'center' }}>
                      ⚠️ Static catalogs are read-only. Change the Template ID to save a custom copy.
                    </p>
                  )}
                </div>
              ) : (
                <>
              {/* Metadata */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-id">Template ID</label>
                  <input
                    id="tpl-id"
                    type="text"
                    className={styles.input}
                    value={template.id || ''}
                    onChange={(e) => updateField('id', e.target.value)}
                    disabled={!!selectedId && staticList.some(s => s.id === selectedId)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-title">Template Title</label>
                  <input
                    id="tpl-title"
                    type="text"
                    className={styles.input}
                    value={template.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-subject">Subject</label>
                  <select
                    id="tpl-subject"
                    className={styles.select}
                    value={template.subject || 'math'}
                    onChange={(e) => updateField('subject', e.target.value)}
                  >
                    <option value="math">math</option>
                    <option value="english">english</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="tpl-topic">Topic Node Slug</label>
                  <input
                    id="tpl-topic"
                    type="text"
                    className={styles.input}
                    value={template.topic || ''}
                    placeholder="e.g. ukg-numbers-counting"
                    onChange={(e) => updateField('topic', e.target.value)}
                  />
                </div>
              </div>

              {/* Variables Board */}
              <div className={styles.sectionTitle}>
                <span>Variables Board</span>
                <button type="button" className={styles.btn + ' ' + styles.btnSecondary} style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addVariable}>
                  + Add Variable
                </button>
              </div>

              <div className={styles.varList}>
                {template.variables.map((variable, idx) => (
                  <div key={idx} className={styles.varCard}>
                    <div className={styles.varCardHeader}>
                      <input
                        type="text"
                        className={styles.varNameInput}
                        value={variable.name || ''}
                        onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                        aria-label={`Variable ${idx + 1} Name`}
                      />
                      <button type="button" className={styles.varDeleteBtn} onClick={() => removeVariable(idx)} title="Delete Variable">
                        ✕
                      </button>
                    </div>

                    <div className={styles.varFields}>
                      <label htmlFor={`var-type-${idx}`}>Type</label>
                      <select
                        id={`var-type-${idx}`}
                        className={styles.select}
                        value={variable.type || 'integer'}
                        onChange={(e) => updateVariable(idx, 'type', e.target.value)}
                      >
                        <option value="integer">Integer Range</option>
                        <option value="expression">Arithmetic Expression</option>
                        <option value="list">Choice List</option>
                      </select>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      {variable.type === 'integer' && (
                        <div className={styles.varFieldsSubGrid}>
                          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                            <label htmlFor={`var-min-${idx}`} style={{ fontSize: '11px' }}>Min (Value or Exp)</label>
                            <input
                              id={`var-min-${idx}`}
                              type="text"
                              className={styles.input}
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={variable.min || ''}
                              onChange={(e) => updateVariable(idx, 'min', e.target.value)}
                            />
                          </div>
                          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                            <label htmlFor={`var-max-${idx}`} style={{ fontSize: '11px' }}>Max (Value or Exp)</label>
                            <input
                              id={`var-max-${idx}`}
                              type="text"
                              className={styles.input}
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              value={variable.max || ''}
                              onChange={(e) => updateVariable(idx, 'max', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {variable.type === 'expression' && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <label htmlFor={`var-formula-${idx}`} style={{ fontSize: '11px' }}>Math Formula (e.g. A + B)</label>
                          <input
                            id={`var-formula-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={variable.formula || ''}
                            onChange={(e) => updateVariable(idx, 'formula', e.target.value)}
                          />
                        </div>
                      )}

                      {variable.type === 'list' && (
                        <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label htmlFor={`var-items-${idx}`} style={{ fontSize: '11px', margin: 0 }}>Comma separated list</label>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery(`variable_items_${idx}`, Array.isArray(variable.items) ? variable.items.join(', ') : (variable.items || ''))}
                            >
                              📷 Gallery
                            </button>
                          </div>
                          <input
                            id={`var-items-${idx}`}
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={Array.isArray(variable.items) ? variable.items.join(', ') : (variable.items || '')}
                            onChange={(e) => updateVariable(idx, 'items', e.target.value.split(',').map(s => s.trim()))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {template.variables.length === 0 && (
                  <p className={styles.emptyStateText} style={{ padding: '12px' }}>No variables declared. Constants will be evaluated.</p>
                )}
              </div>

              {/* Visual Binding */}
              <div className={styles.sectionTitle}>
                <span>Visual SVG Model Binding</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-visual-select">Select Visual Model</label>
                <select
                  id="tpl-visual-select"
                  className={styles.select}
                  value={template.visuals?.[0]?.component || ''}
                  onChange={(e) => handleSelectVisualComponent(e.target.value)}
                >
                  {VISUAL_COMPONENTS.map(c => (
                    <option key={c.value} value={c.value}>{c.name}</option>
                  ))}
                </select>
              </div>

              {(template.visuals || []).length > 0 && (
                <div className={styles.visualCard}>
                  <div className={styles.visualCardHeader}>
                    <span className={styles.visualTitle}>Configuring: {template.visuals[0].component}</span>
                  </div>
                  
                  {template.visuals[0].component === 'TenFrame' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-filled">Filled counters</label>
                        <input
                          id="ten-filled"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.filledCount || ''}
                          onChange={(e) => updateVisualProp('filledCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-crossed">Crossed out</label>
                        <input
                          id="ten-crossed"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.crossedOutCount || ''}
                          onChange={(e) => updateVisualProp('crossedOutCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="ten-color">Counter color</label>
                        <select
                          id="ten-color"
                          className={styles.select}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.color || 'red'}
                          onChange={(e) => updateVisualProp('color', e.target.value)}
                        >
                          {COLORS_LIST.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                       <div className={styles.propRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                        <input
                          id="ten-click-to-fill"
                          type="checkbox"
                          checked={Boolean(template.visuals[0].props?.clickToFill === true || template.visuals[0].props?.clickToFill === 'true')}
                          onChange={(e) => updateVisualProp('clickToFill', e.target.checked)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <label htmlFor="ten-click-to-fill" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                          Click to Fill (Interactive)
                        </label>
                      </div>
                      {Boolean(template.visuals[0].props?.clickToFill === true || template.visuals[0].props?.clickToFill === 'true') && template.optionsType !== 'fillInTheBlank' && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                          ⚠️ Set Options Type to <strong>Fill-In-The-Blank (FIB)</strong> in Question Contents below. This hides multiple-choice options for the interactive click-to-fill mode.
                        </div>
                      )}
                    </>
                  )}

                  {template.visuals[0].component === 'JarOfMarbles' && (
                    <>
                      <div className={styles.propGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-colA" style={{ width: 'auto', marginRight: '6px' }}>Color A</label>
                            <select
                              id="jar-colA"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorA || 'blue'}
                              onChange={(e) => updateVisualProp('colorA', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-cntA" style={{ width: 'auto', marginRight: '6px' }}>Count A</label>
                            <input
                              id="jar-cntA"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.countA || ''}
                              onChange={(e) => updateVisualProp('countA', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-colB" style={{ width: 'auto', marginRight: '6px' }}>Color B</label>
                            <select
                              id="jar-colB"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorB || 'red'}
                              onChange={(e) => updateVisualProp('colorB', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="jar-cntB" style={{ width: 'auto', marginRight: '6px' }}>Count B</label>
                            <input
                              id="jar-cntB"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.countB || ''}
                              onChange={(e) => updateVisualProp('countB', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {template.visuals[0].component === 'Spinner' && (
                    <>
                      <div className={styles.propGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-colA" style={{ width: 'auto', marginRight: '6px' }}>Color A</label>
                            <select
                              id="spin-colA"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorA || 'blue'}
                              onChange={(e) => updateVisualProp('colorA', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-secA" style={{ width: 'auto', marginRight: '6px' }}>Sectors A</label>
                            <input
                              id="spin-secA"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.sectorsA || ''}
                              onChange={(e) => updateVisualProp('sectorsA', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-colB" style={{ width: 'auto', marginRight: '6px' }}>Color B</label>
                            <select
                              id="spin-colB"
                              className={styles.select}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.colorB || 'green'}
                              onChange={(e) => updateVisualProp('colorB', e.target.value)}
                            >
                              {COLORS_LIST.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.propRow}>
                            <label htmlFor="spin-secB" style={{ width: 'auto', marginRight: '6px' }}>Sectors B</label>
                            <input
                              id="spin-secB"
                              type="text"
                              className={styles.input}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={template.visuals[0].props?.sectorsB || ''}
                              onChange={(e) => updateVisualProp('sectorsB', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {template.visuals[0].component === 'ItemCounter' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="item-count">Item Count</label>
                        <input
                          id="item-count"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.count || ''}
                          onChange={(e) => updateVisualProp('count', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="item-width">Custom Width (px)</label>
                        <input
                          id="item-width"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.width || ''}
                          onChange={(e) => updateVisualProp('width', e.target.value)}
                          placeholder="e.g. 90"
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="item-type" style={{ margin: 0 }}>Item Type</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setUseCustomItemType(!useCustomItemType)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              {useCustomItemType ? 'Use Select' : 'Enter Custom / Gallery'}
                            </button>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery('itemType', template.visuals[0].props?.itemType)}
                            >
                              📷 Gallery
                            </button>
                          </div>
                        </div>
                        {useCustomItemType ? (
                          <LabelledListEditor
                            value={template.visuals[0].props?.itemType || ''}
                            onChange={(val) => updateVisualProp('itemType', val)}
                            placeholder="e.g. cupcake or url1, url2"
                          />
                        ) : (
                          <select
                            id="item-type"
                            className={styles.select}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.itemType || 'cupcake'}
                            onChange={(e) => updateVisualProp('itemType', e.target.value)}
                          >
                            <option value="cupcake">cupcake</option>
                            <option value="apple">apple</option>
                            <option value="star">star</option>
                            <option value="random">random (selects randomly)</option>
                            {template.variables.map(v => (
                              <option key={v.name} value={v.name}>variable: {v.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-show-numbers"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.showNumbers === true || template.visuals[0].props?.showNumbers === 'true' || template.visuals[0].props?.showNumbers === 1)}
                            onChange={(e) => updateVisualProp('showNumbers', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-show-numbers" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Show Numbers Overlay
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-hide-images"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.hideImages === true || template.visuals[0].props?.hideImages === 'true')}
                            onChange={(e) => updateVisualProp('hideImages', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-hide-images" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Hide Images (Show Numbers Only)
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            id="item-not-clickable"
                            type="checkbox"
                            checked={Boolean(template.visuals[0].props?.notClickable === true || template.visuals[0].props?.notClickable === 'true')}
                            onChange={(e) => updateVisualProp('notClickable', e.target.checked)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <label htmlFor="item-not-clickable" style={{ fontSize: '12px', fontWeight: 650, color: '#334155', cursor: 'pointer', margin: 0 }}>
                            Not Clickable (Disable Interaction)
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                  {template.visuals[0].component === 'Image' && (
                    <>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="img-url" style={{ margin: 0 }}>Image URL</label>
                          <button
                            type="button"
                            className={styles.btn + ' ' + styles.btnSecondary}
                            style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                            onClick={() => openGallery('imageUrl', template.visuals[0].props?.imageUrl)}
                          >
                            📷 Gallery
                          </button>
                        </div>
                        <LabelledListEditor
                          value={template.visuals[0].props?.imageUrl || ''}
                          onChange={(val) => updateVisualProp('imageUrl', val)}
                          placeholder="e.g. https://domain.com/img.png or url1, url2"
                        />
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="img-width">Width</label>
                        <input
                          id="img-width"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.width || '200'}
                          placeholder="e.g. 200 or 200px"
                          onChange={(e) => updateVisualProp('width', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* VisualChoice props — which shows N? */}
                  {template.visuals[0].component === 'VisualChoice' && (
                    <>
                      <div className={styles.propRow}>
                        <label htmlFor="vc-correct-count">Correct Count (variable)</label>
                        <input
                          id="vc-correct-count"
                          type="text"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.correctCount || 'A'}
                          placeholder="e.g. A"
                          onChange={(e) => updateVisualProp('correctCount', e.target.value)}
                        />
                      </div>
                      <div className={styles.propRow} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="vc-item-type" style={{ margin: 0 }}>Item Type</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setUseCustomItemType(!useCustomItemType)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              {useCustomItemType ? 'Use Select' : 'Enter Custom / Gallery'}
                            </button>
                            <button
                              type="button"
                              className={styles.btn + ' ' + styles.btnSecondary}
                              style={{ padding: '2px 6px', fontSize: '11px', height: 'auto' }}
                              onClick={() => openGallery('itemType', template.visuals[0].props?.itemType)}
                            >
                              📷 Gallery
                            </button>
                          </div>
                        </div>
                        {useCustomItemType ? (
                          <LabelledListEditor
                            value={template.visuals[0].props?.itemType || ''}
                            onChange={(val) => updateVisualProp('itemType', val)}
                            placeholder="e.g. strawberry or label::https://url"
                          />
                        ) : (
                          <select
                            id="vc-item-type"
                            className={styles.select}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.itemType || 'cupcake'}
                            onChange={(e) => updateVisualProp('itemType', e.target.value)}
                          >
                            <option value="cupcake">cupcake</option>
                            <option value="apple">apple</option>
                            <option value="star">star</option>
                          </select>
                        )}
                      </div>
                      <div className={styles.propRow}>
                        <label htmlFor="vc-distractor-mode">Distractor Mode</label>
                        <select
                          id="vc-distractor-mode"
                          className={styles.select}
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={template.visuals[0].props?.distractorMode || 'auto'}
                          onChange={(e) => updateVisualProp('distractorMode', e.target.value)}
                        >
                          <option value="auto">auto (random ±1-3)</option>
                          <option value="manual">manual (set distractorCount)</option>
                        </select>
                      </div>
                      {template.visuals[0].props?.distractorMode === 'manual' && (
                        <div className={styles.propRow}>
                          <label htmlFor="vc-distractor-count">Wrong Count</label>
                          <input
                            id="vc-distractor-count"
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            value={template.visuals[0].props?.distractorCount || '1'}
                            placeholder="e.g. 1 or B"
                            onChange={(e) => updateVisualProp('distractorCount', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Auto-set optionsType when VisualChoice component is selected */}
                      {template.optionsType !== 'visual_choice' && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                          ⚠️ Set Options Type to <strong>Visual Choice</strong> in Question Contents below for this to work.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Question Layout and Text */}
              <div className={styles.sectionTitle}>
                <span>Question Contents</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tpl-question-text">Question Text</label>
                <input
                  id="tpl-question-text"
                  type="text"
                  className={styles.input}
                  value={template.questionText || ''}
                  placeholder="e.g. What is [A] minus [B]?"
                  onChange={(e) => updateField('questionText', e.target.value)}
                />
              </div>

              {/* Options Type Selector */}
              <div className={styles.formGroup}>
                <label htmlFor="options-type">Options Type</label>
                <select
                  id="options-type"
                  className={styles.select}
                  value={template.optionsType || 'mcq'}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField('optionsType', val);
                    // Auto-switch visual component when visual_choice is selected
                    if (val === 'visual_choice' && template.visuals[0]?.component !== 'VisualChoice') {
                      const vc = VISUAL_COMPONENTS.find(c => c.value === 'VisualChoice');
                      if (vc) updateField('visuals', [{ component: 'VisualChoice', props: { ...vc.props } }]);
                    }
                  }}
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="fillInTheBlank">Fill-In-The-Blank (FIB)</option>
                  <option value="categorizationv2">Categorization / Drag & Drop</option>
                  <option value="visual_choice">Visual Choice (Which shows N?)</option>
                  <option value="hotspot_select">Interactive Hotspot (Click Image)</option>
                </select>
              </div>

              {/* Hotspot Canvas Editor — only show for hotspot_select */}
              {template.optionsType === 'hotspot_select' && (() => {
                const partIdx = Array.isArray(template.parts) ? template.parts.findIndex(p => p.type === 'hotspot_canvas') : -1;
                const part = partIdx >= 0 ? template.parts[partIdx] : null;
                if (!part) return null;
                
                const hotspots = part.hotspots || [];
                const bgUrl = part.backgroundUrl || part.backgroundImage || '';

                const updatePartProp = (propName, propVal) => {
                  const newParts = [...template.parts];
                  newParts[partIdx] = {
                    ...newParts[partIdx],
                    [propName]: propVal
                  };
                  updateField('parts', newParts);
                };

                const updateHotspotProp = (hsIndex, propName, propVal) => {
                  const newHotspots = [...hotspots];
                  newHotspots[hsIndex] = {
                    ...newHotspots[hsIndex],
                    [propName]: propVal
                  };
                  updatePartProp('hotspots', newHotspots);
                };

                return (
                  <div className={styles.visualCard} style={{ background: '#f5f3ff', border: '1px solid #c084fc', marginBottom: '20px' }}>
                    <div className={styles.visualCardHeader} style={{ background: '#ede9fe', padding: '10px 14px', borderBottom: '1px solid #ddd6fe' }}>
                      <span className={styles.visualTitle} style={{ color: '#6d28d9', fontSize: '13px', fontWeight: 'bold' }}>🎯 Interactive Hotspot Zones Mapper</span>
                    </div>

                    <div className={styles.panelBody} style={{ padding: '14px' }}>
                      <div className={styles.formGroup} style={{ marginTop: '0px', marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4c1d95', display: 'block', marginBottom: '4px' }}>
                          Background Image URL (Map Canvas)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className={styles.input}
                            style={{ padding: '8px 10px', fontSize: '13px' }}
                            value={bgUrl}
                            placeholder="Enter image URL or placeholder like [resolved_image]..."
                            onChange={e => updatePartProp('backgroundUrl', e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.btn + ' ' + styles.btnSecondary}
                            onClick={() => openGallery('backgroundUrl', bgUrl)}
                            style={{ padding: '8px 12px' }}
                          >
                            🖼️ Gallery
                          </button>
                        </div>
                      </div>

                      {/* Dynamic SVG Scene Composition Controls */}
                      <div style={{ marginTop: '12px', marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="checkbox"
                            id="use-dynamic-compose"
                            checked={Boolean(part.composeScene)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updatePartProp('composeScene', {
                                  containerType: 'box',
                                  targetClipart: '',
                                  placements: ['[placement_0]', '[placement_1]']
                                });
                              } else {
                                const newParts = [...template.parts];
                                const updatedPart = { ...newParts[partIdx] };
                                delete updatedPart.composeScene;
                                newParts[partIdx] = updatedPart;
                                updateField('parts', newParts);
                              }
                            }}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <label htmlFor="use-dynamic-compose" style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>
                            ✨ Use Dynamic SVG Scene Composition (No Static Images)
                          </label>
                        </div>

                        {part.composeScene && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Container Type</label>
                                <select
                                  className={styles.select}
                                  style={{ padding: '6px 8px', fontSize: '12px', marginTop: '3px', width: '100%' }}
                                  value={part.composeScene.containerType || 'box'}
                                  onChange={(e) => {
                                    updatePartProp('composeScene', {
                                      ...part.composeScene,
                                      containerType: e.target.value
                                    });
                                  }}
                                >
                                  <option value="box">Box (Rounded Rect)</option>
                                  <option value="bowl">Bowl (Blue curved bowl)</option>
                                  <option value="basket">Basket (Woven basket with handle)</option>
                                  <option value="circle">Circle / Ring (Dashed target ellipse)</option>
                                  <option value="plate">Plate / Table (Flat grey plate)</option>
                                  <option value="house">House (Cottage shape with roof)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Clipart URL / Variable</label>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                                  <input
                                    type="text"
                                    className={styles.input}
                                    style={{ padding: '6px 8px', fontSize: '12px', width: '100%' }}
                                    placeholder="e.g. [animal_img] or URL"
                                    value={part.composeScene.targetClipart || ''}
                                    onChange={(e) => {
                                      updatePartProp('composeScene', {
                                        ...part.composeScene,
                                        targetClipart: e.target.value
                                      });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={styles.btn + ' ' + styles.btnSecondary}
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => openGallery('composeScene.targetClipart', part.composeScene.targetClipart || '')}
                                  >
                                    🖼️
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                Placements (For Hotspot Zone 1 and Zone 2)
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {hotspots.map((hs, i) => {
                                  const placementsArr = Array.isArray(part.composeScene.placements) ? part.composeScene.placements : [];
                                  const currentVal = placementsArr[i] || '';
                                  return (
                                    <div key={i}>
                                      <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: 500 }}>
                                        {hs.label || `Zone ${i+1}`} Placement:
                                      </span>
                                      <input
                                        type="text"
                                        className={styles.input}
                                        style={{ padding: '5px 8px', fontSize: '11px', marginTop: '3px', width: '100%' }}
                                        placeholder="e.g. [placement_0], inside, outside, empty"
                                        value={currentVal}
                                        onChange={(e) => {
                                          const newPlacements = [...placementsArr];
                                          while (newPlacements.length <= i) {
                                            newPlacements.push('');
                                          }
                                          newPlacements[i] = e.target.value;
                                          updatePartProp('composeScene', {
                                            ...part.composeScene,
                                            placements: newPlacements
                                          });
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', background: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                        {/* Left: Graphic coordinate helper */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>Visual Zones Preview</span>
                          <div style={{
                            position: 'relative',
                            width: '200px',
                            height: '128px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f8fafc',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            {bgUrl && !bgUrl.includes('[') ? (
                              <img src={bgUrl} alt="Background map" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '9px', textAlign: 'center', padding: '8px' }}>
                                {bgUrl ? `Evaluating: ${bgUrl}` : 'No image loaded'}
                              </div>
                            )}
                            {hotspots.map((hs, i) => (
                              <div
                                key={i}
                                onClick={() => setActiveHsIdx(i)}
                                style={{
                                  position: 'absolute',
                                  left: `${(hs.x / 500) * 100}%`,
                                  top: `${(hs.y / 320) * 100}%`,
                                  width: `${(hs.width / 500) * 100}%`,
                                  height: `${(hs.height / 320) * 100}%`,
                                  border: activeHsIdx === i ? '2px solid #4f46e5' : '1px dashed #64748b',
                                  background: activeHsIdx === i ? 'rgba(79, 70, 229, 0.25)' : 'rgba(100, 116, 139, 0.1)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  color: activeHsIdx === i ? '#4f46e5' : '#64748b',
                                  fontWeight: 'bold',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {hs.label || `Z${i+1}`}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px' }}>Click zone to select it</span>
                        </div>

                        {/* Right: Coordinates Sliders for active zone */}
                        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {hotspots[activeHsIdx] ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '12px', color: '#4f46e5' }}>
                                  Edit Box: {hotspots[activeHsIdx].label || `Zone ${activeHsIdx + 1}`}
                                </span>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                                  onClick={() => {
                                    const newHs = hotspots.filter((_, i) => i !== activeHsIdx);
                                    updatePartProp('hotspots', newHs);
                                    setActiveHsIdx(Math.max(0, activeHsIdx - 1));
                                  }}
                                >
                                  Delete Zone
                                </button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div>
                                  <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>Zone Label</label>
                                  <input
                                    type="text"
                                    className={styles.input}
                                    style={{ padding: '4px 6px', fontSize: '11px' }}
                                    value={hotspots[activeHsIdx].label || ''}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'label', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>Option Index</label>
                                  <input
                                    type="number"
                                    className={styles.input}
                                    style={{ padding: '4px 6px', fontSize: '11px' }}
                                    value={hotspots[activeHsIdx].optionIndex}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'optionIndex', Number(e.target.value))}
                                  />
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600, color: '#475569' }}>
                                  <span>Horiz Position (X):</span>
                                  <span>{hotspots[activeHsIdx].x}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="500"
                                  value={hotspots[activeHsIdx].x}
                                  onChange={e => updateHotspotProp(activeHsIdx, 'x', Number(e.target.value))}
                                  style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                />
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600, color: '#475569' }}>
                                  <span>Vert Position (Y):</span>
                                  <span>{hotspots[activeHsIdx].y}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="320"
                                  value={hotspots[activeHsIdx].y}
                                  onChange={e => updateHotspotProp(activeHsIdx, 'y', Number(e.target.value))}
                                  style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                                    <span>Width:</span>
                                    <span>{hotspots[activeHsIdx].width}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={hotspots[activeHsIdx].width}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'width', Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 600 }}>
                                    <span>Height:</span>
                                    <span>{hotspots[activeHsIdx].height}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="320"
                                    value={hotspots[activeHsIdx].height}
                                    onChange={e => updateHotspotProp(activeHsIdx, 'height', Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#4f46e5', margin: '2px 0' }}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                              No active zone. Click Add Zone.
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnSecondary}
                        style={{ marginTop: '12px', width: '100%', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          const newHs = [
                            ...hotspots,
                            {
                              id: `zone_${hotspots.length + 1}`,
                              label: `Zone ${hotspots.length + 1}`,
                              x: 50,
                              y: 50,
                              width: 100,
                              height: 100,
                              optionIndex: hotspots.length
                            }
                          ];
                          updatePartProp('hotspots', newHs);
                          setActiveHsIdx(newHs.length - 1);
                        }}
                      >
                        + Add Bounding Box Zone
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Options — show for MCQ and Hotspot */}
              {(template.optionsType === 'mcq' || template.optionsType === 'hotspot_select') && (
              <div className={styles.formGroup}>
                <label>Choices (Multiple Choice Options)</label>
                {template.options.map((opt, idx) => (
                  <div key={idx} className={styles.optionRow}>
                    <input
                      type="text"
                      className={styles.input + ' ' + styles.optionInput}
                      value={opt.label || opt.value || ''}
                      placeholder={`Choice ${idx + 1}`}
                      onChange={(e) => updateOption(idx, 'label', e.target.value)}
                    />
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect || false}
                        onChange={(e) => updateOption(idx, 'isCorrect', e.target.checked)}
                      />
                      Correct
                    </label>
                    {template.options.length > 2 && (
                      <button
                        type="button"
                        className={styles.btnRemoveOption}
                        onClick={() => {
                          const newOpts = template.options.filter((_, i) => i !== idx);
                          updateField('options', newOpts);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnSecondary}
                  style={{ marginTop: '8px' }}
                  onClick={() => {
                    updateField('options', [...template.options, { label: '', isCorrect: false }]);
                  }}
                >
                  + Add Choice
                </button>
              </div>
              )}

              {/* Explanation */}
              <div className={styles.formGroup}>
                <label htmlFor="tpl-explanation">Step-by-step Solution Explanation</label>
                <textarea
                  id="tpl-explanation"
                  className={styles.textarea}
                  value={template.explanation?.sections?.[0]?.content || ''}
                  placeholder="Use variables like [A], [B], [Result] in explanation text."
                  onChange={(e) => {
                    updateField('explanation', {
                      sections: [{ type: 'text', content: e.target.value }]
                    });
                  }}
                />
              </div>

              {renderCurriculumLinkerCard()}

              {/* Save Button */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnPrimary}
                  style={{ flex: 1, padding: '12px' }}
                  onClick={handleSave}
                  disabled={saving || (!!selectedId && staticList.some(s => s.id === selectedId))}
                >
                  {saving ? 'Saving to Database...' : 'Save Template to MongoDB'}
                </button>
              </div>

              {saveStatus && (
                <div className={`${styles.statusBar} ${saveStatus.type === 'success' ? styles.statusSuccess : styles.statusError}`}>
                  {saveStatus.text}
                </div>
              )}
              {selectedId && staticList.some(s => s.id === selectedId) && (
                <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '6px', textAlign: 'center' }}>
                  ⚠️ Static catalogs are read-only. Click "Create New Template" or change the Template ID to save a custom copy.
                </p>
              )}
              </>
            )}
            </div>
          </section>

          {/* Simulator Preview Card */}
          <section className={`${styles.panel} ${styles.simulator}`}>
            <div className={styles.panelHeader}>
              <div className={styles.simulatorHeader}>
                <h2>Live Simulator Preview</h2>
                <div className={styles.seedSelector}>
                  <label htmlFor="sim-seed" style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Seed</label>
                  <input
                    id="sim-seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.btn + ' ' + styles.btnSecondary}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => setSeed(String(Math.floor(Math.random() * 100000)))}
                  >
                    🎲 New Seed
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.panelBody}>
              {evaluatedQuestion.ok ? (
                <div className={styles.previewContainer}>
                  <div className={styles.practicePrompt}>
                    {evaluatedQuestion.question.questionText}
                  </div>

                  {/* Render Visual Parts (SVG / image / visual_panel / categorization / fill-in-the-blank) */}
                  {(() => {
                    const q = evaluatedQuestion.question;
                    const isVisualChoice = q.type === 'visual_choice';
                    const isCategorization = q.type === 'categorizationv2' || q.type === 'categorization';
                    const panels = q.parts.filter(p => p.type === 'visual_panel');

                    return (
                      <>
                        {/* Categorization (Drag & Drop) Preview */}
                        {isCategorization && (
                          <div style={{ marginTop: '20px', width: '100%' }}>
                            {/* Categories Columns */}
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                              {(q.categories || []).map((cat, idx) => {
                                const catItems = (q.items || []).filter(item => {
                                  const ansKey = q.answer || q.answerKey || {};
                                  return ansKey[item.id] === cat.id || item.target === cat.id;
                                });

                                return (
                                  <div
                                    key={cat.id || idx}
                                    style={{
                                      flex: 1,
                                      minWidth: '180px',
                                      maxWidth: '300px',
                                      background: '#f8fafc',
                                      border: '2px dashed #cbd5e1',
                                      borderRadius: '12px',
                                      padding: '16px',
                                      textAlign: 'center',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', fontSize: '14px' }}>
                                      {cat.label}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minHeight: '80px', justifyContent: 'center' }}>
                                      {catItems.map((item, itemIdx) => (
                                        <div
                                          key={item.id || itemIdx}
                                          style={{
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            color: '#334155',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            fontWeight: 600
                                          }}
                                        >
                                          {item.content || item.label}
                                        </div>
                                      ))}
                                      {catItems.length === 0 && (
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Drop zone</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Items Tray */}
                            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                Drag Items (Correct assignments shown above)
                              </div>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {(q.items || []).map((item, idx) => (
                                  <div
                                    key={item.id || idx}
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '8px 16px',
                                      fontSize: '13px',
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                      cursor: 'grab'
                                    }}
                                  >
                                    {item.content || item.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* General Parts-based rendering (FIB, etc.) */}
                        {!isVisualChoice && !isCategorization && Array.isArray(q.parts) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', margin: '12px 0' }}>
                            {q.parts.map((p, idx) => {
                              if (p.type === 'text') {
                                return (
                                  <div key={idx} style={{ fontSize: '16px', color: '#1e293b', lineHeight: '1.6' }}>
                                    {p.content && typeof p.content === 'string' && p.content.includes('[[') ? (
                                      <span>
                                        {p.content.split(/(\[\[.*?\]\])/g).map((chunk, cIdx) => {
                                          if (chunk.startsWith('[[') && chunk.endsWith(']]')) {
                                            const key = chunk.slice(2, -2).trim();
                                            const correctVal = q.answer?.[key] || q.correctAnswer?.[key] || '';
                                            return (
                                              <input
                                                key={cIdx}
                                                type="text"
                                                value={correctVal}
                                                disabled
                                                style={{
                                                  width: `${Math.max(String(correctVal).length * 10 + 20, 60)}px`,
                                                  padding: '4px 8px',
                                                  margin: '0 4px',
                                                  border: '2px solid #22c55e',
                                                  borderRadius: '6px',
                                                  textAlign: 'center',
                                                  fontWeight: 'bold',
                                                  color: '#15803d',
                                                  background: '#f0fdf4'
                                                }}
                                              />
                                            );
                                          }
                                          return chunk;
                                        })}
                                      </span>
                                    ) : (
                                      p.content
                                    )}
                                  </div>
                                );
                              }
                              if (p.type === 'latex') {
                                return (
                                  <div key={idx} style={{ fontSize: '18px', fontFamily: 'math', margin: '4px 0', color: '#0f172a' }}>
                                    {p.content}
                                  </div>
                                );
                              }
                              if (p.type === 'svg') {
                                return (
                                  <div
                                    key={idx}
                                    className={styles.svgWrapper}
                                    dangerouslySetInnerHTML={{ __html: p.content }}
                                  />
                                );
                              }
                              if (p.type === 'image') {
                                const widthVal = p.commonImageWidth || p.maxWidth || '180px';
                                const resolvedWidth = typeof widthVal === 'number' ? `${widthVal}px` : widthVal;
                                return (
                                  <div
                                    key={idx}
                                    className={styles.svgWrapper}
                                    style={{ margin: '15px auto', display: 'flex', justifyContent: 'center' }}
                                  >
                                    <img
                                      src={p.imageUrl}
                                      alt="Template Visual"
                                      style={{ width: resolvedWidth, maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                  </div>
                                );
                              }
                              if (p.type === 'categorization' || p.type === 'categorizationv2' || p.type === 'drag_drop') {
                                return (
                                  <div key={idx} style={{ marginTop: '10px', width: '100%' }}>
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                                      {(p.categories || []).map((cat, catIdx) => {
                                        const catItems = (p.items || []).filter(item => {
                                          const ansKey = p.answer || p.answerKey || {};
                                          return ansKey[item.id] === cat.id || item.target === cat.id;
                                        });
                                        return (
                                          <div
                                            key={cat.id || catIdx}
                                            style={{
                                              flex: 1,
                                              minWidth: '180px',
                                              maxWidth: '300px',
                                              background: '#f8fafc',
                                              border: '2px dashed #cbd5e1',
                                              borderRadius: '12px',
                                              padding: '16px',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '12px', fontSize: '14px' }}>{cat.label}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px', justifyContent: 'center' }}>
                                              {catItems.map((item, itemIdx) => (
                                                <div
                                                  key={item.id || itemIdx}
                                                  style={{
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px',
                                                    color: '#334155',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                    fontWeight: 600
                                                  }}
                                                >
                                                  {item.content || item.label}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {(p.items || []).map((item, itemIdx) => (
                                          <div
                                            key={item.id || itemIdx}
                                            style={{
                                              background: '#ffffff',
                                              border: '1px solid #cbd5e1',
                                              borderRadius: '8px',
                                              padding: '8px 16px',
                                              fontSize: '13px',
                                              fontWeight: 600,
                                              color: '#1e293b'
                                            }}
                                          >
                                            {item.content || item.label}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              if (p.type === 'hotspot_canvas') {
                                const bgUrl = p.backgroundUrl || p.backgroundImage;
                                const w = p.canvasWidth || 500;
                                const h = p.canvasHeight || 320;
                                const hotspotsList = p.hotspots || [];
                                
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: 'relative',
                                      width: '100%',
                                      maxWidth: `${w}px`,
                                      aspectRatio: `${w} / ${h}`,
                                      margin: '20px auto',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      background: '#f8fafc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}
                                  >
                                    {p.backgroundSvg ? (
                                      <div
                                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                                        dangerouslySetInnerHTML={{ __html: p.backgroundSvg }}
                                      />
                                    ) : bgUrl ? (
                                      <img
                                        src={bgUrl}
                                        alt="Hotspot Background"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
                                      />
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', zIndex: 1 }}>
                                        No background image or SVG specified
                                      </span>
                                    )}
                                    {/* Overlay Hotspots */}
                                    {hotspotsList.map((hs, hsIdx) => {
                                      // Scale coordinate factors relative to nominal size (w, h)
                                      const leftPercent = (hs.x / w) * 100;
                                      const topPercent = (hs.y / h) * 100;
                                      const widthPercent = (hs.width / w) * 100;
                                      const heightPercent = (hs.height / h) * 100;
                                      
                                      return (
                                        <div
                                          key={hs.id || hsIdx}
                                          style={{
                                            position: 'absolute',
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: `${heightPercent}%`,
                                            border: '2px dashed #4f46e5',
                                            borderRadius: '6px',
                                            background: 'rgba(79, 70, 229, 0.12)',
                                            color: '#4f46e5',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.15s ease',
                                            zIndex: 2,
                                            boxSizing: 'border-box'
                                          }}
                                        >
                                          <span>{hs.label || `Zone ${hsIdx + 1}`}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}

                        {/* Visual Choice Panels */}
                        {isVisualChoice && panels.length > 0 && (
                          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
                            {panels.map((panel, idx) => {
                              const isCorrect = idx === q.correctAnswerIndex;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    border: isCorrect ? '3px solid #22c55e' : '2px solid #93c5fd',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    background: '#ffffff',
                                    position: 'relative',
                                    boxShadow: isCorrect
                                      ? '0 4px 16px rgba(34, 197, 94, 0.2)'
                                      : '0 2px 8px rgba(147, 197, 253, 0.2)',
                                    cursor: 'pointer',
                                    minWidth: '140px'
                                  }}
                                >
                                  <div
                                    dangerouslySetInnerHTML={{ __html: panel.svg }}
                                    style={{ display: 'block' }}
                                  />
                                  {isCorrect && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                      background: '#22c55e',
                                      color: '#ffffff',
                                      borderRadius: '99px',
                                      padding: '2px 8px',
                                      fontSize: '10px',
                                      fontWeight: 800
                                    }}>
                                      ✓ Correct
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Render Text MCQ Options (hidden for visual_choice / categorization) */}
                  {evaluatedQuestion.question.type !== 'visual_choice' && evaluatedQuestion.question.type !== 'categorizationv2' && evaluatedQuestion.question.type !== 'categorization' && (
                  <div className={styles.optionsContainer}>
                    {evaluatedQuestion.question.options.map((opt, idx) => {
                      const isCorrect = idx === evaluatedQuestion.question.correctAnswerIndex;
                      return (
                        <div
                          key={opt.id}
                          className={`${styles.optionBtn} ${isCorrect ? styles.optionBtnCorrect : ''}`}
                        >
                          <span>{opt.label}</span>
                          {isCorrect && <span className={styles.optionBadge}>Correct</span>}
                        </div>
                      );
                    })}
                  </div>
                  )}

                  {/* Render Explanation */}
                  <div className={styles.explanationBox}>
                    <div className={styles.explanationTitle}>Explanation (Step-by-Step)</div>
                    <p className={styles.explanationText}>
                      {evaluatedQuestion.question.explanation?.sections?.[0]?.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`${styles.statusBar} ${styles.statusError}`} style={{ marginTop: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Evaluation Error:</p>
                  <pre style={{ margin: '8px 0 0 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {evaluatedQuestion.error}
                  </pre>
                  <p style={{ fontSize: '11px', margin: '8px 0 0 0', color: '#991b1b' }}>
                    Make sure formulas refer to defined variables, mathematical expressions evaluate to integers, and there are no syntax loops.
                  </p>
                </div>
              )}

              {/* JSON code viewer */}
              <div className={styles.jsonToggleArea}>
                <button
                  type="button"
                  className={styles.jsonTitle}
                  style={{ background: 'none', border: 'none', width: '100%', textTransform: 'none' }}
                  onClick={() => setShowJson(!showJson)}
                >
                  <span>{showJson ? '▼ Hide Template JSON Recipe' : '▶ Show Template JSON Recipe'}</span>
                </button>
                
                {showJson && (
                  <pre className={styles.codeBlock}>
                    {JSON.stringify(template, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Gallery Modal Dialog */}
      {showGallery && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                Select Gallery Assets (Multi-Select for Randomization)
              </h3>
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {/* Tab Header */}
              <div className={styles.galleryTabs}>
                <button
                  type="button"
                  className={`${styles.galleryTabBtn} ${!isWebSearch ? styles.galleryTabBtnActive : ''}`}
                  onClick={() => setIsWebSearch(false)}
                >
                  📁 Local Gallery Assets
                </button>
                <button
                  type="button"
                  className={`${styles.galleryTabBtn} ${isWebSearch ? styles.galleryTabBtnActive : ''}`}
                  onClick={() => setIsWebSearch(true)}
                >
                  🔍 DuckDuckGo Web Clipart
                </button>
              </div>

              {/* Local Search Controls */}
              {!isWebSearch && (
                <div className={styles.searchBarContainer}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Search local assets by name, tags, or category..."
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {gallerySearch && (
                    <button
                      type="button"
                      className={styles.btn + ' ' + styles.btnSecondary}
                      onClick={() => setGallerySearch('')}
                      style={{ padding: '8px 12px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Web Search Controls */}
              {isWebSearch && (
                <form onSubmit={handleWebSearch} className={styles.searchBarContainer}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Search transparent clipart on the web (e.g. apple, dog, tree)..."
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <select
                    className={styles.webSearchSelect}
                    value={webSearchType}
                    onChange={(e) => setWebSearchType(e.target.value)}
                  >
                    <option value="clipart">🎨 Clipart</option>
                    <option value="photo">📷 Photo</option>
                    <option value="any">🌐 Any</option>
                  </select>
                  <button
                    type="submit"
                    className={styles.btn + ' ' + styles.btnPrimary}
                    disabled={webSearching || !webSearchQuery.trim()}
                  >
                    {webSearching ? 'Searching...' : 'Search Web'}
                  </button>
                </form>
              )}

              {/* Content Grid */}
              {!isWebSearch ? (
                // Local Gallery View
                galleryLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontWeight: 600 }}>
                    Loading gallery images...
                  </div>
                ) : galleryImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    No uploaded images found in the gallery. Use the Main Admin Console to upload image assets.
                  </div>
                ) : filteredLocalImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    No matching local assets found for "{gallerySearch}".
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {filteredLocalImages.map((img) => {
                      const isSelected = selectedGalleryUrls.includes(img.url);
                      const selIdx = selectedGalleryUrls.indexOf(img.url);
                      const currentLabel = galleryImageLabels[img.url] || '';
                      return (
                        <div
                          key={img.key}
                          style={{
                            border: isSelected ? '3px solid #4f46e5' : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: isSelected ? '#f5f3ff' : '#ffffff',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none'
                          }}
                        >
                          {/* Clickable image area */}
                          <div
                            onClick={() => handleSelectGalleryImage(img.url)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '8px' }}>
                              <img
                                src={img.url}
                                alt={img.key}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #f1f5f9' }}>
                              {img.classification?.tags?.[0] || img.key.split('/').pop().replace(/\.[^/.]+$/, '').replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ')}
                            </div>
                          </div>

                          {/* Label input — only shown when selected */}
                          {isSelected && (
                            <div style={{ padding: '6px 8px', borderTop: '1px solid #ede9fe', background: '#f5f3ff' }}>
                              <input
                                type="text"
                                value={currentLabel}
                                placeholder="Enter label…"
                                onClick={e => e.stopPropagation()}
                                onChange={e => {
                                  const val = e.target.value;
                                  setGalleryImageLabels(prev => ({ ...prev, [img.url]: val }));
                                }}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  border: '1px solid #c4b5fd',
                                  borderRadius: '6px',
                                  padding: '4px 6px',
                                  fontSize: '11px',
                                  color: '#3730a3',
                                  fontWeight: 600,
                                  background: '#ffffff',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          )}

                          {/* Selection order badge */}
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: '#4f46e5',
                                color: '#ffffff',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {selIdx + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                // Web Search View
                webSearching ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                    <div className={styles.loadingSpinner} />
                    <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Searching DuckDuckGo...</div>
                  </div>
                ) : webResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '14px' }}>
                    Enter a query above to search DuckDuckGo for clipart.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {webResults.map((item) => {
                      const localUrl = importedWebUrls[item.image];
                      const isImported = !!localUrl;
                      const isSelected = isImported && selectedGalleryUrls.includes(localUrl);
                      const selIdx = isSelected ? selectedGalleryUrls.indexOf(localUrl) : -1;
                      const isImporting = importingUrl === item.image;
                      
                      return (
                        <div
                          key={item.image}
                          className={`${styles.webResultCard} ${isImported ? styles.webResultCardImported : ''}`}
                          onClick={() => !isImporting && handleImportWebImage(item.image)}
                          style={{
                            border: isSelected ? '3px solid #4f46e5' : isImported ? '3px solid #10b981' : '1px solid #e2e8f0',
                            opacity: isImporting ? 0.6 : 1,
                            position: 'relative'
                          }}
                        >
                          <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '8px' }}>
                            <img
                              src={item.thumbnail || item.image}
                              alt={item.title}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 600, color: '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #f1f5f9' }}>
                            {item.title || 'Clipart'}
                          </div>
                          
                          {isImporting && (
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, bottom: 0,
                              background: 'rgba(255, 255, 255, 0.8)',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center',
                              zIndex: 10
                            }}>
                              <div className={styles.loadingSpinner} />
                              <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 700, marginTop: '6px', textAlign: 'center', padding: '0 4px' }}>
                                Importing...
                              </span>
                            </div>
                          )}

                          {isImported && !isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              background: '#10b981',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                            }}>
                              Saved
                            </div>
                          )}

                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: '#4f46e5',
                                color: '#ffffff',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {selIdx + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
            
            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Selected: <strong style={{ color: '#4f46e5' }}>{selectedGalleryUrls.length}</strong> asset(s)
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnSecondary}
                  onClick={() => setShowGallery(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.btn + ' ' + styles.btnPrimary}
                  onClick={applyGallerySelection}
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em' }}>
                📖 Project Question Types & Schema Guide
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  opacity: 0.8,
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '12px 24px 0 24px',
              gap: '8px',
              overflowX: 'auto',
            }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                { id: 'fillInTheBlank', label: 'Fill-In-The-Blank (FIB)' },
                { id: 'categorizationv2', label: 'Categorization' },
                { id: 'visual_choice', label: 'Visual Choice' },
                { id: 'covered', label: 'All Covered Types' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveGuideTab(t.id)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: activeGuideTab === t.id ? '#4f46e5' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeGuideTab === t.id ? '3px solid #4f46e5' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    paddingBottom: '12px',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: '#334155',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              {activeGuideTab === 'overview' && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>
                    Adaptive Question Templates Overview
                  </h4>
                  <p>
                    This project uses a <strong>dynamic variable-based template schema</strong> to automatically generate billions of unique educational math and English practice questions. Instead of hardcoding questions, templates define variables (e.g. integer ranges or formulas), visual layouts, and the interactive response mechanism.
                  </p>
                  <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0284c7', padding: '12px 16px', borderRadius: '8px', margin: '16px 0' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#0369a1' }}>💡 Dynamic Previews</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#0c4a6e' }}>
                      Click on any reference tab above to read details, view the JSON schema format, or <strong>instantly load that question type as an active template</strong> to test in the simulator.
                    </p>
                  </div>
                  <h5 style={{ margin: '16px 0 8px 0', color: '#1e293b', fontWeight: 700 }}>Project Core Formats:</h5>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>Multiple Choice (MCQ):</strong> Traditional choices generated from math/text variables.</li>
                    <li><strong>Fill-In-The-Blank (FIB):</strong> Text blocks with inline text input fields using double brackets `[[placeholder]]`.</li>
                    <li><strong>Categorization (Drag & Drop):</strong> Buckets with draggable cards correct-mapped via key-value mappings.</li>
                    <li><strong>Visual Choice:</strong> Clickable side-by-side SVG rendering panels (e.g. Which plate shows 5 apples?).</li>
                  </ul>
                </div>
              )}

              {activeGuideTab === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Multiple Choice (MCQ)</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[0]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load MCQ Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      MCQ questions display question text, an optional visual SVG (like spinners, jars, grids), and a shuffled list of choice buttons.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "mcq",
  "options": [
    { "label": "[Result]", "isCorrect": true },
    { "label": "[Result] + 1", "isCorrect": false }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'fillInTheBlank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Fill-In-The-Blank (FIB)</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[1]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load FIB Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      FIB formats render inline input boxes inside sentence parts. Use double-bracket placeholders like `[[ans]]` inside text parts and specify their targets in the `answer` object.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "fillInTheBlank",
  "parts": [
    { "type": "text", "content": "The sum of [A] and [B] is [[ans]]." }
  ],
  "answer": {
    "ans": "[Result]"
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'categorizationv2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Categorization / Drag & Drop</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[2]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load Categorization Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      Categorization formats render columns (categories) and an items tray. Users drag item cards into the correct category columns. Correct mappings are defined in the root `answer` object.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "categorizationv2",
  "parts": [
    {
      "type": "categorizationv2",
      "categories": [
        { "id": "even", "label": "Even" },
        { "id": "odd", "label": "Odd" }
      ],
      "items": [
        { "id": "item1", "content": "2" },
        { "id": "item2", "content": "3" }
      ]
    }
  ],
  "answer": {
    "item1": "even",
    "item2": "odd"
  }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'visual_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>Visual Choice</h4>
                      <button
                        type="button"
                        className={styles.btn + ' ' + styles.btnPrimary}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          handleSelectTemplate(REFERENCE_EXAMPLES[3]);
                          setShowGuide(false);
                        }}
                      >
                        ⚡ Load Visual Choice Template Example
                      </button>
                    </div>
                    <p style={{ marginTop: '8px' }}>
                      Visual Choice renders side-by-side panels containing dynamic SVGs (e.g. cupcakes or goldfish). One panel contains the correct target count and the other displays a distractor count. The user clicks on the correct panel to answer.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Required JSON Fields:</span>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', margin: '8px 0 0 0', overflowX: 'auto', background: '#e2e8f0', padding: '8px', borderRadius: '4px' }}>
{`{
  "optionsType": "visual_choice",
  "visuals": [
    {
      "component": "VisualChoice",
      "props": {
        "correctCount": "A",
        "itemType": "cupcake",
        "distractorMode": "auto"
      }
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeGuideTab === 'covered' && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px', fontWeight: 800 }}>
                    All Question Types Covered in this Project
                  </h4>
                  <p>
                    The practice system supports various question layouts and styles. Here is a comprehensive list of all formats covered by the system and how they resolve internally:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Question Type / Alias</th>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Renderer Used</th>
                        <th style={{ padding: '10px', fontWeight: 700 }}>Description & Features</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>mcq, multiplechoice, dynamic_pool</td>
                        <td style={{ padding: '10px' }}>MCQRenderer</td>
                        <td style={{ padding: '10px' }}>Shuffles option choices. Supports text choices and dynamic visual SVG panels.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>fillInTheBlank, fill_in_the_blank, gridArithmetic</td>
                        <td style={{ padding: '10px' }}>FillInTheBlankRenderer</td>
                        <td style={{ padding: '10px' }}>Renders inline input boxes inside text parts replacing double brackets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>categorization, categorizationv2, categorySort, sorting</td>
                        <td style={{ padding: '10px' }}>CategorizationRenderer</td>
                        <td style={{ padding: '10px' }}>Interactive columns with drag and drop zone blocks. Mapped via key-value targets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>visual_choice</td>
                        <td style={{ padding: '10px' }}>MCQRenderer (Custom layout)</td>
                        <td style={{ padding: '10px' }}>Side-by-side graphical counter cards where the panels act as response targets.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>interactiveApplet, interactiveTool</td>
                        <td style={{ padding: '10px' }}>Applet/Tool Renderers</td>
                        <td style={{ padding: '10px' }}>Advanced applet modules (like counting sticks, interactive fraction pie, pizza sharing models).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                className={styles.btn + ' ' + styles.btnSecondary}
                onClick={() => setShowGuide(false)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Helper functions for parsing/serializing comma-separated labels and URLs
function parseList(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(item => {
    item = item.trim();
    const sepIdx = item.indexOf('::');
    if (sepIdx !== -1) {
      return {
        label: item.slice(0, sepIdx).trim(),
        value: item.slice(sepIdx + 2).trim()
      };
    }
    return {
      label: '',
      value: item
    };
  }).filter(x => x.value !== '');
}

function serializeList(list) {
  return list.map(item => {
    const label = (item.label || '').trim();
    const val = (item.value || '').trim();
    if (label) {
      return `${label}::${val}`;
    }
    return val;
  }).filter(Boolean).join(', ');
}

function cleanNameFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const parts = url.split('/');
  const filename = parts[parts.length - 1] || '';
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt
    .replace(/^\d+[-_]/, '') // remove leading unix timestamps e.g. 1780656377875-
    .replace(/[-_]/g, ' ') // convert dashes/underscores to spaces
    .trim();
  return cleanName;
}

// Controlled component for editing a list of URLs and their labels
function LabelledListEditor({ value, onChange, placeholder }) {
  const items = parseList(value);

  const handleRowChange = (index, field, newVal) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: newVal };
    onChange(serializeList(newItems));
  };

  const handleAddRow = () => {
    const newItems = [...items, { label: '', value: '' }];
    onChange(serializeList(newItems));
  };

  const handleRemoveRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(serializeList(newItems));
  };

  const handleAutoLabel = () => {
    const newItems = items.map(item => {
      if (item.label) return item; // keep existing label
      const val = item.value.trim();
      if (val.startsWith('http://') || val.startsWith('https://') || val.includes('/') || val.includes('.')) {
        return { ...item, label: cleanNameFromUrl(val) };
      }
      return item;
    });
    onChange(serializeList(newItems));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
      {/* Raw input for easy copy/paste */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Raw Value (comma-separated)</label>
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '6px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            resize: 'vertical',
            outline: 'none',
            background: '#ffffff'
          }}
        />
      </div>

      {/* Structured Rows */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Items & Labels ({items.length})</span>
            <button
              type="button"
              onClick={handleAutoLabel}
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Automatically generate labels from image URLs"
            >
              🪄 Auto-Label URLs
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
            {items.map((item, idx) => {
              const isUrl = typeof item.value === 'string' && (item.value.startsWith('http') || item.value.includes('/') || item.value.includes('.'));
              return (
                <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#ffffff', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {isUrl ? (
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.value} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                      📦
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      value={item.label}
                      placeholder="Label (e.g. Starfish)"
                      onChange={(e) => handleRowChange(idx, 'label', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#1e293b'
                      }}
                    />
                    <input
                      type="text"
                      value={item.value}
                      placeholder="URL or standard item type"
                      onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        color: '#475569',
                        fontFamily: isUrl ? 'monospace' : 'inherit'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '12px',
                      flexShrink: 0
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleAddRow}
        style={{
          background: '#4f46e5',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          alignSelf: 'flex-start'
        }}
      >
        ➕ Add URL / Item Row
      </button>
    </div>
  );
}
