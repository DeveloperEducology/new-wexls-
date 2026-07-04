'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminV2Page() {
  const [adminMode, setAdminMode] = useState('school'); // school, exam
  const [activeTab, setActiveTab] = useState('grade'); // school: grade, subject, unit, chapter, skill. exam: exam, section, topic, skill, question
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // ID of the node currently being edited

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
        const res = await fetch(`/api/v2/curriculum?type=${type}`);
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
    if (!selectedExamId) return;
    try {
      let url = `/api/admin/questions?examId=${selectedExamId}`;
      if (selectedSectionId) url += `&section=${selectedSectionId}`;
      if (selectedTopicId) url += `&topic=${selectedTopicId}`;
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
  }, []);

  useEffect(() => {
    if (adminMode === 'exam' && activeTab === 'question') {
      fetchQuestions();
    }
  }, [adminMode, activeTab, selectedExamId, selectedSectionId, selectedTopicId]);

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
    if (!confirm('Are you sure you want to seed default v2 curriculum data? This will overwrite or append default LKG/UKG structures.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v2/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seed' }),
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
    
    if (adminMode === 'school') {
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
      } else if (activeTab === 'question') {
        setFormData({
          id: item._id || item.id || '',
          questionText: item.questionText || '',
          questionImageUrl: item.questionImageUrl || '',
          optionA: item.options?.A || '',
          optionB: item.options?.B || '',
          optionC: item.options?.C || '',
          optionD: item.options?.D || '',
          correctOption: item.correctOption || 'A',
          explanationText: item.explanationText || '',
          isPYQ: Boolean(item.isPYQ),
          pyqYear: item.pyqYear || '',
          difficulty: item.difficulty || 0.5,
          cognitiveLevel: item.cognitiveLevel || 'recall',
          tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
          metadataSource: item.metadata?.source || '',
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

    if (adminMode === 'school') {
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
        payloadData.remediation = formData.remediation
          ? formData.remediation.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        
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
        const res = await fetch('/api/v2/curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: activeTab,
            data: payloadData,
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
        } else if (activeTab === 'question') {
          if (!selectedExamId || !selectedSectionId || !selectedTopicId) {
            setError('Please select Exam, Section, and Topic for the question first.');
            setLoading(false);
            return;
          }

          const payload = {
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
            explanationText: formData.explanationText,
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
        }
      } catch (err) {
        setError(err.message || 'API connection error.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab}?`)) return;
    setLoading(true);
    try {
      if (adminMode === 'school') {
        const res = await fetch(`/api/v2/curriculum?type=${activeTab}&id=${id}`, {
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
    setActiveTab(mode === 'school' ? 'grade' : 'exam');
  };

  // Resolve collections displays
  const getActiveList = () => {
    if (adminMode === 'school') {
      switch (activeTab) {
        case 'grade': return grades;
        case 'subject': return subjects;
        case 'unit': return units;
        case 'chapter': return chapters;
        case 'skill': return skills;
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
        case 'question': return examQuestions;
        default: return [];
      }
    }
  };

  const currentList = getActiveList();

  // Render guides
  const renderGuide = () => {
    if (adminMode === 'school') {
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
        default:
          return null;
      }
    }
  };

  return (
    <div style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      fontFamily: 'Outfit, Inter, system-ui, sans-serif',
      color: '#1e293b',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            🛠️ Curriculum Builder V2
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '15px' }}>
            Manage School K-12 and Competitive Exam prep collections dynamically.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '10px', padding: '4px' }}>
            <button
              onClick={() => handleModeToggle('school')}
              style={{
                border: 'none',
                background: adminMode === 'school' ? '#ffffff' : 'transparent',
                color: adminMode === 'school' ? '#4f46e5' : '#475569',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: adminMode === 'school' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              🏫 School K-12
            </button>
            <button
              onClick={() => handleModeToggle('exam')}
              style={{
                border: 'none',
                background: adminMode === 'exam' ? '#ffffff' : 'transparent',
                color: adminMode === 'exam' ? '#0891b2' : '#475569',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: adminMode === 'exam' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              🎓 Exam Prep
            </button>
          </div>
          {adminMode === 'school' && (
            <button 
              onClick={handleSeed}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #7a56d6, #6366f1)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              🌱 Seed V2 Data
            </button>
          )}
          <Link 
            href={adminMode === 'school' ? '/grades-v2' : '/exam-prep'}
            target="_blank"
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            👁️ Preview Client
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #cbd5e1' }}>
        {(adminMode === 'school' 
          ? ['grade', 'subject', 'unit', 'chapter', 'skill']
          : ['exam', 'section', 'topic', 'skill', 'question']
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              color: activeTab === tab ? (adminMode === 'school' ? '#2563eb' : '#0891b2') : '#64748b',
              borderBottom: activeTab === tab ? `3px solid ${adminMode === 'school' ? '#2563eb' : '#0891b2'}` : '3px solid transparent',
              marginBottom: '-1px',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'exam' ? 'Exams' : tab === 'mat' ? 'MAT' : tab + 's'}
          </button>
        ))}
      </nav>

      {/* Exam Mode Filters (displayed as dropdown select bar above list view) */}
      {adminMode === 'exam' && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🔍 Hierarchy Scope:
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Exam</label>
            <select
              value={selectedExamId}
              onChange={e => {
                setSelectedExamId(e.target.value);
                setSelectedSectionId('');
                setSelectedTopicId('');
              }}
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="">-- All Exams --</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Section</label>
            <select
              value={selectedSectionId}
              disabled={!selectedExamId}
              onChange={e => {
                setSelectedSectionId(e.target.value);
                setSelectedTopicId('');
              }}
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="">-- All Sections --</option>
              {exams.find(e => e.id === selectedExamId)?.sections?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Topic</label>
            <select
              value={selectedTopicId}
              disabled={!selectedSectionId}
              onChange={e => setSelectedTopicId(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="">-- All Topics --</option>
              {exams.find(e => e.id === selectedExamId)?.sections?.find(s => s.id === selectedSectionId)?.topics?.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error block */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Work Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem' }}>
        
        {/* Creation Panel */}
        <section style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          alignSelf: 'start',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: 900, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
            {editingId ? 'Edit' : 'Create New'} {activeTab}
          </h2>
          
          {/* Guide Card */}
          {renderGuide()}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* SCHOOL MODE FORM FIELDS */}
            {adminMode === 'school' && (
              <>
                {/* Common field: ID */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Unique ID (Slug)</label>
                  <input 
                    type="text" 
                    name="id" 
                    disabled={!!editingId}
                    value={formData.id} 
                    onChange={handleInputChange}
                    placeholder="e.g. lkg-math-counting"
                    style={{ 
                      padding: '0.6rem', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '6px',
                      background: editingId ? '#f1f5f9' : '#fff',
                      cursor: editingId ? 'not-allowed' : 'text',
                    }}
                  />
                  <small style={{ color: '#94a3b8' }}>
                    {editingId ? 'ID cannot be renamed once created.' : 'Leave blank to auto-generate from title'}
                  </small>
                </div>

                {/* Common field: Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Title / Name</label>
                  <input 
                    type="text" 
                    name="title" 
                    required
                    value={formData.title} 
                    onChange={handleInputChange}
                    placeholder={`e.g. My New ${activeTab}`}
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>

                {/* Subject Specific: Icon */}
                {activeTab === 'subject' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Emoji Icon</label>
                    <input 
                      type="text" 
                      name="icon" 
                      value={formData.icon} 
                      onChange={handleInputChange}
                      placeholder="e.g. 🧮"
                      style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                )}

                {/* Unit Specific: Subject Dropdown */}
                {activeTab === 'unit' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Subject</label>
                    <select 
                      name="subjectId" 
                      required
                      value={formData.subjectId} 
                      onChange={handleInputChange}
                      style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                )}

                {/* Chapter Specific: Unit & Grade Dropdowns */}
                {activeTab === 'chapter' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Unit (Topic)</label>
                      <select 
                        name="unitId" 
                        required
                        value={formData.unitId} 
                        onChange={handleInputChange}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="">-- Select Unit --</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Grade</label>
                      <select 
                        name="gradeId" 
                        required
                        value={formData.gradeId} 
                        onChange={handleInputChange}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="">-- Select Grade --</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Skill Specific: Chapter, Code, Template, Engine */}
                {activeTab === 'skill' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Chapter</label>
                      <select 
                        name="chapterId" 
                        required
                        value={formData.chapterId} 
                        onChange={handleInputChange}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="">-- Select Chapter --</option>
                        {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Skill Code</label>
                      <input 
                        type="text" 
                        name="code" 
                        required
                        value={formData.code} 
                        onChange={handleInputChange}
                        placeholder="e.g. A.1"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div className="suggestion-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Template ID</label>
                      <input 
                        type="text" 
                        name="templateId" 
                        required
                        value={formData.templateId} 
                        onChange={(e) => {
                          handleInputChange(e);
                          setActiveSuggestionBox('primary');
                        }}
                        onFocus={() => setActiveSuggestionBox('primary')}
                        placeholder="e.g. fractions-g5-add-like-fractions"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                      {renderSuggestions(
                        formData.templateId, 
                        (tid) => setFormData(prev => ({ ...prev, templateId: tid })), 
                        'primary'
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Engine</label>
                      <input 
                        type="text" 
                        name="engine" 
                        required
                        value={formData.engine} 
                        onChange={handleInputChange}
                        placeholder="e.g. StickersEngine"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    {/* Difficulty Scaling */}
                    <div style={{ marginTop: '4px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
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
                              <div key={level} style={{ border: `1px solid ${border}`, borderRadius: '8px', background: '#fff', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>{label}</span>
                                  <span style={{ background: badge, color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '11px' }}>
                                    {levelData.templateIds.length} tpl
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '28px', marginBottom: '8px' }}>
                                  {levelData.templateIds.length === 0 && (
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>No templates</span>
                                  )}
                                  {levelData.templateIds.map((tid, ti) => (
                                    <span key={ti} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                                      background: color, border: `1px solid ${border}`, borderRadius: '6px',
                                      padding: '2px 8px', fontSize: '11px', fontWeight: 600
                                    }}>
                                      {tid}
                                      <button
                                        type="button"
                                        onClick={() => setSkillTemplateLevels(prev => prev.map(l =>
                                          l.level === level
                                            ? { ...l, templateIds: l.templateIds.filter((_, i) => i !== ti) }
                                            : l
                                        ))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 900 }}
                                      >×</button>
                                    </span>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                                  <div className="suggestion-container" style={{ flex: 1, position: 'relative' }}>
                                    <input
                                      type="text"
                                      style={{ width: '100%', fontSize: '12px', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                                      placeholder="Template ID"
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
                                    style={{ fontSize: '11px', padding: '4px 10px', background: badge, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Common field: Order */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Order / Sort Rank</label>
                  <input 
                    type="number" 
                    name="order" 
                    value={formData.order} 
                    onChange={handleInputChange}
                    style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  />
                </div>
              </>
            )}

            {/* EXAM MODE FORM FIELDS */}
            {adminMode === 'exam' && (
              <>
                {/* 1. Exam Tab */}
                {activeTab === 'exam' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Exam ID (e.g. jnvst)</label>
                      <input 
                        type="text" 
                        name="id" 
                        disabled={!!editingId}
                        required
                        value={formData.id} 
                        onChange={handleInputChange}
                        placeholder="e.g. jnvst"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: editingId ? '#f1f5f9' : '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Short Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required
                        value={formData.name} 
                        onChange={handleInputChange}
                        placeholder="e.g. JNVST"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Full Name</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        required
                        value={formData.fullName} 
                        onChange={handleInputChange}
                        placeholder="e.g. Jawahar Navodaya Vidyalaya Selection Test"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Description</label>
                      <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleInputChange}
                        placeholder="Description of exam details..."
                        rows={3}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
                      />
                    </div>
                  </>
                )}

                {/* 2. Section Tab */}
                {activeTab === 'section' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Section ID (Slug)</label>
                      <input 
                        type="text" 
                        name="sectionId" 
                        disabled={!!editingId}
                        required
                        value={formData.sectionId} 
                        onChange={handleInputChange}
                        placeholder="e.g. arithmetic"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: editingId ? '#f1f5f9' : '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Section Name</label>
                      <input 
                        type="text" 
                        name="sectionName" 
                        required
                        value={formData.sectionName} 
                        onChange={handleInputChange}
                        placeholder="e.g. Arithmetic Test"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Short Display Name</label>
                      <input 
                        type="text" 
                        name="shortName" 
                        value={formData.shortName} 
                        onChange={handleInputChange}
                        placeholder="e.g. Arithmetic"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Emoji Icon</label>
                      <input 
                        type="text" 
                        name="icon" 
                        value={formData.icon} 
                        onChange={handleInputChange}
                        placeholder="e.g. 🔢"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Qn Count</label>
                        <input 
                          type="number" 
                          name="questionCount" 
                          value={formData.questionCount} 
                          onChange={handleInputChange}
                          style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Max Marks</label>
                        <input 
                          type="number" 
                          name="maxMarks" 
                          value={formData.maxMarks} 
                          onChange={handleInputChange}
                          style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Time (Min)</label>
                        <input 
                          type="number" 
                          name="timeLimitMinutes" 
                          value={formData.timeLimitMinutes} 
                          onChange={handleInputChange}
                          style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Description</label>
                      <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleInputChange}
                        placeholder="Description of section..."
                        rows={2}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
                      />
                    </div>
                  </>
                )}

                {/* 3. Topic Tab */}
                {activeTab === 'topic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Topic ID / Name (Slug)</label>
                    <input 
                      type="text" 
                      name="topicId" 
                      required
                      value={formData.topicId} 
                      onChange={handleInputChange}
                      placeholder="e.g. fractions"
                      style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                  </div>
                )}

                {/* 3.5. Skill (Template) Tab */}
                {activeTab === 'skill' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Template ID / Unique Code</label>
                      <input 
                        type="text" 
                        name="id" 
                        disabled={!!editingId}
                        required
                        value={formData.id} 
                        onChange={handleInputChange}
                        placeholder="e.g. fractions-g5-add-unlike"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: editingId ? '#f1f5f9' : '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Skill Name / Display Title</label>
                      <input 
                        type="text" 
                        name="title" 
                        required
                        value={formData.title} 
                        onChange={handleInputChange}
                        placeholder="e.g. Add Unlike Fractions"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Template Engine / Type</label>
                      <select 
                        name="engine" 
                        value={formData.engine || 'parameterized'} 
                        onChange={handleInputChange}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="parameterized">Parameterized Question Generator</option>
                        <option value="svg-figure">SVG/Geometry Figure Generator</option>
                        <option value="visual-transformation">Visual Grid/Fraction Block Transformation</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Difficulty (0.0 - 1.0)</label>
                      <input 
                        type="number" 
                        step="0.05" 
                        min="0" 
                        max="1" 
                        name="difficulty" 
                        value={formData.difficulty} 
                        onChange={handleInputChange} 
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Status</label>
                      <select 
                        name="status" 
                        value={formData.status || 'active'} 
                        onChange={handleInputChange}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}

                {/* 4. Question Tab */}
                {activeTab === 'question' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Question Text</label>
                      <textarea 
                        name="questionText" 
                        required
                        value={formData.questionText} 
                        onChange={handleInputChange}
                        placeholder="Enter question content (supports LaTeX & Markdown)"
                        rows={3}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Diagram / Image URL</label>
                      <input 
                        type="text" 
                        name="questionImageUrl" 
                        value={formData.questionImageUrl} 
                        onChange={handleInputChange}
                        placeholder="e.g. /images/diagram.png"
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Option A</label>
                        <input type="text" name="optionA" required value={formData.optionA} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Option B</label>
                        <input type="text" name="optionB" required value={formData.optionB} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Option C</label>
                        <input type="text" name="optionC" required value={formData.optionC} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Option D</label>
                        <input type="text" name="optionD" required value={formData.optionD} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Correct Option</label>
                        <select name="correctOption" value={formData.correctOption} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Cognitive Level</label>
                        <select name="cognitiveLevel" value={formData.cognitiveLevel} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                          <option value="recall">Recall</option>
                          <option value="comprehension">Comprehension</option>
                          <option value="application">Application</option>
                          <option value="analytical">Analytical</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        <input type="checkbox" name="isPYQ" checked={formData.isPYQ} onChange={handleInputChange} />
                        Is Previous Year Question (PYQ)
                      </label>
                      {formData.isPYQ && (
                        <input 
                          type="number" 
                          name="pyqYear" 
                          placeholder="Year (e.g. 2023)" 
                          value={formData.pyqYear} 
                          onChange={handleInputChange} 
                          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '90px', fontSize: '12px' }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Difficulty (0.0 - 1.0)</label>
                        <input type="number" step="0.05" min="0" max="1" name="difficulty" value={formData.difficulty} onChange={handleInputChange} style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Source tag</label>
                        <input type="text" name="metadataSource" value={formData.metadataSource} onChange={handleInputChange} placeholder="e.g. PYQ-2023" style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Explanation Text</label>
                      <textarea 
                        name="explanationText" 
                        value={formData.explanationText} 
                        onChange={handleInputChange}
                        placeholder="Detail explanation steps..."
                        rows={2}
                        style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Comma-separated tags</label>
                      <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} placeholder="e.g. geometry, symmetry" style={{ padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  flex: 1,
                  background: editingId ? '#16a34a' : (adminMode === 'school' ? '#2563eb' : '#0891b2'),
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                }}
              >
                {loading ? 'Processing...' : editingId ? `Update ${activeTab}` : `Create ${activeTab}`}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  style={{
                    background: '#64748b',
                    color: '#fff',
                    border: 'none',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List Viewer Panel */}
        <section style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: 900, textTransform: 'capitalize', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', letterSpacing: '-0.01em' }}>
            Current {activeTab === 'exam' ? 'Exams' : activeTab === 'mat' ? 'MAT' : activeTab + 's'} List ({currentList.length})
          </h2>
          
          {currentList.length === 0 ? (
            <p style={{ color: '#94a3b8', margin: '2rem 0', textAlign: 'center', fontSize: '14px' }}>
              No items matching scope filters.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID/Target</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Info / Content</th>
                    {adminMode === 'school' && (
                      <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order</th>
                    )}
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((item, idx) => {
                    const rowId = item.id || item._id || `row-${idx}`;
                    return (
                      <tr key={rowId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', fontFamily: 'monospace', color: '#0f172a', fontWeight: 700 }}>
                          {adminMode === 'exam' && activeTab === 'skill' ? (
                            <>
                              <span style={{ display: 'block', background: '#f0fdf4', color: '#15803d', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', fontSize: '9.5px', fontWeight: 800 }}>
                                📑 {item.templateIds?.length} {item.templateIds?.length === 1 ? 'Template' : 'Templates'}
                              </span>
                            </>
                          ) : adminMode === 'exam' && activeTab === 'question' ? (
                            <>
                              <span style={{ display: 'block', background: '#eef2ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', fontSize: '9px', fontWeight: 800, marginBottom: '4px' }}>
                                {item.examId?.toUpperCase()}
                              </span>
                              <span style={{ display: 'block', background: '#ecfeff', color: '#0891b2', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', fontSize: '9px', fontWeight: 800 }}>
                                {item.section}
                              </span>
                            </>
                          ) : (
                            rowId
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '13.5px', fontWeight: 600 }}>
                          {adminMode === 'school' && (
                            <>
                              {activeTab === 'subject' && (item.icon ? `${item.icon} ` : '📚 ')}
                              {item.title}
                              {activeTab === 'unit' && <small style={{ display: 'block', color: '#94a3b8', fontWeight: 400 }}>Subject: {item.subjectId}</small>}
                              {activeTab === 'chapter' && <small style={{ display: 'block', color: '#94a3b8', fontWeight: 400 }}>Unit: {item.unitId} | Grade: {item.gradeId}</small>}
                              {activeTab === 'skill' && (
                                <>
                                  <small style={{ display: 'block', color: '#94a3b8', fontWeight: 400 }}>Chapter: {item.chapterId} | Code: {item.code}</small>
                                  {item.templateLevels && (
                                    <small style={{ display: 'block', color: '#16a34a', fontWeight: 700 }}>
                                      ⚡ Levels: {item.templateLevels.map(l => `L${l.level} (${l.templateIds ? l.templateIds.length : 0})`).join(', ')}
                                    </small>
                                  )}
                                  <a 
                                    href={`/practice?subject=${item.subjectId || 'math'}&topic=${item.topicId || 'counting'}&skill=${item.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '11px', display: 'inline-block', marginTop: '0.25rem' }}
                                  >
                                    🔗 Test URL
                                  </a>
                                </>
                              )}
                            </>
                          )}

                          {adminMode === 'exam' && (
                            <>
                              {activeTab === 'exam' && (
                                <>
                                  <div style={{ fontSize: '14.5px', fontWeight: 800 }}>{item.icon || '🏫'} {item.name}</div>
                                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '12px' }}>{item.fullName}</div>
                                  <div style={{ color: '#94a3b8', fontWeight: 400, fontSize: '11px', marginTop: '2px' }}>{item.description}</div>
                                </>
                              )}

                              {activeTab === 'section' && (
                                <>
                                  <div style={{ fontSize: '14.5px', fontWeight: 800 }}>{item.icon || '📝'} {item.name}</div>
                                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '11px' }}>
                                    Short: {item.shortName} | Qs: {item.questionCount} | Marks: {item.maxMarks} | Time: {item.timeLimitMinutes} min
                                  </div>
                                  <div style={{ color: '#94a3b8', fontWeight: 400, fontSize: '11px', marginTop: '2px' }}>{item.description}</div>
                                </>
                              )}

                              {activeTab === 'topic' && (
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>
                                  🏷️ {item.name}
                                </div>
                              )}

                              {activeTab === 'skill' && (
                                <>
                                  <div style={{ fontSize: '14.5px', fontWeight: 800 }}>⚡ {item.name || item.title}</div>
                                  <div style={{ margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {item.templateIds?.map(tid => (
                                      <span key={tid} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '4px', padding: '2px 6px', fontSize: '10.5px', fontFamily: 'monospace' }}>
                                        <code>{tid}</code>
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ color: '#64748b', fontWeight: 500, fontSize: '11.5px' }}>
                                    Type: <code>{item.type}</code> | Diff: <code>{item.difficulty}</code> | Status: <span style={{ color: item.status === 'active' ? '#16a34a' : '#ef4444', fontWeight: 700 }}>{item.status || 'active'}</span>
                                  </div>
                                  <a 
                                    href={`/exam-prep/${selectedExamId}/practice/${selectedSectionId}?userId=guest_child&topic=${selectedTopicId}&templateId=${item.templateIds?.join(',')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#0891b2', textDecoration: 'underline', fontSize: '11.5px', fontWeight: 'bold', display: 'inline-block', marginTop: '0.35rem' }}
                                  >
                                    🔗 Practice Combined Skill ({item.templateIds?.length} templates)
                                  </a>
                                </>
                              )}

                              {activeTab === 'question' && (
                                <div style={{ fontWeight: 500 }}>
                                  <div style={{ color: '#1e293b', fontSize: '13px', whiteSpace: 'pre-wrap', marginBottom: '4px' }}>
                                    {item.questionText}
                                  </div>
                                  {item.questionImageUrl && (
                                    <div style={{ fontSize: '11px', color: '#0891b2', marginBottom: '4px' }}>
                                      🖼️ Image: <code>{item.questionImageUrl}</code>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {item.cognitiveLevel && (
                                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                                        🧠 {item.cognitiveLevel}
                                      </span>
                                    )}
                                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                                      🎯 Diff: {item.difficulty}
                                    </span>
                                    {item.isPYQ && (
                                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                                        📅 PYQ {item.pyqYear ? `'${String(item.pyqYear).slice(-2)}` : ''}
                                      </span>
                                    )}
                                    {item.metadata?.source && (
                                      <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 800 }}>
                                        🏷️ {item.metadata.source}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        {adminMode === 'school' && (
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: '#475569' }}>{item.order}</td>
                        )}
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleEditClick(item)}
                              disabled={loading}
                              style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '4px',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(rowId)}
                              disabled={loading}
                              style={{
                                background: '#fee2e2',
                                color: '#ef4444',
                                border: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '4px',
                                fontWeight: 800,
                                fontSize: '11px',
                                cursor: 'pointer',
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

      </div>
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
