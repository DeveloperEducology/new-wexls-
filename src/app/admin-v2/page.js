'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminConsolePage from '../admin/page';

export default function AdminV2Page() {
  const [adminMode, setAdminMode] = useState('school'); // school, exam
  const [activeTab, setActiveTab] = useState('grade'); // school: grade, subject, unit, chapter, skill. exam: exam, section, topic, skill, question
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // ID of the node currently being edited
  const [generatingStates, setGeneratingStates] = useState({});

  // School filter states
  const [filterGradeId, setFilterGradeId] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [filterUnitId, setFilterUnitId] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');

  // ── School Data Lists ───────────────────────────────────────────────────
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [skills, setSkills] = useState([]);

  // ── Exam Data Lists ─────────────────────────────────────────────────────
  const [exams, setExams] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [filterSkillId, setFilterSkillId] = useState('');
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'json'
  const [jsonInputText, setJsonInputText] = useState('');
  const [jsonGradeId, setJsonGradeId] = useState('');
  const [jsonSubjectId, setJsonSubjectId] = useState('');
  const [jsonChapterId, setJsonChapterId] = useState('');
  const [jsonSkillId, setJsonSkillId] = useState('');

  // Form states (reused for both modes)
  const [formData, setFormData] = useState({
    // Common & School
    id: '',
    title: '',
    icon: '',
    order: 0,
    subjectId: '',
    unitId: '',
    gradeId: '',
    chapterId: '',
    code: '',
    templateId: '',
    engine: '',
    templateLevels: '',
    remediation: '',
    isStatic: false,
    progressionEnabled: false,
    progressionEasy: 3,
    progressionMedium: 7,
    progressionHard: 10,
    
    // Exam metadata
    name: '',
    fullName: '',
    description: '',
    targetClass: 6,
    
    // Section metadata
    sectionId: '',
    sectionName: '',
    shortName: '',
    questionCount: 25,
    maxMarks: 25,
    timeLimitMinutes: 30,
    
    // Topic metadata
    topicId: '',
    
    // Question metadata
    questionText: '',
    questionImageUrl: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanationText: '',
    isPYQ: false,
    pyqYear: '',
    difficulty: 0.5,
    cognitiveLevel: 'recall',
    tags: '',
    metadataSource: '',
    // K-12/IIT Specific Question fields
    questionId: '',
    branchingCorrect: '',
    branchingIncorrect: '',
    isStaticQuestion: true,
    skillId: '',
    
    // Dynamic question formats support
    type: 'mcq',
    blank1Answer: '',
    blank2Answer: '',
    blank3Answer: '',
    blank4Answer: '',
    
    cat1Id: 'even', cat1Label: 'Even Numbers',
    cat2Id: 'odd', cat2Label: 'Odd Numbers',
    cat3Id: '', cat3Label: '',
    cat4Id: '', cat4Label: '',
    
    item1Label: '', item1Cat: '',
    item2Label: '', item2Cat: '',
    item3Label: '', item3Cat: '',
    item4Label: '', item4Cat: '',
    item5Label: '', item5Cat: '',
    item6Label: '', item6Cat: '',
    
    appletComponent: '',
    appletPropsJson: '',
    appletAnswer: '',
  });

  // Difficulty scaling states for skills
  const [skillDifficultyScaling, setSkillDifficultyScaling] = useState(false);
  const [skillTemplateLevels, setSkillTemplateLevels] = useState([
    { level: 1, templateIds: [] },
    { level: 2, templateIds: [] },
    { level: 3, templateIds: [] },
  ]);
  const [levelAddInputs, setLevelAddInputs] = useState({ 1: '', 2: '', 3: '' });

  // Template Search Autocomplete states
  const [allTemplates, setAllTemplates] = useState([]);
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null); // 'primary', '1', '2', '3'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchCollection = async (type) => {
        const isIit = adminMode === 'iit';
        const res = await fetch(`/api/v2/curriculum?type=${type}${isIit ? '&iit=true' : ''}`);
        const data = await res.json();
        return data.success ? data.nodes : [];
      };

      const [gList, sList, uList, cList, skList] = await Promise.all([
        fetchCollection('grade'),
        fetchCollection('subject'),
        fetchCollection('unit'),
        fetchCollection('chapter'),
        fetchCollection('skill'),
      ]);

      setGrades(gList);
      setSubjects(sList);
      setUnits(uList);
      setChapters(cList);
      setSkills(skList);

      // Fetch dynamic templates catalog for autocompletion
      try {
        const templatesRes = await fetch('/api/admin/templates');
        const templatesData = await templatesRes.json();
        if (templatesData.success && Array.isArray(templatesData.dynamicTemplates)) {
          setAllTemplates(templatesData.dynamicTemplates);
        }
      } catch (tErr) {
        console.warn('Failed to fetch dynamic templates catalog:', tErr);
      }

      // Fetch Exams
      const examsRes = await fetch('/api/exams');
      const examsData = await examsRes.json();
      if (examsData.success) {
        setExams(examsData.exams || []);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch curriculum data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      let url = '/api/admin/questions?';
      if (adminMode === 'exam') {
        if (!selectedExamId) return;
        url += `examId=${selectedExamId}`;
        if (selectedSectionId) url += `&section=${selectedSectionId}`;
        if (selectedTopicId) url += `&topic=${selectedTopicId}`;
      } else {
        const params = [];
        if (filterSkillId) {
          params.push(`skillId=${filterSkillId}`);
        } else if (filterChapterId) {
          const chapterSkills = skills.filter(s => s.chapterId === filterChapterId);
          if (chapterSkills.length > 0) {
            params.push(`skillId=${chapterSkills.map(s => s.id).join(',')}`);
          } else {
            params.push('skillId=dummy-no-skills');
          }
        }
        if (filterSubjectId) {
          params.push(`subject=${filterSubjectId}`);
        }
        url += params.join('&');
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExamQuestions(data.questions || []);
      }
    } catch (err) {
      console.warn('Failed to load questions:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminMode]);

   useEffect(() => {
    if (activeTab === 'question' || activeTab === 'questions_list') {
      fetchQuestions();
    }
  }, [adminMode, activeTab, selectedExamId, selectedSectionId, selectedTopicId, filterSubjectId, filterChapterId, filterSkillId]);

  // Listen for clicks outside of autocomplete lists to close them
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.suggestion-container')) {
        setActiveSuggestionBox(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Filter templates list based on search term
  const renderSuggestions = (query, onSelect, boxId) => {
    if (activeSuggestionBox !== boxId) return null;
    const q = (query || '').toLowerCase().trim();
    if (!q) return null;

    const matches = allTemplates.filter(t => 
      t.id.toLowerCase().includes(q) || 
      (t.title && t.title.toLowerCase().includes(q))
    ).slice(0, 10);

    if (matches.length === 0) return null;

    return (
      <div 
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          zIndex: 9999,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '2px',
        }}
      >
        {matches.map(t => (
          <div
            key={t.id}
            onClick={() => {
              onSelect(t.id);
              setActiveSuggestionBox(null);
            }}
            style={{
              padding: '6px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '12px',
              textAlign: 'left',
            }}
            className="suggestion-item"
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.title || t.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{t.id}</div>
          </div>
        ))}
      </div>
    );
  };

  // Filter skills list based on search term
  const renderSkillSuggestions = (query, onSelect, boxId) => {
    if (activeSuggestionBox !== boxId) return null;
    const q = (query || '').toLowerCase().trim();
    if (!q) return null;

    const matches = skills.filter(s => 
      s.id.toLowerCase().includes(q) || 
      (s.title && s.title.toLowerCase().includes(q))
    ).slice(0, 10);

    if (matches.length === 0) return null;

    return (
      <div 
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          zIndex: 9999,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '2px',
        }}
      >
        {matches.map(s => (
          <div
            key={s.id}
            onClick={() => {
              onSelect(s.id);
              setActiveSuggestionBox(null);
            }}
            style={{
              padding: '6px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '12px',
              textAlign: 'left',
            }}
            className="suggestion-item"
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.title}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{s.id}</div>
          </div>
        ))}
      </div>
    );
  };

  // Reset edit state when tab switches
  useEffect(() => {
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      icon: '',
      order: 0,
      subjectId: '',
      unitId: '',
      gradeId: '',
      chapterId: '',
      code: '',
      templateId: '',
      engine: '',
      templateLevels: '',
      remediation: '',
      
      name: '',
      fullName: '',
      description: '',
      targetClass: 6,
      
      sectionId: '',
      sectionName: '',
      shortName: '',
      questionCount: 25,
      maxMarks: 25,
      timeLimitMinutes: 30,
      
      topicId: '',
      
      questionText: '',
      questionImageUrl: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanationText: '',
      isPYQ: false,
      pyqYear: '',
      difficulty: 0.5,
      cognitiveLevel: 'recall',
      tags: '',
      metadataSource: '',
      
      type: 'mcq',
      blank1Answer: '',
      blank2Answer: '',
      blank3Answer: '',
      blank4Answer: '',
      
      cat1Id: 'even', cat1Label: 'Even Numbers',
      cat2Id: 'odd', cat2Label: 'Odd Numbers',
      cat3Id: '', cat3Label: '',
      cat4Id: '', cat4Label: '',
      
      item1Label: '', item1Cat: '',
      item2Label: '', item2Cat: '',
      item3Label: '', item3Cat: '',
      item4Label: '', item4Cat: '',
      item5Label: '', item5Cat: '',
      item6Label: '', item6Cat: '',
      
      appletComponent: '',
      appletPropsJson: '',
      appletAnswer: '',
    });
    setSkillDifficultyScaling(false);
    setSkillTemplateLevels([
      { level: 1, templateIds: [] },
      { level: 2, templateIds: [] },
      { level: 3, templateIds: [] },
    ]);
    setLevelAddInputs({ 1: '', 2: '', 3: '' });
  }, [activeTab, adminMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSeed = async () => {
    const isIit = adminMode === 'iit';
    const msg = isIit 
      ? 'Are you sure you want to seed default IIT foundation curriculum data? This will overwrite or append default Grade 6-12 IIT structures.'
      : 'Are you sure you want to seed default v2 curriculum data? This will overwrite or append default LKG/UKG structures.';
    if (!confirm(msg)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/curriculum?${isIit ? 'iit=true' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seed', iit: isIit }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Seeding successful!');
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Seeding request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id || item._id);

    if (activeTab === 'question' || activeTab === 'questions_list') {
      setActiveTab('question');
      const isIitOrSchool = adminMode === 'school' || adminMode === 'iit';
      const optionsList = Array.isArray(item.options) ? item.options : [];
      const optionA = isIitOrSchool ? (optionsList[0]?.label || '') : (item.options?.A || '');
      const optionB = isIitOrSchool ? (optionsList[1]?.label || '') : (item.options?.B || '');
      const optionC = isIitOrSchool ? (optionsList[2]?.label || '') : (item.options?.C || '');
      const optionD = isIitOrSchool ? (optionsList[3]?.label || '') : (item.options?.D || '');
      
      let correctOption = item.correctOption || 'A';
      if (isIitOrSchool && Array.isArray(item.options)) {
        const correctIdx = item.options.findIndex(o => o.isCorrect);
        correctOption = correctIdx === 0 ? 'A' : (correctIdx === 1 ? 'B' : (correctIdx === 2 ? 'C' : (correctIdx === 3 ? 'D' : 'A')));
      }

      const skillObj = skills.find(s => s.id === item.skillId);

      const qType = item.type || 'mcq';
      
      // Blank answers extraction
      const blankMatchRule = Array.isArray(item.validationRules) 
        ? item.validationRules.find(r => r.type === 'exact_match' && r.target === 'answer') 
        : null;
      const blankVals = blankMatchRule?.value || {};
      
      // Categorization extraction
      const cats = item.categories || [];
      const its = item.items || [];
      
      // Applet extraction
      const appletVisual = Array.isArray(item.visuals) ? item.visuals[0] : null;
      const appletComponent = appletVisual?.component || '';
      const appletPropsJson = appletVisual?.props ? JSON.stringify(appletVisual.props, null, 2) : '';
      const appletAnswer = typeof blankMatchRule?.value === 'object' 
        ? JSON.stringify(blankMatchRule.value) 
        : String(blankMatchRule?.value || '');

      setFormData({
        id: item._id || item.id || '',
        questionId: item.id || item._id || '',
        questionText: item.questionText || '',
        questionImageUrl: item.questionImageUrl || '',
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        explanationText: item.explanationText || '',
        difficulty: item.difficulty || 0.5,
        cognitiveLevel: item.cognitiveLevel || 'recall',
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        metadataSource: item.metadata?.source || '',
        isPYQ: Boolean(item.isPYQ),
        pyqYear: item.pyqYear || '',
        
        subjectId: item.subject || item.metadata?.subject || filterSubjectId || '',
        chapterId: skillObj?.chapterId || filterChapterId || '',
        skillId: item.skillId || filterSkillId || '',
        branchingCorrect: item.metadata?.branching?.correct || '',
        branchingIncorrect: item.metadata?.branching?.incorrect || '',
        isStaticQuestion: item.metadata?.isStatic !== false,

        // Extracted format properties
        type: qType,
        blank1Answer: blankVals.blank1 || '',
        blank2Answer: blankVals.blank2 || '',
        blank3Answer: blankVals.blank3 || '',
        blank4Answer: blankVals.blank4 || '',
        
        cat1Id: cats[0]?.id || 'even', cat1Label: cats[0]?.label || 'Even Numbers',
        cat2Id: cats[1]?.id || 'odd', cat2Label: cats[1]?.label || 'Odd Numbers',
        cat3Id: cats[2]?.id || '', cat3Label: cats[2]?.label || '',
        cat4Id: cats[3]?.id || '', cat4Label: cats[3]?.label || '',
        
        item1Label: its[0]?.label || '', item1Cat: its[0]?.categoryId || '',
        item2Label: its[1]?.label || '', item2Cat: its[1]?.categoryId || '',
        item3Label: its[2]?.label || '', item3Cat: its[2]?.categoryId || '',
        item4Label: its[3]?.label || '', item4Cat: its[3]?.categoryId || '',
        item5Label: its[4]?.label || '', item5Cat: its[4]?.categoryId || '',
        item6Label: its[5]?.label || '', item6Cat: its[5]?.categoryId || '',
        
        appletComponent,
        appletPropsJson,
        appletAnswer,
      });
      setLevelAddInputs({ 1: '', 2: '', 3: '' });
      return;
    }

    if (adminMode === 'school' || adminMode === 'iit') {
      setFormData({
        id: item.id || '',
        title: item.title || '',
        icon: item.icon || '',
        order: item.order || 0,
        subjectId: item.subjectId || '',
        unitId: item.unitId || '',
        gradeId: item.gradeId || '',
        chapterId: item.chapterId || '',
        code: item.code || '',
        templateId: Array.isArray(item.templateId) ? item.templateId.join(', ') : (item.templateId || ''),
        engine: item.engine || '',
        templateLevels: item.templateLevels ? JSON.stringify(item.templateLevels, null, 2) : '',
        remediation: item.remediation ? (Array.isArray(item.remediation) ? item.remediation.join(', ') : item.remediation) : '',
        isStatic: Boolean(item.isStatic),
        progressionEnabled: Boolean(item.progressionConfig?.enabled),
        progressionEasy: Number(item.progressionConfig?.easyCount ?? 3),
        progressionMedium: Number(item.progressionConfig?.mediumCount ?? 7),
        progressionHard: Number(item.progressionConfig?.hardCount ?? 10),
      });

      if (item.templateLevels && Array.isArray(item.templateLevels) && item.templateLevels.length > 0) {
        setSkillDifficultyScaling(true);
        const levelsMap = { 1: [], 2: [], 3: [] };
        item.templateLevels.forEach(l => {
          if (l.level) {
            levelsMap[l.level] = Array.isArray(l.templateIds) ? l.templateIds : [];
          }
        });
        setSkillTemplateLevels([
          { level: 1, templateIds: levelsMap[1] },
          { level: 2, templateIds: levelsMap[2] },
          { level: 3, templateIds: levelsMap[3] },
        ]);
      } else {
        setSkillDifficultyScaling(false);
        setSkillTemplateLevels([
          { level: 1, templateIds: [] },
          { level: 2, templateIds: [] },
          { level: 3, templateIds: [] },
        ]);
      }
    } else {
      // Exam mode edits
      if (activeTab === 'exam') {
        setFormData({
          id: item.id || '',
          name: item.name || '',
          fullName: item.fullName || '',
          description: item.description || '',
          targetClass: item.targetClass || 6,
        });
      } else if (activeTab === 'section') {
        setFormData({
          sectionId: item.id || '',
          sectionName: item.name || '',
          shortName: item.shortName || '',
          icon: item.icon || '',
          description: item.description || '',
          questionCount: item.questionCount || 25,
          maxMarks: item.maxMarks || 25,
          timeLimitMinutes: item.timeLimitMinutes || 30,
        });
      } else if (activeTab === 'topic') {
        setFormData({
          topicId: item.name || '',
        });
      } else if (activeTab === 'skill') {
        setFormData({
          id: item.id || item._id || '',
          title: item.name || item.title || '',
          engine: item.type || 'parameterized',
          difficulty: item.difficulty || 0.5,
          status: item.status || 'active',
        });
      }
    }
    setLevelAddInputs({ 1: '', 2: '', 3: '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      icon: '',
      order: 0,
      subjectId: '',
      unitId: '',
      gradeId: '',
      chapterId: '',
      code: '',
      templateId: '',
      engine: '',
      templateLevels: '',
      remediation: '',
      isStatic: false,
      progressionEnabled: false,
      progressionEasy: 3,
      progressionMedium: 7,
      progressionHard: 10,
      
      name: '',
      fullName: '',
      description: '',
      targetClass: 6,
      
      sectionId: '',
      sectionName: '',
      shortName: '',
      questionCount: 25,
      maxMarks: 25,
      timeLimitMinutes: 30,
      
      topicId: '',
      
      questionText: '',
      questionImageUrl: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanationText: '',
      isPYQ: false,
      pyqYear: '',
      difficulty: 0.5,
      cognitiveLevel: 'recall',
      tags: '',
      metadataSource: '',
    });
    setSkillDifficultyScaling(false);
    setSkillTemplateLevels([
      { level: 1, templateIds: [] },
      { level: 2, templateIds: [] },
      { level: 3, templateIds: [] },
    ]);
    setLevelAddInputs({ 1: '', 2: '', 3: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'question') {
        let payload;
        if (adminMode === 'school' || adminMode === 'iit') {
          if (!formData.subjectId || !formData.chapterId || !formData.skillId) {
            setError('Please select Subject, Chapter, and Skill ID for the question first.');
            setLoading(false);
            return;
          }

          const chap = chapters.find(c => c.id === formData.chapterId);
          const topicSlug = chap?.unitId || 'mechanics';
          const qType = formData.type || 'mcq';

          payload = {
            id: formData.questionId || editingId || `${formData.skillId}-q${Date.now()}`,
            subject: formData.subjectId,
            topic: topicSlug,
            skillId: formData.skillId,
            type: qType,
            questionText: formData.questionText,
            questionImageUrl: formData.questionImageUrl || '',
            explanationText: formData.explanationText || '',
            difficulty: Number(formData.difficulty) || 0.5,
            status: formData.status || 'active',
            metadata: {
              subject: formData.subjectId,
              topic: topicSlug,
              skillId: formData.skillId,
              isStatic: Boolean(formData.isStaticQuestion),
              grade: '6',
              branching: (formData.branchingCorrect || formData.branchingIncorrect) ? {
                correct: formData.branchingCorrect || 'end',
                incorrect: formData.branchingIncorrect || 'end'
              } : undefined
            }
          };

          // 1. MCQ & Visual Choice structures
          if (qType === 'mcq' || qType === 'visual_choice') {
            payload.options = [
              { label: formData.optionA, isCorrect: formData.correctOption === 'A' },
              { label: formData.optionB, isCorrect: formData.correctOption === 'B' },
              { label: formData.optionC, isCorrect: formData.correctOption === 'C' },
              { label: formData.optionD, isCorrect: formData.correctOption === 'D' },
            ].filter(o => o.label !== '');
          }

          // 2. Fill in the Blank structure
          if (qType === 'fill_in_the_blank') {
            const blankAnswers = {};
            if (formData.blank1Answer) blankAnswers.blank1 = formData.blank1Answer;
            if (formData.blank2Answer) blankAnswers.blank2 = formData.blank2Answer;
            if (formData.blank3Answer) blankAnswers.blank3 = formData.blank3Answer;
            if (formData.blank4Answer) blankAnswers.blank4 = formData.blank4Answer;
            
            payload.validationRules = [
              {
                type: 'exact_match',
                target: 'answer',
                value: blankAnswers
              }
            ];
          }

          // 3. Categorization/Sorting structure
          if (qType === 'categorization' || qType === 'categorizationv2') {
            const categoriesArray = [];
            if (formData.cat1Id) categoriesArray.push({ id: formData.cat1Id, label: formData.cat1Label || formData.cat1Id });
            if (formData.cat2Id) categoriesArray.push({ id: formData.cat2Id, label: formData.cat2Label || formData.cat2Id });
            if (formData.cat3Id) categoriesArray.push({ id: formData.cat3Id, label: formData.cat3Label || formData.cat3Id });
            if (formData.cat4Id) categoriesArray.push({ id: formData.cat4Id, label: formData.cat4Label || formData.cat4Id });
            
            const itemsArray = [];
            const itemData = [
              { label: formData.item1Label, cat: formData.item1Cat, id: 'item1' },
              { label: formData.item2Label, cat: formData.item2Cat, id: 'item2' },
              { label: formData.item3Label, cat: formData.item3Cat, id: 'item3' },
              { label: formData.item4Label, cat: formData.item4Cat, id: 'item4' },
              { label: formData.item5Label, cat: formData.item5Cat, id: 'item5' },
              { label: formData.item6Label, cat: formData.item6Cat, id: 'item6' },
            ];
            itemData.forEach(it => {
              if (it.label && it.cat) {
                itemsArray.push({
                  id: it.id,
                  label: it.label,
                  categoryId: it.cat
                });
              }
            });

            payload.categories = categoriesArray;
            payload.items = itemsArray;

            const correctDndMap = {};
            itemsArray.forEach(it => {
              correctDndMap[it.id] = it.categoryId;
            });
            
            payload.validationRules = [
              {
                type: 'exact_match',
                target: 'answer',
                value: correctDndMap
              }
            ];

            if (qType === 'categorizationv2') {
              payload.interaction = { engine: 'categorizationv2', inputMode: 'drag-drop' };
              payload.layoutMode = 'grid_fill';
              payload.columns = 1;
              payload.grid = { columns: 1 };
              payload.answer = correctDndMap;
              payload.correctAnswer = correctDndMap;
              payload.parts = [
                { type: 'text', content: formData.questionText },
                {
                  type: 'categorizationv2',
                  categories: categoriesArray,
                  items: itemsArray.map(it => ({ id: it.id, content: it.label, label: it.label, target: it.categoryId, categoryId: it.categoryId })),
                  answerKey: correctDndMap,
                  isVertical: true,
                  layoutMode: 'grid_fill',
                  columns: 1,
                  grid: { columns: 1 }
                }
              ];
            }
          }

          // 4. Interactive Applet structure
          if (qType === 'interactiveApplet') {
            let appletProps = {};
            if (formData.appletPropsJson) {
              try {
                appletProps = JSON.parse(formData.appletPropsJson);
              } catch (jsonErr) {
                setError('Applet Props Config must be valid JSON.');
                setLoading(false);
                return;
              }
            }

            payload.visuals = [
              {
                component: formData.appletComponent,
                props: appletProps
              }
            ];

            let finalAnswerVal = formData.appletAnswer;
            if (formData.appletAnswer.startsWith('{') || formData.appletAnswer.startsWith('[')) {
              try {
                finalAnswerVal = JSON.parse(formData.appletAnswer);
              } catch {}
            }

            payload.validationRules = [
              {
                type: 'exact_match',
                target: 'answer',
                value: finalAnswerVal
              }
            ];
          }
        } else {
          if (!selectedExamId || !selectedSectionId || !selectedTopicId) {
            setError('Please select Exam, Section, and Topic for the question first.');
            setLoading(false);
            return;
          }

          payload = {
            id: editingId || undefined,
            examId: selectedExamId,
            section: selectedSectionId,
            topic: selectedTopicId,
            questionText: formData.questionText,
            questionImageUrl: formData.questionImageUrl || '',
            options: {
              A: formData.optionA,
              B: formData.optionB,
              C: formData.optionC,
              D: formData.optionD,
            },
            correctOption: formData.correctOption,
            explanationText: formData.explanationText || '',
            isPYQ: Boolean(formData.isPYQ),
            pyqYear: formData.pyqYear ? Number(formData.pyqYear) : null,
            difficulty: Number(formData.difficulty) || 0.5,
            cognitiveLevel: formData.cognitiveLevel,
            tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
            metadata: {
              source: formData.metadataSource || 'admin',
              exam: [selectedExamId.toUpperCase()],
            }
          };
        }

        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          handleCancelEdit();
          fetchQuestions();
        } else {
          setError(data.error || 'Failed to save question.');
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(err.message || 'API connection error.');
      setLoading(false);
      return;
    }

    if (adminMode === 'school' || adminMode === 'iit') {
      // School Curriculum CRUD
      const payloadData = {
        id: editingId || formData.id || undefined,
        title: formData.title,
        order: Number(formData.order) || 0,
      };

      if (activeTab === 'subject') {
        payloadData.icon = formData.icon;
      } else if (activeTab === 'unit') {
        payloadData.subjectId = formData.subjectId;
      } else if (activeTab === 'chapter') {
        payloadData.unitId = formData.unitId;
        payloadData.gradeId = formData.gradeId;
      } else if (activeTab === 'skill') {
        payloadData.chapterId = formData.chapterId;
        payloadData.code = formData.code;
        payloadData.templateId = formData.templateId;
        payloadData.engine = formData.engine;
        payloadData.isStatic = Boolean(formData.isStatic);
        payloadData.progressionConfig = {
          enabled: Boolean(formData.progressionEnabled),
          easyCount: Number(formData.progressionEasy) || 0,
          mediumCount: Number(formData.progressionMedium) || 0,
          hardCount: Number(formData.progressionHard) || 0,
        };
        payloadData.remediation = formData.remediation
          ? formData.remediation.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        
        const selectedChapter = chapters.find(c => c.id === formData.chapterId);
        if (selectedChapter) {
          payloadData.unitId = selectedChapter.unitId;
          payloadData.gradeId = selectedChapter.gradeId;
        }
        
        if (skillDifficultyScaling) {
          const cleanedLevels = skillTemplateLevels.map(l => ({
            level: l.level,
            templateIds: l.templateIds.map(t => String(t || '').trim()).filter(Boolean)
          })).filter(l => l.templateIds.length > 0);
          
          if (cleanedLevels.length === 0) {
            setError('Please add at least one template ID under a level to use difficulty scaling.');
            setLoading(false);
            return;
          }
          
          payloadData.templateLevels = cleanedLevels;
          payloadData.metadata = {
            difficultyScaling: true,
            templateLevels: cleanedLevels
          };
          
          const level1 = cleanedLevels.find(l => l.level === 1);
          if (level1 && level1.templateIds.length > 0) {
            payloadData.templateId = level1.templateIds[0];
          }
        } else {
          payloadData.templateLevels = null;
          payloadData.metadata = null;
        }
      }

      try {
        const isIit = adminMode === 'iit';
        const res = await fetch(`/api/v2/curriculum${isIit ? '?iit=true' : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: activeTab,
            data: payloadData,
            iit: isIit,
          }),
        });
        const data = await res.json();
        if (data.success) {
          handleCancelEdit();
          fetchData();
        } else {
          setError(data.error || 'Failed to save node.');
        }
      } catch (err) {
        setError('API connection error.');
      } finally {
        setLoading(false);
      }
    } else {
      // Competitive Exam CRUD
      try {
        if (activeTab === 'exam') {
          const payload = {
            id: editingId || formData.id || undefined,
            name: formData.name,
            fullName: formData.fullName,
            description: formData.description,
            targetClass: Number(formData.targetClass) || 6,
          };
          
          // Carry forward existing sections if updating
          if (editingId) {
            const existing = exams.find(e => e.id === editingId);
            if (existing) payload.sections = existing.sections;
          } else {
            payload.sections = [];
          }

          const res = await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.success) {
            handleCancelEdit();
            fetchData();
          } else {
            setError(data.error || 'Failed to save exam.');
          }
        } else if (activeTab === 'section') {
          if (!selectedExamId) {
            setError('Please select an Exam from the sidebar filter first.');
            setLoading(false);
            return;
          }
          const targetExam = exams.find(e => e.id === selectedExamId);
          if (!targetExam) {
            setError('Selected Exam not found.');
            setLoading(false);
            return;
          }

          const sectionPayload = {
            id: formData.sectionId,
            name: formData.sectionName,
            shortName: formData.shortName,
            icon: formData.icon,
            description: formData.description,
            questionCount: Number(formData.questionCount) || 25,
            maxMarks: Number(formData.maxMarks) || 25,
            timeLimitMinutes: Number(formData.timeLimitMinutes) || 30,
            topics: []
          };

          let updatedSections = [];
          if (editingId) {
            updatedSections = (targetExam.sections || []).map(s => 
              s.id === editingId ? { ...s, ...sectionPayload } : s
            );
          } else {
            if ((targetExam.sections || []).some(s => s.id === sectionPayload.id)) {
              setError('Section ID already exists in this exam.');
              setLoading(false);
              return;
            }
            updatedSections = [...(targetExam.sections || []), sectionPayload];
          }

          const res = await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...targetExam,
              sections: updatedSections,
            }),
          });
          const data = await res.json();
          if (data.success) {
            handleCancelEdit();
            fetchData();
          } else {
            setError(data.error || 'Failed to save section.');
          }
        } else if (activeTab === 'topic') {
          if (!selectedExamId || !selectedSectionId) {
            setError('Please select both Exam and Section first.');
            setLoading(false);
            return;
          }
          const targetExam = exams.find(e => e.id === selectedExamId);
          if (!targetExam) {
            setError('Exam not found.');
            setLoading(false);
            return;
          }

          const normalizedTopicId = formData.topicId.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
          if (!normalizedTopicId) {
            setError('Invalid Topic ID.');
            setLoading(false);
            return;
          }

          const updatedSections = (targetExam.sections || []).map(s => {
            if (s.id === selectedSectionId) {
              const currentTopics = s.topics || [];
              let newTopics = [...currentTopics];
              if (editingId) {
                newTopics = currentTopics.map(t => t === editingId ? normalizedTopicId : t);
              } else {
                if (currentTopics.includes(normalizedTopicId)) return s;
                newTopics = [...currentTopics, normalizedTopicId];
              }
              return { ...s, topics: newTopics };
            }
            return s;
          });

          const res = await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...targetExam,
              sections: updatedSections,
            }),
          });
          const data = await res.json();
          if (data.success) {
            handleCancelEdit();
            fetchData();
          } else {
            setError(data.error || 'Failed to save topic.');
          }
        } else if (activeTab === 'skill') {
          if (!selectedExamId || !selectedSectionId || !selectedTopicId) {
            setError('Please select Exam, Section, and Topic for the skill first.');
            setLoading(false);
            return;
          }

          const templateIds = formData.id.split(',').map(s => s.trim()).filter(Boolean);
          if (templateIds.length === 0) {
            setError('Please provide at least one Template ID.');
            setLoading(false);
            return;
          }

          // If editing, find removed template IDs and delete them
          if (editingId) {
            const oldGroup = currentList.find(g => g.name === editingId);
            if (oldGroup) {
              const removedIds = oldGroup.templateIds.filter(id => !templateIds.includes(id));
              for (const removedId of removedIds) {
                await fetch(`/api/admin/templates?id=${removedId}&exam=true`, { method: 'DELETE' });
              }
            }
          }

          // Save/update each template ID
          for (const templateId of templateIds) {
            const payload = {
              id: templateId,
              name: formData.title,
              type: formData.engine || 'parameterized',
              examId: selectedExamId,
              section: selectedSectionId,
              topic: selectedTopicId,
              difficulty: Number(formData.difficulty) || 0.5,
              status: formData.status || 'active'
            };

            const res = await fetch('/api/admin/templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success) {
              setError(data.error || `Failed to save template ID: ${templateId}`);
              setLoading(false);
              return;
            }
          }

          handleCancelEdit();
          fetchData();
        }
      } catch (err) {
        setError(err.message || 'API connection error.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAiGridGenerate = async (item) => {
    const questionId = item.id || item._id;
    setGeneratingStates(prev => ({ ...prev, [questionId]: true }));
    try {
      const optionsArray = [];
      const opts = item.options || {};
      ['A', 'B', 'C', 'D'].forEach(letter => {
        if (opts[letter]) {
          optionsArray.push({
            label: opts[letter],
            isCorrect: String(item.correctOption || '').toUpperCase() === letter
          });
        }
      });

      const body = {
        questionText: item.questionText,
        options: optionsArray,
        explanation: item.explanationText || '',
        subject: selectedExamId === 'jnvst' ? 'math' : 'math',
        topic: selectedTopicId || item.topic || 'general'
      };

      const res = await fetch('/api/admin/templates/generate-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.template) {
        const templateWithLink = {
          ...data.template,
          linkToQuestionId: questionId
        };
        localStorage.setItem('klasschamp_grid_loader', JSON.stringify(templateWithLink));
        window.open('/template-generator-grid', '_blank');
      } else {
        alert('Failed to generate template: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error calling AI generation API: ' + err.message);
    } finally {
      setGeneratingStates(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab}?`)) return;
    setLoading(true);
    try {
      if (adminMode === 'school' || adminMode === 'iit') {
        const isIit = adminMode === 'iit';
        const res = await fetch(`/api/v2/curriculum?type=${activeTab}&id=${id}${isIit ? '&iit=true' : ''}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
          if (editingId === id) handleCancelEdit();
          fetchData();
        } else {
          alert(`Delete failed: ${data.error}`);
        }
      } else {
        // Exam mode delete
        if (activeTab === 'exam') {
          const res = await fetch(`/api/exams?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            if (editingId === id) handleCancelEdit();
            fetchData();
          } else {
            alert(`Delete failed: ${data.error}`);
          }
        } else if (activeTab === 'section') {
          const targetExam = exams.find(e => e.id === selectedExamId);
          if (!targetExam) return;
          const updatedSections = (targetExam.sections || []).filter(s => s.id !== id);
          
          const res = await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...targetExam, sections: updatedSections }),
          });
          const data = await res.json();
          if (data.success) {
            if (editingId === id) handleCancelEdit();
            fetchData();
          }
        } else if (activeTab === 'topic') {
          const targetExam = exams.find(e => e.id === selectedExamId);
          if (!targetExam) return;
          const updatedSections = (targetExam.sections || []).map(s => {
            if (s.id === selectedSectionId) {
              return { ...s, topics: (s.topics || []).filter(t => t !== id) };
            }
            return s;
          });

          const res = await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...targetExam, sections: updatedSections }),
          });
          const data = await res.json();
          if (data.success) {
            if (editingId === id) handleCancelEdit();
            fetchData();
          }
        } else if (activeTab === 'skill') {
          const group = currentList.find(g => g.id === id || g.name === id);
          if (group && group.templateIds) {
            for (const tid of group.templateIds) {
              await fetch(`/api/admin/templates?id=${tid}&exam=true`, { method: 'DELETE' });
            }
          }
          if (editingId === id) handleCancelEdit();
          fetchData();
        } else if (activeTab === 'question') {
          const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            if (editingId === id) handleCancelEdit();
            fetchQuestions();
          }
        }
      }
    } catch (err) {
      alert('Delete API connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Switch modes and set default tabs
  const handleModeToggle = (mode) => {
    setAdminMode(mode);
    setActiveTab((mode === 'school' || mode === 'iit') ? 'grade' : 'exam');
  };

  // Resolve collections displays
  const getActiveList = () => {
    if (adminMode === 'school' || adminMode === 'iit') {
      switch (activeTab) {
        case 'grade': return grades;
        case 'subject': return subjects;
        case 'unit': {
          let list = units;
          if (filterSubjectId) {
            list = list.filter(u => u.subjectId === filterSubjectId);
          }
          return list;
        }
        case 'chapter': {
          let list = chapters;
          if (filterGradeId) {
            list = list.filter(c => c.gradeId === filterGradeId);
          }
          if (filterSubjectId) {
            list = list.filter(c => {
              const un = units.find(u => u.id === c.unitId);
              return un && un.subjectId === filterSubjectId;
            });
          }
          if (filterUnitId) {
            list = list.filter(c => c.unitId === filterUnitId);
          }
          return list;
        }
        case 'skill': {
          let list = skills;
          if (filterGradeId) {
            list = list.filter(item => {
              if (item.gradeId === filterGradeId) return true;
              const ch = chapters.find(c => c.id === item.chapterId);
              return ch && ch.gradeId === filterGradeId;
            });
          }
          if (filterSubjectId) {
            list = list.filter(item => {
              if (item.subjectId === filterSubjectId) return true;
              const ch = chapters.find(c => c.id === item.chapterId);
              if (ch) {
                const un = units.find(u => u.id === ch.unitId);
                if (un && un.subjectId === filterSubjectId) return true;
              }
              return false;
            });
          }
          if (filterUnitId) {
            list = list.filter(item => {
              if (item.unitId === filterUnitId) return true;
              const ch = chapters.find(c => c.id === item.chapterId);
              return ch && ch.unitId === filterUnitId;
            });
          }
          if (filterChapterId) {
            list = list.filter(item => item.chapterId === filterChapterId);
          }
          return list;
        }
        case 'question':
        case 'questions_list': return examQuestions;
        default: return [];
      }
    } else {
      switch (activeTab) {
        case 'exam': return exams;
        case 'section': {
          const examObj = exams.find(e => e.id === selectedExamId);
          return examObj ? (examObj.sections || []) : [];
        }
        case 'topic': {
          const examObj = exams.find(e => e.id === selectedExamId);
          const secObj = examObj?.sections?.find(s => s.id === selectedSectionId);
          return secObj ? (secObj.topics || []).map(topicName => ({ id: topicName, name: topicName, title: topicName })) : [];
        }
        case 'skill': {
          const filtered = allTemplates.filter(t => {
            const matchesExam = !selectedExamId || t.examId === selectedExamId || t.exam === selectedExamId;
            const matchesSection = !selectedSectionId || t.section === selectedSectionId || t.subject === selectedSectionId;
            const matchesTopic = !selectedTopicId || t.topic === selectedTopicId;
            return matchesExam && matchesSection && matchesTopic;
          });

          // Group by name
          const grouped = [];
          const nameMap = {};
          filtered.forEach(t => {
            const name = (t.name || t.title || '').trim();
            if (!name) return;
            if (!nameMap[name]) {
              nameMap[name] = {
                id: name, // use name as group key
                name: name,
                type: t.type || 'parameterized',
                difficulty: t.difficulty || 0.5,
                status: t.status || 'active',
                templateIds: [],
                rawTemplates: []
              };
              grouped.push(nameMap[name]);
            }
            const tid = t.id || String(t._id);
            if (!nameMap[name].templateIds.includes(tid)) {
              nameMap[name].templateIds.push(tid);
            }
            nameMap[name].rawTemplates.push(t);
          });
          return grouped;
        }
        case 'question':
        case 'questions_list': return examQuestions;
        default: return [];
      }
    }
  };

  const currentList = getActiveList();

  // Render guides
  const renderGuide = () => {
    if (adminMode === 'school' || adminMode === 'iit') {
      switch (activeTab) {
        case 'grade':
          return (
            <div style={guideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>🎓 Grade Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Register child-level segments (e.g. ID: <code>lkg</code>, Title: <code>LKG</code>). The <strong>Order</strong> determines its dashboard sort position.
              </p>
            </div>
          );
        case 'subject':
          return (
            <div style={guideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📚 Subject Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Add study categories (e.g. ID: <code>math</code>, Title: <code>Math</code>). Use emojis (🧮 or 📚) in the **Emoji Icon** field.
              </p>
            </div>
          );
        case 'unit':
          return (
            <div style={guideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📂 Unit (Topic) Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Group chapters into topics (e.g. ID: <code>counting</code>, Title: <code>Counting & Cardinality</code>). Must link to a **Subject**.
              </p>
            </div>
          );
        case 'chapter':
          return (
            <div style={guideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📖 Chapter Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Create folders for skills (e.g. ID: <code>counting-5</code>, Title: <code>Numbers up to 5</code>). Must link to a **Unit** and **Grade**.
              </p>
            </div>
          );
        case 'skill':
          return (
            <div style={guideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>💡 Skill & Template Connection Guide</h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
                <li><strong>Skill Code</strong>: Number tag (e.g. <code>C.1</code> or <code>A.2</code>).</li>
                <li><strong>Template ID</strong>: Copy the unique ID from your Template Editor (e.g., <code>template-1780746102249</code>).</li>
                <li><strong>Engine</strong>: Set to <code>universal-template</code> if rendering template editor designs dynamically.</li>
              </ul>
            </div>
          );
        case 'questions_list':
          return (
            <div style={guideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📋 Questions Library Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Browse, edit, or delete existing curriculum questions. Use the filters on top to find questions matching specific subjects/chapters/skills.
              </p>
            </div>
          );
        default:
          return null;
      }
    } else {
      switch (activeTab) {
        case 'exam':
          return (
            <div style={examGuideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>🏫 Exam Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Register core exams (e.g. ID: <code>jnvst</code>, Name: <code>JNVST</code>).
              </p>
            </div>
          );
        case 'section':
          return (
            <div style={examGuideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>🧠 Section Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Add segments under the active Exam (e.g. ID: <code>mat</code>, Name: <code>Mental Ability Test</code>).
              </p>
            </div>
          );
        case 'topic':
          return (
            <div style={examGuideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>🔒 Topic Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Add topics within sections (e.g. <code>fractions</code>, <code>analogy</code>).
              </p>
            </div>
          );
        case 'skill':
          return (
            <div style={examGuideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>💡 Skill (Template) Mapping Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Map dynamic templates to this section/topic. For example, Template ID <code>fractions-g5-add-unlike</code> with Name <code>Add Unlike Fractions</code>.
              </p>
            </div>
          );
        case 'question':
          return (
            <div style={examGuideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>❓ Question Creation Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Create or edit practice questions. Make sure to specify options, key descriptors, and explanations.
              </p>
            </div>
          );
        case 'questions_list':
          return (
            <div style={examGuideStyle}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>📋 Questions Library Guide</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
                Browse, edit, or delete existing exam-prep questions. Use the scope filters above to filter questions.
              </p>
            </div>
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="admin-page-body" style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem 1.5rem',
      fontFamily: 'Outfit, Inter, system-ui, sans-serif',
      color: '#1e293b',
    }}>
      {/* Dynamic CSS styles injected locally */}
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-header {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          padding: 1.5rem 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .mode-toggle-bar {
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          border: 1px solid #e2e8f0;
        }
        .mode-toggle-btn {
          border: none;
          padding: 10px 20px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mode-toggle-btn.active-school {
          background: #ffffff;
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
        }
        .mode-toggle-btn.active-exam {
          background: #ffffff;
          color: #0891b2;
          box-shadow: 0 4px 12px rgba(8, 145, 178, 0.12);
        }
        .btn-seed {
          background: linear-gradient(135deg, #7a56d6, #6366f1);
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.2s ease-in-out;
        }
        .btn-seed:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }
        .btn-seed:active {
          transform: translateY(0);
        }
        .btn-preview {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
          transition: all 0.2s ease-in-out;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-preview:hover {
          transform: translateY(-2px);
          background: #1e293b;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.06);
        }
        .metric-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .tab-track-container {
          background: #e2e8f0;
          border-radius: 14px;
          padding: 6px;
          margin-bottom: 2rem;
          display: flex;
          gap: 4px;
          width: fit-content;
        }
        .tab-item-btn {
          border: none;
          background: transparent;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 14.5px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: capitalize;
        }
        .tab-item-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.4);
          color: #1e293b;
        }
        .tab-item-btn.active.school {
          background: #ffffff;
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .tab-item-btn.active.iit {
          background: #ffffff;
          color: #10b981;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .tab-item-btn.active.exam {
          background: #ffffff;
          color: #0891b2;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .filter-glass-deck {
          display: flex;
          gap: 1.25rem;
          align-items: center;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          padding: 1rem 1.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.03);
        }
        .custom-select-control {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13.5px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease-in-out;
        }
        .custom-select-control:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .custom-select-control:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }
        .control-panel-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 2rem;
        }
        @media (max-width: 1024px) {
          .control-panel-grid {
            grid-template-columns: 1fr;
          }
        }
        .panel-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .panel-card:hover {
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.05);
        }
        .form-label-premium {
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.35rem;
        }
        .form-input-premium {
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0.65rem 0.85rem;
          font-size: 0.9rem;
          color: #1e293b;
          background: #ffffff;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .form-input-premium:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }
        .form-input-premium:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }
        .form-submit-btn-premium {
          border: none;
          padding: 0.85rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.05);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .form-submit-btn-premium:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }
        .form-submit-btn-premium:active {
          transform: translateY(0);
        }
        .table-premium-header th {
          padding: 1rem 0.75rem;
          font-weight: 800;
          color: #64748b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 2px solid #f1f5f9;
        }
        .table-row-premium {
          transition: background-color 0.15s ease;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-row-premium:hover {
          background-color: #f8fafc;
        }
        .badge-pill-premium {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
        }
      ` }} />

      {/* 1. Header Row */}
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛠️ Curriculum Builder V2
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '15px', fontWeight: 500 }}>
            Manage School K-12 and Competitive Exam prep collections dynamically.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div className="mode-toggle-bar">
            <button
              onClick={() => handleModeToggle('school')}
              className="mode-toggle-btn"
              style={{
                background: adminMode === 'school' ? '#ffffff' : 'transparent',
                color: adminMode === 'school' ? '#4f46e5' : '#64748b',
              }}
            >
              🏫 School K-12
            </button>
            <button
              onClick={() => handleModeToggle('iit')}
              className="mode-toggle-btn"
              style={{
                background: adminMode === 'iit' ? '#ffffff' : 'transparent',
                color: adminMode === 'iit' ? '#10b981' : '#64748b',
              }}
            >
              🚀 IIT Prep
            </button>
            <button
              onClick={() => handleModeToggle('exam')}
              className="mode-toggle-btn"
              style={{
                background: adminMode === 'exam' ? '#ffffff' : 'transparent',
                color: adminMode === 'exam' ? '#0891b2' : '#64748b',
              }}
            >
              🎓 Exam Prep
            </button>
          </div>
          
          {(adminMode === 'school' || adminMode === 'iit') && (
            <button 
              onClick={handleSeed}
              disabled={loading}
              className="btn-seed"
              style={{
                background: adminMode === 'iit' ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
                boxShadow: adminMode === 'iit' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : undefined,
              }}
            >
              {adminMode === 'iit' ? '⚡ Seed IIT Data' : '🌱 Seed V2 Data'}
            </button>
          )}
          
          <Link 
            href={adminMode === 'school' ? '/grades-v2' : (adminMode === 'iit' ? '/iit-foundation' : '/exam-prep')}
            target="_blank"
            className="btn-preview"
          >
            👁️ Preview Client
          </Link>
        </div>
      </header>

      {/* 2. KPI Metrics Deck */}
      <section className="metrics-grid">
        {adminMode === 'school' || adminMode === 'iit' ? (
          <>
            <div className="metric-card" style={{ borderLeft: '5px solid #3b82f6' }}>
              <div className="metric-icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>🏫</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Total Grades</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{grades.length}</div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #10b981' }}>
              <div className="metric-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>📚</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Subjects</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{subjects.length}</div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #f59e0b' }}>
              <div className="metric-icon-box" style={{ background: '#fffbeb', color: '#f59e0b' }}>📂</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Units / Topics</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{units.length}</div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #8b5cf6' }}>
              <div className="metric-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>📖</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Chapters</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{chapters.length}</div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #ec4899' }}>
              <div className="metric-icon-box" style={{ background: '#fdf2f8', color: '#ec4899' }}>💡</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Micro-Skills</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{skills.length}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="metric-card" style={{ borderLeft: '5px solid #06b6d4' }}>
              <div className="metric-icon-box" style={{ background: '#ecfeff', color: '#06b6d4' }}>🎓</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Total Exams</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{exams.length}</div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #14b8a6' }}>
              <div className="metric-icon-box" style={{ background: '#f0fdfa', color: '#14b8a6' }}>🧠</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Sections / Parts</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>
                  {exams.reduce((sum, e) => sum + (e.sections?.length || 0), 0)}
                </div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #eab308' }}>
              <div className="metric-icon-box" style={{ background: '#fefce8', color: '#eab308' }}>🔒</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Mapped Topics</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>
                  {exams.reduce((sum, e) => sum + (e.sections?.reduce((sSum, sec) => sSum + (sec.topics?.length || 0), 0) || 0), 0)}
                </div>
              </div>
            </div>
            <div className="metric-card" style={{ borderLeft: '5px solid #f43f5e' }}>
              <div className="metric-icon-box" style={{ background: '#fff1f2', color: '#f43f5e' }}>❓</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Active MCQs</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>{examQuestions.length}</div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 3. Navigation Tab Bar */}
      <nav className="tab-track-container">
        {((adminMode === 'school' || adminMode === 'iit') 
          ? ['grade', 'subject', 'unit', 'chapter', 'skill', 'question', 'questions_list']
          : ['exam', 'section', 'topic', 'skill', 'question', 'questions_list']
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-item-btn ${activeTab === tab ? 'active' : ''} ${activeTab === tab ? ((adminMode === 'school' || adminMode === 'iit') ? (adminMode === 'iit' ? 'iit' : 'school') : 'exam') : ''}`}
          >
            {tab === 'exam' ? 'Exams' : tab === 'mat' ? 'MAT' : tab === 'question' ? 'Authoring Center' : tab === 'questions_list' ? 'Questions Library' : tab + 's'}
          </button>
        ))}
      </nav>

      {/* 4. Glassmorphic Filters */}
      {(adminMode === 'school' || adminMode === 'iit') && (
        <div className="filter-glass-deck">
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            🔍 Filter:
          </span>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Grade</label>
            <select
              value={filterGradeId}
              onChange={e => {
                setFilterGradeId(e.target.value);
                setFilterChapterId('');
              }}
              className="custom-select-control"
            >
              <option value="">-- All Grades --</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Subject</label>
            <select
              value={filterSubjectId}
              onChange={e => {
                setFilterSubjectId(e.target.value);
                setFilterUnitId('');
                setFilterChapterId('');
              }}
              className="custom-select-control"
            >
              <option value="">-- All Subjects --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Unit</label>
            <select
              value={filterUnitId}
              disabled={!filterSubjectId}
              onChange={e => {
                setFilterUnitId(e.target.value);
                setFilterChapterId('');
              }}
              className="custom-select-control"
            >
              <option value="">-- All Units --</option>
              {units.filter(u => !filterSubjectId || u.subjectId === filterSubjectId).map(u => (
                <option key={u.id} value={u.id}>{u.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Chapter</label>
            <select
              value={filterChapterId}
              disabled={!filterUnitId && !filterGradeId}
              onChange={e => setFilterChapterId(e.target.value)}
              className="custom-select-control"
              style={{ maxWidth: '240px' }}
            >
              <option value="">-- All Chapters --</option>
              {chapters.filter(c => {
                const matchesUnit = !filterUnitId || c.unitId === filterUnitId;
                const matchesGrade = !filterGradeId || c.gradeId === filterGradeId;
                return matchesUnit && matchesGrade;
              }).map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Skill</label>
            <select
              value={filterSkillId}
              disabled={!filterChapterId}
              onChange={e => setFilterSkillId(e.target.value)}
              className="custom-select-control"
              style={{ maxWidth: '240px' }}
            >
              <option value="">-- All Skills --</option>
              {skills.filter(s => s.chapterId === filterChapterId).map(s => (
                <option key={s.id} value={s.id}>{s.name || s.title || s.id}</option>
              ))}
            </select>
          </div>

          {(filterGradeId || filterSubjectId || filterUnitId || filterChapterId || filterSkillId) && (
            <button
              onClick={() => {
                setFilterGradeId('');
                setFilterSubjectId('');
                setFilterUnitId('');
                setFilterChapterId('');
                setFilterSkillId('');
              }}
              className="custom-select-control"
              style={{
                background: '#f1f5f9',
                borderColor: '#cbd5e1',
                color: '#475569',
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {adminMode === 'exam' && (
        <div className="filter-glass-deck">
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🔍 Scope:
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Exam</label>
            <select
              value={selectedExamId}
              onChange={e => {
                setSelectedExamId(e.target.value);
                setSelectedSectionId('');
                setSelectedTopicId('');
              }}
              className="custom-select-control"
            >
              <option value="">-- All Exams --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Section</label>
            <select
              value={selectedSectionId}
              disabled={!selectedExamId}
              onChange={e => {
                setSelectedSectionId(e.target.value);
                setSelectedTopicId('');
              }}
              className="custom-select-control"
            >
              <option value="">-- All Sections --</option>
              {exams.find(e => e.id === selectedExamId)?.sections?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>Topic</label>
            <select
              value={selectedTopicId}
              disabled={!selectedSectionId}
              onChange={e => setSelectedTopicId(e.target.value)}
              className="custom-select-control"
            >
              <option value="">-- All Topics --</option>
              {exams.find(e => e.id === selectedExamId)?.sections?.find(s => s.id === selectedSectionId)?.topics?.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 5. Error Box */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          padding: '1rem 1.5rem',
          borderRadius: '14px',
          marginBottom: '2rem',
          fontWeight: 700,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 6. Form & Table Grid layout */}
      {['question', 'questions_list'].includes(activeTab) ? (
        <AdminConsolePage 
          forceTab={activeTab === 'question' ? 'authoring' : 'library'} 
          hideHeader={true} 
          hideSidebar={true} 
          adminMode={adminMode}
          activeFilters={{
            gradeId: filterGradeId,
            subjectId: filterSubjectId,
            chapterId: filterChapterId,
            skillId: filterSkillId,
            examId: selectedExamId,
            section: selectedSectionId,
            topic: selectedTopicId
          }}
          onTabChange={(tab) => {
            if (tab === 'authoring') {
              setActiveTab('question');
            } else if (tab === 'library') {
              setActiveTab('questions_list');
            }
          }}
        />
      ) : (
        <div className="control-panel-grid">
        
        {/* Left Side: Creation/Editing Card */}
        {activeTab !== 'questions_list' && (
          <section className="panel-card" style={{ alignSelf: 'start', maxWidth: activeTab === 'question' ? '800px' : undefined, margin: activeTab === 'question' ? '0 auto 2rem auto' : undefined }}>
          <h2 style={{
            marginTop: 0,
            fontSize: '1.4rem',
            fontWeight: 900,
            textTransform: 'capitalize',
            letterSpacing: '-0.02em',
            color: '#0f172a',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '0.75rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {editingId ? '✏️ Edit' : '➕ Create'} {activeTab === 'question' ? 'Question' : activeTab}
          </h2>
          
          {/* Instructions Guide */}
          {renderGuide()}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* SCHOOL MODE INPUT FIELDS */}
            {(adminMode === 'school' || adminMode === 'iit') && (
              <>
                {activeTab !== 'question' && (
                  <>
                    {/* ID input */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label-premium">Unique ID (Slug)</label>
                  <input 
                    type="text" 
                    name="id" 
                    disabled={!!editingId}
                    value={formData.id} 
                    onChange={handleInputChange}
                    placeholder="e.g. lkg-math-counting"
                    className="form-input-premium"
                    style={{
                      background: editingId ? '#f1f5f9' : '#ffffff',
                      cursor: editingId ? 'not-allowed' : 'text',
                    }}
                  />
                  <small style={{ color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
                    {editingId ? 'Unique ID cannot be modified once set.' : 'Leave blank to generate slug automatically from Title.'}
                  </small>
                </div>

                {/* Title Input */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label-premium">Title / Name</label>
                  <input 
                    type="text" 
                    name="title" 
                    required
                    value={formData.title} 
                    onChange={handleInputChange}
                    placeholder={`e.g. My New ${activeTab}`}
                    className="form-input-premium"
                  />
                </div>

                {/* Subject Specific Icon */}
                {activeTab === 'subject' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label-premium">Emoji Icon</label>
                    <input 
                      type="text" 
                      name="icon" 
                      value={formData.icon} 
                      onChange={handleInputChange}
                      placeholder="e.g. 🧮"
                      className="form-input-premium"
                    />
                  </div>
                )}

                {/* Unit Specific Subject selector */}
                {activeTab === 'unit' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label-premium">Subject</label>
                    <select 
                      name="subjectId" 
                      required
                      value={formData.subjectId} 
                      onChange={handleInputChange}
                      className="form-input-premium"
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                )}

                {/* Chapter Specific Unit & Grade selectors */}
                {activeTab === 'chapter' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Unit (Topic)</label>
                      <select 
                        name="unitId" 
                        required
                        value={formData.unitId} 
                        onChange={handleInputChange}
                        className="form-input-premium"
                      >
                        <option value="">-- Select Unit --</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
                      <label className="form-label-premium">Grade</label>
                      <select 
                        name="gradeId" 
                        required
                        value={formData.gradeId} 
                        onChange={handleInputChange}
                        className="form-input-premium"
                      >
                        <option value="">-- Select Grade --</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Skill Specific Input parameters */}
                {activeTab === 'skill' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Chapter</label>
                      <select 
                        name="chapterId" 
                        required
                        value={formData.chapterId} 
                        onChange={handleInputChange}
                        className="form-input-premium"
                      >
                        <option value="">-- Select Chapter --</option>
                        {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
                      <label className="form-label-premium">Skill Code</label>
                      <input 
                        type="text" 
                        name="code" 
                        required
                        value={formData.code} 
                        onChange={handleInputChange}
                        placeholder="e.g. A.1"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
                      <label className="form-label-premium">Routing / Practice Mode</label>
                      <select 
                        name="isStatic" 
                        value={formData.isStatic ? 'static' : 'adaptive'} 
                        onChange={(e) => {
                          const val = e.target.value === 'static';
                          setFormData(prev => ({ 
                            ...prev, 
                            isStatic: val,
                            templateId: val ? '' : prev.templateId,
                            engine: val ? 'questionBank' : (prev.engine === 'questionBank' ? '' : prev.engine)
                          }));
                        }}
                        className="premium-select"
                      >
                        <option value="adaptive">⚡ Adaptive (Dynamic Template Generation)</option>
                        <option value="static">📋 Static (Fixed Database Questions / Branching)</option>
                      </select>
                    </div>
                    <div className="suggestion-container" style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '0.25rem' }}>
                      <label className="form-label-premium" style={{ color: formData.isStatic ? '#94a3b8' : undefined }}>Template ID</label>
                      <input 
                        type="text" 
                        name="templateId" 
                        required={!formData.isStatic}
                        disabled={formData.isStatic}
                        value={formData.isStatic ? '' : formData.templateId} 
                        onChange={(e) => {
                          handleInputChange(e);
                          setActiveSuggestionBox('primary');
                        }}
                        onFocus={() => {
                          if (!formData.isStatic) setActiveSuggestionBox('primary');
                        }}
                        placeholder={formData.isStatic ? 'Disabled for Static routing mode' : 'e.g. fractions-g5-add-like-fractions'}
                        className="form-input-premium"
                        style={{ background: (editingId || formData.isStatic) ? '#f1f5f9' : '#fff' }}
                      />
                      {!formData.isStatic && renderSuggestions(
                        formData.templateId, 
                        (tid) => setFormData(prev => ({ ...prev, templateId: tid })), 
                        'primary'
                      )}
                      {!formData.isStatic && formData.templateId && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '11.5px' }}>
                          <a 
                            href={`/admin/templates?id=${encodeURIComponent(formData.templateId)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            🔗 Open Template Editor
                          </a>
                          <a 
                            href={`/admin/vocabulary-pools?poolId=${encodeURIComponent(formData.templateId)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#0891b2', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            📦 Open Option Pool Manager
                          </a>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
                      <label className="form-label-premium" style={{ color: formData.isStatic ? '#94a3b8' : undefined }}>Engine</label>
                      {formData.isStatic ? (
                        <input 
                          type="text" 
                          disabled 
                          value="questionBank" 
                          className="form-input-premium"
                          style={{ background: '#f1f5f9' }}
                        />
                      ) : (
                        <>
                          <select
                            value={['universal-template', 'questionBank', 'lkg', 'ukg-numbers-counting', 'noun', 'verb', 'pronoun', ''].includes(formData.engine) ? formData.engine : 'custom'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                setFormData(prev => ({ ...prev, engine: '' }));
                              } else {
                                setFormData(prev => ({ ...prev, engine: val }));
                              }
                            }}
                            className="premium-select"
                          >
                            <option value="universal-template">Universal Template Engine (universal-template)</option>
                            <option value="lkg">LKG Generator Engine (lkg)</option>
                            <option value="questionBank">Static Question Bank (questionBank)</option>
                            <option value="ukg-numbers-counting">UKG Numbers Counting Engine (ukg-numbers-counting)</option>
                            <option value="noun">Noun Engine (noun)</option>
                            <option value="verb">Verb Engine (verb)</option>
                            <option value="pronoun">Pronoun Engine (pronoun)</option>
                            <option value="">None (empty)</option>
                            <option value="custom">Custom Engine...</option>
                          </select>
                          {!['universal-template', 'questionBank', 'lkg', 'ukg-numbers-counting', 'noun', 'verb', 'pronoun', ''].includes(formData.engine) && (
                            <input 
                              type="text" 
                              name="engine" 
                              required
                              value={formData.engine} 
                              onChange={handleInputChange}
                              placeholder="Type custom engine name (e.g. StickersEngine)"
                              className="form-input-premium"
                              style={{ marginTop: '6px' }}
                            />
                          )}
                        </>
                      )}
                    </div>
                    {/* Difficulty Scaling */}
                    {!formData.isStatic && (
                      <div style={{ marginTop: '6px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={skillDifficultyScaling}
                            onChange={e => {
                              setSkillDifficultyScaling(e.target.checked);
                              if (e.target.checked && formData.templateId) {
                                const primaryId = formData.templateId.trim();
                                if (primaryId) {
                                  setSkillTemplateLevels(prev => prev.map(l =>
                                    l.level === 1 && l.templateIds.length === 0
                                      ? { ...l, templateIds: [primaryId] }
                                      : l
                                  ));
                                }
                              }
                            }}
                          />
                          ⚡ Enable Difficulty Scaling
                        </label>

                        {skillDifficultyScaling && (
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                              { level: 1, label: 'Level 1 — Easy', color: '#dcfce7', border: '#86efac', badge: '#16a34a' },
                              { level: 2, label: 'Level 2 — Medium', color: '#fef9c3', border: '#fde047', badge: '#ca8a04' },
                              { level: 3, label: 'Level 3 — Hard', color: '#fee2e2', border: '#fca5a5', badge: '#dc2626' },
                            ].map(({ level, label, color, border, badge }) => {
                              const levelData = skillTemplateLevels.find(l => l.level === level) || { level, templateIds: [] };
                              return (
                                <div key={level} style={{ border: `1px solid ${border}`, borderRadius: '10px', background: '#ffffff', padding: '10px 12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '12px', color: '#334155' }}>{label}</span>
                                    <span style={{ background: badge, color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 800 }}>
                                      {levelData.templateIds.length} templates
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px', marginBottom: '8px' }}>
                                    {levelData.templateIds.length === 0 && (
                                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>No templates mapped</span>
                                    )}
                                    {levelData.templateIds.map((tid, ti) => (
                                      <span key={ti} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        background: color, border: `1px solid ${border}`, borderRadius: '6px',
                                        padding: '3px 8px', fontSize: '11px', fontWeight: 700, color: '#1e293b'
                                      }}>
                                        {tid}
                                        <button
                                          type="button"
                                          onClick={() => setSkillTemplateLevels(prev => prev.map(l =>
                                            l.level === level
                                              ? { ...l, templateIds: l.templateIds.filter((_, i) => i !== ti) }
                                              : l
                                          ))}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900, padding: 0 }}
                                        >×</button>
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                                    <div className="suggestion-container" style={{ flex: 1, position: 'relative' }}>
                                      <input
                                        type="text"
                                        className="form-input-premium"
                                        style={{ width: '100%', fontSize: '12px', padding: '5px 8px', boxSizing: 'border-box' }}
                                        placeholder="Search Template ID..."
                                        value={levelAddInputs[level] || ''}
                                        onChange={e => {
                                          setLevelAddInputs(prev => ({ ...prev, [level]: e.target.value }));
                                          setActiveSuggestionBox(String(level));
                                        }}
                                        onFocus={() => setActiveSuggestionBox(String(level))}
                                      />
                                      {renderSuggestions(
                                        levelAddInputs[level], 
                                        (tid) => {
                                          if (!levelData.templateIds.includes(tid)) {
                                            setSkillTemplateLevels(prev => prev.map(l =>
                                              l.level === level ? { ...l, templateIds: [...l.templateIds, tid] } : l
                                            ));
                                          }
                                          setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                        }, 
                                        String(level)
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      style={{ fontSize: '12px', padding: '4px 12px', background: badge, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
                                      onClick={() => {
                                        const val = (levelAddInputs[level] || '').trim();
                                        if (val && !levelData.templateIds.includes(val)) {
                                          setSkillTemplateLevels(prev => prev.map(l =>
                                            l.level === level ? { ...l, templateIds: [...l.templateIds, val] } : l
                                          ));
                                          setLevelAddInputs(prev => ({ ...prev, [level]: '' }));
                                        }
                                      }}
                                    >+ Add</button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Remediation Skill ID */}
                            <div style={{ marginTop: '4px', borderTop: '1px dashed #fcd34d', paddingTop: '10px' }}>
                              <label className="form-label-premium" style={{ display: 'block', fontSize: '11.5px', color: '#92400e', fontWeight: 800, marginBottom: '4px' }}>
                                🔄 Remediation Skill ID
                              </label>
                              <div className="suggestion-container" style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  className="form-input-premium"
                                  style={{ width: '100%', fontSize: '12px', padding: '6px 10px', boxSizing: 'border-box' }}
                                  placeholder="Search or enter fallback skill ID (e.g. lkg-shapes)"
                                  value={formData.remediation || ''}
                                  onChange={e => {
                                    setFormData(prev => ({ ...prev, remediation: e.target.value }));
                                    setActiveSuggestionBox('remediation');
                                  }}
                                  onFocus={() => setActiveSuggestionBox('remediation')}
                                />
                                {renderSkillSuggestions(
                                  formData.remediation,
                                  (sid) => {
                                    setFormData(prev => ({ ...prev, remediation: sid }));
                                  },
                                  'remediation'
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progression Config */}
                    <div style={{ marginTop: '12px', padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: '#166534', cursor: 'pointer', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          checked={formData.progressionEnabled || false}
                          onChange={e => setFormData(prev => ({ ...prev, progressionEnabled: e.target.checked }))}
                        />
                        🎯 Enable Custom Progression Scaling (IIT Foundation style)
                      </label>

                      {formData.progressionEnabled && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', color: '#166534' }}>Easy Questions</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.progressionEasy || 0}
                              onChange={e => setFormData(prev => ({ ...prev, progressionEasy: Number(e.target.value) }))}
                              className="form-input-premium"
                              style={{ padding: '6px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', color: '#166534' }}>Medium Questions</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.progressionMedium || 0}
                              onChange={e => setFormData(prev => ({ ...prev, progressionMedium: Number(e.target.value) }))}
                              className="form-input-premium"
                              style={{ padding: '6px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', color: '#166534' }}>Hard Questions</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.progressionHard || 0}
                              onChange={e => setFormData(prev => ({ ...prev, progressionHard: Number(e.target.value) }))}
                              className="form-input-premium"
                              style={{ padding: '6px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Common order sort value */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label-premium">Order / Sort Rank</label>
                  <input 
                    type="number" 
                    name="order" 
                    value={formData.order} 
                    onChange={handleInputChange}
                    className="form-input-premium"
                  />
                </div>
              </>
            )}
          </>
        )}

            {/* EXAM PREP INPUT FIELDS */}
            {adminMode === 'exam' && (
              <>
                {/* 1. Exam creation fields */}
                {activeTab === 'exam' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Exam ID (e.g. jnvst)</label>
                      <input 
                        type="text" 
                        name="id" 
                        disabled={!!editingId}
                        required
                        value={formData.id} 
                        onChange={handleInputChange}
                        placeholder="e.g. jnvst"
                        className="form-input-premium"
                        style={{ background: editingId ? '#f1f5f9' : '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Short Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required
                        value={formData.name} 
                        onChange={handleInputChange}
                        placeholder="e.g. JNVST"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        required
                        value={formData.fullName} 
                        onChange={handleInputChange}
                        placeholder="e.g. Jawahar Navodaya Vidyalaya Selection Test"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Description</label>
                      <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleInputChange}
                        placeholder="Detail information about the competitive exam..."
                        rows={3}
                        className="premium-textarea"
                      />
                    </div>
                  </>
                )}

                {/* 2. Section creation fields */}
                {activeTab === 'section' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Section ID (Slug)</label>
                      <input 
                        type="text" 
                        name="sectionId" 
                        disabled={!!editingId}
                        required
                        value={formData.sectionId} 
                        onChange={handleInputChange}
                        placeholder="e.g. arithmetic"
                        className="form-input-premium"
                        style={{ background: editingId ? '#f1f5f9' : '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Section Name</label>
                      <input 
                        type="text" 
                        name="sectionName" 
                        required
                        value={formData.sectionName} 
                        onChange={handleInputChange}
                        placeholder="e.g. Arithmetic Test"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Short Display Name</label>
                      <input 
                        type="text" 
                        name="shortName" 
                        value={formData.shortName} 
                        onChange={handleInputChange}
                        placeholder="e.g. Arithmetic"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Emoji Icon</label>
                      <input 
                        type="text" 
                        name="icon" 
                        value={formData.icon} 
                        onChange={handleInputChange}
                        placeholder="e.g. 🔢"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="form-label-premium">Qn Count</label>
                        <input 
                          type="number" 
                          name="questionCount" 
                          value={formData.questionCount} 
                          onChange={handleInputChange}
                          className="form-input-premium"
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="form-label-premium">Max Marks</label>
                        <input 
                          type="number" 
                          name="maxMarks" 
                          value={formData.maxMarks} 
                          onChange={handleInputChange}
                          className="form-input-premium"
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label className="form-label-premium">Time (Min)</label>
                        <input 
                          type="number" 
                          name="timeLimitMinutes" 
                          value={formData.timeLimitMinutes} 
                          onChange={handleInputChange}
                          className="form-input-premium"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Description</label>
                      <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleInputChange}
                        placeholder="Description of section..."
                        rows={2}
                        className="premium-textarea"
                      />
                    </div>
                  </>
                )}

                {/* 3. Topic creation fields */}
                {activeTab === 'topic' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label-premium">Topic ID / Name (Slug)</label>
                    <input 
                      type="text" 
                      name="topicId" 
                      required
                      value={formData.topicId} 
                      onChange={handleInputChange}
                      placeholder="e.g. fractions"
                      className="form-input-premium"
                    />
                  </div>
                )}

                {/* 3.5. Skill mappings fields */}
                {activeTab === 'skill' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Template ID / Unique Code</label>
                      <input 
                        type="text" 
                        name="id" 
                        disabled={!!editingId}
                        required
                        value={formData.id} 
                        onChange={handleInputChange}
                        placeholder="e.g. fractions-g5-add-unlike"
                        className="form-input-premium"
                        style={{ background: editingId ? '#f1f5f9' : '#fff' }}
                      />
                      {formData.id && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '11.5px' }}>
                          <a 
                            href={`/admin/templates?id=${encodeURIComponent(formData.id)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            🔗 Open Template Editor
                          </a>
                          <a 
                            href={`/admin/vocabulary-pools?poolId=${encodeURIComponent(formData.id)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#0891b2', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            📦 Open Option Pool Manager
                          </a>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Skill Name / Display Title</label>
                      <input 
                        type="text" 
                        name="title" 
                        required
                        value={formData.title} 
                        onChange={handleInputChange}
                        placeholder="e.g. Add Unlike Fractions"
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Template Engine / Type</label>
                      <select 
                        name="engine" 
                        value={formData.engine || 'parameterized'} 
                        onChange={handleInputChange}
                        className="premium-select"
                      >
                        <option value="parameterized">Parameterized Question Generator</option>
                        <option value="svg-figure">SVG/Geometry Figure Generator</option>
                        <option value="visual-transformation">Visual Grid/Fraction Block Transformation</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Difficulty (0.0 - 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05" 
                        min="0" 
                        max="1" 
                        name="difficulty" 
                        value={formData.difficulty} 
                        onChange={handleInputChange} 
                        className="form-input-premium"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label className="form-label-premium">Status</label>
                      <select 
                        name="status" 
                        value={formData.status || 'active'} 
                        onChange={handleInputChange}
                        className="premium-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 4. Question Creation fields */}
            {activeTab === 'question' && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setInputMode('manual')}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid ' + (inputMode === 'manual' ? '#10b981' : '#cbd5e1'),
                          background: inputMode === 'manual' ? '#ecfdf5' : '#f8fafc',
                          color: inputMode === 'manual' ? '#047857' : '#475569',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ✍️ Manual Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('json')}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid ' + (inputMode === 'json' ? '#10b981' : '#cbd5e1'),
                          background: inputMode === 'json' ? '#ecfdf5' : '#f8fafc',
                          color: inputMode === 'json' ? '#047857' : '#475569',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {"{ }"} Parse JSON
                      </button>
                    </div>

                    {inputMode === 'json' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Dynamic Category Overrides Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 800 }}>Category Grade (Override)</label>
                            <select
                              value={jsonGradeId}
                              onChange={(e) => setJsonGradeId(e.target.value)}
                              className="premium-select"
                              style={{ fontSize: '11.5px', padding: '6px' }}
                            >
                              <option value="">-- Keep JSON Value --</option>
                              {grades.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 800 }}>Category Subject (Override)</label>
                            <select
                              value={jsonSubjectId}
                              onChange={(e) => {
                                setJsonSubjectId(e.target.value);
                                setJsonChapterId('');
                                setJsonSkillId('');
                              }}
                              className="premium-select"
                              style={{ fontSize: '11.5px', padding: '6px' }}
                            >
                              <option value="">-- Keep JSON Value --</option>
                              {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 800 }}>Category Chapter (Override)</label>
                            <select
                              value={jsonChapterId}
                              onChange={(e) => {
                                setJsonChapterId(e.target.value);
                                setJsonSkillId('');
                              }}
                              className="premium-select"
                              style={{ fontSize: '11.5px', padding: '6px' }}
                            >
                              <option value="">-- Keep JSON Value --</option>
                              {chapters
                                .filter(c => {
                                  if (!jsonSubjectId) return true;
                                  const un = units.find(u => u.id === c.unitId);
                                  return un && un.subjectId === jsonSubjectId;
                                })
                                .filter(c => !jsonGradeId || c.gradeId === jsonGradeId)
                                .map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                              }
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium" style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 800 }}>Category Skill (Override)</label>
                            <select
                              value={jsonSkillId}
                              onChange={(e) => setJsonSkillId(e.target.value)}
                              className="premium-select"
                              style={{ fontSize: '11.5px', padding: '6px' }}
                            >
                              <option value="">-- Keep JSON Value --</option>
                              {skills
                                .filter(s => !jsonChapterId || s.chapterId === jsonChapterId)
                                .map(s => <option key={s.id} value={s.id}>{s.title || s.name || s.code}</option>)
                              }
                            </select>
                          </div>
                        </div>

                        <label className="form-label-premium">JSON Question Content (Single or Array)</label>
                        <textarea
                          value={jsonInputText}
                          onChange={(e) => setJsonInputText(e.target.value)}
                          placeholder={`Paste your question JSON here.\n\nExample Single:\n{\n  "id": "demo-q1",\n  "subject": "physics",\n  "topic": "mechanics",\n  "skillId": "iit-p6-electricity-branching-demo",\n  "type": "mcq",\n  "questionText": "Question?",\n  "options": [\n    { "label": "A", "isCorrect": true },\n    { "label": "B", "isCorrect": false }\n  ]\n}\n\nExample Array:\n[\n  { ... },\n  { ... }\n]`}
                          rows={12}
                          className="premium-textarea"
                          style={{ fontFamily: 'monospace', fontSize: '11px' }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!jsonInputText.trim()) {
                              setError('Please paste JSON content first.');
                              return;
                            }
                            setLoading(true);
                            setError(null);
                            try {
                              let parsed;
                              try {
                                parsed = JSON.parse(jsonInputText);
                              } catch (e) {
                                throw new Error('Invalid JSON: ' + e.message);
                              }

                              const questionsArray = Array.isArray(parsed) ? parsed : [parsed];
                              const chapObj = chapters.find(c => c.id === jsonChapterId);
                              const topicSlug = chapObj?.unitId;

                              const processedArray = questionsArray.map(q => {
                                const finalSubject = jsonSubjectId || q.subject || q.metadata?.subject;
                                const finalSkillId = jsonSkillId || q.skillId || q.metadata?.skillId;
                                const finalTopic = topicSlug || q.topic || q.metadata?.topic;
                                const finalGrade = jsonGradeId || q.metadata?.grade || '6';

                                return {
                                  ...q,
                                  subject: finalSubject,
                                  skillId: finalSkillId,
                                  topic: finalTopic,
                                  metadata: {
                                    ...q.metadata,
                                    subject: finalSubject,
                                    skillId: finalSkillId,
                                    topic: finalTopic,
                                    grade: finalGrade,
                                    isStatic: q.metadata?.isStatic !== false
                                  }
                                };
                              });

                              const payload = Array.isArray(parsed) ? processedArray : processedArray[0];

                              const res = await fetch('/api/admin/questions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                              });
                              const data = await res.json();
                              if (data.success) {
                                setJsonInputText('');
                                setJsonGradeId('');
                                setJsonSubjectId('');
                                setJsonChapterId('');
                                setJsonSkillId('');
                                handleCancelEdit();
                                fetchQuestions();
                                alert(data.count ? `Successfully imported ${data.count} questions!` : 'Question successfully imported!');
                              } else {
                                setError(data.error || 'Failed to save parsed JSON.');
                              }
                            } catch (err) {
                              setError(err.message);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            marginTop: '4px'
                          }}
                        >
                          🪄 Parse & Save JSON
                        </button>
                      </div>
                    ) : (
                      <>
                        {(adminMode === 'school' || adminMode === 'iit') && (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Subject</label>
                              <select name="subjectId" value={formData.subjectId} onChange={handleInputChange} className="premium-select" required>
                                <option value="">-- Select Subject --</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Chapter</label>
                              <select name="chapterId" value={formData.chapterId} onChange={handleInputChange} className="premium-select" required disabled={!formData.subjectId}>
                                <option value="">-- Select Chapter --</option>
                                {chapters.filter(c => {
                                  const un = units.find(u => u.id === c.unitId);
                                  return un && un.subjectId === formData.subjectId;
                                }).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Skill ID</label>
                              <select name="skillId" value={formData.skillId} onChange={handleInputChange} className="premium-select" required disabled={!formData.chapterId}>
                                <option value="">-- Select Skill --</option>
                                {skills.filter(s => s.chapterId === formData.chapterId).map(s => <option key={s.id} value={s.id}>{s.name || s.title || s.id}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Question ID (slug override)</label>
                              <input 
                                type="text" 
                                name="questionId" 
                                value={formData.questionId} 
                                onChange={handleInputChange} 
                                placeholder="e.g. iit-p6-electricity-branching-demo-q1" 
                                className="form-input-premium" 
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium">Branching Target - If Correct</label>
                                <input type="text" name="branchingCorrect" value={formData.branchingCorrect} onChange={handleInputChange} placeholder="e.g. q2, or 'end'" className="form-input-premium" />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium">Branching Target - If Incorrect</label>
                                <input type="text" name="branchingIncorrect" value={formData.branchingIncorrect} onChange={handleInputChange} placeholder="e.g. q1-hint, or 'end'" className="form-input-premium" />
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', margin: '4px 0' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', color: '#334155' }}>
                                <input 
                                  type="checkbox" 
                                  name="isStaticQuestion" 
                                  checked={formData.isStaticQuestion} 
                                  onChange={(e) => setFormData(prev => ({ ...prev, isStaticQuestion: e.target.checked }))} 
                                />
                                Is Static Question (sequential / branching)
                              </label>
                            </div>
                          </>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label className="form-label-premium">Question Text</label>
                          <textarea 
                            name="questionText" 
                            required
                            value={formData.questionText} 
                            onChange={handleInputChange}
                            placeholder="Enter question content (supports LaTeX & Markdown)"
                            rows={3}
                            className="premium-textarea"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label className="form-label-premium">Diagram / Image URL</label>
                          <input 
                            type="text" 
                            name="questionImageUrl" 
                            value={formData.questionImageUrl} 
                            onChange={handleInputChange}
                            placeholder="e.g. /images/diagram.png"
                            className="form-input-premium"
                          />
                        </div>

                        {(adminMode === 'school' || adminMode === 'iit') && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium">Question Format / Type</label>
                            <select 
                              name="type" 
                              value={formData.type || 'mcq'} 
                              onChange={handleInputChange} 
                              className="premium-select"
                            >
                              <option value="mcq">Multiple Choice (MCQ)</option>
                              <option value="fill_in_the_blank">Fill in the Blank</option>
                              <option value="categorization">Categorization / Sorting (Konva Canvas)</option>
                              <option value="categorizationv2">Categorization / Sorting (HTML5 Drag-Drop)</option>
                              <option value="visual_choice">Visual Choice (MCQ with drawings/SVGs)</option>
                              <option value="interactiveApplet">Interactive Applet / Tool</option>
                            </select>
                          </div>
                        )}

                        {/* 1. MCQ & Visual Choice option cards inputs */}
                        {(adminMode === 'exam' || formData.type === 'mcq' || formData.type === 'visual_choice') && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium">Option A</label>
                                <input 
                                  type="text" 
                                  name="optionA" 
                                  required={adminMode === 'exam' || formData.type === 'mcq' || formData.type === 'visual_choice'} 
                                  value={formData.optionA} 
                                  onChange={handleInputChange} 
                                  className="form-input-premium" 
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium">Option B</label>
                                <input 
                                  type="text" 
                                  name="optionB" 
                                  required={adminMode === 'exam' || formData.type === 'mcq' || formData.type === 'visual_choice'} 
                                  value={formData.optionB} 
                                  onChange={handleInputChange} 
                                  className="form-input-premium" 
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium">Option C</label>
                                <input 
                                  type="text" 
                                  name="optionC" 
                                  value={formData.optionC} 
                                  onChange={handleInputChange} 
                                  className="form-input-premium" 
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium">Option D</label>
                                <input 
                                  type="text" 
                                  name="optionD" 
                                  value={formData.optionD} 
                                  onChange={handleInputChange} 
                                  className="form-input-premium" 
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Correct Option</label>
                              <select 
                                name="correctOption" 
                                value={formData.correctOption} 
                                onChange={handleInputChange} 
                                className="premium-select"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* 2. Fill in the Blank inputs */}
                        {(adminMode === 'school' || adminMode === 'iit') && formData.type === 'fill_in_the_blank' && (
                          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                              ✏️ Fill in the Blank Answers (maps to [[blank1]], [[blank2]] etc.)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium" style={{ fontSize: '11px', fontWeight: 700 }}>blank1 Correct Answer</label>
                                <input type="text" name="blank1Answer" value={formData.blank1Answer || ''} onChange={handleInputChange} placeholder="e.g. 7" className="form-input-premium" />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium" style={{ fontSize: '11px', fontWeight: 700 }}>blank2 Correct Answer</label>
                                <input type="text" name="blank2Answer" value={formData.blank2Answer || ''} onChange={handleInputChange} placeholder="e.g. 8" className="form-input-premium" />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium" style={{ fontSize: '11px', fontWeight: 700 }}>blank3 Correct Answer</label>
                                <input type="text" name="blank3Answer" value={formData.blank3Answer || ''} onChange={handleInputChange} placeholder="e.g. 15" className="form-input-premium" />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="form-label-premium" style={{ fontSize: '11px', fontWeight: 700 }}>blank4 Correct Answer</label>
                                <input type="text" name="blank4Answer" value={formData.blank4Answer || ''} onChange={handleInputChange} placeholder="e.g. 20" className="form-input-premium" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. Categorization inputs */}
                        {(adminMode === 'school' || adminMode === 'iit') && (formData.type === 'categorization' || formData.type === 'categorizationv2') && (
                          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                              📁 Categorization Buckets & Draggable Items
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>1. Setup Category Columns (at least 2)</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', alignItems: 'center' }}>
                                <input type="text" name="cat1Id" value={formData.cat1Id || ''} onChange={handleInputChange} placeholder="Col 1 ID (e.g. even)" className="form-input-premium" style={{ fontSize: '11.5px', padding: '6px' }} />
                                <input type="text" name="cat1Label" value={formData.cat1Label || ''} onChange={handleInputChange} placeholder="Col 1 Display (e.g. Even Numbers)" className="form-input-premium" style={{ fontSize: '11.5px', padding: '6px' }} />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', alignItems: 'center' }}>
                                <input type="text" name="cat2Id" value={formData.cat2Id || ''} onChange={handleInputChange} placeholder="Col 2 ID (e.g. odd)" className="form-input-premium" style={{ fontSize: '11.5px', padding: '6px' }} />
                                <input type="text" name="cat2Label" value={formData.cat2Label || ''} onChange={handleInputChange} placeholder="Col 2 Display (e.g. Odd Numbers)" className="form-input-premium" style={{ fontSize: '11.5px', padding: '6px' }} />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', alignItems: 'center' }}>
                                <input type="text" name="cat3Id" value={formData.cat3Id || ''} onChange={handleInputChange} placeholder="Col 3 ID (Optional)" className="form-input-premium" style={{ fontSize: '11.5px', padding: '6px' }} />
                                <input type="text" name="cat3Label" value={formData.cat3Label || ''} onChange={handleInputChange} placeholder="Col 3 Display (Optional)" className="form-input-premium" style={{ fontSize: '11.5px', padding: '6px' }} />
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>2. Setup Cards & Target Column Mapping</div>
                              {[1, 2, 3, 4, 5, 6].map(num => (
                                <div key={num} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    name={`item${num}Label`} 
                                    value={formData[`item${num}Label`] || ''} 
                                    onChange={handleInputChange} 
                                    placeholder={`Card ${num} text (e.g. ${num * 2})`} 
                                    className="form-input-premium" 
                                    style={{ fontSize: '11.5px', padding: '6px' }} 
                                  />
                                  <select 
                                    name={`item${num}Cat`} 
                                    value={formData[`item${num}Cat`] || ''} 
                                    onChange={handleInputChange} 
                                    className="premium-select" 
                                    style={{ fontSize: '11.5px', padding: '6px' }}
                                  >
                                    <option value="">-- Target --</option>
                                    {formData.cat1Id && <option value={formData.cat1Id}>{formData.cat1Label || formData.cat1Id}</option>}
                                    {formData.cat2Id && <option value={formData.cat2Id}>{formData.cat2Label || formData.cat2Id}</option>}
                                    {formData.cat3Id && <option value={formData.cat3Id}>{formData.cat3Label || formData.cat3Id}</option>}
                                    {formData.cat4Id && <option value={formData.cat4Id}>{formData.cat4Label || formData.cat4Id}</option>}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Interactive Applet inputs */}
                        {(adminMode === 'school' || adminMode === 'iit') && formData.type === 'interactiveApplet' && (
                          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                              🧩 Interactive Applet / Tool Configuration
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Applet Component Name</label>
                              <input type="text" name="appletComponent" value={formData.appletComponent || ''} onChange={handleInputChange} placeholder="e.g. TenFrame, Clock" className="form-input-premium" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Applet Properties Config (JSON)</label>
                              <textarea 
                                name="appletPropsJson" 
                                value={formData.appletPropsJson || ''} 
                                onChange={handleInputChange} 
                                placeholder='e.g. { "filledCount": 7, "crossedOutCount": 0 }' 
                                rows={3} 
                                className="premium-textarea" 
                                style={{ fontFamily: 'monospace', fontSize: '11.5px' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <label className="form-label-premium">Expected Correct Answer</label>
                              <input type="text" name="appletAnswer" value={formData.appletAnswer || ''} onChange={handleInputChange} placeholder="e.g. 7" className="form-input-premium" />
                            </div>
                          </div>
                        )}

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label className="form-label-premium">Cognitive Level</label>
                          <select name="cognitiveLevel" value={formData.cognitiveLevel} onChange={handleInputChange} className="premium-select">
                            <option value="recall">Recall</option>
                            <option value="comprehension">Comprehension</option>
                            <option value="application">Application</option>
                            <option value="analytical">Analytical</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', color: '#334155' }}>
                            <input type="checkbox" name="isPYQ" checked={formData.isPYQ} onChange={handleInputChange} />
                            Is Previous Year Question (PYQ)
                          </label>
                          {formData.isPYQ && (
                            <input 
                              type="number" 
                              name="pyqYear" 
                              placeholder="Year" 
                              value={formData.pyqYear} 
                              onChange={handleInputChange} 
                              className="form-input-premium"
                              style={{ padding: '4px 8px', width: '80px', fontSize: '12px' }}
                            />
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium">Difficulty (0.0 - 1.0)</label>
                            <input type="number" step="0.05" min="0" max="1" name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="form-input-premium" />
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label className="form-label-premium">Source Tag</label>
                            <input type="text" name="metadataSource" value={formData.metadataSource} onChange={handleInputChange} placeholder="e.g. PYQ-2023" className="form-input-premium" />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}


            {/* Actions for Form */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button 
                type="submit" 
                disabled={loading}
                className="form-submit-btn-premium"
                style={{
                  flex: 1,
                  background: editingId ? '#16a34a' : ((adminMode === 'school' || adminMode === 'iit') ? (adminMode === 'iit' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)') : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'),
                  boxShadow: editingId ? '0 4px 12px rgba(22, 163, 74, 0.2)' : ((adminMode === 'school' || adminMode === 'iit') ? (adminMode === 'iit' ? '0 4px 14px rgba(16, 185, 129, 0.3)' : '0 4px 14px rgba(99, 102, 241, 0.3)') : '0 4px 14px rgba(8, 145, 178, 0.3)'),
                }}
              >
                {loading ? 'Processing...' : editingId ? `Update ${activeTab}` : `Create ${activeTab}`}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="form-submit-btn-premium"
                  style={{
                    background: '#64748b',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          </section>
        )}

        {/* Right Side: List Viewer Card */}
        {activeTab !== 'question' && (
          <section className="panel-card">
          <h2 style={{
            marginTop: 0,
            fontSize: '1.4rem',
            fontWeight: 900,
            textTransform: 'capitalize',
            letterSpacing: '-0.02em',
            color: '#0f172a',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '0.75rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>📋 Current {activeTab === 'exam' ? 'Exams' : activeTab === 'mat' ? 'MAT' : ['question', 'questions_list'].includes(activeTab) ? 'Questions' : activeTab + 's'} List</span>
            <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', color: '#475569', fontWeight: 800 }}>
              {currentList.length} items
            </span>
          </h2>
          
          {currentList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</span>
              <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 600 }}>No items match your active filters.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Create new entries or clear filters to view data.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr className="table-premium-header">
                    <th style={{ width: '15%' }}>ID / Target</th>
                    <th style={{ width: '60%' }}>Info / Content</th>
                    {(adminMode === 'school' || adminMode === 'iit') && (
                      <th style={{ width: '10%' }}>Order</th>
                    )}
                    <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((item, idx) => {
                    const rowId = item.id || item._id || `row-${idx}`;
                    return (
                      <tr key={rowId} className="table-row-premium">
                        {/* ID / Target column */}
                        <td style={{ padding: '1rem 0.75rem', fontSize: '0.8rem', fontFamily: 'monospace', color: '#0f172a', fontWeight: 700, verticalAlign: 'middle' }}>
                          {adminMode === 'exam' && activeTab === 'skill' ? (
                            <span className="badge-pill-premium" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                              📑 {item.templateIds?.length} {item.templateIds?.length === 1 ? 'Template' : 'Templates'}
                            </span>
                          ) : adminMode === 'exam' && activeTab === 'question' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="badge-pill-premium" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', width: 'fit-content' }}>
                                {item.examId?.toUpperCase()}
                              </span>
                              <span className="badge-pill-premium" style={{ background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc', width: 'fit-content' }}>
                                {item.section}
                              </span>
                            </div>
                          ) : (adminMode === 'school' || adminMode === 'iit') && activeTab === 'question' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="badge-pill-premium" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', width: 'max-content', fontSize: '10px', fontFamily: 'monospace' }}>
                                {item.skillId}
                              </span>
                              <span className="badge-pill-premium" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', width: 'fit-content', fontSize: '10px' }}>
                                {item.subject?.toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                              {rowId}
                            </span>
                          )}
                        </td>

                        {/* Title and Detail information column */}
                        <td style={{ padding: '1rem 0.75rem', fontSize: '13.5px', fontWeight: 600, verticalAlign: 'middle' }}>
                          {(adminMode === 'school' || adminMode === 'iit') && (
                            <>
                              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {activeTab === 'subject' && (item.icon ? `${item.icon} ` : '📚 ')}
                                {item.title}
                              </div>
                              {activeTab === 'unit' && <small style={{ display: 'block', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>Subject: <code>{item.subjectId}</code></small>}
                              {activeTab === 'chapter' && <small style={{ display: 'block', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>Unit: <code>{item.unitId}</code> | Grade: <code>{item.gradeId}</code></small>}
                              {activeTab === 'skill' && (
                                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <small style={{ color: '#64748b', fontWeight: 500 }}>Chapter: <code>{item.chapterId}</code> | Code: <code style={{ color: '#ec4899', fontWeight: 800 }}>{item.code}</code></small>
                                    <span style={{
                                      background: item.isStatic ? '#e0f2fe' : '#ecfdf5',
                                      color: item.isStatic ? '#0369a1' : '#047857',
                                      border: '1px solid ' + (item.isStatic ? '#bae6fd' : '#a7f3d0'),
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '9.5px',
                                      fontWeight: 800
                                    }}>
                                      {item.isStatic ? '📋 Static Flow' : '⚡ Adaptive Routing'}
                                    </span>
                                    {item.progressionConfig?.enabled && (
                                      <span style={{
                                        background: '#f0fdf4',
                                        color: '#166534',
                                        border: '1px solid #bbf7d0',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontSize: '9.5px',
                                        fontWeight: 800
                                      }}>
                                        🎯 {item.progressionConfig.easyCount || 0}E / {item.progressionConfig.mediumCount || 0}M / {item.progressionConfig.hardCount || 0}H
                                      </span>
                                    )}
                                  </div>
                                  {item.templateLevels && (
                                    <small style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      ⚡ Levels: {item.templateLevels.map(l => `L${l.level} (${l.templateIds ? l.templateIds.length : 0})`).join(', ')}
                                    </small>
                                  )}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '0.25rem' }}>
                                    <a 
                                      href={`/practice?subject=${item.subjectId || 'math'}&topic=${item.topicId || 'counting'}&skill=${item.id}${adminMode === 'iit' ? '&iit=true' : ''}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'underline', fontSize: '11px', display: 'inline-block' }}
                                    >
                                      🔗 Practice Test Link
                                    </a>
                                    {item.templateId && (
                                      <>
                                        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>|</span>
                                        <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, display: 'inline-flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                          Template ID:
                                          {(Array.isArray(item.templateId) ? item.templateId : [item.templateId]).map((tid, tIdx) => (
                                            <span key={tid} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              {tIdx > 0 && <span style={{ color: '#cbd5e1' }}>,</span>}
                                              <code style={{ color: '#6366f1', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                                                {tid}
                                              </code>
                                              <a 
                                                href={`/admin/templates?id=${encodeURIComponent(tid)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#6366f1', fontWeight: 800, textDecoration: 'none' }}
                                                title="Edit Template"
                                              >
                                                📝
                                              </a>
                                              <a 
                                                href={`/admin/vocabulary-pools?poolId=${encodeURIComponent(tid)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#0ea5e9', fontWeight: 800, textDecoration: 'none' }}
                                                title="Option Pool"
                                              >
                                                📦
                                              </a>
                                            </span>
                                          ))}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {/* Static / DB Questions Dropdown */}
                                  {item.questions && item.questions.length > 0 && (
                                    <div style={{ marginTop: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                                      <details style={{ cursor: 'pointer' }}>
                                        <summary style={{ fontSize: '11.5px', fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', listStyle: 'none' }}>
                                          <span>📋 {item.questions.length} Question{item.questions.length === 1 ? '' : 's'} in DB</span>
                                          <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>(Click to expand)</span>
                                        </summary>
                                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '11.5px', color: '#334155', listStyleType: 'disc', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                                          {item.questions.map((q) => (
                                            <li key={q.id} style={{ marginBottom: '6px', lineHeight: 1.4 }}>
                                              <span style={{ fontWeight: 800, color: '#1e293b', fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px', marginRight: '6px' }}>
                                                {q.id.split('-').pop()}
                                              </span>
                                              <span>{q.questionText}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </details>
                                    </div>
                                  )}
                                </div>
                              )}

                              {activeTab === 'question' && (
                                <div style={{ fontWeight: 500 }}>
                                  <div style={{ color: '#1e293b', fontSize: '13.5px', whiteSpace: 'pre-wrap', marginBottom: '6px', lineHeight: 1.4 }}>
                                    {item.questionText}
                                  </div>
                                  {item.questionImageUrl && (
                                    <div style={{ fontSize: '11.5px', color: '#0891b2', marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      🖼️ Diagram Attachment: <code>{item.questionImageUrl}</code>
                                    </div>
                                  )}
                                  
                                  {/* Render options for K-12/IIT questions */}
                                  {Array.isArray(item.options) && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '8px' }}>
                                      {item.options.map((opt, oIdx) => (
                                        <span key={oIdx} style={{ background: opt.isCorrect ? '#ecfdf5' : '#f8fafc', color: opt.isCorrect ? '#16a34a' : '#64748b', border: '1px solid ' + (opt.isCorrect ? '#a7f3d0' : '#e2e8f0'), padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: opt.isCorrect ? 800 : 500 }}>
                                          {String.fromCharCode(65 + oIdx)}. {opt.label}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                    <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                      🎯 Diff: {item.difficulty}
                                    </span>
                                    {item.metadata?.isStatic !== false && (
                                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                        📋 Static Flow
                                      </span>
                                    )}
                                    {item.metadata?.branching && (
                                      <span style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                        🌿 Branching: {item.metadata.branching.correct} / {item.metadata.branching.incorrect}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {adminMode === 'exam' && (
                            <>
                              {activeTab === 'exam' && (
                                <>
                                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b' }}>{item.icon || '🏫'} {item.name}</div>
                                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>{item.fullName}</div>
                                  <div style={{ color: '#94a3b8', fontWeight: 500, fontSize: '11px', marginTop: '4px' }}>{item.description}</div>
                                </>
                              )}

                              {activeTab === 'section' && (
                                <>
                                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b' }}>{item.icon || '📝'} {item.name}</div>
                                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: '11.5px', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>Short: <code>{item.shortName}</code></span>
                                    <span>•</span>
                                    <span>Questions: <code>{item.questionCount}</code></span>
                                    <span>•</span>
                                    <span>Marks: <code>{item.maxMarks}</code></span>
                                    <span>•</span>
                                    <span>Time: <code>{item.timeLimitMinutes} mins</code></span>
                                  </div>
                                  <div style={{ color: '#94a3b8', fontWeight: 500, fontSize: '11px', marginTop: '4px' }}>{item.description}</div>
                                </>
                              )}

                              {activeTab === 'topic' && (
                                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                                  🏷️ {item.name}
                                </div>
                              )}

                              {activeTab === 'skill' && (
                                <>
                                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b' }}>⚡ {item.name || item.title}</div>
                                  <div style={{ margin: '8px 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {item.templateIds?.map(tid => (
                                      <div key={tid} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
                                        <span style={{ color: '#475569' }}>{tid}</span>
                                        <a 
                                          href={`/admin/templates?id=${encodeURIComponent(tid)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: '#6366f1', fontWeight: 800, textDecoration: 'none', marginLeft: '2px' }}
                                          title="Edit Template"
                                        >
                                          📝
                                        </a>
                                        <a 
                                          href={`/admin/vocabulary-pools?poolId=${encodeURIComponent(tid)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: '#0ea5e9', fontWeight: 800, textDecoration: 'none' }}
                                          title="Option Pool"
                                        >
                                          📦
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: '11.5px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>Engine: <code>{item.type}</code></span>
                                    <span>•</span>
                                    <span>Difficulty: <code>{item.difficulty}</code></span>
                                    <span>•</span>
                                    <span>Status: <span style={{ color: item.status === 'active' ? '#16a34a' : '#ef4444', fontWeight: 800 }}>{item.status || 'active'}</span></span>
                                  </div>
                                  <a 
                                    href={`/exam-prep/${selectedExamId}/practice/${selectedSectionId}?userId=guest_child&topic=${selectedTopicId}&templateId=${item.templateIds?.join(',')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#0891b2', fontWeight: 800, textDecoration: 'underline', fontSize: '11.5px', display: 'inline-block', marginTop: '0.4rem' }}
                                  >
                                    🔗 Practice Combined Skill ({item.templateIds?.length} templates)
                                  </a>
                                </>
                              )}

                              {activeTab === 'question' && (
                                <div style={{ fontWeight: 500 }}>
                                  <div style={{ color: '#1e293b', fontSize: '13.5px', whiteSpace: 'pre-wrap', marginBottom: '6px', lineHeight: 1.4 }}>
                                    {item.questionText}
                                  </div>
                                  {item.questionImageUrl && (
                                    <div style={{ fontSize: '11.5px', color: '#0891b2', marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      🖼️ Diagram Attachment: <code>{item.questionImageUrl}</code>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                    {item.cognitiveLevel && (
                                      <span style={{ background: '#fffbeb', color: '#ca8a04', border: '1px solid #fef08a', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                                        🧠 {item.cognitiveLevel}
                                      </span>
                                    )}
                                    <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                      🎯 Diff: {item.difficulty}
                                    </span>
                                    {item.isPYQ && (
                                      <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                        📅 PYQ {item.pyqYear ? `'${String(item.pyqYear).slice(-2)}` : ''}
                                      </span>
                                    )}
                                    {item.metadata?.source && (
                                      <span style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                        🏷️ {item.metadata.source}
                                      </span>
                                    )}
                                    {item.drillTemplateId && (
                                      <span style={{ background: '#ecfdf4', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                                        🎯 Drill: {item.drillTemplateId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </td>

                        {/* Order Column */}
                        {(adminMode === 'school' || adminMode === 'iit') && (
                          <td style={{ padding: '1rem 0.75rem', fontSize: '14px', color: '#475569', fontWeight: 700, verticalAlign: 'middle' }}>
                            {item.order}
                          </td>
                        )}

                        {/* Actions column */}
                        <td style={{ padding: '1rem 0.75rem', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {activeTab === 'question' && (
                              <button
                                onClick={() => handleAiGridGenerate(item)}
                                disabled={loading || generatingStates[item.id || item._id]}
                                style={{
                                  background: '#f3e8ff',
                                  color: '#6b21a8',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  opacity: generatingStates[item.id || item._id] ? 0.7 : 1,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {generatingStates[item.id || item._id] ? '⏳...' : '🪄 AI Grid'}
                              </button>
                            )}
                            {activeTab === 'question' && item.drillTemplateId && (
                              <button
                                onClick={() => {
                                  const section = item.section || selectedSectionId || 'arithmetic';
                                  const url = `/exam-prep/${selectedExamId || 'jnvst'}/practice/${section}?templateId=${item.drillTemplateId}&userId=guest_child`;
                                  window.open(url, '_blank');
                                }}
                                style={{
                                  background: '#d1fae5',
                                  color: '#065f46',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                🧪 Test
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(item)}
                              disabled={loading}
                              style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(rowId)}
                              disabled={loading}
                              style={{
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </section>
        )}
      </div>
      )}
    </div>
  );
}

// Styling tokens
const guideStyle = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '1rem',
  marginBottom: '1.25rem',
  fontSize: '0.85rem',
  color: '#1e3a8a',
};

const examGuideStyle = {
  background: '#ecfeff',
  border: '1px solid #a5f3fc',
  borderRadius: '10px',
  padding: '1rem',
  marginBottom: '1.25rem',
  fontSize: '0.85rem',
  color: '#083344',
};
